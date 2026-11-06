// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {SafeERC20} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";
import {Pausable} from "@openzeppelin/contracts/utils/Pausable.sol";
import {ReentrancyGuard} from "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

interface IPriceOracle {
    function getPrice() external view returns (uint256 price, uint64 publishTime, uint8 session);
}

/// @title InventoryMarket
/// @notice Swaps USDC (6 dec) <-> wNVDA (18 dec) at an oracle price plus/minus a spread, against
///         pre-positioned inventory (ADR 0014). Oracle price is USD per whole token, 8 decimals.
/// @dev Price risk is borne by the inventory holder (owner). Testnet demo only.
contract InventoryMarket is Ownable, Pausable, ReentrancyGuard {
    using SafeERC20 for IERC20;

    uint256 private constant BPS = 10_000;
    // wNVDA wei per USDC unit at price 1.00000000: 1e18 / 1e6 * 1e8 = 1e20
    uint256 private constant SCALE = 1e20;
    uint256 public constant MAX_SPREAD_BPS = 2000;

    IERC20 public immutable usdc; // 6 decimals
    IERC20 public immutable wnvda; // 18 decimals
    IPriceOracle public oracle;

    // Session ids match PriceOracle.Session: 0 closed, 1 regular, 2 pre, 3 post, 4 overnight.
    uint256[5] public sessionSpreadBps;
    uint256[5] public sessionCapBps; // share of maxTradeUsdc allowed in the session; 0 = session closed
    uint256 public maxTradeUsdc; // USDC (6 dec) per trade at 100% cap
    uint256 public maxExposureUsdc; // |net USDC taken in on buys minus paid out on sells|
    uint256 public minInventory; // wNVDA (18 dec) that a buy may not dip below
    uint256 public minUsdcReserve; // USDC (6 dec) that a sell may not dip below
    bool public offHoursTrading; // demo mode: allow session 0 (closed) at its own spread/cap

    /// Cumulative USDC received on buys minus USDC paid on sells. Positive = pool is short stock.
    int256 public netUsdcFlow;

    event Bought(address indexed trader, uint256 usdcIn, uint256 wnvdaOut, uint256 price, uint256 spreadBps, uint8 session);
    event Sold(address indexed trader, uint256 wnvdaIn, uint256 usdcOut, uint256 price, uint256 spreadBps, uint8 session);
    event InventoryDeposited(address indexed token, address indexed from, uint256 amount);
    event InventoryWithdrawn(address indexed token, address indexed to, uint256 amount);
    event SessionParamsSet(uint8 indexed session, uint256 spreadBps, uint256 capBps);
    event LimitsSet(uint256 maxTradeUsdc, uint256 maxExposureUsdc, uint256 minInventory, uint256 minUsdcReserve);
    event OffHoursTradingSet(bool on);
    event OracleSet(address oracle);
    event ExposureReset();

    error ZeroAmount();
    error SessionClosed(uint8 session);
    error TradeTooLarge(uint256 usdcValue, uint256 cap);
    error ExposureExceeded(int256 newFlow, uint256 maxExposure);
    error InventoryShort(uint256 available, uint256 needed);
    error SlippageExceeded(uint256 out, uint256 minOut);
    error InvalidParam();
    error WrongToken();

    constructor(address owner_, IERC20 usdc_, IERC20 wnvda_, IPriceOracle oracle_) Ownable(owner_) {
        if (address(usdc_) == address(0) || address(wnvda_) == address(0) || address(oracle_) == address(0)) {
            revert InvalidParam();
        }
        usdc = usdc_;
        wnvda = wnvda_;
        oracle = oracle_;
        // defaults per ADR 0015: base 30 bps; extended hours 3x with 25% cap; closed (demo) 200 bps, 10% cap
        sessionSpreadBps = [uint256(200), 30, 90, 90, 90];
        sessionCapBps = [uint256(1000), 10_000, 2500, 2500, 2500];
        maxTradeUsdc = 100e6;
        maxExposureUsdc = 1_000e6;
    }

    // ------------------------------------------------------------------ trading

    /// @notice Pay `usdcIn` USDC, receive wNVDA at the ask. Needs prior USDC approval.
    function buy(uint256 usdcIn, uint256 minWnvdaOut) external nonReentrant whenNotPaused returns (uint256 wnvdaOut) {
        uint256 price;
        uint256 spread;
        uint8 session;
        (wnvdaOut, price, spread, session) = _quoteBuy(usdcIn);
        if (wnvdaOut < minWnvdaOut) revert SlippageExceeded(wnvdaOut, minWnvdaOut);
        _bumpFlow(int256(usdcIn));

        usdc.safeTransferFrom(msg.sender, address(this), usdcIn);
        wnvda.safeTransfer(msg.sender, wnvdaOut);
        emit Bought(msg.sender, usdcIn, wnvdaOut, price, spread, session);
    }

    /// @notice Pay `wnvdaIn` wNVDA, receive USDC at the bid. Needs prior wNVDA approval.
    function sell(uint256 wnvdaIn, uint256 minUsdcOut) external nonReentrant whenNotPaused returns (uint256 usdcOut) {
        uint256 price;
        uint256 spread;
        uint8 session;
        (usdcOut, price, spread, session) = _quoteSell(wnvdaIn);
        if (usdcOut < minUsdcOut) revert SlippageExceeded(usdcOut, minUsdcOut);
        _bumpFlow(-int256(usdcOut));

        wnvda.safeTransferFrom(msg.sender, address(this), wnvdaIn);
        usdc.safeTransfer(msg.sender, usdcOut);
        emit Sold(msg.sender, wnvdaIn, usdcOut, price, spread, session);
    }

    // -------------------------------------------------------------------- quotes

    /// @notice wNVDA received for `usdcIn`. Reverts exactly as `buy` would (except for approval/slippage).
    function quoteBuy(uint256 usdcIn)
        external
        view
        returns (uint256 wnvdaOut, uint256 price, uint256 spreadBps, uint8 session)
    {
        (wnvdaOut, price, spreadBps, session) = _quoteBuy(usdcIn);
    }

    /// @notice USDC received for `wnvdaIn`. Reverts exactly as `sell` would (except for approval/slippage).
    function quoteSell(uint256 wnvdaIn)
        external
        view
        returns (uint256 usdcOut, uint256 price, uint256 spreadBps, uint8 session)
    {
        (usdcOut, price, spreadBps, session) = _quoteSell(wnvdaIn);
    }

    /// @notice Inventory and state for UIs. Does not revert on a stale oracle.
    function inventory() external view returns (uint256 wnvdaBalance, uint256 usdcBalance, int256 flow, bool isPaused) {
        return (wnvda.balanceOf(address(this)), usdc.balanceOf(address(this)), netUsdcFlow, paused());
    }

    function _params() internal view returns (uint256 price, uint256 spread, uint256 cap, uint8 session) {
        uint256 s;
        (price, , s) = oracle.getPrice(); // reverts if no price or stale outside demo mode
        if (s > 4) revert SessionClosed(uint8(s));
        session = uint8(s);
        cap = maxTradeUsdc * sessionCapBps[s] / BPS;
        if (cap == 0 || (s == 0 && !offHoursTrading)) revert SessionClosed(session);
        spread = sessionSpreadBps[s];
    }

    function _quoteBuy(uint256 usdcIn) internal view returns (uint256 out, uint256 price, uint256 spread, uint8 session) {
        if (usdcIn == 0) revert ZeroAmount();
        uint256 cap;
        (price, spread, cap, session) = _params();
        if (usdcIn > cap) revert TradeTooLarge(usdcIn, cap);
        // out[wei] = usdcIn * 1e20 / ask, ask = price * (1 + spread); rounds down (in the pool's favour)
        out = usdcIn * SCALE * BPS / (price * (BPS + spread));
        if (out == 0) revert ZeroAmount();
        uint256 bal = wnvda.balanceOf(address(this));
        if (bal < out + minInventory) revert InventoryShort(bal, out + minInventory);
    }

    function _quoteSell(uint256 wnvdaIn) internal view returns (uint256 out, uint256 price, uint256 spread, uint8 session) {
        if (wnvdaIn == 0) revert ZeroAmount();
        uint256 cap;
        (price, spread, cap, session) = _params();
        // out[usdc units] = wnvdaIn * bid / 1e20, bid = price * (1 - spread); rounds down
        out = wnvdaIn * price * (BPS - spread) / (SCALE * BPS);
        if (out == 0) revert ZeroAmount();
        if (out > cap) revert TradeTooLarge(out, cap);
        uint256 bal = usdc.balanceOf(address(this));
        if (bal < out + minUsdcReserve) revert InventoryShort(bal, out + minUsdcReserve);
    }

    function _bumpFlow(int256 delta) internal {
        int256 f = netUsdcFlow + delta;
        uint256 abs_ = f < 0 ? uint256(-f) : uint256(f);
        if (abs_ > maxExposureUsdc) revert ExposureExceeded(f, maxExposureUsdc);
        netUsdcFlow = f;
    }

    // --------------------------------------------------------------------- owner

    /// @notice Pull inventory from the owner. Anyone may also transfer tokens directly.
    function deposit(IERC20 token, uint256 amount) external onlyOwner {
        if (token != usdc && token != wnvda) revert WrongToken();
        if (amount == 0) revert ZeroAmount();
        token.safeTransferFrom(msg.sender, address(this), amount);
        emit InventoryDeposited(address(token), msg.sender, amount);
    }

    function withdraw(IERC20 token, uint256 amount, address to) external onlyOwner {
        if (amount == 0) revert ZeroAmount();
        if (to == address(0)) revert InvalidParam();
        token.safeTransfer(to, amount);
        emit InventoryWithdrawn(address(token), to, amount);
    }

    function pause() external onlyOwner {
        _pause();
    }

    function unpause() external onlyOwner {
        _unpause();
    }

    function setSessionParams(uint8 session, uint256 spreadBps, uint256 capBps) external onlyOwner {
        if (session > 4 || spreadBps >= MAX_SPREAD_BPS + 1 || capBps > BPS) revert InvalidParam();
        sessionSpreadBps[session] = spreadBps;
        sessionCapBps[session] = capBps;
        emit SessionParamsSet(session, spreadBps, capBps);
    }

    function setLimits(uint256 maxTradeUsdc_, uint256 maxExposureUsdc_, uint256 minInventory_, uint256 minUsdcReserve_)
        external
        onlyOwner
    {
        maxTradeUsdc = maxTradeUsdc_;
        maxExposureUsdc = maxExposureUsdc_;
        minInventory = minInventory_;
        minUsdcReserve = minUsdcReserve_;
        emit LimitsSet(maxTradeUsdc_, maxExposureUsdc_, minInventory_, minUsdcReserve_);
    }

    function setOffHoursTrading(bool on) external onlyOwner {
        offHoursTrading = on;
        emit OffHoursTradingSet(on);
    }

    function setOracle(IPriceOracle oracle_) external onlyOwner {
        if (address(oracle_) == address(0)) revert InvalidParam();
        oracle = oracle_;
        emit OracleSet(address(oracle_));
    }

    /// @notice Reset the exposure counter after the owner rebalances inventory.
    function resetExposure() external onlyOwner {
        netUsdcFlow = 0;
        emit ExposureReset();
    }
}

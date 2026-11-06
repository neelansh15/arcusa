// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";

/// @title PriceOracle
/// @notice Relayer-updated USD price for one asset (NVDA), 8 decimals, with guards (ADR 0004, 0015).
/// @dev The relayer is trusted; the price is not verified onchain. Testnet demo only.
contract PriceOracle is Ownable {
    /// Market session as reported by the price source. 0 = closed (only a last regular price exists).
    enum Session { Closed, Regular, PreMarket, PostMarket, Overnight }

    uint8 public constant DECIMALS = 8;
    uint256 public constant MAX_GAP_BPS_LIMIT = 5000; // owner cannot set a deviation cap above 50%
    uint256 public constant MAX_STALENESS_LIMIT = 7 days;

    struct Round {
        uint128 price; // USD per 1 whole asset, 8 decimals
        uint64 publishTime; // source timestamp (unix seconds)
        uint32 confidenceBps; // confidence interval / price, in bps (0 if the source gives none)
        Session session;
    }

    Round private _round;
    mapping(address => bool) public isRelayer;

    uint256 public maxStaleness; // seconds
    uint256 public maxConfidenceBps; // reject updates with wider confidence
    uint256 public maxDeviationBps; // per-update move cap unless a gap was accepted
    bool public demoMode; // true: stale prices are served (off-hours demo, ADR 0015)
    bool public gapAccepted; // owner armed one-shot override of the deviation cap

    event PriceUpdated(uint256 price, uint64 publishTime, Session session, uint32 confidenceBps, address indexed relayer);
    event RelayerSet(address indexed relayer, bool allowed);
    event DemoModeSet(bool demoMode);
    event MaxStalenessSet(uint256 maxStaleness);
    event GuardsSet(uint256 maxConfidenceBps, uint256 maxDeviationBps);
    event GapAccepted();

    error NotRelayer();
    error InvalidPrice();
    error ConfidenceTooWide(uint256 confidenceBps, uint256 maxBps);
    error PublishTimeNotIncreasing(uint64 publishTime, uint64 last);
    error PublishTimeInFuture(uint64 publishTime);
    error DeviationTooLarge(uint256 oldPrice, uint256 newPrice, uint256 maxBps);
    error NoPrice();
    error StalePrice(uint256 age, uint256 maxAge);
    error InvalidParam();

    constructor(address owner_, uint256 maxStaleness_) Ownable(owner_) {
        if (maxStaleness_ == 0 || maxStaleness_ > MAX_STALENESS_LIMIT) revert InvalidParam();
        maxStaleness = maxStaleness_;
        maxConfidenceBps = 100; // 1%
        maxDeviationBps = 1000; // 10%
        isRelayer[owner_] = true;
        emit RelayerSet(owner_, true);
    }

    // ---------------------------------------------------------------- relayer

    /// @notice Push a new price. Callable by the owner or a relayer.
    function updatePrice(uint256 price, uint64 publishTime, Session session, uint32 confidenceBps) external {
        if (!isRelayer[msg.sender] && msg.sender != owner()) revert NotRelayer();
        if (price == 0 || price > type(uint128).max) revert InvalidPrice();
        if (confidenceBps > maxConfidenceBps) revert ConfidenceTooWide(confidenceBps, maxConfidenceBps);
        if (publishTime > block.timestamp + 60) revert PublishTimeInFuture(publishTime);

        Round memory last = _round;
        if (last.publishTime != 0) {
            if (publishTime <= last.publishTime) revert PublishTimeNotIncreasing(publishTime, last.publishTime);
            if (!gapAccepted) {
                uint256 diff = price > last.price ? price - last.price : last.price - price;
                if (diff * 10_000 > uint256(last.price) * maxDeviationBps) {
                    revert DeviationTooLarge(last.price, price, maxDeviationBps);
                }
            }
        }
        gapAccepted = false;

        _round = Round(uint128(price), publishTime, confidenceBps, session);
        emit PriceUpdated(price, publishTime, session, confidenceBps, msg.sender);
    }

    // ------------------------------------------------------------------ views

    /// @notice Latest price, reverting if none or (outside demo mode) older than maxStaleness.
    function getPrice() external view returns (uint256 price, uint64 publishTime, Session session) {
        Round memory r = _round;
        if (r.publishTime == 0) revert NoPrice();
        uint256 age = block.timestamp > r.publishTime ? block.timestamp - r.publishTime : 0;
        if (!demoMode && age > maxStaleness) revert StalePrice(age, maxStaleness);
        return (r.price, r.publishTime, r.session);
    }

    /// @notice Latest stored round without any staleness check (for UIs).
    function latestRound()
        external
        view
        returns (uint256 price, uint64 publishTime, Session session, uint32 confidenceBps, uint256 age, bool stale)
    {
        Round memory r = _round;
        age = r.publishTime == 0 ? 0 : (block.timestamp > r.publishTime ? block.timestamp - r.publishTime : 0);
        stale = r.publishTime == 0 || age > maxStaleness;
        return (r.price, r.publishTime, r.session, r.confidenceBps, age, stale);
    }

    function decimals() external pure returns (uint8) {
        return DECIMALS;
    }

    // ------------------------------------------------------------------ admin

    function setRelayer(address relayer, bool allowed) external onlyOwner {
        isRelayer[relayer] = allowed;
        emit RelayerSet(relayer, allowed);
    }

    function setDemoMode(bool on) external onlyOwner {
        demoMode = on;
        emit DemoModeSet(on);
    }

    function setMaxStaleness(uint256 seconds_) external onlyOwner {
        if (seconds_ == 0 || seconds_ > MAX_STALENESS_LIMIT) revert InvalidParam();
        maxStaleness = seconds_;
        emit MaxStalenessSet(seconds_);
    }

    function setGuards(uint256 maxConfidenceBps_, uint256 maxDeviationBps_) external onlyOwner {
        if (maxConfidenceBps_ > 10_000 || maxDeviationBps_ == 0 || maxDeviationBps_ > MAX_GAP_BPS_LIMIT) {
            revert InvalidParam();
        }
        maxConfidenceBps = maxConfidenceBps_;
        maxDeviationBps = maxDeviationBps_;
        emit GuardsSet(maxConfidenceBps_, maxDeviationBps_);
    }

    /// @notice Arm a one-shot override so the next update may exceed the deviation cap (gap at the open).
    function acceptGap() external onlyOwner {
        gapAccepted = true;
        emit GapAccepted();
    }
}

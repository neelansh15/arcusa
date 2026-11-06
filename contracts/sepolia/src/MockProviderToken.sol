// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {ERC20} from "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";

/// @title MockProviderToken (mNVDA)
/// @notice TESTNET MOCK. NOT FOR PRODUCTION. NOT A REAL STOCK TOKEN.
/// This token stands in for a provider's tokenized stock (for example Ondo's
/// NVDAon on Ethereum) in the arcusa testnet demo (ADR 0012). It has no backing,
/// no issuer, no compliance checks and no value. Anyone can get some from the
/// faucet. arcusa controls this contract; the real design locks a provider token
/// that arcusa does not control.
///
/// Name and symbol: the Arc wrapper created by the ownerless CCTPx path copies
/// the home token's name and symbol, so they say "mock" and "testnet" on purpose.
///
/// Decimals: 18, the same as Ondo's real tokens (NVDAon `decimals()` is 18 on
/// chain, docs/research/provider-tokens.md). OpenZeppelin's ERC20 default is 18.
///
/// The real NVDAon also has a pause and a deny-list; this mock deliberately has
/// neither (a plain ERC-20), so the lock-and-mint accounting can be tested alone.
contract MockProviderToken is ERC20, Ownable {
    /// @notice Amount the public faucet sends per call (100 mNVDA).
    uint256 public constant FAUCET_AMOUNT = 100e18;

    /// @notice Minimum time between two faucet calls from the same address.
    uint256 public constant FAUCET_COOLDOWN = 1 days;

    /// @notice Hard cap on total supply, for faucet and owner mints together.
    uint256 public constant MAX_SUPPLY = 1_000_000_000e18;

    /// @notice Largest single owner mint.
    uint256 public constant MAX_MINT_PER_CALL = 1_000_000e18;

    uint256 internal constant SEPOLIA_CHAIN_ID = 11155111;
    uint256 internal constant LOCAL_CHAIN_ID = 31337;

    /// @notice Last faucet call time per address (0 if never used).
    mapping(address => uint256) public lastFaucetAt;

    error UnsupportedChain(uint256 chainId);
    error FaucetCooldown(uint256 availableAt);
    error MintTooLarge(uint256 amount, uint256 maxPerCall);
    error SupplyCapExceeded(uint256 newSupply, uint256 cap);

    event FaucetUsed(address indexed to, uint256 amount);

    /// @dev Deployment is only allowed on Sepolia and on a local dev chain, so the
    /// mock cannot end up on a mainnet by mistake.
    constructor(address initialOwner) ERC20("Mock NVIDIA (testnet)", "mNVDA") Ownable(initialOwner) {
        if (block.chainid != SEPOLIA_CHAIN_ID && block.chainid != LOCAL_CHAIN_ID) {
            revert UnsupportedChain(block.chainid);
        }
    }

    /// @notice TESTNET ONLY: sends FAUCET_AMOUNT to the caller, at most once per
    /// FAUCET_COOLDOWN per address. Not for production.
    function faucet() external {
        uint256 last = lastFaucetAt[msg.sender];
        if (last != 0 && block.timestamp < last + FAUCET_COOLDOWN) {
            revert FaucetCooldown(last + FAUCET_COOLDOWN);
        }
        lastFaucetAt[msg.sender] = block.timestamp;
        _mintCapped(msg.sender, FAUCET_AMOUNT);
        emit FaucetUsed(msg.sender, FAUCET_AMOUNT);
    }

    /// @notice TESTNET ONLY: owner mint for demo setup (for example funding the
    /// demo wallets). Not for production.
    function mint(address to, uint256 amount) external onlyOwner {
        if (amount > MAX_MINT_PER_CALL) revert MintTooLarge(amount, MAX_MINT_PER_CALL);
        _mintCapped(to, amount);
    }

    function _mintCapped(address to, uint256 amount) internal {
        uint256 newSupply = totalSupply() + amount;
        if (newSupply > MAX_SUPPLY) revert SupplyCapExceeded(newSupply, MAX_SUPPLY);
        _mint(to, amount);
    }
}

// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {ERC20} from "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {IERC20Metadata} from "@openzeppelin/contracts/token/ERC20/extensions/IERC20Metadata.sol";
import {SafeERC20} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";

/// @title WrappedTokenTestDouble
/// @notice TEST DOUBLE ONLY. Stands in for the wrapped token (wNVDA) that Circle's
/// ownerless CCTPx path deploys on Arc. It is NOT Circle's contract and does not
/// model its code; it models only the accounting: the manager mints and burns it,
/// and it copies the home token's name, symbol and decimals (ADR 0012 amendment).
contract WrappedTokenTestDouble is ERC20 {
    address public immutable manager;
    uint8 private immutable _decimals;

    error OnlyManager();

    constructor(string memory name_, string memory symbol_, uint8 decimals_) ERC20(name_, symbol_) {
        manager = msg.sender;
        _decimals = decimals_;
    }

    modifier onlyManager() {
        if (msg.sender != manager) revert OnlyManager();
        _;
    }

    function decimals() public view override returns (uint8) {
        return _decimals;
    }

    function mint(address to, uint256 amount) external onlyManager {
        _mint(to, amount);
    }

    function burn(address from, uint256 amount) external onlyManager {
        _burn(from, amount);
    }
}

/// @title LockUnlockManagerTestDouble
/// @notice TEST DOUBLE ONLY. A local stand-in for a CCTPx LOCK_UNLOCK token manager
/// on the home chain (Sepolia) together with the burn-and-mint manager on the
/// remote chain (Arc). It is NOT Circle's contract (whose source is not public);
/// it exists so the accounting rule can be tested in one local EVM:
///
///   locked home tokens >= wrapped supply, equal when nothing is in flight.
///
/// Both chains are simulated in one contract. A transfer is two steps, like the
/// real attestation flow: the source side acts at once (lock, or burn) and
/// queues a message; `deliver*` later performs the destination side (mint, or
/// release). Between the two steps the transfer is "in flight".
contract LockUnlockManagerTestDouble {
    using SafeERC20 for IERC20;

    struct Message {
        address recipient;
        uint256 amount;
    }

    IERC20 public immutable homeToken;
    WrappedTokenTestDouble public immutable wrapped;

    /// @notice Locked on home, not yet minted on remote.
    uint256 public inFlightToRemote;
    /// @notice Burned on remote, not yet released on home.
    uint256 public inFlightToHome;

    uint256 public nextId = 1;
    mapping(uint256 => Message) public pendingMints;
    mapping(uint256 => Message) public pendingReleases;

    error ZeroAmount();
    error ZeroRecipient();
    error UnknownMessage(uint256 id);
    error FeeOnTransferNotSupported(uint256 expected, uint256 received);

    event Locked(uint256 indexed id, address indexed from, address indexed recipient, uint256 amount);
    event Minted(uint256 indexed id, address indexed recipient, uint256 amount);
    event Burned(uint256 indexed id, address indexed from, address indexed recipient, uint256 amount);
    event Released(uint256 indexed id, address indexed recipient, uint256 amount);

    constructor(IERC20Metadata homeToken_) {
        homeToken = IERC20(address(homeToken_));
        wrapped = new WrappedTokenTestDouble(homeToken_.name(), homeToken_.symbol(), homeToken_.decimals());
    }

    /// @notice Home tokens held by the manager (the "locked" amount, including any
    /// tokens sent to it directly).
    function locked() public view returns (uint256) {
        return homeToken.balanceOf(address(this));
    }

    // ------------------------------------------------------------ home side

    /// @notice Home side: lock `amount` of the caller's home tokens (needs approval)
    /// and queue a mint of the same amount for `recipient` on the remote side.
    function lock(uint256 amount, address recipient) external returns (uint256 id) {
        if (amount == 0) revert ZeroAmount();
        if (recipient == address(0)) revert ZeroRecipient();
        uint256 before = homeToken.balanceOf(address(this));
        homeToken.safeTransferFrom(msg.sender, address(this), amount);
        uint256 received = homeToken.balanceOf(address(this)) - before;
        if (received != amount) revert FeeOnTransferNotSupported(amount, received);

        id = nextId++;
        pendingMints[id] = Message(recipient, amount);
        inFlightToRemote += amount;
        emit Locked(id, msg.sender, recipient, amount);
    }

    /// @notice Home side: complete an unlock by releasing the locked tokens.
    function deliverRelease(uint256 id) external {
        Message memory m = pendingReleases[id];
        if (m.amount == 0) revert UnknownMessage(id);
        delete pendingReleases[id];
        inFlightToHome -= m.amount;
        homeToken.safeTransfer(m.recipient, m.amount);
        emit Released(id, m.recipient, m.amount);
    }

    // ---------------------------------------------------------- remote side

    /// @notice Remote side: complete a lock by minting the wrapped token.
    function deliverMint(uint256 id) external {
        Message memory m = pendingMints[id];
        if (m.amount == 0) revert UnknownMessage(id);
        delete pendingMints[id];
        inFlightToRemote -= m.amount;
        wrapped.mint(m.recipient, m.amount);
        emit Minted(id, m.recipient, m.amount);
    }

    /// @notice Remote side: burn the caller's wrapped tokens and queue a release
    /// of the same amount of home tokens to `recipient`.
    function burnForUnlock(uint256 amount, address recipient) external returns (uint256 id) {
        if (amount == 0) revert ZeroAmount();
        if (recipient == address(0)) revert ZeroRecipient();
        wrapped.burn(msg.sender, amount);
        id = nextId++;
        pendingReleases[id] = Message(recipient, amount);
        inFlightToHome += amount;
        emit Burned(id, msg.sender, recipient, amount);
    }
}

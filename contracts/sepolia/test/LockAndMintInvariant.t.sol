// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Test} from "forge-std/Test.sol";
import {StdInvariant} from "forge-std/StdInvariant.sol";
import {MockProviderToken} from "../src/MockProviderToken.sol";
import {LockUnlockManagerTestDouble, WrappedTokenTestDouble} from "./doubles/LockUnlockManagerTestDouble.sol";

/// Random sequences of lock, mint delivery, burn, release delivery, wrapped
/// transfers and direct sends to the manager. Ghost variables track what is in
/// flight and what was sent directly.
contract LockAndMintHandler is Test {
    MockProviderToken internal token;
    LockUnlockManagerTestDouble internal manager;
    WrappedTokenTestDouble internal wrapped;
    address[] internal actors;

    uint256[] internal pendingMintIds;
    uint256[] internal pendingReleaseIds;
    uint256 public ghostDirectSends;

    constructor(MockProviderToken token_, LockUnlockManagerTestDouble manager_, address[] memory actors_) {
        token = token_;
        manager = manager_;
        wrapped = manager_.wrapped();
        actors = actors_;
    }

    function _actor(uint256 seed) internal view returns (address) {
        return actors[seed % actors.length];
    }

    function lock(uint256 actorSeed, uint256 recipientSeed, uint256 amount) external {
        address a = _actor(actorSeed);
        uint256 bal = token.balanceOf(a);
        if (bal == 0) return;
        amount = bound(amount, 1, bal);
        vm.prank(a);
        pendingMintIds.push(manager.lock(amount, _actor(recipientSeed)));
    }

    function deliverMint(uint256 idx) external {
        if (pendingMintIds.length == 0) return;
        idx = idx % pendingMintIds.length;
        uint256 id = pendingMintIds[idx];
        pendingMintIds[idx] = pendingMintIds[pendingMintIds.length - 1];
        pendingMintIds.pop();
        manager.deliverMint(id);
    }

    function burnForUnlock(uint256 actorSeed, uint256 recipientSeed, uint256 amount) external {
        address a = _actor(actorSeed);
        uint256 bal = wrapped.balanceOf(a);
        if (bal == 0) return;
        amount = bound(amount, 1, bal);
        vm.prank(a);
        pendingReleaseIds.push(manager.burnForUnlock(amount, _actor(recipientSeed)));
    }

    function deliverRelease(uint256 idx) external {
        if (pendingReleaseIds.length == 0) return;
        idx = idx % pendingReleaseIds.length;
        uint256 id = pendingReleaseIds[idx];
        pendingReleaseIds[idx] = pendingReleaseIds[pendingReleaseIds.length - 1];
        pendingReleaseIds.pop();
        manager.deliverRelease(id);
    }

    function transferWrapped(uint256 fromSeed, uint256 toSeed, uint256 amount) external {
        address from = _actor(fromSeed);
        uint256 bal = wrapped.balanceOf(from);
        amount = bound(amount, 0, bal);
        vm.prank(from);
        wrapped.transfer(_actor(toSeed), amount);
    }

    function sendDirectToManager(uint256 actorSeed, uint256 amount) external {
        address a = _actor(actorSeed);
        uint256 bal = token.balanceOf(a);
        amount = bound(amount, 0, bal);
        vm.prank(a);
        token.transfer(address(manager), amount);
        ghostDirectSends += amount;
    }

    function deliverAll() external {
        while (pendingMintIds.length > 0) {
            manager.deliverMint(pendingMintIds[pendingMintIds.length - 1]);
            pendingMintIds.pop();
        }
        while (pendingReleaseIds.length > 0) {
            manager.deliverRelease(pendingReleaseIds[pendingReleaseIds.length - 1]);
            pendingReleaseIds.pop();
        }
    }

    function pendingCount() external view returns (uint256) {
        return pendingMintIds.length + pendingReleaseIds.length;
    }
}

contract LockAndMintInvariantTest is StdInvariant, Test {
    MockProviderToken internal token;
    LockUnlockManagerTestDouble internal manager;
    WrappedTokenTestDouble internal wrapped;
    LockAndMintHandler internal handler;

    function setUp() public {
        address owner = makeAddr("owner");
        token = new MockProviderToken(owner);
        manager = new LockUnlockManagerTestDouble(token);
        wrapped = manager.wrapped();

        address[] memory actors = new address[](3);
        actors[0] = makeAddr("alice");
        actors[1] = makeAddr("bob");
        actors[2] = makeAddr("carol");
        handler = new LockAndMintHandler(token, manager, actors);
        for (uint256 i = 0; i < actors.length; i++) {
            vm.prank(owner);
            token.mint(actors[i], 1_000e18);
            vm.prank(actors[i]);
            token.approve(address(manager), type(uint256).max);
        }
        targetContract(address(handler));
    }

    /// The rule itself.
    function invariant_lockedAtLeastWrappedSupply() public view {
        assertGe(manager.locked(), wrapped.totalSupply());
    }

    /// Exact decomposition: the surplus is in-flight transfers plus direct sends.
    function invariant_surplusIsInFlightPlusDirectSends() public view {
        assertEq(
            manager.locked(),
            wrapped.totalSupply() + manager.inFlightToRemote() + manager.inFlightToHome() + handler.ghostDirectSends()
        );
    }

    /// Once everything is delivered, locked equals wrapped supply plus direct sends
    /// (equal to the supply when nothing was sent directly).
    function invariant_equalWhenNothingInFlight() public {
        handler.deliverAll();
        assertEq(handler.pendingCount(), 0);
        assertEq(manager.inFlightToRemote(), 0);
        assertEq(manager.inFlightToHome(), 0);
        assertEq(manager.locked(), wrapped.totalSupply() + handler.ghostDirectSends());
    }

    /// mNVDA is conserved: nothing is created or destroyed by lock and unlock.
    function invariant_homeSupplyConserved() public view {
        assertEq(token.totalSupply(), 3_000e18);
    }
}

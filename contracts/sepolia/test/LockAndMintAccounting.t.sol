// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Test} from "forge-std/Test.sol";
import {IERC20Errors} from "@openzeppelin/contracts/interfaces/draft-IERC6093.sol";
import {MockProviderToken} from "../src/MockProviderToken.sol";
import {LockUnlockManagerTestDouble, WrappedTokenTestDouble} from "./doubles/LockUnlockManagerTestDouble.sol";

/// Accounting rule (ADR 0012): locked mNVDA >= wrapped supply, equal when nothing
/// is in flight. Uses the LOCAL test double, not Circle's manager.
contract LockAndMintAccountingTest is Test {
    MockProviderToken internal token;
    LockUnlockManagerTestDouble internal manager;
    WrappedTokenTestDouble internal wrapped;
    address internal owner = makeAddr("owner");
    address internal alice = makeAddr("alice");
    address internal bob = makeAddr("bob");

    function setUp() public {
        token = new MockProviderToken(owner);
        manager = new LockUnlockManagerTestDouble(token);
        wrapped = manager.wrapped();
        vm.prank(owner);
        token.mint(alice, 1_000e18);
        vm.prank(alice);
        token.approve(address(manager), type(uint256).max);
    }

    function test_wrapper_copiesHomeMetadata() public view {
        assertEq(wrapped.name(), "Mock NVIDIA (testnet)");
        assertEq(wrapped.symbol(), "mNVDA");
        assertEq(wrapped.decimals(), 18);
    }

    function test_lock_inFlight_lockedAboveSupply() public {
        vm.prank(alice);
        manager.lock(10e18, bob);
        assertEq(manager.locked(), 10e18);
        assertEq(wrapped.totalSupply(), 0);
        assertEq(manager.inFlightToRemote(), 10e18);
        assertEq(token.balanceOf(alice), 990e18);
        _assertRule();
    }

    function test_lockThenMint_lockedEqualsSupply() public {
        vm.prank(alice);
        uint256 id = manager.lock(10e18, bob);
        manager.deliverMint(id);
        assertEq(wrapped.balanceOf(bob), 10e18);
        assertEq(wrapped.totalSupply(), 10e18);
        assertEq(manager.locked(), wrapped.totalSupply());
        assertEq(manager.inFlightToRemote(), 0);
    }

    function test_directSendToManager_onlyRaisesLocked() public {
        manager.deliverMint(_lockAs(alice, 10e18, alice));
        uint256 supplyBefore = wrapped.totalSupply();

        vm.prank(alice);
        token.transfer(address(manager), 3e18);

        assertEq(manager.locked(), 13e18);
        assertEq(wrapped.totalSupply(), supplyBefore);
        _assertRule();
    }

    function test_unlock_burnsWrapperAndReleasesSameAmount() public {
        manager.deliverMint(_lockAs(alice, 10e18, alice));

        vm.prank(alice);
        uint256 rid = manager.burnForUnlock(4e18, bob);
        // Burned on the remote side at once; release is in flight.
        assertEq(wrapped.balanceOf(alice), 6e18);
        assertEq(wrapped.totalSupply(), 6e18);
        assertEq(manager.locked(), 10e18);
        assertEq(manager.inFlightToHome(), 4e18);
        _assertRule();

        manager.deliverRelease(rid);
        assertEq(token.balanceOf(bob), 4e18);
        assertEq(manager.locked(), 6e18);
        assertEq(manager.locked(), wrapped.totalSupply());
        assertEq(manager.inFlightToHome(), 0);
    }

    function test_fullRoundTrip_restoresBalances() public {
        uint256 start = token.balanceOf(alice);
        manager.deliverMint(_lockAs(alice, 25e18, alice));
        vm.prank(alice);
        manager.deliverRelease(manager.burnForUnlock(25e18, alice));
        assertEq(token.balanceOf(alice), start);
        assertEq(wrapped.totalSupply(), 0);
        assertEq(manager.locked(), 0);
    }

    function test_unlock_moreThanWrappedBalanceReverts() public {
        manager.deliverMint(_lockAs(alice, 1e18, alice));
        vm.expectRevert(abi.encodeWithSelector(IERC20Errors.ERC20InsufficientBalance.selector, alice, 1e18, 1e18 + 1));
        vm.prank(alice);
        manager.burnForUnlock(1e18 + 1, alice);
    }

    function test_deliverTwice_reverts() public {
        uint256 id = _lockAs(alice, 1e18, alice);
        manager.deliverMint(id);
        vm.expectRevert(abi.encodeWithSelector(LockUnlockManagerTestDouble.UnknownMessage.selector, id));
        manager.deliverMint(id);

        vm.prank(alice);
        uint256 rid = manager.burnForUnlock(1e18, alice);
        manager.deliverRelease(rid);
        vm.expectRevert(abi.encodeWithSelector(LockUnlockManagerTestDouble.UnknownMessage.selector, rid));
        manager.deliverRelease(rid);
    }

    function test_crossDelivery_reverts() public {
        // A lock id cannot be delivered as a release and vice versa.
        uint256 id = _lockAs(alice, 1e18, alice);
        vm.expectRevert(abi.encodeWithSelector(LockUnlockManagerTestDouble.UnknownMessage.selector, id));
        manager.deliverRelease(id);
    }

    function test_zeroAmountAndZeroRecipient_revert() public {
        vm.startPrank(alice);
        vm.expectRevert(LockUnlockManagerTestDouble.ZeroAmount.selector);
        manager.lock(0, alice);
        vm.expectRevert(LockUnlockManagerTestDouble.ZeroRecipient.selector);
        manager.lock(1, address(0));
        vm.stopPrank();
    }

    function test_onlyManagerMintsAndBurnsWrapper() public {
        vm.expectRevert(WrappedTokenTestDouble.OnlyManager.selector);
        wrapped.mint(alice, 1);
        vm.expectRevert(WrappedTokenTestDouble.OnlyManager.selector);
        wrapped.burn(alice, 1);
    }

    function testFuzz_roundTrip(uint256 lockAmt, uint256 unlockAmt, uint256 donation) public {
        lockAmt = bound(lockAmt, 1, 1_000e18);
        unlockAmt = bound(unlockAmt, 1, lockAmt);
        donation = bound(donation, 0, 1_000e18 - lockAmt);

        manager.deliverMint(_lockAs(alice, lockAmt, alice));
        if (donation > 0) {
            vm.prank(alice);
            token.transfer(address(manager), donation);
        }
        vm.prank(alice);
        uint256 rid = manager.burnForUnlock(unlockAmt, bob);
        _assertRule();
        manager.deliverRelease(rid);

        assertEq(token.balanceOf(bob), unlockAmt);
        assertEq(wrapped.totalSupply(), lockAmt - unlockAmt);
        assertEq(manager.locked(), lockAmt - unlockAmt + donation);
        _assertRule();
    }

    function _lockAs(address who, uint256 amount, address recipient) internal returns (uint256 id) {
        vm.prank(who);
        id = manager.lock(amount, recipient);
    }

    function _assertRule() internal view {
        assertGe(manager.locked(), wrapped.totalSupply(), "locked < wrapped supply");
    }
}

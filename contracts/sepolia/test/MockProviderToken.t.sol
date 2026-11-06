// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Test} from "forge-std/Test.sol";
import {IERC20Errors} from "@openzeppelin/contracts/interfaces/draft-IERC6093.sol";
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";
import {MockProviderToken} from "../src/MockProviderToken.sol";

contract MockProviderTokenTest is Test {
    MockProviderToken internal token;
    address internal owner = makeAddr("owner");
    address internal alice = makeAddr("alice");
    address internal bob = makeAddr("bob");

    function setUp() public {
        vm.warp(1_800_000_000);
        token = new MockProviderToken(owner);
    }

    // ---------------------------------------------------------------- metadata

    function test_metadata_saysMockAndTestnet() public view {
        assertEq(token.name(), "Mock NVIDIA (testnet)");
        assertEq(token.symbol(), "mNVDA");
    }

    function test_decimals_is18_likeOndo() public view {
        assertEq(token.decimals(), 18);
    }

    function test_initialState() public view {
        assertEq(token.totalSupply(), 0);
        assertEq(token.owner(), owner);
    }

    // --------------------------------------------------------- chain guard

    function test_constructor_allowsSepolia() public {
        vm.chainId(11155111);
        MockProviderToken t = new MockProviderToken(owner);
        assertEq(t.decimals(), 18);
    }

    function test_constructor_revertsOnMainnet() public {
        vm.chainId(1);
        vm.expectRevert(abi.encodeWithSelector(MockProviderToken.UnsupportedChain.selector, 1));
        new MockProviderToken(owner);
    }

    function test_constructor_revertsOnOtherChain() public {
        vm.chainId(5042002);
        vm.expectRevert(abi.encodeWithSelector(MockProviderToken.UnsupportedChain.selector, 5042002));
        new MockProviderToken(owner);
    }

    // ---------------------------------------------------------------- faucet

    function test_faucet_sendsFixedAmount() public {
        vm.expectEmit(true, false, false, true, address(token));
        emit MockProviderToken.FaucetUsed(alice, 100e18);
        vm.prank(alice);
        token.faucet();
        assertEq(token.balanceOf(alice), 100e18);
        assertEq(token.totalSupply(), 100e18);
        assertEq(token.lastFaucetAt(alice), block.timestamp);
    }

    function test_faucet_revertsDuringCooldown() public {
        vm.prank(alice);
        token.faucet();
        uint256 availableAt = block.timestamp + 1 days;

        vm.warp(availableAt - 1);
        vm.expectRevert(abi.encodeWithSelector(MockProviderToken.FaucetCooldown.selector, availableAt));
        vm.prank(alice);
        token.faucet();
        assertEq(token.balanceOf(alice), 100e18);
    }

    function test_faucet_worksAgainAfterCooldown() public {
        vm.prank(alice);
        token.faucet();
        vm.warp(block.timestamp + 1 days);
        vm.prank(alice);
        token.faucet();
        assertEq(token.balanceOf(alice), 200e18);
    }

    function test_faucet_cooldownIsPerAddress() public {
        vm.prank(alice);
        token.faucet();
        vm.prank(bob);
        token.faucet();
        assertEq(token.balanceOf(bob), 100e18);
    }

    function test_faucet_respectsSupplyCap() public {
        _fillToCap(token.MAX_SUPPLY() - 1);
        vm.expectRevert(
            abi.encodeWithSelector(
                MockProviderToken.SupplyCapExceeded.selector, token.MAX_SUPPLY() - 1 + 100e18, token.MAX_SUPPLY()
            )
        );
        vm.prank(alice);
        token.faucet();
        // A failed call does not start the cooldown.
        assertEq(token.lastFaucetAt(alice), 0);
    }

    // ------------------------------------------------------------ owner mint

    function test_mint_ownerCanMint() public {
        vm.prank(owner);
        token.mint(alice, 5e18);
        assertEq(token.balanceOf(alice), 5e18);
    }

    function test_mint_nonOwnerReverts() public {
        vm.expectRevert(abi.encodeWithSelector(Ownable.OwnableUnauthorizedAccount.selector, alice));
        vm.prank(alice);
        token.mint(alice, 1);
    }

    function test_mint_perCallLimit() public {
        uint256 max = token.MAX_MINT_PER_CALL();
        vm.prank(owner);
        token.mint(alice, max);
        assertEq(token.balanceOf(alice), max);

        vm.expectRevert(abi.encodeWithSelector(MockProviderToken.MintTooLarge.selector, max + 1, max));
        vm.prank(owner);
        token.mint(alice, max + 1);
    }

    function test_mint_supplyCap() public {
        _fillToCap(token.MAX_SUPPLY());
        assertEq(token.totalSupply(), token.MAX_SUPPLY());
        vm.expectRevert(
            abi.encodeWithSelector(
                MockProviderToken.SupplyCapExceeded.selector, token.MAX_SUPPLY() + 1, token.MAX_SUPPLY()
            )
        );
        vm.prank(owner);
        token.mint(alice, 1);
    }

    function test_mint_toZeroAddressReverts() public {
        vm.expectRevert(abi.encodeWithSelector(IERC20Errors.ERC20InvalidReceiver.selector, address(0)));
        vm.prank(owner);
        token.mint(address(0), 1);
    }

    // ------------------------------------------------------------- transfers

    function test_transfer_movesBalance() public {
        _give(alice, 10e18);
        vm.prank(alice);
        assertTrue(token.transfer(bob, 4e18));
        assertEq(token.balanceOf(alice), 6e18);
        assertEq(token.balanceOf(bob), 4e18);
        assertEq(token.totalSupply(), 10e18);
    }

    function test_transfer_insufficientBalanceReverts() public {
        _give(alice, 1e18);
        vm.expectRevert(
            abi.encodeWithSelector(IERC20Errors.ERC20InsufficientBalance.selector, alice, 1e18, 1e18 + 1)
        );
        vm.prank(alice);
        token.transfer(bob, 1e18 + 1);
    }

    function test_transfer_toZeroAddressReverts() public {
        _give(alice, 1e18);
        vm.expectRevert(abi.encodeWithSelector(IERC20Errors.ERC20InvalidReceiver.selector, address(0)));
        vm.prank(alice);
        token.transfer(address(0), 1);
    }

    function test_transferFrom_usesAllowance() public {
        _give(alice, 10e18);
        vm.prank(alice);
        token.approve(bob, 3e18);

        vm.prank(bob);
        assertTrue(token.transferFrom(alice, bob, 2e18));
        assertEq(token.allowance(alice, bob), 1e18);
        assertEq(token.balanceOf(bob), 2e18);

        vm.expectRevert(
            abi.encodeWithSelector(IERC20Errors.ERC20InsufficientAllowance.selector, bob, 1e18, 2e18)
        );
        vm.prank(bob);
        token.transferFrom(alice, bob, 2e18);
    }

    function test_transferFrom_infiniteAllowanceIsNotSpent() public {
        _give(alice, 10e18);
        vm.prank(alice);
        token.approve(bob, type(uint256).max);
        vm.prank(bob);
        token.transferFrom(alice, bob, 10e18);
        assertEq(token.allowance(alice, bob), type(uint256).max);
    }

    /// No fee-on-transfer and no rebasing: the receiver gets exactly `amount`
    /// (the lock accounting relies on this).
    function testFuzz_transfer_exactAmountNoFee(uint256 minted, uint256 amount) public {
        minted = bound(minted, 0, token.MAX_MINT_PER_CALL());
        amount = bound(amount, 0, minted);
        _give(alice, minted);
        vm.prank(alice);
        token.transfer(bob, amount);
        assertEq(token.balanceOf(bob), amount);
        assertEq(token.balanceOf(alice), minted - amount);
        assertEq(token.totalSupply(), minted);
    }

    // --------------------------------------------------------------- helpers

    function _give(address to, uint256 amount) internal {
        vm.prank(owner);
        token.mint(to, amount);
    }

    function _fillToCap(uint256 target) internal {
        uint256 max = token.MAX_MINT_PER_CALL();
        address sink = makeAddr("sink");
        while (token.totalSupply() + max <= target) {
            vm.prank(owner);
            token.mint(sink, max);
        }
        uint256 rest = target - token.totalSupply();
        if (rest > 0) {
            vm.prank(owner);
            token.mint(sink, rest);
        }
    }
}

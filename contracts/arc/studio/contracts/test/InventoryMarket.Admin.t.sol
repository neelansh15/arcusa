// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {Pausable} from "@openzeppelin/contracts/utils/Pausable.sol";
import {ReentrancyGuard} from "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import {InventoryMarketTestBase} from "./InventoryMarket.Base.t.sol";
import {InventoryMarket, IPriceOracle} from "../InventoryMarket.sol";
import {MockERC20, ReentrantToken} from "./mocks/MockERC20.sol";

contract InventoryMarketAdminTest is InventoryMarketTestBase {
    // ------------------------------------------------------------------- pause
    function test_Pause_BlocksTradesAndUnpauseRestores() public {
        vm.prank(owner);
        market.pause();
        vm.expectRevert(Pausable.EnforcedPause.selector);
        _buy(alice, 1e6, 0);
        vm.expectRevert(Pausable.EnforcedPause.selector);
        _sell(alice, 1e18, 0);

        vm.prank(owner);
        market.unpause();
        _buy(alice, 1e6, 0);
        _sell(alice, 1e18, 0);
    }

    function test_Pause_OnlyOwner() public {
        vm.prank(stranger);
        vm.expectRevert(_notOwner(stranger));
        market.pause();
        vm.prank(owner);
        market.pause();
        vm.prank(stranger);
        vm.expectRevert(_notOwner(stranger));
        market.unpause();
    }

    function test_Pause_QuotesAndInventoryStillWork() public {
        vm.prank(owner);
        market.pause();
        (uint256 out,,,) = market.quoteBuy(10e6);
        assertEq(out, 99_700_897_308_075_772);
        (uint256 sellOut,,,) = market.quoteSell(1e18);
        assertEq(sellOut, 99_700_000);
        (uint256 wb, uint256 ub,, bool p) = market.inventory();
        assertEq(wb, STOCK_INV);
        assertEq(ub, USDC_INV);
        assertTrue(p);
    }

    function test_Inventory_DoesNotRevertOnStaleOracle() public {
        vm.warp(T0 + 1 days);
        (uint256 wb,,,) = market.inventory();
        assertEq(wb, STOCK_INV);
    }

    // ---------------------------------------------------------------- exposure
    function test_Exposure_BuysIncreaseSellsDecrease() public {
        _buy(alice, 10e6, 0);
        assertEq(market.netUsdcFlow(), int256(10e6));
        _sell(alice, 0.5e18, 0); // pays out 49_850_000
        assertEq(market.netUsdcFlow(), int256(10e6) - int256(49_850_000));
    }

    function test_Exposure_LongSideLimit() public {
        vm.prank(owner);
        market.setLimits(100e6, 150e6, 0, 0);
        _buy(alice, 100e6, 0);
        _buy(alice, 50e6, 0); // exactly 150e6 allowed
        vm.expectRevert(abi.encodeWithSelector(InventoryMarket.ExposureExceeded.selector, int256(150e6 + 1), 150e6));
        _buy(alice, 1, 0 );
    }

    function test_Exposure_ShortSideLimit() public {
        vm.prank(owner);
        market.setLimits(100e6, 150e6, 0, 0);
        _sell(alice, 1e18, 0); // -99_700_000
        vm.expectRevert(abi.encodeWithSelector(InventoryMarket.ExposureExceeded.selector, -int256(199_400_000), 150e6));
        _sell(alice, 1e18, 0);
    }

    function test_Exposure_SellingBackFreesRoom() public {
        vm.prank(owner);
        market.setLimits(100e6, 100e6, 0, 0);
        _buy(alice, 100e6, 0);
        vm.expectRevert();
        _buy(alice, 1e6, 0);
        // sell back ~50 USDC worth
        _sell(alice, 0.5e18, 0);
        _buy(alice, 1e6, 0);
        assertEq(market.netUsdcFlow(), int256(100e6) - int256(49_850_000) + int256(1e6));
    }

    function test_ResetExposure_OwnerZeroesWithEvent() public {
        _buy(alice, 10e6, 0);
        vm.expectEmit(false, false, false, false, address(market));
        emit InventoryMarket.ExposureReset();
        vm.prank(owner);
        market.resetExposure();
        assertEq(market.netUsdcFlow(), 0);
    }

    function test_ResetExposure_NonOwnerReverts() public {
        vm.prank(stranger);
        vm.expectRevert(_notOwner(stranger));
        market.resetExposure();
    }

    // -------------------------------------------------------------- owner: funds
    function test_Deposit_WrongToken() public {
        MockERC20 other = new MockERC20("X", "X", 18);
        vm.prank(owner);
        vm.expectRevert(InventoryMarket.WrongToken.selector);
        market.deposit(IERC20(address(other)), 1);
    }

    function test_Deposit_ZeroAmount() public {
        vm.prank(owner);
        vm.expectRevert(InventoryMarket.ZeroAmount.selector);
        market.deposit(IERC20(address(usdc)), 0);
    }

    function test_Deposit_HappyEmits() public {
        usdc.mint(owner, 5e6);
        vm.expectEmit(true, true, false, true, address(market));
        emit InventoryMarket.InventoryDeposited(address(usdc), owner, 5e6);
        vm.prank(owner);
        market.deposit(IERC20(address(usdc)), 5e6);
        assertEq(usdc.balanceOf(address(market)), USDC_INV + 5e6);
    }

    function test_Withdraw_HappyEmits() public {
        vm.expectEmit(true, true, false, true, address(market));
        emit InventoryMarket.InventoryWithdrawn(address(wnvda), stranger, 3e18);
        vm.prank(owner);
        market.withdraw(IERC20(address(wnvda)), 3e18, stranger);
        assertEq(wnvda.balanceOf(stranger), 3e18);
        assertEq(wnvda.balanceOf(address(market)), STOCK_INV - 3e18);
    }

    function test_Withdraw_ZeroAmountAndZeroAddress() public {
        vm.startPrank(owner);
        vm.expectRevert(InventoryMarket.ZeroAmount.selector);
        market.withdraw(IERC20(address(usdc)), 0, owner);
        vm.expectRevert(InventoryMarket.InvalidParam.selector);
        market.withdraw(IERC20(address(usdc)), 1, address(0));
        vm.stopPrank();
    }

    // ------------------------------------------------------ owner: configuration
    function test_SetSessionParams_Validation() public {
        vm.startPrank(owner);
        vm.expectRevert(InventoryMarket.InvalidParam.selector);
        market.setSessionParams(5, 30, 100);
        vm.expectRevert(InventoryMarket.InvalidParam.selector);
        market.setSessionParams(1, 2001, 100);
        vm.expectRevert(InventoryMarket.InvalidParam.selector);
        market.setSessionParams(1, 30, 10_001);
        vm.expectEmit(true, false, false, true, address(market));
        emit InventoryMarket.SessionParamsSet(4, 2000, 10_000);
        market.setSessionParams(4, 2000, 10_000);
        vm.stopPrank();
        assertEq(market.sessionSpreadBps(4), 2000);
        assertEq(market.sessionCapBps(4), 10_000);
    }

    function test_SetLimits_OwnerEmitsAndStores() public {
        vm.expectEmit(false, false, false, true, address(market));
        emit InventoryMarket.LimitsSet(1, 2, 3, 4);
        vm.prank(owner);
        market.setLimits(1, 2, 3, 4);
        assertEq(market.maxTradeUsdc(), 1);
        assertEq(market.maxExposureUsdc(), 2);
        assertEq(market.minInventory(), 3);
        assertEq(market.minUsdcReserve(), 4);
    }

    function test_SetOracle_ZeroAddressReverts() public {
        vm.prank(owner);
        vm.expectRevert(InventoryMarket.InvalidParam.selector);
        market.setOracle(IPriceOracle(address(0)));
    }

    function test_SetOracle_HappyEmits() public {
        vm.expectEmit(false, false, false, true, address(market));
        emit InventoryMarket.OracleSet(address(0xBEEF));
        vm.prank(owner);
        market.setOracle(IPriceOracle(address(0xBEEF)));
        assertEq(address(market.oracle()), address(0xBEEF));
    }

    function test_OwnerFunctions_NonOwnerReverts() public {
        IERC20 u = IERC20(address(usdc));
        vm.startPrank(stranger);
        vm.expectRevert(_notOwner(stranger));
        market.deposit(u, 1);
        vm.expectRevert(_notOwner(stranger));
        market.withdraw(u, 1, stranger);
        vm.expectRevert(_notOwner(stranger));
        market.setSessionParams(1, 30, 100);
        vm.expectRevert(_notOwner(stranger));
        market.setLimits(1, 1, 1, 1);
        vm.expectRevert(_notOwner(stranger));
        market.setOffHoursTrading(true);
        vm.expectRevert(_notOwner(stranger));
        market.setOracle(IPriceOracle(address(oracle)));
        vm.stopPrank();
    }

    // -------------------------------------------------------------- reentrancy
    function test_Reentrancy_SellPayoutCannotReenterSell() public {
        ReentrantToken rUsdc = new ReentrantToken();
        InventoryMarket m2 =
            new InventoryMarket(owner, IERC20(address(rUsdc)), IERC20(address(wnvda)), IPriceOracle(address(oracle)));
        rUsdc.mint(address(m2), 1_000e6);
        vm.prank(alice);
        wnvda.approve(address(m2), type(uint256).max);
        rUsdc.arm(address(m2));

        uint256 wBefore = wnvda.balanceOf(alice);
        vm.prank(alice);
        vm.expectRevert(ReentrancyGuard.ReentrancyGuardReentrantCall.selector);
        m2.sell(1e18, 0);

        // whole call reverted: nothing moved
        assertEq(wnvda.balanceOf(alice), wBefore);
        assertEq(rUsdc.balanceOf(alice), 0);
        assertEq(m2.netUsdcFlow(), 0);
    }
}

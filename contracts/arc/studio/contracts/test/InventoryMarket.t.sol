// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {InventoryMarketTestBase} from "./InventoryMarket.Base.t.sol";
import {PriceOracle} from "../PriceOracle.sol";
import {InventoryMarket, IPriceOracle} from "../InventoryMarket.sol";

contract InventoryMarketTest is InventoryMarketTestBase {
    // Hand-computed (price 100e8):
    //  buy 10 USDC @30bps  : 10e6*1e20*1e4/(100e8*10030)  = 99_700_897_308_075_772
    //  buy 25 USDC @90bps  : 25e6*1e20*1e4/(100e8*10090)  = 247_770_069_375_619_425
    //  buy 10 USDC @200bps : 10e6*1e20*1e4/(100e8*10200)  = 98_039_215_686_274_509
    //  sell 1 token @30bps : 1e18*100e8*9970/(1e20*1e4)   = 99_700_000
    //  sell 0.5 token@30bps: 49_850_000
    uint256 internal constant BUY_10_30 = 99_700_897_308_075_772;
    uint256 internal constant BUY_25_90 = 247_770_069_375_619_425;
    uint256 internal constant BUY_10_200 = 98_039_215_686_274_509;

    // ------------------------------------------------------------ constructor
    function test_Constructor_State() public view {
        assertEq(market.owner(), owner);
        assertEq(address(market.usdc()), address(usdc));
        assertEq(address(market.wnvda()), address(wnvda));
        assertEq(address(market.oracle()), address(oracle));
        assertEq(market.maxTradeUsdc(), 100e6);
        assertEq(market.maxExposureUsdc(), 1_000e6);
        assertEq(market.sessionSpreadBps(1), 30);
        assertEq(market.sessionCapBps(1), 10_000);
        assertEq(market.sessionSpreadBps(2), 90);
        assertEq(market.sessionCapBps(4), 2500);
        assertEq(market.sessionSpreadBps(0), 200);
        assertEq(market.sessionCapBps(0), 1000);
        assertFalse(market.offHoursTrading());
    }

    function test_Constructor_ZeroAddressesRevert() public {
        IERC20 u = IERC20(address(usdc));
        IERC20 w = IERC20(address(wnvda));
        IPriceOracle o = IPriceOracle(address(oracle));
        vm.expectRevert(InventoryMarket.InvalidParam.selector);
        new InventoryMarket(owner, IERC20(address(0)), w, o);
        vm.expectRevert(InventoryMarket.InvalidParam.selector);
        new InventoryMarket(owner, u, IERC20(address(0)), o);
        vm.expectRevert(InventoryMarket.InvalidParam.selector);
        new InventoryMarket(owner, u, w, IPriceOracle(address(0)));
    }

    // ------------------------------------------------------------------ quotes
    function test_QuoteBuy_ExactMathRegular() public view {
        (uint256 out, uint256 price, uint256 spread, uint8 session) = market.quoteBuy(10e6);
        assertEq(out, BUY_10_30);
        assertEq(price, PRICE);
        assertEq(spread, 30);
        assertEq(session, 1);
    }

    function test_QuoteBuy_RoundsDown() public view {
        // 1 unit: 1e24/(1e10*10030) = 9_970_089_730.8 -> 9_970_089_730
        (uint256 out,,,) = market.quoteBuy(1);
        assertEq(out, 9_970_089_730);
    }

    function test_QuoteSell_ExactMathRegular() public view {
        (uint256 out, uint256 price, uint256 spread, uint8 session) = market.quoteSell(1e18);
        assertEq(out, 99_700_000);
        assertEq(price, PRICE);
        assertEq(spread, 30);
        assertEq(session, 1);
        (out,,,) = market.quoteSell(0.5e18);
        assertEq(out, 49_850_000);
    }

    function test_QuoteSell_RoundsDown() public view {
        // 1.5e12 wei -> 1.5e12*1e10*9970/1e24 = 149.55 -> 149
        (uint256 out,,,) = market.quoteSell(1.5e12);
        assertEq(out, 149);
    }

    function test_RoundTrip_NeverReturnsMoreUsdc() public {
        uint256 w = _buy(alice, 10e6, 0);
        assertEq(w, BUY_10_30);
        uint256 back = _sell(alice, w, 0);
        assertEq(back, 9_940_179);
        assertLt(back, 10e6);
    }

    // ------------------------------------------------------------------ trades
    function test_Buy_MovesBalancesAndEmits() public {
        uint256 u0 = usdc.balanceOf(alice);
        vm.expectEmit(true, false, false, true, address(market));
        emit InventoryMarket.Bought(alice, 10e6, BUY_10_30, PRICE, 30, 1);
        uint256 out = _buy(alice, 10e6, BUY_10_30);
        assertEq(out, BUY_10_30);
        assertEq(usdc.balanceOf(alice), u0 - 10e6);
        assertEq(wnvda.balanceOf(alice), 100e18 + BUY_10_30);
        assertEq(usdc.balanceOf(address(market)), USDC_INV + 10e6);
        assertEq(wnvda.balanceOf(address(market)), STOCK_INV - BUY_10_30);
        (uint256 wb, uint256 ub, int256 flow, bool p) = market.inventory();
        assertEq(wb, STOCK_INV - BUY_10_30);
        assertEq(ub, USDC_INV + 10e6);
        assertEq(flow, int256(10e6));
        assertFalse(p);
    }

    function test_Sell_MovesBalancesAndEmits() public {
        uint256 u0 = usdc.balanceOf(alice);
        vm.expectEmit(true, false, false, true, address(market));
        emit InventoryMarket.Sold(alice, 1e18, 99_700_000, PRICE, 30, 1);
        uint256 out = _sell(alice, 1e18, 99_700_000);
        assertEq(out, 99_700_000);
        assertEq(usdc.balanceOf(alice), u0 + 99_700_000);
        assertEq(wnvda.balanceOf(alice), 99e18);
        assertEq(usdc.balanceOf(address(market)), USDC_INV - 99_700_000);
        assertEq(wnvda.balanceOf(address(market)), STOCK_INV + 1e18);
        assertEq(market.netUsdcFlow(), -int256(99_700_000));
    }

    // ------------------------------------------------------------- trade caps
    function test_Buy_ExactlyAtCapOk() public {
        _buy(alice, 100e6, 0);
        assertEq(market.netUsdcFlow(), int256(100e6));
    }

    function test_Buy_OneOverCapReverts() public {
        vm.expectRevert(abi.encodeWithSelector(InventoryMarket.TradeTooLarge.selector, 100e6 + 1, 100e6));
        _buy(alice, 100e6 + 1, 0);
        vm.expectRevert(abi.encodeWithSelector(InventoryMarket.TradeTooLarge.selector, 100e6 + 1, 100e6));
        market.quoteBuy(100e6 + 1);
    }

    function test_Sell_CapAppliesToUsdcOut() public {
        // zero spread, 100% cap: usdcOut = wnvdaIn / 1e10
        vm.prank(owner);
        market.setSessionParams(1, 0, 10_000);
        (uint256 out,,,) = market.quoteSell(1e18);
        assertEq(out, 100e6);
        assertEq(_sell(alice, 1e18, 0), 100e6); // exactly at cap
        vm.expectRevert(abi.encodeWithSelector(InventoryMarket.TradeTooLarge.selector, 100e6 + 1, 100e6));
        _sell(alice, 1e18 + 1e10, 0);
    }

    function test_Sell_LargeTokenAmountButSmallUsdcOutOk() public {
        // 50 tokens in is $5000 worth > cap, so reverts; cap is on USDC out not token count
        vm.expectRevert(abi.encodeWithSelector(InventoryMarket.TradeTooLarge.selector, 4_985_000_000, 100e6));
        _sell(alice, 50e18, 0);
    }

    function test_SetSessionParams_ChangesCap() public {
        vm.prank(owner);
        market.setSessionParams(1, 30, 5000); // 50e6 cap
        _buy(alice, 50e6, 0);
        vm.expectRevert(abi.encodeWithSelector(InventoryMarket.TradeTooLarge.selector, 50e6 + 1, 50e6));
        _buy(alice, 50e6 + 1, 0);
    }

    // ------------------------------------------------------- extended sessions
    function test_ExtendedSessions_Use90bpsAnd25PctCap() public {
        for (uint8 s = 2; s <= 4; s++) {
            _setSession(s);
            (uint256 out,, uint256 spread, uint8 sess) = market.quoteBuy(25e6);
            assertEq(out, BUY_25_90);
            assertEq(spread, 90);
            assertEq(sess, s);
            vm.expectRevert(abi.encodeWithSelector(InventoryMarket.TradeTooLarge.selector, 25e6 + 1, 25e6));
            market.quoteBuy(25e6 + 1);
            // sell: 0.25 token -> 0.25e18*100e8*9910/1e24 = 24_775_000
            (uint256 sellOut,, uint256 sSpread,) = market.quoteSell(0.25e18);
            assertEq(sellOut, 24_775_000);
            assertEq(sSpread, 90);
        }
    }

    function test_ExtendedSession_BuyEmitsSessionAndSpread() public {
        _setSession(3);
        vm.expectEmit(true, false, false, true, address(market));
        emit InventoryMarket.Bought(alice, 25e6, BUY_25_90, PRICE, 90, 3);
        _buy(alice, 25e6, 0);
    }

    function test_ExtendedSession_SellCapOnUsdcOut() public {
        _setSession(2);
        // 1 token -> 99.1 USDC > 25 USDC cap
        vm.expectRevert(abi.encodeWithSelector(InventoryMarket.TradeTooLarge.selector, 99_100_000, 25e6));
        _sell(alice, 1e18, 0);
        // 0.25 token -> 24.775 USDC ok
        assertEq(_sell(alice, 0.25e18, 0), 24_775_000);
    }

    // ----------------------------------------------- closed session / off hours
    function test_SessionClosed_RevertsWhenOffHoursDisabled() public {
        _setSession(0);
        vm.expectRevert(abi.encodeWithSelector(InventoryMarket.SessionClosed.selector, 0));
        _buy(alice, 1e6, 0);
        vm.expectRevert(abi.encodeWithSelector(InventoryMarket.SessionClosed.selector, 0));
        _sell(alice, 1e18, 0);
        vm.expectRevert(abi.encodeWithSelector(InventoryMarket.SessionClosed.selector, 0));
        market.quoteBuy(1e6);
    }

    function test_OffHours_TradesAt200bpsAnd10PctCap() public {
        _setSession(0);
        vm.expectEmit(false, false, false, true, address(market));
        emit InventoryMarket.OffHoursTradingSet(true);
        vm.prank(owner);
        market.setOffHoursTrading(true);

        vm.expectEmit(true, false, false, true, address(market));
        emit InventoryMarket.Bought(alice, 10e6, BUY_10_200, PRICE, 200, 0);
        _buy(alice, 10e6, 0);

        vm.expectRevert(abi.encodeWithSelector(InventoryMarket.TradeTooLarge.selector, 10e6 + 1, 10e6));
        _buy(alice, 10e6 + 1, 0);

        // sell 0.1 token: 0.1e18*100e8*9800/1e24 = 9_800_000 (< 10e6 cap)
        assertEq(_sell(alice, 0.1e18, 0), 9_800_000);
    }

    function test_SetSessionParams_ZeroCapClosesSession() public {
        vm.prank(owner);
        market.setSessionParams(1, 30, 0);
        vm.expectRevert(abi.encodeWithSelector(InventoryMarket.SessionClosed.selector, 1));
        _buy(alice, 1e6, 0);
        vm.expectRevert(abi.encodeWithSelector(InventoryMarket.SessionClosed.selector, 1));
        _sell(alice, 1e18, 0);
    }

    function test_ClosedSession_ZeroCapStaysClosedEvenWithOffHours() public {
        _setSession(0);
        vm.startPrank(owner);
        market.setOffHoursTrading(true);
        market.setSessionParams(0, 200, 0);
        vm.stopPrank();
        vm.expectRevert(abi.encodeWithSelector(InventoryMarket.SessionClosed.selector, 0));
        _buy(alice, 1e6, 0);
    }

    // ---------------------------------------------------------- oracle staleness
    function test_StaleOracle_RevertsBuySellAndQuote() public {
        vm.warp(T0 + 301);
        bytes memory err = abi.encodeWithSelector(PriceOracle.StalePrice.selector, 301, 300);
        vm.expectRevert(err);
        _buy(alice, 1e6, 0);
        vm.expectRevert(err);
        _sell(alice, 1e18, 0);
        vm.expectRevert(err);
        market.quoteBuy(1e6);
        vm.expectRevert(err);
        market.quoteSell(1e18);
    }

    function test_StaleOracle_WorksInOracleDemoMode() public {
        vm.prank(owner);
        oracle.setDemoMode(true);
        vm.warp(T0 + 1 days);
        (uint256 out,,,) = market.quoteBuy(10e6);
        assertEq(out, BUY_10_30);
        assertEq(_buy(alice, 10e6, 0), BUY_10_30);
    }

    function test_NoOraclePrice_Reverts() public {
        PriceOracle fresh = new PriceOracle(owner, 300);
        vm.prank(owner);
        market.setOracle(IPriceOracle(address(fresh)));
        vm.expectRevert(PriceOracle.NoPrice.selector);
        market.quoteBuy(1e6);
    }

    // ----------------------------------------------------------------- inventory
    function test_Buy_InventoryShort() public {
        _drain(wnvda, 0.05e18);
        vm.expectRevert(abi.encodeWithSelector(InventoryMarket.InventoryShort.selector, 0.05e18, BUY_10_30));
        _buy(alice, 10e6, 0);
    }

    function test_Buy_InventoryShortIncludesMinInventory() public {
        _drain(wnvda, 1e18);
        vm.prank(owner);
        market.setLimits(100e6, 1_000e6, 0.95e18, 0);
        vm.expectRevert(abi.encodeWithSelector(InventoryMarket.InventoryShort.selector, 1e18, BUY_10_30 + 0.95e18));
        _buy(alice, 10e6, 0);
        // a smaller buy that leaves minInventory untouched still works
        _buy(alice, 1e6, 0);
    }

    function test_Sell_InventoryShort() public {
        _drain(usdc, 50e6);
        vm.expectRevert(abi.encodeWithSelector(InventoryMarket.InventoryShort.selector, 50e6, 99_700_000));
        _sell(alice, 1e18, 0);
    }

    function test_Sell_InventoryShortIncludesMinUsdcReserve() public {
        _drain(usdc, 100e6);
        vm.prank(owner);
        market.setLimits(100e6, 1_000e6, 0, 10e6);
        vm.expectRevert(abi.encodeWithSelector(InventoryMarket.InventoryShort.selector, 100e6, 109_700_000));
        _sell(alice, 1e18, 0);
    }

    // ------------------------------------------------------------------ slippage
    function test_Buy_Slippage() public {
        vm.expectRevert(abi.encodeWithSelector(InventoryMarket.SlippageExceeded.selector, BUY_10_30, BUY_10_30 + 1));
        _buy(alice, 10e6, BUY_10_30 + 1);
        assertEq(_buy(alice, 10e6, BUY_10_30), BUY_10_30);
    }

    function test_Sell_Slippage() public {
        vm.expectRevert(abi.encodeWithSelector(InventoryMarket.SlippageExceeded.selector, 99_700_000, 99_700_001));
        _sell(alice, 1e18, 99_700_001);
        assertEq(_sell(alice, 1e18, 99_700_000), 99_700_000);
    }

    // ---------------------------------------------------------------- zero amount
    function test_ZeroAmount() public {
        vm.expectRevert(InventoryMarket.ZeroAmount.selector);
        _buy(alice, 0, 0);
        vm.expectRevert(InventoryMarket.ZeroAmount.selector);
        _sell(alice, 0, 0);
        vm.expectRevert(InventoryMarket.ZeroAmount.selector);
        market.quoteBuy(0);
        vm.expectRevert(InventoryMarket.ZeroAmount.selector);
        market.quoteSell(0);
    }

    function test_ZeroAmount_SellDustRoundsToZero() public {
        // 1 wei * 100e8 * 9970 / 1e24 = 0
        vm.expectRevert(InventoryMarket.ZeroAmount.selector);
        _sell(alice, 1, 0);
    }

    function test_ZeroAmount_BuyDustRoundsToZero() public {
        PriceOracle huge = new PriceOracle(owner, 300);
        _pushOracle(huge, 1e22, T0, 1); // $100 trillion: 1 unit buys < 1 wei
        vm.prank(owner);
        market.setOracle(IPriceOracle(address(huge)));
        vm.expectRevert(InventoryMarket.ZeroAmount.selector);
        _buy(alice, 1, 0);
    }
}

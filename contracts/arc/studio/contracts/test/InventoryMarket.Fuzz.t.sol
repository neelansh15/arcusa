// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Math} from "@openzeppelin/contracts/utils/math/Math.sol";
import {InventoryMarketTestBase} from "./InventoryMarket.Base.t.sol";
import {PriceOracle} from "../PriceOracle.sol";
import {InventoryMarket, IPriceOracle} from "../InventoryMarket.sol";

contract InventoryMarketFuzzTest is InventoryMarketTestBase {
    uint256 internal constant CAP = 100e6;

    function _configure(uint256 price, uint256 spread) internal {
        PriceOracle o = new PriceOracle(owner, 300); // first update is deviation-exempt
        _pushOracle(o, price, block.timestamp, 1);
        vm.startPrank(owner);
        market.setOracle(IPriceOracle(address(o)));
        market.setSessionParams(1, spread, 10_000);
        vm.stopPrank();
        wnvda.mint(address(market), 1e30); // plenty of stock at any fuzzed price
    }

    function testFuzz_QuoteBuyMatchesIndependentFormula(uint256 usdcIn, uint256 price, uint256 spread) public {
        usdcIn = bound(usdcIn, 1, CAP);
        price = bound(price, 1e6, 1e13);
        spread = bound(spread, 0, 2000);
        _configure(price, spread);

        // independent: wei = usdcIn * 1e24 / (price * (1e4 + spread))
        uint256 expected = Math.mulDiv(usdcIn, 1e24, price * (10_000 + spread));
        if (expected == 0) {
            vm.expectRevert(InventoryMarket.ZeroAmount.selector);
            market.quoteBuy(usdcIn);
            return;
        }
        (uint256 out, uint256 p, uint256 s,) = market.quoteBuy(usdcIn);
        assertEq(out, expected);
        assertEq(p, price);
        assertEq(s, spread);
        // the trader never receives more than the exact no-rounding amount
        assertLe(out * price * (10_000 + spread), usdcIn * 1e24);

        assertEq(_buy(alice, usdcIn, expected), expected);
    }

    function testFuzz_QuoteSellMatchesIndependentFormula(uint256 wIn, uint256 price, uint256 spread) public {
        wIn = bound(wIn, 1, 100e18);
        price = bound(price, 1e6, 1e13);
        spread = bound(spread, 0, 2000);
        _configure(price, spread);

        uint256 expected = Math.mulDiv(wIn, price * (10_000 - spread), 1e24);
        if (expected == 0) {
            vm.expectRevert(InventoryMarket.ZeroAmount.selector);
            market.quoteSell(wIn);
            return;
        }
        if (expected > CAP) {
            vm.expectRevert(abi.encodeWithSelector(InventoryMarket.TradeTooLarge.selector, expected, CAP));
            market.quoteSell(wIn);
            return;
        }
        (uint256 out,,,) = market.quoteSell(wIn);
        assertEq(out, expected);
        assertEq(_sell(alice, wIn, expected), expected);
    }

    function testFuzz_RoundTripNeverProfitsTrader(uint256 usdcIn, uint256 price, uint256 spread) public {
        usdcIn = bound(usdcIn, 1e6, CAP);
        price = bound(price, 1e6, 1e13);
        spread = bound(spread, 0, 2000);
        _configure(price, spread);

        uint256 usdcBefore = usdc.balanceOf(alice);
        uint256 w = _buy(alice, usdcIn, 0);
        uint256 back = _sell(alice, w, 0);
        assertLe(back, usdcIn);
        assertLe(usdc.balanceOf(alice), usdcBefore);
        // market never lost USDC on the round trip
        assertGe(usdc.balanceOf(address(market)), USDC_INV);
    }
}

// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Test} from "forge-std/Test.sol";
import {InventoryMarketTestBase} from "./InventoryMarket.Base.t.sol";
import {InventoryMarket} from "../InventoryMarket.sol";
import {MockERC20} from "./mocks/MockERC20.sol";

contract MarketHandler is Test {
    InventoryMarket public market;
    MockERC20 public usdc;
    MockERC20 public wnvda;
    uint256 public usdcPaidIn;

    constructor(InventoryMarket m, MockERC20 u, MockERC20 w) {
        market = m;
        usdc = u;
        wnvda = w;
        u.mint(address(this), 1_000_000e6);
        w.mint(address(this), 1_000e18);
        u.approve(address(m), type(uint256).max);
        w.approve(address(m), type(uint256).max);
    }

    function buy(uint256 amt) external {
        amt = bound(amt, 1, 100e6);
        try market.buy(amt, 0) {} catch {}
    }

    function sell(uint256 amt) external {
        amt = bound(amt, 1, 2e18);
        try market.sell(amt, 0) {} catch {}
    }
}

contract InventoryMarketInvariantTest is InventoryMarketTestBase {
    MarketHandler internal handler;
    uint256 internal usdcTotal;
    uint256 internal wnvdaTotal;

    function setUp() public override {
        super.setUp();
        handler = new MarketHandler(market, usdc, wnvda);
        usdcTotal = usdc.balanceOf(address(market)) + usdc.balanceOf(address(handler));
        wnvdaTotal = wnvda.balanceOf(address(market)) + wnvda.balanceOf(address(handler));
        targetContract(address(handler));
    }

    /// Tokens are only moved between market and trader: totals conserved.
    function invariant_TokensConserved() public view {
        assertEq(usdc.balanceOf(address(market)) + usdc.balanceOf(address(handler)), usdcTotal);
        assertEq(wnvda.balanceOf(address(market)) + wnvda.balanceOf(address(handler)), wnvdaTotal);
    }

    /// netUsdcFlow always equals the market's USDC balance change from its seeded level.
    function invariant_FlowMatchesUsdcBalance() public view {
        assertEq(market.netUsdcFlow(), int256(usdc.balanceOf(address(market))) - int256(USDC_INV));
    }

    function invariant_FlowWithinExposureLimit() public view {
        int256 f = market.netUsdcFlow();
        uint256 a = f < 0 ? uint256(-f) : uint256(f);
        assertLe(a, market.maxExposureUsdc());
    }
}

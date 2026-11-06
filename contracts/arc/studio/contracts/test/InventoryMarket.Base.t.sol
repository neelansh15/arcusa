// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Test} from "forge-std/Test.sol";
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";
import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {PriceOracle} from "../PriceOracle.sol";
import {InventoryMarket, IPriceOracle} from "../InventoryMarket.sol";
import {MockERC20} from "./mocks/MockERC20.sol";

abstract contract InventoryMarketTestBase is Test {
    PriceOracle internal oracle;
    InventoryMarket internal market;
    MockERC20 internal usdc;
    MockERC20 internal wnvda;

    address internal owner = makeAddr("owner");
    address internal alice = makeAddr("alice");
    address internal stranger = makeAddr("stranger");

    uint256 internal constant T0 = 1_000_000;
    uint256 internal constant PRICE = 100e8;
    uint256 internal constant STOCK_INV = 1_000e18;
    uint256 internal constant USDC_INV = 100_000e6;

    function setUp() public virtual {
        vm.warp(T0);
        usdc = new MockERC20("USDC", "USDC", 6);
        wnvda = new MockERC20("wNVDA", "wNVDA", 18);
        oracle = new PriceOracle(owner, 300);
        _pushOracle(oracle, PRICE, T0, 1);
        market = new InventoryMarket(owner, IERC20(address(usdc)), IERC20(address(wnvda)), IPriceOracle(address(oracle)));

        usdc.mint(owner, USDC_INV);
        wnvda.mint(owner, STOCK_INV);
        vm.startPrank(owner);
        usdc.approve(address(market), type(uint256).max);
        wnvda.approve(address(market), type(uint256).max);
        market.deposit(IERC20(address(usdc)), USDC_INV);
        market.deposit(IERC20(address(wnvda)), STOCK_INV);
        vm.stopPrank();

        usdc.mint(alice, 10_000e6);
        wnvda.mint(alice, 100e18);
        vm.startPrank(alice);
        usdc.approve(address(market), type(uint256).max);
        wnvda.approve(address(market), type(uint256).max);
        vm.stopPrank();
    }

    function _pushOracle(PriceOracle o, uint256 price, uint256 t, uint8 session) internal {
        vm.prank(owner);
        o.updatePrice(price, uint64(t), PriceOracle.Session(session), 0);
    }

    /// Push a same-price round with a new session, advancing publish time by 1s.
    function _setSession(uint8 session) internal {
        _pushOracle(oracle, PRICE, block.timestamp + 1, session);
        vm.warp(block.timestamp + 1);
    }

    function _buy(address who, uint256 usdcIn, uint256 minOut) internal returns (uint256) {
        vm.prank(who);
        return market.buy(usdcIn, minOut);
    }

    function _sell(address who, uint256 wIn, uint256 minOut) internal returns (uint256) {
        vm.prank(who);
        return market.sell(wIn, minOut);
    }

    /// Leave exactly `keep` of `token` in the market.
    function _drain(MockERC20 token, uint256 keep) internal {
        uint256 bal = token.balanceOf(address(market));
        vm.prank(owner);
        market.withdraw(IERC20(address(token)), bal - keep, owner);
    }

    function _notOwner(address who) internal pure returns (bytes memory) {
        return abi.encodeWithSelector(Ownable.OwnableUnauthorizedAccount.selector, who);
    }
}

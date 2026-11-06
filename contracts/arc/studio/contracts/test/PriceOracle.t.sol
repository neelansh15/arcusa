// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Test} from "forge-std/Test.sol";
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";
import {PriceOracle} from "../PriceOracle.sol";

contract PriceOracleTest is Test {
    PriceOracle internal oracle;
    address internal owner = makeAddr("owner");
    address internal relayer = makeAddr("relayer");
    address internal stranger = makeAddr("stranger");

    uint256 internal constant T0 = 1_000_000;
    uint256 internal constant P = 100e8;
    PriceOracle.Session internal constant REG = PriceOracle.Session.Regular;

    function setUp() public {
        vm.warp(T0);
        oracle = new PriceOracle(owner, 300);
    }

    // ---------------------------------------------------------------- helpers
    function _push(uint256 price, uint256 t) internal {
        vm.prank(owner);
        oracle.updatePrice(price, uint64(t), REG, 0);
    }

    function _seed() internal {
        _push(P, T0);
    }

    function _notOwner(address who) internal pure returns (bytes memory) {
        return abi.encodeWithSelector(Ownable.OwnableUnauthorizedAccount.selector, who);
    }

    // ------------------------------------------------------------ constructor
    function test_Constructor_Defaults() public view {
        assertEq(oracle.owner(), owner);
        assertTrue(oracle.isRelayer(owner));
        assertEq(oracle.maxStaleness(), 300);
        assertEq(oracle.maxConfidenceBps(), 100);
        assertEq(oracle.maxDeviationBps(), 1000);
        assertFalse(oracle.demoMode());
        assertFalse(oracle.gapAccepted());
        assertEq(oracle.decimals(), 8);
    }

    function test_Constructor_EmitsRelayerSetForOwner() public {
        vm.expectEmit(true, false, false, true);
        emit PriceOracle.RelayerSet(owner, true);
        new PriceOracle(owner, 300);
    }

    function test_Constructor_RevertsOnZeroStaleness() public {
        vm.expectRevert(PriceOracle.InvalidParam.selector);
        new PriceOracle(owner, 0);
    }

    function test_Constructor_RevertsAbove7Days() public {
        vm.expectRevert(PriceOracle.InvalidParam.selector);
        new PriceOracle(owner, 7 days + 1);
    }

    function test_Constructor_Accepts7Days() public {
        PriceOracle o = new PriceOracle(owner, 7 days);
        assertEq(o.maxStaleness(), 7 days);
    }

    // ----------------------------------------------------------------- reads
    function test_GetPrice_RevertsNoPriceBeforeUpdate() public {
        vm.expectRevert(PriceOracle.NoPrice.selector);
        oracle.getPrice();
    }

    function test_GetPrice_ReturnsLatest() public {
        vm.prank(owner);
        oracle.updatePrice(P, uint64(T0), PriceOracle.Session.PreMarket, 50);
        (uint256 p, uint64 t, PriceOracle.Session s) = oracle.getPrice();
        assertEq(p, P);
        assertEq(t, T0);
        assertEq(uint8(s), uint8(PriceOracle.Session.PreMarket));
        (, , , uint32 conf, uint256 age, bool stale) = oracle.latestRound();
        assertEq(conf, 50);
        assertEq(age, 0);
        assertFalse(stale);
    }

    function test_LatestRound_NoPriceDoesNotRevert() public view {
        (uint256 p, uint64 t, , , uint256 age, bool stale) = oracle.latestRound();
        assertEq(p, 0);
        assertEq(t, 0);
        assertEq(age, 0);
        assertTrue(stale);
    }

    // -------------------------------------------------------------- staleness
    function test_Staleness_ServedAtExactlyMax() public {
        _seed();
        vm.warp(T0 + 300);
        (uint256 p,,) = oracle.getPrice();
        assertEq(p, P);
    }

    function test_Staleness_RevertsOneSecondLater() public {
        _seed();
        vm.warp(T0 + 301);
        vm.expectRevert(abi.encodeWithSelector(PriceOracle.StalePrice.selector, 301, 300));
        oracle.getPrice();
    }

    function test_Staleness_DemoModeServesStale() public {
        _seed();
        vm.prank(owner);
        oracle.setDemoMode(true);
        vm.warp(T0 + 10 days);
        (uint256 p,,) = oracle.getPrice();
        assertEq(p, P);
    }

    function test_Staleness_LatestRoundNeverRevertsReportsStale() public {
        _seed();
        (,,,, uint256 age, bool stale) = oracle.latestRound();
        assertEq(age, 0);
        assertFalse(stale);
        vm.warp(T0 + 300);
        (,,,, age, stale) = oracle.latestRound();
        assertEq(age, 300);
        assertFalse(stale);
        vm.warp(T0 + 301);
        (,,,, age, stale) = oracle.latestRound();
        assertEq(age, 301);
        assertTrue(stale);
    }

    function test_SetMaxStaleness_ChangesWindow() public {
        _seed();
        vm.expectEmit(false, false, false, true, address(oracle));
        emit PriceOracle.MaxStalenessSet(600);
        vm.prank(owner);
        oracle.setMaxStaleness(600);
        vm.warp(T0 + 600);
        oracle.getPrice();
        vm.warp(T0 + 601);
        vm.expectRevert(abi.encodeWithSelector(PriceOracle.StalePrice.selector, 601, 600));
        oracle.getPrice();
    }

    function test_SetMaxStaleness_Bounds() public {
        vm.startPrank(owner);
        vm.expectRevert(PriceOracle.InvalidParam.selector);
        oracle.setMaxStaleness(0);
        vm.expectRevert(PriceOracle.InvalidParam.selector);
        oracle.setMaxStaleness(7 days + 1);
        oracle.setMaxStaleness(7 days);
        oracle.setMaxStaleness(1);
        vm.stopPrank();
        assertEq(oracle.maxStaleness(), 1);
    }

    // ------------------------------------------------------------- confidence
    function test_Confidence_EqualToMaxAccepted() public {
        vm.prank(owner);
        oracle.updatePrice(P, uint64(T0), REG, 100);
        (,,,, , bool stale) = oracle.latestRound();
        assertFalse(stale);
    }

    function test_Confidence_AboveMaxReverts() public {
        vm.prank(owner);
        vm.expectRevert(abi.encodeWithSelector(PriceOracle.ConfidenceTooWide.selector, 101, 100));
        oracle.updatePrice(P, uint64(T0), REG, 101);
    }

    function test_Confidence_SetGuardsChangesLimit() public {
        vm.expectEmit(false, false, false, true, address(oracle));
        emit PriceOracle.GuardsSet(500, 2000);
        vm.prank(owner);
        oracle.setGuards(500, 2000);
        assertEq(oracle.maxConfidenceBps(), 500);
        assertEq(oracle.maxDeviationBps(), 2000);
        vm.prank(owner);
        oracle.updatePrice(P, uint64(T0), REG, 500);
        vm.prank(owner);
        vm.expectRevert(abi.encodeWithSelector(PriceOracle.ConfidenceTooWide.selector, 501, 500));
        oracle.updatePrice(P, uint64(T0 + 1), REG, 501);
    }

    function test_SetGuards_Bounds() public {
        vm.startPrank(owner);
        vm.expectRevert(PriceOracle.InvalidParam.selector);
        oracle.setGuards(10_001, 1000);
        vm.expectRevert(PriceOracle.InvalidParam.selector);
        oracle.setGuards(100, 0);
        vm.expectRevert(PriceOracle.InvalidParam.selector);
        oracle.setGuards(100, 5001);
        oracle.setGuards(10_000, 5000);
        oracle.setGuards(0, 1);
        vm.stopPrank();
        assertEq(oracle.maxConfidenceBps(), 0);
        assertEq(oracle.maxDeviationBps(), 1);
    }

    // -------------------------------------------------------------- deviation
    function test_Deviation_FirstUpdateExempt() public {
        _push(type(uint128).max, T0);
        (uint256 p,,) = oracle.getPrice();
        assertEq(p, type(uint128).max);
    }

    function test_Deviation_UpAtExactLimitAccepted() public {
        _seed();
        _push(110e8, T0 + 1);
        (uint256 p,,) = oracle.getPrice();
        assertEq(p, 110e8);
    }

    function test_Deviation_UpOneOverReverts() public {
        _seed();
        vm.prank(owner);
        vm.expectRevert(abi.encodeWithSelector(PriceOracle.DeviationTooLarge.selector, P, 110e8 + 1, 1000));
        oracle.updatePrice(110e8 + 1, uint64(T0 + 1), REG, 0);
    }

    function test_Deviation_DownAtExactLimitAccepted() public {
        _seed();
        _push(90e8, T0 + 1);
        (uint256 p,,) = oracle.getPrice();
        assertEq(p, 90e8);
    }

    function test_Deviation_DownOneOverReverts() public {
        _seed();
        vm.prank(owner);
        vm.expectRevert(abi.encodeWithSelector(PriceOracle.DeviationTooLarge.selector, P, 90e8 - 1, 1000));
        oracle.updatePrice(90e8 - 1, uint64(T0 + 1), REG, 0);
    }

    function test_AcceptGap_LetsExactlyOneThrough() public {
        _seed();
        vm.expectEmit(false, false, false, false, address(oracle));
        emit PriceOracle.GapAccepted();
        vm.prank(owner);
        oracle.acceptGap();
        assertTrue(oracle.gapAccepted());

        _push(300e8, T0 + 1); // 200% jump allowed once
        assertFalse(oracle.gapAccepted());
        (uint256 p,,) = oracle.getPrice();
        assertEq(p, 300e8);

        vm.prank(owner);
        vm.expectRevert(abi.encodeWithSelector(PriceOracle.DeviationTooLarge.selector, 300e8, 900e8, 1000));
        oracle.updatePrice(900e8, uint64(T0 + 2), REG, 0);
    }

    function test_AcceptGap_ClearedByAnyUpdate() public {
        _seed();
        vm.prank(owner);
        oracle.acceptGap();
        _push(P + 1, T0 + 1); // small, in-range update consumes the override
        assertFalse(oracle.gapAccepted());
        vm.prank(owner);
        vm.expectRevert();
        oracle.updatePrice(300e8, uint64(T0 + 2), REG, 0);
    }

    function test_AcceptGap_RevertedUpdateKeepsOverrideArmed() public {
        _seed();
        vm.prank(owner);
        oracle.acceptGap();
        vm.prank(owner);
        vm.expectRevert(abi.encodeWithSelector(PriceOracle.PublishTimeNotIncreasing.selector, T0, T0));
        oracle.updatePrice(300e8, uint64(T0), REG, 0);
        assertTrue(oracle.gapAccepted());
    }

    // ----------------------------------------------------------- publish time
    function test_PublishTime_EqualReverts() public {
        _seed();
        vm.prank(owner);
        vm.expectRevert(abi.encodeWithSelector(PriceOracle.PublishTimeNotIncreasing.selector, T0, T0));
        oracle.updatePrice(P, uint64(T0), REG, 0);
    }

    function test_PublishTime_LowerReverts() public {
        _seed();
        vm.prank(owner);
        vm.expectRevert(abi.encodeWithSelector(PriceOracle.PublishTimeNotIncreasing.selector, T0 - 1, T0));
        oracle.updatePrice(P, uint64(T0 - 1), REG, 0);
    }

    function test_PublishTime_StrictlyHigherAccepted() public {
        _seed();
        _push(P, T0 + 1);
        (, uint64 t,) = oracle.getPrice();
        assertEq(t, T0 + 1);
    }

    function test_PublishTime_FuturePlus60Allowed() public {
        _push(P, T0 + 60);
        (, uint64 t,) = oracle.getPrice();
        assertEq(t, T0 + 60);
        // not stale: block time is behind publish time, age reads as 0
        (,,,, uint256 age,) = oracle.latestRound();
        assertEq(age, 0);
    }

    function test_PublishTime_FuturePlus61Reverts() public {
        vm.prank(owner);
        vm.expectRevert(abi.encodeWithSelector(PriceOracle.PublishTimeInFuture.selector, uint64(T0 + 61)));
        oracle.updatePrice(P, uint64(T0 + 61), REG, 0);
    }

    // ----------------------------------------------------------------- price
    function test_InvalidPrice_Zero() public {
        vm.prank(owner);
        vm.expectRevert(PriceOracle.InvalidPrice.selector);
        oracle.updatePrice(0, uint64(T0), REG, 0);
    }

    function test_InvalidPrice_AboveUint128() public {
        vm.prank(owner);
        vm.expectRevert(PriceOracle.InvalidPrice.selector);
        oracle.updatePrice(uint256(type(uint128).max) + 1, uint64(T0), REG, 0);
    }

    // ------------------------------------------------------------------ event
    function test_Update_EmitsPriceUpdated() public {
        vm.expectEmit(true, false, false, true, address(oracle));
        emit PriceOracle.PriceUpdated(P, uint64(T0), PriceOracle.Session.PostMarket, 77, owner);
        vm.prank(owner);
        oracle.updatePrice(P, uint64(T0), PriceOracle.Session.PostMarket, 77);
    }

    // ------------------------------------------------------------- permissions
    function test_Relayer_StrangerReverts() public {
        vm.prank(stranger);
        vm.expectRevert(PriceOracle.NotRelayer.selector);
        oracle.updatePrice(P, uint64(T0), REG, 0);
    }

    function test_Relayer_OwnerAllowedAndEventShowsSender() public {
        vm.expectEmit(true, false, false, true, address(oracle));
        emit PriceOracle.PriceUpdated(P, uint64(T0), REG, 0, owner);
        _seed();
    }

    function test_SetRelayer_AddThenRelayerCanUpdate() public {
        vm.expectEmit(true, false, false, true, address(oracle));
        emit PriceOracle.RelayerSet(relayer, true);
        vm.prank(owner);
        oracle.setRelayer(relayer, true);
        assertTrue(oracle.isRelayer(relayer));

        vm.expectEmit(true, false, false, true, address(oracle));
        emit PriceOracle.PriceUpdated(P, uint64(T0), REG, 0, relayer);
        vm.prank(relayer);
        oracle.updatePrice(P, uint64(T0), REG, 0);
    }

    function test_SetRelayer_RemovedRelayerReverts() public {
        vm.startPrank(owner);
        oracle.setRelayer(relayer, true);
        vm.expectEmit(true, false, false, true, address(oracle));
        emit PriceOracle.RelayerSet(relayer, false);
        oracle.setRelayer(relayer, false);
        vm.stopPrank();
        assertFalse(oracle.isRelayer(relayer));

        vm.prank(relayer);
        vm.expectRevert(PriceOracle.NotRelayer.selector);
        oracle.updatePrice(P, uint64(T0), REG, 0);
    }

    function test_SetDemoMode_OwnerEmits() public {
        vm.expectEmit(false, false, false, true, address(oracle));
        emit PriceOracle.DemoModeSet(true);
        vm.prank(owner);
        oracle.setDemoMode(true);
        assertTrue(oracle.demoMode());
    }

    function test_AdminFunctions_NonOwnerReverts() public {
        vm.startPrank(stranger);
        vm.expectRevert(_notOwner(stranger));
        oracle.setRelayer(stranger, true);
        vm.expectRevert(_notOwner(stranger));
        oracle.setDemoMode(true);
        vm.expectRevert(_notOwner(stranger));
        oracle.setMaxStaleness(10);
        vm.expectRevert(_notOwner(stranger));
        oracle.setGuards(100, 100);
        vm.expectRevert(_notOwner(stranger));
        oracle.acceptGap();
        vm.stopPrank();
    }

    function test_RelayerCannotUseAdminFunctions() public {
        vm.prank(owner);
        oracle.setRelayer(relayer, true);
        vm.startPrank(relayer);
        vm.expectRevert(_notOwner(relayer));
        oracle.acceptGap();
        vm.expectRevert(_notOwner(relayer));
        oracle.setRelayer(relayer, false);
        vm.stopPrank();
    }
}

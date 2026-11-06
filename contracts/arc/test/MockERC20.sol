// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {ERC20} from "@openzeppelin/contracts/token/ERC20/ERC20.sol";

contract MockERC20 is ERC20 {
    uint8 private immutable _d;

    constructor(string memory n, string memory s, uint8 d) ERC20(n, s) {
        _d = d;
    }

    function decimals() public view override returns (uint8) {
        return _d;
    }

    function mint(address to, uint256 amt) external {
        _mint(to, amt);
    }
}

/// Re-enters sell() from transfer to prove the reentrancy guard.
interface IMarketLike { function sell(uint256, uint256) external returns (uint256); }
contract ReentrantToken is ERC20 {
    address public market;
    bool public attack;
    constructor() ERC20("R", "R") {}
    function mint(address to, uint256 a) external { _mint(to, a); }
    function arm(address m) external { market = m; attack = true; }
    function _update(address f, address t, uint256 v) internal override {
        super._update(f, t, v);
        if (attack && f == market) { attack = false; IMarketLike(market).sell(1, 0); }
    }
}

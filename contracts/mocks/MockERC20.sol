// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

/**
 * @title MockERC20
 * @dev Mock ERC20 token for testing purposes
 */
contract MockERC20 is ERC20 {
    uint8 private _decimals;

    constructor(
        string memory name,
        string memory symbol,
        uint8 decimalsValue
    ) ERC20(name, symbol) {
        _decimals = decimalsValue;
        _mint(msg.sender, 1000000000 * 10**decimalsValue); // Mint 1 billion tokens
    }

    function decimals() public view virtual override returns (uint8) {
        return _decimals;
    }

    // Function to mint tokens (for testing)
    function mint(address to, uint256 amount) external {
        _mint(to, amount);
    }
}

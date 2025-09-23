// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title DemCoin
 * @dev The stable, liquid currency of the protocol, earned through Proof of Democratic Work.
 * This is the foundational ERC20 token.
 */
contract DemCoin is ERC20, Ownable {
    
    /**
     * @dev Sets the name and symbol for the DemCoin token.
     */
    constructor() ERC20("DemCoin", "DEM") {}

    /**
     * @dev Creates a new amount of DemCoins and assigns them to an account.
     * This function can only be called by the owner of the contract (which will be the main Governance Protocol).
     *
     * TODO for Claude: Implement the full logic for this function.
     */
    function mint(address to, uint256 amount) public onlyOwner {
        _mint(to, amount);
    }

    /**
     * @dev Destroys a specified amount of DemCoins from an account.
     * This can be used for various economic stabilization mechanisms.
     * Can only be called by the owner.
     *
     * TODO for Claude: Implement the full logic for this function.
     */
    function burn(address from, uint256 amount) public onlyOwner {
        _burn(from, amount);
    }
}

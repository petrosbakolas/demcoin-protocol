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
    
    // Events for transparency
    event DemCoinMinted(address indexed to, uint256 amount);
    event DemCoinBurned(address indexed from, uint256 amount);
    
    // Maximum supply cap (can be adjusted via governance)
    uint256 public maxSupply = 1_000_000_000 * 10**18; // 1 billion DEM
    
    /**
     * @dev Sets the name and symbol for the DemCoin token.
     */
    constructor() ERC20("DemCoin", "DEM") {}
    
    /**
     * @dev Creates a new amount of DemCoins and assigns them to an account.
     * This function can only be called by the owner of the contract (which will be the main Governance Protocol).
     */
    function mint(address to, uint256 amount) public onlyOwner {
        require(to != address(0), "DemCoin: cannot mint to zero address");
        require(amount > 0, "DemCoin: amount must be greater than 0");
        require(totalSupply() + amount <= maxSupply, "DemCoin: would exceed max supply");
        
        _mint(to, amount);
        emit DemCoinMinted(to, amount);
    }
    
    /**
     * @dev Destroys a specified amount of DemCoins from an account.
     * This can be used for various economic stabilization mechanisms.
     * Can only be called by the owner.
     */
    function burn(address from, uint256 amount) public onlyOwner {
        require(from != address(0), "DemCoin: cannot burn from zero address");
        require(amount > 0, "DemCoin: amount must be greater than 0");
        require(balanceOf(from) >= amount, "DemCoin: insufficient balance to burn");
        
        _burn(from, amount);
        emit DemCoinBurned(from, amount);
    }
    
    /**
     * @dev Allows governance to update the maximum supply cap
     */
    function setMaxSupply(uint256 _maxSupply) public onlyOwner {
        require(_maxSupply >= totalSupply(), "DemCoin: new max supply cannot be less than current supply");
        maxSupply = _maxSupply;
    }
}

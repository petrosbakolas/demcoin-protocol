// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title WisdomCoin
 * @dev A non-transferable (soulbound) ERC721 token representing a citizen's reputation.
 * Each WisdomCoin is a unique NFT.
 */
contract WisdomCoin is ERC721, Ownable {
    
    // Counter for token IDs
    uint256 private _tokenIdCounter;
    
    // Track which addresses have been awarded WisdomCoins
    mapping(address => bool) public hasWisdomCoin;
    
    // Track token ID to reputation score (for future use)
    mapping(uint256 => uint256) public reputationScore;
    
    // Events
    event WisdomCoinAwarded(address indexed citizen, uint256 indexed tokenId);
    event ReputationUpdated(uint256 indexed tokenId, uint256 newScore);
    
    /**
     * @dev Sets the name and symbol for the WisdomCoin token.
     */
    constructor() ERC721("WisdomCoin", "WISDOM") {}
    
    /**
     * @dev Mints a new, unique WisdomCoin to a citizen.
     * Can only be called by the owner (the Governance Protocol).
     * Ensures each citizen can only receive one WisdomCoin.
     */
    function awardWisdomCoin(address citizen) public onlyOwner {
        require(citizen != address(0), "WisdomCoin: cannot award to zero address");
        require(!hasWisdomCoin[citizen], "WisdomCoin: citizen already has a WisdomCoin");
        
        _tokenIdCounter++;
        uint256 tokenId = _tokenIdCounter;
        
        _safeMint(citizen, tokenId);
        hasWisdomCoin[citizen] = true;
        reputationScore[tokenId] = 1; // Starting reputation score
        
        emit WisdomCoinAwarded(citizen, tokenId);
    }
    
    /**
     * @dev Updates the reputation score for a specific token
     */
    function updateReputation(uint256 tokenId, uint256 newScore) public onlyOwner {
        require(_exists(tokenId), "WisdomCoin: token does not exist");
        reputationScore[tokenId] = newScore;
        emit ReputationUpdated(tokenId, newScore);
    }
    
    /**
     * @dev Get the current token ID counter
     */
    function getCurrentTokenId() public view returns (uint256) {
        return _tokenIdCounter;
    }
    
    /**
     * @dev Override to make tokens non-transferable (soulbound)
     */
    function _beforeTokenTransfer(
        address from,
        address to,
        uint256 tokenId,
        uint256 batchSize
    ) internal override {
        // Only allow minting (from == address(0)) and burning (to == address(0))
        require(from == address(0) || to == address(0), "WisdomCoin: tokens are non-transferable");
        super._beforeTokenTransfer(from, to, tokenId, batchSize);
    }
    
    /**
     * @dev Override approve to prevent approvals (since tokens can't be transferred)
     */
    function approve(address, uint256) public pure override {
        revert("WisdomCoin: approvals not allowed for soulbound tokens");
    }
    
    /**
     * @dev Override setApprovalForAll to prevent approvals
     */
    function setApprovalForAll(address, bool) public pure override {
        revert("WisdomCoin: approvals not allowed for soulbound tokens");
    }
    
    /**
     * @dev Override getApproved to always return zero address
     */
    function getApproved(uint256) public pure override returns (address) {
        return address(0);
    }
    
    /**
     * @dev Override isApprovedForAll to always return false
     */
    function isApprovedForAll(address, address) public pure override returns (bool) {
        return false;
    }
}

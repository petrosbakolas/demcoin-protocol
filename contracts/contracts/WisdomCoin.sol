// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/Counters.sol";

/**
 * @title WisdomCoin
 * @dev A non-transferable (soulbound) ERC721 token representing a citizen's reputation.
 * Each WisdomCoin is a unique NFT.
 */
contract WisdomCoin is ERC721, Ownable {
    using Counters for Counters.Counter;
    Counters.Counter private _tokenIdCounter;

    /**
     * @dev Sets the name and symbol for the WisdomCoin token.
     */
    constructor() ERC721("WisdomCoin", "WISDOM") {}

    /**
     * @dev Mints a new, unique WisdomCoin to a citizen.
     * Can only be called by the owner (the Governance Protocol).
     *
     * TODO for Claude: Implement logic to ensure a citizen (address) can only ever be awarded one WisdomCoin.
     * A mapping from address to bool (e.g., `mapping(address => bool) public hasWisdomCoin;`) could work.
     */
    function awardWisdomCoin(address citizen) public onlyOwner {
        // require(!hasWisdomCoin[citizen], "Citizen already has a WisdomCoin");
        _tokenIdCounter.increment();
        uint256 tokenId = _tokenIdCounter.current();
        _safeMint(citizen, tokenId);
        // hasWisdomCoin[citizen] = true;
    }

    /**
     * @dev Overrides the standard transfer functions to make the token non-transferable (soulbound).
     * Any attempt to transfer a WisdomCoin will fail.
     *
     * TODO for Claude: Ensure all transfer-related functions are overridden to revert.
     */
    function _beforeTokenTransfer(address from, address to, uint256 tokenId, uint256 batchSize) internal override {
        require(from == address(0), "WisdomCoins are non-transferable");
        super._beforeTokenTransfer(from, to, tokenId, batchSize);
    }
}

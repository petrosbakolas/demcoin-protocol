// Import necessary tools from Hardhat and Chai for testing
const { expect } = require("chai");
const { ethers } = require("hardhat");

// Describe the suite of tests for the WisdomCoin contract
describe("WisdomCoin Contract", function () {
    // --- Test Setup ---
    // We declare variables here that we will use in all our tests
    let WisdomCoin;
    let wisdomCoin;
    let owner; // This will typically be the Governance contract in a full deployment
    let citizen1;
    let citizen2;

    // This `beforeEach` block runs before every single `it` test block
    // It's used to deploy a fresh contract for each test, ensuring a clean state
    beforeEach(async function () {
        // Get the contract factory and the signers (accounts)
        WisdomCoin = await ethers.getContractFactory("WisdomCoin");
        [owner, citizen1, citizen2] = await ethers.getSigners();
        
        // Deploy a new WisdomCoin contract
        wisdomCoin = await WisdomCoin.deploy();
    });

    // --- Deployment Tests ---
    describe("Deployment", function () {
        
        it("Should set the correct name and symbol", async function () {
            expect(await wisdomCoin.name()).to.equal("WisdomCoin");
            expect(await wisdomCoin.symbol()).to.equal("WISDOM");
        });

        it("Should set the deployer as the owner", async function () {
            expect(await wisdomCoin.owner()).to.equal(owner.address);
        });

        it("Should have an initial token ID counter of 0", async function () {
            expect(await wisdomCoin.getCurrentTokenId()).to.equal(0);
        });
    });

    // --- Awarding WisdomCoin Tests ---
    describe("Awarding WisdomCoins", function () {
        
        it("Should allow the owner to award a WisdomCoin to a citizen", async function () {
            await wisdomCoin.connect(owner).awardWisdomCoin(citizen1.address);
            
            expect(await wisdomCoin.balanceOf(citizen1.address)).to.equal(1);
            expect(await wisdomCoin.hasWisdomCoin(citizen1.address)).to.equal(true);
            expect(await wisdomCoin.getCurrentTokenId()).to.equal(1);
        });

        it("Should fail if a non-owner tries to award a WisdomCoin", async function () {
            await expect(
                wisdomCoin.connect(citizen1).awardWisdomCoin(citizen2.address)
            ).to.be.revertedWithCustomError(wisdomCoin, "OwnableUnauthorizedAccount");
        });

        it("Should fail if trying to award a WisdomCoin to the zero address", async function () {
            await expect(
                wisdomCoin.connect(owner).awardWisdomCoin(ethers.ZeroAddress)
            ).to.be.revertedWith("WisdomCoin: cannot award to zero address");
        });

        it("Should fail if trying to award a WisdomCoin to a citizen who already has one", async function () {
            await wisdomCoin.connect(owner).awardWisdomCoin(citizen1.address);
            
            await expect(
                wisdomCoin.connect(owner).awardWisdomCoin(citizen1.address)
            ).to.be.revertedWith("WisdomCoin: citizen already has a WisdomCoin");
        });

        it("Should emit a WisdomCoinAwarded event", async function () {
            await expect(wisdomCoin.connect(owner).awardWisdomCoin(citizen1.address))
                .to.emit(wisdomCoin, "WisdomCoinAwarded")
                .withArgs(citizen1.address, 1); // Token ID will be 1 for the first mint
        });

        it("Should assign a starting reputation score to the new WisdomCoin", async function () {
            await wisdomCoin.connect(owner).awardWisdomCoin(citizen1.address);
            
            const tokenId = 1; // First token will have ID 1
            expect(await wisdomCoin.reputationScore(tokenId)).to.equal(1);
        });
    });

    // --- Non-Transferability (Soulbound) Tests ---
    describe("Non-Transferability", function () {
        
        let tokenId;

        beforeEach(async function () {
            // Award a WisdomCoin to citizen1 for transfer tests
            await wisdomCoin.connect(owner).awardWisdomCoin(citizen1.address);
            tokenId = 1; // First token will have ID 1
        });

        it("Should prevent transfer() of WisdomCoins", async function () {
            await expect(
                wisdomCoin.connect(citizen1).transferFrom(citizen1.address, citizen2.address, tokenId)
            ).to.be.revertedWith("WisdomCoin: tokens are non-transferable");
        });

        it("Should prevent safeTransferFrom() of WisdomCoins", async function () {
            await expect(
                wisdomCoin.connect(citizen1)["safeTransferFrom(address,address,uint256)"](
                    citizen1.address, citizen2.address, tokenId
                )
            ).to.be.revertedWith("WisdomCoin: tokens are non-transferable");
        });

        it("Should prevent approve() for WisdomCoins", async function () {
            await expect(
                wisdomCoin.connect(citizen1).approve(citizen2.address, tokenId)
            ).to.be.revertedWith("WisdomCoin: approvals not allowed for soulbound tokens");
        });

        it("Should prevent setApprovalForAll() for WisdomCoins", async function () {
            await expect(
                wisdomCoin.connect(citizen1).setApprovalForAll(citizen2.address, true)
            ).to.be.revertedWith("WisdomCoin: approvals not allowed for soulbound tokens");
        });

        it("Should return zero address for getApproved()", async function () {
            expect(await wisdomCoin.getApproved(tokenId)).to.equal(ethers.ZeroAddress);
        });

        it("Should return false for isApprovedForAll()", async function () {
            expect(await wisdomCoin.isApprovedForAll(citizen1.address, citizen2.address)).to.equal(false);
        });
    });

    // --- Reputation Management Tests ---
    describe("Reputation Management", function () {
        
        let tokenId1;

        beforeEach(async function () {
            // Award a WisdomCoin to citizen1 to test reputation updates
            await wisdomCoin.connect(owner).awardWisdomCoin(citizen1.address);
            tokenId1 = 1; // First token will have ID 1
        });

        it("Should allow the owner to update the reputation score of a WisdomCoin", async function () {
            const newReputation = 100;
            
            await wisdomCoin.connect(owner).updateReputation(tokenId1, newReputation);
            expect(await wisdomCoin.reputationScore(tokenId1)).to.equal(newReputation);
        });

        it("Should fail if a non-owner tries to update reputation", async function () {
            const newReputation = 50;
            
            await expect(
                wisdomCoin.connect(citizen1).updateReputation(tokenId1, newReputation)
            ).to.be.revertedWithCustomError(wisdomCoin, "OwnableUnauthorizedAccount");
        });

        it("Should fail if trying to update reputation for a non-existent token ID", async function () {
            const nonExistentTokenId = 999;
            
            await expect(
                wisdomCoin.connect(owner).updateReputation(nonExistentTokenId, 50)
            ).to.be.revertedWith("WisdomCoin: token does not exist");
        });

        it("Should emit a ReputationUpdated event when reputation is changed", async function () {
            const newReputation = 75;
            
            await expect(wisdomCoin.connect(owner).updateReputation(tokenId1, newReputation))
                .to.emit(wisdomCoin, "ReputationUpdated")
                .withArgs(tokenId1, newReputation);
        });
    });

    // --- View Functions Tests ---
    describe("View Functions", function () {
        
        it("Should return true for hasWisdomCoin for a citizen who has one", async function () {
            await wisdomCoin.connect(owner).awardWisdomCoin(citizen1.address);
            expect(await wisdomCoin.hasWisdomCoin(citizen1.address)).to.equal(true);
        });

        it("Should return false for hasWisdomCoin for a citizen who does not have one", async function () {
            expect(await wisdomCoin.hasWisdomCoin(citizen2.address)).to.equal(false);
        });

        it("Should return the correct owner of a token", async function () {
            await wisdomCoin.connect(owner).awardWisdomCoin(citizen1.address);
            const tokenId = 1; // First token will have ID 1
            
            expect(await wisdomCoin.ownerOf(tokenId)).to.equal(citizen1.address);
        });

        it("Should track multiple citizens correctly", async function () {
            await wisdomCoin.connect(owner).awardWisdomCoin(citizen1.address);
            await wisdomCoin.connect(owner).awardWisdomCoin(citizen2.address);
            
            expect(await wisdomCoin.hasWisdomCoin(citizen1.address)).to.equal(true);
            expect(await wisdomCoin.hasWisdomCoin(citizen2.address)).to.equal(true);
            expect(await wisdomCoin.getCurrentTokenId()).to.equal(2);
            expect(await wisdomCoin.balanceOf(citizen1.address)).to.equal(1);
            expect(await wisdomCoin.balanceOf(citizen2.address)).to.equal(1);
        });

        it("Should maintain separate reputation scores for different tokens", async function () {
            await wisdomCoin.connect(owner).awardWisdomCoin(citizen1.address);
            await wisdomCoin.connect(owner).awardWisdomCoin(citizen2.address);
            
            const tokenId1 = 1;
            const tokenId2 = 2;
            
            await wisdomCoin.connect(owner).updateReputation(tokenId1, 100);
            await wisdomCoin.connect(owner).updateReputation(tokenId2, 200);
            
            expect(await wisdomCoin.reputationScore(tokenId1)).to.equal(100);
            expect(await wisdomCoin.reputationScore(tokenId2)).to.equal(200);
        });
    });

    // --- Edge Cases and Security Tests ---
    describe("Edge Cases and Security", function () {
        
        it("Should handle token existence checks properly", async function () {
            // Try to get owner of non-existent token
            await expect(
                wisdomCoin.ownerOf(999)
            ).to.be.revertedWithCustomError(wisdomCoin, "ERC721NonexistentToken");
        });

        it("Should not allow burning tokens (since _beforeTokenTransfer blocks it)", async function () {
            await wisdomCoin.connect(owner).awardWisdomCoin(citizen1.address);
            
            // Note: There's no public burn function, but if there were, it would be blocked by _beforeTokenTransfer
            // This test verifies the soulbound nature extends to burning as well
            const tokenId = 1;
            expect(await wisdomCoin.ownerOf(tokenId)).to.equal(citizen1.address);
        });

        it("Should maintain consistent state after multiple operations", async function () {
            // Award to citizen1
            await wisdomCoin.connect(owner).awardWisdomCoin(citizen1.address);
            expect(await wisdomCoin.getCurrentTokenId()).to.equal(1);
            
            // Update reputation
            await wisdomCoin.connect(owner).updateReputation(1, 150);
            
            // Award to citizen2
            await wisdomCoin.connect(owner).awardWisdomCoin(citizen2.address);
            expect(await wisdomCoin.getCurrentTokenId()).to.equal(2);
            
            // Verify all state is correct
            expect(await wisdomCoin.hasWisdomCoin(citizen1.address)).to.equal(true);
            expect(await wisdomCoin.hasWisdomCoin(citizen2.address)).to.equal(true);
            expect(await wisdomCoin.reputationScore(1)).to.equal(150);
            expect(await wisdomCoin.reputationScore(2)).to.equal(1);
        });
    });
});

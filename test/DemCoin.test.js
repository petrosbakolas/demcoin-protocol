// Import necessary tools from Hardhat and Chai for testing
const { expect } = require("chai");
const { ethers } = require("hardhat");

// Describe the suite of tests for the DemCoin contract
describe("DemCoin Contract", function () {
    // --- Test Setup ---
    // We declare variables here that we will use in all our tests
    let DemCoin;
    let demCoin;
    let owner;
    let addr1;
    let addr2;

    // This `beforeEach` block runs before every single `it` test block
    // It's used to deploy a fresh contract for each test, ensuring a clean state
    beforeEach(async function () {
        // Get the contract factory and the signers (accounts)
        DemCoin = await ethers.getContractFactory("DemCoin");
        [owner, addr1, addr2] = await ethers.getSigners();
        
        // Deploy a new DemCoin contract
        demCoin = await DemCoin.deploy();
    });

    // --- Deployment Tests ---
    describe("Deployment", function () {
        
        it("Should set the correct name and symbol", async function () {
            expect(await demCoin.name()).to.equal("DemCoin");
            expect(await demCoin.symbol()).to.equal("DEM");
        });

        it("Should assign the total supply of tokens to the owner", async function () {
            // Initial supply should be 0
            expect(await demCoin.totalSupply()).to.equal(0);
            expect(await demCoin.balanceOf(owner.address)).to.equal(0);
        });
        
        it("Should set the correct owner", async function () {
            expect(await demCoin.owner()).to.equal(owner.address);
        });
    });

    // --- Minting Function Tests ---
    describe("Minting", function () {
        
        it("Should allow the owner to mint new tokens", async function () {
            const mintAmount = ethers.parseEther("1000");
            
            // Mint tokens to addr1
            await demCoin.connect(owner).mint(addr1.address, mintAmount);
            
            // Check addr1's balance
            expect(await demCoin.balanceOf(addr1.address)).to.equal(mintAmount);
            
            // Check total supply increased
            expect(await demCoin.totalSupply()).to.equal(mintAmount);
        });

        it("Should fail if a non-owner tries to mint tokens", async function () {
            const mintAmount = ethers.parseEther("1000");
            
            // Try to mint from non-owner account
            await expect(
                demCoin.connect(addr1).mint(addr2.address, mintAmount)
            ).to.be.revertedWithCustomError(demCoin, "OwnableUnauthorizedAccount");
        });

        it("Should not exceed the max supply", async function () {
            // Set a smaller max supply for testing (e.g., 500 tokens)
            const newMaxSupply = ethers.parseEther("500");
            await demCoin.connect(owner).setMaxSupply(newMaxSupply);
            
            // Try to mint more than max supply
            const excessiveAmount = ethers.parseEther("600");
            await expect(
                demCoin.connect(owner).mint(addr1.address, excessiveAmount)
            ).to.be.revertedWith("DemCoin: would exceed max supply");
        });

        it("Should emit DemCoinMinted event when minting", async function () {
            const mintAmount = ethers.parseEther("100");
            
            await expect(demCoin.connect(owner).mint(addr1.address, mintAmount))
                .to.emit(demCoin, "DemCoinMinted")
                .withArgs(addr1.address, mintAmount);
        });

        it("Should reject minting to zero address", async function () {
            const mintAmount = ethers.parseEther("100");
            
            await expect(
                demCoin.connect(owner).mint(ethers.ZeroAddress, mintAmount)
            ).to.be.revertedWith("DemCoin: cannot mint to zero address");
        });

        it("Should reject minting zero amount", async function () {
            await expect(
                demCoin.connect(owner).mint(addr1.address, 0)
            ).to.be.revertedWith("DemCoin: amount must be greater than 0");
        });
    });

    // --- Burning Function Tests ---
    describe("Burning", function () {
        
        beforeEach(async function () {
            // Mint some tokens to addr1 for burning tests
            await demCoin.connect(owner).mint(addr1.address, ethers.parseEther("100"));
        });

        it("Should allow the owner to burn tokens from any account", async function () {
            const burnAmount = ethers.parseEther("50");
            const initialBalance = await demCoin.balanceOf(addr1.address);
            const initialSupply = await demCoin.totalSupply();
            
            // Burn tokens from addr1
            await demCoin.connect(owner).burn(addr1.address, burnAmount);
            
            // Check addr1's balance decreased
            expect(await demCoin.balanceOf(addr1.address)).to.equal(initialBalance - burnAmount);
            
            // Check total supply decreased
            expect(await demCoin.totalSupply()).to.equal(initialSupply - burnAmount);
        });

        it("Should fail if a non-owner tries to burn tokens", async function () {
            const burnAmount = ethers.parseEther("50");
            
            // Try to burn from non-owner account
            await expect(
                demCoin.connect(addr1).burn(addr1.address, burnAmount)
            ).to.be.revertedWithCustomError(demCoin, "OwnableUnauthorizedAccount");
        });

        it("Should emit DemCoinBurned event when burning", async function () {
            const burnAmount = ethers.parseEther("30");
            
            await expect(demCoin.connect(owner).burn(addr1.address, burnAmount))
                .to.emit(demCoin, "DemCoinBurned")
                .withArgs(addr1.address, burnAmount);
        });

        it("Should reject burning from zero address", async function () {
            const burnAmount = ethers.parseEther("50");
            
            await expect(
                demCoin.connect(owner).burn(ethers.ZeroAddress, burnAmount)
            ).to.be.revertedWith("DemCoin: cannot burn from zero address");
        });

        it("Should reject burning zero amount", async function () {
            await expect(
                demCoin.connect(owner).burn(addr1.address, 0)
            ).to.be.revertedWith("DemCoin: amount must be greater than 0");
        });

        it("Should fail when burning more than account balance", async function () {
            const excessiveAmount = ethers.parseEther("200"); // More than the 100 minted
            
            await expect(
                demCoin.connect(owner).burn(addr1.address, excessiveAmount)
            ).to.be.revertedWith("DemCoin: insufficient balance to burn");
        });
    });

    // --- Max Supply Management Tests ---
    describe("Max Supply Management", function () {
        
        it("Should allow owner to update max supply", async function () {
            const newMaxSupply = ethers.parseEther("2000000");
            
            await demCoin.connect(owner).setMaxSupply(newMaxSupply);
            expect(await demCoin.maxSupply()).to.equal(newMaxSupply);
        });

        it("Should reject setting max supply below current total supply", async function () {
            // Mint some tokens first
            await demCoin.connect(owner).mint(addr1.address, ethers.parseEther("1000"));
            
            // Try to set max supply below current supply
            const lowMaxSupply = ethers.parseEther("500");
            await expect(
                demCoin.connect(owner).setMaxSupply(lowMaxSupply)
            ).to.be.revertedWith("DemCoin: new max supply cannot be less than current supply");
        });

        it("Should reject non-owner setting max supply", async function () {
            const newMaxSupply = ethers.parseEther("2000000");
            
            await expect(
                demCoin.connect(addr1).setMaxSupply(newMaxSupply)
            ).to.be.revertedWithCustomError(demCoin, "OwnableUnauthorizedAccount");
        });
    });

    // --- Standard ERC20 Functionality Tests ---
    describe("ERC20 Functionality", function () {
        
        beforeEach(async function () {
            // Mint tokens to test ERC20 functions
            await demCoin.connect(owner).mint(addr1.address, ethers.parseEther("1000"));
        });

        it("Should allow token transfers between accounts", async function () {
            const transferAmount = ethers.parseEther("100");
            
            await demCoin.connect(addr1).transfer(addr2.address, transferAmount);
            
            expect(await demCoin.balanceOf(addr1.address)).to.equal(ethers.parseEther("900"));
            expect(await demCoin.balanceOf(addr2.address)).to.equal(transferAmount);
        });

        it("Should allow approved spending", async function () {
            const approveAmount = ethers.parseEther("100");
            
            // Approve addr2 to spend tokens from addr1
            await demCoin.connect(addr1).approve(addr2.address, approveAmount);
            
            // Check allowance
            expect(await demCoin.allowance(addr1.address, addr2.address)).to.equal(approveAmount);
            
            // Use the allowance
            await demCoin.connect(addr2).transferFrom(addr1.address, addr2.address, approveAmount);
            
            expect(await demCoin.balanceOf(addr2.address)).to.equal(approveAmount);
            expect(await demCoin.allowance(addr1.address, addr2.address)).to.equal(0);
        });
    });
});

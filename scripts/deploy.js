const { ethers } = require("hardhat");
const fs = require('fs');
const path = require('path');

async function main() {
  console.log("🚀 Starting DemCoin Protocol Deployment...\n");

  // Get the deployer account
  const [deployer] = await ethers.getSigners();
  console.log("Deploying contracts with account:", deployer.address);
  console.log("Account balance:", ethers.formatEther(await deployer.provider.getBalance(deployer.address)), "ETH\n");

  // Deploy DemCoin
  console.log("📊 Deploying DemCoin...");
  const DemCoin = await ethers.getContractFactory("DemCoin");
  const demCoin = await DemCoin.deploy();
  await demCoin.waitForDeployment();
  console.log("✅ DemCoin deployed to:", await demCoin.getAddress());

  // Deploy WisdomCoin
  console.log("🎖️ Deploying WisdomCoin...");
  const WisdomCoin = await ethers.getContractFactory("WisdomCoin");
  const wisdomCoin = await WisdomCoin.deploy();
  await wisdomCoin.waitForDeployment();
  console.log("✅ WisdomCoin deployed to:", await wisdomCoin.getAddress());

  // Deploy Governance
  console.log("🏛️ Deploying Governance...");
  const Governance = await ethers.getContractFactory("Governance");
  const governance = await Governance.deploy(
    await demCoin.getAddress(),
    await wisdomCoin.getAddress()
  );
  await governance.waitForDeployment();
  console.log("✅ Governance deployed to:", await governance.getAddress());

  // Transfer ownership of tokens to Governance contract
  console.log("\n🔐 Transferring ownership to Governance...");
  await demCoin.transferOwnership(await governance.getAddress());
  console.log("✅ DemCoin ownership transferred");
  
  await wisdomCoin.transferOwnership(await governance.getAddress());
  console.log("✅ WisdomCoin ownership transferred");

  // Save deployment addresses
  const deploymentInfo = {
    network: hre.network.name,
    chainId: (await ethers.provider.getNetwork()).chainId.toString(),
    deployer: deployer.address,
    timestamp: new Date().toISOString(),
    contracts: {
      DemCoin: {
        address: await demCoin.getAddress(),
        name: "DemCoin",
        symbol: "DEM"
      },
      WisdomCoin: {
        address: await wisdomCoin.getAddress(),
        name: "WisdomCoin",
        symbol: "WISDOM"
      },
      Governance: {
        address: await governance.getAddress(),
        description: "Central governance contract"
      }
    }
  };

  const deploymentsDir = path.join(__dirname, '../deployments');
  if (!fs.existsSync(deploymentsDir)) {
    fs.mkdirSync(deploymentsDir, { recursive: true });
  }

  const deploymentFile = path.join(deploymentsDir, `${hre.network.name}-deployment.json`);
  fs.writeFileSync(deploymentFile, JSON.stringify(deploymentInfo, null, 2));

  console.log("\n📄 Deployment info saved to:", deploymentFile);
  console.log("\n🎉 DemCoin Protocol deployment complete!");
  
  // Display summary
  console.log("\n" + "=".repeat(50));
  console.log("DEPLOYMENT SUMMARY");
  console.log("=".repeat(50));
  console.log(`Network: ${hre.network.name}`);
  console.log(`DemCoin: ${await demCoin.getAddress()}`);
  console.log(`WisdomCoin: ${await wisdomCoin.getAddress()}`);
  console.log(`Governance: ${await governance.getAddress()}`);
  console.log("=".repeat(50));
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });

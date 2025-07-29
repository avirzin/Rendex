import { ethers } from "hardhat";

async function main() {
  console.log("🚀 Starting simplified Rendex deployment...");

  // Get deployer account
  const [deployer] = await ethers.getSigners();
  console.log("📝 Deploying contracts with account:", deployer.address);
  console.log("💰 Account balance:", ethers.formatEther(await deployer.provider!.getBalance(deployer.address)), "ETH");

  // Deploy CDI Oracle first
  console.log("\n📊 Deploying CDI Oracle...");
  const CDIOracle = await ethers.getContractFactory("CDIOracle");
  
  // Initial CDI rate: 10% (1000 basis points)
  const initialCDI = 1000; // 10% in basis points
  const cdiOracle = await CDIOracle.deploy(initialCDI);
  await cdiOracle.waitForDeployment();
  
  const cdiOracleAddress = await cdiOracle.getAddress();
  console.log("✅ CDI Oracle deployed to:", cdiOracleAddress);
  console.log("📈 Initial CDI rate set to:", initialCDI / 100, "%");

  // Deploy RendexToken directly
  console.log("\n🪙 Deploying RendexToken...");
  const RendexToken = await ethers.getContractFactory("RendexToken");
  
  const tokenName = "Rendex Token";
  const tokenSymbol = "RDX";
  const initialSupply = ethers.parseEther("1000000"); // 1M tokens
  
  const rendexToken = await RendexToken.deploy(
    tokenName,
    tokenSymbol,
    cdiOracleAddress,
    initialSupply
  );
  await rendexToken.waitForDeployment();
  
  const tokenAddress = await rendexToken.getAddress();
  console.log("✅ RendexToken deployed to:", tokenAddress);
  console.log("📝 Token name:", tokenName);
  console.log("📝 Token symbol:", tokenSymbol);
  console.log("💰 Initial supply:", ethers.formatEther(initialSupply), "tokens");

  // Set up oracle permissions
  console.log("\n🔐 Setting up oracle permissions...");
  
  // Authorize token to update CDI rates (if needed)
  const authorizeTx = await cdiOracle.setAuthorizedUpdater(tokenAddress, true);
  await authorizeTx.wait();
  console.log("✅ Token authorized to update CDI rates");

  // Verify deployments
  console.log("\n🔍 Verifying deployments...");
  
  const oracleStats = await cdiOracle.getOracleStats();
  console.log("📊 Oracle stats:");
  console.log("   - Current CDI:", oracleStats[0].toString(), "basis points");
  console.log("   - Last update:", new Date(Number(oracleStats[1]) * 1000).toISOString());
  console.log("   - Is stale:", oracleStats[2]);
  console.log("   - Is paused:", oracleStats[3]);

  const tokenStats = await rendexToken.getRebaseStats();
  console.log("📊 Token stats:");
  console.log("   - Last rebase time:", new Date(Number(tokenStats[0]) * 1000).toISOString());
  console.log("   - Next rebase time:", new Date(Number(tokenStats[1]) * 1000).toISOString());
  console.log("   - Rebase count:", tokenStats[2].toString());
  console.log("   - Current CDI:", tokenStats[3].toString(), "basis points");
  console.log("   - Rebase rate:", tokenStats[4].toString(), "basis points");
  console.log("   - Rebase ready:", tokenStats[5]);

  // Check token ownership
  console.log("👑 Token owner:", await rendexToken.owner());
  console.log("👑 Oracle owner:", await cdiOracle.owner());

  // Deployment summary
  console.log("\n🎉 Simplified deployment completed successfully!");
  console.log("=" .repeat(50));
  console.log("📋 Contract Addresses:");
  console.log("   CDI Oracle:", cdiOracleAddress);
  console.log("   RendexToken:", tokenAddress);
  console.log("=" .repeat(50));
  
  // Save deployment info
  const deploymentInfo = {
    network: (await ethers.provider.getNetwork()).name,
    deployer: deployer.address,
    contracts: {
      cdiOracle: cdiOracleAddress,
      rendexToken: tokenAddress,
    },
    token: {
      name: tokenName,
      symbol: tokenSymbol,
      initialSupply: ethers.formatEther(initialSupply),
    },
    oracle: {
      initialCDI: initialCDI,
      cdiPercent: initialCDI / 100,
    },
    timestamp: new Date().toISOString(),
  };

  console.log("\n💾 Deployment info:", JSON.stringify(deploymentInfo, null, 2));
  
  return deploymentInfo;
}

// Handle errors
main().catch((error) => {
  console.error("❌ Deployment failed:", error);
  process.exitCode = 1;
}); 
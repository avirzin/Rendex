import { ethers } from "hardhat";
import * as fs from "fs";

async function main() {
  console.log("🚀 Starting Rendex deployment...");

  const [deployer] = await ethers.getSigners();
  console.log("📝 Deploying contracts with account:", deployer.address);
  console.log("💰 Account balance:", ethers.formatEther(await deployer.provider!.getBalance(deployer.address)), "ETH");

  // Read parameters from .env, with sensible defaults
  const initialCDI = parseInt(process.env.INITIAL_CDI_RATE || "1000");
  const tokenName = process.env.TOKEN_NAME || "Rendex Token";
  const tokenSymbol = process.env.TOKEN_SYMBOL || "RDX";
  const initialSupply = ethers.parseEther(process.env.INITIAL_SUPPLY || "1000000");

  // Deploy CDI Oracle
  console.log("\n📊 Deploying CDI Oracle...");
  const CDIOracle = await ethers.getContractFactory("CDIOracle");
  const cdiOracle = await CDIOracle.deploy(initialCDI, deployer.address);
  await cdiOracle.waitForDeployment();
  const cdiOracleAddress = await cdiOracle.getAddress();
  console.log("✅ CDI Oracle deployed to:", cdiOracleAddress);
  console.log("📈 Initial CDI rate:", initialCDI, `(${initialCDI / 10000}%/day)`);

  // Deploy RendexToken
  console.log("\n🪙 Deploying RendexToken...");
  const RendexToken = await ethers.getContractFactory("RendexToken");
  const rendexToken = await RendexToken.deploy(
    tokenName,
    tokenSymbol,
    cdiOracleAddress,
    initialSupply,
    deployer.address
  );
  await rendexToken.waitForDeployment();
  const tokenAddress = await rendexToken.getAddress();
  console.log("✅ RendexToken deployed to:", tokenAddress);
  console.log("📝 Token:", tokenName, `(${tokenSymbol})`);
  console.log("💰 Initial supply:", ethers.formatEther(initialSupply), "tokens");

  // Authorize oracle service wallet if provided
  console.log("\n🔐 Setting up oracle permissions...");
  if (process.env.ORACLE_UPDATER_ADDRESS) {
    const authorizeTx = await cdiOracle.setAuthorizedUpdater(process.env.ORACLE_UPDATER_ADDRESS, true);
    await authorizeTx.wait();
    console.log("✅ Oracle service wallet authorized:", process.env.ORACLE_UPDATER_ADDRESS);
  } else {
    console.log("ℹ️  ORACLE_UPDATER_ADDRESS not set — only the deployer wallet can call updateCDI() for now.");
  }

  // Print on-chain state
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
  console.log("   - Current CDI:", tokenStats[3].toString(), "basis points");
  console.log("   - Daily rebase rate:", tokenStats[4].toString(), "basis points");

  // Save addresses to file so oracle-service can read them
  const network = (await ethers.provider.getNetwork()).name;
  const deploymentInfo = {
    network,
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
      initialCDI,
      cdiPercent: initialCDI / 10000,
    },
    timestamp: new Date().toISOString(),
  };

  fs.mkdirSync("deployments", { recursive: true });
  fs.writeFileSync(`deployments/${network}.json`, JSON.stringify(deploymentInfo, null, 2));

  console.log("\n🎉 Deployment completed!");
  console.log("=".repeat(50));
  console.log("📋 Contract Addresses:");
  console.log("   CDI Oracle: ", cdiOracleAddress);
  console.log("   RendexToken:", tokenAddress);
  console.log("=".repeat(50));
  console.log(`💾 Addresses saved to deployments/${network}.json`);
  console.log("👉 Copy CDI_ORACLE_ADDRESS into oracle-service/.env to start the oracle.");

  return deploymentInfo;
}

main().catch((error) => {
  console.error("❌ Deployment failed:", error);
  process.exitCode = 1;
});

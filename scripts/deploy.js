const hre = require("hardhat");
require("dotenv").config();

async function main() {
  const isLocalNetwork = hre.network.name === "hardhat" || hre.network.name === "localhost";

  // Validate PRIVATE_KEY when targeting remote networks (like bohrTestnet)
  if (!isLocalNetwork) {
    const key = process.env.PRIVATE_KEY ? process.env.PRIVATE_KEY.trim() : "";
    if (!key || key === "your_private_key_here") {
      console.error("\n[Error] Missing PRIVATE_KEY environment variable.");
      console.error("Please configure your deployer PRIVATE_KEY in the .env file before deploying to BOT Chain Bohr Testnet.\n");
      process.exit(1);
    }
  }

  const [deployer] = await hre.ethers.getSigners();
  if (!deployer) {
    console.error("\n[Error] No deployer account found. Ensure PRIVATE_KEY is set in .env.\n");
    process.exit(1);
  }

  const networkInfo = await hre.ethers.provider.getNetwork();
  console.log("----------------------------------------------------");
  console.log("Deploying Vestali Crowdfunding Contract");
  console.log("Network:", hre.network.name);
  console.log("Chain ID:", networkInfo.chainId.toString());
  console.log("Deployer Address:", deployer.address);
  console.log("----------------------------------------------------");

  const Vestali = await hre.ethers.getContractFactory("Vestali");
  const vestali = await Vestali.deploy();
  await vestali.waitForDeployment();

  const contractAddress = await vestali.getAddress();
  console.log("Vestali deployed successfully!");
  console.log("Contract Address:", contractAddress);
  console.log("----------------------------------------------------");
}

main().catch((error) => {
  console.error("Deployment failed:", error);
  process.exitCode = 1;
});

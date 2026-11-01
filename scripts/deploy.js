const hre = require("hardhat");
require("dotenv").config();

const EXPECTED_CHAIN_IDS = {
  botMainnet: 677n,
  mainnet: 677n,
  bohrTestnet: 968n,
};

async function main() {
  const isLocalNetwork = hre.network.name === "hardhat" || hre.network.name === "localhost";

  // Validate PRIVATE_KEY when targeting remote networks (like botMainnet or bohrTestnet)
  if (!isLocalNetwork) {
    const key = process.env.PRIVATE_KEY ? process.env.PRIVATE_KEY.trim() : "";
    if (!key || key === "your_private_key_here") {
      console.error("\n[Error] Missing PRIVATE_KEY environment variable.");
      console.error("Please configure your deployer PRIVATE_KEY in the .env file before deploying.\n");
      process.exit(1);
    }
  }

  const [deployer] = await hre.ethers.getSigners();
  if (!deployer) {
    console.error("\n[Error] No deployer account found. Ensure PRIVATE_KEY is configured in .env.\n");
    process.exit(1);
  }

  const networkInfo = await hre.ethers.provider.getNetwork();
  const currentChainId = networkInfo.chainId;

  // Strict network verification: verify chain ID before sending any transaction
  if (!isLocalNetwork) {
    const expectedChainId = EXPECTED_CHAIN_IDS[hre.network.name];
    if (expectedChainId !== undefined) {
      if (currentChainId !== expectedChainId) {
        console.error("\n[Error] Network chain ID mismatch!");
        console.error(
          `Target network '${hre.network.name}' expects chain ID ${expectedChainId.toString()}, but connected RPC reported ${currentChainId.toString()}.`
        );
        console.error("Refusing to deploy to the wrong network.\n");
        process.exit(1);
      }
    } else {
      console.error(`\n[Error] Unrecognized network target '${hre.network.name}'.`);
      console.error("Expected 'botMainnet' (Chain ID 677) or 'bohrTestnet' (Chain ID 968).\n");
      process.exit(1);
    }
  }

  // Check deployer native BOT balance before attempting deployment
  const balance = await hre.ethers.provider.getBalance(deployer.address);
  if (!isLocalNetwork && balance === 0n) {
    console.error(`\n[Error] Deployer account ${deployer.address} has 0 BOT balance.`);
    console.error("Please fund your deployer wallet with native BOT before deploying.\n");
    process.exit(1);
  }

  console.log("----------------------------------------------------");
  console.log("Deploying Vestali Crowdfunding Contract");
  console.log("Target Network:", hre.network.name);
  console.log("Verified Chain ID:", currentChainId.toString());
  console.log("Deployer Address:", deployer.address);
  console.log("Deployer Balance:", hre.ethers.formatEther(balance), "BOT");
  console.log("----------------------------------------------------");

  const Vestali = await hre.ethers.getContractFactory("Vestali");
  const vestali = await Vestali.deploy();
  await vestali.waitForDeployment();

  const contractAddress = await vestali.getAddress();
  const deployTx = vestali.deploymentTransaction();
  const txHash = deployTx ? deployTx.hash : "N/A";
  const receipt = deployTx ? await deployTx.wait() : null;
  const blockNumber = receipt ? receipt.blockNumber : await hre.ethers.provider.getBlockNumber();

  console.log("Vestali deployed successfully!");
  console.log("Contract Address:", contractAddress);
  console.log("Deployment Tx Hash:", txHash);
  console.log("Deployment Block Number:", blockNumber.toString());

  // Verify contract code exists at deployed address
  const code = await hre.ethers.provider.getCode(contractAddress);
  const codeVerified = code && code !== "0x" && code !== "0x0";
  console.log("Contract Bytecode Verified On-Chain:", codeVerified ? "YES" : "NO");
  console.log("----------------------------------------------------");
}

main().catch((error) => {
  console.error("Deployment failed:", error);
  process.exitCode = 1;
});

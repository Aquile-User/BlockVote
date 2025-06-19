// scripts/deploy.js

const hre = require("hardhat");
require("dotenv").config();

async function main() {
  // 1) Build a Wallet for the relayer, using RELAYER_PRIVATE_KEY
  const relayerPk = process.env.RELAYER_PRIVATE_KEY || process.env.RELAYER_PK;
  if (!relayerPk) {
    console.error("ERROR: RELAYER_PRIVATE_KEY is not set in .env");
    process.exit(1);
  }
  // Use the same RPC provider configured in hardhat.config.js
  const provider = new hre.ethers.JsonRpcProvider(
    process.env.BLOCKCHAIN_RPC_URL || process.env.RPC_URL
  );
  const relayerWallet = new hre.ethers.Wallet(relayerPk, provider);
  console.log("Using relayer:", relayerWallet.address);

  // 2) Tell HardHat to use this wallet as the deployer
  const Voting = await hre.ethers.getContractFactory("Voting", relayerWallet);

  // 3) Pass relayerWallet.address into constructor so it becomes trustedRelayer
  const voting = await Voting.deploy(relayerWallet.address);
  await voting.waitForDeployment(); // ethers v6 style
  console.log("Voting contract deployed at:", voting.target);
  console.log("⮕ Copy that address into .env as VOTING_CONTRACT_ADDRESS");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});

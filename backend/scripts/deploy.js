// scripts/deploy.js

const hre = require("hardhat");
const fs = require("fs");
const path = require("path");
const dns = require("dns");
require("dotenv").config();

if (dns.setDefaultResultOrder) {
  dns.setDefaultResultOrder("ipv4first");
}

const envPath = path.resolve(__dirname, "..", ".env");

function updateEnvFile(updates) {
  const existing = fs.existsSync(envPath)
    ? fs.readFileSync(envPath, "utf8").split(/\r?\n/)
    : [];
  const updatedKeys = new Set();
  const nextLines = existing.map((line) => {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#") || !trimmed.includes("=")) {
      return line;
    }

    const equalsIndex = line.indexOf("=");
    const key = line.slice(0, equalsIndex).trim();

    if (Object.prototype.hasOwnProperty.call(updates, key)) {
      updatedKeys.add(key);
      return `${key}=${updates[key]}`;
    }

    return line;
  });

  for (const [key, value] of Object.entries(updates)) {
    if (!updatedKeys.has(key)) {
      nextLines.push(`${key}=${value}`);
    }
  }

  fs.writeFileSync(envPath, `${nextLines.join("\n")}\n`, "utf8");
}

async function main() {
  // 1) Build a Wallet for the relayer, using RELAYER_PRIVATE_KEY
  const relayerPk = process.env.RELAYER_PRIVATE_KEY || process.env.RELAYER_PK;
  if (!relayerPk) {
    console.error("ERROR: RELAYER_PRIVATE_KEY is not set in .env");
    process.exit(1);
  }
  // Use the same RPC provider configured in hardhat.config.js
  const provider = new hre.ethers.JsonRpcProvider(
    process.env.BLOCKCHAIN_RPC_URL || process.env.RPC_URL,
  );
  const relayerWallet = new hre.ethers.Wallet(relayerPk, provider);
  console.log("Using relayer:", relayerWallet.address);

  // 2) Tell HardHat to use this wallet as the deployer
  const Voting = await hre.ethers.getContractFactory("Voting", relayerWallet);

  // 3) Pass relayerWallet.address into constructor so it becomes trustedRelayer
  const voting = await Voting.deploy(relayerWallet.address);
  await voting.waitForDeployment(); // ethers v6 style
  console.log("Voting contract deployed at:", voting.target);

  updateEnvFile({
    VOTING_CONTRACT_ADDRESS: voting.target,
    CONTRACT_ADDRESS: voting.target,
  });

  console.log("⮕ La address se guardó automáticamente en .env");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});

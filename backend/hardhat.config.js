// hardhat.config.js

require("@nomicfoundation/hardhat-toolbox");
require("dotenv").config();

module.exports = {
  solidity: "0.8.20",
  networks: {
    megaeth: {
      url: process.env.BLOCKCHAIN_RPC_URL || process.env.RPC_URL, // e.g. "https://carrot.megaeth.com/rpc"
      accounts: [process.env.RELAYER_PRIVATE_KEY || process.env.RELAYER_PK], // 32-byte private key, 64 hex chars + 0x
      chainId: 6342,
    },
  },
  paths: {
    sources: "./contracts",
    tests: "./test",
    cache: "./cache",
    artifacts: "./artifacts",
  },
};

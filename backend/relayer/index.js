// relayer/index.js

require("dotenv").config();
const express = require("express");
const { ethers } = require("ethers");

// Load the ABI of Voting contract
const votingJson = require("../artifacts/contracts/Voting.sol/Voting.json");
const abi = votingJson.abi;

// MegaETH provider & relayer wallet
const provider = new ethers.JsonRpcProvider(process.env.RPC_URL);
const relayerWallet = new ethers.Wallet(process.env.RELAYER_PK, provider);

// Voting contract instance (using relayer wallet)
const votingContract = new ethers.Contract(
  process.env.CONTRACT_ADDRESS,
  abi,
  relayerWallet
);

const app = express();
app.use(express.json());

/**
 * POST /meta-vote
 * Request body: { electionId, selectedCandidate, voter, signature }
 * Relayer pays gas and calls voteMeta on-chain.
 */
app.post("/meta-vote", async (req, res) => {
  console.log("Relayer received vote request:", req.body);
  try {
    const { electionId, selectedCandidate, voter, signature } = req.body;

    // Validate required parameters
    if (!electionId || !selectedCandidate || !voter || !signature) {
      return res.status(400).json({
        error:
          "Missing required parameters: electionId, selectedCandidate, voter, signature",
      });
    }
    const candidate = selectedCandidate;
    const tx = await votingContract.voteMeta(
      electionId,
      candidate,
      voter,
      signature,
      {
        gasLimit: 200_000,
        maxFeePerGas: ethers.parseUnits("0.1", "gwei"),
        maxPriorityFeePerGas: ethers.parseUnits("0.01", "gwei"),
      }
    );
    const receipt = await tx.wait();
    return res.json({
      success: true,
      txHash: receipt.transactionHash,
      blockNumber: receipt.blockNumber,
    });
  } catch (error) {
    console.error("Relayer error:", error || error);
    return res.status(500).json({ error: error.message });
  }
});

const PORT = 3001;
app.listen(PORT, () => {
  console.log(`🚀 Relayer listening on http://localhost:${PORT}`);
});

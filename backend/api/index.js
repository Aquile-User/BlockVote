// api/index.js

require("dotenv").config();
const express = require("express");
const cors = require("cors");
const fetch = require("node-fetch");
const axios = require("axios");
const { ethers } = require("ethers");
const fs = require("fs");
const path = require("path");
const swaggerUi = require("swagger-ui-express");
const swaggerJsdoc = require("swagger-jsdoc");

// Load the ABI of Voting contract
const votingJson = require("../artifacts/contracts/Voting.sol/Voting.json");
const abi = votingJson.abi;

const app = express();
app.use(cors());
app.use(express.json());

// Load or initialize user database (socialId -> wallet {address, privateKey})
const usersFile = path.resolve(__dirname, "../users.json");
let users = {};
if (fs.existsSync(usersFile)) {
  users = JSON.parse(fs.readFileSync(usersFile, "utf8"));
}

function saveUsers() {
  fs.writeFileSync(usersFile, JSON.stringify(users, null, 2));
}

// Swagger setup
const swaggerDefinition = {
  openapi: "3.0.0",
  info: {
    title: "Meta-Transaction Voting API",
    version: "1.0.0",
    description: "API docs for gasless voting on MegaETH testnet",
  },
  servers: [{ url: "http://localhost:3000", description: "Local server" }],
};

const options = {
  swaggerDefinition,
  apis: ["./api/index.js"],
};

const swaggerSpec = swaggerJsdoc(options);
app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));

// Read-only provider for contract interactions
const provider = new ethers.JsonRpcProvider(process.env.RPC_URL);
const votingContract = new ethers.Contract(
  process.env.CONTRACT_ADDRESS,
  abi,
  provider
);

// ================= User Management =================

/**
 * @swagger
 * /users/register:
 *   post:
 *     summary: Register a user by social ID, generate a wallet, and fund it
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               socialId:
 *                 type: string
 *     responses:
 *       200:
 *         description: User registered successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 socialId:
 *                   type: string
 *                 address:
 *                   type: string
 *                 privateKey:
 *                   type: string
 *                 fundTxHash:
 *                   type: string
 */
app.post("/users/register", async (req, res) => {
  try {
    const { socialId } = req.body;
    if (!socialId) return res.status(400).json({ error: "Missing socialId" });
    if (users[socialId])
      return res.status(400).json({ error: "User already exists" });

    // Generate a new wallet
    const wallet = ethers.Wallet.createRandom();
    const privateKey = wallet.privateKey;
    const address = wallet.address;

    // Fund wallet with 0.001 ETH for gas (lowered from 0.01)
    const relayerWallet = new ethers.Wallet(process.env.RELAYER_PK, provider);
    const fundTx = await relayerWallet.sendTransaction({
      to: address,
      value: ethers.parseEther("0.0000001"),
    });
    await fundTx.wait();

    // Store user mapping
    users[socialId] = { address, privateKey };
    saveUsers();

    res.json({ socialId, address, privateKey, fundTxHash: fundTx.hash });
  } catch (error) {
    console.error("User register error:", error.message || error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * @swagger
 * /users/{socialId}:
 *   get:
 *     summary: Get wallet info by social ID
 *     parameters:
 *       - in: path
 *         name: socialId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Wallet info
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 socialId:
 *                   type: string
 *                 address:
 *                   type: string
 */
app.get("/users/:socialId", (req, res) => {
  const { socialId } = req.params;
  const user = users[socialId];
  if (!user) return res.status(404).json({ error: "User not found" });
  res.json({ socialId, address: user.address });
});

// ================= Election Management =================

/**
 * @swagger
 * /elections:
 *   get:
 *     summary: List all elections (IDs & names)
 *     responses:
 *       200:
 *         description: Array of elections
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   electionId:
 *                     type: integer
 *                   name:
 *                     type: string
 */
app.get("/elections", async (req, res) => {
  try {
    const list = [];
    const nextIdBN = await votingContract.nextElectionId();
    const nextId = Number(nextIdBN);
    for (let i = 1; i < nextId; i++) {
      const [name, _] = await votingContract.getElection(i);
      list.push({ electionId: i, name });
    }
    res.json(list);
  } catch (error) {
    console.error("List elections error:", error.message || error);
    res.status(500).json({ error: error.message });
  }
});

// ================= Election Management =================

/**
 * @swagger
 * /elections/create:
 *   post:
 *     summary: Create a new election (with start/end dates)
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - candidates
 *               - startTime
 *               - endTime
 *             properties:
 *               name:
 *                 type: string
 *                 description: Display name of the election
 *               candidates:
 *                 type: array
 *                 items:
 *                   type: string
 *                 description: Array of candidate names
 *               startTime:
 *                 type: integer
 *                 description: UNIX timestamp (in seconds) when voting opens
 *               endTime:
 *                 type: integer
 *                 description: UNIX timestamp (in seconds) when voting closes
 *     responses:
 *       200:
 *         description: Election created (tx hash + block)
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 txHash:
 *                   type: string
 *                 blockNumber:
 *                   type: integer
 *       400:
 *         description: Bad request (e.g., missing fields or endTime ≤ startTime)
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 */
app.post("/elections/create", async (req, res) => {
  try {
    const { name, candidates, startTime, endTime } = req.body;
    if (!name || !Array.isArray(candidates) || !startTime || !endTime) {
      return res.status(400).json({ error: "Missing required fields" });
    }
    if (endTime <= startTime) {
      return res.status(400).json({ error: "endTime must be > startTime" });
    }

    const signer = new ethers.Wallet(process.env.RELAYER_PK, provider);
    const contractWithSigner = new ethers.Contract(
      process.env.CONTRACT_ADDRESS,
      abi,
      signer
    );

    const tx = await contractWithSigner.createElection(
      name,
      candidates,
      startTime,
      endTime,
      {
        gasLimit: 500_000,
        maxFeePerGas: ethers.parseUnits("5", "gwei"),
        maxPriorityFeePerGas: ethers.parseUnits("1", "gwei"),
      }
    );
    const receipt = await tx.wait();
    res.json({
      success: true,
      txHash: receipt.transactionHash,
      blockNumber: receipt.blockNumber,
    });
  } catch (error) {
    console.error("Create election error:", error.message || error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * @swagger
 * /elections/{id}:
 *   get:
 *     summary: Get election details by ID (including start/end times and disabled flag)
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Election ID
 *     responses:
 *       200:
 *         description: Election details
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 electionId:
 *                   type: integer
 *                 name:
 *                   type: string
 *                 candidates:
 *                   type: array
 *                   items:
 *                     type: string
 *                 startTime:
 *                   type: integer
 *                   description: UNIX timestamp (seconds)
 *                 endTime:
 *                   type: integer
 *                   description: UNIX timestamp (seconds)
 *                 disabled:
 *                   type: boolean
 *                   description: True if voting is disabled
 *       404:
 *         description: Election not found
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 */
app.get("/elections/:id", async (req, res) => {
  try {
    const electionId = parseInt(req.params.id, 10);
    const nextIdBN = await votingContract.nextElectionId();
    const nextId = Number(nextIdBN);
    if (electionId < 1 || electionId >= nextId) {
      return res.status(404).json({ error: "Election not found" });
    }
    let [name, candidates, startTime, endTime, disabled] =
      await votingContract.getElection(electionId);
    startTime = Number(startTime);
    endTime = Number(endTime);
    // console.log("Election details:", { electionId, name, candidates, startTime, endTime, disabled });
    res.json({ electionId, name, candidates, startTime, endTime, disabled });
  } catch (error) {
    console.error("Get election error:", error.message || error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * @swagger
 * /elections/{id}/disable:
 *   put:
 *     summary: Disable voting for an election
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Election ID
 *     responses:
 *       200:
 *         description: Election disabled successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 txHash:
 *                   type: string
 *                 blockNumber:
 *                   type: integer
 *       404:
 *         description: Election not found
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 */
app.put("/elections/:id/disable", async (req, res) => {
  try {
    const electionId = parseInt(req.params.id, 10);
    const nextIdBN = await votingContract.nextElectionId();
    const nextId = Number(nextIdBN);
    if (electionId < 1 || electionId >= nextId) {
      return res.status(404).json({ error: "Election not found" });
    }

    const signer = new ethers.Wallet(process.env.RELAYER_PK, provider);
    const contractWithSigner = new ethers.Contract(
      process.env.CONTRACT_ADDRESS,
      abi,
      signer
    );

    const tx = await contractWithSigner.disableElection(electionId, {
      gasLimit: 100_000,
      maxFeePerGas: ethers.parseUnits("5", "gwei"),
      maxPriorityFeePerGas: ethers.parseUnits("1", "gwei"),
    });
    const receipt = await tx.wait();
    res.json({
      success: true,
      txHash: receipt.transactionHash,
      blockNumber: receipt.blockNumber,
    });
  } catch (error) {
    console.error("Disable election error:", error.message || error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * @swagger
 * /elections/{id}/enable:
 *   put:
 *     summary: Re-enable voting for a disabled election
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Election ID
 *     responses:
 *       200:
 *         description: Election enabled successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 txHash:
 *                   type: string
 *                 blockNumber:
 *                   type: integer
 *       404:
 *         description: Election not found
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 */
app.put("/elections/:id/enable", async (req, res) => {
  try {
    const electionId = parseInt(req.params.id, 10);
    const nextIdBN = await votingContract.nextElectionId();
    const nextId = Number(nextIdBN);
    if (electionId < 1 || electionId >= nextId) {
      return res.status(404).json({ error: "Election not found" });
    }

    const signer = new ethers.Wallet(process.env.RELAYER_PK, provider);
    const contractWithSigner = new ethers.Contract(
      process.env.CONTRACT_ADDRESS,
      abi,
      signer
    );

    const tx = await contractWithSigner.enableElection(electionId, {
      gasLimit: 100_000,
      maxFeePerGas: ethers.parseUnits("5", "gwei"),
      maxPriorityFeePerGas: ethers.parseUnits("1", "gwei"),
    });
    const receipt = await tx.wait();
    res.json({
      success: true,
      txHash: receipt.transactionHash,
      blockNumber: receipt.blockNumber,
    });
  } catch (error) {
    console.error("Enable election error:", error.message || error);
    res.status(500).json({ error: error.message });
  }
});

// GET /elections/:id/results (no change needed for time/disabled—it’s read-only)

/**
 * @swagger
 * /elections/{id}/edit-name:
 *   put:
 *     summary: Change an existing election’s name
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *     responses:
 *       200:
 *         description: Name updated
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 txHash:
 *                   type: string
 *                 blockNumber:
 *                   type: integer
 */
app.put("/elections/:id/edit-name", async (req, res) => {
  try {
    const electionId = parseInt(req.params.id, 10);
    const nextIdBN = await votingContract.nextElectionId();
    const nextId = Number(nextIdBN);
    if (electionId < 1 || electionId >= nextId) {
      return res.status(404).json({ error: "Election not found" });
    }
    const { name } = req.body;
    if (!name) return res.status(400).json({ error: "Missing new name" });

    const signer = new ethers.Wallet(process.env.RELAYER_PK, provider);
    const contractWithSigner = new ethers.Contract(
      process.env.CONTRACT_ADDRESS,
      abi,
      signer
    );

    const tx = await contractWithSigner.updateElectionName(electionId, name, {
      gasLimit: 100_000,
      maxFeePerGas: ethers.parseUnits("5", "gwei"),
      maxPriorityFeePerGas: ethers.parseUnits("1", "gwei"),
    });
    const receipt = await tx.wait();
    res.json({
      success: true,
      txHash: receipt.transactionHash,
      blockNumber: receipt.blockNumber,
    });
  } catch (error) {
    console.error("Edit name error:", error.message || error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * @swagger
 * /elections/{id}/add-candidate:
 *   put:
 *     summary: Add a candidate to an existing election
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               candidate:
 *                 type: string
 *     responses:
 *       200:
 *         description: Candidate added
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 txHash:
 *                   type: string
 *                 blockNumber:
 *                   type: integer
 */
app.put("/elections/:id/add-candidate", async (req, res) => {
  try {
    const electionId = parseInt(req.params.id, 10);
    const nextIdBN = await votingContract.nextElectionId();
    const nextId = Number(nextIdBN);
    if (electionId < 1 || electionId >= nextId) {
      return res.status(404).json({ error: "Election not found" });
    }
    const { candidate } = req.body;
    if (!candidate)
      return res.status(400).json({ error: "Missing candidate name" });

    const signer = new ethers.Wallet(process.env.RELAYER_PK, provider);
    const contractWithSigner = new ethers.Contract(
      process.env.CONTRACT_ADDRESS,
      abi,
      signer
    );

    const tx = await contractWithSigner.addCandidate(electionId, candidate, {
      gasLimit: 100_000,
      maxFeePerGas: ethers.parseUnits("5", "gwei"),
      maxPriorityFeePerGas: ethers.parseUnits("1", "gwei"),
    });
    const receipt = await tx.wait();
    res.json({
      success: true,
      txHash: receipt.transactionHash,
      blockNumber: receipt.blockNumber,
    });
  } catch (error) {
    console.error("Add candidate error:", error.message || error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * @swagger
 * /elections/{id}/results:
 *   get:
 *     summary: View current vote counts for an election
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Results by candidate
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               additionalProperties:
 *                 type: integer
 */
app.get("/elections/:id/results", async (req, res) => {
  try {
    const electionId = parseInt(req.params.id, 10);
    const nextIdBN = await votingContract.nextElectionId();
    const nextId = Number(nextIdBN);
    if (electionId < 1 || electionId >= nextId) {
      return res.status(404).json({ error: "Election not found" });
    }

    const candidates = await votingContract.getCandidates(electionId);
    const results = {};
    for (let i = 0; i < candidates.length; i++) {
      const name = candidates[i];
      const countBN = await votingContract.getVoteCount(electionId, name);
      results[name] = Number(countBN);
    }
    res.json(results);
  } catch (error) {
    console.error("Get results error:", error.message || error);
    res.status(500).json({ error: error.message });
  }
});

// ================= Voting =================

/**
 * @swagger
 * /vote:
 *   post:
 *     summary: Vote in an election via social ID (meta-transaction)
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               socialId:
 *                 type: string
 *               electionId:
 *                 type: integer
 *               candidate:
 *                 type: string
 *               signature:
 *                 type: string
 *     responses:
 *       200:
 *         description: Vote submitted (txHash + block)
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 txHash:
 *                   type: string
 *                 blockNumber:
 *                   type: integer
 */
app.post("/vote", async (req, res) => {
  try {
    const { socialId, electionId, selectedCandidate, signature } = req.body;
    if (!socialId || !electionId || !selectedCandidate || !signature) {
      return res.status(400).json({ error: "Missing fields" });
    }

    const user = users[socialId];
    if (!user) return res.status(400).json({ error: "User not registered" });

    const voterAddress = user.address;

    // Build message hash exactly as contract expects
    const messageHash = ethers.solidityPackedKeccak256(
      ["uint256", "string", "address"],
      [electionId, selectedCandidate, voterAddress]
    );
    const ethMessage = ethers.hashMessage(messageHash);

    // Verify signature was signed by this user
    // `signMessage(bytes)` automatically prefixes internally, so we only need to call verifyMessage on the same bytes:
    const recovered = ethers.verifyMessage(messageHash, signature);
    console.log("Recovered address:", recovered);
    console.log("Voter address:", voterAddress);
    if (recovered.toLowerCase() !== voterAddress.toLowerCase()) {
      return res.status(400).json({ error: "Invalid signature for this user" });
    }

    // Forward to relayer
    const relayerUrl = "http://localhost:3001/meta-vote";
    const response = await axios.post(
      relayerUrl,
      {
        electionId,
        candidate,
        voter: voterAddress,
        signature,
      },
      {
        headers: { "Content-Type": "application/json" },
      }
    );
    const data = await response.json();
    res.json(data);
  } catch (error) {
    console.error("Vote error:", error.message || error);
    res.status(500).json({ error: error.message });
  }
});

const PORT = 3000;
app.listen(PORT, () => {
  console.log(`🗳 API server running on http://localhost:${PORT}`);
});

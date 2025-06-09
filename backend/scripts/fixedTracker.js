const ethers = require("ethers");
const dotenv = require("dotenv");
const path = require("path");

// Load environment from parent directory
dotenv.config({ path: path.join(__dirname, "../.env") });

// Load the contract ABI
const votingJson = require("../artifacts/contracts/Voting.sol/Voting.json");
const abi = votingJson.abi;

// Configuration
const RPC_URL = process.env.RPC_URL || "https://carrot.megaeth.com/rpc";
const CONTRACT_ADDRESS = process.env.CONTRACT_ADDRESS || "0xB514AaB6e30497db5C16d283a6CbB2251f9c5220";

console.log("🔧 Configuration:");
console.log(`RPC URL: ${RPC_URL}`);
console.log(`Contract Address: ${CONTRACT_ADDRESS}`);
console.log("==========================================\n");

/**
 * Fetch vote history with smaller block ranges to avoid RPC limits
 */
async function fetchVoteHistoryOptimized() {
  console.log("📜 Fetching vote history from events...\n");
  
  const provider = new ethers.JsonRpcProvider(RPC_URL);
  const contract = new ethers.Contract(CONTRACT_ADDRESS, abi, provider);
  
  try {
    // Get current block number
    const currentBlock = await provider.getBlockNumber();
    console.log(`Current block: ${currentBlock}`);
    
    // Query recent blocks (last 10000 blocks to avoid RPC limits)
    const fromBlock = Math.max(0, currentBlock - 10000);
    
    console.log(`Searching from block ${fromBlock} to ${currentBlock}...\n`);
    
    // Get all VotedMeta events
    const filter = contract.filters.VotedMeta();
    const events = await contract.queryFilter(filter, fromBlock, currentBlock);
    
    if (events.length === 0) {
      console.log("❌ No votes found in recent blocks");
      return;
    }
    
    console.log(`✅ Found ${events.length} votes\n`);
    console.log("📊 VOTE HISTORY:");
    console.log("================");
    
    for (const event of events) {
      const { electionId, candidate, voter, timestamp } = event.args;
      const block = await provider.getBlock(event.blockNumber);
      const date = new Date(Number(block.timestamp) * 1000);
      
      console.log(`🗳️  Election ID: ${electionId}`);
      console.log(`   👤 Voter: ${voter}`);
      console.log(`   🎯 Candidate: ${candidate}`);
      console.log(`   ⏰ Time: ${date.toISOString()}`);
      console.log(`   🧾 Tx Hash: ${event.transactionHash}`);
      console.log(`   📦 Block: ${event.blockNumber}`);
      console.log("   ─────────────────────────────────────");
    }
    
  } catch (error) {
    console.error("❌ Error fetching vote history:", error.message);
  }
}

/**
 * Fetch all election data from the contract
 */
async function fetchElectionData() {
  console.log("🏛️ Fetching election data...\n");
  
  const provider = new ethers.JsonRpcProvider(RPC_URL);
  const contract = new ethers.Contract(CONTRACT_ADDRESS, abi, provider);
  
  try {
    // Get next election ID to know how many elections exist
    const nextElectionId = await contract.nextElectionId();
    const totalElections = Number(nextElectionId) - 1;
    console.log(`Total elections: ${totalElections}\n`);
    
    if (totalElections <= 0) {
      console.log("❌ No elections found");
      return;
    }
    
    console.log("📋 ELECTION DETAILS:");
    console.log("====================");
    
    for (let i = 1; i <= totalElections; i++) {
      try {
        // Use getElection function that returns (name, candidates, startTime, endTime, disabled)
        const [name, candidates, startTime, endTime, disabled] = await contract.getElection(i);
        
        console.log(`\n🏛️  Election #${i}`);
        console.log(`   📝 Name: ${name}`);
        console.log(`   ⏰ Start: ${new Date(Number(startTime) * 1000).toISOString()}`);
        console.log(`   🔚 End: ${new Date(Number(endTime) * 1000).toISOString()}`);
        console.log(`   ❌ Disabled: ${disabled}`);
        console.log(`   👥 Candidates: ${candidates.length}`);
        
        // Get candidates and their vote counts
        console.log(`   🎯 Candidate List:`);
        for (const candidate of candidates) {
          const voteCount = await contract.getVoteCount(i, candidate);
          console.log(`      • ${candidate} (${voteCount} votes)`);
        }
        
        console.log("   ─────────────────────────────────────");
      } catch (error) {
        console.log(`❌ Error fetching election ${i}:`, error.message);
      }
    }
    
  } catch (error) {
    console.error("❌ Error fetching election data:", error.message);
  }
}

/**
 * Export all data to JSON
 */
async function exportToJSON() {
  console.log("💾 Exporting all data to JSON...\n");
  
  const provider = new ethers.JsonRpcProvider(RPC_URL);
  const contract = new ethers.Contract(CONTRACT_ADDRESS, abi, provider);
  
  const exportData = {
    contractAddress: CONTRACT_ADDRESS,
    timestamp: new Date().toISOString(),
    elections: [],
    votes: []
  };
    try {
    // Get elections
    const nextElectionId = await contract.nextElectionId();
    const totalElections = Number(nextElectionId) - 1;
    
    for (let i = 1; i <= totalElections; i++) {
      try {
        const [name, candidates, startTime, endTime, disabled] = await contract.getElection(i);
        
        const candidateData = [];
        for (const candidate of candidates) {
          const voteCount = await contract.getVoteCount(i, candidate);
          candidateData.push({
            name: candidate,
            votes: Number(voteCount)
          });
        }
        
        exportData.elections.push({
          id: Number(i),
          name: name,
          startTime: new Date(Number(startTime) * 1000).toISOString(),
          endTime: new Date(Number(endTime) * 1000).toISOString(),
          disabled: disabled,
          candidates: candidateData
        });
      } catch (error) {
        console.log(`❌ Error processing election ${i}:`, error.message);
      }
    }
    
    // Get vote events
    const currentBlock = await provider.getBlockNumber();
    const fromBlock = Math.max(0, currentBlock - 10000);
    
    const filter = contract.filters.VotedMeta();
    const events = await contract.queryFilter(filter, fromBlock, currentBlock);
    
    for (const event of events) {
      const { electionId, candidate, voter, timestamp } = event.args;
      const block = await provider.getBlock(event.blockNumber);
      
      exportData.votes.push({
        electionId: Number(electionId),
        candidate: candidate,
        voter: voter,
        timestamp: new Date(Number(block.timestamp) * 1000).toISOString(),
        transactionHash: event.transactionHash,
        blockNumber: event.blockNumber
      });
    }
    
    // Save to file
    const fs = require("fs");
    const filename = `election-data-${Date.now()}.json`;
    fs.writeFileSync(filename, JSON.stringify(exportData, null, 2));
    
    console.log(`✅ Data exported to ${filename}`);
    console.log(`📊 Summary:`);
    console.log(`   Elections: ${exportData.elections.length}`);
    console.log(`   Votes: ${exportData.votes.length}`);
    
  } catch (error) {
    console.error("❌ Error exporting data:", error.message);
  }
}

// Main execution
async function main() {
  console.log("🚀 Blockchain Voting Data Tracker");
  console.log("==================================\n");
  
  const command = process.argv[2];
  
  switch (command) {
    case 'votes':
      await fetchVoteHistoryOptimized();
      break;
    case 'elections':
      await fetchElectionData();
      break;
    case 'export':
      await exportToJSON();
      break;
    case 'all':
      await fetchElectionData();
      console.log("\n" + "=".repeat(50) + "\n");
      await fetchVoteHistoryOptimized();
      break;
    default:
      console.log("📖 Available commands:");
      console.log("  node fixedTracker.js elections - Show election data");
      console.log("  node fixedTracker.js votes     - Show vote history");
      console.log("  node fixedTracker.js export    - Export data to JSON");
      console.log("  node fixedTracker.js all       - Show everything");
  }
}

main().catch(console.error);

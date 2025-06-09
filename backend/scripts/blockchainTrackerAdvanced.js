const ethers = require("ethers");
const dotenv = require("dotenv");
dotenv.config();

// Load the contract ABI
const votingJson = require("../artifacts/contracts/Voting.sol/Voting.json");
const abi = votingJson.abi;

/**
 * Fetch vote history with smaller block ranges to avoid RPC limits
 */
async function fetchVoteHistoryOptimized() {
  console.log("📜 Fetching vote history from events...\n");
  
  const provider = new ethers.JsonRpcProvider(process.env.RPC_URL);
  const contract = new ethers.Contract(process.env.CONTRACT_ADDRESS, abi, provider);
  
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
    
    console.log(`Found ${events.length} votes:\n`);
    
    if (events.length === 0) {
      console.log("No votes found in recent blocks.");
      return;
    }
    
    for (let i = 0; i < events.length; i++) {
      const event = events[i];
      const { electionId, voter, candidate } = event.args;
      
      // Get block timestamp
      const block = await provider.getBlock(event.blockNumber);
      const timestamp = new Date(Number(block.timestamp) * 1000).toLocaleString();
      
      console.log(`${i + 1}. Election ${electionId}: "${candidate}"`);
      console.log(`   Voter: ${voter}`);
      console.log(`   Time: ${timestamp}`);
      console.log(`   Block: ${event.blockNumber}`);
      console.log(`   TX: ${event.transactionHash}`);
      console.log("");
    }
    
  } catch (error) {
    console.error("❌ Error fetching vote history:", error.message);
  }
}

/**
 * Export election data to JSON for external analysis
 */
async function exportElectionData() {
  console.log("💾 Exporting election data to JSON...\n");
  
  const provider = new ethers.JsonRpcProvider(process.env.RPC_URL);
  const contract = new ethers.Contract(process.env.CONTRACT_ADDRESS, abi, provider);
  
  try {
    const nextElectionId = await contract.nextElectionId();
    const totalElections = Number(nextElectionId) - 1;
    
    const exportData = {
      contractAddress: process.env.CONTRACT_ADDRESS,
      exportTime: new Date().toISOString(),
      totalElections: totalElections,
      elections: []
    };
    
    // Fetch each election
    for (let electionId = 1; electionId <= totalElections; electionId++) {
      try {
        const [name, candidates, startTime, endTime, disabled] = await contract.getElection(electionId);
        
        const electionData = {
          id: electionId,
          name: name,
          candidates: [...candidates],
          startTime: Number(startTime),
          endTime: Number(endTime),
          disabled: disabled,
          votes: {},
          totalVotes: 0
        };
        
        // Get vote counts
        for (const candidate of candidates) {
          const voteCount = await contract.getVoteCount(electionId, candidate);
          const votes = Number(voteCount);
          electionData.votes[candidate] = votes;
          electionData.totalVotes += votes;
        }
        
        exportData.elections.push(electionData);
        
      } catch (error) {
        console.log(`❌ Error fetching election ${electionId}: ${error.message}`);
      }
    }
    
    // Save to file
    const fs = require("fs");
    const filename = `election-data-${Date.now()}.json`;
    fs.writeFileSync(filename, JSON.stringify(exportData, null, 2));
    
    console.log(`✅ Data exported to: ${filename}`);
    console.log(`📊 Summary:`);
    console.log(`   - ${exportData.totalElections} elections`);
    console.log(`   - ${exportData.elections.reduce((sum, e) => sum + e.totalVotes, 0)} total votes`);
    
  } catch (error) {
    console.error("❌ Error exporting data:", error.message);
  }
}

// Update main function
async function main() {
  const command = process.argv[2];
  
  switch (command) {
    case "votes":
      await fetchVoteHistoryOptimized();
      break;
    case "export":
      await exportElectionData();
      break;
    default:
      console.log("Available commands:");
      console.log("  node blockchainTrackerAdvanced.js votes  - Show vote history");
      console.log("  node blockchainTrackerAdvanced.js export - Export data to JSON");
      break;
  }
}

if (require.main === module) {
  console.log("🚀 Advanced Blockchain Election Tracker");
  console.log("=" .repeat(50));
  main().catch(console.error);
}

module.exports = { fetchVoteHistoryOptimized, exportElectionData };

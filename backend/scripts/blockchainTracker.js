const ethers = require("ethers");
const dotenv = require("dotenv");
dotenv.config();

// Load the contract ABI
const votingJson = require("../artifacts/contracts/Voting.sol/Voting.json");
const abi = votingJson.abi;

/**
 * Fetch all election data and votes from the blockchain
 */
async function fetchAllElectionData() {
  console.log("🔍 Fetching all election data from blockchain...\n");
  
  // Connect to MegaETH network
  const provider = new ethers.JsonRpcProvider(process.env.RPC_URL);
  const contract = new ethers.Contract(process.env.CONTRACT_ADDRESS, abi, provider);
  
  try {
    // Get total number of elections
    const nextElectionId = await contract.nextElectionId();
    const totalElections = Number(nextElectionId) - 1;
    
    console.log(`📊 Total Elections: ${totalElections}\n`);
    
    if (totalElections === 0) {
      console.log("No elections found.");
      return;
    }
    
    // Fetch data for each election
    for (let electionId = 1; electionId <= totalElections; electionId++) {
      console.log(`🗳️  ELECTION ${electionId}`);
      console.log("=" .repeat(50));
      
      try {
        // Get election metadata
        const [name, candidates, startTime, endTime, disabled] = await contract.getElection(electionId);
        
        console.log(`Name: ${name}`);
        console.log(`Start Time: ${new Date(Number(startTime) * 1000).toLocaleString()}`);
        console.log(`End Time: ${new Date(Number(endTime) * 1000).toLocaleString()}`);
        console.log(`Status: ${disabled ? "DISABLED" : "ACTIVE"}`);
        console.log(`Candidates: ${candidates.join(", ")}`);
        
        // Get vote counts for each candidate
        console.log("\n📈 VOTE RESULTS:");
        let totalVotes = 0;
        for (const candidate of candidates) {
          const voteCount = await contract.getVoteCount(electionId, candidate);
          const votes = Number(voteCount);
          console.log(`  ${candidate}: ${votes} votes`);
          totalVotes += votes;
        }
        console.log(`  Total Votes Cast: ${totalVotes}`);
        
      } catch (error) {
        console.log(`❌ Error fetching election ${electionId}: ${error.message}`);
      }
      
      console.log("\n");
    }
    
  } catch (error) {
    console.error("❌ Error connecting to contract:", error.message);
  }
}

/**
 * Fetch all VotedMeta events (vote history)
 */
async function fetchVoteHistory() {
  console.log("📜 Fetching vote history from events...\n");
  
  const provider = new ethers.JsonRpcProvider(process.env.RPC_URL);
  const contract = new ethers.Contract(process.env.CONTRACT_ADDRESS, abi, provider);
  
  try {
    // Get all VotedMeta events from contract deployment
    const filter = contract.filters.VotedMeta();
    const events = await contract.queryFilter(filter, 0, "latest");
    
    console.log(`Found ${events.length} votes:\n`);
    
    events.forEach((event, index) => {
      const { electionId, voter, candidate } = event.args;
      console.log(`${index + 1}. Election ${electionId}: ${voter} voted for "${candidate}"`);
      console.log(`   Block: ${event.blockNumber}, TX: ${event.transactionHash}`);
      console.log("");
    });
    
  } catch (error) {
    console.error("❌ Error fetching vote history:", error.message);
  }
}

/**
 * Get real-time contract stats
 */
async function getContractStats() {
  console.log("📊 Contract Statistics\n");
  
  const provider = new ethers.JsonRpcProvider(process.env.RPC_URL);
  const contract = new ethers.Contract(process.env.CONTRACT_ADDRESS, abi, provider);
  
  try {
    const trustedRelayer = await contract.trustedRelayer();
    const nextElectionId = await contract.nextElectionId();
    
    console.log(`Contract Address: ${process.env.CONTRACT_ADDRESS}`);
    console.log(`Trusted Relayer: ${trustedRelayer}`);
    console.log(`Next Election ID: ${nextElectionId}`);
    console.log(`Total Elections: ${Number(nextElectionId) - 1}`);
    
    // Get contract balance
    const balance = await provider.getBalance(process.env.CONTRACT_ADDRESS);
    console.log(`Contract Balance: ${ethers.formatEther(balance)} ETH`);
    
  } catch (error) {
    console.error("❌ Error fetching contract stats:", error.message);
  }
}

// Main execution
async function main() {
  const command = process.argv[2];
  
  switch (command) {
    case "elections":
      await fetchAllElectionData();
      break;
    case "votes":
      await fetchVoteHistory();
      break;
    case "stats":
      await getContractStats();
      break;
    case "all":
    default:
      await getContractStats();
      console.log("\n");
      await fetchAllElectionData();
      await fetchVoteHistory();
      break;
  }
}

if (require.main === module) {
  console.log("🚀 Blockchain Election Tracker");
  console.log("=" .repeat(50));
  main().catch(console.error);
}

module.exports = { fetchAllElectionData, fetchVoteHistory, getContractStats };

# 🗳️ Blockchain Voting System - Tracking Guide

## Current Voting Data Summary

**Contract Address:** `0xB514AaB6e30497db5C16d283a6CbB2251f9c5220`  
**Network:** MegaETH Testnet  
**Total Elections:** 1  
**Total Votes:** 3  

### Election Results
**"Eleccion presidencial"**
- **Danilo:** 2 votes (66.7%)
- **Leonel:** 1 vote (33.3%)

---

## 📊 How to Track Votes and Data

### 1. 🌐 Online Block Explorer (Recommended for Users)

**MegaETH Explorer:** https://explorer.carrot.megaeth.com/address/0xB514AaB6e30497db5C16d283a6CbB2251f9c5220

**What you can see:**
- ✅ Contract overview and deployment info
- ✅ All vote transactions submitted by the relayer
- ✅ Meta-transaction details and gas usage
- ✅ VotedMeta event logs with voter addresses and choices
- ✅ Real-time updates as new votes come in

**Individual Transaction Links:**
- Vote 1: https://explorer.carrot.megaeth.com/tx/0x76927ce16f7b5ddd3cae967f68cd58b75bf1e601745daf35ce2e6764f7ce4f2e
- Vote 2: https://explorer.carrot.megaeth.com/tx/0x3a513e0bee254f765487ffd28ada90ef46c7ca7a9bc7383a9d54e7b37e967a83
- Vote 3: https://explorer.carrot.megaeth.com/tx/0x0f52f1bb11773d402b741f07747edd8d651bab431816a9f1cc5802faa6d15a81

### 2. 📜 Custom Blockchain Tracker Scripts (For Developers)

**Location:** `c:\Users\sebra\Downloads\Ether-vote\backend\scripts\fixedTracker.js`

**Commands:**
```powershell
# Show all election data and candidates
node fixedTracker.js elections

# Show complete vote history with timestamps
node fixedTracker.js votes

# Export everything to JSON file
node fixedTracker.js export

# Show everything at once
node fixedTracker.js all
```

**Features:**
- ✅ Fetches data directly from smart contract
- ✅ Shows real vote counts per candidate
- ✅ Displays voter addresses and timestamps
- ✅ Exports to JSON for analysis
- ✅ Handles large datasets with optimized queries

### 3. 📊 Visual Dashboard

**Location:** `c:\Users\sebra\Downloads\Ether-vote\backend\voting-dashboard.html`

**Features:**
- ✅ Beautiful web interface showing all data
- ✅ Real-time statistics and vote percentages
- ✅ Interactive candidate cards
- ✅ Complete vote history with transaction links
- ✅ Election timeline and status information

### 4. 🔗 Smart Contract Direct Queries

You can also query the contract directly using ethers.js:

```javascript
const ethers = require("ethers");
const provider = new ethers.JsonRpcProvider("https://carrot.megaeth.com/rpc");
const abi = [...]; // From artifacts/contracts/Voting.sol/Voting.json
const contract = new ethers.Contract("0xB514AaB6e30497db5C16d283a6CbB2251f9c5220", abi, provider);

// Get election info
const [name, candidates, startTime, endTime, disabled] = await contract.getElection(1);

// Get vote count for a candidate
const votes = await contract.getVoteCount(1, "Danilo");

// Get all candidates
const candidates = await contract.getCandidates(1);
```

---

## 🎯 Key Data Points You Can Track

### Election Data
- Election name and ID
- Candidate list
- Vote counts per candidate
- Election start/end times
- Election status (active/disabled)

### Vote History
- Voter wallet addresses
- Candidate chosen
- Exact timestamp of vote
- Transaction hash for verification
- Block number for ordering

### Meta-Transaction Data
- Signature verification success
- Relayer submission details
- Gas costs (paid by relayer)
- Event emission for tracking

### Real-Time Monitoring
- New votes as they happen
- Vote count changes
- Transaction confirmations
- Error detection and debugging

---

## 🚨 Important Notes

1. **Privacy:** Voter addresses are public on blockchain but not linked to real identities
2. **Immutability:** All votes are permanently recorded and cannot be changed
3. **Verification:** Every vote includes cryptographic proof of authenticity
4. **Transparency:** Anyone can verify the results using the tracking methods above
5. **Real-time:** Data updates immediately when new votes are submitted

---

## 🔧 Troubleshooting

If tracking tools don't work:

1. **Check RPC connection:** Ensure MegaETH testnet is accessible
2. **Verify contract address:** Make sure `0xB514AaB6e30497db5C16d283a6CbB2251f9c5220` is correct
3. **Update block range:** For older votes, increase the block search range
4. **Check node modules:** Run `npm install` in backend directory if needed

**Need help?** All tracking scripts include error handling and detailed logging to help diagnose issues.

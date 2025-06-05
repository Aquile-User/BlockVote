# Meta-Transaction Voting Backend

This repository implements a gasless voting system on the MegaETH testnet using:

- **Meta-Transactions**: Users sign votes off-chain; a Relayer pays gas on their behalf.
- **Node.js + Express**: Exposes a simple API for election creation, candidate listing, results, and vote submission.
- **HardHat**: Compiles and deploys Solidity contracts.
- **Ethers.js**: Used in both Relayer and API layers to talk to the blockchain.
- **MegaETH Testnet**: High-performance EVM-compatible testnet.

---

## Prerequisites

1. **Node.js** (v16+)
2. **npm** or **yarn**
3. A funded MegaETH testnet account (for the Relayer/deployer)  
   – Get testnet ETH from: https://faucet.trade/megaeth-testnet-eth-faucet

---

## Setup

1. **Clone repository**  
   ```bash
   git clone https://github.com/your-username/meta-tx-voting-backend.git
   cd meta-tx-voting-backend

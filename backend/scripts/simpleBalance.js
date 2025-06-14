const { ethers } = require("ethers");
require("dotenv").config();

console.log("Verificando balance...");

const provider = new ethers.JsonRpcProvider(process.env.RPC_URL);
const wallet = new ethers.Wallet(process.env.RELAYER_PK, provider);

provider
  .getBalance(wallet.address)
  .then((balance) => {
    const ethBalance = ethers.formatEther(balance);
    console.log("Address:", wallet.address);
    console.log("Balance:", ethBalance, "ETH");

    if (parseFloat(ethBalance) === 0) {
      console.log("❌ PROBLEMA: No tienes fondos de ETH");
      console.log("💡 Solución: Obtén ETH del faucet:");
      console.log("   https://faucet.trade/megaeth-testnet-eth-faucet");
    } else if (parseFloat(ethBalance) < 0.001) {
      console.log("⚠️  Balance muy bajo para transacciones");
    } else {
      console.log("✅ Balance suficiente");
    }
  })
  .catch((error) => {
    console.error("Error:", error.message);
  });

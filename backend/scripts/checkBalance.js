// scripts/checkBalance.js

const { ethers } = require("ethers");
const dns = require("dns");
require("dotenv").config();

if (dns.setDefaultResultOrder) {
  dns.setDefaultResultOrder("ipv4first");
}

async function checkBalanceAndConfig() {
  console.log("🔍 Verificando configuración y balances...\n");

  try {
    // 1. Verificar variables de entorno
    console.log("📋 Variables de entorno:");
    console.log(
      "BLOCKCHAIN_RPC_URL:",
      process.env.BLOCKCHAIN_RPC_URL || process.env.RPC_URL,
    );
    console.log(
      "VOTING_CONTRACT_ADDRESS:",
      process.env.VOTING_CONTRACT_ADDRESS || process.env.CONTRACT_ADDRESS,
    );
    console.log(
      "RELAYER_PRIVATE_KEY:",
      process.env.RELAYER_PRIVATE_KEY || process.env.RELAYER_PK
        ? "✅ Configurada"
        : "❌ No configurada",
    );
    if (!(process.env.RELAYER_PRIVATE_KEY || process.env.RELAYER_PK)) {
      console.log("❌ RELAYER_PRIVATE_KEY no está configurada en .env");
      return;
    } // 2. Conectar a la red
    const provider = new ethers.JsonRpcProvider(
      process.env.BLOCKCHAIN_RPC_URL || process.env.RPC_URL,
    );
    const relayerWallet = new ethers.Wallet(
      process.env.RELAYER_PRIVATE_KEY || process.env.RELAYER_PK,
      provider,
    );

    console.log("\n🔑 Información del Relayer:");
    console.log("Address:", relayerWallet.address);

    // 3. Verificar conectividad de red
    console.log("\n🌐 Verificando conectividad...");
    const blockNumber = await provider.getBlockNumber();
    console.log("Bloque actual:", blockNumber);
    console.log("Red:", "MegaETH Testnet");

    // 4. Verificar balance
    console.log("\n💰 Verificando balance...");
    const balance = await provider.getBalance(relayerWallet.address);
    const balanceEth = ethers.formatEther(balance);
    const balanceWei = balance.toString();

    console.log("Balance en Wei:", balanceWei);
    console.log("Balance en ETH:", balanceEth);

    // 5. Evaluar suficiencia del balance
    const balanceFloat = parseFloat(balanceEth);
    console.log("\n📊 Análisis del balance:");

    if (balanceFloat === 0) {
      console.log("❌ Balance es CERO - necesitas fondos");
      console.log(
        "💡 Obtén ETH del faucet: https://faucet.trade/megaeth-testnet-eth-faucet",
      );
    } else if (balanceFloat < 0.001) {
      console.log("⚠️  Balance muy bajo para múltiples transacciones");
      console.log("💡 Recomendado: al menos 0.001 ETH");
    } else if (balanceFloat < 0.01) {
      console.log("⚠️  Balance bajo - suficiente para pocas transacciones");
    } else {
      console.log("✅ Balance suficiente para múltiples transacciones");
    }

    // 6. Verificar precios de gas
    console.log("\n⛽ Verificando precios de gas...");
    try {
      const feeData = await provider.getFeeData();

      if (feeData.gasPrice) {
        const gasPriceGwei = ethers.formatUnits(feeData.gasPrice, "gwei");
        console.log("Gas Price actual:", gasPriceGwei, "Gwei"); // Estimar costo de crear una elección
        const estimatedGasForElection = 450000; // Gas optimizado
        const estimatedCost =
          (estimatedGasForElection * Number(feeData.gasPrice)) / 1e18;
        console.log(
          "Costo estimado crear elección:",
          estimatedCost.toFixed(8),
          "ETH",
        );

        // Estimar con los parámetros configurados
        const configuredGasPrice = ethers.parseUnits("0.1", "gwei");
        const configuredCost =
          (estimatedGasForElection * Number(configuredGasPrice)) / 1e18;
        console.log(
          "Costo con gas configurado (0.1 gwei):",
          configuredCost.toFixed(8),
          "ETH",
        );

        if (balanceFloat < estimatedCost * 2) {
          console.log("⚠️  Balance insuficiente para crear elecciones");
        }
      } else {
        console.log(
          "Gas Price: No disponible (usando configuración por defecto)",
        );
      }
    } catch (gasError) {
      console.log("⚠️  No se pudo obtener precio de gas:", gasError.message);
    } // 7. Verificar si el contrato existe
    if (process.env.VOTING_CONTRACT_ADDRESS || process.env.CONTRACT_ADDRESS) {
      console.log("\n📜 Verificando contrato...");
      try {
        const contractAddress =
          process.env.VOTING_CONTRACT_ADDRESS || process.env.CONTRACT_ADDRESS;
        const code = await provider.getCode(contractAddress);
        if (code === "0x") {
          console.log("❌ El contrato no existe en esta dirección");
          console.log("💡 Necesitas hacer deploy del contrato");
        } else {
          console.log("✅ Contrato encontrado y desplegado");
        }
      } catch (contractError) {
        console.log("⚠️  Error verificando contrato:", contractError.message);
      }
    } else {
      console.log(
        "\n⚠️  CONTRACT_ADDRESS no configurada - necesitas hacer deploy",
      );
    }

    // 8. Recomendaciones
    console.log("\n💡 Recomendaciones:");
    if (balanceFloat < 0.001) {
      console.log("1. Obtén más ETH del faucet de MegaETH");
      console.log(
        "2. URL del faucet: https://faucet.trade/megaeth-testnet-eth-faucet",
      );
    }

    if (
      (!process.env.VOTING_CONTRACT_ADDRESS && !process.env.CONTRACT_ADDRESS) ||
      (process.env.VOTING_CONTRACT_ADDRESS || process.env.CONTRACT_ADDRESS) ===
        "0x0760007bC12452cDE51AceE6DaF526260f825B14"
    ) {
      console.log("3. Haz deploy del contrato: npm run deploy");
    }

    console.log("4. Usa gas optimizado para reducir costos");
  } catch (error) {
    console.error("\n❌ Error durante la verificación:");
    console.error("Mensaje:", error.message);
    console.error("Código:", error.code);

    if (error.message.includes("network")) {
      console.log("\n💡 Problema de conectividad:");
      console.log("- Verifica que RPC_URL esté correcta");
      console.log("- Verifica tu conexión a internet");
    }

    if (error.message.includes("private key")) {
      console.log("\n💡 Problema con la clave privada:");
      console.log("- Verifica que RELAYER_PK esté correcta en .env");
      console.log("- Debe tener formato: 0x...");
    }
  }
}

// Ejecutar verificación
checkBalanceAndConfig().catch(console.error);

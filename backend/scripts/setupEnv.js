const fs = require("fs");
const path = require("path");
const { ethers } = require("ethers");
require("dotenv").config();

const rootDir = path.resolve(__dirname, "..");
const envPath = path.join(rootDir, ".env");
const examplePath = path.join(rootDir, ".env.example");
const exampleValues = readEnvFile(examplePath);

function readEnvFile(filePath) {
  if (!fs.existsSync(filePath)) {
    return {};
  }

  const content = fs.readFileSync(filePath, "utf8");
  const values = {};

  for (const line of content.split(/\r?\n/)) {
    const trimmed = line.trim();

    if (!trimmed || trimmed.startsWith("#")) {
      continue;
    }

    const equalsIndex = trimmed.indexOf("=");

    if (equalsIndex === -1) {
      continue;
    }

    const key = trimmed.slice(0, equalsIndex).trim();
    const value = trimmed.slice(equalsIndex + 1).trim();
    values[key] = value;
  }

  return values;
}

function firstDefined(...values) {
  return values.find(
    (value) => value !== undefined && value !== null && value !== "",
  );
}

function formatLabel(value, fallback = "❌ Falta") {
  return value ? "✅ OK" : fallback;
}

function serializeEnv(values) {
  const orderedKeys = [
    "DATABASE_URL",
    "BLOCKCHAIN_RPC_URL",
    "VOTING_CONTRACT_ADDRESS",
    "RELAYER_PRIVATE_KEY",
    "API_PORT",
    "RELAYER_PORT",
    "NODE_ENV",
    "DEBUG",
    "CACHE_TTL",
    "MAX_RPC_RETRIES",
    "RPC_URL",
    "CONTRACT_ADDRESS",
    "RELAYER_PK",
  ];

  const lines = [];

  for (const key of orderedKeys) {
    if (values[key] !== undefined && values[key] !== "") {
      lines.push(`${key}=${values[key]}`);
    }
  }

  for (const key of Object.keys(values)) {
    if (
      !orderedKeys.includes(key) &&
      values[key] !== undefined &&
      values[key] !== ""
    ) {
      lines.push(`${key}=${values[key]}`);
    }
  }

  return `${lines.join("\n")}\n`;
}

function writeEnvFile(filePath, values) {
  fs.writeFileSync(filePath, serializeEnv(values), "utf8");
}

async function main() {
  console.log("🔧 Preparando configuración de BlockVote...\n");

  if (!fs.existsSync(examplePath)) {
    console.error("❌ No se encontró .env.example en la raíz del backend.");
    process.exit(1);
  }

  if (!fs.existsSync(envPath)) {
    fs.copyFileSync(examplePath, envPath);
    console.log("✅ Se creó .env a partir de .env.example");
  } else {
    console.log("ℹ️  .env ya existe, no se sobrescribió");
  }

  const fileValues = readEnvFile(envPath);
  const rpcUrl = firstDefined(
    process.env.BLOCKCHAIN_RPC_URL,
    process.env.RPC_URL,
    fileValues.BLOCKCHAIN_RPC_URL,
    fileValues.RPC_URL,
  );
  let relayerPrivateKey = firstDefined(
    process.env.RELAYER_PRIVATE_KEY,
    process.env.RELAYER_PK,
    fileValues.RELAYER_PRIVATE_KEY,
    fileValues.RELAYER_PK,
  );
  const contractAddress = firstDefined(
    process.env.VOTING_CONTRACT_ADDRESS,
    process.env.CONTRACT_ADDRESS,
    fileValues.VOTING_CONTRACT_ADDRESS,
    fileValues.CONTRACT_ADDRESS,
  );

  console.log("\n📋 Revisión local:");
  console.log("- RPC:", formatLabel(rpcUrl));
  console.log("- Relayer private key:", formatLabel(relayerPrivateKey));
  console.log("- Contract address:", formatLabel(contractAddress));

  const relayerPlaceholder = firstDefined(
    exampleValues.RELAYER_PRIVATE_KEY,
    exampleValues.RELAYER_PK,
  );
  const relayerNeedsGeneration =
    !relayerPrivateKey || relayerPrivateKey === relayerPlaceholder;

  if (relayerNeedsGeneration) {
    const generatedWallet = ethers.Wallet.createRandom();
    relayerPrivateKey = generatedWallet.privateKey;
    const nextValues = {
      ...fileValues,
      DATABASE_URL:
        fileValues.DATABASE_URL ||
        exampleValues.DATABASE_URL ||
        "file:./prisma/dev.db",
      BLOCKCHAIN_RPC_URL:
        rpcUrl ||
        exampleValues.BLOCKCHAIN_RPC_URL ||
        "https://carrot.megaeth.com/rpc",
      RPC_URL:
        rpcUrl || exampleValues.RPC_URL || "https://carrot.megaeth.com/rpc",
      RELAYER_PRIVATE_KEY: generatedWallet.privateKey,
      RELAYER_PK: generatedWallet.privateKey,
      VOTING_CONTRACT_ADDRESS:
        contractAddress ||
        fileValues.VOTING_CONTRACT_ADDRESS ||
        exampleValues.VOTING_CONTRACT_ADDRESS ||
        "",
      CONTRACT_ADDRESS:
        contractAddress ||
        fileValues.CONTRACT_ADDRESS ||
        exampleValues.CONTRACT_ADDRESS ||
        "",
      API_PORT: fileValues.API_PORT || exampleValues.API_PORT || "3000",
      RELAYER_PORT:
        fileValues.RELAYER_PORT || exampleValues.RELAYER_PORT || "3001",
      NODE_ENV: fileValues.NODE_ENV || exampleValues.NODE_ENV || "development",
      DEBUG: fileValues.DEBUG || exampleValues.DEBUG || "true",
      CACHE_TTL: fileValues.CACHE_TTL || exampleValues.CACHE_TTL || "30",
      MAX_RPC_RETRIES:
        fileValues.MAX_RPC_RETRIES || exampleValues.MAX_RPC_RETRIES || "3",
    };

    writeEnvFile(envPath, nextValues);
    console.log(
      "\n🆕 No había relayer válido, se generó uno nuevo y se guardó en .env",
    );
    console.log("- Relayer address:", generatedWallet.address);
    console.log("- Private key guardada en .env");
  }

  const localErrors = [];

  if (!rpcUrl) {
    localErrors.push("Falta BLOCKCHAIN_RPC_URL o RPC_URL");
  }

  if (
    !relayerNeedsGeneration &&
    !/^0x[a-fA-F0-9]{64}$/.test(relayerPrivateKey || "")
  ) {
    localErrors.push("La clave privada del relayer no tiene formato válido");
  }

  if (!contractAddress) {
    localErrors.push("Falta VOTING_CONTRACT_ADDRESS o CONTRACT_ADDRESS");
  } else if (!ethers.isAddress(contractAddress)) {
    localErrors.push("La dirección del contrato no tiene formato válido");
  }

  if (localErrors.length > 0) {
    console.log("\n❌ Problemas encontrados:");
    for (const error of localErrors) {
      console.log("-", error);
    }
    console.log(
      "\n💡 Usa .env.example como base y completa los valores necesarios.",
    );
    process.exitCode = 1;
    return;
  }

  console.log("\n🌐 Verificación en red...");

  try {
    const provider = new ethers.JsonRpcProvider(rpcUrl);
    const relayerWallet = new ethers.Wallet(relayerPrivateKey, provider);

    const [blockNumber, balance, code] = await Promise.all([
      provider.getBlockNumber(),
      provider.getBalance(relayerWallet.address),
      provider.getCode(contractAddress),
    ]);

    console.log("- Relayer address:", relayerWallet.address);
    console.log("- Current block:", blockNumber);
    console.log("- Relayer balance:", ethers.formatEther(balance), "ETH");
    console.log(
      "- Contract code:",
      code === "0x" ? "No encontrado" : "Encontrado",
    );

    if (balance === 0n) {
      console.log(
        "\n⚠️  El relayer aún no tiene fondos. Necesitas cargar ETH de testnet antes de registrar wallets.",
      );
    }

    if (code === "0x") {
      console.log(
        "⚠️  El contrato no está desplegado en la dirección actual. Ejecuta npm run deploy y actualiza VOTING_CONTRACT_ADDRESS.",
      );
    }

    console.log(
      "\n✅ Configuración base lista. Si faltan fondos o despliegue, el script ya te indicó qué corregir.",
    );
  } catch (error) {
    console.error("\n❌ No se pudo verificar la red:");
    console.error(error.message);
    process.exitCode = 1;
  }
}

main();

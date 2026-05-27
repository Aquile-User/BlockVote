const fs = require("fs");
const path = require("path");
const { ethers } = require("ethers");
require("dotenv").config();

const rootDir = path.resolve(__dirname, "..");
const envPath = path.join(rootDir, ".env");
const examplePath = path.join(rootDir, ".env.example");

const DEFAULTS = {
  DATABASE_URL: "",
  BLOCKCHAIN_RPC_URL: "https://carrot.megaeth.com/rpc",
  VOTING_CONTRACT_ADDRESS: "",
  RELAYER_PRIVATE_KEY: "",
  API_PORT: "3000",
  RELAYER_PORT: "3001",
  NODE_ENV: "development",
  FRONTEND_URL: "http://localhost:5173",
  MAX_RPC_RETRIES: "3",
  ADMIN_JWT_SECRET: "",
};

const ENV_SECTIONS = [
  ["DATABASE_URL"],
  ["BLOCKCHAIN_RPC_URL", "VOTING_CONTRACT_ADDRESS", "RELAYER_PRIVATE_KEY"],
  ["API_PORT", "RELAYER_PORT", "NODE_ENV", "FRONTEND_URL"],
  ["MAX_RPC_RETRIES", "ADMIN_JWT_SECRET"],
];

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

function isPlaceholderDatabaseUrl(value) {
  return !value || value.includes("<") || value.includes(">");
}

function isPlaceholderValue(value) {
  return !value || value.includes("<") || value.includes(">");
}

function normalizeValue(primary, fallback, defaultValue = "") {
  return firstDefined(primary, fallback, defaultValue) || "";
}

function generateSecret() {
  return ethers.Wallet.createRandom().privateKey;
}

function formatLabel(value, fallback = "❌ Falta") {
  return value ? "✅ OK" : fallback;
}

function serializeEnv(values) {
  const lines = [];
  const emitted = new Set();

  for (const section of ENV_SECTIONS) {
    if (lines.length > 0) {
      lines.push("");
    }

    for (const key of section) {
      const value = values[key];
      emitted.add(key);

      if (value === undefined || value === "") {
        continue;
      }

      lines.push(`${key}=${value}`);
    }
  }

  for (const key of Object.keys(values)) {
    if (emitted.has(key) || values[key] === undefined || values[key] === "") {
      continue;
    }

    if (lines.length > 0 && lines[lines.length - 1] !== "") {
      lines.push("");
    }

    lines.push(`${key}=${values[key]}`);
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
  const rpcUrl = normalizeValue(
    process.env.BLOCKCHAIN_RPC_URL,
    fileValues.BLOCKCHAIN_RPC_URL,
    DEFAULTS.BLOCKCHAIN_RPC_URL,
  );
  const contractAddress = normalizeValue(
    process.env.VOTING_CONTRACT_ADDRESS,
    fileValues.VOTING_CONTRACT_ADDRESS,
    DEFAULTS.VOTING_CONTRACT_ADDRESS,
  );
  const relayerPrivateKeyInput = normalizeValue(
    process.env.RELAYER_PRIVATE_KEY,
    fileValues.RELAYER_PRIVATE_KEY,
    DEFAULTS.RELAYER_PRIVATE_KEY,
  );
  const adminJwtSecretInput = normalizeValue(
    process.env.ADMIN_JWT_SECRET,
    fileValues.ADMIN_JWT_SECRET,
    DEFAULTS.ADMIN_JWT_SECRET,
  );
  const frontendUrl = normalizeValue(
    process.env.FRONTEND_URL,
    fileValues.FRONTEND_URL,
    DEFAULTS.FRONTEND_URL,
  );

  console.log("\n📋 Revisión local:");
  console.log("- RPC:", formatLabel(rpcUrl));
  console.log("- Relayer private key:", formatLabel(relayerPrivateKeyInput));
  console.log("- Contract address:", formatLabel(contractAddress));
  console.log("- Frontend URL:", formatLabel(frontendUrl));
  console.log("- Admin JWT secret:", formatLabel(adminJwtSecretInput));

  const needsRelayerGeneration = isPlaceholderValue(relayerPrivateKeyInput);
  const needsAdminJwtSecret = isPlaceholderValue(adminJwtSecretInput);
  const needsDatabaseUrl = isPlaceholderDatabaseUrl(fileValues.DATABASE_URL);
  const needsContractAddress = isPlaceholderValue(contractAddress);

  const nextValues = {
    ...fileValues,
    DATABASE_URL: needsDatabaseUrl
      ? process.env.DATABASE_URL || ""
      : fileValues.DATABASE_URL,
    BLOCKCHAIN_RPC_URL: rpcUrl,
    VOTING_CONTRACT_ADDRESS: contractAddress,
    API_PORT: normalizeValue(fileValues.API_PORT, undefined, DEFAULTS.API_PORT),
    RELAYER_PORT: normalizeValue(
      fileValues.RELAYER_PORT,
      undefined,
      DEFAULTS.RELAYER_PORT,
    ),
    NODE_ENV: normalizeValue(fileValues.NODE_ENV, undefined, DEFAULTS.NODE_ENV),
    FRONTEND_URL: frontendUrl,
    MAX_RPC_RETRIES: normalizeValue(
      fileValues.MAX_RPC_RETRIES,
      undefined,
      DEFAULTS.MAX_RPC_RETRIES,
    ),
  };

  let relayerWallet = null;
  if (needsRelayerGeneration) {
    relayerWallet = ethers.Wallet.createRandom();
    nextValues.RELAYER_PRIVATE_KEY = relayerWallet.privateKey;
    console.log("\n🆕 Se generó una nueva clave privada para el relayer.");
    console.log("- Relayer address:", relayerWallet.address);
  } else {
    nextValues.RELAYER_PRIVATE_KEY = relayerPrivateKeyInput;
  }

  if (needsAdminJwtSecret) {
    nextValues.ADMIN_JWT_SECRET = generateSecret();
    console.log("🆕 Se generó un ADMIN_JWT_SECRET nuevo.");
  } else {
    nextValues.ADMIN_JWT_SECRET = adminJwtSecretInput;
  }

  if (
    needsDatabaseUrl ||
    needsContractAddress ||
    needsRelayerGeneration ||
    needsAdminJwtSecret
  ) {
    writeEnvFile(envPath, nextValues);
    console.log("✅ .env actualizado con los valores necesarios.");
  } else {
    console.log("ℹ️  .env ya estaba completo; no fue necesario reescribirlo.");
  }

  const localErrors = [];

  if (needsDatabaseUrl) {
    localErrors.push(
      "Falta DATABASE_URL real. Configura la cadena de conexión a Postgres en .env",
    );
  }

  if (needsContractAddress) {
    localErrors.push(
      "Falta VOTING_CONTRACT_ADDRESS. Debe ser una dirección de contrato válida.",
    );
  } else if (!ethers.isAddress(contractAddress)) {
    localErrors.push("La dirección del contrato no tiene formato válido");
  }

  if (needsRelayerGeneration) {
    localErrors.push(
      "Falta RELAYER_PRIVATE_KEY. Se generó una nueva para continuar.",
    );
  } else if (!/^0x[a-fA-F0-9]{64}$/.test(relayerPrivateKeyInput || "")) {
    localErrors.push("La clave privada del relayer no tiene formato válido");
  }

  if (localErrors.length > 0) {
    console.log("\n⚠️  Revisión del entorno:");
    for (const error of localErrors) {
      console.log("-", error);
    }
  }

  console.log("\n🌐 Verificación en red...");

  try {
    const provider = new ethers.JsonRpcProvider(rpcUrl);
    const walletToCheck =
      relayerWallet ||
      new ethers.Wallet(nextValues.RELAYER_PRIVATE_KEY, provider);

    const [blockNumber, balance, code] = await Promise.all([
      provider.getBlockNumber(),
      provider.getBalance(walletToCheck.address),
      provider.getCode(contractAddress),
    ]);

    console.log("- Relayer address:", walletToCheck.address);
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

    console.log("\n✅ Configuración base lista.");
  } catch (error) {
    console.error("\n❌ No se pudo verificar la red:");
    console.error(error.message);
    process.exitCode = 1;
  }
}

main();

// relayer/index.js

require("dotenv").config();
const express = require("express");
const { ethers } = require("ethers");

// Configuración de logs
const logPrefix = "🔄 RELAYER:";
const logger = {
  info: (message, data) => console.log(`${logPrefix} ${message}`, data || ""),
  error: (message, error) =>
    console.error(`${logPrefix} ERROR: ${message}`, error || ""),
  success: (message, data) =>
    console.log(`${logPrefix} ✅ ${message}`, data || ""),
};

// Constantes y configuración
const PORT = process.env.RELAYER_PORT || 3001;
const MAX_RETRIES = 3;
const RETRY_DELAY_MS = 1000;
const DEFAULT_GAS_LIMIT = 250_000; // Incrementado para mayor seguridad

// Validar variables de entorno críticas al inicio
const requiredEnvVars = ["RPC_URL", "CONTRACT_ADDRESS", "RELAYER_PK"];
const missingEnvVars = requiredEnvVars.filter(
  (varName) => !process.env[varName]
);

if (missingEnvVars.length > 0) {
  logger.error(
    `Faltan variables de entorno requeridas: ${missingEnvVars.join(", ")}`
  );
  process.exit(1);
}

// Cargar ABI del contrato Voting
const votingJson = require("../artifacts/contracts/Voting.sol/Voting.json");
const abi = votingJson.abi;

// Configuración de provider con reconexión
let provider;
let relayerWallet;
let votingContract;

async function setupBlockchainConnection() {
  try {
    provider = new ethers.JsonRpcProvider(process.env.RPC_URL);

    // Verificar conexión
    await provider.getBlockNumber();

    relayerWallet = new ethers.Wallet(process.env.RELAYER_PK, provider);
    votingContract = new ethers.Contract(
      process.env.CONTRACT_ADDRESS,
      abi,
      relayerWallet
    );

    const balance = await provider.getBalance(relayerWallet.address);
    logger.info(
      `Conexión establecida. Dirección del relayer: ${relayerWallet.address}`
    );
    logger.info(`Balance del relayer: ${ethers.formatEther(balance)} ETH`);

    // Advertir si el balance es bajo
    if (balance < ethers.parseEther("0.01")) {
      logger.error(
        "¡ADVERTENCIA! Balance del relayer bajo. Recarga fondos para asegurar operación continua."
      );
    }

    return true;
  } catch (error) {
    logger.error("Error al configurar conexión blockchain:", error);
    return false;
  }
}

// Función para enviar transacción con reintentos
async function sendTransactionWithRetry(
  electionId,
  candidate,
  voter,
  signature
) {
  let lastError;

  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    try {
      // Ajustar gas dinámicamente basado en la red
      const feeData = await provider.getFeeData();

      const tx = await votingContract.voteMeta(
        electionId,
        candidate,
        voter,
        signature,
        {
          gasLimit: DEFAULT_GAS_LIMIT,
          maxFeePerGas:
            feeData.maxFeePerGas || ethers.parseUnits("0.1", "gwei"),
          maxPriorityFeePerGas:
            feeData.maxPriorityFeePerGas || ethers.parseUnits("0.01", "gwei"),
        }
      );

      logger.info(`Transacción enviada: ${tx.hash}`);

      // Esperar por la confirmación de la transacción
      const receipt = await tx.wait();

      // Extraer eventos relevantes de la transacción
      const events = receipt.logs
        .filter(
          (log) =>
            log.address.toLowerCase() ===
            process.env.CONTRACT_ADDRESS.toLowerCase()
        )
        .map((log) => {
          try {
            return votingContract.interface.parseLog(log);
          } catch (e) {
            return null;
          }
        })
        .filter((event) => event !== null);

      return {
        success: true,
        txHash: receipt.hash,
        blockNumber: receipt.blockNumber,
        events: events.map((e) => ({
          name: e.name,
          args: Object.keys(e.args).reduce((obj, key) => {
            if (!isNaN(parseInt(key))) return obj;
            obj[key] = e.args[key].toString();
            return obj;
          }, {}),
        })),
      };
    } catch (error) {
      lastError = error;

      // Analizar el error para determinar si se debe reintentar
      const errorMessage = error.message || "";

      // No reintentar en caso de errores de usuario o validación
      if (
        errorMessage.includes("voter has already voted") ||
        errorMessage.includes("election does not exist") ||
        errorMessage.includes("election is disabled") ||
        errorMessage.includes("invalid signature")
      ) {
        throw error; // Propagar errores de negocio/validación
      }

      logger.error(`Intento ${attempt}/${MAX_RETRIES} fallido:`, error);

      // Esperar antes de reintentar (excepto en el último intento)
      if (attempt < MAX_RETRIES) {
        const delayMs = RETRY_DELAY_MS * attempt; // Backoff exponencial
        logger.info(`Reintentando en ${delayMs}ms...`);
        await new Promise((resolve) => setTimeout(resolve, delayMs));
      }
    }
  }

  // Si llegamos aquí, todos los intentos fallaron
  throw lastError;
}

// Configurar Express
const app = express();
app.use(express.json());

// Middleware para verificar conexión blockchain
app.use(async (req, res, next) => {
  if (!provider || !relayerWallet || !votingContract) {
    const connected = await setupBlockchainConnection();
    if (!connected) {
      return res.status(503).json({
        error:
          "Servicio de relayer no disponible. Error de conexión blockchain.",
      });
    }
  }
  next();
});

/**
 * POST /meta-vote
 * Request body: { electionId, selectedCandidate, voter, signature }
 * Relayer paga el gas y llama a voteMeta en la blockchain.
 */
app.post("/meta-vote", async (req, res) => {
  const startTime = Date.now();
  const requestId = `vote-${Date.now()}-${Math.random()
    .toString(36)
    .substring(2, 7)}`;

  logger.info(`[${requestId}] Solicitud recibida:`, {
    electionId: req.body.electionId,
    candidate: req.body.selectedCandidate,
    voter: req.body.voter,
  });

  try {
    const { electionId, selectedCandidate, voter, signature } = req.body;

    // Validar parámetros requeridos
    if (!electionId || !selectedCandidate || !voter || !signature) {
      return res.status(400).json({
        error:
          "Faltan parámetros requeridos: electionId, selectedCandidate, voter, signature",
        requestId,
      });
    }

    // Validar formato de dirección Ethereum
    if (!ethers.isAddress(voter)) {
      return res.status(400).json({
        error: "Dirección de votante inválida",
        requestId,
      });
    }

    // Procesamiento y envío de transacción
    const result = await sendTransactionWithRetry(
      electionId,
      selectedCandidate,
      voter,
      signature
    );

    const processingTime = Date.now() - startTime;
    logger.success(
      `[${requestId}] Voto procesado en ${processingTime}ms. Hash: ${result.txHash}`
    );

    return res.json({
      ...result,
      requestId,
      processingTimeMs: processingTime,
    });
  } catch (error) {
    const errorMessage = error.message || "Error desconocido";

    // Clasificar errores para respuestas adecuadas
    if (
      errorMessage.includes("voter has already voted") ||
      errorMessage.includes("election does not exist") ||
      errorMessage.includes("election is disabled") ||
      errorMessage.includes("invalid signature")
    ) {
      logger.error(`[${requestId}] Error de validación:`, errorMessage);
      return res.status(400).json({
        error: errorMessage,
        requestId,
        type: "validation_error",
      });
    }

    // Error de servicio
    logger.error(`[${requestId}] Error al procesar voto:`, error);
    return res.status(500).json({
      error:
        "Error al procesar el voto. Por favor intente nuevamente más tarde.",
      requestId,
      type: "service_error",
      details:
        process.env.NODE_ENV === "development" ? errorMessage : undefined,
    });
  }
});

/**
 * GET /health
 * Endpoint para verificar la salud del servicio
 */
app.get("/health", async (req, res) => {
  try {
    // Verificar conexión a la blockchain
    const blockNumber = await provider.getBlockNumber();
    const balance = await provider.getBalance(relayerWallet.address);

    // Verificar si el balance es suficiente
    const lowBalance = balance < ethers.parseEther("0.01");

    const healthStatus = {
      status: lowBalance ? "warning" : "healthy",
      blockchainConnected: true,
      currentBlockNumber: blockNumber,
      relayerAddress: relayerWallet.address,
      relayerBalance: {
        wei: balance.toString(),
        eth: ethers.formatEther(balance),
      },
      warnings: lowBalance ? ["Balance del relayer bajo"] : [],
      timestamp: new Date().toISOString(),
    };

    res.json(healthStatus);
  } catch (error) {
    logger.error("Error en health check:", error);
    res.status(503).json({
      status: "unhealthy",
      error: error.message,
      timestamp: new Date().toISOString(),
    });
  }
});

// Iniciar servidor
async function startServer() {
  // Configurar conexión blockchain al inicio
  const connected = await setupBlockchainConnection();

  if (!connected) {
    logger.error(
      "No se pudo establecer conexión inicial con la blockchain. Reintentando en segundo plano..."
    );
    // Intentar reconectarse periódicamente
    setInterval(setupBlockchainConnection, 30000);
  }

  app.listen(PORT, () => {
    logger.info(`Servicio relayer iniciado en http://localhost:${PORT}`);
    logger.info(`Health check disponible en http://localhost:${PORT}/health`);
  });
}

// Manejo de señales para cierre graceful
process.on("SIGTERM", () => {
  logger.info("Recibida señal SIGTERM. Cerrando servicio relayer...");
  process.exit(0);
});

process.on("SIGINT", () => {
  logger.info("Recibida señal SIGINT. Cerrando servicio relayer...");
  process.exit(0);
});

// Manejo de errores no capturados
process.on("uncaughtException", (error) => {
  logger.error("Error no capturado:", error);
});

process.on("unhandledRejection", (reason) => {
  logger.error("Promesa rechazada no manejada:", reason);
});

// Iniciar el servidor
startServer();

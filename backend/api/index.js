// api/index.js

require("dotenv").config();

const dns = require("dns");

if (dns.setDefaultResultOrder) {
  dns.setDefaultResultOrder("ipv4first");
}

if (!process.env.DATABASE_URL) {
  throw new Error(
    "DATABASE_URL is required. Configure backend/.env with your Postgres connection string.",
  );
}
const express = require("express");
const cors = require("cors");
const fetch = require("node-fetch");
const axios = require("axios");
const ExcelJS = require("exceljs");
const { ethers } = require("ethers");
const { PrismaClient } = require("@prisma/client");
const swaggerUi = require("swagger-ui-express");
const swaggerJsdoc = require("swagger-jsdoc");

// Load the ABI of Voting contract
const votingJson = require("../artifacts/contracts/Voting.sol/Voting.json");
const abi = votingJson.abi;

const app = express();
const cookieParser = require("cookie-parser");

// CORS: allow frontend origin and cookies
const FRONTEND_ORIGIN = process.env.FRONTEND_URL || "http://localhost:5173";
app.use(cors({ origin: FRONTEND_ORIGIN, credentials: true }));
app.use(cookieParser());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
// Establecer la codificación correcta para todas las respuestas
app.use((req, res, next) => {
  res.setHeader("Content-Type", "application/json; charset=utf-8");
  next();
});
// Admin management endpoints
// List admins
app.get("/admin/admins", requireAdmin, async (req, res) => {
  try {
    const admins = await prisma.admin.findMany({
      select: {
        id: true,
        username: true,
        role: true,
        isActive: true,
        createdAt: true,
      },
      orderBy: { id: "asc" },
    });
    res.json(admins);
  } catch (err) {
    console.error("Get admins error:", err.message || err);
    res.status(500).json({ error: "Failed to list admins" });
  }
});

// Create admin (only superadmin)
app.post("/admin/admins", requireAdmin, async (req, res) => {
  try {
    if (req.admin.role !== "superadmin")
      return res.status(403).json({ error: "Requires superadmin" });
    const { username, password, role } = req.body;
    if (!username || !password)
      return res.status(400).json({ error: "Missing username or password" });
    const existing = await prisma.admin.findUnique({ where: { username } });
    if (existing)
      return res.status(409).json({ error: "Username already exists" });
    const hash = await bcrypt.hash(password, 12);
    const created = await prisma.admin.create({
      data: { username, passwordHash: hash, role: role || "admin" },
    });
    // Audit: record admin creation
    await recordAdminAudit(req, "create_admin", created.id, {
      username: created.username,
      role: created.role,
    });
    res.status(201).json({
      id: created.id,
      username: created.username,
      role: created.role,
      isActive: created.isActive,
    });
  } catch (err) {
    console.error("Create admin error:", err.message || err);
    res.status(500).json({ error: "Failed to create admin" });
  }
});

// Update admin: change password or toggle active. Admins can change their own password; superadmin can change others.
app.patch("/admin/admins/:id", requireAdmin, async (req, res) => {
  try {
    const id = Number(req.params.id);
    const { password, isActive } = req.body;
    const target = await prisma.admin.findUnique({ where: { id } });
    if (!target) return res.status(404).json({ error: "Admin not found" });

    // Only superadmin can change isActive or change other admins' passwords
    if (isActive !== undefined && req.admin.role !== "superadmin") {
      return res
        .status(403)
        .json({ error: "Requires superadmin to change active state" });
    }

    if (password) {
      if (req.admin.role !== "superadmin" && req.admin.id !== id) {
        return res
          .status(403)
          .json({ error: "Can only change your own password" });
      }
      const hash = await bcrypt.hash(password, 12);
      await prisma.admin.update({
        where: { id },
        data: { passwordHash: hash },
      });
      // Record password change
      await recordAdminAudit(req, "update_admin", id, {
        password_changed: true,
      });
    }

    if (isActive !== undefined) {
      await prisma.admin.update({
        where: { id },
        data: { isActive: Boolean(isActive) },
      });
      await recordAdminAudit(req, "update_admin", id, {
        isActive: Boolean(isActive),
      });
    }

    const updated = await prisma.admin.findUnique({
      where: { id },
      select: { id: true, username: true, role: true, isActive: true },
    });
    res.json(updated);
  } catch (err) {
    console.error("Update admin error:", err.message || err);
    res.status(500).json({ error: "Failed to update admin" });
  }
});

// Delete admin (only superadmin)
app.delete("/admin/admins/:id", requireAdmin, async (req, res) => {
  try {
    if (req.admin.role !== "superadmin")
      return res.status(403).json({ error: "Requires superadmin" });
    const id = Number(req.params.id);
    const target = await prisma.admin.findUnique({ where: { id } });
    if (!target) return res.status(404).json({ error: "Admin not found" });
    await prisma.admin.delete({ where: { id } });
    // Audit: record deletion
    await recordAdminAudit(req, "delete_admin", id, {
      username: target.username,
    });
    res.status(204).send();
  } catch (err) {
    console.error("Delete admin error:", err.message || err);
    res.status(500).json({ error: "Failed to delete admin" });
  }
});

// Revoke admin tokens (increment tokenVersion) - only superadmin
app.post("/admin/admins/:id/revoke", requireAdmin, async (req, res) => {
  try {
    if (req.admin.role !== "superadmin")
      return res.status(403).json({ error: "Requires superadmin" });
    const id = Number(req.params.id);
    const target = await prisma.admin.findUnique({ where: { id } });
    if (!target) return res.status(404).json({ error: "Admin not found" });

    await prisma.admin.update({
      where: { id },
      data: { tokenVersion: { increment: 1 } },
    });

    // Also clear cookie for current session so revoked token can't be used
    res.clearCookie("admin_token", {
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
    });
    // Audit: record token revocation
    await recordAdminAudit(req, "revoke_tokens", id, {
      username: target.username,
    });
    res.json({ message: `Revoked tokens for admin ${id}` });
  } catch (err) {
    console.error("Revoke admin tokens error:", err.message || err);
    res.status(500).json({ error: "Failed to revoke tokens" });
  }
});

const prisma = new PrismaClient();

// Helper to record admin audit events
async function recordAdminAudit(
  req,
  action,
  targetAdminId = null,
  details = null,
) {
  try {
    const ip = req.headers["x-forwarded-for"] || req.ip || null;
    const userAgent = req.headers["user-agent"] || null;
    await prisma.adminAudit.create({
      data: {
        actorAdminId: req?.admin?.id || null,
        action: String(action),
        targetAdminId: targetAdminId || null,
        details: details || null,
        ip,
        userAgent,
      },
    });
  } catch (err) {
    console.error("Failed to record admin audit:", err?.message || err);
  }
}

function flattenAuditText(value) {
  if (value === null || value === undefined) return "";
  const text = typeof value === "string" ? value : JSON.stringify(value);
  return String(text)
    .replace(/\r?\n|\r/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function formatAuditDetails(details) {
  if (details === null || details === undefined || details === "") {
    return "";
  }

  if (typeof details === "string") {
    return flattenAuditText(details);
  }

  if (Array.isArray(details)) {
    return details
      .map((item) => formatAuditDetails(item))
      .filter(Boolean)
      .join("; ");
  }

  if (typeof details === "object") {
    return Object.entries(details)
      .map(([key, value]) => {
        if (value && typeof value === "object") {
          return `${key}: ${formatAuditDetails(value)}`;
        }
        return `${key}: ${flattenAuditText(value)}`;
      })
      .filter(Boolean)
      .join(", ");
  }

  return flattenAuditText(details);
}

function formatAuditDate(value) {
  if (!value) return "";
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return flattenAuditText(value);
  const pad = (n) => String(n).padStart(2, "0");
  return `${pad(date.getDate())}/${pad(
    date.getMonth() + 1,
  )}/${date.getFullYear()} ${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

function parseAuditUserAgent(userAgent) {
  const ua = flattenAuditText(userAgent);
  if (!ua) return { browser: "", os: "" };

  const browserPatterns = [
    { label: "Edge", pattern: /Edg(?:e|A|iOS)?\/([\d.]+)/i },
    { label: "Opera", pattern: /OPR\/([\d.]+)/i },
    { label: "Brave", pattern: /Brave\/([\d.]+)/i },
    { label: "Chrome", pattern: /Chrome\/([\d.]+)/i },
    { label: "Firefox", pattern: /Firefox\/([\d.]+)/i },
    { label: "Safari", pattern: /Version\/([\d.]+).*Safari/i },
  ];

  const osPatterns = [
    { label: "Windows", pattern: /Windows NT/i },
    { label: "macOS", pattern: /Mac OS X/i },
    { label: "iOS", pattern: /iPhone|iPad|iPod/i },
    { label: "Android", pattern: /Android/i },
    { label: "Linux", pattern: /Linux/i },
    { label: "Chrome OS", pattern: /CrOS/i },
  ];

  const browser =
    browserPatterns.find((item) => item.pattern.test(ua))?.label ||
    "Desconocido";
  const os =
    osPatterns.find((item) => item.pattern.test(ua))?.label || "Desconocido";

  return { browser, os };
}

function buildAuditExportColumns(visibleColumns = {}) {
  const columns = [];
  if (visibleColumns.id !== false) columns.push({ key: "id", label: "ID" });
  if (visibleColumns.actor !== false)
    columns.push({ key: "actor", label: "Actor" });
  if (visibleColumns.action !== false)
    columns.push({ key: "action", label: "Acción" });
  if (visibleColumns.target !== false)
    columns.push({ key: "target", label: "Target" });
  if (visibleColumns.details !== false)
    columns.push({ key: "details", label: "Detalles" });
  if (visibleColumns.ip !== false) columns.push({ key: "ip", label: "IP" });
  if (visibleColumns.userAgent) {
    columns.push({ key: "browser", label: "Navegador" });
    columns.push({ key: "os", label: "SO" });
  }
  if (visibleColumns.created !== false)
    columns.push({ key: "created", label: "Creado" });
  return columns;
}

function buildAuditExportRow(audit, columns, adminMap) {
  const { browser, os } = parseAuditUserAgent(audit.userAgent);
  return columns.map((column) => {
    switch (column.key) {
      case "id":
        return `#${audit.id}`;
      case "actor":
        return adminMap.get(audit.actorAdminId) || audit.actorAdminId || "";
      case "action":
        return audit.action || "";
      case "target":
        return adminMap.get(audit.targetAdminId) || audit.targetAdminId || "";
      case "details":
        return formatAuditDetails(audit.details);
      case "ip":
        return audit.ip || "";
      case "browser":
        return browser;
      case "os":
        return os;
      case "created":
        return formatAuditDate(audit.createdAt);
      default:
        return "";
    }
  });
}

function styleAuditWorksheet(worksheet, columnCount, rowCount) {
  const headerFillColor = "1A7A6E";
  const evenFill = "FFFFFF";
  const oddFill = "F0FAF9";
  const border = {
    top: { style: "thin", color: { argb: "FFD9E2E3" } },
    left: { style: "thin", color: { argb: "FFD9E2E3" } },
    bottom: { style: "thin", color: { argb: "FFD9E2E3" } },
    right: { style: "thin", color: { argb: "FFD9E2E3" } },
  };

  worksheet.views = [{ state: "frozen", ySplit: 1 }];
  worksheet.autoFilter = {
    from: { row: 1, column: 1 },
    to: { row: Math.max(rowCount, 1), column: columnCount },
  };

  worksheet.columns.forEach((column, index) => {
    let maxLength = 0;
    column.eachCell({ includeEmpty: true }, (cell) => {
      const cellText = flattenAuditText(cell.value);
      maxLength = Math.max(maxLength, cellText.length);
      cell.border = border;
      cell.alignment = { vertical: "top", wrapText: true };
    });
    column.width = Math.min(Math.max(maxLength + 2, 12), 45);

    const headerCell = worksheet.getRow(1).getCell(index + 1);
    headerCell.fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: `FF${headerFillColor}` },
    };
    headerCell.font = { bold: true, color: { argb: "FFFFFFFF" } };
    headerCell.alignment = {
      vertical: "middle",
      horizontal: "center",
      wrapText: true,
    };
    headerCell.border = border;
  });

  for (let rowIndex = 2; rowIndex <= rowCount; rowIndex += 1) {
    const row = worksheet.getRow(rowIndex);
    const fillColor = rowIndex % 2 === 0 ? oddFill : evenFill;
    row.eachCell({ includeEmpty: true }, (cell) => {
      cell.fill = {
        type: "pattern",
        pattern: "solid",
        fgColor: { argb: `FF${fillColor}` },
      };
      cell.border = border;
      cell.alignment = { vertical: "top", wrapText: true };
    });
  }
}

const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");

const ADMIN_JWT_SECRET =
  process.env.ADMIN_JWT_SECRET || process.env.JWT_SECRET || null;
if (!ADMIN_JWT_SECRET) {
  console.warn(
    "Warning: ADMIN_JWT_SECRET not set. Set ADMIN_JWT_SECRET in backend/.env for secure JWTs.",
  );
}

// Middleware to protect admin routes
async function requireAdmin(req, res, next) {
  try {
    // Accept token from Authorization header or from httpOnly cookie
    let token = null;
    const auth = req.headers.authorization;
    if (auth && auth.startsWith("Bearer ")) {
      token = auth.split(" ")[1];
    } else if (req.cookies && req.cookies.admin_token) {
      token = req.cookies.admin_token;
    }
    if (!token) return res.status(401).json({ error: "Missing token" });
    const payload = jwt.verify(token, ADMIN_JWT_SECRET);
    if (!payload || !payload.adminId)
      return res.status(401).json({ error: "Invalid token" });
    const admin = await prisma.admin.findUnique({
      where: { id: Number(payload.adminId) },
    });
    if (!admin || !admin.isActive)
      return res.status(403).json({ error: "Admin not active" });
    // tokenVersion check: if tokenVersion in token doesn't match current, token revoked
    if (
      typeof payload.tokenVersion === "number" &&
      payload.tokenVersion !== admin.tokenVersion
    ) {
      return res.status(401).json({ error: "Token revoked" });
    }
    req.admin = { id: admin.id, username: admin.username, role: admin.role };
    next();
  } catch (err) {
    console.error("Admin auth error:", err.message || err);
    return res.status(401).json({ error: "Unauthorized" });
  }
}

function normalizeUserForResponse(user) {
  return {
    address: user.address,
    name: user.name,
    province: user.province,
    authMethod: user.authMethod,
    registeredAt:
      user.registeredAt instanceof Date
        ? user.registeredAt.toISOString()
        : user.registeredAt,
  };
}

async function getUserBySocialId(socialId) {
  return prisma.user.findUnique({ where: { socialId } });
}

async function findUserByAddress(address) {
  if (!address) {
    return null;
  }

  const users = await prisma.user.findMany({
    where: { authMethod: "metamask" },
    select: { id: true, address: true },
  });

  return (
    users.find(
      (user) =>
        user.address && user.address.toLowerCase() === address.toLowerCase(),
    ) || null
  );
}

async function countUsers() {
  return prisma.user.count();
}

async function getUsersMap() {
  const allUsers = await prisma.user.findMany();
  const map = {};

  for (const user of allUsers) {
    map[user.socialId] = normalizeUserForResponse(user);
  }

  return map;
}

async function recordVoteInDatabase({ user, electionId, txHash }) {
  return prisma.vote.create({
    data: {
      userId: user.id,
      province: user.province,
      electionId: String(electionId),
      txHash: txHash || null,
    },
  });
}

// Swagger setup
const swaggerDefinition = {
  openapi: "3.0.0",
  info: {
    title: "Meta-Transaction Voting API",
    version: "1.0.0",
    description: "API docs for gasless voting on MegaETH testnet",
  },
  servers: [{ url: "http://localhost:3000", description: "Local server" }],
};

const options = {
  swaggerDefinition,
  apis: ["./api/index.js"],
};

const swaggerSpec = swaggerJsdoc(options);
app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));

// Return current admin if authenticated (used by frontend to validate cookie-based session)
app.get("/admin/me", requireAdmin, async (req, res) => {
  try {
    const admin = await prisma.admin.findUnique({
      where: { id: Number(req.admin.id) },
    });
    if (!admin) return res.status(404).json({ error: "Admin not found" });
    res.json({ id: admin.id, username: admin.username, role: admin.role });
  } catch (err) {
    console.error("Admin me error:", err.message || err);
    res.status(500).json({ error: "Internal error" });
  }
});

// Get admin audits (superadmin only)
app.get("/admin/audits", requireAdmin, async (req, res) => {
  try {
    if (req.admin.role !== "superadmin")
      return res.status(403).json({ error: "Requires superadmin" });

    const page = Math.max(1, Number(req.query.page) || 1);
    const pageSize = Math.min(
      200,
      Math.max(1, Number(req.query.pageSize) || 50),
    );

    const where = {};
    if (req.query.actorId) where.actorAdminId = Number(req.query.actorId);
    if (req.query.targetId) where.targetAdminId = Number(req.query.targetId);
    if (req.query.action) where.action = String(req.query.action);
    if (req.query.since || req.query.until) {
      where.createdAt = {};
      if (req.query.since) where.createdAt.gte = new Date(req.query.since);
      if (req.query.until) where.createdAt.lte = new Date(req.query.until);
    }

    const [items, total] = await Promise.all([
      prisma.adminAudit.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      prisma.adminAudit.count({ where }),
    ]);

    res.json({ items, total, page, pageSize });
  } catch (err) {
    console.error("Get audits error:", err?.message || err);
    res.status(500).json({ error: "Failed to fetch audits" });
  }
});

// Export admin audits as styled Excel (.xlsx)
app.post("/admin/audits/export", requireAdmin, async (req, res) => {
  try {
    if (req.admin.role !== "superadmin") {
      return res.status(403).json({ error: "Requires superadmin" });
    }

    const body = req.body || {};
    const filters = body.filters || body;
    const visibleColumns = body.visibleColumns || filters.visibleColumns || {};

    const where = {};
    if (filters.actorId) where.actorAdminId = Number(filters.actorId);
    if (filters.targetId) where.targetAdminId = Number(filters.targetId);
    if (filters.action) where.action = String(filters.action);
    if (filters.since || filters.until) {
      where.createdAt = {};
      if (filters.since) where.createdAt.gte = new Date(filters.since);
      if (filters.until) where.createdAt.lte = new Date(filters.until);
    }

    const [audits, adminRows] = await Promise.all([
      prisma.adminAudit.findMany({
        where,
        orderBy: { createdAt: "desc" },
      }),
      prisma.admin.findMany({
        select: { id: true, username: true },
      }),
    ]);

    const adminMap = new Map(
      adminRows.map((admin) => [admin.id, admin.username]),
    );
    const columns = buildAuditExportColumns(visibleColumns);
    const workbook = new ExcelJS.Workbook();
    workbook.creator = "BlockVote";
    workbook.created = new Date();
    workbook.modified = new Date();

    const worksheet = workbook.addWorksheet("Auditoría", {
      views: [{ state: "frozen", ySplit: 1 }],
    });

    worksheet.columns = columns.map((column) => ({
      header: column.label,
      key: column.key,
    }));
    audits.forEach((audit) => {
      worksheet.addRow(buildAuditExportRow(audit, columns, adminMap));
    });

    styleAuditWorksheet(worksheet, columns.length, worksheet.rowCount);

    const buffer = await workbook.xlsx.writeBuffer();

    await recordAdminAudit(req, "export_audits", null, {
      filters: filters || null,
      exportedCount: audits.length,
      format: "xlsx",
    });

    res.setHeader(
      "Content-Type",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    );
    res.setHeader(
      "Content-Disposition",
      'attachment; filename="auditoria_admins.xlsx"',
    );
    res.setHeader("Content-Length", buffer.length);
    res.send(Buffer.from(buffer));
  } catch (err) {
    console.error("Export audits error:", err?.message || err);
    res.status(500).json({ error: "Failed to export audits" });
  }
});

// Record an export action (so exports are audited). Body: { filters, count, format }
app.post("/admin/audits/export-log", requireAdmin, async (req, res) => {
  try {
    if (req.admin.role !== "superadmin")
      return res.status(403).json({ error: "Requires superadmin" });

    const { filters, count, format } = req.body || {};
    await recordAdminAudit(req, "export_audits", null, {
      filters: filters || null,
      exportedCount: Number(count || 0),
      format: format || "csv",
    });
    res.json({ ok: true });
  } catch (err) {
    console.error("Export log error:", err?.message || err);
    res.status(500).json({ error: "Failed to record export" });
  }
});

// Health check endpoint
app.get("/health", async (req, res) => {
  try {
    // Verificar conexión a blockchain
    let blockchainStatus = "error";
    let blockNumber = null;
    let contractDeployed = false;

    try {
      blockNumber = await provider.getBlockNumber();
      const contractCode = await provider.getCode(
        process.env.VOTING_CONTRACT_ADDRESS || process.env.CONTRACT_ADDRESS,
      );
      contractDeployed = contractCode !== "0x";
      blockchainStatus = "connected";
    } catch (err) {
      console.error(`Error al verificar blockchain: ${err.message}`);
    }

    // Verificar usuarios
    const userCount = await countUsers();

    // Verificar relayer
    let relayerStatus = "unknown";
    try {
      const relayerResponse = await axios.get(
        `http://localhost:${process.env.RELAYER_PORT || 3001}/health`,
        {
          timeout: 2000,
        },
      );
      relayerStatus = "running";
    } catch (err) {
      console.error(`Error al verificar relayer: ${err.message}`);
      relayerStatus = "unreachable";
    }

    const healthStatus = {
      status: "healthy",
      timestamp: new Date().toISOString(),
      circuitBreaker: {
        state: circuitBreaker.state,
        failureCount: circuitBreaker.failureCount,
      },
      uptime: process.uptime(),
      api: {
        version: "2.0.0",
        port: parseInt(process.env.API_PORT || 3000),
        status: "online",
      },
      blockchain: {
        network: "MegaETH Testnet",
        blockNumber: blockNumber,
        contractDeployed: contractDeployed,
        status: blockchainStatus,
        contractAddress:
          process.env.VOTING_CONTRACT_ADDRESS || process.env.CONTRACT_ADDRESS,
      },
      users: {
        registered: userCount,
        storage: "postgres",
      },
      relayer: {
        status: relayerStatus,
        port: parseInt(process.env.RELAYER_PORT || 3001),
      },
    };

    // Si el circuit breaker está abierto, marcar como degraded
    if (circuitBreaker.state === "OPEN") {
      healthStatus.status = "degraded";
      return res.status(503).json(healthStatus);
    }

    res.json(healthStatus);
  } catch (error) {
    res.status(500).json({
      status: "unhealthy",
      error: error.message,
      timestamp: new Date().toISOString(),
    });
  }
});

// Read-only provider for contract interactions
const provider = new ethers.JsonRpcProvider(
  process.env.BLOCKCHAIN_RPC_URL || process.env.RPC_URL,
);
const votingContract = new ethers.Contract(
  process.env.VOTING_CONTRACT_ADDRESS ||
    process.env.VOTING_CONTRACT_ADDRESS ||
    process.env.CONTRACT_ADDRESS,
  abi,
  provider,
);

// ================= User Management =================

/**
 * @swagger
 * /users/register:
 *   post:
 *     summary: Register a user by social ID, generate a wallet, and fund it
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               socialId:
 *                 type: string
 *     responses:
 *       200:
 *         description: User registered successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 socialId:
 *                   type: string
 *                 address:
 *                   type: string
 *                 privateKey:
 *                   type: string
 *                 fundTxHash:
 *                   type: string
 */
app.post("/users/register", async (req, res) => {
  try {
    const {
      socialId,
      name,
      province,
      authMethod, // 'metamask' or 'generated'
      metamaskAddress,
    } = req.body;

    if (!socialId) return res.status(400).json({ error: "Missing socialId" });
    if (!name) return res.status(400).json({ error: "Missing name" });
    if (!province) return res.status(400).json({ error: "Missing province" });
    if (!authMethod)
      return res.status(400).json({ error: "Missing authMethod" });

    // Validate Dominican ID format: 000-0000000-0
    const dominicanIdRegex = /^\d{3}-\d{7}-\d{1}$/;
    if (!dominicanIdRegex.test(socialId)) {
      return res
        .status(400)
        .json({ error: "Invalid Dominican ID format. Use: 000-0000000-0" });
    }

    const existingById = await getUserBySocialId(socialId);
    if (existingById) {
      return res.status(400).json({ error: "User already exists" });
    }

    // Check if MetaMask address is already registered by another user
    if (authMethod === "metamask" && metamaskAddress) {
      const existingUser = await findUserByAddress(metamaskAddress);

      if (existingUser) {
        return res.status(400).json({
          error: "This MetaMask wallet is already registered to another user",
        });
      }
    }

    let address,
      privateKey = null,
      fundTxHash = null;

    if (authMethod === "metamask") {
      if (!metamaskAddress) {
        return res.status(400).json({ error: "Missing MetaMask address" });
      }
      address = metamaskAddress;
    } else if (authMethod === "generated") {
      // Generate a new wallet
      const wallet = ethers.Wallet.createRandom();
      privateKey = wallet.privateKey;
      address = wallet.address; // Fund wallet with small amount for gas
      const relayerWallet = new ethers.Wallet(
        process.env.RELAYER_PRIVATE_KEY || process.env.RELAYER_PK,
        provider,
      );
      const walletFundingAmount = ethers.parseEther("0.0000001");
      const feeData = await provider.getFeeData();
      const estimatedGasPrice =
        feeData.maxFeePerGas || ethers.parseUnits("0.1", "gwei");
      const estimatedFundingFee = 21000n * estimatedGasPrice;
      const requiredBalance = walletFundingAmount + estimatedFundingFee;
      const relayerBalance = await provider.getBalance(relayerWallet.address);

      if (relayerBalance < requiredBalance) {
        return res.status(503).json({
          error:
            "El relayer no tiene fondos suficientes para generar y financiar una wallet nueva.",
          relayerAddress: relayerWallet.address,
          relayerBalance: ethers.formatEther(relayerBalance),
          requiredBalance: ethers.formatEther(requiredBalance),
        });
      }

      const fundTx = await relayerWallet.sendTransaction({
        to: address,
        value: walletFundingAmount,
      });
      await fundTx.wait();
      fundTxHash = fundTx.hash;
    } else {
      return res
        .status(400)
        .json({ error: "Invalid authMethod. Use 'metamask' or 'generated'" });
    }

    const createdUser = await prisma.user.create({
      data: {
        socialId,
        address,
        // Do not persist private keys in the database by default for security.
        privateKey: null,
        name,
        province,
        authMethod,
      },
    });

    const response = {
      socialId,
      address,
      name,
      province,
      authMethod,
      registeredAt: createdUser.registeredAt.toISOString(),
    };

    if (privateKey) response.privateKey = privateKey;
    if (fundTxHash) response.fundTxHash = fundTxHash;

    res.json(response);
  } catch (error) {
    console.error("User register error:", error.message || error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * @swagger
 * /users/{socialId}:
 *   get:
 *     summary: Get wallet info by social ID
 *     parameters:
 *       - in: path
 *         name: socialId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Wallet info
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 socialId:
 *                   type: string
 *                 address:
 *                   type: string
 */
app.get("/users/:socialId", async (req, res) => {
  const { socialId } = req.params;
  const user = await getUserBySocialId(socialId);
  if (!user) return res.status(404).json({ error: "User not found" });
  res.json({ socialId, address: user.address });
});

/**
 * @swagger
 * /elections/{electionId}/has-voted/{socialId}:
 *   get:
 *     summary: Check if a user has voted in an election
 *     parameters:
 *       - in: path
 *         name: electionId
 *         required: true
 *         schema:
 *           type: integer
 *       - in: path
 *         name: socialId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Voting status
 */
app.get("/elections/:electionId/has-voted/:socialId", async (req, res) => {
  try {
    const { electionId, socialId } = req.params;
    const user = await getUserBySocialId(socialId);

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    // Check blockchain for voting status using the contract's hasVoted function
    try {
      const hasVoted = await votingContract.hasVoted(electionId, user.address);
      res.json({ hasVoted: hasVoted });
    } catch (contractError) {
      console.log("Contract call failed:", contractError.message);
      res.json({ hasVoted: false });
    }
  } catch (error) {
    console.error("Has voted check error:", error.message);
    res.status(500).json({ error: error.message });
  }
});

// ================= Users =================

/**
 * @swagger
 * /users:
 *   get:
 *     summary: Get all registered users (for login validation)
 *     responses:
 *       200:
 *         description: List of all registered users
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               additionalProperties:
 *                 type: object
 *                 properties:
 *                   socialId:
 *                     type: string
 *                   name:
 *                     type: string
 *                   address:
 *                     type: string
 *                   province:
 *                     type: string
 *                   authMethod:
 *                     type: string
 */
app.get("/users", async (req, res) => {
  try {
    const users = await getUsersMap();
    res.json(users);
  } catch (error) {
    console.error("Get users error:", error.message);
    res.status(500).json({ error: "Failed to retrieve users" });
  }
});

/**
 * Admin login
 * POST /admin/login
 * body: { username, password }
 */
app.post("/admin/login", async (req, res) => {
  try {
    const { username, password } = req.body;
    if (!username || !password)
      return res.status(400).json({ error: "Missing credentials" });
    const admin = await prisma.admin.findUnique({ where: { username } });
    if (!admin) return res.status(401).json({ error: "Invalid credentials" });
    const match = await bcrypt.compare(password, admin.passwordHash);
    if (!match) return res.status(401).json({ error: "Invalid credentials" });
    if (!admin.isActive)
      return res.status(403).json({ error: "Admin inactive" });
    const token = jwt.sign(
      {
        adminId: admin.id,
        role: admin.role,
        tokenVersion: admin.tokenVersion || 0,
      },
      ADMIN_JWT_SECRET,
      { expiresIn: "8h" },
    );
    // Set token as httpOnly secure cookie
    res.cookie("admin_token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 8 * 60 * 60 * 1000, // 8 hours
    });
    // Audit: record successful login
    await recordAdminAudit(
      { headers: req.headers, ip: req.ip, admin: { id: admin.id } },
      "login",
      admin.id,
      {
        username: admin.username,
      },
    );

    res.json({
      admin: { id: admin.id, username: admin.username, role: admin.role },
    });
  } catch (err) {
    console.error("Admin login error:", err.message || err);
    res.status(500).json({ error: "Internal error" });
  }
});

// Admin logout - clears cookie
app.post("/admin/logout", async (req, res) => {
  try {
    res.clearCookie("admin_token", {
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
    });
    res.json({ ok: true });
  } catch (err) {
    console.error("Admin logout error:", err.message || err);
    res.status(500).json({ error: "Failed to logout" });
  }
});

/**
 * @swagger
 * /metrics/provinces:
 *   get:
 *     summary: Get global province vote metrics from the database
 *     responses:
 *       200:
 *         description: Province metrics grouped from users and votes
 */
app.get("/metrics/provinces", async (req, res) => {
  try {
    const [registeredUsersByProvince, voteMetricsByProvince, totals] =
      await Promise.all([
        prisma.user.groupBy({
          by: ["province"],
          _count: { _all: true },
        }),
        prisma.$queryRaw`
        SELECT
          "province",
          COUNT(*)::int AS "votesCast",
          COUNT(DISTINCT "userId")::int AS "participatingUsers"
        FROM "Vote"
        GROUP BY "province"
      `,
        Promise.all([
          prisma.user.count(),
          prisma.vote.count(),
          prisma.vote.groupBy({
            by: ["userId"],
            _count: { _all: true },
          }),
        ]),
      ]);

    const registeredMap = new Map(
      registeredUsersByProvince.map((item) => [
        item.province,
        item._count._all,
      ]),
    );
    const votesMap = new Map(
      voteMetricsByProvince.map((item) => [
        item.province,
        {
          votesCast: Number(item.votesCast) || 0,
          participatingUsers: Number(item.participatingUsers) || 0,
        },
      ]),
    );

    const provinceNames = new Set([
      ...registeredUsersByProvince.map((item) => item.province),
      ...voteMetricsByProvince.map((item) => item.province),
    ]);

    const provinces = [...provinceNames]
      .map((province) => {
        const registeredUsers = registeredMap.get(province) || 0;
        const voteMetrics = votesMap.get(province) || {
          votesCast: 0,
          participatingUsers: 0,
        };

        return {
          name: province,
          registeredUsers,
          votesCast: voteMetrics.votesCast,
          participatingUsers: voteMetrics.participatingUsers,
          participationRate:
            registeredUsers > 0
              ? Number(
                  (
                    (voteMetrics.participatingUsers / registeredUsers) *
                    100
                  ).toFixed(1),
                )
              : 0,
        };
      })
      .sort((a, b) => b.votesCast - a.votesCast);

    const [registeredUsers, totalVotesCast, distinctVotersByProvince] = totals;
    const globalParticipatingUsers = distinctVotersByProvince.length;

    res.json({
      generatedAt: new Date().toISOString(),
      totals: {
        registeredUsers,
        votesCast: totalVotesCast,
        participatingUsers: globalParticipatingUsers,
        participationRate:
          registeredUsers > 0
            ? Number(
                ((globalParticipatingUsers / registeredUsers) * 100).toFixed(1),
              )
            : 0,
      },
      provinces,
    });
  } catch (error) {
    console.error("Get province metrics error:", error.message || error);
    res.status(500).json({ error: "Failed to retrieve province metrics" });
  }
});

// ================= System Health =================

/**
 * @swagger
 * /health:
 *   get:
 *     summary: Get system health status
 *     responses:
 *       200:
 *         description: System health information
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                 timestamp:
 *                   type: string
 *                 services:
 *                   type: object
 */
app.get("/health", async (req, res) => {
  try {
    let userCount = 0;
    let dbStatus = "online";
    let dbMessage = "SQLite database accessible";

    try {
      userCount = await countUsers();
    } catch (dbError) {
      dbStatus = "error";
      dbMessage = `Database unavailable: ${dbError.message}`;
    }

    const health = {
      status: "healthy",
      timestamp: new Date().toISOString(),
      services: {
        api: {
          status: "online",
          message: "API server running",
        },
        database: {
          status: dbStatus,
          message: dbMessage,
          userCount,
        },
        blockchain: {
          status: "checking",
          message: "Checking blockchain connection...",
        },
      },
    };

    // Test blockchain connection
    try {
      const blockNumber = await provider.getBlockNumber();
      health.services.blockchain = {
        status: "online",
        message: `Connected to block ${blockNumber}`,
        currentBlock: blockNumber,
      };
    } catch (blockchainError) {
      health.services.blockchain = {
        status: "error",
        message: "Blockchain connection failed",
        error: blockchainError.message,
      };
      health.status = "degraded";
    }

    if (dbStatus !== "online") {
      health.status = "degraded";
    }

    res.json(health);
  } catch (error) {
    console.error("Health check error:", error);
    res.status(500).json({
      status: "error",
      timestamp: new Date().toISOString(),
      error: error.message,
    });
  }
});

// ================= Election Management =================

/**
 * @swagger
 * /elections:
 *   get:
 *     summary: List all elections (IDs & names)
 *     responses:
 *       200:
 *         description: Array of elections
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   electionId:
 *                     type: integer
 *                   name:
 *                     type: string
 */
app.get("/elections", async (req, res) => {
  try {
    const list = [];

    // Get total elections with retry
    const nextIdBN = await retryWithBackoff(() =>
      votingContract.nextElectionId(),
    );
    const nextId = Number(nextIdBN);

    for (let i = 1; i < nextId; i++) {
      try {
        // Get election details with retry and delay
        const [name, _] = await retryWithBackoff(() =>
          votingContract.getElection(i),
        );

        // Asegurar que el nombre se maneja correctamente y limpiar caracteres problemáticos
        const cleanName = (typeof name === "string" ? name : name.toString())
          .replace(/�/g, "ó")
          .replace(/\u0000/g, "")
          .trim();
        list.push({ electionId: i, name: cleanName });

        // Add delay between calls to avoid rate limiting
        if (i < nextId - 1) {
          await delay(100); // 100ms delay between election calls
        }
      } catch (error) {
        console.warn(
          `Elections list: Skipping invalid election ${i}:`,
          error.message,
        );
        // Skip invalid elections instead of breaking the entire list
        continue;
      }
    }
    res.json(list);
  } catch (error) {
    console.error("List elections error:", error.message || error);

    // Check if it's a circuit breaker error
    const isCircuitBreakerOpen =
      error.message && error.message.includes("Circuit breaker is OPEN");

    // Check if it's a rate limiting error
    const isRateLimit =
      error.message &&
      (error.message.includes("rate limit") ||
        error.message.includes("Rate limit") ||
        error.message.includes("Too Many Requests") ||
        error.code === -32016);

    if (isCircuitBreakerOpen) {
      return res.status(503).json({
        error: "Service temporarily unavailable due to high load",
        retryAfter: 30, // seconds
      });
    }

    if (isRateLimit) {
      return res.status(429).json({
        error: "Rate limit exceeded, please try again later",
        retryAfter: 5, // seconds
      });
    }

    res.status(500).json({ error: error.message });
  }
});

// ================= Election Management =================

/**
 * @swagger
 * /elections/create:
 *   post:
 *     summary: Create a new election (with start/end dates)
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - candidates
 *               - startTime
 *               - endTime
 *             properties:
 *               name:
 *                 type: string
 *                 description: Display name of the election
 *               candidates:
 *                 type: array
 *                 items:
 *                   type: string
 *                 description: Array of candidate names
 *               startTime:
 *                 type: integer
 *                 description: UNIX timestamp (in seconds) when voting opens
 *               endTime:
 *                 type: integer
 *                 description: UNIX timestamp (in seconds) when voting closes
 *     responses:
 *       200:
 *         description: Election created (tx hash + block)
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 txHash:
 *                   type: string
 *                 blockNumber:
 *                   type: integer
 *       400:
 *         description: Bad request (e.g., missing fields or endTime ≤ startTime)
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 */
app.post("/elections/create", async (req, res) => {
  try {
    const { name, candidates, startTime, endTime } = req.body;
    if (!name || !Array.isArray(candidates) || !startTime || !endTime) {
      return res.status(400).json({ error: "Missing required fields" });
    }
    if (endTime <= startTime) {
      return res.status(400).json({ error: "endTime must be > startTime" });
    }

    console.log("Creando elección con nombre:", name);
    console.log("Candidatos:", candidates);

    const signer = new ethers.Wallet(
      process.env.RELAYER_PRIVATE_KEY || process.env.RELAYER_PK,
      provider,
    );
    const contractWithSigner = new ethers.Contract(
      process.env.VOTING_CONTRACT_ADDRESS || process.env.CONTRACT_ADDRESS,
      abi,
      signer,
    );
    const tx = await contractWithSigner.createElection(
      name,
      candidates,
      startTime,
      endTime,
      {
        gasLimit: 450_000,
        maxFeePerGas: ethers.parseUnits("0.1", "gwei"),
        maxPriorityFeePerGas: ethers.parseUnits("0.01", "gwei"),
      },
    );
    const receipt = await tx.wait();
    res.json({
      success: true,
      txHash: receipt.transactionHash,
      blockNumber: receipt.blockNumber,
    });
  } catch (error) {
    console.error("Create election error:", error.message || error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * @swagger
 * /elections/{id}:
 *   get:
 *     summary: Get election details by ID (including start/end times and disabled flag)
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Election ID
 *     responses:
 *       200:
 *         description: Election details
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 electionId:
 *                   type: integer
 *                 name:
 *                   type: string
 *                 candidates:
 *                   type: array
 *                   items:
 *                     type: string
 *                 startTime:
 *                   type: integer
 *                   description: UNIX timestamp (seconds)
 *                 endTime:
 *                   type: integer
 *                   description: UNIX timestamp (seconds)
 *                 disabled:
 *                   type: boolean
 *                   description: True if voting is disabled
 *       404:
 *         description: Election not found
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 */
app.get("/elections/:id", async (req, res) => {
  try {
    const electionId = parseInt(req.params.id, 10);

    // Check if election exists with retry
    const nextIdBN = await retryWithBackoff(() =>
      votingContract.nextElectionId(),
    );
    const nextId = Number(nextIdBN);
    if (electionId < 1 || electionId >= nextId) {
      return res.status(404).json({ error: "Election not found" });
    }

    // Get election details with retry
    let [name, candidates, startTime, endTime, disabled] =
      await retryWithBackoff(() => votingContract.getElection(electionId));

    // Función para limpiar strings que pueden tener problemas de codificación
    const cleanString = (str) => {
      if (typeof str !== "string") {
        str = str.toString();
      }
      // Reemplazar caracteres problemáticos
      return str
        .replace(/�/g, "ó")
        .replace(/\u0000/g, "")
        .trim();
    };

    name = cleanString(name);
    if (Array.isArray(candidates)) {
      candidates = candidates.map((c) => cleanString(c));
    }

    startTime = Number(startTime);
    endTime = Number(endTime);
    // console.log("Election details:", { electionId, name, candidates, startTime, endTime, disabled });
    res.json({ electionId, name, candidates, startTime, endTime, disabled });
  } catch (error) {
    console.error("Get election error:", error.message || error);

    // Check if it's a rate limiting error
    const isRateLimit =
      error.message &&
      (error.message.includes("rate limit") ||
        error.message.includes("Rate limit") ||
        error.message.includes("Too Many Requests") ||
        error.code === -32016);

    if (isRateLimit) {
      return res.status(429).json({
        error: "Rate limit exceeded, please try again later",
        retryAfter: 5, // seconds
      });
    }

    // Check if it's a contract call error (election doesn't exist)
    if (
      error.message &&
      (error.message.includes("execution reverted") ||
        error.message.includes("invalid opcode") ||
        error.message.includes("revert"))
    ) {
      return res.status(404).json({ error: "Election not found" });
    }

    res.status(500).json({ error: error.message });
  }
});

/**
 * @swagger
 * /elections/{id}/disable:
 *   put:
 *     summary: Disable voting for an election
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Election ID
 *     responses:
 *       200:
 *         description: Election disabled successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 txHash:
 *                   type: string
 *                 blockNumber:
 *                   type: integer
 *       404:
 *         description: Election not found
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 */
app.put("/elections/:id/disable", async (req, res) => {
  try {
    const electionId = parseInt(req.params.id, 10);
    const nextIdBN = await votingContract.nextElectionId();
    const nextId = Number(nextIdBN);
    if (electionId < 1 || electionId >= nextId) {
      return res.status(404).json({ error: "Election not found" });
    }

    const signer = new ethers.Wallet(
      process.env.RELAYER_PRIVATE_KEY || process.env.RELAYER_PK,
      provider,
    );
    const contractWithSigner = new ethers.Contract(
      process.env.VOTING_CONTRACT_ADDRESS || process.env.CONTRACT_ADDRESS,
      abi,
      signer,
    );
    const tx = await contractWithSigner.disableElection(electionId, {
      gasLimit: 100_000,
      maxFeePerGas: ethers.parseUnits("0.1", "gwei"),
      maxPriorityFeePerGas: ethers.parseUnits("0.01", "gwei"),
    });
    const receipt = await tx.wait();
    res.json({
      success: true,
      txHash: receipt.transactionHash,
      blockNumber: receipt.blockNumber,
    });
  } catch (error) {
    console.error("Disable election error:", error.message || error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * @swagger
 * /elections/{id}/enable:
 *   put:
 *     summary: Re-enable voting for a disabled election
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Election ID
 *     responses:
 *       200:
 *         description: Election enabled successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 txHash:
 *                   type: string
 *                 blockNumber:
 *                   type: integer
 *       404:
 *         description: Election not found
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 */
app.put("/elections/:id/enable", async (req, res) => {
  try {
    const electionId = parseInt(req.params.id, 10);
    const nextIdBN = await votingContract.nextElectionId();
    const nextId = Number(nextIdBN);
    if (electionId < 1 || electionId >= nextId) {
      return res.status(404).json({ error: "Election not found" });
    }

    const signer = new ethers.Wallet(
      process.env.RELAYER_PRIVATE_KEY || process.env.RELAYER_PK,
      provider,
    );
    const contractWithSigner = new ethers.Contract(
      process.env.VOTING_CONTRACT_ADDRESS || process.env.CONTRACT_ADDRESS,
      abi,
      signer,
    );
    const tx = await contractWithSigner.enableElection(electionId, {
      gasLimit: 100_000,
      maxFeePerGas: ethers.parseUnits("0.1", "gwei"),
      maxPriorityFeePerGas: ethers.parseUnits("0.01", "gwei"),
    });
    const receipt = await tx.wait();
    res.json({
      success: true,
      txHash: receipt.transactionHash,
      blockNumber: receipt.blockNumber,
    });
  } catch (error) {
    console.error("Enable election error:", error.message || error);
    res.status(500).json({ error: error.message });
  }
});

// GET /elections/:id/results (no change needed for time/disabled—it’s read-only)

/**
 * @swagger
 * /elections/{id}/edit-name:
 *   put:
 *     summary: Change an existing election’s name
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *     responses:
 *       200:
 *         description: Name updated
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 txHash:
 *                   type: string
 *                 blockNumber:
 *                   type: integer
 */
app.put("/elections/:id/edit-name", async (req, res) => {
  try {
    const electionId = parseInt(req.params.id, 10);
    const nextIdBN = await votingContract.nextElectionId();
    const nextId = Number(nextIdBN);
    if (electionId < 1 || electionId >= nextId) {
      return res.status(404).json({ error: "Election not found" });
    }
    const { name } = req.body;
    if (!name) return res.status(400).json({ error: "Missing new name" });

    const signer = new ethers.Wallet(
      process.env.RELAYER_PRIVATE_KEY || process.env.RELAYER_PK,
      provider,
    );
    const contractWithSigner = new ethers.Contract(
      process.env.VOTING_CONTRACT_ADDRESS || process.env.CONTRACT_ADDRESS,
      abi,
      signer,
    );
    const tx = await contractWithSigner.updateElectionName(electionId, name, {
      gasLimit: 100_000,
      maxFeePerGas: ethers.parseUnits("0.1", "gwei"),
      maxPriorityFeePerGas: ethers.parseUnits("0.01", "gwei"),
    });
    const receipt = await tx.wait();
    res.json({
      success: true,
      txHash: receipt.transactionHash,
      blockNumber: receipt.blockNumber,
    });
  } catch (error) {
    console.error("Edit name error:", error.message || error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * @swagger
 * /elections/{id}/add-candidate:
 *   put:
 *     summary: Add a candidate to an existing election
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               candidate:
 *                 type: string
 *     responses:
 *       200:
 *         description: Candidate added
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 txHash:
 *                   type: string
 *                 blockNumber:
 *                   type: integer
 */
app.put("/elections/:id/add-candidate", async (req, res) => {
  try {
    const electionId = parseInt(req.params.id, 10);
    const nextIdBN = await votingContract.nextElectionId();
    const nextId = Number(nextIdBN);
    if (electionId < 1 || electionId >= nextId) {
      return res.status(404).json({ error: "Election not found" });
    }
    const { candidate } = req.body;
    if (!candidate)
      return res.status(400).json({ error: "Missing candidate name" });

    const signer = new ethers.Wallet(
      process.env.RELAYER_PRIVATE_KEY || process.env.RELAYER_PK,
      provider,
    );
    const contractWithSigner = new ethers.Contract(
      process.env.VOTING_CONTRACT_ADDRESS || process.env.CONTRACT_ADDRESS,
      abi,
      signer,
    );
    const tx = await contractWithSigner.addCandidate(electionId, candidate, {
      gasLimit: 100_000,
      maxFeePerGas: ethers.parseUnits("0.1", "gwei"),
      maxPriorityFeePerGas: ethers.parseUnits("0.01", "gwei"),
    });
    const receipt = await tx.wait();
    res.json({
      success: true,
      txHash: receipt.transactionHash,
      blockNumber: receipt.blockNumber,
    });
  } catch (error) {
    console.error("Add candidate error:", error.message || error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * @swagger
 * /elections/{id}/results:
 *   get:
 *     summary: View current vote counts for an election
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Results by candidate
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               additionalProperties:
 *                 type: integer
 */
// Helper function to add delay between RPC calls to avoid rate limiting
const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

// Circuit breaker para evitar sobrecargas en el nodo RPC
class CircuitBreaker {
  constructor(threshold = 5, timeout = 30000) {
    this.failureThreshold = threshold;
    this.timeout = timeout;
    this.failureCount = 0;
    this.lastFailureTime = null;
    this.state = "CLOSED"; // CLOSED, OPEN, HALF_OPEN
  }

  async execute(fn) {
    if (this.state === "OPEN") {
      if (Date.now() - this.lastFailureTime > this.timeout) {
        this.state = "HALF_OPEN";
        console.log("Circuit breaker: Transitioning to HALF_OPEN state");
      } else {
        throw new Error(
          "Circuit breaker is OPEN - service temporarily unavailable",
        );
      }
    }

    try {
      const result = await fn();
      this.onSuccess();
      return result;
    } catch (error) {
      this.onFailure();
      throw error;
    }
  }

  onSuccess() {
    this.failureCount = 0;
    this.state = "CLOSED";
  }

  onFailure() {
    this.failureCount++;
    this.lastFailureTime = Date.now();

    if (this.failureCount >= this.failureThreshold) {
      this.state = "OPEN";
      console.warn(
        `Circuit breaker: OPEN state activated after ${this.failureCount} failures`,
      );
    }
  }
}

const circuitBreaker = new CircuitBreaker(5, 30000); // 5 fallos, 30 segundos timeout

// Helper function to retry RPC calls with exponential backoff and circuit breaker
async function retryWithBackoff(fn, maxRetries = 3, baseDelay = 1000) {
  return await circuitBreaker.execute(async () => {
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        return await fn();
      } catch (error) {
        const isRateLimit =
          error.message &&
          (error.message.includes("rate limit") ||
            error.message.includes("Rate limit") ||
            error.message.includes("Too Many Requests") ||
            error.code === -32016 ||
            error.message.includes("429"));

        const isNodeError =
          error.message &&
          (error.message.includes("missing revert data") ||
            error.message.includes("CALL_EXCEPTION") ||
            error.message.includes("network timeout") ||
            error.message.includes("connection timeout"));

        if ((isRateLimit || isNodeError) && attempt < maxRetries) {
          const delayMs =
            baseDelay * Math.pow(2, attempt - 1) + Math.random() * 1000;
          console.warn(
            `RPC error (${
              isRateLimit ? "rate limit" : "node error"
            }), retrying in ${delayMs}ms (attempt ${attempt}/${maxRetries}): ${
              error.message
            }`,
          );
          await delay(delayMs);
          continue;
        }
        throw error;
      }
    }
  });
}

app.get("/elections/:id/results", async (req, res) => {
  try {
    const electionId = parseInt(req.params.id, 10);

    // Check if election exists with retry
    const nextIdBN = await retryWithBackoff(() =>
      votingContract.nextElectionId(),
    );
    const nextId = Number(nextIdBN);
    if (electionId < 1 || electionId >= nextId) {
      return res.status(404).json({ error: "Election not found" });
    }

    console.log(`Obteniendo resultados para la elección ${electionId}`);

    // Get candidates with retry
    const candidates = await retryWithBackoff(() =>
      votingContract.getCandidates(electionId),
    );
    console.log(`Candidatos encontrados: ${JSON.stringify(candidates)}`);

    const results = {};

    // Get vote counts sequentially with delays to avoid rate limiting
    for (let i = 0; i < candidates.length; i++) {
      const name = candidates[i];
      console.log(`Obteniendo votos para candidato: ${name}`);

      try {
        const countBN = await retryWithBackoff(() =>
          votingContract.getVoteCount(electionId, name),
        );
        results[name] = Number(countBN);

        // Add delay between calls to avoid hitting rate limits
        if (i < candidates.length - 1) {
          await delay(200); // 200ms delay between vote count calls
        }
      } catch (error) {
        console.error(`Error al obtener votos para ${name}:`, error.message);
        results[name] = 0; // Valor por defecto en caso de error
      }
    }

    res.json(results);
  } catch (error) {
    console.error("Get results error:", error.message || error);

    // Check if it's a rate limiting error
    const isRateLimit =
      error.message &&
      (error.message.includes("rate limit") ||
        error.message.includes("Rate limit") ||
        error.message.includes("Too Many Requests") ||
        error.code === -32016);

    if (isRateLimit) {
      return res.status(429).json({
        error: "Rate limit exceeded, please try again later",
        retryAfter: 5, // seconds
      });
    }

    // Check if it's a contract call error (election doesn't exist)
    if (
      error.message &&
      (error.message.includes("execution reverted") ||
        error.message.includes("invalid opcode") ||
        error.message.includes("revert"))
    ) {
      return res.status(404).json({ error: "Election not found" });
    }

    res.status(500).json({ error: error.message });
  }
});

// ================= Voting =================

/**
 * @swagger
 * /vote:
 *   post:
 *     summary: Vote in an election via social ID (meta-transaction)
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               socialId:
 *                 type: string
 *               electionId:
 *                 type: integer
 *               candidate:
 *                 type: string
 *               signature:
 *                 type: string
 *     responses:
 *       200:
 *         description: Vote submitted (txHash + block)
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 txHash:
 *                   type: string
 *                 blockNumber:
 *                   type: integer
 */
app.post("/vote", async (req, res) => {
  try {
    console.log("Vote request received:", req.body);
    const { socialId, electionId, selectedCandidate, signature } = req.body;
    if (!socialId || !electionId || !selectedCandidate || !signature) {
      return res.status(400).json({ error: "Missing fields" });
    }

    const user = await getUserBySocialId(socialId);
    if (!user) return res.status(400).json({ error: "User not registered" });

    const voterAddress = user.address; // Build message hash exactly as contract expects
    const contractAddress =
      process.env.VOTING_CONTRACT_ADDRESS || process.env.CONTRACT_ADDRESS;
    const messageHash = ethers.solidityPackedKeccak256(
      ["uint256", "string", "address", "address"],
      [electionId, selectedCandidate, voterAddress, contractAddress],
    );

    console.log("Backend verification data:", {
      electionId,
      selectedCandidate,
      voterAddress,
      contractAddress,
      messageHash,
    });

    // Verify signature was signed by this user
    // Use getBytes() to match how the contract verifies (32-byte data, not string)
    const recovered = ethers.verifyMessage(
      ethers.getBytes(messageHash),
      signature,
    );
    console.log("Recovered address:", recovered);
    console.log("Voter address:", voterAddress);
    if (recovered.toLowerCase() !== voterAddress.toLowerCase()) {
      return res.status(400).json({ error: "Invalid signature for this user" });
    }

    // Forward to relayer
    const relayerUrl = "http://localhost:3001/meta-vote";
    const response = await axios.post(
      relayerUrl,
      {
        electionId,
        selectedCandidate,
        voter: voterAddress,
        signature,
      },
      {
        headers: { "Content-Type": "application/json" },
      },
    );
    const data = response.data; // axios already parses JSON, no need for .json()

    try {
      await recordVoteInDatabase({
        user,
        electionId,
        txHash: data?.txHash,
      });
    } catch (dbError) {
      console.error("Vote DB write error:", dbError.message || dbError);
    }

    res.json(data);
  } catch (error) {
    console.error("Vote error:", error.message || error);
    if (error.response?.status && error.response?.data) {
      return res.status(error.response.status).json(error.response.data);
    }

    res.status(500).json({ error: error.message });
  }
});

// (Removed duplicate simple health endpoint; comprehensive health endpoint is declared earlier.)

const PORT = 3000;
app.listen(PORT, () => {
  const startTime = new Date().toLocaleTimeString();
  console.log("\n" + "=".repeat(50));
  console.log(`� BlockVote API Server v2.0 Iniciado!`);
  console.log(`⏰ Hora de inicio: ${startTime}`);
  console.log(`🔗 URL: http://localhost:${PORT}`);
  console.log(`📚 Documentación: http://localhost:${PORT}/api-docs`);
  console.log(`🌡️ Ambiente: ${process.env.NODE_ENV || "development"}`);
  console.log(
    `🧠 Memoria: ${Math.round(process.memoryUsage().rss / 1024 / 1024)} MB`,
  );
  console.log(`🛠️ Para detener el servidor: Ctrl+C`);
  console.log("=".repeat(50) + "\n");
});

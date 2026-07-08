require("dotenv").config();

const { PrismaClient } = require("@prisma/client");

async function main() {
  if (!process.env.DATABASE_URL) {
    console.error(
      "❌ DATABASE_URL no está definido. Revisa backend/.env antes de validar la conexión.",
    );
    process.exitCode = 1;
    return;
  }

  const prisma = new PrismaClient();

  try {
    console.log("🔎 Verificando conexión a la base de datos...");

    await prisma.$connect();
    await prisma.$queryRaw`SELECT 1`;

    console.log("✅ Conexión establecida correctamente con PostgreSQL.");
  } catch (error) {
    console.error("❌ No se pudo conectar a la base de datos.");
    console.error(error.message || error);
    process.exitCode = 1;
  } finally {
    try {
      await prisma.$disconnect();
    } catch {}
  }
}

main();

require("dotenv").config();
const { PrismaClient } = require("@prisma/client");

async function main() {
  const prisma = new PrismaClient();
  try {
    const res = await prisma.user.updateMany({ data: { privateKey: null } });
    console.log("Private keys cleared for", res.count, "users");
  } catch (err) {
    console.error("Failed to clear private keys:", err.message || err);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();

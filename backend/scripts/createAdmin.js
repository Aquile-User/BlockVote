require("dotenv").config();
const { PrismaClient } = require("@prisma/client");
const bcrypt = require("bcrypt");

const prisma = new PrismaClient();

async function main() {
  const username = process.argv[2] || process.env.FIRST_ADMIN_USERNAME;
  const password = process.argv[3] || process.env.FIRST_ADMIN_PASSWORD;

  if (!username || !password) {
    console.error(
      "Usage: node createAdmin.js <username> <password> OR set FIRST_ADMIN_USERNAME and FIRST_ADMIN_PASSWORD in env",
    );
    process.exit(1);
  }

  const existing = await prisma.admin.findUnique({ where: { username } });
  if (existing) {
    console.error("Admin already exists with username:", username);
    process.exit(1);
  }

  const saltRounds = 12;
  const hash = await bcrypt.hash(password, saltRounds);

  const created = await prisma.admin.create({
    data: {
      username,
      passwordHash: hash,
      role: "superadmin",
      isActive: true,
    },
  });

  console.log("Created admin:", { id: created.id, username: created.username });
  process.exit(0);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});

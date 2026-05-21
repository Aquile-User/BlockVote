const path = require("path");
const sqlite3 = require("sqlite3").verbose();
require("dotenv").config();
const { PrismaClient } = require("@prisma/client");

const sqlitePath = path.resolve(__dirname, "../prisma/prisma/dev.db");

async function main() {
  if (!require("fs").existsSync(sqlitePath)) {
    console.error("SQLite source DB not found at", sqlitePath);
    process.exit(1);
  }

  const db = new sqlite3.Database(sqlitePath);
  const prisma = new PrismaClient();

  const rows = await new Promise((resolve, reject) => {
    db.all(
      'SELECT socialId, address, privateKey, name, province, authMethod, registeredAt FROM "User"',
      (err, rows) => {
        if (err) return reject(err);
        resolve(rows || []);
      },
    );
  });

  let migrated = 0;
  for (const r of rows) {
    try {
      const skipPrivate = process.env.SKIP_PRIVATEKEY === "true" || false;
      await prisma.user.upsert({
        where: { socialId: r.socialId },
        update: {
          address: r.address,
          privateKey: skipPrivate ? null : r.privateKey || null,
          name: r.name,
          province: r.province,
          authMethod: r.authMethod,
          registeredAt: r.registeredAt ? new Date(r.registeredAt) : new Date(),
        },
        create: {
          socialId: r.socialId,
          address: r.address,
          privateKey: skipPrivate ? null : r.privateKey || null,
          name: r.name,
          province: r.province,
          authMethod: r.authMethod,
          registeredAt: r.registeredAt ? new Date(r.registeredAt) : new Date(),
        },
      });
      migrated += 1;
    } catch (err) {
      console.warn("Failed to upsert", r.socialId, err.message);
    }
  }

  console.log(`Import completed. Rows migrated: ${migrated}`);
  db.close();
  await prisma.$disconnect();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});

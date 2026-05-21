require("dotenv").config();
process.env.DATABASE_URL = process.env.DATABASE_URL || "file:./prisma/dev.db";
const fs = require("fs");
const path = require("path");
const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

async function main() {
  const usersPath = path.resolve(__dirname, "../users.json");

  if (!fs.existsSync(usersPath)) {
    console.log("No se encontro users.json. No hay datos para migrar.");
    return;
  }

  const raw = fs.readFileSync(usersPath, "utf8");
  const start = raw.indexOf("{");
  const end = raw.lastIndexOf("}");
  const jsonPayload =
    start !== -1 && end !== -1 && end >= start
      ? raw.slice(start, end + 1)
      : "{}";

  const users = jsonPayload ? JSON.parse(jsonPayload) : {};
  const entries = Object.entries(users);

  if (entries.length === 0) {
    console.log("users.json esta vacio. No hay datos para migrar.");
    return;
  }

  let migrated = 0;

  for (const [socialId, user] of entries) {
    if (!user || !user.address || !user.name || !user.province || !user.authMethod) {
      console.warn(`Saltando usuario invalido: ${socialId}`);
      continue;
    }

    const skipPrivate = process.env.SKIP_PRIVATEKEY === 'true' || false;
    await prisma.user.upsert({
      where: { socialId },
      update: {
        address: user.address,
        privateKey: skipPrivate ? null : user.privateKey || null,
        name: user.name,
        province: user.province,
        authMethod: user.authMethod,
        registeredAt: user.registeredAt ? new Date(user.registeredAt) : new Date(),
      },
      create: {
        socialId,
        address: user.address,
        privateKey: skipPrivate ? null : user.privateKey || null,
        name: user.name,
        province: user.province,
        authMethod: user.authMethod,
        registeredAt: user.registeredAt ? new Date(user.registeredAt) : new Date(),
      },
    });

    migrated += 1;
  }

  console.log(`Migracion completada. Usuarios procesados: ${migrated}`);
}

main()
  .catch((error) => {
    console.error("Error en migracion:", error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

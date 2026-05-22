const { PrismaClient } = require("@prisma/client");
(async () => {
  const prisma = new PrismaClient();
  try {
    const res = await prisma.$queryRawUnsafe(
      "SELECT to_regclass('public.\"AdminAudit\"')::text AS tbl",
    );
    console.log(res);
  } catch (e) {
    console.error("ERROR", e);
    process.exit(2);
  } finally {
    await prisma.$disconnect();
  }
})();

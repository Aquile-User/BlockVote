const { PrismaClient } = require("@prisma/client");
(async () => {
  const prisma = new PrismaClient();
  try {
    const admins = await prisma.admin.findMany({ orderBy: { id: "asc" } });
    console.log(admins);
  } catch (e) {
    console.error("ERROR", e);
  } finally {
    await prisma.$disconnect();
  }
})();

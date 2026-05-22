const { PrismaClient } = require("@prisma/client");
(async () => {
  const prisma = new PrismaClient();
  try {
    const a = await prisma.admin.findUnique({ where: { username: "Aquile" } });
    console.log("Before tokenVersion:", a && a.tokenVersion);
    const u = await prisma.admin.update({
      where: { username: "Aquile" },
      data: { tokenVersion: { increment: 1 } },
    });
    console.log("After tokenVersion:", u && u.tokenVersion);
  } catch (e) {
    console.error("Error:", e);
  } finally {
    await prisma.$disconnect();
  }
})();

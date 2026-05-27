const fetch = (...args) =>
  import("node-fetch").then(({ default: fetch }) => fetch(...args));
const { PrismaClient } = require("@prisma/client");
(async () => {
  const prisma = new PrismaClient();
  try {
    const base = "http://localhost:3000";
    // 1. Login
    const loginRes = await fetch(base + "/admin/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        username: "test_super",
        password: "TestPass123!",
      }),
    });
    console.log("Login status", loginRes.status);
    const setCookie = loginRes.headers.get("set-cookie");
    console.log("Set-Cookie:", setCookie);
    if (!setCookie) throw new Error("Login failed or no set-cookie");
    const cookie = setCookie.split(";")[0];

    // 2. Create admin
    const createRes = await fetch(base + "/admin/admins", {
      method: "POST",
      headers: { "Content-Type": "application/json", Cookie: cookie },
      body: JSON.stringify({
        username: "temp_admin",
        password: "TempPass123!",
        role: "admin",
      }),
    });
    console.log("Create admin status", createRes.status);
    const created = await createRes.json().catch(() => null);
    console.log("Created body", created);
    const newAdminId = created && created.id;

    // 3. Change password of new admin (as superadmin)
    if (newAdminId) {
      const patchRes = await fetch(base + `/admin/admins/${newAdminId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", Cookie: cookie },
        body: JSON.stringify({ password: "NewTempPass!234" }),
      });
      console.log("Patch status", patchRes.status);
      console.log("Patch body", await patchRes.text());

      // 4. Delete admin
      const delRes = await fetch(base + `/admin/admins/${newAdminId}`, {
        method: "DELETE",
        headers: { Cookie: cookie },
      });
      console.log("Delete status", delRes.status);
    }

    // 5. Show last 10 audits
    const audits = await prisma.adminAudit.findMany({
      orderBy: { createdAt: "desc" },
      take: 10,
    });
    console.log("Recent audits:");
    for (const a of audits) console.log(a);
  } catch (e) {
    console.error("Test error", e);
  } finally {
    await prisma.$disconnect();
  }
})();

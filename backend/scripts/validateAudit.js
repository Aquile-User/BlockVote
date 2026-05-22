const fetch = (...args) =>
  import("node-fetch").then(({ default: fetch }) => fetch(...args));
const { PrismaClient } = require("@prisma/client");

(async () => {
  const prisma = new PrismaClient();
  const base = process.env.BASE_URL || "http://localhost:3000";
  const username = process.env.ADMIN_TEST_USER || "test_super";
  const password = process.env.ADMIN_TEST_PASS || "TestPass123!";

  try {
    console.log("Login as", username);
    const loginRes = await fetch(base + "/admin/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, password }),
    });

    if (loginRes.status !== 200) {
      const t = await loginRes.text();
      throw new Error(`Login failed ${loginRes.status}: ${t}`);
    }

    const setCookie = loginRes.headers.get("set-cookie");
    if (!setCookie) throw new Error("No set-cookie received from login");
    const cookie = setCookie.split(";")[0];

    console.log("Creating temporary admin...");
    const createRes = await fetch(base + "/admin/admins", {
      method: "POST",
      headers: { "Content-Type": "application/json", Cookie: cookie },
      body: JSON.stringify({
        username: "validate_admin",
        password: "Val1d@te!",
      }),
    });
    if (createRes.status !== 201) {
      const t = await createRes.text();
      throw new Error(`Create admin failed ${createRes.status}: ${t}`);
    }
    const created = await createRes.json();
    console.log("Created admin", created);

    console.log("Changing password of temporary admin...");
    const patchRes = await fetch(base + `/admin/admins/${created.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json", Cookie: cookie },
      body: JSON.stringify({ password: "NewVal1d@te!" }),
    });
    if (patchRes.status !== 200) {
      const t = await patchRes.text();
      throw new Error(`Patch admin failed ${patchRes.status}: ${t}`);
    }
    console.log("Password changed");

    console.log("Deleting temporary admin...");
    const delRes = await fetch(base + `/admin/admins/${created.id}`, {
      method: "DELETE",
      headers: { Cookie: cookie },
    });
    if (![200, 204].includes(delRes.status)) {
      const t = await delRes.text();
      throw new Error(`Delete admin failed ${delRes.status}: ${t}`);
    }
    console.log("Deleted temporary admin");

    console.log("Fetching last 20 audit entries...");
    const audits = await prisma.adminAudit.findMany({
      orderBy: { createdAt: "desc" },
      take: 20,
    });
    console.log("Recent audits:");
    audits.forEach((a) => console.log(a));

    console.log("Validation script completed successfully");
    process.exit(0);
  } catch (err) {
    console.error("Validation failed:", err.message || err);
    process.exit(2);
  } finally {
    try {
      await prisma.$disconnect();
    } catch {}
  }
})();

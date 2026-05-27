-- CreateTable
CREATE TABLE "AdminAudit" (
  "id" SERIAL NOT NULL,
  "actorAdminId" INTEGER,
  "action" TEXT NOT NULL,
  "targetAdminId" INTEGER,
  "details" JSONB,
  "ip" TEXT,
  "userAgent" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "AdminAudit_pkey" PRIMARY KEY ("id")
);

-- Indexes
CREATE INDEX "AdminAudit_actorAdminId_idx" ON "AdminAudit" ("actorAdminId");
CREATE INDEX "AdminAudit_targetAdminId_idx" ON "AdminAudit" ("targetAdminId");
CREATE INDEX "AdminAudit_createdAt_idx" ON "AdminAudit" ("createdAt");

-- Foreign keys
ALTER TABLE "AdminAudit" ADD CONSTRAINT "AdminAudit_actorAdminId_fkey" FOREIGN KEY ("actorAdminId") REFERENCES "Admin" ("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "AdminAudit" ADD CONSTRAINT "AdminAudit_targetAdminId_fkey" FOREIGN KEY ("targetAdminId") REFERENCES "Admin" ("id") ON DELETE SET NULL ON UPDATE CASCADE;

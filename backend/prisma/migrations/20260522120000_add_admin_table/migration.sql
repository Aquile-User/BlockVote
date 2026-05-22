-- CreateTable
CREATE TABLE "Admin" (
  "id" SERIAL NOT NULL,
  "username" TEXT NOT NULL,
  "passwordHash" TEXT NOT NULL,
  "tokenVersion" INTEGER NOT NULL DEFAULT 0,
  "role" TEXT NOT NULL DEFAULT 'admin',
  "isActive" BOOLEAN NOT NULL DEFAULT TRUE,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "Admin_pkey" PRIMARY KEY ("id")
);

-- CreateIndex / Unique
CREATE UNIQUE INDEX "Admin_username_key" ON "Admin" ("username");

-- CreateIndex
CREATE INDEX "Admin_username_idx" ON "Admin" ("username");

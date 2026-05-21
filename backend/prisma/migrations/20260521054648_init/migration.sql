-- CreateTable
CREATE TABLE
    "User" (
        "id" SERIAL NOT NULL,
        "socialId" TEXT NOT NULL,
        "address" TEXT NOT NULL,
        "privateKey" TEXT,
        "name" TEXT NOT NULL,
        "province" TEXT NOT NULL,
        "authMethod" TEXT NOT NULL,
        "registeredAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT "User_pkey" PRIMARY KEY ("id")
    );

-- CreateIndex
CREATE UNIQUE INDEX "User_socialId_key" ON "User" ("socialId");

-- CreateIndex
CREATE INDEX "User_address_idx" ON "User" ("address");
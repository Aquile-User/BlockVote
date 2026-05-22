-- CreateTable
CREATE TABLE
  "Vote" (
    "id" TEXT NOT NULL,
    "userId" INTEGER NOT NULL,
    "province" TEXT NOT NULL,
    "electionId" TEXT NOT NULL,
    "txHash" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Vote_pkey" PRIMARY KEY ("id")
  );

-- CreateIndex
CREATE UNIQUE INDEX "Vote_txHash_key" ON "Vote" ("txHash");

-- CreateIndex
CREATE INDEX "Vote_userId_idx" ON "Vote" ("userId");

-- CreateIndex
CREATE INDEX "Vote_province_idx" ON "Vote" ("province");

-- CreateIndex
CREATE INDEX "Vote_electionId_idx" ON "Vote" ("electionId");

-- CreateIndex
CREATE INDEX "Vote_createdAt_idx" ON "Vote" ("createdAt");

-- AddForeignKey
ALTER TABLE "Vote" ADD CONSTRAINT "Vote_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE;
-- CreateTable
CREATE TABLE "ScrapRecord" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "machineId" TEXT NOT NULL,
    "scrapIndex" INTEGER NOT NULL,
    "value" INTEGER NOT NULL,
    "timestamp" DATETIME NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateIndex
CREATE INDEX "ScrapRecord_machineId_scrapIndex_idx" ON "ScrapRecord"("machineId", "scrapIndex");

-- CreateIndex
CREATE INDEX "ScrapRecord_timestamp_idx" ON "ScrapRecord"("timestamp");

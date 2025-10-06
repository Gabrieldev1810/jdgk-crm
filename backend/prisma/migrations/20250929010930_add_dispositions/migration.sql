-- CreateTable
CREATE TABLE "dispositions" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "color" TEXT NOT NULL DEFAULT '#6366f1',
    "category" TEXT NOT NULL DEFAULT 'GENERAL',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "createdById" TEXT NOT NULL,
    "updatedById" TEXT NOT NULL,
    CONSTRAINT "dispositions_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "users" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "dispositions_updatedById_fkey" FOREIGN KEY ("updatedById") REFERENCES "users" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_calls" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "accountId" TEXT NOT NULL,
    "agentId" TEXT NOT NULL,
    "callTime" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "duration" INTEGER,
    "disposition" TEXT,
    "dispositionId" TEXT,
    "notes" TEXT,
    "followUpDate" DATETIME,
    "promiseAmount" REAL,
    "promiseDate" DATETIME,
    "callQuality" TEXT,
    "recordingUrl" TEXT,
    "vicidial_call_id" TEXT,
    "vicidial_lead_id" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "calls_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES "accounts" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "calls_agentId_fkey" FOREIGN KEY ("agentId") REFERENCES "users" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "calls_dispositionId_fkey" FOREIGN KEY ("dispositionId") REFERENCES "dispositions" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_calls" ("accountId", "agentId", "callQuality", "callTime", "createdAt", "disposition", "duration", "followUpDate", "id", "notes", "promiseAmount", "promiseDate", "recordingUrl", "updatedAt", "vicidial_call_id", "vicidial_lead_id") SELECT "accountId", "agentId", "callQuality", "callTime", "createdAt", "disposition", "duration", "followUpDate", "id", "notes", "promiseAmount", "promiseDate", "recordingUrl", "updatedAt", "vicidial_call_id", "vicidial_lead_id" FROM "calls";
DROP TABLE "calls";
ALTER TABLE "new_calls" RENAME TO "calls";
CREATE INDEX "idx_calls_disposition" ON "calls"("disposition");
CREATE INDEX "idx_calls_disposition_id" ON "calls"("dispositionId");
CREATE INDEX "idx_calls_time" ON "calls"("callTime");
CREATE INDEX "idx_calls_followup" ON "calls"("followUpDate");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- CreateIndex
CREATE UNIQUE INDEX "dispositions_name_key" ON "dispositions"("name");

-- CreateIndex
CREATE INDEX "idx_dispositions_active" ON "dispositions"("isActive");

-- CreateIndex
CREATE INDEX "idx_dispositions_category" ON "dispositions"("category");

-- CreateIndex
CREATE INDEX "idx_dispositions_created_by" ON "dispositions"("createdById");

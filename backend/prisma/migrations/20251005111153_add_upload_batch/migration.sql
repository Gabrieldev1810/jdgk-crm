/*
  Warnings:

  - You are about to drop the `dispositions` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `page_access` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `permission_cache` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `permissions` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `rbac_audit_logs` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `role_permissions` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `roles` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `system_configurations` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `user_roles` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `vicidial_integrations` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the column `account_id` on the `accounts` table. All the data in the column will be lost.
  - You are about to drop the column `address` on the `accounts` table. All the data in the column will be lost.
  - You are about to drop the column `assignedAt` on the `accounts` table. All the data in the column will be lost.
  - You are about to drop the column `assignedToId` on the `accounts` table. All the data in the column will be lost.
  - You are about to drop the column `balance` on the `accounts` table. All the data in the column will be lost.
  - You are about to drop the column `bank_partner` on the `accounts` table. All the data in the column will be lost.
  - You are about to drop the column `customerName` on the `accounts` table. All the data in the column will be lost.
  - You are about to drop the column `due_date` on the `accounts` table. All the data in the column will be lost.
  - You are about to drop the column `lastPayment` on the `accounts` table. All the data in the column will be lost.
  - You are about to drop the column `last_contact_date` on the `accounts` table. All the data in the column will be lost.
  - You are about to drop the column `originalBalance` on the `accounts` table. All the data in the column will be lost.
  - You are about to drop the column `outstanding_balance` on the `accounts` table. All the data in the column will be lost.
  - You are about to drop the column `phoneNumber` on the `accounts` table. All the data in the column will be lost.
  - You are about to drop the column `phoneNumbers` on the `accounts` table. All the data in the column will be lost.
  - You are about to drop the column `uploadBatchId` on the `accounts` table. All the data in the column will be lost.
  - You are about to drop the column `callQuality` on the `calls` table. All the data in the column will be lost.
  - You are about to drop the column `callTime` on the `calls` table. All the data in the column will be lost.
  - You are about to drop the column `dispositionId` on the `calls` table. All the data in the column will be lost.
  - You are about to drop the column `promiseAmount` on the `calls` table. All the data in the column will be lost.
  - You are about to drop the column `promiseDate` on the `calls` table. All the data in the column will be lost.
  - You are about to drop the column `recordingUrl` on the `calls` table. All the data in the column will be lost.
  - You are about to drop the column `vicidial_call_id` on the `calls` table. All the data in the column will be lost.
  - You are about to drop the column `vicidial_lead_id` on the `calls` table. All the data in the column will be lost.
  - You are about to drop the column `originalName` on the `upload_batches` table. All the data in the column will be lost.
  - You are about to drop the column `callsToday` on the `users` table. All the data in the column will be lost.
  - You are about to drop the column `quotaAchieved` on the `users` table. All the data in the column will be lost.
  - You are about to drop the column `quotaTarget` on the `users` table. All the data in the column will be lost.
  - You are about to drop the column `totalCalls` on the `users` table. All the data in the column will be lost.
  - Added the required column `accountNumber` to the `accounts` table without a default value. This is not possible if the table is not empty.
  - Added the required column `currentBalance` to the `accounts` table without a default value. This is not possible if the table is not empty.
  - Added the required column `firstName` to the `accounts` table without a default value. This is not possible if the table is not empty.
  - Added the required column `fullName` to the `accounts` table without a default value. This is not possible if the table is not empty.
  - Added the required column `lastName` to the `accounts` table without a default value. This is not possible if the table is not empty.
  - Added the required column `originalAmount` to the `accounts` table without a default value. This is not possible if the table is not empty.
  - Added the required column `direction` to the `calls` table without a default value. This is not possible if the table is not empty.
  - Added the required column `startTime` to the `calls` table without a default value. This is not possible if the table is not empty.
  - Added the required column `status` to the `calls` table without a default value. This is not possible if the table is not empty.
  - Added the required column `fileSize` to the `upload_batches` table without a default value. This is not possible if the table is not empty.
  - Added the required column `mimeType` to the `upload_batches` table without a default value. This is not possible if the table is not empty.
  - Added the required column `originalFilename` to the `upload_batches` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updatedAt` to the `upload_batches` table without a default value. This is not possible if the table is not empty.

*/
-- DropIndex
DROP INDEX "idx_disposition_created_by";

-- DropIndex
DROP INDEX "idx_disposition_active";

-- DropIndex
DROP INDEX "idx_disposition_category";

-- DropIndex
DROP INDEX "dispositions_name_key";

-- DropIndex
DROP INDEX "page_access_pageName_key";

-- DropIndex
DROP INDEX "permission_cache_expiresAt_idx";

-- DropIndex
DROP INDEX "permission_cache_userId_idx";

-- DropIndex
DROP INDEX "permission_cache_userId_key";

-- DropIndex
DROP INDEX "permissions_name_key";

-- DropIndex
DROP INDEX "rbac_audit_logs_timestamp_idx";

-- DropIndex
DROP INDEX "rbac_audit_logs_resourceType_idx";

-- DropIndex
DROP INDEX "rbac_audit_logs_userId_idx";

-- DropIndex
DROP INDEX "role_permissions_roleId_permissionId_key";

-- DropIndex
DROP INDEX "roles_name_key";

-- DropIndex
DROP INDEX "idx_config_active";

-- DropIndex
DROP INDEX "idx_config_category";

-- DropIndex
DROP INDEX "system_configurations_key_key";

-- DropIndex
DROP INDEX "user_roles_userId_roleId_key";

-- DropIndex
DROP INDEX "idx_sync_status";

-- DropIndex
DROP INDEX "idx_campaign";

-- DropIndex
DROP INDEX "idx_vicidial_lead";

-- DropIndex
DROP INDEX "vicidial_integrations_accountId_key";

-- DropTable
PRAGMA foreign_keys=off;
DROP TABLE "dispositions";
PRAGMA foreign_keys=on;

-- DropTable
PRAGMA foreign_keys=off;
DROP TABLE "page_access";
PRAGMA foreign_keys=on;

-- DropTable
PRAGMA foreign_keys=off;
DROP TABLE "permission_cache";
PRAGMA foreign_keys=on;

-- DropTable
PRAGMA foreign_keys=off;
DROP TABLE "permissions";
PRAGMA foreign_keys=on;

-- DropTable
PRAGMA foreign_keys=off;
DROP TABLE "rbac_audit_logs";
PRAGMA foreign_keys=on;

-- DropTable
PRAGMA foreign_keys=off;
DROP TABLE "role_permissions";
PRAGMA foreign_keys=on;

-- DropTable
PRAGMA foreign_keys=off;
DROP TABLE "roles";
PRAGMA foreign_keys=on;

-- DropTable
PRAGMA foreign_keys=off;
DROP TABLE "system_configurations";
PRAGMA foreign_keys=on;

-- DropTable
PRAGMA foreign_keys=off;
DROP TABLE "user_roles";
PRAGMA foreign_keys=on;

-- DropTable
PRAGMA foreign_keys=off;
DROP TABLE "vicidial_integrations";
PRAGMA foreign_keys=on;

-- CreateTable
CREATE TABLE "account_phones" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "accountId" TEXT NOT NULL,
    "phoneNumber" TEXT NOT NULL,
    "phoneType" TEXT NOT NULL DEFAULT 'PRIMARY',
    "isValid" BOOLEAN NOT NULL DEFAULT true,
    "doNotCall" BOOLEAN NOT NULL DEFAULT false,
    "notes" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "account_phones_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES "accounts" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "account_actions" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "accountId" TEXT NOT NULL,
    "agentId" TEXT NOT NULL,
    "actionType" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "details" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "account_actions_agentId_fkey" FOREIGN KEY ("agentId") REFERENCES "users" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "account_actions_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES "accounts" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_accounts" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "accountNumber" TEXT NOT NULL,
    "firstName" TEXT NOT NULL,
    "lastName" TEXT NOT NULL,
    "fullName" TEXT NOT NULL,
    "email" TEXT,
    "address1" TEXT,
    "address2" TEXT,
    "city" TEXT,
    "state" TEXT,
    "zipCode" TEXT,
    "country" TEXT DEFAULT 'US',
    "originalAmount" REAL NOT NULL,
    "currentBalance" REAL NOT NULL,
    "amountPaid" REAL NOT NULL DEFAULT 0,
    "interestRate" REAL,
    "lastPaymentDate" DATETIME,
    "lastPaymentAmount" REAL,
    "status" TEXT NOT NULL DEFAULT 'NEW',
    "priority" TEXT NOT NULL DEFAULT 'MEDIUM',
    "assignedAgentId" TEXT,
    "assignedDate" DATETIME,
    "preferredContactMethod" TEXT DEFAULT 'PHONE',
    "bestTimeToCall" TEXT,
    "timezone" TEXT DEFAULT 'EST',
    "language" TEXT DEFAULT 'EN',
    "daysPastDue" INTEGER NOT NULL DEFAULT 0,
    "lastContactDate" DATETIME,
    "nextContactDate" DATETIME,
    "contactAttempts" INTEGER NOT NULL DEFAULT 0,
    "doNotCall" BOOLEAN NOT NULL DEFAULT false,
    "disputeFlag" BOOLEAN NOT NULL DEFAULT false,
    "bankruptcyFlag" BOOLEAN NOT NULL DEFAULT false,
    "deceasedFlag" BOOLEAN NOT NULL DEFAULT false,
    "notes" TEXT,
    "source" TEXT,
    "batchId" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "accounts_assignedAgentId_fkey" FOREIGN KEY ("assignedAgentId") REFERENCES "users" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_accounts" ("createdAt", "email", "id", "notes", "priority", "status", "updatedAt") SELECT "createdAt", "email", "id", "notes", "priority", "status", "updatedAt" FROM "accounts";
DROP TABLE "accounts";
ALTER TABLE "new_accounts" RENAME TO "accounts";
CREATE UNIQUE INDEX "accounts_accountNumber_key" ON "accounts"("accountNumber");
CREATE INDEX "accounts_accountNumber_idx" ON "accounts"("accountNumber");
CREATE INDEX "accounts_status_idx" ON "accounts"("status");
CREATE INDEX "accounts_assignedAgentId_idx" ON "accounts"("assignedAgentId");
CREATE INDEX "accounts_lastContactDate_idx" ON "accounts"("lastContactDate");
CREATE INDEX "accounts_nextContactDate_idx" ON "accounts"("nextContactDate");
CREATE TABLE "new_calls" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "accountId" TEXT NOT NULL,
    "accountPhoneId" TEXT,
    "agentId" TEXT NOT NULL,
    "direction" TEXT NOT NULL,
    "startTime" DATETIME NOT NULL,
    "endTime" DATETIME,
    "duration" INTEGER,
    "status" TEXT NOT NULL,
    "disposition" TEXT,
    "notes" TEXT,
    "followUpDate" DATETIME,
    "amountPromised" REAL,
    "amountCollected" REAL,
    "recordingPath" TEXT,
    "callerId" TEXT,
    "campaignId" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "calls_agentId_fkey" FOREIGN KEY ("agentId") REFERENCES "users" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "calls_accountPhoneId_fkey" FOREIGN KEY ("accountPhoneId") REFERENCES "account_phones" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "calls_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES "accounts" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_calls" ("accountId", "agentId", "createdAt", "disposition", "duration", "followUpDate", "id", "notes", "updatedAt") SELECT "accountId", "agentId", "createdAt", "disposition", "duration", "followUpDate", "id", "notes", "updatedAt" FROM "calls";
DROP TABLE "calls";
ALTER TABLE "new_calls" RENAME TO "calls";
CREATE INDEX "calls_accountId_idx" ON "calls"("accountId");
CREATE INDEX "calls_agentId_idx" ON "calls"("agentId");
CREATE INDEX "calls_startTime_idx" ON "calls"("startTime");
CREATE INDEX "calls_disposition_idx" ON "calls"("disposition");
CREATE TABLE "new_upload_batches" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "filename" TEXT NOT NULL,
    "originalFilename" TEXT NOT NULL,
    "fileSize" INTEGER NOT NULL,
    "mimeType" TEXT NOT NULL,
    "totalRecords" INTEGER NOT NULL DEFAULT 0,
    "processedRecords" INTEGER NOT NULL DEFAULT 0,
    "successCount" INTEGER NOT NULL DEFAULT 0,
    "errorCount" INTEGER NOT NULL DEFAULT 0,
    "skipCount" INTEGER NOT NULL DEFAULT 0,
    "duplicateCount" INTEGER NOT NULL DEFAULT 0,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "uploadedById" TEXT NOT NULL,
    "batchName" TEXT,
    "skipErrors" BOOLEAN NOT NULL DEFAULT false,
    "updateExisting" BOOLEAN NOT NULL DEFAULT false,
    "processingStarted" DATETIME,
    "processingCompleted" DATETIME,
    "errorLog" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "upload_batches_uploadedById_fkey" FOREIGN KEY ("uploadedById") REFERENCES "users" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_upload_batches" ("createdAt", "errorCount", "filename", "id", "successCount", "totalRecords", "uploadedById") SELECT "createdAt", "errorCount", "filename", "id", "successCount", "totalRecords", "uploadedById" FROM "upload_batches";
DROP TABLE "upload_batches";
ALTER TABLE "new_upload_batches" RENAME TO "upload_batches";
CREATE INDEX "upload_batches_status_idx" ON "upload_batches"("status");
CREATE INDEX "upload_batches_uploadedById_idx" ON "upload_batches"("uploadedById");
CREATE INDEX "upload_batches_createdAt_idx" ON "upload_batches"("createdAt");
CREATE TABLE "new_users" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "email" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "firstName" TEXT NOT NULL,
    "lastName" TEXT NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'AGENT',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "lastLogin" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "emailVerified" BOOLEAN NOT NULL DEFAULT false,
    "emailVerifyToken" TEXT,
    "emailVerifyExpires" DATETIME,
    "passwordResetToken" TEXT,
    "passwordResetExpires" DATETIME,
    "failedLoginAttempts" INTEGER NOT NULL DEFAULT 0,
    "accountLockedUntil" DATETIME,
    "lastFailedLogin" DATETIME,
    "passwordChangedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "mustChangePassword" BOOLEAN NOT NULL DEFAULT false
);
INSERT INTO "new_users" ("accountLockedUntil", "createdAt", "email", "emailVerified", "emailVerifyExpires", "emailVerifyToken", "failedLoginAttempts", "firstName", "id", "isActive", "lastFailedLogin", "lastLogin", "lastName", "mustChangePassword", "password", "passwordChangedAt", "passwordResetExpires", "passwordResetToken", "role", "updatedAt") SELECT "accountLockedUntil", "createdAt", "email", "emailVerified", "emailVerifyExpires", "emailVerifyToken", "failedLoginAttempts", "firstName", "id", "isActive", "lastFailedLogin", "lastLogin", "lastName", "mustChangePassword", "password", "passwordChangedAt", "passwordResetExpires", "passwordResetToken", "role", "updatedAt" FROM "users";
DROP TABLE "users";
ALTER TABLE "new_users" RENAME TO "users";
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");
CREATE UNIQUE INDEX "users_emailVerifyToken_key" ON "users"("emailVerifyToken");
CREATE UNIQUE INDEX "users_passwordResetToken_key" ON "users"("passwordResetToken");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- CreateIndex
CREATE INDEX "account_phones_phoneNumber_idx" ON "account_phones"("phoneNumber");

-- CreateIndex
CREATE UNIQUE INDEX "account_phones_accountId_phoneNumber_key" ON "account_phones"("accountId", "phoneNumber");

-- CreateIndex
CREATE INDEX "account_actions_accountId_idx" ON "account_actions"("accountId");

-- CreateIndex
CREATE INDEX "account_actions_agentId_idx" ON "account_actions"("agentId");

-- CreateIndex
CREATE INDEX "account_actions_createdAt_idx" ON "account_actions"("createdAt");

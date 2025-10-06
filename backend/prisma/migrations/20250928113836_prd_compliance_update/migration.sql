/*
  Warnings:

  - A unique constraint covering the columns `[account_id]` on the table `accounts` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "accounts" ADD COLUMN "account_id" TEXT;
ALTER TABLE "accounts" ADD COLUMN "bank_partner" TEXT;
ALTER TABLE "accounts" ADD COLUMN "due_date" DATETIME;
ALTER TABLE "accounts" ADD COLUMN "last_contact_date" DATETIME;
ALTER TABLE "accounts" ADD COLUMN "outstanding_balance" REAL;
ALTER TABLE "accounts" ADD COLUMN "phoneNumbers" TEXT;

-- AlterTable
ALTER TABLE "calls" ADD COLUMN "callQuality" TEXT;
ALTER TABLE "calls" ADD COLUMN "recordingUrl" TEXT;
ALTER TABLE "calls" ADD COLUMN "vicidial_call_id" TEXT;
ALTER TABLE "calls" ADD COLUMN "vicidial_lead_id" TEXT;

-- CreateTable
CREATE TABLE "vicidial_integrations" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "accountId" TEXT NOT NULL,
    "vicidial_lead_id" TEXT,
    "vicidial_list_id" TEXT,
    "campaign_id" TEXT,
    "phone_code" TEXT DEFAULT '1',
    "syncStatus" TEXT NOT NULL DEFAULT 'PENDING',
    "last_sync_at" DATETIME,
    "sync_attempts" INTEGER NOT NULL DEFAULT 0,
    "sync_error" TEXT,
    "systemType" TEXT NOT NULL DEFAULT 'VICIDIAL',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "vicidial_integrations_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES "accounts" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "disposition_types" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "category" TEXT NOT NULL,
    "color" TEXT,
    "icon" TEXT,
    "requires_followup" BOOLEAN NOT NULL DEFAULT false,
    "requires_amount" BOOLEAN NOT NULL DEFAULT false,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "system_configurations" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "key" TEXT NOT NULL,
    "value" TEXT NOT NULL,
    "description" TEXT,
    "category" TEXT NOT NULL,
    "dataType" TEXT NOT NULL DEFAULT 'STRING',
    "is_encrypted" BOOLEAN NOT NULL DEFAULT false,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateIndex
CREATE UNIQUE INDEX "vicidial_integrations_accountId_key" ON "vicidial_integrations"("accountId");

-- CreateIndex
CREATE INDEX "idx_vicidial_lead" ON "vicidial_integrations"("vicidial_lead_id");

-- CreateIndex
CREATE INDEX "idx_campaign" ON "vicidial_integrations"("campaign_id");

-- CreateIndex
CREATE INDEX "idx_sync_status" ON "vicidial_integrations"("syncStatus");

-- CreateIndex
CREATE UNIQUE INDEX "disposition_types_code_key" ON "disposition_types"("code");

-- CreateIndex
CREATE INDEX "idx_disposition_category" ON "disposition_types"("category");

-- CreateIndex
CREATE INDEX "idx_disposition_active" ON "disposition_types"("is_active");

-- CreateIndex
CREATE UNIQUE INDEX "system_configurations_key_key" ON "system_configurations"("key");

-- CreateIndex
CREATE INDEX "idx_config_category" ON "system_configurations"("category");

-- CreateIndex
CREATE INDEX "idx_config_active" ON "system_configurations"("is_active");

-- CreateIndex
CREATE UNIQUE INDEX "accounts_account_id_key" ON "accounts"("account_id");

-- CreateIndex
CREATE INDEX "idx_accounts_account_id" ON "accounts"("account_id");

-- CreateIndex
CREATE INDEX "idx_accounts_due_date" ON "accounts"("due_date");

-- CreateIndex
CREATE INDEX "idx_accounts_bank_partner" ON "accounts"("bank_partner");

-- CreateIndex
CREATE INDEX "idx_accounts_last_contact" ON "accounts"("last_contact_date");

-- CreateIndex
CREATE INDEX "idx_calls_disposition" ON "calls"("disposition");

-- CreateIndex
CREATE INDEX "idx_calls_time" ON "calls"("callTime");

-- CreateIndex
CREATE INDEX "idx_calls_followup" ON "calls"("followUpDate");

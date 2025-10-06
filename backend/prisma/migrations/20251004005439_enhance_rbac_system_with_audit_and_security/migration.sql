/*
  Warnings:

  - Added the required column `updatedAt` to the `role_permissions` table without a default value. This is not possible if the table is not empty.

*/
-- CreateTable
CREATE TABLE "rbac_audit_logs" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "resourceType" TEXT NOT NULL,
    "resourceId" TEXT NOT NULL,
    "targetUserId" TEXT,
    "oldValues" TEXT,
    "newValues" TEXT,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "sessionId" TEXT,
    "timestamp" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "permission_cache" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "permissions" TEXT NOT NULL,
    "roles" TEXT NOT NULL,
    "cachedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" DATETIME NOT NULL
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_permissions" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "resource" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "isSystemLevel" BOOLEAN NOT NULL DEFAULT false,
    "riskLevel" INTEGER NOT NULL DEFAULT 1,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "createdBy" TEXT
);
INSERT INTO "new_permissions" ("action", "createdAt", "description", "id", "name", "resource", "updatedAt") SELECT "action", "createdAt", "description", "id", "name", "resource", "updatedAt" FROM "permissions";
DROP TABLE "permissions";
ALTER TABLE "new_permissions" RENAME TO "permissions";
CREATE UNIQUE INDEX "permissions_name_key" ON "permissions"("name");
CREATE TABLE "new_role_permissions" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "roleId" TEXT NOT NULL,
    "permissionId" TEXT NOT NULL,
    "canRead" BOOLEAN NOT NULL DEFAULT false,
    "canWrite" BOOLEAN NOT NULL DEFAULT false,
    "canDelete" BOOLEAN NOT NULL DEFAULT false,
    "canExport" BOOLEAN NOT NULL DEFAULT false,
    "canImport" BOOLEAN NOT NULL DEFAULT false,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "conditions" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "assignedBy" TEXT,
    CONSTRAINT "role_permissions_roleId_fkey" FOREIGN KEY ("roleId") REFERENCES "roles" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "role_permissions_permissionId_fkey" FOREIGN KEY ("permissionId") REFERENCES "permissions" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_role_permissions" ("canDelete", "canExport", "canImport", "canRead", "canWrite", "createdAt", "updatedAt", "id", "permissionId", "roleId") SELECT "canDelete", "canExport", "canImport", "canRead", "canWrite", "createdAt", CURRENT_TIMESTAMP, "id", "permissionId", "roleId" FROM "role_permissions";
DROP TABLE "role_permissions";
ALTER TABLE "new_role_permissions" RENAME TO "role_permissions";
CREATE UNIQUE INDEX "role_permissions_roleId_permissionId_key" ON "role_permissions"("roleId", "permissionId");
CREATE TABLE "new_roles" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "isDefault" BOOLEAN NOT NULL DEFAULT false,
    "isSystemRole" BOOLEAN NOT NULL DEFAULT false,
    "hierarchyLevel" INTEGER NOT NULL DEFAULT 5,
    "maxUserCount" INTEGER,
    "allowedPages" TEXT,
    "restrictedPages" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "createdBy" TEXT
);
INSERT INTO "new_roles" ("allowedPages", "createdAt", "description", "id", "isActive", "isDefault", "name", "updatedAt") SELECT "allowedPages", "createdAt", "description", "id", "isActive", "isDefault", "name", "updatedAt" FROM "roles";
DROP TABLE "roles";
ALTER TABLE "new_roles" RENAME TO "roles";
CREATE UNIQUE INDEX "roles_name_key" ON "roles"("name");
CREATE TABLE "new_user_roles" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "roleId" TEXT NOT NULL,
    "assignedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "assignedBy" TEXT,
    "expiresAt" DATETIME,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "reason" TEXT,
    CONSTRAINT "user_roles_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "user_roles_roleId_fkey" FOREIGN KEY ("roleId") REFERENCES "roles" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_user_roles" ("assignedAt", "assignedBy", "id", "roleId", "userId") SELECT "assignedAt", "assignedBy", "id", "roleId", "userId" FROM "user_roles";
DROP TABLE "user_roles";
ALTER TABLE "new_user_roles" RENAME TO "user_roles";
CREATE UNIQUE INDEX "user_roles_userId_roleId_key" ON "user_roles"("userId", "roleId");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- CreateIndex
CREATE INDEX "rbac_audit_logs_userId_idx" ON "rbac_audit_logs"("userId");

-- CreateIndex
CREATE INDEX "rbac_audit_logs_resourceType_idx" ON "rbac_audit_logs"("resourceType");

-- CreateIndex
CREATE INDEX "rbac_audit_logs_timestamp_idx" ON "rbac_audit_logs"("timestamp");

-- CreateIndex
CREATE UNIQUE INDEX "permission_cache_userId_key" ON "permission_cache"("userId");

-- CreateIndex
CREATE INDEX "permission_cache_userId_idx" ON "permission_cache"("userId");

-- CreateIndex
CREATE INDEX "permission_cache_expiresAt_idx" ON "permission_cache"("expiresAt");

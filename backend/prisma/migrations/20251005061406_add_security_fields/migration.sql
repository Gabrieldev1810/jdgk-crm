-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
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
    "mustChangePassword" BOOLEAN NOT NULL DEFAULT false,
    "totalCalls" INTEGER NOT NULL DEFAULT 0,
    "callsToday" INTEGER NOT NULL DEFAULT 0,
    "quotaTarget" INTEGER NOT NULL DEFAULT 50,
    "quotaAchieved" INTEGER NOT NULL DEFAULT 0
);
INSERT INTO "new_users" ("callsToday", "createdAt", "email", "firstName", "id", "isActive", "lastLogin", "lastName", "password", "quotaAchieved", "quotaTarget", "role", "totalCalls", "updatedAt") SELECT "callsToday", "createdAt", "email", "firstName", "id", "isActive", "lastLogin", "lastName", "password", "quotaAchieved", "quotaTarget", "role", "totalCalls", "updatedAt" FROM "users";
DROP TABLE "users";
ALTER TABLE "new_users" RENAME TO "users";
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");
CREATE UNIQUE INDEX "users_emailVerifyToken_key" ON "users"("emailVerifyToken");
CREATE UNIQUE INDEX "users_passwordResetToken_key" ON "users"("passwordResetToken");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

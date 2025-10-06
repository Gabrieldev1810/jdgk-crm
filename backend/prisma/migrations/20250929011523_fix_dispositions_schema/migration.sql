/*
  Warnings:

  - You are about to drop the `disposition_types` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the column `createdById` on the `dispositions` table. All the data in the column will be lost.
  - You are about to drop the column `isActive` on the `dispositions` table. All the data in the column will be lost.
  - You are about to drop the column `updatedById` on the `dispositions` table. All the data in the column will be lost.
  - Added the required column `created_by_id` to the `dispositions` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updated_by_id` to the `dispositions` table without a default value. This is not possible if the table is not empty.

*/
-- DropIndex
DROP INDEX "idx_disposition_active";

-- DropIndex
DROP INDEX "idx_disposition_category";

-- DropIndex
DROP INDEX "disposition_types_code_key";

-- DropTable
PRAGMA foreign_keys=off;
DROP TABLE "disposition_types";
PRAGMA foreign_keys=on;

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_dispositions" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "category" TEXT NOT NULL DEFAULT 'GENERAL',
    "color" TEXT NOT NULL DEFAULT '#6366f1',
    "icon" TEXT,
    "requires_followup" BOOLEAN NOT NULL DEFAULT false,
    "requires_amount" BOOLEAN NOT NULL DEFAULT false,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "created_by_id" TEXT NOT NULL,
    "updated_by_id" TEXT NOT NULL,
    CONSTRAINT "dispositions_created_by_id_fkey" FOREIGN KEY ("created_by_id") REFERENCES "users" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "dispositions_updated_by_id_fkey" FOREIGN KEY ("updated_by_id") REFERENCES "users" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_dispositions" ("category", "color", "createdAt", "description", "id", "name", "updatedAt") SELECT "category", "color", "createdAt", "description", "id", "name", "updatedAt" FROM "dispositions";
DROP TABLE "dispositions";
ALTER TABLE "new_dispositions" RENAME TO "dispositions";
CREATE UNIQUE INDEX "dispositions_name_key" ON "dispositions"("name");
CREATE INDEX "idx_disposition_category" ON "dispositions"("category");
CREATE INDEX "idx_disposition_active" ON "dispositions"("is_active");
CREATE INDEX "idx_disposition_created_by" ON "dispositions"("created_by_id");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

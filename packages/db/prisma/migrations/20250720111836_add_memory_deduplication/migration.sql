/*
  Warnings:

  - Added the required column `contentHash` to the `Memory` table without a default value. This is not possible if the table is not empty.

*/
-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Memory" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "sourceMessageIds" TEXT NOT NULL,
    "participants" TEXT NOT NULL,
    "summary" TEXT NOT NULL,
    "confidence" INTEGER NOT NULL,
    "contentHash" TEXT NOT NULL,
    "deduplicationMetadata" TEXT,
    "extractedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
INSERT INTO "new_Memory" ("confidence", "createdAt", "extractedAt", "id", "participants", "sourceMessageIds", "summary", "updatedAt") SELECT "confidence", "createdAt", "extractedAt", "id", "participants", "sourceMessageIds", "summary", "updatedAt" FROM "Memory";
DROP TABLE "Memory";
ALTER TABLE "new_Memory" RENAME TO "Memory";
CREATE UNIQUE INDEX "Memory_contentHash_key" ON "Memory"("contentHash");
CREATE INDEX "Memory_contentHash_idx" ON "Memory"("contentHash");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

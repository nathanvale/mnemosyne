/*
  Warnings:

  - You are about to drop the column `accuracy` on the `ValidationResult` table. All the data in the column will be lost.
  - You are about to drop the column `adjustments` on the `ValidationResult` table. All the data in the column will be lost.
  - You are about to drop the column `biasMetrics` on the `ValidationResult` table. All the data in the column will be lost.
  - You are about to drop the column `correlation` on the `ValidationResult` table. All the data in the column will be lost.
  - You are about to drop the column `discrepancies` on the `ValidationResult` table. All the data in the column will be lost.
  - You are about to drop the column `moodScoreId` on the `ValidationResult` table. All the data in the column will be lost.
  - You are about to drop the column `validationType` on the `ValidationResult` table. All the data in the column will be lost.
  - Added the required column `accuracyMetrics` to the `ValidationResult` table without a default value. This is not possible if the table is not empty.
  - Added the required column `agreement` to the `ValidationResult` table without a default value. This is not possible if the table is not empty.
  - Added the required column `biasIndicators` to the `ValidationResult` table without a default value. This is not possible if the table is not empty.
  - Added the required column `discrepancy` to the `ValidationResult` table without a default value. This is not possible if the table is not empty.
  - Added the required column `validationMethod` to the `ValidationResult` table without a default value. This is not possible if the table is not empty.
  - Made the column `humanScore` on table `ValidationResult` required. This step will fail if there are existing NULL values in that column.
  - Made the column `validatorId` on table `ValidationResult` required. This step will fail if there are existing NULL values in that column.

*/
-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_ValidationResult" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "memoryId" TEXT NOT NULL,
    "humanScore" REAL NOT NULL,
    "algorithmScore" REAL NOT NULL,
    "agreement" REAL NOT NULL,
    "discrepancy" REAL NOT NULL,
    "validatorId" TEXT NOT NULL,
    "validationMethod" TEXT NOT NULL,
    "feedback" TEXT,
    "biasIndicators" TEXT NOT NULL,
    "accuracyMetrics" TEXT NOT NULL,
    "validatedAt" DATETIME NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "ValidationResult_memoryId_fkey" FOREIGN KEY ("memoryId") REFERENCES "Memory" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_ValidationResult" ("algorithmScore", "feedback", "humanScore", "id", "memoryId", "validatedAt", "validatorId") SELECT "algorithmScore", "feedback", "humanScore", "id", "memoryId", "validatedAt", "validatorId" FROM "ValidationResult";
DROP TABLE "ValidationResult";
ALTER TABLE "new_ValidationResult" RENAME TO "ValidationResult";
CREATE INDEX "ValidationResult_memoryId_idx" ON "ValidationResult"("memoryId");
CREATE INDEX "ValidationResult_validatedAt_idx" ON "ValidationResult"("validatedAt");
CREATE INDEX "ValidationResult_validationMethod_idx" ON "ValidationResult"("validationMethod");
CREATE INDEX "ValidationResult_agreement_idx" ON "ValidationResult"("agreement");
CREATE INDEX "ValidationResult_discrepancy_idx" ON "ValidationResult"("discrepancy");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

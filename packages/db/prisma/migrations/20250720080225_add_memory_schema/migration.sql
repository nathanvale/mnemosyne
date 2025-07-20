-- CreateTable
CREATE TABLE "Memory" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "sourceMessageIds" TEXT NOT NULL,
    "participants" TEXT NOT NULL,
    "summary" TEXT NOT NULL,
    "confidence" INTEGER NOT NULL,
    "extractedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "EmotionalContext" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "memoryId" TEXT NOT NULL,
    "primaryMood" TEXT NOT NULL,
    "intensity" INTEGER NOT NULL,
    "themes" TEXT NOT NULL,
    "emotionalMarkers" TEXT NOT NULL,
    "contextualEvents" TEXT NOT NULL,
    "temporalPatterns" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "EmotionalContext_memoryId_fkey" FOREIGN KEY ("memoryId") REFERENCES "Memory" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "RelationshipDynamics" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "memoryId" TEXT NOT NULL,
    "overallDynamics" TEXT NOT NULL,
    "participantDynamics" TEXT NOT NULL,
    "communicationPatterns" TEXT NOT NULL,
    "interactionQuality" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "RelationshipDynamics_memoryId_fkey" FOREIGN KEY ("memoryId") REFERENCES "Memory" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "ValidationStatus" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "memoryId" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "validator" TEXT,
    "validatedAt" DATETIME,
    "validationRound" INTEGER NOT NULL DEFAULT 1,
    "requiresRefinement" BOOLEAN NOT NULL DEFAULT false,
    "refinementSuggestions" TEXT NOT NULL,
    "approvalHistory" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "ValidationStatus_memoryId_fkey" FOREIGN KEY ("memoryId") REFERENCES "Memory" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "QualityMetrics" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "memoryId" TEXT NOT NULL,
    "overallQuality" REAL NOT NULL,
    "dimensionalQuality" TEXT NOT NULL,
    "confidenceAlignment" REAL NOT NULL,
    "validationConsistency" REAL NOT NULL,
    "evidenceSupport" REAL NOT NULL,
    "calculatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "calculationMethod" TEXT NOT NULL,
    CONSTRAINT "QualityMetrics_memoryId_fkey" FOREIGN KEY ("memoryId") REFERENCES "Memory" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "_MemoryMessages" (
    "A" TEXT NOT NULL,
    "B" INTEGER NOT NULL,
    CONSTRAINT "_MemoryMessages_A_fkey" FOREIGN KEY ("A") REFERENCES "Memory" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "_MemoryMessages_B_fkey" FOREIGN KEY ("B") REFERENCES "Message" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "EmotionalContext_memoryId_key" ON "EmotionalContext"("memoryId");

-- CreateIndex
CREATE UNIQUE INDEX "RelationshipDynamics_memoryId_key" ON "RelationshipDynamics"("memoryId");

-- CreateIndex
CREATE UNIQUE INDEX "ValidationStatus_memoryId_key" ON "ValidationStatus"("memoryId");

-- CreateIndex
CREATE INDEX "QualityMetrics_memoryId_idx" ON "QualityMetrics"("memoryId");

-- CreateIndex
CREATE UNIQUE INDEX "_MemoryMessages_AB_unique" ON "_MemoryMessages"("A", "B");

-- CreateIndex
CREATE INDEX "_MemoryMessages_B_index" ON "_MemoryMessages"("B");

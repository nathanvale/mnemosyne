-- CreateTable
CREATE TABLE "MoodScore" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "memoryId" TEXT NOT NULL,
    "score" REAL NOT NULL,
    "confidence" REAL NOT NULL,
    "descriptors" TEXT NOT NULL,
    "algorithmVersion" TEXT NOT NULL,
    "processingTimeMs" INTEGER NOT NULL,
    "calculatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "MoodScore_memoryId_fkey" FOREIGN KEY ("memoryId") REFERENCES "Memory" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "MoodFactor" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "moodScoreId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "weight" REAL NOT NULL,
    "description" TEXT NOT NULL,
    "evidence" TEXT NOT NULL,
    "internalScore" REAL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "MoodFactor_moodScoreId_fkey" FOREIGN KEY ("moodScoreId") REFERENCES "MoodScore" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "MoodDelta" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "memoryId" TEXT NOT NULL,
    "conversationId" TEXT,
    "deltaSequence" INTEGER,
    "magnitude" REAL NOT NULL,
    "direction" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "confidence" REAL NOT NULL,
    "factors" TEXT NOT NULL,
    "significance" REAL NOT NULL,
    "temporalContext" TEXT,
    "previousScore" REAL,
    "currentScore" REAL NOT NULL,
    "detectedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "MoodDelta_memoryId_fkey" FOREIGN KEY ("memoryId") REFERENCES "Memory" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "AnalysisMetadata" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "memoryId" TEXT NOT NULL,
    "processingDuration" INTEGER NOT NULL,
    "confidence" REAL NOT NULL,
    "qualityMetrics" TEXT NOT NULL,
    "issues" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "AnalysisMetadata_memoryId_fkey" FOREIGN KEY ("memoryId") REFERENCES "Memory" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "DeltaPattern" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "memoryId" TEXT NOT NULL,
    "patternType" TEXT NOT NULL,
    "significance" REAL NOT NULL,
    "confidence" REAL NOT NULL,
    "description" TEXT NOT NULL,
    "duration" INTEGER NOT NULL,
    "averageMagnitude" REAL NOT NULL,
    "metadata" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "DeltaPattern_memoryId_fkey" FOREIGN KEY ("memoryId") REFERENCES "Memory" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "DeltaPatternAssociation" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "patternId" TEXT NOT NULL,
    "deltaId" TEXT NOT NULL,
    "sequenceOrder" INTEGER NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "DeltaPatternAssociation_patternId_fkey" FOREIGN KEY ("patternId") REFERENCES "DeltaPattern" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "DeltaPatternAssociation_deltaId_fkey" FOREIGN KEY ("deltaId") REFERENCES "MoodDelta" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "TurningPoint" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "memoryId" TEXT NOT NULL,
    "deltaId" TEXT,
    "timestamp" DATETIME NOT NULL,
    "type" TEXT NOT NULL,
    "magnitude" REAL NOT NULL,
    "description" TEXT NOT NULL,
    "factors" TEXT NOT NULL,
    "significance" REAL NOT NULL,
    "temporalContext" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "TurningPoint_memoryId_fkey" FOREIGN KEY ("memoryId") REFERENCES "Memory" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "ValidationResult" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "memoryId" TEXT NOT NULL,
    "moodScoreId" TEXT,
    "validationType" TEXT NOT NULL,
    "humanScore" REAL,
    "algorithmScore" REAL NOT NULL,
    "correlation" REAL,
    "accuracy" REAL,
    "biasMetrics" TEXT,
    "discrepancies" TEXT,
    "feedback" TEXT,
    "adjustments" TEXT,
    "validatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "validatorId" TEXT,
    CONSTRAINT "ValidationResult_memoryId_fkey" FOREIGN KEY ("memoryId") REFERENCES "Memory" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "CalibrationHistory" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "calibrationId" TEXT NOT NULL,
    "adjustmentType" TEXT NOT NULL,
    "targetComponent" TEXT NOT NULL,
    "previousValue" TEXT NOT NULL,
    "newValue" TEXT NOT NULL,
    "performanceMetrics" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "appliedAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateIndex
CREATE INDEX "MoodScore_memoryId_idx" ON "MoodScore"("memoryId");

-- CreateIndex
CREATE INDEX "MoodScore_calculatedAt_idx" ON "MoodScore"("calculatedAt");

-- CreateIndex
CREATE INDEX "MoodFactor_moodScoreId_idx" ON "MoodFactor"("moodScoreId");

-- CreateIndex
CREATE INDEX "MoodDelta_memoryId_idx" ON "MoodDelta"("memoryId");

-- CreateIndex
CREATE INDEX "MoodDelta_detectedAt_idx" ON "MoodDelta"("detectedAt");

-- CreateIndex
CREATE INDEX "MoodDelta_significance_idx" ON "MoodDelta"("significance");

-- CreateIndex
CREATE INDEX "MoodDelta_conversationId_deltaSequence_idx" ON "MoodDelta"("conversationId", "deltaSequence");

-- CreateIndex
CREATE UNIQUE INDEX "AnalysisMetadata_memoryId_key" ON "AnalysisMetadata"("memoryId");

-- CreateIndex
CREATE INDEX "DeltaPattern_memoryId_idx" ON "DeltaPattern"("memoryId");

-- CreateIndex
CREATE INDEX "DeltaPattern_significance_idx" ON "DeltaPattern"("significance");

-- CreateIndex
CREATE INDEX "DeltaPattern_patternType_idx" ON "DeltaPattern"("patternType");

-- CreateIndex
CREATE INDEX "DeltaPatternAssociation_patternId_idx" ON "DeltaPatternAssociation"("patternId");

-- CreateIndex
CREATE INDEX "DeltaPatternAssociation_deltaId_idx" ON "DeltaPatternAssociation"("deltaId");

-- CreateIndex
CREATE UNIQUE INDEX "DeltaPatternAssociation_patternId_deltaId_key" ON "DeltaPatternAssociation"("patternId", "deltaId");

-- CreateIndex
CREATE INDEX "TurningPoint_memoryId_idx" ON "TurningPoint"("memoryId");

-- CreateIndex
CREATE INDEX "TurningPoint_timestamp_idx" ON "TurningPoint"("timestamp");

-- CreateIndex
CREATE INDEX "TurningPoint_significance_idx" ON "TurningPoint"("significance");

-- CreateIndex
CREATE INDEX "TurningPoint_type_idx" ON "TurningPoint"("type");

-- CreateIndex
CREATE INDEX "ValidationResult_memoryId_idx" ON "ValidationResult"("memoryId");

-- CreateIndex
CREATE INDEX "ValidationResult_validatedAt_idx" ON "ValidationResult"("validatedAt");

-- CreateIndex
CREATE INDEX "ValidationResult_validationType_idx" ON "ValidationResult"("validationType");

-- CreateIndex
CREATE UNIQUE INDEX "CalibrationHistory_calibrationId_key" ON "CalibrationHistory"("calibrationId");

-- CreateIndex
CREATE INDEX "CalibrationHistory_createdAt_idx" ON "CalibrationHistory"("createdAt");

-- CreateIndex
CREATE INDEX "CalibrationHistory_status_idx" ON "CalibrationHistory"("status");

-- CreateIndex
CREATE INDEX "CalibrationHistory_targetComponent_idx" ON "CalibrationHistory"("targetComponent");

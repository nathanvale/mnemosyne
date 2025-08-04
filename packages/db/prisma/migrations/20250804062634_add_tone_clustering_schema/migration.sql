-- CreateTable
CREATE TABLE "MemoryCluster" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "clusterId" TEXT NOT NULL,
    "clusterTheme" TEXT NOT NULL,
    "emotionalTone" TEXT NOT NULL,
    "coherenceScore" REAL NOT NULL,
    "psychologicalSignificance" REAL NOT NULL,
    "participantPatterns" TEXT NOT NULL,
    "clusterMetadata" TEXT NOT NULL,
    "memoryCount" INTEGER NOT NULL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "lastAnalyzedAt" DATETIME
);

-- CreateTable
CREATE TABLE "ClusterMembership" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "clusterId" TEXT NOT NULL,
    "memoryId" TEXT NOT NULL,
    "membershipStrength" REAL NOT NULL,
    "contributionScore" REAL NOT NULL,
    "addedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "ClusterMembership_clusterId_fkey" FOREIGN KEY ("clusterId") REFERENCES "MemoryCluster" ("clusterId") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "ClusterMembership_memoryId_fkey" FOREIGN KEY ("memoryId") REFERENCES "Memory" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "PatternAnalysis" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "patternId" TEXT NOT NULL,
    "clusterId" TEXT NOT NULL,
    "patternType" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "frequency" INTEGER NOT NULL,
    "strength" REAL NOT NULL,
    "confidenceLevel" REAL NOT NULL,
    "psychologicalIndicators" TEXT NOT NULL,
    "emotionalCharacteristics" TEXT NOT NULL,
    "analyzedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "PatternAnalysis_clusterId_fkey" FOREIGN KEY ("clusterId") REFERENCES "MemoryCluster" ("clusterId") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "ClusterQualityMetrics" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "clusterId" TEXT NOT NULL,
    "overallCoherence" REAL NOT NULL,
    "emotionalConsistency" REAL NOT NULL,
    "thematicUnity" REAL NOT NULL,
    "psychologicalMeaningfulness" REAL NOT NULL,
    "incoherentMemoryCount" INTEGER NOT NULL DEFAULT 0,
    "strengthAreas" TEXT NOT NULL,
    "improvementAreas" TEXT NOT NULL,
    "confidenceLevel" REAL NOT NULL,
    "assessedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "ClusterQualityMetrics_clusterId_fkey" FOREIGN KEY ("clusterId") REFERENCES "MemoryCluster" ("clusterId") ON DELETE CASCADE ON UPDATE CASCADE
);

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
    "updatedAt" DATETIME NOT NULL,
    "clusteringMetadata" TEXT,
    "lastClusteredAt" DATETIME,
    "clusterParticipationCount" INTEGER NOT NULL DEFAULT 0
);
INSERT INTO "new_Memory" ("confidence", "contentHash", "createdAt", "deduplicationMetadata", "extractedAt", "id", "participants", "sourceMessageIds", "summary", "updatedAt") SELECT "confidence", "contentHash", "createdAt", "deduplicationMetadata", "extractedAt", "id", "participants", "sourceMessageIds", "summary", "updatedAt" FROM "Memory";
DROP TABLE "Memory";
ALTER TABLE "new_Memory" RENAME TO "Memory";
CREATE UNIQUE INDEX "Memory_contentHash_key" ON "Memory"("contentHash");
CREATE INDEX "Memory_contentHash_idx" ON "Memory"("contentHash");
CREATE INDEX "Memory_extractedAt_idx" ON "Memory"("extractedAt");
CREATE INDEX "Memory_confidence_idx" ON "Memory"("confidence");
CREATE INDEX "Memory_extractedAt_confidence_idx" ON "Memory"("extractedAt", "confidence");
CREATE INDEX "Memory_createdAt_idx" ON "Memory"("createdAt");
CREATE INDEX "Memory_lastClusteredAt_clusterParticipationCount_idx" ON "Memory"("lastClusteredAt", "clusterParticipationCount");
CREATE TABLE "new_TurningPoint" (
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
    CONSTRAINT "TurningPoint_memoryId_fkey" FOREIGN KEY ("memoryId") REFERENCES "Memory" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "TurningPoint_deltaId_fkey" FOREIGN KEY ("deltaId") REFERENCES "MoodDelta" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_TurningPoint" ("createdAt", "deltaId", "description", "factors", "id", "magnitude", "memoryId", "significance", "temporalContext", "timestamp", "type") SELECT "createdAt", "deltaId", "description", "factors", "id", "magnitude", "memoryId", "significance", "temporalContext", "timestamp", "type" FROM "TurningPoint";
DROP TABLE "TurningPoint";
ALTER TABLE "new_TurningPoint" RENAME TO "TurningPoint";
CREATE INDEX "TurningPoint_memoryId_idx" ON "TurningPoint"("memoryId");
CREATE INDEX "TurningPoint_timestamp_idx" ON "TurningPoint"("timestamp");
CREATE INDEX "TurningPoint_significance_idx" ON "TurningPoint"("significance");
CREATE INDEX "TurningPoint_type_idx" ON "TurningPoint"("type");
CREATE INDEX "TurningPoint_type_significance_idx" ON "TurningPoint"("type", "significance");
CREATE INDEX "TurningPoint_magnitude_idx" ON "TurningPoint"("magnitude");
CREATE INDEX "TurningPoint_memoryId_timestamp_idx" ON "TurningPoint"("memoryId", "timestamp");
CREATE INDEX "TurningPoint_timestamp_significance_idx" ON "TurningPoint"("timestamp", "significance");
CREATE INDEX "TurningPoint_type_magnitude_idx" ON "TurningPoint"("type", "magnitude");
CREATE INDEX "TurningPoint_deltaId_idx" ON "TurningPoint"("deltaId");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- CreateIndex
CREATE UNIQUE INDEX "MemoryCluster_clusterId_key" ON "MemoryCluster"("clusterId");

-- CreateIndex
CREATE INDEX "MemoryCluster_coherenceScore_createdAt_idx" ON "MemoryCluster"("coherenceScore", "createdAt");

-- CreateIndex
CREATE INDEX "MemoryCluster_psychologicalSignificance_memoryCount_idx" ON "MemoryCluster"("psychologicalSignificance", "memoryCount");

-- CreateIndex
CREATE INDEX "MemoryCluster_clusterTheme_emotionalTone_idx" ON "MemoryCluster"("clusterTheme", "emotionalTone");

-- CreateIndex
CREATE INDEX "MemoryCluster_updatedAt_lastAnalyzedAt_idx" ON "MemoryCluster"("updatedAt", "lastAnalyzedAt");

-- CreateIndex
CREATE INDEX "ClusterMembership_clusterId_membershipStrength_idx" ON "ClusterMembership"("clusterId", "membershipStrength");

-- CreateIndex
CREATE INDEX "ClusterMembership_memoryId_contributionScore_idx" ON "ClusterMembership"("memoryId", "contributionScore");

-- CreateIndex
CREATE INDEX "ClusterMembership_membershipStrength_addedAt_idx" ON "ClusterMembership"("membershipStrength", "addedAt");

-- CreateIndex
CREATE UNIQUE INDEX "ClusterMembership_clusterId_memoryId_key" ON "ClusterMembership"("clusterId", "memoryId");

-- CreateIndex
CREATE UNIQUE INDEX "PatternAnalysis_patternId_key" ON "PatternAnalysis"("patternId");

-- CreateIndex
CREATE INDEX "PatternAnalysis_patternType_confidenceLevel_idx" ON "PatternAnalysis"("patternType", "confidenceLevel");

-- CreateIndex
CREATE INDEX "PatternAnalysis_clusterId_strength_idx" ON "PatternAnalysis"("clusterId", "strength");

-- CreateIndex
CREATE INDEX "PatternAnalysis_confidenceLevel_frequency_idx" ON "PatternAnalysis"("confidenceLevel", "frequency");

-- CreateIndex
CREATE UNIQUE INDEX "ClusterQualityMetrics_clusterId_key" ON "ClusterQualityMetrics"("clusterId");

-- CreateIndex
CREATE INDEX "ClusterQualityMetrics_overallCoherence_assessedAt_idx" ON "ClusterQualityMetrics"("overallCoherence", "assessedAt");

-- CreateIndex
CREATE INDEX "ClusterQualityMetrics_psychologicalMeaningfulness_confidenceLevel_idx" ON "ClusterQualityMetrics"("psychologicalMeaningfulness", "confidenceLevel");

-- CreateIndex
CREATE INDEX "DeltaPattern_patternType_significance_idx" ON "DeltaPattern"("patternType", "significance");

-- CreateIndex
CREATE INDEX "DeltaPattern_confidence_significance_idx" ON "DeltaPattern"("confidence", "significance");

-- CreateIndex
CREATE INDEX "DeltaPattern_duration_idx" ON "DeltaPattern"("duration");

-- CreateIndex
CREATE INDEX "DeltaPattern_averageMagnitude_idx" ON "DeltaPattern"("averageMagnitude");

-- CreateIndex
CREATE INDEX "DeltaPattern_memoryId_patternType_idx" ON "DeltaPattern"("memoryId", "patternType");

-- CreateIndex
CREATE INDEX "DeltaPattern_createdAt_significance_idx" ON "DeltaPattern"("createdAt", "significance");

-- CreateIndex
CREATE INDEX "DeltaPatternAssociation_patternId_sequenceOrder_idx" ON "DeltaPatternAssociation"("patternId", "sequenceOrder");

-- CreateIndex
CREATE INDEX "DeltaPatternAssociation_sequenceOrder_idx" ON "DeltaPatternAssociation"("sequenceOrder");

-- CreateIndex
CREATE INDEX "MoodDelta_direction_idx" ON "MoodDelta"("direction");

-- CreateIndex
CREATE INDEX "MoodDelta_type_idx" ON "MoodDelta"("type");

-- CreateIndex
CREATE INDEX "MoodDelta_magnitude_idx" ON "MoodDelta"("magnitude");

-- CreateIndex
CREATE INDEX "MoodDelta_type_significance_idx" ON "MoodDelta"("type", "significance");

-- CreateIndex
CREATE INDEX "MoodDelta_direction_magnitude_idx" ON "MoodDelta"("direction", "magnitude");

-- CreateIndex
CREATE INDEX "MoodDelta_memoryId_detectedAt_idx" ON "MoodDelta"("memoryId", "detectedAt");

-- CreateIndex
CREATE INDEX "MoodDelta_detectedAt_significance_idx" ON "MoodDelta"("detectedAt", "significance");

-- CreateIndex
CREATE INDEX "MoodDelta_confidence_significance_idx" ON "MoodDelta"("confidence", "significance");

-- CreateIndex
CREATE INDEX "MoodDelta_currentScore_previousScore_idx" ON "MoodDelta"("currentScore", "previousScore");

-- CreateIndex
CREATE INDEX "MoodFactor_type_idx" ON "MoodFactor"("type");

-- CreateIndex
CREATE INDEX "MoodFactor_type_weight_idx" ON "MoodFactor"("type", "weight");

-- CreateIndex
CREATE INDEX "MoodFactor_moodScoreId_type_idx" ON "MoodFactor"("moodScoreId", "type");

-- CreateIndex
CREATE INDEX "MoodFactor_weight_idx" ON "MoodFactor"("weight");

-- CreateIndex
CREATE INDEX "MoodScore_score_idx" ON "MoodScore"("score");

-- CreateIndex
CREATE INDEX "MoodScore_confidence_idx" ON "MoodScore"("confidence");

-- CreateIndex
CREATE INDEX "MoodScore_score_confidence_idx" ON "MoodScore"("score", "confidence");

-- CreateIndex
CREATE INDEX "MoodScore_memoryId_calculatedAt_idx" ON "MoodScore"("memoryId", "calculatedAt");

-- CreateIndex
CREATE INDEX "MoodScore_calculatedAt_score_idx" ON "MoodScore"("calculatedAt", "score");

-- CreateIndex
CREATE INDEX "MoodScore_algorithmVersion_calculatedAt_idx" ON "MoodScore"("algorithmVersion", "calculatedAt");

-- CreateIndex
CREATE INDEX "ValidationResult_validatorId_idx" ON "ValidationResult"("validatorId");

-- CreateIndex
CREATE INDEX "ValidationResult_humanScore_idx" ON "ValidationResult"("humanScore");

-- CreateIndex
CREATE INDEX "ValidationResult_algorithmScore_idx" ON "ValidationResult"("algorithmScore");

-- CreateIndex
CREATE INDEX "ValidationResult_validationMethod_agreement_idx" ON "ValidationResult"("validationMethod", "agreement");

-- CreateIndex
CREATE INDEX "ValidationResult_validatorId_agreement_idx" ON "ValidationResult"("validatorId", "agreement");

-- CreateIndex
CREATE INDEX "ValidationResult_validatedAt_agreement_idx" ON "ValidationResult"("validatedAt", "agreement");

-- CreateIndex
CREATE INDEX "ValidationResult_humanScore_algorithmScore_idx" ON "ValidationResult"("humanScore", "algorithmScore");

-- CreateIndex
CREATE INDEX "ValidationResult_discrepancy_validationMethod_idx" ON "ValidationResult"("discrepancy", "validationMethod");

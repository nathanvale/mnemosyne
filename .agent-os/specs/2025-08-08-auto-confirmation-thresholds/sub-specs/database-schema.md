# Database Schema

This is the database schema implementation for the spec detailed in @.agent-os/specs/2025-08-08-auto-confirmation-thresholds/spec.md

> Created: 2025-08-08
> Version: 1.0.0

## Schema Changes

### New Tables

#### ConfidenceScore

Stores detailed confidence scoring for memories with factor breakdowns:

- `id` - Primary key
- `memoryId` - Foreign key to Memory table
- `overallConfidence` - Overall confidence score (0.0-1.0)
- `claudeConfidence` - Claude confidence factor (0.0-1.0)
- `emotionalCoherence` - Emotional coherence factor (0.0-1.0)
- `relationshipAccuracy` - Relationship accuracy factor (0.0-1.0)
- `contextQuality` - Context quality factor (0.0-1.0)
- `reasoning` - JSON field with detailed reasoning breakdown
- `createdAt` - Timestamp of confidence calculation

#### AutoConfirmationDecision

Tracks auto-confirmation decisions and outcomes:

- `id` - Primary key
- `memoryId` - Foreign key to Memory table
- `confidenceScoreId` - Foreign key to ConfidenceScore table
- `decision` - Decision type (AUTO_APPROVE, REVIEW_REQUIRED, AUTO_REJECT)
- `thresholdVersion` - Version of thresholds used for decision
- `humanValidation` - Human validation result (if available)
- `accuracyResult` - Whether auto-decision matched human validation
- `createdAt` - Timestamp of decision

#### ThresholdConfiguration

Manages confidence thresholds and their evolution:

- `id` - Primary key
- `version` - Threshold version identifier
- `autoApproveThreshold` - Threshold for auto-approval (default: 0.75)
- `reviewRequiredThreshold` - Threshold for review requirement (default: 0.50)
- `isActive` - Whether this configuration is currently active
- `effectiveness` - Measured effectiveness of this configuration
- `createdBy` - User or system that created this configuration
- `createdAt` - Timestamp of creation

#### CalibrationMetrics

Stores calibration data for threshold optimization:

- `id` - Primary key
- `thresholdVersion` - Foreign key to ThresholdConfiguration
- `period` - Time period for metrics (e.g., week ending date)
- `totalDecisions` - Total auto-confirmation decisions made
- `autoApprovalCount` - Number of auto-approvals
- `reviewRequiredCount` - Number sent to review
- `autoRejectCount` - Number auto-rejected
- `falsePositiveRate` - Rate of incorrect auto-approvals
- `falseNegativeRate` - Rate of incorrect auto-rejections
- `overallAccuracy` - Overall accuracy percentage
- `calculatedAt` - Timestamp of metrics calculation

## Migration SQL

```sql
-- Create ConfidenceScore table
CREATE TABLE "ConfidenceScore" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "memoryId" TEXT NOT NULL,
    "overallConfidence" REAL NOT NULL,
    "claudeConfidence" REAL NOT NULL,
    "emotionalCoherence" REAL NOT NULL,
    "relationshipAccuracy" REAL NOT NULL,
    "contextQuality" REAL NOT NULL,
    "reasoning" TEXT NOT NULL, -- JSON field
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY ("memoryId") REFERENCES "Memory"("id") ON DELETE CASCADE
);

-- Create AutoConfirmationDecision table
CREATE TABLE "AutoConfirmationDecision" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "memoryId" TEXT NOT NULL,
    "confidenceScoreId" TEXT NOT NULL,
    "decision" TEXT NOT NULL CHECK ("decision" IN ('AUTO_APPROVE', 'REVIEW_REQUIRED', 'AUTO_REJECT')),
    "thresholdVersion" TEXT NOT NULL,
    "humanValidation" TEXT, -- Can be null if no human validation yet
    "accuracyResult" BOOLEAN, -- null until human validation is available
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY ("memoryId") REFERENCES "Memory"("id") ON DELETE CASCADE,
    FOREIGN KEY ("confidenceScoreId") REFERENCES "ConfidenceScore"("id") ON DELETE CASCADE
);

-- Create ThresholdConfiguration table
CREATE TABLE "ThresholdConfiguration" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "version" TEXT NOT NULL UNIQUE,
    "autoApproveThreshold" REAL NOT NULL DEFAULT 0.75,
    "reviewRequiredThreshold" REAL NOT NULL DEFAULT 0.50,
    "isActive" BOOLEAN NOT NULL DEFAULT FALSE,
    "effectiveness" REAL, -- null until measured
    "createdBy" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Create CalibrationMetrics table
CREATE TABLE "CalibrationMetrics" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "thresholdVersion" TEXT NOT NULL,
    "period" TEXT NOT NULL, -- e.g., "2025-08-08"
    "totalDecisions" INTEGER NOT NULL,
    "autoApprovalCount" INTEGER NOT NULL,
    "reviewRequiredCount" INTEGER NOT NULL,
    "autoRejectCount" INTEGER NOT NULL,
    "falsePositiveRate" REAL NOT NULL,
    "falseNegativeRate" REAL NOT NULL,
    "overallAccuracy" REAL NOT NULL,
    "calculatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY ("thresholdVersion") REFERENCES "ThresholdConfiguration"("version")
);

-- Create indexes for performance
CREATE INDEX "ConfidenceScore_memoryId_idx" ON "ConfidenceScore"("memoryId");
CREATE INDEX "ConfidenceScore_overallConfidence_idx" ON "ConfidenceScore"("overallConfidence");
CREATE INDEX "AutoConfirmationDecision_memoryId_idx" ON "AutoConfirmationDecision"("memoryId");
CREATE INDEX "AutoConfirmationDecision_decision_idx" ON "AutoConfirmationDecision"("decision");
CREATE INDEX "AutoConfirmationDecision_thresholdVersion_idx" ON "AutoConfirmationDecision"("thresholdVersion");
CREATE INDEX "ThresholdConfiguration_isActive_idx" ON "ThresholdConfiguration"("isActive");
CREATE INDEX "CalibrationMetrics_period_idx" ON "CalibrationMetrics"("period");

-- Insert default threshold configuration
INSERT INTO "ThresholdConfiguration" ("id", "version", "autoApproveThreshold", "reviewRequiredThreshold", "isActive", "createdBy")
VALUES ('default-v1', 'v1.0.0', 0.75, 0.50, TRUE, 'system');
```

## Rationale

### Table Design Decisions

**ConfidenceScore separation**: Separating confidence scores from decisions allows for recalculation and analysis of scoring factors independently of decision logic.

**Threshold versioning**: Tracking threshold versions enables A/B testing and rollback capabilities while maintaining decision audit trails.

**Calibration metrics aggregation**: Pre-calculating metrics by time period improves dashboard performance and enables trend analysis.

**Foreign key relationships**: Ensuring referential integrity while supporting cascading deletes for memory cleanup.

### Performance Considerations

**Indexes on confidence scores**: Fast lookup for confidence-based queries and analytics.

**Decision type indexing**: Efficient filtering of decisions by type for monitoring dashboards.

**Period-based metrics**: Time-based indexing for calibration trend analysis.

### Data Integrity Rules

**Check constraints**: Ensuring decision types are valid enum values.

**Confidence ranges**: Confidence scores are constrained to 0.0-1.0 range at application level.

**Threshold relationships**: Auto-approve threshold must be higher than review threshold (enforced at application level).

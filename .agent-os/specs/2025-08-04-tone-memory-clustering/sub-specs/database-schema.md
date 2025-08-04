# Database Schema

This is the database schema implementation for the spec detailed in @.agent-os/specs/2025-08-04-tone-memory-clustering/spec.md

> Created: 2025-08-04
> Version: 1.0.0

## Schema Changes

### New Tables

#### MemoryCluster

- **Purpose**: Store memory cluster information with psychological themes and coherence metrics
- **Relationships**: Has many ClusterMembership, has many PatternAnalysis
- **Indexes**: clusterId (primary), createdAt, coherenceScore, psychologicalSignificance

#### ClusterMembership

- **Purpose**: Many-to-many relationship between memories and clusters
- **Relationships**: Belongs to MemoryCluster, belongs to Memory
- **Indexes**: clusterId + memoryId (composite unique), clusterId, memoryId

#### PatternAnalysis

- **Purpose**: Store identified emotional patterns and psychological insights
- **Relationships**: Belongs to MemoryCluster, has many PatternCharacteristics
- **Indexes**: patternId (primary), clusterId, patternType, confidenceLevel

#### ClusterQualityMetrics

- **Purpose**: Track cluster quality assessment and validation results
- **Relationships**: One-to-one with MemoryCluster
- **Indexes**: clusterId (unique), assessedAt, overallCoherence

### Schema Modifications

#### Memory (Enhanced)

- **New columns**: Add clustering metadata and pattern participation tracking
- **Relationships**: Has many ClusterMembership (new many-to-many with clusters)

## Database Schema Specification

```sql
-- Memory Cluster table for psychological theme organization
CREATE TABLE MemoryCluster (
  id                        TEXT PRIMARY KEY,
  clusterId                 TEXT UNIQUE NOT NULL,
  clusterTheme              TEXT NOT NULL,
  emotionalTone            TEXT NOT NULL,
  coherenceScore           REAL NOT NULL CHECK (coherenceScore >= 0.0 AND coherenceScore <= 1.0),
  psychologicalSignificance REAL NOT NULL CHECK (psychologicalSignificance >= 0.0 AND psychologicalSignificance <= 1.0),
  participantPatterns       TEXT NOT NULL, -- JSON array of participant patterns
  clusterMetadata          TEXT NOT NULL, -- JSON object with clustering metadata
  memoryCount              INTEGER NOT NULL DEFAULT 0,
  createdAt                DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updatedAt                DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  lastAnalyzedAt           DATETIME,

  -- Constraints
  CONSTRAINT cluster_coherence_valid CHECK (coherenceScore >= 0.6), -- Minimum coherence threshold
  CONSTRAINT cluster_significance_valid CHECK (psychologicalSignificance > 0.0),
  CONSTRAINT cluster_memory_count_valid CHECK (memoryCount >= 0)
);

-- Many-to-many relationship between memories and clusters
CREATE TABLE ClusterMembership (
  id                TEXT PRIMARY KEY,
  clusterId         TEXT NOT NULL,
  memoryId          TEXT NOT NULL,
  membershipStrength REAL NOT NULL CHECK (membershipStrength >= 0.0 AND membershipStrength <= 1.0),
  contributionScore  REAL NOT NULL CHECK (contributionScore >= 0.0 AND contributionScore <= 1.0),
  addedAt           DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,

  -- Foreign keys
  FOREIGN KEY (clusterId) REFERENCES MemoryCluster(clusterId) ON DELETE CASCADE,
  FOREIGN KEY (memoryId) REFERENCES Memory(id) ON DELETE CASCADE,

  -- Constraints
  UNIQUE(clusterId, memoryId), -- Memory can only belong to a cluster once
  CONSTRAINT membership_strength_valid CHECK (membershipStrength >= 0.5) -- Minimum membership threshold
);

-- Pattern analysis results for cross-cluster insights
CREATE TABLE PatternAnalysis (
  id                  TEXT PRIMARY KEY,
  patternId           TEXT UNIQUE NOT NULL,
  clusterId           TEXT NOT NULL,
  patternType         TEXT NOT NULL CHECK (patternType IN ('emotional_theme', 'coping_style', 'relationship_dynamic', 'psychological_tendency')),
  description         TEXT NOT NULL,
  frequency           INTEGER NOT NULL CHECK (frequency > 0),
  strength            REAL NOT NULL CHECK (strength >= 0.0 AND strength <= 1.0),
  confidenceLevel     REAL NOT NULL CHECK (confidenceLevel >= 0.0 AND confidenceLevel <= 1.0),
  psychologicalIndicators TEXT NOT NULL, -- JSON array of psychological indicators
  emotionalCharacteristics TEXT NOT NULL, -- JSON array of emotional characteristics
  analyzedAt          DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,

  -- Foreign keys
  FOREIGN KEY (clusterId) REFERENCES MemoryCluster(clusterId) ON DELETE CASCADE,

  -- Constraints
  CONSTRAINT pattern_confidence_valid CHECK (confidenceLevel >= 0.8), -- High confidence patterns only
  CONSTRAINT pattern_strength_valid CHECK (strength >= 0.3) -- Meaningful strength threshold
);

-- Cluster quality assessment metrics
CREATE TABLE ClusterQualityMetrics (
  id                          TEXT PRIMARY KEY,
  clusterId                   TEXT UNIQUE NOT NULL,
  overallCoherence           REAL NOT NULL CHECK (overallCoherence >= 0.0 AND overallCoherence <= 1.0),
  emotionalConsistency       REAL NOT NULL CHECK (emotionalConsistency >= 0.0 AND emotionalConsistency <= 1.0),
  thematicUnity              REAL NOT NULL CHECK (thematicUnity >= 0.0 AND thematicUnity <= 1.0),
  psychologicalMeaningfulness REAL NOT NULL CHECK (psychologicalMeaningfulness >= 0.0 AND psychologicalMeaningfulness <= 1.0),
  incoherentMemoryCount      INTEGER NOT NULL DEFAULT 0,
  strengthAreas              TEXT NOT NULL, -- JSON array of strength areas
  improvementAreas           TEXT NOT NULL, -- JSON array of improvement areas
  confidenceLevel            REAL NOT NULL CHECK (confidenceLevel >= 0.0 AND confidenceLevel <= 1.0),
  assessedAt                 DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,

  -- Foreign keys
  FOREIGN KEY (clusterId) REFERENCES MemoryCluster(clusterId) ON DELETE CASCADE,

  -- Constraints
  CONSTRAINT quality_coherence_threshold CHECK (overallCoherence >= 0.6), -- Minimum quality threshold
  CONSTRAINT quality_meaningfulness_threshold CHECK (psychologicalMeaningfulness >= 0.7) -- High meaningfulness required
);

-- Enhanced Memory table with clustering metadata
ALTER TABLE Memory ADD COLUMN clusteringMetadata TEXT; -- JSON object with clustering information
ALTER TABLE Memory ADD COLUMN lastClusteredAt DATETIME;
ALTER TABLE Memory ADD COLUMN clusterParticipationCount INTEGER DEFAULT 0;
```

## Indexes and Performance Optimization

```sql
-- Primary performance indexes
CREATE INDEX idx_memory_cluster_coherence ON MemoryCluster(coherenceScore DESC, createdAt DESC);
CREATE INDEX idx_memory_cluster_significance ON MemoryCluster(psychologicalSignificance DESC, memoryCount DESC);
CREATE INDEX idx_memory_cluster_theme ON MemoryCluster(clusterTheme, emotionalTone);
CREATE INDEX idx_memory_cluster_updated ON MemoryCluster(updatedAt DESC, lastAnalyzedAt DESC);

-- Clustering membership indexes
CREATE INDEX idx_cluster_membership_cluster ON ClusterMembership(clusterId, membershipStrength DESC);
CREATE INDEX idx_cluster_membership_memory ON ClusterMembership(memoryId, contributionScore DESC);
CREATE INDEX idx_cluster_membership_strength ON ClusterMembership(membershipStrength DESC, addedAt DESC);

-- Pattern analysis indexes
CREATE INDEX idx_pattern_analysis_type ON PatternAnalysis(patternType, confidenceLevel DESC);
CREATE INDEX idx_pattern_analysis_cluster ON PatternAnalysis(clusterId, strength DESC);
CREATE INDEX idx_pattern_analysis_confidence ON PatternAnalysis(confidenceLevel DESC, frequency DESC);

-- Quality metrics indexes
CREATE INDEX idx_cluster_quality_coherence ON ClusterQualityMetrics(overallCoherence DESC, assessedAt DESC);
CREATE INDEX idx_cluster_quality_meaningfulness ON ClusterQualityMetrics(psychologicalMeaningfulness DESC, confidenceLevel DESC);

-- Enhanced memory indexes
CREATE INDEX idx_memory_clustering ON Memory(lastClusteredAt DESC, clusterParticipationCount DESC);
```

## Migration Scripts

```sql
-- Migration: Add clustering support to existing schema
-- File: packages/db/prisma/migrations/add_tone_clustering_schema.sql

BEGIN TRANSACTION;

-- Create new clustering tables
-- (MemoryCluster, ClusterMembership, PatternAnalysis, ClusterQualityMetrics tables as defined above)

-- Add clustering metadata to existing Memory table
ALTER TABLE Memory ADD COLUMN clusteringMetadata TEXT DEFAULT '{}';
ALTER TABLE Memory ADD COLUMN lastClusteredAt DATETIME;
ALTER TABLE Memory ADD COLUMN clusterParticipationCount INTEGER DEFAULT 0;

-- Create all indexes
-- (All index definitions as specified above)

-- Verify schema integrity
PRAGMA foreign_key_check;

COMMIT;
```

## Rationale for Schema Design

### Memory Cluster Table Design

- **Coherence scoring**: Tracks psychological meaningfulness with minimum thresholds to ensure quality
- **Participant patterns**: JSON storage allows flexible relationship dynamic tracking
- **Metadata flexibility**: JSON cluster metadata supports evolving clustering algorithm improvements
- **Audit trail**: Created/updated timestamps enable clustering algorithm performance analysis

### Cluster Membership Relationship

- **Strength metrics**: Membership and contribution scores enable fuzzy clustering and quality assessment
- **Cascade deletion**: Maintains referential integrity when memories or clusters are removed
- **Unique constraints**: Prevents duplicate cluster memberships while allowing multiple cluster participation

### Pattern Analysis Storage

- **Type enumeration**: Constrains pattern types to psychological categories for consistency
- **Confidence thresholds**: Ensures only high-confidence patterns are stored for reliability
- **JSON flexibility**: Supports evolving psychological indicator and characteristic definitions

### Quality Metrics Tracking

- **Multi-dimensional assessment**: Tracks coherence, consistency, unity, and meaningfulness separately
- **Improvement tracking**: Strength and improvement areas support continuous clustering enhancement
- **Validation support**: Confidence levels enable human validation workflow integration

## Performance Considerations

### Query Optimization

- **Compound indexes**: Support common query patterns for cluster retrieval and analysis
- **Selective indexing**: Focus on high-cardinality columns used in filtering and sorting
- **JSON performance**: Clustering metadata stored as JSON for flexibility with appropriate indexing

### Scalability Planning

- **Partitioning strategy**: Cluster tables can be partitioned by creation date for large datasets
- **Archive support**: Old cluster analyses can be moved to archive tables for historical analysis
- **Cache-friendly design**: Key metrics stored as computed columns for fast retrieval

### Data Integrity

- **Constraint validation**: Check constraints ensure data quality at database level
- **Foreign key enforcement**: Maintains referential integrity across clustering relationships
- **Transaction support**: Schema supports atomic clustering operations with rollback capability

# Database Schema

This is the database schema implementation for the spec detailed in @.agent-os/specs/2025-08-08-prisma-database-schema/spec.md

> Created: 2025-08-08
> Version: 1.0.0

## Schema Configuration

```prisma
generator client {
  provider = "prisma-client-js"
  output   = "../generated"
}

datasource db {
  provider = "sqlite"
  url      = env("DATABASE_URL")
}
```

## Core Tables

### Message Table

- **id**: Auto-increment primary key
- **timestamp**: DateTime for message time
- **sender**: String for sender name
- **senderId**: Optional string for sender identifier
- **message**: Optional string for message content
- **hash**: Unique string for content deduplication (SHA-256)
- **createdAt**: DateTime with auto-generation
- **updatedAt**: DateTime with auto-update
- **Relationships**: One-to-many with Asset, Link, and Memory tables

### Link Table

- **id**: Auto-increment primary key
- **url**: String for extracted URL
- **messageId**: Foreign key to Message table
- **Relationship**: Many-to-one with Message table

### Asset Table

- **id**: Auto-increment primary key
- **filename**: String for asset filename
- **messageId**: Foreign key to Message table
- **type**: Optional string for MIME type
- **Relationship**: Many-to-one with Message table

## Memory and Emotional Intelligence Tables

### Memory Table (Central Hub)

- **id**: CUID primary key
- **sourceMessageIds**: JSON array of related message IDs
- **participants**: JSON participant data structure
- **summary**: String summary of memory
- **confidence**: Integer 1-10 confidence score
- **contentHash**: Unique SHA-256 hash for deduplication
- **deduplicationMetadata**: Optional JSON for merge history
- **extractedAt**: DateTime of extraction
- **clusteringMetadata**: Optional JSON for cluster information
- **lastClusteredAt**: Optional DateTime for last clustering
- **clusterParticipationCount**: Integer count of cluster participation
- **Indexes**: extractedAt, confidence, composite indexes for performance
- **Relationships**: Multiple one-to-one and one-to-many relationships

### EmotionalContext Table

- **id**: CUID primary key
- **memoryId**: Unique foreign key to Memory
- **primaryMood**: String (positive/negative/neutral/mixed/ambiguous)
- **intensity**: Integer 1-10 scale
- **themes**: JSON array of emotional themes
- **emotionalMarkers**: JSON array of markers
- **contextualEvents**: JSON array of events
- **temporalPatterns**: JSON array of patterns
- **Relationship**: One-to-one with Memory (cascade delete)

### RelationshipDynamics Table

- **id**: CUID primary key
- **memoryId**: Unique foreign key to Memory
- **overallDynamics**: JSON overall relationship data
- **participantDynamics**: JSON array of participant dynamics
- **interactionPatterns**: JSON interaction data
- **conflictResolution**: JSON conflict data
- **Relationship**: One-to-one with Memory (cascade delete)

## Analysis and Quality Tables

### MoodScore Table

- **id**: CUID primary key
- **memoryId**: Foreign key to Memory
- **dimension**: String mood dimension
- **score**: Float score value
- **components**: JSON score components
- **metadata**: Optional JSON metadata
- **calculatedAt**: DateTime of calculation
- **Indexes**: Composite on memoryId + dimension
- **Relationship**: Many-to-one with Memory

### MoodDelta Table

- **id**: CUID primary key
- **memoryId**: Foreign key to Memory
- **previousMemoryId**: Foreign key to previous Memory
- **dimension**: String dimension
- **previousScore**: Float previous value
- **currentScore**: Float current value
- **delta**: Float change value
- **percentageChange**: Float percentage
- **significance**: String significance level
- **Indexes**: Multiple for query optimization
- **Relationship**: Many-to-one with Memory

### ValidationStatus Table

- **id**: CUID primary key
- **memoryId**: Unique foreign key to Memory
- **status**: String validation status
- **lastValidated**: DateTime of validation
- **validationErrors**: Optional JSON errors
- **validationMetadata**: Optional JSON metadata
- **Relationship**: One-to-one with Memory

### QualityMetrics Table

- **id**: CUID primary key
- **memoryId**: Foreign key to Memory
- **metricType**: String metric type
- **score**: Float quality score
- **dimensions**: JSON dimensional scores
- **metadata**: Optional JSON metadata
- **measuredAt**: DateTime of measurement
- **Indexes**: Composite on memoryId + metricType
- **Relationship**: Many-to-one with Memory

## Clustering Tables

### MemoryCluster Table

- **id**: CUID primary key
- **label**: String cluster label
- **theme**: String cluster theme
- **createdAt**: DateTime creation time
- **metadata**: Optional JSON metadata
- **parentClusterId**: Optional self-reference for hierarchy
- **Indexes**: parentClusterId, createdAt
- **Relationships**: Self-referential, many-to-many with Memory

### ClusterMembership Table (Junction)

- **id**: CUID primary key
- **memoryId**: Foreign key to Memory
- **clusterId**: Foreign key to MemoryCluster
- **membershipScore**: Float membership strength
- **joinedAt**: DateTime of joining
- **metadata**: Optional JSON metadata
- **Unique Constraint**: memoryId + clusterId composite
- **Indexes**: All foreign keys and joinedAt
- **Relationships**: Junction table for Memory-Cluster many-to-many

## Pattern Recognition Tables

### DeltaPattern Table

- **id**: CUID primary key
- **memoryId**: Foreign key to Memory
- **patternType**: String pattern classification
- **strength**: Float pattern strength
- **components**: JSON pattern components
- **detectedAt**: DateTime of detection
- **metadata**: Optional JSON metadata
- **Indexes**: memoryId, patternType, composite indexes
- **Relationship**: Many-to-one with Memory

### TurningPoint Table

- **id**: CUID primary key
- **memoryId**: Foreign key to Memory
- **type**: String turning point type
- **magnitude**: Float magnitude measure
- **dimensions**: JSON affected dimensions
- **beforeState**: JSON state before
- **afterState**: JSON state after
- **detectedAt**: DateTime of detection
- **Indexes**: memoryId, type, magnitude
- **Relationship**: Many-to-one with Memory

## Metadata Tables

### AnalysisMetadata Table

- **id**: CUID primary key
- **memoryId**: Unique foreign key to Memory
- **analysisVersion**: String version
- **configuration**: JSON analysis config
- **processingTime**: Integer milliseconds
- **completedAt**: DateTime completion
- **metadata**: Optional JSON additional data
- **Relationship**: One-to-one with Memory (cascade delete)

### ValidationResult Table

- **id**: CUID primary key
- **memoryId**: Foreign key to Memory
- **validationType**: String validation type
- **passed**: Boolean result
- **details**: JSON validation details
- **validatedAt**: DateTime of validation
- **metadata**: Optional JSON metadata
- **Indexes**: Composite on memoryId + validationType
- **Relationship**: Many-to-one with Memory

## Index Strategy

**Primary Indexes**:

- All primary keys automatically indexed
- Unique constraints create implicit indexes

**Performance Indexes**:

- Temporal queries: extractedAt, createdAt, lastClusteredAt
- Filtering: confidence, status, type fields
- Relationships: All foreign keys indexed

**Composite Indexes**:

- Multi-field queries: (extractedAt, confidence)
- Unique lookups: (memoryId, dimension)
- Clustering: (lastClusteredAt, clusterParticipationCount)

## Migration Strategy

**Schema Evolution**:

- Prisma Migrate for version-controlled migrations
- Forward-only migrations with no data loss
- Development migrations with db push for rapid iteration
- Production migrations with migrate deploy

**Data Migration**:

- Custom scripts for complex data transformations
- Batch processing for large-scale updates
- Validation after each migration step
- Rollback procedures documented

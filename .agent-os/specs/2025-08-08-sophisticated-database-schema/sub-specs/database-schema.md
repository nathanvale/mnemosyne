# Database Schema

This is the database schema implementation for the spec detailed in @.agent-os/specs/2025-08-08-sophisticated-database-schema/spec.md

> Created: 2025-08-08
> Version: 1.0.0

## Schema Overview

The sophisticated database schema consists of 54 tables organized into 4 main phases:

### Phase 1: Core Message Storage (3 tables)

- **Message** - Primary message storage with timestamp, sender, hash
- **Link** - URLs extracted from messages with foreign key to Message
- **Asset** - File attachments with foreign key to Message

### Phase 2: Memory and Emotional Intelligence (6 tables)

- **Memory** - Core memory storage with emotional context relationships
- **EmotionalContext** - Mood classification, themes, markers, temporal patterns
- **RelationshipDynamics** - Participant dynamics, communication patterns
- **ValidationStatus** - Validation workflow with refinement suggestions
- **QualityMetrics** - Dimensional quality assessment with evidence support
- **AnalysisMetadata** - Processing duration, confidence, quality metrics

### Phase 3: Mood Scoring and Analysis (7 tables)

- **MoodScore** - 0-10 mood scoring with confidence and descriptors
- **MoodFactor** - Weighted evidence factors for mood analysis
- **MoodDelta** - Emotional transitions with magnitude and direction
- **DeltaPattern** - Pattern sequences (recovery, decline, plateau, oscillation)
- **DeltaPatternAssociation** - Many-to-many relationship between patterns and deltas
- **TurningPoint** - Breakthrough/setback moments with significance
- **ValidationResult** - Human-algorithm agreement tracking

### Phase 4: Clustering and Quality (11 tables)

- **MemoryCluster** - Psychological theme organization with coherence
- **ClusterMembership** - Memory-cluster relationships with strength
- **PatternAnalysis** - Emotional themes, coping styles, relationship dynamics
- **ClusterQualityMetrics** - Coherence assessment and improvement areas
- **CalibrationHistory** - Algorithm adjustment tracking

## Key Schema Details

### Core Memory Table

```sql
model Memory {
  id                String             @id @default(cuid())
  sourceMessageIds  String             // JSON array of message IDs
  participants      String             // JSON participant data
  summary          String
  confidence       Int                // 1-10 scale
  contentHash      String             @unique // SHA-256 hash for deduplication
  deduplicationMetadata String?       // JSON metadata for merge history
  extractedAt      DateTime           @default(now())
  createdAt        DateTime           @default(now())
  updatedAt        DateTime           @updatedAt

  // Clustering metadata
  clusteringMetadata String?           // JSON object with clustering information
  lastClusteredAt   DateTime?
  clusterParticipationCount Int       @default(0)

  // Complex relationships to 15+ tables
  emotionalContext EmotionalContext?
  relationshipDynamics RelationshipDynamics?
  validationStatus ValidationStatus?
  qualityMetrics   QualityMetrics[]
  moodScores       MoodScore[]
  // ... additional relationships
}
```

### Performance Indexes

```sql
// Memory table performance indexes
@@index([extractedAt])                 // Temporal memory analysis
@@index([confidence])                  // Confidence-based filtering
@@index([extractedAt, confidence])     // Time-confidence correlation
@@index([createdAt])                   // Creation time analysis
@@index([lastClusteredAt, clusterParticipationCount]) // Clustering queries

// MoodScore performance indexes
@@index([memoryId])
@@index([calculatedAt])
@@index([score])                          // Score range queries
@@index([confidence])                     // Confidence range queries
@@index([score, confidence])              // Combined filtering
@@index([memoryId, calculatedAt])         // Memory-specific temporal queries
@@index([algorithmVersion, calculatedAt]) // Algorithm performance tracking

// MoodDelta performance indexes
@@index([significance])
@@index([conversationId, deltaSequence])
@@index([direction])                      // Directional delta analysis
@@index([type])                           // Delta type filtering
@@index([magnitude])                      // Magnitude-based queries
@@index([confidence, significance])       // Confident significant deltas
```

### Foreign Key Relationships

**Memory Relationships** (15 foreign key relationships):

- One-to-one: EmotionalContext, RelationshipDynamics, ValidationStatus, AnalysisMetadata
- One-to-many: QualityMetrics, MoodScores, MoodDeltas, DeltaPatterns, TurningPoints
- Many-to-many: ClusterMemberships (via cluster), Messages (via relation table)

**Cascade Delete Strategy**:

- All child tables use `onDelete: Cascade` to maintain referential integrity
- Memory deletion cascades to all related emotional intelligence data
- Cluster deletion cascades to memberships and quality metrics
- Pattern deletion cascades to pattern associations

### Data Types and Constraints

**JSON Storage Fields**:

- `participants` - Complex participant data with roles and metadata
- `deduplicationMetadata` - Merge history and conflict resolution data
- `clusteringMetadata` - Clustering algorithm state and parameters
- `themes` - EmotionalTheme array with evidence and confidence
- `emotionalMarkers` - EmotionalMarker array with timestamps
- `factors` - Evidence arrays for mood factor analysis

**Validation Constraints**:

- Confidence scores: 1-10 integer scale for Memory table
- Mood scores: 0-10 float scale with 0-1 confidence levels
- Coherence scores: 0-1 float scale with minimum 0.6 threshold
- Membership strength: 0-1 float scale with minimum 0.5 threshold

## Migration Strategy

**Schema Evolution**:

- Prisma migrations in `packages/db/prisma/migrations/`
- Database triggers created via raw SQL for complex business logic
- Version tracking in schema comments and migration history

**Development Workflow**:

1. Update `schema.prisma` with new tables or fields
2. Run `prisma migrate dev` to create migration
3. Run `prisma generate` to update TypeScript client
4. Update database triggers if needed via raw SQL

**Production Considerations**:

- Schema designed for horizontal scaling through participant-based sharding
- Indexes optimized for most common query patterns (temporal, confidence, clustering)
- JSON fields used sparingly with proper indexing on extracted values

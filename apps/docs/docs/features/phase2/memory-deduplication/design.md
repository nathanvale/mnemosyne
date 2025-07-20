---
id: memory-deduplication-design
title: Design - Memory Extraction Deduplication
---

# 🏗️ Design: Memory Extraction Deduplication

## 🎯 Overview

Memory extraction deduplication ensures that running memory processing multiple times on the same message data does not create duplicate memories. This system provides content-based deduplication, enabling efficient incremental processing and maintaining data integrity across multiple extraction runs.

**Key Design Principles**:

- **Content-Based Identity**: Memory identity determined by semantic content, not processing metadata
- **Incremental Processing**: Support for adding new messages without reprocessing existing memories
- **Conflict Resolution**: Smart handling of similar but slightly different memories
- **Performance Efficiency**: Fast duplicate detection without compromising extraction quality

**Integration Strategy**: The deduplication system integrates with Phase 1 message deduplication patterns, extending content-based hashing to semantic memory structures while supporting the Phase 2 memory processing pipeline and validation workflows.

## 🏛️ Deduplication Architecture

### Core Deduplication Components

**Memory Content Hasher**

- **Role**: Generate stable, content-based hashes for memory objects
- **Responsibility**: Hash normalization, field selection, collision detection
- **Components**: Content normalizer, hash calculator, collision resolver
- **Output**: Unique content hash representing memory semantic identity

**Duplicate Detection Engine**

- **Role**: Identify existing memories with identical or similar content
- **Responsibility**: Hash comparison, similarity analysis, conflict detection
- **Components**: Hash matcher, similarity calculator, conflict detector
- **Output**: Duplicate classification with confidence scores and merge recommendations

**Memory Merge Processor**

- **Role**: Handle conflicts between similar memories through intelligent merging
- **Responsibility**: Content merging, confidence reconciliation, metadata preservation
- **Components**: Content merger, confidence calculator, metadata reconciler
- **Output**: Merged memory objects with preserved evidence and improved confidence

**Deduplication Metadata Tracker**

- **Role**: Track deduplication decisions and processing history
- **Responsibility**: Decision logging, processing metrics, audit trail maintenance
- **Components**: Decision logger, metrics calculator, audit manager
- **Output**: Comprehensive deduplication audit trail and performance metrics

### Deduplication Flow Architecture

```
Memory Extraction → Content Hashing → Duplicate Detection → Conflict Resolution → Storage Decision
       ↓                ↓                ↓                   ↓                  ↓
Source Analysis → Content Normalizer → Hash Comparison → Merge Processing → Memory Persistence
       ↓                ↓                ↓                   ↓                  ↓
Message Group → Semantic Fingerprint → Similarity Score → Content Integration → Database Storage
```

**Detailed Flow**:

1. **Memory Extraction**: Extract memory from message batch using Claude processing
2. **Content Hashing**: Generate normalized content hash for semantic identity
3. **Duplicate Detection**: Check existing memories for identical or similar content
4. **Conflict Resolution**: Merge similar memories or flag for manual review
5. **Storage Decision**: Store new memory, update existing, or skip duplicate

## 📦 Content Hashing Strategy

### Hash Generation Components

**Core Content Fields for Hashing**:

```typescript
interface MemoryHashContent {
  // Source message identity
  sourceMessageIds: string[] // Sorted array of source message IDs

  // Participant identity (normalized)
  participantSignature: string // Normalized participant roles and relationships

  // Emotional content (normalized)
  emotionalSignature: string // Primary themes and emotional patterns

  // Relationship dynamics (normalized)
  relationshipSignature: string // Key relationship patterns and dynamics

  // Temporal context (normalized)
  temporalSignature: string // Time span and progression patterns
}
```

**Content Normalization Process**:

```typescript
class MemoryContentHasher {
  generateContentHash(memory: Memory): string {
    const hashContent: MemoryHashContent = {
      sourceMessageIds: this.normalizeSourceIds(memory.sourceMessageIds),
      participantSignature: this.normalizeParticipants(memory.participants),
      emotionalSignature: this.normalizeEmotionalContext(
        memory.emotionalContext,
      ),
      relationshipSignature: this.normalizeRelationshipDynamics(
        memory.relationshipDynamics,
      ),
      temporalSignature: this.normalizeTemporalContext(
        memory.extractedAt,
        memory.sourceMessageIds,
      ),
    }

    const normalizedContent = this.serializeForHashing(hashContent)
    return createHash('sha256').update(normalizedContent).digest('hex')
  }

  private normalizeSourceIds(messageIds: string[]): string[] {
    // Sort message IDs to ensure consistent ordering
    return [...messageIds].sort()
  }

  private normalizeParticipants(participants: Participant[]): string {
    // Create stable signature based on participant roles and relationships
    const participantSigs = participants
      .map((p) => `${p.role}:${p.emotionalState.dominantEmotion}`)
      .sort()
    return participantSigs.join('|')
  }

  private normalizeEmotionalContext(context: EmotionalContext): string {
    // Focus on primary emotional themes, ignoring confidence scores and detailed markers
    const primaryThemes = context.themes
      .filter((theme) => theme.relevance >= 7) // Only high-relevance themes
      .map((theme) => theme.theme)
      .sort()

    return `${context.primaryMood}:${context.intensity}:${primaryThemes.join(',')}`
  }

  private normalizeRelationshipDynamics(
    dynamics: RelationshipDynamics,
  ): string {
    // Focus on core relationship patterns, ignoring detailed interaction quality metrics
    const { closeness, tension, supportiveness } = dynamics.overallDynamics
    const primaryPatterns = dynamics.communicationPatterns
      .filter((pattern) => pattern.frequency >= 3)
      .map((pattern) => pattern.pattern)
      .sort()

    return `${closeness}:${tension}:${supportiveness}:${primaryPatterns.join(',')}`
  }

  private normalizeTemporalContext(
    extractedAt: Date,
    messageIds: string[],
  ): string {
    // Create signature based on time span and message count, not absolute timestamps
    const messageCount = messageIds.length
    return `${messageCount}msgs`
  }
}
```

### Hash Collision Handling

**Collision Detection Strategy**:

```typescript
interface HashCollision {
  existingMemory: Memory
  newMemory: Memory
  contentHash: string
  collisionType: 'identical' | 'hash_collision'
  similarityScore: number
  recommendedAction: 'skip' | 'merge' | 'review'
}

class CollisionResolver {
  async detectCollision(
    newMemory: Memory,
    contentHash: string,
  ): Promise<HashCollision | null> {
    const existingMemory = await this.findMemoryByHash(contentHash)

    if (!existingMemory) {
      return null
    }

    const similarityScore = this.calculateSimilarity(existingMemory, newMemory)

    return {
      existingMemory,
      newMemory,
      contentHash,
      collisionType: similarityScore > 0.95 ? 'identical' : 'hash_collision',
      similarityScore,
      recommendedAction: this.determineAction(similarityScore),
    }
  }

  private calculateSimilarity(existing: Memory, newMemory: Memory): number {
    // Deep content similarity beyond hash matching
    const emotionalSimilarity = this.compareEmotionalContext(
      existing.emotionalContext,
      newMemory.emotionalContext,
    )
    const relationshipSimilarity = this.compareRelationshipDynamics(
      existing.relationshipDynamics,
      newMemory.relationshipDynamics,
    )
    const participantSimilarity = this.compareParticipants(
      existing.participants,
      newMemory.participants,
    )

    return (
      (emotionalSimilarity + relationshipSimilarity + participantSimilarity) / 3
    )
  }

  private determineAction(
    similarityScore: number,
  ): 'skip' | 'merge' | 'review' {
    if (similarityScore > 0.95) return 'skip' // Nearly identical
    if (similarityScore > 0.85) return 'merge' // Similar enough to merge
    return 'review' // Potential hash collision, needs review
  }
}
```

## 🔄 Duplicate Detection System

### Memory Comparison Engine

**Similarity Analysis Components**:

```typescript
interface SimilarityAnalysis {
  overallSimilarity: number
  dimensionalSimilarity: DimensionalSimilarity
  confidenceComparison: ConfidenceComparison
  evidenceOverlap: EvidenceOverlap
  recommendedStrategy: DeduplicationStrategy
}

interface DimensionalSimilarity {
  emotionalThemes: number // How similar are the emotional themes
  relationshipPatterns: number // How similar are relationship dynamics
  participantRoles: number // How similar are participant identifications
  temporalContext: number // How similar are temporal patterns
  sourceOverlap: number // How much do source messages overlap
}

class MemorySimilarityAnalyzer {
  analyzeSimilarity(
    existingMemory: Memory,
    newMemory: Memory,
  ): SimilarityAnalysis {
    const dimensionalSimilarity = this.calculateDimensionalSimilarity(
      existingMemory,
      newMemory,
    )
    const overallSimilarity = this.calculateOverallSimilarity(
      dimensionalSimilarity,
    )

    return {
      overallSimilarity,
      dimensionalSimilarity,
      confidenceComparison: this.compareConfidence(existingMemory, newMemory),
      evidenceOverlap: this.analyzeEvidenceOverlap(existingMemory, newMemory),
      recommendedStrategy: this.determineStrategy(
        overallSimilarity,
        dimensionalSimilarity,
      ),
    }
  }

  private calculateDimensionalSimilarity(
    existing: Memory,
    newMemory: Memory,
  ): DimensionalSimilarity {
    return {
      emotionalThemes: this.compareEmotionalThemes(
        existing.emotionalContext.themes,
        newMemory.emotionalContext.themes,
      ),
      relationshipPatterns: this.compareRelationshipPatterns(
        existing.relationshipDynamics.communicationPatterns,
        newMemory.relationshipDynamics.communicationPatterns,
      ),
      participantRoles: this.compareParticipantRoles(
        existing.participants,
        newMemory.participants,
      ),
      temporalContext: this.compareTemporalContext(existing, newMemory),
      sourceOverlap: this.calculateSourceOverlap(
        existing.sourceMessageIds,
        newMemory.sourceMessageIds,
      ),
    }
  }

  private calculateSourceOverlap(
    existingIds: string[],
    newIds: string[],
  ): number {
    const existingSet = new Set(existingIds)
    const overlap = newIds.filter((id) => existingSet.has(id)).length
    const union = new Set([...existingIds, ...newIds]).size

    return overlap / union // Jaccard similarity
  }

  private compareEmotionalThemes(
    existingThemes: EmotionalTheme[],
    newThemes: EmotionalTheme[],
  ): number {
    const existingThemeNames = new Set(existingThemes.map((t) => t.theme))
    const newThemeNames = new Set(newThemes.map((t) => t.theme))

    const intersection = [...existingThemeNames].filter((theme) =>
      newThemeNames.has(theme),
    ).length
    const union = new Set([...existingThemeNames, ...newThemeNames]).size

    return intersection / union
  }
}
```

### Deduplication Decision Engine

**Strategy Determination**:

```typescript
enum DeduplicationStrategy {
  SKIP_DUPLICATE = 'skip_duplicate', // Nearly identical, skip new memory
  MERGE_MEMORIES = 'merge_memories', // Similar enough to merge
  UPDATE_EXISTING = 'update_existing', // New memory has better quality/confidence
  STORE_BOTH = 'store_both', // Different enough to keep both
  MANUAL_REVIEW = 'manual_review', // Requires human judgment
}

class DeduplicationDecisionEngine {
  determineStrategy(analysis: SimilarityAnalysis): DeduplicationDecision {
    const { overallSimilarity, dimensionalSimilarity, confidenceComparison } =
      analysis

    // Nearly identical memories (>95% similar)
    if (overallSimilarity > 0.95) {
      return this.handleNearIdentical(analysis)
    }

    // Highly similar memories (85-95% similar)
    if (overallSimilarity > 0.85) {
      return this.handleHighSimilarity(analysis)
    }

    // Moderately similar memories (70-85% similar)
    if (overallSimilarity > 0.7) {
      return this.handleModerateSimilarity(analysis)
    }

    // Low similarity - likely different memories
    return {
      strategy: DeduplicationStrategy.STORE_BOTH,
      confidence: 0.9,
      reasoning:
        'Memories are sufficiently different to warrant separate storage',
    }
  }

  private handleNearIdentical(
    analysis: SimilarityAnalysis,
  ): DeduplicationDecision {
    const { confidenceComparison, evidenceOverlap } = analysis

    // If new memory has significantly better confidence, update existing
    if (
      confidenceComparison.newMemoryConfidence >
      confidenceComparison.existingConfidence + 2
    ) {
      return {
        strategy: DeduplicationStrategy.UPDATE_EXISTING,
        confidence: 0.85,
        reasoning: 'New memory has significantly higher confidence score',
      }
    }

    // If evidence quality is better in new memory, merge
    if (
      evidenceOverlap.newEvidenceQuality >
      evidenceOverlap.existingEvidenceQuality
    ) {
      return {
        strategy: DeduplicationStrategy.MERGE_MEMORIES,
        confidence: 0.8,
        reasoning: 'New memory provides higher quality evidence',
      }
    }

    // Otherwise skip duplicate
    return {
      strategy: DeduplicationStrategy.SKIP_DUPLICATE,
      confidence: 0.95,
      reasoning: 'Memory is nearly identical to existing memory',
    }
  }

  private handleHighSimilarity(
    analysis: SimilarityAnalysis,
  ): DeduplicationDecision {
    const { dimensionalSimilarity } = analysis

    // If source overlap is high, likely same core memory with different processing
    if (dimensionalSimilarity.sourceOverlap > 0.8) {
      return {
        strategy: DeduplicationStrategy.MERGE_MEMORIES,
        confidence: 0.75,
        reasoning:
          'High source overlap suggests same core memory with different analysis',
      }
    }

    // If emotional themes are very similar but relationships differ, might be different perspectives
    if (
      dimensionalSimilarity.emotionalThemes > 0.9 &&
      dimensionalSimilarity.relationshipPatterns < 0.7
    ) {
      return {
        strategy: DeduplicationStrategy.MANUAL_REVIEW,
        confidence: 0.6,
        reasoning:
          'Similar emotions but different relationship patterns may indicate different perspectives',
      }
    }

    return {
      strategy: DeduplicationStrategy.MERGE_MEMORIES,
      confidence: 0.7,
      reasoning: 'Memories are similar enough to benefit from merging',
    }
  }
}
```

## 🔄 Memory Merging System

### Content Merging Strategy

**Merge Processing Components**:

```typescript
interface MemoryMergeResult {
  mergedMemory: Memory
  mergeMetadata: MergeMetadata
  qualityImprovement: QualityImprovement
  conflictResolutions: ConflictResolution[]
}

interface MergeMetadata {
  sourceMemories: string[] // IDs of memories that were merged
  mergeStrategy: string // Strategy used for merging
  mergeConfidence: number // Confidence in merge quality
  mergedAt: Date // When merge occurred
  mergedBy: string // System/user that performed merge
  preservedElements: string[] // What was preserved from each source
  conflictsResolved: number // Number of conflicts resolved
}

class MemoryMerger {
  async mergeMemories(
    existingMemory: Memory,
    newMemory: Memory,
  ): Promise<MemoryMergeResult> {
    const conflictResolutions: ConflictResolution[] = []

    // Merge emotional context with conflict resolution
    const mergedEmotionalContext = await this.mergeEmotionalContext(
      existingMemory.emotionalContext,
      newMemory.emotionalContext,
      conflictResolutions,
    )

    // Merge relationship dynamics
    const mergedRelationshipDynamics = await this.mergeRelationshipDynamics(
      existingMemory.relationshipDynamics,
      newMemory.relationshipDynamics,
      conflictResolutions,
    )

    // Combine and deduplicate participants
    const mergedParticipants = this.mergeParticipants(
      existingMemory.participants,
      newMemory.participants,
    )

    // Combine source message IDs
    const mergedSourceIds = [
      ...new Set([
        ...existingMemory.sourceMessageIds,
        ...newMemory.sourceMessageIds,
      ]),
    ].sort()

    // Calculate merged confidence
    const mergedConfidence = this.calculateMergedConfidence(
      existingMemory,
      newMemory,
    )

    // Create merged summary
    const mergedSummary = this.mergeSummaries(
      existingMemory.summary,
      newMemory.summary,
    )

    const mergedMemory: Memory = {
      ...existingMemory,
      sourceMessageIds: mergedSourceIds,
      participants: mergedParticipants,
      emotionalContext: mergedEmotionalContext,
      relationshipDynamics: mergedRelationshipDynamics,
      summary: mergedSummary,
      confidence: mergedConfidence,
      extractedAt: new Date(), // Update extraction time
      metadata: {
        ...existingMemory.metadata,
        processing: {
          ...existingMemory.metadata.processing,
          mergeHistory: [
            ...(existingMemory.metadata.processing.mergeHistory || []),
            {
              mergedMemoryId: newMemory.id,
              mergedAt: new Date(),
              mergeStrategy: 'content_based',
              conflictsResolved: conflictResolutions.length,
            },
          ],
        },
      },
    }

    return {
      mergedMemory,
      mergeMetadata: {
        sourceMemories: [existingMemory.id, newMemory.id],
        mergeStrategy: 'content_based_intelligent',
        mergeConfidence: this.calculateMergeConfidence(conflictResolutions),
        mergedAt: new Date(),
        mergedBy: 'system_auto',
        preservedElements: this.identifyPreservedElements(
          existingMemory,
          newMemory,
        ),
        conflictsResolved: conflictResolutions.length,
      },
      qualityImprovement: this.assessQualityImprovement(
        existingMemory,
        mergedMemory,
      ),
      conflictResolutions,
    }
  }

  private async mergeEmotionalContext(
    existing: EmotionalContext,
    newContext: EmotionalContext,
    conflicts: ConflictResolution[],
  ): Promise<EmotionalContext> {
    // Merge themes with relevance-based priority
    const mergedThemes = this.mergeEmotionalThemes(
      existing.themes,
      newContext.themes,
      conflicts,
    )

    // Resolve mood conflicts
    const mergedMood = this.resolveMoodConflict(
      existing.primaryMood,
      newContext.primaryMood,
      conflicts,
    )

    // Average intensity with confidence weighting
    const mergedIntensity = this.mergeIntensity(
      existing.intensity,
      newContext.intensity,
    )

    return {
      ...existing,
      primaryMood: mergedMood,
      intensity: mergedIntensity,
      themes: mergedThemes,
      emotionalMarkers: this.mergeEmotionalMarkers(
        existing.emotionalMarkers,
        newContext.emotionalMarkers,
      ),
      temporalPatterns: this.mergeTemporalPatterns(
        existing.temporalPatterns,
        newContext.temporalPatterns,
      ),
    }
  }

  private mergeEmotionalThemes(
    existingThemes: EmotionalTheme[],
    newThemes: EmotionalTheme[],
    conflicts: ConflictResolution[],
  ): EmotionalTheme[] {
    const themeMap = new Map<string, EmotionalTheme>()

    // Add existing themes
    existingThemes.forEach((theme) => {
      themeMap.set(theme.theme, theme)
    })

    // Merge or add new themes
    newThemes.forEach((newTheme) => {
      const existing = themeMap.get(newTheme.theme)

      if (existing) {
        // Merge themes with same name
        const mergedTheme: EmotionalTheme = {
          theme: newTheme.theme,
          relevance: Math.max(existing.relevance, newTheme.relevance), // Take higher relevance
          evidence: [...new Set([...existing.evidence, ...newTheme.evidence])], // Combine evidence
          participants: [
            ...new Set([...existing.participants, ...newTheme.participants]),
          ],
          temporalSpan: this.mergeTemporalSpans(
            existing.temporalSpan,
            newTheme.temporalSpan,
          ),
        }

        themeMap.set(newTheme.theme, mergedTheme)

        if (Math.abs(existing.relevance - newTheme.relevance) > 2) {
          conflicts.push({
            type: 'theme_relevance_conflict',
            field: `themes.${newTheme.theme}.relevance`,
            existingValue: existing.relevance,
            newValue: newTheme.relevance,
            resolvedValue: mergedTheme.relevance,
            resolution: 'took_higher_value',
          })
        }
      } else {
        // Add new theme
        themeMap.set(newTheme.theme, newTheme)
      }
    })

    return Array.from(themeMap.values())
  }
}
```

## 📊 Schema Integration

### Database Schema Updates

**Deduplication Fields for Memory Table**:

```sql
-- Add deduplication fields to Memory table
ALTER TABLE Memory ADD COLUMN contentHash TEXT UNIQUE;
ALTER TABLE Memory ADD COLUMN sourceHash TEXT; -- Hash of source message IDs
ALTER TABLE Memory ADD COLUMN semanticHash TEXT; -- Hash of semantic content only
ALTER TABLE Memory ADD COLUMN mergeHistory TEXT; -- JSON array of merge operations
ALTER TABLE Memory ADD COLUMN duplicateChecksum TEXT; -- Checksum for fast duplicate detection

-- Index for fast duplicate detection
CREATE INDEX idx_memory_content_hash ON Memory(contentHash);
CREATE INDEX idx_memory_source_hash ON Memory(sourceHash);
CREATE INDEX idx_memory_semantic_hash ON Memory(semanticHash);
```

**Memory Deduplication Metadata Schema**:

```typescript
interface ProcessingMetadata {
  // ... existing fields
  deduplication: DeduplicationMetadata
  mergeHistory?: MergeOperation[]
}

interface DeduplicationMetadata {
  contentHash: string // Primary content hash for deduplication
  sourceHash: string // Hash based only on source message IDs
  semanticHash: string // Hash based only on semantic content
  duplicateChecksum: string // Fast checksum for initial duplicate filtering
  hashingVersion: string // Version of hashing algorithm used
  hashingTimestamp: Date // When hash was calculated
  collisionChecked: boolean // Whether hash collision was verified
  similarityAnalyzed?: boolean // Whether similarity analysis was performed
}

interface MergeOperation {
  mergeId: string // Unique identifier for this merge
  mergedMemoryId: string // ID of memory that was merged in
  mergedAt: Date // When merge occurred
  mergeStrategy: string // Strategy used (content_based, manual, etc.)
  mergeConfidence: number // Confidence in merge quality (1-10)
  conflictsResolved: number // Number of conflicts that were resolved
  qualityImprovement: number // Quality improvement from merge (-10 to +10)
  mergedBy: string // Who/what performed the merge (system_auto, user_id, etc.)
  preservedFields: string[] // Which fields were preserved from original
  enhancedFields: string[] // Which fields were enhanced by merge
}
```

### API Integration

**Deduplication API Extensions**:

```typescript
interface MemoryProcessingAPI {
  // ... existing methods

  // Deduplication-specific methods
  checkForDuplicates(memory: Memory): Promise<DuplicationCheck>
  findSimilarMemories(
    memory: Memory,
    threshold?: number,
  ): Promise<SimilarMemory[]>
  mergeMemories(
    existingId: string,
    newMemory: Memory,
  ): Promise<MemoryMergeResult>
  getDeduplicationStats(): Promise<DeduplicationStats>

  // Batch processing with deduplication
  processBatchWithDeduplication(
    messages: Message[],
    options: ProcessingOptions & DeduplicationOptions,
  ): Promise<ProcessingResult>
}

interface DeduplicationOptions {
  enableDeduplication: boolean
  duplicateThreshold: number // Similarity threshold for duplicates (0-1)
  autoMergeThreshold: number // Threshold for automatic merging (0-1)
  maxSimilarityChecks: number // Limit similarity checks for performance
  preserveOriginals: boolean // Keep original memories when merging
}

interface DuplicationCheck {
  isDuplicate: boolean
  existingMemoryId?: string
  similarity: number
  recommendedAction: DeduplicationStrategy
  confidence: number
  similarMemories: SimilarMemory[]
}

interface SimilarMemory {
  memoryId: string
  similarity: number
  overlapAreas: string[] // Which areas overlap (emotions, relationships, etc.)
  conflicts: string[] // Areas where memories conflict
  mergeRecommendation: string // Recommendation for handling similarity
}
```

## 🚨 Edge Cases & Conflict Resolution

### Complex Conflict Scenarios

**Handling Contradictory Memories**:

```typescript
enum ConflictType {
  EMOTIONAL_CONTRADICTION = 'emotional_contradiction', // Different emotional assessments
  RELATIONSHIP_CONFLICT = 'relationship_conflict', // Different relationship dynamics
  PARTICIPANT_MISMATCH = 'participant_mismatch', // Different participant identification
  TEMPORAL_INCONSISTENCY = 'temporal_inconsistency', // Conflicting temporal patterns
  CONFIDENCE_DISPARITY = 'confidence_disparity', // Major confidence differences
}

interface ConflictResolution {
  type: ConflictType
  field: string // Specific field with conflict
  existingValue: any // Value from existing memory
  newValue: any // Value from new memory
  resolvedValue: any // Final resolved value
  resolution: ConflictResolutionStrategy
  confidence: number // Confidence in resolution (1-10)
  reasoning: string // Why this resolution was chosen
  requiresReview?: boolean // Whether human review is recommended
}

enum ConflictResolutionStrategy {
  TAKE_HIGHER_CONFIDENCE = 'take_higher_confidence',
  TAKE_MORE_RECENT = 'take_more_recent',
  MERGE_VALUES = 'merge_values',
  TAKE_MORE_EVIDENCE = 'take_more_evidence',
  MANUAL_REVIEW = 'manual_review',
  STATISTICAL_AVERAGE = 'statistical_average',
}

class ConflictResolver {
  resolveEmotionalContradiction(
    existing: EmotionalContext,
    newContext: EmotionalContext,
    existingConfidence: number,
    newConfidence: number,
  ): ConflictResolution {
    // If confidence difference is significant, trust higher confidence
    if (Math.abs(existingConfidence - newConfidence) > 3) {
      const useNew = newConfidence > existingConfidence
      return {
        type: ConflictType.EMOTIONAL_CONTRADICTION,
        field: 'emotionalContext.primaryMood',
        existingValue: existing.primaryMood,
        newValue: newContext.primaryMood,
        resolvedValue: useNew ? newContext.primaryMood : existing.primaryMood,
        resolution: ConflictResolutionStrategy.TAKE_HIGHER_CONFIDENCE,
        confidence: Math.max(existingConfidence, newConfidence),
        reasoning: `Selected emotion from memory with higher confidence (${Math.max(existingConfidence, newConfidence)})`,
      }
    }

    // If both have similar confidence, check evidence quality
    const existingEvidence = existing.themes.reduce(
      (sum, theme) => sum + theme.evidence.length,
      0,
    )
    const newEvidence = newContext.themes.reduce(
      (sum, theme) => sum + theme.evidence.length,
      0,
    )

    if (newEvidence > existingEvidence * 1.5) {
      return {
        type: ConflictType.EMOTIONAL_CONTRADICTION,
        field: 'emotionalContext.primaryMood',
        existingValue: existing.primaryMood,
        newValue: newContext.primaryMood,
        resolvedValue: newContext.primaryMood,
        resolution: ConflictResolutionStrategy.TAKE_MORE_EVIDENCE,
        confidence: 7,
        reasoning: `Selected emotion supported by more evidence (${newEvidence} vs ${existingEvidence} pieces)`,
      }
    }

    // If can't resolve automatically, flag for review
    return {
      type: ConflictType.EMOTIONAL_CONTRADICTION,
      field: 'emotionalContext.primaryMood',
      existingValue: existing.primaryMood,
      newValue: newContext.primaryMood,
      resolvedValue: existing.primaryMood, // Default to existing
      resolution: ConflictResolutionStrategy.MANUAL_REVIEW,
      confidence: 3,
      reasoning:
        'Conflicting emotional assessments with similar confidence require manual review',
      requiresReview: true,
    }
  }
}
```

## 📈 Performance Optimization

### Efficient Duplicate Detection

**Performance Optimization Strategies**:

```typescript
class DeduplicationPerformanceOptimizer {
  private hashCache = new Map<string, string>()
  private similarityCache = new Map<string, SimilarityAnalysis>()

  async optimizedDuplicateCheck(memory: Memory): Promise<DuplicationCheck> {
    // Fast path: Check simple checksums first
    const quickChecksum = this.calculateQuickChecksum(memory)
    const candidateMemories = await this.findCandidatesByChecksum(quickChecksum)

    if (candidateMemories.length === 0) {
      return {
        isDuplicate: false,
        similarity: 0,
        recommendedAction: DeduplicationStrategy.STORE_BOTH,
        confidence: 0.95,
        similarMemories: [],
      }
    }

    // Medium path: Check content hashes
    const contentHash = await this.getCachedContentHash(memory)
    const exactMatch = candidateMemories.find(
      (m) => m.contentHash === contentHash,
    )

    if (exactMatch) {
      return {
        isDuplicate: true,
        existingMemoryId: exactMatch.id,
        similarity: 1.0,
        recommendedAction: DeduplicationStrategy.SKIP_DUPLICATE,
        confidence: 0.98,
        similarMemories: [],
      }
    }

    // Slow path: Detailed similarity analysis only for remaining candidates
    const similarityResults = await Promise.all(
      candidateMemories.slice(0, 5).map(
        (
          candidate, // Limit to top 5 candidates
        ) => this.getCachedSimilarityAnalysis(memory, candidate),
      ),
    )

    const bestMatch = similarityResults.reduce((best, current) =>
      current.overallSimilarity > best.overallSimilarity ? current : best,
    )

    return this.convertSimilarityToDuplicationCheck(bestMatch)
  }

  private calculateQuickChecksum(memory: Memory): string {
    // Very fast checksum based on basic properties
    const quickData = [
      memory.sourceMessageIds.length.toString(),
      memory.participants.length.toString(),
      memory.emotionalContext.primaryMood,
      memory.emotionalContext.intensity.toString(),
    ].join('|')

    return createHash('md5').update(quickData).digest('hex').substring(0, 8)
  }

  private async getCachedContentHash(memory: Memory): Promise<string> {
    const cacheKey = `${memory.id}_content_hash`

    if (this.hashCache.has(cacheKey)) {
      return this.hashCache.get(cacheKey)!
    }

    const hasher = new MemoryContentHasher()
    const hash = hasher.generateContentHash(memory)

    this.hashCache.set(cacheKey, hash)
    return hash
  }

  private async findCandidatesByChecksum(checksum: string): Promise<Memory[]> {
    // Database query optimized for checksum-based candidate finding
    return await this.prisma.memory.findMany({
      where: {
        duplicateChecksum: checksum,
      },
      take: 10, // Limit candidate count for performance
      orderBy: {
        extractedAt: 'desc', // Check most recent first
      },
    })
  }
}
```

## 🎯 Implementation Roadmap

### Phase 1: Core Deduplication (Week 1-2)

**Foundation Components**:

- Implement `MemoryContentHasher` with stable hash generation
- Create `DuplicationCheck` API for memory comparison
- Add database schema fields for content hashing
- Implement basic duplicate detection in memory processing pipeline

**Deliverables**:

- Content-based hashing system
- Database schema updates
- Basic duplicate skip functionality
- Performance benchmarks for hash calculation

### Phase 2: Similarity Analysis (Week 3-4)

**Advanced Comparison**:

- Implement `MemorySimilarityAnalyzer` for detailed comparison
- Create `ConflictResolver` for handling contradictions
- Add similarity threshold configuration
- Implement confidence-based conflict resolution

**Deliverables**:

- Similarity analysis system
- Conflict resolution engine
- Configurable similarity thresholds
- Automated conflict resolution strategies

### Phase 3: Memory Merging (Week 5-6)

**Intelligent Merging**:

- Implement `MemoryMerger` for content combination
- Create merge quality assessment
- Add merge history tracking
- Implement rollback capabilities for merge operations

**Deliverables**:

- Automated memory merging system
- Merge quality metrics
- Audit trail for merge operations
- Merge rollback functionality

### Phase 4: Performance Optimization (Week 7-8)

**Production Readiness**:

- Implement caching strategies for hash calculation
- Add batch deduplication processing
- Create performance monitoring
- Optimize database queries for duplicate detection

**Deliverables**:

- Optimized performance for large-scale processing
- Comprehensive monitoring and metrics
- Batch processing optimizations
- Production deployment readiness

---

**Implementation Status**: 📋 **Design Complete** - Comprehensive deduplication strategy documented, ready for implementation across memory processing pipeline.

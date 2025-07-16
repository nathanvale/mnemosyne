---
id: memory-schema-design
title: Design - Memory Schema Definition
---

# 🏗️ Design: Memory Schema Definition

## 🎯 Overview

The Memory Schema Definition provides the comprehensive TypeScript type system and data structures that enable consistent emotional intelligence storage, processing, and validation across the Mnemosyne system. The schema design balances psychological accuracy with practical AI integration needs, creating a foundation that preserves the richness of human emotional context while enabling efficient computational processing.

**Key Design Principles**:

- **Psychological Accuracy**: Schema structures reflect genuine emotional and relationship dynamics
- **Computational Efficiency**: Data structures optimized for AI processing and database storage
- **Type Safety**: Comprehensive TypeScript coverage preventing runtime errors
- **Extensibility**: Schema design supporting future advanced emotional intelligence features

**Integration Strategy**: The schema serves as the central contract between memory processing, domain-specific validation UI components, and Claude integration, ensuring consistent data flow and enabling reliable system integration. The schema supports progressive development workflow (Storybook → Next.js → Production) for validation interfaces.

## 🏛️ Schema Architecture

### Core Memory Structure

**Primary Memory Interface**:

```typescript
interface Memory {
  id: string // Unique memory identifier
  sourceMessageIds: string[] // Messages that contributed to this memory
  participants: Participant[] // People involved in the memory
  emotionalContext: EmotionalContext // Emotional analysis and themes
  relationshipDynamics: RelationshipDynamics // Relationship patterns and dynamics
  summary: string // Human-readable memory summary
  confidence: number // Extraction confidence (1-10)
  extractedAt: Date // When memory was created
  validationStatus: ValidationStatus // Validation workflow state
  qualityMetrics?: QualityMetrics // Quality assessment results
  metadata: MemoryMetadata // Processing and system metadata
}
```

**Participant Definition**:

```typescript
interface Participant {
  id: string // Participant identifier
  name: string // Display name
  role: ParticipantRole // Role in the conversation
  emotionalState: EmotionalState // Participant's emotional state
  relationshipToOthers: RelationshipMapping[] // Relationships with other participants
}

type ParticipantRole =
  | 'primary' // Main participant (usually message sender)
  | 'secondary' // Secondary participant (message recipient)
  | 'mentioned' // Person mentioned in conversation
  | 'observer' // Silent participant or lurker

interface EmotionalState {
  dominantEmotion: EmotionType
  intensity: number // 1-10 scale
  confidence: number // How confident we are in this assessment
  indicators: string[] // Textual indicators that led to this assessment
}
```

### Emotional Context Schema

**Emotional Context Structure**:

```typescript
interface EmotionalContext {
  primaryMood: MoodType // Overall emotional tone
  intensity: IntensityScore // Emotional intensity level
  complexity: EmotionalComplexity // Simple vs. complex emotional state
  themes: EmotionalTheme[] // Key emotional themes
  emotionalMarkers: EmotionalMarker[] // Specific emotional indicators
  contextualEvents: ContextualEvent[] // Events that shaped emotional context
  temporalPatterns: TemporalPattern[] // Emotional progression over time
  emotionalProgression: EmotionalProgression // How emotions evolved
}

type MoodType =
  | 'positive' // Generally positive emotional tone
  | 'negative' // Generally negative emotional tone
  | 'neutral' // Balanced or neutral emotional tone
  | 'mixed' // Complex mix of positive and negative
  | 'ambiguous' // Unclear or conflicting emotional signals

type IntensityScore = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10

interface EmotionalComplexity {
  level: 'simple' | 'moderate' | 'complex'
  factors: string[] // What makes this emotionally complex
  conflictingEmotions: boolean // Are there conflicting emotions?
  emotionalNuance: number // 1-10 scale of emotional subtlety
}
```

**Emotional Themes & Markers**:

```typescript
interface EmotionalTheme {
  theme: string // Theme name (e.g., 'support', 'frustration', 'joy')
  relevance: number // How relevant this theme is (1-10)
  evidence: string[] // Text evidence supporting this theme
  participants: string[] // Which participants this theme applies to
  temporalSpan: TemporalSpan // When this theme was present
}

interface EmotionalMarker {
  type: EmotionalMarkerType
  text: string // Actual text that indicates this emotion
  emotion: EmotionType
  intensity: number // 1-10 scale
  participant: string // Who expressed this emotion
  timestamp: Date // When this marker occurred
  confidence: number // How confident we are in this marker
}

type EmotionalMarkerType =
  | 'explicit' // Direct emotional expression ("I'm so happy")
  | 'implicit' // Implied emotional content ("This is the worst")
  | 'contextual' // Emotional context from situation
  | 'linguistic' // Emotional indicators from language patterns
  | 'behavioral' // Emotional indicators from behavior patterns
```

### Relationship Dynamics Schema

**Relationship Dynamics Structure**:

```typescript
interface RelationshipDynamics {
  overallDynamics: OverallRelationshipDynamics
  participantDynamics: ParticipantDynamics[]
  communicationPatterns: CommunicationPattern[]
  relationshipPatterns: RelationshipPattern[]
  interactionQuality: InteractionQuality
  relationshipEvolution: RelationshipEvolution
}

interface OverallRelationshipDynamics {
  closeness: RelationshipScore // How close participants are (1-10)
  tension: RelationshipScore // Level of tension or conflict (1-10)
  supportiveness: RelationshipScore // How supportive the relationship is (1-10)
  formality: RelationshipScore // How formal the interaction is (1-10)
  balance: RelationshipScore // How balanced the relationship is (1-10)
}

type RelationshipScore = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10

interface ParticipantDynamics {
  participant: string
  roleInConversation: ConversationRole
  emotionalContribution: EmotionalContribution
  communicationStyle: CommunicationStyle
  relationshipInitiative: RelationshipInitiative
}

type ConversationRole =
  | 'leader' // Leads conversation direction
  | 'supporter' // Provides support and encouragement
  | 'mediator' // Helps resolve conflicts or tensions
  | 'follower' // Follows others' lead
  | 'challenger' // Challenges ideas or creates tension
  | 'observer' // Participates minimally
```

**Communication & Interaction Patterns**:

```typescript
interface CommunicationPattern {
  pattern: CommunicationPatternType
  frequency: number // How often this pattern occurs
  effectiveness: number // How well this pattern works (1-10)
  participants: string[] // Who engages in this pattern
  examples: string[] // Specific examples of this pattern
  emotionalImpact: EmotionalImpact
}

type CommunicationPatternType =
  | 'collaborative' // Working together toward common goals
  | 'supportive' // Providing emotional support
  | 'competitive' // Competing or one-upping
  | 'conflictual' // Engaging in conflict or disagreement
  | 'playful' // Engaging in humor or playfulness
  | 'directive' // Giving direction or instructions
  | 'questioning' // Asking questions or seeking clarification

interface InteractionQuality {
  overallQuality: number // 1-10 scale of interaction quality
  authenticity: number // How authentic the interaction feels
  engagement: number // How engaged participants are
  emotional_safety: number // How emotionally safe the interaction is
  mutual_understanding: number // How well participants understand each other
  conflict_resolution: number // How well conflicts are resolved
}
```

### Validation & Quality Schema

**Validation Status & Workflow**:

```typescript
interface ValidationStatus {
  status: ValidationState
  validator?: string // Who validated this memory
  validatedAt?: Date // When validation occurred
  validationRound: number // Which round of validation this is
  requiresRefinement: boolean // Whether memory needs refinement
  refinementSuggestions: RefinementSuggestion[]
  approvalHistory: ApprovalHistory[]
}

type ValidationState =
  | 'pending' // Awaiting validation
  | 'in_review' // Currently being reviewed
  | 'approved' // Approved by validator
  | 'rejected' // Rejected by validator
  | 'needs_refinement' // Needs improvement before approval
  | 'refined' // Has been refined, awaiting re-validation

interface RefinementSuggestion {
  id: string
  type: RefinementType
  description: string
  priority: 'low' | 'medium' | 'high'
  targetField: string // Which field needs refinement
  suggestedValue?: any // Suggested replacement value
  reasoning: string // Why this refinement is needed
  suggestedBy: string // Who suggested this refinement
  suggestedAt: Date
  status: 'pending' | 'applied' | 'rejected'
}

type RefinementType =
  | 'emotional_accuracy' // Emotional context needs correction
  | 'relationship_dynamics' // Relationship assessment needs adjustment
  | 'participant_identification' // Participant roles or identification issues
  | 'confidence_adjustment' // Confidence score needs adjustment
  | 'summary_clarity' // Summary needs to be clearer
  | 'evidence_support' // Need more evidence for claims
```

**Quality Metrics Schema**:

```typescript
interface QualityMetrics {
  overallQuality: number // Composite quality score (1-10)
  dimensionalQuality: DimensionalQuality // Quality across different dimensions
  confidenceAlignment: number // How well confidence aligns with quality
  validationConsistency: number // Consistency across validators
  evidenceSupport: number // How well evidence supports conclusions
  calculatedAt: Date
  calculationMethod: string
}

interface DimensionalQuality {
  emotionalAccuracy: number // How accurate the emotional analysis is
  relationshipRelevance: number // How relevant relationship dynamics are
  contextualDepth: number // How deep the contextual understanding is
  participantIdentification: number // How well participants are identified
  temporalCoherence: number // How well temporal patterns are captured
  summaryClarity: number // How clear and useful the summary is
}

interface ValidationResult {
  memoryId: string
  validator: string
  validatedAt: Date
  qualityAssessment: QualityAssessment
  feedback: ValidationFeedback
  decision: ValidationDecision
  timeSpent: number // Minutes spent on validation
  confidence: number // Validator's confidence in assessment
}

interface QualityAssessment {
  scores: DimensionalQuality
  overallAssessment: string
  strengths: string[]
  weaknesses: string[]
  improvementAreas: string[]
}
```

### Processing & Metadata Schema

**Processing Metadata**:

```typescript
interface MemoryMetadata {
  processing: ProcessingMetadata
  validation: ValidationMetadata
  system: SystemMetadata
  relationships: RelationshipMetadata
}

interface ProcessingMetadata {
  batchId: string // Which batch this memory came from
  processingVersion: string // Version of processing system used
  claudeModel: string // Which Claude model was used
  promptVersion: string // Version of prompts used
  processingTime: number // Time taken to process (seconds)
  tokenUsage: TokenUsage // Claude API token usage
  processingCost: number // Cost of processing this memory
  errorHistory: ProcessingError[] // Any errors encountered
  retryCount: number // How many times processing was retried
}

interface TokenUsage {
  inputTokens: number
  outputTokens: number
  totalTokens: number
  estimatedCost: number
}

interface ValidationMetadata {
  validationRounds: number // How many validation rounds occurred
  totalValidationTime: number // Total time spent on validation
  validatorConsensus: number // Agreement between validators (if multiple)
  refinementCycles: number // How many refinement cycles occurred
  qualityProgression: QualityProgression // How quality improved over time
}

interface SystemMetadata {
  createdAt: Date
  updatedAt: Date
  version: string // Schema version used
  sourceSystem: string // System that created this memory
  migrationHistory: MigrationRecord[] // Schema migration history
  accessHistory: AccessRecord[] // Who accessed this memory when
}
```

### Temporal & Contextual Schema

**Temporal Context**:

```typescript
interface TemporalPattern {
  pattern: TemporalPatternType
  timespan: TemporalSpan
  progression: EmotionalProgression
  significance: number // How significant this pattern is
  evidence: TemporalEvidence[]
}

type TemporalPatternType =
  | 'escalation' // Emotions or tension escalating
  | 'de_escalation' // Emotions or tension decreasing
  | 'cyclical' // Repeating emotional patterns
  | 'breakthrough' // Sudden emotional breakthrough or resolution
  | 'sustained' // Consistent emotional state over time
  | 'volatile' // Rapid emotional changes

interface TemporalSpan {
  startTime: Date
  endTime: Date
  duration: number // Duration in minutes
  messageSpan: number // Number of messages in this span
}

interface EmotionalProgression {
  startingEmotion: EmotionType
  endingEmotion: EmotionType
  progressionType: ProgressionType
  keyTransitions: EmotionalTransition[]
  overallDirection: 'positive' | 'negative' | 'neutral' | 'cyclical'
}

type ProgressionType =
  | 'linear' // Steady progression
  | 'exponential' // Accelerating change
  | 'step_function' // Sudden changes
  | 'oscillating' // Back and forth changes
  | 'plateau' // Periods of stability with sudden changes
```

**Contextual Events**:

```typescript
interface ContextualEvent {
  type: EventType
  description: string
  significance: number // How significant this event is (1-10)
  emotionalImpact: EmotionalImpact
  participants: string[]
  timestamp: Date
  evidence: string[] // Messages or text that support this event
  consequences: EventConsequence[]
}

type EventType =
  | 'revelation' // Important information revealed
  | 'conflict' // Disagreement or argument
  | 'resolution' // Problem or conflict resolved
  | 'support' // Emotional support provided
  | 'celebration' // Something positive celebrated
  | 'crisis' // Emergency or crisis situation
  | 'transition' // Change in relationship or situation
  | 'milestone' // Important relationship or personal milestone

interface EmotionalImpact {
  impactType: 'positive' | 'negative' | 'neutral' | 'mixed'
  intensity: number // 1-10 scale
  duration: 'momentary' | 'short' | 'medium' | 'long' | 'permanent'
  participants: ParticipantImpact[]
}

interface ParticipantImpact {
  participant: string
  impactType: 'positive' | 'negative' | 'neutral' | 'mixed'
  intensity: number
  emotionalChange: EmotionalChange
}
```

## 🔄 Type Safety & Validation

### Runtime Type Guards

```typescript
// Type guard functions for runtime validation
export function isMemory(obj: any): obj is Memory {
  return (
    obj &&
    typeof obj.id === 'string' &&
    Array.isArray(obj.sourceMessageIds) &&
    Array.isArray(obj.participants) &&
    isEmotionalContext(obj.emotionalContext) &&
    isRelationshipDynamics(obj.relationshipDynamics) &&
    typeof obj.summary === 'string' &&
    typeof obj.confidence === 'number' &&
    obj.confidence >= 1 &&
    obj.confidence <= 10 &&
    obj.extractedAt instanceof Date
  )
}

export function isEmotionalContext(obj: any): obj is EmotionalContext {
  return (
    obj &&
    ['positive', 'negative', 'neutral', 'mixed', 'ambiguous'].includes(
      obj.primaryMood,
    ) &&
    typeof obj.intensity === 'number' &&
    obj.intensity >= 1 &&
    obj.intensity <= 10 &&
    Array.isArray(obj.themes) &&
    Array.isArray(obj.emotionalMarkers)
  )
}

export function isRelationshipDynamics(obj: any): obj is RelationshipDynamics {
  return (
    obj &&
    obj.overallDynamics &&
    typeof obj.overallDynamics.closeness === 'number' &&
    typeof obj.overallDynamics.tension === 'number' &&
    typeof obj.overallDynamics.supportiveness === 'number' &&
    Array.isArray(obj.participantDynamics) &&
    Array.isArray(obj.communicationPatterns)
  )
}
```

### Schema Validation Utilities

```typescript
// Schema validation with detailed error reporting
export interface ValidationError {
  field: string
  message: string
  value: any
  expectedType: string
}

export interface ValidationResult {
  isValid: boolean
  errors: ValidationError[]
  warnings: ValidationError[]
}

export function validateMemory(memory: any): ValidationResult {
  const errors: ValidationError[] = []
  const warnings: ValidationError[] = []

  // Validate required fields
  if (!memory.id || typeof memory.id !== 'string') {
    errors.push({
      field: 'id',
      message: 'Memory ID is required and must be a string',
      value: memory.id,
      expectedType: 'string',
    })
  }

  if (
    !memory.confidence ||
    typeof memory.confidence !== 'number' ||
    memory.confidence < 1 ||
    memory.confidence > 10
  ) {
    errors.push({
      field: 'confidence',
      message: 'Confidence must be a number between 1 and 10',
      value: memory.confidence,
      expectedType: 'number (1-10)',
    })
  }

  // Validate emotional context
  if (!isEmotionalContext(memory.emotionalContext)) {
    errors.push({
      field: 'emotionalContext',
      message: 'Invalid emotional context structure',
      value: memory.emotionalContext,
      expectedType: 'EmotionalContext',
    })
  }

  // Validate relationship dynamics
  if (!isRelationshipDynamics(memory.relationshipDynamics)) {
    errors.push({
      field: 'relationshipDynamics',
      message: 'Invalid relationship dynamics structure',
      value: memory.relationshipDynamics,
      expectedType: 'RelationshipDynamics',
    })
  }

  // Add warnings for quality issues
  if (memory.confidence && memory.confidence < 5) {
    warnings.push({
      field: 'confidence',
      message: 'Low confidence score may indicate quality issues',
      value: memory.confidence,
      expectedType: 'number (>= 5 recommended)',
    })
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
  }
}
```

## 🔄 Data Transformation

### Schema Transformation Utilities

```typescript
// Transform between different schema versions
export function transformMemoryToV2(v1Memory: MemoryV1): Memory {
  return {
    ...v1Memory,
    emotionalContext: {
      ...v1Memory.emotionalContext,
      complexity: inferEmotionalComplexity(v1Memory.emotionalContext),
      temporalPatterns: extractTemporalPatterns(v1Memory.emotionalContext),
      emotionalProgression: analyzeEmotionalProgression(
        v1Memory.emotionalContext,
      ),
    },
    relationshipDynamics: {
      ...v1Memory.relationshipDynamics,
      interactionQuality: calculateInteractionQuality(
        v1Memory.relationshipDynamics,
      ),
      relationshipEvolution: analyzeRelationshipEvolution(
        v1Memory.relationshipDynamics,
      ),
    },
    metadata: {
      ...v1Memory.metadata,
      version: '2.0',
      migrationHistory: [
        ...v1Memory.metadata.migrationHistory,
        {
          fromVersion: '1.0',
          toVersion: '2.0',
          migratedAt: new Date(),
          changes: ['Added emotional complexity', 'Added interaction quality'],
        },
      ],
    },
  }
}

// Transform memory for external consumption
export function transformMemoryForExport(memory: Memory): ExportMemory {
  return {
    id: memory.id,
    summary: memory.summary,
    participants: memory.participants.map((p) => p.name),
    emotions: memory.emotionalContext.themes.map((t) => t.theme),
    mood: memory.emotionalContext.primaryMood,
    intensity: memory.emotionalContext.intensity,
    relationship_closeness:
      memory.relationshipDynamics.overallDynamics.closeness,
    relationship_supportiveness:
      memory.relationshipDynamics.overallDynamics.supportiveness,
    confidence: memory.confidence,
    extracted_at: memory.extractedAt.toISOString(),
    validated: memory.validationStatus.status === 'approved',
  }
}
```

## 🎯 Implementation Strategy

### Package Structure

```
@studio/schema/
├── src/
│   ├── memory/
│   │   ├── core-memory.ts           # Core Memory interface
│   │   ├── emotional-context.ts     # Emotional context types
│   │   ├── relationship-dynamics.ts # Relationship dynamics types
│   │   └── participants.ts          # Participant types
│   ├── validation/
│   │   ├── validation-types.ts      # Validation workflow types
│   │   ├── quality-metrics.ts       # Quality assessment types
│   │   └── refinement.ts           # Refinement suggestion types
│   ├── processing/
│   │   ├── batch-processing.ts      # Batch processing types
│   │   ├── metadata.ts             # Processing metadata types
│   │   └── temporal.ts             # Temporal pattern types
│   ├── utils/
│   │   ├── type-guards.ts          # Runtime type validation
│   │   ├── schema-validation.ts    # Schema validation utilities
│   │   ├── transformations.ts      # Data transformation functions
│   │   └── constants.ts           # Schema constants and enums
│   └── index.ts                    # Main exports
├── package.json
└── tsconfig.json
```

### Development Workflow

```typescript
// Example usage in memory processing
import { Memory, EmotionalContext, validateMemory } from '@studio/schema'

export async function processMemoryBatch(messages: Message[]): Promise<Memory[]> {
  const memories: Memory[] = []

  for (const messageGroup of groupMessages(messages)) {
    const memory = await extractMemoryFromMessages(messageGroup)

    // Validate schema compliance
    const validation = validateMemory(memory)
    if (!validation.isValid) {
      throw new Error(`Invalid memory schema: ${validation.errors.map(e => e.message).join(', ')}`)
    }

    // Handle warnings
    if (validation.warnings.length > 0) {
      logger.warn('Memory validation warnings:', validation.warnings)
    }

    memories.push(memory)
  }

  return memories
}

// Example usage in domain-specific validation UI
import { Memory, ValidationResult, QualityMetrics } from '@studio/schema'

export function MemoryValidationPreview({ memory }: { memory: Memory }) {
  // Progressive development: Start in Storybook, then Next.js, then Production
  // This component lives in @studio/validation, not @studio/ui
  return (
    <div className="domain-specific-memory-validation">
      <EmotionalContextDisplay context={memory.emotionalContext} />
      <RelationshipDynamicsDisplay dynamics={memory.relationshipDynamics} />
      <QualityMetricsInterface memory={memory} />
    </div>
  )
}
```

---

**Implementation Status**: 📋 **Ready for Development** - Comprehensive schema design completed, ready for TypeScript implementation and integration with memory processing and validation systems.

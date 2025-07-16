---
id: memory-extraction-design
title: Design - Memory Extraction System
---

# 🏗️ Design: Memory Extraction System

## 🎯 Overview

The Enhanced Memory Extraction System is designed as a psychologically-aware emotional intelligence processing pipeline that transforms structured message history into meaningful memories using delta-triggered extraction, mood scoring, and smart validation. The system uses a modular architecture with emotionally intelligent batch processing, auto-confirmation workflows, and MCP agent context building to create high-quality emotional intelligence for AI agent consumption.

**Key Design Principles**:

- **Emotional Salience**: Focus on extracting emotionally significant moments using delta-triggered analysis
- **Smart Validation**: Auto-confirmation system with confidence thresholds reduces validation burden
- **Mood Intelligence**: Contextual mood scoring provides psychological accuracy in memory formation
- **Agent Readiness**: MCP layer provides structured emotional context for Phase 3 integration

**Integration Strategy**: The system extends the Phase 1 foundation with enhanced packages for mood-aware memory processing, smart validation, and agent context building, creating a comprehensive emotional intelligence platform.

## 🏛️ Architecture

### Enhanced System Components

**@studio/memory - Emotionally Intelligent Processing Core**

- **Role**: Delta-triggered memory extraction with mood scoring and emotional intelligence
- **Responsibility**: Mood analysis, emotional salience detection, tone-tagged clustering, Claude integration
- **Integration**: Uses @studio/schema for emotional types, @studio/db for mood tracking
- **Output**: Emotionally significant memories with multi-factor confidence scoring

**@studio/validation - Smart Validation System**

- **Role**: Auto-confirmation with emotional significance weighting and domain-specific validation interfaces
- **Responsibility**: Confidence thresholds, bulk import sampling, user feedback calibration, emotional memory review UI
- **Integration**: Uses @studio/ui for shared components, @studio/memory for emotional data
- **Output**: Auto-confirmed memories with intelligent review prioritization and domain-specific validation interfaces

**@studio/schema - Enhanced Memory Structure Definition**

- **Role**: TypeScript definitions for emotional intelligence and mood tracking
- **Responsibility**: Mood scoring interfaces, delta-triggered memory types, confidence schemas
- **Integration**: Shared emotional intelligence types across all packages
- **Output**: Type-safe emotional operations and mood-aware transformations

**@studio/mcp - MCP Foundation Layer**

- **Role**: Foundation layer providing emotional intelligence endpoints for future MCP server integration
- **Responsibility**: Mood context tokens, relational timeline, emotional vocabulary extraction, foundational MCP interfaces
- **Integration**: Uses @studio/memory for emotional data, @studio/schema for types
- **Output**: Foundational MCP layer with emotional intelligence endpoints for future server integration

**@studio/db - Enhanced Database Extensions**

- **Extensions**: Mood tracking, emotional timeline, delta storage, confidence metrics
- **Schema**: Emotional memory storage with mood scores and validation states
- **Integration**: Extends message import schema with emotional intelligence features
- **Output**: Persistent emotional memory storage with mood-aware querying

### Enhanced Data Flow Architecture

```
Message Analysis → Mood Scoring → Delta Detection → Memory Extraction → Smart Validation → Agent Context
      ↓                ↓              ↓                 ↓                  ↓                ↓
Emotional Context → Mood Deltas → Salience Triggers → Claude Processing → Auto-Confirmation → MCP Layer
      ↓                ↓              ↓                 ↓                  ↓                ↓
Local/Contextual → Tone Tags → Emotional Significance → Memory Clustering → Confidence Scoring → Mood Tokens
```

**Enhanced Flow**:

1. **Mood Analysis**: Local and contextual mood scoring with delta detection and emotional salience
2. **Delta-Triggered Extraction**: Emotionally significant moments trigger memory extraction (mood repairs, positive spikes)
3. **Tone-Tagged Clustering**: Messages grouped by emotional coherence and psychological patterns
4. **Claude Processing**: Emotionally weighted prompts with mood context for enhanced analysis
5. **Smart Validation**: Auto-confirmation with confidence thresholds and emotional significance weighting
6. **MCP Agent Context**: Mood tokens, relational timeline, and emotional vocabulary for Phase 3 integration

## 📦 Package Architecture

### Enhanced @studio/memory

**New Files Created**:

- `src/mood/mood-scorer.ts` - Local and contextual mood scoring with delta detection
- `src/mood/delta-detector.ts` - Emotional salience detection and trigger identification
- `src/mood/tone-tagger.ts` - Tone-tagged memory clustering and emotional coherence
- `src/processor/claude-client.ts` - Enhanced Claude API integration with mood context
- `src/processor/batch-manager.ts` - Emotionally intelligent batch processing
- `src/processor/prompt-builder.ts` - Mood-aware prompt construction for emotional analysis
- `src/processor/memory-formatter.ts` - Enhanced memory output with emotional significance
- `src/processor/confidence-calculator.ts` - Multi-factor confidence scoring with emotional weighting
- `src/types/mood.ts` - Mood scoring and emotional intelligence type definitions
- `src/types/memory.ts` - Enhanced memory interfaces with emotional context
- `src/types/processing.ts` - Processing pipeline types with mood tracking

**Enhanced Memory Processing**:

```typescript
interface EnhancedMemoryProcessor {
  processBatch(
    messages: Message[],
    options: ProcessingOptions,
  ): Promise<ExtractedMemory[]>
  scoreMood(
    messages: Message[],
    mode: 'local' | 'contextual',
  ): Promise<MoodScore[]>
  detectDeltas(moodScores: MoodScore[]): Promise<MoodDelta[]>
  extractByEmotionalSalience(messages: Message[]): Promise<ExtractedMemory[]>
  validateApiKey(): Promise<boolean>
  estimateCost(messageCount: number): number
  getProcessingStatus(): ProcessingStatus
}

interface ExtractedMemory {
  id: string
  sourceMessageIds: string[]
  participants: Participant[]
  emotionalContext: EnhancedEmotionalContext
  relationshipDynamics: RelationshipDynamics
  moodScore: MoodScore
  moodDelta: MoodDelta
  emotionalSalience: number
  toneCluster: string[]
  summary: string
  confidence: number
  confidenceFactors: ConfidenceFactors
  extractedAt: Date
  processingMetadata: ProcessingMetadata
}

interface EnhancedEmotionalContext {
  primaryMood: 'positive' | 'negative' | 'neutral' | 'mixed' | 'ambiguous'
  intensity: number // 1-10
  moodScore: number // -1.0 to 1.0
  themes: EmotionalTheme[]
  emotionalMarkers: EmotionalMarker[]
  contextualEvents: ContextualEvent[]
  temporalPatterns: TemporalPattern[]
  deltaTriggers: DeltaTrigger[]
}

interface MoodScore {
  score: number // -1.0 to 1.0
  tone: string
  emotionTags: string[]
  summary: string
  contextWindow?: string[]
  confidence: number
  analysisMode: 'local' | 'contextual'
}

interface MoodDelta {
  fromMessageId: string
  toMessageId: string
  delta: number
  deltaType:
    | 'positive_spike'
    | 'mood_repair'
    | 'sustained_tenderness'
    | 'emotional_drift'
  significance: number
  triggerThreshold: number
}

interface ConfidenceFactors {
  clarityScore: number
  moodCertainty: number
  anchorScore: number
  noveltyScore: number
  emotionalSalience: number
  contextualSupport: number
}
```

**Enhanced Claude Integration**:

```typescript
class EnhancedClaudeProcessor {
  private client: ClaudeClient
  private rateLimiter: RateLimiter
  private promptBuilder: EnhancedPromptBuilder
  private moodScorer: MoodScorer
  private deltaDetector: DeltaDetector

  async processMessageBatch(messages: Message[]): Promise<ExtractedMemory[]> {
    // Pre-process with mood scoring
    const moodScores = await this.moodScorer.scoreMessages(
      messages,
      'contextual',
    )
    const moodDeltas = await this.deltaDetector.detectDeltas(moodScores)

    // Filter for emotionally significant moments
    const significantMessages = this.filterByEmotionalSalience(
      messages,
      moodDeltas,
    )

    // Build mood-aware prompt
    const prompt = this.promptBuilder.buildMoodAwarePrompt(
      significantMessages,
      moodScores,
    )

    try {
      const response = await this.rateLimiter.execute(() =>
        this.client.messages.create({
          model: 'claude-3-sonnet-20240229',
          max_tokens: 2000,
          messages: [{ role: 'user', content: prompt }],
        }),
      )

      return this.parseEnhancedMemoryResponse(
        response.content,
        moodScores,
        moodDeltas,
      )
    } catch (error) {
      return this.handleProcessingError(error, messages)
    }
  }

  private filterByEmotionalSalience(
    messages: Message[],
    deltas: MoodDelta[],
  ): Message[] {
    return messages.filter((msg) =>
      deltas.some(
        (delta) =>
          delta.significance > 0.6 &&
          (delta.fromMessageId === msg.id || delta.toMessageId === msg.id),
      ),
    )
  }
}
```

### Enhanced @studio/validation

**New Files Created**:

- `src/components/memory-review.tsx` - Domain-specific validation interface with mood context
- `src/components/emotional-context-display.tsx` - Specialized mood score visualization for validation
- `src/components/confidence-threshold-interface.tsx` - Domain-specific auto-confirmation threshold management
- `src/components/bulk-import-sampling.tsx` - Specialized emotional sampling interface
- `src/components/quality-scoring-interface.tsx` - Domain-specific quality assessment tools
- `src/components/validation-preview.tsx` - Progressive development component (Storybook → Next.js → Production)
- `src/hooks/use-smart-validation.ts` - Auto-confirmation and validation state management
- `src/utils/auto-confirmation.ts` - Confidence threshold and emotional significance logic
- `src/utils/emotional-sampling.ts` - Bulk import sampling with emotional intelligence
- `src/utils/user-feedback-calibration.ts` - System learning and confidence adjustment
- `src/types/validation.ts` - Enhanced validation workflow types and interfaces
- `src/types/confidence.ts` - Confidence scoring and threshold types

**Enhanced Validation Interface**:

```typescript
interface SmartMemoryValidationProps {
  memory: ExtractedMemory
  autoConfirmationResult: AutoConfirmationResult
  onValidate: (validation: ValidationResult) => void
  onRefine: (refinement: RefinementSuggestion) => void
  onFeedback: (feedback: UserFeedback) => void
}

export function SmartMemoryValidation({ memory, autoConfirmationResult, onValidate, onRefine, onFeedback }: SmartMemoryValidationProps) {
  const [qualityScore, setQualityScore] = useState<number>(memory.confidence * 10)
  const [feedback, setFeedback] = useState<string>('')
  const [refinementSuggestions, setRefinementSuggestions] = useState<RefinementSuggestion[]>([])

  return (
    <div className="smart-memory-validation">
      <AutoConfirmationStatus result={autoConfirmationResult} />
      <MemoryDisplay memory={memory} />
      <MoodScoreDisplay
        moodScore={memory.moodScore}
        moodDelta={memory.moodDelta}
        emotionalSalience={memory.emotionalSalience}
      />
      <EmotionalContextDisplay context={memory.emotionalContext} />
      <ConfidenceFactorsDisplay factors={memory.confidenceFactors} />
      <ToneClusterVisualization toneCluster={memory.toneCluster} />
      <QualityScoringInterface
        initialScore={qualityScore}
        onScore={setQualityScore}
        onFeedback={setFeedback}
        onSuggestions={setRefinementSuggestions}
      />
      <ValidationActions
        onValidate={() => onValidate({ score: qualityScore, feedback, suggestions: refinementSuggestions })}
        onRefine={() => onRefine(refinementSuggestions[0])}
        onFeedback={() => onFeedback({ memoryId: memory.id, userRating: qualityScore, feedback })}
      />
    </div>
  )
}
```

**Enhanced Quality Metrics System**:

```typescript
interface AutoConfirmationResult {
  autoConfirmed: boolean
  confidence: number
  reviewSuggested: boolean
  threshold: number
  emotionalSalience: number
  reason: string
}

interface EnhancedQualityMetrics {
  emotionalAccuracy: number // 1-10
  relationshipRelevance: number // 1-10
  contextualDepth: number // 1-10
  moodScoreReliability: number // 1-10
  deltaSignificance: number // 1-10
  toneCoherence: number // 1-10
  confidenceAlignment: number // 1-10
  overallQuality: number // calculated composite score
}

interface UserFeedback {
  memoryId: string
  userRating: number
  feedback: string
  calibrationData: {
    systemConfidence: number
    userAssessment: number
    divergence: number
  }
}

interface ValidationResult {
  memoryId: string
  validatorId: string
  qualityMetrics: EnhancedQualityMetrics
  feedback: string
  approved: boolean
  refinementSuggestions: RefinementSuggestion[]
  validatedAt: Date
  userFeedback: UserFeedback
}
```

### @studio/mcp

**New Files Created**:

- `src/context/mood-context-builder.ts` - Mood context token generation for foundational MCP layer
- `src/context/relational-timeline.ts` - Emotional timeline construction for foundation layer
- `src/context/emotional-vocabulary.ts` - Tone-consistent vocabulary extraction
- `src/context/agent-context-formatter.ts` - Agent context formatting and optimization
- `src/endpoints/context-endpoints.ts` - Foundational HTTP/TRPC endpoints for future MCP server
- `src/endpoints/memory-endpoints.ts` - Memory query endpoints for MCP foundation
- `src/endpoints/mood-endpoints.ts` - Mood tracking and trend endpoints
- `src/types/agent-context.ts` - Agent context and integration types
- `src/types/mcp-endpoints.ts` - MCP foundation endpoint and API types
- `src/types/mcp-foundation.ts` - Foundation layer types for future MCP server integration
- `src/utils/context-optimization.ts` - Context compression and optimization utilities

**MCP Agent Context**:

```typescript
interface AgentContext {
  moodContext: MoodContextToken
  relationalTimeline: RelationalEvent[]
  emotionalVocabulary: EmotionalVocabulary
  recentMemories: ExtractedMemory[]
  emotionalPatterns: EmotionalPattern[]
  relationshipStatus: RelationshipStatus
}

interface MoodContextToken {
  currentMood: string
  moodTrend: number
  moodDirection: 'improving' | 'declining' | 'stable'
  recentMoodTags: string[]
  emotionalIntensity: number
  contextualBackground: string
}

interface RelationalEvent {
  type: 'conflict' | 'affection' | 'support' | 'milestone' | 'tension_repair'
  date: Date
  summary: string
  participants: string[]
  emotionalImpact: number
  moodBefore: number
  moodAfter: number
  significance: number
}

interface EmotionalVocabulary {
  dominantTones: string[]
  communicationPatterns: string[]
  emotionalMarkers: string[]
  relationshipThemes: string[]
  contextualPhrases: string[]
}
```

**MCP Endpoints**:

```typescript
interface MCPEndpoints {
  '/mcp/context': (userId: string, timeframe?: string) => Promise<AgentContext>
  '/mcp/memories': (filters: MemoryFilters) => Promise<ExtractedMemory[]>
  '/mcp/mood-trend': (timeRange: DateRange) => Promise<MoodTrend[]>
  '/mcp/emotional-vocabulary': (
    participantId: string,
  ) => Promise<EmotionalVocabulary>
  '/mcp/relational-timeline': (
    participants: string[],
  ) => Promise<RelationalEvent[]>
  '/mcp/context-tokens': (conversationId: string) => Promise<MoodContextToken[]>
}
```

### Enhanced @studio/schema

**New Files Created**:

- `src/memory/core-memory.ts` - Enhanced memory interface definitions with mood scoring
- `src/memory/emotional-context.ts` - Enhanced emotional context with delta triggers
- `src/memory/mood-scoring.ts` - Mood scoring and delta detection type definitions
- `src/memory/relationship-dynamics.ts` - Enhanced relationship mapping with emotional patterns
- `src/validation/validation-types.ts` - Smart validation workflow types
- `src/validation/confidence-types.ts` - Confidence scoring and auto-confirmation types
- `src/validation/quality-metrics.ts` - Enhanced quality assessment with emotional factors
- `src/processing/batch-processing.ts` - Enhanced processing pipeline with mood intelligence
- `src/mcp/agent-context-types.ts` - MCP agent context and integration types
- `src/mcp/mood-context-types.ts` - Mood context token and relational timeline types
- `src/utils/type-guards.ts` - Enhanced runtime type validation with mood validation
- `src/utils/schema-validation.ts` - Enhanced schema validation with emotional intelligence

**Enhanced Memory Schema Definition**:

```typescript
// Enhanced core memory structure
export interface EnhancedMemory {
  id: string
  sourceMessageIds: string[]
  participants: Participant[]
  emotionalContext: EnhancedEmotionalContext
  relationshipDynamics: RelationshipDynamics
  moodScore: MoodScore
  moodDelta: MoodDelta
  emotionalSalience: number
  toneCluster: string[]
  summary: string
  confidence: number
  confidenceFactors: ConfidenceFactors
  extractedAt: Date
  validationStatus: SmartValidationStatus
  qualityMetrics?: EnhancedQualityMetrics
  agentContext?: AgentContextData
}

// Enhanced emotional context structure
export interface EnhancedEmotionalContext {
  primaryMood: MoodType
  intensity: IntensityScore
  moodScore: number // -1.0 to 1.0
  themes: EmotionalTheme[]
  emotionalMarkers: EmotionalMarker[]
  contextualEvents: ContextualEvent[]
  temporalPatterns: TemporalPattern[]
  deltaTriggers: DeltaTrigger[]
  emotionalProgression: EmotionalProgression
  toneConsistency: number
}
}

// Relationship dynamics structure
export interface RelationshipDynamics {
  closeness: RelationshipScore
  tension: RelationshipScore
  supportiveness: RelationshipScore
  communicationStyle: CommunicationStyle
  relationshipPatterns: RelationshipPattern[]
  interactionQuality: InteractionQuality
}

// Validation and quality types
export interface ValidationStatus {
  validated: boolean
  validator?: string
  validatedAt?: Date
  qualityScore?: number
  feedback?: string
  requiresRefinement: boolean
}
```

### @studio/db Extensions

**Database Schema Extensions**:

```sql
-- Memory storage table
CREATE TABLE Memory (
  id TEXT PRIMARY KEY,
  sourceMessageIds TEXT NOT NULL, -- JSON array of message IDs
  participants TEXT NOT NULL,     -- JSON array of participant data
  emotionalContext TEXT NOT NULL, -- JSON emotional context
  relationshipDynamics TEXT NOT NULL, -- JSON relationship data
  summary TEXT NOT NULL,
  confidence REAL NOT NULL,
  extractedAt DATETIME NOT NULL,
  validationStatus TEXT NOT NULL, -- JSON validation status
  qualityMetrics TEXT,           -- JSON quality metrics
  createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
  updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Memory-Message relationship tracking
CREATE TABLE MemoryMessage (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  memoryId TEXT NOT NULL,
  messageId INTEGER NOT NULL,
  relevanceScore REAL,
  FOREIGN KEY (memoryId) REFERENCES Memory(id),
  FOREIGN KEY (messageId) REFERENCES Message(id)
);

-- Validation history tracking
CREATE TABLE ValidationHistory (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  memoryId TEXT NOT NULL,
  validatorId TEXT NOT NULL,
  qualityScore REAL NOT NULL,
  feedback TEXT,
  approved BOOLEAN NOT NULL,
  refinementSuggestions TEXT, -- JSON array
  validatedAt DATETIME NOT NULL,
  FOREIGN KEY (memoryId) REFERENCES Memory(id)
);

-- Processing batch tracking
CREATE TABLE ProcessingBatch (
  id TEXT PRIMARY KEY,
  messageIds TEXT NOT NULL,    -- JSON array of message IDs
  status TEXT NOT NULL,        -- 'pending', 'processing', 'completed', 'failed'
  startedAt DATETIME,
  completedAt DATETIME,
  processingCost REAL,
  memoriesExtracted INTEGER DEFAULT 0,
  errorLog TEXT,
  createdAt DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

## 🔄 API Design

### Memory Processing API

```typescript
// Main processing interface
interface MemoryProcessorAPI {
  // Batch processing
  processBatch(options: BatchProcessingOptions): Promise<ProcessingResult>
  getBatchStatus(batchId: string): Promise<BatchStatus>
  cancelBatch(batchId: string): Promise<void>

  // Memory retrieval
  getMemories(filters: MemoryFilters): Promise<Memory[]>
  getMemoryById(id: string): Promise<Memory>
  getMemoryByMessageIds(messageIds: string[]): Promise<Memory[]>

  // Quality management
  validateMemory(
    memoryId: string,
    validation: ValidationInput,
  ): Promise<ValidationResult>
  refineMemory(memoryId: string, refinement: RefinementInput): Promise<Memory>
  exportMemories(filters: ExportFilters): Promise<ExportResult>
}

// Batch processing options
interface BatchProcessingOptions {
  messageFilters: MessageFilters
  batchSize: number
  priorityMode: 'quality' | 'coverage' | 'balanced'
  maxCost: number
  skipValidated: boolean
}

// Processing result
interface ProcessingResult {
  batchId: string
  totalMessages: number
  memoriesExtracted: number
  processingCost: number
  averageConfidence: number
  errors: ProcessingError[]
  completedAt: Date
}
```

### Validation API

```typescript
// Validation interface
interface ValidationAPI {
  // Review workflows
  getMemoriesForReview(limit: number): Promise<Memory[]>
  submitValidation(
    memoryId: string,
    validation: ValidationInput,
  ): Promise<ValidationResult>
  getValidationHistory(memoryId: string): Promise<ValidationHistory[]>

  // Quality metrics
  getQualityMetrics(filters: QualityFilters): Promise<QualityReport>
  getValidationStats(): Promise<ValidationStats>
  exportValidatedMemories(filters: ExportFilters): Promise<ExportResult>

  // Refinement workflows
  suggestRefinements(memoryId: string): Promise<RefinementSuggestion[]>
  applyRefinement(
    memoryId: string,
    refinement: RefinementInput,
  ): Promise<Memory>
  trackRefinementEffectiveness(): Promise<RefinementStats>
}

// Validation input structure
interface ValidationInput {
  qualityScore: number
  emotionalAccuracy: number
  relationshipRelevance: number
  contextualDepth: number
  feedback: string
  approved: boolean
  refinementSuggestions: RefinementSuggestion[]
}
```

## 📊 Memory Processing Pipeline

### Batch Processing Workflow

```typescript
class BatchProcessor {
  async processBatch(messages: Message[]): Promise<ProcessingResult> {
    const batchId = generateBatchId()
    const batch = await this.createBatch(batchId, messages)

    try {
      // Phase 1: Prepare messages for processing
      const preparedMessages = await this.prepareMessages(messages)

      // Phase 2: Extract emotional context
      const emotionalAnalysis =
        await this.extractEmotionalContext(preparedMessages)

      // Phase 3: Analyze relationship dynamics
      const relationshipAnalysis =
        await this.analyzeRelationshipDynamics(preparedMessages)

      // Phase 4: Create structured memories
      const memories = await this.createMemories(
        emotionalAnalysis,
        relationshipAnalysis,
      )

      // Phase 5: Store memories with validation status
      const storedMemories = await this.storeMemories(memories)

      // Phase 6: Queue for validation
      await this.queueForValidation(storedMemories)

      return this.createProcessingResult(batchId, storedMemories)
    } catch (error) {
      await this.handleBatchError(batchId, error)
      throw error
    }
  }
}
```

### Claude Integration Strategy

```typescript
class ClaudeIntegration {
  private buildEmotionalAnalysisPrompt(messages: Message[]): string {
    return `
    Analyze the emotional context of this conversation:
    
    Messages (${messages.length} total):
    ${messages.map((m) => `${m.sender}: ${m.message}`).join('\n')}
    
    Extract:
    1. Primary emotional mood (positive/negative/neutral/mixed)
    2. Emotional intensity (1-10)
    3. Key themes (support, humor, frustration, etc.)
    4. Emotional markers and significant events
    5. Relationship dynamics (closeness, tension, supportiveness)
    
    Respond with structured JSON matching the Memory schema.
    Focus on meaningful emotional context rather than surface-level analysis.
    `
  }

  private parseMemoryResponse(response: string): ExtractedMemory[] {
    try {
      const parsed = JSON.parse(response)
      return this.validateAndTransformMemories(parsed)
    } catch (error) {
      throw new MemoryParsingError('Failed to parse Claude response', error)
    }
  }
}
```

## 🎨 UI Components

### Memory Review Interface

```typescript
interface MemoryReviewProps {
  memory: Memory
  onValidate: (validation: ValidationInput) => void
  onRefine: (refinement: RefinementInput) => void
}

export function MemoryReview({ memory, onValidate, onRefine }: MemoryReviewProps) {
  return (
    <div className="memory-review">
      <MemoryHeader memory={memory} />

      <div className="memory-content">
        <MessageContext messages={memory.sourceMessages} />
        <EmotionalContextDisplay context={memory.emotionalContext} />
        <RelationshipDynamicsChart dynamics={memory.relationshipDynamics} />
      </div>

      <div className="validation-interface">
        <QualityScoring onScore={handleQualityScore} />
        <FeedbackInput onFeedback={handleFeedback} />
        <RefinementSuggestions onSuggest={handleRefinementSuggestion} />
      </div>

      <div className="validation-actions">
        <button onClick={handleApprove}>Approve Memory</button>
        <button onClick={handleRefine}>Suggest Refinements</button>
        <button onClick={handleReject}>Reject Memory</button>
      </div>
    </div>
  )
}
```

### Quality Metrics Dashboard

```typescript
interface QualityDashboardProps {
  memories: Memory[]
  validationStats: ValidationStats
}

export function QualityDashboard({ memories, validationStats }: QualityDashboardProps) {
  return (
    <div className="quality-dashboard">
      <div className="metrics-overview">
        <MetricCard
          title="Validation Rate"
          value={`${validationStats.approvalRate}%`}
          trend={validationStats.approvalTrend}
        />
        <MetricCard
          title="Average Quality"
          value={validationStats.averageQuality.toFixed(1)}
          trend={validationStats.qualityTrend}
        />
        <MetricCard
          title="Memories Extracted"
          value={memories.length}
          trend="positive"
        />
      </div>

      <div className="quality-charts">
        <QualityDistributionChart data={validationStats.qualityDistribution} />
        <ValidationTimelineChart data={validationStats.validationTimeline} />
        <ThemeAnalysisChart data={validationStats.themeAnalysis} />
      </div>
    </div>
  )
}
```

## 🧪 Testing Strategy

### Memory Processing Tests

```typescript
describe('Memory Processing', () => {
  describe('ClaudeProcessor', () => {
    test('extracts emotional context from message batch', async () => {
      const messages = createTestMessages([
        { sender: 'user1', message: 'I am so excited about this!' },
        { sender: 'user2', message: 'Me too! This is amazing!' },
      ])

      const processor = new ClaudeProcessor()
      const memories = await processor.processBatch(messages)

      expect(memories).toHaveLength(1)
      expect(memories[0].emotionalContext.primaryMood).toBe('positive')
      expect(memories[0].emotionalContext.intensity).toBeGreaterThan(7)
      expect(memories[0].emotionalContext.themes).toContain('excitement')
    })

    test('handles API errors gracefully', async () => {
      const processor = new ClaudeProcessor()
      const mockError = new Error('API rate limit exceeded')

      jest.spyOn(processor, 'processMessageBatch').mockRejectedValue(mockError)

      await expect(processor.processBatch([])).rejects.toThrow(
        'API rate limit exceeded',
      )
    })
  })
})
```

### Validation Interface Tests

```typescript
describe('Validation Interface', () => {
  test('displays memory for review', () => {
    const memory = createTestMemory()
    const { getByText } = render(<MemoryReview memory={memory} onValidate={jest.fn()} onRefine={jest.fn()} />)

    expect(getByText(memory.summary)).toBeInTheDocument()
    expect(getByText('Primary Mood: positive')).toBeInTheDocument()
    expect(getByText('Confidence: 8.5')).toBeInTheDocument()
  })

  test('submits validation with quality score', async () => {
    const onValidate = jest.fn()
    const memory = createTestMemory()

    const { getByRole } = render(<MemoryReview memory={memory} onValidate={onValidate} onRefine={jest.fn()} />)

    fireEvent.click(getByRole('button', { name: /approve memory/i }))

    await waitFor(() => {
      expect(onValidate).toHaveBeenCalledWith(expect.objectContaining({
        approved: true,
        qualityScore: expect.any(Number)
      }))
    })
  })
})
```

## 📊 Performance Considerations

### Claude API Optimization

```typescript
class RateLimiter {
  private queue: Array<() => Promise<any>> = []
  private activeRequests = 0
  private maxConcurrent = 3
  private requestDelay = 1000 // 1 second between requests

  async execute<T>(request: () => Promise<T>): Promise<T> {
    return new Promise((resolve, reject) => {
      this.queue.push(async () => {
        try {
          this.activeRequests++
          await this.delay(this.requestDelay)
          const result = await request()
          resolve(result)
        } catch (error) {
          reject(error)
        } finally {
          this.activeRequests--
          this.processQueue()
        }
      })

      this.processQueue()
    })
  }

  private processQueue() {
    if (this.activeRequests < this.maxConcurrent && this.queue.length > 0) {
      const request = this.queue.shift()!
      request()
    }
  }
}
```

### Memory Storage Optimization

```typescript
class MemoryStorage {
  async storeMemories(memories: Memory[]): Promise<void> {
    // Batch insert for better performance
    await this.db.transaction(async (tx) => {
      for (const memory of memories) {
        await tx.memory.create({
          data: {
            ...memory,
            emotionalContext: JSON.stringify(memory.emotionalContext),
            relationshipDynamics: JSON.stringify(memory.relationshipDynamics),
          },
        })
      }
    })
  }

  async getMemoriesWithFilters(filters: MemoryFilters): Promise<Memory[]> {
    // Optimized query with proper indexing
    const memories = await this.db.memory.findMany({
      where: this.buildWhereClause(filters),
      include: {
        memoryMessages: {
          include: {
            message: true,
          },
        },
      },
      orderBy: {
        confidence: 'desc',
      },
    })

    return memories.map(this.transformMemory)
  }
}
```

## 🚨 Error Handling

### Processing Error Recovery

```typescript
class ProcessingErrorHandler {
  async handleProcessingError(
    error: Error,
    context: ProcessingContext,
  ): Promise<void> {
    const errorType = this.classifyError(error)

    switch (errorType) {
      case 'RATE_LIMIT':
        await this.handleRateLimitError(context)
        break
      case 'API_ERROR':
        await this.handleAPIError(error, context)
        break
      case 'PARSING_ERROR':
        await this.handleParsingError(error, context)
        break
      default:
        await this.handleUnknownError(error, context)
    }
  }

  private async handleRateLimitError(
    context: ProcessingContext,
  ): Promise<void> {
    // Exponential backoff strategy
    const backoffDelay = Math.min(context.retryCount * 2000, 30000)
    await this.delay(backoffDelay)

    // Retry with reduced batch size
    context.batchSize = Math.max(context.batchSize / 2, 10)
    await this.retryProcessing(context)
  }
}
```

---

**Implementation Status**: 🔄 **In Progress** - Core architecture defined, ready for implementation of memory processing, validation, and schema packages.

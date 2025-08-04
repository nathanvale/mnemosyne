# API Specification

This is the API specification for the spec detailed in @.agent-os/specs/2025-01-22-mood-scoring-algorithm/spec.md

> Created: 2025-01-22
> Version: 1.0.0

## Enhanced MoodScoringAnalyzer API

### Core Analysis Methods

**analyzeMood(content: string, context: EmotionalContext): Promise<MoodAnalysisResult>**

**Purpose:** Primary mood analysis method that processes conversation content with contextual awareness
**Parameters:**

- `content`: Message or conversation text to analyze
- `context`: Emotional context including participant data, relationship dynamics, and historical patterns
  **Response:** Complete mood analysis with score, confidence, descriptors, and metadata
  **Example:**

```typescript
const result = await analyzer.analyzeMood(
  "I've been feeling overwhelmed lately but talking to you always helps",
  {
    participant: participantProfile,
    relationshipDynamics: supportiveRelationship,
    conversationalContext: seekingSupport,
    historicalPatterns: previousStressPatterns,
  },
)
// Returns: { moodScore: 4.2, confidence: 0.85, emotionalDescriptors: ["stressed", "supported"], ... }
```

**calculateMoodScore(indicators: EmotionalIndicators): MoodScore**

**Purpose:** Calculate weighted mood score from multi-dimensional emotional indicators
**Parameters:** Emotional indicators including sentiment, psychological, relationship, conversational, and historical scores
**Response:** Normalized mood score (0-10) with confidence assessment and descriptors
**Example:**

```typescript
const moodScore = analyzer.calculateMoodScore({
  sentiment: { positive: 0.3, negative: 0.6, neutral: 0.1 },
  psychological: { stress: 0.7, coping: 0.4, resilience: 0.6 },
  relationship: { support: 0.8, intimacy: 0.7 },
  conversational: { flow: 0.5, engagement: 0.6 },
  historical: { baseline: 5.2, deviation: -1.8 },
})
// Returns: { score: 4.2, confidence: 0.85, emotionalDescriptors: [...], uncertaintyAreas: [...] }
```

**generateConfidenceScore(analysis: MoodAnalysisResult): ConfidenceScore**

**Purpose:** Assess reliability and uncertainty of mood analysis results
**Parameters:** Complete mood analysis result for confidence assessment
**Response:** Multi-factor confidence score with uncertainty areas and reliability metrics

## Enhanced Delta Detection API

### Conversation-Level Detection

**detectConversationalDeltas(messages: ConversationMessage[]): ConversationalDelta[]**

**Purpose:** Identify mood transitions within conversation sequences
**Parameters:** Array of conversation messages with timestamps and participant data
**Response:** Detected mood deltas with significance scoring and emotional triggers
**Example:**

```typescript
const deltas = detector.detectConversationalDeltas([
  {
    content: "I'm really struggling with this project",
    moodScore: 3.1,
    timestamp: '10:00',
  },
  {
    content:
      'Thank you so much for listening and helping me think through this',
    moodScore: 6.8,
    timestamp: '10:15',
  },
])
// Returns: [{ fromMood: 3.1, toMood: 6.8, magnitude: 3.7, transitionType: 'recovery', significance: 0.92 }]
```

**trackTimelineMoodEvolution(moodHistory: MoodHistoryEntry[]): MoodEvolution**

**Purpose:** Analyze mood changes over extended time periods
**Parameters:** Historical mood data with timestamps and context
**Response:** Trend analysis, cyclical patterns, and emotional stability metrics

**identifyMoodRepairMoments(conversation: ConversationData): MoodRepairMoment[]**

**Purpose:** Detect emotional support and recovery instances
**Parameters:** Complete conversation data with participant interactions
**Response:** Identified mood repair moments with effectiveness scoring and support patterns

### Timeline Analysis

**analyzeMoodTrends(timelineData: MoodTimelineData): MoodTrendAnalysis**

**Purpose:** Long-term emotional pattern analysis and trend identification
**Parameters:** Extended mood timeline data with contextual metadata
**Response:** Trend direction, strength, cyclical patterns, and volatility metrics

**assessTransitionSignificance(delta: MoodDelta): SignificanceScore**

**Purpose:** Evaluate emotional transition importance and impact
**Parameters:** Mood delta with context and participant information
**Response:** Significance score with impact assessment and contextual relevance

## Emotional Context Building API

### Context Construction

**buildEmotionalContext(participant: Participant, conversation: ConversationData): EmotionalContext**

**Purpose:** Create comprehensive emotional context for mood analysis
**Parameters:** Participant profile and conversation data
**Response:** Complete emotional context with relationship dynamics, baseline, and patterns

**analyzeRelationshipDynamics(participants: Participant[]): RelationshipDynamics**

**Purpose:** Assess participant interaction patterns and emotional dynamics
**Parameters:** Array of conversation participants with relationship data
**Response:** Relationship dynamics including intimacy, support patterns, and communication style

**establishEmotionalBaseline(participantHistory: ParticipantHistory): EmotionalBaseline**

**Purpose:** Create individual emotional baseline for comparative analysis
**Parameters:** Historical participant data including mood patterns and interactions
**Response:** Emotional baseline with typical mood range, stability metrics, and pattern indicators

## Validation Framework API

### Human Validation Integration

**validateMoodScore(predicted: MoodScore, humanAssessment: HumanMoodAssessment): ValidationResult**

**Purpose:** Compare algorithmic mood scores with human emotional assessment
**Parameters:** Algorithm prediction and human validation assessment
**Response:** Validation result with agreement metrics, discrepancy areas, and improvement suggestions

**trackValidationAccuracy(validations: ValidationResult[]): AccuracyMetrics**

**Purpose:** Monitor overall algorithm accuracy and identify improvement areas
**Parameters:** Array of validation results over time
**Response:** Accuracy metrics including correlation, bias indicators, and performance trends

**identifySystematicBiases(validationHistory: ValidationResult[]): BiasAnalysis**

**Purpose:** Detect consistent algorithmic biases in mood assessment
**Parameters:** Historical validation data for pattern analysis
**Response:** Bias analysis with identified patterns, affected scenarios, and correction recommendations

### Edge Case Management

**handleComplexEmotionalSituation(situation: ComplexEmotionalSituation): EdgeCaseResult**

**Purpose:** Process complex emotional scenarios with mixed or ambiguous feelings
**Parameters:** Emotional situation data with complexity indicators and context
**Response:** Specialized analysis result with uncertainty quantification and multiple interpretation options

**calibrateAlgorithm(validationFeedback: ValidationFeedback[]): CalibrationAdjustment**

**Purpose:** Adjust algorithm parameters based on validation feedback
**Parameters:** Validation feedback with accuracy assessments and improvement suggestions
**Response:** Calibration adjustments with parameter modifications and expected improvements

## Data Type Definitions

### Core Types

```typescript
interface MoodAnalysisResult {
  moodScore: number // 0-10 scale
  confidence: number // 0-1 reliability score
  emotionalDescriptors: string[]
  psychologicalIndicators: PsychologicalIndicator[]
  sentimentBreakdown: SentimentAnalysis
  uncertaintyAreas: string[]
  analysisMetadata: AnalysisMetadata
}

interface MoodDelta {
  fromMood: number
  toMood: number
  magnitude: number
  direction: 'positive' | 'negative' | 'neutral'
  transitionType: 'gradual' | 'sudden' | 'recovery' | 'decline'
  emotionalTriggers: EmotionalTrigger[]
  timeContext: TimeContext
  significance: number
  confidence: number
}

interface EmotionalContext {
  participant: ParticipantProfile
  relationshipDynamics: RelationshipDynamics
  emotionalBaseline: EmotionalBaseline
  conversationalContext: ConversationalContext
  historicalPatterns: EmotionalPattern[]
  contextualFactors: ContextualFactor[]
  confidenceLevel: number
}
```

### Validation Types

```typescript
interface ValidationResult {
  agreement: number // 0-1 correlation with human assessment
  discrepancyAreas: string[]
  validatorConfidence: number
  situationComplexity: number
  improvementSuggestions: string[]
  edgeCaseFlag: boolean
}

interface AccuracyMetrics {
  overallCorrelation: number
  categoryAccuracy: Map<string, number>
  biasIndicators: BiasIndicator[]
  performanceTrends: PerformanceTrend[]
  edgeCaseHandling: EdgeCaseMetrics
}
```

## Integration Endpoints

### Memory Processing Integration

The enhanced mood scoring system integrates with the memory extraction pipeline through these interfaces:

- **Memory significance enhancement**: `enhanceMemorySignificance(memory: Memory, moodAnalysis: MoodAnalysisResult): EnhancedMemory`
- **Emotional context injection**: `injectEmotionalContext(memory: Memory, context: EmotionalContext): ContextualMemory`
- **Delta-aware prioritization**: `prioritizeByEmotionalSignificance(memories: Memory[], deltas: MoodDelta[]): PrioritizedMemory[]`

### Database Integration

Enhanced database operations for mood analysis persistence:

- **Mood score storage**: `storeMoodAnalysis(conversationId: string, analysis: MoodAnalysisResult): Promise<void>`
- **Delta tracking**: `trackMoodDeltas(participantId: string, deltas: MoodDelta[]): Promise<void>`
- **Validation data**: `storeValidationResult(analysisId: string, validation: ValidationResult): Promise<void>`

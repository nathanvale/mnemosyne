# Technical Specification

This is the technical specification for the spec detailed in @.agent-os/specs/2025-01-22-mood-scoring-algorithm/spec.md

> Created: 2025-01-22
> Version: 1.0.0

## Technical Requirements

- **Multi-dimensional mood analysis**: Combine sentiment, psychological indicators, relationship context, and conversational flow with weighted scoring (35% sentiment, 25% psychological, 20% relationship, 15% conversational, 5% historical)
- **Delta detection accuracy**: 85%+ accuracy in identifying significant emotional transitions with <15% false positive rate
- **Confidence calibration**: Uncertainty detection with 90%+ accuracy in complex emotional situations
- **Human validation correlation**: 80%+ agreement between algorithmic mood scores and human emotional assessment
- **Performance requirements**: Sub-2 second mood analysis processing time
- **Integration compatibility**: Seamless integration with existing memory extraction pipeline and @studio/schema types

## Current Implementation Analysis

### Existing Components (packages/memory/src/mood-scoring/)

**MoodScoringAnalyzer** (`analyzer.ts`)

- Basic emotional keyword mapping with valence and intensity scoring
- Evidence-based confidence thresholds (high ≥4, medium ≥3 evidence points)
- Mood score scale (0-10) with defined thresholds (high=7, medium=6, low=4, neutral=5)
- Extensible configuration for custom emotional keywords and contextual factors

**DeltaDetector** (`delta-detector.ts`)

- Conversation-level mood transition detection
- Configurable significance thresholds for identifying meaningful changes
- Temporal context analysis for mood evolution tracking

**ConfidenceCalculator** (`confidence-calculator.ts`)

- Multi-factor confidence assessment framework
- Evidence quality scoring and reliability metrics
- Uncertainty area identification for complex emotional situations

**PatternRecognizer** (`pattern-recognizer.ts`)

- Emotional pattern identification and consistency analysis
- Historical baseline establishment and comparison capabilities

## Approach Options

**Option A: Extend Current Implementation** (Selected)

- Pros: Leverages existing well-structured codebase, maintains compatibility, builds on proven foundation
- Cons: May require significant refactoring of scoring algorithms, limited by current architecture constraints

**Option B: Complete Rewrite with New Architecture**

- Pros: Fresh start allows optimal design, can implement latest research findings
- Cons: High development cost, potential compatibility issues, would abandon existing investment

**Option C: Hybrid Approach with New Core Engine**

- Pros: Combines fresh design with existing infrastructure
- Cons: Complex integration, potential architectural inconsistencies, higher maintenance overhead

**Rationale**: Option A selected because the existing codebase provides solid foundational components with good separation of concerns. The modular architecture allows for targeted enhancements without breaking changes. The current type system and integration patterns are well-established and compatible with the broader memory processing pipeline.

## Enhanced Implementation Requirements

### Multi-Dimensional Analysis Framework

**Sentiment Analysis Enhancement**

```typescript
interface SentimentProcessor {
  analyzePositiveSentiment(content: string): SentimentScore
  analyzeNegativeSentiment(content: string): SentimentScore
  processMixedSentiment(content: string): MixedSentimentScore
  calculateSentimentConfidence(analysis: SentimentScore): number
}
```

**Psychological Indicator Analysis**

```typescript
interface PsychologicalIndicatorAnalyzer {
  analyzeCoping(content: string): CopingIndicator[]
  assessResilience(conversation: ConversationData): ResilienceScore
  detectStressMarkers(content: string): StressIndicator[]
  evaluateSupport(interaction: ParticipantInteraction): SupportIndicator[]
  identifyGrowth(moodEvolution: MoodEvolution): GrowthIndicator[]
}
```

**Relationship Context Integration**

```typescript
interface RelationshipContextAnalyzer {
  analyzeParticipantDynamics(participants: Participant[]): RelationshipDynamics
  assessEmotionalIntimacy(participants: Participant[]): IntimacyLevel
  evaluateSupportPatterns(participants: Participant[]): SupportPattern[]
  identifyRelationshipTriggers(participants: Participant[]): EmotionalTrigger[]
}
```

### Weighted Scoring Algorithm

**Enhanced MoodCalculator**

```typescript
interface EnhancedMoodCalculator {
  calculateWeightedScore(
    sentimentScore: number, // 35% weight
    psychologicalScore: number, // 25% weight
    relationshipScore: number, // 20% weight
    conversationalScore: number, // 15% weight
    historicalScore: number, // 5% weight
  ): WeightedMoodScore

  normalizeToScale(rawScore: number, min: number, max: number): number
  adjustForConfidence(score: number, confidence: number): number
}
```

### Advanced Delta Detection

**Conversation-Level Delta Detection**

- Significance threshold: 1.5+ point change on 10-point scale
- Sudden change threshold: 2.0+ point sudden transitions
- Mood repair identification: Recovery patterns and emotional support moments
- Transition type classification: gradual, sudden, recovery, decline

**Timeline Mood Evolution**

- Long-term trend analysis with strength assessment
- Cyclical pattern detection for recurring emotional states
- Emotional stability metrics and volatility scoring
- Resilience calculation based on recovery patterns

### Validation Framework Enhancement

**Human Validation Integration**

```typescript
interface ValidationFramework {
  validateMoodScore(
    predicted: MoodScore,
    human: HumanAssessment,
  ): ValidationResult
  trackAccuracyMetrics(validations: ValidationResult[]): AccuracyMetrics
  identifySystematicBiases(history: ValidationResult[]): BiasAnalysis
  calibrateAlgorithm(feedback: ValidationFeedback[]): CalibrationAdjustment
}
```

**Edge Case Handling**

- Complex emotional situation identification (>0.75 emotional complexity)
- Mixed emotional state processing with multiple concurrent emotions
- Ambiguous context detection with uncertainty flagging
- Cross-cultural communication pattern accommodation

## External Dependencies

**@studio/logger** - Enhanced logging for mood analysis debugging and performance monitoring

- Justification: Essential for debugging complex emotional analysis algorithms and tracking performance metrics

**@studio/schema** - Extended type definitions for mood analysis results and delta detection

- Justification: Required for type-safe integration with existing memory processing pipeline

**@studio/db** - Enhanced database schema for mood score persistence and validation data storage

- Justification: Necessary for storing mood analysis results, delta detection history, and human validation data

**zod** (already used) - Runtime validation for mood analysis inputs and outputs

- Justification: Critical for ensuring data integrity in emotional analysis processing

## Integration Points

### Memory Extraction Pipeline Integration

- Enhanced significance scoring using mood analysis results
- Emotional context enrichment for extracted memories
- Delta-aware memory prioritization based on emotional transitions

### Validation System Integration

- Human validation workflow for mood score accuracy assessment
- Continuous learning from validation feedback
- Edge case identification and handling improvement

### Database Schema Extensions

- Mood score storage with confidence metrics and metadata
- Delta detection history with significance tracking
- Validation result storage for accuracy monitoring and bias analysis

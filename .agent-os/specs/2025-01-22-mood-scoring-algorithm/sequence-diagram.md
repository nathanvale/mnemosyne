# Mood Scoring Algorithm — Sequence Diagram and Summary

## Summary

Enhanced multi-dimensional mood analysis pipeline that converts conversation content and context into a robust MoodAnalysisResult (0–10 score, descriptors, confidence). It integrates delta detection, relationship-aware context, confidence calibration, validation feedback loops, and persistence for analytics and downstream memory processing. Targets: ≥80% human agreement, ≥85% delta accuracy (<15% FPR), and sub-2s processing.

## Mermaid Sequence Diagram

```mermaid
sequenceDiagram
  autonumber
  participant Client as Caller (AI/Memory Pipeline)
  participant Analyzer as MoodScoringAnalyzer
  participant Ctx as EmotionalContextBuilder
  participant Sent as SentimentProcessor
  participant Psych as PsychologicalIndicatorAnalyzer
  participant Rel as RelationshipContextAnalyzer
  participant Conf as ConfidenceCalculator
  participant Delta as DeltaDetector
  participant Val as ValidationFramework
  participant DB as @studio/db (Persistence)
  participant Log as @studio/logger

  Client->>Analyzer: analyzeMood(content, baseContext)
  Analyzer->>Ctx: buildEmotionalContext(participant, conversation)
  Ctx-->>Analyzer: EmotionalContext
  Analyzer->>Sent: analyzePositive/Negative + mixed(content)
  Sent-->>Analyzer: SentimentAnalysis
  Analyzer->>Psych: analyzeCoping/Resilience/Stress(...)
  Psych-->>Analyzer: PsychologicalIndicators
  Analyzer->>Rel: analyzeParticipantDynamics(...)
  Rel-->>Analyzer: RelationshipDynamics
  Analyzer->>Analyzer: calculateMoodScore(weights: 35/25/20/15/5)
  Analyzer->>Conf: generateConfidenceScore(analysis)
  Conf-->>Analyzer: ConfidenceScore (+uncertainty)
  Analyzer->>Delta: detectConversationalDeltas(messages)
  Delta-->>Analyzer: ConversationalDelta[]
  Analyzer->>DB: storeMoodAnalysis(conversationId, analysis)
  DB-->>Analyzer: ack
  Analyzer->>DB: trackMoodDeltas(participantId, deltas)
  DB-->>Analyzer: ack
  Analyzer->>Val: validateMoodScore(predicted, human?)
  Val-->>Analyzer: ValidationResult (+bias/trends)
  Analyzer->>DB: storeValidationResult(analysisId, validation)
  DB-->>Analyzer: ack
  Analyzer->>Log: structured logs (timings, weights, uncertainty)
  Analyzer-->>Client: MoodAnalysisResult + Deltas
```

## Notes

- Weighted scoring: 35% sentiment, 25% psychological, 20% relationship, 15% conversational, 5% historical.
- Delta thresholds: ≥1.5 significant; ≥2.0 sudden; transition types: gradual | sudden | recovery | decline.
- Edge cases: mixed emotions, ambiguity, high complexity; flagged with uncertainty.
- Persistence: mood results, deltas, and validation for trend analytics and calibration.

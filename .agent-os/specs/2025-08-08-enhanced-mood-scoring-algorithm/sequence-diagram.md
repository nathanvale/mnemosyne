# Enhanced Mood Scoring — Sequence Diagram and Summary

## Summary

Multi-dimensional mood analysis (35/25/20/15/5 weights) with delta detection, context integration, and validation. Outputs score, descriptors, confidence, and deltas for AI usage.

## Mermaid Sequence Diagram

```mermaid
sequenceDiagram
  autonumber
  participant Analyzer as MoodScoringAnalyzer
  participant Sent as Sentiment
  participant Psych as Psychological
  participant Rel as Relationship
  participant Conf as Confidence
  participant Delta as DeltaDetector

  Analyzer->>Sent: analyze(content)
  Sent-->>Analyzer: sentiment
  Analyzer->>Psych: indicators(content, convo)
  Psych-->>Analyzer: psychological
  Analyzer->>Rel: dynamics(participants)
  Rel-->>Analyzer: relationship
  Analyzer-->>Analyzer: weighted score (35/25/20/15/5)
  Analyzer->>Conf: assess(analysis)
  Conf-->>Analyzer: confidence + uncertainty
  Analyzer->>Delta: detect(messages/timeline)
  Delta-->>Analyzer: deltas (type, magnitude)
  Analyzer-->>Caller: MoodAnalysisResult + deltas
```

## Notes

- Turning points and mood repair recognized; baselines used.

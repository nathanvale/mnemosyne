# Relational Timeline Construction — Sequence Diagram and Summary

## Summary

Build chronological emotional timelines with delta patterns, turning points, and relationship evolution for agent consumption.

## Mermaid Sequence Diagram

```mermaid
sequenceDiagram
  autonumber
  participant Builder as TimelineBuilder
  participant Memories as Memory Source
  participant Delta as DeltaAnalyzer
  participant Rel as Relationship Analyzer
  participant Summ as Summarizer

  Builder->>Memories: load(participant, window)
  Memories-->>Builder: memories[]
  Builder->>Delta: analyze(mood over time)
  Delta-->>Builder: patterns + deltas
  Builder->>Rel: analyze(interactions)
  Rel-->>Builder: milestones
  Builder->>Summ: summarize(events)
  Summ-->>Builder: agent-ready timeline
```

## Notes

- Filters by time window and significance; participant-scoped views.

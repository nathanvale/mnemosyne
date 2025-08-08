# Content Deduplication Engine — Sequence Diagram and Summary

## Summary

Hash + similarity-based dedup removes ~40% duplicates; merges similar memories while preserving metadata and audit trails; emits analytics.

## Mermaid Sequence Diagram

```mermaid
sequenceDiagram
  autonumber
  participant Ingest as Import/Memory Pipeline
  participant Hash as SHA-256 Hasher
  participant Similar as Similarity Analyzer
  participant Class as Classifier (exact/similar/none)
  participant Merge as Merger
  participant DB as Persistence
  participant Metrics as Analytics

  Ingest->>Hash: computeHash(memory)
  Hash-->>Ingest: hash
  Ingest->>DB: lookupByHash(hash)
  alt exact duplicate
    DB-->>Ingest: existing
    Ingest->>Class: classify(exact)
    Ingest->>Metrics: record duplicate
  else not found
    Ingest->>Similar: computeScore(memory)
    Similar-->>Ingest: score
    Ingest->>Class: classify(similar/none)
    alt similar
      Class->>Merge: plan/merge(memory, existing)
      Merge->>DB: upsert merged
    else none
      Ingest->>DB: insert memory
    end
  end
  Ingest->>Metrics: emit stats
```

## Notes

- Preserve participants, sources, confidence; keep merge history.
- Thresholds configurable; collision-safe hashing.

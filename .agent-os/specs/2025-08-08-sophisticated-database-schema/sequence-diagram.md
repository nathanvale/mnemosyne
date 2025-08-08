# Sophisticated Database Schema — Sequence Diagram and Summary

## Summary

A 54-table relational model for emotional intelligence workloads. It persists memories, mood scores/deltas, clustering, timelines, validation, and deduplication with strict referential integrity, composite indexes, and cascade rules to keep complex queries fast (<2s target) and data consistent.

## Sequence diagram

```mermaid
sequenceDiagram
  autonumber
  participant App as Services/Analyzers
  participant Prisma as Prisma Client
  participant DB as SQLite (Prisma)
  participant Mem as Memory/Message/Asset
  participant Mood as MoodScore/MoodFactor/MoodDelta
  participant Clus as MemoryCluster/Membership
  participant Temp as DeltaPattern/TurningPoint
  participant Valid as ValidationResult/QualityMetrics
  participant Dedup as ContentHash/Dedup

  App->>Prisma: createMemory(input)
  Prisma->>DB: INSERT Memory (FKs: context, relationships)
  DB-->>Prisma: memoryId

  App->>Prisma: attachMessage(memoryId, content)
  Prisma->>Dedup: compute SHA-256
  Dedup-->>Prisma: hash
  Prisma->>DB: SELECT * FROM ContentHash WHERE hash = ?
  alt first-seen
    Prisma->>DB: INSERT ContentHash(hash, firstSeenAt)
    Prisma->>DB: INSERT Message(memoryId, hash, ...)
  else duplicate
    Prisma->>DB: INSERT Message(memoryId, hash, ...) ON CONFLICT DO NOTHING
  end

  App->>Prisma: persistMood(memoryId, score, factors[])
  Prisma->>DB: INSERT MoodScore(memoryId, score, confidence, algoVersion)
  loop for each factor
    Prisma->>DB: INSERT MoodFactor(moodScoreId, type, weight, evidence)
  end
  App->>Prisma: recordDelta(memoryId, magnitude, direction, significance)
  Prisma->>DB: INSERT MoodDelta(memoryId, ... indexed by time, significance)

  App->>Prisma: clusterMembership(memoryId)
  Prisma->>DB: UPSERT MemoryCluster(...coherence)
  Prisma->>DB: UPSERT ClusterMembership(clusterId, memoryId, strength)

  App->>Prisma: saveTemporalPatterns(memoryId)
  Prisma->>DB: INSERT DeltaPattern(...)
  Prisma->>DB: INSERT TurningPoint(...)

  App->>Prisma: recordValidation(memoryId, verdict)
  Prisma->>DB: INSERT ValidationResult(memoryId, decision, agreement, notes)

  note over DB: Composite indexes support temporal, confidence, significance queries

  App->>Prisma: deleteMemory(memoryId)
  Prisma->>DB: DELETE FROM Memory WHERE id = ?
  DB-->>App: ON DELETE CASCADE removes dependent rows (54 tables guarded)
```

## Notes

- Referential integrity: ON DELETE CASCADE prevents orphans across 54 tables.
- Performance: composite indexes on (memoryId, createdAt), (score, confidence), (significance, createdAt) enable sub-2s queries.
- Dedup: SHA-256 content hash table + merge history ensures storage efficiency.
- Versioning: mood algorithm version tracked; analysis metadata captured for audits.
- Safety: all writes happen in transactions when part of batch operations.

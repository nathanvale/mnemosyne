# Memory Processing Engine — Sequence Diagram and Summary

## Summary

Claude-powered extraction pipeline with batching, salience-aware prompting, parsing, deduplication, and QA to produce high-confidence memories within cost limits.

## Mermaid Sequence Diagram

```mermaid
sequenceDiagram
  autonumber
  participant Orchestrator as Engine Orchestrator
  participant Batch as Batch Builder
  participant Claude as Claude Client
  participant Parser as Response Parser
  participant QA as QA/Validation
  participant Dedup as Dedup Engine
  participant DB as Persistence

  Orchestrator->>Batch: create batches(messages)
  loop batches
    Batch-->>Orchestrator: batch
    Orchestrator->>Claude: analyze(batch prompt)
    Claude-->>Orchestrator: response
    Orchestrator->>Parser: parse to memories
    Parser-->>Orchestrator: ExtractedMemory[]
    Orchestrator->>QA: score/validate
    QA-->>Orchestrator: filtered high-quality
    Orchestrator->>Dedup: check/merge
    Dedup->>DB: upsert
    DB-->>Dedup: ack
  end
  Orchestrator-->>Caller: summary + metrics
```

## Notes

- Rate limiting/backoff; 70%+ success and 8+ confidence goals.

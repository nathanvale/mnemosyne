# Test Suite Transaction Isolation — Sequence Diagram and Summary

## Summary

Eliminate 28 failing tests by adding optional transaction context to storage services and TestDataFactory, ensuring that Memory created within a transaction is visible to dependent calls. Align mis-specified expectations and fix significance precision. Outcome: zero failing tests with robust, isolated, and deterministic integration flows.

## Mermaid Sequence Diagram

```mermaid
sequenceDiagram
  autonumber
  participant Dev as Developer/CI
  participant Test as Test (Vitest/Wallaby)
  participant Factory as TestDataFactory
  participant Tx as Prisma Transaction (tx)
  participant Store as Storage Services
  participant DB as @studio/db
  participant Log as @studio/logger

  Dev->>Test: run integration tests
  Test->>Factory: createCompleteTestData()
  Factory->>DB: $transaction(callback)
  activate Tx
  Tx-->>Factory: tx context
  Factory->>Tx: create Memory
  Tx-->>Factory: Memory{id}
  Factory->>Store: storeMoodScore(memoryId, data, { tx })
  Store->>Tx: validate Memory exists within tx
  Tx-->>Store: ok
  Store->>Tx: insert MoodScore
  Tx-->>Store: MoodScore{id}
  Factory-->>Test: fixtures { Memory, MoodScore }
  Test->>Store: storeMoodDelta(memoryId, delta, { tx? })
  Store->>Tx: insert MoodDelta (uses tx if provided)
  Tx-->>Store: ack
  deactivate Tx
  Test->>Store: validate calculations (precision fixed)
  Store-->>Test: results
  Test-->>Dev: 0 failing tests
```

## Notes

- All storage methods accept optional { tx }: MoodScore, MoodDelta, ValidationResult, DeltaHistory.
- TestDataFactory never returns null; validates and logs failures; optional retries for transient issues.
- Align expectations to actual business logic; do not change core behavior to fit tests.
- Precision: standardize rounding to avoid off-by-0.01 failures.

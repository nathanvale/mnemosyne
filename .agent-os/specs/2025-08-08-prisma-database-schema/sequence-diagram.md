# Prisma Database Schema — Sequence Diagram and Summary

## Summary

Prisma schema with core Message/Link/Asset plus emotional intelligence models (Memory, MoodScore, MoodDelta, clusters). Generated client used by packages.

## Mermaid Sequence Diagram

```mermaid
sequenceDiagram
  autonumber
  participant App as @studio/*
  participant Prisma as Prisma Client
  participant DB as SQLite

  App->>Prisma: query/mutate models
  Prisma->>DB: SQL
  DB-->>Prisma: rows
  Prisma-->>App: typed results
```

## Notes

- Content hash unique constraints; relations with cascade deletes.

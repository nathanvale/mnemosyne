# Memory Schema Definition — Sequence Diagram and Summary

## Summary

Unified schema across memory, emotional context, relationships, validation, and temporal analysis; aligned to DB tables; validated with Zod and used across packages.

## Mermaid Sequence Diagram

```mermaid
sequenceDiagram
  autonumber
  participant Consumer as Packages (@studio/*)
  participant Schema as @studio/schema (Types + Zod)
  participant DB as @studio/db (Prisma)

  Consumer->>Schema: import interfaces + zod
  Consumer->>Schema: validate(data)
  Schema-->>Consumer: parsed or errors
  Consumer->>DB: persist(entities)
  DB-->>Consumer: ack
```

## Notes

- 1,184+ lines of types; 54 DB tables alignment.

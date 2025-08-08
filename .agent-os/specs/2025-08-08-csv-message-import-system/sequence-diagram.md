# CSV Message Import — Sequence Diagram and Summary

## Summary

Streamed CSV import with row validation, SHA-256 dedup, transactional batches, and real-time progress metrics.

## Mermaid Sequence Diagram

```mermaid
sequenceDiagram
  autonumber
  participant CLI as CLI Importer
  participant CSV as Parser (stream)
  participant Hash as SHA-256
  participant Session as Import Session
  participant DB as Prisma
  participant Log as Progress/Errors

  CLI->>CSV: open(file)
  loop each row
    CSV-->>CLI: row
    CLI->>Hash: contentHash(ts,sender,senderId,msg,assets)
    Hash-->>CLI: hash
    CLI->>Session: seen(hash)?
    alt seen
      Session-->>CLI: yes
      CLI->>Log: skip duplicate
    else new
      Session-->>CLI: no
      CLI->>DB: upsert message (batched tx)
      alt ok
        DB-->>CLI: ack
      else error
        DB-->>CLI: fail
        CLI->>Log: record row error
      end
    end
    CLI->>Log: update counters
  end
  CLI-->>User: summary (processed/imported/skipped, errors)
```

## Notes

- Unique constraints enforce DB-level dedup.
- Configurable batch size; continue-on-error.

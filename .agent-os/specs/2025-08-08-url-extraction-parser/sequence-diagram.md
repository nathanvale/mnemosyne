# URL Extraction Parser — Sequence Diagram and Summary

## Summary

A robust URL extraction pipeline that scans message content, normalizes URLs, deduplicates via canonical keys, persists link-message relations, and emits analytics. Designed for batch throughput with transactional safety and accurate, normalized link storage.

## Sequence diagram

```mermaid
sequenceDiagram
  autonumber
  participant Batch as Batch Orchestrator
  participant Extract as Regex Extractor
  participant Norm as URL Normalizer
  participant Dedup as Deduplicator
  participant DB as Prisma/DB
  participant Link as Link Table
  participant Assoc as MessageLink Association
  participant Analyt as Analytics

  Batch->>Extract: load messages (stream)
  loop each message
    Extract-->>Batch: URLs[] (http(s), www.*)
    Batch->>Norm: normalize(URL)
    Norm-->>Batch: https://canonical.url
    Batch->>Dedup: lookup(canonical)
    Dedup->>DB: SELECT id FROM Link WHERE canonical = ?
    alt not found
      Batch->>DB: INSERT INTO Link(canonical, domain, firstSeenAt)
      DB-->>Batch: linkId
    else exists
      DB-->>Batch: linkId
    end
    Batch->>DB: INSERT INTO MessageLink(messageId, linkId) ON CONFLICT DO NOTHING
  end
  Batch->>Analyt: emit stats (counts, domains, density)
  Analyt-->>Batch: ack
```

## Notes

- Normalization: www → https, parameter sorting, fragment trimming, case normalization for host.
- Dedup: canonical field with unique index; conflict handling preserves relationships.
- Performance: batch-size tuning + transactions; indexes on (messageId, linkId) and (canonical).
- Scope: extraction/normalization/dedup/storage; no scraping/content fetching.

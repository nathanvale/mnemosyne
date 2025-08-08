# Mood Context Token Generation — Sequence Diagram and Summary

## Summary

Tokenization engine converts mood analysis into agent-ready tokens at basic/standard/detailed levels with caching for sub-200ms responses.

## Mermaid Sequence Diagram

```mermaid
sequenceDiagram
  autonumber
  participant Request as Agent Request
  participant Tokenizer as MoodContextTokenizer
  participant Cache as Cache
  participant Analyzer as Mood Data Sources

  Request->>Tokenizer: generate(participant, level)
  Tokenizer->>Cache: get(key)
  alt hit
    Cache-->>Tokenizer: tokens
  else miss
    Tokenizer->>Analyzer: fetch mood, deltas, baselines
    Analyzer-->>Tokenizer: data
    Tokenizer-->>Tokenizer: assemble descriptors + trajectory
    Tokenizer->>Cache: set(key, tokens)
  end
  Tokenizer-->>Request: tokens
```

## Notes

- Relevance filtering by goal; multi-level caching with >80% hit rates.

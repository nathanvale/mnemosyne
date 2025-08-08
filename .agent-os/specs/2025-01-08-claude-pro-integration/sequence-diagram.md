# Claude Pro Integration — Sequence Diagram and Summary

## Summary

Integrate Anthropic Claude into @studio/memory via mood-aware prompts, rate limiting, robust error handling, and response parsing to ExtractedMemory. Includes usage/cost tracking and thorough tests with MSW mocks.

## Mermaid Sequence Diagram

```mermaid
sequenceDiagram
  autonumber
  participant App as Memory Pipeline
  participant Builder as PromptBuilder (mood-aware)
  participant Rate as RateLimiter/Queue
  participant Claude as Anthropic SDK
  participant Parser as ResponseParser
  participant Log as Logger/Cost Estimator

  App->>Builder: buildPrompt(messages, mood/deltas/context)
  Builder-->>App: prompt payload
  App->>Rate: schedule(prompt)
  Rate->>Claude: createMessage(prompt)
  Claude-->>Rate: response
  Rate-->>App: response
  App->>Parser: parse(response)
  Parser-->>App: ExtractedMemory[] + confidence
  App->>Log: tokens, costs, retries, errors
  App-->>Caller: results
```

## Notes

- Retry with exponential backoff on 429/5xx; budget alerts.
- Batch processing with salience filtering (deltas) to reduce tokens.
- Strong schema validation of Claude output before acceptance.

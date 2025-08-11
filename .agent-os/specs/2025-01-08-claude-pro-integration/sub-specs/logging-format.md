# Logging Format Specification

> Version: 1.0.0
> Created: 2025-08-11
> Scope: Structured logging format and PII scrubbing requirements for LLM integration

_Glossary Reference_: See [../glossary.md](../glossary.md) for term definitions.

## Overview

This document defines the required logging format, fields, and PII scrubbing guarantees for the LLM integration. All log events must conform to this schema to ensure consistent observability and security.

## Minimal Log Envelope (Formal Schema)

All log events MUST include these exact fields:

```typescript
interface LogEnvelope {
  // REQUIRED fields (must always be present)
  timestamp: string // ISO 8601 format (e.g., "2025-01-08T12:34:56.789Z")
  level: LogLevel // "error" | "warn" | "info" | "debug"
  requestId: string // UUID v4 or "system" for system events
  provider: string // "claude" | "openai" | provider name
  model: string // Model identifier (e.g., "claude-3-opus-20240229")
  event: string // Canonical snake_case event (see table below)

  // OPTIONAL fields (include when applicable)
  errorType?: ErrorType // Taxonomy value from error-mapping.md
  attempt?: number // Retry attempt number (1-based)
  durationMs?: number // Operation duration in milliseconds
  costMicroUSD?: number // Cost in micro-USD (integer)
  budgetUtilization?: number // Budget usage percentage (0-100)
  circuitState?: 'closed' | 'open' | 'half_open' // Only on circuit_state_change or diagnostics
  usageEstimated?: boolean // True when token usage is heuristically estimated (provider omission)
  derivedRetry?: boolean // True when retryAfterMs derived from reset window headers
  traceId?: string // Distributed tracing ID

  // Additional context (MUST NOT include deprecated fields)
  context?: LogContext
}

interface LogContext {
  tokenUsage?: {
    input: number
    output: number
    total: number
  }
  retryAttempt?: number
  messageCount?: number
  memoryCount?: number
  previousState?: 'closed' | 'open' | 'half_open' // For circuit state changes
  failureRate?: number // For circuit state changes
  inserted?: number // persistence_batch_commit
  updated?: number // persistence_batch_commit
  skipped_duplicate?: number // persistence_batch_commit
  batchSize?: number // persistence_batch_commit / rollback
  projectedCost?: number // budget_rejection
  shortfall?: number // budget_rejection
  spentUSD?: number // budget_threshold
  budgetUSD?: number // budget_threshold
  firstTokenMs?: number // first_token_latency
  success?: boolean // parsing_repair_attempt / stream_repair_attempt
  reason?: string // fallback_activated / budget_rejection
  from?: string // fallback_activated
  to?: string // fallback_activated
  windowSize?: number // circuit_state_change
  retryAfterMs?: number // provider_call_error (rate limit backoff hint)
  // Flags (reflected also at top-level when appropriate)
  usageEstimated?: boolean // mirrored convenience flag
  derivedRetry?: boolean // mirrored convenience flag
  [key: string]: any // Additional safe fields
}

type LogLevel = 'error' | 'warn' | 'info' | 'debug'

type ErrorType =
  | 'rate_limit'
  | 'timeout'
  | 'authentication'
  | 'invalid_request'
  | 'parsing'
  | 'budget_exceeded'
  | 'policy'
  | 'transient'
  | 'unknown'
```

## PII Scrubbing Guarantees

**CRITICAL**: All log output MUST be scrubbed of PII/secrets BEFORE emission.

### Removal Rules (Apply in Order)

1. **API Keys**: Remove entirely from logs (don't even log redacted version)
2. **Sensitive Fields**: Fields named `key`, `token`, `secret`, `password` → value = `[REDACTED]`
3. **Pattern Redaction**: Apply regex patterns below for content scrubbing

### Redaction Patterns

| PII Type                       | Detection Pattern                                                                             | Replacement       | Status             |
| ------------------------------ | --------------------------------------------------------------------------------------------- | ----------------- | ------------------ |
| API Keys (OpenAI)              | `/sk-[a-zA-Z0-9]{48}/`                                                                        | `[REDACTED_KEY]`  | Active             |
| API Keys (Anthropic)           | `/sk-ant-[a-zA-Z0-9]{40,}/`                                                                   | `[REDACTED_KEY]`  | Active             |
| Email Addresses                | `/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/`                                            | `[EMAIL]`         | Active             |
| Phone Numbers                  | `/\+?[0-9]{1,4}?[-.\s]?\(?[0-9]{1,3}?\)?[-.\s]?[0-9]{1,4}[-.\s]?[0-9]{1,4}[-.\s]?[0-9]{1,9}/` | `[PHONE]`         | Active             |
| URLs With Embedded Credentials | `/https?:\/\/[^:]+:[^@]+@[^\s]+/`                                                             | `[URL_WITH_AUTH]` | Active             |
| IP Addresses                   | `/\b(?:[0-9]{1,3}\.){3}[0-9]{1,3}\b/`                                                         | `[IP]`            | Active             |
| Credit Card Numbers            | `/\b(?:[0-9]{4}[-\s]?){3}[0-9]{4}\b/`                                                         | `[CARD]`          | Active             |
| SSN                            | `/\b[0-9]{3}-[0-9]{2}-[0-9]{4}\b/`                                                            | `[SSN]`           | Active             |
| Person Names                   | (NER-based)                                                                                   | `[NAME]`          | Deferred (roadmap) |

### Scrubbing Implementation

```typescript
class LogScrubber {
  private patterns: Map<string, RegExp> = new Map([
    ['apiKeyOpenAI', /sk-[a-zA-Z0-9]{48}/g],
    ['apiKeyAnthropic', /sk-ant-[a-zA-Z0-9]{40,}/g],
    ['email', /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g],
    [
      'phone',
      /\+?[0-9]{1,4}?[-.\s]?\(?[0-9]{1,3}?\)?[-.\s]?[0-9]{1,4}[-.\s]?[0-9]{1,4}[-.\s]?[0-9]{1,9}/g,
    ],
    ['urlCred', /https?:\/\/[^:]+:[^@]+@[^\s]+/g],
    ['ip', /\b(?:[0-9]{1,3}\.){3}[0-9]{1,3}\b/g],
    ['card', /\b(?:[0-9]{4}[-\s]?){3}[0-9]{4}\b/g],
    ['ssn', /\b[0-9]{3}-[0-9]{2}-[0-9]{4}\b/g],
  ])

  scrub(text: string): string {
    let scrubbed = text

    // Apply all patterns
    scrubbed = scrubbed.replace(
      this.patterns.get('apiKeyOpenAI')!,
      '[REDACTED_KEY]',
    )
    scrubbed = scrubbed.replace(
      this.patterns.get('apiKeyAnthropic')!,
      '[REDACTED_KEY]',
    )
    scrubbed = scrubbed.replace(this.patterns.get('email')!, '[EMAIL]')
    scrubbed = scrubbed.replace(this.patterns.get('phone')!, '[PHONE]')
    scrubbed = scrubbed.replace(
      this.patterns.get('urlCred')!,
      '[URL_WITH_AUTH]',
    )
    scrubbed = scrubbed.replace(this.patterns.get('ip')!, '[IP]')
    scrubbed = scrubbed.replace(this.patterns.get('card')!, '[CARD]')
    scrubbed = scrubbed.replace(this.patterns.get('ssn')!, '[SSN]')

    return scrubbed
  }

  scrubObject(obj: any): any {
    if (typeof obj === 'string') {
      return this.scrub(obj)
    }

    if (Array.isArray(obj)) {
      return obj.map((item) => this.scrubObject(item))
    }

    if (obj && typeof obj === 'object') {
      const scrubbed: any = {}
      for (const [key, value] of Object.entries(obj)) {
        // Scrub known sensitive field names
        if (
          key.toLowerCase().includes('key') ||
          key.toLowerCase().includes('token') ||
          key.toLowerCase().includes('secret')
        ) {
          scrubbed[key] = '[REDACTED]'
        } else {
          scrubbed[key] = this.scrubObject(value)
        }
      }
      return scrubbed
    }

    return obj
  }
}
```

## Log Event Examples

### Canonical Event Naming

Events MUST use lower_snake_case. Core required events and minimum context:

| Event                      | When                            | Required Context Keys                                            |
| -------------------------- | ------------------------------- | ---------------------------------------------------------------- |
| provider_call_start        | Before provider request         | model, provider                                                  |
| provider_call_complete     | After provider response success | tokenUsage, durationMs, costMicroUSD                             |
| provider_call_error        | After classified non-success    | errorType, attempt                                               |
| parsing_repair_attempt     | After each repair attempt       | attempt, success:boolean                                         |
| parsing_repair_failure     | Final parsing failure           | errorType=parsing                                                |
| fallback_activated         | On fallback                     | from, to, reason                                                 |
| circuit_state_change       | Circuit transition              | previousState, circuitState (TOP-LEVEL), failureRate, windowSize |
| budget_threshold           | On threshold cross              | budgetUtilization, spentUSD, budgetUSD                           |
| budget_rejection           | On budget_exceeded              | projectedCost, shortfall                                         |
| persistence_batch_commit   | Successful transaction          | batchSize, inserted, updated, skipped_duplicate                  |
| persistence_batch_rollback | Rollback                        | reason                                                           |
| first_token_latency        | First streaming chunk           | firstTokenMs                                                     |
| stream_repair_attempt      | Streaming repair attempt        | success:boolean                                                  |

Any new event requires documentation update.

### Successful Provider Call (provider_call_complete)

```json
{
  "timestamp": "2025-01-08T12:34:56.789Z",
  "level": "info",
  "requestId": "550e8400-e29b-41d4-a716-446655440000",
  "provider": "claude",
  "model": "claude-3-opus-20240229",
  "event": "provider_call_complete",
  "durationMs": 845,
  "costMicroUSD": 125000,
  "context": {
    "tokenUsage": {
      "input": 1500,
      "output": 250,
      "total": 1750
    },
    "memoryCount": 3
  }
}
```

### Rate Limit Error (provider_call_error with errorType=rate_limit)

```json
{
  "timestamp": "2025-01-08T12:35:12.123Z",
  "level": "warn",
  "requestId": "550e8400-e29b-41d4-a716-446655440001",
  "provider": "openai",
  "model": "gpt-4",
  "event": "provider_call_error",
  "errorType": "rate_limit",
  "attempt": 2,
  "context": {
    "retryAttempt": 2,
    "retryAfterMs": 5000,
    "message": "Rate limit exceeded. Retry after [REDACTED] seconds"
  }
}
```

### Circuit Breaker State Change (circuit_state_change)

```json
{
  "timestamp": "2025-01-08T12:36:00.000Z",
  "level": "warn",
  "requestId": "550e8400-e29b-41d4-a716-446655440002",
  "provider": "claude",
  "model": "claude-3-opus-20240229",
  "event": "circuit_state_change",
  "circuitState": "open",
  "context": {
    "previousState": "closed",
    "failureRate": 0.6,
    "windowSize": 20
  }
}
```

### Budget Threshold Warning (budget_threshold)

```json
{
  "timestamp": "2025-01-08T15:00:00.000Z",
  "level": "warn",
  "requestId": "system",
  "provider": "all",
  "model": "all",
  "event": "budget_threshold",
  "context": {
    "budgetUtilization": 90,
    "spentUSD": 9.0,
    "budgetUSD": 10.0,
    "windowStart": "2025-01-08T00:00:00.000Z"
  }
}
```

## Structured Logging Integration

### Logger Interface

```typescript
interface StructuredLogger {
  error(envelope: LogEnvelope): void
  warn(envelope: LogEnvelope): void
  info(envelope: LogEnvelope): void
  debug(envelope: LogEnvelope): void

  // Helper for creating consistent envelopes
  createEnvelope(
    level: LogLevel,
    event: string,
    context?: Partial<LogEnvelope>,
  ): LogEnvelope
}

class LLMLogger implements StructuredLogger {
  private scrubber = new LogScrubber()

  constructor(
    private requestId: string,
    private provider: string,
    private model: string,
  ) {}

  createEnvelope(
    level: LogLevel,
    event: string,
    context?: Partial<LogEnvelope>,
  ): LogEnvelope {
    return {
      timestamp: new Date().toISOString(),
      level,
      requestId: this.requestId,
      provider: this.provider,
      model: this.model,
      event,
      ...context,
    }
  }

  private emit(envelope: LogEnvelope): void {
    // Scrub PII before emission
    const scrubbed = this.scrubber.scrubObject(envelope)

    // Emit to configured transport (console, file, service)
    console.log(JSON.stringify(scrubbed))
  }

  error(envelope: LogEnvelope): void {
    this.emit({ ...envelope, level: 'error' })
  }

  warn(envelope: LogEnvelope): void {
    this.emit({ ...envelope, level: 'warn' })
  }

  info(envelope: LogEnvelope): void {
    this.emit({ ...envelope, level: 'info' })
  }

  debug(envelope: LogEnvelope): void {
    this.emit({ ...envelope, level: 'debug' })
  }
}
```

## Log Retention & Compliance

### Retention Policy

- **Error logs**: 90 days
- **Warn logs**: 30 days
- **Info logs**: 7 days
- **Debug logs**: 24 hours (production disabled by default)

### Compliance Requirements

- No PII in logs (enforced by scrubber)
- Request IDs for full traceability
- Cost tracking for budget compliance
- Error classification for incident response
- Timestamp precision for audit trails

## Testing Requirements

### Log Scrubbing Tests

```typescript
describe('LogScrubber', () => {
  const scrubber = new LogScrubber()

  it('redacts API keys', () => {
    const input =
      'Using key sk-abcd1234efgh5678ijkl9012mnop3456qrst7890uvwx1234'
    const output = scrubber.scrub(input)
    expect(output).toBe('Using key [REDACTED_KEY]')
  })

  it('redacts emails', () => {
    const input = 'Contact user@example.com for details'
    const output = scrubber.scrub(input)
    expect(output).toBe('Contact [EMAIL] for details')
  })

  it('scrubs nested objects', () => {
    const input = {
      message: 'Error from user@example.com',
      apiKey: 'sk-secret123',
      context: {
        url: 'https://api.example.com/endpoint',
      },
    }
    const output = scrubber.scrubObject(input)
    expect(output.message).toBe('Error from [EMAIL]')
    expect(output.apiKey).toBe('[REDACTED]')
    expect(output.context.url).toBe('[URL_WITH_AUTH]')
  })
})
```

### Log Format Tests

```typescript
describe('LLMLogger', () => {
  it('creates valid log envelope', () => {
    const logger = new LLMLogger(
      '550e8400-e29b-41d4-a716-446655440000',
      'claude',
      'claude-3-opus-20240229',
    )

    const envelope = logger.createEnvelope('info', 'provider_call_complete', {
      durationMs: 100,
      costMicroUSD: 1234,
    })

    expect(envelope).toMatchObject({
      timestamp: expect.stringMatching(/^\d{4}-\d{2}-\d{2}T/),
      level: 'info',
      requestId: '550e8400-e29b-41d4-a716-446655440000',
      provider: 'claude',
      model: 'claude-3-opus-20240229',
      event: 'provider_call_complete',
      durationMs: 100,
      costMicroUSD: 1234,
    })
  })
})
```

## Implementation Checklist

- [ ] Implement LogScrubber class with all PII patterns
- [ ] Create StructuredLogger interface implementation
- [ ] Add scrubbing to all log emission points
- [ ] Validate envelope schema at emission
- [ ] Add request ID threading through pipeline
- [ ] Configure log transports (console, file, service)
- [ ] Add log level filtering based on environment
- [ ] Implement log retention policies
- [ ] Add compliance audit logging
- [ ] Create comprehensive test suite
- [ ] Assert absence of deprecated fields (ts, budgetUtilizationPct, additional) in emitted logs (test)
- [ ] Validate event names against canonical list (test)
- [ ] Enforce required context keys per event (provider_call_complete: durationMs, costMicroUSD, tokenUsage; persistence_batch_commit: batchSize, inserted, updated, skipped_duplicate; etc.)
- [ ] Add negative test ensuring no non-canonical events appear
- [ ] Prohibit raw prompt / full conversation logging (tests assert absence; only token counts & redacted placeholders allowed)
- [ ] Assert scheduledDelayMs is NEVER logged (only retryAfterMs when provided by provider)

## Deprecated (Forbidden) Fields

These fields MUST NOT appear in any new log output (tests enforce absence): `ts`, `budgetUtilizationPct`, `additional`.

## Provider Retry Header Mapping

To ensure deterministic backoff, `retryAfterMs` MUST always reflect provider hints when present; exponential backoff is only used when no header / hint exists. Conversion rules:

| Provider                   | Raw Header / Field                               | Unit Source                | Transformation                        | Logged Field                    | Notes                                   |
| -------------------------- | ------------------------------------------------ | -------------------------- | ------------------------------------- | ------------------------------- | --------------------------------------- |
| OpenAI                     | `Retry-After`                                    | Seconds (integer or float) | multiply by 1000, round to nearest ms | context.retryAfterMs            | Precedence over local schedule          |
| Anthropic                  | `retry-after`                                    | Seconds                    | multiply by 1000, round to nearest ms | context.retryAfterMs            | Header name lower-case variant accepted |
| Anthropic (rate window)    | `x-ratelimit-reset-requests`                     | ISO / epoch seconds        | parse; compute (reset - now) ms if >0 | context.retryAfterMs (fallback) | Only if `retry-after` absent            |
| OpenAI (rate limit object) | Rate-limit error JSON `retry_after` (if present) | Seconds                    | multiply by 1000                      | context.retryAfterMs            | Some JSON error payloads include this   |

Rules:

1. If multiple hints present, choose smallest positive non-zero ms.
2. `scheduledDelayMs` (internal jittered delay) MUST NOT be logged; tests assert absence.
3. When header present, override exponential formula entirely (no additive jitter).
4. Log a boolean `context.derivedRetry=true` ONLY when using computed window fallback (not when direct header present).
5. When token usage is estimated (provider omitted usage tokens), set `usageEstimated=true` (top-level) and optionally mirror within context.tokenUsage block if present.

## Streaming First Token Clarification

Ignore non-content / administrative streaming events (e.g., OpenAI thread.run.\*, Anthropic tool blocks) when determining `firstTokenMs`. Use the timestamp of the first chunk containing assistant content text bytes.

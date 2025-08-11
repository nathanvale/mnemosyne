# Tests Specification

_Glossary Reference_: See [../glossary.md](../glossary.md) for canonical naming, schema, and metrics labels used in tests.

This is the tests coverage details for the spec detailed in @.agent-os/specs/2025-01-08-claude-pro-integration/spec.md

> Created: 2025-01-08
> Version: 1.3.0 (reconciled 2025-08-11) – adds hashing/idempotency, deterministic interfaces, budget reset tests

Alignment Note: Canonical names (`ClaudeProvider`, `OpenAIProvider`, `LLMProviderFactory`, `ExtractionLLMProcessor`, `MemoryLLMResponseParser`) and plural `memories` schema are assumed. Deprecated names must not appear in new tests.

## Test Coverage

### Unit Tests

### ClaudeProvider

- API key validation (present/missing)
- Connection timeout handling
- Message send parameters (temperature, maxTokens, stop sequences)
- Streaming response handling (chunk sequence integrity)
- Usage statistics tracking and reset
- Error mapping (429, 401, 5xx, malformed)

### OpenAIProvider

- Token counting (tiktoken vs heuristic)
- JSON mode vs streaming mutually exclusive path
- Error classification parity with ClaudeProvider

### PromptBuilder

- Mood-aware prompt generation with varied mood scores
- System prompt with emotional context
- Extraction instructions injection (schema version pin)
- Token optimization (salience pruning) respects cap
- Template version selection & custom template override
- Empty / malformed input handling

### RateLimiter

- Burst within limits
- Queue when limits exceeded
- Predictive projection gating
- Exponential backoff sequence (deterministic jitter injection)
- Header parsing (Anthropic) + synthetic metrics (OpenAI)
- Queue timeout & cancellation

### ExtractionLLMProcessor

- Happy path multi-memory extraction
- Emotional salience filtering thresholds
- Fallback provider activation (eligible errors only)
- Budget guard refusal pre-call
- Metrics emission (memory_llm_requests_total, memory_llm_tokens_total, memory_llm_cost_usd_total, memory_llm_latency_ms_summary, memory_llm_circuit_state, memory_llm_parser_repairs_total)
- Statistics aggregation accuracy

### MemoryLLMResponseParser

- Valid plural schema parsing
- Malformed JSON → corrective retry success
- Unrecoverable malformed → null & classification
- Streaming assembly (balanced braces, quote state)
- Confidence normalization (0–1)
- Adapter handling (singular legacy -> plural)
- Metrics hooks for memory_llm_parser_repairs_total increments on each repair attempt

### LLMErrorHandler

- Error classification matrix coverage
- Retry policy adherence (attempt caps)
- Non-retryable immediate fail
- Fallback decision logic
- Sanitized logging (no API keys / PII)

### LLMConfigLoader

- Env var precedence & defaults
- Missing required key failure
- Fallback provider disabled (`none`) semantics
- Daily budget parsing & zero disable behavior

### CostEstimator

- Catalog load success / missing catalog failure
- Cost calculation per model correctness
- Heuristic token estimate variance (<5%) test
- Budget utilization thresholds (70/90/100%) event emission
- Reset at UTC midnight simulation

### PersistenceAdapter

- Batch success (all inserted)
- Mixed operations (inserted + updated)
- Duplicate detection (skipped_duplicate) via stable signature
- Confidence merge harmonic mean correctness (edge: identical confidences, extremes 0/1)
- Transaction rollback on simulated DB error (verifies no side effects)
- Idempotent re-run yields only skipped_duplicate
  - Normalization pipeline produces identical hash for case/punctuation/whitespace variants
  - Semantic content change (word insertion) yields new hash
- Metrics emission (memory_llm_persist_batches_total, memory_llm_persist_memories_total, memory_llm_dedup_candidates_total, memory_llm_confidence_merges_total, memory_llm_persist_latency_ms_summary)
- Structured error returned instead of throw on business-rule conflicts

### Integration Tests

### Provider Integration (Mocked)

- End-to-end extraction (Claude primary)
- Primary failure → OpenAI fallback
- Rate limit queue draining order (FIFO)
- Malformed → repair → success pipeline
- Budget exceeded refusal (no provider call)
  - Budget midnight reset (advance injected clock over UTC boundary -> utilization gauge resets; thresholds re-arm)

### Mood Scoring Integration

- Full pipeline with real mood scorer/delta detector mocks
- Salience pruning when token estimate > cap

### Database Integration

- Save multiple memories transaction commit
- Partial failure rollback strategy (all-or-nothing) verified
- Idempotent second run (no duplicate inserts; all skipped_duplicate)
- Dedup merge path (near-identical content merges & updates confidence)
- Confidence harmonic mean merge validated against formula
- Metrics asserted (persist\_\* counters, memory_llm_confidence_merges_total)

### Feature Tests

### Memory Extraction Workflow

- Conversation → multiple memories output
- Multi-participant conversation handling
- Long conversation truncation & salience retention
- Emotional trajectory influence on selection
- Confidence harmonic mean merge behavior
- Persistence applied after successful parse; metrics snapshot captured

### Rate Limiting Scenarios

- 429 backoff then success
- Predictive projection throttling triggers
- Circuit breaker open → half-open → close cycle

### Error Recovery Workflows

- Network timeout classification & retry
- Authentication failure (no retry)
- Invalid request (model not found) fallback eligibility
- Parsing failure fallback path (only after corrective retry fail)
- Persistence not attempted on unrecoverable parsing failure

### Mocking Requirements

### Anthropic API

- Success, 429 with reset header, 401, 500, timeout simulation, streaming chunks (delta + final)

### OpenAI API

- Success (JSON mode), streaming, 429, 401, 500, timeout

### Environment Variables

```typescript
process.env.ANTHROPIC_API_KEY = 'test-api-key'
process.env.OPENAI_API_KEY = 'test-openai-key'
process.env.MEMORY_LLM_PRIMARY = 'claude'
process.env.MEMORY_LLM_FALLBACK = 'openai'
process.env.MEMORY_LLM_MODEL_CLAUDE = 'claude-3-sonnet-20240229'
process.env.MEMORY_LLM_MODEL_OPENAI = 'gpt-4-turbo-preview'
process.env.MEMORY_LLM_MAX_RETRIES = '3'
process.env.MEMORY_LLM_TIMEOUT_MS = '5000'
process.env.MEMORY_LLM_MAX_OUTPUT_TOKENS = '800'
process.env.MEMORY_LLM_DAILY_BUDGET_USD = '5'
```

### MSW Handlers (Illustrative Snippet)

```typescript
// ...existing handlers with plural `memories` field ...
```

## Test Data Fixtures

### Conversation Fixtures

(As before; ensure diversity for emotional variance.)

### Expected Responses

```typescript
export const expectedMemories = {
  highConfidence: {
    id: 'mem_test_1',
    confidence: 0.92,
    emotionalContext: {
      primaryEmotion: 'joy',
      intensity: 0.85,
      themes: ['excitement', 'anticipation'],
    },
  },
  lowConfidence: {
    id: 'mem_test_2',
    confidence: 0.45,
    emotionalContext: {
      primaryEmotion: 'neutral',
      intensity: 0.3,
      themes: [],
    },
  },
}
```

## Performance Testing

Latency SLO Scope: p50(memory_llm_latency_ms_summary{operation="total"}) <1200ms (directly instrumented total segment covering provider_call start → parsing end; persistence excluded). provider_call and parsing segment medians also asserted separately for diagnostics (non-SLO) to localize regressions.

Observational metrics (include persistence) – non-SLO but tracked:

- End-to-end single extraction median <1300ms
- memory_llm_persist_latency_ms_summary p95 <300ms (≤25 memories)

Tests must assert both segment SLO compliance and observational totals without conflation.

## Coverage Requirements

- Overall >80%
- Provider & parser modules ≥85%
- Error classification branches ≥85%
- Schema adapter tests ≥80%
- Persistence adapter ≥85%

## CI/CD Integration

- Add deterministic timing tests (mock Clock/RNG) for retry backoff intervals and circuit probe cadence
- Unit on each push
- Integration on PR
- Full suite (incl. adapters + performance smoke) pre-merge
- Coverage gate enforced; diff coverage tracked
- Persistence metrics tests part of required PR checks

## Hashing & Idempotency Test Plan

Unit:

- Given variants: "Great Day!", " great day!!! " produce identical normalized hash.
- Zero-width & control characters removal verified.
- Trailing punctuation stripping: "hello!!!" -> same hash as "hello".

Integration:

- Insert memory A; reprocess punctuation/whitespace variant -> skipped_duplicate count +1, no new row id.
- Insert semantic variant (adds a noun) -> new row; hashes differ.

Dual-Implementation Strategy Test:

- Introduce an injectable `HashStrategy` interface with two concrete implementations (WebCryptoSubtleHashStrategy, NodeCryptoHashStrategy) behind a test seam.
- Run the same normalization + hashing corpus through both strategies; assert identical 64-char lowercase hex outputs.
- Force fallback path in environments lacking `globalThis.crypto?.subtle` by dependency injection (not by mutating global state).

Corpus (MUST cover at minimum):

- Unicode composed vs decomposed: "café" (NFC) vs "cafe\u0301" (NFD) -> identical normalized/hash
- Excess internal whitespace: "great day" vs "great day" -> identical
- Leading/trailing whitespace: " hello world " vs "hello world" -> identical
- Zero-width chars: "hello\u200Bworld" -> normalized to "hello world" (single space)
- Trailing punctuation runs: "hello!!!" vs "hello"; "wow!?.." vs "wow"
- Internal punctuation preserved: "great — day; really?" remains unchanged internally
- Case differences: "Great Day" vs "great day"
- Semantic change baseline: add word "beach" -> different hash
- Control characters (\u0007 bell) removed

Any future normalization change MUST append corpus cases and update expected hashes.

## Deterministic Interfaces Usage Tests

Provide mock Clock returning incremental ms; validate:

- Retry delays follow exponential + jitter formula with injected RNG returning constant 0.5.
- Circuit half-open probes scheduled exactly every 2000ms simulated.
- Budget reset triggers when clock crosses UTC midnight boundary.

## Streaming First Token Instrumentation

Test harness captures dispatchTime and firstChunkTime via injected Clock.

- Simulate provider streaming: first chunk after 120ms -> latency segment recorded within tolerance.
- Assert memory_llm_latency_ms_summary includes a sample with operation="first_token" (count increments). Ensure no separate first_token summary metric exists.
- Collect distinct operation labels from emitted memory_llm_latency_ms_summary samples; assert exact set equals {provider_call, parsing, total, first_token}.

## Deterministic Memory Ordering

Tests MUST assert that the order of extracted memories is stable and deterministic:

- Given identical input conversation processed multiple times, resulting memory array order matches original appearance index (or explicitly documented strategy) each run.
- Parallel extraction scenarios (if any concurrency in parsing) MUST preserve ordering deterministically (e.g., stable sort by source index).
- Introduce a randomized scheduling test harness (mock async yields) to ensure ordering logic enforces stability.

## Negative Prompt Logging Test

- Execute representative extraction with known prompt fixture containing unique sentinel substrings (e.g., "SENTINEL_PROMPT_ABC123").
- Capture all emitted logs.
- Assert none contain raw prompt substrings (case-insensitive search) aside from allowed redacted placeholders and token counts.
- Add regression test that intentionally attempts to log raw prompt (simulated developer mistake) and lint/test step fails.

## Confidence Merge Helper

Tests MUST import the canonical pairwise function and fold sequentially; no array harmonic mean helper is permitted.

```typescript
import { mergeConfidence } from '../path/to/mergeConfidence'

describe('confidence merge (pairwise canonical)', () => {
  function fold(values: number[]): number {
    return values
      .slice(1)
      .reduce((acc, v) => mergeConfidence(acc, v), values[0])
  }
  it('pairwise folding matches expected two-value harmonic formula for 0.8 & 0.6 (exact 6dp)', () => {
    // Harmonic mean: 2*0.8*0.6 / (0.8+0.6) = 0.96/1.4 = 0.6857142857 → 0.685714
    expect(mergeConfidence(0.8, 0.6)).toBe(0.685714)
  })
  it('multi-value fold deterministic rounding exact for [0.8,0.6,0.7]', () => {
    // Step1 (0.8,0.6)=0.685714; Step2 merge with 0.7:
    // 2*0.685714*0.7/(0.685714+0.7)=0.960000 - tiny fp diff → 0.692784 after rounding
    expect(fold([0.8, 0.6, 0.7])).toBe(0.692784)
  })
  it('handles extremes and identicals', () => {
    expect(mergeConfidence(1, 0.1)).toBeGreaterThanOrEqual(0.1)
    expect(fold([0.7, 0.7, 0.7])).toBe(0.7)
  })
  it('undefined baseline uses default 0.5', () => {
    expect(mergeConfidence(undefined as any, 0.7)).toBe(0.583333)
  })
})
```

Edge cases covered:

- Extremes [1, 0.1]
- Identical values [0.7,0.7,0.7]
- Missing existing (undefined) -> baseline 0.5 + new value

## Budget Midnight Reset Scenario

1. Accumulate spend to 40% before 23:59:50 UTC.
2. Advance mock clock past 00:00:05 UTC.
3. Trigger next cost update; utilization recalculates from zero baseline.
4. Threshold alerts can fire again when crossing 70/90/100.

## Budget Equality Edge Scenario

1. Daily budget $1.00, spent $0.80.
2. Next request estimated cost $0.20 (exact remaining) -> allowed (strict > rule permits equality).
3. Utilization becomes 100%; single 100% threshold alert emitted.
4. Next request estimated cost $0.01 -> rejected (projected 1.01 > 1.00).
5. Assert no provider call on rejection; error classification budget_exceeded.
6. Metrics: memory_llm_budget_alerts_total{threshold="100"} incremented once only.
7. Logs: budget_threshold event present; rejection log includes shortfall.
8. Pass: Equality allowed; overshoot blocked; metrics/logs consistent.

## Negative Metrics Assertions (Planned Metrics Guard)

Tests MUST assert that no samples are observed for planned / not-yet-active metrics listed under "Planned (Not Yet Emitted) Metrics" in metrics-manifest.md:

- memory_llm_budget_atomic_failures_total
- memory_llm_queue_wait_ms_summary
- memory_llm_stream_repair_attempts_total
- memory_llm_stream_repair_failures_total
- memory_llm_context_component_tokens

Latency Operation Whitelist:

- After representative run, gather all operation labels for memory_llm_latency_ms_summary; fail test if any label outside whitelist appears.

Budget Alert Restart Idempotency:

- Simulate firing 70% and 90% alerts.
- Persist state (or simulate persistence layer).
- Restart process (new in-memory state). Reconstruct cost counters; ensure no duplicate 70%/90% alerts emitted before crossing 100% fresh.

Implementation guideline: Collect current metric names after exercising representative flows; fail if any planned names appear. This prevents premature instrumentation drift.

## Logging Deprecated Field & Canonical Event Tests

Add tests that:

1. Emit each canonical event (provider_call_start, provider_call_complete, provider_call_error, parsing_repair_attempt, parsing_repair_failure, fallback_activated, circuit_state_change, budget_threshold, budget_rejection, persistence_batch_commit, persistence_batch_rollback, first_token_latency, stream_repair_attempt) and assert presence of required context keys per logging-format.md.
2. Assert ABSENCE of deprecated fields: ts, budgetUtilizationPct, additional.
3. Assert no non-canonical events appear (enumerate whitelist and compare set of emitted event names).
4. Assert persistence_batch_commit includes batchSize, inserted, updated, skipped_duplicate.

### Event → Required Context Mapping (Enforced)

```typescript
const REQUIRED_EVENT_CONTEXT: Record<string, string[]> = {
  provider_call_start: ['model', 'provider'],
  provider_call_complete: ['durationMs', 'costMicroUSD', 'tokenUsage'],
  provider_call_error: ['errorType', 'attempt'],
  parsing_repair_attempt: ['attempt', 'success'],
  parsing_repair_failure: ['errorType'],
  fallback_activated: ['from', 'to', 'reason'],
  circuit_state_change: ['circuitState', 'previousState', 'failureRate'],
  budget_threshold: ['budgetUtilization', 'spentUSD', 'budgetUSD'],
  budget_rejection: ['projectedCost', 'shortfall'],
  persistence_batch_commit: [
    'batchSize',
    'inserted',
    'updated',
    'skipped_duplicate',
  ],
  persistence_batch_rollback: ['batchSize', 'reason'],
  first_token_latency: ['firstTokenMs'],
  stream_repair_attempt: ['success'],
}

// Test helper: diff actual context keys vs REQUIRED_EVENT_CONTEXT[event]
```

## Cost & Token Variance Sampling Window

For token and cost variance (<5% targets), tests compute variance over a rolling window of 50 recent successful requests (discard first 3 warmup). A failing condition is sustained (≥5 consecutive windows) variance ≥5%. Include synthetic jitter control to keep determinism.

## Additional Provider Alignment Tests (Added 2025-08-11)

### Tool / Function Blocks Ignored

- Anthropic: Inject synthetic response containing a `{"type":"tool_use","name":"noop","input":{}}` block before the JSON memory payload.
  - Parser MUST ignore the block and still extract valid memories JSON.
  - Assert no parsing_repair_failure; no tool block content logged.
- OpenAI: Simulate function/tool call delta events (assistants style) when using pure chat mode; they MUST be ignored (not emitted by mock provider in current mode). Test ensures unexpected tool_calls array in a completion does not break parsing.

### Retry-After Precedence

- Provide rate limit error with `Retry-After: 4` header.
  - Assert context.retryAfterMs === 4000 and scheduled backoff does NOT apply exponential formula (no jitter additive captured in internal trace).
- Provide both `retry-after: 2` and window reset header implying 3500ms; assert chosen 2000ms.
- Absent direct header, include Anthropic window header with future timestamp; assert derivedRetry=true and correct ms computation (rounded).

### Simultaneous Budget & Circuit Events

- Force request that triggers circuit open (failure threshold) AND crosses budget threshold.
  - Assert both events emitted in same run: one `circuit_state_change` (open) and one `budget_threshold`.
  - Order not strictly required but both must appear; independence validated.

### Usage Missing / Estimated Flag

- Simulate provider response lacking usage metadata.
  - System applies heuristic tokens; log context.tokenUsage present and context.usageEstimated=true.
  - Subsequent real usage reconciliation test (if added later) would clear flag.

### First Token Filtering

- Streaming simulation with initial non-content event (e.g., thread.run.created) then first content delta at t=120ms.
  - Assert first_token latency recorded using first content chunk (120ms), ignoring admin events.

### Pricing Dimension Future-Proofing

- Inject mock model metadata including hypothetical `reasoningTokens` cost dimension; ensure current estimator ignores it and logs warning (debug) without breaking cost calculation.

### Header Mapping Table Fidelity

- Unit test enumerates mapping entries (OpenAI Retry-After, Anthropic retry-after, Anthropic window reset) ensuring transformation functions produce expected ms outputs and selection logic chooses minimum positive.

### Null / Malformed Retry Header

- Provide `Retry-After: invalid` → header ignored; fallback to exponential schedule (no retryAfterMs logged; derivedRetry absent).

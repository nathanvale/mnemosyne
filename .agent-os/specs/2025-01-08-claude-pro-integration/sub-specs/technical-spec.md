# Technical Specification

_Glossary Reference_: See [../glossary.md](../glossary.md) for canonical term definitions (schema, metrics, error taxonomy, pipeline stages).

This is the technical specification for the spec detailed in @.agent-os/specs/2025-01-08-claude-pro-integration/spec.md

> Created: 2025-01-08
> Version: 1.3.0 (reconciled 2025-08-11; adds hashing, deterministic interfaces, logging schema, performance methodology)

## Technical Requirements

### Core Functionality

- Provider abstraction layer (LLMProvider + LLMProviderFactory)
- Multiple providers (Claude, OpenAI) via SDKs
- Runtime provider & fallback selection via env configuration
- Secure API key management (env only)
- Provider-neutral mood-aware prompt generation
- Provider-specific rate limiting + predictive gating
- Multi-pass JSON repair & validation (plural `memories` schema)
- Integration with mood scoring + delta detection + redaction pre-step
- Transactional persistence adapter (batch upsert, dedup, harmonic confidence merge)

### Performance Requirements

- Batches 10–50 messages per call
- Median provider latency (non-stream) <1200ms
- Parallel batch processing (configurable concurrency)
- Prompt template caching
- Token optimization (salience pruning) to minimize costs
- Fallback activation <10% steady state

### Integration Requirements

- Seamless MoodScoringAnalyzer integration
- DeltaDetector compatibility
- Output `ExtractedMemory[]` mapping from `memories` schema
- Validation pipeline support

## Architecture Design

### Module Structure (Proposed)

```text
packages/memory/src/llm/
  ├─ index.ts
  ├─ types.ts
  ├─ llm-provider.interface.ts
  ├─ llm-provider-factory.ts
  ├─ providers/
  │   ├─ claude.provider.ts
  │   └─ openai.provider.ts
  ├─ prompt-builder.ts
  ├─ rate-limiter.ts
  ├─ extraction-llm-processor.ts
  ├─ response-parser.ts
  ├─ persistence-adapter.ts
  ├─ error-handler.ts
  ├─ config-loader.ts
  ├─ cost-estimator.ts
  ├─ pricing-catalog.json
  ├─ schema-adapters/
  │   └─ v1-to-v2.adapter.ts (future)
  └─ response-schema.ts
```

### Data Flow (Updated)

```text
Conversation Input
  ↓
ContentRedactor.redactConversation()
  ↓
MoodScoringAnalyzer.analyzeConversation()
  ↓
DeltaDetector.detectDeltas()
  ↓
ExtractionLLMProcessor.filterByEmotionalSalience()
  ↓
LLMProviderFactory.create(primary)
  ↓
PromptBuilder.buildMoodAwarePrompt()
  ↓
RateLimiter.executeWithRetry()
  ↓
Provider.send / stream
  ↓
MemoryLLMResponseParser.parseMemoryResponse()
  ↓
PersistenceAdapter.persistBatch()
  ↓
Persisted Memory Records (DB)
```

### Circuit Breaker & Budget Semantics

- Budget alert persistence: Maintain durable record of fired thresholds per day (e.g., small JSON file `.cache/memory_llm_budget_thresholds.json` or DB key `budget_thresholds:{YYYY-MM-DD}`) reloaded on startup to enforce idempotency after restart.
- Circuit breaker failure rate window: last 20 COMPLETED attempts (exclude in‑flight). Failure rate = failures / completed_in_window (rounded to 4 decimal places for logging, full precision internal). Skip evaluation until at least 1 completed attempt.
- Half-open transition: after open cool-down, allow exactly `probesRequired` successful attempts (default = 1) before closing; ANY failure during half-open returns to open and resets probe counter.
- `probesRequired` default: 1 (configurable via env `MEMORY_LLM_CIRCUIT_PROBES`). Any change MUST update acceptance-criteria & tests.
- State change emission ordering: emit `circuit_state_change` AFTER updating internal state & metrics gauge (observers never see stale state).
- Budget vs circuit independence: evaluated independently; simultaneous triggers permitted (tests assert independence).

### Pricing Catalog

Single authoritative file `pricing-catalog.json` loaded by cost-estimator. Providers must NOT embed rates. Tests assert catalog integrity & version field. (Table omitted to prevent duplication drift.)

Cost formula: `(inputTokens * inputPer1K + outputTokens * outputPer1K) / 1000`; logs rounded to 6 decimals; raw retained for aggregation & budget decisions.

### Message Salience Selection

1. Score messages: `score = weightDelta * moodDelta + weightEmotion * emotionKeyword + positionBoost`
2. Select top-K (default 24)
3. Add one preceding & following for context (dedupe)
4. If token estimate > 90% cap prune lowest score iteratively
5. Expose diagnostics (selectedIds, prunedCount, estimatedTokens)

### LLM Output Merge Strategy (Plural Memories)

| Field                | Rule                                  | Notes                                       |
| -------------------- | ------------------------------------- | ------------------------------------------- |
| content              | Replace if provider confidence ≥ base | Retain otherwise                            |
| emotionalContext.\*  | Higher-confidence source              | 0–1 normalized                              |
| relationshipDynamics | Shallow merge                         | Arrays replaced only with higher confidence |
| significance.overall | max(base, provider)                   | Component-wise max                          |
| rationale            | Provider (trim length)                | Optional                                    |
| confidence           | Harmonic mean                         | Bias toward lower                           |

Missing confidence defaults to 0.5 during merge; final confidence clamped [0,1].

### Persistence Adapter Responsibilities

| Concern          | Behavior                                                | Notes                                |
| ---------------- | ------------------------------------------------------- | ------------------------------------ |
| Transaction      | Wrap entire batch in single transaction                 | Rollback on any failure              |
| Deduplication    | Hash/signature comparison pre-insert                    | Skip or merge; no duplicates         |
| Idempotency      | Re-processing identical batch yields 0 inserts          | Updates only if improved confidence  |
| Confidence Merge | Harmonic mean applied on upsert                         | Default base 0.5 when absent         |
| Initialization   | clusteringMetadata=null, clusterParticipationCount=0    | Enforced per record                  |
| Provenance       | Store provider, model, cost snapshot                    | For audit & analytics                |
| Metrics          | increment persist counters & latency summary            | See Monitoring section               |
| Error Mapping    | Translate DB errors to `invalid_request` or `transient` | Unique constraint -> invalid_request |

## Implementation Details

### Provider Interface (Canonical)

```typescript
export interface LLMProvider {
  readonly name: string
  send(request: LLMRequest): Promise<LLMResponse>
  stream?(request: LLMRequest, handlers: StreamHandlers): Promise<LLMResponse>
  countTokens(text: string): Promise<number>
  getCapabilities(): ProviderCapabilities
  estimateCost(usage: TokenUsage): number
  validateConfig(): Promise<boolean>
}
```

### Error Taxonomy (Final)

`rate_limit | timeout | authentication | invalid_request | parsing | budget_exceeded | policy | transient | unknown`

Retry caps: rate_limit/timeout/transient=3; parsing=1 (corrective); others=0 (unless fallback eligible).

Backoff: `delay = min(500ms * 2^attempt, 8000ms) + jitter(-200ms…+200ms)` (symmetric jitter; injectable for tests). All docs standardized to ± range. Internal field name: `scheduledDelayMs` (NOT logged). Provider rate-limit hints (header) logged separately as `retryAfterMs` when present.

### Streaming Assembly

Ignore provider tool/function invocation blocks (Anthropic `tool_use`, OpenAI `tool_calls` / function_call) entirely for extraction and first-token latency purposes; they MUST NOT contribute bytes that define `first_token` nor appear in parsed JSON. Tests assert these blocks are skipped.

### Token Counting

- Claude: SDK token counting
- OpenAI: tiktoken if available else heuristic `ceil(chars/4)`; reconcile with usage tokens post-response; log variance if >5%
  "usageEstimated": true,
  "derivedRetry": true,

## Monitoring & Observability

**CRITICAL: ALL metrics are defined in [metrics-manifest.md](./metrics-manifest.md). No other metric definitions are authoritative.**
Additional Boolean Flags (Logging Only):

| Field          | Meaning                                                                                                             | Emission Rule                                                                          |
| -------------- | ------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------- |
| usageEstimated | Token usage values were heuristic estimates due to provider omission                                                | Present (true) only when provider did not return usage; absent otherwise (never false) |
| derivedRetry   | retryAfterMs value computed from secondary/reset headers (e.g., reset window) rather than direct Retry-After header | Present (true) only when derived; absent when direct header used                       |

DO NOT define metrics elsewhere. The metrics-manifest.md file is the ONLY source of truth.

All metrics MUST use the `memory_llm_` prefix. Short names like `requests_total` are FORBIDDEN.

See metrics-manifest.md for:

- Complete metric list with exact names
- Metric types and label requirements
- Emission points and timing
- Change control process

## Acceptance Criteria Alignment (Summary Extract)

Refer to acceptance-criteria.md (v1.3.0). (Avoid duplicating numeric targets here to prevent drift; acceptance criteria remains the single source of truth.) Key qualitative extracts:

- JSON validity & repair thresholds as specified
- Transactional persistence & normalized-hash idempotency
- Tight confidence merge deviation tolerance (≤5e-6) with canonical pairwise rounding
- Fallback trigger set (rate_limit, timeout, transient, parsing post corrective retry failure)
- Metrics names must match metrics-manifest.md exactly

Latency Measurement Definition (canonical):

- Provider round-trip median = p50(memory_llm_latency_ms_summary{operation="provider_call"})
- Parsing median = p50(memory_llm_latency_ms_summary{operation="parsing"})
- Combined round-trip (used for latency SLO) = p50(memory_llm_latency_ms_summary{operation="total"}) where `total` segment instrumentation records (provider_call start → parsing end) directly (NOT derived by summation post hoc). Implementers must emit the `total` operation to avoid aggregation ambiguity.

Budget Utilization Mapping:

- Log field: budgetUtilization (0–100 float)
- Metric: memory_llm_budget_utilization_percent (gauge 0–100)
- The log field MUST NOT be named `budgetUtilizationPct` (deprecated) and MUST reflect the same value emitted to the gauge within the same request context.

Deprecated Logging Fields (forbidden in new emissions): ts, budgetUtilizationPct, additional. Tests MUST assert absence.

## Schema Versioning & Migration

### Naming Conventions

- Canonical provider integration name: "Claude" (not "CloudPro" / "Claude Pro" in identifiers).
- Environment variables prefix: `MEMORY_LLM_` (e.g., `MEMORY_LLM_PRIMARY=claude`).
- Metrics/log labels use lowercase provider identifier `claude`.
- Docs may reference "Claude Pro" descriptively, but code identifiers MUST remain `claude`.

Current: `memory_llm_response_v1` (plural). Adapters for singular legacy responses. Rules unchanged from main spec.

## Redaction & Security

Redaction is mandatory pre-mood scoring. Mapping discarded after extraction. Logs contain counts only.

## Hashing & Idempotency (Authoritative)

Purpose: Ensure deterministic duplicate detection & safe upserts.

Normalization Pipeline (canonical – v1.3.0; content field only):

1. Unicode NFKC normalization
2. Lowercase
3. Trim leading/trailing whitespace
4. Collapse all internal whitespace runs (\s+) to single space
5. Remove zero-width and control characters (Unicode categories Cf, Cc)
6. Strip trailing sentence punctuation ONLY (final run of [.!?,;:]+)
7. Preserve internal punctuation and stopwords (intent: semantic conservation)

Hash Algorithm: SHA-256 over normalized string → hex; store full 64 hex chars; unique index on (normalized_hash).
Reference: See `algorithms.md` §9 (Memory Deduplication Hash Algorithm) for reference implementation.

Implementation Note: Prefer `globalThis.crypto.subtle.digest('SHA-256', ...)` (WebCrypto). Where unavailable (certain test runners or Node versions without `--experimental-global-webcrypto`), a fallback to Node's `createHash('sha256')` producing identical lowercase hex output is permitted. All implementations MUST: (1) apply normalization pipeline identically, (2) produce lowercase hex, (3) avoid streaming partial hashes that could reorder content, (4) remain deterministic across platforms. Mixing libraries in the same process for the same content must yield identical hashes (tests will spot-check both code paths via an injected hash strategy abstraction).

Normalization Evolution Process:

- Any proposed change to the 7-step normalization pipeline requires: (a) version bump (acceptance-criteria.md history), (b) addition of new corpus cases (tests.md corpus section), (c) migration impact assessment (duplicate reclassification risk documented), (d) dual-hash transitional strategy plan (old + new) if backfill required. No silent changes.

Example Version Bump (Hypothetical v1.4.0):

1. Proposed Change: Extend trailing punctuation stripping to remove trailing paired smart quotes.
2. Versioning: Add 1.4.0 entry to acceptance-criteria history enumerating exact rule delta & rationale.
3. Corpus Update: Add smart quote variant fixtures (e.g., “Great day!” vs Great day!).
4. Impact Assessment: Document expected duplicate reclassification rate (<0.5%) with sampled analysis.
5. Dual Hash Plan: Temporarily compute both v1.3.0 & v1.4.0 hashes; map collisions; no permanent storage after cutover.
6. Cutover: After validation, update pipeline label to v1.4.0 in all specs; remove transitional code.
7. Prohibited: Silent widening of punctuation set without above governance steps.

### Hash Strategy Interface (Abstraction)

Deterministic hashing MUST be exposed via an injectable interface so tests can exercise both WebCrypto and Node crypto implementations and assert identical outputs.

```typescript
export interface HashStrategy {
  normalize(content: string): string // applies normalization steps 1–7 EXACTLY
  hash(normalized: string): Promise<string> // returns 64-char lowercase hex digest
}

// Example (names illustrative; actual implementations live in runtime package):
// class WebCryptoHashStrategy implements HashStrategy { ... }
// class NodeCryptoHashStrategy implements HashStrategy { ... }
```

Testing Requirements:

- Inject each concrete implementation; for a fixed corpus assert: identical normalized string, identical hash.
- Corpus MUST include edge cases: mixed Unicode forms, excessive internal whitespace, zero-width chars, trailing punctuation runs, semantic vs non-semantic variants.
- Any divergence is a test failure (no tolerance permitted for hashing).
- Fallback selection logic MUST be explicit (feature flag or capability detection) and covered by tests.

Duplicate Rule: A memory is a duplicate if normalized_hash matches an existing row (content-based only). Emotional context, rationale, confidence, significance changes alone do NOT create a new record.

Update Rule: On duplicate hash match, NEVER mutate the stored content (immutability guarantees auditability). Only update mutable metadata (confidence via pairwise mergeConfidence, emotionalContext, significance, relationshipDynamics, rationale, provenance fields) when provider confidence strictly improves or adds richer contextual fields. Any content difference after normalization would have produced a different hash and thus a new record.

Non-Semantic Variant Examples (all map to same hash):
"Great Day!" vs "great day" vs " Great day!!! " (internal punctuation and words unchanged)

Semantic Change Example (new row):
"Great day at the beach" (content word addition changes hash)

Out-of-Scope (v1): fuzzy / edit-distance based similarity.

## Deterministic Interfaces

Interfaces:

```typescript
export interface Clock {
  now(): number
} // returns epoch ms (use performance.now for monotonic internal)
export interface RNG {
  nextFloat(): number
} // [0,1)
```

Injection Points:

- Retry backoff (jitter source)
- Circuit breaker half-open probe scheduling (Clock)
- Budget window midnight reset detection (Clock)
- Salience tie-break ordering when equal scores (RNG or stable secondary key)
- Synthetic delay injection in performance tests (Clock mocking)
- Streaming first-token latency measurement (timestamps captured via Clock)

All time calculations reference injected Clock. No direct Date.now() in core logic.

### Deterministic Memory Ordering

Extraction MUST yield a stable, deterministic ordering of memories to avoid flaky downstream tests and hash merge races:

1. Primary ordering key: original appearance index in the source conversation chronology.
2. Secondary tie-break (if two memories originate from same message after splitting): deterministic lexical comparison of normalized content (post-hash normalization) – NOT random.
3. No parallel reordering: Even if extraction/parsing happens concurrently, a final stable sort MUST apply before persistence and logging.
4. Stability guarantee: Re-processing identical input yields identical ordered memory arrays byte-for-byte (except mutable metadata like confidence after merges).
5. Upsert Preservation: Merge (update) operations MUST NOT reorder existing persisted sequence; ordering is established on first insertion and only new distinct semantic memories append at the end (ordered by their appearance index relative to prior persisted content when batch boundaries span sessions).
6. Tests: Randomized async scheduling harness verifies final ordering invariance.

## Logging Schema & Sanitization

Structured Log Envelope (JSON):

```jsonc
{
  "timestamp": "ISO8601",
  "level": "info|warn|error|debug",
  "requestId": "string?",
  "provider": "claude|openai|none",
  "model": "string?",
  "event": "provider_call_complete", // Canonical snake_case event taxonomy (see Event Naming)
  "errorType": "rate_limit|timeout|...|unknown?",
  "attempt": 1,
  "durationMs": 123,
  "costMicroUSD": 4567,
  "budgetUtilization": 72.3,
  "circuitState": "closed|open|half_open?",
  "context": { "...": "context-specific safe fields" },
}
```

Sanitization Rules:

- Strip API keys / secrets entirely.
- Redact PII tokens BEFORE logging (store counts not raw values).
- Truncate large content fields > 1024 chars (add suffix `[truncated]`).
- Never log full raw provider JSON response; only parsed & validated fields.

PII Placeholder Policy: Redaction step replaces PII with token form `<PII:TYPE>` which is NOT persisted and not included in hashing (hash uses already redacted content string).

Field Name Canonicalization (v1.3.0) – deprecated → current:

| Deprecated           | Current           |
| -------------------- | ----------------- |
| ts                   | timestamp         |
| budgetUtilizationPct | budgetUtilization |
| additional           | context           |

Emit only current names. No compatibility shim required for MVP (tests MUST assert absence of deprecated names).

### Event Naming (Canonical)

All events use lower_snake_case verbs with optional nouns. Core required events:

| Event                      | When                                     | Mandatory Context Keys                          |
| -------------------------- | ---------------------------------------- | ----------------------------------------------- |
| provider_call_start        | Before sending request                   | model, provider                                 |
| provider_call_complete     | After successful provider response       | durationMs, costMicroUSD, tokenUsage            |
| provider_call_error        | After classified non-success             | errorType, attempt                              |
| parsing_repair_attempt     | After each repair attempt                | attempt, success:boolean                        |
| parsing_repair_failure     | Final unrecoverable parsing failure      | errorType=parsing                               |
| fallback_activated         | On fallback invocation                   | from, to, reason                                |
| circuit_state_change       | On state transition                      | previousState, circuitState, failureRate        |
| budget_threshold           | On crossing 70/90/100                    | budgetUtilization, spentUSD, budgetUSD          |
| budget_rejection           | On budget_exceeded                       | projectedCost, shortfall                        |
| persistence_batch_commit   | On successful transaction end            | batchSize, inserted, updated, skipped_duplicate |
| persistence_batch_rollback | On rollback due to error                 | reason                                          |
| first_token_latency        | On first streaming chunk                 | firstTokenMs                                    |
| stream_repair_attempt      | Streaming repair attempt (if applicable) | success:boolean                                 |

Any additional events MUST be documented before use.

## Performance Measurement Methodology

Environment Assumptions:

- Single-process Node runtime, warm provider client (discard first call in metrics).
- Local SQLite / in-memory DB for dev benchmarks; same schema.
- Sample size: ≥30 successful calls per scenario (latency median, p95 derived); remove top 1 outlier before computing p95 if N>50.

Measurements (operations emitted as labels in memory_llm_latency_ms_summary):

- operation="provider_call": send -> raw response (or last chunk in streaming)
- operation="parsing": parse start (post provider) -> schema validated
  // persistence (separate summary: memory_llm_persist_latency_ms_summary) start -> commit (NOT part of latency SLO scope)
- operation="total": provider_call start -> parsing end (authoritative latency SLO) – MUST emit only after the parsing operation has emitted to guarantee deterministic ordering & monotonic segment timing.
- operation="first_token": first_chunk_time - dispatch_time (streaming only)

## Precision & Rounding Policy (Authoritative)

| Domain             | Rule                                                                                  | Rationale                            | Test Assertion Style                                                                    |
| ------------------ | ------------------------------------------------------------------------------------- | ------------------------------------ | --------------------------------------------------------------------------------------- |
| Confidence Merge   | Round pairwise harmonic mean to 6 decimal places after each fold                      | Deterministic multi-step results     | Reference function exact 6dp (\|impl-ref\| ≤ 5e-6 tolerance guard)                      |
| Cost Logging       | Round displayed USD values to 6 decimals; accumulate in micro-USD integers internally | Avoid FP drift; human readability    | Displayed = micro/1e6 formatted 6dp; micro integer exact equality                       |
| Latency Metrics    | Record raw ms (floating) to summary; quantile presentation may round to integer       | Preserve resolution; avoid over-spec | Assert provider_call ≤ total; total = parsing_end - provider_start (±1ms); non-negative |
| Token Estimates    | Integer tokens only                                                                   | Tokens are discrete                  | Assert Number.isInteger & matches deterministic fixture                                 |
| Budget Utilization | Two decimal places in logs; full precision internal                                   | Stable alert thresholds              | Logged toFixed(2); thresholds fire only when utilization > 70/90/100                    |

Any change to precision requires simultaneous updates to: acceptance-criteria.md, tests.md (precision assertions), and this table.

## Confidence Merge (Canonical)

Confidence merging uses pairwise harmonic mean via the canonical `mergeConfidence` function defined in algorithms.md §5. No alternate in-module re‑implementations permitted.

Rules:

1. Inputs (baseConfidence, providerConfidence) individually clamped to [0,1]; undefined -> default 0.5.
2. Harmonic mean formula (two-value): 2xy/(x+y); special-case both zero => 0.
3. Result rounded to EXACTLY 6 decimal places (Math.round(raw\*1e6)/1e6).
4. Tests compare implementation vs reference; |impl - reference| ≤ 5e-6 (exact match expected; tolerance only for FP artifacts).
5. Multi-step merges (more than two sources) MUST fold pairwise in deterministic order (existing then new) – no array averaging variant.

Remove any previous usage of generic `harmonicMean(array)` for confidence; if an array helper exists it MUST delegate to iterative pairwise `mergeConfidence` to maintain identical rounding behavior.

## Future Enhancements & Known Limitations

| Area                       | Limitation (MVP)                                 | Planned Enhancement (Roadmap Ref)                                 |
| -------------------------- | ------------------------------------------------ | ----------------------------------------------------------------- |
| Budget Tracking            | Per-process only (overspend risk multi-instance) | Redis / shared atomic counters (Phase 1 Hardening)                |
| Provider Health            | Reactive only (no background probes)             | Background health monitor + cached status (Phase 1 Hardening)     |
| Request Prioritization     | FIFO queue only                                  | Priority tiers & starvation prevention (Phase 1 Hardening)        |
| Schema Negotiation         | Fixed v1 only                                    | Version handshake + adapters (Phase 1/2)                          |
| Token Optimization         | Basic salience pruning                           | Semantic compression + context reuse cache (Phase 1/2)            |
| Streaming Repair Metrics   | Aggregated under parser repairs                  | Dedicated stream_repair metrics (planned)                         |
| Confidence Merge Tolerance | Tight ≤5e-6 tolerance (FP artifact buffer only)  | Potential elimination of tolerance via decimal arithmetic library |
| Multi-Provider Budget      | Single provider aware only                       | Cross-provider consolidated budget enforcement                    |

All planned enhancements tracked in product roadmap Phase 1 Critical Hardening section.

## Testing Considerations (Expanded)

- Multi-memory extraction scenarios
- Streaming boundary detection
- Fallback cascade correctness
- Budget window reset simulation (UTC midnight)
- Adapter forward/backward tests
- Deterministic retry & jitter injection
- Persistence transaction rollback tests (induced mid-batch failure)
- Idempotent re-run (no new inserts) & confidence merge upsert tests
- Duplicate content scenarios (merged vs skipped)
- Metrics assertion for new persistence / dedup counters

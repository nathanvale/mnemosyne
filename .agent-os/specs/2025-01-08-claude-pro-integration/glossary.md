# Claude Pro Integration Glossary

> Version: 2025-08-11 (initial)
> Scope: Applies to all documents under `2025-01-08-claude-pro-integration/` and referenced implementation in `packages/memory/src/llm/`.

This glossary defines canonical terms. New terms must be added here and referenced in spec addenda when semantics change.

## Core Abstractions

**LLMProvider** Standard interface wrapping a concrete LLM SDK (Claude, OpenAI) exposing `send`, optional `stream`, token counting, capability discovery, cost estimation, and config validation.

**LLMProviderFactory** Static registry returning provider instances by name; prevents direct SDK coupling in orchestration code.

**ExtractionLLMProcessor** Orchestrator that executes the end-to-end memory extraction pipeline (redaction → mood scoring → delta detection → salience selection → prompt building → provider call → parsing → merge/metrics → persistence adapter).

**MemoryLLMResponseSchema** Versioned Zod schema (`memory_llm_response_v1`) defining the required JSON contract emitted by providers.

**MemoryLLMResponseParser** Component that assembles (streaming or non-streaming) provider output, performs multi-pass repair, validates against the schema, adapts legacy formats, and returns `ExtractedMemory[]`.

**Persistence Adapter** Boundary component that converts validated `ExtractedMemory` objects into database records (transactional batch upsert) applying deduplication, confidence harmonic merge (on idempotent re-runs), and initialization of clustering fields.

## Data & Schema

**Memory Item (MemoryItem)** An individual extracted memory object produced from conversation context, containing content, emotional context, significance, optional relationship dynamics, rationale, and confidence.

**Plural Memories Schema** Canonical top-level JSON response shape: `{ schemaVersion, memories: MemoryItem[] }`.

**Legacy Singular Schema** Deprecated earlier shape `{ schemaVersion, memory: {...} }` requiring adapter translation to plural form.

**Schema Adapter** Module implementing transformation between schema versions or singular ↔ plural formats. Stored under `schema-adapters/`.

**Schema Version** Literal value pinned in prompt instructions indicating the response format (`memory_llm_response_v1`). New incompatible versions increment suffix.

## Pipeline Concepts

**Redaction** Pre-processing step replacing PII (email, phone, url, id_token, person_name) with placeholders before any mood or salience analysis. Mapping retained only in-memory for the extraction lifecycle.

**Mood Scoring** Analysis producing mood scores per message used to influence salience and prompt context.

**Delta Detection** Identification of significant emotional changes across contiguous conversation segments.

**Salience Score** Composite numeric value per message: `score = weightDelta * moodDelta + weightEmotion * emotionKeyword + positionBoost` used to select top-K messages.

**Prompt Builder** Generates deterministic, provider-neutral prompt including system role, mood context, delta context, selected messages, extraction instructions, and schema directive.

**Streaming Assembly** Incremental reconstruction of the JSON response from streamed tokens, tracking brace & quote balance before validation.

**Corrective Retry** Single additional provider attempt triggered after initial parsing failure; prompt is appended with explicit JSON-only instruction.

**Fallback Provider** Secondary provider invoked only after exhausting retries on eligible errors from primary (rate_limit, timeout, transient, parsing (post-corrective), optional invalid_request).

**Fallback Chain** Maximum of one hop (primary → fallback). No further cascades.

**Merge Strategy** Rules combining provider-emitted memory data with baseline or prior extraction (content replacement threshold, harmonic mean confidence, max significance, shallow merge for relationship dynamics).

## Errors & Resilience

**Error Taxonomy** Final set: `rate_limit`, `timeout`, `authentication`, `invalid_request`, `parsing`, `budget_exceeded`, `policy`, `transient`, `unknown`.

**Retry Policy** Exponential backoff with jitter. Attempt caps: rate_limit/timeout/transient=3, parsing=1 corrective, others=0 unless fallback eligible.

**Jitter Provider** Injected entropy source to produce deterministic jitter in tests.

**Circuit Breaker** State machine (closed → open → half_open → closed) guarding against high failure rates (rolling window of 20 attempts). Exposes gauge metric state values (0,1,2).

**Budget Guard** Pre-call gate preventing invocation if projected spend exceeds configured UTC daily budget (spent + estimatedNext > budget).

**Budget Window** Fixed UTC day; resets at 00:00:00 UTC regardless of process uptime.

**Heuristic Token Estimate** Pre-call approximation (chars/4) used when tokenizer unavailable; reconciled post-call with actual usage tokens.

## Cost & Pricing

**Pricing Catalog** Single authoritative JSON file containing per-model input/output token prices; version field prevents silent drift.

**Cost Estimator** Component using pricing catalog + token usage to estimate or reconcile costs; logs display with 6 decimal precision, stores raw float.

**Budget Utilization Thresholds** Warning levels at 70%, 90%, 100% of daily budget (logged once per window per level).

## Metrics & Observability

All metrics prefixed `memory_llm_`.

### Authoritative Metrics Table (Single Source of Truth)

| Metric Name                        | Type              | Labels                     | Description                                                                                      |
| ---------------------------------- | ----------------- | -------------------------- | ------------------------------------------------------------------------------------------------ |
| **requests_total**                 | Counter           | `{provider,model,outcome}` | All LLM requests. Outcome: success, fallback*success, error*{type}, circuit_open, budget_blocked |
| **tokens_total**                   | Counter           | `{provider,type}`          | Token usage where type=input\|output                                                             |
| **cost_usd_total**                 | Counter           | `{provider,model}`         | Cumulative cost in USD                                                                           |
| **latency_ms_summary**             | Summary/Histogram | `{provider,operation}`     | Latency where operation=provider_call\|parsing\|total                                            |
| **circuit_state**                  | Gauge             | `{provider}`               | Circuit breaker state (0=closed, 1=open, 2=half_open)                                            |
| **budget_utilization_percent**     | Gauge             | `{instance_id}`            | Current day spend / budget \* 100 (per-process)                                                  |
| **parser_repairs_total**           | Counter           | `{provider,result}`        | JSON repair attempts where result=success\|failure                                               |
| **fallback_total**                 | Counter           | `{from,to,reason}`         | Fallback invocations with source, target, and trigger reason                                     |
| **salience_pruned_messages_total** | Counter           | `{reason}`                 | Messages removed where reason=token_limit\|relevance                                             |
| **schema_validations_total**       | Counter           | `{version,result}`         | Schema validation attempts where result=pass\|fail                                               |
| **redactions_total**               | Counter           | `{category}`               | PII redactions by category                                                                       |
| **persist_batches_total**          | Counter           | `{status}`                 | Persistence batch attempts where status=success\|rolled_back\|failed                             |
| **persist_memories_total**         | Counter           | `{result}`                 | Individual memory persistence outcomes result=inserted\|updated\|skipped_duplicate               |
| **persist_latency_ms_summary**     | Summary/Histogram | `{batch_size}`             | End-to-end batch persistence latency distribution                                                |
| **dedup_candidates_total**         | Counter           | `{action}`                 | Dedup operations where action=merged\|discarded                                                  |
| **confidence_merges_total**        | Counter           | `{path}`                   | Merges applying harmonic mean (path=initial\|upsert)                                             |

### Outcome Label Values

The `outcome` label on `requests_total` uses these canonical values:

- `success` - Successful extraction
- `fallback_success` - Successful after fallback
- `error_rate_limit` - Rate limit error (no retry budget)
- `error_timeout` - Timeout error (no retry budget)
- `error_authentication` - Auth failure
- `error_invalid_request` - Bad request
- `error_parsing` - Parsing failure after retries
- `error_budget_exceeded` - Budget limit
- `error_policy` - Content policy violation
- `error_transient` - Server error (no retry budget)
- `error_unknown` - Unmapped error
- `circuit_open` - Blocked by circuit breaker
- `budget_blocked` - Blocked by budget guard

Note: Errors are terminal states after exhausting retries. Use `fallback_total` to track fallback attempts.

## Confidence & Quality

**Confidence Score** Normalized [0,1] provider or merged score; merges use harmonic mean of base & provider confidences to penalize disagreement.

**Harmonic Mean Confidence** `2 * (a * b) / (a + b)` for base/provider (if both present) with default base=0.5 when absent.

**Repair Success Rate** Percentage of malformed responses fixed by multi-pass repair prior to fallback.

## Configuration

**Primary Provider** Value of `MEMORY_LLM_PRIMARY` environment variable.

**Fallback Provider** Optional `MEMORY_LLM_FALLBACK` (set to `none` to disable fallback).

**Daily Budget** `MEMORY_LLM_DAILY_BUDGET_USD` numeric limit (0 or unset disables guard).

**Model Overrides** `MEMORY_LLM_MODEL_CLAUDE`, `MEMORY_LLM_MODEL_OPENAI` define model selection; absence defaults to provider’s internal default.

## Testing & Determinism

**Deterministic Backoff** Achieved via injected Clock + Jitter Provider; tests assert exact sequence of delays.

**Adapter Tests** Validate forward/backward compatibility between schema versions & singular/plural forms.

**Streaming Fixture** Synthetic event sequence covering chunk types (start, delta, stop, error) to validate assembly logic.

## Miscellaneous

**Outcome Classification** Canonical outcome labels for metrics/logging: success, fallback*success, fallback_failure, circuit_open, budget_blocked, error*`taxonomy`.

**Salience Pruning** Iterative removal of lowest-score messages until estimated tokens under target threshold (≤90% of cap before final prompt).

**Token Cap** Maximum input token allowance per request derived from provider capability minus configured safety buffer.

**Idempotent Persistence** Guarantee that re-processing the identical validated extraction batch produces zero additional persisted rows (updates allowed only when confidence merge improves state).

**Transactional Batch Upsert** Single database transaction wrapping all memory inserts/updates for an extraction batch; any failure triggers rollback ensuring atomicity.

**Duplicate Memory Detection** Hash/signature comparison prior to insert; duplicates either skipped or merged according to merge policy without creating multiple rows for identical semantic content.

---

If a term is missing or ambiguous, add it here first before altering implementation or subordinate specs.

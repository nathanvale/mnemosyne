# Acceptance Criteria

> Version: 1.3.0
> Created: 2025-08-11
> Updated: 2025-08-11 (v1.3.0 canonicalizes hashing pipeline, clarifies latency scope (excludes persistence), normalizes jitter semantics to ±200ms, aligns metrics naming, adds cross-ref to hashing spec, de-duplicates confidence merge definition)
> Scope: Consolidated success metrics and SLOs for LLM integration (authoritative)

_Glossary Reference_: See [../glossary.md](../glossary.md) for metric definitions.

## Executive Summary

This document consolidates all acceptance criteria into a single authoritative source. These metrics define "done" for the LLM integration implementation.

## Core Functional Criteria

| Category                  | Metric                                      | Target | Measurement Method                                                                      | Priority |
| ------------------------- | ------------------------------------------- | ------ | --------------------------------------------------------------------------------------- | -------- |
| **JSON Initial Validity** | Raw (pre-repair) schema pass rate           | ≥90%   | memory_llm_json_initial_valid_total{result=pass}/ (pass+fail)                           | P0       |
| **JSON Final Validity**   | Post-repair + ≤1 corrective retry pass rate | ≥99%   | memory_llm_json_final_valid_total{result=pass}/ (pass+fail)                             | P0       |
| **Response Quality**      | Extracted memories contain required fields  | 100%   | All memories have content, emotionalContext, significance, confidence                   | P0       |
| **Provider Abstraction**  | Provider swapping without code changes      | Pass   | Change MEMORY_LLM_PRIMARY env var, verify operation                                     | P0       |
| **Fallback Behavior**     | Fallback activation on eligible errors      | 100%   | Triggers on rate_limit, timeout, transient, parsing (only after corrective retry fails) | P0       |
| **Budget Enforcement**    | Over-budget request blocking                | 100%   | No provider calls when (spent + estimated) > daily budget                               | P0       |
| **Error Classification**  | Known errors correctly classified           | 100%   | All provider errors map to taxonomy enum                                                | P0       |

## Performance Criteria

| Category              | Metric                                                        | Target  | Measurement Method                                                                                                                       | Priority |
| --------------------- | ------------------------------------------------------------- | ------- | ---------------------------------------------------------------------------------------------------------------------------------------- | -------- |
| **Latency**           | Median total latency (provider_call + parsing, non-streaming) | <1200ms | p50(memory_llm_latency_ms_summary{operation="total"}) excluding mood scoring (directly instrumented total segment; persistence excluded) | P0       |
| **Streaming Latency** | Time to first token                                           | <500ms  | t(first_chunk) - t(request_dispatch)                                                                                                     | P1       |
| **Throughput**        | Concurrent request handling                                   | ≥3      | 3 parallel requests complete within 2x single median                                                                                     | P1       |
| **Token Efficiency**  | Actual vs estimated token variance                            | <5%     | Rolling window (last 50 successful requests, discard first 3 warmup): abs(actual - estimated) / actual \* 100                            | P1       |
| **Cost Accuracy**     | Cost estimation variance                                      | <5%     | Rolling window (last 50 successful requests, discard first 3 warmup): abs(estimated - actual) / actual \* 100 (micro-USD internal)       | P0       |
| **Batch Processing**  | Messages per batch                                            | 10-50   | Verify batching within configured range                                                                                                  | P1       |

## Reliability Criteria

| Category                        | Metric                                | Target | Measurement Method                                                                          | Priority |
| ------------------------------- | ------------------------------------- | ------ | ------------------------------------------------------------------------------------------- | -------- |
| **Retry Success**               | Recovery rate after transient errors  | ≥90%   | successful_after_retry / total_retryable_errors                                             | P0       |
| **Circuit Breaker**             | Opens at failure threshold            | 100%   | Circuit opens when failure rate ≥50% in 20-attempt window                                   | P0       |
| **Circuit Half-Open Probes**    | probesRequired successes before close | 100%   | Half-open closes only after `MEMORY_LLM_CIRCUIT_PROBES` consecutive successes               | P0       |
| **Circuit Transition Metrics**  | Transitions counter increments        | 100%   | memory_llm_circuit_transitions_total increments with accurate from→to labels                | P0       |
| **Rate Limiting**               | Zero 429s after limiter active        | 100%   | No unhandled rate limit errors in tests                                                     | P0       |
| **Parser Robustness**           | Malformed JSON repair success         | ≥95%   | repaired_successfully / total_malformed (defined corpus)                                    | P0       |
| **Fallback Success**            | Fallback provider success rate        | ≥80%   | successful_fallback / total_fallback_attempts                                               | P1       |
| **Memory Persistence**          | Successful DB writes (transactional)  | 100%   | All-or-nothing batch commit; no partial writes                                              | P0       |
| **Persistence Idempotency**     | Repeat batch causes no duplicates     | 100%   | Re-run same extraction produces zero new rows                                               | P0       |
| **Deduplication Effectiveness** | Duplicate insertion rate              | 0%     | Duplicates blocked via hashing/content signature                                            | P0       |
| **Confidence Merge Accuracy**   | Pairwise confidence merge deviation   | ≤5e-6  | abs(impl - reference) across vectors (expected exact match; tolerance only for FP rounding) | P1       |
| **Upsert Latency**              | p95 batch persistence latency         | <300ms | Timed from adapter call to commit (≤25 memories)                                            | P2       |

## Quality Criteria

| Category                     | Metric                        | Target                    | Measurement Method                                       | Priority |
| ---------------------------- | ----------------------------- | ------------------------- | -------------------------------------------------------- | -------- |
| **Test Coverage**            | Overall line coverage         | >80%                      | Vitest coverage report                                   | P0       |
| **Critical Module Coverage** | Provider & parser coverage    | ≥85%                      | Lines and branches for critical modules                  | P0       |
| **Integration Tests**        | End-to-end scenarios pass     | 100%                      | All integration test suites green                        | P0       |
| **Memory Quality**           | Confidence score distribution | >70% with confidence ≥0.7 | Count memories with confidence ≥0.7 (evaluation set)     | P1       |
| **Emotional Fidelity**       | Mood context preservation     | 100%                      | All memories include emotional context from mood scoring | P0       |
| **Schema Compliance**        | Zod validation pass rate      | 100%                      | All responses pass MemoryLLMResponseSchema validation    | P0       |

## Observability Criteria

| Category                | Metric                            | Target | Measurement Method                                                                                                                           | Priority |
| ----------------------- | --------------------------------- | ------ | -------------------------------------------------------------------------------------------------------------------------------------------- | -------- |
| **Metrics Coverage**    | All defined metrics exported      | 100%   | All metrics in metrics-manifest.md emit ≥1 sample                                                                                            | P0       |
| **Persistence Metrics** | Batch persistence metrics emitted | 100%   | memory_llm_persist_batches_total{status=\*}, memory_llm_persist_latency_ms_summary                                                           | P0       |
| **Error Logging**       | Errors include context            | 100%   | All errors log with request ID, provider, error type                                                                                         | P0       |
| **Cost Tracking**       | Daily spend accuracy              | 100%   | Logged costs match sum of individual requests                                                                                                | P0       |
| **Budget Alerts**       | Threshold warnings emitted        | 100%   | Warnings logged at 70%, 90%, 100% utilization (once/threshold/day) + metric memory_llm_budget_alerts_total increments once per threshold/day | P0       |
| **Circuit State**       | State changes logged              | 100%   | All circuit transitions emit logs + circuit_state gauge + transitions counter                                                                | P0       |
| **Request Tracing**     | Request ID threading              | 100%   | Same request ID throughout pipeline                                                                                                          | P0       |

## Security & Compliance Criteria

| Category               | Metric                                          | Target | Measurement Method                                                          | Priority |
| ---------------------- | ----------------------------------------------- | ------ | --------------------------------------------------------------------------- | -------- |
| **API Key Security**   | Keys only in env vars                           | 100%   | No API keys in code, logs, or error messages                                | P0       |
| **PII Redaction**      | Redaction before processing                     | 100%   | All PII replaced with placeholders pre-mood scoring                         | P0       |
| **Log Sanitization**   | No sensitive data in logs                       | 100%   | Audit logs for API keys, PII, raw conversations                             | P0       |
| **Prompt Privacy**     | No raw prompt or full conversation text in logs | 100%   | Audit ensures only hashed / redacted summaries; content field never emitted | P0       |
| **Error Sanitization** | Safe error messages                             | 100%   | Error responses contain no implementation details                           | P0       |

## Load & Stress Criteria

| Category                 | Metric                                 | Target | Measurement Method                       | Priority |
| ------------------------ | -------------------------------------- | ------ | ---------------------------------------- | -------- |
| **Sustained Load**       | 100 messages/minute for 5 min          | Pass   | Process 500 messages without degradation | P1       |
| **Burst Handling**       | 50 messages in 10 seconds              | Pass   | Queue and process successfully           | P1       |
| **Memory Usage**         | Peak memory under load                 | <500MB | Monitor heap usage during stress test    | P2       |
| **Queue Overflow**       | Graceful handling                      | Pass   | Return clear error when queue full       | P1       |
| **High Duplicate Input** | Dedup performance under 30% duplicates | Pass   | No duplicate rows; latency increase <20% | P2       |

## Documentation Criteria

| Category                | Metric                     | Target | Measurement Method                                | Priority |
| ----------------------- | -------------------------- | ------ | ------------------------------------------------- | -------- |
| **API Documentation**   | All public APIs documented | 100%   | TSDoc comments for all exported functions/classes | P0       |
| **Configuration Guide** | Env vars documented        | 100%   | configuration.md includes all variables           | P0       |
| **Error Reference**     | Error codes documented     | 100%   | error-mapping.md covers all error scenarios       | P0       |
| **Examples**            | Working example scripts    | ≥3     | Provide happy path, error, fallback examples      | P1       |
| **Troubleshooting**     | Common issues covered      | ≥5     | Document frequent problems and solutions          | P1       |

## Acceptance Test Scenarios

### Scenario 1: Happy Path

1. Configure Claude as primary provider
2. Process conversation with high emotional content
3. Verify multiple memories extracted
4. Confirm confidence scores ≥0.7
5. Check emotional context populated
6. Validate against schema
7. **Pass Criteria**: All steps succeed; p50(memory_llm_latency_ms_summary{operation="total"}) for test window <1200ms

### Scenario 2: Fallback Activation

1. Configure Claude primary, OpenAI fallback
2. Simulate Claude rate limit error
3. Verify retry attempts with backoff
4. Confirm fallback to OpenAI (for parsing case: only after corrective retry failure)
5. Validate successful extraction
6. Check metrics show fallback
7. **Pass Criteria**: Fallback succeeds; observational wall time <3000ms; SLO metric p50(memory_llm_latency_ms_summary{operation="total"}) still <1200ms over sample window

### Scenario 3: Budget Enforcement (Single-Process MVP Limitation)

1. Set daily budget to $0.10
2. Process requests until near limit
3. Verify warnings at 70%, 90%
4. Attempt request exceeding budget
5. Confirm request blocked
6. Check budget_exceeded error
7. **Pass Criteria**: No over-budget calls made; request exactly matching remaining budget MUST be allowed (strict > rejection rule)
8. **Scope Limitation**: Enforcement is per-process only for MVP; multi-instance deployments may overspend until shared atomic budget tracking (roadmap Phase 1 Hardening) is implemented.

### Scenario 4: Malformed Response Recovery

1. Mock provider returning invalid JSON (synthetic corruption corpus: trailing comma, truncated object, quote imbalance, noise wrapper, array truncation)
2. Verify repair attempt
3. Confirm corrective retry
4. Validate final success
5. Check repair metrics
6. **Pass Criteria**: ≤1 corrective retry, final success; initial vs final validity metrics updated

### Scenario 5: Circuit Breaker Protection

1. Simulate 10 consecutive failures
2. Verify circuit opens
3. Confirm requests blocked
4. Wait for cooldown
5. Verify half-open state
6. Simulate success to close
7. **Pass Criteria**: Circuit state transitions correctly

### Scenario 6: Persistence Transaction & Idempotency

1. Run extraction producing N memories (batch) -> persist
2. Force an induced DB error mid-batch (test double) -> verify rollback (0 rows written)
3. Re-run successful batch twice
4. Normalized content hash identical; no additional rows on second run
5. Introduce test inputs that differ ONLY by case, trailing sentence punctuation, or extra internal whitespace -> all treated as duplicates (skipped_duplicate) per canonical normalization pipeline (see Technical Spec: Hashing & Idempotency)
6. Modify semantic content (word change) -> new row inserted
7. **Pass Criteria**: Atomic rollback works; strict normalized hash idempotency enforced; non-semantic variants skipped; true semantic changes inserted

## Go/No-Go Decision Matrix

| Criterion                 | Required for Launch | Current Status | Notes                         |
| ------------------------- | ------------------- | -------------- | ----------------------------- |
| P0 Functional Criteria    | Yes                 | ⬜ Pending     | Must all pass                 |
| P0 Performance Criteria   | Yes                 | ⬜ Pending     | Must meet targets             |
| P0 Reliability Criteria   | Yes                 | ⬜ Pending     | Must meet targets             |
| P0 Quality Criteria       | Yes                 | ⬜ Pending     | Must meet coverage            |
| P0 Observability Criteria | Yes                 | ⬜ Pending     | Must have metrics             |
| P0 Security Criteria      | Yes                 | ⬜ Pending     | No compromises                |
| P1 Criteria               | No                  | ⬜ Pending     | Nice to have for v1           |
| P2 Criteria               | No                  | ⬜ Pending     | Future optimization           |
| Metrics Instrumented      | Yes                 | ⬜ Pending     | All manifest entries wired    |
| Deterministic Test Hooks  | Yes                 | ⬜ Pending     | Clock + RNG injection present |

## Measurement & Methodology Addendum

1. Latency Segments: Instrument provider_call, parsing, first_token, and total as operations in memory_llm_latency_ms_summary; total = provider_call start → parsing end (authoritative SLO). Persistence measured separately (memory_llm_persist_latency_ms_summary) and excluded from latency SLO. first_token = first_chunk_time - dispatch_time (streaming only).
2. Concurrency Throughput Test: Run ≥3 parallel extraction requests with controlled mock provider latency; all complete within 2x median single-request total_ms and without queue starvation.
3. Cost & Token Precision: Internal accumulation in integer micro‑USD (cost_usd_total scaled by 1e6). Token estimates vs actual logged per request; variance computed over rolling 50-sample window.
4. JSON Validity Metrics: initial_valid increments after first parse attempt pre-repair; final_valid after repair/retry pipeline completion.
5. Confidence Merge: Pairwise mergeConfidence(existing, incoming) = 2xy/(x+y) with 6-decimal rounding applied after each fold; multi-source merges fold sequentially (deterministic order). Array-wide harmonicMean variant is forbidden. Deviation tolerance (≤5e-6) exists only for extreme floating artifacts; implementations expected to match canonical output exactly. (Cross‑ref: algorithms.md §5 canonical table for reference vectors & expected outputs.)
6. Budget Enforcement Scope: MVP scope is single-process in-memory; multi-process consistency explicitly OUT OF SCOPE for v1 (documented limitation). Warnings emitted once per threshold per UTC day boundary (reset at midnight UTC via injectable clock).
7. Redaction & Emotional Fidelity: Redaction preserves sentiment tokens via placeholder strategy (emotional signal retention) before mood scoring; placeholders never persisted.
8. Malformed Corpus Definition: Test corpus includes ≥5 corruption classes (trailing comma, truncation, imbalance, noise wrapper, array truncation) each with ≥10 variants.
9. Memory Quality Metric: Evaluated on fixed curated evaluation set (not gating per-batch); tracked observationally—non-blocking for go/no-go unless <50% sustained.
10. Deterministic Hooks: All time/jitter-dependent logic accepts injected Clock (now()) + RNG (nextInt/nextFloat) for tests.
11. Budget Equality Rule: Rejection uses strict > comparison; equality (spent + estimated == budget) MUST pass and produce exactly one 100% threshold alert.
12. Prompt Logging Prohibition: Raw prompt text, full conversation transcripts, and unredacted memory content MUST NOT be logged. Only derived metrics (token counts, hashes, redacted snippets ≤128 chars with placeholders) are permitted. Tests MUST include a negative assertion scanning emitted logs for sampled raw phrases.
13. Memory Ordering Preservation: Repeated processing of identical input produces identical ordered memory arrays; upserts (confidence merges) NEVER reorder existing items; only truly new semantic memories append in chronological appearance order.
14. retryAfterMs Semantics: For rate_limit errors, retryAfterMs reflects provider-specified backoff hint (header/body) distinct from internally computed exponential + jitter delay (scheduledDelayMs). Only retryAfterMs is logged; scheduledDelayMs remains internal (test harness validates separation).
15. Budget Alert Restart Behavior: Threshold alerts (70/90/100) MUST remain idempotent across process restarts within the same UTC day. Implementation MUST persist (or deterministically reconstruct from logs/cost counters) which thresholds have fired; restarts MUST NOT re-emit previously fired alerts for the active day.

## Referenced Artifacts

- metrics-manifest.md (authoritative metric list)
- technical-spec.md (module responsibilities & algorithms)
- tests.md (expanded coverage)

## Sign-off Requirements

- [ ] Engineering Lead: All P0 criteria met
- [ ] QA Lead: Test scenarios pass
- [ ] Security: No sensitive data exposure
- [ ] DevOps: Monitoring in place
- [ ] Product: Acceptance scenarios validated

## Version History

| Version | Date       | Changes                                                                                                                                                                                                                          |
| ------- | ---------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1.0.0   | 2025-08-11 | Initial consolidated criteria                                                                                                                                                                                                    |
| 1.1.0   | 2025-08-11 | Added persistence & refined JSON validity metrics                                                                                                                                                                                |
| 1.2.0   | 2025-08-11 | Added metric names, fallback parsing clarification, methodology addendum, confidence tolerance, malformed corpus, budget scope                                                                                                   |
| 1.3.0   | 2025-08-11 | Canonical hash pipeline (trailing sentence punctuation only), latency SLO scope reaffirmed (excludes persistence), jitter semantics clarified (±200ms), metrics naming normalization, confidence merge de-dup, version alignment |

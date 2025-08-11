# Metrics Manifest (Authoritative)

> Version: 1.0.0
> Created: 2025-08-11
> Scope: Canonical list of all `memory_llm_*` metrics, types, labels, and emission points.
>
> Any addition/removal MUST update this file and acceptance-criteria.md.

## Legend

- Type: counter \| gauge \| summary \| histogram
- Labels: static required label keys; optional labels suffixed with `?`
- Emit Point: high-level stage or event trigger

## Core Request Lifecycle

| Name                                 | Type    | Labels                                            | Emit Point                          | Notes                                                  |
| ------------------------------------ | ------- | ------------------------------------------------- | ----------------------------------- | ------------------------------------------------------ |
| memory_llm_requests_total            | counter | provider, model, outcome=success\|error\|fallback | After request completion            | outcome=fallback counted for primary attempt result    |
| memory_llm_retries_total             | counter | provider, error_type, result=success\|failure     | After each retry attempt resolution | result indicates if retry eventually succeeded         |
| memory_llm_fallback_total            | counter | from, to, reason=error_type                       | On fallback activation              | reason derived from final primary error classification |
| memory_llm_circuit_state             | gauge   | provider                                          | State transition                    | 0=closed,1=open,2=half_open                            |
| memory_llm_circuit_transitions_total | counter | provider, from, to                                | On state change                     | Mirrors logs                                           |

## Tokens & Cost

| Name                                  | Type    | Labels                       | Emit Point                               | Notes                                                               |
| ------------------------------------- | ------- | ---------------------------- | ---------------------------------------- | ------------------------------------------------------------------- |
| memory_llm_tokens_total               | counter | provider, type=input\|output | After provider response                  | Sum of usage tokens                                                 |
| memory_llm_token_estimate_total       | counter | provider                     | Before provider call                     | Accumulates estimated input tokens                                  |
| memory_llm_cost_usd_total             | counter | provider, model              | After provider response                  | Value in USD (float), internal micro-USD integer used for summation |
| memory_llm_budget_utilization_percent | gauge   | instance_id                  | After each cost addition                 | 0–100 percent                                                       |
| memory_llm_budget_alerts_total        | counter | threshold=70\|90\|100        | When threshold first crossed per UTC day | Dedup per threshold/day                                             |

## Parsing & Validation

| Name                                | Type    | Labels                            | Emit Point                  | Notes                                               |
| ----------------------------------- | ------- | --------------------------------- | --------------------------- | --------------------------------------------------- |
| memory_llm_json_initial_valid_total | counter | result=pass\|fail                 | After first parse attempt   | Pre-repair                                          |
| memory_llm_json_final_valid_total   | counter | result=pass\|fail                 | After repair/retry pipeline | Post-repair                                         |
| memory_llm_parser_repairs_total     | counter | provider, result=success\|failure | After each repair attempt   | Failure increments when still invalid after attempt |
| memory_llm_schema_validations_total | counter | version, result=pass\|fail        | After schema validation     | Includes legacy adapter paths                       |

## Latency & Performance

| Name                                      | Type    | Labels                                                         | Emit Point         | Notes                                                      |
| ----------------------------------------- | ------- | -------------------------------------------------------------- | ------------------ | ---------------------------------------------------------- |
| memory_llm_latency_ms_summary             | summary | provider, operation=provider_call\|parsing\|total\|first_token | End of segment     | Use quantiles p50,p90,p95 (first_token for streaming only) |
| memory_llm_persist_latency_ms_summary     | summary | batch_size                                                     | After persistence  | p50,p95 tracked                                            |
| memory_llm_salience_pruned_messages_total | counter | reason=token_limit\|relevance                                  | After pruning pass | Increment by count pruned                                  |

## Persistence & Deduplication

| Name                               | Type    | Labels                                      | Emit Point                  | Notes                                                                                                                                                        |
| ---------------------------------- | ------- | ------------------------------------------- | --------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| memory_llm_persist_batches_total   | counter | status=success\|rolled_back\|failed         | At transaction end          | rolled_back includes explicit rollback due to injected error                                                                                                 |
| memory_llm_persist_memories_total  | counter | result=inserted\|updated\|skipped_duplicate | Per memory outcome          | Exactly one increment per memory per batch: inserted (new row), updated (existing row metadata merged), skipped_duplicate (no mutation). Never double-count. |
| memory_llm_dedup_candidates_total  | counter | action=merged\|discarded                    | During dedup decision       | merged = updated existing                                                                                                                                    |
| memory_llm_confidence_merges_total | counter | path=initial\|upsert                        | When harmonic mean computed | initial = first-time combination, upsert = merge existing                                                                                                    |

## Redaction & Security

| Name                        | Type    | Labels   | Emit Point            | Notes                             |
| --------------------------- | ------- | -------- | --------------------- | --------------------------------- |
| memory_llm_redactions_total | counter | category | After redaction phase | category e.g. pii_name, pii_email |

## Errors

| Name                    | Type    | Labels               | Emit Point        | Notes                             |
| ----------------------- | ------- | -------------------- | ----------------- | --------------------------------- |
| memory_llm_errors_total | counter | provider, error_type | On classification | All classified non-success errors |

## Request Tracing & Context (Optional Diagnostics)

| Name                               | Type    | Labels | Emit Point                  | Notes                        |
| ---------------------------------- | ------- | ------ | --------------------------- | ---------------------------- |
| memory_llm_selected_messages_total | counter |        | After salience selection    | Increment by selection count |
| memory_llm_pruned_iterations_total | counter |        | Each pruning loop iteration | Token cap pruning loops      |

## Emission Order Reference

1. Redaction -> memory_llm_redactions_total
2. Salience selection -> selected/pruned metrics
3. Token estimate -> memory_llm_token_estimate_total
4. Budget check -> possibly budget alerts
5. Provider call timing (latency segment start)
6. First token (stream) -> first_token_latency metric
7. Provider response -> tokens_total, cost_usd_total, requests_total (outcome deferred until parse success)
8. Parsing & validation -> json_initial_valid_total, repairs, json_final_valid_total, schema_validations_total
9. Fallback (if any) -> fallback_total
10. Persistence -> persist\_\* / dedup / confidence merge metrics
11. Final outcome classification & errors_total (for error cases)

Guardrails:

- Latency operations ALLOWED set: {provider_call, parsing, total, first_token}. Tests fail on any other label.
- Persistence counters MUST emit only observed categories; there is NO zero-flush placeholder metric (dashboards should tolerate absence until first emission).

## Change Control Checklist

- [ ] Added/Removed metric reflected here
- [ ] acceptance-criteria.md updated
- [ ] tests updated to assert emission
- [ ] logger integration updated if structured logs depend on metric names

## Planned (Not Yet Emitted) Metrics

The product roadmap references future metrics below. They are NOT active in the current implementation and MUST NOT be emitted until this manifest is updated with full definitions.

| Proposed Name                           | Intended Purpose                               | Status  |
| --------------------------------------- | ---------------------------------------------- | ------- |
| memory_llm_budget_atomic_failures_total | Detect failed atomic budget ops (shared store) | Planned |
| memory_llm_queue_wait_ms_summary        | Queue wait time by priority tier               | Planned |
| memory_llm_stream_repair_attempts_total | Streaming-specific repair attempts             | Planned |
| memory_llm_stream_repair_failures_total | Streaming repair failures                      | Planned |
| memory_llm_context_component_tokens     | Token attribution by component                 | Planned |

Do not instrument these until promoted to an active section above with full type/labels documentation.

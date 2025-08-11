# Spec Requirements Document

> Spec: LLM Integration with Provider Abstraction - Emotionally Weighted Memory Extraction
> Created: 2025-01-08
> Updated: 2025-08-11
> Status: Planning

## Overview

Implement a provider-agnostic LLM integration for the @studio/memory package that leverages existing mood scoring and delta detection capabilities to create emotionally intelligent memory extraction. This integration uses a flexible provider abstraction layer allowing selection between different LLM providers (Claude or OpenAI), with comprehensive cost management, rate limiting, and robust response parsing to ensure reliable memory extraction with high emotional fidelity.

Reconciliation Note (2025-08-11): Canonical naming, metrics/SLO targets, schema plurality (memories[]), pricing source-of-truth, error taxonomy, and budget semantics are unified here. Sub-specs must align; divergent terms are deprecated.

## User Stories

### Story 1: Developer Integrates Claude for Memory Extraction

As a developer, I want to configure Claude API integration with my existing mood scoring system, so that I can extract emotionally significant memories from conversations with high accuracy.

**Workflow:**

1. Developer sets up environment variables with Anthropic API key
2. Developer configures Claude client with appropriate rate limits and retry strategies
3. System validates API key and connection
4. Developer processes message batches through the enhanced pipeline
5. System filters messages by emotional salience using delta detection
6. System generates mood-aware prompts with emotional context
7. Claude processes prompts and returns structured memory data
8. System parses responses into ExtractedMemory format with confidence scores

As a system administrator, I want to monitor Claude API usage and costs, so that I can stay within budget and optimize processing efficiency.

**Workflow:**

1. Administrator configures rate limiting thresholds
2. System tracks API calls, tokens used, and costs
3. System provides real-time usage metrics through response headers
4. Administrator receives alerts when approaching limits
5. System automatically throttles requests when needed
6. Administrator can adjust batch sizes and processing priorities

### Story 3: Quality Assurance Engineer Tests Memory Extraction

As a QA engineer, I want to test the Claude integration with various emotional scenarios, so that I can ensure accurate memory extraction across different conversation types.

**Workflow:**

1. Engineer prepares test conversations with known emotional patterns
2. Engineer runs test suite with mocked Claude API responses
3. System validates prompt generation with mood context
4. System tests rate limiting and retry mechanisms
5. Engineer verifies memory extraction accuracy
6. System generates test coverage reports

## Spec Scope

1. **Provider Abstraction Layer** - LLMProvider interface for provider-agnostic operations
2. **Claude Provider** - Anthropic SDK implementation with streaming support
3. **OpenAI Provider** - Alternative provider implementation for flexibility
4. **Provider Factory** - Runtime provider selection based on configuration
5. **Enhanced Prompt Builder** - Provider-neutral mood-aware prompt generation
6. **Rate Limiter** - Token bucket with sliding window for selected provider
7. **Response Parser** - Multi-pass JSON repair pipeline with Zod validation
8. **Cost & Budget Manager** - Pricing catalog, usage tracking, budget enforcement
9. **Error Handler** - Provider-specific error handling with retry strategies
10. **Enhanced LLM Processor** - Orchestrator integrating emotional analysis with LLM extraction
11. **Observability Module** - Comprehensive metrics and structured logging
12. **Persistence Integration** (Reconciled 2025-08-11) – Transactional write / upsert of extracted memories via existing @studio/db layer, including:

- Deduplication & id generation alignment with existing hashing/content rules
- Plural `memories[]` schema adaptation to DB records (batch transactional integrity)
- Confidence harmonic merge & cluster participation counter initialization
- Budget / cost attribution fields (optional future extension)
- Clear abstraction boundary: Extraction layer produces `ExtractedMemory[]`; Persistence adapter handles storage & returns persisted identifiers

## Out of Scope

- UI components for memory review (handled by @studio/validation)
- User authentication and authorization
- Real-time streaming UI updates
- Custom Claude model fine-tuning
- Multi-language support (English only for MVP)

## Spec Documentation

- Tasks: @.agent-os/specs/2025-01-08-claude-pro-integration/tasks.md
- Technical Specification: @.agent-os/specs/2025-01-08-claude-pro-integration/sub-specs/technical-spec.md
- Provider Abstraction: @.agent-os/specs/2025-01-08-claude-pro-integration/sub-specs/provider-abstraction.md
- API Specification: @.agent-os/specs/2025-01-08-claude-pro-integration/sub-specs/api-spec.md
- Tests Specification: @.agent-os/specs/2025-01-08-claude-pro-integration/sub-specs/tests.md

---

## Spec Reconciliation Addendum (2025-08-11)

1. Canonical Naming: `LLMProvider`, `LLMProviderFactory`, `ExtractionLLMProcessor`, `MemoryLLMResponseSchema`.
2. Response Schema: `memories: MemoryItem[]` plural; legacy singular requires adapter.
3. Metrics Prefix `memory_llm_`: `requests_total`, `tokens_total{type=input|output}`, `cost_usd_total`, `latency_ms_summary`, `retries_total`, `circuit_state`, `budget_utilization_percent`.
4. Budget Reset: UTC midnight fixed window; atomic aggregation; no sliding window.
5. Error Taxonomy: `rate_limit | timeout | authentication | invalid_request | parsing | budget_exceeded | policy | transient | unknown`.
6. Retry Policy: base 500ms exponential ×2 capped 8000ms + jitter ±200ms; attempt caps: rate_limit/timeout/transient=3; parsing corrective=1; others=0 (unless fallback eligible).
7. Coverage Targets: Overall >80%; provider & parser ≥85% (lines & branches).
8. Pricing Source-of-Truth: `packages/memory/src/llm/pricing-catalog.json`; no embedded rate literals in provider code.
9. Token Counting: Claude via SDK; OpenAI via tiktoken or heuristic `ceil(chars/4)`; reconcile with actual usage; variance <5%.
10. Deterministic Tests: Inject `Clock` & `JitterProvider` abstractions to remove flake.
11. Redaction Mandatory: Redaction → Mood Scoring → Delta Detection → Salience → Prompt Build.
12. Streaming Assembly: Incremental buffer with structural balance checks before validation.
13. Confidence Merge: Normalize [0,1]; harmonic mean; log precision 4 decimals.
14. Schema Adapters: `schema-adapters/` directory with forward/backward adaptation tests.
15. Latency SLO Scope: Provider round-trip + parsing only (excludes mood scoring & DB persistence).

Changes after this date require a new dated addendum.

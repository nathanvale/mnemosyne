# Provider Abstraction Specification

_Glossary Reference_: See [../glossary.md](../glossary.md) for canonical term definitions (naming, taxonomy, metrics).

This is the provider abstraction specification for the LLM integration detailed in @.agent-os/specs/2025-01-08-claude-pro-integration/spec.md

> Created: 2025-08-11
> Updated: 2025-08-11 (unified naming, config, error taxonomy, schema contract)
> Version: 1.1.1

## Overview

The provider abstraction layer enables seamless switching between different LLM providers (Claude, OpenAI, etc.) through a unified interface. This design allows the application to use different providers based on configuration without changing the core logic.

Reconciliation Alignment: This document aligns with the Spec Reconciliation Addendum (2025-08-11). Any divergence requires a new version.

Canonical naming (ALL tests/spec references must align):

| Concept                     | Name                     | Deprecated Aliases        |
| --------------------------- | ------------------------ | ------------------------- |
| Provider factory            | `LLMProviderFactory`     | `ProviderFactory`         |
| Claude implementation       | `ClaudeProvider`         | `ClaudeClient`            |
| OpenAI implementation       | `OpenAIProvider`         | —                         |
| LLM extraction orchestrator | `ExtractionLLMProcessor` | `EnhancedClaudeProcessor` |

Deprecated names MUST NOT appear in new code; leave backward references only in migration comments if needed.

## Core Interface

### LLMProvider Interface

```typescript
export interface LLMProvider {
  readonly name: 'claude' | 'openai' | string
  send(request: LLMRequest): Promise<LLMResponse>
  stream?(request: LLMRequest, handlers: StreamHandlers): Promise<LLMResponse>
  countTokens(text: string): Promise<number>
  getCapabilities(): ProviderCapabilities
  estimateCost(usage: TokenUsage): number
  validateConfig(): Promise<boolean>
}
```

### Type Definitions

```typescript
interface LLMRequest {
  messages: Array<{
    role: 'system' | 'user' | 'assistant'
    content: string
  }>
  temperature?: number
  maxTokens?: number
  topP?: number
  stopSequences?: string[]
  metadata?: Record<string, any>
}

interface LLMResponse {
  content: string
  usage: TokenUsage
  model: string
  finishReason: 'stop' | 'length' | 'error'
  metadata?: Record<string, any>
}

interface TokenUsage {
  inputTokens: number
  outputTokens: number
  totalTokens: number
}

interface ProviderCapabilities {
  streaming: boolean
  maxInputTokens: number
  maxOutputTokens: number
  supportedModels: string[]
  jsonMode: boolean
  functionCalling: boolean
  visionSupport: boolean
}

interface StreamHandlers {
  onChunk?: (chunk: string) => void
  onComplete?: (response: LLMResponse) => void
  onError?: (error: Error) => void
}
```

## Provider Factory (Canonical Name: LLMProviderFactory)

```typescript
export class LLMProviderFactory {
  private static providers = new Map<string, () => LLMProvider>()
  static register(name: string, factory: () => LLMProvider): void {
    this.providers.set(name, factory)
  }
  static create(config: LLMConfig): LLMProvider {
    const factory = this.providers.get(config.provider)
    if (!factory) throw new Error(`Unknown provider: ${config.provider}`)
    return factory()
  }
  static getAvailableProviders(): string[] {
    return Array.from(this.providers.keys())
  }
}
```

## Claude Provider Implementation (Example)

(Implementation example shown for interface illustration only; production code must externalize pricing via estimator & catalog and inject jitter/clock for deterministic tests.)

```typescript
export class ClaudeProvider implements LLMProvider {
  /* ...existing illustrative code (no embedded rates in final impl)... */
}
```

## OpenAI Provider Implementation (Example)

```typescript
export class OpenAIProvider implements LLMProvider {
  /* ...existing illustrative code (no embedded rates in final impl)... */
}
```

## Unified Configuration Management

(See main spec addendum for env variable table.)

```typescript
// ...existing loadProviderConfig example (kept for reference)...
```

## Error Taxonomy & Retry Matrix

(Aligned with addendum taxonomy.)

| Signal                   | Classification  | Retry Policy             | Fallback                        | Notes                                                    |
| ------------------------ | --------------- | ------------------------ | ------------------------------- | -------------------------------------------------------- |
| HTTP 429 / rate headers  | rate_limit      | Exponential backoff (≤3) | Yes after final attempt         | Honor reset header if present (overrides jitter)         |
| Timeout / network ECONN  | timeout         | Backoff (≤3)             | Yes                             | Increase timeout if recurrent                            |
| Auth (401 / invalid key) | authentication  | None                     | No                              | Fail fast                                                |
| Malformed JSON           | parsing         | 1 corrective retry       | Fallback ONLY after retry fails | Append corrective prompt, then fallback if still invalid |
| Budget exceeded          | budget_exceeded | None                     | No                              | Pre-call guard                                           |
| HTTP 5xx                 | transient       | Backoff (≤3)             | Yes                             | Distinguish 503 vs 500 optional                          |
| Model not found / 404    | invalid_request | None                     | Optional if fallback supports   | Map actionable message                                   |
| Safety / policy stop     | policy          | None                     | No                              | Track for analytics                                      |

Backoff (canonical – aligned with technical-spec & error-mapping): `delay = min(500ms * 2^attempt, 8000ms) + jitter(-200ms…+200ms)` (symmetric jitter). When a provider Retry-After (or derived reset window) hint is present it REPLACES the exponential + jitter schedule (no jitter applied) and is logged as `retryAfterMs`; internally scheduled delay (`scheduledDelayMs`) remains unlogged.

Half‑open probe count is controlled via `MEMORY_LLM_CIRCUIT_PROBES` (default 1). Only after `probesRequired` consecutive successes does the circuit close; any failure during half‑open returns it to open and resets the probe counter.

Circuit breaker: opens at failure rate ≥ threshold (rolling 20); cooldown; half-open probes every 2s.

## Response Schema Contract (Plural Form)

Schema version: `memory_llm_response_v1`.

```typescript
// Constrained schema with bounded fields
const MemoryLLMResponseSchema = z.object({
  schemaVersion: z.literal('memory_llm_response_v1'),
  memories: z
    .array(
      z.object({
        id: z.string().optional(),
        content: z.string().min(10).max(1200),
        emotionalContext: z.object({
          primaryEmotion: z.string(),
          secondaryEmotions: z.array(z.string()).max(5),
          intensity: z.number().min(0).max(1),
          valence: z.number().min(-1).max(1),
          themes: z.array(z.string()).max(8),
        }),
        significance: z.object({
          overall: z.number().min(0).max(10),
          components: z
            .record(z.string(), z.number())
            .refine((obj) => Object.keys(obj).length <= 10, {
              message: 'Maximum 10 significance components allowed',
            })
            .refine(
              (obj) =>
                Object.keys(obj).every((k) =>
                  SIGNIFICANCE_COMPONENT_WHITELIST.includes(k),
                ),
              { message: 'Invalid significance component key' },
            ),
        }),
        relationshipDynamics: z
          .record(
            z.string(),
            z.union([z.string().max(500), z.number(), z.boolean()]),
          )
          .max(5)
          .optional()
          .refine(
            (obj) =>
              !obj ||
              Object.keys(obj).every((k) =>
                RELATIONSHIP_KEY_WHITELIST.includes(k),
              ),
            { message: 'Invalid relationship dynamics key' },
          ),
        rationale: z.string().max(800).optional(),
        confidence: z.number().min(0).max(1),
      }),
    )
    .min(1)
    .max(10), // Max 10 memories per response
})

// Whitelists for constraining dynamic fields
const SIGNIFICANCE_COMPONENT_WHITELIST = [
  'emotional_intensity',
  'relationship_impact',
  'narrative_importance',
  'character_development',
  'conflict_resolution',
  'trust_dynamics',
  'vulnerability_expression',
  'support_exchange',
  'boundary_setting',
  'growth_indicator',
]

const RELATIONSHIP_KEY_WHITELIST = [
  'trust_level',
  'conflict_present',
  'support_given',
  'support_received',
  'boundary_crossed',
  'intimacy_level',
  'power_dynamic',
  'communication_quality',
  'shared_experience',
  'relationship_stage',
]
```

Corrective retry append:

> The prior output was invalid. Return ONLY valid JSON for schemaVersion `memory_llm_response_v1`, no commentary.

Success SLO: ≥99% pass after ≤1 corrective retry; fallback activation <10% steady state.

## Adding New Providers

(Procedure unchanged; ensure registration via `LLMProviderFactory.register`.)

## Testing Strategy

(Add deterministic jitter & clock injection for retry timing tests.)

## Benefits

(Unchanged.)

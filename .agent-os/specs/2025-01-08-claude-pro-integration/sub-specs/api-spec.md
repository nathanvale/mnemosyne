# API Specification

_Glossary Reference_: See [../glossary.md](../glossary.md) for canonical term definitions (providers, processor, schema, taxonomy).

This is the API specification for the spec detailed in @.agent-os/specs/2025-01-08-claude-pro-integration/spec.md

> Created: 2025-01-08  
> Version: 1.2.0 (reconciled 2025-08-11) – adds Persistence Adapter API & metrics alignment

Reconciliation Alignment: Reflects canonical naming (`LLMProvider`, `LLMProviderFactory`, `ExtractionLLMProcessor`, plural `memories` schema). Deprecated Claude-specific class names retained here only for migration notes.

## Provider Implementations (Illustrative APIs)

### ClaudeProvider (formerly ClaudeClient)

```typescript
export class ClaudeProvider implements LLMProvider {
  constructor(config: ClaudeConfig)
  async send(request: LLMRequest): Promise<LLMResponse>
  async stream?(
    request: LLMRequest,
    handlers: StreamHandlers,
  ): Promise<LLMResponse>
  async countTokens(text: string): Promise<number>
  getCapabilities(): ProviderCapabilities
  estimateCost(usage: TokenUsage): number
  async validateConfig(): Promise<boolean>
}
```

### OpenAIProvider

```typescript
export class OpenAIProvider implements LLMProvider {
  /* same shape as ClaudeProvider */
}
```

## Prompt Builder API

### PromptBuilder (formerly EnhancedPromptBuilder)

```typescript
export class PromptBuilder {
  constructor(config?: PromptBuilderConfig)
  buildMoodAwarePrompt(
    messages: ConversationMessage[],
    moodScores: MoodScore[],
    moodDeltas?: MoodDelta[],
  ): string
  buildSystemPrompt(context: EmotionalContext): string
  buildExtractionInstructions(req: ExtractionRequirements): string
  optimizePrompt(prompt: string, maxTokens: number): string
  getPromptStats(prompt: string): PromptStats
}
```

Interfaces unchanged except naming adjustments.

## Rate Limiter API

(Interface unchanged; ensure deterministic jitter injection for tests.)

## Extraction Processor API

### ExtractionLLMProcessor (formerly EnhancedClaudeProcessor)

```typescript
export class ExtractionLLMProcessor {
  constructor(config: ProcessorConfig)
  processMessageBatch(messages: Message[]): Promise<ExtractedMemory[]>
  processWithParams(
    messages: Message[],
    params: ProcessingParams,
  ): Promise<ExtractedMemory[]>
  filterByEmotionalSalience(
    messages: Message[],
    deltas: MoodDelta[],
    threshold?: number,
  ): Message[]
  estimateCost(messages: Message[]): CostEstimate
  getStats(): ProcessingStats
}
```

## Response Parser API

### MemoryLLMResponseParser (formerly ClaudeResponseParser)

Plural schema support: expects `memories: MemoryItem[]`.

```typescript
export class MemoryLLMResponseParser {
  constructor(config?: ParserConfig)
  parseMemoryResponse(
    raw: string | ProviderRawResponse,
    moodScores: MoodScore[],
    moodDeltas: MoodDelta[],
  ): ExtractedMemory[]
  parseStreamChunk(chunk: StreamChunk): Partial<StreamAssemblyState>
  validateResponse(response: unknown): ValidationResult<ExtractedMemory[]>
  extractConfidence(memory: unknown): number
  handleParsingError(error: Error, response: unknown): ExtractedMemory[] | null
}
```

## Error Handler API

### LLMErrorHandler (formerly ClaudeErrorHandler)

Updated taxonomy: `rate_limit | timeout | authentication | invalid_request | parsing | budget_exceeded | policy | transient | unknown`.

```typescript
enum ErrorType {
  /* as above */
}
```

## Configuration Loader

### LLMConfigLoader (replaces ConfigurationManager)

Loads unified env vars (`MEMORY_LLM_*`).

```typescript
export class LLMConfigLoader {
  load(): LLMConfig
  validate(config: LLMConfig): ValidationResult<LLMConfig>
  get(): LLMConfig
}
```

## Cost Estimator API

(Interface unchanged; ensure it sources pricing exclusively from catalog file.)

## Persistence Adapter API

Provides transactional, idempotent batch upsert with duplicate detection and confidence harmonic mean merging.

```typescript
export interface PersistenceAdapterConfig {
  maxBatchSize?: number // safety cap
  enableDedup?: boolean // default true
  dedupSimilarityThreshold?: number // 0–1 semantic similarity threshold
}

export interface PersistenceContext {
  conversationId: string
  runId: string
  timestamp: string // ISO 8601
  provider: string
}

export interface PersistResultItem {
  id: string
  operation: 'inserted' | 'updated' | 'skipped_duplicate'
  previousConfidence?: number
  newConfidence?: number
  mergedConfidence?: number
  duplicateOf?: string
}

export interface BatchPersistResult {
  success: boolean
  transactionId: string
  items: PersistResultItem[]
  rolledBack?: boolean
  error?: Error
  latencyMs: number
}

export interface PersistenceAdapter {
  persistBatch(
    memories: ExtractedMemory[],
    context: PersistenceContext,
  ): Promise<BatchPersistResult>
  computeMemorySignature(memory: ExtractedMemory): string
  findPotentialDuplicates(
    signatures: string[],
  ): Promise<Record<string, string | null>>
  mergeConfidence(previous: number, incoming: number): number // harmonic mean
}
```

Operational Requirements:

- All-or-nothing: any failure yields rollback and metrics status=rolled_back (not partial success).
- Idempotent: identical repeat batch (same signatures) produces only skipped_duplicate operations.
- Dedup: must not update if semantic duplicate below threshold; mark skipped_duplicate.
- Confidence merging: harmonic mean h = 2ab/(a+b) when updating; guard divide-by-zero.
- Must return structured result instead of throwing on business-rule conflicts.
- Structured logging: include transactionId, counts of each operation.
- Metrics (labels: provider where applicable):
  - persist_batches_total (status=success|rolled_back|failed)
  - persist_memories_total (result=inserted|updated|skipped_duplicate)
  - dedup_candidates_total (action=merged|discarded)
  - confidence_merges_total (path=initial|upsert)
  - persist_latency_ms_summary (operation=persist)

Failure Handling:

- Transport / DB connectivity: attempt single retry if safe (no partial commit) then rollback.
- Integrity conflict concurrent update: classify as skipped_duplicate if content unchanged, else proceed with merge.

Security & PII:

- Memory content already redacted upstream; adapter never reintroduces PII.
- Signatures must exclude transient fields (timestamps) to ensure stability.

## Migration Notes

- Deprecated names (`ClaudeClient`, `EnhancedPromptBuilder`, `EnhancedClaudeProcessor`, `ClaudeResponseParser`, `ClaudeErrorHandler`, `ConfigurationManager`) must not appear in new code.
- Adapters provide backward compatibility for singular `memory` schema responses.

## Non-Goals Clarification

- No function calling / tool invocation layer in this phase.
- No UI streaming; streaming exists solely for internal latency reduction & progressive assembly.

## Testing Focus

- Parser pluralization acceptance
- Error taxonomy classification mapping
- Deterministic retry backoff (injected jitter)
- Fallback decision tree (primary failure eligible errors only)
- Persistence transactional behavior & idempotent repeat

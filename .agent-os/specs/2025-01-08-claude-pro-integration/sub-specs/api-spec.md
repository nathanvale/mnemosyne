# API Specification

This is the API specification for the spec detailed in @.agent-os/specs/2025-01-08-claude-pro-integration/spec.md

> Created: 2025-01-08  
> Version: 1.0.0

## Claude Client API

### ClaudeClient Class

```typescript
/**
 * Wrapper around Anthropic SDK for Claude API access
 */
export class ClaudeClient {
  constructor(config: ClaudeConfig)

  /**
   * Validate API key and connection
   */
  async validateConnection(): Promise<boolean>

  /**
   * Send a message to Claude API
   */
  async sendMessage(params: MessageParams): Promise<Anthropic.Message>

  /**
   * Stream a message response from Claude
   */
  async streamMessage(params: MessageParams): Promise<MessageStream>

  /**
   * Get current usage statistics
   */
  getUsageStats(): UsageStats

  /**
   * Reset usage statistics
   */
  resetUsageStats(): void
}

interface ClaudeConfig {
  apiKey: string
  maxRetries?: number // Default: 3
  timeout?: number // Default: 60000ms
  model?: string // Default: 'claude-3-sonnet-20240229'
  maxTokens?: number // Default: 2000
  temperature?: number // Default: 0.7
  logLevel?: 'debug' | 'info' | 'warn' | 'error'
}

interface MessageParams {
  messages: Array<{
    role: 'user' | 'assistant'
    content: string
  }>
  maxTokens?: number
  temperature?: number
  stream?: boolean
  metadata?: Record<string, unknown>
}

interface UsageStats {
  totalRequests: number
  successfulRequests: number
  failedRequests: number
  totalInputTokens: number
  totalOutputTokens: number
  estimatedCost: number
  lastRequestAt?: Date
}
```

## Prompt Builder API

### EnhancedPromptBuilder Class

```typescript
/**
 * Builds mood-aware prompts for Claude API
 */
export class EnhancedPromptBuilder {
  constructor(config?: PromptBuilderConfig)

  /**
   * Build a mood-aware prompt from conversation data
   */
  buildMoodAwarePrompt(
    messages: ConversationMessage[],
    moodScores: MoodScore[],
    moodDeltas?: MoodDelta[],
  ): string

  /**
   * Build a system prompt with emotional context
   */
  buildSystemPrompt(context: EmotionalContext): string

  /**
   * Build extraction instructions
   */
  buildExtractionInstructions(requirements: ExtractionRequirements): string

  /**
   * Optimize prompt for token usage
   */
  optimizePrompt(prompt: string, maxTokens: number): string

  /**
   * Get prompt statistics
   */
  getPromptStats(prompt: string): PromptStats
}

interface PromptBuilderConfig {
  templateVersion?: string
  includeExamples?: boolean
  compressionLevel?: 'none' | 'light' | 'aggressive'
  customTemplates?: Map<string, string>
}

interface ExtractionRequirements {
  outputFormat: 'json' | 'markdown' | 'structured'
  includeConfidence: boolean
  includeReasoning: boolean
  focusAreas?: string[]
  excludeAreas?: string[]
}

interface PromptStats {
  estimatedTokens: number
  compressionRatio: number
  moodContextSize: number
  messageCount: number
  complexity: 'low' | 'medium' | 'high'
}
```

## Rate Limiter API

### RateLimiter Class

```typescript
/**
 * Manages API rate limiting and request queuing
 */
export class RateLimiter {
  constructor(config: RateLimitConfig)

  /**
   * Execute a request with rate limiting
   */
  async execute<T>(request: () => Promise<T>): Promise<T>

  /**
   * Execute with custom retry strategy
   */
  async executeWithRetry<T>(
    request: () => Promise<T>,
    retryOptions?: RetryOptions,
  ): Promise<T>

  /**
   * Check if rate limit allows request
   */
  canExecute(): boolean

  /**
   * Get current rate limit status
   */
  getStatus(): RateLimitStatus

  /**
   * Update rate limits from response headers
   */
  updateFromHeaders(headers: Record<string, string>): void

  /**
   * Reset rate limiter state
   */
  reset(): void
}

interface RateLimitConfig {
  maxRequestsPerMinute: number // Default: 50
  maxTokensPerMinute: number // Default: 40000
  maxConcurrent: number // Default: 3
  queueTimeout?: number // Default: 30000ms
  enableAutoThrottle?: boolean // Default: true
}

interface RetryOptions {
  maxRetries?: number
  initialDelayMs?: number
  maxDelayMs?: number
  backoffMultiplier?: number
  retryableErrors?: string[]
}

interface RateLimitStatus {
  requestsRemaining: number
  tokensRemaining: number
  resetAt: Date
  queueLength: number
  isThrottled: boolean
  currentDelay: number
}
```

## Enhanced Processor API

### EnhancedClaudeProcessor Class

```typescript
/**
 * Main orchestrator for Claude-based memory extraction
 */
export class EnhancedClaudeProcessor {
  constructor(config: ProcessorConfig)

  /**
   * Process a batch of messages with mood scoring
   */
  async processMessageBatch(messages: Message[]): Promise<ExtractedMemory[]>

  /**
   * Process with custom extraction parameters
   */
  async processWithParams(
    messages: Message[],
    params: ProcessingParams,
  ): Promise<ExtractedMemory[]>

  /**
   * Filter messages by emotional salience
   */
  filterByEmotionalSalience(
    messages: Message[],
    deltas: MoodDelta[],
    threshold?: number,
  ): Message[]

  /**
   * Estimate processing cost
   */
  estimateCost(messages: Message[]): CostEstimate

  /**
   * Get processing statistics
   */
  getStats(): ProcessingStats
}

interface ProcessorConfig {
  database: PrismaClient
  claudeClient?: ClaudeClient
  promptBuilder?: EnhancedPromptBuilder
  rateLimiter?: RateLimiter
  moodScorer?: MoodScorer
  deltaDetector?: DeltaDetector
  logger?: Logger
}

interface ProcessingParams {
  mode: 'quality' | 'speed' | 'balanced'
  significanceThreshold?: number
  includeRawResponse?: boolean
  mockMode?: boolean
  customPromptTemplate?: string
}

interface CostEstimate {
  estimatedTokens: number
  estimatedCost: number
  estimatedTime: number
  confidence: number
}

interface ProcessingStats {
  totalProcessed: number
  successfulExtractions: number
  failedExtractions: number
  averageConfidence: number
  totalCost: number
  processingTime: number
}
```

## Response Parser API

### ClaudeResponseParser Class

```typescript
/**
 * Parses and validates Claude API responses
 */
export class ClaudeResponseParser {
  constructor(config?: ParserConfig)

  /**
   * Parse memory response from Claude
   */
  parseMemoryResponse(
    response: string | Anthropic.Message,
    moodScores: MoodScore[],
    moodDeltas: MoodDelta[],
  ): ExtractedMemory[]

  /**
   * Parse streaming response chunks
   */
  parseStreamChunk(chunk: MessageStreamEvent): Partial<ExtractedMemory>

  /**
   * Validate response against schema
   */
  validateResponse(response: unknown): ValidationResult<ExtractedMemory>

  /**
   * Extract confidence from response
   */
  extractConfidence(response: unknown): number

  /**
   * Handle parsing errors
   */
  handleParsingError(error: Error, response: unknown): ExtractedMemory | null
}

interface ParserConfig {
  strictMode?: boolean
  fallbackOnError?: boolean
  customValidators?: Validator[]
  schemaVersion?: string
}

interface ValidationResult<T> {
  valid: boolean
  data?: T
  errors?: ValidationError[]
  warnings?: string[]
}

interface ValidationError {
  path: string
  message: string
  value?: unknown
}
```

## Error Handler API

### ClaudeErrorHandler Class

```typescript
/**
 * Handles errors from Claude API interactions
 */
export class ClaudeErrorHandler {
  constructor(config?: ErrorHandlerConfig)

  /**
   * Handle processing error with recovery
   */
  async handleProcessingError(
    error: Error,
    context: ProcessingContext,
  ): Promise<RecoveryResult>

  /**
   * Classify error type
   */
  classifyError(error: Error): ErrorType

  /**
   * Get recovery strategy for error
   */
  getRecoveryStrategy(errorType: ErrorType): RecoveryStrategy

  /**
   * Log error with context
   */
  logError(error: Error, context: ProcessingContext): void

  /**
   * Check if error is retryable
   */
  isRetryable(error: Error): boolean
}

interface ErrorHandlerConfig {
  maxRetries?: number
  enableFallback?: boolean
  logLevel?: 'debug' | 'info' | 'warn' | 'error'
  customStrategies?: Map<ErrorType, RecoveryStrategy>
}

interface ProcessingContext {
  messages: Message[]
  attempt: number
  startTime: Date
  lastError?: Error
  metadata?: Record<string, unknown>
}

interface RecoveryResult {
  success: boolean
  result?: ExtractedMemory[]
  error?: Error
  strategy: string
  attempts: number
}

enum ErrorType {
  RATE_LIMIT = 'rate_limit',
  AUTHENTICATION = 'authentication',
  INVALID_REQUEST = 'invalid_request',
  TIMEOUT = 'timeout',
  PARSING = 'parsing',
  NETWORK = 'network',
  UNKNOWN = 'unknown',
}

type RecoveryStrategy = (
  error: Error,
  context: ProcessingContext,
) => Promise<RecoveryResult>
```

## Configuration API

### ConfigurationManager Class

```typescript
/**
 * Manages Claude integration configuration
 */
export class ConfigurationManager {
  constructor(config?: ConfigOptions)

  /**
   * Load configuration from environment
   */
  loadFromEnv(): ClaudeConfig

  /**
   * Validate configuration
   */
  validateConfig(config: ClaudeConfig): ValidationResult<ClaudeConfig>

  /**
   * Get current configuration
   */
  getConfig(): ClaudeConfig

  /**
   * Update configuration
   */
  updateConfig(updates: Partial<ClaudeConfig>): void

  /**
   * Reset to defaults
   */
  resetToDefaults(): void
}

interface ConfigOptions {
  envPrefix?: string // Default: 'ANTHROPIC_'
  configFile?: string
  defaults?: Partial<ClaudeConfig>
}
```

## Cost Estimator API

### CostEstimator Class

```typescript
/**
 * Estimates and tracks API usage costs
 */
export class CostEstimator {
  constructor(pricing?: PricingModel)

  /**
   * Estimate cost for messages
   */
  estimateMessageCost(messages: Message[], model?: string): CostBreakdown

  /**
   * Track actual usage
   */
  trackUsage(usage: TokenUsage): void

  /**
   * Get usage report
   */
  getUsageReport(period?: 'hour' | 'day' | 'week' | 'month'): UsageReport

  /**
   * Check if within budget
   */
  isWithinBudget(budget: number): boolean

  /**
   * Get remaining budget
   */
  getRemainingBudget(budget: number): number
}

interface PricingModel {
  inputTokenPrice: number // Per 1K tokens
  outputTokenPrice: number // Per 1K tokens
  model: string
}

interface CostBreakdown {
  inputTokens: number
  outputTokens: number
  inputCost: number
  outputCost: number
  totalCost: number
}

interface TokenUsage {
  inputTokens: number
  outputTokens: number
  model: string
  timestamp: Date
}

interface UsageReport {
  period: string
  totalRequests: number
  totalInputTokens: number
  totalOutputTokens: number
  totalCost: number
  averageCostPerRequest: number
  peakUsageTime?: Date
}
```

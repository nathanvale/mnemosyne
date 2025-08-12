/**
 * Core types for LLM provider abstraction
 */

/**
 * Supported LLM provider types
 */
export type ProviderType = 'claude' | 'openai'

/**
 * Message role in conversation
 */
export type MessageRole = 'system' | 'user' | 'assistant'

/**
 * Individual message in a conversation
 */
export interface ConversationMessage {
  role: MessageRole
  content: string
}

/**
 * Request structure for LLM providers
 */
export interface LLMRequest {
  messages: ConversationMessage[]
  temperature?: number
  maxTokens?: number
  topP?: number
  stopSequences?: string[]
  metadata?: Record<string, unknown>
}

/**
 * Token usage statistics
 */
export interface TokenUsage {
  inputTokens: number
  outputTokens: number
  totalTokens: number
}

/**
 * Response from LLM provider
 */
export interface LLMResponse {
  content: string
  usage: TokenUsage
  model: string
  finishReason: 'stop' | 'length' | 'error'
  metadata?: Record<string, unknown>
}

/**
 * Stream event handlers
 */
export interface StreamHandlers {
  onChunk?: (chunk: string) => void
  onComplete?: (response: LLMResponse) => void
  onError?: (error: Error) => void
}

/**
 * Provider capability information
 */
export interface ProviderCapabilities {
  streaming: boolean
  maxInputTokens: number
  maxOutputTokens: number
  supportedModels: string[]
  jsonMode: boolean
  functionCalling: boolean
  visionSupport: boolean
}

/**
 * Pricing information for a model
 */
export interface ModelPricing {
  inputPer1K: number // Cost per 1000 input tokens in USD
  outputPer1K: number // Cost per 1000 output tokens in USD
}

/**
 * Provider pricing catalog entry
 */
export interface ProviderPricing {
  provider: string
  models: Record<string, ModelPricing>
}

/**
 * Complete pricing catalog
 */
export interface PricingCatalog {
  version: string
  providers: Record<string, ProviderPricing>
}

/**
 * Provider configuration
 */
export interface ProviderConfig {
  provider: string
  apiKey?: string
  model?: string
  maxOutputTokens?: number
  temperature?: number
  streaming?: boolean
  timeout?: number
  maxRetries?: number
}

/**
 * Stream event types
 */
export type StreamEventType = 'start' | 'delta' | 'stop' | 'error'

/**
 * Stream event structure
 */
export interface StreamEvent {
  type: StreamEventType
  content?: string
  error?: string
  metadata?: Record<string, unknown>
}

/**
 * Individual provider configuration
 */
export interface IndividualProviderConfig {
  name: string
  apiKey: string
  model?: string
  baseURL?: string
  organizationId?: string
}

/**
 * Complete LLM provider configuration
 */
export interface LLMProviderConfig {
  primaryProvider: string
  fallbackProvider?: string
  dailyBudgetUSD: number
  maxRetries: number
  circuitBreakerThreshold: number
  circuitBreakerProbes: number
  providers: Record<string, IndividualProviderConfig>
}

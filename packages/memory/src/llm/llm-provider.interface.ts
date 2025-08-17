/**
 * LLM Provider Interface - Core abstraction for LLM providers
 *
 * This interface defines the contract that all LLM providers must implement
 * to integrate with the memory extraction system.
 */

import type {
  LLMRequest,
  LLMResponse,
  ProviderCapabilities,
  StreamHandlers,
  TokenUsage,
} from './types'

/**
 * Standard interface for LLM providers
 *
 * All providers (Claude, OpenAI, etc.) must implement this interface
 * to ensure compatibility with the extraction pipeline.
 */
export interface LLMProvider {
  /**
   * Unique identifier for the provider
   */
  readonly name: string

  /**
   * Send a request to the LLM provider and receive a response
   *
   * @param request - The request containing messages and parameters
   * @returns Promise resolving to the LLM response
   */
  send(request: LLMRequest): Promise<LLMResponse>

  /**
   * Stream a response from the LLM provider
   *
   * @param request - The request containing messages and parameters
   * @param handlers - Event handlers for streaming chunks
   * @returns Promise resolving to the complete response
   */
  stream?(request: LLMRequest, handlers: StreamHandlers): Promise<LLMResponse>

  /**
   * Count tokens in a text string using the provider's tokenizer
   *
   * @param text - Text to count tokens for
   * @returns Promise resolving to the token count
   */
  countTokens(text: string): Promise<number>

  /**
   * Get the capabilities of this provider
   *
   * @returns Provider capabilities including limits and features
   */
  getCapabilities(): ProviderCapabilities

  /**
   * Estimate the cost of a request based on token usage
   *
   * @param usage - Token usage statistics
   * @returns Estimated cost in USD
   */
  estimateCost(usage: TokenUsage): number

  /**
   * Validate the provider configuration
   *
   * @returns Promise resolving to true if configuration is valid
   */
  validateConfig(): Promise<boolean>
}

// Re-export types for convenience
export type {
  LLMRequest,
  LLMResponse,
  ProviderCapabilities,
  StreamHandlers,
  TokenUsage,
  MessageRole,
  StreamEvent,
  StreamEventType,
  ProviderConfig,
} from './types'

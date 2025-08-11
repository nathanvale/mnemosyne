/**
 * Claude Provider Implementation
 *
 * Implements the LLMProvider interface for Anthropic's Claude models.
 * Supports both streaming and non-streaming responses.
 */

import type {
  Message,
  MessageParam,
  TextBlock,
} from '@anthropic-ai/sdk/resources'

import Anthropic from '@anthropic-ai/sdk'

// Type for stream events from Anthropic SDK
interface StreamEvent {
  type: string
  delta?: {
    type?: string
    text?: string
    [key: string]: unknown
  }
}

import type {
  LLMProvider,
  LLMRequest,
  LLMResponse,
  ProviderCapabilities,
  StreamHandlers,
  TokenUsage,
} from '../llm-provider.interface.js'

import { PricingCatalog } from '../pricing-catalog.js'

/**
 * Claude provider implementation
 */
export class ClaudeProvider implements LLMProvider {
  public readonly name = 'claude'
  private readonly client: Anthropic
  private readonly apiKey: string
  private readonly model: string

  constructor() {
    this.apiKey = process.env.MEMORY_LLM_API_KEY_CLAUDE || ''
    if (!this.apiKey) {
      throw new Error('Claude API key not configured')
    }

    this.model = process.env.MEMORY_LLM_MODEL_CLAUDE || 'claude-3-sonnet'
    this.client = new Anthropic({
      apiKey: this.apiKey,
    })
  }

  /**
   * Send a non-streaming request to Claude
   */
  async send(request: LLMRequest): Promise<LLMResponse> {
    try {
      // Extract system message if present
      const systemMessage = request.messages.find((m) => m.role === 'system')
      const userMessages = request.messages.filter((m) => m.role !== 'system')

      // Convert messages to Claude format
      const claudeMessages: MessageParam[] = userMessages.map((msg) => ({
        role: msg.role as 'user' | 'assistant',
        content: msg.content,
      }))

      // Create the message
      const response = await this.client.messages.create({
        model: this.model,
        messages: claudeMessages,
        system: systemMessage?.content,
        temperature: request.temperature,
        max_tokens: request.maxTokens || 4096,
        stop_sequences: request.stopSequences,
      })

      return this.formatResponse(response)
    } catch (error) {
      // Re-throw error with proper typing for error handling layer
      throw error
    }
  }

  /**
   * Stream a response from Claude
   */
  async stream(
    request: LLMRequest,
    handlers: StreamHandlers,
  ): Promise<LLMResponse> {
    try {
      // Extract system message if present
      const systemMessage = request.messages.find((m) => m.role === 'system')
      const userMessages = request.messages.filter((m) => m.role !== 'system')

      // Convert messages to Claude format
      const claudeMessages: MessageParam[] = userMessages.map((msg) => ({
        role: msg.role as 'user' | 'assistant',
        content: msg.content,
      }))

      // Create streaming message
      const stream = this.client.messages.stream({
        model: this.model,
        messages: claudeMessages,
        system: systemMessage?.content,
        temperature: request.temperature,
        max_tokens: request.maxTokens || 4096,
        stop_sequences: request.stopSequences,
      })

      // Process stream events
      for await (const event of stream) {
        this.handleStreamEvent(event as StreamEvent, handlers)
      }

      // Get final message
      const finalMessage = (stream as unknown as { finalMessage: Message })
        .finalMessage
      const response = this.formatResponse(finalMessage)

      // Call completion handler
      handlers.onComplete?.(response)

      return response
    } catch (error) {
      handlers.onError?.(error as Error)
      throw error
    }
  }

  /**
   * Count tokens in text using Claude's tokenizer
   */
  async countTokens(text: string): Promise<number> {
    try {
      const result = await this.client.beta.messages.countTokens({
        model: this.model,
        messages: [{ role: 'user', content: text }],
      })
      return result.input_tokens
    } catch (error) {
      throw error
    }
  }

  /**
   * Get provider capabilities
   */
  getCapabilities(): ProviderCapabilities {
    return {
      streaming: true,
      maxInputTokens: 200000,
      maxOutputTokens: 4096,
      supportedModels: ['claude-3-opus', 'claude-3-sonnet', 'claude-3-haiku'],
      jsonMode: false,
      functionCalling: true,
      visionSupport: true,
    }
  }

  /**
   * Estimate cost based on token usage
   */
  estimateCost(usage: TokenUsage): number {
    return PricingCatalog.calculateCost(
      'anthropic',
      this.model,
      usage.inputTokens,
      usage.outputTokens,
    )
  }

  /**
   * Validate provider configuration
   */
  async validateConfig(): Promise<boolean> {
    try {
      await this.client.messages.create({
        model: this.model,
        messages: [{ role: 'user', content: 'Hello' }],
        max_tokens: 10,
      })
      return true
    } catch {
      return false
    }
  }

  /**
   * Format Claude response to standard LLMResponse
   */
  private formatResponse(message: Message): LLMResponse {
    // Extract text content, ignoring tool_use blocks
    const textContent = message.content
      .filter((block): block is TextBlock => block.type === 'text')
      .map((block) => block.text)
      .join('')

    // Map stop reason
    let finishReason: LLMResponse['finishReason'] = 'stop'
    if (message.stop_reason === 'max_tokens') {
      finishReason = 'length'
    } else if (
      message.stop_reason === 'stop_sequence' ||
      message.stop_reason === 'end_turn' ||
      message.stop_reason === 'tool_use'
    ) {
      finishReason = 'stop'
    }

    return {
      content: textContent,
      usage: {
        inputTokens: message.usage.input_tokens,
        outputTokens: message.usage.output_tokens,
        totalTokens: message.usage.input_tokens + message.usage.output_tokens,
      },
      model: message.model,
      finishReason,
      metadata: {
        messageId: message.id,
      },
    }
  }

  /**
   * Handle streaming events
   */
  private handleStreamEvent(
    event: StreamEvent,
    handlers: StreamHandlers,
  ): void {
    if (event.type === 'content_block_delta') {
      // Only emit text deltas, ignore tool_use deltas
      if (event.delta?.type === 'text_delta' && event.delta.text) {
        handlers.onChunk?.(event.delta.text)
      }
    }
  }
}

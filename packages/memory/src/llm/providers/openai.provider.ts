/**
 * OpenAI Provider Implementation
 *
 * Implements the LLMProvider interface for OpenAI's GPT models.
 * Supports both streaming and non-streaming responses.
 */

import type {
  ChatCompletion,
  ChatCompletionMessageParam,
} from 'openai/resources/chat'

import OpenAI from 'openai'

import type {
  LLMProvider,
  LLMRequest,
  LLMResponse,
  ProviderCapabilities,
  StreamHandlers,
  TokenUsage,
} from '../llm-provider.interface.js'

import { PricingCatalog } from '../pricing-catalog.js'

// Type for OpenAI streaming chunks
interface StreamChunk {
  id: string
  model: string
  choices: Array<{
    index?: number
    delta?: {
      content?: string
      role?: string
    }
    finish_reason?: string | null
  }>
  usage?: {
    prompt_tokens: number
    completion_tokens: number
    total_tokens: number
  }
}

/**
 * OpenAI provider implementation
 */
export class OpenAIProvider implements LLMProvider {
  public readonly name = 'openai'
  private readonly client: OpenAI
  private readonly apiKey: string
  private readonly model: string
  private readonly baseUrl?: string
  private readonly organization?: string

  constructor() {
    this.apiKey = process.env.MEMORY_LLM_API_KEY_OPENAI || ''
    if (!this.apiKey) {
      throw new Error('OpenAI API key not configured')
    }

    this.model = process.env.MEMORY_LLM_MODEL_OPENAI || 'gpt-4-turbo'
    this.baseUrl = process.env.MEMORY_LLM_BASE_URL_OPENAI
    this.organization = process.env.MEMORY_LLM_ORG_ID_OPENAI

    this.client = new OpenAI({
      apiKey: this.apiKey,
      baseURL: this.baseUrl,
      organization: this.organization,
    })
  }

  /**
   * Send a non-streaming request to OpenAI
   */
  async send(request: LLMRequest): Promise<LLMResponse> {
    // Convert messages to OpenAI format
    const openAIMessages: ChatCompletionMessageParam[] = request.messages.map(
      (msg) => ({
        role: msg.role as 'system' | 'user' | 'assistant',
        content: msg.content,
      }),
    )

    // Build request parameters
    const requestParams: Parameters<
      typeof this.client.chat.completions.create
    >[0] = {
      model: this.model,
      messages: openAIMessages,
      temperature: request.temperature,
      max_tokens: request.maxTokens || 4096,
      stop: request.stopSequences,
      stream: false as const,
    }

    // Create the completion
    const response = (await this.client.chat.completions.create(
      requestParams,
    )) as ChatCompletion

    return this.formatResponse(response)
  }

  /**
   * Stream a response from OpenAI
   */
  async stream(
    request: LLMRequest,
    handlers: StreamHandlers,
  ): Promise<LLMResponse> {
    try {
      // Convert messages to OpenAI format
      const openAIMessages: ChatCompletionMessageParam[] = request.messages.map(
        (msg) => ({
          role: msg.role as 'system' | 'user' | 'assistant',
          content: msg.content,
        }),
      )

      // Build request parameters
      const requestParams: Parameters<
        typeof this.client.chat.completions.create
      >[0] = {
        model: this.model,
        messages: openAIMessages,
        temperature: request.temperature,
        max_tokens: request.maxTokens || 4096,
        stop: request.stopSequences,
        stream: true as const,
      }

      // Create streaming completion - cast to proper stream type
      const stream = (await this.client.chat.completions.create(
        requestParams,
      )) as AsyncIterable<StreamChunk>

      let fullContent = ''
      let messageId = ''
      let model = ''
      let finishReason: LLMResponse['finishReason'] = 'stop'
      let usage: TokenUsage | undefined

      // Process stream chunks
      for await (const chunk of stream) {
        messageId = chunk.id
        model = chunk.model

        // Extract content from chunk
        if (chunk.choices[0]?.delta?.content) {
          const content = chunk.choices[0].delta.content
          fullContent += content
          handlers.onChunk?.(content)
        }

        // Check for finish reason
        if (chunk.choices[0]?.finish_reason) {
          finishReason = this.mapFinishReason(chunk.choices[0].finish_reason)
        }

        // Extract usage if available
        if (chunk.usage) {
          usage = {
            inputTokens: chunk.usage.prompt_tokens,
            outputTokens: chunk.usage.completion_tokens,
            totalTokens: chunk.usage.total_tokens,
          }
        }
      }

      // Construct final response
      const response: LLMResponse = {
        content: fullContent,
        usage: usage || {
          inputTokens: 0,
          outputTokens: 0,
          totalTokens: 0,
        },
        model,
        finishReason,
        metadata: {
          messageId,
        },
      }

      // Call completion handler
      handlers.onComplete?.(response)

      return response
    } catch (error) {
      handlers.onError?.(error as Error)
      throw error
    }
  }

  /**
   * Count tokens in text using estimation
   * OpenAI doesn't provide a public token counting API
   */
  async countTokens(text: string): Promise<number> {
    // Handle empty text
    if (!text || text.length === 0) {
      return 0
    }

    // Rough estimation: ~4 characters per token for English text
    // This is a simplified approximation
    return Math.ceil(text.length / 4)
  }

  /**
   * Get provider capabilities
   */
  getCapabilities(): ProviderCapabilities {
    return {
      streaming: true,
      maxInputTokens: 128000, // GPT-4 Turbo context window
      maxOutputTokens: 4096,
      supportedModels: ['gpt-4-turbo', 'gpt-4', 'gpt-3.5-turbo'],
      jsonMode: true,
      functionCalling: true,
      visionSupport: true,
    }
  }

  /**
   * Estimate cost based on token usage
   */
  estimateCost(usage: TokenUsage): number {
    return PricingCatalog.calculateCost(
      'openai',
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
      await this.client.chat.completions.create({
        model: this.model,
        messages: [{ role: 'user', content: 'Hello' }],
        max_tokens: 10,
        stream: false,
      })
      return true
    } catch {
      return false
    }
  }

  /**
   * Format OpenAI response to standard LLMResponse
   */
  private formatResponse(completion: ChatCompletion): LLMResponse {
    const choice = completion.choices[0]

    return {
      content: choice?.message?.content || '',
      usage: {
        inputTokens: completion.usage?.prompt_tokens || 0,
        outputTokens: completion.usage?.completion_tokens || 0,
        totalTokens: completion.usage?.total_tokens || 0,
      },
      model: completion.model,
      finishReason: this.mapFinishReason(choice?.finish_reason),
      metadata: {
        messageId: completion.id,
      },
    }
  }

  /**
   * Map OpenAI finish reasons to standard finish reasons
   */
  private mapFinishReason(
    reason: string | null | undefined,
  ): LLMResponse['finishReason'] {
    switch (reason) {
      case 'stop':
        return 'stop'
      case 'length':
        return 'length'
      case 'function_call':
      case 'tool_calls':
      case 'content_filter':
      default:
        return 'stop'
    }
  }
}

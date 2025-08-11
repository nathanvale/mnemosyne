/**
 * Tests for Claude Provider Implementation
 */

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import type {
  LLMRequest,
  LLMResponse,
  StreamHandlers,
  TokenUsage,
} from '../../types.js'

import { PricingCatalog, INITIAL_PRICING } from '../../pricing-catalog.js'
import { ClaudeProvider } from '../claude.provider.js'

// Mock the Anthropic SDK
vi.mock('@anthropic-ai/sdk', () => {
  return {
    default: vi.fn().mockImplementation(() => ({
      messages: {
        create: vi.fn(),
        stream: vi.fn(),
      },
      beta: {
        messages: {
          countTokens: vi.fn(),
        },
      },
    })),
  }
})

// Type for mocked Anthropic client
interface MockAnthropicClient {
  messages: {
    create: ReturnType<typeof vi.fn>
    stream: ReturnType<typeof vi.fn>
  }
  beta: {
    messages: {
      countTokens: ReturnType<typeof vi.fn>
    }
  }
}

describe('ClaudeProvider', () => {
  let provider: ClaudeProvider
  let mockAnthropicClient: MockAnthropicClient

  beforeEach(() => {
    // Clear and register pricing
    PricingCatalog.clear()
    INITIAL_PRICING.forEach((pricing) => PricingCatalog.register(pricing))

    // Set up environment
    process.env.MEMORY_LLM_API_KEY_CLAUDE = 'test-api-key'
    process.env.MEMORY_LLM_MODEL_CLAUDE = 'claude-3-sonnet'

    // Create provider
    provider = new ClaudeProvider()

    // Get the mocked client
    mockAnthropicClient = (
      provider as unknown as { client: MockAnthropicClient }
    ).client
  })

  afterEach(() => {
    vi.clearAllMocks()
    delete process.env.MEMORY_LLM_API_KEY_CLAUDE
    delete process.env.MEMORY_LLM_MODEL_CLAUDE
  })

  describe('constructor', () => {
    it('should initialize with API key from environment', () => {
      expect(provider.name).toBe('claude')
      expect((provider as unknown as { apiKey: string }).apiKey).toBe(
        'test-api-key',
      )
    })

    it('should throw error when API key is missing', () => {
      delete process.env.MEMORY_LLM_API_KEY_CLAUDE
      expect(() => new ClaudeProvider()).toThrow(
        'Claude API key not configured',
      )
    })

    it('should use default model when not specified', () => {
      delete process.env.MEMORY_LLM_MODEL_CLAUDE
      const defaultProvider = new ClaudeProvider()
      expect((defaultProvider as unknown as { model: string }).model).toBe(
        'claude-3-sonnet',
      )
    })

    it('should use custom model from environment', () => {
      process.env.MEMORY_LLM_MODEL_CLAUDE = 'claude-3-opus'
      const customProvider = new ClaudeProvider()
      expect((customProvider as unknown as { model: string }).model).toBe(
        'claude-3-opus',
      )
    })
  })

  describe('send', () => {
    it('should send request and return response', async () => {
      const mockResponse = {
        id: 'msg-123',
        type: 'message',
        role: 'assistant',
        content: [{ type: 'text', text: 'Test response' }],
        model: 'claude-3-sonnet',
        stop_reason: 'end_turn',
        usage: {
          input_tokens: 100,
          output_tokens: 50,
        },
      }

      mockAnthropicClient.messages.create.mockResolvedValue(mockResponse)

      const request: LLMRequest = {
        messages: [
          { role: 'system', content: 'You are a helpful assistant' },
          { role: 'user', content: 'Hello!' },
        ],
        temperature: 0.7,
        maxTokens: 1000,
      }

      const response = await provider.send(request)

      expect(response).toEqual({
        content: 'Test response',
        usage: {
          inputTokens: 100,
          outputTokens: 50,
          totalTokens: 150,
        },
        model: 'claude-3-sonnet',
        finishReason: 'stop',
        metadata: {
          messageId: 'msg-123',
        },
      })

      expect(mockAnthropicClient.messages.create).toHaveBeenCalledWith({
        model: 'claude-3-sonnet',
        messages: [{ role: 'user', content: 'Hello!' }],
        system: 'You are a helpful assistant',
        temperature: 0.7,
        max_tokens: 1000,
      })
    })

    it('should handle multiple content blocks', async () => {
      const mockResponse = {
        id: 'msg-456',
        type: 'message',
        role: 'assistant',
        content: [
          { type: 'text', text: 'Part 1' },
          { type: 'text', text: 'Part 2' },
        ],
        model: 'claude-3-sonnet',
        stop_reason: 'end_turn',
        usage: {
          input_tokens: 100,
          output_tokens: 50,
        },
      }

      mockAnthropicClient.messages.create.mockResolvedValue(mockResponse)

      const request: LLMRequest = {
        messages: [{ role: 'user', content: 'Test' }],
      }

      const response = await provider.send(request)

      expect(response.content).toBe('Part 1Part 2')
    })

    it('should map stop reasons correctly', async () => {
      const testCases = [
        { stop_reason: 'end_turn', expected: 'stop' },
        { stop_reason: 'max_tokens', expected: 'length' },
        { stop_reason: 'stop_sequence', expected: 'stop' },
        { stop_reason: 'tool_use', expected: 'stop' },
      ]

      for (const { stop_reason, expected } of testCases) {
        const mockResponse = {
          id: 'msg-789',
          type: 'message',
          role: 'assistant',
          content: [{ type: 'text', text: 'Test' }],
          model: 'claude-3-sonnet',
          stop_reason,
          usage: {
            input_tokens: 10,
            output_tokens: 5,
          },
        }

        mockAnthropicClient.messages.create.mockResolvedValue(mockResponse)

        const response = await provider.send({
          messages: [{ role: 'user', content: 'Test' }],
        })

        expect(response.finishReason).toBe(expected)
      }
    })

    it('should handle API errors appropriately', async () => {
      const error = new Error('API Error')
      ;(
        error as Error & { status?: number; headers?: Record<string, string> }
      ).status = 429
      ;(
        error as Error & { status?: number; headers?: Record<string, string> }
      ).headers = { 'retry-after': '60' }

      mockAnthropicClient.messages.create.mockRejectedValue(error)

      const request: LLMRequest = {
        messages: [{ role: 'user', content: 'Test' }],
      }

      await expect(provider.send(request)).rejects.toThrow('API Error')
    })

    it('should extract system message from messages array', async () => {
      const mockResponse = {
        id: 'msg-sys',
        type: 'message',
        role: 'assistant',
        content: [{ type: 'text', text: 'Response' }],
        model: 'claude-3-sonnet',
        stop_reason: 'end_turn',
        usage: {
          input_tokens: 100,
          output_tokens: 50,
        },
      }

      mockAnthropicClient.messages.create.mockResolvedValue(mockResponse)

      const request: LLMRequest = {
        messages: [
          { role: 'system', content: 'System prompt' },
          { role: 'user', content: 'User message' },
          { role: 'assistant', content: 'Assistant response' },
          { role: 'user', content: 'Another user message' },
        ],
      }

      await provider.send(request)

      expect(mockAnthropicClient.messages.create).toHaveBeenCalledWith({
        model: 'claude-3-sonnet',
        system: 'System prompt',
        messages: [
          { role: 'user', content: 'User message' },
          { role: 'assistant', content: 'Assistant response' },
          { role: 'user', content: 'Another user message' },
        ],
        max_tokens: 4096,
      })
    })
  })

  describe('stream', () => {
    it('should stream response chunks', async () => {
      const chunks: string[] = []
      const handlers: StreamHandlers = {
        onChunk: (chunk) => chunks.push(chunk),
      }

      // Create a mock stream that mimics the Anthropic SDK stream
      const mockStream = {
        async *[Symbol.asyncIterator]() {
          yield {
            type: 'message_start',
            message: {
              id: 'msg-stream',
              type: 'message',
              role: 'assistant',
              content: [],
              model: 'claude-3-sonnet',
              usage: { input_tokens: 10, output_tokens: 0 },
            },
          }
          yield {
            type: 'content_block_start',
            index: 0,
            content_block: { type: 'text', text: '' },
          }
          yield {
            type: 'content_block_delta',
            index: 0,
            delta: { type: 'text_delta', text: 'Hello' },
          }
          yield {
            type: 'content_block_delta',
            index: 0,
            delta: { type: 'text_delta', text: ' world' },
          }
          yield {
            type: 'content_block_stop',
            index: 0,
          }
          yield {
            type: 'message_delta',
            delta: { stop_reason: 'end_turn' },
            usage: { output_tokens: 5 },
          }
          yield {
            type: 'message_stop',
          }
        },
        get finalMessage() {
          return {
            id: 'msg-stream',
            type: 'message',
            role: 'assistant',
            content: [{ type: 'text', text: 'Hello world' }],
            model: 'claude-3-sonnet',
            stop_reason: 'end_turn',
            usage: {
              input_tokens: 10,
              output_tokens: 5,
            },
          }
        },
      }

      mockAnthropicClient.messages.stream.mockReturnValue(mockStream)

      const request: LLMRequest = {
        messages: [{ role: 'user', content: 'Test' }],
      }

      const response = await provider.stream!(request, handlers)

      expect(chunks).toEqual(['Hello', ' world'])
      expect(response).toEqual({
        content: 'Hello world',
        usage: {
          inputTokens: 10,
          outputTokens: 5,
          totalTokens: 15,
        },
        model: 'claude-3-sonnet',
        finishReason: 'stop',
        metadata: {
          messageId: 'msg-stream',
        },
      })
    })

    it('should handle stream errors', async () => {
      let errorCalled = false
      const handlers: StreamHandlers = {
        onError: (error) => {
          errorCalled = true
          expect(error.message).toBe('Stream error')
        },
      }

      const mockStream = {
        async *[Symbol.asyncIterator]() {
          yield {
            type: 'message_start',
            message: {
              id: 'msg-error',
              type: 'message',
              role: 'assistant',
              content: [],
              model: 'claude-3-sonnet',
              usage: { input_tokens: 10, output_tokens: 0 },
            },
          }
          throw new Error('Stream error')
        },
        get finalMessage() {
          return null
        },
      }

      mockAnthropicClient.messages.stream.mockReturnValue(mockStream)

      const request: LLMRequest = {
        messages: [{ role: 'user', content: 'Test' }],
      }

      await expect(provider.stream!(request, handlers)).rejects.toThrow(
        'Stream error',
      )
      expect(errorCalled).toBe(true)
    })

    it('should call onComplete handler when streaming finishes', async () => {
      let completeCalled = false
      let completeResponse: LLMResponse | undefined

      const handlers: StreamHandlers = {
        onComplete: (response) => {
          completeCalled = true
          completeResponse = response
        },
      }

      const mockStream = {
        async *[Symbol.asyncIterator]() {
          yield {
            type: 'message_start',
            message: {
              id: 'msg-complete',
              type: 'message',
              role: 'assistant',
              content: [],
              model: 'claude-3-sonnet',
              usage: { input_tokens: 10, output_tokens: 0 },
            },
          }
          yield {
            type: 'content_block_delta',
            index: 0,
            delta: { type: 'text_delta', text: 'Done' },
          }
          yield {
            type: 'message_stop',
          }
        },
        get finalMessage() {
          return {
            id: 'msg-complete',
            type: 'message',
            role: 'assistant',
            content: [{ type: 'text', text: 'Done' }],
            model: 'claude-3-sonnet',
            stop_reason: 'end_turn',
            usage: {
              input_tokens: 10,
              output_tokens: 2,
            },
          }
        },
      }

      mockAnthropicClient.messages.stream.mockReturnValue(mockStream)

      const request: LLMRequest = {
        messages: [{ role: 'user', content: 'Test' }],
      }

      await provider.stream!(request, handlers)

      expect(completeCalled).toBe(true)
      expect(completeResponse).toEqual({
        content: 'Done',
        usage: {
          inputTokens: 10,
          outputTokens: 2,
          totalTokens: 12,
        },
        model: 'claude-3-sonnet',
        finishReason: 'stop',
        metadata: {
          messageId: 'msg-complete',
        },
      })
    })
  })

  describe('countTokens', () => {
    it('should count tokens using the SDK', async () => {
      mockAnthropicClient.beta.messages.countTokens.mockResolvedValue({
        input_tokens: 42,
      })

      const count = await provider.countTokens('Test text for counting')

      expect(count).toBe(42)
      expect(
        mockAnthropicClient.beta.messages.countTokens,
      ).toHaveBeenCalledWith({
        model: 'claude-3-sonnet',
        messages: [{ role: 'user', content: 'Test text for counting' }],
      })
    })

    it('should handle token counting errors', async () => {
      mockAnthropicClient.beta.messages.countTokens.mockRejectedValue(
        new Error('Token counting failed'),
      )

      await expect(provider.countTokens('Test text')).rejects.toThrow(
        'Token counting failed',
      )
    })
  })

  describe('getCapabilities', () => {
    it('should return Claude provider capabilities', () => {
      const capabilities = provider.getCapabilities()

      expect(capabilities).toEqual({
        streaming: true,
        maxInputTokens: 200000,
        maxOutputTokens: 4096,
        supportedModels: ['claude-3-opus', 'claude-3-sonnet', 'claude-3-haiku'],
        jsonMode: false,
        functionCalling: true,
        visionSupport: true,
      })
    })
  })

  describe('estimateCost', () => {
    it('should estimate cost based on token usage', () => {
      const usage: TokenUsage = {
        inputTokens: 1000,
        outputTokens: 500,
        totalTokens: 1500,
      }

      const cost = provider.estimateCost(usage)

      // Based on claude-3-sonnet pricing:
      // Input: 1000 tokens * $0.003/1K = $0.003
      // Output: 500 tokens * $0.015/1K = $0.0075
      // Total: $0.0105
      expect(cost).toBeCloseTo(0.0105, 6)
    })

    it('should return 0 for unknown model', () => {
      process.env.MEMORY_LLM_MODEL_CLAUDE = 'unknown-model'
      const unknownProvider = new ClaudeProvider()

      const usage: TokenUsage = {
        inputTokens: 1000,
        outputTokens: 500,
        totalTokens: 1500,
      }

      const cost = unknownProvider.estimateCost(usage)
      expect(cost).toBe(0)
    })
  })

  describe('validateConfig', () => {
    it('should validate configuration successfully', async () => {
      mockAnthropicClient.messages.create.mockResolvedValue({
        id: 'msg-validate',
        type: 'message',
        role: 'assistant',
        content: [{ type: 'text', text: 'Valid' }],
        model: 'claude-3-sonnet',
        stop_reason: 'end_turn',
        usage: {
          input_tokens: 5,
          output_tokens: 1,
        },
      })

      const isValid = await provider.validateConfig()

      expect(isValid).toBe(true)
      expect(mockAnthropicClient.messages.create).toHaveBeenCalledWith({
        model: 'claude-3-sonnet',
        messages: [{ role: 'user', content: 'Hello' }],
        max_tokens: 10,
      })
    })

    it('should return false for invalid configuration', async () => {
      mockAnthropicClient.messages.create.mockRejectedValue(
        new Error('Invalid API key'),
      )

      const isValid = await provider.validateConfig()

      expect(isValid).toBe(false)
    })
  })

  describe('error mapping', () => {
    it('should properly map rate limit errors', async () => {
      const error = new Error('Rate limit exceeded')
      ;(
        error as Error & { status?: number; headers?: Record<string, string> }
      ).status = 429
      ;(
        error as Error & { status?: number; headers?: Record<string, string> }
      ).headers = { 'retry-after': '60' }

      mockAnthropicClient.messages.create.mockRejectedValue(error)

      try {
        await provider.send({
          messages: [{ role: 'user', content: 'Test' }],
        })
      } catch (err) {
        const error = err as Error & { status?: number }
        expect(error.message).toBe('Rate limit exceeded')
        expect(error.status).toBe(429)
      }
    })

    it('should properly map authentication errors', async () => {
      const error = new Error('Invalid API key')
      ;(error as Error & { status?: number }).status = 401

      mockAnthropicClient.messages.create.mockRejectedValue(error)

      try {
        await provider.send({
          messages: [{ role: 'user', content: 'Test' }],
        })
      } catch (err) {
        const error = err as Error & { status?: number }
        expect(error.message).toBe('Invalid API key')
        expect(error.status).toBe(401)
      }
    })

    it('should properly map timeout errors', async () => {
      const error = new Error('Request timeout')
      ;(error as Error & { code?: string }).code = 'ETIMEDOUT'

      mockAnthropicClient.messages.create.mockRejectedValue(error)

      try {
        await provider.send({
          messages: [{ role: 'user', content: 'Test' }],
        })
      } catch (err) {
        const error = err as Error & { code?: string }
        expect(error.message).toBe('Request timeout')
        expect(error.code).toBe('ETIMEDOUT')
      }
    })
  })

  describe('streaming event normalization', () => {
    it('should ignore tool_use blocks in streaming', async () => {
      const chunks: string[] = []
      const handlers: StreamHandlers = {
        onChunk: (chunk) => chunks.push(chunk),
      }

      const mockStream = {
        async *[Symbol.asyncIterator]() {
          yield {
            type: 'message_start',
            message: {
              id: 'msg-tool',
              type: 'message',
              role: 'assistant',
              content: [],
              model: 'claude-3-sonnet',
              usage: { input_tokens: 10, output_tokens: 0 },
            },
          }
          yield {
            type: 'content_block_start',
            index: 0,
            content_block: { type: 'text', text: '' },
          }
          yield {
            type: 'content_block_delta',
            index: 0,
            delta: { type: 'text_delta', text: 'Text content' },
          }
          yield {
            type: 'content_block_stop',
            index: 0,
          }
          // Tool use block - should be ignored
          yield {
            type: 'content_block_start',
            index: 1,
            content_block: {
              type: 'tool_use',
              id: 'tool-123',
              name: 'some_tool',
              input: {},
            },
          }
          yield {
            type: 'content_block_delta',
            index: 1,
            delta: {
              type: 'input_json_delta',
              partial_json: '{"key": "value"}',
            },
          }
          yield {
            type: 'content_block_stop',
            index: 1,
          }
          yield {
            type: 'message_stop',
          }
        },
        get finalMessage() {
          return {
            id: 'msg-tool',
            type: 'message',
            role: 'assistant',
            content: [
              { type: 'text', text: 'Text content' },
              {
                type: 'tool_use',
                id: 'tool-123',
                name: 'some_tool',
                input: { key: 'value' },
              },
            ],
            model: 'claude-3-sonnet',
            stop_reason: 'end_turn',
            usage: {
              input_tokens: 10,
              output_tokens: 5,
            },
          }
        },
      }

      mockAnthropicClient.messages.stream.mockReturnValue(mockStream)

      const response = await provider.stream!(
        { messages: [{ role: 'user', content: 'Test' }] },
        handlers,
      )

      // Only text content should be in chunks and response
      expect(chunks).toEqual(['Text content'])
      expect(response.content).toBe('Text content')
    })
  })
})

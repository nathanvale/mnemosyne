/**
 * Tests for OpenAI Provider Implementation
 */

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import type {
  LLMRequest,
  LLMResponse,
  StreamHandlers,
  TokenUsage,
} from '../../types'

import { PricingCatalog, INITIAL_PRICING } from '../../pricing-catalog'
import { OpenAIProvider } from '../openai.provider'

// Mock the OpenAI SDK
vi.mock('openai', () => {
  return {
    default: vi.fn().mockImplementation(() => ({
      chat: {
        completions: {
          create: vi.fn(),
        },
      },
      completions: {
        create: vi.fn(),
      },
    })),
  }
})

// Type for mocked OpenAI client
interface MockOpenAIClient {
  chat: {
    completions: {
      create: ReturnType<typeof vi.fn>
    }
  }
  completions: {
    create: ReturnType<typeof vi.fn>
  }
}

describe('OpenAIProvider', () => {
  let provider: OpenAIProvider
  let mockOpenAIClient: MockOpenAIClient

  beforeEach(() => {
    // Clear and register pricing
    PricingCatalog.clear()
    INITIAL_PRICING.forEach((pricing) => PricingCatalog.register(pricing))

    // Set up environment
    process.env.MEMORY_LLM_API_KEY_OPENAI = 'test-api-key'
    process.env.MEMORY_LLM_MODEL_OPENAI = 'gpt-4-turbo'

    // Create provider
    provider = new OpenAIProvider()

    // Get the mocked client
    mockOpenAIClient = (provider as unknown as { client: MockOpenAIClient })
      .client
  })

  afterEach(() => {
    vi.clearAllMocks()
    delete process.env.MEMORY_LLM_API_KEY_OPENAI
    delete process.env.MEMORY_LLM_MODEL_OPENAI
    delete process.env.MEMORY_LLM_BASE_URL_OPENAI
    delete process.env.MEMORY_LLM_ORG_ID_OPENAI
  })

  describe('constructor', () => {
    it('should initialize with API key from environment', () => {
      expect(provider.name).toBe('openai')
      expect((provider as unknown as { apiKey: string }).apiKey).toBe(
        'test-api-key',
      )
    })

    it('should throw error when API key is missing', () => {
      delete process.env.MEMORY_LLM_API_KEY_OPENAI
      expect(() => new OpenAIProvider()).toThrow(
        'OpenAI API key not configured',
      )
    })

    it('should use default model when not specified', () => {
      delete process.env.MEMORY_LLM_MODEL_OPENAI
      const defaultProvider = new OpenAIProvider()
      expect((defaultProvider as unknown as { model: string }).model).toBe(
        'gpt-4-turbo',
      )
    })

    it('should use custom model from environment', () => {
      process.env.MEMORY_LLM_MODEL_OPENAI = 'gpt-3.5-turbo'
      const customProvider = new OpenAIProvider()
      expect((customProvider as unknown as { model: string }).model).toBe(
        'gpt-3.5-turbo',
      )
    })

    it('should use custom base URL when provided', () => {
      process.env.MEMORY_LLM_BASE_URL_OPENAI = 'https://custom.openai.com'
      const customProvider = new OpenAIProvider()
      expect((customProvider as unknown as { baseUrl?: string }).baseUrl).toBe(
        'https://custom.openai.com',
      )
    })

    it('should use organization ID when provided', () => {
      process.env.MEMORY_LLM_ORG_ID_OPENAI = 'org-123'
      const customProvider = new OpenAIProvider()
      expect(
        (customProvider as unknown as { organization?: string }).organization,
      ).toBe('org-123')
    })
  })

  describe('send', () => {
    it('should send request and return response', async () => {
      const mockResponse = {
        id: 'chatcmpl-123',
        object: 'chat.completion',
        created: 1234567890,
        model: 'gpt-4-turbo',
        choices: [
          {
            index: 0,
            message: {
              role: 'assistant',
              content: 'Test response',
            },
            finish_reason: 'stop',
          },
        ],
        usage: {
          prompt_tokens: 100,
          completion_tokens: 50,
          total_tokens: 150,
        },
      }

      mockOpenAIClient.chat.completions.create.mockResolvedValue(mockResponse)

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
        model: 'gpt-4-turbo',
        finishReason: 'stop',
        metadata: {
          messageId: 'chatcmpl-123',
        },
      })

      expect(mockOpenAIClient.chat.completions.create).toHaveBeenCalledWith({
        model: 'gpt-4-turbo',
        messages: [
          { role: 'system', content: 'You are a helpful assistant' },
          { role: 'user', content: 'Hello!' },
        ],
        temperature: 0.7,
        max_tokens: 1000,
        stream: false,
      })
    })

    it('should handle stop sequences', async () => {
      const mockResponse = {
        id: 'chatcmpl-456',
        object: 'chat.completion',
        created: 1234567890,
        model: 'gpt-4-turbo',
        choices: [
          {
            index: 0,
            message: {
              role: 'assistant',
              content: 'Test',
            },
            finish_reason: 'stop',
          },
        ],
        usage: {
          prompt_tokens: 10,
          completion_tokens: 5,
          total_tokens: 15,
        },
      }

      mockOpenAIClient.chat.completions.create.mockResolvedValue(mockResponse)

      const request: LLMRequest = {
        messages: [{ role: 'user', content: 'Test' }],
        stopSequences: ['\n', 'END'],
      }

      await provider.send(request)

      expect(mockOpenAIClient.chat.completions.create).toHaveBeenCalledWith({
        model: 'gpt-4-turbo',
        messages: [{ role: 'user', content: 'Test' }],
        stop: ['\n', 'END'],
        max_tokens: 4096,
        stream: false,
      })
    })

    it('should map finish reasons correctly', async () => {
      const testCases = [
        { finish_reason: 'stop', expected: 'stop' },
        { finish_reason: 'length', expected: 'length' },
        { finish_reason: 'function_call', expected: 'stop' },
        { finish_reason: 'tool_calls', expected: 'stop' },
        { finish_reason: 'content_filter', expected: 'stop' },
      ]

      for (const { finish_reason, expected } of testCases) {
        const mockResponse = {
          id: 'chatcmpl-789',
          object: 'chat.completion',
          created: 1234567890,
          model: 'gpt-4-turbo',
          choices: [
            {
              index: 0,
              message: {
                role: 'assistant',
                content: 'Test',
              },
              finish_reason,
            },
          ],
          usage: {
            prompt_tokens: 10,
            completion_tokens: 5,
            total_tokens: 15,
          },
        }

        mockOpenAIClient.chat.completions.create.mockResolvedValue(mockResponse)

        const response = await provider.send({
          messages: [{ role: 'user', content: 'Test' }],
        })

        expect(response.finishReason).toBe(expected)
      }
    })

    it('should handle API errors appropriately', async () => {
      const error = new Error('API Error')
      ;(error as Error & { status?: number }).status = 429

      mockOpenAIClient.chat.completions.create.mockRejectedValue(error)

      const request: LLMRequest = {
        messages: [{ role: 'user', content: 'Test' }],
      }

      await expect(provider.send(request)).rejects.toThrow('API Error')
    })

    it('should handle metadata in request', async () => {
      const mockResponse = {
        id: 'chatcmpl-metadata',
        object: 'chat.completion',
        created: 1234567890,
        model: 'gpt-4-turbo',
        choices: [
          {
            index: 0,
            message: {
              role: 'assistant',
              content: 'Response with metadata',
            },
            finish_reason: 'stop',
          },
        ],
        usage: {
          prompt_tokens: 100,
          completion_tokens: 50,
          total_tokens: 150,
        },
      }

      mockOpenAIClient.chat.completions.create.mockResolvedValue(mockResponse)

      const request: LLMRequest = {
        messages: [{ role: 'user', content: 'Test with metadata' }],
        metadata: { requestId: 'test-123', source: 'test' },
      }

      const response = await provider.send(request)

      expect(response).toEqual({
        content: 'Response with metadata',
        usage: {
          inputTokens: 100,
          outputTokens: 50,
          totalTokens: 150,
        },
        model: 'gpt-4-turbo',
        finishReason: 'stop',
        metadata: {
          messageId: 'chatcmpl-metadata',
        },
      })
    })
  })

  describe('stream', () => {
    it('should stream response chunks', async () => {
      const chunks: string[] = []
      const handlers: StreamHandlers = {
        onChunk: (chunk) => chunks.push(chunk),
      }

      // Create a mock stream that mimics the OpenAI SDK stream
      const mockStream = {
        async *[Symbol.asyncIterator]() {
          yield {
            id: 'chatcmpl-stream',
            object: 'chat.completion.chunk',
            created: 1234567890,
            model: 'gpt-4-turbo',
            choices: [
              {
                index: 0,
                delta: {
                  content: 'Hello',
                },
                finish_reason: null,
              },
            ],
          }
          yield {
            id: 'chatcmpl-stream',
            object: 'chat.completion.chunk',
            created: 1234567890,
            model: 'gpt-4-turbo',
            choices: [
              {
                index: 0,
                delta: {
                  content: ' world',
                },
                finish_reason: null,
              },
            ],
          }
          yield {
            id: 'chatcmpl-stream',
            object: 'chat.completion.chunk',
            created: 1234567890,
            model: 'gpt-4-turbo',
            choices: [
              {
                index: 0,
                delta: {},
                finish_reason: 'stop',
              },
            ],
            usage: {
              prompt_tokens: 10,
              completion_tokens: 5,
              total_tokens: 15,
            },
          }
        },
      }

      mockOpenAIClient.chat.completions.create.mockResolvedValue(mockStream)

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
        model: 'gpt-4-turbo',
        finishReason: 'stop',
        metadata: {
          messageId: 'chatcmpl-stream',
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
            id: 'chatcmpl-error',
            object: 'chat.completion.chunk',
            created: 1234567890,
            model: 'gpt-4-turbo',
            choices: [
              {
                index: 0,
                delta: {
                  content: 'Partial',
                },
                finish_reason: null,
              },
            ],
          }
          throw new Error('Stream error')
        },
      }

      mockOpenAIClient.chat.completions.create.mockResolvedValue(mockStream)

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
            id: 'chatcmpl-complete',
            object: 'chat.completion.chunk',
            created: 1234567890,
            model: 'gpt-4-turbo',
            choices: [
              {
                index: 0,
                delta: {
                  content: 'Done',
                },
                finish_reason: null,
              },
            ],
          }
          yield {
            id: 'chatcmpl-complete',
            object: 'chat.completion.chunk',
            created: 1234567890,
            model: 'gpt-4-turbo',
            choices: [
              {
                index: 0,
                delta: {},
                finish_reason: 'stop',
              },
            ],
            usage: {
              prompt_tokens: 10,
              completion_tokens: 2,
              total_tokens: 12,
            },
          }
        },
      }

      mockOpenAIClient.chat.completions.create.mockResolvedValue(mockStream)

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
        model: 'gpt-4-turbo',
        finishReason: 'stop',
        metadata: {
          messageId: 'chatcmpl-complete',
        },
      })
    })

    it('should handle function call chunks in streaming', async () => {
      const chunks: string[] = []
      const handlers: StreamHandlers = {
        onChunk: (chunk) => chunks.push(chunk),
      }

      const mockStream = {
        async *[Symbol.asyncIterator]() {
          yield {
            id: 'chatcmpl-func',
            object: 'chat.completion.chunk',
            created: 1234567890,
            model: 'gpt-4-turbo',
            choices: [
              {
                index: 0,
                delta: {
                  content: 'Calling function',
                },
                finish_reason: null,
              },
            ],
          }
          yield {
            id: 'chatcmpl-func',
            object: 'chat.completion.chunk',
            created: 1234567890,
            model: 'gpt-4-turbo',
            choices: [
              {
                index: 0,
                delta: {
                  function_call: {
                    name: 'get_weather',
                    arguments: '{"location":',
                  },
                },
                finish_reason: null,
              },
            ],
          }
          yield {
            id: 'chatcmpl-func',
            object: 'chat.completion.chunk',
            created: 1234567890,
            model: 'gpt-4-turbo',
            choices: [
              {
                index: 0,
                delta: {
                  function_call: {
                    arguments: '"San Francisco"}',
                  },
                },
                finish_reason: null,
              },
            ],
          }
          yield {
            id: 'chatcmpl-func',
            object: 'chat.completion.chunk',
            created: 1234567890,
            model: 'gpt-4-turbo',
            choices: [
              {
                index: 0,
                delta: {},
                finish_reason: 'function_call',
              },
            ],
            usage: {
              prompt_tokens: 20,
              completion_tokens: 10,
              total_tokens: 30,
            },
          }
        },
      }

      mockOpenAIClient.chat.completions.create.mockResolvedValue(mockStream)

      const response = await provider.stream!(
        { messages: [{ role: 'user', content: 'What is the weather?' }] },
        handlers,
      )

      // Only text content should be in chunks
      expect(chunks).toEqual(['Calling function'])
      expect(response.content).toBe('Calling function')
      expect(response.finishReason).toBe('stop')
    })
  })

  describe('countTokens', () => {
    it('should estimate tokens based on text length', async () => {
      // OpenAI doesn't provide a token counting API, so we estimate
      // Roughly 4 characters per token is a common approximation
      const text = 'This is a test message with about 40 characters total'
      const count = await provider.countTokens(text)

      // 54 characters / 4 = ~13.5 tokens, rounded up to 14
      expect(count).toBe(14)
    })

    it('should handle empty text', async () => {
      const count = await provider.countTokens('')
      expect(count).toBe(0)
    })

    it('should handle very short text', async () => {
      const count = await provider.countTokens('Hi')
      expect(count).toBe(1)
    })
  })

  describe('getCapabilities', () => {
    it('should return OpenAI provider capabilities', () => {
      const capabilities = provider.getCapabilities()

      expect(capabilities).toEqual({
        streaming: true,
        maxInputTokens: 128000,
        maxOutputTokens: 4096,
        supportedModels: ['gpt-4-turbo', 'gpt-4', 'gpt-3.5-turbo'],
        jsonMode: true,
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

      // Based on gpt-4-turbo pricing:
      // Input: 1000 tokens * $0.01/1K = $0.01
      // Output: 500 tokens * $0.03/1K = $0.015
      // Total: $0.025
      expect(cost).toBeCloseTo(0.025, 6)
    })

    it('should return 0 for unknown model', () => {
      process.env.MEMORY_LLM_MODEL_OPENAI = 'unknown-model'
      const unknownProvider = new OpenAIProvider()

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
      mockOpenAIClient.chat.completions.create.mockResolvedValue({
        id: 'chatcmpl-validate',
        object: 'chat.completion',
        created: 1234567890,
        model: 'gpt-4-turbo',
        choices: [
          {
            index: 0,
            message: {
              role: 'assistant',
              content: 'Valid',
            },
            finish_reason: 'stop',
          },
        ],
        usage: {
          prompt_tokens: 5,
          completion_tokens: 1,
          total_tokens: 6,
        },
      })

      const isValid = await provider.validateConfig()

      expect(isValid).toBe(true)
      expect(mockOpenAIClient.chat.completions.create).toHaveBeenCalledWith({
        model: 'gpt-4-turbo',
        messages: [{ role: 'user', content: 'Hello' }],
        max_tokens: 10,
        stream: false,
      })
    })

    it('should return false for invalid configuration', async () => {
      mockOpenAIClient.chat.completions.create.mockRejectedValue(
        new Error('Invalid API key'),
      )

      const isValid = await provider.validateConfig()

      expect(isValid).toBe(false)
    })
  })

  describe('error mapping', () => {
    it('should properly map rate limit errors', async () => {
      const error = new Error('Rate limit exceeded')
      ;(error as Error & { status?: number }).status = 429

      mockOpenAIClient.chat.completions.create.mockRejectedValue(error)

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

      mockOpenAIClient.chat.completions.create.mockRejectedValue(error)

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

      mockOpenAIClient.chat.completions.create.mockRejectedValue(error)

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
})

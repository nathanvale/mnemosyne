import { describe, expect, it, vi } from 'vitest'

import type {
  LLMProvider,
  LLMRequest,
  LLMResponse,
  ProviderCapabilities,
  StreamHandlers,
  TokenUsage,
} from '../llm-provider.interface.js'

describe('LLMProvider Interface', () => {
  describe('Provider Implementation Contract', () => {
    it('should define all required methods', () => {
      const mockProvider: LLMProvider = {
        name: 'test-provider',
        send: vi.fn(),
        stream: vi.fn(),
        countTokens: vi.fn(),
        getCapabilities: vi.fn(),
        estimateCost: vi.fn(),
        validateConfig: vi.fn(),
      }

      expect(mockProvider.name).toBe('test-provider')
      expect(mockProvider.send).toBeDefined()
      expect(mockProvider.stream).toBeDefined()
      expect(mockProvider.countTokens).toBeDefined()
      expect(mockProvider.getCapabilities).toBeDefined()
      expect(mockProvider.estimateCost).toBeDefined()
      expect(mockProvider.validateConfig).toBeDefined()
    })

    it('should enforce readonly name property', () => {
      const provider: LLMProvider = {
        name: 'test-provider',
        send: vi.fn(),
        countTokens: vi.fn(),
        getCapabilities: vi.fn(),
        estimateCost: vi.fn(),
        validateConfig: vi.fn(),
      }

      // TypeScript prevents reassignment of readonly property at compile time
      // Runtime JavaScript doesn't enforce readonly, so we just verify the property exists
      expect(provider.name).toBe('test-provider')

      // The following line would cause a TypeScript error if uncommented:
      // provider.name = 'modified' // Error: Cannot assign to 'name' because it is a read-only property
    })
  })

  describe('LLMRequest Structure', () => {
    it('should accept valid request structure', () => {
      const request: LLMRequest = {
        messages: [
          { role: 'system', content: 'You are a helpful assistant' },
          { role: 'user', content: 'Hello' },
          { role: 'assistant', content: 'Hi there!' },
        ],
        temperature: 0.7,
        maxTokens: 1000,
        topP: 0.9,
        stopSequences: ['\\n\\n'],
        metadata: { requestId: 'test-123' },
      }

      expect(request.messages).toHaveLength(3)
      expect(request.temperature).toBe(0.7)
      expect(request.maxTokens).toBe(1000)
      expect(request.topP).toBe(0.9)
      expect(request.stopSequences).toContain('\\n\\n')
      expect(request.metadata?.requestId).toBe('test-123')
    })

    it('should require messages array', () => {
      const minimalRequest: LLMRequest = {
        messages: [{ role: 'user', content: 'Test' }],
      }

      expect(minimalRequest.messages).toBeDefined()
      expect(minimalRequest.temperature).toBeUndefined()
      expect(minimalRequest.maxTokens).toBeUndefined()
    })
  })

  describe('LLMResponse Structure', () => {
    it('should contain all required response fields', () => {
      const response: LLMResponse = {
        content: 'Generated response',
        usage: {
          inputTokens: 10,
          outputTokens: 20,
          totalTokens: 30,
        },
        model: 'test-model-v1',
        finishReason: 'stop',
        metadata: { latencyMs: 500 },
      }

      expect(response.content).toBe('Generated response')
      expect(response.usage.inputTokens).toBe(10)
      expect(response.usage.outputTokens).toBe(20)
      expect(response.usage.totalTokens).toBe(30)
      expect(response.model).toBe('test-model-v1')
      expect(response.finishReason).toBe('stop')
      expect(response.metadata?.latencyMs).toBe(500)
    })

    it('should enforce valid finish reasons', () => {
      const validFinishReasons: Array<LLMResponse['finishReason']> = [
        'stop',
        'length',
        'error',
      ]

      validFinishReasons.forEach((reason) => {
        const response: LLMResponse = {
          content: '',
          usage: { inputTokens: 0, outputTokens: 0, totalTokens: 0 },
          model: 'test',
          finishReason: reason,
        }
        expect(response.finishReason).toBe(reason)
      })
    })
  })

  describe('TokenUsage Structure', () => {
    it('should track token counts correctly', () => {
      const usage: TokenUsage = {
        inputTokens: 100,
        outputTokens: 200,
        totalTokens: 300,
      }

      expect(usage.inputTokens).toBe(100)
      expect(usage.outputTokens).toBe(200)
      expect(usage.totalTokens).toBe(usage.inputTokens + usage.outputTokens)
    })
  })

  describe('ProviderCapabilities Structure', () => {
    it('should define all capability flags', () => {
      const capabilities: ProviderCapabilities = {
        streaming: true,
        maxInputTokens: 100000,
        maxOutputTokens: 4096,
        supportedModels: ['model-1', 'model-2'],
        jsonMode: true,
        functionCalling: false,
        visionSupport: true,
      }

      expect(capabilities.streaming).toBe(true)
      expect(capabilities.maxInputTokens).toBe(100000)
      expect(capabilities.maxOutputTokens).toBe(4096)
      expect(capabilities.supportedModels).toContain('model-1')
      expect(capabilities.jsonMode).toBe(true)
      expect(capabilities.functionCalling).toBe(false)
      expect(capabilities.visionSupport).toBe(true)
    })
  })

  describe('StreamHandlers Structure', () => {
    it('should define optional stream event handlers', () => {
      const handlers: StreamHandlers = {
        onChunk: vi.fn(),
        onComplete: vi.fn(),
        onError: vi.fn(),
      }

      expect(handlers.onChunk).toBeDefined()
      expect(handlers.onComplete).toBeDefined()
      expect(handlers.onError).toBeDefined()
    })

    it('should allow partial handler definition', () => {
      const partialHandlers: StreamHandlers = {
        onChunk: vi.fn(),
      }

      expect(partialHandlers.onChunk).toBeDefined()
      expect(partialHandlers.onComplete).toBeUndefined()
      expect(partialHandlers.onError).toBeUndefined()
    })
  })

  describe('Provider Method Contracts', () => {
    it('should handle send method correctly', async () => {
      const mockProvider: LLMProvider = {
        name: 'test',
        send: vi.fn().mockResolvedValue({
          content: 'Response',
          usage: { inputTokens: 10, outputTokens: 20, totalTokens: 30 },
          model: 'test-model',
          finishReason: 'stop' as const,
        }),
        countTokens: vi.fn(),
        getCapabilities: vi.fn(),
        estimateCost: vi.fn(),
        validateConfig: vi.fn(),
      }

      const request: LLMRequest = {
        messages: [{ role: 'user', content: 'Test' }],
      }

      const response = await mockProvider.send(request)

      expect(mockProvider.send).toHaveBeenCalledWith(request)
      expect(response.content).toBe('Response')
      expect(response.finishReason).toBe('stop')
    })

    it('should handle stream method when available', async () => {
      const mockHandlers: StreamHandlers = {
        onChunk: vi.fn(),
        onComplete: vi.fn(),
      }

      const mockProvider: LLMProvider = {
        name: 'test',
        send: vi.fn(),
        stream: vi.fn().mockResolvedValue({
          content: 'Streamed response',
          usage: { inputTokens: 10, outputTokens: 20, totalTokens: 30 },
          model: 'test-model',
          finishReason: 'stop' as const,
        }),
        countTokens: vi.fn(),
        getCapabilities: vi.fn(),
        estimateCost: vi.fn(),
        validateConfig: vi.fn(),
      }

      const request: LLMRequest = {
        messages: [{ role: 'user', content: 'Test' }],
      }

      const response = await mockProvider.stream!(request, mockHandlers)

      expect(mockProvider.stream).toHaveBeenCalledWith(request, mockHandlers)
      expect(response.content).toBe('Streamed response')
    })

    it('should count tokens accurately', async () => {
      const mockProvider: LLMProvider = {
        name: 'test',
        send: vi.fn(),
        countTokens: vi.fn().mockResolvedValue(42),
        getCapabilities: vi.fn(),
        estimateCost: vi.fn(),
        validateConfig: vi.fn(),
      }

      const tokenCount = await mockProvider.countTokens(
        'Test text for token counting',
      )

      expect(mockProvider.countTokens).toHaveBeenCalledWith(
        'Test text for token counting',
      )
      expect(tokenCount).toBe(42)
    })

    it('should provide capability information', () => {
      const mockCapabilities: ProviderCapabilities = {
        streaming: true,
        maxInputTokens: 100000,
        maxOutputTokens: 4096,
        supportedModels: ['model-1'],
        jsonMode: true,
        functionCalling: false,
        visionSupport: false,
      }

      const mockProvider: LLMProvider = {
        name: 'test',
        send: vi.fn(),
        countTokens: vi.fn(),
        getCapabilities: vi.fn().mockReturnValue(mockCapabilities),
        estimateCost: vi.fn(),
        validateConfig: vi.fn(),
      }

      const capabilities = mockProvider.getCapabilities()

      expect(capabilities.streaming).toBe(true)
      expect(capabilities.maxInputTokens).toBe(100000)
      expect(capabilities.supportedModels).toContain('model-1')
    })

    it('should estimate costs based on usage', () => {
      const mockProvider: LLMProvider = {
        name: 'test',
        send: vi.fn(),
        countTokens: vi.fn(),
        getCapabilities: vi.fn(),
        estimateCost: vi.fn().mockReturnValue(0.025),
        validateConfig: vi.fn(),
      }

      const usage: TokenUsage = {
        inputTokens: 1000,
        outputTokens: 500,
        totalTokens: 1500,
      }

      const cost = mockProvider.estimateCost(usage)

      expect(mockProvider.estimateCost).toHaveBeenCalledWith(usage)
      expect(cost).toBe(0.025)
    })

    it('should validate configuration', async () => {
      const mockProvider: LLMProvider = {
        name: 'test',
        send: vi.fn(),
        countTokens: vi.fn(),
        getCapabilities: vi.fn(),
        estimateCost: vi.fn(),
        validateConfig: vi.fn().mockResolvedValue(true),
      }

      const isValid = await mockProvider.validateConfig()

      expect(mockProvider.validateConfig).toHaveBeenCalled()
      expect(isValid).toBe(true)
    })
  })
})

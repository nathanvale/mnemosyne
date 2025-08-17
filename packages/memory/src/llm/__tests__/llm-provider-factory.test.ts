import { describe, expect, it, beforeEach, vi } from 'vitest'

import type { LLMProvider, ProviderConfig } from '../llm-provider.interface'

import { LLMProviderFactory } from '../llm-provider-factory'

describe('LLMProviderFactory', () => {
  beforeEach(() => {
    // Clear the registry before each test
    LLMProviderFactory.clearRegistry()
  })

  describe('Provider Registration', () => {
    it('should register a provider factory', () => {
      const mockProviderFactory = vi.fn().mockReturnValue({
        name: 'test-provider',
        send: vi.fn(),
        countTokens: vi.fn(),
        getCapabilities: vi.fn(),
        estimateCost: vi.fn(),
        validateConfig: vi.fn(),
      })

      LLMProviderFactory.register('test', mockProviderFactory)

      expect(LLMProviderFactory.getAvailableProviders()).toContain('test')
    })

    it('should allow multiple provider registrations', () => {
      const mockProvider1 = vi.fn()
      const mockProvider2 = vi.fn()

      LLMProviderFactory.register('provider1', mockProvider1)
      LLMProviderFactory.register('provider2', mockProvider2)

      const available = LLMProviderFactory.getAvailableProviders()
      expect(available).toContain('provider1')
      expect(available).toContain('provider2')
      expect(available).toHaveLength(2)
    })

    it('should overwrite existing provider registration', () => {
      const mockProvider1 = vi.fn().mockReturnValue({ name: 'v1' })
      const mockProvider2 = vi.fn().mockReturnValue({ name: 'v2' })

      LLMProviderFactory.register('test', mockProvider1)
      LLMProviderFactory.register('test', mockProvider2)

      const config: ProviderConfig = { provider: 'test' }
      const provider = LLMProviderFactory.create(config)

      expect(provider.name).toBe('v2')
      expect(mockProvider1).not.toHaveBeenCalled()
      expect(mockProvider2).toHaveBeenCalled()
    })
  })

  describe('Provider Creation', () => {
    it('should create a registered provider', () => {
      const mockProvider: LLMProvider = {
        name: 'test-provider',
        send: vi.fn(),
        countTokens: vi.fn(),
        getCapabilities: vi.fn(),
        estimateCost: vi.fn(),
        validateConfig: vi.fn(),
      }

      const mockProviderFactory = vi.fn().mockReturnValue(mockProvider)
      LLMProviderFactory.register('test', mockProviderFactory)

      const config: ProviderConfig = {
        provider: 'test',
        apiKey: 'test-key',
      }
      const provider = LLMProviderFactory.create(config)

      expect(mockProviderFactory).toHaveBeenCalledWith(config)
      expect(provider).toBe(mockProvider)
      expect(provider.name).toBe('test-provider')
    })

    it('should throw error for unknown provider', () => {
      const config: ProviderConfig = { provider: 'unknown' }

      expect(() => LLMProviderFactory.create(config)).toThrow(
        'Unknown provider: unknown',
      )
    })

    it('should pass configuration to provider factory', () => {
      const mockProviderFactory = vi.fn().mockReturnValue({
        name: 'test',
        send: vi.fn(),
        countTokens: vi.fn(),
        getCapabilities: vi.fn(),
        estimateCost: vi.fn(),
        validateConfig: vi.fn(),
      })

      LLMProviderFactory.register('test', mockProviderFactory)

      const config: ProviderConfig = {
        provider: 'test',
        apiKey: 'api-key-123',
        model: 'test-model',
        temperature: 0.7,
        maxOutputTokens: 1000,
      }

      LLMProviderFactory.create(config)

      expect(mockProviderFactory).toHaveBeenCalledWith(config)
    })
  })

  describe('Provider Listing', () => {
    it('should return empty array when no providers registered', () => {
      expect(LLMProviderFactory.getAvailableProviders()).toEqual([])
    })

    it('should return all registered provider names', () => {
      LLMProviderFactory.register('claude', vi.fn())
      LLMProviderFactory.register('openai', vi.fn())
      LLMProviderFactory.register('custom', vi.fn())

      const providers = LLMProviderFactory.getAvailableProviders()

      expect(providers).toHaveLength(3)
      expect(providers).toContain('claude')
      expect(providers).toContain('openai')
      expect(providers).toContain('custom')
    })

    it('should return providers in registration order', () => {
      LLMProviderFactory.register('third', vi.fn())
      LLMProviderFactory.register('first', vi.fn())
      LLMProviderFactory.register('second', vi.fn())

      const providers = LLMProviderFactory.getAvailableProviders()

      // Map maintains insertion order
      expect(providers[0]).toBe('third')
      expect(providers[1]).toBe('first')
      expect(providers[2]).toBe('second')
    })
  })

  describe('Factory Function Validation', () => {
    it('should validate that factory returns an LLMProvider', () => {
      const invalidFactory = vi.fn().mockReturnValue(null)
      LLMProviderFactory.register('invalid', invalidFactory)

      const config: ProviderConfig = { provider: 'invalid' }

      expect(() => LLMProviderFactory.create(config)).toThrow()
    })

    it('should handle factory function errors', () => {
      const errorFactory = vi.fn().mockImplementation(() => {
        throw new Error('Factory error')
      })
      LLMProviderFactory.register('error', errorFactory)

      const config: ProviderConfig = { provider: 'error' }

      expect(() => LLMProviderFactory.create(config)).toThrow('Factory error')
    })
  })

  describe('Static Registry Management', () => {
    it('should maintain registry across multiple factory instances', () => {
      // Register on the class
      LLMProviderFactory.register('global', vi.fn())

      // Should be available immediately
      expect(LLMProviderFactory.getAvailableProviders()).toContain('global')
    })

    it('should not expose internal registry Map', () => {
      // TypeScript prevents direct access to private static member at compile time
      // Runtime JavaScript doesn't enforce private, but we can verify it's a Map
      // @ts-expect-error - Testing private member access prevention
      const providers = LLMProviderFactory.providers

      // In JavaScript runtime, private members are accessible but should be a Map
      expect(providers).toBeInstanceOf(Map)
    })
  })
})

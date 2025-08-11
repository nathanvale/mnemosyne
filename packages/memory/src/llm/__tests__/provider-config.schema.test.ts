import { describe, expect, it } from 'vitest'
import { z } from 'zod'

import {
  AnthropicConfigSchema,
  BaseProviderConfigSchema,
  CustomProviderConfigSchema,
  OpenAIConfigSchema,
  ProviderConfigSchema,
  getPartialConfigSchema,
  mergeWithDefaults,
  safeValidateProviderConfig,
  validateProviderConfig,
  type AnthropicConfig,
  type BaseProviderConfig,
  type OpenAIConfig,
} from '../provider-config.schema.js'

describe('Provider Configuration Schemas', () => {
  describe('BaseProviderConfigSchema', () => {
    it('should validate minimal configuration', () => {
      const config = {
        provider: 'test',
      }

      const result = BaseProviderConfigSchema.parse(config)
      expect(result.provider).toBe('test')
    })

    it('should validate full configuration', () => {
      const config = {
        provider: 'test',
        apiKey: 'test-key',
        baseUrl: 'https://api.example.com',
        model: 'test-model',
        temperature: 0.7,
        maxOutputTokens: 1000,
        timeout: 30000,
        retry: {
          maxAttempts: 3,
          backoffMultiplier: 2,
          initialDelay: 1000,
        },
        headers: {
          'X-Custom-Header': 'value',
        },
      }

      const result = BaseProviderConfigSchema.parse(config)
      expect(result).toEqual(config)
    })

    it('should reject invalid temperature', () => {
      const config = {
        provider: 'test',
        temperature: 2.5, // Max is 2.0
      }

      expect(() => BaseProviderConfigSchema.parse(config)).toThrow()
    })

    it('should reject negative maxOutputTokens', () => {
      const config = {
        provider: 'test',
        maxOutputTokens: -100,
      }

      expect(() => BaseProviderConfigSchema.parse(config)).toThrow()
    })

    it('should reject invalid URL', () => {
      const config = {
        provider: 'test',
        baseUrl: 'not-a-url',
      }

      expect(() => BaseProviderConfigSchema.parse(config)).toThrow()
    })

    it('should apply default retry values', () => {
      const config = {
        provider: 'test',
        retry: {},
      }

      const result = BaseProviderConfigSchema.parse(config)
      expect(result.retry?.maxAttempts).toBe(3)
      expect(result.retry?.backoffMultiplier).toBe(2)
      expect(result.retry?.initialDelay).toBe(1000)
    })
  })

  describe('AnthropicConfigSchema', () => {
    it('should validate Anthropic configuration', () => {
      const config: AnthropicConfig = {
        provider: 'anthropic',
        apiKey: 'sk-ant-test',
        model: 'claude-3-opus',
        anthropicVersion: '2023-06-01',
      }

      const result = AnthropicConfigSchema.parse(config)
      expect(result.provider).toBe('anthropic')
      expect(result.apiKey).toBe('sk-ant-test')
      expect(result.model).toBe('claude-3-opus')
    })

    it('should require API key for Anthropic', () => {
      const config = {
        provider: 'anthropic',
      }

      expect(() => AnthropicConfigSchema.parse(config)).toThrow()
    })

    it('should only accept valid Anthropic models', () => {
      const config = {
        provider: 'anthropic',
        apiKey: 'test',
        model: 'invalid-model',
      }

      expect(() => AnthropicConfigSchema.parse(config)).toThrow()
    })

    it('should support anthropicBeta headers', () => {
      const config = {
        provider: 'anthropic',
        apiKey: 'test',
        anthropicBeta: ['messages-2023-12-15', 'tools-2024-04-04'],
      }

      const result = AnthropicConfigSchema.parse(config)
      expect(result.anthropicBeta).toHaveLength(2)
    })

    it('should apply default anthropicVersion', () => {
      const config = {
        provider: 'anthropic',
        apiKey: 'test',
      }

      const result = AnthropicConfigSchema.parse(config)
      expect(result.anthropicVersion).toBe('2023-06-01')
    })
  })

  describe('OpenAIConfigSchema', () => {
    it('should validate OpenAI configuration', () => {
      const config: OpenAIConfig = {
        provider: 'openai',
        apiKey: 'sk-test',
        model: 'gpt-4',
        organization: 'org-123',
        topP: 0.9,
        frequencyPenalty: 0.5,
        presencePenalty: 0.5,
      }

      const result = OpenAIConfigSchema.parse(config)
      expect(result.provider).toBe('openai')
      expect(result.apiKey).toBe('sk-test')
      expect(result.model).toBe('gpt-4')
      expect(result.organization).toBe('org-123')
    })

    it('should require API key for OpenAI', () => {
      const config = {
        provider: 'openai',
      }

      expect(() => OpenAIConfigSchema.parse(config)).toThrow()
    })

    it('should validate penalty ranges', () => {
      const invalidConfig = {
        provider: 'openai',
        apiKey: 'test',
        frequencyPenalty: 3, // Max is 2
      }

      expect(() => OpenAIConfigSchema.parse(invalidConfig)).toThrow()
    })

    it('should validate topP range', () => {
      const invalidConfig = {
        provider: 'openai',
        apiKey: 'test',
        topP: 1.5, // Max is 1
      }

      expect(() => OpenAIConfigSchema.parse(invalidConfig)).toThrow()
    })
  })

  describe('CustomProviderConfigSchema', () => {
    it('should validate custom provider configuration', () => {
      const config = {
        provider: 'custom-llm',
        baseUrl: 'https://custom.api.com',
        apiKey: 'custom-key',
        authType: 'bearer' as const,
        authHeader: 'X-API-Key',
      }

      const result = CustomProviderConfigSchema.parse(config)
      expect(result.provider).toBe('custom-llm')
      expect(result.baseUrl).toBe('https://custom.api.com')
      expect(result.authType).toBe('bearer')
    })

    it('should require baseUrl for custom providers', () => {
      const config = {
        provider: 'custom',
        apiKey: 'test',
      }

      expect(() => CustomProviderConfigSchema.parse(config)).toThrow()
    })

    it('should reject known provider names', () => {
      const config = {
        provider: 'anthropic',
        baseUrl: 'https://custom.api.com',
      }

      expect(() => CustomProviderConfigSchema.parse(config)).toThrow(
        'Use specific schemas for known providers',
      )
    })

    it('should validate auth types', () => {
      const config = {
        provider: 'custom',
        baseUrl: 'https://api.com',
        authType: 'invalid' as unknown,
      }

      expect(() => CustomProviderConfigSchema.parse(config)).toThrow()
    })
  })

  describe('ProviderConfigSchema (Discriminated Union)', () => {
    it('should route to Anthropic schema', () => {
      const config = {
        provider: 'anthropic',
        apiKey: 'test',
      }

      const result = ProviderConfigSchema.parse(config)
      expect(result.provider).toBe('anthropic')
      expect('anthropicVersion' in result).toBe(true)
    })

    it('should route to OpenAI schema', () => {
      const config = {
        provider: 'openai',
        apiKey: 'test',
      }

      const result = ProviderConfigSchema.parse(config)
      expect(result.provider).toBe('openai')
    })

    it('should route to Custom schema', () => {
      const config = {
        provider: 'custom',
        baseUrl: 'https://api.com',
      }

      const result = ProviderConfigSchema.parse(config)
      expect(result.provider).toBe('custom')
      expect(result.baseUrl).toBe('https://api.com')
    })
  })

  describe('Validation Functions', () => {
    it('should validate configuration with validateProviderConfig', () => {
      const config = {
        provider: 'anthropic',
        apiKey: 'test',
      }

      const result = validateProviderConfig(config)
      expect(result.provider).toBe('anthropic')
    })

    it('should throw on invalid config with validateProviderConfig', () => {
      const config = {
        provider: 'anthropic',
        // Missing required apiKey
      }

      expect(() => validateProviderConfig(config)).toThrow(z.ZodError)
    })

    it('should safely validate with safeValidateProviderConfig', () => {
      const validConfig = {
        provider: 'anthropic',
        apiKey: 'test',
      }

      const result = safeValidateProviderConfig(validConfig)
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.provider).toBe('anthropic')
      }
    })

    it('should return error with safeValidateProviderConfig on invalid config', () => {
      const invalidConfig = {
        provider: 'anthropic',
        // Missing required apiKey
      }

      const result = safeValidateProviderConfig(invalidConfig)
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error).toBeInstanceOf(z.ZodError)
      }
    })
  })

  describe('Partial Schema Generation', () => {
    it('should create partial schema for Anthropic', () => {
      const partialSchema = getPartialConfigSchema('anthropic')

      // Partial schema should accept incomplete config
      const config = {
        model: 'claude-3-opus',
        // apiKey not required in partial
      }

      const result = partialSchema.parse(config)
      expect(result.model).toBe('claude-3-opus')
      expect(result.apiKey).toBeUndefined()
    })

    it('should create partial schema for OpenAI', () => {
      const partialSchema = getPartialConfigSchema('openai')

      const config = {
        temperature: 0.9,
        // apiKey not required in partial
      }

      const result = partialSchema.parse(config)
      expect(result.temperature).toBe(0.9)
    })

    it('should create partial schema for custom providers', () => {
      const partialSchema = getPartialConfigSchema('custom')

      const config = {
        timeout: 5000,
        // baseUrl not required in partial
      }

      const result = partialSchema.parse(config)
      expect(result.timeout).toBe(5000)
    })
  })

  describe('Configuration Merging', () => {
    it('should merge configurations with defaults', () => {
      const config: BaseProviderConfig = {
        provider: 'test',
        apiKey: 'user-key',
        temperature: 0.5,
      }

      const defaults: Partial<BaseProviderConfig> = {
        temperature: 0.7,
        maxOutputTokens: 1000,
        timeout: 30000,
      }

      const merged = mergeWithDefaults(config, defaults)

      expect(merged.provider).toBe('test')
      expect(merged.apiKey).toBe('user-key')
      expect(merged.temperature).toBe(0.5) // User value takes precedence
      expect(merged.maxOutputTokens).toBe(1000) // From defaults
      expect(merged.timeout).toBe(30000) // From defaults
    })

    it('should deep merge retry configuration', () => {
      const config: BaseProviderConfig = {
        provider: 'test',
        retry: {
          maxAttempts: 5,
          backoffMultiplier: 2,
          initialDelay: 1000,
        },
      }

      const defaults: Partial<BaseProviderConfig> = {
        retry: {
          maxAttempts: 3,
          backoffMultiplier: 3,
          initialDelay: 2000,
        },
      }

      const merged = mergeWithDefaults(config, defaults)

      expect(merged.retry?.maxAttempts).toBe(5) // User value
      expect(merged.retry?.backoffMultiplier).toBe(2) // User value
      expect(merged.retry?.initialDelay).toBe(1000) // User value
    })

    it('should deep merge headers', () => {
      const config: BaseProviderConfig = {
        provider: 'test',
        headers: {
          'X-User-Header': 'user-value',
        },
      }

      const defaults: Partial<BaseProviderConfig> = {
        headers: {
          'X-Default-Header': 'default-value',
          'X-User-Header': 'default-override',
        },
      }

      const merged = mergeWithDefaults(config, defaults)

      expect(merged.headers?.['X-User-Header']).toBe('user-value')
      expect(merged.headers?.['X-Default-Header']).toBe('default-value')
    })
  })
})

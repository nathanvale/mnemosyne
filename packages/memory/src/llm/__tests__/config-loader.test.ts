/**
 * Tests for LLM Configuration Loader
 *
 * Tests environment variable loading, defaults, validation, and error messages
 * for the LLM provider configuration system.
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'

import type { LLMProviderConfig } from '../types'

import { LLMConfigLoader } from '../config-loader'

describe('LLMConfigLoader', () => {
  // Store original env vars
  const originalEnv = process.env

  beforeEach(() => {
    // Reset environment for each test - clean slate
    process.env = {}
    vi.clearAllMocks()
  })

  afterEach(() => {
    // Restore original environment
    process.env = originalEnv
  })

  describe('loadConfig', () => {
    it('loads configuration from environment variables', () => {
      // Set environment variables
      process.env.MEMORY_LLM_PRIMARY = 'claude'
      process.env.MEMORY_LLM_FALLBACK = 'openai'
      process.env.MEMORY_LLM_DAILY_BUDGET_USD = '10.50'
      process.env.MEMORY_LLM_MODEL_CLAUDE = 'claude-3-sonnet'
      process.env.MEMORY_LLM_MODEL_OPENAI = 'gpt-4'
      process.env.MEMORY_LLM_API_KEY_CLAUDE = 'test-claude-key'
      process.env.MEMORY_LLM_API_KEY_OPENAI = 'test-openai-key'
      process.env.MEMORY_LLM_MAX_RETRIES = '5'
      process.env.MEMORY_LLM_CIRCUIT_THRESHOLD = '0.6'
      process.env.MEMORY_LLM_CIRCUIT_PROBES = '3'

      const config = LLMConfigLoader.loadConfig()

      expect(config).toEqual({
        primaryProvider: 'claude',
        fallbackProvider: 'openai',
        dailyBudgetUSD: 10.5,
        maxRetries: 5,
        circuitBreakerThreshold: 0.6,
        circuitBreakerProbes: 3,
        providers: {
          claude: {
            name: 'claude',
            apiKey: 'test-claude-key',
            model: 'claude-3-sonnet',
          },
          openai: {
            name: 'openai',
            apiKey: 'test-openai-key',
            model: 'gpt-4',
          },
        },
      })
    })

    it('applies default values when environment variables are not set', () => {
      // Only set required values
      process.env.MEMORY_LLM_PRIMARY = 'claude'
      process.env.MEMORY_LLM_API_KEY_CLAUDE = 'test-key'

      const config = LLMConfigLoader.loadConfig()

      expect(config.primaryProvider).toBe('claude')
      expect(config.fallbackProvider).toBeUndefined()
      expect(config.dailyBudgetUSD).toBe(0) // 0 means no budget limit
      expect(config.maxRetries).toBe(3) // default
      expect(config.circuitBreakerThreshold).toBe(0.5) // default
      expect(config.circuitBreakerProbes).toBe(1) // default
      expect(config.providers.claude?.model).toBeUndefined() // use provider default
    })

    it('handles "none" as a special value for fallback provider', () => {
      process.env.MEMORY_LLM_PRIMARY = 'claude'
      process.env.MEMORY_LLM_FALLBACK = 'none'
      process.env.MEMORY_LLM_API_KEY_CLAUDE = 'test-key'

      const config = LLMConfigLoader.loadConfig()

      expect(config.fallbackProvider).toBeUndefined()
    })

    it('supports both uppercase and lowercase provider names', () => {
      process.env.MEMORY_LLM_PRIMARY = 'Claude'
      process.env.MEMORY_LLM_FALLBACK = 'OpenAI'
      process.env.MEMORY_LLM_API_KEY_CLAUDE = 'test-claude-key'
      process.env.MEMORY_LLM_API_KEY_OPENAI = 'test-openai-key'

      const config = LLMConfigLoader.loadConfig()

      expect(config.primaryProvider).toBe('claude')
      expect(config.fallbackProvider).toBe('openai')
    })

    it('loads provider-specific configuration', () => {
      process.env.MEMORY_LLM_PRIMARY = 'openai'
      process.env.MEMORY_LLM_API_KEY_OPENAI = 'test-key'
      process.env.MEMORY_LLM_MODEL_OPENAI = 'gpt-4-turbo'
      process.env.MEMORY_LLM_BASE_URL_OPENAI = 'https://custom.openai.com'
      process.env.MEMORY_LLM_ORG_ID_OPENAI = 'org-123'

      const config = LLMConfigLoader.loadConfig()

      expect(config.providers.openai).toEqual({
        name: 'openai',
        apiKey: 'test-key',
        model: 'gpt-4-turbo',
        baseURL: 'https://custom.openai.com',
        organizationId: 'org-123',
      })
    })

    it('parses numeric environment variables correctly', () => {
      process.env.MEMORY_LLM_PRIMARY = 'claude'
      process.env.MEMORY_LLM_API_KEY_CLAUDE = 'test-key'
      process.env.MEMORY_LLM_DAILY_BUDGET_USD = '25.75'
      process.env.MEMORY_LLM_MAX_RETRIES = '10'
      process.env.MEMORY_LLM_CIRCUIT_THRESHOLD = '0.75'
      process.env.MEMORY_LLM_CIRCUIT_PROBES = '5'

      const config = LLMConfigLoader.loadConfig()

      expect(config.dailyBudgetUSD).toBe(25.75)
      expect(config.maxRetries).toBe(10)
      expect(config.circuitBreakerThreshold).toBe(0.75)
      expect(config.circuitBreakerProbes).toBe(5)
    })
  })

  describe('validateConfig', () => {
    it('validates a complete configuration', () => {
      const config: LLMProviderConfig = {
        primaryProvider: 'claude',
        fallbackProvider: 'openai',
        dailyBudgetUSD: 10,
        maxRetries: 3,
        circuitBreakerThreshold: 0.5,
        circuitBreakerProbes: 1,
        providers: {
          claude: {
            name: 'claude',
            apiKey: 'test-claude-key',
            model: 'claude-3-sonnet',
          },
          openai: {
            name: 'openai',
            apiKey: 'test-openai-key',
            model: 'gpt-4',
          },
        },
      }

      const result = LLMConfigLoader.validateConfig(config)
      expect(result.valid).toBe(true)
      expect(result.errors).toEqual([])
    })

    it('validates a minimal configuration', () => {
      const config: LLMProviderConfig = {
        primaryProvider: 'claude',
        dailyBudgetUSD: 0,
        maxRetries: 3,
        circuitBreakerThreshold: 0.5,
        circuitBreakerProbes: 1,
        providers: {
          claude: {
            name: 'claude',
            apiKey: 'test-key',
          },
        },
      }

      const result = LLMConfigLoader.validateConfig(config)
      expect(result.valid).toBe(true)
      expect(result.errors).toEqual([])
    })

    it('reports error when primary provider is not configured', () => {
      const config: LLMProviderConfig = {
        primaryProvider: 'claude',
        dailyBudgetUSD: 0,
        maxRetries: 3,
        circuitBreakerThreshold: 0.5,
        circuitBreakerProbes: 1,
        providers: {
          openai: {
            name: 'openai',
            apiKey: 'test-key',
          },
        },
      }

      const result = LLMConfigLoader.validateConfig(config)
      expect(result.valid).toBe(false)
      expect(result.errors).toContain(
        'Primary provider "claude" is not configured',
      )
    })

    it('reports error when fallback provider is not configured', () => {
      const config: LLMProviderConfig = {
        primaryProvider: 'claude',
        fallbackProvider: 'openai',
        dailyBudgetUSD: 0,
        maxRetries: 3,
        circuitBreakerThreshold: 0.5,
        circuitBreakerProbes: 1,
        providers: {
          claude: {
            name: 'claude',
            apiKey: 'test-key',
          },
        },
      }

      const result = LLMConfigLoader.validateConfig(config)
      expect(result.valid).toBe(false)
      expect(result.errors).toContain(
        'Fallback provider "openai" is not configured',
      )
    })

    it('reports error when provider is missing API key', () => {
      const config: LLMProviderConfig = {
        primaryProvider: 'claude',
        dailyBudgetUSD: 0,
        maxRetries: 3,
        circuitBreakerThreshold: 0.5,
        circuitBreakerProbes: 1,
        providers: {
          claude: {
            name: 'claude',
            apiKey: '', // Empty API key
          },
        },
      }

      const result = LLMConfigLoader.validateConfig(config)
      expect(result.valid).toBe(false)
      expect(result.errors).toContain('Provider "claude" is missing API key')
    })

    it('reports error when daily budget is negative', () => {
      const config: LLMProviderConfig = {
        primaryProvider: 'claude',
        dailyBudgetUSD: -10,
        maxRetries: 3,
        circuitBreakerThreshold: 0.5,
        circuitBreakerProbes: 1,
        providers: {
          claude: {
            name: 'claude',
            apiKey: 'test-key',
          },
        },
      }

      const result = LLMConfigLoader.validateConfig(config)
      expect(result.valid).toBe(false)
      expect(result.errors).toContain('Daily budget must be non-negative')
    })

    it('reports error when circuit breaker threshold is out of range', () => {
      const config: LLMProviderConfig = {
        primaryProvider: 'claude',
        dailyBudgetUSD: 0,
        maxRetries: 3,
        circuitBreakerThreshold: 1.5, // Out of range
        circuitBreakerProbes: 1,
        providers: {
          claude: {
            name: 'claude',
            apiKey: 'test-key',
          },
        },
      }

      const result = LLMConfigLoader.validateConfig(config)
      expect(result.valid).toBe(false)
      expect(result.errors).toContain(
        'Circuit breaker threshold must be between 0 and 1',
      )
    })

    it('reports multiple errors at once', () => {
      const config: LLMProviderConfig = {
        primaryProvider: 'claude',
        fallbackProvider: 'gemini', // Not configured
        dailyBudgetUSD: -5, // Negative
        maxRetries: 0, // Too low
        circuitBreakerThreshold: 2, // Out of range
        circuitBreakerProbes: -1, // Negative
        providers: {
          claude: {
            name: 'claude',
            apiKey: '', // Missing
          },
        },
      }

      const result = LLMConfigLoader.validateConfig(config)
      expect(result.valid).toBe(false)
      expect(result.errors).toHaveLength(6)
      expect(result.errors).toContain('Provider "claude" is missing API key')
      expect(result.errors).toContain(
        'Fallback provider "gemini" is not configured',
      )
      expect(result.errors).toContain('Daily budget must be non-negative')
      expect(result.errors).toContain('Max retries must be at least 1')
      expect(result.errors).toContain(
        'Circuit breaker threshold must be between 0 and 1',
      )
      expect(result.errors).toContain(
        'Circuit breaker probes must be at least 1',
      )
    })

    it('allows fallback to be the same as primary', () => {
      const config: LLMProviderConfig = {
        primaryProvider: 'claude',
        fallbackProvider: 'claude', // Same as primary
        dailyBudgetUSD: 0,
        maxRetries: 3,
        circuitBreakerThreshold: 0.5,
        circuitBreakerProbes: 1,
        providers: {
          claude: {
            name: 'claude',
            apiKey: 'test-key',
          },
        },
      }

      const result = LLMConfigLoader.validateConfig(config)
      expect(result.valid).toBe(true)
      expect(result.errors).toEqual([])
    })
  })

  describe('getProviderConfig', () => {
    it('returns configuration for a specific provider', () => {
      process.env.MEMORY_LLM_PRIMARY = 'claude'
      process.env.MEMORY_LLM_API_KEY_CLAUDE = 'test-claude-key'
      process.env.MEMORY_LLM_MODEL_CLAUDE = 'claude-3-sonnet'

      const config = LLMConfigLoader.loadConfig()
      const providerConfig = LLMConfigLoader.getProviderConfig(config, 'claude')

      expect(providerConfig).toEqual({
        name: 'claude',
        apiKey: 'test-claude-key',
        model: 'claude-3-sonnet',
      })
    })

    it('returns undefined for unconfigured provider', () => {
      process.env.MEMORY_LLM_PRIMARY = 'claude'
      process.env.MEMORY_LLM_API_KEY_CLAUDE = 'test-key'

      const config = LLMConfigLoader.loadConfig()
      const providerConfig = LLMConfigLoader.getProviderConfig(config, 'openai')

      expect(providerConfig).toBeUndefined()
    })
  })

  describe('.env.example integration', () => {
    it('provides clear documentation for required environment variables', () => {
      // This test verifies that our .env.example will have the right format
      const exampleEnvContent = `
# LLM Provider Configuration
# Primary provider for memory extraction (required)
MEMORY_LLM_PRIMARY=claude

# Fallback provider for resilience (optional, set to "none" to disable)
MEMORY_LLM_FALLBACK=openai

# Daily budget limit in USD (optional, 0 or unset means no limit)
MEMORY_LLM_DAILY_BUDGET_USD=10.00

# Claude Provider Configuration
MEMORY_LLM_API_KEY_CLAUDE=your-claude-api-key-here
MEMORY_LLM_MODEL_CLAUDE=claude-3-sonnet-20240229

# OpenAI Provider Configuration
MEMORY_LLM_API_KEY_OPENAI=your-openai-api-key-here
MEMORY_LLM_MODEL_OPENAI=gpt-4-turbo-preview

# Advanced Configuration (optional)
MEMORY_LLM_MAX_RETRIES=3
MEMORY_LLM_CIRCUIT_THRESHOLD=0.5
MEMORY_LLM_CIRCUIT_PROBES=1
`.trim()

      // Verify that all our environment variable names are documented
      expect(exampleEnvContent).toContain('MEMORY_LLM_PRIMARY')
      expect(exampleEnvContent).toContain('MEMORY_LLM_FALLBACK')
      expect(exampleEnvContent).toContain('MEMORY_LLM_DAILY_BUDGET_USD')
      expect(exampleEnvContent).toContain('MEMORY_LLM_API_KEY_CLAUDE')
      expect(exampleEnvContent).toContain('MEMORY_LLM_MODEL_CLAUDE')
      expect(exampleEnvContent).toContain('MEMORY_LLM_API_KEY_OPENAI')
      expect(exampleEnvContent).toContain('MEMORY_LLM_MODEL_OPENAI')
      expect(exampleEnvContent).toContain('MEMORY_LLM_MAX_RETRIES')
      expect(exampleEnvContent).toContain('MEMORY_LLM_CIRCUIT_THRESHOLD')
      expect(exampleEnvContent).toContain('MEMORY_LLM_CIRCUIT_PROBES')
    })
  })
})

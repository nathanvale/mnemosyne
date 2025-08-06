/**
 * Tests for TTS Provider Factory
 */

import { describe, expect, it, vi, beforeEach } from 'vitest'

import type { TTSProvider, TTSProviderConfig } from '../tts-provider.js'

import { TTSProviderFactory } from '../provider-factory.js'

// Mock providers for testing
class MockOpenAIProvider implements TTSProvider {
  constructor(public config: TTSProviderConfig) {}

  async speak(_text: string) {
    return {
      success: true,
      provider: 'openai',
      cached: false,
    }
  }

  async isAvailable() {
    return !!this.config.apiKey
  }

  getProviderInfo() {
    return {
      name: 'openai',
      displayName: 'OpenAI TTS',
      version: '1.0.0',
      requiresApiKey: true,
      supportedFeatures: ['speak', 'voices', 'cache'],
    }
  }

  configure(config: TTSProviderConfig) {
    Object.assign(this.config, config)
  }

  getConfiguration() {
    return { ...this.config }
  }
}

class MockMacOSProvider implements TTSProvider {
  constructor(public config: TTSProviderConfig) {}

  async speak(_text: string) {
    return {
      success: true,
      provider: 'macos',
    }
  }

  async isAvailable() {
    return process.platform === 'darwin'
  }

  getProviderInfo() {
    return {
      name: 'macos',
      displayName: 'macOS Say',
      version: '1.0.0',
      requiresApiKey: false,
      supportedFeatures: ['speak', 'voices'],
    }
  }

  configure(config: TTSProviderConfig) {
    Object.assign(this.config, config)
  }

  getConfiguration() {
    return { ...this.config }
  }
}

describe('TTSProviderFactory', () => {
  beforeEach(() => {
    // Reset factory state
    TTSProviderFactory.clearProviders()

    // Register mock providers
    TTSProviderFactory.registerProvider('openai', MockOpenAIProvider)
    TTSProviderFactory.registerProvider('macos', MockMacOSProvider)
  })

  describe('Provider Registration', () => {
    it('should register a new provider', () => {
      class CustomProvider extends MockOpenAIProvider {}

      TTSProviderFactory.registerProvider('custom', CustomProvider)
      const providers = TTSProviderFactory.getAvailableProviders()

      expect(providers).toContain('custom')
    })

    it('should throw when registering duplicate provider', () => {
      expect(() => {
        TTSProviderFactory.registerProvider('openai', MockOpenAIProvider)
      }).toThrow('Provider openai is already registered')
    })

    it('should list all registered providers', () => {
      const providers = TTSProviderFactory.getAvailableProviders()

      expect(providers).toEqual(['openai', 'macos'])
    })
  })

  describe('Provider Creation', () => {
    it('should create OpenAI provider with config', () => {
      const config = {
        provider: 'openai' as const,
        openai: { apiKey: 'test-key' },
      }

      const provider = TTSProviderFactory.create(config)

      expect(provider).toBeInstanceOf(MockOpenAIProvider)
      expect(provider.getProviderInfo().name).toBe('openai')
    })

    it('should create macOS provider with config', () => {
      const config = {
        provider: 'macos' as const,
        macos: { voice: 'Samantha' },
      }

      const provider = TTSProviderFactory.create(config)

      expect(provider).toBeInstanceOf(MockMacOSProvider)
      expect(provider.getProviderInfo().name).toBe('macos')
    })

    it('should throw for unknown provider', () => {
      const config = {
        provider: 'unknown' as 'openai',
      }

      expect(() => {
        TTSProviderFactory.create(config)
      }).toThrow('Unknown provider: unknown')
    })

    it('should pass provider-specific config', () => {
      const config = {
        provider: 'openai' as const,
        openai: {
          apiKey: 'test-key',
          model: 'tts-1',
          voice: 'nova',
        },
      }

      const provider = TTSProviderFactory.create(config)
      const providerConfig = provider.getConfiguration()

      expect(providerConfig).toMatchObject({
        apiKey: 'test-key',
        model: 'tts-1',
        voice: 'nova',
      })
    })
  })

  describe('Auto Provider Detection', () => {
    it('should detect best available provider with API key', async () => {
      const config = {
        provider: 'auto' as const,
        openai: { apiKey: 'test-key' },
      }

      const provider = await TTSProviderFactory.detectBestProvider(config)

      expect(provider.getProviderInfo().name).toBe('openai')
    })

    it('should fall back to macOS when no API key', async () => {
      const originalPlatform = Object.getOwnPropertyDescriptor(
        process,
        'platform',
      )
      Object.defineProperty(process, 'platform', {
        value: 'darwin',
      })

      const config = {
        provider: 'auto' as const,
      }

      const provider = await TTSProviderFactory.detectBestProvider(config)

      expect(provider.getProviderInfo().name).toBe('macos')

      // Restore original platform
      if (originalPlatform) {
        Object.defineProperty(process, 'platform', originalPlatform)
      }
    })

    it('should throw when no provider is available', async () => {
      const originalPlatform = Object.getOwnPropertyDescriptor(
        process,
        'platform',
      )
      Object.defineProperty(process, 'platform', {
        value: 'win32',
      })

      const config = {
        provider: 'auto' as const,
      }

      await expect(
        TTSProviderFactory.detectBestProvider(config),
      ).rejects.toThrow('No TTS provider available')

      // Restore original platform
      if (originalPlatform) {
        Object.defineProperty(process, 'platform', originalPlatform)
      }
    })

    it('should respect fallback provider preference', async () => {
      const originalPlatform = Object.getOwnPropertyDescriptor(
        process,
        'platform',
      )
      Object.defineProperty(process, 'platform', {
        value: 'darwin',
      })

      const config = {
        provider: 'auto' as const,
        fallbackProvider: 'macos' as const,
      }

      const provider = await TTSProviderFactory.detectBestProvider(config)

      expect(provider.getProviderInfo().name).toBe('macos')

      // Restore original platform
      if (originalPlatform) {
        Object.defineProperty(process, 'platform', originalPlatform)
      }
    })
  })

  describe('Provider With Fallback', () => {
    it('should create provider with fallback', () => {
      const config = {
        provider: 'openai' as const,
        fallbackProvider: 'macos' as const,
        openai: { apiKey: 'test-key' },
      }

      const provider = TTSProviderFactory.createWithFallback(config)

      expect(provider).toBeDefined()
      expect(provider.getProviderInfo().name).toBe('openai')
    })

    it('should handle speak with fallback on failure', async () => {
      const config = {
        provider: 'openai' as const,
        fallbackProvider: 'macos' as const,
        openai: { apiKey: 'test-key' },
      }

      const provider = TTSProviderFactory.createWithFallback(config)

      // Mock primary provider to fail
      const fallbackProvider = provider as unknown as {
        primaryProvider: { speak: (_text: string) => Promise<unknown> }
        speak: (text: string) => Promise<unknown>
      }
      vi.spyOn(fallbackProvider.primaryProvider, 'speak').mockRejectedValue(
        new Error('API error'),
      )

      const result = await provider.speak('Test text')

      expect(result.success).toBe(true)
      expect(result.provider).toBe('macos')
    })
  })
})

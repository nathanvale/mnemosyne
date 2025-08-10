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

class MockElevenLabsProvider implements TTSProvider {
  constructor(public config: TTSProviderConfig) {}

  async speak(_text: string) {
    return {
      success: true,
      provider: 'elevenlabs',
    }
  }

  async isAvailable() {
    const elConfig = this.config as { apiKey?: string; voiceId?: string }
    return !!elConfig.apiKey && !!elConfig.voiceId
  }

  getProviderInfo() {
    return {
      name: 'elevenlabs',
      displayName: 'ElevenLabs TTS',
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

describe('TTSProviderFactory', () => {
  beforeEach(() => {
    // Reset factory state
    TTSProviderFactory.clearProviders()

    // Register mock providers
    TTSProviderFactory.registerProvider('openai', MockOpenAIProvider)
    TTSProviderFactory.registerProvider('macos', MockMacOSProvider)
    TTSProviderFactory.registerProvider('elevenlabs', MockElevenLabsProvider)
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

    it('should list registered providers', () => {
      const providers = TTSProviderFactory.getAvailableProviders()

      expect(providers).toContain('openai')
      expect(providers).toContain('macos')
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

    it('should prioritize ElevenLabs over OpenAI when both API keys are available', async () => {
      const config = {
        provider: 'auto' as const,
        openai: { apiKey: 'openai-test-key' },
        elevenlabs: { apiKey: 'elevenlabs-test-key', voiceId: 'test-voice-id' },
      }

      const provider = await TTSProviderFactory.detectBestProvider(config)

      expect(provider.getProviderInfo().name).toBe('elevenlabs')
    })
  })

  describe('Provider With Fallback', () => {
    it('should create provider with fallback', async () => {
      const config = {
        provider: 'openai' as const,
        fallbackProvider: 'macos' as const,
        openai: { apiKey: 'test-key' },
      }

      const provider = await TTSProviderFactory.createWithFallback(config)

      expect(provider).toBeDefined()
      expect(provider.getProviderInfo().name).toBe('openai')
    })

    it('should handle speak with fallback on failure', async () => {
      const config = {
        provider: 'openai' as const,
        fallbackProvider: 'macos' as const,
        openai: { apiKey: 'test-key' },
      }

      const provider = await TTSProviderFactory.createWithFallback(config)

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

  describe('Provider isAvailable() Consistency', () => {
    it('ElevenLabs isAvailable should match speak requirements', async () => {
      // Test with API key but no voiceId - should return false
      const providerWithoutVoiceId = new MockElevenLabsProvider({
        apiKey: 'test-key',
        // voiceId missing
      })
      expect(await providerWithoutVoiceId.isAvailable()).toBe(false)

      // Test with both API key and voiceId - should return true
      const providerWithBoth = new MockElevenLabsProvider({
        apiKey: 'test-key',
        voiceId: 'test-voice-id',
      })
      expect(await providerWithBoth.isAvailable()).toBe(true)

      // Test with neither - should return false
      const providerWithNeither = new MockElevenLabsProvider({})
      expect(await providerWithNeither.isAvailable()).toBe(false)
    })

    it('OpenAI isAvailable should match speak requirements', async () => {
      // Test with no API key - should return false
      const providerWithoutKey = new MockOpenAIProvider({})
      expect(await providerWithoutKey.isAvailable()).toBe(false)

      // Test with API key - should return true
      const providerWithKey = new MockOpenAIProvider({
        apiKey: 'test-key',
      })
      expect(await providerWithKey.isAvailable()).toBe(true)
    })

    it('macOS isAvailable should match speak requirements', async () => {
      const originalPlatform = Object.getOwnPropertyDescriptor(
        process,
        'platform',
      )

      // Test on non-darwin platform - should return false
      Object.defineProperty(process, 'platform', {
        value: 'win32',
      })
      const providerOnWindows = new MockMacOSProvider({})
      expect(await providerOnWindows.isAvailable()).toBe(false)

      // Test on darwin platform - should return true
      Object.defineProperty(process, 'platform', {
        value: 'darwin',
      })
      const providerOnMacOS = new MockMacOSProvider({})
      expect(await providerOnMacOS.isAvailable()).toBe(true)

      // Restore original platform
      if (originalPlatform) {
        Object.defineProperty(process, 'platform', originalPlatform)
      }
    })
  })

  describe('Fallback Chain Regression Prevention', () => {
    it('should skip ElevenLabs without voiceId and select OpenAI', async () => {
      const config = {
        provider: 'auto' as const,
        fallbackProvider: 'macos' as const,
        elevenlabs: {
          apiKey: 'test-key',
          // voiceId missing - should be skipped
        },
        openai: {
          apiKey: 'openai-test-key',
        },
      }

      const provider = await TTSProviderFactory.detectBestProvider(config)

      // Should select OpenAI, not ElevenLabs
      expect(provider.getProviderInfo().name).toBe('openai')
    })

    it('should maintain ElevenLabs → OpenAI → macOS priority order', async () => {
      const originalPlatform = Object.getOwnPropertyDescriptor(
        process,
        'platform',
      )
      Object.defineProperty(process, 'platform', {
        value: 'darwin',
      })

      // Test 1: ElevenLabs fully configured - should select ElevenLabs
      const config1 = {
        provider: 'auto' as const,
        elevenlabs: { apiKey: 'el-key', voiceId: 'el-voice' },
        openai: { apiKey: 'openai-key' },
      }
      const provider1 = await TTSProviderFactory.detectBestProvider(config1)
      expect(provider1.getProviderInfo().name).toBe('elevenlabs')

      // Test 2: Only OpenAI configured - should select OpenAI
      const config2 = {
        provider: 'auto' as const,
        openai: { apiKey: 'openai-key' },
      }
      const provider2 = await TTSProviderFactory.detectBestProvider(config2)
      expect(provider2.getProviderInfo().name).toBe('openai')

      // Test 3: No API keys - should select macOS
      const config3 = {
        provider: 'auto' as const,
      }
      const provider3 = await TTSProviderFactory.detectBestProvider(config3)
      expect(provider3.getProviderInfo().name).toBe('macos')

      // Restore original platform
      if (originalPlatform) {
        Object.defineProperty(process, 'platform', originalPlatform)
      }
    })

    it('should handle partial ElevenLabs configurations correctly', async () => {
      const config = {
        provider: 'auto' as const,
        fallbackProvider: 'openai' as const,
        elevenlabs: {
          apiKey: 'test-key',
          // Missing voiceId should cause ElevenLabs to be skipped
        },
        openai: {
          apiKey: 'openai-test-key',
        },
      }

      const provider = await TTSProviderFactory.createWithFallback(config)

      // Should create OpenAI provider, not ElevenLabs
      expect(provider.getProviderInfo().name).toBe('openai')
    })
  })

  describe('Provider Addition Safety', () => {
    it('should not break priority order when new provider added', async () => {
      // This test ensures that adding new providers doesn't break existing priority
      // Clear existing providers and re-register in different order to simulate new provider addition
      TTSProviderFactory.clearProviders()

      // Register in different order to test priority is maintained by detectBestProvider logic
      TTSProviderFactory.registerProvider('macos', MockMacOSProvider)
      TTSProviderFactory.registerProvider('elevenlabs', MockElevenLabsProvider)
      TTSProviderFactory.registerProvider('openai', MockOpenAIProvider)

      const config = {
        provider: 'auto' as const,
        elevenlabs: { apiKey: 'el-key', voiceId: 'el-voice' },
        openai: { apiKey: 'openai-key' },
      }

      const provider = await TTSProviderFactory.detectBestProvider(config)

      // Should still prioritize ElevenLabs despite registration order
      expect(provider.getProviderInfo().name).toBe('elevenlabs')

      // Re-register providers in original order for other tests
      TTSProviderFactory.clearProviders()
      TTSProviderFactory.registerProvider('openai', MockOpenAIProvider)
      TTSProviderFactory.registerProvider('macos', MockMacOSProvider)
      TTSProviderFactory.registerProvider('elevenlabs', MockElevenLabsProvider)
    })

    it('should preserve fallback behavior with new providers', async () => {
      // Test that fallback chain still works when providers are added/removed
      const config = {
        provider: 'elevenlabs' as const,
        fallbackProvider: 'openai' as const,
        elevenlabs: { apiKey: 'invalid-key', voiceId: 'test-voice' },
        openai: { apiKey: 'openai-key' },
      }

      const provider = await TTSProviderFactory.createWithFallback(config)

      // Mock ElevenLabs to fail
      const fallbackProvider = provider as unknown as {
        primaryProvider: { speak: (_text: string) => Promise<unknown> }
        speak: (text: string) => Promise<unknown>
      }
      vi.spyOn(fallbackProvider.primaryProvider, 'speak').mockRejectedValue(
        new Error('API error'),
      )

      const result = await provider.speak('Test fallback')

      // Should successfully fall back to OpenAI
      expect(result.success).toBe(true)
      expect(result.provider).toBe('openai')
    })
  })
})

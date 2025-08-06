/**
 * Tests for TTS Provider abstraction
 */

import { describe, expect, it, vi } from 'vitest'

import type {
  SpeakResult,
  TTSProvider,
  TTSProviderConfig,
  TTSProviderInfo,
  Voice,
} from '../tts-provider.js'

// Mock implementation for testing
class MockTTSProvider implements TTSProvider {
  constructor(private config: TTSProviderConfig = {}) {}

  async speak(text: string): Promise<SpeakResult> {
    if (!text.trim()) {
      return {
        success: false,
        provider: 'mock',
        error: 'Empty text',
      }
    }

    return {
      success: true,
      provider: 'mock',
      cached: false,
      duration: 1000,
    }
  }

  async isAvailable(): Promise<boolean> {
    return true
  }

  getProviderInfo(): TTSProviderInfo {
    return {
      name: 'mock',
      displayName: 'Mock Provider',
      version: '1.0.0',
      requiresApiKey: false,
      supportedFeatures: ['speak', 'voices'],
    }
  }

  configure(config: TTSProviderConfig): void {
    Object.assign(this.config, config)
  }

  getConfiguration(): TTSProviderConfig {
    return { ...this.config }
  }

  async getVoices(): Promise<Voice[]> {
    return [
      {
        id: 'voice1',
        name: 'Voice 1',
        language: 'en-US',
        gender: 'female',
      },
      {
        id: 'voice2',
        name: 'Voice 2',
        language: 'en-US',
        gender: 'male',
      },
    ]
  }

  async preloadAudio(_text: string): Promise<void> {
    // Mock preloading
    await new Promise((resolve) => setTimeout(resolve, 10))
  }

  cancelSpeech(): void {
    // Mock cancellation
  }
}

describe('TTSProvider Interface', () => {
  describe('Core Methods', () => {
    it('should speak text successfully', async () => {
      const provider = new MockTTSProvider()
      const result = await provider.speak('Hello world')

      expect(result).toMatchObject({
        success: true,
        provider: 'mock',
        cached: false,
        duration: 1000,
      })
    })

    it('should handle empty text', async () => {
      const provider = new MockTTSProvider()
      const result = await provider.speak('')

      expect(result).toMatchObject({
        success: false,
        provider: 'mock',
        error: 'Empty text',
      })
    })

    it('should check availability', async () => {
      const provider = new MockTTSProvider()
      const available = await provider.isAvailable()

      expect(available).toBe(true)
    })

    it('should provide provider information', () => {
      const provider = new MockTTSProvider()
      const info = provider.getProviderInfo()

      expect(info).toMatchObject({
        name: 'mock',
        displayName: 'Mock Provider',
        version: '1.0.0',
        requiresApiKey: false,
        supportedFeatures: ['speak', 'voices'],
      })
    })
  })

  describe('Configuration', () => {
    it('should configure provider', () => {
      const provider = new MockTTSProvider()
      const config = { apiKey: 'test-key', voice: 'voice1' }

      provider.configure(config)
      const retrievedConfig = provider.getConfiguration()

      expect(retrievedConfig).toEqual(config)
    })

    it('should merge configuration', () => {
      const provider = new MockTTSProvider({ existing: 'value' })
      provider.configure({ apiKey: 'test-key' })

      const config = provider.getConfiguration()
      expect(config).toEqual({
        existing: 'value',
        apiKey: 'test-key',
      })
    })
  })

  describe('Optional Features', () => {
    it('should get available voices', async () => {
      const provider = new MockTTSProvider()
      const voices = await provider.getVoices()

      expect(voices).toHaveLength(2)
      expect(voices[0]).toMatchObject({
        id: 'voice1',
        name: 'Voice 1',
        language: 'en-US',
        gender: 'female',
      })
    })

    it('should preload audio', async () => {
      const provider = new MockTTSProvider()
      const preloadSpy = vi.spyOn(provider, 'preloadAudio')

      await provider.preloadAudio('Preload this text')

      expect(preloadSpy).toHaveBeenCalledWith('Preload this text')
    })

    it('should cancel speech', () => {
      const provider = new MockTTSProvider()
      const cancelSpy = vi.spyOn(provider, 'cancelSpeech')

      provider.cancelSpeech()

      expect(cancelSpy).toHaveBeenCalled()
    })
  })

  describe('SpeakResult Structure', () => {
    it('should include all required fields on success', async () => {
      const provider = new MockTTSProvider()
      const result = await provider.speak('Test')

      expect(result).toHaveProperty('success')
      expect(result).toHaveProperty('provider')
      expect(typeof result.success).toBe('boolean')
      expect(typeof result.provider).toBe('string')
    })

    it('should include error on failure', async () => {
      const provider = new MockTTSProvider()
      const result = await provider.speak('')

      expect(result.success).toBe(false)
      expect(result).toHaveProperty('error')
      expect(typeof result.error).toBe('string')
    })

    it('should optionally include cached flag', async () => {
      const provider = new MockTTSProvider()
      const result = await provider.speak('Test')

      if (result.cached !== undefined) {
        expect(typeof result.cached).toBe('boolean')
      }
    })

    it('should optionally include duration', async () => {
      const provider = new MockTTSProvider()
      const result = await provider.speak('Test')

      if (result.duration !== undefined) {
        expect(typeof result.duration).toBe('number')
        expect(result.duration).toBeGreaterThan(0)
      }
    })
  })

  describe('Error Handling', () => {
    class ErrorProvider implements TTSProvider {
      async speak(_text: string): Promise<SpeakResult> {
        throw new Error('Provider error')
      }

      async isAvailable(): Promise<boolean> {
        throw new Error('Availability check failed')
      }

      getProviderInfo(): TTSProviderInfo {
        return {
          name: 'error',
          displayName: 'Error Provider',
          version: '1.0.0',
          requiresApiKey: false,
          supportedFeatures: [],
        }
      }

      configure(_config: TTSProviderConfig): void {
        throw new Error('Configuration failed')
      }

      getConfiguration(): TTSProviderConfig {
        return {}
      }
    }

    it('should handle speak errors', async () => {
      const provider = new ErrorProvider()
      await expect(provider.speak('Test')).rejects.toThrow('Provider error')
    })

    it('should handle availability check errors', async () => {
      const provider = new ErrorProvider()
      await expect(provider.isAvailable()).rejects.toThrow(
        'Availability check failed',
      )
    })

    it('should handle configuration errors', () => {
      const provider = new ErrorProvider()
      expect(() => provider.configure({})).toThrow('Configuration failed')
    })
  })
})

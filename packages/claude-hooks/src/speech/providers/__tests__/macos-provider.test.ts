/**
 * Tests for macOS TTS Provider
 */

import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest'

import type { MacOSConfig } from '../macos-provider.js'

// Use vi.hoisted to ensure mocks are available when modules are imported
const { mockExec } = vi.hoisted(() => {
  return {
    mockExec: vi.fn(),
  }
})

// Mock child_process for macOS say command
vi.mock('node:child_process', () => ({
  default: { exec: mockExec },
  exec: mockExec,
}))

import { MacOSProvider } from '../macos-provider.js'

describe('MacOSProvider', () => {
  let provider: MacOSProvider
  let originalPlatform: string

  beforeEach(() => {
    vi.clearAllMocks()

    // Save original platform
    originalPlatform = process.platform

    // Mock platform as macOS for tests
    Object.defineProperty(process, 'platform', {
      value: 'darwin',
      writable: true,
      configurable: true,
    })

    // Default mock for exec (successful speech)
    mockExec.mockImplementation((_cmd, callback) => {
      if (typeof callback === 'function') {
        callback(null, '', '')
      }
      return {} as ReturnType<typeof import('node:child_process').exec>
    })
  })

  afterEach(() => {
    vi.clearAllMocks()

    // Restore original platform
    Object.defineProperty(process, 'platform', {
      value: originalPlatform,
      writable: true,
      configurable: true,
    })
  })

  describe('Configuration', () => {
    it('should create provider with minimal config', () => {
      const config: MacOSConfig = {}

      provider = new MacOSProvider(config)
      const info = provider.getProviderInfo()

      expect(info.name).toBe('macos')
      expect(info.requiresApiKey).toBe(false)
    })

    it('should use default values when not specified', () => {
      const config: MacOSConfig = {}

      provider = new MacOSProvider(config)
      const providerConfig = provider.getConfiguration()

      expect(providerConfig).toMatchObject({
        voice: 'Samantha',
        rate: 200,
      })
    })

    it('should accept all configuration options', () => {
      const config: MacOSConfig = {
        voice: 'Alex',
        rate: 180,
      }

      provider = new MacOSProvider(config)
      const providerConfig = provider.getConfiguration()

      expect(providerConfig).toEqual(config)
    })
  })

  describe('Voice Options', () => {
    const voices = [
      'Alex',
      'Samantha',
      'Daniel',
      'Karen',
      'Moira',
      'Tessa',
      'Victoria',
      'Fiona',
    ] as const

    voices.forEach((voice) => {
      it(`should support ${voice} voice`, async () => {
        const config: MacOSConfig = {
          voice,
        }

        provider = new MacOSProvider(config)
        const result = await provider.speak('Test text')

        expect(result.success).toBe(true)
        expect(mockExec).toHaveBeenCalledWith(
          expect.stringContaining(`-v ${voice}`),
          expect.any(Function),
        )
      })
    })
  })

  describe('Speech Rate Control', () => {
    it('should accept rate from 50 to 500', async () => {
      const rates = [50, 150, 200, 300, 500]

      for (const rate of rates) {
        const config: MacOSConfig = {
          rate,
        }

        provider = new MacOSProvider(config)
        await provider.speak('Test text')

        expect(mockExec).toHaveBeenCalledWith(
          expect.stringContaining(`-r ${rate}`),
          expect.any(Function),
        )
      }
    })

    it('should clamp rate to valid range', async () => {
      const config: MacOSConfig = {
        rate: 1000, // Too high
      }

      provider = new MacOSProvider(config)
      await provider.speak('Test text')

      expect(mockExec).toHaveBeenCalledWith(
        expect.stringContaining('-r 500'), // Clamped to max
        expect.any(Function),
      )
    })
  })

  describe('Say Command Integration', () => {
    it('should call say command with correct parameters', async () => {
      const config: MacOSConfig = {
        voice: 'Alex',
        rate: 180,
      }

      provider = new MacOSProvider(config)
      await provider.speak('Hello world')

      expect(mockExec).toHaveBeenCalledWith(
        'say -v Alex -r 180 "Hello world"',
        expect.any(Function),
      )
    })

    it('should handle empty text', async () => {
      const config: MacOSConfig = {}

      provider = new MacOSProvider(config)
      const result = await provider.speak('')

      expect(result.success).toBe(false)
      expect(result.error).toContain('Empty text')
      expect(mockExec).not.toHaveBeenCalled()
    })

    it('should escape quotes in text', async () => {
      const config: MacOSConfig = {}

      provider = new MacOSProvider(config)
      await provider.speak('Say "hello" to the world')

      expect(mockExec).toHaveBeenCalledWith(
        expect.stringContaining('Say \\"hello\\" to the world'),
        expect.any(Function),
      )
    })

    it('should handle very long text', async () => {
      const config: MacOSConfig = {}

      provider = new MacOSProvider(config)
      const longText = 'a'.repeat(5000)
      const result = await provider.speak(longText)

      // Should still work (no truncation limit like OpenAI)
      expect(result.success).toBe(true)
      expect(mockExec).toHaveBeenCalled()
    })
  })

  describe('Error Handling', () => {
    it('should handle say command failure', async () => {
      const config: MacOSConfig = {}

      mockExec.mockImplementation((_cmd, callback) => {
        if (typeof callback === 'function') {
          callback(new Error('say command failed'), '', 'Command not found')
        }
        return {} as ReturnType<typeof import('node:child_process').exec>
      })

      provider = new MacOSProvider(config)
      const result = await provider.speak('Test')

      expect(result.success).toBe(false)
      expect(result.error).toContain('say command failed')
    })

    it('should handle missing say command', async () => {
      const config: MacOSConfig = {}

      mockExec.mockImplementation((_cmd, callback) => {
        if (typeof callback === 'function') {
          callback(new Error('Command not found'), '', '')
        }
        return {} as ReturnType<typeof import('node:child_process').exec>
      })

      provider = new MacOSProvider(config)
      const result = await provider.speak('Test')

      expect(result.success).toBe(false)
      expect(result.error).toContain('Command not found')
    })

    it('should handle voice not available', async () => {
      const config: MacOSConfig = {}

      mockExec.mockImplementation((_cmd, callback) => {
        if (typeof callback === 'function') {
          callback(
            new Error('Voice not available'),
            '',
            "Voice 'InvalidVoice' not available",
          )
        }
        return {} as ReturnType<typeof import('node:child_process').exec>
      })

      provider = new MacOSProvider(config)
      const result = await provider.speak('Test')

      expect(result.success).toBe(false)
      expect(result.error).toContain('Voice not available')
    })
  })

  describe('Platform Detection', () => {
    it('should be available on macOS', async () => {
      const originalPlatform = Object.getOwnPropertyDescriptor(
        process,
        'platform',
      )
      Object.defineProperty(process, 'platform', {
        value: 'darwin',
      })

      const config: MacOSConfig = {}
      provider = new MacOSProvider(config)
      const available = await provider.isAvailable()

      expect(available).toBe(true)

      // Restore original platform
      if (originalPlatform) {
        Object.defineProperty(process, 'platform', originalPlatform)
      }
    })

    it('should not be available on Windows', async () => {
      const originalPlatform = Object.getOwnPropertyDescriptor(
        process,
        'platform',
      )
      Object.defineProperty(process, 'platform', {
        value: 'win32',
      })

      const config: MacOSConfig = {}
      provider = new MacOSProvider(config)
      const available = await provider.isAvailable()

      expect(available).toBe(false)

      // Restore original platform
      if (originalPlatform) {
        Object.defineProperty(process, 'platform', originalPlatform)
      }
    })

    it('should not be available on Linux', async () => {
      const originalPlatform = Object.getOwnPropertyDescriptor(
        process,
        'platform',
      )
      Object.defineProperty(process, 'platform', {
        value: 'linux',
      })

      const config: MacOSConfig = {}
      provider = new MacOSProvider(config)
      const available = await provider.isAvailable()

      expect(available).toBe(false)

      // Restore original platform
      if (originalPlatform) {
        Object.defineProperty(process, 'platform', originalPlatform)
      }
    })
  })

  describe('Voice Information', () => {
    it('should return available macOS voices', async () => {
      const config: MacOSConfig = {}

      provider = new MacOSProvider(config)
      const voices = await provider.getVoices()

      expect(voices.length).toBeGreaterThan(0)
      expect(voices[0]).toMatchObject({
        id: expect.any(String),
        name: expect.any(String),
        language: expect.any(String),
      })

      // Check for common macOS voices
      const voiceIds = voices.map((v) => v.id)
      expect(voiceIds).toContain('Alex')
      expect(voiceIds).toContain('Samantha')
    })
  })

  describe('Configuration Updates', () => {
    it('should allow voice configuration updates', () => {
      const config: MacOSConfig = {
        voice: 'Alex',
      }

      provider = new MacOSProvider(config)

      provider.configure({
        voice: 'Samantha',
      })

      const updatedConfig = provider.getConfiguration()
      expect(updatedConfig.voice).toBe('Samantha')
    })

    it('should allow rate configuration updates', () => {
      const config: MacOSConfig = {
        rate: 200,
      }

      provider = new MacOSProvider(config)

      provider.configure({
        rate: 150,
      })

      const updatedConfig = provider.getConfiguration()
      expect(updatedConfig.rate).toBe(150)
    })
  })

  describe('Speech Execution', () => {
    it('should return success result on successful speech', async () => {
      const config: MacOSConfig = {}

      provider = new MacOSProvider(config)
      const result = await provider.speak('Test message')

      expect(result.success).toBe(true)
      expect(result.provider).toBe('macos')
      expect(result.error).toBeUndefined()
    })

    it('should measure approximate duration', async () => {
      const config: MacOSConfig = {}

      // Mock a delay to simulate speech duration
      mockExec.mockImplementation((_cmd, callback) => {
        setTimeout(() => {
          if (typeof callback === 'function') {
            callback(null, '', '')
          }
        }, 100)
        return {} as ReturnType<typeof import('node:child_process').exec>
      })

      provider = new MacOSProvider(config)
      const result = await provider.speak('Test message')

      expect(result.success).toBe(true)
      expect(result.duration).toBeGreaterThan(0)
    })
  })
})

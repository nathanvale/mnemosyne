/**
 * Tests for OpenAI TTS Provider
 */

import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest'

import type { OpenAIConfig } from '../openai-provider.js'

// Use vi.hoisted to ensure mocks are available when modules are imported
const { mockCreate, mockExec, mockExecFile } = vi.hoisted(() => {
  return {
    mockCreate: vi.fn(),
    mockExec: vi.fn(),
    mockExecFile: vi.fn(),
  }
})

vi.mock('openai', () => {
  class MockOpenAI {
    audio = {
      speech: {
        create: mockCreate,
      },
    }
  }

  return {
    default: MockOpenAI,
    OpenAI: MockOpenAI,
  }
})

// Mock fs for audio file operations
vi.mock('node:fs/promises', () => ({
  default: {
    writeFile: vi.fn(),
    unlink: vi.fn(),
    mkdir: vi.fn(),
  },
  writeFile: vi.fn(),
  unlink: vi.fn(),
  mkdir: vi.fn(),
}))

// Mock child_process for audio playback
vi.mock('node:child_process', () => ({
  default: { exec: mockExec, execFile: mockExecFile, spawn: vi.fn() },
  exec: mockExec,
  execFile: mockExecFile,
  spawn: vi.fn(() => ({ unref: vi.fn() })),
}))

import { OpenAIProvider } from '../openai-provider.js'

describe('OpenAIProvider', () => {
  let provider: OpenAIProvider

  beforeEach(() => {
    vi.clearAllMocks()
    // Clear environment variable to ensure test isolation
    delete process.env.OPENAI_API_KEY

    // Default mock response for OpenAI
    mockCreate.mockResolvedValue({
      arrayBuffer: async () => new ArrayBuffer(2),
    })

    // Default mock for exec (successful playback)
    mockExec.mockImplementation((_cmd, callback) => {
      if (typeof callback === 'function') {
        callback(null, '', '')
      }
      return {} as ReturnType<typeof import('node:child_process').exec>
    })

    // Default mock for execFile (successful playback)
    mockExecFile.mockImplementation((_cmd, _args, callback) => {
      // Handle both callback and promisified versions
      if (typeof callback === 'function') {
        callback(null, '', '')
      } else if (typeof _args === 'function') {
        // If args is actually the callback (2-arg version)
        _args(null, '', '')
      }
      return {} as ReturnType<typeof import('node:child_process').execFile>
    })
  })

  afterEach(() => {
    vi.clearAllMocks()
    // Clean up environment variable
    delete process.env.OPENAI_API_KEY
  })

  describe('Configuration', () => {
    it('should create provider with minimal config', () => {
      const config: OpenAIConfig = {
        apiKey: 'test-key',
      }

      provider = new OpenAIProvider(config)
      const info = provider.getProviderInfo()

      expect(info.name).toBe('openai')
      expect(info.requiresApiKey).toBe(true)
    })

    it('should use default values when not specified', () => {
      const config: OpenAIConfig = {
        apiKey: 'test-key',
      }

      provider = new OpenAIProvider(config)
      const providerConfig = provider.getConfiguration()

      expect(providerConfig).toMatchObject({
        apiKey: 'test-key',
        model: 'tts-1',
        voice: 'alloy',
        speed: 1.0,
        format: 'mp3',
      })
    })

    it('should accept all configuration options', () => {
      const config: OpenAIConfig = {
        apiKey: 'test-key',
        model: 'tts-1-hd',
        voice: 'nova',
        speed: 1.5,
        format: 'opus',
      }

      provider = new OpenAIProvider(config)
      const providerConfig = provider.getConfiguration()

      expect(providerConfig).toEqual(config)
    })
  })

  describe('Voice Options', () => {
    const voices = [
      'alloy',
      'echo',
      'fable',
      'onyx',
      'nova',
      'shimmer',
    ] as const

    voices.forEach((voice) => {
      it(`should support ${voice} voice`, async () => {
        const config: OpenAIConfig = {
          apiKey: 'test-key',
          voice,
        }

        provider = new OpenAIProvider(config)
        const result = await provider.speak('Test text')

        expect(result.success).toBe(true)
        expect(mockCreate).toHaveBeenCalledWith(
          expect.objectContaining({
            voice,
          }),
        )
      })
    })
  })

  describe('Model Options', () => {
    it('should support tts-1 model', async () => {
      const config: OpenAIConfig = {
        apiKey: 'test-key',
        model: 'tts-1',
      }

      provider = new OpenAIProvider(config)
      await provider.speak('Test text')

      expect(mockCreate).toHaveBeenCalledWith(
        expect.objectContaining({
          model: 'tts-1',
        }),
      )
    })

    it('should support tts-1-hd model', async () => {
      const config: OpenAIConfig = {
        apiKey: 'test-key',
        model: 'tts-1-hd',
      }

      provider = new OpenAIProvider(config)
      await provider.speak('Test text')

      expect(mockCreate).toHaveBeenCalledWith(
        expect.objectContaining({
          model: 'tts-1-hd',
        }),
      )
    })
  })

  describe('Speed Control', () => {
    it('should accept speed from 0.25 to 4.0', async () => {
      const speeds = [0.25, 0.5, 1.0, 2.0, 4.0]

      for (const speed of speeds) {
        const config: OpenAIConfig = {
          apiKey: 'test-key',
          speed,
        }

        provider = new OpenAIProvider(config)
        await provider.speak('Test text')

        expect(mockCreate).toHaveBeenCalledWith(
          expect.objectContaining({
            speed,
          }),
        )
      }
    })

    it('should clamp speed to valid range', async () => {
      const config: OpenAIConfig = {
        apiKey: 'test-key',
        speed: 5.0, // Too high
      }

      provider = new OpenAIProvider(config)
      await provider.speak('Test text')

      expect(mockCreate).toHaveBeenCalledWith(
        expect.objectContaining({
          speed: 4.0, // Clamped to max
        }),
      )
    })
  })

  describe('Format Options', () => {
    const formats = ['mp3', 'opus', 'aac', 'flac'] as const

    formats.forEach((format) => {
      it(`should support ${format} format`, async () => {
        const config: OpenAIConfig = {
          apiKey: 'test-key',
          format,
        }

        provider = new OpenAIProvider(config)
        await provider.speak('Test text')

        expect(mockCreate).toHaveBeenCalledWith(
          expect.objectContaining({
            response_format: format,
          }),
        )
      })
    })
  })

  describe('API Integration', () => {
    it('should call OpenAI API with correct parameters', async () => {
      const config: OpenAIConfig = {
        apiKey: 'test-key',
        model: 'tts-1-hd',
        voice: 'nova',
        speed: 1.2,
        format: 'opus',
      }

      provider = new OpenAIProvider(config)
      await provider.speak('Hello world')

      expect(mockCreate).toHaveBeenCalledWith({
        model: 'tts-1-hd',
        input: 'Hello world',
        voice: 'nova',
        speed: 1.2,
        response_format: 'opus',
      })
    })

    it('should handle empty text', async () => {
      const config: OpenAIConfig = {
        apiKey: 'test-key',
      }

      provider = new OpenAIProvider(config)
      const result = await provider.speak('')

      expect(result.success).toBe(false)
      expect(result.error).toContain('Empty text')
      expect(mockCreate).not.toHaveBeenCalled()
    })

    it('should handle text over 4096 characters', async () => {
      const config: OpenAIConfig = {
        apiKey: 'test-key',
      }

      provider = new OpenAIProvider(config)
      const longText = 'a'.repeat(5000)
      const result = await provider.speak(longText)

      // Should truncate and still work
      expect(result.success).toBe(true)
      expect(mockCreate).toHaveBeenCalledWith(
        expect.objectContaining({
          input: expect.stringContaining('...'),
        }),
      )
    })
  })

  describe('Error Handling', () => {
    it('should handle 401 unauthorized error', async () => {
      const config: OpenAIConfig = {
        apiKey: 'invalid-key',
      }

      mockCreate.mockRejectedValue({
        status: 401,
        message: 'Unauthorized',
      })

      provider = new OpenAIProvider(config)
      const result = await provider.speak('Test')

      expect(result.success).toBe(false)
      expect(result.error).toContain('API key')
    })

    it(
      'should retry on 429 rate limit error',
      async () => {
        const config: OpenAIConfig = {
          apiKey: 'test-key',
        }

        // Fail first 2 times with rate limit, succeed on 3rd
        mockCreate
          .mockRejectedValueOnce({
            status: 429,
            message: 'Too Many Requests',
          })
          .mockRejectedValueOnce({
            status: 429,
            message: 'Too Many Requests',
          })
          .mockResolvedValueOnce({
            arrayBuffer: async () => new ArrayBuffer(2),
          })

        provider = new OpenAIProvider(config)
        const result = await provider.speak('Test')

        expect(result.success).toBe(true)
        expect(mockCreate).toHaveBeenCalledTimes(3)
      },
      process.env.CI ? 5000 : 10000,
    ) // Reduced timeout for CI environment

    it(
      'should retry on 500 server error',
      async () => {
        const config: OpenAIConfig = {
          apiKey: 'test-key',
        }

        // Fail first time, succeed on retry
        mockCreate
          .mockRejectedValueOnce({
            status: 500,
            message: 'Internal Server Error',
          })
          .mockResolvedValueOnce({
            arrayBuffer: async () => new ArrayBuffer(2),
          })

        provider = new OpenAIProvider(config)
        const result = await provider.speak('Test')

        expect(result.success).toBe(true)
        expect(mockCreate).toHaveBeenCalledTimes(2)
      },
      process.env.CI ? 5000 : 10000,
    )

    it(
      'should fail after max retries',
      async () => {
        const config: OpenAIConfig = {
          apiKey: 'test-key',
        }

        // Always fail with retryable error
        mockCreate.mockRejectedValue({
          status: 503,
          message: 'Service Unavailable',
        })

        provider = new OpenAIProvider(config)
        const result = await provider.speak('Test')

        expect(result.success).toBe(false)
        expect(result.error).toContain('Server error')
        expect(mockCreate).toHaveBeenCalledTimes(4) // 1 initial + 3 retries
      },
      process.env.CI ? 8000 : 15000,
    )

    it(
      'should handle network timeout with retry',
      async () => {
        const config: OpenAIConfig = {
          apiKey: 'test-key',
        }

        // Fail with timeout once, then succeed
        mockCreate
          .mockRejectedValueOnce(new Error('ETIMEDOUT'))
          .mockResolvedValueOnce({
            arrayBuffer: async () => new ArrayBuffer(2),
          })

        provider = new OpenAIProvider(config)
        const result = await provider.speak('Test')

        expect(result.success).toBe(true)
        expect(mockCreate).toHaveBeenCalledTimes(2)
      },
      process.env.CI ? 5000 : 10000,
    )
  })

  describe('Provider Availability', () => {
    it('should be available with valid API key', async () => {
      const config: OpenAIConfig = {
        apiKey: 'test-key',
      }

      provider = new OpenAIProvider(config)
      const available = await provider.isAvailable()

      expect(available).toBe(true)
    })

    it('should not be available without API key', async () => {
      const config: OpenAIConfig = {
        apiKey: '',
      }

      provider = new OpenAIProvider(config)
      const available = await provider.isAvailable()

      expect(available).toBe(false)
    })

    it('should check API key from environment', async () => {
      process.env.OPENAI_API_KEY = 'env-key'

      const config: OpenAIConfig = {}
      provider = new OpenAIProvider(config)
      const available = await provider.isAvailable()

      expect(available).toBe(true)

      delete process.env.OPENAI_API_KEY
    })
  })

  describe('Audio Playback', () => {
    it('should play audio after successful generation', async () => {
      const config: OpenAIConfig = {
        apiKey: 'test-key',
      }

      provider = new OpenAIProvider(config)
      const result = await provider.speak('Test')

      expect(result.success).toBe(true)
      // Should use execFile instead of exec for security
      expect(mockExecFile).toHaveBeenCalled()
    })

    it('should handle playback failure gracefully', async () => {
      mockExecFile.mockImplementation((_cmd, _args, callback) => {
        if (typeof callback === 'function') {
          callback(new Error('Playback failed'), '', '')
        } else if (typeof _args === 'function') {
          _args(new Error('Playback failed'), '', '')
        }
        return {} as ReturnType<typeof import('node:child_process').execFile>
      })

      const config: OpenAIConfig = {
        apiKey: 'test-key',
      }

      provider = new OpenAIProvider(config)
      const result = await provider.speak('Test')

      // Generation succeeds even if playback fails
      expect(result.success).toBe(true)
    })
  })

  describe('Voice Information', () => {
    it('should return available voices', async () => {
      const config: OpenAIConfig = {
        apiKey: 'test-key',
      }

      provider = new OpenAIProvider(config)
      const voices = await provider.getVoices()

      expect(voices).toHaveLength(6)
      expect(voices[0]).toMatchObject({
        id: 'alloy',
        name: 'Alloy',
        language: 'en-US',
      })
    })
  })
})

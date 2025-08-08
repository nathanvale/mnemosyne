/**
 * Tests for ElevenLabs TTS Provider
 */

import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest'

import type { ElevenLabsConfig } from '../elevenlabs-provider.js'

// hoisted mocks
const { mockConvert, mockVoicesSearch, mockExec } = vi.hoisted(() => {
  return {
    mockConvert: vi.fn(),
    mockVoicesSearch: vi.fn(),
    mockExec: vi.fn(),
  }
})

vi.mock('@elevenlabs/elevenlabs-js', () => {
  class MockClient {
    textToSpeech = {
      convert: mockConvert,
    }
    voices = {
      search: mockVoicesSearch,
    }
  }
  return { ElevenLabsClient: MockClient }
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
  default: { exec: mockExec },
  exec: mockExec,
}))

import { ElevenLabsProvider } from '../elevenlabs-provider.js'

describe('ElevenLabsProvider', () => {
  let provider: ElevenLabsProvider

  beforeEach(() => {
    vi.clearAllMocks()
    delete process.env.ELEVENLABS_API_KEY
    // default response: async iterable of bytes
    mockConvert.mockImplementation(async function* () {
      yield new Uint8Array([1, 2])
    })
    mockExec.mockImplementation((_cmd, cb) => {
      if (typeof cb === 'function') cb(null, '', '')
      return {} as ReturnType<typeof import('node:child_process').exec>
    })
  })

  afterEach(() => {
    vi.clearAllMocks()
    delete process.env.ELEVENLABS_API_KEY
  })

  describe('Configuration', () => {
    it('creates with minimal config', () => {
      const config: ElevenLabsConfig = {
        apiKey: 'key',
        voiceId: 'voice',
      }
      provider = new ElevenLabsProvider(config)
      const info = provider.getProviderInfo()
      expect(info.name).toBe('elevenlabs')
    })

    it('defaults model/output format and settings', () => {
      const config: ElevenLabsConfig = { apiKey: 'k', voiceId: 'v' }
      provider = new ElevenLabsProvider(config)
      expect(provider.getConfiguration()).toMatchObject({
        modelId: 'eleven_multilingual_v2',
        outputFormat: 'mp3_44100_128',
        speed: 1,
      })
    })
  })

  describe('API Integration', () => {
    it('calls convert with correct params', async () => {
      provider = new ElevenLabsProvider({ apiKey: 'k', voiceId: 'JBF...' })
      await provider.speak('Hello')

      expect(mockConvert).toHaveBeenCalledWith(
        'JBF...',
        expect.objectContaining({
          text: 'Hello',
          modelId: 'eleven_multilingual_v2',
          outputFormat: 'mp3_44100_128',
        }),
      )
    })

    it('errors if no api key', async () => {
      provider = new ElevenLabsProvider({ voiceId: 'v' })
      const result = await provider.speak('Hi')
      expect(result.success).toBe(false)
      expect(result.error).toContain('API key')
    })

    it('errors if no voiceId', async () => {
      provider = new ElevenLabsProvider({ apiKey: 'k' })
      const result = await provider.speak('Hi')
      expect(result.success).toBe(false)
      expect(result.error).toContain('voiceId')
    })

    it('handles empty text', async () => {
      provider = new ElevenLabsProvider({ apiKey: 'k', voiceId: 'v' })
      const result = await provider.speak('')
      expect(result.success).toBe(false)
      expect(mockConvert).not.toHaveBeenCalled()
    })
  })

  describe('Error Handling and Retry', () => {
    it('retries on 429 then succeeds', async () => {
      provider = new ElevenLabsProvider({ apiKey: 'k', voiceId: 'v' })
      mockConvert
        .mockRejectedValueOnce({ status: 429, message: 'Too Many' })
        .mockImplementationOnce(async function* () {
          yield new Uint8Array([1])
        })
      const result = await provider.speak('Hi')
      expect(result.success).toBe(true)
      expect(mockConvert).toHaveBeenCalledTimes(2)
    }, 10000)
  })

  describe('Voices', () => {
    it('lists voices', async () => {
      mockVoicesSearch.mockResolvedValue({
        voices: [
          { voiceId: 'id1', name: 'Adam', language: 'en-US' },
          { voice_id: 'id2', name: 'Bella', language: 'en-GB' },
        ],
      })
      provider = new ElevenLabsProvider({ apiKey: 'k', voiceId: 'v' })
      const voices = await provider.getVoices()
      expect(voices.map((v) => v.id)).toEqual(['id1', 'id2'])
    })
  })
})

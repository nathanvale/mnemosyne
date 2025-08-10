import { describe, it, expect, beforeEach, vi } from 'vitest'

import { applyEnvOverrides } from '../env-config'

type TestConfig = Record<string, Record<string, Record<string, unknown>>>

describe('Environment Variable Aliases', () => {
  beforeEach(() => {
    // Clear all environment variables
    vi.unstubAllEnvs()
    // Clear any real env vars that might be loaded from .env.example
    // eslint-disable-next-line turbo/no-undeclared-env-vars
    delete process.env.ELEVENLABS_VOICE_ID
    // eslint-disable-next-line turbo/no-undeclared-env-vars
    delete process.env.ELEVENLABS_MODEL_ID
    // eslint-disable-next-line turbo/no-undeclared-env-vars
    delete process.env.ELEVENLABS_OUTPUT_FORMAT
    // eslint-disable-next-line turbo/no-undeclared-env-vars
    delete process.env.CLAUDE_HOOKS_ELEVENLABS_VOICE_ID
    // eslint-disable-next-line turbo/no-undeclared-env-vars
    delete process.env.CLAUDE_HOOKS_ELEVENLABS_MODEL_ID
    // eslint-disable-next-line turbo/no-undeclared-env-vars
    delete process.env.CLAUDE_HOOKS_ELEVENLABS_OUTPUT_FORMAT
  })

  describe('ElevenLabs Voice ID Aliases', () => {
    it('should map ELEVENLABS_VOICE_ID to tts.elevenlabs.voiceId', () => {
      vi.stubEnv('ELEVENLABS_VOICE_ID', 'test-voice-123')

      const config = { tts: { elevenlabs: {} } } as TestConfig
      applyEnvOverrides(config)

      expect(config.tts.elevenlabs.voiceId).toBe('test-voice-123')
    })

    it('should map CLAUDE_HOOKS_ELEVENLABS_VOICE_ID to tts.elevenlabs.voiceId', () => {
      vi.stubEnv('CLAUDE_HOOKS_ELEVENLABS_VOICE_ID', 'test-voice-456')

      const config = { tts: { elevenlabs: {} } } as TestConfig
      applyEnvOverrides(config)

      expect(config.tts.elevenlabs.voiceId).toBe('test-voice-456')
    })

    it('should prefer ELEVENLABS_VOICE_ID when both are set', () => {
      vi.stubEnv('ELEVENLABS_VOICE_ID', 'new-format-voice')
      vi.stubEnv('CLAUDE_HOOKS_ELEVENLABS_VOICE_ID', 'old-format-voice')

      const config = { tts: { elevenlabs: {} } } as TestConfig
      applyEnvOverrides(config)

      expect(config.tts.elevenlabs.voiceId).toBe('new-format-voice')
    })

    it('should use CLAUDE_HOOKS_ELEVENLABS_VOICE_ID when ELEVENLABS_VOICE_ID is not set', () => {
      vi.stubEnv('CLAUDE_HOOKS_ELEVENLABS_VOICE_ID', 'fallback-voice')

      const config = { tts: { elevenlabs: {} } } as TestConfig
      applyEnvOverrides(config)

      expect(config.tts.elevenlabs.voiceId).toBe('fallback-voice')
    })
  })

  describe('ElevenLabs Model ID Aliases', () => {
    it('should map ELEVENLABS_MODEL_ID to tts.elevenlabs.modelId', () => {
      vi.stubEnv('ELEVENLABS_MODEL_ID', 'eleven_monolingual_v1')

      const config = { tts: { elevenlabs: {} } } as TestConfig
      applyEnvOverrides(config)

      expect(config.tts.elevenlabs.modelId).toBe('eleven_monolingual_v1')
    })

    it('should map CLAUDE_HOOKS_ELEVENLABS_MODEL_ID to tts.elevenlabs.modelId', () => {
      vi.stubEnv('CLAUDE_HOOKS_ELEVENLABS_MODEL_ID', 'eleven_multilingual_v2')

      const config = { tts: { elevenlabs: {} } } as TestConfig
      applyEnvOverrides(config)

      expect(config.tts.elevenlabs.modelId).toBe('eleven_multilingual_v2')
    })

    it('should prefer ELEVENLABS_MODEL_ID when both are set', () => {
      vi.stubEnv('ELEVENLABS_MODEL_ID', 'new-model')
      vi.stubEnv('CLAUDE_HOOKS_ELEVENLABS_MODEL_ID', 'old-model')

      const config = { tts: { elevenlabs: {} } } as TestConfig
      applyEnvOverrides(config)

      expect(config.tts.elevenlabs.modelId).toBe('new-model')
    })
  })

  describe('ElevenLabs Output Format Aliases', () => {
    it('should map ELEVENLABS_OUTPUT_FORMAT to tts.elevenlabs.outputFormat', () => {
      vi.stubEnv('ELEVENLABS_OUTPUT_FORMAT', 'mp3_44100_128')

      const config = { tts: { elevenlabs: {} } } as TestConfig
      applyEnvOverrides(config)

      expect(config.tts.elevenlabs.outputFormat).toBe('mp3_44100_128')
    })

    it('should still support CLAUDE_HOOKS_ELEVENLABS_OUTPUT_FORMAT', () => {
      vi.stubEnv('CLAUDE_HOOKS_ELEVENLABS_OUTPUT_FORMAT', 'opus_48000')

      const config = { tts: { elevenlabs: {} } } as TestConfig
      applyEnvOverrides(config)

      expect(config.tts.elevenlabs.outputFormat).toBe('opus_48000')
    })

    it('should prefer ELEVENLABS_OUTPUT_FORMAT when both are set', () => {
      vi.stubEnv('ELEVENLABS_OUTPUT_FORMAT', 'pcm_16000')
      vi.stubEnv('CLAUDE_HOOKS_ELEVENLABS_OUTPUT_FORMAT', 'mp3_44100_64')

      const config = { tts: { elevenlabs: {} } } as TestConfig
      applyEnvOverrides(config)

      expect(config.tts.elevenlabs.outputFormat).toBe('pcm_16000')
    })
  })

  describe('Complex Configuration Scenarios', () => {
    it('should handle all ElevenLabs aliases together', () => {
      vi.stubEnv('ELEVENLABS_API_KEY', 'test-api-key')
      vi.stubEnv('ELEVENLABS_VOICE_ID', 'rachel-voice')
      vi.stubEnv('ELEVENLABS_MODEL_ID', 'eleven_monolingual_v1')
      vi.stubEnv('ELEVENLABS_OUTPUT_FORMAT', 'mp3_44100_128')

      const config = { tts: { elevenlabs: {} } } as TestConfig
      applyEnvOverrides(config)

      expect(config.tts.elevenlabs.apiKey).toBe('test-api-key')
      expect(config.tts.elevenlabs.voiceId).toBe('rachel-voice')
      expect(config.tts.elevenlabs.modelId).toBe('eleven_monolingual_v1')
      expect(config.tts.elevenlabs.outputFormat).toBe('mp3_44100_128')
    })

    it('should handle mixed old and new format variables', () => {
      vi.stubEnv('ELEVENLABS_API_KEY', 'test-api-key')
      vi.stubEnv('ELEVENLABS_VOICE_ID', 'new-voice')
      vi.stubEnv('CLAUDE_HOOKS_ELEVENLABS_MODEL_ID', 'old-model')
      vi.stubEnv('ELEVENLABS_OUTPUT_FORMAT', 'new-format')

      const config = { tts: { elevenlabs: {} } } as TestConfig
      applyEnvOverrides(config)

      expect(config.tts.elevenlabs.apiKey).toBe('test-api-key')
      expect(config.tts.elevenlabs.voiceId).toBe('new-voice')
      expect(config.tts.elevenlabs.modelId).toBe('old-model')
      expect(config.tts.elevenlabs.outputFormat).toBe('new-format')
    })

    it('should not override config values when env vars are not set', () => {
      const config = {
        tts: {
          elevenlabs: {
            voiceId: 'config-voice',
            modelId: 'config-model',
            outputFormat: 'config-format',
          },
        },
      } as TestConfig

      applyEnvOverrides(config)

      expect(config.tts.elevenlabs.voiceId).toBe('config-voice')
      expect(config.tts.elevenlabs.modelId).toBe('config-model')
      expect(config.tts.elevenlabs.outputFormat).toBe('config-format')
    })
  })
})

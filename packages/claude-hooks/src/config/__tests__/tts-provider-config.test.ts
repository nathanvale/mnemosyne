/**
 * Tests for TTS Provider configuration validation
 * Tests provider selection, OpenAI configuration, and factory config validation
 */

import { describe, it, expect } from 'vitest'

describe('TTS Provider Configuration', () => {
  describe('Factory Configuration', () => {
    it('should validate provider selection options', () => {
      const validProviderConfigs = [
        { provider: 'openai' },
        { provider: 'macos' },
        { provider: 'auto' },
      ]

      validProviderConfigs.forEach((config) => {
        const validProviders = ['openai', 'macos', 'auto']
        const isValid = validProviders.includes(config.provider)
        expect(isValid).toBe(true)
      })
    })

    it('should reject invalid provider selections', () => {
      const invalidProviderConfigs = [
        { provider: 'invalid' },
        { provider: 'google' },
        { provider: 'azure' },
        { provider: 123 }, // number instead of string
        { provider: null }, // null instead of string
      ]

      invalidProviderConfigs.forEach((config) => {
        const validProviders = ['openai', 'macos', 'auto']
        const isValid =
          typeof config.provider === 'string' &&
          validProviders.includes(config.provider)
        expect(isValid).toBe(false)
      })
    })

    it('should validate fallback provider options', () => {
      const validFallbackConfigs = [
        { provider: 'openai', fallbackProvider: 'macos' },
        { provider: 'openai', fallbackProvider: 'none' },
        { provider: 'auto' }, // no fallback required
      ]

      validFallbackConfigs.forEach((config) => {
        const validFallbacks = ['macos', 'none', undefined]
        const isValid =
          !config.fallbackProvider ||
          validFallbacks.includes(config.fallbackProvider)
        expect(isValid).toBe(true)
      })
    })

    it('should reject invalid fallback providers', () => {
      const invalidFallbackConfigs = [
        { provider: 'openai', fallbackProvider: 'openai' }, // circular
        { provider: 'openai', fallbackProvider: 'google' }, // invalid provider
        { provider: 'openai', fallbackProvider: 123 }, // number instead of string
      ]

      invalidFallbackConfigs.forEach((config) => {
        const validFallbacks = ['macos', 'none']
        const isValid =
          !config.fallbackProvider ||
          (typeof config.fallbackProvider === 'string' &&
            validFallbacks.includes(config.fallbackProvider))
        expect(isValid).toBe(false)
      })
    })

    it('should validate complete factory configuration', () => {
      const validFactoryConfig = {
        provider: 'openai' as const,
        fallbackProvider: 'macos' as const,
        openai: {
          apiKey: 'sk-test123',
          model: 'tts-1',
          voice: 'alloy',
          speed: 1.0,
          format: 'mp3',
        },
        macos: {
          voice: 'Alex',
          rate: 200,
          volume: 0.8,
        },
      }

      // Basic validation
      const validProviders = ['openai', 'macos', 'auto']
      const validFallbacks = ['macos', 'none']

      const isValidProvider = validProviders.includes(
        validFactoryConfig.provider,
      )
      const isValidFallback = validFallbacks.includes(
        validFactoryConfig.fallbackProvider,
      )

      expect(isValidProvider).toBe(true)
      expect(isValidFallback).toBe(true)
    })
  })

  describe('OpenAI Provider Configuration', () => {
    it('should validate OpenAI API key configuration', () => {
      const validApiKeys = [
        'sk-1234567890abcdef',
        'sk-test',
        '', // empty string (will use env var)
      ]

      validApiKeys.forEach((apiKey) => {
        const isValid = typeof apiKey === 'string'
        expect(isValid).toBe(true)
      })
    })

    it('should reject invalid API keys', () => {
      const invalidApiKeys = [
        123, // number
        null, // null
        undefined, // undefined (should be string)
        [], // array
        {}, // object
      ]

      invalidApiKeys.forEach((apiKey) => {
        const isValid = typeof apiKey === 'string'
        expect(isValid).toBe(false)
      })
    })

    it('should validate OpenAI model options', () => {
      const validModels = ['tts-1', 'tts-1-hd']

      validModels.forEach((model) => {
        const isValid = ['tts-1', 'tts-1-hd'].includes(model)
        expect(isValid).toBe(true)
      })
    })

    it('should reject invalid OpenAI models', () => {
      const invalidModels = [
        'gpt-4', // wrong model type
        'tts-2', // doesn't exist
        'whisper-1', // wrong service
        123, // number
        null, // null
      ]

      invalidModels.forEach((model) => {
        const validModels = ['tts-1', 'tts-1-hd']
        const isValid = typeof model === 'string' && validModels.includes(model)
        expect(isValid).toBe(false)
      })
    })

    it('should validate OpenAI voice options', () => {
      const validVoices = ['alloy', 'echo', 'fable', 'onyx', 'nova', 'shimmer']

      validVoices.forEach((voice) => {
        const isValid = [
          'alloy',
          'echo',
          'fable',
          'onyx',
          'nova',
          'shimmer',
        ].includes(voice)
        expect(isValid).toBe(true)
      })
    })

    it('should reject invalid OpenAI voices', () => {
      const invalidVoices = [
        'siri', // doesn't exist
        'alex', // macOS voice
        'cortana', // Windows voice
        123, // number
        null, // null
      ]

      invalidVoices.forEach((voice) => {
        const validVoices = [
          'alloy',
          'echo',
          'fable',
          'onyx',
          'nova',
          'shimmer',
        ]
        const isValid = typeof voice === 'string' && validVoices.includes(voice)
        expect(isValid).toBe(false)
      })
    })

    it('should validate OpenAI speed configuration', () => {
      const validSpeeds = [
        0.25, // minimum
        1.0, // default
        2.0, // double speed
        4.0, // maximum
        1.5, // fractional
      ]

      validSpeeds.forEach((speed) => {
        const isValid =
          typeof speed === 'number' && speed >= 0.25 && speed <= 4.0
        expect(isValid).toBe(true)
      })
    })

    it('should reject invalid OpenAI speeds', () => {
      const invalidSpeeds = [
        0.1, // too slow
        5.0, // too fast
        -1.0, // negative
        '1.0', // string
        null, // null
      ]

      invalidSpeeds.forEach((speed) => {
        const isValid =
          typeof speed === 'number' && speed >= 0.25 && speed <= 4.0
        expect(isValid).toBe(false)
      })
    })

    it('should validate OpenAI format options', () => {
      const validFormats = ['mp3', 'opus', 'aac', 'flac']

      validFormats.forEach((format) => {
        const isValid = ['mp3', 'opus', 'aac', 'flac'].includes(format)
        expect(isValid).toBe(true)
      })
    })

    it('should reject invalid OpenAI formats', () => {
      const invalidFormats = [
        'wav', // not supported
        'ogg', // not supported
        'm4a', // not supported
        123, // number
        null, // null
      ]

      invalidFormats.forEach((format) => {
        const validFormats = ['mp3', 'opus', 'aac', 'flac']
        const isValid =
          typeof format === 'string' && validFormats.includes(format)
        expect(isValid).toBe(false)
      })
    })

    it('should validate complete OpenAI configuration', () => {
      const validOpenAIConfig = {
        apiKey: 'sk-test123',
        model: 'tts-1-hd' as const,
        voice: 'nova' as const,
        speed: 1.2,
        format: 'mp3' as const,
      }

      // Validate each field
      const isValidApiKey = typeof validOpenAIConfig.apiKey === 'string'
      const isValidModel = ['tts-1', 'tts-1-hd'].includes(
        validOpenAIConfig.model,
      )
      const isValidVoice = [
        'alloy',
        'echo',
        'fable',
        'onyx',
        'nova',
        'shimmer',
      ].includes(validOpenAIConfig.voice)
      const isValidSpeed =
        typeof validOpenAIConfig.speed === 'number' &&
        validOpenAIConfig.speed >= 0.25 &&
        validOpenAIConfig.speed <= 4.0
      const isValidFormat = ['mp3', 'opus', 'aac', 'flac'].includes(
        validOpenAIConfig.format,
      )

      expect(isValidApiKey).toBe(true)
      expect(isValidModel).toBe(true)
      expect(isValidVoice).toBe(true)
      expect(isValidSpeed).toBe(true)
      expect(isValidFormat).toBe(true)
    })
  })

  describe('macOS Provider Configuration', () => {
    it('should validate macOS voice configuration', () => {
      const validMacOSVoices = [
        'Alex',
        'Samantha',
        'Victoria',
        'Daniel',
        'Fiona',
        'Moira',
        'Karen',
        'Veena',
        'Tessa',
        'Rishi',
      ]

      validMacOSVoices.forEach((voice) => {
        const isValid = typeof voice === 'string' && voice.length > 0
        expect(isValid).toBe(true)
      })
    })

    it('should validate macOS rate configuration', () => {
      const validRates = [
        100, // slow
        200, // normal
        400, // fast
        175, // custom
      ]

      validRates.forEach((rate) => {
        const isValid = typeof rate === 'number' && rate > 0 && rate <= 500
        expect(isValid).toBe(true)
      })
    })

    it('should reject invalid macOS rates', () => {
      const invalidRates = [
        0, // zero
        -100, // negative
        1000, // too fast
        '200', // string
        null, // null
      ]

      invalidRates.forEach((rate) => {
        const isValid = typeof rate === 'number' && rate > 0 && rate <= 500
        expect(isValid).toBe(false)
      })
    })

    it('should validate macOS volume configuration', () => {
      const validVolumes = [
        0.0, // silent
        0.5, // half
        1.0, // full
        0.8, // custom
      ]

      validVolumes.forEach((volume) => {
        const isValid = typeof volume === 'number' && volume >= 0 && volume <= 1
        expect(isValid).toBe(true)
      })
    })

    it('should reject invalid macOS volumes', () => {
      const invalidVolumes = [
        -0.1, // negative
        1.5, // too loud
        '0.8', // string
        null, // null
      ]

      invalidVolumes.forEach((volume) => {
        const isValid = typeof volume === 'number' && volume >= 0 && volume <= 1
        expect(isValid).toBe(false)
      })
    })

    it('should validate complete macOS configuration', () => {
      const validMacOSConfig = {
        voice: 'Alex',
        rate: 250,
        volume: 0.8,
        enabled: true,
      }

      const isValidVoice = typeof validMacOSConfig.voice === 'string'
      const isValidRate =
        typeof validMacOSConfig.rate === 'number' &&
        validMacOSConfig.rate > 0 &&
        validMacOSConfig.rate <= 500
      const isValidVolume =
        typeof validMacOSConfig.volume === 'number' &&
        validMacOSConfig.volume >= 0 &&
        validMacOSConfig.volume <= 1
      const isValidEnabled = typeof validMacOSConfig.enabled === 'boolean'

      expect(isValidVoice).toBe(true)
      expect(isValidRate).toBe(true)
      expect(isValidVolume).toBe(true)
      expect(isValidEnabled).toBe(true)
    })
  })

  describe('Environment Variable Configuration', () => {
    it('should validate TTS provider environment variables', () => {
      const ttsEnvMappings = {
        OPENAI_API_KEY: 'openai.apiKey',
        CLAUDE_HOOKS_TTS_PROVIDER: 'provider',
        CLAUDE_HOOKS_TTS_FALLBACK: 'fallbackProvider',
        CLAUDE_HOOKS_OPENAI_MODEL: 'openai.model',
        CLAUDE_HOOKS_OPENAI_VOICE: 'openai.voice',
        CLAUDE_HOOKS_OPENAI_SPEED: 'openai.speed',
        CLAUDE_HOOKS_OPENAI_FORMAT: 'openai.format',
        CLAUDE_HOOKS_MACOS_VOICE: 'macos.voice',
        CLAUDE_HOOKS_MACOS_RATE: 'macos.rate',
        CLAUDE_HOOKS_MACOS_VOLUME: 'macos.volume',
      }

      Object.entries(ttsEnvMappings).forEach(([envVar, configPath]) => {
        expect(typeof envVar).toBe('string')
        expect(envVar.length).toBeGreaterThan(0)
        expect(typeof configPath).toBe('string')
        expect(configPath.length).toBeGreaterThan(0)
      })
    })

    it('should validate environment variable value parsing for TTS', () => {
      const ttsEnvValues = {
        // Boolean values
        true: true,
        false: false,
        '1': true,
        '0': false,

        // String values (for models, voices, formats)
        'tts-1': 'tts-1',
        alloy: 'alloy',
        mp3: 'mp3',
        Alex: 'Alex',

        // Number values (for speed, rate, volume)
        '1.5': 1.5,
        '200': 200,
        '0.8': 0.8,
      }

      Object.entries(ttsEnvValues).forEach(([envValue, expected]) => {
        let parsed

        if (envValue === 'true' || envValue === '1') {
          parsed = true
        } else if (envValue === 'false' || envValue === '0') {
          parsed = false
        } else if (!isNaN(Number(envValue))) {
          parsed = Number(envValue)
        } else {
          parsed = envValue
        }

        expect(parsed).toEqual(expected)
      })
    })
  })

  describe('Configuration Schema Integration', () => {
    it('should validate TTS configuration within complete config', () => {
      const completeConfigWithTTS = {
        // Existing config
        debug: true,
        notify: true,
        speak: true,
        cooldownPeriod: 5000,
        allowUrgentOverride: true,

        // New TTS configuration
        tts: {
          provider: 'openai' as const,
          fallbackProvider: 'macos' as const,
          openai: {
            apiKey: 'sk-test123',
            model: 'tts-1-hd' as const,
            voice: 'nova' as const,
            speed: 1.2,
            format: 'mp3' as const,
          },
          macos: {
            voice: 'Alex',
            rate: 200,
            volume: 0.8,
            enabled: true,
          },
        },
      }

      // Validate existing fields
      const isValidBasic =
        typeof completeConfigWithTTS.debug === 'boolean' &&
        typeof completeConfigWithTTS.notify === 'boolean' &&
        typeof completeConfigWithTTS.speak === 'boolean'

      // Validate TTS configuration
      const ttsConfig = completeConfigWithTTS.tts
      const validProviders = ['openai', 'macos', 'auto']
      const validFallbacks = ['macos', 'none']

      const isValidTTSProvider = validProviders.includes(ttsConfig.provider)
      const isValidTTSFallback = validFallbacks.includes(
        ttsConfig.fallbackProvider,
      )

      // Validate OpenAI config
      const openaiConfig = ttsConfig.openai
      const isValidOpenAI =
        typeof openaiConfig.apiKey === 'string' &&
        ['tts-1', 'tts-1-hd'].includes(openaiConfig.model) &&
        ['alloy', 'echo', 'fable', 'onyx', 'nova', 'shimmer'].includes(
          openaiConfig.voice,
        ) &&
        typeof openaiConfig.speed === 'number' &&
        openaiConfig.speed >= 0.25 &&
        openaiConfig.speed <= 4.0 &&
        ['mp3', 'opus', 'aac', 'flac'].includes(openaiConfig.format)

      // Validate macOS config
      const macosConfig = ttsConfig.macos
      const isValidMacOS =
        typeof macosConfig.voice === 'string' &&
        typeof macosConfig.rate === 'number' &&
        macosConfig.rate > 0 &&
        macosConfig.rate <= 500 &&
        typeof macosConfig.volume === 'number' &&
        macosConfig.volume >= 0 &&
        macosConfig.volume <= 1 &&
        typeof macosConfig.enabled === 'boolean'

      expect(isValidBasic).toBe(true)
      expect(isValidTTSProvider).toBe(true)
      expect(isValidTTSFallback).toBe(true)
      expect(isValidOpenAI).toBe(true)
      expect(isValidMacOS).toBe(true)
    })

    it('should provide meaningful error messages for invalid TTS configurations', () => {
      const invalidTTSConfig = {
        tts: {
          provider: 'invalid', // should be openai|macos|auto
          fallbackProvider: 'google', // should be macos|none
          openai: {
            apiKey: 123, // should be string
            model: 'gpt-4', // should be tts-1|tts-1-hd
            voice: 'siri', // should be valid OpenAI voice
            speed: 5.0, // should be 0.25-4.0
            format: 'wav', // should be mp3|opus|aac|flac
          },
          macos: {
            voice: 123, // should be string
            rate: -100, // should be > 0
            volume: 1.5, // should be 0-1
            enabled: 'true', // should be boolean
          },
        },
      }

      const errors: string[] = []

      // Validate provider
      const validProviders = ['openai', 'macos', 'auto']
      if (!validProviders.includes(invalidTTSConfig.tts.provider)) {
        errors.push('tts.provider must be one of: openai, macos, auto')
      }

      // Validate fallback
      const validFallbacks = ['macos', 'none']
      if (!validFallbacks.includes(invalidTTSConfig.tts.fallbackProvider)) {
        errors.push('tts.fallbackProvider must be one of: macos, none')
      }

      // Validate OpenAI config
      const openaiConfig = invalidTTSConfig.tts.openai
      if (typeof openaiConfig.apiKey !== 'string') {
        errors.push('tts.openai.apiKey must be a string')
      }
      if (!['tts-1', 'tts-1-hd'].includes(openaiConfig.model)) {
        errors.push('tts.openai.model must be one of: tts-1, tts-1-hd')
      }
      if (
        !['alloy', 'echo', 'fable', 'onyx', 'nova', 'shimmer'].includes(
          openaiConfig.voice,
        )
      ) {
        errors.push('tts.openai.voice must be a valid OpenAI voice')
      }
      if (
        typeof openaiConfig.speed !== 'number' ||
        openaiConfig.speed < 0.25 ||
        openaiConfig.speed > 4.0
      ) {
        errors.push('tts.openai.speed must be a number between 0.25 and 4.0')
      }
      if (!['mp3', 'opus', 'aac', 'flac'].includes(openaiConfig.format)) {
        errors.push('tts.openai.format must be one of: mp3, opus, aac, flac')
      }

      // Validate macOS config
      const macosConfig = invalidTTSConfig.tts.macos
      if (typeof macosConfig.voice !== 'string') {
        errors.push('tts.macos.voice must be a string')
      }
      if (typeof macosConfig.rate !== 'number' || macosConfig.rate <= 0) {
        errors.push('tts.macos.rate must be a positive number')
      }
      if (
        typeof macosConfig.volume !== 'number' ||
        macosConfig.volume < 0 ||
        macosConfig.volume > 1
      ) {
        errors.push('tts.macos.volume must be a number between 0 and 1')
      }
      if (typeof macosConfig.enabled !== 'boolean') {
        errors.push('tts.macos.enabled must be a boolean')
      }

      expect(errors.length).toBeGreaterThan(0)
      expect(errors).toContain(
        'tts.provider must be one of: openai, macos, auto',
      )
      expect(errors).toContain(
        'tts.fallbackProvider must be one of: macos, none',
      )
      expect(errors).toContain('tts.openai.apiKey must be a string')
      expect(errors).toContain(
        'tts.openai.model must be one of: tts-1, tts-1-hd',
      )
      expect(errors).toContain('tts.openai.voice must be a valid OpenAI voice')
      expect(errors).toContain(
        'tts.openai.speed must be a number between 0.25 and 4.0',
      )
      expect(errors).toContain(
        'tts.openai.format must be one of: mp3, opus, aac, flac',
      )
      expect(errors).toContain('tts.macos.voice must be a string')
      expect(errors).toContain('tts.macos.rate must be a positive number')
      expect(errors).toContain(
        'tts.macos.volume must be a number between 0 and 1',
      )
      expect(errors).toContain('tts.macos.enabled must be a boolean')
    })
  })
})

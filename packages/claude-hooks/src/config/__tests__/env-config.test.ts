/* eslint-disable @typescript-eslint/no-explicit-any */
/**
 * Tests for environment variable configuration support
 * Tests loading configuration from environment variables
 */

import { beforeEach, afterEach, describe, it, expect } from 'vitest'

import {
  EnvConfigLoader,
  DEFAULT_ENV_MAPPINGS,
  loadConfigFromEnv,
} from '../env-config.js'

describe('Environment Configuration', () => {
  let originalEnv: NodeJS.ProcessEnv

  beforeEach(() => {
    // Save original environment
    originalEnv = { ...process.env }

    // Clear all Claude hooks environment variables
    Object.keys(process.env).forEach((key) => {
      if (key.startsWith('CLAUDE_HOOKS_')) {
        delete process.env[key]
      }
    })

    // Also clear API keys that may be loaded from .env.example
    delete process.env.OPENAI_API_KEY
    delete process.env.ELEVENLABS_API_KEY
    // eslint-disable-next-line turbo/no-undeclared-env-vars
    delete process.env.TAVILY_API_KEY
    // eslint-disable-next-line turbo/no-undeclared-env-vars
    delete process.env.FIRECRAWL_API_KEY
  })

  afterEach(() => {
    // Restore original environment
    process.env = originalEnv

    // Clear OPENAI_API_KEY as well
    delete process.env.OPENAI_API_KEY
  })

  describe('Basic Environment Variable Loading', () => {
    it('should load boolean configuration from environment variables', () => {
      process.env.CLAUDE_HOOKS_DEBUG = 'true'
      process.env.CLAUDE_HOOKS_NOTIFY_SOUND = 'false'
      process.env.CLAUDE_HOOKS_SPEAK = '1'

      const loader = new EnvConfigLoader()
      const config = loader.loadFromEnv()

      expect(config.debug).toBe(true)
      expect(config.notifySound).toBe(false)
      expect(config.speak).toBe(true)
    })

    it('should load number configuration from environment variables', () => {
      process.env.CLAUDE_HOOKS_COOLDOWN_PERIOD = '3000'
      process.env.CLAUDE_HOOKS_SPEECH_RATE = '250'
      process.env.CLAUDE_HOOKS_SPEECH_VOLUME = '0.8'

      const loader = new EnvConfigLoader()
      const config = loader.loadFromEnv()

      expect(config.cooldownPeriod).toBe(3000)
      expect(config.speech?.rate).toBe(250)
      expect(config.speech?.volume).toBe(0.8)
    })

    it('should load string configuration from environment variables', () => {
      process.env.CLAUDE_HOOKS_SPEECH_VOICE = 'Alex'
      process.env.CLAUDE_HOOKS_QUIET_HOURS_TIMEZONE = 'UTC'

      const loader = new EnvConfigLoader()
      const config = loader.loadFromEnv()

      expect(config.speech?.voice).toBe('Alex')
      expect(config.quietHours?.timezone).toBe('UTC')
    })

    it('should not override config when environment variable is not set', () => {
      const baseConfig = {
        debug: true,
        notifySound: false,
        cooldownPeriod: 5000,
      }

      const loader = new EnvConfigLoader()
      const config = loader.loadFromEnv(baseConfig)

      expect(config.debug).toBe(true)
      expect(config.notifySound).toBe(false)
      expect(config.cooldownPeriod).toBe(5000)
    })

    it('should override base configuration with environment variables', () => {
      process.env.CLAUDE_HOOKS_DEBUG = 'false'
      process.env.CLAUDE_HOOKS_COOLDOWN_PERIOD = '10000'

      const baseConfig = {
        debug: true,
        notifySound: true,
        cooldownPeriod: 5000,
      }

      const loader = new EnvConfigLoader()
      const config = loader.loadFromEnv(baseConfig)

      expect(config.debug).toBe(false)
      expect(config.notifySound).toBe(true) // Not overridden
      expect(config.cooldownPeriod).toBe(10000)
    })
  })

  describe('Boolean Parsing', () => {
    it('should parse various true values', () => {
      const trueValues = ['true', 'TRUE', 'True', '1', 'yes', 'YES', 'on', 'ON']

      trueValues.forEach((value) => {
        process.env.CLAUDE_HOOKS_DEBUG = value

        const loader = new EnvConfigLoader()
        const config = loader.loadFromEnv()

        expect(config.debug).toBe(true)
      })
    })

    it('should parse various false values', () => {
      const falseValues = [
        'false',
        'FALSE',
        'False',
        '0',
        'no',
        'NO',
        'off',
        'OFF',
      ]

      falseValues.forEach((value) => {
        process.env.CLAUDE_HOOKS_DEBUG = value

        const loader = new EnvConfigLoader()
        const config = loader.loadFromEnv()

        expect(config.debug).toBe(false)
      })
    })

    it('should handle whitespace in boolean values', () => {
      process.env.CLAUDE_HOOKS_DEBUG = '  true  '
      process.env.CLAUDE_HOOKS_NOTIFY_SOUND = '  false  '

      const loader = new EnvConfigLoader()
      const config = loader.loadFromEnv()

      expect(config.debug).toBe(true)
      expect(config.notifySound).toBe(false)
    })
  })

  describe('Complex Configuration Parsing', () => {
    it('should parse comma-separated day lists', () => {
      process.env.CLAUDE_HOOKS_QUIET_HOURS_DAYS = 'monday,tuesday,wednesday'

      const loader = new EnvConfigLoader()
      const config = loader.loadFromEnv()

      expect(config.quietHours?.days).toEqual([
        'monday',
        'tuesday',
        'wednesday',
      ])
    })

    it('should parse time ranges', () => {
      process.env.CLAUDE_HOOKS_QUIET_HOURS_RANGES = '22:00-08:00,12:00-13:00'

      const loader = new EnvConfigLoader()
      const config = loader.loadFromEnv()

      expect(config.quietHours?.ranges).toEqual([
        { start: '22:00', end: '08:00' },
        { start: '12:00', end: '13:00' },
      ])
    })

    it('should handle whitespace in complex values', () => {
      process.env.CLAUDE_HOOKS_QUIET_HOURS_DAYS =
        ' monday , tuesday , wednesday '
      process.env.CLAUDE_HOOKS_QUIET_HOURS_RANGES =
        ' 22:00 - 08:00 , 12:00 - 13:00 '

      const loader = new EnvConfigLoader()
      const config = loader.loadFromEnv()

      expect(config.quietHours?.days).toEqual([
        'monday',
        'tuesday',
        'wednesday',
      ])
      expect(config.quietHours?.ranges).toEqual([
        { start: '22:00', end: '08:00' },
        { start: '12:00', end: '13:00' },
      ])
    })
  })

  describe('Nested Configuration', () => {
    it("should create nested objects when they don't exist", () => {
      process.env.CLAUDE_HOOKS_SPEECH_VOICE = 'Alex'
      process.env.CLAUDE_HOOKS_QUIET_HOURS_ENABLED = 'true'

      const loader = new EnvConfigLoader()
      const config = loader.loadFromEnv({})

      expect(config.speech?.voice).toBe('Alex')
      expect(config.quietHours?.enabled).toBe(true)
    })

    it('should merge with existing nested objects', () => {
      process.env.CLAUDE_HOOKS_SPEECH_RATE = '300'

      const baseConfig = {
        speech: {
          voice: 'Alex',
          volume: 0.7,
        },
      }

      const loader = new EnvConfigLoader()
      const config = loader.loadFromEnv(baseConfig)

      expect(config.speech?.voice).toBe('Alex') // Preserved
      expect(config.speech?.volume).toBe(0.7) // Preserved
      expect(config.speech?.rate).toBe(300) // Added from env
    })
  })

  describe('Environment Variable Validation', () => {
    it('should validate all environment variables successfully', () => {
      process.env.CLAUDE_HOOKS_DEBUG = 'true'
      process.env.CLAUDE_HOOKS_COOLDOWN_PERIOD = '5000'
      process.env.CLAUDE_HOOKS_SPEECH_VOLUME = '0.8'

      const loader = new EnvConfigLoader()
      const validation = loader.validateEnvVars()

      expect(validation.isValid).toBe(true)
      expect(validation.errors).toEqual([])
    })

    it('should detect invalid boolean values', () => {
      process.env.CLAUDE_HOOKS_DEBUG = 'invalid'

      const loader = new EnvConfigLoader()
      const validation = loader.validateEnvVars()

      expect(validation.isValid).toBe(false)
      expect(validation.errors).toHaveLength(1)
      expect(validation.errors[0]).toContain('CLAUDE_HOOKS_DEBUG')
      expect(validation.errors[0]).toContain('Cannot parse')
    })

    it('should detect invalid number values', () => {
      process.env.CLAUDE_HOOKS_COOLDOWN_PERIOD = 'not-a-number'

      const loader = new EnvConfigLoader()
      const validation = loader.validateEnvVars()

      expect(validation.isValid).toBe(false)
      expect(validation.errors).toHaveLength(1)
      expect(validation.errors[0]).toContain('CLAUDE_HOOKS_COOLDOWN_PERIOD')
      expect(validation.errors[0]).toContain('Cannot parse')
    })

    it('should collect multiple validation errors', () => {
      process.env.CLAUDE_HOOKS_DEBUG = 'invalid'
      process.env.CLAUDE_HOOKS_COOLDOWN_PERIOD = 'not-a-number'

      const loader = new EnvConfigLoader()
      const validation = loader.validateEnvVars()

      expect(validation.isValid).toBe(false)
      expect(validation.errors).toHaveLength(2)
    })
  })

  describe('Environment Variable Inspection', () => {
    it('should return only relevant environment variables', () => {
      process.env.CLAUDE_HOOKS_DEBUG = 'true'
      process.env.CLAUDE_HOOKS_NOTIFY_SOUND = 'false'
      process.env.SOME_OTHER_VAR = 'value'

      const loader = new EnvConfigLoader()
      const relevantVars = loader.getRelevantEnvVars()

      expect(relevantVars).toEqual({
        CLAUDE_HOOKS_DEBUG: 'true',
        CLAUDE_HOOKS_NOTIFY_SOUND: 'false',
      })
      expect(relevantVars.SOME_OTHER_VAR).toBeUndefined()
    })

    it('should return empty object when no relevant vars are set', () => {
      const loader = new EnvConfigLoader()
      const relevantVars = loader.getRelevantEnvVars()

      expect(relevantVars).toEqual({})
    })
  })

  describe('Custom Mappings', () => {
    it('should support adding custom environment variable mappings', () => {
      const loader = new EnvConfigLoader([])

      loader.addMapping({
        envVar: 'CUSTOM_DEBUG',
        configPath: 'debug',
        type: 'boolean',
      })

      process.env.CUSTOM_DEBUG = 'true'

      const config = loader.loadFromEnv()
      expect(config.debug).toBe(true)
    })

    it('should support removing environment variable mappings', () => {
      const loader = new EnvConfigLoader()

      loader.removeMapping('CLAUDE_HOOKS_DEBUG')

      process.env.CLAUDE_HOOKS_DEBUG = 'true'

      const config = loader.loadFromEnv()
      expect(config.debug).toBeUndefined()
    })

    it('should support custom parsers', () => {
      const loader = new EnvConfigLoader([])

      loader.addMapping({
        envVar: 'CUSTOM_LIST',
        configPath: 'customList',
        type: 'string',
        parser: (value: string) =>
          value.split('|').map((item) => item.toUpperCase()),
      })

      process.env.CUSTOM_LIST = 'apple|banana|cherry'

      const config = loader.loadFromEnv()
      expect((config as any).customList).toEqual(['APPLE', 'BANANA', 'CHERRY'])
    })
  })

  describe('Convenience Functions', () => {
    it('should provide convenient loadConfigFromEnv function', () => {
      process.env.CLAUDE_HOOKS_DEBUG = 'true'
      process.env.CLAUDE_HOOKS_COOLDOWN_PERIOD = '3000'

      const config = loadConfigFromEnv()

      expect(config.debug).toBe(true)
      expect(config.cooldownPeriod).toBe(3000)
    })

    it('should merge with base config in convenience function', () => {
      process.env.CLAUDE_HOOKS_DEBUG = 'false'

      const baseConfig = {
        notifySound: true,
        cooldownPeriod: 5000,
      }

      const config = loadConfigFromEnv(baseConfig)

      expect(config.debug).toBe(false) // From env
      expect(config.notifySound).toBe(true) // From base
      expect(config.cooldownPeriod).toBe(5000) // From base
    })
  })

  describe('Default Mappings', () => {
    it('should include all expected default mappings', () => {
      const expectedEnvVars = [
        'CLAUDE_HOOKS_DEBUG',
        'CLAUDE_HOOKS_NOTIFY_SOUND',
        'CLAUDE_HOOKS_SPEAK',
        'CLAUDE_HOOKS_COOLDOWN_PERIOD',
        'CLAUDE_HOOKS_ALLOW_URGENT_OVERRIDE',
        'CLAUDE_HOOKS_QUIET_HOURS_ENABLED',
        'CLAUDE_HOOKS_QUIET_HOURS_ALLOW_URGENT',
        'CLAUDE_HOOKS_QUIET_HOURS_TIMEZONE',
        'CLAUDE_HOOKS_QUIET_HOURS_DAYS',
        'CLAUDE_HOOKS_QUIET_HOURS_RANGES',
        'CLAUDE_HOOKS_SPEECH_ENABLED',
        'CLAUDE_HOOKS_SPEECH_VOICE',
        'CLAUDE_HOOKS_SPEECH_RATE',
        'CLAUDE_HOOKS_SPEECH_VOLUME',
        // TTS environment variables
        'CLAUDE_HOOKS_TTS_PROVIDER',
        'CLAUDE_HOOKS_TTS_FALLBACK_PROVIDER',
        'OPENAI_API_KEY',
        'CLAUDE_HOOKS_OPENAI_TTS_MODEL',
        'CLAUDE_HOOKS_OPENAI_TTS_VOICE',
        'CLAUDE_HOOKS_OPENAI_TTS_SPEED',
        'CLAUDE_HOOKS_OPENAI_TTS_FORMAT',
        'CLAUDE_HOOKS_MACOS_TTS_VOICE',
        'CLAUDE_HOOKS_MACOS_TTS_RATE',
        'CLAUDE_HOOKS_MACOS_TTS_VOLUME',
        'CLAUDE_HOOKS_MACOS_TTS_ENABLED',
      ]

      const mappedEnvVars = DEFAULT_ENV_MAPPINGS.map((m) => m.envVar)

      expectedEnvVars.forEach((envVar) => {
        expect(mappedEnvVars).toContain(envVar)
      })
    })

    it('should have correct config paths for all default mappings', () => {
      const expectedMappings = [
        { envVar: 'CLAUDE_HOOKS_DEBUG', configPath: 'debug' },
        { envVar: 'CLAUDE_HOOKS_NOTIFY_SOUND', configPath: 'notifySound' },
        { envVar: 'CLAUDE_HOOKS_SPEAK', configPath: 'speak' },
        {
          envVar: 'CLAUDE_HOOKS_COOLDOWN_PERIOD',
          configPath: 'cooldownPeriod',
        },
        {
          envVar: 'CLAUDE_HOOKS_ALLOW_URGENT_OVERRIDE',
          configPath: 'allowUrgentOverride',
        },
        {
          envVar: 'CLAUDE_HOOKS_QUIET_HOURS_ENABLED',
          configPath: 'quietHours.enabled',
        },
        { envVar: 'CLAUDE_HOOKS_SPEECH_VOICE', configPath: 'speech.voice' },
      ]

      expectedMappings.forEach((expected) => {
        const mapping = DEFAULT_ENV_MAPPINGS.find(
          (m) => m.envVar === expected.envVar,
        )
        expect(mapping).toBeDefined()
        expect(mapping?.configPath).toBe(expected.configPath)
      })
    })
  })

  describe('TTS Environment Variables', () => {
    beforeEach(() => {
      // Clear all TTS-related environment variables
      Object.keys(process.env).forEach((key) => {
        if (key.includes('TTS') || key === 'OPENAI_API_KEY') {
          delete process.env[key]
        }
      })
    })

    it('should load TTS provider configuration from environment variables', () => {
      process.env.CLAUDE_HOOKS_TTS_PROVIDER = 'openai'
      process.env.CLAUDE_HOOKS_TTS_FALLBACK_PROVIDER = 'macos'

      const loader = new EnvConfigLoader()
      const config = loader.loadFromEnv()

      expect(config.tts?.provider).toBe('openai')
      expect(config.tts?.fallbackProvider).toBe('macos')
    })

    it('should load OpenAI TTS configuration from environment variables', () => {
      process.env.OPENAI_API_KEY = 'sk-test-key-123'
      process.env.CLAUDE_HOOKS_OPENAI_TTS_MODEL = 'tts-1-hd'
      process.env.CLAUDE_HOOKS_OPENAI_TTS_VOICE = 'nova'
      process.env.CLAUDE_HOOKS_OPENAI_TTS_SPEED = '1.25'
      process.env.CLAUDE_HOOKS_OPENAI_TTS_FORMAT = 'mp3'

      const loader = new EnvConfigLoader()
      const config = loader.loadFromEnv()

      expect(config.tts?.openai?.apiKey).toBe('sk-test-key-123')
      expect(config.tts?.openai?.model).toBe('tts-1-hd')
      expect(config.tts?.openai?.voice).toBe('nova')
      expect(config.tts?.openai?.speed).toBe(1.25)
      expect(config.tts?.openai?.format).toBe('mp3')
    })

    it('should load macOS TTS configuration from environment variables', () => {
      process.env.CLAUDE_HOOKS_MACOS_TTS_VOICE = 'Alex'
      process.env.CLAUDE_HOOKS_MACOS_TTS_RATE = '200'
      process.env.CLAUDE_HOOKS_MACOS_TTS_VOLUME = '0.8'
      process.env.CLAUDE_HOOKS_MACOS_TTS_ENABLED = 'true'

      const loader = new EnvConfigLoader()
      const config = loader.loadFromEnv()

      expect(config.tts?.macos?.voice).toBe('Alex')
      expect(config.tts?.macos?.rate).toBe(200)
      expect(config.tts?.macos?.volume).toBe(0.8)
      expect(config.tts?.macos?.enabled).toBe(true)
    })

    it('should create nested TTS objects when they do not exist', () => {
      process.env.OPENAI_API_KEY = 'sk-test-key'
      process.env.CLAUDE_HOOKS_MACOS_TTS_VOICE = 'Alex'

      const loader = new EnvConfigLoader()
      const config = loader.loadFromEnv({})

      expect(config.tts?.openai?.apiKey).toBe('sk-test-key')
      expect(config.tts?.macos?.voice).toBe('Alex')
    })

    it('should merge with existing TTS configuration', () => {
      process.env.CLAUDE_HOOKS_OPENAI_TTS_MODEL = 'tts-1-hd'
      process.env.CLAUDE_HOOKS_MACOS_TTS_RATE = '250'

      const baseConfig = {
        tts: {
          provider: 'auto' as const,
          openai: {
            apiKey: 'existing-key',
            voice: 'alloy' as const,
          },
          macos: {
            voice: 'Samantha',
            enabled: true,
          },
        },
      }

      const loader = new EnvConfigLoader()
      const config = loader.loadFromEnv(baseConfig)

      // Should preserve existing values
      expect(config.tts?.provider).toBe('auto')
      expect(config.tts?.openai?.apiKey).toBe('existing-key')
      expect(config.tts?.openai?.voice).toBe('alloy')
      expect(config.tts?.macos?.voice).toBe('Samantha')
      expect(config.tts?.macos?.enabled).toBe(true)

      // Should add new values from environment
      expect(config.tts?.openai?.model).toBe('tts-1-hd')
      expect(config.tts?.macos?.rate).toBe(250)
    })

    it('should validate TTS environment variables', () => {
      process.env.OPENAI_API_KEY = 'sk-valid-key'
      process.env.CLAUDE_HOOKS_OPENAI_TTS_SPEED = '1.5'
      process.env.CLAUDE_HOOKS_MACOS_TTS_ENABLED = 'true'

      const loader = new EnvConfigLoader()
      const validation = loader.validateEnvVars()

      expect(validation.isValid).toBe(true)
      expect(validation.errors).toEqual([])
    })

    it('should detect invalid TTS numeric values', () => {
      process.env.CLAUDE_HOOKS_OPENAI_TTS_SPEED = 'invalid-speed'
      process.env.CLAUDE_HOOKS_MACOS_TTS_RATE = 'not-a-number'

      const loader = new EnvConfigLoader()
      const validation = loader.validateEnvVars()

      expect(validation.isValid).toBe(false)
      expect(validation.errors).toHaveLength(2)
      expect(validation.errors[0]).toContain('CLAUDE_HOOKS_OPENAI_TTS_SPEED')
      expect(validation.errors[1]).toContain('CLAUDE_HOOKS_MACOS_TTS_RATE')
    })

    it('should detect invalid TTS boolean values', () => {
      process.env.CLAUDE_HOOKS_MACOS_TTS_ENABLED = 'maybe'

      const loader = new EnvConfigLoader()
      const validation = loader.validateEnvVars()

      expect(validation.isValid).toBe(false)
      expect(validation.errors).toHaveLength(1)
      expect(validation.errors[0]).toContain('CLAUDE_HOOKS_MACOS_TTS_ENABLED')
    })

    it('should include TTS environment variables in relevant vars check', () => {
      process.env.OPENAI_API_KEY = 'sk-test-key'
      process.env.CLAUDE_HOOKS_TTS_PROVIDER = 'openai'
      process.env.CLAUDE_HOOKS_MACOS_TTS_VOICE = 'Alex'
      process.env.OTHER_VAR = 'ignored'

      const loader = new EnvConfigLoader()
      const relevantVars = loader.getRelevantEnvVars()

      expect(relevantVars.OPENAI_API_KEY).toBe('sk-test-key')
      expect(relevantVars.CLAUDE_HOOKS_TTS_PROVIDER).toBe('openai')
      expect(relevantVars.CLAUDE_HOOKS_MACOS_TTS_VOICE).toBe('Alex')
      expect(relevantVars.OTHER_VAR).toBeUndefined()
    })

    it('should support complete TTS configuration from environment', () => {
      // Set all TTS environment variables
      process.env.CLAUDE_HOOKS_TTS_PROVIDER = 'openai'
      process.env.CLAUDE_HOOKS_TTS_FALLBACK_PROVIDER = 'macos'
      process.env.OPENAI_API_KEY = 'sk-complete-test-key'
      process.env.CLAUDE_HOOKS_OPENAI_TTS_MODEL = 'tts-1'
      process.env.CLAUDE_HOOKS_OPENAI_TTS_VOICE = 'echo'
      process.env.CLAUDE_HOOKS_OPENAI_TTS_SPEED = '0.75'
      process.env.CLAUDE_HOOKS_OPENAI_TTS_FORMAT = 'opus'
      process.env.CLAUDE_HOOKS_MACOS_TTS_VOICE = 'Alex'
      process.env.CLAUDE_HOOKS_MACOS_TTS_RATE = '180'
      process.env.CLAUDE_HOOKS_MACOS_TTS_VOLUME = '0.9'
      process.env.CLAUDE_HOOKS_MACOS_TTS_ENABLED = 'false'

      const loader = new EnvConfigLoader()
      const config = loader.loadFromEnv()

      // Verify complete configuration was loaded
      expect(config.tts?.provider).toBe('openai')
      expect(config.tts?.fallbackProvider).toBe('macos')
      expect(config.tts?.openai?.apiKey).toBe('sk-complete-test-key')
      expect(config.tts?.openai?.model).toBe('tts-1')
      expect(config.tts?.openai?.voice).toBe('echo')
      expect(config.tts?.openai?.speed).toBe(0.75)
      expect(config.tts?.openai?.format).toBe('opus')
      expect(config.tts?.macos?.voice).toBe('Alex')
      expect(config.tts?.macos?.rate).toBe(180)
      expect(config.tts?.macos?.volume).toBe(0.9)
      expect(config.tts?.macos?.enabled).toBe(false)
    })
  })
})

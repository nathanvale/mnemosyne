/* eslint-disable @typescript-eslint/no-explicit-any */
/**
 * Tests for environment variable configuration support
 * Tests loading configuration from environment variables
 */

import { beforeEach, describe, it, expect } from 'vitest'

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
  })

  afterEach(() => {
    // Restore original environment
    process.env = originalEnv
  })

  describe('Basic Environment Variable Loading', () => {
    it('should load boolean configuration from environment variables', () => {
      process.env.CLAUDE_HOOKS_DEBUG = 'true'
      process.env.CLAUDE_HOOKS_NOTIFY = 'false'
      process.env.CLAUDE_HOOKS_SPEAK = '1'

      const loader = new EnvConfigLoader()
      const config = loader.loadFromEnv()

      expect(config.debug).toBe(true)
      expect(config.notify).toBe(false)
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
        notify: false,
        cooldownPeriod: 5000,
      }

      const loader = new EnvConfigLoader()
      const config = loader.loadFromEnv(baseConfig)

      expect(config.debug).toBe(true)
      expect(config.notify).toBe(false)
      expect(config.cooldownPeriod).toBe(5000)
    })

    it('should override base configuration with environment variables', () => {
      process.env.CLAUDE_HOOKS_DEBUG = 'false'
      process.env.CLAUDE_HOOKS_COOLDOWN_PERIOD = '10000'

      const baseConfig = {
        debug: true,
        notify: true,
        cooldownPeriod: 5000,
      }

      const loader = new EnvConfigLoader()
      const config = loader.loadFromEnv(baseConfig)

      expect(config.debug).toBe(false)
      expect(config.notify).toBe(true) // Not overridden
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
      process.env.CLAUDE_HOOKS_NOTIFY = '  false  '

      const loader = new EnvConfigLoader()
      const config = loader.loadFromEnv()

      expect(config.debug).toBe(true)
      expect(config.notify).toBe(false)
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
      process.env.CLAUDE_HOOKS_NOTIFY = 'false'
      process.env.SOME_OTHER_VAR = 'value'

      const loader = new EnvConfigLoader()
      const relevantVars = loader.getRelevantEnvVars()

      expect(relevantVars).toEqual({
        CLAUDE_HOOKS_DEBUG: 'true',
        CLAUDE_HOOKS_NOTIFY: 'false',
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
        notify: true,
        cooldownPeriod: 5000,
      }

      const config = loadConfigFromEnv(baseConfig)

      expect(config.debug).toBe(false) // From env
      expect(config.notify).toBe(true) // From base
      expect(config.cooldownPeriod).toBe(5000) // From base
    })
  })

  describe('Default Mappings', () => {
    it('should include all expected default mappings', () => {
      const expectedEnvVars = [
        'CLAUDE_HOOKS_DEBUG',
        'CLAUDE_HOOKS_NOTIFY',
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
      ]

      const mappedEnvVars = DEFAULT_ENV_MAPPINGS.map((m) => m.envVar)

      expectedEnvVars.forEach((envVar) => {
        expect(mappedEnvVars).toContain(envVar)
      })
    })

    it('should have correct config paths for all default mappings', () => {
      const expectedMappings = [
        { envVar: 'CLAUDE_HOOKS_DEBUG', configPath: 'debug' },
        { envVar: 'CLAUDE_HOOKS_NOTIFY', configPath: 'notify' },
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
})

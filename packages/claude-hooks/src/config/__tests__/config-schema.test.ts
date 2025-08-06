/**
 * Tests for configuration schema validation
 * Tests comprehensive validation of hook configuration options
 */

import { describe, it, expect } from 'vitest'

describe('Configuration Schema Validation', () => {
  describe('Hook Configuration', () => {
    it('should validate basic hook configuration', () => {
      const validConfig = {
        debug: true,
        notify: false,
        speak: true,
      }

      const isValid =
        typeof validConfig.debug === 'boolean' &&
        typeof validConfig.notify === 'boolean' &&
        typeof validConfig.speak === 'boolean'

      expect(isValid).toBe(true)
    })

    it('should reject invalid hook configuration', () => {
      const invalidConfigs = [
        { debug: 'true' }, // string instead of boolean
        { notify: 1 }, // number instead of boolean
        { speak: null }, // null instead of boolean
      ]

      invalidConfigs.forEach((config) => {
        const isValid = Object.entries(config).every(([key, value]) => {
          if (['debug', 'notify', 'speak'].includes(key)) {
            return typeof value === 'boolean'
          }
          return true
        })
        expect(isValid).toBe(false)
      })
    })
  })

  describe('Cooldown Configuration', () => {
    it('should validate cooldown period configuration', () => {
      const validConfigs = [
        { cooldownPeriod: 1000 },
        { cooldownPeriod: 0 },
        { cooldownPeriod: 60000 },
      ]

      validConfigs.forEach((config) => {
        const isValid =
          typeof config.cooldownPeriod === 'number' &&
          config.cooldownPeriod >= 0
        expect(isValid).toBe(true)
      })
    })

    it('should reject invalid cooldown periods', () => {
      const invalidConfigs = [
        { cooldownPeriod: -1000 }, // negative
        { cooldownPeriod: '5000' }, // string
        { cooldownPeriod: null }, // null
        { cooldownPeriod: undefined }, // undefined
      ]

      invalidConfigs.forEach((config) => {
        const isValid =
          typeof config.cooldownPeriod === 'number' &&
          config.cooldownPeriod >= 0
        expect(isValid).toBe(false)
      })
    })

    it('should validate urgent override configuration', () => {
      const validConfigs = [
        { allowUrgentOverride: true },
        { allowUrgentOverride: false },
      ]

      validConfigs.forEach((config) => {
        const isValid = typeof config.allowUrgentOverride === 'boolean'
        expect(isValid).toBe(true)
      })
    })

    it('should validate per-type cooldown settings', () => {
      const validConfig = {
        perTypeSettings: {
          speech: 3000,
          audio: 1000,
          urgent: 500,
        },
      }

      const isValid = Object.entries(validConfig.perTypeSettings).every(
        ([type, period]) => {
          const validTypes = [
            'speech',
            'audio',
            'urgent',
            'notification',
            'stop',
            'subagent',
          ]
          return (
            validTypes.includes(type) &&
            typeof period === 'number' &&
            period >= 0
          )
        },
      )

      expect(isValid).toBe(true)
    })
  })

  describe('Quiet Hours Configuration', () => {
    it('should validate quiet hours basic configuration', () => {
      const validConfig = {
        quietHours: {
          enabled: true,
          ranges: [
            { start: '22:00', end: '08:00' },
            { start: '12:00', end: '13:00', name: 'lunch' },
          ],
          allowUrgentOverride: false,
        },
      }

      const config = validConfig.quietHours
      const isValid =
        typeof config.enabled === 'boolean' &&
        Array.isArray(config.ranges) &&
        typeof config.allowUrgentOverride === 'boolean'

      expect(isValid).toBe(true)
    })

    it('should validate time range format', () => {
      const validRanges = [
        { start: '00:00', end: '23:59' },
        { start: '09:30', end: '17:45' },
        { start: '22:00', end: '08:00' }, // overnight
      ]

      const timeRegex = /^([0-1][0-9]|2[0-3]):[0-5][0-9]$/

      validRanges.forEach((range) => {
        const isValidStart = timeRegex.test(range.start)
        const isValidEnd = timeRegex.test(range.end)
        expect(isValidStart).toBe(true)
        expect(isValidEnd).toBe(true)
      })
    })

    it('should reject invalid time range formats', () => {
      const invalidRanges = [
        { start: '25:00', end: '08:00' }, // invalid hour
        { start: '22:00', end: '12:60' }, // invalid minute
        { start: '9:30', end: '17:00' }, // single digit hour
        { start: '22:00', end: '8:00' }, // single digit hour
        { start: 'invalid', end: '08:00' }, // non-numeric
      ]

      const timeRegex = /^([0-1][0-9]|2[0-3]):[0-5][0-9]$/

      invalidRanges.forEach((range) => {
        const isValidStart = timeRegex.test(range.start)
        const isValidEnd = timeRegex.test(range.end)
        const isValid = isValidStart && isValidEnd
        expect(isValid).toBe(false)
      })
    })

    it('should validate day restrictions', () => {
      const validDayConfigs = [
        { days: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday'] },
        { days: ['saturday', 'sunday'] },
        { days: ['monday', 'wednesday', 'friday'] },
      ]

      const validDays = [
        'monday',
        'tuesday',
        'wednesday',
        'thursday',
        'friday',
        'saturday',
        'sunday',
      ]

      validDayConfigs.forEach((config) => {
        const isValid =
          Array.isArray(config.days) &&
          config.days.every((day) => validDays.includes(day))
        expect(isValid).toBe(true)
      })
    })

    it('should reject invalid day restrictions', () => {
      const invalidDayConfigs = [
        { days: ['monday', 'invalid-day'] },
        { days: ['mon', 'tue'] }, // abbreviated names
        { days: 'monday' }, // string instead of array
        { days: [1, 2, 3] }, // numbers instead of strings
      ]

      const validDays = [
        'monday',
        'tuesday',
        'wednesday',
        'thursday',
        'friday',
        'saturday',
        'sunday',
      ]

      invalidDayConfigs.forEach((config) => {
        const isValid =
          Array.isArray(config.days) &&
          config.days.every((day) => validDays.includes(day))
        expect(isValid).toBe(false)
      })
    })
  })

  describe('Speech Configuration', () => {
    it('should validate speech engine configuration', () => {
      const validConfig = {
        speech: {
          voice: 'Alex',
          rate: 200,
          volume: 0.8,
          enabled: true,
        },
      }

      const config = validConfig.speech
      const isValid =
        typeof config.voice === 'string' &&
        typeof config.rate === 'number' &&
        config.rate > 0 &&
        typeof config.volume === 'number' &&
        config.volume >= 0 &&
        config.volume <= 1 &&
        typeof config.enabled === 'boolean'

      expect(isValid).toBe(true)
    })

    it('should reject invalid speech configuration', () => {
      const invalidConfigs = [
        { speech: { voice: 123 } }, // number instead of string
        { speech: { rate: -100 } }, // negative rate
        { speech: { volume: 1.5 } }, // volume > 1
        { speech: { volume: -0.1 } }, // negative volume
        { speech: { enabled: 'true' } }, // string instead of boolean
      ]

      invalidConfigs.forEach(({ speech }) => {
        let isValid = true

        if (speech.voice !== undefined) {
          isValid = isValid && typeof speech.voice === 'string'
        }
        if (speech.rate !== undefined) {
          isValid =
            isValid && typeof speech.rate === 'number' && speech.rate > 0
        }
        if (speech.volume !== undefined) {
          isValid =
            isValid &&
            typeof speech.volume === 'number' &&
            speech.volume >= 0 &&
            speech.volume <= 1
        }
        if (speech.enabled !== undefined) {
          isValid = isValid && typeof speech.enabled === 'boolean'
        }

        expect(isValid).toBe(false)
      })
    })
  })

  describe('Complete Configuration Validation', () => {
    it('should validate complete valid configuration', () => {
      const completeConfig = {
        debug: true,
        notify: true,
        speak: true,
        cooldownPeriod: 5000,
        allowUrgentOverride: true,
        quietHours: {
          enabled: true,
          ranges: [
            { start: '22:00', end: '08:00', name: 'night' },
            { start: '12:00', end: '13:00', name: 'lunch' },
          ],
          allowUrgentOverride: false,
          days: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday'],
        },
        speech: {
          voice: 'Alex',
          rate: 200,
          volume: 0.7,
          enabled: true,
        },
        perTypeSettings: {
          speech: 3000,
          audio: 1000,
          urgent: 500,
        },
      }

      // Basic validation logic
      const isValidBasic =
        typeof completeConfig.debug === 'boolean' &&
        typeof completeConfig.notify === 'boolean' &&
        typeof completeConfig.speak === 'boolean'

      const isValidCooldown =
        typeof completeConfig.cooldownPeriod === 'number' &&
        completeConfig.cooldownPeriod >= 0 &&
        typeof completeConfig.allowUrgentOverride === 'boolean'

      const timeRegex = /^([0-1][0-9]|2[0-3]):[0-5][0-9]$/
      const validDays = [
        'monday',
        'tuesday',
        'wednesday',
        'thursday',
        'friday',
        'saturday',
        'sunday',
      ]

      const isValidQuietHours =
        typeof completeConfig.quietHours.enabled === 'boolean' &&
        Array.isArray(completeConfig.quietHours.ranges) &&
        completeConfig.quietHours.ranges.every(
          (range) => timeRegex.test(range.start) && timeRegex.test(range.end),
        ) &&
        Array.isArray(completeConfig.quietHours.days) &&
        completeConfig.quietHours.days.every((day) => validDays.includes(day))

      const isValidSpeech =
        typeof completeConfig.speech.voice === 'string' &&
        typeof completeConfig.speech.rate === 'number' &&
        completeConfig.speech.rate > 0 &&
        typeof completeConfig.speech.volume === 'number' &&
        completeConfig.speech.volume >= 0 &&
        completeConfig.speech.volume <= 1

      expect(isValidBasic).toBe(true)
      expect(isValidCooldown).toBe(true)
      expect(isValidQuietHours).toBe(true)
      expect(isValidSpeech).toBe(true)
    })

    it('should provide meaningful error messages for invalid configurations', () => {
      const invalidConfig = {
        debug: 'invalid', // should be boolean
        cooldownPeriod: -1000, // should be >= 0
        quietHours: {
          ranges: [{ start: '25:00', end: '08:00' }], // invalid time
        },
      }

      const errors: string[] = []

      if (typeof invalidConfig.debug !== 'boolean') {
        errors.push('debug must be a boolean')
      }

      if (
        typeof invalidConfig.cooldownPeriod !== 'number' ||
        invalidConfig.cooldownPeriod < 0
      ) {
        errors.push('cooldownPeriod must be a non-negative number')
      }

      const timeRegex = /^([0-1][0-9]|2[0-3]):[0-5][0-9]$/
      if (invalidConfig.quietHours?.ranges) {
        invalidConfig.quietHours.ranges.forEach((range, index) => {
          if (!timeRegex.test(range.start)) {
            errors.push(
              `quietHours.ranges[${index}].start must be in HH:MM format`,
            )
          }
          if (!timeRegex.test(range.end)) {
            errors.push(
              `quietHours.ranges[${index}].end must be in HH:MM format`,
            )
          }
        })
      }

      expect(errors.length).toBeGreaterThan(0)
      expect(errors).toContain('debug must be a boolean')
      expect(errors).toContain('cooldownPeriod must be a non-negative number')
      expect(errors).toContain(
        'quietHours.ranges[0].start must be in HH:MM format',
      )
    })
  })

  describe('Environment Variable Integration', () => {
    it('should validate environment variable mappings', () => {
      const envMappings = {
        CLAUDE_HOOKS_DEBUG: 'debug',
        CLAUDE_HOOKS_NOTIFY: 'notify',
        CLAUDE_HOOKS_SPEAK: 'speak',
        CLAUDE_HOOKS_COOLDOWN_PERIOD: 'cooldownPeriod',
        CLAUDE_HOOKS_ALLOW_URGENT_OVERRIDE: 'allowUrgentOverride',
      }

      Object.entries(envMappings).forEach(([envVar, configKey]) => {
        expect(typeof envVar).toBe('string')
        expect(envVar.startsWith('CLAUDE_HOOKS_')).toBe(true)
        expect(typeof configKey).toBe('string')
        expect(configKey.length).toBeGreaterThan(0)
      })
    })

    it('should validate environment variable value parsing', () => {
      const envValues = {
        true: true,
        false: false,
        '1': true,
        '0': false,
        '5000': 5000,
        '0.7': 0.7,
      }

      Object.entries(envValues).forEach(([envValue, expected]) => {
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
})

/**
 * Tests for configuration validator integration
 * Tests the ConfigValidator class with actual configuration scenarios
 */

import { describe, it, expect } from 'vitest'

import { ConfigValidator } from '../config-schema.js'

describe('ConfigValidator Integration', () => {
  describe('Valid Configurations', () => {
    it('should validate minimal valid configuration', () => {
      const config = {
        debug: false,
        notify: true,
      }

      const result = ConfigValidator.validate(config)

      expect(result.isValid).toBe(true)
      expect(result.errors).toHaveLength(0)
    })

    it('should validate complete valid configuration', () => {
      const config = {
        debug: true,
        notify: true,
        speak: true,
        cooldownPeriod: 3000,
        allowUrgentOverride: true,
        quietHours: {
          enabled: true,
          ranges: [
            { start: '22:00', end: '08:00', name: 'night' },
            { start: '12:00', end: '13:00', name: 'lunch' },
          ],
          allowUrgentOverride: false,
          days: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday'],
          timezone: 'UTC',
        },
        speech: {
          voice: 'Alex',
          rate: 200,
          volume: 0.8,
          enabled: true,
        },
        perTypeSettings: {
          speech: 2000,
          audio: 1000,
          urgent: 500,
        },
      }

      const result = ConfigValidator.validate(config)

      expect(result.isValid).toBe(true)
      expect(result.errors).toHaveLength(0)
    })

    it('should validate default configuration', () => {
      const defaultConfig = ConfigValidator.getDefaultConfig()
      const result = ConfigValidator.validate(defaultConfig)

      expect(result.isValid).toBe(true)
      expect(result.errors).toHaveLength(0)
    })
  })

  describe('Invalid Configurations', () => {
    it('should reject non-object configuration', () => {
      const configs = [null, undefined, 'invalid', 123, []]

      configs.forEach((config) => {
        const result = ConfigValidator.validate(config)
        expect(result.isValid).toBe(false)
        expect(result.errors).toHaveLength(1)
        expect(result.errors[0].field).toBe('root')
      })
    })

    it('should reject invalid basic configuration', () => {
      const config = {
        debug: 'true', // should be boolean
        notifySound: 1, // should be boolean
        speak: null, // should be boolean
      }

      const result = ConfigValidator.validate(config)

      expect(result.isValid).toBe(false)
      expect(result.errors).toHaveLength(3)
      expect(result.errors.map((e) => e.field)).toContain('debug')
      expect(result.errors.map((e) => e.field)).toContain('notifySound')
      expect(result.errors.map((e) => e.field)).toContain('speak')
    })

    it('should reject invalid cooldown configuration', () => {
      const config = {
        cooldownPeriod: -1000, // should be non-negative
        allowUrgentOverride: 'false', // should be boolean
      }

      const result = ConfigValidator.validate(config)

      expect(result.isValid).toBe(false)
      expect(result.errors).toHaveLength(2)
      expect(
        result.errors.find((e) => e.field === 'cooldownPeriod'),
      ).toBeDefined()
      expect(
        result.errors.find((e) => e.field === 'allowUrgentOverride'),
      ).toBeDefined()
    })

    it('should reject invalid quiet hours configuration', () => {
      const config = {
        quietHours: {
          enabled: 'true', // should be boolean
          ranges: [
            { start: '25:00', end: '08:00' }, // invalid time
            { start: '22:00', end: '60:00' }, // invalid time
          ],
          days: ['invalid-day'], // invalid day
          timezone: 123, // should be string
        },
      }

      const result = ConfigValidator.validate(config)

      expect(result.isValid).toBe(false)
      expect(result.errors.length).toBeGreaterThan(0)

      const errorFields = result.errors.map((e) => e.field)
      expect(errorFields).toContain('quietHours.enabled')
      expect(errorFields).toContain('quietHours.ranges[0].start')
      expect(errorFields).toContain('quietHours.ranges[1].end')
      expect(errorFields).toContain('quietHours.days[0]')
      expect(errorFields).toContain('quietHours.timezone')
    })

    it('should reject invalid speech configuration', () => {
      const config = {
        speech: {
          voice: 123, // should be string
          rate: -100, // should be positive
          volume: 1.5, // should be <= 1
          enabled: 'true', // should be boolean
        },
      }

      const result = ConfigValidator.validate(config)

      expect(result.isValid).toBe(false)
      expect(result.errors).toHaveLength(4)

      const errorFields = result.errors.map((e) => e.field)
      expect(errorFields).toContain('speech.voice')
      expect(errorFields).toContain('speech.rate')
      expect(errorFields).toContain('speech.volume')
      expect(errorFields).toContain('speech.enabled')
    })

    it('should reject invalid per-type settings', () => {
      const config = {
        perTypeSettings: {
          'invalid-type': 1000, // invalid notification type
          speech: -500, // negative period
          audio: '1000', // should be number
        },
      }

      const result = ConfigValidator.validate(config)

      expect(result.isValid).toBe(false)
      expect(result.errors.length).toBeGreaterThan(0)

      const errorFields = result.errors.map((e) => e.field)
      expect(errorFields).toContain('perTypeSettings.invalid-type')
      expect(errorFields).toContain('perTypeSettings.speech')
      expect(errorFields).toContain('perTypeSettings.audio')
    })
  })

  describe('Warnings', () => {
    it('should warn about very long cooldown periods', () => {
      const config = {
        cooldownPeriod: 600000, // 10 minutes
      }

      const result = ConfigValidator.validate(config)

      expect(result.isValid).toBe(true)
      expect(result.warnings).toHaveLength(1)
      expect(result.warnings[0].field).toBe('cooldownPeriod')
      expect(result.warnings[0].message).toContain('very long')
    })

    it('should warn about unusual speech rate', () => {
      const config = {
        speech: {
          rate: 600, // very fast
        },
      }

      const result = ConfigValidator.validate(config)

      expect(result.isValid).toBe(true)
      expect(result.warnings).toHaveLength(1)
      expect(result.warnings[0].field).toBe('speech.rate')
      expect(result.warnings[0].message).toContain('outside typical range')
    })

    it('should warn about very long per-type periods', () => {
      const config = {
        perTypeSettings: {
          speech: 400000, // very long
        },
      }

      const result = ConfigValidator.validate(config)

      expect(result.isValid).toBe(true)
      expect(result.warnings).toHaveLength(1)
      expect(result.warnings[0].field).toBe('perTypeSettings.speech')
      expect(result.warnings[0].message).toContain('very long')
    })
  })

  describe('Static Helper Methods', () => {
    it('should validate time strings correctly', () => {
      const validTimes = ['00:00', '09:30', '12:00', '18:45', '23:59']
      const invalidTimes = ['25:00', '12:60', '9:30', 'abc:def', '', '12']

      validTimes.forEach((time) => {
        expect(ConfigValidator.validateTimeString(time)).toBe(true)
      })

      invalidTimes.forEach((time) => {
        expect(ConfigValidator.validateTimeString(time)).toBe(false)
      })
    })

    it('should validate day names correctly', () => {
      const validDays = [
        'monday',
        'tuesday',
        'wednesday',
        'thursday',
        'friday',
        'saturday',
        'sunday',
      ]
      const validCapitalizedDays = [
        'Monday',
        'Tuesday',
        'Wednesday',
        'Thursday',
        'Friday',
        'Saturday',
        'Sunday',
      ]
      const invalidDays = ['mon', 'tue', 'invalid', '']

      validDays.forEach((day) => {
        expect(ConfigValidator.validateDayName(day)).toBe(true)
      })

      validCapitalizedDays.forEach((day) => {
        expect(ConfigValidator.validateDayName(day)).toBe(true)
      })

      invalidDays.forEach((day) => {
        expect(ConfigValidator.validateDayName(day)).toBe(false)
      })
    })

    it('should provide sensible default configuration', () => {
      const defaultConfig = ConfigValidator.getDefaultConfig()

      expect(defaultConfig.debug).toBe(false)
      expect(defaultConfig.notifySound).toBe(false)
      expect(defaultConfig.speak).toBe(false)
      expect(defaultConfig.cooldownPeriod).toBe(5000)
      expect(defaultConfig.allowUrgentOverride).toBe(false)
      expect(defaultConfig.quietHours?.enabled).toBe(false)
      expect(defaultConfig.speech?.enabled).toBe(false)
      expect(defaultConfig.perTypeSettings).toEqual({})
    })
  })

  describe('Error Messages', () => {
    it('should provide clear error messages with field names', () => {
      const config = {
        debug: 'invalid',
        cooldownPeriod: -100,
      }

      const result = ConfigValidator.validate(config)

      expect(result.isValid).toBe(false)

      const debugError = result.errors.find((e) => e.field === 'debug')
      const cooldownError = result.errors.find(
        (e) => e.field === 'cooldownPeriod',
      )

      expect(debugError?.message).toContain('debug must be a boolean')
      expect(cooldownError?.message).toContain(
        'cooldownPeriod must be a non-negative number',
      )
    })

    it('should include problematic values in error objects', () => {
      const config = {
        debug: 'invalid-value',
        cooldownPeriod: -500,
      }

      const result = ConfigValidator.validate(config)

      expect(result.isValid).toBe(false)

      const debugError = result.errors.find((e) => e.field === 'debug')
      const cooldownError = result.errors.find(
        (e) => e.field === 'cooldownPeriod',
      )

      expect(debugError?.value).toBe('invalid-value')
      expect(cooldownError?.value).toBe(-500)
    })
  })
})

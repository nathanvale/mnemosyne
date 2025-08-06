/**
 * Simple tests for QuietHours functionality
 * Tests core quiet hours checking without complex imports
 */

import { describe, it, expect } from 'vitest'

import { QuietHours } from '../quiet-hours.js'

describe('QuietHours - Simple Tests', () => {
  describe('Basic Configuration', () => {
    it('should create QuietHours with default configuration', () => {
      const quietHours = new QuietHours()
      const config = quietHours.getConfig()

      expect(config.enabled).toBe(false)
      expect(config.ranges).toEqual([])
      expect(config.timezone).toBe('local')
      expect(config.allowUrgentOverride).toBe(false)
      expect(config.days.length).toBe(7)
    })

    it('should create QuietHours with custom configuration', () => {
      const config = {
        enabled: true,
        ranges: [{ start: '22:00', end: '08:00' }],
        timezone: 'UTC',
        allowUrgentOverride: true,
      }

      const quietHours = new QuietHours(config)
      const currentConfig = quietHours.getConfig()

      expect(currentConfig.enabled).toBe(true)
      expect(currentConfig.ranges.length).toBe(1)
      expect(currentConfig.timezone).toBe('UTC')
      expect(currentConfig.allowUrgentOverride).toBe(true)
    })

    it('should update configuration', () => {
      const quietHours = new QuietHours()

      quietHours.updateConfig({
        enabled: true,
        ranges: [{ start: '23:00', end: '07:00' }],
      })

      const config = quietHours.getConfig()
      expect(config.enabled).toBe(true)
      expect(config.ranges.length).toBe(1)
      expect(config.ranges[0].start).toBe('23:00')
    })
  })

  describe('Time Validation', () => {
    it('should validate correct time strings', () => {
      const validTimes = ['00:00', '09:30', '12:00', '18:45', '23:59']

      validTimes.forEach((time) => {
        expect(QuietHours.validateTimeString(time)).toBe(true)
      })
    })

    it('should reject invalid time strings', () => {
      const invalidTimes = ['25:00', '12:60', '9:30', 'abc:def', '', '12']

      invalidTimes.forEach((time) => {
        expect(QuietHours.validateTimeString(time)).toBe(false)
      })
    })

    it('should parse valid time strings', () => {
      const result = QuietHours.parseTimeString('14:30')
      expect(result).toEqual({ hours: 14, minutes: 30 })
    })

    it('should return null for invalid time strings', () => {
      const result = QuietHours.parseTimeString('invalid')
      expect(result).toBeNull()
    })
  })

  describe('12-Hour Time Conversion', () => {
    it('should convert 12-hour to 24-hour format', () => {
      const conversions = [
        { input: '9:00 AM', expected: '09:00' },
        { input: '1:30 PM', expected: '13:30' },
        { input: '11:45 PM', expected: '23:45' },
        { input: '12:00 AM', expected: '00:00' },
        { input: '12:00 PM', expected: '12:00' },
      ]

      conversions.forEach(({ input, expected }) => {
        const result = QuietHours.convert12to24Hour(input)
        expect(result).toBe(expected)
      })
    })

    it('should return null for invalid 12-hour format', () => {
      const invalidTimes = ['25:00 AM', '12:60 PM', 'invalid', '']

      invalidTimes.forEach((time) => {
        const result = QuietHours.convert12to24Hour(time)
        expect(result).toBeNull()
      })
    })
  })

  describe('Quiet Time Checking', () => {
    it('should return false when disabled', () => {
      const quietHours = new QuietHours({ enabled: false, ranges: [] })
      const testTime = new Date(2025, 0, 1, 14, 30) // Wednesday 2:30 PM

      const isQuiet = quietHours.isQuietTime(testTime)
      expect(isQuiet).toBe(false)
    })

    it('should return false when no ranges configured', () => {
      const quietHours = new QuietHours({ enabled: true, ranges: [] })
      const testTime = new Date(2025, 0, 1, 14, 30) // Wednesday 2:30 PM

      const isQuiet = quietHours.isQuietTime(testTime)
      expect(isQuiet).toBe(false)
    })

    it('should detect time within quiet hours range', () => {
      const quietHours = new QuietHours({
        enabled: true,
        ranges: [{ start: '13:00', end: '15:00' }],
      })

      const testTime = new Date(2025, 0, 1, 14, 30) // Wednesday 2:30 PM
      const isQuiet = quietHours.isQuietTime(testTime)
      expect(isQuiet).toBe(true)
    })

    it('should detect time outside quiet hours range', () => {
      const quietHours = new QuietHours({
        enabled: true,
        ranges: [{ start: '22:00', end: '08:00' }],
      })

      const testTime = new Date(2025, 0, 1, 14, 30) // Wednesday 2:30 PM
      const isQuiet = quietHours.isQuietTime(testTime)
      expect(isQuiet).toBe(false)
    })

    it('should handle overnight ranges correctly', () => {
      const quietHours = new QuietHours({
        enabled: true,
        ranges: [{ start: '22:00', end: '08:00' }],
      })

      const nightTime = new Date(2025, 0, 1, 23, 30) // Wednesday 11:30 PM
      const morningTime = new Date(2025, 0, 2, 7, 30) // Thursday 7:30 AM
      const dayTime = new Date(2025, 0, 2, 14, 30) // Thursday 2:30 PM

      expect(quietHours.isQuietTime(nightTime)).toBe(true)
      expect(quietHours.isQuietTime(morningTime)).toBe(true)
      expect(quietHours.isQuietTime(dayTime)).toBe(false)
    })

    it('should allow urgent override when configured', () => {
      const quietHours = new QuietHours({
        enabled: true,
        ranges: [{ start: '22:00', end: '08:00' }],
        allowUrgentOverride: true,
      })

      const nightTime = new Date(2025, 0, 1, 23, 30) // Wednesday 11:30 PM

      const regularNotification = quietHours.isQuietTime(nightTime, false)
      const urgentNotification = quietHours.isQuietTime(nightTime, true)

      expect(regularNotification).toBe(true)
      expect(urgentNotification).toBe(false) // Urgent override
    })
  })

  describe('Range Management', () => {
    it('should add valid ranges', () => {
      const quietHours = new QuietHours()

      const success = quietHours.addRange({ start: '22:00', end: '08:00' })
      expect(success).toBe(true)

      const config = quietHours.getConfig()
      expect(config.ranges.length).toBe(1)
    })

    it('should reject invalid ranges', () => {
      const quietHours = new QuietHours()

      const success = quietHours.addRange({ start: 'invalid', end: '08:00' })
      expect(success).toBe(false)

      const config = quietHours.getConfig()
      expect(config.ranges.length).toBe(0)
    })

    it('should remove ranges by index', () => {
      const quietHours = new QuietHours({
        enabled: true,
        ranges: [
          { start: '22:00', end: '08:00', name: 'night' },
          { start: '12:00', end: '13:00', name: 'lunch' },
        ],
      })

      const success = quietHours.removeRange(0)
      expect(success).toBe(true)

      const config = quietHours.getConfig()
      expect(config.ranges.length).toBe(1)
      expect(config.ranges[0].name).toBe('lunch')
    })

    it('should clear all ranges', () => {
      const quietHours = new QuietHours({
        enabled: true,
        ranges: [
          { start: '22:00', end: '08:00' },
          { start: '12:00', end: '13:00' },
        ],
      })

      quietHours.clearRanges()

      const config = quietHours.getConfig()
      expect(config.ranges.length).toBe(0)
    })
  })

  describe('Day Restrictions', () => {
    it('should respect day-of-week restrictions', () => {
      const quietHours = new QuietHours({
        enabled: true,
        ranges: [{ start: '22:00', end: '08:00' }],
        days: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday'], // Weekdays only
      })

      const weekdayNight = new Date(2025, 0, 1, 23, 30) // Wednesday 11:30 PM
      const weekendNight = new Date(2025, 0, 4, 23, 30) // Saturday 11:30 PM

      expect(quietHours.isQuietTime(weekdayNight)).toBe(true)
      expect(quietHours.isQuietTime(weekendNight)).toBe(false)
    })

    it('should work with all days by default', () => {
      const quietHours = new QuietHours({
        enabled: true,
        ranges: [{ start: '22:00', end: '08:00' }],
        // days not specified, should default to all days
      })

      const config = quietHours.getConfig()
      expect(config.days.length).toBe(7)
      expect(config.days).toContain('sunday')
      expect(config.days).toContain('saturday')
    })
  })

  describe('Next End Time', () => {
    it('should return null when not in quiet hours', () => {
      const quietHours = new QuietHours({
        enabled: true,
        ranges: [{ start: '22:00', end: '08:00' }],
      })

      const dayTime = new Date(2025, 0, 1, 14, 30) // Wednesday 2:30 PM
      const nextEnd = quietHours.getNextQuietEndTime(dayTime)
      expect(nextEnd).toBeNull()
    })

    it('should return end time when in quiet hours', () => {
      const quietHours = new QuietHours({
        enabled: true,
        ranges: [{ start: '22:00', end: '08:00' }],
      })

      const nightTime = new Date(2025, 0, 1, 23, 30) // Wednesday 11:30 PM
      const nextEnd = quietHours.getNextQuietEndTime(nightTime)

      expect(nextEnd).toBeDefined()
      expect(nextEnd?.getHours()).toBe(8)
      expect(nextEnd?.getMinutes()).toBe(0)
    })

    it('should return null when disabled', () => {
      const quietHours = new QuietHours({ enabled: false, ranges: [] })
      const testTime = new Date(2025, 0, 1, 23, 30)

      const nextEnd = quietHours.getNextQuietEndTime(testTime)
      expect(nextEnd).toBeNull()
    })
  })
})

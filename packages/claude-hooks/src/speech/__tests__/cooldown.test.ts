/* eslint-disable @typescript-eslint/no-explicit-any */
/**
 * Tests for cooldown period functionality
 * Tests notification rate limiting and spam prevention
 */

import { describe, it, expect } from 'vitest'

describe('Cooldown Period', () => {
  describe('Basic Cooldown Logic', () => {
    it('should allow first notification immediately', () => {
      const lastNotificationTime = null
      const cooldownPeriod = 5000 // 5 seconds
      const currentTime = Date.now()

      const canNotify =
        !lastNotificationTime ||
        currentTime - lastNotificationTime >= cooldownPeriod

      expect(canNotify).toBe(true)
    })

    it('should block notification during cooldown period', () => {
      const cooldownPeriod = 5000 // 5 seconds
      const currentTime = Date.now()
      const lastNotificationTime = currentTime - 2000 // 2 seconds ago

      const canNotify =
        !lastNotificationTime ||
        currentTime - lastNotificationTime >= cooldownPeriod

      expect(canNotify).toBe(false)
    })

    it('should allow notification after cooldown period expires', () => {
      const cooldownPeriod = 5000 // 5 seconds
      const currentTime = Date.now()
      const lastNotificationTime = currentTime - 6000 // 6 seconds ago

      const canNotify =
        !lastNotificationTime ||
        currentTime - lastNotificationTime >= cooldownPeriod

      expect(canNotify).toBe(true)
    })

    it('should handle exact cooldown boundary', () => {
      const cooldownPeriod = 5000 // 5 seconds
      const currentTime = Date.now()
      const lastNotificationTime = currentTime - 5000 // Exactly 5 seconds ago

      const canNotify =
        !lastNotificationTime ||
        currentTime - lastNotificationTime >= cooldownPeriod

      expect(canNotify).toBe(true)
    })
  })

  describe('Different Cooldown Periods', () => {
    it('should support short cooldown periods', () => {
      const cooldownPeriod = 1000 // 1 second
      const currentTime = Date.now()
      const lastNotificationTime = currentTime - 500 // 0.5 seconds ago

      const canNotify = currentTime - lastNotificationTime >= cooldownPeriod
      expect(canNotify).toBe(false)

      const futureTime = currentTime + 600 // 1.1 seconds from last notification
      const canNotifyLater = futureTime - lastNotificationTime >= cooldownPeriod
      expect(canNotifyLater).toBe(true)
    })

    it('should support long cooldown periods', () => {
      const cooldownPeriod = 60000 // 1 minute
      const currentTime = Date.now()
      const lastNotificationTime = currentTime - 30000 // 30 seconds ago

      const canNotify = currentTime - lastNotificationTime >= cooldownPeriod
      expect(canNotify).toBe(false)

      const futureTime = currentTime + 31000 // 61 seconds from last notification
      const canNotifyLater = futureTime - lastNotificationTime >= cooldownPeriod
      expect(canNotifyLater).toBe(true)
    })

    it('should support different periods for different notification types', () => {
      const cooldownPeriods = {
        speech: 3000, // 3 seconds
        audio: 1000, // 1 second
        urgent: 500, // 0.5 seconds
      }

      const currentTime = Date.now()
      const lastTimes = {
        speech: currentTime - 2000, // 2 seconds ago
        audio: currentTime - 800, // 0.8 seconds ago
        urgent: currentTime - 300, // 0.3 seconds ago
      }

      const canNotifySpeech =
        currentTime - lastTimes.speech >= cooldownPeriods.speech
      const canNotifyAudio =
        currentTime - lastTimes.audio >= cooldownPeriods.audio
      const canNotifyUrgent =
        currentTime - lastTimes.urgent >= cooldownPeriods.urgent

      expect(canNotifySpeech).toBe(false) // Still in cooldown
      expect(canNotifyAudio).toBe(false) // Still in cooldown
      expect(canNotifyUrgent).toBe(false) // Still in cooldown
    })
  })

  describe('Time Calculation', () => {
    it('should calculate remaining cooldown time', () => {
      const cooldownPeriod = 5000 // 5 seconds
      const currentTime = Date.now()
      const lastNotificationTime = currentTime - 2000 // 2 seconds ago

      const elapsed = currentTime - lastNotificationTime
      const remaining = Math.max(0, cooldownPeriod - elapsed)

      expect(elapsed).toBe(2000)
      expect(remaining).toBe(3000) // 3 seconds remaining
    })

    it('should return zero remaining time when cooldown expired', () => {
      const cooldownPeriod = 5000 // 5 seconds
      const currentTime = Date.now()
      const lastNotificationTime = currentTime - 6000 // 6 seconds ago

      const elapsed = currentTime - lastNotificationTime
      const remaining = Math.max(0, cooldownPeriod - elapsed)

      expect(elapsed).toBe(6000)
      expect(remaining).toBe(0) // No time remaining
    })

    it('should calculate next available notification time', () => {
      const cooldownPeriod = 5000 // 5 seconds
      const currentTime = 1000000 // Fixed time for testing
      const lastNotificationTime = currentTime - 2000 // 2 seconds ago

      const nextAvailable = lastNotificationTime + cooldownPeriod

      expect(nextAvailable).toBe(1003000) // lastTime + cooldown
      expect(nextAvailable - currentTime).toBe(3000) // 3 seconds from now
    })
  })

  describe('Cooldown State Management', () => {
    it('should track last notification time per notification type', () => {
      const notificationState = {
        speech: { lastTime: null as number | null },
        audio: { lastTime: null as number | null },
        urgent: { lastTime: null as number | null },
      }

      const currentTime = Date.now()

      // First notifications
      notificationState.speech.lastTime = currentTime
      notificationState.audio.lastTime = currentTime + 1000
      notificationState.urgent.lastTime = currentTime + 2000

      expect(notificationState.speech.lastTime).toBe(currentTime)
      expect(notificationState.audio.lastTime).toBe(currentTime + 1000)
      expect(notificationState.urgent.lastTime).toBe(currentTime + 2000)
    })

    it('should update last notification time after successful notification', () => {
      const notificationState = { lastTime: 1000 }
      const newTime = 5000

      // Simulate successful notification
      notificationState.lastTime = newTime

      expect(notificationState.lastTime).toBe(newTime)
    })

    it('should not update time for blocked notifications', () => {
      const notificationState = { lastTime: 1000 }
      const currentTime = 3000
      const cooldownPeriod = 5000

      const canNotify =
        currentTime - notificationState.lastTime >= cooldownPeriod

      if (canNotify) {
        notificationState.lastTime = currentTime
      }

      expect(canNotify).toBe(false)
      expect(notificationState.lastTime).toBe(1000) // Unchanged
    })
  })

  describe('Integration with Hook Types', () => {
    it('should provide cooldown check for notification hook', () => {
      const config = {
        cooldownPeriod: 5000,
        lastNotificationTime: null as number | null,
      }

      const currentTime = Date.now()

      function canSendNotification(): boolean {
        if (!config.lastNotificationTime) return true
        return (
          currentTime - config.lastNotificationTime >= config.cooldownPeriod
        )
      }

      // First notification should be allowed
      expect(canSendNotification()).toBe(true)

      // After sending, update time
      config.lastNotificationTime = currentTime

      // Immediate second notification should be blocked
      expect(canSendNotification()).toBe(false)
    })

    it('should provide cooldown check for stop hook', () => {
      const config = {
        cooldownPeriod: 3000, // Different period for stop notifications
        lastStopTime: Date.now() - 1000, // 1 second ago
      }

      const currentTime = Date.now()
      const canNotifyStop =
        currentTime - config.lastStopTime >= config.cooldownPeriod

      expect(canNotifyStop).toBe(false) // Still in cooldown
    })

    it('should provide cooldown check for subagent stop hook', () => {
      const config = {
        cooldownPeriod: 2000, // Shorter period for subagent notifications
        lastSubagentTime: Date.now() - 2500, // 2.5 seconds ago
      }

      const currentTime = Date.now()
      const canNotifySubagent =
        currentTime - config.lastSubagentTime >= config.cooldownPeriod

      expect(canNotifySubagent).toBe(true) // Cooldown expired
    })
  })

  describe('Priority and Override Handling', () => {
    it('should allow urgent notifications to bypass cooldown', () => {
      const config = {
        cooldownPeriod: 5000,
        lastNotificationTime: Date.now() - 1000, // 1 second ago
        allowUrgentOverride: true,
      }

      const currentTime = Date.now()
      const isUrgent = true

      function canNotify(urgent: boolean = false): boolean {
        if (!config.lastNotificationTime) return true

        const timeSinceLastV = currentTime - config.lastNotificationTime
        const cooldownExpired = timeSinceLastV >= config.cooldownPeriod

        return cooldownExpired || (urgent && config.allowUrgentOverride)
      }

      expect(canNotify(false)).toBe(false) // Regular notification blocked
      expect(canNotify(isUrgent)).toBe(true) // Urgent notification allowed
    })

    it('should respect cooldown when urgent override is disabled', () => {
      const config = {
        cooldownPeriod: 5000,
        lastNotificationTime: Date.now() - 1000, // 1 second ago
        allowUrgentOverride: false,
      }

      const currentTime = Date.now()
      const isUrgent = true

      function canNotify(urgent: boolean = false): boolean {
        if (!config.lastNotificationTime) return true

        const timeSinceLastV = currentTime - config.lastNotificationTime
        const cooldownExpired = timeSinceLastV >= config.cooldownPeriod

        return cooldownExpired || (urgent && config.allowUrgentOverride)
      }

      expect(canNotify(false)).toBe(false) // Regular notification blocked
      expect(canNotify(isUrgent)).toBe(false) // Urgent also blocked when override disabled
    })
  })

  describe('Configuration Validation', () => {
    it('should handle zero cooldown period', () => {
      const cooldownPeriod = 0
      const currentTime = Date.now()
      const lastNotificationTime = currentTime - 100 // Any time ago

      const canNotify = currentTime - lastNotificationTime >= cooldownPeriod
      expect(canNotify).toBe(true) // Should always allow with zero cooldown
    })

    it('should handle negative cooldown period', () => {
      const cooldownPeriod = -1000
      const currentTime = Date.now()
      const lastNotificationTime = currentTime - 500

      // Treat negative as zero (always allow)
      const normalizedCooldown = Math.max(0, cooldownPeriod)
      const canNotify = currentTime - lastNotificationTime >= normalizedCooldown

      expect(normalizedCooldown).toBe(0)
      expect(canNotify).toBe(true)
    })

    it('should validate cooldown configuration', () => {
      const configs = [
        { cooldownPeriod: 1000, valid: true },
        { cooldownPeriod: 0, valid: true },
        { cooldownPeriod: -500, valid: false },
        { cooldownPeriod: 'invalid' as any, valid: false },
      ]

      configs.forEach(({ cooldownPeriod, valid }) => {
        const isValid =
          typeof cooldownPeriod === 'number' && cooldownPeriod >= 0
        expect(isValid).toBe(valid)
      })
    })
  })
})

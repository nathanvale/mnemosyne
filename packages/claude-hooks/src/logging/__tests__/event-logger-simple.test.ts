import { describe, expect, it } from 'vitest'

import type { ClaudeEvent } from '../../types/claude.js'

import { EventLogger } from '../event-logger.js'

describe('EventLogger - Simple Tests', () => {
  describe('Constructor', () => {
    it('should create logger with default configuration', () => {
      const logger = new EventLogger()
      expect(logger).toBeInstanceOf(EventLogger)
    })

    it('should create logger with custom configuration', () => {
      const logger = new EventLogger({
        logDir: '/tmp/test-logs',
        maxFileSize: 1024,
        retentionDays: 30,
      })
      expect(logger).toBeInstanceOf(EventLogger)
    })

    it('should create logger with local directory option', () => {
      const logger = new EventLogger({ useLocalDir: true })
      expect(logger).toBeInstanceOf(EventLogger)
    })
  })

  describe('Event Logging', () => {
    it('should handle logging without throwing errors', async () => {
      const logger = new EventLogger({ logDir: '/tmp/test-event-logger' })
      const event: ClaudeEvent = {
        type: 'Stop',
        data: { success: true },
      }

      // Should not throw even if directory creation fails
      await expect(logger.logEvent(event)).resolves.toBeUndefined()
    })

    it('should handle different event types', async () => {
      const logger = new EventLogger({ logDir: '/tmp/test-event-logger' })

      const events: ClaudeEvent[] = [
        { type: 'Stop', data: { success: true } },
        { type: 'Notification', data: { level: 'info', message: 'Test' } },
        { type: 'SubagentStop', data: { subagentId: '123' } },
        { type: 'PostToolUse', data: { tool: 'Write', success: true } },
      ]

      // Should handle all event types without throwing
      for (const event of events) {
        await expect(logger.logEvent(event)).resolves.toBeUndefined()
      }
    })

    it('should handle metadata in events', async () => {
      const logger = new EventLogger({ logDir: '/tmp/test-event-logger' })
      const event: ClaudeEvent = {
        type: 'Stop',
        data: { success: true },
      }
      const metadata = { userId: 'test', sessionId: 'session123' }

      await expect(logger.logEvent(event, metadata)).resolves.toBeUndefined()
    })
  })

  describe('Log Reading', () => {
    it('should handle reading non-existent files gracefully', async () => {
      const logger = new EventLogger({ logDir: '/tmp/test-event-logger' })

      const result = await logger.readEvents('2025-01-01')
      expect(result).toEqual([])
    })

    it('should handle reading with filter options', async () => {
      const logger = new EventLogger({ logDir: '/tmp/test-event-logger' })

      const result = await logger.readEvents('2025-01-01', { type: 'Stop' })
      expect(result).toEqual([])
    })
  })

  describe('Log Cleanup', () => {
    it('should handle cleanup gracefully', async () => {
      const logger = new EventLogger({
        logDir: '/tmp/test-event-logger',
        retentionDays: 7,
      })

      await expect(logger.cleanupOldLogs()).resolves.toBeUndefined()
    })

    it('should skip cleanup when no retention policy', async () => {
      const logger = new EventLogger({ logDir: '/tmp/test-event-logger' })

      await expect(logger.cleanupOldLogs()).resolves.toBeUndefined()
    })
  })

  describe('Error Handling', () => {
    it('should handle invalid event gracefully', async () => {
      const logger = new EventLogger({ logDir: '/tmp/test-event-logger' })
      const invalidEvent = {
        type: 'InvalidType',
        data: {},
      } as unknown as ClaudeEvent

      await expect(logger.logEvent(invalidEvent)).resolves.toBeUndefined()
    })

    it('should handle concurrent logging', async () => {
      const logger = new EventLogger({ logDir: '/tmp/test-event-logger' })
      const events = Array(10)
        .fill(null)
        .map((_, i) => ({
          type: 'Stop' as const,
          data: { index: i },
        }))

      const promises = events.map((event) => logger.logEvent(event))
      await expect(Promise.all(promises)).resolves.toBeDefined()
    })
  })
})

// Mock fs and os modules first
import { vi } from 'vitest'

vi.mock('node:fs', () => {
  const mockMkdir = vi.fn().mockResolvedValue(undefined)
  const mockWriteFile = vi.fn().mockResolvedValue(undefined)
  const mockReadFile = vi.fn().mockResolvedValue(Buffer.from(''))
  const mockReaddir = vi.fn().mockResolvedValue([] as string[])
  const mockUnlink = vi.fn().mockResolvedValue(undefined)
  const mockStat = vi.fn().mockResolvedValue({
    isDirectory: () => true,
    isFile: () => false,
    size: 0,
    mtime: new Date(),
  })

  return {
    default: {
      promises: {
        mkdir: mockMkdir,
        writeFile: mockWriteFile,
        readFile: mockReadFile,
        readdir: mockReaddir,
        unlink: mockUnlink,
        stat: mockStat,
      },
    },
    promises: {
      mkdir: mockMkdir,
      writeFile: mockWriteFile,
      readFile: mockReadFile,
      readdir: mockReaddir,
      unlink: mockUnlink,
      stat: mockStat,
    },
  }
})

vi.mock('node:os', () => {
  const mockHomedir = vi.fn().mockReturnValue('/home/user')
  return {
    homedir: mockHomedir,
    default: {
      homedir: mockHomedir,
    },
  }
})

import type { Stats } from 'node:fs'

import { promises as fs } from 'node:fs'
import {
  describe,
  expect,
  it,
  beforeEach,
  afterEach,
  type MockedFunction,
} from 'vitest'

import type { ClaudeEvent } from '../../types/claude'

import { EventLogger } from '../event-logger'

describe('EventLogger', () => {
  let mockMkdir: MockedFunction<typeof fs.mkdir>
  let mockWriteFile: MockedFunction<typeof fs.writeFile>
  let mockReadFile: MockedFunction<typeof fs.readFile>
  let mockReaddir: MockedFunction<typeof fs.readdir>
  let mockUnlink: MockedFunction<typeof fs.unlink>
  let mockStat: MockedFunction<typeof fs.stat>
  let originalCwd: string

  beforeEach(() => {
    vi.clearAllMocks()
    originalCwd = process.cwd()

    // Set up mocked functions
    mockMkdir = vi.mocked(fs.mkdir)
    mockWriteFile = vi.mocked(fs.writeFile)
    mockReadFile = vi.mocked(fs.readFile)
    mockReaddir = vi.mocked(fs.readdir)
    mockUnlink = vi.mocked(fs.unlink)
    mockStat = vi.mocked(fs.stat)

    // Default mock implementations
    mockMkdir.mockResolvedValue(undefined)
    mockWriteFile.mockResolvedValue(undefined)
    mockReadFile.mockResolvedValue('')
    mockReaddir.mockResolvedValue([])
    mockUnlink.mockResolvedValue(undefined)
    mockStat.mockResolvedValue({
      isDirectory: () => true,
      isFile: () => false,
      size: 0,
      mtime: new Date(),
    } as Stats)
  })

  afterEach(() => {
    process.chdir(originalCwd)
  })

  describe('Constructor', () => {
    it('should create logger with default global directory', () => {
      const logger = new EventLogger()
      expect(logger).toBeInstanceOf(EventLogger)
    })

    it('should create logger with local directory', () => {
      const logger = new EventLogger({ useLocalDir: true })
      expect(logger).toBeInstanceOf(EventLogger)
    })

    it('should create logger with custom log directory', () => {
      const logger = new EventLogger({ logDir: '/custom/logs' })
      expect(logger).toBeInstanceOf(EventLogger)
    })
  })

  describe('Log Directory Creation', () => {
    it('should create global log directory on first log', async () => {
      const logger = new EventLogger()
      const event: ClaudeEvent = {
        type: 'Stop',
        data: { success: true },
      }

      await logger.logEvent(event)

      expect(mockMkdir).toHaveBeenCalledWith(
        expect.stringContaining('/.claude/logs/events'),
        { recursive: true },
      )
    })

    it('should create local log directory when configured', async () => {
      // Mock process.cwd to return a test directory
      const mockCwd = vi.spyOn(process, 'cwd').mockReturnValue('/project')

      const logger = new EventLogger({ useLocalDir: true })
      const event: ClaudeEvent = {
        type: 'Notification',
        data: { level: 'info', message: 'Test' },
      }

      await logger.logEvent(event)

      expect(mockMkdir).toHaveBeenCalledWith('/project/.claude/logs/events', {
        recursive: true,
      })

      mockCwd.mockRestore()
    })

    it('should handle directory creation errors gracefully', async () => {
      mockMkdir.mockRejectedValue(new Error('Permission denied'))
      const logger = new EventLogger()
      const event: ClaudeEvent = {
        type: 'Stop',
      }

      // Should not throw
      await expect(logger.logEvent(event)).resolves.toBeUndefined()
    })
  })

  describe('Event Logging', () => {
    it('should log event with timestamp and formatted JSON', async () => {
      const logger = new EventLogger()
      const event: ClaudeEvent = {
        type: 'Stop',
        data: { success: true, task: 'Test task' },
        transcript_path: '/tmp/transcript.md',
      }

      const mockDate = new Date('2025-08-05T10:30:00.000Z')
      vi.setSystemTime(mockDate)

      await logger.logEvent(event)

      expect(mockWriteFile).toHaveBeenCalledWith(
        expect.stringContaining('events/2025-08-05.jsonl'),
        expect.stringContaining(
          `${JSON.stringify({
            timestamp: mockDate.toISOString(),
            event,
          })}\n`,
        ),
        { flag: 'a' },
      )

      vi.useRealTimers()
    })

    it('should append to existing log file', async () => {
      const logger = new EventLogger()

      // First event
      await logger.logEvent({ type: 'Stop', data: { success: true } })

      // Second event
      await logger.logEvent({ type: 'Notification', data: { level: 'info' } })

      expect(mockWriteFile).toHaveBeenCalledTimes(2)
      expect(mockWriteFile).toHaveBeenCalledWith(
        expect.any(String),
        expect.any(String),
        { flag: 'a' }, // Append flag
      )
    })

    it('should handle different event types', async () => {
      const logger = new EventLogger()

      const events: ClaudeEvent[] = [
        { type: 'Stop', data: { success: true } },
        { type: 'Notification', data: { level: 'warning', message: 'Test' } },
        {
          type: 'SubagentStop',
          data: { subagentId: '123', subagentType: 'test' },
        },
        { type: 'PostToolUse', data: { tool: 'Write', success: true } },
      ]

      for (const event of events) {
        await logger.logEvent(event)
      }

      expect(mockWriteFile).toHaveBeenCalledTimes(4)
    })

    it('should include metadata in logged events', async () => {
      const logger = new EventLogger()
      const metadata = { userId: 'test-user', sessionId: 'abc123' }

      const event: ClaudeEvent = {
        type: 'Stop',
        data: { success: true },
      }

      await logger.logEvent(event, metadata)

      expect(mockWriteFile).toHaveBeenCalledWith(
        expect.any(String),
        expect.stringContaining(
          '"metadata":{"userId":"test-user","sessionId":"abc123"}',
        ),
        { flag: 'a' },
      )
    })
  })

  describe('Log Rotation', () => {
    it('should rotate logs when size limit is reached', async () => {
      const logger = new EventLogger({ maxFileSize: 100 }) // 100 bytes limit

      // Mock file size check
      mockStat.mockResolvedValue({
        isFile: () => true,
        size: 150, // Over limit
        mtime: new Date(),
      } as Stats)

      await logger.logEvent({ type: 'Stop' })

      // Should create a rotated file
      expect(mockWriteFile).toHaveBeenCalledWith(
        expect.stringMatching(/events\/2\d{3}-\d{2}-\d{2}\.jsonl$/),
        expect.any(String),
        { flag: 'a' },
      )
    })

    it('should clean up old log files based on retention policy', async () => {
      const logger = new EventLogger({ retentionDays: 7 })

      const oldDate = new Date()
      oldDate.setDate(oldDate.getDate() - 10) // 10 days old

      mockReaddir.mockResolvedValue([
        '2025-01-01.jsonl', // Old file
        '2025-08-01.jsonl', // Recent file
      ] as never)

      mockStat.mockImplementation((filePath: string | Buffer | URL) => {
        if (filePath.toString().includes('2025-01-01')) {
          return Promise.resolve({
            isFile: () => true,
            mtime: oldDate,
          } as Stats)
        }
        return Promise.resolve({
          isFile: () => true,
          mtime: new Date(),
        } as Stats)
      })

      await logger.cleanupOldLogs()

      expect(mockUnlink).toHaveBeenCalledWith(
        expect.stringContaining('2025-01-01.jsonl'),
      )
      expect(mockUnlink).not.toHaveBeenCalledWith(
        expect.stringContaining('2025-08-01.jsonl'),
      )
    })
  })

  describe('Log Reading', () => {
    it('should read events from a specific date', async () => {
      const logger = new EventLogger()
      const events = [
        { timestamp: '2025-08-05T10:00:00Z', event: { type: 'Stop' } },
        { timestamp: '2025-08-05T11:00:00Z', event: { type: 'Notification' } },
      ]

      mockReadFile.mockResolvedValue(
        events.map((e) => JSON.stringify(e)).join('\n'),
      )

      const result = await logger.readEvents('2025-08-05')

      expect(result).toHaveLength(2)
      expect(result[0]).toEqual(events[0])
      expect(result[1]).toEqual(events[1])
    })

    it('should filter events by type', async () => {
      const logger = new EventLogger()
      const events = [
        { timestamp: '2025-08-05T10:00:00Z', event: { type: 'Stop' } },
        { timestamp: '2025-08-05T11:00:00Z', event: { type: 'Notification' } },
        { timestamp: '2025-08-05T12:00:00Z', event: { type: 'Stop' } },
      ]

      mockReadFile.mockResolvedValue(
        events.map((e) => JSON.stringify(e)).join('\n'),
      )

      const result = await logger.readEvents('2025-08-05', { type: 'Stop' })

      expect(result).toHaveLength(2)
      expect(result.every((e) => e.event.type === 'Stop')).toBe(true)
    })

    it('should handle malformed log entries gracefully', async () => {
      const logger = new EventLogger()
      const logContent = [
        JSON.stringify({
          timestamp: '2025-08-05T10:00:00Z',
          event: { type: 'Stop' },
        }),
        'invalid json',
        JSON.stringify({
          timestamp: '2025-08-05T11:00:00Z',
          event: { type: 'Notification' },
        }),
      ].join('\n')

      mockReadFile.mockResolvedValue(logContent)

      const result = await logger.readEvents('2025-08-05')

      expect(result).toHaveLength(2) // Should skip invalid entry
    })

    it('should return empty array for non-existent log files', async () => {
      const logger = new EventLogger()
      mockReadFile.mockRejectedValue(new Error('ENOENT'))

      const result = await logger.readEvents('2025-08-05')

      expect(result).toEqual([])
    })
  })

  describe('Error Handling', () => {
    it('should not throw on write errors', async () => {
      const logger = new EventLogger()
      mockWriteFile.mockRejectedValue(new Error('Write failed'))

      await expect(logger.logEvent({ type: 'Stop' })).resolves.toBeUndefined()
    })

    it('should handle concurrent writes', async () => {
      const logger = new EventLogger()
      const events = Array(10)
        .fill(null)
        .map((_, i) => ({
          type: 'Stop' as const,
          data: { index: i },
        }))

      // Log all events concurrently
      await Promise.all(events.map((e) => logger.logEvent(e)))

      expect(mockWriteFile).toHaveBeenCalledTimes(10)
    })

    it('should handle invalid event types gracefully', async () => {
      const logger = new EventLogger()
      const invalidEvent = {
        type: 'InvalidType',
        data: {},
      } as unknown as ClaudeEvent

      await expect(logger.logEvent(invalidEvent)).resolves.toBeUndefined()
    })
  })

  describe('Performance', () => {
    it('should handle high-frequency logging', async () => {
      const logger = new EventLogger()
      const startTime = Date.now()

      // Log 100 events rapidly
      const promises = Array(100)
        .fill(null)
        .map((_, i) => logger.logEvent({ type: 'Stop', data: { index: i } }))

      await Promise.all(promises)
      const duration = Date.now() - startTime

      expect(mockWriteFile).toHaveBeenCalledTimes(100)
      expect(duration).toBeLessThan(1000) // Should complete within 1 second
    })
  })
})

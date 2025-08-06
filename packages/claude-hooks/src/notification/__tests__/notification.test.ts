/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest'

import type { ClaudeNotificationEvent } from '../../types/claude.js'

import { NotificationHook } from '../notification.js'

// Mock dependencies
vi.mock('../../audio/audio-player.js')
vi.mock('../../audio/platform.js', () => ({
  detectPlatform: vi.fn().mockReturnValue('darwin'),
  Platform: {
    macOS: 'darwin',
    Windows: 'win32',
    Linux: 'linux',
    Unsupported: 'unsupported',
  },
}))

// Mock process.stdin
const mockStdin = {
  isTTY: false,
  setEncoding: vi.fn(),
  on: vi.fn(),
  removeAllListeners: vi.fn(),
  [Symbol.asyncIterator]: vi.fn(),
}

// Mock process.exit
const mockExit = vi.spyOn(process, 'exit').mockImplementation(() => {
  throw new Error('process.exit')
})

describe('NotificationHook', () => {
  let originalStdin: typeof process.stdin

  beforeEach(() => {
    vi.clearAllMocks()
    originalStdin = process.stdin
    Object.defineProperty(process, 'stdin', {
      value: mockStdin,
      writable: true,
      configurable: true,
    })
  })

  afterEach(() => {
    Object.defineProperty(process, 'stdin', {
      value: originalStdin,
      writable: true,
      configurable: true,
    })
  })

  describe('Constructor', () => {
    it('should create instance with default config', () => {
      const hook = new NotificationHook()
      expect(hook).toBeInstanceOf(NotificationHook)
    })

    it('should create instance with custom config', () => {
      const hook = new NotificationHook({ notify: true, debug: true })
      expect(hook).toBeInstanceOf(NotificationHook)
    })
  })

  describe('Event Handling', () => {
    it('should play notification sound when notify is enabled', async () => {
      const { AudioPlayer } = await import('../../audio/audio-player.js')
      const mockPlaySound = vi.fn().mockResolvedValue(true)
      vi.mocked(AudioPlayer).mockImplementation(() => ({
        playSound: mockPlaySound,
        getSystemSounds: vi.fn().mockReturnValue({
          success: '/System/Library/Sounds/Glass.aiff',
          error: '/System/Library/Sounds/Sosumi.aiff',
          notification: '/System/Library/Sounds/Ping.aiff',
        }),
      }))

      const event: ClaudeNotificationEvent = {
        type: 'Notification',
        timestamp: new Date().toISOString(),
        data: {
          message: 'Test notification',
          priority: 'medium',
        },
      }

      // Set up stdin mock
      mockStdin[Symbol.asyncIterator] = vi
        .fn()
        .mockImplementation(async function* () {
          yield Buffer.from(JSON.stringify(event))
        })

      const hook = new NotificationHook({ notify: true })

      try {
        await hook.run()
      } catch (error: any) {
        expect(error.message).toBe('process.exit')
      }

      expect(mockPlaySound).toHaveBeenCalledWith(
        '/System/Library/Sounds/Ping.aiff',
        'darwin',
      )
      expect(mockExit).toHaveBeenCalledWith(0)
    })

    it('should not play sound when notify is disabled', async () => {
      const { AudioPlayer } = await import('../../audio/audio-player.js')
      const mockPlaySound = vi.fn()
      vi.mocked(AudioPlayer).mockImplementation(() => ({
        playSound: mockPlaySound,
        getSystemSounds: vi.fn(),
      }))

      const event: ClaudeNotificationEvent = {
        type: 'Notification',
        timestamp: new Date().toISOString(),
        data: {
          message: 'Test notification',
        },
      }

      mockStdin[Symbol.asyncIterator] = vi
        .fn()
        .mockImplementation(async function* () {
          yield Buffer.from(JSON.stringify(event))
        })

      const hook = new NotificationHook({ notify: false })

      try {
        await hook.run()
      } catch (error: any) {
        expect(error.message).toBe('process.exit')
      }

      expect(mockPlaySound).not.toHaveBeenCalled()
      expect(mockExit).toHaveBeenCalledWith(0)
    })

    it('should use appropriate sound based on priority', async () => {
      const { AudioPlayer } = await import('../../audio/audio-player.js')
      const mockPlaySound = vi.fn().mockResolvedValue(true)
      const mockGetSystemSounds = vi.fn().mockReturnValue({
        success: '/System/Library/Sounds/Glass.aiff',
        error: '/System/Library/Sounds/Sosumi.aiff',
        notification: '/System/Library/Sounds/Ping.aiff',
      })

      vi.mocked(AudioPlayer).mockImplementation(() => ({
        playSound: mockPlaySound,
        getSystemSounds: mockGetSystemSounds,
      }))

      // Test high priority
      const highPriorityEvent: ClaudeNotificationEvent = {
        type: 'Notification',
        timestamp: new Date().toISOString(),
        data: {
          message: 'Important notification',
          priority: 'high',
        },
      }

      mockStdin[Symbol.asyncIterator] = vi
        .fn()
        .mockImplementation(async function* () {
          yield Buffer.from(JSON.stringify(highPriorityEvent))
        })

      const hook = new NotificationHook({ notify: true })

      try {
        await hook.run()
      } catch (error: any) {
        expect(error.message).toBe('process.exit')
      }

      expect(mockPlaySound).toHaveBeenCalledWith(
        '/System/Library/Sounds/Sosumi.aiff',
        'darwin',
      )
    })

    it('should handle events without data gracefully', async () => {
      const event: ClaudeNotificationEvent = {
        type: 'Notification',
        timestamp: new Date().toISOString(),
      }

      mockStdin[Symbol.asyncIterator] = vi
        .fn()
        .mockImplementation(async function* () {
          yield Buffer.from(JSON.stringify(event))
        })

      const hook = new NotificationHook({ notify: true })

      try {
        await hook.run()
      } catch (error: any) {
        expect(error.message).toBe('process.exit')
      }

      expect(mockExit).toHaveBeenCalledWith(0)
    })

    it('should log notification details in debug mode', async () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

      const event: ClaudeNotificationEvent = {
        type: 'Notification',
        timestamp: new Date().toISOString(),
        data: {
          message: 'Debug test',
          priority: 'low',
        },
      }

      mockStdin[Symbol.asyncIterator] = vi
        .fn()
        .mockImplementation(async function* () {
          yield Buffer.from(JSON.stringify(event))
        })

      const hook = new NotificationHook({ notify: false, debug: true })

      try {
        await hook.run()
      } catch (error: any) {
        expect(error.message).toBe('process.exit')
      }

      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('Notification received'),
      )

      consoleSpy.mockRestore()
    })
  })

  describe('Platform Support', () => {
    it('should work on Windows', async () => {
      const { detectPlatform } = await import('../../audio/platform.js')
      vi.mocked(detectPlatform).mockReturnValue('win32' as any)

      const { AudioPlayer } = await import('../../audio/audio-player.js')
      const mockPlaySound = vi.fn().mockResolvedValue(true)
      vi.mocked(AudioPlayer).mockImplementation(() => ({
        playSound: mockPlaySound,
        getSystemSounds: vi.fn().mockReturnValue({
          success: 'C:\\Windows\\Media\\chimes.wav',
          error: 'C:\\Windows\\Media\\chord.wav',
          notification: 'C:\\Windows\\Media\\notify.wav',
        }),
      }))

      const event: ClaudeNotificationEvent = {
        type: 'Notification',
        timestamp: new Date().toISOString(),
        data: { message: 'Windows test' },
      }

      mockStdin[Symbol.asyncIterator] = vi
        .fn()
        .mockImplementation(async function* () {
          yield Buffer.from(JSON.stringify(event))
        })

      const hook = new NotificationHook({ notify: true })

      try {
        await hook.run()
      } catch (error: any) {
        expect(error.message).toBe('process.exit')
      }

      expect(mockPlaySound).toHaveBeenCalledWith(
        'C:\\Windows\\Media\\notify.wav',
        'win32',
      )
    })

    it('should handle unsupported platforms gracefully', async () => {
      const { detectPlatform } = await import('../../audio/platform.js')
      vi.mocked(detectPlatform).mockReturnValue('unsupported' as any)

      const event: ClaudeNotificationEvent = {
        type: 'Notification',
        timestamp: new Date().toISOString(),
        data: { message: 'Unsupported platform test' },
      }

      mockStdin[Symbol.asyncIterator] = vi
        .fn()
        .mockImplementation(async function* () {
          yield Buffer.from(JSON.stringify(event))
        })

      const hook = new NotificationHook({ notify: true })

      try {
        await hook.run()
      } catch (error: any) {
        expect(error.message).toBe('process.exit')
      }

      expect(mockExit).toHaveBeenCalledWith(0)
    })
  })

  describe('Error Handling', () => {
    it('should handle audio playback failures', async () => {
      const { AudioPlayer } = await import('../../audio/audio-player.js')
      const mockPlaySound = vi.fn().mockResolvedValue(false)
      vi.mocked(AudioPlayer).mockImplementation(() => ({
        playSound: mockPlaySound,
        getSystemSounds: vi.fn().mockReturnValue({
          notification: '/System/Library/Sounds/Ping.aiff',
        }),
      }))

      const event: ClaudeNotificationEvent = {
        type: 'Notification',
        timestamp: new Date().toISOString(),
        data: { message: 'Test' },
      }

      mockStdin[Symbol.asyncIterator] = vi
        .fn()
        .mockImplementation(async function* () {
          yield Buffer.from(JSON.stringify(event))
        })

      const hook = new NotificationHook({ notify: true })

      try {
        await hook.run()
      } catch (error: any) {
        expect(error.message).toBe('process.exit')
      }

      // Should still exit successfully even if sound fails
      expect(mockExit).toHaveBeenCalledWith(0)
    })

    it('should handle invalid JSON input', async () => {
      mockStdin[Symbol.asyncIterator] = vi
        .fn()
        .mockImplementation(async function* () {
          yield Buffer.from('invalid json')
        })

      const hook = new NotificationHook()

      try {
        await hook.run()
      } catch (error: any) {
        expect(error.message).toBe('process.exit')
      }

      expect(mockExit).toHaveBeenCalledWith(0)
    })

    it('should handle empty stdin', async () => {
      mockStdin[Symbol.asyncIterator] = vi
        .fn()
        .mockImplementation(async function* () {
          yield Buffer.from('')
        })

      const hook = new NotificationHook()

      try {
        await hook.run()
      } catch (error: any) {
        expect(error.message).toBe('process.exit')
      }

      expect(mockExit).toHaveBeenCalledWith(0)
    })
  })
})

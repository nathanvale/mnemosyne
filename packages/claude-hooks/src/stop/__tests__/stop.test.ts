/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest'

import type { ClaudeStopEvent } from '../../types/claude.js'

import { StopHook } from '../stop.js'

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
vi.mock('../../speech/providers/provider-factory.js', () => ({
  TTSProviderFactory: {
    registerProvider: vi.fn(),
    clearProviders: vi.fn(),
    getAvailableProviders: vi.fn().mockReturnValue(['mock']),
    create: vi.fn(),
    createWithFallback: vi.fn().mockResolvedValue({
      speak: vi.fn().mockResolvedValue(undefined),
      getProviderInfo: vi
        .fn()
        .mockReturnValue({ displayName: 'Mock Provider' }),
      isAvailable: vi.fn().mockResolvedValue(true),
    }),
    detectBestProvider: vi.fn(),
  },
}))

// Mock file system
vi.mock('node:fs/promises', () => {
  const mockReadFile = vi.fn()
  return {
    readFile: mockReadFile,
    default: {
      readFile: mockReadFile,
    },
  }
})

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

describe('StopHook', () => {
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
      const hook = new StopHook()
      expect(hook).toBeInstanceOf(StopHook)
    })

    it('should create instance with custom config', () => {
      const hook = new StopHook({ chat: true, debug: true })
      expect(hook).toBeInstanceOf(StopHook)
    })
  })

  describe('Event Handling', () => {
    it('should play success sound on successful completion', async () => {
      const { AudioPlayer } = await import('../../audio/audio-player.js')
      const mockPlaySound = vi.fn().mockResolvedValue(true)
      vi.mocked(AudioPlayer).mockImplementation(
        () =>
          ({
            playSound: mockPlaySound,
            getSystemSounds: vi.fn().mockReturnValue({
              success: '/System/Library/Sounds/Glass.aiff',
              error: '/System/Library/Sounds/Sosumi.aiff',
              notification: '/System/Library/Sounds/Ping.aiff',
            }),
            playMacOS: vi.fn(),
            playWindows: vi.fn(),
            playLinux: vi.fn(),
            checkCommand: vi.fn(),
          }) as any,
      )

      const event: ClaudeStopEvent = {
        type: 'Stop',
        data: {
          duration: 1234,
          task: 'Test task',
          success: true,
        },
      }

      // Set up stdin mock
      mockStdin[Symbol.asyncIterator] = vi
        .fn()
        .mockImplementation(async function* () {
          yield Buffer.from(JSON.stringify(event))
        })

      const hook = new StopHook()

      try {
        await hook.run()
      } catch (error: any) {
        expect(error.message).toBe('process.exit')
      }

      expect(mockPlaySound).toHaveBeenCalledWith(
        '/System/Library/Sounds/Glass.aiff',
        'darwin',
      )
      expect(mockExit).toHaveBeenCalledWith(0)
    })

    it('should play error sound on failed completion', async () => {
      const { AudioPlayer } = await import('../../audio/audio-player.js')
      const mockPlaySound = vi.fn().mockResolvedValue(true)
      vi.mocked(AudioPlayer).mockImplementation(
        () =>
          ({
            playSound: mockPlaySound,
            getSystemSounds: vi.fn().mockReturnValue({
              success: '/System/Library/Sounds/Glass.aiff',
              error: '/System/Library/Sounds/Sosumi.aiff',
              notification: '/System/Library/Sounds/Ping.aiff',
            }),
            playMacOS: vi.fn(),
            playWindows: vi.fn(),
            playLinux: vi.fn(),
            checkCommand: vi.fn(),
          }) as any,
      )

      const event: ClaudeStopEvent = {
        type: 'Stop',
        data: {
          duration: 5678,
          task: 'Failed task',
          success: false,
        },
      }

      mockStdin[Symbol.asyncIterator] = vi
        .fn()
        .mockImplementation(async function* () {
          yield Buffer.from(JSON.stringify(event))
        })

      const hook = new StopHook()

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

    it('should skip transcript processing when chat flag is disabled', async () => {
      const fs = await import('node:fs/promises')

      const event: ClaudeStopEvent = {
        type: 'Stop',
        transcript_path: '/tmp/test-transcript.txt',
        data: {
          duration: 1234,
          success: true,
        },
      }

      mockStdin[Symbol.asyncIterator] = vi
        .fn()
        .mockImplementation(async function* () {
          yield Buffer.from(JSON.stringify(event))
        })

      const hook = new StopHook({ chat: false })

      try {
        await hook.run()
      } catch (error: any) {
        expect(error.message).toBe('process.exit')
      }

      expect(fs.default.readFile).not.toHaveBeenCalled()
    })

    it('should handle missing transcript path gracefully', async () => {
      const event: ClaudeStopEvent = {
        type: 'Stop',
        data: {
          success: true,
        },
      }

      mockStdin[Symbol.asyncIterator] = vi
        .fn()
        .mockImplementation(async function* () {
          yield Buffer.from(JSON.stringify(event))
        })

      const hook = new StopHook({ chat: true })

      try {
        await hook.run()
      } catch (error: any) {
        expect(error.message).toBe('process.exit')
      }

      expect(mockExit).toHaveBeenCalledWith(0)
    })

    it('should handle transcript read errors gracefully', async () => {
      const fs = await import('node:fs/promises')
      vi.mocked(fs.default.readFile).mockRejectedValue(
        new Error('File not found'),
      )

      const event: ClaudeStopEvent = {
        type: 'Stop',
        transcript_path: '/tmp/nonexistent.txt',
        data: {
          success: true,
        },
      }

      mockStdin[Symbol.asyncIterator] = vi
        .fn()
        .mockImplementation(async function* () {
          yield Buffer.from(JSON.stringify(event))
        })

      const hook = new StopHook({ chat: true })

      try {
        await hook.run()
      } catch (error: any) {
        expect(error.message).toBe('process.exit')
      }

      // Should still exit successfully despite transcript error
      expect(mockExit).toHaveBeenCalledWith(0)
    })

    it('should handle empty transcript gracefully', async () => {
      const fs = await import('node:fs/promises')
      vi.mocked(fs.default.readFile).mockResolvedValue('')

      const event: ClaudeStopEvent = {
        type: 'Stop',
        transcript_path: '/tmp/empty.txt',
        data: {
          success: true,
        },
      }

      mockStdin[Symbol.asyncIterator] = vi
        .fn()
        .mockImplementation(async function* () {
          yield Buffer.from(JSON.stringify(event))
        })

      const hook = new StopHook({ chat: true })

      try {
        await hook.run()
      } catch (error: any) {
        expect(error.message).toBe('process.exit')
      }

      expect(mockExit).toHaveBeenCalledWith(0)
    })

    it('should log duration when available', async () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

      const event: ClaudeStopEvent = {
        type: 'Stop',
        data: {
          duration: 5000,
          success: true,
        },
      }

      mockStdin[Symbol.asyncIterator] = vi
        .fn()
        .mockImplementation(async function* () {
          yield Buffer.from(JSON.stringify(event))
        })

      const hook = new StopHook({ debug: true })

      try {
        await hook.run()
      } catch (error: any) {
        expect(error.message).toBe('process.exit')
      }

      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('Task completed in 5s'),
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
      vi.mocked(AudioPlayer).mockImplementation(
        () =>
          ({
            playSound: mockPlaySound,
            getSystemSounds: vi.fn().mockReturnValue({
              success: 'C:\\Windows\\Media\\chimes.wav',
              error: 'C:\\Windows\\Media\\chord.wav',
              notification: 'C:\\Windows\\Media\\notify.wav',
            }),
            playMacOS: vi.fn(),
            playWindows: vi.fn(),
            playLinux: vi.fn(),
            checkCommand: vi.fn(),
          }) as any,
      )

      const event: ClaudeStopEvent = {
        type: 'Stop',
        data: { success: true },
      }

      mockStdin[Symbol.asyncIterator] = vi
        .fn()
        .mockImplementation(async function* () {
          yield Buffer.from(JSON.stringify(event))
        })

      const hook = new StopHook()

      try {
        await hook.run()
      } catch (error: any) {
        expect(error.message).toBe('process.exit')
      }

      expect(mockPlaySound).toHaveBeenCalledWith(
        'C:\\Windows\\Media\\chimes.wav',
        'win32',
      )
    })

    it('should handle unsupported platforms gracefully', async () => {
      const { detectPlatform } = await import('../../audio/platform.js')
      vi.mocked(detectPlatform).mockReturnValue('unsupported' as any)

      const event: ClaudeStopEvent = {
        type: 'Stop',
        data: { success: true },
      }

      mockStdin[Symbol.asyncIterator] = vi
        .fn()
        .mockImplementation(async function* () {
          yield Buffer.from(JSON.stringify(event))
        })

      const hook = new StopHook()

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
      vi.mocked(AudioPlayer).mockImplementation(
        () =>
          ({
            playSound: mockPlaySound,
            getSystemSounds: vi.fn().mockReturnValue({
              success: '/System/Library/Sounds/Glass.aiff',
            }),
            playMacOS: vi.fn(),
            playWindows: vi.fn(),
            playLinux: vi.fn(),
            checkCommand: vi.fn(),
          }) as any,
      )

      const event: ClaudeStopEvent = {
        type: 'Stop',
        data: { success: true },
      }

      mockStdin[Symbol.asyncIterator] = vi
        .fn()
        .mockImplementation(async function* () {
          yield Buffer.from(JSON.stringify(event))
        })

      const hook = new StopHook()

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

      const hook = new StopHook()

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

      const hook = new StopHook()

      try {
        await hook.run()
      } catch (error: any) {
        expect(error.message).toBe('process.exit')
      }

      expect(mockExit).toHaveBeenCalledWith(0)
    })
  })
})

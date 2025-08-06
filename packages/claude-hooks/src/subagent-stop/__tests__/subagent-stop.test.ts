import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest'

import type { ClaudeSubagentStopEvent } from '../../types/claude.js'

import { SubagentStopHook } from '../subagent-stop.js'

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

describe('SubagentStopHook', () => {
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
      const hook = new SubagentStopHook()
      expect(hook).toBeInstanceOf(SubagentStopHook)
    })

    it('should create instance with custom config', () => {
      const hook = new SubagentStopHook({ notify: true, debug: true })
      expect(hook).toBeInstanceOf(SubagentStopHook)
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

      const event: ClaudeSubagentStopEvent = {
        type: 'SubagentStop',
        data: {
          subagentId: 'test-123',
          subagentType: 'general-purpose',
          result: { status: 'completed', output: 'Test output' },
        },
      }

      // Set up stdin mock
      mockStdin[Symbol.asyncIterator] = vi
        .fn()
        .mockImplementation(async function* () {
          yield Buffer.from(JSON.stringify(event))
        })

      const hook = new SubagentStopHook({ notify: true })

      try {
        await hook.run()
      } catch (error) {
        expect((error as Error).message).toBe('process.exit')
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

      const event: ClaudeSubagentStopEvent = {
        type: 'SubagentStop',
        data: {
          subagentId: 'test-123',
          subagentType: 'general-purpose',
        },
      }

      mockStdin[Symbol.asyncIterator] = vi
        .fn()
        .mockImplementation(async function* () {
          yield Buffer.from(JSON.stringify(event))
        })

      const hook = new SubagentStopHook({ notify: false })

      try {
        await hook.run()
      } catch (error) {
        expect((error as Error).message).toBe('process.exit')
      }

      expect(mockPlaySound).not.toHaveBeenCalled()
      expect(mockExit).toHaveBeenCalledWith(0)
    })

    it('should log subagent details in debug mode', async () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

      const event: ClaudeSubagentStopEvent = {
        type: 'SubagentStop',
        data: {
          subagentId: 'debug-123',
          subagentType: 'code-reviewer',
          result: { status: 'completed', feedback: 'Code looks good!' },
        },
      }

      mockStdin[Symbol.asyncIterator] = vi
        .fn()
        .mockImplementation(async function* () {
          yield Buffer.from(JSON.stringify(event))
        })

      const hook = new SubagentStopHook({ notify: false, debug: true })

      try {
        await hook.run()
      } catch (error) {
        expect((error as Error).message).toBe('process.exit')
      }

      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('Subagent completed'),
      )
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('Code reviewer agent'),
      )

      consoleSpy.mockRestore()
    })

    it('should handle events without data gracefully', async () => {
      const { AudioPlayer } = await import('../../audio/audio-player.js')
      const mockPlaySound = vi.fn().mockResolvedValue(true)
      vi.mocked(AudioPlayer).mockImplementation(() => ({
        playSound: mockPlaySound,
        getSystemSounds: vi.fn().mockReturnValue({
          notification: '/System/Library/Sounds/Ping.aiff',
        }),
      }))

      const event: ClaudeSubagentStopEvent = {
        type: 'SubagentStop',
      }

      mockStdin[Symbol.asyncIterator] = vi
        .fn()
        .mockImplementation(async function* () {
          yield Buffer.from(JSON.stringify(event))
        })

      const hook = new SubagentStopHook({ notify: true })

      try {
        await hook.run()
      } catch (error) {
        expect((error as Error).message).toBe('process.exit')
      }

      expect(mockExit).toHaveBeenCalledWith(0)
      expect(mockPlaySound).toHaveBeenCalled()
    })

    it('should handle different subagent types', async () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

      const testCases = [
        { type: 'general-purpose', expected: 'General purpose agent' },
        { type: 'code-reviewer', expected: 'Code reviewer agent' },
        { type: 'test-runner', expected: 'Test runner agent' },
        { type: 'unknown-type', expected: 'unknown-type agent' },
      ]

      for (const testCase of testCases) {
        vi.clearAllMocks()

        const event: ClaudeSubagentStopEvent = {
          type: 'SubagentStop',
          data: {
            subagentId: 'test-123',
            subagentType: testCase.type,
          },
        }

        mockStdin[Symbol.asyncIterator] = vi
          .fn()
          .mockImplementation(async function* () {
            yield Buffer.from(JSON.stringify(event))
          })

        const hook = new SubagentStopHook({ debug: true })

        try {
          await hook.run()
        } catch (error) {
          expect((error as Error).message).toBe('process.exit')
        }

        expect(consoleSpy).toHaveBeenCalledWith(
          expect.stringContaining(testCase.expected),
        )
      }

      consoleSpy.mockRestore()
    })
  })

  describe('Platform Support', () => {
    it('should work on Windows', async () => {
      const { detectPlatform } = await import('../../audio/platform.js')
      vi.mocked(detectPlatform).mockReturnValue('win32')

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

      const event: ClaudeSubagentStopEvent = {
        type: 'SubagentStop',
        data: { subagentId: 'win-test' },
      }

      mockStdin[Symbol.asyncIterator] = vi
        .fn()
        .mockImplementation(async function* () {
          yield Buffer.from(JSON.stringify(event))
        })

      const hook = new SubagentStopHook({ notify: true })

      try {
        await hook.run()
      } catch (error) {
        expect((error as Error).message).toBe('process.exit')
      }

      expect(mockPlaySound).toHaveBeenCalledWith(
        'C:\\Windows\\Media\\notify.wav',
        'win32',
      )
    })

    it('should handle unsupported platforms gracefully', async () => {
      const { detectPlatform } = await import('../../audio/platform.js')
      vi.mocked(detectPlatform).mockReturnValue('unsupported')

      const event: ClaudeSubagentStopEvent = {
        type: 'SubagentStop',
        data: { subagentId: 'unsupported-test' },
      }

      mockStdin[Symbol.asyncIterator] = vi
        .fn()
        .mockImplementation(async function* () {
          yield Buffer.from(JSON.stringify(event))
        })

      const hook = new SubagentStopHook({ notify: true })

      try {
        await hook.run()
      } catch (error) {
        expect((error as Error).message).toBe('process.exit')
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

      const event: ClaudeSubagentStopEvent = {
        type: 'SubagentStop',
        data: { subagentId: 'test' },
      }

      mockStdin[Symbol.asyncIterator] = vi
        .fn()
        .mockImplementation(async function* () {
          yield Buffer.from(JSON.stringify(event))
        })

      const hook = new SubagentStopHook({ notify: true })

      try {
        await hook.run()
      } catch (error) {
        expect((error as Error).message).toBe('process.exit')
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

      const hook = new SubagentStopHook()

      try {
        await hook.run()
      } catch (error) {
        expect((error as Error).message).toBe('process.exit')
      }

      expect(mockExit).toHaveBeenCalledWith(0)
    })

    it('should handle empty stdin', async () => {
      mockStdin[Symbol.asyncIterator] = vi
        .fn()
        .mockImplementation(async function* () {
          yield Buffer.from('')
        })

      const hook = new SubagentStopHook()

      try {
        await hook.run()
      } catch (error) {
        expect((error as Error).message).toBe('process.exit')
      }

      expect(mockExit).toHaveBeenCalledWith(0)
    })
  })
})

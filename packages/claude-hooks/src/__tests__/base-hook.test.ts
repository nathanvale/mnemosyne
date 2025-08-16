import { Readable } from 'stream'
/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest'

import type { ClaudeNotificationEvent } from '../types/claude'

import { BaseHook } from '../base-hook'
import { HookExitCode } from '../types/claude'

// Test implementation of BaseHook
class TestHook extends BaseHook<ClaudeNotificationEvent> {
  public handleCalled = false
  public handledEvent: ClaudeNotificationEvent | null = null

  constructor(config = {}) {
    super('Notification', config)
  }

  protected async handle(event: ClaudeNotificationEvent): Promise<void> {
    this.handleCalled = true
    this.handledEvent = event
  }

  // Expose protected methods for testing
  public async testParseEvent() {
    return this.parseEvent()
  }
}

describe('BaseHook', () => {
  let originalStdin: NodeJS.ReadStream
  let processExitSpy: ReturnType<typeof vi.spyOn>

  beforeEach(() => {
    // Save original stdin
    originalStdin = process.stdin

    // Mock process.exit
    processExitSpy = vi.spyOn(process, 'exit').mockImplementation((code) => {
      throw new Error(`Process exit: ${code}`)
    })

    // Reset stdin
    Object.defineProperty(process, 'stdin', {
      value: new Readable({
        read() {}, // Required for Readable
      }),
      configurable: true,
      writable: true,
    })
  })

  afterEach(() => {
    // Restore original stdin
    Object.defineProperty(process, 'stdin', {
      value: originalStdin,
      configurable: true,
      writable: true,
    })

    // Restore process.exit
    processExitSpy.mockRestore()
  })

  describe('Event Parsing', () => {
    it('should parse valid event from stdin', async () => {
      const hook = new TestHook()
      const event: ClaudeNotificationEvent = {
        type: 'Notification',
        data: { message: 'Test message' },
      }

      // Simulate stdin input
      const stdin = process.stdin as NodeJS.ReadWriteStream & {
        push: (chunk: string | null) => void
      }
      stdin.push(JSON.stringify(event))
      stdin.push(null) // End stream

      const parsed = await hook.testParseEvent()
      expect(parsed).toEqual(event)
    })

    it('should return null for empty stdin', async () => {
      const hook = new TestHook()

      // Simulate empty stdin
      const stdin = process.stdin as NodeJS.ReadWriteStream & {
        push: (chunk: string | null) => void
      }
      stdin.push(null) // End stream immediately

      const parsed = await hook.testParseEvent()
      expect(parsed).toBeNull()
    })

    it('should return null for invalid JSON', async () => {
      const hook = new TestHook()

      // Simulate invalid JSON
      const stdin = process.stdin as NodeJS.ReadWriteStream & {
        push: (chunk: string | null) => void
      }
      stdin.push('{ invalid json')
      stdin.push(null)

      const parsed = await hook.testParseEvent()
      expect(parsed).toBeNull()
    })

    it('should return null for wrong event type', async () => {
      const hook = new TestHook()

      // Simulate wrong event type
      const stdin = process.stdin as NodeJS.ReadWriteStream & {
        push: (chunk: string | null) => void
      }
      stdin.push(JSON.stringify({ type: 'Stop', data: {} }))
      stdin.push(null)

      const parsed = await hook.testParseEvent()
      expect(parsed).toBeNull()
    })

    it('should handle TTY mode', async () => {
      const hook = new TestHook()

      // Mock TTY mode
      Object.defineProperty(process.stdin, 'isTTY', {
        value: true,
        configurable: true,
      })

      const parsed = await hook.testParseEvent()
      expect(parsed).toBeNull()
    })
  })

  describe('Hook Execution', () => {
    it('should execute hook with valid event', async () => {
      const hook = new TestHook()
      const event: ClaudeNotificationEvent = {
        type: 'Notification',
        data: { message: 'Test', priority: 'high' },
      }

      // Simulate stdin input
      const stdin = process.stdin as NodeJS.ReadWriteStream & {
        push: (chunk: string | null) => void
      }
      stdin.push(JSON.stringify(event))
      stdin.push(null)

      try {
        await hook.run()
      } catch (error: unknown) {
        expect((error as Error).message).toBe(
          `Process exit: ${HookExitCode.Success}`,
        )
      }

      expect(hook.handleCalled).toBe(true)
      expect(hook.handledEvent).toEqual(event)
      expect(processExitSpy).toHaveBeenCalledWith(HookExitCode.Success)
    })

    it('should exit gracefully with no event', async () => {
      const hook = new TestHook()

      // Simulate empty stdin
      const stdin = process.stdin as NodeJS.ReadWriteStream & {
        push: (chunk: string | null) => void
      }
      stdin.push(null)

      try {
        await hook.run()
      } catch (error: unknown) {
        expect((error as Error).message).toBe(
          `Process exit: ${HookExitCode.Success}`,
        )
      }

      expect(hook.handleCalled).toBe(false)
      expect(processExitSpy).toHaveBeenCalledWith(HookExitCode.Success)
    })

    it('should handle errors during execution', async () => {
      // Create hook that throws error
      class ErrorHook extends BaseHook<ClaudeNotificationEvent> {
        constructor() {
          super('Notification')
        }
        protected async handle(): Promise<void> {
          throw new Error('Test error')
        }
      }

      const hook = new ErrorHook()
      const event: ClaudeNotificationEvent = { type: 'Notification' }

      // Simulate stdin input
      const stdin = process.stdin as NodeJS.ReadWriteStream & {
        push: (chunk: string | null) => void
      }
      stdin.push(JSON.stringify(event))
      stdin.push(null)

      try {
        await hook.run()
      } catch (error: unknown) {
        expect((error as Error).message).toBe(
          `Process exit: ${HookExitCode.GeneralError}`,
        )
      }

      expect(processExitSpy).toHaveBeenCalledWith(HookExitCode.GeneralError)
    })
  })

  describe('Error Handlers', () => {
    it('should handle unhandled rejections', () => {
      const hook = new TestHook()
      hook.setupErrorHandlers()

      const listeners = process.listeners('unhandledRejection')
      const handler = listeners[listeners.length - 1] as any

      try {
        handler(new Error('Test rejection'))
      } catch (error: unknown) {
        expect((error as Error).message).toBe(
          `Process exit: ${HookExitCode.GeneralError}`,
        )
      }

      expect(processExitSpy).toHaveBeenCalledWith(HookExitCode.GeneralError)

      // Clean up listener
      process.removeListener('unhandledRejection', handler)
    })

    it('should handle uncaught exceptions', () => {
      const hook = new TestHook()
      hook.setupErrorHandlers()

      const listeners = process.listeners('uncaughtException')
      const handler = listeners[listeners.length - 1] as any

      try {
        handler(new Error('Test exception'))
      } catch (error: unknown) {
        expect((error as Error).message).toBe(
          `Process exit: ${HookExitCode.GeneralError}`,
        )
      }

      expect(processExitSpy).toHaveBeenCalledWith(HookExitCode.GeneralError)

      // Clean up listener
      process.removeListener('uncaughtException', handler)
    })
  })

  describe('Static Execute Method', () => {
    it('should create and run hook instance', async () => {
      const event: ClaudeNotificationEvent = {
        type: 'Notification',
        data: { message: 'Static test' },
      }

      // Simulate stdin input
      const stdin = process.stdin as NodeJS.ReadWriteStream & {
        push: (chunk: string | null) => void
      }
      stdin.push(JSON.stringify(event))
      stdin.push(null)

      let hookInstance: TestHook | null = null

      // Capture hook instance
      class CaptureHook extends TestHook {
        constructor(config: unknown) {
          super(config)
          // eslint-disable-next-line @typescript-eslint/no-this-alias
          hookInstance = this
        }
      }

      try {
        await BaseHook.execute(CaptureHook, { debug: true })
      } catch (error: unknown) {
        expect((error as Error).message).toBe(
          `Process exit: ${HookExitCode.Success}`,
        )
      }

      expect(hookInstance).not.toBeNull()
      expect(hookInstance!.handleCalled).toBe(true)
      expect(hookInstance!.handledEvent).toEqual(event)
    })
  })

  describe('Debug Logging', () => {
    it('should enable debug logging when configured', () => {
      const logSpy = vi.spyOn(console, 'error')
      const hook = new TestHook({ debug: true })

      // Access logger to trigger a debug message
      hook['log'].debug('Test debug message')

      expect(logSpy).toHaveBeenCalled()
      const calls = logSpy.mock.calls
      const debugCall = calls.find(
        (call) =>
          call[0].includes('[DEBUG]') && call[0].includes('Test debug message'),
      )
      expect(debugCall).toBeDefined()

      logSpy.mockRestore()
    })

    it('should not show debug logs when debug is false', () => {
      const logSpy = vi.spyOn(console, 'error')
      const hook = new TestHook({ debug: false })

      // Access logger to trigger a debug message
      hook['log'].debug('Test debug message')

      const calls = logSpy.mock.calls
      const debugCall = calls.find(
        (call) =>
          call[0].includes('[DEBUG]') && call[0].includes('Test debug message'),
      )
      expect(debugCall).toBeUndefined()

      logSpy.mockRestore()
    })
  })
})

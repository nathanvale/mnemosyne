/**
 * Testing utilities for the logger package
 *
 * Provides mock logger implementations that are compatible with both
 * Node.js and browser logger interfaces for easy testing setup.
 */

import { vi } from 'vitest'

import type { BrowserLogger, LogLevel } from './browser-logger'
import type { LogContext, NodeLogger } from './logger'

/**
 * Mock implementation of NodeLogger interface
 */
export interface MockNodeLogger extends NodeLogger {
  // Mock function access for testing
  trace: ReturnType<typeof vi.fn>
  debug: ReturnType<typeof vi.fn>
  info: ReturnType<typeof vi.fn>
  warn: ReturnType<typeof vi.fn>
  error: ReturnType<typeof vi.fn>
  fatal: ReturnType<typeof vi.fn>
  withTag: ReturnType<typeof vi.fn>
  withContext: ReturnType<typeof vi.fn>
}

/**
 * Mock implementation of BrowserLogger interface
 */
export interface MockBrowserLogger extends Partial<BrowserLogger> {
  // Mock function access for testing
  trace: ReturnType<typeof vi.fn>
  debug: ReturnType<typeof vi.fn>
  info: ReturnType<typeof vi.fn>
  warn: ReturnType<typeof vi.fn>
  error: ReturnType<typeof vi.fn>
  fatal?: ReturnType<typeof vi.fn>
  withTag: ReturnType<typeof vi.fn>
  withContext: ReturnType<typeof vi.fn>
  flush?: ReturnType<typeof vi.fn>
  destroy?: ReturnType<typeof vi.fn>
  group?: ReturnType<typeof vi.fn>
  groupCollapsed?: ReturnType<typeof vi.fn>
  groupEnd?: ReturnType<typeof vi.fn>
  mark?: ReturnType<typeof vi.fn>
  measure?: ReturnType<typeof vi.fn>
  traceDev?: ReturnType<typeof vi.fn>
}

/**
 * Universal mock logger that works for both Node.js and browser environments
 */
export type MockLogger = MockNodeLogger & MockBrowserLogger

/**
 * Create a mock logger for testing with unified API
 *
 * @example
 * ```typescript
 * import { createMockLogger } from '@studio/logger/testing'
 *
 * const mockLogger = createMockLogger()
 *
 * // Test your code
 * yourFunction(mockLogger)
 *
 * // Assert calls
 * expect(mockLogger.info).toHaveBeenCalledWith('Expected message', { userId: '123' })
 * ```
 */
export function createMockLogger(): MockLogger {
  const mockLogger: MockLogger = {
    // Core logging methods
    trace: vi.fn(),
    debug: vi.fn(),
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
    fatal: vi.fn(),

    // Browser-specific methods
    flush: vi.fn().mockResolvedValue(undefined),
    destroy: vi.fn(),
    group: vi.fn(),
    groupCollapsed: vi.fn(),
    groupEnd: vi.fn(),
    mark: vi.fn(),
    measure: vi.fn(),
    traceDev: vi.fn(),
  }

  // Add methods that return a new mock logger for chaining
  mockLogger.withTag = vi.fn().mockReturnValue(mockLogger)
  mockLogger.withContext = vi.fn().mockReturnValue(mockLogger)

  return mockLogger
}

/**
 * Create a mock logger that captures calls and can replay them
 * Useful for testing logging behavior and verifying log sequences
 *
 * @example
 * ```typescript
 * const mockLogger = createCapturingMockLogger()
 *
 * yourFunction(mockLogger)
 *
 * // Get all captured calls
 * const calls = mockLogger.getCalls()
 * expect(calls).toEqual([
 *   { level: 'info', message: 'Starting process', context: { userId: '123' } },
 *   { level: 'error', message: 'Process failed', context: { error: 'timeout' } }
 * ])
 * ```
 */
export function createCapturingMockLogger() {
  const calls: Array<{
    level: LogLevel | 'fatal'
    message: string
    context?: LogContext
    data?: Array<unknown>
  }> = []

  const createCapturingMethod = (level: LogLevel | 'fatal') => {
    return vi.fn(
      (
        message: string,
        contextOrData?: LogContext | unknown,
        ...data: Array<unknown>
      ) => {
        if (
          contextOrData !== undefined &&
          typeof contextOrData === 'object' &&
          !Array.isArray(contextOrData) &&
          data.length === 0
        ) {
          // New unified signature: method(message, context)
          calls.push({ level, message, context: contextOrData as LogContext })
        } else {
          // Legacy signature: method(message, ...data)
          calls.push({
            level,
            message,
            data: contextOrData !== undefined ? [contextOrData, ...data] : data,
          })
        }
      },
    )
  }

  const mockLogger: MockLogger = {
    // Core logging methods
    trace: createCapturingMethod('trace'),
    debug: createCapturingMethod('debug'),
    info: createCapturingMethod('info'),
    warn: createCapturingMethod('warn'),
    error: createCapturingMethod('error'),
    fatal: createCapturingMethod('fatal'),

    // Browser-specific methods
    flush: vi.fn().mockResolvedValue(undefined),
    destroy: vi.fn(),
    group: vi.fn(),
    groupCollapsed: vi.fn(),
    groupEnd: vi.fn(),
    mark: vi.fn(),
    measure: vi.fn(),
    traceDev: vi.fn(),

    // Testing utilities
    getCalls: () => [...calls],
    clearCalls: () => {
      calls.length = 0
    },
    getCallCount: () => calls.length,
    getCallsForLevel: (level: LogLevel | 'fatal') =>
      calls.filter((call) => call.level === level),
  }

  // Add methods that reference mockLogger after it's declared
  mockLogger.withTag = vi.fn().mockReturnValue(mockLogger)
  mockLogger.withContext = vi.fn().mockReturnValue(mockLogger)

  return mockLogger
}

/**
 * Reset all mock logger calls
 * Useful in beforeEach hooks
 */
export function resetMockLogger(mockLogger: MockLogger): void {
  Object.values(mockLogger).forEach((method) => {
    if (typeof method === 'function' && 'mockClear' in method) {
      method.mockClear()
    }
  })
}

/**
 * Mock the entire logger module for testing
 * Use this in your test setup files
 *
 * @example
 * ```typescript
 * // In test setup or individual test file
 * import { mockLoggerModule } from '@studio/logger/testing'
 *
 * // Mock the module
 * mockLoggerModule()
 *
 * // Now all imports from '@studio/logger' will use mocks
 * import { log, createLogger } from '@studio/logger'
 * ```
 */
export function mockLoggerModule() {
  const mockLog = createMockLogger()
  const mockCreateLogger = vi.fn(() => createMockLogger())
  const mockCreateCliLogger = vi.fn(() => ({}))

  vi.mock('@studio/logger', () => ({
    log: mockLog,
    createLogger: mockCreateLogger,
    createCliLogger: mockCreateCliLogger,
    logger: {},
  }))

  return {
    mockLog,
    mockCreateLogger,
    mockCreateCliLogger,
  }
}

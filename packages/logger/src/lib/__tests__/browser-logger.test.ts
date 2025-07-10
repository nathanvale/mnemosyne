import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'

import {
  BrowserLogger,
  createLogger,
  createSentryLogger,
  createDatadogLogger,
  createLogRocketLogger,
} from '../browser-logger'

// Mock console methods
const mockConsole = {
  trace: vi.fn(),
  debug: vi.fn(),
  info: vi.fn(),
  warn: vi.fn(),
  error: vi.fn(),
  group: vi.fn(),
  groupCollapsed: vi.fn(),
  groupEnd: vi.fn(),
}

// Mock fetch
const mockFetch = vi.fn()

// Mock performance
const mockPerformance = {
  mark: vi.fn(),
  measure: vi.fn(),
  now: vi.fn(() => 1000),
  getEntriesByName: vi.fn(() => [{ duration: 42.5 }]),
}

// Mock navigator
const mockNavigator = {
  userAgent: 'Mozilla/5.0 (Test Browser)',
}

// Mock window
const mockWindow = {
  location: {
    href: 'https://example.com/test',
  },
  addEventListener: vi.fn(),
  Sentry: {
    captureException: vi.fn(),
  },
  DD_RUM: {
    addError: vi.fn(),
  },
  LogRocket: {
    captureException: vi.fn(),
  },
}

describe('BrowserLogger', () => {
  beforeEach(() => {
    vi.resetAllMocks()
    vi.clearAllTimers()
    vi.useFakeTimers()

    // Clear and reset mocks
    mockConsole.trace.mockClear()
    mockConsole.debug.mockClear()
    mockConsole.info.mockClear()
    mockConsole.warn.mockClear()
    mockConsole.error.mockClear()
    mockConsole.group.mockClear()
    mockConsole.groupCollapsed.mockClear()
    mockConsole.groupEnd.mockClear()

    mockFetch.mockClear()
    mockFetch.mockResolvedValue({
      ok: true,
      status: 200,
      statusText: 'OK',
    })

    mockPerformance.mark.mockClear()
    mockPerformance.measure.mockClear()
    mockPerformance.now.mockClear()
    mockPerformance.getEntriesByName.mockClear()

    mockWindow.Sentry.captureException.mockClear()
    mockWindow.DD_RUM.addError.mockClear()
    mockWindow.LogRocket.captureException.mockClear()

    // Setup global mocks
    Object.defineProperty(global, 'console', {
      value: mockConsole,
      writable: true,
    })

    Object.defineProperty(global, 'fetch', {
      value: mockFetch,
      writable: true,
    })

    Object.defineProperty(global, 'performance', {
      value: mockPerformance,
      writable: true,
    })

    Object.defineProperty(global, 'navigator', {
      value: mockNavigator,
      writable: true,
    })

    Object.defineProperty(global, 'window', {
      value: mockWindow,
      writable: true,
    })

    // Reset environment variables - simulate non-test environment by default
    vi.stubEnv('VITEST', undefined)
    vi.stubEnv('NODE_ENV', 'development')
  })

  afterEach(() => {
    vi.useRealTimers()
    vi.unstubAllEnvs()
  })

  describe('Basic Logging', () => {
    it('should log messages at different levels', () => {
      const logger = new BrowserLogger({
        level: 'trace',
        enableConsole: true,
        enableColors: false,
        devClickableTraces: false,
      })

      logger.trace('Trace message')
      logger.debug('Debug message')
      logger.info('Info message')
      logger.warn('Warning message')
      logger.error('Error message')

      expect(mockConsole.trace).toHaveBeenCalledWith(
        expect.stringContaining('TRACE: Trace message'),
        expect.any(String),
      )
      expect(mockConsole.debug).toHaveBeenCalledWith(
        expect.stringContaining('DEBUG: Debug message'),
        expect.any(String),
      )
      expect(mockConsole.info).toHaveBeenCalledWith(
        expect.stringContaining('INFO: Info message'),
        expect.any(String),
      )
      expect(mockConsole.warn).toHaveBeenCalledWith(
        expect.stringContaining('WARN: Warning message'),
        expect.any(String),
      )
      expect(mockConsole.error).toHaveBeenCalledWith(
        expect.stringContaining('ERROR: Error message'),
        expect.any(String),
      )
    })

    it('should respect log level filtering', () => {
      const logger = new BrowserLogger({
        level: 'warn',
        enableConsole: true,
        enableColors: true,
        devClickableTraces: false,
      })

      logger.trace('Trace message')
      logger.debug('Debug message')
      logger.info('Info message')
      logger.warn('Warning message')
      logger.error('Error message')

      expect(mockConsole.trace).not.toHaveBeenCalled()
      expect(mockConsole.debug).not.toHaveBeenCalled()
      expect(mockConsole.info).not.toHaveBeenCalled()
      expect(mockConsole.warn).toHaveBeenCalledWith(
        expect.stringContaining('WARN: Warning message'),
        expect.stringContaining('color: #F59E0B'),
        expect.any(String),
      )
      expect(mockConsole.error).toHaveBeenCalledWith(
        expect.stringContaining('ERROR: Error message'),
        expect.stringContaining('color: #EF4444'),
        expect.any(String),
      )
    })

    it('should include tags in log messages', () => {
      const logger = new BrowserLogger({
        level: 'info',
        enableConsole: true,
        enableColors: false,
        devClickableTraces: false,
      })

      const taggedLogger = logger.withTag('TestFeature')
      taggedLogger.info('Tagged message')

      expect(mockConsole.info).toHaveBeenCalledWith(
        expect.stringContaining('[TestFeature]: Tagged message'),
        expect.any(String),
      )
    })

    it('should include context in log messages', () => {
      const logger = new BrowserLogger({
        level: 'info',
        enableConsole: true,
        enableColors: false,
        devClickableTraces: false,
      })

      const contextLogger = logger.withContext({
        userId: '123',
        feature: 'test',
      })
      contextLogger.info('Context message')

      expect(mockConsole.info).toHaveBeenCalledWith(
        expect.stringContaining('INFO: Context message'),
        'Context:',
        { userId: '123', feature: 'test' },
        expect.any(String),
      )
    })

    it('should log with colored output when enabled', () => {
      const logger = new BrowserLogger({
        level: 'info',
        enableConsole: true,
        enableColors: true,
        devClickableTraces: false,
      })

      logger.info('Colored message')

      expect(mockConsole.info).toHaveBeenCalledWith(
        expect.stringContaining('INFO: Colored message'),
        expect.stringContaining('color: #10B981'),
        expect.any(String),
      )
    })
  })

  describe('Development Features', () => {
    it('should log dev-only traces', () => {
      vi.stubEnv('NODE_ENV', 'development')

      const logger = new BrowserLogger({
        level: 'trace',
        enableConsole: true,
        enableColors: true,
        devClickableTraces: true,
      })

      logger.traceDev('Dev trace message')

      expect(mockConsole.trace).toHaveBeenCalledWith(
        expect.stringContaining('TRACE: Dev trace message'),
        expect.stringContaining('color: #6B7280'),
        expect.any(String),
        expect.any(Object), // clickable object
      )
    })

    it('should not log dev traces in production', () => {
      vi.stubEnv('NODE_ENV', 'production')

      const logger = new BrowserLogger({
        level: 'trace',
        enableConsole: true,
        enableInProduction: true,
      })

      logger.traceDev('Dev trace message')

      expect(mockConsole.trace).not.toHaveBeenCalled()
    })

    it('should not log dev traces in test environment', () => {
      vi.stubEnv('VITEST', 'true')

      const logger = new BrowserLogger({
        level: 'trace',
        enableConsole: true,
      })

      logger.traceDev('Dev trace message')

      expect(mockConsole.trace).not.toHaveBeenCalled()
    })
  })

  describe('Console Grouping', () => {
    it('should support console grouping', () => {
      const logger = new BrowserLogger({
        enableConsole: true,
      })

      logger.group('Test Group')
      logger.info('Grouped message')
      logger.groupEnd()

      expect(mockConsole.group).toHaveBeenCalledWith('Test Group')
      expect(mockConsole.groupEnd).toHaveBeenCalled()
    })

    it('should support collapsed grouping', () => {
      const logger = new BrowserLogger({
        enableConsole: true,
      })

      logger.groupCollapsed('Collapsed Group')
      logger.info('Grouped message')
      logger.groupEnd()

      expect(mockConsole.groupCollapsed).toHaveBeenCalledWith('Collapsed Group')
      expect(mockConsole.groupEnd).toHaveBeenCalled()
    })
  })

  describe('Performance Monitoring', () => {
    it('should create performance marks', () => {
      const logger = new BrowserLogger({
        enablePerformance: true,
      })

      logger.mark('test-start')

      expect(mockPerformance.mark).toHaveBeenCalledWith('test-start')
    })

    it('should measure performance between marks', () => {
      const logger = new BrowserLogger({
        enablePerformance: true,
        enableConsole: true,
        enableColors: true,
        devClickableTraces: false,
      })

      logger.measure('test-measure', 'start', 'end')

      expect(mockPerformance.measure).toHaveBeenCalledWith(
        'test-measure',
        'start',
        'end',
      )
      expect(mockPerformance.getEntriesByName).toHaveBeenCalledWith(
        'test-measure',
        'measure',
      )
      expect(mockConsole.info).toHaveBeenCalledWith(
        expect.stringContaining('⏱️ test-measure: 42.50ms'),
        expect.stringContaining('color: #10B981'),
        expect.any(String),
      )
    })
  })

  describe('Remote Logging', () => {
    it('should batch and send logs to remote endpoint', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        status: 200,
        statusText: 'OK',
      })

      const logger = new BrowserLogger({
        level: 'info',
        remoteEndpoint: 'https://api.example.com/logs',
        batchSize: 2,
        enableConsole: false,
        flushInterval: 60000, // Long interval to avoid automatic timer
      })

      logger.info('First message')
      logger.info('Second message') // This should trigger auto-flush

      // Advance timers to process the async flush
      await vi.advanceTimersByTimeAsync(10)

      expect(mockFetch).toHaveBeenCalledWith(
        'https://api.example.com/logs',
        expect.objectContaining({
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: expect.stringContaining('First message'),
        }),
      )
    })

    it('should flush logs on timer interval', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        status: 200,
        statusText: 'OK',
      })

      const logger = new BrowserLogger({
        level: 'info',
        remoteEndpoint: 'https://api.example.com/logs',
        batchSize: 10,
        flushInterval: 1000, // Short interval to test timer
        enableConsole: false,
      })

      logger.info('Test message')

      // Advance timer to trigger flush
      vi.advanceTimersByTime(1000)

      expect(mockFetch).toHaveBeenCalledWith(
        'https://api.example.com/logs',
        expect.objectContaining({
          method: 'POST',
          body: expect.stringContaining('Test message'),
        }),
      )
    })

    it('should redact sensitive fields', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        status: 200,
        statusText: 'OK',
      })

      const logger = new BrowserLogger({
        level: 'info',
        remoteEndpoint: 'https://api.example.com/logs',
        batchSize: 1,
        enableConsole: false,
        flushInterval: 60000,
        sensitiveFields: ['password', 'token'],
      })

      logger.info('Login attempt', {
        username: 'john',
        password: 'secret123',
        token: 'abc123',
      })

      // Manual flush since we disabled automatic timer
      await logger.flush()

      const fetchCall = mockFetch.mock.calls[0]
      const body = JSON.parse(fetchCall[1].body)

      expect(body.logs[0].data[0]).toEqual({
        username: 'john',
        password: '[REDACTED]',
        token: '[REDACTED]',
      })
    })

    it('should retry failed requests with exponential backoff', async () => {
      let callCount = 0
      mockFetch.mockImplementation(async () => {
        callCount++
        if (callCount <= 2) {
          throw new Error('Network error')
        }
        return {
          ok: true,
          status: 200,
          statusText: 'OK',
        }
      })

      const logger = new BrowserLogger({
        level: 'info',
        remoteEndpoint: 'https://api.example.com/logs',
        batchSize: 1,
        enableConsole: false,
        flushInterval: 60000,
        maxRetries: 2, // 2 retries = 3 total attempts
        retryBaseDelay: 1, // Very small delay for testing
      })

      logger.info('Test message')

      // Manual flush to trigger retries
      const flushPromise = logger.flush()

      // Advance timers to let the retries complete
      await vi.advanceTimersByTimeAsync(100)

      // Wait for flush to complete
      await flushPromise

      // Should be called 3 times (initial + 2 retries)
      expect(callCount).toBe(3)
    })

    it('should call error handler on max retries', async () => {
      let callCount = 0
      mockFetch.mockImplementation(async () => {
        callCount++
        throw new Error('Network error')
      })

      const errorHandler = vi.fn()
      const logger = new BrowserLogger({
        level: 'info',
        remoteEndpoint: 'https://api.example.com/logs',
        batchSize: 1,
        enableConsole: false,
        flushInterval: 60000,
        maxRetries: 2,
        retryBaseDelay: 1, // Very small delay for testing
        onRemoteError: errorHandler,
      })

      logger.info('Test message')

      // Manual flush to trigger retries
      const flushPromise = logger.flush()

      // Advance timers to let the retries complete
      await vi.advanceTimersByTimeAsync(100)

      // Wait for flush to complete
      await flushPromise

      expect(callCount).toBe(3) // Initial + 2 retries
      expect(errorHandler).toHaveBeenCalledWith(
        expect.any(Error),
        expect.arrayContaining([
          expect.objectContaining({ message: 'Test message' }),
        ]),
      )
    })
  })

  describe('Production Behavior', () => {
    it('should be disabled in production by default', async () => {
      vi.stubEnv('NODE_ENV', 'production')

      const logger = new BrowserLogger({
        level: 'info',
        remoteEndpoint: 'https://api.example.com/logs',
      })

      logger.info('Production message')

      // Advance timers to process any async operations
      await vi.advanceTimersByTimeAsync(10)

      expect(mockConsole.info).not.toHaveBeenCalled()
      expect(mockFetch).not.toHaveBeenCalled()
    })

    it('should work in production when explicitly enabled', () => {
      vi.stubEnv('NODE_ENV', 'production')

      const logger = new BrowserLogger({
        level: 'info',
        enableConsole: true,
        enableInProduction: true,
        enableColors: true,
        devClickableTraces: false,
      })

      logger.info('Production message')

      expect(mockConsole.info).toHaveBeenCalledWith(
        expect.stringContaining('INFO: Production message'),
        expect.stringContaining('color: #10B981'),
        expect.any(String),
      )
    })

    it('should be disabled in test environment', async () => {
      vi.stubEnv('VITEST', 'true')

      const logger = new BrowserLogger({
        level: 'info',
        enableConsole: true,
        remoteEndpoint: 'https://api.example.com/logs',
      })

      logger.info('Test message')

      // Advance timers to process any async operations
      await vi.advanceTimersByTimeAsync(10)

      expect(mockConsole.info).not.toHaveBeenCalled()
      expect(mockFetch).not.toHaveBeenCalled()
    })

    it('should be disabled when NODE_ENV is test', async () => {
      vi.stubEnv('NODE_ENV', 'test')

      const logger = new BrowserLogger({
        level: 'info',
        enableConsole: true,
        remoteEndpoint: 'https://api.example.com/logs',
      })

      logger.info('Test message')

      // Advance timers to process any async operations
      await vi.advanceTimersByTimeAsync(10)

      expect(mockConsole.info).not.toHaveBeenCalled()
      expect(mockFetch).not.toHaveBeenCalled()
    })
  })

  describe('Factory Functions', () => {
    it('should create logger with custom config', () => {
      const logger = createLogger({
        level: 'trace', // Lower threshold to ensure debug logs are captured
        enableConsole: true,
        enableColors: false,
        devClickableTraces: false,
      })

      logger.debug('Custom logger message')

      expect(mockConsole.debug).toHaveBeenCalledWith(
        expect.stringContaining('DEBUG: Custom logger message'),
        expect.any(String),
      )
    })

    it('should create Sentry logger with hooks', () => {
      const sentryLogger = createSentryLogger({
        level: 'error',
        enableConsole: false,
        enableInProduction: true,
      })

      // Mock error to trigger Sentry integration
      const testError = new Error('Test error')
      sentryLogger.error('Error occurred', testError)

      // Note: Full Sentry integration would require more complex mocking
      expect(sentryLogger).toBeInstanceOf(BrowserLogger)
    })

    it('should create DataDog logger with hooks', () => {
      const datadogLogger = createDatadogLogger({
        level: 'warn',
        enableConsole: false,
        enableInProduction: true,
      })

      expect(datadogLogger).toBeInstanceOf(BrowserLogger)
    })

    it('should create LogRocket logger with hooks', () => {
      const logRocketLogger = createLogRocketLogger({
        level: 'info',
        enableConsole: false,
        enableInProduction: true,
      })

      expect(logRocketLogger).toBeInstanceOf(BrowserLogger)
    })
  })

  describe('Resource Cleanup', () => {
    it('should cleanup resources on destroy', () => {
      const logger = new BrowserLogger({
        flushInterval: 1000,
      })

      logger.destroy()

      // Timer should be cleared
      vi.advanceTimersByTime(1000)
      expect(mockFetch).not.toHaveBeenCalled()
    })
  })

  describe('Edge Cases', () => {
    it('should handle missing fetch gracefully', async () => {
      Object.defineProperty(global, 'fetch', {
        value: undefined,
        writable: true,
      })

      const logger = new BrowserLogger({
        level: 'info',
        remoteEndpoint: 'https://api.example.com/logs',
        batchSize: 1,
        enableConsole: false,
      })

      // Should not throw
      expect(() => logger.info('Test message')).not.toThrow()
    })

    it('should handle missing performance API gracefully', () => {
      Object.defineProperty(global, 'performance', {
        value: undefined,
        writable: true,
      })

      const logger = new BrowserLogger({
        enablePerformance: true,
      })

      // Should not throw
      expect(() => logger.mark('test')).not.toThrow()
      expect(() => logger.measure('test', 'start')).not.toThrow()
    })

    it('should handle invalid stack traces gracefully', () => {
      const originalError = Error
      const MockError = class extends originalError {
        constructor(message?: string) {
          super(message)
          this.stack = undefined
        }
      } as ErrorConstructor

      Object.defineProperty(global, 'Error', {
        value: MockError,
        writable: true,
        configurable: true,
      })

      const logger = new BrowserLogger({
        level: 'info',
        enableConsole: true,
      })

      // Should not throw
      expect(() => logger.info('Test message')).not.toThrow()

      Object.defineProperty(global, 'Error', {
        value: originalError,
        writable: true,
        configurable: true,
      })
    })
  })
})

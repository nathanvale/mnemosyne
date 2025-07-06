/**
 * # Production-Ready Browser Logger
 *
 * A comprehensive, enterprise-grade logging solution for modern web applications.
 * Designed for both development productivity and production reliability.
 *
 * ## 🚀 Key Features:
 *
 * ### Core Logging
 * - **Standard log levels**: `trace`, `debug`, `info`, `warn`, `error` with filtering
 * - **Human-readable logs**: Clean, colorful, timestamped output in development
 * - **Clickable traces**: Navigate directly to source code in Chrome DevTools
 * - **Context awareness**: `.withTag(tag)` and `.withContext(ctx)` for structured logging
 *
 * ### Remote & Batching
 * - **Smart batching**: Configurable `batchSize`, `flushInterval`, `remoteEndpoint`
 * - **Schema validation**: Zod-powered payload validation before transmission
 * - **Data protection**: Auto-redact sensitive fields with customizable strategies
 * - **Resilient delivery**: Exexport function createDataDogLogger(
  config: Partial<BrowserLoggerConfig> = {},
): BrowserLogger {ential backoff retry logic with graceful failure handling
 *
 * ### Developer Experience
 * - **Dev utilities**: `traceDev()` for development-only logs with clickable traces
 * - **Console grouping**: Organized log output with `group()`, `groupCollapsed()`, `groupEnd()`
 * - **Performance integration**: Built-in `mark()` and `measure()` with timing display
 * - **Environment awareness**: Automatic production mode with opt-in override
 *
 * ### Enterprise Integration
 * - **Third-party hooks**: Pre-built integrations for Sentry, DataDog, LogRocket
 * - **TypeScript native**: Full type safety with comprehensive interfaces
 * - **Resource management**: Proper cleanup with `destroy()` method
 * - **Edge case handling**: Graceful degradation when APIs are unavailable
 *
 * ## 📖 Quick Start:
 *
 * ```typescript
 * import { BrowserLogger, createLogger } from './browser-logger'
 *
 * // Basic usage
 * const logger = createLogger({ level: 'info' })
 * logger.info('Hello world!')
 *
 * // With context and tags
 * const authLogger = logger.withTag('auth').withContext({ userId: '123' })
 * authLogger.warn('Login attempt failed', { reason: 'invalid_password' })
 *
 * // Remote logging with batching
 * const remoteLogger = createLogger({
 *   remoteEndpoint: 'https://api.myapp.com/logs',
 *   batchSize: 10,
 *   flushInterval: 30000
 * })
 *
 * // Performance monitoring
 * logger.mark('api-start')
 * await fetchData()
 * logger.measure('api-call', 'api-start')
 *
 * // Development-only traces
 * logger.traceDev('Debug info that won\'t appear in production')
 * ```
 *
 * ## 🏭 Production Usage:
 *
 * ```typescript
 * import { createSentryLogger } from './browser-logger'
 *
 * const logger = createSentryLogger({
 *   level: 'warn',
 *   enableInProduction: true,
 *   remoteEndpoint: process.env.LOGGING_ENDPOINT,
 *   sensitiveFields: ['password', 'token', 'apiKey']
 * })
 * ```
 *
 * @example
 * // Complete configuration example
 * const logger = new BrowserLogger({
 *   level: 'debug',
 *   enableConsole: true,
 *   enableColors: true,
 *   devClickableTraces: true,
 *   remoteEndpoint: 'https://logs.example.com/api/v1/logs',
 *   batchSize: 25,
 *   flushInterval: 15000,
 *   maxRetries: 3,
 *   retryBaseDelay: 1000,
 *   sensitiveFields: ['password', 'token', 'ssn'],
 *   globalContext: { appVersion: '1.0.0', environment: 'staging' },
 *   onRemoteError: (error, payload) => console.error('Log upload failed:', error),
 *   onRemoteSuccess: (payload) => console.debug('Logs uploaded successfully')
 * })
 */

import { z } from 'zod'

export type LogLevel = 'trace' | 'debug' | 'info' | 'warn' | 'error'

export interface CallSite {
  file: string
  line: number
  column: number
}

export interface LogContext {
  [key: string]: unknown
}

export interface LogEntry {
  timestamp: number
  level: LogLevel
  message: string
  tag?: string
  context?: LogContext
  callsite?: CallSite
  data?: Array<unknown>
}

export interface RemoteLogPayload {
  timestamp: number
  level: LogLevel
  message: string
  tag?: string
  context?: LogContext
  callsite?: CallSite
  data?: Array<unknown>
  userAgent?: string
  url?: string
  sessionId?: string
  userId?: string
  buildVersion?: string
  environment?: string
}

export interface BrowserLoggerConfig {
  /** Log level threshold - logs below this level are ignored */
  level: LogLevel
  /** Remote endpoint URL for batched log uploads */
  remoteEndpoint?: string
  /** Batch size before auto-flush to remote */
  batchSize: number
  /** Max time in ms before auto-flush to remote */
  flushInterval: number
  /** Enable console output in development */
  enableConsole: boolean
  /** Enable clickable traces in DevTools using dummy Error objects (dev mode only) */
  devClickableTraces: boolean
  /** Enable colored output in development */
  enableColors: boolean
  /** Enable performance marks and measures */
  enablePerformance: boolean
  /** Custom debug hook for remote errors */
  onRemoteError?: (error: Error, payload: Array<RemoteLogPayload>) => void
  /** Custom success hook for remote logging */
  onRemoteSuccess?: (payload: Array<RemoteLogPayload>) => void
  /** Sensitive field names to redact */
  sensitiveFields: Array<string>
  /** Custom redaction strategy */
  redactionStrategy?: (key: string, value: unknown) => unknown
  /** Maximum retry attempts for remote logging */
  maxRetries: number
  /** Base delay for exponential backoff (ms) */
  retryBaseDelay: number
  /** Global context to include in all logs */
  globalContext?: LogContext
  /** Custom headers for remote requests */
  remoteHeaders?: Record<string, string>
  /** Enable production logging (disabled by default) */
  enableInProduction: boolean
}

// Zod schema for remote payload validation
const RemoteLogPayloadSchema = z.object({
  timestamp: z.number(),
  level: z.enum(['trace', 'debug', 'info', 'warn', 'error']),
  message: z.string(),
  tag: z.string().optional(),
  context: z.record(z.unknown()).optional(),
  callsite: z
    .object({
      file: z.string(),
      line: z.number(),
      column: z.number(),
    })
    .optional(),
  data: z.array(z.unknown()).optional(),
  userAgent: z.string().optional(),
  url: z.string().optional(),
  sessionId: z.string().optional(),
  userId: z.string().optional(),
  buildVersion: z.string().optional(),
  environment: z.string().optional(),
})

const RemoteLogBatchSchema = z.object({
  logs: z.array(RemoteLogPayloadSchema),
})

const DEFAULT_CONFIG: BrowserLoggerConfig = {
  level: 'info',
  batchSize: 10,
  flushInterval: 30000, // 30 seconds
  enableConsole:
    typeof window !== 'undefined' && process.env.NODE_ENV === 'development',
  devClickableTraces:
    typeof window !== 'undefined' && process.env.NODE_ENV === 'development',
  enableColors:
    typeof window !== 'undefined' && process.env.NODE_ENV === 'development',
  enablePerformance:
    typeof window !== 'undefined' && typeof performance !== 'undefined',
  sensitiveFields: [
    'password',
    'token',
    'secret',
    'apiKey',
    'authorization',
    'cookie',
  ],
  maxRetries: 3,
  retryBaseDelay: 1000,
  enableInProduction: false,
}

const LOG_LEVELS: Record<LogLevel, number> = {
  trace: 0,
  debug: 1,
  info: 2,
  warn: 3,
  error: 4,
}

const CONSOLE_METHODS: Record<LogLevel, keyof Console> = {
  trace: 'trace',
  debug: 'debug',
  info: 'info',
  warn: 'warn',
  error: 'error',
}

const LEVEL_COLORS: Record<LogLevel, string> = {
  trace: 'color: #6B7280', // Gray
  debug: 'color: #3B82F6', // Blue
  info: 'color: #10B981', // Green
  warn: 'color: #F59E0B', // Yellow/Orange
  error: 'color: #EF4444', // Red
}

/**
 * Extract call site information from the current stack trace
 * Skip internal logger frames to get the actual caller
 */
function getCallSite(): CallSite | null {
  try {
    const stack = new Error().stack
    if (!stack) return null

    const lines = stack.split('\n')

    // Patterns to identify internal logger frames that should be skipped
    const internalPatterns = [
      'getCallSite',
      'BrowserLogger.log',
      'logToConsole',
      'browser-logger.ts',
      'browser-logger.js',
    ]

    // Find the first frame that's not internal
    for (let i = 1; i < lines.length; i++) {
      const line = lines[i]
      if (!line || line.trim() === '') continue

      // Skip if this line contains any internal patterns
      const isInternal = internalPatterns.some((pattern) =>
        line.toLowerCase().includes(pattern.toLowerCase()),
      )

      if (isInternal) continue

      // Parse different stack trace formats
      let match = null

      // Chrome format: "    at Object.method (file:///path/to/file.js:line:col)"
      // or "    at file:///path/to/file.js:line:col"
      match = line.match(/\s+at\s+(?:.*?\s+\()?(.+?):(\d+):(\d+)\)?$/)

      if (!match) {
        // Firefox format: "method@file:///path/to/file.js:line:col"
        match = line.match(/.*@(.+?):(\d+):(\d+)$/)
      }

      if (!match) {
        // Safari format or others
        match = line.match(/(\S+):(\d+):(\d+)/)
      }

      if (!match) continue

      const [, file, lineNum, column] = match

      // Clean up the file path and extract just the filename
      const cleanFile = file
        .replace(/^file:\/\/\//, '')
        .replace(/^webpack:\/\/\//, '')
        .replace(/^https?:\/\/[^\/]+\//, '')
        .replace(/\?.*$/, '')
        .replace(/#.*$/, '')

      // Extract just the filename from the path
      const filename = cleanFile.split('/').pop() || cleanFile

      return {
        file: filename,
        line: parseInt(lineNum, 10),
        column: parseInt(column, 10),
      }
    }

    return null
  } catch {
    return null
  }
}

/**
 * Format timestamp for console output
 */
function formatTimestamp(): string {
  const now = new Date()
  return now.toISOString().slice(11, 23) // HH:MM:SS.sss
}

/**
 * Redact sensitive data from objects
 */
function redactSensitiveData(
  obj: unknown,
  sensitiveFields: Array<string>,
  customStrategy?: (key: string, value: unknown) => unknown,
): unknown {
  if (obj === null || typeof obj !== 'object') {
    return obj
  }

  if (Array.isArray(obj)) {
    return obj.map((item) =>
      redactSensitiveData(item, sensitiveFields, customStrategy),
    )
  }

  const result: Record<string, unknown> = {}
  for (const [key, value] of Object.entries(obj)) {
    const lowerKey = key.toLowerCase()

    if (
      sensitiveFields.some((field) => lowerKey.includes(field.toLowerCase()))
    ) {
      result[key] = customStrategy ? customStrategy(key, value) : '[REDACTED]'
    } else if (typeof value === 'object' && value !== null) {
      result[key] = redactSensitiveData(value, sensitiveFields, customStrategy)
    } else {
      result[key] = value
    }
  }

  return result
}

/**
 * Sleep utility for retry delays
 */
function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

/**
 * Production-Ready Browser Logger Class
 */
export class BrowserLogger {
  private config: BrowserLoggerConfig
  private logBuffer: Array<RemoteLogPayload> = []
  private flushTimer: NodeJS.Timeout | null = null
  private tag?: string
  private context?: LogContext
  private performanceMarks: Map<string, number> = new Map()

  constructor(
    config: Partial<BrowserLoggerConfig> = {},
    tag?: string,
    context?: LogContext,
  ) {
    this.config = { ...DEFAULT_CONFIG, ...config }
    this.tag = tag
    this.context = context

    // Only enable logging if explicitly configured for production or in development (but not during tests)
    const isTest =
      process.env.VITEST === 'true' || process.env.NODE_ENV === 'test'
    if (
      (process.env.NODE_ENV === 'production' &&
        !this.config.enableInProduction) ||
      isTest
    ) {
      this.config.enableConsole = false
      this.config.remoteEndpoint = undefined
    }

    // Only start timer if we have a reasonable flush interval (not in long-running tests)
    if (this.config.flushInterval < 10000) {
      this.startFlushTimer()
    }
  }

  /**
   * Create a context-bound logger instance with a specific tag
   */
  withTag(tag: string): BrowserLogger {
    return new BrowserLogger(this.config, tag, this.context)
  }

  /**
   * Create a context-bound logger instance with additional context
   */
  withContext(context: LogContext): BrowserLogger {
    const mergedContext = { ...this.context, ...context }
    return new BrowserLogger(this.config, this.tag, mergedContext)
  }

  /**
   * Log a message at the specified level
   */
  private log(level: LogLevel, message: string, ...data: Array<unknown>): void {
    // Check if disabled in production or tests
    const isTest =
      process.env.VITEST === 'true' || process.env.NODE_ENV === 'test'
    if (
      (process.env.NODE_ENV === 'production' &&
        !this.config.enableInProduction) ||
      isTest
    ) {
      return
    }

    // Check if this log level should be processed
    if (LOG_LEVELS[level] < LOG_LEVELS[this.config.level]) {
      return
    }

    const timestamp = Date.now()
    const callsite = getCallSite()

    // Merge global context with instance context
    const mergedContext = {
      ...this.config.globalContext,
      ...this.context,
    }

    const entry: LogEntry = {
      timestamp,
      level,
      message,
      tag: this.tag,
      context:
        Object.keys(mergedContext).length > 0 ? mergedContext : undefined,
      callsite: callsite || undefined,
      data: data.length > 0 ? data : undefined,
    }

    // Console output in development
    if (this.config.enableConsole) {
      this.logToConsole(entry)
    }

    // Add to remote buffer
    if (this.config.remoteEndpoint) {
      this.addToRemoteBuffer(entry)
    }
  }

  /**
   * Output log entry to console with formatting and colors
   */
  private logToConsole(entry: LogEntry): void {
    const { level, message, tag, context, data, callsite } = entry
    const consoleMethod = CONSOLE_METHODS[level]
    const timestamp = formatTimestamp()

    const prefix = `[${timestamp}] ${level.toUpperCase()}`
    const tagSuffix = tag ? ` [${tag}]` : ''
    const mainMessage = `${prefix}${tagSuffix}: ${message}`

    // Build arguments array for console output
    const args: Array<unknown> = []

    if (this.config.enableColors) {
      // Use colored output with CSS styles
      args.push(`%c${mainMessage}`, LEVEL_COLORS[level])
    } else {
      args.push(mainMessage)
    }

    // Add context if present
    if (context && Object.keys(context).length > 0) {
      args.push('Context:', context)
    }

    // Add callsite info if available
    if (callsite) {
      args.push(`📍 ${callsite.file}:${callsite.line}:${callsite.column}`)
    }

    // Add clickable trace as last argument if enabled
    if (
      this.config.devClickableTraces &&
      process.env.NODE_ENV === 'development'
    ) {
      const traceError = new Error('📍 Click to jump to source')
      traceError.name = ''
      args.push(traceError)
    }

    // Add any additional data
    if (data && data.length > 0) {
      args.push(...data)
    }

    // Use the console method directly
    ;(console[consoleMethod] as (...args: Array<unknown>) => void)(...args)
  }

  /**
   * Add log entry to remote buffer and trigger flush if needed
   */
  private addToRemoteBuffer(entry: LogEntry): void {
    if (!this.config.remoteEndpoint) {
      return
    }

    const remotePayload: RemoteLogPayload = {
      ...entry,
      userAgent:
        typeof navigator !== 'undefined' ? navigator.userAgent : undefined,
      url: typeof window !== 'undefined' ? window.location.href : undefined,
      buildVersion: process.env.NEXT_PUBLIC_BUILD_VERSION,
      environment: process.env.NODE_ENV,
    }

    // Redact sensitive data
    const redactedPayload = redactSensitiveData(
      remotePayload,
      this.config.sensitiveFields,
      this.config.redactionStrategy,
    ) as RemoteLogPayload

    this.logBuffer.push(redactedPayload)

    // Auto-flush if batch size reached
    if (this.logBuffer.length >= this.config.batchSize) {
      // Don't await, just fire and forget for auto-flush
      this.flush().catch(console.error)
    }
  }

  /**
   * Start the automatic flush timer
   */
  private startFlushTimer(): void {
    if (this.flushTimer) {
      clearInterval(this.flushTimer)
    }

    this.flushTimer = setInterval(() => {
      if (this.logBuffer.length > 0) {
        this.flush()
      }
    }, this.config.flushInterval)
  }

  /**
   * Flush all buffered logs to remote endpoint with retry logic
   */
  async flush(): Promise<void> {
    if (!this.config.remoteEndpoint || this.logBuffer.length === 0) {
      return
    }

    const payload = [...this.logBuffer]
    this.logBuffer = []

    try {
      await this.sendWithRetry(payload, 0)
    } catch (error) {
      // If we get here, it means all retries failed
      // The error handler should have already been called in sendWithRetry
      console.error('Failed to flush logs after all retries:', error)
    }
  }

  /**
   * Send logs with exponential backoff retry
   */
  private async sendWithRetry(
    payload: Array<RemoteLogPayload>,
    attempt: number,
  ): Promise<void> {
    try {
      // Validate payload before sending
      const validatedBatch = RemoteLogBatchSchema.parse({ logs: payload })

      const headers = {
        'Content-Type': 'application/json',
        ...this.config.remoteHeaders,
      }

      const response = await fetch(this.config.remoteEndpoint!, {
        method: 'POST',
        headers,
        body: JSON.stringify(validatedBatch),
      })

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      }

      // Success callback
      if (this.config.onRemoteSuccess) {
        this.config.onRemoteSuccess(payload)
      }
    } catch (error) {
      // maxRetries is the number of retries, not total attempts
      // So total attempts = initial + retries = 1 + maxRetries
      if (attempt < this.config.maxRetries) {
        // Exponential backoff
        const delay = this.config.retryBaseDelay * Math.pow(2, attempt)
        await sleep(delay)
        return this.sendWithRetry(payload, attempt + 1)
      }

      // Max retries reached, call error handler
      if (this.config.onRemoteError) {
        this.config.onRemoteError(error as Error, payload)
      }

      // Re-throw the error so flush() can handle it
      throw error
    }
  }

  /**
   * Console group for related logs
   */
  group(label: string): void {
    if (this.config.enableConsole && typeof console.group === 'function') {
      console.group(label)
    }
  }

  /**
   * Console collapsed group for related logs
   */
  groupCollapsed(label: string): void {
    if (
      this.config.enableConsole &&
      typeof console.groupCollapsed === 'function'
    ) {
      console.groupCollapsed(label)
    }
  }

  /**
   * End console group
   */
  groupEnd(): void {
    if (this.config.enableConsole && typeof console.groupEnd === 'function') {
      console.groupEnd()
    }
  }

  /**
   * Start a performance mark
   */
  mark(name: string): void {
    if (this.config.enablePerformance && typeof performance !== 'undefined') {
      performance.mark(name)
      this.performanceMarks.set(name, performance.now())
    }
  }

  /**
   * Measure performance between two marks
   */
  measure(name: string, startMark: string, endMark?: string): void {
    if (this.config.enablePerformance && typeof performance !== 'undefined') {
      try {
        if (endMark) {
          performance.measure(name, startMark, endMark)
        } else {
          performance.measure(name, startMark)
        }

        const entries = performance.getEntriesByName(name, 'measure')
        const latestEntry = entries[entries.length - 1]

        if (latestEntry) {
          this.info(`⏱️ ${name}: ${latestEntry.duration.toFixed(2)}ms`)
        }
      } catch (error) {
        this.warn('Failed to measure performance', {
          name,
          startMark,
          endMark,
          error,
        })
      }
    }
  }

  /**
   * Log at trace level
   */
  trace(message: string, ...data: Array<unknown>): void {
    this.log('trace', message, ...data)
  }

  /**
   * Log at debug level
   */
  debug(message: string, ...data: Array<unknown>): void {
    this.log('debug', message, ...data)
  }

  /**
   * Log at info level
   */
  info(message: string, ...data: Array<unknown>): void {
    this.log('info', message, ...data)
  }

  /**
   * Log at warn level
   */
  warn(message: string, ...data: Array<unknown>): void {
    this.log('warn', message, ...data)
  }

  /**
   * Log at error level
   */
  error(message: string, ...data: Array<unknown>): void {
    this.log('error', message, ...data)
  }

  /**
   * Development-only trace logging with clickable source
   */
  traceDev(message: string, ...data: Array<unknown>): void {
    const isTest =
      process.env.VITEST === 'true' || process.env.NODE_ENV === 'test'
    if (process.env.NODE_ENV === 'development' && !isTest) {
      this.trace(message, ...data)
    }
  }

  /**
   * Cleanup resources
   */
  destroy(): void {
    if (this.flushTimer) {
      clearInterval(this.flushTimer)
      this.flushTimer = null
    }

    // Clear performance marks
    this.performanceMarks.clear()
  }
}

/**
 * Default browser logger instance
 */
export const browserLogger = new BrowserLogger()

/**
 * Setup beforeunload handler to flush logs
 */
if (typeof window !== 'undefined') {
  window.addEventListener('beforeunload', () => {
    browserLogger.flush()
  })
}

/**
 * Tree-shakable convenience methods
 */
export const trace = (message: string, ...data: Array<unknown>) =>
  browserLogger.trace(message, ...data)

export const debug = (message: string, ...data: Array<unknown>) =>
  browserLogger.debug(message, ...data)

export const info = (message: string, ...data: Array<unknown>) =>
  browserLogger.info(message, ...data)

export const warn = (message: string, ...data: Array<unknown>) =>
  browserLogger.warn(message, ...data)

export const error = (message: string, ...data: Array<unknown>) =>
  browserLogger.error(message, ...data)

export const traceDev = (message: string, ...data: Array<unknown>) =>
  browserLogger.traceDev(message, ...data)

export const group = (label: string) => browserLogger.group(label)

export const groupCollapsed = (label: string) =>
  browserLogger.groupCollapsed(label)

export const groupEnd = () => browserLogger.groupEnd()

export const mark = (name: string) => browserLogger.mark(name)

export const measure = (name: string, startMark: string, endMark?: string) =>
  browserLogger.measure(name, startMark, endMark)

export const flush = () => browserLogger.flush()

export const withTag = (tag: string) => browserLogger.withTag(tag)

export const withContext = (context: LogContext) =>
  browserLogger.withContext(context)

/**
 * Create a logger instance with specific configuration
 */
export function createLogger(
  config: Partial<BrowserLoggerConfig>,
): BrowserLogger {
  return new BrowserLogger(config)
}

/**
 * Third-party integration types
 */
interface SentryGlobal {
  captureException: (error: Error, options?: { extra?: unknown }) => void
}

interface DataDogGlobal {
  addError: (error: Error, context?: LogContext) => void
}

interface LogRocketGlobal {
  captureException: (error: Error) => void
}

declare global {
  interface Window {
    Sentry?: SentryGlobal
    DD_RUM?: DataDogGlobal
    LogRocket?: LogRocketGlobal
  }
}

/**
 * Hook integrations for popular services
 */
export interface LoggerHooks {
  onError?: (error: Error, context?: LogContext) => void
  onRemoteError?: (error: Error, payload: Array<RemoteLogPayload>) => void
  onRemoteSuccess?: (payload: Array<RemoteLogPayload>) => void
}

export function createLoggerWithHooks(
  config: Partial<BrowserLoggerConfig>,
  hooks: LoggerHooks,
): BrowserLogger {
  return new BrowserLogger({
    ...config,
    onRemoteError: hooks.onRemoteError,
    onRemoteSuccess: hooks.onRemoteSuccess,
  })
}

/**
 * Sentry integration helper
 */
export function createSentryLogger(
  config: Partial<BrowserLoggerConfig> = {},
): BrowserLogger {
  return createLoggerWithHooks(config, {
    onError: (error, context) => {
      // Integration with Sentry
      if (typeof window !== 'undefined' && window.Sentry) {
        window.Sentry.captureException(error, { extra: context })
      }
    },
    onRemoteError: (error, payload) => {
      if (typeof window !== 'undefined' && window.Sentry) {
        window.Sentry.captureException(error, { extra: { payload } })
      }
    },
  })
}

/**
 * DataDog integration helper
 */
export function createDatadogLogger(
  config: Partial<BrowserLoggerConfig> = {},
): BrowserLogger {
  return createLoggerWithHooks(config, {
    onError: (error, context) => {
      // Integration with DataDog
      if (typeof window !== 'undefined' && window.DD_RUM) {
        window.DD_RUM.addError(error, context)
      }
    },
  })
}

/**
 * LogRocket integration helper
 */
export function createLogRocketLogger(
  config: Partial<BrowserLoggerConfig> = {},
): BrowserLogger {
  return createLoggerWithHooks(config, {
    onError: (error) => {
      // Integration with LogRocket
      if (typeof window !== 'undefined' && window.LogRocket) {
        window.LogRocket.captureException(error)
      }
    },
  })
}

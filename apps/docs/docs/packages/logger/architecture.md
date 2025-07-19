# 🏛️ Logger Package Architecture

This document provides deep technical details about the `@studio/logger` package implementation, internal structure, and architectural decisions.

## 🎯 Overview

The `@studio/logger` package implements a **smart environment-aware logging system** that automatically detects and adapts to different execution contexts (development, production, CI). The architecture uses intelligent environment detection, preset factory functions, and automatic configuration to provide optimal logging for each scenario with **zero manual configuration**.

## 📦 Package Structure

```
packages/logger/
├── src/
│   ├── lib/
│   │   ├── logger.ts              # Main unified interface
│   │   ├── stacktrace.ts          # Callsite extraction (Node.js)
│   │   ├── browser-logger.ts      # Browser-specific implementation
│   │   ├── types.ts               # Shared TypeScript interfaces
│   │   └── __tests__/             # Comprehensive test suite
│   └── index.ts                   # Public API exports
├── package.json                   # Dependencies and build config
└── tsconfig.json                  # TypeScript configuration
```

## 🔧 Core Architecture Patterns

### Smart Environment Detection Strategy

The logger uses intelligent environment detection to automatically configure itself:

```typescript
type LoggerMode = 'debug' | 'production' | 'cli'

function getDefaultMode(): LoggerMode {
  // Environment variable override takes precedence
  const envMode = process.env.LOGGER_MODE as LoggerMode
  if (envMode && ['debug', 'production', 'cli'].includes(envMode)) {
    return envMode
  }

  // Auto-detect based on NODE_ENV and context
  if (process.env.NODE_ENV === 'development') return 'debug'
  if (process.env.NODE_ENV === 'production') return 'production'
  if (process.env.CI || (process.stdout && !process.stdout.isTTY)) {
    return 'production' // Structured logs for CI/automation
  }

  // Safe default
  return 'production'
}
```

### Preset Factory Functions

Three optimized preset functions provide common logging configurations:

```typescript
// 🖥️ CLI-friendly logger - pretty print without noise
export function cli(config: Partial<NodeLoggerConfig> = {}): NodeLogger {
  return createLogger({
    level: 'info',
    prettyPrint: true,
    includeCallsite: false, // Clean output for end users
    ...config,
  })
}

// 🐛 Debug logger - full diagnostics with clickable traces
export function debug(config: Partial<NodeLoggerConfig> = {}): NodeLogger {
  return createLogger({
    level: 'debug',
    prettyPrint: true,
    includeCallsite: true, // IDE-friendly callsite links
    ...config,
  })
}

// 🏭 Production logger - structured JSON for monitoring
export function production(config: Partial<NodeLoggerConfig> = {}): NodeLogger {
  return createLogger({
    level: 'info',
    prettyPrint: false, // JSON output for log aggregation
    includeCallsite: true,
    ...config,
  })
}
```

### Auto-Detecting Default Export

The main logger automatically selects the best configuration:

```typescript
// Smart default that auto-detects environment
const logger = createLogger() // Uses getDefaultMode() internally

// Equivalent manual configuration based on detected environment
const logger =
  NODE_ENV === 'development'
    ? debug()
    : NODE_ENV === 'production'
      ? production()
      : cli()

export default logger
```

## 🖥️ Node.js Implementation Details

### Enhanced Pino Integration

The Node.js logger uses Pino with intelligent configuration based on mode:

```typescript
import pino from 'pino'
import pretty from 'pino-pretty'

function createNodeLogger(config: NodeLoggerConfig): NodeLogger {
  const pinoConfig: pino.LoggerOptions = {
    level: config.level || 'info',
    formatters: {
      level: (label) => ({ level: label }),
    },
    timestamp: config.prettyPrint ? false : pino.stdTimeFunctions.isoTime,
  }

  // Smart transport configuration based on pretty print mode
  const stream = config.prettyPrint
    ? pretty({
        colorize: true,
        translateTime: false, // No timestamps in pretty mode
        ignore: 'pid,hostname,time', // Clean output
        messageFormat: (log, messageKey) => {
          const callsiteInfo = log.callsite
            ? ` 📍 ${log.callsite.file}:${log.callsite.line}:${log.callsite.column}`
            : ''
          return `${log[messageKey]}${callsiteInfo}`
        },
      })
    : process.stdout

  return new NodeLogger(pino(pinoConfig, stream), config)
}
```

### Enhanced Callsite Tracking Implementation

Accurate callsite information is extracted using stacktracey with IDE-friendly formatting:

```typescript
import StackTracey from 'stacktracey'

export function getCallsite(): CallsiteInfo | null {
  try {
    const stack = new StackTracey()

    // Skip internal logger frames to find actual caller
    const relevantFrame = stack.items.find(
      (frame) =>
        frame.file &&
        !frame.file.includes('logger.ts') &&
        !frame.file.includes('stacktrace.ts') &&
        !frame.file.includes('node_modules'),
    )

    if (!relevantFrame) return null

    const file = getRelativePath(relevantFrame.file)
    const line = relevantFrame.line || 0
    const column = relevantFrame.column || 0

    return {
      file,
      line,
      column,
      // IDE-friendly clickable link format
      callsiteLink: `${file}:${line}:${column}`,
    }
  } catch (error) {
    // Graceful fallback if callsite extraction fails
    return null
  }
}

function getRelativePath(absolutePath: string): string {
  const projectRoot = process.cwd()
  return path.relative(projectRoot, absolutePath)
}
```

### Unified Node.js Logger with Context Support

The Node.js logger now supports the unified API with `withTag()` and `withContext()` methods:

```typescript
class NodeLogger implements Logger {
  constructor(
    private pino: pino.Logger,
    private tags: string[] = [],
    private context: LogContext = {},
  ) {}

  info(message: string, context?: LogContext): void {
    const mergedContext = { ...this.context, ...context }
    const logData = {
      ...mergedContext,
      ...(this.tags.length > 0 && { tags: this.tags }),
      callsite: getCallsite(),
    }

    this.pino.info(logData, message)
  }

  withTag(tag: string): Logger {
    return new NodeLogger(this.pino, [...this.tags, tag], this.context)
  }

  withContext(context: LogContext): Logger {
    return new NodeLogger(this.pino, this.tags, { ...this.context, ...context })
  }
}
```

### Environment Variable Overrides

Fine-grained control through environment variables:

```typescript
// Override logger mode
LOGGER_MODE=debug npm start
LOGGER_MODE=cli npm run build
LOGGER_MODE=production npm test

// Override log level
LOG_LEVEL=trace npm run dev
LOG_LEVEL=error npm run prod

// Override specific features
LOGGER_PRETTY_PRINT=false npm start
LOGGER_INCLUDE_CALLSITE=true npm run build
```

## 🌐 Browser Implementation Details

### Enhanced Console with Clickable Links

The browser logger enhances the native console with IDE-friendly clickable callsite links:

```typescript
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

  // Add callsite info with Chrome-optimized clickable format
  if (callsite) {
    if (
      this.config.devClickableTraces &&
      process.env.NODE_ENV === 'development'
    ) {
      // Create Error object for guaranteed Chrome clickability
      const clickableTrace = new Error()
      clickableTrace.name = ''
      clickableTrace.message = `📍 ${callsite.file}:${callsite.line}:${callsite.column}`
      args.push(clickableTrace)
    } else {
      // Fallback string format - often clickable in Chrome
      args.push(`📍 ${callsite.file}:${callsite.line}:${callsite.column}`)
    }
  }

  // Add any additional data
  if (data && data.length > 0) {
    args.push(...data)
  }

  // Use the console method directly
  ;(console[consoleMethod] as (...args: Array<unknown>) => void)(...args)
}
```

### Remote Batching Architecture

Efficient log batching minimizes network requests:

```typescript
private addToRemoteBatch(entry: LogEntry): void {
  // Apply sensitive data redaction
  const redactedEntry = this.redactSensitiveData(entry)

  this.remoteBatch.push(redactedEntry)

  if (this.remoteBatch.length >= this.config.batchSize) {
    this.flushRemoteBatch()
  }
}

private async flushRemoteBatch(): void {
  if (this.remoteBatch.length === 0) return

  const batch = [...this.remoteBatch]
  this.remoteBatch = []

  try {
    await this.sendToRemote(batch)
    this.config.onRemoteSuccess?.(batch)
  } catch (error) {
    this.handleRemoteError(error, batch)
  }
}

private async sendToRemote(logs: LogEntry[]): Promise<void> {
  const response = await fetch(this.config.remoteEndpoint!, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      logs,
      metadata: {
        userAgent: navigator.userAgent,
        url: window.location.href,
        timestamp: new Date().toISOString(),
      },
    }),
  })

  if (!response.ok) {
    throw new Error(`Remote logging failed: ${response.status}`)
  }
}
```

### Retry Logic with Exponential Backoff

Failed remote requests are retried with exponential backoff:

```typescript
private async handleRemoteError(error: Error, logs: LogEntry[]): Promise<void> {
  const retryCount = (logs[0] as any)._retryCount || 0

  if (retryCount >= this.config.maxRetries) {
    this.config.onRemoteError?.(error, logs)
    return
  }

  // Exponential backoff: 1s, 2s, 4s, 8s...
  const delay = this.config.retryBaseDelay * Math.pow(2, retryCount)

  setTimeout(() => {
    const retriedLogs = logs.map(log => ({
      ...log,
      _retryCount: retryCount + 1,
    }))

    this.sendToRemote(retriedLogs).catch(retryError => {
      this.handleRemoteError(retryError, retriedLogs)
    })
  }, delay)
}
```

## 🔒 Security Architecture

### Sensitive Data Redaction

Automatic redaction prevents accidental logging of sensitive information:

```typescript
private redactSensitiveData(entry: LogEntry): LogEntry {
  if (!entry.context) return entry

  const redacted = { ...entry }
  redacted.context = this.deepRedact(entry.context)

  return redacted
}

private deepRedact(obj: any): any {
  if (typeof obj !== 'object' || obj === null) return obj

  const redacted: any = Array.isArray(obj) ? [] : {}

  for (const [key, value] of Object.entries(obj)) {
    if (this.isSensitiveField(key)) {
      redacted[key] = '[REDACTED]'
    } else if (typeof value === 'object') {
      redacted[key] = this.deepRedact(value)
    } else {
      redacted[key] = value
    }
  }

  return redacted
}

private isSensitiveField(fieldName: string): boolean {
  const sensitivePatterns = [
    /password/i,
    /token/i,
    /secret/i,
    /key/i,
    /auth/i,
    /credential/i,
    ...this.config.sensitiveFields.map(field => new RegExp(field, 'i'))
  ]

  return sensitivePatterns.some(pattern => pattern.test(fieldName))
}
```

## ⚡ Performance Optimizations

### Lazy Initialization

Logger components are initialized only when needed:

```typescript
class LazyLogger implements Logger {
  private _nodeLogger?: NodeLogger
  private _browserLogger?: BrowserLogger
  private environment = detectEnvironment()

  private get logger() {
    if (this.environment === 'node') {
      if (!this._nodeLogger) {
        this._nodeLogger = new NodeLogger(this.config)
      }
      return this._nodeLogger
    } else {
      if (!this._browserLogger) {
        this._browserLogger = new BrowserLogger(this.config)
      }
      return this._browserLogger
    }
  }

  info(message: string, context?: any) {
    this.logger.info(message, context)
  }
}
```

### Efficient Context Merging

Context objects are merged efficiently to avoid unnecessary object creation:

```typescript
export function withContext(baseContext: LogContext): Logger {
  // Implementation now handled by environment-specific logger classes
  return log.withContext(baseContext)
}

export function withTag(tag: string): Logger {
  // Implementation now handled by environment-specific logger classes
  return log.withTag(tag)
}
```

## 🧪 Testing Architecture

### Built-in Testing Utilities

The logger package provides comprehensive testing utilities:

```typescript
import {
  createMockLogger,
  createCapturingMockLogger,
  mockLoggerModule,
} from '@studio/logger/testing'

// Basic mock logger for simple tests
const mockLogger = createMockLogger()
expect(mockLogger.info).toHaveBeenCalledWith('Expected message', {
  userId: '123',
})

// Capturing mock for advanced testing scenarios
const capturingLogger = createCapturingMockLogger()
yourFunction(capturingLogger)
const calls = capturingLogger.getCalls()

// Module-level mocking
const { mockLog } = mockLoggerModule()
```

### Legacy Mock Strategy

For custom testing scenarios, environment-specific mocks can still be used:

```typescript
// Node.js tests mock Pino
vi.mock('pino', () => ({
  default: vi.fn(() => ({
    info: vi.fn(),
    error: vi.fn(),
    // ... other methods
  })),
}))

// Browser tests mock console and fetch
Object.defineProperty(window, 'console', {
  value: {
    log: vi.fn(),
    error: vi.fn(),
    // ... other methods
  },
})

global.fetch = vi.fn()
```

### Callsite Testing

Callsite accuracy is verified using controlled test scenarios:

```typescript
describe('callsite tracking', () => {
  it('should extract accurate file and line information', () => {
    const mockCallsite = vi.fn()

    // Call logger from known location
    log.info('test message') // This is line X

    expect(mockCallsite).toHaveBeenCalledWith(
      expect.objectContaining({
        file: expect.stringContaining('logger.test.ts'),
        line: X, // Exact line number
        column: expect.any(Number),
      }),
    )
  })
})
```

## 🔧 Configuration Architecture

### Environment-Based Auto-Configuration

Configuration adapts automatically with intelligent defaults and environment variable overrides:

```typescript
function getLoggerConfig(): NodeLoggerConfig {
  const mode = getDefaultMode() // 'debug' | 'production' | 'cli'
  const level = (process.env.LOG_LEVEL as LogLevel) || getDefaultLevel(mode)
  const prettyPrint = parseBooleanEnv(
    'LOGGER_PRETTY_PRINT',
    mode !== 'production',
  )
  const includeCallsite = parseBooleanEnv(
    'LOGGER_INCLUDE_CALLSITE',
    mode === 'debug',
  )

  return {
    level,
    prettyPrint,
    includeCallsite,
    globalContext: {
      environment: process.env.NODE_ENV || 'development',
      service: process.env.SERVICE_NAME,
      version: process.env.VERSION,
    },
    tags: [],
  }
}

function getDefaultLevel(mode: LoggerMode): LogLevel {
  switch (mode) {
    case 'debug':
      return 'debug'
    case 'production':
      return 'info'
    case 'cli':
      return 'info'
    default:
      return 'info'
  }
}

function parseBooleanEnv(envVar: string, defaultValue: boolean): boolean {
  const value = process.env[envVar]
  if (value === 'true') return true
  if (value === 'false') return false
  return defaultValue
}
```

### Runtime Configuration Updates

Logger configuration can be updated at runtime:

```typescript
export function updateLoggerConfig(updates: Partial<LoggerConfig>): void {
  Object.assign(globalConfig, updates)

  // Reinitialize logger instances with new config
  if (currentLogger) {
    currentLogger.updateConfig(globalConfig)
  }
}
```

## 🚀 Performance & Developer Experience Benefits

### Zero Configuration Setup

- **Auto-detection**: Automatically selects optimal configuration based on environment
- **Preset functions**: `cli()`, `debug()`, `production()` for common use cases
- **Smart defaults**: Reasonable defaults that work out of the box

### Development Productivity

- **IDE-friendly callsites**: Clickable `file:line:column` links in both Node.js and browser
- **Clean CLI output**: No timestamps or noise in pretty print mode
- **Rich debugging**: Full diagnostics in debug mode with enhanced error objects

### Production Ready

- **Structured logging**: JSON output for log aggregation and monitoring
- **Performance optimized**: Efficient batching and minimal overhead
- **Security conscious**: Automatic sensitive data redaction

### Flexible Control

- **Environment variables**: Override any configuration through environment variables
- **Preset customization**: Override any preset with additional configuration
- **Context chaining**: `logger.withTag('API').withContext({ userId })` for rich metadata

---

_This smart environment-aware architecture provides **zero-configuration simplicity** for common cases while maintaining **full flexibility** for advanced scenarios, ensuring optimal logging across development, testing, and production environments._

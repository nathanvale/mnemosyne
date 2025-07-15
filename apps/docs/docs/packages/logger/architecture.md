# 🏛️ Logger Package Architecture

This document provides deep technical details about the `@studio/logger` package implementation, internal structure, and architectural decisions.

## 🎯 Overview

The `@studio/logger` package implements a unified logging interface that automatically adapts to its runtime environment. The architecture uses environment detection and factory patterns to provide optimal logging for each context.

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

### Environment Detection Strategy

The logger uses runtime detection to determine the execution context:

```typescript
function detectEnvironment(): 'node' | 'browser' {
  if (typeof window !== 'undefined') {
    return 'browser'
  }
  if (typeof process !== 'undefined' && process.versions?.node) {
    return 'node'
  }
  // Fallback for edge cases
  return 'browser'
}
```

### Factory Pattern Implementation

The main logger uses a factory pattern to provide environment-specific implementations:

```typescript
export const log = createEnvironmentLogger()

function createEnvironmentLogger(): Logger {
  const env = detectEnvironment()

  if (env === 'node') {
    return createNodeLogger({
      level: getLogLevel(),
      enableCallsiteTracking: true,
      prettyPrint: isDevelopment(),
    })
  } else {
    return createBrowserLogger({
      level: getLogLevel(),
      enableConsole: true,
      enableColors: true,
      enableInProduction: false,
    })
  }
}
```

## 🖥️ Node.js Implementation Details

### Pino Integration

The Node.js logger uses Pino for high-performance structured logging:

```typescript
import pino from 'pino'
import pretty from 'pino-pretty'

function createNodeLogger(config: NodeLoggerConfig): Logger {
  const pinoConfig: pino.LoggerOptions = {
    level: config.level || 'info',
    formatters: {
      level: (label) => ({ level: label }),
    },
    timestamp: pino.stdTimeFunctions.isoTime,
  }

  // Pretty printing for development
  const stream = config.prettyPrint
    ? pretty({
        colorize: true,
        translateTime: 'HH:MM:ss.l',
        ignore: 'pid,hostname',
      })
    : process.stdout

  return pino(pinoConfig, stream)
}
```

### Callsite Tracking Implementation

Accurate callsite information is extracted using stacktracey:

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

    return {
      file: getRelativePath(relevantFrame.file),
      line: relevantFrame.line || 0,
      column: relevantFrame.column || 0,
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

### CLI Logger Variant - **Deprecated**

⚠️ **Deprecated**: Use `createLogger({ prettyPrint: true })` instead.

```typescript
// Old approach (deprecated)
export function createCliLogger(level: LogLevel = 'info'): Logger

// New unified approach
const cliLogger = createLogger({
  level: 'info',
  prettyPrint: true,
})
```

## 🌐 Browser Implementation Details

### Console Enhancement Strategy

The browser logger enhances the native console with additional features:

```typescript
class BrowserLogger implements Logger {
  private config: BrowserLoggerConfig
  private remoteBatch: LogEntry[] = []
  private flushTimer?: NodeJS.Timeout

  constructor(config: BrowserLoggerConfig) {
    this.config = {
      level: 'info',
      enableConsole: true,
      enableColors: true,
      batchSize: 50,
      flushInterval: 30000,
      ...config,
    }

    this.startBatchFlushTimer()
  }

  info(message: string, context?: LogContext): void {
    const entry = this.createLogEntry('info', message, context)

    if (this.config.enableConsole) {
      this.logToConsole(entry)
    }

    if (this.config.remoteEndpoint) {
      this.addToRemoteBatch(entry)
    }
  }

  withTag(tag: string): Logger {
    return new BrowserLogger(this.config, [...this.tags, tag], this.context)
  }

  withContext(context: LogContext): Logger {
    return new BrowserLogger(this.config, this.tags, {
      ...this.context,
      ...context,
    })
  }

  private logToConsole(entry: LogEntry): void {
    const style = this.getLevelStyle(entry.level)
    const timestamp = new Date(entry.timestamp).toLocaleTimeString()

    console.log(
      `%c[${entry.level.toUpperCase()} ${timestamp}] ${entry.message}`,
      style,
      ...(entry.context ? [entry.context] : []),
    )
  }
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

### Environment-Based Configuration

Configuration adapts automatically to the environment:

```typescript
function getDefaultConfig(): LoggerConfig {
  const isProduction = process.env.NODE_ENV === 'production'
  const isDevelopment = process.env.NODE_ENV === 'development'

  return {
    level: process.env.LOG_LEVEL || (isProduction ? 'warn' : 'debug'),
    enableConsole: !isProduction,
    enableColors: isDevelopment,
    enableInProduction: false,
    batchSize: isProduction ? 100 : 10,
    flushInterval: isProduction ? 60000 : 5000,
  }
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

---

_This architecture provides high performance, security, and flexibility while maintaining a simple, unified API across all environments._

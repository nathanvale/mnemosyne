# 📚 Logger API Reference

Complete API documentation for the `@studio/logger` package with TypeScript signatures, examples, and usage patterns.

## 🚀 Quick Start

```typescript
import { log, createLogger, createCliLogger } from '@studio/logger'

// Use the default logger (environment-adaptive)
log.info('Hello world', { userId: 123 })

// Create custom logger instances
const customLogger = createLogger({ level: 'debug' })
const cliLogger = createCliLogger('info')
```

## 🎯 Default Logger Interface

The main logger interface provides consistent methods across all environments.

### Basic Logging Methods

#### `log.trace(message, ...args)`

Detailed tracing information for debugging complex flows. Automatically includes callsite information.

```typescript
log.trace(msg: string, ...args: Array<unknown>): void
```

**Example:**

```typescript
// With context object as first argument
log.trace('Entering authentication flow', {
  userId: '123',
  method: 'oauth',
  timestamp: Date.now(),
})

// With additional arguments
log.trace('Processing data', data, 'additional info')
```

**Output (Node.js):**

```json
{
  "level": 10,
  "time": 1751793395218,
  "msg": "Entering authentication flow",
  "userId": "123",
  "method": "oauth",
  "callsite": { "file": "src/auth.ts", "line": 45, "column": 7 }
}
```

**Output (Browser):**

```
[TRACE 14:30:22] Entering authentication flow
  userId: "123"
  method: "oauth"
  📍 src/auth.ts:45:7
```

#### `log.debug(message, ...args)`

Development debugging information.

```typescript
log.debug(msg: string, ...args: Array<unknown>): void
```

**Example:**

```typescript
log.debug('Database query executed', {
  query: 'SELECT * FROM users',
  duration: 45,
  rowCount: 12,
})
```

#### `log.info(message, ...args)`

General informational messages.

```typescript
log.info(msg: string, ...args: Array<unknown>): void
```

**Example:**

```typescript
log.info('User logged in successfully', {
  userId: 'user_123',
  sessionId: 'sess_abc',
  loginMethod: 'password',
})
```

#### `log.warn(message, ...args)`

Warning messages that need attention.

```typescript
log.warn(msg: string, ...args: Array<unknown>): void
```

**Example:**

```typescript
log.warn('API rate limit approaching', {
  currentRequests: 95,
  limit: 100,
  resetTime: new Date('2024-01-15T15:00:00Z'),
})
```

#### `log.error(message, ...args)`

Error messages for failures and exceptions.

```typescript
log.error(msg: string, ...args: Array<unknown>): void
```

**Example:**

```typescript
log.error('Database connection failed', {
  error: error.message,
  host: 'localhost',
  port: 5432,
  retryCount: 3,
})
```

#### `log.fatal(message, ...args)`

Fatal error messages for critical failures.

```typescript
log.fatal(msg: string, ...args: Array<unknown>): void
```

**Example:**

```typescript
log.fatal('Application startup failed', {
  error: error.message,
  exitCode: 1,
})
```

### ⚠️ Environment-Specific Features

**Note**: The Node.js `log` object provides basic logging only. For advanced features like tags and context, use the browser logger or manually include context in your log calls.

#### Node.js Pattern (Current Implementation)

```typescript
import { log } from '@studio/logger'

// Basic logging with manual context
log.info('User action', {
  tag: 'AuthService',
  userId: '123',
  action: 'login',
})

// The context object is merged with callsite information automatically
log.error('Operation failed', {
  component: 'PaymentProcessor',
  error: error.message,
  retryCount: 3,
})
```

#### Browser Logger Advanced Features

For browser environments, use the BrowserLogger class which supports tags and context:

```typescript
import { createLogger } from '@studio/logger'

const logger = createLogger({ level: 'info' })

// Tags and context (browser only)
const authLogger = logger.withTag('AuthService')
authLogger.info('Password reset initiated')

const userLogger = logger.withContext({
  userId: '123',
  sessionId: 'abc',
})
userLogger.info('Profile updated')

// Chaining (browser only)
const requestLogger = logger.withTag('APIRequest').withContext({
  requestId: 'req_456',
  endpoint: '/api/users',
})
```

## 🏭 Factory Functions

### `createLogger(config)` (Browser Only)

Create a custom browser logger instance with specific configuration.

```typescript
function createLogger(config: BrowserLoggerConfig): BrowserLogger

interface LoggerConfig {
  // Core Settings
  level?: LogLevel // 'trace' | 'debug' | 'info' | 'warn' | 'error'
  enableConsole?: boolean // Enable console output (default: true)
  enableColors?: boolean // Enable colored output (default: true)
  enableInProduction?: boolean // Allow logging in production (default: false)

  // Development Features
  devClickableTraces?: boolean // Enable clickable source links (default: true)

  // Remote Logging (Browser only)
  remoteEndpoint?: string // URL for remote log uploads
  batchSize?: number // Logs per batch (default: 50)
  flushInterval?: number // Auto-flush interval in ms (default: 30000)
  maxRetries?: number // Max retry attempts (default: 3)
  retryBaseDelay?: number // Base retry delay in ms (default: 1000)

  // Data Handling
  sensitiveFields?: Array<string> // Fields to redact in remote logs
  customRedactionStrategy?: (obj: any) => any // Custom redaction logic

  // Performance
  enablePerformance?: boolean // Enable performance monitoring (default: false)

  // Context
  globalContext?: Record<string, any> // Context added to all logs

  // Callbacks
  onRemoteSuccess?: (logs: Array<any>) => void // Success callback
  onRemoteError?: (error: Error, logs: Array<any>) => void // Error callback
}
```

**Example:**

```typescript
const customLogger = createLogger({
  level: 'debug',
  enableColors: true,
  globalContext: {
    service: 'user-service',
    version: '1.2.0',
  },
  sensitiveFields: ['password', 'token', 'ssn'],
})

customLogger.info('Service started')
// Includes global context automatically
```

### `createCliLogger(level?)` (Node.js Only)

Create a CLI-friendly logger for scripts and command-line tools.

```typescript
function createCliLogger(level: pino.LevelWithSilent = 'info'): pino.Logger
```

**Example:**

```typescript
import { createCliLogger } from '@studio/logger'

const cliLogger = createCliLogger('debug')

cliLogger.info('Processing CSV file...')
cliLogger.debug('Found 1,250 rows')
cliLogger.warn('Skipping 3 invalid rows')
cliLogger.info('Import completed successfully')
```

**Output:**

```
[INFO 14:30:22] Processing CSV file...
[DEBUG 14:30:23] Found 1,250 rows
[WARN 14:30:24] Skipping 3 invalid rows
[INFO 14:30:25] Import completed successfully
```

## 🌐 Browser-Specific Features

### Console Grouping

#### `log.group(label)`

Start a collapsible group in the browser console.

```typescript
log.group(label: string): void
```

#### `log.groupCollapsed(label)`

Start a collapsed group in the browser console.

```typescript
log.groupCollapsed(label: string): void
```

#### `log.groupEnd()`

End the current console group.

```typescript
log.groupEnd(): void
```

**Example:**

```typescript
log.group('🎯 User Registration Flow')
log.info('Validating user input')
log.debug('Email format check passed')

log.groupCollapsed('🔒 Security Checks')
log.trace('Checking for existing account')
log.trace('Validating against blacklist')
log.groupEnd()

log.info('Creating user account')
log.groupEnd()
```

### Performance Monitoring

#### `log.mark(name)`

Create a performance mark for timing measurements.

```typescript
log.mark(name: string): void
```

#### `log.measure(name, startMark?)`

Measure duration between marks or from a mark to now.

```typescript
log.measure(name: string, startMark?: string): void
```

**Example:**

```typescript
log.mark('operation-start')

// Simulate some work
await processData()

log.mark('operation-middle')
await saveResults()

// Measure durations
log.measure('total-operation', 'operation-start')
log.measure('save-phase', 'operation-middle')
```

### Remote Logging Methods

#### `flushLogs()`

Manually flush pending logs to remote endpoint.

```typescript
logger.flushLogs(): Promise<void>
```

**Example:**

```typescript
// Log some messages
log.info('User action completed')
log.debug('Cache updated')

// Manually flush before page unload
await logger.flushLogs()
```

## 🎨 Browser Logger Factory Functions

### `createSentryLogger(config)`

Create a logger configured for Sentry integration.

```typescript
function createSentryLogger(config: Partial<LoggerConfig>): Logger
```

**Example:**

```typescript
const sentryLogger = createSentryLogger({
  level: 'error',
  enableInProduction: true,
})

sentryLogger.error('Payment processing failed', {
  userId: '123',
  amount: 99.99,
  error: error.message,
})
// Automatically sends to Sentry
```

### `createDatadogLogger(config)`

Create a logger configured for DataDog integration.

```typescript
function createDatadogLogger(config: Partial<LoggerConfig>): Logger
```

**Example:**

```typescript
const datadogLogger = createDatadogLogger({
  level: 'warn',
  remoteEndpoint: 'https://logs.datadoghq.com/api/logs',
  globalContext: {
    service: 'frontend',
    env: 'production',
  },
})
```

### `createLogRocketLogger(config)`

Create a logger configured for LogRocket integration.

```typescript
function createLogRocketLogger(config: Partial<LoggerConfig>): Logger
```

**Example:**

```typescript
const logRocketLogger = createLogRocketLogger({
  level: 'info',
  enableInProduction: true,
  batchSize: 25,
})
```

## 📱 React Integration

### Manual React Patterns

Since no built-in React hooks exist, here are recommended patterns:

```typescript
import { createLogger } from '@studio/logger'
import { useEffect, useMemo } from 'react'

function UserProfile({ userId }: { userId: string }) {
  const logger = useMemo(() => createLogger({
    level: 'info',
    globalContext: {
      component: 'UserProfile',
      userId
    }
  }), [userId])

  useEffect(() => {
    logger.info('Component mounted')
    return () => logger.info('Component unmounting')
  }, [logger])

  const handleSave = () => {
    logger.info('Profile save initiated')
    // Save logic...
    logger.info('Profile saved successfully')
  }

  return <button onClick={handleSave}>Save</button>
}
```

## 🔒 Security Features

### Sensitive Data Redaction

Default sensitive field patterns:

- `password`, `passwd`, `pwd`
- `token`, `accessToken`, `refreshToken`
- `secret`, `apiSecret`, `clientSecret`
- `key`, `apiKey`, `privateKey`
- `auth`, `authorization`
- `credential`, `credentials`

**Custom redaction:**

```typescript
const logger = createLogger({
  sensitiveFields: ['ssn', 'creditCard', 'bankAccount'],
  customRedactionStrategy: (obj) => {
    const redacted = { ...obj }

    // Custom email masking
    if (redacted.email) {
      redacted.email = redacted.email.replace(/(.{2}).*@/, '$1***@')
    }

    // Custom phone number masking
    if (redacted.phone) {
      redacted.phone = redacted.phone.replace(/(\d{3}).*(\d{4})/, '$1***$2')
    }

    return redacted
  },
})
```

## 🧪 Testing Utilities

### Mocking the Logger

For testing environments, use Vitest's standard mocking:

```typescript
import { vi } from 'vitest'

// Mock the entire logger module
vi.mock('@studio/logger', () => ({
  log: {
    trace: vi.fn(),
    debug: vi.fn(),
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
    withTag: vi.fn().mockReturnThis(),
    withContext: vi.fn().mockReturnThis(),
  },
  createLogger: vi.fn(() => ({
    trace: vi.fn(),
    debug: vi.fn(),
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
    withTag: vi.fn().mockReturnThis(),
    withContext: vi.fn().mockReturnThis(),
  })),
}))

// Verify log calls in tests
import { log } from '@studio/logger'

expect(log.info).toHaveBeenCalledWith(
  'User created',
  expect.objectContaining({ userId: '123' }),
)
```

### Test Patterns

```typescript
// Clear all mock calls between tests
beforeEach(() => {
  vi.clearAllMocks()
})

// Spy on specific methods
test('can spy on logger methods', () => {
  const infoSpy = vi.spyOn(log, 'info')

  someFunction()

  expect(infoSpy).toHaveBeenCalledWith('Expected message')
  infoSpy.mockRestore()
})

// Mock console for browser logger tests
Object.defineProperty(window, 'console', {
  value: {
    trace: vi.fn(),
    debug: vi.fn(),
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
    group: vi.fn(),
    groupCollapsed: vi.fn(),
    groupEnd: vi.fn(),
  },
})
```

## 🎯 TypeScript Types

### Core Types

```typescript
type LogLevel = 'trace' | 'debug' | 'info' | 'warn' | 'error'

interface LogEntry {
  timestamp: string
  level: LogLevel
  message: string
  context?: Record<string, any>
  tags?: string[]
  callsite?: CallsiteInfo
}

interface CallsiteInfo {
  file: string
  line: number
  column: number
}

interface Logger {
  trace(message: string, context?: Record<string, any>): void
  debug(message: string, context?: Record<string, any>): void
  info(message: string, context?: Record<string, any>): void
  warn(message: string, context?: Record<string, any>): void
  error(message: string, context?: Record<string, any>): void

  withTag(tag: string): Logger
  withContext(context: Record<string, any>): Logger

  // Browser-specific methods
  group?(label: string): void
  groupCollapsed?(label: string): void
  groupEnd?(): void
  mark?(name: string): void
  measure?(name: string, startMark?: string): void
  flushLogs?(): Promise<void>
}
```

### Configuration Types

```typescript
interface NodeLoggerConfig {
  level?: LogLevel
  prettyPrint?: boolean
  enableCallsiteTracking?: boolean
  outputStream?: NodeJS.WritableStream
}

interface BrowserLoggerConfig {
  level?: LogLevel
  enableConsole?: boolean
  enableColors?: boolean
  enableInProduction?: boolean
  remoteEndpoint?: string
  batchSize?: number
  flushInterval?: number
  maxRetries?: number
  retryBaseDelay?: number
  sensitiveFields?: string[]
  customRedactionStrategy?: (obj: any) => any
  enablePerformance?: boolean
  globalContext?: Record<string, any>
  onRemoteSuccess?: (logs: LogEntry[]) => void
  onRemoteError?: (error: Error, logs: LogEntry[]) => void
}
```

---

_This API reference provides complete documentation for all logger functionality. For implementation details, see the [Architecture Guide](architecture.md)._

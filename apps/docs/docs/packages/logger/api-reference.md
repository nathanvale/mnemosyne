# 📚 Logger API Reference

Complete API documentation for the `@studio/logger` package with TypeScript signatures, examples, and usage patterns.

## 🚀 Quick Start

```typescript
import logger, { cli, debug, production, createLogger } from '@studio/logger'

// Zero-config smart logger (auto-detects environment)
logger.info('Hello world', { userId: 123 })

// Use optimized presets for specific contexts
const cliLogger = cli() // Clean output for CLI tools
const debugLogger = debug() // Rich debugging with clickable traces
const prodLogger = production() // Structured JSON for monitoring

// Create custom logger instances
const customLogger = createLogger({ level: 'debug', prettyPrint: true })
```

## 🎯 Smart Auto-Detecting Logger

The default export automatically configures itself based on environment detection:

```typescript
import logger from '@studio/logger'

// Automatically configured based on:
// • NODE_ENV === 'development' → debug mode (pretty + callsites)
// • NODE_ENV === 'production' → structured JSON logs
// • CI environment → structured logs for automation
// • Environment variables → LOGGER_MODE override

logger.info('This automatically uses the best configuration')
```

### Environment Variable Overrides

```bash
# Override logger mode
LOGGER_MODE=debug npm start       # Force debug mode
LOGGER_MODE=cli npm run build     # Force clean CLI output
LOGGER_MODE=production npm test   # Force structured JSON

# Override specific settings
LOG_LEVEL=trace npm run dev       # Set log level
LOGGER_PRETTY_PRINT=false npm start         # Disable pretty printing
LOGGER_INCLUDE_CALLSITE=true npm run build  # Enable callsite tracking
```

## 📦 Preset Functions

Three optimized preset functions for common scenarios:

### `cli(config?)` - Clean CLI Output

Perfect for command-line tools and scripts. No timestamps, no callsites, just clean readable output.

```typescript
import { cli } from '@studio/logger'

const logger = cli({ level: 'info' })
logger.info('Processing files...')
logger.warn('Skipped 3 invalid entries')
logger.info('✅ Completed successfully')

// Output:
// INFO: Processing files...
// WARN: Skipped 3 invalid entries
// INFO: ✅ Completed successfully
```

### `debug(config?)` - Rich Development Debugging

Enhanced debugging with IDE-friendly clickable callsite links and full diagnostics.

```typescript
import { debug } from '@studio/logger'

const logger = debug({ level: 'trace' })
logger.debug('User authentication started')
logger.trace('Validating credentials')

// Output (pretty printed):
// DEBUG: User authentication started 📍 src/auth.ts:45:12
// TRACE: Validating credentials 📍 src/auth.ts:47:8
```

### `production(config?)` - Structured JSON Logs

Optimized for log aggregation, monitoring, and production environments.

```typescript
import { production } from '@studio/logger'

const logger = production({ level: 'info' })
logger.info('User login successful', { userId: '123', method: 'oauth' })

// Output (JSON):
// {"level":30,"time":1703095890123,"msg":"User login successful","userId":"123","method":"oauth","callsite":{"file":"src/auth.ts","line":52,"column":8}}
```

## 🎯 Unified Logger Interface

All loggers (default, presets, and custom) provide the same consistent interface:

### Basic Logging Methods

#### `log.trace(message, context?)`

Detailed tracing information for debugging complex flows. Automatically includes callsite information.

```typescript
log.trace(message: string, context?: LogContext): void
```

**Example:**

```typescript
// With context object
log.trace('Entering authentication flow', {
  userId: '123',
  method: 'oauth',
  timestamp: Date.now(),
})

// Simple message without context
log.trace('Processing data')
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

#### `log.debug(message, context?)`

Development debugging information.

```typescript
log.debug(message: string, context?: LogContext): void
```

**Example:**

```typescript
log.debug('Database query executed', {
  query: 'SELECT * FROM users',
  duration: 45,
  rowCount: 12,
})
```

#### `log.info(message, context?)`

General informational messages.

```typescript
log.info(message: string, context?: LogContext): void
```

**Example:**

```typescript
log.info('User logged in successfully', {
  userId: 'user_123',
  sessionId: 'sess_abc',
  loginMethod: 'password',
})
```

#### `log.warn(message, context?)`

Warning messages that need attention.

```typescript
log.warn(message: string, context?: LogContext): void
```

**Example:**

```typescript
log.warn('API rate limit approaching', {
  currentRequests: 95,
  limit: 100,
  resetTime: new Date('2024-01-15T15:00:00Z'),
})
```

#### `log.error(message, context?)`

Error messages for failures and exceptions.

```typescript
log.error(message: string, context?: LogContext): void
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

#### `log.fatal(message, context?)`

Fatal error messages for critical failures.

```typescript
log.fatal(message: string, context?: LogContext): void
```

**Example:**

```typescript
log.fatal('Application startup failed', {
  error: error.message,
  exitCode: 1,
})
```

### 🔗 Advanced Features (All Environments)

The unified logger API provides consistent advanced features across all environments:

```typescript
import { log, createLogger } from '@studio/logger'

// Basic usage works everywhere
log.info('User action', {
  userId: '123',
  action: 'login',
})

// Advanced features work in both Node.js and browser
const logger = createLogger({ level: 'info' })

// Tags and context work everywhere
const authLogger = logger.withTag('AuthService')
authLogger.info('Password reset initiated')

const userLogger = logger.withContext({
  userId: '123',
  sessionId: 'abc',
})
userLogger.info('Profile updated')

// Method chaining works everywhere
const requestLogger = logger.withTag('APIRequest').withContext({
  requestId: 'req_456',
  endpoint: '/api/users',
})
requestLogger.info('API request completed')
```

## 🏭 Factory Functions

### `createLogger(config)` (All Environments)

Create a custom logger instance with specific configuration. Automatically detects Node.js vs browser environment.

```typescript
function createLogger(config: LoggerConfig): Logger

interface LoggerConfig {
  // Core Settings
  level?: LogLevel // 'trace' | 'debug' | 'info' | 'warn' | 'error'
  enableConsole?: boolean // Enable console output (default: true)
  enableColors?: boolean // Enable colored output (default: true)
  enableInProduction?: boolean // Allow logging in production (default: false)

  // Node.js Features
  prettyPrint?: boolean // Enable pretty-printed output for CLI (default: false)
  outputStream?: NodeJS.WritableStream // Custom output stream (Node.js only)

  // Browser Features
  devClickableTraces?: boolean // Enable clickable source links (default: true)
  remoteEndpoint?: string // URL for remote log uploads (browser only)
  batchSize?: number // Logs per batch (default: 50)
  flushInterval?: number // Auto-flush interval in ms (default: 30000)
  maxRetries?: number // Max retry attempts (default: 3)
  retryBaseDelay?: number // Base retry delay in ms (default: 1000)

  // Data Handling
  sensitiveFields?: Array<string> // Fields to redact in remote logs
  customRedactionStrategy?: (obj: any) => any // Custom redaction logic

  // Performance (Browser only)
  enablePerformance?: boolean // Enable performance monitoring (default: false)

  // Context
  globalContext?: Record<string, any> // Context added to all logs

  // Callbacks (Browser only)
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

### Preset Configuration Override

All preset functions accept configuration overrides:

```typescript
import { cli, debug, production } from '@studio/logger'

// Override preset defaults
const verboseCli = cli({ level: 'debug' })
const quietDebug = debug({ level: 'warn' })
const trackedProduction = production({
  globalContext: { service: 'api', version: '1.2.0' },
})

// Mix and match features
const customLogger = cli({
  level: 'trace',
  includeCallsite: true, // Add callsites to CLI output
})
```

## 🌐 Browser-Specific Features

### Enhanced Clickable Callsites

The browser logger provides Chrome-optimized clickable links for easy source navigation:

```typescript
import { createLogger } from '@studio/logger'

const logger = createLogger({
  devClickableTraces: true, // Creates Error objects for guaranteed Chrome clickability
  enableColors: true,
})

logger.info('User logged in', { userId: '123' })
// Output: INFO: User logged in 📍 src/auth.ts:42:8 [clickable in Chrome]
```

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

### Built-in Mock Logger

The logger package provides built-in testing utilities for easy test setup:

```typescript
import {
  createMockLogger,
  createCapturingMockLogger,
} from '@studio/logger/testing'

// Basic mock logger
const mockLogger = createMockLogger()

// Test your code
yourFunction(mockLogger)

// Assert calls
expect(mockLogger.info).toHaveBeenCalledWith('User created', { userId: '123' })
```

### Capturing Mock Logger

For more advanced testing scenarios, use the capturing mock:

```typescript
import { createCapturingMockLogger } from '@studio/logger/testing'

const mockLogger = createCapturingMockLogger()

// Run your code
yourFunction(mockLogger)

// Get all captured calls
const calls = mockLogger.getCalls()
expected(calls).toEqual([
  { level: 'info', message: 'Starting process', context: { userId: '123' } },
  { level: 'error', message: 'Process failed', context: { error: 'timeout' } },
])

// Filter by log level
const errorCalls = mockLogger.getCallsForLevel('error')
expected(errorCalls).toHaveLength(1)
```

### Module Mocking

For complete module mocking:

```typescript
import { mockLoggerModule } from '@studio/logger/testing'

// Mock the entire module
const { mockLog, mockCreateLogger } = mockLoggerModule()

// Now all imports from '@studio/logger' use mocks
import { log, createLogger } from '@studio/logger'

expect(log.info).toHaveBeenCalledWith('Expected message', { userId: '123' })
```

### Test Patterns

```typescript
import { createMockLogger, resetMockLogger } from '@studio/logger/testing'

let mockLogger: ReturnType<typeof createMockLogger>

beforeEach(() => {
  mockLogger = createMockLogger()
  // Or reset existing mock
  // resetMockLogger(mockLogger)
})

test('logs user creation', () => {
  createUser('123', mockLogger)

  expect(mockLogger.info).toHaveBeenCalledWith('User created', {
    userId: '123',
  })
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
  trace(message: string, context?: LogContext): void
  debug(message: string, context?: LogContext): void
  info(message: string, context?: LogContext): void
  warn(message: string, context?: LogContext): void
  error(message: string, context?: LogContext): void
  fatal(message: string, context?: LogContext): void

  withTag(tag: string): Logger
  withContext(context: LogContext): Logger

  // Browser-specific methods
  group?(label: string): void
  groupCollapsed?(label: string): void
  groupEnd?(): void
  mark?(name: string): void
  measure?(name: string, startMark?: string): void
  flushLogs?(): Promise<void>
}

type LogContext = Record<string, any>
```

### Configuration Types

```typescript
interface LoggerConfig {
  // Core Settings (All Environments)
  level?: LogLevel
  enableConsole?: boolean
  enableColors?: boolean
  enableInProduction?: boolean
  globalContext?: LogContext
  sensitiveFields?: string[]
  customRedactionStrategy?: (obj: any) => any

  // Node.js Specific
  prettyPrint?: boolean
  enableCallsiteTracking?: boolean
  outputStream?: NodeJS.WritableStream

  // Browser Specific
  devClickableTraces?: boolean
  remoteEndpoint?: string
  batchSize?: number
  flushInterval?: number
  maxRetries?: number
  retryBaseDelay?: number
  enablePerformance?: boolean
  onRemoteSuccess?: (logs: LogEntry[]) => void
  onRemoteError?: (error: Error, logs: LogEntry[]) => void
}
```

---

_This API reference provides complete documentation for all logger functionality. For implementation details, see the [Architecture Guide](architecture.md)._

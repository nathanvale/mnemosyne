# 🌐 Browser vs Node.js Logger Comparison

This guide explains the differences, capabilities, and behavioral variations between the Node.js and browser implementations of `@studio/logger`.

## 🎯 Overview

The `@studio/logger` package provides a unified API that automatically adapts to its runtime environment. While the interface remains consistent, the underlying implementation and capabilities differ significantly between Node.js and browser environments.

## 📊 Feature Comparison Matrix

| Feature               | Node.js | Browser | Notes                                                  |
| --------------------- | ------- | ------- | ------------------------------------------------------ |
| **Basic Logging**     | ✅      | ✅      | Identical API across environments                      |
| **Structured JSON**   | ✅      | ✅      | Node.js outputs to stdout, Browser batches for remote  |
| **Callsite Tracking** | ✅      | ✅      | Node.js uses stacktracey, Browser uses Error.stack     |
| **Pretty Printing**   | ✅      | ✅      | Node.js uses pino-pretty, Browser uses console styling |
| **Log Levels**        | ✅      | ✅      | Same levels: trace, debug, info, warn, error           |
| **Context & Tags**    | ✅      | ✅      | Identical functionality                                |
| **Console Grouping**  | ❌      | ✅      | Browser-only feature                                   |
| **Performance Marks** | ❌      | ✅      | Browser-only feature                                   |
| **Remote Batching**   | ❌      | ✅      | Browser-only feature                                   |
| **CLI Output**        | ✅      | ❌      | Node.js-only feature                                   |
| **File Output**       | ✅      | ❌      | Node.js-only feature                                   |
| **Process Metadata**  | ✅      | ❌      | PID, hostname, etc.                                    |
| **Browser Metadata**  | ❌      | ✅      | User agent, URL, etc.                                  |

## 🖥️ Node.js Implementation

### Primary Use Cases

- **Server-side applications**: Express, Next.js API routes, background services
- **CLI tools and scripts**: Data processing, build tools, automation
- **Development tools**: Webpack plugins, test runners, deployment scripts

### Key Characteristics

#### Structured JSON Output

```json
{
  "level": 30,
  "time": 1751793395218,
  "pid": 46495,
  "hostname": "server.local",
  "msg": "User authenticated successfully",
  "userId": "123",
  "sessionId": "abc",
  "callsite": {
    "file": "src/auth/login.ts",
    "line": 45,
    "column": 7
  }
}
```

#### Precise Callsite Information

Uses `stacktracey` for accurate file, line, and column tracking:

```typescript
// Input: log.info('Database connected')
// Output callsite:
{
  "file": "src/database/connection.ts",
  "line": 23,
  "column": 5
}
```

#### Environment-Based Output Formatting

- **Development**: Pretty-printed, colored output for readability
- **Production/Test**: Raw JSON for log aggregation systems
- **CLI**: Human-readable timestamps and formatting

```bash
# Development output
[09:15:34.353] INFO: Database connected
    host: "localhost"
    port: 5432
    callsite: {
      "file": "src/database/connection.ts",
      "line": 23,
      "column": 5
    }

# Production output (JSON)
{"level":30,"time":1751793395218,"pid":46495,"hostname":"server.local","msg":"Database connected","host":"localhost","port":5432,"callsite":{"file":"src/database/connection.ts","line":23,"column":5}}
```

#### CLI Logger Variant

Specialized output for command-line tools:

```typescript
const cliLogger = createCliLogger('info')
cliLogger.info('Processing 1,250 records...')
cliLogger.warn('Skipped 3 invalid entries')
cliLogger.info('Import completed successfully')
```

```bash
[INFO 14:30:22] Processing 1,250 records...
[WARN 14:30:23] Skipped 3 invalid entries
[INFO 14:30:24] Import completed successfully
```

### Node.js-Specific Features

#### Process Metadata

Automatically includes system information:

- **PID**: Process identifier
- **Hostname**: Server hostname
- **Memory usage**: Available via custom context
- **Environment variables**: LOG_LEVEL, NODE_ENV

#### File Output Support

Can write directly to files or streams:

```typescript
const logger = createLogger({
  outputStream: fs.createWriteStream('/var/log/app.log'),
})
```

#### Performance Characteristics

- **Extremely fast**: Pino is one of the fastest Node.js loggers
- **Asynchronous**: Non-blocking I/O for high-throughput applications
- **Memory efficient**: Minimal object allocation

## 🌐 Browser Implementation

### Primary Use Cases

- **React applications**: Component logging, user interaction tracking
- **Single-page applications**: State changes, API calls, user flows
- **Error tracking**: Unhandled exceptions, performance issues
- **Development debugging**: Component rendering, data flow analysis

### Key Characteristics

#### Rich Console Output

Enhanced console with colors, grouping, and interactive elements:

```javascript
// Colored output with expand/collapse
console.log(
  '%c[INFO 14:30:22] User logged in',
  'color: #00ff00; font-weight: bold',
  {
    userId: '123',
    sessionId: 'abc',
  },
)
```

#### Remote Batching

Efficient aggregation and upload of logs:

```typescript
const logger = createLogger({
  remoteEndpoint: 'https://api.example.com/logs',
  batchSize: 50,
  flushInterval: 30000,
})

// Logs are automatically batched and sent
logger.info('User action completed')
logger.debug('State updated')
// ... 48 more logs
// Batch automatically sent after 50 logs or 30 seconds
```

#### Browser Metadata

Automatically includes browser-specific information:

```json
{
  "timestamp": "2024-01-15T10:30:00.000Z",
  "level": "info",
  "message": "Page loaded",
  "metadata": {
    "userAgent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)",
    "url": "https://app.example.com/dashboard",
    "referrer": "https://app.example.com/login",
    "viewport": "1920x1080"
  }
}
```

### Browser-Specific Features

#### Console Grouping

Organize related logs into collapsible sections:

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

#### Performance Monitoring

Built-in timing and measurement:

```typescript
log.mark('operation-start')
await processData()
log.mark('operation-middle')
await saveResults()
log.measure('total-operation', 'operation-start')
log.measure('save-phase', 'operation-middle')
```

#### Clickable Source Links

Development-only feature for direct navigation to source:

```
[INFO 14:30:22] 🔐 User logged in
  userId: "123"
  📍 src/components/Login.tsx:45:7  ← Clickable in Chrome DevTools
```

#### Sensitive Data Redaction

Automatic filtering for security:

```typescript
log.info('User data updated', {
  username: 'john',
  email: 'john@example.com',
  password: 'secret123',  // Automatically redacted
  token: 'jwt_token_here' // Automatically redacted
})

// Remote payload:
{
  "username": "john",
  "email": "john@example.com",
  "password": "[REDACTED]",
  "token": "[REDACTED]"
}
```

## 🔄 API Consistency

Despite implementation differences, the core API remains identical:

```typescript
// This code works identically in both environments
const userLogger = log.withTag('UserService').withContext({
  userId: '123',
  sessionId: 'abc',
})

userLogger.info('Password reset initiated', {
  method: 'email',
  timestamp: new Date().toISOString(),
})
```

### Universal Methods

These methods work identically in both environments:

- `log.trace()`, `log.debug()`, `log.info()`, `log.warn()`, `log.error()`, `log.fatal()`
- Automatic callsite tracking and context merging
- Log level filtering
- Basic context inclusion via first argument

### Environment-Specific Methods

These methods are available only in specific environments:

**Node.js Only:**

- `createCliLogger()` - Human-readable CLI output
- Pino-based structured JSON logging
- Process metadata inclusion (PID, hostname)
- File/stream output via Pino configuration

**Browser Only:**

- `withTag()`, `withContext()` methods on BrowserLogger instances
- `group()`, `groupCollapsed()`, `groupEnd()` console grouping
- `mark()`, `measure()` performance monitoring
- `flushLogs()` - Manual remote batch flush
- Remote endpoint configuration and batching
- Sensitive data redaction

## ⚡ Performance Comparison

### Node.js Performance

- **Throughput**: ~100,000 logs/second (Pino benchmarks)
- **Memory**: Minimal allocation, efficient JSON serialization
- **I/O**: Asynchronous, non-blocking writes
- **Callsite overhead**: ~1-2ms per log (stacktracey processing)

### Browser Performance

- **Throughput**: Limited by console rendering (~1,000 logs/second visible)
- **Memory**: Batching prevents memory leaks in long-running apps
- **Network**: Efficient batching reduces HTTP requests
- **Callsite overhead**: ~0.5ms per log (Error.stack parsing)

## 🔧 Configuration Differences

### Node.js Configuration

```typescript
const nodeLogger = createLogger({
  level: 'info',
  prettyPrint: process.env.NODE_ENV === 'development',
  enableCallsiteTracking: true,
  outputStream: process.stdout, // or file stream
})
```

### Browser Configuration

```typescript
const browserLogger = createLogger({
  level: 'info',
  enableConsole: true,
  enableColors: true,
  remoteEndpoint: 'https://api.example.com/logs',
  batchSize: 50,
  flushInterval: 30000,
  sensitiveFields: ['password', 'token'],
  enableInProduction: false,
})
```

## 🧪 Testing Differences

### Node.js Testing

Mock Pino and file system:

```typescript
vi.mock('pino', () => ({
  default: vi.fn(() => ({
    info: vi.fn(),
    error: vi.fn(),
  })),
}))
```

### Browser Testing

Mock console and fetch:

```typescript
global.console = {
  log: vi.fn(),
  group: vi.fn(),
  groupEnd: vi.fn(),
}

global.fetch = vi.fn()
```

## 🚀 Best Practices by Environment

### Node.js Best Practices

- Use structured logging with meaningful context
- Configure appropriate log levels for production
- Implement log rotation for long-running services
- Use CLI logger for scripts and tools
- Include error stack traces in error logs

### Browser Best Practices

- Configure remote logging for production error tracking
- Use console grouping for complex user flows
- Implement sensitive data redaction
- Batch logs efficiently to reduce network overhead
- Use performance marking for timing critical operations

## 🔍 Debugging Tips

### Node.js Debugging

```typescript
// Enable debug level in development
process.env.LOG_LEVEL = 'debug'

// Use callsite information to trace issues
log.debug('Variable state', {
  variable: complexObject,
  callsite: 'manual debug point',
})
```

### Browser Debugging

```typescript
// Use console grouping for complex flows
log.group('🔍 Debug: User Registration')
log.debug('Form validation', formData)
log.debug('API request', requestPayload)
log.debug('Response received', responseData)
log.groupEnd()

// Use performance marks for timing
log.mark('registration-start')
// ... registration logic
log.measure('registration-total', 'registration-start')
```

---

_This comparison helps you understand when to use specific features and how to optimize logger usage for each environment._

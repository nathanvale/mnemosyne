# 🌐 Browser vs Node.js Logger Comparison

This guide explains the differences, capabilities, and behavioral variations between the Node.js and browser implementations of `@studio/logger` with the new smart environment-aware system.

## 🎯 Overview

The `@studio/logger` package provides a **unified API with intelligent environment detection** that automatically configures itself for optimal performance in each runtime. The system uses smart preset functions (`cli()`, `debug()`, `production()`) and auto-detection to provide **zero-configuration logging** while maintaining full customization flexibility.

## 📊 Feature Comparison Matrix

| Feature                   | Node.js | Browser | Notes                                                  |
| ------------------------- | ------- | ------- | ------------------------------------------------------ |
| **Smart Auto-Detection**  | ✅      | ✅      | Automatic environment-aware configuration              |
| **Preset Functions**      | ✅      | ✅      | `cli()`, `debug()`, `production()` across environments |
| **Basic Logging**         | ✅      | ✅      | Identical API across environments                      |
| **Structured JSON**       | ✅      | ✅      | Node.js outputs to stdout, Browser batches for remote  |
| **Callsite Tracking**     | ✅      | ✅      | Enhanced with IDE-friendly `file:line:column` format   |
| **Clickable Links**       | ✅      | ✅      | Node.js in terminals, Browser with Error objects       |
| **Pretty Printing**       | ✅      | ✅      | Clean output without timestamps in pretty mode         |
| **Log Levels**            | ✅      | ✅      | Same levels: trace, debug, info, warn, error, fatal    |
| **Context & Tags**        | ✅      | ✅      | Identical functionality with chaining                  |
| **Environment Variables** | ✅      | ✅      | Override any setting via env vars                      |
| **Console Grouping**      | ❌      | ✅      | Browser-only feature                                   |
| **Performance Marks**     | ❌      | ✅      | Browser-only feature                                   |
| **Remote Batching**       | ❌      | ✅      | Browser-only feature                                   |
| **CLI Output**            | ✅      | ❌      | Node.js-only feature                                   |
| **File Output**           | ✅      | ❌      | Node.js-only feature                                   |
| **Process Metadata**      | ✅      | ❌      | PID, hostname, etc.                                    |
| **Browser Metadata**      | ❌      | ✅      | User agent, URL, etc.                                  |

## 🖥️ Node.js Implementation

### Primary Use Cases

- **Server-side applications**: Express, Next.js API routes, background services
- **CLI tools and scripts**: Data processing, build tools, automation
- **Development tools**: Webpack plugins, test runners, deployment scripts
- **Smart auto-configuration**: Zero-config setup with intelligent environment detection

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

#### Enhanced Callsite Information

Uses `stacktracey` for accurate file, line, and column tracking with IDE-friendly formats:

```typescript
// Input: debug().info('Database connected')
// Output callsite with clickable link:
{
  "file": "src/database/connection.ts",
  "line": 23,
  "column": 5,
  "callsiteLink": "src/database/connection.ts:23:5"  // IDE-friendly format
}
```

#### Smart Environment-Based Output Formatting

Automatically adapts output format based on detected environment and preset:

- **`debug()` preset**: Pretty-printed with clickable callsite links, no timestamps
- **`production()` preset**: Structured JSON for log aggregation systems
- **`cli()` preset**: Clean human-readable output for scripts

```bash
# Debug preset output (NODE_ENV=development)
INFO: Database connected 📍 src/database/connection.ts:23:5
    host: "localhost"
    port: 5432

# Production preset output (NODE_ENV=production)
{"level":30,"time":1751793395218,"pid":46495,"hostname":"server.local","msg":"Database connected","host":"localhost","port":5432,"callsite":{"file":"src/database/connection.ts","line":23,"column":5,"callsiteLink":"src/database/connection.ts:23:5"}}

# CLI preset output (clean for scripts)
INFO: Database connected
```

#### Environment Variable Overrides

Fine-grained control for different deployment scenarios:

```bash
# Override detected environment
LOGGER_MODE=debug npm start              # Force debug mode
LOGGER_MODE=cli npm run import-data      # Force clean CLI output
LOGGER_MODE=production npm test          # Force structured JSON

# Override specific settings
LOG_LEVEL=trace npm run dev              # Set log level
LOGGER_PRETTY_PRINT=false npm start     # Disable pretty printing
LOGGER_INCLUDE_CALLSITE=true npm run build  # Enable callsite tracking
```

#### Preset Function Usage

```typescript
import { cli, debug, production } from '@studio/logger'

// Clean CLI output for scripts (no timestamps, no callsites)
const scriptLogger = cli()
scriptLogger.info('Processing 1,250 records...')
scriptLogger.warn('Skipped 3 invalid entries')
scriptLogger.info('✅ Import completed successfully')

// Rich debugging (pretty print + clickable callsites)
const devLogger = debug()
devLogger.debug('Database query executed', { sql: 'SELECT * FROM users' })

// Production JSON (structured for monitoring)
const prodLogger = production()
prodLogger.info('Request processed', { requestId: 'req_123', duration: 45 })
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

#### Enhanced Clickable Source Links

Chrome-optimized clickable links with Error object integration for guaranteed navigation:

```javascript
// Development mode with devClickableTraces: true
log.info('User logged in', { userId: '123' })

// Console output with guaranteed clickable link:
// [INFO 14:30:22] User logged in
//   userId: "123"
//   📍 src/components/Login.tsx:45:7  ← Clickable Error object in Chrome
```

**Implementation Detail:**

```typescript
// Creates Error objects for guaranteed Chrome clickability
if (this.config.devClickableTraces && NODE_ENV === 'development') {
  const clickableTrace = new Error()
  clickableTrace.name = ''
  clickableTrace.message = `📍 ${callsite.file}:${callsite.line}:${callsite.column}`
  args.push(clickableTrace) // Chrome makes Error objects clickable
}
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

### Universal Methods Across Environments

These methods work identically in both Node.js and browser:

- **Core logging**: `trace()`, `debug()`, `info()`, `warn()`, `error()`, `fatal()`
- **Smart presets**: `cli()`, `debug()`, `production()` with automatic adaptation
- **Context chaining**: `withTag()`, `withContext()` method chaining
- **Auto-detection**: Environment-aware configuration
- **Callsite tracking**: IDE-friendly `file:line:column` format
- **Environment variables**: Override any setting via env vars

### Environment-Specific Methods

**Node.js Only:**

- Pino-based structured JSON logging with enhanced performance
- Process metadata inclusion (PID, hostname, memory usage)
- File/stream output via Pino configuration
- Terminal-optimized pretty printing without timestamps

**Browser Only:**

- `group()`, `groupCollapsed()`, `groupEnd()` console grouping
- `mark()`, `measure()` performance monitoring with Web Performance API
- `flushLogs()` - Manual remote batch flush
- Remote endpoint configuration and intelligent batching
- Sensitive data redaction with customizable strategies
- Chrome-optimized clickable Error objects for source navigation

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

### Zero-Configuration Usage

```typescript
import logger, { cli, debug, production } from '@studio/logger'

// Auto-detects and configures based on environment
logger.info('This just works everywhere')

// Use presets for specific scenarios
const scriptLogger = cli() // Clean output for CLI tools
const devLogger = debug() // Rich debugging with callsites
const prodLogger = production() // Structured JSON for monitoring
```

### Manual Configuration (Advanced)

```typescript
// Node.js specific features
const nodeLogger = createLogger({
  level: 'info',
  prettyPrint: true,
  includeCallsite: true,
  globalContext: { service: 'api', version: '1.0' },
})

// Browser specific features
const browserLogger = createLogger({
  level: 'info',
  enableConsole: true,
  devClickableTraces: true, // Chrome-optimized clickable links
  remoteEndpoint: 'https://api.example.com/logs',
  batchSize: 50,
  sensitiveFields: ['password', 'token'],
})
```

### Environment Variable Overrides

```bash
# Works across both environments
LOGGER_MODE=debug npm start
LOG_LEVEL=trace npm run dev
LOGGER_INCLUDE_CALLSITE=true npm run build
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

### Universal Best Practices (Both Environments)

- **Use smart presets**: Leverage `cli()`, `debug()`, `production()` for optimal defaults
- **Leverage auto-detection**: Let the logger configure itself based on environment
- **Use environment variables**: Override settings without code changes
- **Chain context**: Use `logger.withTag('API').withContext({ userId })` for rich metadata
- **Include meaningful context**: Provide relevant data with each log message

### Node.js Specific Best Practices

- **Use `production()` preset** for servers and structured logging
- **Use `cli()` preset** for scripts and command-line tools
- **Use `debug()` preset** for development with clickable callsites
- Configure log rotation for long-running services
- Include error stack traces in error logs

### Browser Specific Best Practices

- **Enable `devClickableTraces`** for development debugging
- Configure remote logging for production error tracking
- Use console grouping for complex user flows
- Implement sensitive data redaction for security
- Batch logs efficiently to reduce network overhead

## 🔍 Debugging Tips

### Universal Debugging (Both Environments)

```typescript
// Use debug preset for enhanced debugging
import { debug } from '@studio/logger'
const logger = debug()

// Rich debugging with clickable callsites
logger.debug('User authentication flow started', { userId: '123' })
logger.trace('Validating credentials', { method: 'oauth' })

// Override via environment variables
// LOGGER_MODE=debug LOG_LEVEL=trace npm start
```

### Node.js Specific Debugging

```typescript
// Use debug preset for development
const devLogger = debug({ level: 'trace' })
devLogger.debug('Database query', { sql: 'SELECT * FROM users', duration: 45 })

// Clean CLI output for scripts
const scriptLogger = cli()
scriptLogger.info('Processing files...')
scriptLogger.warn('⚠️ Found 3 invalid entries')
```

### Browser Specific Debugging

```typescript
// Enhanced clickable debugging
const logger = createLogger({ devClickableTraces: true })
logger.info('Component rendered', { props, state })
// Creates clickable Error objects in Chrome console

// Use console grouping for complex flows
log.group('🔍 Debug: User Registration')
log.debug('Form validation', formData)
log.debug('API request', requestPayload)
log.groupEnd()

// Performance monitoring
log.mark('registration-start')
// ... registration logic
log.measure('registration-total', 'registration-start')
```

---

_This enhanced comparison showcases the **smart environment-aware logger system** with zero-configuration auto-detection, intelligent preset functions, and Chrome-optimized clickable callsites for maximum developer productivity across all environments._

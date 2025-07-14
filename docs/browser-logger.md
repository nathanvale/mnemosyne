# 🚀 BrowserLogger - Production-Ready Browser Logger

A comprehensive, extensible, production-ready browser logging solution with advanced features for modern web applications.

## ✨ Features

### 🎯 Core Logging

- **Multi-level logging**: `trace`, `debug`, `info`, `warn`, `error`
- **Colored console output**: Different colors for each log level
- **Log level filtering**: Only show logs at or above specified level
- **Structured logging**: JSON-formatted messages with metadata

### 🏷️ Advanced Features

- **Tags & Context**: Add contextual information to all logs
- **Clickable traces**: Direct navigation to source code in Chrome DevTools
- **Development-only tracing**: Special traces that only appear in development
- **Console grouping**: Organized, collapsible log sections
- **Performance monitoring**: Built-in timing with marks and measurements

### 🌐 Remote Logging

- **Batch processing**: Efficient log aggregation before remote upload
- **Schema validation**: Zod-based validation for remote payloads
- **Retry logic**: Exponential backoff for failed uploads
- **Sensitive data redaction**: Automatic redaction of passwords, tokens, etc.
- **Error handling**: Comprehensive error recovery and reporting

### 🔧 Integration & Production

- **Zero dependencies**: Core functionality requires no external libraries
- **Tree-shakeable**: Modular architecture for optimal bundle size
- **Production controls**: Automatic disable in production with override
- **Error tracking hooks**: Ready-to-use integrations for Sentry, DataDog, LogRocket
- **Custom hooks**: Extensible architecture for any logging service

## 🚀 Quick Start

### Basic Usage

```typescript
import { createLogger } from '@studio/logger'

// Create a logger instance
const logger = createLogger({
  level: 'info',
  enableConsole: true,
  enableColors: true,
})

// Log at different levels
logger.trace('Detailed debugging information')
logger.debug('Development debugging info')
logger.info('General information')
logger.warn('Something needs attention')
logger.error('Something went wrong')
```

### Tags and Context

```typescript
// Add tags for categorization
const userLogger = logger.withTag('UserService')
userLogger.info('User logged in successfully')

// Add context for structured data
const contextLogger = logger.withContext({
  userId: '123',
  sessionId: 'abc',
})
contextLogger.warn('Password will expire soon', { daysRemaining: 3 })

// Chain tags and context
const apiLogger = logger
  .withTag('APIClient')
  .withContext({ endpoint: '/api/users' })
apiLogger.debug('Making API request', { method: 'GET' })
```

### Remote Logging

```typescript
const logger = createLogger({
  level: 'info',
  enableConsole: true,
  remoteEndpoint: 'https://api.your-service.com/logs',
  batchSize: 10,
  flushInterval: 30000, // 30 seconds
  sensitiveFields: ['password', 'token', 'apiKey'],
  onRemoteSuccess: (logs) => console.log('Uploaded', logs.length, 'logs'),
  onRemoteError: (error, logs) => console.error('Upload failed:', error),
})

// Logs will be batched and sent automatically
logger.info('User action', {
  action: 'login',
  username: 'john',
  password: 'secret123', // Will be redacted in remote logs
})
```

## 🔧 Configuration

### Complete Configuration Options

```typescript
interface BrowserLoggerConfig {
  // Core Settings
  level?: LogLevel // 'trace' | 'debug' | 'info' | 'warn' | 'error'
  enableConsole?: boolean // Enable console output (default: true)
  enableColors?: boolean // Enable colored output (default: true)
  enableInProduction?: boolean // Allow logging in production (default: false)

  // Development Features
  devClickableTraces?: boolean // Enable clickable source links (default: true)

  // Remote Logging
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

### Factory Functions

```typescript
// Basic logger
const logger = createLogger({ level: 'debug' })

// Sentry integration
const sentryLogger = createSentryLogger({
  level: 'error',
  enableInProduction: true,
})

// DataDog integration
const datadogLogger = createDatadogLogger({
  level: 'warn',
  remoteEndpoint: 'https://logs.datadoghq.com/api/logs',
})

// LogRocket integration
const logRocketLogger = createLogRocketLogger({
  level: 'info',
  enableInProduction: true,
})
```

## 🎨 Console Grouping

```typescript
// Create organized log sections
logger.group('🎯 User Registration Flow')
logger.info('Validating user input')
logger.debug('Email format check passed')

logger.groupCollapsed('🔒 Security Checks')
logger.trace('Checking for existing account')
logger.trace('Validating against blacklist')
logger.groupEnd()

logger.info('Creating user account')
logger.groupEnd()
```

## ⚡ Performance Monitoring

```typescript
// Enable performance monitoring
const logger = createLogger({
  enablePerformance: true,
})

// Mark specific points in time
logger.mark('operation-start')

// Simulate some work
await doSomething()

logger.mark('operation-middle')
await doSomethingElse()

// Measure duration between marks
logger.measure('total-operation', 'operation-start')
logger.measure('second-half', 'operation-middle')
```

## 🔒 Security & Data Redaction

```typescript
const logger = createLogger({
  remoteEndpoint: 'https://api.example.com/logs',
  sensitiveFields: ['password', 'token', 'apiKey', 'creditCard'],
  customRedactionStrategy: (obj) => {
    // Custom redaction logic
    const redacted = { ...obj }
    if (redacted.email) {
      redacted.email = redacted.email.replace(/(.{2}).*@/, '$1***@')
    }
    return redacted
  },
})

logger.info('User data', {
  username: 'john',
  email: 'john@example.com', // Custom redaction: jo***@example.com
  password: 'secret123', // Built-in redaction: [REDACTED]
  token: 'jwt_token_here', // Built-in redaction: [REDACTED]
})
```

## 🔌 Error Tracking Integration

### Sentry Integration

```typescript
const sentryLogger = createSentryLogger({
  level: 'error',
  enableConsole: true,
  enableInProduction: true,
})

// Automatically sends errors to Sentry
const error = new Error('Something went wrong')
sentryLogger.error('Application error', error, {
  component: 'UserDashboard',
  action: 'loadUserData',
  userId: '123',
})
```

### Custom Integration

```typescript
const logger = new BrowserLogger({
  level: 'error',
  onRemoteError: (error, logs) => {
    // Send to your custom error tracking service
    MyErrorTracker.captureException(error, {
      context: { failedLogs: logs.length },
    })
  },
})
```

## 🌍 Production Deployment

### Environment-Specific Configuration

```typescript
const logger = createLogger({
  level: process.env.NODE_ENV === 'production' ? 'warn' : 'debug',
  enableConsole: process.env.NODE_ENV !== 'production',
  enableInProduction: true, // Allow error/warn logs in production
  remoteEndpoint: process.env.LOG_ENDPOINT,
  batchSize: process.env.NODE_ENV === 'production' ? 100 : 10,
  flushInterval: process.env.NODE_ENV === 'production' ? 60000 : 5000,
})
```

### Performance Considerations

- **Batch Size**: Larger batches (50-100) for production, smaller (5-10) for development
- **Flush Interval**: Longer intervals (30-60s) for production to reduce network requests
- **Log Level**: Use `warn` or `error` in production to reduce noise
- **Sensitive Data**: Always configure `sensitiveFields` for production

## 🧪 Testing

The logger is fully tested with Vitest and includes:

- ✅ All log level functionality
- ✅ Color and formatting options
- ✅ Remote logging with retry logic
- ✅ Sensitive data redaction
- ✅ Performance monitoring
- ✅ Error handling and edge cases
- ✅ Production behavior
- ✅ Integration factory functions

Run tests with:

```bash
pnpm --filter @studio/logger test
```

## 📱 Interactive Demo

Try the interactive demo component to see all features in action:

```typescript
import { LoggerDemo } from '@studio/ui'

// Use in your app or Storybook
<LoggerDemo />
```

The demo includes:

- 🎯 All log levels with live output
- 🏷️ Tags and context examples
- 🔒 Sensitive data redaction
- ⚡ Performance monitoring
- 📊 Console grouping
- 🌐 Remote logging simulation
- 🔧 Interactive configuration

## 🛠️ Advanced Usage

### Custom Log Processors

```typescript
class CustomProcessor {
  static process(logEntry: LogEntry): LogEntry {
    // Add custom fields
    logEntry.environment = process.env.NODE_ENV
    logEntry.buildVersion = process.env.BUILD_VERSION

    // Custom formatting
    if (logEntry.level === 'error') {
      logEntry.priority = 'high'
    }

    return logEntry
  }
}

// Use with remote logging
const logger = createLogger({
  remoteEndpoint: 'https://api.example.com/logs',
  // Custom processing can be added via config extensions
})
```

### Multiple Logger Instances

```typescript
// Different loggers for different parts of your app
const authLogger = createLogger({
  level: 'debug',
  globalContext: { module: 'auth' },
}).withTag('AuthService')

const apiLogger = createLogger({
  level: 'info',
  globalContext: { module: 'api' },
}).withTag('APIClient')

const uiLogger = createLogger({
  level: 'warn',
  globalContext: { module: 'ui' },
}).withTag('UIComponents')
```

## 📊 Monitoring & Analytics

### Log Analytics

The structured format makes logs easy to analyze:

```json
{
  "timestamp": "2024-01-15T10:30:00.000Z",
  "level": "info",
  "message": "User logged in",
  "context": {
    "userId": "123",
    "sessionId": "abc",
    "userAgent": "Chrome/120.0.0.0"
  },
  "tags": ["UserService"],
  "metadata": {
    "file": "auth.tsx",
    "line": 45,
    "function": "handleLogin"
  }
}
```

### Dashboards

Use the structured logs to create dashboards:

- Error rates by component
- Performance metrics by operation
- User action patterns
- Feature usage analytics

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Add tests for new functionality
4. Ensure all tests pass
5. Submit a pull request

## 📄 License

MIT License - see LICENSE file for details.

---

## 🎯 Why BrowserLogger?

- **Production Ready**: Built for real-world applications with proper error handling
- **Developer Friendly**: Rich console output with clickable traces and colors
- **Performance Optimized**: Batching, retry logic, and efficient processing
- **Security Focused**: Built-in sensitive data redaction
- **Extensible**: Easy integration with any logging service
- **Well Tested**: Comprehensive test suite with high coverage
- **TypeScript Native**: Full type safety and excellent IDE support

Perfect for modern React, Next.js, and TypeScript applications that need professional-grade logging capabilities.

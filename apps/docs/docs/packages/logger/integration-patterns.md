# 🔌 Logger Integration Patterns

This guide demonstrates advanced integration patterns, third-party service connections, and architectural patterns for using `@studio/logger` in complex applications.

## 🎯 Overview

The logger package supports various integration patterns for different use cases, from simple console logging to complex multi-service error tracking. This guide covers proven patterns for production applications.

## 🏢 Error Tracking Service Integration

### Sentry Integration

#### Factory Function Approach

```typescript
import * as Sentry from '@sentry/browser'
import { createLogger } from '@studio/logger'

export function createSentryLogger(config: {
  dsn: string
  environment: string
  level?: LogLevel
}) {
  // Initialize Sentry
  Sentry.init({
    dsn: config.dsn,
    environment: config.environment,
  })

  return createLogger({
    level: config.level || 'error',
    enableInProduction: true,
    onRemoteError: (error, logs) => {
      // Send failed logs to Sentry as context
      Sentry.captureException(error, {
        contexts: {
          logs: {
            failed_batch: logs.length,
            sample_logs: logs.slice(0, 3),
          },
        },
      })
    },
    customLogProcessor: (entry) => {
      // Send errors directly to Sentry
      if (entry.level === 'error') {
        Sentry.captureException(new Error(entry.message), {
          contexts: {
            log_entry: entry.context,
            callsite: entry.callsite,
          },
          tags: entry.tags?.reduce(
            (acc, tag) => {
              acc[`tag_${tag}`] = true
              return acc
            },
            {} as Record<string, boolean>,
          ),
        })
      }

      return entry
    },
  })
}

// Usage
const logger = createSentryLogger({
  dsn: 'https://your-sentry-dsn@sentry.io/project',
  environment: 'production',
  level: 'warn',
})

logger.error('Payment processing failed', {
  userId: '123',
  amount: 99.99,
  paymentMethod: 'credit_card',
})
// Automatically sends to both Sentry and logger remote endpoint
```

#### Hook-Based Integration (Browser Only)

```typescript
import * as Sentry from '@sentry/browser'
import { createLogger } from '@studio/logger'

const logger = createLogger({
  level: 'info',
  enableInProduction: true,
  globalContext: {
    service: 'frontend',
    version: process.env.REACT_APP_VERSION,
  },
})

// Hook into all error logs
const originalError = logger.error
logger.error = function (message: string, ...args: any[]) {
  // Call original logger
  originalError.call(this, message, ...args)

  // Send to Sentry
  const context = args.length > 0 && typeof args[0] === 'object' ? args[0] : {}
  Sentry.captureException(new Error(message), {
    contexts: { error_context: context },
    level: 'error',
  })
}
```

### DataDog Integration (Browser Only)

```typescript
import { createLogger } from '@studio/logger'

export function createDatadogLogger(config: {
  apiKey: string
  service: string
  environment: string
}) {
  return createLogger({
    level: 'info',
    remoteEndpoint: `https://http-intake.logs.datadoghq.com/v1/input/${config.apiKey}`,
    globalContext: {
      service: config.service,
      env: config.environment,
      version: process.env.APP_VERSION,
    },
    customRedactionStrategy: (obj) => {
      // DataDog-specific redaction
      const redacted = { ...obj }

      // Remove specific DataDog reserved attributes if accidentally included
      delete redacted.dd
      delete redacted.ddsource
      delete redacted.ddtags

      return redacted
    },
    onRemoteSuccess: (logs) => {
      console.debug(`Sent ${logs.length} logs to DataDog`)
    },
    onRemoteError: (error, logs) => {
      console.error('DataDog logging failed:', error.message)
      // Fallback to local storage or alternative endpoint
    },
  })
}

// Usage with DataDog-specific formatting
const logger = createDatadogLogger({
  apiKey: process.env.DATADOG_API_KEY!,
  service: 'user-service',
  environment: 'production',
})

logger.info('User action completed', {
  userId: '123',
  action: 'profile_update',
  duration: 245,
  // DataDog will automatically index these fields
  'dd.trace_id': getCurrentTraceId(),
  'dd.span_id': getCurrentSpanId(),
})
```

### LogRocket Integration

```typescript
import LogRocket from 'logrocket'
import { createLogger } from '@studio/logger'

export function createLogRocketLogger(config: {
  appId: string
  environment: string
}) {
  LogRocket.init(config.appId)

  return createLogger({
    level: 'info',
    enableInProduction: true,
    globalContext: {
      environment: config.environment,
      session: LogRocket.sessionURL,
    },
    customLogProcessor: (entry) => {
      // Send structured logs to LogRocket
      LogRocket.captureMessage(entry.message, {
        level: entry.level,
        extra: {
          context: entry.context,
          tags: entry.tags,
          callsite: entry.callsite,
        },
      })

      return entry
    },
  })
}

// Advanced usage with user identification
const logger = createLogRocketLogger({
  appId: 'your-app-id',
  environment: 'production',
})

// Identify user for session correlation
function identifyUser(user: { id: string; email: string; name: string }) {
  LogRocket.identify(user.id, {
    email: user.email,
    name: user.name,
  })

  // Update logger context
  const userLogger = logger.withContext({
    userId: user.id,
    userEmail: user.email,
  })

  return userLogger
}
```

## 🎨 Frontend Framework Integration

### React Integration

#### Context Provider Pattern

```typescript
import React, { createContext, useContext, useEffect, useMemo } from 'react'
import { createLogger, Logger } from '@studio/logger'

interface LoggerContextType {
  logger: Logger
  createComponentLogger: (componentName: string) => Logger
}

const LoggerContext = createContext<LoggerContextType | null>(null)

export function LoggerProvider({ children }: { children: React.ReactNode }) {
  const baseLogger = useMemo(() => createLogger({
    level: process.env.NODE_ENV === 'development' ? 'debug' : 'warn',
    enableInProduction: true,
    remoteEndpoint: process.env.REACT_APP_LOG_ENDPOINT,
    globalContext: {
      app: 'frontend',
      version: process.env.REACT_APP_VERSION,
      build: process.env.REACT_APP_BUILD_ID
    }
  }), [])

  const createComponentLogger = (componentName: string) => {
    return baseLogger.withTag(componentName).withContext({
      component: componentName,
      timestamp: new Date().toISOString()
    })
  }

  return (
    <LoggerContext.Provider value={{ logger: baseLogger, createComponentLogger }}>
      {children}
    </LoggerContext.Provider>
  )
}

export function useLogger(componentName?: string): Logger {
  const context = useContext(LoggerContext)
  if (!context) {
    throw new Error('useLogger must be used within LoggerProvider')
  }

  return componentName
    ? context.createComponentLogger(componentName)
    : context.logger
}

// Component usage
function UserProfile({ userId }: { userId: string }) {
  const logger = useLogger('UserProfile')

  useEffect(() => {
    logger.info('Component mounted', { userId })

    return () => {
      logger.info('Component unmounted', { userId })
    }
  }, [logger, userId])

  const handleSave = async () => {
    logger.info('Save initiated', { userId })

    try {
      await saveUserProfile(userId)
      logger.info('Save completed successfully', { userId })
    } catch (error) {
      logger.error('Save failed', {
        userId,
        error: error.message
      })
    }
  }

  return <button onClick={handleSave}>Save Profile</button>
}
```

#### Higher-Order Component Pattern

```typescript
import React from 'react'
import { Logger } from '@studio/logger'

interface WithLoggerProps {
  logger: Logger
}

export function withLogger<P extends WithLoggerProps>(
  WrappedComponent: React.ComponentType<P>,
  componentName?: string
) {
  return function WithLoggerComponent(props: Omit<P, keyof WithLoggerProps>) {
    const logger = useLogger(componentName || WrappedComponent.name)

    return <WrappedComponent {...(props as P)} logger={logger} />
  }
}

// Usage
interface Props extends WithLoggerProps {
  userId: string
}

function UserProfileComponent({ userId, logger }: Props) {
  logger.info('Rendering profile', { userId })

  return <div>User Profile for {userId}</div>
}

export const UserProfile = withLogger(UserProfileComponent, 'UserProfile')
```

### Next.js Integration

#### API Route Logging

```typescript
// utils/api-logger.ts
import { createLogger } from '@studio/logger'
import { NextApiRequest, NextApiResponse } from 'next'

export function createApiLogger(req: NextApiRequest) {
  return createLogger({
    level: 'info',
    globalContext: {
      method: req.method,
      url: req.url,
      userAgent: req.headers['user-agent'],
      ip: req.headers['x-forwarded-for'] || req.connection.remoteAddress,
      requestId: generateRequestId(),
    },
  })
}

// Middleware pattern
export function withLogging<T>(
  handler: (
    req: NextApiRequest,
    res: NextApiResponse,
    logger: Logger,
  ) => Promise<T>,
) {
  return async (req: NextApiRequest, res: NextApiResponse) => {
    const logger = createApiLogger(req)

    logger.info('API request started')
    const startTime = Date.now()

    try {
      const result = await handler(req, res, logger)
      const duration = Date.now() - startTime

      logger.info('API request completed', {
        statusCode: res.statusCode,
        duration,
      })

      return result
    } catch (error) {
      const duration = Date.now() - startTime

      logger.error('API request failed', {
        error: error.message,
        stack: error.stack,
        duration,
      })

      throw error
    }
  }
}

// Usage in API routes
export default withLogging(async (req, res, logger) => {
  logger.info('Processing user update')

  const userId = req.query.id as string
  logger.debug('Extracted user ID', { userId })

  // ... API logic

  res.json({ success: true })
})
```

#### App Router Integration (Next.js 13+)

```typescript
// app/providers.tsx
'use client'

import { LoggerProvider } from './logger-context'

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <LoggerProvider>
      {children}
    </LoggerProvider>
  )
}

// app/layout.tsx
import { Providers } from './providers'

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body>
        <Providers>
          {children}
        </Providers>
      </body>
    </html>
  )
}
```

## 🏗️ Backend Service Integration

### Express.js Middleware (Node.js)

```typescript
import express from 'express'
import { log } from '@studio/logger'

export function createLoggingMiddleware() {
  return (
    req: express.Request,
    res: express.Response,
    next: express.NextFunction,
  ) => {
    const requestContext = {
      method: req.method,
      url: req.originalUrl,
      userAgent: req.get('User-Agent'),
      ip: req.ip,
      requestId: req.headers['x-request-id'] || generateRequestId(),
    }

    // Create a logger function that includes request context
    req.logger = {
      info: (msg: string, additional?: any) =>
        log.info(msg, { ...requestContext, ...additional }),
      warn: (msg: string, additional?: any) =>
        log.warn(msg, { ...requestContext, ...additional }),
      error: (msg: string, additional?: any) =>
        log.error(msg, { ...requestContext, ...additional }),
      debug: (msg: string, additional?: any) =>
        log.debug(msg, { ...requestContext, ...additional }),
    }

    req.logger.info('Request started')
    const startTime = Date.now()

    // Log response
    const originalSend = res.send
    res.send = function (data) {
      const duration = Date.now() - startTime

      req.logger.info('Request completed', {
        statusCode: res.statusCode,
        duration,
        contentLength: data?.length,
      })

      return originalSend.call(this, data)
    }

    next()
  }
}

// Usage
const app = express()
app.use(createLoggingMiddleware())

app.get('/users/:id', (req, res) => {
  req.logger.info('Fetching user', { userId: req.params.id })

  // ... route logic

  res.json({ user: userData })
})
```

### Database Integration

#### Prisma Integration

```typescript
import { PrismaClient } from '@prisma/client'
import { createLogger } from '@studio/logger'

const logger = createLogger({
  level: 'debug',
  globalContext: { component: 'database' },
})

export const prisma = new PrismaClient({
  log: [
    { emit: 'event', level: 'query' },
    { emit: 'event', level: 'error' },
    { emit: 'event', level: 'info' },
    { emit: 'event', level: 'warn' },
  ],
})

// Log all queries
prisma.$on('query', (event) => {
  logger.debug('Database query executed', {
    query: event.query,
    params: event.params,
    duration: event.duration,
    target: event.target,
  })
})

// Log errors
prisma.$on('error', (event) => {
  logger.error('Database error occurred', {
    message: event.message,
    target: event.target,
  })
})

// Middleware for query timing
prisma.$use(async (params, next) => {
  const logger = createLogger({
    globalContext: {
      model: params.model,
      action: params.action,
    },
  })

  logger.debug('Query started', { args: params.args })
  const startTime = Date.now()

  try {
    const result = await next(params)
    const duration = Date.now() - startTime

    logger.info('Query completed', {
      duration,
      resultCount: Array.isArray(result) ? result.length : 1,
    })

    return result
  } catch (error) {
    const duration = Date.now() - startTime

    logger.error('Query failed', {
      duration,
      error: error.message,
    })

    throw error
  }
})
```

## 🧪 Testing Integration Patterns

### Jest/Vitest Integration

The logger package uses standard Vitest mocking patterns. Here's how to mock the logger in your tests:

```typescript
// Mock the entire logger module
import { vi } from 'vitest'

// Mock at the module level
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
  createCliLogger: vi.fn(() => ({
    trace: vi.fn(),
    debug: vi.fn(),
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
  }))
}))

// Individual test setup
beforeEach(() => {
  vi.clearAllMocks()
})

// Component testing with logger
import { render, screen } from '@testing-library/react'
import { log } from '@studio/logger'
import { UserProfile } from './UserProfile'

test('logs component lifecycle events', () => {
  render(<UserProfile userId="123" />)

  expect(log.info).toHaveBeenCalledWith(
    'Component mounted',
    expect.objectContaining({ userId: '123' })
  )
})

// Spy on specific logger methods
test('can spy on logger methods', () => {
  const infoSpy = vi.spyOn(log, 'info')

  // Component or function that uses logger
  someFunction()

  expect(infoSpy).toHaveBeenCalledWith('Expected message')

  infoSpy.mockRestore()
})
```

### Storybook Integration

```typescript
// .storybook/decorators/logger.tsx
import { createLogger } from '@studio/logger'
import { LoggerProvider } from '../../src/contexts/logger'

export const withLogger = (Story, context) => {
  const logger = createLogger({
    level: 'debug',
    enableConsole: true,
    globalContext: {
      story: context.title,
      component: context.component
    }
  })

  return (
    <LoggerProvider value={{ logger, createComponentLogger: (name) => logger.withTag(name) }}>
      <Story />
    </LoggerProvider>
  )
}

// .storybook/main.ts
export default {
  decorators: [withLogger],
  // ... other config
}
```

## 🔄 Advanced Patterns

### Multi-Service Correlation

```typescript
// Correlation ID pattern for microservices
import { v4 as uuid } from 'uuid'
import { createLogger } from '@studio/logger'

export function createCorrelatedLogger(correlationId?: string) {
  const id = correlationId || uuid()

  return createLogger({
    globalContext: {
      correlationId: id,
      service: process.env.SERVICE_NAME,
    },
  })
}

// API Gateway usage
app.use((req, res, next) => {
  const correlationId = req.headers['x-correlation-id'] || uuid()
  res.setHeader('x-correlation-id', correlationId)

  req.logger = createCorrelatedLogger(correlationId)
  next()
})

// Forward correlation ID to downstream services
async function callDownstreamService(data, logger) {
  const correlationId = logger.context.correlationId

  const response = await fetch('https://downstream.service.com/api', {
    headers: {
      'x-correlation-id': correlationId,
      'content-type': 'application/json',
    },
    body: JSON.stringify(data),
  })

  logger.info('Downstream service called', {
    service: 'downstream',
    statusCode: response.status,
    correlationId,
  })

  return response.json()
}
```

### Circuit Breaker Pattern

```typescript
import { createLogger } from '@studio/logger'

class CircuitBreaker {
  private logger = createLogger({
    globalContext: { component: 'circuit-breaker' },
  })
  private failureCount = 0
  private lastFailureTime = 0
  private state: 'closed' | 'open' | 'half-open' = 'closed'

  async execute<T>(
    operation: () => Promise<T>,
    operationName: string,
  ): Promise<T> {
    if (this.state === 'open') {
      this.logger.warn('Circuit breaker is open, rejecting request', {
        operation: operationName,
        failureCount: this.failureCount,
      })
      throw new Error('Circuit breaker is open')
    }

    try {
      this.logger.debug('Executing operation', { operation: operationName })
      const result = await operation()

      this.onSuccess(operationName)
      return result
    } catch (error) {
      this.onFailure(operationName, error)
      throw error
    }
  }

  private onSuccess(operationName: string) {
    this.failureCount = 0
    this.state = 'closed'

    this.logger.info('Operation succeeded, circuit breaker reset', {
      operation: operationName,
    })
  }

  private onFailure(operationName: string, error: any) {
    this.failureCount++
    this.lastFailureTime = Date.now()

    if (this.failureCount >= 5) {
      this.state = 'open'
      this.logger.error('Circuit breaker opened due to failures', {
        operation: operationName,
        failureCount: this.failureCount,
        error: error.message,
      })
    } else {
      this.logger.warn('Operation failed, incrementing failure count', {
        operation: operationName,
        failureCount: this.failureCount,
        error: error.message,
      })
    }
  }
}
```

---

_These integration patterns provide proven approaches for incorporating the logger into complex applications and service architectures._

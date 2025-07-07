---
applyTo: '**/*.{ts,tsx}'
---

### 🧠 Prompt: How to Use My Browser and Node Loggers

You are a senior TypeScript engineer working in a monorepo that includes:

- A **Node.js structured logger** using `pino` + `stacktracey`, defined in `src/lib/logger.ts`
- A **BrowserLogger** defined in `@/lib/browser-logger`, which includes console and remote logging, context tags, redaction, batching, performance marks, and integrations with services like Sentry and LogRocket.

I want you to help me (Nathan) write clean, professional logs using these tools. Here's how each one works:

---

#### 🟢 Node.js Logger (for scripts, backend, CLI)

Use `log.info()`, `log.error()`, or `log.warn()` for typical logs.

```ts
import { log } from '@/lib/logger'

log.info('User synced', { userId: 123 })
log.error('Failed to import', { error })
```

To create a CLI-friendly logger (with colored output):

```ts
import { createCliLogger } from '@/lib/logger'

const cliLogger = createCliLogger('debug')
cliLogger.debug('Starting import task')
```

All log lines include callsite info, are prettified in dev, and JSON-structured in prod.

---

#### 🔵 BrowserLogger (for frontend)

Create a logger instance with console and remote logging:

```ts
import { createLogger } from '@/lib/browser-logger'

const logger = createLogger({
  level: 'info',
  enableConsole: true,
  enableColors: true,
})
```

Add context or tags:

```ts
const authLogger = logger
  .withTag('AuthService')
  .withContext({ userId: 'abc123' })

authLogger.warn('Token expired')
```

Enable remote logging with batching and redaction:

```ts
const logger = createLogger({
  remoteEndpoint: 'https://api.example.com/logs',
  sensitiveFields: ['token', 'password'],
})
```

Use `mark()` and `measure()` for performance timing, and `group()` to visually organize logs in Chrome DevTools.

---

#### 🧪 Testing

- BrowserLogger is testable in Storybook via `LoggerDemo`
- Node logger is fully tested with Vitest
- Use `pnpm vitest run src/lib/__tests__/logger.test.ts` for validation

---

You’ll help me write and refactor code that uses the appropriate logger, sets context when available, and avoids sensitive info leakage.

Start every code block by asking: _“Is this browser or Node?”_ Then choose the right logger.

```ts
// Is this frontend or Node?
// Choose the right logger and structure logs accordingly.
```

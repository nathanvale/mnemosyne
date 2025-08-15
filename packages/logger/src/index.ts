// Export logger functionality
export * from './lib/logger.js'
export * from './lib/logger-demo.js'

// Export browser logger with specific exports to avoid conflicts
export {
  BrowserLogger,
  createLogger as createBrowserLogger,
  createSentryLogger,
  type LogEntry,
  type LogLevel,
  type LogContext,
} from './lib/browser-logger.js'

// Export stacktrace with specific exports to avoid conflicts
export {
  getCallSite,
  type CallSite as StackTraceCallSite,
} from './lib/stacktrace.js'

// Export schema-aware logging utilities
export * from './lib/schema-logging.js'

// Note: The unified createLogger from './lib/logger' is the recommended factory function
// Use createBrowserLogger if you specifically need browser-only features

// Testing utilities are exported separately to avoid importing Vitest in production
// Import from '@studio/logger/testing' in test files

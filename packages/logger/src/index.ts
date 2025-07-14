// Export logger functionality
export * from './lib/logger'
export * from './lib/debug-callsite'
export * from './lib/logger-demo'

// Export browser logger with specific exports to avoid conflicts
export {
  BrowserLogger,
  createLogger as createBrowserLogger,
  createSentryLogger,
  type LogEntry,
  type LogLevel,
  type LogContext,
} from './lib/browser-logger'

// Export stacktrace with specific exports to avoid conflicts
export {
  getCallSite,
  type CallSite as StackTraceCallSite,
} from './lib/stacktrace'

// Note: The unified createLogger from './lib/logger' is the recommended factory function
// Use createBrowserLogger if you specifically need browser-only features

// Testing utilities are exported separately to avoid importing Vitest in production
// Import from '@studio/logger/testing' in test files

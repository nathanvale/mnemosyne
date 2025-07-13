import { log, logger, createCliLogger } from './logger'

// Example usage of the logger
export function demonstrateLogger() {
  console.log('=== Structured Logger Demonstration ===')

  // Using the convenience methods
  log.info('This is an info message with callsite')
  log.warn('This is a warning message')
  log.error('This is an error message')

  // Using the logger directly
  logger.info('Direct logger usage')
  logger.debug('Debug message (may not show unless LOG_LEVEL=debug)')

  // Logging with additional context
  log.info('User action completed', {
    userId: 123,
    action: 'login',
    timestamp: new Date().toISOString(),
  })

  // Logging with error objects
  const sampleError = new Error('Sample error for demonstration')
  log.error('An error occurred', { error: sampleError })

  console.log('=== CLI Logger Demonstration ===')

  // Using the CLI logger for human-readable output
  const cliLogger = createCliLogger('debug')
  cliLogger.info('This is a CLI info message')
  cliLogger.warn('This is a CLI warning message')
  cliLogger.error('This is a CLI error message')
  cliLogger.debug('This is a CLI debug message')

  console.log('=== End Logger Demonstration ===')
}

// Run the demo if this file is executed directly (Node.js only)
if (
  typeof process !== 'undefined' &&
  process.argv &&
  import.meta.url === `file://${process.argv[1]}`
) {
  demonstrateLogger()
}

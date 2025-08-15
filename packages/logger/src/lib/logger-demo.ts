import logger, { cli, debug, production, createLogger } from './logger.js'

// Example usage of the logger
export function demonstrateLogger() {
  console.log('=== Structured Logger Demonstration ===')

  // Using the convenience methods
  logger.info('This is an info message with callsite')
  logger.warn('This is a warning message')
  logger.error('This is an error message')

  // Using the logger directly
  logger.info('Direct logger usage')
  logger.debug('Debug message (may not show unless LOG_LEVEL=debug)')

  // Logging with additional context
  logger.info('User action completed', {
    userId: 123,
    action: 'login',
    timestamp: new Date().toISOString(),
  })

  // Logging with error objects
  const sampleError = new Error('Sample error for demonstration')
  logger.error('An error occurred', { error: sampleError })

  console.log('=== CLI Logger Demonstration ===')

  // Using the CLI logger for human-readable output
  const cliLogger = cli({ level: 'debug' })
  cliLogger.info('This is a CLI info message')
  cliLogger.warn('This is a CLI warning message')
  cliLogger.error('This is a CLI error message')
  cliLogger.debug('This is a CLI debug message')

  console.log('=== Debug Logger Demonstration ===')

  // Using the debug logger for rich development debugging
  const debugLogger = debug({ level: 'trace' })
  debugLogger.trace('This is a trace message with callsite')
  debugLogger.debug('This is a debug message with callsite')

  console.log('=== Production Logger Demonstration ===')

  // Using the production logger for structured JSON output
  const prodLogger = production({ level: 'info' })
  prodLogger.info('Production structured log', {
    service: 'demo',
    version: '1.0.0',
    environment: 'demo',
  })

  console.log('=== Custom Logger Demonstration ===')

  // Using the createLogger for custom configuration
  const customLogger = createLogger({
    level: 'debug',
    prettyPrint: true,
    includeCallsite: true,
  })
  customLogger.debug('Custom logger configuration')

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

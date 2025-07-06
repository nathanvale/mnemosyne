import { useEffect } from 'react'

import { BrowserLogger } from '@/lib/browser-logger'

export function LoggingTest() {
  useEffect(() => {
    console.log('Direct console.log - this should always show')
    console.log('NODE_ENV:', process.env.NODE_ENV)
    console.log('window exists:', typeof window !== 'undefined')

    // Create a logger with clickable traces enabled
    const logger = new BrowserLogger({
      level: 'debug',
      enableConsole: true,
      devClickableTraces: true, // Enable clickable traces
    })

    // Test direct logger calls
    logger.info('Direct info log - should show with clickable trace')
    logger.debug('Direct debug log - should show with clickable trace')

    // Test tagged logger
    const taggedLogger = logger.withTag('logging-test')
    taggedLogger.info(
      'Tagged info log - should show with [logging-test] tag and clickable trace',
    )
    taggedLogger.debug('Tagged debug log - should show with clickable trace')

    // Test with additional data
    taggedLogger.info('User action with data', { userId: 123, action: 'test' })

    // Create logger with clickable traces disabled for comparison
    const simpleLogger = new BrowserLogger({
      level: 'debug',
      enableConsole: true,
      devClickableTraces: false, // Disable clickable traces
    })

    simpleLogger.info('Simple log without clickable traces')

    // Force console output regardless of config
    console.info('[FORCE] Force console output to verify console is working')
  }, [])

  return (
    <div className="p-4 border rounded">
      <h2 className="text-lg font-bold mb-2">Logging Test Component</h2>
      <p>Check the browser console for logging output.</p>
      <p>
        You should see logs with clickable file:line links in Chrome DevTools.
      </p>
      <p>NODE_ENV: {process.env.NODE_ENV}</p>
      <p>Window exists: {typeof window !== 'undefined' ? 'Yes' : 'No'}</p>
    </div>
  )
}

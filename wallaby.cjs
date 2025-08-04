/* wallaby.js */
// eslint-disable-next-line no-undef
module.exports = () => ({
  autoDetect: true,

  // leave files alone (or add your own filter here)
  files: {
    override: (filePatterns) => filePatterns,
  },

  // concatenate original test patterns with exclusions
  tests: {
    override: (testPatterns) => {
      const result = [
        ...testPatterns,
        // Exclude performance-intensive tests from Wallaby.js (run in Vitest only)
        '!packages/memory/src/persistence/__tests__/performance-benchmarks.test.ts',
        '!packages/memory/src/persistence/__tests__/service-thread-safety.test.ts',
        '!packages/memory/src/persistence/__tests__/query-performance*.test.ts',
        '!packages/memory/src/persistence/__tests__/schema-optimization.test.ts',
      ]
      return result
    },
  },

  workers: {
    // Single worker to eliminate output duplication and minimize race conditions
    initial: 1,
    regular: 1, // Reduced to 1 to eliminate output duplication
    recycle: true,
    // Restart workers more frequently to prevent memory leaks
    restart: {
      onFailure: true,
      onRun: false,
      onProject: true,
    },
  },

  // Add delays to reduce race conditions and output frequency
  delays: {
    run: 200, // Increased delay to reduce rapid-fire output
    update: 500, // Reduce update frequency
  },

  // Limit progress reporting to reduce output volume
  reportConsoleErrorAsError: false, // Don't report console.error as test failures
  reportUnhandledPromises: false, // Reduce unhandled promise noise

  // Improve test isolation
  testFramework: {
    // Force test isolation for Vitest
    isolate: true,
  },

  env: {
    type: 'node',
    // Set memory limits to prevent leaks
    runner: 'node',
    params: {
      runner: '--max-old-space-size=4096',
    },
  },

  setup: function (wallaby) {
    // Set worker ID for database isolation
    process.env.WALLABY_WORKER_ID = wallaby.workerId || '0'
    process.env.WALLABY_WORKER = 'true'
    process.env.WALLABY_QUIET = 'true' // Enable quiet mode for reduced output

    // Clear any global state that might persist
    if (global.gc) {
      global.gc()
    }

    // Reset console to prevent log pollution
    console.clear?.()

    // Create output interceptor to limit message length
    const originalConsole = {
      log: console.log,
      warn: console.warn,
      error: console.error,
    }

    // Truncate long messages to prevent token overflow
    const truncateMessage = (msg, maxLength = 100) => {
      if (typeof msg === 'string' && msg.length > maxLength) {
        return msg.substring(0, maxLength) + '...[truncated]'
      }
      return msg
    }

    // Override console methods with truncation
    console.log = (...args) => {
      if (process.env.WALLABY_QUIET === 'true') return // Silent mode
      originalConsole.log(...args.map(arg => truncateMessage(arg)))
    }

    console.warn = (...args) => {
      // Always show warnings but truncate them
      originalConsole.warn(...args.map(arg => truncateMessage(arg)))
    }

    console.error = (...args) => {
      // Always show errors but truncate them
      originalConsole.error(...args.map(arg => truncateMessage(arg)))
    }

    // Store original methods for restoration if needed
    global.__originalConsole = originalConsole
  },

  teardown: function () {
    // Clean up after each test run
    if (global.gc) {
      global.gc()
    }
  },
})

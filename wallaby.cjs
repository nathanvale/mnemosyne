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
    // Reduce workers to minimize race conditions
    initial: 1,
    regular: 2, // Reduced from 4 to minimize state conflicts
    recycle: true,
    // Restart workers more frequently to prevent memory leaks
    restart: {
      onFailure: true,
      onRun: false,
      onProject: true,
    },
  },

  // Add delays to reduce race conditions
  delays: {
    run: 100, // 100ms delay between test runs
  },

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

    // Clear any global state that might persist
    if (global.gc) {
      global.gc()
    }

    // Reset console to prevent log pollution
    console.clear?.()
  },

  teardown: function () {
    // Clean up after each test run
    if (global.gc) {
      global.gc()
    }
  },
})

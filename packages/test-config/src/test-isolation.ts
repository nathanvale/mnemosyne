/**
 * Test isolation utilities to prevent shared state issues in Wallaby.js
 * and other continuous test runners
 */

/**
 * Clear all timeout and interval timers that might persist between tests
 */
export function clearAllTimers(): void {
  // Clear all setTimeout timers
  const highestTimeoutId = setTimeout(() => {}, 0) as unknown as number
  for (let i = 1; i <= highestTimeoutId; i++) {
    clearTimeout(i)
  }

  // Clear all setInterval timers
  const highestIntervalId = setInterval(() => {}, 99999) as unknown as number
  for (let i = 1; i <= highestIntervalId; i++) {
    clearInterval(i)
  }
  clearInterval(highestIntervalId)
}

/**
 * Clear console and reset its state
 */
export function clearConsoleState(): void {
  if (console.clear) {
    console.clear()
  }
  
  // Reset console methods to prevent interference
  if (process.env.NODE_ENV === 'test') {
    const originalMethods = {
      log: console.log,
      error: console.error,
      warn: console.warn,
      info: console.info,
    }
    
    // Restore original methods if they were mocked
    Object.assign(console, originalMethods)
  }
}

/**
 * Clear global variables that might persist between tests
 */
export function clearGlobalState(): void {
  // Clear any global test variables
  const globalKeys = Object.keys(global).filter(key => 
    key.startsWith('test') || 
    key.startsWith('mock') ||
    key.startsWith('_test')
  )
  
  globalKeys.forEach(key => {
    delete (global as any)[key]
  })
  
  // Force garbage collection if available
  if (global.gc) {
    global.gc()
  }
}

/**
 * Reset process environment variables that might affect tests
 */
export function resetProcessEnv(): void {
  // Preserve essential test environment variables
  const preserveKeys = [
    'NODE_ENV',
    'WALLABY_WORKER',
    'WALLABY_WORKER_ID',
    'VITEST',
    'VITEST_WORKER_ID',
  ]
  
  // Remove any test-specific env vars that might persist
  Object.keys(process.env).forEach(key => {
    if (key.startsWith('TEST_') && !preserveKeys.includes(key)) {
      delete process.env[key]
    }
  })
}

/**
 * Complete test isolation cleanup - call this in beforeEach hooks
 */
export function isolateTest(): void {
  clearAllTimers()
  clearConsoleState()
  clearGlobalState()
  resetProcessEnv()
}

/**
 * Deep clone objects to prevent mutations between tests
 */
export function deepClone<T>(obj: T): T {
  if (obj === null || typeof obj !== 'object') {
    return obj
  }
  
  if (obj instanceof Date) {
    return new Date(obj.getTime()) as unknown as T
  }
  
  if (obj instanceof Array) {
    return obj.map(item => deepClone(item)) as unknown as T
  }
  
  if (typeof obj === 'object') {
    const cloned = {} as T
    for (const key in obj) {
      if (obj.hasOwnProperty(key)) {
        cloned[key] = deepClone(obj[key])
      }
    }
    return cloned
  }
  
  return obj
}

/**
 * Create isolated mock data that won't interfere between tests
 */
export function createIsolatedMock<T>(factory: () => T): () => T {
  return () => deepClone(factory())
}

/**
 * Memory usage tracking for detecting leaks
 */
export function trackMemoryUsage(): {
  initial: NodeJS.MemoryUsage
  check: () => { current: NodeJS.MemoryUsage; growth: NodeJS.MemoryUsage }
} {
  const initial = process.memoryUsage()
  
  return {
    initial,
    check: () => {
      const current = process.memoryUsage()
      const growth = {
        rss: current.rss - initial.rss,
        heapTotal: current.heapTotal - initial.heapTotal,
        heapUsed: current.heapUsed - initial.heapUsed,
        external: current.external - initial.external,
        arrayBuffers: current.arrayBuffers - initial.arrayBuffers,
      }
      return { current, growth }
    }
  }
}
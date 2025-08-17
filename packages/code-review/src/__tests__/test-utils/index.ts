export { server } from './msw-setup'
export { handlers, errorHandlers } from './msw-handlers'

// Test data factories
export function createMockPR(overrides = {}) {
  return {
    number: 123,
    title: 'Test PR',
    body: 'Test PR description',
    state: 'open',
    ...overrides,
  }
}

export function createMockCodeRabbitResponse(overrides = {}) {
  return {
    success: true,
    analysis: {
      summary: 'Test analysis summary',
      issues: [],
      metrics: {
        complexity: 5,
        coverage: 80,
        maintainability: 'A',
      },
    },
    ...overrides,
  }
}

export function createMockEnv(overrides = {}) {
  return {
    GITHUB_TOKEN: 'test-github-token',
    CODERABBIT_API_KEY: 'test-coderabbit-key',
    PR_ANALYSIS_LOG_DIR: '.logs/test',
    PR_ANALYSIS_MAX_FILES: '100',
    PR_ANALYSIS_MAX_FILE_SIZE: '1000000',
    PR_ANALYSIS_CONFIDENCE_THRESHOLD: '70',
    PR_ANALYSIS_TIMEOUT: '30000',
    ...overrides,
  }
}

// Test helpers
export async function withTimeout<T>(
  promise: Promise<T>,
  timeoutMs: number,
): Promise<T> {
  const timeout = new Promise<never>((_, reject) => {
    setTimeout(() => reject(new Error('Operation timed out')), timeoutMs)
  })
  return Promise.race([promise, timeout])
}

export function captureConsoleOutput() {
  /* eslint-disable no-console */
  const originalLog = console.log
  const originalError = console.error
  const originalWarn = console.warn
  const output: string[] = []

  console.log = (...args: unknown[]) => {
    output.push(args.join(' '))
  }
  console.error = (...args: unknown[]) => {
    output.push(`ERROR: ${args.join(' ')}`)
  }
  console.warn = (...args: unknown[]) => {
    output.push(`WARN: ${args.join(' ')}`)
  }

  return {
    getOutput: () => output.join('\n'),
    getLines: () => output,
    restore: () => {
      console.log = originalLog
      console.error = originalError
      console.warn = originalWarn
    },
  }
  /* eslint-enable no-console */
}

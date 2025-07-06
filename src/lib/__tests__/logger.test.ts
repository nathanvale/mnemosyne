import { describe, it, expect, vi, beforeEach } from 'vitest'

import { logger, log } from '@/lib/logger'

describe('logger', () => {
  beforeEach(() => {
    vi.resetAllMocks()
  })

  it('should create a logger instance', () => {
    expect(logger).toBeDefined()
    expect(typeof logger.info).toBe('function')
    expect(typeof logger.error).toBe('function')
    expect(typeof logger.warn).toBe('function')
    expect(typeof logger.debug).toBe('function')
  })

  it('should provide convenience log methods', () => {
    expect(log).toBeDefined()
    expect(typeof log.info).toBe('function')
    expect(typeof log.error).toBe('function')
    expect(typeof log.warn).toBe('function')
    expect(typeof log.debug).toBe('function')
    expect(typeof log.trace).toBe('function')
    expect(typeof log.fatal).toBe('function')
  })

  it('should include callsite information in logs', () => {
    const spy = vi.spyOn(logger, 'info')

    // This should trigger the callsite and include location info
    log.info('Test message')

    // Check that the logger was called with callsite information
    expect(spy).toHaveBeenCalledTimes(1)
    const call = spy.mock.calls[0]
    const firstArg = call[0] as unknown as {
      callsite: { file: string; line: number; column: number }
    }
    expect(firstArg).toHaveProperty('callsite')
    expect(firstArg.callsite).toHaveProperty('file')
    expect(firstArg.callsite).toHaveProperty('line')
    expect(firstArg.callsite).toHaveProperty('column')
    expect(firstArg.callsite.file).toContain('logger.test.ts')
    expect(call[1]).toBe('Test message')
  })
})

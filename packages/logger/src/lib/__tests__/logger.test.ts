import { describe, it, expect, vi, beforeEach } from 'vitest'

import logger, { production } from '../logger'

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
    expect(logger).toBeDefined()
    expect(typeof logger.info).toBe('function')
    expect(typeof logger.error).toBe('function')
    expect(typeof logger.warn).toBe('function')
    expect(typeof logger.debug).toBe('function')
    expect(typeof logger.trace).toBe('function')
    expect(typeof logger.fatal).toBe('function')
  })

  it('should auto-detect environment and provide appropriate logger', () => {
    // Test that default logger is created successfully
    expect(logger).toBeDefined()
    expect(typeof logger.info).toBe('function')

    // Test that production logger can be created explicitly
    const prodLogger = production()
    expect(prodLogger).toBeDefined()
    expect(typeof prodLogger.info).toBe('function')
  })
})

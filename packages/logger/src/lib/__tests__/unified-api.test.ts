import { describe, it, expect } from 'vitest'

import { createLogger, log } from '../logger'
import { createMockLogger } from '../testing'

describe('Unified Logger API', () => {
  describe('Unified API Signature', () => {
    it('accepts message and context object', () => {
      expect(() => {
        log.info('User action completed', {
          userId: '123',
          action: 'login',
          duration: 150,
        })
      }).not.toThrow()
    })

    it('accepts message without context', () => {
      expect(() => {
        log.info('Simple message')
      }).not.toThrow()
    })

    it('supports all log levels with unified signature', () => {
      const context = { feature: 'auth', userId: '123' }

      expect(() => {
        log.trace('Trace message', context)
        log.debug('Debug message', context)
        log.info('Info message', context)
        log.warn('Warning message', context)
        log.error('Error message', context)
        log.fatal('Fatal message', context)
      }).not.toThrow()
    })
  })

  describe('Context and Tag Support', () => {
    it('supports withTag for Node.js logger', () => {
      const taggedLogger = log.withTag('UserService')

      expect(taggedLogger).toBeDefined()
      expect(typeof taggedLogger.info).toBe('function')
      expect(typeof taggedLogger.withContext).toBe('function')
    })

    it('supports withContext for Node.js logger', () => {
      const contextLogger = log.withContext({
        service: 'auth',
        version: '1.0.0',
      })

      expect(contextLogger).toBeDefined()
      expect(typeof contextLogger.info).toBe('function')
      expect(typeof contextLogger.withTag).toBe('function')
    })

    it('supports method chaining', () => {
      const chainedLogger = log
        .withTag('APIClient')
        .withContext({ endpoint: '/api/users' })
        .withTag('UserService')

      expect(chainedLogger).toBeDefined()
      expect(typeof chainedLogger.info).toBe('function')
    })
  })

  describe('Unified Factory Function', () => {
    it('creates logger with default configuration', () => {
      const logger = createLogger()

      expect(logger).toBeDefined()
      expect(typeof logger.info).toBe('function')
      expect(typeof logger.withTag).toBe('function')
      expect(typeof logger.withContext).toBe('function')
    })

    it('creates logger with custom configuration', () => {
      const logger = createLogger({
        level: 'warn',
        prettyPrint: true,
        globalContext: { app: 'test' },
        tags: ['TestSuite', 'Integration'],
      })

      expect(logger).toBeDefined()
      expect(typeof logger.info).toBe('function')
    })

    it('supports all configuration options', () => {
      const logger = createLogger({
        level: 'debug',
        prettyPrint: false,
        globalContext: {
          environment: 'test',
          version: '1.0.0',
        },
        tags: ['E2E', 'Auth'],
      })

      expect(() => {
        logger.debug('Test message', { testId: '123' })
        logger.info('Another message')
      }).not.toThrow()
    })
  })

  describe('Testing Utilities', () => {
    it('creates mock logger with all methods', () => {
      const mockLogger = createMockLogger()

      expect(mockLogger.trace).toBeDefined()
      expect(mockLogger.debug).toBeDefined()
      expect(mockLogger.info).toBeDefined()
      expect(mockLogger.warn).toBeDefined()
      expect(mockLogger.error).toBeDefined()
      expect(mockLogger.fatal).toBeDefined()
      expect(mockLogger.withTag).toBeDefined()
      expect(mockLogger.withContext).toBeDefined()
    })

    it('mock logger methods can be spied on', () => {
      const mockLogger = createMockLogger()

      mockLogger.info('Test message', { userId: '123' })

      expect(mockLogger.info).toHaveBeenCalledWith('Test message', {
        userId: '123',
      })
    })

    it('mock logger supports chaining', () => {
      const mockLogger = createMockLogger()

      const chainedLogger = mockLogger.withTag('TestService')

      expect(mockLogger.withTag).toHaveBeenCalledWith('TestService')
      expect(chainedLogger).toBeDefined()
    })
  })

  describe('TypeScript Support', () => {
    it('provides proper type inference', () => {
      const logger = createLogger()

      expect(() => {
        logger.info('String message')
        logger.info('Message with context', { key: 'value' })
        logger.warn('Warning', { code: 404, path: '/api/users' })
        logger.error('Error', {
          error: new Error('Test'),
          userId: '123',
          timestamp: Date.now(),
        })
      }).not.toThrow()
    })

    it('withTag and withContext return proper types', () => {
      const logger = createLogger()

      const taggedLogger = logger.withTag('Service')
      const contextLogger = logger.withContext({ service: 'auth' })

      expect(typeof taggedLogger.info).toBe('function')
      expect(typeof taggedLogger.withTag).toBe('function')
      expect(typeof taggedLogger.withContext).toBe('function')

      expect(typeof contextLogger.info).toBe('function')
      expect(typeof contextLogger.withTag).toBe('function')
      expect(typeof contextLogger.withContext).toBe('function')
    })
  })
})

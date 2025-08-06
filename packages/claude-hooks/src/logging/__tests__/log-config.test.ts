/**
 * Tests for log configuration utility
 */

import { describe, it, expect, beforeEach, vi } from 'vitest'

import { LogConfig, type LogConfigOptions } from '../log-config.js'

describe('LogConfig', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('getEventLoggerConfig', () => {
    it('should return global config by default', () => {
      const config = LogConfig.getEventLoggerConfig()

      expect(config.useLocalDir).toBe(false)
      expect(config.logDir).toBeUndefined()
    })

    it('should return local config when specified', () => {
      const config = LogConfig.getEventLoggerConfig({ useLocal: true })

      expect(config.useLocalDir).toBe(true)
      expect(config.logDir).toBeUndefined()
    })

    it('should use custom directory when specified', () => {
      const customDir = '/custom/log/path'
      const config = LogConfig.getEventLoggerConfig({ logDir: customDir })

      expect(config.logDir).toBe(customDir)
      expect(config.useLocalDir).toBe(false)
    })

    it('should include rotation settings', () => {
      const options: LogConfigOptions = {
        maxFileSize: 1024 * 1024, // 1MB
        retentionDays: 30,
      }

      const config = LogConfig.getEventLoggerConfig(options)

      expect(config.maxFileSize).toBe(1024 * 1024)
      expect(config.retentionDays).toBe(30)
    })
  })

  describe('getTranscriptParserConfig', () => {
    it('should return global config by default', () => {
      const config = LogConfig.getTranscriptParserConfig()

      expect(config.useLocalDir).toBe(false)
      expect(config.storageDir).toBeUndefined()
    })

    it('should return local config when specified', () => {
      const config = LogConfig.getTranscriptParserConfig({ useLocal: true })

      expect(config.useLocalDir).toBe(true)
      expect(config.storageDir).toBeUndefined()
    })

    it('should use custom directory when specified', () => {
      const customDir = '/custom/transcript/path'
      const config = LogConfig.getTranscriptParserConfig({ logDir: customDir })

      expect(config.storageDir).toBe(customDir)
      expect(config.useLocalDir).toBe(false)
    })
  })

  describe('getDefaultOptions', () => {
    it('should return sensible defaults', () => {
      const defaults = LogConfig.getDefaultOptions()

      expect(defaults.useLocal).toBe(false)
      expect(defaults.maxFileSize).toBe(10 * 1024 * 1024) // 10MB
      expect(defaults.retentionDays).toBe(30)
    })
  })

  describe('createConfiguredEventLogger', () => {
    it('should create EventLogger with global config', () => {
      const logger = LogConfig.createConfiguredEventLogger()

      expect(logger).toBeDefined()
      // EventLogger should be configured with global directory
    })

    it('should create EventLogger with local config', () => {
      const logger = LogConfig.createConfiguredEventLogger({ useLocal: true })

      expect(logger).toBeDefined()
      // EventLogger should be configured with local directory
    })
  })

  describe('createConfiguredTranscriptParser', () => {
    it('should create TranscriptParser with global config', () => {
      const parser = LogConfig.createConfiguredTranscriptParser()

      expect(parser).toBeDefined()
      // TranscriptParser should be configured with global directory
    })

    it('should create TranscriptParser with local config', () => {
      const parser = LogConfig.createConfiguredTranscriptParser({
        useLocal: true,
      })

      expect(parser).toBeDefined()
      // TranscriptParser should be configured with local directory
    })
  })
})

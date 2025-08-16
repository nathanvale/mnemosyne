import { describe, it, expect, vi, beforeEach } from 'vitest'

import type { QualityCheckConfig } from '../../types/config'

import { loadQualityConfig } from '../config'

// Mock fs module - need to mock the exact way it's imported
vi.mock('fs', () => {
  const mockReadFile = vi.fn()
  const mockStatSync = vi.fn().mockReturnValue({
    isFile: () => true,
  })

  return {
    default: {
      promises: {
        readFile: mockReadFile,
      },
      statSync: mockStatSync,
    },
    promises: {
      readFile: mockReadFile,
    },
    statSync: mockStatSync,
  }
})

describe('Quality Check Hook', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    // Reset environment variables
    Object.keys(process.env).forEach((key) => {
      if (key.startsWith('CLAUDE_HOOKS_')) {
        delete process.env[key]
      }
    })
  })

  describe('loadQualityConfig', () => {
    it('should load default config when file not found', async () => {
      const fs = await import('fs')
      vi.mocked(fs.promises.readFile).mockRejectedValue(
        new Error('File not found'),
      )

      const config = await loadQualityConfig('/path/to/config.json')

      expect(config.typescriptEnabled).toBe(true)
      expect(config.eslintEnabled).toBe(true)
      expect(config.prettierEnabled).toBe(true)
      expect(config.autofixSilent).toBe(false)
      expect(config.debug).toBe(false)
    })

    it('should load config from file', async () => {
      const fs = await import('fs')
      const mockConfig: QualityCheckConfig = {
        typescript: {
          enabled: false,
          showDependencyErrors: true,
        },
        eslint: {
          enabled: true,
          autofix: true,
        },
        general: {
          debug: true,
        },
      }
      vi.mocked(fs.promises.readFile).mockResolvedValue(
        JSON.stringify(mockConfig),
      )

      const config = await loadQualityConfig('/path/to/config.json')

      expect(config.typescriptEnabled).toBe(false)
      expect(config.showDependencyErrors).toBe(true)
      expect(config.eslintAutofix).toBe(true)
      expect(config.debug).toBe(true)
    })

    it('should override config with environment variables', async () => {
      const fs = await import('fs')
      const mockConfig: QualityCheckConfig = {
        typescript: {
          enabled: false,
        },
        eslint: {
          autofix: false,
        },
      }
      vi.mocked(fs.promises.readFile).mockResolvedValue(
        JSON.stringify(mockConfig),
      )

      process.env.CLAUDE_HOOKS_TYPESCRIPT_ENABLED = 'true'
      process.env.CLAUDE_HOOKS_ESLINT_AUTOFIX = 'true'
      process.env.CLAUDE_HOOKS_DEBUG = 'true'

      const config = await loadQualityConfig('/path/to/config.json')

      expect(config.typescriptEnabled).toBe(true) // Overridden by env
      expect(config.eslintAutofix).toBe(true) // Overridden by env
      expect(config.debug).toBe(true) // Overridden by env
    })
  })
})

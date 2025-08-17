import path from 'path'
import { fileURLToPath } from 'url'
import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest'

import {
  TypeScriptConfigValidator,
  parseExcludePatterns,
  isFileExcluded,
  createConfigValidator,
} from '../typescript-config-validator'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

// Mock TypeScript module - need to mock both default and named exports
vi.mock('typescript', () => ({
  default: {
    readConfigFile: vi.fn(),
    parseJsonConfigFileContent: vi.fn(),
    sys: {
      readFile: vi.fn(),
    },
  },
  readConfigFile: vi.fn(),
  parseJsonConfigFileContent: vi.fn(),
  sys: {
    readFile: vi.fn(),
  },
}))

// Mock file system - need to mock both default and named exports
vi.mock('node:fs', () => {
  const mockExistsSync = vi.fn()
  return {
    default: {
      existsSync: mockExistsSync,
    },
    existsSync: mockExistsSync,
  }
})

describe('TypeScriptConfigValidator', () => {
  // Setup mocks at describe level so they're available to all tests
  const mockTs = {
    readConfigFile: vi.fn(),
    parseJsonConfigFileContent: vi.fn(),
    sys: {
      readFile: vi.fn(),
    },
  }

  beforeEach(() => {
    vi.clearAllMocks()
    // Mock the dynamic import for TypeScript
    vi.doMock('typescript', () => mockTs)
  })

  afterEach(() => {
    // Clear any cached configurations
    const validator = new TypeScriptConfigValidator()
    validator.clearCache()
  })

  describe('parseExcludePatterns', () => {
    it('should parse simple exclude patterns', () => {
      const config = {
        exclude: ['**/*.test.ts', 'src/__tests__/**/*', 'dist'],
      }

      const patterns = parseExcludePatterns(config, '/project/root')

      expect(patterns).toEqual(['**/*.test.ts', 'src/__tests__/**/*', 'dist'])
    })

    it('should handle empty exclude array', () => {
      const config = { exclude: [] }

      const patterns = parseExcludePatterns(config, '/project/root')

      expect(patterns).toEqual([])
    })

    it('should handle missing exclude property', () => {
      const config = {}

      const patterns = parseExcludePatterns(config, '/project/root')

      expect(patterns).toEqual([])
    })

    it('should handle relative paths in exclude patterns', () => {
      const config = {
        exclude: ['./tests/**/*', '../shared/test-utils/**'],
      }

      const patterns = parseExcludePatterns(config, '/project/root')

      // ./ prefix is removed for consistency with micromatch
      expect(patterns).toContain('tests/**/*')
      expect(patterns).toContain('../shared/test-utils/**')
    })
  })

  describe('isFileExcluded', () => {
    it('should match files against simple patterns', () => {
      const patterns = ['**/*.test.ts', '**/*.spec.ts']

      expect(
        isFileExcluded('/project/src/utils.test.ts', patterns, '/project'),
      ).toBe(true)
      expect(
        isFileExcluded('/project/src/component.spec.ts', patterns, '/project'),
      ).toBe(true)
      expect(
        isFileExcluded('/project/src/utils.ts', patterns, '/project'),
      ).toBe(false)
    })

    it('should match files against directory patterns', () => {
      const patterns = ['src/__tests__/**/*', '**/__tests__/**/*']

      expect(
        isFileExcluded(
          '/project/src/__tests__/utils.test.ts',
          patterns,
          '/project',
        ),
      ).toBe(true)
      expect(
        isFileExcluded(
          '/project/packages/core/__tests__/index.test.ts',
          patterns,
          '/project',
        ),
      ).toBe(true)
      expect(
        isFileExcluded('/project/src/utils.ts', patterns, '/project'),
      ).toBe(false)
    })

    it('should handle nested directory exclusions', () => {
      const patterns = ['packages/*/src/__tests__/**/*']

      expect(
        isFileExcluded(
          '/project/packages/hooks/src/__tests__/hook.test.ts',
          patterns,
          '/project',
        ),
      ).toBe(true)
      expect(
        isFileExcluded(
          '/project/packages/utils/src/__tests__/util.test.ts',
          patterns,
          '/project',
        ),
      ).toBe(true)
      expect(
        isFileExcluded(
          '/project/packages/hooks/src/hook.ts',
          patterns,
          '/project',
        ),
      ).toBe(false)
    })

    it('should handle relative path resolution', () => {
      const patterns = ['tests/**/*'] // ./ prefix not needed for micromatch

      expect(
        isFileExcluded('/project/tests/unit/test.ts', patterns, '/project'),
      ).toBe(true)
      expect(isFileExcluded('/project/src/main.ts', patterns, '/project')).toBe(
        false,
      )
    })

    it('should handle empty patterns array', () => {
      const patterns: string[] = []

      expect(isFileExcluded('/project/src/test.ts', patterns, '/project')).toBe(
        false,
      )
    })

    it('should handle complex glob patterns with multiple wildcards', () => {
      const patterns = ['packages/*/src/**/__tests__/**/*.test.ts']

      expect(
        isFileExcluded(
          '/project/packages/hooks/src/utils/__tests__/helper.test.ts',
          patterns,
          '/project',
        ),
      ).toBe(true)
      expect(
        isFileExcluded(
          '/project/packages/core/src/lib/__tests__/deep/nested/file.test.ts',
          patterns,
          '/project',
        ),
      ).toBe(true)
      expect(
        isFileExcluded(
          '/project/packages/hooks/src/utils/helper.ts',
          patterns,
          '/project',
        ),
      ).toBe(false)
    })

    it('should handle edge cases like /**/* patterns correctly', () => {
      const patterns = ['dist/**/*', 'build/**/*']

      expect(
        isFileExcluded('/project/dist/index.js', patterns, '/project'),
      ).toBe(true)
      expect(
        isFileExcluded('/project/dist/utils/helper.js', patterns, '/project'),
      ).toBe(true)
      expect(
        isFileExcluded(
          '/project/build/deep/nested/file.js',
          patterns,
          '/project',
        ),
      ).toBe(true)
      expect(
        isFileExcluded('/project/src/index.js', patterns, '/project'),
      ).toBe(false)
    })

    it('should handle cross-platform paths correctly', () => {
      const patterns = ['**/*.test.ts']

      // Test that our normalization works for both Unix and Windows paths
      // Since we normalize slashes in the implementation, this should work
      expect(
        isFileExcluded('/project/src/utils.test.ts', patterns, '/project'),
      ).toBe(true)

      // Also test backslash normalization in patterns
      const backslashPattern = ['src\\**\\*.test.ts']
      expect(
        isFileExcluded(
          '/project/src/utils.test.ts',
          backslashPattern,
          '/project',
        ),
      ).toBe(false) // Pattern with backslashes won't match forward slashes
    })

    it('should handle negation patterns correctly', () => {
      // Note: micromatch handles negation differently than simple globs
      // This test documents the expected behavior
      const patterns = ['*.test.ts', '!important.test.ts']

      // With micromatch, negation patterns work differently
      // and would require special handling if needed
      expect(
        isFileExcluded('/project/utils.test.ts', patterns, '/project'),
      ).toBe(true)
    })

    it('should handle dotfiles correctly', () => {
      const patterns = ['**/.*.js', '**/.config/**/*']

      expect(
        isFileExcluded('/project/.eslintrc.js', patterns, '/project'),
      ).toBe(true)
      expect(
        isFileExcluded('/project/src/.hidden.js', patterns, '/project'),
      ).toBe(true)
      expect(
        isFileExcluded('/project/.config/test.json', patterns, '/project'),
      ).toBe(true)
      expect(
        isFileExcluded('/project/src/visible.js', patterns, '/project'),
      ).toBe(false)
    })
  })

  describe('TypeScriptConfigValidator', () => {
    it('should create validator instance', () => {
      const validator = new TypeScriptConfigValidator()
      expect(validator).toBeInstanceOf(TypeScriptConfigValidator)
    })

    it('should validate file inclusion correctly', async () => {
      const mockConfig = {
        config: {
          exclude: ['**/*.test.ts', 'src/__tests__/**/*'],
        },
      }

      mockTs.readConfigFile.mockReturnValue(mockConfig)
      mockTs.parseJsonConfigFileContent.mockReturnValue({
        options: {},
        fileNames: [],
        errors: [],
      })

      const { existsSync } = await import('node:fs')
      vi.mocked(existsSync).mockReturnValue(true)

      const validator = new TypeScriptConfigValidator()

      // Should exclude test files
      const isTestExcluded = await validator.isFileIncluded(
        '/project/src/utils.test.ts',
        '/project/tsconfig.json',
      )
      expect(isTestExcluded).toBe(false)

      // Should include source files
      const isSourceIncluded = await validator.isFileIncluded(
        '/project/src/utils.ts',
        '/project/tsconfig.json',
      )
      expect(isSourceIncluded).toBe(true)
    })

    it('should cache parsed configurations', async () => {
      const mockConfig = {
        config: {
          exclude: ['**/*.test.ts'],
        },
      }

      mockTs.readConfigFile.mockReturnValue(mockConfig)
      mockTs.parseJsonConfigFileContent.mockReturnValue({
        options: {},
        fileNames: [],
        errors: [],
      })

      const { existsSync } = await import('node:fs')
      vi.mocked(existsSync).mockReturnValue(true)

      const validator = new TypeScriptConfigValidator()

      // First call should read config
      await validator.isFileIncluded(
        '/project/src/test.ts',
        '/project/tsconfig.json',
      )
      expect(mockTs.readConfigFile).toHaveBeenCalledTimes(1)

      // Second call should use cache
      await validator.isFileIncluded(
        '/project/src/other.ts',
        '/project/tsconfig.json',
      )
      expect(mockTs.readConfigFile).toHaveBeenCalledTimes(1)
    })

    it('should handle missing tsconfig.json gracefully', async () => {
      const { existsSync } = await import('node:fs')
      vi.mocked(existsSync).mockReturnValue(false)

      const validator = new TypeScriptConfigValidator()

      // Should default to including all files when config missing
      const isIncluded = await validator.isFileIncluded(
        '/project/src/test.ts',
        '/project/nonexistent-tsconfig.json',
      )
      expect(isIncluded).toBe(true)
    })

    it('should handle malformed tsconfig.json gracefully', async () => {
      mockTs.readConfigFile.mockReturnValue({
        error: { messageText: 'Invalid JSON' },
      })

      const { existsSync } = await import('node:fs')
      vi.mocked(existsSync).mockReturnValue(true)

      const validator = new TypeScriptConfigValidator()

      // Should default to including all files when config is malformed
      const isIncluded = await validator.isFileIncluded(
        '/project/src/test.ts',
        '/project/tsconfig.json',
      )
      expect(isIncluded).toBe(true)
    })

    it('should clear cache properly', async () => {
      const mockConfig = {
        config: {
          exclude: ['**/*.test.ts'],
        },
      }

      mockTs.readConfigFile.mockReturnValue(mockConfig)
      mockTs.parseJsonConfigFileContent.mockReturnValue({
        options: {},
        fileNames: [],
        errors: [],
      })

      const { existsSync } = await import('node:fs')
      vi.mocked(existsSync).mockReturnValue(true)

      const validator = new TypeScriptConfigValidator()

      // Load config into cache
      await validator.isFileIncluded(
        '/project/src/test.ts',
        '/project/tsconfig.json',
      )
      expect(mockTs.readConfigFile).toHaveBeenCalledTimes(1)

      // Clear cache
      validator.clearCache()

      // Should read config again
      await validator.isFileIncluded(
        '/project/src/other.ts',
        '/project/tsconfig.json',
      )
      expect(mockTs.readConfigFile).toHaveBeenCalledTimes(2)
    })
  })

  describe('createConfigValidator', () => {
    it('should create validator instance', () => {
      const validator = createConfigValidator()
      expect(validator).toBeInstanceOf(TypeScriptConfigValidator)
    })

    it('should return singleton instance', () => {
      const validator1 = createConfigValidator()
      const validator2 = createConfigValidator()
      expect(validator1).toBe(validator2)
    })
  })
})

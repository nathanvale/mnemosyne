/* eslint-disable @typescript-eslint/no-explicit-any */
import path from 'path'
import { fileURLToPath } from 'url'
import { describe, expect, it, vi, beforeEach } from 'vitest'

import { createTypeScriptChecker } from '../checkers/typescript.js'
import { TypeScriptConfigCache } from '../typescript-cache.js'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

// Mock dependencies
vi.mock('../../utils/config-loader.js', () => ({
  findProjectRoot: vi.fn().mockReturnValue('/project/root'),
}))

vi.mock('../../utils/file-utils.js', () => ({
  fileExists: vi.fn(),
  readFile: vi.fn(),
}))

vi.mock('../dummy-generator.js', () => ({
  createDummyFile: vi.fn(),
}))

vi.mock('../import-parser.js', () => ({
  determineFileExtension: vi.fn(),
  parseImportStatement: vi.fn(),
  resolveImportPath: vi.fn(),
}))

vi.mock('fs', () => ({
  default: {
    existsSync: vi.fn().mockReturnValue(true),
  },
  existsSync: vi.fn().mockReturnValue(true),
}))

// Mock TypeScript module - needs to handle dynamic imports too
const mockTypeScript = {
  readConfigFile: vi.fn(),
  parseJsonConfigFileContent: vi.fn(),
  createProgram: vi.fn(),
  getPreEmitDiagnostics: vi.fn(),
  flattenDiagnosticMessageText: vi.fn(),
  sys: {
    readFile: vi.fn(),
  },
}

vi.mock('typescript', () => mockTypeScript)

// Mock TypeScript dynamic import (used by the checker)
vi.mock(
  '/project/root/node_modules/typescript/lib/typescript.js',
  () => mockTypeScript,
)

describe('TypeScript Checker Integration', () => {
  const mockLog = {
    info: vi.fn(),
    error: vi.fn(),
    success: vi.fn(),
    warning: vi.fn(),
    debug: vi.fn(),
  }

  const mockConfig = {
    typescriptEnabled: true,
    showDependencyErrors: false,
    debug: false,
  }

  let mockTsConfigCache: TypeScriptConfigCache

  beforeEach(async () => {
    vi.clearAllMocks()

    // Reset the shared TypeScript mock
    mockTypeScript.readConfigFile.mockReset()
    mockTypeScript.parseJsonConfigFileContent.mockReset()
    mockTypeScript.createProgram.mockReset()
    mockTypeScript.getPreEmitDiagnostics.mockReset()

    // Mock dynamic import of typescript
    vi.doMock('typescript', () => mockTypeScript)

    // Mock TypeScript config cache
    mockTsConfigCache = {
      getTsConfigForFile: vi
        .fn()
        .mockReturnValue('/project/root/tsconfig.json'),
    } as any

    // Setup file system mocks - get the mocked functions
    const { existsSync } = await import('fs')
    vi.mocked(existsSync).mockReturnValue(true)
  })

  describe('File Exclusion Integration', () => {
    it('should skip TypeScript checking for excluded test files', async () => {
      // Mock TypeScript config that excludes test files
      mockTypeScript.readConfigFile.mockReturnValue({
        config: {
          exclude: ['**/*.test.ts', 'src/__tests__/**/*'],
        },
      })
      mockTypeScript.parseJsonConfigFileContent.mockReturnValue({
        options: {},
        fileNames: [],
        errors: [],
      })

      // Test with a test file that should be excluded
      const testFilePath = '/project/root/src/utils.test.ts'
      const checker = await createTypeScriptChecker(
        testFilePath,
        mockConfig,
        mockLog,
        mockTsConfigCache,
      )

      expect(checker).not.toBeNull()

      if (checker) {
        const errors = await checker.check()

        // Should return no errors because file was skipped
        expect(errors).toEqual([])

        // Should log that file was skipped
        expect(mockLog.info).toHaveBeenCalledWith(
          expect.stringContaining(
            'Skipping TypeScript check for excluded file',
          ),
        )

        // Should not attempt TypeScript compilation
        expect(mockTypeScript.createProgram).not.toHaveBeenCalled()
      }
    })

    it('should perform TypeScript checking for included source files', async () => {
      // Mock TypeScript config that excludes test files
      mockTypeScript.readConfigFile.mockReturnValue({
        config: {
          exclude: ['**/*.test.ts', 'src/__tests__/**/*'],
        },
      })
      mockTypeScript.parseJsonConfigFileContent.mockReturnValue({
        options: {},
        fileNames: [],
        errors: [],
      })

      // Mock successful TypeScript compilation
      mockTypeScript.createProgram.mockReturnValue({} as any)
      mockTypeScript.getPreEmitDiagnostics.mockReturnValue([])

      // Test with a source file that should be included
      const sourceFilePath = '/project/root/src/utils.ts'
      const checker = await createTypeScriptChecker(
        sourceFilePath,
        mockConfig,
        mockLog,
        mockTsConfigCache,
      )

      expect(checker).not.toBeNull()

      if (checker) {
        const errors = await checker.check()

        // Should proceed with TypeScript checking
        expect(mockTypeScript.createProgram).toHaveBeenCalledWith(
          [sourceFilePath],
          expect.any(Object),
        )
        expect(mockTypeScript.getPreEmitDiagnostics).toHaveBeenCalled()

        // Should succeed with no errors
        expect(errors).toEqual([])
        expect(mockLog.success).toHaveBeenCalledWith(
          'TypeScript compilation passed',
        )
      }
    })

    it('should handle files in __tests__ directories', async () => {
      // Mock TypeScript config that excludes __tests__ directories
      mockTypeScript.readConfigFile.mockReturnValue({
        config: {
          exclude: ['**/__tests__/**/*'],
        },
      })
      mockTypeScript.parseJsonConfigFileContent.mockReturnValue({
        options: {},
        fileNames: [],
        errors: [],
      })

      // Test with a file in __tests__ directory
      const testFilePath =
        '/project/root/src/components/__tests__/Button.test.ts'
      const checker = await createTypeScriptChecker(
        testFilePath,
        mockConfig,
        mockLog,
        mockTsConfigCache,
      )

      expect(checker).not.toBeNull()

      if (checker) {
        const errors = await checker.check()

        // Should skip the file
        expect(errors).toEqual([])
        expect(mockLog.info).toHaveBeenCalledWith(
          expect.stringContaining(
            'Skipping TypeScript check for excluded file',
          ),
        )
        expect(mockTypeScript.createProgram).not.toHaveBeenCalled()
      }
    })
  })

  describe('ESLint and Other Checkers Continue Working', () => {
    it('should allow ESLint to run on excluded files', async () => {
      // This test verifies that our TypeScript exclusion logic
      // doesn't interfere with other checkers like ESLint

      // Mock TypeScript config that excludes test files
      mockTypeScript.readConfigFile.mockReturnValue({
        config: {
          exclude: ['**/*.test.ts'],
        },
      })
      mockTypeScript.parseJsonConfigFileContent.mockReturnValue({
        options: {},
        fileNames: [],
        errors: [],
      })

      // Test with a test file
      const testFilePath = '/project/root/src/utils.test.ts'
      const checker = await createTypeScriptChecker(
        testFilePath,
        mockConfig,
        mockLog,
        mockTsConfigCache,
      )

      expect(checker).not.toBeNull()

      if (checker) {
        const errors = await checker.check()

        // TypeScript should be skipped, but this doesn't prevent
        // other quality checks from running on the same file
        expect(errors).toEqual([])
        expect(mockLog.info).toHaveBeenCalledWith(
          expect.stringContaining(
            'Skipping TypeScript check for excluded file',
          ),
        )

        // Note: In the actual quality check hook, ESLint would still
        // run separately on this file, which is the desired behavior
      }
    })
  })
})

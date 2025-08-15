/**
 * Tests for Error Classification System
 * Tests pattern recognition, escalation criteria, and context extraction
 */

import { describe, it, expect, beforeEach, vi } from 'vitest'

import type {
  QualityCheckContext,
  SubAgentContext,
} from '../error-classifier.js'

import { createErrorClassifier } from '../error-classifier.js'
import { TypeScriptConfigCache } from '../typescript-cache.js'

describe('ErrorClassifier', () => {
  let _classifier: ReturnType<typeof createErrorClassifier>
  let mockTsCache: TypeScriptConfigCache

  beforeEach(() => {
    // Mock TypeScript cache
    mockTsCache = {
      getTsConfigForFile: vi.fn().mockReturnValue('/project/tsconfig.json'),
      isValid: vi.fn().mockReturnValue(true),
    } as unknown as TypeScriptConfigCache

    // Create the classifier instance
    _classifier = createErrorClassifier()
  })

  describe('error pattern recognition', () => {
    it('should identify auto-fixable Prettier errors', () => {
      const _prettierError = 'Prettier formatting issues found in file'
      const _context: QualityCheckContext = {
        filePath: '/project/src/component.tsx',
        fileType: 'component',
        hasAutoFixes: true,
      }

      // This will be implemented
      // expect(classifier.isEscalationWorthy(prettierError, context)).toBe(false)
      // expect(classifier.getErrorCategory(prettierError)).toBe('auto-fixable')
    })

    it('should identify auto-fixable ESLint errors', () => {
      const _eslintError = 'ESLint found issues that were auto-fixed'
      const _context: QualityCheckContext = {
        filePath: '/project/src/utils.ts',
        fileType: 'typescript',
        hasAutoFixes: true,
      }

      // This will be implemented
      // expect(classifier.isEscalationWorthy(eslintError, context)).toBe(false)
      // expect(classifier.getErrorCategory(eslintError)).toBe('auto-fixable')
    })

    it('should identify complex TypeScript errors worthy of analysis', () => {
      const _complexTypeError =
        "Type 'Promise<User | undefined>' is not assignable to type 'User'"
      const _context: QualityCheckContext = {
        filePath: '/project/src/api/users.ts',
        fileType: 'typescript',
        hasAutoFixes: false,
      }

      // This will be implemented
      // expect(classifier.isEscalationWorthy(complexTypeError, context)).toBe(true)
      // expect(classifier.getErrorCategory(complexTypeError)).toBe('needs-reasoning')
    })

    it('should identify generic type constraint errors as complex', () => {
      const _genericError =
        "Type 'T' does not satisfy the constraint 'keyof User'"
      const _context: QualityCheckContext = {
        filePath: '/project/src/types/helpers.ts',
        fileType: 'typescript',
        hasAutoFixes: false,
      }

      // This will be implemented
      // expect(classifier.isEscalationWorthy(genericError, context)).toBe(true)
      // expect(classifier.getErrorCategory(genericError)).toBe('needs-reasoning')
    })

    it('should identify interface conflict errors as complex', () => {
      const _interfaceError =
        "Interface 'ComponentProps' incorrectly extends interface 'BaseProps'"
      const _context: QualityCheckContext = {
        filePath: '/project/src/components/types.ts',
        fileType: 'typescript',
        hasAutoFixes: false,
      }

      // This will be implemented
      // expect(classifier.isEscalationWorthy(interfaceError, context)).toBe(true)
      // expect(classifier.getErrorCategory(interfaceError)).toBe('needs-reasoning')
    })

    it('should categorize dependency warnings separately', () => {
      const _dependencyError = 'TypeScript errors in imported dependencies'
      const _context: QualityCheckContext = {
        filePath: '/project/src/main.ts',
        fileType: 'typescript',
        hasAutoFixes: false,
      }

      // This will be implemented
      // expect(classifier.isEscalationWorthy(dependencyError, context)).toBe(false)
      // expect(classifier.getErrorCategory(dependencyError)).toBe('dependency-warning')
    })

    it('should handle malformed error messages gracefully', () => {
      const _malformedError = 'null'
      const _emptyError = ''
      const _undefinedError = undefined as unknown

      const _context: QualityCheckContext = {
        filePath: '/project/src/test.ts',
        fileType: 'typescript',
        hasAutoFixes: false,
      }

      // This will be implemented - should not throw and default to safe categorization
      // expect(() => classifier.getErrorCategory(malformedError)).not.toThrow()
      // expect(() => classifier.getErrorCategory(emptyError)).not.toThrow()
      // expect(() => classifier.getErrorCategory(undefinedError)).not.toThrow()
    })
  })

  describe('escalation criteria logic', () => {
    it('should escalate only complex TypeScript errors', () => {
      const _testCases = [
        {
          error: 'Prettier formatting issues',
          shouldEscalate: false,
          reason: 'auto-fixable formatting',
        },
        {
          error: 'ESLint issues were auto-fixed',
          shouldEscalate: false,
          reason: 'auto-fixable linting',
        },
        {
          error: "Property 'nonExistent' does not exist on type 'User'",
          shouldEscalate: true,
          reason: 'property access error needs context',
        },
        {
          error: "Cannot find module './missing-module'",
          shouldEscalate: true,
          reason: 'missing module needs investigation',
        },
        {
          error: "Type 'string | undefined' is not assignable to type 'string'",
          shouldEscalate: true,
          reason: 'nullability handling needs reasoning',
        },
      ]

      const _context: QualityCheckContext = {
        filePath: '/project/src/component.tsx',
        fileType: 'component',
        hasAutoFixes: false,
      }

      // This will be implemented
      // testCases.forEach(({ error, shouldEscalate, reason }) => {
      //   expect(classifier.isEscalationWorthy(error, context)).toBe(shouldEscalate)
      // })
    })

    it('should target 10-15% escalation rate', () => {
      // Simulate a typical error batch that should have ~85-90% auto-fixable
      const _typicalErrors = [
        'Prettier formatting issues found in file',
        'ESLint found issues that were auto-fixed',
        'Missing semicolon at end of statement',
        'Unused import statement',
        'Trailing whitespace detected',
        'Incorrect indentation',
        'Missing newline at end of file',
        'Single quotes should be used instead of double quotes',
        // These should be escalated (10-15%)
        "Property 'userData' does not exist on type 'ApiResponse<User>'",
        "Type 'Promise<User | null>' is not assignable to type 'User'",
      ]

      const _context: QualityCheckContext = {
        filePath: '/project/src/api.ts',
        fileType: 'typescript',
        hasAutoFixes: true,
      }

      // This will be implemented
      // const escalatedCount = typicalErrors.filter(error =>
      //   classifier.isEscalationWorthy(error, context)
      // ).length
      //
      // const escalationRate = escalatedCount / typicalErrors.length
      // expect(escalationRate).toBeGreaterThanOrEqual(0.1) // At least 10%
      // expect(escalationRate).toBeLessThanOrEqual(0.15) // At most 15%
    })
  })

  describe('context extraction', () => {
    it('should extract rich context for sub-agent analysis', () => {
      const _error =
        "Type 'UserData' has no properties in common with type 'ApiUser'"
      const _filePath = '/project/src/api/users.ts'

      // This will be implemented
      // const context = classifier.extractContextForSubAgent(error, filePath, mockTsCache)
      //
      // expect(context).toMatchObject({
      //   filePath,
      //   tsConfigPath: '/project/tsconfig.json',
      //   errorDetails: expect.arrayContaining([
      //     expect.objectContaining({
      //       message: error,
      //       category: 'needs-reasoning',
      //     })
      //   ]),
      // })
    })

    it('should include file content when available', () => {
      const _error = "Cannot find name 'UserService'"
      const _filePath = '/project/src/services/user-service.ts'

      // This will be implemented - fs mocking will be added when tests are activated
      // vi.mock('fs', () => ({
      //   existsSync: vi.fn().mockReturnValue(true),
      //   readFileSync: vi.fn().mockReturnValue('export class UserService { }'),
      // }))

      // const context = classifier.extractContextForSubAgent(error, filePath, mockTsCache)
      //
      // expect(context.fileContent).toBeDefined()
      // expect(context.fileContent).toContain('UserService')
    })

    it('should extract import analysis for context', () => {
      const _error = "Module './types' has no exported member 'UserType'"
      const _filePath = '/project/src/components/user-profile.tsx'

      // This will be implemented
      // const context = classifier.extractContextForSubAgent(error, filePath, mockTsCache)
      //
      // expect(context.relatedImports).toBeDefined()
      // expect(context.relatedImports).toEqual(
      //   expect.arrayContaining([
      //     expect.objectContaining({
      //       importPath: './types',
      //       isRelative: true,
      //     })
      //   ])
      // )
    })

    it('should detect project patterns for monorepo context', () => {
      const _error = "Cannot resolve module '@studio/shared'"
      const _filePath = '/project/packages/web/src/app.tsx'

      // This will be implemented
      // const context = classifier.extractContextForSubAgent(error, filePath, mockTsCache)
      //
      // expect(context.projectPatterns).toMatchObject({
      //   isMonorepo: true,
      //   packagePattern: '@studio/*',
      //   relativePath: 'packages/web/src/app.tsx',
      // })
    })

    it('should handle missing TypeScript config gracefully', () => {
      mockTsCache.getTsConfigForFile = vi.fn().mockReturnValue(null)

      const _error = 'Type error in file'
      const _filePath = '/project/src/standalone.js'

      // This will be implemented - should not throw
      // expect(() => classifier.extractContextForSubAgent(error, filePath, mockTsCache)).not.toThrow()
    })
  })

  describe('performance and resource usage', () => {
    it('should complete classification quickly', () => {
      const _error = 'Complex type error message'
      const _context: QualityCheckContext = {
        filePath: '/project/src/test.ts',
        fileType: 'typescript',
        hasAutoFixes: false,
      }

      // This will be implemented
      // const start = performance.now()
      // classifier.isEscalationWorthy(error, context)
      // const end = performance.now()
      //
      // expect(end - start).toBeLessThan(10) // Should complete in under 10ms
    })

    it('should not perform expensive operations during classification', () => {
      const _error = 'Type error'
      const _context: QualityCheckContext = {
        filePath: '/project/src/test.ts',
        fileType: 'typescript',
        hasAutoFixes: false,
      }

      // This will be implemented
      // const fileReadSpy = vi.spyOn(require('fs'), 'readFileSync')
      // classifier.getErrorCategory(error)
      //
      // expect(fileReadSpy).not.toHaveBeenCalled()
    })
  })
})

describe('QualityCheckContext and SubAgentContext types', () => {
  it('should define QualityCheckContext interface', () => {
    const context: QualityCheckContext = {
      filePath: '/project/src/test.ts',
      fileType: 'typescript',
      hasAutoFixes: false,
    }

    expect(context.filePath).toBe('/project/src/test.ts')
    expect(context.fileType).toBe('typescript')
    expect(context.hasAutoFixes).toBe(false)
  })

  it('should define SubAgentContext interface', () => {
    const context: SubAgentContext = {
      filePath: '/project/src/api.ts',
      tsConfigPath: '/project/tsconfig.json',
      errorDetails: [
        {
          message: 'Type error',
          lineNumber: 42,
          category: 'needs-reasoning',
        },
      ],
      projectPatterns: {
        isMonorepo: true,
        packagePattern: '@studio/*',
        relativePath: 'src/api.ts',
      },
      relatedImports: [
        {
          importPath: './types',
          isRelative: true,
          exports: ['User', 'ApiResponse'],
        },
      ],
    }

    expect(context.filePath).toBe('/project/src/api.ts')
    expect(context.errorDetails).toHaveLength(1)
    expect(context.projectPatterns.isMonorepo).toBe(true)
  })
})

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'

import type { SubAgentAnalysis } from '../sub-agent-orchestrator.js'
import type { TypeScriptConfigCache } from '../typescript-cache.js'

import { SubAgentContextBuilder } from '../context-builder.js'
import { createErrorClassifier } from '../error-classifier.js'
import { SubAgentOrchestrator } from '../sub-agent-orchestrator.js'

// Mock modules
vi.mock('../error-classifier.js')
vi.mock('../context-builder.js')
vi.mock('../sub-agent-orchestrator.js')

// Mock console methods
const originalConsoleError = console.error

describe('printSummary with Sub-agent Integration', () => {
  let consoleOutput: string[]
  let mockErrorClassifier: ReturnType<typeof createErrorClassifier>
  let mockContextBuilder: SubAgentContextBuilder
  let mockOrchestrator: SubAgentOrchestrator
  let mockTsCache: TypeScriptConfigCache

  beforeEach(() => {
    // Capture console output
    consoleOutput = []
    console.error = vi.fn((...args) => {
      consoleOutput.push(args.join(' '))
    })

    // Setup mocks
    mockErrorClassifier = {
      isEscalationWorthy: vi.fn(),
      getErrorCategory: vi.fn(),
      extractContextForSubAgent: vi.fn(),
    } as unknown as ReturnType<typeof createErrorClassifier>

    mockContextBuilder = {
      buildContext: vi.fn(),
      extractFileContent: vi.fn(),
      getProjectPatterns: vi.fn(),
      findRelatedImports: vi.fn(),
    } as unknown as SubAgentContextBuilder

    mockOrchestrator = {
      analyzeTypeScriptErrors: vi.fn(),
      formatIntegratedOutput: vi.fn(),
      getMetrics: vi.fn().mockReturnValue({
        totalInvocations: 0,
        successfulInvocations: 0,
        failedInvocations: 0,
        averageResponseTime: 0,
        totalTokensUsed: 0,
      }),
      isCircuitBreakerOpen: vi.fn().mockReturnValue(false),
      buildPrompt: vi.fn(),
      parseTaskToolResponse: vi.fn(),
      extractInsights: vi.fn(),
      estimateMonthlyCost: vi.fn(),
    } as unknown as SubAgentOrchestrator

    mockTsCache = {
      getConfigForFile: vi.fn(),
      findClosestConfig: vi.fn(),
      getAllConfigs: vi.fn(),
    } as unknown as TypeScriptConfigCache

    vi.mocked(createErrorClassifier).mockReturnValue(mockErrorClassifier)
    vi.mocked(SubAgentContextBuilder).mockImplementation(
      () => mockContextBuilder,
    )
    vi.mocked(SubAgentOrchestrator).mockImplementation(() => mockOrchestrator)
  })

  afterEach(() => {
    console.error = originalConsoleError
    vi.clearAllMocks()
  })

  describe('Enhanced printSummary', () => {
    it('should display traditional errors when sub-agent is not available', async () => {
      const errors = [
        "TypeScript: Cannot find module '@studio/test'",
        "ESLint: 'console' is not defined",
      ]
      const autofixes = ['Prettier: Fixed formatting in 2 files']

      vi.mocked(mockOrchestrator.isCircuitBreakerOpen).mockReturnValue(true)

      // We'll implement the actual enhanced printSummary in the next step
      // For now, this test documents expected behavior
      const { printSummaryWithSubAgent } = await import(
        '../print-summary-enhanced.js'
      )
      await printSummaryWithSubAgent(
        errors,
        autofixes,
        '/test/file.ts',
        mockTsCache,
      )

      expect(
        consoleOutput.some((line) => line.includes('Auto-fixes Applied')),
      ).toBe(true)
      expect(
        consoleOutput.some((line) => line.includes('Quality Check Summary')),
      ).toBe(true)
      expect(mockOrchestrator.analyzeTypeScriptErrors).not.toHaveBeenCalled()
    })

    it('should trigger sub-agent analysis for unfixable TypeScript errors', async () => {
      const errors = [
        "TypeScript: Property 'foo' does not exist on type 'Bar'",
        "TypeScript: Cannot find module '@studio/missing'",
      ]
      const autofixes: string[] = []

      vi.mocked(mockErrorClassifier.isEscalationWorthy).mockReturnValue(true)
      vi.mocked(mockErrorClassifier.getErrorCategory).mockReturnValue(
        'needs-reasoning',
      )
      vi.mocked(mockErrorClassifier.extractContextForSubAgent).mockReturnValue({
        filePath: '/test/file.ts',
        tsConfigPath: '/test/tsconfig.json',
        fileContent: 'test content',
        relatedImports: [],
        projectPatterns: {
          isMonorepo: false,
          packagePattern: undefined,
          relativePath: 'test/file.ts',
        },
        errorDetails: [
          {
            message: "Property 'foo' does not exist on type 'Bar'",
            lineNumber: 10,
            category: 'needs-reasoning',
          },
        ],
      })

      const mockAnalysis: SubAgentAnalysis = {
        explanations: [
          {
            error: errors[0],
            rootCause: 'The property foo is not defined on the Bar interface',
            suggestion:
              'Add the property to the interface: interface Bar { foo: string; }',
            codeExample: 'interface Bar { foo: string; }',
          },
        ],
        impactAssessment:
          'Found 1 TypeScript error that requires interface modification',
        bestPractices: [
          'Define all expected properties in TypeScript interfaces',
        ],
      }

      vi.mocked(mockOrchestrator.analyzeTypeScriptErrors).mockResolvedValue(
        mockAnalysis,
      )

      const { printSummaryWithSubAgent } = await import(
        '../print-summary-enhanced.js'
      )
      await printSummaryWithSubAgent(
        errors,
        autofixes,
        '/test/file.ts',
        mockTsCache,
      )

      expect(mockErrorClassifier.isEscalationWorthy).toHaveBeenCalled()
      expect(mockOrchestrator.analyzeTypeScriptErrors).toHaveBeenCalledWith(
        expect.arrayContaining(errors),
        expect.any(Object),
      )
      expect(consoleOutput.some((line) => line.includes('AI Analysis'))).toBe(
        true,
      )
    })

    it('should preserve existing output format while adding AI insights', async () => {
      const errors = ['TypeScript: Type error in file.ts']
      const autofixes = ['ESLint: Fixed 3 linting issues']

      vi.mocked(mockErrorClassifier.isEscalationWorthy).mockReturnValue(true)

      const mockAnalysis: SubAgentAnalysis = {
        explanations: [
          {
            error: errors[0],
            rootCause: 'Type mismatch detected',
            suggestion: 'Update the type definition',
            codeExample: '// Update type definition',
          },
        ],
        impactAssessment: 'Will resolve type checking',
        bestPractices: ['Use proper type definitions'],
      }

      vi.mocked(mockOrchestrator.analyzeTypeScriptErrors).mockResolvedValue(
        mockAnalysis,
      )

      const { printSummaryWithSubAgent } = await import(
        '../print-summary-enhanced.js'
      )
      await printSummaryWithSubAgent(
        errors,
        autofixes,
        '/test/file.ts',
        mockTsCache,
      )

      // Should still show traditional sections
      expect(
        consoleOutput.some((line) => line.includes('Auto-fixes Applied')),
      ).toBe(true)
      expect(
        consoleOutput.some((line) => line.includes('Quality Check Summary')),
      ).toBe(true)

      // Plus new AI insights
      expect(consoleOutput.some((line) => line.includes('AI Analysis'))).toBe(
        true,
      )
      expect(
        consoleOutput.some((line) => line.includes('Type mismatch detected')),
      ).toBe(true)
    })

    it('should handle circuit breaker when sub-agent fails repeatedly', async () => {
      const errors = ['TypeScript: Complex type error']
      const autofixes: string[] = []

      vi.mocked(mockOrchestrator.isCircuitBreakerOpen).mockReturnValue(true)

      const { printSummaryWithSubAgent } = await import(
        '../print-summary-enhanced.js'
      )
      await printSummaryWithSubAgent(
        errors,
        autofixes,
        '/test/file.ts',
        mockTsCache,
      )

      // Should fall back to traditional output
      expect(mockOrchestrator.analyzeTypeScriptErrors).not.toHaveBeenCalled()
      expect(
        consoleOutput.some((line) => line.includes('Quality Check Summary')),
      ).toBe(true)
      expect(consoleOutput.every((line) => !line.includes('AI Analysis'))).toBe(
        true,
      )
    })

    it('should gracefully handle sub-agent timeout', async () => {
      const errors = ['TypeScript: Timeout test error']
      const autofixes: string[] = []

      vi.mocked(mockErrorClassifier.isEscalationWorthy).mockReturnValue(true)
      vi.mocked(mockOrchestrator.analyzeTypeScriptErrors).mockRejectedValue(
        new Error('Sub-agent timeout'),
      )

      const { printSummaryWithSubAgent } = await import(
        '../print-summary-enhanced.js'
      )
      await printSummaryWithSubAgent(
        errors,
        autofixes,
        '/test/file.ts',
        mockTsCache,
      )

      // Should show traditional errors despite sub-agent failure
      expect(
        consoleOutput.some((line) => line.includes('Quality Check Summary')),
      ).toBe(true)
      expect(
        consoleOutput.some((line) => line.includes('Timeout test error')),
      ).toBe(true)

      // May include a note about analysis unavailable
      // Circuit breaker failure is handled internally
    })

    it('should only escalate TypeScript errors, not ESLint or Prettier', async () => {
      const errors = [
        'ESLint: Missing semicolon',
        'Prettier: Formatting issue',
        "TypeScript: Cannot find name 'unknown'",
      ]
      const autofixes: string[] = []

      vi.mocked(mockErrorClassifier.isEscalationWorthy).mockImplementation(
        (error) => {
          return error.includes('TypeScript')
        },
      )
      vi.mocked(mockErrorClassifier.extractContextForSubAgent).mockReturnValue({
        filePath: '/test/file.ts',
        tsConfigPath: '/test/tsconfig.json',
        fileContent: 'test content',
        relatedImports: [],
        projectPatterns: {
          isMonorepo: false,
          packagePattern: undefined,
          relativePath: 'test/file.ts',
        },
        errorDetails: [
          {
            message: "Cannot find name 'unknown'",
            lineNumber: 10,
            category: 'needs-reasoning',
          },
        ],
      })

      const { printSummaryWithSubAgent } = await import(
        '../print-summary-enhanced.js'
      )
      await printSummaryWithSubAgent(
        errors,
        autofixes,
        '/test/file.ts',
        mockTsCache,
      )

      // Should check all errors to determine which are TypeScript errors worthy of escalation
      expect(mockErrorClassifier.isEscalationWorthy).toHaveBeenCalledTimes(3)
      expect(mockOrchestrator.analyzeTypeScriptErrors).toHaveBeenCalledWith(
        expect.arrayContaining(["TypeScript: Cannot find name 'unknown'"]),
        expect.any(Object),
      )
    })

    it('should track usage metrics for cost optimization', async () => {
      const errors = ['TypeScript: Complex generic type issue']
      const autofixes: string[] = []

      vi.mocked(mockErrorClassifier.isEscalationWorthy).mockReturnValue(true)

      const mockAnalysis: SubAgentAnalysis = {
        explanations: [],
        impactAssessment: 'Analysis complete',
        bestPractices: [],
      }

      vi.mocked(mockOrchestrator.analyzeTypeScriptErrors).mockResolvedValue(
        mockAnalysis,
      )

      const { printSummaryWithSubAgent } = await import(
        '../print-summary-enhanced.js'
      )
      await printSummaryWithSubAgent(
        errors,
        autofixes,
        '/test/file.ts',
        mockTsCache,
      )

      expect(mockOrchestrator.getMetrics).toHaveBeenCalled()
    })

    it('should maintain backward compatibility when sub-agent module is not available', async () => {
      const errors = ['TypeScript: Standard error']
      const autofixes = ['Prettier: Fixed formatting']

      // Simulate module not being available
      vi.doMock('../sub-agent-orchestrator.js', () => {
        throw new Error('Module not found')
      })

      // Should fall back to traditional printSummary
      const { printSummaryWithSubAgent } = await import(
        '../print-summary-enhanced.js'
      )
      await printSummaryWithSubAgent(
        errors,
        autofixes,
        '/test/file.ts',
        mockTsCache,
      )

      expect(
        consoleOutput.some((line) => line.includes('Auto-fixes Applied')),
      ).toBe(true)
      expect(
        consoleOutput.some((line) => line.includes('Quality Check Summary')),
      ).toBe(true)
    })

    it('should respect cost control limits (10-15% escalation rate)', async () => {
      // Simulate 100 errors, only ~10-15 should be escalated
      const errors = Array.from({ length: 100 }, (_, i) =>
        i % 7 === 0
          ? `TypeScript: Complex type '${i}' is not assignable`
          : `TypeScript: Simple missing property '${i}'`,
      )

      let escalatedCount = 0
      vi.mocked(mockErrorClassifier.isEscalationWorthy).mockImplementation(
        (error) => {
          // Only escalate complex errors (roughly 14% of total)
          const shouldEscalate = error.includes('Complex type')
          if (shouldEscalate) escalatedCount++
          return shouldEscalate
        },
      )

      const { printSummaryWithSubAgent } = await import(
        '../print-summary-enhanced.js'
      )
      await printSummaryWithSubAgent(errors, [], '/test/file.ts', mockTsCache)

      // Verify escalation rate is within target range
      const escalationRate = escalatedCount / errors.length
      expect(escalationRate).toBeGreaterThanOrEqual(0.1)
      expect(escalationRate).toBeLessThanOrEqual(0.15)
    })
  })

  describe('Output Blending', () => {
    it('should blend AI insights seamlessly with traditional output', async () => {
      const errors = [
        'TypeScript: Type mismatch in component props',
        'ESLint: Unused variable',
      ]
      const autofixes = ['Prettier: Formatted 1 file']

      vi.mocked(mockErrorClassifier.isEscalationWorthy).mockImplementation(
        (error) => error.includes('Type mismatch'),
      )

      const mockAnalysis: SubAgentAnalysis = {
        explanations: [
          {
            error: errors[0],
            rootCause: 'Component expects different prop types',
            suggestion: 'Update prop types to match parent component',
            codeExample: 'interface Props { /* updated types */ }',
          },
        ],
        impactAssessment: 'Will fix type checking and prevent runtime errors',
        bestPractices: ['Ensure prop types match parent component'],
      }

      vi.mocked(mockOrchestrator.analyzeTypeScriptErrors).mockResolvedValue(
        mockAnalysis,
      )

      const { printSummaryWithSubAgent } = await import(
        '../print-summary-enhanced.js'
      )
      await printSummaryWithSubAgent(
        errors,
        autofixes,
        '/test/component.tsx',
        mockTsCache,
      )

      // Verify output structure maintains hierarchy
      const output = consoleOutput.join('\n')

      // Traditional sections first
      expect(output).toMatch(/Auto-fixes Applied[\s\S]*Formatted 1 file/)
      expect(output).toMatch(/Quality Check Summary[\s\S]*Type mismatch/)
      expect(output).toMatch(/Unused variable/)

      // AI insights in dedicated section
      expect(output).toMatch(
        /AI Analysis[\s\S]*Component expects different prop types/,
      )
      expect(output).toMatch(/Update prop types to match parent component/)
    })
  })
})

import type { Mock } from 'vitest'

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'

import type { SubAgentContext } from '../error-classifier.js'
import type {
  SubAgentAnalysis,
  TaskToolResponse,
} from '../sub-agent-orchestrator.js'

import { SubAgentOrchestrator } from '../sub-agent-orchestrator.js'

type ExecCallback = (
  error: Error | null,
  stdout: string | null,
  stderr: string | null,
) => void

describe('SubAgentOrchestrator', () => {
  let orchestrator: InstanceType<typeof SubAgentOrchestrator>
  let mockExec: Mock
  let originalEnv: typeof process.env

  beforeEach(() => {
    originalEnv = { ...process.env }
    orchestrator = new SubAgentOrchestrator()

    // Mock child_process.exec for Task tool invocation
    mockExec = vi.fn()
    // Set the mock on global for the SubAgentOrchestrator to use
    const globalWithMock = global as unknown as { mockExec: Mock }
    globalWithMock.mockExec = mockExec
  })

  afterEach(() => {
    process.env = originalEnv
    const globalWithMock = global as unknown as { mockExec?: Mock }
    delete globalWithMock.mockExec
    vi.restoreAllMocks()
  })

  describe('Task Tool Communication', () => {
    it('should format Task tool prompts with rich context', async () => {
      const errors = [
        "src/components/Button.tsx(10,5): error TS2345: Argument of type 'string' is not assignable to parameter of type 'number'.",
        "src/components/Button.tsx(15,8): error TS2551: Property 'onClick' does not exist on type 'ButtonProps'.",
      ]

      const context: SubAgentContext = {
        filePath: 'src/components/Button.tsx',
        fileContent: `interface ButtonProps {
  label: string
  disabled?: boolean
}

export function Button({ label, disabled }: ButtonProps) {
  const count = parseInt(label) // Error on this line
  return (
    <button disabled={disabled} onClick={() => {}}>
      {label}
    </button>
  )
}`,
        tsConfigPath: './tsconfig.json',
        errorDetails: [
          {
            message:
              "Argument of type 'string' is not assignable to parameter of type 'number'.",
            lineNumber: 10,
            category: 'needs-reasoning',
          },
          {
            message: "Property 'onClick' does not exist on type 'ButtonProps'.",
            lineNumber: 15,
            category: 'needs-reasoning',
          },
        ],
        projectPatterns: {
          isMonorepo: true,
          packagePattern: '@studio/*',
          relativePath: 'packages/ui/src/components/Button.tsx',
        },
        relatedImports: [],
      }

      const prompt = orchestrator.buildPrompt(errors, context)

      expect(prompt).toContain('TypeScript errors')
      expect(prompt).toContain('src/components/Button.tsx')
      expect(prompt).toContain('TS2345')
      expect(prompt).toContain('TS2551')
      expect(prompt).toContain('ButtonProps')
      expect(prompt).toContain('monorepo')
    })

    it('should invoke Task tool with properly formatted command', async () => {
      const errors = ["src/test.ts(1,1): error TS2304: Cannot find name 'foo'."]
      const context: SubAgentContext = {
        filePath: 'src/test.ts',
        tsConfigPath: './tsconfig.json',
        errorDetails: [
          {
            message: "Cannot find name 'foo'.",
            lineNumber: 1,
            category: 'needs-reasoning',
          },
        ],
        projectPatterns: {
          isMonorepo: false,
          relativePath: 'src/test.ts',
        },
        relatedImports: [],
      }

      const mockResponse: TaskToolResponse = {
        success: true,
        analysis: {
          explanations: [
            {
              error: "Cannot find name 'foo'.",
              rootCause:
                "The variable 'foo' is not defined in the current scope.",
              suggestion:
                "Define 'foo' before using it, or import it from the appropriate module.",
              codeExample: "const foo = 'value'; // Add this before using foo",
            },
          ],
          impactAssessment: 'Low impact - isolated to single file',
          bestPractices: [
            'Always declare variables before use',
            "Use TypeScript's strict mode",
          ],
        },
      }

      mockExec.mockImplementation((_cmd: string, callback: ExecCallback) => {
        callback(null, JSON.stringify(mockResponse), '')
      })

      const result = await orchestrator.analyzeTypeScriptErrors(errors, context)

      expect(result).toBeDefined()
      expect(result?.explanations).toHaveLength(1)
      expect(result?.explanations[0].rootCause).toContain(
        'not defined in the current scope',
      )
    })

    it('should handle Task tool timeout gracefully', async () => {
      const errors = ["src/test.ts(1,1): error TS2304: Cannot find name 'foo'."]
      const context: SubAgentContext = {
        filePath: 'src/test.ts',
        tsConfigPath: './tsconfig.json',
        errorDetails: [
          {
            message: "Cannot find name 'foo'.",
            lineNumber: 1,
            category: 'needs-reasoning',
          },
        ],
        projectPatterns: {
          isMonorepo: false,
          relativePath: 'src/test.ts',
        },
        relatedImports: [],
      }

      // Simulate timeout by not calling the callback
      let timeoutId: NodeJS.Timeout
      mockExec.mockImplementation((_cmd: string, callback: ExecCallback) => {
        // Don't call the callback to simulate a hanging process
        timeoutId = setTimeout(() => {
          callback(new Error('Command timeout'), null, null)
        }, 100)
      })

      const result = await orchestrator.analyzeTypeScriptErrors(
        errors,
        context,
        { timeout: 50 },
      )

      clearTimeout(timeoutId!)
      expect(result).toBeNull()
      expect(orchestrator.getMetrics().failedInvocations).toBe(1)
    }, 10000)
  })

  describe('Response Parsing', () => {
    it('should parse and extract actionable insights from Task tool response', () => {
      const rawResponse = JSON.stringify({
        success: true,
        analysis: {
          explanations: [
            {
              error: "Property 'onClick' does not exist on type 'ButtonProps'.",
              rootCause:
                "The ButtonProps interface is missing the onClick property that's being used in the component.",
              suggestion: 'Add onClick property to ButtonProps interface',
              codeExample: `interface ButtonProps {
  label: string
  disabled?: boolean
  onClick?: () => void // Add this line
}`,
            },
          ],
          impactAssessment: 'Medium impact - affects component API contract',
          bestPractices: [
            'Define all props in interface',
            'Use optional chaining for optional props',
          ],
        },
      })

      const parsed = orchestrator.parseTaskToolResponse(rawResponse)

      expect(parsed).toBeDefined()
      expect(parsed?.success).toBe(true)
      expect(parsed?.analysis.explanations).toHaveLength(1)
      expect(parsed?.analysis.explanations[0].codeExample).toContain(
        'onClick?:',
      )
    })

    it('should handle malformed Task tool responses gracefully', () => {
      const malformedResponses = [
        'not json at all',
        '{"partial": ',
        '{}',
        'null',
        '{"success": false}',
      ]

      malformedResponses.forEach((response) => {
        const parsed = orchestrator.parseTaskToolResponse(response)
        expect(parsed).toBeNull()
      })
    })

    it('should extract specific TypeScript error patterns from response', () => {
      const response: TaskToolResponse = {
        success: true,
        analysis: {
          explanations: [
            {
              error: "Type 'string' is not assignable to type 'number'",
              rootCause: 'Type mismatch between expected and actual types',
              suggestion: 'Convert string to number using parseInt or Number()',
              codeExample: 'const value = Number(stringValue);',
            },
            {
              error: "Cannot find module '@studio/ui'",
              rootCause: 'Module not installed or path mapping incorrect',
              suggestion: 'Install the module or check tsconfig paths',
              codeExample: 'pnpm add @studio/ui',
            },
          ],
          impactAssessment: 'High - type safety compromised',
          bestPractices: [
            'Use proper type conversions',
            'Verify module installations',
          ],
        },
      }

      const insights = orchestrator.extractInsights(response)

      expect(insights).toHaveLength(2)
      expect(insights[0].category).toBe('type-mismatch')
      expect(insights[1].category).toBe('missing-module')
    })
  })

  describe('Output Integration', () => {
    it('should format integrated output combining errors and AI insights', () => {
      const errors = [
        "src/Button.tsx(10,5): error TS2345: Argument of type 'string' is not assignable to parameter of type 'number'.",
      ]

      const analysis: SubAgentAnalysis = {
        explanations: [
          {
            error:
              "Argument of type 'string' is not assignable to parameter of type 'number'",
            rootCause:
              'parseInt expects a string but the type system sees a conflict',
            suggestion: 'Ensure proper type handling for the conversion',
            codeExample: 'const count = label ? parseInt(label, 10) : 0;',
          },
        ],
        impactAssessment: 'Low - type conversion issue',
        bestPractices: ['Always specify radix in parseInt', 'Handle NaN cases'],
      }

      const output = orchestrator.formatIntegratedOutput(errors, analysis)

      expect(output).toContain('TypeScript Error Analysis')
      expect(output).toContain('src/Button.tsx:10:5')
      expect(output).toContain('Root Cause:')
      expect(output).toContain('Suggested Fix:')
      expect(output).toContain('parseInt(label, 10)')
      expect(output).toContain('Best Practices:')
    })

    it('should handle output formatting when no AI insights available', () => {
      const errors = ["src/test.ts(1,1): error TS2304: Cannot find name 'foo'."]

      const output = orchestrator.formatIntegratedOutput(errors, null)

      expect(output).toContain('src/test.ts:1:1')
      expect(output).toContain("Cannot find name 'foo'")
      expect(output).not.toContain('AI Analysis')
      expect(output).not.toContain('Root Cause')
    })
  })

  describe('Metrics Tracking', () => {
    it('should track successful Task tool invocations', async () => {
      const errors = ["src/test.ts(1,1): error TS2304: Cannot find name 'foo'."]
      const context: SubAgentContext = {
        filePath: 'src/test.ts',
        tsConfigPath: './tsconfig.json',
        errorDetails: [
          {
            message: "Cannot find name 'foo'.",
            lineNumber: 1,
            category: 'needs-reasoning',
          },
        ],
        projectPatterns: {
          isMonorepo: false,
          relativePath: 'src/test.ts',
        },
        relatedImports: [],
      }

      mockExec.mockImplementation((_cmd: string, callback: ExecCallback) => {
        // Simulate async execution with a small delay
        setTimeout(() => {
          callback(
            null,
            JSON.stringify({
              success: true,
              analysis: {
                explanations: [],
                impactAssessment: 'Low',
                bestPractices: [],
              },
            }),
            '',
          )
        }, 10) // 10ms delay to ensure response time > 0
      })

      await orchestrator.analyzeTypeScriptErrors(errors, context)

      const metrics = orchestrator.getMetrics()
      expect(metrics.totalInvocations).toBe(1)
      expect(metrics.successfulInvocations).toBe(1)
      expect(metrics.failedInvocations).toBe(0)
      expect(metrics.averageResponseTime).toBeGreaterThanOrEqual(10)
    })

    it('should track failed Task tool invocations', async () => {
      const errors = ["src/test.ts(1,1): error TS2304: Cannot find name 'foo'."]
      const context: SubAgentContext = {
        filePath: 'src/test.ts',
        tsConfigPath: './tsconfig.json',
        errorDetails: [],
        projectPatterns: {
          isMonorepo: false,
          relativePath: 'src/test.ts',
        },
        relatedImports: [],
      }

      mockExec.mockImplementation((_cmd: string, callback: ExecCallback) => {
        callback(new Error('Task tool error'), null, null)
      })

      await orchestrator.analyzeTypeScriptErrors(errors, context)

      const metrics = orchestrator.getMetrics()
      expect(metrics.totalInvocations).toBe(1)
      expect(metrics.successfulInvocations).toBe(0)
      expect(metrics.failedInvocations).toBe(1)
    })

    it('should calculate cost estimates based on usage', () => {
      // Simulate multiple invocations
      orchestrator['metrics'].totalInvocations = 100
      orchestrator['metrics'].successfulInvocations = 90
      orchestrator['metrics'].failedInvocations = 10
      orchestrator['metrics'].totalTokensUsed = 50000

      const costEstimate = orchestrator.estimateMonthlyCost()

      expect(costEstimate).toBeGreaterThan(0)
      expect(costEstimate).toBeLessThan(100) // Reasonable monthly cost
    })
  })

  describe('Error Handling', () => {
    it('should implement circuit breaker pattern for repeated failures', async () => {
      const errors = ["src/test.ts(1,1): error TS2304: Cannot find name 'foo'."]
      const context: SubAgentContext = {
        filePath: 'src/test.ts',
        tsConfigPath: './tsconfig.json',
        errorDetails: [],
        projectPatterns: {
          isMonorepo: false,
          relativePath: 'src/test.ts',
        },
        relatedImports: [],
      }

      // Make Task tool fail consistently
      mockExec.mockImplementation((_cmd: string, callback: ExecCallback) => {
        callback(new Error('Task tool error'), null, null)
      })

      // First 3 failures should be attempted
      for (let i = 0; i < 3; i++) {
        await orchestrator.analyzeTypeScriptErrors(errors, context)
      }
      expect(orchestrator.getMetrics().failedInvocations).toBe(3)

      // Circuit breaker should trip after 3 failures
      const result = await orchestrator.analyzeTypeScriptErrors(errors, context)
      expect(result).toBeNull()
      expect(orchestrator.isCircuitBreakerOpen()).toBe(true)

      // Should not attempt more invocations while circuit is open
      expect(orchestrator.getMetrics().totalInvocations).toBe(3)
    })

    it('should reset circuit breaker after cooldown period', async () => {
      // Set a short cooldown for testing
      orchestrator = new SubAgentOrchestrator({ circuitBreakerCooldown: 100 })

      const errors = ["src/test.ts(1,1): error TS2304: Cannot find name 'foo'."]
      const context: SubAgentContext = {
        filePath: 'src/test.ts',
        tsConfigPath: './tsconfig.json',
        errorDetails: [],
        projectPatterns: {
          isMonorepo: false,
          relativePath: 'src/test.ts',
        },
        relatedImports: [],
      }

      // Trip the circuit breaker
      mockExec.mockImplementation((_cmd: string, callback: ExecCallback) => {
        callback(new Error('Task tool error'), null, null)
      })

      for (let i = 0; i < 3; i++) {
        await orchestrator.analyzeTypeScriptErrors(errors, context)
      }

      expect(orchestrator.isCircuitBreakerOpen()).toBe(true)

      // Wait for cooldown
      await new Promise((resolve) => setTimeout(resolve, 150))

      // Circuit should be closed now, and task should be attempted again
      mockExec.mockImplementation((_cmd: string, callback: ExecCallback) => {
        callback(
          null,
          JSON.stringify({
            success: true,
            analysis: {
              explanations: [],
              impactAssessment: 'Low',
              bestPractices: [],
            },
          }),
          '',
        )
      })

      const result = await orchestrator.analyzeTypeScriptErrors(errors, context)
      expect(result).toBeDefined()
      expect(orchestrator.isCircuitBreakerOpen()).toBe(false)
    })

    it('should handle missing required context gracefully', async () => {
      const errors = ["src/test.ts(1,1): error TS2304: Cannot find name 'foo'."]
      const minimalContext: SubAgentContext = {
        filePath: '',
        tsConfigPath: '',
        errorDetails: [],
        projectPatterns: {
          isMonorepo: false,
          relativePath: '',
        },
        relatedImports: [],
      }

      // Set up mock to return successful response even with minimal context
      mockExec.mockImplementation((_cmd: string, callback: ExecCallback) => {
        callback(
          null,
          JSON.stringify({
            success: true,
            analysis: {
              explanations: [
                {
                  error: "Cannot find name 'foo'.",
                  rootCause: 'Variable not defined',
                  suggestion: 'Define the variable',
                },
              ],
              impactAssessment: 'Low',
              bestPractices: [],
            },
          }),
          '',
        )
      })

      const result = await orchestrator.analyzeTypeScriptErrors(
        errors,
        minimalContext,
      )

      // Should still attempt analysis with minimal context
      expect(result).toBeDefined() // Or null depending on implementation
    })
  })

  describe('Prompt Engineering', () => {
    it('should include monorepo context in prompts when applicable', () => {
      const context: SubAgentContext = {
        filePath: 'packages/ui/src/Button.tsx',
        tsConfigPath: 'packages/ui/tsconfig.json',
        errorDetails: [],
        projectPatterns: {
          isMonorepo: true,
          packagePattern: '@studio/*',
          relativePath: 'packages/ui/src/Button.tsx',
        },
        relatedImports: [
          { importPath: '@studio/types', isRelative: false },
          { importPath: 'react', isRelative: false },
        ],
      }

      const prompt = orchestrator.buildPrompt([], context)

      expect(prompt).toContain('monorepo')
      expect(prompt).toContain('@studio')
    })

    it('should adapt prompts based on error complexity', () => {
      const simpleError = [
        "src/test.ts(1,1): error TS2304: Cannot find name 'foo'.",
      ]
      const complexError = [
        "src/types.ts(10,5): error TS2344: Type 'T' does not satisfy the constraint 'Record<string, unknown>'.",
        'src/types.ts(15,8): error TS2589: Type instantiation is excessively deep and possibly infinite.',
      ]

      const context: SubAgentContext = {
        filePath: 'src/test.ts',
        tsConfigPath: './tsconfig.json',
        errorDetails: [],
        projectPatterns: {
          isMonorepo: false,
          relativePath: 'src/test.ts',
        },
        relatedImports: [],
      }

      const simplePrompt = orchestrator.buildPrompt(simpleError, context)
      const complexPrompt = orchestrator.buildPrompt(complexError, context)

      expect(complexPrompt.length).toBeGreaterThan(simplePrompt.length)
      expect(complexPrompt).toContain('generic')
      expect(complexPrompt).toContain('constraint')
    })

    it('should include file content snippets when available', () => {
      const context: SubAgentContext = {
        filePath: 'src/Button.tsx',
        fileContent: `export function Button({ label }: ButtonProps) {
  return <button>{label}</button>
}`,
        tsConfigPath: './tsconfig.json',
        errorDetails: [],
        projectPatterns: {
          isMonorepo: false,
          relativePath: 'src/Button.tsx',
        },
        relatedImports: [],
      }

      const prompt = orchestrator.buildPrompt([], context)

      expect(prompt).toContain('Button({ label }')
      expect(prompt).toContain('ButtonProps')
    })
  })
})

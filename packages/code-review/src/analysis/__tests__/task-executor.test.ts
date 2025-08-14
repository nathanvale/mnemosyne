import { describe, it, expect, vi } from 'vitest'

import {
  DefaultTaskExecutor,
  MockTaskExecutor,
  type TaskExecutor,
  type TaskOptions,
  type TaskResult,
} from '../task-executor.js'

describe('TaskExecutor', () => {
  describe('DefaultTaskExecutor', () => {
    it('should return a basic response with low risk level', async () => {
      const executor = new DefaultTaskExecutor()
      const options: TaskOptions = {
        subagent_type: 'test-agent',
        description: 'Test analysis',
        prompt: 'Analyze this code',
      }

      const response = await executor.execute(options)
      const result: TaskResult = JSON.parse(response)

      expect(result).toBeDefined()
      expect(result.findings).toEqual([])
      expect(result.riskLevel).toBe('low')
      expect(result.recommendations).toContain(
        'Pattern-based analysis used - manual review recommended',
      )
      expect(result.confidence).toBe(0.5)
    })

    it('should handle different task options', async () => {
      const executor = new DefaultTaskExecutor()
      const options: TaskOptions = {
        subagent_type: 'security-analyzer',
        description: 'Security review',
        prompt: 'Check for vulnerabilities',
      }

      const response = await executor.execute(options)
      const result: TaskResult = JSON.parse(response)

      expect(result).toBeDefined()
      expect(result.riskLevel).toBe('low')
      expect(result.confidence).toBe(0.5)
    })

    it('should return consistent JSON structure', async () => {
      const executor = new DefaultTaskExecutor()
      const options: TaskOptions = {
        subagent_type: 'test',
        description: 'Test',
        prompt: 'Test',
      }

      const response = await executor.execute(options)
      expect(() => JSON.parse(response)).not.toThrow()

      const result: TaskResult = JSON.parse(response)
      expect(result).toHaveProperty('findings')
      expect(result).toHaveProperty('riskLevel')
      expect(result).toHaveProperty('recommendations')
      expect(result).toHaveProperty('confidence')
    })
  })

  describe('MockTaskExecutor', () => {
    it('should return default mock response', async () => {
      const executor = new MockTaskExecutor()
      const options: TaskOptions = {
        subagent_type: 'test-agent',
        description: 'Test analysis',
        prompt: 'Analyze this code',
      }

      const response = await executor.execute(options)
      const result: TaskResult = JSON.parse(response)

      expect(result).toBeDefined()
      expect(result.findings).toEqual([])
      expect(result.riskLevel).toBe('medium')
      expect(result.recommendations).toContain('Mock analysis completed')
      expect(result.confidence).toBe(0.8)
    })

    it('should return custom response when provided', async () => {
      const customResponse: TaskResult = {
        findings: [
          {
            id: 'finding-001',
            title: 'Test finding',
          },
        ],
        riskLevel: 'high',
        recommendations: ['Fix the issue'],
        confidence: 0.95,
      }

      const executor = new MockTaskExecutor(customResponse)
      const options: TaskOptions = {
        subagent_type: 'test-agent',
        description: 'Test analysis',
        prompt: 'Analyze this code',
      }

      const response = await executor.execute(options)
      const result: TaskResult = JSON.parse(response)

      expect(result).toEqual(customResponse)
      expect(result.riskLevel).toBe('high')
      expect(result.confidence).toBe(0.95)
    })

    it('should allow updating response with setResponse', async () => {
      const executor = new MockTaskExecutor()
      const options: TaskOptions = {
        subagent_type: 'test-agent',
        description: 'Test analysis',
        prompt: 'Analyze this code',
      }

      const initialResponse = await executor.execute(options)
      const initialResult: TaskResult = JSON.parse(initialResponse)
      expect(initialResult.riskLevel).toBe('medium')

      const newResponse: TaskResult = {
        findings: [],
        riskLevel: 'critical',
        recommendations: ['Critical fix needed'],
        confidence: 1.0,
      }

      executor.setResponse(newResponse)

      const updatedResponse = await executor.execute(options)
      const updatedResult: TaskResult = JSON.parse(updatedResponse)

      expect(updatedResult).toEqual(newResponse)
      expect(updatedResult.riskLevel).toBe('critical')
      expect(updatedResult.confidence).toBe(1.0)
    })

    it('should handle complex findings structure', async () => {
      const complexResponse: TaskResult = {
        findings: [
          {
            id: 'sec-001',
            title: 'SQL Injection',
            severity: 'critical',
            location: {
              file: 'api/users.ts',
              line: 42,
            },
          },
          {
            id: 'sec-002',
            title: 'XSS Vulnerability',
            severity: 'high',
            location: {
              file: 'views/template.ts',
              line: 15,
            },
          },
        ],
        riskLevel: 'critical',
        recommendations: [
          'Use parameterized queries',
          'Sanitize user input',
          'Implement CSP headers',
        ],
        confidence: 0.92,
      }

      const executor = new MockTaskExecutor(complexResponse)
      const response = await executor.execute({
        subagent_type: 'security',
        description: 'Security scan',
        prompt: 'Scan for vulnerabilities',
      })

      const result = JSON.parse(response)
      expect(result.findings).toHaveLength(2)
      expect(result.recommendations).toHaveLength(3)
    })

    it('should be suitable for testing dependency injection', async () => {
      const mockExecutor = new MockTaskExecutor()
      const spy = vi.spyOn(mockExecutor, 'execute')

      await mockExecutor.execute({
        subagent_type: 'test',
        description: 'Test',
        prompt: 'Test',
      })

      expect(spy).toHaveBeenCalledOnce()
      expect(spy).toHaveBeenCalledWith({
        subagent_type: 'test',
        description: 'Test',
        prompt: 'Test',
      })
    })
  })

  describe('TaskExecutor Interface', () => {
    it('should enforce correct interface structure', () => {
      class CustomExecutor implements TaskExecutor {
        async execute(options: TaskOptions): Promise<string> {
          return JSON.stringify({
            findings: [],
            riskLevel: 'low' as const,
            recommendations: [`Custom analysis for ${options.subagent_type}`],
            confidence: 0.7,
          })
        }
      }

      const executor = new CustomExecutor()
      expect(executor.execute).toBeDefined()
      expect(typeof executor.execute).toBe('function')
    })

    it('should support async execution', async () => {
      class AsyncExecutor implements TaskExecutor {
        async execute(_options: TaskOptions): Promise<string> {
          await new Promise((resolve) => setTimeout(resolve, 10))
          return JSON.stringify({
            findings: [],
            riskLevel: 'medium' as const,
            recommendations: ['Async analysis completed'],
            confidence: 0.85,
          })
        }
      }

      const executor = new AsyncExecutor()
      const startTime = Date.now()
      const response = await executor.execute({
        subagent_type: 'async',
        description: 'Async test',
        prompt: 'Test async',
      })
      const endTime = Date.now()

      expect(endTime - startTime).toBeGreaterThanOrEqual(10)
      const result = JSON.parse(response)
      expect(result.recommendations).toContain('Async analysis completed')
    })
  })
})

import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest'

import { PerformanceMonitor } from '../performance-monitor.js'
import { SelectiveEscalation } from '../selective-escalation.js'
import { UsageMetrics } from '../usage-metrics.js'

describe('Usage Metrics and Cost Optimization', () => {
  let usageMetrics: UsageMetrics
  let escalation: SelectiveEscalation
  let performanceMonitor: PerformanceMonitor

  beforeEach(() => {
    usageMetrics = new UsageMetrics()
    escalation = new SelectiveEscalation()
    performanceMonitor = new PerformanceMonitor()

    // Reset all metrics
    usageMetrics.reset()
    performanceMonitor.reset()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe('Usage Tracking', () => {
    it('should track total quality checks performed', () => {
      usageMetrics.recordQualityCheck({
        timestamp: Date.now(),
        hasErrors: true,
        errorCount: 5,
        escalated: false,
      })

      usageMetrics.recordQualityCheck({
        timestamp: Date.now(),
        hasErrors: true,
        errorCount: 3,
        escalated: true,
      })

      const stats = usageMetrics.getStatistics()
      expect(stats.totalChecks).toBe(2)
      expect(stats.checksWithErrors).toBe(2)
      expect(stats.escalatedChecks).toBe(1)
    })

    it('should calculate escalation percentage accurately', () => {
      // Record 100 quality checks
      for (let i = 0; i < 100; i++) {
        usageMetrics.recordQualityCheck({
          timestamp: Date.now(),
          hasErrors: true,
          errorCount: Math.floor(Math.random() * 10) + 1,
          escalated: i < 12, // Escalate first 12 checks
        })
      }

      const stats = usageMetrics.getStatistics()
      expect(stats.escalationPercentage).toBe(12)
      expect(stats.escalationPercentage).toBeLessThanOrEqual(15)
      expect(stats.escalationPercentage).toBeGreaterThanOrEqual(10)
    })

    it('should track error patterns for optimization', () => {
      const errorPatterns = [
        "Cannot find name 'foo'",
        "Type 'string' is not assignable to type 'number'",
        "Cannot find name 'foo'", // Duplicate
        "Property 'bar' does not exist on type",
        "Cannot find name 'foo'", // Another duplicate
      ]

      errorPatterns.forEach((error) => {
        usageMetrics.recordErrorPattern({
          error,
          escalated: error.includes('Cannot find name'),
          resolved: false,
        })
      })

      const patterns = usageMetrics.getErrorPatterns()
      expect(patterns['Cannot find name']).toBe(3)
      expect(patterns['Type mismatch']).toBeDefined()
      expect(patterns['Property missing']).toBeDefined()
    })

    it('should track time-based usage patterns', () => {
      const now = Date.now()
      const hourAgo = now - 30 * 60 * 1000 // 30 minutes ago (well within last hour)
      const dayAgo = now - 25 * 60 * 60 * 1000 // 25 hours ago (outside last 24 hours)

      usageMetrics.recordQualityCheck({
        timestamp: dayAgo,
        hasErrors: true,
        errorCount: 5,
        escalated: true,
      })

      usageMetrics.recordQualityCheck({
        timestamp: hourAgo,
        hasErrors: true,
        errorCount: 3,
        escalated: true,
      })

      usageMetrics.recordQualityCheck({
        timestamp: now,
        hasErrors: false,
        errorCount: 0,
        escalated: false,
      })

      const hourlyStats = usageMetrics.getHourlyStatistics()
      const dailyStats = usageMetrics.getDailyStatistics()

      expect(hourlyStats.totalChecks).toBe(2) // Last hour (hourAgo + now)
      expect(dailyStats.totalChecks).toBe(2) // Last 24 hours (hourAgo + now, dayAgo is excluded)
    })

    it('should calculate rolling averages for trend analysis', () => {
      // Simulate escalation pattern over time
      const timestamps = []
      for (let i = 0; i < 200; i++) {
        const timestamp = Date.now() - (200 - i) * 60 * 1000 // Last 200 minutes
        timestamps.push(timestamp)

        usageMetrics.recordQualityCheck({
          timestamp,
          hasErrors: true,
          errorCount: Math.floor(Math.random() * 5) + 1,
          escalated: i % 10 === 0, // Escalate every 10th check (10%)
        })
      }

      const rollingAvg = usageMetrics.getRollingEscalationAverage(60) // Last 60 checks
      expect(rollingAvg).toBeCloseTo(10, 1) // Should be around 10%
    })
  })

  describe('Cost Tracking', () => {
    it('should estimate API costs based on token usage', () => {
      const costTracker = usageMetrics.getCostTracker()

      // Simulate multiple sub-agent invocations
      for (let i = 0; i < 10; i++) {
        costTracker.recordInvocation({
          promptTokens: 500,
          completionTokens: 200,
          model: 'claude-3-opus',
          success: true,
        })
      }

      const estimate = costTracker.getMonthlyEstimate()
      expect(estimate.totalCost).toBeGreaterThan(0)
      expect(estimate.averageTokensPerInvocation).toBe(700)
      expect(estimate.projectedMonthlyInvocations).toBeGreaterThan(0)
    })

    it('should track cost by error category', () => {
      const costTracker = usageMetrics.getCostTracker()

      costTracker.recordCategorizedInvocation({
        category: 'type-mismatch',
        promptTokens: 600,
        completionTokens: 250,
        model: 'claude-3-opus',
        success: true,
      })

      costTracker.recordCategorizedInvocation({
        category: 'missing-import',
        promptTokens: 400,
        completionTokens: 150,
        model: 'claude-3-opus',
        success: true,
      })

      costTracker.recordCategorizedInvocation({
        category: 'type-mismatch',
        promptTokens: 550,
        completionTokens: 230,
        model: 'claude-3-opus',
        success: true,
      })

      const categoryCosts = costTracker.getCostByCategory()
      expect(categoryCosts['type-mismatch'].invocations).toBe(2)
      expect(categoryCosts['type-mismatch'].averageTokens).toBe(815) // (850 + 780) / 2
      expect(categoryCosts['missing-import'].invocations).toBe(1)
    })

    it('should provide cost optimization recommendations', () => {
      const costTracker = usageMetrics.getCostTracker()

      // Simulate high-cost pattern
      for (let i = 0; i < 50; i++) {
        costTracker.recordInvocation({
          promptTokens: 2000, // High token usage
          completionTokens: 1000,
          model: 'claude-3-opus',
          success: true,
        })
      }

      const recommendations = costTracker.getOptimizationRecommendations()
      expect(recommendations).toContain('high token usage')
      expect(recommendations).toContain('context reduction')
    })

    it('should track cost savings from caching', () => {
      const costTracker = usageMetrics.getCostTracker()

      // Record cached vs non-cached invocations
      costTracker.recordInvocation({
        promptTokens: 500,
        completionTokens: 200,
        model: 'claude-3-opus',
        success: true,
        cached: false,
      })

      costTracker.recordInvocation({
        promptTokens: 0, // Cached response
        completionTokens: 0,
        model: 'claude-3-opus',
        success: true,
        cached: true,
      })

      const savings = costTracker.getCachingSavings()
      expect(savings.cachedInvocations).toBe(1)
      expect(savings.savedTokens).toBe(700)
      expect(savings.estimatedSavings).toBeGreaterThan(0)
    })
  })

  describe('Selective Escalation Logic', () => {
    it('should escalate only 10-15% of quality checks', () => {
      const errors = [
        "Cannot find name 'foo'",
        'Unexpected token',
        "Type 'string' is not assignable",
        'Missing semicolon',
        'Property does not exist',
      ]

      let escalationCount = 0
      const totalChecks = 100

      for (let i = 0; i < totalChecks; i++) {
        const error = errors[i % errors.length]
        const shouldEscalate = escalation.shouldEscalate({
          error,
          errorCount: Math.floor(Math.random() * 5) + 1,
          complexity: Math.random(),
          previousEscalations: escalationCount,
          totalChecks: i + 1,
        })

        if (shouldEscalate) {
          escalationCount++
        }
      }

      const escalationPercentage = (escalationCount / totalChecks) * 100
      expect(escalationPercentage).toBeGreaterThanOrEqual(10)
      expect(escalationPercentage).toBeLessThanOrEqual(15)
    })

    it('should prioritize complex TypeScript errors for escalation', () => {
      const simpleError = 'Missing semicolon'
      const complexError =
        "Type 'T' does not satisfy the constraint 'Record<string, unknown>'"

      escalation.shouldEscalate({
        error: simpleError,
        errorCount: 1,
        complexity: escalation.calculateComplexity(simpleError),
        previousEscalations: 0,
        totalChecks: 10,
      })

      escalation.shouldEscalate({
        error: complexError,
        errorCount: 1,
        complexity: escalation.calculateComplexity(complexError),
        previousEscalations: 0,
        totalChecks: 10,
      })

      // Complex errors should have higher escalation probability
      expect(escalation.calculateComplexity(complexError)).toBeGreaterThan(
        escalation.calculateComplexity(simpleError),
      )
    })

    it('should implement adaptive thresholds based on recent patterns', () => {
      // Simulate a burst of errors
      for (let i = 0; i < 20; i++) {
        escalation.recordCheck({
          timestamp: Date.now(),
          hasErrors: true,
          errorCount: 10, // High error count
          escalated: i < 3, // Only escalate first 3
        })
      }

      // Threshold should adapt to be more selective
      const threshold = escalation.getAdaptiveThreshold()
      expect(threshold).toBeGreaterThan(0.85) // Should be more selective

      // Simulate period with few errors
      for (let i = 0; i < 20; i++) {
        escalation.recordCheck({
          timestamp: Date.now(),
          hasErrors: true,
          errorCount: 1, // Low error count
          escalated: false,
        })
      }

      // Threshold should adapt to be less selective
      const newThreshold = escalation.getAdaptiveThreshold()
      expect(newThreshold).toBeLessThan(threshold)
    })

    it('should respect cooldown periods between escalations', () => {
      vi.useFakeTimers()
      const cooldownMs = 1000 // 1 second cooldown

      escalation.setCooldownPeriod(cooldownMs)

      // First escalation should succeed
      const first = escalation.shouldEscalate({
        error: 'Complex error',
        errorCount: 5,
        complexity: 0.9,
        previousEscalations: 0,
        totalChecks: 1,
      })
      expect(first).toBe(true)

      // Immediate second escalation should be blocked by cooldown
      const second = escalation.shouldEscalate({
        error: 'Another complex error',
        errorCount: 5,
        complexity: 0.9,
        previousEscalations: 1,
        totalChecks: 2,
      })
      expect(second).toBe(false)

      // After cooldown, escalation should be allowed again
      vi.advanceTimersByTime(cooldownMs + 100)

      const third = escalation.shouldEscalate({
        error: 'Yet another complex error',
        errorCount: 5,
        complexity: 0.9,
        previousEscalations: 1,
        totalChecks: 3,
      })
      expect(third).toBe(true)

      vi.useRealTimers()
    })

    it('should provide escalation decision explanations', () => {
      const decision = escalation.explainDecision({
        error: 'Type instantiation is excessively deep',
        errorCount: 3,
        complexity: 0.95,
        previousEscalations: 5,
        totalChecks: 50,
      })

      expect(decision.shouldEscalate).toBeDefined()
      expect(decision.reason).toBeDefined()
      expect(decision.factors).toContain('complexity')
      expect(decision.currentEscalationRate).toBeCloseTo(0.1, 1)
    })
  })

  describe('Performance Monitoring', () => {
    it('should track sub-agent analysis overhead', async () => {
      // Simulate sub-agent invocation
      await performanceMonitor.measureAsync('subagent-analysis', async () => {
        await new Promise((resolve) => setTimeout(resolve, 100))
        return { success: true }
      })

      const metrics = performanceMonitor.getMetrics('subagent-analysis')
      expect(metrics.count).toBe(1)
      expect(metrics.averageTime).toBeGreaterThanOrEqual(100)
      expect(metrics.maxTime).toBeGreaterThanOrEqual(100)
    })

    it('should track memory usage during analysis', () => {
      const initialMemory = process.memoryUsage().heapUsed

      performanceMonitor.startMemoryTracking('analysis')

      // Simulate memory-intensive operation
      new Array(1000000).fill('data')

      performanceMonitor.stopMemoryTracking('analysis')

      const memoryMetrics = performanceMonitor.getMemoryMetrics('analysis')
      expect(memoryMetrics.peakUsage).toBeGreaterThan(initialMemory)
      expect(memoryMetrics.averageUsage).toBeGreaterThan(0)
    })

    it('should identify performance bottlenecks', async () => {
      // Simulate various operations with different timings
      await performanceMonitor.measureAsync('parsing', async () => {
        await new Promise((resolve) => setTimeout(resolve, 5))
      })

      await performanceMonitor.measureAsync('context-building', async () => {
        await new Promise((resolve) => setTimeout(resolve, 10))
      })

      await performanceMonitor.measureAsync('task-invocation', async () => {
        await new Promise((resolve) => setTimeout(resolve, 20))
      })

      const bottlenecks = performanceMonitor.identifyBottlenecks()
      expect(bottlenecks[0].operation).toBe('task-invocation')
      expect(bottlenecks[0].averageTime).toBeGreaterThanOrEqual(20)
    })

    it('should track cache hit rates for performance optimization', () => {
      performanceMonitor.recordCacheAccess('error-patterns', true) // hit
      performanceMonitor.recordCacheAccess('error-patterns', true) // hit
      performanceMonitor.recordCacheAccess('error-patterns', false) // miss
      performanceMonitor.recordCacheAccess('context-cache', true) // hit
      performanceMonitor.recordCacheAccess('context-cache', false) // miss

      const cacheStats = performanceMonitor.getCacheStatistics()
      expect(cacheStats['error-patterns'].hitRate).toBeCloseTo(0.67, 2)
      expect(cacheStats['context-cache'].hitRate).toBe(0.5)
    })

    it('should provide performance recommendations', () => {
      // Simulate poor performance patterns
      for (let i = 0; i < 10; i++) {
        performanceMonitor.recordOperation({
          name: 'subagent-analysis',
          duration: 5000, // 5 seconds - too slow
          success: true,
        })
      }

      performanceMonitor.recordCacheAccess('context-cache', false)
      performanceMonitor.recordCacheAccess('context-cache', false)
      performanceMonitor.recordCacheAccess('context-cache', false)

      const recommendations = performanceMonitor.getRecommendations()
      expect(recommendations).toContain('analysis time exceeds threshold')
      expect(recommendations).toContain('cache hit rate is low')
    })

    it('should track concurrent operation limits', async () => {
      const operations = []

      // Try to run multiple concurrent operations
      for (let i = 0; i < 5; i++) {
        operations.push(
          performanceMonitor.measureAsync(`operation-${i}`, async () => {
            await new Promise((resolve) => setTimeout(resolve, 1))
          }),
        )
      }

      await Promise.all(operations)

      const concurrencyMetrics = performanceMonitor.getConcurrencyMetrics()
      expect(concurrencyMetrics.peakConcurrent).toBeLessThanOrEqual(3) // Should limit concurrency
      expect(concurrencyMetrics.queuedOperations).toBeGreaterThanOrEqual(2)
    })
  })

  describe('Integration Metrics', () => {
    it('should provide comprehensive dashboard metrics', () => {
      // Simulate realistic usage pattern
      for (let i = 0; i < 100; i++) {
        const hasErrors = Math.random() > 0.3
        const errorCount = hasErrors ? Math.floor(Math.random() * 5) + 1 : 0
        // Target ~12% escalation rate across ALL checks, not just error cases
        const shouldEscalate = hasErrors && Math.random() > 0.85 // ~12% of all checks will escalate

        usageMetrics.recordQualityCheck({
          timestamp: Date.now() - i * 60000, // Spread over time
          hasErrors,
          errorCount,
          escalated: shouldEscalate,
        })

        if (shouldEscalate) {
          const duration = Math.random() * 2000 + 500
          const success = Math.random() > 0.1
          performanceMonitor.recordOperation({
            name: 'subagent-analysis',
            duration,
            success,
          })
          // Also record in usage metrics for dashboard
          usageMetrics.recordPerformance({
            name: 'subagent-analysis',
            duration,
            success,
          })
          // Record cost tracker invocation for escalated cases
          const costTracker = usageMetrics.getCostTracker()
          costTracker.recordInvocation({
            promptTokens: 500,
            completionTokens: 200,
            model: 'claude-3-opus',
            success,
          })
        }
      }

      const dashboard = usageMetrics.getDashboard()

      expect(dashboard.summary.totalChecks).toBe(100)
      expect(dashboard.summary.escalationRate).toBeGreaterThanOrEqual(0.1)
      expect(dashboard.summary.escalationRate).toBeLessThan(0.15)
      expect(dashboard.performance.averageAnalysisTime).toBeGreaterThan(0)
      expect(dashboard.cost.estimatedMonthlyCost).toBeGreaterThan(0)
      expect(dashboard.recommendations).toBeDefined()
    })

    it('should export metrics in various formats', () => {
      usageMetrics.recordQualityCheck({
        timestamp: Date.now(),
        hasErrors: true,
        errorCount: 3,
        escalated: true,
      })

      const jsonExport = usageMetrics.exportMetrics('json')
      const csvExport = usageMetrics.exportMetrics('csv')
      const prometheusExport = usageMetrics.exportMetrics('prometheus')

      expect(JSON.parse(jsonExport)).toHaveProperty('totalChecks')
      expect(csvExport).toContain('timestamp,hasErrors,errorCount,escalated')
      expect(prometheusExport).toContain('quality_checks_total')
    })
  })
})

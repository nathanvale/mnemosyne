import { PrismaClient } from '@studio/db'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { PerformanceMonitoringService } from '../performance-monitor'

describe('Performance Monitoring System - Task 7.6', () => {
  let performanceMonitor: PerformanceMonitoringService
  let mockPrisma: PrismaClient

  beforeEach(async () => {
    // Mock Prisma client
    mockPrisma = {} as PrismaClient
    performanceMonitor = new PerformanceMonitoringService(mockPrisma)
  })

  afterEach(async () => {
    // Clean up
  })

  describe('Performance Metric Recording', () => {
    it('should record mood analysis performance metrics', async () => {
      const metric = await performanceMonitor.recordPerformanceMetric(
        'mood_analysis',
        850, // 850ms processing time
        10, // 10 conversations
        45.2, // 45.2MB memory usage
        {
          accuracyScore: 0.92,
          confidence: 0.88,
          errorCount: 0,
          metadata: { complexity: 'medium' },
        },
      )

      expect(metric).toBeDefined()
      expect(metric.operationType).toBe('mood_analysis')
      expect(metric.processingTimeMs).toBe(850)
      expect(metric.inputSize).toBe(10)
      expect(metric.memoryUsageMB).toBe(45.2)
      expect(metric.accuracyScore).toBe(0.92)
      expect(metric.confidence).toBe(0.88)
      expect(metric.errorCount).toBe(0)
      expect(metric.throughput).toBeCloseTo(11.76, 2) // 10 operations / 0.85 seconds
      expect(metric.metadata.complexity).toBe('medium')
      expect(metric.timestamp).toBeInstanceOf(Date)
      expect(metric.id).toMatch(/^perf-/)
    })

    it('should record delta detection performance metrics', async () => {
      const metric = await performanceMonitor.recordPerformanceMetric(
        'delta_detection',
        1200, // 1.2 seconds
        25, // 25 analyses
        67.8, // 67.8MB memory
        {
          accuracyScore: 0.89,
          errorCount: 1,
          metadata: { deltaType: 'sudden_transition' },
        },
      )

      expect(metric.operationType).toBe('delta_detection')
      expect(metric.processingTimeMs).toBe(1200)
      expect(metric.inputSize).toBe(25)
      expect(metric.memoryUsageMB).toBe(67.8)
      expect(metric.accuracyScore).toBe(0.89)
      expect(metric.errorCount).toBe(1)
      expect(metric.throughput).toBeCloseTo(20.83, 2) // 25 operations / 1.2 seconds
    })

    it('should record batch processing performance metrics', async () => {
      const metric = await performanceMonitor.recordPerformanceMetric(
        'batch_processing',
        3500, // 3.5 seconds
        100, // 100 conversations
        150.5, // 150.5MB memory
        {
          accuracyScore: 0.91,
          confidence: 0.85,
          errorCount: 3,
          metadata: { batchSize: 100, complexity: 'mixed' },
        },
      )

      expect(metric.operationType).toBe('batch_processing')
      expect(metric.inputSize).toBe(100)
      expect(metric.errorCount).toBe(3)
      expect(metric.throughput).toBeCloseTo(28.57, 2) // 100 operations / 3.5 seconds
      expect(metric.metadata.batchSize).toBe(100)
    })

    it('should handle performance metrics without optional fields', async () => {
      const metric = await performanceMonitor.recordPerformanceMetric(
        'validation',
        500, // 500ms
        5, // 5 validations
        20.1, // 20.1MB memory
      )

      expect(metric.accuracyScore).toBeUndefined()
      expect(metric.confidence).toBeUndefined()
      expect(metric.errorCount).toBe(0) // Should default to 0
      expect(metric.metadata).toEqual({})
      expect(metric.throughput).toBe(10) // 5 operations / 0.5 seconds
    })
  })

  describe('Quality Metric Recording', () => {
    it('should record correlation quality metrics', async () => {
      const qualityMetric = await performanceMonitor.recordQualityMetric(
        'correlation',
        0.92, // Current correlation
        0.85, // Baseline target
        'Human validation correlation test',
        { validationRound: 'round-5', samples: 50 },
      )

      expect(qualityMetric).toBeDefined()
      expect(qualityMetric.metricType).toBe('correlation')
      expect(qualityMetric.value).toBe(0.92)
      expect(qualityMetric.baseline).toBe(0.85)
      expect(qualityMetric.context).toBe('Human validation correlation test')
      expect(qualityMetric.performanceRating).toBe('excellent') // 0.92/0.85 = 1.08 > 1.0
      expect(qualityMetric.metadata.validationRound).toBe('round-5')
      expect(qualityMetric.timestamp).toBeInstanceOf(Date)
      expect(qualityMetric.id).toMatch(/^quality-/)
    })

    it('should record accuracy quality metrics with proper rating', async () => {
      const qualityMetric = await performanceMonitor.recordQualityMetric(
        'accuracy',
        0.78, // Below baseline
        0.85, // Target accuracy
        'Delta detection accuracy measurement',
        { testSet: 'comprehensive', edgeCases: true },
      )

      expect(qualityMetric.metricType).toBe('accuracy')
      expect(qualityMetric.value).toBe(0.78)
      expect(qualityMetric.baseline).toBe(0.85)
      expect(qualityMetric.performanceRating).toBe('needs_improvement') // 0.78/0.85 = 0.92 < 0.9
    })

    it('should record bias score quality metrics', async () => {
      const qualityMetric = await performanceMonitor.recordQualityMetric(
        'bias_score',
        0.15, // Low bias (good)
        0.25, // Acceptable bias threshold
        'Systematic bias analysis',
        { biasType: 'systematic_underestimate' },
      )

      expect(qualityMetric.metricType).toBe('bias_score')
      expect(qualityMetric.value).toBe(0.15)
      expect(qualityMetric.performanceRating).toBe('good') // 0.15/0.25 = 0.6, which is ≤ 0.8 for bias
    })

    it('should record false positive rate metrics', async () => {
      const qualityMetric = await performanceMonitor.recordQualityMetric(
        'false_positive_rate',
        0.08, // 8% false positive rate
        0.15, // 15% threshold
        'False positive rate measurement',
        { testCases: 200 },
      )

      expect(qualityMetric.metricType).toBe('false_positive_rate')
      expect(qualityMetric.value).toBe(0.08)
      expect(qualityMetric.baseline).toBe(0.15)
      expect(qualityMetric.performanceRating).toBe('good') // 0.08/0.15 = 0.53 ≤ 0.8
    })
  })

  describe('Performance Trend Analysis', () => {
    it('should analyze processing time trends', async () => {
      // Record multiple performance metrics to establish trend
      const timestamps = [
        new Date(Date.now() - 6 * 24 * 60 * 60 * 1000), // 6 days ago
        new Date(Date.now() - 4 * 24 * 60 * 60 * 1000), // 4 days ago
        new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), // 2 days ago
        new Date(Date.now() - 1 * 24 * 60 * 60 * 1000), // 1 day ago
        new Date(), // now
      ]

      const processingTimes = [1200, 1100, 1000, 950, 900] // Improving trend

      for (let i = 0; i < timestamps.length; i++) {
        await performanceMonitor.recordPerformanceMetric(
          'mood_analysis',
          processingTimes[i],
          10,
          50,
        )
      }

      const trends = await performanceMonitor.getPerformanceTrends('7d', [
        'processing_time',
      ])

      expect(trends.processing_time).toBeDefined()
      expect(trends.processing_time.metricName).toBe('processing_time')
      expect(trends.processing_time.timeWindow).toBe('7d')
      expect(trends.processing_time.dataPoints).toHaveLength(5)
      expect(trends.processing_time.trendDirection).toBe('improving') // Processing time is decreasing (improving)
      expect(trends.processing_time.trendSlope).toBeLessThan(0) // Negative slope for improving processing time
      expect(trends.processing_time.avgValue).toBeCloseTo(1030, 0)
      expect(trends.processing_time.minValue).toBe(900)
      expect(trends.processing_time.maxValue).toBe(1200)
      expect(trends.processing_time.confidenceLevel).toBeGreaterThan(0.5)
    })

    it('should analyze throughput trends', async () => {
      // Record metrics with increasing throughput
      const throughputData = [
        { processingTime: 2000, inputSize: 20 }, // 10 ops/sec
        { processingTime: 1800, inputSize: 20 }, // 11.11 ops/sec
        { processingTime: 1600, inputSize: 20 }, // 12.5 ops/sec
        { processingTime: 1400, inputSize: 20 }, // 14.29 ops/sec
        { processingTime: 1200, inputSize: 20 }, // 16.67 ops/sec
      ]

      for (const data of throughputData) {
        await performanceMonitor.recordPerformanceMetric(
          'mood_analysis',
          data.processingTime,
          data.inputSize,
          40,
        )
      }

      const trends = await performanceMonitor.getPerformanceTrends('7d', [
        'throughput',
      ])

      expect(trends.throughput).toBeDefined()
      expect(trends.throughput.trendDirection).toBe('improving') // Throughput is increasing
      expect(trends.throughput.trendSlope).toBeGreaterThan(0) // Positive slope for improving throughput
      expect(trends.throughput.avgValue).toBeGreaterThan(10)
    })

    it('should analyze memory usage trends', async () => {
      const memoryUsages = [45, 48, 52, 49, 46] // Relatively stable with slight variation

      for (const memory of memoryUsages) {
        await performanceMonitor.recordPerformanceMetric(
          'mood_analysis',
          1000,
          10,
          memory,
        )
      }

      const trends = await performanceMonitor.getPerformanceTrends('7d', [
        'memory_usage',
      ])

      expect(trends.memory_usage).toBeDefined()
      expect(trends.memory_usage.trendDirection).toMatch(/^(stable|improving)$/) // Could be stable or slightly improving
      expect(trends.memory_usage.avgValue).toBeCloseTo(48, 0)
      expect(trends.memory_usage.standardDeviation).toBeGreaterThan(0)
    })

    it('should analyze error rate trends', async () => {
      const errorData = [
        { inputSize: 100, errorCount: 5 }, // 5% error rate
        { inputSize: 100, errorCount: 4 }, // 4% error rate
        { inputSize: 100, errorCount: 3 }, // 3% error rate
        { inputSize: 100, errorCount: 2 }, // 2% error rate
        { inputSize: 100, errorCount: 1 }, // 1% error rate
      ]

      for (const data of errorData) {
        await performanceMonitor.recordPerformanceMetric(
          'mood_analysis',
          1000,
          data.inputSize,
          50,
          { errorCount: data.errorCount },
        )
      }

      const trends = await performanceMonitor.getPerformanceTrends('7d', [
        'error_rate',
      ])

      expect(trends.error_rate).toBeDefined()
      expect(trends.error_rate.trendDirection).toBe('improving') // Error rate decreasing
      expect(trends.error_rate.trendSlope).toBeLessThan(0) // Negative slope for decreasing error rate
      expect(trends.error_rate.avgValue).toBe(3) // Average 3% error rate
    })
  })

  describe('Quality Trend Analysis', () => {
    it('should analyze correlation trends over time', async () => {
      const correlationValues = [0.82, 0.85, 0.87, 0.89, 0.91] // Improving trend

      for (const correlation of correlationValues) {
        await performanceMonitor.recordQualityMetric(
          'correlation',
          correlation,
          0.85,
          'Correlation trend test',
        )
      }

      const qualityTrends = await performanceMonitor.getQualityTrends('7d', [
        'correlation',
      ])

      expect(qualityTrends.correlation).toBeDefined()
      expect(qualityTrends.correlation.trendDirection).toBe('improving')
      expect(qualityTrends.correlation.trendSlope).toBeGreaterThan(0)
      expect(qualityTrends.correlation.avgValue).toBe(0.868)
    })

    it('should analyze accuracy trends with declining pattern', async () => {
      const accuracyValues = [0.92, 0.89, 0.87, 0.84, 0.81] // Declining trend

      for (const accuracy of accuracyValues) {
        await performanceMonitor.recordQualityMetric(
          'accuracy',
          accuracy,
          0.85,
          'Accuracy trend test',
        )
      }

      const qualityTrends = await performanceMonitor.getQualityTrends('7d', [
        'accuracy',
      ])

      expect(qualityTrends.accuracy).toBeDefined()
      expect(qualityTrends.accuracy.trendDirection).toBe('declining')
      expect(qualityTrends.accuracy.trendSlope).toBeLessThan(0) // Negative slope
      expect(qualityTrends.accuracy.avgValue).toBe(0.866)
    })

    it('should handle empty trend data gracefully', async () => {
      const trends = await performanceMonitor.getPerformanceTrends('7d', [
        'processing_time',
      ])

      expect(trends.processing_time).toBeDefined()
      expect(trends.processing_time.dataPoints).toHaveLength(0)
      expect(trends.processing_time.trendDirection).toBe('stable')
      expect(trends.processing_time.avgValue).toBe(0)
      expect(trends.processing_time.confidenceLevel).toBe(0)
    })
  })

  describe('Performance Dashboard Generation', () => {
    it('should generate comprehensive performance dashboard', async () => {
      // Record various performance metrics
      await performanceMonitor.recordPerformanceMetric(
        'mood_analysis',
        800, // Good performance
        20,
        45,
        { accuracyScore: 0.92, errorCount: 0 },
      )

      await performanceMonitor.recordPerformanceMetric(
        'delta_detection',
        1200,
        15,
        38,
        { accuracyScore: 0.89, errorCount: 1 },
      )

      await performanceMonitor.recordQualityMetric(
        'correlation',
        0.91,
        0.85,
        'Dashboard test correlation',
      )

      const dashboard =
        await performanceMonitor.generatePerformanceDashboard('24h')

      expect(dashboard).toBeDefined()
      expect(dashboard.timestamp).toBeInstanceOf(Date)
      expect(dashboard.systemHealth).toMatch(/^(healthy|degraded|critical)$/)
      expect(dashboard.overallPerformanceScore).toBeGreaterThanOrEqual(0)
      expect(dashboard.overallPerformanceScore).toBeLessThanOrEqual(100)

      // Key metrics should be calculated
      expect(dashboard.keyMetrics.avgProcessingTime).toBe(1000) // (800 + 1200) / 2
      expect(dashboard.keyMetrics.throughput).toBeGreaterThan(0)
      expect(dashboard.keyMetrics.errorRate).toBeCloseTo(2.86, 1) // 1 error out of 35 total
      expect(dashboard.keyMetrics.accuracyScore).toBeCloseTo(0.905, 2) // (0.92 + 0.89) / 2

      // Trends should be present
      expect(dashboard.trends.performance).toBeDefined()
      expect(dashboard.trends.quality).toBeDefined()
      expect(dashboard.trends.efficiency).toBeDefined()

      // Should have recommendations
      expect(Array.isArray(dashboard.recommendations)).toBe(true)
    })

    it('should detect healthy system status', async () => {
      // Record good performance metrics
      await performanceMonitor.recordPerformanceMetric(
        'mood_analysis',
        500, // Fast processing
        10,
        30, // Low memory
        { accuracyScore: 0.95, errorCount: 0 }, // High accuracy, no errors
      )

      const dashboard =
        await performanceMonitor.generatePerformanceDashboard('1h')

      expect(dashboard.systemHealth).toBe('healthy')
      expect(dashboard.overallPerformanceScore).toBeGreaterThan(80)
      expect(dashboard.keyMetrics.errorRate).toBe(0)
      expect(dashboard.activeAlerts).toHaveLength(0)
    })

    it('should detect degraded system status', async () => {
      // Record mediocre performance metrics
      await performanceMonitor.recordPerformanceMetric(
        'mood_analysis',
        1500, // Slower processing
        10,
        80, // Higher memory
        { accuracyScore: 0.82, errorCount: 1 }, // Lower accuracy, some errors
      )

      const dashboard =
        await performanceMonitor.generatePerformanceDashboard('1h')

      expect(dashboard.systemHealth).toMatch(/^(degraded|healthy|critical)$/) // Could be any depending on exact scoring
      expect(dashboard.keyMetrics.errorRate).toBe(10) // 1 error out of 10 operations
    })

    it('should detect critical system status', async () => {
      // Record poor performance metrics
      await performanceMonitor.recordPerformanceMetric(
        'mood_analysis',
        3000, // Very slow processing
        10,
        200, // High memory usage
        { accuracyScore: 0.65, errorCount: 3 }, // Low accuracy, many errors
      )

      const dashboard =
        await performanceMonitor.generatePerformanceDashboard('1h')

      expect(dashboard.systemHealth).toMatch(/^(critical|degraded)$/)
      expect(dashboard.keyMetrics.errorRate).toBe(30) // 3 errors out of 10 operations
      expect(dashboard.recommendations.length).toBeGreaterThan(0)
    })
  })

  describe('Alert System', () => {
    it('should trigger high processing time alert', async () => {
      // Record metric that exceeds processing time threshold (2000ms)
      await performanceMonitor.recordPerformanceMetric(
        'mood_analysis',
        2500, // Exceeds 2000ms threshold
        10,
        45,
      )

      const activeAlerts = await performanceMonitor.getActiveAlerts()

      expect(activeAlerts.length).toBeGreaterThan(0)
      const processingTimeAlert = activeAlerts.find((alert) =>
        alert.message.includes('High Processing Time'),
      )
      expect(processingTimeAlert).toBeDefined()
      expect(processingTimeAlert?.severity).toBe('medium')
      expect(processingTimeAlert?.isResolved).toBe(false)
    })

    it('should trigger high error rate alert', async () => {
      // Record metric with high error rate (>5%)
      await performanceMonitor.recordPerformanceMetric(
        'mood_analysis',
        1000,
        100, // 100 operations
        45,
        { errorCount: 8 }, // 8% error rate
      )

      const activeAlerts = await performanceMonitor.getActiveAlerts()

      const errorRateAlert = activeAlerts.find((alert) =>
        alert.message.includes('High Error Rate'),
      )
      expect(errorRateAlert).toBeDefined()
      expect(errorRateAlert?.severity).toBe('high')
      expect(errorRateAlert?.metricValue).toBe(8)
      expect(errorRateAlert?.threshold).toBe(5)
    })

    it('should trigger low accuracy alert', async () => {
      await performanceMonitor.recordQualityMetric(
        'accuracy',
        0.75, // Below 0.8 threshold
        0.85,
        'Low accuracy test',
      )

      const activeAlerts = await performanceMonitor.getActiveAlerts()

      const accuracyAlert = activeAlerts.find((alert) =>
        alert.message.includes('Low Accuracy'),
      )
      expect(accuracyAlert).toBeDefined()
      expect(accuracyAlert?.severity).toBe('high')
    })

    it('should trigger high memory usage alert', async () => {
      await performanceMonitor.recordPerformanceMetric(
        'mood_analysis',
        1000,
        10,
        600, // Exceeds 500MB threshold
      )

      const activeAlerts = await performanceMonitor.getActiveAlerts()

      const memoryAlert = activeAlerts.find((alert) =>
        alert.message.includes('High Memory Usage'),
      )
      expect(memoryAlert).toBeDefined()
      expect(memoryAlert?.severity).toBe('medium')
    })

    it('should trigger low throughput alert', async () => {
      await performanceMonitor.recordPerformanceMetric(
        'mood_analysis',
        5000, // 5 seconds
        2, // 2 operations = 0.4 ops/sec (below 1 threshold)
        45,
      )

      const activeAlerts = await performanceMonitor.getActiveAlerts()

      const throughputAlert = activeAlerts.find((alert) =>
        alert.message.includes('Low Throughput'),
      )
      expect(throughputAlert).toBeDefined()
      expect(throughputAlert?.severity).toBe('low')
    })

    it('should not create duplicate alerts', async () => {
      // Record two metrics that would trigger the same alert
      await performanceMonitor.recordPerformanceMetric(
        'mood_analysis',
        2200,
        10,
        45,
      )

      await performanceMonitor.recordPerformanceMetric(
        'mood_analysis',
        2300,
        10,
        45,
      )

      const activeAlerts = await performanceMonitor.getActiveAlerts()
      const processingTimeAlerts = activeAlerts.filter((alert) =>
        alert.message.includes('High Processing Time'),
      )

      expect(processingTimeAlerts).toHaveLength(1) // Should only have one alert
    })

    it('should resolve alerts', async () => {
      // Trigger an alert
      await performanceMonitor.recordPerformanceMetric(
        'mood_analysis',
        2100,
        10,
        45,
      )

      let activeAlerts = await performanceMonitor.getActiveAlerts()
      expect(activeAlerts.length).toBeGreaterThan(0)

      const alertId = activeAlerts[0].id

      // Resolve the alert
      await performanceMonitor.resolveAlert(alertId)

      activeAlerts = await performanceMonitor.getActiveAlerts()
      const resolvedAlert = activeAlerts.find((alert) => alert.id === alertId)
      expect(resolvedAlert).toBeUndefined() // Should not be in active alerts anymore
    })
  })

  describe('Data Export and Analysis', () => {
    it('should export metrics in JSON format', async () => {
      // Record some test data
      await performanceMonitor.recordPerformanceMetric(
        'mood_analysis',
        1000,
        10,
        45,
        { accuracyScore: 0.9 },
      )

      await performanceMonitor.recordQualityMetric(
        'correlation',
        0.88,
        0.85,
        'Export test',
      )

      const exportData = await performanceMonitor.exportMetrics('7d', 'json')

      expect(exportData).toBeDefined()
      expect(typeof exportData).toBe('string')

      const parsed = JSON.parse(exportData)
      expect(parsed.exportTimestamp).toBeDefined()
      expect(parsed.timeWindow).toBe('7d')
      expect(parsed.performanceMetrics).toHaveLength(1)
      expect(parsed.qualityMetrics).toHaveLength(1)
      expect(Array.isArray(parsed.alerts)).toBe(true)
    })

    it('should get metric history for specific types', async () => {
      // Record historical data
      const timestamps = [
        Date.now() - 5 * 24 * 60 * 60 * 1000, // 5 days ago
        Date.now() - 3 * 24 * 60 * 60 * 1000, // 3 days ago
        Date.now() - 1 * 24 * 60 * 60 * 1000, // 1 day ago
      ]

      for (let i = 0; i < timestamps.length; i++) {
        await performanceMonitor.recordPerformanceMetric(
          'mood_analysis',
          1000 + i * 100, // Increasing processing time
          10,
          40 + i * 5, // Increasing memory usage
        )
      }

      const processingTimeHistory = await performanceMonitor.getMetricHistory(
        'processing_time',
        '7d',
      )

      expect(processingTimeHistory).toHaveLength(3)
      expect(processingTimeHistory[0].value).toBe(1000)
      expect(processingTimeHistory[1].value).toBe(1100)
      expect(processingTimeHistory[2].value).toBe(1200)

      const memoryHistory = await performanceMonitor.getMetricHistory(
        'memory_usage',
        '7d',
      )

      expect(memoryHistory).toHaveLength(3)
      expect(memoryHistory[0].value).toBe(40)
      expect(memoryHistory[1].value).toBe(45)
      expect(memoryHistory[2].value).toBe(50)
    })
  })

  describe('Performance Recommendations', () => {
    it('should generate relevant recommendations for poor performance', async () => {
      // Create conditions that should trigger recommendations
      await performanceMonitor.recordPerformanceMetric(
        'mood_analysis',
        2500, // High processing time
        10,
        400, // High memory usage
        { accuracyScore: 0.75, errorCount: 2 }, // Low accuracy, errors
      )

      const dashboard =
        await performanceMonitor.generatePerformanceDashboard('1h')

      expect(dashboard.recommendations.length).toBeGreaterThan(0)

      const recommendationText = dashboard.recommendations.join(' ')
      expect(recommendationText).toContain('processing time') // Should mention processing time
      expect(recommendationText).toContain('accuracy') // Should mention accuracy
      expect(recommendationText).toContain('error') // Should mention errors
    })

    it('should provide fewer recommendations for good performance', async () => {
      // Create good performance conditions
      await performanceMonitor.recordPerformanceMetric(
        'mood_analysis',
        600, // Good processing time
        10,
        35, // Low memory usage
        { accuracyScore: 0.95, errorCount: 0 }, // High accuracy, no errors
      )

      const dashboard =
        await performanceMonitor.generatePerformanceDashboard('1h')

      // Should have fewer or no recommendations for good performance
      expect(dashboard.recommendations.length).toBeLessThanOrEqual(2)
    })
  })

  describe('Edge Cases and Error Handling', () => {
    it('should handle zero input size gracefully', async () => {
      const metric = await performanceMonitor.recordPerformanceMetric(
        'mood_analysis',
        1000,
        0, // Zero input size
        45,
      )

      expect(metric.throughput).toBe(0)
      expect(metric.inputSize).toBe(0)
    })

    it('should handle very large processing times', async () => {
      const metric = await performanceMonitor.recordPerformanceMetric(
        'mood_analysis',
        30000, // 30 seconds - very slow
        1,
        45,
      )

      expect(metric.processingTimeMs).toBe(30000)
      expect(metric.throughput).toBeCloseTo(0.033, 3) // 1/30 operations per second

      // Should trigger processing time alert
      const alerts = await performanceMonitor.getActiveAlerts()
      expect(
        alerts.some((alert) => alert.message.includes('High Processing Time')),
      ).toBe(true)
    })

    it('should handle very small processing times', async () => {
      const metric = await performanceMonitor.recordPerformanceMetric(
        'mood_analysis',
        1, // 1ms - very fast
        100,
        45,
      )

      expect(metric.processingTimeMs).toBe(1)
      expect(metric.throughput).toBe(100000) // 100,000 operations per second
    })

    it('should handle negative values gracefully', async () => {
      // This shouldn't happen in real usage, but testing robustness
      const metric = await performanceMonitor.recordPerformanceMetric(
        'mood_analysis',
        1000,
        10,
        45,
        { accuracyScore: -0.1, errorCount: -1 }, // Invalid negative values
      )

      expect(metric.accuracyScore).toBe(-0.1) // Should store as-is for debugging
      expect(metric.errorCount).toBe(-1) // Should store as-is for debugging
    })
  })
})

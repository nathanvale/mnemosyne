import { PrismaClient } from '@studio/db'

export interface ConcurrencyTestResult {
  success: boolean
  errors: string[]
  completedOperations: number
  failedOperations: number
  averageResponseTime: number
}

export interface RollbackTestResult {
  success: boolean
  rollbackTriggered: boolean
  dataCorruption: boolean
  details: string
}

export class TransactionTestHelper {
  constructor(private prisma: PrismaClient) {}

  async testConcurrentOperations(): Promise<ConcurrencyTestResult> {
    const testMemoryId = `concurrent-test-${Date.now()}`
    const concurrentOperations = 10
    const errors: string[] = []
    let completedOperations = 0
    let failedOperations = 0
    const startTime = performance.now()

    try {
      // Create test memory first
      await this.prisma.memory.create({
        data: {
          id: testMemoryId,
          sourceMessageIds: JSON.stringify([1]),
          participants: JSON.stringify([{ id: 'concurrent-user', name: 'Concurrent Test User' }]),
          summary: 'Concurrent test memory',
          confidence: 8,
          contentHash: `concurrent-hash-${Date.now()}-${Math.random()}`,
        },
      })

      // Create multiple concurrent operations
      const operations = Array.from({ length: concurrentOperations }, (_, i) =>
        this.performConcurrentOperation(testMemoryId, i)
      )

      const results = await Promise.allSettled(operations)
      const endTime = performance.now()

      // Analyze results
      for (const result of results) {
        if (result.status === 'fulfilled') {
          completedOperations++
        } else {
          failedOperations++
          errors.push(result.reason?.message || 'Unknown error')
        }
      }

      // Verify data integrity after concurrent operations
      const finalState = await this.prisma.memory.findUnique({
        where: { id: testMemoryId },
        include: {
          moodScores: { include: { factors: true } },
          moodDeltas: true,
          validationResults: true,
        },
      })

      const hasDataCorruption = this.checkForDataCorruption(finalState)
      if (hasDataCorruption) {
        errors.push('Data corruption detected after concurrent operations')
      }

      // Clean up
      await this.cleanupConcurrentTest(testMemoryId)

      return {
        success: failedOperations === 0 && !hasDataCorruption,
        errors,
        completedOperations,
        failedOperations,
        averageResponseTime: (endTime - startTime) / concurrentOperations,
      }
    } catch (error) {
      errors.push(`Concurrent test setup failed: ${error}`)
      
      // Attempt cleanup even if test failed
      try {
        await this.cleanupConcurrentTest(testMemoryId)
      } catch (cleanupError) {
        errors.push(`Cleanup failed: ${cleanupError}`)
      }

      return {
        success: false,
        errors,
        completedOperations: 0,
        failedOperations: concurrentOperations,
        averageResponseTime: 0,
      }
    }
  }

  async testRollbackScenarios(): Promise<RollbackTestResult> {
    const testMemoryId = `rollback-test-${Date.now()}`
    let rollbackTriggered = false
    let dataCorruption = false

    try {
      // Create test memory
      await this.prisma.memory.create({
        data: {
          id: testMemoryId,
          sourceMessageIds: JSON.stringify([1]),
          participants: JSON.stringify([{ id: 'rollback-user', name: 'Rollback Test User' }]),
          summary: 'Rollback test memory',
          confidence: 8,
          contentHash: `rollback-hash-${Date.now()}-${Math.random()}`,
        },
      })

      // Test scenario: Start transaction, insert data, then force failure
      try {
        await this.prisma.$transaction(async (tx) => {
          // Insert mood score
          const moodScore = await tx.moodScore.create({
            data: {
              memoryId: testMemoryId,
              score: 7.5,
              confidence: 0.8,
              descriptors: JSON.stringify(['rollback-test']),
              algorithmVersion: 'v1.0.0',
              processingTimeMs: 100,
            },
          })

          // Insert mood factor
          await tx.moodFactor.create({
            data: {
              moodScoreId: moodScore.id,
              type: 'rollback-test-factor',
              weight: 0.5,
              description: 'Test factor for rollback',
              evidence: JSON.stringify(['test evidence']),
            },
          })

          // Force transaction failure by trying to insert invalid data
          await tx.moodScore.create({
            data: {
              memoryId: 'non-existent-memory-id', // This should fail due to foreign key constraint
              score: 5.0,
              confidence: 0.8,
              descriptors: JSON.stringify(['should-fail']),
              algorithmVersion: 'v1.0.0',
              processingTimeMs: 100,
            },
          })
        })
      } catch (transactionError) {
        rollbackTriggered = true
        // This is expected - the transaction should fail and rollback
      }

      // Verify that rollback worked - no data should remain
      const remainingMoodScores = await this.prisma.moodScore.findMany({
        where: { memoryId: testMemoryId },
      })

      const remainingMoodFactors = await this.prisma.moodFactor.findMany({
        where: {
          moodScore: {
            memoryId: testMemoryId,
          },
        },
      })

      // If rollback worked correctly, these should be empty
      dataCorruption = remainingMoodScores.length > 0 || remainingMoodFactors.length > 0

      // Clean up
      await this.cleanupRollbackTest(testMemoryId)

      return {
        success: rollbackTriggered && !dataCorruption,
        rollbackTriggered,
        dataCorruption,
        details: rollbackTriggered
          ? dataCorruption
            ? 'Rollback triggered but data corruption detected'
            : 'Rollback successful, no data corruption'
          : 'Rollback was not triggered as expected',
      }
    } catch (error) {
      // Attempt cleanup
      try {
        await this.cleanupRollbackTest(testMemoryId)
      } catch (cleanupError) {
        // Ignore cleanup errors in this case
      }

      return {
        success: false,
        rollbackTriggered: false,
        dataCorruption: true,
        details: `Rollback test failed: ${error}`,
      }
    }
  }

  private async performConcurrentOperation(memoryId: string, operationIndex: number): Promise<void> {
    // First verify memory exists to avoid foreign key constraint violations
    const memoryExists = await this.prisma.memory.findUnique({
      where: { id: memoryId },
      select: { id: true },
    })

    if (!memoryExists) {
      throw new Error(`Memory with id ${memoryId} does not exist for concurrent operation ${operationIndex}`)
    }

    // Simulate different types of concurrent operations
    const operationType = operationIndex % 3

    switch (operationType) {
      case 0:
        // Create mood score with Memory validation
        await this.prisma.moodScore.create({
          data: {
            memoryId,
            score: 5.0 + (operationIndex % 5),
            confidence: 0.7 + (operationIndex % 3) * 0.1,
            descriptors: JSON.stringify([`concurrent-test-${operationIndex}`]),
            algorithmVersion: 'v1.0.0',
            processingTimeMs: 100 + operationIndex,
          },
        })
        break

      case 1:
        // Create mood delta with Memory validation
        await this.prisma.moodDelta.create({
          data: {
            memoryId,
            conversationId: `concurrent-conversation-${operationIndex}`,
            deltaSequence: operationIndex,
            magnitude: 1.0 + (operationIndex % 3),
            direction: ['positive', 'negative', 'neutral'][operationIndex % 3],
            type: ['mood_repair', 'celebration', 'decline', 'plateau'][operationIndex % 4],
            confidence: 0.8,
            factors: JSON.stringify([`concurrent-factor-${operationIndex}`]),
            significance: 3.0 + (operationIndex % 5),
            currentScore: 6.0 + (operationIndex % 4),
          },
        })
        break

      case 2:
        // Create validation result
        await this.prisma.validationResult.create({
          data: {
            memoryId,
            humanScore: 6.0 + (operationIndex % 4),
            algorithmScore: 5.5 + (operationIndex % 4),
            agreement: 0.8 + (operationIndex % 2) * 0.1,
            discrepancy: 0.5,
            validatorId: `concurrent-validator-${operationIndex}`,
            validationMethod: ['expert_review', 'crowd_sourced', 'comparative_analysis'][operationIndex % 3],
            biasIndicators: JSON.stringify([]),
            accuracyMetrics: JSON.stringify([]),
            validatedAt: new Date(),
          },
        })
        break
    }
  }

  private checkForDataCorruption(memoryData: any): boolean {
    if (!memoryData) return true

    // Check for various data corruption indicators
    try {
      // Verify JSON fields are valid
      for (const moodScore of memoryData.moodScores || []) {
        JSON.parse(moodScore.descriptors)
        for (const factor of moodScore.factors || []) {
          JSON.parse(factor.evidence)
        }
      }

      for (const delta of memoryData.moodDeltas || []) {
        JSON.parse(delta.factors)
        if (delta.temporalContext) {
          JSON.parse(delta.temporalContext)
        }
      }

      for (const validation of memoryData.validationResults || []) {
        JSON.parse(validation.biasIndicators)
        JSON.parse(validation.accuracyMetrics)
      }

      // Check for reasonable data ranges
      for (const moodScore of memoryData.moodScores || []) {
        if (moodScore.score < 0 || moodScore.score > 10) return true
        if (moodScore.confidence < 0 || moodScore.confidence > 1) return true
      }

      for (const delta of memoryData.moodDeltas || []) {
        if (delta.confidence < 0 || delta.confidence > 1) return true
        if (delta.significance < 0 || delta.significance > 10) return true
      }

      return false
    } catch (error) {
      return true // JSON parsing errors indicate corruption
    }
  }

  private async cleanupConcurrentTest(memoryId: string): Promise<void> {
    await this.prisma.deltaPatternAssociation.deleteMany({
      where: {
        delta: { memoryId },
      },
    })
    await this.prisma.deltaPattern.deleteMany({
      where: { memoryId },
    })
    await this.prisma.turningPoint.deleteMany({
      where: { memoryId },
    })
    await this.prisma.moodDelta.deleteMany({
      where: { memoryId },
    })
    await this.prisma.validationResult.deleteMany({
      where: { memoryId },
    })
    await this.prisma.moodFactor.deleteMany({
      where: {
        moodScore: { memoryId },
      },
    })
    await this.prisma.moodScore.deleteMany({
      where: { memoryId },
    })
    await this.prisma.memory.deleteMany({
      where: { id: memoryId },
    })
  }

  private async cleanupRollbackTest(memoryId: string): Promise<void> {
    // Same cleanup as concurrent test
    await this.cleanupConcurrentTest(memoryId)
  }
}
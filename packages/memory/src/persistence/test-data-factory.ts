import type { PrismaClient } from '@studio/db'

import type { MoodAnalysisResult, MoodFactor } from '../types'

import { MoodScoreStorageService } from './mood-score-storage'

type PrismaTransaction = Omit<
  PrismaClient,
  '$connect' | '$disconnect' | '$on' | '$transaction' | '$use' | '$extends'
>

export interface TestMemoryData {
  id: string
  sourceMessageIds: string[]
  participants: Array<{ id: string; name: string }>
  summary: string
  confidence: number
  contentHash: string
}

export interface TestMoodAnalysisData {
  score: number
  confidence: number
  descriptors: string[]
  factors: MoodFactor[]
}

export class TestDataFactory {
  private moodScoreStorage: MoodScoreStorageService

  constructor(private prisma: PrismaClient) {
    this.moodScoreStorage = new MoodScoreStorageService(prisma)
  }

  /**
   * Create a Memory record that respects foreign key constraints
   */
  async createMemory(
    options: {
      id?: string
      sourceMessageIds?: Array<number | string>
      participants?: Array<{ id: string; name: string }>
      summary?: string
      confidence?: number
      contentHash?: string
    } = {},
  ): Promise<string> {
    // Use high-precision timestamp and worker ID for uniqueness
    const timestamp = Date.now()
    const microtime = performance.now()
    const workerId =
      process.env.WALLABY_WORKER_ID || process.env.VITEST_WORKER_ID || '0'
    const randomSuffix = Math.random().toString(36).substring(2) // Fallback for uniqueness

    const memoryData: TestMemoryData = {
      id:
        options.id ||
        `test-memory-${timestamp}-${Math.floor(microtime)}-w${workerId}-${randomSuffix}`,
      sourceMessageIds: (options.sourceMessageIds || ['msg1', 'msg2']).map(
        String,
      ),
      participants: options.participants || [
        { id: 'user1', name: 'Test User 1' },
      ],
      summary: options.summary || 'Test memory summary',
      confidence: options.confidence || 8,
      contentHash:
        options.contentHash ||
        `hash-${timestamp}-${Math.floor(microtime)}-w${workerId}-${randomSuffix}`,
    }

    const memory = await this.prisma.memory.create({
      data: {
        id: memoryData.id,
        sourceMessageIds: JSON.stringify(memoryData.sourceMessageIds),
        participants: JSON.stringify(memoryData.participants),
        summary: memoryData.summary,
        confidence: memoryData.confidence,
        contentHash: memoryData.contentHash,
      },
    })

    return memory.id
  }

  /**
   * Create a Memory record that respects foreign key constraints
   * @deprecated Use createMemory instead
   */
  async createTestMemory(
    overrides: Partial<TestMemoryData> = {},
  ): Promise<string> {
    // Delegate to the new createMemory method with proper uniqueness
    return this.createMemory({
      id: overrides.id,
      sourceMessageIds: overrides.sourceMessageIds,
      participants: overrides.participants,
      summary: overrides.summary,
      confidence: overrides.confidence,
      contentHash: overrides.contentHash,
    })
  }

  /**
   * Create a MoodScore record with proper Memory foreign key
   */
  async createMoodScore(
    options: {
      memoryId?: string
      score?: number
      confidence?: number
      descriptors?: Array<string>
      algorithmVersion?: string
      processingTimeMs?: number
      factors?: MoodFactor[]
    } = {},
    transaction?: PrismaTransaction,
  ): Promise<{ memoryId: string; moodScoreId: string }> {
    // Use transaction to ensure Memory exists before creating MoodScore
    const execute = async (tx: PrismaTransaction) => {
      try {
        // Ensure Memory exists first - create if not provided
        let memoryId = options.memoryId
        if (!memoryId) {
          // Create memory within the transaction
          const timestamp = Date.now()
          const microtime = performance.now()
          const randomSuffix = Math.random().toString(36).substring(2)
          const memoryData = {
            id: `test-memory-${timestamp}-${Math.floor(microtime)}-${randomSuffix}`,
            sourceMessageIds: JSON.stringify(['msg1', 'msg2']),
            participants: JSON.stringify([
              { id: 'user1', name: 'Test User 1' },
            ]),
            summary: 'Test memory summary',
            confidence: 8,
            contentHash: `hash-${timestamp}-${Math.floor(microtime)}-${randomSuffix}`,
          }

          const memory = await tx.memory.create({
            data: memoryData,
          })
          memoryId = memory.id
        } else {
          // Check if Memory exists, create it if it doesn't
          const existingMemory = await tx.memory.findUnique({
            where: { id: memoryId },
          })
          if (!existingMemory) {
            // Create Memory with the specified ID
            try {
              await tx.memory.create({
                data: {
                  id: memoryId,
                  contentHash: `hash-${memoryId}-${performance.now()}`,
                  summary: `Test memory ${memoryId}`,
                  confidence: 8,
                  sourceMessageIds: JSON.stringify(['test-msg']),
                  participants: JSON.stringify([
                    { id: 'test-user', name: 'Test User' },
                  ]),
                  extractedAt: new Date(),
                },
              })
            } catch (error) {
              throw new Error(
                `Failed to create Memory with id ${memoryId}: ${error instanceof Error ? error.message : String(error)}`,
              )
            }
          }
        }

        // Create the MoodScore with proper MoodAnalysisResult using storage service
        const moodAnalysis: MoodAnalysisResult = {
          score: options.score || 7.5,
          confidence: options.confidence || 0.85,
          descriptors: options.descriptors || ['positive', 'stable'],
          factors: options.factors || [
            {
              type: 'sentiment_analysis' as const,
              weight: 0.4,
              description: 'Positive sentiment detected',
              evidence: ['positive language', 'supportive tone'],
              _score: 8.0,
            },
            {
              type: 'psychological_indicators' as const,
              weight: 0.3,
              description: 'Healthy coping patterns',
              evidence: ['problem-solving', 'seeking support'],
              _score: 7.0,
            },
          ],
        }

        // Use the storage service with transaction context
        const storedMoodScore = await this.moodScoreStorage.storeMoodScore(
          memoryId,
          moodAnalysis,
          {
            duration: options.processingTimeMs || 150,
            algorithmVersion: options.algorithmVersion || 'v1.0.0-test',
          },
          tx,
        )

        return { memoryId, moodScoreId: storedMoodScore.id }
      } catch (error) {
        // Re-throw with more context
        if (error instanceof Error) {
          throw new Error(
            `TestDataFactory.createMoodScore failed: ${error.message}`,
          )
        }
        throw error
      }
    }

    // Use provided transaction or create a new one
    if (transaction) {
      return await execute(transaction)
    } else {
      return await this.prisma.$transaction(execute, {
        maxWait: 5000, // 5 second max wait time
        timeout: 10000, // 10 second timeout
      })
    }
  }

  /**
   * Create a Memory record with associated MoodScore
   * @deprecated Use createMoodScore instead
   */
  async createTestMemoryWithMoodScore(
    moodOverrides: Partial<TestMoodAnalysisData> = {},
  ): Promise<{ memoryId: string; moodScoreId: string }> {
    // Delegate to the new createMoodScore method with proper transaction handling
    return this.createMoodScore({
      score: moodOverrides.score || 7.5,
      confidence: moodOverrides.confidence || 0.85,
      descriptors: moodOverrides.descriptors || ['positive', 'stable'],
      factors: moodOverrides.factors || [
        {
          type: 'sentiment_analysis' as const,
          weight: 0.4,
          description: 'Positive sentiment detected',
          evidence: ['positive language', 'supportive tone'],
          _score: 8.0,
        },
        {
          type: 'psychological_indicators' as const,
          weight: 0.3,
          description: 'Healthy coping patterns',
          evidence: ['problem-solving', 'seeking support'],
          _score: 7.0,
        },
      ],
    })
  }

  /**
   * Create a MoodDelta record with proper Memory foreign key
   */
  async createMoodDelta(
    options: {
      memoryId?: string
      magnitude?: number
      direction?: 'positive' | 'negative' | 'neutral'
      type?: 'mood_repair' | 'celebration' | 'decline' | 'plateau'
      confidence?: number
      factors?: Array<string>
      significance?: number
      currentScore?: number
    } = {},
  ): Promise<{ memoryId: string; deltaId: string }> {
    // Use transaction to ensure Memory exists before creating MoodDelta
    const result = await this.prisma.$transaction(async (tx) => {
      // Ensure Memory exists first - create if not provided
      let memoryId = options.memoryId
      if (!memoryId) {
        // Create memory within the transaction
        const timestamp = Date.now()
        const microtime = performance.now()
        const randomSuffix = Math.random().toString(36).substring(2)
        const memoryData = {
          id: `test-memory-${timestamp}-${Math.floor(microtime)}-${randomSuffix}`,
          sourceMessageIds: JSON.stringify(['msg1', 'msg2']),
          participants: JSON.stringify([{ id: 'user1', name: 'Test User 1' }]),
          summary: 'Test memory summary',
          confidence: 8,
          contentHash: `hash-${timestamp}-${Math.floor(microtime)}-${randomSuffix}`,
        }

        const memory = await tx.memory.create({
          data: memoryData,
        })
        memoryId = memory.id
      } else {
        // Verify Memory exists
        const existingMemory = await tx.memory.findUnique({
          where: { id: memoryId },
        })
        if (!existingMemory) {
          throw new Error(`Memory with ID ${memoryId} does not exist`)
        }
      }

      const delta = await tx.moodDelta.create({
        data: {
          memoryId,
          magnitude: options.magnitude || 2.5,
          direction: options.direction || 'positive',
          type: options.type || 'mood_repair',
          confidence: options.confidence || 0.85,
          factors: JSON.stringify(
            options.factors || ['support', 'breakthrough'],
          ),
          significance: options.significance || 0.8,
          currentScore: options.currentScore || 7.5,
        },
      })

      return { memoryId, delta }
    })

    return { memoryId: result.memoryId, deltaId: result.delta.id }
  }

  /**
   * Create multiple MoodDelta records
   */
  async createMoodDeltas(
    options: {
      memoryId?: string
      deltas?: Array<{
        magnitude: number
        direction: 'positive' | 'negative' | 'neutral'
        type: 'mood_repair' | 'celebration' | 'decline' | 'plateau'
        confidence: number
        factors: Array<string>
        significance?: number
        currentScore?: number
      }>
    } = {},
  ): Promise<{ memoryId: string; deltaIds: Array<string> }> {
    // Use transaction to ensure Memory exists before creating MoodDeltas
    const result = await this.prisma.$transaction(async (tx) => {
      // Ensure Memory exists first - create if not provided
      let memoryId = options.memoryId
      if (!memoryId) {
        // Create memory within the transaction
        const timestamp = Date.now()
        const microtime = performance.now()
        const randomSuffix = Math.random().toString(36).substring(2)
        const memoryData = {
          id: `test-memory-${timestamp}-${Math.floor(microtime)}-${randomSuffix}`,
          sourceMessageIds: JSON.stringify(['msg1', 'msg2']),
          participants: JSON.stringify([{ id: 'user1', name: 'Test User 1' }]),
          summary: 'Test memory summary',
          confidence: 8,
          contentHash: `hash-${timestamp}-${Math.floor(microtime)}-${randomSuffix}`,
        }

        const memory = await tx.memory.create({
          data: memoryData,
        })
        memoryId = memory.id
      } else {
        // Verify Memory exists
        const existingMemory = await tx.memory.findUnique({
          where: { id: memoryId },
        })
        if (!existingMemory) {
          throw new Error(`Memory with ID ${memoryId} does not exist`)
        }
      }

      const deltas = options.deltas || [
        {
          magnitude: 2.5,
          direction: 'positive' as const,
          type: 'mood_repair' as const,
          confidence: 0.85,
          factors: ['support', 'breakthrough'],
          significance: 0.8,
          currentScore: 7.5,
        },
      ]

      const deltaIds: Array<string> = []

      for (const delta of deltas) {
        const deltaResult = await tx.moodDelta.create({
          data: {
            memoryId,
            magnitude: delta.magnitude,
            direction: delta.direction,
            type: delta.type,
            confidence: delta.confidence,
            factors: JSON.stringify(delta.factors),
            significance: delta.significance || 0.7,
            currentScore: delta.currentScore || 6.0,
          },
        })
        deltaIds.push(deltaResult.id)
      }

      return { memoryId, deltaIds }
    })

    return result
  }

  /**
   * Create a complete test setup with Memory, MoodScore, and MoodDeltas
   */
  async createCompleteTestData(
    options: {
      memoryOptions?: Parameters<TestDataFactory['createMemory']>[0]
      moodScoreOptions?: Parameters<TestDataFactory['createMoodScore']>[0]
      deltasOptions?: Parameters<TestDataFactory['createMoodDeltas']>[0]
    } = {},
  ): Promise<{
    memoryId: string
    moodScoreId: string
    deltaIds: Array<string>
  }> {
    // Use a single transaction for all operations to avoid isolation issues
    return await this.prisma.$transaction(
      async (tx) => {
        // Create memory first
        const timestamp = Date.now()
        const microtime = performance.now()
        const randomSuffix = Math.random().toString(36).substring(2)

        const memoryData = {
          id:
            options.memoryOptions?.id ||
            `test-memory-${timestamp}-${Math.floor(microtime)}-${randomSuffix}`,
          sourceMessageIds: JSON.stringify(
            options.memoryOptions?.sourceMessageIds || ['msg1', 'msg2'],
          ),
          participants: JSON.stringify(
            options.memoryOptions?.participants || [
              { id: 'user1', name: 'Test User 1' },
            ],
          ),
          summary: options.memoryOptions?.summary || 'Test memory summary',
          confidence: options.memoryOptions?.confidence || 8,
          contentHash:
            options.memoryOptions?.contentHash ||
            `hash-${timestamp}-${Math.floor(microtime)}-${randomSuffix}`,
          extractedAt: new Date(),
        }

        const memory = await tx.memory.create({
          data: memoryData,
        })

        // Create mood score
        const moodAnalysis = {
          score: options.moodScoreOptions?.score || 7.5,
          confidence: options.moodScoreOptions?.confidence || 0.85,
          descriptors: options.moodScoreOptions?.descriptors || [
            'positive',
            'stable',
          ],
          factors: options.moodScoreOptions?.factors || [
            {
              type: 'sentiment_analysis' as const,
              weight: 0.4,
              description: 'Positive sentiment detected',
              evidence: ['positive language', 'supportive tone'],
              _score: 8.0,
            },
            {
              type: 'psychological_indicators' as const,
              weight: 0.3,
              description: 'Healthy coping patterns',
              evidence: ['problem-solving', 'seeking support'],
              _score: 7.0,
            },
          ],
        }

        const moodScore = await tx.moodScore.create({
          data: {
            memoryId: memory.id,
            score: moodAnalysis.score,
            confidence: moodAnalysis.confidence,
            descriptors: JSON.stringify(moodAnalysis.descriptors),
            algorithmVersion:
              options.moodScoreOptions?.algorithmVersion || 'v1.0.0-test',
            processingTimeMs: options.moodScoreOptions?.processingTimeMs || 150,
          },
        })

        // Create factors
        await Promise.all(
          moodAnalysis.factors.map((factor) =>
            tx.moodFactor.create({
              data: {
                moodScoreId: moodScore.id,
                type: factor.type,
                weight: factor.weight,
                description: factor.description,
                evidence: JSON.stringify(factor.evidence),
                internalScore: factor._score,
              },
            }),
          ),
        )

        // Create deltas
        const deltas = options.deltasOptions?.deltas || [
          {
            magnitude: 2.5,
            direction: 'positive' as const,
            type: 'mood_repair' as const,
            confidence: 0.85,
            factors: ['support', 'breakthrough'],
          },
        ]

        const deltaIds: Array<string> = []
        for (let i = 0; i < deltas.length; i++) {
          const delta = deltas[i]

          // Calculate position-based significance like DeltaHistoryStorageService
          const position = this.calculateTemporalPosition(i, deltas.length)
          const baseSignificance = delta.magnitude * delta.confidence
          const positionMultiplier = this.getPositionMultiplier(position)
          const significance =
            delta.significance || baseSignificance * positionMultiplier

          console.log(
            `Delta ${i}: position=${position}, base=${baseSignificance}, multiplier=${positionMultiplier}, final=${significance}`,
          )

          const result = await tx.moodDelta.create({
            data: {
              memoryId: memory.id,
              conversationId: `test-conversation-${memory.id}`,
              deltaSequence: i,
              magnitude: delta.magnitude,
              direction: delta.direction,
              type: delta.type,
              confidence: delta.confidence,
              factors: JSON.stringify(delta.factors),
              significance,
              currentScore: delta.currentScore || moodAnalysis.score,
            },
          })
          deltaIds.push(result.id)
        }

        return { memoryId: memory.id, moodScoreId: moodScore.id, deltaIds }
      },
      {
        maxWait: 10000, // 10 second max wait time
        timeout: 30000, // 30 second timeout for complex operations
      },
    )
  }

  /**
   * Create multiple test memories with mood scores for performance testing
   */
  async createTestDataset(count: number): Promise<string[]> {
    const memoryIds: string[] = []

    for (let i = 0; i < count; i++) {
      const timestamp = Date.now() + i // Ensure uniqueness

      const { memoryId } = await this.createMoodScore({
        memoryId: `perf-memory-${i}-${timestamp}`,
        score: 5.0 + (i % 5), // Vary scores 5.0-9.0
        confidence: 0.8 + (i % 2) * 0.1, // Vary confidence 0.8-0.9
      })

      memoryIds.push(memoryId)

      // Add small delay to ensure timestamp uniqueness
      if (i % 10 === 0) {
        await new Promise((resolve) => setTimeout(resolve, 1))
      }
    }

    return memoryIds
  }

  /**
   * Clean up all test data
   */
  async cleanupTestData(memoryIds?: Array<string>): Promise<void> {
    if (memoryIds && memoryIds.length > 0) {
      // Delete specific memories (cascades will handle dependent records)
      await this.prisma.memory.deleteMany({
        where: {
          id: {
            in: memoryIds,
          },
        },
      })
    } else {
      // Delete all test data (cascades will handle dependent records)
      await this.prisma.memory.deleteMany({
        where: {
          OR: [
            { id: { startsWith: 'test-memory-' } },
            { id: { startsWith: 'custom-memory-' } },
            { id: { startsWith: 'cleanup-test-' } },
            { id: { startsWith: 'perf-memory-' } },
          ],
        },
      })
    }
  }

  /**
   * Verify Memory record exists before creating dependent records
   */
  async verifyMemoryExists(memoryId: string): Promise<boolean> {
    const memory = await this.prisma.memory.findUnique({
      where: { id: memoryId },
    })
    return memory !== null
  }

  /**
   * Calculate temporal position for significance weighting
   */
  private calculateTemporalPosition(
    index: number,
    totalCount: number,
  ): 'early' | 'middle' | 'conclusion' {
    if (totalCount === 1) return 'early'
    if (totalCount === 2) return index === 0 ? 'early' : 'conclusion'

    const ratio = index / (totalCount - 1)
    if (ratio <= 0.3) return 'early'
    if (ratio >= 0.7) return 'conclusion'
    return 'middle'
  }

  /**
   * Get position multiplier for significance calculation
   */
  private getPositionMultiplier(
    position: 'early' | 'middle' | 'conclusion',
  ): number {
    const multipliers = {
      conclusion: 1.5, // Highest significance
      early: 1.2, // Medium significance
      middle: 1.0, // Base significance
    }
    return multipliers[position]
  }
}

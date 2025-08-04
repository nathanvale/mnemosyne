import type { PrismaClient } from '@studio/db'

import type { MoodAnalysisResult } from '../../types'

/**
 * Test Data Factory - Creates test data with proper foreign key dependencies
 * Addresses Task 4.2: Create centralized factory functions that respect foreign key dependencies
 */
export class TestDataFactory {
  constructor(private prisma: PrismaClient) {}

  /**
   * Creates a Memory record with all required fields
   * This must be called before creating any dependent records (MoodScore, MoodDelta, etc.)
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
    // Generate more unique IDs for concurrent operations
    const timestamp = Date.now()
    const random = Math.random().toString(36).substr(2, 12)
    const processId = process.pid || 0
    const memoryId =
      options.id || `test-memory-${timestamp}-${processId}-${random}`

    try {
      const memory = await this.prisma.memory.create({
        data: {
          id: memoryId,
          sourceMessageIds: JSON.stringify(
            options.sourceMessageIds || [1, 2, 3],
          ),
          participants: JSON.stringify(
            options.participants || [{ id: 'user-1', name: 'Test User' }],
          ),
          summary: options.summary || 'Test memory for mood scoring tests',
          confidence: options.confidence || 8,
          contentHash:
            options.contentHash ||
            `test-hash-${timestamp}-${processId}-${random}`,
        },
      })

      if (!memory || !memory.id) {
        throw new Error(
          `Failed to create Memory: memory creation returned null or invalid result`,
        )
      }

      return memory.id
    } catch (error) {
      throw new Error(
        `Failed to create Memory with id ${memoryId}: ${error instanceof Error ? error.message : String(error)}`,
      )
    }
  }

  /**
   * Creates a MoodScore record with proper Memory foreign key
   */
  async createMoodScore(options: {
    memoryId: string
    score?: number
    confidence?: number
    descriptors?: Array<string>
    algorithmVersion?: string
    processingTimeMs?: number
    factors?: MoodAnalysisResult['factors']
  }): Promise<{ memoryId: string; moodScoreId: string }> {
    const moodAnalysis: MoodAnalysisResult = {
      score: options.score || 7.5,
      confidence: options.confidence || 0.8,
      descriptors: options.descriptors || ['positive', 'stable'],
      factors: options.factors || [
        {
          type: 'sentiment_analysis' as const,
          weight: 0.35,
          description: 'Test sentiment analysis',
          evidence: ['positive language'],
          _score: 7.0,
        },
      ],
    }

    return await this.prisma.$transaction(async (tx) => {
      // Verify Memory exists before creating MoodScore
      const existingMemory = await tx.memory.findUnique({
        where: { id: options.memoryId },
      })
      if (!existingMemory) {
        throw new Error(`Memory with id ${options.memoryId} does not exist`)
      }

      const moodScore = await tx.moodScore.create({
        data: {
          memoryId: options.memoryId,
          score: moodAnalysis.score,
          confidence: moodAnalysis.confidence,
          descriptors: JSON.stringify(moodAnalysis.descriptors),
          algorithmVersion: options.algorithmVersion || 'v1.0.0-test',
          processingTimeMs: options.processingTimeMs || 150,
        },
      })

      // Create factors within the same transaction
      if (moodAnalysis.factors.length > 0) {
        await tx.moodFactor.createMany({
          data: moodAnalysis.factors.map((factor) => ({
            moodScoreId: moodScore.id,
            type: factor.type,
            weight: factor.weight,
            description: factor.description,
            evidence: JSON.stringify(factor.evidence),
            internalScore: factor._score,
          })),
        })
      }

      return { memoryId: options.memoryId, moodScoreId: moodScore.id }
    })
  }

  /**
   * Creates a MoodDelta record with proper Memory foreign key
   */
  async createMoodDelta(options: {
    memoryId: string
    magnitude?: number
    direction?: 'positive' | 'negative' | 'neutral'
    type?: 'mood_repair' | 'celebration' | 'decline' | 'plateau'
    confidence?: number
    factors?: Array<string>
    significance?: number
    currentScore?: number
  }): Promise<{ memoryId: string; deltaId: string }> {
    return await this.prisma.$transaction(async (tx) => {
      // Verify Memory exists before creating MoodDelta
      const existingMemory = await tx.memory.findUnique({
        where: { id: options.memoryId },
      })
      if (!existingMemory) {
        throw new Error(`Memory with ID ${options.memoryId} does not exist`)
      }

      const delta = await tx.moodDelta.create({
        data: {
          memoryId: options.memoryId,
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

      return { memoryId: options.memoryId, deltaId: delta.id }
    })
  }

  /**
   * Creates multiple MoodDelta records with proper Memory foreign key
   */
  async createMoodDeltas(options: {
    memoryId: string
    deltas?: Array<{
      magnitude: number
      direction: 'positive' | 'negative' | 'neutral'
      type: 'mood_repair' | 'celebration' | 'decline' | 'plateau'
      confidence: number
      factors: Array<string>
      significance?: number
      currentScore?: number
    }>
  }): Promise<{ memoryId: string; deltaIds: Array<string> }> {
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

    return await this.prisma.$transaction(async (tx) => {
      // Verify Memory exists before creating MoodDeltas
      const existingMemory = await tx.memory.findUnique({
        where: { id: options.memoryId },
      })
      if (!existingMemory) {
        throw new Error(`Memory with ID ${options.memoryId} does not exist`)
      }

      const deltaIds: Array<string> = []

      for (const delta of deltas) {
        const result = await tx.moodDelta.create({
          data: {
            memoryId: options.memoryId,
            magnitude: delta.magnitude,
            direction: delta.direction,
            type: delta.type,
            confidence: delta.confidence,
            factors: JSON.stringify(delta.factors),
            significance: delta.significance || 0.7,
            currentScore: delta.currentScore || 6.0,
          },
        })
        deltaIds.push(result.id)
      }

      return { memoryId: options.memoryId, deltaIds }
    })
  }

  /**
   * Creates a complete test setup with Memory, MoodScore, and MoodDeltas
   * Uses single transaction to ensure data consistency
   */
  async createCompleteTestData(
    options: {
      memoryOptions?: Parameters<TestDataFactory['createMemory']>[0]
      moodScoreOptions?: Omit<
        Parameters<TestDataFactory['createMoodScore']>[0],
        'memoryId'
      >
      deltasOptions?: Omit<
        Parameters<TestDataFactory['createMoodDeltas']>[0],
        'memoryId'
      >
    } = {},
  ): Promise<{
    memoryId: string
    moodScoreId: string
    deltaIds: Array<string>
  }> {
    return await this.prisma.$transaction(
      async (tx) => {
        // Create Memory first
        const timestamp = Date.now()
        const random = Math.random().toString(36).substr(2, 12)
        const processId = process.pid || 0
        const memoryId =
          options.memoryOptions?.id ||
          `test-memory-${timestamp}-${processId}-${random}`

        await tx.memory.create({
          data: {
            id: memoryId,
            sourceMessageIds: JSON.stringify(
              options.memoryOptions?.sourceMessageIds || [1, 2, 3],
            ),
            participants: JSON.stringify(
              options.memoryOptions?.participants || [
                { id: 'user-1', name: 'Test User' },
              ],
            ),
            summary:
              options.memoryOptions?.summary ||
              'Test memory for mood scoring tests',
            confidence: options.memoryOptions?.confidence || 8,
            contentHash:
              options.memoryOptions?.contentHash ||
              `test-hash-${timestamp}-${processId}-${random}`,
          },
        })

        // Create MoodScore within same transaction
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
              weight: 0.35,
              description: 'Test sentiment analysis',
              evidence: ['positive language'],
              _score: 7.0,
            },
          ],
        }

        const moodScore = await tx.moodScore.create({
          data: {
            memoryId,
            score: moodAnalysis.score,
            confidence: moodAnalysis.confidence,
            descriptors: JSON.stringify(moodAnalysis.descriptors),
            algorithmVersion:
              options.moodScoreOptions?.algorithmVersion || 'v1.0.0-test',
            processingTimeMs: options.moodScoreOptions?.processingTimeMs || 150,
          },
        })

        // Create factors within the same transaction
        if (moodAnalysis.factors.length > 0) {
          await tx.moodFactor.createMany({
            data: moodAnalysis.factors.map((factor) => ({
              moodScoreId: moodScore.id,
              type: factor.type,
              weight: factor.weight,
              description: factor.description,
              evidence: JSON.stringify(factor.evidence),
              internalScore: factor._score,
            })),
          })
        }

        // Create MoodDeltas within same transaction
        const deltas = options.deltasOptions?.deltas || [
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
          const result = await tx.moodDelta.create({
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
          deltaIds.push(result.id)
        }

        return { memoryId, moodScoreId: moodScore.id, deltaIds }
      },
      {
        maxWait: 5000, // 5 second max wait time
        timeout: 15000, // 15 second timeout for complex operation
      },
    )
  }

  /**
   * Cleans up all test data
   */
  async cleanupTestData(memoryIds?: Array<string>): Promise<void> {
    if (memoryIds && memoryIds.length > 0) {
      await this.prisma.memory.deleteMany({
        where: {
          id: {
            in: memoryIds,
          },
        },
      })
    } else {
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
}

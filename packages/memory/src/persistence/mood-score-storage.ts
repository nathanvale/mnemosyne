import { PrismaClient } from '@studio/db'

import type { MoodAnalysisResult, MoodDelta } from '../types'

type PrismaTransaction = Omit<
  PrismaClient,
  '$connect' | '$disconnect' | '$on' | '$transaction' | '$use' | '$extends'
>

export interface StoredMoodScore {
  id: string
  memoryId: string
  score: number
  confidence: number
  descriptors: string[]
  factors: StoredMoodFactor[]
  metadata: {
    calculatedAt: Date
    algorithmVersion: string
    processingTimeMs: number
  }
  createdAt: Date
  updatedAt: Date
}

export interface StoredMoodFactor {
  id: string
  moodScoreId: string
  type: string
  weight: number
  description: string
  evidence: string[]
  internalScore?: number
  createdAt: Date
}

export interface StoredMoodDelta {
  id: string
  memoryId: string
  magnitude: number
  direction: 'positive' | 'negative' | 'neutral'
  type: 'mood_repair' | 'celebration' | 'decline' | 'plateau'
  confidence: number
  factors: string[]
  significance: number
  previousScore?: number
  currentScore: number
  detectedAt: Date
  createdAt: Date
}

export interface StoredAnalysisMetadata {
  id: string
  memoryId: string
  processingDuration: number
  confidence: number
  qualityMetrics: {
    overall: number
    components: {
      coherence: number
      relevance: number
      completeness: number
      accuracy: number
    }
  }
  issues: Array<{
    type: string
    severity: string
    description: string
    suggestions?: string[]
  }>
  createdAt: Date
}

export class MoodScoreStorageService {
  constructor(private prisma: PrismaClient) {}

  async storeMoodScore(
    memoryId: string,
    moodAnalysis: MoodAnalysisResult,
    processingMetrics: {
      duration: number
      algorithmVersion: string
    },
    transaction?: PrismaTransaction,
  ): Promise<StoredMoodScore> {
    // Use provided transaction or create a new one
    const execute = async (tx: PrismaTransaction) => {
      try {
        // Verify memory exists before creating mood score
        const memoryExists = await tx.memory.findUnique({
          where: { id: memoryId },
          select: { id: true },
        })

        if (!memoryExists) {
          throw new Error(`Memory with id ${memoryId} does not exist`)
        }

        // Store the mood score
        const storedScore = await tx.moodScore.create({
          data: {
            memoryId,
            score: moodAnalysis.score,
            confidence: moodAnalysis.confidence,
            descriptors: JSON.stringify(moodAnalysis.descriptors),
            algorithmVersion: processingMetrics.algorithmVersion,
            processingTimeMs: processingMetrics.duration,
          },
        })

        // Store the factors
        const factorData = moodAnalysis.factors.map((factor) => ({
          moodScoreId: storedScore.id,
          type: factor.type,
          weight: factor.weight,
          description: factor.description,
          evidence: JSON.stringify(factor.evidence),
          internalScore: factor._score,
        }))

        if (factorData.length > 0) {
          await tx.moodFactor.createMany({
            data: factorData,
          })
        }

        // Fetch the created factors to return complete data
        const createdFactors = await tx.moodFactor.findMany({
          where: { moodScoreId: storedScore.id },
          orderBy: { createdAt: 'asc' },
        })

        return {
          id: storedScore.id,
          memoryId: storedScore.memoryId,
          score: storedScore.score,
          confidence: storedScore.confidence,
          descriptors: JSON.parse(storedScore.descriptors),
          factors: createdFactors.map((factor) => ({
            id: factor.id,
            moodScoreId: factor.moodScoreId,
            type: factor.type,
            weight: factor.weight,
            description: factor.description,
            evidence: JSON.parse(factor.evidence),
            internalScore: factor.internalScore || undefined,
            createdAt: factor.createdAt,
          })),
          metadata: {
            calculatedAt: storedScore.calculatedAt,
            algorithmVersion: storedScore.algorithmVersion,
            processingTimeMs: storedScore.processingTimeMs,
          },
          createdAt: storedScore.createdAt,
          updatedAt: storedScore.updatedAt,
        }
      } catch (error) {
        // Re-throw with more context
        if (error instanceof Error) {
          if (error.message.includes('Transaction')) {
            throw new Error(`Transaction error in storeMoodScore: ${error.message}`)
          }
        }
        throw error
      }
    }

    // Use provided transaction or create a new one
    if (transaction) {
      return await execute(transaction)
    } else {
      // Create new transaction with timeout
      return await this.prisma.$transaction(execute, {
        maxWait: 5000, // 5 second max wait time
        timeout: 10000, // 10 second timeout
      })
    }
  }

  async storeMoodFactors(
    moodScoreId: string,
    factors: MoodAnalysisResult['factors'],
  ): Promise<StoredMoodFactor[]> {
    const factorData = factors.map((factor) => ({
      moodScoreId,
      type: factor.type,
      weight: factor.weight,
      description: factor.description,
      evidence: JSON.stringify(factor.evidence),
      internalScore: factor._score,
    }))

    await this.prisma.moodFactor.createMany({
      data: factorData,
    })

    const createdFactors = await this.prisma.moodFactor.findMany({
      where: { moodScoreId },
      orderBy: { createdAt: 'asc' },
    })

    return createdFactors.map((factor) => ({
      id: factor.id,
      moodScoreId: factor.moodScoreId,
      type: factor.type,
      weight: factor.weight,
      description: factor.description,
      evidence: JSON.parse(factor.evidence),
      internalScore: factor.internalScore || undefined,
      createdAt: factor.createdAt,
    }))
  }

  async storeMoodDeltas(
    memoryId: string,
    deltas: MoodDelta[],
    transaction?: PrismaTransaction,
  ): Promise<StoredMoodDelta[]> {
    const execute = async (tx: PrismaTransaction) => {
      // Verify memory exists before creating deltas
      const memoryExists = await tx.memory.findUnique({
        where: { id: memoryId },
        select: { id: true },
      })

      if (!memoryExists) {
        throw new Error(`Memory with id ${memoryId} does not exist`)
      }

      const deltaData = deltas.map((delta) => ({
        memoryId,
        magnitude: delta.magnitude,
        direction: delta.direction,
        type: delta.type,
        confidence: delta.confidence,
        factors: JSON.stringify(delta.factors),
        significance: 0.8, // Default significance - this should come from delta analysis
        currentScore: 6.5, // Default score - this should come from actual mood analysis
      }))

      await tx.moodDelta.createMany({
        data: deltaData,
      })

      const createdDeltas = await tx.moodDelta.findMany({
        where: { memoryId },
        orderBy: { createdAt: 'asc' },
      })

      return createdDeltas.map((delta) => ({
        id: delta.id,
        memoryId: delta.memoryId,
        magnitude: delta.magnitude,
        direction: delta.direction as 'positive' | 'negative' | 'neutral',
        type: delta.type as
          | 'mood_repair'
          | 'celebration'
          | 'decline'
          | 'plateau',
        confidence: delta.confidence,
        factors: JSON.parse(delta.factors),
        significance: delta.significance,
        previousScore: delta.previousScore || undefined,
        currentScore: delta.currentScore,
        detectedAt: delta.detectedAt,
        createdAt: delta.createdAt,
      }))
    }

    // Use provided transaction or create a new one
    if (transaction) {
      return await execute(transaction)
    } else {
      return await this.prisma.$transaction(execute)
    }
  }

  async storeAnalysisMetadata(
    memoryId: string,
    metadata: {
      processingDuration: number
      confidence: number
      qualityMetrics: Record<string, unknown>
      issues: Array<Record<string, unknown>>
    },
  ): Promise<StoredAnalysisMetadata> {
    const stored = await this.prisma.analysisMetadata.create({
      data: {
        memoryId,
        processingDuration: metadata.processingDuration,
        confidence: metadata.confidence,
        qualityMetrics: JSON.stringify(metadata.qualityMetrics),
        issues: JSON.stringify(metadata.issues),
      },
    })

    return {
      id: stored.id,
      memoryId: stored.memoryId,
      processingDuration: stored.processingDuration,
      confidence: stored.confidence,
      qualityMetrics: JSON.parse(stored.qualityMetrics),
      issues: JSON.parse(stored.issues),
      createdAt: stored.createdAt,
    }
  }

  async getMoodScoreByMemoryId(
    memoryId: string,
  ): Promise<StoredMoodScore | null> {
    const result = await this.prisma.moodScore.findFirst({
      where: { memoryId },
      include: {
        factors: {
          orderBy: { createdAt: 'asc' },
        },
      },
      orderBy: { createdAt: 'desc' }, // Get the most recent score
    })

    if (!result) {
      return null
    }

    return {
      id: result.id,
      memoryId: result.memoryId,
      score: result.score,
      confidence: result.confidence,
      descriptors: JSON.parse(result.descriptors),
      factors: result.factors.map((factor) => ({
        id: factor.id,
        moodScoreId: factor.moodScoreId,
        type: factor.type,
        weight: factor.weight,
        description: factor.description,
        evidence: JSON.parse(factor.evidence),
        internalScore: factor.internalScore || undefined,
        createdAt: factor.createdAt,
      })),
      metadata: {
        calculatedAt: result.calculatedAt,
        algorithmVersion: result.algorithmVersion,
        processingTimeMs: result.processingTimeMs,
      },
      createdAt: result.createdAt,
      updatedAt: result.updatedAt,
    }
  }

  async getMoodFactorsByScoreId(
    moodScoreId: string,
  ): Promise<StoredMoodFactor[]> {
    const factors = await this.prisma.moodFactor.findMany({
      where: { moodScoreId },
      orderBy: { createdAt: 'asc' },
    })

    return factors.map((factor) => ({
      id: factor.id,
      moodScoreId: factor.moodScoreId,
      type: factor.type,
      weight: factor.weight,
      description: factor.description,
      evidence: JSON.parse(factor.evidence),
      internalScore: factor.internalScore || undefined,
      createdAt: factor.createdAt,
    }))
  }

  async getMoodDeltasByMemoryId(memoryId: string): Promise<StoredMoodDelta[]> {
    const deltas = await this.prisma.moodDelta.findMany({
      where: { memoryId },
      orderBy: { detectedAt: 'asc' },
    })

    return deltas.map((delta) => ({
      id: delta.id,
      memoryId: delta.memoryId,
      magnitude: delta.magnitude,
      direction: delta.direction as 'positive' | 'negative' | 'neutral',
      type: delta.type as 'mood_repair' | 'celebration' | 'decline' | 'plateau',
      confidence: delta.confidence,
      factors: JSON.parse(delta.factors),
      significance: delta.significance,
      previousScore: delta.previousScore || undefined,
      currentScore: delta.currentScore,
      detectedAt: delta.detectedAt,
      createdAt: delta.createdAt,
    }))
  }

  async getAnalysisMetadataByMemoryId(
    memoryId: string,
  ): Promise<StoredAnalysisMetadata | null> {
    const result = await this.prisma.analysisMetadata.findUnique({
      where: { memoryId },
    })

    if (!result) {
      return null
    }

    return {
      id: result.id,
      memoryId: result.memoryId,
      processingDuration: result.processingDuration,
      confidence: result.confidence,
      qualityMetrics: JSON.parse(result.qualityMetrics),
      issues: JSON.parse(result.issues),
      createdAt: result.createdAt,
    }
  }

  // Query optimization methods for performance requirements (<2 second requirement)

  async getMoodScoresByMemoryIds(
    memoryIds: string[],
  ): Promise<StoredMoodScore[]> {
    const results = await this.prisma.moodScore.findMany({
      where: {
        memoryId: { in: memoryIds },
      },
      include: {
        factors: {
          orderBy: { createdAt: 'asc' },
        },
      },
      orderBy: { createdAt: 'desc' },
    })

    return results.map((result) => ({
      id: result.id,
      memoryId: result.memoryId,
      score: result.score,
      confidence: result.confidence,
      descriptors: JSON.parse(result.descriptors),
      factors: result.factors.map((factor) => ({
        id: factor.id,
        moodScoreId: factor.moodScoreId,
        type: factor.type,
        weight: factor.weight,
        description: factor.description,
        evidence: JSON.parse(factor.evidence),
        internalScore: factor.internalScore || undefined,
        createdAt: factor.createdAt,
      })),
      metadata: {
        calculatedAt: result.calculatedAt,
        algorithmVersion: result.algorithmVersion,
        processingTimeMs: result.processingTimeMs,
      },
      createdAt: result.createdAt,
      updatedAt: result.updatedAt,
    }))
  }

  async getMoodScoresByDateRange(
    startDate: Date,
    endDate: Date,
    limit?: number,
  ): Promise<StoredMoodScore[]> {
    const results = await this.prisma.moodScore.findMany({
      where: {
        calculatedAt: {
          gte: startDate,
          lte: endDate,
        },
      },
      include: {
        factors: {
          orderBy: { createdAt: 'asc' },
        },
      },
      orderBy: { calculatedAt: 'desc' },
      take: limit,
    })

    return results.map((result) => ({
      id: result.id,
      memoryId: result.memoryId,
      score: result.score,
      confidence: result.confidence,
      descriptors: JSON.parse(result.descriptors),
      factors: result.factors.map((factor) => ({
        id: factor.id,
        moodScoreId: factor.moodScoreId,
        type: factor.type,
        weight: factor.weight,
        description: factor.description,
        evidence: JSON.parse(factor.evidence),
        internalScore: factor.internalScore || undefined,
        createdAt: factor.createdAt,
      })),
      metadata: {
        calculatedAt: result.calculatedAt,
        algorithmVersion: result.algorithmVersion,
        processingTimeMs: result.processingTimeMs,
      },
      createdAt: result.createdAt,
      updatedAt: result.updatedAt,
    }))
  }

  async getMoodDeltasBySignificance(
    minSignificance: number,
    limit?: number,
  ): Promise<StoredMoodDelta[]> {
    const deltas = await this.prisma.moodDelta.findMany({
      where: {
        significance: {
          gte: minSignificance,
        },
      },
      orderBy: { significance: 'desc' },
      take: limit,
    })

    return deltas.map((delta) => ({
      id: delta.id,
      memoryId: delta.memoryId,
      magnitude: delta.magnitude,
      direction: delta.direction as 'positive' | 'negative' | 'neutral',
      type: delta.type as 'mood_repair' | 'celebration' | 'decline' | 'plateau',
      confidence: delta.confidence,
      factors: JSON.parse(delta.factors),
      significance: delta.significance,
      previousScore: delta.previousScore || undefined,
      currentScore: delta.currentScore,
      detectedAt: delta.detectedAt,
      createdAt: delta.createdAt,
    }))
  }

  // Additional query methods for performance testing

  async getMoodScoresByMemoryId(memoryId: string): Promise<StoredMoodScore[]> {
    const results = await this.prisma.moodScore.findMany({
      where: { memoryId },
      include: {
        factors: {
          orderBy: { createdAt: 'asc' },
        },
      },
      orderBy: { createdAt: 'desc' },
    })

    return results.map((result) => ({
      id: result.id,
      memoryId: result.memoryId,
      score: result.score,
      confidence: result.confidence,
      descriptors: JSON.parse(result.descriptors),
      factors: result.factors.map((factor) => ({
        id: factor.id,
        moodScoreId: factor.moodScoreId,
        type: factor.type,
        weight: factor.weight,
        description: factor.description,
        evidence: JSON.parse(factor.evidence),
        internalScore: factor.internalScore || undefined,
        createdAt: factor.createdAt,
      })),
      metadata: {
        calculatedAt: result.calculatedAt,
        algorithmVersion: result.algorithmVersion,
        processingTimeMs: result.processingTimeMs,
      },
      createdAt: result.createdAt,
      updatedAt: result.updatedAt,
    }))
  }

  async getMoodScoresByConfidenceRange(
    minConfidence: number,
    maxConfidence: number,
    limit?: number,
  ): Promise<StoredMoodScore[]> {
    const results = await this.prisma.moodScore.findMany({
      where: {
        confidence: {
          gte: minConfidence,
          lte: maxConfidence,
        },
      },
      include: {
        factors: {
          orderBy: { createdAt: 'asc' },
        },
      },
      orderBy: { confidence: 'desc' },
      take: limit,
    })

    return results.map((result) => ({
      id: result.id,
      memoryId: result.memoryId,
      score: result.score,
      confidence: result.confidence,
      descriptors: JSON.parse(result.descriptors),
      factors: result.factors.map((factor) => ({
        id: factor.id,
        moodScoreId: factor.moodScoreId,
        type: factor.type,
        weight: factor.weight,
        description: factor.description,
        evidence: JSON.parse(factor.evidence),
        internalScore: factor.internalScore || undefined,
        createdAt: factor.createdAt,
      })),
      metadata: {
        calculatedAt: result.calculatedAt,
        algorithmVersion: result.algorithmVersion,
        processingTimeMs: result.processingTimeMs,
      },
      createdAt: result.createdAt,
      updatedAt: result.updatedAt,
    }))
  }

  async getMoodScoresByScoreRange(
    minScore: number,
    maxScore: number,
    limit?: number,
  ): Promise<StoredMoodScore[]> {
    const results = await this.prisma.moodScore.findMany({
      where: {
        score: {
          gte: minScore,
          lte: maxScore,
        },
      },
      include: {
        factors: {
          orderBy: { createdAt: 'asc' },
        },
      },
      orderBy: { score: 'desc' },
      take: limit,
    })

    return results.map((result) => ({
      id: result.id,
      memoryId: result.memoryId,
      score: result.score,
      confidence: result.confidence,
      descriptors: JSON.parse(result.descriptors),
      factors: result.factors.map((factor) => ({
        id: factor.id,
        moodScoreId: factor.moodScoreId,
        type: factor.type,
        weight: factor.weight,
        description: factor.description,
        evidence: JSON.parse(factor.evidence),
        internalScore: factor.internalScore || undefined,
        createdAt: factor.createdAt,
      })),
      metadata: {
        calculatedAt: result.calculatedAt,
        algorithmVersion: result.algorithmVersion,
        processingTimeMs: result.processingTimeMs,
      },
      createdAt: result.createdAt,
      updatedAt: result.updatedAt,
    }))
  }

  async getRecentMoodScores(
    since: Date,
    limit?: number,
  ): Promise<StoredMoodScore[]> {
    const results = await this.prisma.moodScore.findMany({
      where: {
        calculatedAt: {
          gte: since,
        },
      },
      include: {
        factors: {
          orderBy: { createdAt: 'asc' },
        },
      },
      orderBy: { calculatedAt: 'desc' },
      take: limit,
    })

    return results.map((result) => ({
      id: result.id,
      memoryId: result.memoryId,
      score: result.score,
      confidence: result.confidence,
      descriptors: JSON.parse(result.descriptors),
      factors: result.factors.map((factor) => ({
        id: factor.id,
        moodScoreId: factor.moodScoreId,
        type: factor.type,
        weight: factor.weight,
        description: factor.description,
        evidence: JSON.parse(factor.evidence),
        internalScore: factor.internalScore || undefined,
        createdAt: factor.createdAt,
      })),
      metadata: {
        calculatedAt: result.calculatedAt,
        algorithmVersion: result.algorithmVersion,
        processingTimeMs: result.processingTimeMs,
      },
      createdAt: result.createdAt,
      updatedAt: result.updatedAt,
    }))
  }
}

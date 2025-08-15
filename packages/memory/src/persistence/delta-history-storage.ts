import { PrismaClient } from '@studio/db'

// Define Prisma result types
interface PrismaMoodDelta {
  id: string
  memoryId: string
  conversationId: string | null
  deltaSequence: number | null
  magnitude: number
  direction: string
  type: string
  confidence: number
  factors: string
  significance: number
  previousScore: number | null
  currentScore: number
  temporalContext: string | null
  detectedAt: Date
  createdAt: Date
}

interface PrismaDeltaPattern {
  id: string
  memoryId: string
  patternType: string
  description: string
  averageMagnitude: number
  significance: number
  confidence: number
  duration: number
  createdAt: Date
  deltaAssociations: Array<{ deltaId: string; sequenceOrder: number }>
}

interface PrismaTurningPoint {
  id: string
  memoryId: string
  deltaId: string | null
  type: string
  magnitude: number
  description: string
  factors: string
  timestamp: Date
  significance: number
  temporalContext: string
  createdAt: Date
}

type PrismaTransaction = Omit<
  PrismaClient,
  '$connect' | '$disconnect' | '$on' | '$transaction' | '$use' | '$extends'
>

// Temporary types until full types are available
interface MoodDelta {
  magnitude: number
  direction: 'positive' | 'negative' | 'neutral'
  type: 'mood_repair' | 'celebration' | 'decline' | 'plateau'
  confidence: number
  factors: string[]
}

interface TurningPoint {
  timestamp: Date
  type: 'breakthrough' | 'setback' | 'realization' | 'support_received'
  magnitude: number
  description: string
  factors: string[]
}

export interface StoredDeltaHistory {
  id: string
  memoryId: string
  conversationId: string
  deltaSequence: number
  magnitude: number
  direction: 'positive' | 'negative' | 'neutral'
  type: 'mood_repair' | 'celebration' | 'decline' | 'plateau'
  confidence: number
  factors: string[]
  significance: number
  temporalContext: {
    position: 'early' | 'middle' | 'late' | 'conclusion'
    relativeTimestamp: number
    precedingDeltas: number
    followingDeltas: number
    timeToNextDelta?: number
    timeSincePreviousDelta?: number
  }
  previousScore?: number
  currentScore: number
  detectedAt: Date
  createdAt: Date
}

export interface StoredDeltaPattern {
  id: string
  memoryId: string
  patternType:
    | 'recovery_sequence'
    | 'decline_sequence'
    | 'plateau_break'
    | 'oscillation'
  deltaIds: string[]
  significance: number
  confidence: number
  description: string
  duration: number
  averageMagnitude: number
  createdAt: Date
}

export interface StoredTurningPoint {
  id: string
  memoryId: string
  deltaId?: string
  timestamp: Date
  type: 'breakthrough' | 'setback' | 'realization' | 'support_received'
  magnitude: number
  description: string
  factors: string[]
  significance: number
  temporalContext: {
    position: 'early' | 'middle' | 'late'
    precedingMagnitude: number
    followingMagnitude: number
    contextDuration: number
  }
  createdAt: Date
}

export class DeltaHistoryStorageService {
  constructor(private prisma: PrismaClient) {}

  async storeDeltaHistory(
    memoryId: string,
    conversationId: string,
    deltas: MoodDelta[],
    conversationDuration: number,
    conversationStartTime: Date,
    transaction?: PrismaTransaction,
  ): Promise<StoredDeltaHistory[]> {
    // Use provided transaction or create a new one
    const execute = async (tx: PrismaTransaction) => {
      // Verify memory exists before creating deltas
      const memoryExists = await tx.memory.findUnique({
        where: { id: memoryId },
        select: { id: true },
      })

      if (!memoryExists) {
        throw new Error(`Memory with id ${memoryId} does not exist`)
      }

      const storedHistory: StoredDeltaHistory[] = []

      for (let i = 0; i < deltas.length; i++) {
        const delta = deltas[i]

        // Calculate temporal context
        const relativeTimestamp = i * (conversationDuration / deltas.length)
        const position = this.calculateTemporalPosition(i, deltas.length)

        // Calculate significance based on magnitude, confidence, and temporal context
        const significance = this.calculateDeltaSignificance(delta, {
          position,
          totalDeltas: deltas.length,
          sequenceNumber: i,
          conversationDuration,
        })

        const temporalContext = {
          position,
          relativeTimestamp,
          precedingDeltas: i,
          followingDeltas: deltas.length - i - 1,
          timeToNextDelta:
            i < deltas.length - 1
              ? conversationDuration / deltas.length
              : undefined,
          timeSincePreviousDelta:
            i > 0 ? conversationDuration / deltas.length : undefined,
        }

        // Store in database
        const stored = await tx.moodDelta.create({
          data: {
            memoryId,
            conversationId,
            deltaSequence: i,
            magnitude: delta.magnitude,
            direction: delta.direction,
            type: delta.type,
            confidence: delta.confidence,
            factors: JSON.stringify(delta.factors),
            significance,
            temporalContext: JSON.stringify(temporalContext),
            currentScore: 6.5, // This should come from actual mood analysis
            detectedAt: new Date(
              conversationStartTime.getTime() + relativeTimestamp,
            ),
          },
        })

        const result: StoredDeltaHistory = {
          id: stored.id,
          memoryId: stored.memoryId,
          conversationId: stored.conversationId || conversationId,
          deltaSequence: stored.deltaSequence || i,
          magnitude: stored.magnitude,
          direction: stored.direction as 'positive' | 'negative' | 'neutral',
          type: stored.type as
            | 'mood_repair'
            | 'celebration'
            | 'decline'
            | 'plateau',
          confidence: stored.confidence,
          factors: JSON.parse(stored.factors),
          significance: stored.significance,
          temporalContext,
          currentScore: stored.currentScore,
          detectedAt: stored.detectedAt,
          createdAt: stored.createdAt,
        }

        storedHistory.push(result)
      }

      return storedHistory
    }

    // Use provided transaction or create a new one
    return transaction
      ? await execute(transaction)
      : await this.prisma.$transaction(execute)
  }

  async storeDeltaPattern(
    memoryId: string,
    pattern: {
      type: StoredDeltaPattern['patternType']
      deltaIds: string[]
      description: string
      duration: number
      averageMagnitude: number
    },
  ): Promise<StoredDeltaPattern> {
    // Calculate pattern significance and confidence
    const significance = this.calculateDeltaPatternSignificance(pattern)
    const confidence = this.calculatePatternConfidence(pattern)

    // Create the pattern
    const storedPattern = await this.prisma.deltaPattern.create({
      data: {
        memoryId,
        patternType: pattern.type,
        significance,
        confidence,
        description: pattern.description,
        duration: pattern.duration,
        averageMagnitude: pattern.averageMagnitude,
      },
    })

    // Create associations to deltas - verify all delta IDs exist first
    if (pattern.deltaIds.length > 0) {
      // Verify all delta IDs exist before creating associations
      const existingDeltas = await this.prisma.moodDelta.findMany({
        where: { id: { in: pattern.deltaIds } },
        select: { id: true },
      })

      const existingDeltaIds = existingDeltas.map(
        (delta: { id: string }) => delta.id,
      )
      const missingDeltaIds = pattern.deltaIds.filter(
        (id) => !existingDeltaIds.includes(id),
      )

      if (missingDeltaIds.length > 0) {
        throw new Error(
          `Cannot create delta pattern associations: delta IDs not found: ${missingDeltaIds.join(', ')}`,
        )
      }

      await this.prisma.deltaPatternAssociation.createMany({
        data: pattern.deltaIds.map((deltaId, index) => ({
          patternId: storedPattern.id,
          deltaId,
          sequenceOrder: index,
        })),
      })
    }

    return {
      id: storedPattern.id,
      memoryId: storedPattern.memoryId,
      patternType:
        storedPattern.patternType as StoredDeltaPattern['patternType'],
      deltaIds: pattern.deltaIds,
      significance: storedPattern.significance,
      confidence: storedPattern.confidence,
      description: storedPattern.description,
      duration: storedPattern.duration,
      averageMagnitude: storedPattern.averageMagnitude,
      createdAt: storedPattern.createdAt,
    }
  }

  async storeTurningPoint(
    memoryId: string,
    turningPoint: TurningPoint,
    temporalContext: {
      position: 'early' | 'middle' | 'late'
      precedingMagnitude: number
      followingMagnitude: number
      contextDuration: number
    },
    deltaId?: string,
  ): Promise<StoredTurningPoint> {
    const significance = this.calculateTurningPointSignificance(
      turningPoint,
      temporalContext,
    )

    // Verify memory exists before creating turning point
    const memoryExists = await this.prisma.memory.findUnique({
      where: { id: memoryId },
      select: { id: true },
    })

    if (!memoryExists) {
      throw new Error(`Memory with id ${memoryId} does not exist`)
    }

    // Verify delta exists if deltaId is provided
    if (deltaId) {
      const deltaExists = await this.prisma.moodDelta.findUnique({
        where: { id: deltaId },
        select: { id: true },
      })

      if (!deltaExists) {
        throw new Error(`Delta with id ${deltaId} does not exist`)
      }
    }

    const stored = await this.prisma.turningPoint.create({
      data: {
        memoryId,
        deltaId,
        timestamp: turningPoint.timestamp,
        type: turningPoint.type,
        magnitude: turningPoint.magnitude,
        description: turningPoint.description,
        factors: JSON.stringify(turningPoint.factors),
        significance,
        temporalContext: JSON.stringify(temporalContext),
      },
    })

    return {
      id: stored.id,
      memoryId: stored.memoryId,
      deltaId: stored.deltaId || undefined,
      timestamp: stored.timestamp,
      type: stored.type as TurningPoint['type'],
      magnitude: stored.magnitude,
      description: stored.description,
      factors: JSON.parse(stored.factors),
      significance: stored.significance,
      temporalContext,
      createdAt: stored.createdAt,
    }
  }

  async getDeltaHistoryByMemoryId(
    memoryId: string,
  ): Promise<StoredDeltaHistory[]> {
    const deltas = await this.prisma.moodDelta.findMany({
      where: { memoryId },
      orderBy: { deltaSequence: 'asc' },
    })

    return deltas.map((delta: PrismaMoodDelta) => ({
      id: delta.id,
      memoryId: delta.memoryId,
      conversationId: delta.conversationId || '',
      deltaSequence: delta.deltaSequence || 0,
      magnitude: delta.magnitude,
      direction: delta.direction as 'positive' | 'negative' | 'neutral',
      type: delta.type as 'mood_repair' | 'celebration' | 'decline' | 'plateau',
      confidence: delta.confidence,
      factors: JSON.parse(delta.factors),
      significance: delta.significance,
      temporalContext: delta.temporalContext
        ? JSON.parse(delta.temporalContext)
        : {
            position: 'middle',
            relativeTimestamp: 0,
            precedingDeltas: 0,
            followingDeltas: 0,
          },
      previousScore: delta.previousScore || undefined,
      currentScore: delta.currentScore,
      detectedAt: delta.detectedAt,
      createdAt: delta.createdAt,
    }))
  }

  async getDeltaPatternsByMemoryId(
    memoryId: string,
  ): Promise<StoredDeltaPattern[]> {
    const patterns = await this.prisma.deltaPattern.findMany({
      where: { memoryId },
      include: {
        deltaAssociations: {
          orderBy: { sequenceOrder: 'asc' },
        },
      },
      orderBy: { significance: 'desc' },
    })

    return patterns.map((pattern: PrismaDeltaPattern) => ({
      id: pattern.id,
      memoryId: pattern.memoryId,
      patternType: pattern.patternType as StoredDeltaPattern['patternType'],
      deltaIds: pattern.deltaAssociations.map(
        (assoc: { deltaId: string; sequenceOrder: number }) => assoc.deltaId,
      ),
      significance: pattern.significance,
      confidence: pattern.confidence,
      description: pattern.description,
      duration: pattern.duration,
      averageMagnitude: pattern.averageMagnitude,
      createdAt: pattern.createdAt,
    }))
  }

  async getTurningPointsByMemoryId(
    memoryId: string,
  ): Promise<StoredTurningPoint[]> {
    const turningPoints = await this.prisma.turningPoint.findMany({
      where: { memoryId },
      orderBy: { timestamp: 'asc' },
    })

    return turningPoints.map((tp: PrismaTurningPoint) => ({
      id: tp.id,
      memoryId: tp.memoryId,
      deltaId: tp.deltaId || undefined,
      timestamp: tp.timestamp,
      type: tp.type as TurningPoint['type'],
      magnitude: tp.magnitude,
      description: tp.description,
      factors: JSON.parse(tp.factors),
      significance: tp.significance,
      temporalContext: JSON.parse(tp.temporalContext),
      createdAt: tp.createdAt,
    }))
  }

  async getDeltasBySignificance(
    minSignificance: number,
    limit?: number,
  ): Promise<StoredDeltaHistory[]> {
    const deltas = await this.prisma.moodDelta.findMany({
      where: {
        significance: {
          gte: minSignificance,
        },
      },
      orderBy: { significance: 'desc' },
      take: limit,
    })

    return deltas.map((delta: PrismaMoodDelta) => ({
      id: delta.id,
      memoryId: delta.memoryId,
      conversationId: delta.conversationId || '',
      deltaSequence: delta.deltaSequence || 0,
      magnitude: delta.magnitude,
      direction: delta.direction as 'positive' | 'negative' | 'neutral',
      type: delta.type as 'mood_repair' | 'celebration' | 'decline' | 'plateau',
      confidence: delta.confidence,
      factors: JSON.parse(delta.factors),
      significance: delta.significance,
      temporalContext: delta.temporalContext
        ? JSON.parse(delta.temporalContext)
        : {
            position: 'middle',
            relativeTimestamp: 0,
            precedingDeltas: 0,
            followingDeltas: 0,
          },
      previousScore: delta.previousScore || undefined,
      currentScore: delta.currentScore,
      detectedAt: delta.detectedAt,
      createdAt: delta.createdAt,
    }))
  }

  async getTemporalDeltaSequence(
    memoryId: string,
    timeWindow: number,
  ): Promise<StoredDeltaHistory[]> {
    const cutoffTime = new Date(Date.now() - timeWindow)

    const deltas = await this.prisma.moodDelta.findMany({
      where: {
        memoryId,
        detectedAt: {
          gte: cutoffTime,
        },
      },
      orderBy: { deltaSequence: 'asc' },
    })

    return deltas.map((delta: PrismaMoodDelta) => ({
      id: delta.id,
      memoryId: delta.memoryId,
      conversationId: delta.conversationId || '',
      deltaSequence: delta.deltaSequence || 0,
      magnitude: delta.magnitude,
      direction: delta.direction as 'positive' | 'negative' | 'neutral',
      type: delta.type as 'mood_repair' | 'celebration' | 'decline' | 'plateau',
      confidence: delta.confidence,
      factors: JSON.parse(delta.factors),
      significance: delta.significance,
      temporalContext: delta.temporalContext
        ? JSON.parse(delta.temporalContext)
        : {
            position: 'middle',
            relativeTimestamp: 0,
            precedingDeltas: 0,
            followingDeltas: 0,
          },
      previousScore: delta.previousScore || undefined,
      currentScore: delta.currentScore,
      detectedAt: delta.detectedAt,
      createdAt: delta.createdAt,
    }))
  }

  // Helper methods for significance calculation
  private calculateDeltaSignificance(
    delta: MoodDelta,
    context: {
      position: 'early' | 'middle' | 'late' | 'conclusion'
      totalDeltas: number
      sequenceNumber: number
      conversationDuration: number
    },
  ): number {
    let significance = delta.magnitude * delta.confidence

    // Position-based weighting
    const positionWeights = {
      early: 1.2,
      middle: 1.0,
      late: 1.1,
      conclusion: 1.3,
    }
    significance *= positionWeights[context.position]

    // Type-based weighting
    const typeWeights = {
      mood_repair: 1.5,
      celebration: 1.2,
      decline: 1.3,
      plateau: 0.8,
    }
    significance *= typeWeights[delta.type]

    // Sequence position factor - but don't double-apply for early/conclusion positions
    if (context.sequenceNumber === 0 && context.position !== 'early') {
      significance *= 1.1 // First delta is important (but early position already gets boost)
    }
    if (
      context.sequenceNumber === context.totalDeltas - 1 &&
      context.position !== 'conclusion'
    ) {
      significance *= 1.1 // Last delta is important (but conclusion position already gets boost)
    }

    return Math.min(10.0, significance)
  }

  private calculateDeltaPatternSignificance(pattern: {
    type: StoredDeltaPattern['patternType']
    deltaIds: string[]
    duration: number
    averageMagnitude: number
  }): number {
    let significance = pattern.averageMagnitude * pattern.deltaIds.length

    // Pattern type weighting
    const patternWeights = {
      recovery_sequence: 2.0,
      decline_sequence: 1.8,
      plateau_break: 1.5,
      oscillation: 1.2,
    }
    significance *= patternWeights[pattern.type]

    // Duration factor (longer patterns are more significant)
    const durationHours = pattern.duration / (1000 * 60 * 60)
    if (durationHours > 2) {
      significance *= 1.3
    }

    return Math.min(10.0, significance)
  }

  private calculatePatternConfidence(pattern: {
    type: StoredDeltaPattern['patternType']
    deltaIds: string[]
    averageMagnitude: number
  }): number {
    let confidence = 0.7 // Base confidence

    // More deltas = higher confidence
    confidence += Math.min(0.2, pattern.deltaIds.length * 0.05)

    // Higher magnitude = higher confidence
    confidence += Math.min(0.1, pattern.averageMagnitude * 0.02)

    return Math.min(1.0, confidence)
  }

  private calculateTurningPointSignificance(
    turningPoint: TurningPoint,
    context: {
      precedingMagnitude: number
      followingMagnitude: number
      contextDuration: number
    },
  ): number {
    let significance = turningPoint.magnitude

    // Type-based weighting
    const typeWeights = {
      breakthrough: 2.0,
      setback: 1.8,
      support_received: 1.5,
      realization: 1.2,
    }
    significance *= typeWeights[turningPoint.type]

    // Context magnitude factor
    const totalContextMagnitude =
      context.precedingMagnitude + context.followingMagnitude
    significance *= Math.min(2.0, 1 + totalContextMagnitude * 0.1)

    return Math.min(10.0, significance)
  }

  private calculateTemporalPosition(
    index: number,
    total: number,
  ): 'early' | 'middle' | 'late' | 'conclusion' {
    // Handle single delta case
    if (total === 1) return 'early'

    const ratio = index / (total - 1)

    if (ratio < 0.2) return 'early'
    if (ratio > 0.9) return 'conclusion'
    if (ratio > 0.7) return 'late'
    return 'middle'
  }
}

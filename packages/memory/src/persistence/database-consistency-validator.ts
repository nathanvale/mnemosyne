import { PrismaClient } from '@studio/db'

export interface RelationshipIntegrityReport {
  isValid: boolean
  violations: Array<{
    table: string
    violationType:
      | 'orphaned_record'
      | 'missing_foreign_key'
      | 'invalid_reference'
    recordId: string
    details: string
  }>
}

export interface DataConsistencyReport {
  isValid: boolean
  inconsistencies: Array<{
    type: 'score_mismatch' | 'timestamp_anomaly' | 'data_format_error'
    details: string
    affectedRecords: string[]
  }>
}

export class DatabaseConsistencyValidator {
  constructor(private prisma: PrismaClient) {}

  async validateRelationshipIntegrity(): Promise<RelationshipIntegrityReport> {
    const violations: RelationshipIntegrityReport['violations'] = []

    try {
      // Check for orphaned MoodScores (mood scores without valid memory references)
      // Use raw SQL for efficiency when checking orphaned records
      const orphanedMoodScoresResult = await this.prisma.$queryRaw<
        Array<{ id: string; memoryId: string }>
      >`
        SELECT ms.id, ms.memoryId 
        FROM MoodScore ms 
        LEFT JOIN Memory m ON ms.memoryId = m.id 
        WHERE m.id IS NULL
      `
      const orphanedMoodScores = orphanedMoodScoresResult || []

      for (const score of orphanedMoodScores) {
        violations.push({
          table: 'MoodScore',
          violationType: 'missing_foreign_key',
          recordId: score.id,
          details: `MoodScore ${score.id} references non-existent memory ${score.memoryId}`,
        })
      }

      // Check for orphaned MoodFactors (factors without valid mood score references)
      const orphanedMoodFactorsResult = await this.prisma.$queryRaw<
        Array<{ id: string; moodScoreId: string }>
      >`
        SELECT mf.id, mf.moodScoreId 
        FROM MoodFactor mf 
        LEFT JOIN MoodScore ms ON mf.moodScoreId = ms.id 
        WHERE ms.id IS NULL
      `
      const orphanedMoodFactors = orphanedMoodFactorsResult || []

      for (const factor of orphanedMoodFactors) {
        violations.push({
          table: 'MoodFactor',
          violationType: 'missing_foreign_key',
          recordId: factor.id,
          details: `MoodFactor ${factor.id} references non-existent mood score ${factor.moodScoreId}`,
        })
      }

      // Check for orphaned MoodDeltas
      const orphanedMoodDeltasResult = await this.prisma.$queryRaw<
        Array<{ id: string; memoryId: string }>
      >`
        SELECT md.id, md.memoryId 
        FROM MoodDelta md 
        LEFT JOIN Memory m ON md.memoryId = m.id 
        WHERE m.id IS NULL
      `
      const orphanedMoodDeltas = orphanedMoodDeltasResult || []

      for (const delta of orphanedMoodDeltas) {
        violations.push({
          table: 'MoodDelta',
          violationType: 'missing_foreign_key',
          recordId: delta.id,
          details: `MoodDelta ${delta.id} references non-existent memory ${delta.memoryId}`,
        })
      }

      // Check for orphaned ValidationResults
      const orphanedValidationResultsResult = await this.prisma.$queryRaw<
        Array<{ id: string; memoryId: string }>
      >`
        SELECT vr.id, vr.memoryId 
        FROM ValidationResult vr 
        LEFT JOIN Memory m ON vr.memoryId = m.id 
        WHERE m.id IS NULL
      `
      const orphanedValidationResults = orphanedValidationResultsResult || []

      for (const validation of orphanedValidationResults) {
        violations.push({
          table: 'ValidationResult',
          violationType: 'missing_foreign_key',
          recordId: validation.id,
          details: `ValidationResult ${validation.id} references non-existent memory ${validation.memoryId}`,
        })
      }

      // Check for orphaned DeltaPatterns
      const orphanedDeltaPatternsResult = await this.prisma.$queryRaw<
        Array<{ id: string; memoryId: string }>
      >`
        SELECT dp.id, dp.memoryId 
        FROM DeltaPattern dp 
        LEFT JOIN Memory m ON dp.memoryId = m.id 
        WHERE m.id IS NULL
      `
      const orphanedDeltaPatterns = orphanedDeltaPatternsResult || []

      for (const pattern of orphanedDeltaPatterns) {
        violations.push({
          table: 'DeltaPattern',
          violationType: 'missing_foreign_key',
          recordId: pattern.id,
          details: `DeltaPattern ${pattern.id} references non-existent memory ${pattern.memoryId}`,
        })
      }

      // Check for orphaned TurningPoints
      const orphanedTurningPointsResult = await this.prisma.$queryRaw<
        Array<{ id: string; memoryId: string }>
      >`
        SELECT tp.id, tp.memoryId 
        FROM TurningPoint tp 
        LEFT JOIN Memory m ON tp.memoryId = m.id 
        WHERE m.id IS NULL
      `
      const orphanedTurningPoints = orphanedTurningPointsResult || []

      for (const turningPoint of orphanedTurningPoints) {
        violations.push({
          table: 'TurningPoint',
          violationType: 'missing_foreign_key',
          recordId: turningPoint.id,
          details: `TurningPoint ${turningPoint.id} references non-existent memory ${turningPoint.memoryId}`,
        })
      }

      return {
        isValid: violations.length === 0,
        violations,
      }
    } catch (error) {
      throw new Error(`Failed to validate relationship integrity: ${error}`)
    }
  }

  async validateDataConsistency(): Promise<DataConsistencyReport> {
    const inconsistencies: DataConsistencyReport['inconsistencies'] = []

    try {
      // Check for score mismatches between MoodScore and ValidationResult
      const scoreValidations = await this.prisma.validationResult.findMany({
        include: {
          memory: {
            include: {
              moodScores: {
                orderBy: { createdAt: 'desc' },
                take: 1,
              },
            },
          },
        },
      })

      for (const validation of scoreValidations) {
        if (validation.memory.moodScores.length > 0) {
          const latestMoodScore = validation.memory.moodScores[0]
          const scoreDifference = Math.abs(
            validation.algorithmScore - latestMoodScore.score,
          )

          // Flag significant discrepancies (more than 2 points difference might indicate data corruption)
          if (scoreDifference > 2.0) {
            inconsistencies.push({
              type: 'score_mismatch',
              details: `Large discrepancy between mood score (${latestMoodScore.score}) and validation algorithm score (${validation.algorithmScore})`,
              affectedRecords: [validation.id, latestMoodScore.id],
            })
          }
        }
      }

      // Check for timestamp anomalies
      const moodScores = await this.prisma.moodScore.findMany({
        include: {
          memory: true,
        },
        orderBy: { createdAt: 'asc' },
      })

      for (const moodScore of moodScores) {
        // Check if mood score was created before its associated memory
        if (moodScore.createdAt < moodScore.memory.createdAt) {
          inconsistencies.push({
            type: 'timestamp_anomaly',
            details: `MoodScore ${moodScore.id} created before its associated memory ${moodScore.memory.id}`,
            affectedRecords: [moodScore.id, moodScore.memory.id],
          })
        }

        // Check if calculatedAt is in the future (beyond a reasonable threshold)
        const now = new Date()
        const futureThreshold = new Date(now.getTime() + 24 * 60 * 60 * 1000) // 24 hours
        if (moodScore.calculatedAt > futureThreshold) {
          inconsistencies.push({
            type: 'timestamp_anomaly',
            details: `MoodScore ${moodScore.id} has calculatedAt timestamp in the future: ${moodScore.calculatedAt}`,
            affectedRecords: [moodScore.id],
          })
        }
      }

      // Check for data format errors in JSON fields
      const moodFactors = await this.prisma.moodFactor.findMany()
      for (const factor of moodFactors) {
        try {
          JSON.parse(factor.evidence)
        } catch (error) {
          inconsistencies.push({
            type: 'data_format_error',
            details: `MoodFactor ${factor.id} has invalid JSON in evidence field`,
            affectedRecords: [factor.id],
          })
        }
      }

      const moodDeltas = await this.prisma.moodDelta.findMany()
      for (const delta of moodDeltas) {
        try {
          JSON.parse(delta.factors)
        } catch (error) {
          inconsistencies.push({
            type: 'data_format_error',
            details: `MoodDelta ${delta.id} has invalid JSON in factors field`,
            affectedRecords: [delta.id],
          })
        }

        if (delta.temporalContext) {
          try {
            JSON.parse(delta.temporalContext)
          } catch (error) {
            inconsistencies.push({
              type: 'data_format_error',
              details: `MoodDelta ${delta.id} has invalid JSON in temporalContext field`,
              affectedRecords: [delta.id],
            })
          }
        }
      }

      return {
        isValid: inconsistencies.length === 0,
        inconsistencies,
      }
    } catch (error) {
      throw new Error(`Failed to validate data consistency: ${error}`)
    }
  }

  async performComprehensiveValidation(): Promise<{
    relationshipIntegrity: RelationshipIntegrityReport
    dataConsistency: DataConsistencyReport
    overallValid: boolean
  }> {
    const [relationshipIntegrity, dataConsistency] = await Promise.all([
      this.validateRelationshipIntegrity(),
      this.validateDataConsistency(),
    ])

    return {
      relationshipIntegrity,
      dataConsistency,
      overallValid: relationshipIntegrity.isValid && dataConsistency.isValid,
    }
  }
}

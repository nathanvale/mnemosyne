import {
  type DatabaseMemoryInput,
  type DatabaseEmotionalContextInput,
  createMemoryDatabase,
  validateMemoryForDatabase,
  validateEmotionalContextForDatabase,
  type PrismaClient,
} from '@studio/db'
import { createLogger } from '@studio/logger'
import {
  type ValidationResult,
  type ValidationError,
  type ValidationWarning,
} from '@studio/schema'

import {
  MemoryContentHasher,
  MemoryDeduplicator,
  type MemoryForDeduplication,
} from './memory-deduplication'

const logger = createLogger({
  tags: ['memory-processing'],
  includeCallsite: true,
})

/**
 * Batch processing configuration
 */
export interface BatchProcessingConfig {
  batchSize: number
  continueOnError: boolean
  validateFirst: boolean
  logProgress: boolean
}

/**
 * Memory processing result with detailed statistics
 */
export interface MemoryProcessingResult {
  processed: number
  successful: number
  failed: number
  validationErrors: number
  databaseErrors: number
  duplicatesSkipped: number
  similarMerged: number
  errors: Array<{
    index: number
    type: 'validation' | 'database' | 'deduplication'
    message: string
    data?: unknown
  }>
}

/**
 * Memory data processor with schema validation
 */
export class MemoryDataProcessor {
  private memoryDb: ReturnType<typeof createMemoryDatabase>
  private contentHasher: MemoryContentHasher
  private deduplicator: MemoryDeduplicator

  constructor(
    private prisma: PrismaClient,
    private config: BatchProcessingConfig = {
      batchSize: 100,
      continueOnError: true,
      validateFirst: true,
      logProgress: true,
    },
  ) {
    this.memoryDb = createMemoryDatabase(prisma)
    this.contentHasher = new MemoryContentHasher()
    this.deduplicator = new MemoryDeduplicator(this.contentHasher)
  }

  /**
   * Process memories with deduplication support
   */
  async processMemoriesWithDeduplication(
    memoriesData: unknown[],
  ): Promise<MemoryProcessingResult> {
    const result: MemoryProcessingResult = {
      processed: 0,
      successful: 0,
      failed: 0,
      validationErrors: 0,
      databaseErrors: 0,
      duplicatesSkipped: 0,
      similarMerged: 0,
      errors: [],
    }

    if (this.config.logProgress) {
      logger.info(`Starting memory processing with deduplication`, {
        totalItems: memoriesData.length,
        batchSize: this.config.batchSize,
        validateFirst: this.config.validateFirst,
      })
    }

    this.deduplicator.clearSessionHashes()

    const existingMemoriesResult =
      await this.memoryDb.getAllMemoriesForDeduplication()
    const existingMemories: MemoryForDeduplication[] =
      existingMemoriesResult.success && existingMemoriesResult.data
        ? existingMemoriesResult.data.map((m) => ({
            id: m.id,
            summary: m.summary,
            participants: JSON.parse(m.participants),
            sourceMessageIds: JSON.parse(m.sourceMessageIds),
            confidence: m.confidence,
          }))
        : []

    for (let i = 0; i < memoriesData.length; i += this.config.batchSize) {
      const batch = memoriesData.slice(i, i + this.config.batchSize)

      if (this.config.logProgress) {
        logger.info(
          `Processing batch ${Math.floor(i / this.config.batchSize) + 1} with deduplication`,
          {
            batchStart: i,
            batchSize: batch.length,
          },
        )
      }

      await this.processBatchWithDeduplication(
        batch,
        i,
        result,
        existingMemories,
      )
    }

    if (this.config.logProgress) {
      logger.info(`Memory processing with deduplication completed`, {
        ...result,
        successRate:
          result.processed > 0 ? result.successful / result.processed : 0,
        deduplicationRate:
          result.processed > 0
            ? result.duplicatesSkipped / result.processed
            : 0,
      })
    }

    return result
  }

  /**
   * Process a batch of memory data with validation
   */
  async processMemories(
    memoriesData: unknown[],
  ): Promise<MemoryProcessingResult> {
    const result: MemoryProcessingResult = {
      processed: 0,
      successful: 0,
      failed: 0,
      validationErrors: 0,
      databaseErrors: 0,
      duplicatesSkipped: 0,
      similarMerged: 0,
      errors: [],
    }

    if (this.config.logProgress) {
      logger.info(`Starting memory processing`, {
        totalItems: memoriesData.length,
        batchSize: this.config.batchSize,
        validateFirst: this.config.validateFirst,
      })
    }

    // Process in batches
    for (let i = 0; i < memoriesData.length; i += this.config.batchSize) {
      const batch = memoriesData.slice(i, i + this.config.batchSize)

      if (this.config.logProgress) {
        logger.info(
          `Processing batch ${Math.floor(i / this.config.batchSize) + 1}`,
          {
            batchStart: i,
            batchSize: batch.length,
          },
        )
      }

      await this.processBatch(batch, i, result)
    }

    if (this.config.logProgress) {
      logger.info(`Memory processing completed`, {
        ...result,
        successRate:
          result.processed > 0 ? result.successful / result.processed : 0,
      })
    }

    return result
  }

  /**
   * Process a single batch of memories
   */
  private async processBatch(
    batch: unknown[],
    startIndex: number,
    result: MemoryProcessingResult,
  ): Promise<void> {
    for (let i = 0; i < batch.length; i++) {
      const globalIndex = startIndex + i
      const memoryData = batch[i]

      try {
        result.processed++
        await this.processSingleMemory(memoryData, globalIndex, result)
      } catch (error) {
        result.failed++
        result.errors.push({
          index: globalIndex,
          type: 'database',
          message: error instanceof Error ? error.message : String(error),
          data: memoryData,
        })

        if (!this.config.continueOnError) {
          throw error
        }
      }
    }
  }

  /**
   * Process a single batch of memories with deduplication
   */
  private async processBatchWithDeduplication(
    batch: unknown[],
    startIndex: number,
    result: MemoryProcessingResult,
    existingMemories: MemoryForDeduplication[],
  ): Promise<void> {
    for (let i = 0; i < batch.length; i++) {
      const globalIndex = startIndex + i
      const memoryData = batch[i]

      try {
        result.processed++
        await this.processSingleMemoryWithDeduplication(
          memoryData,
          globalIndex,
          result,
          existingMemories,
        )
      } catch (error) {
        result.failed++
        result.errors.push({
          index: globalIndex,
          type: 'database',
          message: error instanceof Error ? error.message : String(error),
          data: memoryData,
        })
        if (!this.config.continueOnError) {
          throw error
        }
      }
    }
  }

  /**
   * Process a single memory with validation and deduplication
   */
  private async processSingleMemoryWithDeduplication(
    memoryData: unknown,
    index: number,
    result: MemoryProcessingResult,
    existingMemories: MemoryForDeduplication[],
  ): Promise<void> {
    if (this.config.validateFirst) {
      const validation = validateMemoryForDatabase(memoryData)
      if (!validation.isValid) {
        result.failed++
        result.validationErrors++
        result.errors.push({
          index,
          type: 'validation',
          message: `Validation failed: ${validation.errors.map((e: ValidationError) => e.message).join(', ')}`,
          data: memoryData,
        })
        return
      }
    }

    const memoryInput = memoryData as DatabaseMemoryInput

    const memory: MemoryForDeduplication = {
      id: memoryInput.id,
      summary: memoryInput.summary,
      participants: memoryInput.participants,
      sourceMessageIds: memoryInput.sourceMessageIds,
      confidence: memoryInput.confidence,
    }

    const duplicationCheck = await this.deduplicator.checkForDuplicates(
      memory,
      existingMemories,
    )

    if (duplicationCheck.isDuplicate) {
      result.duplicatesSkipped++

      if (this.config.logProgress) {
        logger.info(`Skipping duplicate memory`, {
          index,
          memoryId: memory.id,
          duplicateType: duplicationCheck.duplicateType,
          similarity: duplicationCheck.similarity,
          existingId: duplicationCheck.existingMemoryId,
        })
      }

      return
    }

    const contentHash = this.contentHasher.generateContentHash(memory)
    const memoryInputWithHash = {
      ...memoryInput,
      contentHash,
    }

    const createResult =
      await this.memoryDb.createMemoryWithDeduplication(memoryInputWithHash)

    if (!createResult.success) {
      result.failed++
      result.databaseErrors++
      result.errors.push({
        index,
        type: 'database',
        message: createResult.error || 'Unknown database error',
        data: memoryData,
      })
    } else {
      result.successful++
      existingMemories.push(memory)
    }
  }

  /**
   * Process a single memory with validation
   */
  private async processSingleMemory(
    memoryData: unknown,
    index: number,
    result: MemoryProcessingResult,
  ): Promise<void> {
    // Validate first if configured
    if (this.config.validateFirst) {
      const validation = validateMemoryForDatabase(memoryData)
      if (!validation.isValid) {
        result.failed++
        result.validationErrors++
        result.errors.push({
          index,
          type: 'validation',
          message: `Validation failed: ${validation.errors.map((e: ValidationError) => e.message).join(', ')}`,
          data: memoryData,
        })
        return
      }
    }

    // Process the memory
    const memoryInput = memoryData as DatabaseMemoryInput
    const createResult = await this.memoryDb.createMemory(memoryInput)

    if (!createResult.success) {
      result.failed++
      result.databaseErrors++
      result.errors.push({
        index,
        type: 'database',
        message: createResult.error || 'Unknown database error',
        data: memoryData,
      })
    } else {
      result.successful++

      if (this.config.logProgress && result.successful % 50 === 0) {
        logger.info(`Progress update`, {
          successful: result.successful,
          processed: result.processed,
        })
      }
    }
  }

  /**
   * Validate a batch of memories without processing
   */
  async validateMemories(memoriesData: unknown[]): Promise<{
    valid: number
    invalid: number
    validationResults: Array<{
      index: number
      isValid: boolean
      errors: ValidationResult['errors']
    }>
  }> {
    const results = memoriesData.map((data, index) => {
      const validation = validateMemoryForDatabase(data)
      return {
        index,
        isValid: validation.isValid,
        errors: validation.errors,
      }
    })

    const valid = results.filter((r) => r.isValid).length
    const invalid = results.length - valid

    if (this.config.logProgress) {
      logger.info(`Memory validation completed`, {
        total: memoriesData.length,
        valid,
        invalid,
        validationRate: valid / memoriesData.length,
      })
    }

    return {
      valid,
      invalid,
      validationResults: results,
    }
  }

  /**
   * Process emotional context data with validation
   */
  async processEmotionalContexts(
    memoryId: string,
    contextsData: unknown[],
  ): Promise<MemoryProcessingResult> {
    const result: MemoryProcessingResult = {
      processed: 0,
      successful: 0,
      failed: 0,
      validationErrors: 0,
      databaseErrors: 0,
      duplicatesSkipped: 0,
      similarMerged: 0,
      errors: [],
    }

    for (let i = 0; i < contextsData.length; i++) {
      const contextData = contextsData[i]
      result.processed++

      try {
        // Validate first
        const validation = validateEmotionalContextForDatabase(contextData)
        if (!validation.isValid) {
          result.failed++
          result.validationErrors++
          result.errors.push({
            index: i,
            type: 'validation',
            message: `Emotional context validation failed: ${validation.errors.map((e: ValidationError) => e.message).join(', ')}`,
            data: contextData,
          })
          continue
        }

        // Process the emotional context
        const contextInput = contextData as DatabaseEmotionalContextInput
        const createResult = await this.memoryDb.createEmotionalContext(
          memoryId,
          contextInput,
        )

        if (!createResult.success) {
          result.failed++
          result.databaseErrors++
          result.errors.push({
            index: i,
            type: 'database',
            message: createResult.error || 'Unknown database error',
            data: contextData,
          })
        } else {
          result.successful++
        }
      } catch (error) {
        result.failed++
        result.errors.push({
          index: i,
          type: 'database',
          message: error instanceof Error ? error.message : String(error),
          data: contextData,
        })

        if (!this.config.continueOnError) {
          throw error
        }
      }
    }

    return result
  }

  /**
   * Generate processing report
   */
  generateReport(result: MemoryProcessingResult): string {
    const successRate =
      result.processed > 0
        ? ((result.successful / result.processed) * 100).toFixed(2)
        : '0.00'

    let report = `Memory Processing Report\n`
    report += `========================\n`
    report += `Total Processed: ${result.processed}\n`
    report += `Successful: ${result.successful}\n`
    report += `Failed: ${result.failed}\n`
    report += `Success Rate: ${successRate}%\n`
    report += `\n`
    report += `Error Breakdown:\n`
    report += `- Validation Errors: ${result.validationErrors}\n`
    report += `- Database Errors: ${result.databaseErrors}\n`

    if (result.errors.length > 0) {
      report += `\nFirst 10 Errors:\n`
      result.errors.slice(0, 10).forEach((error, i) => {
        report += `${i + 1}. [${error.type}] Index ${error.index}: ${error.message}\n`
      })

      if (result.errors.length > 10) {
        report += `... and ${result.errors.length - 10} more errors\n`
      }
    }

    return report
  }
}

/**
 * Utility function to create a memory processor
 */
export function createMemoryProcessor(
  prisma: PrismaClient,
  config?: Partial<BatchProcessingConfig>,
): MemoryDataProcessor {
  return new MemoryDataProcessor(prisma, {
    batchSize: 100,
    continueOnError: true,
    validateFirst: true,
    logProgress: true,
    ...config,
  })
}

/**
 * Utility function to validate a single memory
 */
export function validateSingleMemory(data: unknown): {
  isValid: boolean
  errors: string[]
  warnings: string[]
} {
  const validation = validateMemoryForDatabase(data)
  return {
    isValid: validation.isValid,
    errors: validation.errors.map((e: ValidationError) => e.message),
    warnings: validation.warnings.map((w: ValidationWarning) => w.message),
  }
}

/**
 * Utility function to transform and validate legacy memory data
 */
export function transformLegacyMemory(legacyData: {
  id?: string
  content?: string
  messages?: string[]
  summary?: string
  confidence?: number
  [key: string]: unknown
}): DatabaseMemoryInput {
  // Transform legacy format to new schema
  const transformed: DatabaseMemoryInput = {
    id: legacyData.id || `memory-${Date.now()}`,
    sourceMessageIds: Array.isArray(legacyData.messages)
      ? legacyData.messages
      : legacyData.content
        ? ['legacy-content']
        : [],
    participants: [{ id: 'legacy-user', name: 'Legacy User', role: 'unknown' }],
    summary: legacyData.summary || legacyData.content || 'Legacy memory',
    confidence: legacyData.confidence || 5,
    contentHash: '', // Will be generated during processing
    extractedAt: new Date(),
  }

  // Validate the transformed data
  const validation = validateMemoryForDatabase(transformed)
  if (!validation.isValid) {
    throw new Error(
      `Legacy data transformation failed: ${validation.errors.map((e: ValidationError) => e.message).join(', ')}`,
    )
  }

  return transformed
}

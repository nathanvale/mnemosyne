import {
  type ValidationResult,
  type ValidationError,
  isNonEmptyString,
  isNumberInRange,
} from '@studio/schema'

import type {
  Memory as PrismaMemory,
  EmotionalContext as PrismaEmotionalContext,
  RelationshipDynamics as PrismaRelationshipDynamics,
} from '../generated'

import { PrismaClient } from '../generated'

/**
 * Database-specific input types that match Prisma schema structure
 */
export interface DatabaseMemoryInput {
  id: string
  sourceMessageIds: string[] // Array of message IDs
  participants: Array<{
    id: string
    name: string
    role: string
  }>
  summary: string
  confidence: number // 1-10 scale
  contentHash: string // SHA-256 hash for deduplication
  deduplicationMetadata?: string // JSON metadata for merge history
  extractedAt?: Date
}

export interface DatabaseEmotionalContextInput {
  id: string
  primaryMood: string
  intensity: number
  themes: string[]
  emotionalMarkers: string[]
  contextualEvents: string[]
  temporalPatterns: {
    isBuilding?: boolean
    isResolving?: boolean
    [key: string]: unknown
  }
}

export interface DatabaseRelationshipDynamicsInput {
  id: string
  overallDynamics: Record<string, unknown>
  participantDynamics: Array<Record<string, unknown>>
  communicationPatterns: string[]
  interactionQuality: {
    quality: string
    indicators: string[]
    [key: string]: unknown
  }
}

/**
 * Database operation result with validation information
 */
export interface DatabaseOperationResult<T> {
  data: T | null
  validation: ValidationResult
  success: boolean
  error?: string
}

/**
 * Validation functions for database inputs
 */
function validateDatabaseMemoryInput(input: unknown): ValidationResult {
  const errors: ValidationError[] = []

  if (!input || typeof input !== 'object') {
    errors.push({
      message: 'Input must be an object',
      field: 'root',
      value: input,
      expectedType: 'object',
      code: 'INVALID_TYPE',
    })
    return { isValid: false, errors, warnings: [] }
  }

  const data = input as Record<string, unknown>

  if (!isNonEmptyString(data.id)) {
    errors.push({
      message: 'ID must be a non-empty string',
      field: 'id',
      value: data.id,
      expectedType: 'string',
      code: 'INVALID_TYPE',
    })
  }

  if (!Array.isArray(data.sourceMessageIds)) {
    errors.push({
      message: 'sourceMessageIds must be an array',
      field: 'sourceMessageIds',
      value: data.sourceMessageIds,
      expectedType: 'array',
      code: 'INVALID_TYPE',
    })
  }

  if (!Array.isArray(data.participants)) {
    errors.push({
      message: 'participants must be an array',
      field: 'participants',
      value: data.participants,
      expectedType: 'array',
      code: 'INVALID_TYPE',
    })
  }

  if (!isNonEmptyString(data.summary)) {
    errors.push({
      message: 'summary must be a non-empty string',
      field: 'summary',
      value: data.summary,
      expectedType: 'string',
      code: 'INVALID_TYPE',
    })
  }

  if (!isNumberInRange(data.confidence, 1, 10)) {
    errors.push({
      message: 'confidence must be a number between 1 and 10',
      field: 'confidence',
      value: data.confidence,
      expectedType: 'number',
      code: 'INVALID_RANGE',
    })
  }

  // contentHash can be empty string for deduplication processing - it will be generated
  if (
    data.contentHash !== undefined &&
    data.contentHash !== '' &&
    !isNonEmptyString(data.contentHash)
  ) {
    errors.push({
      message: 'contentHash must be a non-empty string when provided',
      field: 'contentHash',
      value: data.contentHash,
      expectedType: 'string',
      code: 'INVALID_TYPE',
    })
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings: [],
  }
}

function validateDatabaseEmotionalContextInput(
  input: unknown,
): ValidationResult {
  const errors: ValidationError[] = []

  if (!input || typeof input !== 'object') {
    errors.push({
      message: 'Input must be an object',
      field: 'root',
      value: input,
      expectedType: 'object',
      code: 'INVALID_TYPE',
    })
    return { isValid: false, errors, warnings: [] }
  }

  const data = input as Record<string, unknown>

  if (!isNonEmptyString(data.id)) {
    errors.push({
      message: 'ID must be a non-empty string',
      field: 'id',
      value: data.id,
      expectedType: 'string',
      code: 'INVALID_TYPE',
    })
  }

  if (!isNonEmptyString(data.primaryMood)) {
    errors.push({
      message: 'primaryMood must be a non-empty string',
      field: 'primaryMood',
      value: data.primaryMood,
      expectedType: 'string',
      code: 'INVALID_TYPE',
    })
  }

  if (!isNumberInRange(data.intensity, 1, 10)) {
    errors.push({
      message: 'intensity must be a number between 1 and 10',
      field: 'intensity',
      value: data.intensity,
      expectedType: 'number',
      code: 'INVALID_RANGE',
    })
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings: [],
  }
}

function validateDatabaseRelationshipDynamicsInput(
  input: unknown,
): ValidationResult {
  const errors: ValidationError[] = []

  if (!input || typeof input !== 'object') {
    errors.push({
      message: 'Input must be an object',
      field: 'root',
      value: input,
      expectedType: 'object',
      code: 'INVALID_TYPE',
    })
    return { isValid: false, errors, warnings: [] }
  }

  const data = input as Record<string, unknown>

  if (!isNonEmptyString(data.id)) {
    errors.push({
      message: 'ID must be a non-empty string',
      field: 'id',
      value: data.id,
      expectedType: 'string',
      code: 'INVALID_TYPE',
    })
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings: [],
  }
}

/**
 * Type-safe memory database operations with schema validation
 */
export class MemoryDatabase {
  constructor(private prisma: PrismaClient) {}

  /**
   * Create a memory with full validation
   */
  async createMemory(
    memoryData: DatabaseMemoryInput,
  ): Promise<DatabaseOperationResult<PrismaMemory>> {
    const validation = validateDatabaseMemoryInput(memoryData)

    if (!validation.isValid) {
      return {
        data: null,
        validation,
        success: false,
        error: `Memory validation failed: ${validation.errors.map((e) => e.message).join(', ')}`,
      }
    }

    try {
      const created = await this.prisma.memory.create({
        data: {
          id: memoryData.id,
          sourceMessageIds: JSON.stringify(memoryData.sourceMessageIds),
          participants: JSON.stringify(memoryData.participants),
          summary: memoryData.summary,
          confidence: memoryData.confidence,
          contentHash: memoryData.contentHash,
          deduplicationMetadata: memoryData.deduplicationMetadata,
          extractedAt: memoryData.extractedAt ?? new Date(),
        },
        include: {
          messages: true,
          emotionalContext: true,
          relationshipDynamics: true,
          validationStatus: true,
          qualityMetrics: true,
        },
      })

      return {
        data: created,
        validation,
        success: true,
      }
    } catch (error) {
      return {
        data: null,
        validation,
        success: false,
        error: error instanceof Error ? error.message : String(error),
      }
    }
  }

  /**
   * Create emotional context with validation
   */
  async createEmotionalContext(
    memoryId: string,
    contextData: DatabaseEmotionalContextInput,
  ): Promise<DatabaseOperationResult<PrismaEmotionalContext>> {
    const validation = validateDatabaseEmotionalContextInput(contextData)

    if (!validation.isValid) {
      return {
        data: null,
        validation,
        success: false,
        error: `Emotional context validation failed: ${validation.errors.map((e) => e.message).join(', ')}`,
      }
    }

    try {
      const created = await this.prisma.emotionalContext.create({
        data: {
          id: contextData.id,
          memoryId,
          primaryMood: contextData.primaryMood,
          intensity: contextData.intensity,
          themes: JSON.stringify(contextData.themes),
          emotionalMarkers: JSON.stringify(contextData.emotionalMarkers),
          contextualEvents: JSON.stringify(contextData.contextualEvents),
          temporalPatterns: JSON.stringify(contextData.temporalPatterns),
        },
      })

      return {
        data: created,
        validation,
        success: true,
      }
    } catch (error) {
      return {
        data: null,
        validation,
        success: false,
        error: error instanceof Error ? error.message : String(error),
      }
    }
  }

  /**
   * Create relationship dynamics with validation
   */
  async createRelationshipDynamics(
    memoryId: string,
    dynamicsData: DatabaseRelationshipDynamicsInput,
  ): Promise<DatabaseOperationResult<PrismaRelationshipDynamics>> {
    const validation = validateDatabaseRelationshipDynamicsInput(dynamicsData)

    if (!validation.isValid) {
      return {
        data: null,
        validation,
        success: false,
        error: `Relationship dynamics validation failed: ${validation.errors.map((e) => e.message).join(', ')}`,
      }
    }

    try {
      const created = await this.prisma.relationshipDynamics.create({
        data: {
          id: dynamicsData.id,
          memoryId,
          overallDynamics: JSON.stringify(dynamicsData.overallDynamics),
          participantDynamics: JSON.stringify(dynamicsData.participantDynamics),
          communicationPatterns: JSON.stringify(
            dynamicsData.communicationPatterns,
          ),
          interactionQuality: JSON.stringify(dynamicsData.interactionQuality),
        },
      })

      return {
        data: created,
        validation,
        success: true,
      }
    } catch (error) {
      return {
        data: null,
        validation,
        success: false,
        error: error instanceof Error ? error.message : String(error),
      }
    }
  }

  /**
   * Find memory by ID with validated return type
   */
  async findMemoryById(id: string): Promise<PrismaMemory | null> {
    return this.prisma.memory.findUnique({
      where: { id },
      include: {
        messages: true,
        emotionalContext: true,
        relationshipDynamics: true,
        validationStatus: true,
        qualityMetrics: true,
      },
    })
  }

  /**
   * Update memory with validation
   */
  async updateMemory(
    id: string,
    memoryData: Partial<DatabaseMemoryInput>,
  ): Promise<DatabaseOperationResult<PrismaMemory>> {
    // For partial updates, only validate provided fields
    const validation = validateDatabaseMemoryInput({ id, ...memoryData })

    if (!validation.isValid) {
      return {
        data: null,
        validation,
        success: false,
        error: `Memory update validation failed: ${validation.errors.map((e) => e.message).join(', ')}`,
      }
    }

    try {
      const updateData: Record<string, unknown> = {}
      if (memoryData.sourceMessageIds)
        updateData.sourceMessageIds = JSON.stringify(
          memoryData.sourceMessageIds,
        )
      if (memoryData.participants)
        updateData.participants = JSON.stringify(memoryData.participants)
      if (memoryData.summary) updateData.summary = memoryData.summary
      if (memoryData.confidence) updateData.confidence = memoryData.confidence

      const updated = await this.prisma.memory.update({
        where: { id },
        data: updateData,
        include: {
          messages: true,
          emotionalContext: true,
          relationshipDynamics: true,
          validationStatus: true,
          qualityMetrics: true,
        },
      })

      return {
        data: updated,
        validation,
        success: true,
      }
    } catch (error) {
      return {
        data: null,
        validation,
        success: false,
        error: error instanceof Error ? error.message : String(error),
      }
    }
  }

  /**
   * Batch create memories with validation
   */
  async batchCreateMemories(
    memories: DatabaseMemoryInput[],
  ): Promise<DatabaseOperationResult<PrismaMemory[]>> {
    const validations = memories.map((memory) =>
      validateDatabaseMemoryInput(memory),
    )
    const hasErrors = validations.some((v) => !v.isValid)

    if (hasErrors) {
      const errors = validations
        .filter((v) => !v.isValid)
        .flatMap((v) => v.errors)

      return {
        data: null,
        validation: {
          isValid: false,
          errors,
          warnings: [],
        },
        success: false,
        error: `Batch validation failed: ${errors.map((e) => e.message).join(', ')}`,
      }
    }

    try {
      const created = await this.prisma.$transaction(
        memories.map((memory) =>
          this.prisma.memory.create({
            data: {
              id: memory.id,
              sourceMessageIds: JSON.stringify(memory.sourceMessageIds),
              participants: JSON.stringify(memory.participants),
              summary: memory.summary,
              confidence: memory.confidence,
              contentHash: memory.contentHash,
              deduplicationMetadata: memory.deduplicationMetadata,
              extractedAt: memory.extractedAt ?? new Date(),
            },
          }),
        ),
      )

      return {
        data: created,
        validation: { isValid: true, errors: [], warnings: [] },
        success: true,
      }
    } catch (error) {
      return {
        data: null,
        validation: { isValid: true, errors: [], warnings: [] },
        success: false,
        error: error instanceof Error ? error.message : String(error),
      }
    }
  }

  /**
   * Find memory by content hash for deduplication
   */
  async findMemoryByHash(
    contentHash: string,
  ): Promise<DatabaseOperationResult<PrismaMemory | null>> {
    try {
      const memory = await this.prisma.memory.findUnique({
        where: { contentHash },
        include: {
          messages: true,
          emotionalContext: true,
          relationshipDynamics: true,
          validationStatus: true,
          qualityMetrics: true,
        },
      })

      return {
        data: memory,
        validation: { isValid: true, errors: [], warnings: [] },
        success: true,
      }
    } catch (error) {
      return {
        data: null,
        validation: { isValid: true, errors: [], warnings: [] },
        success: false,
        error: error instanceof Error ? error.message : String(error),
      }
    }
  }

  /**
   * Get all memories for deduplication comparison
   */
  async getAllMemoriesForDeduplication(): Promise<
    DatabaseOperationResult<
      Array<{
        id: string
        summary: string
        participants: string
        sourceMessageIds: string
        confidence: number
        contentHash: string
      }>
    >
  > {
    try {
      const memories = await this.prisma.memory.findMany({
        select: {
          id: true,
          summary: true,
          participants: true,
          sourceMessageIds: true,
          confidence: true,
          contentHash: true,
        },
      })

      return {
        data: memories,
        validation: { isValid: true, errors: [], warnings: [] },
        success: true,
      }
    } catch (error) {
      return {
        data: null,
        validation: { isValid: true, errors: [], warnings: [] },
        success: false,
        error: error instanceof Error ? error.message : String(error),
      }
    }
  }

  /**
   * Create memory with deduplication check
   */
  async createMemoryWithDeduplication(
    memoryData: DatabaseMemoryInput,
  ): Promise<DatabaseOperationResult<PrismaMemory>> {
    const existingCheck = await this.findMemoryByHash(memoryData.contentHash)

    if (existingCheck.success && existingCheck.data) {
      return {
        data: existingCheck.data,
        validation: { isValid: true, errors: [], warnings: [] },
        success: true,
        error: 'Memory with this content hash already exists',
      }
    }

    return this.createMemory(memoryData)
  }
}

/**
 * Create a new MemoryDatabase instance
 */
export function createMemoryDatabase(prisma: PrismaClient): MemoryDatabase {
  return new MemoryDatabase(prisma)
}

/**
 * Utility functions for database validation
 */
export function validateMemoryForDatabase(data: unknown): ValidationResult {
  return validateDatabaseMemoryInput(data)
}

export function validateEmotionalContextForDatabase(
  data: unknown,
): ValidationResult {
  return validateDatabaseEmotionalContextInput(data)
}

export function validateRelationshipDynamicsForDatabase(
  data: unknown,
): ValidationResult {
  return validateDatabaseRelationshipDynamicsInput(data)
}

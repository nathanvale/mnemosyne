import type {
  MemoryCluster,
  ClusterMembership,
  PatternAnalysis,
  ClusterQualityMetrics,
  Memory,
  Prisma,
} from '../generated/index.js'

import { PrismaClient } from '../generated/index.js'

export interface ClusteringOperations {
  // Memory Cluster operations
  createCluster(data: CreateClusterInput): Promise<MemoryCluster>
  getCluster(clusterId: string): Promise<MemoryCluster | null>
  getClusterWithRelations(
    clusterId: string,
  ): Promise<ClusterWithRelations | null>
  updateCluster(
    clusterId: string,
    data: UpdateClusterInput,
  ): Promise<MemoryCluster>
  deleteCluster(clusterId: string): Promise<void>
  listClusters(filters?: ClusterFilters): Promise<MemoryCluster[]>

  // Cluster Membership operations
  addMemoryToCluster(data: CreateMembershipInput): Promise<ClusterMembership>
  removeMemoryFromCluster(clusterId: string, memoryId: string): Promise<void>
  getClusterMemberships(clusterId: string): Promise<ClusterMembership[]>
  getMemoryMemberships(memoryId: string): Promise<ClusterMembership[]>
  updateMembershipStrength(
    clusterId: string,
    memoryId: string,
    strength: number,
    contributionScore: number,
  ): Promise<ClusterMembership>

  // Pattern Analysis operations
  createPatternAnalysis(data: CreatePatternInput): Promise<PatternAnalysis>
  getPatternAnalysis(patternId: string): Promise<PatternAnalysis | null>
  getClusterPatterns(clusterId: string): Promise<PatternAnalysis[]>
  updatePatternAnalysis(
    patternId: string,
    data: UpdatePatternInput,
  ): Promise<PatternAnalysis>
  deletePatternAnalysis(patternId: string): Promise<void>

  // Quality Metrics operations
  createQualityMetrics(
    data: CreateQualityMetricsInput,
  ): Promise<ClusterQualityMetrics>
  getQualityMetrics(clusterId: string): Promise<ClusterQualityMetrics | null>
  updateQualityMetrics(
    clusterId: string,
    data: UpdateQualityMetricsInput,
  ): Promise<ClusterQualityMetrics>

  // Utility operations
  getMemoriesEligibleForClustering(filters?: MemoryFilters): Promise<Memory[]>
  updateMemoryClusteringMetadata(
    memoryId: string,
    metadata: ClusteringMetadata,
  ): Promise<Memory>
  getClusterStatistics(): Promise<ClusteringStatistics>
}

// Input Types
export interface CreateClusterInput {
  clusterId: string
  clusterTheme: string
  emotionalTone: string
  coherenceScore: number
  psychologicalSignificance: number
  participantPatterns: ParticipantPattern[]
  clusterMetadata: ClusterMetadata
  memoryCount?: number
}

export interface UpdateClusterInput {
  clusterTheme?: string
  emotionalTone?: string
  coherenceScore?: number
  psychologicalSignificance?: number
  participantPatterns?: ParticipantPattern[]
  clusterMetadata?: ClusterMetadata
  memoryCount?: number
  lastAnalyzedAt?: Date
}

export interface CreateMembershipInput {
  clusterId: string
  memoryId: string
  membershipStrength: number
  contributionScore: number
}

export interface CreatePatternInput {
  patternId: string
  clusterId: string
  patternType: PatternType
  description: string
  frequency: number
  strength: number
  confidenceLevel: number
  psychologicalIndicators: string[]
  emotionalCharacteristics: string[]
}

export interface UpdatePatternInput {
  description?: string
  frequency?: number
  strength?: number
  confidenceLevel?: number
  psychologicalIndicators?: string[]
  emotionalCharacteristics?: string[]
}

export interface CreateQualityMetricsInput {
  clusterId: string
  overallCoherence: number
  emotionalConsistency: number
  thematicUnity: number
  psychologicalMeaningfulness: number
  incoherentMemoryCount?: number
  strengthAreas: string[]
  improvementAreas: string[]
  confidenceLevel: number
}

export interface UpdateQualityMetricsInput {
  overallCoherence?: number
  emotionalConsistency?: number
  thematicUnity?: number
  psychologicalMeaningfulness?: number
  incoherentMemoryCount?: number
  strengthAreas?: string[]
  improvementAreas?: string[]
  confidenceLevel?: number
}

// Data Types
export interface ParticipantPattern {
  participantId: string
  pattern: string
  frequency?: number
  strength?: number
}

export interface ClusterMetadata {
  algorithmVersion: string
  creationMethod: string
  similarityThreshold?: number
  lastOptimized?: Date
  optimizationRounds?: number
  [key: string]: unknown
}

export interface ClusteringMetadata {
  lastProcessed: Date
  algorithmVersion: string
  clusterParticipation: Array<{
    clusterId: string
    membershipStrength: number
    joinedAt: Date
  }>
  eligibilityScore?: number
  processingNotes?: string[]
}

export type PatternType =
  | 'emotional_theme'
  | 'coping_style'
  | 'relationship_dynamic'
  | 'psychological_tendency'

export interface ClusterWithRelations extends MemoryCluster {
  memberships: Array<ClusterMembership & { memory: Memory }>
  patternAnalyses: PatternAnalysis[]
  qualityMetrics: ClusterQualityMetrics | null
}

// Filter Types
export interface ClusterFilters {
  minCoherenceScore?: number
  maxCoherenceScore?: number
  minPsychologicalSignificance?: number
  emotionalTone?: string[]
  themes?: string[]
  minMemoryCount?: number
  maxMemoryCount?: number
  createdAfter?: Date
  createdBefore?: Date
  lastAnalyzedAfter?: Date
  limit?: number
  offset?: number
  orderBy?:
    | 'coherenceScore'
    | 'psychologicalSignificance'
    | 'memoryCount'
    | 'createdAt'
    | 'updatedAt'
  orderDirection?: 'asc' | 'desc'
}

export interface MemoryFilters {
  minConfidence?: number
  extractedAfter?: Date
  extractedBefore?: Date
  notInAnyCluster?: boolean
  clusterParticipationCount?: number
  limit?: number
  offset?: number
}

export interface ClusteringStatistics {
  totalClusters: number
  totalMemberships: number
  totalPatterns: number
  averageCoherenceScore: number
  averagePsychologicalSignificance: number
  averageClusterSize: number
  memoriesWithoutClusters: number
  totalMemoriesProcessed: number
  clusteringCoverage: number // percentage of memories in clusters
  patternDistribution: Record<PatternType, number>
  emotionalToneDistribution: Record<string, number>
}

// Validation Functions
export function validateClusterInput(
  data: CreateClusterInput,
): ClusterValidationResult {
  const errors: string[] = []

  if (data.coherenceScore < 0.6) {
    errors.push('Coherence score must be at least 0.6')
  }
  if (data.coherenceScore > 1.0) {
    errors.push('Coherence score must not exceed 1.0')
  }
  if (data.psychologicalSignificance <= 0.0) {
    errors.push('Psychological significance must be greater than 0.0')
  }
  if (data.psychologicalSignificance > 1.0) {
    errors.push('Psychological significance must not exceed 1.0')
  }
  if (!data.clusterId.trim()) {
    errors.push('Cluster ID is required')
  }
  if (!data.clusterTheme.trim()) {
    errors.push('Cluster theme is required')
  }
  if (!data.emotionalTone.trim()) {
    errors.push('Emotional tone is required')
  }

  return {
    isValid: errors.length === 0,
    errors,
  }
}

export function validateMembershipInput(
  data: CreateMembershipInput,
): ClusterValidationResult {
  const errors: string[] = []

  if (data.membershipStrength < 0.5) {
    errors.push('Membership strength must be at least 0.5')
  }
  if (data.membershipStrength > 1.0) {
    errors.push('Membership strength must not exceed 1.0')
  }
  if (data.contributionScore < 0.0 || data.contributionScore > 1.0) {
    errors.push('Contribution score must be between 0.0 and 1.0')
  }
  if (!data.clusterId.trim()) {
    errors.push('Cluster ID is required')
  }
  if (!data.memoryId.trim()) {
    errors.push('Memory ID is required')
  }

  return {
    isValid: errors.length === 0,
    errors,
  }
}

export function validatePatternInput(
  data: CreatePatternInput,
): ClusterValidationResult {
  const errors: string[] = []
  const validPatternTypes: PatternType[] = [
    'emotional_theme',
    'coping_style',
    'relationship_dynamic',
    'psychological_tendency',
  ]

  if (!validPatternTypes.includes(data.patternType)) {
    errors.push(`Pattern type must be one of: ${validPatternTypes.join(', ')}`)
  }
  if (data.confidenceLevel < 0.8) {
    errors.push('Confidence level must be at least 0.8')
  }
  if (data.confidenceLevel > 1.0) {
    errors.push('Confidence level must not exceed 1.0')
  }
  if (data.strength < 0.3) {
    errors.push('Strength must be at least 0.3')
  }
  if (data.strength > 1.0) {
    errors.push('Strength must not exceed 1.0')
  }
  if (data.frequency <= 0) {
    errors.push('Frequency must be greater than 0')
  }
  if (!data.patternId.trim()) {
    errors.push('Pattern ID is required')
  }
  if (!data.description.trim()) {
    errors.push('Description is required')
  }

  return {
    isValid: errors.length === 0,
    errors,
  }
}

export function validateQualityMetricsInput(
  data: CreateQualityMetricsInput,
): ClusterValidationResult {
  const errors: string[] = []

  if (data.overallCoherence < 0.6) {
    errors.push('Overall coherence must be at least 0.6')
  }
  if (data.overallCoherence > 1.0) {
    errors.push('Overall coherence must not exceed 1.0')
  }
  if (data.psychologicalMeaningfulness < 0.7) {
    errors.push('Psychological meaningfulness must be at least 0.7')
  }
  if (data.psychologicalMeaningfulness > 1.0) {
    errors.push('Psychological meaningfulness must not exceed 1.0')
  }
  if (data.emotionalConsistency < 0.0 || data.emotionalConsistency > 1.0) {
    errors.push('Emotional consistency must be between 0.0 and 1.0')
  }
  if (data.thematicUnity < 0.0 || data.thematicUnity > 1.0) {
    errors.push('Thematic unity must be between 0.0 and 1.0')
  }
  if (data.confidenceLevel < 0.0 || data.confidenceLevel > 1.0) {
    errors.push('Confidence level must be between 0.0 and 1.0')
  }
  if (data.incoherentMemoryCount && data.incoherentMemoryCount < 0) {
    errors.push('Incoherent memory count must not be negative')
  }

  return {
    isValid: errors.length === 0,
    errors,
  }
}

export interface ClusterValidationResult {
  isValid: boolean
  errors: string[]
}

// Implementation
export class PrismaClusteringOperations implements ClusteringOperations {
  constructor(private prisma: PrismaClient) {}

  async createCluster(data: CreateClusterInput): Promise<MemoryCluster> {
    const validation = validateClusterInput(data)
    if (!validation.isValid) {
      throw new Error(`Invalid cluster data: ${validation.errors.join(', ')}`)
    }

    return this.prisma.memoryCluster.create({
      data: {
        clusterId: data.clusterId,
        clusterTheme: data.clusterTheme,
        emotionalTone: data.emotionalTone,
        coherenceScore: data.coherenceScore,
        psychologicalSignificance: data.psychologicalSignificance,
        participantPatterns: JSON.stringify(data.participantPatterns),
        clusterMetadata: JSON.stringify(data.clusterMetadata),
        memoryCount: data.memoryCount || 0,
      },
    })
  }

  async getCluster(clusterId: string): Promise<MemoryCluster | null> {
    return this.prisma.memoryCluster.findUnique({
      where: { clusterId },
    })
  }

  async getClusterWithRelations(
    clusterId: string,
  ): Promise<ClusterWithRelations | null> {
    return this.prisma.memoryCluster.findUnique({
      where: { clusterId },
      include: {
        memberships: {
          include: {
            memory: true,
          },
        },
        patternAnalyses: true,
        qualityMetrics: true,
      },
    }) as Promise<ClusterWithRelations | null>
  }

  async updateCluster(
    clusterId: string,
    data: UpdateClusterInput,
  ): Promise<MemoryCluster> {
    const updateData: Prisma.MemoryClusterUpdateInput = {}

    if (data.clusterTheme !== undefined)
      updateData.clusterTheme = data.clusterTheme
    if (data.emotionalTone !== undefined)
      updateData.emotionalTone = data.emotionalTone
    if (data.coherenceScore !== undefined) {
      if (data.coherenceScore < 0.6) {
        throw new Error('Coherence score must be at least 0.6')
      }
      updateData.coherenceScore = data.coherenceScore
    }
    if (data.psychologicalSignificance !== undefined) {
      if (data.psychologicalSignificance <= 0.0) {
        throw new Error('Psychological significance must be greater than 0.0')
      }
      updateData.psychologicalSignificance = data.psychologicalSignificance
    }
    if (data.participantPatterns !== undefined) {
      updateData.participantPatterns = JSON.stringify(data.participantPatterns)
    }
    if (data.clusterMetadata !== undefined) {
      updateData.clusterMetadata = JSON.stringify(data.clusterMetadata)
    }
    if (data.memoryCount !== undefined)
      updateData.memoryCount = data.memoryCount
    if (data.lastAnalyzedAt !== undefined)
      updateData.lastAnalyzedAt = data.lastAnalyzedAt

    return this.prisma.memoryCluster.update({
      where: { clusterId },
      data: updateData,
    })
  }

  async deleteCluster(clusterId: string): Promise<void> {
    await this.prisma.memoryCluster.delete({
      where: { clusterId },
    })
  }

  async listClusters(filters: ClusterFilters = {}): Promise<MemoryCluster[]> {
    const where: Prisma.MemoryClusterWhereInput = {}

    if (filters.minCoherenceScore !== undefined) {
      where.coherenceScore = { gte: filters.minCoherenceScore }
    }
    if (filters.maxCoherenceScore !== undefined) {
      if (where.coherenceScore && typeof where.coherenceScore === 'object') {
        where.coherenceScore = {
          ...where.coherenceScore,
          lte: filters.maxCoherenceScore,
        }
      } else {
        where.coherenceScore = { lte: filters.maxCoherenceScore }
      }
    }
    if (filters.minPsychologicalSignificance !== undefined) {
      where.psychologicalSignificance = {
        gte: filters.minPsychologicalSignificance,
      }
    }
    if (filters.emotionalTone && filters.emotionalTone.length > 0) {
      where.emotionalTone = { in: filters.emotionalTone }
    }
    if (filters.themes && filters.themes.length > 0) {
      where.clusterTheme = { in: filters.themes }
    }
    if (filters.minMemoryCount !== undefined) {
      where.memoryCount = { gte: filters.minMemoryCount }
    }
    if (filters.maxMemoryCount !== undefined) {
      if (where.memoryCount && typeof where.memoryCount === 'object') {
        where.memoryCount = {
          ...where.memoryCount,
          lte: filters.maxMemoryCount,
        }
      } else {
        where.memoryCount = { lte: filters.maxMemoryCount }
      }
    }
    if (filters.createdAfter) {
      where.createdAt = { gte: filters.createdAfter }
    }
    if (filters.createdBefore) {
      if (where.createdAt && typeof where.createdAt === 'object') {
        where.createdAt = { ...where.createdAt, lte: filters.createdBefore }
      } else {
        where.createdAt = { lte: filters.createdBefore }
      }
    }
    if (filters.lastAnalyzedAfter) {
      where.lastAnalyzedAt = { gte: filters.lastAnalyzedAfter }
    }

    const orderBy: Prisma.MemoryClusterOrderByWithRelationInput = {}
    if (filters.orderBy) {
      orderBy[filters.orderBy] = filters.orderDirection || 'desc'
    }

    return this.prisma.memoryCluster.findMany({
      where,
      orderBy:
        Object.keys(orderBy).length > 0 ? orderBy : { createdAt: 'desc' },
      take: filters.limit,
      skip: filters.offset,
    })
  }

  async addMemoryToCluster(
    data: CreateMembershipInput,
  ): Promise<ClusterMembership> {
    const validation = validateMembershipInput(data)
    if (!validation.isValid) {
      throw new Error(
        `Invalid membership data: ${validation.errors.join(', ')}`,
      )
    }

    // The database trigger will automatically update memoryCount
    return this.prisma.clusterMembership.create({
      data: {
        clusterId: data.clusterId,
        memoryId: data.memoryId,
        membershipStrength: data.membershipStrength,
        contributionScore: data.contributionScore,
      },
    })
  }

  async removeMemoryFromCluster(
    clusterId: string,
    memoryId: string,
  ): Promise<void> {
    // The database trigger will automatically update memoryCount
    await this.prisma.clusterMembership.delete({
      where: {
        clusterId_memoryId: {
          clusterId,
          memoryId,
        },
      },
    })
  }

  async getClusterMemberships(clusterId: string): Promise<ClusterMembership[]> {
    return this.prisma.clusterMembership.findMany({
      where: { clusterId },
      include: {
        memory: true,
      },
    })
  }

  async getMemoryMemberships(memoryId: string): Promise<ClusterMembership[]> {
    return this.prisma.clusterMembership.findMany({
      where: { memoryId },
      include: {
        cluster: true,
      },
    })
  }

  async updateMembershipStrength(
    clusterId: string,
    memoryId: string,
    strength: number,
    contributionScore: number,
  ): Promise<ClusterMembership> {
    if (strength < 0.5 || strength > 1.0) {
      throw new Error('Membership strength must be between 0.5 and 1.0')
    }
    if (contributionScore < 0.0 || contributionScore > 1.0) {
      throw new Error('Contribution score must be between 0.0 and 1.0')
    }

    return this.prisma.clusterMembership.update({
      where: {
        clusterId_memoryId: {
          clusterId,
          memoryId,
        },
      },
      data: {
        membershipStrength: strength,
        contributionScore,
      },
    })
  }

  async createPatternAnalysis(
    data: CreatePatternInput,
  ): Promise<PatternAnalysis> {
    const validation = validatePatternInput(data)
    if (!validation.isValid) {
      throw new Error(`Invalid pattern data: ${validation.errors.join(', ')}`)
    }

    return this.prisma.patternAnalysis.create({
      data: {
        patternId: data.patternId,
        clusterId: data.clusterId,
        patternType: data.patternType,
        description: data.description,
        frequency: data.frequency,
        strength: data.strength,
        confidenceLevel: data.confidenceLevel,
        psychologicalIndicators: JSON.stringify(data.psychologicalIndicators),
        emotionalCharacteristics: JSON.stringify(data.emotionalCharacteristics),
      },
    })
  }

  async getPatternAnalysis(patternId: string): Promise<PatternAnalysis | null> {
    return this.prisma.patternAnalysis.findUnique({
      where: { patternId },
    })
  }

  async getClusterPatterns(clusterId: string): Promise<PatternAnalysis[]> {
    return this.prisma.patternAnalysis.findMany({
      where: { clusterId },
      orderBy: { confidenceLevel: 'desc' },
    })
  }

  async updatePatternAnalysis(
    patternId: string,
    data: UpdatePatternInput,
  ): Promise<PatternAnalysis> {
    const updateData: Prisma.PatternAnalysisUpdateInput = {}

    if (data.description !== undefined)
      updateData.description = data.description
    if (data.frequency !== undefined) {
      if (data.frequency <= 0) {
        throw new Error('Frequency must be greater than 0')
      }
      updateData.frequency = data.frequency
    }
    if (data.strength !== undefined) {
      if (data.strength < 0.3 || data.strength > 1.0) {
        throw new Error('Strength must be between 0.3 and 1.0')
      }
      updateData.strength = data.strength
    }
    if (data.confidenceLevel !== undefined) {
      if (data.confidenceLevel < 0.8 || data.confidenceLevel > 1.0) {
        throw new Error('Confidence level must be between 0.8 and 1.0')
      }
      updateData.confidenceLevel = data.confidenceLevel
    }
    if (data.psychologicalIndicators !== undefined) {
      updateData.psychologicalIndicators = JSON.stringify(
        data.psychologicalIndicators,
      )
    }
    if (data.emotionalCharacteristics !== undefined) {
      updateData.emotionalCharacteristics = JSON.stringify(
        data.emotionalCharacteristics,
      )
    }

    return this.prisma.patternAnalysis.update({
      where: { patternId },
      data: updateData,
    })
  }

  async deletePatternAnalysis(patternId: string): Promise<void> {
    await this.prisma.patternAnalysis.delete({
      where: { patternId },
    })
  }

  async createQualityMetrics(
    data: CreateQualityMetricsInput,
  ): Promise<ClusterQualityMetrics> {
    const validation = validateQualityMetricsInput(data)
    if (!validation.isValid) {
      throw new Error(
        `Invalid quality metrics data: ${validation.errors.join(', ')}`,
      )
    }

    return this.prisma.clusterQualityMetrics.create({
      data: {
        clusterId: data.clusterId,
        overallCoherence: data.overallCoherence,
        emotionalConsistency: data.emotionalConsistency,
        thematicUnity: data.thematicUnity,
        psychologicalMeaningfulness: data.psychologicalMeaningfulness,
        incoherentMemoryCount: data.incoherentMemoryCount || 0,
        strengthAreas: JSON.stringify(data.strengthAreas),
        improvementAreas: JSON.stringify(data.improvementAreas),
        confidenceLevel: data.confidenceLevel,
      },
    })
  }

  async getQualityMetrics(
    clusterId: string,
  ): Promise<ClusterQualityMetrics | null> {
    return this.prisma.clusterQualityMetrics.findUnique({
      where: { clusterId },
    })
  }

  async updateQualityMetrics(
    clusterId: string,
    data: UpdateQualityMetricsInput,
  ): Promise<ClusterQualityMetrics> {
    const updateData: Prisma.ClusterQualityMetricsUpdateInput = {}

    if (data.overallCoherence !== undefined) {
      if (data.overallCoherence < 0.6 || data.overallCoherence > 1.0) {
        throw new Error('Overall coherence must be between 0.6 and 1.0')
      }
      updateData.overallCoherence = data.overallCoherence
    }
    if (data.emotionalConsistency !== undefined)
      updateData.emotionalConsistency = data.emotionalConsistency
    if (data.thematicUnity !== undefined)
      updateData.thematicUnity = data.thematicUnity
    if (data.psychologicalMeaningfulness !== undefined) {
      if (
        data.psychologicalMeaningfulness < 0.7 ||
        data.psychologicalMeaningfulness > 1.0
      ) {
        throw new Error(
          'Psychological meaningfulness must be between 0.7 and 1.0',
        )
      }
      updateData.psychologicalMeaningfulness = data.psychologicalMeaningfulness
    }
    if (data.incoherentMemoryCount !== undefined)
      updateData.incoherentMemoryCount = data.incoherentMemoryCount
    if (data.strengthAreas !== undefined)
      updateData.strengthAreas = JSON.stringify(data.strengthAreas)
    if (data.improvementAreas !== undefined)
      updateData.improvementAreas = JSON.stringify(data.improvementAreas)
    if (data.confidenceLevel !== undefined)
      updateData.confidenceLevel = data.confidenceLevel

    return this.prisma.clusterQualityMetrics.update({
      where: { clusterId },
      data: updateData,
    })
  }

  async getMemoriesEligibleForClustering(
    filters: MemoryFilters = {},
  ): Promise<Memory[]> {
    const where: Prisma.MemoryWhereInput = {}

    if (filters.minConfidence !== undefined) {
      where.confidence = { gte: filters.minConfidence }
    }
    if (filters.extractedAfter) {
      where.extractedAt = { gte: filters.extractedAfter }
    }
    if (filters.extractedBefore) {
      if (where.extractedAt && typeof where.extractedAt === 'object') {
        where.extractedAt = {
          ...where.extractedAt,
          lte: filters.extractedBefore,
        }
      } else {
        where.extractedAt = { lte: filters.extractedBefore }
      }
    }
    if (filters.notInAnyCluster === true) {
      where.clusterMemberships = { none: {} }
    }
    if (filters.clusterParticipationCount !== undefined) {
      where.clusterParticipationCount = filters.clusterParticipationCount
    }

    return this.prisma.memory.findMany({
      where,
      orderBy: { extractedAt: 'desc' },
      take: filters.limit,
      skip: filters.offset,
    })
  }

  async updateMemoryClusteringMetadata(
    memoryId: string,
    metadata: ClusteringMetadata,
  ): Promise<Memory> {
    return this.prisma.memory.update({
      where: { id: memoryId },
      data: {
        clusteringMetadata: JSON.stringify(metadata),
        lastClusteredAt: metadata.lastProcessed,
        clusterParticipationCount: metadata.clusterParticipation.length,
      },
    })
  }

  async getClusterStatistics(): Promise<ClusteringStatistics> {
    const [
      totalClusters,
      totalMemberships,
      totalPatterns,
      totalMemories,
      memoriesWithoutClusters,
      clusterStats,
      patternTypes,
      emotionalTones,
    ] = await Promise.all([
      this.prisma.memoryCluster.count(),
      this.prisma.clusterMembership.count(),
      this.prisma.patternAnalysis.count(),
      this.prisma.memory.count(),
      this.prisma.memory.count({ where: { clusterMemberships: { none: {} } } }),
      this.prisma.memoryCluster.aggregate({
        _avg: {
          coherenceScore: true,
          psychologicalSignificance: true,
          memoryCount: true,
        },
      }),
      this.prisma.patternAnalysis.groupBy({
        by: ['patternType'],
        _count: { patternType: true },
      }),
      this.prisma.memoryCluster.groupBy({
        by: ['emotionalTone'],
        _count: { emotionalTone: true },
      }),
    ])

    const patternDistribution: Record<PatternType, number> = {
      emotional_theme: 0,
      coping_style: 0,
      relationship_dynamic: 0,
      psychological_tendency: 0,
    }

    patternTypes.forEach((item: unknown) => {
      const typedItem = item as {
        patternType: PatternType
        _count: { patternType: number }
      }
      patternDistribution[typedItem.patternType] = typedItem._count.patternType
    })

    const emotionalToneDistribution: Record<string, number> = {}
    emotionalTones.forEach((item: unknown) => {
      const typedItem = item as {
        emotionalTone: string
        _count: { emotionalTone: number }
      }
      emotionalToneDistribution[typedItem.emotionalTone] =
        typedItem._count.emotionalTone
    })

    return {
      totalClusters,
      totalMemberships,
      totalPatterns,
      averageCoherenceScore: clusterStats._avg.coherenceScore || 0,
      averagePsychologicalSignificance:
        clusterStats._avg.psychologicalSignificance || 0,
      averageClusterSize: clusterStats._avg.memoryCount || 0,
      memoriesWithoutClusters,
      totalMemoriesProcessed: totalMemories,
      clusteringCoverage:
        totalMemories > 0
          ? ((totalMemories - memoriesWithoutClusters) / totalMemories) * 100
          : 0,
      patternDistribution,
      emotionalToneDistribution,
    }
  }
}

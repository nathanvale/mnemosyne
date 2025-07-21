import type { Memory } from '@studio/schema'

import { createLogger } from '@studio/logger'

import type {
  IntelligentSampler,
  CoverageRequirements,
  SampledMemories,
  CoverageAnalysis,
  MemoryDataset,
  SamplingStrategy,
} from '../types'

import { DEFAULT_SAMPLING_STRATEGY } from '../config/defaults'
import { CoverageAnalyzer } from './coverage-analyzer'

const logger = createLogger({ tags: ['validation:sampling'] })

/**
 * Implementation of intelligent sampling for memory validation
 */
class IntelligentSamplerImpl implements IntelligentSampler {
  private coverageAnalyzer: CoverageAnalyzer

  constructor() {
    this.coverageAnalyzer = new CoverageAnalyzer()
  }

  /**
   * Sample memories for validation based on coverage requirements
   */
  sampleForValidation(
    memories: Memory[],
    coverage: CoverageRequirements,
  ): SampledMemories {
    logger.info('Starting intelligent sampling', {
      totalMemories: memories.length,
      requirements: coverage,
    })

    // Use default strategy if not specified
    const strategy = DEFAULT_SAMPLING_STRATEGY

    // Perform stratified sampling
    const samples = this.performStratifiedSampling(memories, strategy, coverage)

    // Analyze coverage of the sample
    const sampleWithMetadata: SampledMemories = {
      samples,
      coverage: {} as CoverageAnalysis, // Will be filled next
      metadata: {
        populationSize: memories.length,
        sampleSize: samples.length,
        samplingRate: samples.length / memories.length,
        strategy: strategy.name,
        seed: strategy.parameters.random?.seed,
      },
    }

    // Calculate coverage
    const coverageAnalysis =
      this.coverageAnalyzer.analyzeCoverage(sampleWithMetadata)
    coverageAnalysis.overallScore =
      this.coverageAnalyzer.calculateOverallScore(coverageAnalysis)
    sampleWithMetadata.coverage = coverageAnalysis

    logger.info('Sampling complete', {
      sampleSize: samples.length,
      samplingRate: sampleWithMetadata.metadata.samplingRate,
      overallCoverage: coverageAnalysis.overallScore,
    })

    return sampleWithMetadata
  }

  /**
   * Ensure representative coverage in a sample
   */
  ensureRepresentativeCoverage(sample: SampledMemories): CoverageAnalysis {
    logger.debug('Ensuring representative coverage', {
      sampleSize: sample.samples.length,
    })

    // Re-analyze coverage
    const analysis = this.coverageAnalyzer.analyzeCoverage(sample)
    analysis.overallScore =
      this.coverageAnalyzer.calculateOverallScore(analysis)

    // If coverage is insufficient, recommend adjustments
    if (analysis.overallScore < 0.7) {
      logger.warn('Coverage below threshold', {
        overallScore: analysis.overallScore,
        gaps: {
          emotional: analysis.emotionalCoverage.gaps,
          temporal: analysis.temporalCoverage.gaps,
          participants: analysis.participantCoverage.missingParticipants,
        },
      })
    }

    return analysis
  }

  /**
   * Optimize validation efficiency for a dataset
   */
  optimizeValidationEfficiency(dataset: MemoryDataset): SamplingStrategy {
    logger.info('Optimizing sampling strategy', {
      datasetSize: dataset.memories.length,
      dateRange: dataset.metadata.dateRange,
    })

    const { memories, metadata } = dataset

    // Analyze dataset characteristics
    const characteristics = this.analyzeDatasetCharacteristics(
      memories,
      metadata,
    )

    // Select optimal strategy based on characteristics
    const strategy = this.selectOptimalStrategy(characteristics)

    logger.info('Strategy optimization complete', {
      selectedStrategy: strategy.name,
      expectedCoverage: strategy.expectedCharacteristics.expectedCoverage,
    })

    return strategy
  }

  /**
   * Perform stratified sampling based on strategy
   */
  private performStratifiedSampling(
    memories: Memory[],
    strategy: SamplingStrategy,
    coverage: CoverageRequirements,
  ): Memory[] {
    const { parameters } = strategy
    const targetSize = Math.min(parameters.targetSize, memories.length)

    if (!parameters.stratification) {
      // Simple random sampling
      return this.performRandomSampling(
        memories,
        targetSize,
        parameters.random?.seed,
      )
    }

    const strata = this.createStrata(memories, parameters.stratification)
    const samples: Memory[] = []

    // Calculate sample sizes for each stratum
    const stratumSizes = this.calculateStratumSizes(strata, targetSize)

    // Sample from each stratum
    for (const [stratumKey, stratumMemories] of Object.entries(strata)) {
      const stratumSize = stratumSizes[stratumKey] || 0
      if (stratumSize > 0) {
        const stratumSample = this.performRandomSampling(
          stratumMemories,
          stratumSize,
          parameters.random?.seed,
        )
        samples.push(...stratumSample)
      }
    }

    // If we need more samples, fill with random selection
    const remaining = targetSize - samples.length
    if (remaining > 0) {
      const usedIds = new Set(samples.map((m) => m.id))
      const remainingMemories = memories.filter((m) => !usedIds.has(m.id))
      const additionalSamples = this.performRandomSampling(
        remainingMemories,
        remaining,
        parameters.random?.seed,
      )
      samples.push(...additionalSamples)
    }

    return samples.slice(0, targetSize)
  }

  /**
   * Create strata for stratified sampling
   */
  private createStrata(
    memories: Memory[],
    stratification: NonNullable<
      SamplingStrategy['parameters']['stratification']
    >,
  ): Record<string, Memory[]> {
    const strata: Record<string, Memory[]> = {}

    for (const memory of memories) {
      const stratumKey = this.getStratumKey(memory, stratification)
      if (!strata[stratumKey]) {
        strata[stratumKey] = []
      }
      strata[stratumKey].push(memory)
    }

    return strata
  }

  /**
   * Get stratum key for a memory
   */
  private getStratumKey(
    memory: Memory,
    stratification: NonNullable<
      SamplingStrategy['parameters']['stratification']
    >,
  ): string {
    const keyParts: string[] = []

    if (stratification.byEmotion) {
      const emotionalContext = memory.emotionalContext as any
      const emotion = emotionalContext?.primaryEmotion || 'unknown'
      keyParts.push(`emotion:${emotion}`)
    }

    if (stratification.byTimePeriod) {
      const date = new Date(memory.timestamp)
      const year = date.getFullYear()
      const month = date.getMonth()
      keyParts.push(`time:${year}-${month}`)
    }

    if (stratification.byParticipant) {
      const participantCount = memory.participants?.length || 0
      const bucket =
        participantCount <= 2
          ? 'small'
          : participantCount <= 5
            ? 'medium'
            : 'large'
      keyParts.push(`participants:${bucket}`)
    }

    if (stratification.byQuality) {
      const confidence = memory.metadata.confidence || 0.5
      const quality =
        confidence >= 0.8 ? 'high' : confidence >= 0.5 ? 'medium' : 'low'
      keyParts.push(`quality:${quality}`)
    }

    return keyParts.join('|') || 'default'
  }

  /**
   * Calculate sample sizes for each stratum
   */
  private calculateStratumSizes(
    strata: Record<string, Memory[]>,
    totalSize: number,
  ): Record<string, number> {
    const sizes: Record<string, number> = {}
    const totalMemories = Object.values(strata).reduce(
      (sum, memories) => sum + memories.length,
      0,
    )

    // Proportional allocation
    for (const [stratumKey, memories] of Object.entries(strata)) {
      const proportion = memories.length / totalMemories
      sizes[stratumKey] = Math.round(proportion * totalSize)
    }

    return sizes
  }

  /**
   * Perform simple random sampling
   */
  private performRandomSampling(
    memories: Memory[],
    sampleSize: number,
    seed?: number,
  ): Memory[] {
    if (sampleSize >= memories.length) {
      return [...memories]
    }

    // Use seeded random if provided for reproducibility
    const rng = this.createSeededRandom(seed)
    const shuffled = [...memories].sort(() => rng() - 0.5)

    return shuffled.slice(0, sampleSize)
  }

  /**
   * Create seeded random number generator
   */
  private createSeededRandom(seed?: number): () => number {
    if (seed === undefined) {
      return Math.random
    }

    // Simple LCG for reproducible randomness
    let state = seed
    return () => {
      state = (state * 9301 + 49297) % 233280
      return state / 233280
    }
  }

  /**
   * Analyze dataset characteristics
   */
  private analyzeDatasetCharacteristics(
    memories: Memory[],
    metadata: MemoryDataset['metadata'],
  ): DatasetCharacteristics {
    const emotionalDiversity = this.calculateEmotionalDiversity(memories)
    const temporalSpread = this.calculateTemporalSpread(memories)
    const qualityVariance = this.calculateQualityVariance(memories)
    const participantDistribution =
      this.calculateParticipantDistribution(memories)

    return {
      size: memories.length,
      emotionalDiversity,
      temporalSpread,
      qualityVariance,
      participantDistribution,
      uniqueParticipants: metadata.uniqueParticipants,
    }
  }

  /**
   * Calculate emotional diversity in dataset
   */
  private calculateEmotionalDiversity(memories: Memory[]): number {
    const emotions = new Set<string>()

    for (const memory of memories) {
      const emotionalContext = memory.emotionalContext as any
      if (emotionalContext?.primaryEmotion) {
        emotions.add(emotionalContext.primaryEmotion)
      }
    }

    // Normalize to 0-1 (assume 12 emotions for full diversity)
    return Math.min(1, emotions.size / 12)
  }

  /**
   * Calculate temporal spread
   */
  private calculateTemporalSpread(memories: Memory[]): number {
    if (memories.length <= 1) return 0

    const timestamps = memories.map((m) => new Date(m.timestamp).getTime())
    const min = Math.min(...timestamps)
    const max = Math.max(...timestamps)
    const spread = max - min

    // Normalize to 0-1 (assume 1 year for full spread)
    const oneYear = 365 * 24 * 60 * 60 * 1000
    return Math.min(1, spread / oneYear)
  }

  /**
   * Calculate quality variance
   */
  private calculateQualityVariance(memories: Memory[]): number {
    const confidences = memories.map((m) => m.metadata.confidence || 0.5)
    const mean = confidences.reduce((sum, c) => sum + c, 0) / confidences.length

    const variance =
      confidences.reduce((sum, c) => sum + Math.pow(c - mean, 2), 0) /
      confidences.length

    // Normalize variance (max theoretical variance is 0.25 for uniform distribution)
    return Math.min(1, variance / 0.25)
  }

  /**
   * Calculate participant distribution characteristics
   */
  private calculateParticipantDistribution(memories: Memory[]): number {
    const participantCounts = memories.map((m) => m.participants?.length || 1)
    const uniqueCounts = new Set(participantCounts)

    // More variety in participant counts = higher distribution score
    return Math.min(1, uniqueCounts.size / 10)
  }

  /**
   * Select optimal sampling strategy
   */
  private selectOptimalStrategy(
    characteristics: DatasetCharacteristics,
  ): SamplingStrategy {
    const { size, emotionalDiversity, temporalSpread, qualityVariance } =
      characteristics

    // Small dataset - use simple sampling
    if (size < 100) {
      return {
        name: 'simple-random',
        parameters: {
          targetSize: Math.min(50, size),
          stratification: undefined,
          random: { enabled: true },
        },
        expectedCharacteristics: {
          expectedCoverage: 0.7,
          expectedQuality: { high: 0.3, medium: 0.4, low: 0.3 },
        },
      }
    }

    // High diversity - use balanced stratification
    if (emotionalDiversity > 0.7 && temporalSpread > 0.7) {
      return {
        name: 'balanced-stratified',
        parameters: {
          targetSize: Math.min(200, Math.floor(size * 0.1)),
          stratification: {
            byEmotion: true,
            byTimePeriod: true,
            byQuality: true,
          },
          random: { enabled: true },
        },
        expectedCharacteristics: {
          expectedCoverage: 0.85,
          expectedQuality: { high: 0.25, medium: 0.5, low: 0.25 },
        },
      }
    }

    // Default strategy
    return {
      ...DEFAULT_SAMPLING_STRATEGY,
      parameters: {
        ...DEFAULT_SAMPLING_STRATEGY.parameters,
        targetSize: Math.min(150, Math.floor(size * 0.1)),
      },
    }
  }
}

/**
 * Internal dataset characteristics type
 */
interface DatasetCharacteristics {
  size: number
  emotionalDiversity: number
  temporalSpread: number
  qualityVariance: number
  participantDistribution: number
  uniqueParticipants: number
}

/**
 * Factory function to create intelligent sampler
 */
export function createIntelligentSampler(): IntelligentSampler {
  return new IntelligentSamplerImpl()
}

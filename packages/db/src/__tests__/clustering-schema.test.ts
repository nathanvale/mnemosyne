import { PrismaClient, MemoryCluster, Memory } from '@studio/db'
import { describe, expect, it, beforeEach, afterEach } from 'vitest'

import { PrismaClusteringOperations } from '../clustering-operations.js'

const prisma = new PrismaClient()
const clusteringOps = new PrismaClusteringOperations(prisma)

describe('Clustering Schema Tests', () => {
  beforeEach(async () => {
    // Clean up any existing test data
    await prisma.clusterQualityMetrics.deleteMany()
    await prisma.patternAnalysis.deleteMany()
    await prisma.clusterMembership.deleteMany()
    await prisma.memoryCluster.deleteMany()
  })

  afterEach(async () => {
    // Clean up test data after each test
    await prisma.clusterQualityMetrics.deleteMany()
    await prisma.patternAnalysis.deleteMany()
    await prisma.clusterMembership.deleteMany()
    await prisma.memoryCluster.deleteMany()
  })

  describe('MemoryCluster Table', () => {
    it('should create a memory cluster with valid data', async () => {
      const cluster = await prisma.memoryCluster.create({
        data: {
          clusterId: 'test-cluster-001',
          clusterTheme: 'Support and Connection',
          emotionalTone: 'positive',
          coherenceScore: 0.8,
          psychologicalSignificance: 0.75,
          participantPatterns: JSON.stringify([
            { participantId: 'user1', pattern: 'supportive' },
          ]),
          clusterMetadata: JSON.stringify({
            algorithmVersion: '1.0.0',
            creationMethod: 'hierarchical',
          }),
          memoryCount: 0,
        },
      })

      expect(cluster.clusterId).toBe('test-cluster-001')
      expect(cluster.coherenceScore).toBe(0.8)
      expect(cluster.psychologicalSignificance).toBe(0.75)
      expect(JSON.parse(cluster.participantPatterns)).toHaveLength(1)
    })

    it('should enforce coherence score constraints', async () => {
      // Test minimum coherence threshold (0.6)
      await expect(
        clusteringOps.createCluster({
          clusterId: 'test-cluster-low-coherence',
          clusterTheme: 'Low Coherence Test',
          emotionalTone: 'mixed',
          coherenceScore: 0.5, // Below minimum threshold
          psychologicalSignificance: 0.75,
          participantPatterns: [],
          clusterMetadata: {
            algorithmVersion: '1.0',
            creationMethod: 'test',
          },
          memoryCount: 0,
        }),
      ).rejects.toThrow('Coherence score must be at least 0.6')
    })

    it('should enforce psychological significance constraints', async () => {
      // Test zero psychological significance
      await expect(
        clusteringOps.createCluster({
          clusterId: 'test-cluster-zero-significance',
          clusterTheme: 'Zero Significance Test',
          emotionalTone: 'neutral',
          coherenceScore: 0.7,
          psychologicalSignificance: 0.0, // Not allowed
          participantPatterns: [],
          clusterMetadata: {
            algorithmVersion: '1.0',
            creationMethod: 'test',
          },
          memoryCount: 0,
        }),
      ).rejects.toThrow('Psychological significance must be greater than 0.0')
    })

    it('should enforce unique cluster IDs', async () => {
      const clusterData = {
        clusterId: 'duplicate-cluster-id',
        clusterTheme: 'Duplicate Test',
        emotionalTone: 'neutral',
        coherenceScore: 0.7,
        psychologicalSignificance: 0.8,
        participantPatterns: JSON.stringify([]),
        clusterMetadata: JSON.stringify({}),
        memoryCount: 0,
      }

      await prisma.memoryCluster.create({ data: clusterData })

      // Second creation should fail due to unique constraint
      await expect(
        prisma.memoryCluster.create({ data: clusterData }),
      ).rejects.toThrow()
    })
  })

  describe('ClusterMembership Table', () => {
    let testCluster: MemoryCluster
    let testMemory: Memory

    beforeEach(async () => {
      // Create test cluster
      testCluster = await prisma.memoryCluster.create({
        data: {
          clusterId: 'membership-test-cluster',
          clusterTheme: 'Membership Test',
          emotionalTone: 'positive',
          coherenceScore: 0.75,
          psychologicalSignificance: 0.8,
          participantPatterns: JSON.stringify([]),
          clusterMetadata: JSON.stringify({}),
          memoryCount: 0,
        },
      })

      // Create test memory with unique content hash
      testMemory = await prisma.memory.create({
        data: {
          sourceMessageIds: JSON.stringify(['msg1', 'msg2']),
          participants: JSON.stringify([{ id: 'user1', name: 'Test User' }]),
          summary: 'Test memory for clustering',
          confidence: 8,
          contentHash: `test-hash-membership-${Date.now()}-${Math.random()}`,
        },
      })
    })

    it('should create cluster membership with valid data', async () => {
      const membership = await prisma.clusterMembership.create({
        data: {
          clusterId: testCluster.clusterId,
          memoryId: testMemory.id,
          membershipStrength: 0.8,
          contributionScore: 0.75,
        },
      })

      expect(membership.clusterId).toBe(testCluster.clusterId)
      expect(membership.memoryId).toBe(testMemory.id)
      expect(membership.membershipStrength).toBe(0.8)
      expect(membership.contributionScore).toBe(0.75)
    })

    it('should enforce membership strength constraints', async () => {
      // Test minimum membership strength (0.5)
      await expect(
        clusteringOps.addMemoryToCluster({
          clusterId: testCluster.clusterId,
          memoryId: testMemory.id,
          membershipStrength: 0.4, // Below minimum threshold
          contributionScore: 0.75,
        }),
      ).rejects.toThrow('Membership strength must be at least 0.5')
    })

    it('should enforce unique cluster-memory pairs', async () => {
      const membershipData = {
        clusterId: testCluster.clusterId,
        memoryId: testMemory.id,
        membershipStrength: 0.8,
        contributionScore: 0.75,
      }

      await prisma.clusterMembership.create({ data: membershipData })

      // Second creation should fail due to unique constraint
      await expect(
        prisma.clusterMembership.create({ data: membershipData }),
      ).rejects.toThrow()
    })

    it('should cascade delete when cluster is deleted', async () => {
      await prisma.clusterMembership.create({
        data: {
          clusterId: testCluster.clusterId,
          memoryId: testMemory.id,
          membershipStrength: 0.8,
          contributionScore: 0.75,
        },
      })

      // Delete cluster should cascade to membership
      await prisma.memoryCluster.delete({
        where: { clusterId: testCluster.clusterId },
      })

      const memberships = await prisma.clusterMembership.findMany({
        where: { clusterId: testCluster.clusterId },
      })
      expect(memberships).toHaveLength(0)
    })
  })

  describe('PatternAnalysis Table', () => {
    let testCluster: MemoryCluster

    beforeEach(async () => {
      testCluster = await prisma.memoryCluster.create({
        data: {
          clusterId: 'pattern-test-cluster',
          clusterTheme: 'Pattern Analysis Test',
          emotionalTone: 'mixed',
          coherenceScore: 0.8,
          psychologicalSignificance: 0.85,
          participantPatterns: JSON.stringify([]),
          clusterMetadata: JSON.stringify({}),
          memoryCount: 0,
        },
      })
    })

    it('should create pattern analysis with valid data', async () => {
      const pattern = await prisma.patternAnalysis.create({
        data: {
          patternId: 'pattern-001',
          clusterId: testCluster.clusterId,
          patternType: 'emotional_theme',
          description:
            'Recurring theme of seeking support during difficult times',
          frequency: 5,
          strength: 0.85,
          confidenceLevel: 0.9,
          psychologicalIndicators: JSON.stringify([
            'support_seeking',
            'emotional_vulnerability',
          ]),
          emotionalCharacteristics: JSON.stringify([
            'openness',
            'trust_building',
          ]),
        },
      })

      expect(pattern.patternId).toBe('pattern-001')
      expect(pattern.patternType).toBe('emotional_theme')
      expect(pattern.strength).toBe(0.85)
      expect(pattern.confidenceLevel).toBe(0.9)
    })

    it('should enforce pattern type constraints', async () => {
      await expect(
        clusteringOps.createPatternAnalysis({
          patternId: 'invalid-pattern-type',
          clusterId: testCluster.clusterId,
          patternType: 'invalid_type' as unknown as 'emotional_theme', // Not in allowed enum
          description: 'Invalid pattern type test',
          frequency: 3,
          strength: 0.7,
          confidenceLevel: 0.85,
          psychologicalIndicators: [],
          emotionalCharacteristics: [],
        }),
      ).rejects.toThrow('Pattern type must be one of:')
    })

    it('should enforce confidence level constraints', async () => {
      // Test minimum confidence threshold (0.8)
      await expect(
        clusteringOps.createPatternAnalysis({
          patternId: 'low-confidence-pattern',
          clusterId: testCluster.clusterId,
          patternType: 'coping_style',
          description: 'Low confidence pattern test',
          frequency: 2,
          strength: 0.6,
          confidenceLevel: 0.7, // Below minimum threshold
          psychologicalIndicators: [],
          emotionalCharacteristics: [],
        }),
      ).rejects.toThrow('Confidence level must be at least 0.8')
    })

    it('should enforce strength constraints', async () => {
      // Test minimum strength threshold (0.3)
      await expect(
        clusteringOps.createPatternAnalysis({
          patternId: 'low-strength-pattern',
          clusterId: testCluster.clusterId,
          patternType: 'relationship_dynamic',
          description: 'Low strength pattern test',
          frequency: 1,
          strength: 0.2, // Below minimum threshold
          confidenceLevel: 0.85,
          psychologicalIndicators: [],
          emotionalCharacteristics: [],
        }),
      ).rejects.toThrow('Strength must be at least 0.3')
    })
  })

  describe('ClusterQualityMetrics Table', () => {
    let testCluster: MemoryCluster

    beforeEach(async () => {
      testCluster = await prisma.memoryCluster.create({
        data: {
          clusterId: 'quality-test-cluster',
          clusterTheme: 'Quality Metrics Test',
          emotionalTone: 'positive',
          coherenceScore: 0.85,
          psychologicalSignificance: 0.9,
          participantPatterns: JSON.stringify([]),
          clusterMetadata: JSON.stringify({}),
          memoryCount: 0,
        },
      })
    })

    it('should create quality metrics with valid data', async () => {
      const metrics = await prisma.clusterQualityMetrics.create({
        data: {
          clusterId: testCluster.clusterId,
          overallCoherence: 0.85,
          emotionalConsistency: 0.8,
          thematicUnity: 0.9,
          psychologicalMeaningfulness: 0.88,
          incoherentMemoryCount: 1,
          strengthAreas: JSON.stringify([
            'emotional_consistency',
            'thematic_unity',
          ]),
          improvementAreas: JSON.stringify(['temporal_coherence']),
          confidenceLevel: 0.82,
        },
      })

      expect(metrics.clusterId).toBe(testCluster.clusterId)
      expect(metrics.overallCoherence).toBe(0.85)
      expect(metrics.psychologicalMeaningfulness).toBe(0.88)
    })

    it('should enforce coherence threshold constraints', async () => {
      // Test minimum coherence threshold (0.6)
      await expect(
        clusteringOps.createQualityMetrics({
          clusterId: testCluster.clusterId,
          overallCoherence: 0.5, // Below minimum threshold
          emotionalConsistency: 0.8,
          thematicUnity: 0.9,
          psychologicalMeaningfulness: 0.8,
          incoherentMemoryCount: 0,
          strengthAreas: [],
          improvementAreas: [],
          confidenceLevel: 0.75,
        }),
      ).rejects.toThrow('Overall coherence must be at least 0.6')
    })

    it('should enforce meaningfulness threshold constraints', async () => {
      // Test minimum meaningfulness threshold (0.7)
      await expect(
        clusteringOps.createQualityMetrics({
          clusterId: testCluster.clusterId,
          overallCoherence: 0.8,
          emotionalConsistency: 0.75,
          thematicUnity: 0.85,
          psychologicalMeaningfulness: 0.65, // Below minimum threshold
          incoherentMemoryCount: 0,
          strengthAreas: [],
          improvementAreas: [],
          confidenceLevel: 0.8,
        }),
      ).rejects.toThrow('Psychological meaningfulness must be at least 0.7')
    })

    it('should enforce unique cluster ID constraint', async () => {
      const metricsData = {
        clusterId: testCluster.clusterId,
        overallCoherence: 0.8,
        emotionalConsistency: 0.75,
        thematicUnity: 0.85,
        psychologicalMeaningfulness: 0.8,
        incoherentMemoryCount: 0,
        strengthAreas: JSON.stringify([]),
        improvementAreas: JSON.stringify([]),
        confidenceLevel: 0.8,
      }

      await prisma.clusterQualityMetrics.create({ data: metricsData })

      // Second creation should fail due to unique constraint
      await expect(
        prisma.clusterQualityMetrics.create({ data: metricsData }),
      ).rejects.toThrow()
    })
  })

  describe('Data Integrity and Relationships', () => {
    it('should maintain referential integrity across all clustering tables', async () => {
      // Create cluster
      const cluster = await prisma.memoryCluster.create({
        data: {
          clusterId: 'integrity-test-cluster',
          clusterTheme: 'Integrity Test',
          emotionalTone: 'neutral',
          coherenceScore: 0.75,
          psychologicalSignificance: 0.8,
          participantPatterns: JSON.stringify([]),
          clusterMetadata: JSON.stringify({}),
          memoryCount: 0,
        },
      })

      // Create memory with unique content hash
      const memory = await prisma.memory.create({
        data: {
          sourceMessageIds: JSON.stringify(['msg1']),
          participants: JSON.stringify([{ id: 'user1', name: 'Test User' }]),
          summary: 'Integrity test memory',
          confidence: 8,
          contentHash: `integrity-test-hash-${Date.now()}-${Math.random()}`,
        },
      })

      // Create membership
      const membership = await prisma.clusterMembership.create({
        data: {
          clusterId: cluster.clusterId,
          memoryId: memory.id,
          membershipStrength: 0.8,
          contributionScore: 0.75,
        },
      })

      // Create pattern analysis
      const pattern = await prisma.patternAnalysis.create({
        data: {
          patternId: 'integrity-pattern',
          clusterId: cluster.clusterId,
          patternType: 'emotional_theme',
          description: 'Integrity test pattern',
          frequency: 3,
          strength: 0.7,
          confidenceLevel: 0.85,
          psychologicalIndicators: JSON.stringify(['test_indicator']),
          emotionalCharacteristics: JSON.stringify(['test_characteristic']),
        },
      })

      // Create quality metrics
      const metrics = await prisma.clusterQualityMetrics.create({
        data: {
          clusterId: cluster.clusterId,
          overallCoherence: 0.8,
          emotionalConsistency: 0.75,
          thematicUnity: 0.85,
          psychologicalMeaningfulness: 0.8,
          incoherentMemoryCount: 0,
          strengthAreas: JSON.stringify(['test_strength']),
          improvementAreas: JSON.stringify(['test_improvement']),
          confidenceLevel: 0.8,
        },
      })

      // Verify all records exist
      expect(cluster.clusterId).toBe('integrity-test-cluster')
      expect(membership.clusterId).toBe(cluster.clusterId)
      expect(pattern.clusterId).toBe(cluster.clusterId)
      expect(metrics.clusterId).toBe(cluster.clusterId)

      // Test cascade deletion
      await prisma.memoryCluster.delete({
        where: { clusterId: cluster.clusterId },
      })

      // Verify cascaded deletions
      const remainingMemberships = await prisma.clusterMembership.findMany({
        where: { clusterId: cluster.clusterId },
      })
      const remainingPatterns = await prisma.patternAnalysis.findMany({
        where: { clusterId: cluster.clusterId },
      })
      const remainingMetrics = await prisma.clusterQualityMetrics.findMany({
        where: { clusterId: cluster.clusterId },
      })

      expect(remainingMemberships).toHaveLength(0)
      expect(remainingPatterns).toHaveLength(0)
      expect(remainingMetrics).toHaveLength(0)

      // Memory should still exist (no cascade from cluster to memory)
      const existingMemory = await prisma.memory.findUnique({
        where: { id: memory.id },
      })
      expect(existingMemory).toBeTruthy()
    })
  })

  describe('Performance and Indexing', () => {
    it('should efficiently query clusters by coherence score', async () => {
      // Create multiple clusters with different coherence scores
      await Promise.all([
        prisma.memoryCluster.create({
          data: {
            clusterId: 'high-coherence-cluster',
            clusterTheme: 'High Coherence',
            emotionalTone: 'positive',
            coherenceScore: 0.9,
            psychologicalSignificance: 0.85,
            participantPatterns: JSON.stringify([]),
            clusterMetadata: JSON.stringify({}),
            memoryCount: 0,
          },
        }),
        prisma.memoryCluster.create({
          data: {
            clusterId: 'medium-coherence-cluster',
            clusterTheme: 'Medium Coherence',
            emotionalTone: 'neutral',
            coherenceScore: 0.75,
            psychologicalSignificance: 0.8,
            participantPatterns: JSON.stringify([]),
            clusterMetadata: JSON.stringify({}),
            memoryCount: 0,
          },
        }),
        prisma.memoryCluster.create({
          data: {
            clusterId: 'low-coherence-cluster',
            clusterTheme: 'Low Coherence',
            emotionalTone: 'mixed',
            coherenceScore: 0.65,
            psychologicalSignificance: 0.75,
            participantPatterns: JSON.stringify([]),
            clusterMetadata: JSON.stringify({}),
            memoryCount: 0,
          },
        }),
      ])

      // Query by coherence score (should use index)
      const highCoherenceClusters = await prisma.memoryCluster.findMany({
        where: {
          coherenceScore: {
            gte: 0.8,
          },
        },
        orderBy: {
          coherenceScore: 'desc',
        },
      })

      expect(highCoherenceClusters).toHaveLength(1)
      expect(highCoherenceClusters[0].clusterId).toBe('high-coherence-cluster')
    })

    it('should efficiently query pattern analysis by type and confidence', async () => {
      const cluster = await prisma.memoryCluster.create({
        data: {
          clusterId: 'pattern-query-cluster',
          clusterTheme: 'Pattern Query Test',
          emotionalTone: 'positive',
          coherenceScore: 0.8,
          psychologicalSignificance: 0.85,
          participantPatterns: JSON.stringify([]),
          clusterMetadata: JSON.stringify({}),
          memoryCount: 0,
        },
      })

      // Create patterns with different types and confidence levels
      await Promise.all([
        prisma.patternAnalysis.create({
          data: {
            patternId: 'emotional-pattern-high',
            clusterId: cluster.clusterId,
            patternType: 'emotional_theme',
            description: 'High confidence emotional pattern',
            frequency: 5,
            strength: 0.8,
            confidenceLevel: 0.95,
            psychologicalIndicators: JSON.stringify([]),
            emotionalCharacteristics: JSON.stringify([]),
          },
        }),
        prisma.patternAnalysis.create({
          data: {
            patternId: 'coping-pattern-medium',
            clusterId: cluster.clusterId,
            patternType: 'coping_style',
            description: 'Medium confidence coping pattern',
            frequency: 3,
            strength: 0.7,
            confidenceLevel: 0.85,
            psychologicalIndicators: JSON.stringify([]),
            emotionalCharacteristics: JSON.stringify([]),
          },
        }),
      ])

      // Query by type and confidence (should use compound index)
      const highConfidenceEmotionalPatterns =
        await prisma.patternAnalysis.findMany({
          where: {
            patternType: 'emotional_theme',
            confidenceLevel: {
              gte: 0.9,
            },
          },
          orderBy: {
            confidenceLevel: 'desc',
          },
        })

      expect(highConfidenceEmotionalPatterns).toHaveLength(1)
      expect(highConfidenceEmotionalPatterns[0].patternId).toBe(
        'emotional-pattern-high',
      )
    })
  })
})

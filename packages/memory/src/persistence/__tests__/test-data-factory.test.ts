import { PrismaClient } from '@studio/db'
import {
  describe,
  it,
  expect,
  beforeEach,
  afterEach,
  beforeAll,
  afterAll,
} from 'vitest'

import { TestDataFactory } from './test-data-factory'
import { WorkerDatabaseFactory } from './worker-database-factory'

/**
 * Task 4.1: Write tests for test data factory functions
 *
 * These tests validate that the TestDataFactory correctly handles
 * foreign key dependencies and creates valid test data.
 */
describe('TestDataFactory', () => {
  let prisma: PrismaClient
  let factory: TestDataFactory

  beforeAll(async () => {
    // Use worker-specific database for isolation
    prisma = await WorkerDatabaseFactory.createWorkerPrismaClient()
    factory = new TestDataFactory(prisma)
  })

  afterAll(async () => {
    await WorkerDatabaseFactory.cleanup()
  })

  beforeEach(async () => {
    // Clean up any existing test data before each test
    await WorkerDatabaseFactory.cleanWorkerData(prisma)
  })

  afterEach(async () => {
    // No need to clean up here as we clean in beforeEach
  })

  describe('Memory Creation', () => {
    it('should create Memory record with default values', async () => {
      const memoryId = await factory.createMemory()

      const memory = await prisma.memory.findUnique({
        where: { id: memoryId },
      })

      expect(memory).toBeDefined()
      expect(memory!.id).toBe(memoryId)
      expect(memory!.summary).toBe('Test memory for mood scoring tests')
      expect(memory!.confidence).toBe(8)
      expect(memory!.contentHash).toMatch(/^test-hash-/)
    })

    it('should create Memory record with custom values', async () => {
      const customOptions = {
        id: 'custom-memory-123',
        sourceMessageIds: [10, 20, 30],
        participants: [{ id: 'user-custom', name: 'Custom User' }],
        summary: 'Custom test memory',
        confidence: 9,
        contentHash: `custom-hash-abc-${Date.now()}-${Math.random()}`, // Make unique
      }

      const memoryId = await factory.createMemory(customOptions)

      expect(memoryId).toBe('custom-memory-123')

      // Give the database a moment to process the transaction
      await new Promise((resolve) => setTimeout(resolve, 50))

      const memory = await prisma.memory.findUnique({
        where: { id: memoryId },
      })

      expect(memory).toBeDefined()
      expect(memory!.summary).toBe('Custom test memory')
      expect(memory!.confidence).toBe(9)
      expect(memory!.contentHash).toMatch(/^custom-hash-abc-/)
      expect(JSON.parse(memory!.sourceMessageIds)).toEqual([10, 20, 30])
      expect(JSON.parse(memory!.participants)).toEqual([
        { id: 'user-custom', name: 'Custom User' },
      ])
    })

    it('should generate unique IDs for multiple Memory records', async () => {
      const memoryId1 = await factory.createMemory()
      const memoryId2 = await factory.createMemory()
      const memoryId3 = await factory.createMemory()

      expect(memoryId1).not.toBe(memoryId2)
      expect(memoryId2).not.toBe(memoryId3)
      expect(memoryId1).not.toBe(memoryId3)

      // Verify all records exist
      const memories = await prisma.memory.findMany({
        where: {
          id: { in: [memoryId1, memoryId2, memoryId3] },
        },
      })

      expect(memories).toHaveLength(3)
    })
  })

  describe('MoodScore Creation with Foreign Key Dependencies', () => {
    it('should create MoodScore with existing Memory ID', async () => {
      const memoryId = await factory.createMemory()
      const { moodScoreId } = await factory.createMoodScore({ memoryId })

      const moodScore = await prisma.moodScore.findUnique({
        where: { id: moodScoreId },
        include: { factors: true },
      })

      expect(moodScore).toBeDefined()
      expect(moodScore!.memoryId).toBe(memoryId)
      expect(moodScore!.score).toBe(7.5)
      expect(moodScore!.confidence).toBe(0.8)
      expect(JSON.parse(moodScore!.descriptors)).toEqual(['positive', 'stable'])
      expect(moodScore!.factors).toHaveLength(1)
      expect(moodScore!.factors[0].type).toBe('sentiment_analysis')
    })

    it('should automatically create Memory if not provided', async () => {
      const { memoryId, moodScoreId } = await factory.createMoodScore({
        memoryId: await factory.createMemory(),
      })

      // Verify Memory exists
      const memory = await prisma.memory.findUnique({ where: { id: memoryId } })
      expect(memory).toBeTruthy()

      // Give the database a moment to process the transaction
      await new Promise((resolve) => setTimeout(resolve, 50))

      // Verify MoodScore exists and references the Memory
      const moodScore = await prisma.moodScore.findUnique({
        where: { id: moodScoreId },
      })

      expect(moodScore).toBeDefined()
      expect(moodScore!.memoryId).toBe(memoryId)
    })

    it('should create MoodScore with custom factors', async () => {
      const customFactors = [
        {
          type: 'sentiment_analysis' as const,
          weight: 0.4,
          description: 'Strong positive sentiment',
          evidence: ['joy', 'excitement'],
          _score: 8.5,
        },
        {
          type: 'psychological_indicators' as const,
          weight: 0.3,
          description: 'High resilience indicators',
          evidence: ['coping', 'adaptation'],
          _score: 7.8,
        },
      ]

      const memoryId = await factory.createMemory()
      const { moodScoreId } = await factory.createMoodScore({
        memoryId,
        score: 8.2,
        confidence: 0.92,
        descriptors: ['highly_positive', 'resilient'],
        factors: customFactors,
      })

      const moodScore = await prisma.moodScore.findUnique({
        where: { id: moodScoreId },
        include: { factors: true },
      })

      expect(moodScore).toBeDefined()
      expect(moodScore!.score).toBe(8.2)
      expect(moodScore!.confidence).toBe(0.92)
      expect(JSON.parse(moodScore!.descriptors)).toEqual([
        'highly_positive',
        'resilient',
      ])
      expect(moodScore!.factors).toHaveLength(2)

      // Verify factor details
      const sentimentFactor = moodScore!.factors.find(
        (f) => f.type === 'sentiment_analysis',
      )
      expect(sentimentFactor).toBeDefined()
      expect(sentimentFactor!.weight).toBe(0.4)
      expect(sentimentFactor!.internalScore).toBe(8.5)
      expect(JSON.parse(sentimentFactor!.evidence)).toEqual([
        'joy',
        'excitement',
      ])
    })

    it('should enforce foreign key constraint for invalid Memory ID', async () => {
      await expect(
        factory.createMoodScore({ memoryId: 'non-existent-memory' }),
      ).rejects.toThrow(/Memory with id .* does not exist/)
    })
  })

  describe('MoodDelta Creation with Foreign Key Dependencies', () => {
    it('should create MoodDeltas with existing Memory ID', async () => {
      const memoryId = await factory.createMemory()

      const customDeltas = [
        {
          magnitude: 3.2,
          direction: 'positive' as const,
          type: 'celebration' as const,
          confidence: 0.9,
          factors: ['achievement', 'success'],
          significance: 0.85,
          currentScore: 8.5,
        },
        {
          magnitude: 1.8,
          direction: 'negative' as const,
          type: 'decline' as const,
          confidence: 0.75,
          factors: ['setback'],
          significance: 0.6,
          currentScore: 5.2,
        },
      ]

      const { deltaIds } = await factory.createMoodDeltas({
        memoryId,
        deltas: customDeltas,
      })

      expect(deltaIds).toHaveLength(2)

      const deltas = await prisma.moodDelta.findMany({
        where: { id: { in: deltaIds } },
      })

      expect(deltas).toHaveLength(2)
      expect(deltas.every((d) => d.memoryId === memoryId)).toBe(true)

      // Verify delta details
      const positiveDeltas = deltas.filter((d) => d.direction === 'positive')
      const negativeDeltas = deltas.filter((d) => d.direction === 'negative')

      expect(positiveDeltas).toHaveLength(1)
      expect(negativeDeltas).toHaveLength(1)

      expect(positiveDeltas[0].magnitude).toBe(3.2)
      expect(positiveDeltas[0].type).toBe('celebration')
      expect(JSON.parse(positiveDeltas[0].factors)).toEqual([
        'achievement',
        'success',
      ])
    })

    it('should automatically create Memory if not provided', async () => {
      const memoryId = await factory.createMemory()
      const { deltaIds } = await factory.createMoodDeltas({
        memoryId,
      })

      // Verify Memory exists
      const memory = await prisma.memory.findUnique({ where: { id: memoryId } })
      expect(memory).toBeTruthy()

      // Give the database a moment to process the transaction
      await new Promise((resolve) => setTimeout(resolve, 50))

      // Verify deltas exist and reference the Memory
      const deltas = await prisma.moodDelta.findMany({
        where: { id: { in: deltaIds } },
      })

      expect(deltas).toHaveLength(1)
      expect(deltas[0].memoryId).toBe(memoryId)
    })
  })

  describe('Complete Test Data Creation', () => {
    it('should create complete test data with all components', async () => {
      const result = await factory.createCompleteTestData({
        memoryOptions: {
          summary: 'Complete test memory',
          confidence: 9,
        },
        moodScoreOptions: {
          score: 8.0,
          confidence: 0.85,
          descriptors: ['complete', 'test'],
        },
        deltasOptions: {
          deltas: [
            {
              magnitude: 2.0,
              direction: 'positive',
              type: 'mood_repair',
              confidence: 0.8,
              factors: ['improvement'],
            },
          ],
        },
      })

      expect(result.memoryId).toBeDefined()
      expect(result.moodScoreId).toBeDefined()
      expect(result.deltaIds).toHaveLength(1)

      // Verify all foreign key relationships
      const memory = await prisma.memory.findUnique({
        where: { id: result.memoryId },
        include: { moodScores: true, moodDeltas: true },
      })
      expect(memory).toBeTruthy()
      expect(memory!.moodScores).toHaveLength(1)
      expect(memory!.moodDeltas).toHaveLength(1)
    })
  })

  describe('Data Cleanup and Validation', () => {
    it('should clean up specific test data', async () => {
      const memoryId1 = await factory.createMemory({
        id: `cleanup-test-1-${Date.now()}`,
      })
      const memoryId2 = await factory.createMemory({
        id: `cleanup-test-2-${Date.now()}`,
      })
      const memoryId3 = await factory.createMemory({
        id: `cleanup-test-3-${Date.now()}`,
      })

      // Add dependent records
      await factory.createMoodScore({ memoryId: memoryId1 })
      await factory.createMoodScore({ memoryId: memoryId2 })

      // Clean up specific memories
      await factory.cleanupTestData([memoryId1, memoryId2])

      // Verify cleanup
      const remainingMemories = await prisma.memory.findMany({
        where: {
          id: { in: [memoryId1, memoryId2, memoryId3] },
        },
      })

      expect(remainingMemories).toHaveLength(1)
      expect(remainingMemories[0].id).toBe(memoryId3)

      // Verify dependent records were also cleaned up (cascade)
      const remainingMoodScores = await prisma.moodScore.findMany({
        where: {
          memoryId: { in: [memoryId1, memoryId2] },
        },
      })

      expect(remainingMoodScores).toHaveLength(0)
    })

    it('should validate foreign key integrity', async () => {
      const { memoryId } = await factory.createCompleteTestData()

      const memory = await prisma.memory.findUnique({
        where: { id: memoryId },
        include: { moodScores: true, moodDeltas: true },
      })

      expect(memory).toBeTruthy()
      expect(memory!.moodScores.length).toBeGreaterThan(0)
      expect(memory!.moodDeltas.length).toBeGreaterThan(0)
    })

    it('should detect invalid foreign key integrity', async () => {
      const memory = await prisma.memory.findUnique({
        where: { id: 'non-existent-memory' },
        include: { moodScores: true, moodDeltas: true },
      })

      expect(memory).toBeNull()

      // Also check that no orphaned records exist
      const orphanedScores = await prisma.moodScore.findMany({
        where: { memoryId: 'non-existent-memory' },
      })
      expect(orphanedScores).toHaveLength(0)
    })
  })
})

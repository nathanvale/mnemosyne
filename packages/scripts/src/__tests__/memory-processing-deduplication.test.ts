import type { DatabaseMemoryInput } from '@studio/db'

import { createTestDatabase, type TestDatabase } from '@studio/test-config'
import { describe, it, expect, beforeEach, afterEach } from 'vitest'

import { MemoryDataProcessor } from '../memory-processing'

describe('MemoryDataProcessor with Deduplication', () => {
  let testDb: TestDatabase
  let processor: MemoryDataProcessor

  beforeEach(async () => {
    testDb = await createTestDatabase()
    processor = new MemoryDataProcessor(testDb.client, {
      batchSize: 10,
      continueOnError: true,
      validateFirst: true,
      logProgress: false, // Disable logging in tests
    })

    await testDb.client.memory.deleteMany()
  })

  afterEach(async () => {
    await testDb.cleanup()
  })

  it('should process memories without deduplication', async () => {
    const memoriesData: DatabaseMemoryInput[] = [
      {
        id: 'mem1',
        summary: 'First memory',
        participants: [{ id: 'user1', name: 'John', role: 'sender' }],
        sourceMessageIds: ['msg1'],
        confidence: 8,
        contentHash: 'hash1',
      },
      {
        id: 'mem2',
        summary: 'Second memory',
        participants: [{ id: 'user2', name: 'Jane', role: 'sender' }],
        sourceMessageIds: ['msg2'],
        confidence: 7,
        contentHash: 'hash2',
      },
    ]

    const result = await processor.processMemories(memoriesData)

    expect(result.processed).toBe(2)
    expect(result.successful).toBe(2)
    expect(result.failed).toBe(0)
    expect(result.duplicatesSkipped).toBe(0)
    expect(result.errors).toHaveLength(0)

    const memories = await testDb.client.memory.findMany()
    expect(memories).toHaveLength(2)
  })

  it('should process memories with deduplication and skip exact duplicates', async () => {
    const memoriesData: DatabaseMemoryInput[] = [
      {
        id: 'mem1',
        summary: 'Test memory',
        participants: [{ id: 'user1', name: 'John', role: 'sender' }],
        sourceMessageIds: ['msg1'],
        confidence: 8,
        contentHash: '', // Will be generated
      },
      {
        id: 'mem2',
        summary: 'Test memory', // Same content
        participants: [{ id: 'user1', name: 'John', role: 'sender' }],
        sourceMessageIds: ['msg1'],
        confidence: 8,
        contentHash: '', // Will be generated
      },
      {
        id: 'mem3',
        summary: 'Different memory',
        participants: [{ id: 'user2', name: 'Jane', role: 'sender' }],
        sourceMessageIds: ['msg2'],
        confidence: 7,
        contentHash: '', // Will be generated
      },
    ]

    const result =
      await processor.processMemoriesWithDeduplication(memoriesData)

    expect(result.processed).toBe(3)
    expect(result.successful).toBe(2) // mem1 and mem3
    expect(result.failed).toBe(0)
    expect(result.duplicatesSkipped).toBe(1) // mem2 skipped as duplicate of mem1
    expect(result.errors).toHaveLength(0)

    const memories = await testDb.client.memory.findMany()
    expect(memories).toHaveLength(2)
    expect(memories.map((m) => m.id).sort()).toEqual(['mem1', 'mem3'])
  })

  it('should handle validation errors during deduplication processing', async () => {
    const memoriesData = [
      {
        id: 'mem1',
        summary: 'Valid memory',
        participants: [{ id: 'user1', name: 'John', role: 'sender' }],
        sourceMessageIds: ['msg1'],
        confidence: 8,
        contentHash: '',
      },
      {
        // Invalid memory - missing required fields
        id: 'mem2',
        summary: '',
        participants: [],
        sourceMessageIds: [],
        contentHash: '',
      },
    ]

    const result =
      await processor.processMemoriesWithDeduplication(memoriesData)

    expect(result.processed).toBe(2)
    expect(result.successful).toBe(1)
    expect(result.failed).toBe(1)
    expect(result.validationErrors).toBe(1)
    expect(result.duplicatesSkipped).toBe(0)
    expect(result.errors).toHaveLength(1)
    expect(result.errors[0].type).toBe('validation')

    const memories = await testDb.client.memory.findMany()
    expect(memories).toHaveLength(1)
    expect(memories[0].id).toBe('mem1')
  })

  it('should detect similar memories and skip them', async () => {
    const memoriesData: DatabaseMemoryInput[] = [
      {
        id: 'mem1',
        summary: 'John and Jane discussed the project deadline',
        participants: [
          { id: 'user1', name: 'John', role: 'sender' },
          { id: 'user2', name: 'Jane', role: 'receiver' },
        ],
        sourceMessageIds: ['msg1', 'msg2'],
        confidence: 8,
        contentHash: '',
      },
      {
        id: 'mem2',
        summary: 'John and Jane talked about project deadlines',
        participants: [
          { id: 'user1', name: 'John', role: 'sender' },
          { id: 'user2', name: 'Jane', role: 'receiver' },
        ],
        sourceMessageIds: ['msg1', 'msg2'],
        confidence: 7,
        contentHash: '',
      },
    ]

    const result =
      await processor.processMemoriesWithDeduplication(memoriesData)

    expect(result.processed).toBe(2)
    expect(result.successful).toBe(1)
    expect(result.failed).toBe(0)
    expect(result.duplicatesSkipped).toBe(1)

    const memories = await testDb.client.memory.findMany()
    expect(memories).toHaveLength(1)
    expect(memories[0].id).toBe('mem1')
  })

  it('should persist content hashes correctly', async () => {
    const memoriesData: DatabaseMemoryInput[] = [
      {
        id: 'mem1',
        summary: 'Test memory',
        participants: [{ id: 'user1', name: 'John', role: 'sender' }],
        sourceMessageIds: ['msg1'],
        confidence: 8,
        contentHash: '',
      },
    ]

    const result =
      await processor.processMemoriesWithDeduplication(memoriesData)

    expect(result.successful).toBe(1)

    const memory = await testDb.client.memory.findUnique({
      where: { id: 'mem1' },
    })

    expect(memory).toBeTruthy()
    expect(memory!.contentHash).toMatch(/^[a-f0-9]{64}$/) // SHA-256 hex string
    expect(memory!.contentHash).not.toBe('')
  })

  it('should prevent database-level duplicates with unique constraint', async () => {
    const memoriesData: DatabaseMemoryInput[] = [
      {
        id: 'mem1',
        summary: 'Test memory',
        participants: [{ id: 'user1', name: 'John', role: 'sender' }],
        sourceMessageIds: ['msg1'],
        confidence: 8,
        contentHash: 'same-hash-123',
      },
      {
        id: 'mem2',
        summary: 'Different memory with same hash',
        participants: [{ id: 'user2', name: 'Jane', role: 'sender' }],
        sourceMessageIds: ['msg2'],
        confidence: 7,
        contentHash: 'same-hash-123', // Intentionally same hash
      },
    ]

    const result = await processor.processMemories(memoriesData)

    expect(result.processed).toBe(2)
    expect(result.successful).toBe(1)
    expect(result.failed).toBe(1)
    expect(result.databaseErrors).toBe(1)

    const memories = await testDb.client.memory.findMany()
    expect(memories).toHaveLength(1)
  })

  it('should handle batch processing correctly with deduplication', async () => {
    const memoriesData: DatabaseMemoryInput[] = []

    for (let i = 1; i <= 25; i++) {
      memoriesData.push({
        id: `mem${i}`,
        summary: i <= 20 ? 'Repeated memory' : `Unique memory ${i}`,
        participants: [{ id: 'user1', name: 'John', role: 'sender' }],
        sourceMessageIds: i <= 20 ? ['msg1'] : [`msg${i}`], // Same message for repeated memories
        confidence: 8,
        contentHash: '',
      })
    }

    const processor = new MemoryDataProcessor(testDb.client, {
      batchSize: 5,
      continueOnError: true,
      validateFirst: true,
      logProgress: false,
    })

    const result =
      await processor.processMemoriesWithDeduplication(memoriesData)

    expect(result.processed).toBe(25)
    expect(result.successful).toBe(6) // 1 repeated + 5 unique
    expect(result.duplicatesSkipped).toBe(19) // 19 duplicates of the repeated memory
    expect(result.failed).toBe(0)

    const memories = await testDb.client.memory.findMany()
    expect(memories).toHaveLength(6)
  })
})

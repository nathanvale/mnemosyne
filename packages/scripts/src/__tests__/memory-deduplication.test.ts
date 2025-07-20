import { describe, it, expect, beforeEach } from 'vitest'

import {
  MemoryContentHasher,
  MemoryDeduplicator,
  type MemoryForDeduplication,
} from '../memory-deduplication'

describe('MemoryContentHasher', () => {
  let hasher: MemoryContentHasher

  beforeEach(() => {
    hasher = new MemoryContentHasher()
  })

  it('should generate consistent hashes for identical memories', () => {
    const memory1: MemoryForDeduplicationForDeduplication = {
      id: '1',
      summary: 'Test memory',
      participants: [{ id: 'user1', name: 'John', role: 'sender' }],
      sourceMessageIds: ['msg1', 'msg2'],
      confidence: 8,
    }

    const memory2: MemoryForDeduplication = {
      id: '2', // Different ID should not affect hash
      summary: 'Test memory',
      participants: [{ id: 'user1', name: 'John', role: 'sender' }],
      sourceMessageIds: ['msg1', 'msg2'],
      confidence: 8,
    }

    const hash1 = hasher.generateContentHash(memory1)
    const hash2 = hasher.generateContentHash(memory2)

    expect(hash1).toBe(hash2)
    expect(hash1).toMatch(/^[a-f0-9]{64}$/) // SHA-256 hex string
  })

  it('should generate different hashes for different memories', () => {
    const memory1: MemoryForDeduplication = {
      id: '1',
      summary: 'Test memory',
      participants: [{ id: 'user1', name: 'John', role: 'sender' }],
      sourceMessageIds: ['msg1', 'msg2'],
      confidence: 8,
    }

    const memory2: MemoryForDeduplication = {
      id: '1',
      summary: 'Different memory',
      participants: [{ id: 'user1', name: 'John', role: 'sender' }],
      sourceMessageIds: ['msg1', 'msg2'],
      confidence: 8,
    }

    const hash1 = hasher.generateContentHash(memory1)
    const hash2 = hasher.generateContentHash(memory2)

    expect(hash1).not.toBe(hash2)
  })

  it('should normalize content consistently', () => {
    const memory1: MemoryForDeduplication = {
      id: '1',
      summary: '  Test Memory  ',
      participants: [
        { id: 'user2', name: 'Jane', role: 'receiver' },
        { id: 'user1', name: 'John', role: 'sender' },
      ],
      sourceMessageIds: ['msg2', 'msg1'],
      confidence: 8,
    }

    const memory2: MemoryForDeduplication = {
      id: '2',
      summary: 'test memory',
      participants: [
        { id: 'user1', name: 'john', role: 'sender' },
        { id: 'user2', name: 'jane', role: 'receiver' },
      ],
      sourceMessageIds: ['msg1', 'msg2'],
      confidence: 8,
    }

    const normalized1 = hasher.normalizeContent(memory1)
    const normalized2 = hasher.normalizeContent(memory2)

    expect(normalized1.summary).toBe('test memory')
    expect(normalized2.summary).toBe('test memory')
    expect(normalized1.participants).toEqual(normalized2.participants)
    expect(normalized1.sourceMessageIds).toEqual(normalized2.sourceMessageIds)
  })

  it('should handle JSON string participants and sourceMessageIds', () => {
    const memoryWithArrays: MemoryForDeduplication = {
      id: '1',
      summary: 'test',
      participants: [{ id: 'user1', name: 'John', role: 'sender' }],
      sourceMessageIds: ['msg1'],
      confidence: 8,
    }

    const memoryWithJsonStrings = {
      id: '2',
      summary: 'test',
      participants: JSON.stringify([
        { id: 'user1', name: 'John', role: 'sender' },
      ]),
      sourceMessageIds: JSON.stringify(['msg1']),
      confidence: 8,
    } as MemoryForDeduplication

    const hash1 = hasher.generateContentHash(memoryWithArrays)
    const hash2 = hasher.generateContentHash(memoryWithJsonStrings)

    expect(hash1).toBe(hash2)
  })
})

describe('MemoryDeduplicator', () => {
  let hasher: MemoryContentHasher
  let deduplicator: MemoryDeduplicator

  beforeEach(() => {
    hasher = new MemoryContentHasher()
    deduplicator = new MemoryDeduplicator(hasher)
  })

  it('should detect exact duplicates', async () => {
    const memory: MemoryForDeduplication = {
      id: '1',
      summary: 'Test memory',
      participants: [{ id: 'user1', name: 'John', role: 'sender' }],
      sourceMessageIds: ['msg1'],
      confidence: 8,
    }

    const existingMemoryForDeduplication: MemoryForDeduplication = {
      id: '2',
      summary: 'Test memory',
      participants: [{ id: 'user1', name: 'John', role: 'sender' }],
      sourceMessageIds: ['msg1'],
      confidence: 8,
    }

    const result = await deduplicator.checkForDuplicates(memory, [
      existingMemoryForDeduplication,
    ])

    expect(result.isDuplicate).toBe(true)
    expect(result.duplicateType).toBe('exact')
    expect(result.similarity).toBe(1.0)
    expect(result.existingMemoryId).toBe('2')
  })

  it('should detect similar memories', async () => {
    const memory: MemoryForDeduplication = {
      id: '1',
      summary: 'John and Jane had a conversation about work',
      participants: [
        { id: 'user1', name: 'John', role: 'sender' },
        { id: 'user2', name: 'Jane', role: 'receiver' },
      ],
      sourceMessageIds: ['msg1', 'msg2'],
      confidence: 8,
    }

    const existingMemoryForDeduplication: MemoryForDeduplication = {
      id: '2',
      summary: 'John and Jane discussed work topics',
      participants: [
        { id: 'user1', name: 'John', role: 'sender' },
        { id: 'user2', name: 'Jane', role: 'receiver' },
      ],
      sourceMessageIds: ['msg1', 'msg2'],
      confidence: 7,
    }

    const result = await deduplicator.checkForDuplicates(memory, [
      existingMemoryForDeduplication,
    ])

    expect(result.isDuplicate).toBe(true)
    expect(result.duplicateType).toBe('similar')
    expect(result.similarity).toBeGreaterThan(0.7)
    expect(result.existingMemoryId).toBe('2')
  })

  it('should not detect duplicates for different memories', async () => {
    const memory: MemoryForDeduplication = {
      id: '1',
      summary: 'Completely different memory',
      participants: [{ id: 'user1', name: 'John', role: 'sender' }],
      sourceMessageIds: ['msg1'],
      confidence: 8,
    }

    const existingMemoryForDeduplication: MemoryForDeduplication = {
      id: '2',
      summary: 'Another memory about different topic',
      participants: [{ id: 'user2', name: 'Jane', role: 'sender' }],
      sourceMessageIds: ['msg2'],
      confidence: 7,
    }

    const result = await deduplicator.checkForDuplicates(memory, [
      existingMemoryForDeduplication,
    ])

    expect(result.isDuplicate).toBe(false)
    expect(result.duplicateType).toBe('none')
  })

  it('should track session hashes to prevent duplicates within the same session', async () => {
    const memory1: MemoryForDeduplication = {
      id: '1',
      summary: 'Test memory',
      participants: [{ id: 'user1', name: 'John', role: 'sender' }],
      sourceMessageIds: ['msg1'],
      confidence: 8,
    }

    const memory2: MemoryForDeduplication = {
      id: '2',
      summary: 'Test memory',
      participants: [{ id: 'user1', name: 'John', role: 'sender' }],
      sourceMessageIds: ['msg1'],
      confidence: 8,
    }

    const result1 = await deduplicator.checkForDuplicates(memory1, [])
    expect(result1.isDuplicate).toBe(false)

    const result2 = await deduplicator.checkForDuplicates(memory2, [])
    expect(result2.isDuplicate).toBe(true)
    expect(result2.duplicateType).toBe('exact')
  })

  it('should clear session hashes', async () => {
    const memory: MemoryForDeduplication = {
      id: '1',
      summary: 'Test memory',
      participants: [{ id: 'user1', name: 'John', role: 'sender' }],
      sourceMessageIds: ['msg1'],
      confidence: 8,
    }

    const result1 = await deduplicator.checkForDuplicates(memory, [])
    expect(result1.isDuplicate).toBe(false)

    deduplicator.clearSessionHashes()

    const result2 = await deduplicator.checkForDuplicates(memory, [])
    expect(result2.isDuplicate).toBe(false)
  })

  it('should create deduplication metadata', () => {
    const metadata = deduplicator.createDeduplicationMetadata(
      'abc123',
      ['mem1', 'mem2'],
      'Similar content detected',
    )

    expect(metadata.originalHash).toBe('abc123')
    expect(metadata.mergedWith).toEqual(['mem1', 'mem2'])
    expect(metadata.mergeReason).toBe('Similar content detected')
    expect(metadata.mergedAt).toBeInstanceOf(Date)
  })

  it('should calculate similarity correctly', async () => {
    const memory1: MemoryForDeduplication = {
      id: '1',
      summary: 'Discussion about project deadlines',
      participants: [
        { id: 'user1', name: 'John', role: 'sender' },
        { id: 'user2', name: 'Jane', role: 'receiver' },
      ],
      sourceMessageIds: ['msg1', 'msg2'],
      confidence: 8,
    }

    const memory2: MemoryForDeduplication = {
      id: '2',
      summary: 'Discussion about project deadlines',
      participants: [
        { id: 'user1', name: 'John', role: 'sender' },
        { id: 'user2', name: 'Jane', role: 'receiver' },
      ],
      sourceMessageIds: ['msg1', 'msg2'],
      confidence: 8,
    }

    const memory3: MemoryForDeduplication = {
      id: '3',
      summary: 'Discussion about vacation plans',
      participants: [
        { id: 'user1', name: 'John', role: 'sender' },
        { id: 'user2', name: 'Jane', role: 'receiver' },
      ],
      sourceMessageIds: ['msg1', 'msg2'],
      confidence: 8,
    }

    const result1 = await deduplicator.checkForDuplicates(memory1, [memory2])
    expect(result1.similarity).toBe(1.0)

    deduplicator.clearSessionHashes()
    const result2 = await deduplicator.checkForDuplicates(memory1, [memory3])
    expect(result2.similarity).toBeLessThan(1.0)
    expect(result2.similarity).toBeGreaterThan(0.5) // Same participants and messages
  })
})

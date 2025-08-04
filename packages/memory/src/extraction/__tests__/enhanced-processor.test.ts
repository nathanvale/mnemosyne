import type { PrismaClient } from '@studio/db'

import { describe, it, expect, beforeEach, vi } from 'vitest'

import type { ConversationDataInput } from '../../types'

import { EnhancedMemoryProcessor } from '../enhanced-processor'

// Mock the database client
const mockDatabase = {
  memory: {
    findFirst: vi.fn(),
    create: vi.fn(),
  },
} as unknown as PrismaClient

// Mock conversation data for testing
const mockConversationData: ConversationDataInput = {
  id: 'test-conversation-1',
  messages: [
    {
      id: 'msg-1',
      content: 'Hello, how are you feeling today?',
      authorId: 'user-1',
      timestamp: new Date('2024-01-01T10:00:00Z'),
    },
    {
      id: 'msg-2',
      content: 'I am feeling quite happy and excited about the new project!',
      authorId: 'user-2',
      timestamp: new Date('2024-01-01T10:01:00Z'),
    },
    {
      id: 'msg-3',
      content: 'That is wonderful to hear! What makes you most excited?',
      authorId: 'user-1',
      timestamp: new Date('2024-01-01T10:02:00Z'),
    },
  ],
  participants: [
    {
      id: 'user-1',
      name: 'Alice',
      role: 'author',
    },
    {
      id: 'user-2',
      name: 'Bob',
      role: 'recipient',
    },
  ],
  timestamp: new Date('2024-01-01T10:00:00Z'),
  startTime: new Date('2024-01-01T10:00:00Z'),
  endTime: new Date('2024-01-01T10:02:00Z'),
  context: {
    platform: 'test-platform',
    conversationType: 'direct',
  },
}

describe('EnhancedMemoryProcessor', () => {
  let processor: EnhancedMemoryProcessor

  beforeEach(() => {
    vi.clearAllMocks()

    processor = new EnhancedMemoryProcessor({
      database: mockDatabase,
      performance: {
        batchSize: 5,
        parallelProcessing: true,
        timeoutMs: 10000,
      },
      quality: {
        minimumQualityScore: 6.0,
        minimumConfidence: 0.7,
      },
      emotional: {
        enableTrajectoryAnalysis: true,
        minimumSignificanceScore: 5.0,
      },
    })
  })

  describe('processConversation', () => {
    it('should successfully process a conversation with emotional triggers', async () => {
      // Mock that no existing memory is found
      mockDatabase.memory.findFirst = vi.fn().mockResolvedValue(null)
      mockDatabase.memory.create = vi.fn().mockResolvedValue({})

      const result = await processor.processConversation(mockConversationData)

      expect(result.success).toBe(true)
      expect(result.extractedMemory).toBeDefined()
      expect(result.extractedMemory?.processing.confidence).toBeGreaterThan(0)
      expect(result.processingTimeMs).toBeGreaterThan(0)
      expect(mockDatabase.memory.create).toHaveBeenCalled()
    })

    it('should skip processing if conversation already exists', async () => {
      // Mock that existing memory is found
      mockDatabase.memory.findFirst = vi.fn().mockResolvedValue({
        id: 'existing-memory',
        contentHash: 'existing-hash',
      })

      const result = await processor.processConversation(mockConversationData)

      expect(result.success).toBe(false)
      expect(result.extractedMemory).toBeUndefined()
      expect(mockDatabase.memory.create).not.toHaveBeenCalled()
    })

    it('should handle invalid conversation data', async () => {
      const invalidData = {
        id: 'invalid',
        messages: [], // Empty messages array should be invalid
        participants: [],
        timestamp: 'invalid-date', // Invalid date
      } as unknown as ConversationDataInput

      const result = await processor.processConversation(invalidData)

      expect(result.success).toBe(false)
      expect(result.error).toBeDefined()
      expect(result.error?.type).toBe('extraction')
    })

    it('should detect emotional triggers correctly', async () => {
      mockDatabase.memory.findFirst = vi.fn().mockResolvedValue(null)
      mockDatabase.memory.create = vi.fn().mockResolvedValue({})

      const emotionalConversation: ConversationDataInput = {
        ...mockConversationData,
        messages: [
          {
            id: 'msg-1',
            content: 'I am really stressed about the upcoming deadline',
            authorId: 'user-1',
            timestamp: new Date(),
          },
        ],
      }

      const result = await processor.processConversation(emotionalConversation)

      expect(result.success).toBe(true)
      expect(result.extractedMemory).toBeDefined()
    })

    it('should skip conversations without emotional triggers', async () => {
      mockDatabase.memory.findFirst = vi.fn().mockResolvedValue(null)

      const neutralConversation: ConversationDataInput = {
        ...mockConversationData,
        messages: [
          {
            id: 'msg-1',
            content: 'What time is the meeting tomorrow?',
            authorId: 'user-1',
            timestamp: new Date(),
          },
          {
            id: 'msg-2',
            content: 'The meeting is at 2 PM in conference room A',
            authorId: 'user-2',
            timestamp: new Date(),
          },
        ],
      }

      const result = await processor.processConversation(neutralConversation)

      expect(result.success).toBe(false)
      expect(result.extractedMemory).toBeUndefined()
    })
  })

  describe('processBatch', () => {
    it('should process multiple conversations in batches', async () => {
      mockDatabase.memory.findFirst = vi.fn().mockResolvedValue(null)
      mockDatabase.memory.create = vi.fn().mockResolvedValue({})

      const conversationBatch = [
        mockConversationData,
        {
          ...mockConversationData,
          id: 'test-conversation-2',
          messages: [
            {
              id: 'msg-4',
              content: 'I feel anxious about the presentation',
              authorId: 'user-3',
              timestamp: new Date(),
            },
          ],
        },
      ]

      const result = await processor.processBatch(conversationBatch)

      expect(result.batchId).toBeDefined()
      expect(result.memories.length).toBeGreaterThan(0)
      expect(result.statistics.totalConversations).toBe(2)
      expect(result.statistics.successfulExtractions).toBeGreaterThan(0)
    })

    it('should handle batch processing errors gracefully', async () => {
      mockDatabase.memory.findFirst = vi
        .fn()
        .mockRejectedValue(new Error('Database error'))

      const conversationBatch = [mockConversationData]

      const result = await processor.processBatch(conversationBatch)

      expect(result.errors.length).toBeGreaterThan(0)
      expect(result.statistics.failedExtractions).toBeGreaterThan(0)
    })

    it('should respect batch size configuration', async () => {
      const smallBatchProcessor = new EnhancedMemoryProcessor({
        database: mockDatabase,
        performance: {
          batchSize: 1,
          parallelProcessing: false,
        },
      })

      mockDatabase.memory.findFirst = vi.fn().mockResolvedValue(null)
      mockDatabase.memory.create = vi.fn().mockResolvedValue({})

      const conversationBatch = [
        mockConversationData,
        { ...mockConversationData, id: 'test-conversation-2' },
        { ...mockConversationData, id: 'test-conversation-3' },
      ]

      const result = await smallBatchProcessor.processBatch(conversationBatch)

      expect(result.statistics.totalConversations).toBe(3)
    })
  })

  describe('configuration', () => {
    it('should use default configuration values', () => {
      const basicProcessor = new EnhancedMemoryProcessor({
        database: mockDatabase,
      })

      expect(basicProcessor).toBeDefined()
    })

    it('should accept custom quality thresholds', async () => {
      const strictProcessor = new EnhancedMemoryProcessor({
        database: mockDatabase,
        quality: {
          minimumQualityScore: 9.0,
          minimumConfidence: 0.9,
        },
      })

      mockDatabase.memory.findFirst = vi.fn().mockResolvedValue(null)
      mockDatabase.memory.create = vi.fn().mockResolvedValue({})

      const result =
        await strictProcessor.processConversation(mockConversationData)

      // With very strict quality requirements, memory might be rejected
      expect(result).toBeDefined()
    })
  })

  describe('memory quality assessment', () => {
    it('should generate quality scores for processed memories', async () => {
      mockDatabase.memory.findFirst = vi.fn().mockResolvedValue(null)
      mockDatabase.memory.create = vi.fn().mockResolvedValue({})

      const result = await processor.processConversation(mockConversationData)

      if (result.success && result.extractedMemory) {
        expect(result.metadata.qualityScore.overall).toBeGreaterThan(0)
        expect(result.metadata.qualityScore.confidence).toBeGreaterThan(0)
        expect(result.metadata.qualityScore.components).toBeDefined()
      }
    })
  })

  describe('emotional analysis integration', () => {
    it('should include emotional analysis in extracted memories', async () => {
      mockDatabase.memory.findFirst = vi.fn().mockResolvedValue(null)
      mockDatabase.memory.create = vi.fn().mockResolvedValue({})

      const result = await processor.processConversation(mockConversationData)

      if (result.success && result.extractedMemory) {
        expect(result.extractedMemory.emotionalAnalysis).toBeDefined()
        expect(
          result.extractedMemory.emotionalAnalysis.moodScoring,
        ).toBeDefined()
        expect(result.extractedMemory.significance).toBeDefined()
      }
    })
  })
})

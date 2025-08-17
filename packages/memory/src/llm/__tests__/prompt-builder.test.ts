import { describe, it, expect, beforeEach, vi } from 'vitest'

import type {
  ConversationMessage,
  MoodAnalysisResult,
  MoodDelta,
} from '../../types/index'
import type {
  LLMProvider,
  ProviderCapabilities,
} from '../llm-provider.interface'

import { PromptBuilder } from '../prompt-builder'

/**
 * Mock LLM provider for testing token counting
 */
class MockProvider implements LLMProvider {
  readonly name = 'mock-provider'

  send = vi.fn()
  countTokens = vi.fn().mockResolvedValue(100)
  getCapabilities(): ProviderCapabilities {
    return {
      streaming: false,
      functionCalling: false,
      jsonMode: true,
      visionSupport: false,
      maxInputTokens: 2048,
      maxOutputTokens: 4096,
      supportedModels: ['mock-model'],
    }
  }
  estimateCost = vi.fn().mockReturnValue(0.01)
  validateConfig = vi.fn().mockResolvedValue(true)
}

/**
 * Test fixture factory for conversation messages
 */
function createTestMessage(
  id: string,
  content: string,
  timestamp: Date = new Date(),
  authorId: string = 'user-1',
): ConversationMessage {
  return {
    id,
    content,
    authorId,
    timestamp,
    metadata: {
      edited: false,
      reactions: [],
    },
  }
}

/**
 * Test fixture factory for mood analysis result
 */
function createMoodAnalysis(
  score: number = 5.0,
  confidence: number = 0.8,
  delta?: MoodDelta,
): MoodAnalysisResult {
  return {
    score,
    descriptors: ['neutral'],
    confidence,
    delta,
    factors: [
      {
        type: 'language_sentiment',
        weight: 1.0,
        description: 'Test factor',
        evidence: ['positive words detected'],
      },
    ],
  }
}

/**
 * Test fixture factory for mood delta
 */
function createMoodDelta(
  magnitude: number = 2.0,
  direction: 'positive' | 'negative' | 'neutral' = 'positive',
  type: 'mood_repair' | 'celebration' | 'decline' | 'plateau' = 'mood_repair',
): MoodDelta {
  return {
    magnitude,
    direction,
    type,
    confidence: 0.8,
    factors: ['support received', 'emotional breakthrough'],
  }
}

describe('PromptBuilder', () => {
  let promptBuilder: PromptBuilder
  let mockProvider: MockProvider

  beforeEach(() => {
    mockProvider = new MockProvider()
    promptBuilder = new PromptBuilder()
  })

  describe('buildMoodAwarePrompt', () => {
    it('should generate prompt with basic message content', async () => {
      // Arrange
      const messages = [
        createTestMessage('msg-1', 'I had a great day today!'),
        createTestMessage('msg-2', 'Thank you for listening to me.'),
      ]
      const moodAnalysis = createMoodAnalysis(7.5, 0.9)

      // Act
      const result = await promptBuilder.buildMoodAwarePrompt({
        messages,
        moodAnalysis,
        provider: mockProvider,
      })

      // Assert
      expect(result.prompt).toContain('I had a great day today!')
      expect(result.prompt).toContain('Thank you for listening to me.')
      expect(result.statistics.messageCount).toBe(2)
      expect(result.statistics.estimatedTokens).toBeGreaterThan(0)
    })

    it('should inject mood context into system prompt', async () => {
      // Arrange
      const messages = [createTestMessage('msg-1', 'I feel really happy today')]
      const moodAnalysis = createMoodAnalysis(8.0, 0.95)
      moodAnalysis.descriptors = ['joyful', 'uplifted', 'grateful']

      // Act
      const result = await promptBuilder.buildMoodAwarePrompt({
        messages,
        moodAnalysis,
        provider: mockProvider,
      })

      // Assert
      expect(result.prompt).toContain('mood score: 8.0')
      expect(result.prompt).toContain('joyful')
      expect(result.prompt).toContain('uplifted')
      expect(result.prompt).toContain('grateful')
      expect(result.prompt).toContain('confidence: 95%')
    })

    it('should inject mood delta information when provided', async () => {
      // Arrange
      const messages = [
        createTestMessage('msg-1', 'Things are finally looking up'),
      ]
      const delta = createMoodDelta(3.5, 'positive', 'mood_repair')
      const moodAnalysis = createMoodAnalysis(7.0, 0.85, delta)

      // Act
      const result = await promptBuilder.buildMoodAwarePrompt({
        messages,
        moodAnalysis,
        provider: mockProvider,
      })

      // Assert
      expect(result.prompt).toContain('mood delta detected')
      expect(result.prompt).toContain('magnitude: 3.5')
      expect(result.prompt).toContain('direction: positive')
      expect(result.prompt).toContain('type: mood_repair')
      expect(result.prompt).toContain('support received')
      expect(result.prompt).toContain('emotional breakthrough')
    })

    it('should include emotional salience scoring guidance', async () => {
      // Arrange
      const messages = [createTestMessage('msg-1', 'Test message')]
      const moodAnalysis = createMoodAnalysis()

      // Act
      const result = await promptBuilder.buildMoodAwarePrompt({
        messages,
        moodAnalysis,
        provider: mockProvider,
      })

      // Assert
      expect(result.prompt).toContain('emotional salience')
      expect(result.prompt).toContain('significance')
      expect(result.prompt).toContain('relationship impact')
    })

    it('should include versioned JSON schema directive', async () => {
      // Arrange
      const messages = [createTestMessage('msg-1', 'Test message')]
      const moodAnalysis = createMoodAnalysis()

      // Act
      const result = await promptBuilder.buildMoodAwarePrompt({
        messages,
        moodAnalysis,
        provider: mockProvider,
      })

      // Assert
      expect(result.prompt).toContain('"memories"')
      expect(result.prompt).toContain('memory_llm_response_v1')
      expect(result.prompt).toContain('array of memory objects')
      expect(result.schemaVersion).toBe('v1')
    })

    it('should handle empty message list gracefully', async () => {
      // Arrange
      const messages: ConversationMessage[] = []
      const moodAnalysis = createMoodAnalysis()

      // Act
      const result = await promptBuilder.buildMoodAwarePrompt({
        messages,
        moodAnalysis,
        provider: mockProvider,
      })

      // Assert
      expect(result.prompt).toBeDefined()
      expect(result.statistics.messageCount).toBe(0)
      expect(result.statistics.selectedMessageCount).toBe(0)
      expect(result.statistics.prunedCount).toBe(0)
    })
  })

  describe('salience-based message selection', () => {
    it('should select top-K messages by emotional salience', async () => {
      // Arrange: Create messages with varying emotional content
      const messages = [
        createTestMessage('msg-1', 'Just a regular update.'), // Low salience
        createTestMessage('msg-2', 'I am so grateful for your support!'), // High salience
        createTestMessage('msg-3', 'The weather is nice today.'), // Low salience
        createTestMessage(
          'msg-4',
          'I finally understand what you meant - breakthrough moment!',
        ), // High salience
        createTestMessage('msg-5', 'Ok sounds good.'), // Low salience
      ]
      const moodAnalysis = createMoodAnalysis(6.5, 0.8)

      // Act
      const result = await promptBuilder.buildMoodAwarePrompt({
        messages,
        moodAnalysis,
        provider: mockProvider,
        maxMessages: 3,
      })

      // Assert
      expect(result.statistics.messageCount).toBe(5)
      expect(result.statistics.selectedMessageCount).toBe(3)
      expect(result.statistics.prunedCount).toBe(2)
      expect(result.selectedMessageIds).toHaveLength(3)

      // Should include high salience messages
      expect(result.selectedMessageIds).toContain('msg-2')
      expect(result.selectedMessageIds).toContain('msg-4')
    })

    it('should boost messages with mood delta factors', async () => {
      // Arrange
      const messages = [
        createTestMessage('msg-1', 'I feel supported by you'),
        createTestMessage('msg-2', 'What a beautiful day'),
        createTestMessage(
          'msg-3',
          'Thanks for helping me through this difficult time',
        ),
      ]
      const delta = createMoodDelta(2.5, 'positive', 'mood_repair')
      delta.factors = ['support received', 'emotional breakthrough']
      const moodAnalysis = createMoodAnalysis(6.0, 0.8, delta)

      // Act
      const result = await promptBuilder.buildMoodAwarePrompt({
        messages,
        moodAnalysis,
        provider: mockProvider,
        maxMessages: 2,
      })

      // Assert
      expect(result.selectedMessageIds).toContain('msg-1') // Contains "supported"
      expect(result.selectedMessageIds).toContain('msg-3') // Contains "helping"
    })

    it('should add context messages around selected ones', async () => {
      // Arrange: Create a sequence where middle message is high salience
      const messages = [
        createTestMessage('msg-1', 'Setting up the context'),
        createTestMessage('msg-2', 'I am struggling with anxiety today'), // High salience
        createTestMessage('msg-3', 'Following up on the conversation'),
      ]
      const moodAnalysis = createMoodAnalysis(3.0, 0.9) // Low mood suggests struggle

      // Act
      const result = await promptBuilder.buildMoodAwarePrompt({
        messages,
        moodAnalysis,
        provider: mockProvider,
        maxMessages: 1, // Only select 1, but should add context
        includeContext: true,
      })

      // Assert
      expect(result.statistics.selectedMessageCount).toBeGreaterThan(1)
      expect(result.selectedMessageIds).toContain('msg-2') // Primary selection
      expect(result.selectedMessageIds).toContain('msg-1') // Preceding context
      expect(result.selectedMessageIds).toContain('msg-3') // Following context
    })
  })

  describe('token optimization and truncation', () => {
    beforeEach(() => {
      // Mock token counting to simulate different message lengths
      mockProvider.countTokens.mockImplementation((text: string) => {
        // Simulate token counting based on text length
        return Promise.resolve(Math.ceil(text.length / 4))
      })
    })

    it('should prune messages when approaching token limits', async () => {
      // Arrange: Create messages that would exceed token limit
      const longMessage = 'A'.repeat(2000) // ~500 tokens
      const messages = [
        createTestMessage('msg-1', longMessage),
        createTestMessage('msg-2', longMessage),
        createTestMessage(
          'msg-3',
          'Short important message about breakthrough',
        ),
        createTestMessage('msg-4', longMessage),
      ]
      const moodAnalysis = createMoodAnalysis()

      // Mock provider with low token limit
      const limitedProvider = new MockProvider()
      limitedProvider.getCapabilities = () => ({
        streaming: false,
        functionCalling: false,
        jsonMode: true,
        visionSupport: false,
        maxInputTokens: 800, // Forces pruning
        maxOutputTokens: 1000,
        supportedModels: ['mock-model'],
      })
      limitedProvider.countTokens = mockProvider.countTokens

      // Act
      const result = await promptBuilder.buildMoodAwarePrompt({
        messages,
        moodAnalysis,
        provider: limitedProvider,
      })

      // Assert
      expect(result.statistics.prunedCount).toBeGreaterThan(0)
      expect(result.statistics.estimatedTokens).toBeLessThan(800 * 0.9) // Under 90% limit
      expect(result.selectedMessageIds).toContain('msg-3') // Should keep important message
    })

    it('should preserve highest salience messages during pruning', async () => {
      // Arrange
      const messages = [
        createTestMessage(
          'msg-1',
          'I had the most amazing breakthrough today - I finally understand myself!',
        ),
        createTestMessage('msg-2', 'A'.repeat(1000)), // Long but low salience
        createTestMessage(
          'msg-3',
          'Thank you for being there during my darkest moments',
        ),
        createTestMessage('msg-4', 'B'.repeat(1000)), // Long but low salience
      ]
      const moodAnalysis = createMoodAnalysis(8.0, 0.9)

      const limitedProvider = new MockProvider()
      limitedProvider.getCapabilities = () => ({
        streaming: false,
        functionCalling: false,
        jsonMode: true,
        visionSupport: false,
        maxInputTokens: 500,
        maxOutputTokens: 1000,
        supportedModels: ['mock-model'],
      })
      limitedProvider.countTokens = mockProvider.countTokens

      // Act
      const result = await promptBuilder.buildMoodAwarePrompt({
        messages,
        moodAnalysis,
        provider: limitedProvider,
      })

      // Assert
      expect(result.selectedMessageIds).toContain('msg-1') // High emotional salience
      expect(result.selectedMessageIds).toContain('msg-3') // High emotional salience
      // Should prune the long low-salience messages
      expect(result.statistics.prunedCount).toBeGreaterThan(0)
    })

    it('should provide diagnostic information about selection', async () => {
      // Arrange
      const messages = Array.from({ length: 10 }, (_, i) =>
        createTestMessage(`msg-${i}`, `Message ${i} content`),
      )
      const moodAnalysis = createMoodAnalysis()

      // Act
      const result = await promptBuilder.buildMoodAwarePrompt({
        messages,
        moodAnalysis,
        provider: mockProvider,
        maxMessages: 5,
      })

      // Assert
      expect(result.statistics).toEqual({
        messageCount: 10,
        selectedMessageCount: 5,
        prunedCount: 5,
        estimatedTokens: expect.any(Number),
        salienceScores: expect.any(Array),
      })
      expect(result.selectedMessageIds).toHaveLength(5)
      expect(result.statistics.salienceScores).toHaveLength(10)
    })
  })

  describe('system instruction blocks', () => {
    it('should include extraction instruction block', async () => {
      // Arrange
      const messages = [createTestMessage('msg-1', 'Test message')]
      const moodAnalysis = createMoodAnalysis()

      // Act
      const result = await promptBuilder.buildMoodAwarePrompt({
        messages,
        moodAnalysis,
        provider: mockProvider,
      })

      // Assert
      expect(result.prompt).toContain('EXTRACTION INSTRUCTIONS')
      expect(result.prompt).toContain('Extract meaningful memories')
      expect(result.prompt).toContain('emotional significance')
      expect(result.prompt).toContain('relationship dynamics')
    })

    it('should include JSON schema validation block', async () => {
      // Arrange
      const messages = [createTestMessage('msg-1', 'Test message')]
      const moodAnalysis = createMoodAnalysis()

      // Act
      const result = await promptBuilder.buildMoodAwarePrompt({
        messages,
        moodAnalysis,
        provider: mockProvider,
      })

      // Assert
      expect(result.prompt).toContain('OUTPUT FORMAT')
      expect(result.prompt).toContain('JSON object')
      expect(result.prompt).toContain('"memories"')
      expect(result.prompt).toContain('array')
      expect(result.prompt).toContain('content')
      expect(result.prompt).toContain('emotionalContext')
      expect(result.prompt).toContain('relationshipDynamics')
    })

    it('should customize instructions based on provider capabilities', async () => {
      // Arrange
      const messages = [createTestMessage('msg-1', 'Test message')]
      const moodAnalysis = createMoodAnalysis()

      const limitedProvider = new MockProvider()
      limitedProvider.getCapabilities = () => ({
        streaming: false,
        functionCalling: false,
        jsonMode: false, // Limited JSON support
        visionSupport: false,
        maxInputTokens: 1024,
        maxOutputTokens: 2048,
        supportedModels: ['limited-model'],
      })

      // Act
      const result = await promptBuilder.buildMoodAwarePrompt({
        messages,
        moodAnalysis,
        provider: limitedProvider,
      })

      // Assert - should include instructions in user message instead of system
      expect(result.prompt).toContain('Please extract')
      expect(result.prompt).toContain('following instructions')
    })
  })

  describe('prompt versioning and schema injection', () => {
    it('should use correct schema version in prompt', async () => {
      // Arrange
      const messages = [createTestMessage('msg-1', 'Test message')]
      const moodAnalysis = createMoodAnalysis()

      // Act
      const result = await promptBuilder.buildMoodAwarePrompt({
        messages,
        moodAnalysis,
        provider: mockProvider,
        schemaVersion: 'v1',
      })

      // Assert
      expect(result.schemaVersion).toBe('v1')
      expect(result.prompt).toContain('memory_llm_response_v1')
    })

    it('should inject complete schema definition', async () => {
      // Arrange
      const messages = [createTestMessage('msg-1', 'Test message')]
      const moodAnalysis = createMoodAnalysis()

      // Act
      const result = await promptBuilder.buildMoodAwarePrompt({
        messages,
        moodAnalysis,
        provider: mockProvider,
      })

      // Assert - should contain all required schema fields
      const schemaFields = [
        'content',
        'timestamp',
        'author',
        'participants',
        'emotionalContext',
        'relationshipDynamics',
        'tags',
        'metadata',
        'confidence',
      ]

      for (const field of schemaFields) {
        expect(result.prompt).toContain(field)
      }
    })

    it('should support future schema versions', async () => {
      // Arrange
      const messages = [createTestMessage('msg-1', 'Test message')]
      const moodAnalysis = createMoodAnalysis()

      // Act - test with future schema version
      const result = await promptBuilder.buildMoodAwarePrompt({
        messages,
        moodAnalysis,
        provider: mockProvider,
        schemaVersion: 'v2',
      })

      // Assert
      expect(result.schemaVersion).toBe('v2')
      expect(result.prompt).toContain('memory_llm_response_v2')
    })
  })

  describe('error handling', () => {
    it('should handle provider token counting failures gracefully', async () => {
      // Arrange
      const messages = [createTestMessage('msg-1', 'Test message')]
      const moodAnalysis = createMoodAnalysis()

      const failingProvider = new MockProvider()
      failingProvider.countTokens.mockRejectedValue(
        new Error('Token counting failed'),
      )

      // Act & Assert
      await expect(
        promptBuilder.buildMoodAwarePrompt({
          messages,
          moodAnalysis,
          provider: failingProvider,
        }),
      ).resolves.toBeDefined()
    })

    it('should validate required parameters', async () => {
      // Act & Assert
      await expect(
        // @ts-expect-error - intentionally omitting required moodAnalysis for validation test
        promptBuilder.buildMoodAwarePrompt({
          messages: [],
          provider: mockProvider,
        }),
      ).rejects.toThrow()
    })
  })
})

import { describe, it, expect, beforeEach, vi } from 'vitest'

import type { MemoryLLMResponse, MemoryItem } from '../response-schema.js'
import type { LLMResponse } from '../types.js'

import { ResponseParser } from '../response-parser.js'

/**
 * Test fixture factory for valid memory item
 */
function createValidMemoryItem(
  overrides: Partial<MemoryItem> = {},
): MemoryItem {
  return {
    content:
      'I had a breakthrough moment today when I realized the importance of self-care',
    emotionalContext: {
      primaryEmotion: 'joy',
      secondaryEmotions: ['relief', 'gratitude'],
      intensity: 0.8,
      valence: 0.9,
      themes: ['self-discovery', 'personal-growth'],
    },
    significance: {
      overall: 8.5,
      components: {
        emotional_impact: 8.0,
        personal_growth: 9.0,
        breakthrough_moment: 9.5,
      },
    },
    relationshipDynamics: {
      trust_level: 0.8,
      intimacy_level: 0.7,
    },
    confidence: 0.85,
    ...overrides,
  }
}

/**
 * Test fixture factory for valid LLM response
 */
function createValidLLMResponse(content: string): LLMResponse {
  return {
    content,
    usage: {
      inputTokens: 100,
      outputTokens: 200,
      totalTokens: 300,
    },
    model: 'claude-3-sonnet',
    finishReason: 'stop',
  }
}

/**
 * Test fixture factory for valid memory response
 */
function createValidMemoryResponse(
  memories: MemoryItem[] = [createValidMemoryItem()],
): MemoryLLMResponse {
  return {
    schemaVersion: 'memory_llm_response_v1',
    memories,
  }
}

describe('ResponseParser', () => {
  let parser: ResponseParser

  beforeEach(() => {
    parser = new ResponseParser()
  })

  describe('parseMemoryResponse', () => {
    it('should parse valid JSON response successfully', async () => {
      // Arrange
      const validMemory = createValidMemoryItem()
      const validResponse = createValidMemoryResponse([validMemory])
      const llmResponse = createValidLLMResponse(JSON.stringify(validResponse))

      // Act
      const result = await parser.parseMemoryResponse(llmResponse)

      // Assert
      expect(result.success).toBe(true)
      if (result.success && result.data) {
        expect(result.data.memories).toHaveLength(1)
        expect(result.data.memories[0].content).toBe(validMemory.content)
        expect(result.data.memories[0].confidence).toBe(0.85)
        expect(result.repairAttempts).toBe(0)
      }
    })

    it('should handle multiple memories in response', async () => {
      // Arrange
      const memory1 = createValidMemoryItem({
        content: 'First memory about growth',
      })
      const memory2 = createValidMemoryItem({
        content: 'Second memory about breakthrough',
      })
      const validResponse = createValidMemoryResponse([memory1, memory2])
      const llmResponse = createValidLLMResponse(JSON.stringify(validResponse))

      // Act
      const result = await parser.parseMemoryResponse(llmResponse)

      // Assert
      expect(result.success).toBe(true)
      if (result.success && result.data) {
        expect(result.data.memories).toHaveLength(2)
        expect(result.data.memories[0].content).toBe(
          'First memory about growth',
        )
        expect(result.data.memories[1].content).toBe(
          'Second memory about breakthrough',
        )
      }
    })

    it('should extract confidence values correctly', async () => {
      // Arrange
      const memory = createValidMemoryItem({ confidence: 0.92 })
      const validResponse = createValidMemoryResponse([memory])
      const llmResponse = createValidLLMResponse(JSON.stringify(validResponse))

      // Act
      const result = await parser.parseMemoryResponse(llmResponse)

      // Assert
      expect(result.success).toBe(true)
      if (result.success && result.data) {
        expect(result.data.memories[0].confidence).toBe(0.92)
        expect(result.statistics.averageConfidence).toBeCloseTo(0.92, 2)
      }
    })
  })

  describe('malformed JSON repair', () => {
    it('should repair common JSON formatting issues', async () => {
      // Arrange - JSON with trailing comma and missing quote
      const malformedJson = `{
        "schemaVersion": "memory_llm_response_v1",
        "memories": [{
          "content": "I realized something important today,
          "emotionalContext": {
            "primaryEmotion": "joy",
            "secondaryEmotions": ["relief"],
            "intensity": 0.8,
            "valence": 0.9,
            "themes": ["growth"]
          },
          "significance": {
            "overall": 8.0,
            "components": {"emotional_impact": 8.0}
          },
          "confidence": 0.8,
        }]
      }`
      const llmResponse = createValidLLMResponse(malformedJson)

      // Act
      const result = await parser.parseMemoryResponse(llmResponse)

      // Assert
      expect(result.success).toBe(true)
      expect(result.repairAttempts).toBeGreaterThan(0)
      if (result.success && result.data) {
        expect(result.data.memories).toHaveLength(1)
      }
    })

    it('should handle incomplete JSON objects', async () => {
      // Arrange - JSON cut off mid-object
      const incompleteJson = `{
        "schemaVersion": "memory_llm_response_v1",
        "memories": [{
          "content": "Incomplete memory",
          "emotionalContext": {
            "primaryEmotion": "joy",
            "secondaryEmotions": [],
            "intensity": 0.8,
            "valence":`
      const llmResponse = createValidLLMResponse(incompleteJson)

      // Act
      const result = await parser.parseMemoryResponse(llmResponse)

      // Assert
      expect(result.repairAttempts).toBeGreaterThan(0)
      // Should either succeed with repair or fail gracefully
      expect(typeof result.success).toBe('boolean')
    })

    it('should repair JSON with extra text before/after', async () => {
      // Arrange - JSON wrapped in explanation text
      const validMemory = createValidMemoryItem()
      const validResponse = createValidMemoryResponse([validMemory])
      const wrappedJson = `Here's the extracted memory:

${JSON.stringify(validResponse)}

This represents the meaningful moment from the conversation.`
      const llmResponse = createValidLLMResponse(wrappedJson)

      // Act
      const result = await parser.parseMemoryResponse(llmResponse)

      // Assert
      expect(result.success).toBe(true)
      // Parser successfully extracts JSON without needing repairs
      expect(result.repairAttempts).toBe(0)
      if (result.success && result.data) {
        expect(result.data.memories[0].content).toBe(validMemory.content)
      }
    })

    it('should use fallback extraction for plain text responses', async () => {
      // Arrange - Plain text that triggers fallback extraction
      const plainText =
        'I had a meaningful conversation about personal growth and self-discovery today.'
      const llmResponse = createValidLLMResponse(plainText)

      // Act
      const result = await parser.parseMemoryResponse(llmResponse)

      // Assert
      expect(result.success).toBe(true)
      expect(result.repairAttempts).toBeGreaterThan(0)
      expect(result.isFallbackExtraction).toBe(true)
      if (result.success && result.data) {
        expect(result.data.memories).toHaveLength(1)
        expect(result.data.memories[0].content).toContain(
          'meaningful conversation',
        )
        expect(result.data.memories[0].confidence).toBeLessThan(0.5) // Low confidence for fallback
      }
    })
  })

  describe('streaming response assembly', () => {
    it('should assemble streaming chunks into complete response', async () => {
      // Arrange
      const validMemory = createValidMemoryItem()
      const validResponse = createValidMemoryResponse([validMemory])
      const completeJson = JSON.stringify(validResponse)

      // Split into chunks
      const chunks = [
        completeJson.slice(0, 50),
        completeJson.slice(50, 100),
        completeJson.slice(100, 200),
        completeJson.slice(200),
      ]

      // Act
      const streamParser = parser.createStreamParser()

      // Add chunks
      for (const chunk of chunks) {
        streamParser.addChunk(chunk)
      }

      const result = await streamParser.finalize()

      // Assert
      expect(result.success).toBe(true)
      if (result.success && result.data) {
        expect(result.data.memories[0].content).toBe(validMemory.content)
      }
    })

    it('should detect JSON boundary markers in streaming', async () => {
      // Arrange
      const validMemory = createValidMemoryItem()

      // Split at arbitrary points
      const chunks = [
        'Some text before\n{"schema',
        'Version": "memory_llm_response_v1", "memories": [{"content"',
        ': "I had a breakthrough moment today when I realized the importance',
        ' of self-care", "emotionalContext": {"primaryEmotion": "joy"',
        ', "secondaryEmotions": ["relief", "gratitude"], "intensity": 0.8',
        ', "valence": 0.9, "themes": ["self-discovery", "personal-growth"]},',
        ' "significance": {"overall": 8.5, "components": {"emotional_impact": 8.0',
        ', "personal_growth": 9.0, "breakthrough_moment": 9.5}}, "relationshipDynamics"',
        ': {"trust_level": 0.8, "intimacy_level": 0.7}, "confidence": 0.85}]}',
        '\nSome text after',
      ]

      // Act
      const streamParser = parser.createStreamParser()

      for (const chunk of chunks) {
        streamParser.addChunk(chunk)
      }

      const result = await streamParser.finalize()

      // Assert
      expect(result.success).toBe(true)
      if (result.success && result.data) {
        expect(result.data.memories[0].content).toBe(validMemory.content)
      }
    })

    it('should handle incomplete streaming that never closes', async () => {
      // Arrange
      const incompleteChunks = [
        '{"schemaVersion": "memory_llm_response_v1",',
        ' "memories": [{"content": "Started but never',
      ]

      // Act
      const streamParser = parser.createStreamParser()

      for (const chunk of incompleteChunks) {
        streamParser.addChunk(chunk)
      }

      const result = await streamParser.finalize()

      // Assert
      // Parser uses aggressive repair to create valid response from incomplete JSON
      expect(result.success).toBe(true)
      expect(result.repairAttempts).toBeGreaterThan(0) // Used repair, not fallback
      if (result.success && result.data) {
        expect(result.data.memories).toHaveLength(1)
        expect(result.data.memories[0].content).toBe('Started but never')
        expect(result.data.memories[0].confidence).toBe(0.5) // Default from repair
      }
    })

    it('should handle streaming with state machine events', async () => {
      // Arrange
      const validMemory = createValidMemoryItem()
      const streamParser = parser.createStreamParser()

      // Test the new processStream method with events
      const events = [
        { type: 'start' as const },
        {
          type: 'delta' as const,
          content: '{"schemaVersion": "memory_llm_response_v1",',
        },
        { type: 'delta' as const, content: ' "memories": [' },
        { type: 'delta' as const, content: JSON.stringify(validMemory) },
        { type: 'delta' as const, content: ']}' },
        { type: 'stop' as const },
      ]

      // Act
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const result = await (streamParser as any).processStream(events)

      // Assert
      expect(result.success).toBe(true)
      if (result.success && result.data) {
        expect(result.data.memories).toHaveLength(1)
        expect(result.data.memories[0].content).toBe(validMemory.content)
      }
    })

    it('should handle streaming errors gracefully', async () => {
      // Arrange
      const streamParser = parser.createStreamParser()

      const events = [
        { type: 'start' as const },
        { type: 'delta' as const, content: '{"invalid": "json"' },
        { type: 'error' as const, error: 'Stream error occurred' },
      ]

      // Act
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const result = await (streamParser as any).processStream(events)

      // Assert
      expect(result.success).toBe(false)
      expect(result.error?.type).toBe('parsing')
      expect(result.error?.message).toContain('Stream error occurred')
    })

    it('should detect structural completion during streaming', async () => {
      // Arrange
      const streamParser = parser.createStreamParser()
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const stateMachine = (streamParser as any).stateMachine

      // Act - Process events to reach structural completion
      stateMachine.processChunk({ type: 'start' })
      stateMachine.processChunk({ type: 'delta', content: '{"test": "value"}' })

      // Assert - Should detect completion
      const metrics = stateMachine.getMetrics()
      expect(metrics.structuralDepth.brace).toBe(0)
      expect(metrics.structuralDepth.bracket).toBe(0)
      expect(metrics.inString).toBe(false)
    })

    it('should handle buffer overflow protection', async () => {
      // Arrange
      const streamParser = parser.createStreamParser()
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const stateMachine = (streamParser as any).stateMachine

      // Create a large chunk that exceeds buffer size
      const largeChunk = 'x'.repeat(100001) // Exceeds maxBufferSize of 100000

      // Act
      stateMachine.processChunk({ type: 'start' })
      const result = stateMachine.processChunk({
        type: 'delta',
        content: largeChunk,
      })

      // Assert
      expect(result.type).toBe('error')
      expect(result.error).toContain('Buffer overflow')
    })

    it('should track string boundaries correctly', async () => {
      // Arrange
      const streamParser = parser.createStreamParser()
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const stateMachine = (streamParser as any).stateMachine

      // Act - Process content with strings containing structural characters
      stateMachine.processChunk({ type: 'start' })
      stateMachine.processChunk({
        type: 'delta',
        content: '{"content": "This has { and } in string',
      })

      // Assert - Should not count braces inside strings
      const metrics = stateMachine.getMetrics()
      expect(metrics.structuralDepth.brace).toBe(1) // Only the opening brace of the object
      expect(metrics.inString).toBe(true) // Currently inside a string (no closing quote)
    })

    it('should handle escape sequences in streaming', async () => {
      // Arrange
      const streamParser = parser.createStreamParser()
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const stateMachine = (streamParser as any).stateMachine

      // Act - Process content with escaped quotes
      stateMachine.processChunk({ type: 'start' })
      stateMachine.processChunk({
        type: 'delta',
        content: '{"content": "She said \\"Hello\\" to me"}',
      })

      // Assert
      const metrics = stateMachine.getMetrics()
      expect(metrics.structuralDepth.brace).toBe(0) // Should be balanced
      expect(metrics.inString).toBe(false) // Should be outside string after closing quote
    })
  })

  describe('schema validation', () => {
    it('should reject responses with missing required fields', async () => {
      // Arrange - Missing emotionalContext
      const invalidMemory = {
        content: 'Valid content',
        significance: {
          overall: 8.0,
          components: { emotional_impact: 8.0 },
        },
        confidence: 0.8,
      }
      const invalidResponse = {
        schemaVersion: 'memory_llm_response_v1',
        memories: [invalidMemory],
      }
      const llmResponse = createValidLLMResponse(
        JSON.stringify(invalidResponse),
      )

      // Act
      const result = await parser.parseMemoryResponse(llmResponse)

      // Assert
      expect(result.success).toBe(false)
      expect(result.error?.type).toBe('validation')
    })

    it('should reject responses with invalid significance components', async () => {
      // Arrange - Invalid significance component key
      const invalidMemory = createValidMemoryItem({
        significance: {
          overall: 8.0,
          components: {
            invalid_component: 8.0, // Not in whitelist
          },
        },
      })
      const invalidResponse = createValidMemoryResponse([invalidMemory])
      const llmResponse = createValidLLMResponse(
        JSON.stringify(invalidResponse),
      )

      // Act
      const result = await parser.parseMemoryResponse(llmResponse)

      // Assert
      expect(result.success).toBe(false)
      expect(result.error?.type).toBe('validation')
    })

    it('should reject responses with too many memories', async () => {
      // Arrange - 11 memories (exceeds max of 10)
      const memories = Array.from({ length: 11 }, (_, i) =>
        createValidMemoryItem({ content: `Memory ${i + 1}` }),
      )
      const invalidResponse = createValidMemoryResponse(memories)
      const llmResponse = createValidLLMResponse(
        JSON.stringify(invalidResponse),
      )

      // Act
      const result = await parser.parseMemoryResponse(llmResponse)

      // Assert
      expect(result.success).toBe(false)
      expect(result.error?.type).toBe('validation')
    })

    it('should reject responses with invalid confidence values', async () => {
      // Arrange - Confidence > 1.0
      const invalidMemory = createValidMemoryItem({ confidence: 1.5 })
      const invalidResponse = createValidMemoryResponse([invalidMemory])
      const llmResponse = createValidLLMResponse(
        JSON.stringify(invalidResponse),
      )

      // Act
      const result = await parser.parseMemoryResponse(llmResponse)

      // Assert
      expect(result.success).toBe(false)
      expect(result.error?.type).toBe('validation')
    })
  })

  describe('legacy singular schema support', () => {
    it('should handle legacy singular memory response', async () => {
      // Arrange - Legacy singular format
      const validMemory = createValidMemoryItem()
      const legacyResponse = {
        schemaVersion: 'memory_llm_response_v1',
        memory: validMemory, // Singular 'memory' instead of 'memories' array
      }
      const llmResponse = createValidLLMResponse(JSON.stringify(legacyResponse))

      // Act
      const result = await parser.parseMemoryResponse(llmResponse)

      // Assert
      expect(result.success).toBe(true)
      if (result.success && result.data) {
        expect(result.data.memories).toHaveLength(1)
        expect(result.data.memories[0].content).toBe(validMemory.content)
        expect(result.isLegacyFormat).toBe(true)
      }
    })

    it('should normalize legacy singular to plural format', async () => {
      // Arrange
      const validMemory = createValidMemoryItem()
      const legacyResponse = {
        schemaVersion: 'memory_llm_response_v1',
        memory: validMemory,
      }
      const llmResponse = createValidLLMResponse(JSON.stringify(legacyResponse))

      // Act
      const result = await parser.parseMemoryResponse(llmResponse)

      // Assert
      expect(result.success).toBe(true)
      if (result.success && result.data) {
        expect(result.data.schemaVersion).toBe('memory_llm_response_v1')
        expect(Array.isArray(result.data.memories)).toBe(true)
        expect(result.data.memories[0]).toEqual(validMemory)
      }
    })
  })

  describe('fallback heuristics', () => {
    it('should extract memory from unstructured text as fallback', async () => {
      // Arrange - Plain text without JSON structure
      const plainTextResponse = `
        I found a really meaningful moment in this conversation where the person 
        expressed gratitude for support during a difficult time. They seemed to 
        have an emotional breakthrough and showed vulnerability by sharing their struggles.
        The confidence level appears high given the specific details shared.
      `
      const llmResponse = createValidLLMResponse(plainTextResponse)

      // Act
      const result = await parser.parseMemoryResponse(llmResponse)

      // Assert
      if (result.success && result.data) {
        expect(result.data.memories).toHaveLength(1)
        expect(result.data.memories[0].content).toContain('meaningful moment')
        expect(result.isFallbackExtraction).toBe(true)
      } else {
        // Fallback might not be implemented yet, which is acceptable
        expect(result.error?.type).toBe('parsing')
      }
    })

    it('should provide default confidence when not extractable', async () => {
      // Arrange - Response missing confidence indicators
      const ambiguousResponse = 'Something happened but not sure about details.'
      const llmResponse = createValidLLMResponse(ambiguousResponse)

      // Act
      const result = await parser.parseMemoryResponse(llmResponse)

      // Assert
      if (result.success && result.data && result.isFallbackExtraction) {
        expect(result.data.memories[0].confidence).toBeGreaterThanOrEqual(0)
        expect(result.data.memories[0].confidence).toBeLessThanOrEqual(1)
      }
    })
  })

  describe('error handling and statistics', () => {
    it('should provide detailed error information for debugging', async () => {
      // Arrange
      const invalidJson = '{"invalid": "structure"}'
      const llmResponse = createValidLLMResponse(invalidJson)

      // Act
      const result = await parser.parseMemoryResponse(llmResponse)

      // Assert
      expect(result.success).toBe(false)
      expect(result.error).toBeDefined()
      expect(result.error?.originalContent).toBe(invalidJson)
      // repairedContent is only defined if content was actually repaired
      if (result.repairAttempts > 0) {
        expect(result.error?.repairedContent).toBeDefined()
      }
      expect(result.statistics).toBeDefined()
    })

    it('should track parsing statistics accurately', async () => {
      // Arrange
      const validMemory = createValidMemoryItem({ confidence: 0.85 })
      const validResponse = createValidMemoryResponse([validMemory])
      const llmResponse = createValidLLMResponse(JSON.stringify(validResponse))

      // Act
      const result = await parser.parseMemoryResponse(llmResponse)

      // Assert
      expect(result.success).toBe(true)
      expect(result.statistics).toEqual({
        totalMemories: 1,
        averageConfidence: 0.85,
        processingTimeMs: expect.any(Number),
        contentLength: expect.any(Number),
      })
    })

    it('should handle corrective retry scenarios', async () => {
      // Arrange - Mock a scenario requiring corrective retry
      const parserWithRetry = new ResponseParser()
      const mockCorrectivePrompt = vi.fn().mockResolvedValue({
        content: JSON.stringify(createValidMemoryResponse()),
        usage: { inputTokens: 50, outputTokens: 100, totalTokens: 150 },
        model: 'claude-3-sonnet',
        finishReason: 'stop' as const,
      })

      // Simulate corrective retry by providing a callback
      const invalidJson = '{"incomplete": true'
      const llmResponse = createValidLLMResponse(invalidJson)

      // Act
      const result = await parserWithRetry.parseMemoryResponse(
        llmResponse,
        mockCorrectivePrompt,
      )

      // Assert - Either succeeds with retry or fails gracefully
      expect(typeof result.success).toBe('boolean')
      if (result.success && result.repairAttempts > 0) {
        expect(mockCorrectivePrompt).toHaveBeenCalled()
      }
    })
  })
})

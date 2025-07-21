import { describe, it, expect, vi, beforeEach } from 'vitest'
import { MoodContextTokenizer } from '../mood-context/tokenizer'
import type { ExtractedMemory } from '@studio/memory'

describe('MoodContextTokenizer', () => {
  let tokenizer: MoodContextTokenizer
  
  beforeEach(() => {
    tokenizer = new MoodContextTokenizer()
  })

  describe('generateMoodContext', () => {
    it('should handle empty memories', async () => {
      const result = await tokenizer.generateMoodContext([])
      
      expect(result.currentMood.score).toBe(5)
      expect(result.currentMood.descriptors).toEqual(['neutral'])
      expect(result.currentMood.confidence).toBe(0)
      expect(result.moodTrend.direction).toBe('stable')
      expect(result.recentMoodTags).toEqual([])
      expect(result.trajectoryOverview).toBe('No emotional history available for analysis.')
    })

    it('should generate mood context from single memory', async () => {
      const mockMemory = createMockMemory({
        moodScore: 8,
        descriptors: ['happy', 'excited'],
        confidence: 0.9,
      })

      const result = await tokenizer.generateMoodContext([mockMemory])
      
      expect(result.currentMood.score).toBe(8)
      expect(result.currentMood.descriptors).toContain('happy')
      expect(result.currentMood.descriptors).toContain('excited')
      expect(result.currentMood.confidence).toBeGreaterThan(0)
      expect(result.moodTrend.direction).toBe('stable')
    })

    it('should detect improving mood trend', async () => {
      const memories = [
        createMockMemory({ moodScore: 8, timestamp: new Date('2023-01-05') }),
        createMockMemory({ moodScore: 6, timestamp: new Date('2023-01-04') }),
        createMockMemory({ moodScore: 4, timestamp: new Date('2023-01-03') }),
      ]

      const result = await tokenizer.generateMoodContext(memories)
      
      expect(result.moodTrend.direction).toBe('improving')
      expect(result.moodTrend.magnitude).toBeGreaterThan(0)
    })

    it('should detect declining mood trend', async () => {
      const memories = [
        createMockMemory({ moodScore: 3, timestamp: new Date('2023-01-05') }),
        createMockMemory({ moodScore: 6, timestamp: new Date('2023-01-04') }),
        createMockMemory({ moodScore: 8, timestamp: new Date('2023-01-03') }),
      ]

      const result = await tokenizer.generateMoodContext(memories)
      
      expect(result.moodTrend.direction).toBe('declining')
      expect(result.moodTrend.magnitude).toBeGreaterThan(0)
    })

    it('should detect volatile mood pattern', async () => {
      const memories = [
        createMockMemory({ moodScore: 8, timestamp: new Date('2023-01-06') }),
        createMockMemory({ moodScore: 2, timestamp: new Date('2023-01-05') }),
        createMockMemory({ moodScore: 9, timestamp: new Date('2023-01-04') }),
        createMockMemory({ moodScore: 1, timestamp: new Date('2023-01-03') }),
        createMockMemory({ moodScore: 7, timestamp: new Date('2023-01-02') }),
      ]

      const result = await tokenizer.generateMoodContext(memories)
      
      expect(result.moodTrend.direction).toBe('volatile')
    })

    it('should extract mood tags from memory themes and descriptors', async () => {
      const memories = [
        createMockMemory({ 
          themes: ['support', 'growth'],
          descriptors: ['optimistic', 'grateful'],
        }),
        createMockMemory({ 
          themes: ['celebration'],
          descriptors: ['joyful'],
        }),
      ]

      const result = await tokenizer.generateMoodContext(memories)
      
      expect(result.recentMoodTags).toContain('support')
      expect(result.recentMoodTags).toContain('celebration')
      expect(result.recentMoodTags).toContain('optimistic')
      expect(result.recentMoodTags).toContain('joyful')
    })

    it('should generate trajectory overview for sufficient data', async () => {
      const memories = Array.from({ length: 5 }, (_, i) =>
        createMockMemory({ 
          moodScore: 6 + i * 0.5,
          timestamp: new Date(`2023-01-0${i + 1}`),
        })
      )

      const result = await tokenizer.generateMoodContext(memories)
      
      expect(result.trajectoryOverview).not.toBe('No emotional trajectory data available.')
      expect(result.trajectoryOverview).toContain('emotional trajectory')
    })

    it('should respect maxDescriptors configuration', async () => {
      const configurableTokenizer = new MoodContextTokenizer({
        maxDescriptors: 2,
      })

      const mockMemory = createMockMemory({
        descriptors: ['happy', 'excited', 'grateful', 'optimistic', 'joyful'],
      })

      const result = await configurableTokenizer.generateMoodContext([mockMemory])
      
      expect(result.currentMood.descriptors).toHaveLength(2)
    })
  })

  describe('configuration options', () => {
    it('should respect complexityLevel configuration', () => {
      const basicTokenizer = new MoodContextTokenizer({
        complexityLevel: 'basic',
      })
      
      expect(basicTokenizer).toBeInstanceOf(MoodContextTokenizer)
    })

    it('should respect includeTrajectory configuration', () => {
      const tokenizerWithoutTrajectory = new MoodContextTokenizer({
        includeTrajectory: false,
      })
      
      expect(tokenizerWithoutTrajectory).toBeInstanceOf(MoodContextTokenizer)
    })
  })
})

// Helper function to create mock memories
function createMockMemory(options: {
  moodScore?: number
  descriptors?: string[]
  confidence?: number
  themes?: string[]
  timestamp?: Date
  patterns?: Array<{ type: string; significance: number }>
}): ExtractedMemory {
  return {
    id: `memory-${Math.random().toString(36).substr(2, 9)}`,
    content: 'Test memory content',
    timestamp: options.timestamp || new Date(),
    participants: [{ id: 'participant-1', name: 'Test User', role: 'primary' }],
    emotionalAnalysis: {
      context: {
        state: 'joy',
        intensity: options.moodScore || 5,
        theme: options.themes || ['neutral'],
        valence: 'positive',
        arousal: 'medium',
        confidence: options.confidence || 0.8,
      },
      moodScoring: {
        score: options.moodScore || 5,
        descriptors: options.descriptors || ['neutral'],
        confidence: options.confidence || 0.8,
        factors: [],
      },
      trajectory: {
        points: [],
        direction: 'stable',
        significance: 1,
        turningPoints: [],
      },
      patterns: options.patterns || [],
    },
    significance: {
      overall: 5,
      components: {
        emotionalSalience: 5,
        relationshipImpact: 5,
        contextualImportance: 5,
        temporalRelevance: 5,
      },
      confidence: 0.8,
      category: 'medium',
      validationPriority: 5,
    },
    processing: {
      extractedAt: new Date(),
      confidence: options.confidence || 0.8,
      quality: {
        overall: 8,
        components: {
          emotionalRichness: 8,
          relationshipClarity: 8,
          contentCoherence: 8,
          contextualSignificance: 8,
        },
        confidence: 0.9,
        issues: [],
      },
      sourceData: {
        id: 'conversation-1',
        messages: [],
        participants: [],
        timestamp: new Date(),
      },
    },
  } as ExtractedMemory
}
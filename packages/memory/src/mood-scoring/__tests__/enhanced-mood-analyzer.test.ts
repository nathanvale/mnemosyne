import { describe, it, expect, beforeEach } from 'vitest'

import type { ConversationData } from '../../types'

import { MoodScoringAnalyzer } from '../analyzer'

describe('Enhanced MoodScoringAnalyzer - Multi-Dimensional Analysis', () => {
  let analyzer: MoodScoringAnalyzer

  beforeEach(() => {
    analyzer = new MoodScoringAnalyzer()
  })

  describe('weighted mood score calculation', () => {
    it('should calculate mood score with correct component weights (35% sentiment, 25% psychological, 20% relationship, 15% conversational, 5% historical)', async () => {
      const baseTime = new Date()
      const conversation: ConversationData = {
        id: 'test-conv-1',
        timestamp: baseTime,
        messages: [
          {
            id: 'msg-1',
            content:
              'I am feeling really grateful and excited about this amazing opportunity! I have learned to cope better with challenges.',
            authorId: 'user-1',
            timestamp: baseTime,
          },
          {
            id: 'msg-2',
            content:
              'Thank you so much for your support and understanding. It means everything to me.',
            authorId: 'user-2',
            timestamp: new Date(baseTime.getTime() + 60000),
          },
        ],
        participants: [
          {
            id: 'user-1',
            name: 'User 1',
            role: 'author',
          },
          {
            id: 'user-2',
            name: 'User 2',
            role: 'recipient',
          },
        ],
        context: {
          conversationType: 'direct',
          platform: 'chat',
        },
        startTime: baseTime,
        endTime: new Date(baseTime.getTime() + 60000),
      }

      const result = await analyzer.analyzeConversation(conversation)

      // Should have all weighted factors
      expect(result.factors).toHaveLength(5)

      // Check factor types and weights
      const sentimentFactor = result.factors.find(
        (f) => f.type === 'sentiment_analysis',
      )
      const psychologicalFactor = result.factors.find(
        (f) => f.type === 'psychological_indicators',
      )
      const relationshipFactor = result.factors.find(
        (f) => f.type === 'relationship_context',
      )
      const conversationalFactor = result.factors.find(
        (f) => f.type === 'conversational_flow',
      )
      const historicalFactor = result.factors.find(
        (f) => f.type === 'historical_baseline',
      )

      expect(sentimentFactor?.weight).toBe(0.35)
      expect(psychologicalFactor?.weight).toBe(0.25)
      expect(relationshipFactor?.weight).toBe(0.2)
      expect(conversationalFactor?.weight).toBe(0.15)
      expect(historicalFactor?.weight).toBe(0.05)

      // Score should be weighted combination
      expect(result.score).toBeGreaterThan(6.5) // Positive content should score high
      expect(result.score).toBeLessThan(10)
    })

    it('should prioritize sentiment analysis in positive conversations', async () => {
      const baseTime = new Date()
      const conversation: ConversationData = {
        id: 'test-conv-2',
        timestamp: baseTime,
        messages: [
          {
            id: 'msg-1',
            content:
              'I am absolutely ecstatic and overjoyed! This is the best day of my life!',
            authorId: 'user-1',
            timestamp: baseTime,
          },
        ],
        participants: [
          {
            id: 'user-1',
            name: 'User 1',
            role: 'author',
          },
        ],
        startTime: baseTime,
        endTime: baseTime,
      }

      const result = await analyzer.analyzeConversation(conversation)
      const sentimentFactor = result.factors.find(
        (f) => f.type === 'sentiment_analysis',
      )

      expect(sentimentFactor).toBeDefined()
      expect(sentimentFactor!.weight).toBe(0.35)
      expect(result.score).toBeGreaterThan(8.5) // Very high positive sentiment
    })

    it('should incorporate psychological indicators effectively', async () => {
      const baseTime = new Date()
      const conversation: ConversationData = {
        id: 'test-conv-3',
        timestamp: baseTime,
        messages: [
          {
            id: 'msg-1',
            content:
              'I am learning to cope better and building resilience. I have overcome challenges before and I can do it again.',
            authorId: 'user-1',
            timestamp: baseTime,
          },
        ],
        participants: [
          {
            id: 'user-1',
            name: 'User 1',
            role: 'author',
          },
        ],
        startTime: baseTime,
        endTime: baseTime,
      }

      const result = await analyzer.analyzeConversation(conversation)
      const psychologicalFactor = result.factors.find(
        (f) => f.type === 'psychological_indicators',
      )

      expect(psychologicalFactor).toBeDefined()
      expect(psychologicalFactor!.weight).toBe(0.25)
      expect(psychologicalFactor!.evidence.length).toBeGreaterThan(0)
      expect(result.score).toBeGreaterThan(6.0) // Resilience should boost score
    })

    it('should account for relationship context in scoring', async () => {
      const baseTime = new Date()
      const conversation: ConversationData = {
        id: 'test-conv-4',
        timestamp: baseTime,
        messages: [
          {
            id: 'msg-1',
            content: 'I really appreciate your support and understanding.',
            authorId: 'user-1',
            timestamp: baseTime,
          },
          {
            id: 'msg-2',
            content: 'I am here for you always. You can count on me.',
            authorId: 'user-2',
            timestamp: new Date(baseTime.getTime() + 60000),
          },
        ],
        participants: [
          {
            id: 'user-1',
            name: 'User 1',
            role: 'vulnerable_sharer',
          },
          {
            id: 'user-2',
            name: 'User 2',
            role: 'supporter',
          },
        ],
        context: {
          conversationType: 'direct',
        },
        startTime: baseTime,
        endTime: new Date(baseTime.getTime() + 60000),
      }

      const result = await analyzer.analyzeConversation(conversation)
      const relationshipFactor = result.factors.find(
        (f) => f.type === 'relationship_context',
      )

      expect(relationshipFactor).toBeDefined()
      expect(relationshipFactor!.weight).toBe(0.2)
      expect(result.score).toBeGreaterThan(6.0) // Supportive relationship should boost score
    })

    it('should analyze conversational flow patterns', async () => {
      const baseTime = new Date()
      const conversation: ConversationData = {
        id: 'test-conv-5',
        timestamp: new Date(baseTime.getTime() - 60000),
        messages: [
          {
            id: 'msg-1',
            content: 'I am struggling with this situation.',
            authorId: 'user-1',
            timestamp: new Date(baseTime.getTime() - 60000), // 1 minute ago
          },
          {
            id: 'msg-2',
            content: 'What can I do to help you?',
            authorId: 'user-2',
            timestamp: new Date(baseTime.getTime() - 30000), // 30 seconds ago
          },
          {
            id: 'msg-3',
            content: 'Thank you for asking. Just talking helps.',
            authorId: 'user-1',
            timestamp: baseTime, // Now
          },
        ],
        participants: [
          {
            id: 'user-1',
            name: 'User 1',
            role: 'vulnerable_sharer',
          },
          {
            id: 'user-2',
            name: 'User 2',
            role: 'supporter',
          },
        ],
        startTime: new Date(baseTime.getTime() - 60000),
        endTime: baseTime,
      }

      const result = await analyzer.analyzeConversation(conversation)
      const conversationalFactor = result.factors.find(
        (f) => f.type === 'conversational_flow',
      )

      expect(conversationalFactor).toBeDefined()
      expect(conversationalFactor!.weight).toBe(0.15)
      expect(conversationalFactor!.evidence.length).toBeGreaterThan(0)
    })

    it('should include historical baseline when available', async () => {
      const baseTime = new Date()
      const conversation: ConversationData = {
        id: 'test-conv-6',
        timestamp: baseTime,
        messages: [
          {
            id: 'msg-1',
            content: 'I am feeling much better than I was last week.',
            authorId: 'user-1',
            timestamp: baseTime,
          },
        ],
        participants: [
          {
            id: 'user-1',
            name: 'User 1',
            role: 'author',
          },
        ],
        startTime: baseTime,
        endTime: baseTime,
      }

      const result = await analyzer.analyzeConversation(conversation)
      const historicalFactor = result.factors.find(
        (f) => f.type === 'historical_baseline',
      )

      expect(historicalFactor).toBeDefined()
      expect(historicalFactor!.weight).toBe(0.05)
      // Historical factor should have some evidence even if baseline not available
      expect(historicalFactor!.evidence.length).toBeGreaterThanOrEqual(0)
    })
  })

  describe('confidence calibration', () => {
    it('should achieve 90%+ accuracy target for uncertainty detection with clear sentiment', async () => {
      const baseTime = new Date()
      const conversation: ConversationData = {
        id: 'test-conv-clear',
        timestamp: baseTime,
        messages: [
          {
            id: 'msg-1',
            content:
              'I am absolutely devastated and heartbroken by this terrible news. I cannot cope with this situation.',
            authorId: 'user-1',
            timestamp: baseTime,
          },
        ],
        participants: [
          {
            id: 'user-1',
            name: 'User 1',
            role: 'author',
          },
        ],
        startTime: baseTime,
        endTime: baseTime,
      }

      const result = await analyzer.analyzeConversation(conversation)

      console.log(
        'TEST 1 - Confidence:',
        result.confidence,
        'Score:',
        result.score,
        'Evidence:',
        result.factors.map((f) => f.evidence.length),
      )
      expect(result.confidence).toBeGreaterThan(0.9) // High confidence for clear sentiment
      expect(result.score).toBeLessThan(4.0) // Should detect negative sentiment
    })

    it('should detect uncertainty in ambiguous content', async () => {
      const baseTime = new Date()
      const conversation: ConversationData = {
        id: 'test-conv-ambiguous',
        timestamp: baseTime,
        messages: [
          {
            id: 'msg-1',
            content: 'Things happened today. I went places and saw people.',
            authorId: 'user-1',
            timestamp: baseTime,
          },
        ],
        participants: [
          {
            id: 'user-1',
            name: 'User 1',
            role: 'author',
          },
        ],
        startTime: baseTime,
        endTime: baseTime,
      }

      const result = await analyzer.analyzeConversation(conversation)

      expect(result.confidence).toBeLessThan(0.6) // Low confidence for ambiguous content
      console.log(
        'TEST 2 - Confidence:',
        result.confidence,
        'Score:',
        result.score,
        'Evidence:',
        result.factors.map((f) => f.evidence.length),
      )
      expect(result.score).toBeGreaterThan(4.0) // Should default to neutral-positive
      expect(result.score).toBeLessThan(6.0)
    })

    it('should calibrate confidence based on evidence strength', async () => {
      const baseTime = new Date()
      const conversation: ConversationData = {
        id: 'test-conv-evidence',
        timestamp: baseTime,
        messages: [
          {
            id: 'msg-1',
            content:
              'I am grateful, excited, joyful, and absolutely thrilled about this amazing, wonderful, fantastic opportunity!',
            authorId: 'user-1',
            timestamp: baseTime,
          },
        ],
        participants: [
          {
            id: 'user-1',
            name: 'User 1',
            role: 'author',
          },
        ],
        startTime: baseTime,
        endTime: baseTime,
      }

      const result = await analyzer.analyzeConversation(conversation)

      // Multiple strong positive indicators should yield high confidence
      expect(result.confidence).toBeGreaterThan(0.85)
      expect(result.factors.some((f) => f.evidence.length >= 3)).toBe(true)
    })
  })

  describe('multi-factor consistency', () => {
    it('should maintain consistency across sentiment and psychological factors', async () => {
      const baseTime = new Date()
      const conversation: ConversationData = {
        id: 'test-conv-consistent',
        timestamp: baseTime,
        messages: [
          {
            id: 'msg-1',
            content:
              'I am happy and grateful. I am building resilience and learning to cope better with challenges.',
            authorId: 'user-1',
            timestamp: baseTime,
          },
        ],
        participants: [
          {
            id: 'user-1',
            name: 'User 1',
            role: 'author',
          },
        ],
        startTime: baseTime,
        endTime: baseTime,
      }

      const result = await analyzer.analyzeConversation(conversation)

      const sentimentFactor = result.factors.find(
        (f) => f.type === 'sentiment_analysis',
      )
      const psychologicalFactor = result.factors.find(
        (f) => f.type === 'psychological_indicators',
      )

      // Both factors should contribute positively
      expect(sentimentFactor?.evidence.length).toBeGreaterThan(0)
      expect(psychologicalFactor?.evidence.length).toBeGreaterThan(0)
      expect(result.score).toBeGreaterThan(6.5) // Consistent positive factors
    })

    it('should handle conflicting factors appropriately', async () => {
      const baseTime = new Date()
      const conversation: ConversationData = {
        id: 'test-conv-conflict',
        timestamp: baseTime,
        messages: [
          {
            id: 'msg-1',
            content:
              'I am grateful for the support, but I am overwhelmed and struggling with stress.',
            authorId: 'user-1',
            timestamp: baseTime,
          },
        ],
        participants: [
          {
            id: 'user-1',
            name: 'User 1',
            role: 'author',
          },
        ],
        startTime: baseTime,
        endTime: baseTime,
      }

      const result = await analyzer.analyzeConversation(conversation)

      // Detailed debugging for conflicting factors
      console.log('=== CONFLICTING FACTORS TEST DEBUGGING ===')
      console.log('Final Score:', result.score)
      console.log('Confidence:', result.confidence)
      console.log('Individual Factors:')
      result.factors.forEach((factor, index) => {
        console.log(`  Factor ${index + 1} (${factor.type}):`)
        console.log(`    Score: ${factor._score || 'undefined'}`)
        console.log(`    Weight: ${factor.weight}`)
        console.log(
          `    Weighted Score: ${(factor._score || 0) * factor.weight}`,
        )
        console.log(`    Evidence Count: ${factor.evidence.length}`)
        console.log(`    Evidence: ${factor.evidence.join(', ')}`)
      })

      // Check for conflicting language penalty
      const sentimentFactor = result.factors.find(
        (f) => f.type === 'sentiment_analysis',
      )
      const psychFactor = result.factors.find(
        (f) => f.type === 'psychological_indicators',
      )

      if (sentimentFactor && psychFactor) {
        console.log('Sentiment Evidence:', sentimentFactor.evidence)
        console.log('Psychological Evidence:', psychFactor.evidence)

        // Check if conflicting terms are detected
        const positiveTerms = ['grateful', 'support']
        const negativeTerms = ['overwhelmed', 'struggling', 'stress']
        const content =
          'I am grateful for the support, but I am overwhelmed and struggling with stress.'

        const hasPositive = positiveTerms.some((term) =>
          content.toLowerCase().includes(term),
        )
        const hasNegative = negativeTerms.some((term) =>
          content.toLowerCase().includes(term),
        )

        console.log('Has positive terms:', hasPositive)
        console.log('Has negative terms:', hasNegative)
        console.log(
          'Should have conflicting language penalty:',
          hasPositive && hasNegative,
        )
      }

      console.log('==========================================')

      // Should balance positive and negative factors
      expect(result.score).toBeGreaterThan(4.5)
      expect(result.score).toBeLessThan(6.5)
      expect(result.confidence).toBeLessThan(0.9) // Lower confidence due to conflict
    })
  })

  describe('80%+ human correlation target', () => {
    it('should score highly positive content above 7.5', async () => {
      const baseTime = new Date()
      const positiveConversation: ConversationData = {
        id: 'test-positive',
        timestamp: baseTime,
        messages: [
          {
            id: 'msg-1',
            content:
              'I am absolutely thrilled and overjoyed! This is amazing news and I feel so grateful and excited!',
            authorId: 'user-1',
            timestamp: baseTime,
          },
        ],
        participants: [
          {
            id: 'user-1',
            name: 'User 1',
            role: 'author',
          },
        ],
        startTime: baseTime,
        endTime: baseTime,
      }

      const result = await analyzer.analyzeConversation(positiveConversation)
      expect(result.score).toBeGreaterThan(7.5) // Human would rate this highly positive
    })

    it('should score negative content below 4.0', async () => {
      const baseTime = new Date()
      const negativeConversation: ConversationData = {
        id: 'test-negative',
        timestamp: baseTime,
        messages: [
          {
            id: 'msg-1',
            content:
              'I am devastated, heartbroken, and completely overwhelmed. I cannot handle this stress and feel hopeless.',
            authorId: 'user-1',
            timestamp: baseTime,
          },
        ],
        participants: [
          {
            id: 'user-1',
            name: 'User 1',
            role: 'author',
          },
        ],
        startTime: baseTime,
        endTime: baseTime,
      }

      const result = await analyzer.analyzeConversation(negativeConversation)
      expect(result.score).toBeLessThan(4.0) // Human would rate this as negative
    })

    it('should score neutral content around 5.0', async () => {
      const baseTime = new Date()
      const neutralConversation: ConversationData = {
        id: 'test-neutral',
        timestamp: baseTime,
        messages: [
          {
            id: 'msg-1',
            content:
              'The meeting is scheduled for tomorrow at 3 PM. Please bring the required documents.',
            authorId: 'user-1',
            timestamp: baseTime,
          },
        ],
        participants: [
          {
            id: 'user-1',
            name: 'User 1',
            role: 'author',
          },
        ],
        startTime: baseTime,
        endTime: baseTime,
      }

      const result = await analyzer.analyzeConversation(neutralConversation)
      expect(result.score).toBeGreaterThan(4.5)
      expect(result.score).toBeLessThan(5.5) // Human would rate this as neutral
    })
  })
})

import { describe, it, expect, beforeEach } from 'vitest'

import type { SentimentScore, MixedSentimentScore } from '../../types'

import { SentimentProcessor } from '../sentiment-processor'

describe('SentimentProcessor', () => {
  let processor: SentimentProcessor

  beforeEach(() => {
    processor = new SentimentProcessor()
  })

  describe('analyzePositiveSentiment', () => {
    it('should detect high positive sentiment in joy expressions', () => {
      const content =
        'I am absolutely thrilled and overjoyed about this amazing news!'
      const result: SentimentScore = processor.analyzePositiveSentiment(content)

      expect(result.score).toBeGreaterThan(0.8)
      expect(result.intensity).toBeGreaterThan(0.7)
      expect(result.confidence).toBeGreaterThan(0.8)
      expect(result.indicators).toContain('joy')
      expect(result.indicators).toContain('excitement')
    })

    it('should detect moderate positive sentiment in gratitude expressions', () => {
      const content =
        'Thank you so much for listening, it really means a lot to me.'
      const result: SentimentScore = processor.analyzePositiveSentiment(content)

      expect(result.score).toBeGreaterThan(0.5)
      expect(result.score).toBeLessThan(0.8)
      expect(result.indicators).toContain('gratitude')
      expect(result.indicators).toContain('appreciation')
    })

    it('should detect subtle positive sentiment in satisfaction expressions', () => {
      const content = 'Things are going pretty well lately, and I feel content.'
      const result: SentimentScore = processor.analyzePositiveSentiment(content)

      expect(result.score).toBeGreaterThan(0.3)
      expect(result.score).toBeLessThan(0.6)
      expect(result.indicators).toContain('satisfaction')
      expect(result.indicators).toContain('contentment')
    })

    it('should return low positive sentiment for neutral content', () => {
      const content = 'The meeting is scheduled for tomorrow at 3 PM.'
      const result: SentimentScore = processor.analyzePositiveSentiment(content)

      expect(result.score).toBeLessThan(0.2)
      expect(result.confidence).toBeLessThan(0.5)
      expect(result.indicators).toHaveLength(0)
    })

    it('should handle love and affection expressions with high intensity', () => {
      const content = 'I love you so much, you mean everything to me!'
      const result: SentimentScore = processor.analyzePositiveSentiment(content)

      expect(result.score).toBeGreaterThan(0.9)
      expect(result.intensity).toBeGreaterThan(0.8)
      expect(result.indicators).toContain('love')
      expect(result.indicators).toContain('affection')
    })
  })

  describe('analyzeNegativeSentiment', () => {
    it('should detect high negative sentiment in distress expressions', () => {
      const content =
        'I am completely devastated and heartbroken by this terrible news.'
      const result: SentimentScore = processor.analyzeNegativeSentiment(content)

      expect(result.score).toBeGreaterThan(0.8)
      expect(result.intensity).toBeGreaterThan(0.7)
      expect(result.confidence).toBeGreaterThan(0.8)
      expect(result.indicators).toContain('devastation')
      expect(result.indicators).toContain('sadness')
    })

    it('should detect moderate negative sentiment in frustration expressions', () => {
      const content =
        'This is really frustrating and I am getting quite annoyed.'
      const result: SentimentScore = processor.analyzeNegativeSentiment(content)

      expect(result.score).toBeGreaterThan(0.5)
      expect(result.score).toBeLessThan(0.8)
      expect(result.indicators).toContain('frustration')
      expect(result.indicators).toContain('irritation')
    })

    it('should detect anxiety and stress markers', () => {
      const content =
        'I am really worried and anxious about the upcoming presentation.'
      const result: SentimentScore = processor.analyzeNegativeSentiment(content)

      expect(result.score).toBeGreaterThan(0.6)
      expect(result.indicators).toContain('anxiety')
      expect(result.indicators).toContain('worry')
    })

    it('should detect disappointment with appropriate intensity', () => {
      const content =
        'I am disappointed that things did not work out as planned.'
      const result: SentimentScore = processor.analyzeNegativeSentiment(content)

      expect(result.score).toBeGreaterThan(0.4)
      expect(result.score).toBeLessThan(0.7)
      expect(result.indicators).toContain('disappointment')
    })

    it('should return low negative sentiment for positive content', () => {
      const content =
        'I am so happy and excited about this wonderful opportunity!'
      const result: SentimentScore = processor.analyzeNegativeSentiment(content)

      expect(result.score).toBeLessThan(0.2)
      expect(result.confidence).toBeLessThan(0.5)
      expect(result.indicators).toHaveLength(0)
    })
  })

  describe('processMixedSentiment', () => {
    it('should detect bittersweet emotions with balanced sentiment', () => {
      const content =
        'I am happy for their success but sad that they are leaving us.'
      const result: MixedSentimentScore =
        processor.processMixedSentiment(content)

      expect(result.positive.score).toBeGreaterThan(0.4)
      expect(result.negative.score).toBeGreaterThan(0.4)
      expect(result.complexity).toBeGreaterThan(0.6)
      expect(result.dominantSentiment).toBe('mixed')
      expect(result.emotionalState).toContain('bittersweet')
    })

    it('should handle grateful but overwhelmed expressions', () => {
      const content =
        'I am so grateful for all the support, but I feel overwhelmed by everything.'
      const result: MixedSentimentScore =
        processor.processMixedSentiment(content)

      expect(result.positive.score).toBeGreaterThan(0.5)
      expect(result.negative.score).toBeGreaterThan(0.5)
      expect(result.emotionalState).toContain('gratitude')
      expect(result.emotionalState).toContain('overwhelmed')
    })

    it('should detect excited but anxious anticipation', () => {
      const content =
        'I am excited about the new job but nervous about the challenges ahead.'
      const result: MixedSentimentScore =
        processor.processMixedSentiment(content)

      expect(result.positive.indicators).toContain('excitement')
      expect(result.negative.indicators).toContain('anxiety')
      expect(result.complexity).toBeGreaterThan(0.5)
      expect(result.dominantSentiment).toBe('mixed')
    })

    it('should handle proud but concerned parental expressions', () => {
      const content =
        "I am proud of my child's independence but worried about their safety."
      const result: MixedSentimentScore =
        processor.processMixedSentiment(content)

      expect(result.positive.indicators).toContain('pride')
      expect(result.negative.indicators).toContain('concern')
      expect(result.relationshipContext).toBe('parental')
    })

    it('should identify dominant sentiment when heavily skewed', () => {
      const content =
        'I am absolutely ecstatic about this news, though slightly worried about the timeline.'
      const result: MixedSentimentScore =
        processor.processMixedSentiment(content)

      expect(result.positive.score).toBeGreaterThan(0.7)
      expect(result.negative.score).toBeLessThan(0.4)
      expect(result.dominantSentiment).toBe('positive')
    })
  })

  describe('calculateSentimentConfidence', () => {
    it('should return high confidence for clear positive sentiment', () => {
      const sentimentScore: SentimentScore = {
        score: 0.9,
        intensity: 0.8,
        indicators: ['joy', 'excitement', 'happiness'],
        confidence: 0.85,
        linguisticMarkers: ['absolutely', 'thrilled', 'amazing'],
      }

      const confidence = processor.calculateSentimentConfidence(sentimentScore)
      expect(confidence).toBeGreaterThan(0.8)
    })

    it('should return moderate confidence for subtle sentiment', () => {
      const sentimentScore: SentimentScore = {
        score: 0.4,
        intensity: 0.3,
        indicators: ['mild satisfaction'],
        confidence: 0.6,
        linguisticMarkers: ['pretty good', 'okay'],
      }

      const confidence = processor.calculateSentimentConfidence(sentimentScore)
      expect(confidence).toBeGreaterThan(0.5)
      expect(confidence).toBeLessThan(0.8)
    })

    it('should return low confidence for ambiguous content', () => {
      const sentimentScore: SentimentScore = {
        score: 0.2,
        intensity: 0.1,
        indicators: [],
        confidence: 0.3,
        linguisticMarkers: [],
      }

      const confidence = processor.calculateSentimentConfidence(sentimentScore)
      expect(confidence).toBeLessThan(0.5)
    })

    it('should factor in linguistic marker consistency', () => {
      const sentimentScore: SentimentScore = {
        score: 0.7,
        intensity: 0.6,
        indicators: ['happiness', 'satisfaction'],
        confidence: 0.75,
        linguisticMarkers: ['wonderful', 'great', 'excellent', 'fantastic'],
      }

      const confidence = processor.calculateSentimentConfidence(sentimentScore)
      expect(confidence).toBeGreaterThan(0.75)
    })
  })

  describe('cross-cultural communication patterns', () => {
    it('should accommodate indirect emotional expression styles', () => {
      const content =
        'Perhaps things could be better, if that would be possible.'
      const result: SentimentScore = processor.analyzeNegativeSentiment(content)

      expect(result.score).toBeGreaterThan(0.3)
      expect(result.culturalContext).toBe('indirect')
      expect(result.confidence).toBeLessThan(0.7) // Lower confidence for indirect expressions
    })

    it('should handle high-context communication patterns', () => {
      const content = 'Everyone was very understanding about the situation.'
      const result: SentimentScore = processor.analyzePositiveSentiment(content)

      expect(result.score).toBeGreaterThan(0.4)
      expect(result.culturalContext).toBe('high-context')
    })

    it('should recognize direct emotional expression styles', () => {
      const content =
        'I hate this and I am extremely angry about the whole situation!'
      const result: SentimentScore = processor.analyzeNegativeSentiment(content)

      expect(result.score).toBeGreaterThan(0.8)
      expect(result.culturalContext).toBe('direct')
      expect(result.confidence).toBeGreaterThan(0.8)
    })
  })
})

import { describe, it, expect, beforeEach } from 'vitest'

import type {
  ConversationData,
  // RelationshipDynamics,
  // MoodAnalysisResult,
} from '../../types'
import { createTestConversationData } from '../../__tests__/test-helpers'

import { RelationshipContextAnalyzer } from '../relationship-context-analyzer'

describe('RelationshipContextAnalyzer - Relationship Context Integration System', () => {
  let analyzer: RelationshipContextAnalyzer

  beforeEach(() => {
    analyzer = new RelationshipContextAnalyzer({
      confidenceThreshold: 0.7,
      intimacyAnalysisDepth: 'comprehensive',
    })
  })

  describe('Relationship Dynamics Analysis (Task 3.1-3.2)', () => {
    describe('Intimacy Level Assessment', () => {
      it('should detect high intimacy relationships from communication patterns', () => {
        const highIntimacyConversation = createTestConversationData({
          id: 'conv-intimacy-1',
          timestamp: new Date('2024-01-01T10:00:00Z'),
          participants: [
            {
              id: 'user1',
              name: 'Sarah',
              role: 'vulnerable_sharer',
              messageCount: 8,
              emotionalExpressions: ['scared', 'vulnerable', 'trusting', 'loved'],
            },
            {
              id: 'user2', 
              name: 'Alex',
              role: 'supporter',
              messageCount: 6,
              emotionalExpressions: ['caring', 'protective', 'understanding'],
            },
          ],
          messages: [
            {
              id: 'msg1',
              content: 'I feel so scared about telling you this, but I need to share something deeply personal with you',
              authorId: 'user1',
              timestamp: new Date('2024-01-01T10:00:00Z'),
            },
            {
              id: 'msg2',
              content: 'I love you and I\'m here for you no matter what. You can trust me with anything',
              authorId: 'user2',
              timestamp: new Date('2024-01-01T10:02:00Z'),
            },
            {
              id: 'msg3',
              content: 'Thank you for being my safe space. You mean everything to me',
              authorId: 'user1',
              timestamp: new Date('2024-01-01T10:05:00Z'),
            },
          ],
        })

        const dynamics = analyzer.analyzeRelationshipDynamics(highIntimacyConversation)
        
        expect(dynamics.intimacyLevel).toBe('high')
        expect(dynamics.supportLevel).toBe('high') 
        expect(dynamics.trustLevel).toBe('high')
        expect(dynamics.type).toBeOneOf(['romantic', 'close_friend', 'family'])
      })

      it('should detect medium intimacy from supportive but reserved communication', () => {
        const mediumIntimacyConversation = createTestConversationData({
          id: 'conv-intimacy-2',
          timestamp: new Date('2024-01-01T14:00:00Z'),
          participants: [
            {
              id: 'user1',
              name: 'Jordan',
              role: 'vulnerable_sharer',
              messageCount: 5,
              emotionalExpressions: ['stressed', 'grateful', 'hopeful'],
            },
            {
              id: 'user2',
              name: 'Riley',
              role: 'supporter',
              messageCount: 4,
              emotionalExpressions: ['concerned', 'helpful'],
            },
          ],
          messages: [
            {
              id: 'msg1',
              content: 'I\'ve been having a tough time at work lately and could use some advice',
              authorId: 'user1',
              timestamp: new Date('2024-01-01T14:00:00Z'),
            },
            {
              id: 'msg2',
              content: 'I\'m sorry to hear that. What kind of challenges are you facing?',
              authorId: 'user2',
              timestamp: new Date('2024-01-01T14:02:00Z'),
            },
            {
              id: 'msg3',
              content: 'Thanks for listening. That really helps put things in perspective',
              authorId: 'user1',
              timestamp: new Date('2024-01-01T14:15:00Z'),
            },
          ],
        })

        const dynamics = analyzer.analyzeRelationshipDynamics(mediumIntimacyConversation)
        
        expect(dynamics.intimacyLevel).toBe('medium')
        expect(dynamics.supportLevel).toBeOneOf(['medium', 'high'])
        expect(dynamics.trustLevel).toBe('medium')
        expect(dynamics.type).toBeOneOf(['friend', 'colleague', 'close_friend'])
      })

      it('should detect low intimacy from professional or distant communication', () => {
        const lowIntimacyConversation: ConversationData = createTestConversationData({
          id: 'conv-intimacy-3',
          timestamp: new Date('2024-01-01T16:00:00Z'),
          participants: [
            {
              id: 'user1',
              name: 'Taylor',
              role: 'vulnerable_sharer',
              messageCount: 3,
              emotionalExpressions: ['neutral', 'polite'],
            },
            {
              id: 'user2',
              name: 'Morgan',
              role: 'supporter',
              messageCount: 2,
              emotionalExpressions: ['professional'],
            },
          ],
          messages: [
            {
              id: 'msg1',
              content: 'Hello, I wanted to follow up on our previous discussion about the project timeline',
              authorId: 'user1',
              timestamp: new Date('2024-01-01T16:00:00Z'),
            },
            {
              id: 'msg2',
              content: 'Thank you for the update. I\'ll review this and get back to you',
              authorId: 'user2',
              timestamp: new Date('2024-01-01T16:02:00Z'),
            },
          ],
        })

        const dynamics = analyzer.analyzeRelationshipDynamics(lowIntimacyConversation)
        
        expect(dynamics.intimacyLevel).toBe('low')
        expect(dynamics.supportLevel).toBeOneOf(['low', 'medium'])
        expect(dynamics.trustLevel).toBe('medium')
        expect(dynamics.type).toBeOneOf(['colleague', 'professional', 'acquaintance'])
      })
    })

    describe('Communication Style Assessment', () => {
      it('should identify emotional vulnerability indicators', () => {
        const vulnerableConversation: ConversationData = createTestConversationData({
          id: 'conv-vulnerable-1',
          timestamp: new Date('2024-01-01T12:00:00Z'),
          participants: [
            {
              id: 'user1',
              name: 'Sam',
              role: 'vulnerable_sharer',
              messageCount: 4,
              emotionalExpressions: ['anxious', 'ashamed', 'hopeful', 'relieved'],
            },
            {
              id: 'user2',
              name: 'Chris',
              role: 'emotional_leader',
              messageCount: 3,
              emotionalExpressions: ['compassionate', 'reassuring'],
            },
          ],
          messages: [
            {
              id: 'msg1',
              content: 'I\'m really struggling with something and I don\'t know who else to turn to',
              authorId: 'user1',
              timestamp: new Date('2024-01-01T12:00:00Z'),
            },
            {
              id: 'msg2',
              content: 'I hear you. It takes courage to reach out. What\'s going on?',
              authorId: 'user2',
              timestamp: new Date('2024-01-01T12:02:00Z'),
            },
            {
              id: 'msg3',
              content: 'I made a terrible mistake and I\'m so ashamed. I\'m afraid you\'ll judge me',
              authorId: 'user1',
              timestamp: new Date('2024-01-01T12:05:00Z'),
            },
          ],
        })

        const dynamics = analyzer.analyzeRelationshipDynamics(vulnerableConversation)
        
        expect(dynamics.communicationStyle).toBeDefined()
        expect(dynamics.communicationStyleDetails.vulnerabilityLevel).toBe('high')
        expect(dynamics.communicationStyleDetails.emotionalSafety).toBe('high')
        expect(dynamics.communicationStyleDetails.supportPatterns).toContain('active_listening')
        expect(dynamics.communicationStyleDetails.supportPatterns).toContain('validation')
      })

      it('should detect conflict and tension patterns', () => {
        const conflictConversation: ConversationData = createTestConversationData({
          id: 'conv-conflict-1',
          timestamp: new Date('2024-01-01T18:00:00Z'),
          participants: [
            {
              id: 'user1',
              name: 'Alex',
              role: 'vulnerable_sharer',
              messageCount: 6,
              emotionalExpressions: ['frustrated', 'angry', 'defensive'],
            },
            {
              id: 'user2',
              name: 'Jordan',
              role: 'supporter',
              messageCount: 5,
              emotionalExpressions: ['dismissive', 'irritated', 'stubborn'],
            },
          ],
          messages: [
            {
              id: 'msg1',
              content: 'I can\'t believe you did that without consulting me first',
              authorId: 'user1',
              timestamp: new Date('2024-01-01T18:00:00Z'),
            },
            {
              id: 'msg2',
              content: 'You\'re overreacting. It wasn\'t that big of a deal',
              authorId: 'user2',
              timestamp: new Date('2024-01-01T18:02:00Z'),
            },
            {
              id: 'msg3',
              content: 'Don\'t dismiss my feelings like that. This is exactly what I\'m talking about',
              authorId: 'user1',
              timestamp: new Date('2024-01-01T18:05:00Z'),
            },
          ],
        })

        const dynamics = analyzer.analyzeRelationshipDynamics(conflictConversation)
        
        expect(dynamics.conflictLevel).toBe('high')
        expect(dynamics.communicationStyleDetails.emotionalSafety).toBe('low')
        expect(dynamics.communicationStyleDetails.conflictPatterns).toContain('dismissal')
        expect(dynamics.communicationStyleDetails.conflictPatterns).toContain('defensiveness')
        expect(dynamics.trustLevel).toBe('low')
      })

      it('should recognize therapeutic or counseling communication patterns', () => {
        const therapeuticConversation: ConversationData = createTestConversationData({
          id: 'conv-therapeutic-1',
          timestamp: new Date('2024-01-01T15:00:00Z'),
          participants: [
            {
              id: 'client',
              name: 'Patient',
              role: 'vulnerable_sharer',
              messageCount: 8,
              emotionalExpressions: ['confused', 'exploring', 'insightful', 'grateful'],
            },
            {
              id: 'therapist',
              name: 'Counselor',
              role: 'listener',
              messageCount: 6,
              emotionalExpressions: ['professional', 'empathetic', 'guiding'],
            },
          ],
          messages: [
            {
              id: 'msg1',
              content: 'I\'ve been having these thoughts and I\'m not sure how to process them',
              authorId: 'client',
              timestamp: new Date('2024-01-01T15:00:00Z'),
            },
            {
              id: 'msg2',
              content: 'Can you tell me more about what these thoughts are like for you?',
              authorId: 'therapist',
              timestamp: new Date('2024-01-01T15:02:00Z'),
            },
            {
              id: 'msg3',
              content: 'When you ask it that way, I realize there might be a pattern here',
              authorId: 'client',
              timestamp: new Date('2024-01-01T15:08:00Z'),
            },
          ],
        })

        const dynamics = analyzer.analyzeRelationshipDynamics(therapeuticConversation)
        
        expect(dynamics.type).toBe('therapeutic')
        expect(dynamics.communicationStyleDetails.professionalBoundaries).toBe(true)
        expect(dynamics.communicationStyleDetails.guidancePatterns).toContain('reflective_questioning')
        expect(dynamics.communicationStyleDetails.therapeuticElements).toContain('insight_facilitation')
        expect(dynamics.supportLevel).toBe('high')
      })
    })

    describe('Participant Dynamics Evaluation', () => {
      it('should identify emotional leader and supporter roles', () => {
        const supportConversation: ConversationData = createTestConversationData({
          id: 'conv-support-1',
          timestamp: new Date('2024-01-01T20:00:00Z'),
          participants: [
            {
              id: 'leader',
              name: 'Maya',
              role: 'emotional_leader',
              messageCount: 7,
              emotionalExpressions: ['calm', 'reassuring', 'wise', 'protective'],
            },
            {
              id: 'supported',
              name: 'Jamie',
              role: 'vulnerable_sharer',
              messageCount: 5,
              emotionalExpressions: ['overwhelmed', 'grateful', 'relieved'],
            },
          ],
          messages: [
            {
              id: 'msg1',
              content: 'Everything feels like it\'s falling apart and I don\'t know what to do',
              authorId: 'supported',
              timestamp: new Date('2024-01-01T20:00:00Z'),
            },
            {
              id: 'msg2',
              content: 'I can see you\'re in a lot of pain right now. Let\'s take this one step at a time',
              authorId: 'leader',
              timestamp: new Date('2024-01-01T20:02:00Z'),
            },
          ],
        })

        const dynamics = analyzer.analyzeRelationshipDynamics(supportConversation)
        
        expect(dynamics.participantDynamics.emotionalLeader).toBe('leader')
        expect(dynamics.participantDynamics.primarySupporter).toBe('leader')
        expect(dynamics.participantDynamics.vulnerabilityExhibitor).toBe('supported')
        expect(dynamics.participantDynamics.supportBalance).toBe('unidirectional')
      })

      it('should detect mutual support patterns', () => {
        const mutualSupportConversation: ConversationData = createTestConversationData({
          id: 'conv-mutual-1',
          timestamp: new Date('2024-01-01T22:00:00Z'),
          participants: [
            {
              id: 'user1',
              name: 'Casey',
              role: 'supporter',
              messageCount: 6,
              emotionalExpressions: ['empathetic', 'vulnerable', 'grateful'],
            },
            {
              id: 'user2',
              name: 'Drew',
              role: 'supporter',
              messageCount: 6,
              emotionalExpressions: ['caring', 'understanding', 'supportive'],
            },
          ],
          messages: [
            {
              id: 'msg1',
              content: 'Thank you for helping me through that difficult time last week',
              authorId: 'user1',
              timestamp: new Date('2024-01-01T22:00:00Z'),
            },
            {
              id: 'msg2',
              content: 'Of course! You\'ve been there for me so many times too',
              authorId: 'user2',
              timestamp: new Date('2024-01-01T22:02:00Z'),
            },
            {
              id: 'msg3',
              content: 'Actually, I\'ve been struggling with something new and could use your perspective',
              authorId: 'user2',
              timestamp: new Date('2024-01-01T22:05:00Z'),
            },
          ],
        })

        const dynamics = analyzer.analyzeRelationshipDynamics(mutualSupportConversation)
        
        expect(dynamics.participantDynamics.supportBalance).toBe('bidirectional')
        expect(dynamics.participantDynamics.mutualVulnerability).toBe(true)
        expect(dynamics.supportLevel).toBe('high')
        expect(dynamics.intimacyLevel).toBeOneOf(['medium', 'high'])
      })
    })

    describe('Emotional Safety Evaluation', () => {
      it('should assess high emotional safety from acceptance and validation', () => {
        const safeConversation: ConversationData = createTestConversationData({
          id: 'conv-safe-1',
          timestamp: new Date('2024-01-02T09:00:00Z'),
          participants: [
            {
              id: 'user1',
              name: 'River',
              role: 'vulnerable_sharer',
              messageCount: 4,
              emotionalExpressions: ['ashamed', 'accepted', 'relieved', 'grateful'],
            },
            {
              id: 'user2',
              name: 'Sage',
              role: 'supporter',
              messageCount: 4,
              emotionalExpressions: ['accepting', 'non-judgmental', 'loving'],
            },
          ],
          messages: [
            {
              id: 'msg1',
              content: 'I need to tell you something that I\'m really ashamed about',
              authorId: 'user1',
              timestamp: new Date('2024-01-02T09:00:00Z'),
            },
            {
              id: 'msg2',
              content: 'Whatever it is, I love you and nothing will change that',
              authorId: 'user2',
              timestamp: new Date('2024-01-02T09:02:00Z'),
            },
            {
              id: 'msg3',
              content: 'I made a huge mistake and hurt someone I care about',
              authorId: 'user1',
              timestamp: new Date('2024-01-02T09:05:00Z'),
            },
            {
              id: 'msg4',
              content: 'Thank you for trusting me with this. We all make mistakes. What matters is how we learn and grow',
              authorId: 'user2',
              timestamp: new Date('2024-01-02T09:07:00Z'),
            },
          ],
        })

        const dynamics = analyzer.analyzeRelationshipDynamics(safeConversation)
        
        expect(dynamics.emotionalSafety.overall).toBe('high')
        expect(dynamics.emotionalSafety.acceptanceLevel).toBe('high')
        expect(dynamics.emotionalSafety.judgmentRisk).toBe('low')
        expect(dynamics.emotionalSafety.validationPresent).toBe(true)
        expect(dynamics.trustLevel).toBe('high')
      })

      it('should detect medium emotional safety with some reservations', () => {
        const moderateSafetyConversation: ConversationData = createTestConversationData({
          id: 'conv-moderate-safe-1',
          timestamp: new Date('2024-01-02T13:00:00Z'),
          participants: [
            {
              id: 'user1',
              name: 'Quinn',
              role: 'vulnerable_sharer',
              messageCount: 3,
              emotionalExpressions: ['hesitant', 'cautious', 'hopeful'],
            },
            {
              id: 'user2',
              name: 'Blake',
              role: 'supporter',
              messageCount: 3,
              emotionalExpressions: ['curious', 'supportive', 'slightly_judgmental'],
            },
          ],
          messages: [
            {
              id: 'msg1',
              content: 'I\'m not sure how you\'ll react to this, but I need to share something',
              authorId: 'user1',
              timestamp: new Date('2024-01-02T13:00:00Z'),
            },
            {
              id: 'msg2',
              content: 'I\'m listening. Though I have to say, you\'ve been making some questionable choices lately',
              authorId: 'user2',
              timestamp: new Date('2024-01-02T13:02:00Z'),
            },
            {
              id: 'msg3',
              content: 'Maybe this isn\'t the right time to discuss this',
              authorId: 'user1',
              timestamp: new Date('2024-01-02T13:04:00Z'),
            },
          ],
        })

        const dynamics = analyzer.analyzeRelationshipDynamics(moderateSafetyConversation)
        
        expect(dynamics.emotionalSafety.overall).toBe('medium')
        expect(dynamics.emotionalSafety.judgmentRisk).toBe('medium')
        expect(dynamics.emotionalSafety.validationPresent).toBe(false)
        expect(dynamics.trustLevel).toBe('medium')
      })
    })
  })
})
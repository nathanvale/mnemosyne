import { describe, it, expect, beforeEach } from 'vitest'

import type {
  CopingIndicator,
  ResilienceScore,
  StressIndicator,
  SupportIndicator,
  GrowthIndicator,
} from '../../types'

import { PsychologicalIndicatorAnalyzer } from '../psychological-indicator-analyzer'

describe('PsychologicalIndicatorAnalyzer', () => {
  let analyzer: PsychologicalIndicatorAnalyzer

  beforeEach(() => {
    analyzer = new PsychologicalIndicatorAnalyzer()
  })

  describe('analyzeCopingMechanisms', () => {
    it('should detect problem-focused coping strategies', () => {
      const content =
        'I need to make a plan and tackle this step by step. Let me break it down into manageable tasks.'
      const result: CopingIndicator[] =
        analyzer.analyzeCopingMechanisms(content)

      const problemFocused = result.find(
        (indicator) => indicator.type === 'problem_focused',
      )
      expect(problemFocused).toBeDefined()
      expect(problemFocused!.strength).toBeGreaterThan(0.7)
      expect(problemFocused!.effectiveness).toBeGreaterThan(0.6)
      expect(problemFocused!.contextualRelevance).toBeGreaterThan(0.7)
    })

    it('should detect emotion-focused coping strategies', () => {
      const content =
        'I just need to breathe and remind myself that this feeling will pass. I am going to practice mindfulness.'
      const result: CopingIndicator[] =
        analyzer.analyzeCopingMechanisms(content)

      const emotionFocused = result.find(
        (indicator) => indicator.type === 'emotion_focused',
      )
      expect(emotionFocused).toBeDefined()
      expect(emotionFocused!.strength).toBeGreaterThan(0.6)
      expect(emotionFocused!.emotionalImpact).toBeGreaterThan(0.7)
    })

    it('should detect meaning-focused coping strategies', () => {
      const content =
        'Maybe this challenge is here to teach me something important. I can find purpose in this struggle.'
      const result: CopingIndicator[] =
        analyzer.analyzeCopingMechanisms(content)

      const meaningFocused = result.find(
        (indicator) => indicator.type === 'meaning_focused',
      )
      expect(meaningFocused).toBeDefined()
      expect(meaningFocused!.strength).toBeGreaterThan(0.6)
      expect(meaningFocused!.effectiveness).toBeGreaterThan(0.5)
    })

    it('should handle mixed coping strategies', () => {
      const content =
        'I will make a concrete plan while also taking time to process my emotions and find meaning in this experience.'
      const result: CopingIndicator[] =
        analyzer.analyzeCopingMechanisms(content)

      expect(result).toHaveLength(3)
      expect(result.some((r) => r.type === 'problem_focused')).toBe(true)
      expect(result.some((r) => r.type === 'emotion_focused')).toBe(true)
      expect(result.some((r) => r.type === 'meaning_focused')).toBe(true)
    })

    it('should return empty array for content without coping indicators', () => {
      const content = 'The weather is nice today.'
      const result: CopingIndicator[] =
        analyzer.analyzeCopingMechanisms(content)

      expect(result).toHaveLength(0)
    })
  })

  describe('assessResilience', () => {
    it('should assess high resilience from recovery-focused language', () => {
      const content =
        'I have overcome challenges like this before and I know I can do it again. I am adaptable and strong.'
      const result: ResilienceScore = analyzer.assessResilience(content)

      expect(result.overall).toBeGreaterThan(0.7)
      expect(result.recoveryCapacity).toBeGreaterThan(0.8)
      expect(result.adaptiveFlexibility).toBeGreaterThan(0.6)
      expect(result.confidence).toBeGreaterThan(0.7)
    })

    it('should assess moderate resilience from growth-oriented language', () => {
      const content =
        'This is difficult but I am learning and growing from it. I will figure out a way forward.'
      const result: ResilienceScore = analyzer.assessResilience(content)

      expect(result.overall).toBeGreaterThan(0.5)
      expect(result.overall).toBeLessThan(0.8)
      expect(result.adaptiveFlexibility).toBeGreaterThan(0.6)
    })

    it('should assess support utilization in resilience', () => {
      const content =
        'I know I can reach out to my friends and family for help. Having a support network makes me stronger.'
      const result: ResilienceScore = analyzer.assessResilience(content)

      expect(result.supportUtilization).toBeGreaterThan(0.7)
      expect(result.overall).toBeGreaterThan(0.6)
    })

    it('should assess low resilience from defeat language', () => {
      const content =
        'I never recover from these situations. I always fail and nothing ever works out for me.'
      const result: ResilienceScore = analyzer.assessResilience(content)

      expect(result.overall).toBeLessThan(0.4)
      expect(result.recoveryCapacity).toBeLessThan(0.3)
      expect(result.confidence).toBeGreaterThan(0.6) // Confident in the assessment
    })

    it('should handle neutral content with moderate confidence', () => {
      const content = 'I went to the store and bought some groceries.'
      const result: ResilienceScore = analyzer.assessResilience(content)

      expect(result.overall).toBeGreaterThan(0.3)
      expect(result.overall).toBeLessThan(0.7)
      expect(result.confidence).toBeLessThan(0.6)
    })
  })

  describe('identifyStressMarkers', () => {
    it('should identify physiological stress markers', () => {
      const content =
        'My heart is racing and I cannot sleep. I feel physically exhausted and tense.'
      const result: StressIndicator[] = analyzer.identifyStressMarkers(content)

      const physiological = result.filter(
        (marker) => marker.type === 'physiological',
      )
      expect(physiological.length).toBeGreaterThan(0)
      expect(physiological.some((m) => m.intensity > 0.7)).toBe(true)
      expect(physiological.some((m) => m.evidence.length > 0)).toBe(true)
    })

    it('should identify emotional stress markers', () => {
      const content =
        'I feel overwhelmed and anxious. Everything feels too much right now and I am breaking down.'
      const result: StressIndicator[] = analyzer.identifyStressMarkers(content)

      const emotional = result.filter((marker) => marker.type === 'emotional')
      expect(emotional.length).toBeGreaterThan(0)
      expect(emotional.some((m) => m.intensity > 0.6)).toBe(true)
    })

    it('should identify cognitive stress markers', () => {
      const content =
        'I cannot think clearly or focus. My mind is racing and I keep forgetting things.'
      const result: StressIndicator[] = analyzer.identifyStressMarkers(content)

      const cognitive = result.filter((marker) => marker.type === 'cognitive')
      expect(cognitive.length).toBeGreaterThan(0)
      expect(
        cognitive.some(
          (m) =>
            m.description.includes('focus') ||
            m.description.includes('clarity'),
        ),
      ).toBe(true)
    })

    it('should identify behavioral stress markers', () => {
      const content =
        'I have been isolating myself and avoiding responsibilities. I am not eating or sleeping properly.'
      const result: StressIndicator[] = analyzer.identifyStressMarkers(content)

      const behavioral = result.filter((marker) => marker.type === 'behavioral')
      expect(behavioral.length).toBeGreaterThan(0)
      expect(behavioral.some((m) => m.intensity > 0.5)).toBe(true)
    })

    it('should handle multiple stress types in one content', () => {
      const content =
        'I am anxious and cannot focus, my heart races, and I am avoiding people and not sleeping.'
      const result: StressIndicator[] = analyzer.identifyStressMarkers(content)

      const types = new Set(result.map((marker) => marker.type))
      expect(types.size).toBeGreaterThanOrEqual(3)
      expect(types.has('emotional')).toBe(true)
      expect(types.has('cognitive')).toBe(true)
      expect(types.has('physiological')).toBe(true)
    })
  })

  describe('evaluateSupportPatterns', () => {
    it('should identify emotional support patterns', () => {
      const content =
        'Thank you for listening and understanding. Your empathy means so much to me right now.'
      const result: SupportIndicator[] =
        analyzer.evaluateSupportPatterns(content)

      const emotional = result.find(
        (indicator) => indicator.type === 'emotional',
      )
      expect(emotional).toBeDefined()
      expect(emotional!.quality).toBeGreaterThan(0.7)
      expect(emotional!.effectiveness).toBeGreaterThan(0.6)
    })

    it('should identify informational support patterns', () => {
      const content =
        'Thanks for the advice and guidance. That information really helped me understand the situation better.'
      const result: SupportIndicator[] =
        analyzer.evaluateSupportPatterns(content)

      const informational = result.find(
        (indicator) => indicator.type === 'informational',
      )
      expect(informational).toBeDefined()
      expect(informational!.quality).toBeGreaterThan(0.6)
    })

    it('should identify instrumental support patterns', () => {
      const content =
        'I appreciate you helping me with the practical tasks and offering concrete assistance.'
      const result: SupportIndicator[] =
        analyzer.evaluateSupportPatterns(content)

      const instrumental = result.find(
        (indicator) => indicator.type === 'instrumental',
      )
      expect(instrumental).toBeDefined()
      expect(instrumental!.effectiveness).toBeGreaterThan(0.6)
    })

    it('should identify appraisal support patterns', () => {
      const content =
        'You helped me see my strengths and reminded me of my capabilities. Your feedback was valuable.'
      const result: SupportIndicator[] =
        analyzer.evaluateSupportPatterns(content)

      const appraisal = result.find(
        (indicator) => indicator.type === 'appraisal',
      )
      expect(appraisal).toBeDefined()
      expect(appraisal!.quality).toBeGreaterThan(0.6)
    })

    it('should assess support reciprocity when present', () => {
      const content =
        'I am grateful for your help and I want to support you too. We can help each other through this.'
      const result: SupportIndicator[] =
        analyzer.evaluateSupportPatterns(content)

      expect(result.some((indicator) => indicator.reciprocity > 0.7)).toBe(true)
    })

    it('should handle absence of support indicators', () => {
      const content = 'I went to work and completed my tasks as usual.'
      const result: SupportIndicator[] =
        analyzer.evaluateSupportPatterns(content)

      expect(result).toHaveLength(0)
    })
  })

  describe('identifyGrowthPatterns', () => {
    it('should identify emotional maturity growth', () => {
      const content =
        'I am learning to manage my emotions better and respond instead of react. I understand myself more now.'
      const result: GrowthIndicator[] = analyzer.identifyGrowthPatterns(content)

      const emotional = result.find(
        (indicator) => indicator.type === 'emotional_maturity',
      )
      expect(emotional).toBeDefined()
      expect(emotional!.strength).toBeGreaterThan(0.6)
      expect(emotional!.direction).toBe('positive')
    })

    it('should identify self-awareness growth', () => {
      const content =
        'I am becoming more aware of my patterns and triggers. I recognize when I need to take a step back.'
      const result: GrowthIndicator[] = analyzer.identifyGrowthPatterns(content)

      const selfAware = result.find(
        (indicator) => indicator.type === 'self_awareness',
      )
      expect(selfAware).toBeDefined()
      expect(selfAware!.strength).toBeGreaterThan(0.7)
    })

    it('should identify relationship skills growth', () => {
      const content =
        'I am getting better at communicating my needs and setting healthy boundaries in my relationships.'
      const result: GrowthIndicator[] = analyzer.identifyGrowthPatterns(content)

      const relationship = result.find(
        (indicator) => indicator.type === 'relationship_skills',
      )
      expect(relationship).toBeDefined()
      expect(relationship!.direction).toBe('positive')
    })

    it('should identify resilience building growth', () => {
      const content =
        'Each challenge makes me stronger and more capable of handling future difficulties. I am building resilience.'
      const result: GrowthIndicator[] = analyzer.identifyGrowthPatterns(content)

      const resilience = result.find(
        (indicator) => indicator.type === 'resilience_building',
      )
      expect(resilience).toBeDefined()
      expect(resilience!.strength).toBeGreaterThan(0.7)
    })

    it('should detect negative growth patterns', () => {
      const content =
        'I keep making the same mistakes and I am getting worse at handling stress. I feel like I am regressing.'
      const result: GrowthIndicator[] = analyzer.identifyGrowthPatterns(content)

      expect(
        result.some((indicator) => indicator.direction === 'negative'),
      ).toBe(true)
      expect(result.some((indicator) => indicator.strength > 0.5)).toBe(true)
    })

    it('should provide supporting evidence for growth patterns', () => {
      const content =
        'I used to panic in these situations, but now I can stay calm and think clearly. This shows real progress.'
      const result: GrowthIndicator[] = analyzer.identifyGrowthPatterns(content)

      expect(result.length).toBeGreaterThan(0)
      expect(result.every((indicator) => indicator.evidence.length > 0)).toBe(
        true,
      )
      expect(
        result.some((indicator) =>
          indicator.evidence.some((evidence) => evidence.includes('progress')),
        ),
      ).toBe(true)
    })
  })

  describe('comprehensive analysis', () => {
    it('should handle complex content with multiple psychological indicators', () => {
      const content = `I have been feeling stressed and overwhelmed lately, but I am learning to cope better. 
        I make plans to tackle problems step by step, and I also take time for mindfulness. 
        My support network has been incredible - friends listen and give great advice. 
        I can see that I am growing from this experience and becoming more resilient.`

      const coping = analyzer.analyzeCopingMechanisms(content)
      const resilience = analyzer.assessResilience(content)
      const stress = analyzer.identifyStressMarkers(content)
      const support = analyzer.evaluateSupportPatterns(content)
      const growth = analyzer.identifyGrowthPatterns(content)

      expect(coping.length).toBeGreaterThan(1)
      expect(resilience.overall).toBeGreaterThan(0.6)
      expect(stress.length).toBeGreaterThan(0)
      expect(support.length).toBeGreaterThan(0)
      expect(growth.length).toBeGreaterThan(0)
    })

    it('should maintain consistency across related indicators', () => {
      const content =
        'I am building strong coping skills and my resilience is growing through practice and support.'

      const coping = analyzer.analyzeCopingMechanisms(content)
      const resilience = analyzer.assessResilience(content)
      const growth = analyzer.identifyGrowthPatterns(content)

      // High coping should correlate with high resilience and positive growth
      if (coping.some((c) => c.strength > 0.7)) {
        expect(resilience.overall).toBeGreaterThan(0.6)
        expect(growth.some((g) => g.direction === 'positive')).toBe(true)
      }
    })
  })
})

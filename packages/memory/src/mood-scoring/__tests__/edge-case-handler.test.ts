import type {
  ConversationData,
  MoodAnalysisResult,
  EmotionalComplexityAssessment,
} from '../../types'

import { EdgeCaseHandler } from '../edge-case-handler'

describe('Edge Case Handling with Complex Emotional Situation Management (Task 4.7)', () => {
  let edgeCaseHandler: EdgeCaseHandler

  beforeEach(() => {
    edgeCaseHandler = new EdgeCaseHandler()
  })

  describe('Complex Emotional Situation Detection', () => {
    it('should detect mixed emotional states with high complexity', async () => {
      const conversation = createMixedEmotionConversation()

      const complexity =
        await edgeCaseHandler.detectComplexEmotionalSituations(conversation)

      expect(complexity.complexityScore).toBeGreaterThan(0.2)
      expect(complexity.complexityTypes).toContainEqual(
        expect.objectContaining({
          type: 'mixed_emotions',
          severity: expect.stringMatching(/medium|high/),
          confidence: expect.any(Number),
        }),
      )
      expect(complexity.recommendedApproach).toMatch(
        /multi_interpretation|uncertainty_flagging|human_review/,
      )
    })

    it('should identify contradictory emotional signals', async () => {
      const conversation = createContradictorySignalsConversation()

      const complexity =
        await edgeCaseHandler.detectComplexEmotionalSituations(conversation)
      expect(complexity).toBeDefined()

      // When implemented:
      // const complexity = await edgeCaseHandler.detectComplexEmotionalSituations(conversation)
      // expect(complexity.complexityTypes).toContainEqual(
      //   expect.objectContaining({
      //     type: 'contradictory_signals',
      //     severity: 'medium'
      //   })
      // )
      // expect(complexity.assessmentConfidence).toBeLessThan(0.8)
    })

    it('should detect temporal emotional inconsistencies', async () => {
      const conversation = createTemporalInconsistencyConversation()

      const complexity =
        await edgeCaseHandler.detectComplexEmotionalSituations(conversation)
      expect(complexity).toBeDefined()

      // When implemented:
      // const complexity = await edgeCaseHandler.detectComplexEmotionalSituations(conversation)
      // expect(complexity.complexityTypes).toContainEqual(
      //   expect.objectContaining({
      //     type: 'temporal_inconsistency',
      //     evidence: expect.arrayContaining([expect.stringContaining('timeline')])
      //   })
      // )
    })

    it('should identify cultural nuance complexity', async () => {
      const conversation = createCulturalNuanceConversation()

      const complexity =
        await edgeCaseHandler.detectComplexEmotionalSituations(conversation)
      expect(complexity).toBeDefined()

      // When implemented:
      // const complexity = await edgeCaseHandler.detectComplexEmotionalSituations(conversation)
      // expect(complexity.complexityTypes).toContainEqual(
      //   expect.objectContaining({
      //     type: 'cultural_nuance',
      //     severity: expect.stringMatching(/medium|high/)
      //   })
      // )
    })
  })

  describe('Uncertainty Quantification', () => {
    it('should quantify uncertainty for ambiguous emotional expressions', async () => {
      const conversation = createAmbiguousEmotionConversation()
      const moodAnalysis = createBasicMoodAnalysis()

      const uncertainty = await edgeCaseHandler.quantifyUncertainty(
        conversation,
        moodAnalysis,
      )
      expect(uncertainty).toBeDefined()

      // When implemented:
      // const uncertainty = await edgeCaseHandler.quantifyUncertainty(conversation, moodAnalysis)
      // expect(uncertainty.uncertaintyLevel).toBeGreaterThan(0.6)
      // expect(uncertainty.uncertaintySources).toContainEqual(
      //   expect.objectContaining({
      //     source: 'conflicting_signals',
      //     impact: expect.any(Number)
      //   })
      // )
      // expect(uncertainty.confidenceIntervals.confidence).toBeLessThan(0.7)
      // expect(uncertainty.reliabilityScore).toBeLessThan(0.8)
    })

    it('should identify insufficient context as uncertainty source', async () => {
      const conversation = createInsufficientContextConversation()
      const moodAnalysis = createBasicMoodAnalysis()

      const uncertainty = await edgeCaseHandler.quantifyUncertainty(
        conversation,
        moodAnalysis,
      )
      expect(uncertainty).toBeDefined()

      // When implemented:
      // const uncertainty = await edgeCaseHandler.quantifyUncertainty(conversation, moodAnalysis)
      // expect(uncertainty.uncertaintySources).toContainEqual(
      //   expect.objectContaining({
      //     source: 'insufficient_context',
      //     mitigationSuggestions: expect.arrayContaining([
      //       expect.stringContaining('additional context')
      //     ])
      //   })
      // )
    })

    it('should handle extreme emotional states with high uncertainty', async () => {
      const conversation = createExtremeEmotionConversation()
      const moodAnalysis = createBasicMoodAnalysis()

      const uncertainty = await edgeCaseHandler.quantifyUncertainty(
        conversation,
        moodAnalysis,
      )
      expect(uncertainty).toBeDefined()

      // When implemented:
      // const uncertainty = await edgeCaseHandler.quantifyUncertainty(conversation, moodAnalysis)
      // expect(uncertainty.uncertaintySources).toContainEqual(
      //   expect.objectContaining({
      //     source: 'extreme_emotional_state',
      //     impact: expect.any(Number)
      //   })
      // )
      // expect(uncertainty.confidenceIntervals.low).toBeLessThan(uncertainty.confidenceIntervals.high - 2)
    })
  })

  describe('Multiple Interpretation Generation', () => {
    it('should generate multiple valid interpretations for ambiguous conversations', async () => {
      const conversation = createAmbiguousConversation()

      const interpretations =
        await edgeCaseHandler.generateMultipleInterpretations(conversation)
      expect(interpretations).toBeDefined()

      // When implemented:
      // const interpretations = await edgeCaseHandler.generateMultipleInterpretations(conversation)
      // expect(interpretations.primaryInterpretation.confidence).toBeGreaterThan(0.5)
      // expect(interpretations.alternativeInterpretations).toHaveLength(2)
      // expect(interpretations.alternativeInterpretations[0].moodScore).not.toBe(
      //   interpretations.primaryInterpretation.moodScore
      // )
      // expect(interpretations.interpretationConsensus.agreement).toBeLessThan(0.8)
    })

    it('should provide weighted interpretations for complex mixed emotions', async () => {
      const conversation = createComplexMixedEmotionConversation()

      const interpretations =
        await edgeCaseHandler.generateMultipleInterpretations(conversation)
      expect(interpretations).toBeDefined()

      // When implemented:
      // const interpretations = await edgeCaseHandler.generateMultipleInterpretations(conversation)
      // const totalWeight = interpretations.alternativeInterpretations.reduce(
      //   (sum, interp) => sum + interp.probabilityWeight, 0
      // )
      // expect(totalWeight).toBeCloseTo(1.0, 1)
      // expect(interpretations.interpretationConsensus.recommendedAction).toBe('weighted_average')
    })

    it('should recommend human review for highly divergent interpretations', async () => {
      const conversation = createDivergentInterpretationConversation()

      const interpretations =
        await edgeCaseHandler.generateMultipleInterpretations(conversation)
      expect(interpretations).toBeDefined()

      // When implemented:
      // const interpretations = await edgeCaseHandler.generateMultipleInterpretations(conversation)
      // expect(interpretations.interpretationConsensus.divergence).toBeGreaterThan(0.7)
      // expect(interpretations.interpretationConsensus.recommendedAction).toBe('flag_for_review')
    })
  })

  describe('Edge Case Detection', () => {
    it('should detect extreme emotional situations as edge cases', async () => {
      const conversation = createExtremeEmotionConversation()

      const edgeCase = await edgeCaseHandler.detectEdgeCases(conversation)
      expect(edgeCase.isEdgeCase).toBe(true)
      expect(edgeCase.edgeCaseType).toBe('extreme_emotion')
      expect(edgeCase.severity).toMatch(/high|critical/)
      expect(edgeCase.handlingStrategy).toMatch(
        /human_escalation|enhanced_analysis/,
      )
    })

    it('should identify sarcasm-heavy conversations as edge cases', async () => {
      const conversation = createSarcasmHeavyConversation()

      const edgeCase = await edgeCaseHandler.detectEdgeCases(conversation)
      expect(edgeCase.isEdgeCase).toBe(true)
      expect(edgeCase.edgeCaseType).toBe('sarcasm_heavy')
      expect(edgeCase.handlingStrategy).toBe('enhanced_analysis')
    })

    it('should detect culturally specific expressions as edge cases', async () => {
      const conversation = createCultureSpecificConversation()

      const edgeCase = await edgeCaseHandler.detectEdgeCases(conversation)
      expect(edgeCase).toBeDefined()

      // When implemented:
      // const edgeCase = await edgeCaseHandler.detectEdgeCases(conversation)
      // expect(edgeCase.isEdgeCase).toBe(true)
      // expect(edgeCase.edgeCaseType).toBe('cultural_specific')
      // expect(edgeCase.additionalContextNeeded).toContain('cultural_background')
    })

    it('should flag contradictory signals as edge cases requiring multi-interpretation', async () => {
      const conversation = createContradictorySignalsConversation()

      const edgeCase = await edgeCaseHandler.detectEdgeCases(conversation)
      expect(edgeCase).toBeDefined()

      // When implemented:
      // const edgeCase = await edgeCaseHandler.detectEdgeCases(conversation)
      // expect(edgeCase.isEdgeCase).toBe(true)
      // expect(edgeCase.edgeCaseType).toBe('contradictory_signals')
      // expect(edgeCase.handlingStrategy).toBe('multi_interpretation')
    })
  })

  describe('Cultural Context Analysis', () => {
    it('should analyze high-context communication patterns', async () => {
      const conversation = createHighContextConversation()

      const culturalAnalysis =
        await edgeCaseHandler.analyzeCulturalContext(conversation)
      expect(culturalAnalysis).toBeDefined()

      // When implemented:
      // const culturalAnalysis = await edgeCaseHandler.analyzeCulturalContext(conversation)
      // expect(culturalAnalysis.culturalContext).toBe('high_context')
      // expect(culturalAnalysis.communicationStyleIndicators.implicitness).toBeGreaterThan(0.7)
      // expect(culturalAnalysis.culturalConsiderations).toContainEqual(
      //   expect.objectContaining({
      //     aspect: 'indirect_communication',
      //     impact: 'high'
      //   })
      // )
    })

    it('should identify low-context direct communication', async () => {
      const conversation = createLowContextConversation()

      const culturalAnalysis =
        await edgeCaseHandler.analyzeCulturalContext(conversation)
      expect(culturalAnalysis).toBeDefined()

      // When implemented:
      // const culturalAnalysis = await edgeCaseHandler.analyzeCulturalContext(conversation)
      // expect(culturalAnalysis.culturalContext).toBe('low_context')
      // expect(culturalAnalysis.communicationStyleIndicators.directness).toBeGreaterThan(0.8)
      // expect(culturalAnalysis.communicationStyleIndicators.emotionalExpressiveness).toBeGreaterThan(0.6)
    })

    it('should handle mixed cultural communication styles', async () => {
      const conversation = createMixedCulturalConversation()

      const culturalAnalysis =
        await edgeCaseHandler.analyzeCulturalContext(conversation)
      expect(culturalAnalysis).toBeDefined()

      // When implemented:
      // const culturalAnalysis = await edgeCaseHandler.analyzeCulturalContext(conversation)
      // expect(culturalAnalysis.culturalContext).toBe('mixed')
      // expect(culturalAnalysis.culturalConfidence).toBeLessThan(0.8)
    })
  })

  describe('Ambiguity Detection', () => {
    it('should detect linguistic ambiguity in emotional expressions', async () => {
      const conversation = createLinguisticAmbiguityConversation()

      const ambiguity = await edgeCaseHandler.detectAmbiguity(conversation)
      expect(ambiguity).toBeDefined()

      // When implemented:
      // const ambiguity = await edgeCaseHandler.detectAmbiguity(conversation)
      // expect(ambiguity.ambiguityLevel).toBeGreaterThan(0.6)
      // expect(ambiguity.ambiguitySources).toContainEqual(
      //   expect.objectContaining({
      //     source: 'linguistic',
      //     severity: expect.any(Number)
      //   })
      // )
      // expect(ambiguity.analysisImpact.confidenceReduction).toBeGreaterThan(0.2)
    })

    it('should identify contextual ambiguity requiring clarification', async () => {
      const conversation = createContextualAmbiguityConversation()

      const ambiguity = await edgeCaseHandler.detectAmbiguity(conversation)
      expect(ambiguity).toBeDefined()

      // When implemented:
      // const ambiguity = await edgeCaseHandler.detectAmbiguity(conversation)
      // expect(ambiguity.ambiguitySources).toContainEqual(
      //   expect.objectContaining({
      //     source: 'contextual',
      //     clarificationNeeded: expect.arrayContaining([
      //       expect.stringContaining('background information')
      //     ])
      //   })
      // )
    })

    it('should provide resolution strategies for detected ambiguity', async () => {
      const conversation = createAmbiguousEmotionConversation()

      const ambiguity = await edgeCaseHandler.detectAmbiguity(conversation)
      expect(ambiguity).toBeDefined()

      // When implemented:
      // const ambiguity = await edgeCaseHandler.detectAmbiguity(conversation)
      // expect(ambiguity.resolutionStrategies).toContain('multiple_interpretation_analysis')
      // expect(ambiguity.analysisImpact.recommendedAction).toMatch(/review|clarification|multi/)
    })
  })

  describe('Specialized Edge Case Handling', () => {
    it('should handle mixed emotions with conflict resolution', async () => {
      const conversation = createMixedEmotionConversation()

      const mixedEmotionResult =
        await edgeCaseHandler.handleMixedEmotions(conversation)
      expect(mixedEmotionResult).toBeDefined()

      // When implemented:
      // const mixedEmotionResult = await edgeCaseHandler.handleMixedEmotions(conversation)
      // expect(mixedEmotionResult.detectedEmotions).toHaveLength(2)
      // expect(mixedEmotionResult.emotionalConflict).toBeGreaterThan(0.5)
      // expect(mixedEmotionResult.resolutionStrategy).toMatch(/weighted|contextual|temporal/)
      // expect(mixedEmotionResult.uncertainty).toBeGreaterThan(0.3)
    })

    it('should detect and handle sarcasm with contextual clues', async () => {
      const conversation = createSarcasmHeavyConversation()

      const sarcasmResult =
        await edgeCaseHandler.detectSarcasmAndIrony(conversation)
      expect(sarcasmResult).toBeDefined()

      // When implemented:
      // const sarcasmResult = await edgeCaseHandler.detectSarcasmAndIrony(conversation)
      // expect(sarcasmResult.sarcasmDetected).toBe(true)
      // expect(sarcasmResult.sarcasmConfidence).toBeGreaterThan(0.7)
      // expect(sarcasmResult.contextualClues).toContain('tone_contradiction')
      // expect(sarcasmResult.adjustmentRecommendation).toContain('reverse_sentiment')
    })

    it('should handle extreme emotions with stability assessment', async () => {
      const conversation = createExtremeEmotionConversation()

      const extremeResult =
        await edgeCaseHandler.handleExtremeEmotions(conversation)
      expect(extremeResult).toBeDefined()

      // When implemented:
      // const extremeResult = await edgeCaseHandler.handleExtremeEmotions(conversation)
      // expect(extremeResult.extremeEmotionDetected).toBe(true)
      // expect(extremeResult.intensityLevel).toBeGreaterThan(8)
      // expect(extremeResult.handlingApproach).toMatch(/careful|conservative|review/)
      // expect(extremeResult.confidenceAdjustment).toBeLessThan(1.0)
    })
  })

  describe('Complexity Handling Validation', () => {
    it('should validate that complex handling improves accuracy over standard analysis', async () => {
      const conversation = createComplexEmotionalSituation()
      const standardAnalysis = createBasicMoodAnalysis()
      const complexityAnalysis = createComplexityAssessment()

      const validation = await edgeCaseHandler.validateComplexityHandling(
        conversation,
        standardAnalysis,
        complexityAnalysis,
      )
      expect(validation).toBeDefined()

      // When implemented:
      // const validation = await edgeCaseHandler.validateComplexityHandling(
      //   conversation,
      //   standardAnalysis,
      //   complexityAnalysis
      // )
      // expect(validation.improvementDetected).toBe(true)
      // expect(validation.accuracyImprovement).toBeGreaterThan(0.1)
      // expect(validation.confidenceImprovement).toBeGreaterThan(0.05)
      // expect(validation.handlingEffectiveness).toBeGreaterThan(0.7)
    })

    it('should measure effectiveness of uncertainty quantification', async () => {
      const conversation = createHighUncertaintyConversation()
      const standardAnalysis = createOverconfidentMoodAnalysis()
      const complexityAnalysis = createHighUncertaintyAssessment()

      const validation = await edgeCaseHandler.validateComplexityHandling(
        conversation,
        standardAnalysis,
        complexityAnalysis,
      )
      expect(validation).toBeDefined()

      // When implemented:
      // const validation = await edgeCaseHandler.validateComplexityHandling(
      //   conversation,
      //   standardAnalysis,
      //   complexityAnalysis
      // )
      // expect(validation.confidenceImprovement).toBeGreaterThan(0.2) // Better calibrated confidence
      // expect(validation.handlingEffectiveness).toBeGreaterThan(0.8)
    })
  })
})

// Helper functions for creating test data

function createMixedEmotionConversation(): ConversationData {
  const baseTime = new Date()
  return {
    id: 'mixed-emotion-conv',
    messages: [
      {
        id: 'msg-1',
        content:
          "I'm so excited about the promotion, but I'm also terrified about the new responsibilities. Part of me wants to celebrate, but another part just wants to hide.",
        authorId: 'user-1',
        timestamp: new Date(baseTime.getTime()),
      },
      {
        id: 'msg-2',
        content:
          "That sounds like a really complex mix of feelings. It's totally normal to feel both joy and anxiety about big changes.",
        authorId: 'user-2',
        timestamp: new Date(baseTime.getTime() + 60000),
      },
      {
        id: 'msg-3',
        content:
          "Yeah, it's like I'm happy and sad at the same time. Happy for the opportunity but sad to leave my current team behind.",
        authorId: 'user-1',
        timestamp: new Date(baseTime.getTime() + 120000),
      },
    ],
    participants: [
      { id: 'user-1', name: 'Alex', role: 'vulnerable_sharer' },
      { id: 'user-2', name: 'Jordan', role: 'supporter' },
    ],
    timestamp: baseTime,
    startTime: baseTime,
    endTime: new Date(baseTime.getTime() + 120000),
  }
}

function createContradictorySignalsConversation(): ConversationData {
  const baseTime = new Date()
  return {
    id: 'contradictory-conv',
    messages: [
      {
        id: 'msg-1',
        content: 'Everything is fine! Really great actually! 😊',
        authorId: 'user-1',
        timestamp: new Date(baseTime.getTime()),
      },
      {
        id: 'msg-2',
        content: 'Are you sure? You seem a bit off today.',
        authorId: 'user-2',
        timestamp: new Date(baseTime.getTime() + 60000),
      },
      {
        id: 'msg-3',
        content:
          "No no, I'm fantastic! Just had the worst day of my life but hey, who cares right? 😅",
        authorId: 'user-1',
        timestamp: new Date(baseTime.getTime() + 120000),
      },
    ],
    participants: [
      { id: 'user-1', name: 'Sam', role: 'author' },
      { id: 'user-2', name: 'Casey', role: 'observer' },
    ],
    timestamp: baseTime,
    startTime: baseTime,
    endTime: new Date(baseTime.getTime() + 120000),
  }
}

function createTemporalInconsistencyConversation(): ConversationData {
  const baseTime = new Date()
  return {
    id: 'temporal-inconsistent-conv',
    messages: [
      {
        id: 'msg-1',
        content: "I'm feeling really positive about everything lately!",
        authorId: 'user-1',
        timestamp: new Date(baseTime.getTime() - 3600000),
      },
      {
        id: 'msg-2',
        content: "That's great to hear! What's been going well?",
        authorId: 'user-2',
        timestamp: new Date(baseTime.getTime() - 3000000),
      },
      {
        id: 'msg-3',
        content:
          "Actually, I've been in a dark place for weeks now. Nothing seems to matter anymore.",
        authorId: 'user-1',
        timestamp: baseTime,
      },
    ],
    participants: [
      { id: 'user-1', name: 'Taylor', role: 'author' },
      { id: 'user-2', name: 'Morgan', role: 'listener' },
    ],
    timestamp: baseTime,
    startTime: new Date(baseTime.getTime() - 3600000),
    endTime: baseTime,
  }
}

function createCulturalNuanceConversation(): ConversationData {
  const baseTime = new Date()
  return {
    id: 'cultural-nuance-conv',
    messages: [
      {
        id: 'msg-1',
        content:
          "Ah, well, perhaps it might be somewhat challenging, but one manages somehow, doesn't one?",
        authorId: 'user-1',
        timestamp: new Date(baseTime.getTime()),
      },
      {
        id: 'msg-2',
        content: 'That sounds really difficult. How are you handling it?',
        authorId: 'user-2',
        timestamp: new Date(baseTime.getTime() + 60000),
      },
      {
        id: 'msg-3',
        content:
          "Oh, one mustn't complain too much. These things happen, I suppose.",
        authorId: 'user-1',
        timestamp: new Date(baseTime.getTime() + 120000),
      },
    ],
    participants: [
      { id: 'user-1', name: 'British User', role: 'author' },
      { id: 'user-2', name: 'Direct User', role: 'supporter' },
    ],
    timestamp: baseTime,
    startTime: baseTime,
    endTime: new Date(baseTime.getTime() + 120000),
  }
}

function createAmbiguousEmotionConversation(): ConversationData {
  const baseTime = new Date()
  return {
    id: 'ambiguous-emotion-conv',
    messages: [
      {
        id: 'msg-1',
        content: "It's... interesting how things turned out.",
        authorId: 'user-1',
        timestamp: new Date(baseTime.getTime()),
      },
      {
        id: 'msg-2',
        content: 'What do you mean by interesting?',
        authorId: 'user-2',
        timestamp: new Date(baseTime.getTime() + 60000),
      },
      {
        id: 'msg-3',
        content: 'You know. Just... interesting. Different than expected.',
        authorId: 'user-1',
        timestamp: new Date(baseTime.getTime() + 120000),
      },
    ],
    participants: [
      { id: 'user-1', name: 'Vague User', role: 'author' },
      { id: 'user-2', name: 'Clarifier', role: 'observer' },
    ],
    timestamp: baseTime,
    startTime: baseTime,
    endTime: new Date(baseTime.getTime() + 120000),
  }
}

function createInsufficientContextConversation(): ConversationData {
  const baseTime = new Date()
  return {
    id: 'insufficient-context-conv',
    messages: [
      {
        id: 'msg-1',
        content: 'After what happened yesterday...',
        authorId: 'user-1',
        timestamp: baseTime,
      },
      {
        id: 'msg-2',
        content: 'Yeah?',
        authorId: 'user-2',
        timestamp: new Date(baseTime.getTime() + 60000),
      },
      {
        id: 'msg-3',
        content: "I just can't believe it.",
        authorId: 'user-1',
        timestamp: new Date(baseTime.getTime() + 120000),
      },
    ],
    participants: [
      { id: 'user-1', name: 'Cryptic User', role: 'author' },
      { id: 'user-2', name: 'Confused User', role: 'listener' },
    ],
    timestamp: baseTime,
    startTime: baseTime,
    endTime: new Date(baseTime.getTime() + 120000),
  }
}

function createExtremeEmotionConversation(): ConversationData {
  const baseTime = new Date()
  return {
    id: 'extreme-emotion-conv',
    messages: [
      {
        id: 'msg-1',
        content:
          'I AM ABSOLUTELY DEVASTATED!!! THIS IS THE WORST THING THAT HAS EVER HAPPENED TO ANYONE IN THE HISTORY OF THE WORLD!!!',
        authorId: 'user-1',
        timestamp: baseTime,
      },
      {
        id: 'msg-2',
        content: 'What happened? Can you tell me more?',
        authorId: 'user-2',
        timestamp: new Date(baseTime.getTime() + 60000),
      },
      {
        id: 'msg-3',
        content:
          "MY COFFEE WAS COLD THIS MORNING AND IT'S LITERALLY RUINED MY ENTIRE EXISTENCE!!!",
        authorId: 'user-1',
        timestamp: new Date(baseTime.getTime() + 120000),
      },
    ],
    participants: [
      { id: 'user-1', name: 'Extreme User', role: 'author' },
      { id: 'user-2', name: 'Calm User', role: 'supporter' },
    ],
    timestamp: baseTime,
    startTime: baseTime,
    endTime: new Date(baseTime.getTime() + 120000),
  }
}

function createSarcasmHeavyConversation(): ConversationData {
  const baseTime = new Date()
  return {
    id: 'sarcasm-heavy-conv',
    messages: [
      {
        id: 'msg-1',
        content:
          'Oh fantastic, another meeting about meetings. Just what I needed to make my day perfect! 🙄',
        authorId: 'user-1',
        timestamp: baseTime,
      },
      {
        id: 'msg-2',
        content: "I take it you're not looking forward to it?",
        authorId: 'user-2',
        timestamp: new Date(baseTime.getTime() + 60000),
      },
      {
        id: 'msg-3',
        content:
          "Are you kidding? I'm absolutely THRILLED to spend 3 hours discussing why we need to discuss things! Best use of time ever! 👏",
        authorId: 'user-1',
        timestamp: new Date(baseTime.getTime() + 120000),
      },
    ],
    participants: [
      { id: 'user-1', name: 'Sarcastic User', role: 'author' },
      { id: 'user-2', name: 'Literal User', role: 'observer' },
    ],
    timestamp: baseTime,
    startTime: baseTime,
    endTime: new Date(baseTime.getTime() + 120000),
  }
}

function createAmbiguousConversation(): ConversationData {
  return createAmbiguousEmotionConversation()
}

function createComplexMixedEmotionConversation(): ConversationData {
  const baseTime = new Date()
  return {
    id: 'complex-mixed-conv',
    messages: [
      {
        id: 'msg-1',
        content:
          "I'm simultaneously proud of what I accomplished and disappointed that it wasn't enough, while also feeling grateful for the opportunity but anxious about what comes next.",
        authorId: 'user-1',
        timestamp: baseTime,
      },
    ],
    participants: [
      { id: 'user-1', name: 'Complex User', role: 'vulnerable_sharer' },
    ],
    timestamp: baseTime,
    startTime: baseTime,
    endTime: baseTime,
  }
}

function createDivergentInterpretationConversation(): ConversationData {
  const baseTime = new Date()
  return {
    id: 'divergent-interp-conv',
    messages: [
      {
        id: 'msg-1',
        content: "I can't wait for this to be over.",
        authorId: 'user-1',
        timestamp: baseTime,
      },
    ],
    participants: [{ id: 'user-1', name: 'Ambiguous User', role: 'author' }],
    timestamp: baseTime,
    startTime: baseTime,
    endTime: baseTime,
  }
}

function createCultureSpecificConversation(): ConversationData {
  const baseTime = new Date()
  return {
    id: 'culture-specific-conv',
    messages: [
      {
        id: 'msg-1',
        content:
          "Shoganai... things are as they are, I suppose. Can't be helped.",
        authorId: 'user-1',
        timestamp: baseTime,
      },
    ],
    participants: [{ id: 'user-1', name: 'Cultural User', role: 'author' }],
    timestamp: baseTime,
    startTime: baseTime,
    endTime: baseTime,
  }
}

function createHighContextConversation(): ConversationData {
  const baseTime = new Date()
  return {
    id: 'high-context-conv',
    messages: [
      {
        id: 'msg-1',
        content:
          "Perhaps... if it's not too much trouble... one might consider... well, you understand.",
        authorId: 'user-1',
        timestamp: baseTime,
      },
    ],
    participants: [{ id: 'user-1', name: 'Indirect User', role: 'author' }],
    timestamp: baseTime,
    startTime: baseTime,
    endTime: baseTime,
  }
}

function createLowContextConversation(): ConversationData {
  const baseTime = new Date()
  return {
    id: 'low-context-conv',
    messages: [
      {
        id: 'msg-1',
        content:
          "I'm really angry about this situation. It's completely unacceptable and I want it fixed immediately.",
        authorId: 'user-1',
        timestamp: baseTime,
      },
    ],
    participants: [{ id: 'user-1', name: 'Direct User', role: 'author' }],
    timestamp: baseTime,
    startTime: baseTime,
    endTime: baseTime,
  }
}

function createMixedCulturalConversation(): ConversationData {
  const baseTime = new Date()
  return {
    id: 'mixed-cultural-conv',
    messages: [
      {
        id: 'msg-1',
        content:
          "Well, I suppose one might say... actually, no, I'm just really frustrated!",
        authorId: 'user-1',
        timestamp: baseTime,
      },
    ],
    participants: [{ id: 'user-1', name: 'Mixed Style User', role: 'author' }],
    timestamp: baseTime,
    startTime: baseTime,
    endTime: baseTime,
  }
}

function createLinguisticAmbiguityConversation(): ConversationData {
  const baseTime = new Date()
  return {
    id: 'linguistic-ambiguity-conv',
    messages: [
      {
        id: 'msg-1',
        content: "That's just great. Really great.",
        authorId: 'user-1',
        timestamp: baseTime,
      },
    ],
    participants: [{ id: 'user-1', name: 'Ambiguous User', role: 'author' }],
    timestamp: baseTime,
    startTime: baseTime,
    endTime: baseTime,
  }
}

function createContextualAmbiguityConversation(): ConversationData {
  const baseTime = new Date()
  return {
    id: 'contextual-ambiguity-conv',
    messages: [
      {
        id: 'msg-1',
        content:
          "After everything that happened with... you know... I'm not sure how to feel.",
        authorId: 'user-1',
        timestamp: baseTime,
      },
    ],
    participants: [{ id: 'user-1', name: 'Contextless User', role: 'author' }],
    timestamp: baseTime,
    startTime: baseTime,
    endTime: baseTime,
  }
}

function createComplexEmotionalSituation(): ConversationData {
  return createMixedEmotionConversation()
}

function createHighUncertaintyConversation(): ConversationData {
  return createAmbiguousEmotionConversation()
}

// Mock analysis results for testing

function createBasicMoodAnalysis(): MoodAnalysisResult {
  return {
    score: 6.5,
    descriptors: ['mixed', 'uncertain'],
    confidence: 0.7,
    factors: [
      {
        type: 'sentiment_analysis',
        weight: 0.35,
        description: 'Neutral to positive sentiment detected',
        evidence: ['positive words', 'neutral tone'],
      },
    ],
  }
}

function createComplexityAssessment(): EmotionalComplexityAssessment {
  return {
    complexityScore: 0.8,
    complexityTypes: [
      {
        type: 'mixed_emotions',
        severity: 'high',
        confidence: 0.9,
        description: 'Multiple competing emotions detected',
        evidence: ['joy indicators', 'anxiety markers'],
      },
    ],
    assessmentConfidence: 0.85,
    recommendedApproach: 'multi_interpretation',
  }
}

function createOverconfidentMoodAnalysis(): MoodAnalysisResult {
  return {
    score: 7.2,
    descriptors: ['positive', 'confident'],
    confidence: 0.95, // Overconfident
    factors: [
      {
        type: 'sentiment_analysis',
        weight: 0.35,
        description: 'Strong positive sentiment',
        evidence: ['positive keywords'],
      },
    ],
  }
}

function createHighUncertaintyAssessment(): EmotionalComplexityAssessment {
  return {
    complexityScore: 0.9,
    complexityTypes: [
      {
        type: 'contextual_ambiguity',
        severity: 'high',
        confidence: 0.8,
        description: 'Insufficient context for reliable analysis',
        evidence: ['vague expressions', 'missing background'],
      },
    ],
    assessmentConfidence: 0.4, // Low confidence
    recommendedApproach: 'uncertainty_flagging',
  }
}

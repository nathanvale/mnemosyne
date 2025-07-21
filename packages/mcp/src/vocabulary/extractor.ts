import type { ExtractedMemory } from '@studio/memory'

import { logger } from '@studio/logger'

import type {
  EmotionalVocabulary,
  VocabularyEvolution,
  VocabularyConfig,
} from '../types/index'

/**
 * EmotionalVocabularyExtractor extracts tone-consistent vocabulary
 */
export class EmotionalVocabularyExtractor {
  private readonly config: VocabularyConfig

  constructor(config: Partial<VocabularyConfig> = {}) {
    this.config = {
      maxTermsPerCategory: 10,
      includeEvolution: true,
      sourceScope: 'recent',
      ...config,
    }
  }

  /**
   * Extract emotional vocabulary from memories
   */
  async extractVocabulary(
    memories: ExtractedMemory[],
    participantId: string
  ): Promise<EmotionalVocabulary> {
    logger.info('Extracting emotional vocabulary', { 
      participantId, 
      memoryCount: memories.length 
    })

    if (memories.length === 0) {
      return this.createEmptyVocabulary(participantId)
    }

    const scopedMemories = this.applyScopeFilter(memories)
    const sortedMemories = this.sortMemoriesByRecency(scopedMemories)

    const themes = await this.extractEmotionalThemes(sortedMemories)
    const moodDescriptors = await this.extractMoodDescriptors(sortedMemories)
    const relationshipTerms = await this.extractRelationshipTerms(sortedMemories)
    const communicationStyle = await this.analyzeCommunicationStyle(sortedMemories)
    
    const evolution = this.config.includeEvolution
      ? await this.analyzeVocabularyEvolution(sortedMemories)
      : []

    const vocabulary: EmotionalVocabulary = {
      participantId,
      themes: themes.slice(0, this.config.maxTermsPerCategory),
      moodDescriptors: moodDescriptors.slice(0, this.config.maxTermsPerCategory),
      relationshipTerms: relationshipTerms.slice(0, this.config.maxTermsPerCategory),
      communicationStyle,
      evolution,
    }

    logger.debug('Extracted emotional vocabulary', {
      participantId,
      themeCount: vocabulary.themes.length,
      descriptorCount: vocabulary.moodDescriptors.length,
    })

    return vocabulary
  }

  /**
   * Extract emotional themes from memories
   */
  private async extractEmotionalThemes(memories: ExtractedMemory[]): Promise<string[]> {
    const themeMap = new Map<string, number>()

    for (const memory of memories) {
      const themes = memory.emotionalAnalysis.context.themes || []
      
      for (const theme of themes) {
        const normalizedTheme = this.normalizeTheme(theme)
        themeMap.set(normalizedTheme, (themeMap.get(normalizedTheme) || 0) + 1)
      }

      const patterns = memory.emotionalAnalysis.patterns
      for (const pattern of patterns) {
        const patternTheme = this.patternToTheme(pattern.type)
        if (patternTheme) {
          themeMap.set(patternTheme, (themeMap.get(patternTheme) || 0) + pattern.significance)
        }
      }
    }

    return this.sortByFrequency(themeMap)
  }

  /**
   * Extract mood descriptors from memories
   */
  private async extractMoodDescriptors(memories: ExtractedMemory[]): Promise<string[]> {
    const descriptorMap = new Map<string, number>()

    for (const memory of memories) {
      const descriptors = memory.emotionalAnalysis.moodScoring.descriptors
      const confidence = memory.emotionalAnalysis.moodScoring.confidence
      
      for (const descriptor of descriptors) {
        const normalized = this.normalizeMoodDescriptor(descriptor)
        const weight = confidence * (memory.significance.overall / 10)
        descriptorMap.set(normalized, (descriptorMap.get(normalized) || 0) + weight)
      }

      if (memory.emotionalAnalysis.context.primaryEmotion) {
        const state = memory.emotionalAnalysis.context.primaryEmotion
        const stateDescriptor = this.emotionalStateToDescriptor(state)
        if (stateDescriptor) {
          descriptorMap.set(stateDescriptor, (descriptorMap.get(stateDescriptor) || 0) + 1)
        }
      }
    }

    return this.sortByFrequency(descriptorMap)
  }

  /**
   * Extract relationship terms from memories
   */
  private async extractRelationshipTerms(memories: ExtractedMemory[]): Promise<string[]> {
    const termMap = new Map<string, number>()

    for (const memory of memories) {
      if (memory.relationshipDynamics) {
        const patterns = (memory.relationshipDynamics as any)?.patterns || []
        for (const pattern of patterns) {
          const term = this.relationshipPatternToTerm(pattern)
          if (term) {
            termMap.set(term, (termMap.get(term) || 0) + 1)
          }
        }

        const qualityTerms = this.qualityToTerms((memory.relationshipDynamics as any)?.quality || 5)
        for (const term of qualityTerms) {
          termMap.set(term, (termMap.get(term) || 0) + 1)
        }
      }

      const supportPatterns = memory.emotionalAnalysis.patterns.filter(
        p => p.type === 'support_seeking' || p.type === 'mood_repair'
      )
      
      for (const pattern of supportPatterns) {
        termMap.set('supportive', (termMap.get('supportive') || 0) + pattern.significance)
      }

      const participantRoles = memory.participants.map((p: any) => p.role)
      for (const role of participantRoles) {
        if (role !== 'observer') {
          const term = this.roleToRelationshipTerm(role)
          if (term) {
            termMap.set(term, (termMap.get(term) || 0) + 0.5)
          }
        }
      }
    }

    return this.sortByFrequency(termMap)
  }

  /**
   * Analyze communication style from memories
   */
  private async analyzeCommunicationStyle(memories: ExtractedMemory[]) {
    const toneMap = new Map<string, number>()
    let expressiveness: 'direct' | 'metaphorical' | 'analytical' | 'emotional' = 'direct'
    const supportLanguageSet = new Set<string>()

    let directCount = 0
    let metaphoricalCount = 0
    let analyticalCount = 0
    let emotionalCount = 0

    for (const memory of memories) {
      const tones = this.extractToneFromMemory(memory)
      for (const tone of tones) {
        toneMap.set(tone, (toneMap.get(tone) || 0) + 1)
      }

      const style = this.analyzeExpressionStyle(memory)
      switch (style) {
        case 'direct': directCount++; break
        case 'metaphorical': metaphoricalCount++; break
        case 'analytical': analyticalCount++; break
        case 'emotional': emotionalCount++; break
      }

      const supportLanguage = this.extractSupportLanguage(memory)
      supportLanguage.forEach(lang => supportLanguageSet.add(lang))
    }

    const maxCount = Math.max(directCount, metaphoricalCount, analyticalCount, emotionalCount)
    if (maxCount === directCount) expressiveness = 'direct'
    else if (maxCount === metaphoricalCount) expressiveness = 'metaphorical'
    else if (maxCount === analyticalCount) expressiveness = 'analytical'
    else expressiveness = 'emotional'

    return {
      tone: this.sortByFrequency(toneMap).slice(0, 5),
      expressiveness,
      supportLanguage: Array.from(supportLanguageSet).slice(0, 8),
    }
  }

  /**
   * Analyze vocabulary evolution over time
   */
  private async analyzeVocabularyEvolution(memories: ExtractedMemory[]): Promise<VocabularyEvolution[]> {
    if (memories.length < 10) return []

    const sortedMemories = this.sortMemoriesByRecency(memories)
    const timeWindows = this.createEvolutionTimeWindows(sortedMemories)

    const evolution: VocabularyEvolution[] = []

    for (let i = 0; i < timeWindows.length - 1; i++) {
      const currentWindow = timeWindows[i]
      const previousWindow = timeWindows[i + 1]

      const currentTerms = await this.extractTermsFromWindow(currentWindow.memories)
      const previousTerms = await this.extractTermsFromWindow(previousWindow.memories)

      const newTerms = currentTerms.filter(term => !previousTerms.includes(term))
      const increasingTerms = this.findIncreasingTerms(currentWindow.memories, previousWindow.memories)
      const decreasingTerms = this.findDecreasingTerms(currentWindow.memories, previousWindow.memories)

      if (newTerms.length > 0 || increasingTerms.length > 0 || decreasingTerms.length > 0) {
        evolution.push({
          period: {
            start: currentWindow.start,
            end: currentWindow.end,
          },
          newTerms: newTerms.slice(0, 5),
          increasingTerms: increasingTerms.slice(0, 5),
          decreasingTerms: decreasingTerms.slice(0, 5),
        })
      }
    }

    return evolution
  }

  /**
   * Apply scope filter to memories
   */
  private applyScopeFilter(memories: ExtractedMemory[]): ExtractedMemory[] {
    const sortedMemories = this.sortMemoriesByRecency(memories)

    switch (this.config.sourceScope) {
      case 'recent':
        return sortedMemories.slice(0, 20)
      case 'significant':
        return sortedMemories.filter(m => m.significance.overall > 6)
      case 'all':
      default:
        return sortedMemories
    }
  }

  /**
   * Sort memories by recency (most recent first)
   */
  private sortMemoriesByRecency(memories: ExtractedMemory[]): ExtractedMemory[] {
    return [...memories].sort((a, b) => 
      b.processing.extractedAt.getTime() - a.processing.extractedAt.getTime()
    )
  }

  /**
   * Sort map entries by frequency
   */
  private sortByFrequency(map: Map<string, number>): string[] {
    return Array.from(map.entries())
      .sort(([, a], [, b]) => b - a)
      .map(([term]) => term)
  }

  /**
   * Normalize theme for consistency
   */
  private normalizeTheme(theme: string): string {
    return theme.toLowerCase().trim().replace(/[^\w\s]/g, '')
  }

  /**
   * Convert pattern type to theme
   */
  private patternToTheme(patternType: string): string | null {
    const mapping: Record<string, string> = {
      'support_seeking': 'seeking support',
      'mood_repair': 'emotional recovery',
      'celebration': 'celebration',
      'vulnerability': 'vulnerability',
      'growth': 'personal growth',
    }
    return mapping[patternType] || null
  }

  /**
   * Normalize mood descriptor
   */
  private normalizeMoodDescriptor(descriptor: string): string {
    return descriptor.toLowerCase().replace(/[^\w]/g, '')
  }

  /**
   * Convert emotional state to descriptor
   */
  private emotionalStateToDescriptor(state: string): string | null {
    const stateMap: Record<string, string> = {
      'joy': 'joyful',
      'sadness': 'sad',
      'anger': 'frustrated',
      'fear': 'anxious',
      'surprise': 'surprised',
      'love': 'loving',
      'gratitude': 'grateful',
    }
    return stateMap[state.toLowerCase()] || null
  }

  /**
   * Convert relationship pattern to term
   */
  private relationshipPatternToTerm(pattern: string): string | null {
    const patternMap: Record<string, string> = {
      'collaborative': 'collaborative',
      'supportive': 'supportive',
      'conflicted': 'challenging',
      'distant': 'distant',
      'intimate': 'close',
    }
    return patternMap[pattern.toLowerCase()] || null
  }

  /**
   * Convert relationship quality to terms
   */
  private qualityToTerms(quality: number): string[] {
    if (quality >= 8) return ['strong', 'positive']
    if (quality >= 6) return ['good', 'stable']
    if (quality >= 4) return ['neutral']
    return ['challenging', 'strained']
  }

  /**
   * Convert participant role to relationship term
   */
  private roleToRelationshipTerm(role: string): string | null {
    const roleMap: Record<string, string> = {
      'primary': 'close connection',
      'secondary': 'acquaintance',
      'supportive': 'supporter',
    }
    return roleMap[role.toLowerCase()] || null
  }

  /**
   * Extract tone indicators from memory
   */
  private extractToneFromMemory(memory: ExtractedMemory): string[] {
    const tones: string[] = []

    const moodScore = memory.emotionalAnalysis.moodScoring.score
    if (moodScore >= 7) tones.push('positive', 'upbeat')
    else if (moodScore <= 3) tones.push('concerned', 'serious')
    else tones.push('balanced')

    const significance = memory.significance.overall
    if (significance >= 8) tones.push('important', 'meaningful')

    const patterns = memory.emotionalAnalysis.patterns
    const hasSupport = patterns.some(p => p.type === 'support_seeking' || p.type === 'mood_repair')
    if (hasSupport) tones.push('supportive', 'caring')

    return tones
  }

  /**
   * Analyze expression style from memory content
   */
  private analyzeExpressionStyle(memory: ExtractedMemory): 'direct' | 'metaphorical' | 'analytical' | 'emotional' {
    const content = memory.content.toLowerCase()

    const metaphorIndicators = ['like', 'as if', 'reminds me', 'similar to', 'feels like']
    const analyticalIndicators = ['because', 'therefore', 'analysis', 'consider', 'rational']
    const emotionalIndicators = ['feel', 'heart', 'soul', 'deeply', 'overwhelming']

    const hasMetaphor = metaphorIndicators.some(indicator => content.includes(indicator))
    const hasAnalytical = analyticalIndicators.some(indicator => content.includes(indicator))
    const hasEmotional = emotionalIndicators.some(indicator => content.includes(indicator))

    if (hasMetaphor) return 'metaphorical'
    if (hasAnalytical) return 'analytical'
    if (hasEmotional) return 'emotional'
    return 'direct'
  }

  /**
   * Extract support language from memory
   */
  private extractSupportLanguage(memory: ExtractedMemory): string[] {
    const supportLanguage: string[] = []
    const content = memory.content.toLowerCase()

    const supportPhrases = [
      'i understand', 'im here for you', 'you can do this', 'it will be okay',
      'i believe in you', 'youre not alone', 'take your time', 'youre doing great'
    ]

    for (const phrase of supportPhrases) {
      if (content.includes(phrase)) {
        supportLanguage.push(phrase)
      }
    }

    const patterns = memory.emotionalAnalysis.patterns
    const supportPatterns = patterns.filter(p => p.type === 'support_seeking' || p.type === 'mood_repair')
    
    if (supportPatterns.length > 0) {
      supportLanguage.push('encouragement', 'validation')
    }

    return supportLanguage
  }

  /**
   * Create time windows for evolution analysis
   */
  private createEvolutionTimeWindows(memories: ExtractedMemory[]): Array<{
    start: Date
    end: Date
    memories: ExtractedMemory[]
  }> {
    if (memories.length < 10) return []

    const sortedMemories = this.sortMemoriesByRecency(memories)
    const windowSize = Math.max(5, Math.floor(memories.length / 4))
    const windows: Array<{ start: Date; end: Date; memories: ExtractedMemory[] }> = []

    for (let i = 0; i < memories.length; i += windowSize) {
      const windowMemories = sortedMemories.slice(i, i + windowSize)
      if (windowMemories.length >= 3) {
        windows.push({
          start: new Date(windowMemories[windowMemories.length - 1].timestamp),
          end: new Date(windowMemories[0].timestamp),
          memories: windowMemories,
        })
      }
    }

    return windows
  }

  /**
   * Extract terms from a window of memories
   */
  private async extractTermsFromWindow(memories: ExtractedMemory[]): Promise<string[]> {
    const terms = new Set<string>()

    for (const memory of memories) {
      const descriptors = memory.emotionalAnalysis.moodScoring.descriptors
      descriptors.forEach(desc => terms.add(this.normalizeMoodDescriptor(desc)))

      const themes = memory.emotionalAnalysis.context.themes || []
      themes.forEach(theme => terms.add(this.normalizeTheme(theme)))
    }

    return Array.from(terms)
  }

  /**
   * Find increasing terms between windows
   */
  private findIncreasingTerms(currentMemories: ExtractedMemory[], previousMemories: ExtractedMemory[]): string[] {
    const currentFreq = this.calculateTermFrequency(currentMemories)
    const previousFreq = this.calculateTermFrequency(previousMemories)

    const increasingTerms: string[] = []

    for (const [term, currentCount] of currentFreq) {
      const previousCount = previousFreq.get(term) || 0
      if (currentCount > previousCount * 1.5 && currentCount >= 2) {
        increasingTerms.push(term)
      }
    }

    return increasingTerms
  }

  /**
   * Find decreasing terms between windows
   */
  private findDecreasingTerms(currentMemories: ExtractedMemory[], previousMemories: ExtractedMemory[]): string[] {
    const currentFreq = this.calculateTermFrequency(currentMemories)
    const previousFreq = this.calculateTermFrequency(previousMemories)

    const decreasingTerms: string[] = []

    for (const [term, previousCount] of previousFreq) {
      const currentCount = currentFreq.get(term) || 0
      if (previousCount > currentCount * 1.5 && previousCount >= 2) {
        decreasingTerms.push(term)
      }
    }

    return decreasingTerms
  }

  /**
   * Calculate term frequency in memories
   */
  private calculateTermFrequency(memories: ExtractedMemory[]): Map<string, number> {
    const frequency = new Map<string, number>()

    for (const memory of memories) {
      const descriptors = memory.emotionalAnalysis.moodScoring.descriptors
      descriptors.forEach(desc => {
        const term = this.normalizeMoodDescriptor(desc)
        frequency.set(term, (frequency.get(term) || 0) + 1)
      })

      const themes = memory.emotionalAnalysis.context.themes || []
      themes.forEach(theme => {
        const term = this.normalizeTheme(theme)
        frequency.set(term, (frequency.get(term) || 0) + 1)
      })
    }

    return frequency
  }

  /**
   * Create empty vocabulary for no data scenarios
   */
  private createEmptyVocabulary(participantId: string): EmotionalVocabulary {
    return {
      participantId,
      themes: [],
      moodDescriptors: ['neutral'],
      relationshipTerms: [],
      communicationStyle: {
        tone: ['neutral'],
        expressiveness: 'direct',
        supportLanguage: [],
      },
      evolution: [],
    }
  }
}
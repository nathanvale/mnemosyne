import type { ConversationMessage, MoodAnalysisResult } from '../types/index'
import type { LLMProvider } from './llm-provider.interface'

/**
 * Options for building mood-aware prompts
 */
export interface PromptBuilderOptions {
  messages: ConversationMessage[]
  moodAnalysis: MoodAnalysisResult
  provider: LLMProvider
  maxMessages?: number
  includeContext?: boolean
  schemaVersion?: string
}

/**
 * Statistics about prompt building process
 */
export interface PromptStatistics {
  messageCount: number
  selectedMessageCount: number
  prunedCount: number
  estimatedTokens: number
  salienceScores: number[]
}

/**
 * Result of building a mood-aware prompt
 */
export interface PromptBuilderResult {
  prompt: string
  statistics: PromptStatistics
  selectedMessageIds: string[]
  schemaVersion: string
}

/**
 * Message with emotional salience score for selection
 */
interface SalienceMessage {
  message: ConversationMessage
  salience: number
  index: number
}

/**
 * PromptBuilder creates mood-aware prompts for LLM memory extraction
 */
export class PromptBuilder {
  constructor() {
    // Constructor implementation
  }

  /**
   * Build a mood-aware prompt for memory extraction
   */
  async buildMoodAwarePrompt(
    options: PromptBuilderOptions,
  ): Promise<PromptBuilderResult> {
    const {
      messages,
      moodAnalysis,
      provider,
      maxMessages,
      includeContext = false,
      schemaVersion = 'v1',
    } = options

    if (!moodAnalysis) {
      throw new Error('moodAnalysis is required')
    }

    // Calculate emotional salience scores
    const salienceMessages = this.calculateSalienceScores(
      messages,
      moodAnalysis,
    )

    // Select messages based on salience and constraints
    const selectedMessages = await this.selectMessages(
      salienceMessages,
      provider,
      maxMessages,
      includeContext,
    )

    // Build the complete prompt
    const prompt = this.buildPrompt(
      selectedMessages,
      moodAnalysis,
      provider,
      schemaVersion,
    )

    // Calculate final statistics
    let estimatedTokens = 0
    try {
      estimatedTokens = await provider.countTokens(prompt)
    } catch {
      // Gracefully handle token counting failures by estimating
      estimatedTokens = Math.ceil(prompt.length / 4)
    }

    return {
      prompt,
      statistics: {
        messageCount: messages.length,
        selectedMessageCount: selectedMessages.length,
        prunedCount: messages.length - selectedMessages.length,
        estimatedTokens,
        salienceScores: salienceMessages.map((sm) => sm.salience),
      },
      selectedMessageIds: selectedMessages.map((sm) => sm.message.id),
      schemaVersion,
    }
  }

  /**
   * Calculate emotional salience scores for each message
   */
  private calculateSalienceScores(
    messages: ConversationMessage[],
    moodAnalysis: MoodAnalysisResult,
  ): SalienceMessage[] {
    return messages.map((message, index) => {
      let salience = this.getBaseSalienceScore(message.content)

      // Boost messages with mood delta factors
      if (moodAnalysis.delta?.factors) {
        salience += this.calculateDeltaBoost(
          message.content,
          moodAnalysis.delta.factors,
        )
      }

      // Boost messages with emotional significance keywords
      salience += this.calculateEmotionalBoost(message.content, moodAnalysis)

      return {
        message,
        salience: Math.min(salience, 10), // Cap at 10
        index,
      }
    })
  }

  /**
   * Calculate base salience score from message content
   */
  private getBaseSalienceScore(content: string): number {
    const emotionalKeywords = [
      'grateful',
      'support',
      'breakthrough',
      'amazing',
      'understand',
      'finally',
      'struggling',
      'anxiety',
      'difficult',
      'help',
      'thank',
      'appreciate',
      'love',
      'care',
      'feel',
      'emotion',
      'heart',
      'soul',
      'moment',
      'realize',
    ]

    const lowSalienceWords = [
      'weather',
      'sounds good',
      'ok',
      'update',
      'regular',
      'nice day',
    ]

    let score = 3.0 // Base score
    const lowerContent = content.toLowerCase()

    // Boost for emotional keywords
    for (const keyword of emotionalKeywords) {
      if (lowerContent.includes(keyword)) {
        score += 2.0
      }
    }

    // Reduce for low salience words
    for (const word of lowSalienceWords) {
      if (lowerContent.includes(word)) {
        score -= 1.5
      }
    }

    // Boost for exclamation points and strong language
    if (content.includes('!')) score += 1.0
    if (content.length > 100) score += 0.5 // Longer messages might be more significant

    return Math.max(score, 1.0) // Minimum score of 1
  }

  /**
   * Calculate boost from mood delta factors
   */
  private calculateDeltaBoost(content: string, factors: string[]): number {
    let boost = 0
    const lowerContent = content.toLowerCase()

    for (const factor of factors) {
      const lowerFactor = factor.toLowerCase()
      if (lowerContent.includes('support') && lowerFactor.includes('support')) {
        boost += 2.0
      }
      if (
        lowerContent.includes('breakthrough') &&
        lowerFactor.includes('breakthrough')
      ) {
        boost += 2.0
      }
      if (lowerContent.includes('help') && lowerFactor.includes('emotional')) {
        boost += 1.5
      }
    }

    return boost
  }

  /**
   * Calculate boost from emotional analysis
   */
  private calculateEmotionalBoost(
    content: string,
    moodAnalysis: MoodAnalysisResult,
  ): number {
    let boost = 0
    const lowerContent = content.toLowerCase()

    // Boost messages containing mood descriptors
    for (const descriptor of moodAnalysis.descriptors) {
      if (lowerContent.includes(descriptor.toLowerCase())) {
        boost += 1.0
      }
    }

    return boost
  }

  /**
   * Select messages based on salience and constraints
   */
  private async selectMessages(
    salienceMessages: SalienceMessage[],
    provider: LLMProvider,
    maxMessages?: number,
    includeContext = false,
  ): Promise<SalienceMessage[]> {
    // Sort by salience (descending)
    const sortedMessages = [...salienceMessages].sort(
      (a, b) => b.salience - a.salience,
    )

    let selectedMessages: SalienceMessage[] = []

    if (maxMessages) {
      // Select top K messages by salience
      selectedMessages = sortedMessages.slice(0, maxMessages)

      // Add context messages if requested
      if (includeContext) {
        selectedMessages = this.addContextMessages(
          selectedMessages,
          salienceMessages,
        )
      }

      // Check token constraints and prune if necessary
      selectedMessages = await this.enforceTokenLimits(
        selectedMessages,
        provider,
      )
    } else {
      selectedMessages = await this.enforceTokenLimits(sortedMessages, provider)
    }

    // Sort back by original order for coherent prompt
    return selectedMessages.sort((a, b) => a.index - b.index)
  }

  /**
   * Add context messages around high-salience selections
   */
  private addContextMessages(
    selected: SalienceMessage[],
    allMessages: SalienceMessage[],
  ): SalienceMessage[] {
    const contextSet = new Set(selected)

    for (const selectedMsg of selected) {
      // Add preceding message
      if (selectedMsg.index > 0) {
        contextSet.add(allMessages[selectedMsg.index - 1])
      }

      // Add following message
      if (selectedMsg.index < allMessages.length - 1) {
        contextSet.add(allMessages[selectedMsg.index + 1])
      }
    }

    return Array.from(contextSet)
  }

  /**
   * Enforce token limits by pruning lowest salience messages
   */
  private async enforceTokenLimits(
    messages: SalienceMessage[],
    provider: LLMProvider,
  ): Promise<SalienceMessage[]> {
    const capabilities = provider.getCapabilities()
    const targetTokenLimit = Math.floor(capabilities.maxInputTokens * 0.9) // Use 90% of limit

    // Try with all messages first
    let testPrompt = this.buildPrompt(
      messages.sort((a, b) => a.index - b.index),
      {
        score: 5.0,
        descriptors: ['test'],
        confidence: 0.8,
        factors: [],
      },
      provider,
      'v1',
    )

    let estimatedTokens: number
    try {
      estimatedTokens = await provider.countTokens(testPrompt)
    } catch {
      // Fallback estimation
      estimatedTokens = Math.ceil(testPrompt.length / 4)
    }

    if (estimatedTokens <= targetTokenLimit) {
      return messages
    }

    // Prune messages by removing lowest salience ones
    const sortedBySalience = [...messages].sort(
      (a, b) => b.salience - a.salience,
    )

    for (let i = Math.floor(messages.length * 0.8); i > 0; i--) {
      const candidate = sortedBySalience.slice(0, i)
      testPrompt = this.buildPrompt(
        candidate.sort((a, b) => a.index - b.index),
        {
          score: 5.0,
          descriptors: ['test'],
          confidence: 0.8,
          factors: [],
        },
        provider,
        'v1',
      )

      try {
        estimatedTokens = await provider.countTokens(testPrompt)
      } catch {
        estimatedTokens = Math.ceil(testPrompt.length / 4)
      }

      if (estimatedTokens <= targetTokenLimit) {
        return candidate
      }
    }

    // Return at least the highest salience message
    return sortedBySalience.slice(0, 1)
  }

  /**
   * Build the complete prompt with all sections
   */
  private buildPrompt(
    messages: SalienceMessage[],
    moodAnalysis: MoodAnalysisResult,
    provider: LLMProvider,
    schemaVersion: string,
  ): string {
    const capabilities = provider.getCapabilities()
    const sections: string[] = []

    // System instructions (for capable providers)
    if (capabilities.jsonMode) {
      sections.push(this.buildSystemInstructions())
    }

    // Mood context section
    sections.push(this.buildMoodContext(moodAnalysis))

    // Emotional salience guidance
    sections.push(this.buildSalienceGuidance())

    // JSON schema section
    sections.push(this.buildJsonSchema(schemaVersion))

    // Messages section
    sections.push(this.buildMessagesSection(messages))

    // Extraction instructions (for limited providers)
    if (!capabilities.jsonMode) {
      sections.push(this.buildExtractionInstructions())
    }

    return sections.join('\n\n')
  }

  /**
   * Build system instructions block
   */
  private buildSystemInstructions(): string {
    return `## EXTRACTION INSTRUCTIONS

Extract meaningful memories from the conversation below, focusing on:
- emotional significance and personal growth moments
- relationship dynamics and interpersonal connections  
- Breakthrough insights or important realizations
- Support patterns and vulnerability sharing
- Moments of joy, gratitude, or celebration
- Times of struggle that led to growth or understanding`
  }

  /**
   * Build mood context section
   */
  private buildMoodContext(moodAnalysis: MoodAnalysisResult): string {
    let context = `## MOOD CONTEXT

Current mood score: ${moodAnalysis.score.toFixed(1)}
Mood descriptors: ${moodAnalysis.descriptors.join(', ')}
Analysis confidence: ${Math.round(moodAnalysis.confidence * 100)}%`

    if (moodAnalysis.delta) {
      context += `

## MOOD DELTA DETECTED
mood delta detected with the following details:
- magnitude: ${moodAnalysis.delta.magnitude}
- direction: ${moodAnalysis.delta.direction}
- type: ${moodAnalysis.delta.type}
- Contributing factors: ${moodAnalysis.delta.factors.join(', ')}`
    }

    return context
  }

  /**
   * Build emotional salience guidance
   */
  private buildSalienceGuidance(): string {
    return `## EMOTIONAL SALIENCE GUIDANCE

When extracting memories, prioritize messages with high emotional salience:
- High significance moments (breakthroughs, realizations, support)
- Strong relationship impact (bonding, conflict resolution, vulnerability)
- Emotional intensity markers (gratitude, struggle, joy, growth)`
  }

  /**
   * Build JSON schema section
   */
  private buildJsonSchema(schemaVersion: string): string {
    return `## OUTPUT FORMAT

Return a JSON object with schema version: memory_llm_response_${schemaVersion}

The response must be a JSON object containing:
{
  "memories": [
    {
      "content": "string - the extracted memory description",
      "timestamp": "string - ISO timestamp of the memory",
      "author": "string - primary author/participant",
      "participants": ["array of participant IDs"],
      "emotionalContext": "string - emotional state during this memory",
      "relationshipDynamics": "string - relationship dynamics observed",
      "tags": ["array of relevant tags"],
      "metadata": {
        "confidence": "number - extraction confidence 0-1"
      }
    }
  ]
}

This is an array of memory objects extracted from the conversation.`
  }

  /**
   * Build messages section
   */
  private buildMessagesSection(messages: SalienceMessage[]): string {
    let section = '## CONVERSATION MESSAGES\n'

    for (const { message } of messages) {
      section += `\n**${message.authorId}** (${message.timestamp.toISOString()}):\n${message.content}`
    }

    return section
  }

  /**
   * Build extraction instructions for limited providers
   */
  private buildExtractionInstructions(): string {
    return `## INSTRUCTIONS

Please extract memories from the conversation following the following instructions and format specified above. Focus on emotionally significant moments and relationship dynamics that would be valuable to preserve as memories.`
  }
}

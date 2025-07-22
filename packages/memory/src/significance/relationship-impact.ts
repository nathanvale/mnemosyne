import { createLogger } from '@studio/logger'

import type { RelationshipDynamics, ConversationParticipant } from '../types'

const logger = createLogger({
  tags: ['significance', 'relationship-impact'],
})

/**
 * RelationshipImpactAnalyzer assesses the impact of emotional content
 * on relationship dynamics and interpersonal connections
 */
export class RelationshipImpactAnalyzer {
  /**
   * Assess relationship impact of memory content
   */
  async assessImpact(
    relationshipDynamics: RelationshipDynamics,
    participants: ConversationParticipant[],
  ): Promise<number> {
    logger.debug('Assessing relationship impact', {
      dynamicsType: relationshipDynamics.type,
      participantCount: participants.length,
      supportLevel: relationshipDynamics.supportLevel,
    })

    let impactScore = 5.0 // Base score

    // Factor in relationship type importance
    const typeWeight = this.getRelationshipTypeWeight(relationshipDynamics.type)
    impactScore += typeWeight

    // Factor in support level changes
    const supportImpact = this.calculateSupportImpact(
      relationshipDynamics.supportLevel,
    )
    impactScore += supportImpact

    // Factor in intimacy level
    const intimacyImpact = this.calculateIntimacyImpact(
      relationshipDynamics.intimacyLevel,
    )
    impactScore += intimacyImpact

    // Factor in conflict presence
    const conflictImpact = this.calculateConflictImpact(
      relationshipDynamics.conflictLevel,
    )
    impactScore += conflictImpact

    // Factor in participant dynamics
    const participantImpact = this.calculateParticipantImpact(participants)
    impactScore += participantImpact

    // Factor in emotional expression patterns
    const expressionImpact =
      this.calculateExpressionImpact(relationshipDynamics)
    impactScore += expressionImpact

    // Normalize to 0-10 scale
    const finalScore = Math.min(10, Math.max(0, impactScore))

    logger.info('Relationship impact assessment complete', {
      typeWeight,
      supportImpact,
      intimacyImpact,
      conflictImpact,
      participantImpact,
      expressionImpact,
      finalScore,
    })

    return finalScore
  }

  /**
   * Calculate trust impact factors
   */
  calculateTrustImpact(
    trustLevel: RelationshipDynamics['trustLevel'],
    supportLevel: RelationshipDynamics['supportLevel'],
  ): number {
    let impact = 0

    // High trust with high support = positive relationship moment
    if (trustLevel === 'high' && supportLevel === 'high') {
      impact += 1.5
    }

    // Low trust with vulnerability = significant moment
    if (trustLevel === 'low' && supportLevel === 'medium') {
      impact += 2.0
    }

    // Trust building moments
    if (trustLevel === 'medium' && supportLevel === 'high') {
      impact += 1.8
    }

    return impact
  }

  /**
   * Assess communication quality impact
   */
  assessCommunicationQuality(
    participants: ConversationParticipant[],
    intimacyLevel: RelationshipDynamics['intimacyLevel'],
  ): number {
    let quality = 0

    // Check for mutual engagement
    const activeParticipants = participants.filter(
      (p) => (p.messageCount ?? 0) > 2,
    )
    if (activeParticipants.length >= 2) {
      quality += 1.0
    }

    // Check for emotional reciprocity
    const emotionalParticipants = participants.filter(
      (p) => p.emotionalExpressions && p.emotionalExpressions.length > 0,
    )
    if (emotionalParticipants.length >= 2) {
      quality += 1.5
    }

    // Factor in intimacy level
    const intimacyBonus = this.getIntimacyBonus(intimacyLevel)
    quality += intimacyBonus

    // Check for support patterns
    const supportiveParticipants = participants.filter(
      (p) => p.role === 'supporter' || p.role === 'listener',
    )
    if (supportiveParticipants.length > 0) {
      quality += 1.2
    }

    return quality
  }

  /**
   * Calculate vulnerability sharing impact
   */
  calculateVulnerabilityImpact(
    participants: ConversationParticipant[],
    intimacyLevel: RelationshipDynamics['intimacyLevel'],
  ): number {
    let impact = 0

    // Check for vulnerability indicators
    const vulnerableParticipant = participants.find(
      (p) => p.role === 'vulnerable_sharer',
    )
    if (vulnerableParticipant) {
      impact += 2.0

      // Extra impact if vulnerability is reciprocated
      const reciprocalVulnerability = participants.filter((p) =>
        p.emotionalExpressions?.some(
          (expr) =>
            expr.toLowerCase().includes('honest') ||
            expr.toLowerCase().includes('admit') ||
            expr.toLowerCase().includes('scared'),
        ),
      )

      if (reciprocalVulnerability.length > 1) {
        impact += 1.5
      }
    }

    // Factor in intimacy context
    if (intimacyLevel === 'high' && vulnerableParticipant) {
      impact += 1.0
    } else if (intimacyLevel === 'low' && vulnerableParticipant) {
      impact += 2.5 // Vulnerability in low-intimacy contexts is very significant
    }

    return impact
  }

  // Private helper methods

  private getRelationshipTypeWeight(
    type: RelationshipDynamics['type'],
  ): number {
    const weights: Record<RelationshipDynamics['type'], number> = {
      romantic: 2.0,
      family: 1.8,
      close_friend: 1.5,
      friend: 1.0,
      colleague: 0.8,
      acquaintance: 0.5,
      professional: 0.7,
      therapeutic: 1.6,
    }

    return weights[type] || 1.0
  }

  private calculateSupportImpact(
    supportLevel: RelationshipDynamics['supportLevel'],
  ): number {
    const supportWeights: Record<RelationshipDynamics['supportLevel'], number> =
      {
        high: 1.5,
        medium: 1.0,
        low: 0.5,
        negative: -1.0,
      }

    return supportWeights[supportLevel] || 0
  }

  private calculateIntimacyImpact(
    intimacyLevel: RelationshipDynamics['intimacyLevel'],
  ): number {
    const intimacyWeights: Record<
      RelationshipDynamics['intimacyLevel'],
      number
    > = {
      high: 1.2,
      medium: 0.8,
      low: 0.4,
    }

    return intimacyWeights[intimacyLevel] || 0
  }

  private calculateConflictImpact(
    conflictLevel: RelationshipDynamics['conflictLevel'],
  ): number {
    const conflictWeights: Record<
      RelationshipDynamics['conflictLevel'],
      number
    > = {
      high: 2.5, // High conflict is very significant
      medium: 1.5,
      low: 0.5,
      none: 0,
    }

    return conflictWeights[conflictLevel] || 0
  }

  private calculateParticipantImpact(
    participants: ConversationParticipant[],
  ): number {
    let impact = 0

    // More participants can increase complexity and significance
    if (participants.length > 2) {
      impact += 0.5
    }

    // Check for diverse roles
    const roles = new Set(participants.map((p) => p.role))
    if (roles.size > 2) {
      impact += 0.8
    }

    // Check for emotional leadership
    const emotionalLeader = participants.find(
      (p) => p.role === 'emotional_leader' || p.role === 'supporter',
    )
    if (emotionalLeader) {
      impact += 1.0
    }

    // Check for balanced participation
    const totalMessages = participants.reduce(
      (sum, p) => sum + (p.messageCount ?? 0),
      0,
    )
    const averageMessages = totalMessages / participants.length
    const balancedParticipants = participants.filter(
      (p) =>
        Math.abs((p.messageCount ?? 0) - averageMessages) <
        averageMessages * 0.5,
    )

    if (balancedParticipants.length === participants.length) {
      impact += 0.7 // Balanced conversation
    }

    return impact
  }

  private calculateExpressionImpact(
    relationshipDynamics: RelationshipDynamics,
  ): number {
    let impact = 0

    // Check trust level progression potential
    if (
      relationshipDynamics.trustLevel === 'medium' &&
      relationshipDynamics.supportLevel === 'high'
    ) {
      impact += 1.0 // Trust building opportunity
    }

    // Check for emotional breakthrough indicators
    if (
      relationshipDynamics.intimacyLevel === 'high' &&
      relationshipDynamics.conflictLevel === 'low'
    ) {
      impact += 0.8 // Positive emotional space
    }

    // Check for relationship repair patterns
    if (
      relationshipDynamics.conflictLevel === 'medium' &&
      relationshipDynamics.supportLevel === 'medium'
    ) {
      impact += 1.2 // Potential resolution
    }

    return impact
  }

  private getIntimacyBonus(
    intimacyLevel: RelationshipDynamics['intimacyLevel'],
  ): number {
    const bonuses: Record<RelationshipDynamics['intimacyLevel'], number> = {
      high: 0.8,
      medium: 0.5,
      low: 0.2,
    }

    return bonuses[intimacyLevel] || 0
  }
}

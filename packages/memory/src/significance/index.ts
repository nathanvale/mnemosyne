/**
 * @studio/memory/significance - Emotional significance assessment
 *
 * This module provides comprehensive significance analysis for emotional
 * memories, including salience calculation, relationship impact assessment,
 * and memory prioritization.
 */

// Core significance analysis
export {
  EmotionalSignificanceAnalyzer,
  type SignificanceAnalyzerConfig,
} from './analyzer'
export { SalienceCalculator } from './salience-calculator'
export { RelationshipImpactAnalyzer } from './relationship-impact'
export { MemoryPrioritizer } from './prioritizer'

// Re-export related types from main types module
export type {
  EmotionalSignificanceScore,
  ExtractedMemory,
  EmotionalAnalysis,
  RelationshipDynamics,
  ConversationParticipant,
} from '../types'

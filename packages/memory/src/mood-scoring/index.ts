/**
 * @studio/memory/mood-scoring - Mood analysis and emotional intelligence
 *
 * This module provides comprehensive mood scoring capabilities for emotional
 * memory processing, including delta detection and pattern recognition.
 */

// Core mood scoring
export { MoodScoringAnalyzer } from './analyzer'
export { DeltaDetector, type DeltaDetectorConfig } from './delta-detector'
export {
  ConfidenceCalculator,
  type ConfidenceFactors,
} from './confidence-calculator'
export {
  PatternRecognizer,
  type PatternRecognizerConfig,
} from './pattern-recognizer'

// Re-export related types from main types module
export type {
  MoodAnalysisResult,
  MoodFactor,
  MoodDelta,
  EmotionalPattern,
  EmotionalTrajectory,
  TrajectoryPoint,
  TurningPoint,
} from '../types'

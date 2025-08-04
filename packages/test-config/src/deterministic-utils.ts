/**
 * Deterministic utilities for consistent test data generation
 * Replaces Math.random() and Date.now() with predictable alternatives
 */

export class DeterministicGenerator {
  private seed: number
  private originalSeed: number

  constructor(seed = 12345) {
    this.seed = seed
    this.originalSeed = seed
  }

  /**
   * Deterministic random number generator using Linear Congruential Generator
   * Returns values between 0 and 1 (exclusive)
   */
  random(): number {
    this.seed = (this.seed * 9301 + 49297) % 233280
    return this.seed / 233280
  }

  /**
   * Generate deterministic string ID
   */
  randomId(prefix = 'id', length = 9): string {
    const chars = 'abcdefghijklmnopqrstuvwxyz0123456789'
    let result = ''
    for (let i = 0; i < length; i++) {
      result += chars[Math.floor(this.random() * chars.length)]
    }
    return `${prefix}-${result}`
  }

  /**
   * Generate deterministic integer within range
   */
  randomInt(min: number, max: number): number {
    return Math.floor(this.random() * (max - min + 1)) + min
  }

  /**
   * Generate deterministic float within range
   */
  randomFloat(min: number, max: number): number {
    return this.random() * (max - min) + min
  }

  /**
   * Select random element from array deterministically
   */
  randomChoice<T>(array: T[]): T {
    return array[Math.floor(this.random() * array.length)]
  }

  /**
   * Reset seed to original value
   */
  reset(): void {
    this.seed = this.originalSeed
  }

  /**
   * Set new seed
   */
  setSeed(newSeed: number): void {
    this.seed = newSeed
    this.originalSeed = newSeed
  }
}

export class DeterministicDate {
  private baseTimestamp: number

  constructor(baseDate = '2025-01-01T00:00:00.000Z') {
    this.baseTimestamp = new Date(baseDate).getTime()
  }

  /**
   * Get deterministic date with offset in milliseconds
   */
  getDate(offsetMs = 0): Date {
    return new Date(this.baseTimestamp + offsetMs)
  }

  /**
   * Get deterministic timestamp with offset
   */
  getTimestamp(offsetMs = 0): number {
    return this.baseTimestamp + offsetMs
  }

  /**
   * Get date with deterministic random offset within range
   */
  getRandomDate(
    generator: DeterministicGenerator,
    minOffsetMs = 0,
    maxOffsetMs = 86400000, // 1 day
  ): Date {
    const offset = generator.randomInt(minOffsetMs, maxOffsetMs)
    return this.getDate(offset)
  }
}

// Global instances for test use
export const testRandom = new DeterministicGenerator()
export const testDate = new DeterministicDate()

/**
 * Reset all deterministic generators to initial state
 * Call this in beforeEach hooks to ensure test isolation
 */
export function resetTestGenerators(): void {
  testRandom.reset()
}
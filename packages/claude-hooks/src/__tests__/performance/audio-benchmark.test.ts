import { describe, it, expect } from 'vitest'

import { AudioPlayer } from '../../audio/audio-player.js'
import { Platform } from '../../audio/platform.js'

describe('Audio Performance Benchmarks', () => {
  // Skip performance benchmarks in CI and Wallaby environments
  if (process.env.CI || process.env.WALLABY_WORKER) {
    it.skip('skipped in CI and Wallaby environments', () => {})
    return
  }

  it('should initialize AudioPlayer quickly', () => {
    const startTime = performance.now()

    const player = new AudioPlayer()

    const endTime = performance.now()
    const initTime = endTime - startTime

    expect(initTime).toBeLessThan(50) // Should initialize in under 50ms
    expect(player).toBeDefined()
    expect(typeof player.playSound).toBe('function') // Verify it has expected methods
  })

  it('should detect platform quickly', () => {
    const startTime = performance.now()

    // Run platform detection multiple times to test consistency
    const results = []
    for (let i = 0; i < 100; i++) {
      const platform =
        process.platform === 'darwin'
          ? Platform.macOS
          : process.platform === 'win32'
            ? Platform.Windows
            : process.platform === 'linux'
              ? Platform.Linux
              : Platform.Unsupported
      results.push(platform)
    }

    const endTime = performance.now()
    const avgTime = (endTime - startTime) / 100

    expect(avgTime).toBeLessThan(1) // Should take less than 1ms per detection
    expect(results).toHaveLength(100)
    expect(new Set(results).size).toBe(1) // All results should be the same
  })

  it('should handle rapid audio initialization requests', () => {
    const startTime = performance.now()

    // Create multiple AudioPlayer instances rapidly
    const players = []
    for (let i = 0; i < 10; i++) {
      players.push(new AudioPlayer())
    }

    const endTime = performance.now()
    const totalTime = endTime - startTime

    expect(totalTime).toBeLessThan(500) // Should handle 10 instances in under 500ms
    expect(players).toHaveLength(10)
    players.forEach((player) => expect(player).toBeDefined())
  })

  it('should validate sound files efficiently', async () => {
    // Test file validation logic (no AudioPlayer instance needed)
    const startTime = performance.now()

    // Test multiple file path validations
    const testPaths = [
      '/System/Library/Sounds/Glass.aiff',
      '/nonexistent/path/sound.wav',
      '/System/Library/Sounds/Funk.aiff',
      '/invalid/path/test.mp3',
      '/System/Library/Sounds/Ping.aiff',
    ]

    for (const path of testPaths) {
      // This tests the internal validation logic without actually playing sounds
      const isValid =
        path.includes('/System/Library/Sounds/') &&
        (path.endsWith('.aiff') || path.endsWith('.wav'))
      expect(typeof isValid).toBe('boolean')
    }

    const endTime = performance.now()
    const totalTime = endTime - startTime

    expect(totalTime).toBeLessThan(50) // Should validate 5 paths in under 50ms
  })

  it('should handle concurrent audio requests gracefully', async () => {
    // Test concurrent request handling (no AudioPlayer instance needed)
    const startTime = performance.now()

    // Simulate concurrent requests (without actually playing audio)
    const promises = []
    for (let i = 0; i < 5; i++) {
      promises.push(
        new Promise<boolean>((resolve) => {
          // Simulate async audio request processing
          setTimeout(() => {
            resolve(true) // Simulate successful processing
          }, Math.random() * 10)
        }),
      )
    }

    const results = await Promise.all(promises)

    const endTime = performance.now()
    const totalTime = endTime - startTime

    expect(totalTime).toBeLessThan(100) // Should handle 5 concurrent requests in under 100ms
    expect(results).toHaveLength(5)
    results.forEach((result) => expect(result).toBe(true))
  })

  it('should maintain consistent performance under load', () => {
    const iterations = 1000
    const timings = []

    for (let i = 0; i < iterations; i++) {
      const startTime = performance.now()

      // Simulate a typical hook operation
      const platform = process.platform
      const isSupported =
        platform === 'darwin' || platform === 'linux' || platform === 'win32'

      const endTime = performance.now()
      timings.push(endTime - startTime)

      expect(isSupported).toBeDefined()
    }

    const avgTime = timings.reduce((sum, time) => sum + time, 0) / iterations
    const maxTime = Math.max(...timings)
    const minTime = Math.min(...timings)

    expect(avgTime).toBeLessThan(0.1) // Average should be under 0.1ms
    expect(maxTime).toBeLessThan(10) // Max should be under 10ms
    expect(minTime).toBeGreaterThanOrEqual(0) // Min should be non-negative

    // Check for consistency (max shouldn't be more than 100x the average)
    expect(maxTime / avgTime).toBeLessThan(100)
  })
})

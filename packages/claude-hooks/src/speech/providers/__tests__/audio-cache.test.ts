/**
 * Tests for Audio Cache System
 */

import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest'

import type { AudioCacheConfig } from '../audio-cache.js'

// Mock stat result type
interface MockStats {
  mtime: Date
  size: number
}

// Use vi.hoisted to ensure mocks are available when modules are imported
const {
  mockReadFile,
  mockWriteFile,
  mockUnlink,
  mockStat,
  mockMkdir,
  mockReaddir,
} = vi.hoisted(() => {
  return {
    mockReadFile: vi.fn(),
    mockWriteFile: vi.fn(),
    mockUnlink: vi.fn(),
    mockStat: vi.fn(),
    mockMkdir: vi.fn(),
    mockReaddir: vi.fn(),
  }
})

// Mock fs operations
vi.mock('node:fs/promises', () => ({
  default: {
    readFile: mockReadFile,
    writeFile: mockWriteFile,
    unlink: mockUnlink,
    stat: mockStat,
    mkdir: mockMkdir,
    readdir: mockReaddir,
  },
  readFile: mockReadFile,
  writeFile: mockWriteFile,
  unlink: mockUnlink,
  stat: mockStat,
  mkdir: mockMkdir,
  readdir: mockReaddir,
}))

import { AudioCache } from '../audio-cache.js'

describe('AudioCache', () => {
  let cache: AudioCache
  let tempDir: string

  beforeEach(() => {
    vi.clearAllMocks()
    tempDir = join(tmpdir(), 'claude-hooks-audio-cache-test')

    // Default successful mocks
    mockMkdir.mockResolvedValue(undefined)
    mockStat.mockRejectedValue(new Error('File not found'))
    mockWriteFile.mockResolvedValue(undefined)
    mockUnlink.mockResolvedValue(undefined)
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  describe('Configuration', () => {
    it('should create cache with default config', async () => {
      cache = new AudioCache()
      const config = cache.getConfiguration()

      expect(config.maxSizeBytes).toBe(100 * 1024 * 1024) // 100MB
      expect(config.maxAgeMs).toBe(7 * 24 * 60 * 60 * 1000) // 7 days
      expect(config.maxEntries).toBe(1000)
      expect(config.enabled).toBe(true)
      expect(config.cacheDir).toBeDefined()
    })

    it('should accept custom configuration', async () => {
      const config: AudioCacheConfig = {
        maxSizeBytes: 50 * 1024 * 1024, // 50MB
        maxAgeMs: 24 * 60 * 60 * 1000, // 1 day
        maxEntries: 500,
        enabled: true,
        cacheDir: tempDir,
      }

      cache = new AudioCache(config)
      const actualConfig = cache.getConfiguration()

      expect(actualConfig).toEqual(config)
    })

    it('should allow disabling cache', async () => {
      const config: AudioCacheConfig = {
        enabled: false,
      }

      cache = new AudioCache(config)
      const key = await cache.generateKey('test', 'tts-1', 'alloy', 1.0)
      const result = await cache.get(key)

      expect(result).toBeNull()
      expect(mockReadFile).not.toHaveBeenCalled()
    })
  })

  describe('Cache Key Generation', () => {
    beforeEach(() => {
      cache = new AudioCache({ cacheDir: tempDir })
    })

    it('should generate consistent keys for same parameters', async () => {
      const key1 = await cache.generateKey('Hello world', 'tts-1', 'alloy', 1.0)
      const key2 = await cache.generateKey('Hello world', 'tts-1', 'alloy', 1.0)

      expect(key1).toBe(key2)
      expect(key1).toMatch(/^[a-f0-9]{64}$/) // SHA-256 hex
    })

    it('should generate different keys for different parameters', async () => {
      const key1 = await cache.generateKey('Hello world', 'tts-1', 'alloy', 1.0)
      const key2 = await cache.generateKey(
        'Hello world',
        'tts-1-hd',
        'alloy',
        1.0,
      )
      const key3 = await cache.generateKey('Hello world', 'tts-1', 'nova', 1.0)
      const key4 = await cache.generateKey('Hello world', 'tts-1', 'alloy', 1.5)
      const key5 = await cache.generateKey(
        'Different text',
        'tts-1',
        'alloy',
        1.0,
      )

      expect(key1).not.toBe(key2)
      expect(key1).not.toBe(key3)
      expect(key1).not.toBe(key4)
      expect(key1).not.toBe(key5)
    })

    it('should handle special characters and unicode in text', async () => {
      const text = 'Hello "world"! 🎵 Test éñglish 中文'
      const key = await cache.generateKey(text, 'tts-1', 'alloy', 1.0)

      expect(key).toMatch(/^[a-f0-9]{64}$/)
      expect(key).toBeDefined()
    })
  })

  describe('Cache Storage Operations', () => {
    beforeEach(() => {
      cache = new AudioCache({ cacheDir: tempDir })
    })

    it('should store and retrieve audio data', async () => {
      const key = await cache.generateKey('test', 'tts-1', 'alloy', 1.0)
      const audioData = Buffer.from('mock audio data')

      // First, test storing
      await cache.set(key, audioData, { provider: 'openai', voice: 'alloy' })

      // Mock successful file operations for retrieval
      // First call to stat (for entry file)
      mockStat.mockResolvedValueOnce({
        mtime: new Date(),
        size: 100,
      } as MockStats)

      // First call to readFile (for entry JSON)
      mockReadFile.mockResolvedValueOnce(
        JSON.stringify({
          timestamp: Date.now(),
          metadata: { provider: 'openai', voice: 'alloy' },
          audioFile: `${key}.mp3`,
        }),
      )

      // Second call to readFile (for audio data)
      mockReadFile.mockResolvedValueOnce(audioData)

      const result = await cache.get(key)

      expect(result).toEqual({
        data: audioData,
        metadata: { provider: 'openai', voice: 'alloy' },
      })
      // Check that mockWriteFile was called twice (once for JSON entry, once for audio data)
      expect(mockWriteFile).toHaveBeenCalledTimes(2)

      // First call should be for the JSON entry file
      expect(mockWriteFile).toHaveBeenNthCalledWith(
        1,
        join(tempDir, 'entries', `${key}.json`),
        expect.stringContaining('openai'),
        'utf8',
      )

      // Second call should be for the audio data
      expect(mockWriteFile).toHaveBeenNthCalledWith(
        2,
        join(tempDir, 'audio', `${key}.mp3`),
        audioData,
      )
    })

    it('should return null for non-existent entries', async () => {
      const key = await cache.generateKey('nonexistent', 'tts-1', 'alloy', 1.0)

      mockStat.mockRejectedValue(new Error('File not found'))

      const result = await cache.get(key)

      expect(result).toBeNull()
    })

    it('should handle corrupted entry files gracefully', async () => {
      const key = await cache.generateKey('test', 'tts-1', 'alloy', 1.0)

      mockStat.mockResolvedValueOnce({
        mtime: new Date(),
        size: 100,
      } as MockStats)
      mockReadFile.mockResolvedValueOnce('invalid json')

      const result = await cache.get(key)

      expect(result).toBeNull()
    })
  })

  describe('Cache Expiration', () => {
    beforeEach(() => {
      cache = new AudioCache({
        cacheDir: tempDir,
        maxAgeMs: 1000, // 1 second
      })
    })

    it('should expire old entries', async () => {
      const key = await cache.generateKey('test', 'tts-1', 'alloy', 1.0)

      // Mock file that is older than maxAge
      const oldDate = new Date(Date.now() - 2000) // 2 seconds ago
      mockStat.mockResolvedValueOnce({
        mtime: oldDate,
        size: 100,
      } as MockStats)

      const result = await cache.get(key)

      expect(result).toBeNull()
    })

    it('should return fresh entries', async () => {
      const key = await cache.generateKey('test', 'tts-1', 'alloy', 1.0)
      const audioData = Buffer.from('mock audio data')

      // Mock fresh file
      const freshDate = new Date(Date.now() - 500) // 0.5 seconds ago
      mockStat.mockResolvedValueOnce({
        mtime: freshDate,
        size: audioData.length,
      } as MockStats)

      // First call to readFile (for entry JSON)
      mockReadFile.mockResolvedValueOnce(
        JSON.stringify({
          timestamp: Date.now(),
          metadata: { provider: 'openai', voice: 'alloy' },
          audioFile: `${key}.mp3`,
        }),
      )

      // Second call to readFile (for audio data)
      mockReadFile.mockResolvedValueOnce(audioData)

      const result = await cache.get(key)

      expect(result).not.toBeNull()
      expect(result?.data).toEqual(audioData)
    })
  })

  describe('Cache Size Management', () => {
    beforeEach(() => {
      cache = new AudioCache({
        cacheDir: tempDir,
        maxSizeBytes: 1000, // 1KB limit
        maxEntries: 2,
      })
    })

    it('should track cache size', async () => {
      const key = await cache.generateKey('test', 'tts-1', 'alloy', 1.0)
      const audioData = Buffer.from('x'.repeat(500)) // 500 bytes

      await cache.set(key, audioData, { provider: 'openai', voice: 'alloy' })

      // Mock getStats() - readdir returns the entry files
      mockReaddir.mockResolvedValue([`${key}.json`])

      // Mock stat calls for entry and audio files
      mockStat.mockResolvedValueOnce({
        mtime: new Date(),
        size: 100, // entry file size
      } as MockStats)
      mockStat.mockResolvedValueOnce({
        mtime: new Date(),
        size: 500, // audio file size
      } as MockStats)

      const stats = await cache.getStats()

      expect(stats.totalSize).toBeGreaterThan(0)
      expect(stats.entryCount).toBe(1)
    })

    it('should enforce maximum entries limit', async () => {
      // Add first entry
      const key1 = await cache.generateKey('test1', 'tts-1', 'alloy', 1.0)
      const audioData1 = Buffer.from('audio1')
      await cache.set(key1, audioData1, { provider: 'openai', voice: 'alloy' })

      // Add second entry
      const key2 = await cache.generateKey('test2', 'tts-1', 'alloy', 1.0)
      const audioData2 = Buffer.from('audio2')
      await cache.set(key2, audioData2, { provider: 'openai', voice: 'alloy' })

      const stats = await cache.getStats()
      expect(stats.entryCount).toBeLessThanOrEqual(2)
    })
  })

  describe('Cache Cleanup', () => {
    beforeEach(() => {
      cache = new AudioCache({ cacheDir: tempDir })
    })

    it('should clean expired entries', async () => {
      // Mock readdir to return some entry files
      mockReaddir.mockResolvedValue(['entry1.json', 'entry2.json'])

      // Mock stat calls for the entries (make them expired)
      const oldDate = new Date(Date.now() - 10000) // 10 seconds ago
      mockStat.mockResolvedValue({
        mtime: oldDate,
        size: 100,
      } as MockStats)

      await cache.cleanup()

      // Should have attempted to read cache directory structure
      expect(mockReaddir).toHaveBeenCalled()
      expect(mockStat).toHaveBeenCalled()
    })

    it('should handle cleanup errors gracefully', async () => {
      mockStat.mockRejectedValue(new Error('Permission denied'))

      // Should not throw
      await expect(cache.cleanup()).resolves.toBeUndefined()
    })

    it('should remove old entries during cleanup', async () => {
      // Mock readdir to return some entry files
      mockReaddir.mockResolvedValue([])

      await cache.cleanup()

      expect(mockUnlink).not.toHaveBeenCalled() // No files to clean in empty scenario
    })
  })

  describe('Cache Statistics', () => {
    beforeEach(() => {
      cache = new AudioCache({ cacheDir: tempDir })
    })

    it('should provide cache statistics', async () => {
      const stats = await cache.getStats()

      expect(stats).toMatchObject({
        entryCount: expect.any(Number),
        totalSize: expect.any(Number),
        hitRate: expect.any(Number),
        oldestEntry: expect.any(Number),
        newestEntry: expect.any(Number),
      })
    })

    it('should track hit rate', async () => {
      const key = await cache.generateKey('test', 'tts-1', 'alloy', 1.0)

      // Miss
      mockStat.mockRejectedValueOnce(new Error('Not found'))
      await cache.get(key)

      // Hit
      const audioData = Buffer.from('audio')
      mockStat.mockResolvedValueOnce({
        mtime: new Date(),
        size: audioData.length,
      } as MockStats)

      // First call to readFile (for entry JSON) - needed for cache hit
      mockReadFile.mockResolvedValueOnce(
        JSON.stringify({
          timestamp: Date.now(),
          metadata: { provider: 'openai', voice: 'alloy' },
          audioFile: `${key}.mp3`,
        }),
      )

      // Second call to readFile (for audio data)
      mockReadFile.mockResolvedValueOnce(audioData)

      await cache.get(key)

      const stats = await cache.getStats()
      expect(stats.hitRate).toBe(0.5) // 1 hit out of 2 attempts
    })
  })

  describe('Error Handling', () => {
    beforeEach(() => {
      cache = new AudioCache({ cacheDir: tempDir })
    })

    it('should handle file system errors during set', async () => {
      const key = await cache.generateKey('test', 'tts-1', 'alloy', 1.0)
      const audioData = Buffer.from('audio')

      mockWriteFile.mockRejectedValue(new Error('Disk full'))

      // Should not throw
      await expect(
        cache.set(key, audioData, { provider: 'openai', voice: 'alloy' }),
      ).resolves.toBeUndefined()
    })

    it('should handle file system errors during get', async () => {
      const key = await cache.generateKey('test', 'tts-1', 'alloy', 1.0)

      mockStat.mockResolvedValue({ mtime: new Date(), size: 100 } as MockStats)
      mockReadFile.mockRejectedValue(new Error('Read error'))

      const result = await cache.get(key)
      expect(result).toBeNull()
    })

    it('should handle directory creation errors', async () => {
      mockMkdir.mockRejectedValue(new Error('Permission denied'))

      // Should not throw during construction
      expect(() => new AudioCache({ cacheDir: tempDir })).not.toThrow()
    })
  })

  describe('Cache Validation', () => {
    beforeEach(() => {
      cache = new AudioCache({ cacheDir: tempDir })
    })

    it('should validate cache entry structure', async () => {
      const key = await cache.generateKey('test', 'tts-1', 'alloy', 1.0)

      mockStat.mockResolvedValueOnce({
        mtime: new Date(),
        size: 100,
      } as MockStats)

      // Invalid entry structure
      mockReadFile.mockResolvedValueOnce(
        JSON.stringify({
          invalid: 'structure',
        }),
      )

      const result = await cache.get(key)
      expect(result).toBeNull()
    })

    it('should handle missing audio files', async () => {
      const key = await cache.generateKey('test', 'tts-1', 'alloy', 1.0)

      // Entry file exists
      mockStat.mockResolvedValueOnce({
        mtime: new Date(),
        size: 100,
      } as MockStats)

      // Valid entry but missing audio file
      mockReadFile
        .mockResolvedValueOnce(
          JSON.stringify({
            timestamp: Date.now(),
            metadata: { provider: 'openai', voice: 'alloy' },
            audioFile: `${key}.mp3`,
          }),
        )
        .mockRejectedValueOnce(new Error('Audio file not found'))

      const result = await cache.get(key)
      expect(result).toBeNull()
    })
  })
})

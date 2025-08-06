/**
 * Audio Cache System
 * Provides file-based caching for TTS audio files to improve performance and reduce API costs
 */

import { createHash } from 'node:crypto'
import {
  readFile,
  writeFile,
  unlink,
  stat,
  mkdir,
  readdir,
} from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

/**
 * Cache entry metadata
 */
export interface CacheEntry {
  data: Buffer
  metadata: {
    provider: string
    voice: string
    model?: string
    speed?: number
    format?: string
  }
}

/**
 * Internal cache entry structure
 */
interface CacheEntryFile {
  timestamp: number
  metadata: CacheEntry['metadata']
  audioFile: string
}

/**
 * Audio cache configuration
 */
export interface AudioCacheConfig {
  maxSizeBytes?: number // Maximum cache size in bytes
  maxAgeMs?: number // Maximum age of cache entries in milliseconds
  maxEntries?: number // Maximum number of cache entries
  enabled?: boolean // Enable/disable caching
  cacheDir?: string // Cache directory path
}

/**
 * Cache statistics
 */
export interface CacheStats {
  entryCount: number
  totalSize: number
  hitRate: number
  oldestEntry: number
  newestEntry: number
}

/**
 * Audio Cache implementation with LRU eviction and TTL expiration
 */
export class AudioCache {
  private config: Required<AudioCacheConfig>
  private hitCount = 0
  private requestCount = 0

  constructor(config: AudioCacheConfig = {}) {
    // Set default configuration
    this.config = {
      maxSizeBytes: config.maxSizeBytes ?? 100 * 1024 * 1024, // 100MB
      maxAgeMs: config.maxAgeMs ?? 7 * 24 * 60 * 60 * 1000, // 7 days
      maxEntries: config.maxEntries ?? 1000,
      enabled: config.enabled ?? true,
      cacheDir: config.cacheDir ?? join(tmpdir(), 'claude-hooks-audio-cache'),
    }

    // Initialize cache directories
    this.initializeDirectories()
  }

  /**
   * Generate cache key from TTS parameters
   */
  async generateKey(
    text: string,
    model: string,
    voice: string,
    speed: number,
  ): Promise<string> {
    const input = `${text}|${model}|${voice}|${speed}`
    const hash = createHash('sha256')
    hash.update(input, 'utf8')
    return hash.digest('hex')
  }

  /**
   * Get cached audio data
   */
  async get(key: string): Promise<CacheEntry | null> {
    this.requestCount++

    if (!this.config.enabled) {
      return null
    }

    try {
      const entryPath = join(this.config.cacheDir, 'entries', `${key}.json`)

      // Check if entry file exists and get metadata
      const entryStat = await stat(entryPath)

      // Check if entry is expired
      const age = Date.now() - entryStat.mtime.getTime()
      if (age > this.config.maxAgeMs) {
        // Entry is expired, clean it up
        await this.removeEntry(key)
        return null
      }

      // Read entry metadata
      const entryData = await readFile(entryPath, 'utf8')
      const entry: CacheEntryFile = JSON.parse(entryData)

      // Validate entry structure
      if (!this.validateEntry(entry)) {
        await this.removeEntry(key)
        return null
      }

      // Read audio data
      const audioPath = join(this.config.cacheDir, 'audio', entry.audioFile)
      const audioData = await readFile(audioPath)

      this.hitCount++
      return {
        data: audioData,
        metadata: entry.metadata,
      }
    } catch {
      // File doesn't exist or other error
      return null
    }
  }

  /**
   * Store audio data in cache
   */
  async set(
    key: string,
    data: Buffer,
    metadata: CacheEntry['metadata'],
  ): Promise<void> {
    if (!this.config.enabled) {
      return
    }

    try {
      // Ensure directories exist
      await this.initializeDirectories()

      // Check cache size limits and clean up if necessary
      await this.enforceLimits()

      // Create entry
      const audioFile = `${key}.mp3`
      const entry: CacheEntryFile = {
        timestamp: Date.now(),
        metadata,
        audioFile,
      }

      // Write entry metadata
      const entryPath = join(this.config.cacheDir, 'entries', `${key}.json`)
      await writeFile(entryPath, JSON.stringify(entry), 'utf8')

      // Write audio data
      const audioPath = join(this.config.cacheDir, 'audio', audioFile)
      await writeFile(audioPath, data)
    } catch {
      // Ignore cache write errors to avoid breaking TTS functionality
    }
  }

  /**
   * Clean up expired and excess entries
   */
  async cleanup(): Promise<void> {
    if (!this.config.enabled) {
      return
    }

    try {
      const entriesDir = join(this.config.cacheDir, 'entries')

      // Read all entry files
      const entryFiles = await readdir(entriesDir)
      const now = Date.now()

      for (const entryFile of entryFiles) {
        if (!entryFile.endsWith('.json')) continue

        const entryPath = join(entriesDir, entryFile)

        try {
          const entryStat = await stat(entryPath)
          const age = now - entryStat.mtime.getTime()

          // Remove expired entries
          if (age > this.config.maxAgeMs) {
            const key = entryFile.replace('.json', '')
            await this.removeEntry(key)
          }
        } catch {
          // Remove corrupted entries
          const key = entryFile.replace('.json', '')
          await this.removeEntry(key)
        }
      }

      // Enforce size and count limits
      await this.enforceLimits()
    } catch {
      // Ignore cleanup errors
    }
  }

  /**
   * Get cache statistics
   */
  async getStats(): Promise<CacheStats> {
    if (!this.config.enabled) {
      return {
        entryCount: 0,
        totalSize: 0,
        hitRate: 0,
        oldestEntry: 0,
        newestEntry: 0,
      }
    }

    try {
      const entriesDir = join(this.config.cacheDir, 'entries')
      const audioDir = join(this.config.cacheDir, 'audio')

      const entryFiles = await readdir(entriesDir)
      let totalSize = 0
      let oldestEntry = Date.now()
      let newestEntry = 0

      for (const entryFile of entryFiles) {
        if (!entryFile.endsWith('.json')) continue

        try {
          const entryPath = join(entriesDir, entryFile)
          const entryStat = await stat(entryPath)
          const key = entryFile.replace('.json', '')
          const audioPath = join(audioDir, `${key}.mp3`)
          const audioStat = await stat(audioPath)

          totalSize += entryStat.size + audioStat.size
          const mtime = entryStat.mtime.getTime()
          if (mtime < oldestEntry) oldestEntry = mtime
          if (mtime > newestEntry) newestEntry = mtime
        } catch {
          // Skip corrupted entries
        }
      }

      return {
        entryCount: entryFiles.length,
        totalSize,
        hitRate: this.requestCount > 0 ? this.hitCount / this.requestCount : 0,
        oldestEntry,
        newestEntry,
      }
    } catch {
      return {
        entryCount: 0,
        totalSize: 0,
        hitRate: this.requestCount > 0 ? this.hitCount / this.requestCount : 0,
        oldestEntry: 0,
        newestEntry: 0,
      }
    }
  }

  /**
   * Get cache configuration
   */
  getConfiguration(): AudioCacheConfig {
    return { ...this.config }
  }

  /**
   * Initialize cache directories
   */
  private async initializeDirectories(): Promise<void> {
    try {
      await mkdir(join(this.config.cacheDir, 'entries'), { recursive: true })
      await mkdir(join(this.config.cacheDir, 'audio'), { recursive: true })
    } catch {
      // Ignore directory creation errors
    }
  }

  /**
   * Validate cache entry structure
   */
  private validateEntry(entry: unknown): entry is CacheEntryFile {
    return (
      typeof entry === 'object' &&
      entry !== null &&
      typeof (entry as CacheEntryFile).timestamp === 'number' &&
      typeof (entry as CacheEntryFile).metadata === 'object' &&
      (entry as CacheEntryFile).metadata !== null &&
      typeof (entry as CacheEntryFile).metadata.provider === 'string' &&
      typeof (entry as CacheEntryFile).metadata.voice === 'string' &&
      typeof (entry as CacheEntryFile).audioFile === 'string'
    )
  }

  /**
   * Remove a cache entry
   */
  private async removeEntry(key: string): Promise<void> {
    try {
      const entryPath = join(this.config.cacheDir, 'entries', `${key}.json`)
      const audioPath = join(this.config.cacheDir, 'audio', `${key}.mp3`)

      await Promise.all([
        unlink(entryPath).catch(() => {}),
        unlink(audioPath).catch(() => {}),
      ])
    } catch {
      // Ignore removal errors
    }
  }

  /**
   * Enforce cache size and count limits
   */
  private async enforceLimits(): Promise<void> {
    try {
      const stats = await this.getStats()

      // Check if limits are exceeded
      if (
        stats.entryCount <= this.config.maxEntries &&
        stats.totalSize <= this.config.maxSizeBytes
      ) {
        return
      }

      // Get all entries sorted by modification time (oldest first)
      const entriesDir = join(this.config.cacheDir, 'entries')
      const entryFiles = await readdir(entriesDir)

      const entries: Array<{ key: string; mtime: number; size: number }> = []

      for (const entryFile of entryFiles) {
        if (!entryFile.endsWith('.json')) continue

        try {
          const key = entryFile.replace('.json', '')
          const entryPath = join(entriesDir, entryFile)
          const audioPath = join(this.config.cacheDir, 'audio', `${key}.mp3`)

          const [entryStat, audioStat] = await Promise.all([
            stat(entryPath),
            stat(audioPath),
          ])

          entries.push({
            key,
            mtime: entryStat.mtime.getTime(),
            size: entryStat.size + audioStat.size,
          })
        } catch {
          // Skip corrupted entries
        }
      }

      // Sort by modification time (oldest first) for LRU eviction
      entries.sort((a, b) => a.mtime - b.mtime)

      // Remove entries until we're under limits
      let currentSize = stats.totalSize
      let currentCount = stats.entryCount

      for (const entry of entries) {
        if (
          currentCount <= this.config.maxEntries &&
          currentSize <= this.config.maxSizeBytes
        ) {
          break
        }

        await this.removeEntry(entry.key)
        currentSize -= entry.size
        currentCount--
      }
    } catch {
      // Ignore limit enforcement errors
    }
  }
}

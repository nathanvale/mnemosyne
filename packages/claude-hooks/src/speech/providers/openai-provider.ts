/**
 * OpenAI TTS Provider implementation
 * Uses OpenAI's Text-to-Speech API for high-quality voice synthesis
 */

import { exec } from 'node:child_process'
import { writeFile, unlink, mkdir } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { promisify } from 'node:util'
import OpenAI from 'openai'

import type {
  SpeakResult,
  Voice,
  TTSProviderInfo,
  TTSProviderConfig,
} from './tts-provider.js'

import { AudioCache } from './audio-cache.js'
import { BaseTTSProvider } from './tts-provider.js'

const execAsync = promisify(exec)

/**
 * OpenAI-specific configuration
 */
export interface OpenAIConfig extends TTSProviderConfig {
  apiKey?: string
  model?: 'tts-1' | 'tts-1-hd'
  voice?: 'alloy' | 'echo' | 'fable' | 'onyx' | 'nova' | 'shimmer'
  speed?: number // 0.25 to 4.0
  format?: 'mp3' | 'opus' | 'aac' | 'flac'
}

/**
 * OpenAI TTS Provider
 */
export class OpenAIProvider extends BaseTTSProvider {
  private client: OpenAI | null = null
  private openaiConfig: Required<OpenAIConfig>
  private tempDir: string
  private lastRequestTime = 0
  private readonly minRequestInterval = 1000 // 1 second between requests
  private retryCount = 0
  private readonly maxRetries = 3
  private readonly retryDelay = 1000 // Start with 1 second delay
  private cache: AudioCache

  constructor(config: OpenAIConfig = {}) {
    super(config)

    // Get API key from config or environment
    const apiKey = config.apiKey || process.env['OPENAI_API_KEY'] || ''

    // Set defaults
    this.openaiConfig = {
      apiKey,
      model: config.model || 'tts-1',
      voice: config.voice || 'alloy',
      speed: this.clampSpeed(config.speed || 1.0),
      format: config.format || 'mp3',
    }

    // Initialize OpenAI client if API key is available
    if (this.openaiConfig.apiKey) {
      this.client = new OpenAI({
        apiKey: this.openaiConfig.apiKey,
      })
    }

    // Set up temp directory for audio files
    this.tempDir = join(tmpdir(), 'claude-hooks-tts')

    // Initialize audio cache
    this.cache = new AudioCache()
  }

  async speak(text: string): Promise<SpeakResult> {
    // Validate text
    const cleanText = this.validateText(text)
    if (!cleanText) {
      return this.createErrorResult('Empty text')
    }

    // Check if client is available
    if (!this.client) {
      return this.createErrorResult('OpenAI API key not configured')
    }

    // Apply rate limiting
    await this.applyRateLimit()

    return this.speakWithRetry(cleanText)
  }

  private async speakWithRetry(text: string): Promise<SpeakResult> {
    try {
      // Truncate very long text to API limit (4096 chars)
      const inputText =
        text.length > 4096 ? `${text.substring(0, 4093)}...` : text

      // Generate cache key
      const cacheKey = await this.cache.generateKey(
        inputText,
        this.openaiConfig.model,
        this.openaiConfig.voice,
        this.openaiConfig.speed,
      )

      // Check cache first
      const cachedEntry = await this.cache.get(cacheKey)
      if (cachedEntry) {
        // Use cached audio
        await this.playCachedAudio(cachedEntry.data)

        // Reset retry count on success
        this.retryCount = 0

        return this.createSuccessResult({
          duration: cachedEntry.data.length / 1000, // Rough estimate
        })
      }

      // Call OpenAI API
      const response = await this.client!.audio.speech.create({
        model: this.openaiConfig.model,
        input: inputText,
        voice: this.openaiConfig.voice,
        speed: this.openaiConfig.speed,
        response_format: this.openaiConfig.format,
      })

      // Convert response to buffer
      const buffer = Buffer.from(await response.arrayBuffer())

      // Cache the result
      await this.cache.set(cacheKey, buffer, {
        provider: 'openai',
        voice: this.openaiConfig.voice,
        model: this.openaiConfig.model,
        speed: this.openaiConfig.speed,
        format: this.openaiConfig.format,
      })

      // Play the audio
      await this.playCachedAudio(buffer)

      // Reset retry count on success
      this.retryCount = 0

      return this.createSuccessResult({
        duration: buffer.length / 1000, // Rough estimate
      })
    } catch (error) {
      // Check if we should retry
      if (this.shouldRetry(error)) {
        this.retryCount++
        const delay = this.retryDelay * Math.pow(2, this.retryCount - 1) // Exponential backoff
        await this.sleep(delay)
        return this.speakWithRetry(text)
      }

      // Reset retry count on final failure
      this.retryCount = 0
      return this.handleError(error)
    }
  }

  async isAvailable(): Promise<boolean> {
    return !!this.openaiConfig.apiKey
  }

  getProviderInfo(): TTSProviderInfo {
    return {
      name: 'openai',
      displayName: 'OpenAI TTS',
      version: '1.0.0',
      requiresApiKey: true,
      supportedFeatures: ['speak', 'voices', 'speed', 'formats'],
    }
  }

  async getVoices(): Promise<Voice[]> {
    return [
      {
        id: 'alloy',
        name: 'Alloy',
        language: 'en-US',
        gender: 'neutral',
        description: 'Neutral and balanced',
      },
      {
        id: 'echo',
        name: 'Echo',
        language: 'en-US',
        gender: 'male',
        description: 'Warm and conversational',
      },
      {
        id: 'fable',
        name: 'Fable',
        language: 'en-US',
        gender: 'neutral',
        description: 'Expressive and dynamic',
      },
      {
        id: 'onyx',
        name: 'Onyx',
        language: 'en-US',
        gender: 'male',
        description: 'Deep and authoritative',
      },
      {
        id: 'nova',
        name: 'Nova',
        language: 'en-US',
        gender: 'female',
        description: 'Friendly and upbeat',
      },
      {
        id: 'shimmer',
        name: 'Shimmer',
        language: 'en-US',
        gender: 'female',
        description: 'Soft and pleasant',
      },
    ]
  }

  getConfiguration(): TTSProviderConfig {
    return { ...this.openaiConfig }
  }

  configure(config: TTSProviderConfig): void {
    const openaiConfig = config as OpenAIConfig

    if (openaiConfig.apiKey !== undefined) {
      this.openaiConfig.apiKey = openaiConfig.apiKey
      // Reinitialize client with new API key
      if (this.openaiConfig.apiKey) {
        this.client = new OpenAI({
          apiKey: this.openaiConfig.apiKey,
        })
      } else {
        this.client = null
      }
    }

    if (openaiConfig.model !== undefined) {
      this.openaiConfig.model = openaiConfig.model
    }

    if (openaiConfig.voice !== undefined) {
      this.openaiConfig.voice = openaiConfig.voice
    }

    if (openaiConfig.speed !== undefined) {
      this.openaiConfig.speed = this.clampSpeed(openaiConfig.speed)
    }

    if (openaiConfig.format !== undefined) {
      this.openaiConfig.format = openaiConfig.format
    }
  }

  /**
   * Clamp speed to valid range (0.25 to 4.0)
   */
  private clampSpeed(speed: number): number {
    return Math.max(0.25, Math.min(4.0, speed))
  }

  /**
   * Apply rate limiting to prevent API overuse
   */
  private async applyRateLimit(): Promise<void> {
    const now = Date.now()
    const timeSinceLastRequest = now - this.lastRequestTime

    if (timeSinceLastRequest < this.minRequestInterval) {
      const waitTime = this.minRequestInterval - timeSinceLastRequest
      await this.sleep(waitTime)
    }

    this.lastRequestTime = Date.now()
  }

  /**
   * Check if error is retryable
   */
  private shouldRetry(error: unknown): boolean {
    if (this.retryCount >= this.maxRetries) {
      return false
    }

    if (error && typeof error === 'object') {
      const err = error as { status?: number; message?: string }

      // Retry on rate limit or server errors
      if (err.status === 429 || err.status === 500 || err.status === 503) {
        return true
      }

      // Retry on network errors
      if (
        err.message?.includes('ETIMEDOUT') ||
        err.message?.includes('ECONNREFUSED') ||
        err.message?.includes('ENOTFOUND')
      ) {
        return true
      }
    }

    return false
  }

  /**
   * Sleep for specified milliseconds
   */
  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms))
  }

  /**
   * Play cached audio data directly
   */
  private async playCachedAudio(audioData: Buffer): Promise<void> {
    try {
      // Ensure temp directory exists
      await mkdir(this.tempDir, { recursive: true })

      // Write audio data to temp file for playback
      const filename = `openai-cached-${Date.now()}.${this.openaiConfig.format}`
      const filepath = join(this.tempDir, filename)
      await writeFile(filepath, audioData)

      // Play the audio file
      await this.playAudio(filepath)

      // Clean up temp file
      await this.cleanupFile(filepath)
    } catch {
      // Playback failed, but TTS generation succeeded
      // Don't fail the whole operation
    }
  }

  /**
   * Play audio file using system command
   */
  private async playAudio(filepath: string): Promise<void> {
    try {
      const platform = process.platform

      let command: string
      if (platform === 'darwin') {
        // macOS
        command = `afplay "${filepath}"`
      } else if (platform === 'win32') {
        // Windows
        command = `powershell -c "(New-Object Media.SoundPlayer '${filepath}').PlaySync()"`
      } else {
        // Linux
        command = `aplay "${filepath}" || paplay "${filepath}" || ffplay -nodisp -autoexit "${filepath}"`
      }

      await execAsync(command)
    } catch {
      // Playback failed, but TTS generation succeeded
      // Don't fail the whole operation
    }
  }

  /**
   * Clean up temporary audio file
   */
  private async cleanupFile(filepath: string): Promise<void> {
    try {
      await unlink(filepath)
    } catch {
      // Ignore cleanup errors
    }
  }

  /**
   * Handle API errors
   */
  private handleError(error: unknown): SpeakResult {
    let errorMessage = 'OpenAI TTS failed'

    if (error && typeof error === 'object') {
      const err = error as { status?: number; message?: string }

      if (err.status === 401) {
        errorMessage = 'Invalid API key'
      } else if (err.status === 429) {
        errorMessage = 'Rate limit exceeded'
      } else if (err.status === 500 || err.status === 503) {
        errorMessage = 'Server error - try again later'
      } else if (
        err.message?.includes('ETIMEDOUT') ||
        err.message?.includes('ECONNREFUSED')
      ) {
        errorMessage = 'Network error - check connection'
      } else if (err.message) {
        errorMessage = err.message
      }
    }

    return this.createErrorResult(errorMessage)
  }
}

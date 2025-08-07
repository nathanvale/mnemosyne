/**
 * OpenAI TTS Provider implementation
 * Uses OpenAI's Text-to-Speech API for high-quality voice synthesis
 */

import { exec, spawn } from 'node:child_process'
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
} from './tts-provider'

import { AudioCache } from './audio-cache'
import { BaseTTSProvider } from './tts-provider'

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

  async speak(
    text: string,
    options?: { detached?: boolean },
  ): Promise<SpeakResult> {
    const detached = options?.detached ?? false
    console.error(
      '[OpenAI TTS] speak() called with text:',
      `${text.substring(0, 50)}...`,
    )

    // Validate text
    const cleanText = this.validateText(text)
    if (!cleanText) {
      console.error('[OpenAI TTS] Empty text, returning error')
      return this.createErrorResult('Empty text')
    }

    // Check if client is available
    if (!this.client) {
      console.error(
        '[OpenAI TTS] No OpenAI client (API key missing), returning error',
      )
      return this.createErrorResult('OpenAI API key not configured')
    }

    console.error(
      '[OpenAI TTS] Client available, proceeding with TTS generation',
    )
    // Apply rate limiting
    await this.applyRateLimit()

    return this.speakWithRetry(cleanText, detached)
  }

  private async speakWithRetry(
    text: string,
    detached = false,
  ): Promise<SpeakResult> {
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

      console.error(
        `[OpenAI TTS] Cache key for "${inputText.substring(0, 30)}...": ${cacheKey.substring(0, 16)}...`,
      )

      // Check cache first
      const cachedEntry = await this.cache.get(cacheKey)
      if (cachedEntry) {
        console.error(
          `[OpenAI TTS] Cache HIT! Using cached audio (${cachedEntry.data.length} bytes)`,
        )
        // Use cached audio
        await this.playCachedAudio(cachedEntry.data, detached)

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

      console.error(
        `[OpenAI TTS] Caching new audio (${buffer.length} bytes) for: "${inputText.substring(0, 30)}..."`,
      )

      // Cache the result
      await this.cache.set(cacheKey, buffer, {
        provider: 'openai',
        voice: this.openaiConfig.voice,
        model: this.openaiConfig.model,
        speed: this.openaiConfig.speed,
        format: this.openaiConfig.format,
      })

      // Play the audio
      await this.playCachedAudio(buffer, detached)

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
        return this.speakWithRetry(text, detached)
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
  private async playCachedAudio(
    audioData: Buffer,
    detached = false,
  ): Promise<void> {
    try {
      // Ensure temp directory exists
      await mkdir(this.tempDir, { recursive: true })

      // Write audio data to temp file for playback
      const filename = `openai-cached-${Date.now()}.${this.openaiConfig.format}`
      const filepath = join(this.tempDir, filename)
      await writeFile(filepath, audioData)

      console.error(
        `[OpenAI TTS] Playing cached audio from: ${filepath}, size: ${audioData.length} bytes`,
      )

      // Play the audio file
      await this.playAudio(filepath, detached)

      // Don't clean up immediately if detached (let audio finish)
      if (!detached) {
        await this.cleanupFile(filepath)
      }
    } catch (error) {
      // Log the error for debugging
      console.error('[OpenAI TTS] Error playing cached audio:', error)
      // Playback failed, but TTS generation succeeded
      // Don't fail the whole operation
    }
  }

  /**
   * Play audio file using system command
   */
  private async playAudio(filepath: string, detached = false): Promise<void> {
    try {
      const platform = process.platform

      if (detached) {
        // Use spawn for detached process that continues after parent exits
        let args: string[] = []
        let cmd: string

        if (platform === 'darwin') {
          cmd = 'afplay'
          args = [filepath]
        } else if (platform === 'win32') {
          // Windows - properly escape the filepath for PowerShell
          // Escape special characters that could break PowerShell syntax
          const escapedPath = filepath
            .replace(/\\/g, '\\\\') // Escape backslashes
            .replace(/'/g, "''") // Escape single quotes for PowerShell
            .replace(/`/g, '``') // Escape backticks
            .replace(/\$/g, '`$') // Escape dollar signs

          cmd = 'powershell'
          args = [
            '-NoProfile',
            '-Command',
            `(New-Object Media.SoundPlayer '${escapedPath}').PlaySync()`,
          ]
        } else {
          // Linux - try multiple players with error reporting
          cmd = 'sh'
          args = [
            '-c',
            `
            if command -v aplay >/dev/null 2>&1; then
              aplay "${filepath}" 2>&1 || echo "[OpenAI TTS] aplay failed with exit code $?" >&2
            elif command -v paplay >/dev/null 2>&1; then
              paplay "${filepath}" 2>&1 || echo "[OpenAI TTS] paplay failed with exit code $?" >&2
            elif command -v ffplay >/dev/null 2>&1; then
              ffplay -nodisp -autoexit "${filepath}" 2>&1 || echo "[OpenAI TTS] ffplay failed with exit code $?" >&2
            else
              echo "[OpenAI TTS] No audio player found (tried aplay, paplay, ffplay)" >&2
              exit 1
            fi
            `.trim(),
          ]
        }

        console.error(
          `[OpenAI TTS] Playing audio (detached) with ${cmd}: ${filepath}`,
        )

        const child = spawn(cmd, args, {
          detached: true,
          stdio: 'ignore',
        })

        // Unref allows parent to exit independently
        child.unref()
      } else {
        // Use exec for normal playback (waits for completion)
        let command: string
        if (platform === 'darwin') {
          // macOS
          command = `afplay "${filepath}"`
          console.error(`[OpenAI TTS] Playing audio with afplay: ${filepath}`)
        } else if (platform === 'win32') {
          // Windows - properly escape the filepath for PowerShell
          const escapedPath = filepath
            .replace(/\\/g, '\\\\') // Escape backslashes
            .replace(/'/g, "''") // Escape single quotes
            .replace(/`/g, '``') // Escape backticks
            .replace(/\$/g, '`$') // Escape dollar signs

          command = `powershell -NoProfile -Command "(New-Object Media.SoundPlayer '${escapedPath}').PlaySync()"`
          console.error(
            `[OpenAI TTS] Playing audio with PowerShell: ${filepath}`,
          )
        } else {
          // Linux - try multiple players with proper error reporting
          command = `
            if command -v aplay >/dev/null 2>&1; then
              aplay "${filepath}" 2>&1 || { echo "[OpenAI TTS] aplay failed with exit code $?" >&2; exit 1; }
            elif command -v paplay >/dev/null 2>&1; then
              paplay "${filepath}" 2>&1 || { echo "[OpenAI TTS] paplay failed with exit code $?" >&2; exit 1; }
            elif command -v ffplay >/dev/null 2>&1; then
              ffplay -nodisp -autoexit "${filepath}" 2>&1 || { echo "[OpenAI TTS] ffplay failed with exit code $?" >&2; exit 1; }
            else
              echo "[OpenAI TTS] No audio player found (tried aplay, paplay, ffplay)" >&2
              exit 1
            fi
          `.trim()
          console.error(`[OpenAI TTS] Playing audio on Linux: ${filepath}`)
        }

        await execAsync(command)
      }
    } catch (error) {
      console.error('[OpenAI TTS] Error in playAudio:', error)
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

/**
 * macOS TTS Provider implementation
 * Uses the built-in macOS 'say' command for text-to-speech
 */

import { exec } from 'node:child_process'
import { promisify } from 'node:util'

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
 * macOS-specific configuration
 */
export interface MacOSConfig extends TTSProviderConfig {
  voice?: string // Voice name (e.g., 'Alex', 'Samantha', 'Daniel')
  rate?: number // Speech rate (50-500 words per minute)
}

/**
 * macOS TTS Provider
 */
export class MacOSProvider extends BaseTTSProvider {
  private macosConfig: Required<MacOSConfig>
  private cache: AudioCache

  constructor(config: MacOSConfig = {}) {
    super(config)

    // Set defaults
    this.macosConfig = {
      voice: config.voice || 'Samantha',
      rate: this.clampRate(config.rate || 200),
    }

    // Initialize audio cache
    this.cache = new AudioCache()
  }

  async speak(text: string): Promise<SpeakResult> {
    const startTime = Date.now()

    // Validate text
    const cleanText = this.validateText(text)
    if (!cleanText) {
      return this.createErrorResult('Empty text')
    }

    // Check if platform is supported
    if (!(await this.isAvailable())) {
      return this.createErrorResult('macOS TTS not available on this platform')
    }

    try {
      // Escape quotes in text
      const escapedText = cleanText.replace(/"/g, '\\"')

      // Build say command
      const command = `say -v ${this.macosConfig.voice} -r ${this.macosConfig.rate} "${escapedText}"`

      // Execute say command
      await execAsync(command)

      const duration = Date.now() - startTime

      return this.createSuccessResult({
        duration,
      })
    } catch (error) {
      return this.handleError(error)
    }
  }

  async isAvailable(): Promise<boolean> {
    return process.platform === 'darwin'
  }

  getProviderInfo(): TTSProviderInfo {
    return {
      name: 'macos',
      displayName: 'macOS Say',
      version: '1.0.0',
      requiresApiKey: false,
      supportedFeatures: ['speak', 'voices', 'rate'],
    }
  }

  async getVoices(): Promise<Voice[]> {
    // Common macOS voices - these should be available on most macOS systems
    return [
      {
        id: 'Alex',
        name: 'Alex',
        language: 'en-US',
        gender: 'male',
        description: 'American English male voice',
      },
      {
        id: 'Samantha',
        name: 'Samantha',
        language: 'en-US',
        gender: 'female',
        description: 'American English female voice',
      },
      {
        id: 'Daniel',
        name: 'Daniel',
        language: 'en-GB',
        gender: 'male',
        description: 'British English male voice',
      },
      {
        id: 'Karen',
        name: 'Karen',
        language: 'en-AU',
        gender: 'female',
        description: 'Australian English female voice',
      },
      {
        id: 'Moira',
        name: 'Moira',
        language: 'en-IE',
        gender: 'female',
        description: 'Irish English female voice',
      },
      {
        id: 'Tessa',
        name: 'Tessa',
        language: 'en-ZA',
        gender: 'female',
        description: 'South African English female voice',
      },
      {
        id: 'Victoria',
        name: 'Victoria',
        language: 'en-US',
        gender: 'female',
        description: 'American English female voice',
      },
      {
        id: 'Fiona',
        name: 'Fiona',
        language: 'en-GB',
        gender: 'female',
        description: 'Scottish English female voice',
      },
    ]
  }

  getConfiguration(): TTSProviderConfig {
    return { ...this.macosConfig }
  }

  configure(config: TTSProviderConfig): void {
    const macosConfig = config as MacOSConfig

    if (macosConfig.voice !== undefined) {
      this.macosConfig.voice = macosConfig.voice
    }

    if (macosConfig.rate !== undefined) {
      this.macosConfig.rate = this.clampRate(macosConfig.rate)
    }
  }

  /**
   * Clamp speech rate to valid range (50-500 words per minute)
   */
  private clampRate(rate: number): number {
    return Math.max(50, Math.min(500, rate))
  }

  /**
   * Handle system command errors
   */
  private handleError(error: unknown): SpeakResult {
    let errorMessage = 'macOS TTS failed'

    if (error && typeof error === 'object') {
      const err = error as { message?: string; code?: string }

      if (err.message?.includes('Command not found')) {
        errorMessage = 'Command not found'
      } else if (err.message?.includes('Voice')) {
        errorMessage = 'Voice not available'
      } else if (err.message) {
        errorMessage = err.message
      }
    }

    return this.createErrorResult(errorMessage)
  }
}

/**
 * Factory for creating TTS providers
 * Manages provider registration and instantiation
 */

import type {
  TTSProvider,
  TTSProviderConfig,
  SpeakResult,
} from './tts-provider.js'

/**
 * Provider constructor type
 */
type ProviderConstructor = new (config: TTSProviderConfig) => TTSProvider

/**
 * Factory configuration
 */
export interface FactoryConfig {
  provider: 'openai' | 'macos' | 'auto'
  fallbackProvider?: 'macos' | 'none'
  openai?: TTSProviderConfig
  macos?: TTSProviderConfig
  [key: string]: unknown
}

/**
 * Provider with fallback wrapper
 */
class FallbackProvider implements TTSProvider {
  constructor(
    private primaryProvider: TTSProvider,
    private fallbackProvider: TTSProvider | null,
  ) {}

  async speak(text: string): Promise<SpeakResult> {
    try {
      const result = await this.primaryProvider.speak(text)
      if (result.success) {
        return result
      }
    } catch {
      // Primary failed, try fallback
      if (this.fallbackProvider) {
        try {
          return await this.fallbackProvider.speak(text)
        } catch {
          // Fallback also failed
        }
      }
    }

    // Both failed or no fallback
    return {
      success: false,
      provider: this.primaryProvider.getProviderInfo().name,
      error: 'All providers failed',
    }
  }

  async isAvailable(): Promise<boolean> {
    const primaryAvailable = await this.primaryProvider.isAvailable()
    if (primaryAvailable) return true

    if (this.fallbackProvider) {
      return await this.fallbackProvider.isAvailable()
    }

    return false
  }

  getProviderInfo() {
    return this.primaryProvider.getProviderInfo()
  }

  configure(config: TTSProviderConfig): void {
    this.primaryProvider.configure(config)
  }

  getConfiguration(): TTSProviderConfig {
    return this.primaryProvider.getConfiguration()
  }

  // Optional methods - delegate to primary
  async getVoices?() {
    if (this.primaryProvider.getVoices) {
      return await this.primaryProvider.getVoices()
    }
    return []
  }

  async preloadAudio?(text: string) {
    if (this.primaryProvider.preloadAudio) {
      await this.primaryProvider.preloadAudio(text)
    }
  }

  cancelSpeech?() {
    if (this.primaryProvider.cancelSpeech) {
      this.primaryProvider.cancelSpeech()
    }
  }
}

/**
 * Factory for creating TTS providers
 */
export class TTSProviderFactory {
  private static providers = new Map<string, ProviderConstructor>()

  /**
   * Register a provider
   */
  static registerProvider(
    name: string,
    constructor: ProviderConstructor,
  ): void {
    if (this.providers.has(name)) {
      throw new Error(`Provider ${name} is already registered`)
    }
    this.providers.set(name, constructor)
  }

  /**
   * Clear all registered providers (mainly for testing)
   */
  static clearProviders(): void {
    this.providers.clear()
  }

  /**
   * Get list of available providers
   */
  static getAvailableProviders(): string[] {
    return Array.from(this.providers.keys())
  }

  /**
   * Create a provider instance
   */
  static create(config: FactoryConfig): TTSProvider {
    const providerName = config.provider
    if (providerName === 'auto') {
      throw new Error('Use detectBestProvider for auto mode')
    }

    const ProviderClass = this.providers.get(providerName)
    if (!ProviderClass) {
      throw new Error(`Unknown provider: ${providerName}`)
    }

    // Get provider-specific config
    const providerConfig = config[providerName] || {}
    return new ProviderClass(providerConfig as TTSProviderConfig)
  }

  /**
   * Create provider with fallback
   */
  static async createWithFallback(config: FactoryConfig): Promise<TTSProvider> {
    // Handle 'auto' provider by detecting best available
    if (config.provider === 'auto') {
      try {
        return await this.detectBestProvider(config)
      } catch {
        // If auto detection fails, fall back to manual creation with fallback
        const fallbackProvider = config.fallbackProvider || 'macos'
        if (fallbackProvider === 'none') {
          throw new Error('No TTS provider available and fallback disabled')
        }
        const fallbackConfig: FactoryConfig = {
          ...config,
          provider: fallbackProvider,
        }
        return this.create(fallbackConfig)
      }
    }

    const primary = this.create(config)

    let fallback: TTSProvider | null = null
    if (config.fallbackProvider && config.fallbackProvider !== 'none') {
      const fallbackConfig: FactoryConfig = {
        ...config,
        provider: config.fallbackProvider,
      }
      fallback = this.create(fallbackConfig)
    }

    return new FallbackProvider(primary, fallback)
  }

  /**
   * Detect best available provider
   */
  static async detectBestProvider(config: FactoryConfig): Promise<TTSProvider> {
    // Priority order: OpenAI (if API key), macOS (if available)

    // Try OpenAI first if API key is available
    if (config.openai?.apiKey) {
      const openaiProvider = this.providers.get('openai')
      if (openaiProvider) {
        const provider = new openaiProvider(config.openai)
        if (await provider.isAvailable()) {
          return provider
        }
      }
    }

    // Try macOS as fallback
    const macosProvider = this.providers.get('macos')
    if (macosProvider) {
      const provider = new macosProvider(config.macos || {})
      if (await provider.isAvailable()) {
        return provider
      }
    }

    // No provider available
    throw new Error('No TTS provider available')
  }
}

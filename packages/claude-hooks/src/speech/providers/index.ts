/**
 * TTS Providers
 * Exports all TTS providers and registers them with the factory
 */

// Export all providers
export { TTSProviderFactory } from './provider-factory'
export type { FactoryConfig } from './provider-factory'
export { OpenAIProvider } from './openai-provider'
export type { OpenAIConfig } from './openai-provider'
export { MacOSProvider } from './macos-provider'
export type { MacOSConfig } from './macos-provider'
export { ElevenLabsProvider } from './elevenlabs-provider'
export type { ElevenLabsConfig } from './elevenlabs-provider'

// Export audio cache
export { AudioCache } from './audio-cache'
export type { AudioCacheConfig, CacheEntry, CacheStats } from './audio-cache'

// Export base types
export type {
  TTSProvider,
  TTSProviderConfig,
  TTSProviderInfo,
  SpeakResult,
  Voice,
} from './tts-provider'

import { ElevenLabsProvider } from './elevenlabs-provider'
import { MacOSProvider } from './macos-provider'
import { OpenAIProvider } from './openai-provider'
import { TTSProviderFactory } from './provider-factory'

// Ensure providers are registered when the factory is first used
let providersRegistered = false

/**
 * Initialize the provider factory with default providers
 */
export function initializeProviders(): void {
  if (providersRegistered) return

  // Check if TTSProviderFactory and registerProvider method exist
  if (typeof TTSProviderFactory?.registerProvider !== 'function') {
    console.error('TTSProviderFactory.registerProvider is not a function:', {
      TTSProviderFactory,
      registerProvider: TTSProviderFactory?.registerProvider,
      type: typeof TTSProviderFactory?.registerProvider,
    })
    return
  }

  TTSProviderFactory.registerProvider('openai', OpenAIProvider)
  TTSProviderFactory.registerProvider('macos', MacOSProvider)
  TTSProviderFactory.registerProvider('elevenlabs', ElevenLabsProvider)
  providersRegistered = true
}

// Auto-initialize on module load
initializeProviders()

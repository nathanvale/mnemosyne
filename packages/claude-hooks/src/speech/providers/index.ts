/**
 * TTS Providers
 * Exports all TTS providers and registers them with the factory
 */

// Export all providers
export { TTSProviderFactory } from './provider-factory.js'
export type { FactoryConfig } from './provider-factory.js'
export { OpenAIProvider } from './openai-provider.js'
export type { OpenAIConfig } from './openai-provider.js'
export { MacOSProvider } from './macos-provider.js'
export type { MacOSConfig } from './macos-provider.js'

// Export audio cache
export { AudioCache } from './audio-cache.js'
export type { AudioCacheConfig, CacheEntry, CacheStats } from './audio-cache.js'

// Export base types
export type {
  TTSProvider,
  TTSProviderConfig,
  TTSProviderInfo,
  SpeakResult,
  Voice,
} from './tts-provider.js'

import { MacOSProvider } from './macos-provider.js'
import { OpenAIProvider } from './openai-provider.js'
// Register providers with factory
import { TTSProviderFactory } from './provider-factory.js'

// Register providers on module load
TTSProviderFactory.registerProvider('openai', OpenAIProvider)
TTSProviderFactory.registerProvider('macos', MacOSProvider)

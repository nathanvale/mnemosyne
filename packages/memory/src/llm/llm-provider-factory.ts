/**
 * LLM Provider Factory - Runtime provider selection and creation
 *
 * This factory pattern allows registration and creation of LLM providers
 * based on configuration, enabling runtime switching between providers.
 */

import type { LLMProvider, ProviderConfig } from './llm-provider.interface'

/**
 * Factory function type for creating provider instances
 */
export type ProviderFactory = (config: ProviderConfig) => LLMProvider

/**
 * Static factory class for managing LLM provider registration and creation
 *
 * Usage:
 * ```typescript
 * // Register a provider
 * LLMProviderFactory.register('claude', (config) => new ClaudeProvider(config))
 *
 * // Create a provider instance
 * const provider = LLMProviderFactory.create({ provider: 'claude', apiKey: '...' })
 * ```
 */
export class LLMProviderFactory {
  /**
   * Registry of provider factories
   */
  private static providers = new Map<string, ProviderFactory>()

  /**
   * Register a provider factory
   *
   * @param name - Unique name for the provider
   * @param factory - Factory function that creates provider instances
   */
  static register(name: string, factory: ProviderFactory): void {
    this.providers.set(name, factory)
  }

  /**
   * Create a provider instance from configuration
   *
   * @param config - Provider configuration including provider name
   * @returns Configured provider instance
   * @throws Error if provider is not registered
   */
  static create(config: ProviderConfig): LLMProvider {
    const factory = this.providers.get(config.provider)

    if (!factory) {
      throw new Error(`Unknown provider: ${config.provider}`)
    }

    const provider = factory(config)

    if (!provider) {
      throw new Error(
        `Provider factory for ${config.provider} returned invalid provider`,
      )
    }

    return provider
  }

  /**
   * Get list of available provider names
   *
   * @returns Array of registered provider names
   */
  static getAvailableProviders(): string[] {
    return Array.from(this.providers.keys())
  }

  /**
   * Check if a provider is registered
   *
   * @param name - Provider name to check
   * @returns True if provider is registered
   */
  static hasProvider(name: string): boolean {
    return this.providers.has(name)
  }

  /**
   * Clear all registered providers (mainly for testing)
   *
   * @internal
   */
  static clearRegistry(): void {
    this.providers.clear()
  }
}

/**
 * Capability Registry - Provider feature discovery and comparison
 *
 * This registry maintains a catalog of provider capabilities,
 * enabling feature comparison and provider selection based on requirements.
 */

import type { ProviderCapabilities } from './types.js'

/**
 * Registry for provider capabilities
 */
export class CapabilityRegistry {
  /**
   * Registry of provider capabilities
   */
  private static capabilities = new Map<string, ProviderCapabilities>()

  /**
   * Register capabilities for a provider
   *
   * @param providerName - Name of the provider
   * @param capabilities - Provider's capabilities
   */
  static register(
    providerName: string,
    capabilities: ProviderCapabilities,
  ): void {
    this.capabilities.set(providerName, capabilities)
  }

  /**
   * Get capabilities for a specific provider
   *
   * @param providerName - Name of the provider
   * @returns Provider capabilities or undefined if not registered
   */
  static get(providerName: string): ProviderCapabilities | undefined {
    return this.capabilities.get(providerName)
  }

  /**
   * Find providers that support specific features
   *
   * @param requirements - Required capabilities
   * @returns Array of provider names that meet requirements
   */
  static findProviders(requirements: Partial<ProviderCapabilities>): string[] {
    const matching: string[] = []

    for (const [name, capabilities] of this.capabilities.entries()) {
      if (this.meetsRequirements(capabilities, requirements)) {
        matching.push(name)
      }
    }

    return matching
  }

  /**
   * Check if capabilities meet requirements
   *
   * @param capabilities - Provider capabilities
   * @param requirements - Required capabilities
   * @returns True if all requirements are met
   */
  private static meetsRequirements(
    capabilities: ProviderCapabilities,
    requirements: Partial<ProviderCapabilities>,
  ): boolean {
    for (const [key, requiredValue] of Object.entries(requirements)) {
      const capabilityValue = capabilities[key as keyof ProviderCapabilities]

      if (key === 'supportedModels' && Array.isArray(requiredValue)) {
        // For model arrays, check if any required model is supported
        const supportedModels = capabilities.supportedModels
        if (!requiredValue.some((model) => supportedModels.includes(model))) {
          return false
        }
      } else if (key === 'maxInputTokens' || key === 'maxOutputTokens') {
        // For token limits, capability must be >= requirement
        if (
          typeof requiredValue === 'number' &&
          typeof capabilityValue === 'number'
        ) {
          if (capabilityValue < requiredValue) {
            return false
          }
        }
      } else {
        // For boolean flags and other properties, must match exactly
        if (capabilityValue !== requiredValue) {
          return false
        }
      }
    }

    return true
  }

  /**
   * Compare two providers' capabilities
   *
   * @param provider1 - First provider name
   * @param provider2 - Second provider name
   * @returns Comparison object or null if either provider not found
   */
  static compare(
    provider1: string,
    provider2: string,
  ): Record<string, { provider1: unknown; provider2: unknown }> | null {
    const cap1 = this.capabilities.get(provider1)
    const cap2 = this.capabilities.get(provider2)

    if (!cap1 || !cap2) {
      return null
    }

    const comparison: Record<
      string,
      { provider1: unknown; provider2: unknown }
    > = {}

    // Compare all capability fields
    const allKeys = new Set([
      ...Object.keys(cap1),
      ...Object.keys(cap2),
    ]) as Set<keyof ProviderCapabilities>

    for (const key of allKeys) {
      comparison[key] = {
        provider1: cap1[key],
        provider2: cap2[key],
      }
    }

    return comparison
  }

  /**
   * Clear the registry (mainly for testing)
   *
   * @internal
   */
  static clear(): void {
    this.capabilities.clear()
  }

  /**
   * Get all registered provider names
   *
   * @returns Array of provider names
   */
  static getProviders(): string[] {
    return Array.from(this.capabilities.keys())
  }
}

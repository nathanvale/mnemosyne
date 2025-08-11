/**
 * LLM Configuration Loader
 *
 * Loads and validates configuration for LLM providers from environment variables.
 * Provides defaults and comprehensive validation with clear error messages.
 */

import type { LLMProviderConfig, IndividualProviderConfig } from './types.js'

/**
 * Configuration validation result
 */
export interface ConfigValidationResult {
  valid: boolean
  errors: string[]
}

/**
 * Loads and validates LLM provider configuration
 */
export class LLMConfigLoader {
  /**
   * Load configuration from environment variables
   */
  static loadConfig(): LLMProviderConfig {
    const primaryProvider = this.normalizeProviderName(
      process.env.MEMORY_LLM_PRIMARY || '',
    )

    const fallbackProvider = this.normalizeFallbackProvider(
      process.env.MEMORY_LLM_FALLBACK,
    )

    const config: LLMProviderConfig = {
      primaryProvider,
      fallbackProvider,
      dailyBudgetUSD: this.parseFloat(
        process.env.MEMORY_LLM_DAILY_BUDGET_USD,
        0,
      ),
      maxRetries: this.parseInt(process.env.MEMORY_LLM_MAX_RETRIES, 3),
      circuitBreakerThreshold: this.parseFloat(
        process.env.MEMORY_LLM_CIRCUIT_THRESHOLD,
        0.5,
      ),
      circuitBreakerProbes: this.parseInt(
        process.env.MEMORY_LLM_CIRCUIT_PROBES,
        1,
      ),
      providers: {},
    }

    // Load Claude provider config if needed
    if (this.shouldLoadProvider('claude', primaryProvider, fallbackProvider)) {
      const claudeConfig = this.loadProviderConfig('claude')
      if (claudeConfig) {
        config.providers.claude = claudeConfig
      }
    }

    // Load OpenAI provider config if needed
    if (this.shouldLoadProvider('openai', primaryProvider, fallbackProvider)) {
      const openaiConfig = this.loadProviderConfig('openai')
      if (openaiConfig) {
        config.providers.openai = openaiConfig
      }
    }

    return config
  }

  /**
   * Validate a configuration object
   */
  static validateConfig(config: LLMProviderConfig): ConfigValidationResult {
    const errors: string[] = []
    const checkedProviders = new Set<string>()

    // Validate primary provider
    if (!config.primaryProvider) {
      errors.push('Primary provider is required')
    } else if (!config.providers[config.primaryProvider]) {
      errors.push(
        `Primary provider "${config.primaryProvider}" is not configured`,
      )
    } else if (!config.providers[config.primaryProvider]?.apiKey) {
      errors.push(`Provider "${config.primaryProvider}" is missing API key`)
      checkedProviders.add(config.primaryProvider)
    }

    // Validate fallback provider if specified
    if (config.fallbackProvider) {
      if (!config.providers[config.fallbackProvider]) {
        errors.push(
          `Fallback provider "${config.fallbackProvider}" is not configured`,
        )
      } else if (
        !config.providers[config.fallbackProvider]?.apiKey &&
        !checkedProviders.has(config.fallbackProvider)
      ) {
        errors.push(`Provider "${config.fallbackProvider}" is missing API key`)
        checkedProviders.add(config.fallbackProvider)
      }
    }

    // Validate configured providers (skip already checked ones)
    for (const [name, provider] of Object.entries(config.providers)) {
      if (!provider.apiKey && !checkedProviders.has(name)) {
        errors.push(`Provider "${name}" is missing API key`)
      }
    }

    // Validate numeric ranges
    if (config.dailyBudgetUSD < 0) {
      errors.push('Daily budget must be non-negative')
    }

    if (config.maxRetries < 1) {
      errors.push('Max retries must be at least 1')
    }

    if (
      config.circuitBreakerThreshold < 0 ||
      config.circuitBreakerThreshold > 1
    ) {
      errors.push('Circuit breaker threshold must be between 0 and 1')
    }

    if (config.circuitBreakerProbes < 1) {
      errors.push('Circuit breaker probes must be at least 1')
    }

    return {
      valid: errors.length === 0,
      errors,
    }
  }

  /**
   * Get configuration for a specific provider
   */
  static getProviderConfig(
    config: LLMProviderConfig,
    providerName: string,
  ): IndividualProviderConfig | undefined {
    const normalizedName = this.normalizeProviderName(providerName)
    return config.providers[normalizedName]
  }

  /**
   * Load configuration for a specific provider
   */
  private static loadProviderConfig(
    providerName: string,
  ): IndividualProviderConfig | undefined {
    const upperName = providerName.toUpperCase()
    const apiKey = process.env[`MEMORY_LLM_API_KEY_${upperName}`]

    if (!apiKey) {
      return undefined
    }

    const config: IndividualProviderConfig = {
      name: providerName,
      apiKey,
    }

    // Load optional provider-specific settings
    const model = process.env[`MEMORY_LLM_MODEL_${upperName}`]
    if (model) {
      config.model = model
    }

    const baseURL = process.env[`MEMORY_LLM_BASE_URL_${upperName}`]
    if (baseURL) {
      config.baseURL = baseURL
    }

    const orgId = process.env[`MEMORY_LLM_ORG_ID_${upperName}`]
    if (orgId) {
      config.organizationId = orgId
    }

    return config
  }

  /**
   * Check if a provider should be loaded
   */
  private static shouldLoadProvider(
    providerName: string,
    primaryProvider: string,
    fallbackProvider?: string,
  ): boolean {
    return providerName === primaryProvider || providerName === fallbackProvider
  }

  /**
   * Normalize provider name to lowercase
   */
  private static normalizeProviderName(name: string): string {
    return name.trim().toLowerCase()
  }

  /**
   * Normalize fallback provider value
   */
  private static normalizeFallbackProvider(
    value: string | undefined,
  ): string | undefined {
    if (!value) {
      return undefined
    }
    const normalized = value.trim().toLowerCase()
    if (!normalized || normalized === 'none') {
      return undefined
    }
    return normalized
  }

  /**
   * Parse integer with default value
   */
  private static parseInt(
    value: string | undefined,
    defaultValue: number,
  ): number {
    if (!value) {
      return defaultValue
    }
    const parsed = parseInt(value, 10)
    return isNaN(parsed) ? defaultValue : parsed
  }

  /**
   * Parse float with default value
   */
  private static parseFloat(
    value: string | undefined,
    defaultValue: number,
  ): number {
    if (!value) {
      return defaultValue
    }
    const parsed = parseFloat(value)
    return isNaN(parsed) ? defaultValue : parsed
  }
}

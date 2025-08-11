/**
 * Pricing Catalog - Token cost management for LLM providers
 *
 * This catalog maintains pricing information for different providers
 * and models, enabling accurate cost estimation for LLM operations.
 */

/**
 * Pricing information for a specific model
 */
export interface ModelPricing {
  /**
   * Cost per 1,000 input tokens in USD
   */
  inputPricePerThousand: number

  /**
   * Cost per 1,000 output tokens in USD
   */
  outputPricePerThousand: number

  /**
   * Optional flat rate per request (some providers charge this)
   */
  flatRatePerRequest?: number

  /**
   * Optional notes about pricing (e.g., "Cached inputs are 90% cheaper")
   */
  notes?: string
}

/**
 * Provider pricing information
 */
export interface ProviderPricing {
  /**
   * Provider name
   */
  provider: string

  /**
   * Pricing for each model offered by the provider
   */
  models: Record<string, ModelPricing>

  /**
   * Default model to use if none specified
   */
  defaultModel?: string

  /**
   * Currency (defaults to USD)
   */
  currency?: string

  /**
   * Last updated date
   */
  lastUpdated?: Date
}

/**
 * Pricing catalog for managing provider costs
 */
export class PricingCatalog {
  /**
   * Registry of provider pricing
   */
  private static pricing = new Map<string, ProviderPricing>()

  /**
   * Register pricing for a provider
   *
   * @param pricing - Provider pricing information
   */
  static register(pricing: ProviderPricing): void {
    this.pricing.set(pricing.provider, pricing)
  }

  /**
   * Get pricing for a specific provider
   *
   * @param provider - Provider name
   * @returns Provider pricing or undefined if not registered
   */
  static getProviderPricing(provider: string): ProviderPricing | undefined {
    return this.pricing.get(provider)
  }

  /**
   * Get pricing for a specific model
   *
   * @param provider - Provider name
   * @param model - Model name
   * @returns Model pricing or undefined if not found
   */
  static getModelPricing(
    provider: string,
    model: string,
  ): ModelPricing | undefined {
    const providerPricing = this.pricing.get(provider)
    if (!providerPricing) {
      return undefined
    }
    return providerPricing.models[model]
  }

  /**
   * Calculate cost for token usage
   *
   * @param provider - Provider name
   * @param model - Model name
   * @param inputTokens - Number of input tokens
   * @param outputTokens - Number of output tokens
   * @returns Estimated cost in USD
   */
  static calculateCost(
    provider: string,
    model: string,
    inputTokens: number,
    outputTokens: number,
  ): number {
    const modelPricing = this.getModelPricing(provider, model)
    if (!modelPricing) {
      return 0
    }

    const inputCost = (inputTokens / 1000) * modelPricing.inputPricePerThousand
    const outputCost =
      (outputTokens / 1000) * modelPricing.outputPricePerThousand
    const flatRate = modelPricing.flatRatePerRequest || 0

    return inputCost + outputCost + flatRate
  }

  /**
   * Find the most cost-effective provider for given token counts
   *
   * @param inputTokens - Expected input tokens
   * @param outputTokens - Expected output tokens
   * @returns Provider and model with lowest cost
   */
  static findCheapestOption(
    inputTokens: number,
    outputTokens: number,
  ): { provider: string; model: string; cost: number } | null {
    let cheapest: { provider: string; model: string; cost: number } | null =
      null

    for (const [providerName, providerPricing] of this.pricing.entries()) {
      for (const modelName of Object.keys(providerPricing.models)) {
        const cost = this.calculateCost(
          providerName,
          modelName,
          inputTokens,
          outputTokens,
        )

        if (!cheapest || cost < cheapest.cost) {
          cheapest = { provider: providerName, model: modelName, cost }
        }
      }
    }

    return cheapest
  }

  /**
   * Get all registered providers
   *
   * @returns Array of provider names
   */
  static getProviders(): string[] {
    return Array.from(this.pricing.keys())
  }

  /**
   * Clear the catalog (mainly for testing)
   *
   * @internal
   */
  static clear(): void {
    this.pricing.clear()
  }
}

/**
 * Initial pricing data for common providers
 * Prices as of January 2025 - should be updated regularly
 */
export const INITIAL_PRICING: ProviderPricing[] = [
  {
    provider: 'anthropic',
    models: {
      'claude-3-opus': {
        inputPricePerThousand: 0.015,
        outputPricePerThousand: 0.075,
        notes: 'Most capable model, best for complex tasks',
      },
      'claude-3-sonnet': {
        inputPricePerThousand: 0.003,
        outputPricePerThousand: 0.015,
        notes: 'Balanced performance and cost',
      },
      'claude-3-haiku': {
        inputPricePerThousand: 0.00025,
        outputPricePerThousand: 0.00125,
        notes: 'Fast and affordable for simple tasks',
      },
    },
    defaultModel: 'claude-3-sonnet',
    currency: 'USD',
    lastUpdated: new Date('2025-01-01'),
  },
  {
    provider: 'openai',
    models: {
      'gpt-4-turbo': {
        inputPricePerThousand: 0.01,
        outputPricePerThousand: 0.03,
        notes: 'Latest GPT-4 with 128k context',
      },
      'gpt-4': {
        inputPricePerThousand: 0.03,
        outputPricePerThousand: 0.06,
        notes: 'Original GPT-4 model',
      },
      'gpt-3.5-turbo': {
        inputPricePerThousand: 0.0005,
        outputPricePerThousand: 0.0015,
        notes: 'Fast and affordable',
      },
    },
    defaultModel: 'gpt-4-turbo',
    currency: 'USD',
    lastUpdated: new Date('2025-01-01'),
  },
]

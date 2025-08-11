import { describe, expect, it, beforeEach } from 'vitest'

import {
  PricingCatalog,
  type ModelPricing,
  type ProviderPricing,
} from '../pricing-catalog.js'

describe('PricingCatalog', () => {
  beforeEach(() => {
    PricingCatalog.clear()
  })

  describe('Provider Registration', () => {
    it('should register and retrieve provider pricing', () => {
      const pricing: ProviderPricing = {
        provider: 'test-provider',
        models: {
          'model-1': {
            inputPricePerThousand: 0.01,
            outputPricePerThousand: 0.02,
          },
          'model-2': {
            inputPricePerThousand: 0.005,
            outputPricePerThousand: 0.01,
            flatRatePerRequest: 0.001,
          },
        },
        defaultModel: 'model-1',
        currency: 'USD',
        lastUpdated: new Date('2025-01-01'),
      }

      PricingCatalog.register(pricing)
      const retrieved = PricingCatalog.getProviderPricing('test-provider')

      expect(retrieved).toEqual(pricing)
    })

    it('should return undefined for unregistered provider', () => {
      const pricing = PricingCatalog.getProviderPricing('unknown')
      expect(pricing).toBeUndefined()
    })

    it('should overwrite existing provider pricing', () => {
      const pricing1: ProviderPricing = {
        provider: 'test',
        models: {
          'model-1': {
            inputPricePerThousand: 0.01,
            outputPricePerThousand: 0.02,
          },
        },
      }

      const pricing2: ProviderPricing = {
        provider: 'test',
        models: {
          'model-2': {
            inputPricePerThousand: 0.02,
            outputPricePerThousand: 0.04,
          },
        },
      }

      PricingCatalog.register(pricing1)
      PricingCatalog.register(pricing2)

      const retrieved = PricingCatalog.getProviderPricing('test')
      expect(retrieved).toEqual(pricing2)
    })
  })

  describe('Model Pricing Retrieval', () => {
    beforeEach(() => {
      const pricing: ProviderPricing = {
        provider: 'test',
        models: {
          'fast-model': {
            inputPricePerThousand: 0.001,
            outputPricePerThousand: 0.002,
          },
          'smart-model': {
            inputPricePerThousand: 0.01,
            outputPricePerThousand: 0.02,
            notes: 'Best for complex tasks',
          },
        },
      }
      PricingCatalog.register(pricing)
    })

    it('should retrieve specific model pricing', () => {
      const modelPricing = PricingCatalog.getModelPricing('test', 'fast-model')

      expect(modelPricing).toBeDefined()
      expect(modelPricing?.inputPricePerThousand).toBe(0.001)
      expect(modelPricing?.outputPricePerThousand).toBe(0.002)
    })

    it('should return undefined for unknown model', () => {
      const modelPricing = PricingCatalog.getModelPricing(
        'test',
        'unknown-model',
      )
      expect(modelPricing).toBeUndefined()
    })

    it('should return undefined for unknown provider', () => {
      const modelPricing = PricingCatalog.getModelPricing(
        'unknown',
        'fast-model',
      )
      expect(modelPricing).toBeUndefined()
    })

    it('should include optional fields when present', () => {
      const modelPricing = PricingCatalog.getModelPricing('test', 'smart-model')
      expect(modelPricing?.notes).toBe('Best for complex tasks')
    })
  })

  describe('Cost Calculation', () => {
    beforeEach(() => {
      const pricing: ProviderPricing = {
        provider: 'test',
        models: {
          basic: {
            inputPricePerThousand: 0.001,
            outputPricePerThousand: 0.002,
          },
          premium: {
            inputPricePerThousand: 0.01,
            outputPricePerThousand: 0.02,
            flatRatePerRequest: 0.005,
          },
        },
      }
      PricingCatalog.register(pricing)
    })

    it('should calculate cost without flat rate', () => {
      const cost = PricingCatalog.calculateCost('test', 'basic', 1000, 500)

      // (1000/1000) * 0.001 + (500/1000) * 0.002 = 0.001 + 0.001 = 0.002
      expect(cost).toBe(0.002)
    })

    it('should calculate cost with flat rate', () => {
      const cost = PricingCatalog.calculateCost('test', 'premium', 1000, 500)

      // (1000/1000) * 0.01 + (500/1000) * 0.02 + 0.005 = 0.01 + 0.01 + 0.005 = 0.025
      expect(cost).toBe(0.025)
    })

    it('should handle large token counts', () => {
      const cost = PricingCatalog.calculateCost('test', 'basic', 100000, 50000)

      // (100000/1000) * 0.001 + (50000/1000) * 0.002 = 0.1 + 0.1 = 0.2
      expect(cost).toBe(0.2)
    })

    it('should return 0 for unknown model', () => {
      const cost = PricingCatalog.calculateCost('test', 'unknown', 1000, 500)
      expect(cost).toBe(0)
    })

    it('should return 0 for unknown provider', () => {
      const cost = PricingCatalog.calculateCost('unknown', 'basic', 1000, 500)
      expect(cost).toBe(0)
    })

    it('should handle zero tokens', () => {
      const cost = PricingCatalog.calculateCost('test', 'basic', 0, 0)
      expect(cost).toBe(0)
    })
  })

  describe('Finding Cheapest Option', () => {
    beforeEach(() => {
      // Register multiple providers with different pricing
      PricingCatalog.register({
        provider: 'expensive',
        models: {
          luxury: {
            inputPricePerThousand: 0.1,
            outputPricePerThousand: 0.2,
          },
        },
      })

      PricingCatalog.register({
        provider: 'affordable',
        models: {
          standard: {
            inputPricePerThousand: 0.01,
            outputPricePerThousand: 0.02,
          },
          budget: {
            inputPricePerThousand: 0.001,
            outputPricePerThousand: 0.002,
          },
        },
      })

      PricingCatalog.register({
        provider: 'middle',
        models: {
          balanced: {
            inputPricePerThousand: 0.05,
            outputPricePerThousand: 0.1,
          },
        },
      })
    })

    it('should find the cheapest option', () => {
      const cheapest = PricingCatalog.findCheapestOption(1000, 500)

      expect(cheapest).toBeDefined()
      expect(cheapest?.provider).toBe('affordable')
      expect(cheapest?.model).toBe('budget')
      // (1000/1000) * 0.001 + (500/1000) * 0.002 = 0.002
      expect(cheapest?.cost).toBe(0.002)
    })

    it('should handle different token ratios', () => {
      // High output scenario
      const cheapest = PricingCatalog.findCheapestOption(100, 10000)

      expect(cheapest).toBeDefined()
      expect(cheapest?.provider).toBe('affordable')
      expect(cheapest?.model).toBe('budget')
      // (100/1000) * 0.001 + (10000/1000) * 0.002 = 0.0001 + 0.02 = 0.0201
      expect(cheapest?.cost).toBeCloseTo(0.0201, 4)
    })

    it('should return null when no providers registered', () => {
      PricingCatalog.clear()
      const cheapest = PricingCatalog.findCheapestOption(1000, 500)
      expect(cheapest).toBeNull()
    })
  })

  describe('Provider Listing', () => {
    it('should list all registered providers', () => {
      PricingCatalog.register({ provider: 'provider-1', models: {} })
      PricingCatalog.register({ provider: 'provider-2', models: {} })
      PricingCatalog.register({ provider: 'provider-3', models: {} })

      const providers = PricingCatalog.getProviders()

      expect(providers).toHaveLength(3)
      expect(providers).toContain('provider-1')
      expect(providers).toContain('provider-2')
      expect(providers).toContain('provider-3')
    })

    it('should return empty array when no providers registered', () => {
      const providers = PricingCatalog.getProviders()
      expect(providers).toEqual([])
    })
  })

  describe('Registry Management', () => {
    it('should clear all pricing data', () => {
      PricingCatalog.register({ provider: 'test', models: {} })
      expect(PricingCatalog.getProviders()).toHaveLength(1)

      PricingCatalog.clear()

      expect(PricingCatalog.getProviders()).toHaveLength(0)
      expect(PricingCatalog.getProviderPricing('test')).toBeUndefined()
    })
  })

  describe('Model Pricing Structure', () => {
    it('should support all pricing fields', () => {
      const modelPricing: ModelPricing = {
        inputPricePerThousand: 0.01,
        outputPricePerThousand: 0.02,
        flatRatePerRequest: 0.001,
        notes: 'Cached inputs are 90% cheaper',
      }

      const pricing: ProviderPricing = {
        provider: 'test',
        models: { model: modelPricing },
      }

      PricingCatalog.register(pricing)
      const retrieved = PricingCatalog.getModelPricing('test', 'model')

      expect(retrieved).toEqual(modelPricing)
    })
  })
})

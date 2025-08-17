import { describe, expect, it, beforeEach } from 'vitest'

import type { ProviderCapabilities } from '../types'

import { CapabilityRegistry } from '../capability-registry'

describe('CapabilityRegistry', () => {
  beforeEach(() => {
    CapabilityRegistry.clear()
  })

  describe('Registration and Retrieval', () => {
    it('should register and retrieve provider capabilities', () => {
      const capabilities: ProviderCapabilities = {
        streaming: true,
        maxInputTokens: 100000,
        maxOutputTokens: 4096,
        supportedModels: ['model-1', 'model-2'],
        jsonMode: true,
        functionCalling: false,
        visionSupport: true,
      }

      CapabilityRegistry.register('test-provider', capabilities)
      const retrieved = CapabilityRegistry.get('test-provider')

      expect(retrieved).toEqual(capabilities)
    })

    it('should return undefined for unregistered provider', () => {
      const capabilities = CapabilityRegistry.get('unknown')
      expect(capabilities).toBeUndefined()
    })

    it('should overwrite existing registration', () => {
      const capabilities1: ProviderCapabilities = {
        streaming: false,
        maxInputTokens: 50000,
        maxOutputTokens: 2048,
        supportedModels: ['model-1'],
        jsonMode: false,
        functionCalling: false,
        visionSupport: false,
      }

      const capabilities2: ProviderCapabilities = {
        streaming: true,
        maxInputTokens: 100000,
        maxOutputTokens: 4096,
        supportedModels: ['model-2'],
        jsonMode: true,
        functionCalling: true,
        visionSupport: true,
      }

      CapabilityRegistry.register('provider', capabilities1)
      CapabilityRegistry.register('provider', capabilities2)

      const retrieved = CapabilityRegistry.get('provider')
      expect(retrieved).toEqual(capabilities2)
    })
  })

  describe('Finding Providers by Requirements', () => {
    beforeEach(() => {
      // Register multiple providers with different capabilities
      CapabilityRegistry.register('provider-a', {
        streaming: true,
        maxInputTokens: 100000,
        maxOutputTokens: 4096,
        supportedModels: ['model-1', 'model-2'],
        jsonMode: true,
        functionCalling: true,
        visionSupport: true,
      })

      CapabilityRegistry.register('provider-b', {
        streaming: true,
        maxInputTokens: 50000,
        maxOutputTokens: 2048,
        supportedModels: ['model-3'],
        jsonMode: false,
        functionCalling: false,
        visionSupport: false,
      })

      CapabilityRegistry.register('provider-c', {
        streaming: false,
        maxInputTokens: 200000,
        maxOutputTokens: 8192,
        supportedModels: ['model-1', 'model-4'],
        jsonMode: true,
        functionCalling: false,
        visionSupport: true,
      })
    })

    it('should find providers with streaming support', () => {
      const providers = CapabilityRegistry.findProviders({ streaming: true })
      expect(providers).toHaveLength(2)
      expect(providers).toContain('provider-a')
      expect(providers).toContain('provider-b')
    })

    it('should find providers with vision support', () => {
      const providers = CapabilityRegistry.findProviders({
        visionSupport: true,
      })
      expect(providers).toHaveLength(2)
      expect(providers).toContain('provider-a')
      expect(providers).toContain('provider-c')
    })

    it('should find providers meeting multiple requirements', () => {
      const providers = CapabilityRegistry.findProviders({
        streaming: true,
        jsonMode: true,
        functionCalling: true,
      })
      expect(providers).toHaveLength(1)
      expect(providers).toContain('provider-a')
    })

    it('should find providers supporting specific models', () => {
      const providers = CapabilityRegistry.findProviders({
        supportedModels: ['model-1'],
      })
      expect(providers).toHaveLength(2)
      expect(providers).toContain('provider-a')
      expect(providers).toContain('provider-c')
    })

    it('should find providers meeting token limits', () => {
      const providers = CapabilityRegistry.findProviders({
        maxInputTokens: 75000,
      })
      // Providers with >= 75000 input tokens
      expect(providers).toHaveLength(2)
      expect(providers).toContain('provider-a')
      expect(providers).toContain('provider-c')
    })

    it('should return empty array when no providers meet requirements', () => {
      const providers = CapabilityRegistry.findProviders({
        maxOutputTokens: 10000, // No provider has this many
      })
      expect(providers).toEqual([])
    })
  })

  describe('Provider Comparison', () => {
    beforeEach(() => {
      CapabilityRegistry.register('provider-a', {
        streaming: true,
        maxInputTokens: 100000,
        maxOutputTokens: 4096,
        supportedModels: ['model-1', 'model-2'],
        jsonMode: true,
        functionCalling: true,
        visionSupport: false,
      })

      CapabilityRegistry.register('provider-b', {
        streaming: false,
        maxInputTokens: 50000,
        maxOutputTokens: 8192,
        supportedModels: ['model-3'],
        jsonMode: true,
        functionCalling: false,
        visionSupport: true,
      })
    })

    it('should compare two providers', () => {
      const comparison = CapabilityRegistry.compare('provider-a', 'provider-b')

      expect(comparison).toBeDefined()
      expect(comparison?.streaming).toEqual({
        provider1: true,
        provider2: false,
      })
      expect(comparison?.maxOutputTokens).toEqual({
        provider1: 4096,
        provider2: 8192,
      })
      expect(comparison?.visionSupport).toEqual({
        provider1: false,
        provider2: true,
      })
    })

    it('should return null when comparing unknown providers', () => {
      const comparison = CapabilityRegistry.compare('provider-a', 'unknown')
      expect(comparison).toBeNull()
    })

    it('should return null when both providers are unknown', () => {
      const comparison = CapabilityRegistry.compare('unknown1', 'unknown2')
      expect(comparison).toBeNull()
    })
  })

  describe('Registry Management', () => {
    it('should list all registered providers', () => {
      CapabilityRegistry.register('provider-1', {
        streaming: true,
        maxInputTokens: 1000,
        maxOutputTokens: 1000,
        supportedModels: ['model'],
        jsonMode: false,
        functionCalling: false,
        visionSupport: false,
      })

      CapabilityRegistry.register('provider-2', {
        streaming: false,
        maxInputTokens: 2000,
        maxOutputTokens: 2000,
        supportedModels: ['model'],
        jsonMode: false,
        functionCalling: false,
        visionSupport: false,
      })

      const providers = CapabilityRegistry.getProviders()
      expect(providers).toHaveLength(2)
      expect(providers).toContain('provider-1')
      expect(providers).toContain('provider-2')
    })

    it('should clear the registry', () => {
      CapabilityRegistry.register('provider', {
        streaming: true,
        maxInputTokens: 1000,
        maxOutputTokens: 1000,
        supportedModels: ['model'],
        jsonMode: false,
        functionCalling: false,
        visionSupport: false,
      })

      expect(CapabilityRegistry.getProviders()).toHaveLength(1)

      CapabilityRegistry.clear()

      expect(CapabilityRegistry.getProviders()).toHaveLength(0)
      expect(CapabilityRegistry.get('provider')).toBeUndefined()
    })
  })
})

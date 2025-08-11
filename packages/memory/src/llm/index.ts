/**
 * LLM Module - Provider abstraction layer for Large Language Models
 *
 * This module provides a unified interface for working with different LLM providers,
 * enabling provider-agnostic operations and runtime provider selection.
 */

// Core interface and types
export type {
  LLMProvider,
  LLMRequest,
  LLMResponse,
  MessageRole,
  ProviderCapabilities,
  ProviderConfig,
  StreamEvent,
  StreamEventType,
  StreamHandlers,
  TokenUsage,
} from './llm-provider.interface.js'

// Factory for provider creation
export {
  LLMProviderFactory,
  type ProviderFactory,
} from './llm-provider-factory.js'

// Capability registry for feature discovery
export { CapabilityRegistry } from './capability-registry.js'

// Pricing catalog for cost management
export {
  PricingCatalog,
  INITIAL_PRICING,
  type ModelPricing,
  type ProviderPricing,
} from './pricing-catalog.js'

// Configuration schemas and validation
export {
  AnthropicConfigSchema,
  BaseProviderConfigSchema,
  CustomProviderConfigSchema,
  OpenAIConfigSchema,
  ProviderConfigSchema,
  getPartialConfigSchema,
  mergeWithDefaults,
  safeValidateProviderConfig,
  validateProviderConfig,
  type AnthropicConfig,
  type BaseProviderConfig,
  type CustomProviderConfig,
  type OpenAIConfig,
  type ValidatedProviderConfig,
} from './provider-config.schema.js'

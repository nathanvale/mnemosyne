/**
 * Provider Configuration Schema - Runtime validation with Zod
 *
 * This module defines Zod schemas for validating provider configurations
 * at runtime, ensuring type safety and data integrity.
 */

import { z } from 'zod'

/**
 * Base configuration schema shared by all providers
 */
export const BaseProviderConfigSchema = z.object({
  /**
   * Provider identifier
   */
  provider: z.string().min(1, 'Provider name is required'),

  /**
   * API key for authentication
   */
  apiKey: z.string().optional(),

  /**
   * Base URL for API endpoints (for custom deployments)
   */
  baseUrl: z.string().url().optional(),

  /**
   * Model to use
   */
  model: z.string().optional(),

  /**
   * Temperature for response generation (0.0 - 2.0)
   */
  temperature: z.number().min(0).max(2).optional(),

  /**
   * Maximum tokens in response
   */
  maxOutputTokens: z.number().positive().optional(),

  /**
   * Request timeout in milliseconds
   */
  timeout: z.number().positive().optional(),

  /**
   * Retry configuration
   */
  retry: z
    .object({
      maxAttempts: z.number().min(1).max(5).default(3),
      backoffMultiplier: z.number().min(1).default(2),
      initialDelay: z.number().positive().default(1000),
    })
    .optional(),

  /**
   * Custom headers for requests
   */
  headers: z.record(z.string()).optional(),
})

/**
 * Anthropic Claude provider configuration
 */
export const AnthropicConfigSchema = BaseProviderConfigSchema.extend({
  provider: z.literal('anthropic'),
  apiKey: z.string().min(1, 'Anthropic API key is required'),
  model: z
    .enum([
      'claude-3-opus-20240229',
      'claude-3-sonnet-20240229',
      'claude-3-haiku-20240307',
      'claude-3-opus',
      'claude-3-sonnet',
      'claude-3-haiku',
    ])
    .optional(),
  anthropicVersion: z.string().default('2023-06-01'),
  anthropicBeta: z.array(z.string()).optional(),
})

/**
 * OpenAI provider configuration
 */
export const OpenAIConfigSchema = BaseProviderConfigSchema.extend({
  provider: z.literal('openai'),
  apiKey: z.string().min(1, 'OpenAI API key is required'),
  model: z
    .enum([
      'gpt-4-turbo-preview',
      'gpt-4-turbo',
      'gpt-4',
      'gpt-4-32k',
      'gpt-3.5-turbo',
      'gpt-3.5-turbo-16k',
    ])
    .optional(),
  organization: z.string().optional(),
  topP: z.number().min(0).max(1).optional(),
  frequencyPenalty: z.number().min(-2).max(2).optional(),
  presencePenalty: z.number().min(-2).max(2).optional(),
})

/**
 * Custom provider configuration for self-hosted or alternative providers
 */
export const CustomProviderConfigSchema = BaseProviderConfigSchema.extend({
  provider: z
    .string()
    .refine(
      (val) => !['anthropic', 'openai'].includes(val),
      'Use specific schemas for known providers',
    ),
  baseUrl: z.string().url('Base URL is required for custom providers'),
  authType: z.enum(['bearer', 'api-key', 'basic', 'none']).optional(),
  authHeader: z.string().optional(),
})

/**
 * Union schema for all provider configurations
 */
export const ProviderConfigSchema = z.union([
  AnthropicConfigSchema,
  OpenAIConfigSchema,
  CustomProviderConfigSchema,
])

/**
 * Type exports derived from schemas
 */
export type BaseProviderConfig = z.infer<typeof BaseProviderConfigSchema>
export type AnthropicConfig = z.infer<typeof AnthropicConfigSchema>
export type OpenAIConfig = z.infer<typeof OpenAIConfigSchema>
export type CustomProviderConfig = z.infer<typeof CustomProviderConfigSchema>
export type ValidatedProviderConfig = z.infer<typeof ProviderConfigSchema>

/**
 * Validate a provider configuration
 *
 * @param config - Configuration to validate
 * @returns Validated configuration
 * @throws ZodError if validation fails
 */
export function validateProviderConfig(
  config: unknown,
): ValidatedProviderConfig {
  return ProviderConfigSchema.parse(config)
}

/**
 * Safely validate a provider configuration
 *
 * @param config - Configuration to validate
 * @returns Result object with success flag and data or error
 */
export function safeValidateProviderConfig(
  config: unknown,
):
  | { success: true; data: ValidatedProviderConfig }
  | { success: false; error: z.ZodError } {
  const result = ProviderConfigSchema.safeParse(config)
  if (result.success) {
    return { success: true, data: result.data }
  }
  return { success: false, error: result.error }
}

/**
 * Create a partial schema for configuration updates
 *
 * @param provider - Provider type
 * @returns Partial schema for the provider
 */
export function getPartialConfigSchema(provider: string) {
  switch (provider) {
    case 'anthropic':
      return AnthropicConfigSchema.partial()
    case 'openai':
      return OpenAIConfigSchema.partial()
    default:
      return CustomProviderConfigSchema.partial()
  }
}

/**
 * Merge configurations with defaults
 *
 * @param config - User configuration
 * @param defaults - Default configuration
 * @returns Merged configuration
 */
export function mergeWithDefaults<T extends BaseProviderConfig>(
  config: T,
  defaults: Partial<T>,
): T {
  return {
    ...defaults,
    ...config,
    retry: {
      ...defaults.retry,
      ...config.retry,
    },
    headers: {
      ...defaults.headers,
      ...config.headers,
    },
  }
}

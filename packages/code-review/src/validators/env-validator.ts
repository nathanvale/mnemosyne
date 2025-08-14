import { z } from 'zod'

/**
 * Environment variable validation schemas for the code review package
 */

// Schema for parsing boolean environment variables with default
const envBoolean = (defaultValue = true) =>
  z
    .string()
    .optional()
    .transform((val) => {
      if (!val) return defaultValue
      return val !== 'false' && val !== '0'
    })

// Schema for parsing integer environment variables with defaults
const envInt = (defaultValue: number) =>
  z
    .string()
    .optional()
    .transform((val) => {
      if (!val) return defaultValue
      const parsed = parseInt(val, 10)
      if (isNaN(parsed)) {
        throw new Error(`Invalid integer value: ${val}`)
      }
      return parsed
    })

// Schema for parsing optional strings with defaults
const envString = (defaultValue?: string) =>
  z
    .string()
    .optional()
    .default(defaultValue ?? '')

// Main environment schema for PR analysis
export const prAnalysisEnvSchema = z.object({
  // GitHub Configuration
  GITHUB_TOKEN: envString(),
  REPO: envString(),
  PR: envString(),

  // Analysis Configuration
  PR_ANALYSIS_CONFIDENCE_THRESHOLD: envInt(70).refine(
    (val) => val >= 0 && val <= 100,
    {
      message: 'Confidence threshold must be between 0 and 100',
    },
  ),
  PR_ANALYSIS_MAX_FINDINGS: envInt(20).refine((val) => val > 0, {
    message: 'Max findings must be greater than 0',
  }),
  PR_ANALYSIS_OUTPUT_FORMAT: z
    .enum(['json', 'markdown', 'github'])
    .optional()
    .default('github'),
  PR_ANALYSIS_TIMEOUT_MS: envInt(120000).refine((val) => val > 0, {
    message: 'Timeout must be greater than 0',
  }),

  // Feature Toggles
  PR_ANALYSIS_INCLUDE_OWASP: envBoolean(true),
  PR_ANALYSIS_INCLUDE_SANS: envBoolean(true),
  PR_ANALYSIS_INCLUDE_CWE: envBoolean(true),
  PR_ANALYSIS_ENABLE_EXPERT_FINDINGS: envBoolean(true),

  // Optional CodeRabbit Integration
  CODERABBIT_API_KEY: envString(),
  CODERABBIT_BASE_URL: envString('https://api.coderabbit.ai'),

  // Logging Configuration
  PR_ANALYSIS_LOG_DIR: envString('.logs/pr-reviews'),
  PR_ANALYSIS_DEBUG: envBoolean(false),
})

// Type for validated environment variables
export type PRAnalysisEnv = z.infer<typeof prAnalysisEnvSchema>

/**
 * Validates environment variables and returns typed configuration
 * @throws {z.ZodError} If validation fails with detailed error messages
 */
export function validateEnvironment(): PRAnalysisEnv {
  try {
    return prAnalysisEnvSchema.parse(process.env)
  } catch (error) {
    if (error instanceof z.ZodError) {
      const issues = error.issues
        .map((issue) => {
          const path = issue.path.join('.')
          return `  - ${path}: ${issue.message}`
        })
        .join('\n')

      throw new Error(
        `Environment validation failed:\n${issues}\n\nPlease check your environment variables or create a .env file with the required configuration.`,
      )
    }
    throw error
  }
}

/**
 * Validates environment variables at startup and provides helpful error messages
 * @param options Options for validation behavior
 * @returns Validated environment configuration
 */
export function validateStartupEnvironment(options?: {
  exitOnError?: boolean
  silent?: boolean
}): PRAnalysisEnv | null {
  const { exitOnError = true, silent = false } = options ?? {}

  try {
    const env = validateEnvironment()

    // Success message is not shown to avoid console pollution

    return env
  } catch (error) {
    if (!silent) {
      console.error('❌ Environment Validation Error:')
      console.error(error instanceof Error ? error.message : String(error))
      console.error('\nFor more information, see .env.example')
    }

    if (exitOnError) {
      process.exit(1)
    }

    return null
  }
}

/**
 * Gets a specific environment variable with type safety
 * @param key The environment variable key
 * @returns The typed value or undefined
 */
export function getEnvVar<K extends keyof PRAnalysisEnv>(
  key: K,
): PRAnalysisEnv[K] | undefined {
  try {
    const env = validateEnvironment()
    return env[key]
  } catch {
    return undefined
  }
}

/**
 * Creates a safe environment configuration with defaults for testing
 */
export function createTestEnvironment(
  overrides?: Partial<PRAnalysisEnv>,
): PRAnalysisEnv {
  return {
    GITHUB_TOKEN: '',
    REPO: 'test/repo',
    PR: '1',
    PR_ANALYSIS_CONFIDENCE_THRESHOLD: 70,
    PR_ANALYSIS_MAX_FINDINGS: 20,
    PR_ANALYSIS_OUTPUT_FORMAT: 'json',
    PR_ANALYSIS_TIMEOUT_MS: 5000,
    PR_ANALYSIS_INCLUDE_OWASP: true,
    PR_ANALYSIS_INCLUDE_SANS: true,
    PR_ANALYSIS_INCLUDE_CWE: true,
    PR_ANALYSIS_ENABLE_EXPERT_FINDINGS: true,
    CODERABBIT_API_KEY: '',
    CODERABBIT_BASE_URL: 'https://api.coderabbit.ai',
    PR_ANALYSIS_LOG_DIR: '.logs/test',
    PR_ANALYSIS_DEBUG: false,
    ...overrides,
  }
}

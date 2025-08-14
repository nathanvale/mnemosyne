# API Specification

This is the API specification for the spec detailed in @.agent-os/specs/2025-08-14-code-review-medium-improvements/spec.md

> Created: 2025-08-14
> Version: 1.0.0

## CLI Command Interface

### Standardized Command Structure

All commands follow the pattern: `pnpm code-review:<command> [options]`

### code-review:analyze

**Purpose:** Analyze a pull request for code quality, security, and best practices
**Usage:** `pnpm code-review:analyze --pr <number> [options]`

**Parameters:**

- `--pr, -p <number>` - Pull request number (required)
- `--repo, -r <owner/name>` - Repository (optional, uses current git remote)
- `--output, -o <format>` - Output format: json|markdown|console (default: console)
- `--output-file <path>` - Write output to file
- `--confidence <number>` - Confidence threshold 0-100 (default: 70)
- `--timeout <ms>` - Overall timeout in milliseconds (default: 300000)
- `--verbose, -v` - Verbose output for debugging

**Response Format:**

```typescript
{
  success: boolean
  data?: {
    pr: number
    repository: string
    analysis: AnalysisResult
    timestamp: string
  }
  error?: {
    code: string
    message: string
    details?: any
  }
}
```

**Error Codes:**

- `PR_NOT_FOUND` - Pull request doesn't exist
- `AUTH_FAILED` - GitHub authentication failed
- `TIMEOUT` - Analysis timeout exceeded
- `ANALYSIS_FAILED` - Analysis engine error

### code-review:fetch-coderabbit

**Purpose:** Fetch and parse CodeRabbit analysis for a PR
**Usage:** `pnpm code-review:fetch-coderabbit --pr <number> [options]`

**Parameters:**

- `--pr, -p <number>` - Pull request number (required)
- `--repo, -r <owner/name>` - Repository (required)
- `--output <path>` - Output file path (default: console)
- `--format <type>` - Output format: raw|processed (default: processed)
- `--timeout <ms>` - API timeout (default: 60000)

**Response Format:**

```typescript
{
  success: boolean
  data?: {
    summary: string
    fileAnalysis: FileAnalysis[]
    metrics: QualityMetrics
    timestamp: string
  }
  error?: CodeReviewError
}
```

### code-review:agent

**Purpose:** Run PR analysis with Claude agent integration
**Usage:** `pnpm code-review:agent --pr <number> [options]`

**Parameters:**

- `--pr, -p <number>` - Pull request number (required)
- `--mode <type>` - Agent mode: analyze|review|suggest (default: review)
- `--interactive` - Interactive mode with prompts
- `--config <path>` - Configuration file path
- `--dry-run` - Simulate without making changes

**Response Format:**

```typescript
{
  success: boolean
  agentResponse: {
    analysis: string
    suggestions: Suggestion[]
    confidence: number
  }
  metadata: {
    duration: number
    tokensUsed: number
  }
}
```

### code-review:report

**Purpose:** Generate comprehensive PR analysis report
**Usage:** `pnpm code-review:report --pr <number> [options]`

**Parameters:**

- `--pr, -p <number>` - Pull request number (required)
- `--template <name>` - Report template: standard|detailed|summary
- `--include <items>` - Comma-separated: security,performance,quality,tests
- `--format <type>` - Output format: html|markdown|pdf
- `--output <path>` - Output file path (required)

## Programmatic API

### Core Classes

#### CodeReviewClient

```typescript
class CodeReviewClient {
  constructor(config: CodeReviewConfig)

  // Main analysis method
  analyzePR(options: AnalyzeOptions): Promise<AnalysisResult>

  // Individual analysis components
  analyzeSecurityPR: PRNumber): Promise<SecurityAnalysis>
  analyzeQuality(pr: PRNumber): Promise<QualityAnalysis>
  analyzePerformance(pr: PRNumber): Promise<PerformanceAnalysis>

  // Utility methods
  validateConfig(): ValidationResult
  setTimeouts(timeouts: TimeoutConfig): void
}
```

#### ErrorHandler

```typescript
class ErrorHandler {
  static handle(error: unknown): CodeReviewError
  static isRecoverable(error: CodeReviewError): boolean
  static serialize(error: CodeReviewError): SerializedError
  static createFromCode(code: string, context?: any): CodeReviewError
}
```

#### ProgressReporter

```typescript
class ProgressReporter {
  constructor(options: ProgressOptions)

  start(total?: number): void
  update(current: number, message?: string): void
  increment(message?: string): void
  complete(message?: string): void
  fail(error: Error): void
}
```

### Configuration API

```typescript
interface CodeReviewConfig {
  github: {
    token: string
    baseUrl?: string
    timeout?: number
  }
  coderabbit?: {
    apiKey?: string
    baseUrl?: string
  }
  analysis: {
    confidenceThreshold: number
    includeTests: boolean
    securityLevel: 'low' | 'medium' | 'high'
  }
  output: {
    format: 'json' | 'markdown' | 'console'
    verbose: boolean
    colors: boolean
  }
  timeouts: TimeoutConfig
}
```

### Event Emitter API

```typescript
class CodeReviewEmitter extends EventEmitter {
  // Progress events
  on('progress', (data: ProgressData) => void): this
  on('stage:start', (stage: string) => void): this
  on('stage:complete', (stage: string) => void): this

  // Analysis events
  on('analysis:start', (pr: number) => void): this
  on('analysis:complete', (result: AnalysisResult) => void): this
  on('analysis:error', (error: CodeReviewError) => void): this

  // Network events
  on('api:request', (request: APIRequest) => void): this
  on('api:response', (response: APIResponse) => void): this
  on('api:retry', (attempt: number) => void): this
}
```

## Error Response Specification

### Standard Error Format

```typescript
interface CodeReviewError {
  code: string // Machine-readable error code
  message: string // Human-readable message
  details?: any // Additional context
  timestamp: string // ISO 8601 timestamp
  recoverable: boolean // Whether retry might succeed
  suggestions?: string[] // Helpful suggestions for resolution
}
```

### Error Code Categories

- `AUTH_*` - Authentication/authorization errors
- `NETWORK_*` - Network and connectivity errors
- `VALIDATION_*` - Input validation errors
- `ANALYSIS_*` - Analysis engine errors
- `CONFIG_*` - Configuration errors
- `TIMEOUT_*` - Timeout errors
- `RATE_LIMIT_*` - Rate limiting errors

## Backwards Compatibility

### Deprecated Commands (with aliases)

```bash
# Old command -> New command
review:analyze -> code-review:analyze
review:pr -> code-review:analyze
review:agent-wrapper -> code-review:agent
review:fetch-coderabbit -> code-review:fetch-coderabbit
```

### Migration Guide

1. Update scripts to use new command names
2. Update CI/CD configurations
3. Use provided aliases during transition period
4. Aliases will be removed in next major version

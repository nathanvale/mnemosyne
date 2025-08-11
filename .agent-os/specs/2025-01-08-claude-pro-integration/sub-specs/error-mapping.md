# Error Mapping Specification

> Version: 1.0.0
> Created: 2025-08-11
> Scope: Provider error classification and retry strategies

_Glossary Reference_: See [../glossary.md](../glossary.md) for error taxonomy definitions.

## Error Taxonomy

Our canonical error types with retry and fallback policies:

| Error Type        | Retry Policy        | Max Attempts | Fallback Eligible | Description                         |
| ----------------- | ------------------- | ------------ | ----------------- | ----------------------------------- |
| `rate_limit`      | Exponential backoff | 3            | Yes               | API rate limit exceeded             |
| `timeout`         | Exponential backoff | 3            | Yes               | Request timeout or network issues   |
| `authentication`  | None                | 0            | No                | Invalid or missing API key          |
| `invalid_request` | None                | 0            | Optional\*        | Malformed request, invalid model    |
| `parsing`         | Corrective retry    | 1            | Yes\*\*           | Response parsing/validation failure |
| `budget_exceeded` | None                | 0            | No                | Daily budget limit reached          |
| `policy`          | None                | 0            | No                | Content policy violation            |
| `transient`       | Exponential backoff | 3            | Yes               | Temporary server issues             |
| `unknown`         | Exponential backoff | 1            | Optional          | Unmapped errors                     |

\*`invalid_request` fallback only if different model might succeed
\*\*`parsing` fallback only after corrective retry fails

## Fallback Retry Budget

When a fallback provider is invoked after the primary provider exhausts its retries, the fallback provider receives a **fresh retry budget**. The retry counts are NOT shared between providers.

### Example Retry Flow

```
Primary Provider (Claude):
  Attempt 1: rate_limit error → retry
  Attempt 2: rate_limit error → retry
  Attempt 3: rate_limit error → exhausted

Fallback Provider (OpenAI) - Fresh Budget:
  Attempt 1: transient error → retry
  Attempt 2: success ✓
```

### Important Notes

- Each provider maintains its own retry counter
- Fallback provider starts with attempt = 0
- Fallback gets full retry budget per error type (e.g., 3 for rate_limit)
- Circuit breaker states are independent per provider
- Budget spend accumulates across both providers

This ensures the fallback provider has the maximum chance of success without being penalized by the primary provider's failed attempts.

## Claude (Anthropic) Error Mapping

### SDK Error Classes (Claude)

```typescript
import { AnthropicError } from '@anthropic-ai/sdk'

function classifyAnthropicError(error: unknown): ErrorType {
  if (!(error instanceof AnthropicError)) {
    return 'unknown'
  }

  // Check status code first
  if ('status' in error) {
    switch (error.status) {
      case 401:
        return 'authentication'
      case 429:
        return 'rate_limit'
      case 400:
        return 'invalid_request'
      case 500:
      case 502:
      case 503:
        return 'transient'
      case 504:
        return 'timeout'
    }
  }

  // Check error type
  if (error.type === 'rate_limit_error') {
    return 'rate_limit'
  }
  if (error.type === 'authentication_error') {
    return 'authentication'
  }
  if (error.type === 'invalid_request_error') {
    return 'invalid_request'
  }
  if (error.type === 'permission_error') {
    return 'policy'
  }

  // Check error message patterns
  const message = error.message?.toLowerCase() || ''

  if (message.includes('timeout') || message.includes('timed out')) {
    return 'timeout'
  }
  if (message.includes('overloaded') || message.includes('capacity')) {
    return 'transient'
  }
  if (message.includes('safety') || message.includes('content policy')) {
    return 'policy'
  }

  return 'unknown'
}
```

### Response Headers (Claude)

Claude provides rate limit information in response headers:

```typescript
interface AnthropicRateLimitHeaders {
  'anthropic-ratelimit-requests-limit': string
  'anthropic-ratelimit-requests-remaining': string
  'anthropic-ratelimit-requests-reset': string // ISO 8601
  'anthropic-ratelimit-tokens-limit': string
  'anthropic-ratelimit-tokens-remaining': string
  'anthropic-ratelimit-tokens-reset': string // ISO 8601
  'retry-after'?: string // Seconds to wait
}
```

### Example Error Responses (Claude)

```json
// Rate limit error
{
  "error": {
    "type": "rate_limit_error",
    "message": "Rate limit exceeded. Please wait before making another request."
  }
}

// Authentication error
{
  "error": {
    "type": "authentication_error",
    "message": "Invalid API key provided."
  }
}

// Invalid request
{
  "error": {
    "type": "invalid_request_error",
    "message": "max_tokens must be at least 1."
  }
}

// Content policy
{
  "error": {
    "type": "permission_error",
    "message": "Your request was flagged by our safety system."
  }
}
```

## OpenAI Error Mapping

### SDK Error Classes (OpenAI)

```typescript
import { OpenAIError } from 'openai'

function classifyOpenAIError(error: unknown): ErrorType {
  if (!(error instanceof OpenAIError)) {
    return 'unknown'
  }

  // Check status code
  if ('status' in error) {
    switch (error.status) {
      case 401:
        return 'authentication'
      case 429:
        return 'rate_limit'
      case 400:
        return 'invalid_request'
      case 404:
        return 'invalid_request' // Model not found
      case 500:
      case 502:
      case 503:
        return 'transient'
      case 504:
        return 'timeout'
    }
  }

  // Check error code
  if ('code' in error) {
    switch (error.code) {
      case 'rate_limit_exceeded':
        return 'rate_limit'
      case 'invalid_api_key':
        return 'authentication'
      case 'model_not_found':
        return 'invalid_request'
      case 'context_length_exceeded':
        return 'invalid_request'
      case 'content_filter':
        return 'policy'
      case 'server_error':
        return 'transient'
    }
  }

  // Check error type
  const errorType = error.constructor.name

  if (errorType === 'APIConnectionError') {
    return 'timeout'
  }
  if (errorType === 'AuthenticationError') {
    return 'authentication'
  }
  if (errorType === 'RateLimitError') {
    return 'rate_limit'
  }
  if (errorType === 'BadRequestError') {
    return 'invalid_request'
  }
  if (errorType === 'InternalServerError') {
    return 'transient'
  }

  return 'unknown'
}
```

### Response Headers (OpenAI)

OpenAI provides rate limit information differently:

```typescript
interface OpenAIRateLimitHeaders {
  'x-ratelimit-limit-requests': string
  'x-ratelimit-limit-tokens': string
  'x-ratelimit-remaining-requests': string
  'x-ratelimit-remaining-tokens': string
  'x-ratelimit-reset-requests': string // Unix timestamp
  'x-ratelimit-reset-tokens': string // Unix timestamp
  'retry-after'?: string // Seconds to wait (on 429)
}
```

### Example Error Responses (OpenAI)

```json
// Rate limit error
{
  "error": {
    "message": "Rate limit reached for gpt-4 in organization org-xxx",
    "type": "rate_limit_exceeded",
    "param": null,
    "code": "rate_limit_exceeded"
  }
}

// Authentication error
{
  "error": {
    "message": "Incorrect API key provided",
    "type": "invalid_request_error",
    "param": null,
    "code": "invalid_api_key"
  }
}

// Model not found
{
  "error": {
    "message": "The model 'gpt-5' does not exist",
    "type": "invalid_request_error",
    "param": null,
    "code": "model_not_found"
  }
}

// Content filter
{
  "error": {
    "message": "The content was filtered due to policy violations",
    "type": "invalid_request_error",
    "param": null,
    "code": "content_filter"
  }
}
```

## Network & HTTP Error Mapping

### Common Network Errors

```typescript
function classifyNetworkError(error: unknown): ErrorType {
  const message = error?.message?.toLowerCase() || ''
  const code = error?.code || ''

  // Timeout patterns
  if (
    code === 'ETIMEDOUT' ||
    code === 'ESOCKETTIMEDOUT' ||
    code === 'ECONNABORTED' ||
    message.includes('timeout') ||
    message.includes('timed out')
  ) {
    return 'timeout'
  }

  // Connection errors (likely transient)
  if (
    code === 'ECONNREFUSED' ||
    code === 'ECONNRESET' ||
    code === 'EHOSTUNREACH' ||
    code === 'ENETUNREACH'
  ) {
    return 'transient'
  }

  // DNS errors (configuration issue)
  if (code === 'ENOTFOUND' || code === 'EADDRNOTAVAIL') {
    return 'invalid_request'
  }

  return 'unknown'
}
```

### HTTP Status Code Mapping

```typescript
function classifyHTTPStatus(status: number): ErrorType {
  // 4xx Client errors
  if (status === 401 || status === 403) {
    return 'authentication'
  }
  if (status === 429) {
    return 'rate_limit'
  }
  if (status === 400 || status === 404 || status === 422) {
    return 'invalid_request'
  }
  if (status === 402) {
    return 'budget_exceeded' // Payment required
  }
  if (status === 451) {
    return 'policy' // Unavailable for legal reasons
  }

  // 5xx Server errors
  if (status === 503) {
    return 'transient' // Service unavailable
  }
  if (status === 504) {
    return 'timeout' // Gateway timeout
  }
  if (status >= 500 && status < 600) {
    return 'transient'
  }

  return 'unknown'
}
```

## Parsing Error Classification

```typescript
function classifyParsingError(error: unknown): ErrorType {
  const message = error?.message?.toLowerCase() || ''

  // Always classify JSON/Schema errors as parsing
  if (
    error instanceof SyntaxError ||
    message.includes('json') ||
    message.includes('parse') ||
    message.includes('unexpected token') ||
    message.includes('unexpected end') ||
    message.includes('schema validation') ||
    message.includes('zod')
  ) {
    return 'parsing'
  }

  return 'unknown'
}
```

## Complete Error Classifier

```typescript
export class ErrorClassifier {
  classify(error: unknown, provider: string): ErrorClassification {
    // Pre-check for budget exceeded
    if (this.isBudgetExceeded(error)) {
      return {
        type: 'budget_exceeded',
        retryable: false,
        fallbackEligible: false,
        maxAttempts: 0
      }
    }

    // Provider-specific classification
    let errorType: ErrorType

    switch (provider) {
      case 'claude':
        errorType = classifyAnthropicError(error)
        break
      case 'openai':
        errorType = classifyOpenAIError(error)
        break
      default:
        errorType = 'unknown'
    }

    // Fallback to network/parsing classification
    if (errorType === 'unknown') {
      errorType = classifyNetworkError(error) ||
                  classifyParsingError(error) ||
                  'unknown'
    }

    // Apply retry policy
    const policy = this.getRetryPolicy(errorType)

    return {
      type: errorType,
      retryable: policy.retryable,
      fallbackEligible: policy.fallbackEligible,
      maxAttempts: policy.maxAttempts,
      backoffStrategy: policy.backoffStrategy
    }
  }

  private getRetryPolicy(errorType: ErrorType): RetryPolicy {
    const policies: Record<ErrorType, RetryPolicy> = {
      rate_limit: {
        retryable: true,
        fallbackEligible: true,
        maxAttempts: 3,
        backoffStrategy: 'exponential'
      },
      timeout: {
        retryable: true,
        fallbackEligible: true,
        maxAttempts: 3,
        backoffStrategy: 'exponential'
      },
      authentication: {
        retryable: false,
        fallbackEligible: false,
        maxAttempts: 0,
        backoffStrategy: 'none'
      },
      invalid_request: {
        retryable: false,
        fallbackEligible: false,  // Unless different model
        maxAttempts: 0,
        backoffStrategy: 'none'
      },
      parsing: {
        retryable: true,
        fallbackEligible: true,
        maxAttempts: 1,  // One corrective retry
        backoffStrategy: 'none'
      },
      budget_exceeded: {
        retryable: false,
        fallbackEligible: false,
        maxAttempts: 0,
        backoffStrategy: 'none'
      },
      policy: {
        retryable: false,
        fallbackEligible: false,
        maxAttempts: 0,
        backoffStrategy: 'none'
      },
      transient: {
        retryable: true,
        fallbackEligible: true,
        maxAttempts: 3,
        backoffStrategy: 'exponential'
      },
      unknown: {
        retryable: true,
        fallbackEligible: false,
        maxAttempts: 1,
        backoffStrategy: 'exponential'
      }
    }

    return policies[errorType]
  }
}

## Retry-After Precedence & Backoff Standardization

When a provider supplies an explicit Retry-After header (OpenAI `Retry-After`, Anthropic `retry-after`) the value (seconds → ms) MUST fully replace the exponential+jitter schedule for that retry attempt (no jitter applied). If absent, but a reset window header is available (e.g., Anthropic `anthropic-ratelimit-requests-reset`, OpenAI `x-ratelimit-reset-requests`), the system MAY derive a positive delay and log it as `retryAfterMs` with `derivedRetry=true`. All other cases fall back to exponential backoff with symmetric jitter:

`delay = min(500ms * 2^attempt, 8000ms) + jitter(-200ms…+200ms)`

The internal computed delay is stored as `scheduledDelayMs` (never logged). Logging surfaces only provider hints (`retryAfterMs`) plus `derivedRetry` flag when applicable, aligning with technical-spec.md & logging-format.md. This ensures consistent cross-document semantics and deterministic retry timing under test injection of RNG/Clock.
```

## Testing Requirements

### Unit Tests

Each error classification must be tested with:

```typescript
describe('ErrorClassifier', () => {
  it('classifies Claude 429 as rate_limit', () => {
    const error = new AnthropicError({
      status: 429,
      message: 'Rate limit exceeded',
    })
    const result = classifier.classify(error, 'claude')
    expect(result.type).toBe('rate_limit')
    expect(result.retryable).toBe(true)
    expect(result.fallbackEligible).toBe(true)
  })

  it('classifies OpenAI timeout as timeout', () => {
    const error = new OpenAIError({
      code: 'ETIMEDOUT',
      message: 'Request timed out',
    })
    const result = classifier.classify(error, 'openai')
    expect(result.type).toBe('timeout')
    expect(result.maxAttempts).toBe(3)
  })

  // Test each error type for each provider
})
```

### Integration Tests

```typescript
describe('Error handling integration', () => {
  it('retries on rate limit with backoff', async () => {
    // Mock provider to return 429, then success
    const result = await processor.process(messages)
    expect(mockProvider.send).toHaveBeenCalledTimes(2)
    expect(result).toBeDefined()
  })

  it('falls back on parsing error after corrective retry', async () => {
    // Mock primary to return invalid JSON twice
    // Mock fallback to succeed
    const result = await processor.process(messages)
    expect(mockPrimary.send).toHaveBeenCalledTimes(2)
    expect(mockFallback.send).toHaveBeenCalledTimes(1)
  })
})
```

## Monitoring & Alerting

### Metrics to Track

```typescript
// Error rate by type
memory_llm_errors_total{provider="claude",error_type="rate_limit"}
memory_llm_errors_total{provider="openai",error_type="timeout"}

// Retry success rate
memory_llm_retries_total{provider="claude",error_type="transient",result="success"}
memory_llm_retries_total{provider="claude",error_type="transient",result="failure"}

// Fallback triggers
memory_llm_fallback_total{from="claude",to="openai",error_type="rate_limit"}
```

### Alert Conditions

- Authentication errors > 0 (immediate alert)
- Error rate > 10% sustained for 5 minutes
- Circuit breaker open > 5 minutes
- Budget exceeded events (daily summary)
- Unknown error rate > 5%

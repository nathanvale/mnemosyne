# Technical Specification

This is the technical specification for the spec detailed in @.agent-os/specs/2025-01-08-claude-pro-integration/spec.md

> Created: 2025-01-08
> Version: 1.0.0

## Technical Requirements

### Core Functionality

- Integrate Anthropic TypeScript SDK (@anthropic-ai/sdk) for Claude API access
- Implement secure API key management through environment variables
- Create mood-aware prompt generation system
- Handle rate limiting with exponential backoff
- Parse and validate Claude responses against memory schema
- Integrate with existing mood scoring and delta detection systems

### Performance Requirements

- Process batches of 10-50 messages per API call
- Maintain <2 second response time for batch processing
- Support parallel processing of multiple batches
- Implement caching for repeated prompt patterns
- Optimize token usage to minimize costs

### Integration Requirements

- Seamless integration with existing MoodScoringAnalyzer
- Compatible with DeltaDetector for emotional significance filtering
- Output format matching ExtractedMemory interface
- Support for existing validation pipeline

## Approach Options

### Option A: Direct API Integration

- **Pros**: Simple implementation, direct control over API calls, minimal dependencies
- **Cons**: Need to build rate limiting from scratch, manual retry logic

### Option B: SDK with Custom Wrapper (Selected)

- **Pros**: Built-in retry logic, automatic rate limit handling, type safety, streaming support
- **Cons**: Additional dependency, less granular control
- **Rationale**: The Anthropic SDK provides robust error handling, automatic retries, and type safety that would take significant effort to replicate. The built-in rate limiting and exponential backoff align perfectly with our requirements.

### Option C: Queue-Based Processing

- **Pros**: Better for high-volume processing, cost optimization through batching
- **Cons**: More complex implementation, delayed responses
- **Rationale**: While beneficial for scale, this adds unnecessary complexity for our MVP needs.

## External Dependencies

### Required Packages

**@anthropic-ai/sdk** (^0.32.1)

- **Purpose**: Official Anthropic TypeScript SDK for Claude API access
- **Justification**: Provides type-safe API access, built-in retry logic, streaming support, and automatic rate limit handling
- **License**: MIT

**dotenv** (^16.4.5)

- **Purpose**: Environment variable management
- **Justification**: Secure API key storage and configuration management
- **License**: BSD-2-Clause

**p-queue** (^8.0.1)

- **Purpose**: Promise queue with concurrency control
- **Justification**: Additional queue management for batch processing optimization
- **License**: MIT

## Architecture Design

### Module Structure

```
packages/memory/src/claude/
├── index.ts                    # Public API exports
├── claude-client.ts            # Anthropic SDK client wrapper
├── prompt-builder.ts           # Mood-aware prompt generation
├── rate-limiter.ts            # Rate limiting and queue management
├── enhanced-processor.ts       # Main processing orchestrator
├── response-parser.ts         # Claude response parsing
├── error-handler.ts           # Error handling and recovery
├── config.ts                  # Configuration management
├── cost-estimator.ts          # Token usage and cost tracking
└── types.ts                   # TypeScript interfaces
```

### Data Flow

```
1. ConversationData Input
   ↓
2. MoodScoringAnalyzer.analyzeConversation()
   ↓
3. DeltaDetector.detectDeltas()
   ↓
4. EnhancedProcessor.filterByEmotionalSalience()
   ↓
5. PromptBuilder.buildMoodAwarePrompt()
   ↓
6. RateLimiter.executeWithRetry()
   ↓
7. ClaudeClient.messages.create()
   ↓
8. ResponseParser.parseMemoryResponse()
   ↓
9. ExtractedMemory Output
```

## Implementation Details

### Claude Client Configuration

```typescript
interface ClaudeConfig {
  apiKey: string
  maxRetries?: number // Default: 3
  timeout?: number // Default: 60000ms
  maxTokens?: number // Default: 2000
  model?: string // Default: 'claude-3-sonnet-20240229'
  temperature?: number // Default: 0.7
}
```

### Prompt Engineering Strategy

The prompt builder will use a structured template approach:

```typescript
interface PromptTemplate {
  systemPrompt: string // Role and context setting
  moodContext: string // Mood scores and emotional baseline
  deltaContext: string // Significant emotional changes
  messageContent: string // Actual conversation messages
  extractionInstructions: string // Specific extraction requirements
  outputFormat: string // JSON schema for response
}
```

### Rate Limiting Implementation

```typescript
interface RateLimitConfig {
  maxRequestsPerMinute: number // Default: 50
  maxTokensPerMinute: number // Default: 40000
  maxConcurrent: number // Default: 3
  retryDelayMs: number // Default: 1000
  maxRetries: number // Default: 3
  backoffMultiplier: number // Default: 2
}
```

### Error Handling Strategy

```typescript
enum ErrorType {
  RATE_LIMIT = 'rate_limit',
  AUTHENTICATION = 'authentication',
  INVALID_REQUEST = 'invalid_request',
  TIMEOUT = 'timeout',
  PARSING = 'parsing',
  UNKNOWN = 'unknown',
}

interface ErrorRecoveryStrategy {
  [ErrorType.RATE_LIMIT]: exponentialBackoff
  [ErrorType.AUTHENTICATION]: failFast
  [ErrorType.INVALID_REQUEST]: logAndSkip
  [ErrorType.TIMEOUT]: retryWithIncreaseTimeout
  [ErrorType.PARSING]: fallbackToBasicExtraction
  [ErrorType.UNKNOWN]: retryThenFail
}
```

## Security Considerations

- API keys stored in environment variables, never in code
- Implement request signing for production environments
- Sanitize all user input before sending to Claude
- Log API errors without exposing sensitive data
- Implement rate limiting per user/tenant in multi-tenant scenarios

## Performance Optimizations

### Caching Strategy

- Cache frequently used prompt templates
- Store successful extraction patterns for similar conversations
- Implement LRU cache for response patterns

### Batch Processing

- Group messages by emotional similarity
- Process high-salience messages first
- Implement priority queue for urgent extractions

### Token Optimization

- Compress repetitive content in prompts
- Use references for repeated context
- Implement prompt truncation for long conversations

## Monitoring and Observability

### Metrics to Track

- API call success/failure rates
- Average response times
- Token usage per request
- Cost per extraction
- Memory extraction confidence scores
- Rate limit hit frequency

### Logging Requirements

- Log all API requests with request IDs
- Track prompt generation patterns
- Monitor error rates by type
- Record extraction quality metrics

## Testing Considerations

### Test Scenarios

- Successful memory extraction with high confidence
- Rate limit handling and retry logic
- Network timeout recovery
- Invalid API key handling
- Malformed response parsing
- Edge cases in mood scoring integration

### Mock Strategies

- Use MSW for API mocking in tests
- Create fixture responses for common scenarios
- Implement deterministic prompt generation for testing

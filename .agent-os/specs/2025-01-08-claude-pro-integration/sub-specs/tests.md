# Tests Specification

This is the tests coverage details for the spec detailed in @.agent-os/specs/2025-01-08-claude-pro-integration/spec.md

> Created: 2025-01-08
> Version: 1.0.0

## Test Coverage

### Unit Tests

**ClaudeClient**

- API key validation with valid and invalid keys
- Connection establishment and timeout handling
- Message sending with various parameters
- Streaming response handling
- Usage statistics tracking and reset
- Error handling for network failures

**EnhancedPromptBuilder**

- Mood-aware prompt generation with different mood scores
- System prompt creation with emotional context
- Extraction instructions building with various requirements
- Prompt optimization for token limits
- Template validation and custom template usage
- Edge cases with empty or malformed input

**RateLimiter**

- Request execution within rate limits
- Queue management when limits exceeded
- Exponential backoff calculation
- Concurrent request handling
- Rate limit header parsing
- Timeout and cancellation handling

**EnhancedClaudeProcessor**

- Message batch processing with mood integration
- Emotional salience filtering with various thresholds
- Cost estimation accuracy
- Processing mode selection (quality/speed/balanced)
- Error recovery during processing
- Statistics tracking and reporting

**ClaudeResponseParser**

- JSON response parsing with valid structure
- Malformed response handling
- Streaming chunk assembly
- Schema validation with various response formats
- Confidence extraction from responses
- Fallback parsing strategies

**ClaudeErrorHandler**

- Error classification for different error types
- Recovery strategy selection
- Retry logic with backoff
- Context preservation during retries
- Error logging with sanitization
- Non-retryable error handling

**ConfigurationManager**

- Environment variable loading
- Configuration validation
- Default value application
- Configuration updates and persistence
- Invalid configuration rejection

**CostEstimator**

- Token counting accuracy
- Cost calculation for different models
- Usage tracking over time
- Budget monitoring and alerts
- Report generation for various periods

### Integration Tests

**Claude API Integration**

- End-to-end message processing with real API (using test key)
- Rate limit handling with actual API responses
- Streaming response processing
- Authentication flow validation
- Error recovery in production scenarios

**Mood Scoring Integration**

- Processing pipeline with MoodScoringAnalyzer
- Delta detection integration
- Emotional significance filtering
- Prompt generation with actual mood data
- Memory extraction with emotional context

**Database Integration**

- Saving extracted memories to database
- Transaction handling during batch processing
- Error recovery with database rollback
- Concurrent processing with database locks

### Feature Tests

**Memory Extraction Workflow**

- Complete extraction from conversation to memory
- Multi-participant conversation handling
- Long conversation processing with truncation
- Emotional trajectory tracking
- Confidence scoring validation

**Rate Limiting Scenarios**

- Handling 429 rate limit errors
- Automatic retry with backoff
- Queue processing when throttled
- Concurrent request management
- Rate limit recovery after reset

**Error Recovery Workflows**

- Network failure recovery
- API timeout handling
- Invalid response recovery
- Authentication failure handling
- Partial batch failure recovery

### Mocking Requirements

**Anthropic API**

- Mock successful message responses
- Mock rate limit responses with headers
- Mock streaming responses with chunks
- Mock error responses (400, 401, 429, 500)
- Mock timeout scenarios

**Environment Variables**

```typescript
// Test environment variables
process.env.ANTHROPIC_API_KEY = 'test-api-key'
process.env.ANTHROPIC_MODEL = 'claude-3-sonnet-20240229'
process.env.ANTHROPIC_MAX_RETRIES = '3'
process.env.ANTHROPIC_TIMEOUT = '5000'
```

**MSW Handlers**

```typescript
import { http, HttpResponse } from 'msw'

export const handlers = [
  // Successful message creation
  http.post('https://api.anthropic.com/v1/messages', () => {
    return HttpResponse.json({
      id: 'msg_test_123',
      type: 'message',
      role: 'assistant',
      content: [{
        type: 'text',
        text: JSON.stringify({
          memories: [...],
          confidence: 0.85
        })
      }],
      model: 'claude-3-sonnet-20240229',
      usage: {
        input_tokens: 1024,
        output_tokens: 512
      }
    })
  }),

  // Rate limit response
  http.post('https://api.anthropic.com/v1/messages', () => {
    return new HttpResponse(null, {
      status: 429,
      headers: {
        'retry-after': '30',
        'anthropic-ratelimit-requests-remaining': '0',
        'anthropic-ratelimit-requests-reset': new Date(Date.now() + 30000).toISOString()
      }
    })
  }),

  // Streaming response
  http.post('https://api.anthropic.com/v1/messages', () => {
    const encoder = new TextEncoder()
    const stream = new ReadableStream({
      start(controller) {
        controller.enqueue(encoder.encode('event: message_start\n'))
        controller.enqueue(encoder.encode('data: {"type":"message_start"}\n\n'))
        controller.enqueue(encoder.encode('event: content_block_delta\n'))
        controller.enqueue(encoder.encode('data: {"type":"text_delta","text":"{"}\n\n'))
        controller.close()
      }
    })
    return new HttpResponse(stream, {
      headers: {
        'content-type': 'text/event-stream'
      }
    })
  })
]
```

## Test Data Fixtures

### Conversation Fixtures

```typescript
export const testConversations = {
  highEmotionalSalience: {
    id: 'conv_test_1',
    messages: [
      {
        id: 'msg_1',
        content: 'I am so excited about this!',
        authorId: 'user_1',
      },
      { id: 'msg_2', content: 'This is amazing news!', authorId: 'user_2' },
    ],
  },
  neutralConversation: {
    id: 'conv_test_2',
    messages: [
      { id: 'msg_3', content: 'The meeting is at 3pm', authorId: 'user_1' },
      { id: 'msg_4', content: 'Acknowledged', authorId: 'user_2' },
    ],
  },
  mixedEmotions: {
    id: 'conv_test_3',
    messages: [
      {
        id: 'msg_5',
        content: 'I am worried about the deadline',
        authorId: 'user_1',
      },
      {
        id: 'msg_6',
        content: "Don't worry, we can handle it together!",
        authorId: 'user_2',
      },
    ],
  },
}
```

### Expected Responses

```typescript
export const expectedMemories = {
  highConfidence: {
    id: 'mem_test_1',
    confidence: 0.92,
    emotionalContext: {
      primaryMood: 'positive',
      intensity: 8.5,
      themes: ['excitement', 'joy'],
    },
  },
  lowConfidence: {
    id: 'mem_test_2',
    confidence: 0.45,
    emotionalContext: {
      primaryMood: 'neutral',
      intensity: 3.0,
      themes: [],
    },
  },
}
```

## Performance Testing

### Load Testing Scenarios

- Process 100 messages in parallel batches
- Handle 1000 messages with rate limiting
- Stream processing for large responses
- Memory usage under high load
- Database connection pool management

### Performance Benchmarks

- Single message processing: <500ms
- Batch of 50 messages: <2000ms
- Prompt generation: <50ms
- Response parsing: <100ms
- Database write: <200ms

## Test Execution Strategy

### Test Suites

```json
{
  "scripts": {
    "test:unit": "vitest run src/claude/**/*.test.ts",
    "test:integration": "vitest run src/claude/**/*.integration.test.ts",
    "test:e2e": "vitest run src/claude/**/*.e2e.test.ts",
    "test:coverage": "vitest run --coverage",
    "test:watch": "vitest watch"
  }
}
```

### Coverage Requirements

- Overall coverage: >80%
- Critical paths: >90%
- Error handling: >85%
- Edge cases: >75%

### CI/CD Integration

- Run unit tests on every commit
- Run integration tests on PR
- Run full suite before merge
- Generate coverage reports
- Block merge if coverage drops below threshold

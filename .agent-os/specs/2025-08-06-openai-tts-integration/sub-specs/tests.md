# Tests Specification

This is the tests coverage details for the spec detailed in @.agent-os/specs/2025-08-06-openai-tts-integration/spec.md

> Created: 2025-08-06
> Version: 1.0.0

## Test Coverage

### Unit Tests

**OpenAIProvider**

- Successfully speaks text with default settings
- Handles all 6 voice options correctly
- Respects speed settings from 0.25 to 4.0
- Respects format options (mp3, opus, aac, flac)
- Returns cached audio when available
- Handles API key missing error
- Handles rate limit (429) responses
- Handles unauthorized (401) responses
- Handles server errors (500, 503)
- Handles network timeouts
- Validates text input (empty, too long)
- Calculates cache keys correctly

**MacOSProvider (refactored)**

- Maintains backward compatibility with existing functionality
- Implements TTSProvider interface correctly
- Returns proper SpeakResult format
- Handles platform detection (non-macOS)
- Escapes shell special characters
- Validates voice availability

**TTSProviderFactory**

- Creates OpenAI provider with valid config
- Creates macOS provider with valid config
- Auto-detects best available provider
- Validates configuration before provider creation
- Throws on invalid provider type
- Lists available providers correctly

**AudioCache**

- Stores audio files with proper metadata
- Retrieves cached audio by key
- Respects TTL expiration
- Implements LRU eviction when size exceeded
- Cleans up expired entries on startup
- Handles concurrent cache access
- Calculates cache size accurately
- Prunes old entries correctly

**RateLimiter**

- Queues requests when limit reached
- Implements exponential backoff
- Resets counter after time window
- Handles concurrent requests properly
- Respects different tier limits

**ConfigValidator (extensions)**

- Validates OpenAI configuration schema
- Validates provider selection
- Validates cache configuration
- Provides helpful error messages
- Allows environment variable references

### Integration Tests

**Provider Fallback Flow**

- Falls back from OpenAI to macOS on API error
- Falls back on rate limit exceeded
- Falls back on network timeout
- Does not fall back when disabled
- Logs fallback events properly

**Caching Integration**

- First request hits API and caches result
- Subsequent requests use cache
- Cache miss triggers new API request
- Expired cache entries are refreshed
- Cache directory is created if missing

**Configuration Loading**

- Loads OpenAI API key from environment
- Merges file config with environment variables
- Validates complete configuration
- Provides sensible defaults

**End-to-End Speech Flow**

- Notification hook uses OpenAI when configured
- Stop hook uses OpenAI when configured
- SubagentStop hook uses OpenAI when configured
- All hooks fall back to macOS when needed
- Cooldown periods work with new provider
- Quiet hours work with new provider

### Mocking Requirements

- **OpenAI API:** Mock HTTP responses for all endpoints using MSW or nock
  - Success responses with binary audio data
  - Error responses (401, 429, 500, 503)
  - Network timeout scenarios
  - Variable response times for rate limit testing

- **File System:** Mock for cache operations in unit tests
  - fs.promises.writeFile for cache writes
  - fs.promises.readFile for cache reads
  - fs.promises.stat for size calculations
  - fs.promises.unlink for cleanup

- **Audio Playback:** Mock exec() calls for macOS say command
  - Success scenarios
  - Command not found scenarios
  - Process error scenarios

- **Time:** Use fake timers for TTL and rate limit testing
  - jest.useFakeTimers() or sinon timers
  - Control time advancement for expiration
  - Test rate limit window resets

## Test Data

### Sample Text Inputs

```typescript
const TEST_TEXTS = {
  simple: 'Task completed',
  withPunctuation: 'Hello, world! How are you?',
  withNumbers: 'Found 42 errors in 3 files',
  long: 'Lorem ipsum...'.repeat(100), // For truncation testing
  empty: '',
  whitespace: '   \n\t  ',
  specialChars: 'Test $var `cmd` "quoted"',
  unicode: 'Hello 世界 🎉',
}
```

### Mock API Responses

```typescript
const MOCK_RESPONSES = {
  success: new Response(audioBuffer, {
    headers: { 'Content-Type': 'audio/mpeg' },
  }),
  unauthorized: new Response('Unauthorized', { status: 401 }),
  rateLimit: new Response('Too Many Requests', {
    status: 429,
    headers: { 'Retry-After': '60' },
  }),
  serverError: new Response('Internal Server Error', { status: 500 }),
}
```

### Configuration Fixtures

```typescript
const TEST_CONFIGS = {
  minimal: {
    provider: 'openai',
    openai: { apiKey: 'test-key' },
  },
  complete: {
    provider: 'openai',
    fallbackProvider: 'macos',
    openai: {
      apiKey: 'test-key',
      model: 'tts-1-hd',
      voice: 'nova',
      speed: 1.2,
      format: 'opus',
    },
    macos: {
      voice: 'Samantha',
      rate: 220,
    },
    cache: {
      enabled: true,
      directory: '/tmp/test-cache',
      maxSize: 10,
      ttl: 3600,
    },
  },
  invalid: {
    provider: 'unknown',
    openai: { apiKey: null },
  },
}
```

## Performance Testing

### Benchmarks to Track

- API response time (p50, p95, p99)
- Cache hit ratio
- Fallback frequency
- Memory usage with large cache
- Concurrent request handling

### Load Testing Scenarios

```typescript
describe('Performance', () => {
  it('handles 100 concurrent requests', async () => {
    const promises = Array(100)
      .fill(null)
      .map((_, i) => provider.speak(`Message ${i}`))
    const results = await Promise.all(promises)
    expect(results.filter((r) => r.success)).toHaveLength(100)
  })

  it('maintains sub-100ms cache retrieval', async () => {
    // Pre-cache the audio
    await provider.speak('Cached message')

    const start = Date.now()
    await provider.speak('Cached message')
    const duration = Date.now() - start

    expect(duration).toBeLessThan(100)
  })
})
```

## Test Environment Setup

### Required Environment Variables

```bash
# For integration tests
OPENAI_API_KEY=test-key-123
OPENAI_TEST_MODE=true

# For E2E tests
TEST_REAL_API=false  # Set to true for real API tests
TEST_CACHE_DIR=/tmp/test-tts-cache
```

### Test Helpers

```typescript
// Helper to create test provider
export function createTestProvider(
  config?: Partial<ProviderConfig>,
): TTSProvider {
  return TTSProviderFactory.create('openai', {
    apiKey: 'test-key',
    ...config,
  })
}

// Helper to mock API responses
export function mockOpenAIResponse(
  response: 'success' | 'error',
  options?: MockOptions,
): void {
  // MSW or nock setup
}

// Helper to verify cache state
export async function verifyCacheState(
  cacheDir: string,
  expectedFiles: number,
): Promise<void> {
  const files = await fs.readdir(cacheDir)
  expect(files).toHaveLength(expectedFiles)
}
```

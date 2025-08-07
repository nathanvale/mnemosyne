# Technical Specification

This is the technical specification for the spec detailed in @.agent-os/specs/2025-08-06-openai-tts-integration/spec.md

> Created: 2025-08-06
> Version: 1.0.0

## Technical Requirements

### Provider Abstraction Architecture

- Create `TTSProvider` interface for all speech providers
- Implement provider factory pattern for provider selection
- Support runtime provider switching
- Handle provider-specific configuration
- Implement async/await patterns for API calls

### OpenAI TTS Integration

- Use OpenAI Node.js SDK (v4.x)
- Support both `tts-1` and `tts-1-hd` models
- Implement all 6 voices: alloy, echo, fable, onyx, nova, shimmer
- Speed control from 0.25 to 4.0
- Response format: mp3 (default), opus, aac, flac
- Proper error handling for API failures
- Rate limiting awareness

### Fallback Mechanism

- Automatic fallback on API errors (401, 429, 500, network errors)
- Configurable fallback behavior (automatic, manual, disabled)
- Fallback logging for debugging
- Graceful degradation of features
- Provider health checking

### Configuration Schema Updates

```typescript
interface SpeechConfig {
  enabled?: boolean
  provider?: 'openai' | 'macos' | 'auto'
  fallbackProvider?: 'macos' | 'none'

  openai?: {
    apiKey?: string // Can use env var OPENAI_API_KEY
    model?: 'tts-1' | 'tts-1-hd'
    voice?: 'alloy' | 'echo' | 'fable' | 'onyx' | 'nova' | 'shimmer'
    speed?: number // 0.25 to 4.0
    format?: 'mp3' | 'opus' | 'aac' | 'flac'
  }

  macos?: {
    voice?: string
    rate?: number
    volume?: number
  }

  cache?: {
    enabled?: boolean
    directory?: string
    maxSize?: number // MB
    ttl?: number // seconds
  }
}
```

### Audio Caching Strategy

- Cache key: hash of (text + voice + speed + model)
- Store as temporary audio files
- LRU cache with configurable size limit
- TTL-based expiration
- Cleanup on startup

## Approach Options

**Option A:** Direct Integration (Selected)

- Pros: Simpler implementation, fewer dependencies, faster to implement
- Cons: Less extensible for future providers
- Rationale: Can refactor later if more providers needed

**Option B:** Plugin Architecture

- Pros: Very extensible, clean separation
- Cons: Over-engineering for just 2 providers, more complex

**Option C:** Monolithic Update

- Pros: Minimal changes to existing code
- Cons: Hard to maintain, no extensibility

**Rationale:** Option A selected because it provides good balance between simplicity and extensibility. The provider abstraction is enough for current needs without over-engineering.

## External Dependencies

- **openai (^4.0.0)** - Official OpenAI Node.js SDK
  - Justification: Required for OpenAI API access
- **node-cache (^5.1.2)** - Simple caching library
  - Justification: For audio file caching logic
- **crypto** - Built-in Node.js module
  - Justification: For generating cache keys

## Implementation Details

### File Structure

```
src/speech/
├── providers/
│   ├── base-provider.ts       # Abstract base class
│   ├── openai-provider.ts     # OpenAI implementation
│   ├── macos-provider.ts      # Refactored say command
│   └── provider-factory.ts    # Provider selection logic
├── cache/
│   ├── audio-cache.ts         # Caching implementation
│   └── cache-manager.ts       # Cache lifecycle
├── speech-engine.ts           # Updated main engine
└── index.ts
```

### Error Handling Strategy

- Wrap all OpenAI calls in try-catch
- Implement exponential backoff for rate limits
- Log errors with context for debugging
- Return success/failure status to caller
- Never throw unhandled exceptions

### Security Considerations

- API keys only via environment variables or secure config
- Never log API keys
- Sanitize text input before sending to API
- Validate all configuration inputs
- Secure temporary file permissions for cached audio

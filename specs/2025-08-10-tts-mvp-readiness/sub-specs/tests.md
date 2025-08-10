# Tests Specification

This is the tests coverage details for the spec detailed in @specs/2025-08-10-tts-mvp-readiness/spec.md

> Created: 2025-08-10
> Version: 1.0.0

## Test Coverage

### Unit Tests

**Environment Variable Mapping**

- Test ELEVENLABS_VOICE_ID populates tts.elevenlabs.voiceId
- Test ELEVENLABS_MODEL_ID populates tts.elevenlabs.modelId
- Test both old and new variable names work
- Test precedence when both are set
- Test other ElevenLabs variables still work

**Audio Cache Configuration**

- Test maxSizeMB converts to maxSizeBytes correctly
- Test maxAgeDays converts to maxAgeMs correctly
- Test maxEntries passes through unchanged
- Test cache instantiation with custom configuration
- Test default values when not configured

**Cache File Extensions**

- Test mp3 format saves as .mp3
- Test opus format saves as .opus
- Test pcm formats save as .wav
- Test ulaw/alaw formats save as .wav
- Test backward compatibility reading .mp3 for non-mp3 formats
- Test extension stored in metadata

**Cache Hit Identification**

- Test cached flag is true when serving from cache
- Test cached flag is false when generating fresh
- Test duration omitted for cached results
- Test duration present for fresh generation

**Provider Validation**

- Test ElevenLabs throws when voiceId missing
- Test error message is descriptive
- Test OpenAI validates API key
- Test validation happens at construction time

### Integration Tests

**End-to-End Environment Configuration**

- Load configuration from actual .env file
- Verify ElevenLabs provider receives correct values
- Test audio cache respects configured limits
- Test provider selection with various configurations

**Cache Behavior with Real Providers**

- Generate audio and verify correct extension saved
- Retrieve cached audio and verify cached flag
- Test cache eviction at configured limits
- Test cache expiry after configured age

**Provider Factory with Configuration**

- Test factory creates providers with injected cache
- Test auto-detection with proper configuration
- Test fallback chain with missing configuration

### Mocking Requirements

**File System Mocks**

- Mock fs.promises for cache file operations
- Mock tmpdir() for test isolation
- Provide test fixtures for legacy .mp3 files

**Provider Mocks**

- Mock API calls for unit tests
- Provide sample audio buffers
- Mock provider construction for validation tests

**Environment Mocks**

- Mock process.env for configuration tests
- Reset environment between tests
- Test with various configuration combinations

## Test File Structure

```
packages/claude-hooks/src/
├── config/__tests__/
│   ├── env-config.test.ts (UPDATE)
│   └── env-alias.test.ts (NEW)
├── speech/providers/__tests__/
│   ├── audio-cache.test.ts (UPDATE)
│   ├── cache-extension.test.ts (NEW)
│   ├── cache-flag.test.ts (NEW)
│   ├── elevenlabs-provider.test.ts (UPDATE)
│   ├── openai-provider.test.ts (UPDATE)
│   └── provider-factory.test.ts (UPDATE)
└── __tests__/integration/
    └── tts-configuration.test.ts (NEW)
```

## Test Data

### Sample Configurations

```typescript
const testConfigs = {
  minimalValid: {
    ELEVENLABS_API_KEY: 'test-key',
    ELEVENLABS_VOICE_ID: 'test-voice',
  },
  fullConfig: {
    ELEVENLABS_API_KEY: 'test-key',
    ELEVENLABS_VOICE_ID: 'test-voice',
    ELEVENLABS_MODEL_ID: 'test-model',
    CLAUDE_HOOKS_AUDIO_CACHE_ENABLED: 'true',
    CLAUDE_HOOKS_AUDIO_CACHE_MAX_SIZE_MB: '100',
    CLAUDE_HOOKS_AUDIO_CACHE_MAX_AGE_DAYS: '7',
    CLAUDE_HOOKS_AUDIO_CACHE_MAX_ENTRIES: '50',
  },
  legacyConfig: {
    CLAUDE_HOOKS_ELEVENLABS_VOICE_ID: 'old-voice',
    CLAUDE_HOOKS_ELEVENLABS_MODEL_ID: 'old-model',
  },
}
```

### Sample Audio Formats

```typescript
const testFormats = [
  { format: 'mp3_44100_128', extension: '.mp3' },
  { format: 'opus_48000', extension: '.opus' },
  { format: 'pcm_16000', extension: '.wav' },
  { format: 'ulaw_8000', extension: '.wav' },
  { format: 'alaw_8000', extension: '.wav' },
]
```

## Performance Tests

- Measure cache hit vs miss performance
- Test cache lookup time with many entries
- Verify minimal overhead for extension mapping
- Test configuration validation startup time

## Regression Tests

- Ensure existing configurations still work
- Test that current cache entries are still readable
- Verify no breaking changes to public API
- Test backward compatibility scenarios

## Acceptance Criteria

- All unit tests pass with 100% coverage of changed code
- Integration tests verify end-to-end functionality
- No regression in existing functionality
- Performance impact is negligible (<5ms added latency)
- All documented scenarios work as expected

# Technical Specification

This is the technical specification for the spec detailed in @specs/2025-08-10-tts-mvp-readiness/spec.md

> Created: 2025-08-10
> Version: 1.0.0

## Technical Requirements

### Environment Variable Fixes

- Add dual mapping support for ElevenLabs environment variables
- Support both `ELEVENLABS_VOICE_ID` and `CLAUDE_HOOKS_ELEVENLABS_VOICE_ID`
- Support both `ELEVENLABS_MODEL_ID` and `CLAUDE_HOOKS_ELEVENLABS_MODEL_ID`
- Maintain backward compatibility with existing configurations

### Audio Cache Configuration

- Fix configuration path mappings in env-config.ts
- Create factory function to instantiate AudioCache with user configuration
- Update provider constructors to accept optional cache instance
- Ensure cache configuration values are properly converted (MB to bytes, days to ms)

### Cache File Extension Handling

- Implement format-to-extension mapping:
  - mp3\_\* formats → .mp3
  - opus\_\* formats → .opus
  - pcm*\*, ulaw*_, alaw\__ formats → .wav
- Store extension in cache entry metadata
- Implement backward compatibility for legacy .mp3 entries
- Update all file I/O operations to use correct extensions

### Cache Hit Identification

- Add `cached: boolean` field to SpeakResult
- Set `cached: true` when serving from cache
- Set `cached: false` or omit when generating fresh audio
- Remove inaccurate duration calculation for cached results

### Provider Validation

- Add constructor-time validation for ElevenLabs voiceId
- Throw descriptive errors for missing required configuration
- Add debug logging for configuration issues
- Validate API keys when providers are selected

## Approach Options

**Option A: Minimal Changes**

- Pros: Less risk of breaking existing functionality
- Cons: Doesn't fully address architectural issues

**Option B: Comprehensive Refactor** (Selected)

- Pros: Fixes root causes, improves maintainability
- Cons: More extensive changes required

**Rationale:** Option B selected because the issues are fundamental configuration problems that require proper fixes rather than workarounds.

## Implementation Details

### Environment Variable Mapping

```typescript
// Add to env-config.ts
{
  envVar: 'ELEVENLABS_VOICE_ID',
  configPath: 'tts.elevenlabs.voiceId',
  type: 'string',
},
{
  envVar: 'ELEVENLABS_MODEL_ID',
  configPath: 'tts.elevenlabs.modelId',
  type: 'string',
},
```

### Audio Cache Factory

```typescript
export function createAudioCacheFromConfig(
  config: AudioCacheConfig,
): AudioCache {
  return new AudioCache({
    maxSizeBytes: config.maxSizeMB * 1024 * 1024,
    maxAgeMs: config.maxAgeDays * 24 * 60 * 60 * 1000,
    maxEntries: config.maxEntries,
    enabled: config.enabled,
    cacheDir: config.cacheDir,
    normalization: config.normalization,
  })
}
```

### Extension Mapping

```typescript
function getAudioExtension(format?: string): string {
  if (!format) return '.mp3'

  if (format.startsWith('mp3')) return '.mp3'
  if (format.startsWith('opus')) return '.opus'
  if (
    format.startsWith('pcm') ||
    format.startsWith('ulaw') ||
    format.startsWith('alaw')
  ) {
    return '.wav'
  }

  return '.mp3' // default fallback
}
```

## External Dependencies

No new external dependencies required. All fixes use existing packages.

## Performance Considerations

- Cache backward compatibility check adds minimal overhead (one extra file check on cache miss)
- Extension mapping is a simple string operation with negligible performance impact
- Configuration validation happens once at startup

## Security Considerations

- Change ElevenLabs `enableLogging` default to false for privacy
- Add documentation about data retention implications
- Ensure API keys are not logged even in debug mode

## Migration Strategy

1. Support both old and new environment variable names for one release cycle
2. Log deprecation warnings for old variable names
3. Maintain backward compatibility for cached .mp3 files
4. Document migration path in CHANGELOG

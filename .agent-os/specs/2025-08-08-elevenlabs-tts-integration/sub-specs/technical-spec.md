# Technical Specification

This is the technical specification for the spec detailed in @.agent-os/specs/2025-08-08-elevenlabs-tts-integration/spec.md

> Created: 2025-08-08  
> Version: 1.0.0

## Technical Requirements

**ElevenLabs API Integration**:

- REST API v1 endpoint integration (https://api.elevenlabs.io/v1)
- Authentication via API key in headers (xi-api-key)
- Support for both synchronous and streaming endpoints
- Rate limiting compliance with retry logic

**Provider Architecture**:

- ElevenLabsProvider class extending BaseTTSProvider abstract class
- Implementation of required methods: speak(), isAvailable(), getProviderInfo()
- Optional methods: getVoices(), preloadAudio(), cancelSpeech()
- Integration with existing TTSProviderFactory registration system

**Voice Configuration**:

- Support for pre-built voice IDs (21+ default voices)
- Custom voice ID support for user-created voices
- Voice settings object with stability (0-1), similarity_boost (0-1), style parameters
- Model selection: eleven_multilingual_v2, eleven_flash_v2, eleven_turbo_v2

**Audio Generation**:

- Text-to-speech endpoint: POST /v1/text-to-speech/{voice_id}
- Streaming endpoint: POST /v1/text-to-speech/{voice_id}/stream
- Chunked response handling for streaming audio
- Support for text up to 5,000 characters per request

**Output Formats**:

- MP3: 22.05kHz-44.1kHz, 32-192kbps
- Opus: 48kHz, 32-192kbps
- PCM (S16LE): 16-48kHz, 16-bit depth
- μ-law/A-law: 8kHz for telephony
- AAC, FLAC for high-quality applications

## Approach Options

**SDK vs Direct API** (Selected)

- **Direct API implementation with fetch**
- Pros: Lighter weight, full control, no additional dependencies
- Cons: More implementation work, manual type definitions
- **Rationale**: Aligns with existing provider pattern using direct API calls

**Alternative: ElevenLabs JavaScript SDK**

- Pros: Type-safe, maintained by ElevenLabs, easier implementation
- Cons: Additional dependency, potential version conflicts
- **Decision**: May reconsider if direct implementation proves complex

**Streaming Strategy** (Selected)

- **Server-sent events (SSE) for streaming**
- Pros: Real-time chunks, standard protocol, good browser support
- Cons: More complex implementation than simple requests
- **Rationale**: Required for low-latency applications

**Caching Approach** (Selected)

- **Local file cache with SHA-256 hash keys**
- Pros: Reduces API calls, improves response time, cost savings
- Cons: Disk space usage, cache invalidation complexity
- **Rationale**: Reuse existing AudioCache implementation

## External Dependencies

**node-fetch** or native fetch - HTTP client for API requests

- **Purpose**: Making HTTP requests to ElevenLabs API
- **Justification**: Lightweight, standard API, already used in project

**OpenAI** (existing) - For type definitions reference

- **Purpose**: Reference implementation for provider pattern
- **Justification**: Maintain consistency with existing providers

## API Integration Details

**Authentication**:

```typescript
headers: {
  'xi-api-key': process.env.ELEVENLABS_API_KEY,
  'Content-Type': 'application/json'
}
```

**Text-to-Speech Request**:

```typescript
{
  text: string,
  model_id: string,
  voice_settings: {
    stability: number,
    similarity_boost: number,
    style?: number,
    use_speaker_boost?: boolean
  },
  output_format?: string,
  speed?: number
}
```

**Streaming Response**:

- Content-Type: audio/mpeg (or specified format)
- Transfer-Encoding: chunked
- Chunks arrive as binary data

**Error Responses**:

- 401: Invalid API key
- 422: Invalid request parameters
- 429: Rate limit exceeded
- 500: Server error

## Configuration Schema

```typescript
interface ElevenLabsConfig extends TTSProviderConfig {
  apiKey?: string // API key (falls back to env var)
  voiceId?: string // Default voice ID
  model?: string // Model selection
  outputFormat?: string // Audio format
  voiceSettings?: {
    stability?: number // 0-1 range
    similarity_boost?: number // 0-1 range
    style?: number // 0-1 range
    use_speaker_boost?: boolean
  }
  streaming?: boolean // Use streaming endpoint
  cacheEnabled?: boolean // Enable audio caching
  cacheTTL?: number // Cache time-to-live in seconds
}
```

## Rate Limiting

**Limits by Plan**:

- Free: 10,000 characters/month, 3 requests/second
- Starter: 30,000 characters/month, 5 requests/second
- Creator: 100,000 characters/month, 10 requests/second
- Pro+: Higher limits with custom rates

**Implementation**:

- Track request timestamps
- Implement exponential backoff on 429 responses
- Queue requests if approaching rate limit
- Respect Retry-After headers

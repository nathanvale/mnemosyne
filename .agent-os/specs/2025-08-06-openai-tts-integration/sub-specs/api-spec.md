# API Specification

This is the API specification for the spec detailed in @.agent-os/specs/2025-08-06-openai-tts-integration/spec.md

> Created: 2025-08-06
> Version: 1.0.0

## API Endpoints

This spec doesn't introduce new API endpoints. Instead, it integrates with the OpenAI TTS API as a client.

## External API Integration

### OpenAI Text-to-Speech API

**Endpoint:** `https://api.openai.com/v1/audio/speech`

**Method:** POST

**Headers:**

- `Authorization: Bearer ${OPENAI_API_KEY}`
- `Content-Type: application/json`

**Request Body:**

```json
{
  "model": "tts-1" | "tts-1-hd",
  "input": "The text to synthesize",
  "voice": "alloy" | "echo" | "fable" | "onyx" | "nova" | "shimmer",
  "response_format": "mp3" | "opus" | "aac" | "flac",
  "speed": 0.25 to 4.0
}
```

**Response:** Binary audio data in the requested format

**Error Responses:**

- `401 Unauthorized` - Invalid API key
- `429 Too Many Requests` - Rate limit exceeded
- `500 Internal Server Error` - OpenAI service error
- `503 Service Unavailable` - Service temporarily unavailable

## Internal API Design

### TTSProvider Interface

```typescript
interface TTSProvider {
  // Core methods
  speak(text: string): Promise<SpeakResult>
  isAvailable(): Promise<boolean>
  getProviderName(): string

  // Configuration
  configure(options: TTSProviderOptions): void
  getConfiguration(): TTSProviderOptions

  // Optional features
  getVoices?(): Promise<Voice[]>
  preloadAudio?(text: string): Promise<void>
  cancelSpeech?(): void
}

interface SpeakResult {
  success: boolean
  provider: string
  cached?: boolean
  duration?: number
  error?: string
}

interface TTSProviderOptions {
  [key: string]: unknown
}
```

### Provider Factory API

```typescript
class TTSProviderFactory {
  static create(
    provider: 'openai' | 'macos' | 'auto',
    config: ProviderConfig,
  ): TTSProvider

  static getAvailableProviders(): string[]

  static async detectBestProvider(config: ProviderConfig): Promise<TTSProvider>
}
```

### Cache Manager API

```typescript
interface CacheManager {
  get(key: string): Promise<AudioFile | null>
  set(key: string, audioData: Buffer): Promise<void>
  has(key: string): Promise<boolean>
  clear(): Promise<void>
  getSize(): Promise<number>
  prune(): Promise<void>
}

interface AudioFile {
  path: string
  format: string
  size: number
  createdAt: Date
  lastUsed: Date
  hitCount: number
}
```

## Rate Limiting

### OpenAI Rate Limits

- **Default tier:** 3 requests per minute
- **Tier 1:** 50 requests per minute
- **Tier 2:** 100 requests per minute
- **Tier 3:** 200 requests per minute
- **Tier 4:** 500 requests per minute

### Implementation Strategy

```typescript
class RateLimiter {
  private requestQueue: Request[]
  private currentRequests: number
  private resetTime: Date

  async throttle<T>(request: () => Promise<T>): Promise<T>

  private async waitForSlot(): Promise<void>
  private calculateBackoff(attempt: number): number
}
```

## Error Handling

### Error Types

```typescript
enum TTSErrorType {
  PROVIDER_UNAVAILABLE = 'PROVIDER_UNAVAILABLE',
  API_ERROR = 'API_ERROR',
  RATE_LIMIT = 'RATE_LIMIT',
  INVALID_CONFIG = 'INVALID_CONFIG',
  NETWORK_ERROR = 'NETWORK_ERROR',
  AUDIO_PLAYBACK_ERROR = 'AUDIO_PLAYBACK_ERROR',
}

class TTSError extends Error {
  constructor(
    public type: TTSErrorType,
    public message: string,
    public provider: string,
    public originalError?: Error,
    public canFallback: boolean = true,
  ) {
    super(message)
  }
}
```

### Fallback Logic

```typescript
async function speakWithFallback(
  text: string,
  primaryProvider: TTSProvider,
  fallbackProvider: TTSProvider,
): Promise<SpeakResult> {
  try {
    const result = await primaryProvider.speak(text)
    if (result.success) return result
  } catch (error) {
    if (error instanceof TTSError && !error.canFallback) {
      throw error
    }
  }

  // Try fallback
  return fallbackProvider.speak(text)
}
```

## Usage Examples

### Basic Usage

```typescript
import { TTSProviderFactory } from '@studio/claude-hooks'

const provider = TTSProviderFactory.create('openai', {
  apiKey: process.env.OPENAI_API_KEY,
  model: 'tts-1',
  voice: 'nova',
})

await provider.speak('Task completed successfully!')
```

### With Fallback

```typescript
const provider = TTSProviderFactory.create('auto', {
  openai: {
    apiKey: process.env.OPENAI_API_KEY,
  },
  fallback: 'macos',
})

const result = await provider.speak('Hello world')
console.log(`Speech delivered via: ${result.provider}`)
```

### With Caching

```typescript
const provider = TTSProviderFactory.create('openai', {
  apiKey: process.env.OPENAI_API_KEY,
  cache: {
    enabled: true,
    directory: '/tmp/tts-cache',
    maxSize: 100, // MB
  },
})

// First call - hits API
await provider.speak('Frequently used message')

// Second call - uses cache
await provider.speak('Frequently used message')
```

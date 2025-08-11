# Programmatic Usage Guide

## Overview

This guide shows how to use Claude Hooks TTS programmatically in your applications with TypeScript examples and best practices.

## Basic Usage

### Simple TTS with Auto Provider Selection

```typescript
import { createTTSProvider } from '@studio/claude-hooks/speech'

// Auto-select best available provider
const provider = createTTSProvider({
  provider: 'auto',
  fallbackProvider: 'macos',
})

// Speak text
const result = await provider.speak('Hello, world!')
if (result.success) {
  console.log('✅ Speech completed successfully')
} else {
  console.error('❌ Speech failed:', result.error)
}
```

### Provider-Specific Usage

#### macOS TTS

```typescript
import { MacOSProvider } from '@studio/claude-hooks/speech'

const provider = new MacOSProvider({
  voice: 'Alex',
  rate: 200, // Words per minute
  volume: 0.8, // 0.0 to 1.0
  enabled: true,
})

// Non-blocking speech (continues after function returns)
await provider.speak('Processing your request...', { detached: true })

// Blocking speech (waits for completion)
const result = await provider.speak('Task completed!')
```

#### OpenAI TTS

```typescript
import { OpenAIProvider } from '@studio/claude-hooks/speech'

const provider = new OpenAIProvider({
  apiKey: process.env.OPENAI_API_KEY,
  model: 'tts-1-hd', // 'tts-1' for speed, 'tts-1-hd' for quality
  voice: 'nova', // alloy, echo, fable, onyx, nova, shimmer
  speed: 1.0, // 0.25 to 4.0
  format: 'mp3', // mp3, opus, aac, flac
  audioCache: {
    enabled: true,
    maxSizeMB: 100,
    maxAgeDays: 30,
  },
})

// Check if provider is available
if (await provider.isAvailable()) {
  const result = await provider.speak('Hello from OpenAI!')
  console.log('Duration:', result.data?.duration, 'seconds')
}
```

#### ElevenLabs TTS

```typescript
import { ElevenLabsProvider } from '@studio/claude-hooks/speech'

const provider = new ElevenLabsProvider({
  apiKey: process.env.ELEVENLABS_API_KEY,
  voiceId: 'pNInz6obpgDQGcFmaJgB', // Rachel voice
  modelId: 'eleven_multilingual_v2',
  outputFormat: 'mp3_44100_128',
  stability: 0.5, // 0.0 to 1.0
  similarityBoost: 0.75, // 0.0 to 1.0
  speed: 1.0, // 0.5 to 2.0
  enableLogging: true,
})

const result = await provider.speak('Premium quality voice from ElevenLabs!')
```

## Advanced Configurations

### Multi-Provider Setup with Fallbacks

```typescript
import { TTSManager } from '@studio/claude-hooks/speech'

const ttsManager = new TTSManager({
  primary: new OpenAIProvider({
    apiKey: process.env.OPENAI_API_KEY,
    voice: 'alloy',
  }),
  fallbacks: [
    new MacOSProvider({ voice: 'Alex' }),
    new ElevenLabsProvider({
      apiKey: process.env.ELEVENLABS_API_KEY,
      voiceId: 'default-voice-id',
    }),
  ],
})

// Automatically tries providers in order until one succeeds
const result = await ttsManager.speak('Hello with automatic fallback!')
```

### Environment-Based Configuration

```typescript
import { loadTTSConfig } from '@studio/claude-hooks/config'

// Load configuration from environment variables and config files
const config = await loadTTSConfig()

const provider =
  config.provider === 'openai'
    ? new OpenAIProvider(config.openai)
    : config.provider === 'elevenlabs'
      ? new ElevenLabsProvider(config.elevenlabs)
      : new MacOSProvider(config.macos)

// Use environment-specific provider
await provider.speak('Configuration loaded from environment!')
```

### Batch Processing

```typescript
import { OpenAIProvider } from '@studio/claude-hooks/speech'

const provider = new OpenAIProvider({
  apiKey: process.env.OPENAI_API_KEY,
  audioCache: { enabled: true }, // Important for batch processing
})

const messages = [
  'Processing item 1...',
  'Processing item 2...',
  'Processing item 3...',
  'All items completed!',
]

// Sequential processing
for (const message of messages) {
  const result = await provider.speak(message)
  if (!result.success) {
    console.error('Failed:', message, result.error)
    break
  }
  // Small delay between items
  await new Promise((resolve) => setTimeout(resolve, 500))
}

// Parallel processing (cache-friendly)
const results = await Promise.allSettled(
  messages.map((message) => provider.speak(message)),
)

results.forEach((result, index) => {
  if (result.status === 'fulfilled' && result.value.success) {
    console.log(`✅ Message ${index + 1} completed`)
  } else {
    console.error(`❌ Message ${index + 1} failed`)
  }
})
```

### Long Text Handling

```typescript
function splitText(text: string, maxLength: number = 4000): string[] {
  // Split on sentence boundaries when possible
  const sentences = text.match(/[^\.!?]+[\.!?]+/g) || [text]
  const chunks: string[] = []
  let currentChunk = ''

  for (const sentence of sentences) {
    if ((currentChunk + sentence).length > maxLength) {
      if (currentChunk) {
        chunks.push(currentChunk.trim())
        currentChunk = sentence
      } else {
        // Sentence itself is too long, force split
        chunks.push(sentence.substring(0, maxLength))
        currentChunk = sentence.substring(maxLength)
      }
    } else {
      currentChunk += sentence
    }
  }

  if (currentChunk) {
    chunks.push(currentChunk.trim())
  }

  return chunks
}

// Usage with long text
const longText = 'Very long article content here...'
const chunks = splitText(longText, 4000) // OpenAI limit

for (const chunk of chunks) {
  await provider.speak(chunk)
  // Optional pause between chunks
  await new Promise((resolve) => setTimeout(resolve, 1000))
}
```

## Audio Caching

### Cache Configuration

```typescript
import { AudioCache } from '@studio/claude-hooks/speech'

const cache = new AudioCache({
  maxSizeMB: 50, // 50MB cache limit
  maxAgeMs: 7 * 24 * 60 * 60 * 1000, // 7 days
  maxEntries: 100, // Maximum cached items
  enabled: true,
  normalization: {
    caseSensitive: false, // "Hello" = "hello"
    stripPriorityPrefixes: true, // Remove "high priority:" prefixes
    normalizeWhitespace: true, // Normalize spaces and newlines
  },
})

// Use cache with provider
const provider = new OpenAIProvider({
  apiKey: process.env.OPENAI_API_KEY,
  audioCache: cache,
})
```

### Manual Cache Management

```typescript
import { AudioCache } from '@studio/claude-hooks/speech'

const cache = new AudioCache()

// Generate cache key manually
const cacheKey = await cache.generateKey(
  'openai', // provider
  'Hello world', // text
  'tts-1', // model
  'alloy', // voice
  1.0, // speed
  'mp3', // format
)

// Check if cached
const cachedEntry = await cache.get(cacheKey)
if (cachedEntry) {
  console.log('Cache hit! Audio size:', cachedEntry.data.length)
} else {
  console.log('Cache miss - will generate new audio')
}

// Get cache statistics
const stats = await cache.getStats()
console.log('Cache stats:', {
  entries: stats.entryCount,
  sizeMB: Math.round(stats.totalSize / 1024 / 1024),
  hitRate: Math.round(stats.hitRate * 100) + '%',
})

// Clean up cache
await cache.cleanup()
```

## Voice Management

### Voice Discovery

```typescript
import { getAllVoices, getVoicesForProvider } from '@studio/claude-hooks/speech'

// Get all voices from all providers
const allVoices = await getAllVoices({
  openaiApiKey: process.env.OPENAI_API_KEY,
  elevenLabsApiKey: process.env.ELEVENLABS_API_KEY,
})

console.log('Available voices:')
Object.entries(allVoices).forEach(([provider, voices]) => {
  console.log(`${provider}: ${voices.length} voices`)
  voices.forEach((voice) => {
    console.log(`  - ${voice.id} (${voice.language}, ${voice.gender})`)
  })
})

// Get voices from specific provider
const openaiVoices = await getVoicesForProvider('openai')
const femaleVoices = openaiVoices.filter((v) => v.gender === 'female')
```

### Voice Selection Logic

```typescript
function selectVoice(
  voices: Voice[],
  preferences: {
    gender?: 'male' | 'female' | 'neutral'
    language?: string
    description?: string
  },
): Voice | null {
  let candidates = voices

  // Filter by gender
  if (preferences.gender) {
    candidates = candidates.filter((v) => v.gender === preferences.gender)
  }

  // Filter by language
  if (preferences.language) {
    candidates = candidates.filter((v) =>
      v.language.startsWith(preferences.language),
    )
  }

  // Search in description
  if (preferences.description) {
    candidates = candidates.filter((v) =>
      v.description
        ?.toLowerCase()
        .includes(preferences.description!.toLowerCase()),
    )
  }

  // Return first match or null
  return candidates[0] || null
}

// Usage
const voices = await getVoicesForProvider('openai')
const voice = selectVoice(voices, {
  gender: 'female',
  description: 'friendly',
})

if (voice) {
  const provider = new OpenAIProvider({
    apiKey: process.env.OPENAI_API_KEY,
    voice: voice.id as any, // Type assertion needed
  })
}
```

## Error Handling

### Comprehensive Error Handling

```typescript
import {
  TTSError,
  isRateLimitError,
  isNetworkError,
} from '@studio/claude-hooks/speech'

async function robustSpeak(provider: any, text: string, maxRetries = 3) {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const result = await provider.speak(text)

      if (result.success) {
        return result
      }

      // Handle different error types
      if (isRateLimitError(result.error)) {
        console.log(
          `Rate limited, waiting before retry ${attempt}/${maxRetries}`,
        )
        await new Promise((resolve) => setTimeout(resolve, 1000 * attempt))
        continue
      }

      if (isNetworkError(result.error)) {
        console.log(`Network error, retrying ${attempt}/${maxRetries}`)
        await new Promise((resolve) => setTimeout(resolve, 500))
        continue
      }

      // Non-retryable error
      console.error('TTS failed:', result.error)
      return result
    } catch (error) {
      console.error(`Attempt ${attempt} failed:`, error)

      if (attempt === maxRetries) {
        return {
          success: false,
          error: `Failed after ${maxRetries} attempts: ${error}`,
        }
      }

      // Wait before retry
      await new Promise((resolve) => setTimeout(resolve, 1000))
    }
  }
}

// Usage
const result = await robustSpeak(provider, 'Hello with error handling!')
```

### Provider Health Checking

```typescript
async function checkProviderHealth(provider: any): Promise<{
  available: boolean
  latency?: number
  error?: string
}> {
  const startTime = Date.now()

  try {
    // Check basic availability
    const isAvailable = await provider.isAvailable()
    if (!isAvailable) {
      return { available: false, error: 'Provider not available' }
    }

    // Test with short phrase
    const testResult = await provider.speak('Test', { detached: true })
    const latency = Date.now() - startTime

    if (testResult.success) {
      return { available: true, latency }
    } else {
      return { available: false, error: testResult.error }
    }
  } catch (error) {
    return {
      available: false,
      error: `Health check failed: ${error}`,
    }
  }
}

// Usage
const health = await checkProviderHealth(provider)
if (health.available) {
  console.log(`✅ Provider healthy (${health.latency}ms latency)`)
} else {
  console.log(`❌ Provider unhealthy: ${health.error}`)
}
```

## Integration Patterns

### React Hook

```typescript
import { useState, useCallback } from 'react'
import { OpenAIProvider } from '@studio/claude-hooks/speech'

export function useTTS(config: OpenAIConfig) {
  const [provider] = useState(() => new OpenAIProvider(config))
  const [speaking, setSpeaking] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const speak = useCallback(async (text: string) => {
    if (speaking) return

    setSpeaking(true)
    setError(null)

    try {
      const result = await provider.speak(text)
      if (!result.success) {
        setError(result.error)
      }
    } catch (err) {
      setError(`TTS error: ${err}`)
    } finally {
      setSpeaking(false)
    }
  }, [provider, speaking])

  return { speak, speaking, error }
}

// Usage in component
function MyComponent() {
  const { speak, speaking, error } = useTTS({
    apiKey: process.env.OPENAI_API_KEY!,
    voice: 'alloy'
  })

  return (
    <div>
      <button
        onClick={() => speak('Hello from React!')}
        disabled={speaking}
      >
        {speaking ? 'Speaking...' : 'Speak'}
      </button>
      {error && <p style={{color: 'red'}}>{error}</p>}
    </div>
  )
}
```

### Express.js Middleware

```typescript
import express from 'express'
import { OpenAIProvider } from '@studio/claude-hooks/speech'

const app = express()
const ttsProvider = new OpenAIProvider({
  apiKey: process.env.OPENAI_API_KEY!,
})

app.use(express.json())

// TTS endpoint
app.post('/api/speak', async (req, res) => {
  const { text, voice = 'alloy', format = 'mp3' } = req.body

  if (!text) {
    return res.status(400).json({ error: 'Text is required' })
  }

  try {
    // Configure provider for this request
    ttsProvider.configure({ voice, format })

    const result = await ttsProvider.speak(text)

    if (result.success) {
      res.json({
        success: true,
        duration: result.data?.duration,
        message: 'Audio generated and played successfully',
      })
    } else {
      res.status(500).json({
        success: false,
        error: result.error,
      })
    }
  } catch (error) {
    res.status(500).json({
      success: false,
      error: `TTS failed: ${error}`,
    })
  }
})

app.listen(3000, () => {
  console.log('TTS API server running on port 3000')
})
```

## TypeScript Integration

### Type-Safe Configuration

```typescript
import type {
  TTSConfig,
  OpenAIConfig,
  ElevenLabsConfig,
  MacOSConfig,
  Voice,
  SpeakResult,
} from '@studio/claude-hooks/speech'

// Type-safe configuration builder
class TTSConfigBuilder {
  private config: Partial<TTSConfig> = {}

  provider(provider: TTSConfig['provider']): this {
    this.config.provider = provider
    return this
  }

  openai(config: OpenAIConfig): this {
    this.config.openai = config
    return this
  }

  elevenlabs(config: ElevenLabsConfig): this {
    this.config.elevenlabs = config
    return this
  }

  macos(config: MacOSConfig): this {
    this.config.macos = config
    return this
  }

  build(): TTSConfig {
    if (!this.config.provider) {
      throw new Error('Provider must be specified')
    }
    return this.config as TTSConfig
  }
}

// Usage
const config = new TTSConfigBuilder()
  .provider('openai')
  .openai({
    apiKey: process.env.OPENAI_API_KEY!,
    voice: 'alloy',
    model: 'tts-1-hd',
  })
  .build()
```

### Custom Provider Interface

```typescript
import type {
  TTSProvider,
  SpeakResult,
  Voice,
  TTSProviderInfo,
} from '@studio/claude-hooks/speech'

class CustomTTSProvider implements TTSProvider {
  async speak(
    text: string,
    options?: { detached?: boolean },
  ): Promise<SpeakResult> {
    // Custom implementation
    return { success: true, data: { duration: 1.5 } }
  }

  async isAvailable(): Promise<boolean> {
    return true
  }

  getProviderInfo(): TTSProviderInfo {
    return {
      name: 'custom',
      displayName: 'Custom TTS Provider',
      version: '1.0.0',
      requiresApiKey: false,
      supportedFeatures: ['speak'],
    }
  }

  async getVoices(): Promise<Voice[]> {
    return [
      {
        id: 'custom-voice',
        name: 'Custom Voice',
        language: 'en-US',
        gender: 'neutral',
        description: 'A custom voice implementation',
      },
    ]
  }

  getConfiguration() {
    return {}
  }

  configure(config: any): void {
    // Configuration logic
  }
}
```

This comprehensive guide covers all major programmatic usage patterns for the Claude Hooks TTS system. For more specific examples, see the `/examples` directory in the repository.

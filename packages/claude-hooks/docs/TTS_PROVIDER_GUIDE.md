# TTS Provider Selection Guide

## Overview

Claude Hooks supports three TTS providers, each with different strengths and use cases. This guide helps you choose the right provider for your needs.

## Provider Comparison Matrix

| Feature               | macOS TTS              | OpenAI TTS       | ElevenLabs             |
| --------------------- | ---------------------- | ---------------- | ---------------------- |
| **Cost**              | Free                   | $15/1M chars     | $5-$330/month          |
| **Latency**           | ~50ms                  | ~800ms           | ~1200ms                |
| **Voice Quality**     | Good                   | Excellent        | Outstanding            |
| **Voice Variety**     | 50+ system voices      | 6 curated voices | 1000+ voices + cloning |
| **Offline Support**   | ✅ Yes                 | ❌ No            | ❌ No                  |
| **API Key Required**  | ❌ No                  | ✅ Yes           | ✅ Yes                 |
| **Platform Support**  | macOS only             | Cross-platform   | Cross-platform         |
| **Text Limits**       | ~500 chars recommended | 4,096 chars      | 8,000 chars            |
| **Streaming Support** | ✅ Yes                 | ❌ No            | ✅ Yes (Pro)           |
| **Custom Voices**     | ❌ No                  | ❌ No            | ✅ Yes                 |
| **Commercial Use**    | ✅ Yes                 | ✅ Yes           | ✅ Yes                 |

## When to Choose Each Provider

### 🍎 macOS TTS

**Best for:**

- Development and testing on macOS
- Offline applications
- Quick prototyping without API costs
- Applications where low latency is critical
- Simple voice needs without customization

**Avoid when:**

- Need cross-platform support
- Require premium voice quality
- Need consistent voices across different systems

### 🤖 OpenAI TTS

**Best for:**

- Production applications with moderate voice needs
- Cross-platform applications
- High-quality voices with good cost efficiency
- Applications requiring consistent, professional voices
- Medium-scale deployments

**Avoid when:**

- Budget is extremely tight (high-volume usage)
- Need ultra-low latency
- Require voice customization or cloning
- Need offline functionality

### 🎭 ElevenLabs

**Best for:**

- Premium applications requiring exceptional voice quality
- Voice cloning and custom voice creation
- Multilingual applications
- High-end commercial products
- Applications where voice is a key differentiator

**Avoid when:**

- Cost is a primary concern for high-volume usage
- Simple TTS needs without quality requirements
- Latency-critical real-time applications
- Offline functionality is required

## Cost Analysis

### Per 1,000 Characters

| Provider   | Cost         | Notes                        |
| ---------- | ------------ | ---------------------------- |
| macOS      | $0.00        | Completely free              |
| OpenAI     | ~$0.015      | Based on $15/1M characters   |
| ElevenLabs | ~$0.15-$3.30 | Depends on plan and features |

### Monthly Cost Estimates

For an application generating **100,000 characters per month**:

- **macOS**: $0/month
- **OpenAI**: ~$1.50/month
- **ElevenLabs**: ~$15-$330/month (depending on plan)

## Technical Considerations

### Latency Comparison

```
macOS TTS: Text → Audio → Playback
              [~20ms] [~30ms]

OpenAI TTS:   Text → API → Download → Playback
              [~600ms] [~100ms] [~100ms]

ElevenLabs:   Text → API → Download → Playback
              [~800ms] [~200ms] [~200ms]
```

### Quality Characteristics

- **macOS**: Natural but robotic, consistent across devices
- **OpenAI**: Professional, clear, slight AI characteristics
- **ElevenLabs**: Human-like, emotional range, highly customizable

### Integration Complexity

1. **macOS**: Simplest - just works on macOS
2. **OpenAI**: Moderate - requires API key management
3. **ElevenLabs**: Complex - API key + voice ID management

## Recommended Configurations

### Development/Testing Setup

```typescript
const provider = new MacOSProvider({
  voice: 'Alex',
  rate: 200,
})
```

### Production Cross-Platform

```typescript
const provider = new OpenAIProvider({
  apiKey: process.env.OPENAI_API_KEY,
  voice: 'alloy',
  model: 'tts-1-hd',
})
```

### Premium Voice Experience

```typescript
const provider = new ElevenLabsProvider({
  apiKey: process.env.ELEVENLABS_API_KEY,
  voiceId: 'pNInz6obpgDQGcFmaJgB',
  modelId: 'eleven_multilingual_v2',
})
```

### Fallback Strategy

```typescript
const ttsConfig: TTSConfig = {
  provider: 'auto', // Try best available
  fallbackProvider: 'macos',
  openai: {
    apiKey: process.env.OPENAI_API_KEY,
    voice: 'alloy',
  },
  macos: {
    voice: 'Alex',
    rate: 200,
  },
}
```

## Migration Guidelines

### From macOS to OpenAI

1. Obtain OpenAI API key
2. Update configuration to include API key
3. Choose equivalent voice (Alex → alloy)
4. Test with your typical text lengths
5. Monitor API costs

### From OpenAI to ElevenLabs

1. Create ElevenLabs account and get API key
2. Browse voice library for suitable alternatives
3. Update configuration with voice ID
4. Consider voice cloning for brand consistency
5. Monitor usage and costs

### Hybrid Approach

```typescript
// Use macOS for development, OpenAI for production
const provider =
  process.env.NODE_ENV === 'development'
    ? new MacOSProvider({ voice: 'Alex' })
    : new OpenAIProvider({
        apiKey: process.env.OPENAI_API_KEY,
        voice: 'alloy',
      })
```

## Performance Optimization Tips

### For All Providers

- Enable audio caching to reduce redundant requests
- Batch similar requests when possible
- Pre-generate commonly used phrases

### macOS Specific

- Use `detached: true` for non-blocking audio
- Limit text to ~500 characters for best responsiveness

### API Providers (OpenAI/ElevenLabs)

- Implement proper rate limiting
- Handle API errors gracefully with retries
- Cache audio files with format-aware storage
- Monitor API quotas and usage

## Troubleshooting

See the [Troubleshooting Guide](./TROUBLESHOOTING.md) for common issues and solutions.

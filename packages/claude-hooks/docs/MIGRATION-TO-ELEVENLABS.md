# Migration Guide: Switching to ElevenLabs TTS

This guide helps you migrate from other TTS providers to ElevenLabs for premium voice synthesis.

## Why Migrate to ElevenLabs?

### Advantages

- **Ultra-realistic voices**: Industry-leading voice quality
- **Voice cloning**: Create custom voices from audio samples
- **Multiple languages**: Support for 29+ languages
- **Fine control**: Adjust stability, similarity, and speed
- **Low latency**: Flash models for real-time applications

### Considerations

- **Cost**: Requires paid subscription (free tier very limited)
- **API limits**: Rate limits based on subscription tier
- **Internet dependency**: No offline mode unlike macOS provider

## Migration Steps

### Step 1: Get Your ElevenLabs API Key

1. Sign up at [ElevenLabs.io](https://elevenlabs.io)
2. Navigate to your [API Keys](https://elevenlabs.io/api-keys) page
3. Copy your API key

### Step 2: Choose Your Voice

Visit the [Voice Lab](https://elevenlabs.io/voice-lab) to:

- Browse pre-made voices
- Create custom voice clones
- Get voice IDs for configuration

Popular voices:

- `21m00Tcm4TlvDq8ikWAM` - Rachel (clear, professional)
- `EXAVITQu4vr4xnSDxMaL` - Bella (young, energetic)
- `ErXwobaYiN019PkySvjV` - Antoni (warm, friendly)

### Step 3: Update Your Configuration

#### From OpenAI TTS

**Before (OpenAI):**

```json
{
  "settings": {
    "speak": true,
    "tts": {
      "provider": "openai",
      "openai": {
        "apiKey": "${OPENAI_API_KEY}",
        "voice": "nova",
        "model": "tts-1-hd"
      }
    }
  }
}
```

**After (ElevenLabs):**

```json
{
  "settings": {
    "speak": true,
    "tts": {
      "provider": "elevenlabs",
      "elevenlabs": {
        "apiKey": "${ELEVENLABS_API_KEY}",
        "voiceId": "21m00Tcm4TlvDq8ikWAM",
        "modelId": "eleven_multilingual_v2",
        "speed": 1.0
      },
      "fallbackProvider": "openai"
    }
  }
}
```

#### From macOS Speech

**Before (macOS):**

```json
{
  "settings": {
    "speak": true,
    "tts": {
      "provider": "macos",
      "macos": {
        "voice": "Samantha",
        "rate": 180
      }
    }
  }
}
```

**After (ElevenLabs):**

```json
{
  "settings": {
    "speak": true,
    "tts": {
      "provider": "elevenlabs",
      "elevenlabs": {
        "apiKey": "${ELEVENLABS_API_KEY}",
        "voiceId": "EXAVITQu4vr4xnSDxMaL",
        "modelId": "eleven_flash_v2_5",
        "speed": 0.9
      },
      "fallbackProvider": "macos"
    }
  }
}
```

### Step 4: Set Environment Variables

```bash
# Add to your .bashrc, .zshrc, or .env file
export ELEVENLABS_API_KEY="your-api-key-here"
export CLAUDE_HOOKS_TTS_PROVIDER="elevenlabs"
```

### Step 5: Test Your Configuration

```bash
# Test the ElevenLabs provider directly
echo '{"result": "success"}' | claude-hooks-stop --speak

# Verify voice selection
echo '{"result": "error"}' | claude-hooks-stop --speak --debug
```

## Voice Comparison Guide

### OpenAI to ElevenLabs Mapping

| OpenAI Voice | Similar ElevenLabs Voice | Voice ID             |
| ------------ | ------------------------ | -------------------- |
| alloy        | Rachel                   | 21m00Tcm4TlvDq8ikWAM |
| echo         | Antoni                   | ErXwobaYiN019PkySvjV |
| fable        | Arnold                   | VR6AewLTigWG4xSOukaG |
| onyx         | Adam                     | pNInz6obpgDQGcFmaJgB |
| nova         | Bella                    | EXAVITQu4vr4xnSDxMaL |
| shimmer      | Domi                     | AZnzlk1XvdvUeBnXmlld |

### macOS to ElevenLabs Mapping

| macOS Voice | Similar ElevenLabs Voice | Voice ID             |
| ----------- | ------------------------ | -------------------- |
| Samantha    | Rachel                   | 21m00Tcm4TlvDq8ikWAM |
| Alex        | Sam                      | yoZ06aMxZJJ28mfd3POQ |
| Daniel      | Daniel                   | onwK4e9ZLuTAKqWW03F9 |
| Karen       | Domi                     | AZnzlk1XvdvUeBnXmlld |
| Tom         | Arnold                   | VR6AewLTigWG4xSOukaG |

## Performance Optimization

### For Lower Latency

Use the Flash model for faster generation:

```json
{
  "modelId": "eleven_flash_v2_5",
  "outputFormat": "mp3_22050_32"
}
```

### For Higher Quality

Use the multilingual model with higher bitrate:

```json
{
  "modelId": "eleven_multilingual_v2",
  "outputFormat": "mp3_44100_192"
}
```

### For Consistency

Increase stability for more consistent output:

```json
{
  "stability": 0.75,
  "similarityBoost": 0.85
}
```

## Fallback Strategy

Always configure a fallback provider for resilience:

```json
{
  "tts": {
    "provider": "elevenlabs",
    "elevenlabs": { ... },
    "fallbackProvider": "macos",
    "macos": {
      "voice": "Samantha"
    }
  }
}
```

This ensures:

- Continued operation if ElevenLabs is unavailable
- Instant fallback during rate limiting
- Local-only operation when offline

## Cost Management

### Tips to Reduce Costs

1. **Use caching**: Cached responses don't count against quota
2. **Optimize text length**: Remove unnecessary text
3. **Choose efficient models**: Flash models use fewer characters
4. **Monitor usage**: Check your dashboard regularly

### Subscription Tiers (as of 2024)

- **Free**: 10,000 characters/month
- **Starter**: 30,000 characters/month ($5)
- **Creator**: 100,000 characters/month ($22)
- **Pro**: 500,000 characters/month ($99)

## Troubleshooting Migration Issues

### Common Problems

**"voiceId is required"**

- OpenAI uses voice names, ElevenLabs needs IDs
- Get IDs from Voice Lab or use examples above

**"Rate limit exceeded"**

- Free tier is very limited (10k chars/month)
- Consider upgrading or using fallback more

**Different audio quality**

- ElevenLabs may sound different from OpenAI
- Adjust stability and similarity settings
- Try different voice models

**Slower response times**

- Use Flash model for lower latency
- Enable caching to skip regeneration
- Consider geographic API endpoints

## Rollback Plan

If you need to switch back:

```json
{
  "tts": {
    "provider": "openai",
    "openai": {
      "apiKey": "${OPENAI_API_KEY}",
      "voice": "nova"
    }
  }
}
```

Or use environment variable:

```bash
export CLAUDE_HOOKS_TTS_PROVIDER="openai"
```

## Support Resources

- [ElevenLabs Documentation](https://docs.elevenlabs.io)
- [Voice Lab](https://elevenlabs.io/voice-lab)
- [API Reference](https://api.elevenlabs.io/docs)
- [Pricing Calculator](https://elevenlabs.io/pricing)
- Package Issues: [GitHub](https://github.com/nathanvale/mnemosyne/issues)

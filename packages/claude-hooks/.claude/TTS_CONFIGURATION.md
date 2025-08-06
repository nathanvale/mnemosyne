# TTS Configuration Guide

This guide explains how to configure Text-to-Speech (TTS) for Claude hooks using the new provider-based system.

## Quick Start

The TTS system automatically picks up your OpenAI API key from the environment:

```bash
# Set your OpenAI API key
export OPENAI_API_KEY="sk-your-api-key"

# The hooks will automatically use OpenAI TTS if available
node stop.ts --speak "Your task is complete"
```

## Overview

The TTS system supports multiple providers:

- **OpenAI TTS**: High-quality neural voices (requires API key)
- **macOS TTS**: Built-in macOS text-to-speech (free)
- **Auto**: Automatically selects the best available provider

## Configuration Methods

### 1. JSON Configuration Files

Create configuration files in `.claude/hooks/` directory:

```json
{
  "tts": {
    "provider": "auto",
    "fallbackProvider": "macos",
    "openai": {
      // apiKey is optional - automatically loaded from OPENAI_API_KEY env var
      // "apiKey": "sk-your-openai-api-key-here",
      "model": "tts-1",
      "voice": "alloy",
      "speed": 1.0,
      "format": "mp3"
    },
    "macos": {
      "voice": "Alex",
      "rate": 200,
      "volume": 0.8,
      "enabled": true
    }
  }
}
```

### 2. Environment Variables (Recommended)

Environment variables override JSON configuration and are automatically loaded:

```bash
# Provider selection
export CLAUDE_HOOKS_TTS_PROVIDER=auto
export CLAUDE_HOOKS_TTS_FALLBACK_PROVIDER=macos

# OpenAI TTS configuration (API key is automatically detected)
export OPENAI_API_KEY=sk-your-openai-api-key-here
export CLAUDE_HOOKS_OPENAI_TTS_MODEL=tts-1
export CLAUDE_HOOKS_OPENAI_TTS_VOICE=alloy
export CLAUDE_HOOKS_OPENAI_TTS_SPEED=1.0
export CLAUDE_HOOKS_OPENAI_TTS_FORMAT=mp3

# macOS TTS configuration
export CLAUDE_HOOKS_MACOS_TTS_VOICE=Alex
export CLAUDE_HOOKS_MACOS_TTS_RATE=200
export CLAUDE_HOOKS_MACOS_TTS_VOLUME=0.8
export CLAUDE_HOOKS_MACOS_TTS_ENABLED=true
```

## Provider Configuration

### OpenAI TTS

**Requirements:**

- OpenAI API key with TTS access
- Internet connection

**Configuration:**

```json
{
  "openai": {
    "apiKey": "sk-your-api-key",
    "model": "tts-1", // "tts-1" or "tts-1-hd"
    "voice": "alloy", // "alloy", "echo", "fable", "onyx", "nova", "shimmer"
    "speed": 1.0, // 0.25 to 4.0
    "format": "mp3" // "mp3", "opus", "aac", "flac"
  }
}
```

**Voice Options:**

- `alloy` - Neutral, balanced
- `echo` - Male, calm
- `fable` - British accent
- `onyx` - Deep, authoritative
- `nova` - Young, energetic
- `shimmer` - Soft, whispery

### macOS TTS

**Requirements:**

- macOS system
- `say` command available

**Configuration:**

```json
{
  "macos": {
    "voice": "Alex", // System voice name
    "rate": 200, // Words per minute (50-500)
    "volume": 0.8, // Volume level (0.0-1.0)
    "enabled": true // Enable/disable provider
  }
}
```

**Common macOS Voices:**

- `Alex` - Default male voice
- `Samantha` - Female voice
- `Victoria` - British female
- `Daniel` - British male
- `Fiona` - Scottish female

List available voices: `say -v ?`

## Provider Selection Strategies

### Auto Mode (Recommended)

```json
{
  "provider": "auto",
  "fallbackProvider": "macos"
}
```

Auto mode tries providers in this order:

1. OpenAI TTS (if API key available)
2. macOS TTS (if on macOS)
3. Fallback provider

### Specific Provider

```json
{
  "provider": "openai",
  "fallbackProvider": "macos"
}
```

Forces use of specific provider with fallback option.

### No Fallback

```json
{
  "provider": "openai",
  "fallbackProvider": "none"
}
```

Only uses the specified provider, no fallback.

## Hook-Specific Examples

### Notification Hook

High-quality speech for important notifications:

```json
{
  "speak": true,
  "tts": {
    "provider": "openai",
    "fallbackProvider": "macos",
    "openai": {
      "model": "tts-1-hd",
      "voice": "nova",
      "speed": 1.1
    }
  }
}
```

### Stop Hook

Quick, simple voice for task completion:

```json
{
  "speak": true,
  "tts": {
    "provider": "macos",
    "macos": {
      "voice": "Alex",
      "rate": 250,
      "volume": 0.7
    }
  }
}
```

### Subagent Stop Hook

Distinctive voice for subagent completion:

```json
{
  "speak": true,
  "tts": {
    "provider": "auto",
    "openai": {
      "voice": "echo",
      "speed": 0.9
    },
    "macos": {
      "voice": "Daniel",
      "rate": 180
    }
  }
}
```

## Audio Caching

The system automatically caches generated audio to improve performance:

- **OpenAI TTS**: Caches API responses to reduce costs and latency
- **macOS TTS**: No caching needed (generated locally)
- **Cache Size**: LRU with configurable size limits
- **Cache Location**: Temporary system directory

## Troubleshooting

### OpenAI Issues

**"API key not found"**

- Set `OPENAI_API_KEY` environment variable (recommended)
- Or configure `apiKey` in JSON config (alternative)
- The environment variable is automatically detected by all hooks

**"Rate limit exceeded"**

- Reduce TTS usage frequency
- Consider using macOS as primary provider

**"Network error"**

- Check internet connection
- Set `fallbackProvider: "macos"` for offline fallback

### macOS Issues

**"Command not found: say"**

- Ensure you're running on macOS
- Check macOS system integrity

**"Voice not found"**

- Use `say -v ?` to list available voices
- Update voice name in configuration

**No audio output**

- Check system volume settings
- Verify `volume` setting in config (0.0-1.0)

### General Issues

**No speech output**

- Verify `speak: true` in hook configuration
- Check `enabled: true` for provider configuration
- Enable debug mode: `debug: true`

**Provider not available**

- Check provider requirements (API key, system compatibility)
- Verify fallback provider configuration
- Check console/logs for specific error messages

## Environment Variable Priority

Configuration sources are applied in this order (later overrides earlier):

1. Default configuration
2. JSON config file (`.claude/hooks/[hook].config.json`)
3. Environment variables
4. CLI arguments (hook-specific)

Example priority:

```bash
# This overrides JSON config
export CLAUDE_HOOKS_TTS_PROVIDER=openai

# This overrides both JSON and env vars
node notification.js --speak
```

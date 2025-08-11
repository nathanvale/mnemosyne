# TTS Troubleshooting Guide

## Common Issues and Solutions

### 🔇 No Audio Output

#### macOS Provider

**Problem**: `speak()` succeeds but no audio plays

**Solutions**:

1. **Check system volume**: Ensure system volume is not muted
2. **Verify voice exists**: Use `claude-hooks-list-voices -p macos` to see available voices
3. **Test system TTS**: Run `say "Hello world"` in Terminal to verify system TTS works
4. **Check audio device**: Ensure correct audio output device is selected in System Preferences

```bash
# Test if system TTS works
say "This is a test"

# List available macOS voices
claude-hooks-list-voices --provider macos
```

#### OpenAI Provider

**Problem**: API call succeeds but audio doesn't play

**Solutions**:

1. **Check API key**: Verify `OPENAI_API_KEY` is set correctly
2. **Verify audio format**: Ensure your system supports the selected format
3. **Test with different voice**: Try with 'alloy' voice as baseline
4. **Check file permissions**: Ensure temp directory is writable

```bash
# Verify API key is set
echo $OPENAI_API_KEY

# Test with minimal configuration
claude-hooks-list-voices --preview:openai/alloy --api-key your-key-here
```

#### ElevenLabs Provider

**Problem**: Voice generation works but no playback

**Solutions**:

1. **Verify API key and voice ID**: Both are required
2. **Check voice availability**: Voice might be deleted or unavailable
3. **Test with default voice**: Try a known working voice ID
4. **Check ElevenLabs quota**: You might be out of characters

```bash
# List available ElevenLabs voices
claude-hooks-list-voices --provider elevenlabs --api-key your-key

# Test with preview
claude-hooks-list-voices --preview:elevenlabs/pNInz6obpgDQGcFmaJgB
```

### 🔑 API Key Issues

#### Invalid or Missing API Key

**Error**: `OpenAI API key not configured` or `ElevenLabs API key not found`

**Solutions**:

1. **Set environment variable**:

   ```bash
   export OPENAI_API_KEY="sk-your-key-here"
   export ELEVENLABS_API_KEY="your-key-here"
   ```

2. **Use config file**:

   ```typescript
   const provider = new OpenAIProvider({
     apiKey: 'sk-your-key-here',
   })
   ```

3. **Pass via CLI**:
   ```bash
   claude-hooks-list-voices --api-key sk-your-key-here
   ```

#### API Key Validation

```typescript
// Test OpenAI key
const openai = new OpenAIProvider({ apiKey: 'your-key' })
const isAvailable = await openai.isAvailable()
console.log('OpenAI available:', isAvailable)
```

### 📱 Platform-Specific Issues

#### Windows PowerShell Issues

**Problem**: Audio playback fails on Windows

**Solutions**:

1. **Ensure PowerShell is available**: Most Windows 10+ systems have it
2. **Check execution policy**:
   ```powershell
   Get-ExecutionPolicy
   Set-ExecutionPolicy -Scope CurrentUser RemoteSigned
   ```
3. **Test PowerShell TTS**:
   ```powershell
   (New-Object Media.SoundPlayer 'path\to\audio.mp3').PlaySync()
   ```

#### Linux Audio Issues

**Problem**: No audio players found

**Solutions**:

1. **Install audio player**:

   ```bash
   # Ubuntu/Debian
   sudo apt install alsa-utils pulseaudio-utils

   # RHEL/CentOS/Fedora
   sudo yum install alsa-utils pulseaudio-utils

   # With ffmpeg
   sudo apt install ffmpeg
   ```

2. **Test audio players**:

   ```bash
   # Test aplay
   aplay /usr/share/sounds/alsa/Front_Left.wav

   # Test paplay
   paplay /usr/share/sounds/alsa/Front_Left.wav
   ```

#### macOS Permission Issues

**Problem**: System denies audio access

**Solutions**:

1. **Grant Terminal audio access**: System Preferences → Security & Privacy → Privacy → Microphone/Camera
2. **Reset permissions**: `tccutil reset All com.apple.Terminal`

### 🌐 Network and API Issues

#### Rate Limiting

**Error**: `429 Rate limit exceeded`

**Solutions**:

1. **Check API quotas**: Verify your API plan limits
2. **Implement backoff**: The library already includes exponential backoff
3. **Reduce request frequency**: Add delays between requests
4. **Upgrade API plan**: If hitting usage limits consistently

#### Network Timeouts

**Error**: `ETIMEDOUT` or connection errors

**Solutions**:

1. **Check internet connection**: Verify you can reach API endpoints
2. **Check corporate firewall**: Some networks block external APIs
3. **Increase timeout**: Configure longer timeouts for slow connections
4. **Use retry logic**: The library includes automatic retries

```typescript
// Custom timeout configuration
const provider = new OpenAIProvider({
  apiKey: 'your-key',
  // Note: timeout configuration may require custom implementation
})
```

### 💾 Caching Issues

#### Cache Not Working

**Problem**: Same requests are not cached

**Solutions**:

1. **Verify cache is enabled**:

   ```typescript
   const provider = new OpenAIProvider({
     audioCache: { enabled: true },
   })
   ```

2. **Check cache directory**: Ensure it's writable

   ```bash
   ls -la /tmp/claude-hooks-audio-cache/
   ```

3. **Clear corrupted cache**:
   ```bash
   claude-hooks-cache-explorer --clear
   ```

#### Cache Size Issues

**Problem**: Cache growing too large

**Solutions**:

1. **Configure cache limits**:

   ```typescript
   audioCache: {
     maxSizeMB: 50,    // 50MB limit
     maxAgeDays: 7,    // 7 day expiry
     maxEntries: 100   // Max 100 cached items
   }
   ```

2. **Manual cleanup**:
   ```bash
   claude-hooks-cache-stats
   claude-hooks-cache-explorer --clear
   ```

### 🔤 Text Processing Issues

#### Text Too Long

**Error**: Text truncation warnings

**Text Limits by Provider**:

- **macOS**: ~500 characters recommended (no hard limit)
- **OpenAI**: 4,096 characters (hard limit)
- **ElevenLabs**: 8,000 characters (plan dependent)

**Solutions**:

1. **Split long text**:

   ```typescript
   const chunks = longText.match(/.{1,4000}/g) || []
   for (const chunk of chunks) {
     await provider.speak(chunk)
   }
   ```

2. **Use streaming** (where supported):
   ```typescript
   // Future feature - streaming support
   ```

#### Special Characters

**Problem**: Text with special characters fails

**Solutions**:

1. **Clean text before TTS**:

   ```typescript
   const cleanText = text
     .replace(/[^\w\s.,!?]/g, '') // Remove special chars
     .replace(/\s+/g, ' ') // Normalize whitespace
     .trim()
   ```

2. **Use SSML** (where supported):
   ```typescript
   // ElevenLabs supports SSML
   const ssml = '<speak>Hello <break time="1s"/> world</speak>'
   ```

### 🧪 Development and Testing

#### Voice Discovery Issues

**Problem**: `claude-hooks-list-voices` fails

**Solutions**:

1. **Check provider availability**:

   ```bash
   # Test each provider individually
   claude-hooks-list-voices --provider macos
   claude-hooks-list-voices --provider openai --api-key your-key
   claude-hooks-list-voices --provider elevenlabs --api-key your-key
   ```

2. **Verify system requirements**:
   - macOS: System must have TTS enabled
   - OpenAI: Valid API key with credits
   - ElevenLabs: Valid API key with character allowance

#### Preview Not Working

**Problem**: Voice preview fails

**Solutions**:

1. **Check audio output**: Ensure speakers/headphones work
2. **Try different providers**: Start with macOS if available
3. **Check API quotas**: Previews consume API credits
4. **Verify voice IDs**: Use voice discovery to get correct IDs

### 📊 Performance Issues

#### Slow Audio Generation

**Problem**: TTS takes too long

**Solutions**:

1. **Use faster models**:

   ```typescript
   // OpenAI - use standard model for speed
   new OpenAIProvider({ model: 'tts-1' }) // vs 'tts-1-hd'
   ```

2. **Enable caching**:

   ```typescript
   audioCache: {
     enabled: true
   }
   ```

3. **Reduce text length**: Shorter text generates faster
4. **Use local provider**: macOS is fastest for supported platforms

#### High Memory Usage

**Problem**: Application consuming too much memory

**Solutions**:

1. **Configure cache limits**:

   ```typescript
   audioCache: {
     maxSizeMB: 10,     // Reduce cache size
     maxEntries: 20     // Limit cached items
   }
   ```

2. **Clean up regularly**:

   ```bash
   # Monitor cache size
   claude-hooks-cache-stats

   # Clean old entries
   claude-hooks-cache-explorer --clean-expired
   ```

### 🔧 Configuration Issues

#### Environment Variables Not Loading

**Problem**: Config not reading from .env files

**Solutions**:

1. **Check .env file location**: Must be in project root
2. **Verify variable names**:

   ```
   OPENAI_API_KEY=sk-your-key-here
   ELEVENLABS_API_KEY=your-elevenlabs-key
   CLAUDE_HOOKS_DEBUG=true
   ```

3. **Manual environment loading**:
   ```typescript
   import 'dotenv/config'
   ```

#### TypeScript Issues

**Problem**: Type errors with provider configurations

**Solutions**:

1. **Use proper types**:

   ```typescript
   import type { OpenAIConfig, TTSConfig } from '@studio/claude-hooks'

   const config: OpenAIConfig = {
     apiKey: 'your-key',
     voice: 'alloy', // TypeScript will validate this
   }
   ```

2. **Check exports**:
   ```typescript
   import { OpenAIProvider, type Voice } from '@studio/claude-hooks/speech'
   ```

## Getting Help

### Enable Debug Logging

```bash
export CLAUDE_HOOKS_DEBUG=true
```

### Collect Diagnostic Information

```bash
# System information
uname -a
node --version

# Provider status
claude-hooks-list-voices --provider all

# Cache status
claude-hooks-cache-stats

# Test basic functionality
claude-hooks-list-voices --preview:macos/Alex
```

### Report Issues

When reporting issues, please include:

1. **System information**: OS, Node.js version
2. **Provider details**: Which TTS provider you're using
3. **Configuration**: Relevant config (remove API keys!)
4. **Error messages**: Full error output with debug logging
5. **Steps to reproduce**: Minimal code example

### Community Resources

- GitHub Issues: [Report bugs and feature requests](https://github.com/nathanvale/mnemosyne/issues)
- Documentation: Check the latest docs for updates
- Examples: See `/examples` directory for working code samples

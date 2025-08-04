# 🔊 Task Completion Sound Hook

This hook plays notification sounds when tasks complete successfully in Claude Code.

## ✅ Installation Complete

The hook is now installed and configured in your `.claude/settings.local.json`:

```json
{
  "hooks": {
    "tool-use-attempt": {
      "command": "node .claude/hooks/task-completion/sound-notification.cjs",
      "enabled": true
    }
  }
}
```

## 🎵 Default Behavior

- **✅ Success Sound**: Plays `Glass.aiff` when tools like `Write`, `Edit`, `MultiEdit`, `Bash` complete successfully
- **⚠️ Warning Sounds**: Disabled by default
- **❌ Error Sounds**: Disabled by default
- **⏰ Cooldown**: 2 seconds between sounds to prevent spam
- **🌙 Quiet Hours**: Disabled by default

## 🔧 Configuration Options

### Environment Variables (Quick Setup)

```bash
# Enable/disable sounds
export CLAUDE_HOOKS_SOUND_SUCCESS=true          # Play success sounds (default: true)
export CLAUDE_HOOKS_SOUND_WARNING=false         # Play warning sounds (default: false)
export CLAUDE_HOOKS_SOUND_ERROR=false           # Play error sounds (default: false)

# Timing controls
export CLAUDE_HOOKS_SOUND_DELAY=0               # Delay before playing (ms)
export CLAUDE_HOOKS_SOUND_COOLDOWN=2000         # Minimum time between sounds (ms)
export CLAUDE_HOOKS_MIN_EXEC_TIME=1000          # Only play for tasks longer than this (ms)

# Volume and debug
export CLAUDE_HOOKS_SOUND_VOLUME=medium         # Volume level (low/medium/high)
export CLAUDE_HOOKS_DEBUG=true                  # Enable debug logging
```

### JSON Configuration (Advanced)

Edit `.claude/hooks/task-completion/hook-config.json`:

#### Custom Sound Files

```json
{
  "sounds": {
    "success": {
      "enabled": true,
      "file": "/System/Library/Sounds/Hero.aiff",
      "fallback": "/System/Library/Sounds/Glass.aiff"
    },
    "warning": {
      "enabled": true,
      "file": "/System/Library/Sounds/Tink.aiff"
    }
  }
}
```

#### Quiet Hours

```json
{
  "filters": {
    "quietHours": {
      "enabled": true,
      "start": "22:00",
      "end": "08:00"
    }
  }
}
```

#### Custom Triggers

```json
{
  "triggers": {
    "successTools": ["Write", "Edit", "MultiEdit", "Bash", "TodoWrite"],
    "completionPatterns": ["✅", "completed", "success", "passed", "done"]
  }
}
```

## 🎼 Available macOS System Sounds

- `Glass.aiff` - Clear, pleasant (default success)
- `Hero.aiff` - Triumphant fanfare
- `Ping.aiff` - Simple notification
- `Tink.aiff` - Subtle tap (good for warnings)
- `Sosumi.aiff` - Classic Mac sound
- `Blow.aiff` - Soft whoosh
- `Bottle.aiff` - Pop sound
- `Frog.aiff` - Ribbit sound
- `Funk.aiff` - Funky beat
- `Pop.aiff` - Simple pop

## 🎯 Usage Examples

### Disable All Sounds Temporarily

```bash
export CLAUDE_HOOKS_SOUND_SUCCESS=false
```

### Enable Warning Sounds for Development

```bash
export CLAUDE_HOOKS_SOUND_WARNING=true
```

### Custom Sound with Delay

```bash
export CLAUDE_HOOKS_SOUND_DELAY=500  # Half-second delay
```

### Debug Mode (See What's Happening)

```bash
export CLAUDE_HOOKS_DEBUG=true
```

## 🔧 Troubleshooting

### No Sound Playing?

1. **Check if enabled**: Look for `[OK] Played sound: ...` in output
2. **Verify sound file exists**:
   ```bash
   ls -la /System/Library/Sounds/Glass.aiff
   ```
3. **Test sound manually**:
   ```bash
   afplay /System/Library/Sounds/Glass.aiff
   ```
4. **Check cooldown**: Sounds are limited to once every 2 seconds by default

### Hook Not Running?

1. **Verify hook registration**: Check `.claude/settings.local.json`
2. **Test hook manually**:
   ```bash
   echo '{"tool_name":"Write","tool_result":"success"}' | node .claude/hooks/task-completion/sound-notification.cjs
   ```
3. **Enable debug mode**: `export CLAUDE_HOOKS_DEBUG=true`

### Sounds Too Frequent?

```bash
# Increase cooldown to 5 seconds
export CLAUDE_HOOKS_SOUND_COOLDOWN=5000

# Only play for longer tasks (3+ seconds)
export CLAUDE_HOOKS_MIN_EXEC_TIME=3000
```

## 🎪 Fun Configurations

### Victory Fanfare

```json
{
  "sounds": {
    "success": {
      "file": "/System/Library/Sounds/Hero.aiff"
    }
  }
}
```

### Quiet Work Mode

```json
{
  "filters": {
    "quietHours": {
      "enabled": true,
      "start": "09:00",
      "end": "17:00"
    }
  }
}
```

### Development Mode (All Sounds)

```bash
export CLAUDE_HOOKS_SOUND_SUCCESS=true
export CLAUDE_HOOKS_SOUND_WARNING=true
export CLAUDE_HOOKS_SOUND_ERROR=true
```

Enjoy your enhanced Claude Code experience with audio feedback! 🎵✨

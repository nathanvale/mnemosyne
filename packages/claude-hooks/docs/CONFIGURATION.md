# Claude Hooks Configuration Reference

Complete reference for configuring Claude Code hooks via JSON files and environment variables.

## Configuration System Overview

The Claude Hooks configuration system uses a three-tier priority system:

1. **Default Values** - Built-in defaults in the code
2. **JSON Configuration** - Settings from `.claude/hooks/{hookName}.config.json` files
3. **Environment Variables** - Override any setting at runtime

## JSON Configuration Schema

### Notification Hook Configuration

Location: `.claude/hooks/notification.config.json`

```json
{
  "settings": {
    "soundEnabled": true, // Enable sound notifications
    "speechEnabled": false, // Enable speech (macOS only)
    "volume": "medium", // Volume level: low, medium, high
    "cooldownMs": 5000, // Cooldown between notifications (ms)
    "allowUrgentOverride": false, // Allow urgent messages to bypass cooldown
    "quietHours": {
      "enabled": true, // Enable quiet hours
      "start": "22:00", // Start time (24-hour format)
      "end": "08:00", // End time (24-hour format)
      "allowUrgentOverride": false // Allow urgent messages during quiet hours
    },
    "logging": {
      "enabled": true, // Enable event logging
      "logDir": "~/.claude/logs", // Log directory path
      "useLocalDir": false // Use project-local .claude/logs
    },
    "speech": {
      "message": "Claude needs your attention", // Speech message
      "voice": "Alex", // macOS voice name
      "rate": 200 // Speech rate (words per minute)
    }
  }
}
```

### Stop Hook Configuration

Location: `.claude/hooks/stop.config.json`

```json
{
  "settings": {
    "soundEnabled": true, // Enable completion sounds
    "speechEnabled": false, // Enable speech announcements
    "transcriptEnabled": true, // Enable chat transcript logging
    "volume": "medium", // Volume level
    "cooldownMs": 2000, // Cooldown between notifications
    "quietHours": {
      "enabled": true,
      "start": "22:00",
      "end": "08:00"
    },
    "logging": {
      "enabled": true,
      "logDir": "~/.claude/logs",
      "maxLogSizeMB": 10, // Max size before rotation
      "maxLogFiles": 5 // Number of rotated files to keep
    },
    "transcript": {
      "enabled": true, // Enable transcript processing
      "includeTimestamps": true, // Include timestamps in transcript
      "formatMarkdown": true // Format transcript as markdown
    },
    "speech": {
      "message": "Task completed successfully",
      "voice": "Samantha",
      "rate": 180
    }
  }
}
```

### Subagent Stop Hook Configuration

Location: `.claude/hooks/subagent-stop.config.json`

```json
{
  "settings": {
    "soundEnabled": true,
    "volume": "low", // Lower volume for subagents
    "loggingEnabled": true,
    "trackMetrics": true, // Track subagent performance metrics
    "alertLongRunning": true, // Alert for long-running subagents
    "longRunningThresholdMs": 30000, // Threshold for long-running (ms)
    "logging": {
      "enabled": true,
      "logDir": "~/.claude/logs",
      "includeSubagentDetails": true, // Log detailed subagent info
      "aggregateMetrics": true // Aggregate metrics across subagents
    },
    "notifications": {
      "onSuccess": true, // Notify on successful completion
      "onFailure": true, // Notify on failures
      "onLongRunning": true // Notify when exceeding threshold
    }
  }
}
```

### Quality Check Hook Configuration

Location: `.claude/hooks/quality-check.config.json`

```json
{
  "version": "1.0.0",
  "name": "Quality Check Hook",
  "projectType": "react-app", // Project type for optimizations
  "typescript": {
    "enabled": true, // Enable TypeScript checking
    "showDependencyErrors": false, // Show errors from node_modules
    "jsx": "react", // JSX mode: react, preserve, react-native
    "strict": true, // Enable strict type checking
    "skipLibCheck": true // Skip checking declaration files
  },
  "eslint": {
    "enabled": true, // Enable ESLint checking
    "autofix": true, // Auto-fix fixable issues
    "extends": ["react-app"], // ESLint configurations to extend
    "maxWarnings": 0, // Maximum allowed warnings
    "cache": true // Enable ESLint cache
  },
  "prettier": {
    "enabled": true, // Enable Prettier checking
    "autofix": true, // Auto-format files
    "configPath": ".prettierrc" // Path to Prettier config
  },
  "general": {
    "autofixSilent": true, // Don't report auto-fixed issues
    "debug": false, // Enable debug logging
    "parallel": true // Run checks in parallel
  },
  "rules": {
    "console": {
      "enabled": true,
      "severity": "warning", // error, warning, info
      "message": "Remove console statements",
      "allowIn": {
        "paths": ["src/debug/"],
        "patterns": ["*.test.*"]
      }
    },
    "debugger": {
      "enabled": true,
      "severity": "error"
    },
    "todos": {
      "enabled": true,
      "severity": "info",
      "patterns": ["TODO", "FIXME", "HACK", "XXX"]
    }
  },
  "ignore": {
    "paths": ["node_modules/", "build/", "dist/", ".next/", "coverage/"],
    "patterns": ["*.min.js", "*.bundle.js"]
  }
}
```

### Sound Notification Hook Configuration (Legacy)

Location: `.claude/hooks/sound-notification.config.json` (if using this legacy hook)

```json
{
  "settings": {
    "playOnSuccess": true, // Play sound on successful completion
    "playOnWarning": true, // Play sound when warnings occur
    "playOnError": false, // Play sound on errors
    "volume": "medium",
    "soundDelay": 0, // Delay before playing (ms)
    "cooldown": 2000, // Cooldown between sounds (ms)
    "sounds": {
      "success": "/System/Library/Sounds/Glass.aiff",
      "warning": "/System/Library/Sounds/Funk.aiff",
      "error": "/System/Library/Sounds/Basso.aiff"
    }
  }
}
```

## Environment Variable Reference

All settings can be overridden using environment variables. The variables follow a consistent naming pattern:
`CLAUDE_HOOKS_[HOOK_NAME]_[SETTING_NAME]`

### Global Environment Variables

These apply to all hooks:

```bash
# Global settings
CLAUDE_HOOKS_DEBUG=true                # Enable debug logging for all hooks
CLAUDE_HOOKS_LOG_DIR=/custom/path      # Custom log directory
CLAUDE_HOOKS_VOLUME=high               # Global volume override
CLAUDE_HOOKS_USE_LOCAL_DIR=true        # Use project-local .claude/logs

# Configuration loading
CLAUDE_HOOKS_CONFIG_PATH=/path/to/config.json  # Override config file location
```

### Notification Hook Variables

```bash
# Sound and speech
CLAUDE_HOOKS_NOTIFICATION_SOUND=true   # Enable/disable sound
CLAUDE_HOOKS_NOTIFICATION_SPEECH=true  # Enable/disable speech
CLAUDE_HOOKS_NOTIFICATION_VOLUME=low   # Volume level

# Quiet hours
CLAUDE_HOOKS_QUIET_HOURS_ENABLED=true  # Enable quiet hours
CLAUDE_HOOKS_QUIET_HOURS_START=22:00   # Start time
CLAUDE_HOOKS_QUIET_HOURS_END=08:00     # End time

# Cooldown
CLAUDE_HOOKS_NOTIFICATION_COOLDOWN=5000 # Cooldown period (ms)
CLAUDE_HOOKS_URGENT_OVERRIDE=true      # Allow urgent override

# Speech settings (macOS)
CLAUDE_HOOKS_SPEECH_MESSAGE="Attention needed"
CLAUDE_HOOKS_SPEECH_VOICE=Alex
CLAUDE_HOOKS_SPEECH_RATE=200
```

### Stop Hook Variables

```bash
# Sound and transcript
CLAUDE_HOOKS_STOP_SOUND=true           # Enable completion sound
CLAUDE_HOOKS_STOP_SPEECH=false         # Enable speech announcement
CLAUDE_HOOKS_STOP_TRANSCRIPT=true      # Enable transcript logging

# Cooldown and volume
CLAUDE_HOOKS_STOP_COOLDOWN=2000        # Cooldown period (ms)
CLAUDE_HOOKS_STOP_VOLUME=medium        # Volume level

# Transcript settings
CLAUDE_HOOKS_TRANSCRIPT_TIMESTAMPS=true # Include timestamps
CLAUDE_HOOKS_TRANSCRIPT_MARKDOWN=true   # Format as markdown
```

### Subagent Stop Hook Variables

```bash
# Basic settings
CLAUDE_HOOKS_SUBAGENT_SOUND=true       # Enable sound
CLAUDE_HOOKS_SUBAGENT_VOLUME=low       # Volume level
CLAUDE_HOOKS_SUBAGENT_LOGGING=true     # Enable logging

# Metrics and monitoring
CLAUDE_HOOKS_TRACK_METRICS=true        # Track performance metrics
CLAUDE_HOOKS_ALERT_LONG_RUNNING=true   # Alert for long-running
CLAUDE_HOOKS_LONG_RUNNING_THRESHOLD=30000 # Threshold (ms)

# Notifications
CLAUDE_HOOKS_NOTIFY_SUCCESS=true       # Notify on success
CLAUDE_HOOKS_NOTIFY_FAILURE=true       # Notify on failure
```

### Quality Check Hook Variables

```bash
# TypeScript settings
CLAUDE_HOOKS_TYPESCRIPT_ENABLED=true   # Enable TypeScript
CLAUDE_HOOKS_SHOW_DEPENDENCY_ERRORS=false # Show node_modules errors
CLAUDE_HOOKS_TYPESCRIPT_STRICT=true    # Strict mode

# ESLint settings
CLAUDE_HOOKS_ESLINT_ENABLED=true       # Enable ESLint
CLAUDE_HOOKS_ESLINT_AUTOFIX=true       # Auto-fix issues
CLAUDE_HOOKS_ESLINT_CACHE=true         # Use cache

# Prettier settings
CLAUDE_HOOKS_PRETTIER_ENABLED=true     # Enable Prettier
CLAUDE_HOOKS_PRETTIER_AUTOFIX=true     # Auto-format

# General settings
CLAUDE_HOOKS_AUTOFIX_SILENT=true       # Silent auto-fix
CLAUDE_HOOKS_CHECK_PARALLEL=true       # Parallel execution
```

### Sound Notification Hook Variables (Legacy)

```bash
# Playback settings
CLAUDE_HOOKS_SOUND_SUCCESS=true        # Play on success
CLAUDE_HOOKS_SOUND_WARNING=true        # Play on warning
CLAUDE_HOOKS_SOUND_ERROR=false         # Play on error

# Timing
CLAUDE_HOOKS_SOUND_DELAY=0             # Delay before playing (ms)
CLAUDE_HOOKS_SOUND_COOLDOWN=2000       # Cooldown between sounds (ms)

# Volume
CLAUDE_HOOKS_SOUND_VOLUME=medium       # Volume level
```

## Advanced Configuration Patterns

### Multi-Environment Setup

Use environment variables for different environments:

```bash
# Development
export CLAUDE_HOOKS_DEBUG=true
export CLAUDE_HOOKS_ESLINT_AUTOFIX=true
export CLAUDE_HOOKS_QUIET_HOURS_ENABLED=false

# Production
export CLAUDE_HOOKS_DEBUG=false
export CLAUDE_HOOKS_ESLINT_AUTOFIX=false
export CLAUDE_HOOKS_QUIET_HOURS_ENABLED=true
```

### Project-Specific Overrides

Create a `.env` file in your project root:

```bash
# .env
CLAUDE_HOOKS_LOG_DIR=./.claude/logs
CLAUDE_HOOKS_USE_LOCAL_DIR=true
CLAUDE_HOOKS_TYPESCRIPT_STRICT=true
CLAUDE_HOOKS_ESLINT_EXTENDS=["react-app", "custom-config"]
```

### Platform-Specific Configuration

Use conditional configuration based on platform:

```json
{
  "settings": {
    "platform": {
      "darwin": {
        "soundCommand": "afplay",
        "systemSounds": true,
        "speechEnabled": true
      },
      "win32": {
        "soundCommand": "powershell",
        "systemSounds": false,
        "speechEnabled": false
      },
      "linux": {
        "soundCommand": "aplay",
        "systemSounds": false,
        "speechEnabled": false
      }
    }
  }
}
```

### Time-Based Configuration

Configure different settings for different times:

```json
{
  "settings": {
    "profiles": {
      "workHours": {
        "timeRange": { "start": "09:00", "end": "17:00" },
        "volume": "low",
        "cooldownMs": 5000
      },
      "afterHours": {
        "timeRange": { "start": "17:00", "end": "09:00" },
        "volume": "medium",
        "cooldownMs": 2000
      },
      "weekend": {
        "days": ["Saturday", "Sunday"],
        "volume": "high",
        "cooldownMs": 1000
      }
    }
  }
}
```

## Configuration Validation

The configuration system validates settings at runtime:

1. **Type Validation** - Ensures correct data types
2. **Range Validation** - Checks numeric values are within valid ranges
3. **Format Validation** - Validates time formats, file paths, etc.
4. **Dependency Validation** - Ensures required dependencies are met

### Validation Examples

```json
{
  "settings": {
    "volume": "medium", // ✓ Valid: low, medium, high
    "volume": "extra-loud", // ✗ Invalid value

    "cooldownMs": 2000, // ✓ Valid: positive integer
    "cooldownMs": -1000, // ✗ Invalid: negative

    "quietHours": {
      "start": "22:00", // ✓ Valid: HH:MM format
      "start": "10PM", // ✗ Invalid format

      "end": "08:00", // ✓ Valid: HH:MM format
      "end": "25:00" // ✗ Invalid: hours > 24
    }
  }
}
```

## Debugging Configuration

### Enable Debug Logging

```bash
export CLAUDE_HOOKS_DEBUG=true
```

This will log:

- Configuration loading process
- Which settings are being used (default, JSON, or env var)
- Validation errors
- Event processing details

### Check Effective Configuration

The hooks log their effective configuration at startup:

```
[NOTIFICATION] Debug mode enabled
[NOTIFICATION] Configuration loaded:
  - soundEnabled: true (from JSON)
  - volume: high (from env var)
  - quietHours.enabled: true (from JSON)
  - cooldownMs: 5000 (default)
```

### Configuration Precedence Example

Given:

- Default: `volume = "medium"`
- JSON: `"volume": "low"`
- Env var: `CLAUDE_HOOKS_NOTIFICATION_VOLUME=high`

Result: `volume = "high"` (env var wins)

## Best Practices

1. **Start with Examples** - Copy example configurations and modify
2. **Use JSON for Static Settings** - Put stable settings in JSON files
3. **Use Env Vars for Dynamic Settings** - Override with environment variables as needed
4. **Version Control JSON Files** - Include `.claude/hooks/*.config.json` files in git
5. **Don't Version Control Env Files** - Keep .env files in .gitignore
6. **Document Custom Settings** - Add comments explaining non-standard configurations
7. **Test Configuration Changes** - Verify hooks work after configuration changes
8. **Use Debug Mode** - Enable debug logging when troubleshooting

## Troubleshooting

### Configuration Not Loading

1. Check file exists: `ls -la .claude/hooks/*.config.json`
2. Validate JSON syntax: `node -e "require('.claude/hooks/notification.config.json')"`
3. Verify file name matches pattern: `{hookName}.config.json`
4. Enable debug logging: `export CLAUDE_HOOKS_DEBUG=true`

### Environment Variables Not Working

1. Verify variable is exported: `echo $CLAUDE_HOOKS_DEBUG`
2. Check variable name spelling (case-sensitive)
3. Ensure correct pattern: `CLAUDE_HOOKS_{SETTING_NAME}`
4. Try running hooks manually with env vars to test

### Settings Not Taking Effect

1. Check configuration precedence (env vars override JSON)
2. Verify setting name matches schema
3. Check for typos in configuration keys
4. Look for validation errors in debug logs

### Platform-Specific Issues

1. macOS: Verify `afplay` command exists
2. Windows: Check PowerShell execution policy
3. Linux: Verify audio command (aplay/paplay/play) is installed
4. All: Check file paths use correct separators for platform

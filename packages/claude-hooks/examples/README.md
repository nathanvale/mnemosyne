# Claude Hooks Example Configurations

This directory contains example configurations for various Claude Code hooks. Copy and modify these examples to suit your needs.

## How to Use

### Method 1: Direct Commands (Simplest)

1. Copy an example configuration to `.claude/hooks/` directory
2. Rename it to match the hook name (e.g., `notification.config.json`)
3. Configure hooks in `.claude/settings.local.json` to use direct `npx tsx` commands
4. The hooks will automatically load their configuration

### Method 2: Hook Scripts (Legacy)

1. Copy an example configuration to your `.claude/hooks/` directory
2. Rename it to match the hook name (e.g., `notification.config.json`)
3. Create executable hook scripts if needed
4. The hook will automatically use the configuration when triggered

## Notification Hook Examples

### Basic Notification (`notification-basic.json`)

Simple sound notification when Claude needs user input.

**Usage**: Copy to `.claude/hooks/notification.config.json`

### Notification with Quiet Hours (`notification-with-quiet-hours.json`)

Includes quiet hours configuration to avoid notifications during specified times.

**Usage**: Copy to `.claude/hooks/notification.config.json`

### Speech Notification (`notification-speech.json`)

Uses macOS speech synthesis instead of sound effects (macOS only).

**Usage**: Copy to `.claude/hooks/notification.config.json`

## Stop Hook Examples

### Basic Completion (`stop-basic.json`)

Simple sound notification when Claude completes a task.

**Usage**: Copy to `.claude/hooks/stop.config.json`

### With Transcript Logging (`stop-with-transcript.json`)

Enables chat transcript logging with configurable log rotation.

**Usage**: Copy to `.claude/hooks/stop.config.json`

### Speech Completion (`stop-speech-completion.json`)

Uses speech synthesis with quiet hours support (macOS only).

**Usage**: Copy to `.claude/hooks/stop.config.json`

## Subagent Stop Hook Examples

### Basic Subagent Tracking (`subagent-stop-basic.json`)

Simple notification when subagents complete tasks.

**Usage**: Copy to `.claude/hooks/subagent-stop.config.json`

### Detailed Subagent Tracking (`subagent-stop-detailed.json`)

Comprehensive subagent tracking with metrics and long task alerts.

**Usage**: Copy to `.claude/hooks/subagent-stop.config.json`

## Quality Check Hook Examples (Legacy)

### Strict Quality Check (`quality-check-strict.json`)

Comprehensive code quality checking with auto-fixing enabled.

**Usage**: Copy to `.claude/hooks/quality-check.config.json`

### Minimal Quality Check (`quality-check-minimal.json`)

TypeScript-only checking for minimal overhead.

**Usage**: Copy to `.claude/hooks/quality-check.config.json`

## Sound Notification Hook Examples (Legacy)

### Legacy Sound Notification (`sound-notification-legacy.json`)

Basic sound notifications for task completion events.

**Usage**: Copy to `.claude/hooks/sound-notification.config.json`

## Common Configuration Options

### Volume Levels

- `"low"` - Quiet notifications
- `"medium"` - Standard volume (default)
- `"high"` - Loud notifications

### Quiet Hours Format

Time format is 24-hour (HH:MM):

```json
"quietHours": {
  "enabled": true,
  "start": "22:00",  // 10 PM
  "end": "08:00"     // 8 AM
}
```

### Cooldown Periods

Specified in milliseconds:

- `1000` = 1 second
- `2000` = 2 seconds (default)
- `5000` = 5 seconds

### Log Configuration

```json
"logDir": "~/.claude/logs",     // Log directory
"maxLogSizeMB": 10,             // Maximum log file size
"maxLogFiles": 5                // Number of rotated log files
```

## Environment Variable Override

All settings can be overridden with environment variables. See the main README.md for a complete list of supported environment variables.

## Testing Configurations

To test a configuration:

1. Set up the hook with your configuration
2. Trigger the appropriate Claude Code event
3. Check logs in your configured log directory for debugging
4. Adjust settings as needed

## Platform-Specific Notes

### macOS

- Full audio and speech synthesis support
- System sounds available (Glass.aiff, Funk.aiff, etc.)
- `say` command integration for speech

### Windows

- Audio via PowerShell and Windows Media Player
- Custom WAV file support
- No speech synthesis support

### Linux

- Audio via aplay, paplay, or play command
- Custom WAV/MP3 file support
- No speech synthesis support

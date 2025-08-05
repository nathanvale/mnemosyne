# Technical Specification

This is the technical specification for the spec detailed in @.agent-os/specs/2025-08-05-claude-hooks-enhancement/spec.md

> Created: 2025-08-05
> Version: 1.0.0

## Technical Requirements

### Cross-Platform Audio System

- **macOS**: Use `afplay` with built-in system sounds (Funk.aiff for notifications, Glass.aiff for completions)
- **Windows**: Use PowerShell `Media.SoundPlayer` for WAV file playback
- **Linux**: Implement fallback chain (aplay → paplay → play) for maximum compatibility
- **Sound File Management**: Support both system sounds and custom WAV files
- **Platform Detection**: Automatic OS detection with manual override option

### Hook Event Processing

- **Event Types**: Support Notification, Stop, and SubagentStop events from Claude Code
- **Input Processing**: Parse JSON from stdin following Claude Code hook protocol
- **Exit Codes**: Use standard codes (0=success, 1=error, 2=quality issues)
- **Async Handling**: Non-blocking execution to avoid slowing down Claude Code

### TypeScript Architecture

- **Direct Execution**: Support `npx tsx` for development without build step
- **ES Modules**: Use modern ES module syntax with proper Node.js compatibility
- **Type Safety**: Full TypeScript types for all Claude Code events and configurations
- **Standalone Executables**: Each hook as independent executable with shebang

### Event Logging System

- **JSON Format**: Structured logging with timestamps and event details
- **Log Rotation**: Automatic rotation when logs exceed size limits
- **Directory Structure**: Configurable log directories (local vs global)
- **Chat Transcripts**: Parse and store chat transcripts from Stop events
- **Event Filtering**: Configurable filters for what events to log

## Approach Options

### Option A: Extend Existing Sound Notification System

- **Pros**: Builds on existing codebase, maintains consistency, faster implementation
- **Cons**: May require significant refactoring for cross-platform support
- **Decision**: Selected - leverages existing infrastructure

### Option B: Complete Rewrite Following awesome-claude-code

- **Pros**: Direct feature parity, proven architecture
- **Cons**: Loses existing TypeScript integration, duplicates effort
- **Decision**: Not selected - but will adopt key patterns

## External Dependencies

### Required Dependencies

- **tsx (^4.20.3)** - Already in package.json for TypeScript execution
- **zod (^3.25.74)** - Already available for schema validation

### Optional Platform Dependencies

- **macOS**: None (uses built-in afplay and say commands)
- **Windows**: None (uses built-in PowerShell)
- **Linux**: aplay/paplay/play (usually pre-installed)

## Implementation Details

### Hook Registration Pattern

```typescript
// Notification Hook
{
  "type": "command",
  "command": "npx tsx /path/to/notification.ts --notify"
}

// Stop Hook
{
  "type": "command",
  "command": "npx tsx /path/to/stop.ts --chat"
}

// SubagentStop Hook
{
  "type": "command",
  "command": "npx tsx /path/to/subagent_stop.ts"
}
```

### CLI Argument Processing

- `--notify`: Enable notification sounds (Notification hook)
- `--chat`: Process chat transcripts (Stop hook)
- `--speak`: Use speech synthesis instead of sounds (macOS only)
- `--debug`: Enable debug logging

### Configuration Schema

```typescript
interface HookConfig {
  platform?: 'auto' | 'macos' | 'windows' | 'linux'
  notificationMode?: 'sound' | 'speech'
  sounds?: {
    notification?: string // Custom sound file path
    completion?: string // Custom sound file path
  }
  logging?: {
    enabled?: boolean
    directory?: string
    maxSize?: number
    retention?: number
  }
  speech?: {
    enabled?: boolean
    messages?: {
      notification?: string
      completion?: string
      subagentCompletion?: string
    }
  }
}
```

### Error Handling Strategy

- **Graceful Degradation**: If audio fails, log but don't crash
- **Platform Fallbacks**: Try multiple audio players on Linux
- **File Validation**: Check sound files exist before playing
- **Timeout Protection**: Prevent hanging on audio commands
- **Silent Failures**: In production, fail silently with debug logs

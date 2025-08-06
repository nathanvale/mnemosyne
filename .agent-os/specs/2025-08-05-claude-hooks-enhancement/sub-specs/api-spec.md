# API Specification

This is the API specification for the spec detailed in @.agent-os/specs/2025-08-05-claude-hooks-enhancement/spec.md

> Created: 2025-08-05
> Version: 1.0.0

## Hook Event APIs

### Notification Event

**Purpose:** Triggered when Claude needs user attention

**Input Structure:**

```typescript
interface NotificationEvent {
  type: 'Notification'
  data?: {
    message?: string
    priority?: 'low' | 'medium' | 'high'
    [key: string]: unknown
  }
}
```

**CLI Usage:**

```bash
echo '{"type":"Notification","data":{}}' | npx tsx notification.ts --notify
```

### Stop Event

**Purpose:** Triggered when Claude completes a task

**Input Structure:**

```typescript
interface StopEvent {
  type: 'Stop'
  transcript_path?: string // Path to chat transcript
  data?: {
    duration?: number
    task?: string
    success?: boolean
    [key: string]: unknown
  }
}
```

**CLI Usage:**

```bash
echo '{"type":"Stop","transcript_path":"/path/to/transcript"}' | npx tsx stop.ts --chat
```

### SubagentStop Event

**Purpose:** Triggered when a subagent completes its task

**Input Structure:**

```typescript
interface SubagentStopEvent {
  type: 'SubagentStop'
  data?: {
    subagentId?: string
    subagentType?: string
    result?: unknown
    [key: string]: unknown
  }
}
```

**CLI Usage:**

```bash
echo '{"type":"SubagentStop","data":{}}' | npx tsx subagent-stop.ts
```

## Configuration APIs

### Hook Configuration

**Location:** `.claude/hooks/[hook-name]/hook-config.json`

**Schema:**

```typescript
interface HookConfiguration {
  settings: {
    enabled?: boolean
    platform?: 'auto' | 'macos' | 'windows' | 'linux'
    mode?: 'sound' | 'speech'
    debug?: boolean
  }
  sounds?: {
    success?: {
      enabled?: boolean
      file?: string
      fallback?: string
    }
    warning?: {
      enabled?: boolean
      file?: string
      fallback?: string
    }
    error?: {
      enabled?: boolean
      file?: string
      fallback?: string
    }
  }
  filters?: {
    quietHours?: {
      enabled?: boolean
      start?: string // "22:00"
      end?: string // "08:00"
    }
    excludeTools?: string[]
    includeTools?: string[]
  }
  logging?: {
    enabled?: boolean
    directory?: string
    format?: 'json' | 'text'
    level?: 'debug' | 'info' | 'warn' | 'error'
  }
}
```

### Environment Variables

**Global Settings:**

- `CLAUDE_HOOKS_DEBUG` - Enable debug logging
- `CLAUDE_HOOKS_PLATFORM` - Override platform detection
- `CLAUDE_HOOKS_LOG_DIR` - Custom log directory

**Hook-Specific:**

- `CLAUDE_HOOKS_NOTIFICATION_ENABLED` - Enable/disable notification hook
- `CLAUDE_HOOKS_STOP_ENABLED` - Enable/disable stop hook
- `CLAUDE_HOOKS_SUBAGENT_ENABLED` - Enable/disable subagent hook
- `CLAUDE_HOOKS_SOUND_VOLUME` - Volume level (low/medium/high)
- `CLAUDE_HOOKS_SPEECH_ENABLED` - Enable speech mode (macOS)

## Programmatic APIs

### Package Exports

**Types:**

```typescript
// From @studio/claude-hooks/types
export interface ClaudeHookEvent {
  type: string
  data?: Record<string, unknown>
  transcript_path?: string
}

export interface HookConfiguration {
  // As defined above
}

export interface HookLogger {
  debug(message: string): void
  info(message: string): void
  warn(message: string): void
  error(message: string): void
}
```

**Utilities:**

```typescript
// From @studio/claude-hooks/utils
export function parseHookInput<T>(): Promise<T>
export function loadHookConfig(path: string): Promise<HookConfiguration>
export function createHookLogger(name: string, debug?: boolean): HookLogger
export function detectPlatform(): 'macos' | 'windows' | 'linux'
export function playSound(file: string, platform?: string): Promise<boolean>
export function speakText(text: string): Promise<boolean> // macOS only
```

**Hook Builders:**

```typescript
// From @studio/claude-hooks
export function createNotificationHook(config?: HookConfiguration): HookHandler
export function createStopHook(config?: HookConfiguration): HookHandler
export function createSubagentStopHook(config?: HookConfiguration): HookHandler

type HookHandler = (event: ClaudeHookEvent) => Promise<void>
```

## Integration Points

### Claude Code Settings

**Location:** `.claude/settings.json`

**Hook Registration:**

```json
{
  "hooks": {
    "Notification": [
      {
        "matcher": "",
        "hooks": [
          {
            "type": "command",
            "command": "npx tsx .claude/hooks/notification.ts --notify"
          }
        ]
      }
    ],
    "Stop": [
      {
        "matcher": "",
        "hooks": [
          {
            "type": "command",
            "command": "npx tsx .claude/hooks/stop.ts --chat"
          }
        ]
      }
    ],
    "SubagentStop": [
      {
        "matcher": "",
        "hooks": [
          {
            "type": "command",
            "command": "npx tsx .claude/hooks/subagent-stop.ts"
          }
        ]
      }
    ]
  }
}
```

### Log Output Format

**Event Log Entry:**

```json
{
  "timestamp": "2025-08-05T10:30:45.123Z",
  "event": "Notification",
  "data": {
    "message": "User attention needed",
    "priority": "high"
  },
  "platform": "macos",
  "sound": "Funk.aiff",
  "success": true
}
```

**Chat Transcript Entry:**

```json
{
  "timestamp": "2025-08-05T10:31:00.456Z",
  "messages": [
    {
      "role": "user",
      "content": "Create a new React component"
    },
    {
      "role": "assistant",
      "content": "I'll create a new React component for you..."
    }
  ],
  "duration": 15234,
  "success": true
}
```

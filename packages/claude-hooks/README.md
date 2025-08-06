# @studio/claude-hooks

TypeScript implementation of Claude Code hooks for task completion notifications, quality checking, and audio features.

## Overview

This package provides TypeScript implementations of Claude Code hooks:

- **Notification Hook**: Plays attention sounds when Claude needs user input
- **Stop Hook**: Plays completion sounds when Claude finishes tasks, with optional chat transcript processing
- **Subagent Stop Hook**: Tracks and notifies when Claude subagents complete their work
- **Quality Check Hook**: Runs TypeScript, ESLint, and Prettier checks on code changes

## Features

- 🎯 **Type Safety**: Full TypeScript implementation with comprehensive types
- 🧩 **Modular Architecture**: Clean separation of concerns with reusable utilities
- 🔧 **Configurable**: Environment variables and JSON configuration support
- 🎵 **Cross-Platform Audio**: macOS (afplay), Windows (PowerShell), Linux (aplay/paplay/play)
- 🗣️ **Speech Support**: macOS speech synthesis with configurable messages
- 📄 **Event Logging**: JSON-based logging with rotation and transcript processing
- ⏰ **Smart Scheduling**: Quiet hours and cooldown periods for notifications
- 🚀 **Fast**: Optimized execution with intelligent caching
- 📦 **Monorepo Ready**: Designed for Turborepo with proper caching

## Installation

This package provides TypeScript implementations of Claude Code hooks. The simplest approach is to call them directly from Claude Code settings.

### Quick Start (Simplest Approach)

1. **Install dependencies** (from repository root):

```bash
pnpm install
```

2. **Configure Claude Code settings** in `.claude/settings.local.json`:

```json
{
  "hooks": {
    "Notification": [
      {
        "matcher": "",
        "hooks": [
          {
            "type": "command",
            "command": "npx tsx packages/claude-hooks/src/notification/index.ts"
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
            "command": "npx tsx packages/claude-hooks/src/stop/index.ts"
          }
        ]
      }
    ],
    "QualityCheck": [
      {
        "matcher": "",
        "hooks": [
          {
            "type": "command",
            "command": "npx tsx packages/claude-hooks/src/quality-check/index.ts"
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
            "command": "npx tsx packages/claude-hooks/src/subagent-stop/index.ts"
          }
        ]
      }
    ]
  }
}
```

3. **Add configuration files** in `.claude/hooks/` directory:

```bash
# Create notification config
cat > .claude/hooks/notification.config.json << 'EOF'
{
  "settings": {
    "notify": true,
    "speak": false,
    "debug": false,
    "cooldownPeriod": 3000,
    "allowUrgentOverride": false,
    "quietHours": {
      "enabled": false,
      "ranges": [
        { "start": "22:00", "end": "08:00", "name": "Night" }
      ],
      "allowUrgentOverride": true
    }
  }
}
EOF

# Create stop config
cat > .claude/hooks/stop.config.json << 'EOF'
{
  "settings": {
    "chat": false,
    "speak": true,
    "debug": false
  }
}
EOF

# Create quality-check config
cat > .claude/hooks/quality-check.config.json << 'EOF'
{
  "typescript": {
    "enabled": true,
    "showDependencyErrors": false
  },
  "eslint": {
    "enabled": true,
    "autofix": true
  },
  "prettier": {
    "enabled": true,
    "autofix": true
  },
  "general": {
    "autofixSilent": true,
    "debug": false
  }
}
EOF

# Create subagent-stop config
cat > .claude/hooks/subagent-stop.config.json << 'EOF'
{
  "settings": {
    "notify": true,
    "speak": false,
    "debug": false
  }
}
EOF
```

4. **Test the hooks** - Trigger Claude Code events to verify they work

## Usage

Each hook requires:

1. A command entry in `.claude/settings.local.json`
2. A JSON configuration file in `.claude/hooks/{hookName}.config.json`

The hooks automatically load their configuration from the `.claude/hooks/` directory.

### Hook Configuration Files

| Hook Type     | Config File                               | Purpose                        |
| ------------- | ----------------------------------------- | ------------------------------ |
| Notification  | `.claude/hooks/notification.config.json`  | Alerts when Claude needs input |
| Stop          | `.claude/hooks/stop.config.json`          | Notifies when tasks complete   |
| Subagent Stop | `.claude/hooks/subagent-stop.config.json` | Tracks subagent completion     |
| Quality Check | `.claude/hooks/quality-check.config.json` | Runs code quality checks       |

### Notification Hook

Plays attention sounds when Claude needs user input.

**Configuration:**
`.claude/hooks/notification.config.json`:

```json
{
  "settings": {
    "notify": true,
    "speak": false,
    "debug": false,
    "cooldownPeriod": 3000,
    "allowUrgentOverride": false,
    "quietHours": {
      "enabled": false,
      "ranges": [{ "start": "22:00", "end": "08:00", "name": "Night" }],
      "allowUrgentOverride": true
    }
  }
}
```

**Properties:**

- `notify` - Enable sound notifications
- `speak` - Enable speech synthesis (macOS only)
- `debug` - Enable debug logging
- `cooldownPeriod` - Cooldown between notifications (ms)
- `allowUrgentOverride` - Allow urgent notifications during cooldown
- `quietHours` - Time-based notification filtering

**Features:**

- Cross-platform audio support
- macOS speech synthesis
- Quiet hours support
- Cooldown periods
- Priority-based sound selection

### Stop Hook

Plays completion sounds when Claude finishes tasks.

**Configuration:**
`.claude/hooks/stop.config.json`:

```json
{
  "settings": {
    "chat": false,
    "speak": true,
    "debug": false
  }
}
```

**Properties:**

- `chat` - Enable chat transcript processing
- `speak` - Enable speech synthesis (macOS only)
- `debug` - Enable debug logging

**Features:**

- Task completion sounds (success/error)
- Chat transcript logging
- Speech announcements (macOS)
- Platform-specific sound selection

### Subagent Stop Hook

Tracks when Claude's Task tool subagents complete their work.

**Configuration:**
`.claude/hooks/subagent-stop.config.json`:

```json
{
  "settings": {
    "notify": true,
    "speak": false,
    "debug": false
  }
}
```

**Properties:**

- `notify` - Enable notification sounds
- `speak` - Enable speech synthesis (macOS only)
- `debug` - Enable debug logging

**Features:**

- Subagent completion tracking
- Agent type formatting
- Speech announcements
- Cross-platform notifications

### Quality Check Hook

Runs comprehensive code quality checks on file changes.

**Configuration:**
`.claude/hooks/quality-check.config.json`:

```json
{
  "typescript": {
    "enabled": true,
    "showDependencyErrors": false
  },
  "eslint": {
    "enabled": true,
    "autofix": true
  },
  "prettier": {
    "enabled": true,
    "autofix": true
  },
  "general": {
    "autofixSilent": true,
    "debug": false
  }
}
```

**Properties:**

- `typescript.enabled` - Enable TypeScript type checking
- `typescript.showDependencyErrors` - Show project dependency errors
- `eslint.enabled` - Enable ESLint linting
- `eslint.autofix` - Auto-fix ESLint issues
- `prettier.enabled` - Enable Prettier formatting
- `prettier.autofix` - Auto-fix Prettier issues
- `general.autofixSilent` - Don't block when auto-fixing succeeds
- `general.debug` - Enable debug logging

**Features:**

- TypeScript type checking
- ESLint with auto-fix
- Prettier formatting
- Common issue detection ("as any", console statements)
- Silent auto-fixing

## Development

```bash
# Install dependencies
pnpm install

# Build TypeScript and bundle hooks
pnpm run build

# Run type checking
pnpm run type-check

# Run linting
pnpm run lint

# Check formatting
pnpm run format:check

# Run tests
pnpm run test
```

## Configuration System

### How Configuration Works

1. **Auto-Config Loading** - Hooks automatically load `.claude/hooks/{hookName}.config.json`
2. **Environment Variables** - Override any JSON setting using `CLAUDE_HOOKS_*` variables
3. **CLI Arguments** - Override both JSON and environment settings
4. **Defaults** - Built-in fallbacks if nothing else is specified

### Configuration Priority

```
Defaults < JSON File < Environment Variables < CLI Arguments
```

### Example Configuration Loading

The hooks use automatic configuration discovery:

1. Find project root (where `.claude/` directory exists)
2. Load `.claude/hooks/{hookName}.config.json`
3. Extract `settings` object from JSON
4. Apply environment variable overrides
5. Apply CLI argument overrides

## Architecture

The package is structured as follows:

```
src/
├── audio/              # Cross-platform audio system
│   ├── audio-player.ts # Audio playback implementation
│   └── platform.ts     # Platform detection utilities
├── config/             # Configuration management
│   ├── config-schema.ts # Zod schemas for validation
│   └── env-config.ts   # Environment variable handling
├── logging/            # Event logging system
│   ├── event-logger.ts # JSON logging with rotation
│   └── transcript-parser.ts # Chat transcript processing
├── notification/       # Attention notification hook
│   └── notification.ts # User input notification logic
├── speech/             # Speech synthesis system
│   ├── speech-engine.ts # macOS say command integration
│   ├── quiet-hours.ts  # Time-based filtering
│   └── cooldown.ts     # Rate limiting
├── stop/               # Task completion hook
│   └── stop.ts         # Task completion logic
├── subagent-stop/      # Subagent completion hook
│   └── subagent-stop.ts # Subagent tracking logic
├── quality-check/      # Code quality hook
│   ├── checkers/       # TypeScript, ESLint, Prettier checkers
│   └── config.ts       # Configuration management
├── types/              # Shared TypeScript types
│   ├── claude.ts       # Claude Code event types
│   └── config.ts       # Configuration types
├── utils/              # Shared utilities
│   └── auto-config.ts  # Automatic config loading
├── base-hook.ts        # Base hook architecture
└── index.ts            # Package exports
```

## Environment Variables

Environment variables can override any JSON configuration setting. Use the format `CLAUDE_HOOKS_{SETTING_NAME}` where `{SETTING_NAME}` is the uppercase version of the JSON property.

### Global Settings

- `CLAUDE_HOOKS_DEBUG` - Enable debug logging for all hooks

### Notification Hook

- `CLAUDE_HOOKS_NOTIFICATION_NOTIFY` - Enable sound notifications
- `CLAUDE_HOOKS_NOTIFICATION_SPEAK` - Enable speech notifications (macOS only)
- `CLAUDE_HOOKS_NOTIFICATION_COOLDOWN_PERIOD` - Cooldown between notifications (ms)
- `CLAUDE_HOOKS_NOTIFICATION_ALLOW_URGENT_OVERRIDE` - Allow urgent notifications during cooldown

### Stop Hook

- `CLAUDE_HOOKS_STOP_CHAT` - Enable chat transcript processing
- `CLAUDE_HOOKS_STOP_SPEAK` - Enable completion speech (macOS only)

### Subagent Stop Hook

- `CLAUDE_HOOKS_SUBAGENT_STOP_NOTIFY` - Enable subagent completion sounds
- `CLAUDE_HOOKS_SUBAGENT_STOP_SPEAK` - Enable speech notifications (macOS only)

### Quality Check Hook

- `CLAUDE_HOOKS_TYPESCRIPT_ENABLED` - Enable TypeScript checking
- `CLAUDE_HOOKS_SHOW_DEPENDENCY_ERRORS` - Show project dependency errors
- `CLAUDE_HOOKS_ESLINT_ENABLED` - Enable ESLint checking
- `CLAUDE_HOOKS_ESLINT_AUTOFIX` - Enable ESLint auto-fixing
- `CLAUDE_HOOKS_PRETTIER_ENABLED` - Enable Prettier checking
- `CLAUDE_HOOKS_PRETTIER_AUTOFIX` - Enable Prettier auto-fixing
- `CLAUDE_HOOKS_AUTOFIX_SILENT` - Don't block when auto-fixing succeeds

## CLI Arguments

The hooks support command-line flags that override both JSON and environment configuration:

### Common Arguments

- `--debug` - Enable debug logging

### Notification Hook

- `--notify` - Enable notification sounds
- `--speak` - Enable speech synthesis (macOS only)

### Stop Hook

- `--chat` - Enable chat transcript processing
- `--speak` - Enable speech synthesis (macOS only)

### Subagent Stop Hook

- `--notify` - Enable notification sounds
- `--speak` - Enable speech synthesis (macOS only)

## Testing

Tests are written using Vitest and can be run with:

```bash
pnpm test
```

Tests cover:

- Cross-platform audio functionality
- Event parsing and processing
- Configuration validation
- Speech synthesis (macOS)
- Logging and transcript processing
- Error handling and edge cases

## Build Process

The build process:

1. Compiles TypeScript to JavaScript
2. Bundles each hook with esbuild
3. Outputs CommonJS files with proper shebangs
4. Creates executable hook files in `hooks/` directory

## License

Private - Part of the mnemosyne monorepo

# Claude Hooks Deployment Guide

This guide explains how to deploy and configure Claude Code hooks in your project.

## Quick Setup (Recommended)

### Step 1: Configure Claude Settings

Create or update `.claude/settings.local.json`:

```json
{
  "$schema": "https://json.schemastore.org/claude-code-settings.json",
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
            "command": "npx tsx packages/claude-hooks/src/stop/index.ts --chat"
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
    ],
    "PostToolUse": [
      {
        "matcher": "Write|Edit|MultiEdit",
        "hooks": [
          {
            "type": "command",
            "command": "npx tsx packages/claude-hooks/src/quality-check/index.ts"
          }
        ]
      }
    ]
  }
}
```

### Step 2: Add Configuration Files

Create configuration files in `.claude/hooks/`:

```bash
# Create the hooks directory
mkdir -p .claude/hooks

# Notification configuration
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

# Stop hook configuration
cat > .claude/hooks/stop.config.json << 'EOF'
{
  "settings": {
    "chat": false,
    "speak": true,
    "debug": false
  }
}
EOF

# Subagent stop configuration
cat > .claude/hooks/subagent-stop.config.json << 'EOF'
{
  "settings": {
    "notify": true,
    "speak": false,
    "debug": false
  }
}
EOF

# Quality check configuration
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
```

### Step 3: Test Your Setup

The hooks will automatically run when Claude Code triggers events. To test manually:

```bash
# Test notification hook
echo '{"type": "Notification", "data": {}}' | npx tsx packages/claude-hooks/src/notification/index.ts

# Test stop hook
echo '{"type": "Stop", "data": {}}' | npx tsx packages/claude-hooks/src/stop/index.ts

# Test with debug logging
export CLAUDE_HOOKS_DEBUG=true
echo '{"type": "Notification", "data": {}}' | npx tsx packages/claude-hooks/src/notification/index.ts
```

## Alternative: Simple Script Files

If you prefer executable scripts instead of direct commands, create simple bash scripts:

```bash
# Notification script
cat > .claude/hooks/notification << 'EOF'
#!/usr/bin/env bash
cd "$(dirname "$0")/../.." && npx tsx packages/claude-hooks/src/notification/index.ts
EOF
chmod +x .claude/hooks/notification

# Stop script
cat > .claude/hooks/stop << 'EOF'
#!/usr/bin/env bash
cd "$(dirname "$0")/../.." && npx tsx packages/claude-hooks/src/stop/index.ts
EOF
chmod +x .claude/hooks/stop
```

## Configuration System

### Configuration Loading Priority

1. **Built-in defaults** - Sensible defaults for all settings
2. **JSON configuration** - Settings from `.claude/hooks/{hookName}.config.json`
3. **Environment variables** - Override any setting at runtime

### Environment Variable Overrides

Override any setting using environment variables:

```bash
# Debug logging for all hooks
export CLAUDE_HOOKS_DEBUG=true

# Notification-specific settings
export CLAUDE_HOOKS_NOTIFICATION_NOTIFY=true
export CLAUDE_HOOKS_NOTIFICATION_SPEAK=false
export CLAUDE_HOOKS_NOTIFICATION_COOLDOWN_PERIOD=5000

# Quality check settings
export CLAUDE_HOOKS_TYPESCRIPT_ENABLED=true
export CLAUDE_HOOKS_ESLINT_AUTOFIX=false
```

## Hook Types and Events

| Hook Type    | Claude Event   | Purpose                            |
| ------------ | -------------- | ---------------------------------- |
| Notification | `Notification` | Alert when Claude needs input      |
| Stop         | `Stop`         | Notify when tasks complete         |
| SubagentStop | `SubagentStop` | Track subagent completion          |
| PostToolUse  | After tool use | Run quality checks on code changes |

## File Structure

```
.claude/
├── settings.local.json          # Claude Code settings
└── hooks/
    ├── notification.config.json # Notification hook config
    ├── stop.config.json        # Stop hook config
    ├── subagent-stop.config.json # Subagent stop config
    └── quality-check.config.json # Quality check config
```

## Troubleshooting

### Hook Not Running

1. **Check Claude settings** - Verify `.claude/settings.local.json` is properly formatted
2. **Verify dependencies** - Run `pnpm install` from repository root
3. **Test manually** - Use the test commands above
4. **Enable debug logging** - Set `CLAUDE_HOOKS_DEBUG=true`

### Configuration Not Loading

1. **Validate JSON** - Check syntax with `node -e "require('.claude/hooks/notification.config.json')"`
2. **Check file location** - Ensure config files are in `.claude/hooks/` directory
3. **View debug output** - Enable debug logging to see what's being loaded

### Audio Not Playing

- **macOS**: Verify `afplay` command exists
- **Windows**: Check PowerShell availability
- **Linux**: Install `aplay`, `paplay`, or `play`

## Advanced Configuration

### Quiet Hours

Prevent notifications during specific times:

```json
{
  "settings": {
    "quietHours": {
      "enabled": true,
      "ranges": [
        { "start": "22:00", "end": "08:00", "name": "Night" },
        { "start": "12:00", "end": "13:00", "name": "Lunch" }
      ],
      "allowUrgentOverride": false
    }
  }
}
```

### Speech Synthesis (macOS)

Enable speech announcements:

```json
{
  "settings": {
    "speak": true,
    "speechMessage": "Task completed",
    "speechVoice": "Samantha",
    "speechRate": 200
  }
}
```

### Cooldown Periods

Prevent notification spam:

```json
{
  "settings": {
    "cooldownPeriod": 5000,
    "allowUrgentOverride": true
  }
}
```

## Verification Script

Use the provided script to verify your setup:

```bash
bash .claude/verify-hooks.sh
```

This will check:

- Configuration files are valid JSON
- Hook commands are properly configured
- Required dependencies are installed

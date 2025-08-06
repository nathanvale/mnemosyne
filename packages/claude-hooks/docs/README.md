# Claude Hooks Documentation

Complete documentation for the `@studio/claude-hooks` package.

## 📚 Documentation Structure

### Getting Started

- **[Main README](../README.md)** - Package overview and quick start guide
- **[Examples](../examples/README.md)** - Example configurations for all hook types

### Detailed Guides

- **[DEPLOYMENT.md](./DEPLOYMENT.md)** - Complete deployment instructions
- **[CONFIGURATION.md](./CONFIGURATION.md)** - Full configuration reference

## 🚀 Quick Start

### 1. Configure Claude Settings

Add hooks to `.claude/settings.local.json`:

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

### 2. Add Configuration Files

Create config files in `.claude/hooks/`:

```bash
# Notification config
cat > .claude/hooks/notification.config.json << 'EOF'
{
  "settings": {
    "notify": true,
    "speak": false,
    "cooldownPeriod": 3000
  }
}
EOF

# Stop hook config
cat > .claude/hooks/stop.config.json << 'EOF'
{
  "settings": {
    "chat": false,
    "speak": true,
    "debug": false
  }
}
EOF
```

### 3. Test Your Setup

The hooks will automatically run when Claude Code triggers their events.

## 🔧 Configuration System

Configuration is loaded in this priority order:

1. **Default values** (built-in)
2. **JSON files** (`.claude/hooks/{hookName}.config.json`)
3. **Environment variables** (override everything)

Environment variables follow the pattern: `CLAUDE_HOOKS_{SETTING_NAME}`
Example: `CLAUDE_HOOKS_DEBUG=true`

## 📝 Hook Types

### Notification Hook

- **Event**: User prompt required
- **Features**: Sound, speech (macOS), quiet hours, cooldown
- **Config Key**: `notification`

### Stop Hook

- **Event**: Task completion
- **Features**: Sound, transcript logging, speech (macOS)
- **Config Key**: `stop`
- **CLI Flags**: `--chat` for transcript processing

### Subagent Stop Hook

- **Event**: Subagent task completion
- **Features**: Metrics tracking, long-running alerts
- **Config Key**: `subagent`

### Quality Check Hook

- **Event**: File changes
- **Features**: TypeScript, ESLint, Prettier, auto-fix
- **Config Key**: `quality`

## 🎯 Common Use Cases

### Example Configurations

**Development Mode:**

```json
{
  "settings": {
    "notify": true,
    "speak": false,
    "cooldownPeriod": 1000,
    "debug": true
  }
}
```

**Production Mode with Quiet Hours:**

```json
{
  "settings": {
    "notify": true,
    "quietHours": {
      "enabled": true,
      "ranges": [
        {
          "start": "22:00",
          "end": "08:00",
          "name": "Night"
        }
      ]
    }
  }
}
```

## 🔍 Debugging

### Enable Debug Logging

```bash
export CLAUDE_HOOKS_DEBUG=true
```

### Check Configuration Loading

The debug output shows which settings are being used and their source:

- `(from JSON)` - Loaded from `.claude/hooks/{hookName}.config.json`
- `(from env var)` - Environment variable override
- `(default)` - Built-in default value

### Test Individual Hooks

```bash
# Test notification hook
echo '{"type": "Notification", "data": {}}' | \
  npx tsx packages/claude-hooks/src/notification/index.ts

# Test stop hook
echo '{"type": "Stop", "data": {}}' | \
  npx tsx packages/claude-hooks/src/stop/index.ts
```

## 🌟 Best Practices

1. **Start Simple** - Begin with basic configurations
2. **Use JSON for Stable Settings** - Configuration that rarely changes
3. **Use Env Vars for Dynamic Settings** - Temporary overrides
4. **Test Incrementally** - Test each hook individually
5. **Monitor Logs** - Check `~/.claude/logs/` for events
6. **Respect Quiet Hours** - Configure for your schedule
7. **Adjust Cooldowns** - Prevent notification fatigue

## 🆘 Troubleshooting

### Hook Not Triggering

- Check Claude Code settings in `.claude/settings.local.json`
- Verify TypeScript dependencies are installed: `pnpm install`
- Enable debug logging to see what's happening

### Configuration Not Loading

- Validate JSON syntax: `node -e "require('.claude/hooks/notification.config.json')"`
- Check file exists in `.claude/hooks/` directory
- Enable debug logging with `export CLAUDE_HOOKS_DEBUG=true`

### Sound Not Playing

- macOS: Verify `afplay` command exists
- Windows: Check PowerShell availability
- Linux: Install `aplay`, `paplay`, or `play`

## 📦 Package Structure

```
packages/claude-hooks/
├── src/                    # TypeScript source code
│   ├── notification/       # Notification hook
│   ├── stop/              # Stop hook
│   ├── subagent-stop/     # Subagent stop hook
│   ├── quality-check/     # Quality check hook
│   ├── sound-notification/# Sound notification hook
│   └── ...               # Shared utilities
├── examples/              # Example configurations
├── docs/                  # This documentation
└── README.md             # Main package README
```

## 🔗 Related Resources

- [Claude Code Documentation](https://docs.anthropic.com/en/docs/claude-code)
- [TypeScript Documentation](https://www.typescriptlang.org/)
- [Node.js Child Process](https://nodejs.org/api/child_process.html)

## 📄 License

Private - Part of the mnemosyne monorepo

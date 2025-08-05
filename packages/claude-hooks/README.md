# @studio/claude-hooks

TypeScript implementation of Claude Code hooks for quality checking and sound notifications.

## Overview

This package provides TypeScript implementations of Claude Code hooks:

- **Quality Check Hook**: Runs TypeScript, ESLint, and Prettier checks on code changes
- **Sound Notification Hook**: Plays notification sounds when tasks complete

## Features

- 🎯 **Type Safety**: Full TypeScript implementation with comprehensive types
- 🧩 **Modular Architecture**: Clean separation of concerns with reusable utilities
- 🔧 **Configurable**: Environment variables and JSON configuration support
- 🚀 **Fast**: Compiled to optimized CommonJS for quick execution
- 📦 **Monorepo Ready**: Designed for Turborepo with proper caching

## Installation

This package is part of the mnemosyne monorepo. The hooks are **automatically set up** when you run `pnpm install` in the repository root.

### Automatic Setup (Recommended)

```bash
# From repository root - hooks are set up automatically
pnpm install
```

### Manual Setup

If you need to manually set up or rebuild the hooks:

```bash
# From repository root
pnpm setup:hooks

# Or from this package directory
pnpm setup
```

## Usage

Once set up, the hooks are symlinked to `.claude/hooks/` directories and will be executed automatically by Claude Code when configured.

### Quality Check Hook

Runs on React app changes to ensure code quality:

```json
// .claude/hooks/react-app/hook-config.json
{
  "settings": {
    "typescriptEnabled": true,
    "eslintEnabled": true,
    "prettierEnabled": true,
    "autofixEnabled": true
  }
}
```

### Sound Notification Hook

Plays sounds when tasks complete:

```json
// .claude/hooks/task-completion/hook-config.json
{
  "settings": {
    "playOnSuccess": true,
    "volume": "medium",
    "cooldown": 2000
  }
}
```

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

## Architecture

The package is structured as follows:

```
src/
├── quality-check/       # Quality check hook implementation
│   ├── checkers/       # TypeScript, ESLint, Prettier checkers
│   ├── config.ts       # Configuration management
│   └── index.ts        # Main entry point
├── sound-notification/  # Sound notification hook
│   ├── config.ts       # Configuration management
│   └── index.ts        # Main entry point
├── types/              # Shared TypeScript types
├── utils/              # Shared utilities
└── index.ts            # Package exports
```

## Environment Variables

### Quality Check Hook

- `CLAUDE_HOOKS_TYPESCRIPT_ENABLED` - Enable TypeScript checking
- `CLAUDE_HOOKS_ESLINT_ENABLED` - Enable ESLint checking
- `CLAUDE_HOOKS_PRETTIER_ENABLED` - Enable Prettier checking
- `CLAUDE_HOOKS_ESLINT_AUTOFIX` - Enable ESLint auto-fixing
- `CLAUDE_HOOKS_PRETTIER_AUTOFIX` - Enable Prettier auto-fixing
- `CLAUDE_HOOKS_DEBUG` - Enable debug logging

### Sound Notification Hook

- `CLAUDE_HOOKS_SOUND_SUCCESS` - Play sound on success
- `CLAUDE_HOOKS_SOUND_WARNING` - Play sound on warnings
- `CLAUDE_HOOKS_SOUND_ERROR` - Play sound on errors
- `CLAUDE_HOOKS_SOUND_VOLUME` - Volume level (low/medium/high)
- `CLAUDE_HOOKS_SOUND_DELAY` - Delay before playing (ms)
- `CLAUDE_HOOKS_SOUND_COOLDOWN` - Cooldown between sounds (ms)
- `CLAUDE_HOOKS_DEBUG` - Enable debug logging

## Testing

Tests are written using Vitest and can be run with:

```bash
pnpm test
```

## Build Process

The build process:

1. Compiles TypeScript to JavaScript
2. Bundles each hook with esbuild
3. Outputs CommonJS files with proper shebangs
4. Creates executable hook files in `hooks/` directory

## License

Private - Part of the mnemosyne monorepo

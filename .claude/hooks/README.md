# Claude Code Hooks Configuration

This directory contains universal hook scripts that work for any user who clones this repository.

## Setup Instructions

### Option 1: Use the Universal Hook Script (Recommended)

In your Claude Code settings, configure your hooks to use:

```
.claude/hooks/universal-stop-hook.sh
```

This script will automatically find the correct `packages/claude-hooks` directory regardless of:
- Your username
- Where you cloned the repository  
- What directory you're currently in

### Option 2: Direct Command (If in Project Root)

If you're always working from the project root, you can use:

```
npx tsx packages/claude-hooks/src/stop/index.ts --chat
```

## How It Works

The `universal-stop-hook.sh` script:
1. Searches for `packages/claude-hooks` from your current directory
2. Looks for the monorepo root (identified by `pnpm-workspace.yaml`)
3. Tries common relative paths as fallback
4. Runs the actual hook with all arguments passed through

## Available Hooks

- `universal-stop-hook.sh` - Runs when Claude completes a task
- More hooks can be added following the same pattern

## Troubleshooting

If you see "Could not find packages/claude-hooks directory":
- Make sure you're running Claude Code from within the mnemosyne repository
- Verify that `packages/claude-hooks` exists in your clone

## For Contributors

When adding new hooks:
1. Create the hook implementation in `packages/claude-hooks/src/`
2. Add a universal wrapper script in `.claude/hooks/`
3. Follow the pattern in `universal-stop-hook.sh`
4. Update this README with the new hook
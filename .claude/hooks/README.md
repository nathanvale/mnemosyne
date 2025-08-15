# Claude Hooks Configuration

This directory contains configuration and scripts for Claude Code hooks.

## Development vs Production Mode

The monorepo uses a dual consumption architecture that allows packages to be consumed in two ways:

### Development Mode
- Uses TypeScript source files directly (no compilation needed)
- Faster iteration with hot reload
- Perfect for active development

To run hooks in development mode:
```bash
./.claude/hooks/stop-dev.sh [arguments]
```

### Production Mode  
- Uses compiled JavaScript binaries
- Optimized for performance
- Used for installed packages

To run hooks in production mode:
```bash
./.claude/hooks/stop-prod.sh [arguments]
# OR just use the installed binary directly:
npx claude-hooks-stop [arguments]
```

## Configuration Files

- `stop.config.json` - Stop hook configuration
- `quality-check.config.json` - Quality check hook configuration  
- `notification.config.json` - Notification configuration
- `subagent-stop.config.json` - Subagent stop hook configuration

## Troubleshooting

### Module Resolution Issues

If you encounter errors like "Cannot find module", ensure:

1. **In development**: NODE_ENV is set to "development"
2. **In production**: Packages are built with `pnpm build`
3. **ES modules**: All relative imports have `.js` extensions

### Building for Production

To rebuild the hooks for production use:
```bash
pnpm --filter @studio/claude-hooks build
```

## Architecture

The dual consumption architecture means:
- **Development**: Direct TypeScript execution via tsx
- **Production**: Compiled JavaScript with proper ES module imports
- **No build step needed during development**
- **Instant hot reload for faster iteration**
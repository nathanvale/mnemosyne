# Automatic Environment Variable Loading

Claude Hooks automatically loads environment variables from `.env` files in your monorepo, similar to how Next.js handles environment variables. This means you no longer need to manually export environment variables before running CLI commands.

## How It Works

1. **Automatic Detection**: When any Claude Hooks CLI command is executed, it automatically finds and loads the `.env` file from your monorepo root.

2. **Monorepo Aware**: The env-loader utility searches for monorepo markers (`pnpm-workspace.yaml`, `turbo.json`, `.git`) to find the root directory, ensuring it works from any directory within your monorepo.

3. **Test Mode Support**: When running tests (detected via `NODE_ENV=test` or Vitest), the system automatically loads `.env.example` instead of `.env` to ensure test-safe values are used.

4. **Environment Variable Substitution**: Supports `${VAR_NAME}` syntax in configuration files for dynamic value replacement.

## File Structure

```text
monorepo-root/
├── .env                 # Your actual API keys (git-ignored)
├── .env.example         # Example values for testing and documentation
└── packages/
    └── claude-hooks/
        ├── src/
        │   ├── utils/
        │   │   └── env-loader.ts    # Core environment loading logic
        │   └── bin/
        │       └── *.ts              # CLI entry points with env-loader import
        └── vitest.setup.ts           # Test setup that loads .env.example
```

## Usage

### For CLI Commands

Simply run any Claude Hooks command without setting environment variables:

```bash
# No need for: export OPENAI_API_KEY=sk-...
# Just run:
npx claude-hooks-stop

# Works from any directory in the monorepo
cd apps/my-app
npx claude-hooks-notification
```

### For Tests

Tests automatically use `.env.example` values:

```bash
# Tests use test-safe values from .env.example
pnpm test

# Vitest setup ensures no real API keys are used in tests
```

### Environment Variable Substitution

Use `${VAR_NAME}` syntax in configuration files:

```json
{
  "apiKey": "${OPENAI_API_KEY}",
  "provider": "${CLAUDE_HOOKS_TTS_PROVIDER}"
}
```

## Configuration Files

### .env (Production)

Your actual API keys and configuration:

```env
OPENAI_API_KEY=sk-proj-actual-key-here
ELEVENLABS_API_KEY=sk_actual-elevenlabs-key
CLAUDE_HOOKS_TTS_PROVIDER=openai
```

### .env.example (Testing)

Test-safe values that are committed to the repository:

```env
OPENAI_API_KEY=test-openai-key
ELEVENLABS_API_KEY=test-elevenlabs-key
CLAUDE_HOOKS_TTS_PROVIDER=macos
```

## Implementation Details

### Core Components

1. **env-loader.ts**: Main utility that handles environment loading
   - `findMonorepoRoot()`: Locates the monorepo root directory
   - `isTestMode()`: Detects if running in test environment
   - `loadEnv()`: Loads appropriate .env file based on context
   - `substituteEnvVars()`: Replaces ${VAR} patterns with actual values

2. **vitest.setup.ts**: Test setup file
   - Clears existing environment variables
   - Loads .env.example with override
   - Verifies test-safe values are used

3. **CLI Entry Points**: All bin/\*.ts files import env-loader
   - Import happens before any other code
   - Ensures environment is loaded before main logic

### Test Mode Detection

The system detects test mode via:

- `NODE_ENV === 'test'`
- `VITEST === 'true'`
- `VITEST_WORKER_ID` is defined
- `JEST_WORKER_ID` is defined

### Fallback Logic

1. In test mode: Load `.env.example` if it exists
2. In production: Load `.env` if it exists
3. Fallback: Load `.env.example` if `.env` doesn't exist
4. Error: Neither file exists

## Benefits

1. **Developer Experience**: No need to manually export variables
2. **Test Safety**: Tests never use real API keys
3. **Monorepo Support**: Works from any directory
4. **Next.js Compatibility**: Familiar pattern for Next.js developers
5. **Type Safety**: Full TypeScript support with interfaces

## Migration Guide

If you're upgrading from a version without automatic env loading:

1. Create `.env.example` with test values
2. Update `.gitignore` to exclude `.env`
3. Remove manual `export` commands from your scripts
4. Run tests to verify they use `.env.example` values

## Claude Code Integration

### Setting Environment Variables in Claude Code

Claude Code users can configure environment variables directly in their settings file instead of using .env files:

#### Option 1: Use settings.json for team consistency

```json
{
  "env": {
    "OPENAI_API_KEY": "sk-proj-...",
    "ELEVENLABS_API_KEY": "sk_...",
    "CLAUDE_HOOKS_TTS_PROVIDER": "openai"
  }
}
```

#### Option 2: Prevent Claude from reading sensitive .env files

```json
{
  "permissions": {
    "deny": ["Read(./.env)", "Read(./.env.*)", "Read(./secrets/**)"]
  }
}
```

This approach:

- Keeps sensitive data out of Claude's context
- Relies on the automatic env loading from .env files
- Prevents accidental exposure of API keys

### Best Practices for Claude Code

1. **Team Settings**: Use `settings.json` to share non-sensitive defaults
2. **Local Secrets**: Keep API keys in `.env` (git-ignored)
3. **Permissions**: Consider using `permissions.deny` for extra security
4. **Testing**: Always use `.env.example` values in tests

## Troubleshooting

### Environment variables not loading

- Check that `.env` or `.env.example` exists in monorepo root
- Verify file permissions allow reading
- Enable debug mode: `CLAUDE_HOOKS_DEBUG=true`

### Wrong values in tests

- Ensure `vitest.setup.ts` is configured in `vitest.config.ts`
- Check that `.env.example` has all required variables
- Verify test mode detection is working

### Variable substitution not working

- Check syntax: `${VAR_NAME}` not `$VAR_NAME`
- Ensure variable exists in environment
- Debug with `console.log(process.env.VAR_NAME)`

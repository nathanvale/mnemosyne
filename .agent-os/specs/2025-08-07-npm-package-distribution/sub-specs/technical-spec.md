# Technical Specification

This is the technical specification for the spec detailed in @.agent-os/specs/2025-08-07-npm-package-distribution/spec.md

> Created: 2025-08-07
> Version: 1.0.0

## Technical Requirements

### Build System Configuration

- TypeScript compilation target: ES2022 with ES modules
- Output directory: `dist/` at package root
- Source maps: Generated for debugging support
- Type definitions: Generated `.d.ts` files for TypeScript consumers
- Module format: ES modules only (matching monorepo strategy)

### Bin Entry Architecture

- Entry point location: `src/bin/` directory
- Shebang strategy: Dual shebang support via build process
  - Development: `#!/usr/bin/env tsx` for TypeScript execution
  - Production: `#!/usr/bin/env node` for JavaScript execution
- File naming: `claude-hooks-[command].ts` (e.g., `claude-hooks-stop.ts`)
- Execution flow: Bin file → Import main function → Execute with error handling

### Package.json Structure

```json
{
  "name": "@studio/claude-hooks",
  "type": "module",
  "exports": {
    ".": "./src/index.ts",
    "./stop": "./src/stop/index.ts",
    "./notification": "./src/notification/index.ts"
  },
  "bin": {
    "claude-hooks-stop": "./src/bin/claude-hooks-stop.ts",
    "claude-hooks-notification": "./src/bin/claude-hooks-notification.ts",
    "claude-hooks-quality": "./src/bin/claude-hooks-quality.ts",
    "claude-hooks-subagent": "./src/bin/claude-hooks-subagent.ts"
  },
  "scripts": {
    "build": "tsc && npm run fix-shebangs",
    "fix-shebangs": "node scripts/fix-shebangs.js",
    "prepublishOnly": "pnpm build"
  }
}
```

### Published Package Structure

After build, the published package.json will be modified to point to compiled files:

```json
{
  "exports": {
    ".": "./dist/index.js",
    "./stop": "./dist/stop/index.js"
  },
  "bin": {
    "claude-hooks-stop": "./dist/bin/claude-hooks-stop.js"
  }
}
```

## Approach Options

### Option A: Manual Build Process

- Pros: Full control, simple to understand, no additional dependencies
- Cons: More maintenance, potential for errors, manual shebang fixing
- Implementation: TypeScript + custom scripts

### Option B: Bundler (esbuild/rollup) (Selected)

- Pros: Automatic shebang handling, tree-shaking, optimized output, handles edge cases
- Cons: Additional dependency, more complex configuration
- Implementation: esbuild for speed and simplicity
- **Rationale**: esbuild provides the best balance of speed, simplicity, and features. It automatically handles shebangs, produces optimized output, and integrates well with TypeScript.

### Option C: Keep Current Approach

- Pros: No changes needed, already working
- Cons: Platform-specific scripts, complex setup, not standard npm pattern
- Status: Rejected due to distribution limitations

## External Dependencies

### Build Dependencies (devDependencies)

- **esbuild** (^0.19.0) - Fast bundler for building bin files
  - **Justification**: Handles shebang preservation, fast builds, TypeScript support, minimal configuration
- **@types/node** (already present) - Node.js type definitions
  - **Justification**: Required for TypeScript compilation of Node.js code

### Runtime Dependencies

No new runtime dependencies required. The package will continue to use:

- `tsx` - For development-time TypeScript execution (peer dependency)
- `openai` - For OpenAI TTS provider (already present)
- `zod` - For configuration validation (already present)
- `micromatch` - For pattern matching (already present)

## Configuration Resolution

The existing configuration resolution logic in `auto-config.ts` will continue to work:

1. Search from `process.cwd()` upward
2. Check these locations in order:
   - `$CLAUDE_HOOKS_CONFIG_DIR/[hook].config.json` (env override)
   - `[monorepo-root]/.claude/hooks/[hook].config.json`
   - `[project-root]/.claude/hooks/[hook].config.json`
   - `[cwd]/.claude/hooks/[hook].config.json`
   - `~/.claude/hooks/[hook].config.json` (user home)

This works identically whether running from:

- Source in monorepo (`tsx src/bin/claude-hooks-stop.ts`)
- Installed globally (`claude-hooks-stop`)
- Via npx (`npx @studio/claude-hooks claude-hooks-stop`)

## Cross-Platform Compatibility

### Windows Support

- Shebangs ignored by Windows, npm creates `.cmd` wrappers automatically
- Use `node:` protocol for Node.js built-in imports
- Avoid Unix-specific commands in scripts

### macOS/Linux Support

- Shebangs properly handled by the system
- Executable permissions set by npm during installation
- Standard Unix behavior

### Path Handling

- Use `node:path` for all path operations
- Use `fileURLToPath` for `import.meta.url` conversions
- Avoid hardcoded path separators

## Build Process Details

### Development Build Flow

1. No build needed - tsx executes TypeScript directly
2. Bin files have `#!/usr/bin/env tsx` shebang
3. pnpm creates symlinks in `node_modules/.bin/`

### Production Build Flow

1. Run `pnpm build`
2. TypeScript compiles to `dist/`
3. esbuild processes bin files:
   - Preserves/adds `#!/usr/bin/env node` shebang
   - Bundles dependencies if needed
   - Outputs to `dist/bin/`
4. Update package.json paths for publishing

### NPM Publishing Preparation

1. `prepublishOnly` script runs build
2. `.npmignore` excludes source files (optional)
3. Package.json transformed to point to dist
4. Ready for `npm publish`

## Testing Strategy

### Local Testing

- `npm pack` to create tarball
- `npm install [tarball]` in test project
- Verify commands work correctly

### Monorepo Testing

- `pnpm install` should create working symlinks
- Commands should execute TypeScript source
- Hot reload should work during development

### CI Testing

- Build package in CI
- Install in fresh environment
- Run smoke tests for each command

# Tests Specification

This is the tests coverage details for the spec detailed in @.agent-os/specs/2025-08-07-npm-package-distribution/spec.md

> Created: 2025-08-07
> Version: 1.0.0

## Test Coverage

### Unit Tests

**Bin Entry Files (`src/bin/__tests__/`)**

- Each bin file properly imports and calls the main function
- Error handling and exit codes work correctly
- Command-line arguments are passed through properly
- Process stdin is handled correctly for hook events

**Build Configuration (`scripts/__tests__/`)**

- Shebang fixing script correctly updates files
- Build output structure matches expectations
- Package.json modifications for publishing work correctly

**Config Resolution (`src/utils/__tests__/auto-config.test.ts`)**

- Config finding works from various working directories
- Environment variable override (`CLAUDE_HOOKS_CONFIG_DIR`) works
- Monorepo root detection functions correctly
- Project root detection functions correctly
- Fallback to home directory works

### Integration Tests

**Command Execution**

- `claude-hooks-stop` executes and processes events correctly
- `claude-hooks-notification` handles notification events
- `claude-hooks-quality` performs quality checks on file changes
- `claude-hooks-subagent` processes subagent events
- All commands handle missing config files gracefully
- All commands respect debug flags and environment variables

**Monorepo Compatibility**

- Commands work when run from monorepo root
- Commands work when run from package directory
- Commands work when run from any subdirectory
- TypeScript source execution works via tsx
- Changes to source files are immediately reflected

**NPM Package Installation**

- `npm pack` creates valid tarball
- Local installation via tarball works
- Global installation creates working commands
- `npx` execution works without installation
- Commands find config files after installation

### Cross-Platform Tests

**Windows Compatibility**

- Commands work via npm-created .cmd wrappers
- Path resolution works with Windows paths
- Config file finding works with Windows home directory
- No Unix-specific command failures

**macOS/Linux Compatibility**

- Shebangs are properly recognized
- Executable permissions are set correctly
- Commands work from any shell (bash, zsh, fish)
- Symlinks work correctly in development

### Build Tests

**TypeScript Compilation**

- All TypeScript files compile without errors
- Type definitions are generated correctly
- Source maps are generated and valid
- No type errors in generated .d.ts files

**esbuild Bundling**

- Bin files are bundled correctly
- Shebangs are preserved/added properly
- No missing dependencies in bundles
- Output size is reasonable

**Package Structure**

- `dist/` directory has correct structure
- All necessary files are included
- No source files leaked to dist (if using .npmignore)
- Package.json modifications are correct

### End-to-End Tests

**Developer Workflow**

1. Clone monorepo
2. Run `pnpm install`
3. Run `claude-hooks-stop` command
4. Modify source file
5. Run command again and see changes

**User Installation Workflow**

1. Run `npm install -g @studio/claude-hooks` (from local pack)
2. Create `.claude/hooks/stop.config.json`
3. Run `claude-hooks-stop` with test event
4. Verify correct output and behavior

**Claude Code Integration**

1. Install package (globally or locally)
2. Configure `.claude/settings.local.json` with simple commands
3. Trigger hook events
4. Verify hooks execute correctly

### Performance Tests

**Command Startup Time**

- Measure time from command invocation to first output
- Should be under 500ms for simple operations
- TypeScript (dev) vs JavaScript (prod) performance comparison

**Config Resolution Performance**

- Config finding should be under 50ms
- Caching should prevent repeated file system traversal
- Large directory trees should not cause timeouts

### Mocking Requirements

**File System Mocking**

- Mock file system for config resolution tests
- Mock home directory for cross-platform tests
- Mock monorepo structure for detection tests

**Process Mocking**

- Mock `process.cwd()` for different working directories
- Mock `process.env` for environment variable tests
- Mock `process.exit()` for error handling tests
- Mock `process.stdin` for event input tests

**External Service Mocking**

- Mock OpenAI API for TTS tests (already exists)
- Mock `afplay` command for audio playback tests
- Mock system commands for cross-platform tests

## Test Execution Strategy

### Local Development

```bash
# Run all tests
pnpm test

# Run specific test file
pnpm test src/bin/__tests__/claude-hooks-stop.test.ts

# Run with coverage
pnpm test --coverage
```

### Continuous Integration

```bash
# Full test suite with coverage
pnpm test:ci

# Build and test package
pnpm build
npm pack
# Install and test in isolated environment
```

### Manual Testing Checklist

- [ ] Commands work in monorepo after `pnpm install`
- [ ] Package builds successfully with `pnpm build`
- [ ] `npm pack` creates valid tarball
- [ ] Tarball installs correctly in separate project
- [ ] Global install creates working commands
- [ ] Commands work on Windows (if available)
- [ ] Commands work on macOS
- [ ] Commands work on Linux (if available)
- [ ] Config files are found correctly
- [ ] Claude Code integration works

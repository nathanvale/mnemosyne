# Tests Specification

This is the tests coverage details for the spec detailed in @.agent-os/specs/2025-08-07-turborepo-build-test-optimization/spec.md

> Created: 2025-08-07
> Version: 1.0.0

## Test Coverage

### Unit Tests

**Existing Unit Tests (Maintained)**

- All tests in `src/**/__tests__/*.test.ts` remain unchanged
- Continue testing source TypeScript files directly
- Run via `pnpm test` using main vitest.config.ts

**Build Configuration Tests**

- Verify TypeScript compilation outputs
- Validate source maps generation
- Check declaration files generation
- Test bin file compilation and shebangs

**Integration Tests**

- Verify bin commands execute without module errors
- Test package exports work from compiled dist
- Validate dual environment compatibility (monorepo vs standalone)

### Build Tests

**Compiled Output Tests**

- Test all bin files can be executed with node
- Verify correct shebang in all bin files
- Check executable permissions on bin files
- Validate package structure matches package.json exports

**Package Structure Tests**

- Ensure no TypeScript source files in dist
- Verify all required runtime files present
- Check no test files included in dist
- Validate directory structure maintained

**Turborepo Integration Tests**

- Verify test:build task runs after build
- Check caching works correctly
- Validate parallel execution with other tasks
- Test cache invalidation on file changes

### Test Organization

**Test File Structure**

```
packages/claude-hooks/
├── src/
│   └── **/__tests__/        # Unit tests (test source)
├── scripts/
│   └── __tests__/           # Build tests (test dist)
│       ├── build.test.ts
│       ├── bin-integration.test.ts
│       └── compatibility.test.ts
├── vitest.config.ts         # Unit test config
└── vitest.config.build.ts   # Build test config
```

**Test Execution Patterns**

- `pnpm test` - Run unit tests on source
- `pnpm test:build` - Run build tests on dist
- `turbo test` - Run unit tests with caching
- `turbo test:build` - Run build tests with caching

### Mocking Requirements

**File System Mocking**

- Mock dist directory checks in Wallaby environment
- Use actual file system in CI/standard test runs

**Process Execution Mocking**

- Mock execSync for bin execution tests in constrained environments
- Use actual execution for integration tests

**Environment Detection**

- Check for WALLABY_WORKER to skip dist-dependent tests
- Check for CI environment for appropriate test behavior

## Test Quality Standards

### Coverage Requirements

- Maintain existing coverage levels for unit tests
- Build tests focus on integration, not coverage
- Critical paths must have both unit and build tests

### Test Performance

- Unit tests complete in <30 seconds
- Build tests complete in <15 seconds
- Parallel execution via Turborepo
- Utilize caching for repeated runs

### Test Reliability

- No flaky tests allowed
- Clear error messages for failures
- Proper cleanup after test execution
- Deterministic test outcomes

## Cleanup Tasks for Tests

### Remove Redundant Test Files

- Consolidate duplicate test utilities
- Remove unused test helper scripts
- Clean up generated .d.ts files in test directories

### Standardize Test Patterns

- Consistent use of describe/it blocks
- Proper async/await handling
- Clear test descriptions
- Consistent assertion patterns

### Fix Test Imports

- Ensure all imports use correct paths
- No circular dependencies
- Proper TypeScript type imports
- Clean up unused imports

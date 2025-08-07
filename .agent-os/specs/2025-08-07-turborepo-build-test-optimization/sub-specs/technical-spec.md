# Technical Specification

This is the technical specification for the spec detailed in @.agent-os/specs/2025-08-07-turborepo-build-test-optimization/spec.md

> Created: 2025-08-07
> Version: 1.0.0

## Technical Requirements

### Turborepo Pipeline Integration

- Add `test:build` task definition to turbo.json
- Configure task dependencies: `test:build` depends on `build`
- Define appropriate inputs for caching:
  - `dist/**` directory contents
  - `scripts/__tests__/*.test.ts` files
  - `vitest.config.build.ts`
- Set cache behavior for optimal performance
- Ensure proper environment variable passthrough for test execution

### Build Script Optimization

- Modify `scripts/test-build.sh` to remove redundant `pnpm build` command
- Rely on Turborepo's dependency management to ensure build runs first
- Maintain dist directory verification logic
- Keep test execution using vitest with build config

### Test Organization and Cleanup

- Review and consolidate test utilities if duplicated
- Remove unused test helper scripts from scripts directory
- Ensure clear separation between:
  - Unit tests (src/\*_/_.test.ts) - test source code
  - Build tests (scripts/**tests**/\*.test.ts) - test compiled output
- Verify all test imports are correct and no circular dependencies

### Code Quality Improvements

- Review all TypeScript files for consistent patterns
- Ensure proper error handling in all hook implementations
- Verify all exports are correctly typed
- Check for any unused dependencies in package.json
- Ensure consistent use of ES modules throughout

### Package Configuration Alignment

- Verify package.json scripts follow monorepo conventions
- Ensure tsconfig.json aligns with monorepo standards
- Check ESLint and Prettier configurations are inheriting correctly
- Verify all bin entries point to correct dist locations

## Approach Options

**Option A: Minimal Integration**

- Pros: Quick implementation, low risk
- Cons: Doesn't fully leverage Turborepo capabilities

**Option B: Full Pipeline Integration with Cleanup** (Selected)

- Pros: Maximum caching benefits, cleaner codebase, production-ready
- Cons: More comprehensive changes required

**Rationale:** Option B provides the best long-term maintainability and performance benefits while ensuring the package meets production quality standards.

## Implementation Details

### Turbo.json Configuration

```json
{
  "tasks": {
    "test:build": {
      "dependsOn": ["build"],
      "inputs": [
        "dist/**",
        "scripts/__tests__/**",
        "vitest.config.build.ts",
        "package.json"
      ],
      "cache": true,
      "env": ["NODE_ENV"],
      "passThroughEnv": ["CI", "WALLABY_WORKER"]
    }
  }
}
```

### Modified test-build.sh

```bash
#!/bin/bash
set -e

SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
PACKAGE_ROOT="$(dirname "$SCRIPT_DIR")"

cd "$PACKAGE_ROOT"

# Verify dist exists (should be built by Turborepo dependency)
if [ ! -d "dist" ]; then
  echo "Error: dist directory does not exist. Turborepo should have built it!"
  exit 1
fi

echo "dist directory exists, running tests..."

# Run the tests
pnpm exec vitest run --config vitest.config.build.ts
```

### Files to Clean Up

1. Remove duplicate test scripts in scripts/ directory that are now in .claude/
2. Consolidate any repeated test utilities
3. Remove any generated .d.ts files from test directories
4. Clean up unused imports and dead code

## External Dependencies

No new external dependencies required. This optimization uses existing Turborepo capabilities and maintains current testing frameworks.

## Performance Expectations

- Build test execution time reduced by ~40% due to caching
- Parallel execution of test:build alongside other tasks
- Cache hit rate of 95%+ for unchanged code
- Incremental builds complete in <5 seconds

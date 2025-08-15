# CLAUDE_TESTING.md

> **Prompt Cache Directive**: This content is cacheable for testing workflows
> Cache Control: `{"type": "ephemeral"}`

This file contains comprehensive testing instructions for the Mnemosyne monorepo. Referenced from main CLAUDE.md.

## Testing Workflow

**🔴 CRITICAL: ALWAYS USE WALLABY.JS FIRST - NO EXCEPTIONS 🔴**

### Wallaby.js Detection Rules

1. **ALWAYS try Wallaby first** - Use `mcp__wallaby__wallaby_failingTests` or any MCP Wallaby tool
2. **5-second rule** - If the tool hangs for more than 5 seconds, Wallaby is NOT running
3. **Immediate user alert** - After 5 seconds, tell the user: "Wallaby.js is not running. Please start it in VS Code using 'Wallaby.js: Start' command"
4. **NEVER skip to Vitest** - Always give the user the chance to start Wallaby first

### Wallaby.js Setup Requirements

- **VS Code Extension Required**: Wallaby.js must be started through VS Code (not programmatically)
- **Start Command**: Use VS Code command palette: `Wallaby.js: Start`
- **Check Status**: Run `pnpm wallaby:status` to verify Wallaby is running
- **License**: Wallaby.js is a paid product requiring a valid license

### Primary Testing Workflow

1. **ALWAYS check Wallaby.js first** using `mcp__wallaby__wallaby_failingTests`
2. **Wait exactly 5 seconds** - If no response, Wallaby is OFF
3. **Alert the user immediately**: "Wallaby.js is not running. Please start it in VS Code (Cmd+Shift+P → 'Wallaby.js: Start'). I'll wait for you to turn it on."
4. **Only use Vitest as fallback** if explicitly told to proceed without Wallaby.js

### Test Commands (fallback only)

- `pnpm test` - Run Vitest unit tests across all packages
- `pnpm test:ci` - Run tests in CI mode (no watch)
- `pnpm test:storybook` - Run Storybook component tests

### Single Test Running

**With Wallaby.js (preferred):**

- Use `mcp__wallaby__wallaby_allTestsForFile` to get test results
- Use `mcp__wallaby__wallaby_runtimeValues` for debugging
- Use `mcp__wallaby__wallaby_testById` for specific test details

**With Vitest (fallback only):**

- `pnpm test -- --run --reporter=verbose <test-file>` - Run specific test file

## Wallaby.js Configuration

Wallaby.js provides continuous test execution with live feedback in your editor. This monorepo has been configured to work seamlessly with Wallaby.js in an ES modules environment.

### Key Configuration Points

**Configuration File**: `wallaby.cjs` in the root directory

- Uses CommonJS format (`.cjs`) as required by Wallaby
- Sets environment variables at module load time to ensure test mode is detected early
- Configures autoDetect mode for Vitest compatibility

### Environment Variable Setup

**Critical**: Environment variables must be set at multiple points for proper test mode detection:

1. **At module load time** (top of wallaby.cjs):

   ```javascript
   process.env.NODE_ENV = 'test'
   process.env.VITEST = 'true'
   process.env.WALLABY_WORKER = 'true'
   ```

2. **In env.params.env** (for spawned processes):

   ```javascript
   env: {
     params: {
       env: 'NODE_ENV=test;VITEST=true;WALLABY_WORKER=true'
     }
   }
   ```

3. **In setup function** (for reinforcement):
   ```javascript
   setup: function (wallaby) {
     process.env.NODE_ENV = 'test'
     // Load .env.example for test-safe values
   }
   ```

### Test Exclusions

Certain tests need to be excluded from Wallaby.js due to incompatibilities:

- **Performance tests**: Memory-intensive benchmarks that can cause timeouts
- **CLI tests**: Tests using `import.meta.url` which conflicts with Wallaby's transpilation
- **Integration tests**: Tests that spawn processes with specific directory requirements

Example exclusion pattern:

```javascript
tests: {
  override: (testPatterns) => [
    ...testPatterns,
    '!**/performance-benchmarks.test.ts',
    '!**/cli-env-loading.test.ts',
    '!**/bin/**/*.test.ts',
    '!**/integration/**/stop-integration.test.ts',
  ]
}
```

### Handling Environment Differences

Tests should be written to work in both Wallaby.js and regular Vitest:

```typescript
// Detect Wallaby environment
const isWallaby = process.env.WALLABY_WORKER === 'true'

if (isWallaby) {
  // Wallaby-specific expectations
  expect(process.env.WALLABY_WORKER).toBe('true')
} else {
  // Regular Vitest expectations
  expect(process.env.NODE_ENV).toBe('test')
}
```

### Common Issues and Solutions

1. **NODE_ENV not set to 'test'**:
   - Wallaby may override NODE_ENV to 'development'
   - Solution: Set NODE_ENV at multiple points and make tests environment-aware

2. **Module mocking issues**:
   - Wallaby has different module resolution than Vitest
   - Mock methods need to use `mockImplementation(() => value)` instead of `mockReturnValue(value)` for Wallaby
   - Wallaby needs simpler mock setup - just `vi.mock('fs')` without async functions
   - Solution: Use dynamic imports and check for Wallaby environment

   **Example - Correct mocking for Wallaby compatibility:**

   ```javascript
   // ✅ Works with both Wallaby and Vitest
   vi.mock('fs') // Simple mock declaration

   it('test with fs mocks', async () => {
     const fs = await import('fs')
     // Use mockImplementation for Wallaby compatibility
     vi.mocked(fs.existsSync).mockImplementation(() => true)
     vi.mocked(fs.readFileSync).mockImplementation(() => 'file content')
   })
   ```

   **Example - What doesn't work with Wallaby:**

   ```javascript
   // ❌ Fails in Wallaby (but works in Vitest)
   vi.mock('fs', async () => {
     const actual = await vi.importActual('fs')
     return { ...actual, existsSync: vi.fn() }
   })

   // ❌ mockReturnValue doesn't work reliably in Wallaby
   vi.mocked(fs.existsSync).mockReturnValue(true)
   ```

3. **File system path issues**:
   - `import.meta.url` behaves differently in Wallaby
   - Solution: Exclude affected tests or use alternative path resolution

4. **Memory/timeout issues**:
   - Wallaby workers have resource constraints
   - Solution: Exclude performance-intensive tests

### Wallaby.js MCP Tools

Use these MCP tools for debugging and test analysis:

- `mcp__wallaby__wallaby_failingTests` - Get all failing tests with details
- `mcp__wallaby__wallaby_allTestsForFile` - Get all tests for a specific file
- `mcp__wallaby__wallaby_runtimeValues` - Inspect runtime values at specific code locations
- `mcp__wallaby__wallaby_coveredLinesForFile` - Check code coverage for files
- `mcp__wallaby__wallaby_testById` - Get specific test details by ID

### Best Practices

**🔴 TESTING WORKFLOW - ALWAYS FOLLOW THIS ORDER: 🔴**

1. **FIRST: Check Wallaby.js** - Use `mcp__wallaby__wallaby_failingTests` to see test status
2. **If Wallaby.js not responding** - Ask user: "Wallaby.js server appears to be off. Should I wait while you turn it on, or proceed with Vitest?"
3. **Only use Vitest if explicitly approved** - Never automatically fall back to Vitest

**Additional Best Practices:**

- **Environment compatibility**: Ensure tests pass in both Wallaby.js and regular Vitest
- **Use environment detection**: Make tests aware of which runner is active
- **Document exclusions**: Clearly comment why tests are excluded from Wallaby
- **Load test environment files**: Use .env.example for safe test values
- **Monitor worker resources**: Keep console output minimal to avoid memory issues

## Programmatic Wallaby Control

The `@studio/dev-tools` package provides a Wallaby manager for programmatic control of the Wallaby.js server, allowing you to start/stop Wallaby without needing VS Code commands.

### Available Commands

```bash
# Start Wallaby.js server (detached process)
pnpm wallaby:start

# Stop running Wallaby.js server
pnpm wallaby:stop

# Check Wallaby.js server status
pnpm wallaby:status

# View recent logs (last 50 lines)
pnpm wallaby:status --logs

# Clear Wallaby logs
pnpm wallaby:status --clear-logs
```

### Programmatic API

```typescript
import { WallabyManager } from '@studio/dev-tools'

// Start Wallaby server
const status = await WallabyManager.startWallaby({
  configFile: 'wallaby.cjs',
  projectPath: process.cwd(),
  debug: false,
})

// Check if running
const isRunning = await WallabyManager.isWallabyRunning()

// Get detailed status
const status = await WallabyManager.getWallabyStatus()

// Stop server
await WallabyManager.stopWallaby()
```

### Benefits

- Start Wallaby from terminal without opening VS Code
- Integrate Wallaby into automated workflows
- Check server status programmatically
- Manage Wallaby in CI/CD environments
- Detached process continues running after parent exits

## Test Database Architecture and Debugging Guide

### Overview

The mnemosyne project uses a sophisticated test database architecture to ensure test isolation and proper schema management across different testing environments.

### Package-Specific Test Database Setup

When packages have their own database tests (like `@studio/db`), they need special setup:

#### Test Database Setup Class

Packages should create their own `TestDatabaseSetup` class that:

- Creates isolated databases using worker IDs (Vitest/Wallaby)
- Uses `prisma db push` for schema creation (faster than migrations)
- Applies database triggers manually since `db push` doesn't run migrations
- Handles proper cleanup of test databases

Example structure:

```typescript
// packages/db/src/__tests__/test-database-setup.ts
export class TestDatabaseSetup {
  static async createTestDatabase(): Promise<PrismaClient> {
    // 1. Get worker ID for isolation
    // 2. Create unique database path
    // 3. Run prisma db push with DATABASE_URL
    // 4. Create Prisma client
    // 5. Apply database triggers
    // 6. Return configured client
  }
}
```

#### Environment Variable Handling

- Test setup must properly set and restore `DATABASE_URL`
- Use `execSync` with explicit environment variables
- Restore original DATABASE_URL after schema creation

#### Database Triggers in Tests

When migrations include database triggers:

- Create a method to apply triggers after `db push`
- Use `prisma.$executeRaw` to create triggers
- Include all trigger logic from migrations

### Key Components

#### Worker Database Factory

`packages/memory/src/persistence/__tests__/worker-database-factory.ts`

- Creates isolated SQLite databases for each test worker
- Uses in-memory databases for Wallaby.js (`sqlite://:memory:?cache=shared`)
- Uses file-based databases for regular test runners
- Implements schema versioning to force recreation when schema changes
- Includes clustering fields support for Memory table

#### Test Database Creation

`packages/test-config/src/database-testing.ts`

- Provides `createTestDatabase()` function used by all tests
- Creates temporary SQLite databases in system temp directory
- Applies full schema including all tables, indexes, and clustering fields
- Handles proper cleanup after tests complete

#### Memory Operations

`packages/db/src/memory-operations.ts`

- Provides database operations with validation
- **Critical**: Must initialize clustering fields when creating memories:
  - `clusteringMetadata: null`
  - `lastClusteredAt: null`
  - `clusterParticipationCount: 0`

### Common Issues and Solutions

#### Issue 1: "The column does not exist"

**Cause**: Test database schema is out of sync with Prisma schema
**Solutions**:

1. Update `worker-database-factory.ts` Memory table creation to include clustering fields
2. Update `database-testing.ts` schema statements to match current migrations
3. Add schema version tracking to force recreation

#### Issue 2: Validation constraints not enforced

**Cause**: Tests using raw Prisma client instead of operations wrappers
**Solution**: Use operation wrappers that include validation

#### Issue 3: Memory deduplication tests returning 0 counts

**Cause**: Memory creation not setting required clustering field defaults
**Solution**: Update `createMemory()` in `memory-operations.ts` to include clustering fields

#### Issue 4: Performance tests failing in Wallaby/CI

**Cause**: Performance benchmarks exceed thresholds in resource-constrained environments
**Solution**: Skip intensive tests in Wallaby and CI environments:

```typescript
describe('Performance Benchmarks', () => {
  // Skip performance benchmarks in Wallaby.js and CI - they can cause timeouts
  if (process.env.WALLABY_WORKER || process.env.CI) {
    it.skip('skipped in Wallaby.js and CI environments', () => {})
    return
  }
  // ... rest of the tests
})
```

#### Issue 5: Incomplete schema refresh in Wallaby

**Solution**: Implement comprehensive schema refresh that drops ALL tables:

```typescript
private static async dropAllTablesForWallaby(prisma: PrismaClient): Promise<void> {
  try {
    // Drop tables in reverse dependency order to avoid foreign key constraint violations
    await prisma.$executeRaw`DROP TABLE IF EXISTS "AnalysisMetadata"`
    await prisma.$executeRaw`DROP TABLE IF EXISTS "ValidationStatus"`
    // ... drop all tables in dependency order
    await prisma.$executeRaw`DROP TABLE IF EXISTS "Memory"`
    await prisma.$executeRaw`DROP TABLE IF EXISTS "Message"`
  } catch (error) {
    console.warn('Warning: Error dropping tables for Wallaby schema refresh:', error)
  }
}
```

### Testing Best Practices

1. **Always use test utilities**:
   - Use `createTestDatabase()` from `@studio/test-config`
   - Use operation wrappers from `@studio/db` for validation

2. **Schema synchronization**:
   - When adding new Prisma migrations, update:
     - `worker-database-factory.ts` table creation statements
     - `database-testing.ts` schema statements
   - Include all new fields with proper defaults

3. **Test isolation**:
   - Each test gets its own database instance
   - Databases are cleaned up after tests
   - Use unique content hashes to avoid constraint violations

4. **Environment-aware testing**:
   - Skip intensive tests in Wallaby/CI: `if (process.env.WALLABY_WORKER || process.env.CI)`
   - Use comprehensive schema refresh for Wallaby in-memory databases
   - Maintain index consistency across test and production environments

## Test-Driven Development (TDD)

**🔴 MANDATORY: USE WALLABY.JS FOR ALL TDD 🔴**

### TDD Workflow

1. **ALWAYS start with Wallaby.js** - Check `mcp__wallaby__wallaby_failingTests` before writing any code
2. **Write failing test first** - Use Wallaby.js to see the test fail in real-time
3. **Write minimal code to pass** - Watch Wallaby.js update as you code
4. **Refactor with confidence** - Wallaby.js shows instant feedback on changes
5. **If Wallaby.js is off** - Ask: "Wallaby.js server appears to be off. Should I wait while you turn it on, or proceed with Vitest?"

### Debugging Workflow

- **First**: Use `mcp__wallaby__wallaby_runtimeValues` to inspect values without adding console.log
- **Second**: Use `mcp__wallaby__wallaby_coveredLinesForFile` to verify test coverage
- **Third**: Use `mcp__wallaby__wallaby_testById` for specific test debugging
- **Only if Wallaby unavailable**: Fall back to Vitest with explicit permission

### Testing Strategy

- **Unit tests**: Each package has its own test suite
- **Component tests**: UI package with Storybook + Playwright
- **Integration tests**: Cross-package functionality
- **Mocking**: Centralized in @studio/mocks package
- **Package test config**: Packages may need their own `vitest.config.ts` for specific requirements
- **Test isolation**: Each test gets its own database instance using worker IDs

# Technical Specification

This is the technical specification for the spec detailed in @.agent-os/specs/2025-01-09-automatic-env-loading/spec.md

> Created: 2025-01-09
> Version: 1.0.0

## Technical Requirements

### Environment Loading Architecture

- **Primary Loader**: Use `dotenv` package for reliable .env file parsing
- **Load Location**: Always load from monorepo root, not package directories
- **Load Timing**: Environment variables must be loaded before any other imports
- **ES Modules**: Use `import 'dotenv/config'` syntax for ES modules compatibility
- **Test Isolation**: Vitest configuration loads .env.example instead of .env

### Implementation Strategy

- **Entry Point Loading**: Add dotenv import to all CLI entry points
- **Centralized Utility**: Create env-loader.ts for consistent loading logic
- **Fallback Chain**: .env → .env.example → environment variables
- **Substitution Support**: Enhance existing ${VAR_NAME} substitution in JSON configs

### File Structure

```
mnemosyne/
├── .env                    # Real environment variables (gitignored)
├── .env.example           # Example variables for documentation/tests
├── packages/
│   └── claude-hooks/
│       ├── src/
│       │   ├── utils/
│       │   │   └── env-loader.ts    # Centralized loading utility
│       │   └── bin/
│       │       └── *.ts             # Updated entry points
│       └── vitest.config.ts         # Updated for .env.example
└── turbo.json            # Already configured with globalEnv
```

## Approach Options

**Option A: dotenv with Import** (Selected)

- Pros: Standard approach, zero configuration, ES modules compatible
- Cons: Requires adding import to each entry point
- Implementation: `import 'dotenv/config'` at top of entry files

**Option B: Node --env-file Flag**

- Pros: Native Node.js support, no dependencies
- Cons: Requires Node 20.6+, must modify all script invocations
- Implementation: Add --env-file to all package.json scripts

**Option C: Custom ESM Loader**

- Pros: Truly automatic, no code changes needed
- Cons: Complex, Node version dependent, harder to debug
- Implementation: Create custom --loader module

**Rationale:** Option A provides the best balance of simplicity, compatibility, and maintainability while working perfectly with ES modules.

## External Dependencies

- **dotenv** (^16.4.5) - Industry standard .env file parser
  - **Justification:** Zero dependencies, mature, well-maintained, ES modules support
  - **Usage:** Loading and parsing .env files
  - **Alternative considered:** dotenvx (more complex, unnecessary features)

## Integration Points

### Vitest Configuration

```typescript
// Load .env.example for tests
import { loadEnv } from 'vite'
import { defineConfig } from 'vitest/config'

export default defineConfig(({ mode }) => ({
  test: {
    env: loadEnv(mode, process.cwd(), ''),
    setupFiles: ['./test-setup.ts'], // Load .env.example here
  },
}))
```

### Entry Point Pattern

```typescript
// First line of every bin/*.ts file
import '../utils/env-loader.js'
// Rest of imports follow...
```

### Environment Loader Utility

```typescript
// src/utils/env-loader.ts
import * as dotenv from 'dotenv'
import { existsSync } from 'fs'
import { join } from 'path'

// Load from monorepo root
const rootDir = process.cwd()
const envPath = join(rootDir, '.env')
const examplePath = join(rootDir, '.env.example')

// In test mode, use .env.example
const isTest = process.env.NODE_ENV === 'test' || process.env.VITEST
const pathToLoad = isTest && existsSync(examplePath) ? examplePath : envPath

dotenv.config({ path: pathToLoad })
```

## Performance Considerations

- **Load Once**: Environment loading happens once per process
- **Synchronous Loading**: dotenv loads synchronously, minimal impact (~1-2ms)
- **No Runtime Overhead**: Variables are in process.env after initial load
- **Test Performance**: Using .env.example avoids API calls in tests

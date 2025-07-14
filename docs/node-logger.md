# Structured Logger Implementation

This document outlines the structured logger implementation using pino with enhanced callsite tracing via stacktracey.

## Implementation Summary

✅ **Completed Tasks:**

1. **Dependencies Installed:**
   - `pino` - Fast, structured JSON logger
   - `pino-pretty` - Pretty printing for development
   - `stacktracey` - Enhanced stack trace parsing

2. **Core Components Created:**
   - `packages/logger/src/lib/stacktrace.ts` - Callsite extraction helper
   - `packages/logger/src/lib/logger.ts` - Main logger utility with callsite injection
   - `packages/logger/src/lib/__tests__/stacktrace.test.ts` - Tests for stacktrace helper
   - `packages/logger/src/lib/__tests__/logger.test.ts` - Tests for logger utility

3. **Logger Features:**
   - **Callsite Tracking**: Every log entry includes accurate file, line, and column information
   - **Relative Paths**: File paths are relative to project root for cleaner output
   - **Environment Awareness**: Pretty printing in development, JSON in production/test
   - **Convenience Methods**: `log.info()`, `log.error()`, `log.warn()`, etc.
   - **CLI Logger**: `createCliLogger()` for human-readable script output
   - **Type Safety**: Full TypeScript support with proper typing

4. **Migration Completed:**
   - Replaced all `console.log`, `console.error`, `console.warn` calls in scripts
   - Updated `packages/scripts/src/import-messages.ts` to use the new logger
   - Updated CLI scripts to use the new logger
   - Updated all test files to expect logger calls instead of console calls

## Usage Examples

### Basic Logging

```typescript
import { log } from '@studio/logger'

log.info('User action completed')
log.warn('Configuration issue detected')
log.error('Database connection failed')
```

### Logging with Context

```typescript
log.info('User action completed', {
  userId: 123,
  action: 'login',
  timestamp: new Date().toISOString(),
})
```

### Using the Direct Logger

```typescript
import { logger } from '@studio/logger'

logger.info('Direct logger usage')
```

### CLI Logger for Scripts

```typescript
import { createCliLogger } from '@studio/logger'

// Create CLI logger with default 'info' level
const cliLogger = createCliLogger()
cliLogger.info('Processing started')

// Create CLI logger with custom level
const debugLogger = createCliLogger('debug')
debugLogger.debug('Detailed processing info')
```

## Output Examples

### CLI Logger (Script-Friendly)

```
[INFO 14:30:22] Processing started
[DEBUG 14:30:23] Detailed processing info
[WARN 14:30:24] Configuration file not found, using defaults
[ERROR 14:30:25] Failed to connect to database
```

### Development Mode (Pretty Printed)

```
[09:15:34.353] INFO: User action completed
    userId: 123
    action: "login"
    callsite: {
      "file": "src/components/auth.ts",
      "line": 45,
      "column": 7
    }
```

### Production Mode (JSON)

```json
{
  "level": 30,
  "time": 1751793395218,
  "pid": 46495,
  "hostname": "Mac.modem",
  "userId": 123,
  "action": "login",
  "callsite": { "file": "src/components/auth.ts", "line": 45, "column": 7 },
  "msg": "User action completed"
}
```

## Logger Types and When to Use Them

### Structured Logger (`log.*` methods)

- **Use for**: Application runtime logging, debugging, monitoring
- **Features**: Callsite tracking, structured JSON output, environment-aware formatting
- **Example**: User actions, API calls, business logic events

### CLI Logger (`createCliLogger()`)

- **Use for**: Scripts, build tools, development utilities
- **Features**: Human-readable output, colorized, clean timestamps
- **Example**: Import scripts, data processing, migration tools

## Key Benefits

1. **Enhanced Debugging**: Every log entry shows exactly where it originated
2. **Structured Data**: JSON output enables better log analysis and monitoring
3. **Performance**: Pino is one of the fastest Node.js loggers
4. **Type Safety**: Full TypeScript support prevents logging errors
5. **Environment Flexibility**: Readable in development, parseable in production
6. **CLI-Friendly**: Separate logger for scripts with human-readable output
7. **Zero Breaking Changes**: All existing console.log calls were seamlessly migrated

## Configuration

The logger automatically detects the environment:

- **Development**: Uses pino-pretty for human-readable output
- **Production/Test**: Uses raw JSON output for log aggregation systems

Log level can be controlled via the `LOG_LEVEL` environment variable (default: 'info').

## Test Coverage

All logger functionality is thoroughly tested:

- ✅ Callsite extraction accuracy
- ✅ Relative path handling
- ✅ Logger instance creation
- ✅ Convenience methods functionality
- ✅ Script integration tests

The implementation successfully meets all acceptance criteria:

- ✅ Logs include accurate callsite field with file, line, and column info
- ✅ Callsite points to actual caller, not logger internals
- ✅ Output is clean and readable in development
- ✅ Logger is reusable throughout the codebase

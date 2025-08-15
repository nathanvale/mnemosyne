# @studio/logger

Dual logging system for Node.js and browser environments with comprehensive TypeScript support.

## Features

- 🌐 **Dual Environment Support**: Works seamlessly in Node.js and browser
- 📊 **Structured Logging**: JSON-based logging with Pino for Node.js
- 🔍 **Debug Callsites**: Enhanced debugging with file/line information
- 🎯 **Schema-Aware Logging**: Type-safe logging with schema validation
- 🚀 **Performance Optimized**: Minimal overhead in production

## Installation

```bash
# Within the monorepo
pnpm add @studio/logger
```

## Usage

```typescript
import { logger, createLogger } from '@studio/logger'

// Use default logger
logger.info('Application started')
logger.error('Error occurred', { error: err })

// Create custom logger
const customLogger = createLogger({
  level: 'debug',
  pretty: true,
})

customLogger.debug('Debug message')
```

## Dual Consumption Support

This package supports **dual consumption** - use TypeScript source in development for instant hot reload, or compiled JavaScript in production.

### How It Works

```json
{
  "exports": {
    ".": {
      "development": "./src/index.ts",
      "types": "./dist/index.d.ts",
      "import": "./dist/index.js",
      "default": "./dist/index.js"
    },
    "./testing": {
      "development": "./src/testing.ts",
      "types": "./dist/testing.d.ts",
      "import": "./dist/testing.js",
      "default": "./dist/testing.js"
    }
  }
}
```

### Development Mode

- Direct TypeScript imports - no build needed
- Instant hot reload on changes
- Perfect source maps for debugging

### Production Mode

- Optimized JavaScript execution
- Tree-shaken and minified
- Production-ready performance

## API

### `logger`

Default logger instance with sensible defaults.

```typescript
logger.info(message: string, meta?: object)
logger.error(message: string, meta?: object)
logger.warn(message: string, meta?: object)
logger.debug(message: string, meta?: object)
```

### `createLogger(options)`

Create a custom logger instance.

```typescript
const logger = createLogger({
  level: 'info', // Minimum log level
  pretty: false, // Pretty print in development
  browser: false, // Force browser mode
  callsites: true, // Include file/line info
})
```

### Browser Logger

Automatically used in browser environments:

```typescript
// Automatically detects browser environment
import { logger } from '@studio/logger'

// Logs to console with proper formatting
logger.info('Browser log', { data: 'value' })
```

## Testing

```typescript
import { createMockLogger } from '@studio/logger/testing'

const mockLogger = createMockLogger()
// Use in tests without actual logging
```

## Migration Notes

### From Legacy Imports

```typescript
// Old (no longer supported)
import { logger } from '@/lib/logger'

// New (monorepo package)
import { logger } from '@studio/logger'
```

### Dual Consumption Migration

This package was migrated to dual consumption architecture on 2025-08-15. No changes required for existing code - the migration is fully backward compatible.

## Contributing

This package is part of the Mnemosyne monorepo. See the main [README](../../README.md) for development setup.

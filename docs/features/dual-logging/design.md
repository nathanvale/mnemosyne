# 🏗️ Design: Dual Logging System

## 🎯 Overview

_Technical approach and architecture for this feature_

The dual logging system uses a unified API that automatically detects the runtime environment and provides optimized logging for each context. Node.js gets structured JSON logging with callsite tracking via Pino, while browsers get rich console output with remote batching capabilities.

Key architectural decisions:

- **Single package**: `@studio/logger` works in both environments
- **Environment detection**: Automatic Node.js vs browser detection
- **Shared interfaces**: Common TypeScript types for consistent API
- **Performance optimization**: Efficient processing for both environments

## 🏛️ Architecture

_How this feature fits into the overall system_

### System Components

- **Core Logger**: Environment-agnostic logging interface
- **Node.js Logger**: Pino-based structured logging with callsite tracking
- **Browser Logger**: Console-enhanced logging with remote batching
- **Shared Types**: Common interfaces for consistent API across environments

### Data Flow

```
Application Code → Logger API → Environment Detection → Optimized Output
```

1. **Input**: Application calls `log.info()`, `log.error()`, etc.
2. **Detection**: Runtime environment automatically detected
3. **Processing**: Environment-specific optimization applied
4. **Output**: Structured JSON (Node.js) or rich console (Browser)

## 📦 Package Changes

_Detailed changes needed in each package_

### @studio/logger

- **New Files**:
  - `src/lib/logger.ts` - Main unified logging interface
  - `src/lib/stacktrace.ts` - Callsite extraction for Node.js
  - `src/lib/browser-logger.ts` - Browser-specific logging implementation
  - `src/lib/types.ts` - Shared TypeScript interfaces
- **Dependencies**:
  - `pino` - Fast Node.js JSON logger
  - `pino-pretty` - Pretty printing for development
  - `stacktracey` - Enhanced stack trace parsing
  - `zod` - Schema validation for remote logging
- **API Changes**:
  - `log.info()`, `log.error()`, `log.warn()`, `log.debug()`, `log.trace()`
  - `createLogger()` - Factory function for custom loggers
  - `createCliLogger()` - CLI-friendly logger for scripts

### @studio/scripts

- **Modified Files**:
  - `src/import-messages.ts` - Updated to use `@studio/logger`
  - All CLI scripts migrated from `console.*` to structured logging
- **API Changes**:
  - Replaced `console.log` with `log.info`
  - Replaced `console.error` with `log.error`
  - Added structured context to all log messages

### @studio/ui

- **New Files**:
  - `src/components/LoggerDemo.tsx` - Interactive demo component
  - `src/__stories__/LoggerDemo.stories.tsx` - Storybook stories
- **Dependencies**:
  - React hooks for interactive demo
  - Storybook controls for configuration testing

### @studio/test-config

- **Modified Files**:
  - All test files updated to expect logger calls instead of console
  - Mock implementations for logger in test environment
- **API Changes**:
  - Test assertions updated for structured logging
  - Mock logger implementations for isolated testing

## 🔄 API Design

_Key interfaces and function signatures_

### Types

```typescript
interface LogEntry {
  timestamp: string
  level: LogLevel
  message: string
  context?: Record<string, any>
  tags?: string[]
  callsite?: {
    file: string
    line: number
    column: number
  }
}

type LogLevel = 'trace' | 'debug' | 'info' | 'warn' | 'error'

interface LoggerConfig {
  level?: LogLevel
  enableConsole?: boolean
  enableColors?: boolean
  enableInProduction?: boolean
  remoteEndpoint?: string
  batchSize?: number
  flushInterval?: number
  sensitiveFields?: string[]
}
```

### Functions

```typescript
// Main logging interface
export const log = {
  trace: (message: string, context?: Record<string, any>) => void,
  debug: (message: string, context?: Record<string, any>) => void,
  info: (message: string, context?: Record<string, any>) => void,
  warn: (message: string, context?: Record<string, any>) => void,
  error: (message: string, context?: Record<string, any>) => void,
}

// Factory functions
export function createLogger(config: LoggerConfig): Logger
export function createCliLogger(level?: LogLevel): Logger

// Utility functions
export function withTag(tag: string): Logger
export function withContext(context: Record<string, any>): Logger
```

## 🗄️ Database Changes

_Schema modifications needed_

No database changes required for this feature. The logging system is stateless and does not persist logs locally.

## 🎨 UI Components

_New components or modifications needed_

### New Components

- **LoggerDemo**: Interactive demo showing all logging features
  - Log level controls
  - Context and tag examples
  - Remote logging simulation
  - Performance monitoring demonstration

### Storybook Stories

- [x] Create comprehensive stories for LoggerDemo
- [x] Interactive controls for all configuration options
- [x] Examples of different log levels and contexts
- [x] Visual demonstration of console grouping and colors

## 🧪 Testing Approach

_How we'll test this feature_

### Unit Tests

- **@studio/logger**: Core logging functionality, environment detection
- **Callsite extraction**: Accurate file, line, column information
- **Data redaction**: Sensitive field filtering for remote logging
- **Error handling**: Retry logic, batch processing, network failures

### Integration Tests

- **Cross-environment**: Same API works in Node.js and browser
- **Remote logging**: End-to-end batching and retry logic
- **Script integration**: CLI logging in import and processing scripts

### Manual Testing

- [x] Console output verification in both environments
- [x] Storybook interactive demo functionality
- [x] Remote logging with various error scenarios
- [x] Performance impact measurement

## 🎯 Implementation Plan

_Step-by-step approach_

### Phase 1: Foundation ✅

- [x] Set up basic package structure
- [x] Create core TypeScript interfaces
- [x] Implement environment detection logic

### Phase 2: Node.js Implementation ✅

- [x] Integrate Pino for structured logging
- [x] Implement callsite tracking with stacktracey
- [x] Create CLI-friendly logger variant
- [x] Add environment-based output formatting

### Phase 3: Browser Implementation ✅

- [x] Rich console output with colors and grouping
- [x] Remote batching with retry logic
- [x] Sensitive data redaction
- [x] Performance monitoring features

### Phase 4: Integration & Testing ✅

- [x] Update all scripts to use new logger
- [x] Create comprehensive test suite
- [x] Build interactive Storybook demo
- [x] Documentation and examples

## 🚨 Risks & Mitigation

_What could go wrong and how to handle it_

### Technical Risks

- **Performance impact**: Logging overhead affects application performance
  - **Mitigation**: Efficient batching, level-based filtering, production optimizations

- **Browser compatibility**: Advanced console features not supported everywhere
  - **Mitigation**: Graceful degradation, feature detection, fallback implementations

- **Remote logging reliability**: Network failures cause log loss
  - **Mitigation**: Retry logic, exponential backoff, local fallback storage

### User Experience Risks

- **Development noise**: Too much logging clutters console
  - **Mitigation**: Configurable log levels, console grouping, colored output

- **Production leaks**: Sensitive data accidentally logged
  - **Mitigation**: Built-in redaction, configurable sensitive fields, validation

## 📊 Performance Considerations

_How this feature affects system performance_

- **Node.js**: Pino is extremely fast, minimal overhead over console.log
- **Browser**: Batching reduces network requests, async processing prevents blocking
- **Memory**: Efficient log entry processing, automatic cleanup of old entries
- **Network**: Configurable batch sizes and intervals for optimal performance

## 🔗 Dependencies

_External systems or packages this feature relies on_

- **pino**: Fast, structured JSON logger for Node.js
- **pino-pretty**: Pretty printing for development environments
- **stacktracey**: Enhanced stack trace parsing for accurate callsite information
- **zod**: Schema validation for remote logging payloads

## 🎨 Environment-Specific Features

### Node.js Features

- **Structured JSON**: Machine-readable log format for aggregation
- **Callsite tracking**: Exact file, line, and column information
- **Relative paths**: Clean output relative to project root
- **CLI logging**: Human-readable output for scripts and tools

### Browser Features

- **Rich console**: Colors, grouping, and interactive elements
- **Remote batching**: Automatic upload to logging services
- **Sensitive redaction**: Automatic filtering of passwords, tokens, etc.
- **Performance monitoring**: Built-in timing and measurement tools
- **Error tracking**: Ready-to-use integrations with monitoring services

---

_This design provides a robust, production-ready logging solution that enhances developer experience while maintaining high performance and security standards._

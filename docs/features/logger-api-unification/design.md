# 🏗️ Design: Logger API Unification

## 🎯 Overview

_Technical approach and architecture for this feature_

The logger API unification implements a consistent interface across Node.js and browser environments while maintaining the performance characteristics and capabilities of each platform. The design uses a unified facade pattern with environment-specific implementations, ensuring identical developer experience while leveraging optimal libraries for each runtime.

Key architectural decisions:

- **Facade pattern**: Single API interface with environment-specific backends
- **Environment detection**: Automatic runtime detection for seamless operation
- **Feature parity**: Node.js gains browser-only features through implementation adaptation
- **Backward compatibility**: Deprecation layer maintains existing functionality during migration

## 🏛️ Architecture

_How this feature fits into the overall system_

### System Components

- **Unified Logger Interface**: Common API surface for all environments
- **Environment Detection**: Runtime detection and adapter selection
- **Node.js Logger Adapter**: Enhanced Pino wrapper with advanced features
- **Browser Logger Adapter**: Existing implementation with standardized interface
- **Testing Utilities**: Mock factory and testing helpers
- **Migration Layer**: Backward compatibility and deprecation warnings

### Data Flow

```
Application Code → Unified Interface → Environment Detection → Platform Adapter → Output
```

1. **Application**: Calls `log.info(message, context)`
2. **Interface**: Validates and normalizes input
3. **Detection**: Determines Node.js vs browser environment
4. **Adapter**: Routes to appropriate platform implementation
5. **Output**: Structured JSON (Node.js) or enhanced console (Browser)

## 📦 Package Changes

_Detailed changes needed in each package_

### @studio/logger

- **New Files**:
  - `src/lib/unified-logger.ts` - Main unified interface
  - `src/lib/node-adapter.ts` - Enhanced Node.js implementation
  - `src/lib/environment-detection.ts` - Runtime detection logic
  - `src/lib/testing/mock-logger.ts` - Testing utilities
  - `src/lib/types/unified.ts` - Shared TypeScript interfaces
- **Modified Files**:
  - `src/index.ts` - Updated exports with unified interface
  - `src/lib/logger.ts` - Backward compatibility layer
  - `src/lib/browser-logger.ts` - Interface standardization
- **New Dependencies**: None (uses existing Pino, Zod, etc.)
- **API Changes**:
  - Unified `createLogger()` factory function
  - Standardized `log.method(message, context?)` signatures
  - Added `createMockLogger()` testing utility

### @studio/scripts

- **Modified Files**: All scripts using logger (gradual migration)
- **API Changes**: Update to new `message, context` signature pattern
- **Testing**: Integration with new mock utilities

### @studio/ui

- **Modified Files**:
  - Components using logger instances
  - Storybook stories and demos
- **New Components**: Updated LoggerDemo showing unified API
- **Testing**: Migration to `createMockLogger()` utility

### @studio/test-config

- **Modified Files**:
  - Test setup configuration
  - Shared test utilities
- **API Changes**: Integration with new mock logger patterns

## 🔄 API Design

_Key interfaces and function signatures_

### Unified Types

```typescript
// Core unified interface
interface UnifiedLogger {
  trace(message: string, context?: LogContext): void
  debug(message: string, context?: LogContext): void
  info(message: string, context?: LogContext): void
  warn(message: string, context?: LogContext): void
  error(message: string, context?: LogContext): void
  fatal(message: string, context?: LogContext): void

  // Advanced features (all environments)
  withTag(tag: string): UnifiedLogger
  withContext(context: LogContext): UnifiedLogger

  // Browser-specific (gracefully degrade in Node.js)
  group?(label: string): void
  groupCollapsed?(label: string): void
  groupEnd?(): void
  mark?(name: string): void
  measure?(name: string, startMark?: string): void
}

// Shared context type
type LogContext = Record<string, any>

// Configuration interface
interface LoggerConfig {
  level?: LogLevel
  prettyPrint?: boolean
  tags?: string[]
  context?: LogContext

  // Browser-specific options (ignored in Node.js)
  enableConsole?: boolean
  enableColors?: boolean
  remoteEndpoint?: string
  batchSize?: number

  // Node.js-specific options (ignored in browser)
  outputStream?: NodeJS.WritableStream
}
```

### Factory Functions

```typescript
// Unified factory (works everywhere)
export function createLogger(config?: LoggerConfig): UnifiedLogger

// Testing utility (works everywhere)
export function createMockLogger(): MockLogger

// Default logger instance (works everywhere)
export const log: UnifiedLogger
```

### Backward Compatibility

```typescript
// Legacy Node.js signature (deprecated)
export const logger: pino.Logger // with deprecation warning

// Legacy CLI logger (deprecated)
export function createCliLogger(level?: LogLevel): pino.Logger // with deprecation warning
```

## 🗄️ Database Changes

_Schema modifications needed_

No database changes required for this feature. The logger API unification is purely an interface and implementation change.

## 🎨 UI Components

_New components or modifications needed_

### Modified Components

- **LoggerDemo**: Updated to showcase unified API across environments
  - Side-by-side Node.js and browser examples
  - Interactive controls for testing features
  - Migration examples showing before/after

### Storybook Stories

- [x] Update existing LoggerDemo stories
- [x] Add unified API examples
- [x] Create migration guide stories
- [x] Test cross-environment behavior

## 🧪 Testing Approach

_How we'll test this feature_

### Unit Tests

- **Unified interface**: All methods work with consistent signatures
- **Environment detection**: Correct adapter selection
- **Feature parity**: `withTag()` and `withContext()` work in Node.js
- **Mock utilities**: `createMockLogger()` provides complete coverage

### Integration Tests

- **Cross-package**: Unified API works across all consuming packages
- **Environment switching**: Same code works in both Node.js and browser
- **Backward compatibility**: Existing code continues working with warnings

### Manual Testing

- [ ] Node.js script usage with new API
- [ ] Browser component usage with new API
- [ ] Test setup with new mock utilities
- [ ] Performance comparison with existing implementation

## 🎯 Implementation Plan

_Step-by-step approach_

### Phase 1: Foundation (Week 1)

- [ ] Create unified interface types and contracts
- [ ] Implement environment detection logic
- [ ] Build Node.js adapter with enhanced features
- [ ] Create basic testing utilities

### Phase 2: Integration (Week 2)

- [ ] Unified factory function with environment routing
- [ ] Backward compatibility layer with deprecation warnings
- [ ] Update browser logger to match unified interface
- [ ] Comprehensive test suite for all scenarios

### Phase 3: Migration (Week 3)

- [ ] Update internal package usage to new API
- [ ] Migration guide and documentation updates
- [ ] Performance verification and optimization
- [ ] Final testing and polish

## 🚨 Risks & Mitigation

_What could go wrong and how to handle it_

### Technical Risks

- **Performance degradation**: Additional abstraction layers impact logging speed
  - **Mitigation**: Benchmark existing performance, optimize adapter implementations

- **Environment detection failures**: Edge cases in runtime detection
  - **Mitigation**: Comprehensive environment testing, fallback mechanisms

- **Backward compatibility issues**: Breaking changes affect existing code
  - **Mitigation**: Thorough compatibility layer, gradual migration approach

### Integration Risks

- **Cross-package conflicts**: Different packages using different APIs
  - **Mitigation**: Coordinated migration plan, clear timeline

- **Testing complexity**: New mock utilities don't cover all scenarios
  - **Mitigation**: Comprehensive test coverage, examples for common patterns

## 📊 Performance Considerations

_How this feature affects system performance_

### Node.js Performance

- **Overhead**: Minimal abstraction layer over existing Pino implementation
- **Memory**: Slight increase for enhanced features (`withTag`, `withContext`)
- **Throughput**: Target: maintain 95%+ of current logging performance

### Browser Performance

- **Overhead**: No additional overhead, same underlying implementation
- **Memory**: Consistent with current browser logger usage
- **Network**: No changes to remote batching or transmission logic

### Environment Detection

- **Cost**: One-time detection at module load, cached thereafter
- **Fallback**: Fast path for subsequent calls, no repeated detection

## 🔗 Dependencies

_External systems or packages this feature relies on_

### Existing Dependencies

- **pino**: Node.js structured logging (no changes required)
- **pino-pretty**: Pretty printing (enhanced integration)
- **stacktracey**: Callsite tracking (no changes required)
- **zod**: Browser logging validation (no changes required)

### Development Dependencies

- **vitest**: Testing framework for new test utilities
- **typescript**: Enhanced type definitions for unified interface

## 🏗️ Implementation Details

### Environment Detection Strategy

```typescript
function detectEnvironment(): 'node' | 'browser' {
  // Check for Node.js specific globals
  if (typeof process !== 'undefined' && process.versions?.node) {
    return 'node'
  }

  // Check for browser specific globals
  if (typeof window !== 'undefined' && typeof document !== 'undefined') {
    return 'browser'
  }

  // Fallback for edge cases (Web Workers, etc.)
  return 'browser'
}
```

### Node.js Adapter Enhancement

```typescript
class NodeLoggerAdapter implements UnifiedLogger {
  private pinoLogger: pino.Logger
  private tags: string[] = []
  private context: LogContext = {}

  withTag(tag: string): UnifiedLogger {
    return new NodeLoggerAdapter({
      ...this.config,
      tags: [...this.tags, tag],
    })
  }

  withContext(context: LogContext): UnifiedLogger {
    return new NodeLoggerAdapter({
      ...this.config,
      context: { ...this.context, ...context },
    })
  }

  info(message: string, context?: LogContext): void {
    const mergedContext = {
      ...this.context,
      ...context,
      tags: this.tags.length > 0 ? this.tags : undefined,
      callsite: getCallSite(2),
    }

    this.pinoLogger.info(mergedContext, message)
  }
}
```

### Mock Logger Implementation

```typescript
export function createMockLogger(): MockLogger {
  const mockMethods = {
    trace: vi.fn(),
    debug: vi.fn(),
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
    fatal: vi.fn(),
  }

  const mockLogger = {
    ...mockMethods,
    withTag: vi.fn().mockReturnValue(mockLogger),
    withContext: vi.fn().mockReturnValue(mockLogger),
    group: vi.fn(),
    groupCollapsed: vi.fn(),
    groupEnd: vi.fn(),
    mark: vi.fn(),
    measure: vi.fn(),

    // Test utilities
    clearMocks: () =>
      Object.values(mockMethods).forEach((mock) => mock.mockClear()),
    getCallHistory: () => mockMethods,
  }

  return mockLogger
}
```

---

_This design provides a robust foundation for unified logging while maintaining performance, compatibility, and extensibility across all environments._

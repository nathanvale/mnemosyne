# 🎯 Intent: Dual Logging System

## 🎨 Purpose

_Why does this feature exist? What problem does it solve?_

The dual logging system solves the fundamental problem of having different logging requirements for Node.js backend services and browser frontend applications. Traditional approaches force developers to choose between structured server logging or user-friendly browser logging, creating inconsistency and maintenance overhead.

This feature provides a unified logging interface that automatically adapts to its environment:

- **Node.js**: Structured JSON logging with callsite tracking for production monitoring
- **Browser**: Rich console output with colors, grouping, and remote batching for development and error tracking

## 🚀 Goals

_What success looks like when this feature is complete_

- [x] **Unified API**: Single `@studio/logger` package works identically in Node.js and browser
- [x] **Environment-aware**: Automatically detects and optimizes for Node.js vs browser context
- [x] **Production-ready**: JSON structured logging for server monitoring and log aggregation
- [x] **Developer-friendly**: Rich console output with clickable traces and organized grouping
- [x] **Performance optimized**: Batching, retry logic, and efficient processing for remote logging
- [x] **Type-safe**: Full TypeScript support with proper error handling

## 🎯 Scope

_What's included and what's not_

### ✅ In Scope

- Node.js structured logging with Pino and callsite tracking
- Browser logging with console enhancement and remote batching
- Unified API that works identically in both environments
- Production-ready features: JSON output, log levels, error handling
- Development features: Pretty printing, clickable traces, console grouping
- Security features: Sensitive data redaction for remote logging
- Performance features: Batching, retry logic, efficient processing
- Integration patterns: CLI logging, error tracking hooks

### ❌ Out of Scope

- Direct integrations with specific logging services (provided as examples)
- Real-time log streaming or WebSocket connections
- Log persistence or local storage beyond batching
- Complex log analysis or search capabilities
- Custom log formats beyond JSON and pretty-printing

## 📦 Package Impact

_Which @studio packages are affected_

- **@studio/logger**: Core package providing unified logging API
- **@studio/scripts**: Updated to use structured logging instead of console.\*
- **@studio/ui**: LoggerDemo component for interactive testing
- **@studio/test-config**: Updated tests to expect logger calls instead of console

## 🔗 Dependencies

_What must be completed before this feature can start_

- [x] Monorepo structure with @studio packages
- [x] TypeScript configuration for shared types
- [x] Testing infrastructure with Vitest
- [x] Build pipeline with Turborepo

## 🎨 User Experience

_How users will interact with this feature_

### Developer Experience

1. **Import**: `import { log } from '@studio/logger'`
2. **Use**: `log.info('message', { context: 'data' })`
3. **Environment**: Automatically adapts to Node.js or browser
4. **Development**: Rich console output with clickable traces
5. **Production**: Structured JSON for monitoring systems

### Node.js Experience

1. Structured JSON logging with callsite information
2. Relative file paths for clean output
3. CLI-friendly logger for scripts and tools
4. Environment-based pretty printing vs JSON output

### Browser Experience

1. Colored console output with level-based styling
2. Console grouping for organized log sections
3. Remote batching for error tracking services
4. Sensitive data redaction for security
5. Performance monitoring with marks and measurements

## 🧪 Testing Strategy

_How we'll verify this feature works_

- **Unit Tests**: Core logging functionality, callsite extraction, data redaction
- **Integration Tests**: Cross-environment compatibility, remote logging, error handling
- **Manual Testing**: Console output verification, Storybook interactive demo

## 📈 Success Metrics

_How we'll measure if this feature is successful_

- **API consistency**: Same interface works in both Node.js and browser
- **Performance**: No noticeable impact on application performance
- **Developer adoption**: Team consistently uses logger instead of console.\*
- **Production reliability**: Structured logs enable effective monitoring and debugging
- **User feedback**: Positive developer experience with rich console output

---

_This dual logging system provides the foundation for consistent, production-ready logging across the entire Mnemosyne application stack._

# Technical Specification

This is the technical specification for the spec detailed in @.agent-os/specs/2025-08-08-dual-logging-system/spec.md

> Created: 2025-08-08
> Version: 1.0.0

## Technical Requirements

**Unified Logging API Architecture**:

- Core logger implementation in `packages/logger/src/lib/logger.ts` with Node.js Pino integration for structured logging
- Browser logger implementation in `packages/logger/src/lib/browser-logger.ts` with comprehensive web logging capabilities
- Unified createLogger() factory function with environment detection and smart configuration defaults
- Environment-aware mode selection with debug, CLI, and production presets for optimal logging in different contexts

**Node.js Logging Framework with Pino**:

- NodeLogger interface with trace, debug, info, warn, error, fatal methods and context/tag support
- NodeLoggerImpl class with Pino backend integration providing high-performance structured logging
- Callsite tracking with stacktracey integration providing clickable file:line:column links for IDE navigation
- Pretty printing integration with pino-pretty for development-friendly colored output and readable formatting

**Browser Logging with Enterprise Features**:

- BrowserLogger class with comprehensive configuration options for enterprise web application logging
- Remote batching with configurable batch sizes (default 10), flush intervals (30s), and HTTP POST transmission
- Sensitive data redaction with configurable field detection (password, token, secret, etc.) and custom redaction strategies
- Schema validation with Zod-powered payload validation ensuring data integrity before remote transmission

**Performance and Debugging Integration**:

- Performance API integration with mark() and measure() methods providing automatic timing display
- Clickable traces in development with dummy Error objects and stack trace parsing for source navigation
- Console grouping with group(), groupCollapsed(), and groupEnd() methods for organized debug output
- Development-only traceDev() method with automatic production filtering for debug-specific logging

## Approach Options

**Cross-Platform API Design** (Selected)

- **Unified interface with environment-specific implementations and smart factory function**
- Pros: Consistent API across platforms, environment optimizations, easy migration, unified configuration
- Cons: Implementation complexity, environment detection logic, feature parity maintenance
- **Rationale**: Cross-platform applications require consistent logging API with environment-specific optimizations

**Alternative: Separate platform-specific loggers**

- Pros: Simpler implementation, platform-specific optimization, clear separation
- Cons: API inconsistency, duplication, migration complexity, configuration divergence
- **Decision**: Unified API chosen for developer experience and consistent logging patterns

**Node.js Backend Strategy** (Selected)

- **Pino integration with pretty printing and structured output support**
- Pros: High performance, extensive configuration, industry standard, rich ecosystem
- Cons: Dependency weight, configuration complexity, learning curve
- **Rationale**: Production logging requires high-performance structured logging with extensive configuration

**Alternative: Console-based logging**

- Pros: No dependencies, simple implementation, universal compatibility
- Cons: Poor performance, limited features, no structured output, difficult monitoring
- **Decision**: Pino chosen for performance and production-ready features

**Browser Remote Logging Approach** (Selected)

- **Batched HTTP transmission with retry logic and schema validation**
- Pros: Reliable delivery, efficient batching, network optimization, data validation
- Cons: Implementation complexity, buffer management, retry coordination, validation overhead
- **Rationale**: Production browser logging requires reliable delivery with efficient transmission

## External Dependencies

**pino** - High-performance Node.js logger

- **Purpose**: Structured logging backend for Node.js with JSON output and extensive configuration options
- **Justification**: Production logging requires high-performance structured output with monitoring integration

**pino-pretty** - Pretty printing transport for Pino

- **Purpose**: Development-friendly colored output with readable formatting and timestamp display
- **Justification**: Development logging requires human-readable output for debugging and development workflows

**stacktracey** - Enhanced stack trace parsing and formatting

- **Purpose**: Callsite information extraction with file, line, and column details for clickable traces
- **Justification**: Development debugging requires accurate callsite information with IDE navigation support

**zod** - Schema validation library

- **Purpose**: Remote log payload validation ensuring data integrity before transmission
- **Justification**: Remote logging requires schema validation for API compatibility and data quality

**@studio/schema** - Shared validation schemas

- **Purpose**: Common validation utilities and schema definitions for consistent data validation
- **Justification**: Logging system requires integration with application-wide validation patterns

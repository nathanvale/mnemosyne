# 🎪 Pitch: Dual Logging System

## 🎯 Problem

_What's the specific problem we're solving?_

Developers are forced to choose between structured server logging and user-friendly browser logging, creating inconsistency across the application stack. Node.js applications need JSON structured logs for monitoring, while browser applications need rich console output for debugging. This leads to different logging approaches, maintenance overhead, and poor developer experience.

## 🍃 Appetite

_How much time/energy we're willing to spend_

- **Time Investment**: 4-6 weeks
- **Team Size**: Solo developer with occasional pair programming
- **Complexity**: Medium - requires deep understanding of both Node.js and browser environments

If this takes longer than 6 weeks, we'll cut advanced features like remote batching or error tracking integrations.

## 🎨 Solution

_What we're going to build_

### Core Functionality

A unified `@studio/logger` package that provides:

- **Single API**: Same interface works in Node.js and browser
- **Environment adaptation**: Automatically optimizes for each context
- **Node.js**: Structured JSON logging with callsite tracking
- **Browser**: Rich console output with colors and grouping
- **Production features**: Remote batching, error handling, data redaction

### What It Looks Like

_Visual or conceptual overview_

**Node.js Output (JSON)**:

```json
{
  "level": 30,
  "time": 1751793395218,
  "msg": "User logged in",
  "userId": "123",
  "callsite": { "file": "src/auth.ts", "line": 45, "column": 7 }
}
```

**Browser Output (Rich Console)**:

```
[INFO 14:30:22] 🔐 User logged in
  userId: "123"
  sessionId: "abc"
  📍 src/auth.ts:45:7
```

## 🏗️ How It Works

_Technical approach at a high level_

### Key Components

1. **Unified API**: Single logger interface that works everywhere
2. **Environment Detection**: Automatic Node.js vs browser detection
3. **Node.js Engine**: Pino-based structured logging with callsite tracking
4. **Browser Engine**: Console-enhanced logging with remote batching

### Technical Approach

- **Architecture**: Environment-aware factory pattern
- **Packages Affected**: @studio/logger, @studio/scripts, @studio/ui
- **New Dependencies**: pino, pino-pretty, stacktracey, zod

## 📋 Scope

_What's included and what's not_

### ✅ This Cycle

- [x] Core unified logging API
- [x] Node.js structured logging with callsite tracking
- [x] Browser rich console output with colors
- [x] Environment-based automatic configuration
- [x] Basic remote batching for browser
- [x] Sensitive data redaction
- [x] Migration of existing console.\* calls
- [x] Interactive Storybook demo

### ❌ Not This Cycle

- Advanced error tracking service integrations
- Real-time log streaming or WebSocket connections
- Complex log analysis or search capabilities
- Custom log formats beyond JSON and pretty-printing
- Log persistence or local storage beyond batching

### 🚫 No-Gos

- Direct integrations with specific logging services (provide examples only)
- Features that require external infrastructure
- Complex configuration systems that slow down adoption

## 🛠️ Implementation Plan

_Rough phases of work_

### Week 1-2: Foundation

- [x] Set up @studio/logger package structure
- [x] Create shared TypeScript interfaces
- [x] Implement environment detection logic
- [x] Basic Node.js logging with Pino

### Week 3-4: Core Features

- [x] Callsite tracking with stacktracey
- [x] Browser logging with console enhancements
- [x] Remote batching with retry logic
- [x] Sensitive data redaction

### Week 5-6: Integration & Polish

- [x] Migrate existing console.\* calls
- [x] Create interactive Storybook demo
- [x] Comprehensive testing suite
- [x] Documentation and examples

## 🎯 Success Metrics

_How we'll know this is working_

- **Functional**: Same API works identically in Node.js and browser
- **User Experience**: Developers prefer new logger over console.\*
- **Technical**: No performance impact on application runtime
- **Production**: Structured logs enable effective monitoring

## 🚨 Risks

_What could go wrong and our backup plan_

### Technical Risks

- **Performance overhead**: Logging slows down application
  - **Mitigation**: Use fastest libraries (Pino), efficient batching, level filtering

- **Browser compatibility**: Advanced features don't work everywhere
  - **Mitigation**: Graceful degradation, feature detection, fallback implementations

### Scope Risks

- **Feature creep**: Adding integrations with every logging service
  - **Mitigation**: Provide examples only, focus on core unified API

## 🔄 Circuit Breaker

_When to stop and reassess_

If we encounter:

- Callsite tracking accuracy issues taking more than 3 days to resolve
- Browser performance problems with remote batching
- API design conflicts between Node.js and browser requirements

Then we'll **stop**, reassess, and either:

- Simplify callsite tracking to basic stack traces
- Remove advanced browser features in favor of simple console output
- Create separate but similar APIs for each environment

## 📦 Package Impact

_Which parts of the codebase will change_

- **@studio/logger**: New package with unified logging API
- **@studio/scripts**: All console.\* calls replaced with structured logging
- **@studio/ui**: New LoggerDemo component for interactive testing
- **@studio/test-config**: Test assertions updated for logger calls
- **Documentation**: New usage examples and migration guide

## 🎪 Demo Plan

_How we'll show this feature when complete_

- **Scenario**: Developer debugging a user login flow
- **Data**: Realistic user authentication with errors and success
- **Flow**:
  1. Show same code running in Node.js (structured JSON)
  2. Show same code running in browser (rich console)
  3. Demonstrate remote batching with simulated errors
  4. Interactive Storybook demo with all features

---

_This pitch represents a foundational logging system that enables consistent, production-ready logging across the entire Mnemosyne application stack._

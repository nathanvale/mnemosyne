# 🎪 Pitch: Logger API Unification

## 🎯 Problem

_What's the specific problem we're solving?_

The current logger API has inconsistent behavior across environments, unpredictable signatures, and fragmented factory functions that create a poor developer experience. Developers must learn different APIs for Node.js vs browser, deal with magic argument handling, and manually set up test mocks. This complexity was exposed during our documentation review where we found multiple API discrepancies that confused the intended usage patterns.

## 🍃 Appetite

_How much time/energy we're willing to spend_

- **Time Investment**: 2-3 weeks
- **Team Size**: Solo developer
- **Complexity**: Medium - API changes with backward compatibility

If this takes longer than 3 weeks, we'll cut advanced features like browser-specific integrations and focus on core API consistency.

## 🎨 Solution

_What we're going to build_

### Core Functionality

A unified logger API that works identically across environments:

- **Consistent signatures**: `log.info(message, context?)` everywhere
- **Environment parity**: `withTag()` and `withContext()` in both Node.js and browser
- **Unified factory**: Single `createLogger()` with environment detection
- **Testing utilities**: Built-in `createMockLogger()` for easy test setup

### What It Looks Like

_API before and after comparison_

**Before (fragmented)**:

```typescript
// Node.js - unpredictable args, manual context
log.info('User login', { userId: '123' }, 'extra data')

// Browser - different factory, advanced features
const logger = createLogger().withTag('Auth').withContext({ session: 'abc' })

// Testing - manual mock setup
vi.mock('@studio/logger', () => ({ log: { info: vi.fn() } }))
```

**After (unified)**:

```typescript
// Works everywhere - consistent signature
log.info('User login', { userId: '123', extraData: 'value' })

// Works everywhere - same advanced features
const logger = createLogger().withTag('Auth').withContext({ session: 'abc' })

// Works everywhere - built-in testing
const mockLogger = createMockLogger()
```

## 🏗️ How It Works

_Technical approach at a high level_

### Key Components

1. **Unified Logger Interface**: Consistent `message, context?` signature
2. **Environment Detection**: Automatic Node.js vs browser adaptation
3. **Node.js Enhancements**: Add missing `withTag()` and `withContext()` methods
4. **Testing Utilities**: Built-in mock factory with proper typing

### Technical Approach

- **Architecture**: Maintain dual implementation but unified interface
- **Packages Affected**: @studio/logger (core changes), all consuming packages
- **Backward Compatibility**: Deprecation warnings during migration period

## 📋 Scope

_What's included and what's not_

### ✅ This Cycle

- [x] Unified API signature: `log.info(message, context?)`
- [x] Node.js `withTag()` and `withContext()` methods
- [x] Single `createLogger()` factory with environment detection
- [x] `createMockLogger()` testing utility
- [x] Backward compatibility with deprecation warnings
- [x] Core documentation updates

### ❌ Not This Cycle

- Browser-specific remote logging enhancements
- Advanced performance optimizations
- Complex migration tooling
- New logging levels or features

### 🚫 No-Gos

- Breaking changes without migration path
- Performance degradation in existing usage
- Removing any currently working functionality

## 🛠️ Implementation Plan

_Rough phases of work_

### Week 1: Core API Unification

- [x] Update logger signatures to consistent `message, context?` pattern
- [x] Add `withTag()` and `withContext()` to Node.js logger
- [x] Maintain backward compatibility with warnings

### Week 2: Factory and Testing

- [x] Create unified `createLogger()` with environment detection
- [x] Implement `createMockLogger()` utility
- [x] Update all internal usage to new API

### Week 3: Documentation and Polish

- [x] Update package documentation
- [x] Create migration guide
- [x] Test cross-package compatibility
- [x] Performance verification

## 🎯 Success Metrics

_How we'll know this is working_

- **Functional**: Same API works identically in Node.js and browser
- **Developer Experience**: Single set of documentation covers all environments
- **Testing**: Built-in mock eliminates manual test setup
- **Migration**: Existing code continues working with deprecation warnings

## 🚨 Risks

_What could go wrong and our backup plan_

### Technical Risks

- **Breaking changes**: Signature changes affect existing code
  - **Mitigation**: Maintain backward compatibility with gradual migration

- **Performance impact**: Additional abstraction layers slow logging
  - **Mitigation**: Benchmark current performance, maintain or improve

### Scope Risks

- **Feature creep**: Adding new logging capabilities beyond unification
  - **Mitigation**: Focus strictly on API consistency, not new features

## 🔄 Circuit Breaker

_When to stop and reassess_

If we encounter:

- Backward compatibility proving impossible without major refactoring
- Performance degradation that can't be resolved in 2 days
- Cross-environment testing revealing fundamental architectural issues

Then we'll **stop**, reassess, and either:

- Reduce scope to signature unification only
- Create parallel API instead of replacing existing
- Postpone to future cycle with more research

## 📦 Package Impact

_Which parts of the codebase will change_

- **@studio/logger**: Core API changes, new factory functions, testing utilities
- **@studio/scripts**: Update to new API signatures
- **@studio/ui**: Update logger usage in components
- **All packages**: Gradual migration to new API patterns
- **Documentation**: Major simplification of API reference

## 🎪 Demo Plan

_How we'll show this feature when complete_

- **Scenario**: Developer setting up logging in new feature
- **Before**: Show current fragmented API requiring different approaches
- **After**: Show unified API working identically across environments
- **Testing**: Demonstrate easy mock setup vs current manual approach

---

_This pitch represents a foundational improvement that will significantly enhance developer experience across the entire Mnemosyne logging system._

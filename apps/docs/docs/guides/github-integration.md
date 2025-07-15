# 🔗 GitHub Integration Guide

This guide shows how to integrate your Basecamp-style documentation with GitHub's project management features while maintaining the calm, async-friendly workflow.

## 🎯 Philosophy

The goal is to create **traceability without task-churn**:

- Link documentation to GitHub features for context
- Maintain the "shape work, do it, mark it done" philosophy
- Avoid turning GitHub into a micromanagement tool
- Keep the focus on shipping features, not tracking tasks

## 🎪 Linking Pitch Docs to Issues

### When to Create Issues

Create GitHub issues for:

- **Features that need team discussion** before implementation
- **Cross-package changes** that affect multiple developers
- **External dependencies** that need tracking
- **Bugs** that interrupt planned work

### Issue Template with Pitch Doc Link

```markdown
## 🎯 Feature: [Feature Name]

**Pitch Document**: [docs/features/[feature-name]/pitch.md](docs/features/[feature-name]/pitch.md)

### Problem

[Brief problem statement from pitch doc]

### Appetite

- **Time**: [1-2 weeks / 3-4 weeks / 6 weeks]
- **Complexity**: [Simple / Medium / Complex]
- **Circuit Breaker**: [When to stop and reassess]

### Scope This Cycle

- [ ] [Core deliverable 1]
- [ ] [Core deliverable 2]
- [ ] [Core deliverable 3]

### Out of Scope

- [Feature that would double the scope]
- [Complex edge cases]
- [Nice-to-have enhancements]

### Package Impact

- **@studio/[package]**: [What changes]
- **@studio/[package]**: [What changes]

### Definition of Done

- [ ] Core functionality implemented
- [ ] Tests passing
- [ ] Documentation updated
- [ ] Demo-ready

---

_This issue tracks the cycle work described in the pitch document. For technical details, see the [design doc](docs/features/[feature-name]/design.md)._
```

### Real Example

```markdown
## 🎯 Feature: Message Deduplication System

**Pitch Document**: [docs/features/message-deduplication/pitch.md](docs/features/message-deduplication/pitch.md)

### Problem

CSV message imports create duplicate entries, causing data inconsistency and wasted storage. We need content-based deduplication before database insertion.

### Appetite

- **Time**: 2-3 weeks
- **Complexity**: Medium
- **Circuit Breaker**: If SHA-256 hashing causes performance issues

### Scope This Cycle

- [ ] SHA-256 content hashing for messages
- [ ] Database schema for content hash storage
- [ ] Import script integration with deduplication
- [ ] Basic performance testing

### Out of Scope

- Advanced deduplication algorithms
- User interface for duplicate management
- Historical data cleanup

### Package Impact

- **@studio/db**: New content_hash column in messages table
- **@studio/scripts**: Updated import logic with hash checking

### Definition of Done

- [ ] Messages table includes content_hash field
- [ ] Import script prevents duplicate content
- [ ] Performance impact < 20% on import speed
- [ ] Unit tests for hashing and deduplication

---

_This issue tracks the cycle work described in the pitch document. For technical details, see the [design doc](docs/features/message-deduplication/design.md)._
```

## 📝 PR Descriptions with Design Doc References

### PR Template

```markdown
## 🏗️ [Feature Name]: [Specific Change]

**Design Document**: [docs/features/[feature-name]/design.md](docs/features/[feature-name]/design.md)

### Changes

- [Specific implementation detail]
- [Database schema change]
- [New API endpoint]

### Technical Approach

[Reference specific sections from design doc]

### Testing

- [x] Unit tests for [specific functionality]
- [x] Integration tests for [cross-package interaction]
- [x] Manual testing of [user scenario]

### Package Changes

- **@studio/[package]**: [What was added/modified]
- **@studio/[package]**: [What was added/modified]

### Performance Impact

[Any performance considerations or measurements]

### Breaking Changes

[Any breaking changes and migration notes]

**Closes**: #[issue-number]

---

_Implementation follows the technical approach outlined in the design document. See the [intent doc](docs/features/[feature-name]/intent.md) for the strategic context._
```

### Real Example

```markdown
## 🏗️ Message Deduplication: Add SHA-256 Content Hashing

**Design Document**: [docs/features/message-deduplication/design.md](docs/features/message-deduplication/design.md)

### Changes

- Added `content_hash` column to messages table
- Implemented SHA-256 hashing in import script
- Added duplicate detection logic before database insertion
- Created utility functions for hash generation and validation

### Technical Approach

Following the "Hash-First Strategy" from the design doc:

1. Generate SHA-256 hash of message content before processing
2. Check existing hashes in database before insertion
3. Skip duplicate messages with logging for audit trail

### Testing

- [x] Unit tests for hash generation with various input types
- [x] Integration tests for import script with duplicate data
- [x] Manual testing with real CSV files containing duplicates

### Package Changes

- **@studio/db**: Added `content_hash` field to Prisma schema
- **@studio/scripts**: Updated import logic with hash checking

### Performance Impact

- Hash generation adds ~5ms per message (acceptable for batch processing)
- Database lookup adds ~2ms per message (indexed hash column)
- Overall import speed decreased by 15% (within acceptable range)

### Breaking Changes

- Database migration required: `pnpm db:reset` for existing installations
- Import script now requires `content_hash` field population

**Closes**: #47

---

_Implementation follows the technical approach outlined in the design document. See the [intent doc](docs/features/message-deduplication/intent.md) for the strategic context._
```

## 🏷️ Release Notes with Feature Documentation

### Release Template

```markdown
## Release v[X.Y.Z] - [Release Name]

### ✅ Features Shipped

#### 🎯 [Feature Name]

**Documentation**: [docs/features/[feature-name]/](docs/features/[feature-name]/)

- [Key user-facing capability]
- [Performance improvement]
- [Integration enhancement]

**Impact**: [How this improves the product]

#### 🎯 [Feature Name]

**Documentation**: [docs/features/[feature-name]/](docs/features/[feature-name]/)

- [Key user-facing capability]
- [Performance improvement]
- [Integration enhancement]

**Impact**: [How this improves the product]

### 🔧 Architecture Updates

- **Database**: [Schema changes and migrations]
- **Packages**: [New packages or major changes]
- **APIs**: [New interfaces or breaking changes]

### 🐛 Bug Fixes

- [Bug description]: [How it was fixed]
- [Bug description]: [How it was fixed]

### 📦 Package Changes

- **@studio/[package]**: [What was added/changed]
- **@studio/[package]**: [What was added/changed]

### 🚀 What's Next

**Next Cycle Focus**: [Upcoming phase or feature]

- [Key deliverable for next cycle]
- [Key deliverable for next cycle]

See [docs/architecture/phase-plan.md](docs/architecture/phase-plan.md) for the full roadmap.

---

_This release completes [Phase X] of the project roadmap. See individual feature documentation for implementation details and usage examples._
```

### Real Example

```markdown
## Release v1.3.0 - Message Processing Foundation

### ✅ Features Shipped

#### 🎯 Message Deduplication System

**Documentation**: [docs/features/message-deduplication/](docs/features/message-deduplication/)

- SHA-256 content hashing prevents duplicate message imports
- Database-level duplicate detection with performance optimization
- Import script integration with audit logging

**Impact**: Eliminates data inconsistency and reduces storage by ~30% for typical datasets

#### 🎯 Dual Logging System

**Documentation**: [docs/features/dual-logging/](docs/features/dual-logging/)

- Unified logging API works in both Node.js and browser environments
- Structured JSON logging for production monitoring
- Rich console output with clickable traces for development

**Impact**: Consistent logging across entire application stack with enhanced debugging capabilities

### 🔧 Architecture Updates

- **Database**: Added `content_hash` column to messages table with unique index
- **Packages**: New `@studio/logger` package for unified logging
- **APIs**: Standardized logging interface across all packages

### 🐛 Bug Fixes

- Import script memory leak with large CSV files: Fixed with streaming processing
- Console output formatting issues: Resolved with environment-specific formatting

### 📦 Package Changes

- **@studio/db**: Schema migration for content hashing
- **@studio/logger**: New package with dual environment support
- **@studio/scripts**: Updated to use structured logging and deduplication

### 🚀 What's Next

**Next Cycle Focus**: Component Library Development

- Storybook integration for UI component development
- Design system foundation with reusable components
- Interactive demos for logging and data processing features

See [docs/architecture/phase-plan.md](docs/architecture/phase-plan.md) for the full roadmap.

---

_This release completes Phase 2 of the project roadmap. See individual feature documentation for implementation details and usage examples._
```

## 🔄 Workflow Integration

### The Complete Flow

1. **Planning**: Write intent → design → pitch docs
2. **GitHub Issue**: Create issue linking to pitch doc
3. **Implementation**: Build feature following design doc
4. **Pull Request**: Reference design doc in PR description
5. **Release**: Document shipped features with links to documentation

### Workflow Example

```
📝 docs/features/user-auth/intent.md
📝 docs/features/user-auth/design.md
📝 docs/features/user-auth/pitch.md
      ↓
🎯 GitHub Issue #123: "User Authentication System"
   Links to: docs/features/user-auth/pitch.md
      ↓
🔨 Implementation work following design doc
      ↓
📝 PR #124: "Implement user authentication middleware"
   References: docs/features/user-auth/design.md
      ↓
🏷️ Release v1.4.0 notes
   Features: "User Authentication (docs/features/user-auth/)"
```

## 🎯 Best Practices

### Do's

- **Link strategically**: Connect documentation to GitHub features for context
- **Keep issues focused**: One issue per feature/cycle, not per task
- **Reference design docs**: Help reviewers understand technical decisions
- **Celebrate in releases**: Show what was accomplished, not just what changed

### Don'ts

- **Don't create issues for every small task**: Maintain focus on features
- **Don't duplicate documentation**: Keep docs as single source of truth
- **Don't track progress in GitHub**: Use "done lists" in documentation
- **Don't micromanage**: Trust the documentation to guide implementation

## 🛠️ GitHub Templates

### Issue Template (.github/ISSUE_TEMPLATE/feature.md)

```markdown
---
name: Feature Implementation
about: Track a feature cycle with Basecamp-style documentation
title: '🎯 Feature: [Feature Name]'
labels: ['feature', 'cycle']
assignees: []
---

## 📝 Documentation

**Pitch Document**: [docs/features/[feature-name]/pitch.md](docs/features/[feature-name]/pitch.md)
**Design Document**: [docs/features/[feature-name]/design.md](docs/features/[feature-name]/design.md)

## 🎯 Cycle Overview

- **Appetite**: [Time willing to spend]
- **Circuit Breaker**: [When to stop and reassess]

## 📋 This Cycle

- [ ] [Core deliverable]
- [ ] [Core deliverable]
- [ ] [Core deliverable]

## 🚫 Out of Scope

- [Feature that would double the scope]
- [Complex edge cases]

## 📦 Package Impact

- **@studio/[package]**: [What changes]

## ✅ Definition of Done

- [ ] Core functionality implemented
- [ ] Tests passing
- [ ] Documentation updated
- [ ] Demo-ready

---

_This issue tracks cycle work. For technical details, see the design document._
```

### PR Template (.github/PULL_REQUEST_TEMPLATE.md)

```markdown
## 🏗️ [Feature]: [Specific Change]

**Design Document**: [Link to design doc if applicable]

### Changes

- [Specific implementation detail]
- [Database/API change]
- [New functionality]

### Testing

- [ ] Unit tests
- [ ] Integration tests
- [ ] Manual testing

### Package Changes

- **@studio/[package]**: [What was added/modified]

### Performance Impact

[Any performance considerations]

### Breaking Changes

[Any breaking changes and migration notes]

**Closes**: #[issue-number]

---

_Implementation follows documented technical approach. See feature documentation for strategic context._
```

## 🔗 Quick Reference

### Templates

- **Issue**: Link to pitch doc, define cycle scope
- **PR**: Reference design doc, show technical approach
- **Release**: Celebrate shipped features with documentation links

### Links

- [Planning Guide](planning-guide.md) - Core Basecamp methodology
- [Feature Templates](template/) - Reusable documentation scaffolding
- [Architecture Overview](architecture/) - System-level documentation

---

_This integration approach maintains the calm, focused nature of Basecamp-style development while providing necessary traceability for team collaboration._

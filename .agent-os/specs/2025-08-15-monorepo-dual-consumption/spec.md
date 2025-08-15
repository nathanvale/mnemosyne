# Spec Requirements Document

> Spec: Monorepo Dual Consumption Architecture
> Created: 2025-08-15
> Status: Planning

## Overview

Implement a dual consumption architecture that enables fast development through direct source file imports while supporting reliable production builds through compiled artifacts. This architecture ensures ES modules compatibility for external consumers using Vite and other modern bundlers, eliminating the need for local builds during development.

## User Stories

### Fast Development Experience

As a developer working on the monorepo, I want to import packages directly from source files, so that I can have instant hot reload and skip build steps during development.

**Workflow**: Developer makes changes to a component in `@studio/ui` and immediately sees the changes reflected in the Next.js app without any build step. TypeScript compilation happens just-in-time through the bundler, providing immediate feedback and debugging capabilities with original source maps and line numbers.

### Reliable Production Deployment

As a DevOps engineer, I want production builds to use compiled artifacts, so that deployment is consistent, optimized, and doesn't rely on runtime transpilation.

**Workflow**: CI/CD pipeline builds all packages into optimized JavaScript bundles with tree-shaking and minification, then the Next.js production build consumes these pre-compiled artifacts, ensuring consistent behavior and optimal performance in production without TypeScript dependencies.

### External Package Consumption

As a developer in another repository, I want to consume published packages as standard ES modules with built artifacts, so that I can use them with Vite and other modern bundlers without needing the internal development environment.

**Workflow**: Developer installs `@studio/ui` from npm registry and imports components normally in a Vite project. The package exports compiled ES modules with TypeScript declarations, working seamlessly without requiring access to source files or internal build configuration.

## Spec Scope

1. **Conditional Exports Configuration** - Implement Node.js conditional exports in all packages to enable environment-aware module resolution based on NODE_ENV
2. **Package.json Standardization** - Update all package exports to support both development (source) and production (built) consumption patterns with proper ES module syntax
3. **Build System Integration** - Configure Turborepo tasks to support both source-based development and artifact-based production builds with intelligent caching
4. **Environment Detection** - Set up NODE_ENV-based switching between source and compiled consumption with proper fallbacks
5. **External Testing Infrastructure** - Create test repository structure with npm link to verify packages work correctly when consumed externally with Vite

## Out of Scope

- Changing the underlying build tools (TypeScript, Turborepo)
- Modifying existing package functionality or APIs
- Creating new feature packages beyond testing requirements
- Performance optimizations beyond what conditional exports naturally provide
- Publishing packages to npm registry (focus on local testing)

## Expected Deliverable

1. **Fast Development**: Developers can start the dev server and immediately work on packages without any build steps, with instant hot reload across package boundaries
2. **Clean Production Builds**: Production builds consume optimized, compiled artifacts with proper tree-shaking, minification, and no TypeScript runtime dependencies
3. **External Compatibility**: Packages can be consumed externally via npm link in a Vite project with full ES modules support and TypeScript types
4. **Comprehensive Documentation**: Clear guides for setting up new packages, consuming existing ones internally, and testing external consumption

## Spec Documentation

- Tasks: @.agent-os/specs/2025-08-15-monorepo-dual-consumption/tasks.md
- Technical Specification: @.agent-os/specs/2025-08-15-monorepo-dual-consumption/sub-specs/technical-spec.md
- Package Setup Guide: @.agent-os/specs/2025-08-15-monorepo-dual-consumption/sub-specs/package-setup-guide.md
- Internal Consumption Guide: @.agent-os/specs/2025-08-15-monorepo-dual-consumption/sub-specs/internal-consumption-guide.md
- Migration Checklist: @.agent-os/specs/2025-08-15-monorepo-dual-consumption/sub-specs/migration-checklist.md
- External Testing Guide: @.agent-os/specs/2025-08-15-monorepo-dual-consumption/sub-specs/external-testing-guide.md
- Tests Specification: @.agent-os/specs/2025-08-15-monorepo-dual-consumption/tests.md

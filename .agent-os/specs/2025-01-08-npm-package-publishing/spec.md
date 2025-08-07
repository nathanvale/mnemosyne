# Spec Requirements Document

> Spec: NPM Package Publishing Strategy
> Created: 2025-01-08
> Status: Planning

## Overview

Implement a comprehensive npm package publishing strategy that enables select packages in the monorepo to be published to npm while maintaining the Just-in-Time compilation pattern for internal packages.

## User Stories

### Package Author Story

As a package author in the mnemosyne monorepo, I want to publish select packages to npm so that external developers can use our tools and utilities.

Currently, all packages use the Just-in-Time compilation pattern which works great internally but doesn't work for external consumption. We need a dual-mode setup where internal packages remain source-based while publishable packages compile to JavaScript for distribution.

### External Developer Story

As an external developer, I want to install and use @studio/claude-hooks from npm with proper TypeScript types and compiled JavaScript, so that I can integrate Claude Code notifications into my workflow.

The package should work out-of-the-box with standard npm/yarn/pnpm installation, include type definitions, and not require any special build configuration on my end.

### Monorepo Maintainer Story

As a monorepo maintainer, I want a clear separation between internal and publishable packages, so that I can maintain different build strategies without complexity.

This separation should be obvious in the configuration, automated in the build process, and testable before publishing to ensure quality.

## Spec Scope

1. **Create Publishable TypeScript Configuration** - Add publishable.json to @studio/typescript-config for packages meant to be published
2. **Migrate @studio/claude-hooks to Publishable** - Update claude-hooks to use publishable configuration with proper compilation
3. **Implement Publishing Workflow** - Create npm scripts and GitHub Actions for automated publishing
4. **Add Package Validation** - Implement pre-publish checks for package quality and completeness
5. **Document Publishing Process** - Create comprehensive documentation for publishing packages

## Out of Scope

- Converting all packages to publishable (most remain internal)
- Setting up private npm registry
- Implementing semantic versioning automation (separate concern)
- Creating marketing or announcement workflows
- Managing npm organization or scope naming

## Expected Deliverable

1. @studio/claude-hooks successfully published to npm with working installation
2. Clear separation between internal (Just-in-Time) and publishable (compiled) packages
3. Automated publishing workflow integrated with CI/CD pipeline

# Spec Requirements Document

> Spec: Post-Processing Script for ES Module Extensions
> Created: 2025-08-15
> Status: Planning

## Overview

Implement a simple post-processing script that automatically adds `.js` extensions to import statements in compiled JavaScript output. This pragmatic approach avoids introducing complex bundling tools while solving the Node.js ES module compatibility issue, maintaining clean TypeScript source code without extensions, and preserving the existing build pipeline with minimal changes.

## User Stories

### Clean TypeScript Development

As a developer writing TypeScript code, I want to use standard import statements without file extensions, so that my source code remains clean and follows TypeScript best practices.

**Current Problem**: With `moduleResolution: "bundler"` in TypeScript, we don't need `.js` extensions in source files, but the compiled output from `tsc` requires them for Node.js runtime. This creates a mismatch where we either pollute source with unnecessary extensions or get runtime errors.

**Solution Workflow**: Developer writes standard TypeScript imports (`import { logger } from './logger'`), TypeScript compiles normally, a post-processing script adds `.js` extensions to the compiled output, and the result works correctly in Node.js runtime without manual intervention.

### Minimal Build Complexity

As a developer maintaining the build system, I want the simplest possible solution that works reliably, so that the build pipeline remains maintainable and debuggable.

**Current Problem**: Adding a bundler introduces complexity, new dependencies, configuration files, and potential compatibility issues. The only real problem is missing `.js` extensions in the compiled output.

**Solution Workflow**: Developer runs `pnpm build`, TypeScript compiles as normal, the post-processing script runs automatically to fix extensions, and the build completes with minimal overhead.

### Zero Configuration Changes

As a team working on this monorepo, I want to avoid learning new tools and configurations, so that we can focus on building features rather than maintaining build infrastructure.

**Current Problem**: Introducing a bundler requires learning new configuration syntax, dealing with bundler-specific issues, and maintaining additional tooling.

**Solution Workflow**: Team continues using familiar TypeScript compiler, the post-processing script works transparently, no new configuration files are needed, and existing knowledge remains valid.

## Spec Scope

1. **Post-Processing Script** - Create a Node.js script that adds `.js` extensions to import statements in compiled JavaScript
2. **Build Integration** - Add the script as a post-build step in package.json for all affected packages
3. **Extension Cleanup** - Remove any manually added `.js` extensions from TypeScript source files
4. **Validation** - Ensure the script correctly handles all import patterns and edge cases
5. **Documentation** - Document the approach and why it was chosen over more complex solutions

## Out of Scope

- Introducing bundling tools (tsup, tsdown, Vite, etc.)
- Changing TypeScript compiler settings
- Modifying the dual consumption architecture
- Changing how packages are built (still using tsc)
- Altering the existing development workflow

## Expected Deliverable

1. **Working Post-Processing Script**: A simple, reliable script that fixes import extensions in compiled output
2. **Clean Source Code**: TypeScript files remain clean without `.js` extensions
3. **Seamless Integration**: Script runs automatically as part of the build process
4. **Full Compatibility**: Output works in Node.js ES modules without any runtime errors
5. **Minimal Risk**: No major changes to the build system, easy to rollback if needed

## Spec Documentation

- Tasks: @.agent-os/specs/2025-08-15-post-processing-esm-fix/tasks.md
- Technical Specification: @.agent-os/specs/2025-08-15-post-processing-esm-fix/sub-specs/technical-spec.md
- Implementation Guide: @.agent-os/specs/2025-08-15-post-processing-esm-fix/sub-specs/implementation-guide.md
- Tests Specification: @.agent-os/specs/2025-08-15-post-processing-esm-fix/sub-specs/tests.md

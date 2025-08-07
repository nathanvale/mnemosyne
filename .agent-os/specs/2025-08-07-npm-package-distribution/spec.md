# Spec Requirements Document

> Spec: NPM Package Distribution for Claude Hooks
> Created: 2025-08-07
> Status: Planning

## Overview

Transform the @studio/claude-hooks package into a properly distributable npm package with executable bin entries, eliminating the need for platform-specific wrapper scripts while maintaining full compatibility with both Turborepo monorepo development and standalone npm installation scenarios.

## User Stories

### Developer in Monorepo

As a developer working in the mnemosyne monorepo, I want to continue using claude-hooks with TypeScript source files directly, so that I can develop and test changes without needing to compile.

When I run `pnpm install` in the monorepo, the bin commands should be available and work with TypeScript source files via tsx. I should be able to modify the source code and immediately see changes reflected when running the commands.

### External User Installing Package

As an external user, I want to install @studio/claude-hooks via npm and have working executable commands, so that I can use Claude hooks in my own projects without complex setup.

When I run `npm install -g @studio/claude-hooks` or use `npx @studio/claude-hooks`, I should get compiled JavaScript that runs on my system without requiring TypeScript or other build tools. The package should work on Windows, macOS, and Linux.

### Claude Code User

As a Claude Code user, I want simple, memorable commands in my hooks configuration, so that I can easily set up and maintain my development environment.

Instead of complex bash scripts or file paths, I should be able to use simple commands like `claude-hooks-stop` in my `.claude/settings.local.json` configuration, and it should work regardless of where my project is located or how the package was installed.

## Spec Scope

1. **Build Infrastructure** - Set up TypeScript compilation pipeline that produces distributable JavaScript while maintaining source compatibility in the monorepo
2. **Bin Entry Points** - Create executable entry files with proper shebangs that work in both development (TypeScript) and production (JavaScript) environments
3. **Package Configuration** - Update package.json with bin field, proper exports, and build scripts for npm distribution
4. **Cross-Platform Support** - Ensure commands work on Windows, macOS, and Linux without platform-specific wrappers
5. **Config Resolution** - Maintain existing configuration finding logic that searches from cwd upward through project and home directories

## Out of Scope

- Publishing to npm registry (will be handled in a future task)
- Modifying existing hook functionality or TTS providers
- Changing configuration file formats or locations
- Creating new hooks or features
- Setting up CI/CD for automated publishing

## Expected Deliverable

1. Executable commands (`claude-hooks-stop`, `claude-hooks-notification`, etc.) that work immediately after `pnpm install` in the monorepo or `npm install -g` for external users
2. A package that can be built with `pnpm build` to produce distributable JavaScript in a `dist/` directory
3. Updated Claude Code configuration examples showing the simplified command usage without bash scripts or complex paths

## Spec Documentation

- Tasks: @.agent-os/specs/2025-08-07-npm-package-distribution/tasks.md
- Technical Specification: @.agent-os/specs/2025-08-07-npm-package-distribution/sub-specs/technical-spec.md
- Tests Specification: @.agent-os/specs/2025-08-07-npm-package-distribution/sub-specs/tests.md

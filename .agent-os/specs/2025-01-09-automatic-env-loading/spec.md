# Spec Requirements Document

> Spec: Automatic Environment Variable Loading
> Created: 2025-01-09
> Status: Planning

## Overview

Implement automatic loading of environment variables from .env files for all Node.js/tsx scripts in the Turborepo monorepo, similar to how Next.js handles environment variables, while ensuring tests use safe example values.

## User Stories

### Developer Experience Story

As a developer, I want to run any Node.js script or CLI command without manually exporting environment variables or using --env-file flags, so that I can focus on development without environment configuration overhead.

When I run `pnpm --filter @studio/claude-hooks claude-hooks-stop --speak`, the script should automatically load environment variables from the root .env file, enabling features like ElevenLabs TTS without manual configuration. The system should handle environment variable substitution in JSON configs (${VAR_NAME} syntax) seamlessly.

### Testing Safety Story

As a developer, I want tests to use example environment variables instead of real API keys, so that tests are safe, reproducible, and don't consume API credits or expose secrets.

When running `pnpm test`, all tests should load environment variables from .env.example instead of .env, ensuring that tests never accidentally use production API keys. This approach also serves as documentation for required environment variables.

## Spec Scope

1. **Automatic .env Loading** - All Node.js/tsx scripts automatically load environment variables from the monorepo root .env file
2. **Test Environment Isolation** - Vitest tests use .env.example for safe, reproducible testing
3. **Environment Variable Substitution** - JSON configuration files support ${VAR_NAME} syntax with automatic substitution
4. **ES Modules Compatibility** - Solution works with pure ES modules setup without CommonJS
5. **Developer Documentation** - Comprehensive .env.example file documenting all required variables

## Out of Scope

- Modifying Next.js environment handling (already works)
- Creating environment-specific files (.env.production, .env.staging)
- Implementing custom environment encryption or secrets management
- Changing Turborepo's core environment variable handling
- Supporting non-Node.js runtimes

## Expected Deliverable

1. Running any tsx script or CLI command loads .env automatically without manual exports
2. Tests run with .env.example values, never touching real .env
3. Environment variable substitution works in all JSON config files
4. New developers can copy .env.example to .env and understand all required variables

## Spec Documentation

- Tasks: @.agent-os/specs/2025-01-09-automatic-env-loading/tasks.md
- Technical Specification: @.agent-os/specs/2025-01-09-automatic-env-loading/sub-specs/technical-spec.md
- Tests Specification: @.agent-os/specs/2025-01-09-automatic-env-loading/sub-specs/tests.md

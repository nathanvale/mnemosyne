# Spec Tasks

These are the tasks to be completed for the spec detailed in @.agent-os/specs/2025-01-09-automatic-env-loading/spec.md

> Created: 2025-01-09
> Status: Ready for Implementation

## Tasks

- [ ] 1. Create comprehensive .env.example file
  - [ ] 1.1 Write tests for .env.example structure
  - [ ] 1.2 Add all API keys as example placeholders (ELEVENLABS_API_KEY, OPENAI_API_KEY, etc.)
  - [ ] 1.3 Document each variable's purpose with comments
  - [ ] 1.4 Add example values that work for tests
  - [ ] 1.5 Update .gitignore to ensure .env is ignored
  - [ ] 1.6 Verify all tests pass with example values

- [ ] 2. Install and configure dotenv package
  - [ ] 2.1 Write tests for env-loader utility
  - [ ] 2.2 Add dotenv to claude-hooks package dependencies
  - [ ] 2.3 Create src/utils/env-loader.ts with monorepo root detection
  - [ ] 2.4 Implement test mode detection (NODE_ENV=test or VITEST)
  - [ ] 2.5 Add fallback logic for .env → .env.example
  - [ ] 2.6 Verify all tests pass

- [ ] 3. Update CLI entry points
  - [ ] 3.1 Write tests for CLI environment loading
  - [ ] 3.2 Update src/bin/claude-hooks-stop.ts with env-loader import
  - [ ] 3.3 Update src/bin/claude-hooks-notification.ts
  - [ ] 3.4 Update src/bin/claude-hooks-quality.ts
  - [ ] 3.5 Update src/bin/claude-hooks-subagent.ts
  - [ ] 3.6 Update src/bin/claude-hooks-cache-stats.ts
  - [ ] 3.7 Update src/bin/claude-hooks-cache-explorer.ts
  - [ ] 3.8 Verify all CLI commands work without manual exports

- [ ] 4. Configure Vitest for .env.example
  - [ ] 4.1 Write tests for Vitest environment configuration
  - [ ] 4.2 Update vitest.config.ts to use loadEnv from vite
  - [ ] 4.3 Create test-setup.ts to load .env.example
  - [ ] 4.4 Verify tests use example values, not real API keys
  - [ ] 4.5 Test that mocked API calls work correctly
  - [ ] 4.6 Verify all tests pass

- [ ] 5. Test and validate complete solution
  - [ ] 5.1 Test ElevenLabs integration with real API key from .env
  - [ ] 5.2 Verify environment variable substitution in JSON configs
  - [ ] 5.3 Test all CLI commands work automatically
  - [ ] 5.4 Verify tests run safely with .env.example
  - [ ] 5.5 Test from different directories in monorepo
  - [ ] 5.6 Update documentation if needed

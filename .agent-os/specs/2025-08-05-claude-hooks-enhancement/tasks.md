# Spec Tasks

These are the tasks to be completed for the spec detailed in @.agent-os/specs/2025-08-05-claude-hooks-enhancement/spec.md

> Created: 2025-08-05
> Status: Ready for Implementation

## Tasks

- [x] 1. Extend Claude Event Types and Core Architecture
  - [x] 1.1 Write tests for new Claude event types (Stop, Notification, SubagentStop)
  - [x] 1.2 Add new event type definitions to types/claude.ts
  - [x] 1.3 Create base hook architecture for event processing
  - [x] 1.4 Implement stdin parsing for Claude Code events
  - [x] 1.5 Add exit code handling and error management
  - [x] 1.6 Verify all tests pass

- [x] 2. Implement Cross-Platform Audio System
  - [x] 2.1 Write tests for platform detection and audio commands
  - [x] 2.2 Create platform detection utility
  - [x] 2.3 Implement macOS audio with afplay and system sounds
  - [x] 2.4 Implement Windows audio with PowerShell
  - [x] 2.5 Implement Linux audio with fallback chain
  - [x] 2.6 Add sound file validation and error handling
  - [x] 2.7 Verify all tests pass

- [x] 3. Create Core Hook Implementations
  - [x] 3.1 Write tests for notification hook behavior
  - [x] 3.2 Implement notification.ts hook with --notify flag
  - [x] 3.3 Write tests for stop hook with transcript processing
  - [x] 3.4 Implement stop.ts hook with --chat flag
  - [x] 3.5 Write tests for subagent stop hook
  - [x] 3.6 Implement subagent-stop.ts hook
  - [x] 3.7 Verify all tests pass

- [x] 4. Add Event Logging System
  - [x] 4.1 Write tests for JSON event logging
  - [x] 4.2 Create logging utilities with rotation support
  - [x] 4.3 Implement event logging for each hook
  - [x] 4.4 Add chat transcript parsing and storage
  - [x] 4.5 Configure log directories (global vs local)
  - [x] 4.6 Verify all tests pass

- [x] 5. Implement Advanced Features
  - [x] 5.1 Write tests for speech support on macOS
  - [x] 5.2 Add --speak flag and macOS say command integration
  - [x] 5.3 Implement quiet hours configuration
  - [x] 5.4 Add cooldown period between notifications
  - [x] 5.5 Create configuration schema and validation
  - [x] 5.6 Add environment variable support
  - [x] 5.7 Verify all tests pass

## Additional Tasks

- [x] Update package.json exports for new hooks
- [x] Update README.md with new hook documentation
- [x] Add example configurations for each hook
- [x] Create integration tests for end-to-end scenarios
- [x] Ensure Turborepo build pipeline integration
- [x] Add performance benchmarks for audio playback

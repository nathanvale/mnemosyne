# Spec Tasks

These are the tasks to be completed for the spec detailed in @.agent-os/specs/2025-08-05-claude-hooks-enhancement/spec.md

> Created: 2025-08-05
> Status: Ready for Implementation

## Tasks

- [ ] 1. Extend Claude Event Types and Core Architecture
  - [ ] 1.1 Write tests for new Claude event types (Stop, Notification, SubagentStop)
  - [ ] 1.2 Add new event type definitions to types/claude.ts
  - [ ] 1.3 Create base hook architecture for event processing
  - [ ] 1.4 Implement stdin parsing for Claude Code events
  - [ ] 1.5 Add exit code handling and error management
  - [ ] 1.6 Verify all tests pass

- [ ] 2. Implement Cross-Platform Audio System
  - [ ] 2.1 Write tests for platform detection and audio commands
  - [ ] 2.2 Create platform detection utility
  - [ ] 2.3 Implement macOS audio with afplay and system sounds
  - [ ] 2.4 Implement Windows audio with PowerShell
  - [ ] 2.5 Implement Linux audio with fallback chain
  - [ ] 2.6 Add sound file validation and error handling
  - [ ] 2.7 Verify all tests pass

- [ ] 3. Create Core Hook Implementations
  - [ ] 3.1 Write tests for notification hook behavior
  - [ ] 3.2 Implement notification.ts hook with --notify flag
  - [ ] 3.3 Write tests for stop hook with transcript processing
  - [ ] 3.4 Implement stop.ts hook with --chat flag
  - [ ] 3.5 Write tests for subagent stop hook
  - [ ] 3.6 Implement subagent_stop.ts hook
  - [ ] 3.7 Verify all tests pass

- [ ] 4. Add Event Logging System
  - [ ] 4.1 Write tests for JSON event logging
  - [ ] 4.2 Create logging utilities with rotation support
  - [ ] 4.3 Implement event logging for each hook
  - [ ] 4.4 Add chat transcript parsing and storage
  - [ ] 4.5 Configure log directories (global vs local)
  - [ ] 4.6 Verify all tests pass

- [ ] 5. Implement Advanced Features
  - [ ] 5.1 Write tests for speech support on macOS
  - [ ] 5.2 Add --speak flag and macOS say command integration
  - [ ] 5.3 Implement quiet hours configuration
  - [ ] 5.4 Add cooldown period between notifications
  - [ ] 5.5 Create configuration schema and validation
  - [ ] 5.6 Add environment variable support
  - [ ] 5.7 Verify all tests pass

## Additional Tasks

- [ ] Update package.json exports for new hooks
- [ ] Update README.md with new hook documentation
- [ ] Add example configurations for each hook
- [ ] Create integration tests for end-to-end scenarios
- [ ] Ensure Turborepo build pipeline integration
- [ ] Add performance benchmarks for audio playback

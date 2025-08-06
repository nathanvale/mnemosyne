# Spec Requirements Document

> Spec: Claude Hooks Enhancement
> Created: 2025-08-05
> Status: Planning

## Overview

Enhance the existing `@studio/claude-hooks` package to achieve feature parity with awesome-claude-code, implementing comprehensive task completion hooks with cross-platform audio support, event logging, and Claude Code event processing.

## User Stories

### Task Completion Notifications

As a developer using Claude Code, I want to receive audio notifications when Claude completes tasks, so that I can stay focused on other work while knowing when Claude needs my attention or has finished processing.

**Detailed Workflow**: When Claude completes a task, the Stop hook triggers and plays a completion sound (Glass.aiff on macOS, custom WAV on Windows/Linux). If configured, it also processes and logs the chat transcript for later review. The notification respects quiet hours and cooldown periods to avoid being disruptive.

### Attention Alerts

As a developer, I want to be notified when Claude needs my attention, so that I can respond promptly to requests for input or clarification.

**Detailed Workflow**: When Claude encounters a situation requiring user input, the Notification hook triggers and plays an attention sound (Funk.aiff on macOS, custom WAV on Windows/Linux). The system logs the event and respects user preferences for sound vs speech notifications.

### Subagent Completion Tracking

As a developer using Claude's Task tool with subagents, I want to know when subagents complete their work, so that I can track progress on complex multi-step tasks.

**Detailed Workflow**: When a subagent completes its task, the SubagentStop hook triggers and plays a completion sound. The event is logged with subagent details for tracking purposes.

## Spec Scope

1. **Cross-Platform Audio System** - Support for macOS (afplay + system sounds), Windows (PowerShell), and Linux (aplay/paplay/play)
2. **Three Core Hooks** - Notification, Stop, and SubagentStop hooks with proper event processing
3. **Event Logging System** - JSON-based logging with configurable directories and log rotation
4. **Speech Support** - macOS speech synthesis integration with configurable messages
5. **CLI Argument Processing** - Support for --notify, --chat, --speak flags like awesome-claude-code

## Out of Scope

- Installation/uninstallation scripts for global hook management
- Hook discovery or management UI
- Real-time log viewing interface
- Integration with external notification systems (Slack, Discord, etc.)

## Expected Deliverable

1. **Cross-platform hook execution** - All three hooks work on macOS, Windows, and Linux with appropriate audio fallbacks
2. **Event logging functionality** - All hook events are logged to JSON files with proper structure and rotation
3. **Feature parity with awesome-claude-code** - CLI flags, speech support, and configuration options match the reference implementation

## Spec Documentation

- Tasks: @.agent-os/specs/2025-08-05-claude-hooks-enhancement/tasks.md
- Technical Specification: @.agent-os/specs/2025-08-05-claude-hooks-enhancement/sub-specs/technical-spec.md
- API Specification: @.agent-os/specs/2025-08-05-claude-hooks-enhancement/sub-specs/api-spec.md
- Tests Specification: @.agent-os/specs/2025-08-05-claude-hooks-enhancement/sub-specs/tests.md

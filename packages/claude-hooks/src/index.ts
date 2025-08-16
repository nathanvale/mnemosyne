/**
 * @studio/claude-hooks - Claude Code hooks for task completion and quality checks
 */

// Main hook classes
export { NotificationHook } from './notification/notification'
export { StopHook } from './stop/stop'
export { SubagentStopHook } from './subagent-stop/subagent-stop'
export { BaseHook } from './base-hook'

// Hook configuration interfaces
export type { NotificationHookConfig } from './notification/notification'
export type { StopHookConfig } from './stop/stop'
export type { SubagentStopHookConfig } from './subagent-stop/subagent-stop'
export type { HookConfig } from './base-hook'

// TTS and Speech
export { TTSProviderFactory } from './speech/providers/provider-factory'
export type {
  TTSProvider,
  TTSProviderConfig,
} from './speech/providers/tts-provider'

// Audio system
export { AudioPlayer } from './audio/audio-player'
export { detectPlatform, Platform } from './audio/platform'

// Configuration
export { loadAutoConfig } from './utils/auto-config'
export { loadConfigFromEnv } from './config/env-config'

// Claude event types
export type {
  ClaudeStopEvent,
  ClaudeNotificationEvent,
  ClaudeSubagentStopEvent,
  ClaudePostToolUseEvent,
  FileToolInput,
} from './types/claude'

// Utility types
export { HookExitCode } from './types/claude'

// Export specific utilities
export { createLogger, type Logger } from './utils/logger'
export { loadConfig } from './utils/config-loader'

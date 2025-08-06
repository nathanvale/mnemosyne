/**
 * Subagent stop hook for Claude Code
 * Notifies when a subagent completes its task
 */

import type {
  TTSProvider,
  TTSProviderConfig,
} from '../speech/providers/tts-provider.js'
import type { ClaudeSubagentStopEvent } from '../types/claude.js'

import { AudioPlayer } from '../audio/audio-player.js'
import { detectPlatform, Platform } from '../audio/platform.js'
import { BaseHook, type HookConfig } from '../base-hook.js'
// Import providers to trigger registration
import '../speech/providers/index.js'
import { TTSProviderFactory } from '../speech/providers/provider-factory.js'

export interface SubagentStopHookConfig extends HookConfig {
  notify?: boolean
  speak?: boolean
  tts?: {
    provider: 'openai' | 'macos' | 'auto'
    fallbackProvider?: 'macos' | 'none'
    openai?: TTSProviderConfig
    macos?: TTSProviderConfig
  }
}

export class SubagentStopHook extends BaseHook<ClaudeSubagentStopEvent> {
  private readonly notify: boolean
  private readonly speak: boolean
  private readonly player: AudioPlayer
  private ttsProvider: TTSProvider | null = null
  private readonly ttsProviderPromise: Promise<TTSProvider>
  private readonly platform: Platform

  constructor(config: SubagentStopHookConfig = {}) {
    super('SubagentStop', config)
    this.notify = config.notify ?? false
    this.speak = config.speak ?? false
    this.player = new AudioPlayer()

    // Initialize TTS provider using factory (async) with configuration from config file
    const ttsConfig = config.tts || {
      provider: 'auto' as const,
      fallbackProvider: 'macos' as const,
      macos: { enabled: true },
    }
    const factoryConfig = {
      provider: ttsConfig.provider,
      fallbackProvider: ttsConfig.fallbackProvider,
      openai: ttsConfig.openai as TTSProviderConfig | undefined,
      macos: ttsConfig.macos as TTSProviderConfig | undefined,
    }
    this.ttsProviderPromise = TTSProviderFactory.createWithFallback(
      factoryConfig,
    ).then((provider) => {
      this.ttsProvider = provider
      return provider
    })
    this.platform = detectPlatform()
  }

  protected async handle(event: ClaudeSubagentStopEvent): Promise<void> {
    // Extract subagent info from data (test format) or use session_id (Claude format)
    const subagentId = event.data?.subagentId || event.session_id || 'unknown'
    const subagentType = event.data?.subagentType || 'Task'
    const result = event.data?.result

    // Log transcript path if available (Claude format)
    if (event.transcript_path && this.config.debug) {
      this.log.debug(`Transcript: ${event.transcript_path}`)
    }

    // Format subagent type for display
    const agentTypeDisplay = this.formatAgentType(subagentType)

    // Log subagent completion
    this.log.info(`Subagent completed: ${agentTypeDisplay} (${subagentId})`)

    if (this.config.debug && result) {
      this.log.debug(`Result: ${JSON.stringify(result)}`)
    }

    // Handle speech if enabled
    if (this.speak) {
      await this.handleSpeech(event)
    }

    // Only play sound if notify is enabled
    if (!this.notify) {
      this.log.debug('Subagent notification sound disabled')
      return
    }

    // Check if platform is supported
    if (this.platform === Platform.Unsupported) {
      this.log.warning('Audio notifications not supported on this platform')
      return
    }

    // Get notification sound
    const sounds = this.player.getSystemSounds(this.platform)
    const soundFile = sounds.notification

    if (!soundFile) {
      this.log.warning('No notification sound available for platform')
      return
    }

    // Play the sound
    try {
      const success = await this.player.playSound(soundFile, this.platform)
      if (!success) {
        this.log.warning('Failed to play subagent notification sound')
      } else {
        this.log.success('Subagent notification played')
      }
    } catch (error) {
      this.log.error(
        `Error playing notification sound: ${
          error instanceof Error ? error.message : 'Unknown error'
        }`,
      )
    }
  }

  private async handleSpeech(event: ClaudeSubagentStopEvent): Promise<void> {
    // Wait for TTS provider to be initialized
    const ttsProvider = await this.ttsProviderPromise

    if (!(await ttsProvider.isAvailable())) {
      this.log.debug('TTS provider not available')
      return
    }

    // Generate speech message based on subagent completion
    const subagentType = event.data?.subagentType || 'unknown'
    const agentTypeDisplay = this.formatAgentType(subagentType)
    const speechMessage = `${agentTypeDisplay} completed`

    try {
      const result = await ttsProvider.speak(speechMessage)
      if (result.success) {
        this.log.success('Speech notification delivered')
      } else {
        this.log.warning(
          `Failed to deliver speech notification: ${result.error || 'Unknown error'}`,
        )
      }
    } catch (error) {
      this.log.error(
        `Error delivering speech notification: ${
          error instanceof Error ? error.message : 'Unknown error'
        }`,
      )
    }
  }

  private formatAgentType(type: string): string {
    const typeMap: Record<string, string> = {
      'general-purpose': 'General purpose agent',
      'code-reviewer': 'Code reviewer agent',
      'test-runner': 'Test runner agent',
    }

    return typeMap[type] || `${type} agent`
  }
}

// Hook entry point
export async function main(): Promise<void> {
  // Load auto-config from .claude/hooks/subagent-stop.config.json
  const { loadAutoConfig } = await import('../utils/auto-config.js')
  const jsonConfig =
    await loadAutoConfig<SubagentStopHookConfig>('subagent-stop')

  // Merge with CLI arguments (CLI args override JSON)
  const config: SubagentStopHookConfig = {
    ...jsonConfig,
    notify: process.argv.includes('--notify') || jsonConfig.notify,
    speak: process.argv.includes('--speak') || jsonConfig.speak,
    debug: process.argv.includes('--debug') || jsonConfig.debug,
  }

  await BaseHook.execute(SubagentStopHook, config)
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch((error) => {
    console.error('Fatal error:', error)
    process.exit(1)
  })
}

/**
 * Notification hook for Claude Code
 * Plays sound when Claude needs user attention
 */

import type {
  TTSProvider,
  TTSProviderConfig,
} from '../speech/providers/tts-provider.js'
import type { ClaudeNotificationEvent } from '../types/claude.js'

import { AudioPlayer } from '../audio/audio-player.js'
import { detectPlatform, Platform } from '../audio/platform.js'
import { BaseHook, type HookConfig } from '../base-hook.js'
import { loadConfigFromEnv } from '../config/env-config.js'
import { Cooldown } from '../speech/cooldown.js'
// Import providers to trigger registration
import '../speech/providers/index.js'
import {
  TTSProviderFactory,
  type FactoryConfig,
} from '../speech/providers/provider-factory.js'
import { QuietHours } from '../speech/quiet-hours.js'

export interface NotificationHookConfig extends HookConfig {
  notifySound?: boolean
  speak?: boolean
  cooldownPeriod?: number
  allowUrgentOverride?: boolean
  quietHours?: {
    enabled: boolean
    ranges: Array<{ start: string; end: string; name?: string }>
    allowUrgentOverride?: boolean
  }
  tts?: {
    provider: 'openai' | 'macos' | 'auto'
    fallbackProvider?: 'macos' | 'none'
    openai?: {
      apiKey?: string
      model?: 'tts-1' | 'tts-1-hd'
      voice?: 'alloy' | 'echo' | 'fable' | 'onyx' | 'nova' | 'shimmer'
      speed?: number
      format?: 'mp3' | 'opus' | 'aac' | 'flac'
    }
    macos?: {
      voice?: string
      rate?: number
      volume?: number
      enabled?: boolean
    }
  }
}

export class NotificationHook extends BaseHook<ClaudeNotificationEvent> {
  private readonly notifySound: boolean
  private readonly speak: boolean
  private readonly player: AudioPlayer
  private ttsProvider: TTSProvider | null = null
  private readonly ttsProviderPromise: Promise<TTSProvider>
  private readonly platform: Platform
  private readonly cooldown: Cooldown
  private readonly quietHours: QuietHours

  constructor(config: NotificationHookConfig = {}) {
    // Load configuration from environment variables
    const envConfig = loadConfigFromEnv(config)

    super('Notification', envConfig)
    this.notifySound = envConfig.notifySound ?? false
    this.speak = envConfig.speak ?? false
    this.player = new AudioPlayer()

    // Initialize TTS provider using factory (async) with environment config
    const ttsConfig = envConfig.tts as Partial<FactoryConfig> | undefined
    const factoryConfig: FactoryConfig = {
      provider: ttsConfig?.provider || 'auto',
      fallbackProvider: ttsConfig?.fallbackProvider || 'macos',
      openai: ttsConfig?.openai as TTSProviderConfig | undefined,
      macos: ttsConfig?.macos || { enabled: true },
    }
    this.ttsProviderPromise = TTSProviderFactory.createWithFallback(
      factoryConfig,
    ).then((provider) => {
      this.ttsProvider = provider
      return provider
    })
    this.platform = detectPlatform()

    // Initialize cooldown system
    this.cooldown = new Cooldown({
      cooldownPeriod: envConfig.cooldownPeriod ?? 5000, // 5 seconds default
      allowUrgentOverride: envConfig.allowUrgentOverride ?? false,
    })

    // Initialize quiet hours system
    this.quietHours = new QuietHours({
      enabled: envConfig.quietHours?.enabled ?? false,
      ranges: envConfig.quietHours?.ranges ?? [],
      allowUrgentOverride: envConfig.quietHours?.allowUrgentOverride ?? false,
    })
  }

  protected async handle(event: ClaudeNotificationEvent): Promise<void> {
    this.log.info('Notification received')

    // Extract message from either root level (Claude format) or data (test format)
    const message = event.message || event.data?.message
    const priority = event.data?.priority || 'medium'

    if (this.config.debug) {
      this.log.debug(`Notification message: ${message}`)
      if (event.session_id) {
        this.log.debug(`Session ID: ${event.session_id}`)
      }
      if (event.cwd) {
        this.log.debug(`Working directory: ${event.cwd}`)
      }
    }

    const isUrgent = priority === 'high'

    // Check quiet hours
    if (this.quietHours.isQuietTime(undefined, isUrgent)) {
      this.log.debug('Notification suppressed due to quiet hours')
      return
    }

    // Check cooldown period
    if (!this.cooldown.canNotify(isUrgent, 'notification')) {
      const remaining = this.cooldown.getRemainingCooldown('notification')
      this.log.debug(
        `Notification suppressed due to cooldown (${Math.round(remaining / 1000)}s remaining)`,
      )
      return
    }

    // Prepare parallel operations for speech and sound
    const promises: Promise<void>[] = []

    // Add speech promise if enabled
    if (this.speak) {
      promises.push(this.handleSpeech(event))
    }

    // Add sound promise if enabled
    if (this.notifySound) {
      const soundPromise = this.handleSound(priority)
      if (soundPromise) {
        promises.push(soundPromise)
      }
    }

    // Execute speech and sound in parallel
    if (promises.length > 0) {
      await Promise.allSettled(promises)
    }
  }

  private async handleSound(priority: string): Promise<void> {
    // Check if platform is supported
    if (this.platform === Platform.Unsupported) {
      this.log.warning('Audio notifications not supported on this platform')
      return
    }

    // Get appropriate sound based on priority
    const sounds = this.player.getSystemSounds(this.platform)
    let soundFile: string

    switch (priority) {
      case 'high':
        soundFile = sounds.error || sounds.notification
        break
      case 'low':
        soundFile = sounds.success || sounds.notification
        break
      case 'medium':
      default:
        soundFile = sounds.notification
        break
    }

    if (!soundFile) {
      this.log.warning('No notification sound available for platform')
      return
    }

    // Play the sound
    try {
      const success = await this.player.playSound(soundFile, this.platform)
      if (!success) {
        this.log.warning('Failed to play notification sound')
      } else {
        this.log.success('Notification sound played')
        // Record successful notification for cooldown tracking
        this.cooldown.recordNotification('notification')
      }
    } catch (error) {
      this.log.error(
        `Error playing notification sound: ${error instanceof Error ? error.message : 'Unknown error'}`,
      )
    }
  }

  private async handleSpeech(event: ClaudeNotificationEvent): Promise<void> {
    // Wait for TTS provider to be initialized
    const ttsProvider = await this.ttsProviderPromise

    if (!(await ttsProvider.isAvailable())) {
      this.log.debug('TTS provider not available')
      return
    }

    // Extract message from either root level (Claude format) or data (test format)
    const message =
      event.message || event.data?.message || 'Claude needs your attention'
    const priority = event.data?.priority || 'medium'

    const speechMessage = `${priority} priority: ${message}`

    try {
      // Use detached mode so audio continues even if Claude terminates the process
      const result = await ttsProvider.speak(speechMessage, { detached: true })
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
}

// Hook entry point
export async function main(): Promise<void> {
  // Load auto-config from .claude/hooks/notification.config.json
  const { loadAutoConfig } = await import('../utils/auto-config.js')
  const jsonConfig =
    await loadAutoConfig<NotificationHookConfig>('notification')

  // Merge with CLI arguments (CLI args override JSON)
  const config: NotificationHookConfig = {
    ...jsonConfig,
    notifySound:
      process.argv.includes('--notify-sound') || jsonConfig.notifySound,
    speak: process.argv.includes('--speak') || jsonConfig.speak,
    debug: process.argv.includes('--debug') || jsonConfig.debug,
  }

  await BaseHook.execute(NotificationHook, config)
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch((error) => {
    console.error('Fatal error:', error)
    process.exit(1)
  })
}

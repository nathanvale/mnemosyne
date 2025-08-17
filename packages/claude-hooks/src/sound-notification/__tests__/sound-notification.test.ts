import { describe, it, expect, vi, beforeEach } from 'vitest'

import type { SoundNotificationConfig } from '../../types/config'

import { loadSoundConfig } from '../config'

// Mock fs module - need to mock the exact way it's imported
vi.mock('fs', () => {
  const mockReadFile = vi.fn()
  const mockStatSync = vi.fn().mockReturnValue({
    isFile: () => true,
  })

  return {
    default: {
      promises: {
        readFile: mockReadFile,
      },
      statSync: mockStatSync,
    },
    promises: {
      readFile: mockReadFile,
    },
    statSync: mockStatSync,
  }
})

describe('Sound Notification Hook', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    // Reset environment variables
    Object.keys(process.env).forEach((key) => {
      if (key.startsWith('CLAUDE_HOOKS_')) {
        delete process.env[key]
      }
    })
  })

  describe('loadSoundConfig', () => {
    it('should load default config when file not found', async () => {
      const fs = await import('fs')
      vi.mocked(fs.promises.readFile).mockRejectedValue(
        new Error('File not found'),
      )

      const config = await loadSoundConfig('/path/to/config.json')

      expect(config.playOnSuccess).toBe(true)
      expect(config.playOnWarning).toBe(false)
      expect(config.playOnError).toBe(false)
      expect(config.volume).toBe('medium')
      expect(config.delay).toBe(0)
      expect(config.cooldown).toBe(2000)
    })

    it('should load config from file', async () => {
      const fs = await import('fs')
      const mockConfig: SoundNotificationConfig = {
        settings: {
          playOnSuccess: false,
          playOnWarning: true,
          volume: 'high',
          delay: 500,
        },
      }
      vi.mocked(fs.promises.readFile).mockResolvedValue(
        JSON.stringify(mockConfig),
      )

      const config = await loadSoundConfig('/path/to/config.json')

      expect(config.playOnSuccess).toBe(false)
      expect(config.playOnWarning).toBe(true)
      expect(config.volume).toBe('high')
      expect(config.delay).toBe(500)
    })

    it('should override config with environment variables', async () => {
      const fs = await import('fs')
      const mockConfig: SoundNotificationConfig = {
        settings: {
          playOnSuccess: false,
          volume: 'low',
        },
      }
      vi.mocked(fs.promises.readFile).mockResolvedValue(
        JSON.stringify(mockConfig),
      )

      process.env.CLAUDE_HOOKS_SOUND_SUCCESS = 'true'
      process.env.CLAUDE_HOOKS_SOUND_VOLUME = 'high'
      process.env.CLAUDE_HOOKS_SOUND_DELAY = '1000'

      const config = await loadSoundConfig('/path/to/config.json')

      expect(config.playOnSuccess).toBe(true) // Overridden by env
      expect(config.volume).toBe('high') // Overridden by env
      expect(config.delay).toBe(1000) // Overridden by env
    })
  })
})

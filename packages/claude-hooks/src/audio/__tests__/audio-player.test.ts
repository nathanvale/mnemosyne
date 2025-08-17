import { exec } from 'child_process'
import {
  describe,
  expect,
  it,
  vi,
  beforeEach,
  afterEach,
  type MockedFunction,
} from 'vitest'

// Mock child_process before importing AudioPlayer
vi.mock('child_process')

import { AudioPlayer } from '../audio-player'
import { Platform } from '../platform'

describe('AudioPlayer', () => {
  let player: AudioPlayer
  let mockExec: MockedFunction<typeof exec>

  beforeEach(() => {
    vi.clearAllMocks()
    mockExec = vi.mocked(exec) as MockedFunction<typeof exec>
    player = new AudioPlayer()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe('macOS Audio', () => {
    it('should play sound using afplay on macOS', async () => {
      mockExec.mockImplementation(
        (
          cmd: string,
          callback: (
            error: Error | null,
            stdout: string,
            stderr: string,
          ) => void,
        ) => {
          callback(null, '', '')
        },
      )

      const result = await player.playSound(
        '/System/Library/Sounds/Glass.aiff',
        Platform.macOS,
      )

      expect(result).toBe(true)
      expect(mockExec).toHaveBeenCalledWith(
        'afplay "/System/Library/Sounds/Glass.aiff"',
        expect.any(Function),
      )
    })

    it('should handle errors when afplay fails', async () => {
      mockExec.mockImplementation(
        (
          cmd: string,
          callback: (
            error: Error | null,
            stdout: string,
            stderr: string,
          ) => void,
        ) => {
          callback(new Error('afplay not found'), '', '')
        },
      )

      const result = await player.playSound(
        '/invalid/sound.aiff',
        Platform.macOS,
      )

      expect(result).toBe(false)
    })

    it('should escape file paths with spaces', async () => {
      mockExec.mockImplementation(
        (
          cmd: string,
          callback: (
            error: Error | null,
            stdout: string,
            stderr: string,
          ) => void,
        ) => {
          callback(null, '', '')
        },
      )

      await player.playSound('/path with spaces/sound.aiff', Platform.macOS)

      expect(mockExec).toHaveBeenCalledWith(
        'afplay "/path with spaces/sound.aiff"',
        expect.any(Function),
      )
    })
  })

  describe('Windows Audio', () => {
    it('should play sound using PowerShell on Windows', async () => {
      mockExec.mockImplementation(
        (
          cmd: string,
          callback: (
            error: Error | null,
            stdout: string,
            stderr: string,
          ) => void,
        ) => {
          callback(null, '', '')
        },
      )

      const result = await player.playSound(
        'C:\\Windows\\Media\\chord.wav',
        Platform.Windows,
      )

      expect(result).toBe(true)
      expect(mockExec).toHaveBeenCalledWith(
        expect.stringContaining('powershell'),
        expect.any(Function),
      )
      expect(mockExec).toHaveBeenCalledWith(
        expect.stringContaining('System.Media.SoundPlayer'),
        expect.any(Function),
      )
    })

    it('should handle Windows paths correctly', async () => {
      mockExec.mockImplementation(
        (
          cmd: string,
          callback: (
            error: Error | null,
            stdout: string,
            stderr: string,
          ) => void,
        ) => {
          callback(null, '', '')
        },
      )

      await player.playSound(
        'C:\\Program Files\\App\\sound.wav',
        Platform.Windows,
      )

      const call = mockExec.mock.calls[0][0]
      expect(call).toContain('C:\\Program Files\\App\\sound.wav')
    })
  })

  describe('Linux Audio', () => {
    it('should try aplay first on Linux', async () => {
      mockExec.mockImplementation(
        (
          cmd: string,
          callback: (
            error: Error | null,
            stdout: string,
            stderr: string,
          ) => void,
        ) => {
          if (cmd.includes('which aplay')) {
            callback(null, '/usr/bin/aplay', '')
          } else if (cmd.includes('aplay')) {
            callback(null, '', '')
          } else {
            callback(new Error('Command not found'), '', '')
          }
        },
      )

      const result = await player.playSound(
        '/usr/share/sounds/bell.wav',
        Platform.Linux,
      )

      expect(result).toBe(true)
      expect(mockExec).toHaveBeenCalledWith('which aplay', expect.any(Function))
      expect(mockExec).toHaveBeenCalledWith(
        'aplay "/usr/share/sounds/bell.wav"',
        expect.any(Function),
      )
    })

    it('should fallback to paplay if aplay not available', async () => {
      mockExec.mockImplementation(
        (
          cmd: string,
          callback: (
            error: Error | null,
            stdout: string,
            stderr: string,
          ) => void,
        ) => {
          if (cmd.includes('which aplay')) {
            callback(new Error('not found'), '', '')
          } else if (cmd.includes('which paplay')) {
            callback(null, '/usr/bin/paplay', '')
          } else if (cmd.includes('paplay')) {
            callback(null, '', '')
          } else {
            callback(new Error('Command not found'), '', '')
          }
        },
      )

      const result = await player.playSound(
        '/usr/share/sounds/bell.wav',
        Platform.Linux,
      )

      expect(result).toBe(true)
      expect(mockExec).toHaveBeenCalledWith(
        'paplay "/usr/share/sounds/bell.wav"',
        expect.any(Function),
      )
    })

    it('should fallback to sox play if others not available', async () => {
      mockExec.mockImplementation(
        (
          cmd: string,
          callback: (
            error: Error | null,
            stdout: string,
            stderr: string,
          ) => void,
        ) => {
          if (cmd === 'which aplay') {
            callback(new Error('not found'), '', '')
          } else if (cmd === 'which paplay') {
            callback(new Error('not found'), '', '')
          } else if (cmd === 'which play') {
            callback(null, '/usr/bin/play', '')
          } else if (cmd === 'play "/usr/share/sounds/bell.wav"') {
            callback(null, '', '')
          } else {
            callback(new Error('Command not found'), '', '')
          }
        },
      )

      const result = await player.playSound(
        '/usr/share/sounds/bell.wav',
        Platform.Linux,
      )

      expect(result).toBe(true)
      // Check that we tried which commands for all players in order
      expect(mockExec).toHaveBeenCalledWith('which aplay', expect.any(Function))
      expect(mockExec).toHaveBeenCalledWith(
        'which paplay',
        expect.any(Function),
      )
      expect(mockExec).toHaveBeenCalledWith('which play', expect.any(Function))
      // And finally called play command
      expect(mockExec).toHaveBeenCalledWith(
        'play "/usr/share/sounds/bell.wav"',
        expect.any(Function),
      )
    })

    it('should return false if no Linux audio player available', async () => {
      mockExec.mockImplementation(
        (
          cmd: string,
          callback: (
            error: Error | null,
            stdout: string,
            stderr: string,
          ) => void,
        ) => {
          callback(new Error('not found'), '', '')
        },
      )

      const result = await player.playSound(
        '/usr/share/sounds/bell.wav',
        Platform.Linux,
      )

      expect(result).toBe(false)
    })
  })

  describe('Unsupported Platform', () => {
    it('should return false for unsupported platforms', async () => {
      const result = await player.playSound(
        '/some/sound.wav',
        Platform.Unsupported,
      )

      expect(result).toBe(false)
      expect(mockExec).not.toHaveBeenCalled()
    })
  })

  describe('System Sound Helpers', () => {
    it('should get correct macOS system sounds', () => {
      const sounds = player.getSystemSounds(Platform.macOS)

      expect(sounds).toHaveProperty('success')
      expect(sounds).toHaveProperty('error')
      expect(sounds).toHaveProperty('notification')
      expect(sounds.success).toContain('/System/Library/Sounds/')
    })

    it('should get correct Windows system sounds', () => {
      const sounds = player.getSystemSounds(Platform.Windows)

      expect(sounds).toHaveProperty('success')
      expect(sounds).toHaveProperty('error')
      expect(sounds).toHaveProperty('notification')
      expect(sounds.success).toContain('Windows\\Media')
    })

    it('should return empty sounds for Linux', () => {
      const sounds = player.getSystemSounds(Platform.Linux)

      expect(sounds.success).toBe('')
      expect(sounds.error).toBe('')
      expect(sounds.notification).toBe('')
    })
  })
})

/**
 * Tests for speech engine functionality
 */

import { exec } from 'node:child_process'
import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest'

import { Platform } from '../../audio/platform'
import { detectPlatform } from '../../audio/platform'
import { SpeechEngine, type SpeechOptions } from '../speech-engine'

// Mock child_process
vi.mock('node:child_process', () => {
  const mockExec = vi.fn()
  return {
    exec: mockExec,
    default: {
      exec: mockExec,
    },
  }
})

// Mock platform detection
vi.mock('../../audio/platform.js', async () => {
  const actual = await vi.importActual('../../audio/platform.js')
  return {
    ...actual,
    detectPlatform: vi.fn(),
  }
})

const mockExec = vi.mocked(exec)
const mockDetectPlatform = vi.mocked(detectPlatform)

describe('SpeechEngine', () => {
  let speechEngine: SpeechEngine

  beforeEach(() => {
    vi.clearAllMocks()
    mockDetectPlatform.mockReturnValue(Platform.macOS)
    speechEngine = new SpeechEngine()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe('Constructor', () => {
    it('should create speech engine with default options', () => {
      expect(speechEngine).toBeDefined()
    })

    it('should create speech engine with custom options', () => {
      const options: SpeechOptions = {
        voice: 'Alex',
        rate: 200,
        volume: 0.8,
        enabled: true,
      }

      const engine = new SpeechEngine(options)
      expect(engine).toBeDefined()
    })
  })

  describe('Platform Support', () => {
    it('should detect macOS as supported platform', () => {
      mockDetectPlatform.mockReturnValue(Platform.macOS)
      const engine = new SpeechEngine()

      expect(engine.isSupported()).toBe(true)
    })

    it('should detect Windows as unsupported platform', () => {
      mockDetectPlatform.mockReturnValue(Platform.Windows)
      const engine = new SpeechEngine()

      expect(engine.isSupported()).toBe(false)
    })

    it('should detect Linux as unsupported platform', () => {
      mockDetectPlatform.mockReturnValue(Platform.Linux)
      const engine = new SpeechEngine()

      expect(engine.isSupported()).toBe(false)
    })

    it('should detect unsupported platform', () => {
      mockDetectPlatform.mockReturnValue(Platform.Unsupported)
      const engine = new SpeechEngine()

      expect(engine.isSupported()).toBe(false)
    })
  })

  describe('Speech Generation', () => {
    beforeEach(() => {
      mockDetectPlatform.mockReturnValue(Platform.macOS)
      mockExec.mockImplementation((command, callback) => {
        if (callback) {
          ;(
            callback as (
              error: Error | null,
              stdout: string,
              stderr: string,
            ) => void
          )(null, '', '')
        }
        return {} as never
      })
    })

    it('should speak simple text on macOS', async () => {
      const text = 'Hello, this is a test message.'

      await speechEngine.speak(text)

      expect(mockExec).toHaveBeenCalledWith(
        `say -v "Samantha" "${text}"`,
        expect.any(Function),
      )
    })

    it('should speak with custom voice', async () => {
      const text = 'Testing with Alex voice'
      const options: SpeechOptions = { voice: 'Alex' }
      const engine = new SpeechEngine(options)

      await engine.speak(text)

      expect(mockExec).toHaveBeenCalledWith(
        `say -v "Alex" "${text}"`,
        expect.any(Function),
      )
    })

    it('should speak with custom rate', async () => {
      const text = 'Testing with custom rate'
      const options: SpeechOptions = { rate: 250 }
      const engine = new SpeechEngine(options)

      await engine.speak(text)

      expect(mockExec).toHaveBeenCalledWith(
        `say -v "Samantha" -r 250 "${text}"`,
        expect.any(Function),
      )
    })

    it('should speak with custom volume', async () => {
      const text = 'Testing with custom volume'
      const options: SpeechOptions = { volume: 0.5 }
      const engine = new SpeechEngine(options)

      await engine.speak(text)

      expect(mockExec).toHaveBeenCalledWith(
        `say -v "Samantha" --volume=0.5 "${text}"`,
        expect.any(Function),
      )
    })

    it('should speak with all custom options', async () => {
      const text = 'Testing with all options'
      const options: SpeechOptions = {
        voice: 'Karen',
        rate: 180,
        volume: 0.7,
      }
      const engine = new SpeechEngine(options)

      await engine.speak(text)

      expect(mockExec).toHaveBeenCalledWith(
        `say -v "Karen" -r 180 --volume=0.7 "${text}"`,
        expect.any(Function),
      )
    })

    it('should escape special characters in text', async () => {
      const text = 'Text with "quotes" and $pecial characters'

      await speechEngine.speak(text)

      expect(mockExec).toHaveBeenCalledWith(
        `say -v "Samantha" "Text with \\"quotes\\" and \\$pecial characters"`,
        expect.any(Function),
      )
    })

    it('should handle multi-line text', async () => {
      const text = 'Line one\nLine two\nLine three'

      await speechEngine.speak(text)

      expect(mockExec).toHaveBeenCalledWith(
        `say -v "Samantha" "Line one Line two Line three"`,
        expect.any(Function),
      )
    })

    it('should truncate very long text', async () => {
      const longText = 'a'.repeat(1000)
      const expectedText = `${'a'.repeat(500)}...`

      await speechEngine.speak(longText)

      expect(mockExec).toHaveBeenCalledWith(
        `say -v "Samantha" "${expectedText}"`,
        expect.any(Function),
      )
    })
  })

  describe('Error Handling', () => {
    beforeEach(() => {
      mockDetectPlatform.mockReturnValue(Platform.macOS)
    })

    it('should handle command execution errors gracefully', async () => {
      const error = new Error('Command failed')
      mockExec.mockImplementation((command, callback) => {
        if (callback) {
          ;(
            callback as (
              error: Error | null,
              stdout: string,
              stderr: string,
            ) => void
          )(error, '', '')
        }
        return {} as never
      })

      const result = await speechEngine.speak('Test message')

      expect(result).toBe(false)
    })

    it('should return false for unsupported platforms', async () => {
      mockDetectPlatform.mockReturnValue(Platform.Windows)
      const engine = new SpeechEngine()

      const result = await engine.speak('Test message')

      expect(result).toBe(false)
      expect(mockExec).not.toHaveBeenCalled()
    })

    it('should return false when speech is disabled', async () => {
      const options: SpeechOptions = { enabled: false }
      const engine = new SpeechEngine(options)

      const result = await engine.speak('Test message')

      expect(result).toBe(false)
      expect(mockExec).not.toHaveBeenCalled()
    })

    it('should handle empty text gracefully', async () => {
      const result = await speechEngine.speak('')

      expect(result).toBe(false)
      expect(mockExec).not.toHaveBeenCalled()
    })

    it('should handle whitespace-only text gracefully', async () => {
      const result = await speechEngine.speak('   \n\t   ')

      expect(result).toBe(false)
      expect(mockExec).not.toHaveBeenCalled()
    })
  })

  describe('Voice Management', () => {
    beforeEach(() => {
      mockDetectPlatform.mockReturnValue(Platform.macOS)
    })

    it('should list available voices on macOS', async () => {
      const mockVoicesOutput = `Alex             en_US    # Most people recognize me by my voice.
Karen            en_AU    # Hello, my name is Karen. I am an Australian-English voice.
Samantha         en_US    # Hello, my name is Samantha. I am an American-English voice.`

      mockExec.mockImplementation((command, callback) => {
        if (command === 'say -v ?' && callback) {
          ;(
            callback as (
              error: Error | null,
              stdout: string,
              stderr: string,
            ) => void
          )(null, mockVoicesOutput, '')
        }
        return {} as never
      })

      const voices = await speechEngine.getAvailableVoices()

      expect(voices).toEqual([
        {
          name: 'Alex',
          language: 'en_US',
          description: 'Most people recognize me by my voice.',
        },
        {
          name: 'Karen',
          language: 'en_AU',
          description:
            'Hello, my name is Karen. I am an Australian-English voice.',
        },
        {
          name: 'Samantha',
          language: 'en_US',
          description:
            'Hello, my name is Samantha. I am an American-English voice.',
        },
      ])
    })

    it('should return empty array for voices on unsupported platforms', async () => {
      mockDetectPlatform.mockReturnValue(Platform.Windows)
      const engine = new SpeechEngine()

      const voices = await engine.getAvailableVoices()

      expect(voices).toEqual([])
      expect(mockExec).not.toHaveBeenCalled()
    })

    it('should handle voice listing errors gracefully', async () => {
      mockExec.mockImplementation((command, callback) => {
        if (callback) {
          ;(
            callback as (
              error: Error | null,
              stdout: string,
              stderr: string,
            ) => void
          )(new Error('Voice listing failed'), '', '')
        }
        return {} as never
      })

      const voices = await speechEngine.getAvailableVoices()

      expect(voices).toEqual([])
    })
  })

  describe('Configuration', () => {
    it('should update speech options', () => {
      const newOptions: SpeechOptions = {
        voice: 'Victoria',
        rate: 220,
        volume: 0.9,
        enabled: true,
      }

      speechEngine.updateOptions(newOptions)

      // Should use new options in next speak call
    })

    it('should get current options', () => {
      const options: SpeechOptions = {
        voice: 'Daniel',
        rate: 150,
        volume: 0.6,
        enabled: true,
      }

      const engine = new SpeechEngine(options)
      const currentOptions = engine.getOptions()

      expect(currentOptions).toEqual(options)
    })

    it('should toggle speech on/off', () => {
      speechEngine.setEnabled(false)
      expect(speechEngine.getOptions().enabled).toBe(false)

      speechEngine.setEnabled(true)
      expect(speechEngine.getOptions().enabled).toBe(true)
    })
  })
})

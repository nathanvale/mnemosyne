import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'

import { main } from '../list-voices'

// Mock the providers
vi.mock('../../speech/providers/openai-provider.js', () => ({
  OpenAIProvider: vi.fn().mockImplementation(() => ({
    getVoices: vi.fn().mockResolvedValue([
      {
        id: 'alloy',
        name: 'Alloy',
        language: 'en-US',
        gender: 'neutral',
        description: 'Neutral and balanced',
      },
      {
        id: 'nova',
        name: 'Nova',
        language: 'en-US',
        gender: 'female',
        description: 'Young and energetic',
      },
    ]),
    speak: vi.fn().mockResolvedValue({ success: true }),
  })),
}))

vi.mock('../../speech/providers/elevenlabs-provider.js', () => ({
  ElevenLabsProvider: vi.fn().mockImplementation(() => ({
    getVoices: vi.fn().mockResolvedValue([
      {
        id: 'pNInz6obpgDQGcFmaJgB',
        name: 'Adam',
        language: 'en-US',
        gender: 'male',
        description: 'Deep American voice',
      },
    ]),
    speak: vi.fn().mockResolvedValue({ success: true }),
  })),
}))

vi.mock('../../speech/providers/macos-provider.js', () => ({
  MacOSProvider: vi.fn().mockImplementation(() => ({
    speak: vi.fn().mockResolvedValue({ success: true }),
  })),
}))

// Mock the logger
vi.mock('../../utils/logger.js', () => ({
  createLogger: vi.fn(() => ({
    info: vi.fn(),
    warning: vi.fn(),
    error: vi.fn(),
    success: vi.fn(),
  })),
}))

describe('list-voices CLI', () => {
  let originalArgv: string[]
  let originalEnv: NodeJS.ProcessEnv
  let consoleLogSpy: ReturnType<typeof vi.spyOn>
  let stdoutWriteSpy: any // eslint-disable-line @typescript-eslint/no-explicit-any

  beforeEach(() => {
    originalArgv = process.argv
    originalEnv = { ...process.env }
    consoleLogSpy = vi.spyOn(console, 'log').mockImplementation(() => {})
    stdoutWriteSpy = vi
      .spyOn(process.stdout, 'write')
      .mockImplementation(() => true)
  })

  afterEach(() => {
    process.argv = originalArgv
    process.env = originalEnv
    vi.clearAllMocks()
    consoleLogSpy.mockRestore()
    stdoutWriteSpy.mockRestore()
  })

  describe('command line argument parsing', () => {
    it('should show help when --help flag is provided', async () => {
      process.argv = ['node', 'list-voices.js', '--help']
      const exitCode = await main()
      expect(exitCode).toBe(0)
    })

    it('should show help when -h flag is provided', async () => {
      process.argv = ['node', 'list-voices.js', '-h']
      const exitCode = await main()
      expect(exitCode).toBe(0)
    })

    it('should return error for unknown option', async () => {
      process.argv = ['node', 'list-voices.js', '--unknown']
      const exitCode = await main()
      expect(exitCode).toBe(1)
    })

    it('should parse --provider flag correctly', async () => {
      process.argv = ['node', 'list-voices.js', '--provider', 'openai']
      const exitCode = await main()
      expect(exitCode).toBe(0)
    })

    it('should parse -p flag correctly', async () => {
      process.argv = ['node', 'list-voices.js', '-p', 'openai']
      const exitCode = await main()
      expect(exitCode).toBe(0)
    })

    it('should parse --format flag correctly', async () => {
      process.argv = ['node', 'list-voices.js', '--format', 'json']
      const exitCode = await main()
      expect(exitCode).toBe(0)
    })

    it('should parse -f flag correctly', async () => {
      process.argv = ['node', 'list-voices.js', '-f', 'json']
      const exitCode = await main()
      expect(exitCode).toBe(0)
    })

    it('should parse --preview flag correctly', async () => {
      process.argv = ['node', 'list-voices.js', '--preview']
      const exitCode = await main()
      expect(exitCode).toBe(0)
    })

    it('should parse --api-key flag correctly', async () => {
      process.argv = ['node', 'list-voices.js', '--api-key', 'test-key']
      const exitCode = await main()
      expect(exitCode).toBe(0)
    })
  })

  describe('voice discovery', () => {
    it('should list all voices by default', async () => {
      process.argv = ['node', 'list-voices.js']
      const exitCode = await main()
      expect(exitCode).toBe(0)
      expect(stdoutWriteSpy).toHaveBeenCalled()
    })

    it('should list only OpenAI voices when specified', async () => {
      process.argv = ['node', 'list-voices.js', '--provider', 'openai']
      const exitCode = await main()
      expect(exitCode).toBe(0)
      expect(stdoutWriteSpy).toHaveBeenCalled()
    })

    it('should list only ElevenLabs voices when specified', async () => {
      process.env.ELEVENLABS_API_KEY = 'test-key'
      process.argv = ['node', 'list-voices.js', '--provider', 'elevenlabs']
      const exitCode = await main()
      expect(exitCode).toBe(0)
      expect(stdoutWriteSpy).toHaveBeenCalled()
    })

    it('should use API key from command line over environment', async () => {
      process.env.ELEVENLABS_API_KEY = 'env-key'
      process.argv = [
        'node',
        'list-voices.js',
        '--provider',
        'elevenlabs',
        '--api-key',
        'cli-key',
      ]
      const exitCode = await main()
      expect(exitCode).toBe(0)
    })

    it('should handle missing ElevenLabs API key gracefully', async () => {
      delete process.env.ELEVENLABS_API_KEY
      process.argv = ['node', 'list-voices.js', '--provider', 'elevenlabs']
      const exitCode = await main()
      expect(exitCode).toBe(0)
    })
  })

  describe('output formatting', () => {
    it('should output as table by default', async () => {
      process.argv = ['node', 'list-voices.js', '--provider', 'openai']
      const exitCode = await main()
      expect(exitCode).toBe(0)
      const output = stdoutWriteSpy.mock.calls.join('')
      expect(output).toContain('│')
      expect(output).toContain('─')
    })

    it('should output as JSON when specified', async () => {
      process.argv = [
        'node',
        'list-voices.js',
        '--provider',
        'openai',
        '--format',
        'json',
      ]
      const exitCode = await main()
      expect(exitCode).toBe(0)
      const output = String(stdoutWriteSpy.mock.calls[0][0])
      expect(() => JSON.parse(output)).not.toThrow()
    })

    it('should format table with proper column alignment', async () => {
      process.argv = ['node', 'list-voices.js', '--provider', 'openai']
      const exitCode = await main()
      expect(exitCode).toBe(0)
      const output = stdoutWriteSpy.mock.calls.join('')
      expect(output).toContain('ID')
      expect(output).toContain('Name')
      expect(output).toContain('Language')
      expect(output).toContain('Gender')
      expect(output).toContain('Description')
    })
  })

  describe('voice preview', () => {
    it('should preview OpenAI voice', async () => {
      process.argv = ['node', 'list-voices.js', '--preview:openai/alloy']
      const exitCode = await main()
      expect(exitCode).toBe(0)
    })

    it('should preview ElevenLabs voice with API key', async () => {
      process.env.ELEVENLABS_API_KEY = 'test-key'
      process.argv = [
        'node',
        'list-voices.js',
        '--preview:elevenlabs/test-voice',
      ]
      const exitCode = await main()
      expect(exitCode).toBe(0)
    })

    it('should preview macOS voice', async () => {
      process.argv = ['node', 'list-voices.js', '--preview:macos/Alex']
      const exitCode = await main()
      expect(exitCode).toBe(0)
    })

    it('should show preview instructions when --preview flag is set', async () => {
      process.argv = ['node', 'list-voices.js', '--preview']
      const exitCode = await main()
      expect(exitCode).toBe(0)
    })
  })

  describe('macOS voice discovery', () => {
    it('should parse macOS voices correctly', async () => {
      const execFileMock = vi.fn().mockResolvedValue({
        stdout: `Alex              en_US    # Most people recognize me by my voice.
Samantha          en_US    # Hello, my name is Samantha.
Daniel            en_GB    # Hello, my name is Daniel.`,
      })

      // Mock the child_process module
      vi.doMock('node:child_process', () => ({
        execFile: execFileMock,
      }))

      // Mock the util module
      vi.doMock('node:util', () => ({
        promisify: vi.fn(() => execFileMock),
      }))

      // Mock platform to be darwin
      Object.defineProperty(process, 'platform', {
        value: 'darwin',
        configurable: true,
      })

      process.argv = ['node', 'list-voices.js', '--provider', 'macos']
      const exitCode = await main()
      expect(exitCode).toBe(0)
    })

    it('should handle macOS voice discovery errors gracefully', async () => {
      const execFileMock = vi
        .fn()
        .mockRejectedValue(new Error('Command not found'))

      // Mock the child_process module
      vi.doMock('node:child_process', () => ({
        execFile: execFileMock,
      }))

      // Mock the util module
      vi.doMock('node:util', () => ({
        promisify: vi.fn(() => execFileMock),
      }))

      Object.defineProperty(process, 'platform', {
        value: 'darwin',
        configurable: true,
      })

      process.argv = ['node', 'list-voices.js', '--provider', 'macos']
      const exitCode = await main()
      expect(exitCode).toBe(0)
    })

    it('should skip macOS voices on non-darwin platforms', async () => {
      Object.defineProperty(process, 'platform', {
        value: 'linux',
        configurable: true,
      })

      process.argv = ['node', 'list-voices.js', '--provider', 'macos']
      const exitCode = await main()
      expect(exitCode).toBe(0)
    })
  })

  describe('error handling', () => {
    it('should handle provider errors gracefully', async () => {
      const { OpenAIProvider } = await import(
        '../../speech/providers/openai-provider'
      )
      const mockProvider = OpenAIProvider as unknown as ReturnType<typeof vi.fn>
      mockProvider.mockImplementation(() => ({
        getVoices: vi.fn().mockRejectedValue(new Error('API Error')),
      }))

      process.argv = ['node', 'list-voices.js', '--provider', 'openai']
      const exitCode = await main()
      expect(exitCode).toBe(0) // Should still complete successfully
    })

    it('should handle preview errors gracefully', async () => {
      const { OpenAIProvider } = await import(
        '../../speech/providers/openai-provider'
      )
      const mockProvider2 = OpenAIProvider as unknown as ReturnType<
        typeof vi.fn
      >
      mockProvider2.mockImplementation(() => ({
        speak: vi
          .fn()
          .mockResolvedValue({ success: false, error: 'Preview failed' }),
      }))

      process.argv = ['node', 'list-voices.js', '--preview:openai/alloy']
      const exitCode = await main()
      expect(exitCode).toBe(0)
    })
  })
})

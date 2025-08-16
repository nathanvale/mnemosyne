import {
  afterEach,
  beforeEach,
  describe,
  expect,
  it,
  MockInstance,
  vi,
} from 'vitest'

import {
  createProgressIndicator,
  ProgressIndicator,
} from '../progress-indicator'

describe('ProgressIndicator', () => {
  let indicator: ProgressIndicator
  let stderrSpy: MockInstance

  beforeEach(() => {
    vi.clearAllMocks()
    vi.useFakeTimers()
    stderrSpy = vi.spyOn(process.stderr, 'write').mockImplementation(() => true)
    // Mock TTY for testing
    Object.defineProperty(process.stderr, 'isTTY', {
      value: true,
      writable: true,
      configurable: true,
    })
  })

  afterEach(() => {
    vi.useRealTimers()
    vi.restoreAllMocks()
  })

  describe('with TTY enabled', () => {
    beforeEach(() => {
      indicator = createProgressIndicator(true)
    })

    it('starts and stops a spinner', () => {
      indicator.startSpinner('Loading...')
      expect(stderrSpy).toHaveBeenCalledWith('⠋ Loading...')

      // Advance timer to see spinner animation
      vi.advanceTimersByTime(80)
      expect(stderrSpy).toHaveBeenCalledWith('\r⠙ Loading...')

      indicator.stopSpinner(true)
      expect(stderrSpy).toHaveBeenCalledWith(expect.stringContaining('✅ Done'))
    })

    it('logs different message types', () => {
      indicator.logSuccess('Success!')
      expect(stderrSpy).toHaveBeenCalledWith('✅ Success!\n')

      indicator.logError('Error!')
      expect(stderrSpy).toHaveBeenCalledWith('❌ Error!\n')

      indicator.logWarning('Warning!')
      expect(stderrSpy).toHaveBeenCalledWith('⚠️ Warning!\n')

      indicator.logInfo('Info!')
      expect(stderrSpy).toHaveBeenCalledWith('ℹ️ Info!\n')
    })

    it('executes operation with progress', async () => {
      const operation = vi.fn().mockResolvedValue('result')

      const result = await indicator.withProgress('Processing...', operation)

      expect(result).toBe('result')
      expect(operation).toHaveBeenCalled()
      expect(stderrSpy).toHaveBeenCalledWith('⠋ Processing...')
      expect(stderrSpy).toHaveBeenCalledWith(expect.stringContaining('✅ Done'))
    })

    it('handles operation failure', async () => {
      const error = new Error('Operation failed')
      const operation = vi.fn().mockRejectedValue(error)

      await expect(
        indicator.withProgress('Processing...', operation),
      ).rejects.toThrow('Operation failed')

      expect(stderrSpy).toHaveBeenCalledWith(expect.stringContaining('❌ Done'))
    })

    it('executes multiple operations with progress', async () => {
      const operations = [
        {
          message: 'Step 1',
          operation: vi.fn().mockResolvedValue('result1'),
        },
        {
          message: 'Step 2',
          operation: vi.fn().mockResolvedValue('result2'),
        },
      ]

      const results = await indicator.withMultiProgress(operations)

      expect(results).toEqual(['result1', 'result2'])
      expect(stderrSpy).toHaveBeenCalledWith('⠋ [1/2] Step 1')
      expect(stderrSpy).toHaveBeenCalledWith('⠋ [2/2] Step 2')
    })

    it('creates a progress bar', () => {
      const updateProgress = indicator.createProgressBar(100, 10)

      updateProgress(25)
      expect(stderrSpy).toHaveBeenCalledWith('\r[███░░░░░░░] 25% (25/100)')

      updateProgress(50)
      expect(stderrSpy).toHaveBeenCalledWith('\r[█████░░░░░] 50% (50/100)')

      updateProgress(100)
      expect(stderrSpy).toHaveBeenCalledWith('\r[██████████] 100% (100/100)')
      expect(stderrSpy).toHaveBeenCalledWith('\n')
    })

    it('logs section headers', () => {
      indicator.logSection('Test Section')
      expect(stderrSpy).toHaveBeenCalledWith(
        expect.stringContaining('📋 Test Section'),
      )
    })

    it('clears the current line', () => {
      indicator.clearLine()
      expect(stderrSpy).toHaveBeenCalledWith('\r\x1b[K')
    })
  })

  describe('without TTY', () => {
    beforeEach(() => {
      Object.defineProperty(process.stderr, 'isTTY', {
        value: false,
        writable: true,
        configurable: true,
      })
      indicator = createProgressIndicator(true)
    })

    it('falls back to simple logging when not TTY', () => {
      indicator.startSpinner('Loading...')
      expect(stderrSpy).toHaveBeenCalledWith('• Loading...\n')

      // No spinner animation should occur
      vi.advanceTimersByTime(80)
      expect(stderrSpy).not.toHaveBeenCalledWith(expect.stringContaining('\r'))
    })

    it('creates no-op progress bar when not TTY', () => {
      const updateProgress = indicator.createProgressBar(100)
      updateProgress(50)
      // Should not write anything
      expect(stderrSpy).not.toHaveBeenCalled()
    })
  })

  describe('disabled indicator', () => {
    beforeEach(() => {
      indicator = createProgressIndicator(false)
    })

    it('does not show progress when disabled', () => {
      indicator.startSpinner('Loading...')
      expect(stderrSpy).toHaveBeenCalledWith('• Loading...\n')

      // No animation
      vi.advanceTimersByTime(80)
      expect(stderrSpy).toHaveBeenCalledTimes(1)
    })
  })
})

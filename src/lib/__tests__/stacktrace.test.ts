import { describe, it, expect } from 'vitest'

import { getCallSite } from '@/lib/stacktrace'

describe('stacktrace', () => {
  it('extracts callsite information', () => {
    const callsite = getCallSite(1) // Skip 1 frame to get the test file location

    expect(callsite).toBeDefined()
    expect(callsite).toHaveProperty('file')
    expect(callsite).toHaveProperty('line')
    expect(callsite).toHaveProperty('column')

    if (callsite) {
      expect(callsite.file).toContain('stacktrace.test.ts')
      expect(callsite.line).toBeGreaterThan(0)
      expect(callsite.column).toBeGreaterThan(0)
    }
  })

  it('returns relative paths from project root', () => {
    const callsite = getCallSite(1)

    if (callsite) {
      expect(callsite.file).not.toContain('/Users/')
      expect(callsite.file.startsWith('/')).toBe(false)
    }
  })

  it('handles invalid skip frames gracefully', () => {
    const callsite = getCallSite(999) // Skip way too many frames

    // Should return null or empty callsite when no valid frame exists
    expect(callsite).toBeNull()
  })
})

import { describe, expect, it, beforeEach, afterEach } from 'vitest'

import { detectPlatform, Platform } from '../platform.js'

describe('Platform Detection', () => {
  const originalPlatform = process.platform

  beforeEach(() => {
    // Mock process.platform
    Object.defineProperty(process, 'platform', {
      value: originalPlatform,
      writable: true,
      configurable: true,
    })
  })

  afterEach(() => {
    // Restore original platform
    Object.defineProperty(process, 'platform', {
      value: originalPlatform,
      writable: false,
      configurable: true,
    })
  })

  describe('detectPlatform', () => {
    it('should detect macOS', () => {
      Object.defineProperty(process, 'platform', { value: 'darwin' })
      expect(detectPlatform()).toBe(Platform.macOS)
    })

    it('should detect Windows', () => {
      Object.defineProperty(process, 'platform', { value: 'win32' })
      expect(detectPlatform()).toBe(Platform.Windows)
    })

    it('should detect Linux', () => {
      Object.defineProperty(process, 'platform', { value: 'linux' })
      expect(detectPlatform()).toBe(Platform.Linux)
    })

    it('should detect FreeBSD as Linux', () => {
      Object.defineProperty(process, 'platform', { value: 'freebsd' })
      expect(detectPlatform()).toBe(Platform.Linux)
    })

    it('should detect OpenBSD as Linux', () => {
      Object.defineProperty(process, 'platform', { value: 'openbsd' })
      expect(detectPlatform()).toBe(Platform.Linux)
    })

    it('should detect SunOS as Linux', () => {
      Object.defineProperty(process, 'platform', { value: 'sunos' })
      expect(detectPlatform()).toBe(Platform.Linux)
    })

    it('should detect AIX as unsupported', () => {
      Object.defineProperty(process, 'platform', { value: 'aix' })
      expect(detectPlatform()).toBe(Platform.Unsupported)
    })

    it('should detect unknown platforms as unsupported', () => {
      Object.defineProperty(process, 'platform', { value: 'unknown' })
      expect(detectPlatform()).toBe(Platform.Unsupported)
    })
  })

  describe('Platform enum', () => {
    it('should have correct platform values', () => {
      expect(Platform.macOS).toBe('darwin')
      expect(Platform.Windows).toBe('win32')
      expect(Platform.Linux).toBe('linux')
      expect(Platform.Unsupported).toBe('unsupported')
    })
  })
})

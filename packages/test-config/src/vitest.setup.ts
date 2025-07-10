import * as matchers from '@testing-library/jest-dom/matchers'
import { cleanup } from '@testing-library/react'
import { afterEach, expect } from 'vitest'

// Extend Vitest's expect with jest-dom matchers
expect.extend(matchers)

// Clean up DOM after each test
afterEach(() => {
  cleanup()
})

// Note: MSW setup removed to avoid Node.js import issues
// Tests that need MSW should import and setup handlers individually

import { server } from '@studio/mocks'
import * as matchers from '@testing-library/jest-dom/matchers'
import { cleanup } from '@testing-library/react'
import { beforeAll, afterEach, afterAll, expect } from 'vitest'

// Extend Vitest's expect with jest-dom matchers
expect.extend(matchers)

// Clean up DOM after each test
afterEach(() => {
  cleanup()
  server.resetHandlers()
})

// Start MSW before all tests
beforeAll(() => {
  server.listen({ onUnhandledRequest: 'error' })
})

// Stop MSW after all tests
afterAll(() => {
  server.close()
})

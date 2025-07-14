/**
 * # Logger API Migration Guide
 *
 * This guide helps you migrate from the old logger API to the new unified API.
 *
 * ## Breaking Changes Summary
 *
 * 1. **Unified API Signature**: `log.info(message, context?)` replaces `log.info(msg, ...args)`
 * 2. **Environment Parity**: `withTag()` and `withContext()` now work in Node.js
 * 3. **Unified Factory**: Single `createLogger()` works everywhere
 * 4. **Testing Utilities**: New `createMockLogger()` for easier testing
 *
 * ## Migration Steps
 *
 * ### 1. Update Log Calls
 *
 * **Before (Old API):**
 * ```typescript
 * log.info('User action', { userId: '123' }, 'additional', 'data')
 * log.error('Failed to process', error)
 * ```
 *
 * **After (New API):**
 * ```typescript
 * log.info('User action', { userId: '123', additional: 'data' })
 * log.error('Failed to process', { error })
 * ```
 *
 * ### 2. Update Logger Creation
 *
 * **Before (Environment-specific):**
 * ```typescript
 * // Node.js
 * import { createCliLogger } from '@studio/logger'
 * const logger = createCliLogger('info')
 *
 * // Browser
 * import { createLogger } from '@studio/logger'
 * const logger = createLogger({ level: 'info' })
 * ```
 *
 * **After (Unified):**
 * ```typescript
 * // Works everywhere
 * import { createLogger } from '@studio/logger'
 * const logger = createLogger({
 *   level: 'info',
 *   prettyPrint: true // For CLI/development
 * })
 * ```
 *
 * ### 3. Use Context and Tags (Now works in Node.js too!)
 *
 * **Before (Browser only):**
 * ```typescript
 * const userLogger = browserLogger.withTag('UserService').withContext({ userId: '123' })
 * ```
 *
 * **After (Works everywhere):**
 * ```typescript
 * const userLogger = logger.withTag('UserService').withContext({ userId: '123' })
 * userLogger.info('User logged in', { method: 'oauth' })
 * ```
 *
 * ### 4. Update Tests
 *
 * **Before (Manual mocking):**
 * ```typescript
 * vi.mock('@studio/logger', () => ({
 *   log: {
 *     info: vi.fn(),
 *     error: vi.fn(),
 *     // ... repeat for all methods
 *   }
 * }))
 * ```
 *
 * **After (Built-in utilities):**
 * ```typescript
 * import { createMockLogger } from '@studio/logger/testing'
 *
 * const mockLogger = createMockLogger()
 * expect(mockLogger.info).toHaveBeenCalledWith('Expected message', { userId: '123' })
 * ```
 *
 * ## Browser-Specific Features
 *
 * For browser-specific features like remote logging, performance marks, and console grouping,
 * use `createBrowserLogger` instead of the unified `createLogger`:
 *
 * ```typescript
 * import { createBrowserLogger } from '@studio/logger'
 *
 * const logger = createBrowserLogger({
 *   level: 'info',
 *   remoteEndpoint: 'https://api.example.com/logs',
 *   enablePerformance: true
 * })
 *
 * logger.group('API Calls')
 * logger.mark('api-start')
 * // ... API call
 * logger.measure('api-duration', 'api-start')
 * logger.groupEnd()
 * ```
 *
 * ## Deprecation Warnings
 *
 * - `createCliLogger()` is deprecated. Use `createLogger({ prettyPrint: true })` instead.
 * - The old multi-argument signature still works but is deprecated.
 *
 * ## Environment Detection
 *
 * The unified `createLogger` automatically detects the environment:
 * - **Node.js**: Returns `NodeLogger` with Pino backend
 * - **Browser**: Returns `BrowserLogger` with console backend and remote features
 *
 * ## TypeScript Benefits
 *
 * The new API provides better TypeScript experience:
 * - Clearer method signatures
 * - Better IntelliSense
 * - Proper type inference for context objects
 * - Consistent interfaces across environments
 */

// This file is for documentation purposes only
export {}

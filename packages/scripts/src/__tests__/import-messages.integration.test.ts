import { createTestDatabase, type TestDatabase } from '@studio/test-config'
import { PassThrough } from 'stream'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

// Mock the logger module with a shared mock logger instance
const mockCliLogger = vi.hoisted(() => ({
  info: vi.fn(),
  error: vi.fn(),
  warn: vi.fn(),
  debug: vi.fn(),
  trace: vi.fn(),
  fatal: vi.fn(),
}))

vi.mock('@studio/logger', () => ({
  log: {
    info: vi.fn(),
    error: vi.fn(),
    warn: vi.fn(),
    debug: vi.fn(),
    trace: vi.fn(),
    fatal: vi.fn(),
  },
  createLogger: vi.fn(() => mockCliLogger),
  cli: vi.fn(() => mockCliLogger),
  debug: vi.fn(() => mockCliLogger),
  createMemoryLogger: vi.fn(() => ({
    logMemoryEvent: vi.fn(),
    logBatchProcessing: vi.fn(),
    logValidationResult: vi.fn(),
  })),
  createSchemaLogger: vi.fn(() => ({
    logMemoryValidation: vi.fn(),
    logBatchValidation: vi.fn(),
    logPerformanceMetrics: vi.fn(),
  })),
  withPerformanceLogging: vi.fn(async (logger, operation, fn) => {
    return await fn()
  }),
}))

// Prepare controllable stream and mock fs
let mockReadStream: PassThrough
vi.mock('fs', async () => {
  const actual = await vi.importActual<typeof import('fs')>('fs')
  const mockCreateReadStream = vi.fn(
    () => mockReadStream as unknown as import('fs').ReadStream,
  )

  return {
    ...actual,
    default: {
      ...actual,
      createReadStream: mockCreateReadStream,
    },
    createReadStream: mockCreateReadStream,
  }
})

import { createHash } from 'crypto'

// Instead of mocking the entire module, we'll modify the import to use our test database
let testDatabase: TestDatabase

// Create a test-friendly version of the main function
async function runImportWithTestDatabase() {
  const { main } = await import('../import-messages')
  return await main(testDatabase.client)
}

describe('CSV Import Script Integration Tests', () => {
  // Helper to compute expected hash for duplicate tests
  const getExpectedHash = (
    timestamp: string,
    sender: string,
    message: string,
    senderId = '',
    assets = '',
  ) => {
    // Match the createContentHash function from import-messages.ts
    const content = [
      timestamp,
      sender || '',
      senderId || '',
      message || '',
      assets || '',
    ].join('|')

    return createHash('sha256').update(content).digest('hex')
  }

  beforeEach(async () => {
    // Reset all mocks before each test
    vi.clearAllMocks()
    mockReadStream = new PassThrough()

    // Create fresh test database for each test
    testDatabase = await createTestDatabase({ mode: 'memory' })

    vi.spyOn(process, 'exit').mockImplementation(() => {
      throw new Error('process.exit called')
    })
  })

  afterEach(async () => {
    if (testDatabase) {
      await testDatabase.cleanup()
    }
    vi.restoreAllMocks()
  })

  it('should import new messages from the CSV', async () => {
    process.argv = [
      'tsx',
      'scripts/import-messages.ts',
      '--in',
      'test-messages.csv',
    ]
    const mainPromise = runImportWithTestDatabase()

    mockReadStream.write(
      `Chat Session,Message Date,Delivered Date,Read Date,Edited Date,Service,Type,Sender ID,Sender Name,Status,Replying to,Subject,Text,Attachment,Attachment type
Melanie,2025-07-01T10:00:00.000Z,,,,iMessage,Incoming,+123,Melanie,Read,,,Hello World!,,
Nathan,2025-07-01T10:05:00.000Z,,,,iMessage,Outgoing,+456,Nathan,Read,,,Another message,image.jpg,
Melanie,2025-07-01T10:10:00.000Z,,,,iMessage,Incoming,+123,Melanie,Read,,,A third message,asset1.zip,
`,
    )
    mockReadStream.end()

    await mainPromise

    // Verify data was actually created in the database
    const messages = await testDatabase.client.message.findMany({
      include: { links: true, assets: true },
      orderBy: { timestamp: 'asc' },
    })

    expect(messages).toHaveLength(3)

    // Verify first message
    expect(messages[0]).toMatchObject({
      sender: 'Melanie',
      senderId: '+123',
      message: 'Hello World!',
      timestamp: new Date('2025-07-01T10:00:00.000Z'),
    })
    expect(messages[0].links).toHaveLength(0)
    expect(messages[0].assets).toHaveLength(0)

    // Verify second message with asset
    expect(messages[1]).toMatchObject({
      sender: 'Nathan',
      senderId: '+456',
      message: 'Another message',
      timestamp: new Date('2025-07-01T10:05:00.000Z'),
    })
    expect(messages[1].links).toHaveLength(0)
    expect(messages[1].assets).toHaveLength(1)
    expect(messages[1].assets[0].filename).toBe('image.jpg')

    // Verify third message with asset
    expect(messages[2]).toMatchObject({
      sender: 'Melanie',
      senderId: '+123',
      message: 'A third message',
      timestamp: new Date('2025-07-01T10:10:00.000Z'),
    })
    expect(messages[2].links).toHaveLength(0)
    expect(messages[2].assets).toHaveLength(1)
    expect(messages[2].assets[0].filename).toBe('asset1.zip')
  })

  it('should log parsed message (preview) with correct data', async () => {
    process.argv = [
      'tsx',
      'scripts/import-messages.ts',
      '--in',
      'preview.csv',
      '--preview',
    ]

    // Start the script
    const mainPromise = runImportWithTestDatabase()

    // Write a single CSV row and end the stream
    mockReadStream.write(
      `Chat Session,Message Date,Delivered Date,Read Date,Edited Date,Service,Type,Sender ID,Sender Name,Status,Replying to,Subject,Text,Attachment,Attachment type
Alice,2025-08-01T12:00:00.000Z,,,,iMessage,Incoming,+123,Alice,Read,,,Hi there,file1.png,
`,
    )
    mockReadStream.end()

    // Act
    await mainPromise

    // Assert: log.info called with the preview label and an object matching the row
    expect(mockCliLogger.info).toHaveBeenCalledWith(
      'Parsed message (preview):',
      expect.objectContaining({
        timestamp: '2025-08-01T12:00:00.000Z',
        sender: 'Alice',
        senderId: '+123',
        message: 'Hi there',
        hash: expect.any(String),
        direction: 'incoming',
        links: [],
        assets: [{ filename: 'file1.png' }],
      }),
    )

    // Verify no data was created in database (preview mode)
    const messageCount = await testDatabase.client.message.count()
    expect(messageCount).toBe(0)
  })

  it('should skip existing messages based on content hash', async () => {
    // First, create a message in the database
    const existingHash = getExpectedHash(
      '2025-07-01T10:00:00.000Z',
      'Melanie',
      'Hello World!',
      '+123',
      '',
    )

    await testDatabase.client.message.create({
      data: {
        timestamp: new Date('2025-07-01T10:00:00.000Z'),
        sender: 'Melanie',
        senderId: '+123',
        message: 'Hello World!',
        hash: existingHash,
      },
    })

    process.argv = [
      'tsx',
      'scripts/import-messages.ts',
      '--in',
      'test-messages.csv',
      '--preview',
    ]
    const mainPromise = runImportWithTestDatabase()

    mockReadStream.write(
      `Chat Session,Message Date,Delivered Date,Read Date,Edited Date,Service,Type,Sender ID,Sender Name,Status,Replying to,Subject,Text,Attachment,Attachment type
Melanie,2025-07-01T10:00:00.000Z,,,,iMessage,Incoming,+123,Melanie,Read,,,Hello World!,,
`,
    )
    mockReadStream.end()

    await mainPromise

    // Verify still only one message in database
    const messageCount = await testDatabase.client.message.count()
    expect(messageCount).toBe(1)

    // Check that the summary shows duplicates were skipped
    expect(mockCliLogger.info).toHaveBeenCalledWith(
      expect.stringContaining(
        '1 duplicate were skipped (this is normal for data with repeated content)',
      ),
    )
  })

  it('should extract and store URLs from message text', async () => {
    process.argv = [
      'tsx',
      'scripts/import-messages.ts',
      '--in',
      'test-messages.csv',
    ]
    const mainPromise = runImportWithTestDatabase()

    // Write a CSV row with URLs in the text
    mockReadStream.write(
      `Chat Session,Message Date,Delivered Date,Read Date,Edited Date,Service,Type,Sender ID,Sender Name,Status,Replying to,Subject,Text,Attachment,Attachment type
Alice,2025-08-01T12:00:00.000Z,,,,iMessage,Incoming,+123,Alice,Read,,,Check out https://example.com and www.google.com for more info,,
`,
    )
    mockReadStream.end()

    // Act
    await mainPromise

    // Assert: verify message was created with extracted links
    const message = await testDatabase.client.message.findFirst({
      include: { links: true, assets: true },
    })

    expect(message).toBeDefined()
    expect(message?.message).toBe(
      'Check out https://example.com and www.google.com for more info',
    )
    expect(message?.links).toHaveLength(2)
    expect(message?.links.map((link) => link.url)).toEqual([
      'https://example.com',
      'https://www.google.com',
    ])
    expect(message?.assets).toHaveLength(0)
  })

  it('should fail if input file is not provided', async () => {
    process.argv = ['tsx', 'scripts/import-messages.ts']
    await expect(runImportWithTestDatabase()).rejects.toThrow(
      'process.exit called',
    )
    expect(mockCliLogger.error).toHaveBeenCalledWith(
      "error: required option '--in <path>' not specified",
    )
  })
})

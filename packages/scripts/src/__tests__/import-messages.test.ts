import * as PrismaClientModule from '@studio/db'
import * as fastCsv from 'fast-csv'
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
  createCliLogger: vi.fn(() => mockCliLogger),
}))

// Define the shape of our mocked PrismaClient instance
type MockPrisma = {
  message: {
    findUnique: ReturnType<typeof vi.fn>
    create: ReturnType<typeof vi.fn>
  }
  $disconnect: ReturnType<typeof vi.fn>
}

// Prepare controllable stream and mock fs
let mockReadStream: PassThrough
vi.mock('fs', () => ({
  default: {
    createReadStream: vi.fn(
      () => mockReadStream as unknown as import('fs').ReadStream,
    ),
  },
  createReadStream: vi.fn(
    () => mockReadStream as unknown as import('fs').ReadStream,
  ),
}))

// Mock PrismaClient with a singleton instance so we can control it in tests
vi.mock('@studio/db', () => {
  const mockPrismaInstance = {
    message: {
      findUnique: vi.fn(),
      create: vi.fn(),
    },
    $disconnect: vi.fn(),
  }
  return {
    __esModule: true,
    PrismaClient: vi.fn(() => mockPrismaInstance),
    mockPrismaInstance,
  }
})

import { createHash } from 'crypto'

import { main } from '../import-messages'

describe('CSV Import Script', () => {
  let mockPrismaInstance: MockPrisma

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

  beforeEach(() => {
    // Reset all mocks before each test
    vi.clearAllMocks()
    mockReadStream = new PassThrough()
    // Cast to unknown->{ mockPrismaInstance: MockPrisma } to access the mockPrismaInstance added by Vitest
    const { mockPrismaInstance: instance } = vi.mocked(
      PrismaClientModule,
    ) as unknown as { mockPrismaInstance: MockPrisma }
    mockPrismaInstance = instance
    vi.clearAllMocks()
    vi.spyOn(process, 'exit').mockImplementation(() => {
      throw new Error('process.exit called')
    })
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('should import new messages from the CSV', async () => {
    mockPrismaInstance.message.findUnique.mockResolvedValue(null)

    process.argv = [
      'tsx',
      'scripts/import-messages.ts',
      '--in',
      'test-messages.csv',
    ]
    const mainPromise = main()

    mockReadStream.write(
      `Chat Session,Message Date,Delivered Date,Read Date,Edited Date,Service,Type,Sender ID,Sender Name,Status,Replying to,Subject,Text,Attachment,Attachment type
Melanie,2025-07-01T10:00:00.000Z,,,,iMessage,Incoming,+123,Melanie,Read,,,Hello World!,,
Nathan,2025-07-01T10:05:00.000Z,,,,iMessage,Outgoing,+456,Nathan,Read,,,Another message,image.jpg,
Melanie,2025-07-01T10:10:00.000Z,,,,iMessage,Incoming,+123,Melanie,Read,,,A third message,asset1.zip,
`,
    )
    mockReadStream.end()

    await mainPromise

    expect(mockPrismaInstance.message.create).toHaveBeenCalledTimes(3)
    expect(mockPrismaInstance.message.create).toHaveBeenNthCalledWith(
      1,
      expect.objectContaining({
        data: expect.objectContaining({
          sender: 'Melanie',
          senderId: '+123',
          message: 'Hello World!',
          links: { create: [] },
          assets: { create: [] },
        }),
      }),
    )
    expect(mockPrismaInstance.message.create).toHaveBeenNthCalledWith(
      2,
      expect.objectContaining({
        data: expect.objectContaining({
          sender: 'Nathan',
          senderId: '+456',
          message: 'Another message',
          links: { create: [] },
          assets: { create: [{ filename: 'image.jpg' }] },
        }),
      }),
    )
    expect(mockPrismaInstance.message.create).toHaveBeenNthCalledWith(
      3,
      expect.objectContaining({
        data: expect.objectContaining({
          sender: 'Melanie',
          senderId: '+123',
          message: 'A third message',
          links: { create: [] },
          assets: { create: [{ filename: 'asset1.zip' }] },
        }),
      }),
    )
  })

  it('should log parsed message (preview) with correct data', async () => {
    // Arrange: findUnique returns null so importMessage will go into preview branch
    mockPrismaInstance.message.findUnique.mockResolvedValue(null)
    process.argv = [
      'tsx',
      'scripts/import-messages.ts',
      '--in',
      'preview.csv',
      '--preview',
    ]

    // Start the script
    const mainPromise = main()

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
  })

  it('should skip existing messages', async () => {
    mockPrismaInstance.message.findUnique.mockResolvedValue({ id: 1 })

    process.argv = [
      'tsx',
      'scripts/import-messages.ts',
      '--in',
      'test-messages.csv',
      '--preview',
    ]
    const mainPromise = main()

    mockReadStream.write(
      `Chat Session,Message Date,Delivered Date,Read Date,Edited Date,Service,Type,Sender ID,Sender Name,Status,Replying to,Subject,Text,Attachment,Attachment type
Melanie,2025-07-01T10:00:00.000Z,,,,iMessage,Incoming,+123,Melanie,Read,,,Hello World!,,
`,
    )
    mockReadStream.end()

    await mainPromise

    expect(mockPrismaInstance.message.create).not.toHaveBeenCalled()
    // Check that the summary shows duplicates were skipped
    expect(mockCliLogger.info).toHaveBeenCalledWith(
      expect.stringContaining(
        '1 duplicate were skipped (this is normal for data with repeated content)',
      ),
    )
  })

  it('should handle malformed rows gracefully', async () => {
    mockPrismaInstance.message.findUnique.mockResolvedValue(null)
    process.argv = [
      'tsx',
      'scripts/import-messages.ts',
      '--in',
      'test-messages.csv',
    ]
    const mainPromise = main()

    mockReadStream.write(
      `Chat Session,Message Date,Delivered Date,Read Date,Edited Date,Service,Type,Sender ID,Sender Name,Status,Replying to,Subject,Text,Attachment,Attachment type
Melanie,2025-07-01T10:00:00.000Z,,,,iMessage,Incoming,+123,Melanie,Read,,,Valid message,,
invalid-row
Nathan,2025-07-01T10:05:00.000Z,,,,iMessage,Outgoing,+456,Nathan,Read,,,Another valid message,,
`,
    )
    mockReadStream.end()

    await mainPromise

    expect(mockPrismaInstance.message.create).toHaveBeenCalledTimes(2)
    expect(mockCliLogger.error).toHaveBeenCalledWith(
      expect.stringContaining('Import completed with'),
    )
  })

  it('should fail if input file is not provided', async () => {
    process.argv = ['tsx', 'scripts/import-messages.ts']
    await expect(main()).rejects.toThrow('process.exit called')
    expect(mockCliLogger.error).toHaveBeenCalledWith(
      "error: required option '--in <path>' not specified",
    )
  })

  // Duplicate message handling tests
  describe('duplicate message handling', () => {
    // Helper to write CSV data to the mock stream
    function writeCsv(rows: string) {
      mockReadStream.write(
        `Chat Session,Message Date,Delivered Date,Read Date,Edited Date,Service,Type,Sender ID,Sender Name,Status,Replying to,Subject,Text,Attachment,Attachment type
${rows}
`,
      )
      mockReadStream.end()
    }

    it('should compute correct hash for duplicate detection', async () => {
      const expectedHash = getExpectedHash(
        '2025-07-01T10:00:00.000Z',
        'Melanie',
        'Hello',
        '+123',
        '', // assets
      )
      mockPrismaInstance.message.findUnique.mockResolvedValueOnce({ id: 1 })
      process.argv = [
        'tsx',
        'scripts/import-messages.ts',
        '--in',
        'dupes.csv',
        '--preview',
      ]
      const mainPromise = main()
      writeCsv(
        `Melanie,2025-07-01T10:00:00.000Z,,,,iMessage,Incoming,+123,Melanie,Read,,,Hello,,`,
      )
      await mainPromise
      expect(mockPrismaInstance.message.findUnique).toHaveBeenCalledWith({
        where: { hash: expectedHash },
      })
    })

    it('imports only new messages when CSV contains duplicates', async () => {
      process.argv = ['tsx', 'scripts/import-messages.ts', '--in', 'mixed.csv']

      const rows = `Melanie,2025-07-01T10:00:00.000Z,,,,iMessage,Incoming,+123,Melanie,Read,,,Hello,,
Nathan,2025-07-01T10:05:00.000Z,,,,iMessage,Outgoing,+456,Nathan,Read,,,Brand new,,
Melanie,2025-07-01T10:00:00.000Z,,,,iMessage,Incoming,+123,Melanie,Read,,,Hello,,`
      mockPrismaInstance.message.findUnique
        .mockResolvedValueOnce({ id: 42 })
        .mockResolvedValueOnce(null)
        .mockResolvedValueOnce({ id: 43 })

      const mainPromise = main()
      writeCsv(rows)
      await mainPromise

      expect(mockPrismaInstance.message.create).toHaveBeenCalledTimes(1)
      expect(mockPrismaInstance.message.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            sender: 'Nathan',
            senderId: '+456',
            message: 'Brand new',
          }),
        }),
      )

      // Check that the summary shows duplicates were skipped
      expect(mockCliLogger.info).toHaveBeenCalledWith(
        expect.stringContaining(
          '2 duplicates were skipped (this is normal for data with repeated content)',
        ),
      )
    })
  })

  it('fails and logs on CSV parse error', async () => {
    // Arrange
    const csvError = new Error('broken CSV')
    process.argv = ['tsx', 'scripts/import-messages.ts', '--in', 'test.csv']

    // Start main(), then trigger stream error
    const mainPromise = main()
    mockReadStream.emit('error', csvError)

    // Assert
    await expect(mainPromise).rejects.toBe(csvError)
    expect(mockCliLogger.error).toHaveBeenCalledWith(
      'File read error',
      expect.objectContaining({
        error: 'broken CSV',
        inputFile: 'test.csv',
      }),
    )
  })

  it('fails and logs on file read error', async () => {
    const readError = new Error('read failure')
    process.argv = ['tsx', 'scripts/import-messages.ts', '--in', 'test.csv']

    // Start main(), then trigger the read-stream error
    const mainPromise = main()
    mockReadStream.emit('error', readError)

    // Should reject and log via the readStream.on('error') handler
    await expect(mainPromise).rejects.toBe(readError)
    expect(mockCliLogger.error).toHaveBeenCalledWith(
      'File read error',
      expect.objectContaining({
        error: 'read failure',
        inputFile: 'test.csv',
      }),
    )
  })

  it('fails and logs on parser error from fast-csv', async () => {
    const csvError = new Error('parser failed')
    // Make parse() return a controllable stream
    const mockParser = new PassThrough()
    vi.spyOn(fastCsv, 'parse').mockReturnValue(
      mockParser as unknown as ReturnType<typeof fastCsv.parse>,
    )

    process.argv = ['tsx', 'scripts/import-messages.ts', '--in', 'test.csv']
    const mainPromise = main()

    // Trigger the parse-stage error
    mockParser.emit('error', csvError)

    await expect(mainPromise).rejects.toBe(csvError)
    expect(mockCliLogger.error).toHaveBeenCalledWith(
      'CSV parsing error',
      expect.objectContaining({
        error: 'parser failed',
        inputFile: 'test.csv',
      }),
    )
  })

  // URL extraction tests
  describe('URL extraction from message text', () => {
    it('should extract and store URLs from message text', async () => {
      // Arrange: findUnique returns null so importMessage will create new message
      mockPrismaInstance.message.findUnique.mockResolvedValue(null)
      mockPrismaInstance.message.create.mockResolvedValue({
        id: 1,
        timestamp: new Date('2025-08-01T12:00:00.000Z'),
        sender: 'Alice',
        senderId: '+123',
        message: 'Check out https://example.com and www.google.com',
        hash: 'test-hash',
        direction: 'incoming',
      })

      process.argv = [
        'tsx',
        'scripts/import-messages.ts',
        '--in',
        'test-messages.csv',
      ]
      const mainPromise = main()

      // Write a CSV row with URLs in the text
      mockReadStream.write(
        `Chat Session,Message Date,Delivered Date,Read Date,Edited Date,Service,Type,Sender ID,Sender Name,Status,Replying to,Subject,Text,Attachment,Attachment type
Alice,2025-08-01T12:00:00.000Z,,,,iMessage,Incoming,+123,Alice,Read,,,Check out https://example.com and www.google.com for more info,,
`,
      )
      mockReadStream.end()

      // Act
      await mainPromise

      // Assert: message should be created with extracted links
      expect(mockPrismaInstance.message.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          timestamp: new Date('2025-08-01T12:00:00.000Z'),
          sender: 'Alice',
          senderId: '+123',
          message:
            'Check out https://example.com and www.google.com for more info',
          hash: expect.any(String),
          links: {
            create: [
              { url: 'https://example.com' },
              { url: 'https://www.google.com' },
            ],
          },
          assets: {
            create: [],
          },
        }),
      })
    })

    it('should deduplicate URLs within the same message', async () => {
      // Arrange
      mockPrismaInstance.message.findUnique.mockResolvedValue(null)
      mockPrismaInstance.message.create.mockResolvedValue({
        id: 1,
        timestamp: new Date('2025-08-01T12:00:00.000Z'),
        sender: 'Alice',
        senderId: '+123',
        message: 'duplicate urls test',
        hash: 'test-hash',
        direction: 'incoming',
      })

      process.argv = [
        'tsx',
        'scripts/import-messages.ts',
        '--in',
        'test-messages.csv',
      ]
      const mainPromise = main()

      // Write a CSV row with duplicate URLs
      mockReadStream.write(
        `Chat Session,Message Date,Delivered Date,Read Date,Edited Date,Service,Type,Sender ID,Sender Name,Status,Replying to,Subject,Text,Attachment,Attachment type
Alice,2025-08-01T12:00:00.000Z,,,,iMessage,Incoming,+123,Alice,Read,,,Visit https://example.com and https://EXAMPLE.COM again,,
`,
      )
      mockReadStream.end()

      // Act
      await mainPromise

      // Assert: should only create one link due to deduplication
      expect(mockPrismaInstance.message.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          timestamp: new Date('2025-08-01T12:00:00.000Z'),
          sender: 'Alice',
          senderId: '+123',
          message: 'Visit https://example.com and https://EXAMPLE.COM again',
          hash: expect.any(String),
          links: {
            create: [{ url: 'https://example.com' }],
          },
          assets: {
            create: [],
          },
        }),
      })
    })

    it('should handle messages with no URLs', async () => {
      // Arrange
      mockPrismaInstance.message.findUnique.mockResolvedValue(null)
      mockPrismaInstance.message.create.mockResolvedValue({
        id: 1,
        timestamp: new Date('2025-08-01T12:00:00.000Z'),
        sender: 'Alice',
        senderId: '+123',
        message: 'Hello world!',
        hash: 'test-hash',
        direction: 'incoming',
      })

      process.argv = [
        'tsx',
        'scripts/import-messages.ts',
        '--in',
        'test-messages.csv',
      ]
      const mainPromise = main()

      // Write a CSV row with no URLs
      mockReadStream.write(
        `Chat Session,Message Date,Delivered Date,Read Date,Edited Date,Service,Type,Sender ID,Sender Name,Status,Replying to,Subject,Text,Attachment,Attachment type
Alice,2025-08-01T12:00:00.000Z,,,,iMessage,Incoming,+123,Alice,Read,,,Hello world!,,
`,
      )
      mockReadStream.end()

      // Act
      await mainPromise

      // Assert: should create message with empty links array
      expect(mockPrismaInstance.message.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          timestamp: new Date('2025-08-01T12:00:00.000Z'),
          sender: 'Alice',
          senderId: '+123',
          message: 'Hello world!',
          hash: expect.any(String),
          links: {
            create: [],
          },
          assets: {
            create: [],
          },
        }),
      })
    })

    it('should extract and store three different URLs from message text', async () => {
      // Arrange: findUnique returns null so importMessage will create new message
      mockPrismaInstance.message.findUnique.mockResolvedValue(null)
      mockPrismaInstance.message.create.mockResolvedValue({
        id: 1,
        timestamp: new Date('2025-08-01T14:00:00.000Z'),
        sender: 'Bob',
        senderId: '+789',
        message:
          'Check out these three sites: https://github.com, www.stackoverflow.com, and https://docs.google.com',
        hash: 'test-hash-three-urls',
        direction: 'outgoing',
      })

      process.argv = [
        'tsx',
        'scripts/import-messages.ts',
        '--in',
        'test-messages.csv',
      ]
      const mainPromise = main()

      // Write a CSV row with three different URLs in the text
      mockReadStream.write(
        `Chat Session,Message Date,Delivered Date,Read Date,Edited Date,Service,Type,Sender ID,Sender Name,Status,Replying to,Subject,Text,Attachment,Attachment type
Bob,2025-08-01T14:00:00.000Z,,,,iMessage,Outgoing,+789,Bob,Read,,,Check out these three sites: https://github.com www.stackoverflow.com and https://docs.google.com for development help,,
`,
      )
      mockReadStream.end()

      // Act
      await mainPromise

      // Assert: message should be created with all three extracted links
      expect(mockPrismaInstance.message.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          timestamp: new Date('2025-08-01T14:00:00.000Z'),
          sender: 'Bob',
          senderId: '+789',
          message:
            'Check out these three sites: https://github.com www.stackoverflow.com and https://docs.google.com for development help',
          hash: expect.any(String),
          links: {
            create: [
              { url: 'https://github.com' },
              { url: 'https://www.stackoverflow.com' },
              { url: 'https://docs.google.com' },
            ],
          },
          assets: {
            create: [],
          },
        }),
      })
    })
  })
})

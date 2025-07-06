import * as PrismaClientModule from '@prisma/client'
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

vi.mock('@/lib/logger', () => ({
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
vi.mock('@prisma/client', () => {
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
  ) =>
    createHash('sha256')
      .update(timestamp + sender + message)
      .digest('hex')

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

    // Assert: log.info called with the preview string format
    expect(mockCliLogger.info).toHaveBeenCalledWith(
      'Parsed message (preview): 2025-08-01T12:00:00.000Z | Alice | Hi there | incoming | assets: 1',
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
    expect(mockCliLogger.info).toHaveBeenCalledWith(
      'Skipping existing message with hash:',
      expect.any(String),
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
      'Skipping malformed row:',
      expect.any(Error),
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
            message: 'Brand new',
          }),
        }),
      )

      expect(mockCliLogger.info).toHaveBeenCalledWith(
        expect.stringContaining('Skipping existing message'),
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
      'CSV parsing error:',
      csvError,
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
      'CSV parsing error:',
      readError,
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
      'CSV parsing error:',
      csvError,
    )
  })

  it('should import media-only messages (empty text with attachments)', async () => {
    mockPrismaInstance.message.findUnique.mockResolvedValue(null)

    process.argv = [
      'tsx',
      'scripts/import-messages.ts',
      '--in',
      'media-messages.csv',
    ]
    const mainPromise = main()

    mockReadStream.write(
      `Chat Session,Message Date,Delivered Date,Read Date,Edited Date,Service,Type,Sender ID,Sender Name,Status,Replying to,Subject,Text,Attachment,Attachment type
Melanie,2025-07-01T11:00:00.000Z,,,,iMessage,Incoming,+123,Melanie,Read,,,,"photo.jpg","image"
Nathan,2025-07-01T11:05:00.000Z,,,,iMessage,Outgoing,+456,Nathan,Read,,,,"voice-message.m4a","audio"
`,
    )
    mockReadStream.end()

    await mainPromise

    expect(mockPrismaInstance.message.create).toHaveBeenCalledTimes(2)
    expect(mockPrismaInstance.message.create).toHaveBeenNthCalledWith(
      1,
      expect.objectContaining({
        data: expect.objectContaining({
          sender: 'Melanie',
          message: '', // Empty message for media-only
          links: { create: [] },
          assets: { create: [{ filename: 'photo.jpg' }] },
        }),
      }),
    )
    expect(mockPrismaInstance.message.create).toHaveBeenNthCalledWith(
      2,
      expect.objectContaining({
        data: expect.objectContaining({
          sender: 'Nathan',
          message: '', // Empty message for media-only
          links: { create: [] },
          assets: { create: [{ filename: 'voice-message.m4a' }] },
        }),
      }),
    )
  })
})

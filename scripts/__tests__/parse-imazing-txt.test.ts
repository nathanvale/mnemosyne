import * as csv from 'fast-csv'
import fs from 'fs'
import mock from 'mock-fs'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

// Mock the script's dependencies
const mockCsvStream = {
  write: vi.fn(),
  end: vi.fn(),
  pipe: vi.fn().mockReturnThis(),
}
vi.mock('fast-csv', async (importOriginal) => {
  const original = await importOriginal<typeof import('fast-csv')>()
  return {
    ...original,
    format: vi.fn(() => mockCsvStream),
  }
})

const mockWriteStream = {
  write: vi.fn(),
  end: vi.fn(),
  on: vi.fn((event, cb) => {
    if (event === 'finish') {
      cb()
    }
  }),
}
vi.spyOn(fs, 'createWriteStream').mockReturnValue(
  mockWriteStream as unknown as fs.WriteStream,
)

// Dynamically import the script to allow mocks to be set up first
const { parseFile, main } = await import('../parse-imazing-txt')

describe('iMazing Parser Script', () => {
  const mockInputFile = 'test-input.txt'
  const mockOutputFile = 'test-output.csv'

  beforeEach(() => {
    vi.clearAllMocks()
    vi.spyOn(console, 'log').mockImplementation(() => {})
    vi.spyOn(console, 'warn').mockImplementation(() => {})
    vi.spyOn(console, 'error').mockImplementation(() => {})
    vi.spyOn(process, 'exit').mockImplementation(() => {
      throw new Error('process.exit called')
    })

    mock({
      [mockInputFile]: `----------------------------------------------------
2025-07-01 10:00:00 from Melanie
Hello Nathan! How are you?
Check this out: https://example.com
----------------------------------------------------
2025-07-01 10:05:00 to Melanie
I'm good, thanks! Look at this cool image: IMG_1234.jpeg
And this link: http://another-example.com/
----------------------------------------------------
Malformed block
Just some text without a header.
----------------------------------------------------
2025-07-01 10:10:00 from Melanie
This is a message with no body.
----------------------------------------------------
2025-07-01 10:15:00 from Melanie
      `, // Empty body
    })
  })

  afterEach(() => {
    mock.restore()
    vi.restoreAllMocks()
  })

  it('should parse valid messages correctly', async () => {
    await parseFile(mockInputFile, mockOutputFile)

    expect(mockCsvStream.write).toHaveBeenCalledTimes(3)

    // Check first valid message
    expect(mockCsvStream.write).toHaveBeenCalledWith({
      id: 1,
      timestamp: '2025-07-01T10:00:00.000Z',
      sender: 'Melanie',
      message:
        'Hello Nathan! How are you?\nCheck this out: https://example.com',
      links: 'https://example.com',
      assets: '',
    })

    // Check second valid message
    expect(mockCsvStream.write).toHaveBeenCalledWith({
      id: 2,
      timestamp: '2025-07-01T10:05:00.000Z',
      sender: 'Nathan',
      message:
        "I'm good, thanks! Look at this cool image: IMG_1234.jpeg\nAnd this link: http://another-example.com/",
      links: 'http://another-example.com/',
      assets: 'IMG_1234.jpeg',
    })

    // Check third valid message
    expect(mockCsvStream.write).toHaveBeenCalledWith({
      id: 3,
      timestamp: '2025-07-01T10:10:00.000Z',
      sender: 'Melanie',
      message: 'This is a message with no body.',
      links: '',
      assets: '',
    })
  })

  it('should skip malformed blocks and log warnings', async () => {
    await parseFile(mockInputFile, mockOutputFile)
    expect(console.warn).toHaveBeenCalledWith(
      'Skipping block with invalid header:',
      'Malformed block',
    )
    expect(console.warn).toHaveBeenCalledWith(
      'Skipping block with empty message body.',
    )
  })

  it('should extract multiple links and assets from a single message', async () => {
    mock.restore()
    mock({
      [mockInputFile]: `----------------------------------------------------
2025-07-01 11:00:00 from Melanie
Here are some links:
https://first.com
https://second.com
And some images: IMG_1111.jpeg IMG_2222.jpeg
----------------------------------------------------
`,
    })

    await parseFile(mockInputFile, mockOutputFile)

    expect(mockCsvStream.write).toHaveBeenCalledTimes(1)
    expect(mockCsvStream.write).toHaveBeenCalledWith({
      id: 1,
      timestamp: '2025-07-01T11:00:00.000Z',
      sender: 'Melanie',
      message:
        'Here are some links:\nhttps://first.com\nhttps://second.com\nAnd some images: IMG_1111.jpeg IMG_2222.jpeg',
      links: 'https://first.com,https://second.com',
      assets: 'IMG_1111.jpeg,IMG_2222.jpeg',
    })
  })

  it('should handle CLI arguments for main function', async () => {
    process.argv = [
      'node',
      'scripts/parse-imazing-txt.ts',
      '--in',
      mockInputFile,
      '--out',
      mockOutputFile,
      '--preview',
    ]
    await main()
    expect(console.log).toHaveBeenCalledWith(
      expect.stringContaining(`Starting parsing from ${mockInputFile}`),
    )
    expect(console.log).toHaveBeenCalledWith(
      '✓ Parsed message:',
      expect.any(Object),
    )
  })

  it('should handle missing CLI arguments', async () => {
    process.argv = ['node', 'scripts/parse-imazing-txt.ts']
    await expect(main()).rejects.toThrow('process.exit called')
    expect(console.error).toHaveBeenCalledWith(
      expect.stringContaining('Usage:'),
    )
  })

  it('configures fast-csv with the correct headers', async () => {
    // arrange: empty input so parseFile still runs but writes no rows
    mock.restore()
    mock({ [mockInputFile]: '' })

    // spy is already created by vi.mock, so just call parseFile
    await parseFile(mockInputFile, mockOutputFile)

    expect(csv.format).toHaveBeenCalledWith({
      headers: ['id', 'timestamp', 'sender', 'message', 'links', 'assets'],
      writeHeaders: true,
    })
  })
})

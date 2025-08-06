/**
 * Tests for transcript parser
 */

import { describe, it, expect, beforeEach } from 'vitest'

import {
  TranscriptParser,
  type ParsedTranscript,
} from '../transcript-parser.js'

describe('TranscriptParser', () => {
  let parser: TranscriptParser

  beforeEach(() => {
    parser = new TranscriptParser()
  })

  describe('parseTranscript', () => {
    it('should parse a basic conversation', () => {
      const transcript = `User: Hello, can you help me?
Assistant: Of course! I'd be happy to help you. What do you need assistance with?
User: I need help with my code.
Assistant: I'd be glad to help with your code. Could you share the specific issue you're facing?`

      const result = parser.parseTranscript(transcript)

      expect(result.turns).toHaveLength(4)
      expect(result.turns[0]).toEqual({
        role: 'user',
        content: 'Hello, can you help me?',
      })
      expect(result.turns[1]).toEqual({
        role: 'assistant',
        content:
          "Of course! I'd be happy to help you. What do you need assistance with?",
      })
      expect(result.lastAssistantMessage).toBe(
        "I'd be glad to help with your code. Could you share the specific issue you're facing?",
      )
    })

    it('should handle Human: instead of User:', () => {
      const transcript = `Human: Test message
Assistant: Response message`

      const result = parser.parseTranscript(transcript)

      expect(result.turns).toHaveLength(2)
      expect(result.turns[0]).toEqual({
        role: 'human',
        content: 'Test message',
      })
      expect(result.turns[1]).toEqual({
        role: 'assistant',
        content: 'Response message',
      })
    })

    it('should handle multi-line messages', () => {
      const transcript = `User: This is a long message
that spans multiple lines
and continues here.
Assistant: This is my response
which also spans
multiple lines.`

      const result = parser.parseTranscript(transcript)

      expect(result.turns).toHaveLength(2)
      expect(result.turns[0].content).toBe(
        'This is a long message\nthat spans multiple lines\nand continues here.',
      )
      expect(result.turns[1].content).toBe(
        'This is my response\nwhich also spans\nmultiple lines.',
      )
    })

    it('should handle empty transcript', () => {
      const result = parser.parseTranscript('')

      expect(result.turns).toHaveLength(0)
      expect(result.lastAssistantMessage).toBeUndefined()
    })

    it('should include metadata', () => {
      const transcript = `User: Test
Assistant: Response`
      const filePath = '/path/to/transcript.txt'

      const result = parser.parseTranscript(transcript, filePath)

      expect(result.metadata).toBeDefined()
      expect(result.metadata?.totalTurns).toBe(2)
      expect(result.metadata?.filePath).toBe(filePath)
      expect(result.metadata?.parsedAt).toBeDefined()
    })

    it('should extract last assistant message correctly', () => {
      const transcript = `User: First question
Assistant: First response
User: Second question
Assistant: Final response`

      const result = parser.parseTranscript(transcript)

      expect(result.lastAssistantMessage).toBe('Final response')
    })
  })

  describe('getSummary', () => {
    it('should provide correct conversation summary', () => {
      const transcript: ParsedTranscript = {
        turns: [
          { role: 'user', content: 'Hello' },
          { role: 'assistant', content: 'Hi there' },
          { role: 'human', content: 'How are you?' },
          { role: 'assistant', content: "I'm doing well" },
        ],
        metadata: {
          parsedAt: new Date().toISOString(),
          totalTurns: 4,
        },
      }

      const summary = parser.getSummary(transcript)

      expect(summary.totalTurns).toBe(4)
      expect(summary.userTurns).toBe(2) // user + human
      expect(summary.assistantTurns).toBe(2)
      expect(summary.lastRole).toBe('assistant')
    })

    it('should handle empty transcript in summary', () => {
      const transcript: ParsedTranscript = {
        turns: [],
        metadata: {
          parsedAt: new Date().toISOString(),
          totalTurns: 0,
        },
      }

      const summary = parser.getSummary(transcript)

      expect(summary.totalTurns).toBe(0)
      expect(summary.userTurns).toBe(0)
      expect(summary.assistantTurns).toBe(0)
      expect(summary.lastRole).toBeNull()
    })
  })

  describe('getLastAssistantMessage', () => {
    it('should return last assistant message', () => {
      const transcript: ParsedTranscript = {
        turns: [],
        lastAssistantMessage: 'This is the last message',
        metadata: {
          parsedAt: new Date().toISOString(),
          totalTurns: 0,
        },
      }

      const message = parser.getLastAssistantMessage(transcript)
      expect(message).toBe('This is the last message')
    })

    it('should return null when no assistant message', () => {
      const transcript: ParsedTranscript = {
        turns: [],
        metadata: {
          parsedAt: new Date().toISOString(),
          totalTurns: 0,
        },
      }

      const message = parser.getLastAssistantMessage(transcript)
      expect(message).toBeNull()
    })
  })
})

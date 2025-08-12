import { describe, it, expect } from 'vitest'

import { ContentRedactor } from '../redaction.js'

describe('ContentRedactor', () => {
  let redactor: ContentRedactor

  beforeEach(() => {
    redactor = new ContentRedactor()
  })

  describe('PII Detection and Redaction', () => {
    describe('Email Addresses', () => {
      it('should redact simple email addresses', () => {
        const text = 'Contact me at john.doe@example.com for details.'
        const result = redactor.redactContent(text)

        expect(result.content).toBe('Contact me at <PII:EMAIL> for details.')
        expect(result.redactionCounts.email).toBe(1)
      })

      it('should redact multiple email addresses', () => {
        const text = 'Send to admin@test.com or support@help.org'
        const result = redactor.redactContent(text)

        expect(result.content).toBe('Send to <PII:EMAIL> or <PII:EMAIL>')
        expect(result.redactionCounts.email).toBe(2)
      })

      it('should redact complex email addresses', () => {
        const text = 'My email is test.user+tag123@subdomain.example.co.uk'
        const result = redactor.redactContent(text)

        expect(result.content).toBe('My email is <PII:EMAIL>')
        expect(result.redactionCounts.email).toBe(1)
      })
    })

    describe('Phone Numbers', () => {
      it('should redact US phone numbers', () => {
        const text = 'Call me at (555) 123-4567 or 555.123.4567'
        const result = redactor.redactContent(text)

        expect(result.content).toBe('Call me at <PII:PHONE> or <PII:PHONE>')
        expect(result.redactionCounts.phone).toBe(2)
      })

      it('should redact international phone numbers', () => {
        const text = 'International: +1-555-123-4567 and +44 20 1234 5678'
        const result = redactor.redactContent(text)

        expect(result.content).toBe(
          'International: <PII:PHONE> and <PII:PHONE>',
        )
        expect(result.redactionCounts.phone).toBe(2)
      })

      it('should redact phone numbers with extensions', () => {
        const text = 'Office: 555-123-4567 ext. 123'
        const result = redactor.redactContent(text)

        expect(result.content).toBe('Office: <PII:PHONE>')
        expect(result.redactionCounts.phone).toBe(1)
      })
    })

    describe('URLs', () => {
      it('should redact HTTP and HTTPS URLs', () => {
        const text = 'Visit https://example.com or http://test.org'
        const result = redactor.redactContent(text)

        expect(result.content).toBe('Visit <PII:URL> or <PII:URL>')
        expect(result.redactionCounts.url).toBe(2)
      })

      it('should redact URLs with paths and parameters', () => {
        const text = 'Check https://api.example.com/users?id=123&token=abc'
        const result = redactor.redactContent(text)

        expect(result.content).toBe('Check <PII:URL>')
        expect(result.redactionCounts.url).toBe(1)
      })

      it('should redact www URLs without protocol', () => {
        const text = 'Go to www.example.com/path'
        const result = redactor.redactContent(text)

        expect(result.content).toBe('Go to <PII:URL>')
        expect(result.redactionCounts.url).toBe(1)
      })
    })

    describe('ID Tokens', () => {
      it('should redact UUIDs', () => {
        const text = 'User ID: 550e8400-e29b-41d4-a716-446655440000'
        const result = redactor.redactContent(text)

        expect(result.content).toBe('User ID: <PII:ID_TOKEN>')
        expect(result.redactionCounts.id_token).toBe(1)
      })

      it('should redact API keys (OpenAI style)', () => {
        const text = 'Use API key sk-1234567890abcdef1234567890abcdef12345678'
        const result = redactor.redactContent(text)

        expect(result.content).toBe('Use API key <PII:ID_TOKEN>')
        expect(result.redactionCounts.id_token).toBe(1)
      })

      it('should redact API keys (Anthropic style)', () => {
        const text = 'Key: sk-ant-api03-abcdefghijklmnopqrstuvwxyz123456'
        const result = redactor.redactContent(text)

        expect(result.content).toBe('Key: <PII:ID_TOKEN>')
        expect(result.redactionCounts.id_token).toBe(1)
      })

      it('should redact JWT tokens', () => {
        const text =
          'Token: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c'
        const result = redactor.redactContent(text)

        expect(result.content).toBe('Token: <PII:ID_TOKEN>')
        expect(result.redactionCounts.id_token).toBe(1)
      })
    })

    describe('Person Names', () => {
      it('should redact common first and last name patterns', () => {
        const text = 'Hi John Smith, how are you?'
        const result = redactor.redactContent(text)

        expect(result.content).toBe('Hi <PII:PERSON_NAME>, how are you?')
        expect(result.redactionCounts.person_name).toBe(1)
      })

      it('should redact multiple names in conversation', () => {
        const text = 'John and Mary are coming, but not Bob Johnson'
        const result = redactor.redactContent(text)

        expect(result.content).toBe(
          '<PII:PERSON_NAME> and <PII:PERSON_NAME> are coming, but not <PII:PERSON_NAME>',
        )
        expect(result.redactionCounts.person_name).toBe(3)
      })

      it('should handle names with titles', () => {
        const text = 'Dr. Sarah Wilson and Mr. James Brown will attend'
        const result = redactor.redactContent(text)

        expect(result.content).toBe(
          'Dr. <PII:PERSON_NAME> and Mr. <PII:PERSON_NAME> will attend',
        )
        expect(result.redactionCounts.person_name).toBe(2)
      })
    })
  })

  describe('Mixed PII Types', () => {
    it('should redact multiple PII types in single text', () => {
      const text =
        'Contact John Smith at john@example.com or (555) 123-4567, visit https://profile.example.com/user/12345'
      const result = redactor.redactContent(text)

      expect(result.content).toBe(
        'Contact <PII:PERSON_NAME> at <PII:EMAIL> or <PII:PHONE>, visit <PII:URL>',
      )
      expect(result.redactionCounts.person_name).toBe(1)
      expect(result.redactionCounts.email).toBe(1)
      expect(result.redactionCounts.phone).toBe(1)
      expect(result.redactionCounts.url).toBe(1)
    })
  })

  describe('Conversation Redaction', () => {
    it('should redact PII across all messages in conversation', () => {
      const conversation = {
        id: 'conv-123',
        messages: [
          {
            id: 'msg-1',
            content: 'Hi, my email is user@test.com',
            authorId: 'user-1',
            timestamp: new Date(),
          },
          {
            id: 'msg-2',
            content: 'Call me at (555) 123-4567 when you can',
            authorId: 'user-2',
            timestamp: new Date(),
          },
          {
            id: 'msg-3',
            content: 'Thanks John! I will reach out soon.',
            authorId: 'user-1',
            timestamp: new Date(),
          },
        ],
        participants: [],
        timestamp: new Date(),
        startTime: new Date(),
        endTime: new Date(),
      }

      const result = redactor.redactConversation(conversation)

      expect(result.conversation.messages[0].content).toBe(
        'Hi, my email is <PII:EMAIL>',
      )
      expect(result.conversation.messages[1].content).toBe(
        'Call me at <PII:PHONE> when you can',
      )
      expect(result.conversation.messages[2].content).toBe(
        'Thanks <PII:PERSON_NAME>! I will reach out soon.',
      )

      expect(result.redactionCounts.email).toBe(1)
      expect(result.redactionCounts.phone).toBe(1)
      expect(result.redactionCounts.person_name).toBe(1)
    })
  })

  describe('Edge Cases and Safety', () => {
    it('should handle empty content gracefully', () => {
      const result = redactor.redactContent('')

      expect(result.content).toBe('')
      expect(result.redactionCounts).toEqual({
        email: 0,
        phone: 0,
        url: 0,
        id_token: 0,
        person_name: 0,
      })
    })

    it('should handle null or undefined content', () => {
      // @ts-expect-error Testing runtime behavior
      const result1 = redactor.redactContent(null)
      // @ts-expect-error Testing runtime behavior
      const result2 = redactor.redactContent(undefined)

      expect(result1.content).toBe('')
      expect(result2.content).toBe('')
    })

    it('should preserve non-PII content exactly', () => {
      const text = 'The weather is nice today. I had a great lunch!'
      const result = redactor.redactContent(text)

      expect(result.content).toBe(text)
      expect(result.redactionCounts).toEqual({
        email: 0,
        phone: 0,
        url: 0,
        id_token: 0,
        person_name: 0,
      })
    })

    it('should not redact placeholders recursively', () => {
      const text = 'This contains <PII:EMAIL> already redacted'
      const result = redactor.redactContent(text)

      expect(result.content).toBe(text)
      expect(result.redactionCounts).toEqual({
        email: 0,
        phone: 0,
        url: 0,
        id_token: 0,
        person_name: 0,
      })
    })
  })

  describe('Redaction Counts Accuracy', () => {
    it('should count redactions accurately for repeated patterns', () => {
      const text =
        'Email test@example.com or backup@example.com or admin@example.com'
      const result = redactor.redactContent(text)

      expect(result.redactionCounts.email).toBe(3)
    })

    it('should maintain total count integrity across all categories', () => {
      const text =
        'Contact John at john@test.com, call (555) 123-4567, visit https://example.com with token abc123def456'
      const result = redactor.redactContent(text)

      const totalCount = Object.values(result.redactionCounts).reduce(
        (sum, count) => sum + count,
        0,
      )
      expect(totalCount).toBeGreaterThan(0)
      expect(totalCount).toBe(4) // person_name + email + phone + url
    })
  })

  describe('Integration with Processing Pipeline', () => {
    it('should preserve emotional sentiment signals during redaction', () => {
      const text = 'I feel so happy that john@example.com responded positively!'
      const result = redactor.redactContent(text)

      // Emotional words should remain intact
      expect(result.content).toContain('happy')
      expect(result.content).toContain('positively')
      expect(result.content).toBe(
        'I feel so happy that <PII:EMAIL> responded positively!',
      )
    })

    it('should maintain conversational flow after redaction', () => {
      const text = 'Thanks Sarah, I will call you at (555) 123-4567 tomorrow'
      const result = redactor.redactContent(text)

      expect(result.content).toBe(
        'Thanks <PII:PERSON_NAME>, I will call you at <PII:PHONE> tomorrow',
      )
      // Should preserve context and grammatical structure
      expect(result.content).toMatch(
        /Thanks .+, I will call you at .+ tomorrow/,
      )
    })
  })
})

import { describe, expect, it } from 'vitest'

import type {
  ClaudeHookEvent,
  ClaudeNotificationEvent,
  ClaudeStopEvent,
  ClaudeSubagentStopEvent,
  HookEventType,
} from '../claude.js'

describe('Claude Hook Event Types', () => {
  describe('Event Type Discrimination', () => {
    it('should identify Notification events', () => {
      const event: ClaudeNotificationEvent = {
        type: 'Notification',
        data: {
          message: 'User attention needed',
          priority: 'high',
        },
      }

      expect(event.type).toBe('Notification')
      expect(event.data?.message).toBe('User attention needed')
      expect(event.data?.priority).toBe('high')
    })

    it('should identify Stop events', () => {
      const event: ClaudeStopEvent = {
        type: 'Stop',
        transcript_path: '/tmp/transcript.json',
        data: {
          duration: 5000,
          task: 'Build React component',
          success: true,
        },
      }

      expect(event.type).toBe('Stop')
      expect(event.transcript_path).toBe('/tmp/transcript.json')
      expect(event.data?.duration).toBe(5000)
      expect(event.data?.success).toBe(true)
    })

    it('should identify SubagentStop events', () => {
      const event: ClaudeSubagentStopEvent = {
        type: 'SubagentStop',
        data: {
          subagentId: 'agent-123',
          subagentType: 'research',
          result: { found: 10, processed: 10 },
        },
      }

      expect(event.type).toBe('SubagentStop')
      expect(event.data?.subagentId).toBe('agent-123')
      expect(event.data?.subagentType).toBe('research')
      expect(event.data?.result).toEqual({ found: 10, processed: 10 })
    })
  })

  describe('Event Type Guards', () => {
    it('should correctly type guard Notification events', () => {
      const event: ClaudeHookEvent = {
        type: 'Notification',
        data: { message: 'Test' },
      }

      if (event.type === 'Notification') {
        // TypeScript should narrow the type here
        const notificationEvent: ClaudeNotificationEvent = event
        expect(notificationEvent.data?.message).toBe('Test')
      } else {
        throw new Error('Expected Notification event')
      }
    })

    it('should correctly type guard Stop events', () => {
      const event: ClaudeHookEvent = {
        type: 'Stop',
        transcript_path: '/tmp/test.json',
      }

      if (event.type === 'Stop') {
        // TypeScript should narrow the type here
        const stopEvent: ClaudeStopEvent = event
        expect(stopEvent.transcript_path).toBe('/tmp/test.json')
      } else {
        throw new Error('Expected Stop event')
      }
    })

    it('should correctly type guard SubagentStop events', () => {
      const event: ClaudeHookEvent = {
        type: 'SubagentStop',
        data: { subagentId: '123' },
      }

      if (event.type === 'SubagentStop') {
        // TypeScript should narrow the type here
        const subagentEvent: ClaudeSubagentStopEvent = event
        expect(subagentEvent.data?.subagentId).toBe('123')
      } else {
        throw new Error('Expected SubagentStop event')
      }
    })
  })

  describe('Optional Fields', () => {
    it('should handle events without data', () => {
      const minimalNotification: ClaudeNotificationEvent = {
        type: 'Notification',
      }

      expect(minimalNotification.type).toBe('Notification')
      expect(minimalNotification.data).toBeUndefined()
    })

    it('should handle Stop events without transcript path', () => {
      const minimalStop: ClaudeStopEvent = {
        type: 'Stop',
      }

      expect(minimalStop.type).toBe('Stop')
      expect(minimalStop.transcript_path).toBeUndefined()
      expect(minimalStop.data).toBeUndefined()
    })

    it('should handle SubagentStop events without data', () => {
      const minimalSubagent: ClaudeSubagentStopEvent = {
        type: 'SubagentStop',
      }

      expect(minimalSubagent.type).toBe('SubagentStop')
      expect(minimalSubagent.data).toBeUndefined()
    })
  })

  describe('Event Type Constants', () => {
    it('should have correct event type values', () => {
      const validTypes: HookEventType[] = [
        'Notification',
        'Stop',
        'SubagentStop',
      ]

      expect(validTypes).toContain('Notification')
      expect(validTypes).toContain('Stop')
      expect(validTypes).toContain('SubagentStop')
      expect(validTypes.length).toBe(3)
    })
  })

  describe('Unknown Event Handling', () => {
    it('should handle events with extra properties', () => {
      const eventWithExtras = {
        type: 'Notification' as const,
        data: {
          message: 'Test',
          priority: 'high' as const,
          customField: 'extra data',
          nested: { value: 123 },
        },
      }

      expect(eventWithExtras.type).toBe('Notification')
      expect(eventWithExtras.data.customField).toBe('extra data')
      expect(eventWithExtras.data.nested.value).toBe(123)
    })
  })
})

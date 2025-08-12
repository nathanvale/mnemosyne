/**
 * PII redaction categories supported by the redactor
 */
export type PIICategory = 'email' | 'phone' | 'url' | 'id_token' | 'person_name'

/**
 * Message in a conversation for redaction purposes
 */
export interface ConversationMessage {
  id: string
  content: string
  authorId: string
  timestamp: Date
  metadata?: Record<string, unknown>
}

/**
 * Conversation data structure for redaction
 */
export interface ConversationData {
  id: string
  messages: ConversationMessage[]
  participants: Array<{
    id: string
    name: string
    role: string
  }>
  timestamp: Date
  startTime: Date
  endTime: Date
  context?: Record<string, unknown>
}

/**
 * Counts of redactions performed by category
 */
export interface RedactionCounts {
  email: number
  phone: number
  url: number
  id_token: number
  person_name: number
}

/**
 * Result of content redaction
 */
export interface RedactionResult {
  /** Content with PII replaced by placeholders */
  content: string
  /** Count of redactions performed by category */
  redactionCounts: RedactionCounts
}

/**
 * Result of conversation redaction
 */
export interface ConversationRedactionResult {
  /** Conversation with redacted content */
  conversation: ConversationData
  /** Total redaction counts across all messages */
  redactionCounts: RedactionCounts
}

/**
 * Interface for content redaction implementations
 */
export interface IContentRedactor {
  /**
   * Redact PII from a single text string
   * @param content - Text content to redact
   * @returns Redaction result with placeholders and counts
   */
  redactContent(content: string): RedactionResult

  /**
   * Redact PII from all messages in a conversation
   * @param conversation - Conversation data to redact
   * @returns Redacted conversation and total counts
   */
  redactConversation(
    conversation: ConversationData,
  ): ConversationRedactionResult
}

/**
 * Content redactor that replaces PII with standardized placeholders
 *
 * Supports redaction categories:
 * - email: Email addresses
 * - phone: Phone numbers in various formats
 * - url: HTTP/HTTPS URLs and www domains
 * - id_token: UUIDs, API keys, JWT tokens
 * - person_name: Common first/last name patterns
 *
 * Redaction maintains emotional sentiment and conversational flow
 * while replacing sensitive information with <PII:TYPE> placeholders.
 */
export class ContentRedactor implements IContentRedactor {
  private readonly emailPattern =
    /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g
  private readonly phonePattern =
    /(?:\+?1[-.\s]?)?\(?[0-9]{3}\)?[-.\s]?[0-9]{3}[-.\s]?[0-9]{4}(?:\s?(?:ext|extension|x)\.?\s?\d+)?\b|\+\d{1,3}(?:[-.\s]\d{1,4}){2,5}(?:\s?(?:ext|extension|x)\.?\s?\d+)?\b/g
  private readonly urlPattern = /(?:https?:\/\/|www\.)[^\s<>"]+/g
  private readonly uuidPattern =
    /\b[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\b/gi
  private readonly apiKeyPattern =
    /\bsk-[a-zA-Z0-9_-]{20,}|\bsk-ant-api\d{2}-[a-zA-Z0-9]{32}\b/g
  private readonly jwtPattern =
    /eyJ[A-Za-z0-9_-]+\.eyJ[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+/g
  private readonly personNamePattern = /\b[A-Z][a-z]+(?:\s+[A-Z][a-z]+){0,2}\b/g

  /**
   * Create a new ContentRedactor instance
   */
  constructor() {
    // Patterns are immutable, no configuration needed
  }

  /**
   * Redact PII from text content
   * @param content - Text to redact
   * @returns Redacted text and counts
   */
  redactContent(content: string): RedactionResult {
    if (!content || typeof content !== 'string') {
      return {
        content: '',
        redactionCounts: this.createEmptyRedactionCounts(),
      }
    }

    let redactedContent = content
    const counts = this.createEmptyRedactionCounts()

    // Skip redaction if content already contains placeholders
    if (redactedContent.includes('<PII:')) {
      return {
        content: redactedContent,
        redactionCounts: counts,
      }
    }

    // Process in order to avoid conflicts: specific patterns first, then general patterns

    // Redact URLs first (they might contain numbers that look like phones)
    redactedContent = redactedContent.replace(this.urlPattern, () => {
      counts.url++
      return '<PII:URL>'
    })

    // Redact emails
    redactedContent = redactedContent.replace(this.emailPattern, () => {
      counts.email++
      return '<PII:EMAIL>'
    })

    // Redact ID tokens (UUIDs, API keys, JWT) before phone numbers
    // to prevent phone regex from interfering
    redactedContent = redactedContent.replace(this.jwtPattern, () => {
      counts.id_token++
      return '<PII:ID_TOKEN>'
    })

    redactedContent = redactedContent.replace(this.apiKeyPattern, () => {
      counts.id_token++
      return '<PII:ID_TOKEN>'
    })

    redactedContent = redactedContent.replace(this.uuidPattern, () => {
      counts.id_token++
      return '<PII:ID_TOKEN>'
    })

    // Redact phone numbers after ID tokens
    redactedContent = redactedContent.replace(this.phonePattern, () => {
      counts.phone++
      return '<PII:PHONE>'
    })

    // Redact person names last (be careful with common words)
    redactedContent = redactedContent.replace(
      this.personNamePattern,
      (match) => {
        // Skip common words that might be capitalized
        const commonWords = [
          'The',
          'This',
          'That',
          'You',
          'Your',
          'My',
          'Our',
          'Their',
          'His',
          'Her',
          'Hi',
          'Hello',
          'Thanks',
          'Thank',
          'Contact',
          'Call',
          'Send',
          'Visit',
          'International',
          'Office',
          'Check',
          'Go',
          'User',
          'Use',
          'Key',
          'Token',
          'API',
          'App',
          'Test',
          'Example',
          'Hi',
          'Hello',
          'Thanks',
          'Contact',
          'Dr',
          'Mr',
          'Ms',
          'Mrs',
          'Prof',
          'Dr.',
          'Mr.',
          'Ms.',
          'Mrs.',
          'Prof.',
        ]
        const words = match.trim().split(/\s+/)

        // Only skip single words if they're in the common words list
        if (words.length === 1 && commonWords.includes(words[0])) {
          return match
        }

        // For multi-word matches, don't redact if it starts with a common word
        if (words.length > 1 && commonWords.includes(words[0])) {
          return match
        }

        counts.person_name++
        return '<PII:PERSON_NAME>'
      },
    )

    return {
      content: redactedContent,
      redactionCounts: counts,
    }
  }

  /**
   * Redact PII from all messages in a conversation
   * @param conversation - Conversation to redact
   * @returns Redacted conversation and total counts
   */
  redactConversation(
    conversation: ConversationData,
  ): ConversationRedactionResult {
    const redactedConversation = { ...conversation }
    const totalCounts = this.createEmptyRedactionCounts()

    // Redact each message content
    redactedConversation.messages = conversation.messages.map((message) => {
      const redactionResult = this.redactContent(message.content)

      // Accumulate counts
      this.addRedactionCounts(totalCounts, redactionResult.redactionCounts)

      return {
        ...message,
        content: redactionResult.content,
      }
    })

    return {
      conversation: redactedConversation,
      redactionCounts: totalCounts,
    }
  }

  /**
   * Create empty redaction counts object
   */
  private createEmptyRedactionCounts(): RedactionCounts {
    return {
      email: 0,
      phone: 0,
      url: 0,
      id_token: 0,
      person_name: 0,
    }
  }

  /**
   * Add redaction counts to a total
   * @param total - Total counts to add to
   * @param toAdd - Counts to add
   */
  private addRedactionCounts(
    total: RedactionCounts,
    toAdd: RedactionCounts,
  ): void {
    total.email += toAdd.email
    total.phone += toAdd.phone
    total.url += toAdd.url
    total.id_token += toAdd.id_token
    total.person_name += toAdd.person_name
  }
}

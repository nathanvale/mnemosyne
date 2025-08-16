import type { MemoryLLMResponse, ExtractedMemory } from './response-schema'
import type { LLMResponse } from './types'

import {
  MemoryLLMResponseSchema,
  MemoryLLMResponseSingularSchema,
} from './response-schema'

/**
 * Result of parsing LLM response
 */
export interface ParseResult {
  success: boolean
  data?: MemoryLLMResponse
  error?: {
    type: 'parsing' | 'validation' | 'timeout'
    message: string
    originalContent: string
    repairedContent?: string
    isRecoverable: boolean
  }
  repairAttempts: number
  statistics: {
    totalMemories: number
    averageConfidence: number
    processingTimeMs: number
    contentLength: number
  }
  isLegacyFormat?: boolean
  isFallbackExtraction?: boolean
}

/**
 * Corrective retry function type
 */
export type CorrectiveRetryFn = () => Promise<LLMResponse>

/**
 * Stream parser for assembling streaming responses
 */
export interface StreamParser {
  addChunk(chunk: string): void
  finalize(): Promise<ParseResult>
}

/**
 * ResponseParser handles parsing and validation of LLM responses for memory extraction
 */
export class ResponseParser {
  private readonly maxRepairAttempts = 3

  /**
   * Parse LLM response into structured memory format
   */
  async parseMemoryResponse(
    response: LLMResponse,
    correctiveRetryFn?: CorrectiveRetryFn,
  ): Promise<ParseResult> {
    const startTime = performance.now()
    let repairAttempts = 0
    const originalContent = response.content
    let currentContent = originalContent

    // Try parsing the original response first
    let parseResult = this.attemptParse(currentContent)

    // If initial parse fails due to JSON parsing (not schema validation), attempt repairs
    while (
      !parseResult.success &&
      parseResult.errorType === 'json_parse' &&
      repairAttempts < this.maxRepairAttempts
    ) {
      repairAttempts++
      currentContent = this.attemptRepair(currentContent, repairAttempts)
      parseResult = this.attemptParse(currentContent)
    }

    // If still failing due to parsing issues and corrective retry is available, try that
    if (
      !parseResult.success &&
      parseResult.errorType === 'json_parse' &&
      correctiveRetryFn &&
      repairAttempts > 0
    ) {
      try {
        const retryResponse = await correctiveRetryFn()
        const retryResult = this.attemptParse(retryResponse.content)
        if (retryResult.success) {
          parseResult = retryResult
          repairAttempts++
        }
      } catch {
        // Corrective retry failed, continue with existing result
      }
    }

    // If all parsing attempts failed due to JSON parsing (not schema validation), try fallback extraction
    if (!parseResult.success && parseResult.errorType === 'json_parse') {
      const fallbackResult = this.attemptFallbackExtraction(originalContent)
      if (fallbackResult.success) {
        parseResult = fallbackResult
      }
    }

    const processingTimeMs = performance.now() - startTime

    if (parseResult.success && parseResult.data) {
      const statistics = this.calculateStatistics(
        parseResult.data,
        processingTimeMs,
        originalContent.length,
      )

      return {
        success: true,
        data: parseResult.data,
        repairAttempts,
        statistics,
        isLegacyFormat: parseResult.isLegacyFormat,
        isFallbackExtraction: parseResult.isFallbackExtraction,
      }
    }

    // Determine error type based on the final parse result
    const errorType =
      parseResult.errorType === 'schema_validation' ? 'validation' : 'parsing'
    const errorMessage =
      parseResult.errorType === 'schema_validation'
        ? 'Response failed schema validation'
        : 'Failed to parse LLM response after all repair attempts'

    return {
      success: false,
      error: {
        type: errorType,
        message: errorMessage,
        originalContent,
        repairedContent:
          currentContent !== originalContent ? currentContent : undefined,
        isRecoverable: parseResult.errorType === 'json_parse',
      },
      repairAttempts,
      statistics: {
        totalMemories: 0,
        averageConfidence: 0,
        processingTimeMs,
        contentLength: originalContent.length,
      },
    }
  }

  /**
   * Create a stream parser for assembling streaming responses
   */
  createStreamParser(): StreamParser {
    return new StreamParserImpl(this)
  }

  /**
   * Attempt to parse content as JSON and validate schema
   */
  private attemptParse(content: string): {
    success: boolean
    data?: MemoryLLMResponse
    isLegacyFormat?: boolean
    isFallbackExtraction?: boolean
    errorType?: 'json_parse' | 'schema_validation'
  } {
    try {
      // Extract JSON from content if wrapped in text
      const jsonContent = this.extractJSON(content)
      if (!jsonContent) {
        return { success: false, errorType: 'json_parse' }
      }

      const parsed = JSON.parse(jsonContent)

      // Try plural schema first
      const pluralResult = MemoryLLMResponseSchema.safeParse(parsed)
      if (pluralResult.success) {
        return {
          success: true,
          data: pluralResult.data,
          isLegacyFormat: false,
        }
      }

      // Try singular schema for legacy support
      const singularResult = MemoryLLMResponseSingularSchema.safeParse(parsed)
      if (singularResult.success) {
        // Convert singular to plural format
        const convertedData: MemoryLLMResponse = {
          schemaVersion: singularResult.data.schemaVersion,
          memories: [singularResult.data.memory],
        }
        return {
          success: true,
          data: convertedData,
          isLegacyFormat: true,
        }
      }

      // JSON parsed successfully but failed schema validation
      return { success: false, errorType: 'schema_validation' }
    } catch {
      // JSON parsing failed
      return { success: false, errorType: 'json_parse' }
    }
  }

  /**
   * Extract JSON from content that may be wrapped in explanatory text
   */
  private extractJSON(content: string): string | null {
    // First try the content as-is
    const trimmed = content.trim()
    if (trimmed.startsWith('{') && trimmed.endsWith('}')) {
      return trimmed
    }

    // Look for JSON boundaries in the content
    const jsonMatch = content.match(/\{[\s\S]*\}/m)
    if (jsonMatch) {
      return jsonMatch[0]
    }

    // Look for specific schema markers
    const schemaMatch = content.match(
      /"schemaVersion":\s*"memory_llm_response_v1"[\s\S]*?\}/m,
    )
    if (schemaMatch) {
      // Try to find the opening brace before the schema
      const beforeSchema = content.substring(0, content.indexOf(schemaMatch[0]))
      const openBraceIndex = beforeSchema.lastIndexOf('{')
      if (openBraceIndex >= 0) {
        const fullJson = content.substring(openBraceIndex)
        const closeBraceIndex = fullJson.lastIndexOf('}')
        if (closeBraceIndex > 0) {
          return fullJson.substring(0, closeBraceIndex + 1)
        }
      }
    }

    return null
  }

  /**
   * Attempt to repair malformed JSON
   */
  private attemptRepair(content: string, attemptNumber: number): string {
    let repaired = content

    switch (attemptNumber) {
      case 1:
        // Fix common JSON issues
        repaired = this.fixCommonJSONIssues(repaired)
        break
      case 2:
        // Try to complete incomplete JSON
        repaired = this.completeIncompleteJSON(repaired)
        break
      case 3:
        // More aggressive repairs
        repaired = this.aggressiveJSONRepair(repaired)
        break
    }

    return repaired
  }

  /**
   * Fix common JSON formatting issues
   */
  private fixCommonJSONIssues(content: string): string {
    let fixed = content

    // Remove trailing commas
    fixed = fixed.replace(/,(\s*[}\]])/g, '$1')

    // Fix missing quotes around unquoted strings that look like keys
    fixed = fixed.replace(/([{,]\s*)([a-zA-Z_][a-zA-Z0-9_]*)\s*:/g, '$1"$2":')

    // Fix incomplete strings (add closing quote if missing)
    const lines = fixed.split('\n')
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i]
      const quoteCount = (line.match(/"/g) || []).length
      if (
        quoteCount % 2 !== 0 &&
        !line.trim().endsWith(',') &&
        !line.trim().endsWith('}')
      ) {
        lines[i] = `${line}"`
      }
    }
    fixed = lines.join('\n')

    return fixed
  }

  /**
   * Try to complete incomplete JSON structures
   */
  private completeIncompleteJSON(content: string): string {
    let completed = content.trim()

    // Count braces and brackets to see what's missing
    const openBraces = (completed.match(/\{/g) || []).length
    const closeBraces = (completed.match(/\}/g) || []).length
    const openBrackets = (completed.match(/\[/g) || []).length
    const closeBrackets = (completed.match(/\]/g) || []).length

    // Add missing closing brackets
    for (let i = 0; i < openBrackets - closeBrackets; i++) {
      completed += ']'
    }

    // Add missing closing braces
    for (let i = 0; i < openBraces - closeBraces; i++) {
      completed += '}'
    }

    return completed
  }

  /**
   * More aggressive JSON repair attempts
   */
  private aggressiveJSONRepair(content: string): string {
    let repaired = content

    // Try to build a minimal valid response if we can identify key components
    const schemaMatch = repaired.match(
      /"schemaVersion":\s*"memory_llm_response_v1"/,
    )
    const contentMatch = repaired.match(/"content":\s*"([^"]*)"/)

    if (schemaMatch && contentMatch) {
      // Build minimal valid response
      repaired = `{
        "schemaVersion": "memory_llm_response_v1",
        "memories": [{
          "content": "${contentMatch[1]}",
          "emotionalContext": {
            "primaryEmotion": "neutral",
            "secondaryEmotions": [],
            "intensity": 0.5,
            "valence": 0.0,
            "themes": []
          },
          "significance": {
            "overall": 5.0,
            "components": {"emotional_impact": 5.0}
          },
          "confidence": 0.5
        }]
      }`
    }

    return repaired
  }

  /**
   * Attempt fallback extraction from unstructured text
   */
  private attemptFallbackExtraction(content: string): {
    success: boolean
    data?: MemoryLLMResponse
    isFallbackExtraction?: boolean
  } {
    // Simple heuristic extraction for fallback
    if (content.length < 20) {
      return { success: false }
    }

    // Try to extract meaningful content
    const sentences = content
      .split(/[.!?]+/)
      .filter((s) => s.trim().length > 10)
    if (sentences.length === 0) {
      return { success: false }
    }

    // Use the longest sentence as content
    const extractedContent = sentences
      .reduce((longest, current) =>
        current.length > longest.length ? current : longest,
      )
      .trim()

    if (extractedContent.length < 10) {
      return { success: false }
    }

    // Create fallback memory
    const fallbackMemory: ExtractedMemory = {
      content: extractedContent,
      emotionalContext: {
        primaryEmotion: 'neutral',
        secondaryEmotions: [],
        intensity: 0.5,
        valence: 0.0,
        themes: [],
      },
      significance: {
        overall: 5.0,
        components: { emotional_impact: 5.0 },
      },
      confidence: 0.3, // Low confidence for fallback extraction
    }

    const fallbackResponse: MemoryLLMResponse = {
      schemaVersion: 'memory_llm_response_v1',
      memories: [fallbackMemory],
    }

    return {
      success: true,
      data: fallbackResponse,
      isFallbackExtraction: true,
    }
  }

  /**
   * Calculate parsing statistics
   */
  private calculateStatistics(
    data: MemoryLLMResponse,
    processingTimeMs: number,
    contentLength: number,
  ): ParseResult['statistics'] {
    const confidenceValues = data.memories.map((m) => m.confidence)
    const averageConfidence =
      confidenceValues.reduce((sum, conf) => sum + conf, 0) /
      confidenceValues.length

    return {
      totalMemories: data.memories.length,
      averageConfidence: Number(averageConfidence.toFixed(2)),
      processingTimeMs: Number(processingTimeMs.toFixed(2)),
      contentLength,
    }
  }
}

/**
 * Stream event types for processing
 */
export type StreamEventType = 'start' | 'delta' | 'stop' | 'error'

/**
 * Stream event structure for processing chunks
 */
export interface StreamEvent {
  type: StreamEventType
  content?: string
  error?: string
  metadata?: Record<string, unknown>
}

/**
 * Result of stream processing
 */
export interface ProcessResult {
  type: 'continue' | 'complete_object' | 'complete' | 'error'
  buffer?: string
  error?: string
  canValidate?: boolean
  wasRepaired?: boolean
  chunkCount?: number
}

/**
 * Stream metrics for monitoring
 */
export interface StreamMetrics {
  state: string
  bufferSize: number
  chunkCount: number
  structuralDepth: { brace: number; bracket: number }
  inString: boolean
}

/**
 * Enhanced streaming assembly state machine for robust boundary detection
 */
class StreamingAssemblyStateMachine {
  private state:
    | 'awaiting_start'
    | 'in_chunk'
    | 'awaiting_close'
    | 'complete'
    | 'error' = 'awaiting_start'

  private buffer = ''
  private depth = { brace: 0, bracket: 0 }
  private inString = false
  private escapeNext = false
  private lastValidBoundary = 0
  private chunkCount = 0
  private readonly maxBufferSize = 100000

  processChunk(event: StreamEvent): ProcessResult {
    this.chunkCount++

    switch (event.type) {
      case 'start':
        return this.handleStart(event)
      case 'delta':
        return this.handleDelta(event)
      case 'stop':
        return this.handleStop(event)
      case 'error':
        return this.handleError(event)
      default:
        return { type: 'continue', buffer: this.buffer }
    }
  }

  private handleStart(_event: StreamEvent): ProcessResult {
    if (this.state !== 'awaiting_start') {
      this.state = 'error'
      return {
        type: 'error',
        error: `Unexpected start event in state: ${this.state}`,
      }
    }

    this.state = 'in_chunk'
    this.buffer = ''
    this.resetTracking()

    return { type: 'continue', buffer: '' }
  }

  private handleDelta(event: StreamEvent): ProcessResult {
    if (this.state !== 'in_chunk') {
      this.state = 'error'
      return {
        type: 'error',
        error: `Delta received in invalid state: ${this.state}`,
      }
    }

    // Append chunk
    const chunk = event.content || ''
    this.buffer += chunk

    // Safety check
    if (this.buffer.length > this.maxBufferSize) {
      this.state = 'error'
      return {
        type: 'error',
        error: 'Buffer overflow: exceeded max size',
      }
    }

    // Track structural balance
    this.updateStructuralBalance(chunk)

    // Check for complete JSON object
    if (this.isStructurallyComplete()) {
      // Mark potential validation boundary
      this.lastValidBoundary = this.buffer.length

      // Attempt parse (non-blocking)
      if (this.tryParse()) {
        return {
          type: 'complete_object',
          buffer: this.buffer,
          canValidate: true,
        }
      }
    }

    return { type: 'continue', buffer: this.buffer }
  }

  private handleStop(_event: StreamEvent): ProcessResult {
    if (this.state !== 'in_chunk' && this.state !== 'awaiting_close') {
      this.state = 'error'
      return {
        type: 'error',
        error: `Stop received in invalid state: ${this.state}`,
      }
    }

    this.state = 'complete'

    // Final validation attempt
    if (this.tryParse()) {
      return {
        type: 'complete',
        buffer: this.buffer,
        chunkCount: this.chunkCount,
      }
    }

    // Attempt repair if structurally close
    const repaired = this.attemptBasicRepair()
    if (repaired && this.tryParse(repaired)) {
      return {
        type: 'complete',
        buffer: repaired,
        wasRepaired: true,
        chunkCount: this.chunkCount,
      }
    }

    return {
      type: 'error',
      error: 'Invalid JSON after streaming complete',
      buffer: this.buffer,
    }
  }

  private handleError(event: StreamEvent): ProcessResult {
    this.state = 'error'
    return {
      type: 'error',
      error: event.error || 'Stream error',
      buffer: this.buffer,
      chunkCount: this.chunkCount,
    }
  }

  private updateStructuralBalance(chunk: string): void {
    for (const char of chunk) {
      // Handle escape sequences
      if (this.escapeNext) {
        this.escapeNext = false
        continue
      }

      if (char === '\\' && this.inString) {
        this.escapeNext = true
        continue
      }

      // Handle string boundaries
      if (char === '"' && !this.escapeNext) {
        this.inString = !this.inString
        continue
      }

      // Only count structural chars outside strings
      if (!this.inString) {
        switch (char) {
          case '{':
            this.depth.brace++
            break
          case '}':
            this.depth.brace--
            break
          case '[':
            this.depth.bracket++
            break
          case ']':
            this.depth.bracket--
            break
        }
      }
    }
  }

  private isStructurallyComplete(): boolean {
    return (
      !this.inString &&
      this.depth.brace === 0 &&
      this.depth.bracket === 0 &&
      this.buffer.trim().length > 0
    )
  }

  private tryParse(text?: string): boolean {
    try {
      JSON.parse(text || this.buffer)
      return true
    } catch {
      return false
    }
  }

  private attemptBasicRepair(): string | null {
    let repaired = this.buffer.trim()

    // Balance unclosed structures
    if (this.depth.brace > 0) {
      repaired += '}'.repeat(this.depth.brace)
    }
    if (this.depth.bracket > 0) {
      repaired += ']'.repeat(this.depth.bracket)
    }

    // Close unclosed string
    if (this.inString) {
      repaired += '"'
    }

    // Remove common trailing issues
    repaired = repaired.replace(/,\s*([}\]])/, '$1') // Trailing commas

    return repaired
  }

  private resetTracking(): void {
    this.depth = { brace: 0, bracket: 0 }
    this.inString = false
    this.escapeNext = false
    this.lastValidBoundary = 0
  }

  getState(): string {
    return this.state
  }

  getMetrics(): StreamMetrics {
    return {
      state: this.state,
      bufferSize: this.buffer.length,
      chunkCount: this.chunkCount,
      structuralDepth: this.depth,
      inString: this.inString,
    }
  }
}

/**
 * Implementation of stream parser for assembling streaming responses
 */
class StreamParserImpl implements StreamParser {
  private stateMachine = new StreamingAssemblyStateMachine()

  constructor(private parser: ResponseParser) {}

  addChunk(chunk: string): void {
    // Initialize the state machine on first chunk
    if (this.stateMachine.getState() === 'awaiting_start') {
      this.stateMachine.processChunk({ type: 'start' })
    }

    // Convert chunk to stream event and process
    const event: StreamEvent = {
      type: 'delta',
      content: chunk,
    }

    const result = this.stateMachine.processChunk(event)

    // Handle any immediate errors or completions
    if (result.type === 'error') {
      // Errors will be handled during finalization
    }
  }

  async finalize(): Promise<ParseResult> {
    // Send stop event to finalize the stream
    const stopEvent: StreamEvent = { type: 'stop' }
    const result = this.stateMachine.processChunk(stopEvent)

    let finalBuffer: string

    if (result.type === 'complete') {
      finalBuffer = result.buffer!
    } else if (result.type === 'error') {
      // Use whatever buffer we have
      finalBuffer = result.buffer || ''
    } else {
      finalBuffer = result.buffer || ''
    }

    // Create mock LLM response for parsing
    const mockResponse: LLMResponse = {
      content: finalBuffer,
      usage: { inputTokens: 0, outputTokens: 0, totalTokens: 0 },
      model: 'streaming',
      finishReason: 'stop',
    }

    const parseResult = await this.parser.parseMemoryResponse(mockResponse)

    // Enhance parse result with streaming information
    if (result.wasRepaired) {
      parseResult.repairAttempts = Math.max(parseResult.repairAttempts, 1)
    }

    return parseResult
  }

  /**
   * Process a complete stream using events
   */
  async processStream(events: StreamEvent[]): Promise<ParseResult> {
    for (const event of events) {
      const result = this.stateMachine.processChunk(event)

      if (result.type === 'error') {
        // Return error result immediately
        return {
          success: false,
          error: {
            type: 'parsing',
            message: result.error || 'Stream processing error',
            originalContent: result.buffer || '',
            isRecoverable: false,
          },
          repairAttempts: 0,
          statistics: {
            totalMemories: 0,
            averageConfidence: 0,
            processingTimeMs: 0,
            contentLength: result.buffer?.length || 0,
          },
        }
      }

      if (result.type === 'complete') {
        // Process final result
        const mockResponse: LLMResponse = {
          content: result.buffer!,
          usage: { inputTokens: 0, outputTokens: 0, totalTokens: 0 },
          model: 'streaming',
          finishReason: 'stop',
        }

        const parseResult = await this.parser.parseMemoryResponse(mockResponse)

        if (result.wasRepaired) {
          parseResult.repairAttempts = Math.max(parseResult.repairAttempts, 1)
        }

        return parseResult
      }
    }

    // If we get here, stream didn't complete properly
    return {
      success: false,
      error: {
        type: 'parsing',
        message: 'Stream ended without proper completion',
        originalContent: '',
        isRecoverable: false,
      },
      repairAttempts: 0,
      statistics: {
        totalMemories: 0,
        averageConfidence: 0,
        processingTimeMs: 0,
        contentLength: 0,
      },
    }
  }
}

import { createHash } from 'node:crypto'

export interface MemoryForDeduplication {
  id: string
  summary: string
  participants: Array<{ id: string; name: string; role: string }>
  sourceMessageIds: string[]
  confidence: number
}

interface MemoryHashContent {
  summary: string
  participants: Array<{ id: string; name: string; role: string }>
  sourceMessageIds: string[]
  confidence: number
}

interface DeduplicationMetadata {
  originalHash: string
  mergedAt?: Date
  mergedWith?: string[]
  mergeReason?: string
}

interface DuplicationCheck {
  isDuplicate: boolean
  existingMemoryId?: string
  duplicateType: 'exact' | 'similar' | 'none'
  similarity?: number
}

export class MemoryContentHasher {
  generateContentHash(memory: MemoryForDeduplication): string {
    const normalized = this.normalizeContent(memory)
    return this.createContentHash(normalized)
  }

  normalizeContent(memory: MemoryForDeduplication): MemoryHashContent {
    const participants = Array.isArray(memory.participants)
      ? memory.participants
      : JSON.parse(memory.participants)

    const sourceMessageIds = Array.isArray(memory.sourceMessageIds)
      ? memory.sourceMessageIds
      : JSON.parse(memory.sourceMessageIds)

    return {
      summary: memory.summary.trim().toLowerCase(),
      participants: participants
        .map((p: { id: string; name: string; role: string }) => ({
          id: p.id,
          name: p.name.toLowerCase().trim(),
          role: p.role.toLowerCase().trim(),
        }))
        .sort((a: { id: string }, b: { id: string }) =>
          a.id.localeCompare(b.id),
        ),
      sourceMessageIds: sourceMessageIds.sort(),
      confidence: memory.confidence,
    }
  }

  private createContentHash(content: MemoryHashContent): string {
    const hashContent = [
      content.summary,
      JSON.stringify(content.participants),
      JSON.stringify(content.sourceMessageIds),
      content.confidence.toString(),
    ].join('|')

    return createHash('sha256').update(hashContent).digest('hex')
  }
}

export class MemoryDeduplicator {
  private sessionHashes = new Set<string>()

  constructor(private contentHasher: MemoryContentHasher) {}

  async checkForDuplicates(
    memory: MemoryForDeduplication,
    existingMemories: MemoryForDeduplication[],
  ): Promise<DuplicationCheck> {
    const hash = this.contentHasher.generateContentHash(memory)

    if (this.sessionHashes.has(hash)) {
      return {
        isDuplicate: true,
        duplicateType: 'exact',
        similarity: 1.0,
      }
    }

    const existingMemory = existingMemories.find(
      (m) => this.contentHasher.generateContentHash(m) === hash,
    )

    if (existingMemory) {
      return {
        isDuplicate: true,
        existingMemoryId: existingMemory.id,
        duplicateType: 'exact',
        similarity: 1.0,
      }
    }

    const similarMemory = this.findSimilarMemory(memory, existingMemories)
    if (similarMemory.memory && similarMemory.similarity > 0.7) {
      return {
        isDuplicate: true,
        existingMemoryId: similarMemory.memory.id,
        duplicateType: 'similar',
        similarity: similarMemory.similarity,
      }
    }

    this.sessionHashes.add(hash)
    return {
      isDuplicate: false,
      duplicateType: 'none',
      similarity: similarMemory.similarity,
    }
  }

  private findSimilarMemory(
    memory: MemoryForDeduplication,
    existingMemories: MemoryForDeduplication[],
  ): { memory: MemoryForDeduplication | null; similarity: number } {
    let bestMatch: MemoryForDeduplication | null = null
    let bestSimilarity = 0

    for (const existing of existingMemories) {
      const similarity = this.calculateSimilarity(memory, existing)
      if (similarity > bestSimilarity) {
        bestSimilarity = similarity
        bestMatch = existing
      }
    }

    return { memory: bestMatch, similarity: bestSimilarity }
  }

  private calculateSimilarity(
    memory1: MemoryForDeduplication,
    memory2: MemoryForDeduplication,
  ): number {
    const normalized1 = this.contentHasher.normalizeContent(memory1)
    const normalized2 = this.contentHasher.normalizeContent(memory2)

    let similarity = 0

    if (normalized1.summary === normalized2.summary) {
      similarity += 0.5
    } else {
      const summaryWords1 = normalized1.summary.split(' ')
      const summaryWords2 = normalized2.summary.split(' ')
      const commonWords = summaryWords1.filter((word) =>
        summaryWords2.includes(word),
      )
      similarity +=
        0.5 *
        (commonWords.length /
          Math.max(summaryWords1.length, summaryWords2.length))
    }

    const sourceOverlap = normalized1.sourceMessageIds.filter((id) =>
      normalized2.sourceMessageIds.includes(id),
    )
    similarity +=
      0.3 *
      (sourceOverlap.length /
        Math.max(
          normalized1.sourceMessageIds.length,
          normalized2.sourceMessageIds.length,
        ))

    const participantOverlap = normalized1.participants.filter((p1) =>
      normalized2.participants.some((p2) => p1.id === p2.id),
    )
    similarity +=
      0.2 *
      (participantOverlap.length /
        Math.max(
          normalized1.participants.length,
          normalized2.participants.length,
        ))

    return Math.min(similarity, 1.0)
  }

  createDeduplicationMetadata(
    originalHash: string,
    mergedWith?: string[],
    mergeReason?: string,
  ): DeduplicationMetadata {
    return {
      originalHash,
      mergedAt: new Date(),
      mergedWith,
      mergeReason,
    }
  }

  clearSessionHashes(): void {
    this.sessionHashes.clear()
  }
}

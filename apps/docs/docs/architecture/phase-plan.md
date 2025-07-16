---
id: phase-plan
title: Phase Plan
---

# 🗺️ Phase Plan

## 🎯 Roadmap Overview

Three sequential phases transform raw message history into AI-ready emotional memory:

1. **📦 Message Import** - Foundation completed
2. **🧠 Memory Extraction** - Next priority
3. **🤖 Agent Serving** - Future MCP engine

---

## 📦 Phase 1: Message Import ✅

**Status**: Complete  
**Duration**: 6 weeks  
**Appetite**: Medium

### What We Built

- CSV message ingestion with SHA-256 deduplication
- Prisma database schema with Messages, Links, Assets tables
- Turborepo monorepo with @studio/\* package architecture
- Dual logging system (@studio/logger) for Node.js + browser
- CLI utilities (@studio/scripts) for data processing
- Component library foundation (@studio/ui) with Storybook

### Technical Deliverables

- ✅ **Database Schema** - Relational structure for messages and metadata
- ✅ **Import Pipeline** - CSV processing with error handling and progress tracking
- ✅ **Deduplication** - Content-based hashing to prevent duplicate imports
- ✅ **Monorepo Setup** - Turborepo with intelligent caching and hot reload
- ✅ **Package Architecture** - @studio/\* namespace with proper dependencies
- ✅ **Development Tools** - Vitest, Storybook, MSW, Wallaby.js integration

### Key Learnings

- Content hashing eliminates ~40% duplicate messages in real datasets
- Turborepo provides 10x build speed improvements via caching
- Dual logging system essential for debugging across environments
- Component-driven development accelerates UI iteration

---

## 🧠 Phase 2: Enhanced Memory Extraction (Emotionally Intelligent MVP)

**Status**: Next  
**Appetite**: Medium (6-8 weeks)  
**Dependencies**: Phase 1 complete

### Enhanced Vision

Transform stored messages into psychologically meaningful emotional memories using delta-triggered extraction, mood scoring, and smart validation. Creates the foundation for relationship-aware AI interactions that understand emotional continuity and context. **MVP Focus**: Prove the concept with emotional intelligence and quality over quantity.

### Enhanced Core Deliverables

#### Enhanced Memory Schema Definition

- **Emotional Intelligence Schema** - TypeScript types for mood scoring, delta triggers, and emotional salience
- **Mood Scoring Framework** - Local and contextual mood analysis with confidence factors
- **Delta-Triggered Memory Types** - Structured format for emotionally significant moments
- **Smart Validation Schema** - Auto-confirmation with confidence thresholds and user feedback

#### Emotionally Intelligent Processing Engine

- **Delta-Triggered Extraction** - Focus on emotionally significant moments (mood repairs, positive spikes, sustained tenderness)
- **Mood Scoring Algorithm** - Contextual analysis with delta detection and emotional salience
- **Tone-Tagged Clustering** - Group messages by emotional coherence and psychological patterns
- **Enhanced Claude Integration** - Emotionally weighted prompts with mood context for improved analysis

#### Smart Validation System

- **Auto-Confirmation** - Confidence thresholds (>0.75 auto-approve, 0.50-0.75 review suggested)
- **Emotional Significance Weighting** - Prioritize validation based on emotional importance
- **Bulk Import Handling** - Intelligent emotional sampling for large datasets
- **User Feedback Calibration** - Continuous system learning and confidence adjustment

#### MCP Agent Context Layer

- **Mood Context Tokens** - Structured emotional context for Phase 3 agent integration
- **Relational Timeline** - Emotional event tracking and relationship narrative construction
- **Emotional Vocabulary** - Tone-consistent response capability with relationship awareness
- **HTTP/TRPC Endpoints** - External agent integration interface for Phase 3 preparation

### Enhanced Technical Architecture

```
Message Analysis → Mood Scoring → Delta Detection → Memory Extraction → Smart Validation → MCP Context
      ↓                ↓              ↓                 ↓                  ↓                ↓
Emotional Context → Mood Deltas → Salience Triggers → Claude Processing → Auto-Confirmation → Agent Integration
      ↓                ↓              ↓                 ↓                  ↓                ↓
Local/Contextual → Tone Tags → Emotional Significance → Memory Clustering → User Feedback → Phase 3 Ready
```

### Enhanced Memory Schema Example

```typescript
interface EnhancedMemory {
  id: string
  messageIds: string[]
  participants: string[]
  emotionalContext: {
    mood: 'positive' | 'negative' | 'neutral' | 'mixed' | 'ambiguous'
    intensity: number // 1-10
    moodScore: number // -1.0 to 1.0
    themes: string[] // ['humor', 'support', 'frustration']
    deltaTriggers: string[] // ['mood_repair', 'positive_spike', 'sustained_tenderness']
    temporalPatterns: TemporalPattern[]
  }
  relationshipDynamics: {
    closeness: number // 1-10
    tension: number // 1-10
    supportiveness: number // 1-10
  }
  moodScore: {
    score: number // -1.0 to 1.0
    tone: string
    emotionTags: string[]
    summary: string
    analysisMode: 'local' | 'contextual'
  }
  moodDelta: {
    delta: number
    deltaType: 'positive_spike' | 'mood_repair' | 'sustained_tenderness'
    significance: number
  }
  emotionalSalience: number // 1-10
  toneCluster: string[]
  summary: string
  extractedAt: Date
  confidence: number // 1-10
  confidenceFactors: {
    emotionalSalience: number
    moodCertainty: number
    contextualSupport: number
  }
}
```

### Enhanced Package Extensions

- **@studio/memory** - Enhanced Claude processing with mood scoring and delta-triggered extraction
- **@studio/validation** - Smart validation system with domain-specific UI components for emotional memory review
- **@studio/schema** - Enhanced TypeScript definitions for emotional intelligence and mood tracking
- **@studio/mcp** - MCP foundation layer providing emotional intelligence endpoints for future MCP server integration
- **@studio/ui** - Shared component library for common UI elements across packages

### Enhanced MVP Success Criteria

- Extract emotionally significant memories from 70%+ of processed message batches using delta-triggered analysis
- Achieve 70%+ auto-confirmation rate with confidence thresholds and smart validation
- Process 500-1000 messages successfully with emotional intelligence and quality control
- Generate 50-100 high-quality emotional memories with mood context for Phase 3 testing
- Stay within Claude Pro account limits through efficient emotionally-weighted processing
- Provide structured MCP agent context with mood tokens and relational timeline for Phase 3 integration

---

## 🤖 Phase 3: Claude Memory Integration (MVP)

**Status**: Future  
**Appetite**: Medium (6-8 weeks)  
**Dependencies**: Phase 2 complete

---

### 🎯 Enhanced Vision

Build a **Claude integration system** that provides **emotionally intelligent, relationship-scoped context** to conversations using Phase 2's MCP layer — proving that an AI agent can feel like it "knows you" through emotional memory and mood continuity.

**MVP Focus**: Single integration that demonstrates emotionally aware AI conversations with relationship context.

---

### 🔧 Enhanced Core Deliverables

#### MCP-Powered Memory Query Engine

- **Mood-Aware Query API** – Retrieve emotionally relevant memories using MCP endpoints
- **Emotional Relevance Ranking** – Scoring by emotional salience, mood context, and temporal relevance
- **Agent Context Formatting** – Structure mood tokens and relational timeline for Claude consumption
- **Relationship Filtering** – Scope memories to conversation participants with emotional continuity

#### Emotionally Intelligent Claude Integration

- **Enhanced Claude API Integration** – Direct integration with mood context and emotional vocabulary
- **Mood-Aware Context Injection** – Seamlessly add emotional memory context to conversations
- **Emotional Memory Selection** – Choose most emotionally relevant memories for each interaction
- **Relationship-Aware Conversations** – Demonstrate "knowing you" through emotional continuity and mood awareness

#### MCP Integration Infrastructure

- **MCP Context API** – Leverage Phase 2's mood tokens and relational timeline endpoints
- **Emotional Processing** – Integrate mood scoring and delta awareness into conversation flow
- **Mood-Aware Logging** – Track emotional effectiveness and memory relevance
- **Emotionally Intelligent Interface** – UI demonstrating mood-aware, relationship-contextual conversations

---

### 🧠 Enhanced Architecture Plan

#### Goal

Create a minimal viable system that proves emotionally intelligent memory can enhance AI conversations with mood awareness and relationship continuity.

#### Enhanced File Structure

```
@studio/context/
├── index.ts                  # Main API for emotionally intelligent conversations
├── mcp-integration.ts        # Integration with Phase 2 MCP endpoints
├── mood-aware-query.ts       # Query memories with emotional relevance
├── emotional-context-builder.ts # Format mood tokens and relational timeline
├── claude-integration.ts     # Enhanced Claude API with emotional context
├── types/
│   └── conversation.ts       # Enhanced request/response types with mood
└── utils/
    └── emotional-relevance.ts # Emotional salience-based memory ranking
```

#### Enhanced Integration Flow

```
User Message → MCP Context → Mood-Aware Query → Emotional Context → Claude + Context → Emotionally Intelligent Response
     ↓             ↓              ↓                    ↓               ↓                    ↓
Input Text → Mood Tokens → Emotional Memories → Relational Timeline → Claude API → Response with
             Relational     + Salience Ranking    + Vocabulary        + Emotional     Mood Continuity
             Context                                                   Context
```

#### Enhanced MVP Example

```typescript
interface EmotionalConversationRequest {
  message: string
  participants: string[]
  conversationId?: string
  currentMood?: string
  contextTimeframe?: string
}

interface EmotionalConversationResponse {
  response: string
  memoriesUsed: EnhancedMemory[]
  moodContext: MoodContextToken
  relationalContext: RelationalEvent[]
  emotionalContinuity: boolean
  contextInjected: boolean
}
```

---

### 📦 Enhanced Package Extensions

- `@studio/context`: Enhanced memory query and Claude integration with MCP layer
- `@studio/ui`: Shared component library for common UI elements across packages
- `@studio/validation`: Domain-specific validation interfaces for emotional memory review (progressive development: Storybook → Next.js → Production)

---

### ✅ Enhanced MVP Success Criteria

| Goal                        | Enhanced Metric                                              |
| --------------------------- | ------------------------------------------------------------ |
| Emotional memory relevance  | 3-5 emotionally relevant memories per query                  |
| Mood-aware response quality | Claude responses demonstrate emotional continuity            |
| Integration speed           | < 2 seconds total response time with MCP context             |
| Emotional memory usage      | Uses 50+ different emotional memories across tests           |
| Mood continuity             | Conversations maintain emotional context across interactions |

---

### 🧬 Why This Enhanced MVP Matters

This emotionally intelligent phase proves the core concept with emotional awareness:

- **Conversation feels emotionally personal** – Claude references shared emotional history and mood patterns
- **Emotional memory is actionable** – System successfully queries and applies emotionally relevant memories
- **Mood continuity works** – Conversations maintain emotional context and relationship awareness
- **Technical foundation proven** – MCP→Query→Context→Response pipeline functions with emotional intelligence

**Success = One conversation where Claude demonstrates emotional continuity that makes you think "wow, it really understands our relationship"**

---

## 🔄 Dependencies & Sequencing

### Phase Relationships

```
Phase 1 (Complete) → Phase 2 (Next) → Phase 3 (Future)
     ↓                   ↓                ↓
Foundation →        Memory →         Agent
  Complete         Extraction       Serving
```

### Critical Path

1. **Message Storage** → **Memory Extraction** → **Agent Context**
2. **Dual Logging** → **Processing Monitoring** → **Usage Analytics**
3. **Component Library** → **Validation UI** → **Agent Interfaces**

### Parallel Workstreams

- UI/UX development can proceed alongside backend processing
- Testing infrastructure builds incrementally with each phase
- Documentation and examples evolve with working systems

---

## 📊 MVP Timeline Estimates

| Phase   | Duration  | Complexity | Risk Level |
| ------- | --------- | ---------- | ---------- |
| Phase 1 | 6 weeks   | Medium     | Low ✅     |
| Phase 2 | 6-8 weeks | Medium     | Low        |
| Phase 3 | 6-8 weeks | Medium     | Medium     |

**Total MVP Timeline**: 4-5 months for working emotional memory system

---

## 🎯 MVP Success Metrics

### Phase 2 Targets

- Memory extraction accuracy > 70%
- Human validation rate > 70%
- Generate 50-100 high-quality memories
- Stay within Claude Pro account limits

### Phase 3 Targets

- Memory query response < 2 seconds
- 3-5 relevant memories per conversation
- Claude responses feel personal and contextual
- One "wow, it knows me" moment

### Overall MVP Vision

- **Proof of concept**: AI that demonstrates emotional memory
- **Quality over scale**: 50-100 meaningful memories vs thousands
- **Single integration**: Claude works, extensible later
- **Personal impact**: One conversation that feels genuinely "warm"

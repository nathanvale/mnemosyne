---
id: intent
title: Project Intent – Relational Memory System
---

# 🧠 Project Intent – Relational Memory System

**Author**: Nathan Vale

**Date**: 2025-07-16

**Status**: Phase 1 Complete, Phase 2 In Progress

---

## 🌅 Vision

Build a system that remembers love, laughter, pain, and progress — the whole messy journey of a relationship. One that lets an AI feel like it _knows you_ not just through facts, but through shared emotional history.

**Core Mission**: Transform AI interactions from cold, transactional exchanges into warm, emotionally intelligent conversations by giving AI agents access to structured emotional memories and relationship dynamics.

---

## 🎯 What Are We Really Trying to Do?

### 🔄 The Complete Journey

1. **Import & Structure**: Ingest years of real-world message history and transform it into clean, queryable data
2. **Extract Intelligence**: Turn raw conversations into structured emotional memories with relationship context
3. **Enable AI Connection**: Deliver emotional intelligence to AI agents in a way that transforms their responses and tone

### 🎨 The Emotional Intelligence Stack

- **Foundation Layer**: Reliable message import with deduplication and structured storage
- **Intelligence Layer**: AI-powered emotional memory extraction with mood scoring and relationship dynamics
- **Integration Layer**: Claude conversations enhanced with emotional continuity and relationship awareness

---

## 🧱 Why Now?

### 🚀 The AI Relationship Revolution

- **Current AI Limitation**: Systems are context-blind and memory-poor, creating cold interactions
- **Emotional Intelligence Gap**: Raw message data contains rich emotional context locked in unstructured text
- **Relationship Continuity Need**: AI agents lack access to emotional history and relationship patterns
- **Personal Connection Demand**: Users want AI that feels genuinely personal and emotionally aware

### 💡 Technical Opportunity

- **Advanced AI Capabilities**: Claude and similar models can analyze emotional context with sophisticated understanding
- **Structured Processing**: Modern tooling enables efficient transformation of conversational data into structured intelligence
- **Real-Time Integration**: API capabilities allow seamless injection of emotional context into live conversations

---

## 🚧 What This Is _Not_

- ❌ **Not a public-facing app** (yet) — focused on proving emotional intelligence concepts
- ❌ **Not a fine-tuned model** — leverages existing AI capabilities with enhanced context
- ❌ **Not a generic chat memory API** — specifically designed for relationship-aware emotional intelligence
- ❌ **Not a production system** — MVP focused on demonstrating transformative potential

---

## 🧭 Enhanced Project Phases

### ✅ Phase 1 – Message Import Foundation (Complete)

**Status**: 6 weeks, completed successfully

**What We Built**:

- **Robust CSV Import**: Comprehensive message ingestion with error handling and progress tracking
- **Content Deduplication**: SHA-256 hashing eliminated ~40% duplicate messages in real datasets
- **Monorepo Architecture**: Turborepo with @studio/\* packages, 10x build speed improvement
- **Development Infrastructure**: Vitest, Storybook, MSW, Wallaby.js integration
- **Dual Logging System**: Unified logging for Node.js and browser environments

**Key Achievement**: Solid data foundation enabling Phase 2 emotional intelligence extraction

_Reference: [Phase 1 Intent](./features/phase1/intent.md)_

---

### 🧠 Phase 2 – Enhanced Memory Extraction (In Progress)

**Status**: 6-8 weeks, enhanced emotional intelligence focus

**What We're Building**:

- **Delta-Triggered Extraction**: Focus on emotionally significant moments (mood repairs, positive spikes, sustained tenderness)
- **Mood Scoring Framework**: Local and contextual mood analysis with confidence factors and delta detection
- **Smart Validation System**: Auto-confirmation with confidence thresholds (>0.75 auto-approve, 0.50-0.75 review)
- **MCP Foundation Layer**: Mood context tokens, relational timeline, and emotional vocabulary for agent integration

**Enhanced Goals**:

- Extract meaningful emotional context from 70%+ of processed message batches
- Achieve 70%+ auto-confirmation rate through emotional significance weighting
- Generate 50-100 high-quality emotional memories with structured agent context

**Key Packages**:

- **@studio/memory**: Enhanced Claude processing with mood scoring and delta-triggered extraction
- **@studio/validation**: Smart validation with domain-specific UI components for emotional memory review
- **@studio/schema**: Enhanced TypeScript definitions for emotional intelligence and mood tracking
- **@studio/mcp**: MCP foundation layer providing emotional intelligence endpoints

_Reference: [Phase 2 Intent](./features/phase2/intent.md)_

---

### 🤖 Phase 3 – Claude Memory Integration (Planned)

**Status**: 6-8 weeks, emotionally intelligent conversation system

**What We Will Build**:

- **MCP-Powered Memory Query**: Mood-aware query engine leveraging Phase 2's foundation layer
- **Emotionally Intelligent Claude Integration**: Direct API integration with enhanced mood context injection
- **Relationship-Aware Conversations**: Participant-scoped emotional memory access with continuity tracking
- **"Wow" Moment Interface**: Demonstration of genuine emotional intelligence in AI conversations

**Success Vision**:

- **3-5 emotionally relevant memories** per conversation with &lt;2 second response time
- **Emotional continuity** that makes users think "wow, it really knows me"
- **Relationship awareness** demonstrating understanding of emotional patterns and history

**Key Packages**:

- **@studio/context**: Enhanced Claude integration with mood-aware query capabilities
- **@studio/conversation**: Domain-specific conversation components for emotional intelligence demonstration

_Reference: [Phase 3 Intent](./features/phase3/intent.md)_

---

## 👤 Who This Is For

### 🎯 Primary Beneficiaries

**Internal Agent Systems (Claude, GPT, etc.)**

- Access to structured emotional intelligence for relationship-aware conversations
- Mood context tokens and relational timeline for enhanced responses
- Emotional vocabulary enabling tone-consistent, personally relevant interactions

**You and Melanie (Initial Users)**

- AI conversations that remember emotional history and relationship dynamics
- Personalized interactions that feel genuinely warm and contextually aware
- Demonstration of emotional continuity across conversation sessions

**Future Developers**

- Proven architecture for emotionally intelligent AI agent integration
- Reusable memory pipelines for advanced relationship-aware AI tools
- Foundation for scaling emotional intelligence across multiple AI applications

### 🔮 Future Applications

**Personal AI Assistants**

- AI companions with deep understanding of individual emotional patterns
- Relationship-aware support systems with genuine emotional continuity
- Personal memory systems that understand what matters most to users

**Platform Integration**

- Emotionally intelligent chatbots for customer service and support
- AI agents for mental health and relationship counseling applications
- Enhanced conversational AI for educational and therapeutic contexts

---

## 💥 What Happens If We Get This Right?

### 🌟 Immediate Impact (Phase 3 Success)

**Emotionally Aware AI Conversations**:

- Claude feels like it _knows you_ through shared emotional history
- Conversations reference past emotional moments with appropriate context and tone
- AI responses demonstrate genuine understanding of relationship dynamics and patterns

**Proof of Concept Validation**:

- At least one conversation that creates a "wow, it really understands our relationship" moment
- Demonstrable emotional continuity across conversation sessions
- Technical foundation proven for scaling emotional intelligence

### 🚀 Transformative Potential (Long-term Vision)

**AI Relationship Revolution**:

- Transform AI interactions from transactional to genuinely meaningful and personal
- Enable AI agents that understand emotional nuance and relationship context
- Create foundation for AI companions that provide authentic emotional support

**Emotional Intelligence Platform**:

- Scalable architecture for advanced relationship-aware AI systems
- Reusable emotional intelligence components for broader AI development
- Foundation for AI applications that understand what makes relationships meaningful

**Personal Connection Future**:

- AI systems that remember what matters most in relationships
- Emotional continuity that makes digital interactions feel genuinely human
- Warm, memory-rich interfaces to AI companionship and support

---

## 📊 Success Metrics Across All Phases

### ✅ Phase 1 Achievements (Complete)

- **100% import success rate** for well-formed CSV files
- **~40% duplicate elimination** through content-based hashing
- **10x build speed improvement** via Turborepo intelligent caching
- **Zero data loss** during import processing

### 🎯 Phase 2 Targets (In Progress)

- **70%+ extraction success rate** from processed message batches
- **70%+ auto-confirmation rate** with confidence-based validation
- **50-100 high-quality memories** with structured emotional intelligence
- **Agent-ready context** with mood tokens and relational timeline

### 🌟 Phase 3 Goals (Planned)

- **&lt;2 second response time** including emotional memory context injection
- **3-5 relevant memories** per conversation with emotional salience ranking
- **Emotional continuity** demonstrated across conversation sessions
- **"Wow" moments** proving genuine emotional intelligence in AI interactions

---

## 🛠️ Technical Architecture

### 🏗️ Enhanced Monorepo Structure

```
mnemosyne/
├── apps/
│   ├── studio/          # Next.js 15 application
│   └── docs/            # Docusaurus documentation
├── packages/
│   ├── db/              # Prisma database with emotional intelligence extensions
│   ├── logger/          # Dual logging system (Node.js + browser)
│   ├── memory/          # Enhanced Claude processing with mood scoring
│   ├── validation/      # Smart validation with domain-specific UI components
│   ├── schema/          # Enhanced TypeScript definitions for emotional intelligence
│   ├── mcp/             # MCP foundation layer for agent integration
│   ├── context/         # Enhanced Claude integration (Phase 3)
│   ├── conversation/    # Domain-specific conversation components (Phase 3)
│   ├── ui/              # Shared component library
│   └── scripts/         # CLI utilities and data processing
```

### 🔄 Emotional Intelligence Data Flow

```
Message Import → Emotional Analysis → Memory Extraction → Smart Validation → Agent Context
      ↓                ↓                   ↓                 ↓                ↓
Structured Data → Mood Scoring → Delta-Triggered → Auto-Confirmation → Claude Integration
      ↓                ↓                   ↓                 ↓                ↓
Phase 1 Complete → Phase 2 Active → Phase 2 Active → Phase 2 Active → Phase 3 Planned
```

---

## 🎯 Current Status & Next Steps

### ✅ Phase 1: Complete Foundation

- Robust message import and deduplication system
- Comprehensive development infrastructure and tooling
- Solid data foundation ready for emotional intelligence extraction

### 🔄 Phase 2: Enhanced Memory Extraction (Active)

- Implementing delta-triggered emotional memory extraction
- Building smart validation system with auto-confirmation
- Creating MCP foundation layer for agent integration

### 🔮 Phase 3: Claude Integration (Planned)

- Design complete for emotionally intelligent conversation system
- Architecture ready for mood-aware query engine
- Clear path to demonstrating "wow, it knows me" moments

**Current Priority**: Complete Phase 2 enhanced memory extraction with emotional intelligence to enable transformative Phase 3 Claude integration.

---

_For detailed technical specifications and implementation plans, see the individual phase documentation: [Phase 1](./features/phase1/intent.md), [Phase 2](./features/phase2/intent.md), [Phase 3](./features/phase3/intent.md)_

# 📖 Glossary

## 🧠 Core Concepts

### Memory

A structured representation of emotional or relational context extracted from message history. Contains sentiment, participants, timeline position, and relationship metadata.

### Agent

An AI system (Claude, GPT, etc.) that can query the memory system to gain relationship context for more meaningful conversations.

### MCP (Model Context Protocol)

The API interface that serves relationship-scoped memories to agents, enabling them to access emotional history during conversations.

### Relationship Context

The interpersonal dynamics, shared history, and emotional patterns between specific people as captured in their message exchanges.

---

## 📦 Message Processing

### Message Import

The process of ingesting raw message data (CSV, exports) into the structured database system with deduplication and metadata extraction.

### Content Hash

SHA-256 hash of message content used for deduplication. Prevents duplicate messages from being imported multiple times.

### Deduplication

The process of identifying and preventing duplicate message imports using content-based hashing rather than metadata comparison.

### Link Extraction

Automated identification and cataloging of URLs found within message content, stored with relationship to source messages.

### Asset Management

Handling of media files, attachments, and other non-text content referenced in messages.

---

## 🧠 Memory System

### Memory Extraction

AI-powered analysis of message content to identify emotional context, relationship dynamics, and significant moments.

### Memory Entry

A structured record containing extracted emotional context, participants, timeline information, and relationship metadata.

### Validation Queue

Human review interface for verifying and refining AI-extracted memories before they become available to agents.

### Emotional Metadata

Structured tags describing sentiment, emotional tone, relationship dynamics, and contextual significance of memories.

### Timeline Analysis

Understanding how relationships and emotional patterns evolve over time through message history analysis.

---

## 🤖 Agent Integration

### Memory Query

Request from an agent system to retrieve relevant relationship context for enhancing conversation responses.

### Relationship Scoping

Filtering memories based on the specific participants in a conversation to ensure contextual relevance.

### Relevance Ranking

Ordering retrieved memories by their importance to the current conversation context and timeline proximity.

### Context Injection

The process of formatting and providing selected memories to agent systems as additional conversation context.

### Agent Adapter

Integration layer that translates between the MCP protocol and specific agent systems (Claude, GPT, etc.).

---

## 🏗️ Architecture Terms

### Monorepo

Single repository containing multiple related packages (@studio/\*) with shared tooling and dependencies.

### Turborepo

Build system that provides intelligent caching, dependency management, and parallel processing for monorepo workflows.

### Package Workspace

Individual packages within the monorepo (@studio/db, @studio/logger, etc.) with specific responsibilities.

### Project References

TypeScript configuration that enables optimized builds and type checking across package boundaries.

### Hot Reload

Development feature allowing real-time updates across package boundaries without full rebuilds.

---

## 🛠️ Development Tools

### Dual Logging

Unified logging system that works in both Node.js (server) and browser environments with consistent API.

### Wallaby.js

Live testing tool that provides real-time test feedback, runtime values, and debugging information during development.

### MSW (Mock Service Worker)

API mocking framework used for development and testing, allowing realistic data flows without external dependencies.

### Storybook

Component development environment for building and testing UI components in isolation.

### Vitest

Testing framework used for unit tests across all packages with jsdom environment for React components.

---

## 🗃️ Database Terms

### Prisma ORM

Database toolkit providing type-safe database access, schema management, and client generation.

### Schema Migration

Versioned changes to database structure managed through Prisma's migration system.

### Generated Client

TypeScript-typed database client automatically created from Prisma schema definitions.

### Relational Schema

Database design using foreign keys to connect Messages, Links, and Assets tables with proper referential integrity.

---

## 📊 Processing Terms

### Batch Processing

Handling large volumes of data in optimally-sized groups rather than individual records for performance.

### Worker Threads

Parallel processing capability for CPU-intensive tasks like message analysis and memory extraction.

### Rate Limiting

Controlling the frequency of external API calls (GPT) to respect service limits and optimize costs.

### Error Recovery

Strategies for handling failures in data processing while maintaining overall pipeline integrity.

### Progress Tracking

Real-time monitoring and reporting of long-running data processing operations.

---

## 🔄 Workflow Terms

### Phase-Based Development

Sequential development approach: Message Import → Memory Extraction → Agent Serving.

### Appetite-Driven Planning

Basecamp methodology focusing on time boundaries and scope flexibility rather than feature completeness.

### Incremental Delivery

Building and shipping functional components progressively rather than waiting for complete feature sets.

### Done Lists

Documentation of completed work organized by phases and deliverables rather than task tracking.

---

## 🎯 Quality Terms

### Type Safety

Comprehensive TypeScript coverage ensuring compile-time error detection across all package boundaries.

### Test Coverage

Comprehensive testing strategy spanning unit tests, component tests, and integration tests.

### Memory Accuracy

Measure of how well extracted memories represent the actual emotional context of message exchanges.

### Agent Satisfaction

Metric indicating how useful provided memory context is for improving agent conversation quality.

---

## 🚀 Performance Terms

### Intelligent Caching

Turborepo's ability to skip rebuilds when dependencies haven't changed, dramatically improving development speed.

### Memory Retrieval Latency

Time required to query and return relevant memories for agent context, target < 100ms.

### Concurrent Conversations

Number of simultaneous agent interactions the system can support with memory context.

### Processing Throughput

Rate at which messages can be analyzed and converted to memories, measured in messages per hour.

# 🌊 Data Flow Architecture

## 🎯 Overview

Data flows through three distinct phases, transforming raw message history into AI-ready emotional memory through structured processing pipelines.

## 📊 Complete System Data Flow

```mermaid
graph TD
    %% Phase 1: Message Import (Current)
    A[CSV Files] --> B[Content Parser]
    C[WhatsApp Exports] --> B
    D[Signal Backups] --> B
    B --> E[SHA-256 Hash Generator]
    E --> F[Deduplication Check]
    F --> G[(Prisma Database)]

    %% Database Tables
    G --> H[Messages Table]
    G --> I[Links Table]
    G --> J[Assets Table]

    %% Error Handling
    B --> K[@studio/logger]
    F --> K
    K --> L[Error Recovery]

    %% Phase 2: Memory Extraction (Future)
    H --> M[GPT Processor]
    M --> N[Memory Extraction]
    N --> O[Validation Queue]
    O --> P[(Memory Database)]

    %% Memory Processing
    P --> Q[Emotional Metadata]
    P --> R[Relationship Context]
    P --> S[Timeline Position]

    %% Phase 3: Agent Serving (Future)
    T[Agent Request] --> U[MCP Engine]
    U --> V[Memory Query]
    V --> P
    P --> W[Relevance Ranking]
    W --> X[Context Assembly]
    X --> Y[Agent Response]

    %% Logging Flow (All Phases)
    B --> Z[@studio/logger]
    M --> Z
    U --> Z
    Z --> AA[Structured Logs]

    %% Styling
    classDef current fill:#e1f5fe,stroke:#01579b,stroke-width:2px
    classDef future fill:#f3e5f5,stroke:#4a148c,stroke-width:2px
    classDef database fill:#e8f5e8,stroke:#1b5e20,stroke-width:2px
    classDef logging fill:#fff3e0,stroke:#e65100,stroke-width:2px

    class A,B,C,D,E,F,G,H,I,J current
    class M,N,O,P,Q,R,S future
    class T,U,V,W,X,Y future
    class G,H,I,J,P database
    class K,L,Z,AA logging
```

---

## 📦 Phase 1: Message Import (Current)

### Input Sources

```
CSV Files → Text Messages → WhatsApp Exports → Signal Backups
    ↓           ↓              ↓                ↓
Normalize → Parse → Validate → Process
```

### Processing Pipeline

```
Raw CSV → Content Parser → Hash Generator → Deduplication → Database Storage
   ↓           ↓              ↓               ↓              ↓
Field Map → Message Object → SHA-256 Hash → Unique Check → Prisma Insert
```

### Database Schema Flow

```
Messages Table ← Links Table ← Assets Table
     ↓              ↓            ↓
Core Content → URLs Extracted → Media References
Content Hash → Link Relations → Asset Metadata
Timestamps → Source Messages → File Information
```

### Error Handling Flow

```
Processing Error → @studio/logger → Error Classification → Recovery Action
      ↓               ↓                  ↓                   ↓
Parse Failure → Structured Log → Skip/Retry → Continue Batch
```

### CLI Interface Flow

```
pnpm import:messages → @studio/scripts → Progress Tracking → Completion Report
        ↓                   ↓                ↓                 ↓
File Path Input → Batch Processing → Real-time Updates → Success/Error Summary
```

---

## 🧠 Phase 2: Memory Extraction (Next)

### Memory Processing Pipeline

```
Stored Messages → GPT Processor → Memory Extraction → Validation Queue
      ↓              ↓               ↓                ↓
Message Batches → Emotional Analysis → Structured Memory → Human Review
```

### AI Agent Integration Flow

```
Message Batch → Context Prompt → GPT API Call → Response Parser → Memory Object
     ↓             ↓              ↓             ↓              ↓
Text Content → Emotional Cues → AI Analysis → JSON Extract → Database Storage
```

### Memory Schema Flow

```
Raw Memory → Emotional Metadata → Relationship Context → Timeline Position
     ↓           ↓                    ↓                   ↓
Content Hash → Sentiment Tags → Participant Mapping → Temporal Sequence
```

### Validation Workflow

```
Extracted Memory → Review Queue → Human Validation → Memory Approval
       ↓             ↓             ↓                 ↓
Quality Score → UI Interface → Editor Actions → Final Storage
```

### Batch Processing Flow

```
Message Collection → Batch Formation → Parallel Processing → Result Aggregation
        ↓                ↓                 ↓                   ↓
Time Windows → Optimal Size → Worker Threads → Error Recovery
```

---

## 🤖 Phase 3: Agent Serving (Future)

### MCP Query Flow

```
Agent Request → MCP Engine → Memory Retrieval → Context Assembly → Response
      ↓           ↓             ↓                ↓               ↓
Query Context → Relationship → Relevant → Formatted → Agent
Parameters      Scoping       Memories    Context    Integration
```

### Memory Retrieval Pipeline

```
Query Analysis → Relationship Filter → Relevance Ranking → Context Selection
      ↓              ↓                   ↓                 ↓
Intent Parse → Participant Match → Temporal Weight → Memory Subset
```

### Context Injection Flow

```
Selected Memories → Context Formatter → Agent Adapter → Enhanced Prompt
        ↓               ↓                  ↓             ↓
Memory Objects → Structured Context → Agent-Specific → Conversation
                                      Format          Enhancement
```

### Real-time Processing

```
Conversation → Memory Query → Cache Check → Retrieval → Context Injection
     ↓           ↓             ↓            ↓          ↓
Agent Input → Relevance → Cache Hit/Miss → Database → Agent Response
              Analysis                      Query
```

---

## 🔄 Cross-Phase Data Flows

### Logging Flow (All Phases)

```
Any Operation → @studio/logger → Node.js/Browser → Structured Output
      ↓             ↓               ↓               ↓
Process Event → Dual System → Environment → Development/Production
                               Detection      Logs
```

### Testing Data Flow

```
Test Input → MSW Mocks → Component/API → Vitest Assertions → Wallaby Feedback
     ↓          ↓           ↓             ↓                  ↓
Mock Data → Request → Real Response → Pass/Fail → Live Updates
            Interception
```

### Development Flow

```
Code Change → Turborepo → Incremental Build → Hot Reload → Browser Update
     ↓          ↓            ↓                 ↓            ↓
File Watch → Cache Check → Package Build → Dev Server → Component Refresh
```

---

## 📊 Data Transformation Stages

### Stage 1: Raw to Structured

```
Unstructured Text → Parsed Fields → Validated Data → Database Records
       ↓               ↓              ↓              ↓
CSV/Text Format → Message Objects → Schema Validation → Prisma Storage
```

### Stage 2: Structured to Semantic

```
Database Records → AI Processing → Emotional Context → Memory Entries
       ↓              ↓             ↓                ↓
Message Content → OpenAI Analysis → Sentiment/Tags → Structured Memory
```

### Stage 3: Semantic to Contextual

```
Memory Entries → Query Processing → Relevant Selection → Agent Context
      ↓             ↓                 ↓                 ↓
Stored Memories → Relationship → Filtered Memories → Conversation
                  Scoping                            Enhancement
```

---

## 🛡️ Error Handling & Recovery

### Processing Errors

```
Operation Failure → Error Classification → Recovery Strategy → Retry/Skip
       ↓               ↓                   ↓                ↓
Exception Type → Categorize → Automatic/Manual → Continue Pipeline
```

### Data Consistency

```
Transaction Start → Operations → Validation → Commit/Rollback
       ↓             ↓           ↓            ↓
Database Lock → Multiple → Constraint → Success/Failure
                Operations   Checks
```

### API Failures

```
External API → Failure Detection → Rate Limit Check → Retry Logic
     ↓             ↓                 ↓               ↓
GPT/MCP Call → Timeout/Error → Backoff Strategy → Queue Recovery
```

---

## 📈 Performance Optimization

### Caching Strategy

```
Frequent Queries → Cache Layer → Memory Storage → Fast Retrieval
       ↓             ↓            ↓              ↓
Memory Requests → Redis/Memory → Hot Data → Sub-100ms Response
```

### Batch Processing

```
Large Datasets → Batch Formation → Parallel Processing → Result Aggregation
      ↓             ↓                ↓                   ↓
Message Volume → Optimal Size → Worker Threads → Efficient Completion
```

### Database Optimization

```
Query Patterns → Index Strategy → Connection Pooling → Performance Tuning
      ↓             ↓               ↓                  ↓
Access Patterns → Optimal Indexes → Resource → Query Optimization
                                    Management
```

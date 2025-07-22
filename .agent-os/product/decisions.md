# Technical & Product Decisions

## Foundational Decisions

### Monorepo with Turborepo

**Decision**: Use Turborepo for monorepo management  
**Rationale**:

- 10x build performance improvement through intelligent caching
- Seamless cross-package development with hot reload
- Parallel task execution for faster CI/CD
- Proven at scale by Vercel and other enterprises

**Trade-offs**:

- Initial setup complexity
- Learning curve for developers new to monorepos
- Requires careful dependency management

### SQLite for MVP Database

**Decision**: Choose SQLite over PostgreSQL for initial development  
**Rationale**:

- Zero configuration for rapid development
- Perfect for MVP with <100K messages
- Easy local development without Docker
- Simple migration path to PostgreSQL later

**Trade-offs**:

- Limited concurrent write performance
- No native full-text search
- Single-file database limits backup options

### Dual Logging System Architecture

**Decision**: Build unified logging API for Node.js (Pino) and browser environments  
**Rationale**:

- Debugging memory extraction requires comprehensive logging
- Browser logging essential for production error tracking
- Unified API reduces cognitive overhead
- Clickable stack traces improve developer experience

**Historical Context**: Initial implementation used console.log, but debugging Phase 2 memory extraction required structured logging with proper error tracking.

## Architectural Decisions

### Package-First Development

**Decision**: Create specialized packages before implementing features  
**Rationale**:

- Forces clear separation of concerns
- Enables parallel development
- Improves testability and reusability
- Aligns with Agent OS integration needs

**Implementation**:

- @studio/schema before memory features
- @studio/memory before extraction logic
- @studio/validation before UI implementation
- @studio/mcp before agent integration

### TypeScript Strict Mode Everywhere

**Decision**: Enable strict TypeScript across all packages  
**Rationale**:

- Catches errors at compile time
- Improves code documentation
- Essential for complex emotional intelligence types
- Reduces runtime validation needs

**Trade-offs**:

- Slower initial development
- Requires more upfront type design
- Can be verbose for simple operations

### Basecamp-Style Documentation

**Decision**: Adopt pitch/intent/design documentation pattern  
**Rationale**:

- Supports calm, async development
- Avoids micromanagement and ticket hell
- Provides context for future decisions
- Enables thoughtful feature development

**Historical Context**: Adopted after Phase 1 to improve planning clarity for Phase 2's complex emotional intelligence features.

## Product Decisions

### Emotional Intelligence Focus

**Decision**: Prioritize emotional context over raw information extraction  
**Rationale**:

- Differentiates from generic chat memory APIs
- Enables "wow, it knows me" moments
- Aligns with relationship-aware vision
- Creates defensible technical moat

**Trade-offs**:

- More complex extraction logic
- Requires sophisticated validation
- Higher computational costs
- Longer development timeline

### Quality Over Quantity (50-100 Memories)

**Decision**: Target small number of high-quality memories for MVP  
**Rationale**:

- Proves concept without scale complexity
- Reduces Claude API costs
- Enables manual quality verification
- Focuses on emotional significance

**Trade-offs**:

- Limited initial demonstration scope
- May not surface all relationship patterns
- Requires careful memory selection
- Could miss important edge cases

### Delta-Triggered Extraction Strategy

**Decision**: Focus on emotional state changes rather than all messages  
**Rationale**:

- Captures most meaningful moments
- Reduces processing overhead
- Aligns with how humans remember
- Improves extraction accuracy

**Implementation**: Mood repairs, positive spikes, sustained tenderness patterns

## Technical Pivots

### From Prisma Mocking to Integration Testing

**Decision**: Abandon Prisma client mocking for real database tests  
**Rationale**:

- Mocks provided false confidence
- Real database tests caught actual bugs
- Simplified test maintenance
- Improved test reliability

**Historical Context**: Discovered during Phase 2 that mocked tests passed while real operations failed.

### From Single Logger to Dual System

**Decision**: Split logger into Node.js and browser implementations  
**Rationale**:

- Browser constraints incompatible with Node.js features
- Different formatting needs per environment
- Unified API maintains developer experience
- Enables platform-specific optimizations

## Future Decision Points

### Database Migration Strategy

**When**: Before Phase 4 production deployment  
**Options**:

- PostgreSQL for full SQL features
- CockroachDB for global distribution
- Supabase for integrated auth/storage

### AI Provider Abstraction

**When**: Phase 5 platform expansion  
**Options**:

- Build provider-agnostic interface
- Optimize for Claude-specific features
- Support multiple providers simultaneously

### Privacy Architecture

**When**: Before multi-user support  
**Options**:

- Client-side encryption
- Zero-knowledge architecture
- Federated learning approach

## Lessons Learned

### What Worked Well

- Turborepo dramatically improved development velocity
- Basecamp-style docs reduced planning overhead
- Package-first approach enabled parallel work
- Early investment in logging paid dividends

### What We'd Do Differently

- Start with integration tests from day one
- Design emotional schema earlier in process
- Build validation UI prototype sooner
- Document decisions as they're made

### Key Insights

- Emotional intelligence requires different architecture than information retrieval
- Developer experience directly impacts feature quality
- Small, focused MVPs enable faster learning
- Good logging is essential for AI system debugging

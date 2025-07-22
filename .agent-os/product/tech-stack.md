# Technology Stack

## Core Technologies

### Frontend

- **Next.js 15** - React framework with App Router
- **React 19** - Latest React with concurrent features
- **TypeScript 5.6** - Type-safe development
- **Tailwind CSS v4** - Utility-first styling
- **Radix UI** - Accessible component primitives

### Backend & Data

- **Prisma ORM** - Type-safe database access
- **SQLite** - Lightweight database for MVP
- **SHA-256** - Content hashing for deduplication
- **Node.js 20** - JavaScript runtime

### Build & Development

- **Turborepo** - High-performance monorepo builds
- **pnpm** - Fast, disk-efficient package manager
- **Vitest** - Modern test runner
- **Storybook 8** - Component development
- **ESLint** - Code quality enforcement
- **Prettier** - Code formatting

### AI Integration

- **Claude API** - Anthropic's AI for memory extraction
- **MCP Protocol** - Model Context Protocol for agents
- **JSON Schema** - Structured AI responses

## Package Architecture

### Applications

```
apps/
├── studio/          # Next.js 15 main application
└── docs/            # Docusaurus documentation site
```

### Core Packages

```
packages/
├── db/              # Prisma schema and client
├── memory/          # Memory extraction with mood scoring
├── validation/      # Smart validation system
├── mcp/             # MCP foundation layer
└── schema/          # TypeScript type definitions
```

### Infrastructure Packages

```
packages/
├── logger/          # Dual logging (Node.js + browser)
├── ui/              # Shared React components
├── scripts/         # CLI utilities
├── mocks/           # MSW API mocking
├── test-config/     # Shared test configuration
└── shared/          # Common TypeScript configs
```

## Database Schema

### Core Tables

- **messages** - Raw message data with content hash
- **links** - Extracted URLs from messages
- **assets** - Message attachments and media
- **memories** - Extracted emotional memories (Phase 2)
- **emotional_context** - Mood and relationship data (Phase 2)

### Key Design Decisions

- Content-based deduplication via SHA-256
- Relational design for complex queries
- SQLite for MVP simplicity
- Prepared for PostgreSQL migration

## Development Tools

### Testing

- **Vitest** - Unit and integration tests
- **React Testing Library** - Component testing
- **Playwright** - E2E testing (Storybook)
- **MSW** - API mocking
- **Wallaby.js** - Live test feedback

### Code Quality

- **TypeScript** - Strict mode enabled
- **ESLint** - With Next.js config
- **Prettier** - Consistent formatting
- **Husky** - Git hooks
- **lint-staged** - Pre-commit checks

### CI/CD

- **GitHub Actions** - Automated workflows
- **Turbo Remote Cache** - Shared build cache
- **Semantic Release** - Automated versioning
- **Dependabot** - Dependency updates

## Architecture Patterns

### Monorepo Structure

- Shared dependencies via workspace protocol
- Cross-package hot reload
- Unified tooling configuration
- Intelligent build caching

### API Design

- RESTful endpoints for CRUD operations
- tRPC for type-safe API calls (planned)
- MCP protocol for AI agent communication
- Structured logging for debugging

### State Management

- React Server Components for initial state
- Client-side hooks for interactivity
- Prisma for database state
- Local storage for user preferences

## Performance Optimizations

### Build Performance

- Turborepo caching (100% cache hits)
- Parallel task execution
- Incremental TypeScript builds
- Optimized Docker layers

### Runtime Performance

- Next.js automatic code splitting
- React Server Components
- Edge runtime for API routes
- Efficient database queries

### Development Experience

- Fast refresh with hot reload
- TypeScript project references
- Shared configurations
- Comprehensive documentation

## Security Considerations

### Data Protection

- Content hashing for integrity
- Input validation throughout
- SQL injection prevention (Prisma)
- XSS protection (React)

### Future Enhancements

- Encryption at rest
- API authentication
- Rate limiting
- Audit logging

## Scalability Path

### Near-term (MVP)

- SQLite for simplicity
- Single Next.js instance
- Local file storage
- Basic caching

### Production (Phase 4)

- PostgreSQL database
- Redis caching layer
- CDN for static assets
- Horizontal scaling

### Enterprise (Phase 5)

- Multi-region deployment
- Event-driven architecture
- Microservices split
- Advanced monitoring

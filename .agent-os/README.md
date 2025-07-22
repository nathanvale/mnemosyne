# Agent OS - Mnemosyne Integration

This directory contains Agent OS configuration and documentation for the Mnemosyne project.

## Quick Start

Agent OS is now installed and configured for Mnemosyne. To use Agent OS for your next feature:

```bash
# Create a new feature specification
@~/.agent-os/instructions/create-spec.md

# Build a feature from specification
@~/.agent-os/instructions/build-feature.md

# Create comprehensive tests
@~/.agent-os/instructions/create-tests.md
```

## Project Overview

Mnemosyne is an emotional memory system that transforms message history into structured memories for AI agents. It's currently in Phase 2 of development, building advanced emotional intelligence extraction capabilities.

### Current Status

- **Phase 1**: ✅ Complete - Message import and infrastructure
- **Phase 2**: 🔄 50% Complete - Emotional memory extraction
- **Phase 3**: 📅 Planned - Claude AI integration

### Key Features

- Emotional intelligence extraction from conversations
- Mood scoring and delta-triggered memory creation
- Smart validation with confidence thresholds
- MCP protocol support for AI agent integration

## Documentation Structure

```
.agent-os/
├── product/
│   ├── overview.md      # Product vision and value proposition
│   ├── roadmap.md       # Detailed phase plan with progress
│   ├── tech-stack.md    # Technology choices and architecture
│   └── decisions.md     # Key technical and product decisions
└── README.md           # This file
```

## Using Agent OS with Mnemosyne

### Creating New Features

When creating new features, Agent OS will:

1. Reference the existing architecture and patterns
2. Follow the established TypeScript and package conventions
3. Integrate with the monorepo structure
4. Maintain consistency with the emotional intelligence focus

### Example Commands

```bash
# Create a new package
@~/.agent-os/instructions/create-spec.md "Create @studio/analytics package for memory usage tracking"

# Add a feature to existing package
@~/.agent-os/instructions/build-feature.md "Add bulk memory export to @studio/memory"

# Improve test coverage
@~/.agent-os/instructions/create-tests.md "Add integration tests for mood scoring algorithm"
```

## Development Workflow

1. **Specification First**: Use `create-spec.md` to define features clearly
2. **Build with Context**: Agent OS understands your codebase and patterns
3. **Test Thoroughly**: Leverage the existing test infrastructure
4. **Document in Basecamp Style**: Follow the pitch/intent/design pattern

## Key Integrations

- **Turborepo**: All builds use the monorepo task pipeline
- **TypeScript**: Strict mode with @studio/schema types
- **Testing**: Vitest with real database integration tests
- **Documentation**: Updates to both code and Docusaurus site

## Next Steps

1. Review the generated documentation in `.agent-os/product/`
2. Continue Phase 2 development with Agent OS assistance
3. Use Agent OS for the upcoming Phase 3 Claude integration
4. Refer to the [Agent OS documentation](https://github.com/buildermethods/agent-os) for advanced usage

---

_Agent OS configured for Mnemosyne - Transforming conversations into emotional intelligence for AI_ 🧠✨

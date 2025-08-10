# CLAUDE_DEVELOPMENT.md

> **Prompt Cache Directive**: This content is cacheable for development workflows
> Cache Control: `{"type": "ephemeral"}`

This file contains development patterns, import strategies, and coding best practices for the Mnemosyne monorepo. Referenced from main CLAUDE.md.

## Development Patterns

### Import Patterns

Use the modern ES modules import patterns throughout this monorepo:

```typescript
// ✅ ES Modules (used throughout this repo)
import { PrismaClient } from '@studio/db'
import { logger, createLogger } from '@studio/logger'
import { Button, LoggerDemo } from '@studio/ui'
import { importMessages } from '@studio/scripts'
import { server } from '@studio/mocks/server'

// ✅ Default imports
import defaultExport from '@studio/schema'

// ✅ Type-only imports (for TypeScript)
import type { User, Message } from '@studio/db'

// ✅ Dynamic imports (when needed)
const dynamicModule = await import('@studio/feature')

// ❌ CommonJS (DO NOT USE - will fail at runtime)
const { PrismaClient } = require('@studio/db')
const logger = require('@studio/logger')
```

### ES Modules Best Practices

- Always use `import`/`export` syntax
- Use `type` modifier for TypeScript type imports
- Prefer named imports over default imports for better tree-shaking
- Use dynamic imports (`await import()`) for code splitting
- Never mix ES modules with CommonJS `require()`

### Component Development

- Storybook-driven development with comprehensive stories
- MSW for API mocking during development (via @studio/mocks)
- Accessibility testing with Storybook a11y addon
- Components located in `packages/ui/`

### Data Processing

- Use content hashing for deduplication logic
- Implement batch processing with error handling
- URL extraction patterns for message analysis
- All utilities in `packages/scripts/`

### Error Handling

- Comprehensive error reporting in data processing scripts
- Structured logging for debugging and monitoring via @studio/logger
- Graceful handling of duplicate content during imports

## Following Conventions

When making changes to files, first understand the file's code conventions. Mimic code style, use existing libraries and utilities, and follow existing patterns.

- **NEVER assume** that a given library is available, even if it is well known. Whenever you write code that uses a library or framework, first check that this codebase already uses the given library. For example, you might look at neighboring files, or check the package.json (or cargo.toml, and so on depending on the language).
- **When you create a new component**, first look at existing components to see how they're written; then consider framework choice, naming conventions, typing, and other conventions.
- **When you edit a piece of code**, first look at the code's surrounding context (especially its imports) to understand the code's choice of frameworks and libraries. Then consider how to make the given change in a way that is most idiomatic.
- **Always follow security best practices**. Never introduce code that exposes or logs secrets and keys. Never commit secrets or keys to the repository.

## Code Style

- **IMPORTANT**: DO NOT ADD **_ANY_** COMMENTS unless asked

## Code References

When referencing specific functions or pieces of code include the pattern `file_path:line_number` to allow the user to easily navigate to the source code location.

Example:

```
Clients are marked as failed in the `connectToServer` function in src/services/process.ts:712.
```

## Key Development Guidelines

### ES Modules Architecture

**This is a pure ES modules monorepo** - all packages use `"type": "module"` with modern import/export syntax.

#### ES Modules Configuration

- **Root package.json**: `"type": "module"` enforces ES modules throughout the monorepo
- **All packages**: Every package.json contains `"type": "module"`
- **TypeScript target**: ES2022 with ESNext modules for optimal tree-shaking
- **Module resolution**: `"moduleResolution": "bundler"` strategy for compatibility
- **Import syntax**: Only `import`/`export` statements - no `require()` or `module.exports`
- **File extensions**: `.mjs` for config files, `.ts`/`.tsx` for source code
- **Exports field**: All packages use modern `"exports"` field instead of legacy `"main"`

#### Benefits of ES Modules

- **Tree-shaking**: Better dead code elimination and smaller bundles
- **Static analysis**: Tools can analyze dependencies at build time
- **Future-proof**: Aligns with modern JavaScript standards
- **Performance**: Faster loading with native browser support
- **Tooling**: Better IDE support and type checking

### Message Processing

- CSV message import with comprehensive error handling
- Content-based deduplication using SHA-256 hashing
- URL extraction from message text with link relationship management
- Batch processing with progress tracking and error reporting
- Located in `packages/scripts/` with CLI interface

## Development Workflow Best Practices

### Doing Tasks

When performing software engineering tasks:

1. **Use the TodoWrite tool** to plan the task if required
2. **Use search tools extensively** to understand the codebase and the user's query
3. **Implement the solution** using all tools available
4. **Verify the solution** if possible with tests. NEVER assume specific test framework or test script. Check the README or search codebase to determine the testing approach.
5. **VERY IMPORTANT**: When you have completed a task, you MUST run the lint and typecheck commands (eg. npm run lint, npm run typecheck, ruff, etc.) with Bash if they were provided to you to ensure your code is correct.
6. **NEVER commit changes unless the user explicitly asks you to**. It is VERY IMPORTANT to only commit when explicitly asked.

### Build Commands

- When a code change is ready, verify it passes the build
- Don't run long-lived processes like development servers or file watchers
- Don't run `npm run dev`
- If the build is slow or logs a lot, don't run it
- Echo copy/pasteable commands and ask the user to run it

### Code Quality Standards

#### Don't Write Forgiving Code

- Don't permit multiple input formats
  - In TypeScript, this means avoiding Union Type (the `|` in types)
- Use preconditions
  - Use schema libraries
  - Assert that inputs match expected formats
  - When expectations are violated, throw, don't log
- Don't add defensive try/catch blocks
  - Usually we let exceptions propagate out

#### Naming Conventions

- Don't use abbreviations or acronyms
  - Choose `number` instead of `num` and `greaterThan` instead of `gt`
- Emoji and unicode characters are welcome
  - Use them at the beginning of comments, commit messages, and in headers in docs
  - Use comments sparingly

#### Code Comments

- Don't comment out code - Remove it instead
- Don't add comments that describe the process of changing code
  - Comments should not include past tense verbs like added, removed, or changed
  - Example: `this.timeout(10_000); // Increase timeout for API calls`
  - This is bad because a reader doesn't know what the timeout was increased from, and doesn't care about the old behavior
- Don't add comments that emphasize different versions of the code, like "this code now handles"
- Do not use end-of-line comments
  - Place comments above the code they describe

#### File Management

- Prefer editing an existing file to creating a new one
- Never create documentation files (`*.md` or README)
  - Only create documentation files if explicitly requested by the user

### Conversation Guidelines

- If the user asks a question, only answer the question, do not edit code
- Never compliment the user
  - Criticize the user's ideas
  - Ask clarifying questions
- Don't say:
  - "You're right"
  - "I apologize"
  - "I'm sorry"
  - "Let me explain"
  - any other introduction or transition
- Immediately get to the point

## Git Workflow

### Commits

- 📦 Stage individually using `git add <file1> <file2> ...`
  - Only stage changes that you remember editing yourself
  - Avoid commands like `git add .` and `git add -A` and `git commit -am` which stage all changes
- Use single quotes around file names containing `$` characters
  - Example: `git add 'app/routes/_protected.foo.$bar.tsx'`
- 🐛 If the user's prompt was a compiler or linter error, create a `fixup!` commit message
- Otherwise:

#### Commit Messages Should:

- Start with a present-tense verb (Fix, Add, Implement, etc.)
- Not include adjectives that sound like praise (comprehensive, best practices, essential)
- Be concise (60-120 characters)
- Be a single line
- Sound like the title of the issue we resolved, and not include the implementation details we learned during implementation
- End with a period
- Describe the intent of the original prompt

#### Commit Messages Should NOT:

- Include a Claude attribution footer
  - Don't write: 🤖 Generated with [Claude Code](https://claude.ai/code)
  - Don't write: Co-Authored-By: Claude <noreply@anthropic.com>

#### Commit Process:

- Echo exactly this: Ready to commit: `git commit --message "<message>"`
- Confirm with the user, and then run the exact same command
- If pre-commit hooks fail, then there are now local changes
  - `git add` those changes and try again
  - Never use `git commit --no-verify`

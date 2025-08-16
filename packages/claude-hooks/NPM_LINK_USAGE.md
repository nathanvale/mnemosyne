# Using @studio/claude-hooks via npm/pnpm link

## Setup (Already Done)

The package has been globally linked using:

```bash
cd packages/claude-hooks
pnpm build
pnpm link --global
```

## Using in Another Project

### Option 1: Link the Global Package

In your other project, run:

```bash
# Using pnpm
pnpm link --global @studio/claude-hooks

# Or using npm
npm link @studio/claude-hooks
```

### Option 2: Direct File Reference

In your other project's `package.json`:

```json
{
  "dependencies": {
    "@studio/claude-hooks": "file:../path/to/mnemosyne/packages/claude-hooks"
  }
}
```

## Available CLI Commands

Once linked, these commands become available globally:

- `claude-hooks-stop` - Stop hook for task completion
- `claude-hooks-quality` - Quality check for code changes
- `claude-hooks-notification` - System notifications
- `claude-hooks-cache-stats` - TTS cache statistics
- `claude-hooks-cache-explorer` - Explore TTS cache
- `claude-hooks-list-voices` - List available TTS voices
- `claude-hooks-subagent` - Sub-agent stop hook

## Using in Code

```javascript
// ES Modules
import { createTTSProvider } from '@studio/claude-hooks/speech'
import { runQualityChecks } from '@studio/claude-hooks/quality-check'

// Use the APIs
const provider = await createTTSProvider({
  provider: 'openai',
  apiKey: process.env.OPENAI_API_KEY,
})
```

## Verifying the Link

Check if the package is linked:

```bash
# List global pnpm links
pnpm list --global --depth=0

# Should show:
# + @studio/claude-hooks 0.1.0 <- /path/to/mnemosyne/packages/claude-hooks
```

## Important Notes

1. **Build First**: Always run `pnpm build` in the claude-hooks directory before linking to ensure the dist files are up to date.

2. **ES Modules**: This package uses ES modules (`"type": "module"`), so importing projects need to support ES modules.

3. **Peer Dependencies**: The package expects `eslint`, `prettier`, and `typescript` to be available in the consuming project.

4. **Development Mode**: When NODE_ENV=development, the package will use TypeScript source files directly if the consuming project supports it.

## Updating the Linked Package

When you make changes to claude-hooks:

```bash
cd packages/claude-hooks
pnpm build
# The changes are automatically available in linked projects
```

## Unlinking

To remove the global link:

```bash
# In the claude-hooks directory
pnpm unlink --global

# In consuming projects
pnpm unlink @studio/claude-hooks
```

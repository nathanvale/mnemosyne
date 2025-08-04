# ⚛️ React App Quality Check Hook

This hook provides comprehensive code quality checks optimized for React applications, ensuring your code meets high standards before being committed or deployed.

## 🚀 Overview

The React App Quality Check Hook automatically validates your React/TypeScript code with:

- **TypeScript** compilation checks with intelligent config detection
- **ESLint** linting with React-specific rules and auto-fixing
- **Prettier** formatting with automatic corrections
- **Common issue detection** (console statements, `as any` usage, TODOs)
- **Test file suggestions** and reminders

## ✅ Installation

The hook is configured in `.claude/settings.local.json`:

```json
{
  "hooks": {
    "user-prompt-submit": {
      "command": "node .claude/hooks/react-app/quality-check.cjs",
      "enabled": true
    }
  }
}
```

## 🎯 Default Behavior

### What Gets Checked:

1. **TypeScript Compilation**
   - ✅ Type safety validation
   - ✅ Intelligent tsconfig.json selection
   - ✅ Clear error reporting with line numbers

2. **ESLint**
   - ✅ React-specific rules (`react-app` config)
   - ✅ Auto-fixes style issues
   - ❌ Blocks on code quality problems

3. **Prettier**
   - ✅ Auto-formats all code
   - ✅ Consistent code style
   - ✅ Silent fixing by default

4. **Code Issues**
   - ⚠️ Console statements (info level)
   - ⚠️ `as any` usage (warning level)
   - ❌ Debugger statements (error level)
   - ℹ️ TODO/FIXME comments (info level)

### Exit Codes:

- **0**: All checks passed ✅
- **1**: General error (missing dependencies, etc.)
- **2**: Quality issues found - MUST be fixed ❌

## 🔧 Configuration

### Quick Configuration via Environment Variables

```bash
# TypeScript Settings
export CLAUDE_HOOKS_TYPESCRIPT_ENABLED=true          # Enable/disable TypeScript checks
export CLAUDE_HOOKS_SHOW_DEPENDENCY_ERRORS=false     # Show errors in imported files

# ESLint Settings
export CLAUDE_HOOKS_ESLINT_ENABLED=true              # Enable/disable ESLint
export CLAUDE_HOOKS_ESLINT_AUTOFIX=true              # Auto-fix ESLint issues

# Prettier Settings
export CLAUDE_HOOKS_PRETTIER_ENABLED=true            # Enable/disable Prettier
export CLAUDE_HOOKS_PRETTIER_AUTOFIX=true            # Auto-fix formatting

# General Settings
export CLAUDE_HOOKS_AUTOFIX_SILENT=true              # Hide auto-fix details
export CLAUDE_HOOKS_DEBUG=false                      # Enable debug logging
```

### Advanced JSON Configuration

Edit `.claude/hooks/react-app/hook-config.json`:

#### Custom Rules

```json
{
  "rules": {
    "console": {
      "enabled": true,
      "severity": "error", // Change from "info" to "error" to block
      "message": "Remove all console statements!",
      "allowIn": {
        "paths": ["src/debug/", "scripts/"],
        "fileTypes": ["test", "spec"],
        "patterns": ["*.debug.*", "*.test.*"]
      }
    },
    "asAny": {
      "enabled": true,
      "severity": "error", // Change from "warning" to "error"
      "message": "Never use 'as any' - use proper types!"
    }
  }
}
```

#### File Type Detection

```json
{
  "fileTypes": {
    "component": {
      "patterns": ["*.jsx", "*.tsx"],
      "paths": ["components/", "src/components/", "app/"]
    },
    "hook": {
      "patterns": ["use*.js", "use*.ts", "use*.jsx", "use*.tsx"],
      "paths": ["hooks/", "src/hooks/"]
    }
  }
}
```

#### Ignore Patterns

```json
{
  "ignore": {
    "paths": [
      "node_modules/",
      "build/",
      "dist/",
      ".next/",
      "coverage/",
      "*.config.js",
      "*.config.ts"
    ]
  }
}
```

## 🏗️ How It Works

### 1. **Intelligent TypeScript Config Detection**

The hook maintains a cache of TypeScript configurations and intelligently maps files to the correct `tsconfig.json`:

- **Monorepo aware**: Finds configs across packages
- **Priority-based**: Uses most specific config first
- **Cache validated**: Updates when configs change
- **Pattern matching**: Maps files based on include/exclude patterns

### 2. **Parallel Execution**

All checks run simultaneously for maximum performance:

```
TypeScript ─┐
ESLint ─────┼─→ Results
Prettier ───┘
```

### 3. **Auto-Fix Strategy**

1. **Prettier runs first** - Handles all formatting
2. **ESLint runs second** - Fixes remaining style issues
3. **Only blocks on unfixable issues** - Manual intervention required

### 4. **Smart Filtering**

- Skips non-source files automatically
- Respects `.gitignore` patterns
- Handles deleted files gracefully
- Works from any directory in your project

## 📊 Common Scenarios

### Development Mode (Verbose)

```bash
export CLAUDE_HOOKS_AUTOFIX_SILENT=false
export CLAUDE_HOOKS_DEBUG=true
export CLAUDE_HOOKS_SHOW_DEPENDENCY_ERRORS=true
```

### CI/CD Mode (Strict)

```bash
export CLAUDE_HOOKS_ESLINT_AUTOFIX=false
export CLAUDE_HOOKS_PRETTIER_AUTOFIX=false
export CLAUDE_HOOKS_AUTOFIX_SILENT=true
```

### Quick Fix Mode (Auto-fix everything)

```bash
export CLAUDE_HOOKS_ESLINT_AUTOFIX=true
export CLAUDE_HOOKS_PRETTIER_AUTOFIX=true
export CLAUDE_HOOKS_AUTOFIX_SILENT=true
```

## 🎯 Rule Severity Levels

### `severity: "error"` (Blocking ❌)

- **Behavior**: Fails the hook, blocks progress
- **Use for**: Critical issues that must be fixed
- **Example**: `debugger` statements, critical linting errors

### `severity: "warning"` (Non-blocking ⚠️)

- **Behavior**: Shows warning but allows progress
- **Use for**: Code smells that should be addressed
- **Example**: `as any` usage (default)

### `severity: "info"` (Informational ℹ️)

- **Behavior**: Shows message, doesn't affect outcome
- **Use for**: Helpful reminders and suggestions
- **Example**: Console statements, TODO comments

## 🔍 Troubleshooting

### Hook Not Running?

1. **Check registration**: Verify in `.claude/settings.local.json`
2. **Test manually**:
   ```bash
   echo '{"tool_name":"Edit","tool_input":{"file_path":"test.tsx"}}' | \
   node .claude/hooks/react-app/quality-check.cjs
   ```

### TypeScript Errors in Dependencies?

```bash
# Enable to see all errors
export CLAUDE_HOOKS_SHOW_DEPENDENCY_ERRORS=true

# Disable to only see edited file errors (default)
export CLAUDE_HOOKS_SHOW_DEPENDENCY_ERRORS=false
```

### Auto-Fix Not Working?

1. **Check if enabled**:

   ```bash
   grep "autofix" .claude/hooks/react-app/hook-config.json
   ```

2. **Enable via environment**:
   ```bash
   export CLAUDE_HOOKS_ESLINT_AUTOFIX=true
   export CLAUDE_HOOKS_PRETTIER_AUTOFIX=true
   ```

### Custom ESLint Rules Not Applied?

The hook uses your project's ESLint configuration. Check:

- `.eslintrc.json` or `.eslintrc.js`
- `package.json` eslintConfig section
- ESLint extends configuration

## 🏆 Best Practices

### For Teams

1. **Commit the hook config**: Share standards across the team
2. **Use environment variables**: For personal preferences
3. **Start with warnings**: Gradually increase severity
4. **Document exceptions**: Use `allowIn` patterns wisely

### For Performance

1. **Use TypeScript project references**: Faster incremental builds
2. **Keep configs cached**: Hook maintains intelligent cache
3. **Exclude test files**: From production builds
4. **Limit dependency checking**: Default is off for speed

### For Adoption

1. **Start permissive**: Enable auto-fix, warnings only
2. **Gradually stricten**: Move warnings → errors over time
3. **Celebrate fixes**: Use sound notifications! 🎵
4. **Track progress**: Monitor code quality improvements

## 🚀 Advanced Features

### Multi-Config TypeScript Support

Automatically handles complex TypeScript setups:

- `tsconfig.json` - Base configuration
- `tsconfig.app.json` - Application code
- `tsconfig.test.json` - Test files
- `tsconfig.node.json` - Build scripts

### Turborepo/Monorepo Support

- ✅ Finds project root from any subdirectory
- ✅ Respects package-specific configurations
- ✅ Works with pnpm workspaces
- ✅ Handles cross-package imports

### Smart Caching

- 🚀 TypeScript config cache with checksums
- 🚀 Validates cache on config changes
- 🚀 Pattern-based file mapping
- 🚀 Sub-second performance

## 📝 Example Output

### Success ✅

```
⚛️  React App Quality Check v1.0.0 - Starting...
────────────────────────────────────────────

🔍 Validating: Button.tsx
────────────────────────────────────────────
[INFO] Running TypeScript compilation check...
[OK] TypeScript compilation passed
[INFO] Running ESLint...
[OK] ESLint passed
[INFO] Running Prettier check...
[OK] Prettier formatting correct
[INFO] Checking for common issues...
[OK] No common issues found

✅ Quality check passed for Button.tsx

👉 File quality verified. Continue with your task.
```

### With Issues ❌

```
⚛️  React App Quality Check v1.0.0 - Starting...
────────────────────────────────────────────

🔍 Validating: UserProfile.tsx
────────────────────────────────────────────
[INFO] Running TypeScript compilation check...
  ❌ UserProfile.tsx:23:5 - Property 'email' does not exist on type 'User'
[INFO] Running ESLint...
[WARN] ESLint issues found, attempting auto-fix...
  ❌ 'userName' is assigned a value but never used
[INFO] Running Prettier check...
[OK] Prettier auto-formatted the file!

═══ Auto-fixes Applied ═══
✨ Prettier auto-formatted the file

═══ Quality Check Summary ═══
❌ TypeScript errors in edited file
❌ ESLint found issues that couldn't be auto-fixed

Found 2 issue(s) that MUST be fixed!
════════════════════════════════════════════
❌ ALL ISSUES ARE BLOCKING ❌
════════════════════════════════════════════
Fix EVERYTHING above until all checks are ✅ GREEN

🛑 FAILED - Fix issues in your edited file! 🛑
```

## 🎉 Conclusion

The React App Quality Check Hook helps maintain consistent, high-quality code across your React projects. It's flexible enough for personal preferences while strict enough to catch real issues before they reach production.

Happy coding! ⚛️✨

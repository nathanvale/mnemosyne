# Agent File Persistence Best Practices Template

> **Template for agents working with CLI tools that support file output**
> Version: 1.0.0
> Based on: Node.js CLI best practices and Context7/Anthropic agent guidelines

## Core File Persistence Principles

When designing agents that work with CLI tools supporting file output:

### 1. Always Use --output Parameters

**For code-review tools:**

- `--output` or `--outfile` parameters should ALWAYS be used when file persistence is needed
- JSON data goes to stdout (for tool processing) + optionally to file (for persistence)
- Progress messages go to stderr (non-interfering)

```bash
# ✅ Correct - includes file persistence
pnpm --filter @studio/code-review review:analyze --pr 139 --repo owner/repo --output analysis-139.json

# ❌ Incorrect - no file persistence
pnpm --filter @studio/code-review review:analyze --pr 139 --repo owner/repo
```

### 2. File Naming Conventions

**Consistent naming patterns for audit trails:**

```bash
# Analysis files (stored in .logs/pr-reviews/ directory)
.logs/pr-reviews/analysis-{pr-number}.json
.logs/pr-reviews/analysis-{pr-number}-{timestamp}.json

# CodeRabbit files (stored in .logs/pr-reviews/ directory)
.logs/pr-reviews/coderabbit-{pr-number}.json
.logs/pr-reviews/coderabbit-{pr-number}-{timestamp}.json

# Reports (stored in .logs/pr-reviews/ directory)
.logs/pr-reviews/report-{pr-number}.md
.logs/pr-reviews/report-{pr-number}-github.md
```

### 3. Agent Responsibility Matrix

| Agent Type     | Primary Responsibility    | File Persistence Pattern                                        |
| -------------- | ------------------------- | --------------------------------------------------------------- |
| shell-agent    | Execute CLI commands      | Always add `--output .logs/pr-reviews/` for code-review tools   |
| git-agent      | Git operations            | Commit analysis files for audit trails                          |
| pr-reviewer    | PR analysis orchestration | Coordinate file persistence to `.logs/pr-reviews/` across tools |
| devops-manager | CI/CD monitoring          | Log status to files for debugging                               |

## Implementation Template for Agents

### Core Responsibilities Section

```markdown
## Core Responsibilities

When invoked, you will:

1. [Standard agent responsibilities...]
2. **For [tool-name] commands**: Always use `--output` parameter for file persistence when running analysis tools
3. [Additional responsibilities...]
```

### Operating Principles Section

```markdown
## Operating Principles

- [Standard principles...]
- **File Persistence**: Always use `--output` parameter with [tool-name] tools for reliable file logging
- [Additional principles...]
```

### Usage Examples Section

````markdown
### [Tool Name] Commands (with file persistence)

```bash
# Always use --output for file persistence when running [tool-name] tools
./[agent-name].sh "[tool-command] --[required-params] --output [file-pattern]"
```
````

**Important**: When executing [tool-name] commands, ALWAYS include `--output` or `--outfile` parameter to ensure results are persisted to files for later processing and reference.

````

### Key Features Section

```markdown
## Key Features

1. [Standard features...]
2. **File persistence support**: Automatically uses `--output` parameters for [tool-name] tools to ensure results are saved for later processing
3. [Additional features...]

## [Tool Name] Integration

When executing [tool-name] commands, this agent follows these file persistence patterns:

- **[Command type 1]**: Always append `--output [pattern]`
- **[Command type 2]**: Always append `--output [pattern]`
- **[Command type 3]**: Always append `--outfile [pattern]`

This ensures all [tool-name] results are persisted to files for downstream processing, debugging, and audit trails.
````

## Best Practices for Specific Tools

### Code Review Tools (@studio/code-review)

```bash
# Analysis with persistence (using .logs/pr-reviews/ directory)
pnpm --filter @studio/code-review review:analyze --pr {pr-number} --repo {owner/repo} --output .logs/pr-reviews/analysis-{pr-number}.json

# CodeRabbit fetching with persistence
pnpm --filter @studio/code-review review:fetch-coderabbit --pr {pr-number} --repo {owner/repo} --output .logs/pr-reviews/coderabbit-{pr-number}.json

# Report generation with persistence
pnpm --filter @studio/code-review review:report --analysis-file .logs/pr-reviews/analysis-{pr-number}.json --github-ready --outfile .logs/pr-reviews/report-{pr-number}.md
```

### Benefits of File Persistence

1. **Audit Trails**: All analysis results are preserved for compliance and debugging
2. **Downstream Processing**: Files can be processed by subsequent tools or agents
3. **Debugging**: Analysis artifacts available for troubleshooting
4. **Caching**: Avoid re-running expensive analysis operations
5. **Integration**: Tools like Claude Code can process both stdout JSON and persisted files

### Error Handling for File Persistence

```bash
# Check if output file was created successfully
if [ -f "$output_file" ]; then
    echo "✓ Analysis saved to $output_file"
else
    echo "⚠️  Warning: Output file not created, check command parameters"
fi
```

### Integration Patterns

**Multi-step workflows with file persistence:**

```bash
# Step 1: Fetch CodeRabbit data
fetch_output=$(shell-agent "pnpm review:fetch-coderabbit --pr 139 --repo owner/repo --output .logs/pr-reviews/coderabbit-139.json")

# Step 2: Run analysis with CodeRabbit data
analysis_output=$(shell-agent "pnpm review:analyze --pr 139 --repo owner/repo --coderabbit-file .logs/pr-reviews/coderabbit-139.json --output .logs/pr-reviews/analysis-139.json")

# Step 3: Generate report
report_output=$(shell-agent "pnpm review:report --analysis-file .logs/pr-reviews/analysis-139.json --github-ready --outfile .logs/pr-reviews/report-139.md")

# Step 4: Commit results for audit trail
git_output=$(git-agent "https://github.com/owner/repo" "analysis-results" "commit" "Add PR 139 analysis results")
```

## Testing File Persistence

### Validation Checklist

- [ ] Agent always adds `--output` parameter for applicable commands
- [ ] File naming follows consistent patterns
- [ ] Files are created in appropriate directories
- [ ] Error handling covers file creation failures
- [ ] Integration with downstream tools works correctly
- [ ] Audit trail is maintained through git commits

### Example Test Cases

```bash
# Test 1: Verify output file creation
result=$(agent-command --with-output)
assert file_exists "expected-output-file.json"

# Test 2: Verify stdout still works
result=$(agent-command --with-output)
assert json_valid "$result"

# Test 3: Verify error handling
result=$(agent-command --invalid-output-path)
assert exit_code_not_zero
```

---

**Usage**: Copy relevant sections of this template when creating or updating agents that work with CLI tools supporting file output. Customize the placeholders ([tool-name], [agent-name], etc.) for your specific agent.

# @studio/code-review

Automated code review tools for GitHub Pull Requests with CodeRabbit integration, security analysis, and comprehensive reporting.

## Overview

The `@studio/code-review` package provides a suite of CLI tools for analyzing GitHub Pull Requests. It integrates with CodeRabbit AI reviews, performs security analysis, and generates detailed reports to help maintain code quality and security standards.

## Features

- 🤖 **CodeRabbit Integration**: Fetches and parses both summary comments and line-by-line review feedback
- 🔒 **Security Analysis**: Detects potential security issues like API key exposure, hardcoded credentials
- 📊 **Comprehensive Metrics**: PR size analysis, test coverage checks, complexity assessment
- 📝 **Formatted Reports**: GitHub-ready markdown reports with actionable feedback
- 🎯 **Risk Assessment**: Automatic risk level calculation based on findings
- 💬 **Review Comment Parsing**: Extracts actionable feedback from CodeRabbit's emoji indicators

## Installation

This package is part of the mnemosyne monorepo. To use it:

```bash
# From the monorepo root
pnpm install

# Navigate to the package
cd packages/code-review
```

## CLI Tools

### 1. fetch-coderabbit

Fetches and parses CodeRabbit comments from a GitHub PR.

```bash
pnpm review:fetch-coderabbit --pr <number> --repo <owner/repo> [--output <file>]
```

**Options:**

- `--pr, --pr-number`: PR number to fetch comments from
- `--repo, --repository`: GitHub repository in format `owner/repo`
- `--output`: Output file path (defaults to stdout)
- `--help`: Show help message

**What it fetches:**

- **Issue Comments**: High-level summaries, walkthroughs, and file change descriptions
- **PR Review Comments**: Line-by-line feedback with specific issues and suggestions

**CodeRabbit Emoji Indicators:**

- 🛠️ **Refactor suggestion**: Medium severity, maintainability improvements
- ⚠️ **Potential issue**: High severity, bug risks
- 🔒 **Security concern**: Critical severity, security vulnerabilities
- ⚡ **Performance issue**: High severity, performance problems
- 📝 **Documentation**: Low severity, documentation improvements

### 2. analyze-pr

Performs comprehensive PR analysis including security checks and CodeRabbit findings integration.
Follows Node.js CLI best practices with optional file output.

```bash
pnpm review:analyze --pr <number> --repo <owner/repo> [--coderabbit-file <file>] [--output <file>]
```

**Options:**

- `--pr, --pr-number`: PR number to analyze
- `--repo, --repository`: GitHub repository in format `owner/repo`
- `--coderabbit-file`: Path to CodeRabbit findings JSON file
- `--include-diff`: Include full diff in analysis output
- `--output, --outfile`: Save analysis to specified file (optional)
- `--help`: Show help message

**Output Behavior:**

- Always outputs JSON to stdout for processing by tools like Claude Code
- Optionally saves to file when `--output` or `--outfile` is specified
- Progress messages go to stderr (non-interfering)
- JSON response includes `meta.outputFile` when file output is used

**Analysis includes:**

- PR size and complexity assessment
- Security pattern detection (API keys, hardcoded credentials, tokens)
- Test coverage analysis
- CodeRabbit findings integration
- Risk level calculation (low/medium/high/critical)

### 3. generate-report

Generates formatted reports from analysis data.

```bash
pnpm review:report --analysis-file <file> [--github-ready]
```

**Options:**

- `--analysis-file`: Path to analysis JSON file
- `--github-ready`: Format output for GitHub comments
- `--help`: Show help message

## Usage Examples

### Quick PR Review

Review a PR with a single command:

```bash
# Using the combined workflow
PR=138 REPO=nathanvale/mnemosyne pnpm review:pr
```

### Step-by-Step Review

```bash
# Step 1: Fetch CodeRabbit comments (with optional file output)
pnpm review:fetch-coderabbit --pr 138 --repo nathanvale/mnemosyne --output /tmp/coderabbit-138.json

# Step 2: Analyze the PR with CodeRabbit data (JSON to stdout + optional file)
pnpm review:analyze --pr 138 --repo nathanvale/mnemosyne --coderabbit-file /tmp/coderabbit-138.json --output /tmp/analysis-138.json

# Step 3: Generate a formatted report
pnpm review:report --analysis-file /tmp/analysis-138.json --github-ready

# Alternative: Just get JSON output without saving files
pnpm review:analyze --pr 138 --repo nathanvale/mnemosyne > analysis.json
```

### Direct Usage from Monorepo Root

```bash
# Run from anywhere in the monorepo
pnpm --filter @studio/code-review review:fetch-coderabbit --pr 137 --repo nathanvale/mnemosyne

# Or use the combined workflow
PR=137 REPO=nathanvale/mnemosyne pnpm --filter @studio/code-review review:pr
```

## Understanding CodeRabbit Integration

CodeRabbit provides two types of GitHub comments:

### 1. Issue Comments (Summaries)

- Posted to `/repos/{owner}/{repo}/issues/{pr}/comments`
- Contains high-level walkthrough and file change descriptions
- Includes review effort estimation and complexity scoring
- May include sequence diagrams for complex flows

### 2. PR Review Comments (Line-by-line Feedback)

- Posted to `/repos/{owner}/{repo}/pulls/{pr}/comments`
- Contains specific, actionable feedback on code lines
- Uses emoji indicators for issue categorization
- Includes file path and line number for precise location

### Example Output Structure

```json
{
  "prNumber": 138,
  "repository": "nathanvale/mnemosyne",
  "hasCodeRabbitReview": true,
  "issueComments": [...],  // Summary comments
  "reviewComments": [...], // Line-by-line feedback
  "findings": [
    {
      "id": "coderabbit-review-12345",
      "title": "Potential issue",
      "description": "The quote-fixing logic may incorrectly add quotes...",
      "severity": "high",
      "category": "bug_risk",
      "location": {
        "file": "packages/memory/src/llm/response-parser.ts",
        "startLine": 274
      }
    }
  ],
  "walkthrough": "This PR implements rate limiting...",
  "metadata": {
    "fileChanges": [...],
    "reviewEffort": { "score": 4, "complexity": "Complex" }
  }
}
```

## Workflow Integration

### With GitHub Actions

```yaml
name: PR Review
on:
  pull_request:
    types: [opened, synchronize]

jobs:
  review:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: pnpm/action-setup@v2
      - uses: actions/setup-node@v3

      - name: Install dependencies
        run: pnpm install

      - name: Run PR analysis
        run: |
          PR=${{ github.event.pull_request.number }}
          REPO=${{ github.repository }}
          pnpm --filter @studio/code-review review:pr
```

### With Claude Code

The CLI tools follow Node.js best practices and are optimized for Claude Code integration:

```bash
# Claude Code can run commands and get clean JSON from stdout
pnpm --filter @studio/code-review review:analyze --pr 139 --repo owner/repo

# With optional logging when persistence is needed
pnpm --filter @studio/code-review review:analyze --pr 139 --repo owner/repo --output analysis.json
```

**Claude Code Benefits:**

- Clean JSON output to stdout for parsing
- Progress messages to stderr (non-interfering)
- Optional file persistence with `--output` flag
- JSON response includes `meta.outputFile` when files are created

### With PR Reviewer Agent

The package is designed to work with the PR reviewer agent located at `.claude/agents/pr-reviewer.md`. The agent uses these tools to:

1. Fetch CodeRabbit automated feedback
2. Perform additional security and quality analysis
3. Synthesize findings into a comprehensive report
4. Provide expert-level code review recommendations

## Consolidated Output Format (v2.0)

As of version 2.0, the CLI outputs a single consolidated JSON structure that merges all analysis sources. This ensures compatibility with AI agents and automated workflows.

### ConsolidatedAnalysisOutput Structure

The consolidated output combines findings from multiple sources into a unified format:

```typescript
interface ConsolidatedAnalysisOutput {
  // Metadata
  analysis_id: string // Unique analysis identifier
  pr_number: number // PR number
  repository: string // Repository (owner/repo)
  timestamp: string // ISO 8601 timestamp
  analysis_version: string // Version of analysis format

  // Context
  github_context: {
    title: string // PR title
    description: string // PR description
    author: string // PR author username
    base_branch: string // Target branch
    head_branch: string // Source branch
    files_changed: number // Number of files changed
    additions: number // Lines added
    deletions: number // Lines removed
  }

  // All findings merged from different sources
  findings: {
    coderabbit: CodeRabbitFinding[] // CodeRabbit automated review findings
    security: SecurityFinding[] // Security analysis findings
    expert: ExpertFinding[] // Expert validation findings
    total_count: number // Total number of findings
    by_severity: {
      // Count by severity level
      critical: number
      high: number
      medium: number
      low: number
    }
  }

  // Metrics
  metrics: {
    code_quality_score: number // 0-100 quality score
    security_score: number // 0-100 security score
    test_coverage_delta: number // Change in test coverage
    complexity_score: number // Code complexity metric
    confidence_score: number // Overall confidence in analysis
  }

  // Decision and recommendations
  decision: 'approve' | 'request_changes' | 'comment' | 'security_block'
  risk_level: 'low' | 'medium' | 'high' | 'critical'
  blocking_issues: BlockingIssue[] // Issues that must be fixed
  recommendations: {
    immediate: string[] // Must fix before merge
    short_term: string[] // Should fix soon
    long_term: string[] // Consider for future
  }

  // Summary for human consumption
  summary: {
    overview: string // Executive summary
    key_findings: string[] // Top findings
    action_items: string[] // Required actions
  }
}
```

### Finding Structure

Each finding follows a consistent structure regardless of source:

```typescript
interface Finding {
  id: string // Unique finding ID
  source: 'coderabbit' | 'security' | 'expert' | 'github'
  title: string // Brief title
  description: string // Detailed description
  severity: 'critical' | 'high' | 'medium' | 'low' | 'info'
  category: string // Finding category
  confidence: 'very_high' | 'high' | 'medium' | 'low'
  location?: {
    // Code location if applicable
    file: string
    line?: number
    column?: number
  }
  remediation?: string // How to fix
  false_positive?: boolean // If likely false positive
  tags: string[] // Additional tags
  timestamp: string // When finding was created
}
```

### Output Behavior

- **Single JSON Output**: All findings are consolidated into one JSON structure
- **Stdout Only**: The consolidated JSON is output to stdout for easy parsing
- **Progress to Stderr**: All progress messages go to stderr to avoid interference
- **Structured Logging**: Detailed logs saved to `.logs/pr-reviews/` directory

### Example Usage

```bash
# Get consolidated analysis (outputs single JSON to stdout)
pnpm review:pr analyze --pr 141 --repo nathanvale/mnemosyne

# Save to file for later processing
pnpm review:pr analyze --pr 141 --repo nathanvale/mnemosyne > analysis.json

# Use with jq to extract specific data
pnpm review:pr analyze --pr 141 --repo nathanvale/mnemosyne | jq '.findings.by_severity'
```

## API Types

Key TypeScript interfaces are defined in `src/types/`:

- `ConsolidatedAnalysisOutput`: Complete consolidated analysis output
- `CodeRabbitFinding`: Individual finding from CodeRabbit
- `SecurityFinding`: Security analysis finding
- `ExpertFinding`: Expert validation finding
- `CodeRabbitAnalysis`: Complete analysis summary
- `PRAnalysis`: Comprehensive PR analysis result
- `CodeLocation`: File and line number information

## Structured Logging

The package uses `@studio/logger` for structured logging, providing better debugging and monitoring capabilities.

### Logging Configuration

Logs are automatically written to `.logs/pr-reviews/` with the following structure:

```
.logs/pr-reviews/
├── session-YYYYMMDD-HHMMSS.log     # Session logs with full details
├── analysis-<pr-number>.json       # Analysis output (when saved)
└── errors.log                       # Error-only log for troubleshooting
```

### Log Levels

- **error**: Critical errors that prevent analysis
- **warn**: Warnings about degraded functionality (e.g., CodeRabbit unavailable)
- **info**: General information about analysis progress
- **debug**: Detailed debugging information (enabled with `--verbose` flag)

### Environment Variables

```bash
# Set log level (default: info)
LOG_LEVEL=debug pnpm review:pr analyze --pr 141 --repo owner/repo

# Disable file logging (console only)
LOG_TO_FILE=false pnpm review:pr analyze --pr 141 --repo owner/repo

# Custom log directory
LOG_DIR=/custom/path pnpm review:pr analyze --pr 141 --repo owner/repo
```

### Debugging

To enable verbose logging for troubleshooting:

```bash
# Using --verbose flag
pnpm review:pr analyze --pr 141 --repo owner/repo --verbose

# Or set environment variable
DEBUG=* pnpm review:pr analyze --pr 141 --repo owner/repo
```

### Log Metadata

Each log entry includes contextual metadata:

- `pr_number`: PR being analyzed
- `repository`: Repository being analyzed
- `analysis_id`: Unique analysis session ID
- `source`: Component generating the log
- `timestamp`: ISO 8601 timestamp

## Development

### Test Fixtures

The package uses test fixtures for security testing to avoid having actual vulnerable code in the main source tree:

```
test-fixtures/
└── security-examples/
    └── example-vulnerable-code.ts  # Contains intentionally vulnerable patterns for testing
```

**Important Notes:**

- Test fixtures contain **intentionally vulnerable code** for testing purposes only
- These files are excluded from security scans and production builds
- Never copy patterns from test fixtures into production code
- All test fixture files include clear warning headers

### Running Tests

```bash
pnpm test
```

### Building

```bash
pnpm build
```

### Adding New Analysis Rules

1. Add pattern detection in `src/cli/analyze-pr.ts`
2. Update severity calculation logic
3. Add corresponding tests in `src/__tests__/`
4. If testing security patterns, use test fixtures in `test-fixtures/security-examples/`

## Troubleshooting

### "CodeRabbit comments not found"

- Ensure CodeRabbit is enabled for the repository
- Check that the PR has been open long enough for CodeRabbit to analyze
- Verify GitHub CLI (`gh`) is authenticated: `gh auth status`

### "API rate limit exceeded"

- The tools use GitHub API via `gh` CLI
- Check your rate limit: `gh api rate_limit`
- Consider using `--output` to cache results between steps
- Use stdout redirection if you don't need persistent files: `pnpm review:analyze ... > temp.json`

### "Command not found: tsx"

- Ensure dependencies are installed: `pnpm install`
- The package uses `tsx` for TypeScript execution

## Contributing

1. Follow the existing code patterns
2. Add tests for new functionality
3. Update this README for new features
4. Ensure all security patterns are properly documented

## License

Private - Part of the Mnemosyne monorepo

# Code Review Package Deployment Guide

> Version: 2.0.0  
> Last Updated: 2025-08-17  
> Critical: CLI and Agent must be deployed together

## Overview

This guide provides step-by-step instructions for deploying the consolidated JSON output changes to production. The v2.0 release introduces a **breaking change** to the output format that requires synchronized deployment of both the CLI tool and the PR reviewer agent.

## Breaking Changes in v2.0

### Output Format Change

**Before (v1.x)**: Multiple JSON outputs to stdout

```bash
# Old behavior - multiple JSON objects
{"github": {...}}
{"coderabbit": {...}}
{"security": {...}}  # This overwrote previous outputs
```

**After (v2.0)**: Single consolidated JSON output

```bash
# New behavior - single consolidated JSON
{
  "analysis_id": "...",
  "findings": {
    "coderabbit": [...],
    "security": [...],
    "expert": [...]
  },
  ...
}
```

### Impact

- **PR Reviewer Agent**: Must be updated to expect single JSON structure
- **CI/CD Pipelines**: May need updates if parsing multiple JSON objects
- **Monitoring**: Log format changes require dashboard updates

## Pre-Deployment Checklist

### 1. Version Tagging

Before deploying, tag the current version for potential rollback:

```bash
# Tag current production version
git tag -a v1.9.0-pre-consolidation -m "Last version before consolidated JSON output"
git push origin v1.9.0-pre-consolidation

# Tag new version
git tag -a v2.0.0 -m "Consolidated JSON output release"
git push origin v2.0.0
```

### 2. Environment Validation

Verify all required environment variables:

```bash
# Check GitHub access
gh auth status

# Verify environment variables
echo "GITHUB_TOKEN: ${GITHUB_TOKEN:+SET}"
echo "LOG_LEVEL: ${LOG_LEVEL:-info}"
echo "LOG_DIR: ${LOG_DIR:-.logs/pr-reviews}"
```

### 3. Test with Production Data

Test the new version with real PRs before deployment:

```bash
# Test with a recent PR
PR=141 REPO=nathanvale/mnemosyne pnpm review:pr analyze

# Verify output structure
PR=141 REPO=nathanvale/mnemosyne pnpm review:pr analyze | jq '.analysis_id, .findings.by_severity'

# Check for CodeRabbit findings
PR=141 REPO=nathanvale/mnemosyne pnpm review:pr analyze | jq '.findings.coderabbit | length'
```

## Deployment Steps

### Step 1: Build and Test

```bash
# From monorepo root
cd packages/code-review

# Install dependencies
pnpm install

# Run tests
pnpm test

# Build the package
pnpm build

# Run integration tests
pnpm test:integration
```

### Step 2: Deploy CLI Tool

Deploy the updated CLI tool to your environment:

```bash
# For npm package deployment
npm version 2.0.0
npm publish

# For direct deployment
rsync -avz --exclude node_modules ./packages/code-review/ production-server:/path/to/code-review/

# Or using Docker
docker build -t code-review:2.0.0 .
docker push your-registry/code-review:2.0.0
```

### Step 3: Update PR Reviewer Agent

**CRITICAL**: The agent must be updated simultaneously with the CLI.

1. Locate the agent configuration:

   ```bash
   .claude/agents/pr-reviewer.md
   ```

2. Verify the agent expects consolidated JSON:
   - Check Step 5 in the agent workflow
   - Ensure it processes single JSON output
   - No changes should be needed if using the updated agent

3. Deploy the agent:
   ```bash
   # Copy updated agent to production
   cp .claude/agents/pr-reviewer.md /production/agents/
   ```

### Step 4: Update CI/CD Pipeline

If your CI/CD pipeline parses the output:

```yaml
# GitHub Actions example
- name: Run PR Analysis
  id: analysis
  run: |
    OUTPUT=$(pnpm review:pr analyze --pr ${{ github.event.number }} --repo ${{ github.repository }})
    echo "analysis_output=$OUTPUT" >> $GITHUB_OUTPUT

- name: Parse Results
  run: |
    echo '${{ steps.analysis.outputs.analysis_output }}' | jq '.findings.by_severity'
```

### Step 5: Monitor Deployment

Monitor the first production runs:

```bash
# Watch logs in real-time
tail -f .logs/pr-reviews/session-*.log

# Check for errors
grep ERROR .logs/pr-reviews/errors.log

# Verify CodeRabbit findings are captured
cat .logs/pr-reviews/analysis-*.json | jq '.findings.coderabbit | length'
```

## Rollback Procedure

If issues occur, rollback to the previous version:

### Quick Rollback

```bash
# Revert to previous Git tag
git checkout v1.9.0-pre-consolidation

# Rebuild and deploy
pnpm build
# ... deploy steps

# Revert agent if needed
git checkout v1.9.0-pre-consolidation -- .claude/agents/pr-reviewer.md
```

### Docker Rollback

```bash
# If using Docker
docker pull your-registry/code-review:1.9.0
docker tag your-registry/code-review:1.9.0 your-registry/code-review:latest
docker push your-registry/code-review:latest

# Update deployment
kubectl set image deployment/code-review code-review=your-registry/code-review:1.9.0
```

## Post-Deployment Verification

### 1. Functional Testing

```bash
# Test with multiple PRs
for PR in 139 140 141; do
  echo "Testing PR $PR..."
  pnpm review:pr analyze --pr $PR --repo nathanvale/mnemosyne | jq '.analysis_id'
done
```

### 2. Verify All Finding Sources

```bash
# Check that all sources are present
pnpm review:pr analyze --pr 141 --repo nathanvale/mnemosyne | jq '
  {
    coderabbit: (.findings.coderabbit | length),
    security: (.findings.security | length),
    expert: (.findings.expert | length),
    total: .findings.total_count
  }
'
```

### 3. Performance Monitoring

```bash
# Measure analysis time
time pnpm review:pr analyze --pr 141 --repo nathanvale/mnemosyne > /dev/null

# Check memory usage
/usr/bin/time -v pnpm review:pr analyze --pr 141 --repo nathanvale/mnemosyne > /dev/null 2>&1 | grep "Maximum resident"
```

### 4. Log Analysis

```bash
# Check for any warnings or errors
grep -E "(WARN|ERROR)" .logs/pr-reviews/session-*.log | tail -20

# Verify structured logging
tail -n 100 .logs/pr-reviews/session-*.log | jq -r '.msg'
```

## Troubleshooting

### Issue: Agent Not Receiving Complete Data

**Symptom**: Agent only shows security findings, missing CodeRabbit
**Solution**:

1. Verify CLI outputs single JSON: `pnpm review:pr analyze --pr 141 --repo owner/repo | jq -e '.findings.coderabbit'`
2. Check agent is updated to v2.0
3. Ensure no intermediate scripts are filtering output

### Issue: JSON Parse Errors

**Symptom**: "Unexpected token" or "Invalid JSON" errors
**Solution**:

1. Check for progress messages in stdout: `pnpm review:pr analyze 2>/dev/null`
2. Verify single JSON output: `pnpm review:pr analyze | jq -e '.'`
3. Check logs for errors: `tail .logs/pr-reviews/errors.log`

### Issue: Missing Findings

**Symptom**: Some finding sources are empty
**Solution**:

1. Check CodeRabbit is enabled: `--no-coderabbit` flag not set
2. Verify GitHub diff available: Check PR has actual file changes
3. Review timeout settings: Security analysis may timeout after 30s

### Issue: Performance Degradation

**Symptom**: Analysis takes longer than before
**Solution**:

1. Check memory usage during analysis
2. Verify no infinite loops in consolidation
3. Consider increasing timeout for large PRs
4. Review log levels (debug logging impacts performance)

## Configuration Reference

### Environment Variables

| Variable             | Default            | Description                                  |
| -------------------- | ------------------ | -------------------------------------------- |
| `GITHUB_TOKEN`       | Required           | GitHub authentication token                  |
| `LOG_LEVEL`          | `info`             | Logging verbosity (error, warn, info, debug) |
| `LOG_DIR`            | `.logs/pr-reviews` | Directory for log files                      |
| `LOG_TO_FILE`        | `true`             | Enable file logging                          |
| `ANALYSIS_TIMEOUT`   | `60000`            | Analysis timeout in milliseconds             |
| `SECURITY_TIMEOUT`   | `30000`            | Security sub-agent timeout                   |
| `CODERABBIT_ENABLED` | `true`             | Enable CodeRabbit integration                |

### CLI Flags

| Flag                         | Description                             |
| ---------------------------- | --------------------------------------- |
| `--verbose`                  | Enable debug logging                    |
| `--no-coderabbit`            | Disable CodeRabbit fetching             |
| `--output <file>`            | Save analysis to file                   |
| `--confidence-threshold <n>` | Minimum confidence for findings (0-100) |
| `--format <type>`            | Output format (json, markdown, github)  |

## Support and Monitoring

### Health Checks

Create a monitoring script:

```bash
#!/bin/bash
# health-check.sh

# Test basic functionality
if pnpm review:pr analyze --pr 1 --repo owner/repo 2>/dev/null | jq -e '.analysis_id' > /dev/null; then
  echo "✅ Health check passed"
  exit 0
else
  echo "❌ Health check failed"
  exit 1
fi
```

### Metrics to Monitor

1. **Analysis Success Rate**: Percentage of PRs analyzed successfully
2. **Average Analysis Time**: Time from start to JSON output
3. **Finding Source Coverage**: Percentage with all sources present
4. **Error Rate**: Errors per 100 analyses
5. **API Rate Limit Usage**: GitHub API calls remaining

### Alert Thresholds

- Analysis time > 2 minutes
- Success rate < 95%
- Error rate > 5%
- Missing finding sources > 10%
- API rate limit < 1000 remaining

## Appendix

### Version History

| Version | Date       | Changes                                 |
| ------- | ---------- | --------------------------------------- |
| 1.0.0   | 2025-08-14 | Initial release                         |
| 1.9.0   | 2025-08-15 | Last version with multiple JSON outputs |
| 2.0.0   | 2025-08-17 | Consolidated JSON output                |

### Related Documentation

- [README.md](./README.md) - Package documentation
- [Technical Specification](../../.agent-os/specs/2025-08-16-code-review-production/sub-specs/technical-spec.md)
- [PR Reviewer Agent](../../.claude/agents/pr-reviewer.md)

### Contact

For issues or questions about deployment:

- Create an issue in the repository
- Check logs in `.logs/pr-reviews/` for debugging
- Review the troubleshooting section above

---

**Remember**: Always deploy CLI and agent together for v2.0!

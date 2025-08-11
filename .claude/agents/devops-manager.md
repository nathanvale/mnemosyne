---
name: devops-manager
description: Monitors GitHub PR check status using gh CLI until all checks complete
model: sonnet
color: red
---

# PR Status Monitor Agent - GitHub CLI Focus

## System Prompt

```markdown
---
name: devops-manager
description: Monitors GitHub PR check status using gh CLI until all checks complete
tools: Bash, Context
capabilities:
  - gh-cli-integration
  - check-status-tracking
  - retry-management
  - failure-analysis
memory_access: read-write
coordination_priority: high
---

You are the **devops-manager** agent specialized in tracking GitHub pull request checks using the `gh` CLI. Your role is to continuously monitor check status until completion and report the final outcome.

> **Note:** The `name` field above is critical for agent completion events and logging. Always keep it consistent and unique for reliable agent identification.

## Core Responsibilities

When invoked, you will:

1. Use `gh pr checks` to monitor PR status
2. Poll at 60-second intervals until completion
3. Detect and handle stuck or failed checks
4. Report final status with actionable next steps
5. Store check patterns in memory for learning

Always ensure accurate monitoring without excessive polling.

## Operating Principles

- **Simple Polling**: Check every 60 seconds, increase to 180s if stuck
- **Clear Status**: Pending → Running → Success/Failure
- **Max Patience**: 30 retries default (30 minutes)
- **Actionable Reports**: Specific failure details and fixes
- **CLI First**: Use gh commands exclusively
```

## User Prompt Template

```xml
<pr_context>
  <repository>{REPOSITORY}</repository>
  <pr_number>{PR_NUMBER}</pr_number>
  <max_retries>{MAX_RETRIES}</max_retries>
</pr_context>

Monitor PR #{PR_NUMBER} using `gh pr checks` until all checks complete.

## Execution Instructions

1. Verify PR exists and get initial status
2. Poll checks every 60 seconds
3. Continue until:
   - All checks pass → Report success
   - Any check fails → Report failure with details
   - Max retries reached → Report timeout
   - No change for 15 minutes → Report stuck
4. Provide status updates every 5 checks
```

## Agent Implementation

```bash
#!/bin/bash

# PR Status Monitor Implementation

monitor_pr_status() {
  local pr_number=$1
  local max_retries=${2:-30}
  local retry_count=0
  local stuck_counter=0
  local last_status=""
  local interval=60

  echo "🔧 Agent: devops-manager"
  echo "🚀 PR #${pr_number} Monitoring Started"
  echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

  # Initial status check
  initial_status=$(gh pr checks ${pr_number} 2>/dev/null)
  if [ $? -ne 0 ]; then
    echo "❌ Error: Cannot access PR #${pr_number}"
    echo "Verify: gh pr view ${pr_number}"
    return 1
  fi

  echo "📊 Initial Status:"
  echo "$initial_status" | head -10
  echo ""

  # Main monitoring loop
  while [ $retry_count -lt $max_retries ]; do
    retry_count=$((retry_count + 1))

    # Get current status
    current_status=$(gh pr checks ${pr_number} --json name,status,conclusion,startedAt,completedAt 2>/dev/null)

    # Parse status
    all_completed=$(echo "$current_status" | jq -r 'all(.[] | .status == "completed")')
    any_failed=$(echo "$current_status" | jq -r 'any(.[] | .conclusion == "failure")')
    any_running=$(echo "$current_status" | jq -r 'any(.[] | .status == "in_progress")')

    # Check for status change
    if [ "$current_status" = "$last_status" ]; then
      stuck_counter=$((stuck_counter + 1))
      if [ $stuck_counter -gt 15 ]; then
        report_stuck "$pr_number" "$current_status"
        return 3
      fi
      # Increase interval if stuck
      interval=180
    else
      stuck_counter=0
      interval=60
    fi

    # Handle completion states
    if [ "$all_completed" = "true" ]; then
      if [ "$any_failed" = "true" ]; then
        report_failure "$pr_number" "$current_status"
        return 1
      else
        report_success "$pr_number" "$current_status" "$retry_count"
        return 0
      fi
    fi

    # Status update every 5 checks
    if [ $((retry_count % 5)) -eq 0 ]; then
      report_progress "$pr_number" "$retry_count" "$max_retries" "$current_status"
    fi

    # Wait before next check
    sleep $interval
    last_status="$current_status"
  done

  # Timeout reached
  report_timeout "$pr_number" "$current_status"
  return 2
}

# Report success
report_success() {
  local pr=$1
  local status=$2
  local attempts=$3

  echo ""
  echo "✅ PR #${pr} Ready to Merge!"
  echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
  echo ""
  echo "All checks passed successfully."
  echo ""

  # Show check summary
  echo "📊 Check Summary:"
  gh pr checks ${pr} --interval 0 | grep "✓"

  echo ""
  echo "⏱️  Total Time: $((attempts * 60)) seconds"
  echo "🔄 Checks Run: $(echo "$status" | jq -r 'length')"
  echo ""
  echo "✨ Recommendation: Safe to merge"
}

# Report failure
report_failure() {
  local pr=$1
  local status=$2

  echo ""
  echo "❌ PR #${pr} Build Failed"
  echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
  echo ""

  # Get failed checks
  failed_checks=$(echo "$status" | jq -r '.[] | select(.conclusion == "failure") | .name')

  echo "Failed Checks:"
  for check in $failed_checks; do
    echo "  ❌ $check"

    # Get failure details from workflow logs if available
    echo ""
    echo "  📝 Failure Details:"

    # Try to get run ID and logs
    run_id=$(gh run list --limit 1 --json databaseId,name | jq -r --arg name "$check" '.[] | select(.name == $name) | .databaseId')

    if [ ! -z "$run_id" ]; then
      echo "  Run ID: $run_id"
      echo "  View logs: gh run view $run_id --log-failed"

      # Show last few lines of failed job
      echo ""
      echo "  Last log lines:"
      gh run view $run_id --log-failed 2>/dev/null | tail -20 | sed 's/^/    /'
    fi
    echo ""
  done

  echo "🔧 Next Steps:"
  echo "1. Review failed check logs: gh pr checks ${pr} --watch"
  echo "2. View PR details: gh pr view ${pr}"
  echo "3. Run checks locally if possible"
  echo "4. Push fixes and monitor new run"
}

# Report stuck
report_stuck() {
  local pr=$1
  local status=$2

  echo ""
  echo "🔒 PR #${pr} Build Stuck"
  echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
  echo ""
  echo "No progress for 15+ minutes"
  echo ""

  # Show stuck checks
  in_progress=$(echo "$status" | jq -r '.[] | select(.status == "in_progress") | .name')

  echo "Stuck Checks:"
  for check in $in_progress; do
    echo "  🔄 $check (frozen)"
  done

  echo ""
  echo "🛠️ Recommended Actions:"
  echo "1. Cancel and retry: gh pr comment ${pr} -b '/rerun'"
  echo "2. Close and reopen: gh pr close ${pr} && gh pr reopen ${pr}"
  echo "3. Force push: git commit --amend --no-edit && git push -f"
  echo "4. Check runner status: gh workflow list --all"
}

# Report timeout
report_timeout() {
  local pr=$1
  local status=$2

  echo ""
  echo "⏱️ PR #${pr} Monitoring Timeout"
  echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
  echo ""
  echo "Maximum wait time exceeded (30 minutes)"
  echo ""

  echo "Last Known Status:"
  gh pr checks ${pr} --interval 0

  echo ""
  echo "🔄 Continue monitoring: gh pr checks ${pr} --watch"
}

# Report progress
report_progress() {
  local pr=$1
  local current=$2
  local max=$3
  local status=$4

  echo ""
  echo "⏳ PR #${pr} Status Update [Attempt ${current}/${max}]"

  # Count check states
  total=$(echo "$status" | jq -r 'length')
  completed=$(echo "$status" | jq -r '[.[] | select(.status == "completed")] | length')
  running=$(echo "$status" | jq -r '[.[] | select(.status == "in_progress")] | length')
  pending=$(echo "$status" | jq -r '[.[] | select(.status == "pending" or .status == "queued")] | length')

  # Progress bar
  progress=$((completed * 100 / total))
  echo "Progress: [$(printf '%.0s█' $(seq 1 $((progress / 10))))$(printf '%.0s░' $(seq 1 $((10 - progress / 10))))] ${progress}%"

  echo "✅ Completed: ${completed}  🔄 Running: ${running}  ⏸️ Pending: ${pending}"
  echo ""
}

# Main execution
main() {
  # Parse arguments
  PR_NUMBER=${1:-$PR_NUMBER}
  MAX_RETRIES=${2:-30}

  if [ -z "$PR_NUMBER" ]; then
    echo "❌ Error: PR number required"
    echo "Usage: $0 <PR_NUMBER> [MAX_RETRIES]"
    exit 1
  fi

  # Ensure we're in the right repo
  current_repo=$(gh repo view --json nameWithOwner -q .nameWithOwner 2>/dev/null)
  if [ $? -ne 0 ]; then
    echo "❌ Error: Not in a GitHub repository"
    echo "Run: gh repo clone <owner/repo> && cd <repo>"
    exit 1
  fi

  echo "📍 Repository: ${current_repo}"

  # Start monitoring
  monitor_pr_status "$PR_NUMBER" "$MAX_RETRIES"
  exit_code=$?

  # Store result in memory (if using Claude Flow)
  if command -v mcp__claude-flow__memory_usage &> /dev/null; then
    mcp__claude-flow__memory_usage store "pr_status/${PR_NUMBER}" "{\"exitCode\": ${exit_code}, \"timestamp\": \"$(date -Iseconds)\"}"
  fi

  echo "🔧 Agent: devops-manager completed with exit code $exit_code"
  exit $exit_code
}

# Execute if run directly
if [ "${BASH_SOURCE[0]}" = "${0}" ]; then
  main "$@"
fi
```

## Usage Examples

### Direct CLI Usage

```bash
# Basic monitoring
./pr-status-monitor.sh 123

# With custom timeout (45 retries = 45 minutes)
./pr-status-monitor.sh 123 45

# Using gh directly
gh pr checks 123 --watch
```

### Integration with Claude Flow

```bash
# Spawn agent for PR monitoring
Task "Monitor PR #123" "Track build status until completion" "pr-status-monitor"

# In a swarm pattern
[BatchTool]:
  Task("Monitor PR", "gh pr checks 123", "pr-status-monitor")
  Task("Prepare merge", "Update changelog", "doc-writer")
```

### GitHub Actions Integration

```yaml
name: PR Status Monitor
on:
  pull_request:
    types: [opened, synchronize]

jobs:
  monitor:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3

      - name: Monitor PR Status
        env:
          GH_TOKEN: ${{ github.token }}
        run: |
          # Use the agent
          bash pr-status-monitor.sh ${{ github.event.pull_request.number }}
```

## Simplified Output Examples

### Success Output

```
🚀 PR #123 Monitoring Started
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📊 Initial Status:
⏳ Linting               pending
⏳ Unit Tests            pending
⏳ Integration Tests     pending
⏳ Security Scan         pending

⏳ PR #123 Status Update [Attempt 5/30]
Progress: [███████░░░] 70%
✅ Completed: 3  🔄 Running: 1  ⏸️ Pending: 0

✅ PR #123 Ready to Merge!
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

All checks passed successfully.

📊 Check Summary:
✓ Linting               45s
✓ Unit Tests            3m 22s
✓ Integration Tests     5m 18s
✓ Security Scan         2m 05s

⏱️ Total Time: 660 seconds
🔄 Checks Run: 4

✨ Recommendation: Safe to merge
```

### Failure Output

```
❌ PR #123 Build Failed
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Failed Checks:
  ❌ Unit Tests

  📝 Failure Details:
  Run ID: 5847293
  View logs: gh run view 5847293 --log-failed

  Last log lines:
    FAIL: test_authentication
    AssertionError: Expected 200, got 401
    File "test_auth.py", line 45

🔧 Next Steps:
1. Review failed check logs: gh pr checks 123 --watch
2. View PR details: gh pr view 123
3. Run checks locally if possible
4. Push fixes and monitor new run
```

## Key Features

1. **Pure `gh` CLI**: Uses only GitHub CLI commands
2. **Simple bash implementation**: Easy to understand and modify
3. **Minimal dependencies**: Just `gh`, `jq`, and bash
4. **Clear status reporting**: Structured, readable output
5. **Intelligent retry logic**: Adjusts intervals when stuck
6. **Actionable failures**: Provides specific commands to debug
7. **Integration ready**: Works standalone or with CI/CD
8. **Memory optional**: Can work with or without Claude Flow memory

This streamlined agent focuses exclusively on `gh` CLI commands for maximum portability and simplicity.

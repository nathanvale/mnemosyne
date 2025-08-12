---
description: Execute complete agentic feature delivery workflow from spec to merged PR
---

Execute a complete feature delivery workflow using all available sub-agents.

First, use the Task tool to delegate to the spec-reader sub-agent (use PROACTIVELY) to check if a spec document parameter was provided via $ARGUMENTS - if not, have it read `.agent-os/product/roadmap.md` to identify the next uncompleted Phase 1 task and locate its spec. The spec-reader MUST read all spec markdown files and check tasks.md for progress before selecting work.

Once spec is identified, delegate to the git-agent to checkout main and create the feature branch (deriving name from SPEC_FEATURE_BRANCH if needed).

Then use the task-executor sub-agent (MUST BE USED) to execute only the selected top-level task and its subtasks from tasks.md - it should mark tasks complete as it progresses.

After implementation, delegate to the shell-agent to run `pnpm format` followed by `pnpm check` for quality checks.

If there are linting or typescript errors fix them immediately. If there are
test errors attempt to fix them by first using the wallabyjs mcp server. If it
is unavailable or returning no errors use vitest to fix them and run `pnpm
format` followed by `pnpm check` again.

**DO NOT** stop this process if these quality checks are still failing. Repeat this process until all checks pass, then use the pr-creator sub-agent to create a pull
request using gh CLI with the feature branch.

Immediately delegate to the devops-manager sub-agent to monitor PR status with 60-second polling intervals.

If checks fail, delegate to the pr-fixer sub-agent to diagnose and apply automated fixes, then re-monitor.

When all checks are green, optionally use the pr-reviewer sub-agent for final code review.

Once approved, delegate to the pr-merger sub-agent to merge the PR.

Finally, use the git-agent to delete the feature branch and checkout main.

Spec parameter provided (if any): $ARGUMENTS

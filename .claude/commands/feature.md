---
description: Execute complete agentic feature delivery workflow from spec to merged PR
---

Execute a complete feature delivery workflow using all available sub-agents.

First, use the Task tool to delegate to the spec-reader sub-agent (use PROACTIVELY) to check if a spec document parameter was provided via $ARGUMENTS - if not, have it read `.agent-os/product/roadmap.md` to identify the next uncompleted Phase 1 task and locate its spec. The spec-reader MUST read all spec markdown files and check tasks.md for progress before selecting work.

Once spec is identified, delegate to the git-agent to checkout main and create the feature branch (deriving name from SPEC_FEATURE_BRANCH if needed).

Then use the task-executor sub-agent (MUST BE USED) to execute only the selected top-level task and its subtasks from tasks.md - it should mark tasks complete as it progresses.

After implementation, delegate to the shell-agent to run `pnpm format`, `pnpm lint`, and `pnpm test` for quality checks.

Once all checks pass, use the pr-creator sub-agent to create a pull request using gh CLI with the feature branch.

Immediately delegate to the devops-manager sub-agent to monitor PR status with 60-second polling intervals.

If checks fail, delegate to the pr-fixer sub-agent to diagnose and apply automated fixes, then re-monitor.

When all checks are green, optionally use the pr-reviewer sub-agent for final code review.

Once approved, delegate to the pr-merger sub-agent to merge the PR.

Finally, use the git-agent to delete the feature branch and checkout main.

Spec parameter provided (if any): $ARGUMENTS

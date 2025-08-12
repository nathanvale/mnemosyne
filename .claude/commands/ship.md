---
description: Ship next feature from roadmap or specified spec (alias for /feature)
---

Execute the agentic feature workflow: Use spec-reader (PROACTIVELY) to find spec from parameter ($ARGUMENTS) or next Phase 1 roadmap task. Delegate sequentially: git-agent for branch management, task-executor (MUST BE USED) for single task implementation, shell-agent for quality checks, pr-creator for PR, devops-manager for monitoring, pr-fixer if failures occur, pr-reviewer for validation, pr-merger when green, and git-agent for cleanup. Each sub-agent operates autonomously in its own context.

Input spec (if provided): $ARGUMENTS

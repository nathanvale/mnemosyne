---
test errors attempt to fix them by first using the wallabyjs mcp server. If it
is unavailable or returning no errors use vitest to fix them and run `pnpm
format` followed by `pnpm check` again.
---

## description: Execute complete agentic feature delivery workflow from spec to merged PR

Execute a complete feature delivery workflow using all available sub-agents:

1. **Spec Identification**

- Use the Task tool to delegate to the spec-reader sub-agent (proactively).
- If a spec document parameter is not provided via `$ARGUMENTS`, have it read `.agent-os/product/roadmap.md` to identify the next uncompleted Phase 1 task and locate its spec.
- The spec-reader MUST read all spec markdown files and check `tasks.md` for progress before selecting work.
- Report back to the user a brief summary of what you are working on.

2. **Branch Preparation**

- Once the spec is identified, delegate to the git-agent to checkout `main` and create the feature branch (deriving the name from `SPEC_FEATURE_BRANCH` if needed).

3. **Task Creator**
   Execute tasks as defined in the `tasks.md` file in the spec directory, update their progress, and provide clear status feedback to the user. You must act with full context from AgentOS product documentation and ensure that task status is always up-to-date.

> **Note:** The `name` field above is critical for agent completion events and logging. Always keep it consistent and unique for reliable agent identification.

```

## Core Responsibilities

When invoked, you will:

1. Receive the single selected top-level task (and its subtasks) from spec-reader. You must only operate on this task for each run—do not batch or process multiple tasks at once.
2. Read the `tasks.md` file in the spec directory to identify tasks and their status
3. Execute the specified task, using context from related Markdown spec files
4. Mark the task as completed by putting an 'x' inside the square brackets in `tasks.md`, or mark as not completed by removing the 'x'
5. Provide status feedback to the user after each operation
6. Output a summary of actions taken and next steps on each task and subtask completion

## Operating Principles

- **Task-Driven**: Only execute tasks defined in `tasks.md`
- **Progress Tracking**: Always update task status after execution
- **AgentOS Context**: Use product documentation and spec files for best practices
- **Clear Output**: Summarize actions and status for the user
- **Safety**: Never overwrite or duplicate work; confirm before marking as completed

4. **Quality Checks**

- After implementation, delegate to the shell-agent to run `pnpm format` followed by `pnpm check` for quality checks.
- If there are linting or TypeScript errors, report them to the user and fix them immediately.
- If there are test errors:
- First, attempt to fix them using the Wallaby.js MCP server.
- If Wallaby.js is unavailable or does not return errors, use Vitest to fix them.
- After each fix, delegate to the shell-agent again to run `pnpm format` followed by `pnpm check` for quality checks.
- **DO NOT** stop this process if these quality checks are still failing. Repeat this process until all checks pass.

5. **Pull Request Creation**

- Once all checks pass, use the pr-creator sub-agent to create a pull request using the gh CLI with the feature branch.

6. **PR Monitoring & Fixes**

- Immediately delegate to the devops-manager sub-agent to monitor PR status with 60-second polling intervals.
- If checks fail, delegate to the pr-fixer sub-agent to diagnose and apply automated fixes, then re-monitor.

7. **Review & Merge**

- When all checks are green, use the pr-reviewer sub-agent for final code review.
- Provide a report back to the user
- If there are major issues they *MUST* be fixed by the same steps as they were implement
- If there are minor issues found add them to a running list running as future enhancements in .agent-os/product/future-enhancements.
- Use the pr-merger sub-agent to squash and merge the PR.

8. **Cleanup**

- Use the git-agent to delete the feature branch and checkout `main`.

9. **The End**

**Celebrate your success!**

- Share a funny dad joke related to this pull requests:

> eg Why did the developer submit his PR at lunchtime? Because he wanted a byte to eat!

- Present a clickable link to the PR:
  [View your PR on GitHub](https://github.com/nathanvale/mnemosyne/pulls)

- End with a cheerful message:

> eg 🎉 All done! Ready to ship again. High five!

---

Spec parameter provided (if any): `$ARGUMENTS`
```

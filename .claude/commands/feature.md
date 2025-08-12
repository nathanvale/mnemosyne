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

3. **Task Execution**

- Use the task-executor sub-agent (must be used) to execute only the selected top-level task and its subtasks from `tasks.md`. It should mark tasks complete as it progresses.

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

- When all checks are green, optionally use the pr-reviewer sub-agent for final code review.
- Once approved, delegate to the task-executor sub-agent; it should mark _ALL_ tasks as completed and then commit the `tasks.md` to the PR.
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

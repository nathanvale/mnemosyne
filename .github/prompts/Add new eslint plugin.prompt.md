---
mode: agent
---

You are an expert in ESLint 9 and Flat Config. I’m using `eslint.config.js` in a Next.js 15.3.4 project with `"eslint^9.30.0"`, `"eslint-config-next^5.3.4"`, and `"eslint-plugin-storybook^^9.0.14"` already configured.

I want to add a new ESLint plugin. Your job is to modify or extend my `eslint.config.mjs` file correctly to include it, following these rules:

1. Use Flat Config syntax (object-based, not `.eslintrc`).
2. If the plugin provides rules, activate the recommended or preferred config where relevant.
3. If the plugin targets specific files (e.g. test files, stories), use a `files` override.
4. Ensure the plugin is added to the `plugins` array.
5. Do not break the existing config — extend it cleanly.
6. Use descriptive object keys and extract shared rules if useful.

Example plugins I might add:

- `eslint-plugin-testing-library` (for `**/*.test.{ts,tsx}`)
- `eslint-plugin-jsx-a11y` (for all React components)
- `eslint-plugin-unicorn`
- `eslint-plugin-eslint-comments`

Your response should include:

- The exact `import` statement needed
- The Flat Config object to add
- File globs (if relevant)
- Any optional notes about plugin compatibility or best practice

Do not reprint my whole config. Only show the additions I need to make.

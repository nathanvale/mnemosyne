---
applyTo: '**/*.stories.{ts,tsx}'
---

# 🧭 General Standards

- Use `Meta` and `StoryFn` from `@storybook/react`.
- Default export must include `title`, `component`, and `tags: ['autodocs']`.
- Use **named exports** for stories (`Default`, `WithError`, `Prefilled`, etc.).
- Each story should represent a distinct visual or behavioral state of the component.
- Do not import renderer package "@storybook/react" directly. Use the framework package instead "@storybook/nextjs-vite"

# 🧪 Interaction Testing with `play()`

- Use `play()` to simulate meaningful user interaction flows.
- Import testing tools from `storybook/test`:

  ```ts
  import { expect, userEvent, waitFor, within } from 'storybook/test'
  ```

- Follow this interaction pattern for buttons or async states:

  ```ts
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    const button = canvas.getByRole('button', { name: /load user/i })
    await userEvent.click(button)

    // Wait for the loading state
    await waitFor(() => {
      expect(button).toBeDisabled()
    })

    // Confirm visual/ARIA loading cues
    expect(button).toHaveTextContent(/loading.../i)
    await expect(button).toHaveAttribute('aria-busy', 'true')
  }
  ```

- Use semantic queries (`getByRole`, `getByLabelText`, `getByText`) for interaction and assertions.
- Prefer testing realistic behaviors (e.g. clicking, submitting, typing) instead of visual changes only.

# 🧱 Component Rendering Guidelines

- Keep `render` blocks clean — no unnecessary wrappers or mock components unless required.
- Provide realistic `args` (e.g. `"Melanie"` instead of `"Some name"`).
- For form components, wrap in `FormProvider` if needed — otherwise, assume standalone rendering.

# 🧰 MSW Integration

- Use MSW for mocking async requests (prefer shared handlers from `mocks/handlers`).
- Happy-path handlers are registered globally in `.storybook/preview.ts`.
- Override or extend them per-story using `parameters.msw.handlers` when needed.
- Use MSW to simulate:
  - Loading states
  - API errors
  - Empty results
  - Delays with `await delay()` imported from `import { delay } from "msw";`

# 🎨 Styling & Layout

- Use Tailwind utility classes only as needed to demonstrate layout (`p-4`, `w-full`, `max-w-md`, etc.).
- Do not include unrelated visual wrappers — Storybook should isolate the component's behavior.

# 🗂️ Naming & Structure

- Use descriptive names like `WithError`, `LoadingState`, `Prefilled`, etc.
- Organize stories by domain using `/` in titles (e.g. `Forms/UserForm/TextInput`).
- Title format should follow: `Group/Subgroup/ComponentName`.

# ⚙️ Misc

- Do not export default functions for stories — always use named exports.
- Avoid magic values or lorem ipsum; keep story props realistic and semantically meaningful.
- Keep stories concise, focused, and easy to test or reuse.

# 🧠 Preferences Recap

- Use `play()` to test core interactions and loading states
- Use `expect` + `userEvent` + `waitFor` from `storybook/test`
- MSW for async mocking
- Tailwind only as needed
- One visual state per story

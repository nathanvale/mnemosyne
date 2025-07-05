---
mode: agent
---

Annotate the following TypeScript code with complete, **TSDoc-compliant comments** and smart inline `//` comments.

**Replace** any existing comments with clearer, more maintainable alternatives. Also annotate **test files**.

---

### ✅ TSDoc Comments

Use `/** */` blocks with proper tags:

- `@param`, `@returns`, `@throws`
- `@example` for public functions or reusable utilities
- `@remarks` for implementation details or tricky logic
- `@internal` to mark symbols not meant for public consumption

Apply to:

- All **exported** functions, classes, constants, and types
- Significant internal helpers or utilities
- Custom types/interfaces in test files

---

### 💬 Inline Comments

Add concise `//` comments to explain:

- Complex logic (e.g. regex parsing, batching, stream control)
- Performance decisions or side-effect handling
- Test setup/teardown patterns
- Workarounds, edge cases, or intentionally non-obvious code

---

### 🧹 Rules

- Overwrite all existing comments with improved versions
- Use a professional but concise tone
- Ensure everything is compatible with **TypeDoc**
- Avoid over-commenting trivial lines

```ts
// Paste TypeScript or test code below
```

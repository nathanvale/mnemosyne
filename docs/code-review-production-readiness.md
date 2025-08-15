# Production Readiness Review — @studio/code-review

Date: 2025-08-14  
Scope: packages/code-review (pure ESM, Vitest + Wallaby, Turbo, Node ≥ 18.17)

Executive summary: Strong foundation and clear CLI surface. Prioritize hardening untrusted inputs, safe process execution, enforced output persistence, and strict schema validation. Ship a minimal, clean publish footprint. Action items are grouped by severity.

## P0 — Must fix before publish

- Untrusted input validation (CodeRabbit & GitHub)
  - Add strict Zod schemas for parsed payloads in `src/parsers/coderabbit-parser.ts` and `src/parsers/github-parser.ts`
  - Cap array sizes (e.g., findings ≤ 5k), enforce required fields, reject unknown keys
  - Bound JSON input size (streaming parse or explicit byte caps if reading files)

- Shell execution safety and determinism
  - Replace generic exec with argument-based execution (no shell), timeouts, and controlled signals in `src/utils/async-exec.ts`
  - Capture stdout/stderr consistently and support cancellation; add unit tests with fake timers

- Output persistence guarantees (orchestrator contract)
  - Enforce `--output` defaulting to `.logs/pr-reviews/analysis-<pr>.json` across all CLI entrypoints:
    - `src/cli/analyze-pr.ts`, `src/cli/review-pr-complete.ts`, `src/cli/unified-analysis.ts`, `src/cli/fetch-coderabbit.ts`
  - Sanitize and normalize output paths, create dirs, write atomically (tmp + rename), and set `meta.outputFile` in output JSON

- Secrets/PII logging hygiene
  - Centralize logger in `src/utils/log-manager.ts` with redaction (tokens, Bearer headers, apiKey patterns)
  - Replace all `console.*` with the redacted logger; prohibit dumping raw HTTP payloads

- Publish footprint and fixture leakage
  - Lock down `package.json` `files`/`exports` to ship only `dist/`, `README.md`, `package.json`
  - Ensure `coverage/`, `test-fixtures/`, `test-coderabbit.json` never publish
  - Verify types are emitted and `type: module` is consistent

## P1 — High priority

- Duplicate/legacy logger
  - Consolidate `src/log-manager.js` and `src/utils/log-manager.ts` into a single typed utility; remove the JS file if redundant

- CLI input validation and friendly errors
  - Validate PR number, `owner/repo` format, and preflight GitHub auth in `src/validators/env-validator.ts` and CLIs
  - Map common failures to actionable messages (suggest `gh auth login`, network checks)

- Rate limiting and retry strategy
  - Add exponential backoff with jitter in `src/cli/fetch-github-data.ts`
  - Detect secondary rate limits (403 + abuse headers) and pause; prefer conditional requests (ETag) when feasible

- Deterministic timestamps and ordering
  - Inject a clock interface instead of `Date.now()` in analyzers and reports for reproducible tests
  - Sort findings deterministically before output

- Config hardening
  - Centralize severity/confidence thresholds in `src/config/severity-thresholds.ts`
  - Validate CLI overrides via Zod; clamp to safe ranges

## P2 — Medium priority

- UX: progress and verbosity
  - Improve `src/utils/progress-indicator.ts` with quiet/verbose flags and JSON-only mode for CI

- Trend and metrics stability
  - Make `src/reporting/trend-analyzer.ts` resilient to missing/corrupt history files

- Docs alignment
  - Update `packages/code-review/README.md` to mirror `.claude/agents/pr-reviewer.md`:
    - Always persist with `--output` into `.logs/pr-reviews/`
    - Include `meta.outputFile` in saved JSON

## Security considerations

- Only allow HTTPS for remote fetches; block `file://`, `data:`, and non-HTTP(S) schemes
- Path traversal guard on user-provided output paths
- Cap total finding counts and de-duplicate similar findings before persisting
- Do not log request headers or tokens; redact any detected secrets

## Suggested patches (high level)

- Safe process execution (`src/utils/async-exec.ts`)
  - Use `execa` with `{ shell: false, timeout, killSignal }`
  - Return structured `{ stdout, stderr, exitCode, timedOut }`
  - Unit tests for timeouts, non-zero exits, and signal handling

- Output path + atomic writes (new utils)
  - `resolveOutputPath()` to sanitize and constrain within project root
  - `writeJsonAtomic(plan, data)` to write `*.tmp` then `rename()`
  - Use in all CLI entrypoints; set `meta.outputFile` and ISO `generatedAt`

- Strict Zod parsing (parsers)
  - Zod schemas for CodeRabbit and GitHub payloads
  - `safeParse` with precise error messages; cap array sizes; reject unknown keys

- Redacted logging (utils)
  - Default redactions: GitHub tokens, Bearer tokens, apiKey patterns
  - Replace all `console.*` usage across analyzers and CLI

- Package publish hardening (`package.json`)
  - `"exports": { ".": "./dist/index.js" }`, `"types": "./dist/index.d.ts"`, `"files": ["dist/", "README.md", "package.json"]`
  - `"sideEffects": false`, `"engines": { "node": ">=18.17" }`

## Test plan (Wallaby-first + Vitest)

- Prefer Wallaby.js for fast feedback; then run in terminal for CI parity
- Unit
  - Output writer: atomicity, permissions, and path sanitization
  - Parser schemas: valid/invalid fixtures; size caps; unknown-key rejection
  - Exec wrapper: timeout, signal, non-zero exit handling (fake timers)
  - Logger redaction: tokens/headers masked; no accidental leaks
- Integration
  - CLI E2E with temp workspace: enforce default `--output`, persists `meta.outputFile`, stable sort
  - Rate-limit handling with mocked GitHub responses (429/403 abuse headers)
- CI
  - Use V8 coverage; thresholds ≥ 70% branches
  - Emit `./test-results/junit.xml` and `./test-results/coverage/` when `TF_BUILD` is set

## Actionable next steps

1. Implement P0 patches (exec, output persistence, schemas, redaction)
2. Replace direct `console.*` use and remove legacy `src/log-manager.js` if unused
3. Add tests (Wallaby) and run:
   - `pnpm --filter @studio/code-review test`
   - `pnpm --filter @studio/code-review build`
4. Smoke E2E:
   - `pnpm --filter @studio/code-review review:analyze --pr <n> --repo owner/repo --output .logs/pr-reviews/analysis-<n>.json`
   - Confirm `meta.outputFile` and deterministic ordering
5. Verify publish:
   - `pnpm pack --filter @studio/code-review` and inspect tarball contents

## Notes

- A prior sub-agent output indicated low risk with low confidence; this review adds manual hardening items critical for production usage.
- Keep behavior aligned with `.claude/agents/pr-reviewer.md`: always persist outputs and surface concise, actionable summaries.

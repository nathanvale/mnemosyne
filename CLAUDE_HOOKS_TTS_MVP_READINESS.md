# @studio/claude-hooks TTS MVP Readiness Report

Date: 2025-08-10

## Executive Summary

Core architecture (provider abstraction, factory with auto + fallback, retry logic, normalization, caching, tests) is solid and near MVP. Largest blockers for production polish are (a) environment variable/name inconsistencies that silently disable features, (b) audio cache configuration not actually applied, (c) cache file extension mismatch for non‑MP3 formats, and (d) doc/env divergence that will confuse users. Addressing these will align behavior with stated docs and reduce support friction.

---

## High Severity (Must Fix Before Release)

1. **ElevenLabs env var mismatch**
   - `.env.example` uses: `CLAUDE_HOOKS_ELEVENLABS_TTS_VOICE` / `CLAUDE_HOOKS_ELEVENLABS_TTS_MODEL`
   - `env-config.ts` expects: `CLAUDE_HOOKS_ELEVENLABS_VOICE_ID` / `CLAUDE_HOOKS_ELEVENLABS_MODEL_ID`
   - Result: `voiceId` & `modelId` never populate via env → provider returns "voiceId is required".
   - **Fix**: Accept both sets (add dual mapping) or rename in `.env.example` & README consistently.

2. **Audio cache configuration not wired**
   - Env mappings write to `audioCache.maxSizeMB / maxAgeDays / maxEntries`.
   - `AudioCache` expects `maxSizeBytes / maxAgeMs / maxEntries`. No translation layer; providers instantiate `new AudioCache()` with defaults → user env vars have no effect.
   - **Fix**: Introduce resolver mapping loaded config to `AudioCache` constructor. Pass into providers instead of bare default.

3. **Cache file extension hardcoded to `.mp3`**
   - `audio-cache.ts` always names file `${key}.mp3`. For formats opus / wav / pcm / ulaw this is wrong; playback temp files use correct extension but cache storage mislabels.
   - **Fix**: Store metadata.format; derive extension map; keep backward compatibility (attempt legacy `.mp3`).

4. **Missing `cached: true` flag in `SpeakResult`**
   - Cached hits not differentiated; API shape contains `cached?: boolean`.
   - **Fix**: Set `cached: true` on cache hit.

5. **ElevenLabs `voiceId` silently empty**
   - Constructor sets `voiceId: config.voiceId || ''` then fails at speak time.
   - **Fix**: Early validation (throw or log with debug). If provider selected & missing `voiceId`, fail fast.

---

## Medium Severity

1. **Duration heuristic inaccurate**
   - `duration = buffer.length / 1000` (bytes ≠ ms).
   - **Fix**: Omit, or parse container header for approximate duration, or rename to `approxBytes`.

2. **Terminology inconsistency (speed vs rate)**
   - macOS uses words-per-minute `rate`; others use multiplier `speed`.
   - **Fix**: Clarify in docs with a table.

3. **Retry backoff lacks jitter**
   - Deterministic schedule may herd.
   - **Fix**: Add ±20% jitter.

4. **ElevenLabs `enableLogging` default = true (privacy)**
   - Could surprise users; docs should mention retention implications.
   - **Fix**: Default false or add explicit privacy note.

5. **Cache hit rate is lifetime-only**
   - No time window.
   - **Fix** (optional): Sliding window or periodic reset.

6. **Missing integration tests for env → provider mapping**
   - Particularly ElevenLabs alias variables and audio cache config.

---

## Low Severity (Polish)

1. Truncation lengths differ (OpenAI 4096, ElevenLabs 8000) without shared constant.
2. ElevenLabs PCM mapped to `.wav` extension logically but doc not explicit.
3. macOS provider uses `console.error` for routine info (should be debug‑gated).
4. No dependency injection for shared `AudioCache` (harder to override).
5. Missing CLI to list ElevenLabs voices (`getVoices`).
6. Provide explicit CHANGELOG entries for config/env aliasing changes.
7. Provider auto-detection order not documented (ElevenLabs → OpenAI → macOS).

---

## Documentation Gaps vs Implementation

| Area                  | Current State                               | Gap                                | Action                             |
| --------------------- | ------------------------------------------- | ---------------------------------- | ---------------------------------- |
| ElevenLabs env vars   | `.env.example` uses `_TTS_VOICE/_TTS_MODEL` | Code expects `_VOICE_ID/_MODEL_ID` | Add aliases or rename consistently |
| Audio cache config    | Env vars documented                         | Not applied by providers           | Wire config into constructors      |
| Cached flag           | Implied by docs                             | Not surfaced                       | Set `cached: true` on hits         |
| Duration meaning      | Exposed as duration                         | Not a duration                     | Remove or clarify approximation    |
| enableLogging default | True by default                             | Privacy note missing               | Document or change default         |
| Provider auto order   | Not stated                                  | Hard-coded logic                   | Add docs section                   |
| Rate vs speed         | Mixed terms                                 | Can confuse                        | Add Terminology note               |

---

## Suggested Remediation Patch (Phase 1)

**Goals**: Resolve High severity + most impactful Medium items.

1. `env-config.ts`
   - Add alias mappings:
     - `CLAUDE_HOOKS_ELEVENLABS_TTS_VOICE` → `tts.elevenlabs.voiceId`
     - `CLAUDE_HOOKS_ELEVENLABS_TTS_MODEL` → `tts.elevenlabs.modelId`
2. Introduce helper: `createAudioCacheFromConfig(audioCacheCfg)` performing key remaps:
   - `maxSizeMB` → `maxSizeBytes` (already converted by parser)
   - `maxAgeDays` → `maxAgeMs` (already converted)
   - Pass through `maxEntries`, `enabled`, `cacheDir?`, `normalization?`.
3. Allow TTS providers to accept optional cache instance:
   - Update constructors: `constructor(config: ProviderConfig = {}, deps?: { cache?: AudioCache })`
4. Wire global config loader (where hooks build TTS provider) to pass configured cache.
5. `audio-cache.ts`:
   - In `set`: choose extension based on `metadata.format` (map mp3/opus -> same; pcm*/ulaw*/alaw\* -> `.wav`).
   - Store real extension in JSON entry (add `ext`).
   - In `get`: read `ext` if present else fallback to `.mp3`.
6. Providers (OpenAI/ElevenLabs):
   - When cache hit: `createSuccessResult({ cached: true })` (omit bogus duration).
   - Mark `duration` only for freshly generated audio (still approximate or remove).
7. Add jitter to retry delay: `delay *= (1 + (Math.random()*0.4 - 0.2))`.
8. Fail fast (or debug warn) if provider selected but missing _required_ fields (`voiceId` for ElevenLabs, `apiKey` for cloud providers) before attempting speak.
9. README updates:
   - Env var alias note (deprecate old names).
   - Provider selection order.
   - Clarify speed vs rate.
   - Audio cache config example showing effect.
   - Cached flag semantics.
   - Duration clarification.

---

## Test Additions

| Test                      | Purpose                                          |
| ------------------------- | ------------------------------------------------ |
| env elevenlabs alias      | Ensure alias env vars populate `voiceId/modelId` |
| cache extension non-mp3   | Ensure opus/pcm store proper extension           |
| provider cached flag      | Cache hit sets `cached: true`                    |
| audio cache config wiring | Setting max entries = 1 evicts previous          |
| jitter presence           | Retry delay varies within acceptable bounds      |

---

## Risk & Mitigation

| Change                         | Risk                                | Mitigation                                                         |
| ------------------------------ | ----------------------------------- | ------------------------------------------------------------------ |
| New env aliases                | Hidden precedence issues            | Document; keep both for one release; log deprecation for old names |
| File extension change          | Legacy entries orphaned             | Backward read fallback to `.mp3` if no `ext` in JSON               |
| Cache injection                | Constructor signature change        | Make second param optional object                                  |
| Removing duration on cache hit | Breaking consumers expecting number | Semver note; keep field undefined vs removed; doc update           |

---

## Proposed Phased Timeline

| Phase | Scope                                                       | Est. Effort |
| ----- | ----------------------------------------------------------- | ----------- |
| 1     | High severity remediation + docs                            | 0.5–1 day   |
| 2     | Medium (jitter, duration accuracy, privacy default) + tests | 0.5 day     |
| 3     | Low polish (CLI voices, injection refactor, metrics)        | 0.5–1 day   |

---

## Quick Win Patch (Minimal)

1. Add env var aliases.
2. Implement extension mapping + cached flag.
3. Wire audio cache config (basic mapping).
4. README note for env mismatch + provider order.

---

## Open Questions

1. Should `enableLogging` default flip to false for privacy?
2. Is approximate duration needed by any downstream consumer? (If yes, implement better estimation)
3. Should we expose a unified `speak` facade returning standardized timing metrics (e.g., bytes, approximateDurationMs, cacheHit)?

---

## MVP Readiness Verdict

**Not Ready** until High severity actions are applied. After Phase 1, package is MVP-ready; remaining Medium items are enhancements.

---

## Summary of Actions

- Resolve env var mismatches & extend mapping.
- Apply cache config & extension correctness.
- Surface cache hits & correct/clarify duration semantics.
- Improve ElevenLabs validation & doc alignment.

---

## Appendix: Extension Mapping Recommendation

| Format Prefix     | Stored Format Example | Recommended Extension          |
| ----------------- | --------------------- | ------------------------------ |
| mp3\_\*           | mp3_44100_128         | .mp3                           |
| opus\_\*          | opus_48000_128        | .opus                          |
| pcm\_\*           | pcm_16000             | .wav (wrapper header optional) |
| ulaw*\* / alaw*\* | ulaw_8000             | .wav                           |

---

Last updated: 2025-08-10

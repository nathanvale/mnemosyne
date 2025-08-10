# Spec Requirements Document

> Spec: TTS MVP Readiness Fixes
> Created: 2025-08-10
> Status: In Progress

## Overview

Fix critical bugs and configuration issues in the @studio/claude-hooks TTS implementation to make it production-ready. This addresses high-severity issues identified in the TTS MVP Readiness Report that prevent proper functionality.

## User Stories

### Production User Configuration Story

As a developer using claude-hooks, I want to configure TTS providers through environment variables as documented, so that my configuration actually takes effect without silent failures.

Currently, users following the documentation will encounter:

- ElevenLabs voiceId and modelId never populate from .env.example variables
- Audio cache configuration is ignored despite being set
- Cached audio files are mislabeled with wrong extensions
- No indication when audio is served from cache vs API

### DevOps Integration Story

As a DevOps engineer, I want clear and consistent environment variable naming with proper validation, so that missing required configuration fails fast with descriptive errors rather than failing silently at runtime.

The system should validate configuration at startup and provide clear error messages when required settings are missing.

## Spec Scope

1. **Environment Variable Alignment** - Fix mismatches between documented and expected environment variable names
2. **Audio Cache Configuration** - Wire up cache configuration so user settings actually apply
3. **Cache File Extension** - Store audio files with correct extensions based on format
4. **Cache Hit Identification** - Surface when audio is served from cache vs fresh generation
5. **Provider Validation** - Add early validation for required configuration with clear error messages

## Out of Scope

- Adding new TTS providers
- Changing the fundamental architecture
- Performance optimizations beyond fixing broken features
- Adding new configuration options

## Expected Deliverable

1. Environment variables work exactly as documented in .env.example and README
2. Audio cache respects user-configured limits and settings
3. Different audio formats save with their correct file extensions
4. API responses indicate whether audio was cached
5. Missing required configuration fails immediately with helpful error messages

## Spec Documentation

- Tasks: @specs/2025-08-10-tts-mvp-readiness/tasks.md
- Technical Specification: @specs/2025-08-10-tts-mvp-readiness/sub-specs/technical-spec.md
- Tests Specification: @specs/2025-08-10-tts-mvp-readiness/sub-specs/tests.md

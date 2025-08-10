# Spec Tasks

These are the tasks to be completed for the spec detailed in @specs/2025-08-10-tts-mvp-readiness/spec.md

> Created: 2025-08-10
> Status: Ready for Implementation

## Tasks

- [x] 1. Fix Environment Variable Mismatches
  - [x] 1.1 Write tests for ElevenLabs env variable aliases
  - [x] 1.2 Add dual mapping support in env-config.ts
  - [x] 1.3 Update .env.example with clear documentation
  - [x] 1.4 Verify all tests pass

- [ ] 2. Wire Audio Cache Configuration
  - [ ] 2.1 Write tests for cache configuration mapping
  - [ ] 2.2 Create createAudioCacheFromConfig helper function
  - [ ] 2.3 Update provider constructors to accept cache instance
  - [ ] 2.4 Wire cache through provider factory
  - [ ] 2.5 Verify all tests pass

- [ ] 3. Fix Cache File Extension Handling
  - [ ] 3.1 Write tests for format-to-extension mapping
  - [ ] 3.2 Implement getAudioExtension function
  - [ ] 3.3 Update cache set/get operations for extensions
  - [ ] 3.4 Add backward compatibility for .mp3 files
  - [ ] 3.5 Verify all tests pass

- [ ] 4. Add Cache Hit Identification
  - [ ] 4.1 Write tests for cached flag in results
  - [ ] 4.2 Update OpenAI provider to set cached flag
  - [ ] 4.3 Update ElevenLabs provider to set cached flag
  - [ ] 4.4 Remove inaccurate duration for cached results
  - [ ] 4.5 Verify all tests pass

- [ ] 5. Add Provider Validation
  - [ ] 5.1 Write tests for validation errors
  - [ ] 5.2 Add ElevenLabs voiceId validation
  - [ ] 5.3 Add descriptive error messages
  - [ ] 5.4 Add debug logging for config issues
  - [ ] 5.5 Verify all tests pass

- [ ] 6. Update Documentation
  - [ ] 6.1 Update README with env variable clarifications
  - [ ] 6.2 Document provider selection order
  - [ ] 6.3 Add speed vs rate terminology section
  - [ ] 6.4 Add CHANGELOG entries
  - [ ] 6.5 Verify documentation accuracy

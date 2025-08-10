# Changelog

All notable changes to @studio/claude-hooks will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Changed

- **Audio Cache**: Extended default TTL from 7 days to 30 days to align with monthly TTS provider subscription cycles
- **Environment Variables**: Updated `CLAUDE_HOOKS_AUDIO_CACHE_MAX_AGE_DAYS` default from 7 to 30 days
- **Documentation**: Updated README examples to reflect 30-day cache duration

## [0.1.0] - 2025-01-10

### Added

#### Core Features

- **Stop Hook**: Task completion notifications with TTS support
- **Notification Hook**: User attention notifications with sound and speech
- **Quality Check Hook**: TypeScript, ESLint, and Prettier code quality checks
- **Subagent Stop Hook**: Tracking and notifications for Claude subagents

#### Text-to-Speech Integration

- **OpenAI TTS**: High-quality voice synthesis with 6 voice options
- **ElevenLabs TTS**: Premium ultra-realistic voice synthesis
- **macOS Speech**: Native macOS speech synthesis support
- **Fallback Providers**: Automatic fallback to alternative TTS providers
- **Provider Auto-Detection**: Intelligent selection of best available TTS provider

#### Audio Caching System

- **Intelligent Caching**: File-based audio cache to reduce API calls
- **LRU Eviction**: Automatic cleanup of old cache entries
- **Text Normalization**: Smart text processing for better cache hits
- **Cache Management CLI**: Tools for viewing stats and managing cache
- **Configurable Limits**: Control cache size, age, and entry count

#### Configuration System

- **Environment Variables**: Comprehensive env var support for all settings
- **JSON Configuration**: Structured config files in `.claude/hooks/`
- **Configuration Precedence**: Clear override hierarchy (env → JSON → CLI)
- **Monorepo Support**: Automatic detection of monorepo root and .env files
- **Test Mode**: Safe .env.example loading in test environments

#### Developer Experience

- **TypeScript**: Full type safety with comprehensive types
- **ES Modules**: Pure ESM package with modern JavaScript
- **NPM Package**: Standalone installation with global/local support
- **Bin Commands**: CLI tools for all hooks and utilities
- **Debug Logging**: Comprehensive debug output with CLAUDE_HOOKS_DEBUG

#### Smart Features

- **Quiet Hours**: Time-based notification filtering
- **Cooldown Periods**: Prevent notification spam
- **Priority Overrides**: Urgent notifications bypass restrictions
- **Cross-Platform Audio**: Support for macOS, Windows, and Linux
- **Event Logging**: JSON-based logging with rotation

### Configuration

- Environment variable mappings for all TTS providers
- Cache control via environment variables
- Debug flag gating for verbose logging
- Provider-specific configuration options

### Documentation

- Comprehensive README with examples and configuration
- Audio cache documentation and CLI usage
- Migration guides for TTS providers
- Environment variable reference

### Security

- API key management through environment variables
- No hardcoded secrets or credentials
- Safe placeholder substitution with warnings

### Performance

- Audio caching reduces API calls by up to 90%
- Lazy initialization prevents startup delays
- Rate limiting for API protection
- Exponential backoff for retry logic

### Compatibility

- Node.js 18+ required
- Works with Claude Code hooks system
- Compatible with Turborepo monorepos
- Cross-platform support (macOS, Windows, Linux)

### Known Issues

- Audio cache eviction uses write-time, not true LRU
- Duration estimates for audio are approximations
- Windows audio playback may require PowerShell

### Future Enhancements

- Additional TTS provider integrations
- Advanced cache analytics
- WebSocket support for real-time notifications
- Custom voice training support

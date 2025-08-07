#!/usr/bin/env bash

# ⚠️  DEPRECATED: This test hook is deprecated as of 2025-08-07
# The universal hook scripts have been replaced with the @studio/claude-hooks npm package.
# 
# Migration: Replace this with:
#   npm install -g @studio/claude-hooks
#   Then use "claude-hooks-stop" in your .claude/settings.local.json
#
# See the migration guide: packages/claude-hooks/README.md#migration-from-universal-hooks

# Test hook to verify Claude Code is calling hooks
echo "[TEST HOOK] Stop hook called at $(date)" >> /tmp/claude-hook-test.log
echo "[TEST HOOK] Event received: $(cat)" >> /tmp/claude-hook-test.log
echo "[DEPRECATION WARNING] This test hook is deprecated. Use @studio/claude-hooks npm package instead." >> /tmp/claude-hook-test.log

# Universal hook was removed - use npm package instead
echo "[ERROR] universal-stop-hook.sh was removed. Please install @studio/claude-hooks and use 'claude-hooks-stop' command."
# Claude Hooks Enhancement — Sequence Diagram and Summary

## Summary

Extend @studio/claude-hooks with cross-platform audio, three core hooks (Notification, Stop, SubagentStop), event logging, speech, and CLI flags. Hooks parse Claude Code events from stdin, play sounds or speech, and log JSON events with rotation and quiet-hours/cooldown controls.

## Mermaid Sequence Diagram

```mermaid
sequenceDiagram
  autonumber
  participant Claude as Claude Code
  participant Hook as Hook CLI (notification|stop|subagent-stop)
  participant Audio as AudioEngine (macOS/Windows/Linux)
  participant Speech as SpeechEngine (macOS say)
  participant Log as EventLogger
  participant Cfg as Config Loader

  Claude->>Hook: emit event via stdin (JSON) + flags (--notify/--chat/--speak)
  Hook->>Cfg: load config (env, files)
  Cfg-->>Hook: settings (quiet hours, cooldown, paths)
  alt needs sound
    Hook->>Audio: play(system sound or custom)
    Audio-->>Hook: success/fallback chain
  end
  opt --speak enabled (macOS)
    Hook->>Speech: say(text)
    Speech-->>Hook: done
  end
  Hook->>Log: write event JSON (with rotation)
  Log-->>Hook: ack
  Hook-->>Claude: exit code (0/!=0)
```

## Notes

- Audio fallback: macOS afplay → Windows PowerShell → Linux aplay/paplay/play.
- Flags: --notify, --chat, --speak; respects quiet hours and cooldown.
- Logs: structured JSON, rotating files, per-event type.

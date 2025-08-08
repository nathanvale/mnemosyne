# OpenAI TTS Integration — Sequence Diagram and Summary

## Summary

Introduce provider-based TTS with OpenAI as premium voice and macOS say as fallback. Auto-fallback, caching for common phrases, and simple config with env-based credentials.

## Mermaid Sequence Diagram

```mermaid
sequenceDiagram
  autonumber
  participant Hook as Hook (Stop/Notify)
  participant Factory as TTSProviderFactory
  participant OpenAI as OpenAIProvider
  participant Mac as MacSayProvider
  participant Cache as AudioCache
  participant Log as Logger

  Hook->>Factory: getProvider(config)
  Factory-->>Hook: provider (OpenAI or Mac)
  Hook->>Cache: get(key)
  alt Cache hit
    Cache-->>Hook: audio path
    Hook-->>Player: play(audio)
  else Cache miss
    Hook->>OpenAI: synthesize(text, voice)
    alt OpenAI OK
      OpenAI-->>Hook: audio
    else OpenAI error/unavailable
      Hook->>Mac: say(text)
      Mac-->>Hook: audio
    end
    Hook->>Cache: put(key, audio)
    Hook-->>Player: play(audio)
  end
  Hook->>Log: usage + fallback events
```

## Notes

- Supports 6 OpenAI voices and quality tiers.
- Retries and rate limiting; transparent fallback to macOS say.
- Cache with TTL and LRU to control cost.

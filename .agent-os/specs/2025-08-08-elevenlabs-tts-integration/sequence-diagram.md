# ElevenLabs TTS Integration — Sequence Diagram and Summary

## Summary

Add ElevenLabs provider to TTS stack with streaming, multi-language voices, formats, and automatic fallback to OpenAI/macOS.

## Mermaid Sequence Diagram

```mermaid
sequenceDiagram
  autonumber
  participant Hook as Hook
  participant Factory as ProviderFactory
  participant EL as ElevenLabsProvider
  participant OpenAI as OpenAIProvider
  participant Mac as MacSayProvider
  participant Cache as AudioCache

  Hook->>Factory: getProvider(config)
  Factory-->>Hook: EL if apiKey else next
  Hook->>Cache: get(key)
  alt hit
    Cache-->>Hook: audio
  else miss
    Hook->>EL: synthesize(text, opts)
    alt EL ok
      EL-->>Hook: audio/stream
    else EL fail
      Hook->>OpenAI: synthesize(text)
      alt OpenAI fail
        Hook->>Mac: say(text)
        Mac-->>Hook: audio
      else
        OpenAI-->>Hook: audio
      end
    end
    Hook->>Cache: put(key,audio)
  end
  Hook-->>Player: play(audio)
```

## Notes

- Supports formats: mp3, opus, pcm, aac, flac, u-law, a-law.
- Streaming via chunked responses; retries + backoff.

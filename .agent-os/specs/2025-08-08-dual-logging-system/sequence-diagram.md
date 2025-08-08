# Dual Logging System — Sequence Diagram and Summary

## Summary

Unified logger for Node and browser with env-aware presets, structured logs, remote batching with retries, redaction, and third-party hooks.

## Mermaid Sequence Diagram

```mermaid
sequenceDiagram
  autonumber
  participant App as Application Code
  participant Logger as Unified Logger API
  participant Node as Node Backend (Pino)
  participant Web as Browser Backend (RemoteBatch)
  participant Remote as Log Endpoint
  participant Svc as Third-party (Sentry/DD/LogRocket)

  App->>Logger: logger.info(ctx,tags,msg)
  alt Node.js
    Logger->>Node: write(JSON)
  else Browser
    Logger->>Web: enqueue(entry)
    Web->>Remote: POST batch (interval/size)
    alt 5xx/timeout
      Web->>Remote: retry w/ backoff
    end
  end
  Logger->>Svc: optional hooks/errors
```

## Notes

- Pretty dev output; structured prod.
- Zod-validated payloads; redaction of sensitive fields.

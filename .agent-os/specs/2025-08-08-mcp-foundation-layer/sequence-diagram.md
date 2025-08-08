# MCP Foundation Layer — Sequence Diagram and Summary

## Summary

Foundation APIs produce agent-ready context: mood tokens, relational timelines, and vocabulary. Extensible toward MCP servers, with TRPC/HTTP endpoints and caching.

## Mermaid Sequence Diagram

```mermaid
sequenceDiagram
  autonumber
  participant Agent as AI Agent
  participant API as Agent Context API (TRPC)
  participant Mood as MoodContextTokenizer
  participant Time as RelationalTimeline
  participant Vocab as EmotionalVocabulary
  participant Cache as Cache (mem/db)
  participant DB as Persistence

  Agent->>API: GET /agent-context/{participantId}
  API->>Cache: get(contextKey)
  alt hit
    Cache-->>API: context
  else miss
    API->>Mood: tokens(participant, goal)
    API->>Time: buildTimeline(participant)
    API->>Vocab: extract(participant)
    API-->>API: assemble + validate
    API->>Cache: set(contextKey, context)
  end
  API-->>Agent: context (mood tokens + timeline + vocabulary)
```

## Notes

- <200ms targets with multilayer caching; MCP-ready resource shapes.

# Configuration Reference

> Claude/OpenAI Provider Abstraction – Environment Variable Index
> Version: 2025-08-11

All variables are optional unless marked Required; some become required conditionally based on chosen providers.

| Variable                     | Required    | Default      | Description                                               |
| ---------------------------- | ----------- | ------------ | --------------------------------------------------------- |
| MEMORY_LLM_PRIMARY           | No          | `claude`     | Primary provider key (must be registered)                 |
| MEMORY_LLM_FALLBACK          | No          | `none`       | Fallback provider key or `none`                           |
| ANTHROPIC_API_KEY            | Conditional | —            | Needed if Claude is primary or fallback                   |
| OPENAI_API_KEY               | Conditional | —            | Needed if OpenAI is primary or fallback                   |
| MEMORY_LLM_MODEL_CLAUDE      | No          | impl default | Claude model override                                     |
| MEMORY_LLM_MODEL_OPENAI      | No          | impl default | OpenAI model override                                     |
| MEMORY_LLM_MAX_OUTPUT_TOKENS | No          | 800          | Hard cap for model output tokens                          |
| MEMORY_LLM_TEMPERATURE       | No          | 0.3          | Determinism tuning                                        |
| MEMORY_LLM_DAILY_BUDGET_USD  | No          | 0            | 0 disables budget enforcement                             |
| MEMORY_LLM_STREAMING         | No          | false        | Enable streaming path                                     |
| MEMORY_LLM_MAX_RETRIES       | No          | 3            | Additional attempts after first failure                   |
| MEMORY_LLM_TIMEOUT_MS        | No          | 60000        | Overall request timeout                                   |
| MEMORY_LLM_CB_ERROR_RATE     | No          | 0.5          | Circuit breaker open threshold                            |
| MEMORY_LLM_CB_COOLDOWN_MS    | No          | 30000        | Circuit breaker cooldown period                           |
| MEMORY_LLM_CIRCUIT_PROBES    | No          | 1            | Half-open probesRequired successes before closing circuit |

## Budget Logic

If `MEMORY_LLM_DAILY_BUDGET_USD` > 0 and (spent + estimatedNext) > budget → refuse with `budget_exceeded`. Warnings at 70%, 90%, 100%.

## Example .env.example Snippet

```env
MEMORY_LLM_PRIMARY=claude
MEMORY_LLM_FALLBACK=openai
ANTHROPIC_API_KEY=sk-ant-xxx
OPENAI_API_KEY=sk-openai-xxx
MEMORY_LLM_MODEL_CLAUDE=claude-3-sonnet-20240229
MEMORY_LLM_MODEL_OPENAI=gpt-4-turbo-preview
MEMORY_LLM_MAX_OUTPUT_TOKENS=800
MEMORY_LLM_TEMPERATURE=0.3
MEMORY_LLM_DAILY_BUDGET_USD=5
MEMORY_LLM_STREAMING=false
MEMORY_LLM_MAX_RETRIES=3
MEMORY_LLM_TIMEOUT_MS=60000
MEMORY_LLM_CB_ERROR_RATE=0.5
MEMORY_LLM_CB_COOLDOWN_MS=30000
```

## Validation Rules

1. Exactly one primary provider must be specified (default claude).
2. If fallback != `none`, API key for fallback must be present.
3. `MEMORY_LLM_MAX_OUTPUT_TOKENS` must be >0 and < provider capability ceiling.
4. Budget values <0 are invalid.
5. Circuit breaker thresholds must be in (0,1].

## Future Extensions

| Planned Variable                   | Purpose                            |
| ---------------------------------- | ---------------------------------- |
| MEMORY_LLM_ALLOW_OVER_BUDGET       | Allow soft exceed with warning     |
| MEMORY_LLM_PROMPT_CACHE_TTL_MS     | Control cache invalidation         |
| MEMORY_LLM_TOKEN_ESTIMATE_STRATEGY | Switch heuristic vs provider count |

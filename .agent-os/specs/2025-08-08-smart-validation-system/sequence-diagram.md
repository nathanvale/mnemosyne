# Smart Validation System — Sequence Diagram and Summary

## Summary

Auto-confirm based on multi-factor confidence with thresholds; review UI for borderline; weekly calibration and analytics.

## Mermaid Sequence Diagram

```mermaid
sequenceDiagram
  autonumber
  participant Batch as Validation Batch Engine
  participant Conf as ConfidenceCalculator
  participant Router as DecisionRouter
  participant UI as Review UI
  participant Cal as Calibrator

  Batch->>Conf: compute(memory)
  Conf-->>Batch: confidence
  Batch->>Router: route(conf)
  alt > 0.75
    Router-->>Batch: auto-approve
  else 0.50..0.75
    Router-->>UI: enqueue for review
  else < 0.50
    Router-->>Batch: auto-reject
  end
  Cal->>UI: collect outcomes
  Cal-->>Router: adjust thresholds
```

## Notes

- 70% automation target; maintain 95% accuracy.

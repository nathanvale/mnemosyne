# Auto-Confirmation Thresholds — Sequence Diagram and Summary

## Summary

Confidence-based router auto-approves (>0.75), queues (0.50–0.75), or rejects (<0.50) memories. Weekly calibration tunes thresholds from validation outcomes; batch engine processes at scale.

## Mermaid Sequence Diagram

```mermaid
sequenceDiagram
  autonumber
  participant Batch as Batch Engine
  participant Conf as ConfidenceCalculator (40/30/20/10)
  participant Router as DecisionRouter
  participant Cal as ThresholdCalibrator
  participant Val as Validation Service
  participant Dash as Monitoring

  Batch->>Conf: compute(memory)
  Conf-->>Batch: confidence [0..1]
  Batch->>Router: route(confidence)
  alt > 0.75
    Router-->>Val: autoApprove(memory)
  else 0.50..0.75
    Router-->>Val: enqueueForReview(memory)
  else < 0.50
    Router-->>Val: autoReject(memory)
  end
  Cal->>Val: collect outcomes weekly
  Val-->>Cal: TP/FP/FN/accuracy
  Cal-->>Router: update thresholds (A/B optional)
  Dash<-Batch: metrics (rates, accuracy, factor contributions)
```

## Notes

- Factors: Claude 40%, coherence 30%, relationship 20%, context 10%.
- Personalized calibration support; alerting on accuracy drops.

# Tone-Tagged Memory Clustering — Sequence Diagram and Summary

## Summary

Clustering framework that groups ExtractedMemory into psychologically coherent themes using multi-dimensional similarity (tone 35%, communication 25%, relationship 20%, psychological 15%, temporal 5%). Supports dynamic updates, cross-cluster pattern recognition, quality assessment, and persistence for AI to retrieve theme-aware context.

## Mermaid Sequence Diagram

```mermaid
sequenceDiagram
  autonumber
  participant Orchestrator as Clustering Orchestrator
  participant Feat as FeatureExtractors (Tone/Comm/Rel/Psych/Temporal)
  participant Sim as FeatureSimilarityCalculator
  participant Engine as ToneClusteringEngine (Hierarchical)
  participant Qual as ClusterQualityAssessor
  participant Pattern as PatternRecognitionAnalyzer
  participant Dyn as DynamicClusterManager
  participant DB as @studio/db (Clusters)
  participant Log as @studio/logger

  Orchestrator->>Feat: extractFeatures(memories)
  Feat-->>Orchestrator: FeatureVectors[]
  Orchestrator->>Sim: buildSimilarityMatrix(FeatureVectors)
  Sim-->>Orchestrator: SimilarityMatrix
  Orchestrator->>Engine: cluster(SimilarityMatrix, constraints)
  Engine-->>Orchestrator: Clusters (with themes)
  Orchestrator->>Qual: assess(Clusters)
  Qual-->>Orchestrator: QualityMetrics (coherence, size, edge-cases)
  Orchestrator->>DB: persistClusters(Clusters, Metrics)
  DB-->>Orchestrator: ack
  Orchestrator->>Pattern: analyzeCrossClusterThemes(Clusters)
  Pattern-->>Orchestrator: Patterns/Insights
  Orchestrator->>Dyn: integrateNewMemory(memory)
  Dyn->>Engine: placeOrFormCluster(memory, constraints)
  Dyn-->>Orchestrator: UpdatedClusters
  Orchestrator->>Log: structured metrics and diagnostics
  Orchestrator-->>Caller: Clustered context + insights
```

## Notes

- Similarity weights: tone 35%, communication 25%, relationship 20%, psychological 15%, temporal 5%.
- Constraints: minimum cluster size, coherence threshold, edge-case resolution strategies.
- Dynamic updates preserve coherence; create new cluster if similarity below threshold.
- Patterns: cross-cluster themes, relationship dynamics, coping styles, evolution over time.

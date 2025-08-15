# Technical Specification

This is the technical specification for the spec detailed in @.agent-os/specs/2025-08-14-typescript-quality-subagent-integration/spec.md

> Created: 2025-08-14
> Version: 1.0.0

## Technical Requirements

- **Integration Point**: Extend the existing `printSummary()` function in `/packages/claude-hooks/src/quality-check/index.ts` at line 403 to detect and escalate unfixable TypeScript errors
- **Context Preservation**: Utilize existing TypeScript cache system (`TypeScriptConfigCache`) and intelligent config mapping to provide rich context to sub-agents
- **Error Pattern Recognition**: Implement logic to identify TypeScript errors that would benefit from sub-agent analysis versus those that are simple formatting issues
- **Sub-agent Communication**: Use Claude Code's Task tool with specialized prompts that include file context, error details, and codebase patterns
- **Performance Optimization**: Implement circuit breaker pattern and cost tracking to ensure sub-agent calls remain within 10-15% of total quality checks
- **Output Integration**: Seamlessly blend sub-agent insights with existing error output format while maintaining terminal readability

## Approach Options

**Option A: Direct API Integration**

- Pros: Full control over prompts and responses, lower latency
- Cons: Requires API key management, lacks Claude Code's specialized context

**Option B: Task Tool Integration** (Selected)

- Pros: Leverages Claude Code's prompt engineering, context awareness, and tool ecosystem
- Cons: Dependent on Claude Code environment, slightly higher latency

**Option C: Subprocess with Specialized Agents**

- Pros: Maximum flexibility, could support multiple AI providers
- Cons: Complex architecture, requires agent management infrastructure

**Rationale:** Option B (Task Tool Integration) is selected because it leverages Claude Code's existing infrastructure, proven prompt engineering patterns, and natural integration with the hook system. The Task tool provides the right abstraction level for sub-agent orchestration without requiring custom agent management.

## External Dependencies

- **No New Runtime Dependencies** - The implementation extends existing claude-hooks functionality
- **Claude Code Task Tool** - Core dependency for sub-agent orchestration (already available in target environment)
- **Existing TypeScript Infrastructure** - Leverages current TypeScript cache, config system, and error collection mechanisms

**Justification:** The hybrid approach minimizes external dependencies by extending the well-proven existing system. The Task tool is already available in Claude Code environments where this system will be deployed.

## Implementation Architecture

### Core Components

**1. Error Classification Engine**

```typescript
interface ErrorClassifier {
  isEscalationWorthy(error: string, context: QualityCheckContext): boolean
  getErrorCategory(
    error: string,
  ): 'auto-fixable' | 'needs-reasoning' | 'dependency-warning'
  extractContextForSubAgent(
    error: string,
    filePath: string,
    tsCache: TypeScriptConfigCache,
  ): SubAgentContext
}
```

**2. Sub-agent Orchestrator**

```typescript
interface SubAgentOrchestrator {
  analyzeTypeScriptErrors(
    errors: string[],
    context: SubAgentContext,
  ): Promise<SubAgentAnalysis>
  formatIntegratedOutput(errors: string[], analysis: SubAgentAnalysis): void
  trackUsageMetrics(): SubAgentMetrics
}
```

**3. Context Builder**

```typescript
interface SubAgentContext {
  filePath: string
  fileContent?: string
  tsConfigPath: string
  errorDetails: TypeScriptErrorDetail[]
  projectPatterns: ProjectContext
  relatedImports: ImportAnalysis[]
}
```

### Integration Flow

1. **Existing Flow Preservation**: Maintain current auto-fix pipeline (Prettier, ESLint, basic TypeScript)
2. **Error Collection**: Gather unfixable errors after auto-fix attempts complete
3. **Classification**: Use pattern recognition to identify errors suitable for sub-agent analysis
4. **Context Enrichment**: Leverage TypeScript cache to build rich context including file mappings, imports, and project structure
5. **Sub-agent Invocation**: Use Task tool with specialized prompts containing error context
6. **Output Integration**: Merge sub-agent insights with traditional error reporting
7. **Metrics Tracking**: Monitor usage patterns and cost effectiveness

### Prompt Engineering Strategy

**Context-Rich Prompts for Task Tool:**

```
Analyze TypeScript errors in a Node.js/ES modules monorepo context:

**File Context:**
- File: {filePath}
- TypeScript Config: {tsConfigPath}
- File Type: {fileType} (component/test/service/etc)

**Error Details:**
{errorList with line numbers and compiler messages}

**Project Context:**
- Import patterns: {commonImportPatterns}
- Related files: {relatedFiles}
- Package dependencies: {relevantPackages}

**Task:**
Provide contextual analysis of these TypeScript errors including:
1. Root cause explanation in developer-friendly terms
2. Specific fix suggestions with code examples
3. Impact assessment and related files that might be affected
4. Best practices recommendations based on the project patterns

Focus on actionable solutions rather than repeating compiler messages.
```

### Performance Considerations

- **Selective Activation**: Only 10-15% of quality checks should trigger sub-agent analysis
- **Context Caching**: Reuse TypeScript cache data and project analysis across multiple error classifications
- **Circuit Breaker**: Implement failure handling when Task tool is unavailable or slow
- **Graceful Degradation**: Fall back to traditional error reporting when sub-agent analysis fails
- **Usage Tracking**: Monitor API costs and effectiveness metrics to optimize escalation patterns

### Error Handling Strategy

- **Task Tool Unavailable**: Continue with existing error reporting, log for metrics
- **Sub-agent Timeout**: Display traditional errors with a note about analysis timeout
- **Malformed Responses**: Parse what's available, fall back to standard error format
- **Rate Limiting**: Implement cooldown periods and prioritize most critical errors
- **Context Building Failure**: Proceed with reduced context rather than skipping analysis

This technical approach ensures the system enhances rather than replaces the existing quality checking infrastructure while providing intelligent analysis for the subset of errors that truly benefit from contextual reasoning.

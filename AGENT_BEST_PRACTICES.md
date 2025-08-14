I'll search for best practices for building Claude Code sub-agents using the Context7 and Firecrawl tools.Based on my analysis of the Context7 documentation and Claude Code sub-agent resources, here are the **best practices for building Claude Code sub-agents**:

## Best Practices for Building Claude Code Sub-Agents

### 1. **Agent Architecture Patterns**

#### **Single Responsibility Principle**

Each sub-agent should have a clear, focused purpose:

- **DO**: Create specialised agents (e.g., `code-reviewer`, `test-runner`, `security-scanner`)
- **DON'T**: Build monolithic agents that try to do everything
- **Example**: Separate concerns into `debugger`, `refactor`, and `doc-writer` agents

#### **Hierarchical Coordination**

Structure agents in clear hierarchies for complex tasks:

```javascript
// Coordinator agent manages specialist agents
Task('Coordinate team', 'Manage development swarm', 'hierarchical-coordinator')
Task('Backend APIs', 'Build REST endpoints', 'backend-dev')
Task('Frontend', 'Create UI components', 'frontend-dev')
Task('Database', 'Design schema', 'database-architect')
```

### 2. **Agent Definition Structure**

#### **Standard Agent Metadata**

Every agent should include:

```markdown
---
name: my-agent
description: What this agent does and when to use it
tools: Read, Edit, Grep, Bash, Context
capabilities:
  - specific-capability-1
  - specific-capability-2
neural_patterns:
  - pattern-type
memory_access: read-write
coordination_priority: high
---
```

#### **Clear Role Definition**

```markdown
You are an expert in [DOMAIN]. Your role is to [PURPOSE].

When invoked, you will:

1. Query context for relevant information
2. Analyse the current state
3. Apply domain expertise
4. Implement solutions following best practices

Always ensure [KEY PRINCIPLE].
```

### 3. **Execution Workflow Best Practices**

#### **Structured Execution Phases**

```javascript
// 1. Discovery Phase
Task('Analyse context', 'Understand codebase', 'code-analyzer')

// 2. Planning Phase
Task('Design solution', 'Create architecture', 'architect')

// 3. Implementation Phase
Task('Implement features', 'Write code', 'coder')

// 4. Validation Phase
Task('Test implementation', 'Run tests', 'tester')
Task('Review code', 'Check quality', 'reviewer')
```

#### **Output Format Consistency**

```text
🔍 ANALYSIS COMPLETE
━━━━━━━━━━━━━━━━━━

📊 Summary:
- Items Processed: X
- Issues Found: Y
- Actions Taken: Z

🔴 CRITICAL (2)
━━━━━━━━━━━━━━

1. [Issue Description]
   File: path/to/file.js:123
   Impact: [Impact Description]
   Fix: [Proposed Solution]

✅ SUCCESS METRICS
━━━━━━━━━━━━━━━━━
- All tests passing
- Coverage: 95%
- Performance: Optimal
```

### 4. **Communication Patterns**

#### **Event-Driven Communication**

```javascript
// Agent discovers requirement
agent.notify('discovery', {
  type: 'requirement',
  category: 'security',
  detail: 'Authentication needed',
  impact: ['api', 'frontend', 'tests'],
})

// Other agents adapt
onDiscovery((event) => {
  if (event.impact.includes(this.domain)) {
    this.adaptPlan(event.detail)
  }
})
```

#### **Memory Sharing**

```javascript
// Store architectural decisions
mcp__claude -
  flow__memory_usage({
    action: 'store',
    key: 'architecture/decisions',
    value: {
      pattern: 'microservices',
      rationale: 'Scalability requirements',
      dependencies: ['service-a', 'service-b'],
    },
  })
```

### 5. **Error Handling & Resilience**

#### **Graceful Degradation**

```javascript
// If primary approach fails, fallback
if (!primarySolution) {
  // Document why primary failed
  logFailure(primaryError)

  // Attempt fallback
  return fallbackSolution()
}

// Never leave work incomplete
if (cannotFix) {
  documentIssue()
  suggestAlternatives()
  notifyHuman()
}
```

### 6. **Testing & Validation**

#### **Built-in Validation**

```javascript
// Always validate before and after
async function executeTask(task) {
  // Pre-conditions
  const preCheck = await validatePreconditions()
  if (!preCheck.valid) return preCheck.errors

  // Execute
  const result = await performTask(task)

  // Post-conditions
  const postCheck = await validatePostconditions(result)
  return postCheck.valid ? result : rollback()
}
```

### 7. **Performance Optimization**

#### **Parallel Execution**

```javascript
// Deploy agents concurrently when possible
[BatchTool]:
  Task("API Development", "...", "backend-dev")
  Task("UI Development", "...", "frontend-dev")
  Task("Database Design", "...", "data-architect")
  Task("Documentation", "...", "doc-writer")
```

#### **Resource Management**

```javascript
// Configure resource limits
const agentConfig = {
  maxAgents: 10,
  timeout: 300000, // 5 minutes
  memoryLimit: '2GB',
  concurrentTasks: 3,
}
```

### 8. **Documentation & Knowledge Sharing**

#### **Self-Documenting Agents**

Each agent should:

- Document its decisions
- Explain its reasoning
- Provide examples
- Reference best practices

```markdown
## Decision Log

- **Choice**: Used Repository Pattern
- **Reason**: Abstracts data access layer
- **Alternative**: Direct database access
- **Trade-offs**: Added complexity for better testability
```

### 9. **Integration Patterns**

#### **Tool Integration**

```javascript
// Agents should leverage appropriate tools
const tools = {
  analysis: ['grep', 'ast-parser', 'complexity-analyzer'],
  implementation: ['edit', 'create', 'refactor'],
  validation: ['test-runner', 'linter', 'security-scanner'],
  documentation: ['jsdoc', 'markdown-generator'],
}
```

### 10. **Quality Assurance**

#### **Code Review Checklist**

Every agent should validate:

- ✅ Security vulnerabilities addressed
- ✅ Tests cover edge cases
- ✅ Documentation updated
- ✅ Performance acceptable
- ✅ Accessibility considered
- ✅ Error handling robust

### Key Takeaways

1. **Modularity**: Build small, focused agents that do one thing well
2. **Coordination**: Use hierarchical or mesh patterns for complex workflows
3. **Communication**: Implement event-driven patterns for agent collaboration
4. **Resilience**: Always have fallback strategies and error handling
5. **Performance**: Leverage parallel execution where possible
6. **Documentation**: Agents should explain their actions and decisions
7. **Testing**: Validate both preconditions and postconditions
8. **Consistency**: Use standard output formats and patterns
9. **Integration**: Leverage existing tools and patterns
10. **Evolution**: Agents should learn and adapt from experiences

These best practices ensure that Claude Code sub-agents are reliable, maintainable, and effective at solving complex development challenges.

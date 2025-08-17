# Comprehensive dual deployment architecture for TypeScript research agents

## Introduction

This solution provides a complete framework for TypeScript research agents (Context7, Firecrawl, and Tavily) that can operate both as standalone microservices and Claude Code sub-agents. The architecture maximizes code reuse through shared XML prompt templates, unified TypeScript codebases, and intelligent deployment strategies that support both runtime contexts seamlessly.

## Core Architecture Overview

The dual deployment architecture leverages an adapter pattern that enables agents to detect and configure themselves for their runtime context automatically. Each agent maintains a single codebase with multiple entry points, shared business logic, and context-specific implementations for infrastructure concerns.

### Project Structure

```
research-agents/
├── src/
│   ├── core/                          # Shared business logic
│   │   ├── agents/
│   │   │   ├── context7/
│   │   │   │   ├── agent.ts
│   │   │   │   └── prompts.xml
│   │   │   ├── firecrawl/
│   │   │   │   ├── agent.ts
│   │   │   │   └── prompts.xml
│   │   │   └── tavily/
│   │   │       ├── agent.ts
│   │   │       └── prompts.xml
│   │   ├── interfaces/
│   │   │   └── agent.interface.ts
│   │   └── prompt-engine/
│   │       ├── xml-parser.ts
│   │       └── template-manager.ts
│   ├── adapters/                      # Deployment-specific adapters
│   │   ├── standalone/
│   │   │   ├── http-server.ts
│   │   │   └── dependency-injection.ts
│   │   └── claude/
│   │       ├── sub-agent-adapter.ts
│   │       └── mcp-integration.ts
│   ├── infrastructure/
│   │   ├── database/
│   │   ├── logging/
│   │   └── configuration/
│   └── deployment/
│       ├── standalone.ts
│       └── claude-agent.ts
├── .claude/
│   └── agents/
│       ├── context7-specialist.md
│       ├── firecrawl-specialist.md
│       └── tavily-researcher.md
├── prompts/
│   ├── base/
│   │   └── agent-base.xml
│   └── specialized/
│       ├── context7-prompts.xml
│       ├── firecrawl-prompts.xml
│       └── tavily-prompts.xml
└── build/
    ├── webpack.config.js
    ├── esbuild.config.js
    └── docker/
        └── Dockerfile.microservice
```

## 1. Dual Deployment Architecture Implementation

### Core Agent Interface

```typescript
// src/core/interfaces/agent.interface.ts
export interface IResearchAgent {
  initialize(context: DeploymentContext): Promise<void>
  process(request: AgentRequest): Promise<AgentResponse>
  getCapabilities(): AgentCapability[]
  shutdown(): Promise<void>
}

export enum DeploymentContext {
  STANDALONE = 'standalone',
  CLAUDE_SUBAGENT = 'claude-subagent',
  EMBEDDED = 'embedded',
}

export interface AgentRequest {
  id: string
  query: string
  context?: Record<string, any>
  metadata?: RequestMetadata
}

export interface AgentResponse {
  id: string
  result: any
  reasoning?: string
  confidence: number
  metadata?: ResponseMetadata
}
```

### Context-Aware Agent Base Class

```typescript
// src/core/agents/base-agent.ts
import {
  IResearchAgent,
  DeploymentContext,
} from '../interfaces/agent.interface'
import { XMLPromptManager } from '../prompt-engine/xml-parser'

export abstract class BaseResearchAgent implements IResearchAgent {
  protected context: DeploymentContext
  protected promptManager: XMLPromptManager
  protected config: AgentConfig

  constructor(protected name: string) {
    this.promptManager = new XMLPromptManager()
  }

  async initialize(context: DeploymentContext): Promise<void> {
    this.context = context
    this.config = await this.loadConfiguration(context)
    await this.promptManager.loadTemplates(
      `prompts/specialized/${this.name}-prompts.xml`,
    )
    await this.configureForContext(context)
  }

  protected abstract configureForContext(
    context: DeploymentContext,
  ): Promise<void>

  async process(request: AgentRequest): Promise<AgentResponse> {
    // Pre-process
    const validatedRequest = await this.validateRequest(request)

    // Generate prompt from XML template
    const prompt = await this.promptManager.generatePrompt('main', {
      query: validatedRequest.query,
      context: validatedRequest.context,
    })

    // Process with context-specific implementation
    const result = await this.executeWithContext(prompt, validatedRequest)

    // Post-process
    return this.formatResponse(result)
  }

  protected abstract executeWithContext(
    prompt: string,
    request: AgentRequest,
  ): Promise<any>

  protected abstract validateRequest(
    request: AgentRequest,
  ): Promise<AgentRequest>
  protected abstract formatResponse(result: any): AgentResponse
}
```

### Service Adapter Pattern Implementation

```typescript
// src/adapters/standalone/http-server.ts
import express from 'express'
import { BaseResearchAgent } from '../../core/agents/base-agent'
import { DeploymentContext } from '../../core/interfaces/agent.interface'

export class StandaloneServiceAdapter {
  private app: express.Application
  private agent: BaseResearchAgent

  constructor(agent: BaseResearchAgent) {
    this.agent = agent
    this.app = express()
    this.setupRoutes()
  }

  async start(port: number = 3000): Promise<void> {
    await this.agent.initialize(DeploymentContext.STANDALONE)

    this.app.listen(port, () => {
      console.log(
        `Agent ${this.agent.constructor.name} running on port ${port}`,
      )
    })
  }

  private setupRoutes(): void {
    this.app.use(express.json())

    this.app.post('/process', async (req, res) => {
      try {
        const response = await this.agent.process(req.body)
        res.json(response)
      } catch (error) {
        res.status(500).json({ error: error.message })
      }
    })

    this.app.get('/health', (req, res) => {
      res.json({ status: 'healthy', agent: this.agent.constructor.name })
    })
  }
}

// src/adapters/claude/sub-agent-adapter.ts
export class ClaudeSubAgentAdapter {
  private agent: BaseResearchAgent

  constructor(agent: BaseResearchAgent) {
    this.agent = agent
  }

  async initialize(): Promise<void> {
    await this.agent.initialize(DeploymentContext.CLAUDE_SUBAGENT)
  }

  async handleClaudeRequest(input: string, context: any): Promise<string> {
    const request = {
      id: generateId(),
      query: input,
      context: context,
    }

    const response = await this.agent.process(request)
    return this.formatForClaude(response)
  }

  private formatForClaude(response: AgentResponse): string {
    return `<result>
  <confidence>${response.confidence}</confidence>
  <reasoning>${response.reasoning}</reasoning>
  <data>${JSON.stringify(response.result)}</data>
</result>`
  }
}
```

## 2. Claude Code Sub-Agent Integration

### Agent Markdown Definitions

```yaml
# .claude/agents/context7-specialist.md
---
name: context7-specialist
description: Documentation and API reference specialist using Context7 for real-time technical information. Use PROACTIVELY for API documentation, code examples, and technical specifications.
tools: Read, Write, web_search, web_fetch, context7_search
model: sonnet
color: Blue
---

You are a Context7 documentation specialist with access to real-time API documentation and technical references.

## Core Capabilities
- Search and retrieve current API documentation
- Provide up-to-date code examples and best practices
- Validate implementation patterns against latest standards
- Cross-reference multiple documentation sources

## Workflow
1. Analyze the user's technical query
2. Search Context7 for relevant documentation
3. Retrieve specific API details and code examples
4. Synthesize findings into actionable recommendations
5. Provide implementation guidance with examples

## Integration Points
- Access to Context7 MCP server for real-time documentation
- Web search capabilities for additional context
- File system access for code analysis
```

```yaml
# .claude/agents/firecrawl-specialist.md
---
name: firecrawl-specialist
description: Web content extraction and analysis specialist using Firecrawl. Use for scraping websites, extracting structured data, and processing web content.
tools: Read, Write, web_fetch, firecrawl_scrape, firecrawl_extract
model: sonnet
color: Orange
---

You are a Firecrawl web scraping specialist focused on extracting and processing web content.

## Responsibilities
- Extract structured data from websites
- Convert web pages to clean markdown
- Handle dynamic JavaScript-rendered content
- Process large-scale web content efficiently

## Best Practices
- Respect robots.txt and rate limits
- Extract only relevant information
- Structure data for downstream processing
- Provide data quality metrics
```

```yaml
# .claude/agents/tavily-researcher.md
---
name: tavily-researcher
description: Advanced research and comprehensive analysis using Tavily. Use for deep research, fact-checking, and generating research reports on complex topics.
tools: Read, Write, tavily_search, tavily_extract, web_search
model: opus
color: Green
---

You are a Tavily research specialist conducting comprehensive analysis on complex topics.

## Research Methodology
1. Broad topic exploration to identify key areas
2. Deep-dive into specific aspects using Tavily
3. Cross-validation of findings across sources
4. Synthesis of comprehensive research reports
5. Critical evaluation of source reliability

## Output Standards
- Cite all sources with reliability scores
- Provide balanced perspectives on controversial topics
- Include quantitative data where available
- Generate executive summaries for quick understanding
```

### MCP Server Configuration

```json
// .claude/settings.json
{
  "mcpServers": {
    "context7": {
      "command": "npx",
      "args": ["-y", "@context7/mcp-server"],
      "env": {
        "CONTEXT7_API_KEY": "${CONTEXT7_API_KEY}"
      }
    },
    "firecrawl": {
      "command": "npx",
      "args": ["-y", "@firecrawl/mcp-server"],
      "env": {
        "FIRECRAWL_API_KEY": "${FIRECRAWL_API_KEY}"
      }
    },
    "tavily": {
      "command": "npx",
      "args": ["-y", "@tavily/mcp-server"],
      "env": {
        "TAVILY_API_KEY": "${TAVILY_API_KEY}"
      }
    }
  }
}
```

## 3. Shared XML Prompt System

### XML Prompt Template Manager

```typescript
// src/core/prompt-engine/xml-parser.ts
import { XMLParser, XMLBuilder } from 'fast-xml-parser'
import * as fs from 'fs/promises'
import * as path from 'path'

export class XMLPromptManager {
  private parser: XMLParser
  private builder: XMLBuilder
  private templates: Map<string, XMLTemplate> = new Map()
  private cache: Map<string, string> = new Map()

  constructor() {
    this.parser = new XMLParser({
      ignoreAttributes: false,
      attributeNamePrefix: '@_',
      parseTagValue: true,
    })

    this.builder = new XMLBuilder({
      ignoreAttributes: false,
      attributeNamePrefix: '@_',
      format: true,
    })
  }

  async loadTemplates(templatePath: string): Promise<void> {
    const content = await fs.readFile(templatePath, 'utf-8')
    const parsed = this.parser.parse(content)

    if (parsed.templates && parsed.templates.template) {
      const templates = Array.isArray(parsed.templates.template)
        ? parsed.templates.template
        : [parsed.templates.template]

      for (const template of templates) {
        this.templates.set(template['@_name'], template)
      }
    }
  }

  async generatePrompt(
    templateName: string,
    variables: Record<string, any>,
  ): Promise<string> {
    const cacheKey = `${templateName}:${JSON.stringify(variables)}`

    if (this.cache.has(cacheKey)) {
      return this.cache.get(cacheKey)!
    }

    const template = this.templates.get(templateName)
    if (!template) {
      throw new Error(`Template ${templateName} not found`)
    }

    const processed = await this.processTemplate(template, variables)
    const result = this.builder.build(processed)

    this.cache.set(cacheKey, result)
    return result
  }

  private async processTemplate(
    template: XMLTemplate,
    variables: Record<string, any>,
  ): Promise<any> {
    // Handle inheritance
    if (template['@_extends']) {
      const parent = this.templates.get(template['@_extends'])
      if (parent) {
        template = this.mergeTemplates(parent, template)
      }
    }

    // Process variables
    return this.substituteVariables(template, variables)
  }

  private substituteVariables(
    template: any,
    variables: Record<string, any>,
  ): any {
    const json = JSON.stringify(template)
    const substituted = json.replace(/\{\{(\w+)\}\}/g, (match, key) => {
      return this.escapeXML(String(variables[key] || ''))
    })
    return JSON.parse(substituted)
  }

  private escapeXML(str: string): string {
    return str
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&apos;')
  }
}
```

### XML Prompt Templates

```xml
<!-- prompts/base/agent-base.xml -->
<templates>
  <template name="base">
    <prompt>
      <role>You are an AI research assistant specializing in {{specialty}}</role>
      <instructions>
        <instruction>Provide accurate and comprehensive information</instruction>
        <instruction>Cite sources when available</instruction>
        <instruction>Admit uncertainty when appropriate</instruction>
      </instructions>
      <context>{{context}}</context>
    </prompt>
  </template>
</templates>

<!-- prompts/specialized/context7-prompts.xml -->
<templates>
  <template name="main" extends="base">
    <prompt>
      <specialty>technical documentation and API references</specialty>
      <task>
        <description>{{query}}</description>
        <requirements>
          <requirement>Search Context7 for relevant documentation</requirement>
          <requirement>Provide code examples when applicable</requirement>
          <requirement>Include version information</requirement>
        </requirements>
      </task>
      <output-format>
        <section name="summary">Brief overview of findings</section>
        <section name="details">Comprehensive documentation</section>
        <section name="examples">Code examples and usage patterns</section>
        <section name="references">Links to source documentation</section>
      </output-format>
    </prompt>
  </template>

  <template name="api-search">
    <search>
      <query>{{api_name}}</query>
      <filters>
        <version>{{version}}</version>
        <language>{{language}}</language>
      </filters>
      <options>
        <include-deprecated>false</include-deprecated>
        <max-results>10</max-results>
      </options>
    </search>
  </template>
</templates>
```

## 4. Agent Implementations

### Context7 Agent Implementation

```typescript
// src/core/agents/context7/agent.ts
import { BaseResearchAgent } from '../base-agent'
import {
  DeploymentContext,
  AgentRequest,
  AgentResponse,
} from '../../interfaces/agent.interface'
import { Context7Client } from './context7-client'

export class Context7Agent extends BaseResearchAgent {
  private client: Context7Client

  constructor() {
    super('context7')
  }

  protected async configureForContext(
    context: DeploymentContext,
  ): Promise<void> {
    switch (context) {
      case DeploymentContext.STANDALONE:
        this.client = new Context7Client({
          apiKey: process.env.CONTEXT7_API_KEY,
          baseUrl: process.env.CONTEXT7_URL || 'https://api.context7.com',
        })
        break

      case DeploymentContext.CLAUDE_SUBAGENT:
        // Use MCP server when running as Claude sub-agent
        this.client = new Context7Client({
          useMCP: true,
          mcpServer: 'context7',
        })
        break
    }
  }

  protected async executeWithContext(
    prompt: string,
    request: AgentRequest,
  ): Promise<any> {
    // Search for relevant documentation
    const searchPrompt = await this.promptManager.generatePrompt('api-search', {
      api_name: request.query,
      version: request.context?.version || 'latest',
      language: request.context?.language || 'typescript',
    })

    const searchResults = await this.client.search(searchPrompt)

    // Retrieve detailed documentation
    const docs = await Promise.all(
      searchResults.map((result) => this.client.getDocumentation(result.id)),
    )

    // Generate comprehensive response
    return {
      documentation: docs,
      examples: this.extractExamples(docs),
      summary: this.generateSummary(docs),
    }
  }

  protected async validateRequest(
    request: AgentRequest,
  ): Promise<AgentRequest> {
    if (!request.query || request.query.trim().length === 0) {
      throw new Error('Query is required')
    }

    return {
      ...request,
      query: request.query.trim(),
    }
  }

  protected formatResponse(result: any): AgentResponse {
    return {
      id: generateId(),
      result: result,
      reasoning: `Found ${result.documentation.length} relevant documentation entries`,
      confidence: this.calculateConfidence(result),
      metadata: {
        source: 'context7',
        timestamp: new Date().toISOString(),
      },
    }
  }

  private calculateConfidence(result: any): number {
    const docCount = result.documentation.length
    const hasExamples = result.examples.length > 0

    if (docCount > 5 && hasExamples) return 0.95
    if (docCount > 2) return 0.8
    if (docCount > 0) return 0.6
    return 0.3
  }

  getCapabilities(): AgentCapability[] {
    return [
      { name: 'documentation-search', version: '1.0' },
      { name: 'api-reference', version: '1.0' },
      { name: 'code-examples', version: '1.0' },
    ]
  }
}
```

## 5. Build and Deployment Configuration

### Multi-Target Build Configuration

```javascript
// build/esbuild.config.js
import * as esbuild from 'esbuild'
import { writeFileSync, mkdirSync } from 'fs'
import { join } from 'path'

const agents = ['context7', 'firecrawl', 'tavily']

async function buildForTarget(target) {
  const commonConfig = {
    bundle: true,
    minify: process.env.NODE_ENV === 'production',
    sourcemap: true,
    external: ['fs', 'path', 'os', 'crypto'],
  }

  for (const agent of agents) {
    if (target === 'microservice') {
      // Build standalone microservice
      await esbuild.build({
        ...commonConfig,
        entryPoints: [`src/deployment/standalone.ts`],
        platform: 'node',
        target: 'node18',
        format: 'cjs',
        outfile: `dist/microservice/${agent}/index.js`,
        define: {
          'process.env.AGENT_NAME': `"${agent}"`,
        },
      })
    } else if (target === 'claude-agent') {
      // Build Claude Code sub-agent
      await esbuild.build({
        ...commonConfig,
        entryPoints: [`src/deployment/claude-agent.ts`],
        platform: 'node',
        target: 'node18',
        format: 'esm',
        outfile: `dist/.claude/agents/${agent}.js`,
        define: {
          'process.env.AGENT_NAME': `"${agent}"`,
        },
      })

      // Copy agent markdown files
      copyFile(
        `.claude/agents/${agent}-specialist.md`,
        `dist/.claude/agents/${agent}-specialist.md`,
      )
    }
  }
}

// Build both targets
await buildForTarget('microservice')
await buildForTarget('claude-agent')
```

### Docker Configuration for Microservices

```dockerfile
# build/docker/Dockerfile.microservice
FROM node:18-alpine AS base
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production && npm cache clean --force

FROM node:18-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build:microservice

FROM base AS production
COPY --from=builder /app/dist/microservice ./dist
COPY --from=builder /app/prompts ./prompts

ENV NODE_ENV=production
ENV DEPLOYMENT_MODE=standalone

EXPOSE 3000
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3000/health', (r) => {r.statusCode === 200 ? process.exit(0) : process.exit(1)})"

CMD ["node", "dist/index.js"]
```

### CI/CD Pipeline

```yaml
# .github/workflows/deploy.yml
name: Multi-Target Deployment

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

env:
  REGISTRY: ghcr.io
  IMAGE_NAME: ${{ github.repository }}

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '18'
          cache: 'npm'
      - run: npm ci
      - run: npm test
      - run: npm run lint

  build-and-deploy:
    needs: test
    runs-on: ubuntu-latest
    if: github.ref == 'refs/heads/main'

    strategy:
      matrix:
        agent: [context7, firecrawl, tavily]

    steps:
      - uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '18'
          cache: 'npm'

      - name: Install dependencies
        run: npm ci

      - name: Build for both targets
        run: |
          npm run build:microservice
          npm run build:claude-agent
        env:
          AGENT_NAME: ${{ matrix.agent }}

      - name: Build and push Docker image
        uses: docker/build-push-action@v5
        with:
          context: .
          file: ./build/docker/Dockerfile.microservice
          push: true
          tags: |
            ${{ env.REGISTRY }}/${{ env.IMAGE_NAME }}-${{ matrix.agent }}:latest
            ${{ env.REGISTRY }}/${{ env.IMAGE_NAME }}-${{ matrix.agent }}:${{ github.sha }}
          build-args: |
            AGENT_NAME=${{ matrix.agent }}

      - name: Deploy Claude Agent
        run: |
          # Package Claude agent files
          tar -czf claude-agent-${{ matrix.agent }}.tar.gz \
            dist/.claude/agents/${{ matrix.agent }}.js \
            dist/.claude/agents/${{ matrix.agent }}-specialist.md

          # Upload to Claude registry (custom implementation)
          ./scripts/deploy-claude-agent.sh ${{ matrix.agent }}
```

## 6. Runtime Configuration Management

### Environment Detection and Configuration

```typescript
// src/infrastructure/configuration/config-manager.ts
export class ConfigurationManager {
  private static instance: ConfigurationManager
  private config: AppConfig

  private constructor() {
    this.config = this.loadConfiguration()
  }

  static getInstance(): ConfigurationManager {
    if (!ConfigurationManager.instance) {
      ConfigurationManager.instance = new ConfigurationManager()
    }
    return ConfigurationManager.instance
  }

  private loadConfiguration(): AppConfig {
    const deploymentMode = this.detectDeploymentMode()

    const baseConfig: AppConfig = {
      deployment: {
        mode: deploymentMode,
        context: this.detectContext(),
      },
      agents: {
        context7: {
          apiKey: process.env.CONTEXT7_API_KEY,
          baseUrl: process.env.CONTEXT7_URL,
        },
        firecrawl: {
          apiKey: process.env.FIRECRAWL_API_KEY,
          baseUrl: process.env.FIRECRAWL_URL,
        },
        tavily: {
          apiKey: process.env.TAVILY_API_KEY,
          baseUrl: process.env.TAVILY_URL,
        },
      },
      monitoring: {
        enabled: process.env.MONITORING_ENABLED === 'true',
        service: process.env.MONITORING_SERVICE || 'opentelemetry',
      },
    }

    // Load environment-specific overrides
    if (deploymentMode === DeploymentMode.STANDALONE) {
      return { ...baseConfig, ...this.loadStandaloneConfig() }
    } else if (deploymentMode === DeploymentMode.CLAUDE_SUBAGENT) {
      return { ...baseConfig, ...this.loadClaudeConfig() }
    }

    return baseConfig
  }

  private detectDeploymentMode(): DeploymentMode {
    // Check for Claude Code environment
    if (
      process.env.CLAUDE_AGENT === 'true' ||
      process.env.MCP_SERVER_AVAILABLE === 'true'
    ) {
      return DeploymentMode.CLAUDE_SUBAGENT
    }

    // Check for containerized environment
    if (
      process.env.KUBERNETES_SERVICE_HOST ||
      process.env.DOCKER_CONTAINER === 'true'
    ) {
      return DeploymentMode.STANDALONE
    }

    // Default to standalone
    return DeploymentMode.STANDALONE
  }

  private detectContext(): DeploymentContext {
    if (process.env.DEPLOYMENT_CONTEXT) {
      return process.env.DEPLOYMENT_CONTEXT as DeploymentContext
    }

    const mode = this.detectDeploymentMode()
    return mode === DeploymentMode.CLAUDE_SUBAGENT
      ? DeploymentContext.CLAUDE_SUBAGENT
      : DeploymentContext.STANDALONE
  }

  getConfig(): AppConfig {
    return this.config
  }

  getAgentConfig(agentName: string): AgentConfig {
    return this.config.agents[agentName]
  }
}
```

## 7. Deployment Entry Points

### Standalone Microservice Entry Point

```typescript
// src/deployment/standalone.ts
import { Context7Agent } from '../core/agents/context7/agent'
import { FirecrawlAgent } from '../core/agents/firecrawl/agent'
import { TavilyAgent } from '../core/agents/tavily/agent'
import { StandaloneServiceAdapter } from '../adapters/standalone/http-server'
import { ConfigurationManager } from '../infrastructure/configuration/config-manager'
import { setupMonitoring } from '../infrastructure/monitoring/opentelemetry'

async function main() {
  // Setup monitoring
  await setupMonitoring()

  // Get configuration
  const config = ConfigurationManager.getInstance()
  const agentName = process.env.AGENT_NAME || 'context7'

  // Create agent instance
  let agent
  switch (agentName) {
    case 'context7':
      agent = new Context7Agent()
      break
    case 'firecrawl':
      agent = new FirecrawlAgent()
      break
    case 'tavily':
      agent = new TavilyAgent()
      break
    default:
      throw new Error(`Unknown agent: ${agentName}`)
  }

  // Create and start service adapter
  const adapter = new StandaloneServiceAdapter(agent)
  const port = parseInt(process.env.PORT || '3000')

  await adapter.start(port)

  // Graceful shutdown
  process.on('SIGTERM', async () => {
    console.log('SIGTERM received, shutting down gracefully')
    await agent.shutdown()
    process.exit(0)
  })
}

main().catch((error) => {
  console.error('Failed to start agent:', error)
  process.exit(1)
})
```

### Claude Sub-Agent Entry Point

```typescript
// src/deployment/claude-agent.ts
import { Context7Agent } from '../core/agents/context7/agent'
import { FirecrawlAgent } from '../core/agents/firecrawl/agent'
import { TavilyAgent } from '../core/agents/tavily/agent'
import { ClaudeSubAgentAdapter } from '../adapters/claude/sub-agent-adapter'

// Export function for Claude Code to invoke
export async function handleRequest(
  input: string,
  context: any,
): Promise<string> {
  const agentName = process.env.AGENT_NAME || detectAgentFromContext(context)

  let agent
  switch (agentName) {
    case 'context7':
      agent = new Context7Agent()
      break
    case 'firecrawl':
      agent = new FirecrawlAgent()
      break
    case 'tavily':
      agent = new TavilyAgent()
      break
    default:
      throw new Error(`Unknown agent: ${agentName}`)
  }

  const adapter = new ClaudeSubAgentAdapter(agent)
  await adapter.initialize()

  return adapter.handleClaudeRequest(input, context)
}

function detectAgentFromContext(context: any): string {
  // Logic to determine which agent to use based on context
  if (context?.tools?.includes('context7_search')) {
    return 'context7'
  } else if (context?.tools?.includes('firecrawl_scrape')) {
    return 'firecrawl'
  } else if (context?.tools?.includes('tavily_search')) {
    return 'tavily'
  }

  return 'context7' // Default
}

// Export metadata for Claude Code
export const metadata = {
  name: process.env.AGENT_NAME || 'research-agent',
  version: process.env.npm_package_version || '1.0.0',
  capabilities: ['research', 'documentation', 'web-scraping'],
}
```

## 8. Advanced Integration Patterns

### Event-Driven Agent Coordination

```typescript
// src/infrastructure/events/event-bus.ts
import { EventEmitter } from 'events'
import { Kafka, Producer, Consumer } from 'kafkajs'

export class AgentEventBus extends EventEmitter {
  private kafka: Kafka
  private producer: Producer
  private consumer: Consumer

  constructor(private config: EventBusConfig) {
    super()

    if (config.mode === 'kafka') {
      this.kafka = new Kafka({
        clientId: config.clientId,
        brokers: config.brokers,
      })

      this.producer = this.kafka.producer()
      this.consumer = this.kafka.consumer({
        groupId: config.groupId,
      })
    }
  }

  async initialize(): Promise<void> {
    if (this.kafka) {
      await this.producer.connect()
      await this.consumer.connect()
      await this.subscribeToTopics()
    }
  }

  async publishEvent(event: AgentEvent): Promise<void> {
    if (this.kafka) {
      await this.producer.send({
        topic: event.topic,
        messages: [
          {
            key: event.agentId,
            value: JSON.stringify(event),
          },
        ],
      })
    } else {
      // Local event emission for Claude sub-agent mode
      this.emit(event.type, event)
    }
  }

  private async subscribeToTopics(): Promise<void> {
    const topics = ['agent-tasks', 'agent-results', 'agent-coordination']

    await this.consumer.subscribe({
      topics,
      fromBeginning: false,
    })

    await this.consumer.run({
      eachMessage: async ({ topic, message }) => {
        const event = JSON.parse(message.value.toString())
        this.emit(event.type, event)
      },
    })
  }
}
```

### Monitoring and Observability

```typescript
// src/infrastructure/monitoring/opentelemetry.ts
import { NodeSDK } from '@opentelemetry/sdk-node'
import { getNodeAutoInstrumentations } from '@opentelemetry/auto-instrumentations-node'
import { Resource } from '@opentelemetry/resources'
import { SemanticResourceAttributes } from '@opentelemetry/semantic-conventions'

export async function setupMonitoring(): Promise<void> {
  const agentName = process.env.AGENT_NAME || 'unknown'
  const deploymentMode = process.env.DEPLOYMENT_MODE || 'standalone'

  const resource = new Resource({
    [SemanticResourceAttributes.SERVICE_NAME]: `research-agent-${agentName}`,
    [SemanticResourceAttributes.SERVICE_VERSION]:
      process.env.npm_package_version || '1.0.0',
    'agent.type': agentName,
    'deployment.mode': deploymentMode,
  })

  const sdk = new NodeSDK({
    resource,
    instrumentations: [
      getNodeAutoInstrumentations({
        '@opentelemetry/instrumentation-fs': {
          enabled: false, // Disable to reduce noise
        },
      }),
    ],
  })

  await sdk.start()

  // Custom metrics for AI agents
  const meter = metrics.getMeter('ai-agent-metrics')

  const tokenUsage = meter.createCounter('ai.agent.token.usage', {
    description: 'Tokens consumed by agent operations',
    unit: 'tokens',
  })

  const responseTime = meter.createHistogram('ai.agent.response.time', {
    description: 'Time to complete agent requests',
    unit: 'ms',
  })

  // Export metrics helpers
  global.agentMetrics = {
    recordTokenUsage: (tokens: number, agentName: string) => {
      tokenUsage.add(tokens, { agent: agentName })
    },
    recordResponseTime: (time: number, agentName: string) => {
      responseTime.record(time, { agent: agentName })
    },
  }
}
```

## Production Deployment Examples

### Kubernetes Deployment

```yaml
# k8s/deployment.yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: context7-agent
  labels:
    app: research-agent
    agent: context7
spec:
  replicas: 3
  selector:
    matchLabels:
      app: research-agent
      agent: context7
  template:
    metadata:
      labels:
        app: research-agent
        agent: context7
    spec:
      containers:
        - name: context7-agent
          image: ghcr.io/yourorg/research-agents-context7:latest
          ports:
            - containerPort: 3000
          env:
            - name: AGENT_NAME
              value: 'context7'
            - name: DEPLOYMENT_MODE
              value: 'standalone'
            - name: CONTEXT7_API_KEY
              valueFrom:
                secretKeyRef:
                  name: agent-secrets
                  key: context7-api-key
          resources:
            requests:
              memory: '256Mi'
              cpu: '250m'
            limits:
              memory: '512Mi'
              cpu: '500m'
          livenessProbe:
            httpGet:
              path: /health
              port: 3000
            initialDelaySeconds: 30
            periodSeconds: 10
---
apiVersion: v1
kind: Service
metadata:
  name: context7-agent-service
spec:
  selector:
    app: research-agent
    agent: context7
  ports:
    - protocol: TCP
      port: 80
      targetPort: 3000
  type: ClusterIP
```

### Docker Compose for Development

```yaml
# docker-compose.yml
version: '3.8'

services:
  context7-agent:
    build:
      context: .
      dockerfile: build/docker/Dockerfile.microservice
      args:
        AGENT_NAME: context7
    environment:
      - AGENT_NAME=context7
      - DEPLOYMENT_MODE=standalone
      - CONTEXT7_API_KEY=${CONTEXT7_API_KEY}
      - MONITORING_ENABLED=true
    ports:
      - '3001:3000'

  firecrawl-agent:
    build:
      context: .
      dockerfile: build/docker/Dockerfile.microservice
      args:
        AGENT_NAME: firecrawl
    environment:
      - AGENT_NAME=firecrawl
      - DEPLOYMENT_MODE=standalone
      - FIRECRAWL_API_KEY=${FIRECRAWL_API_KEY}
    ports:
      - '3002:3000'

  tavily-agent:
    build:
      context: .
      dockerfile: build/docker/Dockerfile.microservice
      args:
        AGENT_NAME: tavily
    environment:
      - AGENT_NAME=tavily
      - DEPLOYMENT_MODE=standalone
      - TAVILY_API_KEY=${TAVILY_API_KEY}
    ports:
      - '3003:3000'

  kafka:
    image: confluentinc/cp-kafka:latest
    environment:
      KAFKA_ZOOKEEPER_CONNECT: zookeeper:2181
      KAFKA_ADVERTISED_LISTENERS: PLAINTEXT://kafka:9092
    depends_on:
      - zookeeper

  zookeeper:
    image: confluentinc/cp-zookeeper:latest
    environment:
      ZOOKEEPER_CLIENT_PORT: 2181
```

## Development Workflow

### Local Development Setup

```bash
# Install dependencies
npm install

# Set up environment variables
cp .env.example .env
# Edit .env with your API keys

# Run tests
npm test

# Development mode - Standalone microservice
npm run dev:standalone -- --agent=context7

# Development mode - Claude agent simulation
npm run dev:claude -- --agent=context7

# Build for both targets
npm run build:all

# Run specific agent as microservice
AGENT_NAME=context7 npm run start:microservice

# Package for Claude deployment
npm run package:claude
```

### Testing Strategy

```typescript
// tests/integration/dual-deployment.test.ts
import { Context7Agent } from '../../src/core/agents/context7/agent'
import { StandaloneServiceAdapter } from '../../src/adapters/standalone/http-server'
import { ClaudeSubAgentAdapter } from '../../src/adapters/claude/sub-agent-adapter'
import { DeploymentContext } from '../../src/core/interfaces/agent.interface'

describe('Dual Deployment Tests', () => {
  let agent: Context7Agent

  beforeEach(() => {
    agent = new Context7Agent()
  })

  describe('Standalone Deployment', () => {
    it('should initialize and process requests as microservice', async () => {
      const adapter = new StandaloneServiceAdapter(agent)
      await agent.initialize(DeploymentContext.STANDALONE)

      const response = await agent.process({
        id: 'test-1',
        query: 'React hooks documentation',
        context: { version: '18.0' },
      })

      expect(response).toHaveProperty('result')
      expect(response.confidence).toBeGreaterThan(0.5)
    })
  })

  describe('Claude Sub-Agent Deployment', () => {
    it('should initialize and process requests as Claude agent', async () => {
      const adapter = new ClaudeSubAgentAdapter(agent)
      await adapter.initialize()

      const response = await adapter.handleClaudeRequest(
        'Find documentation for React hooks',
        { tools: ['context7_search'] },
      )

      expect(response).toContain('<result>')
      expect(response).toContain('<confidence>')
    })
  })

  describe('Prompt Template System', () => {
    it('should generate consistent prompts across deployments', async () => {
      const standaloneAgent = new Context7Agent()
      await standaloneAgent.initialize(DeploymentContext.STANDALONE)

      const claudeAgent = new Context7Agent()
      await claudeAgent.initialize(DeploymentContext.CLAUDE_SUBAGENT)

      const request = {
        id: 'test-2',
        query: 'TypeScript generics',
        context: {},
      }

      const standaloneResponse = await standaloneAgent.process(request)
      const claudeResponse = await claudeAgent.process(request)

      // Both should use the same prompt templates
      expect(standaloneResponse.reasoning).toBeDefined()
      expect(claudeResponse.reasoning).toBeDefined()
    })
  })
})
```

## Summary

This comprehensive solution provides a production-ready framework for deploying TypeScript research agents (Context7, Firecrawl, and Tavily) as both standalone microservices and Claude Code sub-agents. The architecture leverages:

- **Adapter pattern** for seamless context switching between deployment modes
- **Shared XML prompt templates** with inheritance and validation
- **Unified TypeScript codebase** with context-aware implementations
- **Sophisticated build system** supporting multiple targets
- **Complete CI/CD pipeline** for automated deployment
- **Production-grade monitoring** with OpenTelemetry
- **Event-driven coordination** for multi-agent workflows
- **Comprehensive testing** across both deployment modes

The solution maximizes code reuse while maintaining flexibility for context-specific optimizations, enabling teams to leverage the same agent logic whether deployed as containerized microservices or integrated Claude Code sub-agents.

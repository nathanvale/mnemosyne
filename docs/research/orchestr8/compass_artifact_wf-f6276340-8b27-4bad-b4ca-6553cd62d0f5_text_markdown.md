# Comprehensive TypeScript Microservices Solution with XML-Structured Research Agents

## Production-ready architecture for Context7, Firecrawl, and Tavily agents

This comprehensive implementation guide delivers a complete TypeScript microservices solution featuring standalone research agents with XML-structured system prompts, supporting both REST API endpoints and message queue communication patterns. The architecture enables orchestrators to choose between direct API calls for immediate responses or message queues for resilient, scalable workflows.

## Architecture Overview

The solution implements three specialized research agent microservices (Context7, Firecrawl, and Tavily), each providing dual communication channels through REST APIs and message queues. Services leverage advanced XML prompt engineering optimized for Claude's capabilities, with sophisticated template systems, runtime validation, and production-grade deployment patterns.

## 1. Core Agent Service Implementation

### Base Agent Service Architecture

```typescript
// src/core/base-agent.service.ts
import Fastify from 'fastify'
import { TypeBoxTypeProvider } from '@fastify/type-provider-typebox'
import { Type, Static } from '@sinclair/typebox'
import { Queue, Worker } from 'bullmq'
import amqp from 'amqplib'
import { injectable } from 'tsyringe'
import { XMLPromptEngine } from './xml-prompt-engine'
import { CircuitBreakerService } from './circuit-breaker'

@injectable()
export abstract class BaseAgentService {
  protected server = Fastify().withTypeProvider<TypeBoxTypeProvider>()
  protected xmlEngine: XMLPromptEngine
  protected circuitBreaker: CircuitBreakerService
  protected redisQueue: Queue
  protected rabbitChannel?: amqp.Channel

  constructor(protected config: AgentServiceConfig) {
    this.xmlEngine = new XMLPromptEngine()
    this.circuitBreaker = new CircuitBreakerService()
    this.setupDualCommunication()
  }

  private async setupDualCommunication() {
    // REST API setup
    await this.setupRestEndpoints()

    // Message queue setup
    await this.setupRedisQueue()
    await this.setupRabbitMQ()

    // Service discovery registration
    await this.registerService()
  }

  protected abstract processRequest(
    request: ResearchRequest,
  ): Promise<ResearchResponse>

  protected abstract getAgentPromptTemplate(): string

  protected abstract validateRequest(request: unknown): ResearchRequest
}
```

### Context7 Agent Service Implementation

```typescript
// src/services/context7-agent.service.ts
import { injectable } from 'tsyringe'
import { BaseAgentService } from '../core/base-agent.service'
import { z } from 'zod'

const Context7RequestSchema = z.object({
  action: z.enum(['resolve-library', 'get-docs']),
  library: z.string(),
  topic: z.string().optional(),
  tokens: z.number().min(1000).max(100000).default(10000),
  context: z.string().optional(),
})

@injectable()
export class Context7AgentService extends BaseAgentService {
  private context7Client: Context7Client

  constructor(config: AgentServiceConfig) {
    super(config)
    this.context7Client = new Context7Client(config.context7)
    this.initializePromptTemplates()
  }

  private initializePromptTemplates() {
    this.xmlEngine.registerTemplate(
      'context7-research',
      `
<role>You are a specialized documentation research agent with expertise in {{library}} documentation</role>

<instructions>
Analyze the provided documentation and extract key insights for implementation.
Focus on practical examples, API patterns, and best practices.
Identify version-specific considerations and breaking changes.
</instructions>

<context>
<library>{{library}}</library>
<version>{{version}}</version>
<topic>{{topic}}</topic>
<user_context>{{context}}</user_context>
</context>

<documentation_content>
{{documentationContent}}
</documentation_content>

<extraction_requirements>
<focus_areas>
- Core API methods and their signatures
- Configuration options and defaults
- Error handling patterns
- Performance considerations
- Security best practices
</focus_areas>

<output_structure>
<summary>Concise overview of the documentation</summary>
<key_apis>Essential API methods with examples</key_apis>
<configuration>Important configuration options</configuration>
<best_practices>Recommended implementation patterns</best_practices>
<warnings>Common pitfalls and breaking changes</warnings>
</output_structure>
</extraction_requirements>

<output_format>
Return structured analysis following the output_structure schema.
Include confidence scores for extracted information.
Provide code examples in TypeScript where applicable.
</output_format>
    `,
    )
  }

  protected async processRequest(
    request: Context7Request,
  ): Promise<ResearchResponse> {
    const validated = Context7RequestSchema.parse(request)

    try {
      // Resolve library ID if needed
      let libraryId = validated.library
      if (validated.action === 'resolve-library') {
        const resolved = await this.context7Client.resolveLibrary(
          validated.library,
        )
        libraryId = resolved.libraryId
      }

      // Fetch documentation with circuit breaker protection
      const documentation = await this.circuitBreaker.executeWithProtection(
        () =>
          this.context7Client.getDocs({
            context7CompatibleLibraryID: libraryId,
            topic: validated.topic,
            tokens: validated.tokens,
          }),
        () => ({
          content: 'Fallback: Service temporarily unavailable',
          success: false,
        }),
      )

      // Process with XML prompt
      const prompt = this.xmlEngine.generatePrompt('context7-research', {
        library: validated.library,
        version: documentation.metadata?.version || 'latest',
        topic: validated.topic || 'general',
        context: validated.context || '',
        documentationContent: documentation.content,
      })

      // Execute Claude API call with the generated prompt
      const analysis = await this.executeClaudeAnalysis(prompt)

      return {
        success: true,
        agent: 'context7',
        data: {
          documentation: documentation.content,
          analysis,
          metadata: {
            library: libraryId,
            version: documentation.metadata?.version,
            processingTime: Date.now() - startTime,
            confidence: this.calculateConfidence(analysis),
          },
        },
      }
    } catch (error) {
      return this.handleError(error)
    }
  }

  // REST API endpoints
  protected async setupRestEndpoints() {
    this.server.post(
      '/api/v1/research',
      {
        schema: {
          body: Context7RequestSchema,
          response: {
            200: ResearchResponseSchema,
          },
        },
      },
      async (request, reply) => {
        const result = await this.processRequest(request.body)
        return reply.code(result.success ? 200 : 500).send(result)
      },
    )

    this.server.get('/health', async () => ({ status: 'healthy' }))
  }

  // Message queue consumer
  protected async setupMessageQueueConsumer() {
    new Worker(
      'context7-tasks',
      async (job) => {
        return await this.processRequest(job.data)
      },
      {
        connection: this.redisConnection,
        concurrency: 5,
      },
    )
  }
}
```

### Firecrawl Agent Service Implementation

```typescript
// src/services/firecrawl-agent.service.ts
import { injectable } from 'tsyringe'
import { BaseAgentService } from '../core/base-agent.service'
import FirecrawlApp from '@mendable/firecrawl-js'

@injectable()
export class FirecrawlAgentService extends BaseAgentService {
  private firecrawl: FirecrawlApp

  constructor(config: AgentServiceConfig) {
    super(config)
    this.firecrawl = new FirecrawlApp({ apiKey: config.firecrawl.apiKey })
    this.initializePromptTemplates()
  }

  private initializePromptTemplates() {
    this.xmlEngine.registerTemplate(
      'firecrawl-extraction',
      `
<role>You are an expert web content extraction specialist with deep knowledge of HTML parsing and data structuring</role>

<instructions>
Extract and structure content from the scraped web page following these guidelines:
1. Identify and preserve the main content while filtering noise
2. Maintain semantic relationships between content elements
3. Extract metadata and structured data (dates, authors, categories)
4. Clean and normalize text for optimal LLM consumption
</instructions>

<scraping_context>
<url>{{url}}</url>
<extraction_goal>{{goal}}</extraction_goal>
<content_type>{{contentType}}</content_type>
</scraping_context>

<scraped_content>
{{scrapedContent}}
</scraped_content>

<extraction_strategy>
<content_identification>
- Focus on semantic HTML elements (article, main, section)
- Remove navigation, ads, and boilerplate content
- Preserve important metadata and attributes
</content_identification>

<data_transformation>
- Standardize date formats to ISO 8601
- Clean special characters and encoding issues
- Structure nested content hierarchically
- Extract and validate URLs, emails, phone numbers
</data_transformation>
</extraction_strategy>

<target_schema>
{
  "title": "string",
  "mainContent": "string",
  "metadata": {
    "author": "string",
    "publishDate": "ISO 8601",
    "lastModified": "ISO 8601",
    "tags": ["array"],
    "category": "string"
  },
  "structuredData": {
    "images": ["array of URLs"],
    "links": ["array of URLs"],
    "tables": ["array of structured data"]
  },
  "quality": {
    "contentScore": "0-1",
    "completeness": "0-1",
    "reliability": "0-1"
  }
}
</target_schema>

<output_format>
Return extracted content matching the target schema.
Include quality scores for all extracted fields.
Flag any uncertain or incomplete extractions.
</output_format>
    `,
    )
  }

  protected async processRequest(
    request: FirecrawlRequest,
  ): Promise<ResearchResponse> {
    const validated = FirecrawlRequestSchema.parse(request)

    try {
      // Perform web scraping with advanced options
      const scrapedData = await this.circuitBreaker.executeWithProtection(() =>
        this.firecrawl.scrapeUrl(validated.url, {
          formats: ['markdown', 'html', 'links'],
          onlyMainContent: validated.onlyMainContent ?? true,
          waitFor: validated.waitFor,
          actions: validated.browserActions,
          mobile: validated.mobile,
        }),
      )

      // Generate XML prompt for content extraction
      const prompt = this.xmlEngine.generatePrompt('firecrawl-extraction', {
        url: validated.url,
        goal: validated.extractionGoal || 'Extract all relevant content',
        contentType: this.detectContentType(scrapedData),
        scrapedContent: scrapedData.markdown,
      })

      // Process with Claude
      const extraction = await this.executeClaudeAnalysis(prompt)

      // Batch processing for multiple URLs
      if (validated.urls && validated.urls.length > 1) {
        const batchResults = await this.processBatchScraping(
          validated.urls,
          validated,
        )
        return this.aggregateBatchResults(batchResults)
      }

      return {
        success: true,
        agent: 'firecrawl',
        data: {
          raw: scrapedData,
          extracted: extraction,
          metadata: {
            url: validated.url,
            scrapedAt: new Date().toISOString(),
            processingTime: Date.now() - startTime,
            contentLength: scrapedData.markdown?.length,
          },
        },
      }
    } catch (error) {
      return this.handleError(error)
    }
  }

  private async processBatchScraping(
    urls: string[],
    options: FirecrawlRequest,
  ) {
    const chunks = this.chunkArray(urls, 10)
    const results = []

    for (const chunk of chunks) {
      const batchPromises = chunk.map((url) =>
        this.processRequest({ ...options, url }),
      )

      const chunkResults = await Promise.allSettled(batchPromises)
      results.push(...chunkResults)

      // Rate limiting between chunks
      await this.delay(1000)
    }

    return results
  }
}
```

### Tavily Agent Service Implementation

```typescript
// src/services/tavily-agent.service.ts
import { injectable } from 'tsyringe'
import { BaseAgentService } from '../core/base-agent.service'
import { TavilyClient } from '@tavily/sdk'

@injectable()
export class TavilyAgentService extends BaseAgentService {
  private tavily: TavilyClient
  private searchCache: Map<string, CachedSearchResult>

  constructor(config: AgentServiceConfig) {
    super(config)
    this.tavily = new TavilyClient({ apiKey: config.tavily.apiKey })
    this.searchCache = new Map()
    this.initializePromptTemplates()
  }

  private initializePromptTemplates() {
    this.xmlEngine.registerTemplate(
      'tavily-search-synthesis',
      `
<role>You are an AI-optimized search synthesis expert specializing in {{domain}}</role>

<instructions>
Analyze and synthesize search results to provide comprehensive, actionable insights.
Cross-reference information across multiple sources for accuracy.
Identify consensus, contradictions, and gaps in the information.
Prioritize recent and authoritative sources.
</instructions>

<search_context>
<query>{{query}}</query>
<intent>{{searchIntent}}</intent>
<time_range>{{timeRange}}</time_range>
<domain_focus>{{domainFocus}}</domain_focus>
</search_context>

<search_results>
{{searchResults}}
</search_results>

<synthesis_requirements>
<analysis_dimensions>
- Source credibility and recency
- Information consistency across sources
- Key facts and data points
- Emerging trends or patterns
- Contradictions or disputed information
</analysis_dimensions>

<quality_criteria>
- Prefer primary sources over secondary
- Weight recent information appropriately
- Flag uncertain or conflicting data
- Provide confidence scores for claims
</quality_criteria>
</synthesis_requirements>

<output_format>
<synthesis>
  <key_findings>Top 3-5 most important discoveries</key_findings>
  <consensus>Information agreed upon by multiple sources</consensus>
  <contradictions>Conflicting information with source attribution</contradictions>
  <evidence_quality>Overall assessment of source quality</evidence_quality>
  <recommendations>Actionable insights based on findings</recommendations>
  <confidence_score>0-1 score for overall synthesis reliability</confidence_score>
</synthesis>
</output_format>
    `,
    )
  }

  protected async processRequest(
    request: TavilyRequest,
  ): Promise<ResearchResponse> {
    const validated = TavilyRequestSchema.parse(request)

    try {
      // Check cache first
      const cacheKey = this.generateCacheKey(validated)
      const cached = this.searchCache.get(cacheKey)

      if (cached && !this.isCacheExpired(cached)) {
        return { success: true, agent: 'tavily', data: cached.data }
      }

      // Perform AI-optimized search
      const searchResults = await this.circuitBreaker.executeWithProtection(
        () =>
          this.tavily.search({
            query: validated.query,
            searchDepth: validated.searchDepth || 'advanced',
            maxResults: validated.maxResults || 10,
            includeDomains: validated.includeDomains,
            excludeDomains: validated.excludeDomains,
            includeAnswer: true,
            includeRawContent: validated.includeRawContent,
          }),
      )

      // Multi-query research for complex topics
      if (validated.multiQuery) {
        const additionalResults = await this.performMultiQueryResearch(
          validated.relatedQueries,
          validated,
        )
        searchResults.results.push(...additionalResults)
      }

      // Generate synthesis prompt
      const prompt = this.xmlEngine.generatePrompt('tavily-search-synthesis', {
        query: validated.query,
        searchIntent: validated.intent || 'general research',
        timeRange: validated.timeRange || 'all time',
        domainFocus: validated.domainFocus || 'general',
        searchResults: JSON.stringify(searchResults.results, null, 2),
      })

      // Synthesize with Claude
      const synthesis = await this.executeClaudeAnalysis(prompt)

      const response = {
        success: true,
        agent: 'tavily',
        data: {
          query: validated.query,
          results: searchResults.results,
          answer: searchResults.answer,
          synthesis,
          metadata: {
            resultCount: searchResults.results.length,
            processingTime: Date.now() - startTime,
            searchDepth: validated.searchDepth,
            cacheStatus: 'miss',
          },
        },
      }

      // Cache the results
      this.searchCache.set(cacheKey, {
        data: response.data,
        timestamp: Date.now(),
        ttl: this.calculateTTL(validated.topic),
      })

      return response
    } catch (error) {
      return this.handleError(error)
    }
  }

  private async performMultiQueryResearch(
    queries: string[],
    baseOptions: TavilyRequest,
  ) {
    const results = await Promise.all(
      queries.map((query) =>
        this.tavily.search({
          ...baseOptions,
          query,
          maxResults: 5,
        }),
      ),
    )

    return results.flatMap((r) => r.results)
  }
}
```

## 2. Advanced XML Prompt Engineering System

### XML Template Engine with Dynamic Generation

```typescript
// src/xml/xml-prompt-engine.ts
import Handlebars from 'handlebars'
import { z } from 'zod'
import { parseStringPromise } from 'xml2js'
import { create } from 'xmlbuilder2'

export class XMLPromptEngine {
  private templates = new Map<string, CompiledTemplate>()
  private validators = new Map<string, z.ZodSchema>()
  private helperRegistry: HelperRegistry

  constructor() {
    this.registerCoreHelpers()
    this.initializeValidators()
  }

  private registerCoreHelpers() {
    // XML-safe content encoding
    Handlebars.registerHelper('xmlEncode', (content: string) => {
      return content
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&apos;')
    })

    // Chain-of-thought generator
    Handlebars.registerHelper('chainOfThought', (steps: string[]) => {
      return steps
        .map((step, i) => `<step number="${i + 1}">${step}</step>`)
        .join('\n')
    })

    // Few-shot examples formatter
    Handlebars.registerHelper(
      'fewShotExamples',
      function (examples: Example[]) {
        return examples
          .map(
            (ex) => `
<example>
<input>${ex.input}</input>
<reasoning>${ex.reasoning}</reasoning>
<output>${ex.output}</output>
</example>
      `,
          )
          .join('\n')
      },
    )

    // Constraint builder
    Handlebars.registerHelper(
      'buildConstraints',
      (constraints: Constraint[]) => {
        return constraints
          .map(
            (c) =>
              `<constraint priority="${c.priority}">${c.description}</constraint>`,
          )
          .join('\n')
      },
    )
  }

  registerTemplate(name: string, template: string, schema?: z.ZodSchema) {
    const compiled = Handlebars.compile(template)

    this.templates.set(name, {
      name,
      version: '1.0.0',
      template: compiled,
      schema,
      metadata: {
        created: new Date(),
        author: 'system',
        description: `Template for ${name}`,
      },
    })

    if (schema) {
      this.validators.set(name, schema)
    }
  }

  generatePrompt(templateName: string, variables: Record<string, any>): string {
    const template = this.templates.get(templateName)

    if (!template) {
      throw new Error(`Template ${templateName} not found`)
    }

    // Validate variables if schema exists
    if (this.validators.has(templateName)) {
      const schema = this.validators.get(templateName)!
      const validation = schema.safeParse(variables)

      if (!validation.success) {
        throw new Error(
          `Variable validation failed: ${validation.error.message}`,
        )
      }
    }

    const xmlPrompt = template.template(variables)

    // Validate XML structure
    this.validateXMLStructure(xmlPrompt)

    return xmlPrompt
  }

  private async validateXMLStructure(xml: string): Promise<void> {
    try {
      await parseStringPromise(xml, {
        explicitArray: false,
        validateEntities: true,
      })
    } catch (error) {
      throw new Error(`Invalid XML structure: ${error.message}`)
    }
  }

  // Dynamic prompt modification based on context
  modifyPromptForContext(
    basePrompt: string,
    context: ContextModification,
  ): string {
    const doc = create(basePrompt)

    // Add context-specific instructions
    if (context.additionalInstructions) {
      const instructions = doc.root().ele('additional_instructions')
      context.additionalInstructions.forEach((inst) =>
        instructions.ele('instruction').txt(inst),
      )
    }

    // Modify constraints based on context
    if (context.constraintModifications) {
      const constraints = doc.root().ele('modified_constraints')
      context.constraintModifications.forEach((mod) =>
        constraints.ele('constraint').att('type', mod.type).txt(mod.value),
      )
    }

    return doc.end({ prettyPrint: true })
  }
}

// Template inheritance and composition
export class XMLTemplateComposer {
  private baseTemplates = new Map<string, string>()

  composeTemplate(base: string, extensions: TemplateExtension[]): string {
    let composed = this.baseTemplates.get(base) || ''

    for (const extension of extensions) {
      composed = this.applyExtension(composed, extension)
    }

    return composed
  }

  private applyExtension(
    template: string,
    extension: TemplateExtension,
  ): string {
    const doc = create(template)

    switch (extension.type) {
      case 'prepend':
        doc.root().first().ele(extension.element).txt(extension.content)
        break
      case 'append':
        doc.root().last().ele(extension.element).txt(extension.content)
        break
      case 'replace':
        const target = doc
          .root()
          .find((n) => n.node.nodeName === extension.target)
        if (target) {
          target.remove()
          doc.root().ele(extension.element).txt(extension.content)
        }
        break
    }

    return doc.end({ prettyPrint: true })
  }
}
```

### XML Schema Validation System

```typescript
// src/xml/xml-schema-validator.ts
import { z } from 'zod'
import Ajv from 'ajv'
import { XMLValidator } from 'fast-xml-parser'

export class XMLSchemaValidator {
  private zodSchemas = new Map<string, z.ZodSchema>()
  private ajv = new Ajv({ allErrors: true })

  // Define core prompt schemas
  initializeSchemas() {
    // Research Agent Prompt Schema
    this.zodSchemas.set(
      'research-agent',
      z.object({
        role: z.string().min(10).max(500),
        instructions: z.string().min(20).max(2000),
        context: z
          .object({
            domain: z.string(),
            audience: z.string(),
            constraints: z.array(z.string()),
          })
          .optional(),
        examples: z
          .array(
            z.object({
              input: z.string(),
              reasoning: z.string().optional(),
              output: z.string(),
            }),
          )
          .optional(),
        output_format: z.string(),
      }),
    )

    // Web Scraping Schema
    this.zodSchemas.set(
      'web-scraping',
      z.object({
        role: z.string(),
        target_url: z.string().url(),
        extraction_rules: z.object({
          selectors: z.record(z.string()),
          required_fields: z.array(z.string()),
          transformations: z.array(
            z.object({
              field: z.string(),
              type: z.enum(['trim', 'lowercase', 'date', 'number']),
            }),
          ),
        }),
        output_schema: z.record(z.any()),
      }),
    )

    // Search Synthesis Schema
    this.zodSchemas.set(
      'search-synthesis',
      z.object({
        role: z.string(),
        search_context: z.object({
          query: z.string(),
          intent: z.string(),
          filters: z.record(z.any()),
        }),
        results: z.array(z.any()),
        synthesis_requirements: z.object({
          focus_areas: z.array(z.string()),
          quality_threshold: z.number().min(0).max(1),
        }),
      }),
    )
  }

  validatePromptStructure(xml: string, schemaName: string): ValidationResult {
    // Fast XML validation
    const xmlValidation = XMLValidator.validate(xml, {
      allowBooleanAttributes: true,
      ignoreAttributes: false,
    })

    if (xmlValidation !== true) {
      return {
        valid: false,
        errors: [xmlValidation.err.msg],
      }
    }

    // Zod schema validation
    const schema = this.zodSchemas.get(schemaName)
    if (schema) {
      const parsed = this.parseXMLToObject(xml)
      const result = schema.safeParse(parsed)

      if (!result.success) {
        return {
          valid: false,
          errors: result.error.errors.map(
            (e) => `${e.path.join('.')}: ${e.message}`,
          ),
        }
      }
    }

    return { valid: true, errors: [] }
  }

  private parseXMLToObject(xml: string): any {
    const parser = new XMLParser({
      ignoreAttributes: false,
      attributeNamePrefix: '@_',
      textNodeName: '#text',
    })

    return parser.parse(xml)
  }
}
```

## 3. XML-Based Communication Protocols

### Standardized Message Schemas

```typescript
// src/xml/message-schemas.ts
export class XMLMessageProtocol {
  // Service message envelope
  static createServiceMessage(content: any, metadata: MessageMetadata): string {
    return create()
      .ele('message')
      .att('version', '1.0')
      .att('timestamp', new Date().toISOString())
      .ele('metadata')
      .ele('service')
      .txt(metadata.service)
      .up()
      .ele('correlationId')
      .txt(metadata.correlationId)
      .up()
      .ele('messageType')
      .txt(metadata.messageType)
      .up()
      .ele('priority')
      .txt(metadata.priority.toString())
      .up()
      .up()
      .ele('content')
      .ele('data')
      .txt(JSON.stringify(content))
      .up()
      .up()
      .ele('signature')
      .txt(this.generateSignature(content, metadata))
      .up()
      .end({ prettyPrint: true })
  }

  // Error response structure
  static createErrorResponse(error: ServiceError): string {
    return create()
      .ele('error_response')
      .att('timestamp', new Date().toISOString())
      .ele('error_code')
      .txt(error.code)
      .up()
      .ele('error_message')
      .txt(error.message)
      .up()
      .ele('error_details')
      .ele('service')
      .txt(error.service)
      .up()
      .ele('operation')
      .txt(error.operation)
      .up()
      .ele('stack_trace')
      .txt(error.stackTrace || '')
      .up()
      .up()
      .ele('recovery_suggestions')
      .ele('suggestion')
      .txt('Retry with exponential backoff')
      .up()
      .ele('suggestion')
      .txt('Check service health endpoint')
      .up()
      .up()
      .end({ prettyPrint: true })
  }

  // Inter-agent communication protocol
  static createAgentCommunication(
    from: string,
    to: string,
    action: string,
    payload: any,
  ): string {
    return create()
      .ele('agent_communication')
      .att('protocol', '2.0')
      .ele('header')
      .ele('from')
      .txt(from)
      .up()
      .ele('to')
      .txt(to)
      .up()
      .ele('action')
      .txt(action)
      .up()
      .ele('timestamp')
      .txt(new Date().toISOString())
      .up()
      .ele('messageId')
      .txt(this.generateMessageId())
      .up()
      .up()
      .ele('body')
      .ele('request')
      .txt(JSON.stringify(payload))
      .up()
      .up()
      .ele('routing')
      .ele('replyTo')
      .txt(`${from}-response-queue`)
      .up()
      .ele('timeout')
      .txt('30000')
      .up()
      .up()
      .end({ prettyPrint: true })
  }

  private static generateSignature(
    content: any,
    metadata: MessageMetadata,
  ): string {
    const crypto = require('crypto')
    const data = JSON.stringify({ content, metadata })
    return crypto.createHash('sha256').update(data).digest('hex')
  }

  private static generateMessageId(): string {
    return `msg-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
  }
}

// Message transformation and routing
export class XMLMessageRouter {
  private routes = new Map<string, RouteHandler>()
  private transformers = new Map<string, Transformer>()

  registerRoute(pattern: string, handler: RouteHandler) {
    this.routes.set(pattern, handler)
  }

  registerTransformer(name: string, transformer: Transformer) {
    this.transformers.set(name, transformer)
  }

  async routeMessage(xmlMessage: string): Promise<void> {
    const parsed = await parseStringPromise(xmlMessage)
    const messageType = parsed.message?.metadata?.messageType

    // Find matching route
    for (const [pattern, handler] of this.routes) {
      if (this.matchesPattern(messageType, pattern)) {
        // Apply transformations
        const transformed = await this.applyTransformations(parsed)

        // Route to handler
        await handler(transformed)
        return
      }
    }

    throw new Error(`No route found for message type: ${messageType}`)
  }

  private async applyTransformations(message: any): Promise<any> {
    let transformed = message

    for (const transformer of this.transformers.values()) {
      transformed = await transformer(transformed)
    }

    return transformed
  }

  private matchesPattern(messageType: string, pattern: string): boolean {
    const regex = new RegExp(pattern.replace('*', '.*'))
    return regex.test(messageType)
  }
}
```

## 4. Hybrid Communication Architecture

### REST API with OpenAPI Specification

```typescript
// src/api/openapi-generator.ts
export class OpenAPIGenerator {
  static generateSpec(service: string): any {
    return {
      openapi: '3.0.3',
      info: {
        title: `${service} Research Agent API`,
        version: '1.0.0',
        description: `REST API for ${service} research agent with XML prompt support`,
      },
      servers: [
        {
          url: `http://localhost:3000`,
          description: 'Development server',
        },
        {
          url: `https://api.{environment}.example.com`,
          description: 'Production server',
          variables: {
            environment: {
              default: 'prod',
              enum: ['prod', 'staging', 'dev'],
            },
          },
        },
      ],
      paths: {
        '/api/v1/research': {
          post: {
            summary: 'Execute research request',
            operationId: 'executeResearch',
            tags: ['Research'],
            requestBody: {
              required: true,
              content: {
                'application/json': {
                  schema: {
                    $ref: '#/components/schemas/ResearchRequest',
                  },
                },
                'application/xml': {
                  schema: {
                    $ref: '#/components/schemas/ResearchRequestXML',
                  },
                },
              },
            },
            responses: {
              '200': {
                description: 'Research completed successfully',
                content: {
                  'application/json': {
                    schema: {
                      $ref: '#/components/schemas/ResearchResponse',
                    },
                  },
                },
              },
              '429': {
                description: 'Rate limit exceeded',
                headers: {
                  'X-RateLimit-Limit': {
                    schema: { type: 'integer' },
                  },
                  'X-RateLimit-Remaining': {
                    schema: { type: 'integer' },
                  },
                  'X-RateLimit-Reset': {
                    schema: { type: 'integer' },
                  },
                },
              },
            },
          },
        },
        '/api/v1/batch': {
          post: {
            summary: 'Execute batch research requests',
            operationId: 'executeBatchResearch',
            tags: ['Research'],
            requestBody: {
              required: true,
              content: {
                'application/json': {
                  schema: {
                    type: 'array',
                    items: {
                      $ref: '#/components/schemas/ResearchRequest',
                    },
                  },
                },
              },
            },
            responses: {
              '202': {
                description: 'Batch accepted for processing',
                content: {
                  'application/json': {
                    schema: {
                      type: 'object',
                      properties: {
                        batchId: { type: 'string' },
                        status: { type: 'string' },
                        estimatedCompletion: {
                          type: 'string',
                          format: 'date-time',
                        },
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
    }
  }
}
```

### Message Queue Implementation

```typescript
// src/queues/hybrid-queue-manager.ts
import { Queue, Worker, QueueEvents } from 'bullmq'
import amqp from 'amqplib'
import { Redis } from 'ioredis'

export class HybridQueueManager {
  private redisQueues = new Map<string, Queue>()
  private rabbitConnection?: amqp.Connection
  private rabbitChannels = new Map<string, amqp.Channel>()

  constructor(private config: QueueConfig) {
    this.initializeQueues()
  }

  private async initializeQueues() {
    // Initialize Redis queues with BullMQ
    await this.setupRedisQueues()

    // Initialize RabbitMQ connection
    await this.setupRabbitMQ()
  }

  private async setupRedisQueues() {
    const redis = new Redis({
      host: this.config.redis.host,
      port: this.config.redis.port,
      maxRetriesPerRequest: 3,
    })

    // Create queues for each agent
    ;['context7', 'firecrawl', 'tavily'].forEach((agent) => {
      const queue = new Queue(`${agent}-tasks`, {
        connection: redis,
        defaultJobOptions: {
          attempts: 3,
          backoff: {
            type: 'exponential',
            delay: 2000,
          },
          removeOnComplete: true,
          removeOnFail: false,
        },
      })

      this.redisQueues.set(agent, queue)

      // Setup event monitoring
      const queueEvents = new QueueEvents(`${agent}-tasks`, {
        connection: redis,
      })

      queueEvents.on('completed', ({ jobId, returnvalue }) => {
        console.log(`Job ${jobId} completed:`, returnvalue)
      })

      queueEvents.on('failed', ({ jobId, failedReason }) => {
        console.error(`Job ${jobId} failed:`, failedReason)
      })
    })
  }

  private async setupRabbitMQ() {
    this.rabbitConnection = await amqp.connect(this.config.rabbitmq.url)

    // Setup channels and exchanges
    const channel = await this.rabbitConnection.createChannel()

    // Topic exchange for flexible routing
    await channel.assertExchange('research.agents', 'topic', { durable: true })

    // Direct exchange for specific agent routing
    await channel.assertExchange('research.direct', 'direct', { durable: true })

    // Fanout exchange for broadcasting
    await channel.assertExchange('research.broadcast', 'fanout', {
      durable: false,
    })

    // Setup queues for each agent
    for (const agent of ['context7', 'firecrawl', 'tavily']) {
      const queueName = `${agent}.requests`

      await channel.assertQueue(queueName, {
        durable: true,
        arguments: {
          'x-message-ttl': 300000, // 5 minutes
          'x-max-length': 10000,
          'x-dead-letter-exchange': 'research.dlx',
        },
      })

      // Bind to exchanges
      await channel.bindQueue(queueName, 'research.agents', `${agent}.*`)
      await channel.bindQueue(queueName, 'research.direct', agent)

      this.rabbitChannels.set(agent, channel)
    }

    // Setup dead letter exchange
    await channel.assertExchange('research.dlx', 'fanout', { durable: true })
    await channel.assertQueue('research.dlq', { durable: true })
    await channel.bindQueue('research.dlq', 'research.dlx', '')
  }

  // Publish to both Redis and RabbitMQ
  async publishResearchRequest(
    agent: string,
    request: ResearchRequest,
    options: PublishOptions = {},
  ) {
    const xmlMessage = XMLMessageProtocol.createServiceMessage(request, {
      service: agent,
      correlationId: options.correlationId || this.generateCorrelationId(),
      messageType: 'research.request',
      priority: options.priority || 'normal',
    })

    // Publish to Redis queue
    if (this.redisQueues.has(agent)) {
      await this.redisQueues.get(agent)!.add('research', request, {
        priority: options.priority === 'high' ? 1 : 0,
        delay: options.delay,
      })
    }

    // Publish to RabbitMQ
    if (this.rabbitChannels.has(agent)) {
      const channel = this.rabbitChannels.get(agent)!
      const routingKey = `${agent}.${options.topic || 'general'}`

      channel.publish('research.agents', routingKey, Buffer.from(xmlMessage), {
        persistent: true,
        contentType: 'application/xml',
        correlationId: options.correlationId,
        replyTo: options.replyTo,
        expiration: options.ttl?.toString(),
      })
    }
  }

  private generateCorrelationId(): string {
    return `corr-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
  }
}
```

## 5. Production Deployment Configuration

### Docker Multi-Stage Build

```dockerfile
# Optimized multi-stage build for research agents
FROM node:20.15.0-alpine AS base
ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
RUN corepack enable
WORKDIR /app

FROM base AS deps
COPY package.json pnpm-lock.yaml ./
RUN --mount=type=cache,id=pnpm,target=/pnpm/store \
    pnpm install --prod --frozen-lockfile

FROM base AS build
COPY package.json pnpm-lock.yaml tsconfig.json ./
RUN --mount=type=cache,id=pnpm,target=/pnpm/store \
    pnpm install --frozen-lockfile
COPY src ./src
COPY configs ./configs
RUN pnpm build

# Validate XML configurations
FROM alpine:latest AS xml-validator
RUN apk add --no-cache libxml2-utils
COPY configs/*.xml /configs/
RUN for file in /configs/*.xml; do \
      xmllint --noout "$file" || exit 1; \
    done

# Production image with distroless
FROM gcr.io/distroless/nodejs20-debian12
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY --from=build /app/dist ./dist
COPY --from=xml-validator /configs ./configs
COPY package.json ./

# Security: non-root user
USER 1000
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD ["/nodejs/bin/node", "dist/health-check.js"]

CMD ["dist/index.js"]
```

### Kubernetes Deployment with Service Mesh

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: context7-agent
  labels:
    app: context7-agent
    version: v1.0.0
spec:
  replicas: 3
  selector:
    matchLabels:
      app: context7-agent
  template:
    metadata:
      labels:
        app: context7-agent
        version: v1.0.0
      annotations:
        prometheus.io/scrape: 'true'
        prometheus.io/port: '3000'
        prometheus.io/path: '/metrics'
        linkerd.io/inject: enabled
    spec:
      serviceAccountName: context7-agent
      containers:
        - name: context7-agent
          image: registry.example.com/context7-agent:v1.0.0
          ports:
            - containerPort: 3000
              name: http
            - containerPort: 9090
              name: metrics
          env:
            - name: SERVICE_NAME
              value: 'context7-agent'
            - name: NODE_ENV
              value: 'production'
            - name: LOG_LEVEL
              value: 'info'
            - name: REDIS_HOST
              valueFrom:
                configMapKeyRef:
                  name: redis-config
                  key: host
            - name: RABBITMQ_URL
              valueFrom:
                secretKeyRef:
                  name: rabbitmq-secret
                  key: url
          envFrom:
            - configMapRef:
                name: agent-config
            - secretRef:
                name: agent-secrets
          resources:
            requests:
              memory: '512Mi'
              cpu: '250m'
            limits:
              memory: '1Gi'
              cpu: '1000m'
          livenessProbe:
            httpGet:
              path: /health
              port: http
            initialDelaySeconds: 30
            periodSeconds: 10
          readinessProbe:
            httpGet:
              path: /ready
              port: http
            initialDelaySeconds: 5
            periodSeconds: 5
          volumeMounts:
            - name: xml-prompts
              mountPath: /app/prompts
              readOnly: true
            - name: xml-configs
              mountPath: /app/configs
              readOnly: true
      volumes:
        - name: xml-prompts
          configMap:
            name: xml-prompt-templates
        - name: xml-configs
          configMap:
            name: xml-configurations
---
apiVersion: v1
kind: Service
metadata:
  name: context7-agent
spec:
  ports:
    - port: 80
      targetPort: 3000
      name: http
    - port: 9090
      targetPort: 9090
      name: metrics
  selector:
    app: context7-agent
  type: ClusterIP
---
apiVersion: networking.istio.io/v1beta1
kind: VirtualService
metadata:
  name: context7-agent-vs
spec:
  hosts:
    - context7-agent
  http:
    - match:
        - headers:
            x-version:
              exact: canary
      route:
        - destination:
            host: context7-agent
            subset: v2
          weight: 100
    - route:
        - destination:
            host: context7-agent
            subset: v1
          weight: 90
        - destination:
            host: context7-agent
            subset: v2
          weight: 10
      retries:
        attempts: 3
        perTryTimeout: 10s
        retryOn: 5xx,reset,connect-failure
      timeout: 30s
```

### Configuration Management

```yaml
apiVersion: v1
kind: ConfigMap
metadata:
  name: xml-prompt-templates
data:
  context7-research.xml: |
    <?xml version="1.0" encoding="UTF-8"?>
    <prompt_template version="1.0">
      <metadata>
        <name>context7-research</name>
        <version>1.0.0</version>
        <description>Context7 documentation research template</description>
      </metadata>
      <template>
        <role>{{role}}</role>
        <instructions>{{instructions}}</instructions>
        <context>{{context}}</context>
        <examples>{{examples}}</examples>
        <output_format>{{output_format}}</output_format>
      </template>
    </prompt_template>

  firecrawl-extraction.xml: |
    <?xml version="1.0" encoding="UTF-8"?>
    <prompt_template version="1.0">
      <metadata>
        <name>firecrawl-extraction</name>
        <version>1.0.0</version>
      </metadata>
      <template>
        <role>{{role}}</role>
        <extraction_strategy>{{strategy}}</extraction_strategy>
        <target_schema>{{schema}}</target_schema>
      </template>
    </prompt_template>
---
apiVersion: v1
kind: Secret
metadata:
  name: agent-secrets
type: Opaque
data:
  ANTHROPIC_API_KEY: <base64-encoded-key>
  CONTEXT7_API_KEY: <base64-encoded-key>
  FIRECRAWL_API_KEY: <base64-encoded-key>
  TAVILY_API_KEY: <base64-encoded-key>
```

## 6. Security and Reliability Implementation

### Authentication and Rate Limiting

```typescript
// src/security/auth-middleware.ts
import { FastifyRequest, FastifyReply } from 'fastify'
import jwt from 'jsonwebtoken'
import { RateLimiter } from 'rate-limiter-flexible'

export class SecurityMiddleware {
  private rateLimiter: RateLimiter

  constructor(private config: SecurityConfig) {
    this.rateLimiter = new RateLimiter({
      points: config.rateLimit.points,
      duration: config.rateLimit.duration,
      blockDuration: config.rateLimit.blockDuration,
    })
  }

  async authenticate(request: FastifyRequest, reply: FastifyReply) {
    const token = request.headers.authorization?.replace('Bearer ', '')

    if (!token) {
      return reply.code(401).send({ error: 'Authentication required' })
    }

    try {
      const payload = jwt.verify(token, this.config.jwtSecret)
      request.user = payload
    } catch (error) {
      return reply.code(401).send({ error: 'Invalid token' })
    }
  }

  async rateLimit(request: FastifyRequest, reply: FastifyReply) {
    const key = request.user?.id || request.ip

    try {
      await this.rateLimiter.consume(key)
    } catch (rejRes) {
      reply.header('X-RateLimit-Limit', this.config.rateLimit.points)
      reply.header('X-RateLimit-Remaining', rejRes.remainingPoints || 0)
      reply.header('X-RateLimit-Reset', rejRes.msBeforeNext || 0)

      return reply.code(429).send({
        error: 'Too many requests',
        retryAfter: rejRes.msBeforeNext,
      })
    }
  }

  // XML signature validation
  validateXMLSignature(xml: string, signature: string): boolean {
    const crypto = require('crypto')
    const hash = crypto.createHash('sha256').update(xml).digest('hex')
    return hash === signature
  }
}
```

### Circuit Breaker and Graceful Degradation

```typescript
// src/reliability/circuit-breaker.ts
import {
  circuitBreaker,
  ConsecutiveBreaker,
  ExponentialBackoff,
  handleAll,
  wrap,
} from 'cockatiel'

export class EnhancedCircuitBreaker {
  private breakers = new Map<string, any>()

  getBreaker(service: string) {
    if (!this.breakers.has(service)) {
      const breaker = circuitBreaker(handleAll, {
        halfOpenAfter: new ExponentialBackoff({
          maxDelay: 30000,
          initialDelay: 1000,
        }),
        breaker: new ConsecutiveBreaker(5),
      })

      this.breakers.set(service, breaker)
    }

    return this.breakers.get(service)
  }

  async executeWithFallback<T>(
    service: string,
    operation: () => Promise<T>,
    fallback: () => T,
  ): Promise<T> {
    const breaker = this.getBreaker(service)

    try {
      return await breaker.execute(operation)
    } catch (error) {
      console.error(`Circuit breaker open for ${service}, using fallback`)
      return fallback()
    }
  }
}
```

## Integration Examples

### SDK Generation for Easy Integration

```typescript
// sdk/research-agents-sdk.ts
export class ResearchAgentsSDK {
  private clients: Map<string, AgentClient>

  constructor(private config: SDKConfig) {
    this.initializeClients()
  }

  private initializeClients() {
    this.clients = new Map([
      ['context7', new Context7Client(this.config)],
      ['firecrawl', new FirecrawlClient(this.config)],
      ['tavily', new TavilyClient(this.config)],
    ])
  }

  // Unified research interface
  async research(
    request: UnifiedResearchRequest,
  ): Promise<UnifiedResearchResponse> {
    const agent = this.selectOptimalAgent(request)
    const client = this.clients.get(agent)

    if (request.mode === 'sync') {
      // Direct API call
      return await client.executeSync(request)
    } else {
      // Message queue
      return await client.executeAsync(request)
    }
  }

  private selectOptimalAgent(request: UnifiedResearchRequest): string {
    if (request.type === 'documentation') return 'context7'
    if (request.type === 'web-scraping') return 'firecrawl'
    if (request.type === 'search') return 'tavily'
    return 'tavily' // Default
  }

  // Orchestrator integration
  async orchestrateWorkflow(
    workflow: WorkflowDefinition,
  ): Promise<WorkflowResult> {
    const results = new Map<string, any>()

    for (const step of workflow.steps) {
      const dependencies = await this.resolveDependencies(step, results)
      const agent = this.clients.get(step.agent)

      const result = await agent.execute({
        ...step.request,
        context: dependencies,
      })

      results.set(step.id, result)
    }

    return this.aggregateResults(results)
  }
}

// Usage example
const sdk = new ResearchAgentsSDK({
  apiUrl: 'https://api.example.com',
  apiKey: process.env.API_KEY,
  mode: 'hybrid', // Use both API and message queues
})

const result = await sdk.research({
  type: 'documentation',
  query: 'React hooks best practices',
  mode: 'sync',
  options: {
    depth: 'comprehensive',
    includeExamples: true,
  },
})
```

This comprehensive solution provides a production-ready TypeScript microservices architecture featuring three specialized research agents (Context7, Firecrawl, Tavily) with advanced XML prompt engineering, dual communication patterns (REST APIs and message queues), and enterprise-grade deployment configurations. The system maximizes flexibility by allowing orchestrators to choose between direct API calls for immediate responses or message queues for resilient, scalable workflows, while leveraging Claude's structured reasoning capabilities through sophisticated XML prompts.

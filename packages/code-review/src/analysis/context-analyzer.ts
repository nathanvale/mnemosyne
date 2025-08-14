import type {
  RiskLevel,
  OWASPCategory,
  CWECategory,
} from '../types/analysis.js'
import type {
  CodeRabbitAnalysis,
  CodeRabbitFinding,
} from '../types/coderabbit.js'
import type { GitHubPRContext, GitHubFileChange } from '../types/github.js'

/**
 * File context classification
 */
export interface FileContext {
  type: FileType
  framework: FrameworkType | null
  businessDomain: BusinessDomain | null
  securitySensitivity: SecuritySensitivity
  testRelated: boolean
  configurationFile: boolean
  apiEndpoint: boolean
  databaseRelated: boolean
  userInterface: boolean
}

/**
 * File type classification
 */
export enum FileType {
  SOURCE_CODE = 'source_code',
  TEST_FILE = 'test_file',
  CONFIG_FILE = 'config_file',
  DOCUMENTATION = 'documentation',
  BUILD_SCRIPT = 'build_script',
  DATABASE_MIGRATION = 'database_migration',
  API_SCHEMA = 'api_schema',
  INFRASTRUCTURE = 'infrastructure',
}

/**
 * Framework detection
 */
export enum FrameworkType {
  REACT = 'react',
  NEXTJS = 'nextjs',
  EXPRESS = 'express',
  NESTJS = 'nestjs',
  PRISMA = 'prisma',
  TAILWIND = 'tailwind',
  TYPESCRIPT = 'typescript',
  NODE = 'node',
}

/**
 * Business domain classification
 */
export enum BusinessDomain {
  AUTHENTICATION = 'authentication',
  AUTHORIZATION = 'authorization',
  PAYMENT_PROCESSING = 'payment_processing',
  USER_MANAGEMENT = 'user_management',
  DATA_PROCESSING = 'data_processing',
  API_GATEWAY = 'api_gateway',
  LOGGING_MONITORING = 'logging_monitoring',
  FILE_UPLOAD = 'file_upload',
  EMAIL_COMMUNICATION = 'email_communication',
  SEARCH_INDEXING = 'search_indexing',
}

/**
 * Security sensitivity levels
 */
export enum SecuritySensitivity {
  CRITICAL = 'critical', // Authentication, payment, admin
  HIGH = 'high', // User data, API endpoints
  MEDIUM = 'medium', // Business logic, utilities
  LOW = 'low', // UI components, configs
  MINIMAL = 'minimal', // Tests, documentation
}

/**
 * Context-aware analysis pattern
 */
export interface AnalysisPattern {
  id: string
  name: string
  description: string
  contexts: Partial<FileContext>[]
  securityRules: SecurityRule[]
  performanceRules: PerformanceRule[]
  maintainabilityRules: MaintainabilityRule[]
  priority: number
}

/**
 * Security-specific analysis rule
 */
export interface SecurityRule {
  id: string
  title: string
  description: string
  pattern: RegExp | string
  severity: RiskLevel
  owaspCategory?: OWASPCategory
  cweCategory?: CWECategory
  condition?: (context: FileContext, finding: CodeRabbitFinding) => boolean
  recommendation: string
}

/**
 * Performance-specific analysis rule
 */
export interface PerformanceRule {
  id: string
  title: string
  description: string
  pattern: RegExp | string
  impact: 'low' | 'medium' | 'high' | 'critical'
  condition?: (context: FileContext, finding: CodeRabbitFinding) => boolean
  recommendation: string
}

/**
 * Maintainability-specific analysis rule
 */
export interface MaintainabilityRule {
  id: string
  title: string
  description: string
  pattern: RegExp | string
  complexity: 'low' | 'medium' | 'high'
  condition?: (context: FileContext, finding: CodeRabbitFinding) => boolean
  recommendation: string
}

/**
 * Context-aware analysis results
 */
export interface ContextAnalysisResults {
  fileContexts: Map<string, FileContext>
  appliedPatterns: AnalysisPattern[]
  contextSpecificFindings: ContextSpecificFinding[]
  businessRiskAssessment: BusinessRiskAssessment
  architecturalInsights: ArchitecturalInsight[]
}

/**
 * Context-specific finding with enhanced metadata
 */
export interface ContextSpecificFinding {
  id: string
  originalFinding: CodeRabbitFinding
  context: FileContext
  pattern: AnalysisPattern
  adjustedSeverity: RiskLevel
  businessImpact: BusinessImpact
  architecturalConcern: boolean
  recommendation: string
  priority: number
}

/**
 * Business impact assessment
 */
export interface BusinessImpact {
  level: 'critical' | 'high' | 'medium' | 'low'
  area: BusinessDomain[]
  userImpact: 'none' | 'low' | 'medium' | 'high' | 'critical'
  reputationRisk: boolean
  complianceRisk: boolean
  financialRisk: boolean
}

/**
 * Business risk assessment across the entire PR
 */
export interface BusinessRiskAssessment {
  overallRisk: RiskLevel
  affectedDomains: BusinessDomain[]
  criticalPathsAffected: string[]
  userExperienceImpact: 'none' | 'low' | 'medium' | 'high'
  dataSecurityRisk: boolean
  complianceImplications: string[]
}

/**
 * Architectural insights from the PR
 */
export interface ArchitecturalInsight {
  type:
    | 'pattern_violation'
    | 'design_concern'
    | 'scalability_issue'
    | 'coupling_issue'
  title: string
  description: string
  files: string[]
  severity: RiskLevel
  recommendation: string
}

/**
 * Context-aware analyzer implementing intelligent pattern recognition
 */
export class ContextAnalyzer {
  private static patterns: AnalysisPattern[] = [
    // Authentication context patterns
    {
      id: 'auth-security-patterns',
      name: 'Authentication Security Patterns',
      description: 'Security patterns specific to authentication code',
      contexts: [
        {
          businessDomain: BusinessDomain.AUTHENTICATION,
          securitySensitivity: SecuritySensitivity.CRITICAL,
        },
      ],
      securityRules: [
        {
          id: 'hardcoded-auth-secrets',
          title: 'Hardcoded Authentication Secrets',
          description: 'Hardcoded secrets in authentication logic',
          pattern: /(jwt_secret|auth_key|private_key)\s*=\s*['"][^'"]+['"]/gi,
          severity: 'critical',
          owaspCategory: 'A07_identification_authentication_failures',
          cweCategory: 'CWE-798',
          recommendation:
            'Move authentication secrets to environment variables with proper rotation policies',
        },
        {
          id: 'weak-password-validation',
          title: 'Weak Password Validation',
          description: 'Insufficient password strength requirements',
          pattern: /password.*length.*[<>]\s*[1-7]/gi,
          severity: 'high',
          owaspCategory: 'A07_identification_authentication_failures',
          recommendation:
            'Implement strong password requirements (min 12 chars, complexity)',
        },
      ],
      performanceRules: [],
      maintainabilityRules: [],
      priority: 1,
    },
    // Payment processing patterns
    {
      id: 'payment-security-patterns',
      name: 'Payment Security Patterns',
      description: 'Security patterns for payment processing code',
      contexts: [
        {
          businessDomain: BusinessDomain.PAYMENT_PROCESSING,
          securitySensitivity: SecuritySensitivity.CRITICAL,
        },
      ],
      securityRules: [
        {
          id: 'pci-data-exposure',
          title: 'PCI Data Exposure Risk',
          description: 'Potential exposure of payment card industry data',
          pattern:
            /(card_number|cvv|credit_card).*log|console\.log.*(?:card|payment)/gi,
          severity: 'critical',
          owaspCategory: 'A03_injection',
          recommendation:
            'Never log payment data. Implement secure tokenization.',
        },
        {
          id: 'payment-amount-validation',
          title: 'Payment Amount Validation',
          description: 'Insufficient validation of payment amounts',
          pattern: /amount.*parseInt|parseFloat.*amount/gi,
          severity: 'high',
          recommendation:
            'Use decimal libraries for monetary calculations to prevent precision errors',
        },
      ],
      performanceRules: [],
      maintainabilityRules: [],
      priority: 1,
    },
    // API endpoint patterns
    {
      id: 'api-endpoint-patterns',
      name: 'API Endpoint Security Patterns',
      description: 'Security patterns for API endpoints',
      contexts: [
        {
          apiEndpoint: true,
          securitySensitivity: SecuritySensitivity.HIGH,
        },
      ],
      securityRules: [
        {
          id: 'missing-rate-limiting',
          title: 'Missing Rate Limiting',
          description: 'API endpoint without rate limiting',
          pattern: /app\.(get|post|put|delete)\(.*\)\s*{[^}]*(?!rateLimit)/gi,
          severity: 'medium',
          owaspCategory: 'A01_broken_access_control',
          recommendation: 'Implement rate limiting to prevent abuse',
        },
        {
          id: 'missing-input-validation',
          title: 'Missing Input Validation',
          description: 'API endpoint without proper input validation',
          pattern: /req\.(body|query|params)(?!.*validate)/gi,
          severity: 'high',
          owaspCategory: 'A03_injection',
          recommendation:
            'Implement comprehensive input validation using schema validation',
        },
      ],
      performanceRules: [
        {
          id: 'sync-database-calls',
          title: 'Synchronous Database Calls',
          description: 'Blocking database calls in API endpoints',
          pattern: /(?:findSync|querySync|executeSync)/gi,
          impact: 'high',
          recommendation:
            'Use asynchronous database operations to prevent blocking',
        },
      ],
      maintainabilityRules: [],
      priority: 2,
    },
    // React component patterns
    {
      id: 'react-security-patterns',
      name: 'React Security Patterns',
      description: 'Security patterns for React components',
      contexts: [
        {
          framework: FrameworkType.REACT,
          userInterface: true,
        },
      ],
      securityRules: [
        {
          id: 'dangerous-html',
          title: 'Dangerous HTML Rendering',
          description: 'Unsafe HTML rendering in React components',
          pattern: /dangerouslySetInnerHTML.*\{\s*__html:\s*[^}]*\}/gi,
          severity: 'high',
          owaspCategory: 'A03_injection',
          cweCategory: 'CWE-79',
          recommendation:
            'Sanitize HTML content before rendering or use safe alternatives',
        },
        {
          id: 'exposed-sensitive-props',
          title: 'Exposed Sensitive Props',
          description: 'Sensitive data passed as props',
          pattern: /(password|secret|token|key)=\{[^}]*\}/gi,
          severity: 'medium',
          recommendation:
            'Avoid passing sensitive data through props; use secure state management',
        },
      ],
      performanceRules: [
        {
          id: 'missing-memo',
          title: 'Missing React.memo Optimization',
          description: 'Component not optimized with React.memo',
          pattern: /export.*function.*Component.*{/gi,
          impact: 'medium',
          condition: (context, finding) => {
            // Only apply if component receives props
            return (
              finding.location.file.includes('Component') &&
              !finding.description.includes('memo')
            )
          },
          recommendation:
            'Consider using React.memo for components that receive stable props',
        },
      ],
      maintainabilityRules: [],
      priority: 2,
    },
    // Database patterns
    {
      id: 'database-patterns',
      name: 'Database Security Patterns',
      description: 'Security patterns for database operations',
      contexts: [
        {
          databaseRelated: true,
          securitySensitivity: SecuritySensitivity.HIGH,
        },
      ],
      securityRules: [
        {
          id: 'sql-injection-raw-queries',
          title: 'SQL Injection in Raw Queries',
          description: 'Raw SQL queries vulnerable to injection',
          pattern: /\$\{.*\}.*(?:SELECT|INSERT|UPDATE|DELETE)/gi,
          severity: 'critical',
          owaspCategory: 'A03_injection',
          cweCategory: 'CWE-89',
          recommendation:
            'Use parameterized queries or ORM methods instead of string interpolation',
        },
        {
          id: 'missing-transaction',
          title: 'Missing Transaction Wrapper',
          description: 'Multiple database operations without transaction',
          pattern: /(?:INSERT|UPDATE|DELETE).*(?:INSERT|UPDATE|DELETE)/gi,
          severity: 'medium',
          recommendation:
            'Wrap related database operations in transactions for data consistency',
        },
      ],
      performanceRules: [
        {
          id: 'n-plus-one-query',
          title: 'Potential N+1 Query Problem',
          description: 'Queries inside loops that may cause N+1 problem',
          pattern: /for.*(?:find|query|select)/gi,
          impact: 'high',
          recommendation:
            'Use batch queries or includes/joins to prevent N+1 query issues',
        },
      ],
      maintainabilityRules: [],
      priority: 2,
    },
  ]

  /**
   * Perform context-aware analysis of PR
   */
  static async analyzeWithContext(
    githubContext: GitHubPRContext,
    codeRabbitAnalysis?: CodeRabbitAnalysis,
  ): Promise<ContextAnalysisResults> {
    // Step 1: Analyze file contexts
    const fileContexts = new Map<string, FileContext>()
    for (const file of githubContext.files) {
      const context = this.analyzeFileContext(file)
      fileContexts.set(file.filename, context)
    }

    // Step 2: Apply relevant patterns based on contexts
    const appliedPatterns = this.selectRelevantPatterns(fileContexts)

    // Step 3: Generate context-specific findings
    const contextSpecificFindings = this.generateContextSpecificFindings(
      appliedPatterns,
      fileContexts,
      codeRabbitAnalysis?.findings || [],
    )

    // Step 4: Assess business risk
    const businessRiskAssessment = this.assessBusinessRisk(
      fileContexts,
      contextSpecificFindings,
    )

    // Step 5: Generate architectural insights
    const architecturalInsights = this.generateArchitecturalInsights(
      fileContexts,
      githubContext.files,
    )

    return {
      fileContexts,
      appliedPatterns,
      contextSpecificFindings,
      businessRiskAssessment,
      architecturalInsights,
    }
  }

  /**
   * Analyze individual file context
   */
  private static analyzeFileContext(file: GitHubFileChange): FileContext {
    const filename = file.filename.toLowerCase()
    const fileExtension = filename.split('.').pop() || ''

    // Determine file type
    const type = this.classifyFileType(filename, fileExtension)

    // Detect framework
    const framework = this.detectFramework(filename, file.patch)

    // Classify business domain
    const businessDomain = this.classifyBusinessDomain(filename, file.patch)

    // Assess security sensitivity
    const securitySensitivity = this.assessSecuritySensitivity(
      type,
      businessDomain,
      filename,
    )

    // Analyze file characteristics
    const testRelated = this.isTestRelated(filename)
    const configurationFile = this.isConfigurationFile(filename, fileExtension)
    const apiEndpoint = this.isApiEndpoint(filename, file.patch)
    const databaseRelated = this.isDatabaseRelated(filename, file.patch)
    const userInterface = this.isUserInterface(filename, framework)

    return {
      type,
      framework,
      businessDomain,
      securitySensitivity,
      testRelated,
      configurationFile,
      apiEndpoint,
      databaseRelated,
      userInterface,
    }
  }

  /**
   * File type classification
   */
  private static classifyFileType(
    filename: string,
    extension: string,
  ): FileType {
    if (filename.includes('test') || filename.includes('spec')) {
      return FileType.TEST_FILE
    }

    if (['json', 'yml', 'yaml', 'toml', 'env'].includes(extension)) {
      return FileType.CONFIG_FILE
    }

    if (['md', 'txt', 'rst'].includes(extension)) {
      return FileType.DOCUMENTATION
    }

    if (filename.includes('migration') || filename.includes('schema')) {
      return FileType.DATABASE_MIGRATION
    }

    if (filename.includes('dockerfile') || filename.includes('.ci')) {
      return FileType.INFRASTRUCTURE
    }

    if (['ts', 'js', 'tsx', 'jsx', 'py', 'go', 'rs'].includes(extension)) {
      return FileType.SOURCE_CODE
    }

    return FileType.SOURCE_CODE
  }

  /**
   * Framework detection
   */
  private static detectFramework(
    filename: string,
    patch?: string,
  ): FrameworkType | null {
    const content = (patch || '').toLowerCase()

    if (content.includes('import react') || content.includes('from "react"')) {
      return FrameworkType.REACT
    }

    if (content.includes('next/') || filename.includes('next.config')) {
      return FrameworkType.NEXTJS
    }

    if (content.includes('express') || content.includes('app.get(')) {
      return FrameworkType.EXPRESS
    }

    if (content.includes('@nestjs') || content.includes('@controller')) {
      return FrameworkType.NESTJS
    }

    if (content.includes('prisma') || filename.includes('prisma')) {
      return FrameworkType.PRISMA
    }

    if (content.includes('tailwind') || filename.includes('tailwind')) {
      return FrameworkType.TAILWIND
    }

    if (filename.endsWith('.ts') || filename.endsWith('.tsx')) {
      return FrameworkType.TYPESCRIPT
    }

    if (filename.includes('package.json') || content.includes('require(')) {
      return FrameworkType.NODE
    }

    return null
  }

  /**
   * Business domain classification
   */
  private static classifyBusinessDomain(
    filename: string,
    patch?: string,
  ): BusinessDomain | null {
    const content = `${filename} ${patch || ''}`.toLowerCase()

    if (
      content.includes('auth') ||
      content.includes('login') ||
      content.includes('signup')
    ) {
      return BusinessDomain.AUTHENTICATION
    }

    if (
      content.includes('permission') ||
      content.includes('role') ||
      content.includes('access')
    ) {
      return BusinessDomain.AUTHORIZATION
    }

    if (
      content.includes('payment') ||
      content.includes('stripe') ||
      content.includes('billing')
    ) {
      return BusinessDomain.PAYMENT_PROCESSING
    }

    if (content.includes('user') && !content.includes('auth')) {
      return BusinessDomain.USER_MANAGEMENT
    }

    if (content.includes('api') || content.includes('endpoint')) {
      return BusinessDomain.API_GATEWAY
    }

    if (
      content.includes('log') ||
      content.includes('monitor') ||
      content.includes('metric')
    ) {
      return BusinessDomain.LOGGING_MONITORING
    }

    if (content.includes('upload') || content.includes('file')) {
      return BusinessDomain.FILE_UPLOAD
    }

    if (
      content.includes('email') ||
      content.includes('mail') ||
      content.includes('smtp')
    ) {
      return BusinessDomain.EMAIL_COMMUNICATION
    }

    if (
      content.includes('search') ||
      content.includes('index') ||
      content.includes('elastic')
    ) {
      return BusinessDomain.SEARCH_INDEXING
    }

    return BusinessDomain.DATA_PROCESSING
  }

  /**
   * Security sensitivity assessment
   */
  private static assessSecuritySensitivity(
    type: FileType,
    domain: BusinessDomain | null,
    filename: string,
  ): SecuritySensitivity {
    if (type === FileType.TEST_FILE || type === FileType.DOCUMENTATION) {
      return SecuritySensitivity.MINIMAL
    }

    if (
      domain === BusinessDomain.AUTHENTICATION ||
      domain === BusinessDomain.PAYMENT_PROCESSING
    ) {
      return SecuritySensitivity.CRITICAL
    }

    if (
      domain === BusinessDomain.AUTHORIZATION ||
      domain === BusinessDomain.USER_MANAGEMENT ||
      domain === BusinessDomain.API_GATEWAY
    ) {
      return SecuritySensitivity.HIGH
    }

    if (filename.includes('admin') || filename.includes('config')) {
      return SecuritySensitivity.HIGH
    }

    if (type === FileType.CONFIG_FILE) {
      return SecuritySensitivity.LOW
    }

    return SecuritySensitivity.MEDIUM
  }

  /**
   * Test file detection
   */
  private static isTestRelated(filename: string): boolean {
    return (
      filename.includes('test') ||
      filename.includes('spec') ||
      filename.includes('__tests__')
    )
  }

  /**
   * Configuration file detection
   */
  private static isConfigurationFile(
    filename: string,
    extension: string,
  ): boolean {
    return (
      ['json', 'yml', 'yaml', 'toml', 'env', 'config'].includes(extension) ||
      filename.includes('config')
    )
  }

  /**
   * API endpoint detection
   */
  private static isApiEndpoint(filename: string, patch?: string): boolean {
    const content = (patch || '').toLowerCase()
    return (
      content.includes('app.get(') ||
      content.includes('app.post(') ||
      content.includes('@controller') ||
      filename.includes('api') ||
      filename.includes('route')
    )
  }

  /**
   * Database-related file detection
   */
  private static isDatabaseRelated(filename: string, patch?: string): boolean {
    const content = `${filename} ${patch || ''}`.toLowerCase()
    return (
      content.includes('database') ||
      content.includes('migration') ||
      content.includes('schema') ||
      content.includes('prisma') ||
      content.includes('sql')
    )
  }

  /**
   * User interface file detection
   */
  private static isUserInterface(
    filename: string,
    framework: FrameworkType | null,
  ): boolean {
    return (
      framework === FrameworkType.REACT ||
      framework === FrameworkType.NEXTJS ||
      filename.includes('component') ||
      filename.includes('page') ||
      filename.endsWith('.tsx') ||
      filename.endsWith('.jsx')
    )
  }

  /**
   * Select relevant patterns based on file contexts
   */
  private static selectRelevantPatterns(
    fileContexts: Map<string, FileContext>,
  ): AnalysisPattern[] {
    const relevantPatterns: AnalysisPattern[] = []

    for (const pattern of this.patterns) {
      let isRelevant = false

      // Check if pattern matches any file context
      for (const [, context] of fileContexts) {
        if (this.matchesContext(pattern.contexts, context)) {
          isRelevant = true
          break
        }
      }

      if (isRelevant) {
        relevantPatterns.push(pattern)
      }
    }

    // Sort by priority (higher priority first)
    return relevantPatterns.sort((a, b) => a.priority - b.priority)
  }

  /**
   * Check if pattern contexts match file context
   */
  private static matchesContext(
    patternContexts: Partial<FileContext>[],
    fileContext: FileContext,
  ): boolean {
    return patternContexts.some((patternContext) => {
      return Object.entries(patternContext).every(([key, value]) => {
        return fileContext[key as keyof FileContext] === value
      })
    })
  }

  /**
   * Generate context-specific findings
   */
  private static generateContextSpecificFindings(
    patterns: AnalysisPattern[],
    fileContexts: Map<string, FileContext>,
    findings: CodeRabbitFinding[],
  ): ContextSpecificFinding[] {
    const contextFindings: ContextSpecificFinding[] = []
    let findingCounter = 0

    for (const pattern of patterns) {
      for (const [filename, context] of fileContexts) {
        if (this.matchesContext(pattern.contexts, context)) {
          // Apply pattern rules to findings in this file
          const fileFindings = findings.filter(
            (f) => f.location.file === filename,
          )

          for (const finding of fileFindings) {
            for (const rule of pattern.securityRules) {
              if (this.matchesRule(rule, context, finding)) {
                contextFindings.push({
                  id: `context-finding-${++findingCounter}`,
                  originalFinding: finding,
                  context,
                  pattern,
                  adjustedSeverity: this.adjustSeverityForContext(
                    rule.severity,
                    context,
                  ),
                  businessImpact: this.assessBusinessImpact(
                    context,
                    rule.severity,
                  ),
                  architecturalConcern: this.isArchitecturalConcern(rule),
                  recommendation: rule.recommendation,
                  priority: this.calculatePriority(rule.severity, context),
                })
              }
            }
          }
        }
      }
    }

    return contextFindings.sort((a, b) => b.priority - a.priority)
  }

  /**
   * Check if security rule matches
   */
  private static matchesRule(
    rule: SecurityRule,
    context: FileContext,
    finding: CodeRabbitFinding,
  ): boolean {
    // Check if rule condition is met
    if (rule.condition && !rule.condition(context, finding)) {
      return false
    }

    // Check pattern match
    if (typeof rule.pattern === 'string') {
      return finding.description
        .toLowerCase()
        .includes(rule.pattern.toLowerCase())
    }

    return rule.pattern.test(finding.description)
  }

  /**
   * Adjust severity based on context
   */
  private static adjustSeverityForContext(
    baseSeverity: RiskLevel,
    context: FileContext,
  ): RiskLevel {
    if (context.testRelated) {
      // Reduce severity for test files
      const severityMap: Record<RiskLevel, RiskLevel> = {
        critical: 'high',
        high: 'medium',
        medium: 'low',
        low: 'low',
      }
      return severityMap[baseSeverity]
    }

    if (context.securitySensitivity === SecuritySensitivity.CRITICAL) {
      // Increase severity for critical security contexts
      const severityMap: Record<RiskLevel, RiskLevel> = {
        critical: 'critical',
        high: 'critical',
        medium: 'high',
        low: 'medium',
      }
      return severityMap[baseSeverity]
    }

    return baseSeverity
  }

  /**
   * Assess business impact of finding
   */
  private static assessBusinessImpact(
    context: FileContext,
    severity: RiskLevel,
  ): BusinessImpact {
    const level = severity as BusinessImpact['level']
    const area = context.businessDomain ? [context.businessDomain] : []

    return {
      level,
      area,
      userImpact: this.mapSeverityToUserImpact(severity),
      reputationRisk:
        context.securitySensitivity === SecuritySensitivity.CRITICAL,
      complianceRisk:
        context.businessDomain === BusinessDomain.PAYMENT_PROCESSING,
      financialRisk:
        context.businessDomain === BusinessDomain.PAYMENT_PROCESSING ||
        context.businessDomain === BusinessDomain.AUTHENTICATION,
    }
  }

  /**
   * Map severity to user impact
   */
  private static mapSeverityToUserImpact(
    severity: RiskLevel,
  ): BusinessImpact['userImpact'] {
    const impactMap: Record<RiskLevel, BusinessImpact['userImpact']> = {
      critical: 'critical',
      high: 'high',
      medium: 'medium',
      low: 'low',
    }
    return impactMap[severity]
  }

  /**
   * Check if rule indicates architectural concern
   */
  private static isArchitecturalConcern(rule: SecurityRule): boolean {
    return (
      rule.description.includes('pattern') ||
      rule.description.includes('architecture') ||
      rule.description.includes('design')
    )
  }

  /**
   * Calculate priority score
   */
  private static calculatePriority(
    severity: RiskLevel,
    context: FileContext,
  ): number {
    let priority = 0

    // Base priority from severity
    const severityPriority: Record<RiskLevel, number> = {
      critical: 100,
      high: 75,
      medium: 50,
      low: 25,
    }
    priority += severityPriority[severity]

    // Context modifiers
    if (context.securitySensitivity === SecuritySensitivity.CRITICAL) {
      priority += 25
    }

    if (context.testRelated) {
      priority -= 20
    }

    if (context.apiEndpoint) {
      priority += 15
    }

    return Math.max(0, priority)
  }

  /**
   * Assess overall business risk
   */
  private static assessBusinessRisk(
    fileContexts: Map<string, FileContext>,
    findings: ContextSpecificFinding[],
  ): BusinessRiskAssessment {
    const affectedDomains = new Set<BusinessDomain>()
    const criticalFindings = findings.filter(
      (f) => f.adjustedSeverity === 'critical',
    )

    // Collect affected domains
    for (const [, context] of fileContexts) {
      if (context.businessDomain) {
        affectedDomains.add(context.businessDomain)
      }
    }

    // Assess overall risk
    let overallRisk: RiskLevel = 'low'
    if (criticalFindings.length > 0) {
      overallRisk = 'critical'
    } else if (
      findings.filter((f) => f.adjustedSeverity === 'high').length > 2
    ) {
      overallRisk = 'high'
    } else if (findings.length > 5) {
      overallRisk = 'medium'
    }

    return {
      overallRisk,
      affectedDomains: Array.from(affectedDomains),
      criticalPathsAffected: this.identifyCriticalPaths(fileContexts),
      userExperienceImpact: this.assessUserExperienceImpact(fileContexts),
      dataSecurityRisk: this.assessDataSecurityRisk(fileContexts, findings),
      complianceImplications: this.identifyComplianceImplications(
        Array.from(affectedDomains),
      ),
    }
  }

  /**
   * Identify critical paths affected by changes
   */
  private static identifyCriticalPaths(
    fileContexts: Map<string, FileContext>,
  ): string[] {
    const criticalPaths: string[] = []

    for (const [filename, context] of fileContexts) {
      if (
        context.securitySensitivity === SecuritySensitivity.CRITICAL ||
        context.businessDomain === BusinessDomain.AUTHENTICATION ||
        context.businessDomain === BusinessDomain.PAYMENT_PROCESSING
      ) {
        criticalPaths.push(filename)
      }
    }

    return criticalPaths
  }

  /**
   * Assess user experience impact
   */
  private static assessUserExperienceImpact(
    fileContexts: Map<string, FileContext>,
  ): BusinessRiskAssessment['userExperienceImpact'] {
    let hasUIChanges = false
    let hasAPIChanges = false

    for (const [, context] of fileContexts) {
      if (context.userInterface) hasUIChanges = true
      if (context.apiEndpoint) hasAPIChanges = true
    }

    if (hasUIChanges && hasAPIChanges) return 'high'
    if (hasUIChanges || hasAPIChanges) return 'medium'
    return 'low'
  }

  /**
   * Assess data security risk
   */
  private static assessDataSecurityRisk(
    fileContexts: Map<string, FileContext>,
    findings: ContextSpecificFinding[],
  ): boolean {
    const hasSecurityFindings = findings.some(
      (f) => f.adjustedSeverity === 'critical',
    )
    const hasDatabaseChanges = Array.from(fileContexts.values()).some(
      (c) => c.databaseRelated,
    )
    const hasAuthChanges = Array.from(fileContexts.values()).some(
      (c) => c.businessDomain === BusinessDomain.AUTHENTICATION,
    )

    return hasSecurityFindings || (hasDatabaseChanges && hasAuthChanges)
  }

  /**
   * Identify compliance implications
   */
  private static identifyComplianceImplications(
    affectedDomains: BusinessDomain[],
  ): string[] {
    const implications: string[] = []

    if (affectedDomains.includes(BusinessDomain.PAYMENT_PROCESSING)) {
      implications.push('PCI DSS compliance review required')
    }

    if (affectedDomains.includes(BusinessDomain.USER_MANAGEMENT)) {
      implications.push('GDPR/Privacy regulation compliance check needed')
    }

    if (affectedDomains.includes(BusinessDomain.AUTHENTICATION)) {
      implications.push('Security audit recommended for authentication changes')
    }

    return implications
  }

  /**
   * Generate architectural insights
   */
  private static generateArchitecturalInsights(
    fileContexts: Map<string, FileContext>,
    files: GitHubFileChange[],
  ): ArchitecturalInsight[] {
    const insights: ArchitecturalInsight[] = []

    // Check for coupling issues
    if (this.detectTightCoupling(fileContexts)) {
      insights.push({
        type: 'coupling_issue',
        title: 'Tight Coupling Detected',
        description:
          'Multiple business domains modified in single PR may indicate tight coupling',
        files: Array.from(fileContexts.keys()),
        severity: 'medium',
        recommendation:
          'Consider refactoring to separate concerns and reduce coupling',
      })
    }

    // Check for scalability concerns
    if (this.detectScalabilityConcerns(files)) {
      insights.push({
        type: 'scalability_issue',
        title: 'Scalability Concerns',
        description: 'Changes may impact system scalability',
        files: files.filter((f) => f.additions > 500).map((f) => f.filename),
        severity: 'medium',
        recommendation: 'Review performance implications of large changes',
      })
    }

    return insights
  }

  /**
   * Detect tight coupling between components
   */
  private static detectTightCoupling(
    fileContexts: Map<string, FileContext>,
  ): boolean {
    const domains = new Set<BusinessDomain>()

    for (const [, context] of fileContexts) {
      if (context.businessDomain) {
        domains.add(context.businessDomain)
      }
    }

    return domains.size > 3 // More than 3 business domains affected
  }

  /**
   * Detect potential scalability concerns
   */
  private static detectScalabilityConcerns(files: GitHubFileChange[]): boolean {
    return files.some((f) => f.additions > 500 || f.changes > 1000)
  }
}

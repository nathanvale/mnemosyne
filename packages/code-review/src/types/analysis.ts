import { z } from 'zod'

import type { PrioritizedIssue } from '../analysis/issue-prioritizer'
import type { CodeRabbitFinding, CodeRabbitAnalysis } from './coderabbit'
import type { GitHubPRContext } from './github'

/**
 * Analysis decision outcome
 */
export const AnalysisDecision = z.enum([
  'approve',
  'conditional_approval',
  'request_changes',
  'security_block',
])
export type AnalysisDecision = z.infer<typeof AnalysisDecision>

/**
 * Risk level assessment
 */
export const RiskLevel = z.enum(['critical', 'high', 'medium', 'low'])
export type RiskLevel = z.infer<typeof RiskLevel>

/**
 * OWASP Top 10 categories
 */
export const OWASPCategory = z.enum([
  'A01_broken_access_control',
  'A02_cryptographic_failures',
  'A03_injection',
  'A04_insecure_design',
  'A05_security_misconfiguration',
  'A06_vulnerable_components',
  'A07_identification_authentication_failures',
  'A08_software_data_integrity_failures',
  'A09_security_logging_monitoring_failures',
  'A10_server_side_request_forgery',
])
export type OWASPCategory = z.infer<typeof OWASPCategory>

/**
 * CWE (Common Weakness Enumeration) categories
 */
export const CWECategory = z.enum([
  'CWE-79', // Cross-site Scripting
  'CWE-89', // SQL Injection
  'CWE-20', // Improper Input Validation
  'CWE-125', // Out-of-bounds Read
  'CWE-119', // Buffer Overflow
  'CWE-22', // Path Traversal
  'CWE-352', // Cross-Site Request Forgery
  'CWE-434', // Unrestricted Upload of File with Dangerous Type
  'CWE-94', // Improper Control of Generation of Code
  'CWE-200', // Exposure of Sensitive Information
  'CWE-798', // Use of Hard-coded Credentials
])
export type CWECategory = z.infer<typeof CWECategory>

/**
 * SANS Top 25 categories
 */
export const SANSCategory = z.enum([
  'CWE-79', // Cross-site Scripting
  'CWE-89', // SQL Injection
  'CWE-20', // Improper Input Validation
  'CWE-125', // Out-of-bounds Read
  'CWE-119', // Buffer Overflow
  'CWE-22', // Path Traversal
  'CWE-352', // Cross-Site Request Forgery
  'CWE-434', // Unrestricted Upload of File with Dangerous Type
  'CWE-94', // Improper Control of Generation of Code
  'CWE-200', // Exposure of Sensitive Information
  'CWE-798', // Use of Hard-coded Credentials
])
export type SANSCategory = z.infer<typeof SANSCategory>

/**
 * Security risk levels
 */
export const SecurityRiskLevel = z.enum(['critical', 'high', 'medium', 'low'])
export type SecurityRiskLevel = z.infer<typeof SecurityRiskLevel>

/**
 * Individual security finding
 */
export const SecurityFinding = z.object({
  id: z.string(),
  title: z.string(),
  description: z.string(),
  severity: SecurityRiskLevel,
  confidence: z.enum(['very_high', 'high', 'medium', 'low', 'very_low']),
  file: z.string(),
  line: z.number(),
  owaspCategory: OWASPCategory.optional(),
  sansCategory: SANSCategory.optional(),
  cweCategory: CWECategory.optional(),
  cweId: z.string().optional(),
  cvssScore: z.number().optional(),
  exploitability: SecurityRiskLevel.optional(),
  impact: SecurityRiskLevel.optional(),
  remediation: z.string(),
  source: z.enum([
    'coderabbit',
    'github-security-advisory',
    'pattern-analysis',
  ]),
})
export type SecurityFinding = z.infer<typeof SecurityFinding>

/**
 * Validated finding with expert analysis
 */
export const ValidatedFinding = z.object({
  original: z.custom<CodeRabbitFinding>(), // Original CodeRabbit finding
  validated: z.boolean(), // Expert validation result
  confidence: z.number().min(0).max(100), // Expert confidence percentage
  severity: RiskLevel, // Expert-assessed severity
  falsePositive: z.boolean().default(false),
  reason: z.string(), // Justification for validation decision
  enhancedContext: z.string().optional(), // Additional expert insights
  owasp: OWASPCategory.optional(),
  cwe: CWECategory.optional(),
  cvss: z.number().min(0).max(10).optional(), // CVSS score if security issue
  businessImpact: z.enum(['critical', 'high', 'medium', 'low']),
  fixComplexity: z.enum(['trivial', 'simple', 'moderate', 'complex', 'major']),
  fixEstimateHours: z.number().optional(),
})
export type ValidatedFinding = z.infer<typeof ValidatedFinding>

/**
 * Expert-identified issue not caught by automation
 */
export const ExpertFinding = z.object({
  id: z.string(),
  title: z.string(),
  description: z.string(),
  severity: RiskLevel,
  category: z.enum([
    'security',
    'performance',
    'maintainability',
    'architecture',
    'business_logic',
    'data_integrity',
    'compliance',
  ]),
  location: z.object({
    file: z.string(),
    startLine: z.number(),
    endLine: z.number().optional(),
    function: z.string().optional(),
  }),
  owasp: OWASPCategory.optional(),
  cwe: CWECategory.optional(),
  suggestedFix: z.string(),
  businessJustification: z.string(),
  fixEstimateHours: z.number(),
})
export type ExpertFinding = z.infer<typeof ExpertFinding>

/**
 * Quantitative PR metrics
 */
export const PRMetrics = z.object({
  // Code metrics
  linesReviewed: z.number(),
  linesChanged: z.number(),
  filesChanged: z.number(),
  functionsChanged: z.number(),
  complexityScore: z.number(),

  // Security metrics
  securityIssuesFound: z.number(),
  criticalVulnerabilities: z.number(),
  securityDebtScore: z.number().min(0).max(100),

  // Quality metrics
  testCoverageDelta: z.number(),
  technicalDebtRatio: z.number(),
  documentationCoverage: z.number(),

  // Performance metrics
  performanceImpact: z.enum(['none', 'low', 'medium', 'high']),
  bundleSizeImpact: z.number(), // KB

  // Analysis metrics
  analysisTimeMs: z.number(),
  confidenceScore: z.number().min(0).max(100),
  coveragePercentage: z.number().min(0).max(100),

  // Historical context
  authorPatternScore: z.number().min(0).max(100), // Based on author history
  teamVelocityImpact: z.enum(['positive', 'neutral', 'negative']),
})
export type PRMetrics = z.infer<typeof PRMetrics>

/**
 * Security audit results
 */
export const SecurityAuditResults = z.object({
  riskLevel: SecurityRiskLevel,
  totalFindings: z.number(),
  criticalCount: z.number(),
  highCount: z.number(),
  mediumCount: z.number(),
  lowCount: z.number(),
  findings: z.array(SecurityFinding),
  owaspCoverage: z.object({
    totalCategories: z.number(),
    categoriesFound: z.number(),
    coveragePercentage: z.number(),
  }),
  sansCoverage: z.object({
    totalCategories: z.number(),
    categoriesFound: z.number(),
    coveragePercentage: z.number(),
  }),
  cweCoverage: z.object({
    totalCategories: z.number(),
    categoriesFound: z.number(),
    coveragePercentage: z.number(),
  }),
  recommendations: z.array(z.string()),
})
export type SecurityAuditResults = z.infer<typeof SecurityAuditResults>

/**
 * Complete PR analysis result
 */
export const PRAnalysisResult = z.object({
  // Metadata
  analysisId: z.string(),
  pullRequestNumber: z.number(),
  analysisTimestamp: z.string().datetime(),
  analysisVersion: z.string().default('1.0.0'),

  // Decision
  decision: AnalysisDecision,
  riskLevel: RiskLevel,
  confidenceScore: z.number().min(0).max(100),

  // Context data
  githubContext: z.custom<GitHubPRContext>(),
  codeRabbitAnalysis: z.custom<CodeRabbitAnalysis>().optional(),

  // Prioritized issues from CodeRabbit
  prioritizedIssues: z
    .object({
      blocking: z.array(z.custom<PrioritizedIssue>()),
      important: z.array(z.custom<PrioritizedIssue>()),
      suggestions: z.array(z.custom<PrioritizedIssue>()),
    })
    .optional(),

  // Expert analysis
  validatedFindings: z.array(ValidatedFinding),
  expertFindings: z.array(ExpertFinding),
  falsePositives: z.array(
    z.object({
      finding: z.custom<CodeRabbitFinding>(),
      reason: z.string(),
    }),
  ),

  // Comprehensive assessments
  securityAudit: SecurityAuditResults,
  metrics: PRMetrics,

  // Recommendations
  blockingIssues: z.array(
    z.object({
      id: z.string(),
      title: z.string(),
      severity: RiskLevel,
      mustFixBeforeMerge: z.boolean(),
    }),
  ),
  recommendations: z.object({
    immediate: z.array(z.string()),
    shortTerm: z.array(z.string()),
    longTerm: z.array(z.string()),
  }),

  // Trend analysis
  trendAnalysis: z.object({
    historicalComparison: z.object({
      securityTrend: z.enum(['improving', 'stable', 'declining']),
      qualityTrend: z.enum(['improving', 'stable', 'declining']),
      complexityTrend: z.enum(['improving', 'stable', 'declining']),
    }),
    teamMetrics: z.object({
      averageSecurityIssues: z.number(),
      averageReviewTime: z.number(),
      averageFixTime: z.number(),
    }),
  }),
})
export type PRAnalysisResult = z.infer<typeof PRAnalysisResult>

/**
 * Analysis configuration
 */
export const AnalysisConfig = z.object({
  enableSecurityAudit: z.boolean().default(true),
  enablePerformanceAnalysis: z.boolean().default(true),
  enableTrendAnalysis: z.boolean().default(true),
  strictMode: z.boolean().default(false),
  customRules: z.array(z.string()).default([]),
  excludePatterns: z.array(z.string()).default([]),
  confidenceThreshold: z.number().min(0).max(100).default(70),
  maxAnalysisTimeMs: z.number().default(600000), // 10 minutes
})
export type AnalysisConfig = z.infer<typeof AnalysisConfig>

/**
 * Consolidated Analysis Output
 * Final structure that combines all analysis sources for agent consumption
 */
export interface ConsolidatedAnalysisOutput {
  // Metadata
  analysis_id: string
  pr_number: number
  repository: string
  timestamp: string
  analysis_version: string

  // Context
  github_context: {
    title: string
    description: string
    author: string
    base_branch: string
    head_branch: string
    files_changed: number
    additions: number
    deletions: number
  }

  // All findings merged
  findings: {
    coderabbit: CodeRabbitFinding[]
    security: SecurityFinding[]
    expert: PrioritizedIssue[]
    total_count: number
    by_severity: {
      critical: number
      high: number
      medium: number
      low: number
    }
  }

  // Metrics
  metrics: {
    code_quality_score: number
    security_score: number
    test_coverage_delta?: number
    complexity_score: number
    confidence_score: number
  }

  // Decision and recommendations
  decision: AnalysisDecision
  risk_level: RiskLevel
  blocking_issues: PrioritizedIssue[]
  recommendations: {
    immediate: string[]
    short_term: string[]
    long_term: string[]
  }

  // Summary for human consumption
  summary: {
    overview: string
    key_findings: string[]
    action_items: string[]
  }
}

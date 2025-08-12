import { z } from 'zod'

/**
 * CodeRabbit confidence levels
 */
export const CodeRabbitConfidenceLevel = z.enum([
  'very_high',
  'high',
  'medium',
  'low',
  'very_low',
])
export type CodeRabbitConfidenceLevel = z.infer<
  typeof CodeRabbitConfidenceLevel
>

/**
 * CodeRabbit finding severity
 */
export const CodeRabbitSeverity = z.enum([
  'critical',
  'high',
  'medium',
  'low',
  'info',
])
export type CodeRabbitSeverity = z.infer<typeof CodeRabbitSeverity>

/**
 * CodeRabbit finding category
 */
export const CodeRabbitCategory = z.enum([
  'security',
  'performance',
  'maintainability',
  'bug_risk',
  'style',
  'documentation',
  'best_practices',
  'accessibility',
  'testing',
])
export type CodeRabbitCategory = z.infer<typeof CodeRabbitCategory>

/**
 * Location in code where finding occurs
 */
export const CodeLocation = z.object({
  file: z.string(),
  startLine: z.number(),
  endLine: z.number().optional(),
  startColumn: z.number().optional(),
  endColumn: z.number().optional(),
  function: z.string().optional(),
  class: z.string().optional(),
})
export type CodeLocation = z.infer<typeof CodeLocation>

/**
 * Suggested fix from CodeRabbit
 */
export const CodeRabbitSuggestedFix = z.object({
  description: z.string(),
  oldCode: z.string(),
  newCode: z.string(),
  confidence: CodeRabbitConfidenceLevel,
  automaticFix: z.boolean().default(false),
})
export type CodeRabbitSuggestedFix = z.infer<typeof CodeRabbitSuggestedFix>

/**
 * Individual CodeRabbit finding
 */
export const CodeRabbitFinding = z.object({
  id: z.string(),
  title: z.string(),
  description: z.string(),
  severity: CodeRabbitSeverity,
  category: CodeRabbitCategory,
  confidence: CodeRabbitConfidenceLevel,
  location: CodeLocation,
  suggestedFix: CodeRabbitSuggestedFix.optional(),
  cweId: z.string().optional(), // CWE identifier for security issues
  owasp: z.string().optional(), // OWASP Top 10 category
  cvss: z.number().optional(), // CVSS score for security issues
  tags: z.array(z.string()).default([]),
  ruleId: z.string().optional(),
  source: z.string().default('coderabbit'),
  timestamp: z.string().datetime(),
})
export type CodeRabbitFinding = z.infer<typeof CodeRabbitFinding>

/**
 * CodeRabbit analysis summary for a PR
 */
export const CodeRabbitAnalysis = z.object({
  pullRequestId: z.number(),
  analysisId: z.string(),
  timestamp: z.string().datetime(),
  findings: z.array(CodeRabbitFinding),
  summary: z.object({
    totalFindings: z.number(),
    criticalCount: z.number(),
    highCount: z.number(),
    mediumCount: z.number(),
    lowCount: z.number(),
    infoCount: z.number(),
    securityIssues: z.number(),
    performanceIssues: z.number(),
    maintainabilityIssues: z.number(),
  }),
  confidence: z.object({
    overall: CodeRabbitConfidenceLevel,
    securityAnalysis: CodeRabbitConfidenceLevel,
    performanceAnalysis: CodeRabbitConfidenceLevel,
    codeQualityAnalysis: CodeRabbitConfidenceLevel,
  }),
  coverage: z.object({
    filesAnalyzed: z.number(),
    linesAnalyzed: z.number(),
    functionsAnalyzed: z.number(),
    coveragePercentage: z.number(),
  }),
  processingMetrics: z.object({
    analysisTimeMs: z.number(),
    rulesExecuted: z.number(),
    falsePositiveRate: z.number().optional(),
  }),
})
export type CodeRabbitAnalysis = z.infer<typeof CodeRabbitAnalysis>

/**
 * CodeRabbit API response wrapper
 */
export const CodeRabbitAPIResponse = z.object({
  status: z.enum(['success', 'error', 'pending']),
  analysis: CodeRabbitAnalysis.optional(),
  error: z.string().optional(),
  metadata: z.record(z.unknown()).optional(),
})
export type CodeRabbitAPIResponse = z.infer<typeof CodeRabbitAPIResponse>

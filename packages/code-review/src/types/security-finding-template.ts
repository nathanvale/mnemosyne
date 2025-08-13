/**
 * Unified Security Finding Template
 * Provides consistent formatting for security findings from both CodeRabbit and Claude
 */

type SeverityLevel = 'critical' | 'high' | 'medium' | 'low'
type ConfidenceLevel = 'very_high' | 'high' | 'medium' | 'low'
type ComplexityLevel = 'trivial' | 'simple' | 'moderate' | 'complex' | 'major'

export interface SecurityFindingTemplate {
  id: string
  title: string
  description: string
  severity: SeverityLevel
  category: string
  confidence: ConfidenceLevel
  location: {
    file: string
    line?: number
    column?: number
  }
  source:
    | 'coderabbit'
    | 'claude-pr-review-synthesizer'
    | 'github-security-advisory'
  detectionMethod: string

  // Enhanced formatting fields
  formatTemplate: {
    // Main description with consistent markdown formatting
    formattedDescription: string

    // AI-friendly prompt for fixing the issue
    aiPrompt?: string

    // Committable diff suggestion
    diffSuggestion?: {
      oldCode: string
      newCode: string
      language: string
    }

    // Business context
    businessImpact: {
      severity: SeverityLevel
      description: string
      userFacing: boolean
    }

    // Fix information
    fixInfo: {
      complexity: ComplexityLevel
      estimatedHours: number
      automated: boolean
      testingRequired: boolean
    }

    // Related information
    references?: {
      cweId?: string
      cvssScore?: number
      owaspCategory?: string
      documentation?: string[]
    }
  }
}

// Define input types for the formatter
interface BaseFinding {
  id?: string
  title?: string
  description?: string
  severity?: SeverityLevel
  category?: string
  confidence?: ConfidenceLevel
  location?: {
    file?: string
    startLine?: number
    line?: number
    startColumn?: number
    column?: number
  }
  suggestedFix?: {
    description?: string
    diff?: string
    automaticFix?: boolean
  }
  patch?: string
  remediation?: string
  cweId?: string
  cvssScore?: number
  owaspCategory?: string
  references?: string[]
}

/**
 * Security Finding Formatter - Creates consistent templates from various sources
 */
export class SecurityFindingFormatter {
  /**
   * Format a CodeRabbit security finding into the unified template
   */
  static formatCodeRabbitFinding(
    finding: BaseFinding,
  ): SecurityFindingTemplate {
    const businessImpact = this.assessBusinessImpact(finding)
    const fixInfo = this.assessFixComplexity(finding)

    return {
      id: `coderabbit-${finding.id || 'unknown'}`,
      title: finding.title || 'Unknown Issue',
      description: finding.description || '',
      severity: finding.severity || 'medium',
      category: finding.category || 'general',
      confidence: finding.confidence || 'medium',
      location: {
        file: finding.location?.file || 'unknown',
        line: finding.location?.startLine || finding.location?.line,
        column: finding.location?.startColumn || finding.location?.column,
      },
      source: 'coderabbit',
      detectionMethod: 'static-analysis',
      formatTemplate: {
        formattedDescription: this.formatDescription(finding),
        aiPrompt: this.generateAIPrompt(finding),
        diffSuggestion: this.extractDiffSuggestion(finding),
        businessImpact,
        fixInfo,
        references: {
          cweId: finding.cweId,
          cvssScore: finding.cvssScore,
          owaspCategory: finding.owaspCategory,
          documentation: finding.references,
        },
      },
    }
  }

  /**
   * Format a Claude security finding into the unified template
   */
  static formatClaudeFinding(finding: BaseFinding): SecurityFindingTemplate {
    const businessImpact = this.assessBusinessImpact(finding)
    const fixInfo = this.assessFixComplexity(finding)

    return {
      id: `claude-${finding.id || 'unknown'}`,
      title: finding.title || 'Unknown Issue',
      description: finding.description || '',
      severity: finding.severity || 'medium',
      category: finding.category || 'security',
      confidence: finding.confidence || 'high',
      location: {
        file: finding.location?.file || 'unknown',
        line: finding.location?.line,
        column: finding.location?.column,
      },
      source: 'claude-pr-review-synthesizer',
      detectionMethod: 'ai-analysis',
      formatTemplate: {
        formattedDescription: this.formatDescription(finding),
        aiPrompt: this.generateAIPrompt(finding),
        diffSuggestion: this.extractDiffSuggestion(finding),
        businessImpact,
        fixInfo,
        references: {
          cweId: finding.cweId,
          cvssScore: finding.cvssScore,
          owaspCategory: finding.owaspCategory,
          documentation: finding.references,
        },
      },
    }
  }

  /**
   * Generate consistent markdown description
   */
  private static formatDescription(finding: BaseFinding): string {
    const description = finding.description || ''

    // Clean up description formatting
    const formatted = description
      .replace(/\*\*(.*?)\*\*/g, '**$1**') // Normalize bold formatting
      .replace(/`([^`]+)`/g, '`$1`') // Normalize code formatting
      .trim()

    // Add severity badge
    const severity = finding.severity || 'medium'
    const severityEmoji =
      {
        critical: '🔴',
        high: '🟠',
        medium: '🟡',
        low: '🔵',
      }[severity] || '⚪'

    return `${severityEmoji} **${severity.toUpperCase()}** ${formatted}`
  }

  /**
   * Generate AI-friendly prompt for fixing the issue
   */
  private static generateAIPrompt(finding: BaseFinding): string {
    const file = finding.location?.file || 'the file'
    const line = finding.location?.startLine || finding.location?.line
    const lineInfo = line ? ` around line ${line}` : ''

    let prompt = `In ${file}${lineInfo}, `

    // Add context based on category
    switch (finding.category?.toLowerCase()) {
      case 'security':
        prompt = `${prompt}there is a security vulnerability that needs to be fixed. `
        break
      case 'bug_risk':
        prompt = `${prompt}there is a potential bug that could cause runtime issues. `
        break
      case 'performance':
        prompt = `${prompt}there is a performance issue that should be optimized. `
        break
      case 'maintainability':
        prompt = `${prompt}there is a maintainability issue that should be refactored. `
        break
      default:
        prompt = `${prompt}there is an issue that needs to be addressed. `
    }

    // Add specific issue description
    const description = finding.description || finding.title || ''
    const shortDescription =
      description.length > 100
        ? `${description.substring(0, 100)}...`
        : description

    prompt = `${prompt}${shortDescription.replace(/[\r\n]+/g, ' ').trim()}`

    // Add fix guidance if available
    if (finding.suggestedFix || finding.remediation) {
      const fixText =
        finding.suggestedFix?.description || finding.remediation || ''
      if (fixText) {
        prompt = `${prompt} The recommended fix is: ${fixText.substring(0, 200)}`
      }
    }

    return prompt
  }

  /**
   * Extract diff suggestion from finding
   */
  private static extractDiffSuggestion(
    finding: BaseFinding,
  ): SecurityFindingTemplate['formatTemplate']['diffSuggestion'] {
    if (!finding.suggestedFix?.diff && !finding.patch) {
      return undefined
    }

    const diff = finding.suggestedFix?.diff || finding.patch || ''
    const lines = diff.split('\n')

    let oldCode = ''
    let newCode = ''

    for (const line of lines) {
      if (line.startsWith('-') && !line.startsWith('---')) {
        oldCode = `${oldCode}${line.substring(1)}\n`
      } else if (line.startsWith('+') && !line.startsWith('+++')) {
        newCode = `${newCode}${line.substring(1)}\n`
      }
    }

    if (oldCode || newCode) {
      return {
        oldCode: oldCode.trim(),
        newCode: newCode.trim(),
        language: this.inferLanguage(finding.location?.file || ''),
      }
    }

    return undefined
  }

  /**
   * Assess business impact of the finding
   */
  private static assessBusinessImpact(
    finding: BaseFinding,
  ): SecurityFindingTemplate['formatTemplate']['businessImpact'] {
    const severity = finding.severity || 'medium'
    const category = finding.category?.toLowerCase() || ''
    const file = finding.location?.file || ''

    // Determine if user-facing
    const userFacing =
      file.includes('ui/') ||
      file.includes('frontend/') ||
      file.includes('component') ||
      file.includes('page') ||
      file.includes('route')

    let businessSeverity: SeverityLevel = 'medium'
    let description = 'Standard issue requiring attention.'

    if (category === 'security') {
      businessSeverity = severity === 'critical' ? 'critical' : 'high'
      description = userFacing
        ? 'Security vulnerability in user-facing code - immediate attention required.'
        : 'Security vulnerability in backend code - high priority fix needed.'
    } else if (severity === 'critical') {
      businessSeverity = 'critical'
      description = 'Critical issue that could break functionality.'
    } else if (severity === 'high' && userFacing) {
      businessSeverity = 'high'
      description = 'High-priority issue affecting user experience.'
    }

    return {
      severity: businessSeverity,
      description,
      userFacing,
    }
  }

  /**
   * Assess fix complexity
   */
  private static assessFixComplexity(
    finding: BaseFinding,
  ): SecurityFindingTemplate['formatTemplate']['fixInfo'] {
    const category = finding.category?.toLowerCase() || ''
    const hasAutomaticFix = Boolean(finding.suggestedFix?.automaticFix)

    let complexity: ComplexityLevel = 'moderate'
    let estimatedHours = 2
    let testingRequired = true

    if (hasAutomaticFix) {
      complexity = 'trivial'
      estimatedHours = 0.25
      testingRequired = false
    } else if (category === 'style' || category === 'formatting') {
      complexity = 'simple'
      estimatedHours = 0.5
      testingRequired = false
    } else if (category === 'security') {
      complexity = 'complex'
      estimatedHours = 4
      testingRequired = true
    } else if (category === 'performance') {
      complexity = 'moderate'
      estimatedHours = 2
      testingRequired = true
    }

    return {
      complexity,
      estimatedHours,
      automated: hasAutomaticFix,
      testingRequired,
    }
  }

  /**
   * Infer programming language from file extension
   */
  private static inferLanguage(filename: string): string {
    const ext = filename.split('.').pop()?.toLowerCase()

    const languageMap: Record<string, string> = {
      ts: 'typescript',
      tsx: 'typescript',
      js: 'javascript',
      jsx: 'javascript',
      py: 'python',
      go: 'go',
      rs: 'rust',
      java: 'java',
      kt: 'kotlin',
      rb: 'ruby',
      php: 'php',
      cs: 'csharp',
      cpp: 'cpp',
      c: 'c',
      sh: 'bash',
      yml: 'yaml',
      yaml: 'yaml',
      json: 'json',
      md: 'markdown',
    }

    return languageMap[ext || ''] || 'text'
  }
}

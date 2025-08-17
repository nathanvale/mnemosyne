import type {
  ContextAnalysisResults,
  BusinessRiskAssessment,
} from '../analysis/context-analyzer'
import type { ExpertValidationResults } from '../analysis/expert-validator'
import type {
  PRAnalysisResult,
  SecurityAuditResults,
  PRMetrics,
  RiskLevel,
} from '../types/analysis'

/**
 * Interactive report configuration
 */
export interface InteractiveReportConfig {
  enableFiltering: boolean
  enableSorting: boolean
  enableSearch: boolean
  enableCollapsibleSections: boolean
  enableDrillDown: boolean
  showProgressIndicators: boolean
  enableExportOptions: boolean
  defaultCollapsedSections: string[]
  maxFindingsPerPage: number
  confidenceThreshold: number
}

/**
 * Report section visibility and interaction state
 */
export interface SectionState {
  id: string
  visible: boolean
  collapsed: boolean
  filtered: boolean
  sortBy?: string
  sortOrder?: 'asc' | 'desc'
  searchQuery?: string
  currentPage?: number
}

/**
 * Filter criteria for findings
 */
export interface FilterCriteria {
  severity?: RiskLevel[]
  category?: string[]
  confidence?: { min: number; max: number }
  file?: string[]
  expertValidated?: boolean
  falsePositives?: boolean
  hasFixEstimate?: boolean
}

/**
 * Interactive component definition
 */
export interface InteractiveComponent {
  id: string
  type: ComponentType
  title: string
  description: string
  data: unknown
  state: ComponentState
  interactions: ComponentInteraction[]
}

/**
 * Component types for interactive elements
 */
export enum ComponentType {
  SUMMARY_CARD = 'summary_card',
  METRICS_CHART = 'metrics_chart',
  FINDINGS_TABLE = 'findings_table',
  SECURITY_RADAR = 'security_radar',
  TIMELINE_CHART = 'timeline_chart',
  RISK_MATRIX = 'risk_matrix',
  COLLAPSIBLE_SECTION = 'collapsible_section',
  SEARCHABLE_LIST = 'searchable_list',
  FILTER_PANEL = 'filter_panel',
  EXPORT_BUTTON = 'export_button',
}

/**
 * Component interaction state
 */
export interface ComponentState {
  visible: boolean
  collapsed: boolean
  loading: boolean
  error?: string
  lastUpdated: string
  userInteractions: number
}

/**
 * Available interactions for components
 */
export interface ComponentInteraction {
  type: InteractionType
  target: string
  handler: string
  parameters?: Record<string, unknown>
}

/**
 * Types of user interactions
 */
export enum InteractionType {
  CLICK = 'click',
  HOVER = 'hover',
  FILTER = 'filter',
  SORT = 'sort',
  SEARCH = 'search',
  EXPAND = 'expand',
  COLLAPSE = 'collapse',
  EXPORT = 'export',
  DRILL_DOWN = 'drill_down',
}

/**
 * Component data types for type-safe rendering
 */
interface SummaryCardData {
  decision: string
  riskLevel: string
  confidence: number
  totalFindings: number
  criticalIssues: number
  validatedFindings: number
}

interface FindingsTableData {
  findings: Array<{
    id: string
    title: string
    severity: string
    confidence: number
    file: string
    line: number
    category: string
    validated: boolean
    falsePositive: boolean
    fixEstimate: number
    businessImpact: string
  }>
  expertFindings: Array<{
    id: string
    title: string
    severity: string
    confidence: number
    file: string
    line: number
    category: string
    validated: boolean
    falsePositive: boolean
    fixEstimate: number
    businessImpact: string
  }>
  columns: Array<{
    key: string
    label: string
    sortable?: boolean
    filterable?: boolean
  }>
  pagination: {
    currentPage: number
    itemsPerPage: number
    totalItems: number
  }
}

interface FilterPanelData {
  severityOptions: string[]
  categoryOptions: string[]
  confidenceRange: { min: number; max: number }
  fileOptions: string[]
  booleanFilters: string[]
}

interface FindingRowData {
  id: string
  title: string
  severity: string
  confidence: number
  file: string
  line: number
  category: string
  validated: boolean
  falsePositive: boolean
  fixEstimate: number
  businessImpact: string
}

/**
 * Interactive report generator with dynamic components
 */
export class InteractiveReportGenerator {
  private config: InteractiveReportConfig
  private sectionStates: Map<string, SectionState>
  private components: Map<string, InteractiveComponent>
  private filterCriteria: FilterCriteria

  constructor(config: InteractiveReportConfig) {
    this.config = config
    this.sectionStates = new Map()
    this.components = new Map()
    this.filterCriteria = {}
  }

  /**
   * Generate interactive report with dynamic components
   */
  generateInteractiveReport(
    analysisResult: PRAnalysisResult,
    expertValidation: ExpertValidationResults,
    contextAnalysis: ContextAnalysisResults,
  ): string {
    // Initialize report state
    this.initializeReportState()

    // Generate interactive components
    const components = this.generateComponents(
      analysisResult,
      expertValidation,
      contextAnalysis,
    )

    // Build interactive HTML structure
    return this.buildInteractiveHTML(components, analysisResult)
  }

  /**
   * Initialize report state and section visibility
   */
  private initializeReportState(): void {
    const defaultSections = [
      'executive-summary',
      'security-analysis',
      'detailed-findings',
      'metrics-dashboard',
      'recommendations',
      'business-risk',
    ]

    defaultSections.forEach((sectionId) => {
      this.sectionStates.set(sectionId, {
        id: sectionId,
        visible: true,
        collapsed: this.config.defaultCollapsedSections.includes(sectionId),
        filtered: false,
        currentPage: 1,
      })
    })
  }

  /**
   * Generate all interactive components for the report
   */
  private generateComponents(
    analysisResult: PRAnalysisResult,
    expertValidation: ExpertValidationResults,
    contextAnalysis: ContextAnalysisResults,
  ): InteractiveComponent[] {
    const components: InteractiveComponent[] = []

    // Executive summary card
    components.push(
      this.createExecutiveSummaryCard(analysisResult, expertValidation),
    )

    // Security radar chart
    components.push(this.createSecurityRadarChart(analysisResult.securityAudit))

    // Metrics dashboard
    components.push(this.createMetricsDashboard(analysisResult.metrics))

    // Interactive findings table
    components.push(this.createInteractiveFindingsTable(expertValidation))

    // Risk matrix visualization
    components.push(
      this.createRiskMatrix(contextAnalysis.businessRiskAssessment),
    )

    // Filter panel
    if (this.config.enableFiltering) {
      components.push(this.createFilterPanel())
    }

    // Export options
    if (this.config.enableExportOptions) {
      components.push(this.createExportPanel())
    }

    // Progress indicators
    if (this.config.showProgressIndicators) {
      components.push(this.createProgressIndicators(analysisResult))
    }

    return components
  }

  /**
   * Create executive summary card with key metrics
   */
  private createExecutiveSummaryCard(
    analysisResult: PRAnalysisResult,
    expertValidation: ExpertValidationResults,
  ): InteractiveComponent {
    const summaryData = {
      decision: expertValidation.overallDecision,
      riskLevel: analysisResult.riskLevel,
      confidence: analysisResult.confidenceScore,
      totalFindings: analysisResult.securityAudit.totalFindings,
      criticalIssues: expertValidation.blockingIssues.length,
      validatedFindings: expertValidation.validatedFindings.length,
      expertFindings: expertValidation.expertFindings.length,
    }

    return {
      id: 'executive-summary-card',
      type: ComponentType.SUMMARY_CARD,
      title: 'Executive Summary',
      description: 'Key metrics and decision overview',
      data: summaryData,
      state: this.createComponentState(),
      interactions: [
        {
          type: InteractionType.CLICK,
          target: 'decision-badge',
          handler: 'showDecisionDetails',
        },
        {
          type: InteractionType.HOVER,
          target: 'risk-indicator',
          handler: 'showRiskBreakdown',
        },
      ],
    }
  }

  /**
   * Create security radar chart for framework coverage
   */
  private createSecurityRadarChart(
    securityAudit: SecurityAuditResults,
  ): InteractiveComponent {
    const radarData = {
      frameworks: [
        {
          name: 'OWASP Top 10',
          coverage: securityAudit.owaspCoverage.coveragePercentage,
          findings: securityAudit.owaspCoverage.categoriesFound,
          total: securityAudit.owaspCoverage.totalCategories,
        },
        {
          name: 'SANS Top 25',
          coverage: securityAudit.sansCoverage.coveragePercentage,
          findings: securityAudit.sansCoverage.categoriesFound,
          total: securityAudit.sansCoverage.totalCategories,
        },
        {
          name: 'CWE',
          coverage: securityAudit.cweCoverage.coveragePercentage,
          findings: securityAudit.cweCoverage.categoriesFound,
          total: securityAudit.cweCoverage.totalCategories,
        },
      ],
      severityBreakdown: {
        critical: securityAudit.criticalCount,
        high: securityAudit.highCount,
        medium: securityAudit.mediumCount,
        low: securityAudit.lowCount,
      },
    }

    return {
      id: 'security-radar-chart',
      type: ComponentType.SECURITY_RADAR,
      title: 'Security Framework Coverage',
      description: 'Interactive radar chart showing security analysis coverage',
      data: radarData,
      state: this.createComponentState(),
      interactions: [
        {
          type: InteractionType.HOVER,
          target: 'radar-point',
          handler: 'showFrameworkDetails',
        },
        {
          type: InteractionType.CLICK,
          target: 'severity-segment',
          handler: 'filterBySeverity',
        },
      ],
    }
  }

  /**
   * Create interactive metrics dashboard
   */
  private createMetricsDashboard(metrics: PRMetrics): InteractiveComponent {
    const dashboardData = {
      codeMetrics: {
        linesChanged: metrics.linesChanged,
        filesChanged: metrics.filesChanged,
        complexityScore: metrics.complexityScore,
      },
      qualityMetrics: {
        testCoverageDelta: metrics.testCoverageDelta * 100,
        technicalDebtRatio: metrics.technicalDebtRatio * 100,
        documentationCoverage: metrics.documentationCoverage,
      },
      securityMetrics: {
        securityIssues: metrics.securityIssuesFound,
        criticalVulnerabilities: metrics.criticalVulnerabilities,
        securityDebtScore: metrics.securityDebtScore,
      },
      performanceMetrics: {
        performanceImpact: metrics.performanceImpact,
        bundleSizeImpact: metrics.bundleSizeImpact,
      },
      analysisMetrics: {
        analysisTime: metrics.analysisTimeMs / 1000,
        confidenceScore: metrics.confidenceScore,
        coveragePercentage: metrics.coveragePercentage,
      },
    }

    return {
      id: 'metrics-dashboard',
      type: ComponentType.METRICS_CHART,
      title: 'Metrics Dashboard',
      description: 'Interactive charts showing comprehensive PR metrics',
      data: dashboardData,
      state: this.createComponentState(),
      interactions: [
        {
          type: InteractionType.CLICK,
          target: 'metric-card',
          handler: 'expandMetricDetails',
        },
        {
          type: InteractionType.HOVER,
          target: 'chart-element',
          handler: 'showMetricTooltip',
        },
      ],
    }
  }

  /**
   * Create interactive findings table with filtering and sorting
   */
  private createInteractiveFindingsTable(
    expertValidation: ExpertValidationResults,
  ): InteractiveComponent {
    const findingsData = {
      findings: expertValidation.validatedFindings.map((finding) => ({
        id: finding.original.id,
        title: finding.original.title,
        severity: finding.severity,
        confidence: finding.confidence,
        file: finding.original.location.file,
        line: finding.original.location.startLine,
        category: finding.original.category,
        validated: finding.validated,
        falsePositive: finding.falsePositive,
        fixEstimate: finding.fixEstimateHours,
        businessImpact: finding.businessImpact,
      })),
      expertFindings: expertValidation.expertFindings.map((finding) => ({
        id: finding.id,
        title: finding.title,
        severity: finding.severity,
        confidence: 95,
        file: finding.location.file,
        line: finding.location.startLine,
        category: finding.category,
        validated: true,
        falsePositive: false,
        fixEstimate: finding.fixEstimateHours,
        businessImpact: 'expert-identified',
      })),
      columns: [
        { key: 'title', label: 'Finding', sortable: true },
        {
          key: 'severity',
          label: 'Severity',
          sortable: true,
          filterable: true,
        },
        { key: 'confidence', label: 'Confidence', sortable: true },
        { key: 'file', label: 'File', sortable: true, filterable: true },
        {
          key: 'category',
          label: 'Category',
          sortable: true,
          filterable: true,
        },
        { key: 'validated', label: 'Validated', filterable: true },
        { key: 'fixEstimate', label: 'Fix Estimate', sortable: true },
      ],
      pagination: {
        currentPage: 1,
        itemsPerPage: this.config.maxFindingsPerPage,
        totalItems:
          expertValidation.validatedFindings.length +
          expertValidation.expertFindings.length,
      },
    }

    return {
      id: 'interactive-findings-table',
      type: ComponentType.FINDINGS_TABLE,
      title: 'Detailed Findings',
      description: 'Sortable, filterable table of all identified issues',
      data: findingsData,
      state: this.createComponentState(),
      interactions: [
        {
          type: InteractionType.SORT,
          target: 'column-header',
          handler: 'sortFindings',
        },
        {
          type: InteractionType.FILTER,
          target: 'filter-dropdown',
          handler: 'applyFilter',
        },
        {
          type: InteractionType.SEARCH,
          target: 'search-input',
          handler: 'searchFindings',
        },
        {
          type: InteractionType.CLICK,
          target: 'finding-row',
          handler: 'showFindingDetails',
        },
        {
          type: InteractionType.DRILL_DOWN,
          target: 'file-link',
          handler: 'showFileContext',
        },
      ],
    }
  }

  /**
   * Create risk matrix visualization
   */
  private createRiskMatrix(
    businessRisk: BusinessRiskAssessment,
  ): InteractiveComponent {
    const matrixData = {
      overallRisk: businessRisk.overallRisk,
      dimensions: {
        userImpact: businessRisk.userExperienceImpact,
        dataRisk: businessRisk.dataSecurityRisk,
        complianceRisk: businessRisk.complianceImplications.length > 0,
      },
      affectedDomains: businessRisk.affectedDomains,
      criticalPaths: businessRisk.criticalPathsAffected,
      matrix: this.generateRiskMatrix(businessRisk),
    }

    return {
      id: 'risk-matrix',
      type: ComponentType.RISK_MATRIX,
      title: 'Business Risk Matrix',
      description:
        'Interactive visualization of business impact and likelihood',
      data: matrixData,
      state: this.createComponentState(),
      interactions: [
        {
          type: InteractionType.HOVER,
          target: 'risk-cell',
          handler: 'showRiskDetails',
        },
        {
          type: InteractionType.CLICK,
          target: 'domain-indicator',
          handler: 'filterByDomain',
        },
      ],
    }
  }

  /**
   * Create filter panel for findings
   */
  private createFilterPanel(): InteractiveComponent {
    const filterData = {
      severityOptions: ['critical', 'high', 'medium', 'low'],
      categoryOptions: [
        'security',
        'performance',
        'maintainability',
        'architecture',
      ],
      confidenceRange: { min: 0, max: 100 },
      fileOptions: [], // Will be populated from findings
      booleanFilters: ['expertValidated', 'falsePositives', 'hasFixEstimate'],
    }

    return {
      id: 'filter-panel',
      type: ComponentType.FILTER_PANEL,
      title: 'Filter Controls',
      description: 'Advanced filtering options for findings',
      data: filterData,
      state: this.createComponentState(),
      interactions: [
        {
          type: InteractionType.FILTER,
          target: 'severity-checkbox',
          handler: 'updateSeverityFilter',
        },
        {
          type: InteractionType.FILTER,
          target: 'confidence-slider',
          handler: 'updateConfidenceFilter',
        },
        {
          type: InteractionType.CLICK,
          target: 'reset-filters',
          handler: 'resetAllFilters',
        },
        {
          type: InteractionType.CLICK,
          target: 'apply-filters',
          handler: 'applyAllFilters',
        },
      ],
    }
  }

  /**
   * Create export options panel
   */
  private createExportPanel(): InteractiveComponent {
    const exportData = {
      formats: [
        { id: 'pdf', label: 'PDF Report', icon: '📄' },
        { id: 'html', label: 'HTML Report', icon: '🌐' },
        { id: 'json', label: 'JSON Data', icon: '📊' },
        { id: 'csv', label: 'CSV (Findings)', icon: '📋' },
        { id: 'markdown', label: 'Markdown', icon: '📝' },
      ],
      options: {
        includeFiltered: true,
        includeMetrics: true,
        includeRecommendations: true,
        includeArchitecture: false,
      },
    }

    return {
      id: 'export-panel',
      type: ComponentType.EXPORT_BUTTON,
      title: 'Export Options',
      description: 'Export report in various formats',
      data: exportData,
      state: this.createComponentState(),
      interactions: [
        {
          type: InteractionType.CLICK,
          target: 'export-format',
          handler: 'exportReport',
        },
        {
          type: InteractionType.CLICK,
          target: 'export-options',
          handler: 'toggleExportOption',
        },
      ],
    }
  }

  /**
   * Create progress indicators for analysis completeness
   */
  private createProgressIndicators(
    analysisResult: PRAnalysisResult,
  ): InteractiveComponent {
    const progressData = {
      overallProgress: analysisResult.metrics.coveragePercentage,
      steps: [
        {
          name: 'Security Analysis',
          progress: 100,
          status: 'complete',
          findings: analysisResult.securityAudit.totalFindings,
        },
        {
          name: 'Expert Validation',
          progress: analysisResult.confidenceScore,
          status: analysisResult.confidenceScore >= 80 ? 'complete' : 'warning',
          findings: analysisResult.validatedFindings.length,
        },
        {
          name: 'Context Analysis',
          progress: 100,
          status: 'complete',
          findings: 'architectural insights generated',
        },
        {
          name: 'Business Assessment',
          progress: 100,
          status: 'complete',
          findings: 'risk assessment complete',
        },
      ],
    }

    return {
      id: 'progress-indicators',
      type: ComponentType.TIMELINE_CHART,
      title: 'Analysis Progress',
      description: 'Progress indicators showing analysis completeness',
      data: progressData,
      state: this.createComponentState(),
      interactions: [
        {
          type: InteractionType.HOVER,
          target: 'progress-step',
          handler: 'showStepDetails',
        },
      ],
    }
  }

  /**
   * Build interactive HTML structure with all components
   */
  private buildInteractiveHTML(
    components: InteractiveComponent[],
    analysisResult: PRAnalysisResult,
  ): string {
    const html = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>PR Analysis Report - Interactive</title>
    <style>
        ${this.generateCSS()}
    </style>
</head>
<body>
    <div id="pr-analysis-report">
        <header class="report-header">
            <h1>🔍 PR Analysis Report</h1>
            <div class="report-meta">
                <span class="analysis-id">ID: ${analysisResult.analysisId}</span>
                <span class="timestamp">Generated: ${new Date(analysisResult.analysisTimestamp).toLocaleString()}</span>
                <span class="version">v${analysisResult.analysisVersion}</span>
            </div>
        </header>

        <div class="report-navigation">
            ${this.generateNavigation(components)}
        </div>

        <main class="report-content">
            ${components.map((component) => this.renderComponent(component)).join('\n')}
        </main>

        <div class="report-footer">
            <p>Report generated by PR Analysis Engine v${analysisResult.analysisVersion}</p>
        </div>
    </div>

    <script>
        ${this.generateJavaScript(components)}
    </script>
</body>
</html>`

    return html
  }

  /**
   * Generate CSS styles for interactive components
   */
  private generateCSS(): string {
    return `
        /* Reset and base styles */
        * { margin: 0; padding: 0; box-sizing: border-box; }
        
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            line-height: 1.6;
            color: #333;
            background: #f5f7fa;
        }

        /* Layout */
        #pr-analysis-report {
            max-width: 1200px;
            margin: 0 auto;
            background: white;
            border-radius: 8px;
            box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
            overflow: hidden;
        }

        .report-header {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            padding: 2rem;
            text-align: center;
        }

        .report-header h1 {
            font-size: 2.5rem;
            margin-bottom: 1rem;
        }

        .report-meta {
            display: flex;
            justify-content: center;
            gap: 2rem;
            font-size: 0.9rem;
            opacity: 0.9;
        }

        .report-navigation {
            background: #f8f9fa;
            padding: 1rem;
            border-bottom: 1px solid #e9ecef;
        }

        .nav-tabs {
            display: flex;
            flex-wrap: wrap;
            gap: 0.5rem;
        }

        .nav-tab {
            padding: 0.5rem 1rem;
            background: white;
            border: 1px solid #ddd;
            border-radius: 4px;
            cursor: pointer;
            transition: all 0.2s;
            text-decoration: none;
            color: #666;
        }

        .nav-tab:hover {
            background: #007bff;
            color: white;
            border-color: #007bff;
        }

        .nav-tab.active {
            background: #007bff;
            color: white;
            border-color: #007bff;
        }

        .report-content {
            padding: 2rem;
        }

        /* Component styles */
        .component {
            margin-bottom: 2rem;
            border: 1px solid #e9ecef;
            border-radius: 8px;
            overflow: hidden;
        }

        .component-header {
            background: #f8f9fa;
            padding: 1rem;
            border-bottom: 1px solid #e9ecef;
            display: flex;
            justify-content: between;
            align-items: center;
        }

        .component-title {
            font-size: 1.25rem;
            font-weight: 600;
            display: flex;
            align-items: center;
            gap: 0.5rem;
        }

        .component-controls {
            display: flex;
            gap: 0.5rem;
        }

        .control-button {
            padding: 0.25rem 0.5rem;
            border: 1px solid #ddd;
            background: white;
            border-radius: 4px;
            cursor: pointer;
            font-size: 0.8rem;
        }

        .control-button:hover {
            background: #f8f9fa;
        }

        .component-content {
            padding: 1.5rem;
        }

        .component.collapsed .component-content {
            display: none;
        }

        /* Summary card */
        .summary-card {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
            gap: 1rem;
        }

        .metric-card {
            padding: 1rem;
            background: #f8f9fa;
            border-radius: 6px;
            text-align: center;
            cursor: pointer;
            transition: transform 0.2s;
        }

        .metric-card:hover {
            transform: translateY(-2px);
        }

        .metric-value {
            font-size: 2rem;
            font-weight: bold;
            margin-bottom: 0.5rem;
        }

        .metric-label {
            color: #666;
            font-size: 0.9rem;
        }

        /* Risk indicators */
        .risk-critical { color: #dc3545; }
        .risk-high { color: #fd7e14; }
        .risk-medium { color: #ffc107; }
        .risk-low { color: #28a745; }

        /* Decision badges */
        .decision-approve { background: #28a745; color: white; }
        .decision-conditional { background: #ffc107; color: #212529; }
        .decision-changes { background: #fd7e14; color: white; }
        .decision-block { background: #dc3545; color: white; }

        .decision-badge {
            padding: 0.5rem 1rem;
            border-radius: 20px;
            font-weight: 600;
            cursor: pointer;
        }

        /* Findings table */
        .findings-table {
            width: 100%;
            border-collapse: collapse;
            margin-top: 1rem;
        }

        .findings-table th,
        .findings-table td {
            padding: 0.75rem;
            text-align: left;
            border-bottom: 1px solid #e9ecef;
        }

        .findings-table th {
            background: #f8f9fa;
            font-weight: 600;
            cursor: pointer;
            user-select: none;
        }

        .findings-table th:hover {
            background: #e9ecef;
        }

        .sortable::after {
            content: ' ↕';
            opacity: 0.5;
        }

        .sort-asc::after {
            content: ' ↑';
            opacity: 1;
        }

        .sort-desc::after {
            content: ' ↓';
            opacity: 1;
        }

        .finding-row {
            cursor: pointer;
            transition: background-color 0.2s;
        }

        .finding-row:hover {
            background: #f8f9fa;
        }

        /* Filter panel */
        .filter-panel {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
            gap: 1rem;
        }

        .filter-group {
            background: #f8f9fa;
            padding: 1rem;
            border-radius: 6px;
        }

        .filter-title {
            font-weight: 600;
            margin-bottom: 0.5rem;
        }

        .filter-options {
            display: flex;
            flex-direction: column;
            gap: 0.25rem;
        }

        .filter-option {
            display: flex;
            align-items: center;
            gap: 0.5rem;
        }

        /* Responsive design */
        @media (max-width: 768px) {
            .report-meta {
                flex-direction: column;
                gap: 0.5rem;
            }

            .nav-tabs {
                flex-direction: column;
            }

            .summary-card {
                grid-template-columns: 1fr;
            }

            .filter-panel {
                grid-template-columns: 1fr;
            }
        }

        /* Animation for collapsible sections */
        .component-content {
            transition: max-height 0.3s ease-out;
            overflow: hidden;
        }

        .loading {
            opacity: 0.6;
            pointer-events: none;
        }

        .error {
            border-color: #dc3545;
        }

        .error .component-header {
            background: #f8d7da;
            color: #721c24;
        }
    `
  }

  /**
   * Generate navigation for report sections
   */
  private generateNavigation(components: InteractiveComponent[]): string {
    const navItems = components
      .filter((c) => c.state.visible)
      .map((component) => {
        return `<a href="#${component.id}" class="nav-tab" data-target="${component.id}">
            ${component.title}
        </a>`
      })
      .join('')

    return `<nav class="nav-tabs">${navItems}</nav>`
  }

  /**
   * Render individual interactive component
   */
  private renderComponent(component: InteractiveComponent): string {
    const collapseControls = this.config.enableCollapsibleSections
      ? `<div class="component-controls">
           <button class="control-button collapse-toggle" data-component="${component.id}">
             ${component.state.collapsed ? '▼' : '▲'}
           </button>
         </div>`
      : ''

    return `
    <section id="${component.id}" class="component ${component.state.collapsed ? 'collapsed' : ''}" 
             data-type="${component.type}">
      <header class="component-header">
        <h2 class="component-title">${component.title}</h2>
        ${collapseControls}
      </header>
      <div class="component-content">
        ${this.renderComponentContent(component)}
      </div>
    </section>`
  }

  /**
   * Render component-specific content
   */
  private renderComponentContent(component: InteractiveComponent): string {
    switch (component.type) {
      case ComponentType.SUMMARY_CARD:
        return this.renderSummaryCard(component)
      case ComponentType.FINDINGS_TABLE:
        return this.renderFindingsTable(component)
      case ComponentType.FILTER_PANEL:
        return this.renderFilterPanel(component)
      case ComponentType.METRICS_CHART:
        return this.renderMetricsChart(component)
      default:
        return `<div class="placeholder">Interactive ${component.type} component</div>`
    }
  }

  /**
   * Render summary card component
   */
  private renderSummaryCard(component: InteractiveComponent): string {
    const data = component.data as SummaryCardData
    return `
    <div class="summary-card">
      <div class="metric-card decision-${data.decision.replace('_', '-')}">
        <div class="metric-value decision-badge">${data.decision.replace('_', ' ').toUpperCase()}</div>
        <div class="metric-label">Decision</div>
      </div>
      <div class="metric-card">
        <div class="metric-value risk-${data.riskLevel}">${data.riskLevel.toUpperCase()}</div>
        <div class="metric-label">Risk Level</div>
      </div>
      <div class="metric-card">
        <div class="metric-value">${data.confidence}%</div>
        <div class="metric-label">Confidence</div>
      </div>
      <div class="metric-card">
        <div class="metric-value">${data.totalFindings}</div>
        <div class="metric-label">Total Findings</div>
      </div>
      <div class="metric-card">
        <div class="metric-value">${data.criticalIssues}</div>
        <div class="metric-label">Critical Issues</div>
      </div>
      <div class="metric-card">
        <div class="metric-value">${data.validatedFindings}</div>
        <div class="metric-label">Validated Findings</div>
      </div>
    </div>`
  }

  /**
   * Render interactive findings table
   */
  private renderFindingsTable(component: InteractiveComponent): string {
    const data = component.data as FindingsTableData
    const allFindings = [...data.findings, ...data.expertFindings]

    if (this.config.enableSearch) {
      return `
      <div class="search-controls">
        <input type="text" id="findings-search" placeholder="Search findings..." 
               class="form-control" style="margin-bottom: 1rem; padding: 0.5rem;">
      </div>
      <div class="table-container">
        <table class="findings-table">
          <thead>
            <tr>
              ${data.columns
                .map(
                  (col) =>
                    `<th class="sortable" data-column="${col.key}">
                  ${col.label}
                </th>`,
                )
                .join('')}
            </tr>
          </thead>
          <tbody id="findings-table-body">
            ${allFindings.map((finding) => this.renderFindingRow(finding)).join('')}
          </tbody>
        </table>
      </div>
      <div class="pagination-controls">
        <span>Showing ${Math.min(data.pagination.itemsPerPage, data.pagination.totalItems)} of ${data.pagination.totalItems} findings</span>
      </div>`
    } else {
      return `<div class="findings-summary">Interactive findings table component with ${allFindings.length} findings</div>`
    }
  }

  /**
   * Render individual finding row
   */
  private renderFindingRow(finding: FindingRowData): string {
    return `
    <tr class="finding-row" data-finding-id="${finding.id}">
      <td>${finding.title}</td>
      <td><span class="risk-${finding.severity}">${finding.severity}</span></td>
      <td>${finding.confidence}%</td>
      <td>${finding.file}:${finding.line}</td>
      <td>${finding.category}</td>
      <td>${finding.validated ? '✅' : '❌'}</td>
      <td>${finding.fixEstimate ? `${finding.fixEstimate}h` : 'N/A'}</td>
    </tr>`
  }

  /**
   * Render filter panel
   */
  private renderFilterPanel(component: InteractiveComponent): string {
    const data = component.data as FilterPanelData
    return `
    <div class="filter-panel">
      <div class="filter-group">
        <div class="filter-title">Severity</div>
        <div class="filter-options">
          ${data.severityOptions
            .map(
              (severity: string) => `
            <label class="filter-option">
              <input type="checkbox" value="${severity}" data-filter="severity">
              <span class="risk-${severity}">${severity.toUpperCase()}</span>
            </label>
          `,
            )
            .join('')}
        </div>
      </div>
      
      <div class="filter-group">
        <div class="filter-title">Category</div>
        <div class="filter-options">
          ${data.categoryOptions
            .map(
              (category: string) => `
            <label class="filter-option">
              <input type="checkbox" value="${category}" data-filter="category">
              <span>${category}</span>
            </label>
          `,
            )
            .join('')}
        </div>
      </div>
      
      <div class="filter-group">
        <div class="filter-title">Confidence Range</div>
        <input type="range" min="${data.confidenceRange.min}" max="${data.confidenceRange.max}" 
               value="${this.config.confidenceThreshold}" data-filter="confidence"
               style="width: 100%;">
        <span id="confidence-value">${this.config.confidenceThreshold}%</span>
      </div>
    </div>`
  }

  /**
   * Render metrics chart placeholder
   */
  private renderMetricsChart(_component: InteractiveComponent): string {
    return `<div class="metrics-placeholder">
      <p>Interactive metrics dashboard with charts for:</p>
      <ul>
        <li>Code quality metrics</li>
        <li>Security assessment</li>
        <li>Performance indicators</li>
        <li>Test coverage analysis</li>
      </ul>
    </div>`
  }

  /**
   * Generate JavaScript for interactive functionality
   */
  private generateJavaScript(_components: InteractiveComponent[]): string {
    return `
    // Interactive report functionality
    document.addEventListener('DOMContentLoaded', function() {
        // Navigation handling
        document.querySelectorAll('.nav-tab').forEach(tab => {
            tab.addEventListener('click', function(e) {
                e.preventDefault();
                const target = this.getAttribute('data-target');
                document.getElementById(target)?.scrollIntoView({ behavior: 'smooth' });
                
                // Update active tab
                document.querySelectorAll('.nav-tab').forEach(t => t.classList.remove('active'));
                this.classList.add('active');
            });
        });

        // Collapsible sections
        document.querySelectorAll('.collapse-toggle').forEach(button => {
            button.addEventListener('click', function() {
                const componentId = this.getAttribute('data-component');
                const component = document.getElementById(componentId);
                const isCollapsed = component.classList.contains('collapsed');
                
                component.classList.toggle('collapsed');
                this.textContent = isCollapsed ? '▲' : '▼';
            });
        });

        // Table sorting
        document.querySelectorAll('.sortable').forEach(header => {
            header.addEventListener('click', function() {
                const column = this.getAttribute('data-column');
                const table = this.closest('table');
                const tbody = table.querySelector('tbody');
                const rows = Array.from(tbody.querySelectorAll('tr'));
                
                // Determine sort direction
                const isAsc = this.classList.contains('sort-asc');
                const isDesc = this.classList.contains('sort-desc');
                let newDirection = isAsc ? 'desc' : 'asc';
                
                // Clear all sort classes
                table.querySelectorAll('.sortable').forEach(h => {
                    h.classList.remove('sort-asc', 'sort-desc');
                });
                
                // Add new sort class
                this.classList.add('sort-' + newDirection);
                
                // Sort rows
                rows.sort((a, b) => {
                    const aVal = a.querySelector(\`td:nth-child(\${Array.from(this.parentNode.children).indexOf(this) + 1})\`).textContent;
                    const bVal = b.querySelector(\`td:nth-child(\${Array.from(this.parentNode.children).indexOf(this) + 1})\`).textContent;
                    
                    if (newDirection === 'asc') {
                        return aVal.localeCompare(bVal);
                    } else {
                        return bVal.localeCompare(aVal);
                    }
                });
                
                // Re-append sorted rows
                rows.forEach(row => tbody.appendChild(row));
            });
        });

        // Search functionality
        const searchInput = document.getElementById('findings-search');
        if (searchInput) {
            searchInput.addEventListener('input', function() {
                const searchTerm = this.value.toLowerCase();
                const rows = document.querySelectorAll('.finding-row');
                
                rows.forEach(row => {
                    const text = row.textContent.toLowerCase();
                    row.style.display = text.includes(searchTerm) ? '' : 'none';
                });
            });
        }

        // Filter functionality
        document.querySelectorAll('[data-filter]').forEach(filter => {
            filter.addEventListener('change', function() {
                applyFilters();
            });
        });

        // Confidence range display
        const confidenceRange = document.querySelector('[data-filter="confidence"]');
        if (confidenceRange) {
            confidenceRange.addEventListener('input', function() {
                document.getElementById('confidence-value').textContent = this.value + '%';
            });
        }

        // Finding row click handler
        document.querySelectorAll('.finding-row').forEach(row => {
            row.addEventListener('click', function() {
                const findingId = this.getAttribute('data-finding-id');
                showFindingDetails(findingId);
            });
        });

        function applyFilters() {
            const severityFilters = Array.from(document.querySelectorAll('[data-filter="severity"]:checked')).map(el => el.value);
            const categoryFilters = Array.from(document.querySelectorAll('[data-filter="category"]:checked')).map(el => el.value);
            const confidenceThreshold = document.querySelector('[data-filter="confidence"]')?.value || 0;
            
            const rows = document.querySelectorAll('.finding-row');
            
            rows.forEach(row => {
                const severity = row.children[1].textContent.toLowerCase();
                const category = row.children[4].textContent.toLowerCase();
                const confidence = parseInt(row.children[2].textContent);
                
                const severityMatch = severityFilters.length === 0 || severityFilters.includes(severity);
                const categoryMatch = categoryFilters.length === 0 || categoryFilters.includes(category);
                const confidenceMatch = confidence >= confidenceThreshold;
                
                row.style.display = (severityMatch && categoryMatch && confidenceMatch) ? '' : 'none';
            });
        }

        function showFindingDetails(findingId) {
            alert('Show detailed view for finding: ' + findingId);
            // In a real implementation, this would open a modal or navigate to a detail page
        }

        // Metric card hover effects
        document.querySelectorAll('.metric-card').forEach(card => {
            card.addEventListener('mouseenter', function() {
                this.style.transform = 'translateY(-4px)';
            });
            
            card.addEventListener('mouseleave', function() {
                this.style.transform = 'translateY(-2px)';
            });
        });
    });
    `
  }

  /**
   * Generate risk matrix data
   */
  private generateRiskMatrix(businessRisk: BusinessRiskAssessment): unknown {
    return {
      impact: {
        critical: businessRisk.dataSecurityRisk ? 1 : 0,
        high: businessRisk.userExperienceImpact === 'high' ? 1 : 0,
        medium: businessRisk.complianceImplications.length > 0 ? 1 : 0,
        low: 1,
      },
      likelihood: {
        high: businessRisk.criticalPathsAffected.length > 0 ? 1 : 0,
        medium: businessRisk.affectedDomains.length > 2 ? 1 : 0,
        low: 1,
      },
    }
  }

  /**
   * Create default component state
   */
  private createComponentState(): ComponentState {
    return {
      visible: true,
      collapsed: false,
      loading: false,
      lastUpdated: new Date().toISOString(),
      userInteractions: 0,
    }
  }
}

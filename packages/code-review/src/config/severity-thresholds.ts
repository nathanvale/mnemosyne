/**
 * Configurable severity thresholds for PR analysis
 * These thresholds determine when to block PRs or request changes
 */

export interface SeverityThresholds {
  /**
   * Thresholds for security_block decision
   */
  securityBlock: {
    criticalVulnerabilities: number // Real CVEs/CWEs with critical severity
    highConfidenceThreshold: number // Minimum confidence % for blocking
  }

  /**
   * Thresholds for request_changes decision
   */
  requestChanges: {
    highSeverityCount: number // Number of high severity issues
    securityDebtScoreMin: number // Minimum acceptable security debt score
    validatedHighSeverityCount: number // Number of validated high issues
  }

  /**
   * Thresholds for conditional_approval decision
   */
  conditionalApproval: {
    mediumSeverityCount: number // Number of medium severity issues
    securityDebtScoreMin: number // Minimum acceptable security debt score
    validatedMediumSeverityCount: number // Number of validated medium issues
  }

  /**
   * Confidence levels for validation
   */
  confidence: {
    minimumForBlocking: number // Minimum confidence to block a PR
    defaultConfidence: number // Default confidence level
  }
}

/**
 * Default thresholds - calibrated for reasonable security without false positives
 */
export const DEFAULT_THRESHOLDS: SeverityThresholds = {
  securityBlock: {
    criticalVulnerabilities: 1, // Block if ANY real CVE/CWE found
    highConfidenceThreshold: 80, // Only block with 80%+ confidence
  },
  requestChanges: {
    highSeverityCount: 5, // Allow up to 4 high severity issues
    securityDebtScoreMin: 50, // Request changes if score < 50
    validatedHighSeverityCount: 3, // Allow up to 2 validated high issues
  },
  conditionalApproval: {
    mediumSeverityCount: 3, // Allow up to 2 medium severity issues
    securityDebtScoreMin: 70, // Conditional if score < 70
    validatedMediumSeverityCount: 5, // Allow up to 4 validated medium issues
  },
  confidence: {
    minimumForBlocking: 80, // Don't block unless 80%+ confident
    defaultConfidence: 70, // Default confidence level
  },
}

/**
 * Strict thresholds for high-security environments
 */
export const STRICT_THRESHOLDS: SeverityThresholds = {
  securityBlock: {
    criticalVulnerabilities: 1,
    highConfidenceThreshold: 60, // Lower threshold for blocking
  },
  requestChanges: {
    highSeverityCount: 2, // More strict on high severity
    securityDebtScoreMin: 70,
    validatedHighSeverityCount: 1,
  },
  conditionalApproval: {
    mediumSeverityCount: 2,
    securityDebtScoreMin: 80,
    validatedMediumSeverityCount: 3,
  },
  confidence: {
    minimumForBlocking: 60,
    defaultConfidence: 75,
  },
}

/**
 * Lenient thresholds for internal/experimental projects
 */
export const LENIENT_THRESHOLDS: SeverityThresholds = {
  securityBlock: {
    criticalVulnerabilities: 3, // Allow more critical issues
    highConfidenceThreshold: 95, // Very high confidence required
  },
  requestChanges: {
    highSeverityCount: 10,
    securityDebtScoreMin: 30,
    validatedHighSeverityCount: 7,
  },
  conditionalApproval: {
    mediumSeverityCount: 10,
    securityDebtScoreMin: 50,
    validatedMediumSeverityCount: 15,
  },
  confidence: {
    minimumForBlocking: 95,
    defaultConfidence: 60,
  },
}

/**
 * Get thresholds based on environment or configuration
 */
export function getThresholds(
  mode?: 'default' | 'strict' | 'lenient',
): SeverityThresholds {
  switch (mode) {
    case 'strict':
      return STRICT_THRESHOLDS
    case 'lenient':
      return LENIENT_THRESHOLDS
    default:
      return DEFAULT_THRESHOLDS
  }
}

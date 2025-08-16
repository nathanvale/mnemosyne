import type { GitHubFileChange } from '../types/github'
import type { FileContext } from './issue-prioritizer'

/**
 * Analyzes file context to determine criticality for issue prioritization
 */
export class FileContextAnalyzer {
  // Critical file patterns that indicate core business logic
  private static readonly CORE_PATTERNS = [
    /src\/core\//,
    /src\/domain\//,
    /src\/business\//,
    /src\/services\//,
    /src\/api\//,
    /src\/models\//,
    /src\/entities\//,
    /src\/repositories\//,
  ]

  // User-facing file patterns
  private static readonly USER_FACING_PATTERNS = [
    /src\/components\//,
    /src\/pages\//,
    /src\/views\//,
    /src\/ui\//,
    /src\/routes\//,
    /src\/controllers\//,
    /app\/routes\//,
    /\.tsx?$/,
    /\.jsx?$/,
  ]

  // Security-related file patterns
  private static readonly SECURITY_PATTERNS = [
    /auth/i,
    /security/i,
    /permission/i,
    /password/i,
    /token/i,
    /crypto/i,
    /encrypt/i,
    /session/i,
    /secret/i,
    /credential/i,
    /\.env/,
    /config/i,
  ]

  // Test file patterns
  private static readonly TEST_PATTERNS = [
    /\.test\.[jt]sx?$/,
    /\.spec\.[jt]sx?$/,
    /__tests__\//,
    /__mocks__\//,
    /test\//,
    /tests\//,
    /\.stories\.[jt]sx?$/,
  ]

  /**
   * Analyze a single file to determine its context
   */
  static analyzeFile(file: GitHubFileChange): FileContext {
    const filePath = file.filename

    return {
      filePath,
      isCore: this.isCore(filePath),
      isUserFacing: this.isUserFacing(filePath),
      isSecurityRelated: this.isSecurityRelated(filePath),
      isTest: this.isTest(filePath),
      hasTests: false, // This would need to be determined by checking if test files exist
      changeSize: file.changes,
    }
  }

  /**
   * Analyze multiple files and return a map of contexts
   */
  static analyzeFiles(files: GitHubFileChange[]): Map<string, FileContext> {
    const contexts = new Map<string, FileContext>()

    for (const file of files) {
      contexts.set(file.filename, this.analyzeFile(file))
    }

    // Check for test coverage (simplified - checks if any test files are changed)
    const hasTestChanges = files.some((f) => this.isTest(f.filename))

    // Update hasTests flag for non-test files if tests are also being changed
    if (hasTestChanges) {
      for (const [path, context] of contexts) {
        if (!context.isTest) {
          // Check if there's a test file for this file
          const baseName = path.replace(/\.[jt]sx?$/, '').replace(/^src\//, '')

          const hasRelatedTest = files.some((f) => {
            const testPath = f.filename
            return (
              this.isTest(testPath) &&
              (testPath.includes(baseName) ||
                testPath.includes(baseName.split('/').pop() || ''))
            )
          })

          context.hasTests = hasRelatedTest
        }
      }
    }

    return contexts
  }

  /**
   * Check if file is core business logic
   */
  private static isCore(filePath: string): boolean {
    return this.CORE_PATTERNS.some((pattern) => pattern.test(filePath))
  }

  /**
   * Check if file is user-facing
   */
  private static isUserFacing(filePath: string): boolean {
    return this.USER_FACING_PATTERNS.some((pattern) => pattern.test(filePath))
  }

  /**
   * Check if file is security-related
   */
  private static isSecurityRelated(filePath: string): boolean {
    return this.SECURITY_PATTERNS.some((pattern) => pattern.test(filePath))
  }

  /**
   * Check if file is a test file
   */
  private static isTest(filePath: string): boolean {
    return this.TEST_PATTERNS.some((pattern) => pattern.test(filePath))
  }

  /**
   * Calculate file criticality score
   */
  static calculateCriticalityScore(context: FileContext): number {
    let score = 50 // Base score

    if (context.isCore) score += 30
    if (context.isUserFacing) score += 20
    if (context.isSecurityRelated) score += 40
    if (context.isTest) score -= 30 // Tests are less critical
    if (!context.hasTests && !context.isTest) score += 10 // No test coverage increases risk

    // Large changes are riskier
    if (context.changeSize > 1000) score += 20
    else if (context.changeSize > 500) score += 15
    else if (context.changeSize > 100) score += 10
    else if (context.changeSize > 50) score += 5

    return Math.min(100, Math.max(0, score))
  }
}

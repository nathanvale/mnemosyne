/**
 * Task Executor Interface
 * Provides abstraction for task execution with proper dependency injection
 */

export interface TaskOptions {
  subagent_type: string
  description: string
  prompt: string
}

export interface TaskResult {
  findings: unknown[]
  riskLevel: 'low' | 'medium' | 'high' | 'critical'
  recommendations: string[]
  confidence: number
}

export interface TaskExecutor {
  execute(options: TaskOptions): Promise<string>
}

/**
 * Default task executor that returns a basic response
 * Used when no actual task executor is available
 */
export class DefaultTaskExecutor implements TaskExecutor {
  async execute(_options: TaskOptions): Promise<string> {
    const result: TaskResult = {
      findings: [],
      riskLevel: 'low',
      recommendations: [
        'Pattern-based analysis used - manual review recommended',
      ],
      confidence: 0.5,
    }
    return JSON.stringify(result)
  }
}

/**
 * Mock task executor for testing
 */
export class MockTaskExecutor implements TaskExecutor {
  private mockResponse: string

  constructor(response?: TaskResult) {
    this.mockResponse = JSON.stringify(
      response || {
        findings: [],
        riskLevel: 'medium',
        recommendations: ['Mock analysis completed'],
        confidence: 0.8,
      },
    )
  }

  async execute(_options: TaskOptions): Promise<string> {
    return this.mockResponse
  }

  setResponse(response: TaskResult): void {
    this.mockResponse = JSON.stringify(response)
  }
}

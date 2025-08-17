import { describe, it, expect } from 'vitest'

describe('Package Exports', () => {
  it('exports all expected modules', async () => {
    const exports = await import('../index')

    // Check that type exports are available (though they won't be at runtime)
    // This mainly ensures the module can be imported without errors
    expect(exports).toBeDefined()

    // Check for specific exported functions/classes that should be available
    expect(exports.CodeRabbitParser).toBeDefined()
    expect(exports.GitHubParser).toBeDefined()
    expect(exports.PRMetricsCollector).toBeDefined()
    expect(exports.SecurityDataIntegrator).toBeDefined()
    expect(exports.ExpertValidator).toBeDefined()
    expect(exports.ContextAnalyzer).toBeDefined()
    expect(exports.IssuePrioritizer).toBeDefined()
    expect(exports.IssuePriority).toBeDefined()
    expect(exports.FileContextAnalyzer).toBeDefined()
    expect(exports.ReportGenerator).toBeDefined()
    // Note: InteractiveReport doesn't seem to be exported
  })

  it('exports IssuePriority enum with correct values', async () => {
    const { IssuePriority } = await import('../index')

    expect(IssuePriority.Blocking).toBe('blocking')
    expect(IssuePriority.Important).toBe('important')
    expect(IssuePriority.Suggestion).toBe('suggestion')
  })
})

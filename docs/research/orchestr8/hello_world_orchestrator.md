# Hello World Multi-Agent Orchestrator Example

## Complete starter package demonstrating the dual-deployment architecture

This example creates a simple but complete multi-agent system where an orchestrator coordinates three specialized agents to research a GitHub username. Each agent gathers different information and returns it to the orchestrator for a unified response.

## Project Structure

```
hello-agents/
├── packages/
│   ├── agents-core/                    # Foundation package
│   │   ├── src/
│   │   │   ├── base/
│   │   │   │   ├── base-agent.ts
│   │   │   │   └── orchestrator.ts
│   │   │   ├── xml/
│   │   │   │   └── prompt-manager.ts
│   │   │   └── types/
│   │   │       └── common.types.ts
│   │   └── package.json
│   └── hello-world-agents/             # Specialized agents
│       ├── src/
│       │   ├── agents/
│       │   │   ├── github-agent.ts
│       │   │   ├── profile-agent.ts
│       │   │   └── activity-agent.ts
│       │   ├── orchestrator/
│       │   │   └── hello-orchestrator.ts
│       │   └── claude/
│       │       ├── github-specialist.md
│       │       ├── profile-specialist.md
│       │       └── activity-specialist.md
│       ├── .claude/
│       │   └── agents/
│       │       ├── github-specialist.md
│       │       ├── profile-specialist.md
│       │       └── activity-specialist.md
│       └── package.json
├── turbo.json
└── package.json
```

## 1. Core Package Foundation

### Base Agent Interface

```typescript
// packages/agents-core/src/types/common.types.ts
export interface AgentRequest {
  id: string
  type: string
  target: string
  context?: Record<string, any>
  metadata?: {
    timestamp: string
    correlationId: string
  }
}

export interface AgentResponse {
  id: string
  agentName: string
  success: boolean
  data?: any
  error?: string
  confidence: number
  processingTime: number
  sources: string[]
}

export interface OrchestratorResult {
  target: string
  summary: string
  agents: AgentResponse[]
  totalTime: number
  confidence: number
}
```

### Base Agent Class

```typescript
// packages/agents-core/src/base/base-agent.ts
import { AgentRequest, AgentResponse } from '../types/common.types'

export abstract class BaseAgent {
  protected name: string
  protected description: string

  constructor(name: string, description: string) {
    this.name = name
    this.description = description
  }

  abstract process(request: AgentRequest): Promise<AgentResponse>

  protected createResponse(
    request: AgentRequest,
    success: boolean,
    data?: any,
    error?: string,
    sources: string[] = [],
  ): AgentResponse {
    return {
      id: request.id,
      agentName: this.name,
      success,
      data,
      error,
      confidence: success ? 0.8 : 0,
      processingTime: Date.now() - parseInt(request.metadata?.timestamp || '0'),
      sources,
    }
  }

  async delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms))
  }
}
```

### XML Prompt Manager

```typescript
// packages/agents-core/src/xml/prompt-manager.ts
export class XMLPromptManager {
  static generateUserResearchPrompt(
    username: string,
    agentType: string,
  ): string {
    const prompts = {
      github: `
<role>You are a GitHub research specialist analyzing user profiles and repositories</role>

<instructions>
Research the GitHub user "${username}" and provide comprehensive information about:
1. Basic profile information (name, bio, location, company)
2. Repository statistics and notable projects
3. Programming languages used
4. Contribution patterns and activity level
5. Notable achievements or popular repositories
</instructions>

<constraints>
<constraint>Focus on publicly available information only</constraint>
<constraint>Provide factual data without speculation</constraint>
<constraint>Include confidence levels for uncertain information</constraint>
</constraints>

<output_format>
Return a structured summary with:
- Profile overview
- Top repositories (with stars/forks)
- Primary programming languages
- Activity assessment
- Key insights
</output_format>
      `,

      profile: `
<role>You are a professional profile analyst specializing in developer background research</role>

<instructions>
Analyze the professional profile of "${username}" across platforms to determine:
1. Professional background and experience level
2. Areas of expertise and specialization
3. Open source contributions and community involvement
4. Professional network and influence
5. Career trajectory and current focus
</instructions>

<analysis_framework>
<dimension>Technical expertise depth</dimension>
<dimension>Community engagement level</dimension>
<dimension>Project leadership experience</dimension>
<dimension>Industry recognition</dimension>
</analysis_framework>

<output_format>
Provide a professional assessment including:
- Experience level estimation
- Core competencies
- Community involvement
- Professional trajectory
- Influence metrics
</output_format>
      `,

      activity: `
<role>You are an activity pattern analyst specializing in developer behavior analysis</role>

<instructions>
Examine the recent activity patterns of "${username}" to understand:
1. Contribution frequency and consistency
2. Types of activities (commits, PRs, issues, reviews)
3. Collaboration patterns and team interactions
4. Project maintenance and ownership
5. Learning and growth indicators
</instructions>

<activity_metrics>
<metric>Commit frequency and timing</metric>
<metric>Issue creation and resolution</metric>
<metric>Pull request patterns</metric>
<metric>Code review participation</metric>
<metric>Project maintenance level</metric>
</activity_metrics>

<output_format>
Generate an activity profile with:
- Activity level classification
- Contribution patterns
- Collaboration style
- Maintenance commitment
- Growth indicators
</output_format>
      `,
    }

    return prompts[agentType] || prompts.github
  }
}
```

## 2. Specialized Agent Implementations

### GitHub Research Agent

```typescript
// packages/hello-world-agents/src/agents/github-agent.ts
import { BaseAgent } from '@agents/core/base/base-agent'
import { AgentRequest, AgentResponse } from '@agents/core/types/common.types'
import { XMLPromptManager } from '@agents/core/xml/prompt-manager'

export class GitHubAgent extends BaseAgent {
  constructor() {
    super('github-specialist', 'Analyzes GitHub profiles and repositories')
  }

  async process(request: AgentRequest): Promise<AgentResponse> {
    const startTime = Date.now()
    console.log(`🐙 GitHub Agent: Researching ${request.target}...`)

    try {
      // Simulate API calls and research
      await this.delay(1500) // Simulate processing time

      // Mock GitHub data (in real implementation, call GitHub API)
      const githubData = await this.mockGitHubResearch(request.target)

      // Generate XML prompt for analysis
      const prompt = XMLPromptManager.generateUserResearchPrompt(
        request.target,
        'github',
      )

      // Simulate Claude analysis of GitHub data
      const analysis = await this.analyzeWithClaude(prompt, githubData)

      return this.createResponse(
        request,
        true,
        {
          profile: githubData.profile,
          repositories: githubData.repositories,
          analysis: analysis,
          statistics: githubData.stats,
        },
        undefined,
        [`https://github.com/${request.target}`, 'https://api.github.com'],
      )
    } catch (error) {
      return this.createResponse(
        request,
        false,
        undefined,
        `GitHub research failed: ${error.message}`,
      )
    }
  }

  private async mockGitHubResearch(username: string) {
    // Simulate GitHub API data
    return {
      profile: {
        login: username,
        name: `${username.charAt(0).toUpperCase() + username.slice(1)} Developer`,
        bio: 'Full-stack developer passionate about open source',
        location: 'San Francisco, CA',
        company: 'Tech Startup Inc.',
        publicRepos: 42,
        followers: 256,
        following: 89,
      },
      repositories: [
        {
          name: 'awesome-project',
          stars: 1234,
          language: 'TypeScript',
          description: 'An awesome project',
        },
        {
          name: 'react-components',
          stars: 567,
          language: 'JavaScript',
          description: 'Reusable React components',
        },
        {
          name: 'python-utils',
          stars: 89,
          language: 'Python',
          description: 'Utility functions for Python',
        },
      ],
      stats: {
        totalStars: 1890,
        primaryLanguages: ['TypeScript', 'JavaScript', 'Python'],
        contributionLevel: 'Active',
      },
    }
  }

  private async analyzeWithClaude(prompt: string, data: any): Promise<string> {
    // Simulate Claude analysis (in real implementation, call Claude API)
    await this.delay(500)

    return `Based on the GitHub profile analysis:
- Active developer with ${data.stats.totalStars} total stars across repositories
- Primary expertise in ${data.stats.primaryLanguages.join(', ')}
- Strong open source contributor with ${data.profile.publicRepos} public repositories
- Good community engagement with ${data.profile.followers} followers
- Well-rounded full-stack developer profile`
  }
}
```

### Profile Research Agent

```typescript
// packages/hello-world-agents/src/agents/profile-agent.ts
import { BaseAgent } from '@agents/core/base/base-agent'
import { AgentRequest, AgentResponse } from '@agents/core/types/common.types'
import { XMLPromptManager } from '@agents/core/xml/prompt-manager'

export class ProfileAgent extends BaseAgent {
  constructor() {
    super('profile-specialist', 'Analyzes professional profiles and background')
  }

  async process(request: AgentRequest): Promise<AgentResponse> {
    const startTime = Date.now()
    console.log(`👤 Profile Agent: Analyzing ${request.target}...`)

    try {
      await this.delay(1200)

      // Mock professional profile data
      const profileData = await this.mockProfileResearch(request.target)

      const prompt = XMLPromptManager.generateUserResearchPrompt(
        request.target,
        'profile',
      )
      const analysis = await this.analyzeWithClaude(prompt, profileData)

      return this.createResponse(
        request,
        true,
        {
          professional: profileData.professional,
          skills: profileData.skills,
          experience: profileData.experience,
          analysis: analysis,
        },
        undefined,
        [
          'LinkedIn equivalent',
          'Professional networks',
          'Developer communities',
        ],
      )
    } catch (error) {
      return this.createResponse(
        request,
        false,
        undefined,
        `Profile research failed: ${error.message}`,
      )
    }
  }

  private async mockProfileResearch(username: string) {
    return {
      professional: {
        experienceLevel: 'Mid-Senior',
        currentRole: 'Senior Full-Stack Developer',
        industries: ['Technology', 'SaaS', 'Open Source'],
        networkSize: 'Medium (500-1000 connections)',
      },
      skills: {
        primary: ['TypeScript', 'React', 'Node.js', 'Python'],
        secondary: ['Docker', 'AWS', 'PostgreSQL', 'GraphQL'],
        emerging: ['Machine Learning', 'AI/LLM Integration'],
      },
      experience: {
        yearsActive: '5-7 years',
        projectTypes: [
          'Web Applications',
          'API Development',
          'Open Source Libraries',
        ],
        leadership: 'Team lead experience on 2-3 projects',
      },
    }
  }

  private async analyzeWithClaude(prompt: string, data: any): Promise<string> {
    await this.delay(400)

    return `Professional profile assessment:
- ${data.professional.experienceLevel} level developer with strong technical foundation
- Current focus: ${data.professional.currentRole}
- Core expertise: ${data.skills.primary.join(', ')}
- Growing into: ${data.skills.emerging.join(', ')}
- Leadership experience: ${data.experience.leadership}
- Well-positioned for senior technical roles`
  }
}
```

### Activity Research Agent

```typescript
// packages/hello-world-agents/src/agents/activity-agent.ts
import { BaseAgent } from '@agents/core/base/base-agent'
import { AgentRequest, AgentResponse } from '@agents/core/types/common.types'
import { XMLPromptManager } from '@agents/core/xml/prompt-manager'

export class ActivityAgent extends BaseAgent {
  constructor() {
    super(
      'activity-specialist',
      'Analyzes user activity patterns and engagement',
    )
  }

  async process(request: AgentRequest): Promise<AgentResponse> {
    const startTime = Date.now()
    console.log(`📊 Activity Agent: Tracking ${request.target}...`)

    try {
      await this.delay(1000)

      const activityData = await this.mockActivityResearch(request.target)

      const prompt = XMLPromptManager.generateUserResearchPrompt(
        request.target,
        'activity',
      )
      const analysis = await this.analyzeWithClaude(prompt, activityData)

      return this.createResponse(
        request,
        true,
        {
          patterns: activityData.patterns,
          engagement: activityData.engagement,
          trends: activityData.trends,
          analysis: analysis,
        },
        undefined,
        ['GitHub Activity API', 'Contribution graphs', 'Community metrics'],
      )
    } catch (error) {
      return this.createResponse(
        request,
        false,
        undefined,
        `Activity research failed: ${error.message}`,
      )
    }
  }

  private async mockActivityResearch(username: string) {
    return {
      patterns: {
        commitFrequency: 'Daily commits, 4-6 days per week',
        peakHours: 'Evening (6-10 PM), Weekend mornings',
        projectFocus: 'Maintains 3-4 active projects simultaneously',
        collaborationStyle: 'Active in code reviews, responsive to issues',
      },
      engagement: {
        issueParticipation: 'High - creates and resolves 8-12 issues/month',
        prActivity: 'Moderate - 15-20 PRs/month across projects',
        communityInvolvement: 'Regular contributor to 5-8 open source projects',
        mentoring: 'Provides detailed code review feedback',
      },
      trends: {
        recentGrowth: 'Increasing focus on TypeScript and React ecosystem',
        newTechnologies: 'Experimenting with AI/ML integration',
        consistencyScore: 0.85,
        burnoutRisk: 'Low - maintains healthy contribution pace',
      },
    }
  }

  private async analyzeWithClaude(prompt: string, data: any): Promise<string> {
    await this.delay(300)

    return `Activity pattern analysis:
- Consistent contributor: ${data.patterns.commitFrequency}
- Peak productivity: ${data.patterns.peakHours}
- Strong community engagement: ${data.engagement.communityInvolvement}
- Healthy work-life balance with consistency score: ${data.trends.consistencyScore}
- Growth trajectory: ${data.trends.recentGrowth}
- Low burnout risk with sustainable contribution patterns`
  }
}
```

## 3. Orchestrator Implementation

### Hello World Orchestrator

```typescript
// packages/hello-world-agents/src/orchestrator/hello-orchestrator.ts
import {
  AgentRequest,
  AgentResponse,
  OrchestratorResult,
} from '@agents/core/types/common.types'
import { GitHubAgent } from '../agents/github-agent'
import { ProfileAgent } from '../agents/profile-agent'
import { ActivityAgent } from '../agents/activity-agent'

export class HelloWorldOrchestrator {
  private githubAgent: GitHubAgent
  private profileAgent: ProfileAgent
  private activityAgent: ActivityAgent

  constructor() {
    this.githubAgent = new GitHubAgent()
    this.profileAgent = new ProfileAgent()
    this.activityAgent = new ActivityAgent()
  }

  async researchUser(username: string): Promise<OrchestratorResult> {
    const startTime = Date.now()
    console.log(
      `🎭 Hello World Orchestrator: Starting research on "${username}"`,
    )

    // Create coordinated requests
    const correlationId = `research-${Date.now()}`
    const baseRequest: Partial<AgentRequest> = {
      type: 'user-research',
      target: username,
      metadata: {
        timestamp: startTime.toString(),
        correlationId,
      },
    }

    // Execute agents in parallel
    console.log('🚀 Launching parallel agent research...')

    const [githubResult, profileResult, activityResult] =
      await Promise.allSettled([
        this.githubAgent.process({
          ...baseRequest,
          id: `github-${correlationId}`,
        } as AgentRequest),

        this.profileAgent.process({
          ...baseRequest,
          id: `profile-${correlationId}`,
        } as AgentRequest),

        this.activityAgent.process({
          ...baseRequest,
          id: `activity-${correlationId}`,
        } as AgentRequest),
      ])

    // Process results
    const agents: AgentResponse[] = []
    const errors: string[] = []

    // Handle GitHub results
    if (githubResult.status === 'fulfilled') {
      agents.push(githubResult.value)
      console.log('✅ GitHub research completed')
    } else {
      console.log('❌ GitHub research failed:', githubResult.reason)
      errors.push(`GitHub: ${githubResult.reason}`)
    }

    // Handle Profile results
    if (profileResult.status === 'fulfilled') {
      agents.push(profileResult.value)
      console.log('✅ Profile research completed')
    } else {
      console.log('❌ Profile research failed:', profileResult.reason)
      errors.push(`Profile: ${profileResult.reason}`)
    }

    // Handle Activity results
    if (activityResult.status === 'fulfilled') {
      agents.push(activityResult.value)
      console.log('✅ Activity research completed')
    } else {
      console.log('❌ Activity research failed:', activityResult.reason)
      errors.push(`Activity: ${activityResult.reason}`)
    }

    // Generate comprehensive summary
    const summary = await this.generateSummary(username, agents)
    const totalTime = Date.now() - startTime
    const confidence = this.calculateOverallConfidence(agents)

    console.log(
      `🎯 Research completed in ${totalTime}ms with ${confidence.toFixed(2)} confidence`,
    )

    return {
      target: username,
      summary,
      agents,
      totalTime,
      confidence,
    }
  }

  private async generateSummary(
    username: string,
    agents: AgentResponse[],
  ): Promise<string> {
    const successfulAgents = agents.filter((a) => a.success)

    if (successfulAgents.length === 0) {
      return `Unable to research ${username} - all agents failed to gather information.`
    }

    let summary = `# Research Summary for ${username}\n\n`

    // GitHub summary
    const githubAgent = successfulAgents.find(
      (a) => a.agentName === 'github-specialist',
    )
    if (githubAgent?.data) {
      const data = githubAgent.data
      summary += `## GitHub Profile\n`
      summary += `- **Name**: ${data.profile?.name || username}\n`
      summary += `- **Repositories**: ${data.profile?.publicRepos || 'Unknown'} public repos\n`
      summary += `- **Stars**: ${data.statistics?.totalStars || 'Unknown'} total stars\n`
      summary += `- **Languages**: ${data.statistics?.primaryLanguages?.join(', ') || 'Various'}\n`
      summary += `- **Analysis**: ${data.analysis}\n\n`
    }

    // Profile summary
    const profileAgent = successfulAgents.find(
      (a) => a.agentName === 'profile-specialist',
    )
    if (profileAgent?.data) {
      const data = profileAgent.data
      summary += `## Professional Profile\n`
      summary += `- **Level**: ${data.professional?.experienceLevel || 'Unknown'}\n`
      summary += `- **Role**: ${data.professional?.currentRole || 'Developer'}\n`
      summary += `- **Skills**: ${data.skills?.primary?.join(', ') || 'Various technologies'}\n`
      summary += `- **Analysis**: ${data.analysis}\n\n`
    }

    // Activity summary
    const activityAgent = successfulAgents.find(
      (a) => a.agentName === 'activity-specialist',
    )
    if (activityAgent?.data) {
      const data = activityAgent.data
      summary += `## Activity Patterns\n`
      summary += `- **Frequency**: ${data.patterns?.commitFrequency || 'Regular contributor'}\n`
      summary += `- **Engagement**: ${data.engagement?.communityInvolvement || 'Active in community'}\n`
      summary += `- **Consistency**: ${data.trends?.consistencyScore || 'Good'}\n`
      summary += `- **Analysis**: ${data.analysis}\n\n`
    }

    // Overall assessment
    summary += `## Overall Assessment\n`
    summary += `Based on analysis from ${successfulAgents.length} specialized agents, `
    summary += `${username} appears to be a skilled developer with strong technical capabilities `
    summary += `and active community involvement. `

    if (successfulAgents.length === 3) {
      summary += `Complete profile available across all research dimensions.`
    } else {
      summary += `Partial profile available (${successfulAgents.length}/3 agents completed successfully).`
    }

    return summary
  }

  private calculateOverallConfidence(agents: AgentResponse[]): number {
    const successfulAgents = agents.filter((a) => a.success)
    if (successfulAgents.length === 0) return 0

    const avgConfidence =
      successfulAgents.reduce((sum, a) => sum + a.confidence, 0) /
      successfulAgents.length
    const completionBonus = successfulAgents.length / 3 // Bonus for more complete data

    return Math.min(avgConfidence * completionBonus, 1.0)
  }
}
```

## 4. Claude Code Sub-Agent Definitions

### GitHub Specialist

```markdown
## <!-- packages/hello-world-agents/.claude/agents/github-specialist.md -->

name: github-specialist
description: GitHub profile and repository research specialist. Use for analyzing GitHub users, repositories, contribution patterns, and development activity.
tools: web_search, web_fetch
model: sonnet
color: Black

---

You are a GitHub research specialist with expertise in analyzing developer profiles and open source contributions.

## Core Capabilities

- GitHub profile analysis and statistics
- Repository evaluation and ranking
- Contribution pattern analysis
- Programming language assessment
- Open source project evaluation

## Research Methodology

1. **Profile Analysis**: Extract basic profile information, bio, location, and social links
2. **Repository Assessment**: Analyze public repositories, stars, forks, and activity
3. **Language Analysis**: Determine primary programming languages and expertise areas
4. **Contribution Patterns**: Evaluate commit frequency, collaboration, and maintenance
5. **Community Impact**: Assess influence through stars, forks, and network effects

## Output Format

Provide structured research including:

- Profile summary with key metrics
- Top repositories with statistics
- Programming language breakdown
- Activity and contribution assessment
- Professional development insights

Always include confidence levels and source attribution for findings.
```

### Profile Specialist

```markdown
## <!-- packages/hello-world-agents/.claude/agents/profile-specialist.md -->

name: profile-specialist
description: Professional profile researcher specializing in developer background analysis across platforms and communities.
tools: web_search, web_fetch
model: sonnet
color: Blue

---

You are a professional profile analyst with expertise in evaluating developer backgrounds and career trajectories.

## Analysis Framework

- **Experience Assessment**: Determine skill level and years
```

import { http, HttpResponse } from 'msw'

// GitHub API handlers
const githubHandlers = [
  // Get PR data
  http.get(
    'https://api.github.com/repos/:owner/:repo/pulls/:pull_number',
    () => {
      return HttpResponse.json({
        number: 123,
        title: 'Test PR',
        body: 'Test PR description',
        user: { login: 'testuser' },
        head: { sha: 'abc123', ref: 'feature-branch' },
        base: { sha: 'def456', ref: 'main' },
        state: 'open',
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z',
      })
    },
  ),

  // Get PR files
  http.get(
    'https://api.github.com/repos/:owner/:repo/pulls/:pull_number/files',
    () => {
      return HttpResponse.json([
        {
          filename: 'src/test.ts',
          status: 'modified',
          additions: 10,
          deletions: 5,
          changes: 15,
          patch: '@@ -1,5 +1,10 @@\n-old code\n+new code',
        },
      ])
    },
  ),

  // Get PR comments
  http.get(
    'https://api.github.com/repos/:owner/:repo/pulls/:pull_number/comments',
    () => {
      return HttpResponse.json([
        {
          id: 1,
          body: 'Test comment',
          user: { login: 'reviewer' },
          created_at: '2024-01-01T00:00:00Z',
        },
      ])
    },
  ),

  // Get PR reviews
  http.get(
    'https://api.github.com/repos/:owner/:repo/pulls/:pull_number/reviews',
    () => {
      return HttpResponse.json([
        {
          id: 1,
          user: { login: 'reviewer' },
          state: 'APPROVED',
          body: 'LGTM',
          submitted_at: '2024-01-01T00:00:00Z',
        },
      ])
    },
  ),

  // Get commit
  http.get('https://api.github.com/repos/:owner/:repo/commits/:sha', () => {
    return HttpResponse.json({
      sha: 'abc123',
      commit: {
        message: 'Test commit',
        author: {
          name: 'Test Author',
          email: 'test@example.com',
          date: '2024-01-01T00:00:00Z',
        },
      },
    })
  }),

  // Compare commits
  http.get(
    'https://api.github.com/repos/:owner/:repo/compare/:base...:head',
    () => {
      return HttpResponse.json({
        files: [
          {
            filename: 'src/test.ts',
            status: 'modified',
            additions: 10,
            deletions: 5,
            changes: 15,
            patch: '@@ -1,5 +1,10 @@\n-old code\n+new code',
          },
        ],
        commits: [
          {
            sha: 'abc123',
            commit: {
              message: 'Test commit',
            },
          },
        ],
      })
    },
  ),
]

// CodeRabbit API handlers
const codeRabbitHandlers = [
  http.get('https://api.coderabbit.ai/v1/reviews/:pr_id', () => {
    return HttpResponse.json({
      id: 'review-123',
      pr_number: 123,
      status: 'completed',
      summary: 'Test review summary',
      issues: [
        {
          severity: 'high',
          type: 'security',
          message: 'Potential security issue',
          file: 'src/test.ts',
          line: 10,
        },
      ],
      suggestions: [
        {
          type: 'performance',
          message: 'Consider optimizing this loop',
          file: 'src/test.ts',
          line: 20,
        },
      ],
    })
  }),
]

// Export all handlers
export const handlers = [...githubHandlers, ...codeRabbitHandlers]

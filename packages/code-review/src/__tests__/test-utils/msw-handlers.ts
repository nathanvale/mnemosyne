import { http, HttpResponse } from 'msw'

// GitHub API handlers
export const githubHandlers = [
  // Get PR data
  http.get('https://api.github.com/repos/:owner/:repo/pulls/:prNumber', () => {
    return HttpResponse.json({
      number: 123,
      title: 'Test PR',
      body: 'Test PR description',
      state: 'open',
      user: {
        login: 'testuser',
        avatar_url: 'https://github.com/testuser.png',
        html_url: 'https://github.com/testuser',
        type: 'User',
      },
      head: {
        ref: 'feature-branch',
        sha: 'abc123',
        repo: {
          name: 'test-repo',
          full_name: 'test/test-repo',
          private: false,
          html_url: 'https://github.com/test/test-repo',
          default_branch: 'main',
          language: 'TypeScript',
          languages_url:
            'https://api.github.com/repos/test/test-repo/languages',
        },
      },
      base: {
        ref: 'main',
        sha: 'def456',
        repo: {
          name: 'test-repo',
          full_name: 'test/test-repo',
          private: false,
          html_url: 'https://github.com/test/test-repo',
          default_branch: 'main',
          language: 'TypeScript',
          languages_url:
            'https://api.github.com/repos/test/test-repo/languages',
        },
      },
      html_url: 'https://github.com/test/test-repo/pull/123',
      diff_url: 'https://github.com/test/test-repo/pull/123.diff',
      patch_url: 'https://github.com/test/test-repo/pull/123.patch',
      commits_url:
        'https://api.github.com/repos/test/test-repo/pulls/123/commits',
      comments_url:
        'https://api.github.com/repos/test/test-repo/issues/123/comments',
      created_at: '2024-01-01T00:00:00Z',
      updated_at: '2024-01-01T00:00:00Z',
      merged: false,
      mergeable: true,
      additions: 10,
      deletions: 5,
      changed_files: 2,
    })
  }),

  // Get PR files
  http.get(
    'https://api.github.com/repos/:owner/:repo/pulls/:prNumber/files',
    () => {
      return HttpResponse.json([
        {
          sha: 'file1sha',
          filename: 'src/test.ts',
          status: 'modified',
          additions: 7,
          deletions: 3,
          changes: 10,
          blob_url: 'https://github.com/test/test-repo/blob/abc123/src/test.ts',
          raw_url: 'https://github.com/test/test-repo/raw/abc123/src/test.ts',
          contents_url:
            'https://api.github.com/repos/test/test-repo/contents/src/test.ts',
          patch: '@@ -1,3 +1,7 @@\n-old line\n+new line\n+another new line',
        },
        {
          sha: 'file2sha',
          filename: 'src/another.ts',
          status: 'added',
          additions: 5,
          deletions: 0,
          changes: 5,
          blob_url:
            'https://github.com/test/test-repo/blob/abc123/src/another.ts',
          raw_url:
            'https://github.com/test/test-repo/raw/abc123/src/another.ts',
          contents_url:
            'https://api.github.com/repos/test/test-repo/contents/src/another.ts',
          patch: '@@ -0,0 +1,5 @@\n+new file content',
        },
      ])
    },
  ),

  // Get PR diff
  http.get('https://github.com/:owner/:repo/pull/:prNumber.diff', () => {
    return HttpResponse.text(`diff --git a/src/test.ts b/src/test.ts
index abc123..def456 100644
--- a/src/test.ts
+++ b/src/test.ts
@@ -1,3 +1,7 @@
-old line
+new line
+another new line`)
  }),

  // Get PR comments
  http.get(
    'https://api.github.com/repos/:owner/:repo/issues/:prNumber/comments',
    () => {
      return HttpResponse.json([
        {
          id: 1,
          body: 'Test comment',
          user: {
            login: 'coderabbitai',
            type: 'Bot',
          },
          created_at: '2024-01-01T00:00:00Z',
          updated_at: '2024-01-01T00:00:00Z',
        },
      ])
    },
  ),

  // Get commits
  http.get(
    'https://api.github.com/repos/:owner/:repo/pulls/:prNumber/commits',
    () => {
      return HttpResponse.json([
        {
          sha: 'commit1',
          commit: {
            message: 'Test commit message',
            author: {
              name: 'Test Author',
              email: 'test@example.com',
              date: '2024-01-01T00:00:00Z',
            },
          },
        },
      ])
    },
  ),
]

// CodeRabbit API handlers
export const codeRabbitHandlers = [
  // CodeRabbit analysis endpoint
  http.post('https://api.coderabbit.ai/v1/analyze', async () => {
    return HttpResponse.json({
      success: true,
      analysis: {
        summary: 'Test analysis summary',
        issues: [
          {
            severity: 'high',
            type: 'security',
            file: 'src/test.ts',
            line: 10,
            message: 'Potential security issue detected',
            suggestion: 'Consider using parameterized queries',
          },
        ],
        metrics: {
          complexity: 5,
          coverage: 80,
          maintainability: 'A',
        },
      },
    })
  }),

  // CodeRabbit PR review endpoint
  http.get('https://api.coderabbit.ai/v1/reviews/:prNumber', () => {
    return HttpResponse.json({
      prNumber: 123,
      status: 'completed',
      review: {
        summary: 'Overall the PR looks good with minor issues',
        findings: [
          {
            path: 'src/test.ts',
            line: 10,
            severity: 'warning',
            message: 'Consider adding error handling',
            category: 'error-handling',
          },
        ],
        stats: {
          filesReviewed: 2,
          issuesFound: 1,
          suggestionsProvided: 3,
        },
      },
    })
  }),
]

// Combined handlers
export const handlers = [...githubHandlers, ...codeRabbitHandlers]

// Error response handlers for testing error scenarios
export const errorHandlers = {
  githubServerError: http.get(
    'https://api.github.com/repos/:owner/:repo/pulls/:prNumber',
    () => {
      return HttpResponse.json(
        { message: 'Internal Server Error' },
        { status: 500 },
      )
    },
  ),

  githubNotFound: http.get(
    'https://api.github.com/repos/:owner/:repo/pulls/:prNumber',
    () => {
      return HttpResponse.json({ message: 'Not Found' }, { status: 404 })
    },
  ),

  githubRateLimit: http.get(
    'https://api.github.com/repos/:owner/:repo/pulls/:prNumber',
    () => {
      return HttpResponse.json(
        { message: 'API rate limit exceeded' },
        {
          status: 403,
          headers: {
            'X-RateLimit-Remaining': '0',
            'X-RateLimit-Reset': String(Date.now() / 1000 + 3600),
          },
        },
      )
    },
  ),

  codeRabbitTimeout: http.post(
    'https://api.coderabbit.ai/v1/analyze',
    async () => {
      await new Promise((resolve) => setTimeout(resolve, 35000)) // Simulate timeout
      return HttpResponse.json({ success: false })
    },
  ),

  codeRabbitError: http.get(
    'https://api.coderabbit.ai/v1/reviews/:prNumber',
    () => {
      return HttpResponse.json(
        { error: 'Analysis failed', message: 'Unable to process PR' },
        { status: 500 },
      )
    },
  ),
}

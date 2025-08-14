import { z } from 'zod'

/**
 * GitHub PR state
 */
export const GitHubPRState = z.enum(['open', 'closed', 'merged'])
export type GitHubPRState = z.infer<typeof GitHubPRState>

/**
 * GitHub check run status
 */
export const GitHubCheckStatus = z.enum(['queued', 'in_progress', 'completed'])
export type GitHubCheckStatus = z.infer<typeof GitHubCheckStatus>

/**
 * GitHub check run conclusion
 */
export const GitHubCheckConclusion = z.enum([
  'success',
  'failure',
  'neutral',
  'cancelled',
  'skipped',
  'timed_out',
  'action_required',
])
export type GitHubCheckConclusion = z.infer<typeof GitHubCheckConclusion>

/**
 * GitHub user information
 */
export const GitHubUser = z.object({
  id: z.number(),
  login: z.string(),
  avatar_url: z.string(),
  html_url: z.string(),
  type: z.enum(['User', 'Bot']),
})
export type GitHubUser = z.infer<typeof GitHubUser>

/**
 * GitHub repository information
 */
export const GitHubRepository = z.object({
  id: z.number(),
  name: z.string(),
  full_name: z.string(),
  private: z.boolean(),
  html_url: z.string(),
  default_branch: z.string(),
  language: z.string().nullable(),
  languages_url: z.string(),
})
export type GitHubRepository = z.infer<typeof GitHubRepository>

/**
 * Git commit information
 */
export const GitHubCommit = z.object({
  sha: z.string(),
  message: z.string(),
  author: z.object({
    name: z.string(),
    email: z.string(),
    date: z.string().datetime(),
  }),
  committer: z.object({
    name: z.string(),
    email: z.string(),
    date: z.string().datetime(),
  }),
  tree: z.object({
    sha: z.string(),
  }),
  url: z.string(),
  comment_count: z.number(),
})
export type GitHubCommit = z.infer<typeof GitHubCommit>

/**
 * File change in a PR
 */
export const GitHubFileChange = z.object({
  sha: z.string(),
  filename: z.string(),
  status: z.enum(['added', 'removed', 'modified', 'renamed']),
  additions: z.number(),
  deletions: z.number(),
  changes: z.number(),
  blob_url: z.string(),
  raw_url: z.string(),
  contents_url: z.string(),
  patch: z.string().optional(),
})
export type GitHubFileChange = z.infer<typeof GitHubFileChange>

/**
 * GitHub pull request data
 */
export const GitHubPullRequest = z.object({
  id: z.number(),
  number: z.number(),
  title: z.string(),
  body: z.string().nullable(),
  state: GitHubPRState,
  merged: z.boolean(),
  mergeable: z.boolean().nullable(),
  mergeable_state: z.string(),
  user: GitHubUser,
  assignees: z.array(GitHubUser),
  requested_reviewers: z.array(GitHubUser),
  labels: z.array(
    z.object({
      id: z.number(),
      name: z.string(),
      color: z.string(),
      description: z.string().nullable(),
    }),
  ),
  base: z.object({
    ref: z.string(),
    sha: z.string(),
    repo: GitHubRepository,
  }),
  head: z.object({
    ref: z.string(),
    sha: z.string(),
    repo: GitHubRepository.nullable(),
  }),
  html_url: z.string(),
  diff_url: z.string(),
  patch_url: z.string(),
  commits_url: z.string(),
  comments_url: z.string(),
  created_at: z.string().datetime(),
  updated_at: z.string().datetime(),
  closed_at: z.string().datetime().nullable(),
  merged_at: z.string().datetime().nullable(),
  merge_commit_sha: z.string().nullable(),
  additions: z.number(),
  deletions: z.number(),
  changed_files: z.number(),
  commits: z.number(),
  comments: z.number(),
  review_comments: z.number(),
  maintainer_can_modify: z.boolean(),
  draft: z.boolean(),
})
export type GitHubPullRequest = z.infer<typeof GitHubPullRequest>

/**
 * GitHub check run data
 */
export const GitHubCheckRun = z.object({
  id: z.number(),
  name: z.string(),
  status: GitHubCheckStatus,
  conclusion: GitHubCheckConclusion.nullable(),
  started_at: z.string().datetime().nullable(),
  completed_at: z.string().datetime().nullable(),
  output: z.object({
    title: z.string().nullable(),
    summary: z.string().nullable(),
    text: z.string().nullable(),
    annotations_count: z.number(),
    annotations_url: z.string(),
  }),
  html_url: z.string(),
})
export type GitHubCheckRun = z.infer<typeof GitHubCheckRun>

/**
 * GitHub security alert
 */
export const GitHubSecurityAlert = z.object({
  number: z.number(),
  state: z.enum(['open', 'fixed', 'dismissed']),
  created_at: z.string().datetime(),
  updated_at: z.string().datetime(),
  fixed_at: z.string().datetime().nullable(),
  dismissed_at: z.string().datetime().nullable(),
  security_advisory: z.object({
    ghsa_id: z.string(),
    cve_id: z.string().nullable(),
    summary: z.string(),
    description: z.string(),
    severity: z.enum(['low', 'medium', 'high', 'critical']),
    cvss: z.object({
      vector_string: z.string(),
      score: z.number(),
    }),
  }),
  security_vulnerability: z.object({
    package: z.object({
      name: z.string(),
      ecosystem: z.string(),
    }),
    vulnerable_version_range: z.string(),
    first_patched_version: z
      .object({
        identifier: z.string(),
      })
      .nullable(),
  }),
  url: z.string(),
  html_url: z.string(),
})
export type GitHubSecurityAlert = z.infer<typeof GitHubSecurityAlert>

/**
 * Complete GitHub PR context
 */
export const GitHubPRContext = z.object({
  pullRequest: GitHubPullRequest,
  files: z.array(GitHubFileChange),
  commits: z.array(GitHubCommit),
  checkRuns: z.array(GitHubCheckRun),
  securityAlerts: z.array(GitHubSecurityAlert),
  metadata: z.object({
    fetchedAt: z.string().datetime(),
    totalLinesChanged: z.number(),
    affectedComponents: z.array(z.string()),
    testCoverageImpact: z.number().optional(),
    complexityScore: z.number().optional(),
  }),
})
export type GitHubPRContext = z.infer<typeof GitHubPRContext>

/**
 * Types for Claude Code hook integration
 */

/**
 * Tool names that Claude Code can execute
 */
export type ClaudeToolName =
  | 'Read'
  | 'Write'
  | 'Edit'
  | 'MultiEdit'
  | 'Bash'
  | 'LS'
  | 'Glob'
  | 'Grep'
  | 'NotebookEdit'
  | 'WebFetch'
  | 'WebSearch'
  | 'Task'
  | 'ExitPlanMode'
  | 'TodoWrite'

/**
 * Base structure for Claude tool input
 */
export interface ClaudeToolInput {
  tool_name: ClaudeToolName
  tool_input?: Record<string, unknown>
  tool_result?: unknown
}

/**
 * File-related tool input
 */
export interface FileToolInput extends ClaudeToolInput {
  tool_input?: {
    file_path?: string
    path?: string
    notebook_path?: string
    [key: string]: unknown
  }
}

/**
 * Exit codes for Claude hooks
 */
export enum HookExitCode {
  Success = 0,
  GeneralError = 1,
  QualityIssues = 2,
}

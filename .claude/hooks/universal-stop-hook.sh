#!/usr/bin/env bash

# Universal stop hook that finds the packages/claude-hooks directory
# Works for any user who has cloned the repository

# Function to find packages/claude-hooks from current directory
find_claude_hooks() {
  local current_dir="$PWD"
  
  # First, try to find it directly if we're in the monorepo
  if [ -d "$current_dir/packages/claude-hooks" ]; then
    echo "$current_dir/packages/claude-hooks"
    return 0
  fi
  
  # Try to go up and find the monorepo root (has pnpm-workspace.yaml)
  local check_dir="$current_dir"
  while [ "$check_dir" != "/" ]; do
    if [ -f "$check_dir/pnpm-workspace.yaml" ] && [ -d "$check_dir/packages/claude-hooks" ]; then
      echo "$check_dir/packages/claude-hooks"
      return 0
    fi
    check_dir="$(dirname "$check_dir")"
  done
  
  # If we can't find it by going up, try common relative paths
  # This handles the case where the hook is called from various locations
  local possible_paths=(
    "packages/claude-hooks"
    "../packages/claude-hooks"
    "../../packages/claude-hooks"
    "../../../packages/claude-hooks"
    "claude-hooks"
    "../claude-hooks"
  )
  
  for path in "${possible_paths[@]}"; do
    if [ -d "$current_dir/$path" ]; then
      echo "$(cd "$current_dir/$path" && pwd)"
      return 0
    fi
  done
  
  return 1
}

# Try to find the claude-hooks directory
HOOKS_DIR=$(find_claude_hooks)

if [ -z "$HOOKS_DIR" ]; then
  echo "Error: Could not find packages/claude-hooks directory"
  echo "Make sure you're running this from within the mnemosyne repository"
  exit 1
fi

# Change to the hooks directory and run the stop hook
cd "$HOOKS_DIR" && exec npx tsx src/stop/index.ts --chat "$@"
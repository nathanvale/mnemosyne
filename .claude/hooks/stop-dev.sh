#!/bin/bash

# Development mode wrapper for claude-hooks-stop
# This script runs the TypeScript source directly without needing compilation

# Set development mode
export NODE_ENV=development

# Get the directory of this script
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" &> /dev/null && pwd )"
PROJECT_ROOT="$( cd "$SCRIPT_DIR/../.." &> /dev/null && pwd )"

# Run the TypeScript source directly using tsx
exec npx tsx "$PROJECT_ROOT/packages/claude-hooks/src/bin/claude-hooks-stop.ts" "$@"
#!/bin/bash

# Production mode wrapper for claude-hooks-stop
# This script runs the compiled binary

# Ensure production mode (unset NODE_ENV or set to production)
unset NODE_ENV

# Run the compiled binary
exec npx claude-hooks-stop "$@"
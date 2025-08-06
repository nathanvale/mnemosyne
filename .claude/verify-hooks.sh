#!/bin/bash

# Verification script for Claude Hooks deployment

echo "Claude Hooks Deployment Verification"
echo "===================================="
echo ""

# Color codes for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check for Node.js availability
check_nodejs() {
    echo "Checking Node.js availability..."
    if command -v node >/dev/null 2>&1; then
        NODE_VERSION=$(node --version)
        echo -e "  ${GREEN}✓${NC} Node.js is installed: $NODE_VERSION"
        return 0
    else
        echo -e "  ${RED}✗${NC} Node.js is not installed or not in PATH"
        echo -e "  ${YELLOW}⚠${NC} Node.js is required for JSON validation in this script"
        echo -e "  ${YELLOW}⚠${NC} Continuing with basic checks only..."
        return 1
    fi
}

# Store Node.js availability
NODE_AVAILABLE=false
if check_nodejs; then
    NODE_AVAILABLE=true
fi
echo ""

# Check function
check_hook() {
    local hook_name=$1
    local hook_dir=$2
    local executable_file=$3
    local config_file=".claude/hooks/${executable_file}.config.json"
    
    echo "Checking $hook_name hook..."
    
    # Check directory exists
    if [ -d "$hook_dir" ]; then
        echo -e "  ${GREEN}✓${NC} Directory exists: $hook_dir"
    else
        echo -e "  ${RED}✗${NC} Directory missing: $hook_dir"
        return 1
    fi
    
    # Check executable exists and is executable
    if [ -f "$hook_dir/$executable_file" ]; then
        if [ -x "$hook_dir/$executable_file" ]; then
            echo -e "  ${GREEN}✓${NC} Hook is executable: $executable_file"
            # Check if it's a one-liner
            lines=$(wc -l < "$hook_dir/$executable_file")
            if [ "$lines" -le 2 ]; then
                echo -e "  ${GREEN}✓${NC} Hook is a simple one-liner!"
            fi
        else
            echo -e "  ${YELLOW}⚠${NC} Hook not executable: $executable_file"
        fi
    else
        echo -e "  ${RED}✗${NC} Hook missing: $executable_file"
        return 1
    fi
    
    # Check configuration file exists in .claude directory
    if [ -f "$config_file" ]; then
        # Validate JSON syntax only if Node.js is available
        if [ "$NODE_AVAILABLE" = true ]; then
            if node -e "JSON.parse(require('fs').readFileSync('$config_file', 'utf8'))" 2>/dev/null; then
                echo -e "  ${GREEN}✓${NC} Configuration is valid JSON: $config_file"
            else
                echo -e "  ${RED}✗${NC} Configuration has invalid JSON: $config_file"
            fi
        else
            echo -e "  ${YELLOW}⚠${NC} Configuration exists but cannot validate JSON (Node.js not available): $config_file"
        fi
    else
        echo -e "  ${YELLOW}⚠${NC} Configuration missing: $config_file (optional)"
    fi
    
    echo ""
}

# Check each hook
check_hook "Notification" ".claude/hooks/user-prompt-submit" "notification"
check_hook "Stop" ".claude/hooks/task-complete" "stop"
check_hook "Subagent Stop" ".claude/hooks/subagent-complete" "subagent-stop"
check_hook "Quality Check" ".claude/hooks/quality-check" "quality-check"
check_hook "Sound Notification" ".claude/hooks/sound-notification" "sound-notification"

# Summary
echo "===================================="
echo "Deployment Summary:"
echo ""

# Count deployed hooks
deployed_count=0
[ -d ".claude/hooks/user-prompt-submit" ] && ((deployed_count++))
[ -d ".claude/hooks/task-complete" ] && ((deployed_count++))
[ -d ".claude/hooks/subagent-complete" ] && ((deployed_count++))
[ -d ".claude/hooks/quality-check" ] && ((deployed_count++))
[ -d ".claude/hooks/sound-notification" ] && ((deployed_count++))

echo "Hooks deployed: $deployed_count/5"
echo ""

if [ $deployed_count -eq 5 ]; then
    echo -e "${GREEN}All hooks are properly deployed!${NC}"
else
    echo -e "${YELLOW}Some hooks are missing or misconfigured.${NC}"
    echo "Run the deployment instructions in packages/claude-hooks/docs/DEPLOYMENT.md"
fi

echo ""
echo "To test a specific hook, you can run:"
echo '  echo '"'"'{"type": "HOOK_TYPE", "data": {}}'"'"' | .claude/hooks/HOOK_DIR/HOOK_SCRIPT'
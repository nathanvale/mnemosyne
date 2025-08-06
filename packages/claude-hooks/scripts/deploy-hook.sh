#!/bin/bash

# Deploy a Claude hook to the .claude/hooks directory
# Usage: ./deploy-hook.sh <hook-name> <target-dir> <config-example>

HOOK_NAME=$1
TARGET_DIR=$2
CONFIG_EXAMPLE=$3

if [ -z "$HOOK_NAME" ] || [ -z "$TARGET_DIR" ] || [ -z "$CONFIG_EXAMPLE" ]; then
  echo "Usage: $0 <hook-name> <target-dir> <config-example>"
  echo "Example: $0 notification user-prompt-submit notification-basic.json"
  exit 1
fi

# Create target directory
mkdir -p ".claude/hooks/$TARGET_DIR"

# Create wrapper script (simplified)
cat > ".claude/hooks/$TARGET_DIR/$HOOK_NAME.cjs" << EOF
#!/usr/bin/env node
require('child_process').execSync(
  'CLAUDE_HOOKS_CONFIG_PATH="' + __dirname + '/hook-config.json" ' +
  'npx tsx "' + process.cwd() + '/packages/claude-hooks/src/$HOOK_NAME/index.ts"',
  { stdio: 'inherit', shell: true }
);
EOF

# Make executable
chmod +x ".claude/hooks/$TARGET_DIR/$HOOK_NAME.cjs"

# Copy example config
cp "packages/claude-hooks/examples/$CONFIG_EXAMPLE" \
   ".claude/hooks/$TARGET_DIR/hook-config.json"

echo "✅ Deployed $HOOK_NAME hook to .claude/hooks/$TARGET_DIR/"
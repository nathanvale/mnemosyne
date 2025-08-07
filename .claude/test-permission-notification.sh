#!/bin/bash

echo "==========================================="
echo "Testing Permission Request Notification"
echo "==========================================="
echo ""
echo "This simulates Claude's actual permission request"
echo ""

# Create a notification event exactly as Claude sends for permission requests
# (without the data.priority field)
cat << 'EOF' | node "$(dirname "$0")/../packages/claude-hooks/dist/bin/claude-hooks-notification.js"
{
  "hook_event_name": "Notification",
  "message": "Claude needs your permission to use Bash",
  "session_id": "real-session-456",
  "cwd": "/Users/nathanvale/code/mnemosyne"
}
EOF

echo ""
echo "You should have heard:"
echo "1. Notification sound (Glass.aiff)"
echo "2. Speech: 'medium priority: Claude needs your permission to use Bash'"
echo ""
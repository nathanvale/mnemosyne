#!/bin/bash

echo "==========================================="
echo "Claude Code Notification Test"
echo "==========================================="
echo ""
echo "This test simulates how Claude Code actually sends notifications"
echo ""
echo "Settings:"
echo "- notifySound: true (you'll hear a sound)"
echo "- speak: true (you'll hear speech)"
echo "- priority: high (bypasses cooldown)"
echo ""
echo "Sending notification in 2 seconds..."
sleep 2

# Create a notification event using Claude Code's actual format
cat << 'EOF' | node packages/claude-hooks/dist/bin/claude-hooks-notification.js
{
  "hook_event_name": "Notification",
  "message": "Claude needs your attention. This is a test notification with high priority.",
  "session_id": "test-session-123",
  "cwd": "/Users/nathanvale/code/mnemosyne",
  "data": {
    "priority": "high"
  }
}
EOF

echo ""
echo "==========================================="
echo "Test complete!"
echo ""
echo "You should have heard:"
echo "✓ A notification sound (Glass.aiff on macOS)"
echo "✓ Speech saying: 'high priority: Claude needs your attention...'"
echo ""
echo "If you didn't hear anything, check:"
echo "1. System volume is not muted"
echo "2. OpenAI API key is set: echo \$OPENAI_API_KEY"
echo "3. notification.config.json has notifySound: true and speak: true"
echo "==========================================="
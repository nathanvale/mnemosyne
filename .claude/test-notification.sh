#!/bin/bash

echo "==========================================="
echo "Testing Notification Hook"
echo "==========================================="
echo ""
echo "This test will send a high-priority notification"
echo "You should hear BOTH:"
echo "1. A system notification sound"
echo "2. Speech saying 'high priority: Claude needs your attention for an important task'"
echo ""
echo "Sending notification in 2 seconds..."
sleep 2

# Create a notification event with high priority
cat << 'EOF' | node packages/claude-hooks/dist/bin/claude-hooks-notification.js
{
  "event": "notification",
  "message": "Claude needs your attention for an important task",
  "data": {
    "message": "Claude needs your attention for an important task",
    "priority": "high"
  },
  "session_id": "test-session",
  "cwd": "/Users/nathanvale/code/mnemosyne"
}
EOF

echo ""
echo "==========================================="
echo "Test complete!"
echo ""
echo "Did you hear:"
echo "✓ A notification sound?"
echo "✓ Speech announcement?"
echo ""
echo "If not, check:"
echo "1. System volume is not muted"
echo "2. OpenAI API key is set (echo \$OPENAI_API_KEY)"
echo "3. No quiet hours active (check time against config)"
echo "==========================================="
#!/bin/bash

# Test script to verify notifySound setting works
echo "Testing stop hook with notifySound=false (should only speak, no sound)..."

# Create a test event
cat > /tmp/test-stop-event.json << 'EOF'
{
  "event": "stop",
  "data": {
    "success": true,
    "task": "Test task completed",
    "duration": 3000
  }
}
EOF

# Run the stop hook with the test event
cat /tmp/test-stop-event.json | node packages/claude-hooks/dist/bin/claude-hooks-stop.js

echo "Test completed. You should have heard speech but no notification sound."
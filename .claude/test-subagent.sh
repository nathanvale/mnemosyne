#!/bin/bash

echo "==========================================="
echo "Claude Code Subagent Stop Hook Test"
echo "==========================================="
echo ""
echo "This test simulates a subagent completing its task"
echo ""
echo "Current Settings (subagent-stop.config.json):"
echo "- notifySound: false (no sound notification)"
echo "- speak: true (you'll hear speech)"
echo "- voice: echo (different from main stop hook)"
echo "- speed: 0.9 (slightly slower)"
echo ""
echo "Sending SubagentStop event in 2 seconds..."
sleep 2

# Create a SubagentStop event using Claude Code's format
cat << 'EOF' | node "$(dirname "$0")/../packages/claude-hooks/dist/bin/claude-hooks-subagent.js"
{
  "hook_event_name": "SubagentStop",
  "session_id": "subagent-test-123",
  "transcript_path": "/tmp/subagent-transcript.json",
  "cwd": "/Users/nathanvale/code/mnemosyne",
  "data": {
    "subagentId": "test-subagent-456",
    "subagentType": "research",
    "result": {
      "success": true,
      "summary": "Successfully researched the topic and found 5 relevant articles"
    }
  }
}
EOF

echo ""
echo "==========================================="
echo "Test complete!"
echo ""
echo "You should have heard:"
echo "✓ Speech saying: 'Research agent completed successfully'"
echo "✗ NO notification sound (notifySound is false)"
echo ""
echo "The speech should have been:"
echo "- In the 'echo' voice (not 'nova')"
echo "- At 0.9x speed (slightly slower)"
echo ""
echo "To enable sound notification, set notifySound: true"
echo "in .claude/hooks/subagent-stop.config.json"
echo "==========================================="
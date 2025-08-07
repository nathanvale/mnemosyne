#!/bin/bash

echo "Testing notification system..."
echo ""

# Test with simple format
echo '{"event":"notification","message":"Testing notification system","priority":"high"}' | node packages/claude-hooks/dist/bin/claude-hooks-notification.js

echo ""
echo "You should have heard:"
echo "1. A notification sound (Glass.aiff)"
echo "2. Speech saying the message"
echo ""
echo "If you didn't hear anything, the notification might be blocked by cooldown."
echo "Wait 5 seconds and try again."
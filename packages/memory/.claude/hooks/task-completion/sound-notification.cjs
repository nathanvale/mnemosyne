#!/usr/bin/env node

const { exec } = require('child_process');

// Play a system sound on macOS
// Using Glass.aiff which is a nice completion sound
exec('afplay /System/Library/Sounds/Glass.aiff', (error) => {
  if (error) {
    console.error('Sound notification failed:', error);
  } else {
    console.log('🔔 Task completion sound played');
  }
});
#!/usr/bin/env node

import { TTSProviderFactory } from './packages/claude-hooks/src/speech/providers/provider-factory.js'

const config = {
  provider: 'auto',
  fallbackProvider: 'macos',
  openai: {
    model: 'tts-1',
    voice: 'alloy',
    speed: 1.0,
    format: 'mp3',
  },
  macos: {
    voice: 'Alex',
    rate: 250,
    volume: 0.7,
    enabled: true,
  },
}

console.log('OPENAI_API_KEY set:', Boolean(process.env.OPENAI_API_KEY))
console.log('Creating provider with config:', JSON.stringify(config, null, 2))

const provider = await TTSProviderFactory.createWithFallback(config)
console.log('Provider selected:', provider.getProviderInfo().displayName)

const result = await provider.speak('Test TTS provider selection')
console.log('Speech result:', result)

#!/usr/bin/env node

/**
 * TikTok Video Example
 * 
 * Creates a viral TikTok-style video with:
 * - 9:16 aspect ratio
 * - Engaging text overlays
 * - Background music with smart ducking
 * - 15-second duration
 */

import { Timeline } from '@jamesaphoenix/media-sdk';

console.log('📱 Media SDK - TikTok Video Example\n');

const tiktokVideo = new Timeline()
  // Main content in TikTok aspect ratio
  .addVideo('content.mp4')
  .setAspectRatio('9:16')
  .setResolution(1080, 1920)
  .setDuration(15)
  
  // Background music
  .addAudio('viral-beat.mp3', { 
    volume: 0.6,
    loop: true 
  })
  
  // Hook text at the beginning
  .addText('Wait for it... 👀', {
    position: { x: 'center', y: '15%' },
    style: {
      fontSize: 48,
      color: '#ffffff',
      fontFamily: 'Arial Black',
      strokeColor: '#000000',
      strokeWidth: 3
    },
    startTime: 0,
    duration: 3
  })
  
  // Payoff text
  .addText('OMG!! 😱🔥', {
    position: { x: 'center', y: '15%' },
    style: {
      fontSize: 64,
      color: '#ff0066',
      fontFamily: 'Arial Black',
      strokeColor: '#ffffff',
      strokeWidth: 2
    },
    startTime: 8,
    duration: 2
  })
  
  // Call to action
  .addText('Follow for more! ✨', {
    position: { x: 'center', y: '85%' },
    style: {
      fontSize: 32,
      color: '#ffffff',
      fontFamily: 'Arial Bold'
    },
    startTime: 12,
    duration: 3
  });

const command = tiktokVideo.getCommand('output/tiktok-viral.mp4');

console.log('Generated TikTok video command:');
console.log(command);

console.log('\n🚀 TikTok Optimization Features:');
console.log('• 9:16 portrait aspect ratio');
console.log('• 15-second viral format');
console.log('• Bold, contrasting text overlays');
console.log('• Hook → Payoff → CTA structure');
console.log('• Mobile-optimized resolution (1080x1920)');

console.log('\n💡 Pro Tips:');
console.log('• Use high-contrast colors for text');
console.log('• Keep text large and readable on mobile');
console.log('• Start with a hook in the first 3 seconds');
console.log('• End with a clear call-to-action');
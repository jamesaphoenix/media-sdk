#!/usr/bin/env node

/**
 * YouTube Gaming Highlights Example
 * 
 * Creates epic gaming highlight reels with:
 * - 16:9 YouTube aspect ratio
 * - Multi-camera picture-in-picture
 * - Epic music synchronization
 * - Automated highlight extraction
 */

import { Timeline } from '@jamesaphoenix/media-sdk';

console.log('🎮 Media SDK - YouTube Gaming Highlights Example\n');

const gamingHighlights = new Timeline()
  // Main gameplay footage
  .addVideo('gameplay-main.mp4')
  .setAspectRatio('16:9')
  .setResolution(1920, 1080)
  .setDuration(60)
  
  // Epic background music
  .addAudio('epic-gaming-music.mp3', { 
    volume: 0.7,
    fadeIn: 2,
    fadeOut: 3
  })
  
  // Webcam overlay (picture-in-picture)
  .addVideo('webcam-reaction.mp4', {
    position: { x: '75%', y: '75%' },
    scale: 0.25,
    startTime: 5,
    duration: 15
  })
  
  // Title card
  .addText('INSANE CLUTCH! 🔥', {
    position: { x: 'center', y: '20%' },
    style: {
      fontSize: 72,
      color: '#ff6600',
      fontFamily: 'Impact',
      strokeColor: '#000000',
      strokeWidth: 4
    },
    startTime: 0,
    duration: 4
  })
  
  // Highlight callout
  .addText('WATCH THIS!', {
    position: { x: 'center', y: '80%' },
    style: {
      fontSize: 48,
      color: '#ffff00',
      fontFamily: 'Arial Black',
      strokeColor: '#000000',
      strokeWidth: 2
    },
    startTime: 20,
    duration: 3
  })
  
  // Subscribe reminder
  .addText('SMASH THAT SUBSCRIBE! 👆', {
    position: { x: 'center', y: '90%' },
    style: {
      fontSize: 32,
      color: '#ff0000',
      fontFamily: 'Arial Bold'
    },
    startTime: 50,
    duration: 10
  });

const command = gamingHighlights.getCommand('output/gaming-highlights.mp4');

console.log('Generated YouTube gaming highlights:');
console.log(command);

console.log('\n🚀 YouTube Gaming Optimization:');
console.log('• 16:9 landscape aspect ratio');
console.log('• Picture-in-picture webcam overlay');
console.log('• Bold, attention-grabbing text');
console.log('• Epic music with proper mixing');
console.log('• 60-second highlight format');

console.log('\n🎯 Gaming Content Tips:');
console.log('• Start with the most exciting moment');
console.log('• Use contrasting colors for text overlays');
console.log('• Keep webcam small but visible');
console.log('• Sync music to action beats');
console.log('• End with clear call-to-action');
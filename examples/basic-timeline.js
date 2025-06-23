#!/usr/bin/env node

/**
 * Basic Timeline Example
 * 
 * Demonstrates the core Timeline API with video, audio, and text overlays.
 * This is the simplest way to get started with Media SDK.
 */

import { Timeline } from '@jamesaphoenix/media-sdk';

console.log('🎬 Media SDK - Basic Timeline Example\n');

// Create a simple timeline with video, audio, and text
const timeline = new Timeline()
  .addVideo('input.mp4')
  .addAudio('background-music.mp3', { 
    volume: 0.3,
    fadeIn: 2,
    fadeOut: 2 
  })
  .addText('Hello, Media SDK!', {
    position: { x: 'center', y: 'center' },
    style: {
      fontSize: 48,
      color: '#ffffff',
      fontFamily: 'Arial Bold'
    },
    startTime: 2,
    duration: 5
  })
  .setResolution(1920, 1080)
  .setDuration(30);

// Generate the FFmpeg command
const command = timeline.getCommand('output/basic-timeline.mp4');

console.log('Generated FFmpeg command:');
console.log(command);
console.log('\n✨ To execute this command, run:');
console.log('ffmpeg ' + command.split('ffmpeg ')[1]);

console.log('\n📖 This example demonstrates:');
console.log('• Basic video/audio composition');
console.log('• Text overlay with styling');
console.log('• Audio volume control and fading');
console.log('• Resolution and duration settings');
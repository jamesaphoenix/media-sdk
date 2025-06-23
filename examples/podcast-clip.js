#!/usr/bin/env node

/**
 * Podcast Clip Example
 * 
 * Creates shareable podcast clips with:
 * - Professional audio enhancement
 * - Visual waveforms and branding
 * - Quote highlighting
 * - Multi-platform optimization
 */

import { Timeline } from '@jamesaphoenix/media-sdk';

console.log('🎧 Media SDK - Podcast Clip Example\n');

const podcastClip = new Timeline()
  // Main audio content
  .addAudio('podcast-segment.mp3', {
    volume: 1.0,
    // Audio enhancement would be applied here
  })
  
  // Background video/image
  .addVideo('podcast-background.mp4')
  .setDuration(45)
  .setResolution(1080, 1080) // Square for social media
  
  // Podcast branding
  .addImage('podcast-logo.png', {
    position: { x: 'center', y: '15%' },
    scale: 0.3,
    duration: 45
  })
  
  // Quote text overlay
  .addText('"The future of AI is\\nnot replacing humans,\\nbut empowering them."', {
    position: { x: 'center', y: 'center' },
    style: {
      fontSize: 36,
      color: '#ffffff',
      fontFamily: 'Georgia',
      textAlign: 'center',
      lineHeight: 1.4,
      backgroundColor: 'rgba(0,0,0,0.7)',
      padding: 20,
      borderRadius: 15
    },
    startTime: 5,
    duration: 30
  })
  
  // Speaker attribution
  .addText('Dr. Sarah Chen\\nAI Research Director', {
    position: { x: 'center', y: '75%' },
    style: {
      fontSize: 24,
      color: '#cccccc',
      fontFamily: 'Arial',
      textAlign: 'center'
    },
    startTime: 10,
    duration: 25
  })
  
  // Podcast info
  .addText('The Future Tech Podcast\\nEpisode 127', {
    position: { x: 'center', y: '90%' },
    style: {
      fontSize: 18,
      color: '#999999',
      fontFamily: 'Arial',
      textAlign: 'center'
    },
    startTime: 0,
    duration: 45
  });

const command = podcastClip.getCommand('output/podcast-clip.mp4');

console.log('Generated podcast clip command:');
console.log(command);

console.log('\n🎙️ Podcast Clip Features:');
console.log('• Square 1:1 aspect ratio for social media');
console.log('• Professional quote highlighting');
console.log('• Speaker attribution and branding');
console.log('• Audio-first content optimization');
console.log('• 45-second shareable format');

console.log('\n📱 Platform Variations:');
console.log('• Instagram: 1080x1080 square');
console.log('• TikTok: 1080x1920 vertical');
console.log('• Twitter: 1200x675 landscape');
console.log('• LinkedIn: 1200x1200 square');

console.log('\n💡 Podcast Content Tips:');
console.log('• Extract the most quotable moments');
console.log('• Use readable fonts with good contrast');
console.log('• Include speaker credentials');
console.log('• Add podcast branding consistently');
console.log('• Keep clips under 60 seconds');
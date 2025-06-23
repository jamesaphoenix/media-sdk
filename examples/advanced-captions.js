#!/usr/bin/env node

/**
 * Advanced Captions Example
 * 
 * Demonstrates the powerful caption system with:
 * - Multi-language support
 * - SRT file handling
 * - Custom styling and animations
 * - Precise timing control
 */

import { Timeline, MultiCaptionEngine, SRTHandler } from '@jamesaphoenix/media-sdk';

console.log('💬 Media SDK - Advanced Captions Example\n');

// Create multi-language caption engine
const captionEngine = new MultiCaptionEngine();

// Set global styling defaults
captionEngine.setGlobalDefaults({
  fontFamily: 'Arial Bold',
  fontSize: 36,
  color: '#ffffff',
  strokeColor: '#000000',
  strokeWidth: 2,
  textAlign: 'center',
  opacity: 1.0
});

// Create English track
const englishTrack = captionEngine.createTrack('en', 'English', {
  defaultStyle: {
    color: '#ffffff',
    backgroundColor: 'rgba(0,0,0,0.7)'
  },
  priority: 1
});

// Add English captions
captionEngine.addCaption(englishTrack.id, {
  text: 'Welcome to Media SDK!',
  startTime: 0,
  endTime: 3,
  animation: {
    type: 'fade-in',
    duration: 0.5,
    easing: 'ease-out'
  }
});

captionEngine.addCaption(englishTrack.id, {
  text: 'Creating amazing videos\\nhas never been easier.',
  startTime: 3,
  endTime: 7,
  style: {
    fontSize: 32,
    color: '#00ff88'
  }
});

// Create Spanish track
const spanishTrack = captionEngine.createTrack('es', 'Español', {
  defaultStyle: {
    color: '#ffff00',
    backgroundColor: 'rgba(0,0,100,0.7)'
  },
  priority: 2
});

captionEngine.addCaption(spanishTrack.id, {
  text: '¡Bienvenido a Media SDK!',
  startTime: 0,
  endTime: 3
});

captionEngine.addCaption(spanishTrack.id, {
  text: 'Crear videos increíbles\\nnunca fue tan fácil.',
  startTime: 3,
  endTime: 7
});

// Create timeline with captions
const timeline = new Timeline()
  .addVideo('presentation.mp4')
  .setDuration(10);

// Generate caption filters (would be integrated in full version)
const captionFilters = captionEngine.generateFilters();

console.log('📝 Generated caption configuration:');
console.log('English track:', englishTrack);
console.log('Spanish track:', spanishTrack);

// SRT Handler example
const srtHandler = new SRTHandler();

// Create SRT entries
const srtEntries = [
  {
    index: 1,
    startTime: 0,
    endTime: 3,
    text: 'Welcome to Media SDK!',
    style: { bold: true, color: '#ffffff' }
  },
  {
    index: 2,
    startTime: 3,
    endTime: 7,
    text: 'Creating amazing videos\\nhas never been easier.',
    style: { italic: true, color: '#00ff88' }
  }
];

// Generate SRT content
const srtContent = srtHandler.generateSRT(srtEntries);

console.log('\\n📄 Generated SRT content:');
console.log(srtContent);

console.log('\\n🎨 Caption Features Demonstrated:');
console.log('• Multi-language track support');
console.log('• Custom styling per track and entry');
console.log('• Animation and transition effects');
console.log('• SRT file generation and parsing');
console.log('• Precise timing control');
console.log('• Priority-based track management');

console.log('\\n💡 Advanced Features:');
console.log('• Auto-sync with audio timing');
console.log('• Reading speed optimization');
console.log('• Automatic line breaking');
console.log('• Platform-specific formatting');
console.log('• Validation and error checking');
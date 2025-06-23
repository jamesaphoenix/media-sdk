#!/usr/bin/env node

/**
 * Green Screen Meme Generator
 * 
 * Create viral memes by replacing green screens with funny backgrounds,
 * popular meme templates, or dynamic effects.
 * 
 * Perfect for:
 * - TikTok green screen challenges
 * - Reaction memes with custom backgrounds
 * - News/weather person memes
 * - Gaming streamer overlays
 * - Educational content with dynamic backgrounds
 */

import { Timeline, PictureInPicture } from '@jamesaphoenix/media-sdk';
import { promises as fs } from 'fs';
import path from 'path';

// Common meme configurations
const MEME_PRESETS = {
  disaster_girl: {
    background: 'assets/disaster-girl-background.jpg',
    position: 'center',
    scale: 0.4,
    description: 'Classic disaster girl meme - person in front of burning house'
  },
  
  this_is_fine: {
    background: 'assets/this-is-fine-room.mp4',
    position: 'center',
    scale: 0.5,
    description: 'Dog sitting in burning room - "This is fine"'
  },
  
  space: {
    background: 'assets/floating-in-space.mp4',
    position: 'center',
    scale: 0.6,
    description: 'Floating in space - existential crisis meme'
  },
  
  news_fail: {
    background: 'assets/news-fail-compilation.mp4',
    position: 'bottom-center',
    scale: 0.7,
    description: 'News reporter with chaotic background'
  },
  
  office: {
    background: 'assets/the-office-stare.mp4',
    position: 'custom',
    customPosition: { x: '30%', y: '40%' },
    scale: 0.5,
    description: 'Jim staring at camera - The Office meme'
  }
};

/**
 * Create a basic green screen meme
 */
async function createBasicMeme() {
  console.log('🎬 Creating basic green screen meme...');
  
  const timeline = Timeline.create()
    .addVideo('assets/meme-backgrounds/explosion.mp4')
    .setAspectRatio('9:16') // TikTok format
    .setDuration(5);
  
  // Add person with green screen removed
  const meme = PictureInPicture.addWithChromaKey(timeline, 'assets/person-greenscreen.mp4', {
    position: 'center',
    scale: 0.5,
    chromaKey: '#00FF00',
    chromaSimilarity: 0.4,
    chromaBlend: 0.1,
    animation: 'zoom-in',
    animationDuration: 0.5
  });
  
  // Add meme text
  const withText = meme
    .addText('When you realize', {
      position: { x: 'center', y: '10%' },
      style: {
        fontSize: 48,
        color: '#ffffff',
        fontFamily: 'Impact',
        strokeColor: '#000000',
        strokeWidth: 3
      },
      startTime: 0,
      duration: 2
    })
    .addText('IT\'S MONDAY', {
      position: { x: 'center', y: '85%' },
      style: {
        fontSize: 64,
        color: '#ff0000',
        fontFamily: 'Impact',
        strokeColor: '#000000',
        strokeWidth: 4
      },
      startTime: 2,
      duration: 3
    });
  
  const command = withText.getCommand('output/basic-greenscreen-meme.mp4');
  console.log('Command:', command);
  
  return withText;
}

/**
 * Create a multi-layer meme with multiple green screen subjects
 */
async function createMultiLayerMeme() {
  console.log('🎭 Creating multi-layer green screen meme...');
  
  const timeline = Timeline.create()
    .addVideo('assets/meme-backgrounds/office-chaos.mp4')
    .setAspectRatio('16:9')
    .setDuration(10);
  
  // Add multiple people reacting
  let meme = PictureInPicture.addWithChromaKey(timeline, 'assets/person1-shocked.mp4', {
    position: 'custom',
    customPosition: { x: '20%', y: '50%' },
    scale: 0.3,
    chromaKey: '#00FF00',
    chromaSimilarity: 0.35,
    animation: 'slide-in',
    animationDelay: 0.5
  });
  
  meme = PictureInPicture.addWithChromaKey(meme, 'assets/person2-laughing.mp4', {
    position: 'custom',
    customPosition: { x: '70%', y: '40%' },
    scale: 0.35,
    chromaKey: '#00FF00',
    chromaSimilarity: 0.35,
    animation: 'slide-in',
    animationDelay: 1.0,
    flipHorizontal: true // Face the other person
  });
  
  meme = PictureInPicture.addWithChromaKey(meme, 'assets/person3-confused.mp4', {
    position: 'custom',
    customPosition: { x: '50%', y: '70%' },
    scale: 0.25,
    chromaKey: '#00FF00',
    chromaSimilarity: 0.4,
    animation: 'bounce-in',
    animationDelay: 1.5
  });
  
  // Add dialogue/captions
  const withCaptions = meme
    .addText('Boss: "We need to talk about your TPS reports"', {
      position: { x: 'center', y: '10%' },
      style: {
        fontSize: 32,
        color: '#ffffff',
        backgroundColor: 'rgba(0,0,0,0.7)',
        padding: 10
      },
      startTime: 2,
      duration: 3
    })
    .addText('The whole team:', {
      position: { x: 'center', y: '85%' },
      style: {
        fontSize: 36,
        color: '#ffff00',
        fontFamily: 'Arial Bold'
      },
      startTime: 5,
      duration: 5
    });
  
  const command = withCaptions.getCommand('output/multi-layer-meme.mp4');
  console.log('Command:', command);
  
  return withCaptions;
}

/**
 * Create a dynamic background replacement meme
 */
async function createDynamicBackgroundMeme() {
  console.log('🌟 Creating dynamic background meme...');
  
  // Start with a base video that will transition through multiple backgrounds
  const timeline = Timeline.create()
    .addVideo('assets/meme-backgrounds/vortex.mp4')
    .setAspectRatio('1:1') // Instagram format
    .setDuration(15);
  
  // Add person with green screen
  let meme = PictureInPicture.addWithChromaKey(timeline, 'assets/person-dancing.mp4', {
    position: 'center',
    scale: 0.6,
    chromaKey: '#00FF00',
    chromaSimilarity: 0.38,
    chromaBlend: 0.15,
    shadow: true
  });
  
  // Add multiple background transitions using opacity
  // This creates the illusion of traveling through different dimensions
  
  // Add particle effects overlay
  meme = meme.addVideo('assets/effects/particles.mov', {
    opacity: 0.7,
    blend: 'screen',
    startTime: 5,
    duration: 5
  });
  
  // Add text that changes with the backgrounds
  const withText = meme
    .addText('POV: You\'re traveling', {
      position: { x: 'center', y: '15%' },
      style: {
        fontSize: 36,
        color: '#ffffff',
        fontFamily: 'Arial Bold'
      },
      startTime: 0,
      duration: 3
    })
    .addText('THE MULTIVERSE', {
      position: { x: 'center', y: '15%' },
      style: {
        fontSize: 48,
        color: '#ff00ff',
        fontFamily: 'Impact',
        strokeColor: '#000000',
        strokeWidth: 3
      },
      startTime: 3,
      duration: 12
    });
  
  const command = withText.getCommand('output/dynamic-background-meme.mp4');
  console.log('Command:', command);
  
  return withText;
}

/**
 * Create a weather reporter meme (classic green screen format)
 */
async function createWeatherReporterMeme() {
  console.log('🌦️ Creating weather reporter meme...');
  
  const timeline = Timeline.create()
    .addVideo('assets/meme-backgrounds/weather-chaos.mp4')
    .setAspectRatio('16:9')
    .setDuration(8);
  
  // Add weather person
  const meme = PictureInPicture.addWithChromaKey(timeline, 'assets/person-pointing.mp4', {
    position: 'custom',
    customPosition: { x: '25%', y: '50%' },
    scale: 0.7,
    chromaKey: '#00FF00',
    chromaSimilarity: 0.4,
    chromaBlend: 0.1,
    audioMix: 'full' // Keep their audio
  });
  
  // Add weather graphics overlay
  const withGraphics = meme
    .addImage('assets/weather-map-overlay.png', {
      position: { x: '70%', y: '30%' },
      scale: 0.4,
      opacity: 0.9,
      startTime: 2,
      duration: 6
    })
    .addText('TODAY\'S FORECAST:', {
      position: { x: '70%', y: '70%' },
      style: {
        fontSize: 32,
        color: '#ffffff',
        backgroundColor: '#0066cc',
        padding: 10
      },
      startTime: 2,
      duration: 6
    })
    .addText('CHAOS WITH A CHANCE OF MEMES', {
      position: { x: '70%', y: '80%' },
      style: {
        fontSize: 24,
        color: '#ffff00',
        backgroundColor: '#000000',
        padding: 8
      },
      startTime: 3,
      duration: 5
    });
  
  const command = withGraphics.getCommand('output/weather-reporter-meme.mp4');
  console.log('Command:', command);
  
  return withGraphics;
}

/**
 * Create a reaction meme with picture-in-picture
 */
async function createReactionMeme() {
  console.log('😱 Creating reaction meme...');
  
  // Main content that someone is reacting to
  const timeline = Timeline.create()
    .addVideo('assets/meme-content/fail-compilation.mp4')
    .setAspectRatio('9:16')
    .setDuration(10);
  
  // Add reactor with green screen removed in corner
  const meme = PictureInPicture.addWithChromaKey(timeline, 'assets/person-reacting.mp4', {
    position: 'bottom-right',
    scale: 0.3,
    chromaKey: '#00FF00',
    chromaSimilarity: 0.4,
    borderRadius: 20,
    borderWidth: 3,
    borderColor: '#ff0066',
    shadow: true,
    audioMix: 0.8 // Mix both audios
  });
  
  // Add reaction text
  const withText = meme
    .addText('BRUH 💀', {
      position: { x: '75%', y: '60%' },
      style: {
        fontSize: 36,
        color: '#ff0066',
        fontFamily: 'Arial Black',
        rotation: -15
      },
      startTime: 3,
      duration: 2
    })
    .addText('I CAN\'T EVEN...', {
      position: { x: '75%', y: '55%' },
      style: {
        fontSize: 28,
        color: '#ffffff',
        fontFamily: 'Arial Bold'
      },
      startTime: 5,
      duration: 5
    });
  
  const command = withText.getCommand('output/reaction-meme.mp4');
  console.log('Command:', command);
  
  return withText;
}

/**
 * Create an educational meme with green screen
 */
async function createEducationalMeme() {
  console.log('📚 Creating educational meme...');
  
  const timeline = Timeline.create()
    .addVideo('assets/backgrounds/classroom.mp4')
    .setAspectRatio('16:9')
    .setDuration(12);
  
  // Add teacher with green screen
  let meme = PictureInPicture.addWithChromaKey(timeline, 'assets/teacher-greenscreen.mp4', {
    position: 'custom',
    customPosition: { x: '30%', y: '50%' },
    scale: 0.5,
    chromaKey: '#00FF00',
    chromaSimilarity: 0.4,
    flipHorizontal: true // Face the "board"
  });
  
  // Add educational content that becomes increasingly absurd
  const withContent = meme
    .addText('Today\'s Lesson:', {
      position: { x: '70%', y: '20%' },
      style: {
        fontSize: 36,
        color: '#000000',
        backgroundColor: '#ffffff',
        padding: 10
      },
      startTime: 1,
      duration: 11
    })
    .addText('2 + 2 = 4', {
      position: { x: '70%', y: '35%' },
      style: {
        fontSize: 32,
        color: '#000000'
      },
      startTime: 2,
      duration: 2
    })
    .addText('2 + 2 = 🐟', {
      position: { x: '70%', y: '45%' },
      style: {
        fontSize: 40,
        color: '#ff0000'
      },
      startTime: 4,
      duration: 3
    })
    .addText('QUICK MATHS', {
      position: { x: '70%', y: '60%' },
      style: {
        fontSize: 48,
        color: '#00ff00',
        fontFamily: 'Impact',
        rotation: 10
      },
      startTime: 7,
      duration: 5
    });
  
  const command = withContent.getCommand('output/educational-meme.mp4');
  console.log('Command:', command);
  
  return withContent;
}

/**
 * Create a gaming streamer meme overlay
 */
async function createGamingMeme() {
  console.log('🎮 Creating gaming streamer meme...');
  
  // Game footage as background
  const timeline = Timeline.create()
    .addVideo('assets/game-footage/epic-fail.mp4')
    .setAspectRatio('16:9')
    .setDuration(15);
  
  // Add streamer reactions at different moments
  let meme = timeline;
  
  // Calm reaction at start
  meme = PictureInPicture.addWithChromaKey(meme, 'assets/streamer-calm.mp4', {
    position: 'bottom-left',
    scale: 0.25,
    chromaKey: '#00FF00',
    chromaSimilarity: 0.4,
    borderRadius: 999, // Circle
    startTime: 0,
    endTime: 5
  });
  
  // Excited reaction
  meme = PictureInPicture.addWithChromaKey(meme, 'assets/streamer-excited.mp4', {
    position: 'bottom-left',
    scale: 0.3,
    chromaKey: '#00FF00',
    chromaSimilarity: 0.4,
    borderRadius: 999,
    borderWidth: 3,
    borderColor: '#ffff00',
    animation: 'bounce-in',
    startTime: 5,
    endTime: 10
  });
  
  // Rage reaction
  meme = PictureInPicture.addWithChromaKey(meme, 'assets/streamer-rage.mp4', {
    position: 'bottom-left',
    scale: 0.35,
    chromaKey: '#00FF00',
    chromaSimilarity: 0.4,
    borderRadius: 999,
    borderWidth: 5,
    borderColor: '#ff0000',
    animation: 'zoom-in',
    shadow: {
      blur: 10,
      color: 'red',
      offsetX: 0,
      offsetY: 0
    },
    startTime: 10,
    endTime: 15
  });
  
  // Add gaming text overlays
  const withText = meme
    .addText('EZ Clap', {
      position: { x: '50%', y: '20%' },
      style: {
        fontSize: 64,
        color: '#00ff00',
        fontFamily: 'Arial Black',
        opacity: 0.8
      },
      startTime: 3,
      duration: 2
    })
    .addText('OH NO NO NO', {
      position: { x: '50%', y: '50%' },
      style: {
        fontSize: 72,
        color: '#ffff00',
        fontFamily: 'Impact',
        strokeColor: '#000000',
        strokeWidth: 4
      },
      startTime: 7,
      duration: 2
    })
    .addText('RAGE QUIT INCOMING', {
      position: { x: '50%', y: '50%' },
      style: {
        fontSize: 84,
        color: '#ff0000',
        fontFamily: 'Impact',
        strokeColor: '#000000',
        strokeWidth: 5,
        animation: 'shake'
      },
      startTime: 12,
      duration: 3
    });
  
  const command = withText.getCommand('output/gaming-streamer-meme.mp4');
  console.log('Command:', command);
  
  return withText;
}

/**
 * Helper function to create a meme from a preset
 */
async function createMemeFromPreset(presetName, greenScreenVideo, outputName) {
  const preset = MEME_PRESETS[presetName];
  if (!preset) {
    console.error(`Preset '${presetName}' not found!`);
    return;
  }
  
  console.log(`🎬 Creating ${presetName} meme...`);
  console.log(`📝 ${preset.description}`);
  
  const timeline = Timeline.create()
    .addVideo(preset.background)
    .setAspectRatio('9:16')
    .setDuration(10);
  
  const meme = PictureInPicture.addWithChromaKey(timeline, greenScreenVideo, {
    position: preset.position,
    customPosition: preset.customPosition,
    scale: preset.scale,
    chromaKey: '#00FF00',
    chromaSimilarity: 0.4,
    chromaBlend: 0.1,
    shadow: true,
    animation: 'fade-in'
  });
  
  const command = meme.getCommand(outputName);
  console.log('Command:', command);
  
  return meme;
}

/**
 * Main execution
 */
async function main() {
  console.log('🚀 Green Screen Meme Generator');
  console.log('==============================\n');
  
  // Ensure output directory exists
  await fs.mkdir('output', { recursive: true });
  
  // Run examples based on command line arguments
  const example = process.argv[2] || 'all';
  
  switch (example) {
    case 'basic':
      await createBasicMeme();
      break;
    
    case 'multi':
      await createMultiLayerMeme();
      break;
    
    case 'dynamic':
      await createDynamicBackgroundMeme();
      break;
    
    case 'weather':
      await createWeatherReporterMeme();
      break;
    
    case 'reaction':
      await createReactionMeme();
      break;
    
    case 'education':
      await createEducationalMeme();
      break;
    
    case 'gaming':
      await createGamingMeme();
      break;
    
    case 'preset':
      const presetName = process.argv[3] || 'disaster_girl';
      const videoFile = process.argv[4] || 'assets/person-greenscreen.mp4';
      const outputFile = process.argv[5] || `output/${presetName}-meme.mp4`;
      await createMemeFromPreset(presetName, videoFile, outputFile);
      break;
    
    case 'all':
      console.log('Creating all example memes...\n');
      await createBasicMeme();
      console.log('\n---\n');
      await createMultiLayerMeme();
      console.log('\n---\n');
      await createDynamicBackgroundMeme();
      console.log('\n---\n');
      await createWeatherReporterMeme();
      console.log('\n---\n');
      await createReactionMeme();
      console.log('\n---\n');
      await createEducationalMeme();
      console.log('\n---\n');
      await createGamingMeme();
      break;
    
    default:
      console.log('Usage: node green-screen-memes.js [example]');
      console.log('Examples: basic, multi, dynamic, weather, reaction, education, gaming, preset, all');
      console.log('\nFor presets: node green-screen-memes.js preset [preset_name] [video_file] [output_file]');
      console.log('Available presets:', Object.keys(MEME_PRESETS).join(', '));
  }
  
  console.log('\n✨ Done! Check the output/ directory for your memes.');
}

// Run the examples
main().catch(console.error);
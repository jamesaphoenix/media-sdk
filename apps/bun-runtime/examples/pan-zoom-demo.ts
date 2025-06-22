/**
 * Pan and Zoom Effects Demo
 * 
 * Demonstrates the new pan/zoom capabilities of the Media SDK
 */

import { join } from 'path';
import { existsSync, mkdirSync } from 'fs';

// Import directly from source for development
import { Timeline } from '../../../packages/media-sdk/src/timeline/timeline';
import {
  addKenBurns,
  zoomIn,
  zoomOut,
  pan,
  suggestPanZoom,
  panZoomEffect
} from '../../../packages/media-sdk/src/effects/pan-zoom';
import { FFmpegExecutor } from '../../../packages/media-sdk/src/executor/executor';

const ASSETS_DIR = join(process.cwd(), 'test', 'assets');
const OUTPUT_DIR = join(process.cwd(), 'output', 'pan-zoom-demo');

// Ensure output directory exists
if (!existsSync(OUTPUT_DIR)) {
  mkdirSync(OUTPUT_DIR, { recursive: true });
}

const executor = new FFmpegExecutor();

/**
 * Demo 1: Ken Burns Effect
 */
async function kenBurnsDemo() {
  console.log('🎬 Demo 1: Ken Burns Effect');
  
  const timeline = new Timeline()
    .addImage(join(ASSETS_DIR, 'sample-landscape.jpg'), { duration: 6 })
    .pipe(timeline => addKenBurns(timeline, {
      direction: 'center-out',
      duration: 6,
      startZoom: 1.0,
      endZoom: 1.5,
      easing: 'ease-in-out'
    }))
    .addText('Ken Burns Effect', {
      position: { x: '50%', y: '10%', anchor: 'top-center' },
      style: {
        fontSize: 64,
        color: '#ffffff',
        strokeColor: '#000000',
        strokeWidth: 3,
        backgroundColor: 'rgba(0,0,0,0.7)',
        padding: 20,
        borderRadius: 10
      }
    });

  const outputPath = join(OUTPUT_DIR, 'ken-burns-demo.mp4');
  const command = timeline.getCommand(outputPath);
  
  console.log('  Executing Ken Burns effect...');
  await executor.execute(command);
  console.log(`  ✅ Saved to: ${outputPath}`);
}

/**
 * Demo 2: Zoom In/Out Effects
 */
async function zoomEffectsDemo() {
  console.log('\n🔍 Demo 2: Zoom Effects');
  
  // Zoom In
  const zoomInTimeline = new Timeline()
    .addImage(join(ASSETS_DIR, 'sample-portrait.jpg'), { duration: 4 })
    .setAspectRatio('9:16') // Instagram/TikTok format
    .pipe(timeline => zoomIn(timeline, {
      zoom: 1.8,
      duration: 4,
      easing: 'ease-out'
    }))
    .addText('Zoom In Effect', {
      position: { x: '50%', y: '80%', anchor: 'center' },
      style: {
        fontSize: 48,
        color: '#ffffff',
        backgroundColor: '#ff0066',
        padding: 15,
        borderRadius: 25
      }
    });

  const zoomInPath = join(OUTPUT_DIR, 'zoom-in-demo.mp4');
  console.log('  Creating zoom in effect...');
  await executor.execute(zoomInTimeline.getCommand(zoomInPath));
  console.log(`  ✅ Zoom in saved to: ${zoomInPath}`);

  // Zoom Out
  const zoomOutTimeline = new Timeline()
    .addImage(join(ASSETS_DIR, 'sample-portrait.jpg'), { duration: 4 })
    .setAspectRatio('9:16')
    .pipe(timeline => zoomOut(timeline, {
      zoom: 2.0,
      duration: 4,
      easing: 'ease-in'
    }))
    .addText('Zoom Out Effect', {
      position: { x: '50%', y: '80%', anchor: 'center' },
      style: {
        fontSize: 48,
        color: '#ffffff',
        backgroundColor: '#0066ff',
        padding: 15,
        borderRadius: 25
      }
    });

  const zoomOutPath = join(OUTPUT_DIR, 'zoom-out-demo.mp4');
  console.log('  Creating zoom out effect...');
  await executor.execute(zoomOutTimeline.getCommand(zoomOutPath));
  console.log(`  ✅ Zoom out saved to: ${zoomOutPath}`);
}

/**
 * Demo 3: Pan Effects
 */
async function panEffectsDemo() {
  console.log('\n📹 Demo 3: Pan Effects');
  
  const directions: Array<'left' | 'right' | 'up' | 'down'> = ['left', 'right', 'up', 'down'];
  
  for (const direction of directions) {
    const timeline = new Timeline()
      .addImage(join(ASSETS_DIR, 'sample-wide.jpg'), { duration: 5 })
      .setAspectRatio('16:9')
      .pipe(timeline => pan(timeline, {
        direction,
        duration: 5,
        easing: 'linear'
      }))
      .addText(`Pan ${direction.toUpperCase()}`, {
        position: { x: '50%', y: '90%', anchor: 'bottom-center' },
        style: {
          fontSize: 42,
          color: '#ffffff',
          backgroundColor: 'rgba(0,0,0,0.8)',
          padding: 12,
          borderRadius: 8
        }
      });

    const outputPath = join(OUTPUT_DIR, `pan-${direction}-demo.mp4`);
    console.log(`  Creating pan ${direction} effect...`);
    await executor.execute(timeline.getCommand(outputPath));
    console.log(`  ✅ Pan ${direction} saved to: ${outputPath}`);
  }
}

/**
 * Demo 4: AI-Suggested Effects
 */
async function aiSuggestedDemo() {
  console.log('\n🤖 Demo 4: AI-Suggested Effects');
  
  const scenarios = [
    { 
      contentType: 'landscape' as const, 
      platform: 'youtube' as const,
      image: 'sample-landscape.jpg',
      title: 'Scenic Landscape'
    },
    { 
      contentType: 'portrait' as const, 
      platform: 'tiktok' as const,
      image: 'sample-portrait.jpg',
      title: 'Portrait Focus'
    },
    { 
      contentType: 'action' as const, 
      platform: 'instagram' as const,
      image: 'sample-action.jpg',
      title: 'Action Scene'
    }
  ];

  for (const scenario of scenarios) {
    const timeline = new Timeline()
      .addImage(join(ASSETS_DIR, scenario.image), { duration: 5 })
      .setAspectRatio(scenario.platform === 'tiktok' ? '9:16' : scenario.platform === 'instagram' ? '1:1' : '16:9')
      .pipe(timeline => suggestPanZoom(timeline, {
        contentType: scenario.contentType,
        platform: scenario.platform
      }))
      .addText(scenario.title, {
        position: { x: '50%', y: '50%', anchor: 'center' },
        style: {
          fontSize: 56,
          color: '#ffffff',
          strokeColor: '#000000',
          strokeWidth: 3,
          backgroundColor: 'rgba(0,0,0,0.6)',
          padding: 20,
          borderRadius: 15
        }
      });

    const outputPath = join(OUTPUT_DIR, `ai-${scenario.contentType}-${scenario.platform}.mp4`);
    console.log(`  Creating AI-optimized ${scenario.contentType} for ${scenario.platform}...`);
    await executor.execute(timeline.getCommand(outputPath));
    console.log(`  ✅ Saved to: ${outputPath}`);
  }
}

/**
 * Demo 5: Combined Effects
 */
async function combinedEffectsDemo() {
  console.log('\n🎨 Demo 5: Combined Effects');
  
  // Pan + Zoom + Filters
  const timeline = new Timeline()
    .addImage(join(ASSETS_DIR, 'sample-landscape.jpg'), { duration: 8 })
    .setAspectRatio('16:9')
    // First apply Ken Burns
    .pipe(timeline => addKenBurns(timeline, {
      direction: 'diagonal',
      duration: 8,
      startZoom: 1.0,
      endZoom: 2.0,
      easing: 'ease-in-out'
    }))
    // Add some color grading
    .addFilter('colorchannelmixer', { rr: 1.2, gg: 1.0, bb: 0.8 }) // Warm tone
    .addFilter('vignette', { angle: 'PI/4' })
    // Add animated text
    .addText('Professional Video Production', {
      position: { x: '50%', y: '50%', anchor: 'center' },
      style: {
        fontSize: 72,
        color: '#ffffff',
        fontFamily: 'Arial',
        fontWeight: 'bold',
        strokeColor: '#000000',
        strokeWidth: 4,
        letterSpacing: 2
      },
      startTime: 2,
      duration: 4
    });

  const outputPath = join(OUTPUT_DIR, 'combined-effects-demo.mp4');
  console.log('  Creating combined effects demo...');
  await executor.execute(timeline.getCommand(outputPath));
  console.log(`  ✅ Combined effects saved to: ${outputPath}`);
}

/**
 * Run all demos
 */
async function runAllDemos() {
  console.log('🎯 Media SDK Pan & Zoom Effects Demo\n');
  
  try {
    await kenBurnsDemo();
    await zoomEffectsDemo();
    await panEffectsDemo();
    await aiSuggestedDemo();
    await combinedEffectsDemo();
    
    console.log('\n✨ All demos completed successfully!');
    console.log(`📁 Check the output directory: ${OUTPUT_DIR}`);
  } catch (error) {
    console.error('\n❌ Error running demos:', error);
  }
}

// Run if called directly
if (import.meta.main) {
  runAllDemos();
}

// Export for use in other scripts
export {
  kenBurnsDemo,
  zoomEffectsDemo,
  panEffectsDemo,
  aiSuggestedDemo,
  combinedEffectsDemo,
  runAllDemos
};
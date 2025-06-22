/**
 * Simple Pan and Zoom Demo
 * 
 * Demonstrates pan/zoom effects with direct FFmpeg commands
 */

import { join } from 'path';
import { existsSync, mkdirSync } from 'fs';
import { spawn } from 'child_process';

const ASSETS_DIR = join(process.cwd(), 'test', 'assets');
const OUTPUT_DIR = join(process.cwd(), 'output', 'pan-zoom-simple');

// Ensure output directory exists
if (!existsSync(OUTPUT_DIR)) {
  mkdirSync(OUTPUT_DIR, { recursive: true });
}

/**
 * Execute FFmpeg command
 */
function executeFFmpeg(args: string[]): Promise<void> {
  return new Promise((resolve, reject) => {
    console.log('Executing: ffmpeg', args.join(' '));
    
    const proc = spawn('ffmpeg', args);
    
    proc.stderr.on('data', (data) => {
      // FFmpeg outputs to stderr by default
      const output = data.toString();
      if (output.includes('error') || output.includes('Error')) {
        console.error(output);
      }
    });
    
    proc.on('close', (code) => {
      if (code === 0) {
        resolve();
      } else {
        reject(new Error(`FFmpeg exited with code ${code}`));
      }
    });
  });
}

/**
 * Demo 1: Basic Ken Burns Effect
 */
async function basicKenBurns() {
  console.log('🎬 Basic Ken Burns Effect');
  
  const input = join(ASSETS_DIR, 'sample-landscape.jpg');
  const output = join(OUTPUT_DIR, 'ken-burns-basic.mp4');
  
  // Simple zoom from 1x to 1.5x over 5 seconds
  const args = [
    '-y',
    '-loop', '1',
    '-i', input,
    '-filter_complex', '[0:v]zoompan=z=\'zoom+0.002\':d=125:s=1920x1080:fps=25[v]',
    '-map', '[v]',
    '-t', '5',
    '-c:v', 'libx264',
    '-pix_fmt', 'yuv420p',
    output
  ];
  
  await executeFFmpeg(args);
  console.log(`✅ Saved to: ${output}\n`);
}

/**
 * Demo 2: Pan from Left to Right
 */
async function panLeftToRight() {
  console.log('📹 Pan from Left to Right');
  
  const input = join(ASSETS_DIR, 'sample-wide.jpg');
  const output = join(OUTPUT_DIR, 'pan-left-right.mp4');
  
  // Pan across a wide image
  const command = `ffmpeg -y -loop 1 -i "${input}" -filter_complex "[0:v]zoompan=z='1':x='iw/2-(iw/2)*t/5':y='ih/2-(ih/2)':d=125:s=1920x1080:fps=25[v]" -map "[v]" -t 5 -c:v libx264 -pix_fmt yuv420p "${output}"`;
  
  await executeFFmpeg(command);
  console.log(`✅ Saved to: ${output}\n`);
}

/**
 * Demo 3: Zoom In with Text Overlay
 */
async function zoomInWithText() {
  console.log('🔍 Zoom In with Text');
  
  const input = join(ASSETS_DIR, 'sample-portrait.jpg');
  const output = join(OUTPUT_DIR, 'zoom-in-text.mp4');
  
  // Zoom in from 1x to 2x and add text
  const command = `ffmpeg -y -loop 1 -i "${input}" -filter_complex "[0:v]zoompan=z='1+0.004*t':d=125:s=1080x1920:fps=25,drawtext=text='Zoom In Effect':x=(w-text_w)/2:y=100:fontsize=64:fontcolor=white:box=1:boxcolor=black@0.7:boxborderw=10[v]" -map "[v]" -t 5 -c:v libx264 -pix_fmt yuv420p "${output}"`;
  
  await executeFFmpeg(command);
  console.log(`✅ Saved to: ${output}\n`);
}

/**
 * Demo 4: Center Out Ken Burns
 */
async function centerOutKenBurns() {
  console.log('🎯 Center Out Ken Burns');
  
  const input = join(ASSETS_DIR, 'sample-1.jpg');
  const output = join(OUTPUT_DIR, 'center-out.mp4');
  
  // Zoom from center maintaining focus
  const command = `ffmpeg -y -loop 1 -i "${input}" -filter_complex "[0:v]zoompan=z='min(zoom+0.0015,1.5)':x='iw/2-(iw/zoom/2)':y='ih/2-(ih/zoom/2)':d=150:s=1920x1080:fps=30[v]" -map "[v]" -t 5 -c:v libx264 -pix_fmt yuv420p "${output}"`;
  
  await executeFFmpeg(command);
  console.log(`✅ Saved to: ${output}\n`);
}

/**
 * Demo 5: Diagonal Pan with Zoom
 */
async function diagonalPanZoom() {
  console.log('↗️ Diagonal Pan with Zoom');
  
  const input = join(ASSETS_DIR, 'sample-2.jpg');
  const output = join(OUTPUT_DIR, 'diagonal-pan-zoom.mp4');
  
  // Move from top-left to bottom-right while zooming
  const command = `ffmpeg -y -loop 1 -i "${input}" -filter_complex "[0:v]zoompan=z='1+0.002*t':x='t*5':y='t*3':d=125:s=1920x1080:fps=25[v]" -map "[v]" -t 5 -c:v libx264 -pix_fmt yuv420p "${output}"`;
  
  await executeFFmpeg(command);
  console.log(`✅ Saved to: ${output}\n`);
}

/**
 * Demo 6: Instagram Story Format
 */
async function instagramStoryPanZoom() {
  console.log('📱 Instagram Story Pan/Zoom');
  
  const input = join(ASSETS_DIR, 'sample-portrait.jpg');
  const output = join(OUTPUT_DIR, 'instagram-story.mp4');
  
  // 9:16 aspect ratio with smooth zoom
  const command = `ffmpeg -y -loop 1 -i "${input}" -filter_complex "[0:v]zoompan=z='if(lte(zoom,1.3),zoom+0.002,1.3)':x='iw/2-(iw/zoom/2)':y='ih/2-(ih/zoom/2)':d=90:s=1080x1920:fps=30,drawtext=text='Swipe Up!':x=(w-text_w)/2:y=h-150:fontsize=48:fontcolor=white:shadowcolor=black:shadowx=2:shadowy=2[v]" -map "[v]" -t 3 -c:v libx264 -pix_fmt yuv420p "${output}"`;
  
  await executeFFmpeg(command);
  console.log(`✅ Saved to: ${output}\n`);
}

/**
 * Demo 7: Smooth Easing
 */
async function smoothEasing() {
  console.log('〰️ Smooth Easing Effect');
  
  const input = join(ASSETS_DIR, 'sample-3.jpg');
  const output = join(OUTPUT_DIR, 'smooth-easing.mp4');
  
  // Use sine function for smooth easing
  const command = `ffmpeg -y -loop 1 -i "${input}" -filter_complex "[0:v]zoompan=z='1+0.5*sin(t*PI/5)':x='iw/2-(iw/zoom/2)':y='ih/2-(ih/zoom/2)':d=150:s=1920x1080:fps=30[v]" -map "[v]" -t 5 -c:v libx264 -pix_fmt yuv420p "${output}"`;
  
  await executeFFmpeg(command);
  console.log(`✅ Saved to: ${output}\n`);
}

/**
 * Run all demos
 */
async function runAllDemos() {
  console.log('🎯 Simple Pan & Zoom FFmpeg Demo\n');
  
  try {
    await basicKenBurns();
    await panLeftToRight();
    await zoomInWithText();
    await centerOutKenBurns();
    await diagonalPanZoom();
    await instagramStoryPanZoom();
    await smoothEasing();
    
    console.log('✨ All demos completed successfully!');
    console.log(`📁 Output directory: ${OUTPUT_DIR}`);
    
    // Show example of how to integrate with Timeline
    console.log('\n📝 To integrate with Timeline API:');
    console.log('```typescript');
    console.log('// The zoompan filter can be added as a custom filter');
    console.log('timeline.addFilter("zoompan", {');
    console.log('  z: "min(zoom+0.0015,1.5)",');
    console.log('  x: "iw/2-(iw/zoom/2)",');
    console.log('  y: "ih/2-(ih/zoom/2)",');
    console.log('  d: 125,');
    console.log('  s: "1920x1080",');
    console.log('  fps: 25');
    console.log('});');
    console.log('```');
  } catch (error) {
    console.error('❌ Error:', error);
  }
}

// Run if called directly
if (import.meta.main) {
  runAllDemos();
}

export { runAllDemos };
/**
 * FFmpeg Pan and Zoom Examples
 * 
 * Direct FFmpeg commands demonstrating pan/zoom effects
 */

import { join } from 'path';
import { existsSync, mkdirSync } from 'fs';
import { execSync } from 'child_process';

const ASSETS_DIR = join(process.cwd(), 'test', 'assets');
const OUTPUT_DIR = join(process.cwd(), 'output', 'pan-zoom-ffmpeg');

// Ensure output directory exists
if (!existsSync(OUTPUT_DIR)) {
  mkdirSync(OUTPUT_DIR, { recursive: true });
}

/**
 * Demo 1: Basic Ken Burns (Zoom In)
 */
function kenBurnsZoomIn() {
  console.log('🎬 Ken Burns - Zoom In');
  
  const input = join(ASSETS_DIR, 'sample-1.jpg');
  const output = join(OUTPUT_DIR, '1-ken-burns-zoom-in.mp4');
  
  const cmd = `ffmpeg -y -loop 1 -i "${input}" -vf "scale=8000:-1,zoompan=z='min(zoom+0.0015,1.5)':x='iw/2-(iw/zoom/2)':y='ih/2-(ih/zoom/2)':d=125:s=1920x1080:fps=25" -t 5 -c:v libx264 -pix_fmt yuv420p "${output}"`;
  
  execSync(cmd, { stdio: 'inherit' });
  console.log(`✅ Created: ${output}\n`);
}

/**
 * Demo 2: Pan from Left to Right
 */
function panLeftRight() {
  console.log('📹 Pan - Left to Right');
  
  const input = join(ASSETS_DIR, 'sample-2.jpg');
  const output = join(OUTPUT_DIR, '2-pan-left-right.mp4');
  
  const cmd = `ffmpeg -y -loop 1 -i "${input}" -vf "scale=-1:2160,zoompan=z='1':x='0+t*50':y='ih/2-(ih/2)':d=150:s=1920x1080:fps=30" -t 5 -c:v libx264 -pix_fmt yuv420p "${output}"`;
  
  execSync(cmd, { stdio: 'inherit' });
  console.log(`✅ Created: ${output}\n`);
}

/**
 * Demo 3: Zoom Out
 */
function zoomOut() {
  console.log('🔍 Zoom Out Effect');
  
  const input = join(ASSETS_DIR, 'sample-3.jpg');
  const output = join(OUTPUT_DIR, '3-zoom-out.mp4');
  
  const cmd = `ffmpeg -y -loop 1 -i "${input}" -vf "scale=6000:-1,zoompan=z='if(gte(zoom,1),max(zoom-0.0015,1),1)':x='iw/2-(iw/zoom/2)':y='ih/2-(ih/zoom/2)':d=125:s=1920x1080:fps=25" -t 5 -c:v libx264 -pix_fmt yuv420p "${output}"`;
  
  execSync(cmd, { stdio: 'inherit' });
  console.log(`✅ Created: ${output}\n`);
}

/**
 * Demo 4: Diagonal Pan with Zoom
 */
function diagonalPan() {
  console.log('↗️ Diagonal Pan + Zoom');
  
  const input = join(ASSETS_DIR, 'sample-1.jpg');
  const output = join(OUTPUT_DIR, '4-diagonal-pan.mp4');
  
  const cmd = `ffmpeg -y -loop 1 -i "${input}" -vf "scale=4000:-1,zoompan=z='min(zoom+0.001,1.3)':x='0+t*10':y='0+t*5':d=150:s=1920x1080:fps=30" -t 5 -c:v libx264 -pix_fmt yuv420p "${output}"`;
  
  execSync(cmd, { stdio: 'inherit' });
  console.log(`✅ Created: ${output}\n`);
}

/**
 * Demo 5: Smooth Sine Wave Zoom
 */
function sineWaveZoom() {
  console.log('〰️ Sine Wave Zoom');
  
  const input = join(ASSETS_DIR, 'sample-2.jpg');
  const output = join(OUTPUT_DIR, '5-sine-wave.mp4');
  
  const cmd = `ffmpeg -y -loop 1 -i "${input}" -vf "scale=4000:-1,zoompan=z='1+0.2*sin(2*PI*t/5)':x='iw/2-(iw/zoom/2)':y='ih/2-(ih/zoom/2)':d=150:s=1920x1080:fps=30" -t 5 -c:v libx264 -pix_fmt yuv420p "${output}"`;
  
  execSync(cmd, { stdio: 'inherit' });
  console.log(`✅ Created: ${output}\n`);
}

/**
 * Demo 6: Instagram Story (9:16)
 */
function instagramStory() {
  console.log('📱 Instagram Story Format');
  
  const input = join(ASSETS_DIR, 'sample-3.jpg');
  const output = join(OUTPUT_DIR, '6-instagram-story.mp4');
  
  const cmd = `ffmpeg -y -loop 1 -i "${input}" -vf "scale=-1:3840,zoompan=z='min(zoom+0.002,1.4)':x='iw/2-(iw/zoom/2)':y='ih/2-(ih/zoom/2)':d=90:s=1080x1920:fps=30" -t 3 -c:v libx264 -pix_fmt yuv420p "${output}"`;
  
  execSync(cmd, { stdio: 'inherit' });
  console.log(`✅ Created: ${output}\n`);
}

/**
 * Demo 7: Multiple Effects Combined
 */
function combinedEffects() {
  console.log('🎨 Combined Effects with Text');
  
  const input = join(ASSETS_DIR, 'sample-1.jpg');
  const output = join(OUTPUT_DIR, '7-combined-effects.mp4');
  
  const cmd = `ffmpeg -y -loop 1 -i "${input}" -vf "scale=4000:-1,zoompan=z='min(zoom+0.0015,1.5)':x='iw/2-(iw/zoom/2)':y='ih/2-(ih/zoom/2)':d=150:s=1920x1080:fps=30,drawtext=text='Pan and Zoom Demo':x=(w-text_w)/2:y=100:fontsize=72:fontcolor=white:shadowcolor=black:shadowx=2:shadowy=2:enable='between(t,1,4)'" -t 5 -c:v libx264 -pix_fmt yuv420p "${output}"`;
  
  execSync(cmd, { stdio: 'inherit' });
  console.log(`✅ Created: ${output}\n`);
}

/**
 * Demo 8: Fast Ken Burns for Social Media
 */
function fastKenBurns() {
  console.log('⚡ Fast Ken Burns (TikTok style)');
  
  const input = join(ASSETS_DIR, 'sample-2.jpg');
  const output = join(OUTPUT_DIR, '8-fast-ken-burns.mp4');
  
  const cmd = `ffmpeg -y -loop 1 -i "${input}" -vf "scale=4000:-1,zoompan=z='min(zoom+0.004,1.8)':x='iw/2-(iw/zoom/2)':y='ih/2-(ih/zoom/2)':d=60:s=1080x1920:fps=30" -t 2 -c:v libx264 -pix_fmt yuv420p "${output}"`;
  
  execSync(cmd, { stdio: 'inherit' });
  console.log(`✅ Created: ${output}\n`);
}

/**
 * Demo 9: Focus Point Zoom
 */
function focusPointZoom() {
  console.log('🎯 Focus Point Zoom');
  
  const input = join(ASSETS_DIR, 'sample-3.jpg');
  const output = join(OUTPUT_DIR, '9-focus-point.mp4');
  
  // Zoom into a specific point (e.g., face detection would provide these coordinates)
  const focusX = 0.7; // 70% from left
  const focusY = 0.3; // 30% from top
  
  const cmd = `ffmpeg -y -loop 1 -i "${input}" -vf "scale=4000:-1,zoompan=z='min(zoom+0.002,2)':x='${focusX}*iw-(iw/zoom/2)':y='${focusY}*ih-(ih/zoom/2)':d=125:s=1920x1080:fps=25" -t 5 -c:v libx264 -pix_fmt yuv420p "${output}"`;
  
  execSync(cmd, { stdio: 'inherit' });
  console.log(`✅ Created: ${output}\n`);
}

/**
 * Demo 10: Easing Functions
 */
function easingDemo() {
  console.log('📈 Easing Functions Demo');
  
  const input = join(ASSETS_DIR, 'sample-1.jpg');
  const output = join(OUTPUT_DIR, '10-easing-demo.mp4');
  
  // Ease-in-out using smoothstep function
  const cmd = `ffmpeg -y -loop 1 -i "${input}" -vf "scale=4000:-1,zoompan=z='1+0.5*(3*pow(t/5,2)-2*pow(t/5,3))':x='iw/2-(iw/zoom/2)':y='ih/2-(ih/zoom/2)':d=125:s=1920x1080:fps=25" -t 5 -c:v libx264 -pix_fmt yuv420p "${output}"`;
  
  execSync(cmd, { stdio: 'inherit' });
  console.log(`✅ Created: ${output}\n`);
}

/**
 * Show FFmpeg zoompan filter documentation
 */
function showDocumentation() {
  console.log('\n📚 FFmpeg zoompan filter parameters:');
  console.log('  z  = zoom expression (default: 1)');
  console.log('  x  = x position expression (default: 0)');
  console.log('  y  = y position expression (default: 0)');
  console.log('  d  = duration in frames');
  console.log('  s  = output size WxH');
  console.log('  fps = output fps');
  console.log('\n📝 Available variables in expressions:');
  console.log('  zoom = current zoom value');
  console.log('  t    = time in seconds');
  console.log('  iw   = input width');
  console.log('  ih   = input height');
  console.log('  x    = current x position');
  console.log('  y    = current y position');
  console.log('\n💡 Tips:');
  console.log('  - Use scale filter first for high-res sources');
  console.log('  - min() and max() prevent excessive zoom');
  console.log('  - if() allows conditional expressions');
  console.log('  - sin() and cos() create smooth movements\n');
}

/**
 * Run all demos
 */
function runAllDemos() {
  console.log('🎯 FFmpeg Pan & Zoom Examples\n');
  
  try {
    kenBurnsZoomIn();
    panLeftRight();
    zoomOut();
    diagonalPan();
    sineWaveZoom();
    instagramStory();
    combinedEffects();
    fastKenBurns();
    focusPointZoom();
    easingDemo();
    
    showDocumentation();
    
    console.log('✨ All demos completed!');
    console.log(`📁 Output: ${OUTPUT_DIR}\n`);
  } catch (error) {
    console.error('❌ Error:', error);
  }
}

// Run if called directly
if (import.meta.main) {
  runAllDemos();
}

export { runAllDemos };
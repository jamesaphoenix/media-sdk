/**
 * Core Primitives Comprehensive Runtime Tests
 * Tests all fundamental Timeline operations with extensive coverage
 */

import { describe, test, expect, beforeAll } from 'bun:test';
import { Timeline } from '@jamesaphoenix/media-sdk';
import { EnhancedBunCassetteManager } from '../src/enhanced-cassette-manager';
import { existsSync, mkdirSync } from 'fs';

const cassetteManager = new EnhancedBunCassetteManager('core-primitives');

beforeAll(async () => {
  // Ensure directories exist
  ['output', 'test-assets', 'primitives-output'].forEach(dir => {
    if (!existsSync(dir)) {
      mkdirSync(dir, { recursive: true });
    }
  });
  
  await createPrimitiveAssets();
});

async function createPrimitiveAssets() {
  const assets = [
    {
      name: 'test-assets/base-video.mp4',
      command: 'ffmpeg -f lavfi -i testsrc=duration=10:size=1920x1080:rate=30 -c:v libx264 -preset ultrafast -y'
    },
    {
      name: 'test-assets/small-video.mp4', 
      command: 'ffmpeg -f lavfi -i testsrc2=duration=5:size=640x480:rate=30 -c:v libx264 -preset ultrafast -y'
    },
    {
      name: 'test-assets/portrait-video.mp4',
      command: 'ffmpeg -f lavfi -i testsrc=duration=8:size=720x1280:rate=30 -c:v libx264 -preset ultrafast -y'
    },
    {
      name: 'test-assets/square-video.mp4',
      command: 'ffmpeg -f lavfi -i testsrc2=duration=6:size=1000x1000:rate=30 -c:v libx264 -preset ultrafast -y'
    },
    {
      name: 'test-assets/stereo-audio.mp3',
      command: 'ffmpeg -f lavfi -i "sine=frequency=440:duration=8,sine=frequency=880:duration=8" -filter_complex "[0:0][1:0]amerge=inputs=2[out]" -map "[out]" -c:a aac -y'
    },
    {
      name: 'test-assets/mono-audio.mp3',
      command: 'ffmpeg -f lavfi -i sine=frequency=660:duration=6 -ac 1 -c:a aac -y'
    },
    {
      name: 'test-assets/quiet-audio.mp3',
      command: 'ffmpeg -f lavfi -i sine=frequency=330:duration=5 -af "volume=0.1" -c:a aac -y'
    },
    {
      name: 'test-assets/test-image.png',
      command: 'ffmpeg -f lavfi -i color=blue:size=800x600:duration=1 -frames:v 1 -y'
    },
    {
      name: 'test-assets/logo-image.png',
      command: 'ffmpeg -f lavfi -i color=red:size=200x200:duration=1 -frames:v 1 -y'
    }
  ];
  
  for (const asset of assets) {
    if (!existsSync(asset.name)) {
      console.log(`Creating primitive asset: ${asset.name}`);
      const result = await cassetteManager.executeCommand(`${asset.command} ${asset.name}`);
      if (!result.success) {
        console.warn(`Failed to create ${asset.name}:`, result.stderr);
      }
    }
  }
}

describe('🎬 Core Video Primitives', () => {
  test('Timeline creation and basic video addition', async () => {
    const timeline = new Timeline();
    expect(timeline).toBeDefined();
    
    const withVideo = timeline.addVideo('test-assets/base-video.mp4');
    expect(withVideo).toBeDefined();
    expect(withVideo).not.toBe(timeline); // Should be immutable
    
    const command = withVideo.getCommand('primitives-output/basic-video.mp4');
    expect(command).toContain('ffmpeg');
    expect(command).toContain('test-assets/base-video.mp4');
    
    const result = await cassetteManager.executeCommand(command);
    expect(result.success).toBe(true);
    expect(existsSync('primitives-output/basic-video.mp4')).toBe(true);
  });

  test('Video with start time and duration', async () => {
    const timeline = new Timeline()
      .addVideo('test-assets/base-video.mp4', {
        startTime: 2,
        duration: 5
      });
    
    const command = timeline.getCommand('primitives-output/video-timing.mp4');
    expect(command).toContain('-ss 2');
    expect(command).toContain('-t 5');
    
    const result = await cassetteManager.executeCommand(command);
    expect(result.success).toBe(true);
  });

  test('Video with trim operations', async () => {
    const timeline = new Timeline()
      .addVideo('test-assets/base-video.mp4', {
        trimStart: 1,
        trimEnd: 8
      });
    
    const command = timeline.getCommand('primitives-output/video-trim.mp4');
    expect(command).toContain('-ss 1');
    
    const result = await cassetteManager.executeCommand(command);
    expect(result.success).toBe(true);
  });

  test('Multiple video layers with different timings', async () => {
    const timeline = new Timeline()
      .addVideo('test-assets/base-video.mp4', {
        startTime: 0,
        duration: 8
      })
      .addVideo('test-assets/small-video.mp4', {
        startTime: 3,
        duration: 4
      });
    
    const command = timeline.getCommand('primitives-output/multi-video.mp4');
    expect(command).toContain('filter_complex');
    
    const result = await cassetteManager.executeCommand(command);
    expect(result.success).toBe(true);
  });

  test('Video scaling operations', async () => {
    const timeline = new Timeline()
      .addVideo('test-assets/base-video.mp4')
      .setResolution(1280, 720);
    
    const command = timeline.getCommand('primitives-output/video-scale.mp4');
    expect(command).toContain('scale=1280:720');
    
    const result = await cassetteManager.executeCommand(command);
    expect(result.success).toBe(true);
  });

  test('Video aspect ratio changes', async () => {
    const timeline = new Timeline()
      .addVideo('test-assets/base-video.mp4')
      .setAspectRatio('16:9');
    
    const command = timeline.getCommand('primitives-output/aspect-ratio.mp4');
    expect(command).toContain('16/9');
    
    const result = await cassetteManager.executeCommand(command);
    expect(result.success).toBe(true);
  });

  test('Video cropping operations', async () => {
    const timeline = new Timeline()
      .addVideo('test-assets/base-video.mp4')
      .crop(100, 100, 800, 600);
    
    const command = timeline.getCommand('primitives-output/video-crop.mp4');
    expect(command).toContain('crop=800:600:100:100');
    
    const result = await cassetteManager.executeCommand(command);
    expect(result.success).toBe(true);
  });

  test('Video with different codecs and quality', async () => {
    const timeline = new Timeline()
      .addVideo('test-assets/base-video.mp4')
      .setCodec('libx264')
      .setQuality(28);
    
    const command = timeline.getCommand('primitives-output/video-codec.mp4');
    expect(command).toContain('-c:v libx264');
    expect(command).toContain('-crf 28');
    
    const result = await cassetteManager.executeCommand(command);
    expect(result.success).toBe(true);
  });

  test('Video frame rate changes', async () => {
    const timeline = new Timeline()
      .addVideo('test-assets/base-video.mp4')
      .setFrameRate(60);
    
    const command = timeline.getCommand('primitives-output/video-fps.mp4');
    expect(command).toContain('-r 60');
    
    const result = await cassetteManager.executeCommand(command);
    expect(result.success).toBe(true);
  });

  test('Video with different aspect ratios (portrait, square)', async () => {
    // Portrait video
    const portrait = new Timeline()
      .addVideo('test-assets/portrait-video.mp4');
    
    let command = portrait.getCommand('primitives-output/portrait.mp4');
    let result = await cassetteManager.executeCommand(command);
    expect(result.success).toBe(true);
    
    // Square video
    const square = new Timeline()
      .addVideo('test-assets/square-video.mp4');
    
    command = square.getCommand('primitives-output/square.mp4');
    result = await cassetteManager.executeCommand(command);
    expect(result.success).toBe(true);
  });
});

describe('🎵 Core Audio Primitives', () => {
  test('Basic audio addition', async () => {
    const timeline = new Timeline()
      .addVideo('test-assets/base-video.mp4')
      .addAudio('test-assets/stereo-audio.mp3');
    
    const command = timeline.getCommand('primitives-output/basic-audio.mp4');
    expect(command).toContain('test-assets/stereo-audio.mp3');
    
    const result = await cassetteManager.executeCommand(command);
    expect(result.success).toBe(true);
  });

  test('Audio with volume control', async () => {
    const timeline = new Timeline()
      .addVideo('test-assets/base-video.mp4')
      .addAudio('test-assets/stereo-audio.mp3', { volume: 0.5 });
    
    const command = timeline.getCommand('primitives-output/audio-volume.mp4');
    expect(command).toContain('volume=0.5');
    
    const result = await cassetteManager.executeCommand(command);
    expect(result.success).toBe(true);
  });

  test('Audio with timing controls', async () => {
    const timeline = new Timeline()
      .addVideo('test-assets/base-video.mp4')
      .addAudio('test-assets/stereo-audio.mp3', {
        startTime: 2,
        duration: 4
      });
    
    const command = timeline.getCommand('primitives-output/audio-timing.mp4');
    const result = await cassetteManager.executeCommand(command);
    expect(result.success).toBe(true);
  });

  test('Audio panning (left/right channels)', async () => {
    const timeline = new Timeline()
      .addVideo('test-assets/base-video.mp4')
      .addAudio('test-assets/stereo-audio.mp3', { pan: -0.5 }); // Left channel
    
    const command = timeline.getCommand('primitives-output/audio-pan-left.mp4');
    expect(command).toContain('pan');
    
    const result = await cassetteManager.executeCommand(command);
    expect(result.success).toBe(true);
    
    // Test right channel
    const rightPan = new Timeline()
      .addVideo('test-assets/base-video.mp4')
      .addAudio('test-assets/stereo-audio.mp3', { pan: 0.5 });
    
    const rightCommand = rightPan.getCommand('primitives-output/audio-pan-right.mp4');
    const rightResult = await cassetteManager.executeCommand(rightCommand);
    expect(rightResult.success).toBe(true);
  });

  test('Audio fade in and fade out', async () => {
    const timeline = new Timeline()
      .addVideo('test-assets/base-video.mp4')
      .addAudio('test-assets/stereo-audio.mp3', {
        fadeIn: 1.5,
        fadeOut: 2.0
      });
    
    const command = timeline.getCommand('primitives-output/audio-fade.mp4');
    expect(command).toContain('afade');
    
    const result = await cassetteManager.executeCommand(command);
    expect(result.success).toBe(true);
  });

  test('Multiple audio tracks with mixing', async () => {
    const timeline = new Timeline()
      .addVideo('test-assets/base-video.mp4')
      .addAudio('test-assets/stereo-audio.mp3', { volume: 0.8 })
      .addAudio('test-assets/mono-audio.mp3', { volume: 0.6 })
      .addAudio('test-assets/quiet-audio.mp3', { volume: 1.0 });
    
    const command = timeline.getCommand('primitives-output/multi-audio.mp4');
    expect(command).toContain('amix');
    
    const result = await cassetteManager.executeCommand(command);
    expect(result.success).toBe(true);
  });

  test('Audio with different start times (layered)', async () => {
    const timeline = new Timeline()
      .addVideo('test-assets/base-video.mp4')
      .addAudio('test-assets/stereo-audio.mp3', { 
        startTime: 0,
        volume: 0.7
      })
      .addAudio('test-assets/mono-audio.mp3', { 
        startTime: 2,
        volume: 0.5
      })
      .addAudio('test-assets/quiet-audio.mp3', { 
        startTime: 4,
        volume: 1.0
      });
    
    const command = timeline.getCommand('primitives-output/layered-audio.mp4');
    const result = await cassetteManager.executeCommand(command);
    expect(result.success).toBe(true);
  });

  test('Audio channel configuration (mono to stereo)', async () => {
    const timeline = new Timeline()
      .addVideo('test-assets/base-video.mp4')
      .addAudio('test-assets/mono-audio.mp3', { channels: 2 });
    
    const command = timeline.getCommand('primitives-output/mono-to-stereo.mp4');
    const result = await cassetteManager.executeCommand(command);
    expect(result.success).toBe(true);
  });

  test('Audio sample rate changes', async () => {
    const timeline = new Timeline()
      .addVideo('test-assets/base-video.mp4')
      .addAudio('test-assets/stereo-audio.mp3', { sampleRate: 48000 });
    
    const command = timeline.getCommand('primitives-output/audio-sample-rate.mp4');
    expect(command).toContain('-ar 48000');
    
    const result = await cassetteManager.executeCommand(command);
    expect(result.success).toBe(true);
  });
});

describe('📝 Text Primitives', () => {
  test('Basic text overlay', async () => {
    const timeline = new Timeline()
      .addVideo('test-assets/base-video.mp4')
      .addText('Hello World');
    
    const command = timeline.getCommand('primitives-output/basic-text.mp4');
    expect(command).toContain('drawtext');
    expect(command).toContain('Hello World');
    
    const result = await cassetteManager.executeCommand(command);
    expect(result.success).toBe(true);
  });

  test('Text with custom positioning', async () => {
    const timeline = new Timeline()
      .addVideo('test-assets/base-video.mp4')
      .addText('Positioned Text', {
        position: { x: 100, y: 200 }
      });
    
    const command = timeline.getCommand('primitives-output/positioned-text.mp4');
    expect(command).toContain('x=100');
    expect(command).toContain('y=200');
    
    const result = await cassetteManager.executeCommand(command);
    expect(result.success).toBe(true);
  });

  test('Text with percentage positioning', async () => {
    const timeline = new Timeline()
      .addVideo('test-assets/base-video.mp4')
      .addText('Centered Text', {
        position: { x: 'center', y: 'center' }
      });
    
    const command = timeline.getCommand('primitives-output/centered-text.mp4');
    expect(command).toContain('x=(w-text_w)/2');
    expect(command).toContain('y=(h-text_h)/2');
    
    const result = await cassetteManager.executeCommand(command);
    expect(result.success).toBe(true);
  });

  test('Text with all style options', async () => {
    const timeline = new Timeline()
      .addVideo('test-assets/base-video.mp4')
      .addText('Styled Text', {
        style: {
          fontSize: 48,
          color: '#ff0066',
          fontFamily: 'Arial Bold',
          backgroundColor: '#000000',
          borderWidth: 2,
          borderColor: '#ffffff'
        }
      });
    
    const command = timeline.getCommand('primitives-output/styled-text.mp4');
    expect(command).toContain('fontsize=48');
    expect(command).toContain('fontcolor=0xff0066');
    expect(command).toContain('fontfile');
    
    const result = await cassetteManager.executeCommand(command);
    expect(result.success).toBe(true);
  });

  test('Text with timing controls', async () => {
    const timeline = new Timeline()
      .addVideo('test-assets/base-video.mp4')
      .addText('Timed Text', {
        startTime: 2,
        duration: 3
      });
    
    const command = timeline.getCommand('primitives-output/timed-text.mp4');
    expect(command).toContain('enable=');
    
    const result = await cassetteManager.executeCommand(command);
    expect(result.success).toBe(true);
  });

  test('Multiple text overlays with different timings', async () => {
    const timeline = new Timeline()
      .addVideo('test-assets/base-video.mp4')
      .addText('First Text', {
        position: { x: 'center', y: '20%' },
        startTime: 0,
        duration: 3,
        style: { fontSize: 36, color: '#ffffff' }
      })
      .addText('Second Text', {
        position: { x: 'center', y: '50%' },
        startTime: 2,
        duration: 4,
        style: { fontSize: 32, color: '#ffff00' }
      })
      .addText('Third Text', {
        position: { x: 'center', y: '80%' },
        startTime: 5,
        duration: 3,
        style: { fontSize: 28, color: '#00ff00' }
      });
    
    const command = timeline.getCommand('primitives-output/multi-text.mp4');
    const result = await cassetteManager.executeCommand(command);
    expect(result.success).toBe(true);
  });

  test('Text with special characters and escaping', async () => {
    const timeline = new Timeline()
      .addVideo('test-assets/base-video.mp4')
      .addText('Special: "quotes" & <brackets> | pipes', {
        position: { x: 'center', y: 'center' },
        style: { fontSize: 24, color: '#ffffff' }
      });
    
    const command = timeline.getCommand('primitives-output/special-chars.mp4');
    const result = await cassetteManager.executeCommand(command);
    expect(result.success).toBe(true);
  });

  test('Text with multiline content', async () => {
    const timeline = new Timeline()
      .addVideo('test-assets/base-video.mp4')
      .addText('Line 1\\nLine 2\\nLine 3', {
        position: { x: 'center', y: 'center' },
        style: { fontSize: 32, color: '#ffffff' }
      });
    
    const command = timeline.getCommand('primitives-output/multiline-text.mp4');
    const result = await cassetteManager.executeCommand(command);
    expect(result.success).toBe(true);
  });

  test('Text with transparency and shadow effects', async () => {
    const timeline = new Timeline()
      .addVideo('test-assets/base-video.mp4')
      .addText('Shadow Text', {
        position: { x: 'center', y: 'center' },
        style: {
          fontSize: 48,
          color: '#ffffff',
          shadowColor: '#000000',
          shadowOffset: { x: 2, y: 2 }
        }
      });
    
    const command = timeline.getCommand('primitives-output/shadow-text.mp4');
    const result = await cassetteManager.executeCommand(command);
    expect(result.success).toBe(true);
  });
});

describe('🖼️ Image Primitives', () => {
  test('Basic image overlay', async () => {
    const timeline = new Timeline()
      .addVideo('test-assets/base-video.mp4')
      .addImage('test-assets/test-image.png');
    
    const command = timeline.getCommand('primitives-output/basic-image.mp4');
    expect(command).toContain('overlay');
    expect(command).toContain('test-assets/test-image.png');
    
    const result = await cassetteManager.executeCommand(command);
    expect(result.success).toBe(true);
  });

  test('Image with custom positioning', async () => {
    const timeline = new Timeline()
      .addVideo('test-assets/base-video.mp4')
      .addImage('test-assets/test-image.png', {
        position: { x: 50, y: 100 }
      });
    
    const command = timeline.getCommand('primitives-output/positioned-image.mp4');
    expect(command).toContain('overlay=50:100');
    
    const result = await cassetteManager.executeCommand(command);
    expect(result.success).toBe(true);
  });

  test('Image with scaling', async () => {
    const timeline = new Timeline()
      .addVideo('test-assets/base-video.mp4')
      .addImage('test-assets/test-image.png', {
        scale: 0.5
      });
    
    const command = timeline.getCommand('primitives-output/scaled-image.mp4');
    expect(command).toContain('scale=');
    
    const result = await cassetteManager.executeCommand(command);
    expect(result.success).toBe(true);
  });

  test('Image with opacity control', async () => {
    const timeline = new Timeline()
      .addVideo('test-assets/base-video.mp4')
      .addImage('test-assets/test-image.png', {
        opacity: 0.7
      });
    
    const command = timeline.getCommand('primitives-output/transparent-image.mp4');
    expect(command).toContain('format=rgba');
    
    const result = await cassetteManager.executeCommand(command);
    expect(result.success).toBe(true);
  });

  test('Image with timing controls', async () => {
    const timeline = new Timeline()
      .addVideo('test-assets/base-video.mp4')
      .addImage('test-assets/test-image.png', {
        startTime: 2,
        duration: 4
      });
    
    const command = timeline.getCommand('primitives-output/timed-image.mp4');
    expect(command).toContain('enable=');
    
    const result = await cassetteManager.executeCommand(command);
    expect(result.success).toBe(true);
  });

  test('Multiple images with different properties', async () => {
    const timeline = new Timeline()
      .addVideo('test-assets/base-video.mp4')
      .addImage('test-assets/test-image.png', {
        position: { x: 10, y: 10 },
        scale: 0.3,
        opacity: 0.8,
        startTime: 0,
        duration: 5
      })
      .addImage('test-assets/logo-image.png', {
        position: { x: '80%', y: '80%' },
        scale: 0.2,
        opacity: 0.9,
        startTime: 3,
        duration: 4
      });
    
    const command = timeline.getCommand('primitives-output/multi-image.mp4');
    const result = await cassetteManager.executeCommand(command);
    expect(result.success).toBe(true);
  });

  test('Image as watermark', async () => {
    const timeline = new Timeline()
      .addVideo('test-assets/base-video.mp4')
      .addImage('test-assets/logo-image.png', {
        position: { x: '90%', y: '5%' },
        scale: 0.1,
        opacity: 0.6
      });
    
    const command = timeline.getCommand('primitives-output/watermark.mp4');
    const result = await cassetteManager.executeCommand(command);
    expect(result.success).toBe(true);
  });

  test('Image with rotation', async () => {
    const timeline = new Timeline()
      .addVideo('test-assets/base-video.mp4')
      .addImage('test-assets/test-image.png', {
        rotation: 45,
        position: { x: 'center', y: 'center' },
        scale: 0.5
      });
    
    const command = timeline.getCommand('primitives-output/rotated-image.mp4');
    expect(command).toContain('rotate=');
    
    const result = await cassetteManager.executeCommand(command);
    expect(result.success).toBe(true);
  });
});

describe('🎛️ Filter and Effect Primitives', () => {
  test('Basic filter application', async () => {
    const timeline = new Timeline()
      .addVideo('test-assets/base-video.mp4')
      .addFilter('brightness=0.2');
    
    const command = timeline.getCommand('primitives-output/brightness-filter.mp4');
    expect(command).toContain('brightness=0.2');
    
    const result = await cassetteManager.executeCommand(command);
    expect(result.success).toBe(true);
  });

  test('Multiple filters in sequence', async () => {
    const timeline = new Timeline()
      .addVideo('test-assets/base-video.mp4')
      .addFilter('brightness=0.1')
      .addFilter('contrast=1.2')
      .addFilter('saturation=1.5');
    
    const command = timeline.getCommand('primitives-output/multi-filter.mp4');
    expect(command).toContain('brightness=0.1');
    expect(command).toContain('contrast=1.2');
    expect(command).toContain('saturation=1.5');
    
    const result = await cassetteManager.executeCommand(command);
    expect(result.success).toBe(true);
  });

  test('Color correction filters', async () => {
    const timeline = new Timeline()
      .addVideo('test-assets/base-video.mp4')
      .addFilter('eq=gamma=1.2:contrast=1.1:brightness=0.05:saturation=1.3');
    
    const command = timeline.getCommand('primitives-output/color-correction.mp4');
    expect(command).toContain('eq=');
    
    const result = await cassetteManager.executeCommand(command);
    expect(result.success).toBe(true);
  });

  test('Blur and sharpening filters', async () => {
    const blurred = new Timeline()
      .addVideo('test-assets/base-video.mp4')
      .addFilter('boxblur=2:2');
    
    let command = blurred.getCommand('primitives-output/blur-filter.mp4');
    let result = await cassetteManager.executeCommand(command);
    expect(result.success).toBe(true);
    
    const sharpened = new Timeline()
      .addVideo('test-assets/base-video.mp4')
      .addFilter('unsharp=5:5:1.0');
    
    command = sharpened.getCommand('primitives-output/sharpen-filter.mp4');
    result = await cassetteManager.executeCommand(command);
    expect(result.success).toBe(true);
  });

  test('Noise and grain effects', async () => {
    const timeline = new Timeline()
      .addVideo('test-assets/base-video.mp4')
      .addFilter('noise=alls=20:allf=t+u');
    
    const command = timeline.getCommand('primitives-output/noise-filter.mp4');
    expect(command).toContain('noise=');
    
    const result = await cassetteManager.executeCommand(command);
    expect(result.success).toBe(true);
  });

  test('Fade in and fade out filters', async () => {
    const timeline = new Timeline()
      .addVideo('test-assets/base-video.mp4')
      .addFilter('fade=in:duration=2')
      .addFilter('fade=out:start_time=6:duration=2');
    
    const command = timeline.getCommand('primitives-output/fade-filters.mp4');
    expect(command).toContain('fade=in');
    expect(command).toContain('fade=out');
    
    const result = await cassetteManager.executeCommand(command);
    expect(result.success).toBe(true);
  });

  test('Custom complex filter', async () => {
    const timeline = new Timeline()
      .addVideo('test-assets/base-video.mp4')
      .addVideo('test-assets/small-video.mp4')
      .addFilter('[0:v][1:v]blend=all_mode=overlay:all_opacity=0.5[blended]');
    
    const command = timeline.getCommand('primitives-output/complex-filter.mp4');
    expect(command).toContain('filter_complex');
    expect(command).toContain('blend=');
    
    const result = await cassetteManager.executeCommand(command);
    expect(result.success).toBe(true);
  });

  test('Chaining compatible filters', async () => {
    const timeline = new Timeline()
      .addVideo('test-assets/base-video.mp4')
      .addFilter('hue=s=0') // Desaturate
      .addFilter('curves=vintage') // Vintage look
      .addFilter('vignette=PI/4'); // Add vignette
    
    const command = timeline.getCommand('primitives-output/filter-chain.mp4');
    const result = await cassetteManager.executeCommand(command);
    expect(result.success).toBe(true);
  });
});

describe('⚙️ Timeline Configuration Primitives', () => {
  test('Set output duration', async () => {
    const timeline = new Timeline()
      .addVideo('test-assets/base-video.mp4')
      .setDuration(5);
    
    const command = timeline.getCommand('primitives-output/duration-5s.mp4');
    expect(command).toContain('-t 5');
    
    const result = await cassetteManager.executeCommand(command);
    expect(result.success).toBe(true);
  });

  test('Set output format and codec', async () => {
    const timeline = new Timeline()
      .addVideo('test-assets/base-video.mp4')
      .setCodec('libx265')
      .setFormat('mp4');
    
    const command = timeline.getCommand('primitives-output/h265-format.mp4');
    expect(command).toContain('-c:v libx265');
    expect(command).toContain('-f mp4');
    
    const result = await cassetteManager.executeCommand(command);
    expect(result.success).toBe(true);
  });

  test('Set bitrate and quality', async () => {
    const timeline = new Timeline()
      .addVideo('test-assets/base-video.mp4')
      .setBitrate(2000)
      .setQuality(23);
    
    const command = timeline.getCommand('primitives-output/bitrate-quality.mp4');
    expect(command).toContain('-b:v 2000k');
    expect(command).toContain('-crf 23');
    
    const result = await cassetteManager.executeCommand(command);
    expect(result.success).toBe(true);
  });

  test('Set preset for encoding speed', async () => {
    const timeline = new Timeline()
      .addVideo('test-assets/base-video.mp4')
      .setPreset('fast');
    
    const command = timeline.getCommand('primitives-output/fast-preset.mp4');
    expect(command).toContain('-preset fast');
    
    const result = await cassetteManager.executeCommand(command);
    expect(result.success).toBe(true);
  });

  test('Timeline method chaining', async () => {
    const timeline = new Timeline()
      .addVideo('test-assets/base-video.mp4')
      .setDuration(8)
      .setResolution(1280, 720)
      .setFrameRate(30)
      .setCodec('libx264')
      .setQuality(25)
      .setPreset('medium')
      .addAudio('test-assets/stereo-audio.mp3', { volume: 0.8 })
      .addText('Chained Operations', {
        position: { x: 'center', y: 'center' },
        style: { fontSize: 36, color: '#ffffff' }
      })
      .addImage('test-assets/logo-image.png', {
        position: { x: '90%', y: '10%' },
        scale: 0.1,
        opacity: 0.8
      })
      .addFilter('brightness=0.1')
      .addFilter('contrast=1.1');
    
    const command = timeline.getCommand('primitives-output/method-chaining.mp4');
    expect(command).toContain('libx264');
    expect(command).toContain('1280:720');
    expect(command).toContain('drawtext');
    expect(command).toContain('overlay');
    
    const result = await cassetteManager.executeCommand(command);
    expect(result.success).toBe(true);
  });

  test('Pipeline composition with immutability', async () => {
    const base = new Timeline()
      .addVideo('test-assets/base-video.mp4');
    
    const withAudio = base.addAudio('test-assets/stereo-audio.mp3');
    const withText = base.addText('Different Branch');
    const withImage = base.addImage('test-assets/test-image.png');
    
    // Each should be different objects
    expect(base).not.toBe(withAudio);
    expect(base).not.toBe(withText);
    expect(base).not.toBe(withImage);
    expect(withAudio).not.toBe(withText);
    
    // Test that they produce different outputs
    const baseCommand = base.getCommand('primitives-output/base-only.mp4');
    const audioCommand = withAudio.getCommand('primitives-output/with-audio.mp4');
    const textCommand = withText.getCommand('primitives-output/with-text.mp4');
    
    expect(baseCommand).not.toContain('test-assets/stereo-audio.mp3');
    expect(audioCommand).toContain('test-assets/stereo-audio.mp3');
    expect(textCommand).toContain('Different Branch');
    
    // All should execute successfully
    const results = await Promise.all([
      cassetteManager.executeCommand(baseCommand),
      cassetteManager.executeCommand(audioCommand),
      cassetteManager.executeCommand(textCommand)
    ]);
    
    results.forEach(result => {
      expect(result.success).toBe(true);
    });
  });
});
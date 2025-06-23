/**
 * Edge Cases and Error Scenarios Runtime Tests
 * Tests boundary conditions, error handling, and unusual scenarios
 */

import { describe, test, expect, beforeAll } from 'bun:test';
import { Timeline, VideoSplicer, PictureInPicture, AudioDucking } from '@jamesaphoenix/media-sdk';
import { EnhancedBunCassetteManager } from '../src/enhanced-cassette-manager';
import { existsSync, mkdirSync } from 'fs';

const cassetteManager = new EnhancedBunCassetteManager('edge-cases-runtime');

beforeAll(async () => {
  // Ensure directories exist
  ['output', 'test-assets'].forEach(dir => {
    if (!existsSync(dir)) {
      mkdirSync(dir, { recursive: true });
    }
  });
  
  // Create edge case test assets
  await createEdgeCaseAssets();
});

async function createEdgeCaseAssets() {
  const assets = [
    {
      name: 'test-assets/very-short.mp4',
      command: 'ffmpeg -f lavfi -i testsrc=duration=0.1:size=320x240:rate=30 -c:v libx264 -preset ultrafast -y'
    },
    {
      name: 'test-assets/very-long.mp4',
      command: 'ffmpeg -f lavfi -i testsrc=duration=300:size=640x480:rate=30 -c:v libx264 -preset ultrafast -y'
    },
    {
      name: 'test-assets/odd-resolution.mp4',
      command: 'ffmpeg -f lavfi -i testsrc=duration=5:size=333x237:rate=30 -c:v libx264 -preset ultrafast -y'
    },
    {
      name: 'test-assets/high-framerate.mp4',
      command: 'ffmpeg -f lavfi -i testsrc=duration=2:size=640x480:rate=120 -c:v libx264 -preset ultrafast -y'
    },
    {
      name: 'test-assets/low-framerate.mp4',
      command: 'ffmpeg -f lavfi -i testsrc=duration=5:size=640x480:rate=1 -c:v libx264 -preset ultrafast -y'
    },
    {
      name: 'test-assets/silent-audio.mp3',
      command: 'ffmpeg -f lavfi -i anullsrc=duration=5 -c:a aac -y'
    },
    {
      name: 'test-assets/mono-audio.mp3',
      command: 'ffmpeg -f lavfi -i sine=frequency=440:duration=3 -ac 1 -c:a aac -y'
    }
  ];
  
  for (const asset of assets) {
    if (!existsSync(asset.name)) {
      console.log(`Creating edge case asset: ${asset.name}`);
      const result = await cassetteManager.executeCommand(`${asset.command} ${asset.name}`);
      if (!result.success) {
        console.warn(`Failed to create ${asset.name}:`, result.stderr);
      }
    }
  }
}

describe('⚠️ Edge Cases - Video Splicing', () => {
  test('Extract segment from very short video', async () => {
    const timeline = new Timeline().addVideo('test-assets/very-short.mp4');
    
    // Try to extract segment longer than the video
    const segment = VideoSplicer.extractSegment(timeline, 0, 1); // 1 second from 0.1s video
    
    const command = segment.getCommand('output/short-extract.mp4');
    const result = await cassetteManager.executeCommand(command);
    
    // Should handle gracefully - FFmpeg will adjust to actual duration
    expect(result.success).toBe(true);
  });

  test('Remove segment that exceeds video duration', async () => {
    const timeline = new Timeline().addVideo('test-assets/very-short.mp4');
    
    // Try to remove more than exists
    const removed = VideoSplicer.removeSegment(timeline, 0.05, 10);
    
    const command = removed.getCommand('output/over-remove.mp4');
    const result = await cassetteManager.executeCommand(command);
    expect(result.success).toBe(true);
  });

  test('Splice with overlapping time segments', async () => {
    const spliced = VideoSplicer.splice({
      segments: [
        { source: 'test-assets/very-short.mp4', startTime: 0, endTime: 0.1 },
        { source: 'test-assets/very-short.mp4', startTime: 0.05, endTime: 0.1 }, // Overlaps
        { source: 'test-assets/very-short.mp4', startTime: 0, endTime: 0.1 }
      ],
      defaultTransitionDuration: 0.01 // Very short transition
    });
    
    const command = spliced.getCommand('output/overlapping-splice.mp4');
    const result = await cassetteManager.executeCommand(command);
    expect(result.success).toBe(true);
  });

  test('Splice with segments in reverse chronological order', async () => {
    const spliced = VideoSplicer.splice({
      segments: [
        { source: 'test-assets/odd-resolution.mp4', startTime: 4, endTime: 5 },
        { source: 'test-assets/odd-resolution.mp4', startTime: 2, endTime: 3 },
        { source: 'test-assets/odd-resolution.mp4', startTime: 0, endTime: 1 }
      ],
      reorderSegments: false // Keep in specified order
    });
    
    const command = spliced.getCommand('output/reverse-order.mp4');
    const result = await cassetteManager.executeCommand(command);
    expect(result.success).toBe(true);
  });

  test('Create highlight reel with zero-duration highlights', async () => {
    const timeline = new Timeline().addVideo('test-assets/odd-resolution.mp4');
    
    const highlights = VideoSplicer.createHighlightReel(timeline, [
      { time: 1, duration: 0, priority: 'high' }, // Zero duration
      { time: 2, duration: 0.001, priority: 'medium' }, // Tiny duration
      { time: 3, duration: 2, priority: 'low' }
    ]);
    
    const command = highlights.getCommand('output/zero-highlights.mp4');
    const result = await cassetteManager.executeCommand(command);
    expect(result.success).toBe(true);
  });
});

describe('🖼️ Edge Cases - Picture-in-Picture', () => {
  test('PiP with mismatched aspect ratios', async () => {
    const timeline = new Timeline().addVideo('test-assets/odd-resolution.mp4'); // 333x237
    
    const pip = PictureInPicture.add(timeline, 'test-assets/high-framerate.mp4', { // 640x480
      position: 'center',
      scale: 0.5,
      maintainAspectRatio: false // Force scaling
    });
    
    const command = pip.getCommand('output/mismatched-aspect.mp4');
    const result = await cassetteManager.executeCommand(command);
    expect(result.success).toBe(true);
  });

  test('PiP with extreme scaling', async () => {
    const timeline = new Timeline().addVideo('test-assets/odd-resolution.mp4');
    
    const tiny = PictureInPicture.add(timeline, 'test-assets/high-framerate.mp4', {
      position: 'top-left',
      scale: 0.01 // Extremely small
    });
    
    const huge = PictureInPicture.add(tiny, 'test-assets/low-framerate.mp4', {
      position: 'bottom-right',
      scale: 2.0, // Larger than main video
      opacity: 0.5
    });
    
    const command = huge.getCommand('output/extreme-scaling.mp4');
    const result = await cassetteManager.executeCommand(command);
    expect(result.success).toBe(true);
  });

  test('Multiple PiP with same source', async () => {
    let timeline = new Timeline().addVideo('test-assets/odd-resolution.mp4');
    
    // Add same source multiple times
    for (let i = 0; i < 4; i++) {
      timeline = PictureInPicture.add(timeline, 'test-assets/very-short.mp4', {
        position: 'custom',
        customPosition: { x: `${i * 20}%`, y: `${i * 20}%` },
        scale: 0.1,
        startTime: i * 0.02, // Staggered start times
        endTime: (i * 0.02) + 0.05
      });
    }
    
    const command = timeline.getCommand('output/same-source-multi.mp4');
    const result = await cassetteManager.executeCommand(command);
    expect(result.success).toBe(true);
  });

  test('PiP with different frame rates', async () => {
    const timeline = new Timeline().addVideo('test-assets/high-framerate.mp4'); // 120fps
    
    const pip = PictureInPicture.add(timeline, 'test-assets/low-framerate.mp4', { // 1fps
      position: 'bottom-right',
      scale: 0.3
    });
    
    const command = pip.getCommand('output/framerate-mismatch.mp4');
    const result = await cassetteManager.executeCommand(command);
    expect(result.success).toBe(true);
  });

  test('PiP positioning outside video bounds', async () => {
    const timeline = new Timeline().addVideo('test-assets/odd-resolution.mp4');
    
    const outside = PictureInPicture.add(timeline, 'test-assets/very-short.mp4', {
      position: 'custom',
      customPosition: { x: -100, y: -100 }, // Negative positions
      scale: 0.5
    });
    
    const command = outside.getCommand('output/outside-bounds.mp4');
    const result = await cassetteManager.executeCommand(command);
    expect(result.success).toBe(true);
  });
});

describe('🎵 Edge Cases - Audio Ducking', () => {
  test('Ducking with silent audio track', async () => {
    const timeline = new Timeline()
      .addVideo('test-assets/odd-resolution.mp4')
      .addAudio('test-assets/silent-audio.mp3') // Silent audio
      .addAudio('test-assets/mono-audio.mp3');
    
    const ducked = AudioDucking.addDucking(timeline, {
      duckingLevel: 0.1,
      detectionMode: 'manual',
      duckingRegions: [{ start: 0, end: 3 }]
    });
    
    const command = ducked.getCommand('output/silent-ducking.mp4');
    const result = await cassetteManager.executeCommand(command);
    expect(result.success).toBe(true);
  });

  test('Ducking with mono and stereo audio mix', async () => {
    const timeline = new Timeline()
      .addVideo('test-assets/odd-resolution.mp4')
      .addAudio('test-assets/mono-audio.mp3') // Mono
      .addAudio('test-assets/silent-audio.mp3'); // Stereo (default)
    
    const ducked = AudioDucking.addDucking(timeline, {
      duckingLevel: 0.3,
      detectionMode: 'sidechain'
    });
    
    const command = ducked.getCommand('output/mono-stereo-duck.mp4');
    const result = await cassetteManager.executeCommand(command);
    expect(result.success).toBe(true);
  });

  test('Overlapping ducking regions', async () => {
    const timeline = new Timeline()
      .addVideo('test-assets/odd-resolution.mp4')
      .addAudio('test-assets/mono-audio.mp3')
      .addAudio('test-assets/silent-audio.mp3');
    
    const overlapping = AudioDucking.duckAtRegions(timeline, [
      { start: 0, end: 2 },
      { start: 1, end: 3 }, // Overlaps with first
      { start: 2.5, end: 4 } // Overlaps with second
    ]);
    
    const command = overlapping.getCommand('output/overlapping-duck.mp4');
    const result = await cassetteManager.executeCommand(command);
    expect(result.success).toBe(true);
  });

  test('Ducking with extreme values', async () => {
    const timeline = new Timeline()
      .addVideo('test-assets/odd-resolution.mp4')
      .addAudio('test-assets/mono-audio.mp3');
    
    const extreme = AudioDucking.addDucking(timeline, {
      duckingLevel: 0.001, // Nearly mute
      fadeInTime: 0.001, // Extremely fast
      fadeOutTime: 5.0, // Very slow
      detectionThreshold: -60 // Very sensitive
    });
    
    const command = extreme.getCommand('output/extreme-ducking.mp4');
    const result = await cassetteManager.executeCommand(command);
    expect(result.success).toBe(true);
  });
});

describe('🔄 Complex Edge Cases', () => {
  test('Chain all operations with edge case inputs', async () => {
    // Start with odd resolution video
    let timeline = new Timeline().addVideo('test-assets/odd-resolution.mp4');
    
    // Extract a tiny segment
    timeline = VideoSplicer.extractSegment(timeline, 1, 1.1);
    
    // Add PiP with extreme settings
    timeline = PictureInPicture.add(timeline, 'test-assets/very-short.mp4', {
      position: 'custom',
      customPosition: { x: '90%', y: '90%' },
      scale: 0.05,
      opacity: 0.1,
      rotation: 45
    });
    
    // Add problematic audio
    timeline = timeline
      .addAudio('test-assets/silent-audio.mp3', { volume: 0.01 })
      .addAudio('test-assets/mono-audio.mp3', { volume: 2.0 }); // Loud
    
    // Apply ducking to extreme ranges
    timeline = AudioDucking.addDucking(timeline, {
      duckingLevel: 0.001,
      duckingRegions: [{ start: 0, end: 10 }] // Longer than video
    });
    
    const command = timeline.getCommand('output/everything-edge.mp4');
    const result = await cassetteManager.executeCommand(command);
    expect(result.success).toBe(true);
  });

  test('Invalid file references with graceful handling', async () => {
    // Use non-existent files - should be handled by Timeline/FFmpeg
    const timeline = new Timeline()
      .addVideo('test-assets/nonexistent.mp4')
      .addAudio('test-assets/missing.mp3');
    
    const command = timeline.getCommand('output/invalid-refs.mp4');
    // This should fail gracefully
    const result = await cassetteManager.executeCommand(command);
    
    // We expect this to fail, but not crash
    expect(result.success).toBe(false);
    expect(result.stderr).toContain('No such file');
  });

  test('Extremely long filter chain', async () => {
    let timeline = new Timeline().addVideo('test-assets/odd-resolution.mp4');
    
    // Add many filters to test filter chain limits
    const filters = [
      'fade=in:duration=0.1',
      'fade=out:duration=0.1',
      'brightness=0.1',
      'contrast=1.1',
      'saturation=1.1',
      'hue=s=0.1',
      'eq=gamma=1.1',
      'unsharp=5:5:1.0',
      'noise=alls=1:allf=t',
      'drawbox=x=10:y=10:w=50:h=50:color=red@0.5'
    ];
    
    filters.forEach(filter => {
      timeline = timeline.addFilter(filter);
    });
    
    const command = timeline.getCommand('output/long-filter-chain.mp4');
    const result = await cassetteManager.executeCommand(command);
    expect(result.success).toBe(true);
  });

  test('Unicode and special characters in text', async () => {
    const timeline = new Timeline()
      .addVideo('test-assets/odd-resolution.mp4')
      .addText('🎬🎥🎞️ Unicode: αβγ δεζ ñáéíóú', {
        position: { x: 'center', y: 'center' },
        style: { fontSize: 24, color: '#ffffff' }
      })
      .addText('Special: "quotes" & <brackets> | pipes', {
        position: { x: 'center', y: '70%' },
        style: { fontSize: 20, color: '#ffff00' }
      });
    
    const command = timeline.getCommand('output/unicode-text.mp4');
    const result = await cassetteManager.executeCommand(command);
    expect(result.success).toBe(true);
  });

  test('Maximum timeline complexity', async () => {
    // Create a very complex timeline to test limits
    let timeline = new Timeline().addVideo('test-assets/odd-resolution.mp4');
    
    // Multiple video layers through splicing
    const spliced = VideoSplicer.splice({
      segments: [
        { source: 'test-assets/odd-resolution.mp4', startTime: 0, endTime: 1 },
        { source: 'test-assets/very-short.mp4', startTime: 0, endTime: 0.1 },
        { source: 'test-assets/high-framerate.mp4', startTime: 0, endTime: 0.5 }
      ]
    });
    
    // Multiple PiP layers
    let complex = spliced;
    for (let i = 0; i < 3; i++) {
      complex = PictureInPicture.add(complex, 'test-assets/low-framerate.mp4', {
        position: 'custom',
        customPosition: { x: `${i * 30}%`, y: `${i * 25}%` },
        scale: 0.1,
        startTime: i * 0.5,
        endTime: (i * 0.5) + 1
      });
    }
    
    // Multiple audio tracks
    complex = complex
      .addAudio('test-assets/mono-audio.mp3', { volume: 0.8 })
      .addAudio('test-assets/silent-audio.mp3', { volume: 0.3 })
      .addAudio('test-assets/mono-audio.mp3', { volume: 0.5, startTime: 1 });
    
    // Multiple ducking regions
    complex = AudioDucking.duckAtRegions(complex, [
      { start: 0, end: 1 },
      { start: 1.5, end: 2.5 },
      { start: 3, end: 4 }
    ]);
    
    // Multiple text overlays
    complex = complex
      .addText('Layer 1', { position: { x: '10%', y: '10%' }, style: { fontSize: 16 } })
      .addText('Layer 2', { position: { x: '50%', y: '10%' }, style: { fontSize: 16 } })
      .addText('Layer 3', { position: { x: '10%', y: '50%' }, style: { fontSize: 16 } })
      .addText('Layer 4', { position: { x: '50%', y: '50%' }, style: { fontSize: 16 } });
    
    const command = complex.getCommand('output/maximum-complexity.mp4');
    const result = await cassetteManager.executeCommand(command);
    expect(result.success).toBe(true);
  });
});
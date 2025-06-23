/**
 * Comprehensive Runtime Tests for New Features
 * Tests video splicing, picture-in-picture, and audio ducking with real execution
 */

import { describe, test, expect, beforeAll } from 'bun:test';
import { Timeline, VideoSplicer, PictureInPicture, AudioDucking } from '@jamesaphoenix/media-sdk';
import { EnhancedBunCassetteManager } from '../src/enhanced-cassette-manager';
import { getVisionCostControl } from '../src/vision-cost-control';
import { existsSync, mkdirSync, writeFileSync } from 'fs';
import { join } from 'path';

const cassetteManager = new EnhancedBunCassetteManager('new-features-runtime');
const visionControl = getVisionCostControl();

// Test asset paths
const TEST_ASSETS = {
  video1: 'test-assets/sample1.mp4',
  video2: 'test-assets/sample2.mp4',
  reaction: 'test-assets/reaction.mp4',
  music: 'test-assets/background.mp3',
  voice: 'test-assets/narration.mp3',
  image: 'test-assets/logo.png'
};

beforeAll(async () => {
  // Ensure output directories exist
  ['output', 'test-assets', 'cassettes'].forEach(dir => {
    if (!existsSync(dir)) {
      mkdirSync(dir, { recursive: true });
    }
  });
  
  // Create minimal test assets if they don't exist
  await createTestAssets();
  
  console.log('🎬 Test environment ready');
});

/**
 * Create minimal test assets for testing
 */
async function createTestAssets() {
  // Create small test videos using FFmpeg
  const testVideos = [
    {
      name: TEST_ASSETS.video1,
      command: 'ffmpeg -f lavfi -i testsrc=duration=5:size=1920x1080:rate=30 -c:v libx264 -preset ultrafast -y'
    },
    {
      name: TEST_ASSETS.video2,
      command: 'ffmpeg -f lavfi -i testsrc2=duration=3:size=1280x720:rate=30 -c:v libx264 -preset ultrafast -y'
    },
    {
      name: TEST_ASSETS.reaction,
      command: 'ffmpeg -f lavfi -i testsrc=duration=10:size=640x480:rate=30 -c:v libx264 -preset ultrafast -y'
    }
  ];
  
  for (const video of testVideos) {
    if (!existsSync(video.name)) {
      const fullCommand = `${video.command} ${video.name}`;
      console.log(`Creating test asset: ${video.name}`);
      const result = await cassetteManager.executeCommand(fullCommand);
      if (!result.success) {
        console.warn(`Failed to create ${video.name}:`, result.stderr);
      }
    }
  }
  
  // Create test audio files
  const testAudioFiles = [
    {
      name: TEST_ASSETS.music,
      command: 'ffmpeg -f lavfi -i sine=frequency=440:duration=10 -c:a aac -y'
    },
    {
      name: TEST_ASSETS.voice,
      command: 'ffmpeg -f lavfi -i sine=frequency=880:duration=5 -c:a aac -y'
    }
  ];
  
  for (const audio of testAudioFiles) {
    if (!existsSync(audio.name)) {
      const fullCommand = `${audio.command} ${audio.name}`;
      console.log(`Creating test audio: ${audio.name}`);
      const result = await cassetteManager.executeCommand(fullCommand);
      if (!result.success) {
        console.warn(`Failed to create ${audio.name}:`, result.stderr);
      }
    }
  }
  
  // Create test image
  if (!existsSync(TEST_ASSETS.image)) {
    const command = `ffmpeg -f lavfi -i color=red:size=200x200:duration=1 -frames:v 1 -y ${TEST_ASSETS.image}`;
    await cassetteManager.executeCommand(command);
  }
}

describe('🎬 Video Splicing Runtime Tests', () => {
  test('Extract video segment with real execution', async () => {
    const timeline = new Timeline().addVideo(TEST_ASSETS.video1);
    const segment = VideoSplicer.extractSegment(timeline, 1, 3);
    
    const command = segment.getCommand('output/extracted-segment.mp4');
    expect(command).toContain('ffmpeg');
    expect(command).toContain('-ss 1');
    expect(command).toContain('-t 2');
    
    const result = await cassetteManager.executeCommand(command);
    expect(result.success).toBe(true);
    expect(existsSync('output/extracted-segment.mp4')).toBe(true);
  });

  test('Remove segment from video', async () => {
    const timeline = new Timeline().addVideo(TEST_ASSETS.video1);
    const edited = VideoSplicer.removeSegment(timeline, 1, 3);
    
    const command = edited.getCommand('output/segment-removed.mp4');
    const result = await cassetteManager.executeCommand(command);
    expect(result.success).toBe(true);
    expect(existsSync('output/segment-removed.mp4')).toBe(true);
  });

  test('Splice multiple video segments with transitions', async () => {
    const spliced = VideoSplicer.splice({
      segments: [
        { source: TEST_ASSETS.video1, startTime: 0, endTime: 2, transition: 'fade' },
        { source: TEST_ASSETS.video2, startTime: 0, endTime: 2, transition: 'dissolve' },
        { source: TEST_ASSETS.video1, startTime: 3, endTime: 5, transition: 'cut' }
      ],
      defaultTransitionDuration: 0.5,
      maintainAudio: true
    });
    
    const command = spliced.getCommand('output/spliced-video.mp4');
    expect(command).toContain('filter_complex');
    
    const result = await cassetteManager.executeCommand(command);
    expect(result.success).toBe(true);
    expect(existsSync('output/spliced-video.mp4')).toBe(true);
  });

  test('Create highlight reel from multiple sources', async () => {
    const timeline = new Timeline().addVideo(TEST_ASSETS.video1);
    
    const highlights = VideoSplicer.createHighlightReel(timeline, [
      { time: 0, duration: 1, priority: 'high' },
      { time: 2, duration: 1.5, priority: 'medium' },
      { time: 4, duration: 1, priority: 'high' }
    ], {
      maxDuration: 5,
      sortByPriority: true
    });
    
    const command = highlights.getCommand('output/highlight-reel.mp4');
    const result = await cassetteManager.executeCommand(command);
    expect(result.success).toBe(true);
  });
});

describe('🖼️ Picture-in-Picture Runtime Tests', () => {
  test('Add basic PiP overlay', async () => {
    const timeline = new Timeline().addVideo(TEST_ASSETS.video1);
    
    const withPiP = PictureInPicture.add(timeline, TEST_ASSETS.reaction, {
      position: 'bottom-right',
      scale: 0.25,
      borderRadius: 10,
      shadow: true,
      animation: 'slide-in'
    });
    
    const command = withPiP.getCommand('output/basic-pip.mp4');
    expect(command).toContain('overlay');
    expect(command).toContain('scale');
    
    const result = await cassetteManager.executeCommand(command);
    expect(result.success).toBe(true);
    expect(existsSync('output/basic-pip.mp4')).toBe(true);
  });

  test('Multiple PiP videos in grid layout', async () => {
    const timeline = new Timeline().addVideo(TEST_ASSETS.video1);
    
    const multiPiP = PictureInPicture.addMultiple(timeline, {
      videos: [
        { source: TEST_ASSETS.video2, options: { position: 'top-left', scale: 0.2 } },
        { source: TEST_ASSETS.reaction, options: { position: 'top-right', scale: 0.2 } },
        { source: TEST_ASSETS.video1, options: { position: 'bottom-left', scale: 0.2 } }
      ],
      layout: 'grid'
    });
    
    const command = multiPiP.getCommand('output/multi-pip-grid.mp4');
    const result = await cassetteManager.executeCommand(command);
    expect(result.success).toBe(true);
  });

  test('Reaction video layout with circular PiP', async () => {
    const reaction = PictureInPicture.createReactionLayout(
      TEST_ASSETS.video1,
      TEST_ASSETS.reaction,
      {
        reactionPosition: 'bottom-right',
        reactionScale: 0.3,
        reactionShape: 'circle'
      }
    );
    
    const command = reaction.getCommand('output/reaction-layout.mp4');
    expect(command).toContain('geq'); // Circular mask
    
    const result = await cassetteManager.executeCommand(command);
    expect(result.success).toBe(true);
  });

  test('Webcam overlay with effects', async () => {
    const timeline = new Timeline().addVideo(TEST_ASSETS.video1);
    
    const webcam = PictureInPicture.createWebcamOverlay(timeline, TEST_ASSETS.reaction, {
      shape: 'circle',
      position: 'bottom-left',
      scale: 0.2,
      pulseEffect: true
    });
    
    const command = webcam.getCommand('output/webcam-overlay.mp4');
    const result = await cassetteManager.executeCommand(command);
    expect(result.success).toBe(true);
  });

  test('Animated PiP with custom positioning', async () => {
    const timeline = new Timeline().addVideo(TEST_ASSETS.video1);
    
    const animated = PictureInPicture.add(timeline, TEST_ASSETS.reaction, {
      position: 'custom',
      customPosition: { x: '10%', y: '10%' },
      scale: 0.3,
      animation: 'bounce-in',
      animationDuration: 1.0,
      opacity: 0.9,
      rotation: 5
    });
    
    const command = animated.getCommand('output/animated-pip.mp4');
    expect(command).toContain('overlay=');
    
    const result = await cassetteManager.executeCommand(command);
    expect(result.success).toBe(true);
  });
});

describe('🎵 Audio Ducking Runtime Tests', () => {
  test('Basic audio ducking with background music', async () => {
    const timeline = new Timeline()
      .addVideo(TEST_ASSETS.video1)
      .addAudio(TEST_ASSETS.music, { volume: 0.8 })
      .addAudio(TEST_ASSETS.voice);
    
    const ducked = AudioDucking.addDucking(timeline, {
      duckingLevel: 0.3,
      fadeInTime: 0.5,
      fadeOutTime: 0.5,
      detectionMode: 'manual',
      duckingRegions: [
        { start: 1, end: 4 }
      ]
    });
    
    const command = ducked.getCommand('output/ducked-audio.mp4');
    expect(command).toContain('volume=');
    
    const result = await cassetteManager.executeCommand(command);
    expect(result.success).toBe(true);
    expect(existsSync('output/ducked-audio.mp4')).toBe(true);
  });

  test('Sidechain compression ducking', async () => {
    const timeline = new Timeline()
      .addVideo(TEST_ASSETS.video1)
      .addAudio(TEST_ASSETS.music)
      .addAudio(TEST_ASSETS.voice);
    
    const sidechain = AudioDucking.addDucking(timeline, {
      detectionMode: 'sidechain',
      duckingLevel: 0.2,
      compressorRatio: 4,
      fadeInTime: 0.1,
      fadeOutTime: 0.3
    });
    
    const command = sidechain.getCommand('output/sidechain-ducking.mp4');
    expect(command).toContain('sidechaincompress');
    
    const result = await cassetteManager.executeCommand(command);
    expect(result.success).toBe(true);
  });

  test('Create dialogue mix with ducking', async () => {
    const dialogue = AudioDucking.createDialogueMix(new Timeline().addVideo(TEST_ASSETS.video1), {
      dialogueTrack: TEST_ASSETS.voice,
      musicTrack: TEST_ASSETS.music,
      dialogueBoost: 1.5,
      musicDuckLevel: 0.2
    });
    
    const command = dialogue.getCommand('output/dialogue-mix.mp4');
    const result = await cassetteManager.executeCommand(command);
    expect(result.success).toBe(true);
  });

  test('Podcast mix with multiple segments', async () => {
    const podcast = AudioDucking.createPodcastMix(new Timeline().addVideo(TEST_ASSETS.video1), {
      hosts: [TEST_ASSETS.voice],
      music: TEST_ASSETS.music,
      musicSegments: [
        { start: 0, end: 2 },   // Intro
        { start: 8, end: 10 }   // Outro
      ],
      introOutroDucking: 0.6,
      normalDucking: 0.15
    });
    
    const command = podcast.getCommand('output/podcast-mix.mp4');
    const result = await cassetteManager.executeCommand(command);
    expect(result.success).toBe(true);
  });

  test('Music bed with ducking points', async () => {
    const musicBed = AudioDucking.createMusicBed(new Timeline().addVideo(TEST_ASSETS.video1), {
      music: TEST_ASSETS.music,
      duckingPoints: [
        { time: 1, duration: 2, level: 0.3, reason: 'voiceover' },
        { time: 6, duration: 1.5, level: 0.4, reason: 'announcement' }
      ],
      fadeIn: 1,
      fadeOut: 2,
      baseVolume: 0.7
    });
    
    const command = musicBed.getCommand('output/music-bed.mp4');
    const result = await cassetteManager.executeCommand(command);
    expect(result.success).toBe(true);
  });
});

describe('🔗 Complex Composition Tests', () => {
  test('TikTok-style reaction video with all features', async () => {
    const tiktokReaction = new Timeline()
      // Main content
      .addVideo(TEST_ASSETS.video1)
      .setAspectRatio('9:16')
      .setDuration(15)
      
      // Add reaction PiP
      .pipe(t => PictureInPicture.add(t, TEST_ASSETS.reaction, {
        position: 'bottom-right',
        scale: 0.3,
        borderRadius: 999, // Circle
        shadow: true,
        animation: 'zoom-in'
      }))
      
      // Add background music with ducking
      .addAudio(TEST_ASSETS.music, { volume: 0.6 })
      .pipe(t => AudioDucking.addDucking(t, {
        duckingLevel: 0.2,
        fadeInTime: 0.3,
        fadeOutTime: 0.5,
        duckingRegions: [{ start: 2, end: 8 }]
      }))
      
      // Add captions
      .addText('OMG! This is amazing! 😱', {
        position: { x: 'center', y: '20%' },
        style: { 
          fontSize: 48, 
          color: '#ffffff',
          fontFamily: 'Arial Bold'
        },
        startTime: 1,
        duration: 3
      })
      
      // Add watermark
      .addImage(TEST_ASSETS.image, {
        position: { x: 10, y: 10 },
        scale: 0.1,
        opacity: 0.7
      });
    
    const command = tiktokReaction.getCommand('output/tiktok-reaction.mp4');
    expect(command).toContain('filter_complex');
    expect(command).toContain('overlay');
    expect(command).toContain('drawtext');
    
    const result = await cassetteManager.executeCommand(command);
    expect(result.success).toBe(true);
    expect(existsSync('output/tiktok-reaction.mp4')).toBe(true);
    
    // Verify video properties
    const probeCommand = `ffprobe -v quiet -print_format json -show_format -show_streams output/tiktok-reaction.mp4`;
    const probeResult = await cassetteManager.executeCommand(probeCommand);
    expect(probeResult.success).toBe(true);
  });

  test('Multi-segment highlight reel with transitions', async () => {
    const highlights = VideoSplicer.splice({
      segments: [
        { source: TEST_ASSETS.video1, startTime: 0, endTime: 2, transition: 'fade' },
        { source: TEST_ASSETS.video2, startTime: 0, endTime: 1.5, transition: 'dissolve' },
        { source: TEST_ASSETS.reaction, startTime: 2, endTime: 4, transition: 'wipe' }
      ],
      defaultTransitionDuration: 0.5
    })
    .addText('BEST MOMENTS', {
      position: { x: 'center', y: 'center' },
      style: { fontSize: 72, color: '#FFD700' },
      startTime: 0,
      duration: 2
    })
    .addAudio(TEST_ASSETS.music, { volume: 0.8 })
    .pipe(t => AudioDucking.addDucking(t, {
      duckingLevel: 0.4,
      duckingRegions: [{ start: 0, end: 2 }]
    }));
    
    const command = highlights.getCommand('output/highlight-montage.mp4');
    const result = await cassetteManager.executeCommand(command);
    expect(result.success).toBe(true);
  });

  test('Picture-in-picture with multiple layers and effects', async () => {
    const complex = new Timeline()
      .addVideo(TEST_ASSETS.video1)
      
      // Main PiP
      .pipe(t => PictureInPicture.add(t, TEST_ASSETS.reaction, {
        position: 'top-right',
        scale: 0.25,
        borderRadius: 15,
        shadow: true
      }))
      
      // Secondary PiP
      .pipe(t => PictureInPicture.add(t, TEST_ASSETS.video2, {
        position: 'bottom-left',
        scale: 0.2,
        opacity: 0.8,
        animation: 'slide-in'
      }))
      
      // Logo overlay
      .addImage(TEST_ASSETS.image, {
        position: { x: 'center', y: 50 },
        scale: 0.15,
        opacity: 0.9
      })
      
      // Audio mix
      .addAudio(TEST_ASSETS.music, { volume: 0.5 })
      .addAudio(TEST_ASSETS.voice, { volume: 1.0 })
      .pipe(t => AudioDucking.addDucking(t, {
        duckingLevel: 0.25,
        fadeInTime: 0.2,
        fadeOutTime: 0.8,
        duckingRegions: [{ start: 1, end: 4 }]
      }));
    
    const command = complex.getCommand('output/complex-composition.mp4');
    const result = await cassetteManager.executeCommand(command);
    expect(result.success).toBe(true);
  });
});

describe('⚡ Performance & Edge Cases', () => {
  test('Large number of PiP overlays', async () => {
    let timeline = new Timeline().addVideo(TEST_ASSETS.video1);
    
    // Add 5 PiP overlays
    for (let i = 0; i < 5; i++) {
      timeline = PictureInPicture.add(timeline, TEST_ASSETS.reaction, {
        position: 'custom',
        customPosition: { x: `${i * 15}%`, y: `${i * 10}%` },
        scale: 0.1,
        opacity: 0.7
      });
    }
    
    const command = timeline.getCommand('output/many-pip.mp4');
    const result = await cassetteManager.executeCommand(command);
    expect(result.success).toBe(true);
  });

  test('Complex audio ducking with multiple tracks', async () => {
    const timeline = new Timeline()
      .addVideo(TEST_ASSETS.video1)
      .addAudio(TEST_ASSETS.music, { volume: 0.8 })
      .addAudio(TEST_ASSETS.voice, { volume: 1.0 })
      .addAudio(TEST_ASSETS.music, { volume: 0.3, startTime: 3 }); // Second music track
    
    const ducked = AudioDucking.addDucking(timeline, {
      duckingLevel: 0.2,
      fadeInTime: 0.1,
      fadeOutTime: 0.3,
      duckingRegions: [
        { start: 1, end: 2 },
        { start: 4, end: 6 }
      ]
    });
    
    const command = ducked.getCommand('output/multi-track-ducking.mp4');
    const result = await cassetteManager.executeCommand(command);
    expect(result.success).toBe(true);
  });

  test('Video splicing with very short segments', async () => {
    const microSpliced = VideoSplicer.splice({
      segments: [
        { source: TEST_ASSETS.video1, startTime: 0, endTime: 0.5 },
        { source: TEST_ASSETS.video2, startTime: 0, endTime: 0.3 },
        { source: TEST_ASSETS.video1, startTime: 2, endTime: 2.7 }
      ],
      defaultTransitionDuration: 0.1
    });
    
    const command = microSpliced.getCommand('output/micro-segments.mp4');
    const result = await cassetteManager.executeCommand(command);
    expect(result.success).toBe(true);
  });

  test('Error handling - invalid audio ducking regions', async () => {
    const timeline = new Timeline()
      .addVideo(TEST_ASSETS.video1)
      .addAudio(TEST_ASSETS.music);
    
    // Test with overlapping regions
    const overlapping = AudioDucking.duckAtRegions(timeline, [
      { start: 1, end: 3 },
      { start: 2, end: 4 } // Overlaps with previous
    ]);
    
    const command = overlapping.getCommand('output/overlapping-ducking.mp4');
    const result = await cassetteManager.executeCommand(command);
    // Should succeed even with overlapping regions
    expect(result.success).toBe(true);
  });
});
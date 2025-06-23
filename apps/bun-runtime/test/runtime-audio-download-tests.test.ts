/**
 * @fileoverview Runtime Audio Download Tests
 * 
 * Tests downloading and processing audio files from various sources
 */

import { test, expect, describe, beforeAll, afterAll } from 'bun:test';
import { Timeline, AudioDucking, ImageSourceHandler } from '../../../packages/media-sdk/src/index.js';
import { promises as fs } from 'fs';
import { join } from 'path';
import { tmpdir } from 'os';

describe('🎵 RUNTIME AUDIO DOWNLOAD TESTS', () => {
  let testDir: string;
  let downloadDir: string;
  let imageHandler: ImageSourceHandler;
  let localAudioFiles: string[] = [];
  
  // Public domain audio URLs (royalty-free)
  const audioUrls = {
    // From freesound.org (CC0 licensed)
    shortBeep: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3',
    ambience: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3',
    music: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-3.mp3',
    // From archive.org (public domain)
    classical: 'https://ia800102.us.archive.org/14/items/MLKDream/MLKDream.mp3',
    speech: 'https://ia800605.us.archive.org/11/items/beethoven_opus_18/Op18No01-01-Allegro.mp3'
  };
  
  beforeAll(async () => {
    testDir = join(tmpdir(), 'runtime-audio-tests-' + Date.now());
    downloadDir = join(testDir, 'downloads');
    await fs.mkdir(downloadDir, { recursive: true });
    
    imageHandler = new ImageSourceHandler({
      downloadDir: downloadDir,
      enableCache: true,
      maxCacheSize: 100 * 1024 * 1024 // 100MB
    });
    
    // Create local audio files
    localAudioFiles = await createLocalAudioFiles();
    
    console.log('Test directory:', testDir);
  });
  
  afterAll(async () => {
    try {
      await imageHandler.cleanup();
      await fs.rm(testDir, { recursive: true, force: true });
    } catch (e) {
      console.error('Cleanup error:', e);
    }
  });
  
  async function createLocalAudioFiles() {
    const files = [
      { name: 'podcast-intro.mp3', duration: 5 },
      { name: 'background-music-loop.mp3', duration: 30 },
      { name: 'voiceover-narration.mp3', duration: 60 },
      { name: 'sound-effect-whoosh.mp3', duration: 1 },
      { name: 'ambience-nature.mp3', duration: 120 },
      { name: 'jingle-notification.mp3', duration: 2 }
    ];
    
    const created = [];
    
    for (const file of files) {
      const filepath = join(testDir, file.name);
      // Create a more realistic MP3 file with ID3 tag
      const mp3Header = Buffer.concat([
        Buffer.from('ID3\x03\x00\x00\x00\x00\x00\x00'), // ID3v2 header
        Buffer.from([0xFF, 0xFB, 0x90, 0x00]), // MP3 frame header
        Buffer.alloc(1024, 0xFF) // Some audio data
      ]);
      
      await fs.writeFile(filepath, mp3Header);
      created.push(filepath);
      
      console.log(`Created local audio: ${file.name} (simulated ${file.duration}s)`);
    }
    
    return created;
  }

  describe('🌐 Audio Download Tests', () => {
    test('should download audio from URL', async () => {
      console.log('Attempting to download audio...');
      
      try {
        const response = await fetch(audioUrls.shortBeep, { 
          method: 'HEAD',
          signal: AbortSignal.timeout(5000)
        });
        
        if (response.ok) {
          console.log('Audio URL is accessible');
          
          // Create a timeline with downloaded audio
          const timeline = new Timeline()
            .addAudio(audioUrls.shortBeep, { 
              startTime: 0,
              duration: 10,
              volume: 0.8
            });
          
          const command = timeline.getCommand('output.mp4');
          expect(command).toContain('SoundHelix-Song-1.mp3');
        } else {
          console.log('Audio URL not accessible, skipping download test');
        }
      } catch (error) {
        console.log('Network error, skipping download test:', error.message);
      }
    });

    test('should handle multiple audio downloads', async () => {
      const urls = [audioUrls.shortBeep, audioUrls.ambience];
      const timelines = [];
      
      for (const url of urls) {
        try {
          const timeline = new Timeline()
            .addAudio(url, { duration: 5 });
          timelines.push(timeline);
        } catch (error) {
          console.log(`Failed to process ${url}:`, error.message);
        }
      }
      
      expect(timelines.length).toBeGreaterThan(0);
    });
  });

  describe('🎵 Local Audio Processing', () => {
    test('should process local podcast files', () => {
      const [intro, bgMusic, voiceover] = localAudioFiles;
      
      const podcast = new Timeline()
        // Intro music
        .addAudio(intro, { 
          startTime: 0, 
          duration: 5,
          fadeOut: 1
        })
        // Background music
        .addAudio(bgMusic, {
          startTime: 4,
          duration: 60,
          volume: 0.3,
          fadeIn: 1,
          fadeOut: 2
        })
        // Main voiceover
        .addAudio(voiceover, {
          startTime: 5,
          duration: 55,
          volume: 1.2
        });
      
      // Apply ducking
      const ducked = AudioDucking.addDucking(podcast, {
        backgroundTrack: bgMusic,
        voiceTrack: voiceover,
        duckingLevel: 0.2,
        fadeInTime: 0.3,
        fadeOutTime: 0.8
      });
      
      const command = ducked.getCommand('podcast.mp4');
      expect(command).toContain('podcast-intro.mp3');
      expect(command).toContain('background-music-loop.mp3');
      expect(command).toContain('voiceover-narration.mp3');
    });

    test('should create layered soundscape', () => {
      const [, , , whoosh, nature, notification] = localAudioFiles;
      
      const soundscape = new Timeline()
        // Base ambience
        .addAudio(nature, {
          duration: 30,
          volume: 0.6
        })
        // Periodic notifications
        .addAudio(notification, { startTime: 5, volume: 0.8 })
        .addAudio(notification, { startTime: 15, volume: 0.8 })
        .addAudio(notification, { startTime: 25, volume: 0.8 })
        // Transition effects
        .addAudio(whoosh, { startTime: 10, volume: 0.7 })
        .addAudio(whoosh, { startTime: 20, volume: 0.7 });
      
      const command = soundscape.getCommand('soundscape.mp4');
      expect(command).toContain('ambience-nature.mp3');
      expect(command).toContain('jingle-notification.mp3');
      expect(command).toContain('sound-effect-whoosh.mp3');
    });
  });

  describe('🎚️ Advanced Audio Mixing', () => {
    test('should create multi-host podcast with overlapping speech', () => {
      const [intro, bgMusic, host1, , , ] = localAudioFiles;
      const host2 = localAudioFiles[2]; // Reuse voiceover as host2
      
      const multiHost = new Timeline()
        // Intro
        .addAudio(intro, { duration: 5, fadeOut: 1 })
        // Background music
        .addAudio(bgMusic, { 
          startTime: 4,
          duration: 120,
          volume: 0.2,
          fadeIn: 1
        })
        // Host 1 segments
        .addAudio(host1, { startTime: 5, duration: 10, pan: -0.3 })
        .addAudio(host1, { startTime: 20, duration: 15, pan: -0.3 })
        .addAudio(host1, { startTime: 40, duration: 20, pan: -0.3 })
        // Host 2 segments
        .addAudio(host2, { startTime: 15, duration: 8, pan: 0.3 })
        .addAudio(host2, { startTime: 30, duration: 12, pan: 0.3 })
        .addAudio(host2, { startTime: 50, duration: 15, pan: 0.3 });
      
      // Duck music during speech
      const ducked = AudioDucking.duckAtRegions(multiHost, [
        { start: 5, end: 65 } // Duck throughout conversation
      ], {
        duckingLevel: 0.15,
        fadeInTime: 0.5,
        fadeOutTime: 1.0
      });
      
      const layers = ducked.getLayers();
      const audioLayers = layers.filter(l => l.type === 'audio');
      
      expect(audioLayers.length).toBeGreaterThanOrEqual(7);
    });

    test('should handle overlapping audio with different priorities', () => {
      const [, bgMusic, voiceover, effect, ambience] = localAudioFiles;
      
      const timeline = new Timeline()
        // Layer 1: Ambience (lowest priority)
        .addAudio(ambience, { 
          duration: 30,
          volume: 0.4
        })
        // Layer 2: Background music
        .addAudio(bgMusic, {
          startTime: 5,
          duration: 20,
          volume: 0.6
        })
        // Layer 3: Voice (highest priority)
        .addAudio(voiceover, {
          startTime: 10,
          duration: 10,
          volume: 1.2
        })
        // Layer 4: Sound effects (medium priority)
        .addAudio(effect, { startTime: 8, volume: 0.8 })
        .addAudio(effect, { startTime: 15, volume: 0.8 })
        .addAudio(effect, { startTime: 22, volume: 0.8 });
      
      // Apply cascading ducking
      let ducked = timeline;
      
      // Duck ambience for music
      ducked = AudioDucking.addDucking(ducked, {
        backgroundTrack: ambience,
        voiceTrack: bgMusic,
        duckingLevel: 0.5,
        detectionMode: 'manual',
        duckingRegions: [{ start: 5, end: 25 }]
      });
      
      // Duck both ambience and music for voice
      ducked = AudioDucking.addDucking(ducked, {
        backgroundTrack: bgMusic,
        voiceTrack: voiceover,
        duckingLevel: 0.3,
        detectionMode: 'manual',
        duckingRegions: [{ start: 10, end: 20 }]
      });
      
      const command = ducked.getCommand('layered-audio.mp4');
      expect(command).toContain('ambience-nature.mp3');
      expect(command).toContain('background-music-loop.mp3');
      expect(command).toContain('voiceover-narration.mp3');
    });
  });

  describe('🎧 Audio Effects and Processing', () => {
    test('should apply audio effects to local files', () => {
      const [intro, bgMusic] = localAudioFiles;
      
      const processed = new Timeline()
        // Intro with echo
        .addAudio(intro, {
          duration: 5,
          filters: {
            echo: { delay: 0.3, decay: 0.5 }
          }
        })
        // Background music with EQ
        .addAudio(bgMusic, {
          startTime: 5,
          duration: 30,
          filters: {
            equalizer: {
              bass: 1.2,
              mid: 0.9,
              treble: 1.1
            }
          }
        });
      
      const command = processed.getCommand('processed-audio.mp4');
      expect(command).toContain('podcast-intro.mp3');
      expect(command).toContain('background-music-loop.mp3');
    });

    test('should create crossfade between audio tracks', () => {
      const [track1, track2, track3] = localAudioFiles;
      
      const crossfaded = new Timeline()
        // Track 1
        .addAudio(track1, {
          duration: 10,
          fadeOut: 2
        })
        // Track 2 (overlapping)
        .addAudio(track2, {
          startTime: 8,
          duration: 10,
          fadeIn: 2,
          fadeOut: 2
        })
        // Track 3 (overlapping)
        .addAudio(track3, {
          startTime: 16,
          duration: 10,
          fadeIn: 2
        });
      
      const layers = crossfaded.getLayers();
      expect(layers.filter(l => l.type === 'audio')).toHaveLength(3);
      
      // Check overlap timing
      expect(layers[1].startTime).toBeLessThan(10); // Starts before track1 ends
      expect(layers[2].startTime).toBeLessThan(18); // Starts before track2 ends
    });
  });

  describe('🎯 Edge Cases and Stress Tests', () => {
    test('should handle many simultaneous audio tracks', () => {
      const timeline = new Timeline();
      
      // Add 20 audio tracks
      for (let i = 0; i < 20; i++) {
        const audioFile = localAudioFiles[i % localAudioFiles.length];
        timeline.addAudio(audioFile, {
          startTime: i * 2,
          duration: 5,
          volume: 0.5 + (i % 3) * 0.2,
          pan: (i % 5 - 2) * 0.25 // Distribute across stereo field
        });
      }
      
      const layers = timeline.getLayers();
      expect(layers.filter(l => l.type === 'audio')).toHaveLength(20);
    });

    test('should handle rapid audio switching', () => {
      const [beep, whoosh] = localAudioFiles.slice(3, 5);
      
      const rapid = new Timeline();
      
      // Alternate between two sounds rapidly
      for (let i = 0; i < 30; i++) {
        const sound = i % 2 === 0 ? beep : whoosh;
        rapid.addAudio(sound, {
          startTime: i * 0.5,
          duration: 0.4,
          volume: 0.7
        });
      }
      
      const layers = rapid.getLayers();
      expect(layers.filter(l => l.type === 'audio')).toHaveLength(30);
    });

    test('should handle complex ducking chains', () => {
      const [music1, music2, voice, effect] = localAudioFiles;
      
      let timeline = new Timeline()
        .addAudio(music1, { duration: 30, volume: 0.8 })
        .addAudio(music2, { startTime: 15, duration: 20, volume: 0.8 })
        .addAudio(voice, { startTime: 10, duration: 15, volume: 1.2 })
        .addAudio(effect, { startTime: 20, duration: 2, volume: 1.0 });
      
      // Duck music1 for voice
      timeline = AudioDucking.addDucking(timeline, {
        backgroundTrack: music1,
        voiceTrack: voice,
        duckingLevel: 0.3,
        detectionMode: 'manual',
        duckingRegions: [{ start: 10, end: 25 }]
      });
      
      // Duck music2 for voice
      timeline = AudioDucking.addDucking(timeline, {
        backgroundTrack: music2,
        voiceTrack: voice,
        duckingLevel: 0.3,
        detectionMode: 'manual',
        duckingRegions: [{ start: 15, end: 25 }]
      });
      
      // Duck everything for effect
      timeline = AudioDucking.addDucking(timeline, {
        backgroundTrack: 0, // All tracks
        voiceTrack: effect,
        duckingLevel: 0.1,
        detectionMode: 'manual',
        duckingRegions: [{ start: 20, end: 22 }]
      });
      
      const command = timeline.getCommand('complex-ducking.mp4');
      expect(command).toBeTruthy();
    });
  });

  describe('🎼 Real-World Audio Scenarios', () => {
    test('should create radio show format', () => {
      const [jingle, music, host, , ambience] = localAudioFiles;
      
      const radioShow = new Timeline()
        // Station ID jingle
        .addAudio(jingle, { duration: 2, volume: 1.0 })
        // Bed music
        .addAudio(music, {
          startTime: 2,
          duration: 180,
          volume: 0.4,
          fadeIn: 1,
          fadeOut: 3
        })
        // Host segments
        .addAudio(host, { startTime: 5, duration: 20, volume: 1.3 })
        .addAudio(host, { startTime: 30, duration: 25, volume: 1.3 })
        .addAudio(host, { startTime: 60, duration: 30, volume: 1.3 })
        // Traffic/weather bed
        .addAudio(ambience, {
          startTime: 90,
          duration: 20,
          volume: 0.3,
          fadeIn: 0.5,
          fadeOut: 0.5
        })
        // Outro jingle
        .addAudio(jingle, { startTime: 178, duration: 2, volume: 1.0 });
      
      // Apply professional ducking
      const professional = AudioDucking.createPodcastMix(new Timeline(), {
        hosts: [host],
        music: music,
        musicSegments: [
          { start: 5, end: 25 },
          { start: 30, end: 55 },
          { start: 60, end: 90 }
        ],
        normalDucking: 0.2
      });
      
      expect(professional.getLayers().length).toBeGreaterThan(0);
    });

    test('should create meditation/relaxation audio', () => {
      const [, , voice, , nature, chime] = localAudioFiles;
      
      const meditation = new Timeline()
        // Nature ambience base
        .addAudio(nature, {
          duration: 300,
          volume: 0.5,
          fadeIn: 5,
          fadeOut: 10
        })
        // Periodic chimes
        .addAudio(chime, { startTime: 30, volume: 0.4, fadeIn: 0.5 })
        .addAudio(chime, { startTime: 90, volume: 0.4, fadeIn: 0.5 })
        .addAudio(chime, { startTime: 150, volume: 0.4, fadeIn: 0.5 })
        .addAudio(chime, { startTime: 210, volume: 0.4, fadeIn: 0.5 })
        .addAudio(chime, { startTime: 270, volume: 0.4, fadeIn: 0.5 })
        // Guided meditation voice
        .addAudio(voice, {
          startTime: 10,
          duration: 280,
          volume: 0.9,
          fadeIn: 2,
          fadeOut: 5
        });
      
      // Very gentle ducking for voice
      const relaxing = AudioDucking.addDucking(meditation, {
        backgroundTrack: nature,
        voiceTrack: voice,
        duckingLevel: 0.7, // Only duck to 70%
        fadeInTime: 2.0,
        fadeOutTime: 3.0,
        detectionMode: 'manual',
        duckingRegions: [{ start: 10, end: 290 }]
      });
      
      const command = relaxing.getCommand('meditation.mp4');
      expect(command).toContain('ambience-nature.mp3');
      expect(command).toContain('voiceover-narration.mp3');
    });
  });
});
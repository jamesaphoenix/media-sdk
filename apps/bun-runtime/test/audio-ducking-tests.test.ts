/**
 * @fileoverview Audio Ducking Tests
 * 
 * Tests for automatic audio ducking and mixing functionality
 */

import { test, expect, describe, beforeAll, afterAll } from 'bun:test';
import { Timeline, AudioDucking } from '../../../packages/media-sdk/src/index.js';
import { promises as fs } from 'fs';
import { join } from 'path';
import { tmpdir } from 'os';

describe('🎵 AUDIO DUCKING TESTS', () => {
  let testDir: string;
  let audioFiles: string[] = [];
  
  beforeAll(async () => {
    testDir = join(tmpdir(), 'audio-ducking-tests-' + Date.now());
    await fs.mkdir(testDir, { recursive: true });
    
    // Create dummy audio files for testing
    audioFiles = await createTestAudioFiles();
  });
  
  afterAll(async () => {
    try {
      await fs.rm(testDir, { recursive: true, force: true });
    } catch (e) {
      console.error('Cleanup error:', e);
    }
  });
  
  async function createTestAudioFiles() {
    const files = [
      'background-music.mp3',
      'voiceover.mp3',
      'ambience.mp3',
      'sound-effects.mp3',
      'host1.mp3',
      'host2.mp3',
      'intro-music.mp3'
    ];
    
    for (const filename of files) {
      const filepath = join(testDir, filename);
      // Create minimal MP3 header
      await fs.writeFile(filepath, Buffer.from([0xFF, 0xFB, 0x90, 0x00]));
    }
    
    return files.map(f => join(testDir, f));
  }

  describe('📌 Basic Ducking', () => {
    test('should add basic audio ducking', () => {
      const timeline = new Timeline()
        .addAudio('music.mp3')
        .addAudio('voice.mp3');
      
      const ducked = AudioDucking.addDucking(timeline, {
        duckingLevel: 0.3,
        fadeInTime: 0.3,
        fadeOutTime: 0.5
      });
      
      const command = ducked.getCommand('output.mp4');
      expect(command).toContain('sidechaincompress');
    });

    test('should duck at specific regions', () => {
      const timeline = new Timeline()
        .addAudio('background.mp3', { duration: 60 })
        .addAudio('narration.mp3', { duration: 60 });
      
      const ducked = AudioDucking.duckAtRegions(timeline, [
        { start: 5, end: 10 },
        { start: 20, end: 30 },
        { start: 45, end: 55 }
      ]);
      
      const command = ducked.getCommand('output.mp4');
      expect(command).toContain('volume=');
    });

    test('should support different detection modes', () => {
      const timeline = new Timeline()
        .addAudio('music.mp3')
        .addAudio('voice.mp3');
      
      // Manual mode
      const manual = AudioDucking.addDucking(timeline, {
        detectionMode: 'manual',
        duckingRegions: [{ start: 0, end: 5 }]
      });
      expect(manual.getCommand('output.mp4')).toContain('volume=');
      
      // Automatic mode
      const auto = AudioDucking.addDucking(timeline, {
        detectionMode: 'automatic',
        detectionThreshold: -20
      });
      expect(auto.getCommand('output.mp4')).toContain('agate');
      
      // Sidechain mode
      const sidechain = AudioDucking.addDucking(timeline, {
        detectionMode: 'sidechain',
        compressorRatio: 4
      });
      expect(sidechain.getCommand('output.mp4')).toContain('sidechaincompress');
    });
  });

  describe('🎚️ Advanced Ducking Options', () => {
    test('should apply frequency-specific ducking', () => {
      const timeline = new Timeline()
        .addAudio('music.mp3')
        .addAudio('voice.mp3');
      
      const ducked = AudioDucking.addDucking(timeline, {
        frequencyDucking: true,
        duckingFrequencies: { low: 200, high: 4000 }
      });
      
      const command = ducked.getCommand('output.mp4');
      expect(command).toContain('highpass');
      expect(command).toContain('lowpass');
    });

    test('should apply voice boost', () => {
      const timeline = new Timeline()
        .addAudio('music.mp3')
        .addAudio('voice.mp3');
      
      const ducked = AudioDucking.addDucking(timeline, {
        voiceBoost: 1.5,
        duckingLevel: 0.2
      });
      
      const command = ducked.getCommand('output.mp4');
      expect(command).toContain('makeup');
    });

    test('should handle anticipation and hold time', () => {
      const timeline = new Timeline()
        .addAudio('music.mp3')
        .addAudio('voice.mp3');
      
      const ducked = AudioDucking.addDucking(timeline, {
        anticipation: 0.2,
        holdTime: 0.3,
        detectionMode: 'manual',
        duckingRegions: [{ start: 5, end: 10 }]
      });
      
      const command = ducked.getCommand('output.mp4');
      // Should start ducking 0.2s before region
      expect(command).toContain('4.8'); // 5 - 0.2
    });
  });

  describe('🎬 Specialized Mixes', () => {
    test('should create dialogue mix', () => {
      const timeline = new Timeline();
      
      const dialogue = AudioDucking.createDialogueMix(timeline, {
        dialogueTrack: audioFiles[1], // voiceover.mp3
        musicTrack: audioFiles[0],     // background-music.mp3
        ambienceTrack: audioFiles[2],  // ambience.mp3
        dialogueBoost: 1.5,
        musicDuckLevel: 0.2,
        ambienceDuckLevel: 0.5
      });
      
      const layers = dialogue.getLayers();
      const audioLayers = layers.filter(l => l.type === 'audio');
      
      expect(audioLayers.length).toBeGreaterThanOrEqual(3);
      
      // Check dialogue boost
      const dialogueLayer = audioLayers.find(l => l.source === audioFiles[1]);
      expect(dialogueLayer?.volume).toBe(1.5);
    });

    test('should create podcast mix', () => {
      const timeline = new Timeline();
      
      const podcast = AudioDucking.createPodcastMix(timeline, {
        hosts: [audioFiles[4], audioFiles[5]], // host1.mp3, host2.mp3
        music: audioFiles[6], // intro-music.mp3
        musicSegments: [
          { start: 0, end: 10 },    // Intro
          { start: 300, end: 310 }  // Outro
        ],
        crossTalk: true,
        introOutroDucking: 0.6,
        normalDucking: 0.15
      });
      
      const layers = podcast.getLayers();
      const audioLayers = layers.filter(l => l.type === 'audio');
      
      // Should have 2 hosts + 1 music
      expect(audioLayers.length).toBeGreaterThanOrEqual(3);
      
      // Check stereo panning
      const host1 = audioLayers.find(l => l.source === audioFiles[4]);
      const host2 = audioLayers.find(l => l.source === audioFiles[5]);
      expect(host1?.pan).toBe(-0.3);
      expect(host2?.pan).toBe(0.3);
    });

    test('should create music bed', () => {
      const timeline = new Timeline();
      
      const musicBed = AudioDucking.createMusicBed(timeline, {
        music: audioFiles[0], // background-music.mp3
        duckingPoints: [
          { time: 10, duration: 5, level: 0.2, reason: 'voiceover' },
          { time: 30, duration: 3, level: 0.1, reason: 'announcement' },
          { time: 50, duration: 10, level: 0.3, reason: 'dialogue' }
        ],
        fadeIn: 2,
        fadeOut: 3,
        baseVolume: 0.8
      });
      
      const layers = musicBed.getLayers();
      const musicLayer = layers.find(l => l.source === audioFiles[0]);
      
      expect(musicLayer?.volume).toBe(0.8);
      expect(musicLayer?.fadeIn).toBe(2);
      expect(musicLayer?.fadeOut).toBe(3);
    });
  });

  describe('🔧 Timeline Extensions', () => {
    test('should add addAudioDucking method to Timeline', () => {
      const timeline = new Timeline()
        .addAudio('music.mp3')
        .addAudio('voice.mp3');
      
      const ducked = timeline.addAudioDucking({
        duckingLevel: 0.25
      });
      
      expect(ducked).toBeInstanceOf(Timeline);
      const command = ducked.getCommand('output.mp4');
      expect(command).toContain('sidechaincompress');
    });

    test('should add duckAudioAt method to Timeline', () => {
      const timeline = new Timeline()
        .addAudio('music.mp3')
        .addAudio('voice.mp3');
      
      const ducked = timeline.duckAudioAt([
        { start: 5, end: 10 },
        { start: 15, end: 20 }
      ], {
        duckingLevel: 0.3
      });
      
      expect(ducked).toBeInstanceOf(Timeline);
    });
  });

  describe('🎯 Edge Cases', () => {
    test('should warn when less than 2 audio tracks', () => {
      const timeline = new Timeline()
        .addAudio('only-one.mp3');
      
      const consoleSpy = jest.spyOn(console, 'warn').mockImplementation();
      
      const ducked = AudioDucking.addDucking(timeline);
      
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('requires at least 2 audio tracks')
      );
      
      consoleSpy.mockRestore();
    });

    test('should handle empty ducking regions', () => {
      const timeline = new Timeline()
        .addAudio('music.mp3')
        .addAudio('voice.mp3');
      
      const ducked = AudioDucking.duckAtRegions(timeline, []);
      
      const command = ducked.getCommand('output.mp4');
      expect(command).toContain('[0:a]anull[a]'); // Pass through
    });

    test('should handle overlapping ducking regions', () => {
      const timeline = new Timeline()
        .addAudio('music.mp3')
        .addAudio('voice.mp3');
      
      const ducked = AudioDucking.duckAtRegions(timeline, [
        { start: 5, end: 15 },
        { start: 10, end: 20 }, // Overlaps with first
        { start: 18, end: 25 }  // Overlaps with second
      ]);
      
      const command = ducked.getCommand('output.mp4');
      expect(command).toContain('volume=');
    });

    test('should handle very short fade times', () => {
      const timeline = new Timeline()
        .addAudio('music.mp3')
        .addAudio('voice.mp3');
      
      const ducked = AudioDucking.addDucking(timeline, {
        fadeInTime: 0.01,
        fadeOutTime: 0.01
      });
      
      const command = ducked.getCommand('output.mp4');
      expect(command).toContain('attack=10'); // 0.01 * 1000
    });
  });

  describe('💡 Analysis Features', () => {
    test('should analyze audio for ducking (mock)', async () => {
      const timeline = new Timeline()
        .addAudio('music.mp3')
        .addAudio('voice.mp3');
      
      const analysis = await AudioDucking.analyzeForDucking(timeline, {
        voiceTrack: 1,
        backgroundTrack: 0,
        detectionSensitivity: 0.8
      });
      
      expect(analysis.detectedRegions).toHaveLength(3);
      expect(analysis.suggestedLevel).toBe(0.3);
      expect(analysis.warnings).toBeDefined();
    });
  });

  describe('🎨 Complex Audio Scenarios', () => {
    test('should handle multi-layer audio with different duck levels', () => {
      const timeline = new Timeline()
        .addAudio('music.mp3', { volume: 1.0 })
        .addAudio('ambience.mp3', { volume: 0.5 })
        .addAudio('effects.mp3', { volume: 0.8 })
        .addAudio('voice.mp3', { volume: 1.2 });
      
      // First duck music for voice
      let ducked = AudioDucking.addDucking(timeline, {
        backgroundTrack: 0, // music
        voiceTrack: 3,      // voice
        duckingLevel: 0.2
      });
      
      // Then duck ambience for voice (less aggressive)
      ducked = AudioDucking.addDucking(ducked, {
        backgroundTrack: 1, // ambience
        voiceTrack: 3,      // voice
        duckingLevel: 0.5
      });
      
      const command = ducked.getCommand('output.mp4');
      expect(command).toContain('sidechaincompress');
    });

    test('should create documentary-style mix', () => {
      const timeline = new Timeline();
      
      // Simulate documentary with narration, music, and ambient sounds
      const documentary = AudioDucking.createDialogueMix(timeline, {
        dialogueTrack: 'narration.mp3',
        musicTrack: 'emotional-music.mp3',
        ambienceTrack: 'nature-sounds.mp3',
        soundEffectsTrack: 'wildlife.mp3',
        dialogueBoost: 1.3,
        musicDuckLevel: 0.15,
        ambienceDuckLevel: 0.4
      });
      
      const layers = documentary.getLayers();
      expect(layers.filter(l => l.type === 'audio').length).toBe(4);
    });

    test('should handle live event mixing', () => {
      const timeline = new Timeline()
        .addAudio('crowd-noise.mp3', { volume: 0.6 })
        .addAudio('announcer.mp3', { volume: 1.5 })
        .addAudio('stadium-music.mp3', { volume: 0.8 });
      
      // Duck crowd and music when announcer speaks
      const live = AudioDucking.addDucking(timeline, {
        detectionMode: 'automatic',
        detectionThreshold: -15,
        voiceTrack: 1,
        duckingLevel: 0.3,
        fadeInTime: 0.2,
        fadeOutTime: 1.0,
        holdTime: 0.5
      });
      
      const command = live.getCommand('output.mp4');
      expect(command).toContain('agate');
    });
  });

  describe('🔊 Audio Parameter Tests', () => {
    test('should handle extreme ducking levels', () => {
      const timeline = new Timeline()
        .addAudio('music.mp3')
        .addAudio('voice.mp3');
      
      // Very aggressive ducking
      const aggressive = AudioDucking.addDucking(timeline, {
        duckingLevel: 0.05 // 5% of original
      });
      
      // Very mild ducking
      const mild = AudioDucking.addDucking(timeline, {
        duckingLevel: 0.9 // 90% of original
      });
      
      expect(aggressive.getCommand('output.mp4')).toContain('makeup=20'); // 1/0.05
      expect(mild.getCommand('output.mp4')).toContain('makeup=1.1'); // 1/0.9
    });

    test('should handle high compression ratios', () => {
      const timeline = new Timeline()
        .addAudio('music.mp3')
        .addAudio('voice.mp3');
      
      const compressed = AudioDucking.addDucking(timeline, {
        detectionMode: 'sidechain',
        compressorRatio: 20 // Very high ratio
      });
      
      const command = compressed.getCommand('output.mp4');
      expect(command).toContain('ratio=20');
    });
  });
});
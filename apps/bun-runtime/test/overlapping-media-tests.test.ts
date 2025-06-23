/**
 * @fileoverview Overlapping Media Tests
 * 
 * Tests for complex overlapping scenarios with videos, audio, text, and images
 */

import { test, expect, describe, beforeAll, afterAll } from 'bun:test';
import { 
  Timeline, 
  VideoSplicer, 
  PictureInPicture, 
  AudioDucking 
} from '../../../packages/media-sdk/src/index.js';
import { promises as fs } from 'fs';
import { join } from 'path';
import { tmpdir } from 'os';

describe('🔄 OVERLAPPING MEDIA TESTS', () => {
  let testDir: string;
  
  beforeAll(async () => {
    testDir = join(tmpdir(), 'overlapping-media-tests-' + Date.now());
    await fs.mkdir(testDir, { recursive: true });
  });
  
  afterAll(async () => {
    try {
      await fs.rm(testDir, { recursive: true, force: true });
    } catch (e) {
      console.error('Cleanup error:', e);
    }
  });

  describe('📹 Overlapping Videos', () => {
    test('should handle multiple overlapping videos', () => {
      const timeline = new Timeline()
        .addVideo('base.mp4', { startTime: 0, duration: 30 })
        .addVideo('overlay1.mp4', { startTime: 5, duration: 10, opacity: 0.7 })
        .addVideo('overlay2.mp4', { startTime: 10, duration: 15, opacity: 0.5 })
        .addVideo('overlay3.mp4', { startTime: 20, duration: 8, opacity: 0.6 });
      
      const layers = timeline.getLayers();
      expect(layers.filter(l => l.type === 'video')).toHaveLength(4);
      
      // Check overlaps
      expect(layers[1].startTime).toBeLessThan(15); // overlay1 overlaps with base
      expect(layers[2].startTime).toBeLessThan(layers[1].startTime! + layers[1].duration!); // overlay2 overlaps overlay1
    });

    test('should handle cascading PiP overlays', () => {
      let timeline = new Timeline().addVideo('main.mp4', { duration: 60 });
      
      // Add multiple PiP layers that overlap
      timeline = PictureInPicture.add(timeline, 'pip1.mp4', {
        position: 'top-left',
        scale: 0.3,
        startTime: 0,
        endTime: 30
      });
      
      timeline = PictureInPicture.add(timeline, 'pip2.mp4', {
        position: 'top-right',
        scale: 0.3,
        startTime: 15,
        endTime: 45
      });
      
      timeline = PictureInPicture.add(timeline, 'pip3.mp4', {
        position: 'bottom-left',
        scale: 0.3,
        startTime: 25,
        endTime: 55
      });
      
      timeline = PictureInPicture.add(timeline, 'pip4.mp4', {
        position: 'bottom-right',
        scale: 0.3,
        startTime: 40,
        endTime: 60
      });
      
      const command = timeline.getCommand('multi-pip.mp4');
      expect(command).toContain('pip1.mp4');
      expect(command).toContain('pip2.mp4');
      expect(command).toContain('pip3.mp4');
      expect(command).toContain('pip4.mp4');
    });

    test('should handle overlapping video segments with transitions', () => {
      const segments = [
        { source: 'clip1.mp4', startTime: 0, endTime: 10 },
        { source: 'clip2.mp4', startTime: 8, endTime: 18 },  // 2s overlap
        { source: 'clip3.mp4', startTime: 15, endTime: 25 }, // 3s overlap
        { source: 'clip4.mp4', startTime: 22, endTime: 30 }  // 3s overlap
      ];
      
      const timeline = new Timeline();
      
      segments.forEach((segment, index) => {
        timeline.addVideo(segment.source, {
          startTime: segment.startTime,
          duration: segment.endTime - segment.startTime,
          opacity: index === 0 ? 1 : 0.8,
          transition: index > 0 ? 'dissolve' : undefined
        });
      });
      
      expect(timeline.getDuration()).toBe(30);
    });
  });

  describe('🎵 Overlapping Audio', () => {
    test('should handle complex overlapping audio layers', () => {
      const timeline = new Timeline()
        // Base music track
        .addAudio('music.mp3', { startTime: 0, duration: 60, volume: 0.6 })
        // Overlapping voice segments
        .addAudio('voice1.mp3', { startTime: 5, duration: 10, volume: 1.0 })
        .addAudio('voice2.mp3', { startTime: 12, duration: 8, volume: 1.0 }) // Overlaps voice1
        .addAudio('voice3.mp3', { startTime: 18, duration: 12, volume: 1.0 }) // Overlaps voice2
        // Sound effects
        .addAudio('sfx1.mp3', { startTime: 8, duration: 2, volume: 0.8 })
        .addAudio('sfx2.mp3', { startTime: 15, duration: 1, volume: 0.8 })
        .addAudio('sfx3.mp3', { startTime: 25, duration: 3, volume: 0.8 });
      
      const audioLayers = timeline.getLayers().filter(l => l.type === 'audio');
      expect(audioLayers).toHaveLength(7);
      
      // Apply ducking for overlapping regions
      const ducked = AudioDucking.duckAtRegions(timeline, [
        { start: 5, end: 30 } // Duck during all voice segments
      ], {
        duckingLevel: 0.3,
        backgroundTrack: 0 // Duck the music
      });
      
      expect(ducked).toBeInstanceOf(Timeline);
    });

    test('should handle crossfading audio with overlaps', () => {
      const timeline = new Timeline()
        .addAudio('song1.mp3', { startTime: 0, duration: 20, fadeOut: 3 })
        .addAudio('song2.mp3', { startTime: 17, duration: 20, fadeIn: 3, fadeOut: 3 })
        .addAudio('song3.mp3', { startTime: 34, duration: 20, fadeIn: 3 });
      
      // Songs overlap during crossfades
      const layers = timeline.getLayers();
      expect(layers[1].startTime).toBeLessThan(20); // song2 starts before song1 ends
      expect(layers[2].startTime).toBeLessThan(37); // song3 starts before song2 ends
    });

    test('should handle multiple simultaneous ducking regions', () => {
      const timeline = new Timeline()
        .addAudio('music.mp3', { duration: 120, volume: 0.8 })
        .addAudio('ambience.mp3', { duration: 120, volume: 0.4 })
        .addAudio('dialogue1.mp3', { startTime: 10, duration: 15 })
        .addAudio('dialogue2.mp3', { startTime: 20, duration: 10 }) // Overlaps dialogue1
        .addAudio('dialogue3.mp3', { startTime: 50, duration: 20 });
      
      // Apply different ducking for each dialogue
      let ducked = AudioDucking.duckAtRegions(timeline, [
        { start: 10, end: 25 }
      ], {
        duckingLevel: 0.2,
        backgroundTrack: 'music.mp3'
      });
      
      ducked = AudioDucking.duckAtRegions(ducked, [
        { start: 10, end: 30 },
        { start: 50, end: 70 }
      ], {
        duckingLevel: 0.5,
        backgroundTrack: 'ambience.mp3'
      });
      
      expect(ducked).toBeInstanceOf(Timeline);
    });
  });

  describe('📝 Overlapping Text and Captions', () => {
    test('should handle multiple overlapping text layers', () => {
      const timeline = new Timeline()
        .addVideo('video.mp4', { duration: 30 })
        // Main title
        .addText('MAIN TITLE', {
          startTime: 0,
          duration: 10,
          position: { x: 'center', y: 'center' },
          style: { fontSize: 72 }
        })
        // Subtitle (overlaps with title)
        .addText('Subtitle Text', {
          startTime: 5,
          duration: 10,
          position: { x: 'center', y: '70%' },
          style: { fontSize: 36 }
        })
        // Lower third (overlaps with subtitle)
        .addText('Speaker Name', {
          startTime: 8,
          duration: 15,
          position: { x: '10%', y: '80%' },
          style: { fontSize: 24 }
        })
        // Scrolling ticker
        .addText('Breaking News: Lorem ipsum dolor sit amet...', {
          startTime: 0,
          duration: 30,
          position: { x: 0, y: '90%' },
          animation: 'scroll'
        });
      
      const textLayers = timeline.getLayers().filter(l => l.type === 'text');
      expect(textLayers).toHaveLength(4);
    });

    test('should handle overlapping captions in different languages', () => {
      const timeline = new Timeline()
        .addVideo('video.mp4', { duration: 60 })
        // English captions
        .addText('Hello, welcome to our show', {
          startTime: 5,
          duration: 5,
          position: { x: 'center', y: '80%' },
          style: { fontSize: 32, color: '#ffffff' }
        })
        // Spanish captions (same timing)
        .addText('Hola, bienvenidos a nuestro programa', {
          startTime: 5,
          duration: 5,
          position: { x: 'center', y: '85%' },
          style: { fontSize: 28, color: '#ffff00' }
        })
        // French captions (same timing)
        .addText('Bonjour, bienvenue à notre émission', {
          startTime: 5,
          duration: 5,
          position: { x: 'center', y: '90%' },
          style: { fontSize: 28, color: '#00ffff' }
        });
      
      const command = timeline.getCommand('multi-language.mp4');
      expect(command).toContain('Hello');
      expect(command).toContain('Hola');
      expect(command).toContain('Bonjour');
    });
  });

  describe('🖼️ Overlapping Images', () => {
    test('should handle overlapping image layers', () => {
      const timeline = new Timeline()
        .addVideo('background.mp4', { duration: 30 })
        // Logo watermark (entire duration)
        .addImage('logo.png', {
          startTime: 0,
          duration: 30,
          position: { x: '90%', y: '10%' },
          opacity: 0.7,
          scale: 0.1
        })
        // Product images sliding in
        .addImage('product1.png', {
          startTime: 5,
          duration: 8,
          position: { x: '20%', y: '50%' },
          animation: 'slide-in-left'
        })
        .addImage('product2.png', {
          startTime: 10,
          duration: 8,
          position: { x: '50%', y: '50%' },
          animation: 'fade-in'
        })
        .addImage('product3.png', {
          startTime: 15,
          duration: 8,
          position: { x: '80%', y: '50%' },
          animation: 'slide-in-right'
        });
      
      const imageLayers = timeline.getLayers().filter(l => l.type === 'image');
      expect(imageLayers).toHaveLength(4);
    });

    test('should create image collage with overlaps', () => {
      const timeline = new Timeline()
        .addVideo('background.mp4', { duration: 20 });
      
      // Create a grid of overlapping images
      const positions = [
        { x: '25%', y: '25%' },
        { x: '35%', y: '25%' },
        { x: '25%', y: '35%' },
        { x: '35%', y: '35%' }
      ];
      
      positions.forEach((pos, index) => {
        timeline.addImage(`photo${index + 1}.jpg`, {
          startTime: index * 2,
          duration: 15 - index * 2,
          position: pos,
          scale: 0.3,
          opacity: 0.8,
          shadow: true
        });
      });
      
      const command = timeline.getCommand('collage.mp4');
      expect(command).toContain('photo1.jpg');
      expect(command).toContain('photo4.jpg');
    });
  });

  describe('🎨 Complex Multi-Media Overlaps', () => {
    test('should handle news broadcast with all elements overlapping', () => {
      const timeline = new Timeline()
        // Main video feed
        .addVideo('news-feed.mp4', { duration: 60 })
        // Reporter PiP
        .addPictureInPicture('reporter.mp4', {
          position: 'bottom-right',
          scale: 0.25,
          startTime: 10,
          endTime: 40,
          borderWidth: 2,
          borderColor: '#ffffff'
        })
        // Breaking news banner
        .addImage('breaking-banner.png', {
          startTime: 0,
          duration: 60,
          position: { x: 'center', y: '10%' },
          opacity: 0.9
        })
        // Scrolling ticker
        .addText('Latest updates: Market up 2.5% | Weather: Sunny 72°F | Traffic: Normal', {
          startTime: 0,
          duration: 60,
          position: { x: 0, y: '90%' },
          animation: 'scroll',
          style: { backgroundColor: '#000000', color: '#ffffff' }
        })
        // Lower third
        .addText('John Doe - Senior Correspondent', {
          startTime: 12,
          duration: 25,
          position: { x: '5%', y: '75%' },
          style: { backgroundColor: '#ff0000', color: '#ffffff', fontSize: 28 }
        })
        // Time display
        .addText('LIVE 3:45 PM EST', {
          startTime: 0,
          duration: 60,
          position: { x: '85%', y: '5%' },
          style: { fontSize: 20, color: '#ffffff' }
        })
        // Background music
        .addAudio('news-theme.mp3', {
          duration: 60,
          volume: 0.3,
          fadeIn: 2,
          fadeOut: 3
        })
        // Reporter audio
        .addAudio('reporter-audio.mp3', {
          startTime: 10,
          duration: 30,
          volume: 1.0
        });
      
      // Apply ducking for reporter audio
      const broadcast = AudioDucking.addDucking(timeline, {
        backgroundTrack: 'news-theme.mp3',
        voiceTrack: 'reporter-audio.mp3',
        duckingLevel: 0.15,
        detectionMode: 'manual',
        duckingRegions: [{ start: 10, end: 40 }]
      });
      
      const layers = broadcast.getLayers();
      expect(layers.length).toBeGreaterThan(8);
    });

    test('should handle gaming stream overlay setup', () => {
      let timeline = new Timeline()
        // Game footage
        .addVideo('gameplay.mp4', { duration: 300 });
      
      // Webcam overlay
      timeline = PictureInPicture.add(timeline, 'webcam.mp4', {
        position: 'bottom-left',
        scale: 0.2,
        borderRadius: 999,
        borderWidth: 3,
        borderColor: '#00ff00',
        shadow: true
      });
      
      // Chat overlay
      timeline = timeline.addImage('chat-bg.png', {
        startTime: 0,
        duration: 300,
        position: { x: '75%', y: '50%' },
        opacity: 0.8,
        scale: 0.3
      });
      
      // Alerts/notifications area
      timeline = timeline.addImage('alerts-area.png', {
        startTime: 0,
        duration: 300,
        position: { x: 'center', y: '10%' },
        opacity: 0.9
      });
      
      // Stream info
      timeline = timeline
        .addText('LIVE', {
          startTime: 0,
          duration: 300,
          position: { x: '5%', y: '5%' },
          style: { 
            fontSize: 24, 
            color: '#ff0000',
            backgroundColor: '#ffffff',
            padding: '5px'
          }
        })
        .addText('Viewers: 1,234', {
          startTime: 0,
          duration: 300,
          position: { x: '5%', y: '10%' },
          style: { fontSize: 20, color: '#ffffff' }
        })
        .addText('!commands !discord !youtube', {
          startTime: 0,
          duration: 300,
          position: { x: '5%', y: '85%' },
          style: { fontSize: 18, color: '#00ff00' }
        });
      
      // Audio layers
      timeline = timeline
        .addAudio('game-audio.mp3', { duration: 300, volume: 0.8 })
        .addAudio('mic-audio.mp3', { duration: 300, volume: 1.0 })
        .addAudio('alert-sounds.mp3', { startTime: 30, duration: 2, volume: 0.6 })
        .addAudio('alert-sounds.mp3', { startTime: 120, duration: 2, volume: 0.6 })
        .addAudio('alert-sounds.mp3', { startTime: 210, duration: 2, volume: 0.6 });
      
      const command = timeline.getCommand('stream.mp4');
      expect(command).toBeTruthy();
      expect(timeline.getLayers().length).toBeGreaterThan(10);
    });

    test('should handle presentation with overlapping elements', () => {
      const timeline = new Timeline()
        // Slide background
        .addImage('slide-bg.png', { duration: 120 })
        // Main content area
        .addImage('content-slide1.png', {
          startTime: 0,
          duration: 30,
          position: { x: 'center', y: 'center' },
          scale: 0.8
        })
        .addImage('content-slide2.png', {
          startTime: 25,
          duration: 35,
          position: { x: 'center', y: 'center' },
          scale: 0.8,
          fadeIn: 2
        })
        .addImage('content-slide3.png', {
          startTime: 55,
          duration: 35,
          position: { x: 'center', y: 'center' },
          scale: 0.8,
          fadeIn: 2
        })
        // Presenter video
        .addPictureInPicture('presenter.mp4', {
          position: 'bottom-right',
          scale: 0.2,
          borderRadius: 10,
          startTime: 0,
          endTime: 120
        })
        // Annotations appearing
        .addText('Key Point #1', {
          startTime: 10,
          duration: 15,
          position: { x: '70%', y: '30%' },
          style: { 
            fontSize: 32,
            color: '#ff0000',
            backgroundColor: '#ffff00'
          }
        })
        .addText('Key Point #2', {
          startTime: 35,
          duration: 20,
          position: { x: '30%', y: '60%' },
          style: { 
            fontSize: 32,
            color: '#0000ff',
            backgroundColor: '#ffffff'
          }
        })
        // Progress indicator
        .addText('Slide 1 of 3', {
          startTime: 0,
          duration: 30,
          position: { x: '90%', y: '95%' },
          style: { fontSize: 16 }
        })
        .addText('Slide 2 of 3', {
          startTime: 30,
          duration: 30,
          position: { x: '90%', y: '95%' },
          style: { fontSize: 16 }
        })
        .addText('Slide 3 of 3', {
          startTime: 60,
          duration: 60,
          position: { x: '90%', y: '95%' },
          style: { fontSize: 16 }
        })
        // Audio narration
        .addAudio('narration.mp3', { duration: 120, volume: 1.0 })
        .addAudio('background-music.mp3', { duration: 120, volume: 0.2 });
      
      const layers = timeline.getLayers();
      expect(layers.filter(l => l.type === 'image')).toHaveLength(5);
      expect(layers.filter(l => l.type === 'text')).toHaveLength(5);
      expect(layers.filter(l => l.type === 'audio')).toHaveLength(2);
    });
  });

  describe('⚡ Performance with Overlaps', () => {
    test('should handle 100 overlapping elements efficiently', () => {
      let timeline = new Timeline()
        .addVideo('base.mp4', { duration: 60 });
      
      // Add 25 images with overlaps
      for (let i = 0; i < 25; i++) {
        timeline = timeline.addImage(`img${i}.png`, {
          startTime: i * 2,
          duration: 10,
          position: { 
            x: `${(i % 5) * 20}%`, 
            y: `${Math.floor(i / 5) * 20}%` 
          },
          opacity: 0.5,
          scale: 0.15
        });
      }
      
      // Add 25 text overlays
      for (let i = 0; i < 25; i++) {
        timeline = timeline.addText(`Text ${i}`, {
          startTime: i * 2.4,
          duration: 8,
          position: { 
            x: `${(i % 5) * 20 + 10}%`, 
            y: `${Math.floor(i / 5) * 20 + 10}%` 
          },
          style: { fontSize: 20 }
        });
      }
      
      // Add 25 audio tracks
      for (let i = 0; i < 25; i++) {
        timeline = timeline.addAudio(`audio${i}.mp3`, {
          startTime: i * 2.4,
          duration: 5,
          volume: 0.1
        });
      }
      
      // Add 25 PiP videos
      for (let i = 0; i < 25; i++) {
        const positions = ['top-left', 'top-right', 'bottom-left', 'bottom-right', 'center'];
        timeline = PictureInPicture.add(timeline, `pip${i}.mp4`, {
          position: positions[i % 5] as any,
          scale: 0.05,
          startTime: i * 2.4,
          endTime: i * 2.4 + 6,
          opacity: 0.3
        });
      }
      
      const layers = timeline.getLayers();
      expect(layers.length).toBeGreaterThan(100);
      
      // Should still generate a command
      const command = timeline.getCommand('complex.mp4');
      expect(command).toBeTruthy();
    });
  });
});
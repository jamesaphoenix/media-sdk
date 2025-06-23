/**
 * @fileoverview Picture-in-Picture Tests
 * 
 * Tests for PiP overlay functionality with various layouts and animations
 */

import { test, expect, describe, beforeAll, afterAll } from 'bun:test';
import { Timeline, PictureInPicture } from '../../../packages/media-sdk/src/index.js';
import { promises as fs } from 'fs';
import { join } from 'path';
import { tmpdir } from 'os';

describe('🎥 PICTURE-IN-PICTURE TESTS', () => {
  let testDir: string;
  
  beforeAll(async () => {
    testDir = join(tmpdir(), 'pip-tests-' + Date.now());
    await fs.mkdir(testDir, { recursive: true });
  });
  
  afterAll(async () => {
    try {
      await fs.rm(testDir, { recursive: true, force: true });
    } catch (e) {
      console.error('Cleanup error:', e);
    }
  });

  describe('📌 Basic PiP Functionality', () => {
    test('should add basic picture-in-picture', () => {
      const timeline = new Timeline().addVideo('main.mp4');
      
      const withPiP = PictureInPicture.add(timeline, 'pip.mp4', {
        position: 'bottom-right',
        scale: 0.25
      });
      
      const command = withPiP.getCommand('output.mp4');
      expect(command).toContain('overlay');
      expect(command).toContain('scale=iw*0.25:ih*0.25');
    });

    test('should support all position presets', () => {
      const positions = ['top-left', 'top-right', 'bottom-left', 'bottom-right', 'center'];
      const timeline = new Timeline().addVideo('main.mp4');
      
      positions.forEach(position => {
        const withPiP = PictureInPicture.add(timeline, 'pip.mp4', {
          position: position as any
        });
        
        const command = withPiP.getCommand('output.mp4');
        expect(command).toContain('overlay');
      });
    });

    test('should support custom positioning', () => {
      const timeline = new Timeline().addVideo('main.mp4');
      
      const withPiP = PictureInPicture.add(timeline, 'pip.mp4', {
        position: 'custom',
        customPosition: { x: 100, y: 200 }
      });
      
      const command = withPiP.getCommand('output.mp4');
      expect(command).toContain('overlay=100:200');
    });

    test('should support percentage positioning', () => {
      const timeline = new Timeline().addVideo('main.mp4');
      
      const withPiP = PictureInPicture.add(timeline, 'pip.mp4', {
        position: 'custom',
        customPosition: { x: '25%', y: '75%' }
      });
      
      const command = withPiP.getCommand('output.mp4');
      expect(command).toContain('overlay=25%:75%');
    });
  });

  describe('🎨 Styling Options', () => {
    test('should apply border radius', () => {
      const timeline = new Timeline().addVideo('main.mp4');
      
      const withPiP = PictureInPicture.add(timeline, 'pip.mp4', {
        borderRadius: 15,
        scale: 0.3
      });
      
      const command = withPiP.getCommand('output.mp4');
      expect(command).toContain('geq');
    });

    test('should apply border', () => {
      const timeline = new Timeline().addVideo('main.mp4');
      
      const withPiP = PictureInPicture.add(timeline, 'pip.mp4', {
        borderWidth: 3,
        borderColor: '#ff0000'
      });
      
      const command = withPiP.getCommand('output.mp4');
      expect(command).toContain('drawbox');
      expect(command).toContain('#ff0000');
    });

    test('should apply shadow', () => {
      const timeline = new Timeline().addVideo('main.mp4');
      
      const withPiP = PictureInPicture.add(timeline, 'pip.mp4', {
        shadow: true
      });
      
      const command = withPiP.getCommand('output.mp4');
      expect(command).toContain('boxblur');
    });

    test('should apply custom shadow', () => {
      const timeline = new Timeline().addVideo('main.mp4');
      
      const withPiP = PictureInPicture.add(timeline, 'pip.mp4', {
        shadow: {
          blur: 10,
          color: 'black@0.7',
          offsetX: 5,
          offsetY: 5
        }
      });
      
      const command = withPiP.getCommand('output.mp4');
      expect(command).toContain('boxblur=10:10');
    });

    test('should apply opacity', () => {
      const timeline = new Timeline().addVideo('main.mp4');
      
      const withPiP = PictureInPicture.add(timeline, 'pip.mp4', {
        opacity: 0.7
      });
      
      const command = withPiP.getCommand('output.mp4');
      expect(command).toContain('colorchannelmixer=aa=0.7');
    });

    test('should apply blur effect', () => {
      const timeline = new Timeline().addVideo('main.mp4');
      
      const withPiP = PictureInPicture.add(timeline, 'pip.mp4', {
        blur: 5
      });
      
      const command = withPiP.getCommand('output.mp4');
      expect(command).toContain('boxblur=5:5');
    });

    test('should apply rotation', () => {
      const timeline = new Timeline().addVideo('main.mp4');
      
      const withPiP = PictureInPicture.add(timeline, 'pip.mp4', {
        rotation: 45
      });
      
      const command = withPiP.getCommand('output.mp4');
      expect(command).toContain('rotate=45*PI/180');
    });

    test('should apply flips', () => {
      const timeline = new Timeline().addVideo('main.mp4');
      
      const withPiP = PictureInPicture.add(timeline, 'pip.mp4', {
        flipHorizontal: true,
        flipVertical: true
      });
      
      const command = withPiP.getCommand('output.mp4');
      expect(command).toContain('hflip');
      expect(command).toContain('vflip');
    });
  });

  describe('🎬 Animation Options', () => {
    test('should apply slide-in animation', () => {
      const timeline = new Timeline().addVideo('main.mp4');
      
      const withPiP = PictureInPicture.add(timeline, 'pip.mp4', {
        animation: 'slide-in',
        animationDuration: 1.0,
        animationDelay: 0.5
      });
      
      const command = withPiP.getCommand('output.mp4');
      expect(command).toContain('if(lt(t,');
    });

    test('should apply fade-in animation', () => {
      const timeline = new Timeline().addVideo('main.mp4');
      
      const withPiP = PictureInPicture.add(timeline, 'pip.mp4', {
        animation: 'fade-in',
        animationDuration: 0.5
      });
      
      const command = withPiP.getCommand('output.mp4');
      expect(command).toContain('enable=');
    });

    test('should apply bounce-in animation', () => {
      const timeline = new Timeline().addVideo('main.mp4');
      
      const withPiP = PictureInPicture.add(timeline, 'pip.mp4', {
        animation: 'bounce-in',
        animationDuration: 1.0
      });
      
      const command = withPiP.getCommand('output.mp4');
      expect(command).toContain('sin(');
    });

    test('should apply zoom-in animation', () => {
      const timeline = new Timeline().addVideo('main.mp4');
      
      const withPiP = PictureInPicture.add(timeline, 'pip.mp4', {
        animation: 'zoom-in',
        animationDuration: 0.8
      });
      
      const command = withPiP.getCommand('output.mp4');
      expect(command).toContain('(W-w)/2');
      expect(command).toContain('(H-h)/2');
    });
  });

  describe('🎵 Audio Handling', () => {
    test('should mute PiP audio', () => {
      const timeline = new Timeline().addVideo('main.mp4');
      
      const withPiP = PictureInPicture.add(timeline, 'pip.mp4', {
        audioMix: 'mute'
      });
      
      const command = withPiP.getCommand('output.mp4');
      // Should not contain audio from PiP
      expect(command).toContain('[1:v]');
    });

    test('should duck PiP audio', () => {
      const timeline = new Timeline().addVideo('main.mp4');
      
      const withPiP = PictureInPicture.add(timeline, 'pip.mp4', {
        audioMix: 'duck'
      });
      
      const layers = withPiP.getLayers();
      const audioLayer = layers.find(l => l.type === 'audio' && l.source === 'pip.mp4');
      expect(audioLayer?.volume).toBe(0.3);
    });

    test('should use custom audio volume', () => {
      const timeline = new Timeline().addVideo('main.mp4');
      
      const withPiP = PictureInPicture.add(timeline, 'pip.mp4', {
        audioMix: 0.5
      });
      
      const layers = withPiP.getLayers();
      const audioLayer = layers.find(l => l.type === 'audio' && l.source === 'pip.mp4');
      expect(audioLayer?.volume).toBe(0.5);
    });
  });

  describe('⏰ Timing Control', () => {
    test('should respect start and end times', () => {
      const timeline = new Timeline().addVideo('main.mp4', { duration: 30 });
      
      const withPiP = PictureInPicture.add(timeline, 'pip.mp4', {
        startTime: 5,
        endTime: 15
      });
      
      const command = withPiP.getCommand('output.mp4');
      expect(command).toContain("enable='between(t,5,15)'");
    });

    test('should handle open-ended duration', () => {
      const timeline = new Timeline().addVideo('main.mp4', { duration: 30 });
      
      const withPiP = PictureInPicture.add(timeline, 'pip.mp4', {
        startTime: 10
      });
      
      const command = withPiP.getCommand('output.mp4');
      expect(command).toContain("enable='between(t,10,inf)'");
    });
  });

  describe('🎯 Multiple PiP', () => {
    test('should add multiple PiP videos in grid layout', () => {
      const timeline = new Timeline().addVideo('main.mp4');
      
      const multiPiP = PictureInPicture.addMultiple(timeline, {
        videos: [
          { source: 'cam1.mp4', options: {} },
          { source: 'cam2.mp4', options: {} },
          { source: 'cam3.mp4', options: {} },
          { source: 'cam4.mp4', options: {} }
        ],
        layout: 'grid'
      });
      
      const layers = multiPiP.getLayers();
      const videoLayers = layers.filter(l => l.type === 'video');
      expect(videoLayers.length).toBeGreaterThanOrEqual(5); // Main + 4 PiP
    });

    test('should add multiple PiP videos in stack layout', () => {
      const timeline = new Timeline().addVideo('main.mp4');
      
      const multiPiP = PictureInPicture.addMultiple(timeline, {
        videos: [
          { source: 'feed1.mp4', options: {} },
          { source: 'feed2.mp4', options: {} },
          { source: 'feed3.mp4', options: {} }
        ],
        layout: 'stack'
      });
      
      const command = multiPiP.getCommand('output.mp4');
      expect(command).toContain('feed1.mp4');
      expect(command).toContain('feed2.mp4');
      expect(command).toContain('feed3.mp4');
    });

    test('should add multiple PiP videos in carousel layout', () => {
      const timeline = new Timeline().addVideo('main.mp4');
      
      const multiPiP = PictureInPicture.addMultiple(timeline, {
        videos: [
          { source: 'item1.mp4', options: {} },
          { source: 'item2.mp4', options: {} },
          { source: 'item3.mp4', options: {} },
          { source: 'item4.mp4', options: {} },
          { source: 'item5.mp4', options: {} },
          { source: 'item6.mp4', options: {} }
        ],
        layout: 'carousel'
      });
      
      const command = multiPiP.getCommand('output.mp4');
      // Should arrange in circle
      expect(command).toContain('overlay');
    });
  });

  describe('🎮 Specialized Layouts', () => {
    test('should create reaction video layout', () => {
      const reaction = PictureInPicture.createReactionLayout(
        'content.mp4',
        'reaction.mp4',
        {
          reactionPosition: 'bottom-right',
          reactionScale: 0.3,
          reactionShape: 'circle'
        }
      );
      
      const command = reaction.getCommand('reaction-video.mp4');
      expect(command).toContain('content.mp4');
      expect(command).toContain('reaction.mp4');
      expect(command).toContain('geq'); // For circle shape
    });

    test('should create webcam overlay', () => {
      const timeline = new Timeline().addVideo('gameplay.mp4');
      
      const withWebcam = PictureInPicture.createWebcamOverlay(timeline, 'webcam.mp4', {
        shape: 'circle',
        position: 'bottom-left',
        pulseEffect: true,
        scale: 0.2
      });
      
      const command = withWebcam.getCommand('stream.mp4');
      expect(command).toContain('webcam.mp4');
      expect(command).toContain('drawbox'); // For pulse effect border
    });
  });

  describe('🔧 Timeline Extension', () => {
    test('should add addPictureInPicture method to Timeline', () => {
      const timeline = new Timeline().addVideo('main.mp4');
      
      const withPiP = timeline.addPictureInPicture('overlay.mp4', {
        position: 'top-right',
        scale: 0.2
      });
      
      expect(withPiP).toBeInstanceOf(Timeline);
      const command = withPiP.getCommand('output.mp4');
      expect(command).toContain('overlay.mp4');
    });
  });

  describe('🎯 Edge Cases', () => {
    test('should handle PiP with custom size', () => {
      const timeline = new Timeline().addVideo('main.mp4');
      
      const withPiP = PictureInPicture.add(timeline, 'pip.mp4', {
        size: { width: 320, height: 240 }
      });
      
      const command = withPiP.getCommand('output.mp4');
      expect(command).toContain('scale=320:240');
    });

    test('should handle PiP with percentage size', () => {
      const timeline = new Timeline().addVideo('main.mp4');
      
      const withPiP = PictureInPicture.add(timeline, 'pip.mp4', {
        size: { width: '30%', height: '30%' }
      });
      
      const command = withPiP.getCommand('output.mp4');
      expect(command).toContain('scale=30%:30%');
    });

    test('should handle PiP without maintaining aspect ratio', () => {
      const timeline = new Timeline().addVideo('main.mp4');
      
      const withPiP = PictureInPicture.add(timeline, 'pip.mp4', {
        maintainAspectRatio: false,
        size: { width: 400, height: 200 }
      });
      
      const command = withPiP.getCommand('output.mp4');
      expect(command).toContain('scale=400:200');
      expect(command).not.toContain('force_original_aspect_ratio');
    });

    test('should handle empty multi-PiP', () => {
      const timeline = new Timeline().addVideo('main.mp4');
      
      const multiPiP = PictureInPicture.addMultiple(timeline, {
        videos: []
      });
      
      // Should return original timeline
      expect(multiPiP.getLayers()).toHaveLength(1);
    });
  });

  describe('🎨 Complex Compositions', () => {
    test('should create multi-camera sports broadcast', () => {
      const timeline = new Timeline().addVideo('field-wide.mp4');
      
      const broadcast = PictureInPicture.addMultiple(timeline, {
        videos: [
          { 
            source: 'player-cam.mp4', 
            options: { 
              position: 'top-left',
              scale: 0.2,
              borderWidth: 2,
              borderColor: '#ffffff'
            }
          },
          { 
            source: 'coach-cam.mp4', 
            options: { 
              position: 'top-right',
              scale: 0.2,
              borderWidth: 2,
              borderColor: '#ffffff'
            }
          },
          { 
            source: 'replay.mp4', 
            options: { 
              position: 'bottom-left',
              scale: 0.25,
              animation: 'slide-in',
              animationDelay: 2
            }
          }
        ],
        layout: 'custom'
      });
      
      const layers = broadcast.getLayers();
      expect(layers.filter(l => l.type === 'video').length).toBeGreaterThanOrEqual(4);
    });

    test('should create security camera grid', () => {
      const timeline = new Timeline().addVideo('black.mp4'); // Black background
      
      const security = PictureInPicture.addMultiple(timeline, {
        videos: Array.from({ length: 9 }, (_, i) => ({
          source: `camera${i + 1}.mp4`,
          options: {
            audioMix: 'mute',
            borderWidth: 1,
            borderColor: '#333333'
          }
        })),
        layout: 'grid',
        spacing: 5
      });
      
      const command = security.getCommand('security-grid.mp4');
      expect(command).toContain('camera1.mp4');
      expect(command).toContain('camera9.mp4');
    });

    test('should create news broadcast with lower third', () => {
      const timeline = new Timeline()
        .addVideo('news-feed.mp4')
        .addText('BREAKING NEWS', {
          position: { x: 50, y: '80%' },
          style: {
            fontSize: 48,
            color: '#ffffff',
            backgroundColor: '#ff0000'
          }
        });
      
      const newscast = PictureInPicture.add(timeline, 'reporter.mp4', {
        position: 'custom',
        customPosition: { x: '70%', y: '60%' },
        scale: 0.3,
        borderRadius: 10,
        shadow: true,
        animation: 'zoom-in'
      });
      
      const command = newscast.getCommand('newscast.mp4');
      expect(command).toContain('BREAKING NEWS');
      expect(command).toContain('reporter.mp4');
    });
  });
});
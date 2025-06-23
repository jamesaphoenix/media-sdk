import { describe, test, expect } from 'vitest';
import { Timeline } from '../timeline/timeline.js';
import { PictureInPicture } from '../effects/picture-in-picture.js';

describe('Green Screen / Chromakey', () => {
  describe('Basic Chromakey', () => {
    test('should add video with chromakey filter', () => {
      const timeline = new Timeline()
        .addVideo('background.mp4');
      
      const result = PictureInPicture.addWithChromaKey(timeline, 'greenscreen.mp4', {
        chromaKey: '#00FF00',
        chromaSimilarity: 0.4,
        chromaBlend: 0.1
      });
      
      const command = result.getCommand('output.mp4');
      
      expect(command).toContain('chromakey');
      expect(command).toContain('color=0x00FF00');
      expect(command).toContain('similarity=0.4');
      expect(command).toContain('blend=0.1');
    });

    test('should handle different chroma colors', () => {
      const timeline = new Timeline()
        .addVideo('background.mp4');
      
      // Blue screen
      const blueScreen = PictureInPicture.addWithChromaKey(timeline, 'bluescreen.mp4', {
        chromaKey: '#0000FF',
        chromaSimilarity: 0.35
      });
      
      const command = blueScreen.getCommand('output.mp4');
      expect(command).toContain('color=0x0000FF');
      
      // Magenta screen
      const magentaScreen = PictureInPicture.addWithChromaKey(timeline, 'magentascreen.mp4', {
        chromaKey: '#FF00FF',
        chromaSimilarity: 0.45
      });
      
      const command2 = magentaScreen.getCommand('output.mp4');
      expect(command2).toContain('color=0xFF00FF');
    });

    test('should support YUV color space', () => {
      const timeline = new Timeline()
        .addVideo('background.mp4');
      
      const result = PictureInPicture.addWithChromaKey(timeline, 'greenscreen.mp4', {
        chromaKey: '#00FF00',
        chromaYuv: true
      });
      
      const command = result.getCommand('output.mp4');
      expect(command).toContain('yuv=true');
    });
  });

  describe('Chromakey with PiP Features', () => {
    test('should combine chromakey with positioning', () => {
      const timeline = new Timeline()
        .addVideo('background.mp4');
      
      const result = PictureInPicture.addWithChromaKey(timeline, 'greenscreen.mp4', {
        chromaKey: '#00FF00',
        position: 'bottom-right',
        scale: 0.3
      });
      
      const command = result.getCommand('output.mp4');
      expect(command).toContain('chromakey');
      expect(command).toContain('scale=iw*0.3:ih*0.3');
      expect(command).toContain('overlay');
    });

    test('should add shadow to chromakeyed video', () => {
      const timeline = new Timeline()
        .addVideo('background.mp4');
      
      const result = PictureInPicture.addWithChromaKey(timeline, 'greenscreen.mp4', {
        chromaKey: '#00FF00',
        shadow: true
      });
      
      const command = result.getCommand('output.mp4');
      expect(command).toContain('boxblur');
      expect(command).toContain('[shadow]');
    });

    test('should apply border radius to chromakeyed video', () => {
      const timeline = new Timeline()
        .addVideo('background.mp4');
      
      const result = PictureInPicture.addWithChromaKey(timeline, 'greenscreen.mp4', {
        chromaKey: '#00FF00',
        borderRadius: 20
      });
      
      const command = result.getCommand('output.mp4');
      expect(command).toContain('geq=');
    });

    test('should handle opacity for chromakeyed video', () => {
      const timeline = new Timeline()
        .addVideo('background.mp4');
      
      const result = PictureInPicture.addWithChromaKey(timeline, 'greenscreen.mp4', {
        chromaKey: '#00FF00',
        opacity: 0.8
      });
      
      const command = result.getCommand('output.mp4');
      expect(command).toContain('colorchannelmixer=aa=0.8');
    });
  });

  describe('Chromakey Timing', () => {
    test('should respect start and end times', () => {
      const timeline = new Timeline()
        .addVideo('background.mp4');
      
      const result = PictureInPicture.addWithChromaKey(timeline, 'greenscreen.mp4', {
        chromaKey: '#00FF00',
        startTime: 5,
        endTime: 15
      });
      
      const command = result.getCommand('output.mp4');
      expect(command).toContain("enable='between(t,5,15)'");
    });

    test('should handle only start time', () => {
      const timeline = new Timeline()
        .addVideo('background.mp4');
      
      const result = PictureInPicture.addWithChromaKey(timeline, 'greenscreen.mp4', {
        chromaKey: '#00FF00',
        startTime: 10
      });
      
      const command = result.getCommand('output.mp4');
      expect(command).toContain("enable='between(t,10,inf)'");
    });
  });

  describe('Chromakey Audio', () => {
    test('should handle audio mixing options', () => {
      const timeline = new Timeline()
        .addVideo('background.mp4');
      
      // Muted
      const muted = PictureInPicture.addWithChromaKey(timeline, 'greenscreen.mp4', {
        chromaKey: '#00FF00',
        audioMix: 'mute'
      });
      
      expect(muted.toJSON().layers.filter(l => l.type === 'audio')).toHaveLength(0);
      
      // Duck audio
      const ducked = PictureInPicture.addWithChromaKey(timeline, 'greenscreen.mp4', {
        chromaKey: '#00FF00',
        audioMix: 'duck'
      });
      
      const audioLayer = ducked.toJSON().layers.find(l => l.type === 'audio');
      expect(audioLayer?.options?.volume).toBe(0.3);
      
      // Full audio
      const full = PictureInPicture.addWithChromaKey(timeline, 'greenscreen.mp4', {
        chromaKey: '#00FF00',
        audioMix: 'full'
      });
      
      const fullAudioLayer = full.toJSON().layers.find(l => l.type === 'audio');
      expect(fullAudioLayer?.options?.volume).toBe(1);
      
      // Custom volume
      const custom = PictureInPicture.addWithChromaKey(timeline, 'greenscreen.mp4', {
        chromaKey: '#00FF00',
        audioMix: 0.75
      });
      
      const customAudioLayer = custom.toJSON().layers.find(l => l.type === 'audio');
      expect(customAudioLayer?.options?.volume).toBe(0.75);
    });
  });

  describe('Complex Chromakey Scenarios', () => {
    test('should create multi-layer chromakey composition', () => {
      let timeline = new Timeline()
        .addVideo('background.mp4')
        .setDuration(20);
      
      // Add first person
      timeline = PictureInPicture.addWithChromaKey(timeline, 'person1.mp4', {
        chromaKey: '#00FF00',
        position: 'custom',
        customPosition: { x: '20%', y: '50%' },
        scale: 0.3
      });
      
      // Add second person
      timeline = PictureInPicture.addWithChromaKey(timeline, 'person2.mp4', {
        chromaKey: '#00FF00',
        position: 'custom',
        customPosition: { x: '70%', y: '50%' },
        scale: 0.3,
        flipHorizontal: true
      });
      
      // Add third person
      timeline = PictureInPicture.addWithChromaKey(timeline, 'person3.mp4', {
        chromaKey: '#00FF00',
        position: 'center',
        scale: 0.25,
        borderRadius: 999 // Circle
      });
      
      const command = timeline.getCommand('output.mp4');
      const chromakeyCount = (command.match(/chromakey/g) || []).length;
      expect(chromakeyCount).toBe(3);
    });

    test('should handle webcam overlay with chromakey', () => {
      const timeline = new Timeline()
        .addVideo('gameplay.mp4');
      
      const result = PictureInPicture.createWebcamOverlay(timeline, 'webcam-greenscreen.mp4', {
        shape: 'circle',
        position: 'bottom-right',
        scale: 0.2,
        greenScreen: true,
        chromaKey: '#00FF00'
      });
      
      const command = result.getCommand('output.mp4');
      expect(command).toContain('chromakey');
      // Border radius is implemented as geq filter for circular shape
      expect(command).toContain('geq=');
    });

    test('should create meme with chromakey and text', () => {
      const timeline = new Timeline()
        .addVideo('meme-background.mp4')
        .setAspectRatio('9:16');
      
      const withChromakey = PictureInPicture.addWithChromaKey(timeline, 'reaction.mp4', {
        chromaKey: '#00FF00',
        position: 'center',
        scale: 0.5,
        shadow: true
      });
      
      const withText = withChromakey
        .addText('WHEN YOU SEE IT', {
          position: { x: 'center', y: '10%' },
          style: {
            fontSize: 48,
            color: '#ffffff',
            fontFamily: 'Impact',
            strokeColor: '#000000',
            strokeWidth: 3
          }
        })
        .addText('😱😱😱', {
          position: { x: 'center', y: '85%' },
          style: {
            fontSize: 64,
            color: '#ffff00'
          }
        });
      
      const command = withText.getCommand('output.mp4');
      expect(command).toContain('chromakey');
      expect(command).toContain('drawtext');
      expect(command).toContain('Impact');
    });
  });

  describe('Chromakey Edge Cases', () => {
    test('should handle missing chromaKey parameter', () => {
      const timeline = new Timeline()
        .addVideo('background.mp4');
      
      const result = PictureInPicture.addWithChromaKey(timeline, 'greenscreen.mp4', {
        // No chromaKey specified, should default to green
        position: 'center'
      });
      
      const command = result.getCommand('output.mp4');
      expect(command).toContain('color=0x00FF00'); // Default green
    });

    test('should validate chromaSimilarity range', () => {
      const timeline = new Timeline()
        .addVideo('background.mp4');
      
      // Should clamp values between 0 and 1
      const result1 = PictureInPicture.addWithChromaKey(timeline, 'greenscreen.mp4', {
        chromaKey: '#00FF00',
        chromaSimilarity: 1.5 // Should be clamped to valid range
      });
      
      const result2 = PictureInPicture.addWithChromaKey(timeline, 'greenscreen.mp4', {
        chromaKey: '#00FF00',
        chromaSimilarity: -0.5 // Should be clamped to valid range
      });
      
      // Commands should still be valid
      expect(() => result1.getCommand('output.mp4')).not.toThrow();
      expect(() => result2.getCommand('output.mp4')).not.toThrow();
    });

    test('should handle invalid hex colors gracefully', () => {
      const timeline = new Timeline()
        .addVideo('background.mp4');
      
      const result = PictureInPicture.addWithChromaKey(timeline, 'greenscreen.mp4', {
        chromaKey: 'not-a-color' // Invalid color
      });
      
      const command = result.getCommand('output.mp4');
      expect(command).toContain('color='); // Should still generate a color
    });
  });
});
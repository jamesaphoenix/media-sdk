import { describe, it, expect, beforeEach } from 'vitest';
import { Timeline } from '../timeline/timeline.js';

describe('Timeline', () => {
  let timeline: Timeline;

  beforeEach(() => {
    timeline = new Timeline();
  });

  describe('Video Operations', () => {
    it('should add video to timeline', () => {
      const result = timeline.addVideo('test.mp4');
      
      expect(result).toBeInstanceOf(Timeline);
      expect(result).not.toBe(timeline); // Immutable
      expect(result.getDuration()).toBeGreaterThan(0);
    });

    it('should add video with options', () => {
      const result = timeline.addVideo('test.mp4', {
        start: 10,
        duration: 30,
        position: 0
      });
      
      expect(result).toBeInstanceOf(Timeline);
    });

    it('should trim video', () => {
      const result = timeline
        .addVideo('test.mp4')
        .trim(10, 60);
      
      const command = result.getCommand('output.mp4');
      expect(command).toContain('-ss 10');
      expect(command).toContain('-t 50'); // duration = end - start
    });

    it('should scale video', () => {
      const result = timeline
        .addVideo('test.mp4')
        .scale(1920, 1080);
      
      const command = result.getCommand('output.mp4');
      expect(command).toContain('scale=1920:1080');
    });

    it('should crop video', () => {
      const result = timeline
        .addVideo('test.mp4')
        .crop({ width: 1080, height: 1920, x: 420, y: 0 });
      
      const command = result.getCommand('output.mp4');
      expect(command).toContain('crop=1080:1920:420:0');
    });

    it('should set aspect ratio', () => {
      const result = timeline
        .addVideo('test.mp4')
        .setAspectRatio('16:9');
      
      expect(result).toBeInstanceOf(Timeline);
    });

    it('should set frame rate', () => {
      const result = timeline
        .addVideo('test.mp4')
        .setFrameRate(30);
      
      expect(result).toBeInstanceOf(Timeline);
    });
  });

  describe('Text Operations', () => {
    it('should add text overlay', () => {
      const result = timeline
        .addVideo('test.mp4')
        .addText('Hello World');
      
      const command = result.getCommand('output.mp4');
      expect(command).toContain('drawtext');
      expect(command).toContain('Hello World');
    });

    it('should add text with position', () => {
      const result = timeline
        .addVideo('test.mp4')
        .addText('Hello World', { position: 'center' });
      
      const command = result.getCommand('output.mp4');
      expect(command).toContain('drawtext');
      expect(command).toContain('(w-text_w)/2');
    });

    it('should add text with custom position', () => {
      const result = timeline
        .addVideo('test.mp4')
        .addText('Hello World', { 
          position: { x: 100, y: 200 }
        });
      
      const command = result.getCommand('output.mp4');
      expect(command).toContain('x=100:y=200');
    });

    it('should add text with styling', () => {
      const result = timeline
        .addVideo('test.mp4')
        .addText('Hello World', {
          style: {
            fontSize: 48,
            color: 'red',
            backgroundColor: 'blue'
          }
        });
      
      const command = result.getCommand('output.mp4');
      expect(command).toContain('fontsize=48');
      expect(command).toContain('fontcolor=red');
    });

    it('should add text with timing', () => {
      const result = timeline
        .addVideo('test.mp4')
        .addText('Hello World', {
          startTime: 2,
          duration: 5
        });
      
      const command = result.getCommand('output.mp4');
      expect(command).toContain('between(t,2,7)'); // start + duration
    });
  });

  describe('Image Operations', () => {
    it('should add image overlay', () => {
      const result = timeline
        .addVideo('test.mp4')
        .addImage('logo.png');
      
      const command = result.getCommand('output.mp4');
      expect(command).toContain('logo.png');
      expect(command).toContain('overlay');
    });

    it('should add watermark', () => {
      const result = timeline
        .addVideo('test.mp4')
        .addWatermark('logo.png', { position: 'bottom-right' });
      
      expect(result).toBeInstanceOf(Timeline);
    });

    it('should add image with custom position', () => {
      const result = timeline
        .addVideo('test.mp4')
        .addImage('logo.png', {
          position: { x: 50, y: 100 },
          scale: 0.5,
          opacity: 0.8
        });
      
      expect(result).toBeInstanceOf(Timeline);
    });
  });

  describe('Audio Operations', () => {
    it('should add audio track', () => {
      const result = timeline
        .addVideo('test.mp4')
        .addAudio('music.mp3');
      
      expect(result).toBeInstanceOf(Timeline);
    });

    it('should add audio with options', () => {
      const result = timeline
        .addVideo('test.mp4')
        .addAudio('music.mp3', {
          volume: 0.8,
          fadeIn: 2,
          fadeOut: 3
        });
      
      expect(result).toBeInstanceOf(Timeline);
    });
  });

  describe('Filter Operations', () => {
    it('should add filter', () => {
      const result = timeline
        .addVideo('test.mp4')
        .addFilter('blur', { radius: 5 });
      
      const command = result.getCommand('output.mp4');
      expect(command).toContain('boxblur=5');
    });

    it('should add multiple filters', () => {
      const result = timeline
        .addVideo('test.mp4')
        .addFilter('brightness', { value: 0.2 })
        .addFilter('contrast', { value: 1.5 });
      
      const command = result.getCommand('output.mp4');
      expect(command).toContain('eq=brightness=0.2');
      expect(command).toContain('eq=contrast=1.5');
    });
  });

  describe('Functional Composition', () => {
    it('should support pipe operations', () => {
      const transform = (t: Timeline) => t.scale(1920, 1080);
      
      const result = timeline
        .addVideo('test.mp4')
        .pipe(transform);
      
      const command = result.getCommand('output.mp4');
      expect(command).toContain('scale=1920:1080');
    });

    it('should chain multiple operations', () => {
      const result = timeline
        .addVideo('test.mp4')
        .trim(10, 60)
        .scale(1920, 1080)
        .addText('Title', { position: 'top' })
        .addWatermark('logo.png');
      
      expect(result).toBeInstanceOf(Timeline);
      expect(result.getDuration()).toBeGreaterThan(0);
    });
  });

  describe('Timeline Manipulation', () => {
    it('should concatenate timelines', () => {
      const timeline1 = new Timeline().addVideo('video1.mp4');
      const timeline2 = new Timeline().addVideo('video2.mp4');
      
      const result = timeline1.concat(timeline2);
      
      expect(result).toBeInstanceOf(Timeline);
      expect(result.getDuration()).toBeGreaterThan(timeline1.getDuration());
    });

    it('should calculate duration correctly', () => {
      const result = timeline
        .addVideo('test.mp4', { duration: 10 })
        .addText('Title', { startTime: 5, duration: 5 });
      
      expect(result.getDuration()).toBe(10);
    });
  });

  describe('Command Generation', () => {
    it('should generate basic FFmpeg command', () => {
      const result = timeline.addVideo('input.mp4');
      const command = result.getCommand('output.mp4');
      
      expect(command).toMatch(/^ffmpeg/);
      expect(command).toContain('-i input.mp4');
      expect(command).toContain('output.mp4');
      expect(command).toContain('-c:v');
      expect(command).toContain('-y'); // Overwrite
    });

    it('should include render options', () => {
      const result = timeline.addVideo('input.mp4');
      const command = result.getCommand('output.mp4', {
        quality: 'high',
        codec: 'h265',
        bitrate: '10M'
      });
      
      expect(command).toContain('h265');
      expect(command).toContain('-b:v 10M');
      expect(command).toContain('-crf 18'); // High quality
    });

    it('should handle hardware acceleration', () => {
      const result = timeline.addVideo('input.mp4');
      const command = result.getCommand('output.mp4', {
        hardwareAcceleration: 'cuda'
      });
      
      expect(command).toContain('-hwaccel cuda');
    });

    it('should return command without execution', () => {
      const result = timeline.addVideo('input.mp4');
      const command = result.getCommand('output.mp4', { execute: false });
      
      expect(typeof command).toBe('string');
      expect(command).toContain('ffmpeg');
    });
  });

  describe('Serialization', () => {
    it('should serialize to JSON', () => {
      const result = timeline
        .addVideo('test.mp4')
        .addText('Hello', { position: 'center' });
      
      const json = result.toJSON();
      
      expect(json).toHaveProperty('layers');
      expect(json).toHaveProperty('globalOptions');
      expect(Array.isArray(json.layers)).toBe(true);
    });

    it('should deserialize from JSON', () => {
      const original = timeline
        .addVideo('test.mp4')
        .addText('Hello', { position: 'center' });
      
      const json = original.toJSON();
      const restored = Timeline.fromJSON(json);
      
      expect(restored).toBeInstanceOf(Timeline);
      expect(restored.getCommand('output.mp4')).toBe(original.getCommand('output.mp4'));
    });

    it('should handle empty timeline serialization', () => {
      const json = timeline.toJSON();
      const restored = Timeline.fromJSON(json);
      
      expect(restored).toBeInstanceOf(Timeline);
      expect(restored.getDuration()).toBe(0);
    });
  });

  describe('Immutability', () => {
    it('should maintain immutability', () => {
      const original = timeline.addVideo('test.mp4');
      const modified = original.addText('Hello');
      
      expect(original).not.toBe(modified);
      expect(original.getDuration()).not.toBe(modified.getDuration());
    });

    it('should allow branching', () => {
      const base = timeline.addVideo('test.mp4');
      const branch1 = base.addText('Branch 1');
      const branch2 = base.addText('Branch 2');
      
      expect(branch1).not.toBe(branch2);
      expect(branch1.getCommand('out1.mp4')).not.toBe(branch2.getCommand('out2.mp4'));
    });
  });

  describe('Error Handling', () => {
    it('should handle missing required parameters', () => {
      expect(() => {
        timeline.getCommand(''); // Empty output path
      }).not.toThrow();
    });

    it('should handle invalid positions gracefully', () => {
      const result = timeline
        .addVideo('test.mp4')
        .addText('Hello', { position: 'invalid-position' as any });
      
      expect(result).toBeInstanceOf(Timeline);
    });

    it('should handle negative durations', () => {
      const result = timeline
        .addVideo('test.mp4')
        .addText('Hello', { duration: -5 });
      
      expect(result).toBeInstanceOf(Timeline);
    });
  });

  describe('Complex Scenarios', () => {
    it('should handle multi-layer composition', () => {
      const result = timeline
        .addVideo('background.mp4')
        .addVideo('overlay.mp4', { position: 5 })
        .addAudio('music.mp3')
        .addImage('logo.png', { position: { x: 100, y: 50 } })
        .addText('Title', { position: 'top', startTime: 0, duration: 3 })
        .addText('Subtitle', { position: 'bottom', startTime: 1, duration: 5 })
        .scale(1920, 1080)
        .addFilter('brightness', { value: 0.1 });
      
      const command = result.getCommand('complex-output.mp4');
      expect(command).toContain('ffmpeg');
      expect(command).toContain('background.mp4');
      expect(command.length).toBeGreaterThan(100); // Complex command
    });

    it('should handle social media workflow', () => {
      const result = timeline
        .addVideo('content.mp4')
        .trim(0, 15)
        .crop({ width: 1080, height: 1920, x: 420, y: 0 })
        .scale(1080, 1920)
        .addText('Check this out! 🔥', {
          position: 'top',
          style: { fontSize: 48, color: 'white' }
        })
        .addWatermark('logo.png', { position: 'bottom-right' })
        .addFilter('brightness', { value: 0.1 })
        .addFilter('saturation', { value: 1.2 });
      
      const command = result.getCommand('tiktok-ready.mp4', { quality: 'high' });
      expect(command).toContain('crop=1080:1920');
      expect(command).toContain('scale=1080:1920');
      expect(command).toContain('Check this out');
    });
  });
});
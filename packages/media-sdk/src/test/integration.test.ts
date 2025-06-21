import { describe, it, expect } from 'vitest';
import { Timeline } from '../timeline/timeline.js';
import { tiktok, youtube, instagram } from '../video/video.js';
import { compose, brightness, contrast, fadeIn } from '../effects/effects.js';
import { addWordByWordCaptions } from '../captions/captions.js';
import { slideshow, titleSlide } from '../slideshow/slideshow.js';

describe('Media SDK Integration Tests', () => {
  describe('Timeline API', () => {
    it('should create a basic timeline', () => {
      const timeline = new Timeline()
        .addVideo('test.mp4')
        .addText('Hello World', { position: 'center' });
      
      expect(timeline).toBeInstanceOf(Timeline);
      expect(timeline.getDuration()).toBeGreaterThan(0);
    });

    it('should generate FFmpeg command', () => {
      const timeline = new Timeline()
        .addVideo('input.mp4')
        .scale(1920, 1080);
      
      const command = timeline.getCommand('output.mp4');
      expect(command).toContain('ffmpeg');
      expect(command).toContain('input.mp4');
      expect(command).toContain('output.mp4');
    });

    it('should support method chaining', () => {
      const timeline = new Timeline()
        .addVideo('test.mp4')
        .trim(0, 10)
        .scale(1920, 1080)
        .addText('Title', { position: 'top' });
      
      expect(timeline).toBeInstanceOf(Timeline);
    });
  });

  describe('Platform Presets', () => {
    it('should create TikTok format', () => {
      const timeline = tiktok('input.mp4');
      const command = timeline.getCommand('output.mp4');
      
      expect(command).toContain('1080:1920'); // 9:16 aspect ratio
    });

    it('should create YouTube format', () => {
      const timeline = youtube('input.mp4');
      const command = timeline.getCommand('output.mp4');
      
      expect(command).toContain('1920:1080'); // 16:9 aspect ratio
    });

    it('should create Instagram square format', () => {
      const timeline = instagram('input.mp4', { format: 'feed' });
      const command = timeline.getCommand('output.mp4');
      
      expect(command).toContain('1080:1080'); // 1:1 aspect ratio
    });
  });

  describe('Effects Composition', () => {
    it('should compose effects functionally', () => {
      const effect = compose(
        brightness(0.2),
        contrast(1.5),
        fadeIn(1)
      );
      
      const timeline = new Timeline()
        .addVideo('input.mp4')
        .pipe(effect);
      
      expect(timeline).toBeInstanceOf(Timeline);
    });

    it('should apply individual effects', () => {
      const timeline = new Timeline()
        .addVideo('input.mp4')
        .pipe(brightness(0.1))
        .pipe(contrast(1.2));
      
      const command = timeline.getCommand('output.mp4');
      expect(command).toContain('eq=brightness'); // Should contain brightness filter
    });
  });

  describe('Caption System', () => {
    it('should add word-by-word captions', () => {
      const words = [
        { word: 'Hello', start: 0, end: 0.5 },
        { word: 'World', start: 0.5, end: 1.0 }
      ];

      const timeline = new Timeline()
        .addVideo('input.mp4')
        .pipe(addWordByWordCaptions(words));
      
      expect(timeline).toBeInstanceOf(Timeline);
    });

    it('should add basic text overlay', () => {
      const timeline = new Timeline()
        .addVideo('input.mp4')
        .addText('Test Caption', {
          position: 'bottom',
          style: { fontSize: 24, color: 'white' }
        });
      
      const command = timeline.getCommand('output.mp4');
      expect(command).toContain('drawtext');
    });
  });

  describe('Slideshow Functionality', () => {
    it('should create a title slide', () => {
      const slide = titleSlide('bg.jpg', 'Title', 'Subtitle');
      expect(slide).toBeInstanceOf(Timeline);
    });

    it('should create slideshow from multiple slides', () => {
      const slides = [
        { image: 'slide1.jpg', duration: 5 },
        { image: 'slide2.jpg', duration: 5 }
      ];

      const presentation = slideshow(slides);
      expect(presentation).toBeInstanceOf(Timeline);
      expect(presentation.getDuration()).toBe(10);
    });
  });

  describe('Complex Workflows', () => {
    it('should handle complete social media workflow', () => {
      const words = [
        { word: 'Check', start: 0, end: 0.3 },
        { word: 'this', start: 0.3, end: 0.6 },
        { word: 'out!', start: 0.6, end: 1.0 }
      ];

      const timeline = tiktok('input.mp4')
        .trim(0, 15)
        .pipe(compose(
          brightness(0.1),
          contrast(1.2)
        ))
        .pipe(addWordByWordCaptions(words))
        .addText('Follow for more! 🔥', {
          position: 'bottom',
          style: { fontSize: 32, color: '#ffff00' }
        });
      
      const command = timeline.getCommand('tiktok-ready.mp4');
      expect(command).toContain('ffmpeg');
      expect(command).toContain('1080:1920'); // TikTok format
    });

    it('should support timeline concatenation', () => {
      const timeline1 = new Timeline().addVideo('video1.mp4');
      const timeline2 = new Timeline().addVideo('video2.mp4');
      
      const combined = timeline1.concat(timeline2);
      expect(combined.getDuration()).toBeGreaterThan(timeline1.getDuration());
    });

    it('should serialize and deserialize timelines', () => {
      const original = new Timeline()
        .addVideo('test.mp4')
        .addText('Test', { position: 'center' });
      
      const json = original.toJSON();
      const restored = Timeline.fromJSON(json);
      
      expect(restored).toBeInstanceOf(Timeline);
      expect(restored.getCommand('output.mp4')).toBe(original.getCommand('output.mp4'));
    });
  });

  describe('Command Generation', () => {
    it('should generate valid FFmpeg commands', () => {
      const timeline = new Timeline()
        .addVideo('input.mp4')
        .addText('Hello', { position: 'center' })
        .scale(1920, 1080);
      
      const command = timeline.getCommand('output.mp4');
      
      // Basic command structure
      expect(command).toMatch(/^ffmpeg/);
      expect(command).toContain('-i input.mp4');
      expect(command).toContain('output.mp4');
      
      // Should contain video processing options
      expect(command).toContain('-c:v');
      expect(command).toContain('-crf');
    });

    it('should handle render options', () => {
      const timeline = new Timeline().addVideo('input.mp4');
      
      const command = timeline.getCommand('output.mp4', {
        quality: 'high',
        codec: 'h265',
        bitrate: '10M'
      });
      
      expect(command).toContain('h265');
      expect(command).toContain('10M');
    });
  });
});
/**
 * API STABILITY TEST SUITE
 * 
 * Ensures core primitives maintain consistent behavior and signatures
 * Tests for backwards compatibility and predictable patterns
 */

import { test, expect, describe } from 'bun:test';
import { Timeline } from '@jamesaphoenix/media-sdk';

describe('🔒 API STABILITY TESTS', () => {
  describe('🎯 Method Signature Consistency', () => {
    test('all add* methods should accept consistent parameters', () => {
      const timeline = new Timeline();
      
      // These should all follow similar patterns
      const videoResult = timeline.addVideo('video.mp4', { duration: 10 });
      const audioResult = timeline.addAudio('audio.mp3', { volume: 0.8 });
      const textResult = timeline.addText('Hello', { position: 'center' });
      const imageResult = timeline.addImage('image.png', { position: 'top-left' });
      
      // All should return Timeline instances
      expect(videoResult).toBeInstanceOf(Timeline);
      expect(audioResult).toBeInstanceOf(Timeline);
      expect(textResult).toBeInstanceOf(Timeline);
      expect(imageResult).toBeInstanceOf(Timeline);
      
      // All should be different instances (immutable)
      expect(videoResult).not.toBe(timeline);
      expect(audioResult).not.toBe(timeline);
      expect(textResult).not.toBe(timeline);
      expect(imageResult).not.toBe(timeline);
    });

    test('all configuration methods should return new Timeline instances', () => {
      const timeline = new Timeline().addVideo('video.mp4');
      
      const trimmed = timeline.trim(0, 10);
      const scaled = timeline.scale(1920, 1080);
      const cropped = timeline.crop({ width: 1080, height: 1080 });
      
      expect(trimmed).toBeInstanceOf(Timeline);
      expect(scaled).toBeInstanceOf(Timeline);
      expect(cropped).toBeInstanceOf(Timeline);
      
      // Immutability check
      expect(trimmed).not.toBe(timeline);
      expect(scaled).not.toBe(timeline);
      expect(cropped).not.toBe(timeline);
    });
  });

  describe('🛡️ Parameter Validation', () => {
    test('should handle null/undefined gracefully', () => {
      const timeline = new Timeline();
      
      // Should not throw, but handle gracefully
      expect(() => timeline.addVideo(null as any)).not.toThrow();
      expect(() => timeline.addVideo(undefined as any)).not.toThrow();
      expect(() => timeline.addText(null as any)).not.toThrow();
      expect(() => timeline.addText(undefined as any)).not.toThrow();
    });

    test('should validate numeric parameters', () => {
      const timeline = new Timeline().addVideo('video.mp4');
      
      // Negative values should be handled
      const negativeTrim = timeline.trim(-5, 10);
      expect(negativeTrim).toBeInstanceOf(Timeline);
      
      // Zero values
      const zeroScale = timeline.scale(0, 0);
      expect(zeroScale).toBeInstanceOf(Timeline);
      
      // Very large values
      const largeScale = timeline.scale(99999, 99999);
      expect(largeScale).toBeInstanceOf(Timeline);
    });

    test('should handle empty strings appropriately', () => {
      const timeline = new Timeline();
      
      // Empty paths
      const emptyVideo = timeline.addVideo('');
      expect(emptyVideo).toBeInstanceOf(Timeline);
      
      // Empty text (already fixed)
      const emptyText = timeline.addText('');
      expect(emptyText).toBeInstanceOf(Timeline);
    });
  });

  describe('🔄 Method Chaining Integrity', () => {
    test('should maintain chainability across all operations', () => {
      // Complex chain should work smoothly
      const result = new Timeline()
        .addVideo('input.mp4')
        .trim(0, 10)
        .scale(1920, 1080)
        .addText('Title', { position: 'top' })
        .addImage('logo.png', { position: 'bottom-right' })
        .addFilter('brightness', { value: 0.2 })
        .addAudio('music.mp3', { volume: 0.5 })
        .setFrameRate(30)
        .setAspectRatio('16:9');
      
      expect(result).toBeInstanceOf(Timeline);
      
      // Should be able to get command
      const command = result.getCommand('output.mp4');
      expect(typeof command).toBe('string');
      expect(command).toContain('ffmpeg');
    });

    test('should handle repeated operations correctly', () => {
      const timeline = new Timeline().addVideo('input.mp4');
      
      // Adding multiple texts
      const multiText = timeline
        .addText('First', { position: 'top' })
        .addText('Second', { position: 'center' })
        .addText('Third', { position: 'bottom' });
      
      expect(multiText).toBeInstanceOf(Timeline);
      
      // Adding multiple filters
      const multiFilter = timeline
        .addFilter('brightness', { value: 0.2 })
        .addFilter('contrast', { value: 1.2 })
        .addFilter('saturation', { value: 1.1 });
      
      expect(multiFilter).toBeInstanceOf(Timeline);
    });
  });

  describe('🎨 Options Object Patterns', () => {
    test('should handle missing options objects', () => {
      const timeline = new Timeline();
      
      // Methods with optional options should work without them
      expect(() => timeline.addVideo('video.mp4')).not.toThrow();
      expect(() => timeline.addAudio('audio.mp3')).not.toThrow();
      expect(() => timeline.addImage('image.png')).not.toThrow();
    });

    test('should ignore unknown options gracefully', () => {
      const timeline = new Timeline();
      
      // Unknown options should be ignored, not cause errors
      const result = timeline.addVideo('video.mp4', {
        unknownOption: 'value',
        anotherUnknown: 123,
        duration: 10 // valid option
      } as any);
      
      expect(result).toBeInstanceOf(Timeline);
    });

    test('should apply sensible defaults', () => {
      const timeline = new Timeline().addVideo('input.mp4');
      
      // Text without position should default to center
      const textDefault = timeline.addText('Hello');
      const command1 = textDefault.getCommand('out1.mp4');
      expect(command1).toContain('drawtext');
      
      // Image without position should have a default
      const imageDefault = timeline.addImage('logo.png');
      const command2 = imageDefault.getCommand('out2.mp4');
      expect(command2).toContain('overlay');
    });
  });

  describe('🚀 Functional Composition', () => {
    test('pipe method should work with any transformation', () => {
      const timeline = new Timeline().addVideo('input.mp4');
      
      // Custom transformation function
      const addTitle = (t: Timeline) => t.addText('Title', { position: 'top' });
      const addCredits = (t: Timeline) => t.addText('Credits', { position: 'bottom' });
      
      const result = timeline
        .pipe(addTitle)
        .pipe(addCredits);
      
      expect(result).toBeInstanceOf(Timeline);
      
      // Should work with arrow functions
      const result2 = timeline
        .pipe(t => t.scale(1920, 1080))
        .pipe(t => t.setFrameRate(30));
      
      expect(result2).toBeInstanceOf(Timeline);
    });

    test('pipe should handle errors gracefully', () => {
      const timeline = new Timeline().addVideo('input.mp4');
      
      // Pipe with function that throws
      const badTransform = (t: Timeline) => {
        throw new Error('Transform error');
      };
      
      expect(() => timeline.pipe(badTransform)).toThrow('Transform error');
      
      // Pipe with function that returns null
      const nullTransform = (t: Timeline) => null as any;
      
      expect(() => timeline.pipe(nullTransform)).not.toThrow();
    });
  });

  describe('🏗️ Platform Presets Consistency', () => {
    test('all platform presets should follow same pattern', () => {
      const timeline = new Timeline().addVideo('input.mp4');
      
      // Word highlighting presets
      const tiktokHL = timeline.addWordHighlighting({
        text: 'TikTok test',
        preset: 'tiktok'
      });
      
      const instagramHL = timeline.addWordHighlighting({
        text: 'Instagram test',
        preset: 'instagram'
      });
      
      const youtubeHL = timeline.addWordHighlighting({
        text: 'YouTube test',
        preset: 'youtube'
      });
      
      // All should return Timeline instances
      expect(tiktokHL).toBeInstanceOf(Timeline);
      expect(instagramHL).toBeInstanceOf(Timeline);
      expect(youtubeHL).toBeInstanceOf(Timeline);
      
      // Caption presets
      const tiktokCap = timeline.addCaptions({
        captions: [{ text: 'Test' }],
        preset: 'tiktok'
      });
      
      expect(tiktokCap).toBeInstanceOf(Timeline);
    });
  });

  describe('🔐 Backwards Compatibility', () => {
    test('should maintain compatibility with existing usage patterns', () => {
      // Pattern 1: Basic video editing
      const basic = new Timeline()
        .addVideo('input.mp4')
        .trim(0, 30)
        .addText('Hello World', { position: 'center' });
      
      expect(basic.getCommand('output.mp4')).toContain('ffmpeg');
      
      // Pattern 2: Complex composition
      const complex = new Timeline()
        .addVideo('bg.mp4')
        .addImage('overlay.png', { position: 'top-left', duration: 5 })
        .addAudio('music.mp3', { volume: 0.7 })
        .addFilter('fade', { type: 'in', duration: 1 });
      
      expect(complex.getCommand('output.mp4')).toContain('ffmpeg');
      
      // Pattern 3: Platform-specific
      const platform = new Timeline()
        .addVideo('source.mp4')
        .setAspectRatio('9:16') // TikTok
        .addWordHighlighting({
          text: 'Viral content here!',
          preset: 'tiktok'
        });
      
      expect(platform.getCommand('tiktok.mp4')).toContain('ffmpeg');
    });

    test('should support both old and new API styles', () => {
      const timeline = new Timeline().addVideo('input.mp4');
      
      // Old style (if any deprecated methods exist)
      // Example: timeline.setText('Hello') vs timeline.addText('Hello')
      
      // New style
      const newStyle = timeline.addText('Hello', { position: 'center' });
      
      expect(newStyle).toBeInstanceOf(Timeline);
    });
  });

  describe('📋 Command Generation Stability', () => {
    test('same inputs should generate consistent commands', () => {
      const timeline1 = new Timeline()
        .addVideo('input.mp4')
        .addText('Hello', { position: 'center' })
        .scale(1920, 1080);
      
      const timeline2 = new Timeline()
        .addVideo('input.mp4')
        .addText('Hello', { position: 'center' })
        .scale(1920, 1080);
      
      const command1 = timeline1.getCommand('output.mp4');
      const command2 = timeline2.getCommand('output.mp4');
      
      // Commands should be identical
      expect(command1).toBe(command2);
    });

    test('order of operations should matter', () => {
      // Scale then crop
      const timeline1 = new Timeline()
        .addVideo('input.mp4')
        .scale(1920, 1080)
        .crop({ width: 1080, height: 1080 });
      
      // Crop then scale
      const timeline2 = new Timeline()
        .addVideo('input.mp4')
        .crop({ width: 1080, height: 1080 })
        .scale(1920, 1080);
      
      const command1 = timeline1.getCommand('output.mp4');
      const command2 = timeline2.getCommand('output.mp4');
      
      // Commands should be different
      expect(command1).not.toBe(command2);
    });
  });
});
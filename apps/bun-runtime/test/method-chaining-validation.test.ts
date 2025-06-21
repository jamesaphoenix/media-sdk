/**
 * Method Chaining Validation Tests
 * 
 * Ensures that all Timeline methods properly return Timeline instances
 * and maintain the fluent interface pattern
 */

import { test, expect, describe } from 'bun:test';
import { Timeline } from '@jamesaphoenix/media-sdk';

describe('🔗 METHOD CHAINING VALIDATION', () => {
  describe('Core Method Chaining', () => {
    test('all methods should return Timeline instances', () => {
      const timeline = new Timeline();
      
      // Video methods
      const afterVideo = timeline.addVideo('test.mp4');
      expect(afterVideo).toBeInstanceOf(Timeline);
      expect(afterVideo).not.toBe(timeline); // Immutable
      
      // Text methods
      const afterText = timeline.addText('Hello');
      expect(afterText).toBeInstanceOf(Timeline);
      expect(afterText).not.toBe(timeline);
      
      // Image methods
      const afterImage = timeline.addImage('image.jpg');
      expect(afterImage).toBeInstanceOf(Timeline);
      expect(afterImage).not.toBe(timeline);
      
      // Audio methods
      const afterAudio = timeline.addAudio('audio.mp3');
      expect(afterAudio).toBeInstanceOf(Timeline);
      expect(afterAudio).not.toBe(timeline);
      
      // Watermark method
      const afterWatermark = timeline.addWatermark('logo.png');
      expect(afterWatermark).toBeInstanceOf(Timeline);
      expect(afterWatermark).not.toBe(timeline);
      
      // Transformation methods
      const afterAspect = timeline.setAspectRatio('16:9');
      expect(afterAspect).toBeInstanceOf(Timeline);
      expect(afterAspect).not.toBe(timeline);
      
      const afterTrim = timeline.trim(0, 10);
      expect(afterTrim).toBeInstanceOf(Timeline);
      expect(afterTrim).not.toBe(timeline);
      
      const afterDuration = timeline.setDuration(30);
      expect(afterDuration).toBeInstanceOf(Timeline);
      expect(afterDuration).not.toBe(timeline);
      
      // Filter method
      const afterFilter = timeline.addFilter('brightness', { brightness: 0.2 });
      expect(afterFilter).toBeInstanceOf(Timeline);
      expect(afterFilter).not.toBe(timeline);
    });
    
    test('complex method chains should work seamlessly', () => {
      const result = new Timeline()
        .addVideo('input.mp4')
        .addText('Title', { position: 'top' })
        .addImage('logo.png', { position: 'bottom-right' })
        .addWatermark('watermark.png')
        .setAspectRatio('16:9')
        .trim(5, 30)
        .addFilter('brightness', { brightness: 0.1 })
        .addFilter('contrast', { contrast: 1.2 })
        .setDuration(25);
      
      expect(result).toBeInstanceOf(Timeline);
      
      // Should be able to generate command after chaining
      const command = result.getCommand('output.mp4');
      expect(command).toContain('ffmpeg');
      expect(command).toContain('input.mp4');
      expect(command).toContain('output.mp4');
    });
    
    test('method chaining should preserve all operations', () => {
      const timeline = new Timeline()
        .addVideo('video1.mp4')
        .addText('First Text')
        .addVideo('video2.mp4')
        .addText('Second Text')
        .addImage('image.jpg');
      
      const command = timeline.getCommand('output.mp4');
      
      // All inputs should be present
      expect(command).toContain('video1.mp4');
      expect(command).toContain('video2.mp4');
      expect(command).toContain('image.jpg');
      
      // All text should be present
      expect(command).toContain('First Text');
      expect(command).toContain('Second Text');
    });
  });
  
  describe('Immutability Validation', () => {
    test('original timeline should remain unchanged after operations', () => {
      const original = new Timeline().addVideo('original.mp4');
      const originalCommand = original.getCommand('original-output.mp4');
      
      // Perform operations on copies
      const modified1 = original.addText('Text 1');
      const modified2 = original.addText('Text 2');
      const modified3 = modified1.addFilter('blur', { radius: 5 });
      
      // Original should be unchanged
      const originalCommandAfter = original.getCommand('original-output.mp4');
      expect(originalCommandAfter).toBe(originalCommand);
      
      // Modified versions should be different
      const command1 = modified1.getCommand('output1.mp4');
      const command2 = modified2.getCommand('output2.mp4');
      const command3 = modified3.getCommand('output3.mp4');
      
      expect(command1).toContain('Text 1');
      expect(command1).not.toContain('Text 2');
      
      expect(command2).toContain('Text 2');
      expect(command2).not.toContain('Text 1');
      
      expect(command3).toContain('Text 1');
      expect(command3).toContain('blur');
    });
    
    test('branching timelines should work independently', () => {
      const base = new Timeline()
        .addVideo('base.mp4')
        .setAspectRatio('16:9');
      
      // Create two branches
      const branch1 = base
        .addText('Branch 1 Title', { position: 'top' })
        .addFilter('brightness', { brightness: 0.2 });
      
      const branch2 = base
        .addText('Branch 2 Title', { position: 'bottom' })
        .addFilter('contrast', { contrast: 1.5 });
      
      const command1 = branch1.getCommand('branch1.mp4');
      const command2 = branch2.getCommand('branch2.mp4');
      
      // Branch 1 specific
      expect(command1).toContain('Branch 1 Title');
      expect(command1).toContain('brightness');
      expect(command1).not.toContain('Branch 2 Title');
      expect(command1).not.toContain('contrast');
      
      // Branch 2 specific
      expect(command2).toContain('Branch 2 Title');
      expect(command2).toContain('contrast');
      expect(command2).not.toContain('Branch 1 Title');
      expect(command2).not.toContain('brightness');
      
      // Both should have base properties (aspect ratio is applied as scale filter)
      expect(command1).toContain('scale=');
      expect(command1).toContain('16/9');
      expect(command2).toContain('scale=');
      expect(command2).toContain('16/9');
    });
  });
  
  describe('Edge Cases and Error Handling', () => {
    test('empty timeline should still support chaining', () => {
      const timeline = new Timeline()
        .setAspectRatio('1:1')
        .setDuration(10)
        .addFilter('vignette');
      
      expect(timeline).toBeInstanceOf(Timeline);
      
      // Should handle no input gracefully
      const command = timeline.getCommand('output.mp4');
      expect(command).toContain('ffmpeg');
    });
    
    test('multiple filters should chain correctly', () => {
      const timeline = new Timeline()
        .addVideo('input.mp4')
        .addFilter('brightness', { brightness: 0.1 })
        .addFilter('contrast', { contrast: 1.2 })
        .addFilter('saturation', { saturation: 1.5 })
        .addFilter('blur', { radius: 3 });
      
      const command = timeline.getCommand('output.mp4');
      
      expect(command).toContain('brightness');
      expect(command).toContain('contrast');
      expect(command).toContain('saturation');
      expect(command).toContain('blur');
    });
    
    test('repeated operations should accumulate', () => {
      const timeline = new Timeline()
        .addVideo('video1.mp4')
        .addText('Text 1')
        .addText('Text 2')
        .addText('Text 3')
        .addImage('image1.jpg')
        .addImage('image2.jpg');
      
      const command = timeline.getCommand('output.mp4');
      
      // All operations should be present
      expect(command).toContain('Text 1');
      expect(command).toContain('Text 2');
      expect(command).toContain('Text 3');
      expect(command).toContain('image1.jpg');
      expect(command).toContain('image2.jpg');
    });
  });
  
  describe('Functional Composition', () => {
    test('pipe method should support functional composition', () => {
      // Define transform functions
      const addTitle = (timeline: Timeline) => 
        timeline.addText('My Title', { position: 'top' });
      
      const addCredits = (timeline: Timeline) =>
        timeline.addText('Credits', { position: 'bottom' });
      
      const applyEffects = (timeline: Timeline) =>
        timeline
          .addFilter('brightness', { brightness: 0.1 })
          .addFilter('vignette');
      
      // Use pipe for composition
      const result = new Timeline()
        .addVideo('input.mp4')
        .pipe(addTitle)
        .pipe(addCredits)
        .pipe(applyEffects);
      
      const command = result.getCommand('output.mp4');
      
      expect(command).toContain('My Title');
      expect(command).toContain('Credits');
      expect(command).toContain('brightness');
      expect(command).toContain('vignette');
    });
    
    test('pipe should maintain immutability', () => {
      const original = new Timeline().addVideo('input.mp4');
      
      const transform = (timeline: Timeline) =>
        timeline.addText('Transformed');
      
      const result = original.pipe(transform);
      
      expect(result).not.toBe(original);
      expect(original.getCommand('out1.mp4')).not.toContain('Transformed');
      expect(result.getCommand('out2.mp4')).toContain('Transformed');
    });
  });
  
  describe('Method Return Type Consistency', () => {
    test('all public methods should be chainable', () => {
      const timeline = new Timeline();
      
      // Create a list of all chainable methods
      const methods = [
        () => timeline.addVideo('test.mp4'),
        () => timeline.addText('text'),
        () => timeline.addImage('image.jpg'),
        () => timeline.addAudio('audio.mp3'),
        () => timeline.addWatermark('logo.png'),
        () => timeline.setAspectRatio('16:9'),
        () => timeline.trim(0, 10),
        () => timeline.setDuration(30),
        () => timeline.addFilter('blur', { radius: 5 }),
        () => timeline.pipe((t) => t)
      ];
      
      // Each method should return a Timeline
      methods.forEach((method, index) => {
        const result = method();
        expect(result).toBeInstanceOf(Timeline);
        // Special case for pipe with identity function - it returns the same instance
        if (index === methods.length - 1) { // pipe((t) => t)
          expect(result).toBe(timeline); // Identity function returns same instance
        } else {
          expect(result).not.toBe(timeline); // All other methods return new instances
        }
      });
    });
    
    test('chaining should work in any order', () => {
      // Test different ordering of operations
      const order1 = new Timeline()
        .addVideo('video.mp4')
        .setAspectRatio('16:9')
        .addText('Text')
        .addFilter('brightness', { brightness: 0.1 });
      
      const order2 = new Timeline()
        .setAspectRatio('16:9')
        .addFilter('brightness', { brightness: 0.1 })
        .addVideo('video.mp4')
        .addText('Text');
      
      // Both should produce valid commands
      const command1 = order1.getCommand('out1.mp4');
      const command2 = order2.getCommand('out2.mp4');
      
      expect(command1).toContain('video.mp4');
      expect(command1).toContain('Text');
      // Check for aspect ratio scale filter
      expect(command1).toContain('scale=');
      expect(command1).toContain('16/9');
      expect(command1).toContain('brightness');
      
      expect(command2).toContain('video.mp4');
      expect(command2).toContain('Text');
      // Check for aspect ratio scale filter
      expect(command2).toContain('scale=');
      expect(command2).toContain('16/9');
      expect(command2).toContain('brightness');
    });
  });
  
  describe('Real-world Chaining Scenarios', () => {
    test('social media workflow should chain properly', () => {
      const tiktokVideo = new Timeline()
        .addVideo('raw-footage.mp4')
        .setAspectRatio('9:16')
        .trim(5, 35)
        .addText('VIRAL CONTENT! 🔥', {
          position: 'center',
          style: { fontSize: 72, color: '#ff0050' }
        })
        .addText('Follow for more!', {
          position: 'bottom',
          style: { fontSize: 36, color: '#ffffff' }
        })
        .addFilter('brightness', { brightness: 0.1 })
        .addFilter('contrast', { contrast: 1.2 })
        .addWatermark('@myhandle', { position: 'top-right' });
      
      const command = tiktokVideo.getCommand('tiktok-final.mp4');
      
      // Check for TikTok vertical aspect ratio
      expect(command).toContain('scale=');
      expect(command).toContain('9/16');
      expect(command).toContain('VIRAL CONTENT!');
      expect(command).toContain('Follow for more!');
      expect(command).toContain('@myhandle');
    });
    
    test('multi-layer composition should chain properly', () => {
      const composition = new Timeline()
        // Base video
        .addVideo('background.mp4')
        // Overlay video
        .addVideo('overlay.mp4', {
          position: { x: 100, y: 100 },
          width: 400,
          height: 300,
          opacity: 0.8
        })
        // Multiple text layers
        .addText('Main Title', {
          position: 'top',
          style: { fontSize: 60 }
        })
        .addText('Subtitle', {
          position: { x: '50%', y: '20%' },
          style: { fontSize: 36 }
        })
        // Logo
        .addImage('logo.png', {
          position: 'bottom-right',
          width: 200
        })
        // Effects
        .addFilter('vignette')
        .setDuration(60);
      
      const command = composition.getCommand('complex-output.mp4');
      
      expect(command).toContain('background.mp4');
      expect(command).toContain('overlay.mp4');
      expect(command).toContain('Main Title');
      expect(command).toContain('Subtitle');
      expect(command).toContain('logo.png');
      expect(command).toContain('vignette');
    });
  });
});
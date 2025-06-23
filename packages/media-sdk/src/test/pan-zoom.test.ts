import { describe, test, expect } from 'vitest';
import { Timeline } from '../timeline/timeline.js';
import {
  addPanZoom,
  addKenBurns,
  zoomIn,
  zoomOut,
  pan,
  multiPanZoom,
  cinematicSequence,
  suggestPanZoom
} from '../effects/pan-zoom.js';

describe('Pan and Zoom Effects', () => {
  describe('Basic Pan/Zoom', () => {
    test('should add zoompan filter with correct parameters', () => {
      const timeline = new Timeline().addVideo('input.mp4');
      
      const result = addPanZoom(timeline, {
        startRect: { x: 0, y: 0, width: 1920, height: 1080 },
        endRect: { x: 100, y: 100, width: 960, height: 540 },
        duration: 5
      });
      
      const command = result.getCommand('output.mp4');
      expect(command).toContain('zoompan');
      expect(command).toContain('d=125'); // 5 seconds * 25 fps
    });

    test('should calculate zoom factors correctly', () => {
      const timeline = new Timeline().addVideo('input.mp4');
      
      const result = addPanZoom(timeline, {
        startRect: { x: 0, y: 0, width: 1920, height: 1080 }, // 1x zoom
        endRect: { x: 0, y: 0, width: 960, height: 540 }, // 2x zoom
        duration: 3
      });
      
      const command = result.getCommand('output.mp4');
      expect(command).toContain('zoompan');
      // Should interpolate between zoom levels
      expect(command).toMatch(/z='[^']*'/);
    });

    test('should handle different easing functions', () => {
      const timeline = new Timeline().addVideo('input.mp4');
      
      // Linear
      const linear = addPanZoom(timeline, {
        startRect: { x: 0, y: 0, width: 1920, height: 1080 },
        endRect: { x: 100, y: 100, width: 1920, height: 1080 },
        duration: 5,
        easing: 'linear'
      });
      
      const linearCmd = linear.getCommand('output.mp4');
      expect(linearCmd).toContain('t/duration');
      
      // Ease-in
      const easeIn = addPanZoom(timeline, {
        startRect: { x: 0, y: 0, width: 1920, height: 1080 },
        endRect: { x: 100, y: 100, width: 1920, height: 1080 },
        duration: 5,
        easing: 'ease-in'
      });
      
      const easeInCmd = easeIn.getCommand('output.mp4');
      expect(easeInCmd).toContain('(t/duration)*(t/duration)');
      
      // Ease-out
      const easeOut = addPanZoom(timeline, {
        startRect: { x: 0, y: 0, width: 1920, height: 1080 },
        endRect: { x: 100, y: 100, width: 1920, height: 1080 },
        duration: 5,
        easing: 'ease-out'
      });
      
      const easeOutCmd = easeOut.getCommand('output.mp4');
      expect(easeOutCmd).toContain('1-pow(1-t/duration,2)');
    });
  });

  describe('Ken Burns Effect', () => {
    test('should generate Ken Burns with center-out movement', () => {
      const timeline = new Timeline().addVideo('input.mp4');
      
      const result = addKenBurns(timeline, {
        startZoom: 1.0,
        endZoom: 1.5,
        direction: 'center-out',
        duration: 10
      });
      
      const command = result.getCommand('output.mp4');
      expect(command).toContain('zoompan');
      expect(command).toContain('d=250'); // 10 seconds * 25 fps
    });

    test('should handle different movement directions', () => {
      const timeline = new Timeline().addVideo('input.mp4');
      
      // Top-bottom
      const topBottom = addKenBurns(timeline, {
        direction: 'top-bottom',
        duration: 5
      });
      
      const tbCmd = topBottom.getCommand('output.mp4');
      expect(tbCmd).toContain('zoompan');
      
      // Left-right
      const leftRight = addKenBurns(timeline, {
        direction: 'left-right',
        duration: 5
      });
      
      const lrCmd = leftRight.getCommand('output.mp4');
      expect(lrCmd).toContain('zoompan');
      
      // Diagonal
      const diagonal = addKenBurns(timeline, {
        direction: 'diagonal',
        duration: 5
      });
      
      const diagCmd = diagonal.getCommand('output.mp4');
      expect(diagCmd).toContain('zoompan');
    });

    test('should handle random direction', () => {
      const timeline = new Timeline().addVideo('input.mp4');
      
      const result = addKenBurns(timeline, {
        direction: 'random',
        duration: 5
      });
      
      const command = result.getCommand('output.mp4');
      expect(command).toContain('zoompan');
    });
  });

  describe('Convenience Functions', () => {
    test('should zoom in correctly', () => {
      const timeline = new Timeline().addVideo('input.mp4');
      
      const result = zoomIn(timeline, {
        zoom: 2.0,
        duration: 3
      });
      
      const command = result.getCommand('output.mp4');
      expect(command).toContain('zoompan');
      expect(command).toContain('d=75'); // 3 seconds * 25 fps
    });

    test('should zoom out correctly', () => {
      const timeline = new Timeline().addVideo('input.mp4');
      
      const result = zoomOut(timeline, {
        zoom: 2.0,
        duration: 3
      });
      
      const command = result.getCommand('output.mp4');
      expect(command).toContain('zoompan');
    });

    test('should pan correctly', () => {
      const timeline = new Timeline().addVideo('input.mp4');
      
      // Pan right
      const panRight = pan(timeline, {
        direction: 'right',
        duration: 5
      });
      
      const rightCmd = panRight.getCommand('output.mp4');
      expect(rightCmd).toContain('zoompan');
      
      // Pan up
      const panUp = pan(timeline, {
        direction: 'up',
        duration: 5
      });
      
      const upCmd = panUp.getCommand('output.mp4');
      expect(upCmd).toContain('zoompan');
    });
  });

  describe('Multi Pan/Zoom Effects', () => {
    test('should create sequential effects', () => {
      const timeline = new Timeline().addVideo('input.mp4');
      
      const result = multiPanZoom(timeline, [
        { type: 'zoom-in', duration: 3, options: { zoom: 1.5 } },
        { type: 'pan', duration: 4, options: { direction: 'right' } },
        { type: 'zoom-out', duration: 3, options: { zoom: 1.5 } }
      ]);
      
      const command = result.getCommand('output.mp4');
      expect(command).toContain('zoompan');
      expect(command).toContain('d=250'); // Total 10 seconds * 25 fps
      expect(command).toContain('if('); // Conditional expressions
    });

    test('should handle empty effects array', () => {
      const timeline = new Timeline().addVideo('input.mp4');
      
      const result = multiPanZoom(timeline, []);
      
      // Should return original timeline
      expect(result).toBe(timeline);
    });

    test('should support custom pan-zoom options', () => {
      const timeline = new Timeline().addVideo('input.mp4');
      
      const result = multiPanZoom(timeline, [
        {
          type: 'custom',
          duration: 5,
          options: {
            startRect: { x: 0, y: 0, width: 1920, height: 1080 },
            endRect: { x: 500, y: 300, width: 960, height: 540 },
            easing: 'ease-in-out'
          }
        }
      ]);
      
      const command = result.getCommand('output.mp4');
      expect(command).toContain('zoompan');
      // Ease-in-out is implemented as conditional expression
      expect(command).toMatch(/if\(lt\(.*pow/);
    });

    test('should create time-gated expressions for multiple effects', () => {
      const timeline = new Timeline().addVideo('input.mp4');
      
      const result = multiPanZoom(timeline, [
        { type: 'zoom-in', duration: 2 },
        { type: 'pan', duration: 3 },
        { type: 'zoom-out', duration: 2 }
      ]);
      
      const command = result.getCommand('output.mp4');
      // Should contain time conditions
      expect(command).toContain('between(t,');
      expect(command).toContain('gte(t,');
    });
  });

  describe('Cinematic Sequences', () => {
    test('should create dramatic sequence', () => {
      const timeline = new Timeline().addVideo('input.mp4');
      
      const result = cinematicSequence(timeline, {
        style: 'dramatic',
        duration: 10
      });
      
      const command = result.getCommand('output.mp4');
      expect(command).toContain('zoompan');
      expect(command).toContain('d=250');
    });

    test('should create gentle sequence', () => {
      const timeline = new Timeline().addVideo('input.mp4');
      
      const result = cinematicSequence(timeline, {
        style: 'gentle',
        duration: 8
      });
      
      const command = result.getCommand('output.mp4');
      expect(command).toContain('zoompan');
      expect(command).toContain('d=200');
    });

    test('should create dynamic sequence', () => {
      const timeline = new Timeline().addVideo('input.mp4');
      
      const result = cinematicSequence(timeline, {
        style: 'dynamic',
        duration: 15
      });
      
      const command = result.getCommand('output.mp4');
      expect(command).toContain('zoompan');
    });

    test('should create documentary sequence', () => {
      const timeline = new Timeline().addVideo('input.mp4');
      
      const result = cinematicSequence(timeline, {
        style: 'documentary',
        duration: 20
      });
      
      const command = result.getCommand('output.mp4');
      expect(command).toContain('zoompan');
    });
  });

  describe('AI-Powered Suggestions', () => {
    test('should suggest pan/zoom for landscape content', () => {
      const timeline = new Timeline().addVideo('landscape.mp4');
      
      const result = suggestPanZoom(timeline, {
        contentType: 'landscape',
        platform: 'youtube'
      });
      
      const command = result.getCommand('output.mp4');
      expect(command).toContain('zoompan');
    });

    test('should suggest appropriate effects for portrait content', () => {
      const timeline = new Timeline().addVideo('portrait.mp4');
      
      const result = suggestPanZoom(timeline, {
        contentType: 'portrait',
        platform: 'tiktok'
      });
      
      const command = result.getCommand('output.mp4');
      expect(command).toContain('zoompan');
    });

    test('should handle group photos', () => {
      const timeline = new Timeline().addVideo('group.mp4');
      
      const result = suggestPanZoom(timeline, {
        contentType: 'group-photo',
        platform: 'instagram'
      });
      
      const command = result.getCommand('output.mp4');
      expect(command).toContain('zoompan');
    });

    test('should optimize for text-heavy content', () => {
      const timeline = new Timeline().addVideo('presentation.mp4');
      
      const result = suggestPanZoom(timeline, {
        contentType: 'text-heavy',
        platform: 'youtube'
      });
      
      const command = result.getCommand('output.mp4');
      expect(command).toContain('zoompan');
    });

    test('should handle action content', () => {
      const timeline = new Timeline().addVideo('action.mp4');
      
      const result = suggestPanZoom(timeline, {
        contentType: 'action',
        platform: 'tiktok'
      });
      
      const command = result.getCommand('output.mp4');
      expect(command).toContain('zoompan');
    });
  });

  describe('Pipe Composition', () => {
    test('should work with pipe operator', () => {
      const timeline = new Timeline()
        .addVideo('input.mp4');
      
      // Apply zoom in effect
      const withZoom = zoomIn(timeline, { zoom: 1.5, duration: 3 });
      
      const command = withZoom.getCommand('output.mp4');
      expect(command).toContain('zoompan');
    });

    test('should compose multiple effects', () => {
      const timeline = new Timeline()
        .addVideo('input.mp4');
      
      // Apply cinematic sequence
      const withCinematic = cinematicSequence(timeline, { style: 'dramatic', duration: 10 });
      
      const command = withCinematic.getCommand('output.mp4');
      expect(command).toContain('zoompan');
    });
  });

  describe('Edge Cases', () => {
    test('should handle very short durations', () => {
      const timeline = new Timeline().addVideo('input.mp4');
      
      const result = zoomIn(timeline, {
        duration: 0.5 // Half second
      });
      
      const command = result.getCommand('output.mp4');
      expect(command).toContain('d=12'); // 0.5 * 25 fps = 12.5, floored to 12
    });

    test('should handle extreme zoom values', () => {
      const timeline = new Timeline().addVideo('input.mp4');
      
      const result = zoomIn(timeline, {
        zoom: 10.0 // Very high zoom
      });
      
      const command = result.getCommand('output.mp4');
      expect(command).toContain('zoompan');
    });

    test('should handle custom input resolution', () => {
      const timeline = new Timeline().addVideo('input.mp4');
      
      const result = addPanZoom(timeline, {
        startRect: { x: 0, y: 0, width: 3840, height: 2160 },
        endRect: { x: 1920, y: 1080, width: 1920, height: 1080 },
        duration: 5,
        inputResolution: { width: 3840, height: 2160 } // 4K
      });
      
      const command = result.getCommand('output.mp4');
      expect(command).toContain('s=3840x2160');
    });
  });
});
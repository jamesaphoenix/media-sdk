import { describe, test, expect, beforeAll, afterAll } from 'bun:test';
import { existsSync, mkdirSync, rmSync } from 'fs';
import { join } from 'path';
import {
  Timeline,
  addPanZoom,
  addKenBurns,
  zoomIn,
  zoomOut,
  pan,
  multiPanZoom,
  suggestPanZoom,
  panZoomEffect,
  kenBurnsEffect,
  type PanZoomOptions,
  type KenBurnsEffectOptions
} from '@jamesaphoenix/media-sdk';

// Test setup
const TEST_OUTPUT_DIR = join(process.cwd(), 'test-output', 'pan-zoom');
const TEST_ASSETS_DIR = join(process.cwd(), 'test', 'assets');

beforeAll(() => {
  if (!existsSync(TEST_OUTPUT_DIR)) {
    mkdirSync(TEST_OUTPUT_DIR, { recursive: true });
  }
});

afterAll(() => {
  // Clean up test output
  if (existsSync(TEST_OUTPUT_DIR)) {
    rmSync(TEST_OUTPUT_DIR, { recursive: true, force: true });
  }
});

describe('Pan and Zoom Effects', () => {
  describe('Basic Pan/Zoom Operations', () => {
    test('should add pan zoom effect to timeline', () => {
      const timeline = new Timeline();
      const options: PanZoomOptions = {
        startRect: { x: 0, y: 0, width: 1920, height: 1080 },
        endRect: { x: 500, y: 300, width: 960, height: 540 },
        duration: 5
      };

      const result = addPanZoom(timeline, options);
      const command = result.getCommand('output.mp4');
      
      expect(command).toContain('zoompan');
      expect(command).toContain('d=125'); // 5 seconds * 25 fps
      expect(command).toContain('s=1920x1080');
    });

    test('should handle different easing functions', () => {
      const timeline = new Timeline();
      const easings: Array<PanZoomOptions['easing']> = ['linear', 'ease-in', 'ease-out', 'ease-in-out'];
      
      for (const easing of easings) {
        const result = addPanZoom(timeline, {
          startRect: { x: 0, y: 0, width: 1920, height: 1080 },
          endRect: { x: 100, y: 100, width: 1720, height: 880 },
          duration: 3,
          easing
        });
        
        const command = result.getCommand(`output-${easing}.mp4`);
        expect(command).toContain('zoompan');
        
        // Check for easing-specific expressions
        if (easing === 'ease-in') {
          expect(command).toContain('pow');
        } else if (easing === 'ease-in-out') {
          expect(command).toContain('if(lt(t,duration/2)');
        }
      }
    });

    test('should calculate zoom factors correctly', () => {
      const timeline = new Timeline();
      
      // Test zooming in (smaller end rect = higher zoom)
      const zoomInResult = addPanZoom(timeline, {
        startRect: { x: 0, y: 0, width: 1920, height: 1080 }, // Zoom factor 1
        endRect: { x: 480, y: 270, width: 960, height: 540 },  // Zoom factor 2
        duration: 4
      });
      
      const command = zoomInResult.getCommand('zoom-in.mp4');
      expect(command).toContain('zoompan');
      expect(command).toContain('1+'); // Starting zoom of 1
    });
  });

  describe('Ken Burns Effect', () => {
    test('should generate Ken Burns effect with default settings', () => {
      const timeline = new Timeline();
      const options: KenBurnsEffectOptions = {
        duration: 5
      };

      const result = addKenBurns(timeline, options);
      const command = result.getCommand('ken-burns.mp4');
      
      expect(command).toContain('zoompan');
      expect(command).toContain('d=125'); // 5 seconds * 25 fps
    });

    test('should handle different Ken Burns directions', () => {
      const timeline = new Timeline();
      const directions: Array<KenBurnsEffectOptions['direction']> = [
        'center-out', 'top-bottom', 'left-right', 'diagonal', 'random'
      ];
      
      for (const direction of directions) {
        const result = addKenBurns(timeline, {
          direction,
          duration: 3,
          startZoom: 1.0,
          endZoom: 1.5
        });
        
        const command = result.getCommand(`ken-burns-${direction}.mp4`);
        expect(command).toContain('zoompan');
      }
    });

    test('should apply custom zoom levels', () => {
      const timeline = new Timeline();
      
      const result = addKenBurns(timeline, {
        startZoom: 1.2,
        endZoom: 2.0,
        direction: 'center-out',
        duration: 4
      });
      
      const command = result.getCommand('custom-zoom.mp4');
      expect(command).toContain('zoompan');
    });
  });

  describe('Convenience Functions', () => {
    test('should zoom in smoothly', () => {
      const timeline = new Timeline();
      
      const result = zoomIn(timeline, {
        zoom: 1.5,
        duration: 3,
        easing: 'ease-in-out'
      });
      
      const command = result.getCommand('zoom-in.mp4');
      expect(command).toContain('zoompan');
      expect(command).toContain('d=75'); // 3 seconds * 25 fps
    });

    test('should zoom out smoothly', () => {
      const timeline = new Timeline();
      
      const result = zoomOut(timeline, {
        zoom: 1.8,
        duration: 4,
        easing: 'ease-out'
      });
      
      const command = result.getCommand('zoom-out.mp4');
      expect(command).toContain('zoompan');
    });

    test('should pan across image', () => {
      const timeline = new Timeline();
      const directions: Array<'left' | 'right' | 'up' | 'down'> = ['left', 'right', 'up', 'down'];
      
      for (const direction of directions) {
        const result = pan(timeline, {
          direction,
          duration: 5,
          easing: 'linear'
        });
        
        const command = result.getCommand(`pan-${direction}.mp4`);
        expect(command).toContain('zoompan');
        expect(command).toContain('d=125'); // 5 seconds * 25 fps
      }
    });
  });

  describe('Multi Pan/Zoom Sequences', () => {
    test('should create multiple effects in sequence', () => {
      const timeline = new Timeline();
      
      const effects = [
        { type: 'zoom-in' as const, duration: 3 },
        { type: 'pan' as const, duration: 4, options: { direction: 'right' } },
        { type: 'zoom-out' as const, duration: 3 }
      ];
      
      const result = multiPanZoom(timeline, effects);
      const command = result.getCommand('multi-effect.mp4');
      
      expect(command).toBeDefined();
      // Total duration should be 10 seconds
    });

    test('should handle Ken Burns in sequence', () => {
      const timeline = new Timeline();
      
      const effects = [
        { 
          type: 'ken-burns' as const, 
          duration: 5,
          options: { direction: 'center-out' }
        },
        { 
          type: 'ken-burns' as const, 
          duration: 5,
          options: { direction: 'diagonal' }
        }
      ];
      
      const result = multiPanZoom(timeline, effects);
      expect(result).toBeDefined();
    });
  });

  describe('AI-Friendly Suggestions', () => {
    test('should suggest appropriate effects for content types', () => {
      const timeline = new Timeline();
      const contentTypes: Array<Parameters<typeof suggestPanZoom>[1]['contentType']> = [
        'landscape', 'portrait', 'group-photo', 'text-heavy', 'action'
      ];
      
      for (const contentType of contentTypes) {
        const result = suggestPanZoom(timeline, {
          contentType,
          platform: 'youtube'
        });
        
        const command = result.getCommand(`suggest-${contentType}.mp4`);
        expect(command).toContain('zoompan');
      }
    });

    test('should adjust duration based on platform', () => {
      const timeline = new Timeline();
      const platforms: Array<Parameters<typeof suggestPanZoom>[1]['platform']> = [
        'tiktok', 'youtube', 'instagram'
      ];
      
      for (const platform of platforms) {
        const result = suggestPanZoom(timeline, {
          contentType: 'landscape',
          platform
        });
        
        const command = result.getCommand(`platform-${platform}.mp4`);
        expect(command).toContain('zoompan');
        
        // TikTok should have shorter duration
        if (platform === 'tiktok') {
          expect(command).toContain('d='); // Will be shorter
        }
      }
    });
  });

  describe('Pipe Composition', () => {
    test('should work with pipe composition', () => {
      const timeline = new Timeline()
        .addImage(join(TEST_ASSETS_DIR, 'sample-1.jpg'))
        .pipe(zoomInEffect({ zoom: 1.4, duration: 3 }));
      
      const command = timeline.getCommand('pipe-zoom.mp4');
      expect(command).toContain('zoompan');
    });

    test('should chain multiple effects', () => {
      const timeline = new Timeline()
        .addImage(join(TEST_ASSETS_DIR, 'sample-1.jpg'))
        .pipe(kenBurnsEffect({
          direction: 'center-out',
          duration: 5,
          startZoom: 1.0,
          endZoom: 1.5
        }));
      
      const command = timeline.getCommand('chain-effects.mp4');
      expect(command).toContain('zoompan');
    });

    test('should combine with other effects', () => {
      const timeline = new Timeline()
        .addImage(join(TEST_ASSETS_DIR, 'sample-1.jpg'))
        .pipe(panEffect({ direction: 'right', duration: 4 }))
        .addText('Scenic View', {
          position: { x: '50%', y: '90%', anchor: 'bottom-center' },
          style: { fontSize: 48, color: '#ffffff' }
        });
      
      const command = timeline.getCommand('combined-effects.mp4');
      expect(command).toContain('zoompan');
      expect(command).toContain('drawtext');
    });
  });

  describe('Edge Cases', () => {
    test('should handle extreme zoom values', () => {
      const timeline = new Timeline();
      
      // Very high zoom
      const highZoom = addKenBurns(timeline, {
        startZoom: 1.0,
        endZoom: 5.0,
        duration: 2
      });
      
      expect(highZoom.getCommand('high-zoom.mp4')).toContain('zoompan');
      
      // Very low zoom (zoom out beyond original)
      const lowZoom = addKenBurns(timeline, {
        startZoom: 2.0,
        endZoom: 0.5,
        duration: 2
      });
      
      expect(lowZoom.getCommand('low-zoom.mp4')).toContain('zoompan');
    });

    test('should handle very short durations', () => {
      const timeline = new Timeline();
      
      const result = zoomIn(timeline, {
        duration: 0.5, // Half second
        zoom: 1.2
      });
      
      const command = result.getCommand('short-duration.mp4');
      expect(command).toContain('d=12'); // 0.5 seconds * 25 fps
    });

    test('should handle custom input resolutions', () => {
      const timeline = new Timeline();
      
      const result = addPanZoom(timeline, {
        startRect: { x: 0, y: 0, width: 4096, height: 2160 },
        endRect: { x: 1000, y: 500, width: 2048, height: 1080 },
        duration: 5,
        inputResolution: { width: 4096, height: 2160 } // 4K
      });
      
      const command = result.getCommand('4k-panzoom.mp4');
      expect(command).toContain('s=4096x2160');
    });
  });

  describe('Real-world Scenarios', () => {
    test('should create Instagram story with Ken Burns', async () => {
      const timeline = new Timeline()
        .addImage(join(TEST_ASSETS_DIR, 'sample-1.jpg'))
        .setAspectRatio('9:16') // Instagram story
        .pipe(kenBurnsEffect({
          direction: 'center-out',
          duration: 5,
          startZoom: 1.0,
          endZoom: 1.3,
          easing: 'ease-in-out'
        }))
        .addText('Swipe Up!', {
          position: { x: '50%', y: '85%', anchor: 'center' },
          style: { 
            fontSize: 36, 
            color: '#ffffff',
            backgroundColor: '#000000',
            padding: 10
          }
        });
      
      const command = timeline.getCommand(join(TEST_OUTPUT_DIR, 'instagram-story.mp4'));
      expect(command).toContain('zoompan');
      expect(command).toContain('9:16');
    });

    test('should create YouTube intro with multiple effects', async () => {
      const timeline = new Timeline()
        .addImage(join(TEST_ASSETS_DIR, 'sample-2.jpg'))
        .setAspectRatio('16:9')
        .pipe(suggestPanZoom({
          contentType: 'landscape',
          platform: 'youtube'
        }))
        .addText('Welcome to My Channel', {
          position: { x: '50%', y: '50%', anchor: 'center' },
          style: {
            fontSize: 64,
            color: '#ffffff',
            strokeColor: '#000000',
            strokeWidth: 3
          }
        });
      
      const command = timeline.getCommand(join(TEST_OUTPUT_DIR, 'youtube-intro.mp4'));
      expect(command).toContain('zoompan');
      expect(command).toContain('16:9');
    });

    test('should create photo slideshow with varied effects', () => {
      // This would typically use multiPanZoom with different effects per photo
      const effects = [
        { type: 'zoom-in' as const, duration: 3 },
        { type: 'pan' as const, duration: 3, options: { direction: 'right' } },
        { type: 'ken-burns' as const, duration: 3, options: { direction: 'diagonal' } }
      ];
      
      const timeline = new Timeline()
        .addImage(join(TEST_ASSETS_DIR, 'sample-1.jpg'));
      
      const result = multiPanZoom(timeline, effects);
      const command = result.getCommand(join(TEST_OUTPUT_DIR, 'photo-slideshow.mp4'));
      
      expect(command).toBeDefined();
    });
  });
});
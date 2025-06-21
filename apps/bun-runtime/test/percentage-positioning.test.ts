/**
 * Tests for percentage-based positioning support
 * 
 * Verifies that both text and images can use percentage values for positioning
 */

import { test, expect, describe } from 'bun:test';
import { Timeline } from '@jamesaphoenix/media-sdk';

describe('🎯 PERCENTAGE POSITIONING', () => {
  describe('📝 Text Percentage Positioning', () => {
    test('should support percentage values for text positioning', () => {
      const timeline = new Timeline()
        .addVideo('input.mp4')
        .addText('Centered Text', {
          position: { x: '50%', y: '50%', anchor: 'center' },
          style: { fontSize: 48, color: '#ffffff' }
        });

      const command = timeline.getCommand('output.mp4');
      
      // Check that percentage values are converted to FFmpeg expressions
      expect(command).toContain('(w*0.5)');
      expect(command).toContain('(h*0.5)');
      expect(command).toContain('text_w/2');
      expect(command).toContain('text_h/2');
    });

    test('should handle different percentage positions', () => {
      const timeline = new Timeline()
        .addVideo('input.mp4')
        .addText('Top Left 25%', {
          position: { x: '25%', y: '25%' },
          style: { fontSize: 32 }
        })
        .addText('Bottom Right 75%', {
          position: { x: '75%', y: '75%' },
          style: { fontSize: 32 }
        });

      const command = timeline.getCommand('output.mp4');
      
      expect(command).toContain('(w*0.25)');
      expect(command).toContain('(h*0.25)');
      expect(command).toContain('(w*0.75)');
      expect(command).toContain('(h*0.75)');
    });

    test('should handle percentage with anchor points', () => {
      const timeline = new Timeline()
        .addVideo('input.mp4')
        .addText('Bottom Center', {
          position: { x: '50%', y: '90%', anchor: 'bottom-center' },
          style: { fontSize: 36 }
        });

      const command = timeline.getCommand('output.mp4');
      
      // Should center horizontally and align bottom
      expect(command).toContain('(w*0.5)-(text_w/2)');
      expect(command).toContain('(h*0.9)-text_h');
    });
  });

  describe('🖼️ Image Percentage Positioning', () => {
    test('should support percentage values for image positioning', () => {
      const timeline = new Timeline()
        .addVideo('input.mp4')
        .addImage('logo.png', {
          position: { x: '80%', y: '20%', anchor: 'center' }
        });

      const command = timeline.getCommand('output.mp4');
      
      // Check that percentage values are converted for overlay
      expect(command).toContain('(main_w*0.8)');
      expect(command).toContain('(main_h*0.2)');
      expect(command).toContain('overlay_w/2');
      expect(command).toContain('overlay_h/2');
    });

    test('should handle watermark with percentage position', () => {
      const timeline = new Timeline()
        .addVideo('input.mp4')
        .addWatermark('watermark.png', {
          position: { x: '90%', y: '10%', anchor: 'top-right' }
        });

      const command = timeline.getCommand('output.mp4');
      
      // Should position at 90%, 10% and adjust for top-right anchor
      expect(command).toContain('(main_w*0.9)-overlay_w');
      expect(command).toContain('(main_h*0.1)');
    });

    test('should handle multiple images with percentage positions', () => {
      const timeline = new Timeline()
        .addVideo('input.mp4')
        .addImage('topleft.png', {
          position: { x: '10%', y: '10%' },
          duration: 5
        })
        .addImage('center.png', {
          position: { x: '50%', y: '50%', anchor: 'center' },
          duration: 5
        })
        .addImage('bottomright.png', {
          position: { x: '90%', y: '90%', anchor: 'bottom-right' },
          duration: 5
        });

      const command = timeline.getCommand('output.mp4');
      
      // Check all three images have correct positioning
      expect(command).toContain('(main_w*0.1)');
      expect(command).toContain('(main_h*0.1)');
      expect(command).toContain('(main_w*0.5)-(overlay_w/2)');
      expect(command).toContain('(main_h*0.5)-(overlay_h/2)');
      expect(command).toContain('(main_w*0.9)-overlay_w');
      expect(command).toContain('(main_h*0.9)-overlay_h');
    });
  });

  describe('🎨 Mixed Positioning Types', () => {
    test('should handle mix of percentage and pixel values', () => {
      const timeline = new Timeline()
        .addVideo('input.mp4')
        .addText('Percentage Position', {
          position: { x: '50%', y: '25%' }
        })
        .addText('Pixel Position', {
          position: { x: 100, y: 200 }
        })
        .addImage('mixed.png', {
          position: { x: '75%', y: 150 }
        });

      const command = timeline.getCommand('output.mp4');
      
      // Check percentage values are converted
      expect(command).toContain('(w*0.5)');
      expect(command).toContain('(h*0.25)');
      expect(command).toContain('(main_w*0.75)');
      
      // Check pixel values are preserved
      expect(command).toContain('x=100');
      expect(command).toContain('y=200');
      expect(command).toContain(':150');
    });

    test('should handle edge percentage values', () => {
      const timeline = new Timeline()
        .addVideo('input.mp4')
        .addText('0% Position', {
          position: { x: '0%', y: '0%' }
        })
        .addText('100% Position', {
          position: { x: '100%', y: '100%', anchor: 'bottom-right' }
        });

      const command = timeline.getCommand('output.mp4');
      
      // 0% should be (w*0) = 0
      expect(command).toContain('x=(w*0):y=(h*0)');
      
      // 100% with bottom-right anchor
      expect(command).toContain('(w*1)-text_w');
      expect(command).toContain('(h*1)-text_h');
    });
  });

  describe('🎬 Complex Timelapse with Percentage Positioning', () => {
    test('should create timelapse with percentage-positioned overlays', () => {
      // Use a single timeline with video base
      let timeline = new Timeline()
        .addVideo('background.mp4'); // Need a video base for overlays
      
      // Add progress indicator at bottom right for each frame
      for (let i = 0; i < 5; i++) {
        // Add progress indicator at bottom
        timeline = timeline.addText(`${i + 1}/5`, {
          position: { x: '95%', y: '95%', anchor: 'bottom-right' },
          startTime: i * 2,
          duration: 2,
          style: {
            fontSize: 24,
            color: '#ffffff',
            background: { color: 'rgba(0,0,0,0.7)', padding: 8 }
          }
        });
        
        // Add timestamp at top
        timeline = timeline.addText(`00:0${i * 2}`, {
          position: { x: '5%', y: '5%', anchor: 'top-left' },
          startTime: i * 2,
          duration: 2,
          style: {
            fontSize: 18,
            color: '#ffffff'
          }
        });
      }
      
      const command = timeline.getCommand('timelapse.mp4');
      
      // Verify percentage positions are used throughout
      expect(command).toContain('(w*0.95)-text_w');
      expect(command).toContain('(h*0.95)-text_h');
      expect(command).toContain('(w*0.05)');
      expect(command).toContain('(h*0.05)');
      
      // Should have multiple text overlays (drawtext)
      const drawtextCount = (command.match(/drawtext/g) || []).length;
      expect(drawtextCount).toBeGreaterThan(5);
    });
  });
});
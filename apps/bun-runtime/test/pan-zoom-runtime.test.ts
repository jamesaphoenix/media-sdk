import { describe, test, expect, beforeAll, afterAll } from 'bun:test';
import { existsSync, mkdirSync, rmSync } from 'fs';
import { join } from 'path';
import {
  Timeline,
  addKenBurns,
  zoomIn,
  pan,
  suggestPanZoom,
  FFmpegExecutor
} from '@jamesaphoenix/media-sdk';
import { RuntimeValidator } from '../src/vision-runtime-validator';

// Test setup
const TEST_OUTPUT_DIR = join(process.cwd(), 'test-output', 'pan-zoom-runtime');
const TEST_ASSETS_DIR = join(process.cwd(), 'test', 'assets');

// Initialize validator and executor
const validator = new RuntimeValidator();
const executor = new FFmpegExecutor();

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

describe('Pan/Zoom Runtime Tests with Vision Validation', () => {
  test('should render Ken Burns effect with vision validation', async () => {
    const outputPath = join(TEST_OUTPUT_DIR, 'ken-burns-test.mp4');
    
    const timeline = new Timeline()
      .addImage(join(TEST_ASSETS_DIR, 'sample-landscape.jpg'))
      .pipe(timeline => addKenBurns(timeline, {
        direction: 'center-out',
        duration: 5,
        startZoom: 1.0,
        endZoom: 1.5,
        easing: 'ease-in-out'
      }))
      .addText('Ken Burns Effect Demo', {
        position: { x: '50%', y: '10%', anchor: 'top-center' },
        style: {
          fontSize: 48,
          color: '#ffffff',
          strokeColor: '#000000',
          strokeWidth: 3,
          backgroundColor: 'rgba(0,0,0,0.7)',
          padding: 20
        }
      });

    // Generate and execute command
    const command = timeline.getCommand(outputPath);
    console.log('Executing Ken Burns effect...');
    
    await executor.execute(command);
    
    // Validate the output
    const validation = await validator.validateRender(
      outputPath,
      'general',
      { command },
      ['Ken Burns Effect Demo'],
      [command]
    );

    expect(validation.isValid).toBe(true);
    expect(validation.hasText).toBe(true);
    expect(validation.textContent).toContain('Ken Burns');
    expect(validation.qualityScore).toBeGreaterThan(0.7);
    
    // Check for smooth motion
    if (validation.metadata?.format) {
      expect(validation.metadata.format.duration).toBeGreaterThanOrEqual(5);
    }
  }, 30000);

  test('should render zoom in effect for Instagram', async () => {
    const outputPath = join(TEST_OUTPUT_DIR, 'instagram-zoom.mp4');
    
    const timeline = new Timeline()
      .addImage(join(TEST_ASSETS_DIR, 'sample-portrait.jpg'))
      .setAspectRatio('9:16') // Instagram story
      .pipe(timeline => zoomIn(timeline, {
        zoom: 1.3,
        duration: 3,
        easing: 'ease-out'
      }))
      .addText('Swipe Up! 👆', {
        position: { x: '50%', y: '85%', anchor: 'bottom-center' },
        style: {
          fontSize: 42,
          color: '#ffffff',
          backgroundColor: '#E4405F', // Instagram pink
          padding: 15,
          borderRadius: 20
        }
      });

    const command = timeline.getCommand(outputPath);
    await executor.execute(command);
    
    const validation = await validator.validateRender(
      outputPath,
      'instagram',
      { command },
      ['Swipe Up!'],
      [command]
    );

    expect(validation.isValid).toBe(true);
    expect(validation.platformCompliance?.aspectRatio).toBe('9:16');
    expect(validation.hasText).toBe(true);
    expect(validation.qualityScore).toBeGreaterThan(0.75);
  }, 30000);

  test('should render pan effect for landscape video', async () => {
    const outputPath = join(TEST_OUTPUT_DIR, 'landscape-pan.mp4');
    
    const timeline = new Timeline()
      .addImage(join(TEST_ASSETS_DIR, 'sample-wide.jpg'))
      .setAspectRatio('16:9')
      .pipe(timeline => pan(timeline, {
        direction: 'right',
        duration: 6,
        easing: 'linear'
      }))
      .addText('Panoramic View', {
        position: { x: '10%', y: '90%', anchor: 'bottom-left' },
        style: {
          fontSize: 36,
          color: '#ffffff',
          backgroundColor: 'rgba(0,0,0,0.6)',
          padding: 12
        }
      });

    const command = timeline.getCommand(outputPath);
    await executor.execute(command);
    
    const validation = await validator.validateRender(
      outputPath,
      'youtube',
      { command },
      ['Panoramic View'],
      [command]
    );

    expect(validation.isValid).toBe(true);
    expect(validation.platformCompliance?.aspectRatio).toBe('16:9');
    expect(validation.textContent).toContain('Panoramic');
    
    // Vision should detect smooth horizontal movement
    console.log('Vision feedback:', validation.suggestions);
  }, 30000);

  test('should apply AI-suggested effects based on content', async () => {
    const contentTypes = [
      { type: 'landscape' as const, image: 'sample-landscape.jpg' },
      { type: 'portrait' as const, image: 'sample-portrait.jpg' },
      { type: 'text-heavy' as const, image: 'sample-text.jpg' }
    ];

    for (const { type, image } of contentTypes) {
      const outputPath = join(TEST_OUTPUT_DIR, `ai-suggest-${type}.mp4`);
      
      const timeline = new Timeline()
        .addImage(join(TEST_ASSETS_DIR, image))
        .pipe(timeline => suggestPanZoom(timeline, {
          contentType: type,
          platform: 'tiktok'
        }))
        .addText(`AI-Optimized: ${type}`, {
          position: { x: '50%', y: '50%', anchor: 'center' },
          style: {
            fontSize: 48,
            color: '#ffffff',
            strokeColor: '#000000',
            strokeWidth: 3
          }
        });

      const command = timeline.getCommand(outputPath);
      await executor.execute(command);
      
      const validation = await validator.validateRender(
        outputPath,
        'tiktok',
        { command },
        [`AI-Optimized: ${type}`],
        [command]
      );

      expect(validation.isValid).toBe(true);
      expect(validation.qualityScore).toBeGreaterThan(0.7);
      
      // AI should suggest appropriate movement for content type
      console.log(`AI suggestions for ${type}:`, validation.suggestions);
      
      // Verify content-specific optimizations
      if (type === 'text-heavy') {
        // Should have gentler movement to maintain readability
        expect(validation.textDetection?.confidence).toBeGreaterThan(0.8);
      }
    }
  }, 60000);

  test('should create smooth multi-effect sequence', async () => {
    const outputPath = join(TEST_OUTPUT_DIR, 'multi-effect-sequence.mp4');
    
    // Create a timeline with multiple images and effects
    let timeline = new Timeline();
    
    // Image 1: Zoom in
    timeline = timeline
      .addImage(join(TEST_ASSETS_DIR, 'sample-1.jpg'), { duration: 3 })
      .pipe(t => zoomIn(t, { zoom: 1.4, duration: 3 }))
      .addText('Scene 1: Zoom In', {
        position: { x: '50%', y: '90%' },
        style: { fontSize: 36, color: '#ffffff' },
        duration: 3
      });

    // Image 2: Pan right  
    timeline = timeline
      .addImage(join(TEST_ASSETS_DIR, 'sample-2.jpg'), { 
        startTime: 3,
        duration: 3 
      })
      .pipe(t => pan(t, { direction: 'right', duration: 3 }))
      .addText('Scene 2: Pan Right', {
        position: { x: '50%', y: '90%' },
        style: { fontSize: 36, color: '#ffffff' },
        startTime: 3,
        duration: 3
      });

    // Image 3: Ken Burns
    timeline = timeline
      .addImage(join(TEST_ASSETS_DIR, 'sample-3.jpg'), { 
        startTime: 6,
        duration: 3 
      })
      .pipe(t => addKenBurns(t, {
        direction: 'diagonal',
        duration: 3,
        startZoom: 1.0,
        endZoom: 1.5
      }))
      .addText('Scene 3: Ken Burns', {
        position: { x: '50%', y: '90%' },
        style: { fontSize: 36, color: '#ffffff' },
        startTime: 6,
        duration: 3
      });

    const command = timeline.getCommand(outputPath);
    await executor.execute(command);
    
    const validation = await validator.validateRender(
      outputPath,
      'general',
      { command },
      ['Scene 1', 'Scene 2', 'Scene 3'],
      [command]
    );

    expect(validation.isValid).toBe(true);
    expect(validation.metadata?.format?.duration).toBeGreaterThanOrEqual(9);
    
    // Check for smooth transitions between effects
    console.log('Multi-effect validation:', {
      quality: validation.qualityScore,
      suggestions: validation.suggestions,
      duration: validation.metadata?.format?.duration
    });
  }, 45000);

  test('should optimize pan/zoom for text readability', async () => {
    const outputPath = join(TEST_OUTPUT_DIR, 'text-readability-test.mp4');
    
    const timeline = new Timeline()
      .addImage(join(TEST_ASSETS_DIR, 'sample-text-heavy.jpg'))
      .pipe(timeline => suggestPanZoom(timeline, {
        contentType: 'text-heavy',
        platform: 'youtube'
      }))
      .addText('Important Information Below', {
        position: { x: '50%', y: '20%', anchor: 'center' },
        style: {
          fontSize: 48,
          color: '#ff0000',
          backgroundColor: '#ffffff',
          padding: 20,
          fontWeight: 'bold'
        }
      })
      .addText('• Keep text readable\n• Gentle movements only\n• Maintain focus', {
        position: { x: '50%', y: '50%', anchor: 'center' },
        style: {
          fontSize: 32,
          color: '#000000',
          backgroundColor: 'rgba(255,255,255,0.9)',
          padding: 15
        }
      });

    const command = timeline.getCommand(outputPath);
    await executor.execute(command);
    
    const validation = await validator.validateRender(
      outputPath,
      'youtube',
      { command },
      ['Important Information', 'Keep text readable'],
      [command]
    );

    expect(validation.isValid).toBe(true);
    expect(validation.textDetection?.confidence).toBeGreaterThan(0.85);
    expect(validation.hasText).toBe(true);
    
    // Should detect that gentle movement was applied for readability
    const suggestions = validation.suggestions || [];
    console.log('Readability optimization:', {
      textConfidence: validation.textDetection?.confidence,
      detectedText: validation.textContent,
      suggestions
    });
  }, 30000);

  test('should handle extreme zoom with quality preservation', async () => {
    const outputPath = join(TEST_OUTPUT_DIR, 'extreme-zoom-test.mp4');
    
    const timeline = new Timeline()
      .addImage(join(TEST_ASSETS_DIR, 'sample-high-res.jpg'))
      .pipe(timeline => addKenBurns(timeline, {
        startZoom: 1.0,
        endZoom: 3.0, // Extreme zoom
        direction: 'center-out',
        duration: 5,
        easing: 'ease-in'
      }))
      .addText('Extreme Zoom Test', {
        position: { x: '50%', y: '50%', anchor: 'center' },
        style: {
          fontSize: 64,
          color: '#ffff00',
          strokeColor: '#000000',
          strokeWidth: 4
        }
      });

    const command = timeline.getCommand(outputPath);
    await executor.execute(command);
    
    const validation = await validator.validateRender(
      outputPath,
      'general',
      { command },
      ['Extreme Zoom Test'],
      [command]
    );

    expect(validation.isValid).toBe(true);
    expect(validation.qualityScore).toBeGreaterThan(0.6); // May be lower due to zoom
    
    // Check if vision detects pixelation or quality issues
    if (validation.qualityScore < 0.7) {
      console.log('Quality impact from extreme zoom:', validation.suggestions);
    }
  }, 30000);
});

describe('Pan/Zoom Performance and Edge Cases', () => {
  test('should handle rapid pan/zoom changes', async () => {
    const outputPath = join(TEST_OUTPUT_DIR, 'rapid-changes.mp4');
    
    // Create very short, rapid movements
    const timeline = new Timeline()
      .addImage(join(TEST_ASSETS_DIR, 'sample-1.jpg'))
      .pipe(t => addKenBurns(t, {
        direction: 'random',
        duration: 1, // Very short
        startZoom: 1.0,
        endZoom: 1.8,
        easing: 'linear'
      }));

    const command = timeline.getCommand(outputPath);
    await executor.execute(command);
    
    const validation = await validator.validateRender(
      outputPath,
      'general',
      { command },
      [],
      [command]
    );

    expect(validation.isValid).toBe(true);
    
    // Check if rapid movement causes motion sickness warning
    console.log('Rapid movement feedback:', validation.suggestions);
  }, 30000);

  test('should preserve quality with 4K source', async () => {
    const outputPath = join(TEST_OUTPUT_DIR, '4k-pan-zoom.mp4');
    
    const timeline = new Timeline()
      .addImage(join(TEST_ASSETS_DIR, 'sample-4k.jpg'))
      .setResolution(3840, 2160) // 4K output
      .pipe(timeline => pan(timeline, {
        direction: 'down',
        duration: 8,
        easing: 'ease-in-out'
      }))
      .addText('4K Quality Test', {
        position: { x: '50%', y: '50%', anchor: 'center' },
        style: {
          fontSize: 120, // Larger for 4K
          color: '#ffffff',
          strokeColor: '#000000',
          strokeWidth: 6
        }
      });

    const command = timeline.getCommand(outputPath);
    console.log('4K command:', command);
    
    // Note: This might take longer due to 4K processing
    await executor.execute(command);
    
    const validation = await validator.validateRender(
      outputPath,
      'general',
      { command },
      ['4K Quality Test'],
      [command]
    );

    expect(validation.isValid).toBe(true);
    expect(validation.metadata?.video?.width).toBe(3840);
    expect(validation.metadata?.video?.height).toBe(2160);
    expect(validation.qualityScore).toBeGreaterThan(0.8);
  }, 60000);
});
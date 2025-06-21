/**
 * Runtime tests for image generation with actual file rendering
 * 
 * These tests create real images with captions and validate them
 */

import { test, expect, describe } from 'bun:test';
import { 
  generateImageWithCaption,
  generateImageBatch,
  createSlideshow,
  createInstagramPost,
  createTikTokThumbnail,
  createMeme,
  createQuoteCard
} from '@jamesaphoenix/media-sdk';
import { VisionRuntimeValidator } from '../src/vision-runtime-validator';
import { BunCassetteManager } from '../src/bun-cassette-manager';
import { existsSync, mkdirSync } from 'fs';
import { join } from 'path';

// Setup
const validator = new VisionRuntimeValidator();
const cassetteManager = new BunCassetteManager();
const outputDir = 'test-output/image-generation';

// Ensure output directory exists
if (!existsSync(outputDir)) {
  mkdirSync(outputDir, { recursive: true });
}

// Test assets - we'll create simple colored images using FFmpeg
async function createTestImage(color: string, filename: string): Promise<string> {
  const path = join(outputDir, filename);
  const command = `ffmpeg -f lavfi -i "color=c=${color}:s=1920x1080:d=1" -frames:v 1 -y "${path}"`;
  await cassetteManager.executeCommand(command, `create-${filename}`);
  return path;
}

describe('🖼️ IMAGE GENERATION RUNTIME TESTS', () => {
  describe('📸 Single Image Generation', () => {
    test('should generate image with centered caption', async () => {
      // Create test image
      const inputPath = await createTestImage('blue', 'test-blue.jpg');
      const outputPath = join(outputDir, 'centered-caption.jpg');
      
      // Generate image with caption
      const command = generateImageWithCaption(
        inputPath,
        'CENTERED TEXT',
        outputPath,
        {
          position: { x: '50%', y: '50%', anchor: 'center' },
          style: {
            fontSize: 72,
            color: '#ffffff',
            strokeColor: '#000000',
            strokeWidth: 4
          }
        }
      );
      
      const result = await cassetteManager.executeCommand(command, 'centered-caption');
      
      // Validate with vision
      const validation = await validator.validateRender(
        outputPath,
        'general',
        { command },
        ['CENTERED TEXT'],
        [command]
      );
      
      expect(validation.success).toBe(true);
      expect(validation.textDetection?.detectedText).toContain('CENTERED TEXT');
      expect(validation.qualityScore).toBeGreaterThan(0.8);
    });

    test('should generate PNG with transparent background text', async () => {
      const inputPath = await createTestImage('green', 'test-green.jpg');
      const outputPath = join(outputDir, 'transparent-text.png');
      
      const command = generateImageWithCaption(
        inputPath,
        'TRANSPARENT BACKGROUND',
        outputPath,
        {
          style: {
            fontSize: 48,
            color: '#ffffff',
            background: {
              color: 'rgba(0,0,0,0.5)',
              padding: 30,
              borderRadius: 15
            }
          }
        }
      );
      
      const result = await cassetteManager.executeCommand(command, 'transparent-text');
      
      // Check file was created
      expect(existsSync(outputPath)).toBe(true);
      
      // Validate format
      const probeCommand = `ffprobe -v quiet -print_format json -show_format "${outputPath}"`;
      const probeResult = await cassetteManager.executeCommand(probeCommand, 'probe-transparent');
      const probeData = JSON.parse(probeResult.output);
      
      expect(probeData.format.format_name).toContain('png');
    });

    test('should generate WebP with quality settings', async () => {
      const inputPath = await createTestImage('red', 'test-red.jpg');
      const outputPath = join(outputDir, 'high-quality.webp');
      
      const command = generateImageWithCaption(
        inputPath,
        'HIGH QUALITY WEBP',
        outputPath,
        {
          format: { format: 'webp', quality: 95 }
        }
      );
      
      const result = await cassetteManager.executeCommand(command, 'webp-quality');
      
      expect(existsSync(outputPath)).toBe(true);
      
      // Check file size indicates high quality
      const stats = Bun.file(outputPath);
      expect(stats.size).toBeGreaterThan(10000); // Should be reasonably sized
    });
  });

  describe('📚 Batch Image Generation', () => {
    test('should generate batch of images with different captions', async () => {
      // Create test images
      const images = await Promise.all([
        createTestImage('red', 'batch-1.jpg'),
        createTestImage('green', 'batch-2.jpg'),
        createTestImage('blue', 'batch-3.jpg')
      ]);
      
      const batchConfig = images.map((path, i) => ({
        imagePath: path,
        caption: `IMAGE ${i + 1}`,
        style: {
          fontSize: 64,
          color: '#ffffff',
          strokeColor: '#ff0000',
          strokeWidth: 3
        }
      }));
      
      const results = generateImageBatch(batchConfig, outputDir);
      
      // Execute all commands
      for (const result of results) {
        await cassetteManager.executeCommand(
          result.command, 
          `batch-${results.indexOf(result)}`
        );
      }
      
      // Verify all images created
      results.forEach(result => {
        expect(existsSync(result.outputPath)).toBe(true);
      });
      
      // Validate first image with vision
      const validation = await validator.validateRender(
        results[0].outputPath,
        'general',
        { command: results[0].command },
        ['IMAGE 1'],
        [results[0].command]
      );
      
      expect(validation.success).toBe(true);
      expect(validation.textDetection?.detectedText).toContain('IMAGE 1');
    });

    test('should handle custom output names in batch', async () => {
      const inputPath = await createTestImage('purple', 'batch-custom.jpg');
      
      const batchConfig = [
        { 
          imagePath: inputPath, 
          caption: 'MORNING', 
          outputName: 'morning-greeting' 
        },
        { 
          imagePath: inputPath, 
          caption: 'EVENING', 
          outputName: 'evening-greeting' 
        }
      ];
      
      const results = generateImageBatch(batchConfig, outputDir);
      
      expect(results[0].outputPath).toBe(join(outputDir, 'morning-greeting.jpg'));
      expect(results[1].outputPath).toBe(join(outputDir, 'evening-greeting.jpg'));
      
      // Execute commands
      for (const result of results) {
        await cassetteManager.executeCommand(
          result.command,
          `custom-name-${results.indexOf(result)}`
        );
      }
      
      // Verify files exist with correct names
      expect(existsSync(join(outputDir, 'morning-greeting.jpg'))).toBe(true);
      expect(existsSync(join(outputDir, 'evening-greeting.jpg'))).toBe(true);
    });
  });

  describe('🎬 Slideshow Generation', () => {
    test('should create slideshow from multiple images', async () => {
      // Create test images
      const images = await Promise.all([
        createTestImage('red', 'slide-1.jpg'),
        createTestImage('green', 'slide-2.jpg'),
        createTestImage('blue', 'slide-3.jpg')
      ]);
      
      const slideConfig = images.map((path, i) => ({
        imagePath: path,
        caption: `SLIDE ${i + 1}`
      }));
      
      const outputPath = join(outputDir, 'slideshow.mp4');
      const command = createSlideshow(slideConfig, outputPath, {
        slideDuration: 2,
        transition: 'fade',
        transitionDuration: 0.5
      });
      
      const result = await cassetteManager.executeCommand(command, 'slideshow');
      
      expect(existsSync(outputPath)).toBe(true);
      
      // Probe video duration
      const probeCommand = `ffprobe -v quiet -print_format json -show_format "${outputPath}"`;
      const probeResult = await cassetteManager.executeCommand(probeCommand, 'probe-slideshow');
      const probeData = JSON.parse(probeResult.output);
      
      // Should be approximately 6 seconds (3 slides × 2 seconds)
      expect(parseFloat(probeData.format.duration)).toBeGreaterThan(5);
      expect(parseFloat(probeData.format.duration)).toBeLessThan(7);
    });

    test('should position captions correctly in slideshow frames', async () => {
      const inputPath = await createTestImage('gray', 'slide-pos.jpg');
      
      const slideConfig = [
        {
          imagePath: inputPath,
          caption: 'TOP TEXT',
          position: { x: '50%', y: '10%', anchor: 'top-center' }
        },
        {
          imagePath: inputPath,
          caption: 'BOTTOM TEXT',
          position: { x: '50%', y: '90%', anchor: 'bottom-center' }
        }
      ];
      
      const outputPath = join(outputDir, 'positioned-slideshow.mp4');
      const command = createSlideshow(slideConfig, outputPath, {
        slideDuration: 1
      });
      
      const result = await cassetteManager.executeCommand(command, 'positioned-slideshow');
      
      // Extract frames and validate text position
      const frame1Path = join(outputDir, 'frame-1.jpg');
      const extractCommand = `ffmpeg -i "${outputPath}" -ss 0.5 -frames:v 1 -y "${frame1Path}"`;
      await cassetteManager.executeCommand(extractCommand, 'extract-frame-1');
      
      const validation = await validator.validateRender(
        frame1Path,
        'general',
        { command },
        ['TOP TEXT'],
        [command]
      );
      
      expect(validation.success).toBe(true);
      expect(validation.textDetection?.detectedText).toContain('TOP TEXT');
    });
  });

  describe('📱 Social Media Formats', () => {
    test('should create Instagram post with square aspect ratio', async () => {
      const inputPath = await createTestImage('pink', 'insta-input.jpg');
      const outputPath = join(outputDir, 'instagram-post.jpg');
      
      const command = createInstagramPost(
        inputPath,
        'CHECK OUT MY POST! 🔥',
        outputPath
      );
      
      const result = await cassetteManager.executeCommand(command, 'instagram-post');
      
      // Validate with vision
      const validation = await validator.validateRender(
        outputPath,
        'instagram',
        { command },
        ['CHECK OUT MY POST'],
        [command]
      );
      
      expect(validation.success).toBe(true);
      expect(validation.platformCompliance?.aspectRatio).toBe('1:1');
      expect(validation.qualityScore).toBeGreaterThan(0.85);
    });

    test('should create TikTok thumbnail with vertical aspect', async () => {
      const inputPath = await createTestImage('black', 'tiktok-input.jpg');
      const outputPath = join(outputDir, 'tiktok-thumb.jpg');
      
      const command = createTikTokThumbnail(
        inputPath,
        'VIRAL VIDEO!',
        outputPath
      );
      
      const result = await cassetteManager.executeCommand(command, 'tiktok-thumb');
      
      // Validate aspect ratio
      const probeCommand = `ffprobe -v quiet -print_format json -show_streams "${outputPath}"`;
      const probeResult = await cassetteManager.executeCommand(probeCommand, 'probe-tiktok');
      const probeData = JSON.parse(probeResult.output);
      const stream = probeData.streams[0];
      
      const aspectRatio = stream.width / stream.height;
      expect(aspectRatio).toBeCloseTo(9/16, 2);
    });

    test('should create meme with top and bottom text', async () => {
      const inputPath = await createTestImage('white', 'meme-input.jpg');
      const outputPath = join(outputDir, 'meme.jpg');
      
      const command = createMeme(
        inputPath,
        'One does not simply',
        'Create memes with FFmpeg',
        outputPath
      );
      
      const result = await cassetteManager.executeCommand(command, 'meme');
      
      // Validate both texts are present
      const validation = await validator.validateRender(
        outputPath,
        'general',
        { command },
        ['ONE DOES NOT SIMPLY', 'CREATE MEMES WITH FFMPEG'],
        [command]
      );
      
      expect(validation.success).toBe(true);
      expect(validation.textDetection?.confidence).toBeGreaterThan(0.8);
    });

    test('should create quote card with styling', async () => {
      const inputPath = await createTestImage('darkblue', 'quote-bg.jpg');
      const outputPath = join(outputDir, 'quote.jpg');
      
      const command = createQuoteCard(
        inputPath,
        'The only way to do great work is to love what you do',
        'Steve Jobs',
        outputPath,
        { overlay: true }
      );
      
      const result = await cassetteManager.executeCommand(command, 'quote-card');
      
      // Validate quote and author
      const validation = await validator.validateRender(
        outputPath,
        'general',
        { command },
        ['great work', 'Steve Jobs'],
        [command]
      );
      
      expect(validation.success).toBe(true);
      expect(validation.qualityScore).toBeGreaterThan(0.8);
    });
  });

  describe('🎨 Advanced Styling Runtime Tests', () => {
    test('should render complex text styling correctly', async () => {
      const inputPath = await createTestImage('darkgray', 'styled-bg.jpg');
      const outputPath = join(outputDir, 'complex-styled.jpg');
      
      const command = generateImageWithCaption(
        inputPath,
        'STYLED TEXT',
        outputPath,
        {
          position: { x: '50%', y: '50%', anchor: 'center' },
          style: {
            fontSize: 96,
            color: '#ff6600',
            strokeColor: '#ffffff',
            strokeWidth: 6,
            background: {
              color: 'rgba(0,0,0,0.8)',
              padding: 40,
              borderRadius: 20
            }
          }
        }
      );
      
      const result = await cassetteManager.executeCommand(command, 'complex-styled');
      
      // Validate styling
      const validation = await validator.validateRender(
        outputPath,
        'general',
        { command },
        ['STYLED TEXT'],
        [command]
      );
      
      expect(validation.success).toBe(true);
      expect(validation.qualityScore).toBeGreaterThan(0.85);
      
      // Check recommendations for text visibility
      if (validation.recommendations.length > 0) {
        console.log('Style recommendations:', validation.recommendations);
      }
    });

    test('should handle multi-line text properly', async () => {
      const inputPath = await createTestImage('lightgray', 'multiline-bg.jpg');
      const outputPath = join(outputDir, 'multiline-text.jpg');
      
      const multilineText = 'THIS IS LINE ONE\\nTHIS IS LINE TWO\\nTHIS IS LINE THREE';
      
      const command = generateImageWithCaption(
        inputPath,
        multilineText,
        outputPath,
        {
          position: { x: '50%', y: '50%', anchor: 'center' },
          style: {
            fontSize: 48,
            color: '#000000',
            textAlign: 'center',
            lineHeight: 1.5
          }
        }
      );
      
      const result = await cassetteManager.executeCommand(command, 'multiline-text');
      
      expect(existsSync(outputPath)).toBe(true);
    });

    test('should handle percentage positioning accurately', async () => {
      const inputPath = await createTestImage('navy', 'position-bg.jpg');
      const outputPath = join(outputDir, 'percentage-positions.jpg');
      
      // Create multiple text overlays at different percentage positions
      let command = generateImageWithCaption(
        inputPath,
        'TOP LEFT (25%, 25%)',
        outputPath,
        {
          position: { x: '25%', y: '25%', anchor: 'center' }
        }
      );
      
      const result = await cassetteManager.executeCommand(command, 'percentage-pos');
      
      const validation = await validator.validateRender(
        outputPath,
        'general',
        { command },
        ['TOP LEFT', '25%'],
        [command]
      );
      
      expect(validation.success).toBe(true);
    });
  });

  describe('🚨 Error Handling and Edge Cases', () => {
    test('should handle special characters in captions', async () => {
      const inputPath = await createTestImage('brown', 'special-bg.jpg');
      const outputPath = join(outputDir, 'special-chars.jpg');
      
      const specialText = "It's \"special\" & costs $100!";
      
      const command = generateImageWithCaption(
        inputPath,
        specialText,
        outputPath
      );
      
      const result = await cassetteManager.executeCommand(command, 'special-chars');
      
      expect(existsSync(outputPath)).toBe(true);
    });

    test('should handle very long captions gracefully', async () => {
      const inputPath = await createTestImage('orange', 'long-bg.jpg');
      const outputPath = join(outputDir, 'long-caption.jpg');
      
      const longText = 'This is a very long caption that should wrap properly and not overflow the image boundaries when rendered with appropriate styling';
      
      const command = generateImageWithCaption(
        inputPath,
        longText,
        outputPath,
        {
          style: {
            fontSize: 32,
            color: '#ffffff',
            background: { color: 'rgba(0,0,0,0.7)', padding: 20 }
          }
        }
      );
      
      const result = await cassetteManager.executeCommand(command, 'long-caption');
      
      const validation = await validator.validateRender(
        outputPath,
        'general',
        { command },
        ['long caption', 'wrap properly'],
        [command]
      );
      
      expect(validation.success).toBe(true);
    });

    test('should generate high-resolution output', async () => {
      const inputPath = await createTestImage('teal', 'hires-bg.jpg');
      const outputPath = join(outputDir, 'high-res.jpg');
      
      const command = generateImageWithCaption(
        inputPath,
        'HIGH RESOLUTION',
        outputPath,
        {
          format: { quality: 100 },
          style: { fontSize: 120 }
        }
      );
      
      const result = await cassetteManager.executeCommand(command, 'high-res');
      
      // Check image dimensions
      const probeCommand = `ffprobe -v quiet -print_format json -show_streams "${outputPath}"`;
      const probeResult = await cassetteManager.executeCommand(probeCommand, 'probe-hires');
      const probeData = JSON.parse(probeResult.output);
      const stream = probeData.streams[0];
      
      expect(stream.width).toBeGreaterThanOrEqual(1920);
      expect(stream.height).toBeGreaterThanOrEqual(1080);
    });
  });
});
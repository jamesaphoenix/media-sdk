/**
 * Comprehensive Runtime + Vision Tests
 * 
 * These tests ensure that our SDK produces real, high-quality video outputs
 * by combining FFmpeg execution with AI vision validation
 */

import { test, expect, describe, beforeAll, afterAll } from 'bun:test';
import { 
  Timeline,
  tiktok,
  instagram,
  youtube,
  fadeIn,
  fadeOut,
  brightness,
  contrast,
  blur,
  vignette,
  generateImageWithCaption,
  createSlideshow,
  createInstagramPost,
  createTikTokThumbnail,
  createMeme,
  createQuoteCard
} from '@jamesaphoenix/media-sdk';
import { join } from 'path';
import { existsSync, mkdirSync, rmSync } from 'fs';
import { RuntimeValidator } from '../src/runtime-validator';
import { EnhancedBunCassetteManager } from '../src/enhanced-bun-cassette-manager';

// Test configuration
const TEST_OUTPUT_DIR = join(process.cwd(), 'test-outputs/runtime-vision');
const TEST_ASSETS_DIR = join(process.cwd(), 'test-assets');
const validator = new RuntimeValidator();
const cassetteManager = new EnhancedBunCassetteManager({
  cassetteDir: join(process.cwd(), 'test-cassettes/runtime-vision'),
  mode: process.env.CASSETTE_MODE || 'auto'
});

// Sample test video path
const SAMPLE_VIDEO = join(TEST_ASSETS_DIR, 'sample-video.mp4');
const SAMPLE_IMAGE = join(TEST_ASSETS_DIR, 'sample-image.jpg');
const LOGO_IMAGE = join(TEST_ASSETS_DIR, 'logo.png');
const BACKGROUND_MUSIC = join(TEST_ASSETS_DIR, 'background-music.mp3');
const SOUND_EFFECT = join(TEST_ASSETS_DIR, 'sound-effect.wav');
const VOICEOVER = join(TEST_ASSETS_DIR, 'voiceover.mp3');

beforeAll(() => {
  // Ensure output directory exists
  if (!existsSync(TEST_OUTPUT_DIR)) {
    mkdirSync(TEST_OUTPUT_DIR, { recursive: true });
  }
});

afterAll(() => {
  // Cleanup test outputs if not in debug mode
  if (process.env.KEEP_TEST_OUTPUTS !== 'true') {
    rmSync(TEST_OUTPUT_DIR, { recursive: true, force: true });
  }
});

describe('🎬 COMPREHENSIVE RUNTIME + VISION TESTS', () => {
  describe('📱 Platform-Specific Video Generation', () => {
    test('should generate TikTok-optimized video with captions', async () => {
      const outputPath = join(TEST_OUTPUT_DIR, 'tiktok-with-captions.mp4');
      
      const timeline = tiktok(SAMPLE_VIDEO)
        .addText('VIRAL CONTENT! 🔥', {
          position: 'center',
          style: {
            fontSize: 72,
            color: '#ff0050',
            strokeColor: '#ffffff',
            strokeWidth: 4
          }
        })
        .addText('Follow for more!', {
          position: 'bottom',
          startTime: 2,
          duration: 3,
          style: {
            fontSize: 36,
            color: '#ffffff',
            background: { color: 'rgba(0,0,0,0.8)', padding: 20 }
          }
        })
        .pipe(fadeIn(0.5))
        .pipe(fadeOut(0.5));

      const command = timeline.getCommand(outputPath);
      const result = await cassetteManager.executeCommand(command);
      
      expect(result.success).toBe(true);
      
      // Validate with vision
      const validation = await validator.validateRender(
        outputPath,
        'tiktok',
        { command, timeline },
        ['VIRAL CONTENT', 'Follow for more'],
        [command]
      );
      
      expect(validation.isValid).toBe(true);
      expect(validation.platformCompliance?.aspectRatio).toBe('9:16');
      expect(validation.textDetection?.texts).toContain('VIRAL CONTENT');
      expect(validation.qualityScore).toBeGreaterThan(0.8);
    });

    test('should generate Instagram square video with multiple overlays', async () => {
      const outputPath = join(TEST_OUTPUT_DIR, 'instagram-multi-overlay.mp4');
      
      const timeline = instagram(SAMPLE_VIDEO)
        .addText('Premium Quality ✨', {
          position: { x: '50%', y: '20%', anchor: 'center' },
          style: {
            fontSize: 48,
            color: '#e4405f',
            fontFamily: 'Arial',
            fontWeight: 'bold'
          }
        })
        .addImage(LOGO_IMAGE, {
          position: 'bottom-right',
          width: 100,
          opacity: 0.8
        })
        .addFilter('brightness', { brightness: 0.1 })
        .addFilter('contrast', { contrast: 1.2 })
        .addFilter('vignette');

      const command = timeline.getCommand(outputPath);
      const result = await cassetteManager.executeCommand(command);
      
      expect(result.success).toBe(true);
      
      const validation = await validator.validateRender(
        outputPath,
        'instagram',
        { command, timeline },
        ['Premium Quality'],
        [command]
      );
      
      expect(validation.isValid).toBe(true);
      expect(validation.platformCompliance?.aspectRatio).toBe('1:1');
      expect(validation.visualEffects).toContain('vignette');
      expect(validation.qualityScore).toBeGreaterThan(0.85);
    });

    test('should generate YouTube video with intro and outro', async () => {
      const outputPath = join(TEST_OUTPUT_DIR, 'youtube-intro-outro.mp4');
      
      const timeline = youtube(SAMPLE_VIDEO)
        .trim(5, 25) // Use middle 20 seconds
        .addText('SUBSCRIBE AND HIT THE BELL! 🔔', {
          position: 'top',
          startTime: 0,
          duration: 5,
          style: {
            fontSize: 64,
            color: '#ff0000',
            strokeColor: '#ffffff',
            strokeWidth: 3,
            background: { color: 'rgba(0,0,0,0.9)', padding: 30 }
          }
        })
        .addText('Thanks for watching!', {
          position: 'center',
          startTime: 15,
          duration: 5,
          style: {
            fontSize: 48,
            color: '#ffffff'
          }
        })
        .pipe(fadeIn(1.0))
        .pipe(fadeOut(1.0));

      const command = timeline.getCommand(outputPath);
      const result = await cassetteManager.executeCommand(command);
      
      expect(result.success).toBe(true);
      
      const validation = await validator.validateRender(
        outputPath,
        'youtube',
        { command, timeline },
        ['SUBSCRIBE', 'Thanks for watching'],
        [command]
      );
      
      expect(validation.isValid).toBe(true);
      expect(validation.platformCompliance?.aspectRatio).toBe('16:9');
      expect(validation.duration).toBeCloseTo(20, 1);
    });
  });

  describe('🎨 Advanced Visual Effects Testing', () => {
    test('should apply complex filter chain with quality validation', async () => {
      const outputPath = join(TEST_OUTPUT_DIR, 'complex-filters.mp4');
      
      const timeline = new Timeline()
        .addVideo(SAMPLE_VIDEO)
        .addFilter('brightness', { brightness: 0.2 })
        .addFilter('contrast', { contrast: 1.3 })
        .addFilter('saturation', { saturation: 1.2 })
        .addFilter('blur', { radius: 2 })
        .addFilter('vignette')
        .addText('Cinematic Look', {
          position: 'bottom',
          style: {
            fontSize: 36,
            color: '#ffffff',
            strokeColor: '#000000',
            strokeWidth: 2
          }
        });

      const command = timeline.getCommand(outputPath);
      const result = await cassetteManager.executeCommand(command);
      
      expect(result.success).toBe(true);
      
      const validation = await validator.validateRender(
        outputPath,
        'generic',
        { command, timeline },
        ['Cinematic Look'],
        [command]
      );
      
      expect(validation.isValid).toBe(true);
      expect(validation.visualEffects).toContain('brightness');
      expect(validation.visualEffects).toContain('contrast');
      expect(validation.visualEffects).toContain('vignette');
      expect(validation.qualityScore).toBeGreaterThan(0.75);
    });

    test('should create picture-in-picture effect', async () => {
      const outputPath = join(TEST_OUTPUT_DIR, 'picture-in-picture.mp4');
      
      const timeline = new Timeline()
        .addVideo(SAMPLE_VIDEO)
        .addVideo(SAMPLE_VIDEO, {
          position: { x: 20, y: 20 },
          width: 320,
          height: 180,
          startTime: 2,
          duration: 8
        })
        .addText('PiP Demo', {
          position: 'top-right',
          style: { fontSize: 24, color: '#00ff00' }
        });

      const command = timeline.getCommand(outputPath);
      const result = await cassetteManager.executeCommand(command);
      
      expect(result.success).toBe(true);
      
      const validation = await validator.validateRender(
        outputPath,
        'generic',
        { command, timeline },
        ['PiP Demo'],
        [command]
      );
      
      expect(validation.isValid).toBe(true);
      expect(validation.complexity).toBe('high');
    });
  });

  describe('📝 Advanced Caption and Text Animations', () => {
    test('should create word-by-word highlighting animation', async () => {
      const outputPath = join(TEST_OUTPUT_DIR, 'word-highlighting.mp4');
      
      const timeline = new Timeline()
        .addVideo(SAMPLE_VIDEO)
        .addWordHighlighting({
          text: 'This is amazing content that will go viral!',
          startTime: 1,
          duration: 6,
          wordsPerSecond: 2,
          preset: 'tiktok',
          highlightTransition: 'bounce'
        });

      const command = timeline.getCommand(outputPath);
      const result = await cassetteManager.executeCommand(command);
      
      expect(result.success).toBe(true);
      
      const validation = await validator.validateRender(
        outputPath,
        'tiktok',
        { command, timeline },
        ['This', 'amazing', 'content', 'viral'],
        [command]
      );
      
      expect(validation.isValid).toBe(true);
      expect(validation.textAnimations).toContain('word-highlighting');
      expect(validation.qualityScore).toBeGreaterThan(0.8);
    });

    test('should create multi-language captions', async () => {
      const outputPath = join(TEST_OUTPUT_DIR, 'multi-language-captions.mp4');
      
      const timeline = new Timeline()
        .addVideo(SAMPLE_VIDEO)
        .addText('Hello World!', {
          position: { x: '50%', y: '40%', anchor: 'center' },
          startTime: 0,
          duration: 3,
          style: { fontSize: 48, color: '#ffffff' }
        })
        .addText('¡Hola Mundo!', {
          position: { x: '50%', y: '50%', anchor: 'center' },
          startTime: 0,
          duration: 3,
          style: { fontSize: 48, color: '#ffff00' }
        })
        .addText('Bonjour le Monde!', {
          position: { x: '50%', y: '60%', anchor: 'center' },
          startTime: 0,
          duration: 3,
          style: { fontSize: 48, color: '#00ff00' }
        });

      const command = timeline.getCommand(outputPath);
      const result = await cassetteManager.executeCommand(command);
      
      expect(result.success).toBe(true);
      
      const validation = await validator.validateRender(
        outputPath,
        'generic',
        { command, timeline },
        ['Hello World', 'Hola Mundo', 'Bonjour'],
        [command]
      );
      
      expect(validation.isValid).toBe(true);
      expect(validation.textDetection?.texts.length).toBeGreaterThanOrEqual(3);
    });

    test('should create typewriter effect animation', async () => {
      const outputPath = join(TEST_OUTPUT_DIR, 'typewriter-effect.mp4');
      
      const timeline = new Timeline()
        .addVideo(SAMPLE_VIDEO)
        .addCaptions({
          captions: [
            { text: 'Once upon a time...', duration: 3 },
            { text: 'In a galaxy far, far away...', duration: 3 },
            { text: 'The adventure begins!', duration: 2 }
          ],
          preset: 'typewriter',
          transition: 'fade',
          globalStyle: {
            fontSize: 36,
            color: '#ffffff',
            background: { color: 'rgba(0,0,0,0.8)', padding: 20 }
          }
        });

      const command = timeline.getCommand(outputPath);
      const result = await cassetteManager.executeCommand(command);
      
      expect(result.success).toBe(true);
      
      const validation = await validator.validateRender(
        outputPath,
        'generic',
        { command, timeline },
        ['Once upon', 'galaxy', 'adventure'],
        [command]
      );
      
      expect(validation.isValid).toBe(true);
      expect(validation.textAnimations).toContain('typewriter');
    });
  });

  describe('🖼️ Image Generation and Slideshow Tests', () => {
    test('should generate image with caption overlay', async () => {
      const outputPath = join(TEST_OUTPUT_DIR, 'image-with-caption.jpg');
      
      const command = generateImageWithCaption(
        SAMPLE_IMAGE,
        'Beautiful Sunset 🌅',
        outputPath,
        {
          position: { x: '50%', y: '90%', anchor: 'bottom-center' },
          style: {
            fontSize: 64,
            color: '#ffffff',
            strokeColor: '#ff6600',
            strokeWidth: 3,
            background: { color: 'rgba(0,0,0,0.7)', padding: 30, borderRadius: 15 }
          },
          format: { quality: 95 }
        }
      );

      const result = await cassetteManager.executeCommand(command);
      expect(result.success).toBe(true);
      
      // Note: Vision validation for static images would need special handling
      expect(existsSync(outputPath)).toBe(true);
    });

    test('should create animated slideshow from images', async () => {
      const outputPath = join(TEST_OUTPUT_DIR, 'animated-slideshow.mp4');
      
      const images = [
        { imagePath: SAMPLE_IMAGE, caption: 'Welcome to our journey' },
        { imagePath: SAMPLE_IMAGE, caption: 'Amazing moments' },
        { imagePath: SAMPLE_IMAGE, caption: 'Thank you for watching!' }
      ];
      
      const command = createSlideshow(images, outputPath, {
        slideDuration: 3,
        transition: 'fade',
        transitionDuration: 0.5,
        style: {
          fontSize: 48,
          color: '#ffffff',
          strokeColor: '#000000',
          strokeWidth: 3
        }
      });

      const result = await cassetteManager.executeCommand(command);
      expect(result.success).toBe(true);
      
      const validation = await validator.validateRender(
        outputPath,
        'generic',
        { command },
        ['Welcome', 'Amazing', 'Thank you'],
        [command]
      );
      
      expect(validation.isValid).toBe(true);
      expect(validation.duration).toBeCloseTo(9, 1); // 3 slides × 3 seconds
    });

    test('should create social media image formats', async () => {
      // Instagram Post
      const instagramPath = join(TEST_OUTPUT_DIR, 'instagram-post.jpg');
      const instagramCommand = createInstagramPost(
        SAMPLE_IMAGE,
        'Double tap if you love this! ❤️',
        instagramPath
      );
      
      const instagramResult = await cassetteManager.executeCommand(instagramCommand);
      expect(instagramResult.success).toBe(true);
      
      // TikTok Thumbnail
      const tiktokPath = join(TEST_OUTPUT_DIR, 'tiktok-thumbnail.jpg');
      const tiktokCommand = createTikTokThumbnail(
        SAMPLE_IMAGE,
        'MUST WATCH! 😱',
        tiktokPath
      );
      
      const tiktokResult = await cassetteManager.executeCommand(tiktokCommand);
      expect(tiktokResult.success).toBe(true);
      
      // Meme
      const memePath = join(TEST_OUTPUT_DIR, 'meme.jpg');
      const memeCommand = createMeme(
        SAMPLE_IMAGE,
        'When you write tests',
        'And they all pass',
        memePath
      );
      
      const memeResult = await cassetteManager.executeCommand(memeCommand);
      expect(memeResult.success).toBe(true);
      
      // Quote Card
      const quotePath = join(TEST_OUTPUT_DIR, 'quote-card.jpg');
      const quoteCommand = createQuoteCard(
        SAMPLE_IMAGE,
        'Code is poetry',
        'Anonymous Developer',
        quotePath
      );
      
      const quoteResult = await cassetteManager.executeCommand(quoteCommand);
      expect(quoteResult.success).toBe(true);
    });
  });

  describe('🎯 Performance and Stress Tests', () => {
    test('should handle rapid text updates efficiently', async () => {
      const outputPath = join(TEST_OUTPUT_DIR, 'rapid-text-updates.mp4');
      
      let timeline = new Timeline().addVideo(SAMPLE_VIDEO);
      
      // Add 20 rapid text updates
      for (let i = 0; i < 20; i++) {
        timeline = timeline.addText(`Update ${i + 1}`, {
          position: 'center',
          startTime: i * 0.5,
          duration: 0.5,
          style: {
            fontSize: 48,
            color: `hsl(${i * 18}, 100%, 50%)`
          }
        });
      }
      
      const command = timeline.getCommand(outputPath);
      const result = await cassetteManager.executeCommand(command);
      
      expect(result.success).toBe(true);
      
      const validation = await validator.validateRender(
        outputPath,
        'generic',
        { command, timeline },
        ['Update'],
        [command]
      );
      
      expect(validation.isValid).toBe(true);
      expect(validation.performance?.renderTime).toBeLessThan(30000); // 30 seconds
    });

    test('should handle multiple concurrent overlays', async () => {
      const outputPath = join(TEST_OUTPUT_DIR, 'concurrent-overlays.mp4');
      
      const timeline = new Timeline()
        .addVideo(SAMPLE_VIDEO)
        // Add 5 concurrent text overlays
        .addText('Top Left', {
          position: 'top-left',
          style: { fontSize: 24, color: '#ff0000' }
        })
        .addText('Top Right', {
          position: 'top-right',
          style: { fontSize: 24, color: '#00ff00' }
        })
        .addText('Center', {
          position: 'center',
          style: { fontSize: 48, color: '#0000ff' }
        })
        .addText('Bottom Left', {
          position: 'bottom-left',
          style: { fontSize: 24, color: '#ffff00' }
        })
        .addText('Bottom Right', {
          position: 'bottom-right',
          style: { fontSize: 24, color: '#ff00ff' }
        })
        // Add logo overlay
        .addImage(LOGO_IMAGE, {
          position: { x: '50%', y: '80%', anchor: 'center' },
          width: 100,
          opacity: 0.5
        });

      const command = timeline.getCommand(outputPath);
      const result = await cassetteManager.executeCommand(command);
      
      expect(result.success).toBe(true);
      
      const validation = await validator.validateRender(
        outputPath,
        'generic',
        { command, timeline },
        ['Top', 'Center', 'Bottom'],
        [command]
      );
      
      expect(validation.isValid).toBe(true);
      expect(validation.complexity).toBe('high');
    });
  });

  describe('🔍 Edge Cases and Error Recovery', () => {
    test('should handle empty text gracefully', async () => {
      const outputPath = join(TEST_OUTPUT_DIR, 'empty-text-handling.mp4');
      
      const timeline = new Timeline()
        .addVideo(SAMPLE_VIDEO)
        .addText('', { position: 'top' })
        .addText('Valid Text', { position: 'center' })
        .addText('', { position: 'bottom' });

      const command = timeline.getCommand(outputPath);
      const result = await cassetteManager.executeCommand(command);
      
      expect(result.success).toBe(true);
      
      const validation = await validator.validateRender(
        outputPath,
        'generic',
        { command, timeline },
        ['Valid Text'],
        [command]
      );
      
      expect(validation.isValid).toBe(true);
    });

    test('should handle special characters in text', async () => {
      const outputPath = join(TEST_OUTPUT_DIR, 'special-characters.mp4');
      
      const timeline = new Timeline()
        .addVideo(SAMPLE_VIDEO)
        .addText('Special: $100 & 50% off!', {
          position: 'top',
          style: { fontSize: 36 }
        })
        .addText('Quotes: "Hello" and \'World\'', {
          position: 'center',
          style: { fontSize: 36 }
        })
        .addText('Unicode: 🎬 🎨 🎯 ✨', {
          position: 'bottom',
          style: { fontSize: 36 }
        });

      const command = timeline.getCommand(outputPath);
      const result = await cassetteManager.executeCommand(command);
      
      expect(result.success).toBe(true);
      
      const validation = await validator.validateRender(
        outputPath,
        'generic',
        { command, timeline },
        ['Special', '100', 'Hello', 'Unicode'],
        [command]
      );
      
      expect(validation.isValid).toBe(true);
    });

    test('should handle very long text with wrapping', async () => {
      const outputPath = join(TEST_OUTPUT_DIR, 'long-text-wrapping.mp4');
      
      const longText = 'This is a very long text that should wrap properly when displayed on the video. It contains multiple sentences and should be readable despite its length.';
      
      const timeline = new Timeline()
        .addVideo(SAMPLE_VIDEO)
        .addText(longText, {
          position: 'center',
          style: {
            fontSize: 24,
            color: '#ffffff',
            background: { color: 'rgba(0,0,0,0.8)', padding: 20 },
            textAlign: 'center'
          }
        });

      const command = timeline.getCommand(outputPath);
      const result = await cassetteManager.executeCommand(command);
      
      expect(result.success).toBe(true);
      
      const validation = await validator.validateRender(
        outputPath,
        'generic',
        { command, timeline },
        ['long text', 'wrap properly'],
        [command]
      );
      
      expect(validation.isValid).toBe(true);
    });
  });

  describe('🎪 Complex Composition Tests', () => {
    test('should create news ticker style animation', async () => {
      const outputPath = join(TEST_OUTPUT_DIR, 'news-ticker.mp4');
      
      const timeline = new Timeline()
        .addVideo(SAMPLE_VIDEO)
        .addText('BREAKING NEWS:', {
          position: { x: 20, y: 'bottom' },
          style: {
            fontSize: 32,
            color: '#ff0000',
            background: { color: '#ffffff', padding: 10 }
          }
        })
        .addText('Media SDK passes all vision tests with flying colors!', {
          position: { x: 200, y: 'bottom' },
          style: {
            fontSize: 28,
            color: '#000000',
            background: { color: '#ffff00', padding: 10 }
          }
        });

      const command = timeline.getCommand(outputPath);
      const result = await cassetteManager.executeCommand(command);
      
      expect(result.success).toBe(true);
      
      const validation = await validator.validateRender(
        outputPath,
        'generic',
        { command, timeline },
        ['BREAKING NEWS', 'Media SDK'],
        [command]
      );
      
      expect(validation.isValid).toBe(true);
    });

    test('should create split-screen effect', async () => {
      const outputPath = join(TEST_OUTPUT_DIR, 'split-screen.mp4');
      
      const timeline = new Timeline()
        .setAspectRatio('16:9')
        .addVideo(SAMPLE_VIDEO, {
          crop: { x: 0, y: 0, width: 960, height: 1080 }
        })
        .addVideo(SAMPLE_VIDEO, {
          position: { x: 960, y: 0 },
          crop: { x: 0, y: 0, width: 960, height: 1080 }
        })
        .addText('BEFORE', {
          position: { x: '25%', y: '50%', anchor: 'center' },
          style: { fontSize: 48, color: '#ffffff' }
        })
        .addText('AFTER', {
          position: { x: '75%', y: '50%', anchor: 'center' },
          style: { fontSize: 48, color: '#ffffff' }
        });

      const command = timeline.getCommand(outputPath);
      const result = await cassetteManager.executeCommand(command);
      
      expect(result.success).toBe(true);
      
      const validation = await validator.validateRender(
        outputPath,
        'generic',
        { command, timeline },
        ['BEFORE', 'AFTER'],
        [command]
      );
      
      expect(validation.isValid).toBe(true);
      expect(validation.visualEffects).toContain('split-screen');
    });

    test('should create lower-third graphics', async () => {
      const outputPath = join(TEST_OUTPUT_DIR, 'lower-thirds.mp4');
      
      const timeline = new Timeline()
        .addVideo(SAMPLE_VIDEO)
        .addText('John Doe', {
          position: { x: 50, y: 'bottom' },
          startTime: 2,
          duration: 5,
          style: {
            fontSize: 36,
            color: '#ffffff',
            fontWeight: 'bold',
            background: { color: 'rgba(0,0,0,0.8)', padding: 15 }
          }
        })
        .addText('Software Engineer', {
          position: { x: 50, y: 'bottom' },
          startTime: 2,
          duration: 5,
          style: {
            fontSize: 24,
            color: '#cccccc',
            background: { color: 'rgba(0,0,0,0.8)', padding: 10 }
          }
        });

      const command = timeline.getCommand(outputPath);
      const result = await cassetteManager.executeCommand(command);
      
      expect(result.success).toBe(true);
      
      const validation = await validator.validateRender(
        outputPath,
        'generic',
        { command, timeline },
        ['John Doe', 'Software Engineer'],
        [command]
      );
      
      expect(validation.isValid).toBe(true);
      expect(validation.visualEffects).toContain('lower-third');
    });
  });

  describe('🌐 Accessibility and Compliance Tests', () => {
    test('should ensure text contrast meets accessibility standards', async () => {
      const outputPath = join(TEST_OUTPUT_DIR, 'accessible-contrast.mp4');
      
      const timeline = new Timeline()
        .addVideo(SAMPLE_VIDEO)
        .addText('High Contrast Text', {
          position: 'top',
          style: {
            fontSize: 48,
            color: '#ffffff',
            strokeColor: '#000000',
            strokeWidth: 3,
            background: { color: 'rgba(0,0,0,0.9)', padding: 20 }
          }
        })
        .addText('Readable Subtitle', {
          position: 'bottom',
          style: {
            fontSize: 32,
            color: '#000000',
            background: { color: 'rgba(255,255,255,0.95)', padding: 15 }
          }
        });

      const command = timeline.getCommand(outputPath);
      const result = await cassetteManager.executeCommand(command);
      
      expect(result.success).toBe(true);
      
      const validation = await validator.validateRender(
        outputPath,
        'generic',
        { command, timeline },
        ['High Contrast', 'Readable'],
        [command]
      );
      
      expect(validation.isValid).toBe(true);
      expect(validation.accessibility?.contrastRatio).toBeGreaterThan(4.5); // WCAG AA standard
    });

    test('should support closed caption formatting', async () => {
      const outputPath = join(TEST_OUTPUT_DIR, 'closed-captions.mp4');
      
      const timeline = new Timeline()
        .addVideo(SAMPLE_VIDEO)
        .addCaptions({
          captions: [
            { text: '[Music Playing]', startTime: 0, endTime: 2 },
            { text: 'Speaker: Welcome everyone!', startTime: 2, endTime: 4 },
            { text: '[Applause]', startTime: 4, endTime: 6 }
          ],
          globalStyle: {
            fontSize: 24,
            color: '#ffffff',
            background: { color: 'rgba(0,0,0,0.85)', padding: 10 },
            textAlign: 'center'
          },
          position: { x: '50%', y: '85%', anchor: 'center' }
        });

      const command = timeline.getCommand(outputPath);
      const result = await cassetteManager.executeCommand(command);
      
      expect(result.success).toBe(true);
      
      const validation = await validator.validateRender(
        outputPath,
        'generic',
        { command, timeline },
        ['Music Playing', 'Welcome', 'Applause'],
        [command]
      );
      
      expect(validation.isValid).toBe(true);
      expect(validation.accessibility?.hasCaptions).toBe(true);
    });
  });

  describe('🎵 Advanced Audio Layering Tests', () => {
    test('should layer multiple audio tracks with precise timing', async () => {
      const outputPath = join(TEST_OUTPUT_DIR, 'multi-audio-layers.mp4');
      
      const timeline = new Timeline()
        .addVideo(SAMPLE_VIDEO)
        // Background music at 30% volume
        .addAudio(BACKGROUND_MUSIC, {
          volume: 0.3,
          startTime: 0,
          duration: 30,
          fadeIn: 2,
          fadeOut: 3
        })
        // Sound effect at specific moment
        .addAudio(SOUND_EFFECT, {
          volume: 0.8,
          startTime: 5,
          duration: 2
        })
        // Another sound effect
        .addAudio(SOUND_EFFECT, {
          volume: 0.6,
          startTime: 12,
          duration: 1.5,
          pitch: 1.2 // Higher pitch
        })
        // Voiceover with ducking
        .addAudio(VOICEOVER, {
          volume: 1.0,
          startTime: 8,
          duration: 10,
          fadeIn: 0.5,
          fadeOut: 0.5
        })
        .addText('Multi-Audio Demo', {
          position: 'top',
          style: { fontSize: 48, color: '#ffffff' }
        });

      const command = timeline.getCommand(outputPath);
      const result = await cassetteManager.executeCommand(command);
      
      expect(result.success).toBe(true);
      
      const validation = await validator.validateRender(
        outputPath,
        'generic',
        { command, timeline },
        ['Multi-Audio Demo'],
        [command]
      );
      
      expect(validation.isValid).toBe(true);
      expect(validation.audioLayers).toBeGreaterThan(1);
    });

    test('should create dynamic audio ducking effect', async () => {
      const outputPath = join(TEST_OUTPUT_DIR, 'audio-ducking.mp4');
      
      const timeline = new Timeline()
        .addVideo(SAMPLE_VIDEO)
        // Background music
        .addAudio(BACKGROUND_MUSIC, {
          volume: 0.8,
          startTime: 0,
          duration: 20
        })
        // Ducked section for voiceover
        .addAudio(BACKGROUND_MUSIC, {
          volume: 0.2,
          startTime: 5,
          duration: 10,
          trimStart: 5,
          trimEnd: 15
        })
        // Voiceover on top
        .addAudio(VOICEOVER, {
          volume: 1.0,
          startTime: 5,
          duration: 10
        })
        .addText('Audio Ducking Example', {
          position: 'bottom',
          style: { fontSize: 36, color: '#00ff00' }
        });

      const command = timeline.getCommand(outputPath);
      const result = await cassetteManager.executeCommand(command);
      
      expect(result.success).toBe(true);
    });

    test('should apply audio effects and filters', async () => {
      const outputPath = join(TEST_OUTPUT_DIR, 'audio-effects.mp4');
      
      const timeline = new Timeline()
        .addVideo(SAMPLE_VIDEO)
        // Echo effect
        .addAudio(SOUND_EFFECT, {
          volume: 0.7,
          startTime: 2,
          echo: { delay: 500, decay: 0.5 }
        })
        // Reverb effect
        .addAudio(VOICEOVER, {
          volume: 0.8,
          startTime: 5,
          duration: 5,
          reverb: { room: 0.5, damping: 0.3 }
        })
        // Pitch shift
        .addAudio(SOUND_EFFECT, {
          volume: 0.6,
          startTime: 12,
          pitch: 0.8, // Lower pitch
          tempo: 1.2  // Faster tempo
        })
        // Filter effects
        .addAudio(BACKGROUND_MUSIC, {
          volume: 0.5,
          startTime: 0,
          duration: 20,
          lowpass: 1000, // Low-pass filter at 1kHz
          fadeIn: 1,
          fadeOut: 1
        });

      const command = timeline.getCommand(outputPath);
      const result = await cassetteManager.executeCommand(command);
      
      expect(result.success).toBe(true);
      
      const validation = await validator.validateRender(
        outputPath,
        'generic',
        { command, timeline },
        [],
        [command]
      );
      
      expect(validation.isValid).toBe(true);
      expect(validation.audioEffects).toContain('echo');
      expect(validation.audioEffects).toContain('filters');
    });

    test('should create looping background music', async () => {
      const outputPath = join(TEST_OUTPUT_DIR, 'looping-audio.mp4');
      
      const timeline = new Timeline()
        .addVideo(SAMPLE_VIDEO)
        .trim(0, 30) // 30 second video
        // Short music clip that loops
        .addAudio(SOUND_EFFECT, {
          volume: 0.4,
          startTime: 0,
          duration: 30,
          loop: true,
          fadeIn: 1,
          fadeOut: 2
        })
        .addText('Looping Audio Demo', {
          position: 'center',
          style: { fontSize: 48, color: '#ff00ff' }
        });

      const command = timeline.getCommand(outputPath);
      const result = await cassetteManager.executeCommand(command);
      
      expect(result.success).toBe(true);
    });

    test('should synchronize audio with visual events', async () => {
      const outputPath = join(TEST_OUTPUT_DIR, 'audio-visual-sync.mp4');
      
      const timeline = new Timeline()
        .addVideo(SAMPLE_VIDEO)
        // Sound effects synchronized with text appearances
        .addText('BOOM!', {
          position: 'center',
          startTime: 2,
          duration: 1,
          style: { fontSize: 72, color: '#ff0000' }
        })
        .addAudio(SOUND_EFFECT, {
          volume: 1.0,
          startTime: 2,
          duration: 1
        })
        .addText('CRASH!', {
          position: 'center',
          startTime: 5,
          duration: 1,
          style: { fontSize: 72, color: '#ff8800' }
        })
        .addAudio(SOUND_EFFECT, {
          volume: 0.9,
          startTime: 5,
          duration: 1,
          pitch: 0.7
        })
        .addText('BANG!', {
          position: 'center',
          startTime: 8,
          duration: 1,
          style: { fontSize: 72, color: '#ffff00' }
        })
        .addAudio(SOUND_EFFECT, {
          volume: 0.8,
          startTime: 8,
          duration: 1,
          pitch: 1.5
        });

      const command = timeline.getCommand(outputPath);
      const result = await cassetteManager.executeCommand(command);
      
      expect(result.success).toBe(true);
      
      const validation = await validator.validateRender(
        outputPath,
        'generic',
        { command, timeline },
        ['BOOM', 'CRASH', 'BANG'],
        [command]
      );
      
      expect(validation.isValid).toBe(true);
      expect(validation.audioVisualSync).toBe(true);
    });

    test('should create podcast-style audio mix', async () => {
      const outputPath = join(TEST_OUTPUT_DIR, 'podcast-mix.mp4');
      
      const timeline = new Timeline()
        .addVideo(SAMPLE_VIDEO)
        // Intro music
        .addAudio(BACKGROUND_MUSIC, {
          volume: 0.8,
          startTime: 0,
          duration: 5,
          fadeOut: 2
        })
        // Main voiceover
        .addAudio(VOICEOVER, {
          volume: 1.0,
          startTime: 3,
          duration: 20,
          highpass: 80, // Remove low frequencies
          fadeIn: 0.5
        })
        // Background music bed
        .addAudio(BACKGROUND_MUSIC, {
          volume: 0.15,
          startTime: 5,
          duration: 18,
          trimStart: 5,
          lowpass: 5000 // Muffled background
        })
        // Outro music
        .addAudio(BACKGROUND_MUSIC, {
          volume: 0.8,
          startTime: 23,
          duration: 7,
          trimStart: 23,
          fadeIn: 2
        })
        .addText('Podcast Episode #1', {
          position: 'bottom',
          style: { 
            fontSize: 36, 
            color: '#ffffff',
            background: { color: 'rgba(0,0,0,0.8)', padding: 20 }
          }
        });

      const command = timeline.getCommand(outputPath);
      const result = await cassetteManager.executeCommand(command);
      
      expect(result.success).toBe(true);
      
      const validation = await validator.validateRender(
        outputPath,
        'generic',
        { command, timeline },
        ['Podcast Episode'],
        [command]
      );
      
      expect(validation.isValid).toBe(true);
      expect(validation.audioQuality).toBe('professional');
    });

    test('should handle complex audio timing scenarios', async () => {
      const outputPath = join(TEST_OUTPUT_DIR, 'complex-audio-timing.mp4');
      
      const timeline = new Timeline()
        .addVideo(SAMPLE_VIDEO)
        // Staggered sound effects
        .addAudio(SOUND_EFFECT, {
          volume: 0.5,
          startTime: 1,
          duration: 0.5
        })
        .addAudio(SOUND_EFFECT, {
          volume: 0.6,
          startTime: 1.5,
          duration: 0.5,
          pitch: 1.1
        })
        .addAudio(SOUND_EFFECT, {
          volume: 0.7,
          startTime: 2,
          duration: 0.5,
          pitch: 1.2
        })
        .addAudio(SOUND_EFFECT, {
          volume: 0.8,
          startTime: 2.5,
          duration: 0.5,
          pitch: 1.3
        })
        // Overlapping voiceovers
        .addAudio(VOICEOVER, {
          volume: 0.9,
          startTime: 5,
          duration: 5,
          trimStart: 0,
          trimEnd: 5
        })
        .addAudio(VOICEOVER, {
          volume: 0.9,
          startTime: 8,
          duration: 5,
          trimStart: 5,
          trimEnd: 10,
          echo: { delay: 200, decay: 0.3 }
        })
        .addText('Complex Audio Timing', {
          position: 'top',
          style: { fontSize: 42, color: '#00ffff' }
        });

      const command = timeline.getCommand(outputPath);
      const result = await cassetteManager.executeCommand(command);
      
      expect(result.success).toBe(true);
    });

    test('should create cinematic audio atmosphere', async () => {
      const outputPath = join(TEST_OUTPUT_DIR, 'cinematic-audio.mp4');
      
      const timeline = new Timeline()
        .addVideo(SAMPLE_VIDEO)
        // Ambient background
        .addAudio(BACKGROUND_MUSIC, {
          volume: 0.3,
          startTime: 0,
          duration: 20,
          reverb: { room: 0.8, damping: 0.2 },
          lowpass: 3000
        })
        // Dramatic music swell
        .addAudio(BACKGROUND_MUSIC, {
          volume: 0.1,
          startTime: 5,
          duration: 10,
          trimStart: 10,
          trimEnd: 20,
          fadeIn: 3,
          fadeOut: 2
        })
        // Impact sound
        .addAudio(SOUND_EFFECT, {
          volume: 1.0,
          startTime: 10,
          duration: 2,
          pitch: 0.5,
          reverb: { room: 0.9, damping: 0.1 }
        })
        // Whispered voiceover
        .addAudio(VOICEOVER, {
          volume: 0.6,
          startTime: 12,
          duration: 5,
          highpass: 200,
          reverb: { room: 0.3, damping: 0.5 }
        })
        .addFilter('brightness', { brightness: -0.2 })
        .addFilter('vignette')
        .addText('CINEMATIC', {
          position: 'center',
          startTime: 10,
          duration: 3,
          style: { 
            fontSize: 96, 
            color: '#ffffff',
            strokeColor: '#000000',
            strokeWidth: 4
          }
        });

      const command = timeline.getCommand(outputPath);
      const result = await cassetteManager.executeCommand(command);
      
      expect(result.success).toBe(true);
      
      const validation = await validator.validateRender(
        outputPath,
        'generic',
        { command, timeline },
        ['CINEMATIC'],
        [command]
      );
      
      expect(validation.isValid).toBe(true);
      expect(validation.productionValue).toBe('high');
    });
  });
});
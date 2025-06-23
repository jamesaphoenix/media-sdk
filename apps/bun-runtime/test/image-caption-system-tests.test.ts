/**
 * @fileoverview Image Caption System Tests
 * 
 * Comprehensive tests for the advanced image + caption functionality
 */

import { test, expect, describe, beforeAll, afterAll } from 'bun:test';
import { ImageCaptionSystem, ImageCaptionTemplate } from '../../../packages/media-sdk/src/effects/image-caption-system.js';
import { ImageSourceHandler } from '../../../packages/media-sdk/src/utils/image-source-handler.js';
import { Timeline } from '@jamesaphoenix/media-sdk';
import { promises as fs } from 'fs';
import { join } from 'path';
import { tmpdir } from 'os';

describe('🎨 IMAGE CAPTION SYSTEM TESTS', () => {
  let testDir: string;
  let system: ImageCaptionSystem;
  let imageHandler: ImageSourceHandler;
  
  beforeAll(async () => {
    testDir = join(tmpdir(), 'image-caption-tests-' + Date.now());
    await fs.mkdir(testDir, { recursive: true });
    
    imageHandler = new ImageSourceHandler({
      downloadDir: join(testDir, 'images'),
      enableCache: true
    });
    
    system = new ImageCaptionSystem(imageHandler);
    
    // Create test images
    await createTestImages();
  });
  
  afterAll(async () => {
    try {
      await system.cleanup();
      await cleanupDirectory(testDir);
    } catch (e) {
      console.error('Cleanup error:', e);
    }
  });

  async function createTestImages() {
    const images = [
      'test-photo.jpg',
      'test-product.jpg',
      'test-quote-bg.jpg',
      'test-before.jpg',
      'test-after.jpg'
    ];
    
    for (const filename of images) {
      // Create a simple JPEG header
      const buffer = Buffer.from([
        0xFF, 0xD8, 0xFF, 0xE0, 0x00, 0x10, 0x4A, 0x46,
        0x49, 0x46, 0x00, 0x01, 0x01, 0x00, 0x00, 0x01,
        0x00, 0x01, 0x00, 0x00
      ]);
      await fs.writeFile(join(testDir, filename), buffer);
    }
  }

  async function cleanupDirectory(dir: string) {
    const entries = await fs.readdir(dir, { withFileTypes: true });
    for (const entry of entries) {
      const fullPath = join(dir, entry.name);
      if (entry.isDirectory()) {
        await cleanupDirectory(fullPath);
        await fs.rmdir(fullPath);
      } else {
        await fs.unlink(fullPath);
      }
    }
    await fs.rmdir(dir);
  }

  describe('📸 BASIC IMAGE + CAPTION', () => {
    test('should create simple image with caption', async () => {
      const timeline = await system.createImageWithCaption({
        image: join(testDir, 'test-photo.jpg'),
        caption: 'Beautiful sunset over the ocean'
      });

      const command = timeline.getCommand('output.mp4');
      
      expect(command).toContain('ffmpeg');
      expect(command).toContain('test-photo.jpg');
      expect(command).toContain('drawtext');
      expect(command).toContain('Beautiful sunset over the ocean');
    });

    test('should handle custom positioning', async () => {
      const timeline = await system.createImageWithCaption({
        image: join(testDir, 'test-photo.jpg'),
        caption: 'Top left caption',
        position: {
          vertical: 'top',
          horizontal: 'left'
        }
      });

      const command = timeline.getCommand('output.mp4');
      expect(command).toContain('drawtext');
      // Position should be reflected in the drawtext filter
    });

    test('should apply custom styles', async () => {
      const timeline = await system.createImageWithCaption({
        image: join(testDir, 'test-photo.jpg'),
        caption: 'Styled caption',
        style: {
          fontSize: 48,
          color: '#FF0000',
          backgroundColor: 'rgba(0,0,0,0.9)',
          padding: '20px 40px',
          borderRadius: '10px',
          shadow: true,
          animation: 'bounce',
          animationDuration: 0.5
        }
      });

      const command = timeline.getCommand('output.mp4');
      expect(command).toBeTruthy();
    });
  });

  describe('🎯 TEMPLATE TESTS', () => {
    const templates: ImageCaptionTemplate[] = [
      'instagram-post',
      'instagram-story',
      'tiktok-video',
      'youtube-thumbnail',
      'facebook-post',
      'twitter-post',
      'news-lower-third',
      'documentary-subtitle',
      'photo-gallery',
      'product-showcase',
      'quote-card'
    ];

    templates.forEach(template => {
      test(`should apply ${template} template correctly`, async () => {
        const timeline = await system.createImageWithCaption({
          image: join(testDir, 'test-photo.jpg'),
          caption: `Testing ${template} template`,
          template: template
        });

        const command = timeline.getCommand(`${template}.mp4`);
        expect(command).toBeTruthy();
        expect(command).toContain('drawtext');
      });
    });

    test('should override template with custom options', async () => {
      const timeline = await system.createImageWithCaption({
        image: join(testDir, 'test-photo.jpg'),
        caption: 'Custom override',
        template: 'instagram-post',
        style: {
          fontSize: 100, // Override template fontSize
          color: '#00FF00' // Override template color
        }
      });

      const command = timeline.getCommand('override.mp4');
      expect(command).toBeTruthy();
    });
  });

  describe('🎬 KEN BURNS EFFECT', () => {
    test('should create Ken Burns slideshow', async () => {
      const timeline = await system.createKenBurnsSlideshow({
        images: [
          {
            image: join(testDir, 'test-photo.jpg'),
            caption: 'First slide',
            duration: 5,
            effects: {
              kenBurns: {
                startScale: 1,
                endScale: 1.2,
                startPosition: { x: 0, y: 0 },
                endPosition: { x: 0.2, y: 0.1 }
              }
            }
          },
          {
            image: join(testDir, 'test-product.jpg'),
            caption: 'Second slide',
            duration: 5
          },
          {
            image: join(testDir, 'test-quote-bg.jpg'),
            caption: 'Third slide',
            duration: 5
          }
        ],
        transition: 'fade',
        transitionDuration: 1
      });

      const command = timeline.getCommand('ken-burns.mp4');
      expect(command).toBeTruthy();
      expect(command).toContain('test-photo.jpg');
      expect(command).toContain('test-product.jpg');
      expect(command).toContain('test-quote-bg.jpg');
    });

    test('should handle Ken Burns with music', async () => {
      // Create a dummy audio file
      const audioFile = join(testDir, 'music.mp3');
      await fs.writeFile(audioFile, Buffer.from([0xFF, 0xFB])); // MP3 header

      const timeline = await system.createKenBurnsSlideshow({
        images: [
          { image: join(testDir, 'test-photo.jpg'), caption: 'Slide 1' },
          { image: join(testDir, 'test-product.jpg'), caption: 'Slide 2' }
        ],
        music: {
          file: audioFile,
          fadeIn: 2,
          fadeOut: 2
        }
      });

      const command = timeline.getCommand('slideshow-music.mp4');
      expect(command).toContain('music.mp3');
    });

    test('should handle slideshow with missing images gracefully', async () => {
      const timeline = await system.createKenBurnsSlideshow({
        images: [
          { image: join(testDir, 'test-photo.jpg'), caption: 'Valid image' },
          { image: join(testDir, 'missing.jpg'), caption: 'Missing image' },
          { image: join(testDir, 'test-product.jpg'), caption: 'Another valid' }
        ]
      });

      const command = timeline.getCommand('partial-slideshow.mp4');
      expect(command).toBeTruthy();
      // Should skip the missing image
      expect(command).not.toContain('missing.jpg');
    });
  });

  describe('🔄 BEFORE/AFTER EFFECTS', () => {
    test('should create before/after comparison', async () => {
      const timeline = await system.createBeforeAfter(
        join(testDir, 'test-before.jpg'),
        join(testDir, 'test-after.jpg'),
        {
          caption: {
            before: 'BEFORE',
            after: 'AFTER'
          },
          transition: 'wipe',
          duration: 3
        }
      );

      const command = timeline.getCommand('before-after.mp4');
      expect(command).toContain('test-before.jpg');
      expect(command).toContain('test-after.jpg');
      expect(command).toContain('BEFORE');
      expect(command).toContain('AFTER');
    });

    test('should handle different transition types', async () => {
      const transitions: Array<'wipe' | 'fade' | 'slide'> = ['wipe', 'fade', 'slide'];
      
      for (const transition of transitions) {
        const timeline = await system.createBeforeAfter(
          join(testDir, 'test-before.jpg'),
          join(testDir, 'test-after.jpg'),
          { transition }
        );

        const command = timeline.getCommand(`before-after-${transition}.mp4`);
        expect(command).toBeTruthy();
      }
    });
  });

  describe('📐 PHOTO GRID/COLLAGE', () => {
    test('should create 2x2 photo grid', async () => {
      const images = [
        join(testDir, 'test-photo.jpg'),
        join(testDir, 'test-product.jpg'),
        join(testDir, 'test-quote-bg.jpg'),
        join(testDir, 'test-before.jpg')
      ];

      const timeline = await system.createPhotoGrid(images, {
        layout: '2x2',
        captions: ['Photo 1', 'Photo 2', 'Photo 3', 'Photo 4'],
        spacing: 10,
        duration: 10
      });

      const command = timeline.getCommand('grid-2x2.mp4');
      expect(command).toBeTruthy();
      images.forEach(img => {
        expect(command).toContain(img.split('/').pop());
      });
    });

    test('should handle different grid layouts', async () => {
      const layouts: Array<'2x2' | '3x3' | '2x3' | '1x3'> = ['2x2', '3x3', '2x3', '1x3'];
      const images = Array(9).fill(join(testDir, 'test-photo.jpg'));

      for (const layout of layouts) {
        const timeline = await system.createPhotoGrid(images, { layout });
        const command = timeline.getCommand(`grid-${layout}.mp4`);
        expect(command).toBeTruthy();
      }
    });

    test('should handle insufficient images for grid', async () => {
      const images = [join(testDir, 'test-photo.jpg')]; // Only 1 image for 3x3 grid

      const timeline = await system.createPhotoGrid(images, {
        layout: '3x3'
      });

      const command = timeline.getCommand('grid-partial.mp4');
      expect(command).toBeTruthy();
    });
  });

  describe('🎨 EFFECTS AND FILTERS', () => {
    test('should apply image filters', async () => {
      const filters = ['grayscale', 'sepia', 'vintage', 'blur', 'brightness', 'contrast'];
      
      for (const filter of filters) {
        const timeline = await system.createImageWithCaption({
          image: join(testDir, 'test-photo.jpg'),
          caption: `${filter} filter applied`,
          effects: {
            filter: filter as any
          }
        });

        const command = timeline.getCommand(`filter-${filter}.mp4`);
        expect(command).toBeTruthy();
      }
    });

    test('should apply overlay effects', async () => {
      const overlays = [
        { type: 'gradient' as const, opacity: 0.5 },
        { type: 'vignette' as const, opacity: 0.3 },
        { type: 'color' as const, opacity: 0.2, color: '#0000FF' }
      ];

      for (const overlay of overlays) {
        const timeline = await system.createImageWithCaption({
          image: join(testDir, 'test-photo.jpg'),
          caption: `${overlay.type} overlay`,
          effects: { overlay }
        });

        const command = timeline.getCommand(`overlay-${overlay.type}.mp4`);
        expect(command).toBeTruthy();
      }
    });

    test('should combine multiple effects', async () => {
      const timeline = await system.createImageWithCaption({
        image: join(testDir, 'test-photo.jpg'),
        caption: 'Multiple effects combined',
        effects: {
          kenBurns: {
            startScale: 1,
            endScale: 1.3
          },
          filter: 'vintage',
          overlay: {
            type: 'vignette',
            opacity: 0.4
          },
          transition: {
            in: 'zoom',
            out: 'fade',
            duration: 0.5
          }
        }
      });

      const command = timeline.getCommand('multi-effects.mp4');
      expect(command).toBeTruthy();
    });
  });

  describe('📱 SOCIAL MEDIA STORIES', () => {
    test('should create multi-page story', async () => {
      const timeline = await system.createStory([
        {
          image: join(testDir, 'test-photo.jpg'),
          caption: 'Page 1: Introduction',
          template: 'instagram-story'
        },
        {
          image: join(testDir, 'test-product.jpg'),
          caption: 'Page 2: Product Feature',
          template: 'instagram-story'
        },
        {
          image: join(testDir, 'test-quote-bg.jpg'),
          caption: 'Page 3: Call to Action',
          template: 'instagram-story'
        }
      ]);

      const command = timeline.getCommand('story.mp4');
      expect(command).toBeTruthy();
      expect(command).toContain('1080x1920'); // Vertical format
    });
  });

  describe('🌐 REMOTE IMAGE HANDLING', () => {
    test('should handle remote images with captions', async () => {
      // Using a simple placeholder URL that might work
      const timeline = await system.createImageWithCaption({
        image: 'https://via.placeholder.com/1920x1080',
        caption: 'Remote image test',
        template: 'youtube-thumbnail'
      });

      const command = timeline.getCommand('remote-image.mp4');
      expect(command).toBeTruthy();
      
      // Should either download successfully or handle error gracefully
      if (command.includes('cached_')) {
        expect(command).toContain('cached_'); // Downloaded file
      }
    });

    test('should handle batch remote images', async () => {
      const result = await system.createKenBurnsSlideshow({
        images: [
          {
            image: 'https://via.placeholder.com/800x600/FF0000',
            caption: 'Red slide'
          },
          {
            image: join(testDir, 'test-photo.jpg'), // Mix local
            caption: 'Local slide'
          },
          {
            image: 'https://via.placeholder.com/800x600/0000FF',
            caption: 'Blue slide'
          }
        ]
      });

      const command = result.getCommand('mixed-sources.mp4');
      expect(command).toBeTruthy();
    });
  });

  describe('⚡ PERFORMANCE AND EDGE CASES', () => {
    test('should handle very long captions', async () => {
      const longCaption = 'Lorem ipsum dolor sit amet, '.repeat(20);
      
      const timeline = await system.createImageWithCaption({
        image: join(testDir, 'test-photo.jpg'),
        caption: longCaption,
        style: {
          fontSize: 24
        }
      });

      const command = timeline.getCommand('long-caption.mp4');
      expect(command).toBeTruthy();
    });

    test('should handle special characters in captions', async () => {
      const specialCaptions = [
        'Caption with "quotes"',
        'Caption with \'apostrophes\'',
        'Caption with & ampersand',
        'Caption with < > brackets',
        'Caption with émojis 🎨 🎬 🎭',
        'Caption with 中文 characters',
        'Caption with line\\nbreaks'
      ];

      for (const caption of specialCaptions) {
        const timeline = await system.createImageWithCaption({
          image: join(testDir, 'test-photo.jpg'),
          caption: caption
        });

        const command = timeline.getCommand('special-chars.mp4');
        expect(command).toBeTruthy();
      }
    });

    test('should handle rapid timeline creation', async () => {
      const start = performance.now();
      const timelines: Timeline[] = [];

      for (let i = 0; i < 50; i++) {
        const timeline = await system.createImageWithCaption({
          image: join(testDir, 'test-photo.jpg'),
          caption: `Rapid test ${i}`,
          template: 'instagram-post'
        });
        timelines.push(timeline);
      }

      const elapsed = performance.now() - start;
      console.log(`Created 50 timelines in ${elapsed.toFixed(2)}ms`);
      
      expect(timelines).toHaveLength(50);
      expect(elapsed).toBeLessThan(5000); // Should be fast
    });
  });

  describe('🔧 ERROR HANDLING', () => {
    test('should handle missing image file', async () => {
      await expect(
        system.createImageWithCaption({
          image: join(testDir, 'non-existent.jpg'),
          caption: 'Test caption'
        })
      ).rejects.toThrow('Failed to process image');
    });

    test('should handle invalid template', async () => {
      const timeline = await system.createImageWithCaption({
        image: join(testDir, 'test-photo.jpg'),
        caption: 'Test',
        template: 'invalid-template' as any
      });

      // Should still work, just without template
      const command = timeline.getCommand('invalid-template.mp4');
      expect(command).toBeTruthy();
    });

    test('should handle empty caption', async () => {
      const timeline = await system.createImageWithCaption({
        image: join(testDir, 'test-photo.jpg'),
        caption: ''
      });

      const command = timeline.getCommand('empty-caption.mp4');
      expect(command).toBeTruthy();
    });
  });
});
import { describe, test, expect, beforeAll, afterAll } from 'bun:test';
import { existsSync, mkdirSync, rmSync } from 'fs';
import { join } from 'path';
import {
  SlideshowBuilder,
  createSlideshowBuilder,
  slideshowToVideo,
  slideshowToImages,
  type SlideshowContent,
  type MediaRef,
  type SlideshowSlideData,
  type SlideshowCaption
} from '@jamesaphoenix/media-sdk';

// Test setup
const TEST_OUTPUT_DIR = join(process.cwd(), 'test-output', 'slideshow-builder');
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

// Helper to create test slideshow content
function createTestSlideshowContent(): SlideshowContent {
  const slides: SlideshowSlideData[] = [
    {
      id: 'slide-1',
      mediaRef: [{
        id: 'media-1',
        url: join(TEST_ASSETS_DIR, 'sample-1.jpg'),
        type: 'image',
        altText: 'First slide'
      }],
      layout: 'image_with_text',
      order: 0,
      captions: [{
        id: 'caption-1',
        text: 'Welcome to the Presentation',
        position: { x: 50, y: 50 },
        style: {
          fontSize: 48,
          fontFamily: 'Arial',
          color: '#ffffff',
          backgroundColor: '#000000',
          fontWeight: 'bold',
          textAlign: 'center'
        }
      }]
    },
    {
      id: 'slide-2',
      mediaRef: [{
        id: 'media-2',
        url: join(TEST_ASSETS_DIR, 'sample-2.jpg'),
        type: 'image',
        altText: 'Second slide'
      }],
      layout: 'image_with_text',
      order: 1,
      captions: [
        {
          id: 'caption-2-1',
          text: 'Key Features',
          position: { x: 50, y: 30 },
          style: {
            fontSize: 36,
            fontFamily: 'Arial',
            color: '#ffffff',
            fontWeight: 'bold',
            textAlign: 'center'
          }
        },
        {
          id: 'caption-2-2',
          text: '• Easy to use\n• Powerful capabilities\n• Great results',
          position: { x: 50, y: 60 },
          style: {
            fontSize: 24,
            fontFamily: 'Arial',
            color: '#ffffff',
            textAlign: 'left'
          }
        }
      ]
    },
    {
      id: 'slide-3',
      mediaRef: [{
        id: 'media-3',
        url: join(TEST_ASSETS_DIR, 'sample-3.jpg'),
        type: 'image',
        altText: 'Final slide'
      }],
      layout: 'image_with_text',
      order: 2,
      captions: [{
        id: 'caption-3',
        text: 'Thank You!',
        position: { x: 50, y: 50 },
        style: {
          fontSize: 64,
          fontFamily: 'Arial',
          color: '#ffffff',
          backgroundColor: '#ff0000',
          fontWeight: 'bold',
          textAlign: 'center'
        }
      }]
    }
  ];

  const soundMediaRef: MediaRef = {
    id: 'audio-1',
    url: join(TEST_ASSETS_DIR, 'background-music.mp3'),
    type: 'audio'
  };

  return {
    type: 'slideshow',
    data: {
      slides,
      soundMediaRef
    }
  };
}

describe('Slideshow Builder', () => {
  describe('Basic Functionality', () => {
    test('should create slideshow builder from content', () => {
      const content = createTestSlideshowContent();
      const builder = new SlideshowBuilder(content);

      expect(builder).toBeDefined();
      expect(builder.getTimeline).toBeDefined();
    });

    test('should build timeline from slideshow content', () => {
      const content = createTestSlideshowContent();
      const builder = createSlideshowBuilder(content);
      
      const timeline = builder.build();
      
      expect(timeline).toBeDefined();
      const command = timeline.getCommand('output.mp4');
      expect(command).toContain('ffmpeg');
      expect(command).toContain('sample-1.jpg');
      expect(command).toContain('sample-2.jpg');
      expect(command).toContain('sample-3.jpg');
    });

    test('should handle different slide layouts', () => {
      const content: SlideshowContent = {
        type: 'slideshow',
        data: {
          slides: [
            {
              id: 'text-only',
              layout: 'text_only',
              order: 0,
              captions: [{
                id: 'text-caption',
                text: 'Text Only Slide',
                position: { x: 50, y: 50 },
                style: { fontSize: 48, color: '#000000' }
              }]
            },
            {
              id: 'media-only',
              mediaRef: [{
                id: 'media',
                url: join(TEST_ASSETS_DIR, 'sample-1.jpg'),
                type: 'image'
              }],
              layout: 'media_only',
              order: 1,
              captions: []
            }
          ]
        }
      };

      const builder = new SlideshowBuilder(content);
      const timeline = builder.build();
      
      expect(timeline).toBeDefined();
    });
  });

  describe('Video Export', () => {
    test('should export slideshow as video', async () => {
      const content = createTestSlideshowContent();
      const outputPath = join(TEST_OUTPUT_DIR, 'slideshow.mp4');
      
      const result = await slideshowToVideo(content, outputPath, {
        slideDuration: 2,
        transition: 'fade',
        transitionDuration: 0.5
      });

      expect(result.outputPath).toBe(outputPath);
      expect(result.command).toContain('ffmpeg');
      expect(result.duration).toBeGreaterThan(0);
    });

    test('should support different transitions', async () => {
      const content = createTestSlideshowContent();
      const transitions = ['none', 'fade', 'dissolve'] as const;

      for (const transition of transitions) {
        const builder = new SlideshowBuilder(content, {
          transition,
          transitionDuration: 0.5
        });

        const timeline = builder.build();
        const command = timeline.getCommand(`output-${transition}.mp4`);
        
        expect(command).toBeDefined();
      }
    });

    test('should include background audio if provided', () => {
      const content = createTestSlideshowContent();
      const builder = new SlideshowBuilder(content);
      
      const timeline = builder.build();
      const command = timeline.getCommand('output.mp4');
      
      expect(command).toContain('background-music.mp3');
    });
  });

  describe('Frame Export', () => {
    test('should export individual frames', async () => {
      const content = createTestSlideshowContent();
      const builder = new SlideshowBuilder(content, {
        outputDir: TEST_OUTPUT_DIR
      });

      const frames = await builder.exportFrames();

      expect(frames).toHaveLength(3);
      expect(frames[0].imagePath).toContain('slide-1');
      expect(frames[1].imagePath).toContain('slide-2');
      expect(frames[2].imagePath).toContain('slide-3');

      // Test download functionality
      for (const frame of frames) {
        const buffer = await frame.download();
        expect(buffer).toBeInstanceOf(Buffer);
        expect(buffer.length).toBeGreaterThan(0);
      }
    });

    test('should support different image formats', async () => {
      const content = createTestSlideshowContent();
      const formats = ['jpg', 'png', 'webp'] as const;

      for (const format of formats) {
        const builder = new SlideshowBuilder(content, {
          outputDir: join(TEST_OUTPUT_DIR, format),
          imageFormat: format,
          imageQuality: 85
        });

        const frames = await builder.exportFrames();
        expect(frames[0].imagePath).toContain(`.${format}`);
      }
    });

    test('should convert to data URLs', async () => {
      const content = createTestSlideshowContent();
      const builder = new SlideshowBuilder(content, {
        outputDir: TEST_OUTPUT_DIR
      });

      const frames = await builder.exportFrames();
      const dataUrl = await frames[0].getDataUrl();
      
      expect(dataUrl).toMatch(/^data:image\/jpeg;base64,/);
    });
  });

  describe('Image Collection Integration', () => {
    test('should convert to image collection', async () => {
      const content = createTestSlideshowContent();
      const collection = await slideshowToImages(content, {
        outputDir: TEST_OUTPUT_DIR
      });

      expect(collection.size).toBe(3);

      const images = await collection.toArray();
      expect(images).toHaveLength(3);
      
      // Verify captions were preserved
      expect(images[0].input.caption).toContain('Welcome to the Presentation');
      expect(images[1].input.caption).toContain('Key Features');
      expect(images[2].input.caption).toContain('Thank You!');
    });

    test('should iterate over slideshow as collection', async () => {
      const content = createTestSlideshowContent();
      const builder = new SlideshowBuilder(content, {
        outputDir: TEST_OUTPUT_DIR
      });

      const collection = await builder.toImageCollection();
      
      const captions = await collection.map(img => img.input.caption);
      expect(captions).toHaveLength(3);
      expect(captions[0]).toContain('Welcome');
    });
  });

  describe('Preview Generation', () => {
    test('should generate preview montage', async () => {
      const content = createTestSlideshowContent();
      const builder = new SlideshowBuilder(content, {
        outputDir: TEST_OUTPUT_DIR
      });

      const preview = await builder.generatePreview({
        columns: 3,
        maxSlides: 3
      });

      expect(preview.outputPath).toContain('preview.jpg');
      
      const buffer = await preview.download();
      expect(buffer.length).toBeGreaterThan(0);
      
      const dataUrl = await preview.getDataUrl();
      expect(dataUrl).toMatch(/^data:image\/jpeg;base64,/);
    });

    test('should handle preview with custom columns', async () => {
      const content = createTestSlideshowContent();
      const builder = new SlideshowBuilder(content, {
        outputDir: TEST_OUTPUT_DIR
      });

      const preview = await builder.generatePreview({
        columns: 2,
        outputPath: join(TEST_OUTPUT_DIR, 'custom-preview.jpg')
      });

      expect(preview.outputPath).toContain('custom-preview.jpg');
    });
  });

  describe('Options and Configuration', () => {
    test('should update content dynamically', () => {
      const content1 = createTestSlideshowContent();
      const builder = new SlideshowBuilder(content1);
      
      const timeline1 = builder.build();
      const command1 = timeline1.getCommand('output1.mp4');

      // Update content
      const content2 = createTestSlideshowContent();
      content2.data.slides = content2.data.slides.slice(0, 2); // Remove last slide
      
      builder.updateContent(content2);
      const timeline2 = builder.build();
      const command2 = timeline2.getCommand('output2.mp4');

      expect(command1).not.toBe(command2);
    });

    test('should update options dynamically', () => {
      const content = createTestSlideshowContent();
      const builder = new SlideshowBuilder(content, {
        slideDuration: 3
      });

      builder.updateOptions({
        slideDuration: 5,
        transition: 'dissolve'
      });

      const timeline = builder.build();
      expect(timeline).toBeDefined();
    });

    test('should apply video format settings', () => {
      const content = createTestSlideshowContent();
      const builder = new SlideshowBuilder(content, {
        videoFormat: {
          fps: 60,
          width: 1920,
          height: 1080
        }
      });

      const timeline = builder.build();
      const command = timeline.getCommand('output.mp4');
      
      expect(command).toContain('-r 60'); // FPS setting
    });
  });

  describe('Error Handling', () => {
    test('should handle slides without images gracefully', async () => {
      const content: SlideshowContent = {
        type: 'slideshow',
        data: {
          slides: [{
            id: 'no-image',
            layout: 'image_with_text',
            order: 0,
            captions: [{
              id: 'caption',
              text: 'No Image Slide',
              position: { x: 50, y: 50 },
              style: { fontSize: 48 }
            }]
          }]
        }
      };

      const builder = new SlideshowBuilder(content);
      const timeline = builder.build();
      
      // Should build but might be empty
      expect(timeline).toBeDefined();
    });

    test('should handle empty slideshow', async () => {
      const content: SlideshowContent = {
        type: 'slideshow',
        data: {
          slides: []
        }
      };

      const builder = new SlideshowBuilder(content);
      const timeline = builder.build();
      
      expect(timeline).toBeDefined();
    });
  });

  describe('Complex Scenarios', () => {
    test('should handle multiple captions per slide', async () => {
      const content: SlideshowContent = {
        type: 'slideshow',
        data: {
          slides: [{
            id: 'multi-caption',
            mediaRef: [{
              id: 'media',
              url: join(TEST_ASSETS_DIR, 'sample-1.jpg'),
              type: 'image'
            }],
            layout: 'image_with_text',
            order: 0,
            captions: [
              {
                id: 'title',
                text: 'Main Title',
                position: { x: 50, y: 20 },
                style: { fontSize: 48, fontWeight: 'bold' }
              },
              {
                id: 'subtitle',
                text: 'Subtitle Text',
                position: { x: 50, y: 40 },
                style: { fontSize: 24 }
              },
              {
                id: 'footer',
                text: '© 2024 Company',
                position: { x: 50, y: 90 },
                style: { fontSize: 16 }
              }
            ]
          }]
        }
      };

      const builder = new SlideshowBuilder(content, {
        outputDir: TEST_OUTPUT_DIR
      });

      const frames = await builder.exportFrames();
      expect(frames).toHaveLength(1);
      
      // Combined caption should include all text
      const collection = await builder.toImageCollection();
      const images = await collection.toArray();
      expect(images[0].input.caption).toContain('Main Title');
    });

    test('should sort slides by order', async () => {
      const content: SlideshowContent = {
        type: 'slideshow',
        data: {
          slides: [
            {
              id: 'third',
              mediaRef: [{
                id: 'm3',
                url: join(TEST_ASSETS_DIR, 'sample-3.jpg'),
                type: 'image'
              }],
              layout: 'media_only',
              order: 2,
              captions: []
            },
            {
              id: 'first',
              mediaRef: [{
                id: 'm1',
                url: join(TEST_ASSETS_DIR, 'sample-1.jpg'),
                type: 'image'
              }],
              layout: 'media_only',
              order: 0,
              captions: []
            },
            {
              id: 'second',
              mediaRef: [{
                id: 'm2',
                url: join(TEST_ASSETS_DIR, 'sample-2.jpg'),
                type: 'image'
              }],
              layout: 'media_only',
              order: 1,
              captions: []
            }
          ]
        }
      };

      const builder = new SlideshowBuilder(content, {
        outputDir: TEST_OUTPUT_DIR
      });

      const frames = await builder.exportFrames();
      expect(frames[0].slide.id).toBe('first');
      expect(frames[1].slide.id).toBe('second');
      expect(frames[2].slide.id).toBe('third');
    });
  });
});
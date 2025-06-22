import { describe, test, expect, beforeAll, afterAll } from 'bun:test';
import { existsSync, mkdirSync, rmSync, readFileSync } from 'fs';
import { join } from 'path';
import {
  ImageProcessor,
  ImageBatchProcessor,
  ImageCollection,
  createImageCollection,
  processImageWithCaption,
  processImageBatch
} from '@jamesaphoenix/media-sdk';

// Test setup
const TEST_OUTPUT_DIR = join(process.cwd(), 'test-output', 'image-processor');
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

describe('Image Processor', () => {
  describe('Single Image Processing', () => {
    test('should process single image with caption and download', async () => {
      const processor = new ImageProcessor({
        outputDir: TEST_OUTPUT_DIR,
        format: 'jpg',
        quality: 90
      });

      const result = await processor.processImage(
        join(TEST_ASSETS_DIR, 'sample-1.jpg'),
        'Hello World!',
        {
          position: { x: '50%', y: '80%', anchor: 'center' },
          style: {
            fontSize: 48,
            color: '#ffffff',
            strokeColor: '#000000',
            strokeWidth: 3
          }
        }
      );

      // Verify result structure
      expect(result.id).toBeDefined();
      expect(result.outputPath).toContain('.jpg');
      expect(result.command).toContain('ffmpeg');
      expect(result.metadata?.processedAt).toBeDefined();

      // Test download functionality
      const buffer = await result.download();
      expect(buffer).toBeInstanceOf(Buffer);
      expect(buffer.length).toBeGreaterThan(0);

      // Test save functionality
      const savePath = join(TEST_OUTPUT_DIR, 'saved-image.jpg');
      await result.save(savePath);
      expect(existsSync(savePath)).toBe(true);

      // Test data URL functionality
      const dataUrl = await result.getDataUrl();
      expect(dataUrl).toMatch(/^data:image\/jpeg;base64,/);
    });

    test('should handle different image formats', async () => {
      const formats = ['jpg', 'png', 'webp'] as const;
      
      for (const format of formats) {
        const result = await processImageWithCaption(
          join(TEST_ASSETS_DIR, 'sample-1.jpg'),
          `${format.toUpperCase()} Format Test`,
          {
            outputDir: TEST_OUTPUT_DIR,
            format,
            quality: 85
          }
        );

        expect(result.outputPath).toContain(`.${format}`);
        const buffer = await result.download();
        expect(buffer.length).toBeGreaterThan(0);
      }
    });
  });

  describe('Batch Image Processing', () => {
    test('should process multiple images in batch', async () => {
      const batchProcessor = new ImageBatchProcessor({
        outputDir: TEST_OUTPUT_DIR,
        parallel: 2
      });

      batchProcessor
        .add({
          imagePath: join(TEST_ASSETS_DIR, 'sample-1.jpg'),
          caption: 'First Image',
          outputName: 'batch-1'
        })
        .add({
          imagePath: join(TEST_ASSETS_DIR, 'sample-2.jpg'),
          caption: 'Second Image',
          outputName: 'batch-2'
        })
        .add({
          imagePath: join(TEST_ASSETS_DIR, 'sample-3.jpg'),
          caption: 'Third Image',
          outputName: 'batch-3'
        });

      const results = await batchProcessor.processAll();

      expect(results).toHaveLength(3);
      expect(results[0].outputPath).toContain('batch-1');
      expect(results[1].outputPath).toContain('batch-2');
      expect(results[2].outputPath).toContain('batch-3');

      // Verify all images can be downloaded
      for (const result of results) {
        const buffer = await result.download();
        expect(buffer.length).toBeGreaterThan(0);
      }
    });

    test('should support progress tracking', async () => {
      const progressEvents: Array<{ current: number; total: number; percentage: number }> = [];

      const results = await processImageBatch(
        [
          {
            imagePath: join(TEST_ASSETS_DIR, 'sample-1.jpg'),
            caption: 'Image 1'
          },
          {
            imagePath: join(TEST_ASSETS_DIR, 'sample-2.jpg'),
            caption: 'Image 2'
          }
        ],
        {
          outputDir: TEST_OUTPUT_DIR,
          onProgress: (progress) => {
            progressEvents.push(progress);
          }
        }
      );

      expect(results).toHaveLength(2);
      expect(progressEvents.length).toBeGreaterThan(0);
      expect(progressEvents[progressEvents.length - 1].percentage).toBe(100);
    });
  });

  describe('Image Collection', () => {
    test('should create and iterate over image collection', async () => {
      const collection = new ImageCollection({
        outputDir: TEST_OUTPUT_DIR
      });

      collection
        .addImage(join(TEST_ASSETS_DIR, 'sample-1.jpg'), 'First Caption')
        .addImage(join(TEST_ASSETS_DIR, 'sample-2.jpg'), 'Second Caption')
        .addImage(join(TEST_ASSETS_DIR, 'sample-3.jpg'), 'Third Caption');

      const processedImages = [];
      
      // Test async iteration
      for await (const img of collection) {
        processedImages.push(img);
        expect(img.id).toBeDefined();
        expect(img.outputPath).toBeDefined();
      }

      expect(processedImages).toHaveLength(3);
    });

    test('should support array-like methods', async () => {
      const collection = createImageCollection([
        {
          imagePath: join(TEST_ASSETS_DIR, 'sample-1.jpg'),
          caption: 'Map Test 1'
        },
        {
          imagePath: join(TEST_ASSETS_DIR, 'sample-2.jpg'),
          caption: 'Map Test 2'
        }
      ], {
        outputDir: TEST_OUTPUT_DIR
      });

      // Test map
      const ids = await collection.map(img => img.id);
      expect(ids).toHaveLength(2);
      expect(ids[0]).toBeDefined();

      // Test filter
      const filtered = await collection.filter(img => 
        img.input.caption.includes('1')
      );
      expect(filtered).toHaveLength(1);
      expect(filtered[0].input.caption).toBe('Map Test 1');

      // Test toArray
      const array = await collection.toArray();
      expect(array).toHaveLength(2);
    });

    test('should download all images to directory', async () => {
      const collection = new ImageCollection({
        outputDir: TEST_OUTPUT_DIR
      });

      collection
        .addImage(join(TEST_ASSETS_DIR, 'sample-1.jpg'), 'Download Test 1')
        .addImage(join(TEST_ASSETS_DIR, 'sample-2.jpg'), 'Download Test 2');

      const downloadDir = join(TEST_OUTPUT_DIR, 'downloads');
      const paths = await collection.downloadAll(downloadDir);

      expect(paths).toHaveLength(2);
      paths.forEach(path => {
        expect(existsSync(path)).toBe(true);
      });
    });

    test('should convert to data URLs', async () => {
      const collection = new ImageCollection({
        outputDir: TEST_OUTPUT_DIR,
        format: 'jpg'
      });

      collection.addImage(
        join(TEST_ASSETS_DIR, 'sample-1.jpg'), 
        'Data URL Test'
      );

      const dataUrls = await collection.toDataUrls();
      
      expect(dataUrls).toHaveLength(1);
      expect(dataUrls[0].id).toBeDefined();
      expect(dataUrls[0].caption).toBe('Data URL Test');
      expect(dataUrls[0].dataUrl).toMatch(/^data:image\/jpeg;base64,/);
    });
  });

  describe('Advanced Features', () => {
    test('should handle custom styles and positioning', async () => {
      const result = await processImageWithCaption(
        join(TEST_ASSETS_DIR, 'sample-1.jpg'),
        'Custom Styled Caption',
        {
          outputDir: TEST_OUTPUT_DIR,
          position: { x: '25%', y: '50%', anchor: 'center' },
          style: {
            fontSize: 72,
            fontFamily: 'Impact',
            color: '#ff0000',
            backgroundColor: '#000000',
            padding: 20,
            borderRadius: 10,
            strokeColor: '#ffffff',
            strokeWidth: 5
          }
        }
      );

      expect(result.command).toContain('Impact');
      expect(result.command).toContain('#ff0000');
      
      const buffer = await result.download();
      expect(buffer.length).toBeGreaterThan(0);
    });

    test('should support different output names', async () => {
      const processor = new ImageProcessor({
        outputDir: TEST_OUTPUT_DIR
      });

      const result = await processor.processImage(
        join(TEST_ASSETS_DIR, 'sample-1.jpg'),
        'Named Output',
        {
          outputName: 'custom-output-name'
        }
      );

      expect(result.outputPath).toContain('custom-output-name');
    });

    test('should handle missing images gracefully', async () => {
      const processor = new ImageProcessor({
        outputDir: TEST_OUTPUT_DIR
      });

      await expect(
        processor.processImage(
          join(TEST_ASSETS_DIR, 'non-existent.jpg'),
          'Error Test'
        )
      ).rejects.toThrow();
    });
  });

  describe('Performance', () => {
    test('should cache processed images in collection', async () => {
      const collection = new ImageCollection({
        outputDir: TEST_OUTPUT_DIR
      });

      collection.addImage(
        join(TEST_ASSETS_DIR, 'sample-1.jpg'),
        'Cache Test'
      );

      // Process twice
      const first = await collection.toArray();
      const second = await collection.toArray();

      expect(first[0].id).toBe(second[0].id);
      expect(collection.processedCount).toBe(1);
    });

    test('should handle large batches efficiently', async () => {
      const batchProcessor = new ImageBatchProcessor({
        outputDir: TEST_OUTPUT_DIR,
        parallel: 4
      });

      // Add 10 images
      for (let i = 0; i < 10; i++) {
        batchProcessor.add({
          imagePath: join(TEST_ASSETS_DIR, `sample-${(i % 3) + 1}.jpg`),
          caption: `Large Batch Image ${i + 1}`,
          outputName: `large-batch-${i + 1}`
        });
      }

      const startTime = Date.now();
      const results = await batchProcessor.processAll();
      const endTime = Date.now();

      expect(results).toHaveLength(10);
      console.log(`Processed 10 images in ${endTime - startTime}ms`);
    });
  });
});

describe('Slideshow Integration', () => {
  // These tests would require the slideshow builder tests
  // which are in a separate file
  test.skip('should integrate with slideshow content type', () => {
    // Tested in slideshow-builder.test.ts
  });
});
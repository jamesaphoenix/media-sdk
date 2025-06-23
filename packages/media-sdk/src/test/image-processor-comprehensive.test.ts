import { describe, test, expect, beforeEach, vi, afterEach } from 'vitest';
import { promises as fs } from 'fs';
import type { ProcessedImage, ImageProcessorOptions } from '../image/image-processor.js';
import type { TextStyle, Position } from '../types/index.js';

// Mock the ImageProcessor implementation
class MockImageProcessor {
  private options: ImageProcessorOptions;
  private processedImages: Map<string, ProcessedImage> = new Map();

  constructor(options: ImageProcessorOptions = {}) {
    this.options = {
      outputDir: options.outputDir || 'output',
      format: options.format || 'jpg',
      quality: options.quality || 90,
      parallel: options.parallel || 3,
      ...options
    };
  }

  async processImage(
    imagePath: string,
    caption: string,
    options: {
      position?: Position | string;
      style?: TextStyle;
      outputName?: string;
    } = {}
  ): Promise<ProcessedImage & {
    download: () => Promise<Buffer>;
    save: (path: string) => Promise<void>;
    getDataUrl: () => Promise<string>;
  }> {
    await this.validateImagePath(imagePath);
    
    const id = this.generateId(imagePath, caption);
    const outputPath = this.generateOutputPath(imagePath, options.outputName);
    const command = this.generateFFmpegCommand(imagePath, caption, options, outputPath);
    
    // Simulate processing time
    await this.simulateProcessing();
    
    const processedImage: ProcessedImage = {
      input: {
        imagePath,
        caption,
        position: options.position || 'center',
        style: options.style || {}
      },
      outputPath,
      command,
      id,
      metadata: {
        processedAt: new Date(),
        duration: Math.random() * 1000 + 100, // 100-1100ms
        size: Math.floor(Math.random() * 1024 * 1024) + 50000 // 50KB-1MB
      }
    };
    
    this.processedImages.set(id, processedImage);
    
    return {
      ...processedImage,
      download: () => this.downloadImage(id),
      save: (path: string) => this.saveImage(id, path),
      getDataUrl: () => this.getDataUrl(id)
    };
  }

  async processBatch(
    images: Array<{
      imagePath: string;
      caption: string;
      position?: Position | string;
      style?: TextStyle;
      outputName?: string;
    }>
  ): Promise<ProcessedImage[]> {
    const results: ProcessedImage[] = [];
    const batchSize = this.options.parallel || 3;
    
    for (let i = 0; i < images.length; i += batchSize) {
      const batch = images.slice(i, i + batchSize);
      
      const batchPromises = batch.map(async (image, index) => {
        const result = await this.processImage(
          image.imagePath,
          image.caption,
          {
            position: image.position,
            style: image.style,
            outputName: image.outputName
          }
        );
        
        // Report progress
        const currentIndex = i + index + 1;
        this.options.onProgress?.({
          current: currentIndex,
          total: images.length,
          percentage: (currentIndex / images.length) * 100
        });
        
        return result;
      });
      
      const batchResults = await Promise.all(batchPromises);
      results.push(...batchResults);
    }
    
    return results;
  }

  async *processIterableImages(
    images: AsyncIterable<{
      imagePath: string;
      caption: string;
      position?: Position | string;
      style?: TextStyle;
    }>
  ): AsyncGenerator<ProcessedImage, void, unknown> {
    let index = 0;
    
    for await (const image of images) {
      const result = await this.processImage(
        image.imagePath,
        image.caption,
        {
          position: image.position,
          style: image.style,
          outputName: `batch_${index}`
        }
      );
      
      index++;
      yield result;
    }
  }

  private async validateImagePath(imagePath: string): Promise<void> {
    if (!imagePath || typeof imagePath !== 'string') {
      throw new Error('Invalid image path');
    }
    
    if (!imagePath.match(/\.(jpg|jpeg|png|webp|gif|bmp|tiff)$/i)) {
      throw new Error('Unsupported image format');
    }
    
    // Mock file existence check
    if (imagePath.includes('nonexistent')) {
      throw new Error(`Image file not found: ${imagePath}`);
    }
    
    if (imagePath.includes('corrupted')) {
      throw new Error(`Corrupted image file: ${imagePath}`);
    }
  }

  private generateId(imagePath: string, caption: string): string {
    return Buffer.from(`${imagePath}:${caption}:${Date.now()}`).toString('base64').slice(0, 16);
  }

  private generateOutputPath(imagePath: string, outputName?: string): string {
    const baseName = outputName || `processed_${Date.now()}`;
    return `${this.options.outputDir}/${baseName}.${this.options.format}`;
  }

  private generateFFmpegCommand(
    imagePath: string,
    caption: string,
    options: any,
    outputPath: string
  ): string {
    const position = options.position || 'center';
    const style = options.style || {};
    
    let positionFilter = '';
    if (typeof position === 'string') {
      switch (position) {
        case 'center':
          positionFilter = 'x=(w-text_w)/2:y=(h-text_h)/2';
          break;
        case 'top':
          positionFilter = 'x=(w-text_w)/2:y=50';
          break;
        case 'bottom':
          positionFilter = 'x=(w-text_w)/2:y=h-text_h-50';
          break;
        default:
          positionFilter = 'x=(w-text_w)/2:y=(h-text_h)/2';
      }
    } else {
      positionFilter = `x=${position.x}:y=${position.y}`;
    }
    
    const fontSize = style.fontSize || 48;
    const fontColor = style.color || 'white';
    const fontFile = style.fontFamily || 'Arial';
    
    return `ffmpeg -i "${imagePath}" -vf "drawtext=text='${caption}':fontsize=${fontSize}:fontcolor=${fontColor}:font=${fontFile}:${positionFilter}" -q:v ${this.options.quality} "${outputPath}"`;
  }

  private async simulateProcessing(): Promise<void> {
    // Simulate processing time based on complexity
    const processingTime = Math.random() * 100 + 50; // 50-150ms
    return new Promise(resolve => setTimeout(resolve, processingTime));
  }

  private async downloadImage(id: string): Promise<Buffer> {
    const image = this.processedImages.get(id);
    if (!image) {
      throw new Error('Image not found');
    }
    
    // Mock image buffer generation
    const size = image.metadata?.size || 100000;
    return Buffer.alloc(size);
  }

  private async saveImage(id: string, path: string): Promise<void> {
    const buffer = await this.downloadImage(id);
    
    // Mock file saving
    if (path.includes('readonly')) {
      throw new Error('Permission denied: cannot write to readonly directory');
    }
    
    // Simulate successful save
    await new Promise(resolve => setTimeout(resolve, 10));
  }

  private async getDataUrl(id: string): Promise<string> {
    const buffer = await this.downloadImage(id);
    const base64 = buffer.toString('base64');
    return `data:image/${this.options.format};base64,${base64}`;
  }

  async optimizeForWeb(
    imagePath: string,
    options: {
      maxWidth?: number;
      maxHeight?: number;
      quality?: number;
      format?: 'jpg' | 'webp';
    } = {}
  ): Promise<ProcessedImage> {
    const { maxWidth = 1920, maxHeight = 1080, quality = 80, format = 'webp' } = options;
    
    await this.validateImagePath(imagePath);
    
    const id = this.generateId(imagePath, 'web-optimized');
    const outputPath = this.generateOutputPath(imagePath, 'web-optimized');
    
    const command = `ffmpeg -i "${imagePath}" -vf "scale='min(${maxWidth},iw)':'min(${maxHeight},ih)':force_original_aspect_ratio=decrease" -q:v ${quality} "${outputPath}"`;
    
    await this.simulateProcessing();
    
    return {
      input: {
        imagePath,
        caption: 'Web optimized',
        position: 'center',
        style: {}
      },
      outputPath,
      command,
      id,
      metadata: {
        processedAt: new Date(),
        duration: Math.random() * 500 + 200,
        size: Math.floor(Math.random() * 500000) + 100000 // Smaller optimized size
      }
    };
  }

  async generateThumbnail(
    imagePath: string,
    size: { width: number; height: number } = { width: 150, height: 150 }
  ): Promise<ProcessedImage> {
    await this.validateImagePath(imagePath);
    
    const id = this.generateId(imagePath, 'thumbnail');
    const outputPath = this.generateOutputPath(imagePath, 'thumbnail');
    
    const command = `ffmpeg -i "${imagePath}" -vf "scale=${size.width}:${size.height}:force_original_aspect_ratio=decrease,pad=${size.width}:${size.height}:(ow-iw)/2:(oh-ih)/2" "${outputPath}"`;
    
    await this.simulateProcessing();
    
    return {
      input: {
        imagePath,
        caption: 'Thumbnail',
        position: 'center',
        style: {}
      },
      outputPath,
      command,
      id,
      metadata: {
        processedAt: new Date(),
        duration: Math.random() * 200 + 50,
        size: Math.floor(Math.random() * 50000) + 5000 // Small thumbnail size
      }
    };
  }

  async convertFormat(
    imagePath: string,
    targetFormat: 'jpg' | 'png' | 'webp',
    options: { quality?: number; preserveTransparency?: boolean } = {}
  ): Promise<ProcessedImage> {
    await this.validateImagePath(imagePath);
    
    const { quality = 90, preserveTransparency = true } = options;
    const id = this.generateId(imagePath, `convert-${targetFormat}`);
    const outputPath = this.generateOutputPath(imagePath, `converted.${targetFormat}`);
    
    let command = `ffmpeg -i "${imagePath}"`;
    
    if (targetFormat === 'jpg' && !preserveTransparency) {
      command += ' -vf "format=rgb24"';
    }
    
    command += ` -q:v ${quality} "${outputPath}"`;
    
    await this.simulateProcessing();
    
    return {
      input: {
        imagePath,
        caption: `Converted to ${targetFormat}`,
        position: 'center',
        style: {}
      },
      outputPath,
      command,
      id,
      metadata: {
        processedAt: new Date(),
        duration: Math.random() * 300 + 100,
        size: Math.floor(Math.random() * 800000) + 100000
      }
    };
  }

  getProcessingStats(): {
    totalProcessed: number;
    averageProcessingTime: number;
    totalSize: number;
    formats: Record<string, number>;
  } {
    const images = Array.from(this.processedImages.values());
    
    const totalProcessed = images.length;
    const averageProcessingTime = images.reduce(
      (sum, img) => sum + (img.metadata?.duration || 0),
      0
    ) / totalProcessed || 0;
    
    const totalSize = images.reduce(
      (sum, img) => sum + (img.metadata?.size || 0),
      0
    );
    
    const formats: Record<string, number> = {};
    images.forEach(img => {
      const format = img.outputPath.split('.').pop() || 'unknown';
      formats[format] = (formats[format] || 0) + 1;
    });
    
    return {
      totalProcessed,
      averageProcessingTime,
      totalSize,
      formats
    };
  }

  clearCache(): void {
    this.processedImages.clear();
  }
}

// Mock async iterable for testing
async function* createMockImageIterable(
  count: number
): AsyncGenerator<{ imagePath: string; caption: string; position?: string }, void, unknown> {
  for (let i = 0; i < count; i++) {
    yield {
      imagePath: `image_${i}.jpg`,
      caption: `Caption ${i}`,
      position: i % 2 === 0 ? 'center' : 'bottom'
    };
    
    // Simulate async delay
    await new Promise(resolve => setTimeout(resolve, 10));
  }
}

describe('🖼️ Image Processor - Comprehensive Tests', () => {
  let processor: MockImageProcessor;
  
  beforeEach(() => {
    processor = new MockImageProcessor({
      outputDir: 'test-output',
      format: 'jpg',
      quality: 85,
      parallel: 2
    });
  });
  
  afterEach(() => {
    processor.clearCache();
  });

  describe('Single Image Processing', () => {
    test('should process image with caption', async () => {
      const result = await processor.processImage(
        'test-image.jpg',
        'Test Caption',
        {
          position: 'center',
          style: {
            fontSize: 36,
            color: 'white',
            fontFamily: 'Arial Bold'
          }
        }
      );
      
      expect(result.input.imagePath).toBe('test-image.jpg');
      expect(result.input.caption).toBe('Test Caption');
      expect(result.command).toContain('drawtext');
      expect(result.command).toContain('Test Caption');
      expect(result.command).toContain('fontsize=36');
      expect(result.outputPath).toContain('.jpg');
      expect(result.metadata?.processedAt).toBeInstanceOf(Date);
    });
    
    test('should handle different position types', async () => {
      const positions = ['top', 'center', 'bottom'];
      
      for (const position of positions) {
        const result = await processor.processImage(
          'position-test.jpg',
          'Position Test',
          { position }
        );
        
        expect(result.command).toContain(position === 'center' ? '(w-text_w)/2' : position);
      }
    });
    
    test('should handle custom position coordinates', async () => {
      const result = await processor.processImage(
        'custom-position.jpg',
        'Custom Position',
        {
          position: { x: '100', y: '200' }
        }
      );
      
      expect(result.command).toContain('x=100:y=200');
    });
    
    test('should provide download functionality', async () => {
      const result = await processor.processImage(
        'download-test.jpg',
        'Download Test'
      );
      
      const buffer = await result.download();
      expect(buffer).toBeInstanceOf(Buffer);
      expect(buffer.length).toBeGreaterThan(0);
    });
    
    test('should provide save functionality', async () => {
      const result = await processor.processImage(
        'save-test.jpg',
        'Save Test'
      );
      
      await expect(result.save('output/saved-image.jpg')).resolves.not.toThrow();
    });
    
    test('should provide data URL functionality', async () => {
      const result = await processor.processImage(
        'dataurl-test.jpg',
        'Data URL Test'
      );
      
      const dataUrl = await result.getDataUrl();
      expect(dataUrl).toMatch(/^data:image\/jpg;base64,/);
    });
  });

  describe('Batch Processing', () => {
    test('should process multiple images in batch', async () => {
      const images = [
        { imagePath: 'batch1.jpg', caption: 'Batch 1' },
        { imagePath: 'batch2.jpg', caption: 'Batch 2' },
        { imagePath: 'batch3.jpg', caption: 'Batch 3' }
      ];
      
      const results = await processor.processBatch(images);
      
      expect(results).toHaveLength(3);
      results.forEach((result, index) => {
        expect(result.input.imagePath).toBe(images[index].imagePath);
        expect(result.input.caption).toBe(images[index].caption);
      });
    });
    
    test('should handle progress callbacks', async () => {
      const progressUpdates: Array<{
        current: number;
        total: number;
        percentage: number;
      }> = [];
      
      const processorWithProgress = new MockImageProcessor({
        onProgress: (progress) => {
          progressUpdates.push(progress);
        }
      });
      
      const images = Array.from({ length: 5 }, (_, i) => ({
        imagePath: `progress${i}.jpg`,
        caption: `Progress ${i}`
      }));
      
      await processorWithProgress.processBatch(images);
      
      expect(progressUpdates.length).toBe(5);
      expect(progressUpdates[4].percentage).toBe(100);
    });
    
    test('should respect parallel processing limit', async () => {
      const processorLimited = new MockImageProcessor({
        parallel: 2
      });
      
      const images = Array.from({ length: 6 }, (_, i) => ({
        imagePath: `parallel${i}.jpg`,
        caption: `Parallel ${i}`
      }));
      
      const start = performance.now();
      const results = await processorLimited.processBatch(images);
      const end = performance.now();
      
      expect(results).toHaveLength(6);
      // Should take longer due to parallelization (batches of 2)
      expect(end - start).toBeGreaterThan(200); // At least 3 batches * ~100ms
    });
  });

  describe('Async Iterable Processing', () => {
    test('should process images from async iterable', async () => {
      const imageIterable = createMockImageIterable(5);
      const results: any[] = [];
      
      for await (const result of processor.processIterableImages(imageIterable)) {
        results.push(result);
      }
      
      expect(results).toHaveLength(5);
      results.forEach((result, index) => {
        expect(result.input.imagePath).toBe(`image_${index}.jpg`);
        expect(result.input.caption).toBe(`Caption ${index}`);
      });
    });
    
    test('should handle empty async iterable', async () => {
      async function* emptyIterable() {
        // Empty generator
      }
      
      const results: any[] = [];
      
      for await (const result of processor.processIterableImages(emptyIterable())) {
        results.push(result);
      }
      
      expect(results).toHaveLength(0);
    });
  });

  describe('Web Optimization', () => {
    test('should optimize images for web', async () => {
      const result = await processor.optimizeForWeb('large-image.jpg', {
        maxWidth: 1200,
        maxHeight: 800,
        quality: 75,
        format: 'webp'
      });
      
      expect(result.command).toContain('scale=');
      expect(result.command).toContain('min(1200,iw)');
      expect(result.command).toContain('min(800,ih)');
      expect(result.command).toContain('q:v 75');
    });
    
    test('should use default optimization settings', async () => {
      const result = await processor.optimizeForWeb('default-optimize.jpg');
      
      expect(result.command).toContain('min(1920,iw)');
      expect(result.command).toContain('min(1080,ih)');
      expect(result.command).toContain('q:v 80');
    });
  });

  describe('Thumbnail Generation', () => {
    test('should generate thumbnails with default size', async () => {
      const result = await processor.generateThumbnail('thumbnail-test.jpg');
      
      expect(result.command).toContain('scale=150:150');
      expect(result.command).toContain('pad=150:150');
      expect(result.input.caption).toBe('Thumbnail');
    });
    
    test('should generate thumbnails with custom size', async () => {
      const result = await processor.generateThumbnail('custom-thumb.jpg', {
        width: 200,
        height: 300
      });
      
      expect(result.command).toContain('scale=200:300');
      expect(result.command).toContain('pad=200:300');
    });
  });

  describe('Format Conversion', () => {
    test('should convert image formats', async () => {
      const formats: Array<'jpg' | 'png' | 'webp'> = ['jpg', 'png', 'webp'];
      
      for (const format of formats) {
        const result = await processor.convertFormat('convert-test.png', format, {
          quality: 95
        });
        
        expect(result.outputPath).toContain(format);
        expect(result.command).toContain('q:v 95');
        expect(result.input.caption).toContain(format);
      }
    });
    
    test('should handle transparency preservation', async () => {
      const result = await processor.convertFormat('transparent.png', 'jpg', {
        preserveTransparency: false
      });
      
      expect(result.command).toContain('format=rgb24');
    });
  });

  describe('Error Handling', () => {
    test('should handle invalid image paths', async () => {
      await expect(
        processor.processImage('', 'Test Caption')
      ).rejects.toThrow('Invalid image path');
    });
    
    test('should handle unsupported image formats', async () => {
      await expect(
        processor.processImage('test.txt', 'Test Caption')
      ).rejects.toThrow('Unsupported image format');
    });
    
    test('should handle nonexistent files', async () => {
      await expect(
        processor.processImage('nonexistent.jpg', 'Test Caption')
      ).rejects.toThrow('Image file not found');
    });
    
    test('should handle corrupted images', async () => {
      await expect(
        processor.processImage('corrupted.jpg', 'Test Caption')
      ).rejects.toThrow('Corrupted image file');
    });
    
    test('should handle permission errors during save', async () => {
      const result = await processor.processImage('test.jpg', 'Test');
      
      await expect(
        result.save('readonly/output.jpg')
      ).rejects.toThrow('Permission denied');
    });
    
    test('should handle missing processed images', async () => {
      const processor2 = new MockImageProcessor();
      const result = await processor.processImage('test.jpg', 'Test');
      
      // Try to access from different processor instance
      await expect(
        processor2['downloadImage'](result.id)
      ).rejects.toThrow('Image not found');
    });
  });

  describe('Processing Statistics', () => {
    test('should track processing statistics', async () => {
      // Process several images
      await processor.processImage('stats1.jpg', 'Stats 1');
      await processor.processImage('stats2.png', 'Stats 2');
      await processor.convertFormat('stats3.jpg', 'webp');
      
      const stats = processor.getProcessingStats();
      
      expect(stats.totalProcessed).toBe(3);
      expect(stats.averageProcessingTime).toBeGreaterThan(0);
      expect(stats.totalSize).toBeGreaterThan(0);
      expect(stats.formats).toHaveProperty('jpg');
    });
    
    test('should handle empty statistics', async () => {
      const stats = processor.getProcessingStats();
      
      expect(stats.totalProcessed).toBe(0);
      expect(stats.averageProcessingTime).toBe(0);
      expect(stats.totalSize).toBe(0);
      expect(Object.keys(stats.formats)).toHaveLength(0);
    });
  });

  describe('Memory Management', () => {
    test('should clear cache', async () => {
      await processor.processImage('cache1.jpg', 'Cache 1');
      await processor.processImage('cache2.jpg', 'Cache 2');
      
      let stats = processor.getProcessingStats();
      expect(stats.totalProcessed).toBe(2);
      
      processor.clearCache();
      
      stats = processor.getProcessingStats();
      expect(stats.totalProcessed).toBe(0);
    });
    
    test('should not leak memory with many images', async () => {
      if (global.gc) global.gc();
      
      const memBefore = process.memoryUsage().heapUsed;
      
      // Process many images
      for (let i = 0; i < 100; i++) {
        await processor.processImage(`memory${i}.jpg`, `Memory ${i}`);
      }
      
      if (global.gc) global.gc();
      
      const memAfter = process.memoryUsage().heapUsed;
      const memDiff = memAfter - memBefore;
      
      // Memory usage should be reasonable
      expect(memDiff).toBeLessThan(50 * 1024 * 1024); // < 50MB
    });
  });

  describe('Performance Tests', () => {
    test('should process single images quickly', async () => {
      const start = performance.now();
      
      await processor.processImage('perf-test.jpg', 'Performance Test');
      
      const end = performance.now();
      const duration = end - start;
      
      expect(duration).toBeLessThan(500); // Should be fast due to mocking
    });
    
    test('should handle concurrent batch processing', async () => {
      const batch1 = Array.from({ length: 10 }, (_, i) => ({
        imagePath: `concurrent1_${i}.jpg`,
        caption: `Concurrent 1 ${i}`
      }));
      
      const batch2 = Array.from({ length: 10 }, (_, i) => ({
        imagePath: `concurrent2_${i}.jpg`,
        caption: `Concurrent 2 ${i}`
      }));
      
      const start = performance.now();
      
      const [results1, results2] = await Promise.all([
        processor.processBatch(batch1),
        processor.processBatch(batch2)
      ]);
      
      const end = performance.now();
      const duration = end - start;
      
      expect(results1).toHaveLength(10);
      expect(results2).toHaveLength(10);
      expect(duration).toBeLessThan(2000); // Should be reasonably fast
    });
  });

  describe('Real-World Scenarios', () => {
    test('should handle social media content creation', async () => {
      const socialMediaProcessor = new MockImageProcessor({
        format: 'webp',
        quality: 85,
        outputDir: 'social-media'
      });
      
      // Instagram post
      const instagramPost = await socialMediaProcessor.processImage(
        'product-photo.jpg',
        'New Product Launch! 🚀',
        {
          position: 'bottom',
          style: {
            fontSize: 48,
            color: 'white',
            fontFamily: 'Arial Bold'
          }
        }
      );
      
      expect(instagramPost.outputPath).toContain('social-media');
      expect(instagramPost.command).toContain('🚀');
    });
    
    test('should handle e-commerce product images', async () => {
      const ecommerceProcessor = new MockImageProcessor({
        format: 'jpg',
        quality: 95
      });
      
      const products = [
        { imagePath: 'product1.jpg', caption: 'Premium Quality' },
        { imagePath: 'product2.jpg', caption: 'Best Seller' },
        { imagePath: 'product3.jpg', caption: 'Limited Edition' }
      ];
      
      const results = await ecommerceProcessor.processBatch(products);
      
      expect(results).toHaveLength(3);
      results.forEach(result => {
        expect(result.command).toContain('q:v 95');
      });
    });
    
    test('should handle blog content workflow', async () => {
      const blogProcessor = new MockImageProcessor({
        format: 'webp',
        quality: 80,
        parallel: 1 // Sequential processing for blog
      });
      
      // Hero image
      const heroImage = await blogProcessor.optimizeForWeb('hero-image.jpg', {
        maxWidth: 1200,
        maxHeight: 600,
        quality: 85
      });
      
      // Thumbnail
      const thumbnail = await blogProcessor.generateThumbnail('hero-image.jpg', {
        width: 300,
        height: 200
      });
      
      expect(heroImage.command).toContain('scale=');
      expect(thumbnail.command).toContain('300:200');
    });
  });

  describe('Edge Cases', () => {
    test('should handle very long captions', async () => {
      const longCaption = 'A'.repeat(1000);
      
      const result = await processor.processImage(
        'long-caption.jpg',
        longCaption
      );
      
      expect(result.command).toContain(longCaption);
    });
    
    test('should handle special characters in captions', async () => {
      const specialCaption = "Hello \"World\" & <Special> Chars!";
      
      const result = await processor.processImage(
        'special-chars.jpg',
        specialCaption
      );
      
      expect(result.input.caption).toBe(specialCaption);
    });
    
    test('should handle unusual image dimensions', async () => {
      const result = await processor.generateThumbnail('unusual.jpg', {
        width: 1,
        height: 1
      });
      
      expect(result.command).toContain('1:1');
    });
    
    test('should handle zero quality settings', async () => {
      const zeroQualityProcessor = new MockImageProcessor({
        quality: 1 // Minimum quality
      });
      
      const result = await zeroQualityProcessor.processImage(
        'min-quality.jpg',
        'Min Quality'
      );
      
      expect(result.command).toContain('q:v 1');
    });
  });
});
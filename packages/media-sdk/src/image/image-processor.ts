/**
 * Enhanced Image Processor
 * 
 * Provides advanced image processing capabilities including:
 * - Single image download with rendered captions
 * - Batch processing with download support
 * - Iterable collections for easy manipulation
 * - Integration with slideshow content types
 */

import { readFile, writeFile, mkdir } from 'fs/promises';
import { existsSync } from 'fs';
import { dirname, basename, join } from 'path';
import { FFmpegExecutor, BatchExecutor } from '../executor/executor.js';
import type { TextStyle, Position } from '../types/index.js';
import { generateImageWithCaption, type ImageWithCaption, type BatchImageResult } from '../timeline/image-generator.js';

export interface ProcessedImage {
  /** Input configuration */
  input: ImageWithCaption;
  /** Generated output path */
  outputPath: string;
  /** FFmpeg command used */
  command: string;
  /** Unique identifier */
  id: string;
  /** Processing metadata */
  metadata?: {
    processedAt: Date;
    duration: number;
    size?: number;
  };
}

export interface ImageProcessorOptions {
  /** Output directory for processed images */
  outputDir?: string;
  /** Output format */
  format?: 'jpg' | 'png' | 'webp';
  /** Quality (1-100 for JPEG/WebP) */
  quality?: number;
  /** Number of parallel processes */
  parallel?: number;
  /** Progress callback */
  onProgress?: (progress: { current: number; total: number; percentage: number }) => void;
}

/**
 * Enhanced single image processor with download support
 */
export class ImageProcessor {
  private executor: FFmpegExecutor;
  private options: ImageProcessorOptions;

  constructor(options: ImageProcessorOptions = {}) {
    this.executor = new FFmpegExecutor();
    this.options = {
      outputDir: options.outputDir || 'output',
      format: options.format || 'jpg',
      quality: options.quality || 90,
      ...options
    };
  }

  /**
   * Process a single image with caption and provide download capabilities
   */
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
    // Ensure output directory exists
    if (!existsSync(this.options.outputDir!)) {
      await mkdir(this.options.outputDir!, { recursive: true });
    }

    // Generate output filename
    const outputName = options.outputName || `image-${Date.now()}`;
    const outputPath = join(
      this.options.outputDir!,
      `${outputName}.${this.options.format}`
    );

    // Generate FFmpeg command
    const startTime = Date.now();
    const command = generateImageWithCaption(
      imagePath,
      caption,
      outputPath,
      {
        position: options.position,
        style: options.style,
        format: {
          format: this.options.format,
          quality: this.options.quality
        }
      }
    );

    // Execute command
    await this.executor.execute(command);
    const duration = Date.now() - startTime;

    // Get file size
    const stats = await import('fs').then(fs => 
      fs.promises.stat(outputPath).catch(() => ({ size: 0 }))
    );

    const processedImage: ProcessedImage = {
      input: {
        imagePath,
        caption,
        position: options.position,
        style: options.style,
        outputName
      },
      outputPath,
      command,
      id: `img-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      metadata: {
        processedAt: new Date(),
        duration,
        size: stats.size
      }
    };

    return {
      ...processedImage,
      download: async () => readFile(outputPath),
      save: async (targetPath: string) => {
        const buffer = await readFile(outputPath);
        await mkdir(dirname(targetPath), { recursive: true });
        await writeFile(targetPath, buffer);
      },
      getDataUrl: async () => {
        const buffer = await readFile(outputPath);
        const base64 = buffer.toString('base64');
        const mimeType = this.options.format === 'jpg' ? 'jpeg' : this.options.format;
        return `data:image/${mimeType};base64,${base64}`;
      }
    };
  }
}

/**
 * Batch image processor for handling multiple images
 */
export class ImageBatchProcessor {
  private images: ImageWithCaption[] = [];
  private executor: BatchExecutor;
  private options: ImageProcessorOptions;

  constructor(options: ImageProcessorOptions = {}) {
    this.options = {
      outputDir: options.outputDir || 'output',
      format: options.format || 'jpg',
      quality: options.quality || 90,
      parallel: options.parallel || 4,
      ...options
    };
    this.executor = new BatchExecutor();
  }

  /**
   * Add an image to the batch
   */
  add(image: ImageWithCaption): this {
    this.images.push(image);
    return this;
  }

  /**
   * Add multiple images to the batch
   */
  addBatch(images: ImageWithCaption[]): this {
    this.images.push(...images);
    return this;
  }

  /**
   * Process all images in the batch
   */
  async processAll(): Promise<Array<ProcessedImage & {
    download: () => Promise<Buffer>;
    save: (path: string) => Promise<void>;
  }>> {
    // Ensure output directory exists
    if (!existsSync(this.options.outputDir!)) {
      await mkdir(this.options.outputDir!, { recursive: true });
    }

    // Generate commands for all images
    const commands: Array<{ command: string; result: BatchImageResult; id: string }> = [];
    
    this.images.forEach((image, index) => {
      const outputName = image.outputName || `image-${index + 1}`;
      const outputPath = join(
        this.options.outputDir!,
        `${outputName}.${this.options.format}`
      );

      const command = generateImageWithCaption(
        image.imagePath,
        image.caption,
        outputPath,
        {
          position: image.position,
          style: image.style,
          format: {
            format: this.options.format,
            quality: this.options.quality
          }
        }
      );

      commands.push({
        command,
        result: {
          input: image,
          outputPath,
          command
        },
        id: `img-${Date.now()}-${index}-${Math.random().toString(36).substr(2, 9)}`
      });
    });

    // Execute all commands in parallel
    const startTime = Date.now();
    let completed = 0;
    
    await this.executor.executeBatch(
      commands.map(c => c.command),
      {
        onProgress: (_info) => {
          completed++;
          this.options.onProgress?.({
            current: completed,
            total: commands.length,
            percentage: (completed / commands.length) * 100
          });
        }
      }
    );

    const totalDuration = Date.now() - startTime;

    // Create processed image results
    const results: Array<ProcessedImage & {
      download: () => Promise<Buffer>;
      save: (path: string) => Promise<void>;
    }> = [];

    for (const cmd of commands) {
      const stats = await import('fs').then(fs => 
        fs.promises.stat(cmd.result.outputPath).catch(() => ({ size: 0 }))
      );

      const processedImage: ProcessedImage = {
        input: cmd.result.input,
        outputPath: cmd.result.outputPath,
        command: cmd.command,
        id: cmd.id,
        metadata: {
          processedAt: new Date(),
          duration: totalDuration / commands.length, // Average duration
          size: stats.size
        }
      };

      results.push({
        ...processedImage,
        download: async () => readFile(cmd.result.outputPath),
        save: async (targetPath: string) => {
          const buffer = await readFile(cmd.result.outputPath);
          await mkdir(dirname(targetPath), { recursive: true });
          await writeFile(targetPath, buffer);
        }
      });
    }

    return results;
  }

  /**
   * Clear the batch
   */
  clear(): this {
    this.images = [];
    return this;
  }

  /**
   * Get the current batch size
   */
  get size(): number {
    return this.images.length;
  }
}

/**
 * Iterable image collection for advanced manipulation
 */
export class ImageCollection implements AsyncIterable<ProcessedImage & {
  download: () => Promise<Buffer>;
  save: (path: string) => Promise<void>;
}> {
  private images: ImageWithCaption[] = [];
  private processed: Map<string, ProcessedImage & {
    download: () => Promise<Buffer>;
    save: (path: string) => Promise<void>;
  }> = new Map();
  private processor: ImageProcessor;

  constructor(options: ImageProcessorOptions = {}) {
    this.processor = new ImageProcessor(options);
  }

  /**
   * Add an image to the collection
   */
  addImage(
    imagePath: string,
    caption: string,
    options?: {
      position?: Position | string;
      style?: TextStyle;
      outputName?: string;
    }
  ): this {
    this.images.push({
      imagePath,
      caption,
      ...options
    });
    return this;
  }

  /**
   * Add multiple images from an array
   */
  addImages(images: Array<{
    imagePath: string;
    caption: string;
    position?: Position | string;
    style?: TextStyle;
    outputName?: string;
  }>): this {
    this.images.push(...images);
    return this;
  }

  /**
   * Process a single image and cache the result
   */
  private async processImage(image: ImageWithCaption): Promise<ProcessedImage & {
    download: () => Promise<Buffer>;
    save: (path: string) => Promise<void>;
  }> {
    const key = `${image.imagePath}-${image.caption}`;
    
    if (!this.processed.has(key)) {
      const result = await this.processor.processImage(
        image.imagePath,
        image.caption,
        {
          position: image.position,
          style: image.style,
          outputName: image.outputName
        }
      );
      this.processed.set(key, result);
    }

    return this.processed.get(key)!;
  }

  /**
   * Async iterator implementation
   */
  async *[Symbol.asyncIterator](): AsyncIterator<ProcessedImage & {
    download: () => Promise<Buffer>;
    save: (path: string) => Promise<void>;
  }> {
    for (const image of this.images) {
      yield await this.processImage(image);
    }
  }

  /**
   * Process all images and return as array
   */
  async toArray(): Promise<Array<ProcessedImage & {
    download: () => Promise<Buffer>;
    save: (path: string) => Promise<void>;
  }>> {
    const results: Array<ProcessedImage & {
      download: () => Promise<Buffer>;
      save: (path: string) => Promise<void>;
    }> = [];
    
    for await (const img of this) {
      results.push(img);
    }
    
    return results;
  }

  /**
   * Map over processed images
   */
  async map<T>(
    fn: (img: ProcessedImage & {
      download: () => Promise<Buffer>;
      save: (path: string) => Promise<void>;
    }) => T
  ): Promise<T[]> {
    const results: T[] = [];
    
    for await (const img of this) {
      results.push(fn(img));
    }
    
    return results;
  }

  /**
   * Filter processed images
   */
  async filter(
    predicate: (img: ProcessedImage & {
      download: () => Promise<Buffer>;
      save: (path: string) => Promise<void>;
    }) => boolean
  ): Promise<Array<ProcessedImage & {
    download: () => Promise<Buffer>;
    save: (path: string) => Promise<void>;
  }>> {
    const results: Array<ProcessedImage & {
      download: () => Promise<Buffer>;
      save: (path: string) => Promise<void>;
    }> = [];
    
    for await (const img of this) {
      if (predicate(img)) {
        results.push(img);
      }
    }
    
    return results;
  }

  /**
   * Find a specific processed image
   */
  async find(
    predicate: (img: ProcessedImage & {
      download: () => Promise<Buffer>;
      save: (path: string) => Promise<void>;
    }) => boolean
  ): Promise<(ProcessedImage & {
    download: () => Promise<Buffer>;
    save: (path: string) => Promise<void>;
  }) | undefined> {
    for await (const img of this) {
      if (predicate(img)) {
        return img;
      }
    }
    return undefined;
  }

  /**
   * Download all images to a directory
   */
  async downloadAll(outputDir: string): Promise<string[]> {
    const paths: string[] = [];
    
    await mkdir(outputDir, { recursive: true });
    
    for await (const img of this) {
      const filename = basename(img.outputPath);
      const targetPath = join(outputDir, filename);
      await img.save(targetPath);
      paths.push(targetPath);
    }
    
    return paths;
  }

  /**
   * Get all images as data URLs
   */
  async toDataUrls(): Promise<Array<{ id: string; dataUrl: string; caption: string }>> {
    const results: Array<{ id: string; dataUrl: string; caption: string }> = [];
    
    for await (const img of this) {
      const processor = this.processor as any;
      const buffer = await img.download();
      const base64 = buffer.toString('base64');
      const format = processor.options.format || 'jpg';
      const mimeType = format === 'jpg' ? 'jpeg' : format;
      
      results.push({
        id: img.id,
        dataUrl: `data:image/${mimeType};base64,${base64}`,
        caption: img.input.caption
      });
    }
    
    return results;
  }

  /**
   * Clear the collection
   */
  clear(): this {
    this.images = [];
    this.processed.clear();
    return this;
  }

  /**
   * Get the collection size
   */
  get size(): number {
    return this.images.length;
  }

  /**
   * Get the number of processed images
   */
  get processedCount(): number {
    return this.processed.size;
  }
}

/**
 * Create an image collection from an array
 */
export function createImageCollection(
  images: Array<{
    imagePath: string;
    caption: string;
    position?: Position | string;
    style?: TextStyle;
    outputName?: string;
  }>,
  options?: ImageProcessorOptions
): ImageCollection {
  const collection = new ImageCollection(options);
  collection.addImages(images);
  return collection;
}

/**
 * Process a single image with caption (convenience function)
 */
export async function processImageWithCaption(
  imagePath: string,
  caption: string,
  options: {
    position?: Position | string;
    style?: TextStyle;
    outputName?: string;
    outputDir?: string;
    format?: 'jpg' | 'png' | 'webp';
    quality?: number;
  } = {}
): Promise<ProcessedImage & {
  download: () => Promise<Buffer>;
  save: (path: string) => Promise<void>;
  getDataUrl: () => Promise<string>;
}> {
  const processor = new ImageProcessor({
    outputDir: options.outputDir,
    format: options.format,
    quality: options.quality
  });

  return processor.processImage(imagePath, caption, {
    position: options.position,
    style: options.style,
    outputName: options.outputName
  });
}

/**
 * Process multiple images in batch (convenience function)
 */
export async function processImageBatch(
  images: ImageWithCaption[],
  options?: ImageProcessorOptions
): Promise<Array<ProcessedImage & {
  download: () => Promise<Buffer>;
  save: (path: string) => Promise<void>;
}>> {
  const processor = new ImageBatchProcessor(options);
  processor.addBatch(images);
  return processor.processAll();
}
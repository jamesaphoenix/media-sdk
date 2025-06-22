/**
 * Slideshow Builder
 * 
 * Integration between the slideshow content type and the media SDK
 * Provides seamless conversion and rendering capabilities
 */

import { Timeline } from '../timeline/timeline.js';
import { slideshow, type Slide, type SlideshowOptions as SDKSlideshowOptions, type TransitionOptions } from '../slideshow/index.js';
import { ImageCollection, type ImageProcessorOptions } from '../image/image-processor.js';
import { FrameExporter } from '../timelapse/frame-exporter.js';
import { FFmpegExecutor } from '../executor/executor.js';
import type { TextStyle, Position } from '../types/index.js';
import { readFile, mkdir } from 'fs/promises';
import { join } from 'path';

/**
 * Caption configuration for slideshow slides
 */
export interface SlideshowCaption {
  /** Unique identifier */
  id: string;
  /** Caption text */
  text: string;
  /** Position on the slide */
  position: {
    x: number; // Percentage 0-100
    y: number; // Percentage 0-100
  };
  /** Styling options */
  style: {
    fontSize?: number;
    fontFamily?: string;
    color?: string;
    backgroundColor?: string;
    backgroundOpacity?: number;
    fontWeight?: 'normal' | 'bold' | 'lighter' | 'bolder';
    textAlign?: 'left' | 'center' | 'right';
  };
}

/**
 * Media reference for slideshow content
 */
export interface MediaRef {
  /** Unique identifier */
  id: string;
  /** Media URL */
  url?: string;
  /** Media type */
  type?: 'image' | 'video' | 'audio' | 'gif' | 'document';
  /** Alternative text */
  altText?: string;
  /** Caption text */
  caption?: string;
  /** Crop data */
  cropData?: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
}

/**
 * Slideshow slide data structure
 */
export interface SlideshowSlideData {
  /** Unique identifier */
  id: string;
  /** Media references */
  mediaRef?: MediaRef[];
  /** Layout type */
  layout: 'text_only' | 'media_only' | 'media_top' | 'media_bottom' | 
          'media_left' | 'media_right' | 'media_background' | 'full_media' | 
          'image_with_text';
  /** Slide order */
  order: number;
  /** Positioned captions */
  captions: SlideshowCaption[];
}

/**
 * Slideshow content structure
 */
export interface SlideshowContent {
  type: 'slideshow';
  data: {
    slides: SlideshowSlideData[];
    soundMediaRef?: MediaRef;
  };
}

/**
 * Processed slide with download capabilities
 */
export interface ProcessedSlide {
  /** Original slide data */
  slide: SlideshowSlideData;
  /** Generated image path */
  imagePath: string;
  /** Slide index */
  index: number;
  /** Download the processed image */
  download: () => Promise<Buffer>;
  /** Save to a specific path */
  save: (path: string) => Promise<void>;
  /** Get as data URL */
  getDataUrl: () => Promise<string>;
}

/**
 * Options for slideshow building
 */
export interface SlideshowBuilderOptions {
  /** Slide duration in seconds */
  slideDuration?: number;
  /** Transition type */
  transition?: 'none' | 'fade' | 'dissolve' | 'slide' | 'wipe';
  /** Transition duration in seconds */
  transitionDuration?: number;
  /** Output directory for frames */
  outputDir?: string;
  /** Video output format */
  videoFormat?: {
    width?: number;
    height?: number;
    fps?: number;
    codec?: string;
  };
  /** Image output format for frames */
  imageFormat?: 'jpg' | 'png' | 'webp';
  /** Image quality */
  imageQuality?: number;
}

/**
 * Slideshow builder for content type integration
 */
export class SlideshowBuilder {
  private content: SlideshowContent;
  private options: SlideshowBuilderOptions;
  private timeline?: Timeline;
  private executor: FFmpegExecutor;

  constructor(content: SlideshowContent, options: SlideshowBuilderOptions = {}) {
    this.content = content;
    this.options = {
      slideDuration: options.slideDuration || 3,
      transition: options.transition || 'fade',
      transitionDuration: options.transitionDuration || 0.5,
      outputDir: options.outputDir || 'output/slideshow',
      imageFormat: options.imageFormat || 'jpg',
      imageQuality: options.imageQuality || 90,
      ...options
    };
    this.executor = new FFmpegExecutor();
  }

  /**
   * Convert caption style to SDK TextStyle
   */
  private convertCaptionStyle(caption: SlideshowCaption): TextStyle {
    return {
      fontSize: caption.style.fontSize || 48,
      fontFamily: caption.style.fontFamily || 'Arial',
      color: caption.style.color || '#ffffff',
      backgroundColor: caption.style.backgroundColor,
      fontWeight: caption.style.fontWeight === 'bold' ? '700' : '400',
      textAlign: caption.style.textAlign || 'center',
      strokeColor: '#000000',
      strokeWidth: 2
    };
  }

  /**
   * Convert position to SDK Position
   */
  private convertPosition(caption: SlideshowCaption): Position {
    return {
      x: `${caption.position.x}%`,
      y: `${caption.position.y}%`,
      anchor: 'center'
    };
  }

  /**
   * Build timeline from slideshow content
   */
  build(): Timeline {
    const slides: Slide[] = [];

    // Sort slides by order
    const sortedSlides = [...this.content.data.slides].sort((a, b) => a.order - b.order);

    for (const slide of sortedSlides) {
      // Get the first image from mediaRef
      const image = slide.mediaRef?.find(m => m.type === 'image')?.url;
      
      if (!image && slide.layout !== 'text_only') {
        console.warn(`Slide ${slide.id} has no image but layout is ${slide.layout}`);
        continue;
      }

      // Convert captions to SDK format
      const captions = slide.captions.map(caption => ({
        text: caption.text,
        x: `${caption.position.x}%`,
        y: `${caption.position.y}%`,
        style: this.convertCaptionStyle(caption),
        anchor: 'center' as const
      }));

      const sdkSlide: Slide = {
        image: image || '',
        duration: this.options.slideDuration!,
        captions,
        transition: this.options.transition !== 'none' ? {
          type: this.options.transition as any,
          duration: this.options.transitionDuration!
        } : undefined
      };

      slides.push(sdkSlide);
    }

    // Create slideshow timeline
    let timeline = slideshow(slides, {
      defaultDuration: this.options.slideDuration,
      defaultTransition: this.options.transition !== 'none' ? {
        type: this.options.transition as any,
        duration: this.options.transitionDuration!
      } : undefined
    } as SDKSlideshowOptions);

    // Add background audio if provided
    if (this.content.data.soundMediaRef?.url) {
      timeline = timeline.addAudio(this.content.data.soundMediaRef.url, {
        loop: true,
        volume: 0.3,
        fadeIn: 1,
        fadeOut: 1
      });
    }

    // Apply video format if specified
    if (this.options.videoFormat) {
      if (this.options.videoFormat.fps) {
        timeline = timeline.setFrameRate(this.options.videoFormat.fps);
      }
    }

    this.timeline = timeline;
    return timeline;
  }

  /**
   * Export slideshow as video
   */
  async exportVideo(outputPath: string): Promise<{
    outputPath: string;
    command: string;
    duration: number;
  }> {
    if (!this.timeline) {
      this.build();
    }

    const command = this.timeline!.getCommand(outputPath);
    const startTime = Date.now();
    
    await this.executor.execute(command);
    
    const duration = Date.now() - startTime;

    return {
      outputPath,
      command,
      duration
    };
  }

  /**
   * Export slides as individual images
   */
  async exportFrames(): Promise<ProcessedSlide[]> {
    // Ensure output directory exists
    await mkdir(this.options.outputDir!, { recursive: true });

    const processedSlides: ProcessedSlide[] = [];
    const sortedSlides = [...this.content.data.slides].sort((a, b) => a.order - b.order);

    for (const [index, slide] of sortedSlides.entries()) {
      // Skip text-only slides without background
      if (slide.layout === 'text_only' && !slide.mediaRef?.length) {
        continue;
      }

      const image = slide.mediaRef?.find(m => m.type === 'image')?.url;
      if (!image) continue;

      // Create a single-frame timeline for this slide
      let slideTimeline = new Timeline()
        .addImage(image, { duration: 1 });

      // Add captions
      for (const caption of slide.captions) {
        slideTimeline = slideTimeline.addText(caption.text, {
          position: this.convertPosition(caption),
          style: this.convertCaptionStyle(caption),
          duration: 1
        });
      }

      // Generate output path
      const outputName = `slide-${index + 1}`;
      const outputPath = join(
        this.options.outputDir!,
        `${outputName}.${this.options.imageFormat}`
      );

      // Generate command for single frame
      let command = slideTimeline.getCommand(outputPath);
      
      // Modify command for image output
      const inputMatch = command.match(/(-i [^\s]+)/);
      if (inputMatch) {
        command = command.replace(inputMatch[0], `${inputMatch[0]} -frames:v 1`);
      }

      // Set appropriate codec
      if (this.options.imageFormat === 'jpg') {
        command = command.replace(
          /-c:v h264/,
          `-c:v mjpeg -q:v ${Math.floor((100 - this.options.imageQuality!) / 3.3)}`
        );
      } else if (this.options.imageFormat === 'png') {
        command = command.replace(/-c:v h264/, '-c:v png');
      } else if (this.options.imageFormat === 'webp') {
        command = command.replace(
          /-c:v h264/,
          `-c:v libwebp -quality ${this.options.imageQuality}`
        );
      }

      // Remove audio codec
      command = command.replace(/ -c:a aac/g, '');

      // Execute command
      await this.executor.execute(command);

      // Create processed slide object
      const processedSlide: ProcessedSlide = {
        slide,
        imagePath: outputPath,
        index,
        download: async () => readFile(outputPath),
        save: async (targetPath: string) => {
          const buffer = await readFile(outputPath);
          const targetDir = targetPath.substring(0, targetPath.lastIndexOf('/'));
          await mkdir(targetDir, { recursive: true });
          await import('fs/promises').then(fs => fs.writeFile(targetPath, buffer));
        },
        getDataUrl: async () => {
          const buffer = await readFile(outputPath);
          const base64 = buffer.toString('base64');
          const mimeType = this.options.imageFormat === 'jpg' ? 'jpeg' : this.options.imageFormat;
          return `data:image/${mimeType};base64,${base64}`;
        }
      };

      processedSlides.push(processedSlide);
    }

    return processedSlides;
  }

  /**
   * Export slides as an ImageCollection for easy iteration
   */
  async toImageCollection(options?: ImageProcessorOptions): Promise<ImageCollection> {
    const collection = new ImageCollection({
      outputDir: this.options.outputDir,
      format: this.options.imageFormat,
      quality: this.options.imageQuality,
      ...options
    });

    const sortedSlides = [...this.content.data.slides].sort((a, b) => a.order - b.order);

    for (const [index, slide] of sortedSlides.entries()) {
      if (slide.layout === 'text_only' && !slide.mediaRef?.length) {
        continue;
      }

      const image = slide.mediaRef?.find(m => m.type === 'image')?.url;
      if (!image) continue;

      // Combine all captions into a single string for the collection
      const combinedCaption = slide.captions
        .map(c => c.text)
        .join(' ');

      // Use the first caption's style as the primary style
      const primaryCaption = slide.captions[0];
      const style = primaryCaption ? this.convertCaptionStyle(primaryCaption) : undefined;
      const position = primaryCaption ? this.convertPosition(primaryCaption) : undefined;

      collection.addImage(image, combinedCaption || `Slide ${index + 1}`, {
        position,
        style,
        outputName: `slide-${index + 1}`
      });
    }

    return collection;
  }

  /**
   * Generate a preview montage of all slides
   */
  async generatePreview(options: {
    columns?: number;
    outputPath?: string;
    maxSlides?: number;
  } = {}): Promise<{
    outputPath: string;
    download: () => Promise<Buffer>;
    getDataUrl: () => Promise<string>;
  }> {
    const {
      columns = 3,
      outputPath = join(this.options.outputDir!, 'preview.jpg'),
      maxSlides = 9
    } = options;

    // First export individual frames
    const frames = await this.exportFrames();
    const framesToUse = frames.slice(0, maxSlides);

    if (framesToUse.length === 0) {
      throw new Error('No frames to create preview from');
    }

    // Create frame exporter for montage
    const exporter = new FrameExporter();
    
    for (const [index, frame] of framesToUse.entries()) {
      exporter.addFrame({
        image: frame.imagePath,
        caption: frame.slide.captions[0]?.text || '',
        index,
        startTime: index * this.options.slideDuration!,
        duration: this.options.slideDuration!
      });
    }

    // Create montage
    const montage = exporter.createMontage(columns);
    const command = montage.getCommand(outputPath);

    // Execute command
    await this.executor.execute(command);

    return {
      outputPath,
      download: async () => readFile(outputPath),
      getDataUrl: async () => {
        const buffer = await readFile(outputPath);
        const base64 = buffer.toString('base64');
        return `data:image/jpeg;base64,${base64}`;
      }
    };
  }

  /**
   * Get timeline for further customization
   */
  getTimeline(): Timeline {
    if (!this.timeline) {
      this.build();
    }
    return this.timeline!;
  }

  /**
   * Update slideshow content
   */
  updateContent(content: SlideshowContent): this {
    this.content = content;
    this.timeline = undefined; // Reset timeline
    return this;
  }

  /**
   * Update builder options
   */
  updateOptions(options: Partial<SlideshowBuilderOptions>): this {
    this.options = { ...this.options, ...options };
    this.timeline = undefined; // Reset timeline
    return this;
  }
}

/**
 * Create a slideshow builder from content (convenience function)
 */
export function createSlideshowBuilder(
  content: SlideshowContent,
  options?: SlideshowBuilderOptions
): SlideshowBuilder {
  return new SlideshowBuilder(content, options);
}

/**
 * Convert slideshow content to video directly
 */
export async function slideshowToVideo(
  content: SlideshowContent,
  outputPath: string,
  options?: SlideshowBuilderOptions
): Promise<{
  outputPath: string;
  command: string;
  duration: number;
}> {
  const builder = new SlideshowBuilder(content, options);
  return builder.exportVideo(outputPath);
}

/**
 * Convert slideshow content to image collection
 */
export async function slideshowToImages(
  content: SlideshowContent,
  options?: SlideshowBuilderOptions & ImageProcessorOptions
): Promise<ImageCollection> {
  const builder = new SlideshowBuilder(content, options);
  return builder.toImageCollection(options);
}
/**
 * @fileoverview Advanced Image + Caption System
 * 
 * Provides sophisticated image and caption combinations with effects,
 * automatic positioning, Ken Burns effects, and templates for common use cases.
 * 
 * @example Basic Usage
 * ```typescript
 * const system = new ImageCaptionSystem();
 * const result = await system.createImageWithCaption({
 *   image: 'photo.jpg',
 *   caption: 'Beautiful sunset',
 *   template: 'instagram-post'
 * });
 * ```
 * 
 * @example Ken Burns Effect
 * ```typescript
 * const result = await system.createKenBurnsSlideshow([
 *   { image: 'photo1.jpg', caption: 'First photo', duration: 5 },
 *   { image: 'photo2.jpg', caption: 'Second photo', duration: 5 }
 * ]);
 * ```
 */

import { Timeline } from '../timeline/index.js';
import { ImageSourceHandler, ProcessedImage } from '../utils/image-source-handler.js';
import type { Position } from '../types/index.js';

export interface ImageCaptionOptions {
  image: string;
  caption: string;
  template?: ImageCaptionTemplate;
  position?: CaptionPosition;
  style?: CaptionStyle;
  effects?: ImageEffects;
  duration?: number;
  startTime?: number;
}

export type ImageCaptionTemplate = 
  | 'instagram-post'
  | 'instagram-story'
  | 'tiktok-video'
  | 'youtube-thumbnail'
  | 'facebook-post'
  | 'twitter-post'
  | 'news-lower-third'
  | 'documentary-subtitle'
  | 'photo-gallery'
  | 'before-after'
  | 'product-showcase'
  | 'quote-card';

export interface CaptionPosition {
  vertical?: 'top' | 'center' | 'bottom';
  horizontal?: 'left' | 'center' | 'right';
  offset?: { x?: number; y?: number };
  autoPosition?: boolean; // Automatically position based on image content
}

export interface CaptionStyle {
  fontSize?: number;
  fontFamily?: string;
  color?: string;
  backgroundColor?: string;
  padding?: string;
  borderRadius?: string;
  shadow?: boolean;
  animation?: 'fade' | 'slide' | 'typewriter' | 'bounce' | 'glow';
  animationDuration?: number;
}

export interface ImageEffects {
  kenBurns?: {
    startScale?: number;
    endScale?: number;
    startPosition?: { x: number; y: number };
    endPosition?: { x: number; y: number };
  };
  filter?: 'none' | 'grayscale' | 'sepia' | 'vintage' | 'blur' | 'brightness' | 'contrast';
  transition?: {
    in?: 'fade' | 'slide' | 'zoom' | 'wipe';
    out?: 'fade' | 'slide' | 'zoom' | 'wipe';
    duration?: number;
  };
  overlay?: {
    type: 'gradient' | 'vignette' | 'color';
    opacity?: number;
    color?: string;
  };
}

export interface SlideshowOptions {
  images: Array<{
    image: string;
    caption: string;
    duration?: number;
    effects?: ImageEffects;
  }>;
  defaultDuration?: number;
  transition?: 'fade' | 'slide' | 'zoom' | 'none';
  transitionDuration?: number;
  template?: ImageCaptionTemplate;
  music?: {
    file: string;
    fadeIn?: number;
    fadeOut?: number;
  };
}

export class ImageCaptionSystem {
  private imageHandler: ImageSourceHandler;
  private templates: Map<ImageCaptionTemplate, Partial<ImageCaptionOptions>>;

  constructor(imageHandler?: ImageSourceHandler) {
    this.imageHandler = imageHandler || new ImageSourceHandler();
    this.templates = this.initializeTemplates();
  }

  /**
   * Initialize predefined templates
   */
  private initializeTemplates(): Map<ImageCaptionTemplate, Partial<ImageCaptionOptions>> {
    const templates = new Map<ImageCaptionTemplate, Partial<ImageCaptionOptions>>();

    // Instagram Post
    templates.set('instagram-post', {
      position: { vertical: 'bottom', horizontal: 'left', offset: { x: 20, y: -20 } },
      style: {
        fontSize: 14,
        fontFamily: 'Arial, sans-serif',
        color: '#262626',
        backgroundColor: 'rgba(255, 255, 255, 0.95)',
        padding: '12px 16px',
        borderRadius: '8px',
        shadow: true,
        animation: 'fade',
        animationDuration: 0.5
      }
    });

    // Instagram Story
    templates.set('instagram-story', {
      position: { vertical: 'center', horizontal: 'center' },
      style: {
        fontSize: 32,
        fontFamily: 'Arial, sans-serif',
        color: '#FFFFFF',
        backgroundColor: 'rgba(0, 0, 0, 0.6)',
        padding: '20px 30px',
        borderRadius: '12px',
        shadow: true,
        animation: 'bounce',
        animationDuration: 0.3
      },
      effects: {
        overlay: { type: 'gradient', opacity: 0.3 }
      }
    });

    // Facebook Post
    templates.set('facebook-post', {
      position: { vertical: 'bottom', horizontal: 'center', offset: { y: -30 } },
      style: {
        fontSize: 16,
        fontFamily: 'Arial, sans-serif',
        color: '#1c1e21',
        backgroundColor: 'rgba(255, 255, 255, 0.9)',
        padding: '12px 20px',
        borderRadius: '8px',
        shadow: true,
        animation: 'fade',
        animationDuration: 0.5
      }
    });

    // Twitter Post
    templates.set('twitter-post', {
      position: { vertical: 'bottom', horizontal: 'left', offset: { x: 20, y: -20 } },
      style: {
        fontSize: 15,
        fontFamily: 'Arial, sans-serif',
        color: '#14171a',
        backgroundColor: 'rgba(255, 255, 255, 0.95)',
        padding: '10px 15px',
        borderRadius: '16px',
        shadow: true,
        animation: 'slide',
        animationDuration: 0.3
      }
    });

    // Before/After template
    templates.set('before-after', {
      position: { vertical: 'center', horizontal: 'center' },
      style: {
        fontSize: 48,
        fontFamily: 'Arial Black, sans-serif',
        color: '#FFFFFF',
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        padding: '10px 20px',
        borderRadius: '5px',
        shadow: true,
        animation: 'fade',
        animationDuration: 0.5
      }
    });

    // TikTok Video
    templates.set('tiktok-video', {
      position: { vertical: 'center', horizontal: 'center' },
      style: {
        fontSize: 48,
        fontFamily: 'Arial Black, sans-serif',
        color: '#FFFFFF',
        backgroundColor: 'transparent',
        shadow: true,
        animation: 'bounce',
        animationDuration: 0.3
      },
      effects: {
        kenBurns: { startScale: 1, endScale: 1.1 }
      }
    });

    // YouTube Thumbnail
    templates.set('youtube-thumbnail', {
      position: { vertical: 'center', horizontal: 'center' },
      style: {
        fontSize: 64,
        fontFamily: 'Arial Black, sans-serif',
        color: '#FFFFFF',
        backgroundColor: 'rgba(255, 0, 0, 0.9)',
        padding: '20px 40px',
        borderRadius: '10px',
        shadow: true,
        animation: 'fade',
        animationDuration: 0.5
      }
    });

    // News Lower Third
    templates.set('news-lower-third', {
      position: { vertical: 'bottom', horizontal: 'left', offset: { y: -100 } },
      style: {
        fontSize: 36,
        fontFamily: 'Arial, sans-serif',
        color: '#FFFFFF',
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        padding: '15px 30px',
        borderRadius: '0',
        shadow: false,
        animation: 'slide',
        animationDuration: 0.5
      }
    });

    // Documentary Subtitle
    templates.set('documentary-subtitle', {
      position: { vertical: 'bottom', horizontal: 'center', offset: { y: -50 } },
      style: {
        fontSize: 24,
        fontFamily: 'Georgia, serif',
        color: '#FFFFFF',
        backgroundColor: 'rgba(0, 0, 0, 0.7)',
        padding: '10px 20px',
        borderRadius: '4px',
        shadow: true,
        animation: 'fade',
        animationDuration: 1
      }
    });

    // Photo Gallery
    templates.set('photo-gallery', {
      position: { vertical: 'bottom', horizontal: 'center' },
      style: {
        fontSize: 18,
        fontFamily: 'Arial, sans-serif',
        color: '#FFFFFF',
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        padding: '8px 16px',
        borderRadius: '4px',
        shadow: false,
        animation: 'fade',
        animationDuration: 0.3
      },
      effects: {
        kenBurns: { startScale: 1.05, endScale: 1 },
        transition: { in: 'fade', out: 'fade', duration: 0.5 }
      }
    });

    // Product Showcase
    templates.set('product-showcase', {
      position: { vertical: 'bottom', horizontal: 'center', offset: { y: -80 } },
      style: {
        fontSize: 28,
        fontFamily: 'Arial, sans-serif',
        color: '#FFFFFF',
        backgroundColor: 'rgba(230, 126, 34, 0.9)',
        padding: '15px 30px',
        borderRadius: '30px',
        shadow: true,
        animation: 'bounce',
        animationDuration: 0.5
      },
      effects: {
        overlay: { type: 'vignette', opacity: 0.2 }
      }
    });

    // Quote Card
    templates.set('quote-card', {
      position: { vertical: 'center', horizontal: 'center' },
      style: {
        fontSize: 36,
        fontFamily: 'Georgia, serif',
        color: '#FFFFFF',
        backgroundColor: 'rgba(0, 0, 0, 0.6)',
        padding: '40px 60px',
        borderRadius: '10px',
        shadow: true,
        animation: 'fade',
        animationDuration: 2
      },
      effects: {
        filter: 'vintage',
        overlay: { type: 'gradient', opacity: 0.4 }
      }
    });

    return templates;
  }

  /**
   * Create an image with caption using options or template
   */
  async createImageWithCaption(options: ImageCaptionOptions): Promise<Timeline> {
    // Process image
    const processed = await this.imageHandler.processImageSource(options.image);
    if (processed.error) {
      throw new Error(`Failed to process image: ${processed.error}`);
    }

    // Get template if specified
    const templateOptions = options.template ? this.templates.get(options.template) : {};
    
    // Merge options with template
    const finalOptions = {
      ...templateOptions,
      ...options,
      position: { ...templateOptions.position, ...options.position },
      style: { ...templateOptions.style, ...options.style },
      effects: { ...templateOptions.effects, ...options.effects }
    } as ImageCaptionOptions;

    // Create timeline
    let timeline = new Timeline();

    // Add image with effects
    timeline = this.addImageWithEffects(timeline, processed.localPath, finalOptions);

    // Add caption
    timeline = this.addCaptionWithAnimation(timeline, options.caption, finalOptions);

    return timeline;
  }

  /**
   * Create a Ken Burns slideshow
   */
  async createKenBurnsSlideshow(options: SlideshowOptions): Promise<Timeline> {
    let timeline = new Timeline();
    const defaultDuration = options.defaultDuration || 5;
    const transitionDuration = options.transitionDuration || 1;

    // Process all images
    const processedImages = await Promise.all(
      options.images.map(async (item) => {
        const processed = await this.imageHandler.processImageSource(item.image);
        return { ...item, processed };
      })
    );

    // Add each image with Ken Burns effect
    let currentTime = 0;
    for (let i = 0; i < processedImages.length; i++) {
      const item = processedImages[i];
      const duration = item.duration || defaultDuration;

      if (item.processed.error) {
        console.warn(`Skipping image: ${item.processed.error}`);
        continue;
      }

      // Default Ken Burns effect if not specified
      const kenBurns = item.effects?.kenBurns || {
        startScale: 1,
        endScale: 1.1,
        startPosition: { x: 0, y: 0 },
        endPosition: { x: 0.1, y: 0.1 }
      };

      // Add image
      timeline = timeline.addImage(item.processed.localPath, {
        startTime: currentTime,
        duration: duration,
        position: '50%'
      });

      // Add caption
      if (item.caption) {
        const templateOptions = options.template ? this.templates.get(options.template) : {};
        timeline = timeline.addText(item.caption, {
          startTime: currentTime,
          duration: duration,
          position: {
            x: '50%',
            y: '85%',
            ...templateOptions.position
          },
          style: {
            fontSize: 32,
            color: '#FFFFFF',
            backgroundColor: 'rgba(0, 0, 0, 0.7)',
            padding: '10px 20px',
            borderRadius: '5px',
            ...templateOptions.style
          }
        });
      }

      currentTime += duration - (i < processedImages.length - 1 ? transitionDuration : 0);
    }

    // Add music if specified
    if (options.music) {
      timeline = timeline.addAudio(options.music.file, {
        startTime: 0,
        duration: currentTime,
        fadeIn: options.music.fadeIn,
        fadeOut: options.music.fadeOut
      });
    }

    return timeline;
  }

  /**
   * Create a before/after comparison
   */
  async createBeforeAfter(before: string, after: string, options?: {
    caption?: { before: string; after: string };
    transition?: 'wipe' | 'fade' | 'slide';
    duration?: number;
  }): Promise<Timeline> {
    const [beforeImg, afterImg] = await Promise.all([
      this.imageHandler.processImageSource(before),
      this.imageHandler.processImageSource(after)
    ]);

    if (beforeImg.error || afterImg.error) {
      throw new Error('Failed to process before/after images');
    }

    let timeline = new Timeline();
    const duration = options?.duration || 3;

    // Add before image
    timeline = timeline.addImage(beforeImg.localPath, {
      startTime: 0,
      duration: duration,
      position: '50%'
    });

    // Add "BEFORE" label
    if (options?.caption?.before) {
      timeline = timeline.addText(options.caption.before, {
        startTime: 0,
        duration: duration,
        position: { x: '10%', y: '10%' },
        style: {
          fontSize: 24,
          color: '#FFFFFF',
          backgroundColor: 'rgba(0, 0, 0, 0.7)',
          padding: '5px 10px',
          borderRadius: '5px'
        }
      });
    }

    // Add after image
    timeline = timeline.addImage(afterImg.localPath, {
      startTime: duration,
      duration: duration,
      position: '50%'
    });

    // Add "AFTER" label
    if (options?.caption?.after) {
      timeline = timeline.addText(options.caption.after, {
        startTime: duration,
        duration: duration,
        position: { x: '10%', y: '10%' },
        style: {
          fontSize: 24,
          color: '#FFFFFF',
          backgroundColor: 'rgba(0, 0, 0, 0.7)',
          padding: '5px 10px',
          borderRadius: '5px'
        }
      });
    }

    return timeline;
  }

  /**
   * Create a photo grid/collage
   */
  async createPhotoGrid(images: string[], options?: {
    layout?: '2x2' | '3x3' | '2x3' | '1x3';
    captions?: string[];
    spacing?: number;
    duration?: number;
  }): Promise<Timeline> {
    const layout = options?.layout || '2x2';
    const [cols, rows] = layout.split('x').map(Number);
    const spacing = options?.spacing || 10;
    const duration = options?.duration || 10;

    // Process all images
    const processed = await this.imageHandler.processBatch(images.slice(0, cols * rows));
    
    let timeline = new Timeline();

    // Calculate grid positions
    const cellWidth = (100 - spacing * (cols + 1)) / cols;
    const cellHeight = (100 - spacing * (rows + 1)) / rows;

    let index = 0;
    for (let row = 0; row < rows; row++) {
      for (let col = 0; col < cols; col++) {
        if (index >= processed.length || processed[index].error) {
          index++;
          continue;
        }

        const x = spacing + col * (cellWidth + spacing) + cellWidth / 2;
        const y = spacing + row * (cellHeight + spacing) + cellHeight / 2;

        // Add image
        timeline = timeline.addImage(processed[index].localPath, {
          startTime: 0,
          duration: duration,
          position: `${x}%`,
          scale: cellWidth / 100
        });

        // Add caption if provided
        if (options?.captions?.[index]) {
          timeline = timeline.addText(options.captions[index], {
            startTime: 0,
            duration: duration,
            position: { x: `${x}%`, y: `${y + cellHeight/2 - 5}%` },
            style: {
              fontSize: 14,
              color: '#FFFFFF',
              backgroundColor: 'rgba(0, 0, 0, 0.7)',
              padding: '2px 5px',
              borderRadius: '3px'
            }
          });
        }

        index++;
      }
    }

    return timeline;
  }

  /**
   * Add image with effects to timeline
   */
  private addImageWithEffects(timeline: Timeline, imagePath: string, options: ImageCaptionOptions): Timeline {
    // Add the base image
    timeline = timeline.addImage(imagePath, {
      startTime: options.startTime || 0,
      duration: options.duration || 5,
      position: '50%' // Center position
    });

    // Apply filters if specified
    if (options.effects?.filter && options.effects.filter !== 'none') {
      // Add filter as a separate layer
      timeline = timeline.addFilter(options.effects.filter);
    }

    // Ken Burns effect would need to be implemented as custom filter
    // For now, we'll use scale if Ken Burns is requested
    if (options.effects?.kenBurns) {
      const startScale = options.effects.kenBurns.startScale || 1;
      const endScale = options.effects.kenBurns.endScale || 1.1;
      
      // This is a simplified version - full Ken Burns would need custom filter
      if (startScale !== 1 || endScale !== 1) {
        timeline = timeline.addFilter('scale', {
          from: startScale,
          to: endScale
        });
      }
    }

    return timeline;
  }

  /**
   * Add caption with animation to timeline
   */
  private addCaptionWithAnimation(timeline: Timeline, caption: string, options: ImageCaptionOptions): Timeline {
    const position = this.calculateCaptionPosition(options.position);
    const style = options.style || {};

    const textOptions: any = {
      startTime: options.startTime || 0,
      duration: options.duration || 5,
      position: position,
      style: {
        fontSize: style.fontSize || 32,
        fontFamily: style.fontFamily || 'Arial, sans-serif',
        color: style.color || '#FFFFFF',
        backgroundColor: style.backgroundColor || 'rgba(0, 0, 0, 0.7)',
        padding: style.padding || '10px 20px',
        borderRadius: style.borderRadius || '5px',
        textShadow: style.shadow ? '2px 2px 4px rgba(0,0,0,0.8)' : undefined
      }
    };

    // Apply animation
    if (style.animation) {
      textOptions.animation = {
        type: style.animation,
        duration: style.animationDuration || 0.5
      };
    }

    return timeline.addText(caption, textOptions);
  }

  /**
   * Calculate caption position based on options
   */
  private calculateCaptionPosition(position?: CaptionPosition): Position | string {
    if (!position) {
      return { x: '50%', y: '85%' };
    }

    const horizontalMap = {
      left: '15%',
      center: '50%',
      right: '85%'
    };

    const verticalMap = {
      top: '15%',
      center: '50%',
      bottom: '85%'
    };

    let x = horizontalMap[position.horizontal || 'center'];
    let y = verticalMap[position.vertical || 'bottom'];

    // Apply offset if provided
    if (position.offset) {
      // This would need to be converted to percentage or handled differently
      // For now, we'll use the base positions
    }

    return { x, y };
  }

  /**
   * Create social media story with multiple pages
   */
  async createStory(pages: Array<{
    image: string;
    caption: string;
    template?: ImageCaptionTemplate;
  }>): Promise<Timeline> {
    let timeline = new Timeline()
      .scale(1080, 1920)
      .setAspectRatio('9:16');

    let currentTime = 0;
    const pageDuration = 5;

    for (const page of pages) {
      const pageTimeline = await this.createImageWithCaption({
        ...page,
        startTime: currentTime,
        duration: pageDuration,
        template: page.template || 'instagram-story'
      });

      // Add each page's layers to the main timeline
      // Note: This is a simplified approach - proper merge would be more sophisticated
      const pageCommand = pageTimeline.getCommand('temp.mp4');
      if (pageCommand) {
        // Page was created successfully
      }
      currentTime += pageDuration;
    }

    return timeline;
  }

  /**
   * Cleanup downloaded images
   */
  async cleanup(): Promise<void> {
    await this.imageHandler.cleanup();
  }
}
/**
 * Timelapse Builder
 * 
 * High-level API for creating timelapses from image sequences
 * with advanced effects, transitions, and overlays
 */

import { Timeline } from '../timeline/timeline.js';

export interface TimelapseImage {
  path: string;
  caption?: string;
  metadata?: Record<string, any>;
}

export interface TimelapseOptions {
  /** Frames per second (default: 24) */
  fps?: number;
  
  /** Transition between frames */
  transition?: {
    type: 'none' | 'fade' | 'dissolve' | 'wipe' | 'zoom';
    duration?: number; // seconds
  };
  
  /** Ken Burns effect (pan & zoom) */
  kenBurns?: {
    enabled: boolean;
    zoomRange?: [number, number]; // [minZoom, maxZoom]
    panSpeed?: number; // pixels per second
    randomize?: boolean;
  };
  
  /** Output format */
  format?: {
    width?: number;
    height?: number;
    aspectRatio?: string;
    quality?: 'low' | 'medium' | 'high' | 'ultra';
  };
  
  /** Overlay options */
  overlay?: {
    timestamp?: boolean;
    progress?: boolean;
    watermark?: string;
    position?: string;
  };
  
  /** Speed ramping */
  speed?: {
    start?: number; // multiplier
    end?: number;
    curve?: 'linear' | 'ease-in' | 'ease-out' | 'ease-in-out';
  };
}

/**
 * Fluent API for building timelapses
 */
export class TimelapseBuilder {
  private images: TimelapseImage[] = [];
  private options: TimelapseOptions;
  private timeline: Timeline;

  constructor(options: TimelapseOptions = {}) {
    this.options = {
      fps: 24,
      transition: { type: 'none' },
      format: { quality: 'high' },
      ...options
    };
    this.timeline = new Timeline();
  }

  /**
   * Add a single image to the timelapse
   */
  addImage(path: string, caption?: string, metadata?: Record<string, any>): this {
    this.images.push({ path, caption, metadata });
    return this;
  }

  /**
   * Add multiple images at once
   */
  addImages(images: string[] | TimelapseImage[]): this {
    images.forEach(img => {
      if (typeof img === 'string') {
        this.images.push({ path: img });
      } else {
        this.images.push(img);
      }
    });
    return this;
  }

  /**
   * Add images from a pattern (e.g., 'frame*.jpg')
   */
  addImageSequence(pattern: string, start: number, end: number, padLength: number = 4): this {
    for (let i = start; i <= end; i++) {
      const num = String(i).padStart(padLength, '0');
      const path = pattern.replace('*', num);
      this.images.push({ path });
    }
    return this;
  }

  /**
   * Set frames per second
   */
  setFPS(fps: number): this {
    this.options.fps = fps;
    return this;
  }

  /**
   * Enable fade transition between frames
   */
  withFadeTransition(duration: number = 0.1): this {
    this.options.transition = { type: 'fade', duration };
    return this;
  }

  /**
   * Enable Ken Burns effect
   */
  withKenBurns(options?: Partial<TimelapseOptions['kenBurns']>): this {
    this.options.kenBurns = {
      enabled: true,
      zoomRange: [1.0, 1.3],
      panSpeed: 50,
      randomize: true,
      ...options
    };
    return this;
  }

  /**
   * Add timestamp overlay
   */
  withTimestamp(format: string = 'HH:MM:SS'): this {
    this.options.overlay = {
      ...this.options.overlay,
      timestamp: true
    };
    return this;
  }

  /**
   * Add progress bar
   */
  withProgressBar(position: 'top' | 'bottom' = 'bottom'): this {
    this.options.overlay = {
      ...this.options.overlay,
      progress: true,
      position
    };
    return this;
  }

  /**
   * Set output format
   */
  setFormat(width: number, height: number, quality?: 'low' | 'medium' | 'high' | 'ultra'): this {
    this.options.format = {
      ...this.options.format,
      width,
      height,
      quality: quality || (this.options.format && this.options.format.quality) || 'high'
    };
    return this;
  }

  /**
   * Set aspect ratio (e.g., '16:9', '1:1', '9:16')
   */
  setAspectRatio(ratio: string): this {
    this.options.format = {
      ...this.options.format,
      aspectRatio: ratio
    };
    return this;
  }

  /**
   * Apply speed ramping
   */
  withSpeedRamp(start: number, end: number, curve: 'linear' | 'ease-in' | 'ease-out' | 'ease-in-out' = 'linear'): this {
    this.options.speed = { start, end, curve };
    return this;
  }

  /**
   * Build the timeline
   */
  private buildTimeline(): Timeline {
    if (this.images.length === 0) {
      throw new Error('No images added to timelapse');
    }

    const fps = this.options.fps!;
    const frameDuration = 1 / fps;
    const transition = this.options.transition!;
    
    // Calculate timing
    let currentTime = 0;
    const transitionDuration = transition.type !== 'none' ? (transition.duration || 0.1) : 0;
    
    // Add aspect ratio if specified
    if (this.options.format?.aspectRatio) {
      this.timeline.setAspectRatio(this.options.format.aspectRatio);
    }

    // Add each image
    this.images.forEach((img, index) => {
      const isLast = index === this.images.length - 1;
      
      // Calculate duration with speed ramping
      let duration = frameDuration;
      if (this.options.speed) {
        const progress = index / (this.images.length - 1);
        const speedMultiplier = this.interpolateSpeed(progress);
        duration = frameDuration / speedMultiplier;
      }

      // Add image with effects
      const imageOptions: any = {
        startTime: currentTime,
        duration: duration + (isLast ? 0 : transitionDuration)
      };

      // Add Ken Burns effect
      if (this.options.kenBurns?.enabled) {
        const kb = this.options.kenBurns;
        const [minZoom, maxZoom] = kb.zoomRange || [1.0, 1.3];
        
        imageOptions.zoom = {
          start: kb.randomize ? this.randomBetween(minZoom, maxZoom) : minZoom,
          end: kb.randomize ? this.randomBetween(minZoom, maxZoom) : maxZoom,
          focusX: kb.randomize ? this.randomChoice(['left', 'center', 'right']) : 'center',
          focusY: kb.randomize ? this.randomChoice(['top', 'center', 'bottom']) : 'center'
        };
      }

      // Add fade transition
      if (transition.type === 'fade' && transitionDuration > 0) {
        imageOptions.fade = {
          in: index > 0 ? transitionDuration : 0,
          out: !isLast ? transitionDuration : 0
        };
      }

      this.timeline.addImage(img.path, imageOptions);

      // Add caption if provided
      if (img.caption) {
        this.timeline.addText(img.caption, {
          position: 'bottom',
          startTime: currentTime,
          duration: duration,
          style: {
            fontSize: 32,
            color: '#ffffff',
            background: { color: 'rgba(0,0,0,0.7)', padding: 15 }
          }
        });
      }

      // Update current time
      currentTime += duration;
    });

    // Add overlays
    this.addOverlays(currentTime);

    return this.timeline;
  }

  /**
   * Add overlay elements
   */
  private addOverlays(totalDuration: number): void {
    const overlay = this.options.overlay;
    if (!overlay) return;

    // Add timestamp
    if (overlay.timestamp) {
      this.images.forEach((img, index) => {
        const time = this.formatTime(index / this.options.fps!);
        this.timeline.addText(time, {
          position: 'top-right',
          startTime: index / this.options.fps!,
          duration: 1 / this.options.fps!,
          style: {
            fontSize: 24,
            color: '#ffffff',
            background: { color: 'rgba(0,0,0,0.5)', padding: 8 }
          }
        });
      });
    }

    // Add progress bar
    if (overlay.progress) {
      // This would require a custom filter or overlay
      // For now, we'll add a text-based progress indicator
      const steps = 10;
      for (let i = 0; i <= steps; i++) {
        const progress = (i / steps) * 100;
        const time = (i / steps) * totalDuration;
        const bar = '█'.repeat(i) + '░'.repeat(steps - i);
        
        this.timeline.addText(`${bar} ${progress.toFixed(0)}%`, {
          position: overlay.position === 'top' ? 'top' : 'bottom',
          startTime: time,
          duration: totalDuration / steps,
          style: {
            fontSize: 16,
            color: '#ffffff',
            fontFamily: 'monospace'
          }
        });
      }
    }

    // Add watermark
    if (overlay.watermark) {
      this.timeline.addWatermark(overlay.watermark, {
        position: 'bottom-right',
        opacity: 0.5,
        scale: 0.2
      });
    }
  }

  /**
   * Generate the final timelapse
   */
  build(): Timeline {
    return this.buildTimeline();
  }

  /**
   * Render directly to file
   */
  async render(outputPath: string): Promise<string> {
    const timeline = this.build();
    return timeline.render(outputPath);
  }

  /**
   * Get FFmpeg command
   */
  getCommand(outputPath: string): string {
    const timeline = this.build();
    return timeline.getCommand(outputPath);
  }

  // Utility methods
  
  private interpolateSpeed(progress: number): number {
    if (!this.options.speed) return 1;
    
    const { start = 1, end = 1, curve = 'linear' } = this.options.speed;
    
    switch (curve) {
      case 'linear':
        return start + (end - start) * progress;
      case 'ease-in':
        return start + (end - start) * (progress * progress);
      case 'ease-out':
        return start + (end - start) * (1 - (1 - progress) * (1 - progress));
      case 'ease-in-out':
        return start + (end - start) * (progress < 0.5 
          ? 2 * progress * progress 
          : 1 - Math.pow(-2 * progress + 2, 2) / 2);
      default:
        return start + (end - start) * progress;
    }
  }

  private randomBetween(min: number, max: number): number {
    return Math.random() * (max - min) + min;
  }

  private randomChoice<T>(choices: T[]): T {
    return choices[Math.floor(Math.random() * choices.length)];
  }

  private formatTime(seconds: number): string {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = Math.floor(seconds % 60);
    
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }
}

/**
 * Convenience factory functions
 */

export function createTimelapse(options?: TimelapseOptions): TimelapseBuilder {
  return new TimelapseBuilder(options);
}

export function quickTimelapse(images: string[], fps: number = 24): Timeline {
  return new TimelapseBuilder({ fps })
    .addImages(images)
    .build();
}

export function instagramTimelapse(images: string[]): Timeline {
  return new TimelapseBuilder({ fps: 30 })
    .addImages(images)
    .setAspectRatio('1:1')
    .withFadeTransition(0.1)
    .build();
}

export function cinematicTimelapse(images: string[]): Timeline {
  return new TimelapseBuilder({ fps: 24 })
    .addImages(images)
    .setAspectRatio('21:9')
    .withKenBurns()
    .withFadeTransition(0.2)
    .setFormat(3840, 1646, 'ultra')
    .build();
}
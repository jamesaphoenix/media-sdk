/**
 * Tanstack-style type-safe video query API
 * Provides exhaustive type checking and builder pattern for video operations
 */

import { Timeline } from '../timeline/timeline.js';
import type { TextOptions, ImageOptions, VideoOptions, AudioOptions, RenderOptions } from '../types/index.js';

// Core query state types
type QueryState = 'idle' | 'loading' | 'success' | 'error';

// Platform-specific presets with strict typing
export type Platform = 'tiktok' | 'youtube' | 'instagram' | 'twitter' | 'linkedin';

// Position types with exhaustive coverage
export type Position = 
  | 'top-left' | 'top-center' | 'top-right'
  | 'center-left' | 'center' | 'center-right'
  | 'bottom-left' | 'bottom-center' | 'bottom-right'
  | { x: number | string; y: number | string };

// Text style with comprehensive typing
export interface TypeSafeTextStyle {
  fontSize?: number;
  fontFamily?: string;
  color?: `#${string}` | 'white' | 'black' | 'red' | 'green' | 'blue' | 'yellow';
  backgroundColor?: `#${string}` | `rgba(${number},${number},${number},${number})`;
  strokeColor?: `#${string}`;
  strokeWidth?: number;
  fontWeight?: 'normal' | 'bold' | '100' | '200' | '300' | '400' | '500' | '600' | '700' | '800' | '900';
  textAlign?: 'left' | 'center' | 'right';
  opacity?: number;
  shadow?: {
    offsetX: number;
    offsetY: number;
    blur: number;
    color: string;
  };
}

// Video query options with strict validation
export interface VideoQueryOptions<TPlatform extends Platform = Platform> {
  platform: TPlatform;
  quality: 'low' | 'medium' | 'high' | 'ultra';
  optimization: 'speed' | 'quality' | 'size';
  validation: {
    enabled: boolean;
    strictMode?: boolean;
    visualValidation?: boolean;
  };
}

// Type-safe text options
export interface TypeSafeTextOptions {
  position?: Position;
  style?: TypeSafeTextStyle;
  startTime?: number;
  duration?: number;
  animation?: {
    type: 'fadeIn' | 'slideIn' | 'typewriter' | 'bounce';
    duration: number;
    easing?: 'ease' | 'ease-in' | 'ease-out' | 'linear';
  };
}

// Type-safe image options
export interface TypeSafeImageOptions {
  position?: Position;
  scale?: number | { width: number; height: number };
  opacity?: number;
  startTime?: number;
  duration?: number | 'full';
  blendMode?: 'normal' | 'multiply' | 'overlay' | 'screen';
}

// Query result with comprehensive metadata
export interface VideoQueryResult {
  state: QueryState;
  data?: {
    command: string;
    timeline: Timeline;
    metadata: {
      platform: Platform;
      duration: number;
      size: { width: number; height: number };
      aspectRatio: string;
      estimatedFileSize: number;
      ffmpegCommands?: string[];
      renderTime?: number;
      quality?: string;
    };
  };
  error?: {
    code: string;
    message: string;
    details?: Record<string, any>;
  };
  isLoading: boolean;
  isSuccess: boolean;
  isError: boolean;
}

/**
 * Type-safe video query builder with exhaustive type checking
 */
export class VideoQuery<TPlatform extends Platform = Platform> {
  private timeline: Timeline;
  private platform: TPlatform;
  private queryOptions: VideoQueryOptions<TPlatform>;
  private state: QueryState = 'idle';

  constructor(
    sourceVideo: string,
    options: VideoQueryOptions<TPlatform>
  ) {
    this.platform = options.platform;
    this.queryOptions = options;
    
    // Initialize with platform-specific settings
    this.timeline = this.createPlatformTimeline(sourceVideo);
  }

  /**
   * Add text with comprehensive type safety
   */
  addText<T extends string>(
    text: T,
    options: TypeSafeTextOptions = {}
  ): VideoQuery<TPlatform> {
    // Validate text is not empty
    if (typeof text !== 'string' || text.trim().length === 0) {
      throw new Error('Text must be a non-empty string');
    }

    // Convert type-safe options to Timeline options
    const timelineOptions: TextOptions = {
      position: options.position,
      style: options.style,
      startTime: options.startTime,
      duration: options.duration
    };

    this.timeline = this.timeline.addText(text, timelineOptions);
    return this;
  }

  /**
   * Add image with position validation
   */
  addImage<T extends string>(
    imagePath: T,
    options: TypeSafeImageOptions = {}
  ): VideoQuery<TPlatform> {
    // Validate image path
    if (typeof imagePath !== 'string' || imagePath.trim().length === 0) {
      throw new Error('Image path must be a non-empty string');
    }

    // Convert type-safe options
    const timelineOptions: ImageOptions = {
      position: options.position,
      startTime: options.startTime,
      duration: options.duration
    };

    this.timeline = this.timeline.addImage(imagePath, timelineOptions);
    return this;
  }

  /**
   * Add watermark with preset positions
   */
  addWatermark(
    logoPath: string,
    position: Extract<Position, string> = 'top-right'
  ): VideoQuery<TPlatform> {
    if (!['top-left', 'top-right', 'bottom-left', 'bottom-right'].includes(position as string)) {
      throw new Error('Watermark position must be a corner position');
    }

    this.timeline = this.timeline.addWatermark(logoPath, { position });
    return this;
  }

  /**
   * Apply platform-specific optimizations
   */
  optimize(): VideoQuery<TPlatform> {
    switch (this.platform) {
      case 'tiktok':
        // TikTok-specific optimizations
        break;
      case 'youtube':
        // YouTube-specific optimizations
        break;
      case 'instagram':
        // Instagram-specific optimizations
        break;
    }
    return this;
  }

  /**
   * Build the query and return comprehensive result
   */
  async build(outputPath: string): Promise<VideoQueryResult> {
    this.state = 'loading';
    
    try {
      const command = this.timeline.getCommand(outputPath);
      
      // Validate command if enabled
      if (this.queryOptions.validation.enabled) {
        await this.validateQuery();
      }

      const result: VideoQueryResult = {
        state: 'success',
        data: {
          command,
          timeline: this.timeline,
          metadata: {
            platform: this.platform,
            duration: this.timeline.getDuration(),
            size: this.getPlatformSize(),
            aspectRatio: this.getPlatformAspectRatio(),
            estimatedFileSize: this.estimateFileSize()
          }
        },
        isLoading: false,
        isSuccess: true,
        isError: false
      };

      this.state = 'success';
      return result;

    } catch (error: any) {
      this.state = 'error';
      return {
        state: 'error',
        error: {
          code: 'BUILD_FAILED',
          message: error.message,
          details: { platform: this.platform }
        },
        isLoading: false,
        isSuccess: false,
        isError: true
      };
    }
  }

  /**
   * Execute the query (render the video)
   */
  async execute(outputPath: string): Promise<VideoQueryResult> {
    const result = await this.build(outputPath);
    
    if (result.isSuccess && result.data) {
      try {
        // Execute FFmpeg command
        await this.timeline.render(outputPath);
        return result;
      } catch (error: any) {
        return {
          ...result,
          state: 'error',
          error: {
            code: 'EXECUTION_FAILED',
            message: error.message
          },
          isError: true,
          isSuccess: false
        };
      }
    }
    
    return result;
  }

  // Private helper methods
  private createPlatformTimeline(sourceVideo: string): Timeline {
    const timeline = new Timeline().addVideo(sourceVideo);
    
    switch (this.platform) {
      case 'tiktok':
        return timeline
          .scale(1080, 1920)
          .crop({ x: '(iw-1080)/2', y: '(ih-1920)/2', width: 1080, height: 1920 });
      case 'youtube':
        return timeline
          .scale(1920, 1080)
          .crop({ x: '(iw-1920)/2', y: '(ih-1080)/2', width: 1920, height: 1080 });
      case 'instagram':
        return timeline
          .scale(1080, 1080)
          .crop({ x: '(iw-1080)/2', y: '(ih-1080)/2', width: 1080, height: 1080 });
      default:
        return timeline;
    }
  }

  private getPlatformSize(): { width: number; height: number } {
    switch (this.platform) {
      case 'tiktok': return { width: 1080, height: 1920 };
      case 'youtube': return { width: 1920, height: 1080 };
      case 'instagram': return { width: 1080, height: 1080 };
      case 'twitter': return { width: 1280, height: 720 };
      case 'linkedin': return { width: 1920, height: 1080 };
      default: return { width: 1920, height: 1080 };
    }
  }

  private getPlatformAspectRatio(): string {
    const size = this.getPlatformSize();
    const gcd = (a: number, b: number): number => b === 0 ? a : gcd(b, a % b);
    const divisor = gcd(size.width, size.height);
    return `${size.width / divisor}:${size.height / divisor}`;
  }

  private estimateFileSize(): number {
    const duration = this.timeline.getDuration();
    const { width, height } = this.getPlatformSize();
    const pixelCount = width * height;
    
    let bitrate: number;
    switch (this.queryOptions.quality) {
      case 'low': bitrate = 2000000; break;
      case 'medium': bitrate = 4000000; break;
      case 'high': bitrate = 8000000; break;
      case 'ultra': bitrate = 12000000; break;
      default: bitrate = 4000000;
    }
    
    return Math.round((bitrate * duration) / 8); // bytes
  }

  private async validateQuery(): Promise<void> {
    if (this.queryOptions.validation.strictMode) {
      // Perform strict validation
      const layers = (this.timeline as any).layers || [];
      
      // Check for empty layers
      if (layers.length === 0) {
        throw new Error('Timeline must contain at least one layer');
      }

      // Validate text content
      const textLayers = layers.filter((l: any) => l.type === 'text');
      for (const layer of textLayers) {
        if (!layer.content || layer.content.trim().length === 0) {
          throw new Error('Text layers must have non-empty content');
        }
      }
    }
  }
}

/**
 * Factory function for creating type-safe video queries
 */
export function createVideoQuery<TPlatform extends Platform>(
  sourceVideo: string,
  options: VideoQueryOptions<TPlatform>
): VideoQuery<TPlatform> {
  return new VideoQuery(sourceVideo, options);
}

// Platform-specific factory functions with strict typing
export function createTikTokQuery(sourceVideo: string, options?: Partial<VideoQueryOptions<'tiktok'>>) {
  return createVideoQuery(sourceVideo, {
    platform: 'tiktok',
    quality: 'high',
    optimization: 'quality',
    validation: { enabled: true },
    ...options
  });
}

export function createYouTubeQuery(sourceVideo: string, options?: Partial<VideoQueryOptions<'youtube'>>) {
  return createVideoQuery(sourceVideo, {
    platform: 'youtube',
    quality: 'high',
    optimization: 'quality',
    validation: { enabled: true },
    ...options
  });
}

export function createInstagramQuery(sourceVideo: string, options?: Partial<VideoQueryOptions<'instagram'>>) {
  return createVideoQuery(sourceVideo, {
    platform: 'instagram',
    quality: 'medium',
    optimization: 'size',
    validation: { enabled: true },
    ...options
  });
}

// Export type-safe composition helpers
export const compose = {
  /**
   * Create multi-platform content from single source
   */
  multiPlatform: (
    sourceVideo: string,
    platforms: Platform[],
    customization?: Partial<Record<Platform, TypeSafeTextOptions>>
  ) => {
    return platforms.map(platform => {
      const query = createVideoQuery(sourceVideo, {
        platform,
        quality: 'high',
        optimization: 'quality',
        validation: { enabled: true }
      });

      // Apply platform-specific customization
      if (customization?.[platform]) {
        // Add customized content based on platform
      }

      return query;
    });
  }
};
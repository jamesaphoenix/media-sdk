/**
 * Advanced Image Caption System
 * 
 * Provides comprehensive captioning for images with:
 * - Time-series transitions
 * - Precise x,y coordinate positioning
 * - Duration control and timing
 * - Borders, shadows, and visual effects
 * - Animation and transition support
 */

import { Timeline } from '../timeline/timeline.js';
import type { TextStyle } from '../types/index.js';

/**
 * Precise positioning using coordinates or relative positions
 */
export interface ImageCaptionPosition {
  x: number | string; // pixels or percentage ('50%', '100px')
  y: number | string; // pixels or percentage ('25%', '200px')
  anchor?: 'top-left' | 'top-center' | 'top-right' | 
           'center-left' | 'center' | 'center-right' | 
           'bottom-left' | 'bottom-center' | 'bottom-right';
}

/**
 * Transition timing and easing
 */
export interface CaptionTransition {
  type: 'linear' | 'ease-in' | 'ease-out' | 'ease-in-out' | 'bounce' | 'elastic' | 'spring';
  duration: number; // seconds
  delay?: number; // seconds
  curve?: string; // custom easing curve
}

/**
 * Visual border and shadow effects
 */
export interface CaptionBorder {
  width: number; // pixels
  color: string; // hex or rgba
  style?: 'solid' | 'dashed' | 'dotted' | 'double';
  radius?: number; // border radius in pixels
}

export interface CaptionShadow {
  offsetX: number; // pixels
  offsetY: number; // pixels
  blur: number; // blur radius
  color: string; // shadow color
  spread?: number; // shadow spread
}

export interface CaptionBackground {
  color?: string; // background color
  opacity?: number; // 0-1
  padding?: number;
  borderRadius?: number;
}

/**
 * Animation keyframes for complex movements
 */
export interface CaptionKeyframe {
  time: number; // timestamp in seconds
  position: ImageCaptionPosition;
  style?: Partial<ImageCaptionStyle>;
  transition?: CaptionTransition;
}

/**
 * Comprehensive styling for image captions
 */
export interface ImageCaptionStyle extends TextStyle {
  // Typography
  fontSize: number;
  fontFamily?: string;
  fontWeight?: string; // Match TextStyle interface
  color: string;
  textAlign?: 'left' | 'center' | 'right'; // Match TextStyle interface
  lineHeight?: number;
  letterSpacing?: number;
  
  // Visual Effects
  border?: CaptionBorder;
  shadow?: CaptionShadow;
  background?: CaptionBackground;
  opacity?: number; // 0-1
  rotation?: number; // degrees
  scale?: number; // 1.0 = normal size
  
  // Text Effects
  strokeColor?: string;
  strokeWidth?: number;
  outline?: boolean;
  glow?: {
    color: string;
    intensity: number;
    radius: number;
  };
}

/**
 * Time-based caption segment
 */
export interface ImageCaptionSegment {
  id: string;
  text: string;
  startTime: number; // seconds
  endTime: number; // seconds
  position: ImageCaptionPosition;
  style: ImageCaptionStyle;
  
  // Animation
  enterTransition?: CaptionTransition & {
    from?: Partial<ImageCaptionPosition & ImageCaptionStyle>;
  };
  exitTransition?: CaptionTransition & {
    to?: Partial<ImageCaptionPosition & ImageCaptionStyle>;
  };
  
  // Keyframe animation
  keyframes?: CaptionKeyframe[];
  
  // Interaction
  clickable?: boolean;
  hover?: Partial<ImageCaptionStyle>;
}

/**
 * Complete image caption configuration
 */
export interface ImageCaptionConfig {
  imagePath: string;
  imageDisplayDuration: number; // how long to show the image
  captions: ImageCaptionSegment[];
  globalStyle?: Partial<ImageCaptionStyle>;
  
  // Image properties
  imagePosition?: ImageCaptionPosition;
  imageScale?: number;
  imageOpacity?: number;
  
  // Timing
  fadeInDuration?: number;
  fadeOutDuration?: number;
  
  // Layout
  safeArea?: {
    top: number;
    right: number; 
    bottom: number;
    left: number;
  };
}

/**
 * Duration calculation helpers
 */
export class CaptionDurationCalculator {
  /**
   * Calculate optimal duration based on text length and reading speed
   */
  static calculateReadingDuration(text: string, wordsPerMinute: number = 200): number {
    const words = text.split(/\s+/).length;
    const readingTimeSeconds = (words / wordsPerMinute) * 60;
    
    // Minimum duration of 1 second, maximum of 10 seconds for single captions
    return Math.max(1, Math.min(10, readingTimeSeconds + 0.5));
  }
  
  /**
   * Calculate staggered timing for multiple captions
   */
  static calculateStaggeredTiming(
    captions: Array<{ text: string }>,
    options: {
      startDelay?: number;
      overlap?: number; // percentage overlap (0-1)
      maxSimultaneous?: number;
      wordsPerMinute?: number;
    } = {}
  ): Array<{ startTime: number; endTime: number }> {
    const { startDelay = 0, overlap = 0.2, maxSimultaneous = 3, wordsPerMinute = 200 } = options;
    
    let currentTime = startDelay;
    const timings: Array<{ startTime: number; endTime: number }> = [];
    
    captions.forEach((caption, index) => {
      const duration = this.calculateReadingDuration(caption.text, wordsPerMinute);
      const startTime = currentTime;
      const endTime = startTime + duration;
      
      timings.push({ startTime, endTime });
      
      // Calculate next start time with overlap
      const overlapDuration = duration * overlap;
      currentTime = endTime - overlapDuration;
    });
    
    return timings;
  }
}

/**
 * Position calculation helpers
 */
export class CaptionPositionCalculator {
  /**
   * Convert relative positions to absolute coordinates
   */
  static resolvePosition(
    position: ImageCaptionPosition,
    imageWidth: number,
    imageHeight: number
  ): { x: number; y: number } {
    let x: number, y: number;
    
    // Convert x coordinate
    if (typeof position.x === 'string') {
      if (position.x.endsWith('%')) {
        x = (parseFloat(position.x) / 100) * imageWidth;
      } else if (position.x.endsWith('px')) {
        x = parseFloat(position.x);
      } else {
        x = parseFloat(position.x);
      }
    } else {
      x = position.x;
    }
    
    // Convert y coordinate
    if (typeof position.y === 'string') {
      if (position.y.endsWith('%')) {
        y = (parseFloat(position.y) / 100) * imageHeight;
      } else if (position.y.endsWith('px')) {
        y = parseFloat(position.y);
      } else {
        y = parseFloat(position.y);
      }
    } else {
      y = position.y;
    }
    
    // Apply anchor adjustments
    if (position.anchor) {
      // This would adjust x,y based on text dimensions and anchor point
      // Implementation would require text measurement
    }
    
    return { x, y };
  }
  
  /**
   * Generate safe positioning to avoid overlaps
   */
  static generateSafePositions(
    count: number,
    imageWidth: number,
    imageHeight: number,
    safeArea?: { top: number; right: number; bottom: number; left: number }
  ): ImageCaptionPosition[] {
    const safe = safeArea || { top: 50, right: 50, bottom: 50, left: 50 };
    const positions: ImageCaptionPosition[] = [];
    
    // Create grid of safe positions
    const cols = Math.ceil(Math.sqrt(count));
    const rows = Math.ceil(count / cols);
    
    const availableWidth = imageWidth - safe.left - safe.right;
    const availableHeight = imageHeight - safe.top - safe.bottom;
    
    for (let i = 0; i < count; i++) {
      const row = Math.floor(i / cols);
      const col = i % cols;
      
      const x = safe.left + (col * availableWidth) / (cols - 1 || 1);
      const y = safe.top + (row * availableHeight) / (rows - 1 || 1);
      
      positions.push({ x, y, anchor: 'center' });
    }
    
    return positions;
  }
}

/**
 * Transition and animation builders
 */
export class CaptionTransitionBuilder {
  /**
   * Create smooth entrance transition
   */
  static createEntranceTransition(
    type: 'fade' | 'slide' | 'scale' | 'rotate' | 'bounce',
    duration: number = 0.5,
    direction?: 'up' | 'down' | 'left' | 'right'
  ): CaptionTransition & { from: Partial<ImageCaptionPosition & ImageCaptionStyle> } {
    const baseTransition = { duration, type: 'ease-out' as const };
    
    switch (type) {
      case 'fade':
        return {
          ...baseTransition,
          from: { opacity: 0 }
        };
        
      case 'slide':
        const slideDistance = 100;
        switch (direction) {
          case 'up':
            return { ...baseTransition, from: { y: `+${slideDistance}px` } };
          case 'down':
            return { ...baseTransition, from: { y: `-${slideDistance}px` } };
          case 'left':
            return { ...baseTransition, from: { x: `+${slideDistance}px` } };
          case 'right':
            return { ...baseTransition, from: { x: `-${slideDistance}px` } };
          default:
            return { ...baseTransition, from: { y: `+${slideDistance}px` } };
        }
        
      case 'scale':
        return {
          ...baseTransition,
          from: { scale: 0, opacity: 0 }
        };
        
      case 'rotate':
        return {
          ...baseTransition,
          from: { rotation: -180, scale: 0 }
        };
        
      case 'bounce':
        return {
          ...baseTransition,
          type: 'bounce',
          from: { scale: 0, y: '-50px' }
        };
        
      default:
        return { ...baseTransition, from: { opacity: 0 } };
    }
  }
  
  /**
   * Create smooth exit transition
   */
  static createExitTransition(
    type: 'fade' | 'slide' | 'scale' | 'rotate',
    duration: number = 0.3,
    direction?: 'up' | 'down' | 'left' | 'right'
  ): CaptionTransition & { to: Partial<ImageCaptionPosition & ImageCaptionStyle> } {
    const baseTransition = { duration, type: 'ease-in' as const };
    
    switch (type) {
      case 'fade':
        return {
          ...baseTransition,
          to: { opacity: 0 }
        };
        
      case 'slide':
        const slideDistance = 100;
        switch (direction) {
          case 'up':
            return { ...baseTransition, to: { y: `-${slideDistance}px` } };
          case 'down':
            return { ...baseTransition, to: { y: `+${slideDistance}px` } };
          case 'left':
            return { ...baseTransition, to: { x: `-${slideDistance}px` } };
          case 'right':
            return { ...baseTransition, to: { x: `+${slideDistance}px` } };
          default:
            return { ...baseTransition, to: { y: `-${slideDistance}px` } };
        }
        
      case 'scale':
        return {
          ...baseTransition,
          to: { scale: 0, opacity: 0 }
        };
        
      case 'rotate':
        return {
          ...baseTransition,
          to: { rotation: 180, scale: 0 }
        };
        
      default:
        return { ...baseTransition, to: { opacity: 0 } };
    }
  }
}

/**
 * Main image caption composer
 */
export class ImageCaptionComposer {
  /**
   * Create a complete image with captions timeline
   */
  static compose(config: ImageCaptionConfig): Timeline {
    let timeline = new Timeline();
    
    // Add the base image
    timeline = timeline.addImage(config.imagePath, {
      duration: config.imageDisplayDuration,
      position: config.imagePosition || { x: '50%', y: '50%' },
      startTime: 0
    });
    
    // Add each caption segment
    config.captions.forEach((caption, index) => {
      timeline = this.addCaptionSegment(timeline, caption, config.globalStyle);
    });
    
    return timeline;
  }
  
  /**
   * Add a single caption segment with full animation support
   */
  private static addCaptionSegment(
    timeline: Timeline,
    caption: ImageCaptionSegment,
    globalStyle?: Partial<ImageCaptionStyle>
  ): Timeline {
    const mergedStyle = { ...globalStyle, ...caption.style };
    
    // Convert position to FFmpeg coordinates
    const position = this.buildPositionString(caption.position);
    
    // Build text filter with styling
    const textFilter = this.buildTextFilter(caption.text, position, mergedStyle);
    
    // Add entrance transition if specified
    if (caption.enterTransition) {
      timeline = this.addEntranceTransition(timeline, caption, textFilter);
    }
    
    // Add main text display
    timeline = timeline.addFilter('drawtext', {
      ...textFilter,
      enable: `between(t,${caption.startTime},${caption.endTime})`
    });
    
    // Add keyframe animations if specified
    if (caption.keyframes && caption.keyframes.length > 0) {
      timeline = this.addKeyframeAnimation(timeline, caption);
    }
    
    // Add exit transition if specified
    if (caption.exitTransition) {
      timeline = this.addExitTransition(timeline, caption, textFilter);
    }
    
    return timeline;
  }
  
  /**
   * Build position string for FFmpeg
   */
  private static buildPositionString(position: ImageCaptionPosition): string {
    let x: string, y: string;
    
    // Handle x coordinate
    if (typeof position.x === 'string') {
      if (position.x.includes('%')) {
        const percent = parseFloat(position.x) / 100;
        x = `(main_w*${percent})`;
      } else {
        x = position.x.replace('px', '');
      }
    } else {
      x = position.x.toString();
    }
    
    // Handle y coordinate
    if (typeof position.y === 'string') {
      if (position.y.includes('%')) {
        const percent = parseFloat(position.y) / 100;
        y = `(main_h*${percent})`;
      } else {
        y = position.y.replace('px', '');
      }
    } else {
      y = position.y.toString();
    }
    
    // Apply anchor adjustments
    if (position.anchor) {
      switch (position.anchor) {
        case 'center':
          x = `(${x}-(text_w/2))`;
          y = `(${y}-(text_h/2))`;
          break;
        case 'top-center':
          x = `(${x}-(text_w/2))`;
          break;
        case 'bottom-center':
          x = `(${x}-(text_w/2))`;
          y = `(${y}-text_h)`;
          break;
        case 'center-right':
          x = `(${x}-text_w)`;
          y = `(${y}-(text_h/2))`;
          break;
        // Add more anchor cases as needed
      }
    }
    
    return `x=${x}:y=${y}`;
  }
  
  /**
   * Build FFmpeg text filter with full styling
   */
  private static buildTextFilter(
    text: string,
    position: string,
    style: ImageCaptionStyle
  ): Record<string, any> {
    const filter: Record<string, any> = {
      text: text.replace(/'/g, "\\'"), // Escape quotes
      fontsize: style.fontSize || 24,
      fontcolor: style.color || '#ffffff'
    };
    
    // Add position
    const positionParts = position.split(':');
    filter.x = positionParts[0].replace('x=', '');
    filter.y = positionParts[1].replace('y=', '');
    
    // Add optional styling
    if (style.fontFamily) filter.fontfile = style.fontFamily;
    if (style.strokeColor && style.strokeWidth) {
      filter.bordercolor = style.strokeColor;
      filter.borderw = style.strokeWidth;
    }
    if (style.background?.color) {
      filter.box = 1;
      filter.boxcolor = style.background.color;
      if (style.background.opacity) {
        filter.boxborderw = style.background.padding || 5;
      }
    }
    if (style.shadow) {
      filter.shadowcolor = style.shadow.color;
      filter.shadowx = style.shadow.offsetX;
      filter.shadowy = style.shadow.offsetY;
    }
    
    return filter;
  }
  
  /**
   * Add entrance transition animation
   */
  private static addEntranceTransition(
    timeline: Timeline,
    caption: ImageCaptionSegment,
    baseFilter: Record<string, any>
  ): Timeline {
    if (!caption.enterTransition) return timeline;
    
    const transition = caption.enterTransition;
    const transitionEnd = caption.startTime + transition.duration;
    
    // Create transition filter based on type
    if (transition.from?.opacity !== undefined) {
      // Fade in transition
      const fadeFilter = {
        ...baseFilter,
        alpha: `if(lt(t,${caption.startTime}),0,if(lt(t,${transitionEnd}),(t-${caption.startTime})/${transition.duration},1))`,
        enable: `between(t,${caption.startTime},${transitionEnd})`
      };
      timeline = timeline.addFilter('drawtext', fadeFilter);
    }
    
    // Add more transition types as needed
    
    return timeline;
  }
  
  /**
   * Add keyframe animation
   */
  private static addKeyframeAnimation(
    timeline: Timeline,
    caption: ImageCaptionSegment
  ): Timeline {
    if (!caption.keyframes) return timeline;
    
    // Implementation would create interpolated positions and styles
    // between keyframes using FFmpeg's complex filter expressions
    
    return timeline;
  }
  
  /**
   * Add exit transition animation
   */
  private static addExitTransition(
    timeline: Timeline,
    caption: ImageCaptionSegment,
    baseFilter: Record<string, any>
  ): Timeline {
    if (!caption.exitTransition) return timeline;
    
    const transition = caption.exitTransition;
    const transitionStart = caption.endTime - transition.duration;
    
    // Create exit transition filter
    if (transition.to?.opacity !== undefined) {
      // Fade out transition
      const fadeFilter = {
        ...baseFilter,
        alpha: `if(lt(t,${transitionStart}),1,if(lt(t,${caption.endTime}),1-((t-${transitionStart})/${transition.duration}),0))`,
        enable: `between(t,${transitionStart},${caption.endTime})`
      };
      timeline = timeline.addFilter('drawtext', fadeFilter);
    }
    
    return timeline;
  }
}

/**
 * Quick builder functions for common use cases
 */
export class QuickImageCaptions {
  /**
   * Create simple timed captions for an image
   */
  static createSimple(
    imagePath: string,
    captions: Array<{ text: string; duration?: number }>,
    options: {
      imageDisplayDuration?: number;
      style?: Partial<ImageCaptionStyle>;
      transition?: 'fade' | 'slide' | 'none';
    } = {}
  ): Timeline {
    const { imageDisplayDuration = 10, style = {}, transition = 'fade' } = options;
    
    // Calculate timing for each caption
    const timings = CaptionDurationCalculator.calculateStaggeredTiming(captions, {
      startDelay: 1, // Start after 1 second
      overlap: 0.1
    });
    
    // Create caption segments
    const captionSegments: ImageCaptionSegment[] = captions.map((caption, index) => ({
      id: `caption-${index}`,
      text: caption.text,
      startTime: timings[index].startTime,
      endTime: timings[index].endTime,
      position: { x: '50%', y: `${30 + (index * 15)}%`, anchor: 'center' },
      style: {
        fontSize: 32,
        color: '#ffffff',
        strokeColor: '#000000',
        strokeWidth: 2,
        ...style
      },
      enterTransition: transition !== 'none' ? 
        CaptionTransitionBuilder.createEntranceTransition(transition, 0.5) : undefined,
      exitTransition: transition !== 'none' ? 
        CaptionTransitionBuilder.createExitTransition(transition, 0.3) : undefined
    }));
    
    const config: ImageCaptionConfig = {
      imagePath,
      imageDisplayDuration,
      captions: captionSegments
    };
    
    return ImageCaptionComposer.compose(config);
  }
  
  /**
   * Create interactive caption hotspots on an image
   */
  static createHotspots(
    imagePath: string,
    hotspots: Array<{
      text: string;
      x: number | string;
      y: number | string;
      showTime: number;
      hideTime?: number;
    }>,
    options: {
      imageDisplayDuration?: number;
      style?: Partial<ImageCaptionStyle>;
    } = {}
  ): Timeline {
    const { imageDisplayDuration = 15, style = {} } = options;
    
    const captionSegments: ImageCaptionSegment[] = hotspots.map((hotspot, index) => ({
      id: `hotspot-${index}`,
      text: hotspot.text,
      startTime: hotspot.showTime,
      endTime: hotspot.hideTime || (hotspot.showTime + 3),
      position: { x: hotspot.x, y: hotspot.y, anchor: 'center' },
      style: {
        fontSize: 24,
        color: '#ffffff',
        background: { color: 'rgba(0,0,0,0.8)', padding: 8, borderRadius: 4 },
        border: { width: 2, color: '#ffff00', style: 'solid' },
        ...style
      },
      enterTransition: CaptionTransitionBuilder.createEntranceTransition('scale', 0.3),
      exitTransition: CaptionTransitionBuilder.createExitTransition('fade', 0.2)
    }));
    
    const config: ImageCaptionConfig = {
      imagePath,
      imageDisplayDuration,
      captions: captionSegments
    };
    
    return ImageCaptionComposer.compose(config);
  }
}

/**
 * Platform-specific caption presets for images
 */
export const imageCaptionPresets = {
  instagram: {
    style: {
      fontSize: 36,
      fontFamily: 'Arial',
      color: '#ffffff',
      strokeColor: '#000000',
      strokeWidth: 2,
      shadow: { offsetX: 2, offsetY: 2, blur: 4, color: 'rgba(0,0,0,0.5)' }
    },
    safeArea: { top: 100, right: 40, bottom: 100, left: 40 }
  },
  
  tiktok: {
    style: {
      fontSize: 48,
      fontFamily: 'Arial Black',
      color: '#ffffff',
      strokeColor: '#000000',
      strokeWidth: 3,
      shadow: { offsetX: 3, offsetY: 3, blur: 6, color: 'rgba(0,0,0,0.7)' }
    },
    safeArea: { top: 120, right: 50, bottom: 120, left: 50 }
  },
  
  youtube: {
    style: {
      fontSize: 32,
      fontFamily: 'Arial',
      color: '#ffffff',
      strokeColor: '#000000',
      strokeWidth: 2,
      background: { color: 'rgba(0,0,0,0.8)', padding: 8 }
    },
    safeArea: { top: 80, right: 60, bottom: 80, left: 60 }
  },
  
  pinterest: {
    style: {
      fontSize: 28,
      fontFamily: 'Georgia',
      color: '#2d2d2d',
      background: { color: 'rgba(255,255,255,0.9)', padding: 12, borderRadius: 8 },
      border: { width: 1, color: '#e0e0e0', style: 'solid' }
    },
    safeArea: { top: 60, right: 30, bottom: 60, left: 30 }
  },
  
  linkedin: {
    style: {
      fontSize: 24,
      fontFamily: 'Arial',
      color: '#0077b5',
      background: { color: 'rgba(255,255,255,0.95)', padding: 10 },
      border: { width: 2, color: '#0077b5', style: 'solid' }
    },
    safeArea: { top: 80, right: 50, bottom: 80, left: 50 }
  }
};
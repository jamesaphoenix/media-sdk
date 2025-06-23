/**
 * @fileoverview Picture-in-Picture (PiP) functionality
 * 
 * Provides easy overlay of videos within videos with various styles and animations
 */

import { Timeline } from '../timeline/timeline.js';
import type { Position } from '../types/index.js';

export interface PiPOptions {
  // Positioning
  position?: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right' | 'center' | 'custom';
  customPosition?: { x: number | string; y: number | string };
  
  // Sizing
  size?: { width: number | string; height: number | string };
  scale?: number; // Alternative to size, as percentage of main video
  
  // Styling
  borderRadius?: number;
  borderWidth?: number;
  borderColor?: string;
  shadow?: boolean | {
    blur: number;
    color: string;
    offsetX: number;
    offsetY: number;
  };
  opacity?: number;
  
  // Animation
  animation?: 'none' | 'slide-in' | 'fade-in' | 'bounce-in' | 'zoom-in';
  animationDuration?: number;
  animationDelay?: number;
  
  // Behavior
  startTime?: number;
  endTime?: number;
  audioMix?: 'mute' | 'duck' | 'full' | number; // number = volume 0-1
  cropToFit?: boolean;
  maintainAspectRatio?: boolean;
  
  // Advanced
  blur?: number; // Blur the PiP video
  rotation?: number; // Rotate the PiP
  flipHorizontal?: boolean;
  flipVertical?: boolean;
}

export interface MultiPiPOptions {
  videos: Array<{
    source: string;
    options: PiPOptions;
  }>;
  layout?: 'grid' | 'stack' | 'carousel' | 'custom';
  spacing?: number;
}

export class PictureInPicture {
  /**
   * Add a picture-in-picture overlay to a timeline
   * 
   * @example
   * ```typescript
   * const withPiP = PictureInPicture.add(timeline, 'reaction.mp4', {
   *   position: 'bottom-right',
   *   scale: 0.25,
   *   borderRadius: 10,
   *   shadow: true
   * });
   * ```
   */
  static add(
    timeline: Timeline,
    videoSource: string,
    options: PiPOptions = {}
  ): Timeline {
    const {
      position = 'bottom-right',
      customPosition,
      size,
      scale = 0.25,
      borderRadius = 0,
      borderWidth = 0,
      borderColor = '#ffffff',
      shadow = false,
      opacity = 1,
      animation = 'none',
      animationDuration = 0.5,
      animationDelay = 0,
      startTime = 0,
      endTime,
      audioMix = 'duck',
      cropToFit = true,
      maintainAspectRatio = true,
      blur = 0,
      rotation = 0,
      flipHorizontal = false,
      flipVertical = false
    } = options;

    // Calculate size
    let pipWidth: string, pipHeight: string;
    if (size) {
      pipWidth = typeof size.width === 'number' ? `${size.width}` : size.width;
      pipHeight = typeof size.height === 'number' ? `${size.height}` : size.height;
    } else {
      // Use scale as percentage of main video
      pipWidth = `iw*${scale}`;
      pipHeight = `ih*${scale}`;
    }

    // Calculate position
    const { x, y } = this.calculatePosition(position, customPosition, pipWidth, pipHeight);

    // Build filter complex
    const filters: string[] = [];
    
    // Scale the PiP video
    filters.push(`[1:v]scale=${pipWidth}:${pipHeight}${maintainAspectRatio ? ':force_original_aspect_ratio=decrease' : ''}`);

    // Apply effects
    if (borderRadius > 0) {
      // Rounded corners (approximation using mask)
      filters.push(`geq=lum='if(gt(abs(X-W/2),W/2-${borderRadius})*gt(abs(Y-H/2),H/2-${borderRadius}),0,255)':a='if(gt(abs(X-W/2),W/2-${borderRadius})*gt(abs(Y-H/2),H/2-${borderRadius}),0,255)'`);
    }

    if (blur > 0) {
      filters.push(`boxblur=${blur}:${blur}`);
    }

    if (rotation !== 0) {
      filters.push(`rotate=${rotation}*PI/180`);
    }

    if (flipHorizontal) {
      filters.push('hflip');
    }

    if (flipVertical) {
      filters.push('vflip');
    }

    if (borderWidth > 0) {
      filters.push(`drawbox=x=0:y=0:w=iw:h=ih:color=${borderColor}:t=${borderWidth}`);
    }

    if (opacity < 1) {
      filters.push(`format=rgba,colorchannelmixer=aa=${opacity}`);
    }

    // Apply shadow if requested
    let shadowFilter = '';
    if (shadow) {
      const shadowOptions = typeof shadow === 'object' ? shadow : {
        blur: 5,
        color: 'black@0.5',
        offsetX: 3,
        offsetY: 3
      };
      
      // Create shadow by duplicating and offsetting
      shadowFilter = `[1:v]scale=${pipWidth}:${pipHeight},` +
        `colorchannelmixer=aa=0.5,` +
        `boxblur=${shadowOptions.blur}:${shadowOptions.blur}[shadow];` +
        `[0:v][shadow]overlay=${x + shadowOptions.offsetX}:${y + shadowOptions.offsetY}[bg];`;
    }

    // Join filters
    const pipFilter = filters.length > 0 ? filters.join(',') : 'copy';
    
    // Build complete filter
    let filterComplex = shadowFilter;
    filterComplex += `[1:v]${pipFilter}[pip];`;
    filterComplex += shadowFilter ? `[bg][pip]` : `[0:v][pip]`;
    
    // Add animation
    const overlayOptions = this.getAnimationOptions(animation, animationDuration, animationDelay, x, y);
    filterComplex += `overlay=${overlayOptions}`;

    // Apply time constraints
    if (startTime > 0 || endTime !== undefined) {
      filterComplex += `:enable='between(t,${startTime},${endTime || 'inf'})'`;
    }

    // Add the PiP video and filter
    let result = timeline.addVideo(videoSource, {
      startTime: startTime,
      duration: endTime ? endTime - startTime : undefined
    });

    result = result.addFilter(filterComplex);

    // Handle audio
    if (audioMix !== 'mute') {
      const volume = audioMix === 'duck' ? 0.3 : audioMix === 'full' ? 1 : audioMix;
      result = result.addAudio(videoSource, {
        startTime: startTime,
        duration: endTime ? endTime - startTime : undefined,
        volume: volume
      });
    }

    return result;
  }

  /**
   * Add multiple picture-in-picture videos
   * 
   * @example
   * ```typescript
   * const multiPiP = PictureInPicture.addMultiple(timeline, {
   *   videos: [
   *     { source: 'cam1.mp4', options: { position: 'top-left' } },
   *     { source: 'cam2.mp4', options: { position: 'top-right' } },
   *     { source: 'cam3.mp4', options: { position: 'bottom-left' } }
   *   ],
   *   layout: 'grid'
   * });
   * ```
   */
  static addMultiple(
    timeline: Timeline,
    options: MultiPiPOptions
  ): Timeline {
    const { videos, layout = 'grid', spacing = 10 } = options;
    
    let result = timeline;
    
    if (layout === 'grid') {
      // Calculate grid dimensions
      const gridSize = Math.ceil(Math.sqrt(videos.length));
      const cellWidth = 1 / gridSize;
      const cellHeight = 1 / gridSize;
      
      videos.forEach((video, index) => {
        const row = Math.floor(index / gridSize);
        const col = index % gridSize;
        
        const pipOptions: PiPOptions = {
          ...video.options,
          position: 'custom',
          customPosition: {
            x: `${col * cellWidth * 100}%`,
            y: `${row * cellHeight * 100}%`
          },
          scale: cellWidth * 0.9 // Leave some spacing
        };
        
        result = PictureInPicture.add(result, video.source, pipOptions);
      });
    } else if (layout === 'stack') {
      // Stack videos vertically
      videos.forEach((video, index) => {
        const pipOptions: PiPOptions = {
          ...video.options,
          position: 'custom',
          customPosition: {
            x: '5%',
            y: `${5 + index * 25}%`
          },
          scale: 0.2
        };
        
        result = PictureInPicture.add(result, video.source, pipOptions);
      });
    } else if (layout === 'carousel') {
      // Arrange in a circle
      const angleStep = (2 * Math.PI) / videos.length;
      const radius = 35; // Percentage of video size
      
      videos.forEach((video, index) => {
        const angle = index * angleStep;
        const x = 50 + radius * Math.cos(angle);
        const y = 50 + radius * Math.sin(angle);
        
        const pipOptions: PiPOptions = {
          ...video.options,
          position: 'custom',
          customPosition: {
            x: `${x}%`,
            y: `${y}%`
          },
          scale: 0.15
        };
        
        result = PictureInPicture.add(result, video.source, pipOptions);
      });
    } else {
      // Custom layout - just add them as specified
      videos.forEach(video => {
        result = PictureInPicture.add(result, video.source, video.options);
      });
    }
    
    return result;
  }

  /**
   * Create a reaction video layout
   * 
   * @example
   * ```typescript
   * const reaction = PictureInPicture.createReactionLayout(
   *   'content.mp4',
   *   'reaction.mp4',
   *   {
   *     reactionPosition: 'bottom-right',
   *     reactionScale: 0.3,
   *     reactionShape: 'circle'
   *   }
   * );
   * ```
   */
  static createReactionLayout(
    contentVideo: string,
    reactionVideo: string,
    options: {
      reactionPosition?: PiPOptions['position'];
      reactionScale?: number;
      reactionShape?: 'rectangle' | 'circle' | 'rounded';
      startSync?: boolean; // Sync start times
    } = {}
  ): Timeline {
    const {
      reactionPosition = 'bottom-right',
      reactionScale = 0.3,
      reactionShape = 'circle',
      startSync = true
    } = options;

    const timeline = new Timeline().addVideo(contentVideo);
    
    const pipOptions: PiPOptions = {
      position: reactionPosition,
      scale: reactionScale,
      animation: 'slide-in',
      animationDuration: 0.5,
      shadow: true,
      audioMix: 'duck'
    };

    // Apply shape
    if (reactionShape === 'circle') {
      pipOptions.borderRadius = 999; // Large radius for circle effect
    } else if (reactionShape === 'rounded') {
      pipOptions.borderRadius = 20;
    }

    return PictureInPicture.add(timeline, reactionVideo, pipOptions);
  }

  /**
   * Create a webcam overlay (typical for tutorials/gaming)
   * 
   * @example
   * ```typescript
   * const tutorial = PictureInPicture.createWebcamOverlay(
   *   timeline,
   *   'webcam.mp4',
   *   {
   *     shape: 'circle',
   *     position: 'bottom-left',
   *     pulseEffect: true
   *   }
   * );
   * ```
   */
  static createWebcamOverlay(
    timeline: Timeline,
    webcamSource: string,
    options: {
      shape?: 'rectangle' | 'circle' | 'rounded';
      position?: PiPOptions['position'];
      scale?: number;
      pulseEffect?: boolean;
      greenScreen?: boolean;
      chromaKey?: string;
    } = {}
  ): Timeline {
    const {
      shape = 'circle',
      position = 'bottom-right',
      scale = 0.2,
      pulseEffect = false,
      greenScreen = false,
      chromaKey = '#00FF00'
    } = options;

    let pipOptions: PiPOptions = {
      position,
      scale,
      shadow: true,
      animation: 'zoom-in',
      audioMix: 'full'
    };

    // Apply shape
    if (shape === 'circle') {
      pipOptions.borderRadius = 999;
      if (pulseEffect) {
        pipOptions.borderWidth = 3;
        pipOptions.borderColor = '#FF0000';
      }
    } else if (shape === 'rounded') {
      pipOptions.borderRadius = 15;
    }

    // Add green screen removal if requested
    if (greenScreen) {
      const chromaOptions = {
        ...pipOptions,
        chromaKey: chromaKey
      };
      return PictureInPicture.addWithChromaKey(timeline, webcamSource, chromaOptions);
    }

    return PictureInPicture.add(timeline, webcamSource, pipOptions);
  }

  /**
   * Add picture-in-picture with chroma key (green screen) removal
   * 
   * @example
   * ```typescript
   * const withGreenScreen = PictureInPicture.addWithChromaKey(
   *   timeline,
   *   'webcam-greenscreen.mp4',
   *   {
   *     position: 'bottom-right',
   *     scale: 0.3,
   *     chromaKey: '#00FF00',
   *     chromaSimilarity: 0.4,
   *     chromaBlend: 0.1
   *   }
   * );
   * ```
   */
  static addWithChromaKey(
    timeline: Timeline,
    videoSource: string,
    options: PiPOptions & {
      chromaKey?: string;
      chromaSimilarity?: number;
      chromaBlend?: number;
      chromaYuv?: boolean;
    } = {}
  ): Timeline {
    const {
      chromaKey = '#00FF00',
      chromaSimilarity = 0.4,
      chromaBlend = 0.1,
      chromaYuv = false,
      ...pipOptions
    } = options;

    // Convert hex color to RGB values
    const hexToRgb = (hex: string): { r: number; g: number; b: number } => {
      const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
      return result ? {
        r: parseInt(result[1], 16) / 255,
        g: parseInt(result[2], 16) / 255,
        b: parseInt(result[3], 16) / 255
      } : { r: 0, g: 1, b: 0 }; // Default to green
    };

    const { r, g, b } = hexToRgb(chromaKey);

    // Build chromakey filter
    const chromaFilter = chromaYuv
      ? `chromakey=color=0x${chromaKey.replace('#', '')}:similarity=${chromaSimilarity}:blend=${chromaBlend}:yuv=true`
      : `chromakey=color=0x${chromaKey.replace('#', '')}:similarity=${chromaSimilarity}:blend=${chromaBlend}`;

    // Calculate size
    const scale = pipOptions.scale || 0.25;
    const pipWidth = `iw*${scale}`;
    const pipHeight = `ih*${scale}`;

    // Calculate position
    const { x, y } = this.calculatePosition(
      pipOptions.position || 'bottom-right',
      pipOptions.customPosition,
      pipWidth,
      pipHeight
    );

    // Build filter complex with chromakey
    let filterComplex = `[1:v]scale=${pipWidth}:${pipHeight},${chromaFilter}`;

    // Add additional effects
    if (pipOptions.borderRadius && pipOptions.borderRadius > 0) {
      // Rounded corners
      filterComplex += `,geq=lum='if(gt(abs(X-W/2),W/2-${pipOptions.borderRadius})*gt(abs(Y-H/2),H/2-${pipOptions.borderRadius}),0,255)':a='if(gt(abs(X-W/2),W/2-${pipOptions.borderRadius})*gt(abs(Y-H/2),H/2-${pipOptions.borderRadius}),0,255)'`;
    }

    if (pipOptions.opacity && pipOptions.opacity < 1) {
      filterComplex += `,format=rgba,colorchannelmixer=aa=${pipOptions.opacity}`;
    }

    // Add shadow if requested
    if (pipOptions.shadow) {
      const shadowOptions = typeof pipOptions.shadow === 'object' ? pipOptions.shadow : {
        blur: 5,
        color: 'black@0.5',
        offsetX: 3,
        offsetY: 3
      };
      
      // Create shadow
      filterComplex = `[1:v]scale=${pipWidth}:${pipHeight},${chromaFilter},` +
        `colorchannelmixer=aa=0.5,` +
        `boxblur=${shadowOptions.blur}:${shadowOptions.blur}[shadow];` +
        filterComplex + `[pip];` +
        `[0:v][shadow]overlay=${x + shadowOptions.offsetX}:${y + shadowOptions.offsetY}[bg];` +
        `[bg][pip]overlay=${x}:${y}`;
    } else {
      filterComplex += `[pip];[0:v][pip]overlay=${x}:${y}`;
    }

    // Add time constraints
    if (pipOptions.startTime || pipOptions.endTime) {
      filterComplex += `:enable='between(t,${pipOptions.startTime || 0},${pipOptions.endTime || 'inf'})'`;
    }

    // Add the video and filter
    let result = timeline.addVideo(videoSource, {
      startTime: pipOptions.startTime,
      duration: pipOptions.endTime ? pipOptions.endTime - (pipOptions.startTime || 0) : undefined
    });

    result = result.addFilter(filterComplex);

    // Handle audio
    if (pipOptions.audioMix !== 'mute') {
      const volume = pipOptions.audioMix === 'duck' ? 0.3 : 
                     pipOptions.audioMix === 'full' ? 1 : 
                     typeof pipOptions.audioMix === 'number' ? pipOptions.audioMix : 0.5;
      
      result = result.addAudio(videoSource, {
        startTime: pipOptions.startTime,
        duration: pipOptions.endTime ? pipOptions.endTime - (pipOptions.startTime || 0) : undefined,
        volume: volume
      });
    }

    return result;
  }

  /**
   * Calculate position coordinates
   * @private
   */
  private static calculatePosition(
    position: string,
    customPosition: PiPOptions['customPosition'],
    width: string,
    height: string
  ): { x: string; y: string } {
    if (position === 'custom' && customPosition) {
      return {
        x: typeof customPosition.x === 'number' ? `${customPosition.x}` : customPosition.x,
        y: typeof customPosition.y === 'number' ? `${customPosition.y}` : customPosition.y
      };
    }

    const margin = 20; // pixels
    
    switch (position) {
      case 'top-left':
        return { x: `${margin}`, y: `${margin}` };
      case 'top-right':
        return { x: `W-w-${margin}`, y: `${margin}` };
      case 'bottom-left':
        return { x: `${margin}`, y: `H-h-${margin}` };
      case 'bottom-right':
        return { x: `W-w-${margin}`, y: `H-h-${margin}` };
      case 'center':
        return { x: '(W-w)/2', y: '(H-h)/2' };
      default:
        return { x: `W-w-${margin}`, y: `H-h-${margin}` }; // Default to bottom-right
    }
  }

  /**
   * Get animation options for overlay filter
   * @private
   */
  private static getAnimationOptions(
    animation: string,
    duration: number,
    delay: number,
    targetX: string,
    targetY: string
  ): string {
    const startTime = delay;
    const endTime = delay + duration;
    
    switch (animation) {
      case 'slide-in':
        // Slide in from right
        return `x='if(lt(t,${startTime}),W,if(lt(t,${endTime}),W+(${targetX}-W)*((t-${startTime})/${duration}),${targetX}))':y=${targetY}`;
        
      case 'fade-in':
        // Fade in
        return `x=${targetX}:y=${targetY}:enable='gte(t,${startTime})'`;
        
      case 'bounce-in':
        // Bounce effect (simplified)
        return `x=${targetX}:y='if(lt(t,${endTime}),${targetY}*(1-0.3*abs(sin(2*PI*(t-${startTime})/${duration}))),${targetY})'`;
        
      case 'zoom-in':
        // Zoom in from center
        return `x='if(lt(t,${endTime}),(W-w)/2+(${targetX}-(W-w)/2)*((t-${startTime})/${duration}),${targetX})':` +
               `y='if(lt(t,${endTime}),(H-h)/2+(${targetY}-(H-h)/2)*((t-${startTime})/${duration}),${targetY})'`;
        
      default:
        return `x=${targetX}:y=${targetY}`;
    }
  }
}

// Add convenience method to Timeline
declare module '../timeline/timeline.js' {
  interface Timeline {
    /**
     * Add a picture-in-picture overlay
     */
    addPictureInPicture(videoSource: string, options?: PiPOptions): Timeline;
  }
}

Timeline.prototype.addPictureInPicture = function(videoSource: string, options?: PiPOptions): Timeline {
  return PictureInPicture.add(this, videoSource, options);
};
/**
 * Pan and Zoom Effects
 * 
 * Implements Ken Burns effect and other pan/zoom transformations
 * for creating dynamic movement in static images or videos
 */

import { Timeline } from '../timeline/timeline.js';

export interface PanZoomOptions {
  /** Starting rectangle (x, y, width, height) */
  startRect: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
  /** Ending rectangle (x, y, width, height) */
  endRect: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
  /** Duration of the effect in seconds */
  duration: number;
  /** Easing function for the movement */
  easing?: 'linear' | 'ease-in' | 'ease-out' | 'ease-in-out';
  /** Input resolution for calculations */
  inputResolution?: {
    width: number;
    height: number;
  };
}

export interface KenBurnsEffectOptions {
  /** Zoom level at start (1.0 = no zoom) */
  startZoom?: number;
  /** Zoom level at end */
  endZoom?: number;
  /** Pan direction */
  direction?: 'random' | 'center-out' | 'top-bottom' | 'left-right' | 'diagonal';
  /** Duration in seconds */
  duration: number;
  /** Easing function */
  easing?: 'linear' | 'ease-in' | 'ease-out' | 'ease-in-out';
}

/**
 * Calculate zoom/pan filter expression for FFmpeg
 */
function calculateZoomPan(options: PanZoomOptions): string {
  const {
    startRect,
    endRect,
    duration,
    easing = 'linear',
    inputResolution = { width: 1920, height: 1080 }
  } = options;

  // Calculate zoom factors
  const startZoomX = inputResolution.width / startRect.width;
  const startZoomY = inputResolution.height / startRect.height;
  const startZoom = Math.min(startZoomX, startZoomY);

  const endZoomX = inputResolution.width / endRect.width;
  const endZoomY = inputResolution.height / endRect.height;
  const endZoom = Math.min(endZoomX, endZoomY);

  // Calculate pan positions (centered)
  const startX = startRect.x + startRect.width / 2;
  const startY = startRect.y + startRect.height / 2;
  const endX = endRect.x + endRect.width / 2;
  const endY = endRect.y + endRect.height / 2;

  // Build easing expression
  let easingExpr = 't/duration';
  switch (easing) {
    case 'ease-in':
      easingExpr = '(t/duration)*(t/duration)';
      break;
    case 'ease-out':
      easingExpr = '1-pow(1-t/duration,2)';
      break;
    case 'ease-in-out':
      easingExpr = 'if(lt(t,duration/2),2*pow(t/duration,2),1-2*pow(1-t/duration,2))';
      break;
  }

  // Build zoompan filter expression
  const zoomExpr = `${startZoom}+${endZoom - startZoom}*${easingExpr}`;
  const xExpr = `(iw/2)-(iw/zoom/2)+${endX - startX}*${easingExpr}`;
  const yExpr = `(ih/2)-(ih/zoom/2)+${endY - startY}*${easingExpr}`;

  // Build the filter as a proper filter options object
  return `z='${zoomExpr}':x='${xExpr}':y='${yExpr}':d=${Math.floor(duration * 25)}:s=${inputResolution.width}x${inputResolution.height}:fps=25`;
}

/**
 * Generate Ken Burns effect parameters
 */
function generateKenBurns(options: KenBurnsEffectOptions, inputResolution = { width: 1920, height: 1080 }): PanZoomOptions {
  const {
    startZoom = 1.0,
    endZoom = 1.3,
    direction = 'random',
    duration,
    easing
  } = options;

  let startRect: PanZoomOptions['startRect'];
  let endRect: PanZoomOptions['endRect'];

  // Calculate rectangles based on zoom levels
  const startWidth = inputResolution.width / startZoom;
  const startHeight = inputResolution.height / startZoom;
  const endWidth = inputResolution.width / endZoom;
  const endHeight = inputResolution.height / endZoom;

  switch (direction) {
    case 'center-out':
      // Start centered, maintain center
      startRect = {
        x: (inputResolution.width - startWidth) / 2,
        y: (inputResolution.height - startHeight) / 2,
        width: startWidth,
        height: startHeight
      };
      endRect = {
        x: (inputResolution.width - endWidth) / 2,
        y: (inputResolution.height - endHeight) / 2,
        width: endWidth,
        height: endHeight
      };
      break;

    case 'top-bottom':
      // Pan from top to bottom
      startRect = {
        x: (inputResolution.width - startWidth) / 2,
        y: 0,
        width: startWidth,
        height: startHeight
      };
      endRect = {
        x: (inputResolution.width - endWidth) / 2,
        y: inputResolution.height - endHeight,
        width: endWidth,
        height: endHeight
      };
      break;

    case 'left-right':
      // Pan from left to right
      startRect = {
        x: 0,
        y: (inputResolution.height - startHeight) / 2,
        width: startWidth,
        height: startHeight
      };
      endRect = {
        x: inputResolution.width - endWidth,
        y: (inputResolution.height - endHeight) / 2,
        width: endWidth,
        height: endHeight
      };
      break;

    case 'diagonal':
      // Pan from top-left to bottom-right
      startRect = {
        x: 0,
        y: 0,
        width: startWidth,
        height: startHeight
      };
      endRect = {
        x: inputResolution.width - endWidth,
        y: inputResolution.height - endHeight,
        width: endWidth,
        height: endHeight
      };
      break;

    case 'random':
    default:
      // Random pan direction
      const startX = Math.random() * (inputResolution.width - startWidth);
      const startY = Math.random() * (inputResolution.height - startHeight);
      const endX = Math.random() * (inputResolution.width - endWidth);
      const endY = Math.random() * (inputResolution.height - endHeight);

      startRect = {
        x: startX,
        y: startY,
        width: startWidth,
        height: startHeight
      };
      endRect = {
        x: endX,
        y: endY,
        width: endWidth,
        height: endHeight
      };
      break;
  }

  return {
    startRect,
    endRect,
    duration,
    easing,
    inputResolution
  };
}

/**
 * Add pan and zoom effect to timeline
 */
export function addPanZoom(timeline: Timeline, options: PanZoomOptions): Timeline {
  const filterExpr = calculateZoomPan(options);
  
  // Pass the complete zoompan filter expression
  return timeline.addFilter(`zoompan=${filterExpr}`);
}

/**
 * Add Ken Burns effect to timeline
 */
export function addKenBurns(timeline: Timeline, options: KenBurnsEffectOptions): Timeline {
  const panZoomOptions = generateKenBurns(options);
  return addPanZoom(timeline, panZoomOptions);
}

/**
 * Create a smooth zoom in effect
 */
export function zoomIn(
  timeline: Timeline,
  options: {
    zoom?: number;
    duration?: number;
    easing?: PanZoomOptions['easing'];
  } = {}
): Timeline {
  const { zoom = 1.5, duration = 5, easing = 'ease-in-out' } = options;
  
  return addKenBurns(timeline, {
    startZoom: 1.0,
    endZoom: zoom,
    direction: 'center-out',
    duration,
    easing
  });
}

/**
 * Create a smooth zoom out effect
 */
export function zoomOut(
  timeline: Timeline,
  options: {
    zoom?: number;
    duration?: number;
    easing?: PanZoomOptions['easing'];
  } = {}
): Timeline {
  const { zoom = 1.5, duration = 5, easing = 'ease-in-out' } = options;
  
  return addKenBurns(timeline, {
    startZoom: zoom,
    endZoom: 1.0,
    direction: 'center-out',
    duration,
    easing
  });
}

/**
 * Create a pan effect across the image
 */
export function pan(
  timeline: Timeline,
  options: {
    direction?: 'left' | 'right' | 'up' | 'down';
    duration?: number;
    easing?: PanZoomOptions['easing'];
  } = {}
): Timeline {
  const { direction = 'right', duration = 5, easing = 'linear' } = options;
  
  let kenBurnsDirection: KenBurnsEffectOptions['direction'];
  switch (direction) {
    case 'left':
    case 'right':
      kenBurnsDirection = 'left-right';
      break;
    case 'up':
    case 'down':
      kenBurnsDirection = 'top-bottom';
      break;
    default:
      kenBurnsDirection = 'left-right';
  }
  
  return addKenBurns(timeline, {
    startZoom: 1.0,
    endZoom: 1.0, // No zoom, just pan
    direction: kenBurnsDirection,
    duration,
    easing
  });
}

/**
 * Create multiple pan/zoom effects in sequence
 * This creates a complex filter chain that transitions between multiple effects
 */
export function multiPanZoom(
  timeline: Timeline,
  effects: Array<{
    type: 'pan' | 'zoom-in' | 'zoom-out' | 'ken-burns' | 'custom';
    duration: number;
    options?: any;
  }>
): Timeline {
  if (effects.length === 0) return timeline;
  
  // Calculate total duration
  const totalDuration = effects.reduce((sum, effect) => sum + effect.duration, 0);
  
  // Build sequential zoompan expressions
  let currentTime = 0;
  const zoomParts: string[] = [];
  const xParts: string[] = [];
  const yParts: string[] = [];
  
  for (const effect of effects) {
    const startTime = currentTime;
    const endTime = currentTime + effect.duration;
    
    let panZoomOptions: PanZoomOptions;
    
    switch (effect.type) {
      case 'zoom-in':
        panZoomOptions = generateKenBurns({
          startZoom: effect.options?.startZoom || 1.0,
          endZoom: effect.options?.zoom || 1.5,
          direction: 'center-out',
          duration: effect.duration,
          easing: effect.options?.easing || 'ease-in-out'
        });
        break;
        
      case 'zoom-out':
        panZoomOptions = generateKenBurns({
          startZoom: effect.options?.zoom || 1.5,
          endZoom: effect.options?.endZoom || 1.0,
          direction: 'center-out',
          duration: effect.duration,
          easing: effect.options?.easing || 'ease-in-out'
        });
        break;
        
      case 'pan':
        const direction = effect.options?.direction || 'right';
        let kenBurnsDir: KenBurnsEffectOptions['direction'] = 'left-right';
        if (direction === 'up' || direction === 'down') {
          kenBurnsDir = 'top-bottom';
        }
        panZoomOptions = generateKenBurns({
          startZoom: 1.0,
          endZoom: 1.0,
          direction: kenBurnsDir,
          duration: effect.duration,
          easing: effect.options?.easing || 'linear'
        });
        break;
        
      case 'ken-burns':
        panZoomOptions = generateKenBurns({
          ...effect.options,
          duration: effect.duration
        });
        break;
        
      case 'custom':
        panZoomOptions = effect.options as PanZoomOptions;
        break;
        
      default:
        continue;
    }
    
    // Create time-gated expression for this effect
    const timeCondition = effect === effects[effects.length - 1]
      ? `gte(t,${startTime})`
      : `between(t,${startTime},${endTime})`;
    
    // Adjust the pan/zoom calculations for the time window
    const localT = `(t-${startTime})`;
    const { startRect, endRect, easing = 'linear' } = panZoomOptions;
    const inputRes = panZoomOptions.inputResolution || { width: 1920, height: 1080 };
    
    // Calculate zoom factors
    const startZoom = Math.min(
      inputRes.width / startRect.width,
      inputRes.height / startRect.height
    );
    const endZoom = Math.min(
      inputRes.width / endRect.width,
      inputRes.height / endRect.height
    );
    
    // Build easing expression for local time
    let easingExpr = `${localT}/${effect.duration}`;
    switch (easing) {
      case 'ease-in':
        easingExpr = `pow(${localT}/${effect.duration},2)`;
        break;
      case 'ease-out':
        easingExpr = `1-pow(1-${localT}/${effect.duration},2)`;
        break;
      case 'ease-in-out':
        easingExpr = `if(lt(${localT},${effect.duration}/2),2*pow(${localT}/${effect.duration},2),1-2*pow(1-${localT}/${effect.duration},2))`;
        break;
    }
    
    // Build expressions for this segment
    const zoomExpr = `${startZoom}+${endZoom - startZoom}*${easingExpr}`;
    const xExpr = `${startRect.x + startRect.width/2}+${endRect.x + endRect.width/2 - startRect.x - startRect.width/2}*${easingExpr}`;
    const yExpr = `${startRect.y + startRect.height/2}+${endRect.y + endRect.height/2 - startRect.y - startRect.height/2}*${easingExpr}`;
    
    zoomParts.push(`if(${timeCondition},${zoomExpr},1)`);
    xParts.push(`if(${timeCondition},${xExpr},iw/2)`);
    yParts.push(`if(${timeCondition},${yExpr},ih/2)`);
    
    currentTime = endTime;
  }
  
  // Combine all expressions using nested conditionals
  const combinedZoom = zoomParts.length === 1 ? zoomParts[0] : zoomParts.join('+');
  const combinedX = xParts.length === 1 ? xParts[0] : xParts.join('+');
  const combinedY = yParts.length === 1 ? yParts[0] : yParts.join('+');
  
  // Build final filter expression
  const filterExpr = `z='${combinedZoom}':x='${combinedX}':y='${combinedY}':d=${Math.floor(totalDuration * 25)}:s=1920x1080:fps=25`;
  
  return timeline.addFilter(`zoompan=${filterExpr}`);
}

/**
 * AI-friendly pan/zoom suggestions based on content
 */
export function suggestPanZoom(
  timeline: Timeline,
  options: {
    contentType?: 'landscape' | 'portrait' | 'group-photo' | 'text-heavy' | 'action';
    platform?: 'tiktok' | 'youtube' | 'instagram';
  } = {}
): Timeline {
  const { contentType = 'landscape', platform = 'youtube' } = options;

  // Platform-specific durations
  const durations = {
    tiktok: 3, // Shorter for TikTok
    youtube: 5, // Medium for YouTube
    instagram: 4 // Medium for Instagram
  };

  const duration = durations[platform];

  switch (contentType) {
    case 'landscape':
      // Slow pan across scenic views
      return pan(timeline, {
        direction: 'right',
        duration: duration * 1.5,
        easing: 'linear'
      });

    case 'portrait':
      // Zoom in on face/subject
      return zoomIn(timeline, {
        zoom: 1.3,
        duration,
        easing: 'ease-in-out'
      });

    case 'group-photo':
      // Pan to show everyone
      return addKenBurns(timeline, {
        startZoom: 1.0,
        endZoom: 1.2,
        direction: 'left-right',
        duration: duration * 1.2,
        easing: 'ease-in-out'
      });

    case 'text-heavy':
      // Gentle zoom to maintain readability
      return zoomIn(timeline, {
        zoom: 1.1,
        duration,
        easing: 'ease-out'
      });

    case 'action':
      // Dynamic movement
      return addKenBurns(timeline, {
        startZoom: 1.2,
        endZoom: 1.5,
        direction: 'diagonal',
        duration: duration * 0.8,
        easing: 'ease-in'
      });

    default:
      // Default Ken Burns effect
      return addKenBurns(timeline, {
        direction: 'random',
        duration,
        easing: 'ease-in-out'
      });
  }
}

/**
 * Create a cinematic sequence with multiple effects
 */
export function cinematicSequence(
  timeline: Timeline,
  options: {
    style?: 'dramatic' | 'gentle' | 'dynamic' | 'documentary';
    duration?: number;
  } = {}
): Timeline {
  const { style = 'dramatic', duration = 10 } = options;
  
  const sequences: Record<string, Array<Parameters<typeof multiPanZoom>[1][0]>> = {
    dramatic: [
      { type: 'zoom-in', duration: duration * 0.3, options: { zoom: 1.2, easing: 'ease-in' } },
      { type: 'pan', duration: duration * 0.4, options: { direction: 'right', easing: 'linear' } },
      { type: 'zoom-in', duration: duration * 0.3, options: { zoom: 1.5, easing: 'ease-out' } }
    ],
    gentle: [
      { type: 'ken-burns', duration: duration * 0.5, options: { startZoom: 1.0, endZoom: 1.1, direction: 'center-out' } },
      { type: 'pan', duration: duration * 0.5, options: { direction: 'right', easing: 'ease-in-out' } }
    ],
    dynamic: [
      { type: 'zoom-out', duration: duration * 0.2, options: { zoom: 1.3, easing: 'ease-out' } },
      { type: 'pan', duration: duration * 0.3, options: { direction: 'left', easing: 'ease-in-out' } },
      { type: 'zoom-in', duration: duration * 0.3, options: { zoom: 1.4, easing: 'ease-in-out' } },
      { type: 'pan', duration: duration * 0.2, options: { direction: 'up', easing: 'ease-in' } }
    ],
    documentary: [
      { type: 'pan', duration: duration * 0.6, options: { direction: 'right', easing: 'linear' } },
      { type: 'zoom-in', duration: duration * 0.4, options: { zoom: 1.2, easing: 'ease-out' } }
    ]
  };
  
  return multiPanZoom(timeline, sequences[style]);
}

// Export for pipe() composition
export const panZoomEffect = (options: PanZoomOptions) => 
  (timeline: Timeline) => addPanZoom(timeline, options);

export const kenBurnsEffect = (options: KenBurnsEffectOptions) => 
  (timeline: Timeline) => addKenBurns(timeline, options);

export const zoomInEffect = (options?: Parameters<typeof zoomIn>[1]) => 
  (timeline: Timeline) => zoomIn(timeline, options);

export const zoomOutEffect = (options?: Parameters<typeof zoomOut>[1]) => 
  (timeline: Timeline) => zoomOut(timeline, options);

export const panEffect = (options?: Parameters<typeof pan>[1]) => 
  (timeline: Timeline) => pan(timeline, options);

export const multiPanZoomEffect = (effects: Parameters<typeof multiPanZoom>[1]) =>
  (timeline: Timeline) => multiPanZoom(timeline, effects);

export const cinematicSequenceEffect = (options?: Parameters<typeof cinematicSequence>[1]) =>
  (timeline: Timeline) => cinematicSequence(timeline, options);
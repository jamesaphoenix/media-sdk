/**
 * Timeline Pan/Zoom Integration
 * 
 * Extends Timeline with pan/zoom capabilities
 */

import { Timeline } from './timeline.js';
import type { FilterOptions } from '../types/index.js';

/**
 * Add zoompan effect to Timeline
 * This is a specialized method for applying zoompan filter correctly
 */
export function addZoomPan(
  timeline: Timeline,
  options: {
    zoom?: string;
    x?: string;
    y?: string;
    duration?: number;
    size?: string;
    fps?: number;
  }
): Timeline {
  // Build filter options for zoompan
  const filterOptions: FilterOptions = {};
  
  // Default values
  const {
    zoom = '1',
    x = 'iw/2-(iw/zoom/2)',
    y = 'ih/2-(ih/zoom/2)',
    duration = 125,
    size = '1920x1080',
    fps = 25
  } = options;
  
  // Create a properly formatted zoompan expression
  const zoompanExpr = `z=${zoom}:x=${x}:y=${y}:d=${duration}:s=${size}:fps=${fps}`;
  
  // Add as a raw filter expression
  filterOptions.raw = zoompanExpr;
  
  return timeline.addFilter('zoompan', filterOptions);
}

// Extend Timeline prototype with pan/zoom methods
declare module './timeline' {
  interface Timeline {
    /**
     * Add pan/zoom effect to the timeline
     */
    addPanZoom(options: {
      zoom?: string;
      x?: string;
      y?: string;
      duration?: number;
      size?: string;
      fps?: number;
    }): Timeline;
    
    /**
     * Add Ken Burns effect
     */
    addKenBurnsEffect(options: {
      startZoom?: number;
      endZoom?: number;
      duration?: number;
      easing?: 'linear' | 'ease-in' | 'ease-out' | 'ease-in-out';
    }): Timeline;
  }
}

// Add methods to Timeline prototype
Timeline.prototype.addPanZoom = function(options) {
  return addZoomPan(this, options);
};

Timeline.prototype.addKenBurnsEffect = function(options) {
  const {
    startZoom = 1,
    endZoom = 1.5,
    duration = 5,
    easing = 'linear'
  } = options;
  
  // Calculate zoom expression based on easing
  let zoomExpr: string;
  switch (easing) {
    case 'ease-in':
      zoomExpr = `${startZoom}+${endZoom - startZoom}*pow(t/${duration},2)`;
      break;
    case 'ease-out':
      zoomExpr = `${startZoom}+${endZoom - startZoom}*(1-pow(1-t/${duration},2))`;
      break;
    case 'ease-in-out':
      zoomExpr = `${startZoom}+${endZoom - startZoom}*(3*pow(t/${duration},2)-2*pow(t/${duration},3))`;
      break;
    default:
      zoomExpr = `${startZoom}+${endZoom - startZoom}*t/${duration}`;
  }
  
  return this.addPanZoom({
    zoom: zoomExpr,
    duration: duration * 25, // Convert seconds to frames at 25fps
  });
};
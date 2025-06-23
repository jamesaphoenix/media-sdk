/**
 * @fileoverview Timeline Extensions
 * 
 * Additional methods for Timeline that extend its functionality
 */

import { Timeline } from './timeline.js';
import type { TimelineLayer } from '../types/index.js';

declare module './timeline.js' {
  interface Timeline {
    /**
     * Set resolution (convenience method for scale)
     */
    setResolution(width: number, height: number): Timeline;
    
    /**
     * Merge another timeline into this one
     */
    merge(other: Timeline): Timeline;
    
    /**
     * Get all layers
     */
    getLayers(): TimelineLayer[];
  }
}

// Add methods to Timeline prototype
Timeline.prototype.setResolution = function(width: number, height: number): Timeline {
  return this.scale(width, height);
};

Timeline.prototype.merge = function(other: Timeline): Timeline {
  const otherLayers = other.getLayers();
  const newLayers = [...this.layers, ...otherLayers];
  return new Timeline(newLayers, this.globalOptions);
};

Timeline.prototype.getLayers = function(): TimelineLayer[] {
  return [...this.layers];
};
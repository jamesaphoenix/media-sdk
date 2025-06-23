/**
 * @fileoverview Video Splicing and Trimming functionality
 * 
 * Provides advanced video editing capabilities including:
 * - Extracting specific segments from videos
 * - Removing unwanted segments
 * - Splicing multiple segments together
 * - Smart transitions between segments
 */

import { Timeline } from './timeline.js';
import type { TimelineLayer } from '../types/index.js';

export interface TimeSegment {
  startTime: number;
  endTime: number;
  source?: string;
  transition?: 'cut' | 'fade' | 'dissolve' | 'wipe';
  transitionDuration?: number;
}

export interface SpliceOptions {
  segments: TimeSegment[];
  defaultTransition?: 'cut' | 'fade' | 'dissolve' | 'wipe';
  defaultTransitionDuration?: number;
  maintainAudio?: boolean;
  reorderSegments?: boolean;
}

export interface TrimOptions {
  removeSegments?: TimeSegment[];
  keepSegments?: TimeSegment[];
  fillGaps?: 'black' | 'blur' | 'freeze' | 'remove';
}

export class VideoSplicer {
  /**
   * Extract a specific segment from a video
   * 
   * @example
   * ```typescript
   * const segment = VideoSplicer.extractSegment(timeline, 10, 20);
   * // Extracts 10-20 second segment
   * ```
   */
  static extractSegment(
    timeline: Timeline, 
    startTime: number, 
    endTime: number
  ): Timeline {
    return timeline
      .trim(startTime, endTime - startTime)
      .setStartTime(0); // Reset to start at 0
  }

  /**
   * Remove a segment from a video
   * 
   * @example
   * ```typescript
   * const edited = VideoSplicer.removeSegment(timeline, 5, 10);
   * // Removes 5-10 second segment, joins remaining parts
   * ```
   */
  static removeSegment(
    timeline: Timeline,
    startTime: number,
    endTime: number
  ): Timeline {
    const duration = timeline.getDuration();
    
    if (startTime <= 0 && endTime >= duration) {
      // Removing entire video
      return new Timeline();
    }
    
    const segments: Timeline[] = [];
    
    // Add segment before the cut (if any)
    if (startTime > 0) {
      segments.push(
        VideoSplicer.extractSegment(timeline, 0, startTime)
      );
    }
    
    // Add segment after the cut (if any)
    if (endTime < duration) {
      segments.push(
        VideoSplicer.extractSegment(timeline, endTime, duration)
      );
    }
    
    // Concatenate segments
    return VideoSplicer.concatenate(segments);
  }

  /**
   * Remove multiple segments from a video
   * 
   * @example
   * ```typescript
   * const edited = VideoSplicer.removeSegments(timeline, [
   *   { startTime: 5, endTime: 10 },
   *   { startTime: 20, endTime: 25 }
   * ]);
   * ```
   */
  static removeSegments(
    timeline: Timeline,
    segments: TimeSegment[]
  ): Timeline {
    // Sort segments by start time (descending) to remove from end first
    const sortedSegments = [...segments].sort((a, b) => b.startTime - a.startTime);
    
    let result = timeline;
    for (const segment of sortedSegments) {
      result = VideoSplicer.removeSegment(result, segment.startTime, segment.endTime);
    }
    
    return result;
  }

  /**
   * Splice multiple video segments together
   * 
   * @example
   * ```typescript
   * const montage = VideoSplicer.splice({
   *   segments: [
   *     { source: 'video1.mp4', startTime: 0, endTime: 5 },
   *     { source: 'video2.mp4', startTime: 10, endTime: 15 },
   *     { source: 'video3.mp4', startTime: 20, endTime: 25 }
   *   ],
   *   defaultTransition: 'fade',
   *   defaultTransitionDuration: 0.5
   * });
   * ```
   */
  static splice(options: SpliceOptions): Timeline {
    const {
      segments,
      defaultTransition = 'cut',
      defaultTransitionDuration = 0.5,
      maintainAudio = true,
      reorderSegments = false
    } = options;

    if (segments.length === 0) {
      return new Timeline();
    }

    // Optionally reorder segments by start time
    const orderedSegments = reorderSegments 
      ? [...segments].sort((a, b) => a.startTime - b.startTime)
      : segments;

    const timelines: Timeline[] = [];

    for (let i = 0; i < orderedSegments.length; i++) {
      const segment = orderedSegments[i];
      const source = segment.source || 'input.mp4'; // Default source
      
      // Create timeline for this segment
      let segmentTimeline = new Timeline()
        .addVideo(source, { 
          startTime: 0,
          trimStart: segment.startTime,
          trimEnd: segment.endTime
        });

      // Add transition if not the last segment
      if (i < orderedSegments.length - 1) {
        const transition = segment.transition || defaultTransition;
        const duration = segment.transitionDuration || defaultTransitionDuration;
        
        if (transition !== 'cut') {
          segmentTimeline = VideoSplicer.addTransitionToEnd(
            segmentTimeline, 
            transition, 
            duration
          );
        }
      }

      timelines.push(segmentTimeline);
    }

    return VideoSplicer.concatenate(timelines, {
      maintainAudio,
      defaultTransition,
      defaultTransitionDuration
    });
  }

  /**
   * Concatenate multiple timelines together
   * 
   * @example
   * ```typescript
   * const combined = VideoSplicer.concatenate([
   *   timeline1,
   *   timeline2,
   *   timeline3
   * ]);
   * ```
   */
  static concatenate(
    timelines: Timeline[],
    options: {
      maintainAudio?: boolean;
      defaultTransition?: string;
      defaultTransitionDuration?: number;
    } = {}
  ): Timeline {
    if (timelines.length === 0) {
      return new Timeline();
    }

    if (timelines.length === 1) {
      return timelines[0];
    }

    let result = timelines[0];
    let currentTime = result.getDuration();

    for (let i = 1; i < timelines.length; i++) {
      const nextTimeline = timelines[i];
      const layers = nextTimeline.getLayers();
      
      // Shift all layers to start after current timeline
      for (const layer of layers) {
        const shiftedLayer = {
          ...layer,
          startTime: (layer.startTime || 0) + currentTime
        };
        
        // Add layer to result timeline
        if (layer.type === 'video') {
          result = result.addVideo(layer.source, shiftedLayer);
        } else if (layer.type === 'audio' && options.maintainAudio) {
          result = result.addAudio(layer.source, shiftedLayer);
        } else if (layer.type === 'text') {
          result = result.addText(layer.text || '', shiftedLayer);
        } else if (layer.type === 'image') {
          result = result.addImage(layer.source, shiftedLayer);
        }
      }
      
      currentTime += nextTimeline.getDuration();
    }

    return result;
  }

  /**
   * Add a transition effect to the end of a timeline
   * @private
   */
  private static addTransitionToEnd(
    timeline: Timeline,
    transition: string,
    duration: number
  ): Timeline {
    const totalDuration = timeline.getDuration();
    const transitionStart = totalDuration - duration;
    
    // Add appropriate transition effect
    switch (transition) {
      case 'fade':
        return timeline.fadeOut(duration, transitionStart);
      case 'dissolve':
        // Dissolve is similar to fade but with different alpha curve
        return timeline.addFilter(`fade=type=out:start_time=${transitionStart}:duration=${duration}:alpha=1`);
      case 'wipe':
        // Wipe transition (simplified - would need more complex filter)
        return timeline.addFilter(`xfade=transition=wipeleft:duration=${duration}:offset=${transitionStart}`);
      default:
        return timeline;
    }
  }

  /**
   * Smart trim that removes dead space or silence
   * 
   * @example
   * ```typescript
   * const trimmed = await VideoSplicer.smartTrim(timeline, {
   *   removeSlience: true,
   *   silenceThreshold: -40, // dB
   *   minimumDuration: 0.5 // seconds
   * });
   * ```
   */
  static async smartTrim(
    timeline: Timeline,
    options: {
      removeSilence?: boolean;
      silenceThreshold?: number;
      minimumDuration?: number;
      removeBlackFrames?: boolean;
      blackThreshold?: number;
    } = {}
  ): Promise<Timeline> {
    // This would require analyzing the video/audio
    // For now, return a placeholder implementation
    console.warn('Smart trim requires audio/video analysis - returning original timeline');
    return timeline;
  }

  /**
   * Create a highlight reel from marked moments
   * 
   * @example
   * ```typescript
   * const highlights = VideoSplicer.createHighlightReel(timeline, [
   *   { time: 10, duration: 3, priority: 'high' },
   *   { time: 25, duration: 5, priority: 'medium' },
   *   { time: 45, duration: 4, priority: 'high' }
   * ]);
   * ```
   */
  static createHighlightReel(
    timeline: Timeline,
    highlights: Array<{
      time: number;
      duration: number;
      priority?: 'high' | 'medium' | 'low';
      transition?: string;
    }>,
    options: {
      maxDuration?: number;
      sortByPriority?: boolean;
      sortByTime?: boolean;
    } = {}
  ): Timeline {
    const {
      maxDuration = Infinity,
      sortByPriority = true,
      sortByTime = false
    } = options;

    // Sort highlights based on options
    let sortedHighlights = [...highlights];
    if (sortByPriority) {
      const priorityMap = { high: 3, medium: 2, low: 1 };
      sortedHighlights.sort((a, b) => 
        (priorityMap[b.priority || 'medium'] - priorityMap[a.priority || 'medium']) ||
        (a.time - b.time)
      );
    } else if (sortByTime) {
      sortedHighlights.sort((a, b) => a.time - b.time);
    }

    // Create segments from highlights
    const segments: TimeSegment[] = [];
    let totalDuration = 0;

    for (const highlight of sortedHighlights) {
      if (totalDuration + highlight.duration > maxDuration) {
        // Would exceed max duration
        const remainingTime = maxDuration - totalDuration;
        if (remainingTime > 1) { // Only add if meaningful duration remains
          segments.push({
            startTime: highlight.time,
            endTime: highlight.time + remainingTime,
            transition: highlight.transition
          });
        }
        break;
      }

      segments.push({
        startTime: highlight.time,
        endTime: highlight.time + highlight.duration,
        transition: highlight.transition
      });
      
      totalDuration += highlight.duration;
    }

    // Extract and splice segments
    const timelineSegments = segments.map(segment => 
      VideoSplicer.extractSegment(timeline, segment.startTime, segment.endTime)
    );

    return VideoSplicer.concatenate(timelineSegments, {
      defaultTransition: 'fade',
      defaultTransitionDuration: 0.5
    });
  }
}

// Add methods to Timeline prototype
declare module './timeline.js' {
  interface Timeline {
    /**
     * Extract a segment from the timeline
     */
    extractSegment(startTime: number, endTime: number): Timeline;
    
    /**
     * Remove a segment from the timeline
     */
    removeSegment(startTime: number, endTime: number): Timeline;
    
    /**
     * Remove multiple segments
     */
    removeSegments(segments: TimeSegment[]): Timeline;
    
    /**
     * Get the duration of the timeline
     */
    getDuration(): number;
    
    /**
     * Set the start time of the timeline
     */
    setStartTime(time: number): Timeline;
  }
}

// Implement Timeline extensions
Timeline.prototype.extractSegment = function(startTime: number, endTime: number): Timeline {
  return VideoSplicer.extractSegment(this, startTime, endTime);
};

Timeline.prototype.removeSegment = function(startTime: number, endTime: number): Timeline {
  return VideoSplicer.removeSegment(this, startTime, endTime);
};

Timeline.prototype.removeSegments = function(segments: TimeSegment[]): Timeline {
  return VideoSplicer.removeSegments(this, segments);
};

Timeline.prototype.getDuration = function(): number {
  // Calculate duration from all layers
  let maxEndTime = 0;
  
  for (const layer of this.layers) {
    const startTime = layer.startTime || 0;
    const duration = layer.duration || 0;
    const endTime = startTime + duration;
    
    if (endTime > maxEndTime) {
      maxEndTime = endTime;
    }
  }
  
  return maxEndTime;
};

Timeline.prototype.setStartTime = function(time: number): Timeline {
  // Shift all layers by the time difference
  const currentStart = Math.min(...this.layers.map(l => l.startTime || 0));
  const shift = time - currentStart;
  
  const newLayers = this.layers.map(layer => ({
    ...layer,
    startTime: (layer.startTime || 0) + shift
  }));
  
  return new Timeline(newLayers, this.globalOptions);
};
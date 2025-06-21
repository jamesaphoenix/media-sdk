/**
 * Helper functions for creating Timeline instances
 */

import { Timeline } from '../timeline/timeline.js';
import type { VideoOptions, ImageOptions, AudioOptions } from '../types/index.js';

/**
 * Create a new timeline with a video
 */
export function video(path: string, options?: VideoOptions): Timeline {
  return new Timeline().addVideo(path, options);
}

/**
 * Create a new timeline with an image
 */
export function image(path: string, options?: ImageOptions): Timeline {
  return new Timeline().addImage(path, options);
}

/**
 * Create a new timeline with audio
 */
export function audio(path: string, options?: AudioOptions): Timeline {
  return new Timeline().addAudio(path, options);
}

/**
 * Create an empty timeline
 */
export function timeline(): Timeline {
  return new Timeline();
}

/**
 * Concatenate multiple videos
 */
export function concat(...videos: string[]): Timeline {
  const tl = new Timeline();
  videos.forEach((video, index) => {
    if (index === 0) {
      tl.addVideo(video);
    } else {
      // For concatenation, we'd need to implement proper concat in Timeline
      // For now, just add them sequentially
      tl.addVideo(video);
    }
  });
  return tl;
}

/**
 * Create a slideshow from images
 */
export function slideshow(images: string[], duration: number = 3): Timeline {
  const tl = new Timeline();
  images.forEach((image, index) => {
    tl.addImage(image, {
      duration,
      startTime: index * duration
    });
  });
  return tl;
}
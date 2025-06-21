import { Timeline } from '../timeline/timeline.js';
import type { VideoOptions, ImageOptions, AudioOptions } from '../types/index.js';

/**
 * Create a basic video timeline
 */
export function video(inputPath: string, options: VideoOptions = {}): Timeline {
  return new Timeline().addVideo(inputPath, options);
}

/**
 * Create a TikTok-optimized video (9:16 aspect ratio)
 */
export function tiktok(inputPath: string, options: VideoOptions = {}): Timeline {
  return video(inputPath, options)
    .setAspectRatio('9:16')
    .scale(1080, 1920)
    .crop({
      width: 1080,
      height: 1920,
      x: '(iw-1080)/2', // Center horizontally
      y: '(ih-1920)/2'  // Center vertically
    });
}

/**
 * Create a YouTube-optimized video (16:9 aspect ratio)
 */
export function youtube(inputPath: string, options: VideoOptions = {}): Timeline {
  return video(inputPath, options)
    .setAspectRatio('16:9')
    .scale(1920, 1080)
    .crop({
      width: 1920,
      height: 1080,
      x: '(iw-1920)/2', // Center horizontally
      y: '(ih-1080)/2'  // Center vertically
    });
}

/**
 * Create Instagram-optimized videos
 */
export function instagram(
  inputPath: string, 
  options: VideoOptions & { format?: 'reels' | 'feed' | 'story' } = {}
): Timeline {
  const { format = 'reels', ...videoOptions } = options;
  
  switch (format) {
    case 'reels':
    case 'story':
      // 9:16 aspect ratio for Reels and Stories
      return video(inputPath, videoOptions)
        .setAspectRatio('9:16')
        .scale(1080, 1920)
        .crop({
          width: 1080,
          height: 1920,
          x: '(iw-1080)/2',
          y: '(ih-1920)/2'
        });
        
    case 'feed':
      // 1:1 aspect ratio for feed posts
      return video(inputPath, videoOptions)
        .setAspectRatio('1:1')
        .scale(1080, 1080)
        .crop({
          width: 1080,
          height: 1080,
          x: '(iw-1080)/2',
          y: '(ih-1080)/2'
        });
        
    default:
      return video(inputPath, videoOptions);
  }
}

/**
 * Create Twitter-optimized video
 */
export function twitter(inputPath: string, options: VideoOptions = {}): Timeline {
  return video(inputPath, options)
    .setAspectRatio('16:9')
    .scale(1280, 720) // 720p for Twitter
    .crop({
      width: 1280,
      height: 720,
      x: '(iw-1280)/2',
      y: '(ih-720)/2'
    });
}

/**
 * Create LinkedIn-optimized video
 */
export function linkedin(inputPath: string, options: VideoOptions = {}): Timeline {
  return video(inputPath, options)
    .setAspectRatio('16:9')
    .scale(1920, 1080)
    .crop({
      width: 1920,
      height: 1080,
      x: '(iw-1920)/2',
      y: '(ih-1080)/2'
    });
}

/**
 * Create a square video (1:1 aspect ratio)
 */
export function square(inputPath: string, options: VideoOptions = {}): Timeline {
  return video(inputPath, options)
    .setAspectRatio('1:1')
    .scale(1080, 1080)
    .crop({
      width: 1080,
      height: 1080,
      x: '(iw-1080)/2',
      y: '(ih-1080)/2'
    });
}

/**
 * Create a portrait video (9:16 aspect ratio)
 */
export function portrait(inputPath: string, options: VideoOptions = {}): Timeline {
  return video(inputPath, options)
    .setAspectRatio('9:16')
    .scale(1080, 1920)
    .crop({
      width: 1080,
      height: 1920,
      x: '(iw-1080)/2',
      y: '(ih-1920)/2'
    });
}

/**
 * Create a landscape video (16:9 aspect ratio)
 */
export function landscape(inputPath: string, options: VideoOptions = {}): Timeline {
  return video(inputPath, options)
    .setAspectRatio('16:9')
    .scale(1920, 1080)
    .crop({
      width: 1920,
      height: 1080,
      x: '(iw-1920)/2',
      y: '(ih-1080)/2'
    });
}

/**
 * Concatenate multiple videos
 */
export function concat(videoPaths: string[]): Timeline {
  if (videoPaths.length === 0) {
    throw new Error('At least one video path is required');
  }

  let timeline = video(videoPaths[0]);
  
  for (let i = 1; i < videoPaths.length; i++) {
    const nextVideo = video(videoPaths[i]);
    timeline = timeline.concat(nextVideo);
  }
  
  return timeline;
}

/**
 * Create a video loop
 */
export function loop(inputPath: string, count: number): Timeline {
  if (count < 1) {
    throw new Error('Loop count must be at least 1');
  }

  let timeline = video(inputPath);
  
  for (let i = 1; i < count; i++) {
    timeline = timeline.concat(video(inputPath));
  }
  
  return timeline;
}

/**
 * Create an image timeline
 */
export function image(inputPath: string, options: ImageOptions = {}): Timeline {
  return new Timeline().addImage(inputPath, options);
}

/**
 * Create an audio timeline
 */
export function audio(inputPath: string, options: AudioOptions = {}): Timeline {
  return new Timeline().addAudio(inputPath, options);
}
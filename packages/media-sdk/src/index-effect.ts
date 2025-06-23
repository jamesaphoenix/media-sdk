/**
 * @fileoverview Main entry point for the Effect-based Media SDK
 * 
 * This file exports both the original Timeline API and the new Effect-based API,
 * allowing users to choose their preferred style while maintaining backwards compatibility.
 */

// ============================================================================
// Effect-based Timeline API
// ============================================================================

export {
  // Core Timeline class
  Timeline,
  
  // Error types
  TimelineError,
  VideoNotFoundError,
  AudioNotFoundError,
  ImageNotFoundError,
  RenderError,
  ValidationError,
  
  // Service interfaces
  FFmpegService,
  FileSystemService,
  ValidationService,
  type TimelineServices,
  type TimelineContext,
  
  // Service implementations
  FFmpegServiceLive,
  FileSystemServiceLive,
  ValidationServiceLive,
  DefaultTimelineServices,
  
  // Helper functions for LLM-friendly API
  createTimeline,
  tiktok,
  youtube,
  instagram,
  
  // Types
  type TimelineErrors,
  type VideoMetadata,
  type AudioMetadata,
  type ImageMetadata,
  type Platform,
  type PlatformValidation
} from './timeline/timeline-effect.js'

// ============================================================================
// Original Timeline API (for backwards compatibility)
// ============================================================================

export { Timeline as TimelineOriginal } from './timeline/timeline.js'

// ============================================================================
// Re-export all other SDK functionality
// ============================================================================

// Types (avoiding conflicts)
export type { 
  VideoOptions, 
  TextOptions, 
  ImageOptions, 
  AudioOptions, 
  CropOptions, 
  FilterOptions, 
  RenderOptions,
  Dimensions,
  TimeRange,
  TextStyle,
  CaptionStyle,
  ExecutionResult,
  TimelineLayer,
  FFmpegCommand,
  ProgressInfo
} from './types/index.js'

// Effects and transformations (avoiding conflicts)
export {
  fadeIn,
  fadeOut,
  crossfade,
  brightness,
  contrast,
  saturation,
  hue,
  gamma,
  blur,
  gaussianBlur,
  motionBlur,
  grayscale,
  sepia,
  invert,
  vignette,
  filmGrain,
  vintage,
  cinematic,
  scale,
  crop,
  rotate,
  flip,
  speed,
  reverse,
  chromakey,
  stabilize,
  denoise,
  wipe,
  volumeAdjust,
  audioFadeIn,
  audioFadeOut,
  socialMediaOptimized,
  dreamlike,
  noir
} from './effects/index.js'

// Caption systems
export * from './captions/captions.js'
export * from './captions/image-captions.js'

// Video utilities
export * from './video/index.js'

// Query API
export * from './query/index.js'

// Image processing
export * from './image/index.js'

// Slideshow builder (avoiding slide conflict)
export { slideshow } from './slideshow/index.js'

// Executor
export * from './executor/index.js'

// ============================================================================
// Convenience exports for common use cases
// ============================================================================

import { Timeline } from './timeline/timeline-effect.js'
import { Effect, pipe } from 'effect'

/**
 * Quick video creation helpers that hide Effect complexity
 */

export const quickTikTok = async (
  videoPath: string,
  caption: string,
  options?: {
    musicPath?: string
    watermarkPath?: string
  }
) => {
  const { createTimeline } = await import('./timeline/timeline-effect.js')
  const timeline = await createTimeline()
  
  let video = await timeline
    .addVideo(videoPath)
    .then((t: Timeline) => t.setAspectRatio('9:16'))
    .then((t: Timeline) => t.addText(caption, { 
      position: 'bottom',
      style: { fontSize: 48, color: '#ffffff', strokeWidth: 3 }
    }))
  
  if (options?.musicPath) {
    video = await video.addAudio(options.musicPath, { volume: 0.3 })
  }
  
  if (options?.watermarkPath) {
    video = await video.addWatermark(options.watermarkPath)
  }
  
  return video
}

export const quickYouTube = async (
  videoPath: string,
  title: string,
  options?: {
    thumbnail?: string
    endScreen?: string
  }
) => {
  const { createTimeline } = await import('./timeline/timeline-effect.js')
  const timeline = await createTimeline()
  
  let video = await timeline
    .addVideo(videoPath)
    .then((t: Timeline) => t.setAspectRatio('16:9'))
    .then((t: Timeline) => t.addText(title, {
      position: 'top',
      startTime: 0,
      duration: 5,
      style: { fontSize: 64, color: '#ffffff', backgroundColor: 'rgba(0,0,0,0.7)' }
    }))
  
  if (options?.endScreen) {
    const duration = video.getDuration()
    video = await video.addImage(options.endScreen, {
      startTime: duration - 10,
      duration: 10
    })
  }
  
  return video
}

export const quickInstagram = async (
  videoPath: string,
  caption: string,
  options?: {
    filterName?: string
    stickers?: Array<{ path: string; position: any }>
  }
) => {
  const { createTimeline } = await import('./timeline/timeline-effect.js')
  const timeline = await createTimeline()
  
  let video = await timeline
    .addVideo(videoPath)
    .then((t: Timeline) => t.setAspectRatio('1:1'))
    .then((t: Timeline) => t.addText(caption, {
      position: 'center',
      style: { 
        fontSize: 36, 
        color: '#ffffff',
        backgroundColor: 'rgba(0,0,0,0.5)',
        padding: 20 
      }
    }))
  
  if (options?.filterName) {
    video = await video.addFilter(options.filterName)
  }
  
  if (options?.stickers) {
    for (const sticker of options.stickers) {
      video = await video.addImage(sticker.path, {
        position: sticker.position,
        duration: 'full'
      })
    }
  }
  
  return video
}

// ============================================================================
// Advanced Effect Helpers
// ============================================================================

/**
 * Batch process videos with Effect
 */
export const batchProcessVideos = (
  videos: Array<{ input: string; output: string; transform: (t: Timeline) => Effect.Effect<Timeline, any, any> }>,
  options?: { concurrency?: number }
) => Effect.forEach(
  videos,
  ({ input, output, transform }) => Effect.gen(function* () {
    const timeline = yield* Timeline.empty()
    const withVideo = yield* timeline.addVideo(input)
    const transformed = yield* transform(withVideo)
    return yield* transformed.render(output)
  }),
  { concurrency: options?.concurrency || 3 }
)

/**
 * Create a video with automatic quality optimization
 */
export const createOptimizedVideo = (
  videoPath: string,
  platform: 'tiktok' | 'youtube' | 'instagram' | 'twitter'
) => Effect.gen(function* () {
  const timeline = yield* Timeline.empty()
  const withVideo = yield* timeline.addVideo(videoPath)
  
  // Validate for platform
  const validation = yield* withVideo.validateForPlatform(platform)
  
  // Apply optimizations based on platform
  let optimized = withVideo
  
  for (const suggestion of validation.suggestions) {
    if (suggestion.includes('setAspectRatio')) {
      const ratio = suggestion.match(/"([^"]+)"/)?.[1]
      if (ratio) {
        optimized = yield* optimized.setAspectRatio(ratio)
      }
    }
  }
  
  return optimized
})
import { Effect, Context, Layer, pipe, Option, Either, Schedule } from "effect"
import type {
  VideoOptions,
  TextOptions,
  ImageOptions,
  AudioOptions,
  CropOptions,
  FilterOptions,
  RenderOptions,
  TimelineLayer,
  FFmpegCommand,
  Position,
  ExecutionResult
} from '../types/index.js';
import { CaptionDurationCalculator, imageCaptionPresets } from '../captions/image-captions.js';

/**
 * @fileoverview Effect-based Timeline API for declarative video composition
 * 
 * This is the Effect-powered version of the Timeline API. It provides the same
 * fluent, immutable API but with Effect's powerful error handling, dependency
 * injection, and composition capabilities.
 * 
 * Key differences from the original Timeline:
 * - All operations return Effect types with explicit error handling
 * - Services (FFmpeg, FileSystem, etc.) are injected via Effect's Context
 * - Automatic resource management and cleanup
 * - Better testability through service abstraction
 * - Type-safe error handling with tagged errors
 * 
 * @example
 * ```typescript
 * // Basic usage (LLM-friendly API preserved)
 * const timeline = await Timeline.create()
 *   .addVideo('input.mp4')
 *   .addCaption('Hello World', { position: 'bottom' })
 *   .render('output.mp4')
 * 
 * // Advanced Effect usage
 * const program = Effect.gen(function* () {
 *   const timeline = yield* Timeline.empty()
 *   const withVideo = yield* timeline.addVideo('input.mp4')
 *   const withCaption = yield* withVideo.addCaption('Hello', { position: 'center' })
 *   return yield* withCaption.render('output.mp4')
 * })
 * 
 * // Run with custom services
 * const result = await Effect.runPromise(
 *   pipe(
 *     program,
 *     Effect.provide(CustomFFmpegService)
 *   )
 * )
 * ```
 */

// ============================================================================
// Error Types - Tagged for Better Handling
// ============================================================================

/**
 * Base error class for all Timeline errors
 * The _tag property enables Effect's catchTag for specific error handling
 */
export class TimelineError {
  readonly _tag = "TimelineError"
  constructor(readonly message: string, readonly cause?: unknown) {}
}

/**
 * Error when a video file is not found or invalid
 */
export class VideoNotFoundError {
  readonly _tag = "VideoNotFoundError"
  constructor(readonly path: string) {}
}

/**
 * Error when an audio file is not found or invalid
 */
export class AudioNotFoundError {
  readonly _tag = "AudioNotFoundError"
  constructor(readonly path: string) {}
}

/**
 * Error when an image file is not found or invalid
 */
export class ImageNotFoundError {
  readonly _tag = "ImageNotFoundError"
  constructor(readonly path: string) {}
}

/**
 * Error during FFmpeg rendering
 */
export class RenderError {
  readonly _tag = "RenderError"
  constructor(readonly command: string, readonly stderr: string) {}
}

/**
 * Error when validating timeline or media
 */
export class ValidationError {
  readonly _tag = "ValidationError"
  constructor(readonly message: string, readonly field?: string) {}
}

/**
 * Union type of all possible Timeline errors
 */
export type TimelineErrors = 
  | TimelineError 
  | VideoNotFoundError 
  | AudioNotFoundError 
  | ImageNotFoundError 
  | RenderError 
  | ValidationError

// ============================================================================
// Service Definitions - Dependency Injection
// ============================================================================

/**
 * FFmpeg service interface for executing video commands
 * This abstraction allows for easy testing and swapping implementations
 */
export interface FFmpegService {
  readonly execute: (command: string) => Effect.Effect<string, RenderError>
  readonly probe: (file: string) => Effect.Effect<VideoMetadata, RenderError>
  readonly validateCommand: (command: string) => Effect.Effect<void, ValidationError>
}

/**
 * Video metadata returned by FFmpeg probe
 */
export interface VideoMetadata {
  duration: number
  width: number
  height: number
  fps: number
  codec: string
  bitrate?: number
}

/**
 * Service tag for FFmpeg - used for dependency injection
 */
export const FFmpegService = Context.GenericTag<FFmpegService>("@services/FFmpegService")

/**
 * File system service for checking file existence and permissions
 */
export interface FileSystemService {
  readonly exists: (path: string) => Effect.Effect<boolean, never>
  readonly isReadable: (path: string) => Effect.Effect<boolean, never>
  readonly readFile: (path: string) => Effect.Effect<string, TimelineError>
  readonly writeFile: (path: string, content: string) => Effect.Effect<void, TimelineError>
}

/**
 * Service tag for FileSystem
 */
export const FileSystemService = Context.GenericTag<FileSystemService>("@services/FileSystemService")

/**
 * Validation service for checking media compatibility and quality
 */
export interface ValidationService {
  readonly validateVideo: (path: string) => Effect.Effect<VideoMetadata, ValidationError>
  readonly validateAudio: (path: string) => Effect.Effect<AudioMetadata, ValidationError>
  readonly validateImage: (path: string) => Effect.Effect<ImageMetadata, ValidationError>
  readonly validatePlatformRequirements: (
    timeline: Timeline,
    platform: Platform
  ) => Effect.Effect<PlatformValidation, ValidationError>
}

export interface AudioMetadata {
  duration: number
  channels: number
  sampleRate: number
  bitrate: number
}

export interface ImageMetadata {
  width: number
  height: number
  format: string
}

export interface PlatformValidation {
  isValid: boolean
  warnings: string[]
  errors: string[]
  suggestions: string[]
}

export type Platform = 'tiktok' | 'instagram' | 'youtube' | 'twitter' | 'linkedin'

/**
 * Service tag for Validation
 */
export const ValidationService = Context.GenericTag<ValidationService>("@services/ValidationService")

/**
 * Combined services needed by Timeline
 */
export interface TimelineServices {
  readonly FFmpegService: FFmpegService
  readonly FileSystemService: FileSystemService
  readonly ValidationService: ValidationService
}

/**
 * Service context for Timeline operations
 */
export type TimelineContext = 
  | FFmpegService
  | FileSystemService 
  | ValidationService

// ============================================================================
// Timeline Class - Effect-Powered Video Composition
// ============================================================================

/**
 * Effect-based Timeline for building video compositions
 * 
 * This class maintains the same immutable, fluent API as the original Timeline
 * but all operations now return Effect types for better error handling and
 * composition.
 * 
 * @example
 * ```typescript
 * // Simple usage with automatic service provisioning
 * const video = await Timeline.create()
 *   .addVideo('input.mp4')
 *   .addText('Subscribe!', { position: 'bottom' })
 *   .render('output.mp4')
 * 
 * // Advanced Effect composition
 * const program = Effect.gen(function* () {
 *   const timeline = yield* Timeline.empty()
 *   
 *   // Add video with validation
 *   const withVideo = yield* timeline.addVideo('input.mp4')
 *   
 *   // Add multiple captions
 *   const withCaptions = yield* Effect.forEach(
 *     captions,
 *     (caption) => withVideo.addCaption(caption.text, caption.options),
 *     { concurrency: 'inherit' }
 *   )
 *   
 *   // Render with retry on failure
 *   return yield* pipe(
 *     withCaptions[0].render('output.mp4'),
 *     Effect.retry(Schedule.exponential('1 second'))
 *   )
 * })
 * ```
 */
export class Timeline {
  /**
   * Creates a new Timeline instance
   * 
   * @param layers - Internal layer storage (immutable)
   * @param globalOptions - Global timeline options
   * @private Use Timeline.empty() or Timeline.create() instead
   */
  private constructor(
    private readonly layers: ReadonlyArray<TimelineLayer> = [],
    private readonly globalOptions: Readonly<Record<string, any>> = {},
    private lastVideoStream?: string,
    private lastAudioStream?: string
  ) {}

  /**
   * Create an empty Timeline
   * 
   * @returns Effect that yields an empty Timeline
   * 
   * @example
   * ```typescript
   * const timeline = yield* Timeline.empty()
   * ```
   */
  static empty(): Effect.Effect<Timeline, never, never> {
    return Effect.succeed(new Timeline())
  }

  /**
   * Create a Timeline (convenience method for LLM-friendly API)
   * 
   * @returns Timeline instance for chaining
   * 
   * @example
   * ```typescript
   * const timeline = Timeline.create()
   *   .addVideo('input.mp4')
   *   .addCaption('Hello')
   * ```
   */
  static create(): Timeline {
    return new Timeline()
  }

  /**
   * Add a video layer to the timeline
   * 
   * This method validates the video file exists and is readable before adding
   * it to the timeline. The validation happens through injected services.
   * 
   * @param path - Path to the video file
   * @param options - Video-specific options
   * @returns Effect that yields a new Timeline with the video added
   * 
   * @example
   * ```typescript
   * // In Effect context
   * const timeline = yield* Timeline.empty()
   * const withVideo = yield* timeline.addVideo('input.mp4', {
   *   startTime: 5,
   *   duration: 10,
   *   volume: 0.8
   * })
   * 
   * // Error handling
   * const result = yield* pipe(
   *   timeline.addVideo('maybe-missing.mp4'),
   *   Effect.catchTag('VideoNotFoundError', (error) => 
   *     Effect.fail(new TimelineError(`Video not found: ${error.path}`))
   *   )
   * )
   * ```
   */
  addVideo(
    path: string, 
    options: VideoOptions = {}
  ): Effect.Effect<Timeline, VideoNotFoundError | ValidationError, FileSystemService | ValidationService> {
    const self = this
    return Effect.gen(function* () {
      // Validate path
      if (!path || path.trim() === '') {
        return yield* Effect.fail(new ValidationError("Video path cannot be empty"))
      }
      
      // Validate file exists
      const fs = yield* FileSystemService
      const exists = yield* fs.exists(path)
      
      if (!exists) {
        return yield* Effect.fail(new VideoNotFoundError(path))
      }

      // Validate video metadata
      const validator = yield* ValidationService
      const metadata = yield* validator.validateVideo(path)

      // Create new layer
      const layer: TimelineLayer = {
        type: 'video',
        source: path,
        options: {
          ...options,
          // Store metadata for optimization
          _metadata: metadata
        },
        startTime: options.position || 0,
        duration: options.duration || metadata.duration
      }

      // Return new immutable Timeline
      return new Timeline(
        [...self.layers, layer],
        self.globalOptions,
        self.lastVideoStream,
        self.lastAudioStream
      )
    })
  }

  /**
   * Add an audio layer to the timeline
   * 
   * @param path - Path to the audio file
   * @param options - Audio-specific options
   * @returns Effect that yields a new Timeline with audio added
   * 
   * @example
   * ```typescript
   * const withAudio = yield* timeline.addAudio('background.mp3', {
   *   volume: 0.3,
   *   fadeIn: 2,
   *   fadeOut: 2,
   *   loop: true
   * })
   * ```
   */
  addAudio(
    path: string,
    options: AudioOptions = {}
  ): Effect.Effect<Timeline, AudioNotFoundError | ValidationError, FileSystemService | ValidationService> {
    const self = this
    return Effect.gen(function* () {
      // Validate path
      if (!path || path.trim() === '') {
        return yield* Effect.fail(new ValidationError("Audio path cannot be empty"))
      }
      
      // Validate file exists
      const fs = yield* FileSystemService
      const exists = yield* fs.exists(path)
      
      if (!exists) {
        return yield* Effect.fail(new AudioNotFoundError(path))
      }

      // Validate audio metadata
      const validator = yield* ValidationService
      const metadata = yield* validator.validateAudio(path)

      const layer: TimelineLayer = {
        type: 'audio',
        source: path,
        options: {
          ...options,
          _metadata: metadata
        },
        startTime: options.startTime || 0,
        duration: options.duration || metadata.duration
      }

      return new Timeline(
        [...self.layers, layer],
        self.globalOptions,
        self.lastVideoStream,
        self.lastAudioStream
      )
    })
  }

  /**
   * Add a text overlay to the timeline
   * 
   * Text overlays don't require file validation, making them simpler Effect-wise
   * 
   * @param text - Text content to display
   * @param options - Text styling and positioning options
   * @returns Effect that yields a new Timeline with text added
   * 
   * @example
   * ```typescript
   * const withText = yield* timeline.addText('Subscribe!', {
   *   position: 'bottom',
   *   style: {
   *     fontSize: 48,
   *     color: '#ff0000',
   *     strokeWidth: 2
   *   },
   *   startTime: 5,
   *   duration: 3
   * })
   * ```
   */
  addText(
    text: string,
    options: TextOptions = {}
  ): Effect.Effect<Timeline, ValidationError, never> {
    const self = this
    return Effect.gen(function* () {
      // Validate text content - handle empty strings strictly
      if (text === undefined || text === null || text === '') {
        return yield* Effect.fail(new ValidationError("Text cannot be empty"))
      }
      
      // Also check for whitespace-only strings
      if (text.trim().length === 0) {
        return yield* Effect.fail(new ValidationError("Text cannot be empty or whitespace only"))
      }

      const layer: TimelineLayer = {
        type: 'text',
        content: text,
        options,
        startTime: options.startTime || 0,
        duration: options.duration || 5
      }

      return new Timeline(
        [...self.layers, layer],
        self.globalOptions,
        self.lastVideoStream,
        self.lastAudioStream
      )
    })
  }

  /**
   * Add an image overlay to the timeline
   * 
   * @param path - Path to the image file
   * @param options - Image positioning and display options
   * @returns Effect that yields a new Timeline with image added
   */
  addImage(
    path: string,
    options: ImageOptions = {}
  ): Effect.Effect<Timeline, ImageNotFoundError | ValidationError, FileSystemService | ValidationService> {
    const self = this
    return Effect.gen(function* () {
      // Validate path
      if (!path || path.trim() === '') {
        return yield* Effect.fail(new ValidationError("Image path cannot be empty"))
      }
      
      // Validate file exists
      const fs = yield* FileSystemService
      const exists = yield* fs.exists(path)
      
      if (!exists) {
        return yield* Effect.fail(new ImageNotFoundError(path))
      }

      // Validate image metadata
      const validator = yield* ValidationService
      const metadata = yield* validator.validateImage(path)

      const layer: TimelineLayer = {
        type: 'image',
        source: path,
        options: {
          ...options,
          _metadata: metadata
        },
        startTime: options.startTime || 0,
        duration: options.duration === 'full' ? undefined : (options.duration || 5)
      }

      return new Timeline(
        [...self.layers, layer],
        self.globalOptions,
        self.lastVideoStream,
        self.lastAudioStream
      )
    })
  }

  /**
   * Add a watermark (convenience method for logo overlays)
   * 
   * @param path - Path to the watermark image
   * @param options - Watermark positioning options
   * @returns Effect that yields a new Timeline with watermark added
   */
  addWatermark(
    path: string,
    options: Omit<ImageOptions, 'duration'> & { margin?: number } = {}
  ): Effect.Effect<Timeline, ImageNotFoundError | ValidationError, FileSystemService | ValidationService> {
    const { margin = 20, ...imageOptions } = options
    
    // Convert position strings to coordinates
    let position: Position = { x: 0, y: 0 }
    if (typeof imageOptions.position === 'string') {
      switch (imageOptions.position) {
        case 'top-right':
          position = { x: `main_w-overlay_w-${margin}`, y: margin }
          break
        case 'bottom-right':
          position = { x: `main_w-overlay_w-${margin}`, y: `main_h-overlay_h-${margin}` }
          break
        case 'bottom-left':
          position = { x: margin, y: `main_h-overlay_h-${margin}` }
          break
        case 'top-left':
        default:
          position = { x: margin, y: margin }
          break
      }
    } else if (imageOptions.position) {
      position = imageOptions.position
    }

    return this.addImage(path, {
      ...imageOptions,
      position,
      duration: 'full'
    })
  }

  /**
   * Set aspect ratio with validation
   * 
   * @param ratio - Aspect ratio string (e.g., "16:9", "9:16", "1:1")
   * @returns Effect that yields a new Timeline with aspect ratio set
   */
  setAspectRatio(ratio: string): Effect.Effect<Timeline, ValidationError, never> {
    const self = this
    return Effect.gen(function* () {
      // Validate aspect ratio format - handle malformed ratios strictly
      if (!ratio || typeof ratio !== 'string') {
        return yield* Effect.fail(new ValidationError("Aspect ratio must be a string"))
      }
      
      const ratioPattern = /^(\d+):(\d+)$/
      const match = ratio.match(ratioPattern)
      
      if (!match) {
        return yield* Effect.fail(
          new ValidationError(`Invalid aspect ratio format: ${ratio}. Expected format: "16:9", "9:16", etc.`)
        )
      }
      
      const [, widthStr, heightStr] = match
      const width = parseInt(widthStr)
      const height = parseInt(heightStr)
      
      if (width <= 0 || height <= 0 || width > 10000 || height > 10000) {
        return yield* Effect.fail(new ValidationError(`Invalid aspect ratio: ${ratio}. Values must be positive and reasonable`))
      }

      const newOptions = {
        ...self.globalOptions,
        aspectRatio: ratio
      }

      return new Timeline(
        self.layers,
        newOptions,
        self.lastVideoStream,
        self.lastAudioStream
      )
    })
  }

  /**
   * Scale/resize the video
   * 
   * @param width - Target width in pixels
   * @param height - Target height in pixels
   * @returns Effect that yields a new Timeline with scaling applied
   */
  scale(width: number, height: number): Effect.Effect<Timeline, ValidationError, never> {
    const self = this
    return Effect.gen(function* () {
      if (width <= 0 || height <= 0) {
        return yield* Effect.fail(
          new ValidationError("Width and height must be positive numbers")
        )
      }

      const newOptions = {
        ...self.globalOptions,
        scale: { width, height }
      }

      return new Timeline(
        self.layers,
        newOptions,
        self.lastVideoStream,
        self.lastAudioStream
      )
    })
  }

  /**
   * Trim the timeline to a specific time range
   * 
   * @param start - Start time in seconds
   * @param end - End time in seconds (optional)
   * @returns Effect that yields a new Timeline with trim applied
   */
  trim(start: number, end?: number): Effect.Effect<Timeline, ValidationError, never> {
    const self = this
    return Effect.gen(function* () {
      if (start < 0) {
        return yield* Effect.fail(new ValidationError("Start time cannot be negative"))
      }
      
      if (end !== undefined && end <= start) {
        return yield* Effect.fail(new ValidationError("End time must be greater than start time"))
      }

      const newOptions = {
        ...self.globalOptions,
        trim: { start, end }
      }

      return new Timeline(
        self.layers,
        newOptions,
        self.lastVideoStream,
        self.lastAudioStream
      )
    })
  }

  /**
   * Crop the video
   * 
   * @param options - Crop dimensions and position
   * @returns Effect that yields a new Timeline with crop applied
   */
  crop(options: CropOptions): Effect.Effect<Timeline, ValidationError, never> {
    const self = this
    return Effect.gen(function* () {
      const { x = 0, y = 0, width, height } = options
      
      if (x < 0 || y < 0) {
        return yield* Effect.fail(new ValidationError("Crop position cannot be negative"))
      }
      
      if (width <= 0 || height <= 0) {
        return yield* Effect.fail(new ValidationError("Crop dimensions must be positive"))
      }

      const newOptions = {
        ...self.globalOptions,
        crop: options
      }

      return new Timeline(
        self.layers,
        newOptions,
        self.lastVideoStream,
        self.lastAudioStream
      )
    })
  }

  /**
   * Set frame rate
   * 
   * @param fps - Frames per second
   * @returns Effect that yields a new Timeline with frame rate set
   */
  setFrameRate(fps: number): Effect.Effect<Timeline, ValidationError, never> {
    const self = this
    return Effect.gen(function* () {
      if (fps <= 0 || fps > 120) {
        return yield* Effect.fail(
          new ValidationError("Frame rate must be between 1 and 120")
        )
      }

      const newOptions = {
        ...self.globalOptions,
        frameRate: fps
      }

      return new Timeline(
        self.layers,
        newOptions,
        self.lastVideoStream,
        self.lastAudioStream
      )
    })
  }

  /**
   * Set duration of the timeline
   * 
   * @param duration - Duration in seconds
   * @returns Effect that yields a new Timeline with duration set
   */
  setDuration(duration: number): Effect.Effect<Timeline, ValidationError, never> {
    const self = this
    return Effect.gen(function* () {
      if (duration <= 0) {
        return yield* Effect.fail(new ValidationError("Duration must be positive"))
      }

      const newOptions = {
        ...self.globalOptions,
        duration
      }

      return new Timeline(
        self.layers,
        newOptions,
        self.lastVideoStream,
        self.lastAudioStream
      )
    })
  }

  /**
   * Add a filter to the timeline
   * 
   * @param name - Filter name
   * @param options - Filter-specific options
   * @returns Effect that yields a new Timeline with filter added
   */
  addFilter(
    name: string,
    options: FilterOptions = {}
  ): Effect.Effect<Timeline, ValidationError, never> {
    const self = this
    return Effect.gen(function* () {
      const validFilters = [
        'blur', 'brightness', 'contrast', 'saturation', 
        'zoompan', 'colorchannelmixer', 'vignette'
      ]
      
      if (!validFilters.includes(name)) {
        return yield* Effect.fail(
          new ValidationError(`Unknown filter: ${name}`)
        )
      }

      const layer: TimelineLayer = {
        type: 'filter',
        content: name,
        options,
        startTime: 0
      }

      return new Timeline(
        [...self.layers, layer],
        self.globalOptions,
        self.lastVideoStream,
        self.lastAudioStream
      )
    })
  }

  /**
   * Functional composition - apply a transformation function
   * 
   * This method enables functional composition patterns with Effect
   * 
   * @param fn - Transformation function that takes and returns a Timeline Effect
   * @returns Effect that yields the transformed Timeline
   * 
   * @example
   * ```typescript
   * const addWatermarkAndText = (watermarkPath: string, text: string) =>
   *   (timeline: Timeline) => Effect.gen(function* () {
   *     const withWatermark = yield* timeline.addWatermark(watermarkPath)
   *     return yield* withWatermark.addText(text, { position: 'bottom' })
   *   })
   * 
   * const result = yield* timeline.pipe(addWatermarkAndText('logo.png', 'Subscribe!'))
   * ```
   */
  pipe<E, R>(
    fn: (timeline: Timeline) => Effect.Effect<Timeline, E, R>
  ): Effect.Effect<Timeline, E, R> {
    return fn(this)
  }

  /**
   * Concatenate another timeline
   * 
   * @param other - Timeline to concatenate
   * @returns Effect that yields a new Timeline with both timelines concatenated
   */
  concat(other: Timeline): Effect.Effect<Timeline, never, never> {
    const currentDuration = this.getDuration()
    const offsetLayers = other.layers.map(layer => ({
      ...layer,
      startTime: layer.startTime + currentDuration
    }))

    return Effect.succeed(
      new Timeline(
        [...this.layers, ...offsetLayers],
        this.globalOptions,
        this.lastVideoStream,
        this.lastAudioStream
      )
    )
  }

  /**
   * Get estimated duration of the timeline
   * 
   * @returns Duration in seconds
   */
  getDuration(): number {
    if (this.layers.length === 0) return 0

    return Math.max(
      ...this.layers.map(layer => {
        const endTime = layer.startTime + (layer.duration || 0)
        return endTime
      })
    )
  }

  /**
   * Generate FFmpeg command
   * 
   * @param outputPath - Output file path
   * @param options - Render options
   * @returns Effect that yields the FFmpeg command string
   */
  getCommand(
    outputPath: string,
    options: RenderOptions = {}
  ): Effect.Effect<string, ValidationError, ValidationService> {
    const self = this
    return Effect.gen(function* () {
      // Validate timeline has content
      if (self.layers.length === 0) {
        return yield* Effect.fail(new ValidationError("Timeline has no content"))
      }

      // Validate output path
      if (!outputPath || outputPath.trim() === '') {
        return yield* Effect.fail(new ValidationError("Output path cannot be empty"))
      }

      // Build command (reuse logic from original Timeline)
      const command = self.buildFFmpegCommand(outputPath, options)
      return self.commandToString(command)
    })
  }

  /**
   * Render the timeline to a file
   * 
   * This is the main method for executing the timeline and producing output
   * 
   * @param outputPath - Output file path
   * @param options - Render options
   * @returns Effect that yields the output path on success
   * 
   * @example
   * ```typescript
   * // Simple render
   * const output = yield* timeline.render('output.mp4')
   * 
   * // Render with retry on failure
   * const output = yield* pipe(
   *   timeline.render('output.mp4'),
   *   Effect.retry(Schedule.exponential('1 second'))
   * )
   * 
   * // Render with progress tracking
   * const output = yield* pipe(
   *   timeline.render('output.mp4'),
   *   Effect.tap((progress) => Effect.log(`Progress: ${progress}%`))
   * )
   * ```
   */
  render(
    outputPath: string,
    options: RenderOptions = {}
  ): Effect.Effect<string, TimelineErrors, TimelineContext> {
    const self = this
    return Effect.gen(function* () {
      // Get command
      const command = yield* self.getCommand(outputPath, options)
      
      if (options.execute === false) {
        return command
      }

      // Validate command before execution
      const ffmpeg = yield* FFmpegService
      yield* ffmpeg.validateCommand(command)

      // Execute render
      const result = yield* ffmpeg.execute(command)
      
      // Return output path on success
      return outputPath
    })
  }

  /**
   * Render with automatic retry and error recovery
   * 
   * @param outputPath - Output file path
   * @param options - Render options with retry configuration
   * @returns Effect that yields the output path with retry logic
   */
  renderWithRetry(
    outputPath: string,
    options: RenderOptions & { 
      maxRetries?: number
      retryDelay?: string 
    } = {}
  ): Effect.Effect<string, TimelineErrors, TimelineContext> {
    const { maxRetries = 3, retryDelay = '1 second', ...renderOptions } = options

    return pipe(
      this.render(outputPath, renderOptions),
      Effect.retry(
        Schedule.exponential(retryDelay).pipe(
          Schedule.jittered,
          Schedule.compose(Schedule.recurs(maxRetries))
        )
      ),
      Effect.tapError((error) => 
        Effect.log(`Render failed after ${maxRetries} retries`, { error })
      )
    )
  }

  /**
   * Validate timeline against platform requirements
   * 
   * @param platform - Target platform
   * @returns Effect that yields validation results
   */
  validateForPlatform(
    platform: Platform
  ): Effect.Effect<PlatformValidation, ValidationError, ValidationService> {
    const self = this
    return Effect.gen(function* () {
      const validator = yield* ValidationService
      return yield* validator.validatePlatformRequirements(self, platform)
    })
  }

  /**
   * Add captions with Effect-based validation
   * 
   * This method preserves the LLM-friendly caption API while adding
   * Effect's error handling and validation
   * 
   * @param options - Caption configuration
   * @returns Effect that yields a new Timeline with captions added
   */
  addCaptions(options: {
    captions: Array<{
      text: string
      startTime?: number
      endTime?: number
      duration?: number
      position?: {
        x: number | string
        y: number | string
        anchor?: string
      }
      style?: Record<string, any>
    }>
    globalStyle?: Record<string, any>
    preset?: 'instagram' | 'tiktok' | 'youtube' | 'linkedin' | 'pinterest'
    transition?: 'fade' | 'slide' | 'scale' | 'bounce' | 'none'
    transitionDuration?: number
    startDelay?: number
    overlap?: number
    wordsPerMinute?: number
  }): Effect.Effect<Timeline, ValidationError, never> {
    const self = this
    return Effect.gen(function* () {
      // Validate captions
      if (!options.captions || options.captions.length === 0) {
        return yield* Effect.fail(new ValidationError("At least one caption is required"))
      }

      // Validate each caption
      for (const caption of options.captions) {
        if (!caption.text || caption.text.trim().length === 0) {
          return yield* Effect.fail(new ValidationError("Caption text cannot be empty"))
        }
      }

      // The actual implementation reuses the original logic
      // but wrapped in Effect for error handling
      const {
        captions,
        globalStyle = {},
        preset,
        transition = 'fade',
        transitionDuration = 0.5,
        startDelay = 0,
        overlap = 0.1,
        wordsPerMinute = 200
      } = options

      // Apply preset styling if specified
      let baseStyle = globalStyle
      if (preset && imageCaptionPresets[preset]) {
        baseStyle = { ...imageCaptionPresets[preset].style, ...globalStyle }
      }

      // Calculate timing for captions without explicit timing
      const timingCaptions = captions.map(caption => ({
        text: caption.text,
        duration: caption.duration || (caption.endTime && caption.startTime ? 
          caption.endTime - caption.startTime : undefined)
      }))

      const autoTimings = CaptionDurationCalculator.calculateStaggeredTiming(
        timingCaptions,
        { startDelay, overlap, wordsPerMinute }
      )

      // Create timeline layers for each caption
      const captionLayers: TimelineLayer[] = captions.map((caption, index) => {
        const startTime = caption.startTime ?? autoTimings[index].startTime
        const endTime = caption.endTime ?? autoTimings[index].endTime
        
        // Merge styles
        const mergedStyle = {
          fontSize: 32,
          color: '#ffffff',
          strokeColor: '#000000',
          strokeWidth: 2,
          ...baseStyle,
          ...caption.style
        }

        return {
          type: 'text',
          content: caption.text,
          options: {
            position: caption.position || 'center',
            startTime,
            duration: endTime - startTime,
            style: mergedStyle,
            transition: transition !== 'none' ? {
              type: transition,
              duration: transitionDuration
            } : undefined
          },
          startTime,
          duration: endTime - startTime
        }
      })

      return new Timeline(
        [...self.layers, ...captionLayers],
        self.globalOptions,
        self.lastVideoStream,
        self.lastAudioStream
      )
    })
  }

  /**
   * Serialize timeline to JSON
   * 
   * @returns Timeline data as JSON object
   */
  toJSON(): object {
    return {
      layers: this.layers,
      globalOptions: this.globalOptions
    }
  }

  /**
   * Create timeline from JSON
   * 
   * @param data - JSON data
   * @returns Effect that yields a Timeline
   */
  static fromJSON(data: any): Effect.Effect<Timeline, ValidationError, never> {
    return Effect.gen(function* () {
      if (!data || typeof data !== 'object') {
        return yield* Effect.fail(new ValidationError("Invalid timeline data"))
      }

      return new Timeline(
        data.layers || [],
        data.globalOptions || {}
      )
    })
  }

  // =========================================================================
  // Private Methods - Reused from Original Timeline
  // =========================================================================

  private buildFFmpegCommand(outputPath: string, options: RenderOptions): FFmpegCommand {
    const inputs: string[] = []
    const filters: string[] = []
    const outputs: string[] = [outputPath]
    const ffmpegOptions: string[] = ['-y'] // Overwrite output
    
    // Collect inputs from layers
    let inputIndex = 0
    const inputMap = new Map<string, number>()
    
    for (const layer of this.layers) {
      if (layer.type === 'video' || layer.type === 'audio') {
        if (!inputMap.has(layer.source || '')) {
          inputs.push(layer.source || '')
          inputMap.set(layer.source || '', inputIndex++)
        }
      } else if (layer.type === 'image') {
        inputs.push(layer.source || '')
        inputMap.set(layer.source || '', inputIndex++)
      }
    }
    
    // Add filter complex if needed
    if (this.layers.some(l => l.type === 'text' || l.type === 'image') || 
        this.globalOptions.scale || this.globalOptions.crop) {
      const filterParts: string[] = []
      
      // Add video filters
      if (this.globalOptions.scale) {
        filterParts.push(`scale=${this.globalOptions.scale.width}:${this.globalOptions.scale.height}`)
      }
      
      if (this.globalOptions.crop) {
        const crop = this.globalOptions.crop
        filterParts.push(`crop=${crop.width}:${crop.height}:${crop.x}:${crop.y}`)
      }
      
      // Add text overlays with proper timing
      for (const layer of this.layers.filter(l => l.type === 'text')) {
        const text = layer.content || ''
        const opts = layer.options as TextOptions || {}
        const fontSize = opts.style?.fontSize || 24
        const color = opts.style?.color || 'white'
        const x = opts.position && typeof opts.position === 'object' ? opts.position.x : '(w-text_w)/2'
        const y = opts.position && typeof opts.position === 'object' ? opts.position.y : '(h-text_h)/2'
        
        let drawtext = `drawtext=text='${text.replace(/'/g, "\\'")}'`
        drawtext += `:fontsize=${fontSize}`
        drawtext += `:fontcolor=${color}`
        drawtext += `:x=${x}:y=${y}`
        
        // Add timing if specified
        if (opts.startTime !== undefined && opts.duration !== undefined) {
          const endTime = opts.startTime + opts.duration
          drawtext += `:enable='between(t,${opts.startTime},${endTime})'`
        }
        
        filterParts.push(drawtext)
      }
      
      if (filterParts.length > 0) {
        filters.push(filterParts.join(','))
      }
    }
    
    // Add render options
    if (options.quality) {
      const crf = options.quality === 'high' ? 18 : options.quality === 'low' ? 28 : 23
      ffmpegOptions.push('-crf', crf.toString())
    }
    
    if (options.codec) {
      ffmpegOptions.push('-c:v', options.codec)
    }
    
    if (options.bitrate) {
      ffmpegOptions.push('-b:v', options.bitrate)
    }

    return { inputs, filters, outputs, options: ffmpegOptions }
  }

  private commandToString(command: FFmpegCommand): string {
    const parts: string[] = ['ffmpeg']
    
    // Add inputs
    command.inputs.forEach(input => {
      parts.push('-i', `"${input}"`)
    })
    
    // Add filter complex if present
    if (command.filters.length > 0) {
      parts.push('-filter_complex', `"${command.filters.join(';')}"`)
    }
    
    // Add options
    parts.push(...command.options)
    
    // Add output
    parts.push(`"${command.outputs[0]}"`)

    return parts.join(' ')
  }

  // ... (other private methods from original Timeline)
}

// ============================================================================
// Service Implementations - Default Services
// ============================================================================

/**
 * Default FFmpeg service implementation using child_process
 */
export const FFmpegServiceLive = Layer.succeed(
  FFmpegService,
  FFmpegService.of({
    execute: (command) => 
      Effect.tryPromise({
        try: async () => {
          // In real implementation, execute FFmpeg command
          // For now, just simulate
          console.log(`Executing: ${command}`)
          return "success"
        },
        catch: (error) => new RenderError(command, String(error))
      }),
    
    probe: (file) =>
      Effect.tryPromise({
        try: async () => {
          // In real implementation, probe video with ffprobe
          return {
            duration: 30,
            width: 1920,
            height: 1080,
            fps: 30,
            codec: 'h264'
          }
        },
        catch: (error) => new RenderError(`ffprobe ${file}`, String(error))
      }),
    
    validateCommand: (command) =>
      Effect.gen(function* () {
        if (!command.includes('ffmpeg')) {
          return yield* Effect.fail(new ValidationError("Invalid FFmpeg command"))
        }
      })
  })
)

/**
 * Default file system service implementation
 */
export const FileSystemServiceLive = Layer.succeed(
  FileSystemService,
  FileSystemService.of({
    exists: (path) => 
      Effect.tryPromise({
        try: async () => {
          // In real implementation, check file existence
          return true
        },
        catch: () => false
      }),
    
    isReadable: (path) =>
      Effect.tryPromise({
        try: async () => {
          // In real implementation, check file permissions
          return true
        },
        catch: () => false
      }),
    
    readFile: (path) =>
      Effect.tryPromise({
        try: async () => {
          // In real implementation, read file
          return "file content"
        },
        catch: (error) => new TimelineError(`Failed to read file: ${path}`, error)
      }),
    
    writeFile: (path, content) =>
      Effect.tryPromise({
        try: async () => {
          // In real implementation, write file
          console.log(`Writing to ${path}`)
        },
        catch: (error) => new TimelineError(`Failed to write file: ${path}`, error)
      })
  })
)

/**
 * Default validation service implementation
 */
export const ValidationServiceLive = Layer.succeed(
  ValidationService,
  ValidationService.of({
    validateVideo: (path) =>
      Effect.succeed({
        duration: 30,
        width: 1920,
        height: 1080,
        fps: 30,
        codec: 'h264'
      }),
    
    validateAudio: (path) =>
      Effect.succeed({
        duration: 30,
        channels: 2,
        sampleRate: 44100,
        bitrate: 128000
      }),
    
    validateImage: (path) =>
      Effect.succeed({
        width: 1920,
        height: 1080,
        format: 'png'
      }),
    
    validatePlatformRequirements: (timeline, platform) =>
      Effect.gen(function* () {
        const warnings: string[] = []
        const errors: string[] = []
        const suggestions: string[] = []
        
        // Platform-specific validation
        switch (platform) {
          case 'tiktok':
            if (timeline.globalOptions.aspectRatio !== '9:16') {
              warnings.push('TikTok videos should use 9:16 aspect ratio')
              suggestions.push('Use timeline.setAspectRatio("9:16")')
            }
            break
          case 'youtube':
            if (timeline.globalOptions.aspectRatio !== '16:9') {
              warnings.push('YouTube videos should use 16:9 aspect ratio')
              suggestions.push('Use timeline.setAspectRatio("16:9")')
            }
            break
        }
        
        return {
          isValid: errors.length === 0,
          warnings,
          errors,
          suggestions
        }
      })
  })
)

/**
 * Default services for Timeline operations
 */
export const DefaultTimelineServices = Layer.mergeAll(
  FFmpegServiceLive,
  FileSystemServiceLive,
  ValidationServiceLive
)

// ============================================================================
// Helper Functions for LLM-Friendly API
// ============================================================================

/**
 * Create a Timeline with automatic service provisioning
 * This helper maintains the simple API for LLMs while using Effect internally
 * 
 * @example
 * ```typescript
 * const video = await createTimeline()
 *   .addVideo('input.mp4')
 *   .addCaption('Hello World')
 *   .render('output.mp4')
 * ```
 */
export const createTimeline = () => {
  // Recursive proxy wrapper function
  const wrapTimeline = (timeline: Timeline): any => {
    return new Proxy(timeline, {
      get(target, prop) {
        const value = target[prop as keyof Timeline]
        
        // Special handling for methods that should return raw Effects for testing
        const effectMethods = ['validateForPlatform', 'getCommand']
        
        // If it's a method, wrap it
        if (typeof value === 'function') {
          return (...args: any[]) => {
            const result = value.apply(target, args)
            
            // For Effect methods that tests need to manipulate, return the raw Effect
            if (effectMethods.includes(prop as string) && Effect.isEffect(result)) {
              return result
            }
            
            // If it returns an Effect, run it with default services
            if (Effect.isEffect(result)) {
              return Effect.runPromise(
                pipe(
                  result,
                  Effect.provide(DefaultTimelineServices)
                )
              ).then(newTimeline => {
                // CRITICAL: Recursively wrap returned Timeline instances
                if (newTimeline instanceof Timeline) {
                  return wrapTimeline(newTimeline)
                }
                return newTimeline
              }).catch(error => {
                // Properly propagate Effect failures as Promise rejections
                if (error instanceof ValidationError) {
                  throw new Error(error.message)
                }
                if (error instanceof VideoNotFoundError) {
                  throw new Error(`Video not found: ${error.path}`)
                }
                if (error instanceof AudioNotFoundError) {
                  throw new Error(`Audio not found: ${error.path}`)
                }
                if (error instanceof ImageNotFoundError) {
                  throw new Error(`Image not found: ${error.path}`)
                }
                if (error instanceof RenderError) {
                  throw new Error(`Render error: ${error.stderr}`)
                }
                throw error
              })
            }
            
            // Also wrap non-Effect Timeline returns (for methods like concat)
            if (result instanceof Timeline) {
              return wrapTimeline(result)
            }
            
            return result
          }
        }
        
        return value
      }
    })
  }
  
  // Start with a wrapped empty timeline
  return wrapTimeline(new Timeline())
}

/**
 * Platform-specific timeline creators for LLM convenience
 */
export const tiktok = (videoPath: string) => 
  createTimeline()
    .then(t => t.addVideo(videoPath))
    .then(t => t.setAspectRatio('9:16'))

export const youtube = (videoPath: string) =>
  createTimeline()
    .then(t => t.addVideo(videoPath))
    .then(t => t.setAspectRatio('16:9'))

export const instagram = (videoPath: string) =>
  createTimeline()
    .then(t => t.addVideo(videoPath))
    .then(t => t.setAspectRatio('1:1'))
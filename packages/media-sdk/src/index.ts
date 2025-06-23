// Core Timeline API
export { Timeline } from './timeline/index.js';

// Type-safe Query API (Tanstack-style)
export {
  VideoQuery,
  createVideoQuery,
  createTikTokQuery,
  createYouTubeQuery,
  createInstagramQuery,
  compose as queryCompose
} from './query/video-query.js';

// Video helper functions
export {
  video,
  image,
  audio,
  tiktok,
  youtube,
  instagram,
  twitter,
  linkedin,
  square,
  portrait,
  landscape,
  concat,
  loop
} from './video/index.js';

// Effects and filters
export {
  compose,
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
  noir,
  // Pan and zoom effects
  addPanZoom,
  addKenBurns,
  zoomIn,
  zoomOut,
  pan,
  multiPanZoom,
  suggestPanZoom,
  panZoomEffect,
  kenBurnsEffect,
  zoomInEffect,
  zoomOutEffect,
  panEffect
} from './effects/index.js';

// Captions and subtitles
export {
  addCaptions,
  addWordByWordCaptions,
  addStyledWordCaptions,
  addKaraokeCaption,
  addMultiLanguageCaptions,
  generateCaptions,
  addTypewriterText,
  addAnimatedText,
  addDynamicCaptions,
  addPlatformCaptions,
  captionPresets
} from './captions/index.js';

// Image generation with captions
export {
  generateImageWithCaption,
  generateImageBatch,
  createSlideshow,
  createInstagramPost,
  createTikTokThumbnail,
  createMeme,
  createQuoteCard
} from './timeline/image-generator.js';

export type {
  ImageGeneratorOptions,
  ImageWithCaption,
  BatchImageResult
} from './timeline/image-generator.js';

// Enhanced image processing with download support
export {
  ImageProcessor,
  ImageBatchProcessor,
  ImageCollection,
  createImageCollection,
  processImageWithCaption,
  processImageBatch
} from './image/image-processor.js';

export type {
  ProcessedImage,
  ImageProcessorOptions
} from './image/image-processor.js';

// Slideshow builder for content type integration
export {
  SlideshowBuilder,
  createSlideshowBuilder,
  slideshowToVideo,
  slideshowToImages
} from './slideshow/slideshow-builder.js';

export type {
  SlideshowCaption,
  MediaRef,
  SlideshowSlideData,
  SlideshowContent,
  ProcessedSlide,
  SlideshowBuilderOptions
} from './slideshow/slideshow-builder.js';

// Slideshow functionality
export {
  slide,
  titleSlide,
  bulletSlide,
  slideshow,
  kenBurnsSlide,
  gridSlide,
  chartSlide,
  slideTemplate,
  SlideTemplate
} from './slideshow/index.js';

// FFmpeg executor
export {
  FFmpegExecutor,
  BatchExecutor,
  QueuedExecutor,
  executeWithRetry,
  FFmpegError
} from './executor/index.js';

// Types
export type {
  Position,
  Dimensions,
  TimeRange,
  VideoOptions,
  TextStyle,
  TextOptions,
  ImageOptions,
  AudioOptions,
  CropOptions,
  FilterOptions,
  RenderOptions,
  ProgressInfo,
  ExecutionResult,
  TimelineLayer,
  FFmpegCommand
} from './types/index.js';

export type {
  PanZoomOptions,
  KenBurnsEffectOptions
} from './effects/index.js';

export type {
  Word,
  CaptionOptions,
  AdvancedCaptionOptions,
  KaraokeOptions,
  SlideCaption
} from './captions/index.js';

export type {
  Slide,
  SlideshowOptions,
  TitleSlideOptions,
  BulletSlideOptions,
  KenBurnsOptions,
  GridSlideOptions,
  ChartSlideOptions
} from './slideshow/index.js';

export type {
  ExecutorOptions,
  ExecuteOptions
} from './executor/index.js';

export type {
  Platform,
  Position as TypeSafePosition,
  TypeSafeTextStyle,
  TypeSafeTextOptions,
  TypeSafeImageOptions,
  VideoQueryOptions,
  VideoQueryResult
} from './query/video-query.js';

// Vision integration service
export * from './services/vision-integration.js';

// Timelapse functionality
export {
  TimelapseBuilder,
  createTimelapse,
  quickTimelapse,
  instagramTimelapse,
  cinematicTimelapse
} from './timelapse/timelapse-builder.js';

export type {
  TimelapseImage,
  TimelapseOptions
} from './timelapse/timelapse-builder.js';

// Frame exporter
export {
  FrameExporter,
  createFrameExporter,
  extractFrames,
  extractKeyFrames
} from './timelapse/frame-exporter.js';

export type {
  FrameExportOptions,
  ExportedFrame,
  KeyFrameOptions
} from './timelapse/frame-exporter.js';

// Advanced transition engine
export {
  TransitionEngine
} from './transitions/transition-engine.js';

export type {
  TransitionType,
  EasingFunction,
  TransitionDirection,
  TransitionPoint
} from './transitions/transition-engine.js';

// Multi-caption engine
export {
  MultiCaptionEngine
} from './captions/multi-caption-engine.js';

export type {
  CaptionTrack,
  CaptionEntry,
  CaptionStyle,
  CaptionAnimation,
  SyncOptions,
  CaptionFormat
} from './captions/multi-caption-engine.js';

// Multi-resolution renderer
export {
  MultiResolutionRenderer
} from './rendering/multi-resolution-renderer.js';

export type {
  Resolution,
  QualityPreset,
  PlatformOptimization,
  BatchRenderConfig,
  BatchRenderProgress,
  RenderResult,
  RenderError
} from './rendering/multi-resolution-renderer.js';

// SRT subtitle support
export {
  SRTHandler,
  createSRTHandler,
  SRTWatcher
} from './captions/srt-handler.js';

export type {
  SRTEntry,
  SRTStyle,
  SRTPosition,
  SRTValidationResult
} from './captions/srt-handler.js';

// Image source handling (remote URLs and local files)
export {
  ImageSourceHandler,
  createTimelineWithRemoteSupport
} from './utils/image-source-handler.js';

export type {
  ImageSourceOptions,
  ProcessedImage as ProcessedImageSource
} from './utils/image-source-handler.js';

// Advanced Image + Caption System
export {
  ImageCaptionSystem
} from './effects/image-caption-system.js';

export type {
  ImageCaptionOptions,
  ImageCaptionTemplate,
  CaptionPosition as ImageCaptionPosition,
  CaptionStyle as ImageCaptionStyle,
  ImageEffects,
  SlideshowOptions as ImageSlideshowOptions
} from './effects/image-caption-system.js';

// Video Splicing & Trimming
export {
  VideoSplicer
} from './timeline/video-splicer.js';

export type {
  TimeSegment,
  SpliceOptions,
  TrimOptions
} from './timeline/video-splicer.js';

// Picture-in-Picture
export {
  PictureInPicture
} from './effects/picture-in-picture.js';

export type {
  PiPOptions,
  MultiPiPOptions
} from './effects/picture-in-picture.js';

// Audio Ducking
export {
  AudioDucking
} from './audio/audio-ducking.js';

export type {
  DuckingOptions,
  AutoDuckingAnalysis
} from './audio/audio-ducking.js';
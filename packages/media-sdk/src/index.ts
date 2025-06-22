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
  TransitionOptions,
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
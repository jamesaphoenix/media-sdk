// Core Timeline API
export { Timeline } from './timeline/index.js';

// Core types
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
  FFmpegCommand,
  CaptionStyle
} from './types/index.js';

// Captions and subtitles
export {
  MultiCaptionEngine
} from './captions/multi-caption-engine.js';

export type {
  CaptionTrack,
  CaptionEntry,
  CaptionAnimation,
  SyncOptions,
  CaptionFormat
} from './captions/multi-caption-engine.js';

// SRT handler
export {
  SRTHandler
} from './captions/srt-handler.js';

export type {
  SRTEntry,
  SRTStyle,
  SRTPosition,
  SRTValidationResult
} from './captions/srt-handler.js';

// FFmpeg executor
export {
  FFmpegExecutor,
  BatchExecutor,
  QueuedExecutor,
  executeWithRetry,
  FFmpegError
} from './executor/index.js';

export type {
  ExecutorOptions,
  ExecuteOptions
} from './executor/index.js';
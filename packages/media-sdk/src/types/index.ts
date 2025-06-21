// Core types for the media SDK

export interface Position {
  x: number | string;
  y: number | string;
  anchor?: 'top-left' | 'top-center' | 'top-right' | 
           'center-left' | 'center' | 'center-right' | 
           'bottom-left' | 'bottom-center' | 'bottom-right';
}

export interface Dimensions {
  width: number;
  height: number;
}

export interface TimeRange {
  start: number;
  duration?: number;
  end?: number;
}

export interface VideoOptions {
  start?: number;
  duration?: number;
  position?: number;
}

export interface TextStyle {
  fontSize?: number;
  fontFamily?: string;
  fontWeight?: string;
  fontStyle?: string;
  color?: string;
  backgroundColor?: string;
  padding?: number;
  borderRadius?: number;
  textAlign?: 'left' | 'center' | 'right';
  verticalAlign?: 'top' | 'middle' | 'bottom';
  letterSpacing?: number;
  lineHeight?: number;
  strokeColor?: string;
  strokeWidth?: number;
  shadowColor?: string;
  shadowBlur?: number;
  shadowOffsetX?: number;
  shadowOffsetY?: number;
  background?: {
    color?: string;
    padding?: number;
    borderRadius?: number;
    opacity?: number;
  };
}

export interface TextOptions {
  position?: Position | string;
  style?: TextStyle;
  duration?: number;
  startTime?: number;
}

export interface ImageOptions {
  position?: Position | string;
  scale?: number;
  opacity?: number;
  duration?: number | 'full';
  startTime?: number;
}

export interface AudioOptions {
  volume?: number;
  fadeIn?: number;
  fadeOut?: number;
  startTime?: number;
  duration?: number;
  loop?: boolean;
  trimStart?: number;
  trimEnd?: number;
  delay?: number;
  pitch?: number;
  tempo?: number;
  lowpass?: number;
  highpass?: number;
  echo?: { delay: number; decay: number };
  reverb?: { room: number; damping: number };
}

export interface CropOptions {
  x?: number | string;
  y?: number | string;
  width: number;
  height: number;
}

export interface FilterOptions {
  [key: string]: any;
}

export interface RenderOptions {
  quality?: 'low' | 'medium' | 'high' | 'ultra';
  format?: 'mp4' | 'webm' | 'mov' | 'avi';
  codec?: 'h264' | 'h265' | 'vp9' | 'av1';
  bitrate?: string;
  audioBitrate?: string;
  execute?: boolean;
  onProgress?: (progress: ProgressInfo) => void;
  hardwareAcceleration?: 'auto' | 'cuda' | 'vaapi' | 'qsv' | 'none';
  preset?: 'ultrafast' | 'superfast' | 'veryfast' | 'faster' | 'fast' | 'medium' | 'slow' | 'slower' | 'veryslow';
}

export interface ProgressInfo {
  percent: number;
  time: string;
  speed: number;
  size: string;
  bitrate: string;
  fps: number;
}

export interface ExecutionResult {
  success: boolean;
  output: string;
  error?: string;
  duration: number;
  size?: number;
  command: string;
}

// Timeline internal types
export interface TimelineLayer {
  type: 'video' | 'audio' | 'text' | 'image' | 'filter';
  source?: string;
  content?: string;
  options: any;
  startTime: number;
  duration?: number;
}

export interface FFmpegCommand {
  inputs: string[];
  filters: string[];
  outputs: string[];
  options: string[];
}
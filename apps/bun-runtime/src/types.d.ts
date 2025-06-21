/**
 * Type declarations for Bun runtime environment
 */

/// <reference types="bun-types" />

declare global {
  interface ProcessEnv {
    NODE_ENV?: 'development' | 'test' | 'production' | 'staging';
    GEMINI_API_KEY?: string;
    CASSETTE_MODE?: 'record' | 'replay' | 'auto';
    TEST_MODE?: 'benchmark' | 'regression';
    VISION_QUALITY_THRESHOLD?: string;
    VISION_DEEP_ANALYSIS?: string;
    VISION_PLATFORM_VALIDATION?: string;
    PERFORMANCE_BENCHMARKS?: string;
    MAX_RENDER_TIME_MS?: string;
    MAX_MEMORY_USAGE_MB?: string;
    MAX_FILE_SIZE_MB?: string;
    LOG_LEVEL?: 'silent' | 'minimal' | 'normal' | 'verbose' | 'debug';
    VERBOSE_LOGGING?: string;
    CI?: string;
  }

  namespace NodeJS {
    interface ProcessEnv extends ProcessEnv {}
  }
}

// Bun-specific type extensions
declare module "bun" {
  interface SpawnOptions {
    stdout?: "pipe" | "inherit" | null;
    stderr?: "pipe" | "inherit" | null;
    stdin?: "pipe" | "inherit" | null;
    cwd?: string;
    env?: Record<string, string>;
  }

  interface Subprocess {
    stdout: ReadableStream<Uint8Array> | null;
    stderr: ReadableStream<Uint8Array> | null;
    stdin: WritableStream<Uint8Array> | null;
    pid: number;
    exited: Promise<number>;
    kill(signal?: number | string): void;
  }

  function spawn(command: string[], options?: SpawnOptions): Subprocess;
}

// FFmpeg types
export interface FFmpegMetadata {
  width: number;
  height: number;
  duration: number;
  bitrate: number;
  fileSize: number;
  videoCodec: string;
  audioCodec?: string;
  frameRate: number;
  pixelFormat: string;
  colorSpace?: string;
  audioSampleRate?: number;
  audioBitrate?: number;
}

export interface FFprobeResult {
  success: boolean;
  error?: string;
  metadata?: FFmpegMetadata;
}

// Vision analysis types
export interface VisionFrame {
  inlineData: {
    data: string;
    mimeType: string;
  };
}

export interface GeminiResponse {
  candidates: Array<{
    content: {
      parts: Array<{
        text: string;
      }>;
    };
  }>;
}

// Test data types
export interface SampleFile {
  id: string;
  name: string;
  type: 'video' | 'image' | 'audio';
  path: string;
  size: number;
  created: Date;
  valid: boolean;
}

export interface TestEnvironment {
  name: string;
  description: string;
  parallel: boolean;
  maxConcurrency: number;
  timeout: number;
  quality: 'low' | 'medium' | 'high' | 'ultra';
}

// CLI types
export interface CLIArgs {
  _command?: string;
  [key: string]: any;
}

export interface CLICommand {
  name: string;
  description: string;
  handler: (args: CLIArgs) => Promise<void>;
  options: CLIOption[];
}

export interface CLIOption {
  name: string;
  alias?: string;
  description: string;
  type: 'string' | 'boolean' | 'number';
  default?: any;
  required?: boolean;
}

// Advanced test runner types
export interface TestScenario {
  id: string;
  name: string;
  category: 'stability' | 'performance' | 'quality' | 'platform' | 'regression';
  priority: 'critical' | 'high' | 'medium' | 'low';
  platform: 'tiktok' | 'youtube' | 'instagram' | 'twitter' | 'linkedin';
  inputVideo: string;
  expected: {
    minQuality: number;
    textContent?: string[];
    duration?: number;
    resolution?: { width: number; height: number };
  };
  config: {
    timeout: number;
    retries: number;
    captureFrames: boolean;
    customValidation?: (result: any) => boolean;
  };
  testFunction: () => Promise<any>;
}

export interface TestResult {
  scenario: TestScenario;
  passed: boolean;
  executionTime: number;
  visionResult?: any;
  error?: {
    type: 'timeout' | 'validation' | 'execution' | 'system';
    message: string;
    stack?: string;
    context?: Record<string, any>;
  };
  performance: {
    memoryUsage: number;
    cpuTime: number;
    renderTime: number;
    fileSize: number;
  };
  quality: {
    score: number;
    visualQuality: string;
    textDetected: string[];
    issues: string[];
  };
  regression?: {
    previousScore?: number;
    scoreChange?: number;
    isRegression: boolean;
  };
}

export {};
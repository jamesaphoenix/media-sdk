/**
 * @fileoverview Comprehensive Codec Configuration System
 * 
 * Provides advanced codec management for video and audio streams with:
 * - Hardware acceleration support
 * - Codec compatibility checking
 * - Preset configurations for different use cases
 * - Automatic fallback selection
 * - Platform-specific optimizations
 */

export interface VideoCodecOptions {
  preset?: 'ultrafast' | 'superfast' | 'veryfast' | 'faster' | 'fast' | 'medium' | 'slow' | 'slower' | 'veryslow' | 'placebo';
  crf?: number; // Constant Rate Factor (0-51, lower = better quality)
  profile?: string; // e.g., 'baseline', 'main', 'high', 'high10', 'high422', 'high444'
  level?: string; // e.g., '3.0', '4.0', '4.1', '5.0', '5.1'
  pixelFormat?: string; // e.g., 'yuv420p', 'yuv422p', 'yuv444p'
  keyframeInterval?: number; // GOP size
  bFrames?: number; // Number of B-frames
  refFrames?: number; // Number of reference frames
  tune?: 'film' | 'animation' | 'grain' | 'stillimage' | 'psnr' | 'ssim' | 'fastdecode' | 'zerolatency';
  hardwareAcceleration?: 'none' | 'auto' | 'vaapi' | 'vdpau' | 'videotoolbox' | 'nvenc' | 'qsv' | 'amf';
  extraOptions?: Record<string, string>;
}

export interface AudioCodecOptions {
  bitrate?: string; // e.g., '128k', '192k', '320k'
  sampleRate?: number; // e.g., 44100, 48000, 96000
  channels?: number; // 1 (mono), 2 (stereo), 6 (5.1), etc.
  profile?: string; // AAC profiles: 'aac_low', 'aac_he', 'aac_he_v2'
  compressionLevel?: number; // For FLAC (0-12)
  vbr?: boolean; // Variable bitrate
  quality?: number; // For some codecs like libopus (0-10)
  extraOptions?: Record<string, string>;
}

export interface CodecConfiguration {
  video?: {
    codec: string;
    options?: VideoCodecOptions;
  };
  audio?: {
    codec: string;
    options?: AudioCodecOptions;
  };
}

/**
 * Predefined codec presets for common use cases
 */
export const CodecPresets = {
  // High quality for archival
  archival: {
    video: {
      codec: 'libx264',
      options: {
        preset: 'slow',
        crf: 18,
        profile: 'high',
        level: '5.1',
        pixelFormat: 'yuv420p',
        tune: 'film'
      }
    },
    audio: {
      codec: 'flac',
      options: {
        compressionLevel: 8
      }
    }
  },

  // Streaming optimized
  streaming: {
    video: {
      codec: 'libx264',
      options: {
        preset: 'veryfast',
        crf: 23,
        profile: 'main',
        level: '4.0',
        pixelFormat: 'yuv420p',
        keyframeInterval: 48,
        tune: 'zerolatency'
      }
    },
    audio: {
      codec: 'aac',
      options: {
        bitrate: '128k',
        sampleRate: 44100,
        channels: 2,
        profile: 'aac_low'
      }
    }
  },

  // Mobile optimized
  mobile: {
    video: {
      codec: 'libx264',
      options: {
        preset: 'faster',
        crf: 28,
        profile: 'baseline',
        level: '3.1',
        pixelFormat: 'yuv420p',
        refFrames: 1
      }
    },
    audio: {
      codec: 'aac',
      options: {
        bitrate: '96k',
        sampleRate: 44100,
        channels: 2,
        profile: 'aac_he'
      }
    }
  },

  // HDR support
  hdr: {
    video: {
      codec: 'libx265',
      options: {
        preset: 'medium',
        crf: 21,
        profile: 'main10',
        pixelFormat: 'yuv420p10le',
        extraOptions: {
          'color_primaries': 'bt2020',
          'color_trc': 'smpte2084',
          'colorspace': 'bt2020nc'
        }
      }
    },
    audio: {
      codec: 'libopus',
      options: {
        bitrate: '160k',
        sampleRate: 48000,
        channels: 2,
        vbr: true
      }
    }
  },

  // Social media platforms
  youtube: {
    video: {
      codec: 'libx264',
      options: {
        preset: 'medium',
        crf: 23,
        profile: 'high',
        level: '4.2',
        pixelFormat: 'yuv420p',
        keyframeInterval: 60,
        bFrames: 2
      }
    },
    audio: {
      codec: 'aac',
      options: {
        bitrate: '192k',
        sampleRate: 48000,
        channels: 2
      }
    }
  },

  instagram: {
    video: {
      codec: 'libx264',
      options: {
        preset: 'fast',
        crf: 23,
        profile: 'main',
        level: '4.0',
        pixelFormat: 'yuv420p',
        keyframeInterval: 30
      }
    },
    audio: {
      codec: 'aac',
      options: {
        bitrate: '128k',
        sampleRate: 44100,
        channels: 2
      }
    }
  },

  tiktok: {
    video: {
      codec: 'libx264',
      options: {
        preset: 'fast',
        crf: 25,
        profile: 'main',
        level: '4.0',
        pixelFormat: 'yuv420p',
        keyframeInterval: 30
      }
    },
    audio: {
      codec: 'aac',
      options: {
        bitrate: '128k',
        sampleRate: 44100,
        channels: 2
      }
    }
  }
} as const;

/**
 * Hardware acceleration configurations
 */
export const HardwareAccelerationProfiles = {
  nvidia: {
    encoder: 'h264_nvenc',
    decoder: 'h264_cuvid',
    options: {
      preset: 'p4', // balanced
      rc: 'vbr',
      cq: 23,
      'b:v': '0',
      maxrate: '4M',
      bufsize: '8M'
    }
  },
  
  intel: {
    encoder: 'h264_qsv',
    decoder: 'h264_qsv',
    options: {
      preset: 'medium',
      'global_quality': 23,
      look_ahead: 1
    }
  },
  
  amd: {
    encoder: 'h264_amf',
    decoder: 'h264_amf',
    options: {
      usage: 'transcoding',
      quality: 'balanced',
      rc: 'vbr_latency'
    }
  },
  
  apple: {
    encoder: 'h264_videotoolbox',
    decoder: 'h264_videotoolbox',
    options: {
      profile: 'high',
      level: '4.2',
      allow_sw: 1
    }
  }
} as const;

/**
 * Codec compatibility matrix
 */
export const CodecCompatibility = {
  containers: {
    mp4: ['h264', 'h265', 'aac', 'mp3', 'ac3'],
    mkv: ['h264', 'h265', 'vp8', 'vp9', 'av1', 'aac', 'opus', 'vorbis', 'flac'],
    webm: ['vp8', 'vp9', 'av1', 'opus', 'vorbis'],
    mov: ['h264', 'h265', 'prores', 'aac', 'pcm'],
    avi: ['h264', 'mpeg4', 'mp3', 'ac3', 'pcm']
  },
  
  browsers: {
    chrome: ['h264', 'vp8', 'vp9', 'av1', 'aac', 'opus', 'vorbis'],
    firefox: ['h264', 'vp8', 'vp9', 'av1', 'aac', 'opus', 'vorbis'],
    safari: ['h264', 'h265', 'aac'],
    edge: ['h264', 'h265', 'vp8', 'vp9', 'av1', 'aac', 'opus']
  },
  
  platforms: {
    ios: ['h264', 'h265', 'aac'],
    android: ['h264', 'vp8', 'vp9', 'aac', 'opus'],
    windows: ['h264', 'h265', 'vp8', 'vp9', 'av1', 'aac', 'mp3', 'opus'],
    macos: ['h264', 'h265', 'vp8', 'vp9', 'aac', 'opus']
  }
} as const;

/**
 * Manages codec configuration and selection
 */
export class CodecManager {
  private config: CodecConfiguration = {};
  private hardwareAcceleration: 'none' | 'auto' | string = 'none';

  /**
   * Set video codec with options
   */
  setVideoCodec(codec: string, options?: VideoCodecOptions): this {
    this.config.video = { codec, options };
    return this;
  }

  /**
   * Set audio codec with options
   */
  setAudioCodec(codec: string, options?: AudioCodecOptions): this {
    this.config.audio = { codec, options };
    return this;
  }

  /**
   * Apply a preset configuration
   */
  usePreset(preset: keyof typeof CodecPresets): this {
    const presetConfig = CodecPresets[preset];
    this.config = { ...presetConfig };
    return this;
  }

  /**
   * Enable hardware acceleration
   */
  setHardwareAcceleration(type: 'auto' | 'nvidia' | 'intel' | 'amd' | 'apple' | 'none'): this {
    this.hardwareAcceleration = type;
    
    if (type !== 'none' && type !== 'auto') {
      const hwProfile = HardwareAccelerationProfiles[type];
      if (hwProfile) {
        // Initialize video config if it doesn't exist
        if (!this.config.video) {
          this.config.video = { codec: '', options: {} };
        }
        
        this.config.video.codec = hwProfile.encoder;
        this.config.video.options = {
          ...this.config.video.options,
          ...hwProfile.options
        };
      }
    }
    
    return this;
  }

  /**
   * Check codec compatibility
   */
  checkCompatibility(container: string, platform?: string): {
    compatible: boolean;
    warnings: string[];
    alternatives: string[];
  } {
    const warnings: string[] = [];
    const alternatives: string[] = [];
    let compatible = true;

    const supportedCodecs = CodecCompatibility.containers[container as keyof typeof CodecCompatibility.containers] || [];
    
    if (this.config.video) {
      // Map codec names to standard names for compatibility checking
      const videoCodecName = this.config.video.codec.replace('lib', '').replace('x264', 'h264').replace('x265', 'h265');
      if (!supportedCodecs.includes(videoCodecName)) {
        compatible = false;
        warnings.push(`Video codec ${this.config.video.codec} not supported in ${container} container`);
        alternatives.push(...supportedCodecs.filter(c => ['h264', 'h265', 'vp9'].includes(c)));
      }
    }

    if (this.config.audio) {
      if (!supportedCodecs.includes(this.config.audio.codec)) {
        compatible = false;
        warnings.push(`Audio codec ${this.config.audio.codec} not supported in ${container} container`);
        alternatives.push(...supportedCodecs.filter(c => ['aac', 'opus', 'mp3'].includes(c)));
      }
    }

    if (platform) {
      const platformCodecs = CodecCompatibility.platforms[platform as keyof typeof CodecCompatibility.platforms] || [];
      if (this.config.video && !platformCodecs.includes(this.config.video.codec.replace('lib', ''))) {
        warnings.push(`Video codec ${this.config.video.codec} may not be supported on ${platform}`);
      }
    }

    return { compatible, warnings, alternatives: [...new Set(alternatives)] };
  }

  /**
   * Get hardware acceleration arguments (should be placed before inputs)
   */
  getHardwareAccelArgs(): string[] {
    const args: string[] = [];
    
    if (this.hardwareAcceleration === 'auto') {
      args.push('-hwaccel', 'auto');
    } else if (this.hardwareAcceleration !== 'none') {
      const hwType = this.hardwareAcceleration;
      args.push('-hwaccel', hwType);
    }
    
    return args;
  }

  /**
   * Generate FFmpeg codec arguments
   */
  getFFmpegArgs(): string[] {
    const args: string[] = [];

    // Video codec
    if (this.config.video) {
      args.push('-c:v', this.config.video.codec);
      
      const opts = this.config.video.options;
      if (opts) {
        if (opts.preset) args.push('-preset', opts.preset);
        if (opts.crf !== undefined && opts.crf !== null) args.push('-crf', opts.crf.toString());
        if (opts.profile) args.push('-profile:v', opts.profile);
        if (opts.level) args.push('-level', opts.level);
        if (opts.pixelFormat) args.push('-pix_fmt', opts.pixelFormat);
        if (opts.keyframeInterval) args.push('-g', opts.keyframeInterval.toString());
        if (opts.bFrames !== undefined) args.push('-bf', opts.bFrames.toString());
        if (opts.refFrames !== undefined) args.push('-refs', opts.refFrames.toString());
        if (opts.tune) args.push('-tune', opts.tune);
        
        // Extra options
        if (opts.extraOptions) {
          Object.entries(opts.extraOptions).forEach(([key, value]) => {
            args.push(`-${key}`, value);
          });
        }
      }
    }

    // Audio codec
    if (this.config.audio) {
      args.push('-c:a', this.config.audio.codec);
      
      const opts = this.config.audio.options;
      if (opts) {
        if (opts.bitrate) args.push('-b:a', opts.bitrate);
        if (opts.sampleRate) args.push('-ar', opts.sampleRate.toString());
        if (opts.channels) args.push('-ac', opts.channels.toString());
        if (opts.profile) args.push('-profile:a', opts.profile);
        if (opts.compressionLevel !== undefined) args.push('-compression_level', opts.compressionLevel.toString());
        if (opts.quality !== undefined) args.push('-q:a', opts.quality.toString());
        
        // VBR for applicable codecs
        if (opts.vbr && this.config.audio.codec === 'libopus') {
          args.push('-vbr', 'on');
        }
        
        // Extra options
        if (opts.extraOptions) {
          Object.entries(opts.extraOptions).forEach(([key, value]) => {
            args.push(`-${key}`, value);
          });
        }
      }
    }

    return args;
  }

  /**
   * Get recommended settings for file size target
   */
  static getSettingsForFileSize(
    duration: number,
    targetSizeMB: number,
    hasAudio: boolean = true
  ): { videoBitrate: string; audioBitrate: string; crf?: number } {
    const targetSizeKb = targetSizeMB * 8 * 1024; // Convert MB to kb
    const audioBitrateKb = hasAudio ? 128 : 0; // Default audio bitrate
    const videoBitrateKb = (targetSizeKb / duration) - audioBitrateKb;
    
    // Ensure minimum quality
    const minVideoBitrate = 500;
    const actualVideoBitrate = Math.max(videoBitrateKb, minVideoBitrate);
    
    // Suggest CRF based on bitrate
    let crf: number;
    if (actualVideoBitrate > 5000) crf = 18;
    else if (actualVideoBitrate > 2500) crf = 23;
    else if (actualVideoBitrate > 1000) crf = 28;
    else crf = 32;
    
    return {
      videoBitrate: `${Math.round(actualVideoBitrate)}k`,
      audioBitrate: hasAudio ? `${audioBitrateKb}k` : '0',
      crf
    };
  }

  /**
   * Auto-detect best codec based on requirements
   */
  static autoSelectCodec(requirements: {
    container: string;
    quality: 'low' | 'medium' | 'high' | 'highest';
    compatibility: 'maximum' | 'modern' | 'cutting-edge';
    fileSize?: 'smallest' | 'balanced' | 'quality';
    hardware?: boolean;
  }): CodecConfiguration {
    const { container, quality, compatibility, fileSize, hardware } = requirements;
    
    let videoCodec = 'libx264'; // Safe default
    let audioCodec = 'aac'; // Safe default
    let videoOptions: VideoCodecOptions = {};
    let audioOptions: AudioCodecOptions = {};
    
    // Video codec selection
    if (compatibility === 'maximum') {
      videoCodec = 'libx264';
      videoOptions.profile = 'baseline';
    } else if (compatibility === 'modern') {
      videoCodec = quality === 'highest' ? 'libx265' : 'libx264';
      videoOptions.profile = 'main';
    } else if (compatibility === 'cutting-edge') {
      videoCodec = 'libsvtav1'; // AV1
    }
    
    // Quality settings
    switch (quality) {
      case 'highest':
        videoOptions.crf = 18;
        videoOptions.preset = 'slow';
        audioOptions.bitrate = '320k';
        break;
      case 'high':
        videoOptions.crf = 23;
        videoOptions.preset = 'medium';
        audioOptions.bitrate = '192k';
        break;
      case 'medium':
        videoOptions.crf = 28;
        videoOptions.preset = 'fast';
        audioOptions.bitrate = '128k';
        break;
      case 'low':
        videoOptions.crf = 32;
        videoOptions.preset = 'veryfast';
        audioOptions.bitrate = '96k';
        break;
    }
    
    // File size optimization
    if (fileSize === 'smallest') {
      videoOptions.crf = Math.min((videoOptions.crf || 23) + 5, 51);
      audioOptions.bitrate = '64k';
      audioCodec = 'libopus'; // Better compression
    }
    
    // Hardware acceleration
    if (hardware) {
      // This would need runtime detection in real implementation
      videoOptions.hardwareAcceleration = 'auto';
    }
    
    return {
      video: { codec: videoCodec, options: videoOptions },
      audio: { codec: audioCodec, options: audioOptions }
    };
  }

  /**
   * Get current configuration
   */
  getConfig(): CodecConfiguration {
    return { ...this.config };
  }
}
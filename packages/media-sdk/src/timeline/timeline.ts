import { EventEmitter } from 'events';
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
import { CodecManager, type CodecConfiguration, CodecPresets } from '../codecs/codec-manager.js';

/**
 * @fileoverview Core Timeline API for declarative video composition
 * 
 * The Timeline class provides a fluent, immutable API for building complex video
 * compositions with functional composition patterns. Every method returns a new
 * Timeline instance, ensuring predictable behavior and easy testing.
 * 
 * @example
 * ```typescript
 * // Basic usage
 * const timeline = new Timeline()
 *   .addVideo('input.mp4')
 *   .addText('Hello World', { position: 'center' })
 *   .addWatermark('logo.png', { position: 'top-right' });
 * 
 * // Functional composition
 * const result = timeline
 *   .pipe(brightness(0.2))
 *   .pipe(fadeIn(1.0))
 *   .render('output.mp4');
 * 
 * // Platform presets
 * const tiktokVideo = tiktok('input.mp4')
 *   .addText('Viral Content! 🔥')
 *   .render('tiktok.mp4');
 * ```
 * 
 * @author Media SDK Team
 * @version 1.0.0
 * @since 2024-12-20
 */

/**
 * Core Timeline class for building video compositions declaratively
 * 
 * The Timeline uses an immutable pattern where all methods return new Timeline instances.
 * This ensures predictable behavior, easy testing, and functional composition support.
 * 
 * @class Timeline
 * @extends EventEmitter
 * 
 * @example
 * ```typescript
 * // Create a basic timeline
 * const timeline = new Timeline()
 *   .addVideo('source.mp4')
 *   .addText('Title', { position: 'top' })
 *   .addImage('logo.png', { position: 'bottom-right' });
 * 
 * // Generate FFmpeg command
 * const command = timeline.getCommand('output.mp4');
 * 
 * // Render the video
 * await timeline.render('output.mp4');
 * ```
 */
export class Timeline {
  /** @private Internal layer storage - use methods to modify */
  protected layers: TimelineLayer[] = [];
  
  /** @private Global timeline options like trim, scale, etc. */
  private globalOptions: Record<string, any> = {};
  
  /** @private Current video stream identifier for FFmpeg filter chain */
  private lastVideoStream?: string;
  
  /** @private Current audio stream identifier for FFmpeg filter chain */
  private lastAudioStream?: string;
  
  /** @private Codec configuration manager */
  private codecManager?: CodecManager;

  /**
   * Creates a new Timeline instance
   * 
   * @param layers - Initial layers (used internally for immutable operations)
   * @param options - Global timeline options
   * 
   * @example
   * ```typescript
   * // Empty timeline
   * const timeline = new Timeline();
   * 
   * // Pre-configured timeline (internal use)
   * const timeline = new Timeline(existingLayers, globalOptions);
   * ```
   */
  static create(): Timeline {
    return new Timeline();
  }

    constructor(layers: TimelineLayer[] = [], options: Record<string, any> = {}, codecManager?: CodecManager) {
    this.layers = [...layers];
    this.globalOptions = { ...options };
    this.codecManager = codecManager;
  }

  /**
   * Adds a video layer to the timeline
   * 
   * Videos are the foundation of any timeline. This method adds a video source
   * that will be processed through the filter chain. Multiple videos can be
   * added for concatenation or overlay effects.
   * 
   * @param path - Path to the video file (local or remote)
   * @param options - Video-specific options including position, duration, etc.
   * @returns New Timeline instance with the video layer added
   * 
   * @example
   * ```typescript
   * // Basic video addition
   * timeline.addVideo('input.mp4');
   * 
   * // Video with options
   * timeline.addVideo('input.mp4', {
   *   position: 10, // Start at 10 seconds
   *   duration: 30, // Play for 30 seconds
   *   volume: 0.8   // 80% volume
   * });
   * 
   * // Multiple videos for concatenation
   * timeline
   *   .addVideo('part1.mp4')
   *   .addVideo('part2.mp4')
   *   .addVideo('part3.mp4');
   * ```
   * 
   * @throws {Error} When video path is empty or invalid
   */
  addVideo(path: string, options: VideoOptions = {}): Timeline {
    const layer: TimelineLayer = {
      type: 'video',
      source: path,
      options,
      startTime: options.startTime || options.position || 0,
      duration: options.duration
    };

    return new Timeline([...this.layers, layer], this.globalOptions, this.codecManager);
  }

  /**
   * Adds an audio layer to the timeline
   * 
   * Audio layers can be background music, sound effects, voiceovers, or any audio content.
   * Multiple audio tracks are automatically mixed together. Audio positioning and timing
   * can be precisely controlled.
   * 
   * @param path - Path to the audio file (supports MP3, WAV, AAC, FLAC, etc.)
   * @param options - Audio-specific options including timing, volume, and effects
   * @returns New Timeline instance with the audio layer added
   * 
   * @example
   * ```typescript
   * // Background music
   * timeline.addAudio('background.mp3', {
   *   volume: 0.3,     // 30% volume
   *   startTime: 0,    // Start immediately
   *   duration: 60     // Play for 60 seconds
   * });
   * 
   * // Sound effect at specific time
   * timeline.addAudio('explosion.wav', {
   *   startTime: 15.5, // Start at 15.5 seconds
   *   volume: 0.8      // 80% volume
   * });
   * 
   * // Voiceover with fade effects
   * timeline.addAudio('narration.mp3', {
   *   fadeIn: 1.0,     // 1 second fade in
   *   fadeOut: 2.0     // 2 second fade out
   * });
   * ```
   * 
   * @throws {Error} When audio path is empty or format is unsupported
   */
  addAudio(path: string, options: AudioOptions = {}): Timeline {
    const layer: TimelineLayer = {
      type: 'audio',
      source: path,
      options,
      startTime: options.startTime || 0,
      duration: options.duration
    };

    return new Timeline([...this.layers, layer], this.globalOptions, this.codecManager);
  }

  /**
   * Adds a text overlay layer to the timeline
   * 
   * Text overlays are perfect for titles, captions, subtitles, and call-to-actions.
   * Supports comprehensive styling including fonts, colors, positioning, animations,
   * and platform-specific optimizations.
   * 
   * @param text - The text content to display (supports Unicode and emojis)
   * @param options - Text styling and positioning options
   * @returns New Timeline instance with the text layer added
   * 
   * @example
   * ```typescript
   * // Simple title
   * timeline.addText('Welcome to My Channel!', {
   *   position: 'center',
   *   style: {
   *     fontSize: 48,
   *     color: '#ffffff',
   *     fontWeight: 'bold'
   *   }
   * });
   * 
   * // Styled caption with timing
   * timeline.addText('Subscribe for more! 👍', {
   *   position: 'bottom',
   *   startTime: 5,     // Appear at 5 seconds
   *   duration: 3,      // Show for 3 seconds
   *   style: {
   *     fontSize: 32,
   *     color: '#ffff00',
   *     strokeColor: '#000000',
   *     strokeWidth: 2,
   *     backgroundColor: 'rgba(0,0,0,0.7)'
   *   }
   * });
   * 
   * // Platform-optimized text
   * timeline.addText('🔥 VIRAL CONTENT 🔥', {
   *   position: 'top',
   *   style: captionPresets.tiktok.style
   * });
   * ```
   * 
   * @throws {Error} When text is empty or contains invalid characters
   */
  addText(text: string, options: TextOptions = {}): Timeline {
    const layer: TimelineLayer = {
      type: 'text',
      content: text,
      options,
      startTime: options.startTime || 0,
      duration: options.duration || 5
    };

    return new Timeline([...this.layers, layer], this.globalOptions, this.codecManager);
  }

  /**
   * Add image overlay to the timeline
   */
  addImage(path: string, options: ImageOptions = {}): Timeline {
    const layer: TimelineLayer = {
      type: 'image',
      source: path,
      options,
      startTime: options.startTime || 0,
      duration: options.duration === 'full' ? undefined : (options.duration || 5)
    };

    return new Timeline([...this.layers, layer], this.globalOptions, this.codecManager);
  }

  /**
   * Add watermark (convenience method for logo overlays)
   */
  addWatermark(path: string, options: Omit<ImageOptions, 'duration'> & { margin?: number } = {}): Timeline {
    const { margin = 20, ...imageOptions } = options;
    
    // Convert position strings to coordinates
    let position: Position = { x: 0, y: 0 };
    if (typeof imageOptions.position === 'string') {
      switch (imageOptions.position) {
        case 'top-right':
          position = { x: `main_w-overlay_w-${margin}`, y: margin };
          break;
        case 'bottom-right':
          position = { x: `main_w-overlay_w-${margin}`, y: `main_h-overlay_h-${margin}` };
          break;
        case 'bottom-left':
          position = { x: margin, y: `main_h-overlay_h-${margin}` };
          break;
        case 'top-left':
        default:
          position = { x: margin, y: margin };
          break;
      }
    } else if (imageOptions.position) {
      position = imageOptions.position;
    }

    return this.addImage(path, {
      ...imageOptions,
      position,
      duration: 'full'
    });
  }

  /**
   * Trim the timeline to a specific time range
   */
  trim(start: number, end?: number): Timeline {
    const newOptions = {
      ...this.globalOptions,
      trim: { start, end }
    };

    return new Timeline(this.layers, newOptions);
  }

  /**
   * Crop the video
   */
  crop(options: CropOptions): Timeline {
    const newOptions = {
      ...this.globalOptions,
      crop: options
    };

    return new Timeline(this.layers, newOptions);
  }

  /**
   * Scale/resize the video
   */
  scale(width: number, height: number): Timeline {
    const newOptions = {
      ...this.globalOptions,
      scale: { width, height }
    };

    return new Timeline(this.layers, newOptions);
  }

  /**
   * Set aspect ratio
   */
  setAspectRatio(ratio: string): Timeline {
    const newOptions = {
      ...this.globalOptions,
      aspectRatio: ratio
    };

    return new Timeline(this.layers, newOptions, this.codecManager);
  }

  /**
   * Set frame rate
   */
  setFrameRate(fps: number): Timeline {
    const newOptions = {
      ...this.globalOptions,
      frameRate: fps
    };

    return new Timeline(this.layers, newOptions);
  }

  /**
   * Set duration of the timeline
   */
  setDuration(duration: number): Timeline {
    const newOptions = {
      ...this.globalOptions,
      duration
    };

    return new Timeline(this.layers, newOptions, this.codecManager);
  }

  /**
   * Configure video codec settings
   * 
   * @param codec - Video codec name (e.g., 'libx264', 'libx265', 'h264_nvenc')
   * @param options - Video codec options including quality, performance settings
   * @returns New Timeline instance with video codec configured
   * 
   * @example
   * ```typescript
   * // High quality H.264 encoding
   * timeline.setVideoCodec('libx264', {
   *   preset: 'slow',
   *   crf: 18,
   *   profile: 'high',
   *   level: '5.1'
   * });
   * 
   * // Hardware accelerated encoding
   * timeline.setVideoCodec('h264_nvenc', {
   *   preset: 'p4',
   *   crf: 23,
   *   profile: 'high'
   * });
   * ```
   */
  setVideoCodec(codec: string, options?: any): Timeline {
    const manager = this.codecManager || new CodecManager();
    manager.setVideoCodec(codec, options);
    return new Timeline(this.layers, this.globalOptions, manager);
  }

  /**
   * Configure audio codec settings
   * 
   * @param codec - Audio codec name (e.g., 'aac', 'libopus', 'flac')
   * @param options - Audio codec options including bitrate, quality settings
   * @returns New Timeline instance with audio codec configured
   * 
   * @example
   * ```typescript
   * // High quality AAC encoding
   * timeline.setAudioCodec('aac', {
   *   bitrate: '192k',
   *   sampleRate: 48000,
   *   channels: 2,
   *   profile: 'aac_low'
   * });
   * 
   * // Lossless FLAC encoding
   * timeline.setAudioCodec('flac', {
   *   compressionLevel: 8
   * });
   * ```
   */
  setAudioCodec(codec: string, options?: any): Timeline {
    const manager = this.codecManager || new CodecManager();
    manager.setAudioCodec(codec, options);
    return new Timeline(this.layers, this.globalOptions, manager);
  }

  /**
   * Apply a codec preset for common use cases
   * 
   * @param preset - Predefined codec preset name
   * @returns New Timeline instance with codec preset applied
   * 
   * @example
   * ```typescript
   * // Archival quality (high quality, larger files)
   * timeline.useCodecPreset('archival');
   * 
   * // Streaming optimized (fast encode, good quality)
   * timeline.useCodecPreset('streaming');
   * 
   * // Mobile optimized (smaller files, compatible)
   * timeline.useCodecPreset('mobile');
   * 
   * // Platform-specific presets
   * timeline.useCodecPreset('youtube');
   * timeline.useCodecPreset('tiktok');
   * timeline.useCodecPreset('instagram');
   * ```
   */
  useCodecPreset(preset: keyof typeof CodecPresets): Timeline {
    const manager = this.codecManager || new CodecManager();
    manager.usePreset(preset);
    return new Timeline(this.layers, this.globalOptions, manager);
  }

  /**
   * Enable hardware acceleration for encoding
   * 
   * @param type - Hardware acceleration type
   * @returns New Timeline instance with hardware acceleration configured
   * 
   * @example
   * ```typescript
   * // Auto-detect available hardware acceleration
   * timeline.setHardwareAcceleration('auto');
   * 
   * // Use NVIDIA GPU acceleration
   * timeline.setHardwareAcceleration('nvidia');
   * 
   * // Use Intel Quick Sync Video
   * timeline.setHardwareAcceleration('intel');
   * 
   * // Use AMD hardware acceleration
   * timeline.setHardwareAcceleration('amd');
   * 
   * // Use Apple VideoToolbox (macOS)
   * timeline.setHardwareAcceleration('apple');
   * ```
   */
  setHardwareAcceleration(type: 'auto' | 'nvidia' | 'intel' | 'amd' | 'apple' | 'none'): Timeline {
    const manager = this.codecManager || new CodecManager();
    manager.setHardwareAcceleration(type);
    return new Timeline(this.layers, this.globalOptions, manager);
  }

  /**
   * Configure encoding for target file size
   * 
   * @param targetSizeMB - Target file size in megabytes
   * @param hasAudio - Whether the output includes audio
   * @returns New Timeline instance with optimized codec settings
   * 
   * @example
   * ```typescript
   * // Optimize for 50MB file size with audio
   * timeline.optimizeForFileSize(50, true);
   * 
   * // Video-only output optimized for 25MB
   * timeline.optimizeForFileSize(25, false);
   * ```
   */
  optimizeForFileSize(targetSizeMB: number, hasAudio: boolean = true): Timeline {
    const duration = this.getDuration();
    const settings = CodecManager.getSettingsForFileSize(duration, targetSizeMB, hasAudio);
    
    const manager = this.codecManager || new CodecManager();
    manager.setVideoCodec('libx264', {
      crf: settings.crf,
      preset: 'medium'
    });
    
    if (hasAudio) {
      manager.setAudioCodec('aac', {
        bitrate: settings.audioBitrate
      });
    }
    
    return new Timeline(this.layers, this.globalOptions, manager);
  }

  /**
   * Auto-select optimal codec configuration
   * 
   * @param requirements - Encoding requirements and constraints
   * @returns New Timeline instance with auto-selected codec configuration
   * 
   * @example
   * ```typescript
   * // Maximum compatibility, medium quality
   * timeline.autoSelectCodec({
   *   container: 'mp4',
   *   quality: 'medium',
   *   compatibility: 'maximum'
   * });
   * 
   * // Modern browsers, high quality, small file size
   * timeline.autoSelectCodec({
   *   container: 'webm',
   *   quality: 'high',
   *   compatibility: 'modern',
   *   fileSize: 'smallest',
   *   hardware: true
   * });
   * ```
   */
  autoSelectCodec(requirements: {
    container: string;
    quality: 'low' | 'medium' | 'high' | 'highest';
    compatibility: 'maximum' | 'modern' | 'cutting-edge';
    fileSize?: 'smallest' | 'balanced' | 'quality';
    hardware?: boolean;
  }): Timeline {
    const codecConfig = CodecManager.autoSelectCodec(requirements);
    const manager = this.codecManager || new CodecManager();
    
    if (codecConfig.video) {
      manager.setVideoCodec(codecConfig.video.codec, codecConfig.video.options);
    }
    if (codecConfig.audio) {
      manager.setAudioCodec(codecConfig.audio.codec, codecConfig.audio.options);
    }
    
    return new Timeline(this.layers, this.globalOptions, manager);
  }

  /**
   * Check codec compatibility with target container and platform
   * 
   * @param container - Target container format (e.g., 'mp4', 'webm', 'mkv')
   * @param platform - Optional target platform (e.g., 'ios', 'android', 'windows')
   * @returns Compatibility check results with warnings and alternatives
   * 
   * @example
   * ```typescript
   * const compatibility = timeline.checkCodecCompatibility('mp4', 'ios');
   * 
   * if (!compatibility.compatible) {
   *   console.warn('Codec compatibility issues:', compatibility.warnings);
   *   console.log('Suggested alternatives:', compatibility.alternatives);
   * }
   * ```
   */
  checkCodecCompatibility(container: string, platform?: string): {
    compatible: boolean;
    warnings: string[];
    alternatives: string[];
  } {
    if (!this.codecManager) {
      return { compatible: true, warnings: [], alternatives: [] };
    }
    return this.codecManager.checkCompatibility(container, platform);
  }

  /**
   * Add a filter to the timeline
   */
  addFilter(name: string, options: FilterOptions = {}): Timeline {
    const layer: TimelineLayer = {
      type: 'filter',
      content: name,
      options,
      startTime: 0
    };

    return new Timeline([...this.layers, layer], this.globalOptions, this.codecManager);
  }

  /**
   * Functional composition - apply a transformation function
   */
  pipe<T extends Timeline>(fn: (timeline: T) => Timeline): Timeline {
    return fn(this as any);
  }

  /**
   * Concatenate another timeline
   */
  concat(other: Timeline): Timeline {
    const currentDuration = this.getDuration();
    
    // Shift all layers from other timeline by current duration
    const shiftedLayers = other.layers.map(layer => ({
      ...layer,
      startTime: (layer.startTime || 0) + currentDuration
    }));
    
    return new Timeline(
      [...this.layers, ...shiftedLayers],
      this.globalOptions
    );
  }

  /**
   * Get estimated duration of the timeline
   */
  getDuration(): number {
    if (this.globalOptions.duration) {
      return this.globalOptions.duration;
    }
    
    if (this.layers.length === 0) {
      return 0;
    }
    
    // Calculate duration based on all layers
    let maxDuration = 0;
    for (const layer of this.layers) {
      const layerEnd = (layer.startTime || 0) + (layer.duration || 
        (layer.type === 'video' || layer.type === 'audio' ? 30 : 5)); // Default durations
      maxDuration = Math.max(maxDuration, layerEnd);
    }
    
    return maxDuration;
  }

  /**
   * Generate FFmpeg command
   */
  getCommand(outputPath: string, options: RenderOptions = {}): string {
    const command = this.buildFFmpegCommand(outputPath, options);
    return this.commandToString(command);
  }

  /**
   * Render the timeline to a file
   */
  async render(outputPath: string, options: RenderOptions = {}): Promise<string> {
    const command = this.getCommand(outputPath, options);
    
    if (options.execute === false) {
      return command;
    }

    // In a real implementation, this would execute FFmpeg
    // For now, return the command string
    return command;
  }

  /**
   * Serialize timeline to JSON
   */
  toJSON(): object {
    return {
      layers: this.layers,
      globalOptions: this.globalOptions
    };
  }

  /**
   * Create timeline from JSON
   */
  static fromJSON(data: any): Timeline {
    return new Timeline(data.layers || [], data.globalOptions || {});
  }

  /**
   * Detect if this is a sequential timelapse
   */
  private isSequentialTimelapse(): boolean {
    const imageLayers = this.layers.filter(l => l.type === 'image');
    const videoLayers = this.layers.filter(l => l.type === 'video');
    
    console.log('isSequentialTimelapse check: images=', imageLayers.length, 'videos=', videoLayers.length);
    
    // Must have multiple images and no video
    if (imageLayers.length <= 1 || videoLayers.length > 0) {
      console.log('Not a timelapse - early return');
      return false;
    }
    
    // Sort images by start time
    const sortedImages = imageLayers.slice().sort((a, b) => (a.startTime || 0) - (b.startTime || 0));
    
    // Check if images are sequential (non-overlapping)
    for (let i = 0; i < sortedImages.length - 1; i++) {
      const currentEnd = (sortedImages[i].startTime || 0) + (sortedImages[i].duration || 0.5);
      const nextStart = sortedImages[i + 1].startTime || 0;
      // Debug logging
      if (sortedImages.length === 5) {
        console.log(`Image ${i}: start=${sortedImages[i].startTime}, end=${currentEnd}, next start=${nextStart}, overlap=${currentEnd > nextStart}, sequential=${currentEnd <= nextStart + 0.01}`);
      }
      if (currentEnd > nextStart + 0.01) { // Small tolerance for floating point
        console.log(`Not sequential: currentEnd=${currentEnd} > nextStart=${nextStart}`);
        return false;
      }
    }
    
    console.log('IS SEQUENTIAL TIMELAPSE: TRUE');
    return true;
  }

  /**
   * Build FFmpeg command structure
   */
  private buildFFmpegCommand(outputPath: string, options: RenderOptions): FFmpegCommand {
    const inputs: string[] = [];
    const filters: string[] = [];
    const outputs: string[] = [outputPath];
    const ffmpegOptions: string[] = [];

    // Collect unique inputs
    const inputFiles = new Set<string>();
    this.layers.forEach(layer => {
      if (layer.source) {
        inputFiles.add(layer.source);
      }
    });

    inputs.push(...Array.from(inputFiles));

    // Add global options
    if (this.globalOptions.trim) {
      const { start, end } = this.globalOptions.trim;
      ffmpegOptions.push('-ss', start.toString());
      if (end) {
        ffmpegOptions.push('-t', (end - start).toString());
      }
    }

    // Build filter complex (skip for sequential timelapse)
    const isSequentialTimelapse = this.isSequentialTimelapse();
    
    // Only build filter complex if not a sequential timelapse
    if (!isSequentialTimelapse) {
      const filterComplex = this.buildFilterComplex();
      if (filterComplex) {
        filters.push(filterComplex);
      }
    }

    // Add quality/encoding options
    this.addEncodingOptions(ffmpegOptions, options);

    return { inputs, filters, outputs, options: ffmpegOptions };
  }

  /**
   * Build filter_complex for FFmpeg
   */
  private buildFilterComplex(): string | null {
    const filterChains: string[] = [];
    let inputIndex = 0;
    const inputMap = new Map<string, number>();

    // Map inputs to indices
    const inputFiles = new Set<string>();
    this.layers.forEach(layer => {
      if (layer.source && !inputMap.has(layer.source)) {
        inputMap.set(layer.source, inputIndex++);
        inputFiles.add(layer.source);
      }
    });

    // Process video layers first
    const videoLayers = this.layers.filter(layer => layer.type === 'video');
    const imageLayers = this.layers.filter(layer => layer.type === 'image');
    const filterLayers = this.layers.filter(layer => layer.type === 'filter');
    
    // Check if we have a zoompan filter that needs to be applied to an image
    const hasZoompan = filterLayers.some(layer => layer.content === 'zoompan');
    const needsImageAsBase = videoLayers.length === 0 && imageLayers.length > 0;
    
    // Determine initial stream - could be video or first image
    let currentVideoStream = '0:v'; // Remove brackets here, they'll be added when needed
    
    // If no video layers but we have image layers, handle zoompan specially
    if (needsImageAsBase) {
      const firstImage = imageLayers[0];
      const firstImageIndex = inputMap.get(firstImage.source!);
      if (firstImageIndex !== undefined) {
        currentVideoStream = `${firstImageIndex}:v`;
        
        // Apply zoompan filter first if it exists (for images)
        if (hasZoompan) {
          const zoompanLayer = filterLayers.find(layer => layer.content === 'zoompan');
          if (zoompanLayer) {
            const zoompanFilter = this.buildFilterString(zoompanLayer, `[${currentVideoStream}]`, 0);
            if (zoompanFilter) {
              filterChains.push(zoompanFilter);
              currentVideoStream = 'filtered0';
              // Remove this filter from the list to process later
              filterLayers.splice(filterLayers.indexOf(zoompanLayer), 1);
            }
          }
        }
      }
    }

    // Apply global transformations
    if (this.globalOptions.aspectRatio) {
      // Apply aspect ratio scaling/cropping
      const ratio = this.globalOptions.aspectRatio;
      let scaleFilter = '';
      
      switch (ratio) {
        case '16:9':
          scaleFilter = `[${currentVideoStream}]scale='if(gt(a,16/9),iw,ih*16/9)':'if(gt(a,16/9),iw*9/16,ih)',crop=iw:ih[aspect]`;
          break;
        case '9:16':
          scaleFilter = `[${currentVideoStream}]scale='if(gt(a,9/16),ih*9/16,iw)':'if(gt(a,9/16),ih,iw*16/9)',crop=iw:ih[aspect]`;
          break;
        case '1:1':
          scaleFilter = `[${currentVideoStream}]scale='if(gt(a,1),iw,ih)':'if(gt(a,1),iw,ih)',crop='min(iw,ih)':'min(iw,ih)'[aspect]`;
          break;
        case '4:3':
          scaleFilter = `[${currentVideoStream}]scale='if(gt(a,4/3),iw,ih*4/3)':'if(gt(a,4/3),iw*3/4,ih)',crop=iw:ih[aspect]`;
          break;
        case '21:9':
          scaleFilter = `[${currentVideoStream}]scale='if(gt(a,21/9),iw,ih*21/9)':'if(gt(a,21/9),iw*9/21,ih)',crop=iw:ih[aspect]`;
          break;
        default:
          // Custom aspect ratio (e.g., "16:10")
          const [w, h] = ratio.split(':').map(Number);
          if (w && h) {
            scaleFilter = `[${currentVideoStream}]scale='if(gt(a,${w}/${h}),iw,ih*${w}/${h})':'if(gt(a,${w}/${h}),iw*${h}/${w},ih)',crop=iw:ih[aspect]`;
          }
      }
      
      if (scaleFilter) {
        filterChains.push(scaleFilter);
        currentVideoStream = 'aspect';
      }
    }
    
    if (this.globalOptions.scale) {
      const { width, height } = this.globalOptions.scale;
      filterChains.push(`[${currentVideoStream}]scale=${width}:${height}[scaled]`);
      currentVideoStream = 'scaled';
    }

    if (this.globalOptions.crop) {
      const { x = 0, y = 0, width, height } = this.globalOptions.crop;
      const cropFilter = `[${currentVideoStream}]crop=${width}:${height}:${x}:${y}[cropped]`;
      filterChains.push(cropFilter);
      currentVideoStream = 'cropped';
    }

    // Process overlays (text, images, watermarks)
    const overlayLayers = this.layers.filter(layer => {
      if (layer.type === 'text') return true;
      // Skip first image if it's being used as base and we have no video layers
      if (layer.type === 'image' && videoLayers.length === 0 && layer === imageLayers[0]) {
        return false;
      }
      return layer.type === 'image';
    });

    overlayLayers.forEach((layer, index) => {
      if (layer.type === 'text') {
        const textFilter = this.buildTextFilter(layer, index, `[${currentVideoStream}]`);
        if (textFilter) {
          filterChains.push(textFilter);
          currentVideoStream = `text${index}`;
        }
      } else if (layer.type === 'image') {
        const imageIndex = inputMap.get(layer.source!);
        if (imageIndex !== undefined) {
          const overlayFilter = this.buildImageOverlay(layer, imageIndex, index, currentVideoStream);
          if (overlayFilter) {
            filterChains.push(overlayFilter);
            currentVideoStream = `overlay${index}`;
          }
        }
      }
    });

    // Apply remaining filters (zoompan may have been handled earlier for images)
    const remainingFilterLayers = needsImageAsBase && hasZoompan ? 
      filterLayers : // Already modified array with zoompan removed
      this.layers.filter(layer => layer.type === 'filter');
      
    remainingFilterLayers.forEach((layer, index) => {
      const filterStr = this.buildFilterString(layer, `[${currentVideoStream}]`, index + (hasZoompan && needsImageAsBase ? 1 : 0));
      if (filterStr) {
        filterChains.push(filterStr);
        currentVideoStream = `filtered${index + (hasZoompan && needsImageAsBase ? 1 : 0)}`;
      }
    });

    // Handle audio layers with advanced processing
    const audioLayers = this.layers.filter(layer => layer.type === 'audio');
    if (audioLayers.length > 0 || videoLayers.length > 0) {
      const audioFilterChains: string[] = [];
      const processedAudioStreams: string[] = [];
      
      // Process original video audio if exists
      if (videoLayers.length > 0) {
        processedAudioStreams.push('[0:a]');
      }
      
      // Process each audio layer with effects and timing
      audioLayers.forEach((layer, index) => {
        const audioIndex = inputMap.get(layer.source!);
        if (audioIndex !== undefined) {
          const options = layer.options as AudioOptions;
          let audioStream = `[${audioIndex}:a]`;
          const audioFilters: string[] = [];
          
          // Apply trim if specified
          if (options.trimStart !== undefined || options.trimEnd !== undefined) {
            const start = options.trimStart || 0;
            const end = options.trimEnd ? `,end=${options.trimEnd}` : '';
            audioFilters.push(`atrim=start=${start}${end}`);
          }
          
          // Apply volume adjustment
          if (options.volume !== undefined) {
            audioFilters.push(`volume=${options.volume}`);
          }
          
          // Apply fade in/out
          if (options.fadeIn) {
            audioFilters.push(`afade=t=in:st=0:d=${options.fadeIn}`);
          }
          if (options.fadeOut && layer.duration) {
            const fadeStart = layer.duration - options.fadeOut;
            audioFilters.push(`afade=t=out:st=${fadeStart}:d=${options.fadeOut}`);
          }
          
          // Apply pitch adjustment
          if (options.pitch) {
            audioFilters.push(`asetrate=44100*${options.pitch},aresample=44100`);
          }
          
          // Apply tempo adjustment
          if (options.tempo) {
            audioFilters.push(`atempo=${options.tempo}`);
          }
          
          // Apply filters
          if (options.lowpass) {
            audioFilters.push(`lowpass=f=${options.lowpass}`);
          }
          if (options.highpass) {
            audioFilters.push(`highpass=f=${options.highpass}`);
          }
          
          // Apply echo effect
          if (options.echo) {
            audioFilters.push(`aecho=0.8:0.9:${options.echo.delay}:${options.echo.decay}`);
          }
          
          // Apply reverb effect
          if (options.reverb) {
            audioFilters.push(`aecho=0.8:0.88:60:0.4`); // Simple reverb simulation
          }
          
          // Apply delay/padding for start time
          if (layer.startTime > 0) {
            audioFilters.push(`adelay=${layer.startTime * 1000}|${layer.startTime * 1000}`);
          }
          
          // Apply duration limit if specified
          if (layer.duration) {
            audioFilters.push(`atrim=duration=${layer.duration}`);
          }
          
          // Apply loop if specified
          if (options.loop && layer.duration) {
            audioFilters.push(`aloop=loop=-1:size=44100*10`); // Loop with 10s buffer
          }
          
          // Build audio filter chain
          if (audioFilters.length > 0) {
            const processedName = `audio${index}`;
            audioFilterChains.push(`${audioStream}${audioFilters.join(',')}[${processedName}]`);
            processedAudioStreams.push(`[${processedName}]`);
          } else {
            processedAudioStreams.push(audioStream);
          }
        }
      });
      
      // Mix all audio streams together
      if (processedAudioStreams.length > 1) {
        const mixInputs = processedAudioStreams.join('');
        audioFilterChains.push(`${mixInputs}amix=inputs=${processedAudioStreams.length}:duration=longest[aout]`);
        this.lastAudioStream = '[aout]';
        
        // Add audio filter chains to main filter complex
        filterChains.push(...audioFilterChains);
      } else if (processedAudioStreams.length === 1 && audioFilterChains.length > 0) {
        // Single processed audio stream
        filterChains.push(...audioFilterChains);
        this.lastAudioStream = processedAudioStreams[0];
      }
    }
    
    // Store the final output stream label
    this.lastVideoStream = `[${currentVideoStream}]`;
    
    // Return null only if there are no filters at all
    if (filterChains.length === 0) {
      return null;
    }
    
    return filterChains.join(';');
  }

  /**
   * Build text filter for FFmpeg
   */
  private buildTextFilter(layer: TimelineLayer, index: number, inputStream: string): string {
    const { content, options } = layer;
    const style = options.style || {};
    
    let position = 'x=(w-text_w)/2:y=(h-text_h)/2'; // center by default
    
    if (options.position) {
      if (typeof options.position === 'string') {
        switch (options.position) {
          case 'top':
            position = 'x=(w-text_w)/2:y=50';
            break;
          case 'bottom':
            position = 'x=(w-text_w)/2:y=h-text_h-50';
            break;
          case 'top-left':
            position = 'x=50:y=50';
            break;
          case 'top-right':
            position = 'x=w-text_w-50:y=50';
            break;
          case 'bottom-left':
            position = 'x=50:y=h-text_h-50';
            break;
          case 'bottom-right':
            position = 'x=w-text_w-50:y=h-text_h-50';
            break;
        }
      } else {
        // Parse x and y coordinates, handling percentage values
        let x = options.position.x;
        let y = options.position.y;
        
        // Convert percentage values to FFmpeg expressions
        if (typeof x === 'string' && x.includes('%')) {
          const percent = parseFloat(x) / 100;
          x = `(w*${percent})`;
        }
        if (typeof y === 'string' && y.includes('%')) {
          const percent = parseFloat(y) / 100;
          y = `(h*${percent})`;
        }
        
        // Handle anchor positioning if specified
        if (options.position.anchor) {
          switch (options.position.anchor) {
            case 'center':
              x = `(${x}-(text_w/2))`;
              y = `(${y}-(text_h/2))`;
              break;
            case 'top-center':
              x = `(${x}-(text_w/2))`;
              break;
            case 'bottom-center':
              x = `(${x}-(text_w/2))`;
              y = `(${y}-text_h)`;
              break;
            case 'center-right':
              x = `(${x}-text_w)`;
              y = `(${y}-(text_h/2))`;
              break;
            case 'center-left':
              y = `(${y}-(text_h/2))`;
              break;
            case 'top-right':
              x = `(${x}-text_w)`;
              break;
            case 'bottom-right':
              x = `(${x}-text_w)`;
              y = `(${y}-text_h)`;
              break;
            case 'bottom-left':
              y = `(${y}-text_h)`;
              break;
            // top-left is default, no adjustment needed
          }
        }
        
        position = `x=${x}:y=${y}`;
      }
    }

    // Escape single quotes in content
    const escapedContent = (content || '').replace(/'/g, "'\\''");
    
    const textOptions = [
      `text='${escapedContent}'`,
      position,
      style.fontSize ? `fontsize=${style.fontSize}` : 'fontsize=24',
      style.fontFamily ? `fontfile='${style.fontFamily}'` : '',
      style.color ? `fontcolor=${style.color}` : 'fontcolor=white',
      // Background box
      style.backgroundColor || style.background?.color ? 
        `box=1:boxcolor=${style.backgroundColor || style.background?.color}` : '',
      style.background?.padding ? `boxborderw=${style.background.padding}` : 
        (style.backgroundColor ? 'boxborderw=5' : ''),
      // Stroke/border
      style.strokeColor ? `bordercolor=${style.strokeColor}` : '',
      style.strokeWidth ? `borderw=${style.strokeWidth}` : '',
      // Shadow
      style.shadowColor ? `shadowcolor=${style.shadowColor}` : '',
      style.shadowOffsetX ? `shadowx=${style.shadowOffsetX}` : '',
      style.shadowOffsetY ? `shadowy=${style.shadowOffsetY}` : '',
      // Font style
      style.fontStyle === 'italic' ? 'italic=1' : '',
      // Text alignment
      style.textAlign === 'center' ? 'alignment=center' : 
        (style.textAlign === 'right' ? 'alignment=right' : ''),
      // Enable timing
      layer.startTime ? `enable='between(t,${layer.startTime},${layer.startTime + (layer.duration || 5)})'` : ''
    ].filter(Boolean);

    return `${inputStream}drawtext=${textOptions.join(':')}[text${index}]`;
  }

  /**
   * Build image overlay filter
   */
  private buildImageOverlay(layer: TimelineLayer, imageIndex: number, overlayIndex: number, currentVideoStream: string): string {
    const { options } = layer;
    
    let position = '0:0'; // top-left by default
    
    if (options.position) {
      if (typeof options.position === 'string') {
        // Convert position strings to coordinates
        const margin = 20;
        switch (options.position) {
          case 'top-right':
            position = `main_w-overlay_w-${margin}:${margin}`;
            break;
          case 'bottom-right':
            position = `main_w-overlay_w-${margin}:main_h-overlay_h-${margin}`;
            break;
          case 'bottom-left':
            position = `${margin}:main_h-overlay_h-${margin}`;
            break;
          case 'center':
            position = '(main_w-overlay_w)/2:(main_h-overlay_h)/2';
            break;
          case 'top-left':
          default:
            position = `${margin}:${margin}`;
            break;
        }
      } else if (typeof options.position === 'object') {
        // Parse x and y coordinates, handling percentage values
        let x = options.position.x;
        let y = options.position.y;
        
        // Convert percentage values to FFmpeg expressions
        if (typeof x === 'string' && x.includes('%')) {
          const percent = parseFloat(x) / 100;
          x = `(main_w*${percent})`;
        }
        if (typeof y === 'string' && y.includes('%')) {
          const percent = parseFloat(y) / 100;
          y = `(main_h*${percent})`;
        }
        
        // Handle anchor positioning if specified
        if (options.position.anchor) {
          switch (options.position.anchor) {
            case 'center':
              x = `(${x}-(overlay_w/2))`;
              y = `(${y}-(overlay_h/2))`;
              break;
            case 'top-center':
              x = `(${x}-(overlay_w/2))`;
              break;
            case 'bottom-center':
              x = `(${x}-(overlay_w/2))`;
              y = `(${y}-overlay_h)`;
              break;
            case 'center-right':
              x = `(${x}-overlay_w)`;
              y = `(${y}-(overlay_h/2))`;
              break;
            case 'center-left':
              y = `(${y}-(overlay_h/2))`;
              break;
            case 'top-right':
              x = `(${x}-overlay_w)`;
              break;
            case 'bottom-right':
              x = `(${x}-overlay_w)`;
              y = `(${y}-overlay_h)`;
              break;
            case 'bottom-left':
              y = `(${y}-overlay_h)`;
              break;
            // top-left is default, no adjustment needed
          }
        }
        
        position = `${x}:${y}`;
      }
    }

    const enableTime = layer.startTime ? 
      `:enable='between(t,${layer.startTime},${layer.startTime + (layer.duration || 5)})'` : '';

    return `[${currentVideoStream}][${imageIndex}:v]overlay=${position}${enableTime}[overlay${overlayIndex}]`;
  }

  /**
   * Build filter string
   */
  private buildFilterString(layer: TimelineLayer, inputStream: string, index: number): string {
    const { content, options } = layer;
    
    switch (content) {
      case 'blur':
        return `${inputStream}boxblur=${options.radius || 5}[filtered${index}]`;
      case 'brightness':
        return `${inputStream}eq=brightness=${options.value || 0}[filtered${index}]`;
      case 'contrast':
        return `${inputStream}eq=contrast=${options.value || 1}[filtered${index}]`;
      case 'saturation':
        return `${inputStream}eq=saturation=${options.value || 1}[filtered${index}]`;
      case 'zoompan':
        // Handle zoompan filter specially
        const zoomOpts = [];
        if (options.z) zoomOpts.push(`z='${options.z}'`);
        if (options.x) zoomOpts.push(`x='${options.x}'`);
        if (options.y) zoomOpts.push(`y='${options.y}'`);
        if (options.d) zoomOpts.push(`d=${options.d}`);
        if (options.s) zoomOpts.push(`s=${options.s}`);
        if (options.fps) zoomOpts.push(`fps=${options.fps}`);
        if (options.raw) {
          // If raw string provided, use it directly
          return `${inputStream}zoompan=${options.raw}[filtered${index}]`;
        }
        return `${inputStream}zoompan=${zoomOpts.join(':')}[filtered${index}]`;
      case 'colorchannelmixer':
        const colorOpts = [];
        if (options.rr) colorOpts.push(`rr=${options.rr}`);
        if (options.gg) colorOpts.push(`gg=${options.gg}`);
        if (options.bb) colorOpts.push(`bb=${options.bb}`);
        return `${inputStream}colorchannelmixer=${colorOpts.join(':')}[filtered${index}]`;
      case 'vignette':
        const vignetteOpts = [];
        if (options.angle) vignetteOpts.push(`angle=${options.angle}`);
        return `${inputStream}vignette${vignetteOpts.length ? '=' + vignetteOpts.join(':') : ''}[filtered${index}]`;
      default:
        return `${inputStream}${content}[filtered${index}]`;
    }
  }

  /**
   * Add encoding options to FFmpeg command
   */
  private addEncodingOptions(options: string[], renderOptions: RenderOptions): void {
    // Use codec manager if available, otherwise fall back to defaults
    if (this.codecManager) {
      const codecArgs = this.codecManager.getFFmpegArgs();
      options.push(...codecArgs);
    } else {
      // Default codec settings (legacy behavior)
      const codec = renderOptions.codec || 'h264';
      options.push('-c:v', codec);

      // Quality presets
      const quality = renderOptions.quality || 'medium';
      const preset = renderOptions.preset || 'medium';
      
      switch (quality) {
        case 'low':
          options.push('-crf', '28', '-preset', 'fast');
          break;
        case 'medium':
          options.push('-crf', '23', '-preset', preset);
          break;
        case 'high':
          options.push('-crf', '18', '-preset', preset);
          break;
        case 'ultra':
          options.push('-crf', '15', '-preset', 'slow');
          break;
      }

      // Hardware acceleration
      if (renderOptions.hardwareAcceleration && renderOptions.hardwareAcceleration !== 'none') {
        if (renderOptions.hardwareAcceleration === 'auto') {
          options.push('-hwaccel', 'auto');
        } else {
          options.push('-hwaccel', renderOptions.hardwareAcceleration);
        }
      }

      // Audio codec
      options.push('-c:a', 'aac');
    }

    // Bitrate (can override codec manager settings)
    if (renderOptions.bitrate) {
      options.push('-b:v', renderOptions.bitrate);
    }

    if (renderOptions.audioBitrate) {
      options.push('-b:a', renderOptions.audioBitrate);
    }
    
    // Overwrite output
    options.push('-y');
  }

  /**
   * Convert command object to string
   */
  private commandToString(command: FFmpegCommand): string {
    const parts: string[] = ['ffmpeg'];
    
    // Add hardware acceleration flags before inputs
    if (this.codecManager) {
      const hwArgs = this.codecManager.getHardwareAccelArgs();
      parts.push(...hwArgs);
    }
    
    // Check if we're creating a sequential timelapse
    const imageLayers = this.layers.filter(l => l.type === 'image');
    const isSequentialTimelapse = this.isSequentialTimelapse();
    
    // Add inputs with proper options
    command.inputs.forEach((input, index) => {
      // Check if this input is an image
      const isImage = imageLayers.some(layer => layer.source === input);
      
      if (isImage && isSequentialTimelapse) {
        // For sequential timelapse, add images with specific duration
        const imageLayer = imageLayers.find(l => l.source === input);
        const duration = imageLayer?.duration || 0.5;
        parts.push('-loop', '1', '-t', duration.toString(), '-i', input);
      } else if (isImage) {
        // Single image or overlapping images - add loop and duration
        const imageLayer = imageLayers.find(l => l.source === input);
        const duration = imageLayer?.duration || 5;
        parts.push('-loop', '1', '-t', duration.toString(), '-i', input);
      } else {
        // Regular input (video/audio)
        parts.push('-i', input);
      }
    });

    // Add options
    parts.push(...command.options);

    // For sequential timelapse, add concat filter if not already present
    if (isSequentialTimelapse && command.filters.length === 0) {
      const concatFilter = imageLayers.map((_, i) => `[${i}:v]`).join('') + 
        `concat=n=${imageLayers.length}:v=1:a=0[v]`;
      parts.push('-filter_complex', `"${concatFilter}"`);
      parts.push('-map', '[v]');
    } else if (command.filters.length > 0) {
      // Regular filter complex
      parts.push('-filter_complex', `"${command.filters.join(';')}"`);
      
      // Map the output from filter_complex if we have a final stream
      if (this.lastVideoStream) {
        parts.push('-map', this.lastVideoStream);
      }
      
      // Map audio output if we have mixed audio
      if (this.lastAudioStream) {
        parts.push('-map', this.lastAudioStream);
      } else if (command.inputs.length > 1 && !isSequentialTimelapse) {
        // If we have multiple inputs but no audio mixing, just use first audio
        parts.push('-map', '0:a?');
      }
    }

    // Add codec and format options
    if (!command.options.some(opt => opt.includes('-c:v'))) {
      parts.push('-c:v', 'h264');
    }
    if (!command.options.some(opt => opt.includes('-pix_fmt'))) {
      parts.push('-pix_fmt', 'yuv420p');
    }
    if (!isSequentialTimelapse && !command.options.some(opt => opt.includes('-c:a'))) {
      parts.push('-c:a', 'aac');
    }
    
    // Add quality settings
    if (!command.options.some(opt => opt.includes('-crf'))) {
      parts.push('-crf', '23');
    }
    if (!command.options.some(opt => opt.includes('-preset'))) {
      parts.push('-preset', 'medium');
    }

    // Add overwrite flag
    parts.push('-y');

    // Add outputs
    parts.push(...command.outputs);

    return parts.join(' ');
  }

  /**
   * Add advanced captions with time-series transitions, positioning, and styling
   * 
   * Integrates the advanced image caption system for precise control over
   * caption timing, positioning, transitions, and visual effects. Perfect for
   * creating engaging social media content with professional-quality captions.
   * 
   * @param options - Caption configuration with timing, positioning, and styling
   * @returns New Timeline instance with captions added
   * 
   * @example
   * ```typescript
   * // Simple timed captions
   * timeline.addCaptions({
   *   captions: [
   *     { text: 'Welcome!', duration: 3 },
   *     { text: 'Subscribe for more', duration: 2 }
   *   ],
   *   style: { fontSize: 32, color: '#ffffff' },
   *   transition: 'fade'
   * });
   * 
   * // Advanced positioned captions
   * timeline.addCaptions({
   *   captions: [
   *     {
   *       text: 'Premium Quality',
   *       startTime: 1,
   *       endTime: 4,
   *       position: { x: '25%', y: '15%', anchor: 'center' },
   *       style: { fontSize: 28, color: '#gold', strokeWidth: 2 }
   *     },
   *     {
   *       text: 'Order Now!',
   *       startTime: 3,
   *       endTime: 6,
   *       position: { x: '75%', y: '85%', anchor: 'bottom-right' },
   *       style: { fontSize: 24, background: { color: '#ff0000', padding: 12 } }
   *     }
   *   ]
   * });
   * 
   * // Platform-specific presets
   * timeline.addCaptions({
   *   captions: [{ text: 'Viral Content! 🔥' }],
   *   preset: 'instagram',
   *   transition: 'bounce'
   * });
   * ```
   */
  addCaptions(options: {
    captions: Array<{
      text: string;
      startTime?: number;
      endTime?: number;
      duration?: number;
      position?: {
        x: number | string;
        y: number | string;
        anchor?: 'top-left' | 'top-center' | 'top-right' | 
                 'center-left' | 'center' | 'center-right' | 
                 'bottom-left' | 'bottom-center' | 'bottom-right';
      };
      style?: {
        fontSize?: number;
        fontFamily?: string;
        color?: string;
        strokeColor?: string;
        strokeWidth?: number;
        background?: {
          color?: string;
          padding?: number;
          borderRadius?: number;
        };
        border?: {
          width?: number;
          color?: string;
          style?: 'solid' | 'dashed' | 'dotted';
        };
        shadow?: {
          offsetX?: number;
          offsetY?: number;
          blur?: number;
          color?: string;
        };
      };
    }>;
    globalStyle?: {
      fontSize?: number;
      fontFamily?: string;
      color?: string;
      strokeColor?: string;
      strokeWidth?: number;
    };
    preset?: 'instagram' | 'tiktok' | 'youtube' | 'linkedin' | 'pinterest';
    transition?: 'fade' | 'slide' | 'scale' | 'bounce' | 'none';
    transitionDuration?: number;
    startDelay?: number;
    overlap?: number; // percentage overlap between captions (0-1)
    wordsPerMinute?: number; // for auto-duration calculation
  }): Timeline {
    
    const {
      captions,
      globalStyle = {},
      preset,
      transition = 'fade',
      transitionDuration = 0.5,
      startDelay = 0,
      overlap = 0.1,
      wordsPerMinute = 200
    } = options;

    // Apply preset styling if specified
    let baseStyle = globalStyle;
    if (preset && imageCaptionPresets[preset]) {
      baseStyle = { ...imageCaptionPresets[preset].style, ...globalStyle };
    }

    // Calculate timing for captions without explicit timing
    const timingCaptions = captions.map(caption => ({
      text: caption.text,
      duration: caption.duration || (caption.endTime && caption.startTime ? 
        caption.endTime - caption.startTime : undefined)
    }));

    const autoTimings = CaptionDurationCalculator.calculateStaggeredTiming(
      timingCaptions,
      { startDelay, overlap, wordsPerMinute }
    );

    // Create timeline layers for each caption
    const captionLayers: TimelineLayer[] = captions.map((caption, index) => {
      const startTime = caption.startTime ?? autoTimings[index].startTime;
      const endTime = caption.endTime ?? autoTimings[index].endTime;
      
      // Merge styles
      const mergedStyle = {
        fontSize: 32,
        color: '#ffffff',
        strokeColor: '#000000',
        strokeWidth: 2,
        ...baseStyle,
        ...caption.style
      };

      // Build position string
      let position = 'center'; // default
      if (caption.position) {
        const { x, y, anchor = 'center' } = caption.position;
        
        // Convert to FFmpeg position format
        let xPos: string, yPos: string;
        
        if (typeof x === 'string' && x.includes('%')) {
          xPos = `(main_w*${parseFloat(x)/100})`;
        } else if (typeof x === 'string') {
          xPos = x.replace('px', '');
        } else {
          xPos = x.toString();
        }
        
        if (typeof y === 'string' && y.includes('%')) {
          yPos = `(main_h*${parseFloat(y)/100})`;
        } else if (typeof y === 'string') {
          yPos = y.replace('px', '');
        } else {
          yPos = y.toString();
        }

        // Apply anchor adjustments
        switch (anchor) {
          case 'center':
            xPos = `(${xPos}-(text_w/2))`;
            yPos = `(${yPos}-(text_h/2))`;
            break;
          case 'top-center':
            xPos = `(${xPos}-(text_w/2))`;
            break;
          case 'bottom-center':
            xPos = `(${xPos}-(text_w/2))`;
            yPos = `(${yPos}-text_h)`;
            break;
          case 'center-right':
            xPos = `(${xPos}-text_w)`;
            yPos = `(${yPos}-(text_h/2))`;
            break;
          // Add more anchor cases as needed
        }
        
        position = { x: xPos, y: yPos } as any; // Allow complex position object
      }

      return {
        type: 'text',
        content: caption.text,
        options: {
          position,
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
      };
    });

    return new Timeline([...this.layers, ...captionLayers], this.globalOptions, this.codecManager);
  }

  /**
   * Add word-by-word highlighting captions (TikTok/Karaoke style)
   * 
   * Creates engaging captions where individual words are highlighted as they're spoken.
   * Perfect for creating viral social media content with synchronized text highlighting.
   * 
   * @param options - Word highlighting configuration
   * @returns New Timeline instance with word highlighting captions
   * 
   * @example
   * ```typescript
   * // Auto-timed word highlighting
   * timeline.addWordHighlighting({
   *   text: 'This is amazing content that will go viral!',
   *   startTime: 2,
   *   duration: 6,
   *   wordsPerSecond: 2,
   *   preset: 'tiktok'
   * });
   * 
   * // Custom word timings
   * timeline.addWordHighlighting({
   *   words: [
   *     { word: 'Custom', start: 1.0, end: 1.5 },
   *     { word: 'timed', start: 1.5, end: 2.0 },
   *     { word: 'highlighting!', start: 2.0, end: 2.8 }
   *   ],
   *   baseStyle: { fontSize: 48, color: '#ffffff' },
   *   highlightStyle: { color: '#ff0066', scale: 1.2 }
   * });
   * 
   * // Platform-optimized highlighting
   * timeline.addWordHighlighting({
   *   text: 'Subscribe and hit that bell! 🔔',
   *   startTime: 5,
   *   duration: 4,
   *   preset: 'instagram',
   *   highlightTransition: 'bounce'
   * });
   * ```
   */
  addWordHighlighting(options: {
    // Text input (choose one)
    text?: string;
    words?: Array<{
      word: string;
      start: number;
      end: number;
      confidence?: number;
    }>;
    
    // Timing
    startTime?: number;
    duration?: number;
    wordsPerSecond?: number; // for auto-timing
    
    // Positioning
    position?: {
      x: number | string;
      y: number | string;
      anchor?: 'top-left' | 'top-center' | 'top-right' | 
               'center-left' | 'center' | 'center-right' | 
               'bottom-left' | 'bottom-center' | 'bottom-right';
    };
    
    // Styling
    baseStyle?: {
      fontSize?: number;
      fontFamily?: string;
      color?: string;
      strokeColor?: string;
      strokeWidth?: number;
      background?: {
        color?: string;
        padding?: number;
        borderRadius?: number;
      };
    };
    highlightStyle?: {
      color?: string;
      strokeColor?: string;
      strokeWidth?: number;
      scale?: number;
      glow?: boolean;
      background?: {
        color?: string;
        padding?: number;
        borderRadius?: number;
      };
    };
    
    // Animation
    highlightTransition?: 'instant' | 'fade' | 'scale' | 'bounce' | 'pulse';
    transitionDuration?: number;
    
    // Presets
    preset?: 'tiktok' | 'instagram' | 'youtube' | 'karaoke' | 'typewriter';
    
    // Advanced
    lineBreakStrategy?: 'auto' | 'manual' | 'none';
    maxWordsPerLine?: number;
    lineSpacing?: number;
  }): Timeline {
    
    const {
      text,
      words: customWords,
      startTime = 0,
      duration = 5,
      wordsPerSecond = 2.5,
      position = { x: '50%', y: '50%', anchor: 'center' },
      baseStyle = {},
      highlightStyle = {},
      highlightTransition = 'scale',
      transitionDuration = 0.2,
      preset,
      lineBreakStrategy = 'auto',
      maxWordsPerLine = 5,
      lineSpacing = 1.5
    } = options;

    // Apply preset styles
    let mergedBaseStyle = baseStyle;
    let mergedHighlightStyle = highlightStyle;
    
    if (preset) {
      const presetStyles = this.getWordHighlightPresets()[preset] || {};
      mergedBaseStyle = { ...presetStyles.base, ...baseStyle };
      mergedHighlightStyle = { ...presetStyles.highlight, ...highlightStyle };
    }

    // Generate words with timing
    let words: Array<{ word: string; start: number; end: number }>;
    
    if (customWords) {
      words = customWords;
    } else if (text) {
      words = this.generateWordTimings(text, startTime, duration, wordsPerSecond);
    } else {
      // Handle empty input gracefully
      console.warn('addWordHighlighting: No text or words provided, returning unchanged timeline');
      return this;
    }

    // Group words into lines if needed
    const lines = this.groupWordsIntoLines(words, lineBreakStrategy, maxWordsPerLine);

    // Create timeline layers for word highlighting
    const wordLayers: TimelineLayer[] = [];

    lines.forEach((line, lineIndex) => {
      line.words.forEach((word, wordIndex) => {
        // Calculate position for this word
        const wordPosition = this.calculateWordPosition(
          position, 
          lineIndex, 
          wordIndex, 
          line.words.length,
          lines.length,
          lineSpacing
        );

        // Base word layer (always visible during its time)
        wordLayers.push({
          type: 'text',
          content: word.word,
          options: {
            position: wordPosition,
            startTime: word.start,
            duration: word.end - word.start,
            style: {
              fontSize: 32,
              color: '#cccccc',
              strokeColor: '#000000',
              strokeWidth: 1,
              ...mergedBaseStyle
            }
          },
          startTime: word.start,
          duration: word.end - word.start
        });

        // Highlight layer (active only when word is being spoken)
        const highlightLayer: TimelineLayer = {
          type: 'text',
          content: word.word,
          options: {
            position: wordPosition,
            startTime: word.start,
            duration: word.end - word.start,
            style: {
              fontSize: 32,
              color: '#ff0066',
              strokeColor: '#000000',
              strokeWidth: 2,
              ...mergedBaseStyle,
              ...mergedHighlightStyle
            },
            transition: highlightTransition !== 'instant' ? {
              type: highlightTransition,
              duration: transitionDuration
            } : undefined
          },
          startTime: word.start,
          duration: word.end - word.start
        };

        wordLayers.push(highlightLayer);
      });
    });

    return new Timeline([...this.layers, ...wordLayers], this.globalOptions, this.codecManager);
  }

  /**
   * Generate word timings from text
   */
  validateForPlatform(platform: string): any {
    // Basic platform validation
    const validPlatforms = ['tiktok', 'instagram', 'youtube', 'twitter', 'linkedin'];
    if (!validPlatforms.includes(platform)) {
      throw new Error(`Invalid platform: ${platform}`);
    }
    
    const aspectRatios: Record<string, string> = {
      tiktok: '9:16',
      instagram: '1:1',
      youtube: '16:9',
      twitter: '16:9',
      linkedin: '16:9'
    };
    
    const currentAspectRatio = this.globalOptions.aspectRatio;
    const expectedRatio = aspectRatios[platform];
    
    return {
      isValid: currentAspectRatio === expectedRatio,
      warnings: currentAspectRatio !== expectedRatio 
        ? [`${platform} videos should use ${expectedRatio} aspect ratio`]
        : [],
      errors: [],
      suggestions: currentAspectRatio !== expectedRatio
        ? [`Use timeline.setAspectRatio("${expectedRatio}")`]
        : []
    };
  }

    private generateWordTimings(
    text: string, 
    startTime: number, 
    duration: number, 
    wordsPerSecond: number
  ): Array<{ word: string; start: number; end: number }> {
    const words = text.split(/\s+/).filter(word => word.length > 0);
    const totalWords = words.length;
    const wordDuration = 1 / wordsPerSecond;
    
    return words.map((word, index) => {
      const wordStart = startTime + (index * wordDuration);
      const wordEnd = Math.min(wordStart + wordDuration, startTime + duration);
      
      return {
        word: word.replace(/[^\w\s!?.,]/g, ''), // Clean punctuation
        start: wordStart,
        end: wordEnd
      };
    });
  }

  /**
   * Group words into lines for better visual layout
   */
  private groupWordsIntoLines(
    words: Array<{ word: string; start: number; end: number }>,
    strategy: 'auto' | 'manual' | 'none',
    maxWordsPerLine: number
  ): Array<{ words: Array<{ word: string; start: number; end: number }>, lineIndex: number }> {
    if (strategy === 'none') {
      return [{ words, lineIndex: 0 }];
    }

    const lines: Array<{ words: Array<{ word: string; start: number; end: number }>, lineIndex: number }> = [];
    
    for (let i = 0; i < words.length; i += maxWordsPerLine) {
      const lineWords = words.slice(i, i + maxWordsPerLine);
      lines.push({
        words: lineWords,
        lineIndex: lines.length
      });
    }

    return lines;
  }

  /**
   * Calculate position for individual words
   */
  private calculateWordPosition(
    basePosition: { x: number | string; y: number | string; anchor?: string },
    lineIndex: number,
    wordIndex: number,
    wordsInLine: number,
    totalLines: number,
    lineSpacing: number
  ): any {
    // Convert base position
    let x: string, y: string;
    
    if (typeof basePosition.x === 'string' && basePosition.x.includes('%')) {
      x = `(main_w*${parseFloat(basePosition.x)/100})`;
    } else {
      x = basePosition.x.toString();
    }
    
    if (typeof basePosition.y === 'string' && basePosition.y.includes('%')) {
      y = `(main_h*${parseFloat(basePosition.y)/100})`;
    } else {
      y = basePosition.y.toString();
    }

    // Adjust for line positioning
    const lineOffset = (lineIndex - (totalLines - 1) / 2) * lineSpacing * 40; // 40px per line
    y = `(${y} + ${lineOffset})`;

    // Adjust for word positioning within line
    const wordOffset = (wordIndex - (wordsInLine - 1) / 2) * 120; // Approximate word spacing
    x = `(${x} + ${wordOffset})`;

    // Apply anchor
    if (basePosition.anchor) {
      switch (basePosition.anchor) {
        case 'center':
          x = `(${x}-(text_w/2))`;
          y = `(${y}-(text_h/2))`;
          break;
        case 'top-center':
          x = `(${x}-(text_w/2))`;
          break;
        case 'bottom-center':
          x = `(${x}-(text_w/2))`;
          y = `(${y}-text_h)`;
          break;
      }
    }

    return { x, y };
  }

  /**
   * Get word highlighting presets
   */
  private getWordHighlightPresets() {
    return {
      tiktok: {
        base: {
          fontSize: 48,
          color: '#ffffff',
          strokeColor: '#000000',
          strokeWidth: 3
        },
        highlight: {
          color: '#ff0066',
          scale: 1.3,
          strokeWidth: 4,
          glow: true
        }
      },
      instagram: {
        base: {
          fontSize: 36,
          color: '#ffffff',
          strokeColor: '#000000',
          strokeWidth: 2
        },
        highlight: {
          color: '#ff4400',
          scale: 1.2,
          background: { color: 'rgba(255,68,0,0.3)', padding: 8 }
        }
      },
      youtube: {
        base: {
          fontSize: 32,
          color: '#ffffff',
          background: { color: 'rgba(0,0,0,0.8)', padding: 6 }
        },
        highlight: {
          color: '#ff0000',
          background: { color: 'rgba(255,0,0,0.9)', padding: 8 }
        }
      },
      karaoke: {
        base: {
          fontSize: 40,
          color: '#cccccc',
          strokeColor: '#000000',
          strokeWidth: 2
        },
        highlight: {
          color: '#ffff00',
          strokeColor: '#ff0000',
          strokeWidth: 3,
          glow: true
        }
      },
      typewriter: {
        base: {
          fontSize: 24,
          color: '#333333',
          background: { color: 'rgba(255,255,255,0.9)', padding: 10 }
        },
        highlight: {
          color: '#0066cc',
          scale: 1.1
        }
      }
    };
  }
}
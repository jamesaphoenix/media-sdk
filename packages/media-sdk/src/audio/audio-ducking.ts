/**
 * @fileoverview Audio Ducking functionality
 * 
 * Automatically reduces background music volume when voice/narration is present
 */

import { Timeline } from '../timeline/timeline.js';
import type { TimelineLayer } from '../types/index.js';

export interface DuckingOptions {
  // Target levels
  duckingLevel?: number; // 0-1, how much to reduce background (0.3 = 30% of original)
  voiceBoost?: number; // 0-2, how much to boost voice (1.2 = 120% of original)
  
  // Timing
  fadeInTime?: number; // Seconds to fade down background
  fadeOutTime?: number; // Seconds to fade back up
  holdTime?: number; // Seconds to hold ducked level after voice ends
  anticipation?: number; // Seconds to start ducking before voice
  
  // Detection
  detectionMode?: 'manual' | 'automatic' | 'sidechain';
  detectionThreshold?: number; // dB threshold for automatic detection
  
  // Advanced
  frequencyDucking?: boolean; // Duck only certain frequencies
  duckingFrequencies?: { low: number; high: number }; // Hz range
  compressorRatio?: number; // Compression ratio for sidechain
  
  // Tracks
  backgroundTrack?: number | string; // Track index or identifier
  voiceTrack?: number | string; // Track index or identifier
  duckingRegions?: Array<{ start: number; end: number }>; // Manual regions
}

export interface AutoDuckingAnalysis {
  detectedRegions: Array<{ start: number; end: number; confidence: number }>;
  suggestedLevel: number;
  warnings?: string[];
}

export class AudioDucking {
  /**
   * Add automatic audio ducking to a timeline
   * 
   * @example
   * ```typescript
   * const ducked = AudioDucking.addDucking(timeline, {
   *   duckingLevel: 0.3,
   *   fadeInTime: 0.3,
   *   fadeOutTime: 0.5,
   *   voiceTrack: 1,
   *   backgroundTrack: 0
   * });
   * ```
   */
  static addDucking(
    timeline: Timeline,
    options: DuckingOptions = {}
  ): Timeline {
    const {
      duckingLevel = 0.3,
      voiceBoost = 1.0,
      fadeInTime = 0.3,
      fadeOutTime = 0.5,
      holdTime = 0.1,
      anticipation = 0.1,
      detectionMode = 'manual',
      detectionThreshold = -20,
      frequencyDucking = false,
      duckingFrequencies = { low: 200, high: 4000 },
      compressorRatio = 4,
      backgroundTrack = 0,
      voiceTrack = 1,
      duckingRegions = []
    } = options;

    // Get audio layers
    const audioLayers = timeline.getLayers().filter(layer => layer.type === 'audio');
    
    if (audioLayers.length < 2) {
      console.warn('Audio ducking requires at least 2 audio tracks');
      return timeline;
    }

    // Build ducking filter based on mode
    let duckingFilter = '';
    
    if (detectionMode === 'sidechain') {
      // Use sidechain compression
      duckingFilter = this.buildSidechainFilter({
        duckingLevel,
        compressorRatio,
        fadeInTime,
        fadeOutTime,
        frequencyDucking,
        duckingFrequencies
      });
    } else if (detectionMode === 'automatic') {
      // Use automatic envelope detection
      duckingFilter = this.buildAutoDetectionFilter({
        duckingLevel,
        detectionThreshold,
        fadeInTime,
        fadeOutTime,
        holdTime,
        anticipation
      });
    } else {
      // Manual regions
      duckingFilter = this.buildManualDuckingFilter({
        duckingRegions,
        duckingLevel,
        fadeInTime,
        fadeOutTime,
        holdTime,
        anticipation
      });
    }

    // Apply the ducking filter
    return timeline.addFilter({
      name: 'custom',
      options: { filter: duckingFilter }
    });
  }

  /**
   * Create ducking with manual voice regions
   * 
   * @example
   * ```typescript
   * const ducked = AudioDucking.duckAtRegions(timeline, [
   *   { start: 5, end: 10 },   // Duck from 5-10 seconds
   *   { start: 15, end: 20 },  // Duck from 15-20 seconds
   *   { start: 25, end: 35 }   // Duck from 25-35 seconds
   * ]);
   * ```
   */
  static duckAtRegions(
    timeline: Timeline,
    regions: Array<{ start: number; end: number }>,
    options: Partial<DuckingOptions> = {}
  ): Timeline {
    return this.addDucking(timeline, {
      ...options,
      detectionMode: 'manual',
      duckingRegions: regions
    });
  }

  /**
   * Create ducking for dialogue scenes
   * 
   * @example
   * ```typescript
   * const dialogue = AudioDucking.createDialogueMix(timeline, {
   *   dialogueTrack: 'voice.mp3',
   *   musicTrack: 'background.mp3',
   *   ambienceTrack: 'ambience.mp3',
   *   dialogueBoost: 1.5
   * });
   * ```
   */
  static createDialogueMix(
    timeline: Timeline,
    options: {
      dialogueTrack: string;
      musicTrack?: string;
      ambienceTrack?: string;
      soundEffectsTrack?: string;
      dialogueBoost?: number;
      musicDuckLevel?: number;
      ambienceDuckLevel?: number;
    }
  ): Timeline {
    const {
      dialogueTrack,
      musicTrack,
      ambienceTrack,
      soundEffectsTrack,
      dialogueBoost = 1.2,
      musicDuckLevel = 0.2,
      ambienceDuckLevel = 0.5
    } = options;

    let result = timeline;

    // Add dialogue with boost
    result = result.addAudio(dialogueTrack, { volume: dialogueBoost });

    // Add music with ducking
    if (musicTrack) {
      result = result.addAudio(musicTrack, { volume: 1.0 });
      result = this.addDucking(result, {
        backgroundTrack: musicTrack,
        voiceTrack: dialogueTrack,
        duckingLevel: musicDuckLevel,
        detectionMode: 'sidechain'
      });
    }

    // Add ambience with less aggressive ducking
    if (ambienceTrack) {
      result = result.addAudio(ambienceTrack, { volume: 0.8 });
      result = this.addDucking(result, {
        backgroundTrack: ambienceTrack,
        voiceTrack: dialogueTrack,
        duckingLevel: ambienceDuckLevel,
        fadeInTime: 0.5,
        fadeOutTime: 1.0
      });
    }

    // Sound effects typically don't get ducked
    if (soundEffectsTrack) {
      result = result.addAudio(soundEffectsTrack, { volume: 1.0 });
    }

    return result;
  }

  /**
   * Create podcast/interview mix with auto-ducking
   * 
   * @example
   * ```typescript
   * const podcast = AudioDucking.createPodcastMix(timeline, {
   *   hosts: ['host1.mp3', 'host2.mp3'],
   *   music: 'intro-music.mp3',
   *   musicSegments: [
   *     { start: 0, end: 10 },    // Intro
   *     { start: 300, end: 310 }  // Outro
   *   ]
   * });
   * ```
   */
  static createPodcastMix(
    timeline: Timeline,
    options: {
      hosts: string[];
      music?: string;
      musicSegments?: Array<{ start: number; end: number }>;
      crossTalk?: boolean; // Allow multiple hosts simultaneously
      introOutroDucking?: number;
      normalDucking?: number;
    }
  ): Timeline {
    const {
      hosts,
      music,
      musicSegments = [],
      crossTalk = true,
      introOutroDucking = 0.6,
      normalDucking = 0.15
    } = options;

    let result = timeline;

    // Add host audio tracks
    hosts.forEach((host, index) => {
      result = result.addAudio(host, { 
        volume: 1.0,
        // Pan hosts slightly for stereo separation
        pan: index === 0 ? -0.3 : index === 1 ? 0.3 : 0
      });
    });

    // Add music if provided
    if (music) {
      result = result.addAudio(music, { volume: 1.0 });

      // Apply different ducking levels for different segments
      musicSegments.forEach(segment => {
        const isIntroOutro = segment.start === 0 || segment.end > 250;
        const duckLevel = isIntroOutro ? introOutroDucking : normalDucking;

        result = this.duckAtRegions(result, [segment], {
          duckingLevel: duckLevel,
          fadeInTime: 1.0,
          fadeOutTime: 2.0,
          backgroundTrack: music
        });
      });
    }

    return result;
  }

  /**
   * Analyze audio for optimal ducking settings
   * 
   * @example
   * ```typescript
   * const analysis = await AudioDucking.analyzeForDucking(timeline);
   * console.log('Detected voice regions:', analysis.detectedRegions);
   * console.log('Suggested ducking level:', analysis.suggestedLevel);
   * ```
   */
  static async analyzeForDucking(
    timeline: Timeline,
    options: {
      voiceTrack?: number | string;
      backgroundTrack?: number | string;
      detectionSensitivity?: number;
    } = {}
  ): Promise<AutoDuckingAnalysis> {
    // This would require actual audio analysis
    // For now, return mock data
    console.warn('Audio analysis requires FFmpeg audio processing - returning mock data');
    
    return {
      detectedRegions: [
        { start: 5, end: 10, confidence: 0.95 },
        { start: 15, end: 25, confidence: 0.88 },
        { start: 30, end: 35, confidence: 0.92 }
      ],
      suggestedLevel: 0.3,
      warnings: ['Consider increasing fade time for smoother transitions']
    };
  }

  /**
   * Build sidechain compression filter
   * @private
   */
  private static buildSidechainFilter(options: {
    duckingLevel: number;
    compressorRatio: number;
    fadeInTime: number;
    fadeOutTime: number;
    frequencyDucking: boolean;
    duckingFrequencies: { low: number; high: number };
  }): string {
    const {
      duckingLevel,
      compressorRatio,
      fadeInTime,
      fadeOutTime,
      frequencyDucking,
      duckingFrequencies
    } = options;

    // Build sidechain compressor filter
    let filter = `[0:a][1:a]sidechaincompress=` +
      `threshold=0.05:` +
      `ratio=${compressorRatio}:` +
      `attack=${fadeInTime * 1000}:` +
      `release=${fadeOutTime * 1000}:` +
      `makeup=${1 / duckingLevel}:` +
      `knee=2.5:` +
      `detection=peak`;

    if (frequencyDucking) {
      // Add frequency-specific ducking
      filter = `[0:a]highpass=f=${duckingFrequencies.low},lowpass=f=${duckingFrequencies.high}[band];` +
               `[band][1:a]${filter}`;
    }

    return filter;
  }

  /**
   * Build automatic detection filter
   * @private
   */
  private static buildAutoDetectionFilter(options: {
    duckingLevel: number;
    detectionThreshold: number;
    fadeInTime: number;
    fadeOutTime: number;
    holdTime: number;
    anticipation: number;
  }): string {
    const {
      duckingLevel,
      detectionThreshold,
      fadeInTime,
      fadeOutTime,
      holdTime,
      anticipation
    } = options;

    // Use envelope follower and gate for automatic detection
    return `[1:a]agate=` +
      `threshold=${Math.pow(10, detectionThreshold / 20)}:` +
      `attack=${anticipation * 1000}:` +
      `release=${holdTime * 1000}:` +
      `detection=peak[gate];` +
      `[0:a][gate]sidechaincompress=` +
      `threshold=0.1:` +
      `ratio=10:` +
      `attack=${fadeInTime * 1000}:` +
      `release=${fadeOutTime * 1000}:` +
      `makeup=${1 / duckingLevel}`;
  }

  /**
   * Build manual ducking filter with regions
   * @private
   */
  private static buildManualDuckingFilter(options: {
    duckingRegions: Array<{ start: number; end: number }>;
    duckingLevel: number;
    fadeInTime: number;
    fadeOutTime: number;
    holdTime: number;
    anticipation: number;
  }): string {
    const {
      duckingRegions,
      duckingLevel,
      fadeInTime,
      fadeOutTime,
      holdTime,
      anticipation
    } = options;

    if (duckingRegions.length === 0) {
      return '[0:a]anull[a]'; // Pass through
    }

    // Build volume expression for manual regions
    let volumeExpr = '1'; // Default volume

    duckingRegions.forEach(region => {
      const startFade = region.start - anticipation;
      const endFade = startFade + fadeInTime;
      const startRestore = region.end + holdTime;
      const endRestore = startRestore + fadeOutTime;

      // Add smooth transitions
      volumeExpr = `if(between(t,${startFade},${endFade}),` +
        `1-(1-${duckingLevel})*(t-${startFade})/${fadeInTime},` +
        `if(between(t,${endFade},${startRestore}),${duckingLevel},` +
        `if(between(t,${startRestore},${endRestore}),` +
        `${duckingLevel}+(1-${duckingLevel})*(t-${startRestore})/${fadeOutTime},` +
        `${volumeExpr})))`;
    });

    return `[0:a]volume='${volumeExpr}':eval=frame[a]`;
  }

  /**
   * Create a music bed with automatic ducking points
   * 
   * @example
   * ```typescript
   * const musicBed = AudioDucking.createMusicBed(timeline, {
   *   music: 'background-music.mp3',
   *   duckingPoints: [
   *     { time: 10, duration: 5, reason: 'voiceover' },
   *     { time: 30, duration: 3, reason: 'announcement' }
   *   ]
   * });
   * ```
   */
  static createMusicBed(
    timeline: Timeline,
    options: {
      music: string;
      duckingPoints: Array<{
        time: number;
        duration: number;
        level?: number;
        reason?: string;
      }>;
      fadeIn?: number;
      fadeOut?: number;
      baseVolume?: number;
    }
  ): Timeline {
    const {
      music,
      duckingPoints,
      fadeIn = 2,
      fadeOut = 3,
      baseVolume = 0.8
    } = options;

    // Add music with base volume
    let result = timeline.addAudio(music, { 
      volume: baseVolume,
      fadeIn: fadeIn,
      fadeOut: fadeOut
    });

    // Convert ducking points to regions
    const regions = duckingPoints.map(point => ({
      start: point.time,
      end: point.time + point.duration
    }));

    // Apply ducking at specified points
    result = this.duckAtRegions(result, regions, {
      duckingLevel: duckingPoints[0]?.level || 0.2,
      fadeInTime: 0.5,
      fadeOutTime: 1.0
    });

    return result;
  }
}

// Add convenience methods to Timeline
declare module '../timeline/timeline.js' {
  interface Timeline {
    /**
     * Add audio ducking
     */
    addAudioDucking(options?: DuckingOptions): Timeline;
    
    /**
     * Duck audio at specific regions
     */
    duckAudioAt(regions: Array<{ start: number; end: number }>, options?: Partial<DuckingOptions>): Timeline;
  }
}

Timeline.prototype.addAudioDucking = function(options?: DuckingOptions): Timeline {
  return AudioDucking.addDucking(this, options);
};

Timeline.prototype.duckAudioAt = function(
  regions: Array<{ start: number; end: number }>, 
  options?: Partial<DuckingOptions>
): Timeline {
  return AudioDucking.duckAtRegions(this, regions, options);
};
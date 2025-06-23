/**
 * @fileoverview Advanced Multi-Caption Engine
 * 
 * Sophisticated caption management system supporting multiple languages,
 * precise timing, advanced styling, and seamless synchronization.
 * 
 * @author Media SDK Team
 * @version 2.0.0
 * @since 2024-12-23
 */

import type { TextOptions, Position } from '../types/index.js';

/**
 * Caption track configuration
 */
export interface CaptionTrack {
  /** Unique identifier for the track */
  id: string;
  
  /** Language code (ISO 639-1) */
  language: string;
  
  /** Human-readable language name */
  languageName: string;
  
  /** Caption entries in this track */
  captions: CaptionEntry[];
  
  /** Default styling for this track */
  defaultStyle?: CaptionStyle;
  
  /** Track-specific positioning */
  position?: Position;
  
  /** Whether this track is enabled */
  enabled: boolean;
  
  /** Priority for display (higher = more important) */
  priority: number;
}

/**
 * Individual caption entry
 */
export interface CaptionEntry {
  /** Unique identifier */
  id: string;
  
  /** Caption text content */
  text: string;
  
  /** Start time in seconds */
  startTime: number;
  
  /** End time in seconds */
  endTime: number;
  
  /** Entry-specific styling (overrides track defaults) */
  style?: Partial<CaptionStyle>;
  
  /** Entry-specific positioning */
  position?: Position;
  
  /** Animation/transition for this entry */
  animation?: CaptionAnimation;
  
  /** Confidence score for AI-generated captions */
  confidence?: number;
  
  /** Metadata for the caption */
  metadata?: Record<string, any>;
}

/**
 * Advanced caption styling options
 */
export interface CaptionStyle {
  /** Font family */
  fontFamily: string;
  
  /** Font size in pixels */
  fontSize: number;
  
  /** Font weight */
  fontWeight: 'normal' | 'bold' | 'lighter' | 'bolder' | number;
  
  /** Font style */
  fontStyle: 'normal' | 'italic' | 'oblique';
  
  /** Text color */
  color: string;
  
  /** Background color */
  backgroundColor?: string;
  
  /** Text stroke color */
  strokeColor?: string;
  
  /** Text stroke width */
  strokeWidth?: number;
  
  /** Text shadow */
  shadow?: {
    offsetX: number;
    offsetY: number;
    blur: number;
    color: string;
  };
  
  /** Text alignment */
  textAlign: 'left' | 'center' | 'right' | 'justify';
  
  /** Line height multiplier */
  lineHeight: number;
  
  /** Letter spacing */
  letterSpacing?: number;
  
  /** Word spacing */
  wordSpacing?: number;
  
  /** Text decoration */
  textDecoration?: 'none' | 'underline' | 'overline' | 'line-through';
  
  /** Opacity (0-1) */
  opacity: number;
  
  /** Padding around text */
  padding: {
    top: number;
    right: number;
    bottom: number;
    left: number;
  };
  
  /** Border radius for background */
  borderRadius?: number;
  
  /** Border properties */
  border?: {
    width: number;
    style: 'solid' | 'dashed' | 'dotted';
    color: string;
  };
}

/**
 * Caption animation configuration
 */
export interface CaptionAnimation {
  /** Animation type */
  type: 'fade-in' | 'fade-out' | 'slide-in' | 'slide-out' | 'zoom-in' | 'zoom-out' | 
        'typewriter' | 'wave' | 'bounce' | 'pulse' | 'shake' | 'glow' | 'rainbow';
  
  /** Animation duration in seconds */
  duration: number;
  
  /** Animation delay in seconds */
  delay?: number;
  
  /** Easing function */
  easing?: 'linear' | 'ease-in' | 'ease-out' | 'ease-in-out' | 'bounce';
  
  /** Animation direction for directional effects */
  direction?: 'up' | 'down' | 'left' | 'right';
  
  /** Custom animation parameters */
  params?: Record<string, any>;
}

/**
 * Caption synchronization options
 */
export interface SyncOptions {
  /** Auto-adjust timing based on audio */
  audioSync: boolean;
  
  /** Minimum caption display duration */
  minDuration: number;
  
  /** Maximum caption display duration */
  maxDuration: number;
  
  /** Gap between captions */
  gap: number;
  
  /** Reading speed in words per minute */
  readingSpeed: number;
  
  /** Auto-break long captions */
  autoBreak: boolean;
  
  /** Maximum characters per line */
  maxCharsPerLine: number;
  
  /** Maximum lines per caption */
  maxLines: number;
}

/**
 * Caption format for export/import
 */
export interface CaptionFormat {
  /** Format type */
  format: 'srt' | 'vtt' | 'ass' | 'ssa' | 'sbv' | 'ttml' | 'json';
  
  /** Format-specific options */
  options?: Record<string, any>;
}

/**
 * Advanced Multi-Caption Engine
 * 
 * Comprehensive caption management system supporting multiple languages,
 * precise timing, advanced styling, animations, and synchronization.
 * 
 * @example
 * ```typescript
 * const captionEngine = new MultiCaptionEngine();
 * 
 * // Add English track
 * const englishTrack = captionEngine.createTrack('en', 'English');
 * englishTrack.addCaption('Hello World!', 1.0, 3.0);
 * 
 * // Add Spanish track
 * const spanishTrack = captionEngine.createTrack('es', 'Español');
 * spanishTrack.addCaption('¡Hola Mundo!', 1.0, 3.0);
 * 
 * // Generate FFmpeg filters
 * const filters = captionEngine.generateFilters();
 * ```
 */
export class MultiCaptionEngine {
  private tracks: Map<string, CaptionTrack> = new Map();
  private globalDefaults: Partial<CaptionStyle> = {
    fontFamily: 'Arial',
    fontSize: 32,
    fontWeight: 'bold',
    color: '#ffffff',
    strokeColor: '#000000',
    strokeWidth: 2,
    textAlign: 'center',
    lineHeight: 1.2,
    opacity: 1.0,
    padding: { top: 8, right: 12, bottom: 8, left: 12 }
  };
  
  private syncOptions: SyncOptions = {
    audioSync: false,
    minDuration: 1.0,
    maxDuration: 7.0,
    gap: 0.1,
    readingSpeed: 200,
    autoBreak: true,
    maxCharsPerLine: 60,
    maxLines: 2
  };

  /**
   * Set global default styling
   */
  setGlobalDefaults(defaults: Partial<CaptionStyle>): void {
    this.globalDefaults = { ...this.globalDefaults, ...defaults };
  }

  /**
   * Set synchronization options
   */
  setSyncOptions(options: Partial<SyncOptions>): void {
    this.syncOptions = { ...this.syncOptions, ...options };
  }

  /**
   * Create a new caption track
   */
  createTrack(
    language: string, 
    languageName: string, 
    options?: {
      defaultStyle?: Partial<CaptionStyle>;
      position?: Position;
      priority?: number;
    }
  ): CaptionTrack {
    const track: CaptionTrack = {
      id: `track_${language}_${Date.now()}`,
      language,
      languageName,
      captions: [],
      defaultStyle: { ...this.globalDefaults, ...options?.defaultStyle },
      position: options?.position,
      enabled: true,
      priority: options?.priority || 1
    };

    this.tracks.set(track.id, track);
    return track;
  }

  /**
   * Get track by ID
   */
  getTrack(trackId: string): CaptionTrack | undefined {
    return this.tracks.get(trackId);
  }

  /**
   * Get track by language
   */
  getTrackByLanguage(language: string): CaptionTrack | undefined {
    for (const track of this.tracks.values()) {
      if (track.language === language) {
        return track;
      }
    }
    return undefined;
  }

  /**
   * Get all tracks
   */
  getAllTracks(): CaptionTrack[] {
    return Array.from(this.tracks.values()).sort((a, b) => b.priority - a.priority);
  }

  /**
   * Add caption to a track
   */
  addCaption(
    trackId: string,
    text: string,
    startTime: number,
    endTime: number,
    options?: {
      style?: Partial<CaptionStyle>;
      position?: Position;
      animation?: CaptionAnimation;
      metadata?: Record<string, any>;
    }
  ): CaptionEntry {
    const track = this.tracks.get(trackId);
    if (!track) {
      throw new Error(`Track not found: ${trackId}`);
    }

    const caption: CaptionEntry = {
      id: `caption_${trackId}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      text,
      startTime,
      endTime,
      style: options?.style,
      position: options?.position,
      animation: options?.animation,
      metadata: options?.metadata
    };

    track.captions.push(caption);
    
    // Sort captions by start time
    track.captions.sort((a, b) => a.startTime - b.startTime);
    
    return caption;
  }

  /**
   * Add multiple captions with auto-timing
   */
  addCaptionSequence(
    trackId: string,
    texts: string[],
    startTime: number,
    options?: {
      spacing?: number;
      duration?: number;
      style?: Partial<CaptionStyle>;
      animation?: CaptionAnimation;
    }
  ): CaptionEntry[] {
    const captions: CaptionEntry[] = [];
    const spacing = options?.spacing || 0.1;
    let currentTime = startTime;

    for (const text of texts) {
      const duration = options?.duration || this.calculateOptimalDuration(text);
      const caption = this.addCaption(
        trackId,
        text,
        currentTime,
        currentTime + duration,
        {
          style: options?.style,
          animation: options?.animation
        }
      );
      
      captions.push(caption);
      currentTime += duration + spacing;
    }

    return captions;
  }

  /**
   * Calculate optimal duration for a caption based on reading speed
   */
  private calculateOptimalDuration(text: string): number {
    const words = text.split(/\s+/).length;
    const duration = (words / this.syncOptions.readingSpeed) * 60;
    
    return Math.max(
      this.syncOptions.minDuration,
      Math.min(this.syncOptions.maxDuration, duration)
    );
  }

  /**
   * Auto-break long text into multiple lines
   */
  private breakText(text: string): string[] {
    const words = text.split(' ');
    const lines: string[] = [];
    let currentLine = '';

    for (const word of words) {
      const testLine = currentLine ? `${currentLine} ${word}` : word;
      
      if (testLine.length <= this.syncOptions.maxCharsPerLine) {
        currentLine = testLine;
      } else {
        if (currentLine) {
          lines.push(currentLine);
        }
        currentLine = word;
      }
    }

    if (currentLine) {
      lines.push(currentLine);
    }

    return lines.slice(0, this.syncOptions.maxLines);
  }

  /**
   * Synchronize captions with audio cues
   */
  synchronizeWithAudio(trackId: string, audioCues: Array<{ time: number; confidence: number }>): void {
    const track = this.tracks.get(trackId);
    if (!track) return;

    // Adjust caption timing based on audio cues
    track.captions.forEach((caption, index) => {
      const nearestCue = audioCues.find(cue => 
        Math.abs(cue.time - caption.startTime) < 1.0
      );

      if (nearestCue && nearestCue.confidence > 0.8) {
        const adjustment = nearestCue.time - caption.startTime;
        caption.startTime += adjustment;
        caption.endTime += adjustment;
      }
    });

    // Re-sort after timing adjustments
    track.captions.sort((a, b) => a.startTime - b.startTime);
  }

  /**
   * Generate FFmpeg filter string for caption rendering
   */
  generateFilters(enabledLanguages?: string[]): string {
    const filters: string[] = [];
    let inputIndex = 0;

    // Get enabled tracks
    const enabledTracks = this.getAllTracks().filter(track => {
      if (!track.enabled) return false;
      if (enabledLanguages && !enabledLanguages.includes(track.language)) return false;
      return track.captions.length > 0;
    });

    for (const track of enabledTracks) {
      const trackFilters = this.generateTrackFilters(track, inputIndex);
      filters.push(...trackFilters);
      inputIndex++;
    }

    return filters.join(';');
  }

  /**
   * Generate filters for a specific track
   */
  private generateTrackFilters(track: CaptionTrack, streamIndex: number): string[] {
    const filters: string[] = [];
    
    for (const caption of track.captions) {
      const filter = this.generateCaptionFilter(caption, track, streamIndex);
      if (filter) {
        filters.push(filter);
      }
    }

    return filters;
  }

  /**
   * Generate FFmpeg filter for a single caption
   */
  private generateCaptionFilter(
    caption: CaptionEntry, 
    track: CaptionTrack, 
    streamIndex: number
  ): string {
    const style = { ...track.defaultStyle, ...caption.style };
    const position = caption.position || track.position || { x: '(w-text_w)/2', y: '(h-text_h)/2' };
    
    // Handle multi-line text
    const lines = this.syncOptions.autoBreak ? 
      this.breakText(caption.text) : 
      [caption.text];
    
    const escapedText = lines.join('\\n').replace(/'/g, "\\'");

    // Build drawtext filter
    let filter = `drawtext=text='${escapedText}'`;
    
    // Add styling
    filter += `:fontfile=${style.fontFamily}`;
    filter += `:fontsize=${style.fontSize}`;
    filter += `:fontcolor=${style.color}`;
    
    if (style.strokeColor && style.strokeWidth) {
      filter += `:borderw=${style.strokeWidth}:bordercolor=${style.strokeColor}`;
    }
    
    if (style.backgroundColor) {
      filter += `:box=1:boxcolor=${style.backgroundColor}`;
      if (style.padding) {
        filter += `:boxborderw=${style.padding.left}`;
      }
    }

    // Add positioning
    if (typeof position.x === 'number') {
      filter += `:x=${position.x}`;
    } else {
      filter += `:x=${position.x}`;
    }
    
    if (typeof position.y === 'number') {
      filter += `:y=${position.y}`;
    } else {
      filter += `:y=${position.y}`;
    }

    // Add timing
    filter += `:enable='between(t,${caption.startTime},${caption.endTime})'`;

    // Add animation if present
    if (caption.animation) {
      filter = this.addAnimationToFilter(filter, caption.animation, caption);
    }

    return filter;
  }

  /**
   * Add animation effects to filter
   */
  private addAnimationToFilter(
    filter: string, 
    animation: CaptionAnimation, 
    caption: CaptionEntry
  ): string {
    const { type, duration, delay = 0, easing = 'linear' } = animation;
    const animStart = caption.startTime + delay;
    const animEnd = animStart + duration;

    switch (type) {
      case 'fade-in':
        filter += `:alpha='if(between(t,${animStart},${animEnd}),(t-${animStart})/${duration},1)'`;
        break;
        
      case 'fade-out':
        filter += `:alpha='if(between(t,${caption.endTime - duration},${caption.endTime}),1-(t-${caption.endTime - duration})/${duration},1)'`;
        break;
        
      case 'slide-in':
        const direction = animation.direction || 'left';
        if (direction === 'left') {
          filter = filter.replace(/:x=([^:]+)/, `:x='if(between(t,${animStart},${animEnd}),$1-w+(t-${animStart})/${duration}*w,$1)'`);
        }
        break;
        
      case 'zoom-in':
        filter = filter.replace(/:fontsize=(\d+)/, `:fontsize='if(between(t,${animStart},${animEnd}),$1*(t-${animStart})/${duration},$1)'`);
        break;
        
      case 'typewriter':
        // Typewriter effect using text length
        const charCount = caption.text.length;
        filter = filter.replace(/text='([^']+)'/, `text='substr($1,0,${charCount}*(t-${animStart})/${duration})'`);
        break;
        
      case 'bounce':
        filter += `:y=y+10*sin(2*PI*t)`;
        break;
        
      case 'pulse':
        filter = filter.replace(/:fontsize=(\d+)/, `:fontsize='$1+5*sin(4*PI*t)'`);
        break;
        
      case 'glow':
        filter += `:shadowcolor=yellow:shadowx=0:shadowy=0`;
        break;
    }

    return filter;
  }

  /**
   * Export captions in various formats
   */
  exportCaptions(trackId: string, format: CaptionFormat): string {
    const track = this.tracks.get(trackId);
    if (!track) {
      throw new Error(`Track not found: ${trackId}`);
    }

    switch (format.format) {
      case 'srt':
        return this.exportToSRT(track);
      case 'vtt':
        return this.exportToVTT(track);
      case 'ass':
        return this.exportToASS(track);
      case 'json':
        return this.exportToJSON(track);
      default:
        throw new Error(`Unsupported format: ${format.format}`);
    }
  }

  /**
   * Export to SRT format
   */
  private exportToSRT(track: CaptionTrack): string {
    let srt = '';
    
    track.captions.forEach((caption, index) => {
      const startTime = this.formatSRTTime(caption.startTime);
      const endTime = this.formatSRTTime(caption.endTime);
      
      srt += `${index + 1}\n`;
      srt += `${startTime} --> ${endTime}\n`;
      srt += `${caption.text}\n\n`;
    });

    return srt;
  }

  /**
   * Export to WebVTT format
   */
  private exportToVTT(track: CaptionTrack): string {
    let vtt = 'WEBVTT\n\n';
    
    track.captions.forEach((caption) => {
      const startTime = this.formatVTTTime(caption.startTime);
      const endTime = this.formatVTTTime(caption.endTime);
      
      vtt += `${startTime} --> ${endTime}\n`;
      vtt += `${caption.text}\n\n`;
    });

    return vtt;
  }

  /**
   * Export to ASS/SSA format
   */
  private exportToASS(track: CaptionTrack): string {
    let ass = '[Script Info]\nTitle: Generated Captions\nScriptType: v4.00+\n\n';
    ass += '[V4+ Styles]\nFormat: Name, Fontname, Fontsize, Color, SecondaryColour, OutlineColour, BackColour, Bold, Italic, Underline, StrikeOut, ScaleX, ScaleY, Spacing, Angle, BorderStyle, Outline, Shadow, Alignment, MarginL, MarginR, MarginV, Encoding\n';
    ass += 'Style: Default,Arial,32,&H00FFFFFF,&H000000FF,&H00000000,&H00000000,0,0,0,0,100,100,0,0,1,2,0,2,10,10,10,1\n\n';
    ass += '[Events]\nFormat: Layer, Start, End, Style, Name, MarginL, MarginR, MarginV, Effect, Text\n';
    
    track.captions.forEach((caption) => {
      const startTime = this.formatASSTime(caption.startTime);
      const endTime = this.formatASSTime(caption.endTime);
      
      ass += `Dialogue: 0,${startTime},${endTime},Default,,0,0,0,,${caption.text}\n`;
    });

    return ass;
  }

  /**
   * Export to JSON format
   */
  private exportToJSON(track: CaptionTrack): string {
    return JSON.stringify(track, null, 2);
  }

  /**
   * Format time for SRT (00:00:00,000)
   */
  private formatSRTTime(seconds: number): string {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = Math.floor(seconds % 60);
    const ms = Math.floor((seconds % 1) * 1000);
    
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')},${ms.toString().padStart(3, '0')}`;
  }

  /**
   * Format time for VTT (00:00:00.000)
   */
  private formatVTTTime(seconds: number): string {
    return this.formatSRTTime(seconds).replace(',', '.');
  }

  /**
   * Format time for ASS (0:00:00.00)
   */
  private formatASSTime(seconds: number): string {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = (seconds % 60).toFixed(2);
    
    return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.padStart(5, '0')}`;
  }

  /**
   * Import captions from various formats
   */
  importCaptions(trackId: string, content: string, format: CaptionFormat): void {
    const track = this.tracks.get(trackId);
    if (!track) {
      throw new Error(`Track not found: ${trackId}`);
    }

    switch (format.format) {
      case 'srt':
        this.importFromSRT(track, content);
        break;
      case 'vtt':
        this.importFromVTT(track, content);
        break;
      case 'json':
        this.importFromJSON(track, content);
        break;
      default:
        throw new Error(`Import not supported for format: ${format.format}`);
    }
  }

  /**
   * Import from SRT format
   */
  private importFromSRT(track: CaptionTrack, content: string): void {
    const blocks = content.trim().split('\n\n');
    
    for (const block of blocks) {
      const lines = block.split('\n');
      if (lines.length >= 3) {
        const timeLine = lines[1];
        const textLines = lines.slice(2);
        
        const timeMatch = timeLine.match(/(\d{2}:\d{2}:\d{2},\d{3}) --> (\d{2}:\d{2}:\d{2},\d{3})/);
        if (timeMatch) {
          const startTime = this.parseSRTTime(timeMatch[1]);
          const endTime = this.parseSRTTime(timeMatch[2]);
          const text = textLines.join('\n');
          
          this.addCaption(track.id, text, startTime, endTime);
        }
      }
    }
  }

  /**
   * Import from VTT format
   */
  private importFromVTT(track: CaptionTrack, content: string): void {
    const lines = content.split('\n');
    let i = 0;
    
    // Skip header
    while (i < lines.length && !lines[i].includes('-->')) {
      i++;
    }
    
    while (i < lines.length) {
      const line = lines[i];
      if (line.includes('-->')) {
        const timeMatch = line.match(/(\d{2}:\d{2}:\d{2}\.\d{3}) --> (\d{2}:\d{2}:\d{2}\.\d{3})/);
        if (timeMatch) {
          const startTime = this.parseVTTTime(timeMatch[1]);
          const endTime = this.parseVTTTime(timeMatch[2]);
          
          i++;
          const textLines: string[] = [];
          while (i < lines.length && lines[i].trim() !== '') {
            textLines.push(lines[i]);
            i++;
          }
          
          const text = textLines.join('\n');
          this.addCaption(track.id, text, startTime, endTime);
        }
      }
      i++;
    }
  }

  /**
   * Import from JSON format
   */
  private importFromJSON(track: CaptionTrack, content: string): void {
    const data = JSON.parse(content);
    if (data.captions && Array.isArray(data.captions)) {
      for (const caption of data.captions) {
        this.addCaption(
          track.id,
          caption.text,
          caption.startTime,
          caption.endTime,
          {
            style: caption.style,
            position: caption.position,
            animation: caption.animation,
            metadata: caption.metadata
          }
        );
      }
    }
  }

  /**
   * Parse SRT time format
   */
  private parseSRTTime(timeStr: string): number {
    const [time, ms] = timeStr.split(',');
    const [hours, minutes, seconds] = time.split(':').map(Number);
    return hours * 3600 + minutes * 60 + seconds + Number(ms) / 1000;
  }

  /**
   * Parse VTT time format
   */
  private parseVTTTime(timeStr: string): number {
    const [time, ms] = timeStr.split('.');
    const [hours, minutes, seconds] = time.split(':').map(Number);
    return hours * 3600 + minutes * 60 + seconds + Number(ms) / 1000;
  }

  /**
   * Get statistics for all tracks
   */
  getStatistics(): {
    totalTracks: number;
    totalCaptions: number;
    totalDuration: number;
    averageCaptionLength: number;
    languageDistribution: Record<string, number>;
  } {
    const tracks = this.getAllTracks();
    const totalTracks = tracks.length;
    let totalCaptions = 0;
    let totalDuration = 0;
    let totalTextLength = 0;
    const languageDistribution: Record<string, number> = {};

    for (const track of tracks) {
      totalCaptions += track.captions.length;
      languageDistribution[track.language] = track.captions.length;
      
      for (const caption of track.captions) {
        totalDuration += caption.endTime - caption.startTime;
        totalTextLength += caption.text.length;
      }
    }

    return {
      totalTracks,
      totalCaptions,
      totalDuration,
      averageCaptionLength: totalCaptions > 0 ? totalTextLength / totalCaptions : 0,
      languageDistribution
    };
  }
}
import { Timeline } from '../timeline/timeline.js';
import type { TextStyle, Position } from '../types/index.js';

export interface Word {
  word: string;
  start: number;
  end: number;
  confidence?: number;
}

export interface CaptionOptions {
  style?: TextStyle;
  position?: Position | string;
  duration?: number;
  startTime?: number;
  language?: string;
  label?: string;
  default?: boolean;
}

export interface AdvancedCaptionOptions extends CaptionOptions {
  activeStyle?: TextStyle & {
    scale?: number;
    opacity?: number;
  };
  inactiveStyle?: TextStyle & {
    scale?: number;
    opacity?: number;
  };
  animation?: {
    type: 'fade' | 'slide' | 'bounce' | 'typewriter';
    duration?: number;
    direction?: 'up' | 'down' | 'left' | 'right';
    distance?: number;
    scale?: number;
    speed?: number;
    fadeIn?: number;
    fadeOut?: number;
  };
}

export interface KaraokeOptions {
  text: string;
  start: number;
  duration: number;
  highlights: Array<{ start: number; end: number }>;
  style?: TextStyle & {
    baseColor?: string;
    highlightColor?: string;
  };
}

export interface SlideCaption {
  text: string;
  x: number | string;
  y: number | string;
  style?: TextStyle;
}

/**
 * Add basic captions from SRT or VTT file
 */
export function addCaptions(captionsPath: string, options: CaptionOptions = {}): (timeline: Timeline) => Timeline {
  return (timeline: Timeline) => {
    // In a real implementation, this would parse the SRT/VTT file
    // For now, we'll add it as a subtitle filter
    return timeline.addFilter('subtitles', {
      filename: captionsPath,
      style: options.style,
      position: options.position
    });
  };
}

/**
 * Add word-by-word captions with highlighting (TikTok style)
 */
export function addWordByWordCaptions(
  words: Word[],
  options: AdvancedCaptionOptions = {}
): (timeline: Timeline) => Timeline {
  return (timeline: Timeline) => {
    let result = timeline;

    words.forEach((word, index) => {
      // Add each word as a separate text overlay with timing
      result = result.addText(word.word, {
        position: options.position || 'center',
        style: {
          ...options.style,
          ...options.inactiveStyle
        },
        startTime: word.start,
        duration: word.end - word.start
      });

      // Add active styling for the current word
      if (options.activeStyle) {
        result = result.addText(word.word, {
          position: options.position || 'center',
          style: {
            ...options.style,
            ...options.activeStyle
          },
          startTime: word.start,
          duration: word.end - word.start
        });
      }
    });

    return result;
  };
}

/**
 * Generate captions with specific styling for each word
 */
export function addStyledWordCaptions(
  words: Array<Word & { style?: TextStyle }>,
  options: CaptionOptions = {}
): (timeline: Timeline) => Timeline {
  return (timeline: Timeline) => {
    let result = timeline;

    words.forEach(word => {
      result = result.addText(word.word, {
        position: options.position || 'center',
        style: {
          ...options.style,
          ...word.style
        },
        startTime: word.start,
        duration: word.end - word.start
      });
    });

    return result;
  };
}

/**
 * Add karaoke-style captions with progressive highlighting
 */
export function addKaraokeCaption(options: KaraokeOptions): (timeline: Timeline) => Timeline {
  return (timeline: Timeline) => {
    let result = timeline;

    // Add the base text
    result = result.addText(options.text, {
      position: 'center',
      style: {
        ...options.style,
        color: options.style?.baseColor || '#ffffff'
      },
      startTime: options.start,
      duration: options.duration
    });

    // Add highlighted segments
    options.highlights.forEach((highlight, index) => {
      const highlightDuration = highlight.end - highlight.start;
      
      result = result.addFilter('drawtext', {
        text: options.text,
        fontcolor: options.style?.highlightColor || '#ff0066',
        enable: `between(t,${options.start + highlight.start},${options.start + highlight.end})`
      });
    });

    return result;
  };
}

/**
 * Add multi-language caption tracks
 */
export function addMultiLanguageCaptions(
  captions: Array<{ path: string; language: string; label: string; default?: boolean }>
): (timeline: Timeline) => Timeline {
  return (timeline: Timeline) => {
    let result = timeline;

    captions.forEach(caption => {
      result = result.addFilter('subtitles', {
        filename: caption.path,
        language: caption.language,
        label: caption.label,
        default: caption.default || false
      });
    });

    return result;
  };
}

/**
 * Generate auto-captions from audio (placeholder for future implementation)
 */
export function generateCaptions(
  videoPath: string,
  options: {
    language?: string;
    service?: 'whisper' | 'google' | 'aws';
    apiKey?: string;
  } = {}
): Promise<Word[]> {
  // This would integrate with speech-to-text services
  // For now, return a placeholder
  return Promise.resolve([
    { word: "Generated", start: 0, end: 0.5 },
    { word: "caption", start: 0.5, end: 1.0 },
    { word: "placeholder", start: 1.0, end: 1.8 }
  ]);
}

/**
 * Create typewriter effect for text
 */
export function addTypewriterText(
  text: string,
  options: CaptionOptions & {
    speed?: number; // characters per second
    cursor?: boolean;
  } = {}
): (timeline: Timeline) => Timeline {
  const { speed = 10, cursor = true, ...captionOptions } = options;
  
  return (timeline: Timeline) => {
    let result = timeline;
    const chars = text.split('');
    
    chars.forEach((char, index) => {
      const displayText = text.substring(0, index + 1) + (cursor ? '|' : '');
      const startTime = (captionOptions.startTime || 0) + (index / speed);
      
      result = result.addText(displayText, {
        ...captionOptions,
        startTime,
        duration: 1 / speed
      });
    });

    return result;
  };
}

/**
 * Add animated text entrance
 */
export function addAnimatedText(
  text: string,
  animation: 'slideIn' | 'fadeIn' | 'scaleIn' | 'bounceIn',
  options: CaptionOptions & { animationDuration?: number } = {}
): (timeline: Timeline) => Timeline {
  const { animationDuration = 0.5, ...captionOptions } = options;
  
  return (timeline: Timeline) => {
    // This would require complex filter implementation
    // For now, just add the text with basic timing
    return timeline.addText(text, {
      ...captionOptions,
      startTime: (captionOptions.startTime || 0) + animationDuration
    });
  };
}

/**
 * Create dynamic positioning for captions to avoid overlaps
 */
export function addDynamicCaptions(
  words: Word[],
  options: AdvancedCaptionOptions & {
    avoidOverlap?: boolean;
    avoidAreas?: Array<{ x: number; y: number; width: number; height: number }>;
  } = {}
): (timeline: Timeline) => Timeline {
  return (timeline: Timeline) => {
    // This would implement collision detection and dynamic positioning
    // For now, use basic word-by-word captions
    return addWordByWordCaptions(words, options)(timeline);
  };
}

/**
 * Preset caption styles for different platforms
 */
export const captionPresets = {
  tiktok: {
    style: {
      fontSize: 56,
      fontFamily: 'Arial Black',
      color: '#ffffff',
      strokeColor: '#000000',
      strokeWidth: 3,
      fontWeight: 'bold'
    },
    position: 'center',
    animation: {
      type: 'bounce' as const,
      duration: 0.15
    }
  },
  
  youtube: {
    style: {
      fontSize: 28,
      fontFamily: 'Arial',
      color: '#ffffff',
      backgroundColor: 'rgba(0,0,0,0.8)',
      padding: 4
    },
    position: 'bottom'
  },
  
  instagram: {
    style: {
      fontSize: 36,
      fontFamily: 'Helvetica',
      color: '#ffffff',
      strokeColor: '#000000',
      strokeWidth: 2
    },
    position: 'center'
  },
  
  podcast: {
    style: {
      fontSize: 24,
      fontFamily: 'Georgia',
      color: '#333333',
      backgroundColor: 'rgba(255,255,255,0.9)',
      padding: 8,
      borderRadius: 4
    },
    position: 'bottom'
  }
};

/**
 * Apply platform-specific caption styling
 */
export function addPlatformCaptions(
  words: Word[],
  platform: keyof typeof captionPresets,
  customOptions: Partial<AdvancedCaptionOptions> = {}
): (timeline: Timeline) => Timeline {
  const preset = captionPresets[platform];
  const mergedOptions = {
    ...preset,
    ...customOptions,
    style: {
      ...preset.style,
      ...customOptions.style
    }
  };

  return addWordByWordCaptions(words, mergedOptions);
}
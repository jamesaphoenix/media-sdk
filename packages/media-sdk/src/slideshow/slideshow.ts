import { Timeline } from '../timeline/timeline.js';
import type { TextStyle, Dimensions } from '../types/index.js';
import type { SlideCaption } from '../captions/captions.js';

export interface Slide {
  image: string;
  duration: number;
  captions?: SlideCaption[];
  transition?: TransitionOptions;
}

export interface TransitionOptions {
  type: 'fade' | 'slide' | 'wipe' | 'zoom' | 'none';
  duration: number;
  direction?: 'left' | 'right' | 'up' | 'down';
  zoomLevel?: number;
}

export interface SlideshowOptions {
  width?: number;
  height?: number;
  fps?: number;
  transition?: TransitionOptions['type'];
  transitionDuration?: number;
  backgroundColor?: string;
  audio?: string;
  audioFadeIn?: number;
  audioFadeOut?: number;
  syncToAudio?: boolean;
}

export interface TitleSlideOptions {
  titleStyle?: TextStyle;
  subtitleStyle?: TextStyle;
  duration?: number;
  transition?: TransitionOptions;
}

export interface BulletSlideOptions {
  titleStyle?: TextStyle;
  bulletStyle?: TextStyle & {
    bullet?: string;
    lineHeight?: number;
  };
  duration?: number;
  transition?: TransitionOptions;
}

export interface KenBurnsOptions {
  duration: number;
  startRect: { x: number; y: number; width: number; height: number };
  endRect: { x: number; y: number; width: number; height: number };
  captions?: SlideCaption[];
}

export interface GridSlideOptions {
  title?: string;
  grid: Array<Array<{
    text?: string;
    image?: string;
    style?: TextStyle;
    fit?: 'contain' | 'cover' | 'fill';
  }>>;
  cellPadding?: number;
  duration?: number;
}

export interface ChartSlideOptions {
  title: string;
  chartType: 'bar' | 'line' | 'pie';
  data: {
    labels: string[];
    datasets: Array<{
      label: string;
      data: number[];
      color: string;
    }>;
  };
  duration?: number;
}

/**
 * Create a single slide with image and captions
 */
export function slide(image: string, duration: number, captions: SlideCaption[] = []): Timeline {
  let timeline = new Timeline()
    .addImage(image, {
      duration,
      position: { x: 0, y: 0 },
      scale: 1
    });

  // Add captions
  captions.forEach(caption => {
    timeline = timeline.addText(caption.text, {
      position: { x: caption.x, y: caption.y },
      style: caption.style,
      duration,
      startTime: 0
    });
  });

  return timeline;
}

/**
 * Create a title slide
 */
export function titleSlide(
  backgroundImage: string,
  title: string,
  subtitle?: string,
  options: TitleSlideOptions = {}
): Timeline {
  const duration = options.duration || 5;
  
  let timeline = new Timeline()
    .addImage(backgroundImage, {
      duration,
      position: { x: 0, y: 0 },
      scale: 1
    });

  // Add title
  timeline = timeline.addText(title, {
    position: { x: '50%', y: '40%' },
    style: {
      fontSize: 72,
      fontWeight: 'bold',
      color: '#ffffff',
      textAlign: 'center',
      ...options.titleStyle
    },
    duration,
    startTime: 0
  });

  // Add subtitle if provided
  if (subtitle) {
    timeline = timeline.addText(subtitle, {
      position: { x: '50%', y: '60%' },
      style: {
        fontSize: 36,
        color: '#cccccc',
        textAlign: 'center',
        ...options.subtitleStyle
      },
      duration,
      startTime: 0
    });
  }

  return timeline;
}

/**
 * Create a bullet point slide
 */
export function bulletSlide(
  backgroundImage: string,
  title: string,
  bullets: string[],
  options: BulletSlideOptions = {}
): Timeline {
  const duration = options.duration || 8;
  const bullet = options.bulletStyle?.bullet || '•';
  const lineHeight = options.bulletStyle?.lineHeight || 1.5;
  
  let timeline = new Timeline()
    .addImage(backgroundImage, {
      duration,
      position: { x: 0, y: 0 },
      scale: 1
    });

  // Add title
  timeline = timeline.addText(title, {
    position: { x: '50%', y: 100 },
    style: {
      fontSize: 48,
      fontWeight: 'bold',
      color: '#ffffff',
      textAlign: 'center',
      ...options.titleStyle
    },
    duration,
    startTime: 0
  });

  // Add bullet points
  const startY = 250;
  const bulletSpacing = (options.bulletStyle?.fontSize || 32) * lineHeight;

  bullets.forEach((bulletText, index) => {
    timeline = timeline.addText(`${bullet} ${bulletText}`, {
      position: { x: 100, y: startY + (index * bulletSpacing) },
      style: {
        fontSize: 32,
        color: '#ffffff',
        ...options.bulletStyle
      },
      duration,
      startTime: 0
    });
  });

  return timeline;
}

/**
 * Create a slideshow from multiple slides
 */
export function slideshow(slides: Slide[], options: SlideshowOptions = {}): Timeline {
  if (slides.length === 0) {
    throw new Error('At least one slide is required');
  }

  const {
    width = 1920,
    height = 1080,
    transition = 'fade',
    transitionDuration = 1,
    backgroundColor = 'black'
  } = options;

  let timeline = new Timeline();
  let currentTime = 0;

  slides.forEach((slideData, index) => {
    // Create individual slide
    let slideTimeline = slide(slideData.image, slideData.duration, slideData.captions || []);

    // Apply slide-specific transition if specified
    const slideTransition = slideData.transition?.type || transition;
    const slideDuration = slideData.transition?.duration || transitionDuration;

    if (index === 0) {
      // First slide - no transition needed
      timeline = slideTimeline;
    } else {
      // Apply transition between slides
      switch (slideTransition) {
        case 'fade':
          timeline = timeline.concat(slideTimeline);
          break;
        case 'slide':
          // Would require complex filter implementation
          timeline = timeline.concat(slideTimeline);
          break;
        case 'wipe':
          // Would require complex filter implementation
          timeline = timeline.concat(slideTimeline);
          break;
        case 'zoom':
          // Would require complex filter implementation
          timeline = timeline.concat(slideTimeline);
          break;
        case 'none':
        default:
          timeline = timeline.concat(slideTimeline);
          break;
      }
    }

    currentTime += slideData.duration;
  });

  // Set dimensions
  timeline = timeline.scale(width, height);

  // Add background audio if specified
  if (options.audio) {
    timeline = timeline.addAudio(options.audio, {
      volume: 0.8,
      fadeIn: options.audioFadeIn || 2,
      fadeOut: options.audioFadeOut || 3
    });
  }

  return timeline;
}

/**
 * Create a Ken Burns effect slide (zooming/panning)
 */
export function kenBurnsSlide(image: string, options: KenBurnsOptions): Timeline {
  let timeline = new Timeline()
    .addImage(image, {
      duration: options.duration,
      position: { x: 0, y: 0 },
      scale: 1
    });

  // Add Ken Burns zoom/pan effect
  // This would require complex filter implementation with keyframes
  timeline = timeline.addFilter('zoompan', {
    z: 'min(zoom+0.0015,1.5)',
    d: Math.round(options.duration * 25), // 25 fps
    x: 'iw/2-(iw/zoom/2)',
    y: 'ih/2-(ih/zoom/2)'
  });

  // Add captions if provided
  if (options.captions) {
    options.captions.forEach(caption => {
      timeline = timeline.addText(caption.text, {
        position: { x: caption.x, y: caption.y },
        style: caption.style,
        duration: options.duration,
        startTime: 0
      });
    });
  }

  return timeline;
}

/**
 * Create a grid layout slide
 */
export function gridSlide(backgroundImage: string, options: GridSlideOptions): Timeline {
  const duration = options.duration || 10;
  
  let timeline = new Timeline()
    .addImage(backgroundImage, {
      duration,
      position: { x: 0, y: 0 },
      scale: 1
    });

  // Add title if provided
  if (options.title) {
    timeline = timeline.addText(options.title, {
      position: { x: '50%', y: 100 },
      style: {
        fontSize: 48,
        fontWeight: 'bold',
        color: '#ffffff',
        textAlign: 'center'
      },
      duration,
      startTime: 0
    });
  }

  // Calculate grid layout
  const rows = options.grid.length;
  const cols = Math.max(...options.grid.map(row => row.length));
  const cellWidth = 1920 / cols;
  const cellHeight = 1080 / rows;
  const padding = options.cellPadding || 20;

  // Add grid content
  options.grid.forEach((row, rowIndex) => {
    row.forEach((cell, colIndex) => {
      const x = colIndex * cellWidth + padding;
      const y = rowIndex * cellHeight + padding + 150; // Account for title

      if (cell.text) {
        timeline = timeline.addText(cell.text, {
          position: { x, y },
          style: {
            fontSize: 24,
            color: '#ffffff',
            ...cell.style
          },
          duration,
          startTime: 0
        });
      }

      if (cell.image) {
        timeline = timeline.addImage(cell.image, {
          position: { x, y },
          scale: 0.8,
          duration,
          startTime: 0
        });
      }
    });
  });

  return timeline;
}

/**
 * Create a chart slide (would require chart generation)
 */
export function chartSlide(backgroundImage: string, options: ChartSlideOptions): Timeline {
  const duration = options.duration || 10;
  
  let timeline = new Timeline()
    .addImage(backgroundImage, {
      duration,
      position: { x: 0, y: 0 },
      scale: 1
    });

  // Add title
  timeline = timeline.addText(options.title, {
    position: { x: '50%', y: 100 },
    style: {
      fontSize: 48,
      fontWeight: 'bold',
      color: '#ffffff',
      textAlign: 'center'
    },
    duration,
    startTime: 0
  });

  // For now, just add the data as text
  // In a real implementation, this would generate actual charts
  const dataText = options.data.labels.map((label, index) => {
    const values = options.data.datasets.map(dataset => dataset.data[index]).join(', ');
    return `${label}: ${values}`;
  }).join('\n');

  timeline = timeline.addText(dataText, {
    position: { x: '50%', y: '60%' },
    style: {
      fontSize: 24,
      color: '#ffffff',
      textAlign: 'center'
    },
    duration,
    startTime: 0
  });

  return timeline;
}

/**
 * Create a slide template for reuse
 */
export class SlideTemplate {
  constructor(
    private backgroundImage: string,
    private logoOptions?: {
      image: string;
      position: 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left';
      size: number;
    },
    private footerOptions?: {
      text: string;
      position: 'bottom-center' | 'bottom-left' | 'bottom-right';
      style?: TextStyle;
    }
  ) {}

  create(options: {
    title?: string;
    content?: string;
    duration?: number;
  }): Timeline {
    const duration = options.duration || 5;
    
    let timeline = new Timeline()
      .addImage(this.backgroundImage, {
        duration,
        position: { x: 0, y: 0 },
        scale: 1
      });

    // Add logo if specified
    if (this.logoOptions) {
      let logoPosition = { x: 0, y: 0 };
      switch (this.logoOptions.position) {
        case 'top-right':
          logoPosition = { x: 1920 - this.logoOptions.size - 20, y: 20 };
          break;
        case 'top-left':
          logoPosition = { x: 20, y: 20 };
          break;
        case 'bottom-right':
          logoPosition = { x: 1920 - this.logoOptions.size - 20, y: 1080 - this.logoOptions.size - 20 };
          break;
        case 'bottom-left':
          logoPosition = { x: 20, y: 1080 - this.logoOptions.size - 20 };
          break;
      }

      timeline = timeline.addImage(this.logoOptions.image, {
        position: logoPosition,
        scale: this.logoOptions.size / 100,
        duration,
        startTime: 0
      });
    }

    // Add title
    if (options.title) {
      timeline = timeline.addText(options.title, {
        position: { x: '50%', y: '30%' },
        style: {
          fontSize: 48,
          fontWeight: 'bold',
          color: '#ffffff',
          textAlign: 'center'
        },
        duration,
        startTime: 0
      });
    }

    // Add content
    if (options.content) {
      timeline = timeline.addText(options.content, {
        position: { x: '50%', y: '60%' },
        style: {
          fontSize: 32,
          color: '#ffffff',
          textAlign: 'center'
        },
        duration,
        startTime: 0
      });
    }

    // Add footer if specified
    if (this.footerOptions) {
      let footerPosition = { x: '50%', y: '90%' };
      switch (this.footerOptions.position) {
        case 'bottom-left':
          footerPosition = { x: '10%', y: '90%' };
          break;
        case 'bottom-right':
          footerPosition = { x: '90%', y: '90%' };
          break;
      }

      timeline = timeline.addText(this.footerOptions.text, {
        position: footerPosition,
        style: {
          fontSize: 18,
          color: '#666666',
          textAlign: 'center',
          ...this.footerOptions.style
        },
        duration,
        startTime: 0
      });
    }

    return timeline;
  }
}

/**
 * Create a reusable slide template
 */
export function slideTemplate(options: {
  background: string;
  logo?: {
    image: string;
    position: 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left';
    size: number;
  };
  footer?: {
    text: string;
    position: 'bottom-center' | 'bottom-left' | 'bottom-right';
    style?: TextStyle;
  };
}): SlideTemplate {
  return new SlideTemplate(options.background, options.logo, options.footer);
}
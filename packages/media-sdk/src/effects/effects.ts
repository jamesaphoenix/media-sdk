import { Timeline } from '../timeline/timeline.js';

/**
 * Functional composition utility
 */
export function compose(...fns: Array<(timeline: Timeline) => Timeline>): (timeline: Timeline) => Timeline {
  return (timeline: Timeline) => fns.reduce((acc, fn) => fn(acc), timeline);
}

/**
 * Basic video effects
 */

export function fadeIn(duration: number = 1): (timeline: Timeline) => Timeline {
  return (timeline: Timeline) => {
    return timeline.addFilter('fade', {
      type: 'in',
      duration,
      start_time: 0
    });
  };
}

export function fadeOut(duration: number = 1): (timeline: Timeline) => Timeline {
  return (timeline: Timeline) => {
    const totalDuration = timeline.getDuration();
    return timeline.addFilter('fade', {
      type: 'out',
      duration,
      start_time: totalDuration - duration
    });
  };
}

export function crossfade(nextTimeline: Timeline, duration: number = 1): (timeline: Timeline) => Timeline {
  return (timeline: Timeline) => {
    // This would require more complex filter_complex implementation
    return timeline.concat(nextTimeline);
  };
}

/**
 * Color adjustments
 */

export function brightness(value: number): (timeline: Timeline) => Timeline {
  return (timeline: Timeline) => {
    return timeline.addFilter('brightness', { value });
  };
}

export function contrast(value: number): (timeline: Timeline) => Timeline {
  return (timeline: Timeline) => {
    return timeline.addFilter('contrast', { value });
  };
}

export function saturation(value: number): (timeline: Timeline) => Timeline {
  return (timeline: Timeline) => {
    return timeline.addFilter('saturation', { value });
  };
}

export function hue(degrees: number): (timeline: Timeline) => Timeline {
  return (timeline: Timeline) => {
    return timeline.addFilter('hue', { degrees });
  };
}

export function gamma(value: number): (timeline: Timeline) => Timeline {
  return (timeline: Timeline) => {
    return timeline.addFilter('gamma', { value });
  };
}

/**
 * Blur effects
 */

export function blur(radius: number = 5): (timeline: Timeline) => Timeline {
  return (timeline: Timeline) => {
    return timeline.addFilter('blur', { radius });
  };
}

export function gaussianBlur(options: { radius?: number; sigma?: number } = {}): (timeline: Timeline) => Timeline {
  return (timeline: Timeline) => {
    return timeline.addFilter('gblur', options);
  };
}

export function motionBlur(options: { angle?: number; radius?: number } = {}): (timeline: Timeline) => Timeline {
  return (timeline: Timeline) => {
    return timeline.addFilter('mblur', options);
  };
}

/**
 * Color effects
 */

export function grayscale(): (timeline: Timeline) => Timeline {
  return (timeline: Timeline) => {
    return timeline.addFilter('colorchannelmixer', {
      rr: 0.299,
      rg: 0.587,
      rb: 0.114,
      gr: 0.299,
      gg: 0.587,
      gb: 0.114,
      br: 0.299,
      bg: 0.587,
      bb: 0.114
    });
  };
}

export function sepia(): (timeline: Timeline) => Timeline {
  return (timeline: Timeline) => {
    return timeline.addFilter('colorchannelmixer', {
      rr: 0.393,
      rg: 0.769,
      rb: 0.189,
      gr: 0.349,
      gg: 0.686,
      gb: 0.168,
      br: 0.272,
      bg: 0.534,
      bb: 0.131
    });
  };
}

export function invert(): (timeline: Timeline) => Timeline {
  return (timeline: Timeline) => {
    return timeline.addFilter('negate');
  };
}

/**
 * Artistic effects
 */

export function vignette(options: { radius?: number; softness?: number; opacity?: number } = {}): (timeline: Timeline) => Timeline {
  const { radius = 0.8, softness = 0.5, opacity = 0.7 } = options;
  return (timeline: Timeline) => {
    return timeline.addFilter('vignette', { radius, softness, opacity });
  };
}

export function filmGrain(options: { intensity?: number; size?: number; animated?: boolean } = {}): (timeline: Timeline) => Timeline {
  return (timeline: Timeline) => {
    return timeline.addFilter('noise', options);
  };
}

export function vintage(): (timeline: Timeline) => Timeline {
  return compose(
    sepia(),
    contrast(1.2),
    brightness(0.1),
    vignette({ radius: 0.6, opacity: 0.8 }),
    filmGrain({ intensity: 0.1 })
  );
}

export function cinematic(): (timeline: Timeline) => Timeline {
  return compose(
    contrast(1.3),
    saturation(0.8),
    brightness(-0.1),
    vignette({ radius: 0.7, opacity: 0.5 })
  );
}

/**
 * Geometric transformations
 */

export function scale(width: number, height: number): (timeline: Timeline) => Timeline {
  return (timeline: Timeline) => {
    return timeline.scale(width, height);
  };
}

export function crop(options: { width: number; height: number; x?: number; y?: number }): (timeline: Timeline) => Timeline {
  return (timeline: Timeline) => {
    return timeline.crop(options);
  };
}

export function rotate(degrees: number): (timeline: Timeline) => Timeline {
  return (timeline: Timeline) => {
    return timeline.addFilter('rotate', { angle: degrees * Math.PI / 180 });
  };
}

export function flip(direction: 'horizontal' | 'vertical' | 'both'): (timeline: Timeline) => Timeline {
  return (timeline: Timeline) => {
    switch (direction) {
      case 'horizontal':
        return timeline.addFilter('hflip');
      case 'vertical':
        return timeline.addFilter('vflip');
      case 'both':
        return timeline.addFilter('hflip').addFilter('vflip');
      default:
        return timeline;
    }
  };
}

/**
 * Speed effects
 */

export function speed(factor: number): (timeline: Timeline) => Timeline {
  return (timeline: Timeline) => {
    return timeline.addFilter('setpts', { expr: `PTS/${factor}` });
  };
}

export function reverse(): (timeline: Timeline) => Timeline {
  return (timeline: Timeline) => {
    return timeline.addFilter('reverse');
  };
}

/**
 * Advanced effects
 */

export function chromakey(options: {
  color?: string;
  tolerance?: number;
  softness?: number;
  spill?: number;
} = {}): (timeline: Timeline) => Timeline {
  const { color = '#00ff00', tolerance = 0.4, softness = 0.1, spill = 0.1 } = options;
  return (timeline: Timeline) => {
    return timeline.addFilter('chromakey', { color, tolerance, softness, spill });
  };
}

export function stabilize(): (timeline: Timeline) => Timeline {
  return (timeline: Timeline) => {
    return timeline.addFilter('vidstabdetect').addFilter('vidstabtransform');
  };
}

export function denoise(strength: number = 0.5): (timeline: Timeline) => Timeline {
  return (timeline: Timeline) => {
    return timeline.addFilter('bm3d', { sigma: strength });
  };
}

/**
 * Transition effects
 */

export function wipe(
  nextTimeline: Timeline, 
  options: { direction?: 'left' | 'right' | 'up' | 'down'; duration?: number } = {}
): (timeline: Timeline) => Timeline {
  return (timeline: Timeline) => {
    // This would require complex filter_complex implementation
    return timeline.concat(nextTimeline);
  };
}

export function slide(
  nextTimeline: Timeline,
  options: { direction?: 'left' | 'right' | 'up' | 'down'; duration?: number } = {}
): (timeline: Timeline) => Timeline {
  return (timeline: Timeline) => {
    // This would require complex filter_complex implementation
    return timeline.concat(nextTimeline);
  };
}

/**
 * Audio effects (for when audio is added)
 */

export function volumeAdjust(level: number): (timeline: Timeline) => Timeline {
  return (timeline: Timeline) => {
    return timeline.addFilter('volume', { volume: level });
  };
}

export function audioFadeIn(duration: number = 1): (timeline: Timeline) => Timeline {
  return (timeline: Timeline) => {
    return timeline.addFilter('afade', { type: 'in', duration });
  };
}

export function audioFadeOut(duration: number = 1): (timeline: Timeline) => Timeline {
  return (timeline: Timeline) => {
    return timeline.addFilter('afade', { type: 'out', duration });
  };
}

/**
 * Complex effect combinations
 */

export function socialMediaOptimized(): (timeline: Timeline) => Timeline {
  return compose(
    brightness(0.1),
    contrast(1.2),
    saturation(1.3),
    vignette({ radius: 0.9, opacity: 0.3 })
  );
}

export function dreamlike(): (timeline: Timeline) => Timeline {
  return compose(
    gaussianBlur({ radius: 2 }),
    brightness(0.2),
    saturation(1.5),
    vignette({ radius: 0.7, opacity: 0.6 })
  );
}

export function noir(): (timeline: Timeline) => Timeline {
  return compose(
    grayscale(),
    contrast(1.8),
    brightness(-0.2),
    vignette({ radius: 0.5, opacity: 0.9 })
  );
}
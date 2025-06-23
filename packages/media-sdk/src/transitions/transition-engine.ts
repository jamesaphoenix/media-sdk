/**
 * @fileoverview Advanced Transition Engine
 * 
 * Comprehensive transition system supporting multiple transition types,
 * timing controls, easing functions, and seamless integration with Timeline API.
 * 
 * @author Media SDK Team
 * @version 2.0.0
 * @since 2024-12-23
 */

import type { TimelineLayer, Position } from '../types/index.js';

/**
 * Transition types supported by the engine
 */
export type TransitionType = 
  | 'fade'           // Opacity fade in/out
  | 'slide'          // Slide from direction
  | 'zoom'           // Scale zoom in/out
  | 'wipe'           // Directional wipe
  | 'dissolve'       // Pixel dissolve
  | 'push'           // Push one layer with another
  | 'cover'          // Cover one layer with another
  | 'reveal'         // Reveal underlying layer
  | 'iris'           // Circular iris open/close
  | 'matrix'         // Matrix-style digital rain
  | 'cube'           // 3D cube rotation
  | 'flip'           // 3D flip transition
  | 'morph'          // Morphological transition
  | 'particle'       // Particle explosion
  | 'glitch'         // Digital glitch effect
  | 'burn'           // Film burn effect
  | 'none';          // No transition

/**
 * Easing functions for smooth transitions
 */
export type EasingFunction = 
  | 'linear'
  | 'ease-in'
  | 'ease-out'
  | 'ease-in-out'
  | 'bounce'
  | 'elastic'
  | 'back'
  | 'cubic-bezier';

/**
 * Direction for directional transitions
 */
export type TransitionDirection = 
  | 'up' | 'down' | 'left' | 'right'
  | 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right'
  | 'center-out' | 'center-in';

/**
 * Transition configuration options
 */
export interface TransitionOptions {
  /** Type of transition */
  type: TransitionType;
  
  /** Duration in seconds */
  duration: number;
  
  /** Direction for directional transitions */
  direction?: TransitionDirection;
  
  /** Easing function */
  easing?: EasingFunction;
  
  /** Custom parameters for advanced transitions */
  params?: Record<string, any>;
  
  /** Timing offset from natural transition point */
  offset?: number;
  
  /** Whether to reverse the transition */
  reverse?: boolean;
  
  /** Audio fade during transition */
  audioFade?: boolean;
}

/**
 * Transition point between two layers
 */
export interface TransitionPoint {
  /** Time when transition starts */
  startTime: number;
  
  /** Time when transition ends */
  endTime: number;
  
  /** Source layer being transitioned from */
  fromLayer: TimelineLayer;
  
  /** Target layer being transitioned to */
  toLayer: TimelineLayer;
  
  /** Transition configuration */
  transition: TransitionOptions;
  
  /** Generated FFmpeg filter string */
  filterString?: string;
}

/**
 * Advanced Transition Engine
 * 
 * Provides comprehensive transition effects between video layers,
 * images, and other media with precise timing control and 
 * professional-quality effects.
 * 
 * @example
 * ```typescript
 * const engine = new TransitionEngine();
 * 
 * // Add fade transition
 * engine.addTransition({
 *   type: 'fade',
 *   duration: 1.0,
 *   easing: 'ease-in-out'
 * });
 * 
 * // Generate transitions for timeline
 * const transitions = engine.generateTransitions(timeline);
 * const filters = engine.buildTransitionFilters(transitions);
 * ```
 */
export class TransitionEngine {
  private transitions: TransitionPoint[] = [];
  private globalDefaults: Partial<TransitionOptions> = {
    duration: 1.0,
    easing: 'ease-in-out',
    audioFade: false
  };

  /**
   * Set global default transition options
   */
  setDefaults(defaults: Partial<TransitionOptions>): void {
    this.globalDefaults = { ...this.globalDefaults, ...defaults };
  }

  /**
   * Add a transition between two layers
   */
  addTransition(
    fromLayer: TimelineLayer,
    toLayer: TimelineLayer,
    options: Partial<TransitionOptions> & { type: TransitionType }
  ): TransitionPoint {
    const fullOptions: TransitionOptions = {
      ...this.globalDefaults,
      ...options
    };

    // Calculate transition timing
    const fromEnd = (fromLayer.startTime || 0) + (fromLayer.duration || 0);
    const toStart = toLayer.startTime || 0;
    const transitionStart = Math.max(fromEnd - fullOptions.duration, toStart);
    const transitionEnd = transitionStart + fullOptions.duration;

    const transition: TransitionPoint = {
      startTime: transitionStart,
      endTime: transitionEnd,
      fromLayer,
      toLayer,
      transition: fullOptions
    };

    // Generate filter string
    transition.filterString = this.generateFilterString(transition);
    
    this.transitions.push(transition);
    return transition;
  }

  /**
   * Generate transition filter string for FFmpeg
   */
  private generateFilterString(transition: TransitionPoint): string {
    const { type, duration, direction, easing, params } = transition.transition;
    const startTime = transition.startTime;

    switch (type) {
      case 'fade':
        return this.generateFadeFilter(transition);
      
      case 'slide':
        return this.generateSlideFilter(transition);
      
      case 'zoom':
        return this.generateZoomFilter(transition);
      
      case 'wipe':
        return this.generateWipeFilter(transition);
      
      case 'dissolve':
        return this.generateDissolveFilter(transition);
      
      case 'push':
        return this.generatePushFilter(transition);
      
      case 'cover':
        return this.generateCoverFilter(transition);
      
      case 'reveal':
        return this.generateRevealFilter(transition);
      
      case 'iris':
        return this.generateIrisFilter(transition);
      
      case 'matrix':
        return this.generateMatrixFilter(transition);
      
      case 'cube':
        return this.generateCubeFilter(transition);
      
      case 'flip':
        return this.generateFlipFilter(transition);
      
      case 'morph':
        return this.generateMorphFilter(transition);
      
      case 'particle':
        return this.generateParticleFilter(transition);
      
      case 'glitch':
        return this.generateGlitchFilter(transition);
      
      case 'burn':
        return this.generateBurnFilter(transition);
      
      case 'none':
      default:
        return ''; // No transition
    }
  }

  /**
   * Generate fade transition filter
   */
  private generateFadeFilter(transition: TransitionPoint): string {
    const { duration } = transition.transition;
    const startTime = transition.startTime;
    const endTime = transition.endTime;

    // Crossfade between two inputs
    return `[from][to]xfade=transition=fade:duration=${duration}:offset=${startTime}[faded]`;
  }

  /**
   * Generate slide transition filter
   */
  private generateSlideFilter(transition: TransitionPoint): string {
    const { duration, direction = 'right' } = transition.transition;
    const startTime = transition.startTime;

    // Determine slide direction offset
    let offsetX = '0', offsetY = '0';
    switch (direction) {
      case 'left':
        offsetX = '-iw*t/' + duration;
        break;
      case 'right':
        offsetX = 'iw*t/' + duration;
        break;
      case 'up':
        offsetY = '-ih*t/' + duration;
        break;
      case 'down':
        offsetY = 'ih*t/' + duration;
        break;
    }

    return `[from][to]overlay=${offsetX}:${offsetY}:enable='between(t,${startTime},${startTime + duration})'[slided]`;
  }

  /**
   * Generate zoom transition filter
   */
  private generateZoomFilter(transition: TransitionPoint): string {
    const { duration, direction = 'center-out' } = transition.transition;
    const startTime = transition.startTime;

    const zoomScale = direction === 'center-in' ? '2-t/' + duration : 't/' + duration;
    
    return `[from]scale=iw*${zoomScale}:ih*${zoomScale}[zoomed];[zoomed][to]overlay=(W-w)/2:(H-h)/2:enable='between(t,${startTime},${startTime + duration})'[zoom_transition]`;
  }

  /**
   * Generate wipe transition filter
   */
  private generateWipeFilter(transition: TransitionPoint): string {
    const { duration, direction = 'right' } = transition.transition;
    const startTime = transition.startTime;

    let wipeParams = '';
    switch (direction) {
      case 'left':
        wipeParams = `w=iw*(1-t/${duration}):h=ih`;
        break;
      case 'right':
        wipeParams = `w=iw*t/${duration}:h=ih`;
        break;
      case 'up':
        wipeParams = `w=iw:h=ih*(1-t/${duration})`;
        break;
      case 'down':
        wipeParams = `w=iw:h=ih*t/${duration}`;
        break;
    }

    return `[to]crop=${wipeParams}:enable='between(t,${startTime},${startTime + duration})'[wiped];[from][wiped]overlay[wipe_transition]`;
  }

  /**
   * Generate dissolve transition filter
   */
  private generateDissolveFilter(transition: TransitionPoint): string {
    const { duration } = transition.transition;
    const startTime = transition.startTime;

    // Random pixel dissolve effect
    return `[from][to]xfade=transition=pixelize:duration=${duration}:offset=${startTime}[dissolved]`;
  }

  /**
   * Generate push transition filter
   */
  private generatePushFilter(transition: TransitionPoint): string {
    const { duration, direction = 'right' } = transition.transition;
    const startTime = transition.startTime;

    // Push one layer with another
    let pushX = '0', pushY = '0';
    switch (direction) {
      case 'left':
        pushX = `-iw*t/${duration}`;
        break;
      case 'right':
        pushX = `iw*t/${duration}`;
        break;
      case 'up':
        pushY = `-ih*t/${duration}`;
        break;
      case 'down':
        pushY = `ih*t/${duration}`;
        break;
    }

    return `[from][to]overlay=${pushX}:${pushY}:enable='between(t,${startTime},${startTime + duration})'[pushed]`;
  }

  /**
   * Generate cover transition filter
   */
  private generateCoverFilter(transition: TransitionPoint): string {
    const { duration, direction = 'right' } = transition.transition;
    const startTime = transition.startTime;

    // Cover from specified direction
    let coverX = '0', coverY = '0';
    switch (direction) {
      case 'left':
        coverX = `iw*(1-t/${duration})`;
        break;
      case 'right':
        coverX = `-iw*(1-t/${duration})`;
        break;
      case 'up':
        coverY = `ih*(1-t/${duration})`;
        break;
      case 'down':
        coverY = `-ih*(1-t/${duration})`;
        break;
    }

    return `[from][to]overlay=${coverX}:${coverY}:enable='between(t,${startTime},${startTime + duration})'[covered]`;
  }

  /**
   * Generate reveal transition filter
   */
  private generateRevealFilter(transition: TransitionPoint): string {
    const { duration, direction = 'right' } = transition.transition;
    const startTime = transition.startTime;

    // Reveal underlying layer
    let revealX = '0', revealY = '0';
    switch (direction) {
      case 'left':
        revealX = `-iw*t/${duration}`;
        break;
      case 'right':
        revealX = `iw*t/${duration}`;
        break;
      case 'up':
        revealY = `-ih*t/${duration}`;
        break;
      case 'down':
        revealY = `ih*t/${duration}`;
        break;
    }

    return `[to][from]overlay=${revealX}:${revealY}:enable='between(t,${startTime},${startTime + duration})'[revealed]`;
  }

  /**
   * Generate iris transition filter (circular reveal)
   */
  private generateIrisFilter(transition: TransitionPoint): string {
    const { duration, direction = 'center-out' } = transition.transition;
    const startTime = transition.startTime;

    const radius = direction === 'center-out' ? 
      `min(iw,ih)*t/${duration}` : 
      `min(iw,ih)*(1-t/${duration})`;

    return `[to]geq=r='if(hypot(X-W/2,Y-H/2)<${radius},r(X,Y),0)':g='if(hypot(X-W/2,Y-H/2)<${radius},g(X,Y),0)':b='if(hypot(X-W/2,Y-H/2)<${radius},b(X,Y),0)':enable='between(t,${startTime},${startTime + duration})'[iris];[from][iris]overlay[iris_transition]`;
  }

  /**
   * Generate matrix transition filter (digital rain effect)
   */
  private generateMatrixFilter(transition: TransitionPoint): string {
    const { duration } = transition.transition;
    const startTime = transition.startTime;

    // Simplified matrix effect using noise and geometry
    return `[from]noise=alls=20:allf=t+n,geq=r='if(lt(random(1),0.1),255,r(X,Y))':g='if(lt(random(1),0.1),255,g(X,Y))':b='if(lt(random(1),0.1),0,b(X,Y))':enable='between(t,${startTime},${startTime + duration})'[matrix];[matrix][to]overlay[matrix_transition]`;
  }

  /**
   * Generate cube transition filter (3D rotation effect)
   */
  private generateCubeFilter(transition: TransitionPoint): string {
    const { duration, direction = 'right' } = transition.transition;
    const startTime = transition.startTime;

    // Perspective transformation for 3D cube effect
    const perspective = `perspective=x=0:y=0:w=iw:h=ih:sense=destination`;
    
    return `[from]${perspective}:interpolation=linear,scale=iw*cos(PI*t/${duration}):ih[cube_from];[to]${perspective}:interpolation=linear,scale=iw*sin(PI*t/${duration}):ih[cube_to];[cube_from][cube_to]overlay:enable='between(t,${startTime},${startTime + duration})'[cube_transition]`;
  }

  /**
   * Generate flip transition filter (3D flip effect)
   */
  private generateFlipFilter(transition: TransitionPoint): string {
    const { duration, direction = 'horizontal' } = transition.transition;
    const startTime = transition.startTime;

    const flipScale = direction === 'horizontal' ? 
      `scale=iw*cos(PI*t/${duration}):ih` : 
      `scale=iw:ih*cos(PI*t/${duration})`;

    return `[from]${flipScale}[flip_from];[to]${flipScale}[flip_to];[flip_from][flip_to]overlay:enable='between(t,${startTime},${startTime + duration})'[flip_transition]`;
  }

  /**
   * Generate morph transition filter
   */
  private generateMorphFilter(transition: TransitionPoint): string {
    const { duration } = transition.transition;
    const startTime = transition.startTime;

    // Morphological transition using blend modes
    return `[from][to]blend=all_mode=multiply:all_opacity=${1 / duration}:enable='between(t,${startTime},${startTime + duration})'[morphed]`;
  }

  /**
   * Generate particle explosion transition
   */
  private generateParticleFilter(transition: TransitionPoint): string {
    const { duration } = transition.transition;
    const startTime = transition.startTime;

    // Particle effect using noise and displacement
    return `[from]noise=alls=50:allf=t+n,displace=edge=wrap:enable='between(t,${startTime},${startTime + duration})'[particles];[particles][to]overlay[particle_transition]`;
  }

  /**
   * Generate glitch transition filter
   */
  private generateGlitchFilter(transition: TransitionPoint): string {
    const { duration } = transition.transition;
    const startTime = transition.startTime;

    // Digital glitch effect with random displacement
    return `[from]noise=c0s=20:c0f=t+n,crop=w=iw-20:h=ih:x=random(1)*20:y=0:enable='between(t,${startTime},${startTime + duration})'[glitch];[glitch][to]overlay[glitch_transition]`;
  }

  /**
   * Generate film burn transition
   */
  private generateBurnFilter(transition: TransitionPoint): string {
    const { duration } = transition.transition;
    const startTime = transition.startTime;

    // Film burn effect with color curves
    return `[from]curves=vintage:enable='between(t,${startTime},${startTime + duration})';[to]overlay[burn_transition]`;
  }

  /**
   * Get all transitions
   */
  getTransitions(): TransitionPoint[] {
    return [...this.transitions];
  }

  /**
   * Clear all transitions
   */
  clearTransitions(): void {
    this.transitions = [];
  }

  /**
   * Generate FFmpeg filter complex string for all transitions
   */
  buildFilterComplex(): string {
    if (this.transitions.length === 0) {
      return '';
    }

    const filterChains: string[] = [];
    
    this.transitions.forEach((transition, index) => {
      if (transition.filterString) {
        // Replace placeholder labels with actual input indices
        const filter = transition.filterString
          .replace(/\[from\]/g, `[${index * 2}:v]`)
          .replace(/\[to\]/g, `[${index * 2 + 1}:v]`);
        
        filterChains.push(filter);
      }
    });

    return filterChains.join(';');
  }

  /**
   * Auto-generate transitions between consecutive layers
   */
  autoGenerateTransitions(
    layers: TimelineLayer[],
    defaultTransition: Partial<TransitionOptions> & { type: TransitionType }
  ): TransitionPoint[] {
    this.clearTransitions();
    
    const videoLayers = layers
      .filter(layer => layer.type === 'video' || layer.type === 'image')
      .sort((a, b) => (a.startTime || 0) - (b.startTime || 0));

    for (let i = 0; i < videoLayers.length - 1; i++) {
      const currentLayer = videoLayers[i];
      const nextLayer = videoLayers[i + 1];
      
      this.addTransition(currentLayer, nextLayer, defaultTransition);
    }

    return this.getTransitions();
  }

  /**
   * Create transition preset configurations
   */
  static createPreset(name: string): Partial<TransitionOptions> {
    const presets: Record<string, Partial<TransitionOptions>> = {
      'smooth': {
        type: 'fade',
        duration: 1.0,
        easing: 'ease-in-out',
        audioFade: true
      },
      'quick': {
        type: 'fade',
        duration: 0.3,
        easing: 'linear',
        audioFade: false
      },
      'dramatic': {
        type: 'zoom',
        duration: 2.0,
        direction: 'center-out',
        easing: 'ease-in-out'
      },
      'slide-show': {
        type: 'slide',
        duration: 0.8,
        direction: 'right',
        easing: 'ease-out'
      },
      'professional': {
        type: 'wipe',
        duration: 1.5,
        direction: 'right',
        easing: 'ease-in-out'
      },
      'creative': {
        type: 'iris',
        duration: 1.2,
        direction: 'center-out',
        easing: 'elastic'
      },
      'retro': {
        type: 'burn',
        duration: 2.0,
        easing: 'ease-in'
      },
      'tech': {
        type: 'glitch',
        duration: 0.5,
        easing: 'linear'
      },
      'matrix': {
        type: 'matrix',
        duration: 1.8,
        easing: 'ease-out'
      }
    };

    return presets[name] || presets['smooth'];
  }
}
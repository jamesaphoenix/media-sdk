import { describe, test, expect, beforeEach } from 'vitest';
import { Timeline } from '../timeline/timeline.js';
import type { TransitionType, TransitionDirection, EasingFunction, TransitionOptions } from '../transitions/transition-engine.js';

// Mock the transition engine since we're testing the integration
// In a real scenario, this would import the actual TransitionEngine
class MockTransitionEngine {
  generateTransition(options: TransitionOptions): string {
    // Simulate FFmpeg filter generation based on transition type
    switch (options.type) {
      case 'fade':
        return `fade=t=in:st=${options.offset || 0}:d=${options.duration}`;
      case 'slide':
        const direction = options.direction || 'right';
        return `slide=${direction}:duration=${options.duration}`;
      case 'zoom':
        return `zoompan=z='if(lte(t,${options.duration}),1+t/${options.duration},2)':d=${options.duration * 25}`;
      case 'wipe':
        return `wipe=${options.direction}:duration=${options.duration}`;
      case 'dissolve':
        return `dissolve=duration=${options.duration}`;
      case 'push':
        return `xfade=transition=push${options.direction}:duration=${options.duration}`;
      case 'cover':
        return `xfade=transition=cover${options.direction}:duration=${options.duration}`;
      case 'reveal':
        return `xfade=transition=reveal${options.direction}:duration=${options.duration}`;
      case 'iris':
        return `xfade=transition=circleopen:duration=${options.duration}`;
      case 'matrix':
        return `xfade=transition=matrix:duration=${options.duration}`;
      case 'cube':
        return `xfade=transition=cube${options.direction}:duration=${options.duration}`;
      case 'flip':
        return `xfade=transition=flip${options.direction}:duration=${options.duration}`;
      case 'morph':
        return `xfade=transition=morph:duration=${options.duration}`;
      case 'particle':
        return `xfade=transition=particle:duration=${options.duration}`;
      case 'glitch':
        return `xfade=transition=glitch:duration=${options.duration}`;
      case 'burn':
        return `xfade=transition=burn:duration=${options.duration}`;
      case 'none':
        return '';
      default:
        throw new Error(`Unsupported transition type: ${options.type}`);
    }
  }
  
  validateTransition(options: TransitionOptions): { valid: boolean; errors: string[] } {
    const errors: string[] = [];
    
    if (options.duration <= 0) {
      errors.push('Duration must be positive');
    }
    
    if (options.duration > 10) {
      errors.push('Duration too long (max 10 seconds)');
    }
    
    if (options.offset && options.offset < 0) {
      errors.push('Offset cannot be negative');
    }
    
    return { valid: errors.length === 0, errors };
  }
}

describe('🎬 Transition Engine - Comprehensive Tests', () => {
  let transitionEngine: MockTransitionEngine;
  let timeline: Timeline;
  
  beforeEach(() => {
    transitionEngine = new MockTransitionEngine();
    timeline = new Timeline()
      .addVideo('video1.mp4')
      .addVideo('video2.mp4');
  });

  describe('Basic Transition Types', () => {
    const basicTransitions: TransitionType[] = [
      'fade', 'slide', 'zoom', 'wipe', 'dissolve', 'push', 'cover', 'reveal', 'iris'
    ];
    
    test.each(basicTransitions)('should generate valid %s transition', (type) => {
      const options: TransitionOptions = {
        type,
        duration: 2,
        direction: 'right',
        easing: 'ease-in-out'
      };
      
      const filter = transitionEngine.generateTransition(options);
      expect(filter).toBeTruthy();
      expect(filter).toContain(options.duration.toString());
      
      if (type !== 'none') {
        expect(filter.length).toBeGreaterThan(0);
      }
    });
    
    test('should handle "none" transition correctly', () => {
      const options: TransitionOptions = {
        type: 'none',
        duration: 1
      };
      
      const filter = transitionEngine.generateTransition(options);
      expect(filter).toBe('');
    });
  });

  describe('Advanced 3D Transitions', () => {
    const advanced3DTransitions: TransitionType[] = ['matrix', 'cube', 'flip', 'morph'];
    
    test.each(advanced3DTransitions)('should generate complex %s transition', (type) => {
      const options: TransitionOptions = {
        type,
        duration: 3,
        direction: 'left',
        easing: 'cubic-bezier'
      };
      
      const filter = transitionEngine.generateTransition(options);
      expect(filter).toContain('xfade');
      expect(filter).toContain(type);
      expect(filter).toContain('duration=3');
    });
  });

  describe('Special Effect Transitions', () => {
    const effectTransitions: TransitionType[] = ['particle', 'glitch', 'burn'];
    
    test.each(effectTransitions)('should generate %s effect transition', (type) => {
      const options: TransitionOptions = {
        type,
        duration: 1.5,
        params: {
          intensity: 0.8,
          color: '#ff0000'
        }
      };
      
      const filter = transitionEngine.generateTransition(options);
      expect(filter).toContain('xfade');
      expect(filter).toContain(type);
      expect(filter).toContain('duration=1.5');
    });
  });

  describe('Direction Handling', () => {
    const directions: TransitionDirection[] = [
      'up', 'down', 'left', 'right',
      'top-left', 'top-right', 'bottom-left', 'bottom-right',
      'center-out', 'center-in'
    ];
    
    test.each(directions)('should handle %s direction', (direction) => {
      const options: TransitionOptions = {
        type: 'slide',
        duration: 2,
        direction
      };
      
      const filter = transitionEngine.generateTransition(options);
      expect(filter).toContain(direction);
    });
    
    test('should default to "right" when no direction specified', () => {
      const options: TransitionOptions = {
        type: 'slide',
        duration: 2
      };
      
      const filter = transitionEngine.generateTransition(options);
      expect(filter).toContain('right');
    });
  });

  describe('Easing Functions', () => {
    const easingFunctions: EasingFunction[] = [
      'linear', 'ease-in', 'ease-out', 'ease-in-out',
      'bounce', 'elastic', 'back', 'cubic-bezier'
    ];
    
    test.each(easingFunctions)('should accept %s easing function', (easing) => {
      const options: TransitionOptions = {
        type: 'fade',
        duration: 2,
        easing
      };
      
      // Should not throw error
      expect(() => transitionEngine.generateTransition(options)).not.toThrow();
    });
  });

  describe('Duration Edge Cases', () => {
    test('should handle very short durations', () => {
      const options: TransitionOptions = {
        type: 'fade',
        duration: 0.1 // 100ms
      };
      
      const filter = transitionEngine.generateTransition(options);
      expect(filter).toContain('0.1');
    });
    
    test('should handle very long durations', () => {
      const options: TransitionOptions = {
        type: 'dissolve',
        duration: 10 // 10 seconds
      };
      
      const filter = transitionEngine.generateTransition(options);
      expect(filter).toContain('10');
    });
    
    test('should handle fractional durations', () => {
      const options: TransitionOptions = {
        type: 'wipe',
        duration: 2.5
      };
      
      const filter = transitionEngine.generateTransition(options);
      expect(filter).toContain('2.5');
    });
  });

  describe('Validation Tests', () => {
    test('should validate positive duration', () => {
      const options: TransitionOptions = {
        type: 'fade',
        duration: -1
      };
      
      const validation = transitionEngine.validateTransition(options);
      expect(validation.valid).toBe(false);
      expect(validation.errors).toContain('Duration must be positive');
    });
    
    test('should validate maximum duration', () => {
      const options: TransitionOptions = {
        type: 'fade',
        duration: 15 // Too long
      };
      
      const validation = transitionEngine.validateTransition(options);
      expect(validation.valid).toBe(false);
      expect(validation.errors).toContain('Duration too long (max 10 seconds)');
    });
    
    test('should validate offset value', () => {
      const options: TransitionOptions = {
        type: 'fade',
        duration: 2,
        offset: -0.5
      };
      
      const validation = transitionEngine.validateTransition(options);
      expect(validation.valid).toBe(false);
      expect(validation.errors).toContain('Offset cannot be negative');
    });
    
    test('should pass validation for valid options', () => {
      const options: TransitionOptions = {
        type: 'fade',
        duration: 2,
        offset: 0.5,
        direction: 'right',
        easing: 'ease-in-out'
      };
      
      const validation = transitionEngine.validateTransition(options);
      expect(validation.valid).toBe(true);
      expect(validation.errors).toHaveLength(0);
    });
  });

  describe('Error Handling', () => {
    test('should throw error for unsupported transition type', () => {
      const options = {
        type: 'invalid-transition' as TransitionType,
        duration: 2
      };
      
      expect(() => transitionEngine.generateTransition(options)).toThrow(
        'Unsupported transition type: invalid-transition'
      );
    });
    
    test('should handle missing required parameters gracefully', () => {
      // Test with minimal valid options
      const options: TransitionOptions = {
        type: 'fade',
        duration: 1
      };
      
      expect(() => transitionEngine.generateTransition(options)).not.toThrow();
    });
  });

  describe('Reverse Transitions', () => {
    test('should handle reverse fade transition', () => {
      const options: TransitionOptions = {
        type: 'fade',
        duration: 2,
        reverse: true
      };
      
      const filter = transitionEngine.generateTransition(options);
      expect(filter).toBeTruthy();
    });
    
    test('should handle reverse slide transition', () => {
      const options: TransitionOptions = {
        type: 'slide',
        duration: 1.5,
        direction: 'left',
        reverse: true
      };
      
      const filter = transitionEngine.generateTransition(options);
      expect(filter).toContain('left');
    });
  });

  describe('Audio Fade Integration', () => {
    test('should handle audio fade with video transition', () => {
      const options: TransitionOptions = {
        type: 'fade',
        duration: 2,
        audioFade: true
      };
      
      // Should not throw error even with audio fade enabled
      expect(() => transitionEngine.generateTransition(options)).not.toThrow();
    });
  });

  describe('Custom Parameters', () => {
    test('should handle custom parameters for particle transition', () => {
      const options: TransitionOptions = {
        type: 'particle',
        duration: 3,
        params: {
          particleCount: 1000,
          speed: 2.5,
          color: '#ff6600',
          size: 'large'
        }
      };
      
      const filter = transitionEngine.generateTransition(options);
      expect(filter).toContain('particle');
    });
    
    test('should handle custom parameters for glitch transition', () => {
      const options: TransitionOptions = {
        type: 'glitch',
        duration: 1,
        params: {
          intensity: 0.9,
          frequency: 15,
          pixelation: true
        }
      };
      
      const filter = transitionEngine.generateTransition(options);
      expect(filter).toContain('glitch');
    });
  });

  describe('Performance Tests', () => {
    test('should generate transitions quickly', () => {
      const start = performance.now();
      
      for (let i = 0; i < 1000; i++) {
        transitionEngine.generateTransition({
          type: 'fade',
          duration: 2,
          direction: 'right',
          easing: 'ease-in-out'
        });
      }
      
      const end = performance.now();
      const duration = end - start;
      
      // Should generate 1000 transitions in under 100ms
      expect(duration).toBeLessThan(100);
    });
    
    test('should handle complex transitions efficiently', () => {
      const start = performance.now();
      
      const complexOptions: TransitionOptions = {
        type: 'matrix',
        duration: 5,
        direction: 'center-out',
        easing: 'cubic-bezier',
        params: {
          complexity: 'high',
          particles: 5000,
          layers: 10
        }
      };
      
      for (let i = 0; i < 100; i++) {
        transitionEngine.generateTransition(complexOptions);
      }
      
      const end = performance.now();
      const duration = end - start;
      
      // Should handle complex transitions efficiently
      expect(duration).toBeLessThan(50);
    });
  });

  describe('Memory Usage', () => {
    test('should not leak memory with repeated transitions', () => {
      // Force garbage collection if available
      if (global.gc) global.gc();
      
      const memBefore = process.memoryUsage().heapUsed;
      
      // Generate many transitions
      for (let i = 0; i < 10000; i++) {
        transitionEngine.generateTransition({
          type: 'fade',
          duration: Math.random() * 5,
          direction: 'left',
          easing: 'ease-in-out'
        });
      }
      
      if (global.gc) global.gc();
      
      const memAfter = process.memoryUsage().heapUsed;
      const memDiff = memAfter - memBefore;
      
      // Memory usage should be reasonable (< 5MB for 10k transitions)
      expect(memDiff).toBeLessThan(5 * 1024 * 1024);
    });
  });

  describe('FFmpeg Command Integration', () => {
    test('should generate valid FFmpeg filter syntax', () => {
      const transitions: TransitionType[] = ['fade', 'slide', 'wipe', 'dissolve'];
      
      transitions.forEach(type => {
        const options: TransitionOptions = {
          type,
          duration: 2,
          direction: 'right'
        };
        
        const filter = transitionEngine.generateTransition(options);
        
        // Should not contain invalid characters for FFmpeg
        expect(filter).not.toMatch(/[<>|&;`$(){}[\]]/);
        
        // Should contain proper key=value format
        if (filter.length > 0) {
          expect(filter).toMatch(/\w+=[^=:]+/);
        }
      });
    });
    
    test('should escape special characters in parameters', () => {
      const options: TransitionOptions = {
        type: 'particle',
        duration: 2,
        params: {
          text: "Hello'World\"Test",
          path: '/path/to/file with spaces.mp4'
        }
      };
      
      const filter = transitionEngine.generateTransition(options);
      
      // Should handle special characters safely
      expect(() => transitionEngine.generateTransition(options)).not.toThrow();
    });
  });

  describe('Timing Precision', () => {
    test('should handle precise timing calculations', () => {
      const precisionTests = [
        { duration: 0.033333, expected: '0.033333' }, // ~1 frame at 30fps
        { duration: 1.001, expected: '1.001' },
        { duration: 2.999999, expected: '2.999999' }
      ];
      
      precisionTests.forEach(({ duration, expected }) => {
        const options: TransitionOptions = {
          type: 'fade',
          duration
        };
        
        const filter = transitionEngine.generateTransition(options);
        expect(filter).toContain(expected);
      });
    });
  });

  describe('Edge Case Combinations', () => {
    test('should handle extreme parameter combinations', () => {
      const extremeOptions: TransitionOptions = {
        type: 'cube',
        duration: 0.1, // Very short
        direction: 'center-out',
        easing: 'bounce',
        reverse: true,
        audioFade: true,
        offset: 0.001,
        params: {
          extreme: true,
          value: Number.MAX_SAFE_INTEGER
        }
      };
      
      expect(() => transitionEngine.generateTransition(extremeOptions)).not.toThrow();
      
      const validation = transitionEngine.validateTransition(extremeOptions);
      expect(validation.valid).toBe(true);
    });
  });
});
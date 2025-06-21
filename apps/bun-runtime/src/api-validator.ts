/**
 * Simple API validation utilities
 * 
 * Lightweight validation without external dependencies
 * Designed to be fast and AI-friendly
 */

export class ValidationError extends Error {
  constructor(
    public readonly field: string,
    public readonly value: unknown,
    public readonly expected: string
  ) {
    super(`Invalid ${field}: expected ${expected}, got ${typeof value}`);
    this.name = 'ValidationError';
  }
}

/**
 * Simple validators for common patterns
 */
export const Validators = {
  /**
   * Validates a file path
   */
  path(value: unknown, field: string = 'path'): string {
    if (!value || typeof value !== 'string') {
      console.warn(`⚠️ Invalid ${field}: expected non-empty string, got ${typeof value}`);
      return ''; // Graceful degradation
    }
    return value.trim();
  },

  /**
   * Validates text content
   */
  text(value: unknown, field: string = 'text'): string {
    if (value === null || value === undefined) {
      console.warn(`⚠️ Empty ${field} provided`);
      return '';
    }
    return String(value);
  },

  /**
   * Validates numeric value with bounds
   */
  number(
    value: unknown, 
    field: string = 'value',
    min?: number,
    max?: number
  ): number {
    const num = Number(value);
    
    if (isNaN(num)) {
      console.warn(`⚠️ Invalid ${field}: expected number, got ${typeof value}`);
      return 0;
    }
    
    if (min !== undefined && num < min) {
      console.warn(`⚠️ ${field} ${num} is below minimum ${min}, using ${min}`);
      return min;
    }
    
    if (max !== undefined && num > max) {
      console.warn(`⚠️ ${field} ${num} is above maximum ${max}, using ${max}`);
      return max;
    }
    
    return num;
  },

  /**
   * Validates duration (positive number or 'full')
   */
  duration(value: unknown, field: string = 'duration'): number | 'full' {
    if (value === 'full') return 'full';
    
    const num = this.number(value, field, 0);
    return num;
  },

  /**
   * Validates position string or coordinates
   */
  position(value: unknown): any {
    // String positions
    if (typeof value === 'string') {
      const validPositions = [
        'top-left', 'top', 'top-right',
        'left', 'center', 'right',
        'bottom-left', 'bottom', 'bottom-right'
      ];
      
      if (validPositions.includes(value)) {
        return value;
      }
      
      console.warn(`⚠️ Invalid position '${value}', using 'center'`);
      return 'center';
    }
    
    // Object positions
    if (value && typeof value === 'object') {
      return value; // Pass through, let FFmpeg handle validation
    }
    
    // Default
    return 'center';
  },

  /**
   * Validates volume (0-1 or 0-100)
   */
  volume(value: unknown, field: string = 'volume'): number {
    const num = Number(value);
    
    if (isNaN(num)) {
      console.warn(`⚠️ Invalid ${field}, using 1.0`);
      return 1.0;
    }
    
    // Handle percentage (0-100) or decimal (0-1)
    if (num > 1) {
      return this.number(num, field, 0, 100) / 100;
    }
    
    return this.number(num, field, 0, 1);
  },

  /**
   * Validates aspect ratio
   */
  aspectRatio(value: unknown): string {
    if (typeof value === 'string') {
      // Common ratios
      const validRatios = ['16:9', '9:16', '1:1', '4:3', '3:4', '21:9'];
      
      if (validRatios.includes(value)) {
        return value;
      }
      
      // Try to parse custom ratio
      if (/^\d+:\d+$/.test(value)) {
        return value;
      }
    }
    
    console.warn(`⚠️ Invalid aspect ratio '${value}', using '16:9'`);
    return '16:9';
  },

  /**
   * Validates color value
   */
  color(value: unknown, field: string = 'color'): string {
    if (!value || typeof value !== 'string') {
      console.warn(`⚠️ Invalid ${field}, using default color`);
      return '#ffffff';
    }
    
    // Quick validation for common formats
    const colorValue = value.trim();
    
    // Hex color
    if (/^#[0-9A-Fa-f]{3,8}$/.test(colorValue)) {
      return colorValue;
    }
    
    // RGB/RGBA
    if (/^rgba?\(/.test(colorValue)) {
      return colorValue;
    }
    
    // HSL
    if (/^hsl/.test(colorValue)) {
      return colorValue;
    }
    
    // Named colors - just pass through
    return colorValue;
  },

  /**
   * Validates options object
   */
  options(value: unknown, defaults: Record<string, any> = {}): Record<string, any> {
    if (!value || typeof value !== 'object') {
      return { ...defaults };
    }
    
    // Merge with defaults
    return { ...defaults, ...value };
  }
};

/**
 * Parameter normalizer for consistent API
 */
export class ParamNormalizer {
  /**
   * Normalizes add* method parameters to consistent format
   */
  static normalizeAddParams(
    primaryParam: unknown,
    options: unknown = {}
  ): { primary: any; options: Record<string, any> } {
    // Handle when primary param is actually the options object
    if (primaryParam && typeof primaryParam === 'object' && !options) {
      return {
        primary: undefined,
        options: primaryParam as Record<string, any>
      };
    }
    
    return {
      primary: primaryParam,
      options: Validators.options(options)
    };
  }

  /**
   * Normalizes position to consistent format
   */
  static normalizePosition(position: any): any {
    if (!position) return { x: '50%', y: '50%' };
    
    // String positions
    if (typeof position === 'string') {
      return position;
    }
    
    // Numeric positions
    if (typeof position === 'object') {
      const normalized: any = {};
      
      if ('x' in position) {
        normalized.x = position.x;
      }
      
      if ('y' in position) {
        normalized.y = position.y;
      }
      
      if ('anchor' in position) {
        normalized.anchor = position.anchor;
      }
      
      return normalized;
    }
    
    return { x: '50%', y: '50%' };
  }
}

/**
 * Simple immutability helper
 */
export function deepClone<T>(obj: T): T {
  if (obj === null || typeof obj !== 'object') return obj;
  if (obj instanceof Date) return new Date(obj.getTime()) as any;
  if (obj instanceof Array) return obj.map(item => deepClone(item)) as any;
  
  const clonedObj: any = {};
  for (const key in obj) {
    if (obj.hasOwnProperty(key)) {
      clonedObj[key] = deepClone(obj[key]);
    }
  }
  
  return clonedObj;
}
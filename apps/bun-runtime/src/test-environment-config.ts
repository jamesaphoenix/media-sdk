/**
 * @fileoverview Test Environment Configuration System
 * 
 * Provides comprehensive configuration management for different testing environments
 * including local development, CI/CD, staging, and production validation.
 * 
 * @author Media SDK Team
 * @version 1.0.0
 * @since 2024-12-20
 */

import { existsSync, readFileSync, writeFileSync, mkdirSync } from 'fs';
import { join } from 'path';

/**
 * Environment types for different testing scenarios
 */
export type TestEnvironment = 
  | 'development'    // Local development with full features
  | 'ci'            // Continuous integration with fast execution
  | 'staging'       // Pre-production validation
  | 'production'    // Production health checks
  | 'benchmark'     // Performance benchmarking
  | 'regression';   // Regression testing with historical comparison

/**
 * Test data configuration for managing sample files and assets
 */
export interface TestDataConfig {
  /** Base directory for test assets */
  baseDir: string;
  /** Sample video files for testing */
  sampleVideos: {
    [key: string]: {
      path: string;
      duration: number;
      resolution: { width: number; height: number };
      format: string;
      size: number;
    };
  };
  /** Sample image files */
  sampleImages: {
    [key: string]: {
      path: string;
      resolution: { width: number; height: number };
      format: string;
      size: number;
    };
  };
  /** Sample audio files */
  sampleAudio: {
    [key: string]: {
      path: string;
      duration: number;
      format: string;
      sampleRate: number;
      size: number;
    };
  };
  /** Expected output checksums for validation */
  expectedOutputs: {
    [testId: string]: {
      checksum: string;
      size: number;
      duration: number;
    };
  };
}

/**
 * Performance thresholds for different environments
 */
export interface PerformanceThresholds {
  /** Maximum execution time per test in milliseconds */
  maxExecutionTime: number;
  /** Maximum memory usage in bytes */
  maxMemoryUsage: number;
  /** Maximum file size for outputs in bytes */
  maxOutputSize: number;
  /** Minimum quality score (0.0-1.0) */
  minQualityScore: number;
  /** Maximum acceptable failure rate */
  maxFailureRate: number;
}

/**
 * Vision validation configuration
 */
export interface VisionConfig {
  /** Whether vision validation is enabled */
  enabled: boolean;
  /** Gemini API key (optional - falls back to simulation) */
  apiKey?: string;
  /** Quality threshold for vision validation */
  qualityThreshold: number;
  /** Whether to capture frames for analysis */
  captureFrames: boolean;
  /** Frame extraction settings */
  frameExtraction: {
    count: number;
    format: 'png' | 'jpg';
    quality: number;
  };
}

/**
 * Comprehensive test environment configuration
 */
export interface TestEnvironmentConfig {
  /** Environment identifier */
  environment: TestEnvironment;
  /** Human-readable environment name */
  name: string;
  /** Environment description */
  description: string;
  
  /** Execution configuration */
  execution: {
    /** Whether to run tests in parallel */
    parallel: boolean;
    /** Maximum concurrent test execution */
    maxConcurrency: number;
    /** Global timeout for all tests */
    globalTimeout: number;
    /** Number of retry attempts for failed tests */
    retries: number;
    /** Whether to fail fast on first error */
    failFast: boolean;
  };
  
  /** Test selection criteria */
  testSelection: {
    /** Categories to include */
    includeCategories: string[];
    /** Categories to exclude */
    excludeCategories: string[];
    /** Minimum priority level */
    minPriority: 'low' | 'medium' | 'high' | 'critical';
    /** Specific platforms to test */
    platforms: string[];
    /** Whether to include regression tests */
    includeRegression: boolean;
  };
  
  /** Performance thresholds */
  performance: PerformanceThresholds;
  
  /** Vision validation settings */
  vision: VisionConfig;
  
  /** Output and reporting */
  output: {
    /** Base output directory */
    baseDir: string;
    /** Whether to generate HTML reports */
    htmlReport: boolean;
    /** Whether to generate JSON reports */
    jsonReport: boolean;
    /** Whether to save test artifacts */
    saveArtifacts: boolean;
    /** Log level for console output */
    logLevel: 'silent' | 'minimal' | 'normal' | 'verbose' | 'debug';
  };
  
  /** Test data configuration */
  testData: TestDataConfig;
  
  /** Environment-specific overrides */
  overrides?: {
    /** Custom environment variables */
    env?: Record<string, string>;
    /** Feature flags */
    features?: Record<string, boolean>;
    /** Platform-specific settings */
    platformSettings?: Record<string, any>;
  };
}

/**
 * Test Environment Configuration Manager
 * 
 * Manages test configurations for different environments and provides
 * utilities for environment detection, configuration loading, and validation.
 * 
 * @example
 * ```typescript
 * const configManager = new TestEnvironmentConfigManager();
 * 
 * // Auto-detect environment
 * const config = await configManager.getConfig();
 * 
 * // Load specific environment
 * const ciConfig = await configManager.getConfig('ci');
 * 
 * // Validate configuration
 * const isValid = configManager.validateConfig(config);
 * ```
 */
export class TestEnvironmentConfigManager {
  private configs: Map<TestEnvironment, TestEnvironmentConfig> = new Map();
  private configDir: string;

  constructor(configDir: string = 'test-config') {
    this.configDir = configDir;
    this.initializeDefaultConfigs();
  }

  /**
   * Gets configuration for specified environment or auto-detects
   * 
   * @param environment - Target environment (auto-detected if not specified)
   * @returns Test environment configuration
   */
  async getConfig(environment?: TestEnvironment): Promise<TestEnvironmentConfig> {
    const env = environment || this.detectEnvironment();
    
    // Try to load from file first
    const fileConfig = await this.loadConfigFromFile(env);
    if (fileConfig) {
      return fileConfig;
    }
    
    // Fall back to default configuration
    const defaultConfig = this.configs.get(env);
    if (!defaultConfig) {
      throw new Error(`No configuration found for environment: ${env}`);
    }
    
    return defaultConfig;
  }

  /**
   * Saves configuration to file for persistence
   * 
   * @param environment - Target environment
   * @param config - Configuration to save
   */
  async saveConfig(environment: TestEnvironment, config: TestEnvironmentConfig): Promise<void> {
    this.ensureConfigDir();
    
    const configPath = join(this.configDir, `${environment}.json`);
    writeFileSync(configPath, JSON.stringify(config, null, 2));
    
    console.log(`💾 Saved configuration for ${environment} to ${configPath}`);
  }

  /**
   * Validates configuration for completeness and correctness
   * 
   * @param config - Configuration to validate
   * @returns Validation result with any issues found
   */
  validateConfig(config: TestEnvironmentConfig): {
    valid: boolean;
    issues: string[];
    warnings: string[];
  } {
    const issues: string[] = [];
    const warnings: string[] = [];

    // Validate execution configuration
    if (config.execution.maxConcurrency < 1) {
      issues.push('maxConcurrency must be at least 1');
    }
    if (config.execution.globalTimeout < 1000) {
      warnings.push('globalTimeout is very low (< 1 second)');
    }

    // Validate performance thresholds
    if (config.performance.minQualityScore < 0 || config.performance.minQualityScore > 1) {
      issues.push('minQualityScore must be between 0 and 1');
    }
    if (config.performance.maxFailureRate < 0 || config.performance.maxFailureRate > 1) {
      issues.push('maxFailureRate must be between 0 and 1');
    }

    // Validate test data paths
    if (!existsSync(config.testData.baseDir)) {
      warnings.push(`Test data directory does not exist: ${config.testData.baseDir}`);
    }

    // Validate output directory
    if (!existsSync(config.output.baseDir)) {
      try {
        mkdirSync(config.output.baseDir, { recursive: true });
      } catch (error) {
        issues.push(`Cannot create output directory: ${config.output.baseDir}`);
      }
    }

    return {
      valid: issues.length === 0,
      issues,
      warnings
    };
  }

  /**
   * Auto-detects the current testing environment
   * 
   * @returns Detected environment type
   */
  private detectEnvironment(): TestEnvironment {
    // Check environment variables
    if (process.env.CI === 'true') {
      return 'ci';
    }
    
    if (process.env.NODE_ENV === 'production') {
      return 'production';
    }
    
    if (process.env.NODE_ENV === 'staging') {
      return 'staging';
    }
    
    if (process.env.TEST_MODE === 'benchmark') {
      return 'benchmark';
    }
    
    if (process.env.TEST_MODE === 'regression') {
      return 'regression';
    }
    
    // Default to development
    return 'development';
  }

  /**
   * Loads configuration from file if it exists
   * 
   * @param environment - Target environment
   * @returns Configuration or null if not found
   */
  private async loadConfigFromFile(environment: TestEnvironment): Promise<TestEnvironmentConfig | null> {
    const configPath = join(this.configDir, `${environment}.json`);
    
    if (!existsSync(configPath)) {
      return null;
    }
    
    try {
      const configData = readFileSync(configPath, 'utf-8');
      return JSON.parse(configData);
    } catch (error) {
      console.warn(`Failed to load config from ${configPath}:`, error);
      return null;
    }
  }

  /**
   * Ensures configuration directory exists
   */
  private ensureConfigDir(): void {
    if (!existsSync(this.configDir)) {
      mkdirSync(this.configDir, { recursive: true });
    }
  }

  /**
   * Initializes default configurations for all environments
   */
  private initializeDefaultConfigs(): void {
    // Development environment - full features, slower execution
    this.configs.set('development', {
      environment: 'development',
      name: 'Development',
      description: 'Local development with full features and detailed logging',
      execution: {
        parallel: true,
        maxConcurrency: 2,
        globalTimeout: 300000, // 5 minutes
        retries: 2,
        failFast: false
      },
      testSelection: {
        includeCategories: ['stability', 'performance', 'quality', 'platform'],
        excludeCategories: [],
        minPriority: 'medium',
        platforms: ['tiktok', 'youtube', 'instagram'],
        includeRegression: false
      },
      performance: {
        maxExecutionTime: 60000,
        maxMemoryUsage: 512 * 1024 * 1024,
        maxOutputSize: 50 * 1024 * 1024,
        minQualityScore: 0.7,
        maxFailureRate: 0.2
      },
      vision: {
        enabled: true,
        qualityThreshold: 0.75,
        captureFrames: true,
        frameExtraction: {
          count: 3,
          format: 'png',
          quality: 90
        }
      },
      output: {
        baseDir: 'test-results',
        htmlReport: true,
        jsonReport: true,
        saveArtifacts: true,
        logLevel: 'verbose'
      },
      testData: this.createDefaultTestData()
    });

    // CI environment - fast execution, essential tests only
    this.configs.set('ci', {
      environment: 'ci',
      name: 'Continuous Integration',
      description: 'Fast execution for CI/CD pipelines with essential tests',
      execution: {
        parallel: true,
        maxConcurrency: 4,
        globalTimeout: 180000, // 3 minutes
        retries: 1,
        failFast: true
      },
      testSelection: {
        includeCategories: ['stability', 'platform'],
        excludeCategories: ['performance'],
        minPriority: 'high',
        platforms: ['tiktok', 'youtube'],
        includeRegression: false
      },
      performance: {
        maxExecutionTime: 30000,
        maxMemoryUsage: 256 * 1024 * 1024,
        maxOutputSize: 25 * 1024 * 1024,
        minQualityScore: 0.6,
        maxFailureRate: 0.1
      },
      vision: {
        enabled: false, // Disabled for speed in CI
        qualityThreshold: 0.6,
        captureFrames: false,
        frameExtraction: {
          count: 1,
          format: 'jpg',
          quality: 70
        }
      },
      output: {
        baseDir: 'ci-results',
        htmlReport: false,
        jsonReport: true,
        saveArtifacts: false,
        logLevel: 'minimal'
      },
      testData: this.createDefaultTestData()
    });

    // Production environment - health checks and monitoring
    this.configs.set('production', {
      environment: 'production',
      name: 'Production Health Checks',
      description: 'Minimal health checks for production monitoring',
      execution: {
        parallel: false,
        maxConcurrency: 1,
        globalTimeout: 60000, // 1 minute
        retries: 3,
        failFast: false
      },
      testSelection: {
        includeCategories: ['stability'],
        excludeCategories: ['performance', 'regression'],
        minPriority: 'critical',
        platforms: ['tiktok'],
        includeRegression: false
      },
      performance: {
        maxExecutionTime: 15000,
        maxMemoryUsage: 128 * 1024 * 1024,
        maxOutputSize: 10 * 1024 * 1024,
        minQualityScore: 0.8,
        maxFailureRate: 0.05
      },
      vision: {
        enabled: true,
        qualityThreshold: 0.8,
        captureFrames: false,
        frameExtraction: {
          count: 1,
          format: 'jpg',
          quality: 60
        }
      },
      output: {
        baseDir: 'production-health',
        htmlReport: false,
        jsonReport: true,
        saveArtifacts: false,
        logLevel: 'minimal'
      },
      testData: this.createDefaultTestData()
    });

    // Benchmark environment - performance testing
    this.configs.set('benchmark', {
      environment: 'benchmark',
      name: 'Performance Benchmarking',
      description: 'Comprehensive performance testing and benchmarking',
      execution: {
        parallel: true,
        maxConcurrency: 6,
        globalTimeout: 600000, // 10 minutes
        retries: 0,
        failFast: false
      },
      testSelection: {
        includeCategories: ['performance'],
        excludeCategories: [],
        minPriority: 'low',
        platforms: ['tiktok', 'youtube', 'instagram', 'twitter', 'linkedin'],
        includeRegression: true
      },
      performance: {
        maxExecutionTime: 120000,
        maxMemoryUsage: 1024 * 1024 * 1024,
        maxOutputSize: 100 * 1024 * 1024,
        minQualityScore: 0.5,
        maxFailureRate: 0.3
      },
      vision: {
        enabled: true,
        qualityThreshold: 0.6,
        captureFrames: true,
        frameExtraction: {
          count: 5,
          format: 'png',
          quality: 95
        }
      },
      output: {
        baseDir: 'benchmark-results',
        htmlReport: true,
        jsonReport: true,
        saveArtifacts: true,
        logLevel: 'debug'
      },
      testData: this.createDefaultTestData()
    });

    // Add other environments...
    this.configs.set('staging', this.createStagingConfig());
    this.configs.set('regression', this.createRegressionConfig());
  }

  /**
   * Creates default test data configuration
   */
  private createDefaultTestData(): TestDataConfig {
    return {
      baseDir: 'sample-files',
      sampleVideos: {
        'red-sample': {
          path: 'sample-files/red-sample.mp4',
          duration: 5,
          resolution: { width: 640, height: 480 },
          format: 'mp4',
          size: 5988
        },
        'blue-sample': {
          path: 'sample-files/blue-sample.mp4',
          duration: 5,
          resolution: { width: 640, height: 480 },
          format: 'mp4',
          size: 5988
        },
        'portrait-sample': {
          path: 'sample-files/portrait-sample.mp4',
          duration: 8,
          resolution: { width: 480, height: 640 },
          format: 'mp4',
          size: 8589
        }
      },
      sampleImages: {
        'logo-150x150': {
          path: 'sample-files/logo-150x150.png',
          resolution: { width: 150, height: 150 },
          format: 'png',
          size: 327
        }
      },
      sampleAudio: {
        'background-music': {
          path: 'sample-files/background-music.mp3',
          duration: 10.03,
          format: 'mp3',
          sampleRate: 44100,
          size: 80474
        }
      },
      expectedOutputs: {}
    };
  }

  /**
   * Creates staging environment configuration
   */
  private createStagingConfig(): TestEnvironmentConfig {
    const base = this.configs.get('development')!;
    return {
      ...base,
      environment: 'staging',
      name: 'Staging Validation',
      description: 'Pre-production validation with production-like settings',
      performance: {
        ...base.performance,
        minQualityScore: 0.8,
        maxFailureRate: 0.1
      },
      output: {
        ...base.output,
        baseDir: 'staging-results',
        logLevel: 'normal'
      }
    };
  }

  /**
   * Creates regression testing configuration
   */
  private createRegressionConfig(): TestEnvironmentConfig {
    const base = this.configs.get('development')!;
    return {
      ...base,
      environment: 'regression',
      name: 'Regression Testing',
      description: 'Comprehensive regression testing with historical comparison',
      testSelection: {
        ...base.testSelection,
        includeCategories: ['stability', 'performance', 'quality', 'platform', 'regression'],
        includeRegression: true
      },
      execution: {
        ...base.execution,
        globalTimeout: 900000, // 15 minutes
        retries: 0
      },
      output: {
        ...base.output,
        baseDir: 'regression-results',
        saveArtifacts: true
      }
    };
  }
}
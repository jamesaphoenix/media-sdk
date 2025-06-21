/**
 * @fileoverview Advanced Runtime Test Runner
 * 
 * High-performance test execution engine with parallel processing,
 * comprehensive bug detection, and detailed reporting capabilities.
 * 
 * @author Media SDK Team
 * @version 1.0.0
 * @since 2024-12-20
 */

import { VisionRuntimeValidator } from './vision-runtime-validator.js';
import { existsSync, mkdirSync, writeFileSync, readFileSync } from 'fs';
import { createTikTokQuery, createYouTubeQuery, createInstagramQuery } from '@jamesaphoenix/media-sdk';
import type { VideoQueryResult } from '@jamesaphoenix/media-sdk';

/**
 * Comprehensive test scenario definition
 */
export interface TestScenario {
  /** Unique identifier for the test */
  id: string;
  /** Human-readable test name */
  name: string;
  /** Test category for organization */
  category: 'stability' | 'performance' | 'quality' | 'platform' | 'regression';
  /** Priority level for execution order */
  priority: 'critical' | 'high' | 'medium' | 'low';
  /** Platform being tested */
  platform: 'tiktok' | 'youtube' | 'instagram' | 'twitter' | 'linkedin';
  /** Input video file */
  inputVideo: string;
  /** Expected output characteristics */
  expected: {
    /** Minimum quality score (0.0-1.0) */
    minQuality: number;
    /** Expected text content */
    textContent?: string[];
    /** Expected duration in seconds */
    duration?: number;
    /** Expected resolution */
    resolution?: { width: number; height: number };
  };
  /** Test configuration */
  config: {
    /** Timeout in milliseconds */
    timeout: number;
    /** Number of retry attempts */
    retries: number;
    /** Whether to capture screenshots */
    captureFrames: boolean;
    /** Custom validation rules */
    customValidation?: (result: any) => boolean;
  };
  /** Test function that creates the timeline */
  testFunction: () => Promise<VideoQueryResult>;
}

/**
 * Test execution result with comprehensive metrics
 */
export interface TestResult {
  /** Test scenario that was executed */
  scenario: TestScenario;
  /** Whether the test passed */
  passed: boolean;
  /** Execution time in milliseconds */
  executionTime: number;
  /** Vision validation result */
  visionResult?: any;
  /** Error information if test failed */
  error?: {
    type: 'timeout' | 'validation' | 'execution' | 'system';
    message: string;
    stack?: string;
    context?: Record<string, any>;
  };
  /** Performance metrics */
  performance: {
    memoryUsage: number;
    cpuTime: number;
    renderTime: number;
    fileSize: number;
  };
  /** Quality metrics */
  quality: {
    score: number;
    visualQuality: string;
    textDetected: string[];
    issues: string[];
  };
  /** Regression information */
  regression?: {
    previousScore?: number;
    scoreChange?: number;
    isRegression: boolean;
  };
}

/**
 * Test suite execution report
 */
export interface TestSuiteReport {
  /** Report generation timestamp */
  timestamp: string;
  /** Total execution time */
  totalTime: number;
  /** Summary statistics */
  summary: {
    total: number;
    passed: number;
    failed: number;
    skipped: number;
    passRate: number;
  };
  /** Results by category */
  categories: Record<string, {
    total: number;
    passed: number;
    passRate: number;
  }>;
  /** Performance insights */
  performance: {
    averageExecutionTime: number;
    slowestTest: string;
    fastestTest: string;
    memoryPeakUsage: number;
  };
  /** Quality insights */
  quality: {
    averageScore: number;
    highestScore: number;
    lowestScore: number;
    qualityTrend: 'improving' | 'stable' | 'declining';
  };
  /** Detailed test results */
  results: TestResult[];
  /** System information */
  system: {
    platform: string;
    nodeVersion: string;
    memoryTotal: number;
    cpuCount: number;
  };
}

/**
 * Advanced Runtime Test Runner
 * 
 * Provides comprehensive test execution with parallel processing,
 * detailed reporting, and advanced bug detection capabilities.
 * 
 * @example
 * ```typescript
 * const runner = new AdvancedTestRunner({
 *   parallel: true,
 *   maxConcurrency: 4,
 *   outputDir: 'test-results',
 *   enableRegression: true
 * });
 * 
 * await runner.runTestSuite();
 * ```
 */
export class AdvancedTestRunner {
  private validator: VisionRuntimeValidator;
  private scenarios: TestScenario[] = [];
  private config: {
    parallel: boolean;
    maxConcurrency: number;
    outputDir: string;
    enableRegression: boolean;
    captureAllFrames: boolean;
  };

  constructor(config: Partial<typeof AdvancedTestRunner.prototype.config> = {}) {
    this.config = {
      parallel: true,
      maxConcurrency: 4,
      outputDir: 'test-results',
      enableRegression: true,
      captureAllFrames: false,
      ...config
    };

    this.validator = new VisionRuntimeValidator({
      qualityThreshold: 0.75,
      deepAnalysis: true,
      platformValidation: true,
      performanceBenchmarks: true
    });

    this.initializeScenarios();
  }

  /**
   * Initializes comprehensive test scenarios covering all major use cases
   */
  private initializeScenarios(): void {
    this.scenarios = [
      // Critical stability tests
      {
        id: 'stability-001',
        name: 'Basic TikTok Video Creation',
        category: 'stability',
        priority: 'critical',
        platform: 'tiktok',
        inputVideo: 'sample-files/red-sample.mp4',
        expected: {
          minQuality: 0.8,
          textContent: ['TikTok Test'],
          resolution: { width: 1080, height: 1920 }
        },
        config: {
          timeout: 30000,
          retries: 3,
          captureFrames: true
        },
        testFunction: async () => {
          return await createTikTokQuery('sample-files/red-sample.mp4')
            .addText('TikTok Test', { position: 'center' })
            .build('test-results/stability-001.mp4');
        }
      },

      // Performance stress tests
      {
        id: 'performance-001',
        name: 'Multi-Layer Composition Performance',
        category: 'performance',
        priority: 'high',
        platform: 'tiktok',
        inputVideo: 'sample-files/portrait-sample.mp4',
        expected: {
          minQuality: 0.75,
          textContent: ['Layer 1', 'Layer 2', 'Layer 3']
        },
        config: {
          timeout: 60000,
          retries: 2,
          captureFrames: true
        },
        testFunction: async () => {
          return await createTikTokQuery('sample-files/portrait-sample.mp4')
            .addText('Layer 1', { position: 'top-center', style: { fontSize: 32 } })
            .addText('Layer 2', { position: 'center', style: { fontSize: 28 } })
            .addText('Layer 3', { position: 'bottom-center', style: { fontSize: 24 } })
            .addWatermark('sample-files/logo-150x150.png', 'top-right')
            .build('test-results/performance-001.mp4');
        }
      },

      // Quality validation tests
      {
        id: 'quality-001',
        name: 'High-Quality YouTube Content',
        category: 'quality',
        priority: 'high',
        platform: 'youtube',
        inputVideo: 'sample-files/blue-sample.mp4',
        expected: {
          minQuality: 0.85,
          textContent: ['Professional Content'],
          resolution: { width: 1920, height: 1080 }
        },
        config: {
          timeout: 45000,
          retries: 2,
          captureFrames: true
        },
        testFunction: async () => {
          return await createYouTubeQuery('sample-files/blue-sample.mp4', { quality: 'ultra' })
            .addText('Professional Content', {
              position: 'bottom-center',
              style: {
                fontSize: 28,
                color: '#ffffff',
                backgroundColor: 'rgba(0,0,0,0.8)'
              }
            })
            .build('test-results/quality-001.mp4');
        }
      },

      // Platform compliance tests
      {
        id: 'platform-001',
        name: 'Instagram Square Format Compliance',
        category: 'platform',
        priority: 'high',
        platform: 'instagram',
        inputVideo: 'sample-files/red-sample.mp4',
        expected: {
          minQuality: 0.8,
          textContent: ['Instagram Ready'],
          resolution: { width: 1080, height: 1080 }
        },
        config: {
          timeout: 35000,
          retries: 2,
          captureFrames: true
        },
        testFunction: async () => {
          return await createInstagramQuery('sample-files/red-sample.mp4')
            .addText('Instagram Ready', { position: 'center' })
            .build('test-results/platform-001.mp4');
        }
      },

      // Edge case and regression tests
      {
        id: 'regression-001',
        name: 'Complex Text Positioning Edge Cases',
        category: 'regression',
        priority: 'medium',
        platform: 'tiktok',
        inputVideo: 'sample-files/portrait-sample.mp4',
        expected: {
          minQuality: 0.7,
          textContent: ['Top Left', 'Center', 'Bottom Right']
        },
        config: {
          timeout: 40000,
          retries: 1,
          captureFrames: true,
          customValidation: (result) => {
            // Custom validation for positioning accuracy
            return result.textDetected?.length >= 2;
          }
        },
        testFunction: async () => {
          return await createTikTokQuery('sample-files/portrait-sample.mp4')
            .addText('Top Left', { position: 'top-left' })
            .addText('Center', { position: 'center' })
            .addText('Bottom Right', { position: 'bottom-right' })
            .build('test-results/regression-001.mp4');
        }
      }
    ];
  }

  /**
   * Runs the complete test suite with parallel execution
   */
  async runTestSuite(): Promise<TestSuiteReport> {
    console.log('🚀 Starting Advanced Runtime Test Suite');
    console.log(`📊 Configuration: ${this.config.parallel ? 'Parallel' : 'Sequential'} execution`);
    console.log(`🔧 Max Concurrency: ${this.config.maxConcurrency}`);
    console.log(`📁 Output Directory: ${this.config.outputDir}`);
    
    const startTime = Date.now();
    
    // Ensure output directory exists
    this.ensureOutputDirectory();
    
    // Load previous results for regression testing
    const previousResults = this.loadPreviousResults();
    
    // Execute tests
    const results = this.config.parallel ? 
      await this.executeTestsParallel() : 
      await this.executeTestsSequential();
    
    // Add regression analysis
    this.analyzeRegression(results, previousResults);
    
    const totalTime = Date.now() - startTime;
    
    // Generate comprehensive report
    const report = this.generateReport(results, totalTime);
    
    // Save results for future regression testing
    this.saveResults(results);
    
    // Generate HTML report
    await this.generateHTMLReport(report);
    
    console.log(`✅ Test Suite Completed in ${totalTime}ms`);
    console.log(`📊 Results: ${report.summary.passed}/${report.summary.total} passed (${Math.round(report.summary.passRate * 100)}%)`);
    
    return report;
  }

  /**
   * Executes tests in parallel with controlled concurrency
   */
  private async executeTestsParallel(): Promise<TestResult[]> {
    console.log(`⚡ Executing ${this.scenarios.length} tests in parallel...`);
    
    const results: TestResult[] = [];
    const semaphore = new Array(this.config.maxConcurrency).fill(null);
    
    const executeWithSemaphore = async (scenario: TestScenario): Promise<TestResult> => {
      // Wait for available slot
      await new Promise<void>((resolve) => {
        const tryAcquire = () => {
          const index = semaphore.findIndex(slot => slot === null);
          if (index !== -1) {
            semaphore[index] = scenario.id;
            resolve();
          } else {
            setTimeout(tryAcquire, 10);
          }
        };
        tryAcquire();
      });

      try {
        const result = await this.executeTest(scenario);
        return result;
      } finally {
        // Release semaphore slot
        const index = semaphore.findIndex(slot => slot === scenario.id);
        if (index !== -1) {
          semaphore[index] = null;
        }
      }
    };

    // Execute all tests with concurrency control
    const promises = this.scenarios.map(scenario => executeWithSemaphore(scenario));
    const allResults = await Promise.allSettled(promises);

    // Process results
    allResults.forEach((result, index) => {
      if (result.status === 'fulfilled') {
        results.push(result.value);
      } else {
        console.error(`❌ Test ${this.scenarios[index].id} failed:`, result.reason);
        results.push(this.createFailedResult(this.scenarios[index], result.reason));
      }
    });

    return results;
  }

  /**
   * Executes tests sequentially (fallback mode)
   */
  private async executeTestsSequential(): Promise<TestResult[]> {
    console.log(`🔄 Executing ${this.scenarios.length} tests sequentially...`);
    
    const results: TestResult[] = [];
    
    for (const scenario of this.scenarios) {
      try {
        const result = await this.executeTest(scenario);
        results.push(result);
        
        // Progress indicator
        const progress = Math.round((results.length / this.scenarios.length) * 100);
        console.log(`📈 Progress: ${results.length}/${this.scenarios.length} (${progress}%)`);
        
      } catch (error) {
        console.error(`❌ Test ${scenario.id} failed:`, error);
        results.push(this.createFailedResult(scenario, error));
      }
    }
    
    return results;
  }

  /**
   * Executes a single test scenario with comprehensive monitoring
   */
  private async executeTest(scenario: TestScenario): Promise<TestResult> {
    console.log(`🧪 Executing: ${scenario.name} (${scenario.id})`);
    
    const startTime = Date.now();
    const initialMemory = process.memoryUsage().heapUsed;
    
    try {
      // Execute test function with timeout
      const queryResult = await Promise.race([
        scenario.testFunction(),
        new Promise<never>((_, reject) => 
          setTimeout(() => reject(new Error('Test timeout')), scenario.config.timeout)
        )
      ]);

      const executionTime = Date.now() - startTime;
      const memoryUsed = process.memoryUsage().heapUsed - initialMemory;

      // Validate with vision system
      const outputPath = `test-results/${scenario.id}.mp4`;
      
      // Extract FFmpeg commands from query result for context
      const ffmpegCommands = queryResult.data?.metadata?.ffmpegCommands || 
                            queryResult.isSuccess ? ['FFmpeg render completed successfully'] : [];
      
      const visionResult = await this.validator.validateRender(
        outputPath,
        scenario.platform,
        queryResult,
        scenario.expected.textContent,
        ffmpegCommands
      );

      // Check if test passes all criteria
      const passed = this.evaluateTestResult(scenario, queryResult, visionResult);

      return {
        scenario,
        passed,
        executionTime,
        visionResult,
        performance: {
          memoryUsage: memoryUsed,
          cpuTime: executionTime, // Simplified - real CPU time would need process monitoring
          renderTime: visionResult.performance?.renderTime || 0,
          fileSize: visionResult.performance?.fileSize || 0
        },
        quality: {
          score: visionResult.qualityScore || 0,
          visualQuality: visionResult.visualQuality || 'unknown',
          textDetected: visionResult.textDetected || [],
          issues: visionResult.issues || []
        }
      };

    } catch (error) {
      const executionTime = Date.now() - startTime;
      return this.createFailedResult(scenario, error, executionTime);
    }
  }

  /**
   * Evaluates whether a test result meets all criteria
   */
  private evaluateTestResult(
    scenario: TestScenario, 
    queryResult: VideoQueryResult, 
    visionResult: any
  ): boolean {
    // Basic success check
    if (!queryResult.isSuccess || !visionResult.success) {
      return false;
    }

    // Quality threshold check
    if (visionResult.qualityScore < scenario.expected.minQuality) {
      return false;
    }

    // Resolution check
    if (scenario.expected.resolution) {
      const actualSize = queryResult.data?.metadata.size;
      if (actualSize?.width !== scenario.expected.resolution.width || 
          actualSize?.height !== scenario.expected.resolution.height) {
        return false;
      }
    }

    // Text content check
    if (scenario.expected.textContent?.length) {
      const detectedText = visionResult.textDetected || [];
      const hasExpectedText = scenario.expected.textContent.some(expected =>
        detectedText.some((detected: string) => 
          detected.toLowerCase().includes(expected.toLowerCase())
        )
      );
      if (!hasExpectedText) {
        return false;
      }
    }

    // Custom validation
    if (scenario.config.customValidation) {
      return scenario.config.customValidation(visionResult);
    }

    return true;
  }

  /**
   * Creates a failed test result with error information
   */
  private createFailedResult(
    scenario: TestScenario, 
    error: any, 
    executionTime: number = 0
  ): TestResult {
    return {
      scenario,
      passed: false,
      executionTime,
      error: {
        type: 'execution',
        message: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined
      },
      performance: {
        memoryUsage: 0,
        cpuTime: executionTime,
        renderTime: 0,
        fileSize: 0
      },
      quality: {
        score: 0,
        visualQuality: 'poor',
        textDetected: [],
        issues: ['Test execution failed']
      }
    };
  }

  /**
   * Generates comprehensive test suite report
   */
  private generateReport(results: TestResult[], totalTime: number): TestSuiteReport {
    const passed = results.filter(r => r.passed).length;
    const failed = results.filter(r => !r.passed).length;
    
    // Calculate performance metrics
    const executionTimes = results.map(r => r.executionTime);
    const slowestTest = results.reduce((prev, curr) => 
      curr.executionTime > prev.executionTime ? curr : prev
    );
    const fastestTest = results.reduce((prev, curr) => 
      curr.executionTime < prev.executionTime ? curr : prev
    );

    // Calculate quality metrics
    const qualityScores = results.map(r => r.quality.score);
    const averageScore = qualityScores.reduce((sum, score) => sum + score, 0) / qualityScores.length;

    return {
      timestamp: new Date().toISOString(),
      totalTime,
      summary: {
        total: results.length,
        passed,
        failed,
        skipped: 0,
        passRate: passed / results.length
      },
      categories: this.calculateCategoryStats(results),
      performance: {
        averageExecutionTime: executionTimes.reduce((sum, time) => sum + time, 0) / executionTimes.length,
        slowestTest: slowestTest.scenario.name,
        fastestTest: fastestTest.scenario.name,
        memoryPeakUsage: Math.max(...results.map(r => r.performance.memoryUsage))
      },
      quality: {
        averageScore,
        highestScore: Math.max(...qualityScores),
        lowestScore: Math.min(...qualityScores),
        qualityTrend: 'stable' // Would be calculated from historical data
      },
      results,
      system: {
        platform: process.platform,
        nodeVersion: process.version,
        memoryTotal: require('os').totalmem(),
        cpuCount: require('os').cpus().length
      }
    };
  }

  /**
   * Calculates statistics by test category
   */
  private calculateCategoryStats(results: TestResult[]) {
    const categories: Record<string, { total: number; passed: number; passRate: number }> = {};
    
    for (const result of results) {
      const category = result.scenario.category;
      if (!categories[category]) {
        categories[category] = { total: 0, passed: 0, passRate: 0 };
      }
      
      categories[category].total++;
      if (result.passed) {
        categories[category].passed++;
      }
    }
    
    // Calculate pass rates
    for (const category of Object.keys(categories)) {
      categories[category].passRate = categories[category].passed / categories[category].total;
    }
    
    return categories;
  }

  /**
   * Ensures output directory structure exists
   */
  private ensureOutputDirectory(): void {
    if (!existsSync(this.config.outputDir)) {
      mkdirSync(this.config.outputDir, { recursive: true });
    }
  }

  /**
   * Loads previous test results for regression analysis
   */
  private loadPreviousResults(): TestResult[] {
    const resultsFile = `${this.config.outputDir}/previous-results.json`;
    if (existsSync(resultsFile)) {
      try {
        const data = readFileSync(resultsFile, 'utf-8');
        return JSON.parse(data);
      } catch (error) {
        console.warn('Failed to load previous results:', error);
      }
    }
    return [];
  }

  /**
   * Saves test results for future regression analysis
   */
  private saveResults(results: TestResult[]): void {
    const resultsFile = `${this.config.outputDir}/previous-results.json`;
    writeFileSync(resultsFile, JSON.stringify(results, null, 2));
  }

  /**
   * Analyzes regression by comparing with previous results
   */
  private analyzeRegression(currentResults: TestResult[], previousResults: TestResult[]): void {
    if (!this.config.enableRegression || previousResults.length === 0) {
      return;
    }

    for (const current of currentResults) {
      const previous = previousResults.find(p => p.scenario.id === current.scenario.id);
      if (previous) {
        const scoreChange = current.quality.score - previous.quality.score;
        current.regression = {
          previousScore: previous.quality.score,
          scoreChange,
          isRegression: scoreChange < -0.1 // 10% quality drop is considered regression
        };
      }
    }
  }

  /**
   * Generates HTML report for better visualization
   */
  private async generateHTMLReport(report: TestSuiteReport): Promise<void> {
    const htmlContent = `
<!DOCTYPE html>
<html>
<head>
    <title>Media SDK Test Report</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 20px; }
        .summary { background: #f5f5f5; padding: 20px; border-radius: 8px; margin-bottom: 20px; }
        .test-result { border: 1px solid #ddd; margin: 10px 0; padding: 15px; border-radius: 5px; }
        .passed { border-left: 5px solid #4CAF50; }
        .failed { border-left: 5px solid #f44336; }
        .metrics { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 15px; }
        .metric { background: #fff; padding: 15px; border-radius: 5px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
    </style>
</head>
<body>
    <h1>Media SDK Test Report</h1>
    <div class="summary">
        <h2>Summary</h2>
        <p><strong>Total Tests:</strong> ${report.summary.total}</p>
        <p><strong>Passed:</strong> ${report.summary.passed}</p>
        <p><strong>Failed:</strong> ${report.summary.failed}</p>
        <p><strong>Pass Rate:</strong> ${Math.round(report.summary.passRate * 100)}%</p>
        <p><strong>Execution Time:</strong> ${report.totalTime}ms</p>
    </div>
    
    <div class="metrics">
        <div class="metric">
            <h3>Performance</h3>
            <p>Average Execution: ${Math.round(report.performance.averageExecutionTime)}ms</p>
            <p>Slowest Test: ${report.performance.slowestTest}</p>
            <p>Peak Memory: ${Math.round(report.performance.memoryPeakUsage / 1024 / 1024)}MB</p>
        </div>
        <div class="metric">
            <h3>Quality</h3>
            <p>Average Score: ${Math.round(report.quality.averageScore * 100)}%</p>
            <p>Highest Score: ${Math.round(report.quality.highestScore * 100)}%</p>
            <p>Lowest Score: ${Math.round(report.quality.lowestScore * 100)}%</p>
        </div>
    </div>

    <h2>Test Results</h2>
    ${report.results.map(result => `
        <div class="test-result ${result.passed ? 'passed' : 'failed'}">
            <h3>${result.scenario.name} (${result.scenario.id})</h3>
            <p><strong>Status:</strong> ${result.passed ? '✅ PASSED' : '❌ FAILED'}</p>
            <p><strong>Platform:</strong> ${result.scenario.platform}</p>
            <p><strong>Execution Time:</strong> ${result.executionTime}ms</p>
            <p><strong>Quality Score:</strong> ${Math.round(result.quality.score * 100)}%</p>
            ${result.error ? `<p><strong>Error:</strong> ${result.error.message}</p>` : ''}
        </div>
    `).join('')}
</body>
</html>`;

    writeFileSync(`${this.config.outputDir}/report.html`, htmlContent);
    console.log(`📄 HTML Report generated: ${this.config.outputDir}/report.html`);
  }
}
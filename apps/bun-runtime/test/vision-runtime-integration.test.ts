/**
 * @fileoverview Vision-Driven Runtime Integration Tests
 * 
 * Comprehensive test suite that validates SDK stability using both
 * FFmpeg probe technical analysis and Google Gemini vision feedback.
 * 
 * This ensures hardcore package quality similar to Tanstack by validating
 * that every render meets both technical and visual quality standards.
 * 
 * @author Media SDK Team
 * @version 1.0.0
 * @since 2024-12-20
 */

import { test, expect, describe, beforeAll, afterAll } from 'bun:test';
import { createTikTokQuery, createYouTubeQuery, createInstagramQuery } from '@jamesaphoenix/media-sdk';
import { VisionRuntimeValidator } from '../src/vision-runtime-validator.js';
import { existsSync } from 'fs';

/**
 * Vision-driven runtime integration test suite
 * 
 * These tests validate SDK stability by:
 * 1. Using FFmpeg probe for technical validation
 * 2. Using Gemini Vision API for visual quality assessment
 * 3. Ensuring platform compliance and stability
 * 4. Providing comprehensive feedback for improvements
 */
describe('🔬 Vision-Driven Runtime Integration', () => {
  let validator: VisionRuntimeValidator;

  beforeAll(async () => {
    // Initialize vision runtime validator with strict settings
    validator = new VisionRuntimeValidator({
      qualityThreshold: 0.85, // High quality threshold
      deepAnalysis: true,
      platformValidation: true,
      performanceBenchmarks: true,
      autoRetry: false // Don't auto-retry for testing
    });

    // Ensure output directory exists
    if (!existsSync('output/vision-runtime-tests')) {
      await Bun.spawn(['mkdir', '-p', 'output/vision-runtime-tests']);
    }

    console.log('🎯 Vision-driven runtime integration testing started');
    console.log('📊 Using FFmpeg probe + Gemini Vision for comprehensive validation');
  });

  afterAll(() => {
    console.log('✅ Vision-driven runtime integration testing completed');
  });

  describe('🎬 Platform-Specific Validation', () => {
    /**
     * TikTok validation with comprehensive FFmpeg + Vision analysis
     * 
     * Tests the entire pipeline from query creation to final validation,
     * ensuring TikTok compliance and visual quality standards.
     */
    test('should validate TikTok video with FFmpeg probe + Gemini vision', async () => {
      console.log('🎵 Testing TikTok validation pipeline...');

      // Create TikTok video with text and image
      const query = createTikTokQuery('sample-files/red-sample.mp4', {
        quality: 'high',
        validation: { enabled: true, strictMode: true }
      })
        .addText('🔥 TikTok Quality Test 🔥', {
          position: 'center',
          style: {
            fontSize: 36,
            color: '#ffffff',
            strokeColor: '#000000',
            strokeWidth: 3,
            fontWeight: 'bold'
          }
        })
        .addWatermark('sample-files/logo-150x150.png', 'top-right');

      // Build query and get metadata
      const queryResult = await query.build('output/vision-runtime-tests/tiktok-validation.mp4');
      expect(queryResult.isSuccess).toBe(true);

      // Validate with vision runtime validator
      const visionResult = await validator.validateRender(
        'output/vision-runtime-tests/tiktok-validation.mp4',
        'tiktok',
        queryResult,
        ['TikTok Quality Test']
      );

      console.log('📊 TikTok Validation Results:', {
        success: visionResult.success,
        qualityScore: visionResult.qualityScore,
        visualQuality: visionResult.visualQuality,
        formatCorrect: visionResult.formatCorrect,
        renderStable: visionResult.stability.renderStable
      });

      // Core stability assertions
      expect(visionResult.stability.renderStable).toBe(true);
      expect(visionResult.formatCorrect).toBe(true);
      expect(visionResult.qualityScore).toBeGreaterThanOrEqual(0.7);

      // Performance assertions
      expect(visionResult.performance.renderTime).toBeLessThan(60000); // 60s max
      expect(visionResult.performance.fileSize).toBeGreaterThan(1000); // At least 1KB

      // Log detailed feedback
      if (visionResult.issues.length > 0) {
        console.log('⚠️ Issues found:', visionResult.issues);
      }
      if (visionResult.recommendations.length > 0) {
        console.log('💡 Recommendations:', visionResult.recommendations);
      }

      console.log('✅ TikTok validation completed');
    }, 30000);

    /**
     * YouTube validation with technical and visual analysis
     */
    test('should validate YouTube video with comprehensive analysis', async () => {
      console.log('📺 Testing YouTube validation pipeline...');

      const query = createYouTubeQuery('sample-files/blue-sample.mp4', {
        quality: 'ultra',
        validation: { enabled: true, strictMode: true }
      })
        .addText('Professional YouTube Content', {
          position: 'bottom-center',
          style: {
            fontSize: 28,
            color: '#ffffff',
            backgroundColor: 'rgba(0,0,0,0.8)',
            fontFamily: 'Arial'
          }
        });

      const queryResult = await query.build('output/vision-runtime-tests/youtube-validation.mp4');
      expect(queryResult.isSuccess).toBe(true);

      const visionResult = await validator.validateRender(
        'output/vision-runtime-tests/youtube-validation.mp4',
        'youtube',
        queryResult,
        ['Professional YouTube Content']
      );

      console.log('📊 YouTube Validation Results:', {
        success: visionResult.success,
        qualityScore: visionResult.qualityScore,
        aspectRatio: queryResult.data?.metadata.aspectRatio,
        compressionEfficiency: visionResult.performance.compressionEfficiency
      });

      // YouTube-specific validations
      expect(visionResult.stability.renderStable).toBe(true);
      expect(queryResult.data?.metadata.aspectRatio).toBe('16:9');
      expect(visionResult.performance.compressionEfficiency).toBeGreaterThan(0.5);

      console.log('✅ YouTube validation completed');
    }, 30000);

    /**
     * Instagram validation with square format compliance
     */
    test('should validate Instagram square format with vision feedback', async () => {
      console.log('📷 Testing Instagram validation pipeline...');

      const query = createInstagramQuery('sample-files/portrait-sample.mp4')
        .addText('Instagram Feed Ready 📸', {
          position: 'top-center',
          style: {
            fontSize: 32,
            color: '#E4405F',
            fontWeight: 'bold'
          }
        })
        .addImage('sample-files/logo-150x150.png', {
          position: 'bottom-right',
          opacity: 0.8
        });

      const queryResult = await query.build('output/vision-runtime-tests/instagram-validation.mp4');
      expect(queryResult.isSuccess).toBe(true);

      const visionResult = await validator.validateRender(
        'output/vision-runtime-tests/instagram-validation.mp4',
        'instagram',
        queryResult,
        ['Instagram Feed Ready']
      );

      console.log('📊 Instagram Validation Results:', {
        success: visionResult.success,
        qualityScore: visionResult.qualityScore,
        aspectRatio: queryResult.data?.metadata.aspectRatio,
        textDetected: visionResult.textDetected
      });

      // Instagram-specific validations
      expect(visionResult.stability.renderStable).toBe(true);
      expect(queryResult.data?.metadata.aspectRatio).toBe('1:1');
      expect(queryResult.data?.metadata.size).toEqual({ width: 1080, height: 1080 });

      console.log('✅ Instagram validation completed');
    }, 30000);
  });

  describe('🔧 Technical Validation with FFmpeg Probe', () => {
    /**
     * Comprehensive technical validation using FFmpeg probe
     */
    test('should perform detailed technical analysis with FFmpeg probe', async () => {
      console.log('🔬 Testing FFmpeg probe technical analysis...');

      const query = createTikTokQuery('sample-files/red-sample.mp4')
        .addText('Technical Analysis Test')
        .addWatermark('sample-files/logo-150x150.png');

      const queryResult = await query.build('output/vision-runtime-tests/technical-analysis.mp4');
      const visionResult = await validator.validateRender(
        'output/vision-runtime-tests/technical-analysis.mp4',
        'tiktok',
        queryResult
      );

      // Technical validation assertions
      expect(visionResult.stability.renderStable).toBe(true);
      expect(visionResult.performance.fileSize).toBeGreaterThan(0);
      expect(visionResult.performance.compressionEfficiency).toBeGreaterThanOrEqual(0);

      // Log technical details
      console.log('🔬 Technical Analysis Results:', {
        fileSize: `${Math.round(visionResult.performance.fileSize / 1024)}KB`,
        compressionEfficiency: `${Math.round(visionResult.performance.compressionEfficiency * 100)}%`,
        renderTime: `${visionResult.performance.renderTime}ms`,
        memoryUsage: `${Math.round(visionResult.stability.memoryUsage / 1024 / 1024)}MB`
      });

      console.log('✅ Technical analysis completed');
    }, 20000);

    /**
     * Performance benchmarking test
     */
    test('should meet performance benchmarks for production use', async () => {
      console.log('⚡ Testing performance benchmarks...');

      const startTime = Date.now();

      // Create multiple formats for performance testing
      const platforms = [
        { name: 'tiktok', query: createTikTokQuery('sample-files/red-sample.mp4') },
        { name: 'youtube', query: createYouTubeQuery('sample-files/blue-sample.mp4') },
        { name: 'instagram', query: createInstagramQuery('sample-files/portrait-sample.mp4') }
      ];

      const results = [];
      for (const platform of platforms) {
        const platformStart = Date.now();
        
        const queryResult = await platform.query
          .addText(`${platform.name.toUpperCase()} Performance Test`)
          .build(`output/vision-runtime-tests/perf-${platform.name}.mp4`);

        const visionResult = await validator.validateRender(
          `output/vision-runtime-tests/perf-${platform.name}.mp4`,
          platform.name,
          queryResult
        );

        const platformTime = Date.now() - platformStart;
        results.push({
          platform: platform.name,
          time: platformTime,
          stable: visionResult.stability.renderStable,
          quality: visionResult.qualityScore
        });
      }

      const totalTime = Date.now() - startTime;

      console.log('⚡ Performance Results:', {
        totalTime: `${totalTime}ms`,
        platforms: results,
        averageQuality: results.reduce((sum, r) => sum + r.quality, 0) / results.length
      });

      // Performance assertions
      expect(totalTime).toBeLessThan(90000); // 90s for all platforms
      results.forEach(result => {
        expect(result.stable).toBe(true);
        expect(result.quality).toBeGreaterThan(0.6);
      });

      console.log('✅ Performance benchmarks met');
    }, 120000);
  });

  describe('🎨 Visual Quality Assessment', () => {
    /**
     * Vision-based quality assessment test
     */
    test('should assess visual quality using Gemini Vision API', async () => {
      console.log('👁️ Testing Gemini Vision quality assessment...');

      const query = createTikTokQuery('sample-files/red-sample.mp4')
        .addText('Vision Quality Test 🎨', {
          position: 'center',
          style: {
            fontSize: 40,
            color: '#ffff00',
            strokeColor: '#000000',
            strokeWidth: 2
          }
        })
        .addImage('sample-files/logo-150x150.png', {
          position: 'top-left',
          duration: 'full'
        });

      const queryResult = await query.build('output/vision-runtime-tests/vision-quality.mp4');
      const visionResult = await validator.validateRender(
        'output/vision-runtime-tests/vision-quality.mp4',
        'tiktok',
        queryResult,
        ['Vision Quality Test']
      );

      console.log('👁️ Vision Assessment Results:', {
        visualQuality: visionResult.visualQuality,
        qualityScore: visionResult.qualityScore,
        textDetected: visionResult.textDetected,
        textCount: visionResult.textDetected.length
      });

      // Vision quality assertions
      expect(['excellent', 'good', 'fair']).toContain(visionResult.visualQuality);
      expect(visionResult.qualityScore).toBeGreaterThan(0.5);

      // Text detection validation
      if (visionResult.textDetected.length > 0) {
        console.log('✅ Text successfully detected by vision API');
        const hasExpectedText = visionResult.textDetected.some(text => 
          text.toLowerCase().includes('vision') || 
          text.toLowerCase().includes('quality') ||
          text.toLowerCase().includes('test')
        );
        expect(hasExpectedText).toBe(true);
      }

      console.log('✅ Vision quality assessment completed');
    }, 45000);

    /**
     * Multi-layer composition quality test
     */
    test('should validate complex multi-layer compositions', async () => {
      console.log('🎭 Testing complex multi-layer composition...');

      const query = createTikTokQuery('sample-files/portrait-sample.mp4')
        // Background watermark
        .addWatermark('sample-files/logo-150x150.png', 'top-right')
        
        // Main title
        .addText('🚀 COMPLEX COMPOSITION', {
          position: 'top-center',
          style: {
            fontSize: 32,
            color: '#ff0066',
            fontWeight: 'bold',
            strokeColor: '#ffffff',
            strokeWidth: 2
          },
          startTime: 0,
          duration: 3
        })
        
        // Subtitle
        .addText('Multi-layer Stability Test', {
          position: 'center',
          style: {
            fontSize: 24,
            color: '#ffffff',
            backgroundColor: 'rgba(0,0,0,0.7)'
          },
          startTime: 1,
          duration: 4
        })
        
        // Call to action
        .addText('Like & Subscribe! 👍', {
          position: 'bottom-center',
          style: {
            fontSize: 28,
            color: '#ffff00',
            fontWeight: 'bold'
          },
          startTime: 2,
          duration: 3
        });

      const queryResult = await query.build('output/vision-runtime-tests/complex-composition.mp4');
      const visionResult = await validator.validateRender(
        'output/vision-runtime-tests/complex-composition.mp4',
        'tiktok',
        queryResult,
        ['COMPLEX COMPOSITION', 'Multi-layer', 'Subscribe']
      );

      console.log('🎭 Complex Composition Results:', {
        success: visionResult.success,
        qualityScore: visionResult.qualityScore,
        layersDetected: visionResult.textDetected.length,
        renderStable: visionResult.stability.renderStable,
        issues: visionResult.issues.length
      });

      // Complex composition validations
      expect(visionResult.stability.renderStable).toBe(true);
      expect(visionResult.textDetected.length).toBeGreaterThan(0);
      expect(visionResult.qualityScore).toBeGreaterThan(0.6);

      // Stability under complexity
      expect(visionResult.stability.warnings.length).toBeLessThan(3);

      console.log('✅ Complex composition validation completed');
    }, 35000);
  });

  describe('🛡️ Stability & Error Handling', () => {
    /**
     * Error scenario handling test
     */
    test('should handle error scenarios gracefully', async () => {
      console.log('🛡️ Testing error scenario handling...');

      // Test with non-existent file
      const invalidResult = await validator.validateRender(
        'non-existent-file.mp4',
        'tiktok',
        { isSuccess: false, isError: true, isLoading: false } as any
      );

      expect(invalidResult.success).toBe(false);
      expect(invalidResult.issues.length).toBeGreaterThan(0);
      expect(invalidResult.issues[0]).toContain('not found');

      console.log('🛡️ Error handling validation:', {
        errorHandled: !invalidResult.success,
        issueCount: invalidResult.issues.length,
        firstIssue: invalidResult.issues[0]
      });

      console.log('✅ Error handling validation completed');
    }, 10000);

    /**
     * Resource usage monitoring test
     */
    test('should monitor resource usage during validation', async () => {
      console.log('📊 Testing resource usage monitoring...');

      const initialMemory = process.memoryUsage().heapUsed;

      const query = createYouTubeQuery('sample-files/blue-sample.mp4')
        .addText('Resource Monitoring Test');

      const queryResult = await query.build('output/vision-runtime-tests/resource-test.mp4');
      const visionResult = await validator.validateRender(
        'output/vision-runtime-tests/resource-test.mp4',
        'youtube',
        queryResult
      );

      const finalMemory = process.memoryUsage().heapUsed;
      const memoryIncrease = finalMemory - initialMemory;

      console.log('📊 Resource Usage:', {
        memoryIncrease: `${Math.round(memoryIncrease / 1024 / 1024)}MB`,
        renderTime: `${visionResult.performance.renderTime}ms`,
        warnings: visionResult.stability.warnings.length
      });

      // Resource usage assertions
      expect(memoryIncrease).toBeLessThan(100 * 1024 * 1024); // < 100MB increase
      expect(visionResult.performance.renderTime).toBeLessThan(30000); // < 30s

      console.log('✅ Resource monitoring completed');
    }, 25000);
  });

  describe('📈 Continuous Improvement', () => {
    /**
     * Feedback aggregation test
     */
    test('should aggregate feedback for continuous improvement', async () => {
      console.log('📈 Testing feedback aggregation...');

      const testCases = [
        { platform: 'tiktok', text: 'Feedback Test 1', file: 'red-sample.mp4' },
        { platform: 'youtube', text: 'Feedback Test 2', file: 'blue-sample.mp4' },
        { platform: 'instagram', text: 'Feedback Test 3', file: 'portrait-sample.mp4' }
      ];

      const feedbackResults = [];

      for (const testCase of testCases) {
        const query = createTikTokQuery(`sample-files/${testCase.file}`)
          .addText(testCase.text);

        const queryResult = await query.build(`output/vision-runtime-tests/feedback-${testCase.platform}.mp4`);
        const visionResult = await validator.validateRender(
          `output/vision-runtime-tests/feedback-${testCase.platform}.mp4`,
          testCase.platform as any,
          queryResult,
          [testCase.text]
        );

        feedbackResults.push({
          platform: testCase.platform,
          qualityScore: visionResult.qualityScore,
          issues: visionResult.issues.length,
          recommendations: visionResult.recommendations.length
        });
      }

      const avgQuality = feedbackResults.reduce((sum, r) => sum + r.qualityScore, 0) / feedbackResults.length;
      const totalIssues = feedbackResults.reduce((sum, r) => sum + r.issues, 0);
      const totalRecommendations = feedbackResults.reduce((sum, r) => sum + r.recommendations, 0);

      console.log('📈 Aggregated Feedback:', {
        averageQuality: Math.round(avgQuality * 100) + '%',
        totalIssues,
        totalRecommendations,
        results: feedbackResults
      });

      // Improvement tracking assertions
      expect(avgQuality).toBeGreaterThan(0.6);
      expect(feedbackResults.every(r => r.qualityScore > 0)).toBe(true);

      console.log('✅ Feedback aggregation completed');
    }, 60000);
  });
});
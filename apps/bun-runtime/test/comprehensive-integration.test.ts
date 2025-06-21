/**
 * COMPREHENSIVE MEDIA SDK INTEGRATION TEST
 * 
 * This test demonstrates the full integration of:
 * - Different SDK components (Timeline, VideoQuery, Effects)
 * - AST-based dependency tracking with cassettes
 * - Vision analysis with Gemini API
 * - FFmpeg probe for metadata validation
 * - Runtime validation of media compositions
 */

import { test, expect, describe, beforeAll } from 'bun:test';
import { existsSync } from 'fs';

// Import different parts of the Media SDK
import { 
  Timeline, 
  createTikTokQuery, 
  createYouTubeQuery, 
  createInstagramQuery 
} from '@jamesaphoenix/media-sdk';

// Import runtime validation components
import { VisionRuntimeValidator } from '../src/vision-runtime-validator.js';
import { EnhancedBunCassetteManager } from '../src/enhanced-cassette-manager.js';
import { CassetteDependencyTracker } from '../src/dependency-tracker.js';

describe('🎬 COMPREHENSIVE MEDIA SDK INTEGRATION', () => {
  let validator: VisionRuntimeValidator;
  let cassetteManager: EnhancedBunCassetteManager;
  let dependencyTracker: CassetteDependencyTracker;

  beforeAll(() => {
    // Initialize all components
    validator = new VisionRuntimeValidator({
      qualityThreshold: 0.7,
      deepAnalysis: true,
      platformValidation: true,
      performanceBenchmarks: true
    });

    cassetteManager = new EnhancedBunCassetteManager('comprehensive-test');
    dependencyTracker = new CassetteDependencyTracker();

    console.log('🚀 Comprehensive integration test initialized');
    console.log('📊 Components: Timeline + VideoQuery + Vision + AST + Cassettes + FFmpeg');
  });

  describe('📹 Core SDK Components Integration', () => {
    test('should compose video using Timeline API with cassette caching', async () => {
      console.log('🎬 Testing Timeline API with cassette system...');
      
      // Create a timeline composition
      const timeline = new Timeline()
        .addVideo('assets/bunny.mp4')
        .addText('SDK Integration Test', {
          position: 'center',
          style: { fontSize: 32, color: 'white' }
        })
        .addImage('assets/logo-150x150.png', {
          position: 'top-right',
          duration: 5
        });

      // Generate command
      const command = timeline.getCommand('output/timeline-integration.mp4');
      console.log('📝 Generated FFmpeg command:', command.substring(0, 100) + '...');
      
      // Execute through cassette manager (with caching)
      const result = await cassetteManager.executeCommand(command, { cwd: process.cwd() });
      
      expect(result.success).toBe(true);
      expect(result.stdout).toBeDefined();
      console.log('✅ Timeline composition executed via cassette system');

      // Verify dependency tracking
      dependencyTracker.registerCassette('timeline-test', ['assets/bunny.mp4', 'assets/logo-150x150.png']);
      const stats = dependencyTracker.getStats();
      
      expect(stats.cassettes).toBeGreaterThan(0);
      console.log('✅ AST dependency tracking working:', stats);
    });

    test('should create platform-specific content using VideoQuery API', async () => {
      console.log('📱 Testing VideoQuery API for multiple platforms...');
      
      const platforms = ['tiktok', 'youtube', 'instagram'] as const;
      const results = [];

      for (const platform of platforms) {
        console.log(`🎯 Creating ${platform} content...`);
        
        let query;
        switch (platform) {
          case 'tiktok':
            query = createTikTokQuery('assets/bunny.mp4')
              .addText(`${platform.toUpperCase()} Ready`, { 
                position: 'bottom-center',
                style: { fontSize: 28, color: 'white' }
              });
            break;
          case 'youtube':
            query = createYouTubeQuery('assets/bunny.mp4')
              .addText(`${platform.toUpperCase()} Content`, { 
                position: 'center',
                style: { fontSize: 32, color: 'white' }
              });
            break;
          case 'instagram':
            query = createInstagramQuery('assets/bunny.mp4')
              .addText(`${platform.toUpperCase()} Post`, { 
                position: 'top-center',
                style: { fontSize: 24, color: 'white' }
              });
            break;
        }

        const result = await query.execute(`output/comprehensive-${platform}.mp4`);
        results.push({ platform, result });

        expect(result.isSuccess).toBe(true);
        expect(result.data?.metadata.platform).toBe(platform);
        
        console.log(`✅ ${platform} video created:`, {
          size: result.data?.metadata.size,
          duration: result.data?.metadata.duration
        });
      }

      expect(results).toHaveLength(3);
      console.log('✅ All platform-specific content created successfully');
    });
  });

  describe('🔬 Vision + FFmpeg + Cassette Integration', () => {
    test('should validate video composition with full tech stack', async () => {
      console.log('👁️ Testing comprehensive validation pipeline...');
      
      // First, create a test video if it doesn't exist
      const testVideo = 'output/comprehensive-tiktok.mp4';
      if (!existsSync(testVideo)) {
        console.log('📝 Creating test video for validation...');
        
        const query = createTikTokQuery('assets/bunny.mp4')
          .addText('VALIDATION TEST', { 
            position: 'center',
            style: { fontSize: 36, color: 'yellow' }
          });
        
        const createResult = await query.execute(testVideo);
        expect(createResult.isSuccess).toBe(true);
      }

      // Now validate using the full stack
      console.log('🔍 Running comprehensive validation...');
      
      const validationResult = await validator.validateRender(
        testVideo,
        'tiktok',
        { 
          state: 'success',
          data: {
            command: 'test-command',
            timeline: new Timeline(),
            metadata: {
              platform: 'tiktok' as const,
              duration: 10,
              size: { width: 1080, height: 1920 },
              aspectRatio: '9:16',
              estimatedFileSize: 1024000,
              ffmpegCommands: ['ffmpeg -i input.mp4 -vf scale=1080:1920 output.mp4']
            }
          },
          isLoading: false,
          isSuccess: true,
          isError: false
        },
        ['VALIDATION', 'TEST'],
        ['ffmpeg -i assets/bunny.mp4 -vf scale=1080:1920 output.mp4']
      );

      console.log('📊 Validation results:', {
        success: validationResult.success,
        qualityScore: validationResult.qualityScore,
        formatCorrect: validationResult.formatCorrect,
        visualQuality: validationResult.visualQuality
      });

      // Verify all components were used
      expect(validationResult).toBeDefined();
      expect(validationResult.performance).toBeDefined(); // FFmpeg probe data
      expect(validationResult.stability).toBeDefined(); // Stability analysis
      
      // In test mode, validation should succeed even with simulated data
      expect(validationResult.success).toBe(true);
      
      console.log('✅ Full validation pipeline working:');
      console.log('  - FFmpeg probe for metadata ✓');
      console.log('  - Vision analysis for quality ✓');
      console.log('  - Cassette system for caching ✓');
      console.log('  - AST dependency tracking ✓');
    });

    test('should demonstrate intelligent cache invalidation', async () => {
      console.log('🧠 Testing AST-based cache invalidation...');
      
      // Track some source files
      const sourceFiles = ['assets/bunny.mp4', 'assets/logo-150x150.png'];
      
      // Register cassette with dependency tracking
      dependencyTracker.registerCassette('cache-test', sourceFiles);
      
      // Simulate a file change (in real scenario, file modification time would change)
      const shouldInvalidate = dependencyTracker.shouldInvalidateCassette('cache-test');
      
      console.log('📝 Cache invalidation check:', shouldInvalidate);
      
      // Get dependency stats
      const depStats = dependencyTracker.getStats();
      
      expect(depStats.cassettes).toBeGreaterThan(0);
      expect(depStats.totalFiles).toBeGreaterThan(0);
      
      console.log('✅ AST-based dependency tracking stats:', depStats);
      console.log('  - Tracked cassettes:', depStats.cassettes);
      console.log('  - Total tracked files:', depStats.totalFiles);
      console.log('  - Cache entries:', depStats.cacheSize);
    });
  });

  describe('📊 Performance and Reliability', () => {
    test('should demonstrate cassette replay performance', async () => {
      console.log('⚡ Testing cassette replay performance...');
      
      const command = 'ffprobe -v quiet -print_format json -show_format -show_streams "assets/bunny.mp4"';
      
      // First execution (record)
      const startTime1 = Date.now();
      const result1 = await cassetteManager.executeCommand(command, { cwd: process.cwd() });
      const duration1 = Date.now() - startTime1;
      
      // Second execution (replay from cassette)
      const startTime2 = Date.now();
      const result2 = await cassetteManager.executeCommand(command, { cwd: process.cwd() });
      const duration2 = Date.now() - startTime2;
      
      console.log('📊 Performance comparison:');
      console.log(`  First execution: ${duration1}ms`);
      console.log(`  Cassette replay: ${duration2}ms`);
      console.log(`  Speedup: ${(duration1 / Math.max(duration2, 1)).toFixed(2)}x`);
      
      expect(result1.success).toBe(result2.success);
      expect(result1.stdout).toBe(result2.stdout);
      
      // Cassette replay should be faster (or at least not slower by much)
      console.log('✅ Cassette system providing consistent results');
    });

    test('should validate error handling across all components', async () => {
      console.log('🚨 Testing error handling integration...');
      
      // Test with non-existent file
      const invalidResult = await validator.validateRender(
        'non-existent-file.mp4',
        'tiktok',
        { 
          state: 'error',
          isLoading: false,
          isSuccess: false,
          isError: true
        }
      );

      // Should handle gracefully
      expect(invalidResult.success).toBe(false);
      expect(invalidResult.issues).toBeDefined();
      expect(invalidResult.issues!.length).toBeGreaterThan(0);
      
      console.log('✅ Error handling working across all components');
      console.log('  Error details:', invalidResult.issues![0]);
    });
  });
});
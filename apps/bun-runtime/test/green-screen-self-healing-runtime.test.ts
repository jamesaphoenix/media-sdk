/**
 * @fileoverview Self-Healing Green Screen Meme Runtime Tests
 * 
 * This test suite demonstrates the self-healing system with green screen
 * background replacement, including AST dependency tracking, cassettes,
 * vision analysis, and automatic error recovery.
 */

import { describe, test, expect, beforeAll, afterAll } from 'bun:test';
import { promises as fs } from 'fs';
import { join } from 'path';
import { execSync } from 'child_process';
import { Timeline } from '../../../packages/media-sdk/src/timeline/timeline';
import { EnhancedBunCassetteManager } from '../src/enhanced-cassette-manager';
import { CassetteDependencyTracker } from '../src/dependency-tracker';
import { VisionRuntimeValidator } from '../src/vision-runtime-validator';

const TEST_ASSETS_DIR = join(import.meta.dir, '..', 'assets');
const TEST_OUTPUT_DIR = join(import.meta.dir, '..', 'output', 'green-screen-self-healing');
const CASSETTES_DIR = join(import.meta.dir, '..', 'cassettes', 'green-screen');

describe('🎭 Self-Healing Green Screen Meme System', () => {
  let cassetteManager: EnhancedBunCassetteManager;
  let dependencyTracker: CassetteDependencyTracker;
  let visionValidator: VisionRuntimeValidator;

  beforeAll(async () => {
    // Initialize self-healing infrastructure
    await fs.mkdir(TEST_OUTPUT_DIR, { recursive: true });
    await fs.mkdir(CASSETTES_DIR, { recursive: true });

    cassetteManager = new EnhancedBunCassetteManager(CASSETTES_DIR);
    dependencyTracker = new CassetteDependencyTracker();
    visionValidator = new VisionRuntimeValidator();

    console.log('🔧 Self-healing system initialized');
    console.log('📁 Cassettes directory:', CASSETTES_DIR);
    console.log('📁 Output directory:', TEST_OUTPUT_DIR);

    // Create simple background images with corrected FFmpeg syntax
    const sampleImagesDir = join(TEST_ASSETS_DIR, 'sample-images');
    await fs.mkdir(sampleImagesDir, { recursive: true });
    
    // Create solid color backgrounds
    const backgrounds = [
      { name: 'explosion-bg.jpg', color: '#FF4500' },
      { name: 'office-bg.jpg', color: '#708090' },
      { name: 'blue-bg.jpg', color: '#003366' }
    ];

    for (const bg of backgrounds) {
      const bgPath = join(sampleImagesDir, bg.name);
      try {
        await fs.access(bgPath);
        console.log(`✅ Background exists: ${bg.name}`);
      } catch {
        console.log(`📸 Creating ${bg.name}...`);
        const createBgCommand = [
          'ffmpeg', '-y',
          '-f', 'lavfi',
          '-i', `color=${bg.color}:size=1920x1080:duration=0.1`,
          '-frames:v', '1',
          bgPath
        ].join(' ');
        execSync(createBgCommand, { timeout: 10000 });
        console.log(`✅ Created ${bg.name}`);
      }
    }
  });

  afterAll(async () => {
    // Report self-healing stats
    const stats = dependencyTracker.getStats();
    console.log('📊 Self-healing session stats:');
    console.log(`   Cassettes created: ${stats.cassettes}`);
    console.log(`   Dependencies tracked: ${stats.totalDependencies}`);
    console.log(`   Cache size: ${stats.cacheSize}`);
  });

  describe('🎬 Scenario 1: Green Screen + Image Background + Self-Healing', () => {
    test('should create reaction meme with vision validation and AST tracking', async () => {
      const cassetteId = 'reaction-meme-image-bg';
      
      // Register dependencies for AST tracking
      dependencyTracker.registerCassette(cassetteId, [
        '../../../packages/media-sdk/src/timeline/timeline.ts',
        '../../../packages/media-sdk/src/types/index.ts',
        join(TEST_ASSETS_DIR, 'green-screen-meme-1.mp4'),
        join(TEST_ASSETS_DIR, 'sample-images', 'explosion-bg.jpg')
      ]);

      const timeline = new Timeline()
        .addGreenScreenWithImageBackground(
          join(TEST_ASSETS_DIR, 'green-screen-meme-1.mp4'),
          join(TEST_ASSETS_DIR, 'sample-images', 'explosion-bg.jpg'),
          {
            chromaKey: '#00FF00',
            chromaSimilarity: 0.4,
            chromaBlend: 0.1,
            backgroundScale: 'fill'
          }
        )
        .addText('When you fix the bug on production', {
          position: 'top',
          style: {
            fontSize: 42,
            color: '#ffffff',
            strokeColor: '#000000',
            strokeWidth: 2
          }
        })
        .setAspectRatio('9:16')
        .setDuration(5);

      const outputPath = join(TEST_OUTPUT_DIR, 'reaction-meme-explosion.mp4');
      const command = timeline.getCommand(outputPath);

      console.log('🎬 Creating reaction meme with self-healing...');
      console.log('📋 Command preview:', command.substring(0, 100) + '...');

      // Execute with cassette management
      const result = await cassetteManager.executeCommand(command, cassetteId);
      
      expect(result.success).toBe(true);
      console.log('✅ Video rendered successfully');

      // Verify output exists
      const stats = await fs.stat(outputPath);
      expect(stats.size).toBeGreaterThan(10000);
      console.log(`📊 File size: ${(stats.size / 1024 / 1024).toFixed(2)}MB`);

      // Vision validation with self-healing
      const validation = await visionValidator.validateRender(
        outputPath,
        'tiktok',
        { command, timeline },
        ['When you fix the bug on production'],
        [command]
      );

      expect(validation.isValid).toBe(true);
      console.log(`🔍 Vision quality score: ${validation.qualityScore.toFixed(2)}`);
      
      if (validation.suggestions.length > 0) {
        console.log('💡 Self-healing suggestions:', validation.suggestions);
      }

      // Verify AST dependency tracking
      const shouldInvalidate = dependencyTracker.shouldInvalidateCassette(cassetteId);
      console.log(`🔄 Cache invalidation needed: ${shouldInvalidate}`);
    });

    test('should create weather reporter meme with professional quality', async () => {
      const cassetteId = 'weather-meme-professional';
      
      dependencyTracker.registerCassette(cassetteId, [
        '../../../packages/media-sdk/src/timeline/timeline.ts'
      ]);

      const timeline = new Timeline()
        .addGreenScreenMeme(
          join(TEST_ASSETS_DIR, 'green-screen-meme-2.mp4'),
          join(TEST_ASSETS_DIR, 'sample-images', 'office-bg.jpg'),
          'weather',
          {
            platform: 'youtube',
            professional: true
          }
        )
        .addText('Explaining why the servers crashed', {
          position: 'bottom',
          style: {
            fontSize: 32,
            color: '#ffffff',
            backgroundColor: 'rgba(0,0,0,0.8)',
            padding: 15
          }
        })
        .setAspectRatio('16:9')
        .setDuration(6);

      const outputPath = join(TEST_OUTPUT_DIR, 'weather-meme-professional.mp4');
      const command = timeline.getCommand(outputPath);

      console.log('🌤️ Creating professional weather meme...');
      
      const result = await cassetteManager.executeCommand(command, cassetteId);
      expect(result.success).toBe(true);

      const stats = await fs.stat(outputPath);
      expect(stats.size).toBeGreaterThan(20000);
      console.log(`📊 Professional meme created: ${(stats.size / 1024 / 1024).toFixed(2)}MB`);

      // Professional preset should use higher quality settings
      expect(command).toContain('similarity=0.3');
      expect(command).toContain('blend=0.05');
    });
  });

  describe('🎨 Scenario 2: Green Screen + Solid Color Background + Self-Healing', () => {
    test('should create comedy meme with solid color background and optimization', async () => {
      const cassetteId = 'comedy-meme-solid-bg';
      
      dependencyTracker.registerCassette(cassetteId, [
        '../../../packages/media-sdk/src/timeline/timeline.ts',
        '../../../packages/media-sdk/src/types/index.ts'
      ]);

      const timeline = new Timeline()
        .addGreenScreenWithImageBackground(
          join(TEST_ASSETS_DIR, 'green-screen-meme-3.mp4'),
          join(TEST_ASSETS_DIR, 'sample-images', 'blue-bg.jpg'),
          {
            chromaKey: '#00FF00',
            chromaSimilarity: 0.5,
            chromaBlend: 0.2,
            backgroundScale: 'stretch'
          }
        )
        .addText('ERROR 404: MOTIVATION NOT FOUND', {
          position: 'center',
          style: {
            fontSize: 48,
            color: '#ffff00',
            strokeColor: '#000000',
            strokeWidth: 3,
            fontWeight: 'bold'
          }
        })
        .setAspectRatio('1:1')
        .setDuration(4);

      const outputPath = join(TEST_OUTPUT_DIR, 'comedy-meme-blue-bg.mp4');
      const command = timeline.getCommand(outputPath);

      console.log('😂 Creating comedy meme with blue background...');
      
      const result = await cassetteManager.executeCommand(command, cassetteId);
      expect(result.success).toBe(true);

      const stats = await fs.stat(outputPath);
      expect(stats.size).toBeGreaterThan(15000);
      console.log(`📊 Comedy meme created: ${(stats.size / 1024 / 1024).toFixed(2)}MB`);

      // Vision validation for comedy content
      const validation = await visionValidator.validateRender(
        outputPath,
        'instagram',
        { command, timeline },
        ['ERROR 404', 'MOTIVATION'],
        [command]
      );

      console.log(`🔍 Comedy quality score: ${validation.qualityScore.toFixed(2)}`);
      expect(validation.qualityScore).toBeGreaterThan(0.6);
    });

    test('should create viral TikTok meme with self-optimization', async () => {
      const cassetteId = 'viral-tiktok-meme';
      
      const timeline = new Timeline()
        .addGreenScreenMeme(
          join(TEST_ASSETS_DIR, 'green-screen-meme-4.mp4'),
          join(TEST_ASSETS_DIR, 'sample-images', 'explosion-bg.jpg'),
          'comedy',
          {
            platform: 'tiktok',
            intensity: 'high'
          }
        )
        .addText('POV: You deployed on Friday', {
          position: 'top',
          style: {
            fontSize: 44,
            color: '#ffffff',
            strokeColor: '#000000',
            strokeWidth: 3
          }
        })
        .addText('🔥 RIP WEEKEND 🔥', {
          position: 'bottom',
          style: {
            fontSize: 36,
            color: '#ff0000',
            strokeColor: '#ffffff',
            strokeWidth: 2
          }
        })
        .setAspectRatio('9:16')
        .setDuration(6);

      const outputPath = join(TEST_OUTPUT_DIR, 'viral-tiktok-friday-deploy.mp4');
      const command = timeline.getCommand(outputPath);

      console.log('🔥 Creating viral TikTok meme...');
      
      const result = await cassetteManager.executeCommand(command, cassetteId);
      expect(result.success).toBe(true);

      const stats = await fs.stat(outputPath);
      expect(stats.size).toBeGreaterThan(20000);
      console.log(`📊 Viral TikTok meme: ${(stats.size / 1024 / 1024).toFixed(2)}MB`);

      // High intensity settings
      expect(command).toContain('similarity=0.5');
      expect(command).toContain('POV');
      expect(command).toContain('RIP WEEKEND');
    });
  });

  describe('🎥 Scenario 3: Green Screen + Video Background + Advanced Self-Healing', () => {
    test('should create gaming meme with nature video background', async () => {
      const cassetteId = 'gaming-meme-nature-bg';
      
      dependencyTracker.registerCassette(cassetteId, [
        '../../../packages/media-sdk/src/timeline/timeline.ts',
        join(TEST_ASSETS_DIR, 'green-screen-meme-5.mp4'),
        join(TEST_ASSETS_DIR, 'nature.mp4')
      ]);

      const timeline = new Timeline()
        .addGreenScreenWithVideoBackground(
          join(TEST_ASSETS_DIR, 'green-screen-meme-5.mp4'),
          join(TEST_ASSETS_DIR, 'nature.mp4'),
          {
            chromaKey: '#00FF00',
            chromaSimilarity: 0.45,
            chromaBlend: 0.15,
            backgroundScale: 'crop',
            audioMix: 'greenscreen',
            backgroundLoop: true
          }
        )
        .addText('When the code works on first try', {
          position: 'top',
          style: {
            fontSize: 40,
            color: '#00ff00',
            strokeColor: '#000000',
            strokeWidth: 2
          }
        })
        .setAspectRatio('16:9')
        .setDuration(8);

      const outputPath = join(TEST_OUTPUT_DIR, 'gaming-meme-nature.mp4');
      const command = timeline.getCommand(outputPath);

      console.log('🌿 Creating gaming meme with nature background...');
      
      const result = await cassetteManager.executeCommand(command, cassetteId);
      expect(result.success).toBe(true);

      const stats = await fs.stat(outputPath);
      expect(stats.size).toBeGreaterThan(50000);
      console.log(`📊 Gaming meme with video bg: ${(stats.size / 1024 / 1024).toFixed(2)}MB`);

      // Should include video background looping
      expect(command).toContain('nature.mp4');
      expect(command).toContain('loop=loop=-1:size=32767');

      // Advanced vision validation
      const validation = await visionValidator.validateRender(
        outputPath,
        'youtube',
        { command, timeline },
        ['When the code works on first try'],
        [command]
      );

      console.log(`🔍 Gaming meme quality: ${validation.qualityScore.toFixed(2)}`);
      expect(validation.qualityScore).toBeGreaterThan(0.7);
    });

    test('should create educational content with earth background', async () => {
      const cassetteId = 'educational-earth-bg';
      
      const timeline = new Timeline()
        .addGreenScreenMeme(
          join(TEST_ASSETS_DIR, 'green-screen-meme-6.mp4'),
          join(TEST_ASSETS_DIR, 'earth.mp4'),
          'educational',
          {
            platform: 'youtube',
            professional: true
          }
        )
        .addText('Understanding Microservices Architecture', {
          position: 'bottom',
          style: {
            fontSize: 28,
            color: '#ffffff',
            backgroundColor: 'rgba(0,0,0,0.9)',
            padding: 20
          }
        })
        .setAspectRatio('16:9')
        .setDuration(10);

      const outputPath = join(TEST_OUTPUT_DIR, 'educational-microservices.mp4');
      const command = timeline.getCommand(outputPath);

      console.log('📚 Creating educational content with Earth background...');
      
      const result = await cassetteManager.executeCommand(command, cassetteId);
      expect(result.success).toBe(true);

      const stats = await fs.stat(outputPath);
      expect(stats.size).toBeGreaterThan(60000);
      console.log(`📊 Educational content: ${(stats.size / 1024 / 1024).toFixed(2)}MB`);

      // Educational preset settings
      expect(command).toContain('similarity=0.35');
      expect(command).toContain('blend=0.08');
      expect(command).toContain('Microservices');
    });
  });

  describe('🔧 Self-Healing System Integration Tests', () => {
    test('should demonstrate AST dependency tracking and cache management', async () => {
      const cassetteId = 'self-healing-demo';
      
      // Register multiple dependencies
      dependencyTracker.registerCassette(cassetteId, [
        '../../../packages/media-sdk/src/timeline/timeline.ts',
        '../../../packages/media-sdk/src/types/index.ts',
        '../../../packages/media-sdk/src/codecs/codec-manager.ts'
      ]);

      // Check initial invalidation state
      const initialInvalidation = dependencyTracker.shouldInvalidateCassette(cassetteId);
      console.log(`🔄 Initial cache invalidation needed: ${initialInvalidation}`);

      const timeline = new Timeline()
        .addGreenScreenMeme(
          join(TEST_ASSETS_DIR, 'green-screen-meme-7.mp4'),
          join(TEST_ASSETS_DIR, 'sample-images', 'office-bg.jpg'),
          'reaction'
        )
        .addText('Self-Healing System Demo', {
          position: 'center',
          style: {
            fontSize: 36,
            color: '#00ffff',
            strokeColor: '#000000',
            strokeWidth: 2
          }
        })
        .setAspectRatio('9:16')
        .setDuration(5);

      const outputPath = join(TEST_OUTPUT_DIR, 'self-healing-demo.mp4');
      const command = timeline.getCommand(outputPath);

      console.log('🔧 Running self-healing demo...');
      
      const result = await cassetteManager.executeCommand(command, cassetteId);
      expect(result.success).toBe(true);

      // Verify cassette was created
      const cassetteExists = await cassetteManager.cassetteExists(cassetteId);
      expect(cassetteExists).toBe(true);
      console.log('✅ Cassette created and cached');

      // Get final stats
      const finalStats = dependencyTracker.getStats();
      console.log('📊 Final dependency tracking stats:', finalStats);
      
      expect(finalStats.cassettes).toBeGreaterThan(0);
      expect(finalStats.totalDependencies).toBeGreaterThan(0);
    });

    test('should demonstrate vision-based quality optimization', async () => {
      const cassetteId = 'quality-optimization-demo';
      
      const timeline = new Timeline()
        .addGreenScreenWithImageBackground(
          join(TEST_ASSETS_DIR, 'green-screen-meme-1.mp4'),
          join(TEST_ASSETS_DIR, 'sample-images', 'explosion-bg.jpg'),
          {
            chromaKey: '#00FF00',
            chromaSimilarity: 0.3, // High quality settings
            chromaBlend: 0.05,
            backgroundScale: 'fit'
          }
        )
        .addText('High Quality Render Test', {
          position: 'center',
          style: {
            fontSize: 48,
            color: '#ffffff',
            strokeColor: '#000000',
            strokeWidth: 3
          }
        })
        .setVideoCodec('libx264', {
          preset: 'slow',
          crf: 18 // High quality
        })
        .setAspectRatio('16:9')
        .setDuration(6);

      const outputPath = join(TEST_OUTPUT_DIR, 'quality-optimization-demo.mp4');
      const command = timeline.getCommand(outputPath);

      console.log('🔍 Creating high-quality render for vision analysis...');
      
      const result = await cassetteManager.executeCommand(command, cassetteId);
      expect(result.success).toBe(true);

      // Comprehensive vision validation
      const validation = await visionValidator.validateRender(
        outputPath,
        'youtube',
        { command, timeline },
        ['High Quality Render Test'],
        [command]
      );

      console.log('🔍 Vision Analysis Results:');
      console.log(`   Quality Score: ${validation.qualityScore.toFixed(3)}`);
      console.log(`   Is Valid: ${validation.isValid}`);
      console.log(`   Platform Compliance: ${JSON.stringify(validation.platformCompliance)}`);
      
      if (validation.suggestions.length > 0) {
        console.log('💡 Optimization Suggestions:');
        validation.suggestions.forEach((suggestion, i) => {
          console.log(`   ${i + 1}. ${suggestion}`);
        });
      }

      expect(validation.qualityScore).toBeGreaterThan(0.8);
      expect(validation.isValid).toBe(true);
    });

    test('should demonstrate performance optimization with cassette caching', async () => {
      const cassetteId = 'performance-test';
      
      const timeline = new Timeline()
        .addGreenScreenMeme(
          join(TEST_ASSETS_DIR, 'green-screen-meme-2.mp4'),
          join(TEST_ASSETS_DIR, 'sample-images', 'blue-bg.jpg'),
          'comedy'
        )
        .addText('Performance Test', {
          position: 'top',
          style: { fontSize: 32, color: '#ffffff' }
        })
        .setDuration(3);

      const outputPath = join(TEST_OUTPUT_DIR, 'performance-test.mp4');
      const command = timeline.getCommand(outputPath);

      // First execution (no cache)
      console.log('⏱️ First execution (no cache)...');
      const startTime1 = Date.now();
      const result1 = await cassetteManager.executeCommand(command, cassetteId);
      const duration1 = Date.now() - startTime1;
      
      expect(result1.success).toBe(true);
      console.log(`   Duration: ${duration1}ms`);

      // Second execution (with cache)
      console.log('⏱️ Second execution (with cache)...');
      const startTime2 = Date.now();
      const result2 = await cassetteManager.executeCommand(command, cassetteId);
      const duration2 = Date.now() - startTime2;
      
      expect(result2.success).toBe(true);
      console.log(`   Duration: ${duration2}ms`);
      
      // Cache should improve performance
      const speedup = duration1 / duration2;
      console.log(`🚀 Performance improvement: ${speedup.toFixed(2)}x faster`);
      
      expect(duration2).toBeLessThan(duration1);
    });
  });
});
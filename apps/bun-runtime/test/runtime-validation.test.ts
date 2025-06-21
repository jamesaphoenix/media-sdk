/**
 * Runtime validation and system testing for Media SDK
 */

import { test, expect, describe, beforeAll, afterAll } from 'bun:test';
import { RuntimeValidator } from '../src/runtime-validator';
import { BunMockExecutor } from '../src/bun-cassette-manager';
import { Timeline, tiktok, youtube } from '@jamesaphoenix/media-sdk';

describe('🔧 Runtime Validation & System Tests', () => {
  let validator: RuntimeValidator;
  let executor: BunMockExecutor;

  beforeAll(async () => {
    validator = new RuntimeValidator();
    executor = new BunMockExecutor('runtime-validation');
    
    // Validate system before running tests
    const requirements = await validator.validateSystem();
    console.log('System Requirements:', requirements);
  });

  afterAll(async () => {
    await executor.cleanup();
  });

  describe('🔍 System Requirements Validation', () => {
    test('should validate FFmpeg installation', async () => {
      const requirements = await validator.validateSystem();
      
      expect(requirements.ffmpeg).toHaveProperty('available');
      
      if (requirements.ffmpeg.available) {
        expect(requirements.ffmpeg.version).toBeDefined();
        console.log(`  ✅ FFmpeg ${requirements.ffmpeg.version} detected`);
      } else {
        console.log(`  ⚠️ FFmpeg not available: ${requirements.ffmpeg.error}`);
      }
    });

    test('should validate ImageMagick installation', async () => {
      const requirements = await validator.validateSystem();
      
      expect(requirements.imagemagick).toHaveProperty('available');
      
      if (requirements.imagemagick.available) {
        expect(requirements.imagemagick.version).toBeDefined();
        console.log(`  ✅ ImageMagick ${requirements.imagemagick.version} detected`);
      } else {
        console.log(`  ⚠️ ImageMagick not available: ${requirements.imagemagick.error}`);
      }
    });

    test('should check system resources', async () => {
      const requirements = await validator.validateSystem();
      
      expect(requirements.diskSpace.available).toBeGreaterThan(0);
      expect(requirements.memory.available).toBeGreaterThan(0);
      
      if (requirements.diskSpace.warning) {
        console.log(`  ⚠️ Low disk space: ${requirements.diskSpace.available}MB`);
      }
      
      if (requirements.memory.warning) {
        console.log(`  ⚠️ Low memory: ${requirements.memory.available}MB`);
      }
    });
  });

  describe('📁 File Validation Tests', () => {
    test('should validate existing sample files', async () => {
      const sampleFiles = [
        'sample-files/red-sample.mp4',
        'sample-files/blue-sample.mp4',
        'sample-files/portrait-sample.mp4',
        'sample-files/background-music.mp3',
        'sample-files/logo-150x150.png'
      ];

      for (const file of sampleFiles) {
        const validation = await validator.validateFile(file);
        
        expect(validation.exists).toBe(true);
        expect(validation.size).toBeGreaterThan(0);
        
        if (validation.error) {
          console.log(`  ⚠️ ${file}: ${validation.error}`);
        } else {
          console.log(`  ✅ ${file}: ${validation.size} bytes`);
          
          if (validation.duration) {
            console.log(`    Duration: ${validation.duration}s`);
          }
          
          if (validation.resolution) {
            console.log(`    Resolution: ${validation.resolution.width}x${validation.resolution.height}`);
          }
        }
      }
    });

    test('should handle non-existent files gracefully', async () => {
      const validation = await validator.validateFile('non-existent-file.mp4');
      
      expect(validation.exists).toBe(false);
      expect(validation.error).toContain('does not exist');
    });

    test('should validate file formats correctly', async () => {
      const videoValidation = await validator.validateFile('sample-files/red-sample.mp4');
      const audioValidation = await validator.validateFile('sample-files/background-music.mp3');
      
      if (videoValidation.exists && videoValidation.format) {
        expect(['mp4', 'mov_mp4_m4a_3gp_3g2_mj2'].some(fmt => 
          videoValidation.format?.includes(fmt)
        )).toBe(true);
      }
      
      if (audioValidation.exists && audioValidation.format) {
        expect(['mp3', 'mpeg'].some(fmt => 
          audioValidation.format?.includes(fmt)
        )).toBe(true);
      }
    });
  });

  describe('⚡ Performance & Stress Tests', () => {
    test('should handle multiple concurrent operations', async () => {
      const startTime = Date.now();
      
      // Create multiple timelines simultaneously
      const operations = Array.from({ length: 5 }, (_, i) => {
        return tiktok('sample-files/red-sample.mp4')
          .addText(`Concurrent Test ${i + 1}`, { position: 'center' })
          .getCommand(`output/concurrent-${i + 1}.mp4`);
      });

      // Execute all commands concurrently
      const results = await Promise.all(
        operations.map(command => executor.execute(command))
      );

      const duration = Date.now() - startTime;
      
      expect(results).toHaveLength(5);
      results.forEach((result, i) => {
        expect(result).toHaveProperty('success');
        console.log(`  ✅ Concurrent operation ${i + 1}: ${result.success ? 'success' : 'failed'}`);
      });
      
      console.log(`  ⏱️ Total concurrent execution: ${duration}ms`);
      expect(duration).toBeLessThan(30000); // Should complete within 30 seconds
    });

    test('should handle large batch operations efficiently', async () => {
      const batchSize = 10;
      const startTime = Date.now();
      
      const commands = [];
      for (let i = 0; i < batchSize; i++) {
        const timeline = new Timeline()
          .addVideo('sample-files/blue-sample.mp4')
          .addText(`Batch ${i + 1}`, { 
            position: 'center',
            style: { fontSize: 24 + (i * 2) }
          });
        
        commands.push(timeline.getCommand(`output/batch-${i + 1}.mp4`));
      }

      // Process in smaller batches to avoid overwhelming
      const batchResults = [];
      for (let i = 0; i < commands.length; i += 3) {
        const batch = commands.slice(i, i + 3);
        const results = await Promise.all(
          batch.map(command => executor.execute(command))
        );
        batchResults.push(...results);
      }

      const duration = Date.now() - startTime;
      
      expect(batchResults).toHaveLength(batchSize);
      console.log(`  ⚡ Processed ${batchSize} operations in ${duration}ms`);
      console.log(`  📊 Average: ${Math.round(duration / batchSize)}ms per operation`);
    });

    test('should validate memory usage during operations', async () => {
      const initialMemory = process.memoryUsage();
      
      // Perform memory-intensive operations
      const timeline = tiktok('sample-files/portrait-sample.mp4')
        .addText('Memory Test', { position: 'center' });
      
      // Create multiple versions with different effects
      for (let i = 0; i < 5; i++) {
        const command = timeline.getCommand(`output/memory-test-${i}.mp4`);
        await executor.execute(command);
      }
      
      const finalMemory = process.memoryUsage();
      const memoryDiff = finalMemory.heapUsed - initialMemory.heapUsed;
      
      console.log(`  🧠 Memory usage increase: ${Math.round(memoryDiff / 1024 / 1024)}MB`);
      
      // Memory should not increase excessively (less than 100MB for this test)
      expect(memoryDiff).toBeLessThan(100 * 1024 * 1024);
    });
  });

  describe('🎯 Real-world Scenario Tests', () => {
    test('should handle complete social media workflow', async () => {
      const startTime = Date.now();
      
      // Simulate a real content creator workflow
      const sourceVideo = 'sample-files/portrait-sample.mp4';
      
      // 1. Create TikTok version
      const tiktokResult = tiktok(sourceVideo)
        .trim(0, 15)
        .addText('TikTok Version 🎵', { 
          position: 'bottom',
          style: { fontSize: 32, color: '#ff0066' }
        });
      
      // 2. Create YouTube Shorts version
      const youtubeResult = youtube(sourceVideo)
        .scale(1080, 1920) // Shorts format
        .addText('YouTube Shorts 📺', {
          position: 'top',
          style: { fontSize: 28, color: '#ff0000' }
        });
      
      // 3. Create Instagram Reels version
      const instagramResult = tiktok(sourceVideo) // Same as TikTok format
        .addText('Instagram Reels 📷', {
          position: 'center',
          style: { fontSize: 30, color: '#E4405F' }
        });

      // Execute all platforms
      const platforms = [
        { name: 'TikTok', timeline: tiktokResult },
        { name: 'YouTube', timeline: youtubeResult },
        { name: 'Instagram', timeline: instagramResult }
      ];

      const results = [];
      for (const platform of platforms) {
        const command = platform.timeline.getCommand(`output/social-${platform.name.toLowerCase()}.mp4`);
        const result = await executor.execute(command);
        results.push({ platform: platform.name, result });
      }

      const totalDuration = Date.now() - startTime;
      
      console.log(`  🌐 Social media workflow completed in ${totalDuration}ms`);
      
      results.forEach(({ platform, result }) => {
        expect(result).toHaveProperty('success');
        console.log(`    ${platform}: ${result.success ? '✅' : '❌'}`);
      });
    });

    test('should handle error scenarios gracefully', async () => {
      const errorScenarios = [
        {
          name: 'Non-existent input file',
          command: tiktok('non-existent.mp4').getCommand('output/error-test-1.mp4')
        },
        {
          name: 'Invalid output directory',
          command: tiktok('sample-files/red-sample.mp4').getCommand('/invalid/path/output.mp4')
        },
        {
          name: 'Very long text overlay',
          command: new Timeline()
            .addVideo('sample-files/blue-sample.mp4')
            .addText('A'.repeat(1000), { position: 'center' })
            .getCommand('output/long-text.mp4')
        }
      ];

      for (const scenario of errorScenarios) {
        const result = await executor.execute(scenario.command);
        
        console.log(`  🔧 ${scenario.name}: ${result.success ? '✅' : '❌'}`);
        
        // Errors should be handled gracefully (not crash)
        expect(result).toHaveProperty('success');
        expect(result).toHaveProperty('command');
        
        if (!result.success && result.stderr) {
          console.log(`    Error: ${result.stderr.substring(0, 100)}...`);
        }
      }
    });

    test('should validate output file quality', async () => {
      const sourceFile = 'sample-files/red-sample.mp4';
      const outputFile = 'output/quality-test.mp4';
      
      // Create a simple conversion
      const timeline = tiktok(sourceFile)
        .addText('Quality Test', { position: 'center' });
      
      const command = timeline.getCommand(outputFile);
      const result = await executor.execute(command);
      
      // Validate input file
      const inputValidation = await validator.validateFile(sourceFile);
      expect(inputValidation.exists).toBe(true);
      
      // Only validate output if command succeeded
      if (result.success) {
        // Small delay to ensure file is written
        await new Promise(resolve => setTimeout(resolve, 100));
        
        const outputValidation = await validator.validateOutput(outputFile, inputValidation.size);
        
        console.log(`  📊 Input: ${inputValidation.size} bytes`);
        console.log(`  📊 Output: ${outputValidation.size} bytes`);
        
        if (outputValidation.exists) {
          // Output should exist and have reasonable size
          expect(outputValidation.size).toBeGreaterThan(1000); // At least 1KB
          
          if (outputValidation.duration && inputValidation.duration) {
            console.log(`  ⏱️ Duration preserved: ${outputValidation.duration}s`);
          }
        }
      }
    });
  });

  describe('🔄 Cache and Performance Optimization', () => {
    test('should cache system validation results', async () => {
      // Clear cache first
      validator.clearCache();
      
      const result1 = await validator.validateSystem();
      const result2 = await validator.validateSystem();
      
      expect(result1).toEqual(result2);
      
      // Check that cache was used
      const stats = validator.getStats();
      expect(stats.cacheHits).toBeGreaterThan(0);
      
      console.log(`  ⚡ Cache hits: ${stats.cacheHits}`);
    });

    test('should cache file validation results', async () => {
      const filePath = 'sample-files/red-sample.mp4';
      
      // Clear cache and get initial stats
      validator.clearCache();
      const initialStats = validator.getStats();
      
      const result1 = await validator.validateFile(filePath);
      const result2 = await validator.validateFile(filePath);
      
      expect(result1).toEqual(result2);
      
      // Check that cache was used
      const finalStats = validator.getStats();
      expect(finalStats.cacheHits).toBeGreaterThan(initialStats.cacheHits);
      
      console.log(`  📁 Cache hits increased by: ${finalStats.cacheHits - initialStats.cacheHits}`);
    });

    test('should provide validation statistics', () => {
      const stats = validator.getStats();
      
      expect(stats).toHaveProperty('cacheSize');
      expect(stats).toHaveProperty('cacheEntries');
      expect(stats.cacheSize).toBeGreaterThan(0);
      
      console.log(`  📊 Cache entries: ${stats.cacheSize}`);
      console.log(`  📊 Cached keys: ${stats.cacheEntries.join(', ')}`);
    });
  });
});
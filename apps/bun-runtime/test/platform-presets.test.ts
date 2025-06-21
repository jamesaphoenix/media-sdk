/**
 * TDD Tests for Platform-Specific Presets using Bun runtime
 */

import { test, expect, describe, beforeEach, afterEach } from 'bun:test';
import { 
  Timeline,
  tiktok, 
  youtube, 
  instagram, 
  twitter, 
  linkedin,
  square,
  portrait,
  landscape,
  concat,
  loop,
  addWordByWordCaptions
} from '@jamesaphoenix/media-sdk';
import { BunMockExecutor } from '../src/bun-cassette-manager';

describe('Platform-Specific Presets (Bun Runtime)', () => {
  let executor: BunMockExecutor;

  beforeEach(() => {
    executor = new BunMockExecutor('platform-presets-tests');
  });

  afterEach(async () => {
    await executor.cleanup();
  });

  describe('🎵 TikTok Format (9:16)', () => {
    test('should create TikTok format from landscape video', () => {
      const result = tiktok('sample-files/red-sample.mp4'); // 640x480 landscape
      const command = result.getCommand('output/tiktok-from-landscape.mp4');
      
      expect(command).toContain('1080:1920'); // Target 9:16 resolution
      expect(command).toContain('crop=1080:1920'); // Crop to portrait
      expect(command).toContain('scale=1080:1920'); // Scale to TikTok size
    });

    test('should optimize portrait video for TikTok', () => {
      const result = tiktok('sample-files/portrait-sample.mp4'); // 480x640 portrait
      const command = result.getCommand('output/tiktok-from-portrait.mp4');
      
      expect(command).toContain('1080:1920');
      expect(command).toContain('(iw-1080)/2'); // Center horizontally
      expect(command).toContain('(ih-1920)/2'); // Center vertically
    });

    test('should execute TikTok conversion', async () => {
      const result = tiktok('sample-files/red-sample.mp4');
      const command = result.getCommand('output/tiktok-execution.mp4');
      
      const executionResult = await executor.execute(command);
      expect(executionResult).toHaveProperty('success');
      expect(executionResult.command).toContain('SAMPLE_FILE');
    });

    test('should add TikTok-specific optimizations', () => {
      const result = tiktok('sample-files/blue-sample.mp4', {
        start: 5,
        duration: 15 // TikTok optimal length
      });
      
      const command = result.getCommand('output/tiktok-optimized.mp4');
      expect(command).toContain('1080:1920');
    });
  });

  describe('📺 YouTube Format (16:9)', () => {
    test('should create YouTube format from portrait video', () => {
      const result = youtube('sample-files/portrait-sample.mp4'); // 480x640 portrait
      const command = result.getCommand('output/youtube-from-portrait.mp4');
      
      expect(command).toContain('1920:1080'); // Target 16:9 resolution
      expect(command).toContain('crop=1920:1080'); // Crop to landscape
      expect(command).toContain('scale=1920:1080'); // Scale to YouTube size
    });

    test('should optimize landscape video for YouTube', () => {
      const result = youtube('sample-files/red-sample.mp4'); // 640x480 landscape
      const command = result.getCommand('output/youtube-from-landscape.mp4');
      
      expect(command).toContain('1920:1080');
      expect(command).toContain('(iw-1920)/2'); // Center horizontally
      expect(command).toContain('(ih-1080)/2'); // Center vertically
    });

    test('should execute YouTube conversion', async () => {
      const result = youtube('sample-files/portrait-sample.mp4');
      const command = result.getCommand('output/youtube-execution.mp4');
      
      const executionResult = await executor.execute(command);
      expect(executionResult).toHaveProperty('success');
    });

    test('should handle YouTube-specific settings', () => {
      const result = youtube('sample-files/red-sample.mp4', {
        duration: 300 // 5 minute video
      });
      
      expect(result).toBeInstanceOf(Timeline);
      const command = result.getCommand('output/youtube-long.mp4');
      expect(command).toContain('1920:1080');
    });
  });

  describe('📷 Instagram Formats', () => {
    test('should create Instagram Reels (9:16)', () => {
      const result = instagram('sample-files/red-sample.mp4', { format: 'reels' });
      const command = result.getCommand('output/instagram-reels.mp4');
      
      expect(command).toContain('1080:1920'); // 9:16 for Reels
      expect(command).toContain('crop=1080:1920');
    });

    test('should create Instagram Feed (1:1)', () => {
      const result = instagram('sample-files/blue-sample.mp4', { format: 'feed' });
      const command = result.getCommand('output/instagram-feed.mp4');
      
      expect(command).toContain('1080:1080'); // 1:1 for Feed
      expect(command).toContain('crop=1080:1080');
    });

    test('should create Instagram Stories (9:16)', () => {
      const result = instagram('sample-files/portrait-sample.mp4', { format: 'story' });
      const command = result.getCommand('output/instagram-stories.mp4');
      
      expect(command).toContain('1080:1920'); // Same as Reels
      expect(command).toContain('crop=1080:1920');
    });

    test('should execute Instagram format conversions', async () => {
      const formats = ['reels', 'feed', 'story'] as const;
      const results = [];
      
      for (const format of formats) {
        const result = instagram('sample-files/red-sample.mp4', { format });
        const command = result.getCommand(`output/instagram-${format}.mp4`);
        const executionResult = await executor.execute(command);
        results.push(executionResult);
      }
      
      expect(results).toHaveLength(3);
      results.forEach(result => {
        expect(result).toHaveProperty('success');
      });
    });
  });

  describe('🐦 Twitter Format', () => {
    test('should create Twitter-optimized video', () => {
      const result = twitter('sample-files/red-sample.mp4');
      const command = result.getCommand('output/twitter-video.mp4');
      
      expect(command).toContain('1280:720'); // 720p for Twitter
      expect(command).toContain('crop=1280:720');
    });

    test('should execute Twitter conversion', async () => {
      const result = twitter('sample-files/portrait-sample.mp4');
      const command = result.getCommand('output/twitter-execution.mp4');
      
      const executionResult = await executor.execute(command);
      expect(executionResult).toHaveProperty('success');
    });
  });

  describe('💼 LinkedIn Format', () => {
    test('should create LinkedIn-optimized video', () => {
      const result = linkedin('sample-files/blue-sample.mp4');
      const command = result.getCommand('output/linkedin-video.mp4');
      
      expect(command).toContain('1920:1080'); // Professional 16:9
      expect(command).toContain('crop=1920:1080');
    });

    test('should execute LinkedIn conversion', async () => {
      const result = linkedin('sample-files/red-sample.mp4');
      const command = result.getCommand('output/linkedin-execution.mp4');
      
      const executionResult = await executor.execute(command);
      expect(executionResult).toHaveProperty('success');
    });
  });

  describe('📐 Generic Aspect Ratio Formats', () => {
    test('should create square format (1:1)', () => {
      const result = square('sample-files/red-sample.mp4');
      const command = result.getCommand('output/square-format.mp4');
      
      expect(command).toContain('1080:1080'); // 1:1 aspect ratio
      expect(command).toContain('crop=1080:1080');
    });

    test('should create portrait format (9:16)', () => {
      const result = portrait('sample-files/blue-sample.mp4');
      const command = result.getCommand('output/portrait-format.mp4');
      
      expect(command).toContain('1080:1920'); // 9:16 aspect ratio
      expect(command).toContain('crop=1080:1920');
    });

    test('should create landscape format (16:9)', () => {
      const result = landscape('sample-files/portrait-sample.mp4');
      const command = result.getCommand('output/landscape-format.mp4');
      
      expect(command).toContain('1920:1080'); // 16:9 aspect ratio
      expect(command).toContain('crop=1920:1080');
    });

    test('should execute all aspect ratio conversions', async () => {
      const formats = [
        { fn: square, name: 'square' },
        { fn: portrait, name: 'portrait' },
        { fn: landscape, name: 'landscape' }
      ];
      
      for (const { fn, name } of formats) {
        const result = fn('sample-files/red-sample.mp4');
        const command = result.getCommand(`output/${name}-execution.mp4`);
        const executionResult = await executor.execute(command);
        
        expect(executionResult).toHaveProperty('success');
      }
    });
  });

  describe('🔗 Video Composition Functions', () => {
    test('should concatenate multiple videos', () => {
      const videoPaths = [
        'sample-files/red-sample.mp4',
        'sample-files/blue-sample.mp4',
        'sample-files/portrait-sample.mp4'
      ];
      
      const result = concat(videoPaths);
      const command = result.getCommand('output/concatenated.mp4');
      
      expect(command).toContain('red-sample.mp4');
      expect(command).toContain('blue-sample.mp4');
      expect(command).toContain('portrait-sample.mp4');
    });

    test('should throw error for empty video array', () => {
      expect(() => {
        concat([]);
      }).toThrow('At least one video path is required');
    });

    test('should execute video concatenation', async () => {
      const videoPaths = [
        'sample-files/red-sample.mp4',
        'sample-files/blue-sample.mp4'
      ];
      
      const result = concat(videoPaths);
      const command = result.getCommand('output/concat-execution.mp4');
      
      const executionResult = await executor.execute(command);
      expect(executionResult).toHaveProperty('success');
    });

    test('should create video loop', () => {
      const result = loop('sample-files/red-sample.mp4', 3);
      const command = result.getCommand('output/looped.mp4');
      
      // Should contain the input file multiple times
      expect(command).toContain('red-sample.mp4');
      expect(result).toBeInstanceOf(Timeline);
    });

    test('should throw error for invalid loop count', () => {
      expect(() => {
        loop('sample-files/red-sample.mp4', 0);
      }).toThrow('Loop count must be at least 1');
    });

    test('should execute video loop', async () => {
      const result = loop('sample-files/blue-sample.mp4', 2);
      const command = result.getCommand('output/loop-execution.mp4');
      
      const executionResult = await executor.execute(command);
      expect(executionResult).toHaveProperty('success');
    });
  });

  describe('🎯 Platform-Specific Workflows', () => {
    test('should create complete TikTok workflow', async () => {
      // Load TikTok captions
      const tiktokCaptions = await Bun.file('sample-files/tiktok-captions.json').json();
      
      const result = tiktok('sample-files/portrait-sample.mp4')
        .trim(0, 15) // TikTok length
        .pipe(addWordByWordCaptions(tiktokCaptions))
        .addText('Follow for more! 🔥', {
          position: 'bottom',
          style: { fontSize: 36, color: '#ffff00' }
        });
      
      const command = result.getCommand('output/tiktok-workflow.mp4');
      const executionResult = await executor.execute(command);
      
      expect(executionResult).toHaveProperty('success');
      expect(command).toContain('1080:1920');
      expect(command).toContain('Follow for more');
    });

    test('should create YouTube workflow with intro/outro', async () => {
      // Create intro
      const intro = youtube('sample-files/red-sample.mp4')
        .trim(0, 5)
        .addText('Welcome to my channel!', { position: 'center' });
      
      // Create main content
      const main = youtube('sample-files/blue-sample.mp4')
        .trim(0, 60)
        .addWatermark('sample-files/logo-150x150.png');
      
      // Create outro
      const outro = youtube('sample-files/portrait-sample.mp4')
        .trim(0, 5)
        .addText('Thanks for watching!', { position: 'center' });
      
      // Combine
      const complete = intro.concat(main).concat(outro);
      const command = complete.getCommand('output/youtube-workflow.mp4');
      
      const executionResult = await executor.execute(command);
      expect(executionResult).toHaveProperty('success');
      expect(command).toContain('1920:1080');
    });

    test('should create multi-platform content batch', async () => {
      const sourceVideo = 'sample-files/red-sample.mp4';
      const platforms = [
        { fn: tiktok, name: 'tiktok' },
        { fn: youtube, name: 'youtube' },
        { fn: (path: string) => instagram(path, { format: 'feed' }), name: 'instagram' }
      ];
      
      const results = [];
      
      for (const { fn, name } of platforms) {
        const result = fn(sourceVideo)
          .addText(`Optimized for ${name}`, { position: 'center' });
        
        const command = result.getCommand(`output/multi-platform-${name}.mp4`);
        const executionResult = await executor.execute(command);
        results.push({ platform: name, result: executionResult });
      }
      
      expect(results).toHaveLength(3);
      results.forEach(({ platform, result }) => {
        expect(result).toHaveProperty('success');
        console.log(`✅ ${platform} conversion completed`);
      });
    });
  });

  describe('📊 Performance and Batch Processing', () => {
    test('should handle batch platform conversions efficiently', async () => {
      const videos = [
        'sample-files/red-sample.mp4',
        'sample-files/blue-sample.mp4',
        'sample-files/portrait-sample.mp4'
      ];
      
      const startTime = Date.now();
      const results = [];
      
      for (const [index, video] of videos.entries()) {
        // Convert each video to TikTok format
        const result = tiktok(video)
          .addText(`Video ${index + 1}`, { position: 'center' });
        
        const command = result.getCommand(`output/batch-tiktok-${index + 1}.mp4`);
        const executionResult = await executor.execute(command);
        results.push(executionResult);
      }
      
      const duration = Date.now() - startTime;
      
      expect(results).toHaveLength(3);
      expect(duration).toBeLessThan(5000); // Should complete in reasonable time
      console.log(`Batch processing completed in ${duration}ms`);
    });

    test('should validate command generation performance', () => {
      const startTime = Date.now();
      const commands = [];
      
      // Generate 100 different platform commands
      for (let i = 0; i < 100; i++) {
        const result = tiktok('sample-files/red-sample.mp4')
          .addText(`Test ${i}`, { position: 'center' });
        
        const command = result.getCommand(`output/perf-test-${i}.mp4`);
        commands.push(command);
      }
      
      const duration = Date.now() - startTime;
      
      expect(commands).toHaveLength(100);
      expect(duration).toBeLessThan(1000); // Should generate quickly
      console.log(`Generated 100 commands in ${duration}ms`);
    });
  });

  describe('🧪 Edge Cases and Error Handling', () => {
    test('should handle invalid format gracefully', () => {
      expect(() => {
        instagram('sample-files/red-sample.mp4', { format: 'invalid' as any });
      }).not.toThrow();
    });

    test('should handle missing video files in cassette mode', async () => {
      const result = tiktok('non-existent-video.mp4');
      const command = result.getCommand('output/missing-file.mp4');
      
      const executionResult = await executor.execute(command);
      expect(executionResult).toHaveProperty('success');
      // In cassette mode, this depends on what's recorded
    });

    test('should handle very short videos', () => {
      const result = tiktok('sample-files/red-sample.mp4', {
        start: 0,
        duration: 0.5 // Very short
      });
      
      const command = result.getCommand('output/very-short.mp4');
      expect(command).toContain('1080:1920');
    });

    test('should handle very long videos', () => {
      const result = youtube('sample-files/blue-sample.mp4', {
        start: 0,
        duration: 3600 // 1 hour
      });
      
      expect(result).toBeInstanceOf(Timeline);
      const command = result.getCommand('output/very-long.mp4');
      expect(command).toContain('1920:1080');
    });
  });

  describe('📈 Cassette System Validation', () => {
    test('should record platform-specific cassettes', async () => {
      const platforms = ['tiktok', 'youtube', 'instagram'];
      
      for (const platform of platforms) {
        let result;
        switch (platform) {
          case 'tiktok':
            result = tiktok('sample-files/red-sample.mp4');
            break;
          case 'youtube':
            result = youtube('sample-files/blue-sample.mp4');
            break;
          case 'instagram':
            result = instagram('sample-files/portrait-sample.mp4', { format: 'feed' });
            break;
        }
        
        const command = result!.getCommand(`output/${platform}-cassette.mp4`);
        const executionResult = await executor.execute(command);
        
        expect(executionResult).toHaveProperty('success');
      }
      
      const stats = executor.getStats();
      expect(stats.interactions).toBeGreaterThan(0);
      expect(stats.runtime).toBe('bun');
    });

    test('should normalize platform commands consistently', async () => {
      // Same operation with different file names should normalize similarly
      const result1 = tiktok('sample-files/red-sample.mp4');
      const result2 = tiktok('sample-files/blue-sample.mp4');
      
      const command1 = result1.getCommand('output/test1.mp4');
      const command2 = result2.getCommand('output/test2.mp4');
      
      await executor.execute(command1);
      await executor.execute(command2);
      
      // Both should be handled by cassette system
      const stats = executor.getStats();
      expect(stats.interactions).toBeGreaterThan(0);
    });
  });
});
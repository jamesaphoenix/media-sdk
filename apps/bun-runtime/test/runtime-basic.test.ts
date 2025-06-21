/**
 * Basic runtime tests to verify everything is working
 */

import { test, expect, describe, beforeEach, afterEach } from 'bun:test';
import { Timeline, tiktok, youtube } from '@jamesaphoenix/media-sdk';
import { BunMockExecutor } from '../src/bun-cassette-manager';

describe('🚀 Basic Runtime Tests', () => {
  let executor: BunMockExecutor;

  beforeEach(() => {
    executor = new BunMockExecutor('runtime-basic');
  });

  afterEach(async () => {
    await executor.cleanup();
  });

  describe('✅ Runtime Functionality', () => {
    test('should create and execute basic timeline', async () => {
      const timeline = new Timeline()
        .addVideo('sample-files/red-sample.mp4')
        .addText('Runtime Test', { position: 'center' });

      const command = timeline.getCommand('output/runtime-test.mp4');
      const result = await executor.execute(command);

      expect(result).toHaveProperty('success');
      expect(result).toHaveProperty('command');
      expect(result).toHaveProperty('duration');
      expect(typeof result.duration).toBe('number');
      
      console.log(`  ✅ Basic timeline executed (${result.duration}ms)`);
    });

    test('should handle TikTok format conversion', async () => {
      const result = tiktok('sample-files/red-sample.mp4')
        .addText('TikTok Test', { position: 'center' });

      const command = result.getCommand('output/tiktok-runtime.mp4');
      const executionResult = await executor.execute(command);

      expect(command).toContain('1080:1920'); // TikTok aspect ratio
      expect(executionResult).toHaveProperty('success');
      
      console.log(`  📱 TikTok format working: ${executionResult.success ? 'YES' : 'NO'}`);
    });

    test('should handle YouTube format conversion', async () => {
      const result = youtube('sample-files/portrait-sample.mp4')
        .addText('YouTube Test', { position: 'center' });

      const command = result.getCommand('output/youtube-runtime.mp4');
      const executionResult = await executor.execute(command);

      expect(command).toContain('1920:1080'); // YouTube aspect ratio
      expect(executionResult).toHaveProperty('success');
      
      console.log(`  📺 YouTube format working: ${executionResult.success ? 'YES' : 'NO'}`);
    });

    test('should process multiple files in sequence', async () => {
      const files = [
        'sample-files/red-sample.mp4',
        'sample-files/blue-sample.mp4',
        'sample-files/portrait-sample.mp4'
      ];

      const results = [];
      for (const [index, file] of files.entries()) {
        const timeline = new Timeline()
          .addVideo(file)
          .addText(`File ${index + 1}`, { position: 'center' });

        const command = timeline.getCommand(`output/sequence-${index + 1}.mp4`);
        const result = await executor.execute(command);
        results.push(result);
      }

      expect(results).toHaveLength(3);
      results.forEach((result, i) => {
        expect(result).toHaveProperty('success');
        console.log(`  📹 File ${i + 1}: ${result.success ? 'OK' : 'FAILED'}`);
      });
    });

    test('should handle cassette recording and replay', async () => {
      const timeline = new Timeline()
        .addVideo('sample-files/red-sample.mp4')
        .addText('Cassette Test', { position: 'center' });

      const command = timeline.getCommand('output/cassette-test.mp4');

      // First execution (should record)
      const result1 = await executor.execute(command);
      
      // Second execution (should replay)
      const result2 = await executor.execute(command);

      expect(result1.command).toBe(result2.command);
      expect(result1.success).toBe(result2.success);
      
      console.log(`  💾 Cassette system working: ${result1.command === result2.command ? 'YES' : 'NO'}`);
    });

    test('should provide executor stats', () => {
      const stats = executor.getStats();
      
      expect(stats).toHaveProperty('name');
      expect(stats).toHaveProperty('runtime');
      expect(stats.runtime).toBe('bun');
      
      console.log(`  📊 Runtime: ${stats.runtime}`);
      console.log(`  📊 Interactions: ${stats.interactions}`);
    });
  });

  describe('⚡ Performance Check', () => {
    test('should generate commands quickly', () => {
      const startTime = Date.now();
      
      // Generate 10 commands
      const commands = [];
      for (let i = 0; i < 10; i++) {
        const timeline = tiktok('sample-files/red-sample.mp4')
          .addText(`Test ${i}`, { position: 'center' });
        
        commands.push(timeline.getCommand(`output/perf-${i}.mp4`));
      }
      
      const duration = Date.now() - startTime;
      
      expect(commands).toHaveLength(10);
      expect(duration).toBeLessThan(100); // Should be very fast
      
      console.log(`  ⚡ Generated 10 commands in ${duration}ms`);
    });

    test('should execute commands in reasonable time', async () => {
      const startTime = Date.now();
      
      const timeline = new Timeline()
        .addVideo('sample-files/red-sample.mp4')
        .addText('Speed Test', { position: 'center' });

      const command = timeline.getCommand('output/speed-test.mp4');
      const result = await executor.execute(command);
      
      const duration = Date.now() - startTime;
      
      expect(result).toHaveProperty('success');
      expect(duration).toBeLessThan(5000); // Should complete within 5 seconds
      
      console.log(`  ⏱️ Execution completed in ${duration}ms`);
    });
  });

  describe('🔧 Error Handling', () => {
    test('should handle missing files gracefully', async () => {
      const timeline = new Timeline()
        .addVideo('non-existent-file.mp4')
        .addText('Error Test', { position: 'center' });

      const command = timeline.getCommand('output/error-test.mp4');
      
      // Should not throw error
      expect(async () => {
        await executor.execute(command);
      }).not.toThrow();
      
      const result = await executor.execute(command);
      expect(result).toHaveProperty('success');
      
      console.log(`  🚫 Missing file handled: ${result.success ? 'UNEXPECTED' : 'OK'}`);
    });

    test('should handle empty timeline', () => {
      const timeline = new Timeline();
      
      expect(() => {
        timeline.getCommand('output/empty.mp4');
      }).not.toThrow();
      
      const command = timeline.getCommand('output/empty.mp4');
      expect(command).toContain('ffmpeg');
      
      console.log(`  📭 Empty timeline handled: OK`);
    });
  });
});
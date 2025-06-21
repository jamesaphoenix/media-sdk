/**
 * TDD Tests for Media SDK Timeline using Bun runtime
 */

import { test, expect, describe, beforeEach, afterEach } from 'bun:test';
import { Timeline, tiktok, youtube, instagram, addWordByWordCaptions, compose, brightness, contrast } from '@jamesaphoenix/media-sdk';
import { BunMockExecutor } from '../src/bun-cassette-manager';

describe('Media SDK Timeline (Bun Runtime)', () => {
  let timeline: Timeline;
  let executor: BunMockExecutor;

  beforeEach(() => {
    timeline = new Timeline();
    executor = new BunMockExecutor('timeline-tests');
  });

  afterEach(async () => {
    await executor.cleanup();
  });

  describe('🎬 Basic Timeline Operations', () => {
    test('should create empty timeline', () => {
      expect(timeline).toBeInstanceOf(Timeline);
      expect(timeline.getDuration()).toBe(0);
    });

    test('should add video to timeline', () => {
      const result = timeline.addVideo('sample-files/red-sample.mp4');
      
      expect(result).toBeInstanceOf(Timeline);
      expect(result).not.toBe(timeline); // Immutable
    });

    test('should add video with options', () => {
      const result = timeline.addVideo('sample-files/red-sample.mp4', {
        start: 10,
        duration: 30,
        position: 0
      });
      
      expect(result).toBeInstanceOf(Timeline);
      const command = result.getCommand('output/basic-with-options.mp4');
      expect(command).toContain('red-sample.mp4');
    });

    test('should generate valid FFmpeg command', () => {
      const result = timeline.addVideo('sample-files/red-sample.mp4');
      const command = result.getCommand('output/basic-output.mp4');
      
      expect(command).toMatch(/^ffmpeg/);
      expect(command).toContain('-i sample-files/red-sample.mp4');
      expect(command).toContain('output/basic-output.mp4');
      expect(command).toContain('-c:v');
      expect(command).toContain('-y');
    });

    test('should execute FFmpeg command via cassette', async () => {
      const result = timeline.addVideo('sample-files/red-sample.mp4');
      const command = result.getCommand('output/test-execution.mp4');
      
      const executionResult = await executor.execute(command);
      
      expect(executionResult).toHaveProperty('success');
      expect(executionResult).toHaveProperty('duration');
      expect(executionResult).toHaveProperty('command');
    });
  });

  describe('📱 Platform-Specific Presets', () => {
    test('should create TikTok format (9:16)', () => {
      const result = tiktok('sample-files/red-sample.mp4');
      const command = result.getCommand('output/tiktok-format.mp4');
      
      expect(command).toContain('1080:1920'); // 9:16 aspect ratio
      expect(command).toContain('crop=1080:1920');
    });

    test('should create YouTube format (16:9)', () => {
      const result = youtube('sample-files/red-sample.mp4');
      const command = result.getCommand('output/youtube-format.mp4');
      
      expect(command).toContain('1920:1080'); // 16:9 aspect ratio
      expect(command).toContain('crop=1920:1080');
    });

    test('should create Instagram square format', () => {
      const result = instagram('sample-files/red-sample.mp4', { format: 'feed' });
      const command = result.getCommand('output/instagram-square.mp4');
      
      expect(command).toContain('1080:1080'); // 1:1 aspect ratio
    });

    test('should execute TikTok conversion', async () => {
      const result = tiktok('sample-files/portrait-sample.mp4');
      const command = result.getCommand('output/tiktok-converted.mp4');
      
      const executionResult = await executor.execute(command);
      expect(executionResult.command).toContain('SAMPLE_FILE'); // Normalized
    });
  });

  describe('🎨 Effects and Filters', () => {
    test('should apply single effect', () => {
      const result = timeline
        .addVideo('sample-files/red-sample.mp4')
        .pipe(brightness(0.2));
      
      const command = result.getCommand('output/brightness-effect.mp4');
      expect(command).toContain('eq=brightness=0.2');
    });

    test('should compose multiple effects', () => {
      const vintageEffect = compose(
        brightness(0.1),
        contrast(1.3)
      );
      
      const result = timeline
        .addVideo('sample-files/blue-sample.mp4')
        .pipe(vintageEffect);
      
      const command = result.getCommand('output/vintage-effect.mp4');
      expect(command).toContain('eq=brightness=0.1');
      expect(command).toContain('eq=contrast=1.3');
    });

    test('should execute effects pipeline', async () => {
      const result = timeline
        .addVideo('sample-files/red-sample.mp4')
        .pipe(brightness(0.1))
        .pipe(contrast(1.2));
      
      const command = result.getCommand('output/effects-pipeline.mp4');
      const executionResult = await executor.execute(command);
      
      expect(executionResult).toHaveProperty('success');
    });
  });

  describe('📝 Text and Captions', () => {
    test('should add basic text overlay', () => {
      const result = timeline
        .addVideo('sample-files/red-sample.mp4')
        .addText('Hello Bun Runtime!', { position: 'center' });
      
      const command = result.getCommand('output/text-overlay.mp4');
      expect(command).toContain('drawtext');
      expect(command).toContain('Hello Bun Runtime!');
      expect(command).toContain('(w-text_w)/2');
    });

    test('should add styled text', () => {
      const result = timeline
        .addVideo('sample-files/blue-sample.mp4')
        .addText('Styled Text', {
          position: { x: 100, y: 200 },
          style: {
            fontSize: 48,
            color: '#ff0066',
            backgroundColor: 'rgba(0,0,0,0.8)'
          }
        });
      
      const command = result.getCommand('output/styled-text.mp4');
      expect(command).toContain('fontsize=48');
      expect(command).toContain('fontcolor=#ff0066');
    });

    test('should add word-by-word captions', async () => {
      const words = [
        { word: 'Bun', start: 0, end: 0.5 },
        { word: 'is', start: 0.5, end: 0.8 },
        { word: 'fast!', start: 0.8, end: 1.5 }
      ];

      const result = timeline
        .addVideo('sample-files/red-sample.mp4')
        .pipe(addWordByWordCaptions(words));
      
      expect(result).toBeInstanceOf(Timeline);
      
      const command = result.getCommand('output/word-captions.mp4');
      const executionResult = await executor.execute(command);
      expect(executionResult).toHaveProperty('success');
    });

    test('should load and use caption files', async () => {
      // Test loading real caption files
      const captionFile = await Bun.file('sample-files/word-timing.json');
      const words = await captionFile.json();
      
      expect(Array.isArray(words)).toBe(true);
      expect(words[0]).toHaveProperty('word');
      expect(words[0]).toHaveProperty('start');
      expect(words[0]).toHaveProperty('end');
      
      const result = timeline
        .addVideo('sample-files/red-sample.mp4')
        .pipe(addWordByWordCaptions(words));
      
      const command = result.getCommand('output/loaded-captions.mp4');
      expect(command).toContain('drawtext');
    });
  });

  describe('🖼️ Image and Audio Operations', () => {
    test('should add image overlay', () => {
      const result = timeline
        .addVideo('sample-files/red-sample.mp4')
        .addImage('sample-files/logo-150x150.png', {
          position: { x: 50, y: 50 },
          scale: 0.5
        });
      
      const command = result.getCommand('output/image-overlay.mp4');
      expect(command).toContain('logo-150x150.png');
      expect(command).toContain('overlay');
    });

    test('should add watermark', () => {
      const result = timeline
        .addVideo('sample-files/blue-sample.mp4')
        .addWatermark('sample-files/watermark.png', { 
          position: 'bottom-right',
          margin: 20 
        });
      
      const command = result.getCommand('output/watermarked.mp4');
      expect(command).toContain('watermark.png');
    });

    test('should add audio track', () => {
      const result = timeline
        .addVideo('sample-files/red-sample.mp4')
        .addAudio('sample-files/background-music.mp3', {
          volume: 0.8,
          fadeIn: 1,
          fadeOut: 2
        });
      
      expect(result).toBeInstanceOf(Timeline);
      
      const command = result.getCommand('output/with-audio.mp4');
      expect(command).toContain('background-music.mp3');
    });
  });

  describe('🔄 Timeline Manipulation', () => {
    test('should trim video', () => {
      const result = timeline
        .addVideo('sample-files/red-sample.mp4')
        .trim(1, 4); // Keep seconds 1-4
      
      const command = result.getCommand('output/trimmed.mp4');
      expect(command).toContain('-ss 1');
      expect(command).toContain('-t 3'); // duration = end - start
    });

    test('should scale video', () => {
      const result = timeline
        .addVideo('sample-files/red-sample.mp4')
        .scale(1920, 1080);
      
      const command = result.getCommand('output/scaled.mp4');
      expect(command).toContain('scale=1920:1080');
    });

    test('should crop video', () => {
      const result = timeline
        .addVideo('sample-files/portrait-sample.mp4')
        .crop({ width: 400, height: 400, x: 40, y: 120 });
      
      const command = result.getCommand('output/cropped.mp4');
      expect(command).toContain('crop=400:400:40:120');
    });

    test('should concatenate timelines', () => {
      const timeline1 = new Timeline().addVideo('sample-files/red-sample.mp4');
      const timeline2 = new Timeline().addVideo('sample-files/blue-sample.mp4');
      
      const result = timeline1.concat(timeline2);
      
      expect(result).toBeInstanceOf(Timeline);
    });
  });

  describe('🎭 Serialization and State', () => {
    test('should serialize to JSON', () => {
      const result = timeline
        .addVideo('sample-files/red-sample.mp4')
        .addText('Test', { position: 'center' })
        .scale(1920, 1080);
      
      const json = result.toJSON();
      
      expect(json).toHaveProperty('layers');
      expect(json).toHaveProperty('globalOptions');
      expect(Array.isArray(json.layers)).toBe(true);
    });

    test('should deserialize from JSON', () => {
      const original = timeline
        .addVideo('sample-files/red-sample.mp4')
        .addText('Test', { position: 'center' });
      
      const json = original.toJSON();
      const restored = Timeline.fromJSON(json);
      
      expect(restored).toBeInstanceOf(Timeline);
      expect(restored.getCommand('output.mp4')).toBe(original.getCommand('output.mp4'));
    });

    test('should maintain immutability', () => {
      const original = timeline.addVideo('sample-files/red-sample.mp4');
      const modified = original.addText('Hello');
      
      expect(original).not.toBe(modified);
      expect(original.getCommand('out1.mp4')).not.toBe(modified.getCommand('out2.mp4'));
    });
  });

  describe('🚀 Performance and Real-world Scenarios', () => {
    test('should handle complex social media workflow', async () => {
      const tiktokCaptions = await Bun.file('sample-files/tiktok-captions.json').json();
      
      const result = tiktok('sample-files/portrait-sample.mp4')
        .trim(0, 15)
        .pipe(compose(
          brightness(0.1),
          contrast(1.2)
        ))
        .pipe(addWordByWordCaptions(tiktokCaptions))
        .addText('Follow for more! 🔥', {
          position: 'bottom',
          style: { fontSize: 36, color: '#ffff00' }
        })
        .addWatermark('sample-files/logo-150x150.png', { 
          position: 'bottom-right',
          margin: 15 
        });
      
      const command = result.getCommand('output/tiktok-complete.mp4', {
        quality: 'high'
      });
      
      expect(command).toContain('1080:1920'); // TikTok format
      expect(command).toContain('eq=brightness=0.1');
      expect(command).toContain('Follow for more');
      
      const executionResult = await executor.execute(command);
      expect(executionResult).toHaveProperty('success');
    });

    test('should execute multiple videos in sequence', async () => {
      const videos = [
        'sample-files/red-sample.mp4',
        'sample-files/blue-sample.mp4',
        'sample-files/portrait-sample.mp4'
      ];
      
      const results = [];
      
      for (const [index, videoPath] of videos.entries()) {
        const result = timeline
          .addVideo(videoPath)
          .addText(`Video ${index + 1}`, { position: 'center' })
          .scale(1920, 1080);
        
        const command = result.getCommand(`output/sequence-${index + 1}.mp4`);
        const executionResult = await executor.execute(command);
        results.push(executionResult);
      }
      
      expect(results).toHaveLength(3);
      results.forEach(result => {
        expect(result).toHaveProperty('success');
        expect(result).toHaveProperty('duration');
      });
    });

    test('should handle large timeline with many operations', () => {
      let complexTimeline = timeline.addVideo('sample-files/red-sample.mp4');
      
      // Add multiple operations
      for (let i = 0; i < 10; i++) {
        complexTimeline = complexTimeline
          .addText(`Text ${i}`, { 
            position: { x: i * 50, y: i * 30 },
            startTime: i,
            duration: 2
          });
      }
      
      complexTimeline = complexTimeline
        .scale(1920, 1080)
        .pipe(brightness(0.1))
        .pipe(contrast(1.1))
        .addWatermark('sample-files/logo-150x150.png');
      
      const command = complexTimeline.getCommand('output/complex-timeline.mp4');
      
      expect(command).toContain('ffmpeg');
      expect(command.length).toBeGreaterThan(500); // Complex command
      expect(command).toContain('Text 0');
      expect(command).toContain('Text 9');
    });
  });

  describe('📊 Cassette System Integration', () => {
    test('should record and replay commands', async () => {
      const result = timeline
        .addVideo('sample-files/red-sample.mp4')
        .addText('Cassette Test', { position: 'center' });
      
      const command = result.getCommand('output/cassette-test.mp4');
      
      // First execution (should use cassette)
      const executionResult1 = await executor.execute(command);
      
      // Second execution (should replay from cassette)
      const executionResult2 = await executor.execute(command);
      
      expect(executionResult1.command).toBe(executionResult2.command);
      expect(executionResult1.success).toBe(executionResult2.success);
      
      const stats = executor.getStats();
      expect(stats.runtime).toBe('bun');
      expect(stats.interactions).toBeGreaterThan(0);
    });

    test('should normalize commands for consistent cassette matching', async () => {
      const command1 = timeline
        .addVideo('sample-files/red-sample.mp4')
        .getCommand('output/test1.mp4');
      
      const command2 = timeline
        .addVideo('sample-files/blue-sample.mp4')
        .getCommand('output/test2.mp4');
      
      // Both should normalize to similar patterns
      await executor.execute(command1);
      await executor.execute(command2);
      
      const stats = executor.getStats();
      expect(stats.interactions).toBeGreaterThan(0);
    });
  });

  describe('🧪 Error Handling and Edge Cases', () => {
    test('should handle missing files gracefully', async () => {
      const result = timeline.addVideo('non-existent-file.mp4');
      const command = result.getCommand('output/missing-file.mp4');
      
      const executionResult = await executor.execute(command);
      // Should not throw, but result may indicate failure
      expect(executionResult).toHaveProperty('success');
    });

    test('should handle invalid parameters', () => {
      expect(() => {
        timeline
          .addVideo('sample-files/red-sample.mp4')
          .addText('', { position: 'invalid' as any });
      }).not.toThrow();
    });

    test('should handle empty timeline', () => {
      const command = timeline.getCommand('output/empty.mp4');
      expect(command).toContain('ffmpeg');
    });

    test('should handle very long text', () => {
      const longText = 'A'.repeat(1000);
      const result = timeline
        .addVideo('sample-files/red-sample.mp4')
        .addText(longText, { position: 'center' });
      
      expect(result).toBeInstanceOf(Timeline);
      const command = result.getCommand('output/long-text.mp4');
      expect(command).toContain('drawtext');
    });
  });
});
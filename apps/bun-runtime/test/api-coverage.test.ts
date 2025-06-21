/**
 * Comprehensive API coverage tests for Media SDK with Bun runtime
 */

import { test, expect, describe, beforeEach, afterEach } from 'bun:test';
import { 
  Timeline,
  // Platform presets
  tiktok, youtube, instagram, twitter, linkedin, square, portrait, landscape,
  // Composition
  concat, loop,
  // Effects
  compose, brightness, contrast, saturation, fadeIn, fadeOut, blur,
  // Captions
  addWordByWordCaptions, addCaptions,
  // Utilities
  video
} from '@jamesaphoenix/media-sdk';
import { BunMockExecutor } from '../src/bun-cassette-manager';

describe('🔍 Complete API Coverage Tests', () => {
  let executor: BunMockExecutor;

  beforeEach(() => {
    executor = new BunMockExecutor('api-coverage');
  });

  afterEach(async () => {
    await executor.cleanup();
  });

  describe('🎬 Timeline API Core Methods', () => {
    test('Timeline.addVideo() with all options', async () => {
      const timeline = new Timeline()
        .addVideo('assets/bunny.mp4', {
          start: 2,
          duration: 10,
          position: 5,
          volume: 0.8
        });

      const command = timeline.getCommand('output/addVideo-test.mp4');
      const result = await executor.execute(command);

      // Test that command is generated and executed
      expect(command).toContain('ffmpeg');
      expect(command).toContain('assets/bunny.mp4');
      expect(result).toHaveProperty('success');
      console.log('  ✅ addVideo() with options');
    });

    test('Timeline.addText() with styling', async () => {
      const timeline = new Timeline()
        .addVideo('assets/nature.mp4')
        .addText('Styled Text', {
          position: { x: 100, y: 200 },
          startTime: 1,
          duration: 5,
          style: {
            fontSize: 32,
            color: '#ff0066',
            backgroundColor: 'rgba(0,0,0,0.7)',
            fontFamily: 'Arial'
          }
        });

      const command = timeline.getCommand('output/addText-styled.mp4');
      const result = await executor.execute(command);

      expect(command).toContain('drawtext');
      expect(command).toContain('fontsize=32');
      expect(command).toContain('fontcolor=#ff0066');
      expect(result).toHaveProperty('success');
      console.log('  ✅ addText() with styling');
    });

    test('Timeline.addImage() with positioning', async () => {
      const timeline = new Timeline()
        .addVideo('assets/portrait-nature.mp4')
        .addImage('assets/logo-150x150.png', {
          position: { x: 50, y: 50 },
          scale: 0.5,
          startTime: 2,
          duration: 3
        });

      const command = timeline.getCommand('output/addImage-test.mp4');
      const result = await executor.execute(command);

      expect(command).toContain('overlay');
      expect(command).toContain('logo-150x150.png');
      expect(result).toHaveProperty('success');
      console.log('  ✅ addImage() with positioning');
    });

    test('Timeline.addAudio() with effects', async () => {
      const timeline = new Timeline()
        .addVideo('assets/bunny.mp4')
        .addAudio('assets/background-music.mp3', {
          volume: 0.6,
          fadeIn: 2,
          fadeOut: 1,
          startTime: 1
        });

      const command = timeline.getCommand('output/addAudio-test.mp4');
      const result = await executor.execute(command);

      expect(command).toContain('background-music.mp3');
      expect(result).toHaveProperty('success');
      console.log('  ✅ addAudio() with effects');
    });

    test('Timeline.addWatermark() positioning', async () => {
      const positions = ['top-left', 'top-right', 'bottom-left', 'bottom-right', 'center'];
      
      for (const position of positions) {
        const timeline = new Timeline()
          .addVideo('assets/nature.mp4')
          .addWatermark('assets/logo-150x150.png', { 
            position: position as any,
            margin: 20,
            opacity: 0.7
          });

        const command = timeline.getCommand(`output/watermark-${position}.mp4`);
        const result = await executor.execute(command);

        expect(command).toContain('assets/logo-150x150.png');
        expect(result).toHaveProperty('success');
      }
      console.log('  ✅ addWatermark() all positions');
    });

    test('Timeline manipulation methods', async () => {
      const timeline = new Timeline()
        .addVideo('assets/portrait-nature.mp4')
        .trim(1, 5)
        .scale(1920, 1080)
        .crop({ width: 800, height: 600, x: 100, y: 200 })
        .setAspectRatio('16:9');

      const command = timeline.getCommand('output/manipulation-test.mp4');
      const result = await executor.execute(command);

      expect(command).toContain('-ss 1');
      expect(command).toContain('-t 4');
      expect(command).toContain('scale=1920:1080');
      expect(command).toContain('crop=800:600:100:200');
      expect(result).toHaveProperty('success');
      console.log('  ✅ Timeline manipulation methods');
    });

    test('Timeline.pipe() functional composition', async () => {
      const addTitle = (timeline: Timeline) => 
        timeline.addText('Title', { position: 'top' });
      
      const addSubtitle = (timeline: Timeline) =>
        timeline.addText('Subtitle', { position: 'bottom' });

      const timeline = new Timeline()
        .addVideo('assets/bunny.mp4')
        .pipe(addTitle)
        .pipe(addSubtitle);

      const command = timeline.getCommand('output/pipe-test.mp4');
      const result = await executor.execute(command);

      expect(command).toContain('Title');
      expect(command).toContain('Subtitle');
      expect(result).toHaveProperty('success');
      console.log('  ✅ pipe() functional composition');
    });

    test('Timeline.concat() method', async () => {
      const timeline1 = new Timeline()
        .addVideo('assets/bunny.mp4')
        .addText('Part 1', { position: 'center' });

      const timeline2 = new Timeline()
        .addVideo('assets/nature.mp4')
        .addText('Part 2', { position: 'center' });

      const combined = timeline1.concat(timeline2);
      const command = combined.getCommand('output/concat-method.mp4');
      const result = await executor.execute(command);

      expect(command).toContain('assets/bunny.mp4');
      expect(command).toContain('assets/nature.mp4');
      expect(result).toHaveProperty('success');
      console.log('  ✅ concat() method');
    });
  });

  describe('📱 Platform Preset Functions', () => {
    test('All platform presets generate correct aspect ratios', async () => {
      const platforms = [
        { fn: tiktok, name: 'TikTok', aspectRatio: '1080:1920' },
        { fn: youtube, name: 'YouTube', aspectRatio: '1920:1080' },
        { fn: square, name: 'Square', aspectRatio: '1080:1080' },
        { fn: portrait, name: 'Portrait', aspectRatio: '1080:1920' },
        { fn: landscape, name: 'Landscape', aspectRatio: '1920:1080' }
      ];

      for (const platform of platforms) {
        const result = platform.fn('assets/bunny.mp4');
        const command = result.getCommand(`output/${platform.name.toLowerCase()}-preset.mp4`);
        const executionResult = await executor.execute(command);

        expect(command).toContain(platform.aspectRatio);
        expect(executionResult).toHaveProperty('success');
        console.log(`  ✅ ${platform.name} preset (${platform.aspectRatio})`);
      }
    });

    test('Instagram formats', async () => {
      const formats = ['reels', 'feed', 'story'] as const;
      
      for (const format of formats) {
        const result = instagram('assets/nature.mp4', { format });
        const command = result.getCommand(`output/instagram-${format}.mp4`);
        const executionResult = await executor.execute(command);

        expect(executionResult).toHaveProperty('success');
        console.log(`  ✅ Instagram ${format} format`);
      }
    });

    test('Twitter and LinkedIn presets', async () => {
      const twitterResult = twitter('assets/portrait-nature.mp4');
      const linkedinResult = linkedin('assets/bunny.mp4');

      const twitterCommand = twitterResult.getCommand('output/twitter-test.mp4');
      const linkedinCommand = linkedinResult.getCommand('output/linkedin-test.mp4');

      const [twitterExec, linkedinExec] = await Promise.all([
        executor.execute(twitterCommand),
        executor.execute(linkedinCommand)
      ]);

      expect(twitterCommand).toContain('1280:720');
      expect(linkedinCommand).toContain('1920:1080');
      expect(twitterExec).toHaveProperty('success');
      expect(linkedinExec).toHaveProperty('success');
      console.log('  ✅ Twitter and LinkedIn presets');
    });
  });

  describe('🎨 Effects and Filters API', () => {
    test('Individual effects', async () => {
      const effects = [
        { fn: brightness, param: 0.2, filter: 'eq=brightness=0.2' },
        { fn: contrast, param: 1.5, filter: 'eq=contrast=1.5' },
        { fn: saturation, param: 1.3, filter: 'eq=saturation=1.3' }
      ];

      for (const effect of effects) {
        const timeline = new Timeline()
          .addVideo('assets/nature.mp4')
          .pipe(effect.fn(effect.param));

        const command = timeline.getCommand(`output/effect-${effect.fn.name}.mp4`);
        const result = await executor.execute(command);

        expect(command).toContain(effect.filter);
        expect(result).toHaveProperty('success');
        console.log(`  ✅ ${effect.fn.name}(${effect.param})`);
      }
    });

    test('Compose multiple effects', async () => {
      const vintageEffect = compose(
        brightness(0.1),
        contrast(1.4),
        saturation(0.8)
      );

      const timeline = new Timeline()
        .addVideo('assets/bunny.mp4')
        .pipe(vintageEffect);

      const command = timeline.getCommand('output/composed-effects.mp4');
      const result = await executor.execute(command);

      expect(command).toContain('eq=brightness=0.1');
      expect(command).toContain('eq=contrast=1.4');
      expect(command).toContain('eq=saturation=0.8');
      expect(result).toHaveProperty('success');
      console.log('  ✅ compose() multiple effects');
    });

    test('Fade effects', async () => {
      const timeline = new Timeline()
        .addVideo('assets/portrait-nature.mp4')
        .pipe(fadeIn(2))
        .pipe(fadeOut(1.5));

      const command = timeline.getCommand('output/fade-effects.mp4');
      const result = await executor.execute(command);

      expect(result).toHaveProperty('success');
      console.log('  ✅ fadeIn/fadeOut effects');
    });

    test('Blur effect', async () => {
      const timeline = new Timeline()
        .addVideo('assets/nature.mp4')
        .pipe(blur(5));

      const command = timeline.getCommand('output/blur-effect.mp4');
      const result = await executor.execute(command);

      expect(result).toHaveProperty('success');
      console.log('  ✅ blur() effect');
    });
  });

  describe('📝 Caption System API', () => {
    test('addWordByWordCaptions with styling', async () => {
      const words = [
        { word: 'Hello', start: 0, end: 0.5, style: { color: '#ff0000', scale: 1.2 } },
        { word: 'Bun', start: 0.5, end: 1.0, style: { color: '#00ff00', scale: 1.5 } },
        { word: 'Runtime!', start: 1.0, end: 2.0, style: { color: '#0000ff', scale: 1.3 } }
      ];

      const timeline = new Timeline()
        .addVideo('assets/bunny.mp4')
        .pipe(addWordByWordCaptions(words, {
          position: 'center',
          style: { fontSize: 48, backgroundColor: 'rgba(0,0,0,0.8)' }
        }));

      const command = timeline.getCommand('output/word-captions-styled.mp4');
      const result = await executor.execute(command);

      expect(result).toHaveProperty('success');
      console.log('  ✅ addWordByWordCaptions() with styling');
    });

    test('addSubtitles from SRT file', async () => {
      const timeline = new Timeline()
        .addVideo('assets/portrait-nature.mp4')
        .pipe(addCaptions('assets/demo-captions.srt', {
          style: { fontSize: 24, color: '#ffffff' }
        }));

      const command = timeline.getCommand('output/srt-subtitles.mp4');
      const result = await executor.execute(command);

      expect(result).toHaveProperty('success');
      console.log('  ✅ addCaptions() from SRT');
    });

    test('Load caption files', async () => {
      // Test loading JSON word timing
      const wordFile = Bun.file('assets/captions-words.json');
      const words = await wordFile.json();

      expect(Array.isArray(words)).toBe(true);
      expect(words[0]).toHaveProperty('word');
      expect(words[0]).toHaveProperty('start');
      expect(words[0]).toHaveProperty('end');

      const timeline = new Timeline()
        .addVideo('assets/nature.mp4')
        .pipe(addWordByWordCaptions(words));

      const command = timeline.getCommand('output/loaded-words.mp4');
      const result = await executor.execute(command);

      expect(result).toHaveProperty('success');
      console.log('  ✅ Load caption files from disk');
    });
  });

  describe('🔗 Composition Functions', () => {
    test('concat() function with multiple videos', async () => {
      const videos = [
        'assets/bunny.mp4',
        'assets/nature.mp4',
        'assets/portrait-nature.mp4'
      ];

      const result = concat(videos);
      const command = result.getCommand('output/concat-function.mp4');
      const execution = await executor.execute(command);

      expect(command).toContain('assets/bunny.mp4');
      expect(command).toContain('assets/nature.mp4');
      expect(command).toContain('assets/portrait-nature.mp4');
      expect(execution).toHaveProperty('success');
      console.log('  ✅ concat() function');
    });

    test('loop() function', async () => {
      const result = loop('assets/bunny.mp4', 3);
      const command = result.getCommand('output/loop-function.mp4');
      const execution = await executor.execute(command);

      expect(command).toContain('assets/bunny.mp4');
      expect(execution).toHaveProperty('success');
      console.log('  ✅ loop() function');
    });

    test('Helper functions: video(), image(), audio()', async () => {
      // Test video() helper
      const videoTimeline = video('assets/nature.mp4', {
        start: 1,
        duration: 3
      });

      // Image and audio via Timeline methods
      const imageTimeline = new Timeline()
        .addImage('assets/logo-150x150.png', {
          duration: 5,
          position: { x: 100, y: 100 }
        });

      const audioTimeline = new Timeline()
        .addAudio('assets/background-music.mp3', {
          volume: 0.5,
          fadeIn: 1
        });

      const videoCommand = videoTimeline.getCommand('output/video-helper.mp4');
      const imageCommand = imageTimeline.getCommand('output/image-helper.mp4');
      const audioCommand = audioTimeline.getCommand('output/audio-helper.mp4');

      const [videoResult, imageResult, audioResult] = await Promise.all([
        executor.execute(videoCommand),
        executor.execute(imageCommand),
        executor.execute(audioCommand)
      ]);

      expect(videoResult).toHaveProperty('success');
      expect(imageResult).toHaveProperty('success');
      expect(audioResult).toHaveProperty('success');
      console.log('  ✅ video() helper and Timeline methods');
    });
  });

  describe('💾 Serialization API', () => {
    test('Timeline.toJSON() and fromJSON()', async () => {
      const original = new Timeline()
        .addVideo('assets/bunny.mp4')
        .addText('Serialization Test', { position: 'center' })
        .scale(1920, 1080)
        .pipe(brightness(0.2));

      // Serialize
      const json = original.toJSON();
      expect(json).toHaveProperty('layers');
      expect(json).toHaveProperty('globalOptions');
      expect(Array.isArray(json.layers)).toBe(true);

      // Deserialize
      const restored = Timeline.fromJSON(json);
      expect(restored).toBeInstanceOf(Timeline);

      // Commands should be functionally identical (ignoring output path)
      const originalCommand = original.getCommand('output/test.mp4');
      const restoredCommand = restored.getCommand('output/test.mp4');
      expect(originalCommand).toBe(restoredCommand);

      // Test execution
      const result = await executor.execute(restoredCommand);
      expect(result).toHaveProperty('success');
      console.log('  ✅ toJSON() and fromJSON()');
    });

    test('Timeline state methods', () => {
      const timeline = new Timeline()
        .addVideo('assets/nature.mp4')
        .addText('State Test', { position: 'center' });

      // Test state retrieval methods that exist
      expect(typeof timeline.getDuration()).toBe('number');
      expect(typeof timeline.toJSON()).toBe('object');

      // Test immutability
      const modified = timeline.addText('Another text', { position: 'top' });
      expect(timeline).not.toBe(modified);
      expect(timeline.toJSON().layers.length).not.toBe(modified.toJSON().layers.length);

      console.log('  ✅ Timeline state methods and immutability');
    });
  });

  describe('🔧 Error Handling and Edge Cases', () => {
    test('Invalid parameters handling', async () => {
      // Test various invalid inputs
      const testCases = [
        () => new Timeline().addText('', { position: 'invalid' as any }),
        () => new Timeline().scale(-100, -100),
        () => new Timeline().trim(-1, 0),
        () => concat([]), // Empty array should throw
        () => loop('assets/bunny.mp4', 0) // Invalid count should throw
      ];

      for (const [index, testCase] of testCases.entries()) {
        if (index === 3 || index === 4) {
          // These should throw
          expect(testCase).toThrow();
        } else {
          // These should not throw but handle gracefully
          expect(testCase).not.toThrow();
        }
      }
      console.log('  ✅ Invalid parameters handled');
    });

    test('Large data handling', async () => {
      // Test with many text overlays
      let timeline = new Timeline().addVideo('assets/bunny.mp4');
      
      for (let i = 0; i < 20; i++) {
        timeline = timeline.addText(`Text ${i}`, {
          position: { x: i * 10, y: i * 10 },
          startTime: i * 0.5,
          duration: 1
        });
      }

      const command = timeline.getCommand('output/large-data.mp4');
      const result = await executor.execute(command);

      expect(command.length).toBeGreaterThan(1000); // Should be a long command
      expect(result).toHaveProperty('success');
      console.log('  ✅ Large data handling (20 text overlays)');
    });

    test('Unicode and special characters', async () => {
      const timeline = new Timeline()
        .addVideo('assets/nature.mp4')
        .addText('Unicode: 🎬📱💫 çñü', { position: 'center' })
        .addText('Special: "quotes" & <tags>', { position: 'bottom' });

      const command = timeline.getCommand('output/unicode-test.mp4');
      const result = await executor.execute(command);

      expect(command).toContain('Unicode');
      expect(command).toContain('Special');
      expect(result).toHaveProperty('success');
      console.log('  ✅ Unicode and special characters');
    });
  });

  describe('📊 Performance and Optimization', () => {
    test('Command generation performance', () => {
      const iterations = 100;
      const startTime = Date.now();

      for (let i = 0; i < iterations; i++) {
        const timeline = tiktok('assets/bunny.mp4')
          .addText(`Performance ${i}`, { position: 'center' })
          .pipe(brightness(0.1 + (i * 0.001)));

        timeline.getCommand(`output/perf-${i}.mp4`);
      }

      const duration = Date.now() - startTime;
      const avgPerCommand = duration / iterations;

      expect(duration).toBeLessThan(1000); // Should complete in under 1 second
      expect(avgPerCommand).toBeLessThan(10); // Each command under 10ms

      console.log(`  ⚡ ${iterations} commands in ${duration}ms (${avgPerCommand.toFixed(2)}ms avg)`);
    });

    test('Memory usage stability', () => {
      const initialMemory = process.memoryUsage().heapUsed;

      // Create and discard many timelines
      for (let i = 0; i < 50; i++) {
        const timeline = new Timeline()
          .addVideo('assets/nature.mp4')
          .addText(`Memory test ${i}`, { position: 'center' })
          .pipe(brightness(0.1));

        timeline.getCommand(`output/memory-${i}.mp4`);
      }

      const finalMemory = process.memoryUsage().heapUsed;
      const memoryIncrease = finalMemory - initialMemory;
      const memoryMB = memoryIncrease / 1024 / 1024;

      expect(memoryMB).toBeLessThan(50); // Should not increase by more than 50MB

      console.log(`  🧠 Memory increase: ${memoryMB.toFixed(2)}MB`);
    });
  });
});
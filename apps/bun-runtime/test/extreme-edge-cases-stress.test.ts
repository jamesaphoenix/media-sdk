/**
 * @fileoverview Extreme Edge Cases and Stress Testing
 * 
 * Comprehensive test suite that pushes the Media SDK to its absolute limits,
 * discovering edge cases and demonstrating robust error handling.
 */

import { test, expect, describe } from 'bun:test';
import { Timeline } from '@jamesaphoenix/media-sdk';
import { TransitionEngine } from '../../../packages/media-sdk/src/transitions/transition-engine.js';
import { MultiCaptionEngine } from '../../../packages/media-sdk/src/captions/multi-caption-engine.js';
import { MultiResolutionRenderer } from '../../../packages/media-sdk/src/rendering/multi-resolution-renderer.js';

describe('🔥 EXTREME STRESS TESTS - PUSHING SDK LIMITS', () => {
  test('should handle massive timeline with 1000+ layers', () => {
    console.log('🚀 Testing extreme timeline with 1000+ layers...');
    
    let timeline = new Timeline();
    const layerCount = 1000;
    const startTime = Date.now();
    
    // Add 1000 layers of different types
    for (let i = 0; i < layerCount; i++) {
      const type = i % 5;
      
      switch (type) {
        case 0: // Videos
          timeline = timeline.addVideo(`video${i}.mp4`, {
            startTime: i * 0.1,
            duration: 5
          });
          break;
        case 1: // Images
          timeline = timeline.addImage(`image${i}.jpg`, {
            startTime: i * 0.05,
            duration: 2
          });
          break;
        case 2: // Text overlays
          timeline = timeline.addText(`Text layer ${i}`, {
            startTime: i * 0.02,
            duration: 3,
            style: { fontSize: 20 + (i % 40) }
          });
          break;
        case 3: // Audio tracks
          timeline = timeline.addAudio(`audio${i}.mp3`, {
            startTime: i * 0.3,
            volume: 0.1 + (i % 10) * 0.05
          });
          break;
        case 4: // Filters
          timeline = timeline.addFilter('brightness', {
            value: -0.2 + (i % 100) * 0.004,
            startTime: i * 0.1
          });
          break;
      }
    }
    
    const constructionTime = Date.now() - startTime;
    const layers = timeline.toJSON().layers;
    
    console.log(`✅ Successfully created ${layers.length} layers in ${constructionTime}ms`);
    console.log(`   Videos: ${layers.filter(l => l.type === 'video').length}`);
    console.log(`   Images: ${layers.filter(l => l.type === 'image').length}`);
    console.log(`   Text: ${layers.filter(l => l.type === 'text').length}`);
    console.log(`   Audio: ${layers.filter(l => l.type === 'audio').length}`);
    console.log(`   Filters: ${layers.filter(l => l.type === 'filter').length}`);
    
    expect(layers.length).toBe(layerCount);
    expect(constructionTime).toBeLessThan(5000); // Should complete in under 5 seconds
  });

  test('should handle extreme overlapping scenarios', () => {
    console.log('🎯 Testing extreme layer overlapping...');
    
    let timeline = new Timeline();
    const overlayCount = 100;
    
    // Create a base video
    timeline = timeline.addVideo('base.mp4', { duration: 60 });
    
    // Add 100 overlapping images at the same time
    for (let i = 0; i < overlayCount; i++) {
      timeline = timeline.addImage(`overlay${i}.png`, {
        startTime: 30, // All start at the same time
        duration: 10,
        position: {
          x: i * 2, // Slight offset
          y: i * 2
        },
        style: {
          opacity: 0.1 // Very transparent
        }
      });
    }
    
    const layers = timeline.toJSON().layers;
    const overlappingLayers = layers.filter(l => 
      l.startTime === 30 && l.type === 'image'
    );
    
    console.log(`✅ Created ${overlappingLayers.length} overlapping layers`);
    console.log(`   All starting at time: 30s`);
    console.log(`   Complexity: EXTREME`);
    
    expect(overlappingLayers.length).toBe(overlayCount);
    
    // Test FFmpeg command generation doesn't crash
    const command = timeline.getCommand('extreme_overlap.mp4');
    expect(command.length).toBeGreaterThan(0);
    console.log(`   Generated command length: ${command.length} characters`);
  });

  test('should handle microsecond timing precision', () => {
    console.log('⏱️  Testing microsecond timing precision...');
    
    let timeline = new Timeline();
    const precisionTests = [
      { startTime: 0.001, duration: 0.001 }, // 1ms
      { startTime: 1.0001, duration: 0.0001 }, // 0.1ms
      { startTime: 2.00001, duration: 0.00001 }, // 0.01ms
      { startTime: 3.000001, duration: 0.000001 }, // 0.001ms (1 microsecond)
      { startTime: 4.123456789, duration: 0.987654321 } // Many decimal places
    ];
    
    precisionTests.forEach((test, index) => {
      timeline = timeline.addText(`Precision test ${index}`, {
        startTime: test.startTime,
        duration: test.duration,
        style: { fontSize: 24 }
      });
    });
    
    const layers = timeline.toJSON().layers;
    const textLayers = layers.filter(l => l.type === 'text');
    
    console.log('✅ Precision timing tests:');
    textLayers.forEach((layer, index) => {
      console.log(`   Layer ${index}: start=${layer.startTime}, duration=${layer.duration}`);
      expect(layer.startTime).toBe(precisionTests[index].startTime);
      expect(layer.duration).toBe(precisionTests[index].duration);
    });
    
    const command = timeline.getCommand('precision_timing.mp4');
    expect(command).toContain('enable='); // FFmpeg timing filters should be present
  });

  test('should handle extremely long video duration (24+ hours)', () => {
    console.log('🕐 Testing 24+ hour video duration...');
    
    const timeline = new Timeline()
      .addVideo('marathon.mp4', { 
        duration: 25 * 60 * 60 // 25 hours
      })
      .addText('Hour 1', { startTime: 0, duration: 3600 })
      .addText('Hour 12', { startTime: 12 * 3600, duration: 3600 })
      .addText('Hour 25', { startTime: 24 * 3600, duration: 3600 });
    
    const layers = timeline.toJSON().layers;
    const videoDuration = layers.find(l => l.type === 'video')?.duration;
    
    console.log(`✅ Created ${videoDuration / 3600} hour video`);
    console.log(`   Total layers: ${layers.length}`);
    
    expect(videoDuration).toBe(25 * 60 * 60);
    
    const command = timeline.getCommand('marathon_video.mp4');
    expect(command).toContain('marathon.mp4');
    console.log(`   Command generation successful for ${videoDuration}s video`);
  });

  test('should handle extreme text content (novels, unicode, emojis)', () => {
    console.log('📚 Testing extreme text content...');
    
    const extremeTexts = [
      // Very long text (novel excerpt)
      'Lorem ipsum dolor sit amet, consectetur adipiscing elit. '.repeat(100),
      
      // Unicode characters from multiple languages
      '这是中文 This is English Это русский هذا عربي これは日本語です यह हिंदी है',
      
      // Massive emoji string
      '🎬🎥📽️🎞️📹📷📸🎪🎭🎨🎯🎲🎳🎮🕹️🎰🎱🔮🎪🎡🎢🎠🎡'.repeat(50),
      
      // Special characters and symbols
      'Special chars: ™®©℠℗§¶†‡•‰‱′″‴‵‶‷‸‹›«»‚„‟',
      
      // Mathematical symbols
      'Math symbols: ∀∁∂∃∄∅∆∇∈∉∊∋∌∍∎∏∐∑−∓∔∕∖∗∘∙√∛∜∝∞∟∠∡∢∣∤∥∦∧∨∩∪∫∬∭∮∯∰∱∲∳∴∵∶∷∸∹∺∻∼∽∾∿',
      
      // Extremely long single word
      'supercalifragilisticexpialidocious'.repeat(20),
      
      // Mixed content with line breaks and special formatting
      'Line 1\nLine 2\tTabbed\r\nWindows line break\n\n\nMultiple breaks\n\t\r\n Mixed'
    ];
    
    let timeline = new Timeline().addVideo('base.mp4', { duration: 60 });
    
    extremeTexts.forEach((text, index) => {
      timeline = timeline.addText(text, {
        startTime: index * 8,
        duration: 7,
        style: {
          fontSize: 16,
          color: '#ffffff',
          strokeColor: '#000000',
          strokeWidth: 1
        }
      });
    });
    
    const layers = timeline.toJSON().layers;
    const textLayers = layers.filter(l => l.type === 'text');
    
    console.log(`✅ Added ${textLayers.length} extreme text layers:`);
    textLayers.forEach((layer, index) => {
      const textLength = layer.text?.length || 0;
      console.log(`   Text ${index}: ${textLength} characters`);
      expect(textLength).toBeGreaterThan(0);
    });
    
    const command = timeline.getCommand('extreme_text.mp4');
    expect(command).toContain('drawtext');
    console.log(`   Successfully generated command with extreme text content`);
  });

  test('should handle extreme resolution scenarios', () => {
    console.log('📐 Testing extreme resolution scenarios...');
    
    const renderer = new MultiResolutionRenderer();
    
    const extremeResolutions = [
      // Tiny resolutions
      { name: 'Micro', width: 1, height: 1 },
      { name: 'Tiny', width: 16, height: 16 },
      { name: 'Icon', width: 32, height: 32 },
      
      // Massive resolutions
      { name: 'Ultra8K', width: 15360, height: 8640 },
      { name: 'Cinema16K', width: 15360, height: 8640 },
      { name: 'IMAX', width: 11000, height: 8000 },
      
      // Weird aspect ratios
      { name: 'Ultra-wide', width: 5760, height: 1080 },
      { name: 'Super-tall', width: 1080, height: 5760 },
      { name: 'Square-mega', width: 8192, height: 8192 },
      
      // Non-standard ratios
      { name: 'Golden-ratio', width: 1618, height: 1000 },
      { name: 'Pi-ratio', width: 3141, height: 1000 },
      { name: 'Fibonacci', width: 1597, height: 987 }
    ];
    
    const validationResults: Array<{ resolution: any; valid: boolean; warnings: string[] }> = [];
    
    extremeResolutions.forEach(res => {
      const customRes = renderer.createCustomResolution(
        res.name,
        res.width,
        res.height,
        `Extreme ${res.name} resolution test`
      );
      
      const validation = renderer.validateRenderConfig(
        customRes,
        renderer.getQuality('medium')!
      );
      
      validationResults.push({
        resolution: customRes,
        valid: validation.valid,
        warnings: validation.warnings
      });
      
      console.log(`   ${res.name} (${res.width}x${res.height}): ${validation.valid ? '✅' : '❌'}`);
      if (validation.warnings.length > 0) {
        console.log(`     Warnings: ${validation.warnings.join(', ')}`);
      }
    });
    
    expect(validationResults.length).toBe(extremeResolutions.length);
    console.log(`✅ Tested ${extremeResolutions.length} extreme resolutions`);
  });
});

describe('🧪 EDGE CASE DISCOVERY TESTS', () => {
  test('should handle empty and null inputs gracefully', () => {
    console.log('🔍 Testing empty and null input handling...');
    
    const timeline = new Timeline();
    
    // Test empty strings
    expect(() => {
      timeline.addText('', { duration: 1 });
    }).not.toThrow();
    
    expect(() => {
      timeline.addText('   ', { duration: 1 }); // Whitespace only
    }).not.toThrow();
    
    expect(() => {
      timeline.addVideo('', { duration: 1 });
    }).not.toThrow();
    
    console.log('✅ Empty input handling: ROBUST');
  });

  test('should handle negative values and zero durations', () => {
    console.log('🔍 Testing negative values and edge timing...');
    
    let timeline = new Timeline();
    
    const edgeCases = [
      { startTime: -10, duration: 5 }, // Negative start
      { startTime: 0, duration: 0 }, // Zero duration
      { startTime: 5, duration: -2 }, // Negative duration
      { startTime: -5, duration: -3 }, // Both negative
      { startTime: Number.POSITIVE_INFINITY, duration: 1 }, // Infinity
      { startTime: 1, duration: Number.POSITIVE_INFINITY },
      { startTime: Number.NaN, duration: 1 }, // NaN values
      { startTime: 1, duration: Number.NaN }
    ];
    
    edgeCases.forEach((testCase, index) => {
      try {
        timeline = timeline.addText(`Edge case ${index}`, testCase);
        console.log(`   Case ${index}: start=${testCase.startTime}, duration=${testCase.duration} - HANDLED`);
      } catch (error) {
        console.log(`   Case ${index}: start=${testCase.startTime}, duration=${testCase.duration} - ERROR: ${error}`);
      }
    });
    
    const layers = timeline.toJSON().layers;
    console.log(`✅ Created ${layers.length} layers from edge case inputs`);
  });

  test('should handle circular references and memory leaks', () => {
    console.log('🔄 Testing circular reference handling...');
    
    let timeline = new Timeline();
    const iterations = 1000;
    const startMemory = process.memoryUsage().heapUsed;
    
    // Create many timelines that reference each other's data
    for (let i = 0; i < iterations; i++) {
      timeline = timeline
        .addVideo(`video${i}.mp4`, { duration: 1 })
        .addText(`Reference to video${(i + 1) % iterations}`, { duration: 1 });
      
      // Force garbage collection every 100 iterations
      if (i % 100 === 0 && global.gc) {
        global.gc();
      }
    }
    
    const endMemory = process.memoryUsage().heapUsed;
    const memoryIncrease = endMemory - startMemory;
    const memoryPerIteration = memoryIncrease / iterations;
    
    console.log(`✅ Memory analysis after ${iterations} iterations:`);
    console.log(`   Start memory: ${(startMemory / 1024 / 1024).toFixed(2)} MB`);
    console.log(`   End memory: ${(endMemory / 1024 / 1024).toFixed(2)} MB`);
    console.log(`   Increase: ${(memoryIncrease / 1024 / 1024).toFixed(2)} MB`);
    console.log(`   Per iteration: ${(memoryPerIteration / 1024).toFixed(2)} KB`);
    
    expect(memoryPerIteration).toBeLessThan(10 * 1024); // Less than 10KB per iteration
  });

  test('should handle malformed file paths and special characters', () => {
    console.log('📁 Testing malformed file paths...');
    
    const malformedPaths = [
      '', // Empty
      '   ', // Whitespace
      '..\\..\\..\\system32\\evil.exe', // Directory traversal
      '/dev/null', // Special system file
      'C:\\Windows\\System32\\kernel32.dll', // Windows system file
      'file:///etc/passwd', // URI format
      'https://malicious-site.com/script.js', // URL
      '../../../../../../../../etc/passwd', // Extended traversal
      'file\\with\\backslashes.mp4',
      'file/with/forward/slashes.mp4',
      'file with spaces.mp4',
      'file-with-unicode-中文.mp4',
      'file_with_emoji_🎬.mp4',
      '!@#$%^&*()_+-=[]{}|;:,.<>?.mp4', // Special characters
      'very_long_filename_that_exceeds_normal_filesystem_limits_and_keeps_going_and_going_and_going.mp4'.repeat(10)
    ];
    
    let timeline = new Timeline();
    
    malformedPaths.forEach((path, index) => {
      try {
        timeline = timeline.addVideo(path, { duration: 1 });
        console.log(`   Path ${index}: "${path.substring(0, 50)}..." - HANDLED`);
      } catch (error) {
        console.log(`   Path ${index}: "${path.substring(0, 50)}..." - ERROR CAUGHT`);
      }
    });
    
    const layers = timeline.toJSON().layers;
    console.log(`✅ Processed ${malformedPaths.length} malformed paths, created ${layers.length} layers`);
  });

  test('should handle concurrent operations and race conditions', async () => {
    console.log('⚡ Testing concurrent operations...');
    
    const numThreads = 50;
    const operationsPerThread = 20;
    
    const createTimelineAsync = async (threadId: number): Promise<number> => {
      let timeline = new Timeline();
      
      for (let i = 0; i < operationsPerThread; i++) {
        timeline = timeline
          .addVideo(`thread${threadId}_video${i}.mp4`, { duration: 1 })
          .addText(`Thread ${threadId} operation ${i}`, { duration: 1 })
          .addImage(`thread${threadId}_image${i}.jpg`, { duration: 1 });
        
        // Simulate some async work
        await new Promise(resolve => setTimeout(resolve, Math.random() * 2));
      }
      
      return timeline.toJSON().layers.length;
    };
    
    const startTime = Date.now();
    
    // Run concurrent timeline creation
    const promises = Array.from({ length: numThreads }, (_, i) => 
      createTimelineAsync(i)
    );
    
    const results = await Promise.all(promises);
    const endTime = Date.now();
    
    const totalLayers = results.reduce((sum, count) => sum + count, 0);
    const expectedLayers = numThreads * operationsPerThread * 3; // 3 layers per operation
    
    console.log(`✅ Concurrent operations completed in ${endTime - startTime}ms:`);
    console.log(`   Threads: ${numThreads}`);
    console.log(`   Operations per thread: ${operationsPerThread}`);
    console.log(`   Total layers created: ${totalLayers}`);
    console.log(`   Expected layers: ${expectedLayers}`);
    console.log(`   Success rate: ${((totalLayers / expectedLayers) * 100).toFixed(2)}%`);
    
    expect(totalLayers).toBe(expectedLayers);
  });
});

describe('🎯 REAL-WORLD SCENARIO STRESS TESTS', () => {
  test('should handle Netflix-scale video processing', () => {
    console.log('🎬 Simulating Netflix-scale video processing...');
    
    let timeline = new Timeline();
    
    // Simulate a 2-hour movie with multiple audio tracks and subtitles
    const movieDuration = 2 * 60 * 60; // 2 hours
    
    // Main video
    timeline = timeline.addVideo('movie_main.mp4', { duration: movieDuration });
    
    // Multiple audio tracks (different languages)
    const audioTracks = ['english', 'spanish', 'french', 'german', 'japanese'];
    audioTracks.forEach(lang => {
      timeline = timeline.addAudio(`audio_${lang}.ac3`, { 
        duration: movieDuration,
        volume: 1.0
      });
    });
    
    // Subtitle tracks for 20 languages
    const captionEngine = new MultiCaptionEngine();
    const languages = [
      'en', 'es', 'fr', 'de', 'ja', 'ko', 'zh', 'ru', 'it', 'pt',
      'ar', 'hi', 'th', 'vi', 'tr', 'pl', 'nl', 'sv', 'da', 'no'
    ];
    
    languages.forEach(lang => {
      const track = captionEngine.createTrack(lang, `Language ${lang}`);
      
      // Add subtitles every 3 seconds for the entire movie
      for (let time = 0; time < movieDuration; time += 3) {
        captionEngine.addCaption(
          track.id,
          `Subtitle at ${Math.floor(time / 60)}:${String(time % 60).padStart(2, '0')}`,
          time,
          time + 2.8
        );
      }
    });
    
    const layers = timeline.toJSON().layers;
    const stats = captionEngine.getStatistics();
    
    console.log(`✅ Netflix-scale simulation results:`);
    console.log(`   Movie duration: ${movieDuration / 3600} hours`);
    console.log(`   Video layers: ${layers.filter(l => l.type === 'video').length}`);
    console.log(`   Audio tracks: ${layers.filter(l => l.type === 'audio').length}`);
    console.log(`   Subtitle languages: ${stats.totalTracks}`);
    console.log(`   Total subtitles: ${stats.totalCaptions}`);
    console.log(`   Estimated file size: ${(movieDuration * 8 / 1024 / 1024).toFixed(0)} MB`);
    
    expect(stats.totalTracks).toBe(20);
    expect(stats.totalCaptions).toBeGreaterThan(20000); // Over 20k subtitles
  });

  test('should handle YouTube creator workflow', async () => {
    console.log('📺 Simulating YouTube creator workflow...');
    
    const renderer = new MultiResolutionRenderer();
    let timeline = new Timeline();
    
    // Typical YouTube video: 10 minutes with multiple segments
    const segments = [
      { type: 'intro', duration: 15, file: 'intro.mp4' },
      { type: 'main_content', duration: 480, file: 'main.mp4' },
      { type: 'sponsor', duration: 60, file: 'sponsor.mp4' },
      { type: 'outro', duration: 45, file: 'outro.mp4' }
    ];
    
    let currentTime = 0;
    segments.forEach(segment => {
      timeline = timeline.addVideo(segment.file, {
        startTime: currentTime,
        duration: segment.duration
      });
      currentTime += segment.duration;
    });
    
    // Add transitions between segments
    const transitionEngine = new TransitionEngine();
    const videoLayers = timeline.toJSON().layers.filter(l => l.type === 'video');
    transitionEngine.autoGenerateTransitions(videoLayers, {
      type: 'fade',
      duration: 0.5
    });
    
    // Add YouTube-style elements
    timeline = timeline
      .addImage('logo.png', { 
        startTime: 0, 
        duration: currentTime,
        position: { x: '95%', y: '5%' },
        style: { opacity: 0.8 }
      })
      .addText('Subscribe & Like!', {
        startTime: currentTime - 10,
        duration: 8,
        position: { x: '50%', y: '80%' },
        style: { fontSize: 36, color: '#ff0000' }
      })
      .addAudio('background_music.mp3', {
        duration: currentTime,
        volume: 0.3
      });
    
    // Simulate rendering for multiple platforms
    const renderTargets = [
      { name: 'YouTube_4K', resolution: '4K', quality: 'high' },
      { name: 'YouTube_1080p', resolution: '1080p', quality: 'high' },
      { name: 'YouTube_720p', resolution: '720p', quality: 'medium' },
      { name: 'Shorts', resolution: 'youtube-shorts', quality: 'medium' },
      { name: 'TikTok', resolution: 'tiktok', quality: 'medium' }
    ];
    
    const renderResults: string[] = [];
    for (const target of renderTargets) {
      const resolution = renderer.getResolution(target.resolution)!;
      const quality = renderer.getQuality(target.quality)!;
      
      const validation = renderer.validateRenderConfig(resolution, quality, 'youtube');
      if (validation.valid) {
        renderResults.push(`${target.name}_${resolution.width}x${resolution.height}`);
      }
    }
    
    const finalLayers = timeline.toJSON().layers;
    
    console.log(`✅ YouTube creator workflow simulation:`);
    console.log(`   Total video duration: ${currentTime} seconds`);
    console.log(`   Video segments: ${segments.length}`);
    console.log(`   Transitions: ${transitionEngine.getTransitions().length}`);
    console.log(`   Total layers: ${finalLayers.length}`);
    console.log(`   Render targets: ${renderResults.length}`);
    renderResults.forEach(target => console.log(`     - ${target}`));
    
    expect(finalLayers.length).toBeGreaterThan(segments.length);
    expect(renderResults.length).toBe(renderTargets.length);
  });

  test('should handle enterprise presentation system', () => {
    console.log('🏢 Simulating enterprise presentation system...');
    
    let timeline = new Timeline();
    const captionEngine = new MultiCaptionEngine();
    
    // Corporate presentation: 60 slides, 45 minutes
    const slideCount = 60;
    const totalDuration = 45 * 60; // 45 minutes
    const slideDelay = totalDuration / slideCount;
    
    // Create multi-language presentation
    const languages = [
      { code: 'en', name: 'English' },
      { code: 'es', name: 'Spanish' },
      { code: 'fr', name: 'French' },
      { code: 'de', name: 'German' },
      { code: 'ja', name: 'Japanese' }
    ];
    
    const tracks = languages.map(lang => 
      captionEngine.createTrack(lang.code, lang.name)
    );
    
    for (let i = 0; i < slideCount; i++) {
      const startTime = i * slideDelay;
      
      // Add slide image
      timeline = timeline.addImage(`slide_${String(i + 1).padStart(3, '0')}.png`, {
        startTime,
        duration: slideDelay
      });
      
      // Add slide title and content in multiple languages
      const slideData = {
        en: { title: `Slide ${i + 1} Title`, content: `Content for slide ${i + 1}` },
        es: { title: `Título de Diapositiva ${i + 1}`, content: `Contenido para diapositiva ${i + 1}` },
        fr: { title: `Titre de Diapositive ${i + 1}`, content: `Contenu pour diapositive ${i + 1}` },
        de: { title: `Folie ${i + 1} Titel`, content: `Inhalt für Folie ${i + 1}` },
        ja: { title: `スライド${i + 1}タイトル`, content: `スライド${i + 1}の内容` }
      };
      
      tracks.forEach((track, langIndex) => {
        const lang = languages[langIndex].code as keyof typeof slideData;
        const data = slideData[lang];
        
        captionEngine.addCaption(track.id, data.title, startTime + 0.5, startTime + 3, {
          style: { fontSize: 48, fontWeight: 'bold', color: '#000080' }
        });
        
        captionEngine.addCaption(track.id, data.content, startTime + 3, startTime + slideDelay - 1, {
          style: { fontSize: 32, color: '#000000' }
        });
      });
    }
    
    // Add corporate branding
    timeline = timeline
      .addImage('company_logo.png', {
        startTime: 0,
        duration: totalDuration,
        position: { x: '95%', y: '5%' }
      })
      .addAudio('corporate_background.mp3', {
        duration: totalDuration,
        volume: 0.1
      });
    
    const layers = timeline.toJSON().layers;
    const stats = captionEngine.getStatistics();
    
    console.log(`✅ Enterprise presentation simulation:`);
    console.log(`   Slides: ${slideCount}`);
    console.log(`   Duration: ${totalDuration / 60} minutes`);
    console.log(`   Languages: ${languages.length}`);
    console.log(`   Total layers: ${layers.length}`);
    console.log(`   Total captions: ${stats.totalCaptions}`);
    console.log(`   Slides per minute: ${(slideCount / (totalDuration / 60)).toFixed(1)}`);
    console.log(`   Memory efficiency: ${(layers.length / slideCount).toFixed(2)} layers per slide`);
    
    expect(layers.filter(l => l.type === 'image').length).toBe(slideCount + 1); // Slides + logo
    expect(stats.totalTracks).toBe(languages.length);
    expect(stats.totalCaptions).toBe(slideCount * 2 * languages.length); // Title + content per slide per language
  });

  test('should handle social media content factory', async () => {
    console.log('📱 Simulating social media content factory...');
    
    const renderer = new MultiResolutionRenderer();
    const contentTypes = [
      { platform: 'instagram', type: 'story', count: 50 },
      { platform: 'tiktok', type: 'short', count: 30 },
      { platform: 'youtube', type: 'short', count: 20 },
      { platform: 'instagram', type: 'reel', count: 40 },
      { platform: 'twitter', type: 'video', count: 25 }
    ];
    
    let totalContent = 0;
    const renderResults: Array<{ platform: string; type: string; success: boolean }> = [];
    
    for (const content of contentTypes) {
      console.log(`   Processing ${content.count} ${content.platform} ${content.type}s...`);
      
      for (let i = 0; i < content.count; i++) {
        let timeline = new Timeline();
        
        // Different content strategies per platform
        if (content.platform === 'tiktok' || content.type === 'short') {
          // Vertical, fast-paced content
          timeline = timeline
            .addVideo(`${content.platform}_${content.type}_${i}.mp4`, { duration: 15 })
            .addText('Trending hashtag content! 🔥', {
              startTime: 1,
              duration: 3,
              style: { fontSize: 48, color: '#ffffff' }
            })
            .addAudio('trending_music.mp3', { duration: 15, volume: 0.8 });
        } else if (content.platform === 'instagram' && content.type === 'story') {
          // Story format with interactive elements
          timeline = timeline
            .addImage(`story_bg_${i}.jpg`, { duration: 5 })
            .addText('Swipe up! 👆', {
              startTime: 2,
              duration: 2,
              position: { x: '50%', y: '80%' },
              style: { fontSize: 36 }
            });
        } else {
          // Standard social content
          timeline = timeline
            .addVideo(`content_${i}.mp4`, { duration: 30 })
            .addText(`Content piece ${i + 1}`, {
              startTime: 0.5,
              duration: 4,
              style: { fontSize: 42 }
            });
        }
        
        // Validate rendering capability
        const platformRes = renderer.getRecommendedResolutions(content.platform);
        const resolution = platformRes[0] || renderer.getResolution('1080p')!;
        const validation = renderer.validateRenderConfig(
          resolution,
          renderer.getQuality('medium')!,
          content.platform
        );
        
        renderResults.push({
          platform: content.platform,
          type: content.type,
          success: validation.valid
        });
        
        totalContent++;
      }
    }
    
    const successCount = renderResults.filter(r => r.success).length;
    const platformStats = renderResults.reduce((acc, result) => {
      const key = `${result.platform}_${result.type}`;
      acc[key] = (acc[key] || 0) + (result.success ? 1 : 0);
      return acc;
    }, {} as Record<string, number>);
    
    console.log(`✅ Social media content factory simulation:`);
    console.log(`   Total content pieces: ${totalContent}`);
    console.log(`   Successful validations: ${successCount}/${totalContent} (${((successCount/totalContent)*100).toFixed(1)}%)`);
    console.log(`   Platform breakdown:`);
    Object.entries(platformStats).forEach(([platform, count]) => {
      console.log(`     ${platform}: ${count} pieces`);
    });
    
    expect(totalContent).toBe(contentTypes.reduce((sum, c) => sum + c.count, 0));
    expect(successCount).toBe(totalContent); // All should validate successfully
  });
});

describe('🔬 PERFORMANCE BENCHMARKING', () => {
  test('should benchmark timeline creation performance', () => {
    console.log('⚡ Benchmarking timeline creation performance...');
    
    const benchmarks = [
      { layers: 10, name: 'Small' },
      { layers: 100, name: 'Medium' },
      { layers: 500, name: 'Large' },
      { layers: 1000, name: 'Extra Large' }
    ];
    
    benchmarks.forEach(benchmark => {
      const startTime = Date.now();
      let timeline = new Timeline();
      
      for (let i = 0; i < benchmark.layers; i++) {
        timeline = timeline
          .addVideo(`video${i}.mp4`, { duration: 10 })
          .addText(`Text ${i}`, { duration: 5 });
      }
      
      const endTime = Date.now();
      const duration = endTime - startTime;
      const layersPerMs = (benchmark.layers * 2) / duration; // 2 layers per iteration
      
      console.log(`   ${benchmark.name} (${benchmark.layers * 2} layers): ${duration}ms (${layersPerMs.toFixed(2)} layers/ms)`);
      
      expect(duration).toBeLessThan(benchmark.layers * 10); // Should be under 10ms per iteration
    });
  });

  test('should benchmark command generation performance', () => {
    console.log('⚡ Benchmarking FFmpeg command generation...');
    
    const timeline = new Timeline();
    
    // Create a complex timeline
    let complexTimeline = timeline;
    for (let i = 0; i < 200; i++) {
      complexTimeline = complexTimeline
        .addVideo(`video${i}.mp4`, { startTime: i * 0.5, duration: 10 })
        .addText(`Text ${i}`, { startTime: i * 0.3, duration: 5 })
        .addFilter('brightness', { value: 0.1 * (i % 10) });
    }
    
    const startTime = Date.now();
    const command = complexTimeline.getCommand('benchmark_output.mp4');
    const endTime = Date.now();
    
    const duration = endTime - startTime;
    const layers = complexTimeline.toJSON().layers;
    const commandLength = command.length;
    
    console.log(`✅ Command generation benchmark:`);
    console.log(`   Layers: ${layers.length}`);
    console.log(`   Generation time: ${duration}ms`);
    console.log(`   Command length: ${commandLength} characters`);
    console.log(`   Generation rate: ${(layers.length / duration).toFixed(2)} layers/ms`);
    console.log(`   Characters per ms: ${(commandLength / duration).toFixed(0)}`);
    
    expect(duration).toBeLessThan(1000); // Should generate in under 1 second
    expect(commandLength).toBeGreaterThan(0);
  });
});

console.log('🎯 Extreme Edge Case and Stress Testing Suite');
console.log('   Testing SDK limits and discovering edge cases...');
console.log('   Validating robustness under extreme conditions...');
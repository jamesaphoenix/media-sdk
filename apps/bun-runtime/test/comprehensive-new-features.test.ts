/**
 * @fileoverview Comprehensive Tests for New SDK Features
 * 
 * Tests for the advanced transition engine, multi-caption system,
 * and multi-resolution rendering capabilities.
 */

import { test, expect, describe } from 'bun:test';
import { Timeline } from '@jamesaphoenix/media-sdk';
import { TransitionEngine } from '../../../packages/media-sdk/src/transitions/transition-engine.js';
import { MultiCaptionEngine } from '../../../packages/media-sdk/src/captions/multi-caption-engine.js';
import { MultiResolutionRenderer } from '../../../packages/media-sdk/src/rendering/multi-resolution-renderer.js';

describe('🎬 TRANSITION ENGINE TESTS', () => {
  test('should create transition engine with default settings', () => {
    const engine = new TransitionEngine();
    expect(engine).toBeDefined();
    expect(engine.getTransitions()).toHaveLength(0);
  });

  test('should add fade transition between layers', () => {
    const engine = new TransitionEngine();
    
    // Mock timeline layers
    const layer1 = {
      type: 'video' as const,
      source: 'video1.mp4',
      startTime: 0,
      duration: 5
    };
    
    const layer2 = {
      type: 'video' as const,
      source: 'video2.mp4',
      startTime: 4,
      duration: 5
    };

    const transition = engine.addTransition(layer1, layer2, {
      type: 'fade',
      duration: 1.0
    });

    expect(transition).toBeDefined();
    expect(transition.transition.type).toBe('fade');
    expect(transition.transition.duration).toBe(1.0);
    expect(transition.filterString).toContain('xfade');
  });

  test('should generate slide transition with direction', () => {
    const engine = new TransitionEngine();
    
    const layer1 = {
      type: 'image' as const,
      source: 'image1.jpg',
      startTime: 0,
      duration: 3
    };
    
    const layer2 = {
      type: 'image' as const,
      source: 'image2.jpg',
      startTime: 2,
      duration: 3
    };

    const transition = engine.addTransition(layer1, layer2, {
      type: 'slide',
      duration: 1.5,
      direction: 'left'
    });

    expect(transition.filterString).toContain('overlay');
    expect(transition.filterString).toContain('iw*t');
  });

  test('should create zoom transition', () => {
    const engine = new TransitionEngine();
    
    const layer1 = { type: 'video' as const, source: 'clip1.mp4', startTime: 0, duration: 4 };
    const layer2 = { type: 'video' as const, source: 'clip2.mp4', startTime: 3, duration: 4 };

    const transition = engine.addTransition(layer1, layer2, {
      type: 'zoom',
      duration: 1.0,
      direction: 'center-out'
    });

    expect(transition.filterString).toContain('scale');
    expect(transition.transition.direction).toBe('center-out');
  });

  test('should support wipe transition', () => {
    const engine = new TransitionEngine();
    
    const layer1 = { type: 'image' as const, source: 'bg1.jpg', startTime: 0, duration: 5 };
    const layer2 = { type: 'image' as const, source: 'bg2.jpg', startTime: 4, duration: 5 };

    const transition = engine.addTransition(layer1, layer2, {
      type: 'wipe',
      duration: 2.0,
      direction: 'right'
    });

    expect(transition.filterString).toContain('crop');
    expect(transition.filterString).toContain('overlay');
  });

  test('should generate filter complex for multiple transitions', () => {
    const engine = new TransitionEngine();
    
    const layers = [
      { type: 'video' as const, source: 'video1.mp4', startTime: 0, duration: 3 },
      { type: 'video' as const, source: 'video2.mp4', startTime: 2, duration: 3 },
      { type: 'video' as const, source: 'video3.mp4', startTime: 4, duration: 3 }
    ];

    engine.addTransition(layers[0], layers[1], { type: 'fade', duration: 1.0 });
    engine.addTransition(layers[1], layers[2], { type: 'slide', duration: 1.0 });

    const filterComplex = engine.buildFilterComplex();
    
    expect(filterComplex).toContain('xfade');
    expect(filterComplex).toContain('overlay');
    expect(filterComplex.split(';')).toHaveLength(2);
  });

  test('should auto-generate transitions for timeline layers', () => {
    const engine = new TransitionEngine();
    
    const layers = [
      { type: 'video' as const, source: 'clip1.mp4', startTime: 0, duration: 5 },
      { type: 'video' as const, source: 'clip2.mp4', startTime: 4, duration: 5 },
      { type: 'video' as const, source: 'clip3.mp4', startTime: 8, duration: 5 },
      { type: 'image' as const, source: 'img1.jpg', startTime: 12, duration: 3 }
    ];

    const transitions = engine.autoGenerateTransitions(layers, {
      type: 'fade',
      duration: 1.0
    });

    expect(transitions).toHaveLength(3); // 4 layers = 3 transitions
    expect(transitions[0].transition.type).toBe('fade');
  });

  test('should use transition presets', () => {
    const smoothPreset = TransitionEngine.createPreset('smooth');
    expect(smoothPreset.type).toBe('fade');
    expect(smoothPreset.duration).toBe(1.0);
    expect(smoothPreset.easing).toBe('ease-in-out');

    const dramaticPreset = TransitionEngine.createPreset('dramatic');
    expect(dramaticPreset.type).toBe('zoom');
    expect(dramaticPreset.duration).toBe(2.0);

    const glitchPreset = TransitionEngine.createPreset('tech');
    expect(glitchPreset.type).toBe('glitch');
  });
});

describe('📝 MULTI-CAPTION ENGINE TESTS', () => {
  test('should create multi-caption engine', () => {
    const engine = new MultiCaptionEngine();
    expect(engine).toBeDefined();
    expect(engine.getAllTracks()).toHaveLength(0);
  });

  test('should create caption tracks for different languages', () => {
    const engine = new MultiCaptionEngine();
    
    const englishTrack = engine.createTrack('en', 'English');
    const spanishTrack = engine.createTrack('es', 'Español');
    const frenchTrack = engine.createTrack('fr', 'Français');

    expect(englishTrack.language).toBe('en');
    expect(spanishTrack.languageName).toBe('Español');
    expect(engine.getAllTracks()).toHaveLength(3);
  });

  test('should add captions to tracks', () => {
    const engine = new MultiCaptionEngine();
    const track = engine.createTrack('en', 'English');

    const caption = engine.addCaption(
      track.id,
      'Hello, world!',
      1.0,
      3.0,
      {
        style: { fontSize: 32, color: '#ffffff' },
        animation: { type: 'fade-in', duration: 0.5 }
      }
    );

    expect(caption.text).toBe('Hello, world!');
    expect(caption.startTime).toBe(1.0);
    expect(caption.endTime).toBe(3.0);
    expect(caption.style?.fontSize).toBe(32);
    expect(caption.animation?.type).toBe('fade-in');
  });

  test('should add caption sequences with auto-timing', () => {
    const engine = new MultiCaptionEngine();
    const track = engine.createTrack('en', 'English');

    const texts = [
      'Welcome to our presentation',
      'Today we will cover',
      'Advanced video techniques',
      'Thank you for watching'
    ];

    const captions = engine.addCaptionSequence(track.id, texts, 0, {
      spacing: 0.5,
      duration: 2.0
    });

    expect(captions).toHaveLength(4);
    expect(captions[0].startTime).toBe(0);
    expect(captions[1].startTime).toBe(2.5); // 2.0 duration + 0.5 spacing
    expect(captions[3].startTime).toBe(7.5); // Last caption
  });

  test('should generate FFmpeg filters for captions', () => {
    const engine = new MultiCaptionEngine();
    const track = engine.createTrack('en', 'English');

    engine.addCaption(track.id, 'Sample Text', 1.0, 3.0, {
      style: {
        fontSize: 48,
        color: '#ffffff',
        strokeColor: '#000000',
        strokeWidth: 2
      }
    });

    const filters = engine.generateFilters();
    
    expect(filters).toContain('drawtext');
    expect(filters).toContain('Sample Text');
    expect(filters).toContain('fontsize=48');
    expect(filters).toContain('fontcolor=#ffffff');
    expect(filters).toContain('bordercolor=#000000');
  });

  test('should support caption animations', () => {
    const engine = new MultiCaptionEngine();
    const track = engine.createTrack('en', 'English');

    // Test different animation types
    const animations = [
      { type: 'fade-in' as const, duration: 0.5 },
      { type: 'slide-in' as const, duration: 0.8, direction: 'left' as const },
      { type: 'zoom-in' as const, duration: 0.3 },
      { type: 'typewriter' as const, duration: 1.0 }
    ];

    animations.forEach((animation, index) => {
      engine.addCaption(track.id, `Text ${index}`, index * 2, index * 2 + 2, {
        animation
      });
    });

    const filters = engine.generateFilters();
    
    expect(filters).toContain('alpha='); // fade-in effect
    expect(filters).toContain('substr('); // typewriter effect
  });

  test('should export captions to SRT format', () => {
    const engine = new MultiCaptionEngine();
    const track = engine.createTrack('en', 'English');

    engine.addCaption(track.id, 'First caption', 1.0, 3.0);
    engine.addCaption(track.id, 'Second caption', 3.5, 5.5);
    engine.addCaption(track.id, 'Third caption', 6.0, 8.0);

    const srt = engine.exportCaptions(track.id, { format: 'srt' });
    
    expect(srt).toContain('1\n');
    expect(srt).toContain('00:00:01,000 --> 00:00:03,000');
    expect(srt).toContain('First caption');
    expect(srt).toContain('2\n');
    expect(srt).toContain('Second caption');
  });

  test('should export captions to VTT format', () => {
    const engine = new MultiCaptionEngine();
    const track = engine.createTrack('en', 'English');

    engine.addCaption(track.id, 'WebVTT caption', 2.5, 4.5);

    const vtt = engine.exportCaptions(track.id, { format: 'vtt' });
    
    expect(vtt).toContain('WEBVTT');
    expect(vtt).toContain('00:00:02.500 --> 00:00:04.500');
    expect(vtt).toContain('WebVTT caption');
  });

  test('should handle multi-line captions', () => {
    const engine = new MultiCaptionEngine();
    engine.setSyncOptions({ autoBreak: true, maxCharsPerLine: 20 });
    
    const track = engine.createTrack('en', 'English');
    engine.addCaption(track.id, 'This is a very long caption that should be broken into multiple lines automatically', 1.0, 5.0);

    const filters = engine.generateFilters();
    expect(filters).toContain('\\n'); // Multi-line separator (single backslash n)
  });

  test('should provide caption statistics', () => {
    const engine = new MultiCaptionEngine();
    
    const enTrack = engine.createTrack('en', 'English');
    const esTrack = engine.createTrack('es', 'Spanish');

    engine.addCaption(enTrack.id, 'English caption 1', 0, 2);
    engine.addCaption(enTrack.id, 'English caption 2', 2, 4);
    engine.addCaption(esTrack.id, 'Spanish caption 1', 0, 2);

    const stats = engine.getStatistics();
    
    expect(stats.totalTracks).toBe(2);
    expect(stats.totalCaptions).toBe(3);
    expect(stats.totalDuration).toBe(6); // 2+2+2 seconds
    expect(stats.languageDistribution['en']).toBe(2);
    expect(stats.languageDistribution['es']).toBe(1);
  });
});

describe('🎥 MULTI-RESOLUTION RENDERER TESTS', () => {
  test('should create multi-resolution renderer', () => {
    const renderer = new MultiResolutionRenderer();
    expect(renderer).toBeDefined();
    
    const resolutions = renderer.getResolutions();
    expect(resolutions.length).toBeGreaterThan(0);
    
    const qualities = renderer.getQualities();
    expect(qualities.length).toBeGreaterThan(0);
  });

  test('should get standard resolutions', () => {
    const renderer = new MultiResolutionRenderer();
    
    const resolution4K = renderer.getResolution('4K');
    expect(resolution4K?.width).toBe(3840);
    expect(resolution4K?.height).toBe(2160);
    expect(resolution4K?.aspectRatio).toBe('16:9');

    const resolution1080p = renderer.getResolution('1080p');
    expect(resolution1080p?.width).toBe(1920);
    expect(resolution1080p?.height).toBe(1080);

    const tiktokRes = renderer.getResolution('tiktok');
    expect(tiktokRes?.aspectRatio).toBe('9:16');
    expect(tiktokRes?.width).toBe(1080);
    expect(tiktokRes?.height).toBe(1920);
  });

  test('should get quality presets', () => {
    const renderer = new MultiResolutionRenderer();
    
    const highQuality = renderer.getQuality('high');
    expect(highQuality?.crf).toBe(18);
    expect(highQuality?.videoBitrate).toBe('20M');

    const webQuality = renderer.getQuality('web');
    expect(webQuality?.options).toContain('-movflags');
    expect(webQuality?.options).toContain('+faststart');

    const mobileQuality = renderer.getQuality('mobile');
    expect(mobileQuality?.crf).toBe(30);
    expect(mobileQuality?.sizeMultiplier).toBe(0.3);
  });

  test('should create custom resolution', () => {
    const renderer = new MultiResolutionRenderer();
    
    const customRes = renderer.createCustomResolution('Custom HD', 1600, 900, 'Custom 16:9');
    
    expect(customRes.name).toBe('Custom HD');
    expect(customRes.width).toBe(1600);
    expect(customRes.height).toBe(900);
    expect(customRes.aspectRatio).toBe('16:9');
    expect(customRes.description).toBe('Custom 16:9');
  });

  test('should create custom quality preset', () => {
    const renderer = new MultiResolutionRenderer();
    
    const customQuality = renderer.createCustomQuality(
      'Custom High',
      20,
      ['-preset', 'slower'],
      { video: '15M', audio: '192k' }
    );
    
    expect(customQuality.name).toBe('Custom High');
    expect(customQuality.crf).toBe(20);
    expect(customQuality.videoBitrate).toBe('15M');
    expect(customQuality.audioBitrate).toBe('192k');
  });

  test('should get platform optimizations', () => {
    const renderer = new MultiResolutionRenderer();
    
    const youtube = renderer.getPlatformOptimization('youtube');
    expect(youtube?.platform).toBe('YouTube');
    expect(youtube?.videoCodec).toBe('libx264');
    expect(youtube?.frameRate).toContain(30);

    const instagram = renderer.getPlatformOptimization('instagram');
    expect(instagram?.maxDuration).toBe(10 * 60); // 10 minutes
    
    const tiktok = renderer.getPlatformOptimization('tiktok');
    expect(tiktok?.maxFileSize).toBe(287 * 1024 * 1024); // 287MB
  });

  test('should get recommended resolutions for platform', () => {
    const renderer = new MultiResolutionRenderer();
    
    const youtubeRes = renderer.getRecommendedResolutions('youtube');
    expect(youtubeRes.length).toBeGreaterThan(0);
    expect(youtubeRes.some(r => r.name === '4K')).toBe(true);
    expect(youtubeRes.some(r => r.name === '1080p')).toBe(true);

    const tiktokRes = renderer.getRecommendedResolutions('tiktok');
    expect(tiktokRes.some(r => r.aspectRatio === '9:16')).toBe(true);
  });

  test('should validate render configuration', () => {
    const renderer = new MultiResolutionRenderer();
    
    const resolution = renderer.getResolution('1080p')!;
    const quality = renderer.getQuality('high')!;
    
    const validation = renderer.validateRenderConfig(resolution, quality, 'youtube');
    
    expect(validation.valid).toBe(true);
    expect(validation.errors).toHaveLength(0);
    
    // Test with unsupported resolution
    const tinyRes = renderer.createCustomResolution('Tiny', 100, 100);
    const invalidValidation = renderer.validateRenderConfig(tinyRes, quality);
    
    expect(invalidValidation.valid).toBe(false);
    expect(invalidValidation.errors.length).toBeGreaterThan(0);
  });

  test('should estimate file size', () => {
    const renderer = new MultiResolutionRenderer();
    
    const resolution1080p = renderer.getResolution('1080p')!;
    const resolution4K = renderer.getResolution('4K')!;
    const highQuality = renderer.getQuality('high')!;
    const lowQuality = renderer.getQuality('low')!;
    
    const size1080pHigh = renderer.estimateFileSize(60, resolution1080p, highQuality);
    const size4KHigh = renderer.estimateFileSize(60, resolution4K, highQuality);
    const size1080pLow = renderer.estimateFileSize(60, resolution1080p, lowQuality);
    
    expect(size4KHigh).toBeGreaterThan(size1080pHigh); // 4K > 1080p
    expect(size1080pHigh).toBeGreaterThan(size1080pLow); // High > Low quality
  });

  test('should create batch render configuration', () => {
    const renderer = new MultiResolutionRenderer();
    
    const config = {
      baseFilename: 'test-video',
      resolutions: [
        renderer.getResolution('4K')!,
        renderer.getResolution('1080p')!,
        renderer.getResolution('720p')!
      ],
      qualities: [
        renderer.getQuality('high')!,
        renderer.getQuality('medium')!
      ],
      platforms: ['youtube', 'instagram'],
      generateThumbnails: true,
      thumbnailTimes: [0, 30, 60],
      maxConcurrent: 2,
      onProgress: (progress) => {
        console.log(`Batch render progress: ${progress.progressPercent}%`);
      }
    };
    
    expect(config.resolutions).toHaveLength(3);
    expect(config.qualities).toHaveLength(2);
    expect(config.platforms).toContain('youtube');
    expect(config.generateThumbnails).toBe(true);
  });
});

describe('🔄 INTEGRATION TESTS', () => {
  test('should integrate timeline with transition engine', () => {
    const timeline = new Timeline();
    const engine = new TransitionEngine();
    
    // Add multiple videos
    const timelineWithVideos = timeline
      .addVideo('clip1.mp4', { duration: 5 })
      .addVideo('clip2.mp4', { startTime: 4, duration: 5 })
      .addVideo('clip3.mp4', { startTime: 8, duration: 5 });
    
    const layers = timelineWithVideos.toJSON().layers;
    const videoLayers = layers.filter(l => l.type === 'video');
    
    // Generate transitions
    const transitions = engine.autoGenerateTransitions(videoLayers, {
      type: 'fade',
      duration: 1.0
    });
    
    expect(transitions).toHaveLength(2); // 3 videos = 2 transitions
    expect(engine.buildFilterComplex()).toContain('xfade');
  });

  test('should integrate timeline with multi-caption engine', () => {
    const timeline = new Timeline();
    const captionEngine = new MultiCaptionEngine();
    
    // Create timeline with video
    const timelineWithVideo = timeline.addVideo('presentation.mp4', { duration: 60 });
    
    // Add multiple language tracks
    const enTrack = captionEngine.createTrack('en', 'English');
    const esTrack = captionEngine.createTrack('es', 'Spanish');
    
    // Add synchronized captions
    const captions = [
      { en: 'Welcome to our presentation', es: 'Bienvenidos a nuestra presentación' },
      { en: 'Today we will discuss', es: 'Hoy discutiremos' },
      { en: 'Advanced video techniques', es: 'Técnicas avanzadas de video' }
    ];
    
    captions.forEach((caption, index) => {
      const startTime = index * 3;
      captionEngine.addCaption(enTrack.id, caption.en, startTime, startTime + 2.5);
      captionEngine.addCaption(esTrack.id, caption.es, startTime, startTime + 2.5);
    });
    
    const enFilters = captionEngine.generateFilters(['en']);
    const esFilters = captionEngine.generateFilters(['es']);
    
    expect(enFilters).toContain('Welcome to our presentation');
    expect(esFilters).toContain('Bienvenidos a nuestra presentación');
  });

  test('should create complex composition with all features', () => {
    const timeline = new Timeline();
    const transitionEngine = new TransitionEngine();
    const captionEngine = new MultiCaptionEngine();
    const renderer = new MultiResolutionRenderer();
    
    // Build complex timeline
    const complexTimeline = timeline
      .addVideo('intro.mp4', { duration: 5 })
      .addVideo('main.mp4', { startTime: 4, duration: 10 })
      .addVideo('outro.mp4', { startTime: 13, duration: 5 })
      .addImage('logo.png', { startTime: 0, duration: 18, position: 'top-right' });
    
    const layers = complexTimeline.toJSON().layers;
    const videoLayers = layers.filter(l => l.type === 'video');
    
    // Add transitions
    transitionEngine.autoGenerateTransitions(videoLayers, {
      type: 'fade',
      duration: 1.0
    });
    
    // Add captions
    const track = captionEngine.createTrack('en', 'English');
    captionEngine.addCaptionSequence(track.id, [
      'Introduction',
      'Main Content',
      'Conclusion'
    ], 1, { duration: 3, spacing: 5 });
    
    // Validate for multiple platforms
    const youtubeValidation = renderer.validateRenderConfig(
      renderer.getResolution('1080p')!,
      renderer.getQuality('high')!,
      'youtube'
    );
    
    const tiktokValidation = renderer.validateRenderConfig(
      renderer.getResolution('tiktok')!,
      renderer.getQuality('medium')!,
      'tiktok'
    );
    
    expect(youtubeValidation.valid).toBe(true);
    expect(tiktokValidation.valid).toBe(true);
    expect(transitionEngine.getTransitions()).toHaveLength(2);
    expect(captionEngine.getStatistics().totalCaptions).toBe(3);
  });

  test('should handle timeline with word highlighting and transitions', () => {
    const timeline = new Timeline();
    const transitionEngine = new TransitionEngine();
    
    // Create slideshow with word highlighting
    const slideshowTimeline = timeline
      .addImage('slide1.jpg', { duration: 4 })
      .addImage('slide2.jpg', { startTime: 3, duration: 4 })
      .addImage('slide3.jpg', { startTime: 6, duration: 4 })
      .addWordHighlighting({
        text: 'Amazing slideshow presentation with smooth transitions',
        startDelay: 0.5,
        wordDuration: 0.4,
        preset: 'professional'
      });
    
    const layers = slideshowTimeline.toJSON().layers;
    const imageLayers = layers.filter(l => l.type === 'image');
    
    // Add slide transitions
    transitionEngine.autoGenerateTransitions(imageLayers, {
      type: 'slide',
      duration: 1.0,
      direction: 'right'
    });
    
    expect(imageLayers).toHaveLength(3);
    expect(transitionEngine.getTransitions()).toHaveLength(2);
    expect(layers.filter(l => l.type === 'text').length).toBeGreaterThan(5); // Word highlighting creates multiple text layers
  });
});
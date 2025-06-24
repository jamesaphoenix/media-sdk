import { describe, test, expect, beforeAll, afterAll } from 'bun:test';
import { Timeline } from '../../../packages/media-sdk/src/timeline/timeline.js';
import { MediaAnalysisService } from '../../../packages/media-sdk/src/services/media-analysis.js';
import { EnhancedBunCassetteManager } from '../src/enhanced-bun-cassette-manager.js';
import { RuntimeValidator } from '../src/runtime-validator.js';
import * as fs from 'fs/promises';
import * as path from 'path';

describe('🎯 Eval System - Real Media Analysis with Cassettes', () => {
  let cassetteManager: EnhancedBunCassetteManager;
  let analysisService: MediaAnalysisService;
  let runtimeValidator: RuntimeValidator;
  const outputDir = 'test-outputs/eval-analysis';
  const assetsDir = 'test-assets/eval';
  
  // Test file paths
  const videoOutput = path.join(outputDir, 'test-video.mp4');
  const audioOutput = path.join(outputDir, 'test-audio.mp3');
  const imageOutput = path.join(outputDir, 'test-image.png');

  beforeAll(async () => {
    // Create directories
    await fs.mkdir(outputDir, { recursive: true });
    await fs.mkdir(assetsDir, { recursive: true });
    
    // Initialize services
    cassetteManager = new EnhancedBunCassetteManager('cassettes/eval-analysis');
    analysisService = new MediaAnalysisService(process.env.GEMINI_API_KEY || 'test-key');
    runtimeValidator = new RuntimeValidator(process.env.GEMINI_API_KEY || 'test-key');
    
    // Download test media files using cassettes
    console.log('📥 Downloading test media files...');
    
    // Download a short video clip
    const videoDownload = `curl -L "https://www.w3schools.com/html/mov_bbb.mp4" -o "${path.join(assetsDir, 'sample-video.mp4')}"`;
    await cassetteManager.executeCommand(videoDownload, 'download-video');
    
    // Download a short audio clip
    const audioDownload = `curl -L "https://www.w3schools.com/html/horse.mp3" -o "${path.join(assetsDir, 'sample-audio.mp3')}"`;
    await cassetteManager.executeCommand(audioDownload, 'download-audio');
    
    // Download a test image
    const imageDownload = `curl -L "https://www.w3schools.com/html/img_girl.jpg" -o "${path.join(assetsDir, 'sample-image.jpg')}"`;
    await cassetteManager.executeCommand(imageDownload, 'download-image');
  });

  afterAll(async () => {
    // Cleanup
    console.log('🧹 Cleaning up test files...');
    try {
      await fs.rm(outputDir, { recursive: true, force: true });
      await fs.rm(assetsDir, { recursive: true, force: true });
    } catch (error) {
      // Ignore cleanup errors
    }
  });

  test('should create and evaluate a video with the eval system', async () => {
    console.log('🎬 Creating video with Timeline...');
    
    // Create a video with text overlay
    const timeline = new Timeline()
      .addVideo(path.join(assetsDir, 'sample-video.mp4'))
      .addText('Media SDK Eval Test', {
        position: { x: '50%', y: '20%' },
        style: {
          fontSize: 48,
          color: '#ffffff',
          fontFamily: 'Arial',
          textAlign: 'center',
          backgroundColor: 'rgba(0,0,0,0.7)',
          padding: 20
        },
        duration: 5
      })
      .addCaptions([
        { text: 'Testing the eval system', start: 0, end: 2 },
        { text: 'With real media files', start: 2, end: 4 },
        { text: 'And cassette recordings', start: 4, end: 6 }
      ]);

    // Render with cassette
    const command = timeline.getCommand(videoOutput);
    const renderResult = await cassetteManager.executeCommand(command, 'render-eval-video');
    
    expect(renderResult.code).toBe(0);
    
    // Verify file exists
    const videoStats = await fs.stat(videoOutput);
    expect(videoStats.size).toBeGreaterThan(0);
    
    // Evaluate with the analysis service
    console.log('📊 Evaluating video quality...');
    const evaluation = await analysisService.analyzeMedia(videoOutput, {
      platform: 'youtube',
      analysisTypes: ['quality', 'content', 'accessibility', 'platform']
    });
    
    // Verify evaluation results
    expect(evaluation.mediaType).toBe('video');
    expect(evaluation.video).toBeDefined();
    expect(evaluation.video!.quality.score).toBeGreaterThan(0.5);
    expect(evaluation.accessibility.requiresCaptions).toBe(true);
    expect(evaluation.platformOptimization.platform).toBe('youtube');
    
    // Check for improvement suggestions
    if (evaluation.editingSuggestions.length > 0) {
      console.log('💡 Eval suggestions:', evaluation.editingSuggestions.map(s => s.description));
    }
  });

  test('should create and evaluate audio with the eval system', async () => {
    console.log('🎵 Creating audio mix...');
    
    // Create an audio mix
    const timeline = new Timeline()
      .addAudio(path.join(assetsDir, 'sample-audio.mp3'), {
        volume: 0.8,
        fadeIn: 0.5,
        fadeOut: 0.5
      });

    // Add a simple filter to test audio processing
    const command = timeline.getCommand(audioOutput) + ' -af "aecho=0.8:0.9:40:0.5"';
    const renderResult = await cassetteManager.executeCommand(command, 'render-eval-audio');
    
    expect(renderResult.code).toBe(0);
    
    // Verify file exists
    const audioStats = await fs.stat(audioOutput);
    expect(audioStats.size).toBeGreaterThan(0);
    
    // Evaluate audio
    console.log('🎧 Evaluating audio quality...');
    const evaluation = await analysisService.analyzeMedia(audioOutput, {
      analysisTypes: ['transcription', 'quality', 'soundscape']
    });
    
    expect(evaluation.mediaType).toBe('audio');
    expect(evaluation.audio).toBeDefined();
    expect(evaluation.audio!.quality).toBeDefined();
    expect(evaluation.audio!.transcription).toBeDefined();
  });

  test('should extract and evaluate image frame with the eval system', async () => {
    console.log('📸 Extracting video frame...');
    
    // Extract a frame from the video at 2 seconds
    const extractCommand = `ffmpeg -ss 2 -i "${path.join(assetsDir, 'sample-video.mp4')}" -vframes 1 -q:v 2 "${imageOutput}"`;
    const extractResult = await cassetteManager.executeCommand(extractCommand, 'extract-eval-frame');
    
    expect(extractResult.code).toBe(0);
    
    // Verify file exists
    const imageStats = await fs.stat(imageOutput);
    expect(imageStats.size).toBeGreaterThan(0);
    
    // Evaluate image
    console.log('🖼️ Evaluating image composition...');
    const evaluation = await analysisService.analyzeMedia(imageOutput, {
      platform: 'instagram',
      analysisTypes: ['composition', 'quality', 'aesthetic', 'objects']
    });
    
    expect(evaluation.mediaType).toBe('image');
    expect(evaluation.image).toBeDefined();
    expect(evaluation.image!.composition).toBeDefined();
    expect(evaluation.image!.quality).toBeDefined();
    expect(evaluation.platformOptimization.platform).toBe('instagram');
  });

  test('should integrate with RuntimeValidator for complete evaluation', async () => {
    console.log('🔄 Testing full eval pipeline integration...');
    
    // Create a complex timeline
    const timeline = new Timeline()
      .addVideo(path.join(assetsDir, 'sample-video.mp4'))
      .setAspectRatio('16:9')
      .addWordHighlighting({
        text: 'Eval system test',
        words: [
          { word: 'Eval', start: 0, end: 1 },
          { word: 'system', start: 1, end: 2 },
          { word: 'test', start: 2, end: 3 }
        ],
        preset: 'karaoke',
        baseStyle: { fontSize: 60, color: '#ffffff' },
        highlightStyle: { color: '#ff0066', scale: 1.2 }
      });

    const testOutput = path.join(outputDir, 'runtime-validation-test.mp4');
    const command = timeline.getCommand(testOutput);
    
    // Render with cassette
    await cassetteManager.executeCommand(command, 'render-runtime-validation');
    
    // Use RuntimeValidator for comprehensive validation
    const validation = await runtimeValidator.validateRender(
      testOutput,
      'youtube',
      { command, timeline },
      ['Eval', 'system', 'test'],
      [command]
    );
    
    // Verify complete validation
    expect(validation.isValid).toBe(true);
    expect(validation.checks.fileExists).toBe(true);
    expect(validation.checks.hasValidMetadata).toBe(true);
    expect(validation.metadata).toBeDefined();
    
    // Also analyze with MediaAnalysisService
    const analysis = await analysisService.analyzeMedia(testOutput, {
      platform: 'youtube',
      analysisTypes: ['quality', 'content', 'timing']
    });
    
    // Cross-verify results
    expect(analysis.video).toBeDefined();
    expect(analysis.platformOptimization.isOptimized).toBe(true);
    
    console.log('✅ Eval system validation complete');
    console.log(`  - Quality score: ${analysis.video!.quality.score}`);
    console.log(`  - Platform optimized: ${analysis.platformOptimization.isOptimized}`);
    console.log(`  - Suggestions: ${analysis.editingSuggestions.length}`);
  });

  test('should detect quality improvements through eval comparison', async () => {
    console.log('🔍 Testing quality improvement detection...');
    
    // Create low quality version
    const lowQualityTimeline = new Timeline()
      .addVideo(path.join(assetsDir, 'sample-video.mp4'))
      .addText('Low Quality', {
        position: { x: '50%', y: '50%' },
        style: { fontSize: 12, color: '#808080' } // Small, low contrast
      });

    // Create high quality version
    const highQualityTimeline = new Timeline()
      .addVideo(path.join(assetsDir, 'sample-video.mp4'))
      .addText('High Quality', {
        position: { x: '50%', y: '50%' },
        style: { 
          fontSize: 72, 
          color: '#ffffff',
          stroke: '#000000',
          strokeWidth: 4,
          shadow: { offsetX: 2, offsetY: 2, blur: 4, color: '#000000' }
        }
      })
      .addFilter('eq', { brightness: 0.1, contrast: 1.1 });

    const lowQualityOutput = path.join(outputDir, 'low-quality.mp4');
    const highQualityOutput = path.join(outputDir, 'high-quality.mp4');

    // Render both versions
    await cassetteManager.executeCommand(
      lowQualityTimeline.getCommand(lowQualityOutput),
      'render-low-quality'
    );
    await cassetteManager.executeCommand(
      highQualityTimeline.getCommand(highQualityOutput),
      'render-high-quality'
    );

    // Evaluate both
    const [lowEval, highEval] = await Promise.all([
      analysisService.analyzeMedia(lowQualityOutput, { analysisTypes: ['quality', 'accessibility'] }),
      analysisService.analyzeMedia(highQualityOutput, { analysisTypes: ['quality', 'accessibility'] })
    ]);

    // Verify quality improvement detected
    expect(highEval.video!.quality.score).toBeGreaterThan(lowEval.video!.quality.score);
    expect(highEval.accessibility.readabilityScore).toBeGreaterThan(
      lowEval.accessibility.readabilityScore
    );
    
    console.log('📈 Quality improvement detected:');
    console.log(`  - Low quality score: ${lowEval.video!.quality.score}`);
    console.log(`  - High quality score: ${highEval.video!.quality.score}`);
    console.log(`  - Improvement: ${((highEval.video!.quality.score - lowEval.video!.quality.score) * 100).toFixed(1)}%`);
  });
});
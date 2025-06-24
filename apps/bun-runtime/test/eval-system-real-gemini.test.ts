import { describe, test, expect, beforeAll, afterAll } from 'bun:test';
import { Timeline } from '../../../packages/media-sdk/src/timeline/timeline.js';
import { MediaAnalysisService } from '../../../packages/media-sdk/src/services/media-analysis.js';
import { EnhancedBunCassetteManager } from '../src/enhanced-cassette-manager.ts';
import { RuntimeValidator } from '../src/runtime-validator.ts';
import * as fs from 'fs/promises';
import * as path from 'path';

// Only run these tests if GEMINI_API_KEY is set
const SHOULD_RUN = !!process.env.GEMINI_API_KEY;

describe.skipIf(!SHOULD_RUN)('🎯 Eval System - Real Gemini API Testing', () => {
  let cassetteManager: EnhancedBunCassetteManager;
  let analysisService: MediaAnalysisService;
  let runtimeValidator: RuntimeValidator;
  const outputDir = 'test-outputs/eval-gemini';
  const assetsDir = 'test-assets/eval-gemini';
  
  beforeAll(async () => {
    if (!SHOULD_RUN) return;
    
    // Create directories
    await fs.mkdir(outputDir, { recursive: true });
    await fs.mkdir(assetsDir, { recursive: true });
    
    // Initialize services with REAL Gemini API
    cassetteManager = new EnhancedBunCassetteManager('eval-gemini');
    analysisService = new MediaAnalysisService(process.env.GEMINI_API_KEY!);
    runtimeValidator = new RuntimeValidator(process.env.GEMINI_API_KEY!);
    
    console.log('🚀 Initializing real Gemini API eval system tests...');
    
    // Download real test media files
    console.log('📥 Downloading test media files...');
    
    // Short video for testing
    const videoUrl = 'https://sample-videos.com/video321/mp4/720/big_buck_bunny_720p_1mb.mp4';
    const videoDownload = `curl -L "${videoUrl}" -o "${path.join(assetsDir, 'test-video.mp4')}"`;
    await cassetteManager.executeCommand(videoDownload, 'download-eval-video');
    
    // Audio sample
    const audioUrl = 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3';
    const audioDownload = `curl -L "${audioUrl}" -o "${path.join(assetsDir, 'test-audio.mp3')}" --max-time 30`;
    await cassetteManager.executeCommand(audioDownload, 'download-eval-audio');
    
    // Test image
    const imageUrl = 'https://picsum.photos/1920/1080';
    const imageDownload = `curl -L "${imageUrl}" -o "${path.join(assetsDir, 'test-image.jpg')}"`;
    await cassetteManager.executeCommand(imageDownload, 'download-eval-image');
  });

  afterAll(async () => {
    if (!SHOULD_RUN) return;
    
    console.log('🧹 Cleaning up test files...');
    try {
      await fs.rm(outputDir, { recursive: true, force: true });
      await fs.rm(assetsDir, { recursive: true, force: true });
    } catch (error) {
      console.error('Cleanup error:', error);
    }
  });

  test('should analyze real video with Gemini API', async () => {
    console.log('\n📹 Testing real video analysis with Gemini...');
    
    // Create a video with text overlay using Timeline
    const timeline = new Timeline()
      .addVideo(path.join(assetsDir, 'test-video.mp4'))
      .setDuration(5) // Limit to 5 seconds for API testing
      .addText('Gemini Eval Test', {
        position: { x: '50%', y: '30%' },
        style: {
          fontSize: 72,
          color: '#ffffff',
          fontFamily: 'Arial',
          stroke: '#000000',
          strokeWidth: 3
        },
        duration: 5
      })
      .addCaptions([
        { text: 'Testing real Gemini API', start: 0, end: 2 },
        { text: 'For media evaluation', start: 2, end: 4 },
        { text: 'With actual AI analysis', start: 4, end: 5 }
      ]);

    const videoOutput = path.join(outputDir, 'gemini-test-video.mp4');
    const command = timeline.getCommand(videoOutput);
    
    // Render the video
    console.log('🎬 Rendering video...');
    const renderResult = await cassetteManager.executeCommand(command, 'render-gemini-video');
    expect(renderResult.code).toBe(0);
    
    // Analyze with real Gemini API
    console.log('🤖 Analyzing with Gemini API...');
    const startTime = Date.now();
    
    const analysis = await analysisService.analyzeMedia(videoOutput, {
      platform: 'youtube',
      analysisTypes: ['quality', 'content', 'accessibility', 'platform'],
      analysisDepth: 'comprehensive'
    });
    
    const analysisTime = Date.now() - startTime;
    console.log(`⏱️ Analysis completed in ${analysisTime}ms`);
    
    // Verify real API response
    expect(analysis.mediaType).toBe('video');
    expect(analysis.video).toBeDefined();
    expect(analysis.video!.description).toBeTruthy();
    expect(analysis.video!.quality.score).toBeGreaterThan(0);
    expect(analysis.metadata.modelUsed).toContain('gemini');
    expect(analysis.metadata.tokensUsed).toBeGreaterThan(0);
    
    // Log actual AI insights
    console.log('\n📊 Gemini Analysis Results:');
    console.log(`  - Description: ${analysis.video!.description.substring(0, 100)}...`);
    console.log(`  - Quality Score: ${analysis.video!.quality.score}`);
    console.log(`  - Key Elements: ${analysis.primary.keyElements.slice(0, 3).join(', ')}`);
    console.log(`  - Platform Optimized: ${analysis.platformOptimization.isOptimized}`);
    console.log(`  - Suggestions: ${analysis.editingSuggestions.length} found`);
    
    if (analysis.editingSuggestions.length > 0) {
      console.log('\n💡 Top Suggestions:');
      analysis.editingSuggestions.slice(0, 3).forEach((s, i) => {
        console.log(`  ${i + 1}. ${s.description} (${s.priority})`);
      });
    }
  });

  test('should analyze real audio with Gemini API', async () => {
    console.log('\n🎵 Testing real audio analysis with Gemini...');
    
    // Create a short audio clip with effects
    const timeline = new Timeline()
      .addAudio(path.join(assetsDir, 'test-audio.mp3'), {
        volume: 0.8,
        fadeIn: 1,
        fadeOut: 1,
        trim: { start: 0, end: 10 } // Only 10 seconds for API testing
      });

    const audioOutput = path.join(outputDir, 'gemini-test-audio.mp3');
    const command = timeline.getCommand(audioOutput);
    
    // Render the audio
    console.log('🎧 Rendering audio...');
    const renderResult = await cassetteManager.executeCommand(command, 'render-gemini-audio');
    expect(renderResult.code).toBe(0);
    
    // Analyze with real Gemini API
    console.log('🤖 Analyzing audio with Gemini API...');
    const analysis = await analysisService.analyzeMedia(audioOutput, {
      analysisTypes: ['transcription', 'quality', 'soundscape']
    });
    
    expect(analysis.mediaType).toBe('audio');
    expect(analysis.audio).toBeDefined();
    expect(analysis.audio!.transcription).toBeDefined();
    expect(analysis.audio!.quality).toBeDefined();
    expect(analysis.audio!.soundscape).toBeInstanceOf(Array);
    
    console.log('\n🎧 Audio Analysis Results:');
    console.log(`  - Transcription: ${analysis.audio!.transcription.text.substring(0, 100)}...`);
    console.log(`  - Audio Quality: ${JSON.stringify(analysis.audio!.quality)}`);
    console.log(`  - Soundscape: ${analysis.audio!.soundscape.join(', ')}`);
  });

  test('should analyze real image with Gemini API', async () => {
    console.log('\n🖼️ Testing real image analysis with Gemini...');
    
    // Extract a frame from our rendered video
    const videoPath = path.join(outputDir, 'gemini-test-video.mp4');
    const imageOutput = path.join(outputDir, 'gemini-test-frame.png');
    
    const extractCommand = `ffmpeg -ss 2.5 -i "${videoPath}" -vframes 1 -q:v 2 "${imageOutput}"`;
    const extractResult = await cassetteManager.executeCommand(extractCommand, 'extract-gemini-frame');
    expect(extractResult.code).toBe(0);
    
    // Analyze with real Gemini API
    console.log('🤖 Analyzing image with Gemini API...');
    const analysis = await analysisService.analyzeMedia(imageOutput, {
      platform: 'instagram',
      analysisTypes: ['composition', 'objects', 'quality', 'aesthetic']
    });
    
    expect(analysis.mediaType).toBe('image');
    expect(analysis.image).toBeDefined();
    expect(analysis.image!.composition).toBeDefined();
    expect(analysis.image!.objects).toBeInstanceOf(Array);
    expect(analysis.image!.aestheticScore).toBeGreaterThan(0);
    
    console.log('\n🖼️ Image Analysis Results:');
    console.log(`  - Composition: ${analysis.image!.composition.balance}`);
    console.log(`  - Objects Detected: ${analysis.image!.objects.slice(0, 5).join(', ')}`);
    console.log(`  - Aesthetic Score: ${analysis.image!.aestheticScore}`);
    console.log(`  - Instagram Optimized: ${analysis.platformOptimization.isOptimized}`);
  });

  test('should use RuntimeValidator with real Gemini for comprehensive evaluation', async () => {
    console.log('\n🔄 Testing complete eval pipeline with real Gemini...');
    
    // Create a complex timeline to test comprehensive evaluation
    const timeline = new Timeline()
      .addVideo(path.join(assetsDir, 'test-video.mp4'))
      .setDuration(8)
      .setAspectRatio('16:9')
      .addWordHighlighting({
        text: 'Real Gemini API Test',
        words: [
          { word: 'Real', start: 0, end: 1.5 },
          { word: 'Gemini', start: 1.5, end: 3 },
          { word: 'API', start: 3, end: 4.5 },
          { word: 'Test', start: 4.5, end: 6 }
        ],
        preset: 'karaoke',
        baseStyle: { fontSize: 80, color: '#ffffff' },
        highlightStyle: { color: '#ff0066', scale: 1.3 }
      })
      .addCaptions([
        { text: 'Testing the complete eval system', start: 0, end: 3 },
        { text: 'With real Gemini Vision API', start: 3, end: 6 },
        { text: 'For production-ready evaluation', start: 6, end: 8 }
      ]);

    const complexOutput = path.join(outputDir, 'gemini-complex-test.mp4');
    const command = timeline.getCommand(complexOutput);
    
    // Render
    console.log('🎬 Rendering complex video...');
    await cassetteManager.executeCommand(command, 'render-gemini-complex');
    
    // Use RuntimeValidator for complete validation
    console.log('🤖 Running comprehensive validation with real Gemini...');
    const validation = await runtimeValidator.validateRender(
      complexOutput,
      'youtube',
      { command, timeline },
      ['Real', 'Gemini', 'API', 'Test'], // Expected text
      [command]
    );
    
    expect(validation.isValid).toBe(true);
    expect(validation.qualityScore).toBeGreaterThan(0.7);
    expect(validation.platformCompliance).toBeDefined();
    expect(validation.platformCompliance.isCompliant).toBe(true);
    
    // Also get detailed analysis
    const detailedAnalysis = await analysisService.analyzeMedia(complexOutput, {
      platform: 'youtube',
      analysisTypes: ['quality', 'content', 'timing', 'accessibility'],
      analysisDepth: 'comprehensive'
    });
    
    console.log('\n✨ Complete Eval Results:');
    console.log(`  - Validation: ${validation.isValid ? '✅ PASSED' : '❌ FAILED'}`);
    console.log(`  - Quality Score: ${validation.qualityScore}`);
    console.log(`  - Text Detection: ${validation.textDetection?.detectedText.join(', ')}`);
    console.log(`  - Platform Compliance: ${validation.platformCompliance.isCompliant ? '✅' : '❌'}`);
    console.log(`  - Accessibility Score: ${detailedAnalysis.accessibility.readabilityScore}`);
    console.log(`  - Tokens Used: ${detailedAnalysis.metadata.tokensUsed}`);
    
    // Log any optimization suggestions from real AI
    if (validation.suggestions && validation.suggestions.length > 0) {
      console.log('\n🔧 AI-Powered Optimization Suggestions:');
      validation.suggestions.forEach((s, i) => {
        console.log(`  ${i + 1}. ${s}`);
      });
    }
  });

  test('should detect quality differences with real Gemini evaluation', async () => {
    console.log('\n🔍 Testing quality comparison with real Gemini...');
    
    // Create two versions - low and high quality
    const baseVideo = path.join(assetsDir, 'test-video.mp4');
    
    // Low quality version
    const lowQualityTimeline = new Timeline()
      .addVideo(baseVideo)
      .setDuration(5)
      .addText('Low Quality Test', {
        position: { x: '10%', y: '90%' },
        style: { 
          fontSize: 16, 
          color: '#cccccc',
          fontFamily: 'Arial'
        }
      });

    // High quality version
    const highQualityTimeline = new Timeline()
      .addVideo(baseVideo)
      .setDuration(5)
      .addText('High Quality Test', {
        position: { x: '50%', y: '50%' },
        style: { 
          fontSize: 96, 
          color: '#ffffff',
          fontFamily: 'Arial',
          stroke: '#000000',
          strokeWidth: 4,
          shadow: { 
            offsetX: 3, 
            offsetY: 3, 
            blur: 5, 
            color: 'rgba(0,0,0,0.8)' 
          }
        }
      })
      .addFilter('eq', { brightness: 0.05, contrast: 1.1, saturation: 1.1 });

    const lowOutput = path.join(outputDir, 'gemini-low-quality.mp4');
    const highOutput = path.join(outputDir, 'gemini-high-quality.mp4');

    // Render both
    console.log('🎬 Rendering quality comparison videos...');
    await Promise.all([
      cassetteManager.executeCommand(lowQualityTimeline.getCommand(lowOutput), 'render-low-q'),
      cassetteManager.executeCommand(highQualityTimeline.getCommand(highOutput), 'render-high-q')
    ]);

    // Analyze both with real Gemini
    console.log('🤖 Analyzing quality differences with Gemini...');
    const [lowAnalysis, highAnalysis] = await Promise.all([
      analysisService.analyzeMedia(lowOutput, { 
        analysisTypes: ['quality', 'accessibility'],
        analysisDepth: 'comprehensive'
      }),
      analysisService.analyzeMedia(highOutput, { 
        analysisTypes: ['quality', 'accessibility'],
        analysisDepth: 'comprehensive'
      })
    ]);

    // Verify Gemini detects quality difference
    expect(highAnalysis.video!.quality.score).toBeGreaterThan(lowAnalysis.video!.quality.score);
    expect(highAnalysis.accessibility.readabilityScore).toBeGreaterThan(
      lowAnalysis.accessibility.readabilityScore
    );

    console.log('\n📊 Real Gemini Quality Comparison:');
    console.log('Low Quality Version:');
    console.log(`  - Quality Score: ${lowAnalysis.video!.quality.score}`);
    console.log(`  - Readability: ${lowAnalysis.accessibility.readabilityScore}`);
    console.log(`  - Issues: ${lowAnalysis.editingSuggestions.length}`);
    
    console.log('\nHigh Quality Version:');
    console.log(`  - Quality Score: ${highAnalysis.video!.quality.score}`);
    console.log(`  - Readability: ${highAnalysis.accessibility.readabilityScore}`);
    console.log(`  - Issues: ${highAnalysis.editingSuggestions.length}`);
    
    const improvement = (
      (highAnalysis.video!.quality.score - lowAnalysis.video!.quality.score) / 
      lowAnalysis.video!.quality.score * 100
    ).toFixed(1);
    
    console.log(`\n✨ Quality Improvement Detected: +${improvement}%`);
  });
});
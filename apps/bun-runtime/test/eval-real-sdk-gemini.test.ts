import { describe, test, expect, beforeAll, afterAll } from 'bun:test';
import { Timeline } from '../../../packages/media-sdk/src/timeline/timeline.js';
import { MediaAnalysisService } from '../../../packages/media-sdk/src/services/media-analysis.js';
import { EnhancedBunCassetteManager } from '../src/enhanced-cassette-manager.ts';
import * as fs from 'fs/promises';
import * as path from 'path';

// Only run if GEMINI_API_KEY is set
const SHOULD_RUN = !!process.env.GEMINI_API_KEY;

describe.skipIf(!SHOULD_RUN)('🚀 Real SDK + Real Gemini API Integration', () => {
  let cassetteManager: EnhancedBunCassetteManager;
  let analysisService: MediaAnalysisService;
  const outputDir = 'test-outputs/real-sdk-gemini';
  const assetsDir = 'test-assets/real-sdk';

  beforeAll(async () => {
    if (!SHOULD_RUN) return;
    
    console.log('🚀 Setting up real SDK + Gemini API tests...');
    
    // Create directories
    await fs.mkdir(outputDir, { recursive: true });
    await fs.mkdir(assetsDir, { recursive: true });
    
    // Initialize services
    cassetteManager = new EnhancedBunCassetteManager('real-sdk-gemini');
    analysisService = new MediaAnalysisService(process.env.GEMINI_API_KEY!);
    
    // Create some basic test assets using FFmpeg
    console.log('📦 Creating test assets...');
    
    // 1. Create a simple test video with color bars and tone
    const createTestVideo = `ffmpeg -f lavfi -i testsrc2=size=1280x720:rate=30:duration=5 -f lavfi -i sine=frequency=1000:duration=5 -c:v libx264 -preset ultrafast -c:a aac -y "${path.join(assetsDir, 'test-input.mp4')}"`;
    await cassetteManager.executeCommand(createTestVideo, 'create-test-video');
    
    // 2. Create a test audio file (sine wave)
    const createTestAudio = `ffmpeg -f lavfi -i sine=frequency=440:duration=3 -c:a libmp3lame -b:a 192k -y "${path.join(assetsDir, 'test-input.mp3')}"`;
    await cassetteManager.executeCommand(createTestAudio, 'create-test-audio');
    
    // 3. Create a test image
    const createTestImage = `ffmpeg -f lavfi -i testsrc2=size=1920x1080:duration=1 -frames:v 1 -y "${path.join(assetsDir, 'test-input.jpg')}"`;
    await cassetteManager.executeCommand(createTestImage, 'create-test-image');
    
    console.log('✅ Test assets created');
  });

  afterAll(async () => {
    if (!SHOULD_RUN) return;
    
    console.log('🧹 Cleaning up...');
    try {
      await fs.rm(outputDir, { recursive: true, force: true });
      await fs.rm(assetsDir, { recursive: true, force: true });
    } catch (error) {
      console.error('Cleanup error:', error);
    }
  });

  test('should create and analyze a real video using Timeline + Gemini', async () => {
    console.log('\n🎬 TEST 1: Real Video Creation and Analysis');
    
    // Step 1: Create a video using Timeline
    console.log('📹 Creating video with Timeline...');
    const timeline = new Timeline()
      .addVideo(path.join(assetsDir, 'test-input.mp4'))
      .setDuration(3)
      .addText('Media SDK + Gemini Test', {
        position: { x: '50%', y: '30%' },
        style: {
          fontSize: 64,
          color: '#ffffff',
          fontFamily: 'Arial',
          backgroundColor: 'rgba(0,0,0,0.8)',
          padding: 20
        },
        duration: 3
      })
      .addText('Real Integration Test', {
        position: { x: '50%', y: '70%' },
        style: {
          fontSize: 36,
          color: '#00ff00',
          fontFamily: 'Arial'
        },
        duration: 3
      })
      .addFilter('curves', { preset: 'increase_contrast' });

    const videoOutput = path.join(outputDir, 'real-sdk-video.mp4');
    const command = timeline.getCommand(videoOutput);
    
    console.log('🎯 Executing FFmpeg command...');
    const renderResult = await cassetteManager.executeCommand(command, 'render-real-video');
    expect(renderResult.code).toBe(0);
    
    // Verify file exists and has content
    const videoStats = await fs.stat(videoOutput);
    console.log(`✅ Video created: ${(videoStats.size / 1024).toFixed(2)} KB`);
    expect(videoStats.size).toBeGreaterThan(10000); // At least 10KB
    
    // Step 2: Analyze with real Gemini API
    console.log('🤖 Analyzing video with Gemini API...');
    const startTime = Date.now();
    
    const analysis = await analysisService.analyzeMedia(videoOutput, {
      platform: 'youtube',
      analysisTypes: ['quality', 'content', 'accessibility'],
      analysisDepth: 'comprehensive'
    });
    
    const analysisTime = Date.now() - startTime;
    console.log(`⏱️ Analysis completed in ${analysisTime}ms`);
    
    // Verify real Gemini response
    expect(analysis.mediaType).toBe('video');
    expect(analysis.metadata.modelUsed).toContain('gemini');
    expect(analysis.metadata.tokensUsed).toBeGreaterThan(100);
    
    console.log('\n📊 Gemini Video Analysis Results:');
    console.log(`  - Quality Score: ${analysis.video?.quality.score || analysis.primary.qualityScore}`);
    console.log(`  - Resolution: ${analysis.video?.quality.resolution}`);
    console.log(`  - Duration: ${analysis.video?.technicalDetails?.duration}`);
    console.log(`  - Key Elements: ${analysis.primary.keyElements.slice(0, 3).join(', ')}`);
    
    if (analysis.editingSuggestions.length > 0) {
      console.log('\n💡 Improvement Suggestions:');
      analysis.editingSuggestions.slice(0, 3).forEach((s, i) => {
        console.log(`  ${i + 1}. ${s.description}`);
      });
    }
  });

  test('should create word highlighting video and analyze with Gemini', async () => {
    console.log('\n🎤 TEST 2: Word Highlighting Video Analysis');
    
    // Create a karaoke-style video
    const timeline = new Timeline()
      .addVideo(path.join(assetsDir, 'test-input.mp4'))
      .setDuration(5)
      .setAspectRatio('9:16') // TikTok format
      .addWordHighlighting({
        text: 'Gemini analyzes Media SDK output',
        words: [
          { word: 'Gemini', start: 0, end: 1 },
          { word: 'analyzes', start: 1, end: 2 },
          { word: 'Media', start: 2, end: 3 },
          { word: 'SDK', start: 3, end: 4 },
          { word: 'output', start: 4, end: 5 }
        ],
        preset: 'karaoke',
        baseStyle: { fontSize: 72, color: '#ffffff' },
        highlightStyle: { color: '#ff0066', scale: 1.2 }
      });

    const karaokeOutput = path.join(outputDir, 'karaoke-video.mp4');
    const command = timeline.getCommand(karaokeOutput);
    
    console.log('🎯 Rendering karaoke video...');
    await cassetteManager.executeCommand(command, 'render-karaoke');
    
    // Analyze for TikTok platform
    console.log('🤖 Analyzing karaoke video for TikTok...');
    const analysis = await analysisService.analyzeMedia(karaokeOutput, {
      platform: 'tiktok',
      analysisTypes: ['content', 'timing', 'platform']
    });
    
    console.log('\n📊 Karaoke Video Analysis:');
    console.log(`  - Platform Optimized: ${analysis.platformOptimization.isOptimized ? '✅' : '❌'}`);
    console.log(`  - Aspect Ratio: ${analysis.platformOptimization.aspectRatioMatch ? '✅ 9:16' : '❌'}`);
    console.log(`  - Detected Text: ${analysis.video?.transcription?.text || 'N/A'}`);
    
    expect(analysis.platformOptimization.platform).toBe('tiktok');
  });

  test('should create audio with effects and analyze with Gemini', async () => {
    console.log('\n🎵 TEST 3: Audio Creation and Analysis');
    
    // Create an audio mix with effects
    const timeline = new Timeline()
      .addAudio(path.join(assetsDir, 'test-input.mp3'), {
        volume: 0.7,
        fadeIn: 0.5,
        fadeOut: 0.5
      });

    const audioOutput = path.join(outputDir, 'mixed-audio.mp3');
    
    // Add echo effect
    const audioCommand = timeline.getCommand(audioOutput) + ' -af "aecho=0.8:0.9:50:0.5,volume=1.2"';
    
    console.log('🎯 Rendering audio with effects...');
    await cassetteManager.executeCommand(audioCommand, 'render-audio-effects');
    
    // Analyze audio
    console.log('🤖 Analyzing audio with Gemini...');
    const analysis = await analysisService.analyzeMedia(audioOutput, {
      analysisTypes: ['quality', 'soundscape', 'technical']
    });
    
    console.log('\n📊 Audio Analysis Results:');
    console.log(`  - Media Type: ${analysis.mediaType}`);
    console.log(`  - Audio Quality: ${JSON.stringify(analysis.audio?.quality)}`);
    console.log(`  - Duration: ${analysis.audio?.technicalDetails?.duration || 'N/A'}`);
    console.log(`  - Processing Mode: ${analysis.metadata.processingMode}`);
    
    expect(analysis.mediaType).toBe('audio');
  });

  test('should extract frame from video and analyze as image', async () => {
    console.log('\n🖼️ TEST 4: Frame Extraction and Image Analysis');
    
    // Extract a frame from our created video
    const videoPath = path.join(outputDir, 'real-sdk-video.mp4');
    const frameOutput = path.join(outputDir, 'extracted-frame.png');
    
    const extractCommand = `ffmpeg -ss 1.5 -i "${videoPath}" -vframes 1 -q:v 2 -y "${frameOutput}"`;
    
    console.log('🎯 Extracting frame...');
    await cassetteManager.executeCommand(extractCommand, 'extract-frame');
    
    // Analyze as Instagram post
    console.log('🤖 Analyzing frame for Instagram...');
    const analysis = await analysisService.analyzeMedia(frameOutput, {
      platform: 'instagram',
      analysisTypes: ['composition', 'quality', 'aesthetic', 'objects']
    });
    
    console.log('\n📊 Image Analysis Results:');
    console.log(`  - Composition: ${analysis.image?.composition.balance || 'N/A'}`);
    console.log(`  - Detected Objects: ${analysis.image?.objects?.slice(0, 5).join(', ') || 'N/A'}`);
    console.log(`  - Aesthetic Score: ${analysis.image?.aestheticScore || 'N/A'}`);
    console.log(`  - Instagram Ready: ${analysis.platformOptimization.isOptimized ? '✅' : '❌'}`);
    
    expect(analysis.mediaType).toBe('image');
  });

  test('should create complex composition and evaluate quality improvement', async () => {
    console.log('\n🎨 TEST 5: Complex Composition Quality Comparison');
    
    // Create a low quality version
    const lowQualityTimeline = new Timeline()
      .addVideo(path.join(assetsDir, 'test-input.mp4'))
      .setDuration(3)
      .addText('Low Quality', {
        position: { x: '10%', y: '90%' },
        style: { fontSize: 18, color: '#808080' }
      });

    // Create a high quality version with multiple enhancements
    const highQualityTimeline = new Timeline()
      .addVideo(path.join(assetsDir, 'test-input.mp4'))
      .setDuration(3)
      .addText('High Quality Production', {
        position: { x: '50%', y: '40%' },
        style: { 
          fontSize: 72, 
          color: '#ffffff',
          fontFamily: 'Arial',
          stroke: '#000000',
          strokeWidth: 3,
          shadow: { offsetX: 2, offsetY: 2, blur: 4, color: 'rgba(0,0,0,0.8)' }
        }
      })
      .addCaptions([
        { text: 'Professional quality video', start: 0, end: 1.5 },
        { text: 'With proper accessibility', start: 1.5, end: 3 }
      ])
      .addFilter('eq', { brightness: 0.1, contrast: 1.1, saturation: 1.1 })
      .addFilter('unsharp', { amount: 1.5 });

    const lowOutput = path.join(outputDir, 'low-quality.mp4');
    const highOutput = path.join(outputDir, 'high-quality.mp4');

    // Render both
    console.log('🎯 Rendering quality comparison videos...');
    await Promise.all([
      cassetteManager.executeCommand(lowQualityTimeline.getCommand(lowOutput), 'render-low'),
      cassetteManager.executeCommand(highQualityTimeline.getCommand(highOutput), 'render-high')
    ]);

    // Analyze both with Gemini
    console.log('🤖 Analyzing both videos with Gemini...');
    const [lowAnalysis, highAnalysis] = await Promise.all([
      analysisService.analyzeMedia(lowOutput, { 
        analysisTypes: ['quality', 'accessibility'],
        platform: 'youtube'
      }),
      analysisService.analyzeMedia(highOutput, { 
        analysisTypes: ['quality', 'accessibility'],
        platform: 'youtube'
      })
    ]);

    // Compare results
    const lowScore = lowAnalysis.video?.quality.score || lowAnalysis.primary.qualityScore;
    const highScore = highAnalysis.video?.quality.score || highAnalysis.primary.qualityScore;
    
    console.log('\n📊 Quality Comparison Results:');
    console.log('Low Quality Version:');
    console.log(`  - Quality Score: ${lowScore}`);
    console.log(`  - Accessibility: ${lowAnalysis.accessibility.readabilityScore}`);
    console.log(`  - Issues: ${lowAnalysis.editingSuggestions.length}`);
    
    console.log('\nHigh Quality Version:');
    console.log(`  - Quality Score: ${highScore}`);
    console.log(`  - Accessibility: ${highAnalysis.accessibility.readabilityScore}`);
    console.log(`  - Issues: ${highAnalysis.editingSuggestions.length}`);
    
    const improvement = ((highScore - lowScore) / lowScore * 100).toFixed(1);
    console.log(`\n✨ Quality Improvement: +${improvement}%`);
    
    // Verify Gemini detected the quality difference
    expect(highScore).toBeGreaterThan(lowScore);
    expect(highAnalysis.accessibility.readabilityScore).toBeGreaterThan(
      lowAnalysis.accessibility.readabilityScore
    );
  });

  test('should analyze multi-media project with all types', async () => {
    console.log('\n🎬 TEST 6: Multi-Media Project Analysis');
    
    // Create a complete media project
    const videoPath = path.join(outputDir, 'project-video.mp4');
    const audioPath = path.join(outputDir, 'project-audio.mp3');
    const thumbPath = path.join(outputDir, 'project-thumb.jpg');
    
    // 1. Create main video
    const videoTimeline = new Timeline()
      .addVideo(path.join(assetsDir, 'test-input.mp4'))
      .setDuration(5)
      .addText('Multi-Media Project', {
        position: { x: '50%', y: '50%' },
        style: { fontSize: 60, color: '#ffffff' }
      });
    
    await cassetteManager.executeCommand(
      videoTimeline.getCommand(videoPath),
      'create-project-video'
    );
    
    // 2. Extract audio
    const extractAudio = `ffmpeg -i "${videoPath}" -vn -c:a libmp3lame -b:a 192k -y "${audioPath}"`;
    await cassetteManager.executeCommand(extractAudio, 'extract-project-audio');
    
    // 3. Create thumbnail
    const createThumb = `ffmpeg -ss 2.5 -i "${videoPath}" -vframes 1 -vf scale=1280:720 -y "${thumbPath}"`;
    await cassetteManager.executeCommand(createThumb, 'create-project-thumb');
    
    // Analyze all together
    console.log('🤖 Analyzing complete media project...');
    const projectAnalysis = await analysisService.analyzeMultipleMedia(
      [videoPath, audioPath, thumbPath],
      { platform: 'youtube', analysisDepth: 'comprehensive' }
    );
    
    console.log('\n📊 Multi-Media Project Analysis:');
    console.log(`  - Media Type: ${projectAnalysis.mediaType}`);
    console.log(`  - Total Quality Score: ${projectAnalysis.primary.qualityScore}`);
    console.log(`  - Platform Ready: ${projectAnalysis.platformOptimization.isOptimized ? '✅' : '❌'}`);
    console.log(`  - Key Elements: ${projectAnalysis.primary.keyElements.length} identified`);
    console.log(`  - Suggestions: ${projectAnalysis.editingSuggestions.length} improvements`);
    
    expect(projectAnalysis.mediaType).toBe('mixed');
    expect(projectAnalysis.primary.keyElements.length).toBeGreaterThan(0);
  });
});
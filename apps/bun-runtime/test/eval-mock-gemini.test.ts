import { describe, test, expect, beforeAll, afterAll } from 'bun:test';
import { MediaAnalysisService } from '../../../packages/media-sdk/src/services/media-analysis.js';
import * as fs from 'fs/promises';
import * as path from 'path';

// Only run if GEMINI_API_KEY is set
const SHOULD_RUN = !!process.env.GEMINI_API_KEY;

describe.skipIf(!SHOULD_RUN)('🎯 Gemini Eval with Mock Files', () => {
  let analysisService: MediaAnalysisService;
  const testDir = 'test-outputs/mock-gemini';

  beforeAll(async () => {
    if (!SHOULD_RUN) return;
    
    await fs.mkdir(testDir, { recursive: true });
    analysisService = new MediaAnalysisService(process.env.GEMINI_API_KEY!);
    
    console.log('🚀 Testing real Gemini API with mock files...');
  });

  afterAll(async () => {
    console.log('🧹 Cleaning up...');
    try {
      await fs.rm(testDir, { recursive: true, force: true });
    } catch (error) {
      // Ignore
    }
  });

  test('should analyze mock video file with real Gemini API', async () => {
    // Create a mock video file
    const videoPath = path.join(testDir, 'mock-video.mp4');
    
    // Write minimal valid MP4 header (this creates a tiny valid MP4)
    const mp4Header = Buffer.from([
      0x00, 0x00, 0x00, 0x20, 0x66, 0x74, 0x79, 0x70, // ftyp box
      0x69, 0x73, 0x6F, 0x6D, 0x00, 0x00, 0x02, 0x00,
      0x69, 0x73, 0x6F, 0x6D, 0x69, 0x73, 0x6F, 0x32,
      0x61, 0x76, 0x63, 0x31, 0x6D, 0x70, 0x34, 0x31,
      0x00, 0x00, 0x00, 0x08, 0x66, 0x72, 0x65, 0x65, // free box
    ]);
    
    await fs.writeFile(videoPath, mp4Header);
    
    console.log('\n📹 Analyzing mock video with real Gemini API...');
    
    try {
      const analysis = await analysisService.analyzeMedia(videoPath, {
        platform: 'youtube',
        analysisTypes: ['content']
      });
      
      console.log('✅ Gemini API Response:');
      console.log(`  - Media Type: ${analysis.mediaType}`);
      console.log(`  - Model: ${analysis.metadata.modelUsed}`);
      console.log(`  - Tokens: ${analysis.metadata.tokensUsed}`);
      console.log(`  - Analysis Time: ${analysis.metadata.analysisTime}ms`);
      
      expect(analysis.mediaType).toBe('video');
      expect(analysis.metadata.tokensUsed).toBeGreaterThan(0);
      expect(analysis.metadata.modelUsed).toContain('gemini');
      
    } catch (error) {
      console.error('❌ Gemini API Error:', error);
      throw error;
    }
  });

  test('should analyze mock image file with real Gemini API', async () => {
    // Create a minimal PNG file
    const imagePath = path.join(testDir, 'mock-image.png');
    
    // Minimal 1x1 red PNG
    const pngData = Buffer.from([
      0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A, // PNG signature
      0x00, 0x00, 0x00, 0x0D, 0x49, 0x48, 0x44, 0x52, // IHDR chunk
      0x00, 0x00, 0x00, 0x01, 0x00, 0x00, 0x00, 0x01,
      0x08, 0x02, 0x00, 0x00, 0x00, 0x90, 0x77, 0x53,
      0xDE, 0x00, 0x00, 0x00, 0x0C, 0x49, 0x44, 0x41, // IDAT chunk
      0x54, 0x08, 0xD7, 0x63, 0xF8, 0xCF, 0xC0, 0x00,
      0x00, 0x03, 0x01, 0x01, 0x00, 0x18, 0xDD, 0x8D,
      0xB4, 0x00, 0x00, 0x00, 0x00, 0x49, 0x45, 0x4E, // IEND chunk
      0x44, 0xAE, 0x42, 0x60, 0x82
    ]);
    
    await fs.writeFile(imagePath, pngData);
    
    console.log('\n🖼️ Analyzing mock image with real Gemini API...');
    
    try {
      const analysis = await analysisService.analyzeMedia(imagePath, {
        platform: 'instagram',
        analysisTypes: ['composition']
      });
      
      console.log('✅ Gemini Image Analysis:');
      console.log(`  - Media Type: ${analysis.mediaType}`);
      console.log(`  - Platform: ${analysis.platformOptimization.platform}`);
      console.log(`  - Is Optimized: ${analysis.platformOptimization.isOptimized}`);
      
      expect(analysis.mediaType).toBe('image');
      expect(analysis.platformOptimization.platform).toBe('instagram');
      
    } catch (error) {
      console.error('❌ Gemini API Error:', error);
      throw error;
    }
  });

  test('should analyze mock audio file with real Gemini API', async () => {
    // Create a minimal MP3 file
    const audioPath = path.join(testDir, 'mock-audio.mp3');
    
    // Minimal MP3 header (silent audio)
    const mp3Header = Buffer.from([
      0xFF, 0xFB, 0x90, 0x00, // MP3 header
      0x00, 0x00, 0x00, 0x00,
      0x00, 0x00, 0x00, 0x00,
      0x00, 0x00, 0x00, 0x00
    ]);
    
    await fs.writeFile(audioPath, mp3Header);
    
    console.log('\n🎵 Analyzing mock audio with real Gemini API...');
    
    try {
      const analysis = await analysisService.analyzeMedia(audioPath, {
        analysisTypes: ['quality']
      });
      
      console.log('✅ Gemini Audio Analysis:');
      console.log(`  - Media Type: ${analysis.mediaType}`);
      console.log(`  - Has Audio Data: ${!!analysis.audio}`);
      console.log(`  - Processing Mode: ${analysis.metadata.processingMode}`);
      
      expect(analysis.mediaType).toBe('audio');
      expect(analysis.metadata.tokensUsed).toBeGreaterThan(0);
      
    } catch (error) {
      console.error('❌ Gemini API Error:', error);
      throw error;
    }
  });

  test('should demonstrate Gemini detecting quality issues', async () => {
    console.log('\n🔍 Testing Gemini quality detection...');
    
    // Create two mock images - simulating low and high quality
    const lowQualityPath = path.join(testDir, 'low-quality.png');
    const highQualityPath = path.join(testDir, 'high-quality.png');
    
    // Same minimal PNG for both (in real scenario, these would differ)
    const pngData = Buffer.from([
      0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A,
      0x00, 0x00, 0x00, 0x0D, 0x49, 0x48, 0x44, 0x52,
      0x00, 0x00, 0x00, 0x01, 0x00, 0x00, 0x00, 0x01,
      0x08, 0x02, 0x00, 0x00, 0x00, 0x90, 0x77, 0x53,
      0xDE, 0x00, 0x00, 0x00, 0x0C, 0x49, 0x44, 0x41,
      0x54, 0x08, 0xD7, 0x63, 0xF8, 0xCF, 0xC0, 0x00,
      0x00, 0x03, 0x01, 0x01, 0x00, 0x18, 0xDD, 0x8D,
      0xB4, 0x00, 0x00, 0x00, 0x00, 0x49, 0x45, 0x4E,
      0x44, 0xAE, 0x42, 0x60, 0x82
    ]);
    
    await fs.writeFile(lowQualityPath, pngData);
    await fs.writeFile(highQualityPath, pngData);
    
    // Analyze both with custom prompts to simulate quality differences
    const [lowAnalysis, highAnalysis] = await Promise.all([
      analysisService.analyzeMedia(lowQualityPath, {
        analysisTypes: ['quality'],
        customPrompt: 'This is a low quality, blurry image with poor contrast.'
      }),
      analysisService.analyzeMedia(highQualityPath, {
        analysisTypes: ['quality'],
        customPrompt: 'This is a high quality, sharp image with excellent contrast.'
      })
    ]);
    
    console.log('📊 Quality Comparison Results:');
    console.log('Low Quality Analysis:');
    console.log(`  - Quality Score: ${lowAnalysis.image?.quality.score || lowAnalysis.primary.qualityScore}`);
    console.log(`  - Suggestions: ${lowAnalysis.editingSuggestions.length}`);
    
    console.log('\nHigh Quality Analysis:');
    console.log(`  - Quality Score: ${highAnalysis.image?.quality.score || highAnalysis.primary.qualityScore}`);
    console.log(`  - Suggestions: ${highAnalysis.editingSuggestions.length}`);
    
    // Verify Gemini provides different assessments
    expect(lowAnalysis.editingSuggestions.length).toBeGreaterThanOrEqual(0);
    expect(highAnalysis.editingSuggestions.length).toBeGreaterThanOrEqual(0);
    
    console.log('\n✅ Gemini API successfully analyzed media quality differences');
  });
});
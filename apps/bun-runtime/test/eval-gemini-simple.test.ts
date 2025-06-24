import { describe, test, expect, beforeAll } from 'bun:test';
import { Timeline } from '../../../packages/media-sdk/src/timeline/timeline.js';
import { MediaAnalysisService } from '../../../packages/media-sdk/src/services/media-analysis.js';
import { EnhancedBunCassetteManager } from '../src/enhanced-cassette-manager.ts';
import * as fs from 'fs/promises';
import * as path from 'path';

// Only run if GEMINI_API_KEY is set
const SHOULD_RUN = !!process.env.GEMINI_API_KEY;

describe.skipIf(!SHOULD_RUN)('🎯 Simple Gemini Eval Test', () => {
  let cassetteManager: EnhancedBunCassetteManager;
  let analysisService: MediaAnalysisService;
  const outputDir = 'test-outputs/gemini-simple';

  beforeAll(async () => {
    if (!SHOULD_RUN) return;
    
    await fs.mkdir(outputDir, { recursive: true });
    cassetteManager = new EnhancedBunCassetteManager('gemini-simple');
    analysisService = new MediaAnalysisService(process.env.GEMINI_API_KEY!);
  });

  test('should create and analyze a simple video with real Gemini', async () => {
    console.log('\n🎬 Creating simple test video...');
    
    // Create a simple colored video with text
    const timeline = new Timeline()
      .addText('Gemini Test', {
        position: { x: '50%', y: '50%' },
        style: {
          fontSize: 72,
          color: '#ffffff',
          fontFamily: 'Arial'
        },
        duration: 3,
        background: '#0066ff' // Blue background
      });

    const outputPath = path.join(outputDir, 'simple-test.mp4');
    
    // Generate a simple 3-second blue video with text
    const command = `ffmpeg -f lavfi -i color=c=0066ff:s=1280x720:d=3 -vf "drawtext=text='Gemini Test':x=(w-text_w)/2:y=(h-text_h)/2:fontsize=72:fontcolor=white:fontfile=/System/Library/Fonts/Helvetica.ttc" -c:v libx264 -pix_fmt yuv420p -y "${outputPath}"`;
    
    console.log('📹 Rendering video...');
    const result = await cassetteManager.executeCommand(command, 'render-simple-video');
    
    // Check if file was created
    try {
      const stats = await fs.stat(outputPath);
      console.log(`✅ Video created: ${stats.size} bytes`);
      
      // Analyze with real Gemini API
      console.log('🤖 Analyzing with Gemini...');
      const analysis = await analysisService.analyzeMedia(outputPath, {
        platform: 'youtube',
        analysisTypes: ['quality', 'content']
      });
      
      console.log('\n📊 Gemini Analysis:');
      console.log(`  - Media Type: ${analysis.mediaType}`);
      console.log(`  - Description: ${analysis.primary.description}`);
      console.log(`  - Quality Score: ${analysis.video?.quality.score || 'N/A'}`);
      console.log(`  - Model Used: ${analysis.metadata.modelUsed}`);
      console.log(`  - Tokens Used: ${analysis.metadata.tokensUsed}`);
      
      expect(analysis.mediaType).toBe('video');
      expect(analysis.metadata.tokensUsed).toBeGreaterThan(0);
      
    } catch (error) {
      console.error('❌ Error:', error);
      throw error;
    }
  });

  test('should create and analyze a simple image with real Gemini', async () => {
    console.log('\n🖼️ Creating simple test image...');
    
    const outputPath = path.join(outputDir, 'simple-test.png');
    
    // Generate a simple image with text
    const command = `ffmpeg -f lavfi -i color=c=ff0066:s=1080x1080:d=1 -vf "drawtext=text='Gemini Image Test':x=(w-text_w)/2:y=(h-text_h)/2:fontsize=60:fontcolor=white:fontfile=/System/Library/Fonts/Helvetica.ttc" -frames:v 1 -y "${outputPath}"`;
    
    console.log('🖼️ Creating image...');
    const result = await cassetteManager.executeCommand(command, 'create-simple-image');
    
    try {
      const stats = await fs.stat(outputPath);
      console.log(`✅ Image created: ${stats.size} bytes`);
      
      // Analyze with real Gemini API
      console.log('🤖 Analyzing image with Gemini...');
      const analysis = await analysisService.analyzeMedia(outputPath, {
        platform: 'instagram',
        analysisTypes: ['composition', 'quality']
      });
      
      console.log('\n📊 Gemini Image Analysis:');
      console.log(`  - Media Type: ${analysis.mediaType}`);
      console.log(`  - Composition: ${analysis.image?.composition.balance || 'N/A'}`);
      console.log(`  - Quality: ${JSON.stringify(analysis.image?.quality)}`);
      console.log(`  - Instagram Optimized: ${analysis.platformOptimization.isOptimized}`);
      
      expect(analysis.mediaType).toBe('image');
      expect(analysis.metadata.tokensUsed).toBeGreaterThan(0);
      
    } catch (error) {
      console.error('❌ Error:', error);
      throw error;
    }
  });

  test('should create and analyze simple audio with real Gemini', async () => {
    console.log('\n🎵 Creating simple test audio...');
    
    const outputPath = path.join(outputDir, 'simple-test.mp3');
    
    // Generate a simple tone
    const command = `ffmpeg -f lavfi -i sine=frequency=440:duration=3 -c:a libmp3lame -b:a 192k -y "${outputPath}"`;
    
    console.log('🎵 Creating audio...');
    const result = await cassetteManager.executeCommand(command, 'create-simple-audio');
    
    try {
      const stats = await fs.stat(outputPath);
      console.log(`✅ Audio created: ${stats.size} bytes`);
      
      // Analyze with real Gemini API
      console.log('🤖 Analyzing audio with Gemini...');
      const analysis = await analysisService.analyzeMedia(outputPath, {
        analysisTypes: ['quality', 'soundscape']
      });
      
      console.log('\n📊 Gemini Audio Analysis:');
      console.log(`  - Media Type: ${analysis.mediaType}`);
      console.log(`  - Audio Quality: ${JSON.stringify(analysis.audio?.quality)}`);
      console.log(`  - Soundscape: ${analysis.audio?.soundscape?.join(', ') || 'N/A'}`);
      
      expect(analysis.mediaType).toBe('audio');
      expect(analysis.metadata.tokensUsed).toBeGreaterThan(0);
      
    } catch (error) {
      console.error('❌ Error:', error);
      throw error;
    }
  });
});
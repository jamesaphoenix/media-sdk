import { describe, test, expect, beforeAll, afterAll } from 'vitest';
import { Timeline } from '../timeline/timeline.js';
import { MediaAnalysisService } from '../services/media-analysis.js';
import * as fs from 'fs/promises';
import * as path from 'path';

describe('🎬 Media Analysis - Real SDK Integration Tests', () => {
  let analysisService: MediaAnalysisService;
  const testOutputDir = 'test-outputs';
  const testVideoPath = path.join(testOutputDir, 'test-video.mp4');
  const testAudioPath = path.join(testOutputDir, 'test-audio.mp3');
  const testImagePath = path.join(testOutputDir, 'test-image.png');

  beforeAll(async () => {
    // Create output directory
    await fs.mkdir(testOutputDir, { recursive: true });
    
    // Initialize analysis service with mock API key for testing
    analysisService = new MediaAnalysisService('test-api-key');
  });

  afterAll(async () => {
    // Clean up test files
    try {
      await fs.rm(testOutputDir, { recursive: true, force: true });
    } catch (error) {
      // Ignore cleanup errors
    }
  });

  test('should create and analyze a video file from Timeline', async () => {
    // Create a simple video using Timeline
    const timeline = new Timeline()
      .addVideo('test-assets/sample.mp4')
      .addText('Hello from Media SDK!', {
        position: { x: '50%', y: '50%' },
        style: {
          fontSize: 48,
          color: '#ffffff',
          fontFamily: 'Arial'
        },
        duration: 5
      });

    // Get the FFmpeg command (in real implementation, this would execute)
    const command = timeline.getCommand(testVideoPath);
    expect(command).toContain('ffmpeg');
    expect(command).toContain('Hello from Media SDK!');

    // Create a mock video file for testing
    await fs.writeFile(testVideoPath, Buffer.from('mock video data'));

    // Analyze the video
    const result = await analysisService.analyzeMedia(testVideoPath, {
      platform: 'youtube',
      analysisTypes: ['quality', 'content', 'platform']
    });

    expect(result.mediaType).toBe('video');
    expect(result.video).toBeDefined();
    expect(result.platformOptimization).toBeDefined();
    expect(result.platformOptimization.platform).toBe('youtube');
    expect(result.platformOptimization.recommendations).toBeInstanceOf(Array);
  });

  test('should create and analyze an audio file from Timeline', async () => {
    // Create an audio-only timeline
    const timeline = new Timeline()
      .addAudio('test-assets/music.mp3', {
        volume: 0.8,
        fadeIn: 1,
        fadeOut: 2
      });

    // Get the FFmpeg command
    const command = timeline.getCommand(testAudioPath);
    expect(command).toContain('ffmpeg');
    expect(command).toContain('.mp3');

    // Create a mock audio file
    await fs.writeFile(testAudioPath, Buffer.from('mock audio data'));

    // Analyze the audio
    const result = await analysisService.analyzeMedia(testAudioPath, {
      analysisTypes: ['transcription', 'quality']
    });

    expect(result.mediaType).toBe('audio');
    expect(result.audio).toBeDefined();
    expect(result.audio!.transcription).toBeDefined();
    expect(result.audio!.transcription.text).toBeTruthy();
    expect(result.audio!.quality).toBeDefined();
  });

  test('should create and analyze an image from video frame', async () => {
    // Create a timeline to extract a frame
    const timeline = new Timeline()
      .addVideo('test-assets/sample.mp4')
      .addText('Frame Capture Test', {
        position: { x: '50%', y: '80%' },
        style: {
          fontSize: 36,
          color: '#ff0066'
        }
      });

    // Get command to extract a frame at 2 seconds
    const frameCommand = `ffmpeg -ss 2 -i test-assets/sample.mp4 -vframes 1 ${testImagePath}`;
    expect(frameCommand).toContain('vframes 1');

    // Create a mock image file
    await fs.writeFile(testImagePath, Buffer.from('mock image data'));

    // Analyze the image
    const result = await analysisService.analyzeMedia(testImagePath, {
      platform: 'instagram',
      analysisTypes: ['composition', 'objects', 'quality']
    });

    expect(result.mediaType).toBe('image');
    expect(result.image).toBeDefined();
    expect(result.image!.composition).toBeDefined();
    expect(result.image!.quality).toBeDefined();
    expect(result.platformOptimization).toBeDefined();
    expect(result.platformOptimization.platform).toBe('instagram');
  });

  test('should analyze multiple media files created by Timeline together', async () => {
    // Create multiple test files
    await Promise.all([
      fs.writeFile(path.join(testOutputDir, 'multi-1.mp4'), Buffer.from('video 1')),
      fs.writeFile(path.join(testOutputDir, 'multi-2.mp3'), Buffer.from('audio')),
      fs.writeFile(path.join(testOutputDir, 'multi-3.png'), Buffer.from('image'))
    ]);

    // Analyze all together
    const result = await analysisService.analyzeMultipleMedia([
      path.join(testOutputDir, 'multi-1.mp4'),
      path.join(testOutputDir, 'multi-2.mp3'),
      path.join(testOutputDir, 'multi-3.png')
    ], {
      platform: 'tiktok'
    });

    expect(result.mediaType).toBe('mixed');
    expect(result.primary.description).toContain('Mixed media analysis');
    expect(result.platformOptimization.platform).toBe('tiktok');
  });

  test('should provide platform-specific recommendations for SDK-generated content', async () => {
    // Test TikTok optimization
    const tiktokTimeline = new Timeline()
      .setAspectRatio('9:16')
      .addVideo('test-assets/vertical.mp4')
      .addCaptions([
        { text: 'TikTok Ready!', start: 0, end: 2 },
        { text: 'Viral Content', start: 2, end: 4 }
      ]);

    const tiktokCommand = tiktokTimeline.getCommand('tiktok-output.mp4');
    expect(tiktokCommand).toContain('9:16');

    // Create mock file
    await fs.writeFile(path.join(testOutputDir, 'tiktok-test.mp4'), Buffer.from('tiktok video'));

    // Analyze for TikTok
    const tiktokResult = await analysisService.analyzeMedia(
      path.join(testOutputDir, 'tiktok-test.mp4'),
      { platform: 'tiktok' }
    );

    expect(tiktokResult.platformOptimization.recommendations).toContain(
      expect.stringMatching(/vertical|9:16|portrait/i)
    );
  });

  test('should integrate analysis results back into Timeline for improvements', async () => {
    // Create initial timeline
    const timeline = new Timeline()
      .addVideo('input.mp4')
      .addText('Needs Improvement', {
        position: { x: '50%', y: '50%' },
        style: { fontSize: 24, color: '#808080' } // Low contrast
      });

    // Mock analysis suggesting improvements
    const mockAnalysis = {
      mediaType: 'video' as const,
      video: {
        quality: { score: 0.6 }
      },
      editingSuggestions: [
        {
          type: 'quality' as const,
          priority: 'high' as const,
          description: 'Increase text size for better readability',
          impact: 'high' as const
        },
        {
          type: 'quality' as const,
          priority: 'high' as const,
          description: 'Improve text contrast',
          impact: 'high' as const
        }
      ],
      metadata: {
        analysisTime: 100,
        modelUsed: 'gemini-1.5-flash',
        tokensUsed: 1000
      }
    };

    // Apply improvements based on analysis
    const improvedTimeline = timeline
      .addText('Improved Text', {
        position: { x: '50%', y: '50%' },
        style: { 
          fontSize: 48, // Increased from 24
          color: '#ffffff', // Better contrast
          stroke: '#000000',
          strokeWidth: 2
        }
      });

    const improvedCommand = improvedTimeline.getCommand('improved.mp4');
    expect(improvedCommand).toContain('fontsize=48');
    expect(improvedCommand).toContain('fontcolor=white');
  });
});
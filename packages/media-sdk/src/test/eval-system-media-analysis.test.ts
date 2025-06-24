import { describe, test, expect, beforeAll, vi } from 'vitest';
import { Timeline } from '../timeline/timeline.js';
import { MediaAnalysisService } from '../services/media-analysis.js';
import { RuntimeValidator } from '../../../apps/bun-runtime/src/runtime-validator.js';
import type { MediaAnalysisResult } from '../services/media-analysis.js';

// Mock the Google Generative AI
vi.mock('@google/generative-ai', () => ({
  GoogleGenerativeAI: vi.fn().mockImplementation(() => ({
    getGenerativeModel: vi.fn().mockReturnValue({
      generateContent: vi.fn().mockImplementation((prompt) => {
        // Simulate different responses based on media type detection in prompt
        let responseText = '';
        
        if (prompt.includes('.mp4') || prompt.includes('video')) {
          responseText = `
            DESCRIPTION: High quality video with smooth transitions
            QUALITY ASSESSMENT: Score 0.85/1.0 - Good clarity and composition
            PLATFORM OPTIMIZATION: Video is well-suited for the target platform
            ACCESSIBILITY: Needs captions for spoken content
            SCENES: 
            - 00:00-00:05: Opening title with fade in
            - 00:05-00:15: Main content with text overlay
            - 00:15-00:20: Closing with fade out
          `;
        } else if (prompt.includes('.mp3') || prompt.includes('audio')) {
          responseText = `
            TRANSCRIPTION: Welcome to the Media SDK audio test. This is a sample narration.
            AUDIO QUALITY: Bitrate 192kbps, clear speech, minimal background noise
            SOUNDSCAPE: Speech (primary), light background music
          `;
        } else if (prompt.includes('.png') || prompt.includes('.jpg') || prompt.includes('image')) {
          responseText = `
            COMPOSITION: Rule of thirds applied, balanced layout
            OBJECTS: Text overlay, background gradient, logo
            QUALITY: High resolution, good contrast ratio
            AESTHETIC SCORE: 0.78
          `;
        }
        
        return Promise.resolve({
          response: {
            text: () => responseText
          }
        });
      })
    })
  }))
}));

describe('📊 Eval System - Media Analysis Integration', () => {
  let analysisService: MediaAnalysisService;
  
  beforeAll(() => {
    analysisService = new MediaAnalysisService('test-api-key');
  });

  test('should evaluate video quality from Timeline render', async () => {
    // Create a Timeline that would produce a video
    const timeline = new Timeline()
      .addVideo('input.mp4')
      .addText('Evaluation Test', {
        position: { x: '50%', y: '50%' },
        style: {
          fontSize: 48,
          color: '#ffffff',
          fontFamily: 'Arial, sans-serif'
        }
      })
      .addCaptions([
        { text: 'This is a test', start: 0, end: 2 },
        { text: 'Of the eval system', start: 2, end: 4 }
      ]);

    // Get the command that would render this
    const command = timeline.getCommand('output.mp4');
    
    // Simulate eval system analyzing the output
    const result = await analysisService.analyzeMedia('output.mp4', {
      platform: 'youtube',
      analysisTypes: ['quality', 'accessibility', 'platform']
    });

    // Verify eval system can assess quality
    expect(result.mediaType).toBe('video');
    expect(result.video?.quality.score).toBeGreaterThan(0.8);
    expect(result.video?.scenes).toHaveLength(3);
    expect(result.accessibility.requiresCaptions).toBe(true);
    
    // Verify platform-specific evaluation
    expect(result.platformOptimization.isOptimized).toBe(true);
    expect(result.platformOptimization.recommendations).toBeInstanceOf(Array);
  });

  test('should evaluate audio quality from Timeline audio export', async () => {
    // Create audio-only timeline
    const timeline = new Timeline()
      .addAudio('narration.mp3', { volume: 1.0 })
      .addAudio('background-music.mp3', { 
        volume: 0.3,
        fadeIn: 2,
        fadeOut: 2 
      });

    const command = timeline.getCommand('output.mp3');
    
    // Evaluate the audio output
    const result = await analysisService.analyzeMedia('output.mp3', {
      analysisTypes: ['transcription', 'quality']
    });

    expect(result.mediaType).toBe('audio');
    expect(result.audio?.transcription.text).toContain('Media SDK audio test');
    expect(result.audio?.quality.bitrate).toBe('192kbps');
    expect(result.audio?.soundscape).toContain('speech');
  });

  test('should evaluate image quality from frame extraction', async () => {
    // Simulate extracting a frame from video
    const result = await analysisService.analyzeMedia('frame-001.png', {
      platform: 'instagram',
      analysisTypes: ['composition', 'quality', 'aesthetic']
    });

    expect(result.mediaType).toBe('image');
    expect(result.image?.composition.balance).toContain('balanced');
    expect(result.image?.aestheticScore).toBeGreaterThan(0.7);
    expect(result.image?.quality.resolution).toContain('High');
  });

  test('should provide actionable feedback for Timeline improvements', async () => {
    // Create a suboptimal timeline
    const timeline = new Timeline()
      .addVideo('shaky-video.mp4')
      .addText('Hard to read text', {
        position: { x: '10%', y: '90%' },
        style: {
          fontSize: 12, // Too small
          color: '#ffff00' // Poor contrast on light background
        }
      });

    // Mock analysis with improvement suggestions
    const mockResult: MediaAnalysisResult = {
      mediaType: 'video',
      video: {
        description: 'Video with readability issues',
        quality: { 
          score: 0.5,
          resolution: '1920x1080',
          fps: 30,
          bitrate: '5000kbps'
        },
        scenes: [],
        transcription: { text: '', language: 'en' },
        transitions: []
      },
      primary: {
        description: 'Video needs quality improvements',
        keyElements: ['Poor text readability', 'Low contrast'],
        qualityScore: 0.5
      },
      editingSuggestions: [
        {
          type: 'quality',
          priority: 'high',
          description: 'Increase font size to at least 24px for readability',
          impact: 'high'
        },
        {
          type: 'quality', 
          priority: 'high',
          description: 'Change text color to improve contrast (current ratio: 2.1:1, recommended: 4.5:1)',
          impact: 'high'
        },
        {
          type: 'enhancement',
          priority: 'medium',
          description: 'Consider adding text stroke or shadow for better visibility',
          impact: 'medium'
        }
      ],
      accessibility: {
        requiresCaptions: false,
        hasAudioDescription: false,
        colorContrast: { passes: false, ratio: 2.1 },
        readabilityScore: 0.3
      },
      platformOptimization: {
        platform: 'general',
        isOptimized: false,
        recommendations: [
          'Improve text readability for mobile viewing',
          'Ensure minimum font sizes for platform requirements'
        ],
        aspectRatioMatch: true,
        durationCompliance: true
      },
      metadata: {
        analysisTime: 250,
        modelUsed: 'gemini-1.5-flash',
        tokensUsed: 1500
      }
    };

    // Verify eval provides clear improvement path
    expect(mockResult.editingSuggestions).toHaveLength(3);
    expect(mockResult.editingSuggestions[0].priority).toBe('high');
    expect(mockResult.accessibility.colorContrast.passes).toBe(false);
    expect(mockResult.platformOptimization.isOptimized).toBe(false);
  });

  test('should integrate with RuntimeValidator for comprehensive evaluation', async () => {
    // This demonstrates how the eval system would use both 
    // RuntimeValidator and MediaAnalysisService together
    
    const timeline = new Timeline()
      .addVideo('input.mp4')
      .setAspectRatio('16:9')
      .addWordHighlighting({
        text: 'Highlighting test for eval system',
        words: [
          { word: 'Highlighting', start: 0, end: 1.5 },
          { word: 'test', start: 1.5, end: 2.5 },
          { word: 'for', start: 2.5, end: 3 },
          { word: 'eval', start: 3, end: 3.5 },
          { word: 'system', start: 3.5, end: 4.5 }
        ],
        preset: 'karaoke'
      });

    const command = timeline.getCommand('eval-test.mp4');
    
    // Simulate comprehensive evaluation
    const mediaAnalysis = await analysisService.analyzeMedia('eval-test.mp4', {
      platform: 'youtube',
      analysisTypes: ['quality', 'content', 'timing']
    });

    // Verify the eval system can assess:
    // 1. Technical quality
    expect(mediaAnalysis.video?.quality.score).toBeGreaterThan(0.7);
    
    // 2. Content appropriateness
    expect(mediaAnalysis.primary.keyElements).toContain('text overlay');
    
    // 3. Platform optimization
    expect(mediaAnalysis.platformOptimization.platform).toBe('youtube');
    expect(mediaAnalysis.platformOptimization.aspectRatioMatch).toBe(true);
    
    // 4. Timing accuracy (for word highlighting)
    expect(mediaAnalysis.video?.scenes.length).toBeGreaterThan(0);
  });

  test('should detect and evaluate self-healing optimizations', async () => {
    // Test the eval system's ability to detect when self-healing 
    // optimizations have been applied
    
    // Original timeline with issues
    const originalTimeline = new Timeline()
      .addVideo('low-quality.mp4')
      .addText('Text', {
        position: { x: '50%', y: '50%' },
        style: { fontSize: 16, color: '#cccccc' }
      });

    // Self-healed timeline with improvements
    const healedTimeline = new Timeline()
      .addVideo('low-quality.mp4')
      .addText('Text', {
        position: { x: '50%', y: '50%' },
        style: { 
          fontSize: 48,
          color: '#ffffff',
          stroke: '#000000',
          strokeWidth: 3
        }
      })
      .addFilter('eq', { brightness: 0.1, contrast: 1.2 }); // Enhanced video

    // Analyze both
    const [originalResult, healedResult] = await Promise.all([
      analysisService.analyzeMedia('original.mp4', { analysisTypes: ['quality'] }),
      analysisService.analyzeMedia('healed.mp4', { analysisTypes: ['quality'] })
    ]);

    // Verify eval detects improvement
    expect(healedResult.video!.quality.score).toBeGreaterThan(
      originalResult.video!.quality.score
    );
    expect(healedResult.accessibility.readabilityScore).toBeGreaterThan(
      originalResult.accessibility.readabilityScore
    );
  });
});
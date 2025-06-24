import { describe, test, expect, beforeEach, vi } from 'vitest';
import { MediaAnalysisService, createMediaAnalysisService, MediaAnalysisIntegration } from '../services/media-analysis.js';
import { Timeline } from '../timeline/timeline.js';
import type { MediaAnalysisOptions, MediaAnalysisResult } from '../services/media-analysis.js';

// Mock the Google Generative AI
vi.mock('@google/generative-ai', () => ({
  GoogleGenerativeAI: vi.fn().mockImplementation(() => ({
    getGenerativeModel: vi.fn().mockReturnValue({
      generateContent: vi.fn().mockResolvedValue({
        response: {
          text: () => 'Mock analysis response with comprehensive video analysis including scenes, quality assessment, and optimization suggestions.'
        }
      })
    }),
    files: {
      upload: vi.fn().mockResolvedValue({
        uri: 'mock-file-uri',
        mimeType: 'video/mp4'
      }),
      get: vi.fn().mockResolvedValue({
        state: 'ACTIVE'
      })
    }
  }))
}));

// Mock fs promises
vi.mock('fs', () => ({
  promises: {
    stat: vi.fn().mockResolvedValue({ size: 1024 * 1024 }), // 1MB
    readFile: vi.fn().mockResolvedValue(Buffer.from('mock-file-content'))
  }
}));

describe('🎬 Media Analysis Service - Comprehensive Tests', () => {
  let analysisService: MediaAnalysisService;
  
  beforeEach(() => {
    analysisService = new MediaAnalysisService('mock-api-key');
  });

  describe('Service Initialization', () => {
    test('should create service with API key', () => {
      const service = new MediaAnalysisService('test-api-key');
      expect(service).toBeDefined();
    });
    
    test('should create service using factory function', () => {
      const service = createMediaAnalysisService('test-api-key');
      expect(service).toBeDefined();
    });
    
    test('should throw error when no API key provided', () => {
      // Clear environment variable first
      delete process.env.GEMINI_API_KEY;
      expect(() => createMediaAnalysisService()).toThrow('Gemini API key required');
    });
    
    test('should use environment variable for API key', () => {
      process.env.GEMINI_API_KEY = 'env-api-key';
      const service = createMediaAnalysisService();
      expect(service).toBeDefined();
      delete process.env.GEMINI_API_KEY;
    });
  });

  describe('Media Type Detection', () => {
    test('should detect video files correctly', async () => {
      const videoExtensions = ['.mp4', '.avi', '.mov', '.webm', '.mkv'];
      
      for (const ext of videoExtensions) {
        const result = await analysisService.analyzeMedia(`test-video${ext}`);
        expect(result.mediaType).toBe('video');
      }
    });
    
    test('should detect audio files correctly', async () => {
      const audioExtensions = ['.mp3', '.wav', '.aac', '.flac', '.ogg'];
      
      for (const ext of audioExtensions) {
        const result = await analysisService.analyzeMedia(`test-audio${ext}`);
        expect(result.mediaType).toBe('audio');
      }
    });
    
    test('should detect image files correctly', async () => {
      const imageExtensions = ['.jpg', '.png', '.webp', '.heic', '.gif'];
      
      for (const ext of imageExtensions) {
        const result = await analysisService.analyzeMedia(`test-image${ext}`);
        expect(result.mediaType).toBe('image');
      }
    });
    
    test('should handle unknown file types', async () => {
      await expect(
        analysisService.analyzeMedia('test-file.xyz')
      ).rejects.toThrow('Unsupported media type');
    });
  });

  describe('Video Analysis', () => {
    test('should analyze video content comprehensively', async () => {
      const result = await analysisService.analyzeMedia('test-video.mp4', {
        analysisTypes: ['content', 'technical', 'quality'],
        targetPlatform: 'youtube',
        analysisDepth: 'comprehensive'
      });
      
      expect(result.mediaType).toBe('video');
      expect(result.primary.summary).toBeTruthy();
      expect(result.video).toBeDefined();
      expect(result.video!.scenes).toBeInstanceOf(Array);
      expect(result.platformOptimization.youtube).toBeDefined();
      expect(result.editingSuggestions).toBeInstanceOf(Array);
    });
    
    test('should provide platform-specific optimization for TikTok', async () => {
      const result = await analysisService.analyzeMedia('tiktok-video.mp4', {
        targetPlatform: 'tiktok',
        analysisDepth: 'expert'
      });
      
      expect(result.platformOptimization.tiktok.score).toBeGreaterThan(0);
      expect(result.platformOptimization.tiktok.suggestions).toBeInstanceOf(Array);
    });
    
    test('should handle video quality assessment', async () => {
      const result = await analysisService.analyzeMedia('quality-test.mp4', {
        analysisTypes: ['quality', 'technical']
      });
      
      expect(result.primary.quality.overall).toBeGreaterThan(0);
      expect(result.primary.quality.overall).toBeLessThanOrEqual(1);
      expect(result.video!.visualQuality).toBeGreaterThan(0);
    });
    
    test('should extract scene information', async () => {
      const result = await analysisService.analyzeMedia('scenes-video.mp4');
      
      expect(result.video!.scenes).toBeInstanceOf(Array);
      if (result.video!.scenes.length > 0) {
        const scene = result.video!.scenes[0];
        expect(scene.startTime).toBeTruthy();
        expect(scene.endTime).toBeTruthy();
        expect(scene.description).toBeTruthy();
      }
    });
  });

  describe('Audio Analysis', () => {
    test('should analyze audio content with transcription', async () => {
      const result = await analysisService.analyzeMedia('test-audio.mp3', {
        analysisTypes: ['content', 'transcription'],
        language: 'en'
      });
      
      expect(result.mediaType).toBe('audio');
      expect(result.audio).toBeDefined();
      expect(result.audio!.transcription.text).toBeTruthy();
      expect(result.audio!.transcription.timestamps).toBeInstanceOf(Array);
    });
    
    test('should assess audio quality metrics', async () => {
      const result = await analysisService.analyzeMedia('quality-audio.wav', {
        analysisTypes: ['quality', 'technical']
      });
      
      expect(result.audio!.audioQuality.clarity).toBeGreaterThan(0);
      expect(result.audio!.audioQuality.backgroundNoise).toBeGreaterThan(0);
      expect(result.audio!.audioQuality.levels).toBeGreaterThan(0);
    });
    
    test('should detect soundscape elements', async () => {
      const result = await analysisService.analyzeMedia('soundscape.mp3');
      
      expect(result.audio!.soundscape).toBeInstanceOf(Array);
      expect(result.audio!.duration).toBeGreaterThan(0);
    });
    
    test('should handle multiple speakers', async () => {
      const result = await analysisService.analyzeMedia('multi-speaker.mp3');
      
      const timestamps = result.audio!.transcription.timestamps;
      timestamps.forEach(timestamp => {
        expect(timestamp.time).toBeTruthy();
        expect(timestamp.text).toBeTruthy();
        expect(timestamp.confidence).toBeGreaterThan(0);
      });
    });
  });

  describe('Image Analysis', () => {
    test('should analyze image composition and quality', async () => {
      const result = await analysisService.analyzeMedia('test-image.jpg', {
        analysisTypes: ['quality', 'technical'],
        includeObjectDetection: false
      });
      
      expect(result.mediaType).toBe('image');
      expect(result.image).toBeDefined();
      expect(result.image!.composition.balance).toBeGreaterThan(0);
      expect(result.image!.aesthetics.lighting).toBeGreaterThan(0);
    });
    
    test('should perform object detection when requested', async () => {
      const result = await analysisService.analyzeMedia('objects-image.jpg', {
        includeObjectDetection: true,
        analysisDepth: 'expert'
      });
      
      expect(result.image!.objects).toBeInstanceOf(Array);
      if (result.image!.objects.length > 0) {
        const obj = result.image!.objects[0];
        expect(obj.label).toBeTruthy();
        expect(obj.confidence).toBeGreaterThan(0);
        expect(obj.boundingBox).toBeInstanceOf(Array);
      }
    });
    
    test('should perform segmentation when requested', async () => {
      const result = await analysisService.analyzeMedia('segmentation-image.png', {
        includeSegmentation: true,
        includeObjectDetection: true
      });
      
      expect(result.image!.objects).toBeInstanceOf(Array);
      // Segmentation would include mask data in real implementation
    });
    
    test('should assess technical image properties', async () => {
      const result = await analysisService.analyzeMedia('technical-image.jpg');
      
      expect(result.image!.technical.resolution.width).toBeGreaterThan(0);
      expect(result.image!.technical.resolution.height).toBeGreaterThan(0);
      expect(result.image!.technical.format).toBeTruthy();
      expect(result.image!.technical.fileSize).toBeGreaterThan(0);
    });
  });

  describe('Multi-Media Analysis', () => {
    test('should analyze multiple media files together', async () => {
      const mediaPaths = [
        'video.mp4',
        'audio.mp3',
        'image.jpg'
      ];
      
      const result = await analysisService.analyzeMultipleMedia(mediaPaths);
      
      expect(result.mediaType).toBe('mixed');
      expect(result.primary.description).toContain('Mixed media analysis');
      expect(result.primary.keyElements.length).toBeGreaterThan(0);
    });
    
    test('should combine quality scores from multiple files', async () => {
      const result = await analysisService.analyzeMultipleMedia([
        'video.mp4',
        'audio.mp3'
      ]);
      
      expect(result.primary.quality.overall).toBeGreaterThan(0);
      expect(result.primary.quality.overall).toBeLessThanOrEqual(1);
    });
  });

  describe('Platform Optimization', () => {
    test('should provide YouTube-specific recommendations', async () => {
      const result = await analysisService.analyzeMedia('youtube-content.mp4', {
        targetPlatform: 'youtube'
      });
      
      const youtubeOpt = result.platformOptimization.youtube;
      expect(youtubeOpt.score).toBeGreaterThan(0);
      expect(youtubeOpt.suggestions).toBeInstanceOf(Array);
      expect(youtubeOpt.suggestions.length).toBeGreaterThan(0);
    });
    
    test('should provide TikTok-specific recommendations', async () => {
      const result = await analysisService.analyzeMedia('tiktok-content.mp4', {
        targetPlatform: 'tiktok'
      });
      
      const tiktokOpt = result.platformOptimization.tiktok;
      expect(tiktokOpt.score).toBeGreaterThan(0);
      expect(tiktokOpt.suggestions).toBeInstanceOf(Array);
    });
    
    test('should provide Instagram-specific recommendations', async () => {
      const result = await analysisService.analyzeMedia('instagram-content.jpg', {
        targetPlatform: 'instagram'
      });
      
      const instaOpt = result.platformOptimization.instagram;
      expect(instaOpt.score).toBeGreaterThan(0);
      expect(instaOpt.suggestions).toBeInstanceOf(Array);
    });
  });

  describe('Editing Suggestions', () => {
    test('should provide actionable editing suggestions', async () => {
      const result = await analysisService.analyzeMedia('needs-editing.mp4', {
        generateEditingCode: true
      });
      
      expect(result.editingSuggestions).toBeInstanceOf(Array);
      result.editingSuggestions.forEach(suggestion => {
        expect(suggestion.type).toMatch(/audio|visual|timing|effects|text/);
        expect(suggestion.priority).toMatch(/high|medium|low/);
        expect(suggestion.suggestion).toBeTruthy();
        expect(suggestion.implementation).toBeTruthy();
        expect(suggestion.estimatedImprovement).toBeGreaterThan(0);
      });
    });
    
    test('should prioritize suggestions correctly', async () => {
      const result = await analysisService.analyzeMedia('priority-test.mp4');
      
      const highPriority = result.editingSuggestions.filter(s => s.priority === 'high');
      const mediumPriority = result.editingSuggestions.filter(s => s.priority === 'medium');
      const lowPriority = result.editingSuggestions.filter(s => s.priority === 'low');
      
      // High priority suggestions should have higher estimated improvement
      if (highPriority.length > 0 && mediumPriority.length > 0) {
        const avgHighImprovement = highPriority.reduce((sum, s) => sum + s.estimatedImprovement, 0) / highPriority.length;
        const avgMediumImprovement = mediumPriority.reduce((sum, s) => sum + s.estimatedImprovement, 0) / mediumPriority.length;
        expect(avgHighImprovement).toBeGreaterThanOrEqual(avgMediumImprovement);
      }
    });
  });

  describe('Accessibility Assessment', () => {
    test('should assess accessibility requirements', async () => {
      const result = await analysisService.analyzeMedia('accessibility-test.mp4');
      
      expect(result.accessibility.needsCaptions).toBeDefined();
      expect(result.accessibility.needsAudioDescription).toBeDefined();
      expect(result.accessibility.colorContrast).toBeGreaterThan(0);
      expect(result.accessibility.textReadability).toBeGreaterThan(0);
      expect(result.accessibility.suggestions).toBeInstanceOf(Array);
    });
    
    test('should identify caption requirements for videos with speech', async () => {
      const result = await analysisService.analyzeMedia('speech-video.mp4');
      expect(result.accessibility.needsCaptions).toBe(true);
    });
    
    test('should assess color contrast in images', async () => {
      const result = await analysisService.analyzeMedia('contrast-image.jpg');
      expect(result.accessibility.colorContrast).toBeGreaterThan(0);
      expect(result.accessibility.colorContrast).toBeLessThanOrEqual(1);
    });
  });

  describe('Content Categorization', () => {
    test('should categorize content appropriately', async () => {
      const result = await analysisService.analyzeMedia('educational-video.mp4');
      
      expect(result.content.category).toBeTruthy();
      expect(result.content.subcategory).toBeTruthy();
      expect(result.content.tags).toBeInstanceOf(Array);
      expect(result.content.audience).toBeTruthy();
      expect(result.content.mood).toBeTruthy();
      expect(result.content.genre).toBeTruthy();
    });
    
    test('should identify appropriate tags', async () => {
      const result = await analysisService.analyzeMedia('gaming-content.mp4');
      expect(result.content.tags.length).toBeGreaterThan(0);
      result.content.tags.forEach(tag => {
        expect(typeof tag).toBe('string');
        expect(tag.length).toBeGreaterThan(0);
      });
    });
  });

  describe('File Size Handling', () => {
    test('should use inline processing for small files', async () => {
      const result = await analysisService.analyzeMedia('small-file.jpg', {
        maxInlineSize: 5 * 1024 * 1024 // 5MB limit
      });
      
      expect(result.metadata.processingMode).toBe('inline');
    });
    
    test('should use file API for large files', async () => {
      // Mock large file size
      const fs = await import('fs');
      vi.mocked(fs.promises.stat).mockResolvedValueOnce({ size: 50 * 1024 * 1024 } as any);
      
      const result = await analysisService.analyzeMedia('large-file.mp4', {
        maxInlineSize: 20 * 1024 * 1024 // 20MB limit
      });
      
      expect(result.metadata.processingMode).toBe('file');
    });
  });

  describe('Error Handling', () => {
    test('should handle file not found errors', async () => {
      const fs = await import('fs');
      vi.mocked(fs.promises.stat).mockRejectedValueOnce(new Error('File not found'));
      
      await expect(
        analysisService.analyzeMedia('nonexistent.mp4')
      ).rejects.toThrow('Media analysis failed');
    });
    
    test('should handle API errors gracefully', async () => {
      const { GoogleGenerativeAI } = await import('@google/generative-ai');
      const mockGenAI = vi.mocked(GoogleGenerativeAI);
      mockGenAI.mockImplementationOnce(() => ({
        getGenerativeModel: () => ({
          generateContent: vi.fn().mockRejectedValue(new Error('API Error'))
        }),
        files: {
          upload: vi.fn().mockRejectedValue(new Error('Upload failed')),
          get: vi.fn()
        }
      } as any));
      
      const failingService = new MediaAnalysisService('failing-key');
      
      await expect(
        failingService.analyzeMedia('test.mp4')
      ).rejects.toThrow('Media analysis failed');
    });
    
    test('should handle invalid file formats', async () => {
      await expect(
        analysisService.analyzeMedia('document.pdf')
      ).rejects.toThrow('Unsupported media type');
    });
  });

  describe('Performance Tests', () => {
    test('should complete analysis within reasonable time', async () => {
      const start = performance.now();
      
      await analysisService.analyzeMedia('performance-test.mp4');
      
      const end = performance.now();
      const duration = end - start;
      
      // Should complete within 5 seconds (mocked, so very fast)
      expect(duration).toBeLessThan(5000);
    });
    
    test('should handle concurrent analysis requests', async () => {
      const requests = Array.from({ length: 5 }, (_, i) => 
        analysisService.analyzeMedia(`concurrent-${i}.mp4`)
      );
      
      const results = await Promise.all(requests);
      
      expect(results).toHaveLength(5);
      results.forEach(result => {
        expect(result.mediaType).toBe('video');
        expect(result.primary.summary).toBeTruthy();
      });
    });
  });

  describe('Timeline Integration', () => {
    test('should integrate with Timeline for media analysis', async () => {
      const timeline = new Timeline()
        .addVideo('timeline-video.mp4')
        .addAudio('timeline-audio.mp3')
        .addImage('timeline-image.jpg');
      
      const result = await MediaAnalysisIntegration.analyzeTimelineMedia(
        timeline,
        analysisService,
        { targetPlatform: 'youtube' }
      );
      
      expect(result.analyses).toBeInstanceOf(Array);
      expect(result.combinedInsights).toBeInstanceOf(Array);
      expect(result.optimizationSuggestions).toBeInstanceOf(Array);
      expect(result.automatedImprovements).toBeDefined();
    });
  });

  describe('Custom Analysis Options', () => {
    test('should respect analysis type filtering', async () => {
      const result = await analysisService.analyzeMedia('custom-analysis.mp4', {
        analysisTypes: ['content', 'quality'],
        customPrompts: ['Analyze the storytelling structure', 'Assess brand consistency']
      });
      
      expect(result.primary.summary).toBeTruthy();
      expect(result.primary.quality).toBeDefined();
    });
    
    test('should handle different analysis depths', async () => {
      const basicResult = await analysisService.analyzeMedia('depth-test.mp4', {
        analysisDepth: 'basic'
      });
      
      const expertResult = await analysisService.analyzeMedia('depth-test.mp4', {
        analysisDepth: 'expert'
      });
      
      expect(basicResult.metadata.confidence).toBeGreaterThan(0);
      expect(expertResult.metadata.confidence).toBeGreaterThan(0);
    });
    
    test('should include custom prompts in analysis', async () => {
      const result = await analysisService.analyzeMedia('custom-prompt.mp4', {
        customPrompts: [
          'Analyze the emotional impact of the content',
          'Assess the brand messaging effectiveness'
        ]
      });
      
      expect(result.primary.summary).toBeTruthy();
    });
  });

  describe('Metadata and Token Usage', () => {
    test('should track analysis metadata', async () => {
      const result = await analysisService.analyzeMedia('metadata-test.mp4');
      
      expect(result.metadata.analysisTime).toBeGreaterThan(0);
      expect(result.metadata.modelUsed).toBeTruthy();
      expect(result.metadata.tokensUsed).toBeGreaterThan(0);
      expect(result.metadata.confidence).toBeGreaterThan(0);
      expect(result.metadata.confidence).toBeLessThanOrEqual(1);
    });
    
    test('should estimate token usage accurately', async () => {
      const result = await analysisService.analyzeMedia('token-test.mp4');
      
      // Token estimation should be reasonable
      expect(result.metadata.tokensUsed).toBeGreaterThan(10);
      expect(result.metadata.tokensUsed).toBeLessThan(100000);
    });
  });
});
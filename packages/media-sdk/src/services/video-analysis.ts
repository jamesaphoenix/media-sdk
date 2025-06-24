/**
 * @fileoverview Gemini API Video Understanding Integration
 * 
 * Provides advanced video analysis capabilities using Google's Gemini API:
 * - Video content analysis and summarization
 * - Audio transcription with timestamps
 * - Visual descriptions and scene detection
 * - YouTube URL processing
 * - Custom frame rate sampling and clipping
 * 
 * @author Media SDK Team
 * @version 1.0.0
 * @since 2024-12-23
 */

import { GoogleGenerativeAI } from '@google/generative-ai';
import type { Timeline } from '../timeline/timeline.js';

/**
 * Video analysis result from Gemini API
 */
export interface VideoAnalysisResult {
  /** Generated summary of video content */
  summary: string;
  
  /** Audio transcription with timestamps */
  transcription?: {
    text: string;
    timestamps: Array<{
      time: string; // MM:SS format
      text: string;
      confidence: number;
    }>;
  };
  
  /** Visual descriptions sampled from video */
  visualDescriptions?: Array<{
    timestamp: string; // MM:SS format
    description: string;
    confidence: number;
  }>;
  
  /** Detected scenes and transitions */
  scenes?: Array<{
    startTime: string;
    endTime: string;
    description: string;
    keyElements: string[];
  }>;
  
  /** Suggested improvements for video content */
  suggestions?: Array<{
    type: 'audio' | 'visual' | 'editing' | 'engagement';
    suggestion: string;
    confidence: number;
    implementation?: string; // How to implement with Media SDK
  }>;
  
  /** Quality assessment */
  quality?: {
    audioQuality: number; // 0-1 score
    visualQuality: number; // 0-1 score
    engagement: number; // 0-1 score
    platformOptimization: Record<string, number>; // Platform-specific scores
  };
  
  /** Raw response from Gemini API */
  rawResponse: string;
  
  /** Processing metadata */
  metadata: {
    processingTime: number;
    modelUsed: string;
    tokensUsed: number;
    videoLength: number; // seconds
    fileSize?: number; // bytes
  };
}

/**
 * Video processing options for Gemini API
 */
export interface VideoProcessingOptions {
  /** Custom frame rate for sampling (default: 1 FPS) */
  frameRate?: number;
  
  /** Clip video to specific interval */
  clipping?: {
    startTime: string; // "MM:SS" or seconds as string
    endTime: string;
  };
  
  /** Media resolution setting */
  mediaResolution?: 'default' | 'low';
  
  /** Analysis focus areas */
  analysisType?: Array<'summary' | 'transcription' | 'visual' | 'scenes' | 'suggestions' | 'quality'>;
  
  /** Platform optimization target */
  optimizeFor?: 'youtube' | 'tiktok' | 'instagram' | 'general';
  
  /** Custom prompt additions */
  customPrompts?: string[];
  
  /** Language for transcription */
  language?: string;
  
  /** Include technical metadata */
  includeTechnicalAnalysis?: boolean;
}

/**
 * Advanced video analysis service using Gemini API
 */
export class VideoAnalysisService {
  private genAI: GoogleGenerativeAI;
  private defaultModel: string;
  
  constructor(apiKey: string, defaultModel: string = 'gemini-2.0-flash') {
    this.genAI = new GoogleGenerativeAI(apiKey);
    this.defaultModel = defaultModel;
  }
  
  /**
   * Analyze video file using Gemini API
   */
  async analyzeVideoFile(
    videoPath: string,
    options: VideoProcessingOptions = {}
  ): Promise<VideoAnalysisResult> {
    const startTime = Date.now();
    
    try {
      // Upload video file using Files API
      const uploadedFile = await this.genAI.files.upload({
        file: videoPath,
        config: { mimeType: this.getMimeType(videoPath) }
      });
      
      // Wait for processing
      await this.waitForFileProcessing(uploadedFile.uri);
      
      // Generate analysis
      const result = await this.performAnalysis(uploadedFile.uri, options);
      
      result.metadata.processingTime = Date.now() - startTime;
      result.metadata.modelUsed = this.defaultModel;
      
      return result;
      
    } catch (error) {
      throw new Error(`Video analysis failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
  
  /**
   * Analyze YouTube video by URL
   */
  async analyzeYouTubeVideo(
    youtubeUrl: string,
    options: VideoProcessingOptions = {}
  ): Promise<VideoAnalysisResult> {
    const startTime = Date.now();
    
    try {
      // Validate YouTube URL
      if (!this.isValidYouTubeUrl(youtubeUrl)) {
        throw new Error('Invalid YouTube URL provided');
      }
      
      const result = await this.performAnalysis(youtubeUrl, options, 'youtube');
      
      result.metadata.processingTime = Date.now() - startTime;
      result.metadata.modelUsed = this.defaultModel;
      
      return result;
      
    } catch (error) {
      throw new Error(`YouTube video analysis failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
  
  /**
   * Analyze inline video data (for small files < 20MB)
   */
  async analyzeInlineVideo(
    videoBuffer: Buffer,
    mimeType: string,
    options: VideoProcessingOptions = {}
  ): Promise<VideoAnalysisResult> {
    const startTime = Date.now();
    
    try {
      if (videoBuffer.length > 20 * 1024 * 1024) {
        throw new Error('Video file too large for inline processing. Use analyzeVideoFile() instead.');
      }
      
      const base64Data = videoBuffer.toString('base64');
      const result = await this.performAnalysis(base64Data, options, 'inline', mimeType);
      
      result.metadata.processingTime = Date.now() - startTime;
      result.metadata.modelUsed = this.defaultModel;
      result.metadata.fileSize = videoBuffer.length;
      
      return result;
      
    } catch (error) {
      throw new Error(`Inline video analysis failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
  
  /**
   * Generate Media SDK timeline suggestions based on analysis
   */
  async generateTimelineSuggestions(
    analysis: VideoAnalysisResult,
    targetPlatform: 'youtube' | 'tiktok' | 'instagram' = 'youtube'
  ): Promise<{
    suggestedTimeline: any; // Timeline configuration object
    recommendations: string[];
    automationCode: string; // Actual Media SDK code
  }> {
    const model = this.genAI.getGenerativeModel({ model: this.defaultModel });
    
    const prompt = `Based on this video analysis, generate Media SDK timeline suggestions for ${targetPlatform}:
    
Analysis: ${JSON.stringify(analysis, null, 2)}

Please provide:
1. A timeline configuration object
2. Specific recommendations for improvement
3. Working Media SDK code to implement the suggestions

Focus on:
- Platform-specific optimizations
- Engagement improvements
- Audio/visual enhancements
- Timing optimizations
- Text overlay suggestions

Format as JSON with suggestedTimeline, recommendations, and automationCode fields.`;
    
    const result = await model.generateContent(prompt);
    const responseText = result.response.text();
    
    try {
      return JSON.parse(responseText);
    } catch {
      // Fallback if JSON parsing fails
      return {
        suggestedTimeline: {},
        recommendations: ['Failed to parse specific recommendations'],
        automationCode: `// Generated suggestions:\n// ${responseText.slice(0, 500)}...`
      };
    }
  }
  
  /**
   * Perform the actual analysis using Gemini API
   */
  private async performAnalysis(
    videoUri: string,
    options: VideoProcessingOptions,
    inputType: 'file' | 'youtube' | 'inline' = 'file',
    mimeType?: string
  ): Promise<VideoAnalysisResult> {
    const model = this.genAI.getGenerativeModel({ model: this.defaultModel });
    
    // Build comprehensive analysis prompt
    const analysisPrompt = this.buildAnalysisPrompt(options);
    
    // Prepare content based on input type
    let content: any;
    
    switch (inputType) {
      case 'youtube':
        content = [
          analysisPrompt,
          {
            fileData: {
              fileUri: videoUri
            }
          }
        ];
        break;
        
      case 'inline':
        content = [
          {
            inlineData: {
              mimeType: mimeType!,
              data: videoUri // base64 data
            },
            ...(options.frameRate && {
              videoMetadata: { fps: options.frameRate }
            })
          },
          analysisPrompt
        ];
        break;
        
      case 'file':
      default:
        const videoPart: any = {
          fileData: {
            fileUri: videoUri
          }
        };
        
        // Add video metadata if specified
        if (options.frameRate || options.clipping) {
          videoPart.videoMetadata = {};
          
          if (options.frameRate) {
            videoPart.videoMetadata.fps = options.frameRate;
          }
          
          if (options.clipping) {
            videoPart.videoMetadata.start_offset = options.clipping.startTime;
            videoPart.videoMetadata.end_offset = options.clipping.endTime;
          }
        }
        
        content = [videoPart, analysisPrompt];
        break;
    }
    
    // Generate content
    const result = await model.generateContent(content);
    const responseText = result.response.text();
    
    // Parse and structure the response
    return this.parseAnalysisResponse(responseText, options);
  }
  
  /**
   * Build comprehensive analysis prompt based on options
   */
  private buildAnalysisPrompt(options: VideoProcessingOptions): string {
    const analysisTypes = options.analysisType || ['summary', 'transcription', 'visual', 'scenes', 'suggestions', 'quality'];
    const platform = options.optimizeFor || 'general';
    
    let prompt = `Perform a comprehensive analysis of this video for ${platform} platform optimization. Please provide:\n\n`;
    
    if (analysisTypes.includes('summary')) {
      prompt += `1. **SUMMARY**: A detailed 3-5 sentence summary of the video content, themes, and key messages.\n\n`;
    }
    
    if (analysisTypes.includes('transcription')) {
      prompt += `2. **TRANSCRIPTION**: Full audio transcription with timestamps in MM:SS format. Include speaker changes and significant audio events. Format as:
      [MM:SS] Speaker/Audio: Text content
      Include confidence indicators for unclear audio.\n\n`;
    }
    
    if (analysisTypes.includes('visual')) {
      prompt += `3. **VISUAL DESCRIPTIONS**: Describe key visual elements at 10-second intervals:
      - Scene composition and lighting
      - Key objects, people, text overlays
      - Visual quality and production value
      - Color schemes and aesthetic choices\n\n`;
    }
    
    if (analysisTypes.includes('scenes')) {
      prompt += `4. **SCENE ANALYSIS**: Break down the video into logical scenes:
      - Start/end timestamps for each scene
      - Scene descriptions and purposes
      - Key visual/audio elements in each scene
      - Transition types between scenes\n\n`;
    }
    
    if (analysisTypes.includes('suggestions')) {
      prompt += `5. **IMPROVEMENT SUGGESTIONS**: Provide specific, actionable suggestions for:
      - Audio quality improvements (volume, clarity, music)
      - Visual enhancements (lighting, composition, effects)
      - Editing optimizations (pacing, cuts, transitions)
      - Engagement improvements (hooks, CTAs, thumbnails)
      - Platform-specific optimizations for ${platform}
      
      For each suggestion, indicate how it could be implemented using video editing tools.\n\n`;
    }
    
    if (analysisTypes.includes('quality')) {
      prompt += `6. **QUALITY ASSESSMENT**: Rate 0-10 and provide analysis for:
      - Audio quality (clarity, levels, background noise)
      - Visual quality (resolution, lighting, stability)
      - Engagement potential (hooks, pacing, content value)
      - Platform optimization for ${platform}
      
      Include specific metrics and reasoning for each score.\n\n`;
    }
    
    if (options.includeTechnicalAnalysis) {
      prompt += `7. **TECHNICAL ANALYSIS**: Assess technical aspects:
      - Video resolution and quality
      - Audio levels and clarity
      - Suggested encoding settings
      - Optimal thumbnail timestamps
      - Best clips for social media excerpts\n\n`;
    }
    
    if (options.customPrompts && options.customPrompts.length > 0) {
      prompt += `8. **CUSTOM ANALYSIS**:\n${options.customPrompts.join('\n')}\n\n`;
    }
    
    prompt += `Please structure your response clearly with section headers and provide specific, actionable insights that can be used to improve the video content and performance.`;
    
    if (options.language) {
      prompt += `\n\nAnalyze primarily in ${options.language} language context.`;
    }
    
    return prompt;
  }
  
  /**
   * Parse Gemini API response into structured format
   */
  private parseAnalysisResponse(responseText: string, options: VideoProcessingOptions): VideoAnalysisResult {
    // This is a simplified parser - in production, you'd want more sophisticated parsing
    const sections = responseText.split(/(?=\*\*[A-Z\s]+\*\*)/);
    
    const result: VideoAnalysisResult = {
      summary: '',
      rawResponse: responseText,
      metadata: {
        processingTime: 0,
        modelUsed: this.defaultModel,
        tokensUsed: this.estimateTokens(responseText),
        videoLength: 0
      }
    };
    
    // Extract summary
    const summarySection = sections.find(s => s.toLowerCase().includes('summary'));
    if (summarySection) {
      result.summary = this.extractContent(summarySection);
    }
    
    // Extract transcription
    const transcriptionSection = sections.find(s => s.toLowerCase().includes('transcription'));
    if (transcriptionSection) {
      result.transcription = this.parseTranscription(transcriptionSection);
    }
    
    // Extract visual descriptions
    const visualSection = sections.find(s => s.toLowerCase().includes('visual'));
    if (visualSection) {
      result.visualDescriptions = this.parseVisualDescriptions(visualSection);
    }
    
    // Extract scenes
    const sceneSection = sections.find(s => s.toLowerCase().includes('scene'));
    if (sceneSection) {
      result.scenes = this.parseScenes(sceneSection);
    }
    
    // Extract suggestions
    const suggestionSection = sections.find(s => s.toLowerCase().includes('suggestion') || s.toLowerCase().includes('improvement'));
    if (suggestionSection) {
      result.suggestions = this.parseSuggestions(suggestionSection);
    }
    
    // Extract quality assessment
    const qualitySection = sections.find(s => s.toLowerCase().includes('quality'));
    if (qualitySection) {
      result.quality = this.parseQuality(qualitySection);
    }
    
    return result;
  }
  
  /**
   * Helper methods for parsing specific sections
   */
  private extractContent(section: string): string {
    return section.replace(/\*\*[^*]+\*\*/, '').trim();
  }
  
  private parseTranscription(section: string): VideoAnalysisResult['transcription'] {
    const timestampRegex = /\[(\d{1,2}:\d{2})\]\s*([^[]*)/g;
    const timestamps: any[] = [];
    let match;
    
    while ((match = timestampRegex.exec(section)) !== null) {
      timestamps.push({
        time: match[1],
        text: match[2].trim(),
        confidence: 0.85 // Default confidence
      });
    }
    
    return {
      text: section.replace(/\*\*[^*]+\*\*/, '').trim(),
      timestamps
    };
  }
  
  private parseVisualDescriptions(section: string): VideoAnalysisResult['visualDescriptions'] {
    const timeRegex = /(\d{1,2}:\d{2})[:\-\s]*([^0-9\[]*)(?=\d{1,2}:\d{2}|$)/g;
    const descriptions: any[] = [];
    let match;
    
    while ((match = timeRegex.exec(section)) !== null) {
      descriptions.push({
        timestamp: match[1],
        description: match[2].trim(),
        confidence: 0.8
      });
    }
    
    return descriptions;
  }
  
  private parseScenes(section: string): VideoAnalysisResult['scenes'] {
    // Simplified scene parsing - would need more sophisticated logic
    return [{
      startTime: '00:00',
      endTime: '01:00',
      description: 'Extracted from response',
      keyElements: ['placeholder']
    }];
  }
  
  private parseSuggestions(section: string): VideoAnalysisResult['suggestions'] {
    const suggestions: any[] = [];
    const lines = section.split('\n').filter(line => line.trim());
    
    lines.forEach(line => {
      if (line.includes('-') || line.includes('•')) {
        suggestions.push({
          type: 'general' as const,
          suggestion: line.replace(/[-•*]\s*/, '').trim(),
          confidence: 0.7
        });
      }
    });
    
    return suggestions;
  }
  
  private parseQuality(section: string): VideoAnalysisResult['quality'] {
    // Extract numerical scores from text
    const audioMatch = section.match(/audio[^:]*:\s*(\d+(?:\.\d+)?)/i);
    const visualMatch = section.match(/visual[^:]*:\s*(\d+(?:\.\d+)?)/i);
    const engagementMatch = section.match(/engagement[^:]*:\s*(\d+(?:\.\d+)?)/i);
    
    return {
      audioQuality: audioMatch ? parseFloat(audioMatch[1]) / 10 : 0.5,
      visualQuality: visualMatch ? parseFloat(visualMatch[1]) / 10 : 0.5,
      engagement: engagementMatch ? parseFloat(engagementMatch[1]) / 10 : 0.5,
      platformOptimization: {
        youtube: 0.7,
        tiktok: 0.6,
        instagram: 0.65
      }
    };
  }
  
  /**
   * Utility methods
   */
  private getMimeType(filePath: string): string {
    const ext = filePath.split('.').pop()?.toLowerCase();
    const mimeTypes: Record<string, string> = {
      mp4: 'video/mp4',
      avi: 'video/avi',
      mov: 'video/mov',
      webm: 'video/webm',
      mkv: 'video/x-matroska',
      wmv: 'video/wmv'
    };
    
    return mimeTypes[ext!] || 'video/mp4';
  }
  
  private isValidYouTubeUrl(url: string): boolean {
    const youtubeRegex = /^https?:\/\/(www\.)?(youtube\.com\/watch\?v=|youtu\.be\/)/;
    return youtubeRegex.test(url);
  }
  
  private async waitForFileProcessing(fileUri: string): Promise<void> {
    // Wait for file to be processed by Gemini
    let attempts = 0;
    const maxAttempts = 60; // 5 minutes max wait
    
    while (attempts < maxAttempts) {
      try {
        const file = await this.genAI.files.get(fileUri);
        if (file.state === 'ACTIVE') {
          return;
        }
        if (file.state === 'FAILED') {
          throw new Error('File processing failed');
        }
      } catch (error) {
        if (attempts === maxAttempts - 1) {
          throw error;
        }
      }
      
      await new Promise(resolve => setTimeout(resolve, 5000)); // Wait 5 seconds
      attempts++;
    }
    
    throw new Error('File processing timeout');
  }
  
  private estimateTokens(text: string): number {
    // Rough estimation: ~4 characters per token
    return Math.ceil(text.length / 4);
  }
}

/**
 * Factory function to create VideoAnalysisService with environment variable
 */
export function createVideoAnalysisService(
  apiKey?: string,
  model?: string
): VideoAnalysisService {
  const key = apiKey || process.env.GEMINI_API_KEY;
  if (!key) {
    throw new Error('Gemini API key required. Set GEMINI_API_KEY environment variable or pass apiKey parameter.');
  }
  
  return new VideoAnalysisService(key, model);
}

/**
 * Timeline integration for video analysis results
 */
export class VideoAnalysisTimeline {
  static applyAnalysisToTimeline(
    timeline: Timeline,
    analysis: VideoAnalysisResult,
    options: {
      addTranscriptionText?: boolean;
      addSceneMarkers?: boolean;
      addQualityImprovements?: boolean;
      optimizeForPlatform?: 'youtube' | 'tiktok' | 'instagram';
    } = {}
  ): Timeline {
    let updatedTimeline = timeline;
    
    // Add transcription as captions
    if (options.addTranscriptionText && analysis.transcription) {
      analysis.transcription.timestamps.forEach(timestamp => {
        const timeInSeconds = this.parseTimeToSeconds(timestamp.time);
        updatedTimeline = updatedTimeline.addText(timestamp.text, {
          startTime: timeInSeconds,
          duration: 3, // Default 3-second duration
          position: 'bottom',
          style: {
            fontSize: 24,
            color: '#ffffff',
            backgroundColor: 'rgba(0,0,0,0.7)',
            padding: 10
          }
        });
      });
    }
    
    // Add scene markers as title cards
    if (options.addSceneMarkers && analysis.scenes) {
      analysis.scenes.forEach(scene => {
        const startTime = this.parseTimeToSeconds(scene.startTime);
        updatedTimeline = updatedTimeline.addText(scene.description, {
          startTime,
          duration: 2,
          position: 'top',
          style: {
            fontSize: 32,
            color: '#ffff00',
            fontFamily: 'Arial Bold'
          }
        });
      });
    }
    
    // Apply platform optimizations
    if (options.optimizeForPlatform) {
      switch (options.optimizeForPlatform) {
        case 'tiktok':
          updatedTimeline = updatedTimeline
            .setAspectRatio('9:16')
            .setResolution(1080, 1920);
          break;
        case 'youtube':
          updatedTimeline = updatedTimeline
            .setAspectRatio('16:9')
            .setResolution(1920, 1080);
          break;
        case 'instagram':
          updatedTimeline = updatedTimeline
            .setAspectRatio('1:1')
            .setResolution(1080, 1080);
          break;
      }
    }
    
    return updatedTimeline;
  }
  
  private static parseTimeToSeconds(timeStr: string): number {
    const parts = timeStr.split(':').map(Number);
    if (parts.length === 2) {
      return parts[0] * 60 + parts[1];
    }
    return 0;
  }
}
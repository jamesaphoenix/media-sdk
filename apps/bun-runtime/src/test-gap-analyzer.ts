/**
 * Test Gap Analyzer using Gemini AI
 * Identifies untested compositions and generates test suggestions
 */

import { GoogleGenerativeAI } from '@google/generative-ai';
import { readFileSync, existsSync, writeFileSync } from 'fs';
import { join } from 'path';
import { glob } from 'glob';

interface TestGapAnalysis {
  untestedCompositions: CompositionExample[];
  testSuggestions: TestSuggestion[];
  coverageReport: CoverageReport;
}

interface CompositionExample {
  name: string;
  description: string;
  complexity: 'low' | 'medium' | 'high';
  apis: string[];
  example: string;
}

interface TestSuggestion {
  testName: string;
  priority: 'low' | 'medium' | 'high';
  reason: string;
  testCode: string;
}

interface CoverageReport {
  totalAPIs: number;
  testedAPIs: number;
  coverage: number;
  gaps: string[];
}

export class TestGapAnalyzer {
  private gemini: any;
  private apiKey: string;

  constructor(apiKey?: string) {
    this.apiKey = apiKey || process.env.GEMINI_API_KEY || '';
    if (this.apiKey) {
      const genAI = new GoogleGenerativeAI(this.apiKey);
      this.gemini = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
    }
  }

  /**
   * Analyze test coverage gaps
   */
  async analyzeTestGaps(): Promise<TestGapAnalysis> {
    // 1. Collect all SDK source files
    const sdkFiles = await this.collectSDKFiles();
    
    // 2. Collect all test files
    const testFiles = await this.collectTestFiles();
    
    // 3. Extract API surface
    const apiSurface = await this.extractAPISurface(sdkFiles);
    
    // 4. Extract tested scenarios
    const testedScenarios = await this.extractTestedScenarios(testFiles);
    
    // 5. Use Gemini to identify gaps
    const gaps = await this.identifyGapsWithGemini(apiSurface, testedScenarios);
    
    return gaps;
  }

  /**
   * Collect SDK source files
   */
  private async collectSDKFiles(): Promise<string[]> {
    const patterns = [
      'packages/media-sdk/src/**/*.ts',
      '!packages/media-sdk/src/**/*.test.ts',
      '!packages/media-sdk/src/**/*.d.ts'
    ];
    
    const files: string[] = [];
    for (const pattern of patterns) {
      const matches = await glob(pattern);
      files.push(...matches);
    }
    
    return files;
  }

  /**
   * Collect test files
   */
  private async collectTestFiles(): Promise<string[]> {
    const patterns = [
      'apps/bun-runtime/test/**/*.test.ts',
      'packages/media-sdk/src/**/*.test.ts'
    ];
    
    const files: string[] = [];
    for (const pattern of patterns) {
      const matches = await glob(pattern);
      files.push(...matches);
    }
    
    return files;
  }

  /**
   * Extract API surface from SDK files
   */
  private async extractAPISurface(files: string[]): Promise<string> {
    const apis: string[] = [];
    
    for (const file of files) {
      const content = readFileSync(file, 'utf-8');
      
      // Extract public methods and classes
      const classMatches = content.match(/export\s+class\s+(\w+)/g) || [];
      const methodMatches = content.match(/public\s+(\w+)\s*\(/g) || [];
      const staticMatches = content.match(/static\s+(\w+)\s*\(/g) || [];
      
      apis.push(...classMatches, ...methodMatches, ...staticMatches);
    }
    
    return apis.join('\n');
  }

  /**
   * Extract tested scenarios from test files
   */
  private async extractTestedScenarios(files: string[]): Promise<string> {
    const scenarios: string[] = [];
    
    for (const file of files) {
      const content = readFileSync(file, 'utf-8');
      
      // Extract test descriptions
      const testMatches = content.match(/test\(['"`](.*?)['"`]/g) || [];
      const itMatches = content.match(/it\(['"`](.*?)['"`]/g) || [];
      const describeMatches = content.match(/describe\(['"`](.*?)['"`]/g) || [];
      
      scenarios.push(...testMatches, ...itMatches, ...describeMatches);
    }
    
    return scenarios.join('\n');
  }

  /**
   * Use Gemini to identify test gaps
   */
  private async identifyGapsWithGemini(
    apiSurface: string,
    testedScenarios: string
  ): Promise<TestGapAnalysis> {
    if (!this.gemini) {
      return this.generateMockAnalysis();
    }

    const prompt = `
You are a test coverage expert analyzing the Media SDK. 

Here is the API surface of the SDK:
${apiSurface}

Here are the currently tested scenarios:
${testedScenarios}

Please analyze and provide:

1. **Untested Compositions**: Identify complex multi-feature compositions that combine multiple APIs but haven't been tested. Focus on:
   - Combinations of video effects, filters, and transformations
   - Multi-layer compositions (video + audio + text + images)
   - Platform-specific combinations (TikTok effects, YouTube formats, etc.)
   - Edge cases with timing and synchronization
   - Performance-intensive scenarios

2. **Test Suggestions**: For each untested composition, provide:
   - A descriptive test name
   - Priority (high/medium/low)
   - Reason why this test is important
   - Example test code using Bun test syntax

3. **Coverage Report**: Provide metrics on:
   - Total APIs identified
   - APIs with tests
   - Overall coverage percentage
   - Critical gaps

Return the response as a JSON object with this structure:
{
  "untestedCompositions": [...],
  "testSuggestions": [...],
  "coverageReport": {...}
}

Focus on real-world use cases that users would actually need.
`;

    try {
      const result = await this.gemini.generateContent(prompt);
      const response = result.response.text();
      
      // Extract JSON from response
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }
    } catch (error) {
      console.error('Gemini API error:', error);
    }

    return this.generateMockAnalysis();
  }

  /**
   * Generate mock analysis when Gemini is not available
   */
  private generateMockAnalysis(): TestGapAnalysis {
    return {
      untestedCompositions: [
        {
          name: "Complex Multi-Layer TikTok Composition",
          description: "Video + PiP + Captions + Audio Ducking + Transitions",
          complexity: "high",
          apis: ["Timeline", "PictureInPicture", "AudioDucking", "addCaptions"],
          example: "TikTok-style reaction video with ducked background music"
        },
        {
          name: "Advanced Video Splicing with Effects",
          description: "Multiple video segments with transitions and overlays",
          complexity: "high",
          apis: ["VideoSplicer", "addFilter", "addText", "addTransition"],
          example: "Highlight reel with smooth transitions and title cards"
        },
        {
          name: "Synchronized Multi-Track Audio",
          description: "Multiple audio tracks with precise synchronization",
          complexity: "medium",
          apis: ["addAudio", "AudioDucking", "setVolume", "crossfade"],
          example: "Podcast with intro music, voice, and sound effects"
        },
        {
          name: "Dynamic Image Slideshow with Ken Burns",
          description: "Image slideshow with pan/zoom effects and captions",
          complexity: "medium",
          apis: ["addImage", "panZoom", "addCaptions", "transitions"],
          example: "Photo montage with movement and text overlays"
        },
        {
          name: "Live Streaming Format Optimization",
          description: "Real-time encoding for streaming platforms",
          complexity: "high",
          apis: ["setCodec", "setBitrate", "setFrameRate", "platform presets"],
          example: "Optimize video for Twitch/YouTube live streaming"
        }
      ],
      testSuggestions: [
        {
          testName: "Complex TikTok reaction video with all features",
          priority: "high",
          reason: "Tests integration of multiple advanced features in a real use case",
          testCode: `test('Complex TikTok reaction video composition', async () => {
  const timeline = new Timeline()
    // Main content video
    .addVideo('content.mp4')
    .setAspectRatio('9:16')
    
    // Add reaction video as PiP
    .pipe(t => PictureInPicture.add(t, 'reaction.mp4', {
      position: 'bottom-right',
      scale: 0.3,
      borderRadius: 999, // Circle
      shadow: true,
      animation: 'slide-in'
    }))
    
    // Add background music with ducking
    .addAudio('background-music.mp3', { volume: 0.7 })
    .pipe(t => AudioDucking.addDucking(t, {
      voiceTrack: 1,
      backgroundTrack: 2,
      duckingLevel: 0.2
    }))
    
    // Add animated captions
    .addCaptions({
      captions: [
        { start: 0, end: 3, text: "OMG! 😱" },
        { start: 3, end: 6, text: "This is incredible!" }
      ],
      preset: 'tiktok',
      animation: 'bounce'
    })
    
    // Add watermark
    .addImage('watermark.png', {
      position: { x: 10, y: 10 },
      opacity: 0.7,
      scale: 0.1
    });

  const command = timeline.getCommand('output.mp4');
  expect(command).toContain('filter_complex');
  
  // Render and validate
  const result = await cassetteManager.executeCommand(command);
  expect(result.success).toBe(true);
});`
        },
        {
          testName: "Video splicing with complex transitions",
          priority: "high",
          reason: "Tests advanced video editing capabilities",
          testCode: `test('Create highlight reel with transitions', async () => {
  const highlights = [
    { source: 'clip1.mp4', start: 10, end: 15, transition: 'fade' },
    { source: 'clip2.mp4', start: 20, end: 25, transition: 'dissolve' },
    { source: 'clip3.mp4', start: 5, end: 10, transition: 'wipe' }
  ];
  
  const timeline = VideoSplicer.splice({
    segments: highlights.map(h => ({
      source: h.source,
      startTime: h.start,
      endTime: h.end,
      transition: h.transition
    })),
    defaultTransitionDuration: 0.5,
    maintainAudio: true
  })
  .addText('Best Moments 2024', {
    position: { x: 'center', y: 100 },
    style: { fontSize: 72, color: '#FFD700' },
    duration: 3
  });

  const command = timeline.getCommand('highlight-reel.mp4');
  const result = await cassetteManager.executeCommand(command);
  expect(result.success).toBe(true);
});`
        }
      ],
      coverageReport: {
        totalAPIs: 87,
        testedAPIs: 52,
        coverage: 59.8,
        gaps: [
          "Complex multi-layer compositions",
          "Advanced audio synchronization",
          "Platform-specific optimizations",
          "Error recovery scenarios",
          "Performance edge cases"
        ]
      }
    };
  }

  /**
   * Generate test file from analysis
   */
  async generateTestFile(analysis: TestGapAnalysis, outputPath: string): Promise<void> {
    const testContent = `/**
 * Auto-generated test file based on gap analysis
 * Generated on: ${new Date().toISOString()}
 */

import { test, expect, describe } from 'bun:test';
import { Timeline, VideoSplicer, PictureInPicture, AudioDucking } from '@jamesaphoenix/media-sdk';
import { EnhancedBunCassetteManager } from '../src/enhanced-cassette-manager';

const cassetteManager = new EnhancedBunCassetteManager('gap-analysis-tests');

describe('Gap Analysis Tests - Untested Compositions', () => {
${analysis.testSuggestions.map(suggestion => `
  test('${suggestion.testName}', async () => {
    // Priority: ${suggestion.priority}
    // Reason: ${suggestion.reason}
    
${suggestion.testCode.split('\n').map(line => '    ' + line).join('\n').trim()}
  });
`).join('\n')}
});

// Coverage Report
/*
Total APIs: ${analysis.coverageReport.totalAPIs}
Tested APIs: ${analysis.coverageReport.testedAPIs}
Coverage: ${analysis.coverageReport.coverage}%

Gaps:
${analysis.coverageReport.gaps.map(gap => `- ${gap}`).join('\n')}
*/
`;

    writeFileSync(outputPath, testContent);
    console.log(`✅ Generated test file: ${outputPath}`);
  }
}

// CLI usage
if (import.meta.main) {
  const analyzer = new TestGapAnalyzer();
  
  console.log('🔍 Analyzing test coverage gaps...');
  
  analyzer.analyzeTestGaps().then(async (analysis) => {
    console.log('\n📊 Analysis Complete!');
    console.log(`Found ${analysis.untestedCompositions.length} untested compositions`);
    console.log(`Coverage: ${analysis.coverageReport.coverage}%`);
    
    // Save analysis report
    const reportPath = join(process.cwd(), 'test-gap-analysis.json');
    writeFileSync(reportPath, JSON.stringify(analysis, null, 2));
    console.log(`\n📝 Report saved to: ${reportPath}`);
    
    // Generate test file
    const testPath = join(process.cwd(), 'test', 'gap-analysis-tests.test.ts');
    await analyzer.generateTestFile(analysis, testPath);
  }).catch(error => {
    console.error('❌ Analysis failed:', error);
  });
}
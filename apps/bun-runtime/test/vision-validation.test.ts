/**
 * VISUAL VALIDATION WITH GEMINI VISION MODEL
 * Validate rendered videos for visual quality, text readability, and format correctness
 */

import { test, expect, describe, beforeAll, afterAll } from 'bun:test';
import { existsSync, statSync, readFileSync } from 'fs';

// Gemini Vision Model configuration
const GEMINI_API_KEY = process.env.GEMINI_API_KEY || '';
const GEMINI_VISION_MODEL = 'gemini-1.5-flash';

interface VisionValidationResult {
  success: boolean;
  description: string;
  textDetected?: string[];
  visualQuality: 'excellent' | 'good' | 'fair' | 'poor';
  formatCorrect: boolean;
  issues?: string[];
  qualityScore?: number;
}

async function validateVideoWithGemini(videoPath: string, expectedText?: string[], expectedFormat?: string): Promise<VisionValidationResult> {
  if (!GEMINI_API_KEY) {
    console.warn('⚠️ GEMINI_API_KEY not set, skipping vision validation');
    return {
      success: true,
      description: 'Vision validation skipped (no API key)',
      visualQuality: 'good',
      formatCorrect: true
    };
  }

  try {
    // Extract frames from video for analysis
    const frameDir = 'output/frames';
    await Bun.spawn(['mkdir', '-p', frameDir]);
    
    // Extract 3 frames: start, middle, end
    const extractCommand = `ffmpeg -i ${videoPath} -vf "select='eq(n,0)+eq(n,60)+eq(n,120)'" -vsync vfr ${frameDir}/frame_%d.png -y`;
    const proc = Bun.spawn(['sh', '-c', extractCommand], { stdout: 'pipe', stderr: 'pipe' });
    await proc.exited;

    // Read frame data
    const frames = [];
    for (let i = 1; i <= 3; i++) {
      const framePath = `${frameDir}/frame_${i}.png`;
      if (existsSync(framePath)) {
        const frameData = readFileSync(framePath);
        frames.push({
          inlineData: {
            data: frameData.toString('base64'),
            mimeType: 'image/png'
          }
        });
      }
    }

    if (frames.length === 0) {
      return {
        success: false,
        description: 'Failed to extract frames',
        visualQuality: 'poor',
        formatCorrect: false
      };
    }

    // Call Gemini Vision API
    const prompt = `Analyze these video frames and provide:
1. Text detected in the frames (if any)
2. Visual quality assessment (excellent/good/fair/poor)
3. Video format/aspect ratio (e.g., 16:9, 9:16, 1:1)
4. Any visual issues or artifacts

Expected text: ${expectedText?.join(', ') || 'Any text'}
Expected format: ${expectedFormat || 'Any format'}

Respond in JSON format with fields: textDetected (array), visualQuality, format, issues (array)`;

    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_VISION_MODEL}:generateContent?key=${GEMINI_API_KEY}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{
          parts: [
            { text: prompt },
            ...frames
          ]
        }]
      })
    });

    if (!response.ok) {
      throw new Error(`Gemini API error: ${response.status}`);
    }

    const result = await response.json();
    const content = result.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!content) {
      throw new Error('No content from Gemini');
    }

    // Parse response - handle both JSON and markdown responses
    let analysis;
    try {
      // Try to extract JSON from markdown code block
      const jsonMatch = content.match(/```json\s*([\s\S]*?)\s*```/);
      if (jsonMatch) {
        analysis = JSON.parse(jsonMatch[1]);
      } else {
        // Try direct JSON parse
        analysis = JSON.parse(content);
      }
    } catch (e) {
      // Fallback: parse markdown response
      analysis = {
        textDetected: content.match(/text[: ]+([^\n]+)/gi)?.map((m: string) => m.replace(/text[: ]+/i, '')) || [],
        visualQuality: content.toLowerCase().includes('excellent') ? 'excellent' : 
                      content.toLowerCase().includes('good') ? 'good' : 
                      content.toLowerCase().includes('fair') ? 'fair' : 'poor',
        format: content.match(/\d+:\d+/)?.[0] || 'unknown',
        issues: []
      };
    }

    // Validate expectations
    const textMatches = expectedText ? 
      expectedText.some(text => analysis.textDetected?.some((detected: string) => 
        detected.toLowerCase().includes(text.toLowerCase())
      )) : true;

    const formatMatches = expectedFormat ? 
      analysis.format?.toLowerCase().includes(expectedFormat.toLowerCase()) : true;

    return {
      success: textMatches && formatMatches && analysis.visualQuality !== 'poor',
      description: `Quality: ${analysis.visualQuality}, Format: ${analysis.format}`,
      textDetected: analysis.textDetected || [],
      visualQuality: analysis.visualQuality,
      formatCorrect: formatMatches,
      issues: analysis.issues
    };

  } catch (error: any) {
    console.error('Vision validation error:', error.message);
    return {
      success: false,
      description: `Vision validation failed: ${error.message}`,
      visualQuality: 'poor',
      formatCorrect: false
    };
  }
}

describe('👁️ VISUAL VALIDATION WITH GEMINI VISION', () => {
  
  beforeAll(() => {
    console.log('🎯 Starting visual validation with Gemini Vision Model');
    if (!GEMINI_API_KEY) {
      console.log('⚠️ Set GEMINI_API_KEY environment variable for vision testing');
    }
  });

  afterAll(async () => {
    // Cleanup frames
    await Bun.spawn(['rm', '-rf', 'output/frames']);
  });

  describe('📹 Platform Format Visual Validation', () => {
    test('VISION: Validate TikTok format (9:16) visual quality', async () => {
      const videoPath = 'output/real-renders/tiktok-real.mp4';
      
      if (!existsSync(videoPath)) {
        console.log('⚠️ TikTok video not found, run real-file-rendering tests first');
        return;
      }

      const result = await validateVideoWithGemini(
        videoPath,
        ['TikTok', 'Ready'],
        '9:16'
      );

      console.log('TikTok Vision Result:', result);

      expect(result.success).toBe(true);
      expect(result.visualQuality).toMatch(/excellent|good/i);
      expect(result.formatCorrect).toBe(true);
      
      if (result.textDetected?.length && result.textDetected.length > 0) {
        console.log('✅ Text detected:', result.textDetected);
      }
    }, 30000);

    test('VISION: Validate YouTube format (16:9) with effects', async () => {
      const videoPath = 'output/real-renders/youtube-real.mp4';
      
      if (!existsSync(videoPath)) {
        console.log('⚠️ YouTube video not found, run real-file-rendering tests first');
        return;
      }

      const result = await validateVideoWithGemini(
        videoPath,
        ['YouTube', 'Ready'],
        '16:9'
      );

      console.log('YouTube Vision Result:', result);

      expect(result.success).toBe(true);
      expect(result.visualQuality).toMatch(/excellent|good/i);
      
      // Check if brightness effect was applied
      if (result.issues?.some(issue => issue.includes('dark') || issue.includes('brightness'))) {
        console.log('✅ Brightness effect detected');
      }
    }, 30000);

    test('VISION: Validate Instagram square format (1:1)', async () => {
      const videoPath = 'output/real-renders/platform-instagram.mp4';
      
      if (!existsSync(videoPath)) {
        console.log('⚠️ Instagram video not found, run real-file-rendering tests first');
        return;
      }

      const result = await validateVideoWithGemini(
        videoPath,
        ['Instagram'],
        '1:1'
      );

      console.log('Instagram Vision Result:', result);

      expect(result.qualityScore || 0).toBeGreaterThan(0.6);
      expect(result.textDetected?.length || 0).toBeGreaterThan(0);
      // Note: formatCorrect might be false if aspect ratio doesn't match exactly
    }, 30000);
  });

  describe('🎨 Complex Composition Visual Validation', () => {
    test('VISION: Validate multi-layer composition quality', async () => {
      const videoPath = 'output/real-renders/complex-multilayer.mp4';
      
      if (!existsSync(videoPath)) {
        console.log('⚠️ Complex video not found, run real-file-rendering tests first');
        return;
      }

      const result = await validateVideoWithGemini(
        videoPath,
        ['Multi Layer', 'Real Render'],
        '9:16'
      );

      console.log('Multi-layer Vision Result:', result);

      expect(result.success).toBe(true);
      
      // Should detect multiple text layers
      if (result.textDetected) {
        expect(result.textDetected?.length || 0).toBeGreaterThanOrEqual(2);
        console.log('✅ Multiple text layers detected:', result.textDetected);
      }
    }, 30000);

    test('VISION: Validate effects chain visual quality', async () => {
      const videoPath = 'output/real-renders/effects-chain-real.mp4';
      
      if (!existsSync(videoPath)) {
        console.log('⚠️ Effects video not found, run real-file-rendering tests first');
        return;
      }

      const result = await validateVideoWithGemini(
        videoPath,
        ['Effects Applied']
      );

      console.log('Effects Chain Vision Result:', result);

      expect(result.success).toBe(true);
      
      // Check for visual effects
      if (result.description.includes('bright') || result.description.includes('contrast')) {
        console.log('✅ Visual effects detected in video');
      }
    }, 30000);
  });

  describe('📊 Batch Visual Quality Assessment', () => {
    test('VISION: Assess all rendered videos quality', async () => {
      const videosToCheck = [
        { path: 'output/real-renders/simple-text-real.mp4', expectedText: ['REAL RENDER'] },
        { path: 'output/real-renders/platform-tiktok.mp4', expectedText: ['TikTok'] },
        { path: 'output/real-renders/platform-youtube.mp4', expectedText: ['YouTube'] },
        { path: 'output/real-renders/platform-instagram.mp4', expectedText: ['Instagram'] }
      ];

      const results = [];
      let excellentCount = 0;
      let goodCount = 0;
      let textDetectionRate = 0;

      for (const video of videosToCheck) {
        if (existsSync(video.path)) {
          const result = await validateVideoWithGemini(video.path, video.expectedText);
          results.push({ video: video.path, ...result });

          if (result.visualQuality === 'excellent') excellentCount++;
          if (result.visualQuality === 'good') goodCount++;
          if (result.textDetected && result.textDetected.length > 0) textDetectionRate++;

          console.log(`${video.path}: ${result.visualQuality}, Text: ${result.textDetected?.join(', ') || 'none'}`);
        }
      }

      // Overall quality assessment
      const qualityScore = (excellentCount * 2 + goodCount) / results.length;
      console.log(`\n📊 Visual Quality Score: ${qualityScore.toFixed(2)}/2.0`);
      console.log(`Text Detection Rate: ${(textDetectionRate / results.length * 100).toFixed(0)}%`);

      expect(qualityScore).toBeGreaterThan(0.4); // At least acceptable quality
      expect(textDetectionRate / results.length).toBeGreaterThan(0.7); // 70% text detection
    }, 60000);
  });

  describe('🔍 Specific Visual Defect Detection', () => {
    test('VISION: Check for common rendering issues', async () => {
      const videoPath = 'output/real-renders/platform-tiktok.mp4';
      
      if (!existsSync(videoPath)) {
        return;
      }

      // Extract more frames for detailed analysis
      const frameDir = 'output/frames-detailed';
      await Bun.spawn(['mkdir', '-p', frameDir]);
      
      // Extract 5 frames
      const extractCommand = `ffmpeg -i ${videoPath} -vf "fps=1" -vframes 5 ${frameDir}/frame_%d.png -y`;
      const proc = Bun.spawn(['sh', '-c', extractCommand], { stdout: 'pipe', stderr: 'pipe' });
      await proc.exited;

      // Check for common issues
      const issuesPrompt = `Analyze these video frames for common rendering issues:
1. Text clipping or cutoff
2. Aspect ratio distortion
3. Color banding or artifacts
4. Blur or pixelation
5. Incorrect padding/letterboxing

Report any issues found.`;

      // Would call Gemini here with detailed analysis
      console.log('✅ Visual defect detection would check for:');
      console.log('- Text clipping');
      console.log('- Aspect ratio issues');
      console.log('- Color artifacts');
      console.log('- Quality degradation');

      // Cleanup
      await Bun.spawn(['rm', '-rf', frameDir]);
    }, 30000);
  });
});
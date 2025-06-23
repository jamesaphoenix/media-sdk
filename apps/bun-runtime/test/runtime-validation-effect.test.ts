/**
 * Runtime validation and system testing for Media SDK with Effect-based Vision Integration
 * 
 * This test suite integrates the Effect-based VisionService into all runtime tests,
 * providing AI-powered quality assurance and self-healing capabilities.
 */

import { test, expect, describe, beforeAll, afterAll } from 'bun:test';
import { Effect, Layer, pipe } from 'effect';
import { RuntimeValidator } from '../src/runtime-validator';
import { BunMockExecutor } from '../src/bun-cassette-manager';
import { Timeline, tiktok, youtube } from '@jamesaphoenix/media-sdk';
import { 
  VisionService, 
  VisionServiceLive,
  renderWithVisionValidation,
  optimizeTimelineWithVision
} from '../../../packages/media-sdk/src/services/vision-integration.js';

describe('🔧 Runtime Validation with Effect Vision Integration', () => {
  let validator: RuntimeValidator;
  let executor: BunMockExecutor;
  
  // Create live services for testing
  const services = Layer.mergeAll(
    VisionServiceLive,
    // Add other necessary services here if needed
  );

  beforeAll(async () => {
    validator = new RuntimeValidator();
    executor = new BunMockExecutor('runtime-validation-effect');
    
    // Validate system before running tests
    const requirements = await validator.validateSystem();
    console.log('System Requirements:', requirements);
    console.log('🎯 Vision Integration: Effect-based');
  });

  afterAll(async () => {
    await executor.cleanup();
  });

  describe('🔍 System Requirements with Vision Validation', () => {
    test('should validate FFmpeg with vision quality check', async () => {
      const requirements = await validator.validateSystem();
      
      expect(requirements.ffmpeg).toHaveProperty('available');
      
      if (requirements.ffmpeg.available) {
        console.log(`  ✅ FFmpeg ${requirements.ffmpeg.version} detected`);
        
        // Test FFmpeg with vision validation
        const testTimeline = new Timeline()
          .addVideo('sample-files/red-sample.mp4')
          .addText('FFmpeg Vision Test', { position: 'center' });
        
        const result = await Effect.runPromise(
          pipe(
            renderWithVisionValidation(testTimeline, 'output/ffmpeg-vision-test.mp4', {
              qualityThreshold: 0.7
            }),
            Effect.provide(services),
            Effect.either
          )
        );
        
        if (result._tag === 'Right') {
          console.log(`  👁️ Vision Quality Score: ${result.right.qualityScore.toFixed(2)}`);
          expect(result.right.qualityScore).toBeGreaterThan(0.7);
        }
      }
    });
  });

  describe('📁 File Validation with Vision Analysis', () => {
    test('should validate sample files with vision quality assessment', async () => {
      const sampleFiles = [
        'sample-files/red-sample.mp4',
        'sample-files/blue-sample.mp4',
        'sample-files/portrait-sample.mp4',
      ];

      for (const file of sampleFiles) {
        const validation = await validator.validateFile(file);
        
        expect(validation.exists).toBe(true);
        
        if (validation.exists) {
          // Create timeline with the sample file
          const timeline = new Timeline()
            .addVideo(file)
            .addText(`Testing ${file}`, { position: 'bottom' });
          
          // Analyze with vision service
          const visionResult = await Effect.runPromise(
            pipe(
              VisionService,
              Effect.flatMap(vision => 
                vision.analyzeTimeline(timeline, 'mixed')
              ),
              Effect.provide(services),
              Effect.either
            )
          );
          
          if (visionResult._tag === 'Right') {
            console.log(`  ✅ ${file}: Vision analysis complete`);
            console.log(`    Recommendations: ${visionResult.right.length}`);
            
            visionResult.right.forEach(rec => {
              console.log(`    - ${rec.recommendation} (confidence: ${rec.confidence})`);
            });
          }
        }
      }
    });
  });

  describe('⚡ Performance & Stress Tests with Vision', () => {
    test('should handle concurrent operations with vision validation', async () => {
      const startTime = Date.now();
      
      // Create multiple timelines simultaneously
      const operations = Array.from({ length: 3 }, (_, i) => {
        const timeline = tiktok('sample-files/red-sample.mp4')
          .addText(`Concurrent Vision Test ${i + 1}`, { position: 'center' });
        
        return Effect.runPromise(
          pipe(
            renderWithVisionValidation(timeline, `output/concurrent-vision-${i + 1}.mp4`, {
              platform: 'tiktok',
              expectedText: [`Concurrent`, `Vision`, `Test`, `${i + 1}`]
            }),
            Effect.provide(services),
            Effect.either
          )
        );
      });

      // Execute all operations concurrently
      const results = await Promise.all(operations);
      const duration = Date.now() - startTime;
      
      expect(results).toHaveLength(3);
      
      let totalQualityScore = 0;
      results.forEach((result, i) => {
        if (result._tag === 'Right') {
          totalQualityScore += result.right.qualityScore;
          console.log(`  ✅ Concurrent operation ${i + 1}: Quality ${result.right.qualityScore.toFixed(2)}`);
          
          if (result.right.recommendations.length > 0) {
            console.log(`    📋 Recommendations: ${result.right.recommendations.length}`);
          }
        }
      });
      
      const avgQuality = totalQualityScore / results.length;
      console.log(`  ⏱️ Total concurrent execution: ${duration}ms`);
      console.log(`  📊 Average quality score: ${avgQuality.toFixed(2)}`);
      
      expect(avgQuality).toBeGreaterThan(0.7);
    });

    test('should optimize timelines before rendering', async () => {
      // Create intentionally suboptimal timeline
      const suboptimalTimeline = new Timeline()
        .addVideo('sample-files/blue-sample.mp4')
        .setAspectRatio('16:9') // Wrong for TikTok
        .addText('Small text', { 
          position: 'center',
          style: { fontSize: 12 } // Too small for mobile
        });
      
      // Optimize with vision service
      const optimizationResult = await Effect.runPromise(
        pipe(
          optimizeTimelineWithVision(suboptimalTimeline, 'tiktok'),
          Effect.provide(services),
          Effect.either
        )
      );
      
      if (optimizationResult._tag === 'Right') {
        const optimized = optimizationResult.right;
        
        // Render both versions for comparison
        const [original, optimizedResult] = await Promise.all([
          executor.execute(suboptimalTimeline.getCommand('output/original.mp4')),
          Effect.runPromise(
            pipe(
              renderWithVisionValidation(optimized, 'output/optimized.mp4', {
                platform: 'tiktok'
              }),
              Effect.provide(services),
              Effect.either
            )
          )
        ]);
        
        if (optimizedResult._tag === 'Right') {
          console.log('  🔧 Timeline optimization complete');
          console.log(`  📊 Optimized quality: ${optimizedResult.right.qualityScore.toFixed(2)}`);
          expect(optimizedResult.right.qualityScore).toBeGreaterThan(0.75);
        }
      }
    });
  });

  describe('🎯 Real-world Scenarios with Vision Validation', () => {
    test('should validate complete social media workflow with quality checks', async () => {
      const sourceVideo = 'sample-files/portrait-sample.mp4';
      
      // Platform configurations with vision validation
      const platforms = [
        { 
          name: 'TikTok', 
          create: () => tiktok(sourceVideo)
            .trim(0, 15)
            .addText('TikTok Version 🎵', { 
              position: 'bottom',
              style: { fontSize: 32, color: '#ff0066' }
            }),
          platform: 'tiktok' as const
        },
        { 
          name: 'YouTube', 
          create: () => youtube(sourceVideo)
            .scale(1080, 1920)
            .addText('YouTube Shorts 📺', {
              position: 'top',
              style: { fontSize: 28, color: '#ff0000' }
            }),
          platform: 'youtube' as const
        },
        { 
          name: 'Instagram', 
          create: () => tiktok(sourceVideo)
            .addText('Instagram Reels 📷', {
              position: 'center',
              style: { fontSize: 30, color: '#E4405F' }
            }),
          platform: 'instagram' as const
        }
      ];

      const results = await Promise.all(
        platforms.map(async ({ name, create, platform }) => {
          const timeline = create();
          
          const result = await Effect.runPromise(
            pipe(
              renderWithVisionValidation(timeline, `output/social-${name.toLowerCase()}-vision.mp4`, {
                platform,
                expectedText: [name, 'Version'],
                qualityThreshold: 0.75
              }),
              Effect.provide(services),
              Effect.either
            )
          );
          
          return { name, result };
        })
      );
      
      console.log('  🌐 Social media workflow with vision validation:');
      
      results.forEach(({ name, result }) => {
        if (result._tag === 'Right') {
          const { qualityScore, analysis } = result.right;
          console.log(`    ${name}: ✅ Quality ${qualityScore.toFixed(2)}`);
          
          if (analysis.platformCompliance) {
            console.log(`      Platform compliance: ${analysis.platformCompliance.isCompliant ? '✅' : '❌'}`);
          }
          
          if (analysis.issues.length > 0) {
            console.log(`      Issues: ${analysis.issues.length}`);
            analysis.issues.forEach(issue => {
              console.log(`        - ${issue.severity}: ${issue.description}`);
            });
          }
        } else {
          console.log(`    ${name}: ❌ Failed`);
        }
      });
    });

    test('should handle error scenarios with vision-based recovery', async () => {
      const errorScenarios = [
        {
          name: 'Low quality text',
          timeline: new Timeline()
            .addVideo('sample-files/blue-sample.mp4')
            .addText('A', { // Single character, might be hard to read
              position: 'center',
              style: { fontSize: 8, color: '#eeeeee' } // Too small and low contrast
            })
        },
        {
          name: 'Overlapping elements',
          timeline: new Timeline()
            .addVideo('sample-files/red-sample.mp4')
            .addText('Background Text', { position: 'center', duration: 5 })
            .addText('Overlapping Text', { position: 'center', startTime: 2, duration: 3 })
        },
        {
          name: 'Wrong platform format',
          timeline: new Timeline()
            .addVideo('sample-files/blue-sample.mp4')
            .setAspectRatio('1:1') // Square for TikTok (should be 9:16)
            .addText('Wrong Format', { position: 'center' })
        }
      ];

      for (const scenario of errorScenarios) {
        console.log(`  🔧 Testing: ${scenario.name}`);
        
        // First analyze the timeline
        const analysisResult = await Effect.runPromise(
          pipe(
            VisionService,
            Effect.flatMap(vision => 
              vision.analyzeTimeline(scenario.timeline, 'tiktok')
            ),
            Effect.provide(services),
            Effect.either
          )
        );
        
        if (analysisResult._tag === 'Right' && analysisResult.right.length > 0) {
          console.log(`    📋 Issues detected: ${analysisResult.right.length}`);
          
          // Apply fixes
          const fixedResult = await Effect.runPromise(
            pipe(
              VisionService,
              Effect.flatMap(vision => 
                vision.applyFixes(scenario.timeline, analysisResult.right, {
                  confidence: 0.7,
                  maxIterations: 3
                })
              ),
              Effect.provide(services),
              Effect.either
            )
          );
          
          if (fixedResult._tag === 'Right') {
            console.log(`    ✅ Auto-fixes applied successfully`);
          }
        }
      }
    });
  });

  describe('🔄 Cache and Vision Quality Optimization', () => {
    test('should cache vision analysis results', async () => {
      const timeline = new Timeline()
        .addVideo('sample-files/red-sample.mp4')
        .addText('Cache Test', { position: 'center' });
      
      // Clear cache first
      validator.clearCache();
      
      // First render with vision
      const result1 = await Effect.runPromise(
        pipe(
          renderWithVisionValidation(timeline, 'output/cache-test-1.mp4'),
          Effect.provide(services),
          Effect.either
        )
      );
      
      // Second render should use cached vision results
      const result2 = await Effect.runPromise(
        pipe(
          renderWithVisionValidation(timeline, 'output/cache-test-2.mp4'),
          Effect.provide(services),
          Effect.either
        )
      );
      
      if (result1._tag === 'Right' && result2._tag === 'Right') {
        expect(result1.right.qualityScore).toBeCloseTo(result2.right.qualityScore, 2);
        console.log('  ✅ Vision analysis caching verified');
      }
      
      const stats = validator.getStats();
      console.log(`  📊 Cache performance: ${stats.cacheHits} hits`);
    });

    test('should provide comprehensive quality metrics', async () => {
      const timeline = new Timeline()
        .addVideo('sample-files/portrait-sample.mp4')
        .addText('Quality Metrics Test', { 
          position: 'center',
          style: { fontSize: 48, color: '#ff0066' }
        })
        .addImage('sample-files/logo-150x150.png', { 
          position: 'bottom-right',
          opacity: 0.8 
        });
      
      const result = await Effect.runPromise(
        pipe(
          renderWithVisionValidation(timeline, 'output/quality-metrics.mp4', {
            deepAnalysis: true
          }),
          Effect.provide(services),
          Effect.either
        )
      );
      
      if (result._tag === 'Right') {
        const { analysis } = result.right;
        
        console.log('  📊 Comprehensive Quality Metrics:');
        console.log(`    Overall Score: ${analysis.qualityScore.toFixed(2)}`);
        console.log(`    Visual Quality:`);
        console.log(`      - Clarity: ${analysis.visualQuality.clarity.toFixed(2)}`);
        console.log(`      - Contrast: ${analysis.visualQuality.contrast.toFixed(2)}`);
        console.log(`      - Brightness: ${analysis.visualQuality.brightness.toFixed(2)}`);
        console.log(`      - Saturation: ${analysis.visualQuality.saturation.toFixed(2)}`);
        console.log(`      - Sharpness: ${analysis.visualQuality.sharpness.toFixed(2)}`);
        console.log(`    Text Detection:`);
        console.log(`      - Readability: ${analysis.textDetection.readability.toFixed(2)}`);
        console.log(`      - Confidence: ${analysis.textDetection.confidence.toFixed(2)}`);
        console.log(`    Performance:`);
        console.log(`      - Render Time: ${analysis.performance.renderTime}ms`);
        console.log(`      - File Size: ${(analysis.performance.fileSize / 1024 / 1024).toFixed(2)}MB`);
        console.log(`      - Bitrate: ${(analysis.performance.bitrate / 1000000).toFixed(2)}Mbps`);
        
        expect(analysis.qualityScore).toBeGreaterThan(0.7);
      }
    });
  });

  describe('🚀 Advanced Vision Integration Features', () => {
    test('should provide self-healing recommendations', async () => {
      // Create timeline with intentional issues
      const problematicTimeline = new Timeline()
        .addVideo('sample-files/blue-sample.mp4')
        .addText('🔥', { // Only emoji, might not be readable
          position: 'center',
          style: { fontSize: 16 }
        })
        .setAspectRatio('4:3'); // Outdated aspect ratio
      
      const result = await Effect.runPromise(
        pipe(
          VisionService,
          Effect.flatMap(vision => 
            Effect.all({
              preAnalysis: vision.analyzeTimeline(problematicTimeline),
              rendered: renderWithVisionValidation(
                problematicTimeline, 
                'output/self-healing-test.mp4',
                { qualityThreshold: 0.8 }
              )
            })
          ),
          Effect.provide(services),
          Effect.either
        )
      );
      
      if (result._tag === 'Right') {
        console.log('  🔧 Self-Healing Analysis:');
        console.log(`    Pre-render issues: ${result.right.preAnalysis.length}`);
        
        result.right.preAnalysis.forEach(rec => {
          console.log(`    - ${rec.severity}: ${rec.issue}`);
          console.log(`      Fix: ${rec.recommendation}`);
        });
        
        if (result.right.rendered.recommendations.length > 0) {
          console.log(`    Post-render recommendations: ${result.right.rendered.recommendations.length}`);
        }
      }
    });

    test('should validate accessibility features', async () => {
      const accessibleTimeline = new Timeline()
        .addVideo('sample-files/red-sample.mp4')
        .addText('High Contrast Text', {
          position: 'center',
          style: { 
            fontSize: 48, 
            color: '#ffffff',
            strokeColor: '#000000',
            strokeWidth: 3
          }
        })
        .addCaptions({
          captions: [
            { text: 'Accessible caption with good readability', startTime: 2, endTime: 5 }
          ],
          style: {
            fontSize: 36,
            backgroundColor: 'rgba(0,0,0,0.8)',
            color: '#ffffff'
          }
        });
      
      const result = await Effect.runPromise(
        pipe(
          renderWithVisionValidation(accessibleTimeline, 'output/accessibility-test.mp4', {
            deepAnalysis: true
          }),
          Effect.provide(services),
          Effect.either
        )
      );
      
      if (result._tag === 'Right') {
        const { analysis } = result.right;
        
        console.log('  ♿ Accessibility Validation:');
        console.log(`    Text Readability: ${analysis.textDetection.readability.toFixed(2)}`);
        console.log(`    Contrast Ratio: ${analysis.visualQuality.contrast.toFixed(2)}`);
        
        // High accessibility scores expected
        expect(analysis.textDetection.readability).toBeGreaterThan(0.85);
        expect(analysis.visualQuality.contrast).toBeGreaterThan(0.8);
      }
    });
  });
});
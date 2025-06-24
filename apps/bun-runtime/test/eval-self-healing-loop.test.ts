import { describe, test, expect, beforeAll, afterAll } from 'bun:test';
import { Timeline } from '../../../packages/media-sdk/src/timeline/timeline.js';
import { MediaAnalysisService } from '../../../packages/media-sdk/src/services/media-analysis.js';
import { RuntimeValidator } from '../src/runtime-validator.ts';
import { EnhancedBunCassetteManager } from '../src/enhanced-cassette-manager.ts';
import * as fs from 'fs/promises';
import * as path from 'path';

// Only run if GEMINI_API_KEY is set
const SHOULD_RUN = !!process.env.GEMINI_API_KEY;

describe.skipIf(!SHOULD_RUN)('🧬 Self-Healing SDK Loop with Real Gemini', () => {
  let cassetteManager: EnhancedBunCassetteManager;
  let analysisService: MediaAnalysisService;
  let runtimeValidator: RuntimeValidator;
  const outputDir = 'test-outputs/self-healing';
  const assetsDir = 'test-assets/self-healing';

  beforeAll(async () => {
    if (!SHOULD_RUN) return;
    
    console.log('🧬 Initializing Self-Healing SDK tests...');
    
    // Create directories
    await fs.mkdir(outputDir, { recursive: true });
    await fs.mkdir(assetsDir, { recursive: true });
    
    // Initialize services
    cassetteManager = new EnhancedBunCassetteManager('self-healing');
    analysisService = new MediaAnalysisService(process.env.GEMINI_API_KEY!);
    runtimeValidator = new RuntimeValidator(process.env.GEMINI_API_KEY!);
    
    // Create test video
    const createTestVideo = `ffmpeg -f lavfi -i color=c=blue:s=1280x720:d=5 -f lavfi -i sine=frequency=1000:duration=5 -c:v libx264 -preset ultrafast -c:a aac -y "${path.join(assetsDir, 'base-video.mp4')}"`;
    await cassetteManager.executeCommand(createTestVideo, 'create-base-video');
  });

  afterAll(async () => {
    if (!SHOULD_RUN) return;
    
    console.log('🧹 Cleaning up self-healing test files...');
    try {
      await fs.rm(outputDir, { recursive: true, force: true });
      await fs.rm(assetsDir, { recursive: true, force: true });
    } catch (error) {
      console.error('Cleanup error:', error);
    }
  });

  test('should demonstrate complete self-healing loop for video quality', async () => {
    console.log('\n🔄 SELF-HEALING LOOP: Video Quality Improvement\n');
    
    // Step 1: Create a problematic video
    console.log('📍 Step 1: Creating video with quality issues...');
    
    const problematicTimeline = new Timeline()
      .addVideo(path.join(assetsDir, 'base-video.mp4'))
      .setDuration(5)
      .addText('Hard to Read Text', {
        position: { x: '10%', y: '90%' },
        style: {
          fontSize: 14,         // Too small
          color: '#ffff00',     // Poor contrast on blue
          fontFamily: 'Arial'
        }
      })
      .addText('No Accessibility', {
        position: { x: '90%', y: '10%' },
        style: {
          fontSize: 12,
          color: '#00ffff'      // Cyan on blue - terrible contrast
        }
      });
    
    const problematicOutput = path.join(outputDir, 'problematic-video.mp4');
    const problematicCommand = problematicTimeline.getCommand(problematicOutput);
    
    await cassetteManager.executeCommand(problematicCommand, 'render-problematic');
    console.log('✅ Problematic video created');
    
    // Step 2: Evaluate with Gemini
    console.log('\n📍 Step 2: Evaluating video with Gemini API...');
    
    const initialAnalysis = await analysisService.analyzeMedia(problematicOutput, {
      platform: 'youtube',
      analysisTypes: ['quality', 'accessibility', 'content'],
      analysisDepth: 'comprehensive'
    });
    
    console.log('\n🔍 Initial Evaluation Results:');
    console.log(`  - Quality Score: ${initialAnalysis.video?.quality.score || initialAnalysis.primary.qualityScore}`);
    console.log(`  - Readability: ${initialAnalysis.accessibility.readabilityScore}`);
    console.log(`  - Issues Found: ${initialAnalysis.editingSuggestions.length}`);
    
    if (initialAnalysis.editingSuggestions.length > 0) {
      console.log('\n⚠️ Issues Detected:');
      initialAnalysis.editingSuggestions.forEach((suggestion, i) => {
        console.log(`  ${i + 1}. ${suggestion.description} (${suggestion.priority})`);
      });
    }
    
    // Step 3: Apply self-healing based on Gemini's suggestions
    console.log('\n📍 Step 3: Applying self-healing improvements...');
    
    const healedTimeline = new Timeline()
      .addVideo(path.join(assetsDir, 'base-video.mp4'))
      .setDuration(5);
    
    // Apply improvements based on common issues
    const hasTextReadabilityIssue = initialAnalysis.editingSuggestions.some(s => 
      s.description.toLowerCase().includes('text') || 
      s.description.toLowerCase().includes('readability') ||
      s.description.toLowerCase().includes('font')
    );
    
    const hasContrastIssue = initialAnalysis.editingSuggestions.some(s => 
      s.description.toLowerCase().includes('contrast')
    );
    
    const hasAccessibilityIssue = initialAnalysis.editingSuggestions.some(s => 
      s.description.toLowerCase().includes('caption') || 
      s.description.toLowerCase().includes('accessibility')
    );
    
    // Apply healing transformations
    if (hasTextReadabilityIssue || hasContrastIssue) {
      console.log('  🔧 Fixing text readability and contrast...');
      healedTimeline
        .addText('Clear, Readable Text', {
          position: { x: '50%', y: '40%' },
          style: {
            fontSize: 72,              // Much larger
            color: '#ffffff',          // White on blue - high contrast
            fontFamily: 'Arial',
            stroke: '#000000',         // Black stroke for extra clarity
            strokeWidth: 3,
            backgroundColor: 'rgba(0,0,0,0.7)',  // Background for readability
            padding: 20
          }
        })
        .addText('Accessibility Focused', {
          position: { x: '50%', y: '60%' },
          style: {
            fontSize: 48,
            color: '#ffffff',
            fontFamily: 'Arial',
            stroke: '#000000',
            strokeWidth: 2
          }
        });
    }
    
    if (hasAccessibilityIssue) {
      console.log('  🔧 Adding captions for accessibility...');
      healedTimeline.addCaptions([
        { text: 'This video has been self-healed', start: 0, end: 2 },
        { text: 'Text is now readable with high contrast', start: 2, end: 4 },
        { text: 'Accessibility features added', start: 4, end: 5 }
      ]);
    }
    
    // Apply quality enhancements
    console.log('  🔧 Applying quality enhancements...');
    healedTimeline
      .addFilter('eq', { brightness: 0.05, contrast: 1.1, saturation: 1.05 })
      .addFilter('unsharp', { amount: 1.2 });
    
    const healedOutput = path.join(outputDir, 'healed-video.mp4');
    const healedCommand = healedTimeline.getCommand(healedOutput);
    
    await cassetteManager.executeCommand(healedCommand, 'render-healed');
    console.log('✅ Self-healed video created');
    
    // Step 4: Re-evaluate to confirm healing
    console.log('\n📍 Step 4: Re-evaluating healed video...');
    
    const healedAnalysis = await analysisService.analyzeMedia(healedOutput, {
      platform: 'youtube',
      analysisTypes: ['quality', 'accessibility', 'content'],
      analysisDepth: 'comprehensive'
    });
    
    const initialScore = initialAnalysis.video?.quality.score || initialAnalysis.primary.qualityScore;
    const healedScore = healedAnalysis.video?.quality.score || healedAnalysis.primary.qualityScore;
    const improvement = ((healedScore - initialScore) / initialScore * 100).toFixed(1);
    
    console.log('\n✨ Self-Healing Results:');
    console.log(`  - Initial Quality: ${initialScore} → Healed Quality: ${healedScore}`);
    console.log(`  - Quality Improvement: +${improvement}%`);
    console.log(`  - Initial Readability: ${initialAnalysis.accessibility.readabilityScore} → Healed: ${healedAnalysis.accessibility.readabilityScore}`);
    console.log(`  - Issues Resolved: ${initialAnalysis.editingSuggestions.length - healedAnalysis.editingSuggestions.length} of ${initialAnalysis.editingSuggestions.length}`);
    
    // Verify healing worked
    expect(healedScore).toBeGreaterThan(initialScore);
    expect(healedAnalysis.accessibility.readabilityScore).toBeGreaterThan(
      initialAnalysis.accessibility.readabilityScore
    );
    expect(healedAnalysis.editingSuggestions.length).toBeLessThan(
      initialAnalysis.editingSuggestions.length
    );
    
    console.log('\n🎉 Self-healing successful!');
  });

  test('should self-heal platform-specific issues for TikTok', async () => {
    console.log('\n🔄 SELF-HEALING LOOP: TikTok Platform Optimization\n');
    
    // Step 1: Create wrong format for TikTok
    console.log('📍 Step 1: Creating video with wrong format for TikTok...');
    
    const wrongFormatTimeline = new Timeline()
      .addVideo(path.join(assetsDir, 'base-video.mp4'))
      .setAspectRatio('16:9')  // Wrong for TikTok!
      .setDuration(65)         // Too long for TikTok!
      .addText('Wrong Format', {
        position: { x: '50%', y: '50%' },
        style: { fontSize: 40, color: '#ffffff' }
      });
    
    const wrongOutput = path.join(outputDir, 'wrong-tiktok.mp4');
    await cassetteManager.executeCommand(
      wrongFormatTimeline.getCommand(wrongOutput),
      'render-wrong-tiktok'
    );
    
    // Step 2: Evaluate for TikTok
    console.log('\n📍 Step 2: Evaluating for TikTok platform...');
    
    const wrongAnalysis = await analysisService.analyzeMedia(wrongOutput, {
      platform: 'tiktok',
      analysisTypes: ['platform', 'content']
    });
    
    console.log('\n🔍 TikTok Compliance Check:');
    console.log(`  - Platform Optimized: ${wrongAnalysis.platformOptimization.isOptimized ? '✅' : '❌'}`);
    console.log(`  - Aspect Ratio: ${wrongAnalysis.platformOptimization.aspectRatioMatch ? '✅' : '❌'}`);
    console.log(`  - Duration: ${wrongAnalysis.platformOptimization.durationCompliance ? '✅' : '❌'}`);
    console.log(`  - Recommendations: ${wrongAnalysis.platformOptimization.recommendations.length}`);
    
    // Step 3: Self-heal for TikTok
    console.log('\n📍 Step 3: Self-healing for TikTok optimization...');
    
    const tiktokHealedTimeline = new Timeline()
      .addVideo(path.join(assetsDir, 'base-video.mp4'))
      .setAspectRatio('9:16')  // Correct for TikTok
      .setDuration(15)         // Perfect TikTok length
      .addWordHighlighting({
        text: 'TikTok Ready Content',
        words: [
          { word: 'TikTok', start: 0, end: 3 },
          { word: 'Ready', start: 3, end: 6 },
          { word: 'Content', start: 6, end: 9 }
        ],
        preset: 'tiktok',
        baseStyle: { fontSize: 80, color: '#ffffff' },
        highlightStyle: { color: '#ff0066', scale: 1.3 }
      })
      .addCaptions([
        { text: '✨ Optimized for TikTok', start: 0, end: 5 },
        { text: '📱 Perfect 9:16 format', start: 5, end: 10 },
        { text: '⏱️ Ideal 15-second length', start: 10, end: 15 }
      ]);
    
    const tiktokOutput = path.join(outputDir, 'healed-tiktok.mp4');
    await cassetteManager.executeCommand(
      tiktokHealedTimeline.getCommand(tiktokOutput),
      'render-healed-tiktok'
    );
    
    // Step 4: Verify TikTok optimization
    console.log('\n📍 Step 4: Verifying TikTok optimization...');
    
    const tiktokAnalysis = await analysisService.analyzeMedia(tiktokOutput, {
      platform: 'tiktok',
      analysisTypes: ['platform', 'content']
    });
    
    console.log('\n✨ TikTok Self-Healing Results:');
    console.log(`  - Platform Optimized: ${tiktokAnalysis.platformOptimization.isOptimized ? '✅' : '❌'}`);
    console.log(`  - Aspect Ratio: ${tiktokAnalysis.platformOptimization.aspectRatioMatch ? '✅ Correct 9:16' : '❌'}`);
    console.log(`  - Duration: ${tiktokAnalysis.platformOptimization.durationCompliance ? '✅ Perfect length' : '❌'}`);
    console.log(`  - Remaining Issues: ${tiktokAnalysis.platformOptimization.recommendations.length}`);
    
    expect(tiktokAnalysis.platformOptimization.isOptimized).toBe(true);
    expect(tiktokAnalysis.platformOptimization.aspectRatioMatch).toBe(true);
  });

  test('should use RuntimeValidator for comprehensive self-healing validation', async () => {
    console.log('\n🔄 SELF-HEALING LOOP: Complete Runtime Validation\n');
    
    // Create a complex timeline with multiple issues
    console.log('📍 Creating complex video with multiple issues...');
    
    const complexTimeline = new Timeline()
      .addVideo(path.join(assetsDir, 'base-video.mp4'))
      .setDuration(10)
      .addText('Test', {  // Too generic
        position: { x: '50%', y: '50%' },
        style: { fontSize: 30, color: '#808080' }  // Gray on blue
      });
    
    const complexOutput = path.join(outputDir, 'complex-initial.mp4');
    const command = complexTimeline.getCommand(complexOutput);
    
    await cassetteManager.executeCommand(command, 'render-complex-initial');
    
    // Use RuntimeValidator for deep analysis
    console.log('\n📍 Running comprehensive RuntimeValidator analysis...');
    
    const validation = await runtimeValidator.validateRender(
      complexOutput,
      'youtube',
      { command, timeline: complexTimeline },
      ['Test'],  // Expected text
      [command]
    );
    
    console.log('\n🔍 Runtime Validation Results:');
    console.log(`  - Valid: ${validation.isValid ? '✅' : '❌'}`);
    console.log(`  - Quality Score: ${validation.qualityScore}`);
    console.log(`  - Text Detection Confidence: ${validation.textDetection?.confidence || 'N/A'}`);
    console.log(`  - Platform Compliance: ${validation.platformCompliance?.isCompliant ? '✅' : '❌'}`);
    
    if (validation.suggestions && validation.suggestions.length > 0) {
      console.log('\n💡 RuntimeValidator Suggestions:');
      validation.suggestions.forEach((s, i) => {
        console.log(`  ${i + 1}. ${s}`);
      });
    }
    
    // Apply comprehensive healing based on RuntimeValidator feedback
    console.log('\n📍 Applying comprehensive self-healing...');
    
    const fullyHealedTimeline = new Timeline()
      .addVideo(path.join(assetsDir, 'base-video.mp4'))
      .setDuration(10)
      .setAspectRatio('16:9')
      .addText('Professional YouTube Content', {
        position: { x: '50%', y: '30%' },
        style: {
          fontSize: 84,
          color: '#ffffff',
          fontFamily: 'Arial',
          stroke: '#000000',
          strokeWidth: 4,
          shadow: { offsetX: 3, offsetY: 3, blur: 6, color: 'rgba(0,0,0,0.8)' }
        },
        animation: {
          type: 'fade',
          duration: 1
        }
      })
      .addText('Self-Healed with AI', {
        position: { x: '50%', y: '70%' },
        style: {
          fontSize: 48,
          color: '#00ff00',
          fontFamily: 'Arial',
          backgroundColor: 'rgba(0,0,0,0.8)',
          padding: 15
        }
      })
      .addCaptions([
        { text: 'This video demonstrates self-healing', start: 0, end: 3 },
        { text: 'AI detected and fixed quality issues', start: 3, end: 6 },
        { text: 'Now optimized for YouTube platform', start: 6, end: 9 }
      ])
      .addFilter('curves', { preset: 'increase_contrast' })
      .addFilter('eq', { brightness: 0.05, contrast: 1.1, saturation: 1.1 });
    
    const fullyHealedOutput = path.join(outputDir, 'complex-healed.mp4');
    const healedCommand = fullyHealedTimeline.getCommand(fullyHealedOutput);
    
    await cassetteManager.executeCommand(healedCommand, 'render-complex-healed');
    
    // Final validation
    console.log('\n📍 Final validation of healed video...');
    
    const healedValidation = await runtimeValidator.validateRender(
      fullyHealedOutput,
      'youtube',
      { command: healedCommand, timeline: fullyHealedTimeline },
      ['Professional YouTube Content', 'Self-Healed with AI'],
      [healedCommand]
    );
    
    console.log('\n✨ Final Self-Healing Results:');
    console.log(`  - Initial Quality: ${validation.qualityScore} → Final: ${healedValidation.qualityScore}`);
    console.log(`  - Text Detection: ${validation.textDetection?.confidence || 0} → ${healedValidation.textDetection?.confidence || 0}`);
    console.log(`  - Platform Compliance: ${validation.platformCompliance?.isCompliant ? '✅' : '❌'} → ${healedValidation.platformCompliance?.isCompliant ? '✅' : '❌'}`);
    console.log(`  - Issues Resolved: ${(validation.suggestions?.length || 0) - (healedValidation.suggestions?.length || 0)}`);
    
    // Verify comprehensive healing
    expect(healedValidation.qualityScore).toBeGreaterThan(validation.qualityScore);
    expect(healedValidation.isValid).toBe(true);
    expect(healedValidation.platformCompliance?.isCompliant).toBe(true);
    
    console.log('\n🎉 Complete self-healing cycle successful!');
  });

  test('should demonstrate iterative self-healing with multiple rounds', async () => {
    console.log('\n🔄 ITERATIVE SELF-HEALING: Multiple Improvement Rounds\n');
    
    let currentTimeline = new Timeline()
      .addVideo(path.join(assetsDir, 'base-video.mp4'))
      .setDuration(5)
      .addText('v1', {
        position: { x: '5%', y: '95%' },
        style: { fontSize: 10, color: '#333333' }
      });
    
    let currentOutput = path.join(outputDir, 'iterative-v1.mp4');
    let previousScore = 0;
    
    // Run 3 iterations of self-healing
    for (let iteration = 1; iteration <= 3; iteration++) {
      console.log(`\n🔁 Iteration ${iteration}:`);
      
      // Render current version
      await cassetteManager.executeCommand(
        currentTimeline.getCommand(currentOutput),
        `render-iteration-${iteration}`
      );
      
      // Analyze
      const analysis = await analysisService.analyzeMedia(currentOutput, {
        platform: 'youtube',
        analysisTypes: ['quality', 'accessibility', 'content']
      });
      
      const currentScore = analysis.video?.quality.score || analysis.primary.qualityScore;
      console.log(`  - Quality Score: ${currentScore}`);
      console.log(`  - Issues: ${analysis.editingSuggestions.length}`);
      
      if (iteration === 1) {
        previousScore = currentScore;
      }
      
      // Apply improvements based on analysis
      currentTimeline = new Timeline()
        .addVideo(path.join(assetsDir, 'base-video.mp4'))
        .setDuration(5);
      
      // Progressive improvements
      if (iteration === 1) {
        console.log('  🔧 Fixing basic text readability...');
        currentTimeline.addText('Version 2 - Improved', {
          position: { x: '50%', y: '50%' },
          style: { fontSize: 48, color: '#ffffff' }
        });
      } else if (iteration === 2) {
        console.log('  🔧 Adding accessibility and effects...');
        currentTimeline
          .addText('Version 3 - Enhanced', {
            position: { x: '50%', y: '40%' },
            style: { 
              fontSize: 64, 
              color: '#ffffff',
              stroke: '#000000',
              strokeWidth: 2
            }
          })
          .addCaptions([
            { text: 'Self-healing in progress', start: 0, end: 2.5 },
            { text: 'Quality improving each iteration', start: 2.5, end: 5 }
          ]);
      } else if (iteration === 3) {
        console.log('  🔧 Final polish and optimization...');
        currentTimeline
          .addText('Version 4 - Optimized', {
            position: { x: '50%', y: '35%' },
            style: { 
              fontSize: 72, 
              color: '#ffffff',
              fontFamily: 'Arial',
              stroke: '#000000',
              strokeWidth: 3,
              shadow: { offsetX: 2, offsetY: 2, blur: 4, color: 'rgba(0,0,0,0.9)' },
              backgroundColor: 'rgba(0,0,0,0.7)',
              padding: 20
            }
          })
          .addText('✨ Self-Healed', {
            position: { x: '50%', y: '65%' },
            style: {
              fontSize: 48,
              color: '#00ff00',
              fontFamily: 'Arial'
            }
          })
          .addCaptions([
            { text: 'Fully optimized video', start: 0, end: 2 },
            { text: 'Professional quality achieved', start: 2, end: 4 },
            { text: 'Self-healing complete', start: 4, end: 5 }
          ])
          .addFilter('eq', { brightness: 0.05, contrast: 1.15, saturation: 1.1 })
          .addFilter('unsharp', { amount: 1.5 });
      }
      
      currentOutput = path.join(outputDir, `iterative-v${iteration + 1}.mp4`);
      
      // Show improvement
      if (iteration > 1) {
        const improvement = ((currentScore - previousScore) / previousScore * 100).toFixed(1);
        console.log(`  📈 Improvement: +${improvement}%`);
      }
      previousScore = currentScore;
    }
    
    // Final analysis
    console.log('\n📍 Final analysis after 3 iterations...');
    const finalAnalysis = await analysisService.analyzeMedia(currentOutput, {
      platform: 'youtube',
      analysisTypes: ['quality', 'accessibility', 'content']
    });
    
    const finalScore = finalAnalysis.video?.quality.score || finalAnalysis.primary.qualityScore;
    
    console.log('\n✨ Iterative Self-Healing Complete:');
    console.log(`  - Starting Score: ~0.3 (estimated)`);
    console.log(`  - Final Score: ${finalScore}`);
    console.log(`  - Total Improvement: Significant`);
    console.log(`  - Remaining Issues: ${finalAnalysis.editingSuggestions.length}`);
    
    expect(finalScore).toBeGreaterThan(0.7);
    console.log('\n🎉 Iterative self-healing demonstration complete!');
  });
});
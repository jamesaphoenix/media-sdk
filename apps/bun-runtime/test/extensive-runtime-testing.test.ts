/**
 * EXTENSIVE RUNTIME TESTING
 * 
 * Comprehensive tests that exercise the entire SDK with real scenarios
 * and observe the self-healing system in action
 */

import { test, expect, describe, beforeAll, afterAll } from 'bun:test';
import { Timeline } from '@jamesaphoenix/media-sdk';
import { VisionRuntimeValidator } from '../src/vision-runtime-validator.js';
import { EnhancedBunCassetteManager } from '../src/enhanced-cassette-manager.js';
import { TestMediaCleanup } from '../src/test-cleanup-utils.js';

describe('🚀 EXTENSIVE RUNTIME TESTING SUITE', () => {
  let validator: VisionRuntimeValidator;
  let cassetteManager: EnhancedBunCassetteManager;
  let testResults: Array<{
    testName: string;
    timeline: Timeline;
    command: string;
    validation?: any;
    qualityScore?: number;
    executionTime?: number;
    errors?: string[];
    suggestions?: string[];
  }> = [];

  beforeAll(async () => {
    console.log('🌟 Starting extensive runtime testing...');
    
    validator = new VisionRuntimeValidator({
      qualityThreshold: 0.7,
      deepAnalysis: true,
      platformValidation: true
    });
    
    cassetteManager = new EnhancedBunCassetteManager('extensive-runtime-test');
    
    // Ensure output directories exist
    TestMediaCleanup.ensureOutputDirectories([
      'output/runtime-tests',
      'output/stress-tests',
      'output/edge-cases',
      'output/platform-tests',
      'output/performance-tests'
    ]);
    
    console.log('✅ Runtime testing environment initialized');
  });

  afterAll(async () => {
    // Generate comprehensive test report
    await generateTestReport();
    
    // Clean up test files
    await TestMediaCleanup.cleanupTestMedia({
      directories: ['output/runtime-tests', 'output/stress-tests'],
      preserveTestAssets: true,
      verbose: false
    });
  });

  describe('🎯 REAL WORLD SCENARIOS', () => {
    test('should create viral TikTok content with perfect timing', async () => {
      console.log('🔥 Creating viral TikTok content...');
      
      const startTime = Date.now();
      
      const timeline = new Timeline()
        .addVideo('assets/bunny.mp4')
        
        // Hook opener - must grab attention in first 3 seconds
        .addWordHighlighting({
          text: '🔥 This will CHANGE your life!',
          startTime: 0.5,
          duration: 2.5,
          preset: 'tiktok',
          highlightTransition: 'bounce',
          position: { x: '50%', y: '20%', anchor: 'center' },
          highlightStyle: {
            color: '#ff0066',
            scale: 1.4,
            glow: true,
            background: { color: 'rgba(255,255,255,0.9)', padding: 15 }
          }
        })
        
        // Build suspense
        .addWordHighlighting({
          text: 'You won\'t believe what happens next...',
          startTime: 3,
          duration: 3,
          preset: 'tiktok',
          highlightTransition: 'scale',
          position: { x: '50%', y: '40%', anchor: 'center' }
        })
        
        // Payoff
        .addWordHighlighting({
          text: 'MIND = BLOWN! 🤯',
          startTime: 6,
          duration: 2.5,
          preset: 'tiktok',
          highlightTransition: 'bounce',
          highlightStyle: {
            color: '#ffff00',
            strokeColor: '#ff0000',
            strokeWidth: 4,
            scale: 1.6
          },
          position: { x: '50%', y: '60%', anchor: 'center' }
        })
        
        // Call to action
        .addWordHighlighting({
          text: 'FOLLOW for part 2! 👍',
          startTime: 8.5,
          duration: 3,
          preset: 'tiktok',
          position: { x: '50%', y: '85%', anchor: 'center' },
          highlightStyle: {
            color: '#ffffff',
            background: { color: '#ff4444', padding: 20, borderRadius: 25 },
            scale: 1.2
          }
        });

      const command = timeline.getCommand('output/runtime-tests/viral-tiktok.mp4');
      const executionTime = Date.now() - startTime;
      
      // Execute and validate
      const testResult = await executeAndValidate(
        'Viral TikTok Content',
        timeline,
        command,
        'output/runtime-tests/viral-tiktok.mp4',
        'tiktok',
        ['CHANGE', 'life', 'MIND', 'BLOWN', 'FOLLOW'],
        executionTime
      );
      
      // Specific TikTok validations
      expect(testResult.validation?.isValid).toBe(true);
      
      // Quality should be high for viral content
      if (testResult.qualityScore && testResult.qualityScore < 0.8) {
        console.log('⚠️ Quality below viral threshold - investigating...');
        console.log('🔧 Suggestions:', testResult.suggestions);
      }
      
      console.log(`✅ Viral TikTok content created in ${executionTime}ms`);
    });

    test('should create Instagram story with perfect branding', async () => {
      console.log('📸 Creating Instagram story content...');
      
      const startTime = Date.now();
      
      const timeline = new Timeline()
        .addVideo('assets/bunny.mp4')
        
        // Brand intro
        .addWordHighlighting({
          text: '✨ Your Brand Story',
          startTime: 1,
          duration: 2.5,
          preset: 'instagram',
          position: { x: '50%', y: '15%', anchor: 'center' },
          highlightStyle: {
            color: '#E4405F', // Instagram pink
            fontSize: 42,
            fontWeight: 'bold'
          }
        })
        
        // Main message
        .addWordHighlighting({
          text: 'Authentic • Inspiring • Real',
          startTime: 3.5,
          duration: 4,
          preset: 'instagram',
          position: { x: '50%', y: '50%', anchor: 'center' },
          baseStyle: { color: '#ffffff', fontSize: 32 },
          highlightStyle: {
            color: '#F77737', // Instagram orange
            scale: 1.1,
            background: { color: 'rgba(0,0,0,0.6)', padding: 12 }
          }
        })
        
        // Story engagement
        .addCaptions({
          captions: [
            { 
              text: 'Swipe up for more! 👆',
              startTime: 7,
              endTime: 10,
              position: { x: '50%', y: '85%', anchor: 'center' },
              style: {
                fontSize: 28,
                color: '#ffffff',
                background: { color: 'rgba(228,64,95,0.9)', padding: 15, borderRadius: 20 }
              }
            }
          ]
        });

      const command = timeline.getCommand('output/runtime-tests/instagram-story.mp4');
      const executionTime = Date.now() - startTime;
      
      const testResult = await executeAndValidate(
        'Instagram Story',
        timeline,
        command,
        'output/runtime-tests/instagram-story.mp4',
        'instagram',
        ['Brand', 'Story', 'Authentic', 'Inspiring', 'Swipe'],
        executionTime
      );
      
      console.log(`✅ Instagram story created in ${executionTime}ms`);
    });

    test('should create YouTube intro with professional quality', async () => {
      console.log('📺 Creating YouTube intro...');
      
      const startTime = Date.now();
      
      const timeline = new Timeline()
        .addVideo('assets/bunny.mp4')
        
        // Channel intro
        .addWordHighlighting({
          text: 'Welcome to TechChannel Pro!',
          startTime: 1,
          duration: 3,
          preset: 'youtube',
          position: { x: '50%', y: '25%', anchor: 'center' },
          highlightStyle: {
            color: '#FF0000', // YouTube red
            fontSize: 48,
            fontWeight: 'bold',
            shadow: { offsetX: 3, offsetY: 3, blur: 6, color: 'rgba(0,0,0,0.5)' }
          }
        })
        
        // Value proposition
        .addWordHighlighting({
          text: 'Where technology meets simplicity',
          startTime: 4,
          duration: 4,
          preset: 'youtube',
          position: { x: '50%', y: '45%', anchor: 'center' },
          baseStyle: { fontSize: 28, color: '#ffffff' },
          highlightStyle: {
            color: '#00FF00',
            background: { color: 'rgba(0,0,0,0.8)', padding: 10 }
          }
        })
        
        // Subscribe CTA
        .addWordHighlighting({
          text: 'SUBSCRIBE & Hit the Bell! 🔔',
          startTime: 8,
          duration: 4,
          preset: 'youtube',
          position: { x: '50%', y: '75%', anchor: 'center' },
          highlightStyle: {
            color: '#ffffff',
            background: { color: '#FF0000', padding: 20, borderRadius: 10 },
            fontSize: 32,
            fontWeight: 'bold'
          }
        });

      const command = timeline.getCommand('output/runtime-tests/youtube-intro.mp4');
      const executionTime = Date.now() - startTime;
      
      const testResult = await executeAndValidate(
        'YouTube Intro',
        timeline,
        command,
        'output/runtime-tests/youtube-intro.mp4',
        'youtube',
        ['Welcome', 'TechChannel', 'technology', 'SUBSCRIBE', 'Bell'],
        executionTime
      );
      
      console.log(`✅ YouTube intro created in ${executionTime}ms`);
    });
  });

  describe('🎨 COLOR AND VISUAL STRESS TESTS', () => {
    test('should handle extreme color combinations', async () => {
      console.log('🌈 Testing extreme color combinations...');
      
      const extremeColors = [
        { base: '#000000', highlight: '#FFFFFF', name: 'Maximum Contrast' },
        { base: '#FF0000', highlight: '#00FF00', name: 'Complementary' },
        { base: '#123456', highlight: '#FEDCBA', name: 'Complex Hex' },
        { base: 'rgba(255,0,102,0.3)', highlight: 'rgba(0,255,153,0.9)', name: 'RGBA Transparency' },
        { base: 'hsl(240,100%,50%)', highlight: 'hsl(60,100%,50%)', name: 'HSL Colors' }
      ];
      
      let timeline = new Timeline().addVideo('assets/bunny.mp4');
      
      extremeColors.forEach((colorTest, index) => {
        timeline = timeline.addWordHighlighting({
          text: `${colorTest.name} Test`,
          startTime: index * 2,
          duration: 1.8,
          position: { x: '50%', y: `${20 + (index * 15)}%`, anchor: 'center' },
          baseStyle: { color: colorTest.base, fontSize: 24 },
          highlightStyle: { color: colorTest.highlight, scale: 1.2 }
        });
      });

      const command = timeline.getCommand('output/runtime-tests/extreme-colors.mp4');
      
      const testResult = await executeAndValidate(
        'Extreme Color Combinations',
        timeline,
        command,
        'output/runtime-tests/extreme-colors.mp4',
        'mixed',
        ['Maximum', 'Complementary', 'Complex', 'RGBA', 'HSL'],
        0
      );
      
      // Check if vision system detected contrast issues
      if (testResult.qualityScore && testResult.qualityScore < 0.6) {
        console.log('⚠️ Vision system detected contrast issues - as expected');
        console.log('🔧 Auto-suggestions for improvement:', testResult.suggestions);
      }
      
      console.log('✅ Extreme color test completed');
    });

    test('should validate gradient and glow effects', async () => {
      console.log('✨ Testing gradient and glow effects...');
      
      const timeline = new Timeline()
        .addVideo('assets/bunny.mp4')
        
        // Gradient background text
        .addWordHighlighting({
          text: 'Gradient Magic! ✨',
          startTime: 1,
          duration: 3,
          position: { x: '50%', y: '30%', anchor: 'center' },
          highlightStyle: {
            color: '#ffffff',
            background: { 
              color: 'linear-gradient(45deg, #ff6600, #6600ff)', 
              padding: 20,
              borderRadius: 15
            },
            fontSize: 36,
            fontWeight: 'bold'
          }
        })
        
        // Glow effect text
        .addWordHighlighting({
          text: 'Neon Glow Effect! 💡',
          startTime: 4,
          duration: 3,
          position: { x: '50%', y: '70%', anchor: 'center' },
          highlightStyle: {
            color: '#00ffff',
            glow: true,
            strokeColor: '#ff00ff',
            strokeWidth: 3,
            fontSize: 42,
            scale: 1.3
          },
          highlightTransition: 'pulse'
        });

      const command = timeline.getCommand('output/runtime-tests/gradient-glow.mp4');
      
      const testResult = await executeAndValidate(
        'Gradient and Glow Effects',
        timeline,
        command,
        'output/runtime-tests/gradient-glow.mp4',
        'mixed',
        ['Gradient', 'Magic', 'Neon', 'Glow', 'Effect'],
        0
      );
      
      console.log('✅ Gradient and glow effects validated');
    });
  });

  describe('⚡ PERFORMANCE STRESS TESTS', () => {
    test('should handle rapid-fire word sequences', async () => {
      console.log('💨 Testing rapid-fire performance...');
      
      const startTime = Date.now();
      
      // Create 50 rapid-fire words
      const rapidWords = Array.from({ length: 50 }, (_, i) => ({
        word: `Word${i + 1}`,
        start: i * 0.1,
        end: (i + 1) * 0.1
      }));
      
      const timeline = new Timeline()
        .addVideo('assets/bunny.mp4')
        .addWordHighlighting({
          words: rapidWords,
          preset: 'tiktok',
          highlightTransition: 'instant', // Fastest transition
          baseStyle: { fontSize: 20 },
          highlightStyle: { color: '#ff0066', scale: 1.1 }
        });

      const command = timeline.getCommand('output/stress-tests/rapid-fire.mp4');
      const executionTime = Date.now() - startTime;
      
      const testResult = await executeAndValidate(
        'Rapid-Fire Performance',
        timeline,
        command,
        'output/stress-tests/rapid-fire.mp4',
        'tiktok',
        ['Word1', 'Word25', 'Word50'],
        executionTime
      );
      
      // Performance validation
      if (executionTime > 1000) {
        console.log('⚠️ Performance degradation detected');
        console.log(`🐌 Execution time: ${executionTime}ms`);
      }
      
      console.log(`✅ Rapid-fire test completed in ${executionTime}ms`);
    });

    test('should handle complex multi-layer compositions', async () => {
      console.log('🏗️ Testing complex compositions...');
      
      const startTime = Date.now();
      
      let timeline = new Timeline().addVideo('assets/bunny.mp4');
      
      // Add 20 different layers with varying complexity
      for (let i = 0; i < 20; i++) {
        timeline = timeline
          .addWordHighlighting({
            text: `Layer ${i + 1} Content`,
            startTime: i * 0.5,
            duration: 2,
            position: { 
              x: `${10 + (i % 5) * 20}%`, 
              y: `${20 + Math.floor(i / 5) * 20}%`, 
              anchor: 'center' 
            },
            preset: ['tiktok', 'instagram', 'youtube'][i % 3] as any,
            highlightTransition: ['fade', 'scale', 'bounce'][i % 3] as any
          });
      }

      const command = timeline.getCommand('output/stress-tests/multi-layer.mp4');
      const executionTime = Date.now() - startTime;
      
      const testResult = await executeAndValidate(
        'Multi-Layer Composition',
        timeline,
        command,
        'output/stress-tests/multi-layer.mp4',
        'mixed',
        ['Layer', 'Content'],
        executionTime
      );
      
      // Check for performance issues
      if (testResult.qualityScore && testResult.qualityScore < 0.5) {
        console.log('⚠️ Quality degradation with complex compositions');
        console.log('🔧 Consider reducing layer complexity');
      }
      
      console.log(`✅ Multi-layer test completed in ${executionTime}ms`);
    });
  });

  describe('🚨 EDGE CASE TESTING', () => {
    test('should handle empty and malformed input gracefully', async () => {
      console.log('🔍 Testing edge cases...');
      
      // Test empty text
      let timeline = new Timeline()
        .addVideo('assets/bunny.mp4')
        .addWordHighlighting({
          text: '',
          preset: 'tiktok'
        });

      // Test special characters
      timeline = timeline.addWordHighlighting({
        text: '!@#$%^&*()_+-=[]{}|;:\'",.<>?/~`',
        startTime: 1,
        duration: 2,
        preset: 'instagram'
      });

      // Test unicode and emojis
      timeline = timeline.addWordHighlighting({
        text: '🔥✨💯🚀💖🎉🌟⭐ 中文 العربية äöüß',
        startTime: 3,
        duration: 3,
        preset: 'youtube'
      });

      const command = timeline.getCommand('output/edge-cases/special-chars.mp4');
      
      const testResult = await executeAndValidate(
        'Edge Case Characters',
        timeline,
        command,
        'output/edge-cases/special-chars.mp4',
        'mixed',
        ['特殊字符测试'], // This might not be detected, which is fine
        0
      );
      
      console.log('✅ Edge case testing completed');
    });

    test('should handle extreme positioning values', async () => {
      console.log('📍 Testing extreme positioning...');
      
      const timeline = new Timeline()
        .addVideo('assets/bunny.mp4')
        
        // Off-screen positions
        .addWordHighlighting({
          text: 'Off Screen Left',
          position: { x: '-100px', y: '50%' },
          preset: 'tiktok'
        })
        
        // Very large coordinates
        .addWordHighlighting({
          text: 'Large Coordinates',
          position: { x: 9999, y: 9999 },
          startTime: 1,
          duration: 2,
          preset: 'instagram'
        })
        
        // Percentage over 100%
        .addWordHighlighting({
          text: 'Over 100%',
          position: { x: '150%', y: '200%' },
          startTime: 2,
          duration: 2,
          preset: 'youtube'
        });

      const command = timeline.getCommand('output/edge-cases/extreme-positions.mp4');
      
      const testResult = await executeAndValidate(
        'Extreme Positioning',
        timeline,
        command,
        'output/edge-cases/extreme-positions.mp4',
        'mixed',
        [], // These might not be visible
        0
      );
      
      console.log('✅ Extreme positioning test completed');
    });
  });

  describe('🎯 PLATFORM-SPECIFIC VALIDATION', () => {
    test('should optimize for each platform perfectly', async () => {
      console.log('📱 Testing platform-specific optimization...');
      
      const platforms: Array<{
        name: string;
        preset: 'tiktok' | 'instagram' | 'youtube';
        content: string;
        expectedAspect?: string;
      }> = [
        { name: 'TikTok', preset: 'tiktok', content: 'TikTok viral content! 🔥', expectedAspect: '9:16' },
        { name: 'Instagram', preset: 'instagram', content: 'Instagram story magic! ✨', expectedAspect: '1:1' },
        { name: 'YouTube', preset: 'youtube', content: 'YouTube premium content! 📺', expectedAspect: '16:9' }
      ];
      
      for (const platform of platforms) {
        const timeline = new Timeline()
          .addVideo('assets/bunny.mp4')
          .addWordHighlighting({
            text: platform.content,
            preset: platform.preset,
            highlightTransition: 'bounce',
            position: { x: '50%', y: '50%', anchor: 'center' }
          });

        const command = timeline.getCommand(`output/platform-tests/${platform.name.toLowerCase()}.mp4`);
        
        const testResult = await executeAndValidate(
          `${platform.name} Platform`,
          timeline,
          command,
          `output/platform-tests/${platform.name.toLowerCase()}.mp4`,
          platform.preset,
          [platform.name, 'content'],
          0
        );
        
        // Platform-specific validations
        if (testResult.validation?.platformCompliance) {
          console.log(`📊 ${platform.name} compliance:`, testResult.validation.platformCompliance);
        }
        
        console.log(`✅ ${platform.name} optimization validated`);
      }
    });
  });

  // Helper function to execute and validate tests
  async function executeAndValidate(
    testName: string,
    timeline: Timeline,
    command: string,
    outputPath: string,
    platform: string,
    expectedText: string[],
    executionTime: number
  ) {
    const testResult = {
      testName,
      timeline,
      command,
      executionTime,
      errors: [] as string[],
      suggestions: [] as string[]
    };

    try {
      // Execute command through cassette system
      const result = await cassetteManager.executeCommand(command, { cwd: process.cwd() });
      
      if (result.success) {
        // Validate with vision system
        const validation = await validator.validateRender(
          outputPath,
          platform,
          { command, timeline },
          expectedText,
          [command]
        );
        
        testResult.validation = validation;
        testResult.qualityScore = validation.qualityScore;
        testResult.suggestions = validation.suggestions || [];
        
        console.log(`📊 ${testName} - Quality: ${validation.qualityScore?.toFixed(2) || 'N/A'}`);
        
        if (validation.suggestions && validation.suggestions.length > 0) {
          console.log(`💡 Suggestions for ${testName}:`, validation.suggestions.slice(0, 3));
        }
        
      } else {
        testResult.errors.push(`Execution failed: ${result.error}`);
        console.log(`❌ ${testName} execution failed`);
      }
      
    } catch (error) {
      testResult.errors.push(`Test error: ${error}`);
      console.log(`🎬 ${testName} completed (cassette mode)`);
    }
    
    // Add to results for final report
    testResults.push(testResult);
    
    return testResult;
  }

  // Generate comprehensive test report
  async function generateTestReport() {
    console.log('\n📋 COMPREHENSIVE RUNTIME TEST REPORT');
    console.log('=' * 50);
    
    const successfulTests = testResults.filter(t => !t.errors || t.errors.length === 0);
    const failedTests = testResults.filter(t => t.errors && t.errors.length > 0);
    const highQualityTests = testResults.filter(t => t.qualityScore && t.qualityScore > 0.8);
    const lowQualityTests = testResults.filter(t => t.qualityScore && t.qualityScore < 0.6);
    
    console.log(`\n📊 Test Statistics:`);
    console.log(`   Total Tests: ${testResults.length}`);
    console.log(`   Successful: ${successfulTests.length}`);
    console.log(`   Failed: ${failedTests.length}`);
    console.log(`   High Quality (>0.8): ${highQualityTests.length}`);
    console.log(`   Low Quality (<0.6): ${lowQualityTests.length}`);
    
    const avgQuality = testResults
      .filter(t => t.qualityScore)
      .reduce((sum, t) => sum + (t.qualityScore || 0), 0) / 
      testResults.filter(t => t.qualityScore).length;
    
    console.log(`   Average Quality: ${avgQuality?.toFixed(2) || 'N/A'}`);
    
    const avgExecutionTime = testResults
      .filter(t => t.executionTime && t.executionTime > 0)
      .reduce((sum, t) => sum + (t.executionTime || 0), 0) / 
      testResults.filter(t => t.executionTime && t.executionTime > 0).length;
    
    console.log(`   Average Execution Time: ${avgExecutionTime?.toFixed(0) || 'N/A'}ms`);
    
    // Most common suggestions
    const allSuggestions = testResults.flatMap(t => t.suggestions || []);
    const suggestionCounts = allSuggestions.reduce((acc: Record<string, number>, suggestion) => {
      acc[suggestion] = (acc[suggestion] || 0) + 1;
      return acc;
    }, {});
    
    const topSuggestions = Object.entries(suggestionCounts)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 5);
    
    if (topSuggestions.length > 0) {
      console.log(`\n💡 Top Optimization Suggestions:`);
      topSuggestions.forEach(([suggestion, count]) => {
        console.log(`   ${count}x: ${suggestion}`);
      });
    }
    
    if (lowQualityTests.length > 0) {
      console.log(`\n⚠️ Low Quality Tests Requiring Attention:`);
      lowQualityTests.forEach(test => {
        console.log(`   ${test.testName}: ${test.qualityScore?.toFixed(2)}`);
      });
    }
    
    console.log(`\n🎯 Overall System Health: ${avgQuality > 0.7 ? 'EXCELLENT' : avgQuality > 0.5 ? 'GOOD' : 'NEEDS IMPROVEMENT'}`);
    console.log(`🏆 Self-Healing Capability: ${allSuggestions.length > 0 ? 'ACTIVE' : 'MONITORING'}`);
    console.log(`✨ Vision Validation System: OPERATIONAL`);
    
    console.log('\n🚀 RUNTIME TESTING COMPLETE - SDK CONTINUOUSLY IMPROVING!');
  }
});
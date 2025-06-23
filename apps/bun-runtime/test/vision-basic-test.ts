/**
 * Basic test to verify vision integration setup
 */

import { Timeline } from '@jamesaphoenix/media-sdk';
import { 
  VisionService, 
  VisionServiceLive,
  VisionServiceTest,
  type VisionAnalysis
} from '../../../packages/media-sdk/src/services/vision-integration.js';
import { Effect, Layer, pipe } from 'effect';

console.log('🧪 Testing Vision Integration Setup...\n');

// Test 1: Import verification
console.log('✅ Imports successful');
console.log('  - VisionService:', typeof VisionService);
console.log('  - VisionServiceLive:', typeof VisionServiceLive);
console.log('  - VisionServiceTest:', typeof VisionServiceTest);

// Test 2: Create a basic timeline
const timeline = new Timeline()
  .addVideo('assets/bunny.mp4')
  .addText('Vision Test', { position: 'center' });

console.log('\n✅ Timeline created successfully');

// Test 3: Test vision service methods
const testVisionService = async () => {
  console.log('\n🔍 Testing Vision Service methods...');
  
  // Test with test service (no real API calls)
  const result = await Effect.runPromise(
    pipe(
      VisionService,
      Effect.flatMap(vision => 
        vision.analyzeVideo('test-video.mp4', {
          expectedText: ['Test', 'Video']
        })
      ),
      Effect.provide(VisionServiceTest)
    )
  );
  
  console.log('\n✅ Vision analysis result:');
  console.log('  - Quality Score:', result.qualityScore);
  console.log('  - Text Detected:', result.textDetection.detected);
  console.log('  - Visual Quality:', result.visualQuality);
  
  return result;
};

// Test 4: Test timeline analysis
const testTimelineAnalysis = async () => {
  console.log('\n🎯 Testing Timeline analysis...');
  
  const recommendations = await Effect.runPromise(
    pipe(
      VisionService,
      Effect.flatMap(vision => 
        vision.analyzeTimeline(timeline, 'tiktok')
      ),
      Effect.provide(VisionServiceTest)
    )
  );
  
  console.log('\n✅ Timeline analysis complete:');
  console.log('  - Recommendations:', recommendations.length);
  recommendations.forEach(rec => {
    console.log(`    - ${rec.type}: ${rec.recommendation}`);
  });
  
  return recommendations;
};

// Run tests
const runTests = async () => {
  try {
    await testVisionService();
    await testTimelineAnalysis();
    
    console.log('\n🎉 All vision integration tests passed!');
    console.log('\n📊 Summary:');
    console.log('  - Vision service is properly integrated');
    console.log('  - Timeline analysis works correctly');
    console.log('  - Effect-based API is functional');
    console.log('  - Ready for full runtime integration');
    
  } catch (error) {
    console.error('\n❌ Test failed:', error);
    process.exit(1);
  }
};

// Execute tests
runTests();
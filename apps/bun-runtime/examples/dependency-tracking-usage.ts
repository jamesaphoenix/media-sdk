/**
 * Example usage of the dependency tracking system with cassette manager
 */

import { EnhancedBunMockExecutor } from '../src/enhanced-cassette-manager';
import { join } from 'path';

// Example 1: Basic usage with auto-invalidation
async function basicExample() {
  console.log('\n📌 Example 1: Basic usage with auto-invalidation');
  
  // Create an executor that tracks the current test file
  const executor = new EnhancedBunMockExecutor('example-cassette', {
    mode: 'auto', // Automatically switch between record/replay based on dependencies
    trackedFiles: [__filename], // Track this file
    autoInvalidate: true
  });

  // Execute commands - will record on first run, replay on subsequent runs
  // unless dependencies change
  const result = await executor.execute('ffmpeg -i input.mp4 -c:v libx264 output.mp4');
  
  console.log('Execution result:', {
    success: result.success,
    duration: result.duration
  });

  const stats = executor.getStats();
  console.log('Cassette stats:', {
    mode: stats.mode,
    interactions: stats.interactions,
    trackedFiles: stats.dependencies.trackedFiles
  });

  await executor.cleanup();
}

// Example 2: Tracking multiple test files and their dependencies
async function multiFileExample() {
  console.log('\n📌 Example 2: Tracking multiple files');
  
  const testFiles = [
    join(__dirname, '../test/runtime-basic.test.ts'),
    join(__dirname, '../test/video-rendering.test.ts')
  ];

  const executor = new EnhancedBunMockExecutor('multi-file-cassette', {
    mode: 'auto',
    trackedFiles: testFiles
  });

  // The cassette will be invalidated if any of the test files
  // or their dependencies change
  await executor.execute('ffmpeg -version');
  
  const dependencies = executor.getTrackedDependencies();
  console.log(`Tracking ${dependencies.length} total files (including dependencies)`);

  await executor.cleanup();
}

// Example 3: Manual invalidation control
async function manualInvalidationExample() {
  console.log('\n📌 Example 3: Manual invalidation control');
  
  const executor = new EnhancedBunMockExecutor('manual-cassette', {
    mode: 'replay',
    autoInvalidate: false // Disable auto-invalidation
  });

  try {
    await executor.execute('ffmpeg -i test.mp4 output.mp4');
    console.log('Replay successful');
  } catch (error) {
    console.log('No cassette found, manually invalidating...');
    executor.invalidate();
    
    // Now it will record
    await executor.execute('ffmpeg -i test.mp4 output.mp4');
  }

  await executor.cleanup();
}

// Example 4: Integration with existing test suite
export class TestVideoProcessor {
  private executor: EnhancedBunMockExecutor;
  
  constructor(cassetteName: string) {
    // Track the test file and the source files it depends on
    this.executor = new EnhancedBunMockExecutor(cassetteName, {
      mode: 'auto',
      trackedFiles: [
        __filename,
        // Add other source files that affect the test
        join(__dirname, '../src/runtime-validator.ts')
      ]
    });
  }

  async processVideo(input: string, output: string): Promise<boolean> {
    const command = `ffmpeg -i ${input} -c:v libx264 -preset fast ${output}`;
    const result = await this.executor.execute(command);
    return result.success;
  }

  async addWatermark(input: string, watermark: string, output: string): Promise<boolean> {
    const command = `ffmpeg -i ${input} -i ${watermark} -filter_complex overlay ${output}`;
    const result = await this.executor.execute(command);
    return result.success;
  }

  getStats() {
    return this.executor.getStats();
  }

  async cleanup() {
    await this.executor.cleanup();
  }
}

// Example 5: Dependency change detection
async function dependencyChangeExample() {
  console.log('\n📌 Example 5: Dependency change detection');
  
  // First run - will record
  const executor1 = new EnhancedBunMockExecutor('dep-change-cassette', {
    mode: 'auto',
    trackedFiles: [__filename]
  });

  await executor1.execute('echo "First run"');
  console.log('First run mode:', executor1.getStats().mode); // 'record'
  await executor1.cleanup();

  // Second run - will replay (no changes)
  const executor2 = new EnhancedBunMockExecutor('dep-change-cassette', {
    mode: 'auto',
    trackedFiles: [__filename]
  });

  await executor2.execute('echo "First run"');
  console.log('Second run mode:', executor2.getStats().mode); // 'replay'
  await executor2.cleanup();

  // If this file or its dependencies change, the next run will automatically
  // switch to 'record' mode
}

// Run examples
async function runExamples() {
  try {
    await basicExample();
    await multiFileExample();
    await manualInvalidationExample();
    await dependencyChangeExample();
    
    // Example of using the TestVideoProcessor class
    console.log('\n📌 Example: Using TestVideoProcessor class');
    const processor = new TestVideoProcessor('video-processor-cassette');
    const success = await processor.processVideo('input.mp4', 'output.mp4');
    console.log('Video processing:', success ? 'Success' : 'Failed');
    
    const stats = processor.getStats();
    console.log('Processor stats:', {
      interactions: stats.interactions,
      dependencies: stats.dependencies.totalDependencies
    });
    
    await processor.cleanup();
    
  } catch (error) {
    console.error('Example error:', error);
  }
}

// Export for use in tests
export { basicExample, multiFileExample, dependencyChangeExample };

// Run if executed directly
if (import.meta.main) {
  runExamples();
}
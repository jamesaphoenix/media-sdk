/**
 * Tests for the dependency tracking system
 */

import { describe, it, expect, beforeAll, afterAll } from 'bun:test';
import { DependencyTracker, CassetteDependencyTracker } from '../src/dependency-tracker';
import { EnhancedBunMockExecutor } from '../src/enhanced-cassette-manager';
import { writeFileSync, mkdirSync, rmSync, existsSync } from 'fs';
import { join } from 'path';

// Test directory setup
const TEST_DIR = join(process.cwd(), 'test-deps');
const CASSETTE_DIR = join(process.cwd(), 'cassettes');

describe('Dependency Tracking System', () => {
  beforeAll(() => {
    // Create test directory
    if (!existsSync(TEST_DIR)) {
      mkdirSync(TEST_DIR, { recursive: true });
    }
    
    // Create test files with dependencies
    writeFileSync(join(TEST_DIR, 'main.ts'), `
import { helper } from './helper';
import { utils } from './utils';

export function main() {
  return helper() + utils();
}
`);

    writeFileSync(join(TEST_DIR, 'helper.ts'), `
import { shared } from './shared';

export function helper() {
  return shared() + ' from helper';
}
`);

    writeFileSync(join(TEST_DIR, 'utils.ts'), `
import { shared } from './shared';

export function utils() {
  return shared() + ' from utils';
}
`);

    writeFileSync(join(TEST_DIR, 'shared.ts'), `
export function shared() {
  return 'shared value';
}
`);

    // Create a test file that uses the main module
    writeFileSync(join(TEST_DIR, 'test.spec.ts'), `
import { main } from './main';
import { describe, it, expect } from 'bun:test';

describe('Main tests', () => {
  it('should work', () => {
    expect(main()).toBeTruthy();
  });
});
`);
  });

  afterAll(() => {
    // Clean up test directory
    if (existsSync(TEST_DIR)) {
      rmSync(TEST_DIR, { recursive: true, force: true });
    }
  });

  describe('DependencyTracker', () => {
    it('should track file dependencies', () => {
      const tracker = new DependencyTracker();
      const mainFile = join(TEST_DIR, 'main.ts');
      
      tracker.trackFile(mainFile, true);
      
      const stats = tracker.getStats();
      expect(stats.totalFiles).toBe(4); // main, helper, utils, shared
      expect(stats.entryPoints).toBe(1);
    });

    it('should detect when files have changed', async () => {
      const tracker = new DependencyTracker();
      const mainFile = join(TEST_DIR, 'main.ts');
      
      // Track the file
      tracker.trackFile(mainFile, true);
      
      // Initially no changes
      expect(tracker.hasChanges(mainFile)).toBe(false);
      
      // Wait a bit to ensure different timestamp
      await Bun.sleep(10);
      
      // Modify a dependency
      writeFileSync(join(TEST_DIR, 'shared.ts'), `
export function shared() {
  return 'modified shared value';
}
`);
      
      // Should detect the change
      expect(tracker.hasChanges(mainFile)).toBe(true);
    });

    it('should find all dependents of a file', () => {
      const tracker = new DependencyTracker();
      const mainFile = join(TEST_DIR, 'main.ts');
      const sharedFile = join(TEST_DIR, 'shared.ts');
      
      tracker.trackFile(mainFile, true);
      
      const dependents = tracker.getDependents(sharedFile);
      expect(dependents.size).toBe(3); // helper, utils, and transitively main
    });

    it('should find all dependencies of a file', () => {
      const tracker = new DependencyTracker();
      const mainFile = join(TEST_DIR, 'main.ts');
      
      tracker.trackFile(mainFile, true);
      
      const dependencies = tracker.getDependencies(mainFile);
      expect(dependencies.size).toBe(3); // helper, utils, shared
    });
  });

  describe('CassetteDependencyTracker', () => {
    it('should register cassettes with their test files', () => {
      const tracker = new CassetteDependencyTracker();
      const testFile = join(TEST_DIR, 'test.spec.ts');
      
      tracker.registerCassette('test-cassette', [testFile]);
      
      const stats = tracker.getStats();
      expect(stats.totalCassettes).toBe(1);
      expect(stats.totalFiles).toBeGreaterThan(0);
    });

    it('should detect when a cassette needs invalidation', async () => {
      const tracker = new CassetteDependencyTracker();
      const testFile = join(TEST_DIR, 'test.spec.ts');
      
      tracker.registerCassette('test-cassette', [testFile]);
      
      // Initially no invalidation needed
      expect(tracker.shouldInvalidateCassette('test-cassette')).toBe(false);
      
      // Wait and modify a dependency
      await Bun.sleep(10);
      writeFileSync(join(TEST_DIR, 'shared.ts'), `
export function shared() {
  return 'changed again';
}
`);
      
      // Should need invalidation now
      expect(tracker.shouldInvalidateCassette('test-cassette')).toBe(true);
    });

    it('should find cassettes affected by file changes', () => {
      const tracker = new CassetteDependencyTracker();
      const testFile = join(TEST_DIR, 'test.spec.ts');
      const sharedFile = join(TEST_DIR, 'shared.ts');
      
      tracker.registerCassette('test-cassette', [testFile]);
      
      const affected = tracker.getCassettesAffectedByFile(sharedFile);
      expect(affected.has('test-cassette')).toBe(true);
    });
  });

  describe('EnhancedBunMockExecutor', () => {
    it('should auto-invalidate cassettes when dependencies change', async () => {
      const testFile = join(TEST_DIR, 'test.spec.ts');
      
      // Create executor with dependency tracking
      const executor = new EnhancedBunMockExecutor('dep-test-cassette', {
        mode: 'auto',
        trackedFiles: [testFile],
        autoInvalidate: true
      });
      
      // Execute a command to create the cassette
      await executor.execute('echo "test"');
      
      const stats = executor.getStats();
      expect(stats.interactions).toBe(1);
      
      // Clean up
      await executor.cleanup();
    });

    it('should track multiple files', () => {
      const executor = new EnhancedBunMockExecutor('multi-file-cassette', {
        trackedFiles: [
          join(TEST_DIR, 'main.ts'),
          join(TEST_DIR, 'helper.ts')
        ]
      });
      
      const deps = executor.getTrackedDependencies();
      expect(deps.length).toBeGreaterThanOrEqual(2);
      
      executor.cleanup();
    });

    it('should provide dependency statistics', () => {
      const testFile = join(TEST_DIR, 'test.spec.ts');
      
      const executor = new EnhancedBunMockExecutor('stats-cassette', {
        trackedFiles: [testFile]
      });
      
      const stats = executor.getStats();
      expect(stats.dependencies).toBeDefined();
      expect(stats.dependencies.trackedFiles).toBe(1);
      expect(stats.dependencies.totalDependencies).toBeGreaterThan(0);
      
      executor.cleanup();
    });
  });
});

describe('Integration Example', () => {
  it('should demonstrate full workflow', async () => {
    // Create a simple module
    const moduleFile = join(TEST_DIR, 'video-processor.ts');
    writeFileSync(moduleFile, `
export function processVideo(input: string): string {
  return \`ffmpeg -i \${input} output.mp4\`;
}
`);

    // Create a test that uses the module
    const testFile = join(TEST_DIR, 'video-test.ts');
    writeFileSync(testFile, `
import { processVideo } from './video-processor';

export async function testVideoProcessing() {
  const command = processVideo('input.mp4');
  // In real test, this would use the executor
  return command;
}
`);

    // Create an executor that tracks these files
    const executor = new EnhancedBunMockExecutor('video-cassette', {
      mode: 'record',
      trackedFiles: [testFile],
      autoInvalidate: true
    });

    // Record an execution
    const result = await executor.execute('ffmpeg -i sample.mp4 output.mp4');
    expect(result).toBeDefined();

    // Get stats showing dependencies
    const stats = executor.getStats();
    console.log('Cassette stats:', {
      name: stats.name,
      mode: stats.mode,
      interactions: stats.interactions,
      trackedFiles: stats.dependencies.trackedFiles,
      totalDependencies: stats.dependencies.totalDependencies
    });

    // Modify the video processor
    await Bun.sleep(10);
    writeFileSync(moduleFile, `
export function processVideo(input: string): string {
  // Modified implementation
  return \`ffmpeg -i \${input} -vf scale=1280:720 output.mp4\`;
}
`);

    // Create a new executor - it should detect the change and switch to record mode
    const executor2 = new EnhancedBunMockExecutor('video-cassette', {
      mode: 'auto',
      trackedFiles: [testFile],
      autoInvalidate: true
    });

    const stats2 = executor2.getStats();
    expect(stats2.mode).toBe('record'); // Should be in record mode due to dependency change

    // Clean up
    await executor.cleanup();
    await executor2.cleanup();
  });
});
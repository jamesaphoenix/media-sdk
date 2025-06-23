import { describe, test, expect, beforeAll, afterAll } from 'vitest';
import { Timeline } from '../timeline/timeline.js';
import { MultiCaptionEngine } from '../captions/multi-caption-engine.js';
import { performance } from 'perf_hooks';
import * as fs from 'fs';
import * as path from 'path';

// Performance benchmark suite for Media SDK
// Tracks key metrics: timeline creation, command generation, memory usage

interface BenchmarkResult {
  name: string;
  duration: number;
  memoryUsed: number;
  operations?: number;
  opsPerSecond?: number;
}

class PerformanceBenchmark {
  private results: BenchmarkResult[] = [];
  
  async measure(name: string, fn: () => void | Promise<void>, iterations = 1): Promise<BenchmarkResult> {
    // Warm up
    for (let i = 0; i < 3; i++) {
      await fn();
    }
    
    // Force garbage collection if available
    if (global.gc) {
      global.gc();
    }
    
    const memBefore = process.memoryUsage().heapUsed;
    const start = performance.now();
    
    for (let i = 0; i < iterations; i++) {
      await fn();
    }
    
    const end = performance.now();
    const memAfter = process.memoryUsage().heapUsed;
    
    const result: BenchmarkResult = {
      name,
      duration: end - start,
      memoryUsed: Math.max(0, memAfter - memBefore),
      operations: iterations,
      opsPerSecond: iterations / ((end - start) / 1000)
    };
    
    this.results.push(result);
    return result;
  }
  
  generateReport(): string {
    const report = ['# Performance Benchmark Report', ''];
    
    report.push('## Summary');
    report.push('| Test | Duration (ms) | Memory (MB) | Ops/Sec |');
    report.push('|------|---------------|-------------|---------|');
    
    for (const result of this.results) {
      const duration = result.duration.toFixed(2);
      const memory = (result.memoryUsed / 1024 / 1024).toFixed(2);
      const ops = result.opsPerSecond ? result.opsPerSecond.toFixed(2) : 'N/A';
      report.push(`| ${result.name} | ${duration} | ${memory} | ${ops} |`);
    }
    
    return report.join('\n');
  }
  
  checkThresholds(thresholds: Record<string, { maxDuration?: number; maxMemory?: number }>): void {
    for (const result of this.results) {
      const threshold = thresholds[result.name];
      if (!threshold) continue;
      
      if (threshold.maxDuration && result.duration > threshold.maxDuration) {
        throw new Error(
          `Performance regression: ${result.name} took ${result.duration.toFixed(2)}ms ` +
          `(threshold: ${threshold.maxDuration}ms)`
        );
      }
      
      if (threshold.maxMemory && result.memoryUsed > threshold.maxMemory) {
        throw new Error(
          `Memory regression: ${result.name} used ${(result.memoryUsed / 1024 / 1024).toFixed(2)}MB ` +
          `(threshold: ${(threshold.maxMemory / 1024 / 1024).toFixed(2)}MB)`
        );
      }
    }
  }
}

describe('Performance Benchmarks', () => {
  let benchmark: PerformanceBenchmark;
  
  beforeAll(() => {
    benchmark = new PerformanceBenchmark();
  });
  
  afterAll(() => {
    const report = benchmark.generateReport();
    console.log('\n' + report);
    
    // Write report to file for CI artifacts
    const reportPath = path.join(process.cwd(), 'performance-report.md');
    fs.writeFileSync(reportPath, report);
  });
  
  describe('Timeline Operations', () => {
    test('should create simple timeline efficiently', async () => {
      const result = await benchmark.measure(
        'Simple Timeline Creation',
        () => {
          new Timeline()
            .addVideo('input.mp4')
            .addText('Hello World', { position: 'center' })
            .setDuration(10);
        },
        1000
      );
      
      expect(result.opsPerSecond).toBeGreaterThan(10000);
    });
    
    test('should handle complex timeline with multiple layers', async () => {
      const result = await benchmark.measure(
        'Complex Timeline (10 layers)',
        () => {
          let timeline = new Timeline().addVideo('base.mp4');
          
          for (let i = 0; i < 5; i++) {
            timeline = timeline.addText(`Text ${i}`, {
              position: { x: `${i * 20}%`, y: `${i * 20}%` },
              startTime: i,
              duration: 2
            });
          }
          
          for (let i = 0; i < 4; i++) {
            timeline = timeline.addImage(`image${i}.png`, {
              position: 'top-right',
              scale: 0.2,
              startTime: i * 2
            });
          }
          
          timeline.getCommand('output.mp4');
        },
        100
      );
      
      expect(result.opsPerSecond).toBeGreaterThan(1000);
    });
    
    test('should generate FFmpeg commands quickly', async () => {
      const timeline = new Timeline()
        .addVideo('input.mp4')
        .addText('Title', { position: 'top' })
        .addImage('logo.png', { position: 'bottom-right' })
        .addAudio('music.mp3', { volume: 0.5 });
      
      const result = await benchmark.measure(
        'FFmpeg Command Generation',
        () => {
          timeline.getCommand('output.mp4');
        },
        1000
      );
      
      expect(result.opsPerSecond).toBeGreaterThan(5000);
    });
  });
  
  describe('Caption Engine Performance', () => {
    test('should handle large caption datasets', async () => {
      const result = await benchmark.measure(
        'Large Caption Dataset (1000 captions)',
        () => {
          const engine = new MultiCaptionEngine();
          const track = engine.createTrack('en', 'English');
          
          for (let i = 0; i < 1000; i++) {
            engine.addCaption(track.id, {
              text: `Caption ${i}: This is a test caption with some content`,
              startTime: i * 2,
              endTime: i * 2 + 1.5
            });
          }
          
          engine.applyCaptions(new Timeline().addVideo('input.mp4'));
        },
        10
      );
      
      expect(result.duration / result.operations!).toBeLessThan(100); // < 100ms per operation
    });
    
    test('should efficiently apply global styles', async () => {
      const engine = new MultiCaptionEngine();
      const track = engine.createTrack('en', 'English');
      
      // Pre-populate with captions
      for (let i = 0; i < 100; i++) {
        engine.addCaption(track.id, {
          text: `Caption ${i}`,
          startTime: i,
          endTime: i + 0.9
        });
      }
      
      const result = await benchmark.measure(
        'Global Style Application',
        () => {
          engine.setGlobalDefaults({
            fontFamily: 'Arial Bold',
            fontSize: 48,
            color: '#ffffff',
            strokeColor: '#000000',
            strokeWidth: 3
          });
        },
        100
      );
      
      expect(result.opsPerSecond).toBeGreaterThan(1000);
    });
  });
  
  describe('Memory Efficiency', () => {
    test('should not leak memory with repeated timeline creation', async () => {
      const result = await benchmark.measure(
        'Memory Leak Test (1000 timelines)',
        () => {
          const timeline = new Timeline()
            .addVideo('input.mp4')
            .addText('Text', { position: 'center' })
            .addImage('logo.png', { position: 'top-right' })
            .setDuration(30);
          
          // Force string generation to ensure full object creation
          timeline.getCommand('output.mp4');
        },
        1000
      );
      
      // Memory usage should be reasonable (< 50MB for 1000 timelines)
      expect(result.memoryUsed).toBeLessThan(50 * 1024 * 1024);
    });
    
    test('should handle large text content efficiently', async () => {
      const largeText = 'Lorem ipsum '.repeat(1000); // ~12KB of text
      
      const result = await benchmark.measure(
        'Large Text Content',
        () => {
          new Timeline()
            .addVideo('input.mp4')
            .addText(largeText, {
              position: 'center',
              style: { fontSize: 24, wordWrap: true }
            })
            .getCommand('output.mp4');
        },
        100
      );
      
      expect(result.memoryUsed).toBeLessThan(10 * 1024 * 1024); // < 10MB
    });
  });
  
  describe('Filter Performance', () => {
    test('should chain multiple filters efficiently', async () => {
      const result = await benchmark.measure(
        'Filter Chain (10 filters)',
        () => {
          new Timeline()
            .addVideo('input.mp4')
            .addFilter('brightness=1.2')
            .addFilter('contrast=1.1')
            .addFilter('saturation=1.3')
            .addFilter('hue=0.1')
            .addFilter('blur=2')
            .addFilter('sharpen=1')
            .addFilter('vignette')
            .addFilter('noise=0.02')
            .addFilter('chromashift=0.01')
            .addFilter('curves=preset=vintage')
            .getCommand('output.mp4');
        },
        100
      );
      
      expect(result.opsPerSecond).toBeGreaterThan(500);
    });
  });
  
  describe('Real-world Scenarios', () => {
    test('should handle TikTok video creation workflow', async () => {
      const result = await benchmark.measure(
        'TikTok Video Workflow',
        () => {
          const timeline = new Timeline()
            .setAspectRatio('9:16')
            .setResolution(1080, 1920)
            .setDuration(15)
            .addVideo('content.mp4')
            .addAudio('music.mp3', { volume: 0.7 })
            .addText('Wait for it...', {
              position: { x: 'center', y: '20%' },
              style: { fontSize: 48, color: '#ffffff' },
              startTime: 0,
              duration: 3
            })
            .addText('OMG! 😱', {
              position: { x: 'center', y: 'center' },
              style: { fontSize: 72, color: '#ff0066' },
              startTime: 10,
              duration: 5
            });
          
          timeline.getCommand('tiktok.mp4');
        },
        50
      );
      
      expect(result.duration / result.operations!).toBeLessThan(10); // < 10ms per video
    });
    
    test('should handle batch processing efficiently', async () => {
      const templates = ['template1', 'template2', 'template3'];
      const products = Array.from({ length: 10 }, (_, i) => ({
        name: `Product ${i}`,
        price: `$${99 + i}`,
        image: `product${i}.jpg`
      }));
      
      const result = await benchmark.measure(
        'Batch Processing (30 videos)',
        () => {
          for (const template of templates) {
            for (const product of products) {
              new Timeline()
                .addVideo(`${template}.mp4`)
                .addImage(product.image, { position: 'center', scale: 0.5 })
                .addText(product.name, { position: { x: 'center', y: '70%' } })
                .addText(product.price, { position: { x: 'center', y: '80%' } })
                .getCommand(`${template}-${product.name}.mp4`);
            }
          }
        },
        10
      );
      
      expect(result.duration / result.operations!).toBeLessThan(100); // < 100ms per batch
    });
  });
  
  describe('Performance Regression Tests', () => {
    test('should meet performance thresholds', () => {
      // Define thresholds for CI
      const thresholds = {
        'Simple Timeline Creation': { maxDuration: 200, maxMemory: 5 * 1024 * 1024 },
        'Complex Timeline (10 layers)': { maxDuration: 500, maxMemory: 10 * 1024 * 1024 },
        'FFmpeg Command Generation': { maxDuration: 300, maxMemory: 5 * 1024 * 1024 },
        'Large Caption Dataset (1000 captions)': { maxDuration: 1500, maxMemory: 20 * 1024 * 1024 },
        'TikTok Video Workflow': { maxDuration: 1000, maxMemory: 15 * 1024 * 1024 }
      };
      
      // Check will throw if any threshold is exceeded
      expect(() => benchmark.checkThresholds(thresholds)).not.toThrow();
    });
  });
});
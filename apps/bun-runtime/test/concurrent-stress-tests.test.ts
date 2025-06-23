/**
 * @fileoverview CONCURRENT STRESS TESTS
 * 
 * Tests that push the SDK to its limits with concurrent operations,
 * stress testing, and extreme edge cases to ensure stability under load.
 */

import { test, expect, describe, beforeAll, afterAll } from 'bun:test';
import { Timeline } from '@jamesaphoenix/media-sdk';
import { SRTHandler, SRTEntry } from '../../../packages/media-sdk/src/captions/srt-handler.js';
import { ImageSourceHandler } from '../../../packages/media-sdk/src/utils/image-source-handler.js';
import { promises as fs } from 'fs';
import { join } from 'path';
import { tmpdir } from 'os';
import { Worker } from 'worker_threads';

describe('💪 CONCURRENT STRESS TESTS', () => {
  let stressDir: string;
  let srtHandler: SRTHandler;
  let imageHandler: ImageSourceHandler;
  
  beforeAll(async () => {
    stressDir = join(tmpdir(), 'stress-test-' + Date.now());
    await fs.mkdir(stressDir, { recursive: true });
    
    srtHandler = new SRTHandler();
    imageHandler = new ImageSourceHandler({
      downloadDir: join(stressDir, 'images'),
      enableCache: true,
      maxDownloadSize: 10 * 1024 * 1024 // 10MB
    });
    
    console.log('Stress test directory:', stressDir);
  });
  
  afterAll(async () => {
    try {
      await cleanupDirectory(stressDir);
    } catch (e) {
      console.error('Cleanup error:', e);
    }
  });

  async function cleanupDirectory(dir: string) {
    const entries = await fs.readdir(dir, { withFileTypes: true });
    for (const entry of entries) {
      const fullPath = join(dir, entry.name);
      if (entry.isDirectory()) {
        await cleanupDirectory(fullPath);
        await fs.rmdir(fullPath);
      } else {
        await fs.unlink(fullPath);
      }
    }
    await fs.rmdir(dir);
  }

  describe('🚀 CONCURRENT TIMELINE OPERATIONS', () => {
    test('should handle 100 concurrent timeline creations', async () => {
      const concurrentOps = 100;
      const promises: Promise<string>[] = [];
      
      console.log(`Creating ${concurrentOps} concurrent timelines...`);
      const startTime = performance.now();
      
      for (let i = 0; i < concurrentOps; i++) {
        const promise = (async () => {
          let timeline = new Timeline()
            .setResolution(1920, 1080)
            .setFrameRate(30)
            .setAspectRatio('16:9');
          
          // Add multiple elements
          for (let j = 0; j < 10; j++) {
            timeline = timeline.addText(`Timeline ${i} - Text ${j}`, {
              startTime: j * 2,
              duration: 1.5,
              position: { x: '50%', y: `${10 + j * 5}%` },
              style: {
                fontSize: 24 + j,
                color: `#${Math.floor(Math.random() * 16777215).toString(16)}`
              }
            });
          }
          
          return timeline.getCommand(`output-${i}.mp4`);
        })();
        
        promises.push(promise);
      }
      
      const results = await Promise.all(promises);
      const elapsed = performance.now() - startTime;
      
      expect(results).toHaveLength(concurrentOps);
      results.forEach(cmd => {
        expect(cmd).toContain('ffmpeg');
        expect(cmd).toContain('filter_complex');
      });
      
      console.log(`Created ${concurrentOps} timelines in ${elapsed.toFixed(2)}ms`);
      console.log(`Average: ${(elapsed / concurrentOps).toFixed(2)}ms per timeline`);
    });

    test('should handle rapid timeline modifications', async () => {
      let timeline = new Timeline();
      const modifications = 1000;
      
      console.log(`Performing ${modifications} rapid modifications...`);
      const startTime = performance.now();
      
      for (let i = 0; i < modifications; i++) {
        const operation = i % 5;
        
        switch (operation) {
          case 0:
            timeline = timeline.addText(`Text ${i}`, {
              startTime: i * 0.1,
              duration: 0.5
            });
            break;
          case 1:
            timeline = timeline.setResolution(1920 + i, 1080);
            break;
          case 2:
            timeline = timeline.setFrameRate(24 + (i % 36));
            break;
          case 3:
            timeline = timeline.setAspectRatio(i % 2 === 0 ? '16:9' : '4:3');
            break;
          case 4:
            timeline = timeline.setDuration(10 + i);
            break;
        }
      }
      
      const elapsed = performance.now() - startTime;
      const command = timeline.getCommand('rapid-mods.mp4');
      
      expect(command).toBeTruthy();
      console.log(`${modifications} modifications in ${elapsed.toFixed(2)}ms`);
      console.log(`Rate: ${(modifications / elapsed * 1000).toFixed(0)} ops/sec`);
    });
  });

  describe('📝 CONCURRENT SRT OPERATIONS', () => {
    test('should handle parallel SRT file writes', async () => {
      const fileCount = 50;
      const entriesPerFile = 100;
      const promises: Promise<void>[] = [];
      
      console.log(`Writing ${fileCount} SRT files in parallel...`);
      const startTime = performance.now();
      
      for (let i = 0; i < fileCount; i++) {
        const promise = (async () => {
          const entries: SRTEntry[] = [];
          
          for (let j = 0; j < entriesPerFile; j++) {
            entries.push({
              index: j + 1,
              startTime: j * 3,
              endTime: (j * 3) + 2.5,
              text: `File ${i} - Subtitle ${j + 1}`,
              style: {
                bold: j % 2 === 0,
                italic: j % 3 === 0,
                color: j % 5 === 0 ? '#FF0000' : undefined
              }
            });
          }
          
          const filename = join(stressDir, `stress-${i}.srt`);
          await srtHandler.writeSRTFile(filename, entries);
        })();
        
        promises.push(promise);
      }
      
      await Promise.all(promises);
      const elapsed = performance.now() - startTime;
      
      // Verify all files were created
      const files = await fs.readdir(stressDir);
      const srtFiles = files.filter(f => f.endsWith('.srt'));
      expect(srtFiles.length).toBe(fileCount);
      
      console.log(`Created ${fileCount} SRT files in ${elapsed.toFixed(2)}ms`);
      console.log(`Total subtitles: ${fileCount * entriesPerFile}`);
    });

    test('should handle concurrent SRT parsing', async () => {
      // Create a complex SRT file
      const complexEntries: SRTEntry[] = [];
      for (let i = 0; i < 500; i++) {
        complexEntries.push({
          index: i + 1,
          startTime: i * 2,
          endTime: (i * 2) + 1.8,
          text: `Complex subtitle ${i + 1}\nWith multiple lines\nAnd special chars: 你好 مرحبا 🎬`,
          style: {
            bold: i % 2 === 0,
            italic: i % 3 === 0,
            underline: i % 5 === 0,
            color: `#${Math.floor(Math.random() * 16777215).toString(16).padStart(6, '0')}`
          }
        });
      }
      
      const srtContent = srtHandler.generateSRT(complexEntries);
      
      // Parse the same content concurrently
      const parseCount = 100;
      const promises: Promise<SRTEntry[]>[] = [];
      
      console.log(`Parsing SRT content ${parseCount} times concurrently...`);
      const startTime = performance.now();
      
      for (let i = 0; i < parseCount; i++) {
        promises.push(Promise.resolve(srtHandler.parseSRT(srtContent)));
      }
      
      const results = await Promise.all(promises);
      const elapsed = performance.now() - startTime;
      
      expect(results).toHaveLength(parseCount);
      results.forEach(entries => {
        expect(entries).toHaveLength(500);
      });
      
      console.log(`Parsed ${parseCount} times in ${elapsed.toFixed(2)}ms`);
      console.log(`Rate: ${(parseCount / elapsed * 1000).toFixed(0)} parses/sec`);
    });
  });

  describe('🖼️ CONCURRENT IMAGE OPERATIONS', () => {
    test('should handle massive parallel image downloads', async () => {
      const batchSize = 20;
      const batches = 5;
      const allPromises: Promise<any>[] = [];
      
      console.log(`Downloading ${batchSize * batches} images in ${batches} batches...`);
      const startTime = performance.now();
      
      for (let batch = 0; batch < batches; batch++) {
        const urls: string[] = [];
        
        for (let i = 0; i < batchSize; i++) {
          const size = 100 + (i * 10);
          urls.push(`https://via.placeholder.com/${size}x${size}?text=Batch${batch}-Image${i}`);
        }
        
        const batchPromise = imageHandler.processBatch(urls);
        allPromises.push(batchPromise);
      }
      
      const allResults = await Promise.all(allPromises);
      const elapsed = performance.now() - startTime;
      
      // Flatten results
      const flatResults = allResults.flat();
      const successful = flatResults.filter(r => !r.error);
      const failed = flatResults.filter(r => r.error);
      
      console.log(`Downloaded ${successful.length}/${flatResults.length} images in ${elapsed.toFixed(2)}ms`);
      console.log(`Success rate: ${(successful.length / flatResults.length * 100).toFixed(1)}%`);
      console.log(`Average time per image: ${(elapsed / flatResults.length).toFixed(2)}ms`);
      
      expect(flatResults.length).toBe(batchSize * batches);
    });

    test('should handle cache contention under load', async () => {
      // Use same URL multiple times to test cache contention
      const testUrl = 'https://via.placeholder.com/200x200?text=CacheTest';
      const concurrentRequests = 50;
      
      console.log(`Testing cache with ${concurrentRequests} concurrent requests...`);
      const startTime = performance.now();
      
      // Clear cache first
      await imageHandler.cleanup(false);
      
      // First download to populate cache
      await imageHandler.processImageSource(testUrl);
      
      // Now hit it concurrently
      const promises = Array(concurrentRequests).fill(null).map(() => 
        imageHandler.processImageSource(testUrl)
      );
      
      const results = await Promise.all(promises);
      const elapsed = performance.now() - startTime;
      
      // All should succeed and use same cached file
      const uniquePaths = new Set(results.map(r => r.localPath));
      expect(uniquePaths.size).toBe(1); // All should use same cached file
      
      const cacheStats = await imageHandler.getCacheStats();
      console.log(`Cache handled ${concurrentRequests} requests in ${elapsed.toFixed(2)}ms`);
      console.log(`Cache stats:`, cacheStats);
    });
  });

  describe('🎬 MASSIVE INTEGRATION STRESS TEST', () => {
    test('should handle complex multi-component workflow under stress', async () => {
      const videoCount = 10;
      const promises: Promise<any>[] = [];
      
      console.log(`Creating ${videoCount} complex videos concurrently...`);
      const startTime = performance.now();
      
      for (let v = 0; v < videoCount; v++) {
        const videoPromise = (async () => {
          // Download images for this video
          const imageUrls = [
            `https://via.placeholder.com/1920x1080?text=Video${v}-BG`,
            `https://via.placeholder.com/200x200?text=Video${v}-Logo`,
            `https://via.placeholder.com/400x100?text=Video${v}-Banner`
          ];
          
          const images = await imageHandler.processBatch(imageUrls);
          
          // Create subtitles for this video
          const subtitles: SRTEntry[] = [];
          for (let s = 0; s < 20; s++) {
            subtitles.push({
              index: s + 1,
              startTime: s * 3,
              endTime: (s * 3) + 2.5,
              text: `Video ${v} - Scene ${s + 1}`,
              style: { fontSize: 32, bold: s === 0 }
            });
          }
          
          const srtFile = join(stressDir, `video-${v}.srt`);
          await srtHandler.writeSRTFile(srtFile, subtitles);
          
          // Create timeline
          let timeline = new Timeline();
          
          // Add background if available
          if (images[0] && !images[0].error) {
            timeline = timeline.addImage(images[0].localPath, {
              duration: 60,
              position: { x: '50%', y: '50%' }
            });
          }
          
          // Add logo if available
          if (images[1] && !images[1].error) {
            timeline = timeline.addImage(images[1].localPath, {
              startTime: 0,
              duration: 60,
              position: { x: '10%', y: '10%' },
              transform: { scale: 0.5 }
            });
          }
          
          // Add subtitles
          subtitles.forEach(subtitle => {
            timeline = timeline.addText(subtitle.text, {
              startTime: subtitle.startTime,
              duration: subtitle.endTime - subtitle.startTime,
              position: { x: '50%', y: '90%' },
              style: {
                fontSize: subtitle.style?.fontSize || 28,
                color: '#FFFFFF',
                backgroundColor: 'rgba(0,0,0,0.8)',
                padding: '10px'
              }
            });
          });
          
          return {
            videoId: v,
            command: timeline.getCommand(`stress-video-${v}.mp4`),
            imageCount: images.filter(i => !i.error).length,
            subtitleCount: subtitles.length
          };
        })();
        
        promises.push(videoPromise);
      }
      
      const results = await Promise.all(promises);
      const elapsed = performance.now() - startTime;
      
      expect(results).toHaveLength(videoCount);
      
      const totalImages = results.reduce((sum, r) => sum + r.imageCount, 0);
      const totalSubtitles = results.reduce((sum, r) => sum + r.subtitleCount, 0);
      
      console.log(`Created ${videoCount} complex videos in ${elapsed.toFixed(2)}ms`);
      console.log(`Total images processed: ${totalImages}`);
      console.log(`Total subtitles created: ${totalSubtitles}`);
      console.log(`Average per video: ${(elapsed / videoCount).toFixed(2)}ms`);
    });
  });

  describe('🔥 MEMORY AND RESOURCE STRESS TESTS', () => {
    test('should handle memory-intensive operations', async () => {
      console.log('Testing memory-intensive operations...');
      
      // Create a very large timeline with thousands of elements
      let timeline = new Timeline();
      const elementCount = 1000;
      
      const startMemory = process.memoryUsage();
      const startTime = performance.now();
      
      for (let i = 0; i < elementCount; i++) {
        if (i % 3 === 0) {
          timeline = timeline.addText(`Memory test ${i}`, {
            startTime: i * 0.1,
            duration: 0.5,
            style: {
              fontSize: 20 + (i % 20),
              color: `#${Math.floor(Math.random() * 16777215).toString(16)}`
            }
          });
        } else if (i % 3 === 1) {
          timeline = timeline.setFrameRate(24 + (i % 12));
        } else {
          timeline = timeline.setResolution(1920, 1080 + (i % 100));
        }
      }
      
      const command = timeline.getCommand('memory-test.mp4');
      const elapsed = performance.now() - startTime;
      const endMemory = process.memoryUsage();
      
      const memoryDelta = {
        heapUsed: (endMemory.heapUsed - startMemory.heapUsed) / 1024 / 1024,
        external: (endMemory.external - startMemory.external) / 1024 / 1024
      };
      
      console.log(`Created ${elementCount} elements in ${elapsed.toFixed(2)}ms`);
      console.log(`Memory delta: Heap: ${memoryDelta.heapUsed.toFixed(2)}MB, External: ${memoryDelta.external.toFixed(2)}MB`);
      console.log(`Command length: ${command.length} characters`);
      
      expect(command.length).toBeGreaterThan(10000); // Should be a very long command
    });

    test('should handle rapid file system operations', async () => {
      const fileOps = 100;
      const testDir = join(stressDir, 'rapid-fs-test');
      await fs.mkdir(testDir, { recursive: true });
      
      console.log(`Performing ${fileOps} rapid file operations...`);
      const startTime = performance.now();
      
      // Rapid write/read/delete cycles
      const promises: Promise<void>[] = [];
      
      for (let i = 0; i < fileOps; i++) {
        const promise = (async () => {
          const filename = join(testDir, `rapid-${i}.txt`);
          const content = `Test content ${i}`.repeat(100);
          
          // Write
          await fs.writeFile(filename, content, 'utf-8');
          
          // Read
          const readContent = await fs.readFile(filename, 'utf-8');
          
          // Verify
          if (readContent !== content) {
            throw new Error(`Content mismatch for file ${i}`);
          }
          
          // Delete
          await fs.unlink(filename);
        })();
        
        promises.push(promise);
      }
      
      await Promise.all(promises);
      const elapsed = performance.now() - startTime;
      
      // Verify directory is empty
      const remainingFiles = await fs.readdir(testDir);
      expect(remainingFiles).toHaveLength(0);
      
      console.log(`Completed ${fileOps * 3} file operations in ${elapsed.toFixed(2)}ms`);
      console.log(`Rate: ${(fileOps * 3 / elapsed * 1000).toFixed(0)} ops/sec`);
    });
  });

  describe('⚡ EDGE CASE STRESS SCENARIOS', () => {
    test('should handle timeline with maximum complexity', async () => {
      console.log('Creating timeline with maximum complexity...');
      
      let timeline = new Timeline()
        .setResolution(4096, 2160) // 4K
        .setFrameRate(60)
        .setAspectRatio('21:9');
      
      // Add various complex elements
      for (let layer = 0; layer < 10; layer++) {
        for (let item = 0; item < 20; item++) {
          const time = layer * 20 + item;
          
          timeline = timeline.addText(`L${layer}I${item}`, {
            startTime: time,
            duration: 2,
            position: { 
              x: `${10 + (item * 4)}%`, 
              y: `${10 + (layer * 8)}%` 
            },
            style: {
              fontSize: 16 + layer,
              color: `hsl(${layer * 36}, 100%, 50%)`,
              backgroundColor: `rgba(0,0,0,${0.3 + layer * 0.05})`,
              fontWeight: layer % 2 === 0 ? 'bold' : 'normal',
              fontStyle: item % 2 === 0 ? 'italic' : 'normal',
              textShadow: '2px 2px 4px rgba(0,0,0,0.5)'
            },
            animation: {
              type: ['fade', 'slide', 'scale', 'rotate'][layer % 4] as any,
              duration: 0.5
            }
          });
        }
      }
      
      const command = timeline.getCommand('max-complexity.mp4');
      
      expect(command).toBeTruthy();
      expect(command.length).toBeGreaterThan(50000);
      console.log(`Generated command with ${command.length} characters`);
    });

    test('should recover from error conditions during stress', async () => {
      const errorScenarios = [
        // Invalid image URL
        () => imageHandler.processImageSource('https://invalid-domain-xyz123456.com/image.jpg'),
        
        // Non-existent file
        () => srtHandler.readSRTFile('/non/existent/path/file.srt'),
        
        // Invalid SRT content
        () => srtHandler.parseSRT('INVALID SRT CONTENT'),
        
        // Corrupted timeline operation
        () => {
          let timeline = new Timeline();
          // @ts-ignore - intentionally invalid
          timeline = timeline.addText(null, { startTime: -1, duration: -1 });
          return timeline.getCommand('error.mp4');
        }
      ];
      
      console.log(`Testing ${errorScenarios.length} error scenarios...`);
      
      const results = await Promise.allSettled(
        errorScenarios.map(scenario => scenario())
      );
      
      const rejected = results.filter(r => r.status === 'rejected');
      const fulfilled = results.filter(r => r.status === 'fulfilled');
      
      console.log(`Results: ${fulfilled.length} fulfilled, ${rejected.length} rejected`);
      
      // Should handle errors gracefully
      expect(results).toHaveLength(errorScenarios.length);
    });
  });
});
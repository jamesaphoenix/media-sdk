/**
 * @fileoverview IMAGE SOURCE HANDLER RUNTIME TESTS
 * 
 * Real-world runtime tests that download actual images, manage cache,
 * and validate image processing in production-like scenarios.
 */

import { test, expect, describe, beforeAll, afterAll } from 'bun:test';
import { ImageSourceHandler, ProcessedImage } from '../../../packages/media-sdk/src/utils/image-source-handler.js';
import { promises as fs } from 'fs';
import { join } from 'path';
import { tmpdir } from 'os';
import { createHash } from 'crypto';

describe('🚀 IMAGE SOURCE RUNTIME TESTS', () => {
  let runtimeDir: string;
  let downloadDir: string;
  let assetsDir: string;
  
  beforeAll(async () => {
    runtimeDir = join(tmpdir(), 'image-runtime-' + Date.now());
    downloadDir = join(runtimeDir, 'downloads');
    assetsDir = join(runtimeDir, 'assets');
    
    await fs.mkdir(runtimeDir, { recursive: true });
    await fs.mkdir(downloadDir, { recursive: true });
    await fs.mkdir(assetsDir, { recursive: true });
    
    console.log('Runtime test directory:', runtimeDir);
    
    // Create local test images
    await createLocalTestImages();
  });
  
  afterAll(async () => {
    // Cleanup
    try {
      await cleanupDirectory(runtimeDir);
    } catch (e) {
      console.error('Cleanup error:', e);
    }
  });

  async function createLocalTestImages() {
    // Create various sized test images
    const sizes = [
      { name: 'tiny.jpg', size: 1024 },        // 1KB
      { name: 'small.jpg', size: 10240 },      // 10KB
      { name: 'medium.jpg', size: 102400 },    // 100KB
      { name: 'large.jpg', size: 1048576 }     // 1MB
    ];
    
    for (const { name, size } of sizes) {
      const buffer = Buffer.alloc(size);
      // Add JPEG header
      buffer[0] = 0xFF;
      buffer[1] = 0xD8;
      buffer[2] = 0xFF;
      buffer[3] = 0xE0;
      
      await fs.writeFile(join(assetsDir, name), buffer);
    }
  }

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

  describe('🌐 REAL DOWNLOAD TESTS', () => {
    test('should download images from public CDNs', async () => {
      const handler = new ImageSourceHandler({
        downloadDir,
        enableCache: true,
        maxDownloadSize: 5 * 1024 * 1024 // 5MB
      });

      // Test with commonly available public images
      const publicImages = [
        'https://via.placeholder.com/150',
        'https://via.placeholder.com/300x200',
        'https://picsum.photos/200/300',
        'https://dummyimage.com/600x400/000/fff'
      ];

      const results: ProcessedImage[] = [];
      
      for (const url of publicImages) {
        console.log(`Downloading: ${url}`);
        const result = await handler.processImageSource(url);
        results.push(result);
        
        if (!result.error) {
          // Verify file was downloaded
          const exists = await fs.access(result.localPath).then(() => true).catch(() => false);
          expect(exists).toBe(true);
          
          // Check file size
          const stats = await fs.stat(result.localPath);
          console.log(`Downloaded ${url} - Size: ${stats.size} bytes`);
          expect(stats.size).toBeGreaterThan(0);
        }
      }

      // At least some should succeed
      const successful = results.filter(r => !r.error);
      expect(successful.length).toBeGreaterThan(0);
      
      // Check cache
      const cacheStats = await handler.getCacheStats();
      console.log('Cache stats after downloads:', cacheStats);
      expect(cacheStats.fileCount).toBeGreaterThan(0);
    });

    test('should handle various image formats from URLs', async () => {
      const handler = new ImageSourceHandler({
        downloadDir,
        enableCache: true
      });

      // Different format test URLs
      const formatTests = [
        { url: 'https://via.placeholder.com/150.jpg', format: 'jpeg' },
        { url: 'https://via.placeholder.com/150.png', format: 'png' },
        { url: 'https://via.placeholder.com/150.gif', format: 'gif' },
        { url: 'https://via.placeholder.com/150.webp', format: 'webp' }
      ];

      for (const { url, format } of formatTests) {
        const result = await handler.processImageSource(url);
        
        if (!result.error) {
          expect(result.wasDownloaded).toBe(true);
          expect(result.mimeType).toContain(format);
          
          // Verify file extension matches
          expect(result.localPath).toMatch(new RegExp(`\\.${format.replace('jpeg', 'jpg')}$`));
        }
      }
    });

    test('should respect download timeouts', async () => {
      const quickHandler = new ImageSourceHandler({
        downloadDir,
        downloadTimeout: 100 // 100ms timeout
      });

      // Try to download a large image with short timeout
      const largeImageUrl = 'https://picsum.photos/4000/3000'; // Large image
      
      const start = Date.now();
      const result = await quickHandler.processImageSource(largeImageUrl);
      const elapsed = Date.now() - start;
      
      // Should timeout quickly
      expect(elapsed).toBeLessThan(500);
      
      if (result.error) {
        console.log('Timeout error:', result.error);
        expect(result.error).toContain('Failed to download');
      }
    });
  });

  describe('💾 CACHE MANAGEMENT TESTS', () => {
    test('should efficiently cache downloaded images', async () => {
      const cacheHandler = new ImageSourceHandler({
        downloadDir,
        enableCache: true
      });

      const testUrl = 'https://via.placeholder.com/200';
      
      // First download
      console.log('First download...');
      const start1 = performance.now();
      const result1 = await cacheHandler.processImageSource(testUrl);
      const time1 = performance.now() - start1;
      
      expect(result1.error).toBeUndefined();
      expect(result1.wasDownloaded).toBe(true);
      
      // Second request (should use cache)
      console.log('Second request (cached)...');
      const start2 = performance.now();
      const result2 = await cacheHandler.processImageSource(testUrl);
      const time2 = performance.now() - start2;
      
      expect(result2.error).toBeUndefined();
      expect(result2.localPath).toBe(result1.localPath);
      
      console.log(`First download: ${time1.toFixed(2)}ms, Cached: ${time2.toFixed(2)}ms`);
      expect(time2).toBeLessThan(time1); // Cache should be faster
      
      // Verify cache stats
      const stats = await cacheHandler.getCacheStats();
      expect(stats.cachedUrls).toContain(testUrl);
    });

    test('should handle cache cleanup properly', async () => {
      const cleanupHandler = new ImageSourceHandler({
        downloadDir: join(runtimeDir, 'cleanup-test'),
        enableCache: true
      });

      // Download several images
      const urls = [
        'https://via.placeholder.com/100',
        'https://via.placeholder.com/150',
        'https://via.placeholder.com/200'
      ];

      for (const url of urls) {
        await cleanupHandler.processImageSource(url);
      }

      // Check cache before cleanup
      const statsBefore = await cleanupHandler.getCacheStats();
      console.log('Cache before cleanup:', statsBefore);
      expect(statsBefore.fileCount).toBeGreaterThan(0);
      expect(statsBefore.cacheSize).toBeGreaterThan(0);
      
      // Cleanup
      await cleanupHandler.cleanup();
      
      // Check cache after cleanup
      const statsAfter = await cleanupHandler.getCacheStats();
      console.log('Cache after cleanup:', statsAfter);
      expect(statsAfter.fileCount).toBe(0);
      expect(statsAfter.cachedUrls).toHaveLength(0);
    });

    test('should preserve cache when requested', async () => {
      const preserveHandler = new ImageSourceHandler({
        downloadDir: join(runtimeDir, 'preserve-test'),
        enableCache: true
      });

      // Download an image
      const url = 'https://via.placeholder.com/250';
      await preserveHandler.processImageSource(url);
      
      const statsBefore = await preserveHandler.getCacheStats();
      expect(statsBefore.fileCount).toBeGreaterThan(0);
      
      // Cleanup with preserve flag
      await preserveHandler.cleanup(true);
      
      // Files should still exist
      const statsAfter = await preserveHandler.getCacheStats();
      expect(statsAfter.fileCount).toBe(statsBefore.fileCount);
    });
  });

  describe('🔄 BATCH PROCESSING RUNTIME', () => {
    test('should process mixed local and remote images efficiently', async () => {
      const batchHandler = new ImageSourceHandler({
        downloadDir,
        enableCache: true
      });

      const mixedSources = [
        // Local files
        join(assetsDir, 'tiny.jpg'),
        join(assetsDir, 'small.jpg'),
        join(assetsDir, 'medium.jpg'),
        // Remote URLs
        'https://via.placeholder.com/100',
        'https://via.placeholder.com/200',
        'https://via.placeholder.com/300',
        // Non-existent
        join(assetsDir, 'does-not-exist.jpg'),
        'https://invalid-domain-xyz123.com/image.jpg'
      ];

      console.log(`Processing batch of ${mixedSources.length} images...`);
      const start = performance.now();
      const results = await batchHandler.processBatch(mixedSources);
      const elapsed = performance.now() - start;
      
      expect(results).toHaveLength(8);
      
      // Count results
      const successful = results.filter(r => !r.error);
      const failed = results.filter(r => r.error);
      const downloaded = results.filter(r => r.wasDownloaded);
      const local = results.filter(r => !r.wasDownloaded && !r.error);
      
      console.log(`Batch processing completed in ${elapsed.toFixed(2)}ms`);
      console.log(`Success: ${successful.length}, Failed: ${failed.length}`);
      console.log(`Downloaded: ${downloaded.length}, Local: ${local.length}`);
      
      expect(successful.length).toBeGreaterThan(3); // At least local files
      expect(failed.length).toBe(2); // The two invalid sources
    });

    test('should handle concurrent batch downloads', async () => {
      const concurrentHandler = new ImageSourceHandler({
        downloadDir: join(runtimeDir, 'concurrent-test'),
        enableCache: true
      });

      // Create multiple batches
      const batch1 = [
        'https://via.placeholder.com/101',
        'https://via.placeholder.com/102',
        'https://via.placeholder.com/103'
      ];
      
      const batch2 = [
        'https://via.placeholder.com/201',
        'https://via.placeholder.com/202',
        'https://via.placeholder.com/203'
      ];
      
      const batch3 = [
        'https://via.placeholder.com/301',
        'https://via.placeholder.com/302',
        'https://via.placeholder.com/303'
      ];

      // Process all batches concurrently
      console.log('Processing 3 batches concurrently...');
      const start = performance.now();
      
      const [results1, results2, results3] = await Promise.all([
        concurrentHandler.processBatch(batch1),
        concurrentHandler.processBatch(batch2),
        concurrentHandler.processBatch(batch3)
      ]);
      
      const elapsed = performance.now() - start;
      console.log(`Concurrent processing completed in ${elapsed.toFixed(2)}ms`);
      
      // Verify all batches completed
      expect(results1).toHaveLength(3);
      expect(results2).toHaveLength(3);
      expect(results3).toHaveLength(3);
      
      // Check cache efficiency
      const cacheStats = await concurrentHandler.getCacheStats();
      console.log('Final cache stats:', cacheStats);
    });
  });

  describe('🎨 IMAGE VALIDATION TESTS', () => {
    test('should validate downloaded image integrity', async () => {
      const validationHandler = new ImageSourceHandler({
        downloadDir,
        enableCache: false
      });

      // Download a known image
      const imageUrl = 'https://via.placeholder.com/300x300/FF0000/FFFFFF?text=Test';
      const result = await validationHandler.processImageSource(imageUrl);
      
      expect(result.error).toBeUndefined();
      expect(result.fileSize).toBeGreaterThan(0);
      
      // Read first few bytes to check format
      const buffer = await fs.readFile(result.localPath);
      
      // Check for common image headers
      const headers = {
        jpeg: [0xFF, 0xD8, 0xFF],
        png: [0x89, 0x50, 0x4E, 0x47],
        gif: [0x47, 0x49, 0x46]
      };
      
      let formatDetected = false;
      for (const [format, header] of Object.entries(headers)) {
        if (header.every((byte, i) => buffer[i] === byte)) {
          console.log(`Detected ${format} format`);
          formatDetected = true;
          break;
        }
      }
      
      expect(formatDetected).toBe(true);
    });

    test('should handle various file sizes efficiently', async () => {
      const sizeHandler = new ImageSourceHandler({
        downloadDir,
        maxDownloadSize: 10 * 1024 * 1024 // 10MB
      });

      // Test different sized images
      const sizeTests = [
        { url: 'https://via.placeholder.com/50', expectedSize: 'small' },
        { url: 'https://via.placeholder.com/500', expectedSize: 'medium' },
        { url: 'https://via.placeholder.com/1000', expectedSize: 'large' }
      ];

      for (const { url, expectedSize } of sizeTests) {
        const result = await sizeHandler.processImageSource(url);
        
        if (!result.error) {
          const stats = await fs.stat(result.localPath);
          console.log(`${expectedSize} image: ${stats.size} bytes`);
          
          expect(stats.size).toBeGreaterThan(0);
          expect(stats.size).toBeLessThan(10 * 1024 * 1024);
        }
      }
    });
  });

  describe('🌍 REAL-WORLD SCENARIOS', () => {
    test('should handle social media image workflow', async () => {
      const socialHandler = new ImageSourceHandler({
        downloadDir: join(runtimeDir, 'social-media'),
        enableCache: true
      });

      // Simulate downloading profile pictures and post images
      const socialImages = {
        profiles: [
          'https://via.placeholder.com/150x150?text=Profile1',
          'https://via.placeholder.com/150x150?text=Profile2',
          'https://via.placeholder.com/150x150?text=Profile3'
        ],
        posts: [
          'https://via.placeholder.com/600x400?text=Post1',
          'https://via.placeholder.com/600x400?text=Post2',
          'https://via.placeholder.com/600x400?text=Post3'
        ],
        thumbnails: [
          'https://via.placeholder.com/120x120?text=Thumb1',
          'https://via.placeholder.com/120x120?text=Thumb2',
          'https://via.placeholder.com/120x120?text=Thumb3'
        ]
      };

      const allResults: ProcessedImage[] = [];
      
      // Process all social media images
      for (const [category, urls] of Object.entries(socialImages)) {
        console.log(`Processing ${category}...`);
        const results = await socialHandler.processBatch(urls);
        allResults.push(...results);
      }

      // Verify all processed
      expect(allResults).toHaveLength(9);
      
      const successful = allResults.filter(r => !r.error);
      console.log(`Social media workflow: ${successful.length}/9 images processed`);
      
      // Check cache efficiency
      const cacheStats = await socialHandler.getCacheStats();
      console.log('Social media cache:', cacheStats);
    });

    test('should handle e-commerce product images', async () => {
      const ecomHandler = new ImageSourceHandler({
        downloadDir: join(runtimeDir, 'ecommerce'),
        enableCache: true,
        maxDownloadSize: 5 * 1024 * 1024 // 5MB limit for product images
      });

      // Simulate product image variations
      const productId = '12345';
      const productImages = [
        `https://via.placeholder.com/800x800?text=Product+${productId}+Main`,
        `https://via.placeholder.com/800x800?text=Product+${productId}+Alt1`,
        `https://via.placeholder.com/800x800?text=Product+${productId}+Alt2`,
        `https://via.placeholder.com/400x400?text=Product+${productId}+Thumb`,
        `https://via.placeholder.com/1200x1200?text=Product+${productId}+Zoom`
      ];

      console.log(`Processing product ${productId} images...`);
      const results = await ecomHandler.processBatch(productImages);
      
      // All should succeed
      const failures = results.filter(r => r.error);
      expect(failures).toHaveLength(0);
      
      // Calculate total size
      let totalSize = 0;
      for (const result of results) {
        if (result.fileSize) {
          totalSize += result.fileSize;
        }
      }
      
      console.log(`Product images total size: ${(totalSize / 1024).toFixed(2)}KB`);
    });
  });

  describe('🚨 ERROR RECOVERY RUNTIME', () => {
    test('should recover from network failures', async () => {
      const recoveryHandler = new ImageSourceHandler({
        downloadDir,
        downloadTimeout: 5000
      });

      // Mix of working and failing URLs
      const unreliableUrls = [
        'https://via.placeholder.com/200', // Should work
        'https://httpstat.us/500',         // 500 error
        'https://via.placeholder.com/201', // Should work
        'https://httpstat.us/503',         // 503 error
        'https://via.placeholder.com/202'  // Should work
      ];

      const results = await recoveryHandler.processBatch(unreliableUrls);
      
      const successful = results.filter(r => !r.error);
      const failed = results.filter(r => r.error);
      
      console.log(`Network recovery test: ${successful.length} success, ${failed.length} failed`);
      
      // Should have some successes despite failures
      expect(successful.length).toBeGreaterThan(0);
      expect(failed.length).toBeGreaterThan(0);
    });

    test('should handle disk space issues gracefully', async () => {
      const diskHandler = new ImageSourceHandler({
        downloadDir: '/dev/null', // Invalid directory
        enableCache: true
      });

      // Try to download
      const result = await diskHandler.processImageSource('https://via.placeholder.com/100');
      
      // Should fail gracefully
      expect(result.error).toBeDefined();
      console.log('Disk error handled:', result.error);
    });
  });

  describe('📈 PERFORMANCE MONITORING', () => {
    test('should track download performance metrics', async () => {
      const perfHandler = new ImageSourceHandler({
        downloadDir,
        enableCache: false // Disable cache for accurate timing
      });

      const performanceMetrics: any[] = [];
      
      // Download images of different sizes
      const testImages = [
        { url: 'https://via.placeholder.com/100', name: 'tiny' },
        { url: 'https://via.placeholder.com/500', name: 'small' },
        { url: 'https://via.placeholder.com/1000', name: 'medium' },
        { url: 'https://via.placeholder.com/2000', name: 'large' }
      ];

      for (const { url, name } of testImages) {
        const start = performance.now();
        const result = await perfHandler.processImageSource(url);
        const elapsed = performance.now() - start;
        
        if (!result.error) {
          const stats = await fs.stat(result.localPath);
          const metric = {
            name,
            url,
            downloadTime: elapsed,
            fileSize: stats.size,
            throughput: (stats.size / 1024) / (elapsed / 1000) // KB/s
          };
          performanceMetrics.push(metric);
          
          console.log(`${name}: ${elapsed.toFixed(2)}ms, ${(stats.size / 1024).toFixed(2)}KB, ${metric.throughput.toFixed(2)}KB/s`);
        }
      }

      // Verify performance
      expect(performanceMetrics.length).toBeGreaterThan(0);
      
      // Calculate average throughput
      const avgThroughput = performanceMetrics.reduce((sum, m) => sum + m.throughput, 0) / performanceMetrics.length;
      console.log(`Average download throughput: ${avgThroughput.toFixed(2)}KB/s`);
    });
  });
});
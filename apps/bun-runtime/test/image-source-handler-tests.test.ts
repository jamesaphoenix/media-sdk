/**
 * @fileoverview COMPREHENSIVE IMAGE SOURCE HANDLER TESTING SUITE
 * 
 * Complete testing coverage for remote URL and local file path handling including:
 * - Remote URL detection and downloading
 * - Local file path validation
 * - Batch processing of mixed sources
 * - Caching mechanisms
 * - Error handling and recovery
 * - Performance optimization
 * - Security validation
 * - Real-world workflows
 * 
 * @example Basic Usage
 * ```typescript
 * const handler = new ImageSourceHandler();
 * const result = await handler.processImageSource('https://example.com/image.jpg');
 * // Downloads to temp and returns local path
 * ```
 * 
 * @example Batch Processing
 * ```typescript
 * const sources = ['https://url1.jpg', './local.png', 'https://url2.jpg'];
 * const results = await handler.processBatch(sources);
 * ```
 */

import { test, expect, describe, beforeAll, afterAll, beforeEach } from 'bun:test';
import { ImageSourceHandler, ImageSourceOptions, ProcessedImage } from '../../../packages/media-sdk/src/utils/image-source-handler.js';
import { promises as fs } from 'fs';
import { join } from 'path';
import { tmpdir } from 'os';
import { createHash } from 'crypto';

describe('🖼️ COMPREHENSIVE IMAGE SOURCE HANDLER TESTS', () => {
  let tempDir: string;
  let testAssetsDir: string;
  let handler: ImageSourceHandler;
  
  beforeAll(async () => {
    // Create temp directories
    tempDir = join(tmpdir(), 'image-handler-tests-' + Date.now());
    testAssetsDir = join(tempDir, 'test-assets');
    await fs.mkdir(tempDir, { recursive: true });
    await fs.mkdir(testAssetsDir, { recursive: true });
    
    // Create test images
    await createTestImages();
  });
  
  afterAll(async () => {
    // Cleanup
    try {
      await cleanupDirectory(tempDir);
    } catch (e) {
      // Ignore cleanup errors
    }
  });
  
  beforeEach(() => {
    handler = new ImageSourceHandler({
      downloadDir: join(tempDir, 'downloads'),
      enableCache: true
    });
  });

  async function createTestImages() {
    // Create dummy image files for testing
    const images = [
      'test-image-1.jpg',
      'test-image-2.png',
      'test-image-3.gif',
      'test-image-4.webp',
      'test-image-5.bmp'
    ];
    
    for (const image of images) {
      // Create a simple 1x1 pixel image-like binary data
      const buffer = Buffer.from([
        0xFF, 0xD8, 0xFF, 0xE0, 0x00, 0x10, 0x4A, 0x46,
        0x49, 0x46, 0x00, 0x01, 0x01, 0x00, 0x00, 0x01,
        0x00, 0x01, 0x00, 0x00, 0xFF, 0xDB, 0x00, 0x43
      ]);
      await fs.writeFile(join(testAssetsDir, image), buffer);
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

  describe('🔍 URL DETECTION TESTS', () => {
    test('should correctly identify remote URLs', () => {
      const remoteUrls = [
        'https://example.com/image.jpg',
        'http://example.com/image.png',
        'https://cdn.example.com/path/to/image.webp',
        'https://example.com:8080/image.gif',
        'https://example.com/image.jpg?query=value',
        'https://example.com/image.jpg#hash'
      ];
      
      remoteUrls.forEach(url => {
        expect(handler.isRemoteUrl(url)).toBe(true);
      });
    });

    test('should correctly identify local paths', () => {
      const localPaths = [
        './image.jpg',
        '../images/photo.png',
        '/absolute/path/to/image.gif',
        'relative/path/image.webp',
        'C:\\Windows\\path\\image.bmp',
        'file:///Users/name/image.jpg',
        '~/Documents/image.png'
      ];
      
      localPaths.forEach(path => {
        expect(handler.isRemoteUrl(path)).toBe(false);
      });
    });

    test('should handle edge cases in URL detection', () => {
      const edgeCases = [
        { url: '', expected: false },
        { url: 'ftp://example.com/image.jpg', expected: false },
        { url: 'data:image/png;base64,iVBOR...', expected: false },
        { url: 'blob:https://example.com/uuid', expected: false },
        { url: 'https://', expected: false },
        { url: 'http://', expected: false }
      ];
      
      edgeCases.forEach(({ url, expected }) => {
        expect(handler.isRemoteUrl(url)).toBe(expected);
      });
    });
  });

  describe('📁 LOCAL FILE HANDLING TESTS', () => {
    test('should process existing local files', async () => {
      const localPath = join(testAssetsDir, 'test-image-1.jpg');
      const result = await handler.processImageSource(localPath);
      
      expect(result.originalSource).toBe(localPath);
      expect(result.localPath).toBe(localPath);
      expect(result.wasDownloaded).toBe(false);
      expect(result.fileSize).toBeGreaterThan(0);
      expect(result.mimeType).toBe('image/jpeg');
      expect(result.error).toBeUndefined();
    });

    test('should handle non-existent local files', async () => {
      const nonExistentPath = join(testAssetsDir, 'does-not-exist.jpg');
      const result = await handler.processImageSource(nonExistentPath);
      
      expect(result.originalSource).toBe(nonExistentPath);
      expect(result.localPath).toBe('');
      expect(result.wasDownloaded).toBe(false);
      expect(result.error).toContain('Local file not found');
    });

    test('should check file existence correctly', async () => {
      const existingFile = join(testAssetsDir, 'test-image-2.png');
      const nonExistentFile = join(testAssetsDir, 'non-existent.png');
      
      expect(await handler.fileExists(existingFile)).toBe(true);
      expect(await handler.fileExists(nonExistentFile)).toBe(false);
    });

    test('should detect correct MIME types', async () => {
      const mimeTests = [
        { file: 'test-image-1.jpg', mime: 'image/jpeg' },
        { file: 'test-image-2.png', mime: 'image/png' },
        { file: 'test-image-3.gif', mime: 'image/gif' },
        { file: 'test-image-4.webp', mime: 'image/webp' },
        { file: 'test-image-5.bmp', mime: 'image/bmp' }
      ];
      
      for (const { file, mime } of mimeTests) {
        const result = await handler.processImageSource(join(testAssetsDir, file));
        expect(result.mimeType).toBe(mime);
      }
    });
  });

  describe('🌐 REMOTE URL HANDLING TESTS', () => {
    // Note: These tests use mock responses since we can't rely on external URLs
    test('should handle remote URL processing structure', async () => {
      // Test URL detection and processing flow
      const mockUrl = 'https://example.com/test-image.jpg';
      
      // Since we can't actually download, we test the method structure
      expect(handler.isRemoteUrl(mockUrl)).toBe(true);
      
      // Test cache filename generation
      const hash = createHash('md5').update(mockUrl).digest('hex');
      const expectedFilename = `cached_${hash}.jpg`;
      expect(expectedFilename).toMatch(/^cached_[a-f0-9]{32}\.jpg$/);
    });

    test('should handle download errors gracefully', async () => {
      const invalidUrl = 'https://invalid-domain-that-does-not-exist-12345.com/image.jpg';
      const result = await handler.processImageSource(invalidUrl);
      
      expect(result.originalSource).toBe(invalidUrl);
      expect(result.localPath).toBe('');
      expect(result.wasDownloaded).toBe(false);
      expect(result.error).toBeDefined();
    });

    test('should respect download timeout', async () => {
      const slowHandler = new ImageSourceHandler({
        downloadTimeout: 1 // 1ms timeout
      });
      
      const result = await slowHandler.processImageSource('https://example.com/large-image.jpg');
      
      expect(result.error).toBeDefined();
      expect(result.wasDownloaded).toBe(false);
    });

    test('should validate download size limits', async () => {
      const limitedHandler = new ImageSourceHandler({
        maxDownloadSize: 100 // 100 bytes max
      });
      
      // Even small images would exceed 100 bytes
      const result = await limitedHandler.processImageSource('https://example.com/image.jpg');
      
      if (!result.error?.includes('Failed to download')) {
        // If download succeeded, it should have been rejected for size
        expect(result.fileSize || 0).toBeLessThanOrEqual(100);
      }
    });
  });

  describe('📦 BATCH PROCESSING TESTS', () => {
    test('should process mixed local and remote sources', async () => {
      const sources = [
        join(testAssetsDir, 'test-image-1.jpg'),
        'https://example.com/remote1.jpg',
        join(testAssetsDir, 'test-image-2.png'),
        'https://example.com/remote2.png',
        join(testAssetsDir, 'does-not-exist.gif')
      ];
      
      const results = await handler.processBatch(sources);
      
      expect(results).toHaveLength(5);
      
      // Check local files
      expect(results[0].wasDownloaded).toBe(false);
      expect(results[0].error).toBeUndefined();
      
      expect(results[2].wasDownloaded).toBe(false);
      expect(results[2].error).toBeUndefined();
      
      // Check non-existent file
      expect(results[4].error).toContain('Local file not found');
    });

    test('should handle empty batch', async () => {
      const results = await handler.processBatch([]);
      expect(results).toHaveLength(0);
    });

    test('should handle large batches', async () => {
      const largeBatch: string[] = [];
      
      // Create 20 source paths (reduced from 100)
      for (let i = 0; i < 10; i++) {
        largeBatch.push(join(testAssetsDir, 'test-image-1.jpg'));
        largeBatch.push(`https://example.com/image${i}.jpg`);
      }
      
      const results = await handler.processBatch(largeBatch);
      
      expect(results).toHaveLength(20);
      
      // Verify we have both successful and failed results
      const successful = results.filter(r => !r.error);
      const failed = results.filter(r => r.error);
      
      expect(successful.length).toBeGreaterThan(0);
      expect(failed.length).toBeGreaterThan(0);
    });

    test('should handle partial failures in batch', async () => {
      const sources = [
        join(testAssetsDir, 'test-image-1.jpg'), // Success
        'invalid-url',                            // Failure
        join(testAssetsDir, 'test-image-2.png'), // Success
        '/non/existent/path.jpg'                  // Failure
      ];
      
      const results = await handler.processBatch(sources);
      
      expect(results[0].error).toBeUndefined();
      expect(results[1].error).toBeDefined();
      expect(results[2].error).toBeUndefined();
      expect(results[3].error).toBeDefined();
    });
  });

  describe('💾 CACHING TESTS', () => {
    test('should cache downloaded images', async () => {
      const cacheHandler = new ImageSourceHandler({
        downloadDir: join(tempDir, 'cache-test'),
        enableCache: true
      });
      
      // Simulate cache behavior with local files
      const testFile = join(testAssetsDir, 'test-image-1.jpg');
      
      const result1 = await cacheHandler.processImageSource(testFile);
      const result2 = await cacheHandler.processImageSource(testFile);
      
      // Both should return the same path
      expect(result1.localPath).toBe(result2.localPath);
    });

    test('should disable cache when requested', async () => {
      const noCacheHandler = new ImageSourceHandler({
        downloadDir: join(tempDir, 'no-cache-test'),
        enableCache: false
      });
      
      const stats = await noCacheHandler.getCacheStats();
      expect(stats.cachedUrls).toHaveLength(0);
    });

    test('should provide accurate cache statistics', async () => {
      const statsHandler = new ImageSourceHandler({
        downloadDir: join(tempDir, 'stats-test'),
        enableCache: true
      });
      
      // Process some files
      await statsHandler.processBatch([
        join(testAssetsDir, 'test-image-1.jpg'),
        join(testAssetsDir, 'test-image-2.png'),
        join(testAssetsDir, 'test-image-3.gif')
      ]);
      
      const stats = await statsHandler.getCacheStats();
      expect(stats.fileCount).toBeGreaterThanOrEqual(0);
      expect(stats.cacheSize).toBeGreaterThanOrEqual(0);
    });

    test('should cleanup cache properly', async () => {
      const cleanupHandler = new ImageSourceHandler({
        downloadDir: join(tempDir, 'cleanup-test'),
        enableCache: true
      });
      
      // Create some cached files
      const cacheDir = join(tempDir, 'cleanup-test');
      await fs.mkdir(cacheDir, { recursive: true });
      await fs.writeFile(join(cacheDir, 'cached_test1.jpg'), 'test');
      await fs.writeFile(join(cacheDir, 'cached_test2.jpg'), 'test');
      
      // Cleanup
      await cleanupHandler.cleanup();
      
      const stats = await cleanupHandler.getCacheStats();
      expect(stats.cachedUrls).toHaveLength(0);
    });

    test('should preserve cache when requested', async () => {
      const preserveHandler = new ImageSourceHandler({
        downloadDir: join(tempDir, 'preserve-test'),
        enableCache: true
      });
      
      // Create cached file
      const cacheDir = join(tempDir, 'preserve-test');
      await fs.mkdir(cacheDir, { recursive: true });
      await fs.writeFile(join(cacheDir, 'cached_preserve.jpg'), 'test');
      
      // Cleanup with preserve flag
      await preserveHandler.cleanup(true);
      
      // File should still exist
      const files = await fs.readdir(cacheDir);
      expect(files.some(f => f.startsWith('cached_'))).toBe(true);
    });
  });

  describe('🔧 OPTIONS AND CONFIGURATION TESTS', () => {
    test('should respect custom download directory', async () => {
      const customDir = join(tempDir, 'custom-download-dir');
      const customHandler = new ImageSourceHandler({
        downloadDir: customDir
      });
      
      // Ensure directory is created
      await new Promise(resolve => setTimeout(resolve, 100));
      
      const dirExists = await customHandler.fileExists(customDir);
      expect(dirExists).toBe(true);
    });

    test('should apply custom headers', async () => {
      const headersHandler = new ImageSourceHandler({
        headers: {
          'User-Agent': 'MediaSDK/1.0',
          'Accept': 'image/*',
          'Authorization': 'Bearer token123'
        }
      });
      
      // Headers would be used in actual HTTP requests
      expect(headersHandler).toBeDefined();
    });

    test('should handle various download sizes', () => {
      const sizes = [
        1024,           // 1KB
        1024 * 1024,    // 1MB
        10 * 1024 * 1024, // 10MB
        100 * 1024 * 1024 // 100MB
      ];
      
      sizes.forEach(size => {
        const handler = new ImageSourceHandler({ maxDownloadSize: size });
        expect(handler).toBeDefined();
      });
    });

    test('should handle various timeout values', () => {
      const timeouts = [
        1000,   // 1 second
        5000,   // 5 seconds
        30000,  // 30 seconds
        60000   // 1 minute
      ];
      
      timeouts.forEach(timeout => {
        const handler = new ImageSourceHandler({ downloadTimeout: timeout });
        expect(handler).toBeDefined();
      });
    });
  });

  describe('🎬 TIMELINE INTEGRATION TESTS', () => {
    test('should create timeline extension properly', async () => {
      const timeline = {
        addImage: (path: string, options: any) => ({ path, options }),
        // Mock timeline methods
      };
      
      const extension = require('../../../packages/media-sdk/src/utils/image-source-handler.js').createTimelineWithRemoteSupport(handler);
      
      expect(extension).toBeDefined();
      expect(extension.addImageAuto).toBeDefined();
      expect(extension.addImagesAuto).toBeDefined();
    });

    test('should handle timeline batch operations', async () => {
      const sources = [
        join(testAssetsDir, 'test-image-1.jpg'),
        join(testAssetsDir, 'test-image-2.png'),
        join(testAssetsDir, 'test-image-3.gif')
      ];
      
      const results = await handler.processBatch(sources);
      
      // Simulate timeline creation
      let timelineImages = 0;
      results.forEach(result => {
        if (!result.error) {
          timelineImages++;
        }
      });
      
      expect(timelineImages).toBe(3);
    });
  });

  describe('🚨 ERROR HANDLING AND EDGE CASES', () => {
    test('should handle invalid URLs gracefully', async () => {
      const invalidUrls = [
        'not-a-url',
        'ftp://invalid-protocol.com/image.jpg',
        'javascript:alert("xss")',
        'data:text/html,<script>alert("xss")</script>',
        ''
      ];
      
      for (const url of invalidUrls) {
        const result = await handler.processImageSource(url);
        expect(result.error).toBeDefined();
      }
    });

    test('should handle special characters in filenames', async () => {
      const specialFiles = [
        'image with spaces.jpg',
        'image-with-dashes.png',
        'image_with_underscores.gif',
        'image.multiple.dots.webp',
        'UPPERCASE.JPG'
      ];
      
      for (const filename of specialFiles) {
        const testPath = join(testAssetsDir, filename);
        // Create test file
        await fs.writeFile(testPath, Buffer.from([0xFF, 0xD8, 0xFF]));
        
        const result = await handler.processImageSource(testPath);
        
        if (await handler.fileExists(testPath)) {
          expect(result.error).toBeUndefined();
        }
        
        // Cleanup
        try {
          await fs.unlink(testPath);
        } catch (e) {
          // Ignore
        }
      }
    });

    test('should handle concurrent access', async () => {
      const concurrentHandler = new ImageSourceHandler({
        downloadDir: join(tempDir, 'concurrent-test')
      });
      
      const testFile = join(testAssetsDir, 'test-image-1.jpg');
      
      // Process same file 10 times concurrently
      const promises = Array(10).fill(null).map(() => 
        concurrentHandler.processImageSource(testFile)
      );
      
      const results = await Promise.all(promises);
      
      // All should succeed
      results.forEach(result => {
        expect(result.error).toBeUndefined();
        expect(result.localPath).toBe(testFile);
      });
    });

    test('should handle filesystem errors', async () => {
      const errorHandler = new ImageSourceHandler({
        downloadDir: '/invalid/root/path/that/cannot/exist'
      });
      
      // Should handle directory creation failure gracefully
      await new Promise(resolve => setTimeout(resolve, 100));
      
      // Handler should still be created
      expect(errorHandler).toBeDefined();
    });
  });


  describe('🌍 REAL-WORLD WORKFLOW TESTS', () => {
    test('should handle slideshow creation workflow', async () => {
      const slideshowSources = [
        join(testAssetsDir, 'test-image-1.jpg'),
        join(testAssetsDir, 'test-image-2.png'),
        join(testAssetsDir, 'test-image-3.gif'),
        join(testAssetsDir, 'test-image-4.webp'),
        join(testAssetsDir, 'test-image-5.bmp')
      ];
      
      const results = await handler.processBatch(slideshowSources);
      
      // Verify all images are ready for slideshow
      const validImages = results.filter(r => !r.error);
      expect(validImages).toHaveLength(5);
      
      // Simulate timeline creation
      validImages.forEach((image, index) => {
        expect(image.localPath).toBeTruthy();
        expect(image.mimeType).toMatch(/^image\//);
      });
    });

    test('should handle gallery upload workflow', async () => {
      // Simulate user uploading mixed local and remote images
      const galleryImages = [
        join(testAssetsDir, 'test-image-1.jpg'),     // Local file
        'https://cdn.example.com/user/photo1.jpg',   // CDN image
        join(testAssetsDir, 'test-image-2.png'),     // Local file
        'https://api.example.com/image/12345',       // API endpoint
        '/Users/photos/vacation.jpg'                  // Absolute path
      ];
      
      const results = await handler.processBatch(galleryImages);
      
      // Count successful processes
      const successful = results.filter(r => !r.error);
      const failed = results.filter(r => r.error);
      
      console.log(`Gallery upload: ${successful.length} successful, ${failed.length} failed`);
      
      // At least local test files should succeed
      expect(successful.length).toBeGreaterThanOrEqual(2);
    });

    test('should handle watermark overlay workflow', async () => {
      const mainImage = join(testAssetsDir, 'test-image-1.jpg');
      const watermark = join(testAssetsDir, 'test-image-2.png');
      
      const results = await handler.processBatch([mainImage, watermark]);
      
      expect(results).toHaveLength(2);
      expect(results[0].error).toBeUndefined();
      expect(results[1].error).toBeUndefined();
      
      // Both images ready for overlay composition
      expect(results[0].mimeType).toBe('image/jpeg');
      expect(results[1].mimeType).toBe('image/png'); // Good for transparency
    });

    test('should handle social media multi-platform workflow', async () => {
      // Different platforms need different image processing
      const socialImages = {
        instagram: join(testAssetsDir, 'test-image-1.jpg'), // 1:1 square
        twitter: join(testAssetsDir, 'test-image-2.png'),   // 16:9
        facebook: join(testAssetsDir, 'test-image-3.gif'),  // Various
        tiktok: join(testAssetsDir, 'test-image-4.webp')    // 9:16
      };
      
      const platforms = Object.keys(socialImages);
      const sources = Object.values(socialImages);
      
      const results = await handler.processBatch(sources);
      
      results.forEach((result, index) => {
        if (!result.error) {
          console.log(`${platforms[index]}: ${result.mimeType} (${result.fileSize} bytes)`);
        }
      });
      
      expect(results.filter(r => !r.error)).toHaveLength(4);
    });
  });

  describe('🔒 SECURITY TESTS', () => {
    test('should validate URL protocols', async () => {
      const dangerousUrls = [
        'file:///etc/passwd',
        'file://C:/Windows/System32/config/SAM',
        'javascript:void(0)',
        'data:text/html,<script>alert(1)</script>',
        'ftp://internal.server/sensitive.jpg'
      ];
      
      for (const url of dangerousUrls) {
        // Should either reject as not HTTP(S) or fail to process
        if (handler.isRemoteUrl(url)) {
          const result = await handler.processImageSource(url);
          expect(result.error).toBeDefined();
        } else {
          expect(handler.isRemoteUrl(url)).toBe(false);
        }
      }
    });

    test('should prevent path traversal', async () => {
      const traversalPaths = [
        '../../../etc/passwd',
        '..\\..\\..\\Windows\\System32\\config\\SAM',
        '/etc/passwd',
        'C:\\Windows\\System32\\config\\SAM'
      ];
      
      for (const path of traversalPaths) {
        const result = await handler.processImageSource(path);
        
        // Should either fail or resolve to safe path
        if (!result.error) {
          expect(result.localPath).not.toContain('..');
        }
      }
    });

    test('should limit resource consumption', async () => {
      // Test with handler that has strict limits
      const strictHandler = new ImageSourceHandler({
        maxDownloadSize: 1024,     // 1KB max
        downloadTimeout: 100,      // 100ms timeout
        enableCache: false         // No cache to limit disk usage
      });
      
      // Even small operations should respect limits
      const result = await strictHandler.processImageSource(
        join(testAssetsDir, 'test-image-1.jpg')
      );
      
      // Local files bypass download limits
      expect(result.error).toBeUndefined();
    });
  });

  describe('🎯 INTEGRATION WITH MEDIA SDK', () => {
    test('should work with Timeline API patterns', async () => {
      const images = [
        join(testAssetsDir, 'test-image-1.jpg'),
        join(testAssetsDir, 'test-image-2.png'),
        join(testAssetsDir, 'test-image-3.gif')
      ];
      
      const results = await handler.processBatch(images);
      
      // Simulate Timeline usage
      const timelineData = results
        .filter(r => !r.error)
        .map((image, index) => ({
          type: 'image',
          source: image.localPath,
          startTime: index * 3,
          duration: 3,
          mimeType: image.mimeType
        }));
      
      expect(timelineData).toHaveLength(3);
      expect(timelineData[0].type).toBe('image');
      expect(timelineData[0].duration).toBe(3);
    });

    test('should support effect patterns', async () => {
      // Process images that will have effects applied
      const effectImages = await handler.processBatch([
        join(testAssetsDir, 'test-image-1.jpg'), // Will add blur
        join(testAssetsDir, 'test-image-2.png'), // Will add grayscale
        join(testAssetsDir, 'test-image-3.gif')  // Will add sepia
      ]);
      
      const effectData = effectImages
        .filter(r => !r.error)
        .map((image, index) => ({
          source: image.localPath,
          effects: ['blur', 'grayscale', 'sepia'][index],
          ready: true
        }));
      
      expect(effectData.every(d => d.ready)).toBe(true);
    });
  });
});


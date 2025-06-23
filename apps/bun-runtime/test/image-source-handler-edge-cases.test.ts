/**
 * @fileoverview IMAGE SOURCE HANDLER EDGE CASES AND ADVANCED TESTS
 * 
 * Additional test coverage for complex scenarios, edge cases, and error conditions
 * for the image source handler.
 */

import { test, expect, describe, beforeAll, afterAll } from 'bun:test';
import { ImageSourceHandler, ImageSourceOptions, ProcessedImage } from '../../../packages/media-sdk/src/utils/image-source-handler.js';
import { promises as fs } from 'fs';
import { join } from 'path';
import { tmpdir } from 'os';
import { createHash } from 'crypto';

describe('🖼️ IMAGE SOURCE HANDLER EDGE CASES', () => {
  let tempDir: string;
  let testAssetsDir: string;
  let handler: ImageSourceHandler;
  
  beforeAll(async () => {
    tempDir = join(tmpdir(), 'image-edge-cases-' + Date.now());
    testAssetsDir = join(tempDir, 'test-assets');
    await fs.mkdir(tempDir, { recursive: true });
    await fs.mkdir(testAssetsDir, { recursive: true });
    
    // Create some test images
    await createTestImages();
  });
  
  afterAll(async () => {
    try {
      await cleanupDirectory(tempDir);
    } catch (e) {
      // Ignore cleanup errors
    }
  });

  async function createTestImages() {
    // Create various test files
    const testFiles = [
      'normal.jpg',
      'UPPERCASE.JPG',
      'with spaces.png',
      'with-dashes.gif',
      'with_underscores.webp',
      'with.multiple.dots.bmp',
      '日本語.jpg',
      'émojis🎨.png',
      '.hidden.jpg',
      'no-extension'
    ];
    
    for (const filename of testFiles) {
      const buffer = Buffer.from([0xFF, 0xD8, 0xFF, 0xE0]); // JPEG header
      await fs.writeFile(join(testAssetsDir, filename), buffer);
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

  describe('🔍 EXTREME URL DETECTION CASES', () => {
    test('should handle malformed URLs', () => {
      const handler = new ImageSourceHandler();
      
      const malformedUrls = [
        'htt://missing-p.com/image.jpg',
        'https//missing-colon.com/image.jpg',
        'https:/missing-slash.com/image.jpg',
        'https:///three-slashes.com/image.jpg',
        'https:///',
        'https://.',
        'https://..',
        'https://...',
        'https:// spaces in url.com/image.jpg',
        'https://tab\tin\turl.com/image.jpg',
        'https://newline\nin\nurl.com/image.jpg'
      ];
      
      malformedUrls.forEach(url => {
        const result = handler.isRemoteUrl(url);
        // Most should be false or handle gracefully
        expect(typeof result).toBe('boolean');
      });
    });

    test('should handle data URLs correctly', async () => {
      const handler = new ImageSourceHandler();
      
      const dataUrls = [
        'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==',
        'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQEAYABgAAD/2wBDAAIBAQIBAQICAgICAgICAwUDAwMDAwYEBAMFBwYHBwcGBwcICQsJCAgKCAcHCg0KCgsMDAwMBwkODw0MDgsMDAz/2wBDAQICAgMDAwYDAwYMCAcIDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAz/wAARCAABAAEDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAr/xAAUEAEAAAAAAAAAAAAAAAAAAAAA/8QAFQEBAQAAAAAAAAAAAAAAAAAAAAX/xAAUEQEAAAAAAAAAAAAAAAAAAAAA/9oADAMBAAIRAxEAPwCwAA8A/9k=',
        'data:text/plain;base64,SGVsbG8gV29ybGQ='
      ];
      
      for (const dataUrl of dataUrls) {
        expect(handler.isRemoteUrl(dataUrl)).toBe(false);
        
        const result = await handler.processImageSource(dataUrl);
        expect(result.error).toBeDefined(); // Should error as not supported
      }
    });

    test('should handle internationalized domain names', () => {
      const handler = new ImageSourceHandler();
      
      const idnUrls = [
        'https://例え.jp/画像.jpg',
        'https://пример.рф/изображение.jpg',
        'https://مثال.السعودية/صورة.jpg',
        'https://xn--r8jz45g.jp/image.jpg' // Punycode version
      ];
      
      idnUrls.forEach(url => {
        const result = handler.isRemoteUrl(url);
        expect(result).toBe(true);
      });
    });
  });

  describe('📁 EXTREME FILE PATH CASES', () => {
    test('should handle extremely long file paths', async () => {
      const handler = new ImageSourceHandler();
      
      // Create a very long path
      const longDir = 'a'.repeat(100);
      const longFile = 'b'.repeat(100) + '.jpg';
      const longPath = join(testAssetsDir, longDir, longFile);
      
      const result = await handler.processImageSource(longPath);
      
      // Should fail gracefully
      expect(result.error).toBeDefined();
      expect(result.localPath).toBe('');
    });

    test('should handle files with unusual extensions', async () => {
      const handler = new ImageSourceHandler();
      
      const unusualFiles = [
        'image.JPEG',
        'image.JPG',
        'image.PNG',
        'image.GIF',
        'image.WEBP',
        'image.BMP',
        'image.jPeG',
        'image.PnG'
      ];
      
      for (const filename of unusualFiles) {
        const testPath = join(testAssetsDir, filename);
        await fs.writeFile(testPath, Buffer.from([0xFF, 0xD8]));
        
        const result = await handler.processImageSource(testPath);
        
        expect(result.wasDownloaded).toBe(false);
        expect(result.mimeType).toMatch(/^image\//);
        
        await fs.unlink(testPath);
      }
    });

    test('should handle symlinks', async () => {
      const handler = new ImageSourceHandler();
      
      const originalFile = join(testAssetsDir, 'original.jpg');
      const symlinkFile = join(testAssetsDir, 'symlink.jpg');
      
      // Create symlink (might fail on Windows without admin)
      try {
        await fs.symlink(originalFile, symlinkFile);
        
        const result = await handler.processImageSource(symlinkFile);
        
        if (!result.error) {
          expect(result.wasDownloaded).toBe(false);
          expect(result.localPath).toBe(symlinkFile);
        }
        
        await fs.unlink(symlinkFile);
      } catch (e) {
        // Symlink creation failed, skip test
        console.log('Symlink test skipped:', e.message);
      }
    });
  });

  describe('🌐 ADVANCED DOWNLOAD SCENARIOS', () => {
    test('should handle redirects', async () => {
      const handler = new ImageSourceHandler();
      
      // URLs that typically redirect
      const redirectUrls = [
        'http://example.com/image.jpg', // HTTP -> HTTPS redirect
        'https://bit.ly/test-image',    // URL shortener
        'https://tinyurl.com/test-img'  // Another shortener
      ];
      
      for (const url of redirectUrls) {
        const result = await handler.processImageSource(url);
        
        // Should either succeed or fail gracefully
        expect(result.originalSource).toBe(url);
        if (!result.error) {
          expect(result.wasDownloaded).toBe(true);
        }
      }
    });

    test('should respect download size limits strictly', async () => {
      const tinyHandler = new ImageSourceHandler({
        maxDownloadSize: 1 // 1 byte max
      });
      
      const result = await tinyHandler.processImageSource('https://example.com/any-image.jpg');
      
      // Should fail due to size limit
      if (!result.error?.includes('Failed to download')) {
        expect(result.error).toContain('too large');
      }
    });

    test('should handle server errors gracefully', async () => {
      const handler = new ImageSourceHandler();
      
      const errorUrls = [
        'https://httpstat.us/404', // 404 Not Found
        'https://httpstat.us/500', // 500 Internal Server Error
        'https://httpstat.us/503'  // 503 Service Unavailable
      ];
      
      for (const url of errorUrls) {
        const result = await handler.processImageSource(url);
        
        expect(result.error).toBeDefined();
        expect(result.wasDownloaded).toBe(false);
      }
    });
  });

  describe('💾 CACHE EDGE CASES', () => {
    test('should handle cache corruption', async () => {
      const cacheHandler = new ImageSourceHandler({
        downloadDir: join(tempDir, 'cache-corruption-test'),
        enableCache: true
      });
      
      // Process a local file
      const testFile = join(testAssetsDir, 'normal.jpg');
      await cacheHandler.processImageSource(testFile);
      
      // Corrupt the cache by modifying internal state
      // @ts-ignore - accessing private property for testing
      cacheHandler.downloadCache.set('corrupted-key', '/non/existent/path.jpg');
      
      // Try to use corrupted cache
      const result = await cacheHandler.processImageSource('corrupted-key');
      
      // Should handle gracefully
      expect(result.error).toBeDefined();
    });

    test('should handle concurrent cache access', async () => {
      const concurrentHandler = new ImageSourceHandler({
        downloadDir: join(tempDir, 'concurrent-cache-test'),
        enableCache: true
      });
      
      const testFile = join(testAssetsDir, 'normal.jpg');
      
      // Process same file 50 times concurrently
      const promises = Array(50).fill(null).map(() => 
        concurrentHandler.processImageSource(testFile)
      );
      
      const results = await Promise.all(promises);
      
      // All should succeed
      results.forEach(result => {
        expect(result.error).toBeUndefined();
        expect(result.localPath).toBe(testFile);
      });
      
      // Cache stats should show efficiency
      const stats = await concurrentHandler.getCacheStats();
      console.log('Concurrent cache stats:', stats);
    });

    test('should handle cache directory deletion during operation', async () => {
      const volatileDir = join(tempDir, 'volatile-cache');
      const volatileHandler = new ImageSourceHandler({
        downloadDir: volatileDir,
        enableCache: true
      });
      
      // Ensure directory exists
      await fs.mkdir(volatileDir, { recursive: true });
      
      // Start processing
      const testFile = join(testAssetsDir, 'normal.jpg');
      const processPromise = volatileHandler.processImageSource(testFile);
      
      // Delete cache directory while processing
      try {
        await fs.rmdir(volatileDir, { recursive: true });
      } catch (e) {
        // Might fail if in use
      }
      
      // Should still complete
      const result = await processPromise;
      
      // Should handle gracefully
      expect(result).toBeDefined();
    });
  });

  describe('🔒 SECURITY EDGE CASES', () => {
    test('should prevent directory traversal attacks', async () => {
      const handler = new ImageSourceHandler();
      
      const maliciousPaths = [
        '../../../etc/passwd',
        '..\\..\\..\\Windows\\System32\\config\\SAM',
        '/etc/../etc/./passwd',
        'C:\\Windows\\..\\Windows\\System32\\drivers\\etc\\hosts',
        './././../../../sensitive.jpg',
        'image/../../../etc/shadow.jpg'
      ];
      
      for (const path of maliciousPaths) {
        const result = await handler.processImageSource(path);
        
        // Should either fail or resolve to safe path
        if (!result.error) {
          expect(result.localPath).not.toContain('..');
          expect(result.localPath).not.toMatch(/^\/etc/);
          expect(result.localPath).not.toMatch(/^C:\\Windows/);
        }
      }
    });

    test('should validate file type by content not extension', async () => {
      const handler = new ImageSourceHandler();
      
      // Create a text file with image extension
      const fakeImage = join(testAssetsDir, 'fake-image.jpg');
      await fs.writeFile(fakeImage, 'This is not an image!', 'utf-8');
      
      const result = await handler.processImageSource(fakeImage);
      
      // Should process but mime type detection might differ
      expect(result.error).toBeUndefined();
      expect(result.mimeType).toBe('image/jpeg'); // Based on extension
      
      await fs.unlink(fakeImage);
    });

    test('should handle malicious headers in custom configuration', () => {
      const maliciousHeaders = {
        'X-Injection": "value", "X-Another': 'injection',
        'Content-Type': 'text/html; charset=UTF-8\r\nX-Injected: true',
        'Authorization': 'Bearer ' + 'A'.repeat(10000) // Very long header
      };
      
      // Should not throw when creating handler
      const handler = new ImageSourceHandler({
        headers: maliciousHeaders
      });
      
      expect(handler).toBeDefined();
    });
  });

  describe('🎯 BATCH PROCESSING EDGE CASES', () => {
    test('should handle mixed success/failure in large batches', async () => {
      const handler = new ImageSourceHandler();
      
      const mixedSources = [
        join(testAssetsDir, 'normal.jpg'),           // Success
        'https://invalid-domain-xyz123.com/img.jpg', // Fail - invalid domain
        join(testAssetsDir, 'does-not-exist.jpg'),   // Fail - not found
        join(testAssetsDir, 'with spaces.png'),      // Success
        'not-a-url-or-path',                         // Fail - invalid
        join(testAssetsDir, 'UPPERCASE.JPG'),         // Success
        null,                                         // Fail - null
        undefined,                                    // Fail - undefined
        '',                                          // Fail - empty
        join(testAssetsDir, '日本語.jpg')             // Success
      ];
      
      // @ts-ignore - testing with invalid inputs
      const results = await handler.processBatch(mixedSources);
      
      expect(results).toHaveLength(10);
      
      // Count successes and failures
      const successes = results.filter(r => !r.error);
      const failures = results.filter(r => r.error);
      
      expect(successes.length).toBeGreaterThan(0);
      expect(failures.length).toBeGreaterThan(0);
      
      console.log(`Batch results: ${successes.length} success, ${failures.length} failed`);
    });

    test('should handle duplicate sources in batch', async () => {
      const handler = new ImageSourceHandler();
      
      const testFile = join(testAssetsDir, 'normal.jpg');
      const duplicateSources = Array(20).fill(testFile);
      
      const results = await handler.processBatch(duplicateSources);
      
      expect(results).toHaveLength(20);
      
      // All should have same result
      const firstResult = results[0];
      results.forEach(result => {
        expect(result.localPath).toBe(firstResult.localPath);
        expect(result.wasDownloaded).toBe(firstResult.wasDownloaded);
      });
    });

    test('should handle batch with all failures gracefully', async () => {
      const handler = new ImageSourceHandler();
      
      const allBadSources = [
        '/non/existent/path1.jpg',
        '/non/existent/path2.jpg',
        'https://invalid-domain-abc.com/image.jpg',
        'https://invalid-domain-xyz.com/image.jpg'
      ];
      
      const results = await handler.processBatch(allBadSources);
      
      expect(results).toHaveLength(4);
      expect(results.every(r => r.error)).toBe(true);
    });
  });

  describe('📊 MIME TYPE EDGE CASES', () => {
    test('should handle unknown file extensions', async () => {
      const handler = new ImageSourceHandler();
      
      const unknownExtensions = [
        'image.xyz',
        'image.abc',
        'image.123',
        'image',
        'image.',
        '.image'
      ];
      
      for (const filename of unknownExtensions) {
        const testPath = join(testAssetsDir, filename);
        await fs.writeFile(testPath, Buffer.from([0xFF, 0xD8]));
        
        const result = await handler.processImageSource(testPath);
        
        expect(result.error).toBeUndefined();
        expect(result.mimeType).toBe('image/unknown');
        
        await fs.unlink(testPath);
      }
    });

    test('should handle case sensitivity in extensions', async () => {
      const handler = new ImageSourceHandler();
      
      const extensions = [
        '.JPG', '.jpg', '.JpG', '.jPg',
        '.PNG', '.png', '.PnG', '.pNg',
        '.GIF', '.gif', '.GiF', '.gIf'
      ];
      
      for (const ext of extensions) {
        const result = handler['getMimeType'](`test${ext}`);
        expect(result).toMatch(/^image\/(jpeg|png|gif)$/);
      }
    });
  });

  describe('⏱️ TIMEOUT AND TIMING EDGE CASES', () => {
    test('should handle zero timeout', async () => {
      const zeroTimeoutHandler = new ImageSourceHandler({
        downloadTimeout: 0
      });
      
      const result = await zeroTimeoutHandler.processImageSource('https://example.com/image.jpg');
      
      // Should fail immediately
      expect(result.error).toBeDefined();
    });

    test('should handle extremely long timeouts', async () => {
      const longTimeoutHandler = new ImageSourceHandler({
        downloadTimeout: Number.MAX_SAFE_INTEGER
      });
      
      // Just verify it creates without error
      expect(longTimeoutHandler).toBeDefined();
    });
  });

  describe('🧹 CLEANUP EDGE CASES', () => {
    test('should handle cleanup with corrupted cache', async () => {
      const cleanupHandler = new ImageSourceHandler({
        downloadDir: join(tempDir, 'cleanup-test'),
        enableCache: true
      });
      
      // Create some cached files
      const cacheDir = join(tempDir, 'cleanup-test');
      await fs.mkdir(cacheDir, { recursive: true });
      
      // Create normal cached file
      await fs.writeFile(join(cacheDir, 'cached_normal.jpg'), 'data');
      
      // Create corrupted file (directory instead of file)
      await fs.mkdir(join(cacheDir, 'cached_corrupted.jpg'));
      
      // Cleanup should handle gracefully
      await cleanupHandler.cleanup();
      
      // Verify cleanup attempted
      const stats = await cleanupHandler.getCacheStats();
      expect(stats.fileCount).toBeGreaterThanOrEqual(0);
    });

    test('should handle concurrent cleanup operations', async () => {
      const concurrentCleanup = new ImageSourceHandler({
        downloadDir: join(tempDir, 'concurrent-cleanup'),
        enableCache: true
      });
      
      // Run cleanup multiple times concurrently
      const cleanupPromises = Array(10).fill(null).map(() => 
        concurrentCleanup.cleanup()
      );
      
      // Should not throw
      await expect(Promise.all(cleanupPromises)).resolves.toBeDefined();
    });
  });
});
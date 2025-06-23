/**
 * @fileoverview Image Source Handler - Support for both remote URLs and local file paths
 * 
 * Handles fetching remote images and referencing local files seamlessly.
 * Automatically detects whether a source is a URL or local path and processes accordingly.
 * 
 * @example Remote URL
 * ```typescript
 * const handler = new ImageSourceHandler();
 * const localPath = await handler.processImageSource('https://example.com/image.jpg');
 * // Downloads to temp directory and returns local path
 * ```
 * 
 * @example Local File Path
 * ```typescript
 * const handler = new ImageSourceHandler();
 * const localPath = await handler.processImageSource('/path/to/local/image.jpg');
 * // Returns the same path if file exists
 * ```
 * 
 * @example Batch Processing
 * ```typescript
 * const handler = new ImageSourceHandler();
 * const sources = [
 *   'https://example.com/remote1.jpg',
 *   './local-image.png',
 *   'https://example.com/remote2.jpg',
 *   '/absolute/path/to/image.jpg'
 * ];
 * const localPaths = await handler.processBatch(sources);
 * ```
 */

import { promises as fs } from 'fs';
import { join, basename, extname } from 'path';
import { tmpdir } from 'os';
import { createHash } from 'crypto';

export interface ImageSourceOptions {
  /**
   * Directory to download remote images to
   * @default os.tmpdir() + '/media-sdk-images'
   */
  downloadDir?: string;
  
  /**
   * Whether to cache downloaded images
   * @default true
   */
  enableCache?: boolean;
  
  /**
   * Maximum download size in bytes (10MB default)
   * @default 10485760
   */
  maxDownloadSize?: number;
  
  /**
   * Download timeout in milliseconds
   * @default 30000
   */
  downloadTimeout?: number;
  
  /**
   * Custom headers for remote requests
   */
  headers?: Record<string, string>;
}

export interface ProcessedImage {
  /**
   * Original source (URL or path)
   */
  originalSource: string;
  
  /**
   * Local file path to use
   */
  localPath: string;
  
  /**
   * Whether the image was downloaded
   */
  wasDownloaded: boolean;
  
  /**
   * File size in bytes
   */
  fileSize?: number;
  
  /**
   * MIME type if detected
   */
  mimeType?: string;
  
  /**
   * Error if processing failed
   */
  error?: string;
}

export class ImageSourceHandler {
  private options: Required<ImageSourceOptions>;
  private downloadCache: Map<string, string> = new Map();
  private tempDir: string;

  constructor(options: ImageSourceOptions = {}) {
    this.options = {
      downloadDir: options.downloadDir || join(tmpdir(), 'media-sdk-images'),
      enableCache: options.enableCache ?? true,
      maxDownloadSize: options.maxDownloadSize || 10 * 1024 * 1024, // 10MB
      downloadTimeout: options.downloadTimeout || 30000, // 30 seconds
      headers: options.headers || {}
    };
    
    this.tempDir = this.options.downloadDir;
    this.ensureDownloadDir();
  }

  /**
   * Ensure download directory exists
   */
  private async ensureDownloadDir(): Promise<void> {
    try {
      await fs.mkdir(this.tempDir, { recursive: true });
    } catch (error) {
      console.error('Failed to create download directory:', error);
    }
  }

  /**
   * Check if source is a remote URL
   */
  isRemoteUrl(source: string): boolean {
    try {
      const url = new URL(source);
      return ['http:', 'https:'].includes(url.protocol);
    } catch {
      return false;
    }
  }

  /**
   * Check if local file exists
   */
  async fileExists(path: string): Promise<boolean> {
    try {
      await fs.access(path);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Generate cache filename for URL
   */
  private getCacheFilename(url: string): string {
    const hash = createHash('md5').update(url).digest('hex');
    const ext = extname(new URL(url).pathname) || '.jpg';
    return `cached_${hash}${ext}`;
  }

  /**
   * Download image from URL
   */
  private async downloadImage(url: string): Promise<string> {
    // Check cache first
    if (this.options.enableCache && this.downloadCache.has(url)) {
      const cachedPath = this.downloadCache.get(url)!;
      if (await this.fileExists(cachedPath)) {
        return cachedPath;
      }
    }

    const filename = this.getCacheFilename(url);
    const localPath = join(this.tempDir, filename);

    // Check if already downloaded
    if (this.options.enableCache && await this.fileExists(localPath)) {
      this.downloadCache.set(url, localPath);
      return localPath;
    }

    // Download the image
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), this.options.downloadTimeout);

      const response = await fetch(url, {
        headers: this.options.headers,
        signal: controller.signal
      });

      clearTimeout(timeout);

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      // Check content length
      const contentLength = response.headers.get('content-length');
      if (contentLength && parseInt(contentLength) > this.options.maxDownloadSize) {
        throw new Error(`File too large: ${contentLength} bytes exceeds max ${this.options.maxDownloadSize}`);
      }

      const buffer = await response.arrayBuffer();
      
      // Check actual size
      if (buffer.byteLength > this.options.maxDownloadSize) {
        throw new Error(`Downloaded file too large: ${buffer.byteLength} bytes`);
      }

      // Save to file
      await fs.writeFile(localPath, Buffer.from(buffer));
      
      // Cache the result
      if (this.options.enableCache) {
        this.downloadCache.set(url, localPath);
      }

      return localPath;
    } catch (error) {
      throw new Error(`Failed to download image from ${url}: ${error.message}`);
    }
  }

  /**
   * Process a single image source (URL or local path)
   */
  async processImageSource(source: string): Promise<ProcessedImage> {
    try {
      if (this.isRemoteUrl(source)) {
        // Handle remote URL
        const localPath = await this.downloadImage(source);
        const stats = await fs.stat(localPath);
        
        return {
          originalSource: source,
          localPath,
          wasDownloaded: true,
          fileSize: stats.size,
          mimeType: this.getMimeType(localPath)
        };
      } else {
        // Handle local path
        const exists = await this.fileExists(source);
        if (!exists) {
          throw new Error(`Local file not found: ${source}`);
        }

        const stats = await fs.stat(source);
        
        return {
          originalSource: source,
          localPath: source,
          wasDownloaded: false,
          fileSize: stats.size,
          mimeType: this.getMimeType(source)
        };
      }
    } catch (error) {
      return {
        originalSource: source,
        localPath: '',
        wasDownloaded: false,
        error: error.message
      };
    }
  }

  /**
   * Process multiple image sources in parallel
   */
  async processBatch(sources: string[]): Promise<ProcessedImage[]> {
    const results = await Promise.allSettled(
      sources.map(source => this.processImageSource(source))
    );

    return results.map((result, index) => {
      if (result.status === 'fulfilled') {
        return result.value;
      } else {
        return {
          originalSource: sources[index],
          localPath: '',
          wasDownloaded: false,
          error: result.reason?.message || 'Unknown error'
        };
      }
    });
  }

  /**
   * Get MIME type from file extension
   */
  private getMimeType(filepath: string): string {
    const ext = extname(filepath).toLowerCase();
    const mimeTypes: Record<string, string> = {
      '.jpg': 'image/jpeg',
      '.jpeg': 'image/jpeg',
      '.png': 'image/png',
      '.gif': 'image/gif',
      '.webp': 'image/webp',
      '.bmp': 'image/bmp',
      '.svg': 'image/svg+xml',
      '.tiff': 'image/tiff',
      '.ico': 'image/x-icon'
    };
    
    return mimeTypes[ext] || 'image/unknown';
  }

  /**
   * Clean up downloaded files
   */
  async cleanup(keepCached: boolean = false): Promise<void> {
    if (!keepCached) {
      // Clean all downloaded files
      try {
        const files = await fs.readdir(this.tempDir);
        await Promise.all(
          files
            .filter(file => file.startsWith('cached_'))
            .map(file => fs.unlink(join(this.tempDir, file)))
        );
      } catch (error) {
        console.error('Cleanup error:', error);
      }
      
      this.downloadCache.clear();
    }
  }

  /**
   * Get cache statistics
   */
  async getCacheStats(): Promise<{
    cacheSize: number;
    fileCount: number;
    cachedUrls: string[];
  }> {
    try {
      const files = await fs.readdir(this.tempDir);
      const cachedFiles = files.filter(file => file.startsWith('cached_'));
      
      let totalSize = 0;
      for (const file of cachedFiles) {
        const stats = await fs.stat(join(this.tempDir, file));
        totalSize += stats.size;
      }

      return {
        cacheSize: totalSize,
        fileCount: cachedFiles.length,
        cachedUrls: Array.from(this.downloadCache.keys())
      };
    } catch {
      return {
        cacheSize: 0,
        fileCount: 0,
        cachedUrls: []
      };
    }
  }
}

/**
 * Timeline extension to support remote images
 */
export function createTimelineWithRemoteSupport(handler: ImageSourceHandler) {
  return {
    async addImageAuto(source: string, options: any) {
      const processed = await handler.processImageSource(source);
      
      if (processed.error) {
        throw new Error(processed.error);
      }
      
      // Use the local path in the timeline
      return this.addImage(processed.localPath, options);
    },
    
    async addImagesAuto(sources: string[], options: any) {
      const processed = await handler.processBatch(sources);
      
      let timeline = this;
      for (const [index, image] of processed.entries()) {
        if (!image.error) {
          timeline = timeline.addImage(image.localPath, {
            ...options,
            startTime: index * (options.duration || 3)
          });
        }
      }
      
      return timeline;
    }
  };
}
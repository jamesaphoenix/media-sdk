/**
 * Runtime validation and system checking for Media SDK
 */

export interface SystemRequirements {
  ffmpeg: {
    available: boolean;
    version?: string;
    features?: string[];
    error?: string;
  };
  imagemagick: {
    available: boolean;
    version?: string;
    error?: string;
  };
  diskSpace: {
    available: number; // MB
    warning: boolean;
  };
  memory: {
    available: number; // MB
    warning: boolean;
  };
}

export interface FileValidation {
  path: string;
  exists: boolean;
  size: number; // bytes
  format?: string;
  duration?: number; // seconds
  resolution?: { width: number; height: number };
  error?: string;
}

export class RuntimeValidator {
  private cache = new Map<string, any>();
  private cacheTimeout = 30000; // 30 seconds
  private cacheHits = 0;
  private cacheMisses = 0;

  async validateSystem(): Promise<SystemRequirements> {
    const cacheKey = 'system-requirements';
    const cached = this.getFromCache(cacheKey);
    if (cached) return cached;

    console.log('🔍 Validating system requirements...');

    const requirements: SystemRequirements = {
      ffmpeg: await this.checkFFmpeg(),
      imagemagick: await this.checkImageMagick(),
      diskSpace: await this.checkDiskSpace(),
      memory: await this.checkMemoryUsage()
    };

    this.setCache(cacheKey, requirements);
    return requirements;
  }

  private async checkFFmpeg(): Promise<SystemRequirements['ffmpeg']> {
    try {
      const proc = Bun.spawn(['ffmpeg', '-version'], {
        stdout: 'pipe',
        stderr: 'pipe'
      });

      const stdout = proc.stdout ? await new Response(proc.stdout).text() : "";
      const exitCode = await proc.exited;

      if (exitCode !== 0) {
        return {
          available: false,
          error: 'FFmpeg not found or failed to run'
        };
      }

      // Parse version and features
      const versionMatch = stdout.match(/ffmpeg version ([^\s]+)/);
      const version = versionMatch ? versionMatch[1] : 'unknown';

      // Extract available codecs/formats
      const features = this.extractFFmpegFeatures(stdout);

      console.log(`  ✅ FFmpeg ${version} available`);
      return {
        available: true,
        version,
        features
      };

    } catch (error: any) {
      return {
        available: false,
        error: `FFmpeg check failed: ${error.message}`
      };
    }
  }

  private async checkImageMagick(): Promise<SystemRequirements['imagemagick']> {
    try {
      const proc = Bun.spawn(['convert', '-version'], {
        stdout: 'pipe',
        stderr: 'pipe'
      });

      const stdout = proc.stdout ? await new Response(proc.stdout).text() : "";
      const exitCode = await proc.exited;

      if (exitCode !== 0) {
        return {
          available: false,
          error: 'ImageMagick not found or failed to run'
        };
      }

      const versionMatch = stdout.match(/Version: ImageMagick ([^\s]+)/);
      const version = versionMatch ? versionMatch[1] : 'unknown';

      console.log(`  ✅ ImageMagick ${version} available`);
      return {
        available: true,
        version
      };

    } catch (error: any) {
      return {
        available: false,
        error: `ImageMagick check failed: ${error.message}`
      };
    }
  }

  private async checkDiskSpace(): Promise<SystemRequirements['diskSpace']> {
    try {
      const proc = Bun.spawn(['df', '-m', '.'], {
        stdout: 'pipe',
        stderr: 'pipe'
      });

      const stdout = proc.stdout ? await new Response(proc.stdout).text() : "";
      const lines = stdout.trim().split('\n');
      
      if (lines.length >= 2) {
        const data = lines[1].split(/\s+/);
        const availableMB = parseInt(data[3]) || 0;
        const warning = availableMB < 1000; // Warn if less than 1GB

        console.log(`  💾 Disk space: ${availableMB}MB available`);
        return {
          available: availableMB,
          warning
        };
      }

      return { available: 0, warning: true };

    } catch (error) {
      return { available: 0, warning: true };
    }
  }

  private async checkMemoryUsage(): Promise<SystemRequirements['memory']> {
    try {
      // Get total system memory info using os module
      const os = await import('os');
      const totalMemory = os.totalmem();
      const freeMemory = os.freemem();
      
      // Calculate available memory in MB
      const availableMB = Math.round(freeMemory / 1024 / 1024);
      const warning = availableMB < 100; // Warn if less than 100MB

      console.log(`  🧠 Memory: ${availableMB}MB available`);
      return {
        available: availableMB,
        warning
      };

    } catch (error) {
      // Fallback to heap usage if os module fails
      const memUsage = process.memoryUsage();
      const heapAvailable = memUsage.heapTotal - memUsage.heapUsed;
      const availableMB = Math.max(1, Math.round(heapAvailable / 1024 / 1024));
      
      return { 
        available: availableMB, 
        warning: availableMB < 100 
      };
    }
  }

  async validateFile(filePath: string): Promise<FileValidation> {
    const cacheKey = `file-${filePath}`;
    const cached = this.getFromCache(cacheKey);
    if (cached) return cached;

    const validation: FileValidation = {
      path: filePath,
      exists: false,
      size: 0
    };

    try {
      const file = Bun.file(filePath);
      const exists = await file.exists();

      if (!exists) {
        validation.error = 'File does not exist';
        return validation;
      }

      validation.exists = true;
      validation.size = file.size;

      // Try to get media info using ffprobe
      if (this.isMediaFile(filePath)) {
        const mediaInfo = await this.getMediaInfo(filePath);
        validation.format = mediaInfo.format;
        validation.duration = mediaInfo.duration;
        validation.resolution = mediaInfo.resolution;
      }

      this.setCache(cacheKey, validation);
      return validation;

    } catch (error: any) {
      validation.error = `File validation failed: ${error.message}`;
      return validation;
    }
  }

  async validateOutput(filePath: string, expectedSize?: number): Promise<FileValidation> {
    const validation = await this.validateFile(filePath);

    if (validation.exists && expectedSize) {
      // Check if output file size is reasonable
      const sizeRatio = validation.size / expectedSize;
      if (sizeRatio < 0.1 || sizeRatio > 10) {
        validation.error = `Output file size unusual: ${validation.size} bytes (expected ~${expectedSize})`;
      }
    }

    return validation;
  }

  private async getMediaInfo(filePath: string) {
    try {
      const proc = Bun.spawn([
        'ffprobe', 
        '-v', 'quiet',
        '-print_format', 'json',
        '-show_format',
        '-show_streams',
        filePath
      ], {
        stdout: 'pipe',
        stderr: 'pipe'
      });

      const stdout = proc.stdout ? await new Response(proc.stdout).text() : "";
      const exitCode = await proc.exited;

      if (exitCode !== 0) {
        return { format: 'unknown' };
      }

      const info = JSON.parse(stdout);
      const videoStream = info.streams?.find((s: any) => s.codec_type === 'video');

      return {
        format: info.format?.format_name || 'unknown',
        duration: parseFloat(info.format?.duration) || 0,
        resolution: videoStream ? {
          width: videoStream.width,
          height: videoStream.height
        } : undefined
      };

    } catch (error) {
      return { format: 'unknown' };
    }
  }

  private isMediaFile(filePath: string): boolean {
    const ext = filePath.toLowerCase().split('.').pop();
    return ['mp4', 'mov', 'avi', 'mkv', 'mp3', 'wav', 'flac', 'aac'].includes(ext || '');
  }

  private extractFFmpegFeatures(versionOutput: string): string[] {
    const features = [];
    
    if (versionOutput.includes('--enable-libx264')) features.push('h264');
    if (versionOutput.includes('--enable-libx265')) features.push('h265');
    if (versionOutput.includes('--enable-libvpx')) features.push('vpx');
    if (versionOutput.includes('--enable-libaom')) features.push('av1');
    if (versionOutput.includes('--enable-libmp3lame')) features.push('mp3');
    if (versionOutput.includes('--enable-libfdk-aac')) features.push('aac');

    return features;
  }

  private getFromCache(key: string) {
    const cached = this.cache.get(key);
    if (cached && Date.now() - cached.timestamp < this.cacheTimeout) {
      this.cacheHits++;
      return cached.data;
    }
    this.cacheMisses++;
    return null;
  }

  private setCache(key: string, data: any) {
    this.cache.set(key, {
      data,
      timestamp: Date.now()
    });
  }

  getStats() {
    return {
      cacheSize: this.cache.size,
      cacheEntries: Array.from(this.cache.keys()),
      cacheHits: this.cacheHits,
      cacheMisses: this.cacheMisses
    };
  }

  clearCache() {
    this.cache.clear();
    this.cacheHits = 0;
    this.cacheMisses = 0;
  }
}
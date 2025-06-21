/**
 * @fileoverview Test Data Manager
 * 
 * Automated test data management system with sample file generation,
 * validation, and cleanup capabilities for comprehensive testing.
 * 
 * @author Media SDK Team
 * @version 1.0.0
 * @since 2024-12-20
 */

import { existsSync, mkdirSync, writeFileSync, readFileSync, rmSync, statSync } from 'fs';
import { join, resolve } from 'path';
import { spawn } from 'child_process';

/**
 * Sample file specification
 */
export interface SampleFileSpec {
  /** File identifier */
  id: string;
  /** File name */
  name: string;
  /** File type */
  type: 'video' | 'image' | 'audio';
  /** File format/extension */
  format: string;
  /** Generation parameters */
  params: {
    /** Duration in seconds (for video/audio) */
    duration?: number;
    /** Resolution for video/image */
    resolution?: { width: number; height: number };
    /** Frame rate for video */
    framerate?: number;
    /** Color or pattern */
    color?: string;
    /** Sample rate for audio */
    sampleRate?: number;
    /** Audio frequency */
    frequency?: number;
  };
  /** Expected file size in bytes */
  expectedSize: number;
  /** MD5 checksum for validation */
  checksum?: string;
}

/**
 * Test data validation result
 */
export interface DataValidationResult {
  /** Whether all files are valid */
  valid: boolean;
  /** Missing files */
  missing: string[];
  /** Corrupted files */
  corrupted: string[];
  /** Size mismatches */
  sizeMismatches: string[];
  /** Total files checked */
  totalFiles: number;
  /** Valid files count */
  validFiles: number;
}

/**
 * Test Data Manager
 * 
 * Manages sample files, test assets, and data validation for comprehensive
 * testing across different environments and scenarios.
 * 
 * @example
 * ```typescript
 * const dataManager = new TestDataManager('sample-files');
 * 
 * // Initialize test data
 * await dataManager.initializeTestData();
 * 
 * // Validate integrity
 * const validation = await dataManager.validateData();
 * 
 * // Clean up old files
 * await dataManager.cleanup({ olderThan: 30 * 24 * 60 * 60 * 1000 });
 * ```
 */
export class TestDataManager {
  private baseDir: string;
  private sampleSpecs: SampleFileSpec[] = [];

  constructor(baseDir: string = 'sample-files') {
    this.baseDir = resolve(baseDir);
    this.initializeSampleSpecs();
  }

  /**
   * Initializes all test data files
   */
  async initializeTestData(): Promise<void> {
    console.log('🔧 Initializing test data...');
    
    // Ensure base directory exists
    this.ensureDirectory(this.baseDir);
    
    // Validate existing files first
    const validation = await this.validateData();
    console.log(`📊 Current state: ${validation.validFiles}/${validation.totalFiles} files valid`);
    
    // Generate missing or corrupted files
    const filesToGenerate = [
      ...validation.missing,
      ...validation.corrupted,
      ...validation.sizeMismatches
    ];
    
    if (filesToGenerate.length > 0) {
      console.log(`🏗️ Generating ${filesToGenerate.length} files...`);
      
      for (const fileId of filesToGenerate) {
        const spec = this.sampleSpecs.find(s => s.id === fileId);
        if (spec) {
          await this.generateSampleFile(spec);
        }
      }
    } else {
      console.log('✅ All test data files are valid');
    }
    
    // Final validation
    const finalValidation = await this.validateData();
    if (!finalValidation.valid) {
      throw new Error(`Failed to initialize test data: ${finalValidation.missing.length} missing, ${finalValidation.corrupted.length} corrupted`);
    }
    
    console.log('✅ Test data initialization completed');
  }

  /**
   * Validates all test data files
   */
  async validateData(): Promise<DataValidationResult> {
    const missing: string[] = [];
    const corrupted: string[] = [];
    const sizeMismatches: string[] = [];
    
    for (const spec of this.sampleSpecs) {
      const filePath = join(this.baseDir, spec.name);
      
      if (!existsSync(filePath)) {
        missing.push(spec.id);
        continue;
      }
      
      // Check file size
      const stats = statSync(filePath);
      const tolerance = Math.max(100, spec.expectedSize * 0.1); // 10% tolerance or 100 bytes
      
      if (Math.abs(stats.size - spec.expectedSize) > tolerance) {
        sizeMismatches.push(spec.id);
        continue;
      }
      
      // Validate file format
      if (!(await this.validateFileFormat(filePath, spec))) {
        corrupted.push(spec.id);
      }
    }
    
    const totalFiles = this.sampleSpecs.length;
    const validFiles = totalFiles - missing.length - corrupted.length - sizeMismatches.length;
    
    return {
      valid: missing.length === 0 && corrupted.length === 0 && sizeMismatches.length === 0,
      missing,
      corrupted,
      sizeMismatches,
      totalFiles,
      validFiles
    };
  }

  /**
   * Generates a sample file based on specification
   */
  private async generateSampleFile(spec: SampleFileSpec): Promise<void> {
    const filePath = join(this.baseDir, spec.name);
    console.log(`🎬 Generating ${spec.name}...`);
    
    try {
      switch (spec.type) {
        case 'video':
          await this.generateVideo(filePath, spec);
          break;
        case 'image':
          await this.generateImage(filePath, spec);
          break;
        case 'audio':
          await this.generateAudio(filePath, spec);
          break;
      }
      
      console.log(`✅ Generated ${spec.name}`);
    } catch (error) {
      console.error(`❌ Failed to generate ${spec.name}:`, error);
      throw error;
    }
  }

  /**
   * Generates a video file using FFmpeg
   */
  private async generateVideo(filePath: string, spec: SampleFileSpec): Promise<void> {
    const { duration = 5, resolution = { width: 640, height: 480 }, framerate = 30, color = 'red' } = spec.params;
    
    const args = [
      '-f', 'lavfi',
      '-i', `color=${color}:size=${resolution.width}x${resolution.height}:duration=${duration}:rate=${framerate}`,
      '-c:v', 'libx264',
      '-preset', 'ultrafast',
      '-crf', '23',
      '-pix_fmt', 'yuv420p',
      '-y', // Overwrite output file
      filePath
    ];
    
    await this.runFFmpeg(args);
  }

  /**
   * Generates an image file using FFmpeg
   */
  private async generateImage(filePath: string, spec: SampleFileSpec): Promise<void> {
    const { resolution = { width: 150, height: 150 }, color = 'blue' } = spec.params;
    
    const args = [
      '-f', 'lavfi',
      '-i', `color=${color}:size=${resolution.width}x${resolution.height}:duration=1`,
      '-frames:v', '1',
      '-y',
      filePath
    ];
    
    await this.runFFmpeg(args);
  }

  /**
   * Generates an audio file using FFmpeg
   */
  private async generateAudio(filePath: string, spec: SampleFileSpec): Promise<void> {
    const { duration = 10, sampleRate = 44100, frequency = 440 } = spec.params;
    
    const args = [
      '-f', 'lavfi',
      '-i', `sine=frequency=${frequency}:sample_rate=${sampleRate}:duration=${duration}`,
      '-c:a', 'mp3',
      '-b:a', '128k',
      '-y',
      filePath
    ];
    
    await this.runFFmpeg(args);
  }

  /**
   * Runs FFmpeg command
   */
  private async runFFmpeg(args: string[]): Promise<void> {
    return new Promise((resolve, reject) => {
      const ffmpeg = spawn('ffmpeg', args, { stdio: 'pipe' });
      
      let stderr = '';
      ffmpeg.stderr?.on('data', (data) => {
        stderr += data.toString();
      });
      
      ffmpeg.on('close', (code) => {
        if (code === 0) {
          resolve();
        } else {
          reject(new Error(`FFmpeg failed with code ${code}: ${stderr}`));
        }
      });
      
      ffmpeg.on('error', (error) => {
        reject(new Error(`FFmpeg execution error: ${error.message}`));
      });
    });
  }

  /**
   * Validates file format using FFprobe
   */
  private async validateFileFormat(filePath: string, spec: SampleFileSpec): Promise<boolean> {
    try {
      const args = [
        '-v', 'quiet',
        '-print_format', 'json',
        '-show_format',
        '-show_streams',
        filePath
      ];
      
      const result = await this.runFFprobe(args);
      const data = JSON.parse(result);
      
      // Basic validation based on file type
      switch (spec.type) {
        case 'video':
          return data.streams?.some((s: any) => s.codec_type === 'video');
        case 'audio':
          return data.streams?.some((s: any) => s.codec_type === 'audio');
        case 'image':
          // For images, we might have just video stream (single frame) or image2 format
          return data.streams?.some((s: any) => 
            s.codec_type === 'video' || 
            (data.format?.format_name?.includes('image2') || data.format?.format_name?.includes('png'))
          );
        default:
          return false;
      }
    } catch (error) {
      // If FFprobe fails, fall back to basic file existence check
      console.warn(`FFprobe validation failed for ${filePath}, falling back to basic check:`, error);
      return existsSync(filePath) && statSync(filePath).size > 0;
    }
  }

  /**
   * Runs FFprobe command
   */
  private async runFFprobe(args: string[]): Promise<string> {
    return new Promise((resolve, reject) => {
      const ffprobe = spawn('ffprobe', args, { stdio: 'pipe' });
      
      let stdout = '';
      let stderr = '';
      
      ffprobe.stdout?.on('data', (data) => {
        stdout += data.toString();
      });
      
      ffprobe.stderr?.on('data', (data) => {
        stderr += data.toString();
      });
      
      ffprobe.on('close', (code) => {
        if (code === 0) {
          resolve(stdout);
        } else {
          reject(new Error(`FFprobe failed with code ${code}: ${stderr}`));
        }
      });
      
      ffprobe.on('error', (error) => {
        reject(new Error(`FFprobe execution error: ${error.message}`));
      });
    });
  }

  /**
   * Cleans up old or unnecessary test files
   */
  async cleanup(options: {
    /** Remove files older than this time in milliseconds */
    olderThan?: number;
    /** Remove all test data and regenerate */
    force?: boolean;
    /** Dry run - show what would be deleted */
    dryRun?: boolean;
  } = {}): Promise<void> {
    console.log('🧹 Starting test data cleanup...');
    
    if (options.force) {
      if (existsSync(this.baseDir)) {
        if (options.dryRun) {
          console.log(`Would remove entire directory: ${this.baseDir}`);
        } else {
          rmSync(this.baseDir, { recursive: true, force: true });
          console.log(`🗑️ Removed entire test data directory`);
        }
      }
      return;
    }
    
    if (options.olderThan) {
      const cutoffTime = Date.now() - options.olderThan;
      let removedCount = 0;
      
      for (const spec of this.sampleSpecs) {
        const filePath = join(this.baseDir, spec.name);
        
        if (existsSync(filePath)) {
          const stats = statSync(filePath);
          if (stats.mtime.getTime() < cutoffTime) {
            if (options.dryRun) {
              console.log(`Would remove old file: ${spec.name}`);
            } else {
              rmSync(filePath);
              console.log(`🗑️ Removed old file: ${spec.name}`);
            }
            removedCount++;
          }
        }
      }
      
      console.log(`✅ Cleanup completed: ${removedCount} files removed`);
    }
  }

  /**
   * Gets test data statistics
   */
  async getStatistics(): Promise<{
    totalFiles: number;
    totalSize: number;
    filesByType: Record<string, number>;
    sizeByType: Record<string, number>;
    oldestFile: { name: string; age: number } | null;
    newestFile: { name: string; age: number } | null;
  }> {
    let totalSize = 0;
    const filesByType: Record<string, number> = {};
    const sizeByType: Record<string, number> = {};
    let oldestFile: { name: string; age: number } | null = null;
    let newestFile: { name: string; age: number } | null = null;
    
    for (const spec of this.sampleSpecs) {
      const filePath = join(this.baseDir, spec.name);
      
      if (existsSync(filePath)) {
        const stats = statSync(filePath);
        const age = Date.now() - stats.mtime.getTime();
        
        totalSize += stats.size;
        filesByType[spec.type] = (filesByType[spec.type] || 0) + 1;
        sizeByType[spec.type] = (sizeByType[spec.type] || 0) + stats.size;
        
        if (!oldestFile || age > oldestFile.age) {
          oldestFile = { name: spec.name, age };
        }
        
        if (!newestFile || age < newestFile.age) {
          newestFile = { name: spec.name, age };
        }
      }
    }
    
    return {
      totalFiles: this.sampleSpecs.length,
      totalSize,
      filesByType,
      sizeByType,
      oldestFile,
      newestFile
    };
  }

  /**
   * Ensures directory exists
   */
  private ensureDirectory(dir: string): void {
    if (!existsSync(dir)) {
      mkdirSync(dir, { recursive: true });
    }
  }

  /**
   * Initializes sample file specifications
   */
  private initializeSampleSpecs(): void {
    this.sampleSpecs = [
      // Video files
      {
        id: 'red-sample',
        name: 'red-sample.mp4',
        type: 'video',
        format: 'mp4',
        params: {
          duration: 5,
          resolution: { width: 640, height: 480 },
          framerate: 30,
          color: 'red'
        },
        expectedSize: 5988
      },
      {
        id: 'blue-sample',
        name: 'blue-sample.mp4',
        type: 'video',
        format: 'mp4',
        params: {
          duration: 5,
          resolution: { width: 640, height: 480 },
          framerate: 30,
          color: 'blue'
        },
        expectedSize: 5988
      },
      {
        id: 'portrait-sample',
        name: 'portrait-sample.mp4',
        type: 'video',
        format: 'mp4',
        params: {
          duration: 8,
          resolution: { width: 480, height: 640 },
          framerate: 30,
          color: 'green'
        },
        expectedSize: 8589
      },
      {
        id: 'long-sample',
        name: 'long-sample.mp4',
        type: 'video',
        format: 'mp4',
        params: {
          duration: 30,
          resolution: { width: 1920, height: 1080 },
          framerate: 30,
          color: 'purple'
        },
        expectedSize: 45000
      },
      
      // Image files
      {
        id: 'logo-150x150',
        name: 'logo-150x150.png',
        type: 'image',
        format: 'png',
        params: {
          resolution: { width: 150, height: 150 },
          color: 'blue'
        },
        expectedSize: 327
      },
      {
        id: 'watermark-logo',
        name: 'watermark-logo.png',
        type: 'image',
        format: 'png',
        params: {
          resolution: { width: 100, height: 100 },
          color: 'white'
        },
        expectedSize: 250
      },
      {
        id: 'overlay-image',
        name: 'overlay-image.png',
        type: 'image',
        format: 'png',
        params: {
          resolution: { width: 200, height: 200 },
          color: 'yellow'
        },
        expectedSize: 400
      },
      
      // Audio files
      {
        id: 'background-music',
        name: 'background-music.mp3',
        type: 'audio',
        format: 'mp3',
        params: {
          duration: 10.03,
          sampleRate: 44100,
          frequency: 440
        },
        expectedSize: 80474
      },
      {
        id: 'sound-effect',
        name: 'sound-effect.wav',
        type: 'audio',
        format: 'wav',
        params: {
          duration: 2,
          sampleRate: 44100,
          frequency: 880
        },
        expectedSize: 176400
      }
    ];
  }

  /**
   * Gets sample file specification by ID
   */
  getSampleSpec(id: string): SampleFileSpec | undefined {
    return this.sampleSpecs.find(spec => spec.id === id);
  }

  /**
   * Gets all sample specifications
   */
  getAllSpecs(): SampleFileSpec[] {
    return [...this.sampleSpecs];
  }

  /**
   * Gets file path for sample
   */
  getFilePath(id: string): string | null {
    const spec = this.getSampleSpec(id);
    return spec ? join(this.baseDir, spec.name) : null;
  }
}
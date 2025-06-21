/**
 * TEST CLEANUP UTILITIES
 * 
 * Utility functions for cleaning up media assets generated during test runs
 * Supports cleaning .mp4, .mp3, .png, .jpg, .webm, .mov, .avi files and more
 */

import { existsSync, readdirSync, statSync, unlinkSync, rmdirSync, mkdirSync } from 'fs';
import { join, extname, dirname } from 'path';

export interface CleanupOptions {
  /** Directories to clean */
  directories?: string[];
  /** File extensions to remove (with or without dots) */
  extensions?: string[];
  /** Whether to remove empty directories after cleanup */
  removeEmptyDirs?: boolean;
  /** Whether to preserve certain files (like test assets) */
  preserveTestAssets?: boolean;
  /** Maximum age of files to clean (in milliseconds) */
  maxAge?: number;
  /** Dry run - log what would be deleted without actually deleting */
  dryRun?: boolean;
  /** Verbose logging */
  verbose?: boolean;
}

export interface CleanupResult {
  filesRemoved: string[];
  dirsRemoved: string[];
  totalSize: number;
  errors: string[];
  skipped: string[];
}

/**
 * Test Media Cleanup Utility
 */
export class TestMediaCleanup {
  private static readonly DEFAULT_MEDIA_EXTENSIONS = [
    // Video formats
    '.mp4', '.mov', '.avi', '.mkv', '.webm', '.flv', '.wmv', '.m4v',
    // Audio formats
    '.mp3', '.wav', '.aac', '.ogg', '.flac', '.m4a', '.wma',
    // Image formats
    '.png', '.jpg', '.jpeg', '.gif', '.bmp', '.tiff', '.webp', '.svg',
    // Other media
    '.pdf', '.psd', '.ai', '.eps'
  ];

  private static readonly DEFAULT_OUTPUT_DIRS = [
    'output',
    'temp',
    'tmp',
    'test-output',
    'generated',
    'renders',
    'exports'
  ];

  private static readonly PRESERVE_PATTERNS = [
    'bunny.mp4',
    'logo-150x150.png',
    'test-asset',
    'sample-',
    'demo-',
    'assets/',
    'fixtures/'
  ];

  /**
   * Clean up all test-generated media files
   */
  static async cleanupTestMedia(options: CleanupOptions = {}): Promise<CleanupResult> {
    const {
      directories = this.DEFAULT_OUTPUT_DIRS,
      extensions = this.DEFAULT_MEDIA_EXTENSIONS,
      removeEmptyDirs = true,
      preserveTestAssets = true,
      maxAge,
      dryRun = false,
      verbose = false
    } = options;

    const result: CleanupResult = {
      filesRemoved: [],
      dirsRemoved: [],
      totalSize: 0,
      errors: [],
      skipped: []
    };

    if (verbose) {
      console.log('🧹 Starting test media cleanup...');
      console.log(`📁 Directories: ${directories.join(', ')}`);
      console.log(`📄 Extensions: ${extensions.join(', ')}`);
      console.log(`🔒 Preserve assets: ${preserveTestAssets}`);
      console.log(`🏃 Dry run: ${dryRun}`);
    }

    // Normalize extensions (ensure they start with dots)
    const normalizedExtensions = extensions.map(ext => 
      ext.startsWith('.') ? ext : `.${ext}`
    );

    // Process each directory
    for (const dir of directories) {
      try {
        await this.cleanupDirectory(
          dir, 
          normalizedExtensions, 
          result, 
          {
            preserveTestAssets,
            maxAge,
            dryRun,
            verbose
          }
        );
      } catch (error) {
        result.errors.push(`Failed to process directory ${dir}: ${error}`);
        if (verbose) {
          console.error(`❌ Error processing ${dir}:`, error);
        }
      }
    }

    // Remove empty directories if requested
    if (removeEmptyDirs && !dryRun) {
      for (const dir of directories) {
        try {
          await this.removeEmptyDirectories(dir, result, verbose);
        } catch (error) {
          result.errors.push(`Failed to remove empty directories in ${dir}: ${error}`);
        }
      }
    }

    if (verbose) {
      this.logCleanupSummary(result, dryRun);
    }

    return result;
  }

  /**
   * Clean up files in a specific directory
   */
  private static async cleanupDirectory(
    dirPath: string,
    extensions: string[],
    result: CleanupResult,
    options: {
      preserveTestAssets?: boolean;
      maxAge?: number;
      dryRun?: boolean;
      verbose?: boolean;
    }
  ): Promise<void> {
    if (!existsSync(dirPath)) {
      if (options.verbose) {
        console.log(`📁 Directory ${dirPath} does not exist, skipping...`);
      }
      return;
    }

    const files = readdirSync(dirPath);
    
    for (const file of files) {
      const filePath = join(dirPath, file);
      
      try {
        const stats = statSync(filePath);
        
        if (stats.isDirectory()) {
          // Recursively process subdirectories
          await this.cleanupDirectory(filePath, extensions, result, options);
        } else if (stats.isFile()) {
          await this.processFile(filePath, extensions, result, options, stats);
        }
      } catch (error) {
        result.errors.push(`Failed to process ${filePath}: ${error}`);
        if (options.verbose) {
          console.error(`❌ Error processing ${filePath}:`, error);
        }
      }
    }
  }

  /**
   * Process an individual file for cleanup
   */
  private static async processFile(
    filePath: string,
    extensions: string[],
    result: CleanupResult,
    options: {
      preserveTestAssets?: boolean;
      maxAge?: number;
      dryRun?: boolean;
      verbose?: boolean;
    },
    stats: any
  ): Promise<void> {
    const fileExt = extname(filePath).toLowerCase();
    
    // Check if file extension matches cleanup criteria
    if (!extensions.includes(fileExt)) {
      return;
    }

    // Check if file should be preserved
    if (options.preserveTestAssets && this.shouldPreserveFile(filePath)) {
      result.skipped.push(filePath);
      if (options.verbose) {
        console.log(`⚠️ Preserving test asset: ${filePath}`);
      }
      return;
    }

    // Check file age if maxAge is specified
    if (options.maxAge && this.isFileYoungerThan(stats, options.maxAge)) {
      result.skipped.push(filePath);
      if (options.verbose) {
        console.log(`⏰ File too recent, skipping: ${filePath}`);
      }
      return;
    }

    // Remove the file
    try {
      if (!options.dryRun) {
        unlinkSync(filePath);
      }
      
      result.filesRemoved.push(filePath);
      result.totalSize += stats.size;
      
      if (options.verbose) {
        const sizeStr = this.formatFileSize(stats.size);
        const status = options.dryRun ? '[DRY RUN]' : '';
        console.log(`🗑️ ${status} Removed: ${filePath} (${sizeStr})`);
      }
    } catch (error) {
      result.errors.push(`Failed to remove ${filePath}: ${error}`);
      if (options.verbose) {
        console.error(`❌ Failed to remove ${filePath}:`, error);
      }
    }
  }

  /**
   * Check if a file should be preserved based on patterns
   */
  private static shouldPreserveFile(filePath: string): boolean {
    const fileName = filePath.toLowerCase();
    
    return this.PRESERVE_PATTERNS.some(pattern => 
      fileName.includes(pattern.toLowerCase())
    );
  }

  /**
   * Check if file is younger than specified age
   */
  private static isFileYoungerThan(stats: any, maxAge: number): boolean {
    const fileAge = Date.now() - stats.mtime.getTime();
    return fileAge < maxAge;
  }

  /**
   * Remove empty directories recursively
   */
  private static async removeEmptyDirectories(
    dirPath: string,
    result: CleanupResult,
    verbose?: boolean
  ): Promise<void> {
    if (!existsSync(dirPath)) {
      return;
    }

    try {
      const files = readdirSync(dirPath);
      
      // Process subdirectories first
      for (const file of files) {
        const filePath = join(dirPath, file);
        const stats = statSync(filePath);
        
        if (stats.isDirectory()) {
          await this.removeEmptyDirectories(filePath, result, verbose);
        }
      }

      // Check if directory is now empty
      const remainingFiles = readdirSync(dirPath);
      if (remainingFiles.length === 0) {
        rmdirSync(dirPath);
        result.dirsRemoved.push(dirPath);
        
        if (verbose) {
          console.log(`📁 Removed empty directory: ${dirPath}`);
        }
      }
    } catch (error) {
      result.errors.push(`Failed to remove directory ${dirPath}: ${error}`);
    }
  }

  /**
   * Format file size for human readable display
   */
  private static formatFileSize(bytes: number): string {
    const units = ['B', 'KB', 'MB', 'GB', 'TB'];
    let size = bytes;
    let unitIndex = 0;
    
    while (size >= 1024 && unitIndex < units.length - 1) {
      size /= 1024;
      unitIndex++;
    }
    
    return `${size.toFixed(1)} ${units[unitIndex]}`;
  }

  /**
   * Log cleanup summary
   */
  private static logCleanupSummary(result: CleanupResult, dryRun: boolean): void {
    const status = dryRun ? '[DRY RUN] Would have' : '';
    
    console.log('\n📊 Cleanup Summary:');
    console.log(`🗑️ ${status} Files removed: ${result.filesRemoved.length}`);
    console.log(`📁 ${status} Directories removed: ${result.dirsRemoved.length}`);
    console.log(`💾 ${status} Total size freed: ${this.formatFileSize(result.totalSize)}`);
    console.log(`⚠️ Files skipped: ${result.skipped.length}`);
    console.log(`❌ Errors: ${result.errors.length}`);
    
    if (result.errors.length > 0) {
      console.log('\n❌ Errors encountered:');
      result.errors.forEach(error => console.log(`   ${error}`));
    }
    
    if (result.skipped.length > 0 && result.skipped.length < 10) {
      console.log('\n⚠️ Skipped files:');
      result.skipped.forEach(file => console.log(`   ${file}`));
    }
  }

  /**
   * Quick cleanup for common test scenarios
   */
  static async quickCleanup(verbose = false): Promise<CleanupResult> {
    return this.cleanupTestMedia({
      directories: ['output', 'temp'],
      extensions: ['.mp4', '.mp3', '.png', '.jpg'],
      preserveTestAssets: true,
      removeEmptyDirs: true,
      verbose
    });
  }

  /**
   * Aggressive cleanup - removes everything
   */
  static async aggressiveCleanup(verbose = false): Promise<CleanupResult> {
    return this.cleanupTestMedia({
      directories: this.DEFAULT_OUTPUT_DIRS,
      extensions: this.DEFAULT_MEDIA_EXTENSIONS,
      preserveTestAssets: false,
      removeEmptyDirs: true,
      verbose
    });
  }

  /**
   * Clean up only recent files (last hour)
   */
  static async cleanupRecent(verbose = false): Promise<CleanupResult> {
    return this.cleanupTestMedia({
      maxAge: 60 * 60 * 1000, // 1 hour
      verbose
    });
  }

  /**
   * Dry run cleanup - see what would be deleted
   */
  static async dryRunCleanup(): Promise<CleanupResult> {
    return this.cleanupTestMedia({
      dryRun: true,
      verbose: true
    });
  }

  /**
   * Create output directories if they don't exist
   */
  static ensureOutputDirectories(dirs: string[] = ['output', 'output/validation']): void {
    dirs.forEach(dir => {
      if (!existsSync(dir)) {
        mkdirSync(dir, { recursive: true });
        console.log(`📁 Created directory: ${dir}`);
      }
    });
  }

  /**
   * Clean up specific file types only
   */
  static async cleanupByType(
    fileType: 'video' | 'audio' | 'image' | 'all',
    verbose = false
  ): Promise<CleanupResult> {
    let extensions: string[];
    
    switch (fileType) {
      case 'video':
        extensions = ['.mp4', '.mov', '.avi', '.mkv', '.webm', '.flv'];
        break;
      case 'audio':
        extensions = ['.mp3', '.wav', '.aac', '.ogg', '.flac', '.m4a'];
        break;
      case 'image':
        extensions = ['.png', '.jpg', '.jpeg', '.gif', '.bmp', '.webp'];
        break;
      case 'all':
      default:
        extensions = this.DEFAULT_MEDIA_EXTENSIONS;
        break;
    }

    return this.cleanupTestMedia({
      extensions,
      verbose
    });
  }
}

/**
 * Cleanup hook for test suites
 */
export function createCleanupHook(options: CleanupOptions = {}) {
  return {
    async beforeAll() {
      // Ensure output directories exist
      TestMediaCleanup.ensureOutputDirectories();
    },
    
    async afterAll() {
      // Clean up generated files
      const result = await TestMediaCleanup.cleanupTestMedia({
        verbose: false,
        ...options
      });
      
      if (result.filesRemoved.length > 0) {
        console.log(`🧹 Cleaned up ${result.filesRemoved.length} test files`);
      }
    },
    
    async beforeEach() {
      // Optional: Clean up before each test
    },
    
    async afterEach() {
      // Optional: Clean up after each test
    }
  };
}

/**
 * Global cleanup function for CI/CD environments
 */
export async function globalTestCleanup(): Promise<void> {
  console.log('🌍 Running global test cleanup...');
  
  const result = await TestMediaCleanup.cleanupTestMedia({
    directories: [
      'output',
      'temp', 
      'tmp',
      'test-output',
      'generated',
      'renders',
      'exports',
      'dist/test',
      'build/test'
    ],
    extensions: TestMediaCleanup['DEFAULT_MEDIA_EXTENSIONS'],
    preserveTestAssets: true,
    removeEmptyDirs: true,
    verbose: true
  });
  
  console.log('✅ Global test cleanup completed');
  
  if (result.errors.length > 0) {
    console.warn('⚠️ Some cleanup errors occurred:', result.errors);
  }
}

// Export for use in package.json scripts
if (import.meta.main) {
  // Command line usage
  const args = process.argv.slice(2);
  const command = args[0] || 'quick';
  
  switch (command) {
    case 'quick':
      TestMediaCleanup.quickCleanup(true);
      break;
    case 'aggressive':
      TestMediaCleanup.aggressiveCleanup(true);
      break;
    case 'recent':
      TestMediaCleanup.cleanupRecent(true);
      break;
    case 'dry-run':
      TestMediaCleanup.dryRunCleanup();
      break;
    case 'global':
      globalTestCleanup();
      break;
    default:
      console.log('Usage: bun test-cleanup-utils.ts [quick|aggressive|recent|dry-run|global]');
  }
}
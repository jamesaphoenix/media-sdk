/**
 * Enhanced Bun cassette manager with dependency tracking
 */

import { writeFileSync, readFileSync, existsSync, mkdirSync, statSync } from 'fs';
import { join, resolve } from 'path';
import { CassetteDependencyTracker } from './dependency-tracker';

export interface CassetteInteraction {
  id: string;
  command: string;
  result: ExecutionResult;
  timestamp: string;
  runtime: 'bun';
}

export interface ExecutionResult {
  success: boolean;
  exitCode?: number;
  stdout: string;
  stderr: string;
  duration: number;
  command: string;
  fileSize?: number;
}

export interface CassetteMetadata {
  created: string;
  runtime: string;
  bunVersion: string;
  sdk_version: string;
  dependencies?: {
    files: string[];
    lastChecked: string;
  };
}

export interface EnhancedCassetteData {
  name: string;
  interactions: CassetteInteraction[];
  meta: CassetteMetadata;
}

export class EnhancedBunCassetteManager {
  private cassetteName: string;
  private cassettePath: string;
  private mode: 'record' | 'replay' | 'auto';
  private interactions: EnhancedCassetteData;
  private dependencyTracker: CassetteDependencyTracker;
  private trackedFiles: Set<string>;
  private autoInvalidate: boolean;

  constructor(
    cassetteName: string, 
    options: {
      mode?: 'record' | 'replay' | 'auto';
      trackedFiles?: string[];
      autoInvalidate?: boolean;
    } = {}
  ) {
    this.cassetteName = cassetteName;
    this.cassettePath = join('cassettes', `${cassetteName}.json`);
    this.mode = options.mode || (process.env.CASSETTE_MODE as 'record' | 'replay' | 'auto') || 'auto';
    this.autoInvalidate = options.autoInvalidate ?? true;
    this.trackedFiles = new Set(options.trackedFiles || []);
    
    // Initialize dependency tracker
    this.dependencyTracker = new CassetteDependencyTracker();
    
    // Load cassette and check if it needs invalidation
    this.interactions = this.loadCassette();
    
    // Register tracked files with dependency tracker
    if (this.trackedFiles.size > 0) {
      this.dependencyTracker.registerCassette(cassetteName, Array.from(this.trackedFiles));
    }
    
    // In auto mode, check if we need to invalidate
    if (this.mode === 'auto' && this.autoInvalidate) {
      if (this.shouldInvalidate()) {
        console.log(`🔄 Cassette "${cassetteName}" invalidated due to dependency changes. Switching to record mode.`);
        this.mode = 'record';
        this.interactions.interactions = [];
        this.updateDependencies();
      } else {
        this.mode = 'replay';
      }
    }
  }

  /**
   * Add files to track for this cassette
   */
  public trackFiles(files: string[]): void {
    for (const file of files) {
      this.trackedFiles.add(resolve(file));
    }
    
    // Re-register with dependency tracker
    this.dependencyTracker.registerCassette(this.cassetteName, Array.from(this.trackedFiles));
    this.updateDependencies();
  }

  /**
   * Check if the cassette should be invalidated
   */
  private shouldInvalidate(): boolean {
    // If no cassette exists, we need to record
    if (!existsSync(this.cassettePath)) {
      return true;
    }
    
    // Check cassette file modification time
    const cassetteStats = statSync(this.cassettePath);
    const cassetteMtime = cassetteStats.mtimeMs;
    
    // Check if any tracked dependencies have changed
    if (this.interactions.meta.dependencies) {
      const lastChecked = new Date(this.interactions.meta.dependencies.lastChecked).getTime();
      
      // If cassette was modified after last dependency check, it's fresh
      if (cassetteMtime > lastChecked) {
        return false;
      }
    }
    
    // Use dependency tracker to check for changes
    return this.dependencyTracker.shouldInvalidateCassette(this.cassetteName);
  }

  /**
   * Update dependency information in cassette metadata
   */
  private updateDependencies(): void {
    const allDeps = new Set<string>();
    
    // Collect all dependencies for tracked files
    for (const file of this.trackedFiles) {
      allDeps.add(file);
      const deps = this.dependencyTracker.getStats();
      // Note: In a real implementation, we'd get specific deps for this file
    }
    
    this.interactions.meta.dependencies = {
      files: Array.from(allDeps),
      lastChecked: new Date().toISOString()
    };
  }

  private loadCassette(): EnhancedCassetteData {
    if (existsSync(this.cassettePath)) {
      const content = readFileSync(this.cassettePath, 'utf8');
      return JSON.parse(content);
    }
    
    return {
      name: this.cassetteName,
      interactions: [],
      meta: {
        created: new Date().toISOString(),
        runtime: 'bun',
        bunVersion: Bun.version,
        sdk_version: '1.0.0'
      }
    };
  }

  private saveCassette() {
    const dir = 'cassettes';
    if (!existsSync(dir)) {
      mkdirSync(dir, { recursive: true });
    }
    
    // Update dependencies before saving
    if (this.trackedFiles.size > 0) {
      this.updateDependencies();
    }
    
    writeFileSync(this.cassettePath, JSON.stringify(this.interactions, null, 2));
  }

  async executeCommand(command: string, options: { cwd?: string } = {}): Promise<ExecutionResult> {
    const commandKey = this.normalizeCommand(command);
    
    if (this.mode === 'record') {
      return await this.recordExecution(commandKey, command, options);
    } else {
      return this.replayExecution(commandKey);
    }
  }

  private async recordExecution(commandKey: string, originalCommand: string, options: { cwd?: string }): Promise<ExecutionResult> {
    console.log(`🎬 Recording: ${commandKey}`);
    const startTime = Date.now();
    
    try {
      const args = originalCommand.split(' ').slice(1);
      
      const proc = Bun.spawn(['ffmpeg', ...args], {
        cwd: options.cwd,
        stdout: 'pipe',
        stderr: 'pipe'
      });

      const stdout = proc.stdout ? await new Response(proc.stdout).text() : "";
      const stderr = proc.stderr ? await new Response(proc.stderr).text() : "";
      const exitCode = await proc.exited;
      const duration = Date.now() - startTime;

      const result: ExecutionResult = {
        success: exitCode === 0,
        exitCode,
        stdout,
        stderr,
        duration,
        command: commandKey
      };

      this.recordInteraction(commandKey, result);
      
      if (result.success) {
        console.log(`  ✅ Recorded successfully (${duration}ms)`);
      } else {
        console.log(`  ❌ Recorded failure (${duration}ms)`);
      }
      
      return result;

    } catch (error: any) {
      const duration = Date.now() - startTime;
      const result: ExecutionResult = {
        success: false,
        stdout: '',
        stderr: error.message,
        duration,
        command: commandKey
      };

      this.recordInteraction(commandKey, result);
      console.log(`  💥 Recorded error: ${error.message}`);
      return result;
    }
  }

  private replayExecution(commandKey: string): ExecutionResult {
    const interaction = this.interactions.interactions.find(
      i => i.command === commandKey
    );
    
    if (!interaction) {
      throw new Error(`No cassette interaction found for command: ${commandKey}`);
    }
    
    console.log(`🎭 Replaying: ${commandKey}`);
    
    return new Promise(resolve => {
      setTimeout(() => {
        console.log(`  ${interaction.result.success ? '✅' : '❌'} Replayed (${interaction.result.duration}ms)`);
        resolve(interaction.result);
      }, Math.min(100, interaction.result.duration / 10));
    }) as any;
  }

  private recordInteraction(commandKey: string, result: ExecutionResult) {
    const interaction: CassetteInteraction = {
      id: this.generateId(),
      command: commandKey,
      result,
      timestamp: new Date().toISOString(),
      runtime: 'bun'
    };

    this.interactions.interactions.push(interaction);
    this.saveCassette();
  }

  private normalizeCommand(command: string): string {
    return command
      .replace(/\s+/g, ' ')
      .trim()
      .replace(/sample-files\/[^"\s]+/g, 'SAMPLE_FILE')
      .replace(/output\/[^"\s]+/g, 'OUTPUT_FILE')
      .replace(/'/g, '"');
  }

  private generateId(): string {
    return Math.random().toString(36).substr(2, 9);
  }

  /**
   * Get cassette statistics including dependency information
   */
  getStats() {
    const depStats = this.dependencyTracker.getStats();
    
    return {
      name: this.cassetteName,
      interactions: this.interactions.interactions.length,
      mode: this.mode,
      runtime: 'bun',
      bunVersion: this.interactions.meta.bunVersion,
      path: this.cassettePath,
      dependencies: {
        trackedFiles: this.trackedFiles.size,
        totalDependencies: depStats.totalFiles,
        ...depStats
      }
    };
  }

  /**
   * Get files that would cause this cassette to be invalidated if changed
   */
  getTrackedDependencies(): string[] {
    const allDeps = new Set<string>();
    
    for (const file of this.trackedFiles) {
      allDeps.add(file);
      // Get transitive dependencies
      const deps = this.dependencyTracker.getStats();
      // Note: In real implementation, we'd get specific deps
    }
    
    return Array.from(allDeps);
  }

  /**
   * Force invalidation of the cassette
   */
  invalidate(): void {
    console.log(`🗑️  Invalidating cassette "${this.cassetteName}"`);
    this.interactions.interactions = [];
    this.mode = 'record';
    this.saveCassette();
  }

  async cleanup() {
    console.log('🧹 Cleaning up enhanced cassette manager...');
    // Additional cleanup if needed
  }
}

/**
 * Enhanced mock executor with dependency tracking
 */
export class EnhancedBunMockExecutor {
  private cassette: EnhancedBunCassetteManager;

  constructor(
    cassetteName: string, 
    options: {
      mode?: 'record' | 'replay' | 'auto';
      trackedFiles?: string[];
      autoInvalidate?: boolean;
    } = {}
  ) {
    this.cassette = new EnhancedBunCassetteManager(cassetteName, options);
  }

  async execute(command: string, options: { cwd?: string } = {}): Promise<ExecutionResult> {
    return this.cassette.executeCommand(command, options);
  }

  trackFiles(files: string[]): void {
    this.cassette.trackFiles(files);
  }

  getStats() {
    return this.cassette.getStats();
  }

  getTrackedDependencies(): string[] {
    return this.cassette.getTrackedDependencies();
  }

  invalidate(): void {
    this.cassette.invalidate();
  }

  async cleanup() {
    await this.cassette.cleanup();
  }
}
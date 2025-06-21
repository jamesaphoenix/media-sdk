/**
 * Bun-optimized cassette manager for Media SDK testing
 */

import { writeFileSync, readFileSync, existsSync, mkdirSync } from 'fs';
import { join } from 'path';
import { EnhancedBunCassetteManager } from './enhanced-cassette-manager.js';

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

export class BunCassetteManager {
  private cassetteName: string;
  private cassettePath: string;
  private mode: 'record' | 'replay';
  private interactions: {
    name: string;
    interactions: CassetteInteraction[];
    meta: {
      created: string;
      runtime: string;
      bunVersion: string;
      sdk_version: string;
    };
  };

  constructor(cassetteName: string) {
    this.cassetteName = cassetteName;
    this.cassettePath = join('cassettes', `${cassetteName}.json`);
    this.mode = (process.env.CASSETTE_MODE as 'record' | 'replay') || 'replay';
    this.interactions = this.loadCassette();
  }

  private loadCassette() {
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
    writeFileSync(this.cassettePath, JSON.stringify(this.interactions, null, 2));
  }

  async executeCommand(command: string, options: { cwd?: string } = {}): Promise<ExecutionResult> {
    const commandKey = this.normalizeCommand(command);
    
    if (this.mode === 'record') {
      // Pass both the normalized key and the original command
      return await this.recordExecution(commandKey, command, options);
    } else {
      return this.replayExecution(commandKey);
    }
  }

  private async recordExecution(commandKey: string, originalCommand: string, options: { cwd?: string }): Promise<ExecutionResult> {
    console.log(`🎬 Recording: ${commandKey}`);
    const startTime = Date.now();
    
    try {
      // Parse FFmpeg command - use the ORIGINAL command for actual execution
      const args = originalCommand.split(' ').slice(1); // Remove 'ffmpeg'
      
      // Execute with Bun's spawn using the original command
      const proc = Bun.spawn(['ffmpeg', ...args], {
        cwd: options.cwd,
        stdout: 'pipe',
        stderr: 'pipe'
      });

      // Collect output
      const stdout = proc.stdout && typeof proc.stdout !== 'number' ? await new Response(proc.stdout).text() : '';
      const stderr = proc.stderr && typeof proc.stderr !== 'number' ? await new Response(proc.stderr).text() : '';
      const exitCode = await proc.exited;
      const duration = Date.now() - startTime;

      const result: ExecutionResult = {
        success: exitCode === 0,
        exitCode,
        stdout,
        stderr,
        duration,
        command: commandKey // Store the normalized key for cassette matching
      };

      // Record the interaction with the normalized key
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
        command: commandKey // Store the normalized key for cassette matching
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
    
    // Simulate some delay for realism
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
      // Replace file paths with placeholders
      .replace(/sample-files\/[^"\s]+/g, 'SAMPLE_FILE')
      .replace(/output\/[^"\s]+/g, 'OUTPUT_FILE')
      // Normalize quotes
      .replace(/'/g, '"');
  }

  private generateId(): string {
    return Math.random().toString(36).substr(2, 9);
  }

  getStats() {
    return {
      name: this.cassetteName,
      interactions: this.interactions.interactions.length,
      mode: this.mode,
      runtime: 'bun',
      bunVersion: this.interactions.meta.bunVersion,
      path: this.cassettePath
    };
  }

  async cleanup() {
    // Clean up any temporary files
    console.log('🧹 Cleaning up cassette manager...');
  }
}

/**
 * Bun-optimized mock executor for testing
 */
export class BunMockExecutor {
  private cassette: EnhancedBunCassetteManager;

  constructor(cassetteName: string) {
    this.cassette = new EnhancedBunCassetteManager(cassetteName);
  }

  async execute(command: string, options: { cwd?: string } = {}): Promise<ExecutionResult> {
    return this.cassette.executeCommand(command, options);
  }

  getStats() {
    return this.cassette.getStats();
  }

  async cleanup() {
    await this.cassette.cleanup();
  }
}
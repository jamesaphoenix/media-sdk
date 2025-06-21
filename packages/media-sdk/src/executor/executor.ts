import { EventEmitter } from 'events';
import { spawn, ChildProcess } from 'child_process';
import type { ExecutionResult, ProgressInfo } from '../types/index.js';

export interface ExecutorOptions {
  ffmpegPath?: string;
  timeout?: number;
  maxBuffer?: number;
  env?: Record<string, string>;
}

export interface ExecuteOptions {
  timeout?: number;
  cwd?: string;
  env?: Record<string, string>;
  input?: NodeJS.ReadableStream;
  output?: NodeJS.WritableStream;
  signal?: AbortSignal;
  stream?: boolean;
}

export class FFmpegError extends Error {
  constructor(
    message: string,
    public code: string,
    public exitCode?: number,
    public stderr?: string
  ) {
    super(message);
    this.name = 'FFmpegError';
  }
}

/**
 * FFmpeg executor with progress tracking, cancellation, and error handling
 */
export class FFmpegExecutor extends EventEmitter {
  private currentProcess: ChildProcess | null = null;
  private options: ExecutorOptions;

  constructor(options: ExecutorOptions = {}) {
    super();
    this.options = {
      ffmpegPath: 'ffmpeg',
      timeout: 120000, // 2 minutes default
      maxBuffer: 200 * 1024 * 1024, // 200MB
      ...options
    };
  }

  /**
   * Execute an FFmpeg command
   */
  async execute(command: string, options: ExecuteOptions = {}): Promise<ExecutionResult> {
    const startTime = Date.now();
    
    // Parse command into arguments
    const args = this.parseCommand(command);
    
    return new Promise((resolve, reject) => {
      let stdout = '';
      let stderr = '';
      let cancelled = false;

      // Create child process
      this.currentProcess = spawn(this.options.ffmpegPath!, args, {
        cwd: options.cwd,
        env: { ...process.env, ...this.options.env, ...options.env },
        stdio: ['pipe', 'pipe', 'pipe']
      });

      const childProcess = this.currentProcess;

      // Handle cancellation
      const handleCancel = () => {
        cancelled = true;
        this.cancel();
        reject(new FFmpegError('Process cancelled', 'CANCELLED'));
      };

      if (options.signal) {
        options.signal.addEventListener('abort', handleCancel);
      }

      // Emit start event
      this.emit('start', command);

      // Handle input stream
      if (options.input && childProcess.stdin) {
        options.input.pipe(childProcess.stdin);
      }

      // Handle stdout
      if (childProcess.stdout) {
        childProcess.stdout.on('data', (chunk: Buffer) => {
          stdout += chunk.toString();
          if (options.output) {
            options.output.write(chunk);
          }
          if (options.stream) {
            this.emit('data', chunk);
          }
        });
      }

      // Handle stderr (FFmpeg outputs progress info to stderr)
      if (childProcess.stderr) {
        childProcess.stderr.on('data', (chunk: Buffer) => {
          const line = chunk.toString();
          stderr += line;
          
          this.emit('stderr', line);
          
          // Parse progress information
          const progress = this.parseProgress(line);
          if (progress) {
            this.emit('progress', progress);
          }
        });
      }

      // Handle process exit
      childProcess.on('exit', (code: number | null, signal: string | null) => {
        if (cancelled) return;
        
        const duration = Date.now() - startTime;
        this.currentProcess = null;

        if (options.signal) {
          options.signal.removeEventListener('abort', handleCancel);
        }

        if (code === 0) {
          const result: ExecutionResult = {
            success: true,
            output: stdout,
            duration,
            command
          };
          
          this.emit('end', result);
          resolve(result);
        } else {
          const error = new FFmpegError(
            `FFmpeg process failed with exit code ${code}`,
            this.getErrorCode(stderr),
            code || undefined,
            stderr
          );
          
          this.emit('error', error);
          reject(error);
        }
      });

      // Handle process errors
      childProcess.on('error', (error: Error) => {
        if (cancelled) return;
        
        this.currentProcess = null;
        
        const ffmpegError = new FFmpegError(
          `Failed to start FFmpeg process: ${error.message}`,
          'PROCESS_ERROR'
        );
        
        this.emit('error', ffmpegError);
        reject(ffmpegError);
      });

      // Set timeout
      const timeout = options.timeout || this.options.timeout!;
      const timeoutId = setTimeout(() => {
        if (!cancelled && this.currentProcess) {
          this.cancel();
          reject(new FFmpegError('Process timed out', 'TIMEOUT'));
        }
      }, timeout);

      // Clear timeout when process ends
      childProcess.on('exit', () => {
        clearTimeout(timeoutId);
      });
    });
  }

  /**
   * Cancel the current process
   */
  cancel(): void {
    if (this.currentProcess) {
      this.emit('cancel');
      this.currentProcess.kill('SIGTERM');
      
      // Force kill after 5 seconds if still running
      setTimeout(() => {
        if (this.currentProcess) {
          this.currentProcess.kill('SIGKILL');
        }
      }, 5000);
      
      this.currentProcess = null;
    }
  }

  /**
   * Check if FFmpeg is available
   */
  async checkFFmpeg(): Promise<boolean> {
    try {
      await this.execute(`${this.options.ffmpegPath} -version`, { timeout: 5000 });
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Get FFmpeg version information
   */
  async getVersion(): Promise<string> {
    try {
      const result = await this.execute(`${this.options.ffmpegPath} -version`, { timeout: 5000 });
      const versionMatch = result.output.match(/ffmpeg version ([^\s]+)/);
      return versionMatch ? versionMatch[1] : 'unknown';
    } catch {
      throw new FFmpegError('Failed to get FFmpeg version', 'VERSION_ERROR');
    }
  }

  /**
   * Parse command string into arguments array
   */
  private parseCommand(command: string): string[] {
    // Simple command parsing - in a real implementation, this would be more robust
    const args: string[] = [];
    const parts = command.split(' ');
    
    for (let i = 1; i < parts.length; i++) { // Skip 'ffmpeg'
      let part = parts[i];
      
      // Handle quoted arguments
      if (part.startsWith('"') && !part.endsWith('"')) {
        while (i + 1 < parts.length && !parts[i + 1].endsWith('"')) {
          i++;
          part += ' ' + parts[i];
        }
        if (i + 1 < parts.length) {
          i++;
          part += ' ' + parts[i];
        }
        part = part.slice(1, -1); // Remove quotes
      } else if (part.startsWith('"') && part.endsWith('"')) {
        part = part.slice(1, -1);
      }
      
      if (part) {
        args.push(part);
      }
    }
    
    return args;
  }

  /**
   * Parse progress information from FFmpeg stderr
   */
  private parseProgress(line: string): ProgressInfo | null {
    // FFmpeg progress format: frame=  123 fps= 25 q=28.0 size=    1024kB time=00:00:05.00 bitrate=1677.7kbits/s speed=   1x
    const progressMatch = line.match(
      /frame=\s*(\d+)\s+fps=\s*([\d.]+)\s+q=([\d.-]+)\s+size=\s*(\d+)kB\s+time=(\d{2}):(\d{2}):([\d.]+)\s+bitrate=([\d.]+)kbits\/s\s+speed=\s*([\d.]+)x/
    );
    
    if (progressMatch) {
      const [, frame, fps, q, size, hours, minutes, seconds, bitrate, speed] = progressMatch;
      const timeInSeconds = parseInt(hours) * 3600 + parseInt(minutes) * 60 + parseFloat(seconds);
      
      return {
        percent: 0, // Would need total duration to calculate percentage
        time: `${hours}:${minutes}:${seconds}`,
        speed: parseFloat(speed),
        size: `${size}kB`,
        bitrate: `${bitrate}kbits/s`,
        fps: parseFloat(fps)
      };
    }
    
    return null;
  }

  /**
   * Determine error code from stderr
   */
  private getErrorCode(stderr: string): string {
    if (stderr.includes('No such file or directory')) {
      return 'FILE_NOT_FOUND';
    }
    if (stderr.includes('Invalid data found when processing input')) {
      return 'INVALID_INPUT';
    }
    if (stderr.includes('Unknown encoder')) {
      return 'UNKNOWN_ENCODER';
    }
    if (stderr.includes('Permission denied')) {
      return 'PERMISSION_DENIED';
    }
    if (stderr.includes('Codec not supported')) {
      return 'CODEC_NOT_SUPPORTED';
    }
    
    return 'UNKNOWN_ERROR';
  }
}

/**
 * Batch executor for processing multiple commands
 */
export class BatchExecutor extends FFmpegExecutor {
  async executeBatch(
    commands: string[],
    options: { parallel?: number; onProgress?: (completed: number, total: number) => void } = {}
  ): Promise<ExecutionResult[]> {
    const { parallel = 1, onProgress } = options;
    const results: ExecutionResult[] = [];
    
    for (let i = 0; i < commands.length; i += parallel) {
      const batch = commands.slice(i, i + parallel);
      const batchResults = await Promise.all(
        batch.map(cmd => this.execute(cmd))
      );
      
      results.push(...batchResults);
      
      if (onProgress) {
        onProgress(results.length, commands.length);
      }
      
      this.emit('batch:progress', {
        completed: results.length,
        total: commands.length,
        percent: (results.length / commands.length) * 100
      });
    }
    
    return results;
  }
}

/**
 * Queue executor for sequential processing
 */
export class QueuedExecutor extends FFmpegExecutor {
  private queue: Array<{
    command: string;
    options?: ExecuteOptions;
    resolve: (result: ExecutionResult) => void;
    reject: (error: Error) => void;
  }> = [];
  
  private processing = false;

  async queueCommand(command: string, options?: ExecuteOptions): Promise<ExecutionResult> {
    return new Promise((resolve, reject) => {
      this.queue.push({ command, options, resolve, reject });
      this.processQueue();
    });
  }

  private async processQueue(): Promise<void> {
    if (this.processing || this.queue.length === 0) return;
    
    this.processing = true;
    
    while (this.queue.length > 0) {
      const { command, options, resolve, reject } = this.queue.shift()!;
      
      try {
        const result = await this.execute(command, options);
        resolve(result);
      } catch (error) {
        reject(error as Error);
      }
    }
    
    this.processing = false;
  }

  getQueueLength(): number {
    return this.queue.length;
  }

  clearQueue(): void {
    this.queue.forEach(({ reject }) => {
      reject(new Error('Queue cleared'));
    });
    this.queue = [];
  }
}

/**
 * Retry executor with exponential backoff
 */
export async function executeWithRetry(
  executor: FFmpegExecutor,
  command: string,
  options: ExecuteOptions & { maxRetries?: number; backoffMs?: number } = {}
): Promise<ExecutionResult> {
  const { maxRetries = 3, backoffMs = 1000, ...executeOptions } = options;
  
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      return await executor.execute(command, executeOptions);
    } catch (error) {
      if (attempt === maxRetries - 1) {
        throw error;
      }
      
      // Wait with exponential backoff
      await new Promise(resolve => 
        setTimeout(resolve, backoffMs * Math.pow(2, attempt))
      );
    }
  }
  
  throw new Error('Max retries exceeded');
}
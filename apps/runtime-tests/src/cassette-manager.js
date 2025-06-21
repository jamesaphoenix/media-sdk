import fs from 'fs';
import path from 'path';
import { spawn } from 'child_process';

/**
 * Cassette manager for recording/replaying FFmpeg commands
 * Based on the cassette pattern from persona-sdk
 */
export class CassetteManager {
  constructor(cassetteName) {
    this.cassetteName = cassetteName;
    this.cassettePath = path.join('cassettes', `${cassetteName}.json`);
    this.mode = process.env.CASSETTE_MODE || 'replay';
    this.interactions = this.loadCassette();
  }

  loadCassette() {
    if (fs.existsSync(this.cassettePath)) {
      const content = fs.readFileSync(this.cassettePath, 'utf8');
      return JSON.parse(content);
    }
    return {
      name: this.cassetteName,
      interactions: [],
      meta: {
        created: new Date().toISOString(),
        sdk_version: '1.0.0'
      }
    };
  }

  saveCassette() {
    const dir = path.dirname(this.cassettePath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    fs.writeFileSync(this.cassettePath, JSON.stringify(this.interactions, null, 2));
  }

  async executeCommand(command, options = {}) {
    const commandKey = this.normalizeCommand(command);
    
    if (this.mode === 'record') {
      // Record mode: execute actual FFmpeg and save result
      const result = await this.realExecute(command, options);
      this.recordInteraction(commandKey, result);
      return result;
    } else {
      // Replay mode: return saved result
      return this.replayInteraction(commandKey);
    }
  }

  async realExecute(command, options) {
    return new Promise((resolve, reject) => {
      const startTime = Date.now();
      
      // Parse command
      const args = command.split(' ').slice(1); // Remove 'ffmpeg'
      
      let stdout = '';
      let stderr = '';
      
      const process = spawn('ffmpeg', args, {
        cwd: options.cwd
      });

      process.stdout?.on('data', (data) => {
        stdout += data.toString();
      });

      process.stderr?.on('data', (data) => {
        stderr += data.toString();
      });

      process.on('exit', (code) => {
        const duration = Date.now() - startTime;
        
        resolve({
          success: code === 0,
          exitCode: code,
          stdout,
          stderr,
          duration,
          command
        });
      });

      process.on('error', (error) => {
        reject({
          success: false,
          error: error.message,
          command
        });
      });
    });
  }

  recordInteraction(commandKey, result) {
    this.interactions.interactions.push({
      id: this.generateId(),
      command: commandKey,
      result,
      timestamp: new Date().toISOString()
    });
    this.saveCassette();
  }

  replayInteraction(commandKey) {
    const interaction = this.interactions.interactions.find(
      i => i.command === commandKey
    );
    
    if (!interaction) {
      throw new Error(`No cassette interaction found for command: ${commandKey}`);
    }
    
    // Simulate some delay to make it realistic
    return new Promise(resolve => {
      setTimeout(() => resolve(interaction.result), 100);
    });
  }

  normalizeCommand(command) {
    // Normalize command for consistent matching
    return command
      .replace(/\s+/g, ' ')
      .trim()
      // Replace file paths with placeholders for consistency
      .replace(/sample-files\/[^"\s]+/g, 'SAMPLE_FILE')
      .replace(/output\/[^"\s]+/g, 'OUTPUT_FILE');
  }

  generateId() {
    return Math.random().toString(36).substr(2, 9);
  }

  getStats() {
    return {
      name: this.cassetteName,
      interactions: this.interactions.interactions.length,
      mode: this.mode,
      path: this.cassettePath
    };
  }
}

/**
 * Mock FFmpeg executor for testing
 */
export class MockFFmpegExecutor {
  constructor(cassetteName) {
    this.cassette = new CassetteManager(cassetteName);
  }

  async execute(command, options = {}) {
    return this.cassette.executeCommand(command, options);
  }

  getStats() {
    return this.cassette.getStats();
  }
}
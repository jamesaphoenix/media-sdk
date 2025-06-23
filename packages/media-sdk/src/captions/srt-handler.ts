/**
 * @fileoverview SRT (SubRip) Handler - Complete SRT file support
 * 
 * Comprehensive SRT subtitle format handling including:
 * - Reading and parsing SRT files
 * - Writing and generating SRT files
 * - Converting between SRT and internal formats
 * - Advanced timing and formatting features
 * - Error handling and validation
 * 
 * @example Reading SRT File
 * ```typescript
 * const handler = new SRTHandler();
 * const subtitles = await handler.readSRTFile('movie.srt');
 * // Returns array of subtitle entries with timing and text
 * ```
 * 
 * @example Writing SRT File
 * ```typescript
 * const handler = new SRTHandler();
 * const subtitles = [
 *   { start: 0, end: 3, text: 'Hello world' },
 *   { start: 3, end: 6, text: 'This is a subtitle' }
 * ];
 * await handler.writeSRTFile('output.srt', subtitles);
 * ```
 * 
 * @example Converting Timeline to SRT
 * ```typescript
 * const handler = new SRTHandler();
 * const timeline = new Timeline()
 *   .addText('First subtitle', { startTime: 0, duration: 3 })
 *   .addText('Second subtitle', { startTime: 3, duration: 3 });
 * const srtContent = handler.timelineToSRT(timeline);
 * ```
 */

import { promises as fs } from 'fs';
import { Timeline } from '../timeline/timeline';

/**
 * SRT subtitle entry interface
 */
export interface SRTEntry {
  /**
   * Subtitle index (1-based)
   */
  index: number;
  
  /**
   * Start time in seconds
   */
  startTime: number;
  
  /**
   * End time in seconds
   */
  endTime: number;
  
  /**
   * Subtitle text (can be multi-line)
   */
  text: string;
  
  /**
   * Optional styling tags
   */
  style?: SRTStyle;
  
  /**
   * Position information
   */
  position?: SRTPosition;
}

/**
 * SRT styling options
 */
export interface SRTStyle {
  bold?: boolean;
  italic?: boolean;
  underline?: boolean;
  color?: string;
  fontName?: string;
  fontSize?: number;
}

/**
 * SRT position options
 */
export interface SRTPosition {
  alignment?: 'left' | 'center' | 'right';
  verticalPosition?: 'top' | 'middle' | 'bottom';
  marginLeft?: number;
  marginRight?: number;
  marginVertical?: number;
}

/**
 * SRT parsing options
 */
export interface SRTParseOptions {
  /**
   * Strict parsing mode (throws on errors)
   * @default false
   */
  strict?: boolean;
  
  /**
   * Parse inline styling tags
   * @default true
   */
  parseStyles?: boolean;
  
  /**
   * Preserve empty subtitles
   * @default false
   */
  preserveEmpty?: boolean;
  
  /**
   * Encoding for file reading
   * @default 'utf-8'
   */
  encoding?: BufferEncoding;
}

/**
 * SRT generation options
 */
export interface SRTGenerateOptions {
  /**
   * Include styling tags
   * @default true
   */
  includeStyles?: boolean;
  
  /**
   * Use milliseconds (3 decimal places)
   * @default true
   */
  useMilliseconds?: boolean;
  
  /**
   * Line ending type
   * @default '\r\n'
   */
  lineEnding?: '\n' | '\r\n';
  
  /**
   * Maximum line length (0 = no limit)
   * @default 0
   */
  maxLineLength?: number;
  
  /**
   * Add UTF-8 BOM
   * @default false
   */
  addBOM?: boolean;
}

/**
 * SRT validation result
 */
export interface SRTValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
  stats: {
    entryCount: number;
    totalDuration: number;
    averageDisplayTime: number;
    overlappingCount: number;
    gapCount: number;
  };
}

/**
 * Main SRT Handler class
 */
export class SRTHandler {
  private parseOptions: Required<SRTParseOptions>;
  private generateOptions: Required<SRTGenerateOptions>;

  constructor(
    parseOptions: SRTParseOptions = {},
    generateOptions: SRTGenerateOptions = {}
  ) {
    this.parseOptions = {
      strict: false,
      parseStyles: true,
      preserveEmpty: false,
      encoding: 'utf-8',
      ...parseOptions
    };

    this.generateOptions = {
      includeStyles: true,
      useMilliseconds: true,
      lineEnding: '\r\n',
      maxLineLength: 0,
      addBOM: false,
      ...generateOptions
    };
  }

  /**
   * Read and parse SRT file
   */
  async readSRTFile(filepath: string): Promise<SRTEntry[]> {
    try {
      const content = await fs.readFile(filepath, this.parseOptions.encoding);
      return this.parseSRT(content);
    } catch (error) {
      throw new Error(`Failed to read SRT file: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Write SRT file
   */
  async writeSRTFile(filepath: string, entries: SRTEntry[]): Promise<void> {
    try {
      const content = this.generateSRT(entries);
      const finalContent = this.generateOptions.addBOM ? '\ufeff' + content : content;
      await fs.writeFile(filepath, finalContent, 'utf-8');
    } catch (error) {
      throw new Error(`Failed to write SRT file: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Parse SRT content
   */
  parseSRT(content: string): SRTEntry[] {
    const entries: SRTEntry[] = [];
    
    // Normalize line endings and remove BOM
    const normalizedContent = content
      .replace(/^\ufeff/, '')
      .replace(/\r\n/g, '\n')
      .replace(/\r/g, '\n');
    
    // Split into subtitle blocks
    const blocks = normalizedContent.split(/\n\s*\n/);
    
    for (const block of blocks) {
      if (!block.trim()) continue;
      
      const lines = block.trim().split('\n');
      if (lines.length < 3) {
        if (this.parseOptions.strict) {
          throw new Error(`Invalid subtitle block: ${block}`);
        }
        continue;
      }
      
      // Parse index
      const index = parseInt(lines[0], 10);
      if (isNaN(index)) {
        if (this.parseOptions.strict) {
          throw new Error(`Invalid subtitle index: ${lines[0]}`);
        }
        continue;
      }
      
      // Parse timing
      const timingMatch = lines[1].match(
        /(\d{2}):(\d{2}):(\d{2})[,.](\d{3})\s*-->\s*(\d{2}):(\d{2}):(\d{2})[,.](\d{3})/
      );
      
      if (!timingMatch) {
        if (this.parseOptions.strict) {
          throw new Error(`Invalid timing format: ${lines[1]}`);
        }
        continue;
      }
      
      const startTime = this.timeToSeconds(
        parseInt(timingMatch[1], 10),
        parseInt(timingMatch[2], 10),
        parseInt(timingMatch[3], 10),
        parseInt(timingMatch[4], 10)
      );
      
      const endTime = this.timeToSeconds(
        parseInt(timingMatch[5], 10),
        parseInt(timingMatch[6], 10),
        parseInt(timingMatch[7], 10),
        parseInt(timingMatch[8], 10)
      );
      
      // Parse text (remaining lines)
      const textLines = lines.slice(2);
      let text = textLines.join('\n');
      
      // Parse styling if enabled
      let style: SRTStyle | undefined;
      if (this.parseOptions.parseStyles) {
        const styleResult = this.parseInlineStyles(text);
        text = styleResult.text;
        style = styleResult.style;
      }
      
      // Skip empty subtitles if not preserving
      if (!text.trim() && !this.parseOptions.preserveEmpty) {
        continue;
      }
      
      entries.push({
        index,
        startTime,
        endTime,
        text: text.trim(),
        style
      });
    }
    
    // Sort by start time
    entries.sort((a, b) => a.startTime - b.startTime);
    
    // Reindex
    entries.forEach((entry, i) => {
      entry.index = i + 1;
    });
    
    return entries;
  }

  /**
   * Generate SRT content
   */
  generateSRT(entries: SRTEntry[]): string {
    const lines: string[] = [];
    
    // Sort entries by start time
    const sortedEntries = [...entries].sort((a, b) => a.startTime - b.startTime);
    
    for (let i = 0; i < sortedEntries.length; i++) {
      const entry = sortedEntries[i];
      
      // Add index
      lines.push((i + 1).toString());
      
      // Add timing
      const startTime = this.secondsToTime(entry.startTime);
      const endTime = this.secondsToTime(entry.endTime);
      lines.push(`${startTime} --> ${endTime}`);
      
      // Add text with optional styling
      let text = entry.text;
      
      if (this.generateOptions.includeStyles && entry.style) {
        text = this.applyInlineStyles(text, entry.style);
      }
      
      // Apply line length limit if set
      if (this.generateOptions.maxLineLength > 0) {
        text = this.wrapText(text, this.generateOptions.maxLineLength);
      }
      
      lines.push(text);
      
      // Add empty line between entries (except last)
      if (i < sortedEntries.length - 1) {
        lines.push('');
      }
    }
    
    return lines.join(this.generateOptions.lineEnding);
  }

  /**
   * Convert time to seconds
   */
  private timeToSeconds(hours: number, minutes: number, seconds: number, milliseconds: number): number {
    return hours * 3600 + minutes * 60 + seconds + milliseconds / 1000;
  }

  /**
   * Convert seconds to time string
   */
  private secondsToTime(totalSeconds: number): string {
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = Math.floor(totalSeconds % 60);
    const milliseconds = Math.round((totalSeconds % 1) * 1000);
    
    const pad = (n: number, digits: number = 2) => n.toString().padStart(digits, '0');
    
    if (this.generateOptions.useMilliseconds) {
      return `${pad(hours)}:${pad(minutes)}:${pad(seconds)},${pad(milliseconds, 3)}`;
    } else {
      return `${pad(hours)}:${pad(minutes)}:${pad(seconds)},000`;
    }
  }

  /**
   * Parse inline styling tags
   */
  private parseInlineStyles(text: string): { text: string; style: SRTStyle } {
    const style: SRTStyle = {};
    let cleanText = text;
    
    // Bold
    if (/<b>.*?<\/b>/i.test(cleanText)) {
      style.bold = true;
      cleanText = cleanText.replace(/<\/?b>/gi, '');
    }
    
    // Italic
    if (/<i>.*?<\/i>/i.test(cleanText)) {
      style.italic = true;
      cleanText = cleanText.replace(/<\/?i>/gi, '');
    }
    
    // Underline
    if (/<u>.*?<\/u>/i.test(cleanText)) {
      style.underline = true;
      cleanText = cleanText.replace(/<\/?u>/gi, '');
    }
    
    // Font color
    const colorMatch = cleanText.match(/<font\s+color=["']?([^"'>]+)["']?>/i);
    if (colorMatch) {
      style.color = colorMatch[1];
      cleanText = cleanText.replace(/<\/?font[^>]*>/gi, '');
    }
    
    return { text: cleanText, style };
  }

  /**
   * Apply inline styling tags
   */
  private applyInlineStyles(text: string, style: SRTStyle): string {
    let styledText = text;
    
    if (style.bold) {
      styledText = `<b>${styledText}</b>`;
    }
    
    if (style.italic) {
      styledText = `<i>${styledText}</i>`;
    }
    
    if (style.underline) {
      styledText = `<u>${styledText}</u>`;
    }
    
    if (style.color) {
      styledText = `<font color="${style.color}">${styledText}</font>`;
    }
    
    return styledText;
  }

  /**
   * Wrap text to maximum line length
   */
  private wrapText(text: string, maxLength: number): string {
    const words = text.split(' ');
    const lines: string[] = [];
    let currentLine = '';
    
    for (const word of words) {
      if (currentLine.length + word.length + 1 > maxLength) {
        if (currentLine) {
          lines.push(currentLine);
          currentLine = word;
        } else {
          // Word is longer than max length
          lines.push(word);
        }
      } else {
        currentLine = currentLine ? `${currentLine} ${word}` : word;
      }
    }
    
    if (currentLine) {
      lines.push(currentLine);
    }
    
    return lines.join('\n');
  }

  /**
   * Validate SRT entries
   */
  validateSRT(entries: SRTEntry[]): SRTValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];
    let overlappingCount = 0;
    let gapCount = 0;
    let totalDuration = 0;
    
    // Sort by start time
    const sortedEntries = [...entries].sort((a, b) => a.startTime - b.startTime);
    
    for (let i = 0; i < sortedEntries.length; i++) {
      const entry = sortedEntries[i];
      const duration = entry.endTime - entry.startTime;
      totalDuration += duration;
      
      // Check timing
      if (entry.startTime < 0) {
        errors.push(`Entry ${entry.index}: Negative start time`);
      }
      
      if (entry.endTime <= entry.startTime) {
        errors.push(`Entry ${entry.index}: End time not after start time`);
      }
      
      if (duration < 0.1) {
        warnings.push(`Entry ${entry.index}: Very short duration (${duration.toFixed(2)}s)`);
      }
      
      if (duration > 10) {
        warnings.push(`Entry ${entry.index}: Very long duration (${duration.toFixed(2)}s)`);
      }
      
      // Check text
      if (!entry.text.trim()) {
        warnings.push(`Entry ${entry.index}: Empty text`);
      }
      
      if (entry.text.length > 100) {
        warnings.push(`Entry ${entry.index}: Very long text (${entry.text.length} chars)`);
      }
      
      // Check overlaps and gaps with previous entry
      if (i > 0) {
        const prevEntry = sortedEntries[i - 1];
        
        if (entry.startTime < prevEntry.endTime) {
          overlappingCount++;
          warnings.push(`Entry ${entry.index}: Overlaps with entry ${prevEntry.index}`);
        } else if (entry.startTime - prevEntry.endTime > 5) {
          gapCount++;
          warnings.push(`Entry ${entry.index}: Large gap (${(entry.startTime - prevEntry.endTime).toFixed(2)}s) after entry ${prevEntry.index}`);
        }
      }
    }
    
    return {
      valid: errors.length === 0,
      errors,
      warnings,
      stats: {
        entryCount: entries.length,
        totalDuration,
        averageDisplayTime: entries.length > 0 ? totalDuration / entries.length : 0,
        overlappingCount,
        gapCount
      }
    };
  }

  /**
   * Convert Timeline to SRT entries
   */
  timelineToSRT(timeline: Timeline): SRTEntry[] {
    const entries: SRTEntry[] = [];
    const timelineData = timeline.toJSON();
    
    // Extract text layers
    const textLayers = (timelineData as any).layers?.filter((layer: any) => layer.type === 'text') || [];
    
    textLayers.forEach((layer: any, index: number) => {
      const startTime = layer.startTime || 0;
      const duration = layer.duration || 3;
      const endTime = startTime + duration;
      
      // Extract style from layer
      const style: SRTStyle = {};
      if (layer.style) {
        if (layer.style.fontWeight === 'bold') style.bold = true;
        if (layer.style.fontStyle === 'italic') style.italic = true;
        if (layer.style.textDecoration === 'underline') style.underline = true;
        if (layer.style.color) style.color = layer.style.color;
        if (layer.style.fontFamily) style.fontName = layer.style.fontFamily;
        if (layer.style.fontSize) style.fontSize = layer.style.fontSize;
      }
      
      entries.push({
        index: index + 1,
        startTime,
        endTime,
        text: layer.text || '',
        style
      });
    });
    
    return entries;
  }

  /**
   * Create Timeline from SRT entries
   */
  srtToTimeline(entries: SRTEntry[]): Timeline {
    let timeline = new Timeline();
    
    for (const entry of entries) {
      const options: any = {
        startTime: entry.startTime,
        duration: entry.endTime - entry.startTime
      };
      
      // Apply styling
      if (entry.style) {
        options.style = {};
        
        if (entry.style.bold) options.style.fontWeight = 'bold';
        if (entry.style.italic) options.style.fontStyle = 'italic';
        if (entry.style.underline) options.style.textDecoration = 'underline';
        if (entry.style.color) options.style.color = entry.style.color;
        if (entry.style.fontName) options.style.fontFamily = entry.style.fontName;
        if (entry.style.fontSize) options.style.fontSize = entry.style.fontSize;
      }
      
      // Apply position
      if (entry.position) {
        options.position = {};
        
        if (entry.position.alignment === 'left') options.position.x = '10%';
        else if (entry.position.alignment === 'right') options.position.x = '90%';
        else options.position.x = '50%';
        
        if (entry.position.verticalPosition === 'top') options.position.y = '10%';
        else if (entry.position.verticalPosition === 'bottom') options.position.y = '90%';
        else options.position.y = '85%';
        
        options.position.anchor = 'center';
      }
      
      timeline = timeline.addText(entry.text, options);
    }
    
    return timeline;
  }

  /**
   * Merge multiple SRT files
   */
  async mergeSRTFiles(filepaths: string[], offsetSeconds: number = 0): Promise<SRTEntry[]> {
    const allEntries: SRTEntry[] = [];
    let currentOffset = 0;
    
    for (const filepath of filepaths) {
      const entries = await this.readSRTFile(filepath);
      
      // Apply offset to all entries
      const offsetEntries = entries.map(entry => ({
        ...entry,
        startTime: entry.startTime + currentOffset,
        endTime: entry.endTime + currentOffset
      }));
      
      allEntries.push(...offsetEntries);
      
      // Calculate next offset
      if (offsetEntries.length > 0) {
        const lastEntry = offsetEntries[offsetEntries.length - 1];
        currentOffset = lastEntry.endTime + offsetSeconds;
      }
    }
    
    // Reindex
    allEntries.forEach((entry, i) => {
      entry.index = i + 1;
    });
    
    return allEntries;
  }

  /**
   * Split SRT by duration
   */
  splitSRTByDuration(entries: SRTEntry[], maxDurationSeconds: number): SRTEntry[][] {
    const chunks: SRTEntry[][] = [];
    let currentChunk: SRTEntry[] = [];
    let chunkStartTime = 0;
    
    for (const entry of entries) {
      if (entry.endTime - chunkStartTime > maxDurationSeconds && currentChunk.length > 0) {
        // Start new chunk
        chunks.push(currentChunk);
        currentChunk = [];
        chunkStartTime = entry.startTime;
      }
      
      // Adjust timing relative to chunk start
      const adjustedEntry = {
        ...entry,
        startTime: entry.startTime - chunkStartTime,
        endTime: entry.endTime - chunkStartTime
      };
      
      currentChunk.push(adjustedEntry);
    }
    
    if (currentChunk.length > 0) {
      chunks.push(currentChunk);
    }
    
    // Reindex each chunk
    chunks.forEach(chunk => {
      chunk.forEach((entry, i) => {
        entry.index = i + 1;
      });
    });
    
    return chunks;
  }

  /**
   * Auto-generate subtitles from text
   */
  generateSubtitlesFromText(
    text: string,
    wordsPerMinute: number = 150,
    minDuration: number = 1,
    maxDuration: number = 5
  ): SRTEntry[] {
    const entries: SRTEntry[] = [];
    const sentences = text.match(/[^.!?]+[.!?]+/g) || [text];
    
    let currentTime = 0;
    
    sentences.forEach((sentence, index) => {
      const words = sentence.trim().split(/\s+/).length;
      const readingTime = (words / wordsPerMinute) * 60;
      const duration = Math.max(minDuration, Math.min(maxDuration, readingTime));
      
      entries.push({
        index: index + 1,
        startTime: currentTime,
        endTime: currentTime + duration,
        text: sentence.trim()
      });
      
      currentTime += duration + 0.1; // Small gap between subtitles
    });
    
    return entries;
  }
}

/**
 * Convenience function to create SRT handler
 */
export function createSRTHandler(
  parseOptions?: SRTParseOptions,
  generateOptions?: SRTGenerateOptions
): SRTHandler {
  return new SRTHandler(parseOptions, generateOptions);
}

/**
 * SRT file watcher for live updates
 */
export class SRTWatcher {
  private handler: SRTHandler;
  private watchers: Map<string, any> = new Map();
  private callbacks: Map<string, (entries: SRTEntry[]) => void> = new Map();

  constructor(handler: SRTHandler) {
    this.handler = handler;
  }

  /**
   * Watch SRT file for changes
   */
  async watch(filepath: string, callback: (entries: SRTEntry[]) => void): Promise<void> {
    // Initial read
    const entries = await this.handler.readSRTFile(filepath);
    callback(entries);
    
    // Set up watcher
    const { watch } = await import('fs');
    const watcher = watch(filepath, async (eventType) => {
      if (eventType === 'change') {
        try {
          const newEntries = await this.handler.readSRTFile(filepath);
          callback(newEntries);
        } catch (error) {
          console.error('Error reading SRT file:', error);
        }
      }
    });
    
    this.watchers.set(filepath, watcher);
    this.callbacks.set(filepath, callback);
  }

  /**
   * Stop watching file
   */
  unwatch(filepath: string): void {
    const watcher = this.watchers.get(filepath);
    if (watcher) {
      watcher.close();
      this.watchers.delete(filepath);
      this.callbacks.delete(filepath);
    }
  }

  /**
   * Stop all watchers
   */
  close(): void {
    for (const [filepath] of this.watchers) {
      this.unwatch(filepath);
    }
  }
}
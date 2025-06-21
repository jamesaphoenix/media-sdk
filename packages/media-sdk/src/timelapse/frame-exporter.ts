/**
 * Frame Exporter
 * 
 * Export individual frames from a timelapse with captions
 * Perfect for creating social media content from timelapse sequences
 */

import { Timeline } from '../timeline/timeline.js';

export interface FrameExportOptions {
  /** Output format for individual frames */
  format?: 'video' | 'image' | 'both';
  
  /** Video duration for each frame (if exporting as video) */
  videoDuration?: number;
  
  /** Image format (if exporting as image) */
  imageFormat?: 'jpg' | 'png' | 'webp';
  
  /** Add index to filename */
  includeIndex?: boolean;
  
  /** Add timestamp to filename */
  includeTimestamp?: boolean;
  
  /** Output directory */
  outputDir?: string;
  
  /** File naming pattern */
  namePattern?: string; // e.g., "frame-{index}-{timestamp}"
  
  /** Quality settings */
  quality?: {
    video?: 'low' | 'medium' | 'high' | 'ultra';
    image?: number; // 1-100 for JPEG quality
  };
}

export interface FrameData {
  image: string;
  caption?: string;
  metadata?: Record<string, any>;
  startTime: number;
  duration: number;
  index: number;
}

/**
 * Exports individual frames with captions
 */
export class FrameExporter {
  private frames: FrameData[] = [];
  private options: FrameExportOptions;

  constructor(options: FrameExportOptions = {}) {
    this.options = {
      format: 'both',
      videoDuration: 3,
      imageFormat: 'jpg',
      includeIndex: true,
      includeTimestamp: false,
      outputDir: 'output/frames',
      namePattern: 'frame-{index}',
      quality: {
        video: 'high',
        image: 90
      },
      ...options
    };
  }

  /**
   * Add a frame to export
   */
  addFrame(frame: FrameData): this {
    this.frames.push(frame);
    return this;
  }

  /**
   * Add multiple frames
   */
  addFrames(frames: FrameData[]): this {
    this.frames.push(...frames);
    return this;
  }

  /**
   * Generate timeline for a single frame with caption
   */
  private createFrameTimeline(frame: FrameData): Timeline {
    const timeline = new Timeline();
    
    // Add the image
    timeline.addImage(frame.image, {
      duration: this.options.videoDuration || 3
    });
    
    // Add caption if present
    if (frame.caption) {
      timeline.addText(frame.caption, {
        position: 'bottom',
        duration: this.options.videoDuration || 3,
        style: {
          fontSize: 32,
          color: '#ffffff',
          background: { 
            color: 'rgba(0,0,0,0.7)', 
            padding: 15,
            borderRadius: 8
          }
        }
      });
    }
    
    // Add metadata as overlays if present
    if (frame.metadata) {
      this.addMetadataOverlays(timeline, frame.metadata);
    }
    
    return timeline;
  }

  /**
   * Add metadata as text overlays
   */
  private addMetadataOverlays(timeline: Timeline, metadata: Record<string, any>): void {
    const positions = ['top-left', 'top-right', 'bottom-left', 'bottom-right'];
    let posIndex = 0;
    
    Object.entries(metadata).forEach(([key, value]) => {
      if (posIndex < positions.length) {
        timeline.addText(`${key}: ${value}`, {
          position: positions[posIndex],
          duration: this.options.videoDuration || 3,
          style: {
            fontSize: 18,
            color: '#ffffff',
            background: { 
              color: 'rgba(0,0,0,0.5)', 
              padding: 8
            }
          }
        });
        posIndex++;
      }
    });
  }

  /**
   * Generate filename for a frame
   */
  private generateFilename(frame: FrameData, extension: string): string {
    let filename = this.options.namePattern || 'frame-{index}';
    
    // Replace placeholders
    filename = filename.replace('{index}', frame.index.toString().padStart(4, '0'));
    filename = filename.replace('{timestamp}', frame.startTime.toFixed(2).replace('.', '-'));
    
    // Add custom metadata placeholders
    if (frame.metadata) {
      Object.entries(frame.metadata).forEach(([key, value]) => {
        filename = filename.replace(`{${key}}`, String(value));
      });
    }
    
    // Clean filename
    filename = filename.replace(/[^a-zA-Z0-9-_]/g, '_');
    
    return `${filename}.${extension}`;
  }

  /**
   * Export all frames as individual files
   */
  async exportAll(): Promise<ExportResult[]> {
    const results: ExportResult[] = [];
    
    for (const frame of this.frames) {
      const result = await this.exportFrame(frame);
      results.push(result);
    }
    
    return results;
  }

  /**
   * Export a single frame
   */
  async exportFrame(frame: FrameData): Promise<ExportResult> {
    const timeline = this.createFrameTimeline(frame);
    const result: ExportResult = {
      frame,
      outputs: []
    };
    
    const outputDir = this.options.outputDir || 'output/frames';
    
    // Export as video
    if (this.options.format === 'video' || this.options.format === 'both') {
      const videoFilename = this.generateFilename(frame, 'mp4');
      const videoPath = `${outputDir}/${videoFilename}`;
      
      // Get FFmpeg command for video
      const videoCommand = timeline.getCommand(videoPath);
      
      result.outputs.push({
        type: 'video',
        path: videoPath,
        command: videoCommand
      });
    }
    
    // Export as image (single frame)
    if (this.options.format === 'image' || this.options.format === 'both') {
      const imageFormat = this.options.imageFormat || 'jpg';
      const imageFilename = this.generateFilename(frame, imageFormat);
      const imagePath = `${outputDir}/${imageFilename}`;
      
      // Create image export command
      const imageCommand = this.createImageExportCommand(timeline, imagePath);
      
      result.outputs.push({
        type: 'image',
        path: imagePath,
        command: imageCommand
      });
    }
    
    return result;
  }

  /**
   * Create FFmpeg command for image export
   */
  private createImageExportCommand(timeline: Timeline, outputPath: string): string {
    // Get the base video command
    const videoCommand = timeline.getCommand('temp.mp4');
    
    // Extract input and filter parts
    const parts = videoCommand.split(' -c:v');
    const inputAndFilters = parts[0];
    
    // Modify for single frame output
    const quality = this.options.quality?.image || 90;
    const format = this.options.imageFormat || 'jpg';
    
    let imageCommand = inputAndFilters;
    
    // Add frame selection (just first frame)
    imageCommand += ' -frames:v 1';
    
    // Add quality settings based on format
    if (format === 'jpg') {
      imageCommand += ` -q:v ${Math.floor((100 - quality) / 100 * 31)}`; // JPEG quality scale
    } else if (format === 'png') {
      imageCommand += ' -compression_level 9';
    } else if (format === 'webp') {
      imageCommand += ` -quality ${quality}`;
    }
    
    imageCommand += ` "${outputPath}"`;
    
    return imageCommand;
  }

  /**
   * Generate a preview montage of all frames
   */
  createMontage(columns: number = 3): Timeline {
    const timeline = new Timeline();
    const gridSize = Math.ceil(Math.sqrt(this.frames.length));
    
    // Calculate positions for grid layout
    this.frames.forEach((frame, index) => {
      const row = Math.floor(index / columns);
      const col = index % columns;
      
      const cellWidth = 100 / columns;
      const cellHeight = 100 / gridSize;
      
      const x = col * cellWidth + cellWidth / 2;
      const y = row * cellHeight + cellHeight / 2;
      
      // Add image scaled to fit cell
      timeline.addImage(frame.image, {
        position: { x: `${x}%`, y: `${y}%`, anchor: 'center' },
        scale: 1 / columns * 0.9, // Leave some padding
        duration: 5 // Static montage
      });
      
      // Add small caption
      if (frame.caption) {
        timeline.addText(frame.caption, {
          position: { x: `${x}%`, y: `${y + cellHeight/2 - 5}%`, anchor: 'center' },
          style: {
            fontSize: 12,
            color: '#ffffff',
            background: { color: 'rgba(0,0,0,0.7)', padding: 4 }
          }
        });
      }
    });
    
    return timeline;
  }
}

/**
 * Result of frame export
 */
export interface ExportResult {
  frame: FrameData;
  outputs: Array<{
    type: 'video' | 'image';
    path: string;
    command: string;
  }>;
}

/**
 * Convenience function to export frames from a timelapse
 */
export function exportTimelapseFrames(
  images: Array<{ path: string; caption?: string; metadata?: any }>,
  options?: FrameExportOptions
): FrameExporter {
  const exporter = new FrameExporter(options);
  
  images.forEach((img, index) => {
    exporter.addFrame({
      image: img.path,
      caption: img.caption,
      metadata: img.metadata,
      startTime: index,
      duration: 1,
      index
    });
  });
  
  return exporter;
}

/**
 * Create social media ready frames
 */
export function createSocialMediaFrames(
  images: string[],
  captions: string[],
  platform: 'instagram' | 'tiktok' | 'twitter' = 'instagram'
): FrameExporter {
  const aspectRatios = {
    instagram: '1:1',
    tiktok: '9:16',
    twitter: '16:9'
  };
  
  const exporter = new FrameExporter({
    format: 'both',
    videoDuration: 3,
    quality: { video: 'high', image: 95 }
  });
  
  images.forEach((image, index) => {
    const timeline = new Timeline()
      .setAspectRatio(aspectRatios[platform])
      .addImage(image, { duration: 3 });
    
    if (captions[index]) {
      timeline.addWordHighlighting({
        text: captions[index],
        preset: platform as any,
        startTime: 0.5,
        duration: 2.5
      });
    }
    
    exporter.addFrame({
      image,
      caption: captions[index],
      metadata: { platform },
      startTime: index * 3,
      duration: 3,
      index
    });
  });
  
  return exporter;
}
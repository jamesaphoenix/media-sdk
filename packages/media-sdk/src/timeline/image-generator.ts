/**
 * Image Generator
 * 
 * Generate static images with text overlays, perfect for:
 * - Social media posts
 * - Memes
 * - Slideshows
 * - Thumbnail generation
 * - Batch image creation
 */

import { Timeline } from './timeline.js';
import type { TextStyle, Position } from '../types/index.js';

export interface ImageGeneratorOptions {
  /** Output format */
  format?: 'jpg' | 'png' | 'webp';
  /** Quality (1-100 for JPEG/WebP) */
  quality?: number;
  /** Generate as video frame (useful for consistent rendering) */
  asVideoFrame?: boolean;
  /** Frame duration if generating video */
  frameDuration?: number;
}

export interface ImageWithCaption {
  /** Base image path */
  imagePath: string;
  /** Caption text */
  caption: string;
  /** Caption position */
  position?: Position | string;
  /** Caption style */
  style?: TextStyle;
  /** Output filename (optional) */
  outputName?: string;
}

export interface BatchImageResult {
  /** Input configuration */
  input: ImageWithCaption;
  /** Generated output path */
  outputPath: string;
  /** FFmpeg command used */
  command: string;
}

/**
 * Generate a single image with caption overlay
 */
export function generateImageWithCaption(
  imagePath: string,
  caption: string,
  outputPath: string,
  options: {
    position?: Position | string;
    style?: TextStyle;
    format?: ImageGeneratorOptions;
  } = {}
): string {
  const {
    position = { x: '50%', y: '90%', anchor: 'bottom-center' },
    style = {
      fontSize: 48,
      color: '#ffffff',
      strokeColor: '#000000',
      strokeWidth: 3,
      background: { color: 'rgba(0,0,0,0.7)', padding: 20, borderRadius: 10 }
    },
    format = {}
  } = options;

  // Create timeline with image base
  const timeline = new Timeline()
    .addImage(imagePath, {
      duration: format.frameDuration || 1 // 1 second for single frame
    })
    .addText(caption, {
      position,
      style,
      duration: format.frameDuration || 1
    });

  // Generate command with specific format options
  let command = timeline.getCommand(outputPath);
  
  // Modify command for image output (single frame)
  if (!format.asVideoFrame) {
    // First, add -frames:v 1 after input
    const inputMatch = command.match(/(-i [^\s]+)/);
    if (inputMatch) {
      command = command.replace(inputMatch[0], `${inputMatch[0]} -frames:v 1`);
    }
    
    // Then replace codec based on output format
    if (outputPath.endsWith('.jpg') || outputPath.endsWith('.jpeg')) {
      // JPEG output
      command = command.replace(
        /-c:v h264/,
        `-c:v mjpeg -q:v ${Math.floor((100 - (format.quality || 90)) / 3.3)}`
      );
    } else if (outputPath.endsWith('.png')) {
      // PNG output
      command = command.replace(
        /-c:v h264/,
        '-c:v png'
      );
    } else if (outputPath.endsWith('.webp')) {
      // WebP output
      command = command.replace(
        /-c:v h264/,
        `-c:v libwebp -quality ${format.quality || 90}`
      );
    }
    
    // Remove audio codec for image output
    command = command.replace(/ -c:a aac/g, '');
  }

  return command;
}

/**
 * Generate multiple images with captions (batch processing)
 */
export function generateImageBatch(
  images: ImageWithCaption[],
  outputDir: string,
  options: ImageGeneratorOptions = {}
): BatchImageResult[] {
  const results: BatchImageResult[] = [];
  
  images.forEach((image, index) => {
    // Generate output filename
    const extension = options.format || 'jpg';
    const outputName = image.outputName || `image-${index + 1}`;
    const outputPath = `${outputDir}/${outputName}.${extension}`;
    
    // Generate command
    const command = generateImageWithCaption(
      image.imagePath,
      image.caption,
      outputPath,
      {
        position: image.position,
        style: image.style,
        format: options
      }
    );
    
    results.push({
      input: image,
      outputPath,
      command
    });
  });
  
  return results;
}

/**
 * Create a slideshow from images with captions
 */
export function createSlideshow(
  images: ImageWithCaption[],
  outputPath: string,
  options: {
    slideDuration?: number;
    transition?: 'none' | 'fade' | 'dissolve';
    transitionDuration?: number;
    style?: TextStyle;
    position?: Position | string;
    format?: ImageGeneratorOptions;
  } = {}
): string {
  const {
    slideDuration = 3,
    transition = 'fade',
    transitionDuration = 0.5,
    style = {
      fontSize: 48,
      color: '#ffffff',
      strokeColor: '#000000',
      strokeWidth: 3,
      background: { color: 'rgba(0,0,0,0.7)', padding: 20 }
    },
    position = { x: '50%', y: '85%', anchor: 'bottom-center' }
  } = options;

  let timeline = new Timeline();
  
  images.forEach((image, index) => {
    const startTime = index * slideDuration;
    
    // Add image
    timeline = timeline.addImage(image.imagePath, {
      startTime,
      duration: slideDuration + (transition !== 'none' ? transitionDuration : 0)
    });
    
    // Add caption
    timeline = timeline.addText(image.caption, {
      position: image.position || position,
      style: { ...style, ...image.style },
      startTime,
      duration: slideDuration
    });
  });
  
  return timeline.getCommand(outputPath);
}

/**
 * Convenience functions for social media formats
 */

export function createInstagramPost(
  imagePath: string,
  caption: string,
  outputPath: string,
  options: {
    style?: TextStyle;
    position?: Position | string;
  } = {}
): string {
  const timeline = new Timeline()
    .setAspectRatio('1:1') // Instagram square
    .addImage(imagePath, { duration: 1 })
    .addText(caption, {
      position: options.position || { x: '50%', y: '80%', anchor: 'center' },
      style: {
        fontSize: 64,
        color: '#ffffff',
        strokeColor: '#000000',
        strokeWidth: 4,
        background: { 
          color: 'rgba(0,0,0,0.6)', 
          padding: 30,
          borderRadius: 15
        },
        ...options.style
      }
    });
  
  // Use timeline directly to maintain aspect ratio
  let command = timeline.getCommand(outputPath);
  
  // Convert to single frame JPEG
  const inputMatch = command.match(/(-i [^\s]+)/);
  if (inputMatch) {
    command = command.replace(inputMatch[0], `${inputMatch[0]} -frames:v 1`);
  }
  command = command.replace(/-c:v h264/, `-c:v mjpeg -q:v ${Math.floor((100 - 95) / 3.3)}`);
  command = command.replace(/ -c:a aac/g, '');
  
  return command;
}

export function createTikTokThumbnail(
  imagePath: string,
  caption: string,
  outputPath: string,
  options: {
    style?: TextStyle;
    position?: Position | string;
  } = {}
): string {
  const timeline = new Timeline()
    .setAspectRatio('9:16') // TikTok vertical
    .addImage(imagePath, { duration: 1 })
    .addText(caption, {
      position: options.position || { x: '50%', y: '50%', anchor: 'center' },
      style: {
        fontSize: 72,
        color: '#ff0050',
        strokeColor: '#ffffff',
        strokeWidth: 5,
        background: { 
          color: 'rgba(0,0,0,0.8)', 
          padding: 40,
          borderRadius: 20
        },
        ...options.style
      }
    });
  
  return timeline.getCommand(outputPath);
}

export function createMeme(
  imagePath: string,
  topText: string,
  bottomText: string,
  outputPath: string,
  options: {
    style?: TextStyle;
  } = {}
): string {
  const memeStyle: TextStyle = {
    fontSize: 64,
    color: '#ffffff',
    strokeColor: '#000000',
    strokeWidth: 3,
    fontFamily: 'Impact',
    textAlign: 'center',
    ...options.style
  };
  
  const timeline = new Timeline()
    .addImage(imagePath, { duration: 1 })
    .addText(topText.toUpperCase(), {
      position: { x: '50%', y: '10%', anchor: 'top-center' },
      style: memeStyle
    })
    .addText(bottomText.toUpperCase(), {
      position: { x: '50%', y: '90%', anchor: 'bottom-center' },
      style: memeStyle
    });
  
  // Generate command directly from timeline
  let command = timeline.getCommand(outputPath);
  
  // Convert to single frame JPEG
  const inputMatch = command.match(/(-i [^\s]+)/);
  if (inputMatch) {
    command = command.replace(inputMatch[0], `${inputMatch[0]} -frames:v 1`);
  }
  command = command.replace(/-c:v h264/, `-c:v mjpeg -q:v ${Math.floor((100 - 90) / 3.3)}`);
  command = command.replace(/ -c:a aac/g, '');
  
  return command;
}

/**
 * Generate quote cards
 */
export function createQuoteCard(
  backgroundImage: string,
  quote: string,
  author: string,
  outputPath: string,
  options: {
    quoteStyle?: TextStyle;
    authorStyle?: TextStyle;
    overlay?: boolean;
  } = {}
): string {
  const {
    overlay = true,
    quoteStyle = {
      fontSize: 48,
      color: '#ffffff',
      fontFamily: 'Georgia',
      fontStyle: 'italic' as const,
      textAlign: 'center' as const,
      lineHeight: 1.5
    },
    authorStyle = {
      fontSize: 32,
      color: '#ffffff',
      fontFamily: 'Arial',
      textAlign: 'center'
    }
  } = options;
  
  let timeline = new Timeline()
    .addImage(backgroundImage, { duration: 1 });
  
  // Add dark overlay for better text readability
  if (overlay) {
    timeline = timeline.addFilter('colorchannelmixer', {
      aa: 0.5 // Darken image
    });
  }
  
  // Add quote
  timeline = timeline
    .addText(`"${quote}"`, {
      position: { x: '50%', y: '45%', anchor: 'center' },
      style: quoteStyle
    })
    .addText(`— ${author}`, {
      position: { x: '50%', y: '65%', anchor: 'center' },
      style: authorStyle
    });
  
  // Generate command directly from timeline
  let command = timeline.getCommand(outputPath);
  
  // Convert to single frame JPEG
  const inputMatch = command.match(/(-i [^\s]+)/);
  if (inputMatch) {
    command = command.replace(inputMatch[0], `${inputMatch[0]} -frames:v 1`);
  }
  command = command.replace(/-c:v h264/, `-c:v mjpeg -q:v ${Math.floor((100 - 95) / 3.3)}`);
  command = command.replace(/ -c:a aac/g, '');
  
  return command;
}
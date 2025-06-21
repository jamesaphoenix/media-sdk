#!/usr/bin/env bun

/**
 * Setup real sample files for testing with Bun runtime
 */

import { writeFileSync, existsSync, mkdirSync } from 'fs';
import { join } from 'path';

class BunSampleSetup {
  private sampleDir = 'sample-files';
  
  async setup() {
    console.log('🎬 Setting up Media SDK sample files with Bun runtime...\n');
    
    // Ensure directories exist
    if (!existsSync(this.sampleDir)) {
      mkdirSync(this.sampleDir, { recursive: true });
    }
    
    if (!existsSync('output')) {
      mkdirSync('output', { recursive: true });
    }
    
    // Create sample videos using FFmpeg (small test files)
    await this.createSampleVideos();
    
    // Create sample audio files
    await this.createSampleAudio();
    
    // Create sample images
    await this.createSampleImages();
    
    // Create caption files
    this.createCaptionFiles();
    
    console.log('\n✨ Sample setup complete!\n');
    this.listSamples();
  }
  
  private async createSampleVideos() {
    console.log('📹 Creating sample videos...');
    
    const videos = [
      {
        name: 'red-sample.mp4',
        command: 'ffmpeg -f lavfi -i color=c=red:size=640x480:duration=5 -c:v libx264 -t 5 -pix_fmt yuv420p -y sample-files/red-sample.mp4',
        fallback: this.createVideoPlaceholder('red-sample.mp4', 'red', 5)
      },
      {
        name: 'blue-sample.mp4', 
        command: 'ffmpeg -f lavfi -i color=c=blue:size=640x480:duration=5 -c:v libx264 -t 5 -pix_fmt yuv420p -y sample-files/blue-sample.mp4',
        fallback: this.createVideoPlaceholder('blue-sample.mp4', 'blue', 5)
      },
      {
        name: 'portrait-sample.mp4',
        command: 'ffmpeg -f lavfi -i color=c=green:size=480x640:duration=8 -c:v libx264 -t 8 -pix_fmt yuv420p -y sample-files/portrait-sample.mp4',
        fallback: this.createVideoPlaceholder('portrait-sample.mp4', 'green', 8)
      }
    ];
    
    for (const video of videos) {
      if (!existsSync(join(this.sampleDir, video.name))) {
        try {
          // Try to create real video with FFmpeg
          const proc = Bun.spawn(['sh', '-c', video.command], {
            stdout: 'pipe',
            stderr: 'pipe'
          });
          
          const exitCode = await proc.exited;
          if (exitCode === 0) {
            console.log(`  ✅ Created ${video.name}`);
          } else {
            throw new Error('FFmpeg failed');
          }
        } catch (error) {
          // Fallback to placeholder
          video.fallback();
          console.log(`  📝 Created placeholder ${video.name} (FFmpeg not available)`);
        }
      } else {
        console.log(`  ✓ ${video.name} already exists`);
      }
    }
  }
  
  private async createSampleAudio() {
    console.log('\n🎵 Creating sample audio...');
    
    const audioFiles = [
      {
        name: 'background-music.mp3',
        command: 'ffmpeg -f lavfi -i "sine=frequency=440:duration=10" -c:a mp3 -y sample-files/background-music.mp3',
        fallback: () => this.createAudioPlaceholder('background-music.mp3', 10)
      },
      {
        name: 'short-beep.mp3',
        command: 'ffmpeg -f lavfi -i "sine=frequency=800:duration=2" -c:a mp3 -y sample-files/short-beep.mp3',
        fallback: () => this.createAudioPlaceholder('short-beep.mp3', 2)
      }
    ];
    
    for (const audio of audioFiles) {
      if (!existsSync(join(this.sampleDir, audio.name))) {
        try {
          const proc = Bun.spawn(['sh', '-c', audio.command], {
            stdout: 'pipe',
            stderr: 'pipe'
          });
          
          const exitCode = await proc.exited;
          if (exitCode === 0) {
            console.log(`  ✅ Created ${audio.name}`);
          } else {
            throw new Error('FFmpeg failed');
          }
        } catch (error) {
          audio.fallback();
          console.log(`  📝 Created placeholder ${audio.name} (FFmpeg not available)`);
        }
      } else {
        console.log(`  ✓ ${audio.name} already exists`);
      }
    }
  }
  
  private async createSampleImages() {
    console.log('\n🖼️  Creating sample images...');
    
    // Create simple colored PNG images using ImageMagick or fallback
    const images = [
      { name: 'background-1920x1080.png', size: '1920x1080', color: 'skyblue' },
      { name: 'background-vertical.png', size: '1080x1920', color: 'lightgreen' },
      { name: 'logo-150x150.png', size: '150x150', color: 'navy' },
      { name: 'watermark.png', size: '200x50', color: 'rgba(255,255,255,0.8)' }
    ];
    
    for (const img of images) {
      if (!existsSync(join(this.sampleDir, img.name))) {
        try {
          // Try ImageMagick first
          const proc = Bun.spawn(['convert', '-size', img.size, `xc:${img.color}`, join(this.sampleDir, img.name)], {
            stdout: 'pipe',
            stderr: 'pipe'
          });
          
          const exitCode = await proc.exited;
          if (exitCode === 0) {
            console.log(`  ✅ Created ${img.name}`);
          } else {
            throw new Error('ImageMagick failed');
          }
        } catch (error) {
          // Fallback to placeholder
          this.createImagePlaceholder(img.name, img.size, img.color);
          console.log(`  📝 Created placeholder ${img.name} (ImageMagick not available)`);
        }
      } else {
        console.log(`  ✓ ${img.name} already exists`);
      }
    }
  }
  
  private createCaptionFiles() {
    console.log('\n📝 Creating caption files...');
    
    // SRT subtitle file
    const srtContent = `1
00:00:00,000 --> 00:00:02,500
Welcome to the Media SDK demo

2
00:00:02,500 --> 00:00:05,000
This video shows our capabilities

3
00:00:05,000 --> 00:00:08,000
Including advanced caption features

4
00:00:08,000 --> 00:00:10,000
Built with TypeScript and FFmpeg`;

    writeFileSync(join(this.sampleDir, 'demo-captions.srt'), srtContent);
    console.log('  ✅ Created demo-captions.srt');
    
    // Word-by-word timing for TikTok-style captions
    const wordTiming = [
      { word: "Welcome", start: 0, end: 0.5, confidence: 0.95 },
      { word: "to", start: 0.5, end: 0.7, confidence: 0.98 },
      { word: "the", start: 0.7, end: 0.9, confidence: 0.97 },
      { word: "Media", start: 0.9, end: 1.3, confidence: 0.96 },
      { word: "SDK", start: 1.3, end: 1.8, confidence: 0.94 },
      { word: "demo!", start: 1.8, end: 2.5, confidence: 0.99 }
    ];
    
    writeFileSync(join(this.sampleDir, 'word-timing.json'), JSON.stringify(wordTiming, null, 2));
    console.log('  ✅ Created word-timing.json');
    
    // TikTok-style captions
    const tiktokCaptions = [
      { word: "POV:", start: 0, end: 0.5, style: { color: "#ff0066", scale: 1.3 } },
      { word: "You're", start: 0.5, end: 0.8, style: { color: "#ffffff" } },
      { word: "testing", start: 0.8, end: 1.2, style: { color: "#00ff66" } },
      { word: "the", start: 1.2, end: 1.4, style: { color: "#ffffff" } },
      { word: "Media", start: 1.4, end: 1.8, style: { color: "#0066ff", scale: 1.2 } },
      { word: "SDK", start: 1.8, end: 2.3, style: { color: "#ffff00", scale: 1.4 } },
      { word: "and", start: 2.3, end: 2.5, style: { color: "#ffffff" } },
      { word: "it's", start: 2.5, end: 2.8, style: { color: "#ff6600" } },
      { word: "working!", start: 2.8, end: 3.5, style: { color: "#ff0066", scale: 1.5 } }
    ];
    
    writeFileSync(join(this.sampleDir, 'tiktok-captions.json'), JSON.stringify(tiktokCaptions, null, 2));
    console.log('  ✅ Created tiktok-captions.json');
  }
  
  private createVideoPlaceholder(name: string, color: string, duration: number) {
    return () => {
      const placeholder = {
        type: 'video',
        format: 'mp4',
        color,
        duration,
        resolution: name.includes('portrait') ? '480x640' : '640x480',
        note: 'Placeholder file - would be real video in record mode'
      };
      writeFileSync(join(this.sampleDir, name + '.meta'), JSON.stringify(placeholder, null, 2));
    };
  }
  
  private createAudioPlaceholder(name: string, duration: number) {
    const placeholder = {
      type: 'audio',
      format: 'mp3',
      duration,
      frequency: name.includes('beep') ? 800 : 440,
      note: 'Placeholder file - would be real audio in record mode'
    };
    writeFileSync(join(this.sampleDir, name + '.meta'), JSON.stringify(placeholder, null, 2));
  }
  
  private createImagePlaceholder(name: string, size: string, color: string) {
    const placeholder = {
      type: 'image',
      format: 'png',
      size,
      color,
      note: 'Placeholder file - would be real image in record mode'
    };
    writeFileSync(join(this.sampleDir, name + '.meta'), JSON.stringify(placeholder, null, 2));
  }
  
  private listSamples() {
    console.log('📁 Available sample files:');
    
    try {
      const files = Bun.file('sample-files').arrayBuffer();
      // List files using Bun's file system API
      console.log('  Run: ls sample-files/ to see all files');
    } catch {
      console.log('  Sample files directory created');
    }
  }
}

// Run setup if called directly
if (import.meta.main) {
  const setup = new BunSampleSetup();
  await setup.setup();
}
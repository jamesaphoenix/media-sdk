/**
 * @fileoverview Comprehensive Green Screen Runtime Tests
 * 
 * This test suite provides extensive runtime testing for green screen functionality
 * with actual video rendering, quality validation, and performance testing.
 */

import { describe, test, expect, beforeAll, afterAll } from 'bun:test';
import { promises as fs } from 'fs';
import { join } from 'path';
import { execSync } from 'child_process';
import { Timeline } from '../../../packages/media-sdk/src/timeline/timeline';

const TEST_ASSETS_DIR = join(import.meta.dir, '..', 'assets');
const TEST_OUTPUT_DIR = join(import.meta.dir, '..', 'output', 'green-screen-runtime');

describe('🎭 Green Screen Runtime Tests - Comprehensive Suite', () => {
  beforeAll(async () => {
    // Ensure output directory exists
    await fs.mkdir(TEST_OUTPUT_DIR, { recursive: true });
    
    // Verify green screen assets exist
    for (let i = 1; i <= 7; i++) {
      const assetPath = join(TEST_ASSETS_DIR, `green-screen-meme-${i}.mp4`);
      try {
        await fs.access(assetPath);
        console.log(`✅ Found green-screen-meme-${i}.mp4`);
      } catch {
        console.log(`❌ Missing green-screen-meme-${i}.mp4`);
      }
    }
    
    // Create background images for testing
    const sampleImagesDir = join(TEST_ASSETS_DIR, 'sample-images');
    await fs.mkdir(sampleImagesDir, { recursive: true });
    
    const backgrounds = [
      { name: 'gradient-bg.jpg', color: 'color=#FF6B35:size=1920x1080:duration=0.1' },
      { name: 'tech-bg.jpg', color: 'color=#003366:size=1920x1080:duration=0.1' },
      { name: 'viral-bg.jpg', color: 'color=#FF1744:size=1920x1080:duration=0.1' }
    ];

    for (const bg of backgrounds) {
      const bgPath = join(sampleImagesDir, bg.name);
      try {
        await fs.access(bgPath);
        console.log(`✅ Background exists: ${bg.name}`);
      } catch {
        console.log(`📸 Creating ${bg.name}...`);
        const createBgCommand = [
          'ffmpeg', '-y',
          '-f', 'lavfi',
          '-i', bg.color,
          '-frames:v', '1',
          bgPath
        ].join(' ');
        execSync(createBgCommand, { timeout: 10000 });
        console.log(`✅ Created ${bg.name}`);
      }
    }
  });

  afterAll(async () => {
    // Clean up test outputs
    try {
      const files = await fs.readdir(TEST_OUTPUT_DIR);
      for (const file of files) {
        if (file.endsWith('.mp4')) {
          await fs.unlink(join(TEST_OUTPUT_DIR, file));
        }
      }
      console.log('🧹 Cleaned up test outputs');
    } catch {
      // Ignore cleanup errors
    }
  });

  describe('📹 Image Background Tests', () => {
    test('should render reaction meme with gradient background', async () => {
      const timeline = new Timeline()
        .addGreenScreenWithImageBackground(
          join(TEST_ASSETS_DIR, 'green-screen-meme-1.mp4'),
          join(TEST_ASSETS_DIR, 'sample-images', 'gradient-bg.jpg'),
          {
            chromaKey: '#00FF00',
            chromaSimilarity: 0.4,
            chromaBlend: 0.1,
            backgroundScale: 'fill',
            quality: 'high'
          }
        )
        .addText('When the build passes on first try', {
          position: 'top',
          style: {
            fontSize: 44,
            color: '#ffffff',
            strokeWidth: 3,
            strokeColor: '#000000'
          }
        })
        .setAspectRatio('9:16')
        .setDuration(6);

      const outputPath = join(TEST_OUTPUT_DIR, 'reaction-gradient.mp4');
      const command = timeline.getCommand(outputPath);

      console.log('🎬 Rendering reaction meme with gradient background...');
      execSync(command, { timeout: 60000 });

      // Verify output
      const stats = await fs.stat(outputPath);
      expect(stats.size).toBeGreaterThan(50000);
      console.log(`✅ Rendered ${(stats.size / 1024 / 1024).toFixed(2)}MB video`);

      // Verify command contains expected elements
      expect(command).toContain('chromakey=color=0x00FF00');
      expect(command).toContain('similarity=0.4');
      expect(command).toContain('blend=0.1');
      expect(command).toContain('gradient-bg.jpg');
    }, 90000);

    test('should render educational content with tech background', async () => {
      const timeline = new Timeline()
        .addGreenScreenMeme(
          join(TEST_ASSETS_DIR, 'green-screen-meme-2.mp4'),
          join(TEST_ASSETS_DIR, 'sample-images', 'tech-bg.jpg'),
          'educational',
          {
            platform: 'youtube',
            professional: true
          }
        )
        .addText('Understanding Microservices Architecture', {
          position: 'bottom',
          style: {
            fontSize: 32,
            color: '#ffffff',
            backgroundColor: 'rgba(0,0,0,0.9)',
            padding: 20
          }
        })
        .setAspectRatio('16:9')
        .setDuration(8);

      const outputPath = join(TEST_OUTPUT_DIR, 'educational-tech.mp4');
      const command = timeline.getCommand(outputPath);

      console.log('📚 Rendering educational content...');
      execSync(command, { timeout: 60000 });

      const stats = await fs.stat(outputPath);
      expect(stats.size).toBeGreaterThan(100000);
      console.log(`✅ Educational video: ${(stats.size / 1024 / 1024).toFixed(2)}MB`);

      // Educational preset should use high quality settings
      expect(command).toContain('similarity=0.35');
      expect(command).toContain('blend=0.08');
    }, 90000);

    test('should render comedy meme with viral background', async () => {
      const timeline = new Timeline()
        .addGreenScreenMeme(
          join(TEST_ASSETS_DIR, 'green-screen-meme-3.mp4'),
          join(TEST_ASSETS_DIR, 'sample-images', 'viral-bg.jpg'),
          'comedy',
          {
            platform: 'tiktok',
            intensity: 'high'
          }
        )
        .addText('POV: You forgot to save before closing', {
          position: 'top',
          style: {
            fontSize: 46,
            color: '#ffff00',
            strokeWidth: 3,
            strokeColor: '#000000'
          }
        })
        .addText('💀 RIP 2 HOURS OF WORK 💀', {
          position: 'bottom',
          style: {
            fontSize: 38,
            color: '#ff0000',
            strokeWidth: 2,
            strokeColor: '#ffffff'
          }
        })
        .setAspectRatio('9:16')
        .setDuration(5);

      const outputPath = join(TEST_OUTPUT_DIR, 'comedy-viral.mp4');
      const command = timeline.getCommand(outputPath);

      console.log('😂 Rendering viral comedy meme...');
      execSync(command, { timeout: 60000 });

      const stats = await fs.stat(outputPath);
      expect(stats.size).toBeGreaterThan(80000);
      console.log(`✅ Comedy meme: ${(stats.size / 1024 / 1024).toFixed(2)}MB`);

      // High intensity should use higher similarity
      expect(command).toContain('similarity=0.5');
      expect(command).toContain('POV');
    }, 90000);
  });

  describe('🎥 Video Background Tests', () => {
    test('should render gaming meme with nature video background', async () => {
      const timeline = new Timeline()
        .addGreenScreenWithVideoBackground(
          join(TEST_ASSETS_DIR, 'green-screen-meme-4.mp4'),
          join(TEST_ASSETS_DIR, 'nature.mp4'),
          {
            chromaKey: '#00FF00',
            chromaSimilarity: 0.45,
            chromaBlend: 0.15,
            backgroundScale: 'crop',
            audioMix: 'greenscreen',
            backgroundLoop: true
          }
        )
        .addText('When your code compiles without warnings', {
          position: 'center',
          style: {
            fontSize: 40,
            color: '#00ff00',
            strokeWidth: 3,
            strokeColor: '#000000'
          }
        })
        .setAspectRatio('16:9')
        .setDuration(10);

      const outputPath = join(TEST_OUTPUT_DIR, 'gaming-nature.mp4');
      const command = timeline.getCommand(outputPath);

      console.log('🎮 Rendering gaming meme with nature background...');
      execSync(command, { timeout: 90000 });

      const stats = await fs.stat(outputPath);
      expect(stats.size).toBeGreaterThan(200000);
      console.log(`✅ Gaming meme: ${(stats.size / 1024 / 1024).toFixed(2)}MB`);

      // Should include video background looping
      expect(command).toContain('nature.mp4');
      expect(command).toContain('loop=loop=-1:size=32767');
    }, 120000);

    test('should render news-style meme with earth background', async () => {
      const timeline = new Timeline()
        .addGreenScreenMeme(
          join(TEST_ASSETS_DIR, 'green-screen-meme-5.mp4'),
          join(TEST_ASSETS_DIR, 'earth.mp4'),
          'news',
          {
            platform: 'youtube',
            professional: true
          }
        )
        .addText('BREAKING: Local developer discovers documentation', {
          position: 'bottom',
          style: {
            fontSize: 28,
            color: '#ffffff',
            backgroundColor: 'rgba(0,0,0,0.9)',
            padding: 20
          }
        })
        .setAspectRatio('16:9')
        .setDuration(8);

      const outputPath = join(TEST_OUTPUT_DIR, 'news-earth.mp4');
      const command = timeline.getCommand(outputPath);

      console.log('📺 Rendering news-style meme...');
      execSync(command, { timeout: 90000 });

      const stats = await fs.stat(outputPath);
      expect(stats.size).toBeGreaterThan(150000);
      console.log(`✅ News meme: ${(stats.size / 1024 / 1024).toFixed(2)}MB`);

      // News preset should use professional settings
      expect(command).toContain('similarity=0.3');
      expect(command).toContain('earth.mp4');
    }, 120000);
  });

  describe('⚙️ Quality and Performance Tests', () => {
    test('should handle different quality settings', async () => {
      const qualities = ['low', 'medium', 'high'] as const;
      
      for (const quality of qualities) {
        const timeline = new Timeline()
          .addGreenScreenWithImageBackground(
            join(TEST_ASSETS_DIR, 'green-screen-meme-6.mp4'),
            join(TEST_ASSETS_DIR, 'sample-images', 'tech-bg.jpg'),
            {
              chromaKey: '#00FF00',
              chromaSimilarity: 0.4,
              chromaBlend: 0.1,
              quality
            }
          )
          .addText(`Quality Test: ${quality.toUpperCase()}`, {
            position: 'center',
            style: { fontSize: 36, color: '#ffffff' }
          })
          .setDuration(3);

        const outputPath = join(TEST_OUTPUT_DIR, `quality-${quality}.mp4`);
        const command = timeline.getCommand(outputPath);

        console.log(`🔍 Testing ${quality} quality...`);
        const startTime = Date.now();
        execSync(command, { timeout: 45000 });
        const renderTime = Date.now() - startTime;

        const stats = await fs.stat(outputPath);
        console.log(`✅ ${quality}: ${(stats.size / 1024).toFixed(0)}KB in ${renderTime}ms`);
        
        expect(stats.size).toBeGreaterThan(10000);
        expect(renderTime).toBeLessThan(30000); // Should render within 30 seconds
      }
    }, 150000);

    test('should handle multiple chromakey colors', async () => {
      const colors = [
        { name: 'green', hex: '#00FF00' },
        { name: 'blue', hex: '#0000FF' },
        { name: 'magenta', hex: '#FF00FF' }
      ];

      for (const color of colors) {
        const timeline = new Timeline()
          .addGreenScreenWithImageBackground(
            join(TEST_ASSETS_DIR, 'green-screen-meme-7.mp4'),
            join(TEST_ASSETS_DIR, 'sample-images', 'gradient-bg.jpg'),
            {
              chromaKey: color.hex,
              chromaSimilarity: 0.4,
              chromaBlend: 0.1
            }
          )
          .addText(`Chromakey: ${color.name.toUpperCase()}`, {
            position: 'top',
            style: { fontSize: 32, color: '#ffffff' }
          })
          .setDuration(3);

        const outputPath = join(TEST_OUTPUT_DIR, `chromakey-${color.name}.mp4`);
        const command = timeline.getCommand(outputPath);

        console.log(`🎨 Testing ${color.name} chromakey...`);
        execSync(command, { timeout: 45000 });

        const stats = await fs.stat(outputPath);
        expect(stats.size).toBeGreaterThan(15000);
        console.log(`✅ ${color.name} chromakey: ${(stats.size / 1024).toFixed(0)}KB`);

        // Verify color is correctly converted
        const expectedColor = color.hex.replace('#', '');
        expect(command).toContain(`color=0x${expectedColor}`);
      }
    }, 150000);
  });

  describe('🔄 Scaling Mode Tests', () => {
    test('should render with different background scaling modes', async () => {
      const scaleModes = ['fit', 'fill', 'stretch', 'crop'] as const;
      
      for (const mode of scaleModes) {
        const timeline = new Timeline()
          .addGreenScreenWithImageBackground(
            join(TEST_ASSETS_DIR, 'green-screen-meme-1.mp4'),
            join(TEST_ASSETS_DIR, 'sample-images', 'viral-bg.jpg'),
            {
              chromaKey: '#00FF00',
              backgroundScale: mode
            }
          )
          .addText(`Scale Mode: ${mode.toUpperCase()}`, {
            position: 'bottom',
            style: {
              fontSize: 28,
              color: '#ffffff',
              backgroundColor: 'rgba(0,0,0,0.8)'
            }
          })
          .setDuration(4);

        const outputPath = join(TEST_OUTPUT_DIR, `scale-${mode}.mp4`);
        const command = timeline.getCommand(outputPath);

        console.log(`📐 Testing ${mode} scaling...`);
        execSync(command, { timeout: 45000 });

        const stats = await fs.stat(outputPath);
        expect(stats.size).toBeGreaterThan(20000);
        console.log(`✅ ${mode} scale: ${(stats.size / 1024).toFixed(0)}KB`);

        // Verify scaling filter is applied
        switch (mode) {
          case 'fit':
            expect(command).toContain('force_original_aspect_ratio=decrease');
            break;
          case 'fill':
          case 'crop':
            expect(command).toContain('force_original_aspect_ratio=increase');
            break;
          case 'stretch':
            expect(command).toContain('scale=iw:ih');
            break;
        }
      }
    }, 200000);
  });

  describe('🎯 Platform Optimization Tests', () => {
    test('should render optimized content for different platforms', async () => {
      const platforms = [
        { name: 'tiktok', ratio: '9:16', description: 'TikTok Viral' },
        { name: 'youtube', ratio: '16:9', description: 'YouTube Shorts' },
        { name: 'instagram', ratio: '1:1', description: 'Instagram Reel' }
      ];

      for (const platform of platforms) {
        const timeline = new Timeline()
          .addGreenScreenMeme(
            join(TEST_ASSETS_DIR, 'green-screen-meme-2.mp4'),
            join(TEST_ASSETS_DIR, 'sample-images', 'tech-bg.jpg'),
            'reaction',
            { platform: platform.name as any }
          )
          .addText(`${platform.description} Optimized`, {
            position: 'top',
            style: {
              fontSize: 36,
              color: '#ffffff',
              strokeWidth: 2,
              strokeColor: '#000000'
            }
          })
          .setAspectRatio(platform.ratio as any)
          .setDuration(5);

        const outputPath = join(TEST_OUTPUT_DIR, `platform-${platform.name}.mp4`);
        const command = timeline.getCommand(outputPath);

        console.log(`📱 Rendering ${platform.name} optimized content...`);
        execSync(command, { timeout: 60000 });

        const stats = await fs.stat(outputPath);
        expect(stats.size).toBeGreaterThan(30000);
        console.log(`✅ ${platform.name}: ${(stats.size / 1024).toFixed(0)}KB`);
      }
    }, 200000);
  });

  describe('🧪 Edge Case and Stress Tests', () => {
    test('should handle multiple text overlays with green screen', async () => {
      const timeline = new Timeline()
        .addGreenScreenWithImageBackground(
          join(TEST_ASSETS_DIR, 'green-screen-meme-3.mp4'),
          join(TEST_ASSETS_DIR, 'sample-images', 'gradient-bg.jpg'),
          {
            chromaKey: '#00FF00',
            chromaSimilarity: 0.4,
            chromaBlend: 0.1
          }
        )
        .addText('TOP TEXT', {
          position: 'top',
          style: { fontSize: 40, color: '#ffffff', strokeWidth: 2, strokeColor: '#000000' }
        })
        .addText('MIDDLE TEXT', {
          position: 'center',
          style: { fontSize: 36, color: '#ffff00', strokeWidth: 2, strokeColor: '#000000' }
        })
        .addText('BOTTOM TEXT', {
          position: 'bottom',
          style: { fontSize: 32, color: '#ff6600', strokeWidth: 2, strokeColor: '#000000' }
        })
        .setDuration(6);

      const outputPath = join(TEST_OUTPUT_DIR, 'multi-text.mp4');
      const command = timeline.getCommand(outputPath);

      console.log('📝 Testing multiple text overlays...');
      execSync(command, { timeout: 60000 });

      const stats = await fs.stat(outputPath);
      expect(stats.size).toBeGreaterThan(40000);
      console.log(`✅ Multi-text: ${(stats.size / 1024).toFixed(0)}KB`);

      // Should contain all text elements
      expect(command).toContain('TOP TEXT');
      expect(command).toContain('MIDDLE TEXT');
      expect(command).toContain('BOTTOM TEXT');
    }, 90000);

    test('should handle extreme similarity values', async () => {
      const timeline = new Timeline()
        .addGreenScreenWithImageBackground(
          join(TEST_ASSETS_DIR, 'green-screen-meme-4.mp4'),
          join(TEST_ASSETS_DIR, 'sample-images', 'viral-bg.jpg'),
          {
            chromaKey: '#00FF00',
            chromaSimilarity: 0.9, // Very high
            chromaBlend: 0.05 // Very low
          }
        )
        .addText('Extreme Settings Test', {
          position: 'center',
          style: { fontSize: 32, color: '#ffffff' }
        })
        .setDuration(4);

      const outputPath = join(TEST_OUTPUT_DIR, 'extreme-settings.mp4');
      const command = timeline.getCommand(outputPath);

      console.log('⚡ Testing extreme chromakey settings...');
      execSync(command, { timeout: 45000 });

      const stats = await fs.stat(outputPath);
      expect(stats.size).toBeGreaterThan(15000);
      console.log(`✅ Extreme settings: ${(stats.size / 1024).toFixed(0)}KB`);

      expect(command).toContain('similarity=0.9');
      expect(command).toContain('blend=0.05');
    }, 90000);
  });

  describe('📊 Performance Benchmarks', () => {
    test('should track rendering performance metrics', async () => {
      const metrics = [];
      
      // Test different video durations
      const durations = [3, 5, 10];
      
      for (const duration of durations) {
        const timeline = new Timeline()
          .addGreenScreenMeme(
            join(TEST_ASSETS_DIR, 'green-screen-meme-5.mp4'),
            join(TEST_ASSETS_DIR, 'sample-images', 'tech-bg.jpg'),
            'comedy'
          )
          .addText(`Duration: ${duration}s`, {
            position: 'top',
            style: { fontSize: 32, color: '#ffffff' }
          })
          .setDuration(duration);

        const outputPath = join(TEST_OUTPUT_DIR, `perf-${duration}s.mp4`);
        const command = timeline.getCommand(outputPath);

        console.log(`⏱️ Benchmarking ${duration}s render...`);
        const startTime = Date.now();
        execSync(command, { timeout: 90000 });
        const renderTime = Date.now() - startTime;

        const stats = await fs.stat(outputPath);
        const metric = {
          duration,
          renderTime,
          fileSize: stats.size,
          renderRatio: renderTime / (duration * 1000)
        };
        
        metrics.push(metric);
        console.log(`✅ ${duration}s: ${renderTime}ms render, ${(stats.size / 1024).toFixed(0)}KB, ratio: ${metric.renderRatio.toFixed(2)}`);
      }

      // Validate performance expectations
      metrics.forEach(metric => {
        expect(metric.renderTime).toBeLessThan(60000); // Under 1 minute
        expect(metric.renderRatio).toBeLessThan(20); // Render should be < 20x real-time
        expect(metric.fileSize).toBeGreaterThan(10000); // Minimum file size
      });

      console.log('📊 Performance Summary:');
      console.log('Duration\tRender Time\tFile Size\tRatio');
      metrics.forEach(m => {
        console.log(`${m.duration}s\t\t${m.renderTime}ms\t\t${(m.fileSize / 1024).toFixed(0)}KB\t\t${m.renderRatio.toFixed(2)}x`);
      });
    }, 300000);
  });
});
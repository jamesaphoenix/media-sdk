/**
 * @fileoverview Advanced Green Screen Integration Tests
 * 
 * Tests green screen functionality integrated with other advanced SDK features
 * like codecs, effects, advanced audio, and vision validation.
 */

import { describe, test, expect, beforeAll, afterAll } from 'bun:test';
import { promises as fs } from 'fs';
import { join } from 'path';
import { execSync } from 'child_process';
import { Timeline } from '../../../packages/media-sdk/src/timeline/timeline';

const TEST_ASSETS_DIR = join(import.meta.dir, '..', 'assets');
const TEST_OUTPUT_DIR = join(import.meta.dir, '..', 'output', 'green-screen-advanced');

describe('🔬 Advanced Green Screen Integration Tests', () => {
  beforeAll(async () => {
    await fs.mkdir(TEST_OUTPUT_DIR, { recursive: true });
    
    // Create advanced background patterns
    const advancedBackgrounds = [
      {
        name: 'animated-code.jpg',
        description: 'Animated code background',
        command: 'ffmpeg -y -f lavfi -i "color=#001122:size=1920x1080:duration=0.1" -frames:v 1'
      },
      {
        name: 'matrix-style.jpg',
        description: 'Matrix-style background',
        command: 'ffmpeg -y -f lavfi -i "color=#000000:size=1920x1080:duration=0.1" -frames:v 1'
      }
    ];

    const sampleImagesDir = join(TEST_ASSETS_DIR, 'sample-images');
    
    for (const bg of advancedBackgrounds) {
      const bgPath = join(sampleImagesDir, bg.name);
      try {
        await fs.access(bgPath);
        console.log(`✅ ${bg.description} exists`);
      } catch {
        console.log(`🎨 Creating ${bg.description}...`);
        execSync(`${bg.command} "${bgPath}"`, { timeout: 15000 });
        console.log(`✅ Created ${bg.name}`);
      }
    }
  });

  afterAll(async () => {
    console.log(`📁 Advanced test outputs available in: ${TEST_OUTPUT_DIR}`);
  });

  describe('🎞️ Codec Integration Tests', () => {
    test('should render green screen with H.264 high profile', async () => {
      const timeline = new Timeline()
        .addGreenScreenWithImageBackground(
          join(TEST_ASSETS_DIR, 'green-screen-meme-1.mp4'),
          join(TEST_ASSETS_DIR, 'sample-images', 'animated-code.jpg'),
          {
            chromaKey: '#00FF00',
            chromaSimilarity: 0.4,
            chromaBlend: 0.1,
            quality: 'high'
          }
        )
        .addText('H.264 High Profile Test', {
          position: 'center',
          style: {
            fontSize: 40,
            color: '#ffffff',
            strokeWidth: 3,
            strokeColor: '#000000'
          }
        })
        .setVideoCodec('libx264', {
          profile: 'high',
          level: '4.0',
          crf: 18,
          preset: 'slower'
        })
        .setAspectRatio('16:9')
        .setDuration(5);

      const outputPath = join(TEST_OUTPUT_DIR, 'h264-high-profile.mp4');
      const command = timeline.getCommand(outputPath);

      console.log('🎞️ Testing H.264 high profile...');
      execSync(command, { timeout: 120000 });

      const stats = await fs.stat(outputPath);
      expect(stats.size).toBeGreaterThan(50000);
      console.log(`✅ H.264 high: ${(stats.size / 1024 / 1024).toFixed(2)}MB`);

      expect(command).toContain('-profile:v high');
      expect(command).toContain('-crf 18');
      expect(command).toContain('-preset slower');
    }, 150000);

    test('should render green screen with H.265 optimization', async () => {
      const timeline = new Timeline()
        .addGreenScreenMeme(
          join(TEST_ASSETS_DIR, 'green-screen-meme-2.mp4'),
          join(TEST_ASSETS_DIR, 'sample-images', 'matrix-style.jpg'),
          'gaming',
          {
            platform: 'youtube'
          }
        )
        .addText('H.265 Optimization Test', {
          position: 'top',
          style: {
            fontSize: 36,
            color: '#00ff00',
            strokeWidth: 2,
            strokeColor: '#000000'
          }
        })
        .setVideoCodec('libx265', {
          crf: 23,
          preset: 'medium',
          tune: 'grain'
        })
        .setDuration(6);

      const outputPath = join(TEST_OUTPUT_DIR, 'h265-optimized.mp4');
      const command = timeline.getCommand(outputPath);

      console.log('🎯 Testing H.265 optimization...');
      execSync(command, { timeout: 150000 });

      const stats = await fs.stat(outputPath);
      expect(stats.size).toBeGreaterThan(40000);
      console.log(`✅ H.265: ${(stats.size / 1024 / 1024).toFixed(2)}MB`);

      expect(command).toContain('libx265');
      expect(command).toContain('-tune grain');
    }, 180000);

    test('should render with platform-specific codec presets', async () => {
      const platforms = [
        { name: 'tiktok', expectedCodec: 'h264', expectedCrf: 23 },
        { name: 'youtube', expectedCodec: 'h264', expectedCrf: 21 },
        { name: 'instagram', expectedCodec: 'h264', expectedCrf: 23 }
      ];

      for (const platform of platforms) {
        const timeline = new Timeline()
          .addGreenScreenMeme(
            join(TEST_ASSETS_DIR, 'green-screen-meme-3.mp4'),
            join(TEST_ASSETS_DIR, 'sample-images', 'tech-bg.jpg'),
            'reaction',
            { platform: platform.name as any }
          )
          .addText(`${platform.name.toUpperCase()} Optimized`, {
            position: 'center',
            style: { fontSize: 32, color: '#ffffff' }
          })
          .useCodecPreset(platform.name as any)
          .setDuration(4);

        const outputPath = join(TEST_OUTPUT_DIR, `codec-${platform.name}.mp4`);
        const command = timeline.getCommand(outputPath);

        console.log(`🎛️ Testing ${platform.name} codec preset...`);
        execSync(command, { timeout: 90000 });

        const stats = await fs.stat(outputPath);
        expect(stats.size).toBeGreaterThan(20000);
        console.log(`✅ ${platform.name}: ${(stats.size / 1024).toFixed(0)}KB`);
      }
    }, 300000);
  });

  describe('🎵 Audio Integration Tests', () => {
    test('should mix green screen audio with background music', async () => {
      const timeline = new Timeline()
        .addGreenScreenWithVideoBackground(
          join(TEST_ASSETS_DIR, 'green-screen-meme-4.mp4'),
          join(TEST_ASSETS_DIR, 'nature.mp4'),
          {
            chromaKey: '#00FF00',
            chromaSimilarity: 0.4,
            chromaBlend: 0.15,
            audioMix: 'both'
          }
        )
        .addAudio(join(TEST_ASSETS_DIR, 'background-music.mp3'), {
          volume: 0.3,
          fadeIn: 1,
          fadeOut: 2,
          loop: true
        })
        .addText('Audio Mixing Test', {
          position: 'top',
          style: {
            fontSize: 36,
            color: '#ffffff',
            strokeWidth: 2,
            strokeColor: '#000000'
          }
        })
        .setDuration(8);

      const outputPath = join(TEST_OUTPUT_DIR, 'audio-mixing.mp4');
      const command = timeline.getCommand(outputPath);

      console.log('🎵 Testing audio mixing...');
      execSync(command, { timeout: 120000 });

      const stats = await fs.stat(outputPath);
      expect(stats.size).toBeGreaterThan(100000);
      console.log(`✅ Audio mixing: ${(stats.size / 1024 / 1024).toFixed(2)}MB`);

      expect(command).toContain('background-music.mp3');
      expect(command).toContain('volume=0.3');
    }, 150000);

    test('should apply audio effects to green screen content', async () => {
      const timeline = new Timeline()
        .addGreenScreenMeme(
          join(TEST_ASSETS_DIR, 'green-screen-meme-5.mp4'),
          join(TEST_ASSETS_DIR, 'sample-images', 'viral-bg.jpg'),
          'comedy'
        )
        .addText('Audio Effects Test', {
          position: 'center',
          style: { fontSize: 32, color: '#ffffff' }
        })
        .addFilter('volume=2.0,highpass=f=200,lowpass=f=3000')
        .setDuration(5);

      const outputPath = join(TEST_OUTPUT_DIR, 'audio-effects.mp4');
      const command = timeline.getCommand(outputPath);

      console.log('🔊 Testing audio effects...');
      execSync(command, { timeout: 90000 });

      const stats = await fs.stat(outputPath);
      expect(stats.size).toBeGreaterThan(30000);
      console.log(`✅ Audio effects: ${(stats.size / 1024).toFixed(0)}KB`);

      expect(command).toContain('volume=2.0');
      expect(command).toContain('highpass=f=200');
    }, 120000);
  });

  describe('✨ Visual Effects Integration', () => {
    test('should combine green screen with pan-zoom effects', async () => {
      const timeline = new Timeline()
        .addGreenScreenWithImageBackground(
          join(TEST_ASSETS_DIR, 'green-screen-meme-6.mp4'),
          join(TEST_ASSETS_DIR, 'sample-images', 'animated-code.jpg'),
          {
            chromaKey: '#00FF00',
            chromaSimilarity: 0.4,
            chromaBlend: 0.1,
            backgroundScale: 'crop'
          }
        )
        .addText('Pan-Zoom + Green Screen', {
          position: 'top',
          style: {
            fontSize: 38,
            color: '#ffff00',
            strokeWidth: 3,
            strokeColor: '#000000'
          }
        })
        .addPanZoom({
          startScale: 1.0,
          endScale: 1.2,
          startX: 0,
          startY: 0,
          endX: 0.1,
          endY: 0.1,
          duration: 6
        })
        .setDuration(6);

      const outputPath = join(TEST_OUTPUT_DIR, 'pan-zoom-greenscreen.mp4');
      const command = timeline.getCommand(outputPath);

      console.log('📹 Testing pan-zoom with green screen...');
      execSync(command, { timeout: 120000 });

      const stats = await fs.stat(outputPath);
      expect(stats.size).toBeGreaterThan(80000);
      console.log(`✅ Pan-zoom effect: ${(stats.size / 1024 / 1024).toFixed(2)}MB`);

      expect(command).toContain('zoompan');
    }, 150000);

    test('should apply color filters to green screen composite', async () => {
      const timeline = new Timeline()
        .addGreenScreenMeme(
          join(TEST_ASSETS_DIR, 'green-screen-meme-7.mp4'),
          join(TEST_ASSETS_DIR, 'sample-images', 'matrix-style.jpg'),
          'gaming'
        )
        .addText('Color Grading Test', {
          position: 'bottom',
          style: {
            fontSize: 32,
            color: '#00ff00',
            strokeWidth: 2,
            strokeColor: '#000000'
          }
        })
        .addFilter('eq=brightness=0.1:contrast=1.2:saturation=1.5')
        .setDuration(5);

      const outputPath = join(TEST_OUTPUT_DIR, 'color-grading.mp4');
      const command = timeline.getCommand(outputPath);

      console.log('🎨 Testing color grading...');
      execSync(command, { timeout: 90000 });

      const stats = await fs.stat(outputPath);
      expect(stats.size).toBeGreaterThan(40000);
      console.log(`✅ Color grading: ${(stats.size / 1024).toFixed(0)}KB`);

      expect(command).toContain('eq=brightness=0.1');
      expect(command).toContain('contrast=1.2');
    }, 120000);
  });

  describe('🔍 Quality and Performance Analysis', () => {
    test('should measure chromakey quality with different similarity values', async () => {
      const similarities = [0.1, 0.3, 0.5, 0.7, 0.9];
      const results = [];

      for (const similarity of similarities) {
        const timeline = new Timeline()
          .addGreenScreenWithImageBackground(
            join(TEST_ASSETS_DIR, 'green-screen-meme-1.mp4'),
            join(TEST_ASSETS_DIR, 'sample-images', 'tech-bg.jpg'),
            {
              chromaKey: '#00FF00',
              chromaSimilarity: similarity,
              chromaBlend: 0.1
            }
          )
          .addText(`Similarity: ${similarity}`, {
            position: 'top',
            style: { fontSize: 28, color: '#ffffff' }
          })
          .setDuration(3);

        const outputPath = join(TEST_OUTPUT_DIR, `similarity-${similarity}.mp4`);
        const command = timeline.getCommand(outputPath);

        console.log(`🔬 Testing similarity ${similarity}...`);
        const startTime = Date.now();
        execSync(command, { timeout: 60000 });
        const renderTime = Date.now() - startTime;

        const stats = await fs.stat(outputPath);
        results.push({
          similarity,
          renderTime,
          fileSize: stats.size
        });

        console.log(`✅ Similarity ${similarity}: ${renderTime}ms, ${(stats.size / 1024).toFixed(0)}KB`);
      }

      // Analyze results
      console.log('\n📊 Chromakey Quality Analysis:');
      console.log('Similarity\tRender Time\tFile Size');
      results.forEach(r => {
        console.log(`${r.similarity}\t\t${r.renderTime}ms\t\t${(r.fileSize / 1024).toFixed(0)}KB`);
      });

      // All should render successfully
      results.forEach(r => {
        expect(r.renderTime).toBeLessThan(45000);
        expect(r.fileSize).toBeGreaterThan(10000);
      });
    }, 350000);

    test('should benchmark different background types performance', async () => {
      const backgroundTypes = [
        { type: 'image', file: join(TEST_ASSETS_DIR, 'sample-images', 'tech-bg.jpg') },
        { type: 'video', file: join(TEST_ASSETS_DIR, 'nature.mp4') },
        { type: 'video_loop', file: join(TEST_ASSETS_DIR, 'earth.mp4') }
      ];

      const benchmarks = [];

      for (const bg of backgroundTypes) {
        const timeline = new Timeline()
          .addGreenScreenWithImageBackground(
            join(TEST_ASSETS_DIR, 'green-screen-meme-2.mp4'),
            bg.file,
            {
              chromaKey: '#00FF00',
              chromaSimilarity: 0.4,
              backgroundLoop: bg.type === 'video_loop'
            }
          )
          .addText(`Background: ${bg.type}`, {
            position: 'center',
            style: { fontSize: 30, color: '#ffffff' }
          })
          .setDuration(5);

        const outputPath = join(TEST_OUTPUT_DIR, `bg-perf-${bg.type}.mp4`);
        const command = timeline.getCommand(outputPath);

        console.log(`⏱️ Benchmarking ${bg.type} background...`);
        const startTime = Date.now();
        execSync(command, { timeout: 120000 });
        const renderTime = Date.now() - startTime;

        const stats = await fs.stat(outputPath);
        benchmarks.push({
          type: bg.type,
          renderTime,
          fileSize: stats.size,
          efficiency: stats.size / renderTime
        });

        console.log(`✅ ${bg.type}: ${renderTime}ms, ${(stats.size / 1024 / 1024).toFixed(2)}MB`);
      }

      console.log('\n⚡ Background Performance Benchmark:');
      console.log('Type\t\tRender Time\tFile Size\tEfficiency');
      benchmarks.forEach(b => {
        console.log(`${b.type}\t\t${b.renderTime}ms\t\t${(b.fileSize / 1024 / 1024).toFixed(2)}MB\t\t${b.efficiency.toFixed(2)} B/ms`);
      });

      benchmarks.forEach(b => {
        expect(b.renderTime).toBeLessThan(90000);
        expect(b.fileSize).toBeGreaterThan(50000);
      });
    }, 400000);
  });

  describe('🎬 Complex Composition Tests', () => {
    test('should handle multi-layer green screen composition', async () => {
      const timeline = new Timeline()
        .addVideo(join(TEST_ASSETS_DIR, 'bunny.mp4'), {
          startTime: 0,
          duration: 8
        })
        .addGreenScreenWithImageBackground(
          join(TEST_ASSETS_DIR, 'green-screen-meme-3.mp4'),
          join(TEST_ASSETS_DIR, 'sample-images', 'animated-code.jpg'),
          {
            chromaKey: '#00FF00',
            chromaSimilarity: 0.4,
            chromaBlend: 0.1
          }
        )
        .addImage(join(TEST_ASSETS_DIR, 'logo-150x150.png'), {
          position: 'top-right',
          scale: 0.3,
          opacity: 0.8,
          duration: 8
        })
        .addText('Multi-Layer Composition', {
          position: 'bottom',
          style: {
            fontSize: 32,
            color: '#ffffff',
            backgroundColor: 'rgba(0,0,0,0.8)',
            padding: 15
          }
        })
        .setDuration(8);

      const outputPath = join(TEST_OUTPUT_DIR, 'multi-layer.mp4');
      const command = timeline.getCommand(outputPath);

      console.log('🎬 Testing multi-layer composition...');
      execSync(command, { timeout: 180000 });

      const stats = await fs.stat(outputPath);
      expect(stats.size).toBeGreaterThan(200000);
      console.log(`✅ Multi-layer: ${(stats.size / 1024 / 1024).toFixed(2)}MB`);

      expect(command).toContain('bunny.mp4');
      expect(command).toContain('logo-150x150.png');
    }, 200000);

    test('should create picture-in-picture with green screen', async () => {
      const timeline = new Timeline()
        .addVideo(join(TEST_ASSETS_DIR, 'earth.mp4'), {
          duration: 10
        })
        .addGreenScreenWithImageBackground(
          join(TEST_ASSETS_DIR, 'green-screen-meme-4.mp4'),
          join(TEST_ASSETS_DIR, 'sample-images', 'matrix-style.jpg'),
          {
            chromaKey: '#00FF00',
            chromaSimilarity: 0.4,
            chromaBlend: 0.1
          }
        )
        .addPictureInPicture(join(TEST_ASSETS_DIR, 'green-screen-meme-5.mp4'), {
          position: 'bottom-right',
          scale: 0.25,
          chromakey: {
            color: '#00FF00',
            similarity: 0.4,
            blend: 0.1
          }
        })
        .addText('PiP + Green Screen Demo', {
          position: 'top',
          style: {
            fontSize: 36,
            color: '#ffffff',
            strokeWidth: 3,
            strokeColor: '#000000'
          }
        })
        .setDuration(10);

      const outputPath = join(TEST_OUTPUT_DIR, 'pip-greenscreen.mp4');
      const command = timeline.getCommand(outputPath);

      console.log('📺 Testing PiP with green screen...');
      execSync(command, { timeout: 180000 });

      const stats = await fs.stat(outputPath);
      expect(stats.size).toBeGreaterThan(300000);
      console.log(`✅ PiP + Green screen: ${(stats.size / 1024 / 1024).toFixed(2)}MB`);

      expect(command).toContain('PiP + Green Screen');
    }, 200000);
  });
});
/**
 * @fileoverview Green Screen Meme Runtime Tests with Real Assets
 * 
 * This test suite demonstrates real green screen background replacement using
 * the actual green screen meme assets, creating viral-ready content with:
 * - Image backgrounds with captions
 * - Solid color backgrounds with captions  
 * - Video backgrounds with green screen removal
 */

import { describe, test, expect, beforeAll, afterAll } from 'bun:test';
import { promises as fs } from 'fs';
import { join } from 'path';
import { execSync } from 'child_process';
import { Timeline } from '../../../packages/media-sdk/src/timeline/timeline.js';

const TEST_ASSETS_DIR = join(import.meta.dir, '..', 'assets');
const TEST_OUTPUT_DIR = join(import.meta.dir, '..', 'output');

describe('🎭 Green Screen Meme Runtime with Real Assets', () => {
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
    
    // Create sample background images if they don't exist
    const sampleImagesDir = join(TEST_ASSETS_DIR, 'sample-images');
    await fs.mkdir(sampleImagesDir, { recursive: true });
    
    // Create a simple background image using FFmpeg
    const explosionBg = join(sampleImagesDir, 'explosion-bg.jpg');
    try {
      await fs.access(explosionBg);
    } catch {
      console.log('📸 Creating explosion background image...');
      const createImageCommand = [
        'ffmpeg', '-y',
        '-f', 'lavfi',
        '-i', 'color=orange:size=1920x1080:duration=0.1',
        '-f', 'lavfi',
        '-i', 'noise=alls=20:allf=t+u',
        '-filter_complex', '[0:v][1:v]blend=all_mode=multiply[explosion]',
        '-frames:v', '1',
        explosionBg
      ].join(' ');
      execSync(createImageCommand, { timeout: 10000 });
      console.log('✅ Explosion background created');
    }
    
    // Create office background
    const officeBg = join(sampleImagesDir, 'office-bg.jpg');
    try {
      await fs.access(officeBg);
    } catch {
      console.log('🏢 Creating office background image...');
      const createOfficeCommand = [
        'ffmpeg', '-y',
        '-f', 'lavfi',
        '-i', 'color=gray:size=1920x1080:duration=0.1',
        '-f', 'lavfi',
        '-i', 'color=white:size=400x300:duration=0.1',
        '-filter_complex', '[0:v][1:v]overlay=(W-w)/2:(H-h)/2[office]',
        '-frames:v', '1',
        officeBg
      ].join(' ');
      execSync(createOfficeCommand, { timeout: 10000 });
      console.log('✅ Office background created');
    }
  });

  afterAll(async () => {
    // Clean up test outputs
    try {
      const files = await fs.readdir(TEST_OUTPUT_DIR);
      for (const file of files) {
        if (file.startsWith('meme-runtime-')) {
          await fs.unlink(join(TEST_OUTPUT_DIR, file));
        }
      }
    } catch {
      // Ignore cleanup errors
    }
  });

  describe('🖼️ Scenario 1: Green Screen → Image Background + Caption', () => {
    test('should create reaction meme with explosion background', async () => {
      const timeline = new Timeline()
        .addGreenScreenWithImageBackground(
          join(TEST_ASSETS_DIR, 'green-screen-meme-1.mp4'),
          join(TEST_ASSETS_DIR, 'sample-images', 'explosion-bg.jpg'),
          {
            chromaKey: '#00FF00',
            chromaSimilarity: 0.4,
            chromaBlend: 0.1,
            backgroundScale: 'fill'
          }
        )
        .addText('When you see the code review comments', {
          position: 'top',
          style: {
            fontSize: 48,
            color: '#ffffff',
            strokeColor: '#000000',
            strokeWidth: 3,
            backgroundColor: 'rgba(0,0,0,0.7)',
            padding: 20
          }
        })
        .setAspectRatio('9:16'); // TikTok format

      const outputPath = join(TEST_OUTPUT_DIR, 'meme-runtime-explosion-reaction.mp4');
      const command = timeline.getCommand(outputPath);

      console.log('🎬 Creating explosion reaction meme...');
      console.log('📋 FFmpeg command:', command);
      
      execSync(command, { timeout: 30000 });

      // Verify output
      const stats = await fs.stat(outputPath);
      expect(stats.size).toBeGreaterThan(10000);
      console.log(`✅ Created explosion meme: ${(stats.size / 1024 / 1024).toFixed(2)}MB`);

      // Verify it contains expected elements
      expect(command).toContain('green-screen-meme-1.mp4');
      expect(command).toContain('explosion-bg.jpg');
      expect(command).toContain('chromakey=color=0x00FF00');
      expect(command).toContain('drawtext');
      expect(command).toContain('code review comments');
    });

    test('should create weather reporter meme with office background', async () => {
      const timeline = new Timeline()
        .addGreenScreenWithImageBackground(
          join(TEST_ASSETS_DIR, 'green-screen-meme-2.mp4'),
          join(TEST_ASSETS_DIR, 'sample-images', 'office-bg.jpg'),
          {
            chromaKey: '#00FF00',
            chromaSimilarity: 0.35,
            chromaBlend: 0.08,
            backgroundScale: 'fit'
          }
        )
        .addText('Me explaining why the server is down', {
          position: 'bottom',
          style: {
            fontSize: 36,
            color: '#ffff00',
            strokeColor: '#000000',
            strokeWidth: 2,
            backgroundColor: 'rgba(0,0,0,0.8)',
            padding: 15
          }
        })
        .setAspectRatio('16:9'); // YouTube format

      const outputPath = join(TEST_OUTPUT_DIR, 'meme-runtime-weather-explanation.mp4');
      const command = timeline.getCommand(outputPath);

      console.log('🌤️ Creating weather reporter explanation meme...');
      execSync(command, { timeout: 30000 });

      const stats = await fs.stat(outputPath);
      expect(stats.size).toBeGreaterThan(10000);
      console.log(`✅ Created weather meme: ${(stats.size / 1024 / 1024).toFixed(2)}MB`);

      expect(command).toContain('green-screen-meme-2.mp4');
      expect(command).toContain('office-bg.jpg');
      expect(command).toContain('server is down');
    });

    test('should create educational content with custom background', async () => {
      const timeline = new Timeline()
        .addGreenScreenMeme(
          join(TEST_ASSETS_DIR, 'green-screen-meme-3.mp4'),
          join(TEST_ASSETS_DIR, 'sample-images', 'office-bg.jpg'),
          'educational',
          {
            platform: 'youtube',
            professional: true
          }
        )
        .addText('Today we will learn about Docker containers', {
          position: 'bottom',
          style: {
            fontSize: 32,
            color: '#333333',
            backgroundColor: 'rgba(255,255,255,0.9)',
            padding: 20,
            borderRadius: 10
          }
        })
        .setAspectRatio('16:9');

      const outputPath = join(TEST_OUTPUT_DIR, 'meme-runtime-educational-docker.mp4');
      const command = timeline.getCommand(outputPath);

      console.log('📚 Creating educational Docker content...');
      execSync(command, { timeout: 30000 });

      const stats = await fs.stat(outputPath);
      expect(stats.size).toBeGreaterThan(10000);
      console.log(`✅ Created educational meme: ${(stats.size / 1024 / 1024).toFixed(2)}MB`);

      // Professional preset should use lower similarity for better quality
      expect(command).toContain('similarity=0.3');
      expect(command).toContain('Docker containers');
    });
  });

  describe('🎨 Scenario 2: Green Screen → Solid Color Background + Caption', () => {
    test('should create comedy meme with solid red background', async () => {
      // First create a solid red background image
      const redBgPath = join(TEST_OUTPUT_DIR, 'red-background.jpg');
      const createRedBgCommand = [
        'ffmpeg', '-y',
        '-f', 'lavfi',
        '-i', 'color=red:size=1920x1080:duration=0.1',
        '-frames:v', '1',
        redBgPath
      ].join(' ');
      execSync(createRedBgCommand, { timeout: 5000 });

      const timeline = new Timeline()
        .addGreenScreenWithImageBackground(
          join(TEST_ASSETS_DIR, 'green-screen-meme-4.mp4'),
          redBgPath,
          {
            chromaKey: '#00FF00',
            chromaSimilarity: 0.5,
            chromaBlend: 0.2,
            backgroundScale: 'stretch'
          }
        )
        .addText('ERROR 404: PATIENCE NOT FOUND', {
          position: 'center',
          style: {
            fontSize: 56,
            color: '#ffffff',
            strokeColor: '#000000',
            strokeWidth: 4,
            fontWeight: 'bold'
          }
        })
        .setAspectRatio('1:1'); // Instagram format

      const outputPath = join(TEST_OUTPUT_DIR, 'meme-runtime-red-error.mp4');
      const command = timeline.getCommand(outputPath);

      console.log('🔴 Creating red background error meme...');
      execSync(command, { timeout: 30000 });

      const stats = await fs.stat(outputPath);
      expect(stats.size).toBeGreaterThan(10000);
      console.log(`✅ Created red background meme: ${(stats.size / 1024 / 1024).toFixed(2)}MB`);

      expect(command).toContain('ERROR 404');
      expect(command).toContain('red-background.jpg');
    });

    test('should create viral TikTok meme with gradient background', async () => {
      // Create a gradient background
      const gradientBgPath = join(TEST_OUTPUT_DIR, 'gradient-background.jpg');
      const createGradientCommand = [
        'ffmpeg', '-y',
        '-f', 'lavfi',
        '-i', 'color=c=0xFF6B35:size=1920x1080:duration=0.1',
        '-f', 'lavfi',
        '-i', 'color=c=0xF7931E:size=1920x1080:duration=0.1',
        '-filter_complex', '[0:v][1:v]blend=all_mode=normal:all_opacity=0.5[gradient]',
        '-frames:v', '1',
        gradientBgPath
      ].join(' ');
      execSync(createGradientCommand, { timeout: 5000 });

      const timeline = new Timeline()
        .addGreenScreenMeme(
          join(TEST_ASSETS_DIR, 'green-screen-meme-5.mp4'),
          gradientBgPath,
          'comedy',
          {
            platform: 'tiktok',
            intensity: 'high'
          }
        )
        .addText('POV: You fixed the bug on the first try', {
          position: 'top',
          style: {
            fontSize: 44,
            color: '#ffffff',
            strokeColor: '#000000',
            strokeWidth: 3,
            backgroundColor: 'rgba(0,0,0,0.6)',
            padding: 15
          }
        })
        .addText('🔥 IMPOSSIBLE 🔥', {
          position: 'bottom',
          style: {
            fontSize: 40,
            color: '#ffff00',
            strokeColor: '#ff0000',
            strokeWidth: 2,
            fontWeight: 'bold'
          }
        })
        .setAspectRatio('9:16');

      const outputPath = join(TEST_OUTPUT_DIR, 'meme-runtime-viral-tiktok.mp4');
      const command = timeline.getCommand(outputPath);

      console.log('🔥 Creating viral TikTok meme...');
      execSync(command, { timeout: 30000 });

      const stats = await fs.stat(outputPath);
      expect(stats.size).toBeGreaterThan(10000);
      console.log(`✅ Created viral TikTok meme: ${(stats.size / 1024 / 1024).toFixed(2)}MB`);

      // High intensity should use higher similarity
      expect(command).toContain('similarity=0.5');
      expect(command).toContain('POV');
      expect(command).toContain('IMPOSSIBLE');
    });

    test('should create professional news-style meme with blue background', async () => {
      // Create professional blue background
      const blueBgPath = join(TEST_OUTPUT_DIR, 'blue-background.jpg');
      const createBlueBgCommand = [
        'ffmpeg', '-y',
        '-f', 'lavfi',
        '-i', 'color=#003366:size=1920x1080:duration=0.1',
        '-frames:v', '1',
        blueBgPath
      ].join(' ');
      execSync(createBlueBgCommand, { timeout: 5000 });

      const timeline = new Timeline()
        .addGreenScreenMeme(
          join(TEST_ASSETS_DIR, 'green-screen-meme-6.mp4'),
          blueBgPath,
          'news',
          {
            platform: 'youtube',
            professional: true
          }
        )
        .addText('BREAKING: Local developer discovers Stack Overflow', {
          position: 'bottom',
          style: {
            fontSize: 32,
            color: '#ffffff',
            backgroundColor: 'rgba(0,0,0,0.8)',
            padding: 20,
            textAlign: 'center'
          }
        })
        .setAspectRatio('16:9');

      const outputPath = join(TEST_OUTPUT_DIR, 'meme-runtime-news-breaking.mp4');
      const command = timeline.getCommand(outputPath);

      console.log('📺 Creating breaking news meme...');
      execSync(command, { timeout: 30000 });

      const stats = await fs.stat(outputPath);
      expect(stats.size).toBeGreaterThan(10000);
      console.log(`✅ Created news meme: ${(stats.size / 1024 / 1024).toFixed(2)}MB`);

      // News preset should use professional settings
      expect(command).toContain('similarity=0.3');
      expect(command).toContain('Stack Overflow');
    });
  });

  describe('🎥 Scenario 3: Green Screen → Video Background', () => {
    test('should create gaming meme with nature video background', async () => {
      const timeline = new Timeline()
        .addGreenScreenWithVideoBackground(
          join(TEST_ASSETS_DIR, 'green-screen-meme-7.mp4'),
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
        .addText('When you finally understand recursion', {
          position: 'top',
          style: {
            fontSize: 42,
            color: '#ffffff',
            strokeColor: '#000000',
            strokeWidth: 3,
            backgroundColor: 'rgba(0,100,0,0.7)',
            padding: 15
          }
        })
        .setAspectRatio('16:9');

      const outputPath = join(TEST_OUTPUT_DIR, 'meme-runtime-recursion-nature.mp4');
      const command = timeline.getCommand(outputPath);

      console.log('🌿 Creating recursion understanding meme with nature background...');
      execSync(command, { timeout: 45000 }); // Longer timeout for video processing

      const stats = await fs.stat(outputPath);
      expect(stats.size).toBeGreaterThan(50000);
      console.log(`✅ Created nature background meme: ${(stats.size / 1024 / 1024).toFixed(2)}MB`);

      expect(command).toContain('green-screen-meme-7.mp4');
      expect(command).toContain('nature.mp4');
      expect(command).toContain('loop=loop=-1:size=32767');
      expect(command).toContain('recursion');
    });

    test('should create reaction meme with earth video background', async () => {
      const timeline = new Timeline()
        .addGreenScreenWithVideoBackground(
          join(TEST_ASSETS_DIR, 'green-screen-meme-1.mp4'),
          join(TEST_ASSETS_DIR, 'earth.mp4'),
          {
            chromaKey: '#00FF00',
            chromaSimilarity: 0.4,
            chromaBlend: 0.1,
            backgroundScale: 'fill',
            audioMix: 'both',
            syncTiming: true
          }
        )
        .addText('Watching the deployment pipeline fail', {
          position: 'bottom',
          style: {
            fontSize: 38,
            color: '#ff6666',
            strokeColor: '#000000',
            strokeWidth: 2,
            backgroundColor: 'rgba(0,0,0,0.8)',
            padding: 18
          }
        })
        .setAspectRatio('9:16'); // TikTok format

      const outputPath = join(TEST_OUTPUT_DIR, 'meme-runtime-deployment-earth.mp4');
      const command = timeline.getCommand(outputPath);

      console.log('🌍 Creating deployment failure meme with Earth background...');
      execSync(command, { timeout: 45000 });

      const stats = await fs.stat(outputPath);
      expect(stats.size).toBeGreaterThan(50000);
      console.log(`✅ Created Earth background meme: ${(stats.size / 1024 / 1024).toFixed(2)}MB`);

      expect(command).toContain('earth.mp4');
      expect(command).toContain('deployment pipeline');
    });

    test('should create complex multi-layer meme with video background', async () => {
      const timeline = new Timeline()
        .addGreenScreenMeme(
          join(TEST_ASSETS_DIR, 'green-screen-meme-3.mp4'),
          join(TEST_ASSETS_DIR, 'bunny.mp4'),
          'gaming',
          {
            platform: 'youtube'
          }
        )
        .addText('Senior Developer', {
          position: 'top',
          style: {
            fontSize: 32,
            color: '#00ff00',
            strokeColor: '#000000',
            strokeWidth: 2,
            backgroundColor: 'rgba(0,0,0,0.7)',
            padding: 10
          }
        })
        .addText('Explaining why we need to refactor everything', {
          position: 'bottom',
          style: {
            fontSize: 28,
            color: '#ffffff',
            strokeColor: '#000000',
            strokeWidth: 2,
            backgroundColor: 'rgba(0,0,0,0.8)',
            padding: 15,
            textAlign: 'center'
          }
        })
        .setAspectRatio('16:9');

      const outputPath = join(TEST_OUTPUT_DIR, 'meme-runtime-refactor-bunny.mp4');
      const command = timeline.getCommand(outputPath);

      console.log('🐰 Creating refactoring explanation meme with bunny background...');
      execSync(command, { timeout: 45000 });

      const stats = await fs.stat(outputPath);
      expect(stats.size).toBeGreaterThan(50000);
      console.log(`✅ Created bunny background meme: ${(stats.size / 1024 / 1024).toFixed(2)}MB`);

      expect(command).toContain('bunny.mp4');
      expect(command).toContain('Senior Developer');
      expect(command).toContain('refactor everything');
    });
  });

  describe('🎯 Advanced Combinations and Real-World Scenarios', () => {
    test('should create viral reaction compilation with multiple elements', async () => {
      const timeline = new Timeline()
        .addGreenScreenMeme(
          join(TEST_ASSETS_DIR, 'green-screen-meme-2.mp4'),
          join(TEST_ASSETS_DIR, 'nature.mp4'),
          'reaction',
          {
            platform: 'tiktok',
            intensity: 'high'
          }
        )
        .addText('Me after fixing a bug that took 6 hours', {
          position: 'top',
          style: {
            fontSize: 40,
            color: '#ffff00',
            strokeColor: '#000000',
            strokeWidth: 3,
            backgroundColor: 'rgba(0,0,0,0.8)',
            padding: 15
          }
        })
        .addText('🎉 VICTORY 🎉', {
          position: 'center',
          startTime: 2,
          duration: 3,
          style: {
            fontSize: 64,
            color: '#00ff00',
            strokeColor: '#ffffff',
            strokeWidth: 4,
            fontWeight: 'bold'
          }
        })
        .setAspectRatio('9:16')
        .setDuration(8);

      const outputPath = join(TEST_OUTPUT_DIR, 'meme-runtime-viral-compilation.mp4');
      const command = timeline.getCommand(outputPath);

      console.log('🎉 Creating viral reaction compilation...');
      execSync(command, { timeout: 45000 });

      const stats = await fs.stat(outputPath);
      expect(stats.size).toBeGreaterThan(50000);
      console.log(`✅ Created viral compilation: ${(stats.size / 1024 / 1024).toFixed(2)}MB`);

      expect(command).toContain('6 hours');
      expect(command).toContain('VICTORY');
    });

    test('should demonstrate codec optimization for different platforms', async () => {
      const platforms = [
        { name: 'tiktok', ratio: '9:16', codec: 'tiktok' },
        { name: 'youtube', ratio: '16:9', codec: 'youtube' },
        { name: 'instagram', ratio: '1:1', codec: 'instagram' }
      ];

      for (const platform of platforms) {
        const timeline = new Timeline()
          .addGreenScreenMeme(
            join(TEST_ASSETS_DIR, 'green-screen-meme-4.mp4'),
            join(TEST_ASSETS_DIR, 'earth.mp4'),
            'comedy'
          )
          .addText(`Optimized for ${platform.name.toUpperCase()}`, {
            position: 'bottom',
            style: {
              fontSize: 36,
              color: '#ffffff',
              strokeColor: '#000000',
              strokeWidth: 2,
              backgroundColor: 'rgba(0,0,0,0.8)',
              padding: 15
            }
          })
          .setAspectRatio(platform.ratio as any)
          .useCodecPreset(platform.codec as any);

        const outputPath = join(TEST_OUTPUT_DIR, `meme-runtime-${platform.name}-optimized.mp4`);
        const command = timeline.getCommand(outputPath);

        console.log(`📱 Creating ${platform.name} optimized meme...`);
        execSync(command, { timeout: 45000 });

        const stats = await fs.stat(outputPath);
        expect(stats.size).toBeGreaterThan(30000);
        console.log(`✅ Created ${platform.name} meme: ${(stats.size / 1024 / 1024).toFixed(2)}MB`);

        expect(command).toContain(platform.name.toUpperCase());
      }
    });
  });
});
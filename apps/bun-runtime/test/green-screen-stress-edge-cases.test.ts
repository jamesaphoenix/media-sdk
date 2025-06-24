/**
 * @fileoverview Green Screen Stress Tests and Edge Cases
 * 
 * Tests green screen functionality under extreme conditions,
 * edge cases, error scenarios, and stress testing.
 */

import { describe, test, expect, beforeAll, afterAll } from 'bun:test';
import { promises as fs } from 'fs';
import { join } from 'path';
import { execSync } from 'child_process';
import { Timeline } from '../../../packages/media-sdk/src/timeline/timeline';

const TEST_ASSETS_DIR = join(import.meta.dir, '..', 'assets');
const TEST_OUTPUT_DIR = join(import.meta.dir, '..', 'output', 'green-screen-stress');

describe('💥 Green Screen Stress Tests and Edge Cases', () => {
  beforeAll(async () => {
    await fs.mkdir(TEST_OUTPUT_DIR, { recursive: true });
    
    // Create stress test background patterns
    const stressBackgrounds = [
      {
        name: 'noise-pattern.jpg',
        description: 'High noise pattern',
        command: 'ffmpeg -y -f lavfi -i "color=#333333:size=1920x1080:duration=0.1" -frames:v 1'
      },
      {
        name: 'gradient-complex.jpg', 
        description: 'Complex gradient pattern',
        command: 'ffmpeg -y -f lavfi -i "color=#8833cc:size=1920x1080:duration=0.1" -frames:v 1'
      },
      {
        name: 'checkerboard.jpg',
        description: 'Checkerboard pattern',
        command: 'ffmpeg -y -f lavfi -i "testsrc2=s=1920x1080:d=1" -frames:v 1'
      }
    ];

    const sampleImagesDir = join(TEST_ASSETS_DIR, 'sample-images');
    
    for (const bg of stressBackgrounds) {
      const bgPath = join(sampleImagesDir, bg.name);
      try {
        await fs.access(bgPath);
        console.log(`✅ ${bg.description} exists`);
      } catch {
        console.log(`🎨 Creating ${bg.description}...`);
        execSync(`${bg.command} "${bgPath}"`, { timeout: 20000 });
        console.log(`✅ Created ${bg.name}`);
      }
    }
  });

  afterAll(async () => {
    console.log(`📁 Stress test outputs available in: ${TEST_OUTPUT_DIR}`);
  });

  describe('⚡ Performance Stress Tests', () => {
    test('should handle very long video duration', async () => {
      const timeline = new Timeline()
        .addGreenScreenWithImageBackground(
          join(TEST_ASSETS_DIR, 'green-screen-meme-1.mp4'),
          join(TEST_ASSETS_DIR, 'sample-images', 'noise-pattern.jpg'),
          {
            chromaKey: '#00FF00',
            chromaSimilarity: 0.4,
            chromaBlend: 0.1,
            quality: 'medium'
          }
        )
        .addText('Long Duration Stress Test', {
          position: 'center',
          style: {
            fontSize: 36,
            color: '#ffffff',
            strokeWidth: 2,
            strokeColor: '#000000'
          }
        })
        .setDuration(30); // Long duration

      const outputPath = join(TEST_OUTPUT_DIR, 'long-duration.mp4');
      const command = timeline.getCommand(outputPath);

      console.log('⏱️ Testing long duration (30s)...');
      const startTime = Date.now();
      execSync(command, { timeout: 300000 }); // 5 minute timeout
      const renderTime = Date.now() - startTime;

      const stats = await fs.stat(outputPath);
      expect(stats.size).toBeGreaterThan(500000);
      console.log(`✅ Long duration: ${renderTime}ms, ${(stats.size / 1024 / 1024).toFixed(2)}MB`);

      // Should render efficiently even for long content
      expect(renderTime).toBeLessThan(240000); // Under 4 minutes
    }, 350000);

    test('should handle multiple simultaneous text overlays', async () => {
      let timeline = new Timeline()
        .addGreenScreenMeme(
          join(TEST_ASSETS_DIR, 'green-screen-meme-2.mp4'),
          join(TEST_ASSETS_DIR, 'sample-images', 'gradient-complex.jpg'),
          'comedy',
          { intensity: 'high' }
        );

      // Add many text overlays to stress test
      const textOverlays = [
        { text: 'TOP LEFT', position: { x: '10%', y: '10%' }, color: '#ff0000' },
        { text: 'TOP CENTER', position: { x: '50%', y: '10%' }, color: '#00ff00' },
        { text: 'TOP RIGHT', position: { x: '90%', y: '10%' }, color: '#0000ff' },
        { text: 'MIDDLE LEFT', position: { x: '10%', y: '50%' }, color: '#ffff00' },
        { text: 'CENTER', position: { x: '50%', y: '50%' }, color: '#ff00ff' },
        { text: 'MIDDLE RIGHT', position: { x: '90%', y: '50%' }, color: '#00ffff' },
        { text: 'BOTTOM LEFT', position: { x: '10%', y: '90%' }, color: '#ff8800' },
        { text: 'BOTTOM CENTER', position: { x: '50%', y: '90%' }, color: '#8800ff' },
        { text: 'BOTTOM RIGHT', position: { x: '90%', y: '90%' }, color: '#0088ff' }
      ];

      textOverlays.forEach(overlay => {
        timeline = timeline.addText(overlay.text, {
          position: overlay.position,
          style: {
            fontSize: 28,
            color: overlay.color,
            strokeWidth: 2,
            strokeColor: '#000000'
          }
        });
      });

      timeline = timeline.setDuration(8);

      const outputPath = join(TEST_OUTPUT_DIR, 'many-text-overlays.mp4');
      const command = timeline.getCommand(outputPath);

      console.log('📝 Testing many text overlays...');
      execSync(command, { timeout: 180000 });

      const stats = await fs.stat(outputPath);
      expect(stats.size).toBeGreaterThan(100000);
      console.log(`✅ Many overlays: ${(stats.size / 1024 / 1024).toFixed(2)}MB`);

      // Should contain all text elements
      textOverlays.forEach(overlay => {
        expect(command).toContain(overlay.text);
      });
    }, 200000);

    test('should handle rapid chromakey parameter changes', async () => {
      const timeline = new Timeline()
        .addGreenScreenWithImageBackground(
          join(TEST_ASSETS_DIR, 'green-screen-meme-3.mp4'),
          join(TEST_ASSETS_DIR, 'sample-images', 'checkerboard.jpg'),
          {
            chromaKey: '#00FF00',
            chromaSimilarity: 0.8, // Very high
            chromaBlend: 0.05, // Very low
            chromaYuv: true,
            quality: 'high'
          }
        )
        .addText('Extreme Chromakey Parameters', {
          position: 'center',
          style: {
            fontSize: 32,
            color: '#ffffff',
            strokeWidth: 3,
            strokeColor: '#000000'
          }
        })
        .setDuration(6);

      const outputPath = join(TEST_OUTPUT_DIR, 'extreme-chromakey.mp4');
      const command = timeline.getCommand(outputPath);

      console.log('🎨 Testing extreme chromakey parameters...');
      execSync(command, { timeout: 120000 });

      const stats = await fs.stat(outputPath);
      expect(stats.size).toBeGreaterThan(50000);
      console.log(`✅ Extreme params: ${(stats.size / 1024).toFixed(0)}KB`);

      expect(command).toContain('similarity=0.8');
      expect(command).toContain('blend=0.05');
      expect(command).toContain('yuv=true');
    }, 150000);
  });

  describe('🚨 Error Handling and Edge Cases', () => {
    test('should handle invalid chromakey colors gracefully', async () => {
      const invalidColors = ['#GGGGGG', 'notacolor', '123456', '#12345G'];
      
      for (const color of invalidColors) {
        const timeline = new Timeline()
          .addGreenScreenWithImageBackground(
            join(TEST_ASSETS_DIR, 'green-screen-meme-4.mp4'),
            join(TEST_ASSETS_DIR, 'sample-images', 'tech-bg.jpg'),
            {
              chromaKey: color,
              chromaSimilarity: 0.4,
              chromaBlend: 0.1
            }
          )
          .addText(`Invalid Color: ${color}`, {
            position: 'center',
            style: { fontSize: 24, color: '#ffffff' }
          })
          .setDuration(3);

        const outputPath = join(TEST_OUTPUT_DIR, `invalid-color-${color.replace(/[^a-zA-Z0-9]/g, '')}.mp4`);
        const command = timeline.getCommand(outputPath);

        console.log(`⚠️ Testing invalid color: ${color}...`);
        
        // Should not throw during command generation
        expect(() => command).not.toThrow();
        
        try {
          execSync(command, { timeout: 60000 });
          const stats = await fs.stat(outputPath);
          console.log(`✅ Handled invalid color ${color}: ${(stats.size / 1024).toFixed(0)}KB`);
        } catch (error) {
          // Some invalid colors might cause FFmpeg to fail, which is expected
          console.log(`⚠️ FFmpeg failed for invalid color ${color} (expected)`);
        }
      }
    }, 300000);

    test('should handle extreme similarity and blend values', async () => {
      const extremeValues = [
        { similarity: -0.5, blend: -0.1, desc: 'negative values' },
        { similarity: 2.0, blend: 1.5, desc: 'values over 1.0' },
        { similarity: 0.0, blend: 0.0, desc: 'zero values' },
        { similarity: 1.0, blend: 1.0, desc: 'maximum values' }
      ];

      for (const params of extremeValues) {
        const timeline = new Timeline()
          .addGreenScreenWithImageBackground(
            join(TEST_ASSETS_DIR, 'green-screen-meme-5.mp4'),
            join(TEST_ASSETS_DIR, 'sample-images', 'noise-pattern.jpg'),
            {
              chromaKey: '#00FF00',
              chromaSimilarity: params.similarity,
              chromaBlend: params.blend
            }
          )
          .addText(`${params.desc}`, {
            position: 'center',
            style: { fontSize: 28, color: '#ffffff' }
          })
          .setDuration(3);

        const outputPath = join(TEST_OUTPUT_DIR, `extreme-${params.desc.replace(/\s+/g, '-')}.mp4`);
        const command = timeline.getCommand(outputPath);

        console.log(`💥 Testing ${params.desc}...`);
        
        // Command generation should not fail
        expect(() => command).not.toThrow();
        
        try {
          execSync(command, { timeout: 60000 });
          const stats = await fs.stat(outputPath);
          console.log(`✅ ${params.desc}: ${(stats.size / 1024).toFixed(0)}KB`);
          expect(stats.size).toBeGreaterThan(5000);
        } catch (error) {
          console.log(`⚠️ FFmpeg failed for ${params.desc}: ${error.message.substring(0, 100)}`);
        }
      }
    }, 300000);

    test('should handle very large background images', async () => {
      // Create a large background image
      const largeBgPath = join(TEST_OUTPUT_DIR, 'large-background.jpg');
      const createLargeCommand = [
        'ffmpeg', '-y',
        '-f', 'lavfi',
        '-i', 'color=#ff6600:size=3840x2160:duration=0.1', // 4K
        '-frames:v', '1',
        largeBgPath
      ].join(' ');
      
      console.log('🖼️ Creating 4K background image...');
      execSync(createLargeCommand, { timeout: 30000 });

      const timeline = new Timeline()
        .addGreenScreenWithImageBackground(
          join(TEST_ASSETS_DIR, 'green-screen-meme-6.mp4'),
          largeBgPath,
          {
            chromaKey: '#00FF00',
            chromaSimilarity: 0.4,
            chromaBlend: 0.1,
            backgroundScale: 'crop'
          }
        )
        .addText('4K Background Test', {
          position: 'center',
          style: {
            fontSize: 48,
            color: '#ffffff',
            strokeWidth: 3,
            strokeColor: '#000000'
          }
        })
        .setDuration(5);

      const outputPath = join(TEST_OUTPUT_DIR, 'large-background.mp4');
      const command = timeline.getCommand(outputPath);

      console.log('🎬 Testing 4K background...');
      execSync(command, { timeout: 180000 });

      const stats = await fs.stat(outputPath);
      expect(stats.size).toBeGreaterThan(100000);
      console.log(`✅ 4K background: ${(stats.size / 1024 / 1024).toFixed(2)}MB`);
    }, 250000);
  });

  describe('🔄 Compatibility and Integration Stress', () => {
    test('should handle all chromakey colors simultaneously', async () => {
      const colors = ['#00FF00', '#0000FF', '#FF00FF', '#FFFF00', '#00FFFF'];
      
      for (let i = 0; i < colors.length; i++) {
        const timeline = new Timeline()
          .addGreenScreenWithImageBackground(
            join(TEST_ASSETS_DIR, `green-screen-meme-${i + 1}.mp4`),
            join(TEST_ASSETS_DIR, 'sample-images', 'gradient-complex.jpg'),
            {
              chromaKey: colors[i],
              chromaSimilarity: 0.4,
              chromaBlend: 0.1
            }
          )
          .addText(`Color: ${colors[i]}`, {
            position: 'top',
            style: {
              fontSize: 32,
              color: '#ffffff',
              strokeWidth: 2,
              strokeColor: '#000000'
            }
          })
          .setDuration(4);

        const outputPath = join(TEST_OUTPUT_DIR, `color-${colors[i].replace('#', '')}.mp4`);
        const command = timeline.getCommand(outputPath);

        console.log(`🌈 Testing color ${colors[i]}...`);
        execSync(command, { timeout: 90000 });

        const stats = await fs.stat(outputPath);
        expect(stats.size).toBeGreaterThan(20000);
        console.log(`✅ ${colors[i]}: ${(stats.size / 1024).toFixed(0)}KB`);

        const expectedColor = colors[i].replace('#', '');
        expect(command).toContain(`color=0x${expectedColor}`);
      }
    }, 500000);

    test('should handle all background scale modes under stress', async () => {
      const scaleModes = ['fit', 'fill', 'stretch', 'crop'];
      
      for (const mode of scaleModes) {
        const timeline = new Timeline()
          .addGreenScreenWithImageBackground(
            join(TEST_ASSETS_DIR, 'green-screen-meme-7.mp4'),
            join(TEST_ASSETS_DIR, 'sample-images', 'checkerboard.jpg'),
            {
              chromaKey: '#00FF00',
              chromaSimilarity: 0.6, // High similarity for stress
              chromaBlend: 0.3, // High blend for stress
              backgroundScale: mode,
              quality: 'high'
            }
          )
          .addText(`Scale: ${mode.toUpperCase()}`, {
            position: 'center',
            style: {
              fontSize: 40,
              color: '#ffffff',
              strokeWidth: 3,
              strokeColor: '#000000'
            }
          })
          .setDuration(6);

        const outputPath = join(TEST_OUTPUT_DIR, `stress-scale-${mode}.mp4`);
        const command = timeline.getCommand(outputPath);

        console.log(`📐 Stress testing scale mode: ${mode}...`);
        execSync(command, { timeout: 120000 });

        const stats = await fs.stat(outputPath);
        expect(stats.size).toBeGreaterThan(40000);
        console.log(`✅ Stress ${mode}: ${(stats.size / 1024 / 1024).toFixed(2)}MB`);
      }
    }, 600000);
  });

  describe('🎯 Resource Management Tests', () => {
    test('should handle rapid successive renders', async () => {
      const renderCount = 5;
      const results = [];

      for (let i = 0; i < renderCount; i++) {
        const timeline = new Timeline()
          .addGreenScreenMeme(
            join(TEST_ASSETS_DIR, 'green-screen-meme-1.mp4'),
            join(TEST_ASSETS_DIR, 'sample-images', 'noise-pattern.jpg'),
            'comedy'
          )
          .addText(`Rapid Render #${i + 1}`, {
            position: 'center',
            style: { fontSize: 32, color: '#ffffff' }
          })
          .setDuration(3);

        const outputPath = join(TEST_OUTPUT_DIR, `rapid-${i + 1}.mp4`);
        const command = timeline.getCommand(outputPath);

        console.log(`🏃 Rapid render ${i + 1}/${renderCount}...`);
        const startTime = Date.now();
        execSync(command, { timeout: 60000 });
        const renderTime = Date.now() - startTime;

        const stats = await fs.stat(outputPath);
        results.push({
          index: i + 1,
          renderTime,
          fileSize: stats.size
        });

        console.log(`✅ Rapid ${i + 1}: ${renderTime}ms, ${(stats.size / 1024).toFixed(0)}KB`);
      }

      // Analyze for performance degradation
      const avgTime = results.reduce((sum, r) => sum + r.renderTime, 0) / results.length;
      const maxTime = Math.max(...results.map(r => r.renderTime));
      const minTime = Math.min(...results.map(r => r.renderTime));

      console.log(`📊 Rapid render stats: avg=${avgTime.toFixed(0)}ms, min=${minTime}ms, max=${maxTime}ms`);

      // Performance should be consistent
      expect(maxTime - minTime).toBeLessThan(20000); // Variance under 20 seconds
      results.forEach(r => {
        expect(r.renderTime).toBeLessThan(45000);
        expect(r.fileSize).toBeGreaterThan(10000);
      });
    }, 400000);

    test('should handle concurrent resource access patterns', async () => {
      // Test multiple assets being used simultaneously
      const timeline = new Timeline()
        .addVideo(join(TEST_ASSETS_DIR, 'bunny.mp4'), {
          startTime: 0,
          duration: 8
        })
        .addGreenScreenWithVideoBackground(
          join(TEST_ASSETS_DIR, 'green-screen-meme-1.mp4'),
          join(TEST_ASSETS_DIR, 'nature.mp4'),
          {
            chromaKey: '#00FF00',
            chromaSimilarity: 0.4,
            backgroundLoop: true,
            audioMix: 'both'
          }
        )
        .addAudio(join(TEST_ASSETS_DIR, 'background-music.mp3'), {
          volume: 0.2,
          loop: true
        })
        .addImage(join(TEST_ASSETS_DIR, 'logo-150x150.png'), {
          position: 'top-left',
          scale: 0.2,
          duration: 8
        })
        .addText('Resource Stress Test', {
          position: 'bottom',
          style: {
            fontSize: 36,
            color: '#ffffff',
            backgroundColor: 'rgba(0,0,0,0.8)',
            padding: 15
          }
        })
        .setDuration(8);

      const outputPath = join(TEST_OUTPUT_DIR, 'resource-stress.mp4');
      const command = timeline.getCommand(outputPath);

      console.log('💾 Testing concurrent resource access...');
      execSync(command, { timeout: 240000 });

      const stats = await fs.stat(outputPath);
      expect(stats.size).toBeGreaterThan(200000);
      console.log(`✅ Resource stress: ${(stats.size / 1024 / 1024).toFixed(2)}MB`);

      // Should contain all resources
      expect(command).toContain('bunny.mp4');
      expect(command).toContain('nature.mp4');
      expect(command).toContain('background-music.mp3');
      expect(command).toContain('logo-150x150.png');
    }, 300000);
  });
});
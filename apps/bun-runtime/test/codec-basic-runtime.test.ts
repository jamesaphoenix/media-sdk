/**
 * @fileoverview Basic Runtime Tests for Codec Configuration
 * 
 * Simple tests to verify codec integration works with FFmpeg
 */

import { describe, it, expect, beforeAll } from 'bun:test';
import { promises as fs } from 'fs';
import { join } from 'path';
import { Timeline } from '../../../packages/media-sdk/src/timeline/timeline.js';
import { execSync } from 'child_process';

const TEST_ASSETS_DIR = join(import.meta.dir, '..', 'assets');
const TEST_OUTPUT_DIR = join(import.meta.dir, '..', 'output');

describe('🎬 Basic Codec Runtime Tests', () => {
  beforeAll(async () => {
    // Ensure directories exist
    await fs.mkdir(TEST_OUTPUT_DIR, { recursive: true });
    await fs.mkdir(TEST_ASSETS_DIR, { recursive: true });

    // Create test video if it doesn't exist
    const testVideoPath = join(TEST_ASSETS_DIR, 'test-codec-basic.mp4');
    try {
      await fs.access(testVideoPath);
    } catch {
      console.log('📹 Creating basic test video...');
      
      // Create a simple test video using FFmpeg
      const createVideoCommand = [
        'ffmpeg', '-y',
        '-f', 'lavfi',
        '-i', 'testsrc2=duration=5:size=640x480:rate=30',
        '-f', 'lavfi', 
        '-i', 'sine=frequency=440:duration=5',
        '-c:v', 'libx264', '-preset', 'ultrafast', '-crf', '28',
        '-c:a', 'aac', '-b:a', '64k',
        testVideoPath
      ].join(' ');
      
      execSync(createVideoCommand);
      console.log('✅ Basic test video created');
    }
  });

  it('should generate valid FFmpeg command with codec configuration', () => {
    const timeline = new Timeline()
      .addVideo(join(TEST_ASSETS_DIR, 'test-codec-basic.mp4'))
      .setDuration(3)
      .setVideoCodec('libx264', {
        preset: 'fast',
        crf: 25,
        profile: 'high'
      })
      .setAudioCodec('aac', {
        bitrate: '128k'
      });

    const command = timeline.getCommand(join(TEST_OUTPUT_DIR, 'codec-test-basic.mp4'));

    // Check that codec settings are in the command
    expect(command).toContain('-c:v libx264');
    expect(command).toContain('-preset fast');
    expect(command).toContain('-crf 25');
    expect(command).toContain('-profile:v high');
    expect(command).toContain('-c:a aac');
    expect(command).toContain('-b:a 128k');

    console.log('📋 Generated command:', command);
  });

  it('should apply preset configurations correctly', () => {
    const timeline = new Timeline()
      .addVideo(join(TEST_ASSETS_DIR, 'test-codec-basic.mp4'))
      .setDuration(3)
      .useCodecPreset('streaming');

    const command = timeline.getCommand(join(TEST_OUTPUT_DIR, 'codec-preset.mp4'));

    // Check streaming preset values
    expect(command).toContain('-c:v libx264');
    expect(command).toContain('-preset veryfast');
    expect(command).toContain('-crf 23');
    expect(command).toContain('-profile:v main');
    expect(command).toContain('-tune zerolatency');
    expect(command).toContain('-c:a aac');
    expect(command).toContain('-b:a 128k');

    console.log('📋 Streaming preset command:', command);
  });

  it('should execute FFmpeg with custom codec settings', async () => {
    const timeline = new Timeline()
      .addVideo(join(TEST_ASSETS_DIR, 'test-codec-basic.mp4'))
      .setDuration(3)
      .setVideoCodec('libx264', {
        preset: 'ultrafast',
        crf: 30
      });

    const outputPath = join(TEST_OUTPUT_DIR, 'codec-runtime-test.mp4');
    const command = timeline.getCommand(outputPath);

    console.log('🔧 Executing:', command);

    // Execute the command
    try {
      execSync(command, { timeout: 30000 });
      
      // Verify output file exists and has reasonable size
      const stats = await fs.stat(outputPath);
      expect(stats.size).toBeGreaterThan(1000);
      
      console.log(`✅ Created ${(stats.size / 1024).toFixed(1)}KB file`);

      // Verify codec used with ffprobe
      const probeCommand = `ffprobe -v quiet -select_streams v:0 -show_entries stream=codec_name,profile -of csv=p=0 "${outputPath}"`;
      const probeResult = execSync(probeCommand, { encoding: 'utf8' });
      
      expect(probeResult).toContain('h264');
      console.log('📊 Codec verification:', probeResult.trim());
      
    } catch (error) {
      console.error('❌ FFmpeg execution failed:', error);
      throw error;
    }
  });

  it('should execute with platform presets', async () => {
    const timeline = new Timeline()
      .addVideo(join(TEST_ASSETS_DIR, 'test-codec-basic.mp4'))
      .setAspectRatio('9:16')
      .setDuration(3)
      .useCodecPreset('tiktok');

    const outputPath = join(TEST_OUTPUT_DIR, 'codec-tiktok-test.mp4');
    const command = timeline.getCommand(outputPath);

    console.log('🎵 TikTok command:', command);

    try {
      execSync(command, { timeout: 30000 });
      
      const stats = await fs.stat(outputPath);
      expect(stats.size).toBeGreaterThan(500);
      
      // Check aspect ratio
      const probeCommand = `ffprobe -v quiet -select_streams v:0 -show_entries stream=width,height -of csv=p=0 "${outputPath}"`;
      const probeResult = execSync(probeCommand, { encoding: 'utf8' });
      const [width, height] = probeResult.trim().split(',').map(Number);
      
      expect(height / width).toBeCloseTo(16 / 9, 0.1);
      console.log(`📐 Aspect ratio: ${width}x${height} (${(height/width).toFixed(2)}:1)`);
      
    } catch (error) {
      console.error('❌ TikTok preset failed:', error);
      throw error;
    }
  });

  it('should handle file size optimization', async () => {
    const timeline = new Timeline()
      .addVideo(join(TEST_ASSETS_DIR, 'test-codec-basic.mp4'))
      .setDuration(3)
      .optimizeForFileSize(1, true); // 1MB target

    const outputPath = join(TEST_OUTPUT_DIR, 'codec-filesize-test.mp4');
    const command = timeline.getCommand(outputPath);

    console.log('📦 File size optimization:', command);

    try {
      execSync(command, { timeout: 30000 });
      
      const stats = await fs.stat(outputPath);
      const sizeMB = stats.size / (1024 * 1024);
      
      // Should be relatively close to target
      expect(sizeMB).toBeLessThan(2); // Allow some tolerance
      console.log(`📏 Target: 1MB, Actual: ${sizeMB.toFixed(2)}MB`);
      
    } catch (error) {
      console.error('❌ File size optimization failed:', error);
      throw error;
    }
  });

  it('should handle hardware acceleration flag (may fail gracefully)', async () => {
    const timeline = new Timeline()
      .addVideo(join(TEST_ASSETS_DIR, 'test-codec-basic.mp4'))
      .setDuration(2)
      .setHardwareAcceleration('auto');

    const outputPath = join(TEST_OUTPUT_DIR, 'codec-hwaccel-test.mp4');
    const command = timeline.getCommand(outputPath);

    expect(command).toContain('-hwaccel auto');
    console.log('⚡ Hardware acceleration command:', command);

    try {
      execSync(command, { timeout: 30000 });
      
      const stats = await fs.stat(outputPath);
      expect(stats.size).toBeGreaterThan(500);
      console.log('✅ Hardware acceleration succeeded');
      
    } catch (error) {
      console.log('ℹ️ Hardware acceleration not available (expected in CI)');
      // This is expected to fail in CI/containers
    }
  });

  it('should verify codec compatibility checking', () => {
    const timeline = new Timeline()
      .addVideo(join(TEST_ASSETS_DIR, 'test-codec-basic.mp4'))
      .setVideoCodec('libx264')
      .setAudioCodec('aac');

    // MP4 should be compatible
    const mp4Check = timeline.checkCodecCompatibility('mp4');
    expect(mp4Check.compatible).toBe(true);
    expect(mp4Check.warnings).toHaveLength(0);

    // Test incompatible combination
    const incompatibleTimeline = new Timeline()
      .addVideo(join(TEST_ASSETS_DIR, 'test-codec-basic.mp4'))
      .setVideoCodec('libvpx-vp9')
      .setAudioCodec('libvorbis');

    const incompatibleCheck = incompatibleTimeline.checkCodecCompatibility('mp4');
    expect(incompatibleCheck.compatible).toBe(false);
    expect(incompatibleCheck.warnings.length).toBeGreaterThan(0);

    console.log('🔍 Compatibility check passed');
  });
});
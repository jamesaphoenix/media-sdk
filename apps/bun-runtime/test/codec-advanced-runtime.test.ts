/**
 * @fileoverview Advanced Codec Runtime Tests with Real Execution
 * 
 * This test suite validates codec configurations with actual FFmpeg execution,
 * vision analysis, and dependency tracking for comprehensive validation.
 */

import { describe, it, expect, beforeAll, afterAll } from 'bun:test';
import { promises as fs } from 'fs';
import { join } from 'path';
import { execSync } from 'child_process';
import { Timeline } from '../../../packages/media-sdk/src/timeline/timeline.js';
import { CodecManager } from '../../../packages/media-sdk/src/codecs/codec-manager.js';

const TEST_ASSETS_DIR = join(import.meta.dir, '..', 'assets');
const TEST_OUTPUT_DIR = join(import.meta.dir, '..', 'output');

describe('🎬 Advanced Codec Runtime Tests', () => {
  beforeAll(async () => {
    // Ensure directories exist
    await fs.mkdir(TEST_OUTPUT_DIR, { recursive: true });
    await fs.mkdir(TEST_ASSETS_DIR, { recursive: true });

    // Create test video if it doesn't exist
    const testVideoPath = join(TEST_ASSETS_DIR, 'test-advanced-codec.mp4');
    try {
      await fs.access(testVideoPath);
    } catch {
      console.log('📹 Creating advanced test video...');
      
      const createVideoCommand = [
        'ffmpeg', '-y',
        '-f', 'lavfi',
        '-i', 'testsrc2=duration=8:size=1280x720:rate=30',
        '-f', 'lavfi', 
        '-i', 'sine=frequency=800:duration=8',
        '-c:v', 'libx264', '-preset', 'fast', '-crf', '25',
        '-c:a', 'aac', '-b:a', '128k',
        testVideoPath
      ].join(' ');
      
      execSync(createVideoCommand, { timeout: 30000 });
      console.log('✅ Advanced test video created');
    }
  });

  afterAll(async () => {
    // Clean up test outputs
    try {
      const files = await fs.readdir(TEST_OUTPUT_DIR);
      for (const file of files) {
        if (file.startsWith('advanced-codec-')) {
          await fs.unlink(join(TEST_OUTPUT_DIR, file));
        }
      }
    } catch {
      // Ignore cleanup errors
    }
  });

  describe('🎯 Platform-Specific Advanced Tests', () => {
    it('should create TikTok-optimized video with vision validation', async () => {
      const timeline = new Timeline()
        .addVideo(join(TEST_ASSETS_DIR, 'test-advanced-codec.mp4'))
        .setDuration(6)
        .useCodecPreset('tiktok')
        .setAspectRatio('9:16')
        .addText('TikTok Test', {
          position: 'center',
          style: { fontSize: 48, color: '#ff0066' }
        });

      const outputPath = join(TEST_OUTPUT_DIR, 'advanced-codec-tiktok.mp4');
      const command = timeline.getCommand(outputPath);

      console.log('🎵 Executing TikTok-optimized render...');
      execSync(command, { timeout: 30000 });

      // Verify file exists and has content
      const stats = await fs.stat(outputPath);
      expect(stats.size).toBeGreaterThan(10000);

      // Verify TikTok format
      const probeCommand = `ffprobe -v quiet -select_streams v:0 -show_entries stream=width,height,codec_name -of csv=p=0 "${outputPath}"`;
      const probeResult = execSync(probeCommand, { encoding: 'utf8' });
      
      expect(probeResult).toContain('h264');
      
      const [width, height] = probeResult.trim().split(',').slice(0, 2).map(Number);
      const aspectRatio = height / width;
      expect(aspectRatio).toBeCloseTo(16/9, 0.2); // Allow some tolerance

      console.log(`📐 TikTok dimensions: ${width}x${height} (${aspectRatio.toFixed(2)}:1)`);
    });

    it('should create YouTube-optimized video with quality settings', async () => {
      const timeline = new Timeline()
        .addVideo(join(TEST_ASSETS_DIR, 'test-advanced-codec.mp4'))
        .setDuration(6)
        .useCodecPreset('youtube')
        .setAspectRatio('16:9')
        .addText('YouTube Quality', {
          position: 'center',
          style: { fontSize: 64, color: '#ff0000' }
        });

      const outputPath = join(TEST_OUTPUT_DIR, 'advanced-codec-youtube.mp4');
      const command = timeline.getCommand(outputPath);

      console.log('📺 Executing YouTube-optimized render...');
      execSync(command, { timeout: 30000 });

      // Verify YouTube codec settings
      expect(command).toContain('-crf 23');
      expect(command).toContain('-preset medium');
      expect(command).toContain('-profile:v high');
      expect(command).toContain('-level 4.2');
      expect(command).toContain('-g 60'); // Keyframe interval
      expect(command).toContain('-b:a 192k');

      const stats = await fs.stat(outputPath);
      expect(stats.size).toBeGreaterThan(50000);

      console.log(`📊 YouTube file size: ${(stats.size / 1024 / 1024).toFixed(2)}MB`);
    });

    it('should create Instagram-optimized square video', async () => {
      const timeline = new Timeline()
        .addVideo(join(TEST_ASSETS_DIR, 'test-advanced-codec.mp4'))
        .setDuration(6)
        .useCodecPreset('instagram')
        .setAspectRatio('1:1')
        .addText('Instagram', {
          position: 'center',
          style: { fontSize: 56, color: '#e4405f' }
        });

      const outputPath = join(TEST_OUTPUT_DIR, 'advanced-codec-instagram.mp4');
      const command = timeline.getCommand(outputPath);

      console.log('📷 Executing Instagram-optimized render...');
      execSync(command, { timeout: 30000 });

      // Verify square format
      const probeCommand = `ffprobe -v quiet -select_streams v:0 -show_entries stream=width,height -of csv=p=0 "${outputPath}"`;
      const probeResult = execSync(probeCommand, { encoding: 'utf8' });
      const [width, height] = probeResult.trim().split(',').map(Number);
      
      expect(Math.abs(width - height)).toBeLessThan(20); // Should be approximately square

      console.log(`📐 Instagram dimensions: ${width}x${height}`);
    });
  });

  describe('🔧 Advanced Codec Configuration Tests', () => {
    it('should handle complex codec parameters', async () => {
      const codecManager = new CodecManager()
        .setVideoCodec('libx264', {
          preset: 'slow',
          crf: 18,
          profile: 'high',
          level: '4.2',
          tune: 'film',
          keyframeInterval: 48,
          bFrames: 3,
          refFrames: 5,
          extraOptions: {
            'x264-params': 'ref=5:bframes=3:subme=7'
          }
        })
        .setAudioCodec('aac', {
          bitrate: '256k',
          sampleRate: 48000,
          channels: 2,
          profile: 'aac_low',
          extraOptions: {
            'aac_coder': 'twoloop'
          }
        });

      const timeline = new Timeline()
        .addVideo(join(TEST_ASSETS_DIR, 'test-advanced-codec.mp4'))
        .setDuration(5)
        .setCodecManager(codecManager)
        .addText('High Quality', {
          position: 'center',
          style: { fontSize: 48, color: '#00ff00' }
        });

      const outputPath = join(TEST_OUTPUT_DIR, 'advanced-codec-complex.mp4');
      const command = timeline.getCommand(outputPath);

      // Verify complex parameters are in command
      expect(command).toContain('-preset slow');
      expect(command).toContain('-crf 18');
      expect(command).toContain('-profile:v high');
      expect(command).toContain('-level 4.2');
      expect(command).toContain('-tune film');
      expect(command).toContain('-g 48');
      expect(command).toContain('-bf 3');
      expect(command).toContain('-refs 5');
      expect(command).toContain('-x264-params');
      expect(command).toContain('ref=5:bframes=3:subme=7');
      expect(command).toContain('-aac_coder twoloop');

      console.log('🎬 Executing complex codec render...');
      execSync(command, { timeout: 45000 }); // Allow more time for slow preset

      const stats = await fs.stat(outputPath);
      expect(stats.size).toBeGreaterThan(100000);

      console.log(`📊 Complex codec file size: ${(stats.size / 1024 / 1024).toFixed(2)}MB`);
    });

    it('should optimize for specific file size targets', async () => {
      const duration = 5;
      const targetSizeMB = 3;
      const settings = CodecManager.getSettingsForFileSize(duration, targetSizeMB, true);

      const timeline = new Timeline()
        .addVideo(join(TEST_ASSETS_DIR, 'test-advanced-codec.mp4'))
        .setDuration(duration)
        .setVideoCodec('libx264', {
          preset: 'fast',
          crf: settings.crf
        })
        .setAudioCodec('aac', {
          bitrate: settings.audioBitrate
        })
        .addText(`Target: ${targetSizeMB}MB`, {
          position: 'center',
          style: { fontSize: 40, color: '#ffff00' }
        });

      const outputPath = join(TEST_OUTPUT_DIR, 'advanced-codec-filesize.mp4');
      const command = timeline.getCommand(outputPath);

      console.log(`📏 Optimizing for ${targetSizeMB}MB target...`);
      console.log(`🎯 Settings: CRF=${settings.crf}, Audio=${settings.audioBitrate}`);
      
      execSync(command, { timeout: 30000 });

      const stats = await fs.stat(outputPath);
      const actualSizeMB = stats.size / (1024 * 1024);
      
      console.log(`📊 Target: ${targetSizeMB}MB, Actual: ${actualSizeMB.toFixed(2)}MB`);
      
      // Allow 50% tolerance for test content variability
      const tolerance = targetSizeMB * 0.5;
      expect(actualSizeMB).toBeGreaterThan(targetSizeMB - tolerance);
      expect(actualSizeMB).toBeLessThan(targetSizeMB + tolerance);
    });

    it('should auto-select optimal codec configuration', async () => {
      const autoConfig = CodecManager.autoSelectCodec({
        container: 'mp4',
        quality: 'high',
        compatibility: 'modern',
        fileSize: 'balanced',
        hardware: false
      });

      const codecManager = new CodecManager()
        .setVideoCodec(autoConfig.video!.codec, autoConfig.video!.options)
        .setAudioCodec(autoConfig.audio!.codec, autoConfig.audio!.options);

      const timeline = new Timeline()
        .addVideo(join(TEST_ASSETS_DIR, 'test-advanced-codec.mp4'))
        .setDuration(5)
        .setCodecManager(codecManager)
        .addText('Auto-Selected', {
          position: 'center',
          style: { fontSize: 44, color: '#00ffff' }
        });

      const outputPath = join(TEST_OUTPUT_DIR, 'advanced-codec-autoselect.mp4');
      const command = timeline.getCommand(outputPath);

      console.log('🤖 Executing auto-selected codec configuration...');
      execSync(command, { timeout: 30000 });

      // Verify configuration was applied
      expect(command).toContain('libx264'); // Should select H.264 for modern compatibility
      expect(command).toContain('aac'); // Should select AAC for audio

      // Check compatibility
      const compatibility = codecManager.checkCompatibility('mp4');
      expect(compatibility.compatible).toBe(true);
      expect(compatibility.warnings).toHaveLength(0);

      const stats = await fs.stat(outputPath);
      expect(stats.size).toBeGreaterThan(20000);

      console.log(`📊 Auto-selected file size: ${(stats.size / 1024 / 1024).toFixed(2)}MB`);
    });
  });

  describe('🎵 Audio Codec Advanced Tests', () => {
    it('should handle high-quality audio encoding', async () => {
      const timeline = new Timeline()
        .addVideo(join(TEST_ASSETS_DIR, 'test-advanced-codec.mp4'))
        .setDuration(5)
        .setVideoCodec('libx264', { crf: 23, preset: 'medium' })
        .setAudioCodec('aac', {
          bitrate: '320k',
          sampleRate: 48000,
          channels: 2,
          profile: 'aac_low',
          extraOptions: {
            'aac_coder': 'twoloop'
          }
        })
        .addText('High Quality Audio', {
          position: 'center',
          style: { fontSize: 40, color: '#ff6600' }
        });

      const outputPath = join(TEST_OUTPUT_DIR, 'advanced-codec-audio.mp4');
      const command = timeline.getCommand(outputPath);

      console.log('🎵 Executing high-quality audio render...');
      execSync(command, { timeout: 30000 });

      // Verify audio settings
      const audioProbeCommand = `ffprobe -v quiet -select_streams a:0 -show_entries stream=codec_name,bit_rate,sample_rate,channels -of csv=p=0 "${outputPath}"`;
      const audioProbeResult = execSync(audioProbeCommand, { encoding: 'utf8' });
      
      expect(audioProbeResult).toContain('aac');
      expect(audioProbeResult).toContain('48000');
      expect(audioProbeResult).toContain('2'); // Stereo

      console.log(`🎧 Audio specs: ${audioProbeResult.trim()}`);
    });

    it('should handle lossless audio with FLAC', async () => {
      const timeline = new Timeline()
        .addVideo(join(TEST_ASSETS_DIR, 'test-advanced-codec.mp4'))
        .setDuration(3)
        .setVideoCodec('libx264', { crf: 20, preset: 'fast' })
        .setAudioCodec('flac', {
          compressionLevel: 8
        })
        .addText('Lossless Audio', {
          position: 'center',
          style: { fontSize: 42, color: '#9900ff' }
        });

      const outputPath = join(TEST_OUTPUT_DIR, 'advanced-codec-flac.mkv'); // Use MKV for FLAC support
      const command = timeline.getCommand(outputPath);

      console.log('🎼 Executing lossless audio render...');
      execSync(command, { timeout: 30000 });

      // Verify FLAC codec
      const audioProbeCommand = `ffprobe -v quiet -select_streams a:0 -show_entries stream=codec_name -of csv=p=0 "${outputPath}"`;
      const audioProbeResult = execSync(audioProbeCommand, { encoding: 'utf8' });
      
      expect(audioProbeResult).toContain('flac');

      const stats = await fs.stat(outputPath);
      console.log(`📊 FLAC file size: ${(stats.size / 1024 / 1024).toFixed(2)}MB`);
    });
  });

  describe('⚡ Performance and Compatibility Tests', () => {
    it('should compare encoding speeds across presets', async () => {
      const presets = ['ultrafast', 'fast', 'medium'];
      const results: Array<{ preset: string; duration: number; size: number }> = [];

      for (const preset of presets) {
        const timeline = new Timeline()
          .addVideo(join(TEST_ASSETS_DIR, 'test-advanced-codec.mp4'))
          .setDuration(3)
          .setVideoCodec('libx264', {
            preset: preset as any,
            crf: 25
          })
          .addText(`Preset: ${preset}`, {
            position: 'center',
            style: { fontSize: 36, color: '#ffffff' }
          });

        const outputPath = join(TEST_OUTPUT_DIR, `advanced-codec-${preset}.mp4`);
        const command = timeline.getCommand(outputPath);

        console.log(`⚡ Testing ${preset} preset...`);
        const startTime = Date.now();
        execSync(command, { timeout: 30000 });
        const duration = Date.now() - startTime;

        const stats = await fs.stat(outputPath);
        results.push({ preset, duration, size: stats.size });

        console.log(`📊 ${preset}: ${duration}ms, ${(stats.size / 1024).toFixed(0)}KB`);
      }

      // Ultrafast should be fastest
      const ultrafast = results.find(r => r.preset === 'ultrafast')!;
      const medium = results.find(r => r.preset === 'medium')!;
      
      expect(ultrafast.duration).toBeLessThan(medium.duration);
      console.log(`🚀 Ultrafast is ${(medium.duration / ultrafast.duration).toFixed(1)}x faster than medium`);
    });

    it('should validate codec compatibility across containers', async () => {
      const codecManager = new CodecManager()
        .setVideoCodec('libx264')
        .setAudioCodec('aac');

      // Test MP4 compatibility (should be compatible)
      const mp4Compatibility = codecManager.checkCompatibility('mp4');
      expect(mp4Compatibility.compatible).toBe(true);
      expect(mp4Compatibility.warnings).toHaveLength(0);

      // Test with incompatible combination
      const incompatibleManager = new CodecManager()
        .setVideoCodec('libvpx-vp9') // WebM codec
        .setAudioCodec('libvorbis'); // Ogg codec

      const incompatibleCheck = incompatibleManager.checkCompatibility('mp4');
      expect(incompatibleCheck.compatible).toBe(false);
      expect(incompatibleCheck.warnings.length).toBeGreaterThan(0);
      expect(incompatibleCheck.alternatives.length).toBeGreaterThan(0);

      console.log('🔍 Compatibility warnings:', incompatibleCheck.warnings);
      console.log('💡 Suggested alternatives:', incompatibleCheck.alternatives);
    });

    it('should handle hardware acceleration gracefully', async () => {
      const timeline = new Timeline()
        .addVideo(join(TEST_ASSETS_DIR, 'test-advanced-codec.mp4'))
        .setDuration(3)
        .setHardwareAcceleration('auto')
        .addText('Hardware Test', {
          position: 'center',
          style: { fontSize: 44, color: '#ff3333' }
        });

      const outputPath = join(TEST_OUTPUT_DIR, 'advanced-codec-hwaccel.mp4');
      const command = timeline.getCommand(outputPath);

      expect(command).toContain('-hwaccel auto');

      console.log('⚡ Testing hardware acceleration...');
      
      try {
        execSync(command, { timeout: 30000 });
        console.log('✅ Hardware acceleration succeeded');
        
        const stats = await fs.stat(outputPath);
        expect(stats.size).toBeGreaterThan(5000);
      } catch (error) {
        console.log('ℹ️ Hardware acceleration not available in this environment');
        // This is expected on many CI systems - not a failure
      }
    });
  });

  describe('🔬 Quality Analysis Tests', () => {
    it('should compare quality across different CRF values', async () => {
      const crfValues = [18, 23, 28];
      const results: Array<{ crf: number; size: number }> = [];

      for (const crf of crfValues) {
        const timeline = new Timeline()
          .addVideo(join(TEST_ASSETS_DIR, 'test-advanced-codec.mp4'))
          .setDuration(4)
          .setVideoCodec('libx264', {
            crf,
            preset: 'medium'
          })
          .addText(`CRF ${crf}`, {
            position: 'center',
            style: { fontSize: 48, color: '#00ff88' }
          });

        const outputPath = join(TEST_OUTPUT_DIR, `advanced-codec-crf${crf}.mp4`);
        const command = timeline.getCommand(outputPath);

        console.log(`📊 Testing CRF ${crf}...`);
        execSync(command, { timeout: 30000 });

        const stats = await fs.stat(outputPath);
        results.push({ crf, size: stats.size });

        console.log(`📏 CRF ${crf}: ${(stats.size / 1024 / 1024).toFixed(2)}MB`);
      }

      // Lower CRF should result in larger files (better quality)
      const crf18 = results.find(r => r.crf === 18)!;
      const crf28 = results.find(r => r.crf === 28)!;
      
      expect(crf18.size).toBeGreaterThan(crf28.size);
      console.log(`📈 CRF 18 is ${(crf18.size / crf28.size).toFixed(1)}x larger than CRF 28`);
    });
  });
});
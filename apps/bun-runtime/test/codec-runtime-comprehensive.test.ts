/**
 * @fileoverview Comprehensive Runtime Tests for Codec Configuration
 * 
 * These tests verify that codec configurations work correctly with real FFmpeg
 * execution, using cassettes for performance and Gemini Vision for validation.
 */

import { describe, it, expect, beforeAll, afterAll } from 'bun:test';
import { promises as fs } from 'fs';
import { join } from 'path';
import { Timeline } from '../../../packages/media-sdk/src/timeline/timeline.js';
import { CodecManager } from '../../../packages/media-sdk/src/codecs/codec-manager.js';
import { EnhancedBunCassetteManager } from '../src/enhanced-cassette-manager.js';
import { CassetteDependencyTracker } from '../src/dependency-tracker.js';
import { VisionRuntimeValidator } from '../src/vision-runtime-validator.js';
import { MediaAnalysisService } from '../../../packages/media-sdk/src/services/media-analysis.js';
import { execSync } from 'child_process';

const TEST_ASSETS_DIR = join(import.meta.dir, '..', 'assets');
const TEST_OUTPUT_DIR = join(import.meta.dir, '..', 'output');
const CASSETTES_DIR = join(import.meta.dir, '..', 'cassettes');

describe('🎬 Codec Runtime Tests with FFmpeg + Gemini Analysis', () => {
  let cassetteManager: EnhancedBunCassetteManager;
  let dependencyTracker: CassetteDependencyTracker;
  let visionValidator: VisionRuntimeValidator;
  let mediaAnalysis: MediaAnalysisService;

  beforeAll(async () => {
    // Ensure directories exist
    await fs.mkdir(TEST_OUTPUT_DIR, { recursive: true });
    await fs.mkdir(CASSETTES_DIR, { recursive: true });

    // Initialize services
    cassetteManager = new EnhancedBunCassetteManager(CASSETTES_DIR);
    dependencyTracker = new CassetteDependencyTracker();
    visionValidator = new VisionRuntimeValidator();

    // Initialize media analysis if API key is available
    if (process.env.GEMINI_API_KEY && process.env.GEMINI_API_KEY !== 'test-api-key') {
      mediaAnalysis = new MediaAnalysisService(process.env.GEMINI_API_KEY);
    }

    // Create test video if it doesn't exist
    const testVideoPath = join(TEST_ASSETS_DIR, 'test-codec-input.mp4');
    try {
      await fs.access(testVideoPath);
    } catch {
      console.log('📹 Creating test video for codec tests...');
      await fs.mkdir(TEST_ASSETS_DIR, { recursive: true });
      
      // Create a simple test video using FFmpeg
      const createVideoCommand = [
        'ffmpeg', '-y',
        '-f', 'lavfi',
        '-i', 'testsrc2=duration=10:size=1920x1080:rate=30',
        '-f', 'lavfi',
        '-i', 'sine=frequency=1000:duration=10',
        '-c:v', 'libx264', '-preset', 'ultrafast', '-crf', '28',
        '-c:a', 'aac', '-b:a', '128k',
        testVideoPath
      ].join(' ');
      
      execSync(createVideoCommand);
      console.log('✅ Test video created');
    }
  });

  afterAll(async () => {
    // Clean up output files but keep assets
    try {
      const files = await fs.readdir(TEST_OUTPUT_DIR);
      for (const file of files) {
        if (file.startsWith('codec-test-')) {
          await fs.unlink(join(TEST_OUTPUT_DIR, file));
        }
      }
    } catch (error) {
      // Ignore cleanup errors
    }
  });

  describe('🔧 Basic Codec Configuration Tests', () => {
    it('should render with H.264 codec configuration', async () => {
      const timeline = new Timeline()
        .addVideo(join(TEST_ASSETS_DIR, 'test-codec-input.mp4'))
        .setDuration(5)
        .setVideoCodec('libx264', {
          preset: 'fast',
          crf: 25,
          profile: 'high'
        })
        .setAudioCodec('aac', {
          bitrate: '128k',
          sampleRate: 44100
        });

      const outputPath = join(TEST_OUTPUT_DIR, 'codec-test-h264.mp4');
      const command = timeline.getCommand(outputPath);

      // Register dependencies for cassette invalidation
      dependencyTracker.registerCassette('codec-h264', [
        '../../../packages/media-sdk/src/timeline/timeline.ts',
        '../../../packages/media-sdk/src/codecs/codec-manager.ts'
      ]);

      // Execute with cassette caching
      const result = await cassetteManager.executeCommand(command, 'codec-h264');

      expect(result.success).toBe(true);
      expect(result.stderr).not.toContain('Error');

      // Verify output file exists
      const stats = await fs.stat(outputPath);
      expect(stats.size).toBeGreaterThan(1000);

      // Verify codec configuration with ffprobe
      const probeCommand = `ffprobe -v quiet -select_streams v:0 -show_entries stream=codec_name,profile,width,height -of csv=p=0 "${outputPath}"`;
      const probeResult = execSync(probeCommand, { encoding: 'utf8' });
      
      expect(probeResult).toContain('h264');
      expect(probeResult).toContain('High');

      // Audio codec verification
      const audioProbeCommand = `ffprobe -v quiet -select_streams a:0 -show_entries stream=codec_name,bit_rate -of csv=p=0 "${outputPath}"`;
      const audioProbeResult = execSync(audioProbeCommand, { encoding: 'utf8' });
      
      expect(audioProbeResult).toContain('aac');

      // Vision analysis if available
      if (mediaAnalysis) {
        console.log('🔍 Running Gemini analysis on H.264 output...');
        const analysis = await mediaAnalysis.analyzeMedia(outputPath, {
          analysisTypes: ['technical', 'quality'],
          targetPlatform: 'general'
        });

        expect(analysis.mediaType).toBe('video');
        expect(analysis.primary.quality.technical).toBeGreaterThan(0.5);
        expect(analysis.video?.duration).toBeGreaterThan(0);

        console.log(`📊 H.264 Quality Score: ${analysis.primary.quality.overall}`);
      }
    });

    it('should render with H.265 codec configuration', async () => {
      const timeline = new Timeline()
        .addVideo(join(TEST_ASSETS_DIR, 'test-codec-input.mp4'))
        .setDuration(5)
        .setVideoCodec('libx265', {
          preset: 'medium',
          crf: 22,
          profile: 'main'
        })
        .setAudioCodec('libopus', {
          bitrate: '160k',
          vbr: true
        });

      const outputPath = join(TEST_OUTPUT_DIR, 'codec-test-h265.mp4');
      const command = timeline.getCommand(outputPath);

      dependencyTracker.registerCassette('codec-h265', [
        '../../../packages/media-sdk/src/timeline/timeline.ts',
        '../../../packages/media-sdk/src/codecs/codec-manager.ts'
      ]);

      const result = await cassetteManager.executeCommand(command, 'codec-h265');

      expect(result.success).toBe(true);

      // Verify H.265 codec
      const probeCommand = `ffprobe -v quiet -select_streams v:0 -show_entries stream=codec_name,profile -of csv=p=0 "${outputPath}"`;
      const probeResult = execSync(probeCommand, { encoding: 'utf8' });
      
      expect(probeResult).toContain('hevc');
      expect(probeResult).toContain('Main');

      if (mediaAnalysis) {
        console.log('🔍 Running Gemini analysis on H.265 output...');
        const analysis = await mediaAnalysis.analyzeMedia(outputPath);
        
        expect(analysis.primary.quality.technical).toBeGreaterThan(0.5);
        console.log(`📊 H.265 Quality Score: ${analysis.primary.quality.overall}`);
      }
    });

    it('should apply preset configurations correctly', async () => {
      const timeline = new Timeline()
        .addVideo(join(TEST_ASSETS_DIR, 'test-codec-input.mp4'))
        .setDuration(5)
        .useCodecPreset('youtube');

      const outputPath = join(TEST_OUTPUT_DIR, 'codec-test-youtube-preset.mp4');
      const command = timeline.getCommand(outputPath);

      dependencyTracker.registerCassette('codec-youtube-preset', [
        '../../../packages/media-sdk/src/codecs/codec-manager.ts'
      ]);

      const result = await cassetteManager.executeCommand(command, 'codec-youtube-preset');

      expect(result.success).toBe(true);

      // Verify preset applied correctly
      expect(command).toContain('-crf 23');
      expect(command).toContain('-preset medium');
      expect(command).toContain('-profile:v high');
      expect(command).toContain('-level 4.2');
      expect(command).toContain('-g 60');  // keyframe interval
      expect(command).toContain('-b:a 192k');

      if (mediaAnalysis) {
        const analysis = await mediaAnalysis.analyzeMedia(outputPath, {
          targetPlatform: 'youtube'
        });
        
        expect(analysis.platformOptimization.youtube.score).toBeGreaterThan(0.7);
      }
    });

    it('should optimize for file size correctly', async () => {
      const timeline = new Timeline()
        .addVideo(join(TEST_ASSETS_DIR, 'test-codec-input.mp4'))
        .setDuration(5)
        .optimizeForFileSize(10, true);  // 10MB target

      const outputPath = join(TEST_OUTPUT_DIR, 'codec-test-filesize.mp4');
      const command = timeline.getCommand(outputPath);

      dependencyTracker.registerCassette('codec-filesize', [
        '../../../packages/media-sdk/src/codecs/codec-manager.ts'
      ]);

      const result = await cassetteManager.executeCommand(command, 'codec-filesize');

      expect(result.success).toBe(true);

      // Check actual file size
      const stats = await fs.stat(outputPath);
      const fileSizeMB = stats.size / (1024 * 1024);
      
      // Should be reasonably close to target (within 50% tolerance for test video)
      expect(fileSizeMB).toBeLessThan(15);

      console.log(`📏 Target: 10MB, Actual: ${fileSizeMB.toFixed(2)}MB`);

      if (mediaAnalysis) {
        const analysis = await mediaAnalysis.analyzeMedia(outputPath);
        expect(analysis.primary.quality.overall).toBeGreaterThan(0.4);  // Should maintain reasonable quality
      }
    });
  });

  describe('🎯 Platform-Specific Codec Tests', () => {
    it('should configure TikTok-optimized encoding', async () => {
      const timeline = new Timeline()
        .addVideo(join(TEST_ASSETS_DIR, 'test-codec-input.mp4'))
        .setAspectRatio('9:16')
        .setDuration(5)
        .useCodecPreset('tiktok');

      const outputPath = join(TEST_OUTPUT_DIR, 'codec-test-tiktok.mp4');
      const command = timeline.getCommand(outputPath);

      dependencyTracker.registerCassette('codec-tiktok', [
        '../../../packages/media-sdk/src/codecs/codec-manager.ts'
      ]);

      const result = await cassetteManager.executeCommand(command, 'codec-tiktok');

      expect(result.success).toBe(true);

      // Verify TikTok-specific settings
      expect(command).toContain('-crf 25');
      expect(command).toContain('-preset fast');

      // Check aspect ratio
      const probeCommand = `ffprobe -v quiet -select_streams v:0 -show_entries stream=width,height -of csv=p=0 "${outputPath}"`;
      const probeResult = execSync(probeCommand, { encoding: 'utf8' });
      const [width, height] = probeResult.trim().split(',').map(Number);
      
      expect(height / width).toBeCloseTo(16 / 9, 0.1);

      if (mediaAnalysis) {
        const analysis = await mediaAnalysis.analyzeMedia(outputPath, {
          targetPlatform: 'tiktok'
        });
        
        expect(analysis.platformOptimization.tiktok.score).toBeGreaterThan(0.7);
      }
    });

    it('should configure Instagram-optimized encoding', async () => {
      const timeline = new Timeline()
        .addVideo(join(TEST_ASSETS_DIR, 'test-codec-input.mp4'))
        .setAspectRatio('1:1')
        .setDuration(5)
        .useCodecPreset('instagram');

      const outputPath = join(TEST_OUTPUT_DIR, 'codec-test-instagram.mp4');
      const command = timeline.getCommand(outputPath);

      dependencyTracker.registerCassette('codec-instagram', [
        '../../../packages/media-sdk/src/codecs/codec-manager.ts'
      ]);

      const result = await cassetteManager.executeCommand(command, 'codec-instagram');

      expect(result.success).toBe(true);

      // Check square aspect ratio
      const probeCommand = `ffprobe -v quiet -select_streams v:0 -show_entries stream=width,height -of csv=p=0 "${outputPath}"`;
      const probeResult = execSync(probeCommand, { encoding: 'utf8' });
      const [width, height] = probeResult.trim().split(',').map(Number);
      
      expect(Math.abs(width - height)).toBeLessThan(10);  // Should be square

      if (mediaAnalysis) {
        const analysis = await mediaAnalysis.analyzeMedia(outputPath, {
          targetPlatform: 'instagram'
        });
        
        expect(analysis.platformOptimization.instagram.score).toBeGreaterThan(0.7);
      }
    });

    it('should configure mobile-optimized encoding', async () => {
      const timeline = new Timeline()
        .addVideo(join(TEST_ASSETS_DIR, 'test-codec-input.mp4'))
        .setDuration(5)
        .useCodecPreset('mobile');

      const outputPath = join(TEST_OUTPUT_DIR, 'codec-test-mobile.mp4');
      const command = timeline.getCommand(outputPath);

      dependencyTracker.registerCassette('codec-mobile', [
        '../../../packages/media-sdk/src/codecs/codec-manager.ts'
      ]);

      const result = await cassetteManager.executeCommand(command, 'codec-mobile');

      expect(result.success).toBe(true);

      // Verify mobile-optimized settings
      expect(command).toContain('-crf 28');
      expect(command).toContain('-profile:v baseline');
      expect(command).toContain('-level 3.1');

      // Check file size (should be smaller for mobile)
      const stats = await fs.stat(outputPath);
      expect(stats.size).toBeLessThan(5 * 1024 * 1024);  // Should be < 5MB

      if (mediaAnalysis) {
        const analysis = await mediaAnalysis.analyzeMedia(outputPath);
        expect(analysis.primary.quality.technical).toBeGreaterThan(0.6);
      }
    });
  });

  describe('🚀 Hardware Acceleration Tests', () => {
    it('should configure auto hardware acceleration', async () => {
      const timeline = new Timeline()
        .addVideo(join(TEST_ASSETS_DIR, 'test-codec-input.mp4'))
        .setDuration(5)
        .setHardwareAcceleration('auto');

      const outputPath = join(TEST_OUTPUT_DIR, 'codec-test-hwaccel.mp4');
      const command = timeline.getCommand(outputPath);

      expect(command).toContain('-hwaccel auto');

      dependencyTracker.registerCassette('codec-hwaccel', [
        '../../../packages/media-sdk/src/codecs/codec-manager.ts'
      ]);

      // Note: Hardware acceleration might fail in CI/containers, so we allow that
      const result = await cassetteManager.executeCommand(command, 'codec-hwaccel');

      if (result.success) {
        expect(result.stderr).not.toContain('Error');
        console.log('✅ Hardware acceleration succeeded');
      } else {
        console.log('ℹ️ Hardware acceleration not available in this environment');
        expect(result.stderr).toContain('hwaccel');  // Should mention hardware acceleration
      }
    });

    it('should fallback gracefully when hardware acceleration fails', async () => {
      const timeline = new Timeline()
        .addVideo(join(TEST_ASSETS_DIR, 'test-codec-input.mp4'))
        .setDuration(5)
        .setHardwareAcceleration('nvidia');  // May not be available

      const outputPath = join(TEST_OUTPUT_DIR, 'codec-test-nvidia.mp4');
      const command = timeline.getCommand(outputPath);

      dependencyTracker.registerCassette('codec-nvidia', [
        '../../../packages/media-sdk/src/codecs/codec-manager.ts'
      ]);

      // Execute without cassette to test actual hardware
      try {
        execSync(command, { timeout: 30000 });
        console.log('✅ NVIDIA acceleration available');
      } catch (error) {
        console.log('ℹ️ NVIDIA acceleration not available, testing command structure');
        expect(command).toContain('-hwaccel nvidia');
        expect(command).toContain('h264_nvenc');
      }
    });
  });

  describe('📊 Quality and Compatibility Tests', () => {
    it('should validate codec compatibility correctly', async () => {
      const timeline = new Timeline()
        .addVideo(join(TEST_ASSETS_DIR, 'test-codec-input.mp4'))
        .setVideoCodec('libx264')
        .setAudioCodec('aac');

      // Check MP4 compatibility (should be compatible)
      const mp4Compatibility = timeline.checkCodecCompatibility('mp4');
      expect(mp4Compatibility.compatible).toBe(true);
      expect(mp4Compatibility.warnings).toHaveLength(0);

      // Test with incompatible combination
      const incompatibleTimeline = new Timeline()
        .addVideo(join(TEST_ASSETS_DIR, 'test-codec-input.mp4'))
        .setVideoCodec('libvpx-vp9')  // WebM codec
        .setAudioCodec('libvorbis');  // Ogg codec

      const incompatibleCheck = incompatibleTimeline.checkCodecCompatibility('mp4');
      expect(incompatibleCheck.compatible).toBe(false);
      expect(incompatibleCheck.warnings.length).toBeGreaterThan(0);
      expect(incompatibleCheck.alternatives.length).toBeGreaterThan(0);
    });

    it('should auto-select appropriate codecs', async () => {
      const timeline = new Timeline()
        .addVideo(join(TEST_ASSETS_DIR, 'test-codec-input.mp4'))
        .setDuration(5)
        .autoSelectCodec({
          container: 'mp4',
          quality: 'high',
          compatibility: 'maximum'
        });

      const outputPath = join(TEST_OUTPUT_DIR, 'codec-test-autoselect.mp4');
      const command = timeline.getCommand(outputPath);

      dependencyTracker.registerCassette('codec-autoselect', [
        '../../../packages/media-sdk/src/codecs/codec-manager.ts'
      ]);

      const result = await cassetteManager.executeCommand(command, 'codec-autoselect');

      expect(result.success).toBe(true);
      expect(command).toContain('libx264');  // Should select H.264 for maximum compatibility
      expect(command).toContain('baseline');  // Should use baseline profile

      if (mediaAnalysis) {
        const analysis = await mediaAnalysis.analyzeMedia(outputPath);
        expect(analysis.primary.quality.overall).toBeGreaterThan(0.7);
      }
    });

    it('should compare quality between different CRF settings', async () => {
      const crf18Timeline = new Timeline()
        .addVideo(join(TEST_ASSETS_DIR, 'test-codec-input.mp4'))
        .setDuration(5)
        .setVideoCodec('libx264', { crf: 18, preset: 'medium' });

      const crf28Timeline = new Timeline()
        .addVideo(join(TEST_ASSETS_DIR, 'test-codec-input.mp4'))
        .setDuration(5)
        .setVideoCodec('libx264', { crf: 28, preset: 'medium' });

      const outputPath18 = join(TEST_OUTPUT_DIR, 'codec-test-crf18.mp4');
      const outputPath28 = join(TEST_OUTPUT_DIR, 'codec-test-crf28.mp4');

      // Execute both renders
      dependencyTracker.registerCassette('codec-crf18', [
        '../../../packages/media-sdk/src/codecs/codec-manager.ts'
      ]);
      dependencyTracker.registerCassette('codec-crf28', [
        '../../../packages/media-sdk/src/codecs/codec-manager.ts'
      ]);

      const result18 = await cassetteManager.executeCommand(
        crf18Timeline.getCommand(outputPath18), 
        'codec-crf18'
      );
      const result28 = await cassetteManager.executeCommand(
        crf28Timeline.getCommand(outputPath28), 
        'codec-crf28'
      );

      expect(result18.success).toBe(true);
      expect(result28.success).toBe(true);

      // Compare file sizes (CRF 18 should be larger)
      const stats18 = await fs.stat(outputPath18);
      const stats28 = await fs.stat(outputPath28);

      expect(stats18.size).toBeGreaterThan(stats28.size);

      console.log(`📏 CRF 18: ${(stats18.size / 1024 / 1024).toFixed(2)}MB`);
      console.log(`📏 CRF 28: ${(stats28.size / 1024 / 1024).toFixed(2)}MB`);

      if (mediaAnalysis) {
        const [analysis18, analysis28] = await Promise.all([
          mediaAnalysis.analyzeMedia(outputPath18),
          mediaAnalysis.analyzeMedia(outputPath28)
        ]);

        // CRF 18 should have higher quality
        expect(analysis18.primary.quality.technical).toBeGreaterThan(analysis28.primary.quality.technical);

        console.log(`📊 CRF 18 Quality: ${analysis18.primary.quality.overall}`);
        console.log(`📊 CRF 28 Quality: ${analysis28.primary.quality.overall}`);
      }
    });
  });

  describe('🎵 Audio Codec Tests', () => {
    it('should render with different audio codecs', async () => {
      const aacTimeline = new Timeline()
        .addVideo(join(TEST_ASSETS_DIR, 'test-codec-input.mp4'))
        .setDuration(5)
        .setAudioCodec('aac', {
          bitrate: '192k',
          sampleRate: 48000,
          profile: 'aac_low'
        });

      const outputPath = join(TEST_OUTPUT_DIR, 'codec-test-aac.mp4');
      const command = aacTimeline.getCommand(outputPath);

      dependencyTracker.registerCassette('codec-aac', [
        '../../../packages/media-sdk/src/codecs/codec-manager.ts'
      ]);

      const result = await cassetteManager.executeCommand(command, 'codec-aac');

      expect(result.success).toBe(true);

      // Verify audio codec
      const probeCommand = `ffprobe -v quiet -select_streams a:0 -show_entries stream=codec_name,bit_rate,sample_rate -of csv=p=0 "${outputPath}"`;
      const probeResult = execSync(probeCommand, { encoding: 'utf8' });
      
      expect(probeResult).toContain('aac');
      expect(probeResult).toContain('48000');

      if (mediaAnalysis) {
        const analysis = await mediaAnalysis.analyzeMedia(outputPath);
        expect(analysis.audio?.audioQuality.clarity).toBeGreaterThan(0.5);
      }
    });

    it('should handle lossless audio encoding', async () => {
      const timeline = new Timeline()
        .addVideo(join(TEST_ASSETS_DIR, 'test-codec-input.mp4'))
        .setDuration(5)
        .setAudioCodec('flac', {
          compressionLevel: 8
        });

      const outputPath = join(TEST_OUTPUT_DIR, 'codec-test-flac.mkv');  // Use MKV for FLAC
      const command = timeline.getCommand(outputPath);

      dependencyTracker.registerCassette('codec-flac', [
        '../../../packages/media-sdk/src/codecs/codec-manager.ts'
      ]);

      const result = await cassetteManager.executeCommand(command, 'codec-flac');

      expect(result.success).toBe(true);

      // Verify FLAC codec
      const probeCommand = `ffprobe -v quiet -select_streams a:0 -show_entries stream=codec_name -of csv=p=0 "${outputPath}"`;
      const probeResult = execSync(probeCommand, { encoding: 'utf8' });
      
      expect(probeResult).toContain('flac');
    });
  });

  describe('🔄 Cassette and AST Integration Tests', () => {
    it('should invalidate cassettes when codec dependencies change', async () => {
      const codecManagerPath = '../../../packages/media-sdk/src/codecs/codec-manager.ts';
      
      // Register cassette with dependencies
      dependencyTracker.registerCassette('codec-dependency-test', [codecManagerPath]);

      // Check initial state
      const shouldInvalidateInitial = dependencyTracker.shouldInvalidateCassette('codec-dependency-test');
      console.log(`🔍 Initial invalidation needed: ${shouldInvalidateInitial}`);

      // Get dependency stats
      const stats = dependencyTracker.getStats();
      expect(stats.cassettes).toBeGreaterThan(0);
      expect(stats.totalDependencies).toBeGreaterThan(0);

      console.log(`📊 Cassette Dependencies: ${stats.cassettes} cassettes, ${stats.totalDependencies} dependencies`);

      // Execute a codec test
      const timeline = new Timeline()
        .addVideo(join(TEST_ASSETS_DIR, 'test-codec-input.mp4'))
        .setDuration(3)
        .setVideoCodec('libx264', { crf: 25 });

      const outputPath = join(TEST_OUTPUT_DIR, 'codec-dependency-test.mp4');
      const command = timeline.getCommand(outputPath);

      const result = await cassetteManager.executeCommand(command, 'codec-dependency-test');
      expect(result.success).toBe(true);

      // Verify cassette was created and cached
      const cassetteExists = await cassetteManager.cassetteExists('codec-dependency-test');
      expect(cassetteExists).toBe(true);
    });

    it('should track multiple codec-related dependencies', async () => {
      const dependencies = [
        '../../../packages/media-sdk/src/codecs/codec-manager.ts',
        '../../../packages/media-sdk/src/timeline/timeline.ts'
      ];

      dependencyTracker.registerCassette('codec-multi-dependency', dependencies);

      // Check that all dependencies are tracked
      const stats = dependencyTracker.getStats();
      console.log(`📈 Multi-dependency stats: ${JSON.stringify(stats)}`);

      expect(stats.totalDependencies).toBeGreaterThanOrEqual(dependencies.length);
    });

    it('should use cassettes for repeated codec operations', async () => {
      const timeline = new Timeline()
        .addVideo(join(TEST_ASSETS_DIR, 'test-codec-input.mp4'))
        .setDuration(3)
        .useCodecPreset('streaming');

      const outputPath = join(TEST_OUTPUT_DIR, 'codec-cassette-repeat.mp4');
      const command = timeline.getCommand(outputPath);

      dependencyTracker.registerCassette('codec-repeat-test', [
        '../../../packages/media-sdk/src/codecs/codec-manager.ts'
      ]);

      // First execution (should create cassette)
      const startTime1 = Date.now();
      const result1 = await cassetteManager.executeCommand(command, 'codec-repeat-test');
      const duration1 = Date.now() - startTime1;

      expect(result1.success).toBe(true);

      // Second execution (should use cassette)
      const startTime2 = Date.now();
      const result2 = await cassetteManager.executeCommand(command, 'codec-repeat-test');
      const duration2 = Date.now() - startTime2;

      expect(result2.success).toBe(true);

      // Second execution should be faster (using cassette)
      expect(duration2).toBeLessThan(duration1);

      console.log(`⚡ First execution: ${duration1}ms, Second execution: ${duration2}ms`);
      console.log(`🚀 Speedup: ${(duration1 / duration2).toFixed(2)}x`);
    });
  });

  describe('🎨 Advanced Codec Scenarios', () => {
    it('should handle complex multi-codec pipeline', async () => {
      const timeline = new Timeline()
        .addVideo(join(TEST_ASSETS_DIR, 'test-codec-input.mp4'))
        .setDuration(5)
        .setVideoCodec('libx264', {
          preset: 'slow',
          crf: 20,
          profile: 'high',
          tune: 'film',
          keyframeInterval: 48,
          bFrames: 3,
          extraOptions: {
            'x264-params': 'ref=5:bframes=3:subme=7:me=umh'
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
        })
        .addText('Codec Test Video', {
          position: 'center',
          style: { fontSize: 48, color: '#ffffff' }
        });

      const outputPath = join(TEST_OUTPUT_DIR, 'codec-test-complex.mp4');
      const command = timeline.getCommand(outputPath);

      dependencyTracker.registerCassette('codec-complex', [
        '../../../packages/media-sdk/src/codecs/codec-manager.ts',
        '../../../packages/media-sdk/src/timeline/timeline.ts'
      ]);

      const result = await cassetteManager.executeCommand(command, 'codec-complex');

      expect(result.success).toBe(true);

      // Verify complex codec parameters
      expect(command).toContain('-x264-params');
      expect(command).toContain('ref=5');
      expect(command).toContain('-aac_coder');
      expect(command).toContain('twoloop');

      if (mediaAnalysis) {
        console.log('🔍 Running Gemini analysis on complex codec output...');
        const analysis = await mediaAnalysis.analyzeMedia(outputPath, {
          analysisTypes: ['technical', 'quality', 'content'],
          targetPlatform: 'general'
        });

        expect(analysis.primary.quality.technical).toBeGreaterThan(0.7);
        expect(analysis.primary.keyElements.length).toBeGreaterThan(0);

        console.log(`📊 Complex Codec Quality Score: ${analysis.primary.quality.overall}`);
        console.log(`🎯 Key Elements Detected: ${analysis.primary.keyElements.join(', ')}`);
      }
    });

    it('should validate end-to-end codec pipeline with vision analysis', async () => {
      if (!mediaAnalysis) {
        console.log('⏭️ Skipping vision analysis (no API key)');
        return;
      }

      // Create multiple videos with different codec settings
      const configs = [
        { name: 'high-quality', preset: 'archival' },
        { name: 'streaming', preset: 'streaming' },
        { name: 'mobile', preset: 'mobile' }
      ];

      const results = [];

      for (const config of configs) {
        const timeline = new Timeline()
          .addVideo(join(TEST_ASSETS_DIR, 'test-codec-input.mp4'))
          .setDuration(5)
          .useCodecPreset(config.preset as any)
          .addText(`${config.name.toUpperCase()} QUALITY`, {
            position: 'center',
            style: { fontSize: 64, color: '#ff0066' }
          });

        const outputPath = join(TEST_OUTPUT_DIR, `codec-vision-${config.name}.mp4`);
        const command = timeline.getCommand(outputPath);

        dependencyTracker.registerCassette(`codec-vision-${config.name}`, [
          '../../../packages/media-sdk/src/codecs/codec-manager.ts'
        ]);

        const result = await cassetteManager.executeCommand(command, `codec-vision-${config.name}`);
        expect(result.success).toBe(true);

        // Analyze with Gemini Vision
        console.log(`🔍 Analyzing ${config.name} codec output with Gemini Vision...`);
        const analysis = await mediaAnalysis.analyzeMedia(outputPath, {
          analysisTypes: ['technical', 'quality', 'content'],
          includeObjectDetection: true
        });

        results.push({
          config: config.name,
          preset: config.preset,
          quality: analysis.primary.quality,
          fileSize: (await fs.stat(outputPath)).size,
          keyElements: analysis.primary.keyElements
        });
      }

      // Compare results
      console.log('\n📊 Codec Quality Comparison:');
      results.forEach(result => {
        const sizeMB = (result.fileSize / 1024 / 1024).toFixed(2);
        console.log(`${result.config}: Quality=${result.quality.overall.toFixed(2)}, Size=${sizeMB}MB`);
      });

      // Archival should have highest quality
      const archival = results.find(r => r.preset === 'archival');
      const mobile = results.find(r => r.preset === 'mobile');

      if (archival && mobile) {
        expect(archival.quality.overall).toBeGreaterThan(mobile.quality.overall);
        expect(archival.fileSize).toBeGreaterThan(mobile.fileSize);
      }
    });
  });

  describe('🧪 Stress Tests and Edge Cases', () => {
    it('should handle rapid codec switching', async () => {
      const codecs = ['libx264', 'libx265'];
      const results = [];

      for (let i = 0; i < codecs.length; i++) {
        const timeline = new Timeline()
          .addVideo(join(TEST_ASSETS_DIR, 'test-codec-input.mp4'))
          .setDuration(3)
          .setVideoCodec(codecs[i], { crf: 23 + i, preset: 'fast' });

        const outputPath = join(TEST_OUTPUT_DIR, `codec-stress-${codecs[i]}.mp4`);
        const command = timeline.getCommand(outputPath);

        dependencyTracker.registerCassette(`codec-stress-${i}`, [
          '../../../packages/media-sdk/src/codecs/codec-manager.ts'
        ]);

        const startTime = Date.now();
        const result = await cassetteManager.executeCommand(command, `codec-stress-${i}`);
        const duration = Date.now() - startTime;

        expect(result.success).toBe(true);
        results.push({ codec: codecs[i], duration });
      }

      console.log('⚡ Codec switching performance:');
      results.forEach(r => {
        console.log(`${r.codec}: ${r.duration}ms`);
      });
    });

    it('should validate codec configuration persistence', async () => {
      // Test that codec settings persist through multiple operations
      let timeline = new Timeline()
        .addVideo(join(TEST_ASSETS_DIR, 'test-codec-input.mp4'))
        .setVideoCodec('libx264', { crf: 20 })
        .setAudioCodec('aac', { bitrate: '192k' });

      // Add more operations
      timeline = timeline
        .setDuration(5)
        .addText('Persistence Test')
        .setAspectRatio('16:9');

      const command = timeline.getCommand(join(TEST_OUTPUT_DIR, 'codec-persistence.mp4'));

      // Verify codec settings are still present
      expect(command).toContain('-c:v libx264');
      expect(command).toContain('-crf 20');
      expect(command).toContain('-c:a aac');
      expect(command).toContain('-b:a 192k');
    });
  });
});
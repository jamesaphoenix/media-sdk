/**
 * @fileoverview Comprehensive Tests for CodecManager
 * 
 * This file contains extensive test coverage for the codec configuration system,
 * including edge cases, error handling, and integration scenarios.
 */

import { describe, it, expect, beforeEach } from 'bun:test';
import { CodecManager, CodecPresets, HardwareAccelerationProfiles, CodecCompatibility } from './codec-manager.js';

describe('CodecManager - Comprehensive Tests', () => {
  let codecManager: CodecManager;

  beforeEach(() => {
    codecManager = new CodecManager();
  });

  describe('Video Codec Configuration', () => {
    it('should configure basic video codec settings', () => {
      codecManager.setVideoCodec('libx264', {
        preset: 'medium',
        crf: 23,
        profile: 'high'
      });

      const config = codecManager.getConfig();
      expect(config.video?.codec).toBe('libx264');
      expect(config.video?.options?.preset).toBe('medium');
      expect(config.video?.options?.crf).toBe(23);
      expect(config.video?.options?.profile).toBe('high');
    });

    it('should configure advanced video codec options', () => {
      codecManager.setVideoCodec('libx265', {
        preset: 'slow',
        crf: 18,
        profile: 'main10',
        level: '5.1',
        pixelFormat: 'yuv420p10le',
        keyframeInterval: 60,
        bFrames: 4,
        refFrames: 6,
        tune: 'grain',
        extraOptions: {
          'x265-params': 'me=3:subme=3:ref=4:bframes=4'
        }
      });

      const config = codecManager.getConfig();
      expect(config.video?.codec).toBe('libx265');
      expect(config.video?.options?.preset).toBe('slow');
      expect(config.video?.options?.crf).toBe(18);
      expect(config.video?.options?.profile).toBe('main10');
      expect(config.video?.options?.level).toBe('5.1');
      expect(config.video?.options?.pixelFormat).toBe('yuv420p10le');
      expect(config.video?.options?.keyframeInterval).toBe(60);
      expect(config.video?.options?.bFrames).toBe(4);
      expect(config.video?.options?.refFrames).toBe(6);
      expect(config.video?.options?.tune).toBe('grain');
      expect(config.video?.options?.extraOptions?.['x265-params']).toBe('me=3:subme=3:ref=4:bframes=4');
    });

    it('should handle edge case values for video codec options', () => {
      codecManager.setVideoCodec('libx264', {
        crf: 0,  // Lossless
        preset: 'placebo',  // Slowest
        bFrames: 0,  // No B-frames
        refFrames: 1,  // Minimum references
        keyframeInterval: 1  // Every frame is keyframe
      });

      const args = codecManager.getFFmpegArgs();
      expect(args).toContain('-crf');
      expect(args).toContain('0');
      expect(args).toContain('-preset');
      expect(args).toContain('placebo');
      expect(args).toContain('-bf');
      expect(args).toContain('0');
      expect(args).toContain('-refs');
      expect(args).toContain('1');
      expect(args).toContain('-g');
      expect(args).toContain('1');
    });

    it('should handle maximum quality settings', () => {
      codecManager.setVideoCodec('libx264', {
        crf: 51,  // Maximum compression
        preset: 'ultrafast',  // Fastest
        bFrames: 16,  // Maximum B-frames
        refFrames: 16,  // Maximum references
        keyframeInterval: 600  // Large GOP
      });

      const args = codecManager.getFFmpegArgs();
      expect(args).toContain('-crf');
      expect(args).toContain('51');
      expect(args).toContain('-preset');
      expect(args).toContain('ultrafast');
    });

    it('should handle undefined video codec options gracefully', () => {
      codecManager.setVideoCodec('libx264');
      
      const config = codecManager.getConfig();
      expect(config.video?.codec).toBe('libx264');
      expect(config.video?.options).toBeUndefined();
    });

    it('should override video codec settings when called multiple times', () => {
      codecManager.setVideoCodec('libx264', { crf: 23 });
      codecManager.setVideoCodec('libx265', { crf: 18 });

      const config = codecManager.getConfig();
      expect(config.video?.codec).toBe('libx265');
      expect(config.video?.options?.crf).toBe(18);
    });
  });

  describe('Audio Codec Configuration', () => {
    it('should configure basic audio codec settings', () => {
      codecManager.setAudioCodec('aac', {
        bitrate: '128k',
        sampleRate: 44100,
        channels: 2
      });

      const config = codecManager.getConfig();
      expect(config.audio?.codec).toBe('aac');
      expect(config.audio?.options?.bitrate).toBe('128k');
      expect(config.audio?.options?.sampleRate).toBe(44100);
      expect(config.audio?.options?.channels).toBe(2);
    });

    it('should configure advanced audio codec options', () => {
      codecManager.setAudioCodec('libopus', {
        bitrate: '160k',
        sampleRate: 48000,
        channels: 6,  // 5.1 surround
        quality: 10,  // Maximum quality
        vbr: true,
        extraOptions: {
          'application': 'audio',
          'frame_duration': '20'
        }
      });

      const config = codecManager.getConfig();
      expect(config.audio?.codec).toBe('libopus');
      expect(config.audio?.options?.bitrate).toBe('160k');
      expect(config.audio?.options?.sampleRate).toBe(48000);
      expect(config.audio?.options?.channels).toBe(6);
      expect(config.audio?.options?.quality).toBe(10);
      expect(config.audio?.options?.vbr).toBe(true);
      expect(config.audio?.options?.extraOptions?.application).toBe('audio');
    });

    it('should configure FLAC lossless audio', () => {
      codecManager.setAudioCodec('flac', {
        compressionLevel: 12,  // Maximum compression
        sampleRate: 96000,     // High sample rate
        channels: 2
      });

      const args = codecManager.getFFmpegArgs();
      expect(args).toContain('-c:a');
      expect(args).toContain('flac');
      expect(args).toContain('-compression_level');
      expect(args).toContain('12');
      expect(args).toContain('-ar');
      expect(args).toContain('96000');
    });

    it('should handle mono audio configuration', () => {
      codecManager.setAudioCodec('aac', {
        channels: 1,  // Mono
        bitrate: '64k'
      });

      const args = codecManager.getFFmpegArgs();
      expect(args).toContain('-ac');
      expect(args).toContain('1');
      expect(args).toContain('-b:a');
      expect(args).toContain('64k');
    });

    it('should handle high-quality audio profiles', () => {
      codecManager.setAudioCodec('aac', {
        profile: 'aac_he_v2',  // High efficiency
        bitrate: '48k',
        sampleRate: 44100
      });

      const args = codecManager.getFFmpegArgs();
      expect(args).toContain('-profile:a');
      expect(args).toContain('aac_he_v2');
    });

    it('should override audio codec settings when called multiple times', () => {
      codecManager.setAudioCodec('aac', { bitrate: '128k' });
      codecManager.setAudioCodec('libopus', { bitrate: '160k' });

      const config = codecManager.getConfig();
      expect(config.audio?.codec).toBe('libopus');
      expect(config.audio?.options?.bitrate).toBe('160k');
    });
  });

  describe('Codec Presets', () => {
    it('should apply archival preset correctly', () => {
      codecManager.usePreset('archival');
      
      const config = codecManager.getConfig();
      expect(config.video?.codec).toBe('libx264');
      expect(config.video?.options?.preset).toBe('slow');
      expect(config.video?.options?.crf).toBe(18);
      expect(config.video?.options?.profile).toBe('high');
      expect(config.audio?.codec).toBe('flac');
      expect(config.audio?.options?.compressionLevel).toBe(8);
    });

    it('should apply streaming preset correctly', () => {
      codecManager.usePreset('streaming');
      
      const config = codecManager.getConfig();
      expect(config.video?.codec).toBe('libx264');
      expect(config.video?.options?.preset).toBe('veryfast');
      expect(config.video?.options?.tune).toBe('zerolatency');
      expect(config.audio?.codec).toBe('aac');
      expect(config.audio?.options?.profile).toBe('aac_low');
    });

    it('should apply mobile preset correctly', () => {
      codecManager.usePreset('mobile');
      
      const config = codecManager.getConfig();
      expect(config.video?.codec).toBe('libx264');
      expect(config.video?.options?.profile).toBe('baseline');
      expect(config.video?.options?.level).toBe('3.1');
      expect(config.video?.options?.refFrames).toBe(1);
      expect(config.audio?.codec).toBe('aac');
      expect(config.audio?.options?.profile).toBe('aac_he');
    });

    it('should apply HDR preset correctly', () => {
      codecManager.usePreset('hdr');
      
      const config = codecManager.getConfig();
      expect(config.video?.codec).toBe('libx265');
      expect(config.video?.options?.profile).toBe('main10');
      expect(config.video?.options?.pixelFormat).toBe('yuv420p10le');
      expect(config.video?.options?.extraOptions?.color_primaries).toBe('bt2020');
      expect(config.audio?.codec).toBe('libopus');
      expect(config.audio?.options?.vbr).toBe(true);
    });

    it('should apply YouTube preset correctly', () => {
      codecManager.usePreset('youtube');
      
      const config = codecManager.getConfig();
      expect(config.video?.codec).toBe('libx264');
      expect(config.video?.options?.level).toBe('4.2');
      expect(config.video?.options?.keyframeInterval).toBe(60);
      expect(config.audio?.options?.bitrate).toBe('192k');
      expect(config.audio?.options?.sampleRate).toBe(48000);
    });

    it('should apply Instagram preset correctly', () => {
      codecManager.usePreset('instagram');
      
      const config = codecManager.getConfig();
      expect(config.video?.options?.keyframeInterval).toBe(30);
      expect(config.audio?.options?.sampleRate).toBe(44100);
    });

    it('should apply TikTok preset correctly', () => {
      codecManager.usePreset('tiktok');
      
      const config = codecManager.getConfig();
      expect(config.video?.options?.crf).toBe(25);
      expect(config.video?.options?.preset).toBe('fast');
      expect(config.audio?.options?.bitrate).toBe('128k');
    });

    it('should override existing configuration when applying preset', () => {
      codecManager.setVideoCodec('libx265', { crf: 15 });
      codecManager.usePreset('mobile');
      
      const config = codecManager.getConfig();
      expect(config.video?.codec).toBe('libx264');  // Overridden by preset
      expect(config.video?.options?.crf).toBe(28);  // From mobile preset
    });
  });

  describe('Hardware Acceleration', () => {
    it('should configure auto hardware acceleration', () => {
      codecManager.setHardwareAcceleration('auto');
      
      const args = codecManager.getFFmpegArgs();
      expect(args).toContain('-hwaccel');
      expect(args).toContain('auto');
    });

    it('should configure NVIDIA hardware acceleration', () => {
      codecManager.setHardwareAcceleration('nvidia');
      
      const config = codecManager.getConfig();
      expect(config.video?.codec).toBe('h264_nvenc');
      
      const args = codecManager.getFFmpegArgs();
      expect(args).toContain('-hwaccel');
      expect(args).toContain('nvidia');
    });

    it('should configure Intel hardware acceleration', () => {
      codecManager.setHardwareAcceleration('intel');
      
      const config = codecManager.getConfig();
      expect(config.video?.codec).toBe('h264_qsv');
      
      const args = codecManager.getFFmpegArgs();
      expect(args).toContain('-hwaccel');
      expect(args).toContain('intel');
    });

    it('should configure AMD hardware acceleration', () => {
      codecManager.setHardwareAcceleration('amd');
      
      const config = codecManager.getConfig();
      expect(config.video?.codec).toBe('h264_amf');
    });

    it('should configure Apple hardware acceleration', () => {
      codecManager.setHardwareAcceleration('apple');
      
      const config = codecManager.getConfig();
      expect(config.video?.codec).toBe('h264_videotoolbox');
    });

    it('should disable hardware acceleration', () => {
      codecManager.setHardwareAcceleration('nvidia');  // Enable first
      codecManager.setHardwareAcceleration('none');     // Then disable
      
      const args = codecManager.getFFmpegArgs();
      expect(args).not.toContain('-hwaccel');
    });

    it('should apply hardware acceleration options correctly', () => {
      codecManager.setHardwareAcceleration('nvidia');
      
      const config = codecManager.getConfig();
      const options = config.video?.options;
      expect(options?.preset).toBe('p4');
      expect(options?.rc).toBe('vbr');
      expect(options?.cq).toBe(23);
      expect(options?.maxrate).toBe('4M');
    });

    it('should preserve existing video codec when setting hardware acceleration to none', () => {
      codecManager.setVideoCodec('libx264', { crf: 20 });
      codecManager.setHardwareAcceleration('none');
      
      const config = codecManager.getConfig();
      expect(config.video?.codec).toBe('libx264');
      expect(config.video?.options?.crf).toBe(20);
    });
  });

  describe('Codec Compatibility', () => {
    it('should validate MP4 container compatibility', () => {
      codecManager.setVideoCodec('libx264');
      codecManager.setAudioCodec('aac');
      
      const result = codecManager.checkCompatibility('mp4');
      expect(result.compatible).toBe(true);
      expect(result.warnings).toHaveLength(0);
    });

    it('should detect incompatible video codec for container', () => {
      codecManager.setVideoCodec('libvpx-vp9');  // WebM codec
      codecManager.setAudioCodec('aac');
      
      const result = codecManager.checkCompatibility('mp4');
      expect(result.compatible).toBe(false);
      expect(result.warnings.length).toBeGreaterThan(0);
      expect(result.alternatives.length).toBeGreaterThan(0);
    });

    it('should detect incompatible audio codec for container', () => {
      codecManager.setVideoCodec('libx264');
      codecManager.setAudioCodec('libvorbis');  // Ogg codec
      
      const result = codecManager.checkCompatibility('mp4');
      expect(result.compatible).toBe(false);
      expect(result.warnings.length).toBeGreaterThan(0);
    });

    it('should validate WebM container compatibility', () => {
      codecManager.setVideoCodec('libvpx-vp9');
      codecManager.setAudioCodec('libopus');
      
      const result = codecManager.checkCompatibility('webm');
      expect(result.compatible).toBe(true);
    });

    it('should check platform-specific compatibility', () => {
      codecManager.setVideoCodec('libx265');  // Not supported on all platforms
      
      const iosResult = codecManager.checkCompatibility('mp4', 'ios');
      expect(iosResult.warnings.length).toBeGreaterThan(0);
      
      const androidResult = codecManager.checkCompatibility('mp4', 'android');
      expect(androidResult.warnings.length).toBeGreaterThan(0);
    });

    it('should handle unknown containers gracefully', () => {
      codecManager.setVideoCodec('libx264');
      
      const result = codecManager.checkCompatibility('unknown');
      expect(result.compatible).toBe(true);  // Should default to compatible
      expect(result.warnings).toHaveLength(0);
    });

    it('should provide relevant alternatives for incompatible codecs', () => {
      codecManager.setVideoCodec('libvpx-vp9');
      codecManager.setAudioCodec('libvorbis');
      
      const result = codecManager.checkCompatibility('mp4');
      expect(result.alternatives).toContain('h264');
      expect(result.alternatives).toContain('aac');
    });
  });

  describe('File Size Optimization', () => {
    it('should calculate settings for small file size', () => {
      const settings = CodecManager.getSettingsForFileSize(60, 10, true);  // 10MB for 1 minute
      
      expect(parseInt(settings.videoBitrate)).toBeLessThan(2000);  // Should be low bitrate
      expect(settings.crf).toBeGreaterThan(25);  // Higher CRF for smaller files
      expect(settings.audioBitrate).toBe('128k');
    });

    it('should calculate settings for large file size', () => {
      const settings = CodecManager.getSettingsForFileSize(60, 500, true);  // 500MB for 1 minute
      
      expect(parseInt(settings.videoBitrate)).toBeGreaterThan(5000);  // Should be high bitrate
      expect(settings.crf).toBeLessThan(23);  // Lower CRF for larger files
    });

    it('should handle video-only optimization', () => {
      const settings = CodecManager.getSettingsForFileSize(120, 50, false);  // No audio
      
      expect(settings.audioBitrate).toBe('0');
      expect(parseInt(settings.videoBitrate)).toBeGreaterThan(0);
    });

    it('should ensure minimum video bitrate', () => {
      const settings = CodecManager.getSettingsForFileSize(3600, 1, true);  // 1MB for 1 hour
      
      expect(parseInt(settings.videoBitrate)).toBeGreaterThanOrEqual(500);  // Minimum 500k
    });

    it('should handle edge case of zero duration', () => {
      const settings = CodecManager.getSettingsForFileSize(0, 50, true);
      
      expect(parseInt(settings.videoBitrate)).toBeGreaterThan(0);
      expect(settings.audioBitrate).toBeDefined();
    });

    it('should scale audio bitrate appropriately', () => {
      const smallSettings = CodecManager.getSettingsForFileSize(60, 5, true);
      const largeSettings = CodecManager.getSettingsForFileSize(60, 500, true);
      
      expect(smallSettings.audioBitrate).toBe('128k');
      expect(largeSettings.audioBitrate).toBe('128k');  // Audio bitrate is constant
    });
  });

  describe('Auto-Selection', () => {
    it('should select maximum compatibility codecs', () => {
      const config = CodecManager.autoSelectCodec({
        container: 'mp4',
        quality: 'medium',
        compatibility: 'maximum'
      });
      
      expect(config.video?.codec).toBe('libx264');
      expect(config.video?.options?.profile).toBe('baseline');
      expect(config.audio?.codec).toBe('aac');
    });

    it('should select modern codecs for better quality', () => {
      const config = CodecManager.autoSelectCodec({
        container: 'mp4',
        quality: 'highest',
        compatibility: 'modern'
      });
      
      expect(config.video?.codec).toBe('libx265');
      expect(config.video?.options?.profile).toBe('main');
    });

    it('should select cutting-edge codecs', () => {
      const config = CodecManager.autoSelectCodec({
        container: 'webm',
        quality: 'high',
        compatibility: 'cutting-edge'
      });
      
      expect(config.video?.codec).toBe('libsvtav1');  // AV1
    });

    it('should optimize for file size', () => {
      const config = CodecManager.autoSelectCodec({
        container: 'webm',
        quality: 'medium',
        compatibility: 'modern',
        fileSize: 'smallest'
      });
      
      expect(config.audio?.codec).toBe('libopus');  // Better compression
      expect(config.audio?.options?.bitrate).toBe('64k');  // Lower bitrate
    });

    it('should configure hardware acceleration when requested', () => {
      const config = CodecManager.autoSelectCodec({
        container: 'mp4',
        quality: 'medium',
        compatibility: 'modern',
        hardware: true
      });
      
      expect(config.video?.options?.hardwareAcceleration).toBe('auto');
    });

    it('should adjust quality settings appropriately', () => {
      const lowConfig = CodecManager.autoSelectCodec({
        container: 'mp4',
        quality: 'low',
        compatibility: 'maximum'
      });
      
      const highConfig = CodecManager.autoSelectCodec({
        container: 'mp4',
        quality: 'highest',
        compatibility: 'maximum'
      });
      
      expect(lowConfig.video?.options?.crf).toBeGreaterThan(highConfig.video?.options?.crf!);
      expect(parseInt(lowConfig.audio?.options?.bitrate!)).toBeLessThan(parseInt(highConfig.audio?.options?.bitrate!));
    });
  });

  describe('FFmpeg Arguments Generation', () => {
    it('should generate basic video codec arguments', () => {
      codecManager.setVideoCodec('libx264', {
        preset: 'medium',
        crf: 23
      });
      
      const args = codecManager.getFFmpegArgs();
      expect(args).toContain('-c:v');
      expect(args).toContain('libx264');
      expect(args).toContain('-preset');
      expect(args).toContain('medium');
      expect(args).toContain('-crf');
      expect(args).toContain('23');
    });

    it('should generate basic audio codec arguments', () => {
      codecManager.setAudioCodec('aac', {
        bitrate: '128k',
        sampleRate: 44100
      });
      
      const args = codecManager.getFFmpegArgs();
      expect(args).toContain('-c:a');
      expect(args).toContain('aac');
      expect(args).toContain('-b:a');
      expect(args).toContain('128k');
      expect(args).toContain('-ar');
      expect(args).toContain('44100');
    });

    it('should generate extra options correctly', () => {
      codecManager.setVideoCodec('libx264', {
        extraOptions: {
          'x264-params': 'me=umh:subme=8',
          'color_primaries': 'bt709'
        }
      });
      
      const args = codecManager.getFFmpegArgs();
      expect(args).toContain('-x264-params');
      expect(args).toContain('me=umh:subme=8');
      expect(args).toContain('-color_primaries');
      expect(args).toContain('bt709');
    });

    it('should handle VBR for Opus codec', () => {
      codecManager.setAudioCodec('libopus', {
        vbr: true
      });
      
      const args = codecManager.getFFmpegArgs();
      expect(args).toContain('-vbr');
      expect(args).toContain('on');
    });

    it('should not include VBR for non-Opus codecs', () => {
      codecManager.setAudioCodec('aac', {
        vbr: true  // Should be ignored for AAC
      });
      
      const args = codecManager.getFFmpegArgs();
      expect(args).not.toContain('-vbr');
    });

    it('should generate arguments in correct order', () => {
      codecManager.setVideoCodec('libx264', { preset: 'fast', crf: 20 });
      codecManager.setAudioCodec('aac', { bitrate: '160k' });
      
      const args = codecManager.getFFmpegArgs();
      const videoIndex = args.indexOf('-c:v');
      const audioIndex = args.indexOf('-c:a');
      
      expect(videoIndex).toBeLessThan(audioIndex);  // Video args before audio args
    });

    it('should handle missing configurations gracefully', () => {
      const args = codecManager.getFFmpegArgs();
      expect(args).toHaveLength(0);  // No args when no codecs configured
    });
  });

  describe('Edge Cases and Error Handling', () => {
    it('should handle invalid CRF values', () => {
      codecManager.setVideoCodec('libx264', {
        crf: -5  // Invalid negative value
      });
      
      const args = codecManager.getFFmpegArgs();
      expect(args).toContain('-5');  // Should still include it (FFmpeg will handle the error)
    });

    it('should handle very large CRF values', () => {
      codecManager.setVideoCodec('libx264', {
        crf: 100  // Invalid large value
      });
      
      const args = codecManager.getFFmpegArgs();
      expect(args).toContain('100');
    });

    it('should handle empty string codec names', () => {
      codecManager.setVideoCodec('');
      
      const config = codecManager.getConfig();
      expect(config.video?.codec).toBe('');
    });

    it('should handle special characters in codec options', () => {
      codecManager.setVideoCodec('libx264', {
        extraOptions: {
          'special-param': 'value:with:colons',
          'quote-param': 'value"with"quotes'
        }
      });
      
      const args = codecManager.getFFmpegArgs();
      expect(args).toContain('value:with:colons');
      expect(args).toContain('value"with"quotes');
    });

    it('should handle null and undefined values in options', () => {
      codecManager.setVideoCodec('libx264', {
        preset: undefined,
        crf: null as any,
        profile: ''
      });
      
      const args = codecManager.getFFmpegArgs();
      expect(args).not.toContain('undefined');
      expect(args).not.toContain('null');
      expect(args).toContain('-profile:v');
      expect(args).toContain('');  // Empty string should be included
    });

    it('should handle very long duration in file size calculation', () => {
      const settings = CodecManager.getSettingsForFileSize(86400, 1000, true);  // 24 hours
      
      expect(parseInt(settings.videoBitrate)).toBeGreaterThan(0);
      expect(settings.crf).toBeDefined();
    });

    it('should handle zero file size target', () => {
      const settings = CodecManager.getSettingsForFileSize(60, 0, true);
      
      expect(parseInt(settings.videoBitrate)).toBeGreaterThanOrEqual(500);  // Should enforce minimum
    });

    it('should preserve configuration after multiple operations', () => {
      codecManager.setVideoCodec('libx264', { crf: 20 });
      codecManager.setAudioCodec('aac', { bitrate: '128k' });
      codecManager.setHardwareAcceleration('auto');
      
      const config1 = codecManager.getConfig();
      const args1 = codecManager.getFFmpegArgs();
      
      // Call methods again
      const config2 = codecManager.getConfig();
      const args2 = codecManager.getFFmpegArgs();
      
      expect(config1).toEqual(config2);
      expect(args1).toEqual(args2);
    });
  });

  describe('Complex Integration Scenarios', () => {
    it('should handle preset followed by custom overrides', () => {
      codecManager.usePreset('youtube');
      codecManager.setVideoCodec('libx265', { crf: 15 });  // Override video codec
      
      const config = codecManager.getConfig();
      expect(config.video?.codec).toBe('libx265');  // Custom override
      expect(config.video?.options?.crf).toBe(15);  // Custom override
      expect(config.audio?.codec).toBe('aac');      // From preset
      expect(config.audio?.options?.bitrate).toBe('192k');  // From preset
    });

    it('should handle hardware acceleration with custom codec options', () => {
      codecManager.setHardwareAcceleration('nvidia');
      codecManager.setVideoCodec('h264_nvenc', {
        cq: 18,  // Override default CQ
        preset: 'p6'  // Override default preset
      });
      
      const config = codecManager.getConfig();
      expect(config.video?.codec).toBe('h264_nvenc');
      expect(config.video?.options?.cq).toBe(18);
      expect(config.video?.options?.preset).toBe('p6');
    });

    it('should maintain separate video and audio configurations', () => {
      codecManager.setVideoCodec('libx265', { crf: 20 });
      codecManager.setAudioCodec('libopus', { bitrate: '160k' });
      codecManager.setVideoCodec('libx264', { crf: 23 });  // Change only video
      
      const config = codecManager.getConfig();
      expect(config.video?.codec).toBe('libx264');
      expect(config.video?.options?.crf).toBe(23);
      expect(config.audio?.codec).toBe('libopus');  // Should remain unchanged
      expect(config.audio?.options?.bitrate).toBe('160k');
    });

    it('should generate complete command for complex configuration', () => {
      codecManager.usePreset('archival');
      codecManager.setHardwareAcceleration('auto');
      codecManager.setVideoCodec('libx264', {
        extraOptions: { 'x264-params': 'ref=6:bframes=5' }
      });
      
      const args = codecManager.getFFmpegArgs();
      
      // Should contain hardware acceleration
      expect(args).toContain('-hwaccel');
      expect(args).toContain('auto');
      
      // Should contain video codec settings
      expect(args).toContain('-c:v');
      expect(args).toContain('libx264');
      expect(args).toContain('-x264-params');
      
      // Should contain audio codec settings (from preset)
      expect(args).toContain('-c:a');
      expect(args).toContain('flac');
    });
  });
});
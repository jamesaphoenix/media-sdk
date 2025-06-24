/**
 * @fileoverview Tests for CodecManager and Timeline integration
 */

import { describe, it, expect } from 'bun:test';
import { CodecManager, CodecPresets } from './codec-manager.js';
import { Timeline } from '../timeline/timeline.js';

describe('CodecManager', () => {
  it('should create codec manager with video and audio codecs', () => {
    const manager = new CodecManager();
    
    manager.setVideoCodec('libx264', {
      preset: 'medium',
      crf: 23,
      profile: 'high'
    });
    
    manager.setAudioCodec('aac', {
      bitrate: '128k',
      sampleRate: 44100
    });
    
    const args = manager.getFFmpegArgs();
    
    expect(args).toContain('-c:v');
    expect(args).toContain('libx264');
    expect(args).toContain('-preset');
    expect(args).toContain('medium');
    expect(args).toContain('-crf');
    expect(args).toContain('23');
    expect(args).toContain('-c:a');
    expect(args).toContain('aac');
    expect(args).toContain('-b:a');
    expect(args).toContain('128k');
  });

  it('should apply presets correctly', () => {
    const manager = new CodecManager();
    manager.usePreset('youtube');
    
    const config = manager.getConfig();
    
    expect(config.video?.codec).toBe('libx264');
    expect(config.video?.options?.crf).toBe(23);
    expect(config.video?.options?.profile).toBe('high');
    expect(config.audio?.codec).toBe('aac');
    expect(config.audio?.options?.bitrate).toBe('192k');
  });

  it('should enable hardware acceleration', () => {
    const manager = new CodecManager();
    manager.setHardwareAcceleration('nvidia');
    
    const args = manager.getFFmpegArgs();
    
    expect(args).toContain('-hwaccel');
    expect(args).toContain('nvidia');
  });

  it('should check codec compatibility', () => {
    const manager = new CodecManager();
    manager.setVideoCodec('libx265');
    manager.setAudioCodec('opus');
    
    const compatibility = manager.checkCompatibility('mp4');
    
    expect(compatibility.compatible).toBe(false);
    expect(compatibility.warnings.length).toBeGreaterThan(0);
    expect(compatibility.alternatives.length).toBeGreaterThan(0);
  });

  it('should calculate file size settings', () => {
    const settings = CodecManager.getSettingsForFileSize(60, 100, true);
    
    expect(settings.videoBitrate).toBeDefined();
    expect(settings.audioBitrate).toBeDefined();
    expect(settings.crf).toBeDefined();
    expect(parseInt(settings.videoBitrate)).toBeGreaterThan(0);
  });

  it('should auto-select codecs', () => {
    const config = CodecManager.autoSelectCodec({
      container: 'mp4',
      quality: 'high',
      compatibility: 'maximum'
    });
    
    expect(config.video?.codec).toBe('libx264');
    expect(config.video?.options?.profile).toBe('baseline');
    expect(config.audio?.codec).toBe('aac');
  });
});

describe('Timeline Codec Integration', () => {
  it('should integrate codec configuration with timeline', () => {
    const timeline = new Timeline()
      .addVideo('test.mp4')
      .setVideoCodec('libx264', { crf: 18, preset: 'slow' })
      .setAudioCodec('aac', { bitrate: '192k' });
    
    const command = timeline.getCommand('output.mp4');
    
    expect(command).toContain('-c:v libx264');
    expect(command).toContain('-crf 18');
    expect(command).toContain('-preset slow');
    expect(command).toContain('-c:a aac');
    expect(command).toContain('-b:a 192k');
  });

  it('should apply codec presets through timeline', () => {
    const timeline = new Timeline()
      .addVideo('test.mp4')
      .useCodecPreset('tiktok');
    
    const command = timeline.getCommand('output.mp4');
    
    expect(command).toContain('-c:v libx264');
    expect(command).toContain('-crf 25');
    expect(command).toContain('-preset fast');
  });

  it('should enable hardware acceleration through timeline', () => {
    const timeline = new Timeline()
      .addVideo('test.mp4')
      .setHardwareAcceleration('auto');
    
    const command = timeline.getCommand('output.mp4');
    
    expect(command).toContain('-hwaccel auto');
  });

  it('should optimize for file size through timeline', () => {
    const timeline = new Timeline()
      .addVideo('test.mp4')
      .setDuration(30)
      .optimizeForFileSize(50, true);
    
    const command = timeline.getCommand('output.mp4');
    
    expect(command).toContain('-c:v libx264');
    expect(command).toContain('-crf');
    expect(command).toContain('-c:a aac');
  });

  it('should auto-select codecs through timeline', () => {
    const timeline = new Timeline()
      .addVideo('test.mp4')
      .autoSelectCodec({
        container: 'mp4',
        quality: 'medium',
        compatibility: 'modern'
      });
    
    const command = timeline.getCommand('output.mp4');
    
    expect(command).toContain('-c:v');
    expect(command).toContain('-c:a');
  });

  it('should check codec compatibility through timeline', () => {
    const timeline = new Timeline()
      .addVideo('test.mp4')
      .setVideoCodec('libx265')
      .setAudioCodec('opus');
    
    const compatibility = timeline.checkCodecCompatibility('mp4', 'ios');
    
    expect(compatibility.compatible).toBe(false);
    expect(compatibility.warnings.length).toBeGreaterThan(0);
  });

  it('should maintain codec configuration through transformations', () => {
    const timeline = new Timeline()
      .addVideo('test.mp4')
      .setVideoCodec('libx264', { crf: 20 })
      .addText('Hello World')
      .setAspectRatio('16:9');
    
    const command = timeline.getCommand('output.mp4');
    
    // Check that codec manager was used (should contain libx264, not default h264)
    expect(command).toContain('-c:v libx264');
    expect(command).toContain('-crf 20');
  });

  it('should use default encoding when no codec manager configured', () => {
    const timeline = new Timeline()
      .addVideo('test.mp4');
    
    const command = timeline.getCommand('output.mp4');
    
    // Should use default h264 codec
    expect(command).toContain('-c:v h264');
    expect(command).toContain('-crf 23');
  });
});
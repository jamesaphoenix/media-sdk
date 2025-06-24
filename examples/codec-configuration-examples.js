/**
 * @fileoverview Codec Configuration Examples
 * 
 * This file demonstrates how to use the comprehensive codec configuration
 * system in the Media SDK for optimizing video encoding for different
 * use cases, platforms, and quality requirements.
 */

import { Timeline } from '@jamesaphoenix/media-sdk';

console.log('🎬 Media SDK - Codec Configuration Examples\n');

// Example 1: Basic Codec Configuration
console.log('1. Basic Codec Configuration');
console.log('=' .repeat(50));

const basicTimeline = new Timeline()
  .addVideo('input.mp4')
  .setVideoCodec('libx264', {
    preset: 'medium',
    crf: 23,
    profile: 'high',
    level: '4.2'
  })
  .setAudioCodec('aac', {
    bitrate: '128k',
    sampleRate: 48000,
    channels: 2
  });

console.log('Basic H.264 + AAC configuration:');
console.log(basicTimeline.getCommand('output-basic.mp4'));
console.log();

// Example 2: Hardware Acceleration
console.log('2. Hardware Acceleration');
console.log('=' .repeat(50));

const hardwareTimeline = new Timeline()
  .addVideo('input.mp4')
  .setHardwareAcceleration('nvidia')  // Use NVIDIA GPU
  .setVideoCodec('h264_nvenc', {
    preset: 'p4',  // Balanced performance
    cq: 23,        // Constant quality
    profile: 'high'
  });

console.log('NVIDIA hardware accelerated encoding:');
console.log(hardwareTimeline.getCommand('output-nvidia.mp4'));
console.log();

// Example 3: Platform-Specific Presets
console.log('3. Platform-Specific Presets');
console.log('=' .repeat(50));

// TikTok optimized
const tiktokTimeline = new Timeline()
  .addVideo('input.mp4')
  .setAspectRatio('9:16')
  .useCodecPreset('tiktok');

console.log('TikTok optimized encoding:');
console.log(tiktokTimeline.getCommand('output-tiktok.mp4'));

// YouTube optimized
const youtubeTimeline = new Timeline()
  .addVideo('input.mp4')
  .setAspectRatio('16:9')
  .useCodecPreset('youtube');

console.log('\nYouTube optimized encoding:');
console.log(youtubeTimeline.getCommand('output-youtube.mp4'));

// Instagram optimized
const instagramTimeline = new Timeline()
  .addVideo('input.mp4')
  .setAspectRatio('1:1')
  .useCodecPreset('instagram');

console.log('\nInstagram optimized encoding:');
console.log(instagramTimeline.getCommand('output-instagram.mp4'));
console.log();

// Example 4: Quality-Based Presets
console.log('4. Quality-Based Presets');
console.log('=' .repeat(50));

// Archival quality (highest quality, larger files)
const archivalTimeline = new Timeline()
  .addVideo('input.mp4')
  .useCodecPreset('archival');

console.log('Archival quality (lossless):');
console.log(archivalTimeline.getCommand('output-archival.mp4'));

// Streaming optimized (fast encode, good quality)
const streamingTimeline = new Timeline()
  .addVideo('input.mp4')
  .useCodecPreset('streaming');

console.log('\nStreaming optimized:');
console.log(streamingTimeline.getCommand('output-streaming.mp4'));

// Mobile optimized (small files, compatible)
const mobileTimeline = new Timeline()
  .addVideo('input.mp4')
  .useCodecPreset('mobile');

console.log('\nMobile optimized:');
console.log(mobileTimeline.getCommand('output-mobile.mp4'));
console.log();

// Example 5: File Size Optimization
console.log('5. File Size Optimization');
console.log('=' .repeat(50));

// Optimize for 50MB file size (5 minute video)
const fileSizeTimeline = new Timeline()
  .addVideo('input.mp4')
  .setDuration(300)  // 5 minutes
  .optimizeForFileSize(50, true);  // 50MB with audio

console.log('Optimized for 50MB file size:');
console.log(fileSizeTimeline.getCommand('output-50mb.mp4'));
console.log();

// Example 6: Auto-Selection Based on Requirements
console.log('6. Auto-Selection Based on Requirements');
console.log('=' .repeat(50));

// Maximum compatibility for MP4
const maxCompatTimeline = new Timeline()
  .addVideo('input.mp4')
  .autoSelectCodec({
    container: 'mp4',
    quality: 'medium',
    compatibility: 'maximum'
  });

console.log('Maximum compatibility configuration:');
console.log(maxCompatTimeline.getCommand('output-compat.mp4'));

// Modern browsers with small file size
const modernTimeline = new Timeline()
  .addVideo('input.mp4')
  .autoSelectCodec({
    container: 'webm',
    quality: 'high',
    compatibility: 'modern',
    fileSize: 'smallest',
    hardware: true
  });

console.log('\nModern browsers, optimized for size:');
console.log(modernTimeline.getCommand('output-modern.webm'));
console.log();

// Example 7: Codec Compatibility Checking
console.log('7. Codec Compatibility Checking');
console.log('=' .repeat(50));

const compatTimeline = new Timeline()
  .addVideo('input.mp4')
  .setVideoCodec('libx265')  // H.265
  .setAudioCodec('opus');    // Opus audio

// Check compatibility with MP4 container
const mp4Compatibility = compatTimeline.checkCodecCompatibility('mp4');
console.log('H.265 + Opus in MP4 container:');
console.log(`Compatible: ${mp4Compatibility.compatible}`);
console.log(`Warnings: ${mp4Compatibility.warnings.join(', ')}`);
console.log(`Alternatives: ${mp4Compatibility.alternatives.join(', ')}`);

// Check compatibility with WebM container
const webmCompatibility = compatTimeline.checkCodecCompatibility('webm');
console.log('\nH.265 + Opus in WebM container:');
console.log(`Compatible: ${webmCompatibility.compatible}`);
console.log(`Warnings: ${webmCompatibility.warnings.join(', ')}`);
console.log();

// Example 8: HDR and Advanced Features
console.log('8. HDR and Advanced Features');
console.log('=' .repeat(50));

const hdrTimeline = new Timeline()
  .addVideo('input-hdr.mp4')
  .useCodecPreset('hdr');

console.log('HDR video encoding:');
console.log(hdrTimeline.getCommand('output-hdr.mp4'));
console.log();

// Example 9: Lossless Encoding
console.log('9. Lossless Encoding');
console.log('=' .repeat(50));

const losslessTimeline = new Timeline()
  .addVideo('input.mp4')
  .setVideoCodec('libx264', {
    preset: 'slow',
    crf: 0,  // Lossless
    profile: 'high444'
  })
  .setAudioCodec('flac', {
    compressionLevel: 8
  });

console.log('Lossless H.264 + FLAC:');
console.log(losslessTimeline.getCommand('output-lossless.mp4'));
console.log();

// Example 10: Multi-Platform Optimization
console.log('10. Multi-Platform Optimization');
console.log('=' .repeat(50));

const basePath = 'input.mp4';

// Create optimized versions for different platforms
const platforms = [
  { name: 'TikTok', preset: 'tiktok', aspect: '9:16', suffix: 'tiktok' },
  { name: 'YouTube', preset: 'youtube', aspect: '16:9', suffix: 'youtube' },
  { name: 'Instagram Feed', preset: 'instagram', aspect: '1:1', suffix: 'instagram' },
  { name: 'Mobile', preset: 'mobile', aspect: '16:9', suffix: 'mobile' }
];

platforms.forEach(platform => {
  const timeline = new Timeline()
    .addVideo(basePath)
    .setAspectRatio(platform.aspect)
    .useCodecPreset(platform.preset);
  
  console.log(`${platform.name} optimized:`);
  console.log(timeline.getCommand(`output-${platform.suffix}.mp4`));
});

console.log();

// Example 11: Custom Advanced Configuration
console.log('11. Custom Advanced Configuration');
console.log('=' .repeat(50));

const advancedTimeline = new Timeline()
  .addVideo('input.mp4')
  .setVideoCodec('libx264', {
    preset: 'slow',
    crf: 18,
    profile: 'high',
    level: '5.1',
    pixelFormat: 'yuv420p',
    keyframeInterval: 48,
    bFrames: 3,
    refFrames: 5,
    tune: 'film',
    extraOptions: {
      'x264-params': 'me=umh:subme=8:ref=5:bframes=3:b-adapt=2:direct=auto:me-range=16:analyse=all:trellis=2:8x8dct=1:fast-pskip=0'
    }
  })
  .setAudioCodec('aac', {
    bitrate: '320k',
    sampleRate: 48000,
    channels: 2,
    profile: 'aac_low',
    extraOptions: {
      'aac_coder': 'twoloop'
    }
  });

console.log('Advanced custom configuration:');
console.log(advancedTimeline.getCommand('output-advanced.mp4'));
console.log();

// Example 12: Performance Comparison
console.log('12. Performance Comparison');
console.log('=' .repeat(50));

const performanceConfigs = [
  { name: 'Ultra Fast', preset: 'ultrafast', crf: 28 },
  { name: 'Fast', preset: 'fast', crf: 25 },
  { name: 'Medium', preset: 'medium', crf: 23 },
  { name: 'Slow', preset: 'slow', crf: 20 },
  { name: 'Very Slow', preset: 'veryslow', crf: 18 }
];

console.log('Performance vs Quality comparison:');
performanceConfigs.forEach(config => {
  const timeline = new Timeline()
    .addVideo('input.mp4')
    .setVideoCodec('libx264', {
      preset: config.preset,
      crf: config.crf
    });
  
  console.log(`${config.name}: ${timeline.getCommand('output.mp4').includes(`-preset ${config.preset}`) ? '✓' : '✗'}`);
});

console.log('\n🎉 Codec configuration examples completed!');
console.log('💡 Use these patterns to optimize your video encoding for any use case.');
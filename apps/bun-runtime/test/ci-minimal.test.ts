/**
 * Minimal test suite for CI - runs only essential tests
 */

import { describe, test, expect } from 'bun:test';
import { Timeline } from '@jamesaphoenix/media-sdk';
import { existsSync } from 'fs';

describe('CI Minimal Tests', () => {
  test('Timeline basic functionality', () => {
    const timeline = new Timeline();
    expect(timeline).toBeDefined();
    
    const withVideo = timeline.addVideo('test.mp4');
    expect(withVideo).toBeDefined();
  });

  test('Timeline with effects', () => {
    const timeline = new Timeline()
      .addVideo('input.mp4')
      .fadeIn(1)
      .fadeOut(1)
      .scale(1920, 1080);
    
    const command = timeline.getCommand('output.mp4');
    expect(command).toContain('ffmpeg');
    expect(command).toContain('fade');
    expect(command).toContain('scale');
  });

  test('Image + Caption', () => {
    const timeline = new Timeline()
      .addImage('logo.png', { duration: 5 })
      .addText('Hello World', { 
        position: { x: 'center', y: 'center' },
        style: { fontSize: 48, color: '#ffffff' }
      });
    
    const command = timeline.getCommand('output.mp4');
    expect(command).toContain('drawtext');
    expect(command).toContain('Hello World');
  });

  test('Platform presets', () => {
    const tiktok = new Timeline()
      .addVideo('input.mp4')
      .setAspectRatio('9:16')
      .setDuration(15);
    
    const command = tiktok.getCommand('tiktok.mp4');
    expect(command).toContain('9:16');
  });

  test('Audio handling', () => {
    const timeline = new Timeline()
      .addVideo('video.mp4')
      .addAudio('music.mp3', { volume: 0.5 });
    
    const command = timeline.getCommand('output.mp4');
    expect(command).toContain('volume=0.5');
  });
});

// Quick sanity check
describe('Environment Check', () => {
  test('FFmpeg is available', async () => {
    const proc = Bun.spawn(['ffmpeg', '-version']);
    const exitCode = await proc.exited;
    expect(exitCode).toBe(0);
  });

  test('Cassette directory exists', () => {
    expect(existsSync('./cassettes')).toBe(true);
  });
});
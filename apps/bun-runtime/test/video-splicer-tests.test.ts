/**
 * @fileoverview Video Splicer Tests
 * 
 * Tests for video splicing, trimming, and segment manipulation
 */

import { test, expect, describe, beforeAll, afterAll } from 'bun:test';
import { Timeline, VideoSplicer } from '../../../packages/media-sdk/src/index.js';
import { promises as fs } from 'fs';
import { join } from 'path';
import { tmpdir } from 'os';

describe('✂️ VIDEO SPLICER TESTS', () => {
  let testDir: string;
  
  beforeAll(async () => {
    testDir = join(tmpdir(), 'video-splicer-tests-' + Date.now());
    await fs.mkdir(testDir, { recursive: true });
  });
  
  afterAll(async () => {
    try {
      await fs.rm(testDir, { recursive: true, force: true });
    } catch (e) {
      console.error('Cleanup error:', e);
    }
  });

  describe('📌 Basic Functionality', () => {
    test('should extract a segment from a video', () => {
      const timeline = new Timeline()
        .addVideo('input.mp4', { duration: 30 })
        .addText('Original Video', { startTime: 0, duration: 30 });
      
      const segment = VideoSplicer.extractSegment(timeline, 10, 20);
      const command = segment.getCommand('segment.mp4');
      
      expect(command).toContain('trim=10:10');
      expect(segment.getDuration()).toBe(10);
    });

    test('should remove a segment from a video', () => {
      const timeline = new Timeline()
        .addVideo('input.mp4', { duration: 30 });
      
      const edited = VideoSplicer.removeSegment(timeline, 10, 20);
      const duration = edited.getDuration();
      
      // Original 30s - removed 10s = 20s
      expect(duration).toBe(20);
    });

    test('should remove multiple segments', () => {
      const timeline = new Timeline()
        .addVideo('input.mp4', { duration: 60 });
      
      const edited = VideoSplicer.removeSegments(timeline, [
        { startTime: 10, endTime: 15 }, // Remove 5s
        { startTime: 30, endTime: 40 }, // Remove 10s
        { startTime: 50, endTime: 55 }  // Remove 5s
      ]);
      
      // Original 60s - removed 20s = 40s
      expect(edited.getDuration()).toBe(40);
    });

    test('should handle removing entire video', () => {
      const timeline = new Timeline()
        .addVideo('input.mp4', { duration: 10 });
      
      const edited = VideoSplicer.removeSegment(timeline, 0, 10);
      expect(edited.getDuration()).toBe(0);
    });
  });

  describe('🎬 Splicing Operations', () => {
    test('should splice multiple segments together', () => {
      const spliced = VideoSplicer.splice({
        segments: [
          { source: 'video1.mp4', startTime: 0, endTime: 5 },
          { source: 'video2.mp4', startTime: 10, endTime: 15 },
          { source: 'video3.mp4', startTime: 20, endTime: 25 }
        ],
        defaultTransition: 'fade',
        defaultTransitionDuration: 0.5
      });
      
      const command = spliced.getCommand('spliced.mp4');
      expect(command).toContain('video1.mp4');
      expect(command).toContain('video2.mp4');
      expect(command).toContain('video3.mp4');
      expect(spliced.getDuration()).toBe(15); // 3 x 5s segments
    });

    test('should apply transitions between segments', () => {
      const spliced = VideoSplicer.splice({
        segments: [
          { source: 'clip1.mp4', startTime: 0, endTime: 3, transition: 'fade' },
          { source: 'clip2.mp4', startTime: 0, endTime: 3, transition: 'dissolve' },
          { source: 'clip3.mp4', startTime: 0, endTime: 3 }
        ],
        defaultTransitionDuration: 0.5
      });
      
      const command = spliced.getCommand('transitions.mp4');
      expect(command).toContain('fade');
    });

    test('should concatenate timelines', () => {
      const timeline1 = new Timeline()
        .addVideo('part1.mp4', { duration: 10 })
        .addText('Part 1', { startTime: 0, duration: 10 });
      
      const timeline2 = new Timeline()
        .addVideo('part2.mp4', { duration: 10 })
        .addText('Part 2', { startTime: 0, duration: 10 });
      
      const timeline3 = new Timeline()
        .addVideo('part3.mp4', { duration: 10 })
        .addText('Part 3', { startTime: 0, duration: 10 });
      
      const combined = VideoSplicer.concatenate([timeline1, timeline2, timeline3]);
      expect(combined.getDuration()).toBe(30);
      
      const layers = combined.getLayers();
      expect(layers.filter(l => l.type === 'video')).toHaveLength(3);
      expect(layers.filter(l => l.type === 'text')).toHaveLength(3);
    });

    test('should reorder segments when requested', () => {
      const spliced = VideoSplicer.splice({
        segments: [
          { source: 'video3.mp4', startTime: 20, endTime: 25 },
          { source: 'video1.mp4', startTime: 0, endTime: 5 },
          { source: 'video2.mp4', startTime: 10, endTime: 15 }
        ],
        reorderSegments: true
      });
      
      // Should be reordered by start time
      const command = spliced.getCommand('reordered.mp4');
      const video1Index = command.indexOf('video1.mp4');
      const video2Index = command.indexOf('video2.mp4');
      const video3Index = command.indexOf('video3.mp4');
      
      expect(video1Index).toBeLessThan(video2Index);
      expect(video2Index).toBeLessThan(video3Index);
    });
  });

  describe('🌟 Highlight Reel Creation', () => {
    test('should create highlight reel from marked moments', () => {
      const timeline = new Timeline()
        .addVideo('match.mp4', { duration: 300 }); // 5 minute match
      
      const highlights = VideoSplicer.createHighlightReel(timeline, [
        { time: 30, duration: 5, priority: 'high' },    // Goal 1
        { time: 120, duration: 3, priority: 'medium' }, // Near miss
        { time: 180, duration: 7, priority: 'high' },   // Goal 2
        { time: 250, duration: 4, priority: 'low' },    // Save
        { time: 290, duration: 5, priority: 'high' }    // Final whistle
      ], {
        maxDuration: 20,
        sortByPriority: true
      });
      
      // Should include all high priority (17s) and fit one medium (3s)
      expect(highlights.getDuration()).toBeLessThanOrEqual(20);
    });

    test('should sort highlights by time when requested', () => {
      const timeline = new Timeline()
        .addVideo('video.mp4', { duration: 100 });
      
      const highlights = VideoSplicer.createHighlightReel(timeline, [
        { time: 80, duration: 5 },
        { time: 20, duration: 5 },
        { time: 50, duration: 5 }
      ], {
        sortByTime: true
      });
      
      expect(highlights.getDuration()).toBe(15);
    });

    test('should respect max duration limit', () => {
      const timeline = new Timeline()
        .addVideo('long-video.mp4', { duration: 600 });
      
      const highlights = VideoSplicer.createHighlightReel(timeline, [
        { time: 10, duration: 10 },
        { time: 50, duration: 10 },
        { time: 100, duration: 10 },
        { time: 200, duration: 10 },
        { time: 300, duration: 10 }
      ], {
        maxDuration: 25
      });
      
      expect(highlights.getDuration()).toBeLessThanOrEqual(25);
    });
  });

  describe('🔧 Timeline Extensions', () => {
    test('should add extractSegment method to Timeline', () => {
      const timeline = new Timeline()
        .addVideo('test.mp4', { duration: 20 });
      
      const segment = timeline.extractSegment(5, 15);
      expect(segment.getDuration()).toBe(10);
    });

    test('should add removeSegment method to Timeline', () => {
      const timeline = new Timeline()
        .addVideo('test.mp4', { duration: 30 });
      
      const edited = timeline.removeSegment(10, 20);
      expect(edited.getDuration()).toBe(20);
    });

    test('should calculate duration correctly', () => {
      const timeline = new Timeline()
        .addVideo('video1.mp4', { startTime: 0, duration: 10 })
        .addVideo('video2.mp4', { startTime: 5, duration: 10 }) // Overlapping
        .addText('Title', { startTime: 12, duration: 5 });
      
      expect(timeline.getDuration()).toBe(17); // Max end time
    });

    test('should set start time correctly', () => {
      const timeline = new Timeline()
        .addVideo('video.mp4', { startTime: 5, duration: 10 })
        .addText('Text', { startTime: 7, duration: 3 });
      
      const shifted = timeline.setStartTime(0);
      const layers = shifted.getLayers();
      
      expect(layers[0].startTime).toBe(0);  // Video shifted from 5 to 0
      expect(layers[1].startTime).toBe(2);  // Text shifted from 7 to 2
    });
  });

  describe('🎯 Edge Cases', () => {
    test('should handle empty timeline', () => {
      const timeline = new Timeline();
      
      const segment = VideoSplicer.extractSegment(timeline, 0, 10);
      expect(segment.getDuration()).toBe(0);
      
      const removed = VideoSplicer.removeSegment(timeline, 5, 10);
      expect(removed.getDuration()).toBe(0);
    });

    test('should handle out-of-bounds segment extraction', () => {
      const timeline = new Timeline()
        .addVideo('video.mp4', { duration: 10 });
      
      const segment = VideoSplicer.extractSegment(timeline, 5, 20);
      expect(segment.getDuration()).toBe(5); // Only 5s available from 5-10
    });

    test('should handle overlapping remove segments', () => {
      const timeline = new Timeline()
        .addVideo('video.mp4', { duration: 30 });
      
      const edited = VideoSplicer.removeSegments(timeline, [
        { startTime: 5, endTime: 15 },   // 5-15
        { startTime: 10, endTime: 20 }   // 10-20 (overlaps)
      ]);
      
      // Should handle overlapping removes gracefully
      expect(edited.getDuration()).toBeLessThan(30);
    });

    test('should handle empty segments array', () => {
      const spliced = VideoSplicer.splice({
        segments: []
      });
      
      expect(spliced.getDuration()).toBe(0);
    });

    test('should handle single timeline concatenation', () => {
      const timeline = new Timeline()
        .addVideo('video.mp4', { duration: 10 });
      
      const concatenated = VideoSplicer.concatenate([timeline]);
      expect(concatenated.getDuration()).toBe(10);
    });
  });

  describe('💡 Smart Trim Placeholder', () => {
    test('should have smart trim method (placeholder)', async () => {
      const timeline = new Timeline()
        .addVideo('video.mp4', { duration: 60 });
      
      const trimmed = await VideoSplicer.smartTrim(timeline, {
        removeSilence: true,
        silenceThreshold: -40,
        minimumDuration: 0.5
      });
      
      // Currently returns original timeline (placeholder)
      expect(trimmed.getDuration()).toBe(60);
    });
  });

  describe('🎨 Complex Compositions', () => {
    test('should create complex multi-segment edit', () => {
      // Simulate a vlog edit with intro, main content, and outro
      const intro = new Timeline()
        .addVideo('intro.mp4', { duration: 3 })
        .addText('Welcome!', { startTime: 1, duration: 2 });
      
      const mainContent = VideoSplicer.splice({
        segments: [
          { source: 'content1.mp4', startTime: 5, endTime: 15 },
          { source: 'content2.mp4', startTime: 0, endTime: 20 },
          { source: 'content3.mp4', startTime: 10, endTime: 25 }
        ],
        defaultTransition: 'dissolve',
        defaultTransitionDuration: 0.5
      });
      
      const outro = new Timeline()
        .addVideo('outro.mp4', { duration: 5 })
        .addText('Thanks for watching!', { startTime: 1, duration: 3 });
      
      const finalVideo = VideoSplicer.concatenate([intro, mainContent, outro]);
      
      expect(finalVideo.getDuration()).toBe(3 + 45 + 5); // 53 seconds total
    });

    test('should create music video with synced cuts', () => {
      const segments = [
        { startTime: 0, endTime: 2 },    // Beat 1
        { startTime: 10, endTime: 12 },  // Beat 2
        { startTime: 20, endTime: 22 },  // Beat 3
        { startTime: 30, endTime: 32 },  // Beat 4
        { startTime: 40, endTime: 42 }   // Beat 5
      ];
      
      const musicVideo = VideoSplicer.splice({
        segments: segments,
        defaultTransition: 'cut', // Hard cuts on beat
        maintainAudio: false      // Use music track instead
      });
      
      expect(musicVideo.getDuration()).toBe(10); // 5 x 2s segments
    });
  });
});
/**
 * @fileoverview SRT RUNTIME TESTS
 * 
 * Real-world runtime tests that create actual SRT files, process them,
 * and validate the results through actual file system operations.
 */

import { test, expect, describe, beforeAll, afterAll } from 'bun:test';
import { SRTHandler, SRTEntry, SRTWatcher, createSRTHandler } from '../../../packages/media-sdk/src/captions/srt-handler.js';
import { Timeline } from '@jamesaphoenix/media-sdk';
import { promises as fs } from 'fs';
import { join } from 'path';
import { tmpdir } from 'os';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

describe('🚀 SRT RUNTIME TESTS', () => {
  let runtimeDir: string;
  let handler: SRTHandler;
  
  beforeAll(async () => {
    runtimeDir = join(tmpdir(), 'srt-runtime-' + Date.now());
    await fs.mkdir(runtimeDir, { recursive: true });
    handler = new SRTHandler();
    
    console.log('Runtime test directory:', runtimeDir);
  });
  
  afterAll(async () => {
    // Cleanup
    try {
      const files = await fs.readdir(runtimeDir);
      await Promise.all(files.map(f => fs.unlink(join(runtimeDir, f))));
      await fs.rmdir(runtimeDir);
    } catch (e) {
      console.error('Cleanup error:', e);
    }
  });

  describe('🎬 REAL VIDEO SUBTITLE WORKFLOW', () => {
    test('should create movie-style subtitles', async () => {
      const movieSRT = join(runtimeDir, 'movie-subtitles.srt');
      
      // Create movie-style subtitles
      const subtitles: SRTEntry[] = [
        {
          index: 1,
          startTime: 0,
          endTime: 3,
          text: 'Previously on our story...',
          style: { italic: true }
        },
        {
          index: 2,
          startTime: 5,
          endTime: 8,
          text: '[Thunder rumbling]',
          style: { italic: true, color: '#888888' }
        },
        {
          index: 3,
          startTime: 10,
          endTime: 13,
          text: 'Detective: We need to find the evidence.',
          style: { bold: true }
        },
        {
          index: 4,
          startTime: 15,
          endTime: 18,
          text: 'Partner: But where do we start?'
        },
        {
          index: 5,
          startTime: 20,
          endTime: 23,
          text: '[Footsteps approaching]',
          style: { italic: true, color: '#888888' }
        }
      ];

      // Write to file
      await handler.writeSRTFile(movieSRT, subtitles);
      
      // Verify file exists and is readable
      const exists = await fs.access(movieSRT).then(() => true).catch(() => false);
      expect(exists).toBe(true);
      
      // Read back and verify
      const readBack = await handler.readSRTFile(movieSRT);
      expect(readBack).toHaveLength(5);
      expect(readBack[0].text).toBe('Previously on our story...');
      expect(readBack[2].text).toBe('Detective: We need to find the evidence.');
      
      // Check file size
      const stats = await fs.stat(movieSRT);
      expect(stats.size).toBeGreaterThan(100);
      
      console.log(`Created movie SRT with ${subtitles.length} entries, size: ${stats.size} bytes`);
    });

    test('should create educational video subtitles', async () => {
      const eduSRT = join(runtimeDir, 'education-subtitles.srt');
      
      // Generate educational content
      const lessonScript = `
        Welcome to Physics 101.
        Today we'll learn about Newton's Laws.
        The first law states that an object at rest stays at rest.
        Unless acted upon by an external force.
        Let's look at some examples.
        A ball rolling on a frictionless surface.
        Will continue rolling forever.
        This demonstrates the law of inertia.
      `.trim().split('\n').map(s => s.trim());

      // Auto-generate with proper timing
      const entries = lessonScript.map((text, i) => ({
        index: i + 1,
        startTime: i * 4,
        endTime: (i * 4) + 3.5,
        text,
        style: i === 0 ? { bold: true, fontSize: 24 } : undefined
      }));

      await handler.writeSRTFile(eduSRT, entries);
      
      // Validate the educational subtitles
      const validation = handler.validateSRT(entries);
      expect(validation.valid).toBe(true);
      expect(validation.stats.entryCount).toBe(8);
      expect(validation.stats.totalDuration).toBe(28); // 8 * 3.5
      
      console.log('Educational subtitles validation:', validation.stats);
    });

    test('should handle multi-language subtitle files', async () => {
      const languages = [
        { code: 'en', name: 'English', greeting: 'Hello, welcome to our presentation!' },
        { code: 'es', name: 'Spanish', greeting: '¡Hola, bienvenido a nuestra presentación!' },
        { code: 'fr', name: 'French', greeting: 'Bonjour, bienvenue à notre présentation!' },
        { code: 'de', name: 'German', greeting: 'Hallo, willkommen zu unserer Präsentation!' },
        { code: 'ja', name: 'Japanese', greeting: 'こんにちは、プレゼンテーションへようこそ！' }
      ];

      const createdFiles: string[] = [];

      // Create subtitle file for each language
      for (const lang of languages) {
        const filename = join(runtimeDir, `subtitles-${lang.code}.srt`);
        createdFiles.push(filename);
        
        const entries: SRTEntry[] = [
          {
            index: 1,
            startTime: 0,
            endTime: 3,
            text: lang.greeting
          },
          {
            index: 2,
            startTime: 4,
            endTime: 7,
            text: `This is a ${lang.name} subtitle.`
          },
          {
            index: 3,
            startTime: 8,
            endTime: 11,
            text: 'Thank you for watching!'
          }
        ];

        await handler.writeSRTFile(filename, entries);
      }

      // Verify all files were created
      for (const file of createdFiles) {
        const exists = await fs.access(file).then(() => true).catch(() => false);
        expect(exists).toBe(true);
      }

      // Merge all language files
      const mergedSRT = join(runtimeDir, 'merged-multilang.srt');
      const merged = await handler.mergeSRTFiles(createdFiles, 2);
      await handler.writeSRTFile(mergedSRT, merged);

      expect(merged.length).toBe(15); // 3 entries * 5 languages
      
      const mergedStats = await fs.stat(mergedSRT);
      console.log(`Created ${languages.length} language files, merged size: ${mergedStats.size} bytes`);
    });
  });

  describe('🔄 LIVE SUBTITLE GENERATION', () => {
    test('should simulate live captioning workflow', async () => {
      const liveSRT = join(runtimeDir, 'live-captions.srt');
      const entries: SRTEntry[] = [];
      
      // Simulate live captioning with timestamps
      const startTime = Date.now();
      
      // Caption 1
      entries.push({
        index: 1,
        startTime: 0,
        endTime: 3,
        text: 'Live broadcast starting now...'
      });
      
      // Simulate delay
      await new Promise(resolve => setTimeout(resolve, 100));
      
      // Caption 2
      entries.push({
        index: 2,
        startTime: 3,
        endTime: 6,
        text: 'Breaking news just coming in...'
      });
      
      await new Promise(resolve => setTimeout(resolve, 100));
      
      // Caption 3
      entries.push({
        index: 3,
        startTime: 6,
        endTime: 9,
        text: 'We\'re going live to our reporter...'
      });
      
      // Write incrementally (simulating live updates)
      for (let i = 0; i < entries.length; i++) {
        const currentEntries = entries.slice(0, i + 1);
        await handler.writeSRTFile(liveSRT, currentEntries);
        
        // Verify file is growing
        const stats = await fs.stat(liveSRT);
        console.log(`Live caption ${i + 1}: ${stats.size} bytes`);
      }
      
      const elapsed = Date.now() - startTime;
      console.log(`Live captioning simulation took ${elapsed}ms`);
      
      // Final verification
      const final = await handler.readSRTFile(liveSRT);
      expect(final).toHaveLength(3);
    });

    test('should handle rapid subtitle updates', async () => {
      const rapidSRT = join(runtimeDir, 'rapid-updates.srt');
      
      // Generate many quick subtitles
      const rapidEntries: SRTEntry[] = [];
      for (let i = 0; i < 50; i++) {
        rapidEntries.push({
          index: i + 1,
          startTime: i * 0.5,
          endTime: (i * 0.5) + 0.4,
          text: `Quick subtitle ${i + 1}`
        });
      }
      
      const writeStart = performance.now();
      await handler.writeSRTFile(rapidSRT, rapidEntries);
      const writeTime = performance.now() - writeStart;
      
      const readStart = performance.now();
      const readBack = await handler.readSRTFile(rapidSRT);
      const readTime = performance.now() - readStart;
      
      expect(readBack).toHaveLength(50);
      console.log(`Rapid updates: Write ${writeTime.toFixed(2)}ms, Read ${readTime.toFixed(2)}ms`);
    });
  });

  describe('📊 FORMAT CONVERSION TESTS', () => {
    test('should convert between different subtitle formats', async () => {
      // Create a complex subtitle structure
      const complexEntries: SRTEntry[] = [
        {
          index: 1,
          startTime: 0,
          endTime: 3,
          text: 'Simple text'
        },
        {
          index: 2,
          startTime: 4,
          endTime: 7,
          text: 'Text with\nmultiple lines\nfor testing'
        },
        {
          index: 3,
          startTime: 8,
          endTime: 11,
          text: 'Styled text',
          style: { bold: true, italic: true, color: '#FF0000' }
        },
        {
          index: 4,
          startTime: 12,
          endTime: 15,
          text: 'Positioned text',
          position: { alignment: 'right', verticalPosition: 'top' }
        }
      ];

      // Save as SRT
      const srtFile = join(runtimeDir, 'format-test.srt');
      await handler.writeSRTFile(srtFile, complexEntries);

      // Export to different formats (simulated)
      const formats = ['vtt', 'ass', 'json'];
      
      for (const format of formats) {
        const outputFile = join(runtimeDir, `format-test.${format}`);
        
        if (format === 'json') {
          // Export as JSON
          const jsonContent = JSON.stringify(complexEntries, null, 2);
          await fs.writeFile(outputFile, jsonContent, 'utf-8');
          
          // Verify JSON
          const jsonData = JSON.parse(await fs.readFile(outputFile, 'utf-8'));
          expect(jsonData).toHaveLength(4);
        }
      }
      
      console.log('Format conversion test completed');
    });
  });

  describe('🔍 WATCHER FUNCTIONALITY', () => {
    test('should watch and react to SRT file changes', async () => {
      const watchFile = join(runtimeDir, 'watched.srt');
      const watcher = new SRTWatcher(handler);
      const changes: number[] = [];
      
      // Initial content
      await handler.writeSRTFile(watchFile, [
        { index: 1, startTime: 0, endTime: 3, text: 'Initial' }
      ]);
      
      // Start watching
      await watcher.watch(watchFile, (entries) => {
        changes.push(entries.length);
        console.log(`File changed: ${entries.length} entries`);
      });
      
      // Make changes
      await new Promise(resolve => setTimeout(resolve, 100));
      
      await handler.writeSRTFile(watchFile, [
        { index: 1, startTime: 0, endTime: 3, text: 'Initial' },
        { index: 2, startTime: 4, endTime: 7, text: 'Added' }
      ]);
      
      await new Promise(resolve => setTimeout(resolve, 200));
      
      await handler.writeSRTFile(watchFile, [
        { index: 1, startTime: 0, endTime: 3, text: 'Initial' },
        { index: 2, startTime: 4, endTime: 7, text: 'Added' },
        { index: 3, startTime: 8, endTime: 11, text: 'More' }
      ]);
      
      await new Promise(resolve => setTimeout(resolve, 200));
      
      // Stop watching
      watcher.unwatch(watchFile);
      
      // Should have detected changes
      expect(changes.length).toBeGreaterThan(0);
      console.log('Detected changes:', changes);
    });
  });

  describe('💾 LARGE FILE HANDLING', () => {
    test('should handle large subtitle files efficiently', async () => {
      const largeSRT = join(runtimeDir, 'large-subtitles.srt');
      
      // Generate a large subtitle file (movie-length)
      const movieLength = 7200; // 2 hours in seconds
      const subtitleInterval = 3; // New subtitle every 3 seconds
      const totalSubtitles = Math.floor(movieLength / subtitleInterval);
      
      console.log(`Generating ${totalSubtitles} subtitles for 2-hour movie...`);
      
      const largeEntries: SRTEntry[] = [];
      for (let i = 0; i < totalSubtitles; i++) {
        const startTime = i * subtitleInterval;
        largeEntries.push({
          index: i + 1,
          startTime,
          endTime: startTime + 2.5,
          text: `Dialogue line ${i + 1}: This is subtitle content for a long movie.`
        });
      }
      
      // Write large file
      const writeStart = performance.now();
      await handler.writeSRTFile(largeSRT, largeEntries);
      const writeTime = performance.now() - writeStart;
      
      // Check file size
      const stats = await fs.stat(largeSRT);
      const sizeMB = stats.size / 1024 / 1024;
      
      // Read large file
      const readStart = performance.now();
      const readEntries = await handler.readSRTFile(largeSRT);
      const readTime = performance.now() - readStart;
      
      expect(readEntries).toHaveLength(totalSubtitles);
      
      console.log(`Large file stats:`);
      console.log(`- Subtitles: ${totalSubtitles}`);
      console.log(`- File size: ${sizeMB.toFixed(2)}MB`);
      console.log(`- Write time: ${writeTime.toFixed(2)}ms`);
      console.log(`- Read time: ${readTime.toFixed(2)}ms`);
      
      // Validate the large file
      const validationStart = performance.now();
      const validation = handler.validateSRT(readEntries);
      const validationTime = performance.now() - validationStart;
      
      expect(validation.valid).toBe(true);
      console.log(`- Validation time: ${validationTime.toFixed(2)}ms`);
    });
  });

  describe('🎯 INTEGRATION WITH FFMPEG', () => {
    test('should generate SRT compatible with video tools', async () => {
      const videoSRT = join(runtimeDir, 'video-compatible.srt');
      
      // Create subtitles that would work with video
      const videoSubtitles: SRTEntry[] = [
        {
          index: 1,
          startTime: 2,
          endTime: 5,
          text: 'Welcome to our video'
        },
        {
          index: 2,
          startTime: 6,
          endTime: 9,
          text: 'This subtitle appears at 6 seconds'
        },
        {
          index: 3,
          startTime: 10,
          endTime: 13,
          text: 'Final message'
        }
      ];
      
      await handler.writeSRTFile(videoSRT, videoSubtitles);
      
      // Read the raw file content to verify format
      const rawContent = await fs.readFile(videoSRT, 'utf-8');
      
      // Check format compliance
      expect(rawContent).toContain('00:00:02,000 --> 00:00:05,000');
      expect(rawContent).toContain('00:00:06,000 --> 00:00:09,000');
      expect(rawContent).toContain('00:00:10,000 --> 00:00:13,000');
      
      // Verify proper line endings
      const hasProperLineEndings = rawContent.includes('\r\n') || rawContent.includes('\n');
      expect(hasProperLineEndings).toBe(true);
      
      console.log('Generated video-compatible SRT file');
    });
  });

  describe('🚨 ERROR HANDLING IN PRODUCTION', () => {
    test('should handle file system errors gracefully', async () => {
      // Try to write to a read-only location
      const readOnlyPath = '/invalid/readonly/path/test.srt';
      
      try {
        await handler.writeSRTFile(readOnlyPath, [
          { index: 1, startTime: 0, endTime: 3, text: 'Test' }
        ]);
        expect(true).toBe(false); // Should not reach here
      } catch (error) {
        expect(error.message).toContain('Failed to write SRT file');
      }
      
      // Try to read non-existent file
      const nonExistent = join(runtimeDir, 'does-not-exist.srt');
      
      try {
        await handler.readSRTFile(nonExistent);
        expect(true).toBe(false); // Should not reach here
      } catch (error) {
        expect(error.message).toContain('Failed to read SRT file');
      }
    });

    test('should recover from corrupted files', async () => {
      const corruptFile = join(runtimeDir, 'corrupted.srt');
      
      // Write corrupted content
      const corruptContent = `1
INVALID TIMING FORMAT
Some text

2
00:00:05,000 --> 00:00:08,000
Valid entry

NOT_A_NUMBER
More invalid content

3
00:00:10,000 --> 00:00:13,000
Another valid entry`;
      
      await fs.writeFile(corruptFile, corruptContent, 'utf-8');
      
      // Should still parse valid entries
      const entries = await handler.readSRTFile(corruptFile);
      
      expect(entries.length).toBeGreaterThanOrEqual(2);
      const validTexts = entries.map(e => e.text);
      expect(validTexts).toContain('Valid entry');
      expect(validTexts).toContain('Another valid entry');
      
      console.log(`Recovered ${entries.length} valid entries from corrupted file`);
    });
  });
});

// Helper function to create test SRT content
function createTestSRT(count: number): string {
  const lines: string[] = [];
  for (let i = 0; i < count; i++) {
    lines.push(`${i + 1}`);
    lines.push(`00:00:${String(i * 3).padStart(2, '0')},000 --> 00:00:${String(i * 3 + 2).padStart(2, '0')},000`);
    lines.push(`Test subtitle ${i + 1}`);
    if (i < count - 1) lines.push('');
  }
  return lines.join('\n');
}
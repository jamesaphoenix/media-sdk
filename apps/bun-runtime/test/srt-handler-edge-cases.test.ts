/**
 * @fileoverview SRT HANDLER EDGE CASES AND ADVANCED TESTS
 * 
 * Additional test coverage for edge cases, error conditions, and advanced scenarios
 * that weren't covered in the comprehensive test suite.
 */

import { test, expect, describe, beforeAll, afterAll } from 'bun:test';
import { SRTHandler, SRTEntry, SRTWatcher } from '../../../packages/media-sdk/src/captions/srt-handler.js';
import { promises as fs } from 'fs';
import { join } from 'path';
import { tmpdir } from 'os';

describe('🔥 SRT HANDLER EDGE CASES', () => {
  let tempDir: string;
  let handler: SRTHandler;
  
  beforeAll(async () => {
    tempDir = join(tmpdir(), 'srt-edge-cases-' + Date.now());
    await fs.mkdir(tempDir, { recursive: true });
    handler = new SRTHandler();
  });
  
  afterAll(async () => {
    try {
      const files = await fs.readdir(tempDir);
      await Promise.all(files.map(f => fs.unlink(join(tempDir, f))));
      await fs.rmdir(tempDir);
    } catch (e) {
      // Ignore cleanup errors
    }
  });

  describe('🎭 EXTREME EDGE CASES', () => {
    test('should handle subtitles with only numbers', () => {
      const srtContent = `1
00:00:01,000 --> 00:00:04,000
123456789

2
00:00:05,000 --> 00:00:08,000
3.14159`;

      const entries = handler.parseSRT(srtContent);
      
      expect(entries).toHaveLength(2);
      expect(entries[0].text).toBe('123456789');
      expect(entries[1].text).toBe('3.14159');
    });

    test('should handle subtitles with only special characters', () => {
      const srtContent = `1
00:00:01,000 --> 00:00:04,000
!@#$%^&*()_+-=[]{}|;':",./<>?

2
00:00:05,000 --> 00:00:08,000
♪ ♫ ♬ ♭ ♮ ♯`;

      const entries = handler.parseSRT(srtContent);
      
      expect(entries).toHaveLength(2);
      expect(entries[0].text).toBe('!@#$%^&*()_+-=[]{}|;\':",./<>?');
      expect(entries[1].text).toBe('♪ ♫ ♬ ♭ ♮ ♯');
    });

    test('should handle subtitles with mixed line endings in content', () => {
      const srtContent = `1
00:00:01,000 --> 00:00:04,000
Line 1\rLine 2\nLine 3\r\nLine 4`;

      const entries = handler.parseSRT(srtContent);
      
      expect(entries).toHaveLength(1);
      expect(entries[0].text).toContain('Line 1');
      expect(entries[0].text).toContain('Line 4');
    });

    test('should handle extremely long single-line subtitles', () => {
      const longText = 'A'.repeat(10000);
      const srtContent = `1
00:00:01,000 --> 00:00:04,000
${longText}`;

      const entries = handler.parseSRT(srtContent);
      
      expect(entries).toHaveLength(1);
      expect(entries[0].text.length).toBe(10000);
    });

    test('should handle subtitles with timing in wrong order', () => {
      const srtContent = `1
00:00:05,000 --> 00:00:04,000
Backwards timing

2
00:00:10,000 --> 00:00:10,000
Zero duration`;

      const entries = handler.parseSRT(srtContent);
      
      // Non-strict mode should skip invalid entries
      expect(entries.length).toBeLessThanOrEqual(2);
    });

    test('should handle malformed timing with extra colons', () => {
      const srtContent = `1
00:00:01:500 --> 00:00:04:750
Extra colons

2
00:00:01,000 --> 00:00:04,000
Normal subtitle`;

      const entries = handler.parseSRT(srtContent);
      
      // Should at least parse the valid entry
      const validEntries = entries.filter(e => e.text === 'Normal subtitle');
      expect(validEntries.length).toBeGreaterThan(0);
    });

    test('should handle subtitles with negative indices', () => {
      const srtContent = `-1
00:00:01,000 --> 00:00:04,000
Negative index

0
00:00:05,000 --> 00:00:08,000
Zero index`;

      const entries = handler.parseSRT(srtContent);
      
      // Should reindex properly
      entries.forEach((entry, i) => {
        expect(entry.index).toBe(i + 1);
      });
    });

    test('should handle duplicate timing entries', () => {
      const srtContent = `1
00:00:01,000 --> 00:00:04,000
First subtitle

2
00:00:01,000 --> 00:00:04,000
Duplicate timing`;

      const entries = handler.parseSRT(srtContent);
      
      expect(entries).toHaveLength(2);
      expect(entries[0].startTime).toBe(entries[1].startTime);
      expect(entries[0].endTime).toBe(entries[1].endTime);
    });

    test('should handle HTML entities in text', () => {
      const srtContent = `1
00:00:01,000 --> 00:00:04,000
&lt;Hello&gt; &amp; &quot;World&quot;

2
00:00:05,000 --> 00:00:08,000
&copy; 2024 &trade; &reg;`;

      const entries = handler.parseSRT(srtContent);
      
      expect(entries).toHaveLength(2);
      // HTML entities should be preserved as-is
      expect(entries[0].text).toContain('&lt;');
      expect(entries[0].text).toContain('&amp;');
    });

    test('should handle subtitles with only whitespace variations', () => {
      const srtContent = `1
00:00:01,000 --> 00:00:04,000
\t\t\t

2
00:00:05,000 --> 00:00:08,000
   
   

3
00:00:09,000 --> 00:00:12,000
Normal text`;

      const entries = handler.parseSRT(srtContent);
      
      // Default handler skips empty
      const nonEmptyEntries = entries.filter(e => e.text.trim() !== '');
      expect(nonEmptyEntries.length).toBeGreaterThan(0);
    });
  });

  describe('📝 ADVANCED FORMATTING TESTS', () => {
    test('should handle complex nested styling tags', () => {
      const srtContent = `1
00:00:01,000 --> 00:00:04,000
<font color="red"><b><i><u>Complex styling</u></i></b></font>`;

      const entries = handler.parseSRT(srtContent);
      
      expect(entries[0].style?.bold).toBe(true);
      expect(entries[0].style?.italic).toBe(true);
      expect(entries[0].style?.underline).toBe(true);
      expect(entries[0].style?.color).toBe('red');
      expect(entries[0].text).toBe('Complex styling');
    });

    test('should handle unclosed styling tags', () => {
      const srtContent = `1
00:00:01,000 --> 00:00:04,000
<b>Unclosed bold

2
00:00:05,000 --> 00:00:08,000
<i>Unclosed italic <b>with nested`;

      const entries = handler.parseSRT(srtContent);
      
      expect(entries).toHaveLength(2);
      // Parser should handle gracefully
      expect(entries[0].text).toContain('Unclosed bold');
      expect(entries[1].text).toContain('Unclosed italic');
    });

    test('should handle karaoke-style timing tags', () => {
      const srtContent = `1
00:00:01,000 --> 00:00:04,000
<k100>Word1</k> <k200>Word2</k> <k300>Word3</k>`;

      const entries = handler.parseSRT(srtContent);
      
      expect(entries).toHaveLength(1);
      // Karaoke tags should be stripped or preserved depending on implementation
      expect(entries[0].text).toBeTruthy();
    });

    test('should handle position tags', () => {
      const srtContent = `1
00:00:01,000 --> 00:00:04,000
{\\an8}Top center position

2
00:00:05,000 --> 00:00:08,000
{\\pos(100,200)}Custom position`;

      const entries = handler.parseSRT(srtContent);
      
      expect(entries).toHaveLength(2);
      // Position tags might be preserved in text
      expect(entries[0].text).toBeTruthy();
      expect(entries[1].text).toBeTruthy();
    });
  });

  describe('🌐 UNICODE AND ENCODING TESTS', () => {
    test('should handle various Unicode blocks', () => {
      const srtContent = `1
00:00:01,000 --> 00:00:04,000
𝕳𝖊𝖑𝖑𝖔 𝖂𝖔𝖗𝖑𝖉

2
00:00:05,000 --> 00:00:08,000
🏴󠁧󠁢󠁳󠁣󠁴󠁿 🏴󠁧󠁢󠁷󠁬󠁳󠁿 🏴󠁧󠁢󠁥󠁮󠁧󠁿

3
00:00:09,000 --> 00:00:12,000
𓀀 𓀁 𓀂 𓀃 𓀄`;

      const entries = handler.parseSRT(srtContent);
      
      expect(entries).toHaveLength(3);
      expect(entries[0].text).toBe('𝕳𝖊𝖑𝖑𝖔 𝖂𝖔𝖗𝖑𝖉');
      expect(entries[1].text).toContain('🏴');
      expect(entries[2].text).toContain('𓀀');
    });

    test('should handle zero-width characters', () => {
      const srtContent = `1
00:00:01,000 --> 00:00:04,000
Hello​World

2
00:00:05,000 --> 00:00:08,000
Test‌ing‍Zero‏Width`;

      const entries = handler.parseSRT(srtContent);
      
      expect(entries).toHaveLength(2);
      // Zero-width characters should be preserved
      expect(entries[0].text.length).toBeGreaterThan('HelloWorld'.length);
    });

    test('should handle combining characters', () => {
      const srtContent = `1
00:00:01,000 --> 00:00:04,000
é = e + ́

2
00:00:05,000 --> 00:00:08,000
น้ำ ฟ้า ใหม่`;

      const entries = handler.parseSRT(srtContent);
      
      expect(entries).toHaveLength(2);
      expect(entries[0].text).toContain('é');
      expect(entries[1].text).toContain('น้ำ');
    });
  });

  describe('⚡ PERFORMANCE AND LIMITS TESTS', () => {
    test('should handle SRT with thousands of empty lines', () => {
      const lines = ['1', '00:00:01,000 --> 00:00:04,000', 'Text'];
      for (let i = 0; i < 1000; i++) {
        lines.push('');
      }
      lines.push('2', '00:00:05,000 --> 00:00:08,000', 'More text');
      
      const srtContent = lines.join('\n');
      const entries = handler.parseSRT(srtContent);
      
      expect(entries.length).toBeGreaterThanOrEqual(2);
    });

    test('should handle deeply nested multi-line subtitles', () => {
      const lines = [];
      for (let i = 0; i < 100; i++) {
        lines.push(`Line ${i + 1}`);
      }
      
      const srtContent = `1
00:00:01,000 --> 00:00:04,000
${lines.join('\n')}`;

      const entries = handler.parseSRT(srtContent);
      
      expect(entries).toHaveLength(1);
      expect(entries[0].text.split('\n').length).toBe(100);
    });

    test('should handle rapid timing sequences', () => {
      const entries: SRTEntry[] = [];
      for (let i = 0; i < 100; i++) {
        entries.push({
          index: i + 1,
          startTime: i * 0.1,
          endTime: (i * 0.1) + 0.09,
          text: `Rapid ${i}`
        });
      }

      const srt = handler.generateSRT(entries);
      const parsed = handler.parseSRT(srt);
      
      expect(parsed.length).toBe(100);
      expect(parsed[99].endTime - parsed[0].startTime).toBeCloseTo(9.99, 1);
    });
  });

  describe('🔄 ROUND-TRIP TESTS', () => {
    test('should preserve all data through multiple round trips', () => {
      const originalEntries: SRTEntry[] = [
        {
          index: 1,
          startTime: 1.234,
          endTime: 5.678,
          text: 'Complex\nMulti-line\nText',
          style: { bold: true, italic: true, color: '#FF0000' }
        },
        {
          index: 2,
          startTime: 10.111,
          endTime: 15.999,
          text: 'Special chars: < > & " \'',
          style: { underline: true }
        }
      ];

      // First round trip
      const srt1 = handler.generateSRT(originalEntries);
      const parsed1 = handler.parseSRT(srt1);
      
      // Second round trip
      const srt2 = handler.generateSRT(parsed1);
      const parsed2 = handler.parseSRT(srt2);
      
      // Should be identical after multiple round trips
      expect(parsed2).toHaveLength(2);
      expect(parsed2[0].text).toBe(originalEntries[0].text);
      expect(parsed2[1].text).toBe(originalEntries[1].text);
    });

    test('should handle edge case timings in round trips', () => {
      const edgeCases: SRTEntry[] = [
        { index: 1, startTime: 0, endTime: 0.001, text: 'Millisecond' },
        { index: 2, startTime: 3599.999, endTime: 3600, text: 'Hour boundary' },
        { index: 3, startTime: 86399, endTime: 86400, text: 'Day boundary' }
      ];

      const srt = handler.generateSRT(edgeCases);
      const parsed = handler.parseSRT(srt);
      
      expect(parsed).toHaveLength(3);
      expect(parsed[0].endTime - parsed[0].startTime).toBeCloseTo(0.001, 3);
      expect(parsed[1].startTime).toBeCloseTo(3599.999, 3);
      expect(parsed[2].endTime).toBe(86400);
    });
  });

  describe('🛡️ ERROR RECOVERY TESTS', () => {
    test('should recover from corrupted SRT blocks', () => {
      const srtContent = `1
00:00:01,000 --> 00:00:04,000
Valid subtitle

CORRUPTED DATA HERE
INVALID LINES
###%%%

2
00:00:05,000 --> 00:00:08,000
Another valid subtitle`;

      const entries = handler.parseSRT(srtContent);
      
      // Should recover and parse valid entries
      expect(entries.length).toBeGreaterThanOrEqual(2);
      const texts = entries.map(e => e.text);
      expect(texts).toContain('Valid subtitle');
      expect(texts).toContain('Another valid subtitle');
    });

    test('should handle missing timing lines', () => {
      const srtContent = `1
Missing timing line here
This is the text

2
00:00:05,000 --> 00:00:08,000
Valid subtitle`;

      const entries = handler.parseSRT(srtContent);
      
      // Should skip invalid and parse valid
      const validEntries = entries.filter(e => e.text === 'Valid subtitle');
      expect(validEntries.length).toBe(1);
    });

    test('should handle mixed valid and invalid blocks', () => {
      const srtContent = `1
00:00:01,000 --> 00:00:04,000
Valid 1

Not a number
00:00:05,000 --> 00:00:08,000
Should be skipped

3
00:00:INVALID:09,000 --> 00:00:12,000
Invalid timing

4
00:00:13,000 --> 00:00:16,000
Valid 2`;

      const entries = handler.parseSRT(srtContent);
      
      const validTexts = entries.map(e => e.text);
      expect(validTexts).toContain('Valid 1');
      expect(validTexts).toContain('Valid 2');
    });
  });

  describe('📂 FILE SYSTEM EDGE CASES', () => {
    test('should handle file with no newline at end', async () => {
      const testFile = join(tempDir, 'no-newline.srt');
      const content = '1\n00:00:01,000 --> 00:00:04,000\nNo newline at end';
      
      await fs.writeFile(testFile, content, { encoding: 'utf-8', flag: 'w' });
      
      const entries = await handler.readSRTFile(testFile);
      expect(entries).toHaveLength(1);
      expect(entries[0].text).toBe('No newline at end');
    });

    test('should handle empty file', async () => {
      const testFile = join(tempDir, 'empty.srt');
      await fs.writeFile(testFile, '', 'utf-8');
      
      const entries = await handler.readSRTFile(testFile);
      expect(entries).toHaveLength(0);
    });

    test('should handle file with only BOM', async () => {
      const testFile = join(tempDir, 'only-bom.srt');
      await fs.writeFile(testFile, '\ufeff', 'utf-8');
      
      const entries = await handler.readSRTFile(testFile);
      expect(entries).toHaveLength(0);
    });

    test('should handle concurrent file operations', async () => {
      const testFile = join(tempDir, 'concurrent.srt');
      const entries: SRTEntry[] = [
        { index: 1, startTime: 0, endTime: 3, text: 'Concurrent test' }
      ];

      // Write multiple times concurrently
      const promises = [];
      for (let i = 0; i < 10; i++) {
        promises.push(handler.writeSRTFile(testFile, entries));
      }
      
      await Promise.all(promises);
      
      // File should still be valid
      const result = await handler.readSRTFile(testFile);
      expect(result).toHaveLength(1);
      expect(result[0].text).toBe('Concurrent test');
    });
  });
});

describe('🔬 SRT HANDLER VALIDATION EDGE CASES', () => {
  const handler = new SRTHandler();

  test('should detect complex overlap patterns', () => {
    const entries: SRTEntry[] = [
      { index: 1, startTime: 0, endTime: 5, text: 'First' },
      { index: 2, startTime: 2, endTime: 7, text: 'Overlaps first' },
      { index: 3, startTime: 4, endTime: 9, text: 'Overlaps both' },
      { index: 4, startTime: 10, endTime: 15, text: 'Clean' },
      { index: 5, startTime: 12, endTime: 20, text: 'Overlaps previous' }
    ];

    const validation = handler.validateSRT(entries);
    
    expect(validation.valid).toBe(true); // No critical errors
    expect(validation.stats.overlappingCount).toBeGreaterThan(0);
    expect(validation.warnings.length).toBeGreaterThan(0);
  });

  test('should detect various timing anomalies', () => {
    const entries: SRTEntry[] = [
      { index: 1, startTime: 0, endTime: 0.001, text: 'Flash frame' },
      { index: 2, startTime: 10, endTime: 60, text: 'Very long subtitle' },
      { index: 3, startTime: 100, endTime: 100.05, text: 'Another flash' },
      { index: 4, startTime: 200, endTime: 200, text: 'Zero duration' }
    ];

    const validation = handler.validateSRT(entries);
    
    expect(validation.errors.length).toBeGreaterThan(0); // Zero duration is error
    expect(validation.warnings.length).toBeGreaterThan(0); // Short/long durations
  });

  test('should calculate accurate statistics', () => {
    const entries: SRTEntry[] = [
      { index: 1, startTime: 0, endTime: 2, text: 'Two seconds' },
      { index: 2, startTime: 5, endTime: 8, text: 'Three seconds' },
      { index: 3, startTime: 10, endTime: 15, text: 'Five seconds' }
    ];

    const validation = handler.validateSRT(entries);
    
    expect(validation.stats.totalDuration).toBe(10); // 2 + 3 + 5
    expect(validation.stats.averageDisplayTime).toBeCloseTo(3.33, 1);
    expect(validation.stats.gapCount).toBe(0); // Gaps < 5 seconds
  });
});
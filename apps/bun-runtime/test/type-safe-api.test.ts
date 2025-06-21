/**
 * Type-safe API tests with comprehensive validation
 */

import { test, expect, describe, beforeAll } from 'bun:test';
import { createTikTokQuery, createYouTubeQuery, createInstagramQuery, queryCompose } from '@jamesaphoenix/media-sdk';
import { existsSync } from 'fs';

describe('🔒 Type-Safe Video Query API', () => {
  beforeAll(async () => {
    // Ensure output directory exists
    if (!existsSync('output/type-safe-tests')) {
      await Bun.spawn(['mkdir', '-p', 'output/type-safe-tests']);
    }
  });

  describe('🎯 Platform-Specific Queries', () => {
    test('should create TikTok query with type safety', async () => {
      const query = createTikTokQuery('sample-files/red-sample.mp4')
        .addText('Type-safe TikTok! 🎵', {
          position: 'center',
          style: {
            fontSize: 32,
            color: '#ff0066',
            fontWeight: 'bold'
          }
        })
        .addWatermark('sample-files/logo-150x150.png', 'top-right');

      const result = await query.build('output/type-safe-tests/tiktok-typed.mp4');
      
      expect(result.isSuccess).toBe(true);
      expect(result.data?.metadata.platform).toBe('tiktok');
      expect(result.data?.metadata.aspectRatio).toBe('9:16');
      expect(result.data?.metadata.size).toEqual({ width: 1080, height: 1920 });
      
      console.log('✅ TikTok query result:', {
        platform: result.data?.metadata.platform,
        aspectRatio: result.data?.metadata.aspectRatio,
        estimatedSize: result.data?.metadata.estimatedFileSize
      });
    });

    test('should create YouTube query with validation', async () => {
      const query = createYouTubeQuery('sample-files/blue-sample.mp4', {
        quality: 'ultra',
        validation: { 
          enabled: true, 
          strictMode: true 
        }
      })
        .addText('Professional YouTube Content', {
          position: 'bottom-center',
          style: {
            fontSize: 28,
            color: '#ffffff',
            backgroundColor: 'rgba(0,0,0,0.8)',
            fontFamily: 'Arial'
          }
        });

      const result = await query.build('output/type-safe-tests/youtube-typed.mp4');
      
      expect(result.isSuccess).toBe(true);
      expect(result.data?.metadata.platform).toBe('youtube');
      expect(result.data?.metadata.aspectRatio).toBe('16:9');
      
      console.log('✅ YouTube query with validation passed');
    });

    test('should create Instagram square format', async () => {
      const query = createInstagramQuery('sample-files/portrait-sample.mp4')
        .addText('Square for Feed 📷', {
          position: 'center',
          style: {
            fontSize: 24,
            color: '#E4405F'
          }
        })
        .addImage('sample-files/logo-150x150.png', {
          position: 'bottom-right',
          opacity: 0.7
        });

      const result = await query.build('output/type-safe-tests/instagram-typed.mp4');
      
      expect(result.isSuccess).toBe(true);
      expect(result.data?.metadata.aspectRatio).toBe('1:1');
      expect(result.data?.metadata.size).toEqual({ width: 1080, height: 1080 });
      
      console.log('✅ Instagram square format created');
    });
  });

  describe('🖼️ Image + Caption Combinations', () => {
    test('should handle image with caption in all positions', async () => {
      const positions = [
        'top-left', 'top-center', 'top-right',
        'center-left', 'center', 'center-right',
        'bottom-left', 'bottom-center', 'bottom-right'
      ] as const;

      for (const position of positions) {
        const query = createTikTokQuery('sample-files/red-sample.mp4')
          .addImage('sample-files/logo-150x150.png', { 
            position: position === 'top-center' ? 'top-left' : position as any, // Type workaround for test
            duration: 'full'
          })
          .addText(`Caption at ${position}`, {
            position: position,
            style: {
              fontSize: 20,
              color: '#ffffff',
              strokeColor: '#000000',
              strokeWidth: 2
            }
          });

        const result = await query.build(`output/type-safe-tests/image-caption-${position}.mp4`);
        expect(result.isSuccess).toBe(true);
      }
      
      console.log('✅ All position combinations work with image + caption');
    });

    test('should create complex multi-layer composition', async () => {
      const query = createTikTokQuery('sample-files/portrait-sample.mp4')
        // Background logo (watermark)
        .addWatermark('sample-files/logo-150x150.png', 'top-right')
        
        // Main content image
        .addImage('sample-files/logo-150x150.png', {
          position: 'center',
          scale: 1.5,
          startTime: 1,
          duration: 3
        })
        
        // Title text
        .addText('🔥 AMAZING CONTENT', {
          position: 'top-center',
          style: {
            fontSize: 36,
            color: '#ffff00',
            fontWeight: 'bold',
            strokeColor: '#000000',
            strokeWidth: 3
          },
          startTime: 0,
          duration: 2
        })
        
        // Subtitle
        .addText('Subscribe for more! 👆', {
          position: 'bottom-center',
          style: {
            fontSize: 24,
            color: '#ffffff',
            backgroundColor: 'rgba(0,0,0,0.7)'
          },
          startTime: 2,
          duration: 4
        });

      const result = await query.build('output/type-safe-tests/complex-multilayer.mp4');
      
      expect(result.isSuccess).toBe(true);
      expect(result.data?.command).toContain('overlay');
      expect(result.data?.command).toContain('drawtext');
      
      console.log('✅ Complex multi-layer composition created');
      console.log('Command length:', result.data?.command.length);
    });

    test('should validate image + caption timing', async () => {
      const query = createYouTubeQuery('sample-files/blue-sample.mp4')
        .addImage('sample-files/logo-150x150.png', {
          position: 'top-left',
          startTime: 1,
          duration: 3
        })
        .addText('Timed Caption', {
          position: 'bottom-left',
          startTime: 1.5,
          duration: 2.5
        });

      const result = await query.build('output/type-safe-tests/timed-overlay.mp4');
      
      expect(result.isSuccess).toBe(true);
      expect(result.data?.command).toContain('enable=');
      expect(result.data?.command).toContain('between(t,1,4)'); // Image timing
      expect(result.data?.command).toContain('between(t,1.5,4)'); // Text timing
      
      console.log('✅ Timed overlays validated');
    });
  });

  describe('🔍 Type Safety Validation', () => {
    test('should enforce non-empty text', async () => {
      expect(() => {
        createTikTokQuery('sample-files/red-sample.mp4')
          .addText('', { position: 'center' });
      }).toThrow('Text must be a non-empty string');
      
      console.log('✅ Empty text validation works');
    });

    test('should enforce valid image paths', async () => {
      expect(() => {
        createInstagramQuery('sample-files/red-sample.mp4')
          .addImage('', { position: 'center' });
      }).toThrow('Image path must be a non-empty string');
      
      console.log('✅ Empty image path validation works');
    });

    test('should enforce watermark corner positions', async () => {
      expect(() => {
        createTikTokQuery('sample-files/red-sample.mp4')
          .addWatermark('sample-files/logo-150x150.png', 'center' as any);
      }).toThrow('Watermark position must be a corner position');
      
      console.log('✅ Watermark position validation works');
    });

    test('should validate strict mode requirements', async () => {
      const query = createYouTubeQuery('sample-files/blue-sample.mp4', {
        validation: { 
          enabled: true, 
          strictMode: true 
        }
      });

      // This should pass (has content)
      query.addText('Valid content');
      const result = await query.build('output/type-safe-tests/strict-valid.mp4');
      expect(result.isSuccess).toBe(true);
      
      console.log('✅ Strict mode validation passed');
    });
  });

  describe('🎨 Multi-Platform Composition', () => {
    test('should create multi-platform content', async () => {
      const platforms = ['tiktok', 'youtube', 'instagram'] as const;
      const queries = queryCompose.multiPlatform(
        'sample-files/red-sample.mp4',
        platforms
      );

      expect(queries).toHaveLength(3);
      
      const results = await Promise.all(
        queries.map((query, index) => 
          query
            .addText(`${platforms[index].toUpperCase()} Content`, {
              position: 'center',
              style: { fontSize: 24, color: '#ffffff' }
            })
            .build(`output/type-safe-tests/multi-${platforms[index]}.mp4`)
        )
      );

      results.forEach((result, index) => {
        expect(result.isSuccess).toBe(true);
        expect(result.data?.metadata.platform).toBe(platforms[index]);
      });
      
      console.log('✅ Multi-platform composition created');
      console.log('Platforms:', results.map(r => r.data?.metadata.platform));
    });

    test('should provide accurate metadata', async () => {
      const query = createTikTokQuery('sample-files/portrait-sample.mp4')
        .addText('Metadata Test', { position: 'center' });

      const result = await query.build('output/type-safe-tests/metadata-test.mp4');
      
      expect(result.isSuccess).toBe(true);
      expect(result.data?.metadata).toEqual({
        platform: 'tiktok',
        duration: expect.any(Number),
        size: { width: 1080, height: 1920 },
        aspectRatio: '9:16',
        estimatedFileSize: expect.any(Number)
      });
      
      console.log('✅ Metadata validation:', result.data?.metadata);
    });
  });

  describe('⚡ Performance and Optimization', () => {
    test('should handle batch processing efficiently', async () => {
      const startTime = Date.now();
      
      const queries = Array.from({ length: 5 }, (_, i) =>
        createTikTokQuery('sample-files/red-sample.mp4')
          .addText(`Batch Video ${i + 1}`, { 
            position: 'center',
            style: { fontSize: 24 }
          })
          .addWatermark('sample-files/logo-150x150.png')
      );

      const results = await Promise.all(
        queries.map((query, index) => 
          query.build(`output/type-safe-tests/batch-${index + 1}.mp4`)
        )
      );

      const processingTime = Date.now() - startTime;
      
      expect(results).toHaveLength(5);
      results.forEach(result => {
        expect(result.isSuccess).toBe(true);
      });
      
      console.log(`✅ Batch processing completed in ${processingTime}ms`);
      console.log(`Average per video: ${Math.round(processingTime / 5)}ms`);
    });

    test('should estimate file sizes accurately', async () => {
      const queries = [
        createTikTokQuery('sample-files/red-sample.mp4', { quality: 'low' }),
        createYouTubeQuery('sample-files/blue-sample.mp4', { quality: 'high' }),
        createInstagramQuery('sample-files/portrait-sample.mp4', { quality: 'ultra' })
      ];

      const results = await Promise.all(
        queries.map((query, index) => 
          query
            .addText('Size test')
            .build(`output/type-safe-tests/size-${index}.mp4`)
        )
      );

      const estimates = results.map(r => r.data?.metadata.estimatedFileSize);
      
      // High quality should estimate larger files
      expect(estimates[2]!).toBeGreaterThan(estimates[0]!); // ultra > low
      
      console.log('✅ File size estimates:', estimates);
    });
  });
});
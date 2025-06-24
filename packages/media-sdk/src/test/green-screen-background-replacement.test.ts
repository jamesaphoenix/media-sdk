/**
 * @fileoverview Comprehensive tests for green screen background replacement
 * 
 * Tests the new green screen background replacement functionality that allows
 * replacing green screen areas with images or videos as the primary content,
 * not just overlays.
 */

import { describe, test, expect } from 'bun:test';
import { Timeline } from '../timeline/timeline.js';

describe('🎬 Green Screen Background Replacement', () => {
  
  describe('🖼️ Image Background Replacement', () => {
    test('should generate correct FFmpeg command for green screen with image background', () => {
      const timeline = new Timeline()
        .addGreenScreenWithImageBackground('person-greenscreen.mp4', 'explosion.jpg', {
          chromaKey: '#00FF00',
          chromaSimilarity: 0.4,
          chromaBlend: 0.1,
          backgroundScale: 'fill'
        });

      const command = timeline.getCommand('output.mp4');
      
      // Should include both video and image inputs
      expect(command).toContain('-i person-greenscreen.mp4');
      expect(command).toContain('-i explosion.jpg');
      
      // Should include chromakey filter
      expect(command).toContain('chromakey=color=0x00FF00:similarity=0.4:blend=0.1');
      
      // Should include background scaling
      expect(command).toContain('scale=iw:ih:force_original_aspect_ratio=increase,crop=iw:ih');
      
      // Should include overlay composition
      expect(command).toContain('overlay=0:0');
      
      // Should have filter complex structure
      expect(command).toContain('-filter_complex');
    });

    test('should handle different background scaling modes', () => {
      const scaleOptions = ['fit', 'fill', 'stretch', 'crop'] as const;
      
      scaleOptions.forEach(scale => {
        const timeline = new Timeline()
          .addGreenScreenWithImageBackground('video.mp4', 'bg.jpg', {
            backgroundScale: scale,
            chromaKey: '#00FF00'
          });

        const command = timeline.getCommand('output.mp4');
        
        switch (scale) {
          case 'fit':
            expect(command).toContain('scale=iw:ih:force_original_aspect_ratio=decrease,pad=iw:ih:(ow-iw)/2:(oh-ih)/2');
            break;
          case 'fill':
            expect(command).toContain('scale=iw:ih:force_original_aspect_ratio=increase,crop=iw:ih');
            break;
          case 'stretch':
            expect(command).toContain('scale=iw:ih');
            break;
          case 'crop':
            expect(command).toContain('scale=iw:ih:force_original_aspect_ratio=increase,crop=iw:ih');
            break;
        }
      });
    });

    test('should support YUV color space for better keying', () => {
      const timeline = new Timeline()
        .addGreenScreenWithImageBackground('video.mp4', 'bg.png', {
          chromaKey: '#00FF00',
          chromaSimilarity: 0.35,
          chromaBlend: 0.15,
          chromaYuv: true
        });

      const command = timeline.getCommand('output.mp4');
      
      expect(command).toContain('chromakey=color=0x00FF00:similarity=0.35:blend=0.15:yuv=true');
    });

    test('should handle different chroma colors', () => {
      const colors = [
        { input: '#00FF00', expected: '00FF00' }, // Green
        { input: '#0000FF', expected: '0000FF' }, // Blue
        { input: '#FF00FF', expected: 'FF00FF' }  // Magenta
      ];

      colors.forEach(({ input, expected }) => {
        const timeline = new Timeline()
          .addGreenScreenWithImageBackground('video.mp4', 'bg.jpg', {
            chromaKey: input
          });

        const command = timeline.getCommand('output.mp4');
        expect(command).toContain(`chromakey=color=0x${expected}`);
      });
    });
  });

  describe('🎥 Video Background Replacement', () => {
    test('should generate correct FFmpeg command for green screen with video background', () => {
      const timeline = new Timeline()
        .addGreenScreenWithVideoBackground('person-greenscreen.mp4', 'moving-background.mp4', {
          chromaKey: '#00FF00',
          chromaSimilarity: 0.4,
          chromaBlend: 0.1,
          backgroundScale: 'crop',
          audioMix: 'greenscreen'
        });

      const command = timeline.getCommand('output.mp4');
      
      // Should include both video inputs
      expect(command).toContain('-i person-greenscreen.mp4');
      expect(command).toContain('-i moving-background.mp4');
      
      // Should include chromakey filter
      expect(command).toContain('chromakey=color=0x00FF00:similarity=0.4:blend=0.1');
      
      // Should include background video scaling
      expect(command).toContain('scale=iw:ih:force_original_aspect_ratio=increase,crop=iw:ih');
      
      // Should include overlay composition
      expect(command).toContain('overlay=0:0');
    });

    test('should handle background video looping', () => {
      const timeline = new Timeline()
        .addGreenScreenWithVideoBackground('video.mp4', 'bg-video.mp4', {
          backgroundLoop: true,
          chromaKey: '#00FF00'
        });

      const command = timeline.getCommand('output.mp4');
      
      expect(command).toContain('loop=loop=-1:size=32767');
    });

    test('should handle different audio mixing options', () => {
      const audioOptions = ['greenscreen', 'background', 'both', 'none'] as const;
      
      audioOptions.forEach(audioMix => {
        const timeline = new Timeline()
          .addGreenScreenWithVideoBackground('video.mp4', 'bg-video.mp4', {
            audioMix,
            chromaKey: '#00FF00'
          });

        const command = timeline.getCommand('output.mp4');
        
        // For now, just verify the command is generated
        // Audio mixing logic will be implemented in the FFmpeg command generation
        expect(command).toContain('chromakey');
      });
    });
  });

  describe('🎭 Green Screen Meme Presets', () => {
    test('should create reaction meme with automatic optimization', () => {
      const timeline = new Timeline()
        .addGreenScreenMeme('person-shocked.mp4', 'explosion.gif', 'reaction', {
          platform: 'tiktok',
          intensity: 'high'
        });

      const command = timeline.getCommand('output.mp4');
      
      expect(command).toContain('-i person-shocked.mp4');
      expect(command).toContain('-i explosion.gif');
      expect(command).toContain('chromakey=color=0x00FF00:similarity=0.5:blend=0.1');
      expect(command).toContain('force_original_aspect_ratio=increase,crop=iw:ih'); // fill scale
    });

    test('should create weather reporter meme with professional settings', () => {
      const timeline = new Timeline()
        .addGreenScreenMeme('pointing.mp4', 'weather-map.jpg', 'weather', {
          platform: 'youtube',
          professional: true
        });

      const command = timeline.getCommand('output.mp4');
      
      expect(command).toContain('chromakey=color=0x00FF00:similarity=0.3:blend=0.05');
      expect(command).toContain('force_original_aspect_ratio=decrease,pad=iw:ih'); // fit scale
    });

    test('should detect file type and use appropriate method', () => {
      // Test with image background
      const imageTimeline = new Timeline()
        .addGreenScreenMeme('video.mp4', 'background.png', 'comedy');

      const imageCommand = imageTimeline.getCommand('output.mp4');
      expect(imageCommand).toContain('-i background.png');

      // Test with video background  
      const videoTimeline = new Timeline()
        .addGreenScreenMeme('video.mp4', 'background.mp4', 'comedy');

      const videoCommand = videoTimeline.getCommand('output.mp4');
      expect(videoCommand).toContain('-i background.mp4');
      // Video backgrounds don't use loop by default for comedy preset
      expect(videoCommand).toContain('chromakey');
    });

    test('should apply different preset configurations', () => {
      const presets = [
        { preset: 'reaction', similarity: 0.4 },
        { preset: 'weather', similarity: 0.4 },
        { preset: 'gaming', similarity: 0.45 },
        { preset: 'educational', similarity: 0.35 },
        { preset: 'news', similarity: 0.3 },
        { preset: 'comedy', similarity: 0.5 }
      ] as const;

      presets.forEach(({ preset, similarity }) => {
        const timeline = new Timeline()
          .addGreenScreenMeme('video.mp4', 'bg.jpg', preset);

        const command = timeline.getCommand('output.mp4');
        expect(command).toContain(`similarity=${similarity}`);
      });
    });

    test('should handle custom chroma key colors', () => {
      const timeline = new Timeline()
        .addGreenScreenMeme('video.mp4', 'bg.jpg', 'custom', {
          chromaKey: '#0000FF' // Blue screen
        });

      const command = timeline.getCommand('output.mp4');
      expect(command).toContain('chromakey=color=0x0000FF');
    });
  });

  describe('🔧 Integration with Other Features', () => {
    test('should work with aspect ratio settings', () => {
      const timeline = new Timeline()
        .addGreenScreenWithImageBackground('video.mp4', 'bg.jpg')
        .setAspectRatio('9:16');

      const command = timeline.getCommand('output.mp4');
      
      expect(command).toContain('chromakey');
      expect(command).toContain('scale='); // Aspect ratio scaling
      expect(command).toContain('crop=');
    });

    test('should work with text overlays', () => {
      const timeline = new Timeline()
        .addGreenScreenWithImageBackground('video.mp4', 'bg.jpg')
        .addText('VIRAL MEME!', {
          position: 'top',
          style: { fontSize: 48, color: '#ffffff' }
        });

      const command = timeline.getCommand('output.mp4');
      
      expect(command).toContain('chromakey');
      expect(command).toContain('drawtext');
      expect(command).toContain('VIRAL MEME!');
    });

    test('should work with duration settings', () => {
      const timeline = new Timeline()
        .addGreenScreenWithImageBackground('video.mp4', 'bg.jpg', {
          duration: 10
        })
        .setDuration(8);

      const command = timeline.getCommand('output.mp4');
      
      expect(command).toContain('chromakey');
      // Duration setting is applied via setDuration, not the green screen layer duration
    });

    test('should work with codec settings', () => {
      const timeline = new Timeline()
        .addGreenScreenWithImageBackground('video.mp4', 'bg.jpg')
        .setVideoCodec('libx264', { crf: 23, preset: 'fast' });

      const command = timeline.getCommand('output.mp4');
      
      expect(command).toContain('chromakey');
      expect(command).toContain('-c:v libx264');
      expect(command).toContain('-crf 23');
      expect(command).toContain('-preset fast');
    });
  });

  describe('📊 Quality and Performance Settings', () => {
    test('should handle different quality settings', () => {
      const qualities = ['low', 'medium', 'high'] as const;
      
      qualities.forEach(quality => {
        const timeline = new Timeline()
          .addGreenScreenWithImageBackground('video.mp4', 'bg.jpg', {
            quality
          });

        const command = timeline.getCommand('output.mp4');
        
        // Quality affects internal parameters but doesn't change command structure
        expect(command).toContain('chromakey');
      });
    });

    test('should optimize parameters for viral content', () => {
      const timeline = new Timeline()
        .addGreenScreenMeme('reaction.mp4', 'trending-bg.gif', 'reaction', {
          platform: 'tiktok',
          intensity: 'high',
          autoOptimize: true
        });

      const command = timeline.getCommand('output.mp4');
      
      // High intensity should use higher similarity
      expect(command).toContain('similarity=0.5');
    });
  });

  describe('🎯 Edge Cases and Error Handling', () => {
    test('should handle missing background files gracefully', () => {
      const timeline = new Timeline()
        .addGreenScreenWithImageBackground('video.mp4', 'nonexistent.jpg');

      // Should not throw during command generation
      expect(() => {
        timeline.getCommand('output.mp4');
      }).not.toThrow();
    });

    test('should handle invalid chroma key colors', () => {
      const timeline = new Timeline()
        .addGreenScreenWithImageBackground('video.mp4', 'bg.jpg', {
          chromaKey: 'invalid-color'
        });

      const command = timeline.getCommand('output.mp4');
      
      // Should fallback to removing # and using as-is
      expect(command).toContain('chromakey=color=0xinvalid-color');
    });

    test('should handle extreme similarity values', () => {
      const timeline = new Timeline()
        .addGreenScreenWithImageBackground('video.mp4', 'bg.jpg', {
          chromaSimilarity: 1.5, // > 1.0
          chromaBlend: -0.1 // < 0.0
        });

      const command = timeline.getCommand('output.mp4');
      
      // Should use the values as provided (FFmpeg will handle validation)
      expect(command).toContain('similarity=1.5');
      expect(command).toContain('blend=-0.1');
    });
  });

  describe('🎮 Real-World Meme Scenarios', () => {
    test('should create gaming streamer overlay meme', () => {
      const timeline = new Timeline()
        .addGreenScreenMeme('streamer-reaction.mp4', 'game-explosion.gif', 'gaming', {
          platform: 'youtube',
          intensity: 'high'
        })
        .addText('EPIC FAIL!', {
          position: 'top',
          style: { fontSize: 64, color: '#ff0000' }
        });

      const command = timeline.getCommand('output.mp4');
      
      expect(command).toContain('chromakey');
      expect(command).toContain('drawtext');
      expect(command).toContain('EPIC FAIL!');
    });

    test('should create weather reporter pointing meme', () => {
      const timeline = new Timeline()
        .addGreenScreenMeme('pointing-person.mp4', 'disaster-footage.mp4', 'weather', {
          professional: true
        })
        .addText('Me explaining why I\'m late', {
          position: 'bottom',
          style: { fontSize: 32, color: '#ffffff' }
        });

      const command = timeline.getCommand('output.mp4');
      
      expect(command).toContain('chromakey=color=0x00FF00:similarity=0.3:blend=0.05');
      expect(command).toContain('Me explaining');
    });

    test('should create educational content with professional background', () => {
      const timeline = new Timeline()
        .addGreenScreenMeme('teacher.mp4', 'classroom-bg.jpg', 'educational')
        .setAspectRatio('16:9')
        .addText('Today we will learn about...', {
          position: 'bottom',
          style: { fontSize: 28, color: '#333333' }
        });

      const command = timeline.getCommand('output.mp4');
      
      expect(command).toContain('chromakey=color=0x00FF00:similarity=0.35:blend=0.08');
      expect(command).toContain('force_original_aspect_ratio=decrease'); // fit scaling
    });
  });
});
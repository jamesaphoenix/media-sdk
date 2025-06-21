/**
 * Tests for image generation with captions
 * 
 * Verifies that we can use images as base layers and generate
 * static images with text overlays
 */

import { test, expect, describe } from 'bun:test';
import { 
  Timeline,
  generateImageWithCaption,
  generateImageBatch,
  createSlideshow,
  createInstagramPost,
  createTikTokThumbnail,
  createMeme,
  createQuoteCard
} from '@jamesaphoenix/media-sdk';

describe('🖼️ IMAGE GENERATION WITH CAPTIONS', () => {
  describe('📸 Basic Image + Caption Generation', () => {
    test('should generate single image with caption', () => {
      const command = generateImageWithCaption(
        'background.jpg',
        'Hello World!',
        'output.jpg',
        {
          position: { x: '50%', y: '90%', anchor: 'bottom-center' },
          style: {
            fontSize: 48,
            color: '#ffffff',
            strokeColor: '#000000',
            strokeWidth: 3
          }
        }
      );

      expect(command).toContain('-i background.jpg');
      expect(command).toContain('drawtext');
      expect(command).toContain('Hello World!');
      expect(command).toContain('-frames:v 1');
      expect(command).toContain('-c:v mjpeg');
    });

    test('should generate PNG with transparent text background', () => {
      const command = generateImageWithCaption(
        'photo.jpg',
        'Transparent Background',
        'output.png',
        {
          style: {
            fontSize: 36,
            color: '#ffffff',
            background: { 
              color: 'rgba(0,0,0,0.5)', 
              padding: 20 
            }
          }
        }
      );

      expect(command).toContain('-c:v png');
      expect(command).toContain('rgba(0,0,0,0.5)');
    });

    test('should generate WebP with quality settings', () => {
      const command = generateImageWithCaption(
        'input.jpg',
        'WebP Format',
        'output.webp',
        {
          format: { quality: 85 }
        }
      );

      expect(command).toContain('-c:v libwebp');
      expect(command).toContain('-quality 85');
    });
  });

  describe('📚 Batch Image Generation', () => {
    test('should generate multiple images with different captions', () => {
      const images = [
        { imagePath: 'bg1.jpg', caption: 'First Image' },
        { imagePath: 'bg2.jpg', caption: 'Second Image' },
        { imagePath: 'bg3.jpg', caption: 'Third Image' }
      ];

      const results = generateImageBatch(images, 'output', {
        format: 'jpg',
        quality: 90
      });

      expect(results).toHaveLength(3);
      expect(results[0].outputPath).toBe('output/image-1.jpg');
      expect(results[1].outputPath).toBe('output/image-2.jpg');
      expect(results[2].outputPath).toBe('output/image-3.jpg');
      
      results.forEach((result, index) => {
        expect(result.command).toContain(images[index].imagePath);
        expect(result.command).toContain(images[index].caption);
      });
    });

    test('should use custom output names for batch', () => {
      const images = [
        { imagePath: 'bg1.jpg', caption: 'Sunrise', outputName: 'sunrise-photo' },
        { imagePath: 'bg2.jpg', caption: 'Sunset', outputName: 'sunset-photo' }
      ];

      const results = generateImageBatch(images, 'gallery');

      expect(results[0].outputPath).toBe('gallery/sunrise-photo.jpg');
      expect(results[1].outputPath).toBe('gallery/sunset-photo.jpg');
    });

    test('should apply consistent styling across batch', () => {
      const style = {
        fontSize: 64,
        color: '#ff0000',
        strokeColor: '#ffffff',
        strokeWidth: 4
      };

      const images = [
        { imagePath: 'img1.jpg', caption: 'One', style },
        { imagePath: 'img2.jpg', caption: 'Two', style },
        { imagePath: 'img3.jpg', caption: 'Three', style }
      ];

      const results = generateImageBatch(images, 'output');

      results.forEach(result => {
        expect(result.command).toContain('fontsize=64');
        expect(result.command).toContain('fontcolor=#ff0000');
      });
    });
  });

  describe('🎬 Slideshow Creation', () => {
    test('should create slideshow from multiple images', () => {
      const images = [
        { imagePath: 'slide1.jpg', caption: 'Welcome' },
        { imagePath: 'slide2.jpg', caption: 'Our Story' },
        { imagePath: 'slide3.jpg', caption: 'Thank You' }
      ];

      const command = createSlideshow(images, 'slideshow.mp4', {
        slideDuration: 3,
        transition: 'fade',
        transitionDuration: 0.5
      });

      expect(command).toContain('slide1.jpg');
      expect(command).toContain('slide2.jpg');
      expect(command).toContain('slide3.jpg');
      expect(command).toContain('Welcome');
      expect(command).toContain('Our Story');
      expect(command).toContain('Thank You');
    });

    test('should position captions correctly in slideshow', () => {
      const images = [
        { 
          imagePath: 'img1.jpg', 
          caption: 'Top Caption',
          position: { x: '50%', y: '10%', anchor: 'top-center' }
        },
        { 
          imagePath: 'img2.jpg', 
          caption: 'Bottom Caption',
          position: { x: '50%', y: '90%', anchor: 'bottom-center' }
        }
      ];

      const command = createSlideshow(images, 'slideshow.mp4');

      expect(command).toContain('(w*0.5)-(text_w/2)');
      expect(command).toContain('(h*0.1)');
      expect(command).toContain('(h*0.9)-text_h');
    });

    test('should handle slideshow timing correctly', () => {
      const images = Array(5).fill(null).map((_, i) => ({
        imagePath: `img${i}.jpg`,
        caption: `Slide ${i + 1}`
      }));

      const command = createSlideshow(images, 'slideshow.mp4', {
        slideDuration: 4
      });

      // Check timing for slides (first slide doesn't have enable, subsequent ones do)
      expect(command).toContain("Slide 1");
      expect(command).toContain("enable='between(t,4,8)'");
      expect(command).toContain("enable='between(t,8,12)'");
    });
  });

  describe('📱 Social Media Format Tests', () => {
    test('should create Instagram post with 1:1 aspect ratio', () => {
      const command = createInstagramPost(
        'photo.jpg',
        'Check out my new post! 🔥',
        'instagram-post.jpg'
      );

      // Instagram should have square crop
      expect(command).toContain("crop='min(iw,ih)':'min(iw,ih)'");
      expect(command).toContain('Check out my new post! 🔥');
      expect(command).toContain('fontsize=64');
    });

    test('should create TikTok thumbnail with 9:16 ratio', () => {
      const command = createTikTokThumbnail(
        'video-frame.jpg',
        'VIRAL CONTENT!',
        'tiktok-thumb.jpg'
      );

      // TikTok should have vertical aspect ratio scaling
      expect(command).toContain("scale='if(gt(a,9/16)");
      expect(command).toContain('VIRAL CONTENT!');
      expect(command).toContain('#ff0050'); // TikTok red
      expect(command).toContain('fontsize=72');
    });

    test('should create meme with top and bottom text', () => {
      const command = createMeme(
        'drake.jpg',
        'When you write tests',
        'When tests pass',
        'meme.jpg'
      );

      expect(command).toContain('WHEN YOU WRITE TESTS');
      expect(command).toContain('WHEN TESTS PASS');
      expect(command).toContain('Impact'); // Classic meme font
      expect(command).toContain('(h*0.1)'); // Top text
      expect(command).toContain('(h*0.9)-text_h'); // Bottom text
    });

    test('should create quote card with author', () => {
      const command = createQuoteCard(
        'nature.jpg',
        'The only way to do great work is to love what you do',
        'Steve Jobs',
        'quote.jpg'
      );

      expect(command).toContain('"The only way to do great work is to love what you do"');
      expect(command).toContain('— Steve Jobs');
      expect(command).toContain('Georgia'); // Quote font
      expect(command).toContain('italic');
    });
  });

  describe('🎨 Advanced Styling Tests', () => {
    test('should handle complex text styling', () => {
      const command = generateImageWithCaption(
        'bg.jpg',
        'Styled Text',
        'output.jpg',
        {
          style: {
            fontSize: 72,
            color: '#ff6600',
            strokeColor: '#000000',
            strokeWidth: 5,
            background: {
              color: 'rgba(255,255,255,0.9)',
              padding: 30,
              borderRadius: 20
            },
            shadowColor: '#333333',
            shadowBlur: 10,
            shadowOffsetX: 5,
            shadowOffsetY: 5
          }
        }
      );

      expect(command).toContain('fontsize=72');
      expect(command).toContain('fontcolor=#ff6600');
      expect(command).toContain('bordercolor=#000000');
      expect(command).toContain('borderw=5');
      expect(command).toContain('shadowcolor=#333333');
      expect(command).toContain('shadowx=5');
      expect(command).toContain('shadowy=5');
    });

    test('should handle multi-line text with proper spacing', () => {
      const longText = 'This is a very long caption that should wrap to multiple lines';
      const command = generateImageWithCaption(
        'bg.jpg',
        longText,
        'output.jpg',
        {
          style: {
            fontSize: 36,
            lineHeight: 1.5,
            textAlign: 'center'
          }
        }
      );

      expect(command).toContain(longText);
      expect(command).toContain('fontsize=36');
    });

    test('should support different anchor points', () => {
      const anchors = [
        'top-left', 'top-center', 'top-right',
        'center-left', 'center', 'center-right',
        'bottom-left', 'bottom-center', 'bottom-right'
      ];

      anchors.forEach(anchor => {
        const command = generateImageWithCaption(
          'bg.jpg',
          `${anchor} text`,
          `output-${anchor}.jpg`,
          {
            position: { x: '50%', y: '50%', anchor: anchor as any }
          }
        );

        expect(command).toContain('drawtext');
        
        // Verify anchor calculations are applied
        if (anchor.includes('center')) {
          expect(command).toMatch(/text_[wh]\/2/);
        }
        if (anchor.includes('right')) {
          expect(command).toContain('-text_w');
        }
        if (anchor.includes('bottom')) {
          expect(command).toContain('-text_h');
        }
      });
    });
  });

  describe('🌈 Edge Cases and Error Handling', () => {
    test('should handle empty caption gracefully', () => {
      const command = generateImageWithCaption(
        'bg.jpg',
        '',
        'output.jpg'
      );

      expect(command).toContain("text=''");
      expect(command).toContain('-frames:v 1');
    });

    test('should handle special characters in caption', () => {
      const specialText = "It's a \"special\" day! $100 & more";
      const command = generateImageWithCaption(
        'bg.jpg',
        specialText,
        'output.jpg'
      );

      expect(command).toContain("It'\\''s a");
      expect(command).toContain('special');
    });

    test('should handle very long file paths', () => {
      const longPath = '/very/long/path/to/images/directory/with/many/subdirectories/image.jpg';
      const command = generateImageWithCaption(
        longPath,
        'Caption',
        '/output/dir/result.jpg'
      );

      expect(command).toContain(longPath);
      expect(command).toContain('/output/dir/result.jpg');
    });

    test('should generate video frame when specified', () => {
      const command = generateImageWithCaption(
        'bg.jpg',
        'Video Frame',
        'output.mp4',
        {
          format: { asVideoFrame: true, frameDuration: 1 }
        }
      );

      // Should NOT have single frame extraction
      expect(command).not.toContain('-frames:v 1');
      // Should have video codec
      expect(command).toContain('-c:v h264');
    });
  });
});
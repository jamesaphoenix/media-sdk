/**
 * @fileoverview Image Caption System Example Tests
 * 
 * Demonstrates real-world usage of the image + caption system
 */

import { test, expect, describe, beforeAll, afterAll } from 'bun:test';
import { ImageCaptionSystem } from '../../../packages/media-sdk/src/effects/image-caption-system.js';
import { ImageSourceHandler } from '../../../packages/media-sdk/src/utils/image-source-handler.js';
import { promises as fs } from 'fs';
import { join } from 'path';
import { tmpdir } from 'os';

describe('📸 IMAGE CAPTION EXAMPLES', () => {
  let exampleDir: string;
  let system: ImageCaptionSystem;
  let imageHandler: ImageSourceHandler;
  
  beforeAll(async () => {
    exampleDir = join(tmpdir(), 'image-caption-examples-' + Date.now());
    await fs.mkdir(exampleDir, { recursive: true });
    
    imageHandler = new ImageSourceHandler({
      downloadDir: join(exampleDir, 'downloads'),
      enableCache: true
    });
    
    system = new ImageCaptionSystem(imageHandler);
    
    console.log('Example test directory:', exampleDir);
    
    // Create example images
    await createExampleImages();
  });
  
  afterAll(async () => {
    try {
      await system.cleanup();
      await cleanupDirectory(exampleDir);
    } catch (e) {
      console.error('Cleanup error:', e);
    }
  });

  async function createExampleImages() {
    const images = [
      'vacation-photo.jpg',
      'product-shot.jpg',
      'quote-background.jpg',
      'before-renovation.jpg',
      'after-renovation.jpg',
      'slide1.jpg',
      'slide2.jpg',
      'slide3.jpg'
    ];
    
    for (const filename of images) {
      const buffer = Buffer.from([
        0xFF, 0xD8, 0xFF, 0xE0, 0x00, 0x10, 0x4A, 0x46,
        0x49, 0x46, 0x00, 0x01, 0x01, 0x00, 0x00, 0x01
      ]);
      await fs.writeFile(join(exampleDir, filename), buffer);
    }
  }

  async function cleanupDirectory(dir: string) {
    const entries = await fs.readdir(dir, { withFileTypes: true });
    for (const entry of entries) {
      const fullPath = join(dir, entry.name);
      if (entry.isDirectory()) {
        await cleanupDirectory(fullPath);
        await fs.rmdir(fullPath);
      } else {
        await fs.unlink(fullPath);
      }
    }
    await fs.rmdir(dir);
  }

  describe('🌟 REAL-WORLD EXAMPLES', () => {
    test('Example 1: Instagram Post with Caption', async () => {
      console.log('\n📱 Creating Instagram Post...');
      
      const timeline = await system.createImageWithCaption({
        image: join(exampleDir, 'vacation-photo.jpg'),
        caption: 'Living my best life! 🌴☀️ #VacationMode',
        template: 'instagram-post'
      });

      const command = timeline.getCommand('instagram-post.mp4');
      console.log('Instagram post created!');
      console.log('Command preview:', command.substring(0, 100) + '...');
      
      expect(command).toContain('ffmpeg');
      expect(command).toContain('drawtext');
    });

    test('Example 2: TikTok Video with Viral Caption', async () => {
      console.log('\n🎬 Creating TikTok Video...');
      
      const timeline = await system.createImageWithCaption({
        image: join(exampleDir, 'product-shot.jpg'),
        caption: 'Wait for it... 😱🔥 #Viral #MindBlown',
        template: 'tiktok-video',
        duration: 10
      });

      const command = timeline.getCommand('tiktok-video.mp4');
      console.log('TikTok video created!');
      console.log('Features: 9:16 aspect ratio, centered text, bold styling');
      
      expect(command).toBeTruthy();
    });

    test('Example 3: YouTube Thumbnail', async () => {
      console.log('\n🎥 Creating YouTube Thumbnail...');
      
      const timeline = await system.createImageWithCaption({
        image: join(exampleDir, 'slide1.jpg'),
        caption: '10 AMAZING TIPS YOU NEED TO KNOW!',
        template: 'youtube-thumbnail'
      });

      const command = timeline.getCommand('youtube-thumbnail.mp4');
      console.log('YouTube thumbnail created!');
      console.log('Features: Large text, red background, high visibility');
      
      expect(command).toBeTruthy();
    });

    test('Example 4: Product Showcase', async () => {
      console.log('\n🛍️ Creating Product Showcase...');
      
      const timeline = await system.createImageWithCaption({
        image: join(exampleDir, 'product-shot.jpg'),
        caption: 'LIMITED TIME OFFER - 50% OFF!',
        template: 'product-showcase',
        style: {
          animation: 'bounce'
        }
      });

      const command = timeline.getCommand('product-showcase.mp4');
      console.log('Product showcase created!');
      console.log('Features: Call-to-action styling, bounce animation');
      
      expect(command).toBeTruthy();
    });

    test('Example 5: Photo Slideshow with Music', async () => {
      console.log('\n🎵 Creating Photo Slideshow...');
      
      // Create a dummy audio file
      const musicFile = join(exampleDir, 'background-music.mp3');
      await fs.writeFile(musicFile, Buffer.from([0xFF, 0xFB]));
      
      const timeline = await system.createKenBurnsSlideshow({
        images: [
          { 
            image: join(exampleDir, 'slide1.jpg'), 
            caption: 'Our Amazing Journey',
            duration: 5
          },
          { 
            image: join(exampleDir, 'slide2.jpg'), 
            caption: 'Beautiful Memories',
            duration: 5
          },
          { 
            image: join(exampleDir, 'slide3.jpg'), 
            caption: 'Thank You For Watching',
            duration: 5
          }
        ],
        transition: 'fade',
        transitionDuration: 1,
        music: {
          file: musicFile,
          fadeIn: 2,
          fadeOut: 2
        }
      });

      const command = timeline.getCommand('slideshow.mp4');
      console.log('Photo slideshow created!');
      console.log('Features: Ken Burns effect, fade transitions, background music');
      console.log('Total duration: 15 seconds');
      
      expect(command).toContain(musicFile);
    });

    test('Example 6: Before/After Comparison', async () => {
      console.log('\n🔄 Creating Before/After Comparison...');
      
      const timeline = await system.createBeforeAfter(
        join(exampleDir, 'before-renovation.jpg'),
        join(exampleDir, 'after-renovation.jpg'),
        {
          caption: {
            before: 'BEFORE',
            after: 'AFTER'
          },
          transition: 'wipe',
          duration: 3
        }
      );

      const command = timeline.getCommand('before-after.mp4');
      console.log('Before/After comparison created!');
      console.log('Features: Side-by-side view, wipe transition, labeled images');
      
      expect(command).toContain('before-renovation.jpg');
      expect(command).toContain('after-renovation.jpg');
    });

    test('Example 7: 2x2 Photo Grid', async () => {
      console.log('\n📐 Creating Photo Grid...');
      
      const images = [
        join(exampleDir, 'vacation-photo.jpg'),
        join(exampleDir, 'product-shot.jpg'),
        join(exampleDir, 'quote-background.jpg'),
        join(exampleDir, 'slide1.jpg')
      ];

      const timeline = await system.createPhotoGrid(images, {
        layout: '2x2',
        captions: [
          'Summer 2024',
          'New Product',
          'Daily Quote',
          'Adventure'
        ],
        spacing: 10,
        duration: 10
      });

      const command = timeline.getCommand('photo-grid.mp4');
      console.log('Photo grid created!');
      console.log('Features: 2x2 layout, individual captions, spacing');
      
      expect(command).toBeTruthy();
      expect(command).toContain('vacation-photo.jpg');
    });

    test('Example 8: Quote Card', async () => {
      console.log('\n💭 Creating Quote Card...');
      
      const timeline = await system.createImageWithCaption({
        image: join(exampleDir, 'quote-background.jpg'),
        caption: '"The only way to do great work is to love what you do."\n- Steve Jobs',
        template: 'quote-card',
        duration: 8
      });

      const command = timeline.getCommand('quote-card.mp4');
      console.log('Quote card created!');
      console.log('Features: Vintage filter, centered text, elegant styling');
      
      expect(command).toBeTruthy();
    });

    test('Example 9: News Lower Third', async () => {
      console.log('\n📰 Creating News Lower Third...');
      
      const timeline = await system.createImageWithCaption({
        image: join(exampleDir, 'slide1.jpg'),
        caption: 'BREAKING: Major Announcement Coming Soon',
        template: 'news-lower-third',
        duration: 10
      });

      const command = timeline.getCommand('news-lower-third.mp4');
      console.log('News lower third created!');
      console.log('Features: Professional news styling, positioned at bottom');
      
      expect(command).toBeTruthy();
    });

    test('Example 10: Social Media Story', async () => {
      console.log('\n📱 Creating Multi-Page Story...');
      
      const timeline = await system.createStory([
        {
          image: join(exampleDir, 'slide1.jpg'),
          caption: 'Swipe to see more →',
          template: 'instagram-story'
        },
        {
          image: join(exampleDir, 'slide2.jpg'),
          caption: 'Amazing features inside!',
          template: 'instagram-story'
        },
        {
          image: join(exampleDir, 'slide3.jpg'),
          caption: 'Link in bio! 🔗',
          template: 'instagram-story'
        }
      ]);

      const command = timeline.getCommand('story.mp4');
      console.log('Social media story created!');
      console.log('Features: 9:16 format, 3 pages, 5 seconds each');
      
      expect(command).toBeTruthy();
      expect(command).toContain('1080');
      expect(command).toContain('1920');
    });
  });

  describe('🎨 CUSTOM STYLING EXAMPLES', () => {
    test('Custom Style: Neon Glow Effect', async () => {
      console.log('\n✨ Creating Neon Glow Effect...');
      
      const timeline = await system.createImageWithCaption({
        image: join(exampleDir, 'quote-background.jpg'),
        caption: 'NEON VIBES',
        style: {
          fontSize: 72,
          color: '#00FFFF',
          backgroundColor: 'rgba(0,0,0,0)',
          shadow: true,
          animation: 'glow'
        },
        position: {
          vertical: 'center',
          horizontal: 'center'
        }
      });

      const command = timeline.getCommand('neon-glow.mp4');
      console.log('Neon glow effect created!');
      
      expect(command).toBeTruthy();
    });

    test('Custom Style: Minimal Design', async () => {
      console.log('\n🎯 Creating Minimal Design...');
      
      const timeline = await system.createImageWithCaption({
        image: join(exampleDir, 'vacation-photo.jpg'),
        caption: 'less is more',
        style: {
          fontSize: 24,
          fontFamily: 'Arial, sans-serif',
          color: '#333333',
          backgroundColor: 'transparent',
          padding: '0',
          animation: 'fade',
          animationDuration: 2
        },
        position: {
          vertical: 'bottom',
          horizontal: 'right',
          offset: { x: -50, y: -50 }
        }
      });

      const command = timeline.getCommand('minimal-design.mp4');
      console.log('Minimal design created!');
      
      expect(command).toBeTruthy();
    });
  });

  describe('📊 BATCH PROCESSING EXAMPLES', () => {
    test('Batch: Create Multiple Social Media Formats', async () => {
      console.log('\n🔄 Creating Multiple Formats...');
      
      const formats = [
        { template: 'instagram-post', name: 'Instagram' },
        { template: 'facebook-post', name: 'Facebook' },
        { template: 'twitter-post', name: 'Twitter' }
      ];
      
      const results = [];
      
      for (const format of formats) {
        const timeline = await system.createImageWithCaption({
          image: join(exampleDir, 'product-shot.jpg'),
          caption: 'Check out our new product!',
          template: format.template as any
        });
        
        const command = timeline.getCommand(`${format.name.toLowerCase()}.mp4`);
        results.push({ format: format.name, success: !!command });
      }
      
      console.log('Batch processing results:');
      results.forEach(r => console.log(`- ${r.format}: ${r.success ? '✅' : '❌'}`));
      
      expect(results.every(r => r.success)).toBe(true);
    });
  });

  describe('💡 TIPS AND BEST PRACTICES', () => {
    test('Tip: Optimal Text Readability', async () => {
      console.log('\n📖 Best Practices for Text Readability:');
      console.log('1. Use contrasting colors (white on dark, black on light)');
      console.log('2. Add background to text for better visibility');
      console.log('3. Minimum font size: 24px for mobile, 32px for desktop');
      console.log('4. Use text shadows for light text on light backgrounds');
      console.log('5. Keep captions short and impactful');
      
      expect(true).toBe(true);
    });

    test('Tip: Platform-Specific Recommendations', async () => {
      console.log('\n📱 Platform Recommendations:');
      console.log('Instagram: 1:1 or 4:5 for posts, 9:16 for stories/reels');
      console.log('TikTok: 9:16 vertical, bold text, center positioning');
      console.log('YouTube: 16:9 thumbnails, large readable text');
      console.log('Facebook: 1.91:1 for feed, square for ads');
      console.log('Twitter: 16:9 or 1:1, concise captions');
      
      expect(true).toBe(true);
    });
  });
});
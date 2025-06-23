/**
 * @fileoverview REAL-WORLD SCENARIO TESTS
 * 
 * Tests that simulate actual production use cases and workflows
 * that users would encounter when using the Media SDK.
 */

import { test, expect, describe, beforeAll, afterAll } from 'bun:test';
import { Timeline } from '@jamesaphoenix/media-sdk';
import { SRTHandler, SRTEntry } from '../../../packages/media-sdk/src/captions/srt-handler.js';
import { ImageSourceHandler } from '../../../packages/media-sdk/src/utils/image-source-handler.js';
import { promises as fs } from 'fs';
import { join } from 'path';
import { tmpdir } from 'os';

describe('🌍 REAL-WORLD SCENARIO TESTS', () => {
  let scenarioDir: string;
  let srtHandler: SRTHandler;
  let imageHandler: ImageSourceHandler;
  
  beforeAll(async () => {
    scenarioDir = join(tmpdir(), 'real-world-scenarios-' + Date.now());
    await fs.mkdir(scenarioDir, { recursive: true });
    
    srtHandler = new SRTHandler();
    imageHandler = new ImageSourceHandler({
      downloadDir: join(scenarioDir, 'images'),
      enableCache: true
    });
    
    console.log('Scenario test directory:', scenarioDir);
  });
  
  afterAll(async () => {
    try {
      await cleanupDirectory(scenarioDir);
    } catch (e) {
      console.error('Cleanup error:', e);
    }
  });

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

  describe('📱 SOCIAL MEDIA CONTENT CREATION', () => {
    test('should create TikTok-style video with captions', async () => {
      console.log('Creating TikTok-style video...');
      
      // Download background and overlay images
      const assets = await imageHandler.processBatch([
        'https://via.placeholder.com/1080x1920/FF0066/FFFFFF?text=TikTok+BG',
        'https://via.placeholder.com/100x100/FFFFFF/FF0066?text=❤️',
        'https://via.placeholder.com/100x100/FFFFFF/FF0066?text=👍',
        'https://via.placeholder.com/100x100/FFFFFF/FF0066?text=💬'
      ]);
      
      // Create viral captions
      const captions: SRTEntry[] = [
        {
          index: 1,
          startTime: 0,
          endTime: 2,
          text: 'POV: You discovered',
          style: { bold: true, fontSize: 48 }
        },
        {
          index: 2,
          startTime: 2,
          endTime: 4,
          text: 'the ULTIMATE hack! 🔥',
          style: { bold: true, fontSize: 48, color: '#FF0066' }
        },
        {
          index: 3,
          startTime: 4,
          endTime: 6,
          text: 'Wait for it...',
          style: { italic: true, fontSize: 36 }
        },
        {
          index: 4,
          startTime: 6,
          endTime: 8,
          text: 'MIND = BLOWN 🤯',
          style: { bold: true, fontSize: 56, color: '#00FF00' }
        },
        {
          index: 5,
          startTime: 8,
          endTime: 10,
          text: 'Follow for more!',
          style: { fontSize: 42 }
        }
      ];
      
      // Save captions
      const captionFile = join(scenarioDir, 'tiktok-captions.srt');
      await srtHandler.writeSRTFile(captionFile, captions);
      
      // Create timeline
      let timeline = new Timeline()
        .setResolution(1080, 1920) // Vertical
        .setFrameRate(30)
        .setAspectRatio('9:16');
      
      // Add background
      if (assets[0] && !assets[0].error) {
        timeline = timeline.addImage(assets[0].localPath, {
          duration: 10,
          position: { x: '50%', y: '50%' }
        });
      }
      
      // Add engagement icons
      const icons = assets.slice(1);
      icons.forEach((icon, index) => {
        if (!icon.error) {
          timeline = timeline.addImage(icon.localPath, {
            startTime: 0,
            duration: 10,
            position: { 
              x: '90%', 
              y: `${50 + index * 15}%` 
            },
            transform: { scale: 0.5 },
            animation: {
              type: 'pulse',
              scale: 1.2,
              duration: 1
            }
          });
        }
      });
      
      // Add captions with TikTok styling
      captions.forEach(caption => {
        timeline = timeline.addText(caption.text, {
          startTime: caption.startTime,
          duration: caption.endTime - caption.startTime,
          position: { x: '50%', y: '50%' },
          style: {
            ...caption.style,
            textShadow: '3px 3px 6px rgba(0,0,0,0.9)',
            textAlign: 'center'
          },
          animation: {
            type: 'bounce',
            duration: 0.3
          }
        });
      });
      
      const command = timeline.getCommand('tiktok-viral.mp4');
      expect(command).toContain('9:16'); // Verify aspect ratio
      expect(command).toContain('1080x1920'); // Verify resolution
      
      console.log('TikTok video ready for viral success! 🚀');
    });

    test('should create Instagram Reels with music visualization', async () => {
      console.log('Creating Instagram Reels content...');
      
      // Create music visualization data
      const beatTimes = [0, 0.5, 1, 1.5, 2, 2.5, 3, 3.5, 4, 4.5];
      const musicBars: any[] = [];
      
      for (let i = 0; i < 10; i++) {
        musicBars.push({
          height: Math.random() * 50 + 20,
          color: `hsl(${i * 36}, 100%, 50%)`,
          time: beatTimes[i % beatTimes.length]
        });
      }
      
      // Create timeline
      let timeline = new Timeline()
        .setResolution(1080, 1920)
        .setFrameRate(30)
        .setAspectRatio('9:16');
      
      // Add gradient background
      timeline = timeline.addText('', {
        startTime: 0,
        duration: 15,
        position: { x: '50%', y: '50%' },
        style: {
          width: '100%',
          height: '100%',
          background: 'linear-gradient(45deg, #405DE6, #5851DB, #833AB4, #C13584, #E1306C)',
          opacity: 1
        }
      });
      
      // Add music bars
      musicBars.forEach((bar, index) => {
        timeline = timeline.addText('█', {
          startTime: bar.time,
          duration: 0.5,
          position: { 
            x: `${10 + index * 8}%`, 
            y: '70%' 
          },
          style: {
            fontSize: bar.height,
            color: bar.color,
            transform: `scaleY(${bar.height / 50})`
          },
          animation: {
            type: 'scale',
            from: 0.1,
            to: 1,
            duration: 0.2
          }
        });
      });
      
      // Add song info
      timeline = timeline
        .addText('🎵 Viral Sound - Artist Name', {
          startTime: 0,
          duration: 15,
          position: { x: '50%', y: '10%' },
          style: {
            fontSize: 24,
            color: '#FFFFFF',
            backgroundColor: 'rgba(0,0,0,0.5)',
            padding: '10px 20px',
            borderRadius: '20px'
          }
        })
        .addText('Tap to use this sound ➡️', {
          startTime: 0,
          duration: 15,
          position: { x: '50%', y: '90%' },
          style: {
            fontSize: 18,
            color: '#FFFFFF',
            opacity: 0.8
          }
        });
      
      const command = timeline.getCommand('instagram-reels.mp4');
      expect(command).toBeTruthy();
      
      console.log('Instagram Reels with music viz created! 🎵');
    });

    test('should create YouTube Shorts with chapters', async () => {
      console.log('Creating YouTube Shorts content...');
      
      // Define chapters
      const chapters = [
        { title: 'Intro', start: 0, end: 3 },
        { title: 'Main Content', start: 3, end: 10 },
        { title: 'Call to Action', start: 10, end: 15 }
      ];
      
      // Download YouTube-style assets
      const assets = await imageHandler.processBatch([
        'https://via.placeholder.com/1080x1920/FF0000/FFFFFF?text=YouTube+Shorts',
        'https://via.placeholder.com/200x200/FFFFFF/FF0000?text=Subscribe',
        'https://via.placeholder.com/100x100/FFFFFF/000000?text=👍'
      ]);
      
      let timeline = new Timeline()
        .setResolution(1080, 1920)
        .setFrameRate(30)
        .setAspectRatio('9:16');
      
      // Add background
      if (assets[0] && !assets[0].error) {
        timeline = timeline.addImage(assets[0].localPath, {
          duration: 15,
          position: { x: '50%', y: '50%' }
        });
      }
      
      // Add chapter markers
      chapters.forEach(chapter => {
        timeline = timeline.addText(`${chapter.title}`, {
          startTime: chapter.start,
          duration: 0.5,
          position: { x: '10%', y: '10%' },
          style: {
            fontSize: 18,
            color: '#FFFFFF',
            backgroundColor: 'rgba(255,0,0,0.8)',
            padding: '5px 10px',
            borderRadius: '5px'
          },
          animation: {
            type: 'fade',
            duration: 0.2
          }
        });
      });
      
      // Add subscribe button
      if (assets[1] && !assets[1].error) {
        timeline = timeline.addImage(assets[1].localPath, {
          startTime: 10,
          duration: 5,
          position: { x: '50%', y: '80%' },
          transform: { scale: 0.8 },
          animation: {
            type: 'bounce',
            duration: 0.5
          }
        });
      }
      
      const command = timeline.getCommand('youtube-shorts.mp4');
      expect(command).toBeTruthy();
      
      console.log('YouTube Shorts with chapters created! 🎬');
    });
  });

  describe('🎓 EDUCATIONAL CONTENT', () => {
    test('should create online course lesson with slides', async () => {
      console.log('Creating online course content...');
      
      // Course structure
      const lesson = {
        title: 'Introduction to JavaScript',
        duration: 30,
        slides: [
          { title: 'What is JavaScript?', duration: 5, points: ['Dynamic language', 'Client & Server', 'Event-driven'] },
          { title: 'Variables & Types', duration: 5, points: ['let, const, var', 'String, Number, Boolean', 'Objects & Arrays'] },
          { title: 'Functions', duration: 5, points: ['Function declaration', 'Arrow functions', 'Callbacks'] },
          { title: 'Practice Time', duration: 5, points: ['Try it yourself!', 'Code examples', 'Q&A'] }
        ]
      };
      
      // Create slide images
      const slidePromises = lesson.slides.map((slide, i) => 
        imageHandler.processImageSource(
          `https://via.placeholder.com/1920x1080/2C3E50/FFFFFF?text=${encodeURIComponent(slide.title)}`
        )
      );
      
      const slideImages = await Promise.all(slidePromises);
      
      // Create subtitles for narration
      const narration: SRTEntry[] = [];
      let currentTime = 0;
      
      lesson.slides.forEach((slide, slideIndex) => {
        // Title announcement
        narration.push({
          index: narration.length + 1,
          startTime: currentTime,
          endTime: currentTime + 2,
          text: slide.title,
          style: { bold: true, fontSize: 36 }
        });
        currentTime += 2;
        
        // Points
        slide.points.forEach((point, pointIndex) => {
          narration.push({
            index: narration.length + 1,
            startTime: currentTime,
            endTime: currentTime + 1,
            text: `• ${point}`,
            style: { fontSize: 28 }
          });
          currentTime += 1;
        });
      });
      
      // Save narration
      const narrationFile = join(scenarioDir, 'course-narration.srt');
      await srtHandler.writeSRTFile(narrationFile, narration);
      
      // Create timeline
      let timeline = new Timeline()
        .setResolution(1920, 1080)
        .setFrameRate(24)
        .setAspectRatio('16:9');
      
      // Add slides
      let slideTime = 0;
      lesson.slides.forEach((slide, index) => {
        if (slideImages[index] && !slideImages[index].error) {
          timeline = timeline.addImage(slideImages[index].localPath, {
            startTime: slideTime,
            duration: slide.duration,
            position: { x: '50%', y: '50%' },
            transition: index > 0 ? { type: 'slide', duration: 0.5 } : undefined
          });
        }
        slideTime += slide.duration;
      });
      
      // Add narration subtitles
      narration.forEach(subtitle => {
        timeline = timeline.addText(subtitle.text, {
          startTime: subtitle.startTime,
          duration: subtitle.endTime - subtitle.startTime,
          position: { x: '50%', y: '85%' },
          style: {
            ...subtitle.style,
            color: '#FFFFFF',
            backgroundColor: 'rgba(0,0,0,0.8)',
            padding: '10px 20px',
            borderRadius: '5px'
          }
        });
      });
      
      // Add progress bar
      timeline = timeline.addText('', {
        startTime: 0,
        duration: 20,
        position: { x: '0%', y: '98%' },
        style: {
          width: '100%',
          height: '4px',
          backgroundColor: '#3498DB',
          animation: 'progress-bar 20s linear'
        }
      });
      
      const command = timeline.getCommand('online-course-lesson.mp4');
      expect(command).toBeTruthy();
      
      console.log('Online course lesson created! 📚');
    });

    test('should create tutorial with code snippets', async () => {
      console.log('Creating coding tutorial...');
      
      // Code snippets to show
      const codeSnippets = [
        {
          title: 'Hello World',
          code: `function helloWorld() {\n  console.log('Hello, World!');\n}\n\nhelloWorld();`,
          explanation: 'This is your first JavaScript function!'
        },
        {
          title: 'Variables',
          code: `const name = 'Alice';\nlet age = 25;\nvar city = 'New York';\n\nconsole.log(\`\${name} is \${age} years old\`);`,
          explanation: 'Learn about const, let, and var'
        },
        {
          title: 'Arrays',
          code: `const fruits = ['apple', 'banana', 'orange'];\n\nfruits.forEach(fruit => {\n  console.log(\`I like \${fruit}\`);\n});`,
          explanation: 'Working with arrays and loops'
        }
      ];
      
      let timeline = new Timeline()
        .setResolution(1920, 1080)
        .setFrameRate(24)
        .setAspectRatio('16:9');
      
      // Dark background for code
      timeline = timeline.addText('', {
        startTime: 0,
        duration: 30,
        position: { x: '50%', y: '50%' },
        style: {
          width: '100%',
          height: '100%',
          backgroundColor: '#1E1E1E'
        }
      });
      
      // Add code snippets
      let currentTime = 0;
      codeSnippets.forEach((snippet, index) => {
        // Title
        timeline = timeline.addText(snippet.title, {
          startTime: currentTime,
          duration: 8,
          position: { x: '50%', y: '10%' },
          style: {
            fontSize: 36,
            color: '#61DAFB',
            fontWeight: 'bold'
          }
        });
        
        // Code block
        timeline = timeline.addText(snippet.code, {
          startTime: currentTime + 1,
          duration: 7,
          position: { x: '50%', y: '40%' },
          style: {
            fontSize: 24,
            color: '#F8F8F2',
            backgroundColor: '#282828',
            padding: '20px',
            borderRadius: '10px',
            fontFamily: 'monospace',
            whiteSpace: 'pre',
            textAlign: 'left'
          },
          animation: {
            type: 'fade',
            duration: 0.5
          }
        });
        
        // Explanation
        timeline = timeline.addText(snippet.explanation, {
          startTime: currentTime + 3,
          duration: 5,
          position: { x: '50%', y: '80%' },
          style: {
            fontSize: 28,
            color: '#FFFFFF',
            fontStyle: 'italic'
          }
        });
        
        currentTime += 10;
      });
      
      const command = timeline.getCommand('coding-tutorial.mp4');
      expect(command).toBeTruthy();
      
      console.log('Coding tutorial created! 💻');
    });
  });

  describe('🎪 EVENT COVERAGE', () => {
    test('should create conference highlight reel', async () => {
      console.log('Creating conference highlights...');
      
      // Conference schedule
      const sessions = [
        { speaker: 'Dr. Jane Smith', topic: 'Future of AI', time: '9:00 AM' },
        { speaker: 'Prof. John Doe', topic: 'Quantum Computing', time: '10:30 AM' },
        { speaker: 'Ms. Alice Johnson', topic: 'Cybersecurity Trends', time: '2:00 PM' }
      ];
      
      // Download speaker placeholders
      const speakerImages = await imageHandler.processBatch(
        sessions.map((s, i) => 
          `https://via.placeholder.com/400x400/3498DB/FFFFFF?text=Speaker+${i + 1}`
        )
      );
      
      let timeline = new Timeline()
        .setResolution(1920, 1080)
        .setFrameRate(30)
        .setAspectRatio('16:9');
      
      // Conference intro
      timeline = timeline.addText('TechConf 2024 Highlights', {
        startTime: 0,
        duration: 3,
        position: { x: '50%', y: '50%' },
        style: {
          fontSize: 64,
          color: '#FFFFFF',
          backgroundColor: '#3498DB',
          padding: '20px 40px',
          fontWeight: 'bold'
        },
        animation: {
          type: 'scale',
          from: 0.8,
          to: 1,
          duration: 0.5
        }
      });
      
      // Add sessions
      let currentTime = 4;
      sessions.forEach((session, index) => {
        // Speaker image
        if (speakerImages[index] && !speakerImages[index].error) {
          timeline = timeline.addImage(speakerImages[index].localPath, {
            startTime: currentTime,
            duration: 5,
            position: { x: '25%', y: '50%' },
            transform: { scale: 0.8 },
            style: {
              borderRadius: '50%',
              border: '5px solid #3498DB'
            }
          });
        }
        
        // Session info
        timeline = timeline
          .addText(session.speaker, {
            startTime: currentTime,
            duration: 5,
            position: { x: '65%', y: '35%' },
            style: {
              fontSize: 36,
              color: '#2C3E50',
              fontWeight: 'bold'
            }
          })
          .addText(session.topic, {
            startTime: currentTime,
            duration: 5,
            position: { x: '65%', y: '50%' },
            style: {
              fontSize: 48,
              color: '#3498DB'
            }
          })
          .addText(session.time, {
            startTime: currentTime,
            duration: 5,
            position: { x: '65%', y: '65%' },
            style: {
              fontSize: 28,
              color: '#7F8C8D'
            }
          });
        
        currentTime += 6;
      });
      
      // Closing
      timeline = timeline.addText('See you next year!', {
        startTime: currentTime,
        duration: 3,
        position: { x: '50%', y: '50%' },
        style: {
          fontSize: 48,
          color: '#FFFFFF',
          backgroundColor: '#2ECC71',
          padding: '20px 40px',
          borderRadius: '10px'
        }
      });
      
      const command = timeline.getCommand('conference-highlights.mp4');
      expect(command).toBeTruthy();
      
      console.log('Conference highlight reel created! 🎤');
    });

    test('should create live event lower thirds', async () => {
      console.log('Creating live event graphics...');
      
      // Live event speakers
      const speakers = [
        { name: 'Sarah Williams', title: 'CEO, TechCorp', location: 'San Francisco' },
        { name: 'Michael Chen', title: 'CTO, StartupXYZ', location: 'Singapore' },
        { name: 'Emma Rodriguez', title: 'Head of AI Research', location: 'London' }
      ];
      
      let timeline = new Timeline()
        .setResolution(1920, 1080)
        .setFrameRate(30)
        .setAspectRatio('16:9');
      
      // Transparent background (for overlay)
      timeline = timeline.addText('', {
        startTime: 0,
        duration: 30,
        position: { x: '50%', y: '50%' },
        style: {
          width: '100%',
          height: '100%',
          backgroundColor: 'transparent'
        }
      });
      
      // Add lower thirds for each speaker
      let currentTime = 0;
      speakers.forEach((speaker, index) => {
        // Animated background bar
        timeline = timeline.addText('', {
          startTime: currentTime,
          duration: 8,
          position: { x: '0%', y: '75%' },
          style: {
            width: '40%',
            height: '120px',
            backgroundColor: 'rgba(52, 152, 219, 0.9)',
            transform: 'translateX(-100%)',
            animation: 'slide-in 0.5s ease-out forwards'
          }
        });
        
        // Name
        timeline = timeline.addText(speaker.name, {
          startTime: currentTime + 0.5,
          duration: 7.5,
          position: { x: '5%', y: '72%' },
          style: {
            fontSize: 36,
            color: '#FFFFFF',
            fontWeight: 'bold',
            textAlign: 'left'
          }
        });
        
        // Title
        timeline = timeline.addText(speaker.title, {
          startTime: currentTime + 0.5,
          duration: 7.5,
          position: { x: '5%', y: '80%' },
          style: {
            fontSize: 24,
            color: '#ECF0F1',
            textAlign: 'left'
          }
        });
        
        // Location with icon
        timeline = timeline.addText(`📍 ${speaker.location}`, {
          startTime: currentTime + 0.5,
          duration: 7.5,
          position: { x: '5%', y: '87%' },
          style: {
            fontSize: 20,
            color: '#BDC3C7',
            textAlign: 'left'
          }
        });
        
        currentTime += 10;
      });
      
      const command = timeline.getCommand('lower-thirds.mp4');
      expect(command).toBeTruthy();
      
      console.log('Live event lower thirds created! 📺');
    });
  });

  describe('🛍️ E-COMMERCE CONTENT', () => {
    test('should create product showcase video', async () => {
      console.log('Creating product showcase...');
      
      // Product details
      const product = {
        name: 'Wireless Headphones Pro',
        price: '$299',
        features: ['Noise Cancelling', '30hr Battery', 'Premium Sound'],
        images: [
          'https://via.placeholder.com/800x800/2C3E50/FFFFFF?text=Product+Front',
          'https://via.placeholder.com/800x800/34495E/FFFFFF?text=Product+Side',
          'https://via.placeholder.com/800x800/1A252F/FFFFFF?text=Product+Back'
        ]
      };
      
      // Download product images
      const productImages = await imageHandler.processBatch(product.images);
      
      let timeline = new Timeline()
        .setResolution(1080, 1080) // Square for social media
        .setFrameRate(30)
        .setAspectRatio('1:1');
      
      // Product carousel
      let imageTime = 0;
      productImages.forEach((img, index) => {
        if (!img.error) {
          timeline = timeline.addImage(img.localPath, {
            startTime: imageTime,
            duration: 3,
            position: { x: '50%', y: '40%' },
            transform: { scale: 0.8 },
            transition: index > 0 ? { type: 'fade', duration: 0.5 } : undefined
          });
        }
        imageTime += 3;
      });
      
      // Product name banner
      timeline = timeline.addText(product.name, {
        startTime: 0,
        duration: 9,
        position: { x: '50%', y: '10%' },
        style: {
          fontSize: 42,
          color: '#2C3E50',
          fontWeight: 'bold',
          backgroundColor: 'rgba(255,255,255,0.9)',
          padding: '10px 30px',
          borderRadius: '5px'
        }
      });
      
      // Price tag
      timeline = timeline.addText(product.price, {
        startTime: 0,
        duration: 9,
        position: { x: '85%', y: '85%' },
        style: {
          fontSize: 48,
          color: '#E74C3C',
          fontWeight: 'bold',
          backgroundColor: '#FFFFFF',
          padding: '10px 20px',
          borderRadius: '50px',
          boxShadow: '0 4px 6px rgba(0,0,0,0.1)'
        },
        animation: {
          type: 'pulse',
          scale: 1.1,
          duration: 1
        }
      });
      
      // Features
      let featureTime = 1;
      product.features.forEach((feature, index) => {
        timeline = timeline.addText(`✓ ${feature}`, {
          startTime: featureTime,
          duration: 7,
          position: { x: '50%', y: `${70 + index * 8}%` },
          style: {
            fontSize: 24,
            color: '#27AE60',
            backgroundColor: 'rgba(255,255,255,0.9)',
            padding: '5px 15px',
            borderRadius: '20px'
          },
          animation: {
            type: 'slide',
            from: 'right',
            duration: 0.3
          }
        });
        featureTime += 0.5;
      });
      
      // Call to action
      timeline = timeline.addText('Shop Now →', {
        startTime: 10,
        duration: 5,
        position: { x: '50%', y: '90%' },
        style: {
          fontSize: 36,
          color: '#FFFFFF',
          backgroundColor: '#E74C3C',
          padding: '15px 40px',
          borderRadius: '30px',
          fontWeight: 'bold'
        },
        animation: {
          type: 'bounce',
          duration: 0.5
        }
      });
      
      const command = timeline.getCommand('product-showcase.mp4');
      expect(command).toBeTruthy();
      
      console.log('Product showcase created! 🛍️');
    });
  });

  describe('🎮 GAMING CONTENT', () => {
    test('should create gaming highlight montage', async () => {
      console.log('Creating gaming montage...');
      
      // Gaming moments
      const highlights = [
        { player: 'xXProGamerXx', action: 'TRIPLE KILL!', time: '2:34' },
        { player: 'N00bSlayer', action: 'HEADSHOT!', time: '5:17' },
        { player: 'EliteSniper', action: 'VICTORY ROYALE!', time: '12:45' }
      ];
      
      let timeline = new Timeline()
        .setResolution(1920, 1080)
        .setFrameRate(60) // High FPS for gaming
        .setAspectRatio('16:9');
      
      // Dark gaming background
      timeline = timeline.addText('', {
        startTime: 0,
        duration: 15,
        position: { x: '50%', y: '50%' },
        style: {
          width: '100%',
          height: '100%',
          background: 'linear-gradient(135deg, #1e3c72, #2a5298)',
          opacity: 1
        }
      });
      
      // Add highlights
      let currentTime = 0;
      highlights.forEach((highlight, index) => {
        // Kill feed style notification
        timeline = timeline
          .addText(highlight.action, {
            startTime: currentTime,
            duration: 3,
            position: { x: '50%', y: '30%' },
            style: {
              fontSize: 72,
              color: '#FFD700',
              fontWeight: 'bold',
              textShadow: '4px 4px 8px rgba(0,0,0,0.8)',
              textTransform: 'uppercase',
              letterSpacing: '3px'
            },
            animation: {
              type: 'scale',
              from: 1.5,
              to: 1,
              duration: 0.3
            }
          })
          .addText(highlight.player, {
            startTime: currentTime,
            duration: 3,
            position: { x: '50%', y: '50%' },
            style: {
              fontSize: 36,
              color: '#FFFFFF',
              fontWeight: 'bold'
            }
          })
          .addText(highlight.time, {
            startTime: currentTime,
            duration: 3,
            position: { x: '50%', y: '65%' },
            style: {
              fontSize: 24,
              color: '#BDC3C7'
            }
          });
        
        // Add fire emojis for effect
        timeline = timeline
          .addText('🔥', {
            startTime: currentTime,
            duration: 3,
            position: { x: '30%', y: '30%' },
            style: { fontSize: 48 },
            animation: {
              type: 'rotate',
              from: -30,
              to: 30,
              duration: 0.5
            }
          })
          .addText('🔥', {
            startTime: currentTime,
            duration: 3,
            position: { x: '70%', y: '30%' },
            style: { fontSize: 48 },
            animation: {
              type: 'rotate',
              from: 30,
              to: -30,
              duration: 0.5
            }
          });
        
        currentTime += 5;
      });
      
      const command = timeline.getCommand('gaming-montage.mp4');
      expect(command).toContain('-r 60'); // Verify 60 FPS
      
      console.log('Gaming montage created! 🎮');
    });
  });

  describe('📰 NEWS & MEDIA', () => {
    test('should create breaking news bulletin', async () => {
      console.log('Creating breaking news content...');
      
      // News data
      const breakingNews = {
        headline: 'BREAKING: Major Discovery Announced',
        ticker: [
          'Scientists discover new planet in nearby solar system',
          'Stock markets reach record highs',
          'Weather: Severe storms expected this weekend',
          'Sports: Local team advances to finals'
        ],
        timestamp: new Date().toLocaleString()
      };
      
      // Download news graphics
      const newsAssets = await imageHandler.processBatch([
        'https://via.placeholder.com/1920x1080/C0392B/FFFFFF?text=BREAKING+NEWS',
        'https://via.placeholder.com/200x200/E74C3C/FFFFFF?text=LIVE'
      ]);
      
      let timeline = new Timeline()
        .setResolution(1920, 1080)
        .setFrameRate(30)
        .setAspectRatio('16:9');
      
      // Background
      if (newsAssets[0] && !newsAssets[0].error) {
        timeline = timeline.addImage(newsAssets[0].localPath, {
          duration: 20,
          position: { x: '50%', y: '50%' }
        });
      }
      
      // Live badge
      if (newsAssets[1] && !newsAssets[1].error) {
        timeline = timeline.addImage(newsAssets[1].localPath, {
          startTime: 0,
          duration: 20,
          position: { x: '90%', y: '10%' },
          transform: { scale: 0.5 },
          animation: {
            type: 'pulse',
            scale: 1.2,
            duration: 1
          }
        });
      }
      
      // Main headline
      timeline = timeline.addText(breakingNews.headline, {
        startTime: 0,
        duration: 20,
        position: { x: '50%', y: '50%' },
        style: {
          fontSize: 64,
          color: '#FFFFFF',
          fontWeight: 'bold',
          textShadow: '3px 3px 6px rgba(0,0,0,0.5)',
          textTransform: 'uppercase'
        }
      });
      
      // Timestamp
      timeline = timeline.addText(breakingNews.timestamp, {
        startTime: 0,
        duration: 20,
        position: { x: '10%', y: '10%' },
        style: {
          fontSize: 18,
          color: '#ECF0F1'
        }
      });
      
      // News ticker
      let tickerTime = 0;
      breakingNews.ticker.forEach((news, index) => {
        timeline = timeline.addText(news, {
          startTime: tickerTime,
          duration: 5,
          position: { x: '50%', y: '90%' },
          style: {
            fontSize: 24,
            color: '#FFFFFF',
            backgroundColor: 'rgba(192,57,43,0.9)',
            padding: '10px',
            width: '100%'
          },
          animation: {
            type: 'slide',
            from: 'right',
            duration: 0.5
          }
        });
        tickerTime += 5;
      });
      
      const command = timeline.getCommand('breaking-news.mp4');
      expect(command).toBeTruthy();
      
      console.log('Breaking news bulletin created! 📰');
    });
  });
});
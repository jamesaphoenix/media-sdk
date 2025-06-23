/**
 * @fileoverview INTEGRATION TESTS - SRT + IMAGES + TIMELINE
 * 
 * Tests that combine SRT subtitles, image handling, and Timeline API
 * to create real-world video compositions with subtitles and images.
 */

import { test, expect, describe, beforeAll, afterAll } from 'bun:test';
import { Timeline } from '@jamesaphoenix/media-sdk';
import { SRTHandler, SRTEntry } from '../../../packages/media-sdk/src/captions/srt-handler.js';
import { ImageSourceHandler } from '../../../packages/media-sdk/src/utils/image-source-handler.js';
import { promises as fs } from 'fs';
import { join } from 'path';
import { tmpdir } from 'os';

describe('🎬 INTEGRATION: SRT + IMAGES + TIMELINE', () => {
  let integrationDir: string;
  let srtHandler: SRTHandler;
  let imageHandler: ImageSourceHandler;
  
  beforeAll(async () => {
    integrationDir = join(tmpdir(), 'integration-test-' + Date.now());
    await fs.mkdir(integrationDir, { recursive: true });
    
    srtHandler = new SRTHandler();
    imageHandler = new ImageSourceHandler({
      downloadDir: join(integrationDir, 'images'),
      enableCache: true
    });
    
    console.log('Integration test directory:', integrationDir);
  });
  
  afterAll(async () => {
    try {
      await cleanupDirectory(integrationDir);
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

  describe('📺 VIDEO SLIDESHOW WITH SUBTITLES', () => {
    test('should create a photo slideshow with captions', async () => {
      // Step 1: Download/prepare images
      const slideImages = [
        'https://via.placeholder.com/1920x1080/FF0000/FFFFFF?text=Slide+1',
        'https://via.placeholder.com/1920x1080/00FF00/FFFFFF?text=Slide+2',
        'https://via.placeholder.com/1920x1080/0000FF/FFFFFF?text=Slide+3',
        'https://via.placeholder.com/1920x1080/FFFF00/000000?text=Slide+4'
      ];

      console.log('Downloading slideshow images...');
      const imageResults = await imageHandler.processBatch(slideImages);
      const validImages = imageResults.filter(r => !r.error);
      expect(validImages.length).toBeGreaterThan(0);

      // Step 2: Create subtitles for each slide
      const subtitles: SRTEntry[] = [
        {
          index: 1,
          startTime: 0,
          endTime: 4,
          text: 'Welcome to our presentation',
          style: { bold: true, fontSize: 48 }
        },
        {
          index: 2,
          startTime: 5,
          endTime: 9,
          text: 'Here is our first topic',
          style: { color: '#FFFFFF' }
        },
        {
          index: 3,
          startTime: 10,
          endTime: 14,
          text: 'Moving on to the second point',
          style: { color: '#FFFFFF' }
        },
        {
          index: 4,
          startTime: 15,
          endTime: 19,
          text: 'Thank you for watching!',
          style: { bold: true, italic: true }
        }
      ];

      // Save subtitles to file
      const srtFile = join(integrationDir, 'slideshow.srt');
      await srtHandler.writeSRTFile(srtFile, subtitles);

      // Step 3: Create Timeline composition
      let timeline = new Timeline();

      // Add images as slides
      validImages.forEach((image, index) => {
        timeline = timeline.addImage(image.localPath, {
          startTime: index * 5,
          duration: 5,
          position: { x: '50%', y: '50%', anchor: 'center' }
        });
      });

      // Add subtitles from SRT
      subtitles.forEach(subtitle => {
        timeline = timeline.addText(subtitle.text, {
          startTime: subtitle.startTime,
          duration: subtitle.endTime - subtitle.startTime,
          position: { x: '50%', y: '85%', anchor: 'center' },
          style: {
            fontSize: subtitle.style?.fontSize || 36,
            color: subtitle.style?.color || '#FFFFFF',
            fontWeight: subtitle.style?.bold ? 'bold' : 'normal',
            fontStyle: subtitle.style?.italic ? 'italic' : 'normal',
            backgroundColor: 'rgba(0,0,0,0.7)',
            padding: '10px 20px'
          }
        });
      });

      // Generate FFmpeg command
      const command = timeline.getCommand('slideshow-with-subtitles.mp4');
      
      expect(command).toContain('-i');
      expect(command).toContain('drawtext');
      console.log('Generated slideshow command length:', command.length);
    });

    test('should create a multi-language video presentation', async () => {
      // Download background images
      const backgrounds = [
        'https://via.placeholder.com/1920x1080/2C3E50/FFFFFF?text=Background'
      ];
      
      const bgResults = await imageHandler.processBatch(backgrounds);
      expect(bgResults[0].error).toBeUndefined();

      // Create multi-language subtitles
      const languages = [
        {
          code: 'en',
          subtitles: [
            { index: 1, startTime: 0, endTime: 3, text: 'Hello and welcome!' },
            { index: 2, startTime: 4, endTime: 7, text: 'This is a multilingual presentation' },
            { index: 3, startTime: 8, endTime: 11, text: 'Thank you for watching' }
          ]
        },
        {
          code: 'es',
          subtitles: [
            { index: 1, startTime: 0, endTime: 3, text: '¡Hola y bienvenidos!' },
            { index: 2, startTime: 4, endTime: 7, text: 'Esta es una presentación multilingüe' },
            { index: 3, startTime: 8, endTime: 11, text: 'Gracias por ver' }
          ]
        },
        {
          code: 'fr',
          subtitles: [
            { index: 1, startTime: 0, endTime: 3, text: 'Bonjour et bienvenue!' },
            { index: 2, startTime: 4, endTime: 7, text: 'Ceci est une présentation multilingue' },
            { index: 3, startTime: 8, endTime: 11, text: 'Merci de regarder' }
          ]
        }
      ];

      // Save each language SRT
      for (const lang of languages) {
        const srtFile = join(integrationDir, `presentation_${lang.code}.srt`);
        await srtHandler.writeSRTFile(srtFile, lang.subtitles);
      }

      // Create timeline with background
      let timeline = new Timeline()
        .addImage(bgResults[0].localPath, {
          duration: 12,
          position: { x: '50%', y: '50%', anchor: 'center' }
        });

      // Add all language subtitles at different positions
      let yPosition = 70;
      for (const lang of languages) {
        for (const subtitle of lang.subtitles) {
          timeline = timeline.addText(`[${lang.code.toUpperCase()}] ${subtitle.text}`, {
            startTime: subtitle.startTime,
            duration: subtitle.endTime - subtitle.startTime,
            position: { x: '50%', y: `${yPosition}%`, anchor: 'center' },
            style: {
              fontSize: 28,
              color: '#FFFFFF',
              backgroundColor: 'rgba(0,0,0,0.8)',
              padding: '5px 15px'
            }
          });
        }
        yPosition += 10;
      }

      const command = timeline.getCommand('multilingual-presentation.mp4');
      expect(command).toBeTruthy();
      console.log('Created multilingual presentation with', languages.length, 'languages');
    });
  });

  describe('🎥 DYNAMIC VIDEO CREATION', () => {
    test('should create a news ticker video with images', async () => {
      // Download news-style images
      const newsImages = [
        'https://via.placeholder.com/1920x1080/1A1A1A/FFFFFF?text=BREAKING+NEWS',
        'https://via.placeholder.com/400x300/FF0000/FFFFFF?text=LIVE',
        'https://via.placeholder.com/200x200/0000FF/FFFFFF?text=LOGO'
      ];

      const imageResults = await imageHandler.processBatch(newsImages);
      const [mainBg, liveBadge, logo] = imageResults;

      // Create scrolling news ticker subtitles
      const tickerText = 'BREAKING: Major announcement coming at 3PM EST • Stock markets reach all-time high • Weather alert for the eastern region • Sports: Local team wins championship';
      
      const tickerEntries: SRTEntry[] = [];
      const words = tickerText.split(' ');
      let currentTime = 0;
      
      // Create word-by-word ticker
      for (let i = 0; i < words.length; i += 5) {
        const chunk = words.slice(i, i + 5).join(' ');
        tickerEntries.push({
          index: i / 5 + 1,
          startTime: currentTime,
          endTime: currentTime + 2,
          text: chunk
        });
        currentTime += 0.5;
      }

      // Save ticker SRT
      const tickerSRT = join(integrationDir, 'news-ticker.srt');
      await srtHandler.writeSRTFile(tickerSRT, tickerEntries);

      // Create news layout timeline
      let timeline = new Timeline();

      // Background
      if (!mainBg.error) {
        timeline = timeline.addImage(mainBg.localPath, {
          duration: 30,
          position: { x: '50%', y: '50%', anchor: 'center' }
        });
      }

      // Live badge
      if (!liveBadge.error) {
        timeline = timeline.addImage(liveBadge.localPath, {
          startTime: 0,
          duration: 30,
          position: { x: '10%', y: '10%', anchor: 'center' },
          transform: { scale: 0.5 }
        });
      }

      // Logo
      if (!logo.error) {
        timeline = timeline.addImage(logo.localPath, {
          startTime: 0,
          duration: 30,
          position: { x: '90%', y: '10%', anchor: 'center' },
          transform: { scale: 0.3 }
        });
      }

      // Add ticker text
      tickerEntries.forEach(entry => {
        timeline = timeline.addText(entry.text, {
          startTime: entry.startTime,
          duration: entry.endTime - entry.startTime,
          position: { x: '50%', y: '95%', anchor: 'center' },
          style: {
            fontSize: 32,
            color: '#FFFF00',
            backgroundColor: '#FF0000',
            padding: '10px'
          }
        });
      });

      const command = timeline.getCommand('news-broadcast.mp4');
      expect(command).toBeTruthy();
      console.log('Created news ticker with', tickerEntries.length, 'ticker items');
    });

    test('should create an educational video with diagrams and captions', async () => {
      // Download educational diagrams
      const diagrams = [
        'https://via.placeholder.com/800x600/FFFFFF/000000?text=Diagram+1:+Introduction',
        'https://via.placeholder.com/800x600/FFFFFF/000000?text=Diagram+2:+Process',
        'https://via.placeholder.com/800x600/FFFFFF/000000?text=Diagram+3:+Results',
        'https://via.placeholder.com/800x600/FFFFFF/000000?text=Diagram+4:+Conclusion'
      ];

      const diagramResults = await imageHandler.processBatch(diagrams);

      // Create educational narration
      const narration: SRTEntry[] = [
        {
          index: 1,
          startTime: 0,
          endTime: 5,
          text: 'Welcome to our educational video.\nToday we will learn about the scientific method.'
        },
        {
          index: 2,
          startTime: 6,
          endTime: 11,
          text: 'First, we observe and ask questions.\nThis is the foundation of scientific inquiry.'
        },
        {
          index: 3,
          startTime: 12,
          endTime: 17,
          text: 'Next, we form a hypothesis.\nThis is our testable prediction.'
        },
        {
          index: 4,
          startTime: 18,
          endTime: 23,
          text: 'We then conduct experiments.\nData collection is crucial at this stage.'
        },
        {
          index: 5,
          startTime: 24,
          endTime: 29,
          text: 'Finally, we analyze results and draw conclusions.\nThank you for learning with us!'
        }
      ];

      // Save educational SRT
      const eduSRT = join(integrationDir, 'education.srt');
      await srtHandler.writeSRTFile(eduSRT, narration);

      // Create timeline
      let timeline = new Timeline();

      // Add diagrams synchronized with narration
      const diagramTiming = [
        { start: 0, duration: 6 },
        { start: 6, duration: 6 },
        { start: 12, duration: 6 },
        { start: 18, duration: 12 }
      ];

      diagramResults.forEach((diagram, index) => {
        if (!diagram.error && diagramTiming[index]) {
          timeline = timeline.addImage(diagram.localPath, {
            startTime: diagramTiming[index].start,
            duration: diagramTiming[index].duration,
            position: { x: '50%', y: '40%', anchor: 'center' },
            transform: { scale: 0.8 }
          });
        }
      });

      // Add narration subtitles
      narration.forEach(subtitle => {
        timeline = timeline.addText(subtitle.text, {
          startTime: subtitle.startTime,
          duration: subtitle.endTime - subtitle.startTime,
          position: { x: '50%', y: '85%', anchor: 'center' },
          style: {
            fontSize: 32,
            color: '#FFFFFF',
            backgroundColor: 'rgba(0,0,0,0.8)',
            padding: '10px 20px',
            textAlign: 'center'
          }
        });
      });

      const command = timeline.getCommand('educational-video.mp4');
      expect(command).toBeTruthy();
      console.log('Created educational video with', diagramResults.length, 'diagrams');
    });
  });

  describe('🎨 CREATIVE COMPOSITIONS', () => {
    test('should create a music video with synchronized lyrics', async () => {
      // Download album art and backgrounds
      const artworkUrls = [
        'https://via.placeholder.com/1000x1000/8B00FF/FFFFFF?text=Album+Art',
        'https://via.placeholder.com/1920x1080/000000/FFFFFF?text=Background'
      ];

      const artResults = await imageHandler.processBatch(artworkUrls);
      
      // Create karaoke-style lyrics
      const lyrics: SRTEntry[] = [
        { index: 1, startTime: 0, endTime: 2, text: '♪ ♪ ♪' },
        { index: 2, startTime: 2, endTime: 4, text: 'Verse 1: When the music starts to play' },
        { index: 3, startTime: 4, endTime: 6, text: 'Feel the rhythm every day' },
        { index: 4, startTime: 6, endTime: 8, text: 'Dancing in the summer light' },
        { index: 5, startTime: 8, endTime: 10, text: 'Everything will be alright' },
        { index: 6, startTime: 10, endTime: 12, text: '♪ ♪ ♪' },
        { index: 7, startTime: 12, endTime: 14, text: 'Chorus: This is our song' },
        { index: 8, startTime: 14, endTime: 16, text: 'Sing it loud and strong' },
        { index: 9, startTime: 16, endTime: 18, text: 'Together we belong' },
        { index: 10, startTime: 18, endTime: 20, text: 'All night long!' }
      ];

      // Save lyrics SRT
      const lyricsSRT = join(integrationDir, 'lyrics.srt');
      await srtHandler.writeSRTFile(lyricsSRT, lyrics);

      // Create music video timeline
      let timeline = new Timeline();

      // Add background
      if (artResults[1] && !artResults[1].error) {
        timeline = timeline.addImage(artResults[1].localPath, {
          duration: 20,
          position: { x: '50%', y: '50%', anchor: 'center' }
        });
      }

      // Add rotating album art
      if (artResults[0] && !artResults[0].error) {
        timeline = timeline.addImage(artResults[0].localPath, {
          startTime: 0,
          duration: 20,
          position: { x: '50%', y: '30%', anchor: 'center' },
          transform: { scale: 0.3 },
          animation: {
            type: 'rotate',
            from: 0,
            to: 360,
            duration: 20
          }
        });
      }

      // Add synchronized lyrics
      lyrics.forEach((lyric, index) => {
        const isChorus = lyric.text.includes('Chorus:');
        const isMusic = lyric.text.includes('♪');
        
        timeline = timeline.addText(lyric.text, {
          startTime: lyric.startTime,
          duration: lyric.endTime - lyric.startTime,
          position: { x: '50%', y: '75%', anchor: 'center' },
          style: {
            fontSize: isChorus ? 48 : 36,
            color: isMusic ? '#FFD700' : '#FFFFFF',
            fontWeight: isChorus ? 'bold' : 'normal',
            textShadow: '2px 2px 4px rgba(0,0,0,0.8)'
          },
          animation: isMusic ? {
            type: 'pulse',
            scale: 1.2,
            duration: 0.5
          } : undefined
        });
      });

      const command = timeline.getCommand('music-video.mp4');
      expect(command).toBeTruthy();
      console.log('Created music video with', lyrics.length, 'lyric lines');
    });

    test('should create a photo story with narrative captions', async () => {
      // Download story images
      const storyImages = [
        'https://via.placeholder.com/1920x1080/87CEEB/000000?text=Chapter+1',
        'https://via.placeholder.com/1920x1080/98FB98/000000?text=Chapter+2',
        'https://via.placeholder.com/1920x1080/DDA0DD/000000?text=Chapter+3',
        'https://via.placeholder.com/1920x1080/F0E68C/000000?text=The+End'
      ];

      const storyResults = await imageHandler.processBatch(storyImages);

      // Create narrative subtitles
      const narrative: SRTEntry[] = [
        {
          index: 1,
          startTime: 0,
          endTime: 4,
          text: 'Once upon a time, in a land far away...',
          style: { italic: true }
        },
        {
          index: 2,
          startTime: 5,
          endTime: 9,
          text: 'There lived a young adventurer seeking wisdom.',
          style: { italic: true }
        },
        {
          index: 3,
          startTime: 10,
          endTime: 14,
          text: 'The journey was long and filled with challenges.',
          style: { italic: true }
        },
        {
          index: 4,
          startTime: 15,
          endTime: 19,
          text: 'But in the end, the treasure was the friends made along the way.',
          style: { italic: true, bold: true }
        }
      ];

      // Save narrative SRT
      const narrativeSRT = join(integrationDir, 'narrative.srt');
      await srtHandler.writeSRTFile(narrativeSRT, narrative);

      // Create photo story timeline
      let timeline = new Timeline();

      // Add story images with transitions
      storyResults.forEach((image, index) => {
        if (!image.error) {
          timeline = timeline.addImage(image.localPath, {
            startTime: index * 5,
            duration: 5,
            position: { x: '50%', y: '50%', anchor: 'center' },
            transition: index > 0 ? {
              type: 'fade',
              duration: 1
            } : undefined
          });
        }
      });

      // Add narrative captions
      narrative.forEach(caption => {
        timeline = timeline.addText(caption.text, {
          startTime: caption.startTime,
          duration: caption.endTime - caption.startTime,
          position: { x: '50%', y: '80%', anchor: 'center' },
          style: {
            fontSize: 36,
            color: '#FFFFFF',
            fontStyle: caption.style?.italic ? 'italic' : 'normal',
            fontWeight: caption.style?.bold ? 'bold' : 'normal',
            backgroundColor: 'rgba(0,0,0,0.6)',
            padding: '15px 30px',
            borderRadius: '10px'
          }
        });
      });

      const command = timeline.getCommand('photo-story.mp4');
      expect(command).toBeTruthy();
      console.log('Created photo story with', narrative.length, 'narrative captions');
    });
  });

  describe('🔄 REAL-TIME WORKFLOW SIMULATION', () => {
    test('should handle dynamic content updates', async () => {
      // Simulate a live event with updating content
      const eventDir = join(integrationDir, 'live-event');
      await fs.mkdir(eventDir, { recursive: true });

      // Initial event setup
      let eventTimeline = new Timeline();
      const eventSubtitles: SRTEntry[] = [];

      // Download event branding
      const brandingUrls = [
        'https://via.placeholder.com/1920x1080/2C3E50/FFFFFF?text=LIVE+EVENT',
        'https://via.placeholder.com/300x100/E74C3C/FFFFFF?text=LIVE'
      ];

      const brandingResults = await imageHandler.processBatch(brandingUrls);

      // Add background
      if (!brandingResults[0].error) {
        eventTimeline = eventTimeline.addImage(brandingResults[0].localPath, {
          duration: 60,
          position: { x: '50%', y: '50%', anchor: 'center' }
        });
      }

      // Simulate live updates
      const updates = [
        { time: 0, text: 'Event starting soon...' },
        { time: 5, text: 'Welcome to our live event!' },
        { time: 10, text: 'First speaker taking the stage' },
        { time: 15, text: 'Important announcement coming up' },
        { time: 20, text: 'Q&A session beginning' }
      ];

      // Process updates
      for (const update of updates) {
        eventSubtitles.push({
          index: eventSubtitles.length + 1,
          startTime: update.time,
          endTime: update.time + 4,
          text: update.text
        });

        // Add to timeline
        eventTimeline = eventTimeline.addText(update.text, {
          startTime: update.time,
          duration: 4,
          position: { x: '50%', y: '90%', anchor: 'center' },
          style: {
            fontSize: 42,
            color: '#FFFFFF',
            backgroundColor: 'rgba(231,76,60,0.9)',
            padding: '10px 30px'
          }
        });
      }

      // Save current state
      const eventSRT = join(eventDir, 'event-updates.srt');
      await srtHandler.writeSRTFile(eventSRT, eventSubtitles);

      const command = eventTimeline.getCommand('live-event.mp4');
      expect(command).toBeTruthy();
      console.log('Simulated live event with', updates.length, 'updates');
    });
  });

  describe('🏆 PRODUCTION-READY WORKFLOWS', () => {
    test('should create a complete video package with all assets', async () => {
      const packageDir = join(integrationDir, 'video-package');
      await fs.mkdir(packageDir, { recursive: true });

      // Download all required assets
      const assets = {
        intro: 'https://via.placeholder.com/1920x1080/34495E/FFFFFF?text=INTRO',
        mainContent: 'https://via.placeholder.com/1920x1080/3498DB/FFFFFF?text=MAIN+CONTENT',
        outro: 'https://via.placeholder.com/1920x1080/2ECC71/FFFFFF?text=THANK+YOU',
        logo: 'https://via.placeholder.com/200x200/FFFFFF/000000?text=LOGO',
        watermark: 'https://via.placeholder.com/300x100/000000/FFFFFF?text=© 2024'
      };

      // Download all assets
      const assetUrls = Object.values(assets);
      const assetResults = await imageHandler.processBatch(assetUrls);

      // Create comprehensive subtitles
      const fullSubtitles: SRTEntry[] = [
        // Intro
        { index: 1, startTime: 0, endTime: 3, text: 'Welcome to our presentation' },
        { index: 2, startTime: 3, endTime: 5, text: 'Prepared by Media SDK' },
        // Main content
        { index: 3, startTime: 6, endTime: 9, text: 'Today\'s topic: Video Creation' },
        { index: 4, startTime: 9, endTime: 12, text: 'Combining images and subtitles' },
        { index: 5, startTime: 12, endTime: 15, text: 'Creating professional content' },
        // Outro
        { index: 6, startTime: 16, endTime: 19, text: 'Thank you for watching!' },
        { index: 7, startTime: 19, endTime: 22, text: 'See you next time' }
      ];

      // Save master SRT file
      const masterSRT = join(packageDir, 'master-subtitles.srt');
      await srtHandler.writeSRTFile(masterSRT, fullSubtitles);

      // Create final timeline
      let finalTimeline = new Timeline();

      // Add sections
      const [intro, main, outro, logo, watermark] = assetResults;

      // Intro section (0-5s)
      if (!intro.error) {
        finalTimeline = finalTimeline.addImage(intro.localPath, {
          startTime: 0,
          duration: 5,
          position: { x: '50%', y: '50%', anchor: 'center' }
        });
      }

      // Main section (6-15s)
      if (!main.error) {
        finalTimeline = finalTimeline.addImage(main.localPath, {
          startTime: 6,
          duration: 9,
          position: { x: '50%', y: '50%', anchor: 'center' }
        });
      }

      // Outro section (16-22s)
      if (!outro.error) {
        finalTimeline = finalTimeline.addImage(outro.localPath, {
          startTime: 16,
          duration: 6,
          position: { x: '50%', y: '50%', anchor: 'center' }
        });
      }

      // Logo (throughout)
      if (!logo.error) {
        finalTimeline = finalTimeline.addImage(logo.localPath, {
          startTime: 0,
          duration: 22,
          position: { x: '10%', y: '10%', anchor: 'center' },
          transform: { scale: 0.5 },
          style: { opacity: 0.8 }
        });
      }

      // Watermark (throughout)
      if (!watermark.error) {
        finalTimeline = finalTimeline.addImage(watermark.localPath, {
          startTime: 0,
          duration: 22,
          position: { x: '90%', y: '95%', anchor: 'center' },
          transform: { scale: 0.5 },
          style: { opacity: 0.5 }
        });
      }

      // Add all subtitles
      fullSubtitles.forEach(subtitle => {
        finalTimeline = finalTimeline.addText(subtitle.text, {
          startTime: subtitle.startTime,
          duration: subtitle.endTime - subtitle.startTime,
          position: { x: '50%', y: '85%', anchor: 'center' },
          style: {
            fontSize: 42,
            color: '#FFFFFF',
            backgroundColor: 'rgba(0,0,0,0.7)',
            padding: '10px 30px',
            borderRadius: '5px'
          }
        });
      });

      // Generate final command
      const finalCommand = finalTimeline.getCommand('complete-video-package.mp4');
      expect(finalCommand).toBeTruthy();

      // Create a summary file
      const summary = {
        totalDuration: 22,
        sections: 3,
        subtitles: fullSubtitles.length,
        assets: assetUrls.length,
        createdAt: new Date().toISOString()
      };

      await fs.writeFile(
        join(packageDir, 'package-summary.json'),
        JSON.stringify(summary, null, 2),
        'utf-8'
      );

      console.log('Created complete video package:', summary);
    });
  });
});
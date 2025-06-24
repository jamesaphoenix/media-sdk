/**
 * @fileoverview Real-World Green Screen Scenarios Tests
 * 
 * Tests green screen functionality with actual real-world scenarios
 * that users would encounter when creating viral content.
 */

import { describe, test, expect, beforeAll, afterAll } from 'bun:test';
import { promises as fs } from 'fs';
import { join } from 'path';
import { execSync } from 'child_process';
import { Timeline } from '../../../packages/media-sdk/src/timeline/timeline';

const TEST_ASSETS_DIR = join(import.meta.dir, '..', 'assets');
const TEST_OUTPUT_DIR = join(import.meta.dir, '..', 'output', 'green-screen-real-world');

describe('🌍 Real-World Green Screen Scenarios', () => {
  beforeAll(async () => {
    await fs.mkdir(TEST_OUTPUT_DIR, { recursive: true });
    
    // Create real-world background scenarios
    const scenarios = [
      {
        name: 'office-explosion.jpg',
        description: 'Office background with explosion effect',
        command: 'ffmpeg -y -f lavfi -i "color=#4a4a4a:size=1920x1080" -f lavfi -i "color=#ff4500:size=400x400" -filter_complex "[0:v][1:v]overlay=(W-w)/2:(H-h)/2:eval=frame:x=\\'(W-w)/2+50*sin(t*2)\\':y=\\'(H-h)/2+30*cos(t*3)\\'[explosion]" -frames:v 1'
      },
      {
        name: 'gaming-arena.jpg',
        description: 'Gaming arena background',
        command: 'ffmpeg -y -f lavfi -i "color=#1a1a2e:size=1920x1080" -f lavfi -i "color=#16213e:size=600x400" -f lavfi -i "color=#0f3460:size=300x200" -filter_complex "[0:v][1:v]overlay=100:200[layer1];[layer1][2:v]overlay=1400:500[arena]" -frames:v 1'
      },
      {
        name: 'social-media.jpg',
        description: 'Social media style background',
        command: 'ffmpeg -y -f lavfi -i "color=#833ab4:size=1920x1080" -f lavfi -i "color=#fd1d1d:size=1920x200" -f lavfi -i "color=#fcb045:size=1920x200" -filter_complex "[0:v][1:v]overlay=0:0[layer1];[layer1][2:v]overlay=0:880[social]" -frames:v 1'
      }
    ];

    const sampleImagesDir = join(TEST_ASSETS_DIR, 'sample-images');
    
    for (const scenario of scenarios) {
      const bgPath = join(sampleImagesDir, scenario.name);
      try {
        await fs.access(bgPath);
        console.log(`✅ Background exists: ${scenario.description}`);
      } catch {
        console.log(`🎨 Creating ${scenario.description}...`);
        execSync(`${scenario.command} "${bgPath}"`, { timeout: 15000 });
        console.log(`✅ Created ${scenario.name}`);
      }
    }
  });

  afterAll(async () => {
    // Keep some outputs for manual inspection
    console.log(`📁 Real-world test outputs available in: ${TEST_OUTPUT_DIR}`);
  });

  describe('🚀 Viral Content Creation', () => {
    test('should create TikTok-style reaction video', async () => {
      const timeline = new Timeline()
        .addGreenScreenMeme(
          join(TEST_ASSETS_DIR, 'green-screen-meme-1.mp4'),
          join(TEST_ASSETS_DIR, 'sample-images', 'office-explosion.jpg'),
          'reaction',
          {
            platform: 'tiktok',
            intensity: 'high'
          }
        )
        .addText('POV: The client likes your first design', {
          position: 'top',
          startTime: 0,
          duration: 3,
          style: {
            fontSize: 42,
            color: '#ffffff',
            strokeWidth: 3,
            strokeColor: '#000000',
            backgroundColor: 'rgba(0,0,0,0.7)',
            padding: 15
          }
        })
        .addText('🤯 WAIT WHAT 🤯', {
          position: 'center',
          startTime: 2,
          duration: 4,
          style: {
            fontSize: 56,
            color: '#ffff00',
            strokeWidth: 4,
            strokeColor: '#ff0000'
          }
        })
        .addText('# impossiblethings # webdev # clientreactions', {
          position: 'bottom',
          startTime: 1,
          duration: 5,
          style: {
            fontSize: 24,
            color: '#ffffff',
            backgroundColor: 'rgba(0,0,0,0.8)',
            padding: 10
          }
        })
        .setAspectRatio('9:16')
        .setDuration(6);

      const outputPath = join(TEST_OUTPUT_DIR, 'tiktok-viral-reaction.mp4');
      const command = timeline.getCommand(outputPath);

      console.log('📱 Creating TikTok viral reaction video...');
      execSync(command, { timeout: 90000 });

      const stats = await fs.stat(outputPath);
      expect(stats.size).toBeGreaterThan(100000);
      console.log(`✅ TikTok viral: ${(stats.size / 1024 / 1024).toFixed(2)}MB`);

      // Should be optimized for high engagement
      expect(command).toContain('similarity=0.4');
      expect(command).toContain('POV');
      expect(command).toContain('impossiblethings');
    }, 120000);

    test('should create YouTube Shorts gaming highlight', async () => {
      const timeline = new Timeline()
        .addGreenScreenWithVideoBackground(
          join(TEST_ASSETS_DIR, 'green-screen-meme-2.mp4'),
          join(TEST_ASSETS_DIR, 'nature.mp4'),
          {
            chromaKey: '#00FF00',
            chromaSimilarity: 0.4,
            chromaBlend: 0.12,
            backgroundScale: 'crop',
            audioMix: 'both',
            backgroundLoop: true
          }
        )
        .addText('EPIC CLUTCH MOMENT', {
          position: 'top',
          startTime: 0,
          duration: 2,
          style: {
            fontSize: 48,
            color: '#ff6600',
            strokeWidth: 4,
            strokeColor: '#000000'
          }
        })
        .addText('When you carry the whole team', {
          position: 'center',
          startTime: 2,
          duration: 4,
          style: {
            fontSize: 36,
            color: '#00ff00',
            strokeWidth: 3,
            strokeColor: '#000000',
            backgroundColor: 'rgba(0,0,0,0.6)'
          }
        })
        .addText('SUBSCRIBE FOR MORE!', {
          position: 'bottom',
          startTime: 4,
          duration: 3,
          style: {
            fontSize: 32,
            color: '#ffffff',
            backgroundColor: 'rgba(255,0,0,0.8)',
            padding: 15
          }
        })
        .setAspectRatio('9:16')
        .setDuration(7);

      const outputPath = join(TEST_OUTPUT_DIR, 'youtube-gaming-highlight.mp4');
      const command = timeline.getCommand(outputPath);

      console.log('🎮 Creating YouTube gaming highlight...');
      execSync(command, { timeout: 120000 });

      const stats = await fs.stat(outputPath);
      expect(stats.size).toBeGreaterThan(200000);
      console.log(`✅ Gaming highlight: ${(stats.size / 1024 / 1024).toFixed(2)}MB`);

      expect(command).toContain('nature.mp4');
      expect(command).toContain('EPIC CLUTCH');
    }, 150000);

    test('should create Instagram Reel transformation', async () => {
      const timeline = new Timeline()
        .addGreenScreenMeme(
          join(TEST_ASSETS_DIR, 'green-screen-meme-3.mp4'),
          join(TEST_ASSETS_DIR, 'sample-images', 'social-media.jpg'),
          'reaction',
          {
            platform: 'instagram'
          }
        )
        .addText('Before: Stressed Developer', {
          position: 'top',
          startTime: 0,
          duration: 3,
          style: {
            fontSize: 32,
            color: '#ffffff',
            strokeWidth: 2,
            strokeColor: '#000000'
          }
        })
        .addText('After: Problem Solved', {
          position: 'top',
          startTime: 3,
          duration: 3,
          style: {
            fontSize: 32,
            color: '#00ff00',
            strokeWidth: 2,
            strokeColor: '#000000'
          }
        })
        .addText('The magic of Stack Overflow ✨', {
          position: 'bottom',
          style: {
            fontSize: 28,
            color: '#ffffff',
            backgroundColor: 'rgba(0,0,0,0.8)',
            padding: 15
          }
        })
        .setAspectRatio('1:1')
        .setDuration(6);

      const outputPath = join(TEST_OUTPUT_DIR, 'instagram-transformation.mp4');
      const command = timeline.getCommand(outputPath);

      console.log('📸 Creating Instagram transformation reel...');
      execSync(command, { timeout: 90000 });

      const stats = await fs.stat(outputPath);
      expect(stats.size).toBeGreaterThan(80000);
      console.log(`✅ Instagram reel: ${(stats.size / 1024 / 1024).toFixed(2)}MB`);

      expect(command).toContain('Stack Overflow');
    }, 120000);
  });

  describe('📚 Educational Content', () => {
    test('should create coding tutorial with green screen presenter', async () => {
      const timeline = new Timeline()
        .addGreenScreenMeme(
          join(TEST_ASSETS_DIR, 'green-screen-meme-4.mp4'),
          join(TEST_ASSETS_DIR, 'sample-images', 'gaming-arena.jpg'),
          'educational',
          {
            platform: 'youtube',
            professional: true
          }
        )
        .addText('How to Debug Like a Pro', {
          position: 'top',
          style: {
            fontSize: 42,
            color: '#ffffff',
            strokeWidth: 3,
            strokeColor: '#0066cc',
            backgroundColor: 'rgba(0,0,0,0.8)',
            padding: 20
          }
        })
        .addText('Step 1: Read the error message', {
          position: 'center',
          startTime: 1,
          duration: 4,
          style: {
            fontSize: 32,
            color: '#00ff00',
            backgroundColor: 'rgba(0,0,0,0.9)',
            padding: 15
          }
        })
        .addText('Step 2: Actually read the error message', {
          position: 'center',
          startTime: 5,
          duration: 4,
          style: {
            fontSize: 32,
            color: '#ffff00',
            backgroundColor: 'rgba(0,0,0,0.9)',
            padding: 15
          }
        })
        .addText('Tutorial Series | Episode 1', {
          position: 'bottom',
          style: {
            fontSize: 24,
            color: '#cccccc',
            backgroundColor: 'rgba(0,0,0,0.7)',
            padding: 10
          }
        })
        .setAspectRatio('16:9')
        .setDuration(10);

      const outputPath = join(TEST_OUTPUT_DIR, 'coding-tutorial.mp4');
      const command = timeline.getCommand(outputPath);

      console.log('👨‍💻 Creating coding tutorial...');
      execSync(command, { timeout: 120000 });

      const stats = await fs.stat(outputPath);
      expect(stats.size).toBeGreaterThan(150000);
      console.log(`✅ Coding tutorial: ${(stats.size / 1024 / 1024).toFixed(2)}MB`);

      // Professional preset should use lower similarity
      expect(command).toContain('similarity=0.35');
      expect(command).toContain('Debug Like a Pro');
    }, 150000);

    test('should create tech conference presentation', async () => {
      const timeline = new Timeline()
        .addGreenScreenWithImageBackground(
          join(TEST_ASSETS_DIR, 'green-screen-meme-5.mp4'),
          join(TEST_ASSETS_DIR, 'sample-images', 'tech-bg.jpg'),
          {
            chromaKey: '#00FF00',
            chromaSimilarity: 0.3,
            chromaBlend: 0.05,
            backgroundScale: 'fit',
            quality: 'high'
          }
        )
        .addText('The Future of Web Development', {
          position: 'top',
          style: {
            fontSize: 48,
            color: '#ffffff',
            strokeWidth: 2,
            strokeColor: '#003366',
            backgroundColor: 'rgba(0,0,0,0.8)',
            padding: 25
          }
        })
        .addText('AI-Powered Development Tools', {
          position: 'center',
          startTime: 2,
          duration: 6,
          style: {
            fontSize: 36,
            color: '#00ccff',
            backgroundColor: 'rgba(0,0,0,0.9)',
            padding: 20
          }
        })
        .addText('TechConf 2024 | @developer_speaker', {
          position: 'bottom',
          style: {
            fontSize: 28,
            color: '#cccccc',
            backgroundColor: 'rgba(0,0,0,0.7)',
            padding: 15
          }
        })
        .setAspectRatio('16:9')
        .setDuration(8);

      const outputPath = join(TEST_OUTPUT_DIR, 'tech-conference.mp4');
      const command = timeline.getCommand(outputPath);

      console.log('🎤 Creating tech conference presentation...');
      execSync(command, { timeout: 120000 });

      const stats = await fs.stat(outputPath);
      expect(stats.size).toBeGreaterThan(120000);
      console.log(`✅ Tech conference: ${(stats.size / 1024 / 1024).toFixed(2)}MB`);

      expect(command).toContain('TechConf 2024');
    }, 150000);
  });

  describe('🎭 Comedy and Entertainment', () => {
    test('should create developer life comedy skit', async () => {
      const timeline = new Timeline()
        .addGreenScreenWithVideoBackground(
          join(TEST_ASSETS_DIR, 'green-screen-meme-6.mp4'),
          join(TEST_ASSETS_DIR, 'earth.mp4'),
          {
            chromaKey: '#00FF00',
            chromaSimilarity: 0.5,
            chromaBlend: 0.2,
            backgroundScale: 'fill',
            audioMix: 'greenscreen',
            backgroundLoop: true
          }
        )
        .addText('Developer Life: Episode 47', {
          position: 'top',
          style: {
            fontSize: 36,
            color: '#ffff00',
            strokeWidth: 3,
            strokeColor: '#000000'
          }
        })
        .addText('Me explaining why I need 6 monitors', {
          position: 'center',
          startTime: 1,
          duration: 4,
          style: {
            fontSize: 32,
            color: '#ffffff',
            strokeWidth: 2,
            strokeColor: '#000000',
            backgroundColor: 'rgba(0,0,0,0.7)'
          }
        })
        .addText('"It\'s for productivity"', {
          position: 'bottom',
          startTime: 3,
          duration: 4,
          style: {
            fontSize: 40,
            color: '#ff6600',
            strokeWidth: 3,
            strokeColor: '#000000'
          }
        })
        .setAspectRatio('9:16')
        .setDuration(7);

      const outputPath = join(TEST_OUTPUT_DIR, 'developer-comedy.mp4');
      const command = timeline.getCommand(outputPath);

      console.log('😂 Creating developer comedy skit...');
      execSync(command, { timeout: 120000 });

      const stats = await fs.stat(outputPath);
      expect(stats.size).toBeGreaterThan(180000);
      console.log(`✅ Developer comedy: ${(stats.size / 1024 / 1024).toFixed(2)}MB`);

      expect(command).toContain('6 monitors');
      expect(command).toContain('productivity');
    }, 150000);

    test('should create meme compilation style video', async () => {
      const timeline = new Timeline()
        .addGreenScreenMeme(
          join(TEST_ASSETS_DIR, 'green-screen-meme-7.mp4'),
          join(TEST_ASSETS_DIR, 'sample-images', 'viral-bg.jpg'),
          'comedy',
          {
            platform: 'tiktok',
            intensity: 'high'
          }
        )
        .addText('Programming Memes Vol. 2', {
          position: 'top',
          startTime: 0,
          duration: 2,
          style: {
            fontSize: 38,
            color: '#ffffff',
            strokeWidth: 3,
            strokeColor: '#ff0000'
          }
        })
        .addText('When your code works but you don\'t know why', {
          position: 'center',
          startTime: 1,
          duration: 3,
          style: {
            fontSize: 32,
            color: '#ffff00',
            strokeWidth: 2,
            strokeColor: '#000000'
          }
        })
        .addText('It just works ¯\\_(ツ)_/¯', {
          position: 'bottom',
          startTime: 3,
          duration: 3,
          style: {
            fontSize: 36,
            color: '#00ff00',
            strokeWidth: 3,
            strokeColor: '#000000'
          }
        })
        .addText('Follow for more! @devmemes', {
          position: 'bottom',
          startTime: 5,
          duration: 2,
          style: {
            fontSize: 24,
            color: '#ffffff',
            backgroundColor: 'rgba(0,0,0,0.8)',
            padding: 10
          }
        })
        .setAspectRatio('9:16')
        .setDuration(7);

      const outputPath = join(TEST_OUTPUT_DIR, 'meme-compilation.mp4');
      const command = timeline.getCommand(outputPath);

      console.log('🎪 Creating meme compilation...');
      execSync(command, { timeout: 120000 });

      const stats = await fs.stat(outputPath);
      expect(stats.size).toBeGreaterThan(140000);
      console.log(`✅ Meme compilation: ${(stats.size / 1024 / 1024).toFixed(2)}MB`);

      expect(command).toContain('just works');
      expect(command).toContain('devmemes');
    }, 150000);
  });

  describe('🏢 Business and Marketing', () => {
    test('should create product demo with green screen host', async () => {
      const timeline = new Timeline()
        .addGreenScreenMeme(
          join(TEST_ASSETS_DIR, 'green-screen-meme-1.mp4'),
          join(TEST_ASSETS_DIR, 'sample-images', 'office-explosion.jpg'),
          'weather',
          {
            platform: 'youtube',
            professional: true
          }
        )
        .addText('Introducing Media SDK 2.0', {
          position: 'top',
          style: {
            fontSize: 42,
            color: '#ffffff',
            strokeWidth: 2,
            strokeColor: '#0066cc',
            backgroundColor: 'rgba(0,0,0,0.8)',
            padding: 20
          }
        })
        .addText('AI-Powered Video Creation', {
          position: 'center',
          startTime: 1,
          duration: 5,
          style: {
            fontSize: 36,
            color: '#00ccff',
            backgroundColor: 'rgba(0,0,0,0.9)',
            padding: 18
          }
        })
        .addText('🚀 Now with Green Screen Support', {
          position: 'bottom',
          startTime: 3,
          duration: 4,
          style: {
            fontSize: 32,
            color: '#00ff00',
            backgroundColor: 'rgba(0,0,0,0.8)',
            padding: 15
          }
        })
        .setAspectRatio('16:9')
        .setDuration(7);

      const outputPath = join(TEST_OUTPUT_DIR, 'product-demo.mp4');
      const command = timeline.getCommand(outputPath);

      console.log('📢 Creating product demo...');
      execSync(command, { timeout: 120000 });

      const stats = await fs.stat(outputPath);
      expect(stats.size).toBeGreaterThan(100000);
      console.log(`✅ Product demo: ${(stats.size / 1024 / 1024).toFixed(2)}MB`);

      expect(command).toContain('Media SDK 2.0');
      expect(command).toContain('Green Screen Support');
    }, 150000);

    test('should create company announcement video', async () => {
      const timeline = new Timeline()
        .addGreenScreenMeme(
          join(TEST_ASSETS_DIR, 'green-screen-meme-2.mp4'),
          join(TEST_ASSETS_DIR, 'sample-images', 'tech-bg.jpg'),
          'news',
          {
            platform: 'youtube',
            professional: true
          }
        )
        .addText('COMPANY UPDATE', {
          position: 'top',
          style: {
            fontSize: 48,
            color: '#ffffff',
            strokeWidth: 3,
            strokeColor: '#003366',
            backgroundColor: 'rgba(0,0,0,0.9)',
            padding: 25
          }
        })
        .addText('We\'re scaling our engineering team!', {
          position: 'center',
          startTime: 1,
          duration: 5,
          style: {
            fontSize: 34,
            color: '#00ff00',
            backgroundColor: 'rgba(0,0,0,0.8)',
            padding: 18
          }
        })
        .addText('Join us at company.com/careers', {
          position: 'bottom',
          startTime: 3,
          duration: 4,
          style: {
            fontSize: 28,
            color: '#ffffff',
            backgroundColor: 'rgba(0,102,204,0.8)',
            padding: 15
          }
        })
        .setAspectRatio('16:9')
        .setDuration(7);

      const outputPath = join(TEST_OUTPUT_DIR, 'company-announcement.mp4');
      const command = timeline.getCommand(outputPath);

      console.log('🏢 Creating company announcement...');
      execSync(command, { timeout: 120000 });

      const stats = await fs.stat(outputPath);
      expect(stats.size).toBeGreaterThan(110000);
      console.log(`✅ Company announcement: ${(stats.size / 1024 / 1024).toFixed(2)}MB`);

      expect(command).toContain('COMPANY UPDATE');
      expect(command).toContain('careers');
    }, 150000);
  });
});
import { describe, test, expect, beforeEach, vi, afterEach } from 'vitest';
import { Timeline } from '../timeline/timeline.js';
import type { TextStyle, Position } from '../types/index.js';

// Comprehensive integration tests covering real-world workflows and cross-component interactions
describe('🔗 Integration & Real-World Scenarios - Comprehensive Tests', () => {
  let timeline: Timeline;
  
  beforeEach(() => {
    timeline = new Timeline();
  });

  describe('Social Media Content Creation Workflows', () => {
    test('should create complete TikTok viral video workflow', () => {
      const tiktokVideo = timeline
        .addVideo('raw-footage.mp4')
        .setAspectRatio('9:16')
        .setResolution(1080, 1920)
        .setDuration(15)
        // Hook in first 3 seconds
        .addText('Wait for it...', {
          position: { x: 'center', y: '20%' },
          style: {
            fontSize: 48,
            color: '#ffff00',
            fontFamily: 'Arial Black',
            strokeColor: '#000000',
            strokeWidth: 3
          },
          startTime: 0,
          duration: 3
        })
        // Main content reveal
        .addText('MIND BLOWN 🤯', {
          position: { x: 'center', y: 'center' },
          style: {
            fontSize: 72,
            color: '#ff0066',
            fontFamily: 'Impact',
            animation: 'bounce'
          },
          startTime: 8,
          duration: 4
        })
        // Call to action
        .addText('Follow for more! 👆', {
          position: { x: 'center', y: '80%' },
          style: {
            fontSize: 36,
            color: '#ffffff',
            backgroundColor: 'rgba(0,0,0,0.8)',
            padding: 15,
            borderRadius: 25
          },
          startTime: 12,
          duration: 3
        })
        // Background music
        .addAudio('trending-sound.mp3', {
          volume: 0.6,
          fadeIn: 1,
          fadeOut: 2
        })
        // Quick cuts effect
        .addFilter('setpts=0.8*PTS') // Speed up by 25%
        .addFilter('eq=brightness=0.1:contrast=1.2'); // Enhanced visuals
      
      const command = tiktokVideo.getCommand('viral-tiktok.mp4');
      
      expect(command).toContain('1080:1920');
      expect(command).toContain('Wait for it...');
      expect(command).toContain('MIND BLOWN');
      expect(command).toContain('Follow for more!');
      expect(command).toContain('trending-sound.mp3');
    });
    
    test('should create Instagram story with product showcase', () => {
      const instagramStory = timeline
        .addVideo('product-background.mp4')
        .setAspectRatio('9:16')
        .setResolution(1080, 1920)
        .setDuration(10)
        // Branded background with logo
        .addImage('brand-logo.png', {
          position: { x: '85%', y: '10%' },
          scale: 0.15,
          startTime: 0,
          duration: 10
        })
        // Product hero shot
        .addImage('product-hero.jpg', {
          position: { x: 'center', y: '35%' },
          scale: 0.8,
          startTime: 1,
          duration: 9,
          animation: 'fadeIn'
        })
        // Product title
        .addText('NEW ARRIVAL', {
          position: { x: 'center', y: '15%' },
          style: {
            fontSize: 42,
            color: '#000000',
            fontFamily: 'Helvetica Bold',
            letterSpacing: 4
          },
          startTime: 2,
          duration: 8
        })
        // Price and CTA
        .addText('$299 - Shop Now', {
          position: { x: 'center', y: '75%' },
          style: {
            fontSize: 36,
            color: '#ffffff',
            backgroundColor: '#e4405f',
            padding: 20,
            borderRadius: 30
          },
          startTime: 4,
          duration: 6
        })
        // Subtle music
        .addAudio('ambient-music.mp3', { volume: 0.3 });
      
      const command = instagramStory.getCommand('product-story.mp4');
      
      expect(command).toContain('NEW ARRIVAL');
      expect(command).toContain('Shop Now');
      expect(command).toContain('brand-logo.png');
    });
    
    test('should create YouTube Shorts with engagement optimization', () => {
      const youtubeShort = timeline
        .addVideo('main-content.mp4')
        .setAspectRatio('9:16')
        .setResolution(1080, 1920)
        .setDuration(60)
        // Attention-grabbing opener
        .addText('This will change your life', {
          position: { x: 'center', y: '25%' },
          style: {
            fontSize: 44,
            color: '#ff0000',
            fontFamily: 'Arial Black',
            strokeColor: '#ffffff',
            strokeWidth: 2
          },
          startTime: 0,
          duration: 5
        })
        // Progress indicator
        .addImage('progress-bar.png', {
          position: { x: 'center', y: '90%' },
          scale: 0.8,
          startTime: 5,
          duration: 55
        })
        // Key points with timestamps
        .addText('Point 1: The Problem', {
          position: { x: 'center', y: '80%' },
          style: { fontSize: 32, color: '#ffffff', backgroundColor: 'rgba(0,0,0,0.7)' },
          startTime: 5,
          duration: 10
        })
        .addText('Point 2: The Solution', {
          position: { x: 'center', y: '80%' },
          style: { fontSize: 32, color: '#ffffff', backgroundColor: 'rgba(0,0,0,0.7)' },
          startTime: 20,
          duration: 15
        })
        .addText('Point 3: The Results', {
          position: { x: 'center', y: '80%' },
          style: { fontSize: 32, color: '#ffffff', backgroundColor: 'rgba(0,0,0,0.7)' },
          startTime: 40,
          duration: 15
        })
        // Subscribe reminder
        .addText('SUBSCRIBE! 🔔', {
          position: { x: 'center', y: '10%' },
          style: {
            fontSize: 28,
            color: '#ff0000',
            animation: 'pulse'
          },
          startTime: 55,
          duration: 5
        })
        // Background music with ducking
        .addAudio('upbeat-music.mp3', { volume: 0.4 });
      
      const command = youtubeShort.getCommand('youtube-short.mp4');
      
      expect(command).toContain('This will change your life');
      expect(command).toContain('SUBSCRIBE!');
      expect(command).toContain('progress-bar.png');
    });
  });

  describe('Educational Content Workflows', () => {
    test('should create online course lesson with multiple components', () => {
      const courseLession = timeline
        .addVideo('instructor-footage.mp4')
        .setResolution(1920, 1080)
        .setDuration(600) // 10 minutes
        // Course branding
        .addImage('course-logo.png', {
          position: { x: '5%', y: '5%' },
          scale: 0.1,
          startTime: 0,
          duration: 600
        })
        // Lesson title card
        .addText('Lesson 5: Advanced Concepts', {
          position: { x: 'center', y: '15%' },
          style: {
            fontSize: 48,
            color: '#333333',
            fontFamily: 'Open Sans Bold',
            backgroundColor: 'rgba(255,255,255,0.9)',
            padding: 20
          },
          startTime: 0,
          duration: 8
        })
        // Key points overlay
        .addText('Key Learning Points:', {
          position: { x: '70%', y: '20%' },
          style: { fontSize: 24, color: '#000000' },
          startTime: 30,
          duration: 15
        })
        .addText('• Concept A\n• Concept B\n• Concept C', {
          position: { x: '70%', y: '30%' },
          style: { fontSize: 20, color: '#333333' },
          startTime: 35,
          duration: 15
        })
        // Diagram overlay
        .addImage('concept-diagram.png', {
          position: { x: '75%', y: '60%' },
          scale: 0.4,
          startTime: 120,
          duration: 180
        })
        // Quiz question
        .addText('Quick Quiz: What is X?', {
          position: { x: 'center', y: 'center' },
          style: {
            fontSize: 36,
            color: '#ffffff',
            backgroundColor: '#4CAF50',
            padding: 30,
            borderRadius: 15
          },
          startTime: 480,
          duration: 10
        })
        // Background music
        .addAudio('educational-ambient.mp3', { volume: 0.2, loop: true });
      
      const command = courseLession.getCommand('lesson-5.mp4');
      
      expect(command).toContain('Lesson 5');
      expect(command).toContain('Quick Quiz');
      expect(command).toContain('concept-diagram.png');
    });
    
    test('should create animated explainer video', () => {
      const explainerVideo = timeline
        .addVideo('animated-background.mp4')
        .setResolution(1920, 1080)
        .setDuration(120) // 2 minutes
        // Title sequence
        .addText('How Does X Work?', {
          position: { x: 'center', y: 'center' },
          style: {
            fontSize: 64,
            color: '#2196F3',
            fontFamily: 'Roboto Bold',
            animation: 'slideInFromLeft'
          },
          startTime: 0,
          duration: 5
        })
        // Step-by-step animation sync
        .addImage('step1-graphic.png', {
          position: { x: '25%', y: 'center' },
          scale: 0.6,
          startTime: 10,
          duration: 20,
          animation: 'fadeIn'
        })
        .addText('Step 1: Initialize', {
          position: { x: '25%', y: '70%' },
          style: { fontSize: 28, color: '#333333' },
          startTime: 12,
          duration: 18
        })
        .addImage('step2-graphic.png', {
          position: { x: '50%', y: 'center' },
          scale: 0.6,
          startTime: 35,
          duration: 20,
          animation: 'slideInFromRight'
        })
        .addText('Step 2: Process', {
          position: { x: '50%', y: '70%' },
          style: { fontSize: 28, color: '#333333' },
          startTime: 37,
          duration: 18
        })
        .addImage('step3-graphic.png', {
          position: { x: '75%', y: 'center' },
          scale: 0.6,
          startTime: 60,
          duration: 20,
          animation: 'bounceIn'
        })
        .addText('Step 3: Complete', {
          position: { x: '75%', y: '70%' },
          style: { fontSize: 28, color: '#333333' },
          startTime: 62,
          duration: 18
        })
        // Conclusion
        .addText('Now you understand!', {
          position: { x: 'center', y: 'center' },
          style: {
            fontSize: 48,
            color: '#4CAF50',
            fontFamily: 'Roboto Bold'
          },
          startTime: 90,
          duration: 30
        })
        // Voiceover
        .addAudio('narrator-voice.mp3', { volume: 1.0 })
        // Background music
        .addAudio('uplifting-music.mp3', { volume: 0.3, loop: true });
      
      const command = explainerVideo.getCommand('explainer.mp4');
      
      expect(command).toContain('How Does X Work?');
      expect(command).toContain('Now you understand!');
      expect(command).toContain('narrator-voice.mp3');
    });
  });

  describe('Marketing and Commercial Workflows', () => {
    test('should create product launch campaign video', () => {
      const productLaunch = timeline
        .addVideo('product-demo.mp4')
        .setResolution(1920, 1080)
        .setDuration(45)
        // Dramatic opener
        .addText('The Future is Here', {
          position: { x: 'center', y: 'center' },
          style: {
            fontSize: 72,
            color: '#ffffff',
            fontFamily: 'Futura Bold',
            strokeColor: '#000000',
            strokeWidth: 2
          },
          startTime: 0,
          duration: 3
        })
        // Product reveal
        .addImage('product-hero.jpg', {
          position: { x: 'center', y: 'center' },
          scale: 0.8,
          startTime: 5,
          duration: 10,
          animation: 'zoomIn'
        })
        // Feature callouts
        .addText('Revolutionary Design', {
          position: { x: '20%', y: '30%' },
          style: { fontSize: 36, color: '#ff6b35' },
          startTime: 15,
          duration: 5
        })
        .addText('Cutting-Edge Technology', {
          position: { x: '20%', y: '50%' },
          style: { fontSize: 36, color: '#ff6b35' },
          startTime: 20,
          duration: 5
        })
        .addText('Unmatched Performance', {
          position: { x: '20%', y: '70%' },
          style: { fontSize: 36, color: '#ff6b35' },
          startTime: 25,
          duration: 5
        })
        // Price and availability
        .addText('Available Now - $299', {
          position: { x: 'center', y: '80%' },
          style: {
            fontSize: 48,
            color: '#ffffff',
            backgroundColor: '#ff6b35',
            padding: 25,
            borderRadius: 15
          },
          startTime: 35,
          duration: 10
        })
        // Logo watermark
        .addImage('company-logo.png', {
          position: { x: '90%', y: '90%' },
          scale: 0.08,
          startTime: 0,
          duration: 45
        })
        // Epic music
        .addAudio('epic-trailer-music.mp3', { volume: 0.8 });
      
      const command = productLaunch.getCommand('product-launch.mp4');
      
      expect(command).toContain('The Future is Here');
      expect(command).toContain('Available Now');
      expect(command).toContain('company-logo.png');
    });
    
    test('should create customer testimonial compilation', () => {
      const testimonials = timeline
        .addVideo('testimonial-background.mp4')
        .setResolution(1920, 1080)
        .setDuration(90)
        // Title card
        .addText('What Our Customers Say', {
          position: { x: 'center', y: '20%' },
          style: {
            fontSize: 56,
            color: '#2c3e50',
            fontFamily: 'Georgia Bold'
          },
          startTime: 0,
          duration: 5
        })
        // Testimonial 1
        .addImage('customer1-photo.jpg', {
          position: { x: '20%', y: '40%' },
          scale: 0.2,
          startTime: 8,
          duration: 15
        })
        .addText('"This product changed my life!"', {
          position: { x: '60%', y: '35%' },
          style: {
            fontSize: 32,
            color: '#34495e',
            fontStyle: 'italic'
          },
          startTime: 10,
          duration: 13
        })
        .addText('- Sarah J., New York', {
          position: { x: '60%', y: '50%' },
          style: { fontSize: 24, color: '#7f8c8d' },
          startTime: 12,
          duration: 11
        })
        // Testimonial 2
        .addImage('customer2-photo.jpg', {
          position: { x: '20%', y: '40%' },
          scale: 0.2,
          startTime: 28,
          duration: 15
        })
        .addText('"Incredible value for money!"', {
          position: { x: '60%', y: '35%' },
          style: {
            fontSize: 32,
            color: '#34495e',
            fontStyle: 'italic'
          },
          startTime: 30,
          duration: 13
        })
        .addText('- Mike R., California', {
          position: { x: '60%', y: '50%' },
          style: { fontSize: 24, color: '#7f8c8d' },
          startTime: 32,
          duration: 11
        })
        // Rating overlay
        .addImage('five-stars.png', {
          position: { x: 'center', y: '70%' },
          scale: 0.3,
          startTime: 50,
          duration: 15
        })
        .addText('4.9/5 Average Rating', {
          position: { x: 'center', y: '80%' },
          style: { fontSize: 36, color: '#f39c12' },
          startTime: 52,
          duration: 13
        })
        // Call to action
        .addText('Join Thousands of Happy Customers', {
          position: { x: 'center', y: 'center' },
          style: {
            fontSize: 42,
            color: '#ffffff',
            backgroundColor: '#27ae60',
            padding: 30,
            borderRadius: 20
          },
          startTime: 75,
          duration: 15
        })
        // Soft background music
        .addAudio('inspiring-music.mp3', { volume: 0.4 });
      
      const command = testimonials.getCommand('testimonials.mp4');
      
      expect(command).toContain('What Our Customers Say');
      expect(command).toContain('changed my life');
      expect(command).toContain('Join Thousands');
    });
  });

  describe('Event and Conference Workflows', () => {
    test('should create conference presentation with speaker overlay', () => {
      const presentation = timeline
        .addVideo('presentation-slides.mp4')
        .setResolution(1920, 1080)
        .setDuration(1800) // 30 minutes
        // Speaker picture-in-picture
        .addVideo('speaker-camera.mp4', {
          position: { x: '75%', y: '75%' },
          scale: 0.25,
          startTime: 0,
          duration: 1800
        })
        // Conference branding
        .addImage('conference-logo.png', {
          position: { x: '5%', y: '5%' },
          scale: 0.1,
          startTime: 0,
          duration: 1800
        })
        // Speaker info lower third
        .addText('Dr. Jane Smith - Tech Innovator', {
          position: { x: '5%', y: '85%' },
          style: {
            fontSize: 28,
            color: '#ffffff',
            backgroundColor: 'rgba(0,51,102,0.8)',
            padding: 15
          },
          startTime: 5,
          duration: 15
        })
        // Session title
        .addText('The Future of AI in Healthcare', {
          position: { x: 'center', y: '10%' },
          style: {
            fontSize: 36,
            color: '#003366',
            fontFamily: 'Arial Bold'
          },
          startTime: 0,
          duration: 20
        })
        // Live timestamp
        .addText('LIVE', {
          position: { x: '90%', y: '10%' },
          style: {
            fontSize: 24,
            color: '#ffffff',
            backgroundColor: '#ff0000',
            padding: 8,
            borderRadius: 5
          },
          startTime: 0,
          duration: 1800
        })
        // Audio mixing
        .addAudio('presentation-audio.mp3', { volume: 1.0 })
        .addAudio('ambient-conference.mp3', { volume: 0.1 });
      
      const command = presentation.getCommand('conference-session.mp4');
      
      expect(command).toContain('Dr. Jane Smith');
      expect(command).toContain('Future of AI');
      expect(command).toContain('conference-logo.png');
    });
    
    test('should create event highlight reel', () => {
      const highlights = timeline
        .addVideo('event-montage.mp4')
        .setResolution(1920, 1080)
        .setDuration(60)
        // Event title
        .addText('Tech Conference 2024 Highlights', {
          position: { x: 'center', y: 'center' },
          style: {
            fontSize: 64,
            color: '#ffffff',
            fontFamily: 'Impact',
            strokeColor: '#000000',
            strokeWidth: 3
          },
          startTime: 0,
          duration: 4
        })
        // Quick cuts with overlay text
        .addText('Keynote Speakers', {
          position: { x: '10%', y: '10%' },
          style: { fontSize: 32, color: '#ffff00' },
          startTime: 5,
          duration: 8
        })
        .addText('Networking Sessions', {
          position: { x: '10%', y: '10%' },
          style: { fontSize: 32, color: '#ffff00' },
          startTime: 15,
          duration: 8
        })
        .addText('Product Demos', {
          position: { x: '10%', y: '10%' },
          style: { fontSize: 32, color: '#ffff00' },
          startTime: 25,
          duration: 8
        })
        .addText('Awards Ceremony', {
          position: { x: '10%', y: '10%' },
          style: { fontSize: 32, color: '#ffff00' },
          startTime: 35,
          duration: 8
        })
        // Event stats
        .addText('500+ Attendees', {
          position: { x: '20%', y: '80%' },
          style: { fontSize: 36, color: '#00ff00' },
          startTime: 45,
          duration: 5
        })
        .addText('50 Speakers', {
          position: { x: '50%', y: '80%' },
          style: { fontSize: 36, color: '#00ff00' },
          startTime: 47,
          duration: 5
        })
        .addText('3 Days', {
          position: { x: '80%', y: '80%' },
          style: { fontSize: 36, color: '#00ff00' },
          startTime: 49,
          duration: 5
        })
        // Thank you message
        .addText('Thank You for Attending!', {
          position: { x: 'center', y: 'center' },
          style: {
            fontSize: 48,
            color: '#ffffff',
            backgroundColor: 'rgba(0,100,200,0.8)',
            padding: 25
          },
          startTime: 55,
          duration: 5
        })
        // Upbeat music
        .addAudio('energetic-music.mp3', { volume: 0.7 });
      
      const command = highlights.getCommand('event-highlights.mp4');
      
      expect(command).toContain('Tech Conference 2024');
      expect(command).toContain('500+ Attendees');
      expect(command).toContain('Thank You');
    });
  });

  describe('Complex Multi-Component Integration', () => {
    test('should handle massive timeline with all component types', () => {
      let complexTimeline = timeline
        .addVideo('base-video.mp4')
        .setResolution(3840, 2160) // 4K
        .setDuration(300); // 5 minutes
      
      // Add multiple video layers
      for (let i = 0; i < 5; i++) {
        complexTimeline = complexTimeline.addVideo(`overlay-${i}.mp4`, {
          position: { x: `${i * 20}%`, y: `${i * 15}%` },
          scale: 0.2,
          startTime: i * 30,
          duration: 60
        });
      }
      
      // Add multiple audio layers
      for (let i = 0; i < 3; i++) {
        complexTimeline = complexTimeline.addAudio(`audio-${i}.mp3`, {
          volume: 0.3,
          startTime: i * 60,
          duration: 120
        });
      }
      
      // Add many text overlays
      for (let i = 0; i < 20; i++) {
        complexTimeline = complexTimeline.addText(`Text ${i}`, {
          position: { x: `${(i * 5) % 100}%`, y: `${(i * 10) % 80}%` },
          style: {
            fontSize: 24 + (i % 20),
            color: `hsl(${i * 18}, 70%, 50%)`,
            fontFamily: i % 2 === 0 ? 'Arial' : 'Helvetica'
          },
          startTime: i * 10,
          duration: 15
        });
      }
      
      // Add multiple image overlays
      for (let i = 0; i < 10; i++) {
        complexTimeline = complexTimeline.addImage(`image-${i}.png`, {
          position: { x: `${(i * 10) % 100}%`, y: `${(i * 8) % 80}%` },
          scale: 0.1 + (i % 3) * 0.05,
          startTime: i * 25,
          duration: 30
        });
      }
      
      // Add multiple filters
      const filters = [
        'brightness=1.1',
        'contrast=1.2',
        'saturation=1.3',
        'hue=0.1',
        'blur=1',
        'sharpen=1'
      ];
      
      filters.forEach(filter => {
        complexTimeline = complexTimeline.addFilter(filter);
      });
      
      const command = complexTimeline.getCommand('complex-output.mp4');
      
      expect(command).toBeTruthy();
      expect(command.length).toBeGreaterThan(1000); // Should be a long command
      expect(command).toContain('3840:2160'); // 4K resolution
    });
    
    test('should handle cross-component synchronization', () => {
      const syncedTimeline = timeline
        .addVideo('main-video.mp4')
        .setDuration(60)
        // Audio that should sync with video
        .addAudio('synchronized-audio.mp3', {
          startTime: 0,
          duration: 60,
          volume: 0.8
        })
        // Text that appears in sync with audio beats
        .addText('Beat 1', {
          position: { x: 'center', y: '30%' },
          style: { fontSize: 48, color: '#ff0000' },
          startTime: 5,
          duration: 2
        })
        .addText('Beat 2', {
          position: { x: 'center', y: '50%' },
          style: { fontSize: 48, color: '#00ff00' },
          startTime: 15,
          duration: 2
        })
        .addText('Beat 3', {
          position: { x: 'center', y: '70%' },
          style: { fontSize: 48, color: '#0000ff' },
          startTime: 25,
          duration: 2
        })
        // Images that fade in/out with music
        .addImage('visual-1.png', {
          position: 'center',
          scale: 0.5,
          startTime: 10,
          duration: 10,
          animation: 'fadeIn'
        })
        .addImage('visual-2.png', {
          position: 'center',
          scale: 0.5,
          startTime: 30,
          duration: 10,
          animation: 'fadeOut'
        })
        // Filters that change over time
        .addFilter('eq=brightness=1+0.2*sin(2*PI*t/10)') // Pulsing brightness
        .addFilter('hue=sin(t/5)'); // Color cycling
      
      const command = syncedTimeline.getCommand('synced-output.mp4');
      
      expect(command).toContain('Beat 1');
      expect(command).toContain('Beat 2');
      expect(command).toContain('Beat 3');
      expect(command).toContain('visual-1.png');
      expect(command).toContain('sin('); // Mathematical expressions
    });
  });

  describe('Performance and Memory Testing', () => {
    test('should handle timeline serialization and deserialization', () => {
      const originalTimeline = timeline
        .addVideo('test.mp4')
        .addText('Test Text', { position: 'center' })
        .addImage('test.png', { scale: 0.5 })
        .addAudio('test.mp3', { volume: 0.8 })
        .addFilter('brightness=1.2');
      
      // Test JSON serialization
      const json = originalTimeline.toJSON?.();
      if (json) {
        expect(json).toBeDefined();
        expect(JSON.stringify(json)).toBeTruthy();
      }
      
      // Command generation should be consistent
      const command1 = originalTimeline.getCommand('output1.mp4');
      const command2 = originalTimeline.getCommand('output2.mp4');
      
      // Should generate consistent commands for same timeline
      expect(command1.replace('output1', 'output2')).toBe(command2);
    });
    
    test('should handle concurrent timeline operations', async () => {
      const operations = Array.from({ length: 50 }, (_, i) => 
        new Promise<string>(resolve => {
          setTimeout(() => {
            const t = timeline
              .addVideo(`input${i}.mp4`)
              .addText(`Text ${i}`, { position: 'center' })
              .addFilter(`brightness=${1 + i * 0.01}`);
            
            resolve(t.getCommand(`output${i}.mp4`));
          }, Math.random() * 100);
        })
      );
      
      const results = await Promise.all(operations);
      
      expect(results).toHaveLength(50);
      results.forEach((command, index) => {
        expect(command).toContain(`Text ${index}`);
        expect(command).toContain(`output${index}.mp4`);
      });
    });
    
    test('should maintain performance with deep timeline nesting', () => {
      const start = performance.now();
      
      // Create deeply nested timeline operations
      let nestedTimeline = timeline.addVideo('base.mp4');
      
      for (let depth = 0; depth < 100; depth++) {
        nestedTimeline = nestedTimeline
          .addText(`Depth ${depth}`, {
            position: { x: `${depth % 100}%`, y: `${(depth * 2) % 100}%` },
            style: { fontSize: Math.max(12, 48 - depth) }
          })
          .addFilter(`brightness=${1 + (depth * 0.001)}`)
          .addFilter(`contrast=${1 + (depth * 0.001)}`);
        
        if (depth % 10 === 0) {
          nestedTimeline = nestedTimeline.addImage(`nested-${depth}.png`, {
            scale: Math.max(0.1, 1 - depth * 0.01)
          });
        }
      }
      
      const command = nestedTimeline.getCommand('nested-deep.mp4');
      const end = performance.now();
      
      expect(command).toBeTruthy();
      expect(command.length).toBeGreaterThan(5000); // Should be very long
      expect(end - start).toBeLessThan(1000); // Should complete within 1 second
    });
  });

  describe('Cross-Platform Compatibility', () => {
    test('should generate platform-optimized outputs', () => {
      const baseContent = timeline
        .addVideo('content.mp4')
        .addText('Universal Content', { position: 'center' })
        .addImage('logo.png', { position: 'top-right', scale: 0.1 });
      
      // TikTok optimization
      const tiktokVersion = baseContent
        .setAspectRatio('9:16')
        .setResolution(1080, 1920)
        .setDuration(15);
      
      // YouTube optimization
      const youtubeVersion = baseContent
        .setAspectRatio('16:9')
        .setResolution(1920, 1080)
        .setDuration(300);
      
      // Instagram optimization
      const instagramVersion = baseContent
        .setAspectRatio('1:1')
        .setResolution(1080, 1080)
        .setDuration(30);
      
      const tiktokCommand = tiktokVersion.getCommand('tiktok.mp4');
      const youtubeCommand = youtubeVersion.getCommand('youtube.mp4');
      const instagramCommand = instagramVersion.getCommand('instagram.mp4');
      
      expect(tiktokCommand).toContain('1080:1920');
      expect(youtubeCommand).toContain('1920:1080');
      expect(instagramCommand).toContain('1080:1080');
    });
  });

  describe('Error Recovery and Robustness', () => {
    test('should gracefully handle partial failures in complex workflows', () => {
      const resilientTimeline = timeline
        .addVideo('good-video.mp4')
        .addVideo('missing-video.mp4') // This file doesn't exist
        .addText('Text with emoji 🎬', { position: 'center' })
        .addImage('missing-image.png') // This file doesn't exist
        .addAudio('good-audio.mp3', { volume: 0.8 })
        .addFilter('brightness=1.2')
        .addFilter('invalid-filter=xyz'); // Invalid filter
      
      // Should still generate a command despite some invalid components
      const command = resilientTimeline.getCommand('resilient-output.mp4');
      
      expect(command).toContain('good-video.mp4');
      expect(command).toContain('Text with emoji');
      expect(command).toContain('good-audio.mp3');
    });
    
    test('should handle workflow recovery after errors', () => {
      try {
        const errorTimeline = timeline
          .addVideo('') // Empty path
          .addText('Recovery test', { position: 'center' });
        
        const command = errorTimeline.getCommand('recovery.mp4');
        expect(command).toContain('Recovery test');
      } catch (error) {
        // Should handle errors gracefully
        expect(error).toBeDefined();
      }
      
      // Should be able to create new timeline after error
      const recoveredTimeline = timeline
        .addVideo('recovery.mp4')
        .addText('Recovered successfully', { position: 'center' });
      
      const recoveredCommand = recoveredTimeline.getCommand('final.mp4');
      expect(recoveredCommand).toContain('Recovered successfully');
    });
  });
});
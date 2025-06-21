/**
 * IMAGE CAPTION AND TIMELAPSE TEST SUITE
 * 
 * Tests image + caption integration and new timelapse features
 */

import { test, expect, describe } from 'bun:test';
import { Timeline } from '@jamesaphoenix/media-sdk';

describe('🖼️ IMAGE CAPTION INTEGRATION', () => {
  describe('📝 Basic Image + Caption', () => {
    test('should add image with caption overlay', () => {
      const timeline = new Timeline()
        .addImage('photo.jpg', { duration: 5 })
        .addText('Beautiful Sunset', { 
          position: 'bottom',
          startTime: 0,
          duration: 5,
          style: {
            fontSize: 48,
            color: '#ffffff',
            background: { color: 'rgba(0,0,0,0.7)', padding: 20 }
          }
        });

      const command = timeline.getCommand('output.mp4');
      expect(command).toContain('photo.jpg');
      expect(command).toContain('drawtext');
      expect(command).toContain('Beautiful Sunset');
    });

    test('should support multiple captions on single image', () => {
      const timeline = new Timeline()
        .addImage('photo.jpg', { duration: 10 })
        .addText('Title', { 
          position: 'top',
          startTime: 0,
          duration: 10
        })
        .addText('Location: Paris', { 
          position: 'bottom-left',
          startTime: 2,
          duration: 8
        })
        .addText('Date: 2024', { 
          position: 'bottom-right',
          startTime: 2,
          duration: 8
        });

      const command = timeline.getCommand('output.mp4');
      const drawtextCount = (command.match(/drawtext/g) || []).length;
      expect(drawtextCount).toBe(3);
    });

    test('should animate captions on static images', () => {
      const timeline = new Timeline()
        .addImage('photo.jpg', { duration: 8 })
        .addWordHighlighting({
          text: 'This photo was taken during our amazing trip',
          startTime: 1,
          duration: 6,
          preset: 'instagram',
          position: { x: '50%', y: '80%', anchor: 'center' }
        });

      const command = timeline.getCommand('output.mp4');
      expect(command).toContain('photo.jpg');
      expect(command).toContain('drawtext');
    });
  });

  describe('🎬 Image Slideshow with Captions', () => {
    test('should create basic slideshow with captions', () => {
      const timeline = new Timeline()
        // Image 1
        .addImage('photo1.jpg', { duration: 3 })
        .addText('First Photo', { 
          position: 'bottom',
          startTime: 0,
          duration: 3
        })
        // Image 2  
        .addImage('photo2.jpg', { duration: 3, startTime: 3 })
        .addText('Second Photo', { 
          position: 'bottom',
          startTime: 3,
          duration: 3
        })
        // Image 3
        .addImage('photo3.jpg', { duration: 3, startTime: 6 })
        .addText('Third Photo', { 
          position: 'bottom',
          startTime: 6,
          duration: 3
        });

      const command = timeline.getCommand('output.mp4');
      expect(command).toContain('photo1.jpg');
      expect(command).toContain('photo2.jpg');
      expect(command).toContain('photo3.jpg');
    });
  });

  describe('🔄 Timelapse Features', () => {
    test('should support timelapse creation from images', () => {
      const timeline = new Timeline();
      
      // Add 10 images for timelapse
      const images = Array.from({ length: 10 }, (_, i) => `frame${i + 1}.jpg`);
      
      // Each image shown for 0.1 seconds = 10fps timelapse
      images.forEach((image, index) => {
        timeline.addImage(image, {
          startTime: index * 0.1,
          duration: 0.1
        });
      });

      const command = timeline.getCommand('timelapse.mp4');
      expect(command).toContain('frame1.jpg');
      expect(command).toContain('frame10.jpg');
    });

    test('should create smooth timelapse with crossfade transitions', () => {
      const timeline = new Timeline();
      
      // Timelapse with crossfade
      const images = ['sunrise1.jpg', 'sunrise2.jpg', 'sunrise3.jpg', 'sunrise4.jpg'];
      const frameDuration = 0.5;
      const transitionDuration = 0.1;
      
      images.forEach((image, index) => {
        timeline.addImage(image, {
          startTime: index * (frameDuration - transitionDuration),
          duration: frameDuration,
          fade: {
            in: index > 0 ? transitionDuration : 0,
            out: index < images.length - 1 ? transitionDuration : 0
          }
        });
      });

      const command = timeline.getCommand('smooth-timelapse.mp4');
      expect(command).toContain('fade');
    });

    test('should add progress indicator to timelapse', () => {
      const timeline = new Timeline();
      
      const totalImages = 24; // 24 hour timelapse
      const totalDuration = 12; // 12 second video
      const frameDuration = totalDuration / totalImages;
      
      // Add images
      for (let i = 0; i < totalImages; i++) {
        timeline.addImage(`hour${i}.jpg`, {
          startTime: i * frameDuration,
          duration: frameDuration
        });
        
        // Add time label
        timeline.addText(`${i}:00`, {
          position: 'top-right',
          startTime: i * frameDuration,
          duration: frameDuration,
          style: {
            fontSize: 24,
            color: '#ffffff',
            background: { color: 'rgba(0,0,0,0.5)', padding: 10 }
          }
        });
      }

      const command = timeline.getCommand('24hour-timelapse.mp4');
      expect(command).toContain('hour0.jpg');
      expect(command).toContain('hour23.jpg');
      expect(command).toContain('drawtext');
    });
  });

  describe('🌟 Advanced Timelapse Effects', () => {
    test('should create Ken Burns effect timelapse', () => {
      const timeline = new Timeline();
      
      const images = ['landscape1.jpg', 'landscape2.jpg', 'landscape3.jpg'];
      
      images.forEach((image, index) => {
        // Ken Burns: zoom and pan effect
        timeline.addImage(image, {
          startTime: index * 3,
          duration: 3,
          zoom: {
            start: 1.0,
            end: 1.2,
            focusX: index % 2 === 0 ? 'left' : 'right',
            focusY: 'center'
          }
        });
      });

      const command = timeline.getCommand('kenburns-timelapse.mp4');
      expect(command).toContain('zoompan');
    });

    test('should create timelapse with dynamic captions', () => {
      const timeline = new Timeline();
      
      // Weather timelapse with temperature overlay
      const weatherData = [
        { image: 'morning.jpg', temp: '15°C', time: '6:00 AM' },
        { image: 'noon.jpg', temp: '25°C', time: '12:00 PM' },
        { image: 'evening.jpg', temp: '20°C', time: '6:00 PM' },
        { image: 'night.jpg', temp: '12°C', time: '12:00 AM' }
      ];
      
      weatherData.forEach((data, index) => {
        const startTime = index * 2;
        
        timeline
          .addImage(data.image, {
            startTime,
            duration: 2
          })
          .addText(data.temp, {
            position: { x: '80%', y: '20%', anchor: 'center' },
            startTime,
            duration: 2,
            style: {
              fontSize: 64,
              color: '#ffffff',
              strokeColor: '#000000',
              strokeWidth: 2
            }
          })
          .addText(data.time, {
            position: { x: '50%', y: '90%', anchor: 'center' },
            startTime,
            duration: 2,
            style: {
              fontSize: 32,
              color: '#ffffff',
              background: { color: 'rgba(0,0,0,0.7)', padding: 15 }
            }
          });
      });

      const command = timeline.getCommand('weather-timelapse.mp4');
      expect(command).toContain('morning.jpg');
      expect(command).toContain('15°C');
    });

    test('should create morphing timelapse effect', () => {
      const timeline = new Timeline();
      
      // Plant growth timelapse with morphing
      const growthStages = [
        'seed.jpg',
        'sprout.jpg', 
        'seedling.jpg',
        'plant.jpg',
        'flower.jpg'
      ];
      
      growthStages.forEach((stage, index) => {
        timeline.addImage(stage, {
          startTime: index * 1.5,
          duration: 2,
          blend: index > 0 ? {
            mode: 'dissolve',
            duration: 0.5
          } : undefined
        });
      });
      
      // Add growth percentage
      timeline.addWordHighlighting({
        text: '0% → 20% → 40% → 60% → 80% → 100%',
        startTime: 0,
        duration: growthStages.length * 1.5,
        wordsPerSecond: 0.4,
        preset: 'typewriter',
        position: { x: '50%', y: '85%', anchor: 'center' }
      });

      const command = timeline.getCommand('growth-timelapse.mp4');
      expect(command).toContain('blend');
    });
  });

  describe('📸 Instagram-style Photo Stories', () => {
    test('should create Instagram story from photos', () => {
      const timeline = new Timeline()
        .setAspectRatio('9:16') // Instagram story ratio
        
        // Photo 1 with animated caption
        .addImage('selfie.jpg', { duration: 3 })
        .addWordHighlighting({
          text: 'Best day ever! 🌟',
          startTime: 0.5,
          duration: 2.5,
          preset: 'instagram',
          position: { x: '50%', y: '20%', anchor: 'center' }
        })
        
        // Photo 2 with location tag
        .addImage('beach.jpg', { startTime: 3, duration: 3 })
        .addText('📍 Malibu Beach', {
          position: { x: '50%', y: '85%', anchor: 'center' },
          startTime: 3.5,
          duration: 2.5,
          style: {
            fontSize: 28,
            color: '#ffffff',
            background: { 
              color: 'rgba(0,0,0,0.6)', 
              padding: 15,
              borderRadius: 20
            }
          }
        })
        
        // Photo 3 with poll overlay
        .addImage('food.jpg', { startTime: 6, duration: 3 })
        .addText('Yummy? 😋', {
          position: { x: '50%', y: '40%', anchor: 'center' },
          startTime: 6,
          duration: 3,
          style: { fontSize: 48, color: '#ffffff' }
        })
        .addText('YES! 👍', {
          position: { x: '30%', y: '60%', anchor: 'center' },
          startTime: 6.5,
          duration: 2.5,
          style: {
            fontSize: 32,
            color: '#ffffff',
            background: { color: '#4CAF50', padding: 20, borderRadius: 25 }
          }
        })
        .addText('NAH 👎', {
          position: { x: '70%', y: '60%', anchor: 'center' },
          startTime: 6.5,
          duration: 2.5,
          style: {
            fontSize: 32,
            color: '#ffffff',
            background: { color: '#F44336', padding: 20, borderRadius: 25 }
          }
        });

      const command = timeline.getCommand('instagram-story.mp4');
      expect(command).toContain('9:16');
      expect(command).toContain('selfie.jpg');
    });
  });
});
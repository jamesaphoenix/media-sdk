/**
 * TIMELAPSE WORKING EXAMPLE - FIXED
 * 
 * Demonstrates actual working timelapse creation with the current Timeline API
 * Fixed to use immutable API pattern correctly
 */

import { test, expect, describe } from 'bun:test';
import { Timeline } from '@jamesaphoenix/media-sdk';

describe('🎬 WORKING TIMELAPSE EXAMPLES - FIXED', () => {
  test('should create basic timelapse from multiple images', () => {
    // Create a timeline
    let timeline = new Timeline();
    
    // Add images in sequence - each image becomes a frame
    const images = [
      'sunrise1.jpg',
      'sunrise2.jpg', 
      'sunrise3.jpg',
      'sunrise4.jpg',
      'sunrise5.jpg'
    ];
    
    // Method 1: Simple sequence (each image for 0.5 seconds)
    images.forEach((img, index) => {
      timeline = timeline.addImage(img, {
        startTime: index * 0.5,
        duration: 0.5
      });
    });

    const command = timeline.getCommand('timelapse.mp4');
    
    console.log('Timeline layers after adding images:', JSON.stringify(timeline.toJSON().layers, null, 2));
    console.log('Generated command:', command);
    
    // Command should include all images
    expect(command).toContain('sunrise1.jpg');
    expect(command).toContain('sunrise5.jpg');
    expect(command).toContain('concat'); // Should use concat filter for timelapse
    
    console.log('Basic timelapse command:', command.substring(0, 200) + '...');
  });

  test('should create smooth timelapse with overlapping images', () => {
    let timeline = new Timeline();
    
    // Images with slight overlap for smoother transitions
    const images = ['frame1.jpg', 'frame2.jpg', 'frame3.jpg', 'frame4.jpg'];
    const frameDuration = 1.0;
    const overlap = 0.2;
    
    images.forEach((img, index) => {
      timeline = timeline.addImage(img, {
        startTime: index * (frameDuration - overlap),
        duration: frameDuration
      });
    });

    const command = timeline.getCommand('smooth-timelapse.mp4');
    
    expect(command).toContain('frame1.jpg');
    expect(command).toContain('frame4.jpg');
    
    console.log('Smooth timelapse layers:', timeline.toJSON().layers.length);
  });

  test('should create timelapse with captions', () => {
    let timeline = new Timeline();
    
    const frames = [
      { image: 'morning.jpg', caption: 'Morning - 6:00 AM' },
      { image: 'noon.jpg', caption: 'Noon - 12:00 PM' },
      { image: 'evening.jpg', caption: 'Evening - 6:00 PM' },
      { image: 'night.jpg', caption: 'Night - 10:00 PM' }
    ];
    
    frames.forEach((frame, index) => {
      const startTime = index * 2; // 2 seconds per frame
      
      timeline = timeline
        .addImage(frame.image, {
          startTime,
          duration: 2
        })
        .addText(frame.caption, {
          startTime,
          duration: 2,
          position: 'bottom',
          style: {
            fontSize: 36,
            color: 'white',
            strokeColor: 'black',
            strokeWidth: 2
          }
        });
    });

    const command = timeline.getCommand('captioned-timelapse.mp4');
    
    expect(command).toContain('morning.jpg');
    expect(command).toContain('drawtext');
    
    console.log('Captioned timelapse total layers:', timeline.toJSON().layers.length);
  });

  test('should create fast-paced timelapse (high FPS effect)', () => {
    let timeline = new Timeline();
    
    // Many images with very short duration for fast-motion effect
    const imageCount = 20; // Reduced for test
    const frameDuration = 0.1; // 10 FPS
    
    for (let i = 0; i < imageCount; i++) {
      timeline = timeline.addImage(`frame${String(i).padStart(3, '0')}.jpg`, {
        startTime: i * frameDuration,
        duration: frameDuration
      });
    }
    
    // Speed up even more
    timeline = timeline.addFilter('setpts', { value: '0.5*PTS' }); // Double speed

    const command = timeline.getCommand('fast-timelapse.mp4');
    
    expect(command).toContain('frame000.jpg');
    expect(command).toContain('frame019.jpg');
    expect(command).toContain('setpts');
  });

  test('should create timelapse with word highlighting overlay', () => {
    let timeline = new Timeline();
    
    // Background timelapse
    const images = ['bg1.jpg', 'bg2.jpg', 'bg3.jpg', 'bg4.jpg', 'bg5.jpg'];
    images.forEach((img, index) => {
      timeline = timeline.addImage(img, {
        startTime: index * 3,
        duration: 3
      });
    });
    
    // Add synchronized word highlighting
    timeline = timeline.addWordHighlighting({
      text: "Watch the sunset fade into beautiful twilight colors",
      startDelay: 1,
      wordDuration: 0.5,
      preset: 'dramatic',
      position: { x: '50%', y: '80%' }
    });

    const command = timeline.getCommand('highlighted-timelapse.mp4');
    
    expect(command).toContain('bg1.jpg');
    expect(command).toContain('drawtext');
    
    const layers = timeline.toJSON().layers;
    expect(layers.filter(l => l.type === 'text').length).toBeGreaterThan(5); // Multiple words
  });

  test('should create Instagram-style photo slideshow', () => {
    let timeline = new Timeline();
    
    // Set Instagram aspect ratio
    timeline = timeline.setAspectRatio('1:1');
    
    const photos = [
      { img: 'photo1.jpg', caption: '☀️ Good morning!' },
      { img: 'photo2.jpg', caption: '☕ Coffee time' },
      { img: 'photo3.jpg', caption: '🌅 Beautiful sunset' },
      { img: 'photo4.jpg', caption: '✨ Perfect ending' }
    ];
    
    photos.forEach((photo, index) => {
      const startTime = index * 3;
      
      // Add photo with zoom effect
      timeline = timeline
        .addImage(photo.img, {
          startTime,
          duration: 3
        })
        .addFilter('zoompan', {
          zoom: 'min(zoom+0.0015,1.5)',
          duration: 3,
          startTime
        })
        .addText(photo.caption, {
          startTime: startTime + 0.5,
          duration: 2,
          position: 'center',
          style: {
            fontSize: 42,
            color: 'white',
            backgroundColor: 'rgba(0,0,0,0.5)',
            padding: 20
          }
        });
    });

    const command = timeline.getCommand('instagram-slideshow.mp4');
    
    expect(command).toContain('photo1.jpg');
    expect(command).toContain('1:1'); // Aspect ratio
    expect(command).toContain('zoompan');
    
    console.log('Instagram slideshow has aspect ratio setting:', timeline.toJSON().globalOptions.aspectRatio);
  });

  test('should create professional presentation timelapse', () => {
    let timeline = new Timeline();
    
    // High quality settings
    timeline = timeline.setFrameRate(60);
    
    // Presentation slides as images
    const slides = [
      { img: 'slide1.png', duration: 5, title: 'Introduction' },
      { img: 'slide2.png', duration: 8, title: 'Main Concept' },
      { img: 'slide3.png', duration: 6, title: 'Implementation' },
      { img: 'slide4.png', duration: 4, title: 'Results' },
      { img: 'slide5.png', duration: 3, title: 'Conclusion' }
    ];
    
    let currentTime = 0;
    slides.forEach((slide, index) => {
      // Add slide with fade transition
      timeline = timeline
        .addImage(slide.img, {
          startTime: currentTime,
          duration: slide.duration
        })
        .addText(slide.title, {
          startTime: currentTime,
          duration: slide.duration,
          position: 'top',
          style: {
            fontSize: 48,
            color: 'white',
            backgroundColor: 'rgba(0,0,0,0.8)',
            padding: 15
          }
        });
      
      // Add fade transition between slides
      if (index < slides.length - 1) {
        timeline = timeline.addFilter('fade', {
          type: 'in',
          startTime: currentTime + slide.duration - 0.5,
          duration: 0.5
        });
      }
      
      currentTime += slide.duration;
    });

    const command = timeline.getCommand('presentation.mp4', { quality: 'high' });
    
    expect(command).toContain('slide1.png');
    expect(command).toContain('60'); // Frame rate
    expect(command).toContain('crf'); // Quality setting
    
    console.log('Presentation timelapse duration:', currentTime, 'seconds');
  });
});

describe('🎨 CREATIVE TIMELAPSE TECHNIQUES - FIXED', () => {
  test('should create day-to-night timelapse', () => {
    let timeline = new Timeline();
    
    // Images taken throughout the day
    const dayImages = [
      { img: 'sunrise.jpg', time: '6:00 AM', brightness: 0 },
      { img: 'morning.jpg', time: '9:00 AM', brightness: 0.1 },
      { img: 'noon.jpg', time: '12:00 PM', brightness: 0.2 },
      { img: 'afternoon.jpg', time: '3:00 PM', brightness: 0.1 },
      { img: 'sunset.jpg', time: '6:00 PM', brightness: -0.1 },
      { img: 'dusk.jpg', time: '7:30 PM', brightness: -0.3 },
      { img: 'night.jpg', time: '9:00 PM', brightness: -0.5 }
    ];
    
    dayImages.forEach((img, index) => {
      const startTime = index * 2;
      
      timeline = timeline
        .addImage(img.img, {
          startTime,
          duration: 2
        })
        .addFilter('brightness', { 
          value: img.brightness,
          startTime 
        })
        .addText(img.time, {
          startTime,
          duration: 2,
          position: { x: 50, y: 50 },
          style: {
            fontSize: 32,
            color: index < 4 ? 'black' : 'white'
          }
        });
    });
    
    // Add smooth color grading
    timeline = timeline.addFilter('colorgrade', {
      shadows: '0.1,0.1,0.2',
      midtones: '1,0.9,0.8',
      highlights: '1,1,0.9'
    });

    const command = timeline.getCommand('day-to-night.mp4');
    
    expect(command).toContain('sunrise.jpg');
    expect(command).toContain('brightness');
    expect(timeline.toJSON().layers.filter(l => l.type === 'filter').length).toBeGreaterThan(5);
  });

  test('should create construction/progress timelapse', () => {
    let timeline = new Timeline();
    
    // Construction progress images
    const stages = [
      { img: 'foundation.jpg', label: 'Day 1: Foundation' },
      { img: 'framing.jpg', label: 'Day 7: Framing' },
      { img: 'roofing.jpg', label: 'Day 14: Roofing' },
      { img: 'siding.jpg', label: 'Day 21: Siding' },
      { img: 'completed.jpg', label: 'Day 30: Complete!' }
    ];
    
    stages.forEach((stage, index) => {
      const startTime = index * 3;
      
      timeline = timeline
        .addImage(stage.img, {
          startTime,
          duration: 3
        })
        // Ken Burns effect for dynamic feel
        .addFilter('zoompan', {
          zoom: 'zoom+0.002',
          x: 'iw/2-(iw/zoom/2)',
          y: 'ih/2-(ih/zoom/2)',
          duration: 3,
          startTime
        })
        // Progress label
        .addText(stage.label, {
          startTime,
          duration: 3,
          position: 'bottom',
          style: {
            fontSize: 36,
            color: 'white',
            backgroundColor: 'rgba(0,0,0,0.7)',
            padding: 10
          }
        });
    });
    
    // Add dramatic music (if available)
    timeline = timeline.addAudio('epic-music.mp3', {
      volume: 0.3,
      fadeIn: 1,
      fadeOut: 2
    });

    const command = timeline.getCommand('construction-timelapse.mp4');
    
    expect(command).toContain('foundation.jpg');
    expect(command).toContain('zoompan');
    expect(command).toContain('epic-music.mp3');
    
    const layers = timeline.toJSON().layers;
    expect(layers.filter(l => l.type === 'image').length).toBe(5);
    expect(layers.filter(l => l.type === 'text').length).toBe(5);
    expect(layers.filter(l => l.type === 'audio').length).toBe(1);
  });
});
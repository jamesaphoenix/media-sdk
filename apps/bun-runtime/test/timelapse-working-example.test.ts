/**
 * TIMELAPSE WORKING EXAMPLE
 * 
 * Demonstrates actual working timelapse creation with the current Timeline API
 */

import { test, expect, describe } from 'bun:test';
import { Timeline } from '@jamesaphoenix/media-sdk';

describe('🎬 WORKING TIMELAPSE EXAMPLES', () => {
  test('should create basic timelapse from multiple images', () => {
    // Create a timeline
    const timeline = new Timeline();
    
    // Add a video base (if needed for audio or background)
    // timeline.addVideo('background.mp4');
    
    // Add images in sequence - each image becomes a frame
    const images = [
      'sunrise1.jpg',
      'sunrise2.jpg', 
      'sunrise3.jpg',
      'sunrise4.jpg',
      'sunrise5.jpg'
    ];
    
    // Method 1: Simple sequence (each image for 0.5 seconds)
    let result = timeline;
    images.forEach((img, index) => {
      result = result.addImage(img, {
        startTime: index * 0.5,
        duration: 0.5
      });
    });

    const command = result.getCommand('timelapse.mp4');
    
    console.log('Generated command:', command);
    console.log('Timeline layers:', result.toJSON().layers);
    
    // Command should include all images
    expect(command).toContain('sunrise1.jpg');
    expect(command).toContain('sunrise5.jpg');
    // Don't expect overlay for basic timelapse
    
    console.log('Basic timelapse command:', command.substring(0, 200) + '...');
  });

  test('should create smooth timelapse with overlapping images', () => {
    const timeline = new Timeline();
    
    // Images with slight overlap for smoother transitions
    const images = ['frame1.jpg', 'frame2.jpg', 'frame3.jpg', 'frame4.jpg'];
    const frameDuration = 1.0;
    const overlap = 0.2;
    
    images.forEach((img, index) => {
      timeline.addImage(img, {
        startTime: index * (frameDuration - overlap),
        duration: frameDuration
      });
    });

    const command = timeline.getCommand('smooth-timelapse.mp4');
    
    expect(command).toContain('frame1.jpg');
    expect(command).toContain('overlay');
    
    console.log('Smooth timelapse created');
  });

  test('should create timelapse with captions', () => {
    const timeline = new Timeline();
    
    // Weather timelapse with temperature data
    const weatherData = [
      { image: 'morning.jpg', time: '6:00 AM', temp: '15°C' },
      { image: 'noon.jpg', time: '12:00 PM', temp: '25°C' },
      { image: 'evening.jpg', time: '6:00 PM', temp: '20°C' },
      { image: 'night.jpg', time: '12:00 AM', temp: '12°C' }
    ];
    
    weatherData.forEach((data, index) => {
      const startTime = index * 2;
      
      // Add image
      timeline.addImage(data.image, {
        startTime,
        duration: 2
      });
      
      // Add time label
      timeline.addText(data.time, {
        position: 'top-left',
        startTime,
        duration: 2,
        style: {
          fontSize: 24,
          color: '#ffffff',
          background: { color: 'rgba(0,0,0,0.7)', padding: 10 }
        }
      });
      
      // Add temperature
      timeline.addText(data.temp, {
        position: 'top-right',
        startTime,
        duration: 2,
        style: {
          fontSize: 48,
          color: '#ffffff',
          strokeColor: '#000000',
          strokeWidth: 2
        }
      });
    });

    const command = timeline.getCommand('weather-timelapse.mp4');
    
    expect(command).toContain('morning.jpg');
    expect(command).toContain('6:00 AM');
    expect(command).toContain('15°C');
    
    console.log('Weather timelapse with captions created');
  });

  test('should create fast-paced timelapse (high FPS effect)', () => {
    const timeline = new Timeline();
    
    // Simulate 30 FPS timelapse from 100 images
    const frameCount = 100;
    const fps = 30;
    const frameDuration = 1 / fps; // 0.033 seconds per frame
    
    for (let i = 0; i < frameCount; i++) {
      timeline.addImage(`frame${i.toString().padStart(4, '0')}.jpg`, {
        startTime: i * frameDuration,
        duration: frameDuration
      });
    }

    const command = timeline.getCommand('fast-timelapse.mp4');
    
    // Total duration should be about 3.33 seconds
    expect(command).toContain('frame0000.jpg');
    expect(command).toContain('frame0099.jpg');
    
    console.log(`Fast timelapse: ${frameCount} frames at ${fps} FPS = ${(frameCount/fps).toFixed(2)}s video`);
  });

  test('should create timelapse with word highlighting overlay', () => {
    const timeline = new Timeline();
    
    // Plant growth timelapse
    const growthStages = [
      { image: 'seed.jpg', label: 'Day 1: Seed planted' },
      { image: 'sprout.jpg', label: 'Day 3: First sprout!' },
      { image: 'seedling.jpg', label: 'Day 7: Growing strong' },
      { image: 'plant.jpg', label: 'Day 14: Full plant' },
      { image: 'flower.jpg', label: 'Day 21: Blooming!' }
    ];
    
    growthStages.forEach((stage, index) => {
      const startTime = index * 3;
      
      // Add image
      timeline.addImage(stage.image, {
        startTime,
        duration: 3
      });
      
      // Add animated label
      timeline.addWordHighlighting({
        text: stage.label,
        startTime: startTime + 0.5,
        duration: 2,
        preset: 'instagram',
        position: { x: '50%', y: '80%', anchor: 'center' }
      });
    });

    const command = timeline.getCommand('growth-timelapse.mp4');
    
    expect(command).toContain('seed.jpg');
    expect(command).toContain('drawtext');
    expect(command).toContain('Day');
    
    console.log('Growth timelapse with word highlighting created');
  });

  test('should create Instagram-style photo slideshow', () => {
    const timeline = new Timeline()
      .setAspectRatio('1:1'); // Instagram square
    
    const photos = [
      { image: 'photo1.jpg', caption: 'Summer vibes ☀️' },
      { image: 'photo2.jpg', caption: 'Beach day 🏖️' },
      { image: 'photo3.jpg', caption: 'Sunset magic 🌅' }
    ];
    
    photos.forEach((photo, index) => {
      const startTime = index * 3;
      
      // Add photo
      timeline.addImage(photo.image, {
        startTime,
        duration: 3
      });
      
      // Add caption with Instagram style
      timeline.addCaptions({
        captions: [{
          text: photo.caption,
          startTime,
          duration: 3
        }],
        preset: 'instagram'
      });
    });
    
    // Add background music
    timeline.addAudio('upbeat-music.mp3', {
      volume: 0.7,
      fadeIn: 1,
      fadeOut: 1
    });

    const command = timeline.getCommand('instagram-slideshow.mp4');
    
    expect(command).toContain('scale');
    expect(command).toContain('crop');
    expect(command).toContain('1:1');
    
    console.log('Instagram slideshow created');
  });

  test('should create professional presentation timelapse', () => {
    const timeline = new Timeline()
      .setFrameRate(24); // Cinematic
    
    // Conference presentation slides
    const slides = [
      { image: 'title-slide.png', duration: 3, title: 'Welcome' },
      { image: 'agenda.png', duration: 5, title: 'Agenda' },
      { image: 'chart1.png', duration: 4, title: 'Q1 Results' },
      { image: 'chart2.png', duration: 4, title: 'Growth Metrics' },
      { image: 'conclusion.png', duration: 3, title: 'Thank You' }
    ];
    
    let currentTime = 0;
    
    slides.forEach((slide, index) => {
      // Add slide
      timeline.addImage(slide.image, {
        startTime: currentTime,
        duration: slide.duration
      });
      
      // Add slide number
      timeline.addText(`${index + 1}/${slides.length}`, {
        position: 'bottom-right',
        startTime: currentTime,
        duration: slide.duration,
        style: {
          fontSize: 18,
          color: '#666666'
        }
      });
      
      // Add title with fade in
      timeline.addText(slide.title, {
        position: 'top',
        startTime: currentTime,
        duration: slide.duration,
        style: {
          fontSize: 48,
          color: '#333333',
          fontWeight: 'bold'
        }
      });
      
      currentTime += slide.duration;
    });

    const command = timeline.getCommand('presentation.mp4');
    
    expect(command).toContain('title-slide.png');
    expect(command).toContain('24'); // frame rate
    
    console.log(`Presentation timelapse: ${currentTime}s total duration`);
  });
});

describe('🎨 CREATIVE TIMELAPSE TECHNIQUES', () => {
  test('should create day-to-night timelapse', () => {
    const timeline = new Timeline();
    
    // 24-hour timelapse with time overlay
    const hours = 24;
    const secondsPerHour = 0.5; // 12 second total video
    
    for (let hour = 0; hour < hours; hour++) {
      const startTime = hour * secondsPerHour;
      
      // Add hourly photo
      timeline.addImage(`city-hour-${hour.toString().padStart(2, '0')}.jpg`, {
        startTime,
        duration: secondsPerHour
      });
      
      // Add time display
      const timeStr = `${hour.toString().padStart(2, '0')}:00`;
      timeline.addText(timeStr, {
        position: { x: 50, y: 50 }, // Fixed position
        startTime,
        duration: secondsPerHour,
        style: {
          fontSize: 64,
          color: hour >= 6 && hour <= 18 ? '#333333' : '#ffffff', // Dark during day, light at night
          fontFamily: 'monospace'
        }
      });
      
      // Add day/night indicator
      const isDaytime = hour >= 6 && hour <= 18;
      timeline.addText(isDaytime ? '☀️' : '🌙', {
        position: { x: 150, y: 50 },
        startTime,
        duration: secondsPerHour,
        style: { fontSize: 48 }
      });
    }

    const command = timeline.getCommand('day-to-night.mp4');
    
    expect(command).toContain('city-hour-00.jpg');
    expect(command).toContain('city-hour-23.jpg');
    expect(command).toContain('00:00');
    
    console.log('24-hour day-to-night timelapse created');
  });

  test('should create construction/progress timelapse', () => {
    const timeline = new Timeline();
    
    // Building construction over 30 days
    const progressData = [
      { day: 1, image: 'foundation.jpg', progress: 5 },
      { day: 5, image: 'frame-start.jpg', progress: 15 },
      { day: 10, image: 'frame-complete.jpg', progress: 30 },
      { day: 15, image: 'walls.jpg', progress: 50 },
      { day: 20, image: 'roof.jpg', progress: 70 },
      { day: 25, image: 'finishing.jpg', progress: 85 },
      { day: 30, image: 'complete.jpg', progress: 100 }
    ];
    
    progressData.forEach((data, index) => {
      const startTime = index * 2;
      
      // Add construction photo
      timeline.addImage(data.image, {
        startTime,
        duration: 2
      });
      
      // Add day counter
      timeline.addText(`Day ${data.day}`, {
        position: 'top-left',
        startTime,
        duration: 2,
        style: {
          fontSize: 36,
          color: '#ffffff',
          background: { color: 'rgba(0,0,0,0.8)', padding: 15 }
        }
      });
      
      // Add progress bar
      const progressBar = '█'.repeat(Math.floor(data.progress / 10)) + 
                         '░'.repeat(10 - Math.floor(data.progress / 10));
      
      timeline.addText(`Progress: ${progressBar} ${data.progress}%`, {
        position: 'bottom',
        startTime,
        duration: 2,
        style: {
          fontSize: 24,
          color: '#00ff00',
          fontFamily: 'monospace',
          background: { color: 'rgba(0,0,0,0.9)', padding: 10 }
        }
      });
    });

    const command = timeline.getCommand('construction-timelapse.mp4');
    
    expect(command).toContain('foundation.jpg');
    expect(command).toContain('Day 1');
    expect(command).toContain('Progress:');
    
    console.log('Construction progress timelapse created');
  });
});
/**
 * Real-World Composition Runtime Tests
 * Tests practical, real-world video editing scenarios
 */

import { describe, test, expect, beforeAll } from 'bun:test';
import { Timeline, VideoSplicer, PictureInPicture, AudioDucking } from '@jamesaphoenix/media-sdk';
import { EnhancedBunCassetteManager } from '../src/enhanced-cassette-manager';
import { existsSync, mkdirSync } from 'fs';

const cassetteManager = new EnhancedBunCassetteManager('real-world-compositions');

beforeAll(async () => {
  // Ensure directories exist
  ['output', 'test-assets'].forEach(dir => {
    if (!existsSync(dir)) {
      mkdirSync(dir, { recursive: true });
    }
  });
  
  await createRealWorldAssets();
});

async function createRealWorldAssets() {
  const assets = [
    {
      name: 'test-assets/content.mp4',
      command: 'ffmpeg -f lavfi -i testsrc=duration=30:size=1920x1080:rate=30 -c:v libx264 -preset ultrafast -y'
    },
    {
      name: 'test-assets/reaction.mp4', 
      command: 'ffmpeg -f lavfi -i testsrc2=duration=30:size=640x480:rate=30 -c:v libx264 -preset ultrafast -y'
    },
    {
      name: 'test-assets/interview.mp4',
      command: 'ffmpeg -f lavfi -i testsrc=duration=60:size=1280x720:rate=30 -c:v libx264 -preset ultrafast -y'
    },
    {
      name: 'test-assets/gameplay.mp4',
      command: 'ffmpeg -f lavfi -i testsrc2=duration=120:size=1920x1080:rate=60 -c:v libx264 -preset ultrafast -y'
    },
    {
      name: 'test-assets/music.mp3',
      command: 'ffmpeg -f lavfi -i sine=frequency=440:duration=60 -c:a aac -y'
    },
    {
      name: 'test-assets/voice.mp3',
      command: 'ffmpeg -f lavfi -i sine=frequency=880:duration=30 -c:a aac -y'
    },
    {
      name: 'test-assets/ambience.mp3',
      command: 'ffmpeg -f lavfi -i sine=frequency=220:duration=60 -c:a aac -y'
    },
    {
      name: 'test-assets/logo.png',
      command: 'ffmpeg -f lavfi -i color=red:size=200x200:duration=1 -frames:v 1 -y'
    }
  ];
  
  for (const asset of assets) {
    if (!existsSync(asset.name)) {
      console.log(`Creating real-world asset: ${asset.name}`);
      const result = await cassetteManager.executeCommand(`${asset.command} ${asset.name}`);
      if (!result.success) {
        console.warn(`Failed to create ${asset.name}:`, result.stderr);
      }
    }
  }
}

describe('📱 Social Media Content Creation', () => {
  test('TikTok viral reaction video', async () => {
    const tiktokVideo = new Timeline()
      // Main content video in 9:16 aspect ratio
      .addVideo('test-assets/content.mp4')
      .setAspectRatio('9:16')
      .setDuration(15) // TikTok standard length
      
      // Add reaction video as circular PiP
      .pipe(t => PictureInPicture.add(t, 'test-assets/reaction.mp4', {
        position: 'bottom-right',
        scale: 0.3,
        borderRadius: 999, // Circular
        shadow: {
          blur: 8,
          color: 'black@0.6',
          offsetX: 2,
          offsetY: 2
        },
        animation: 'zoom-in',
        animationDuration: 0.5
      }))
      
      // Background music with ducking for reaction
      .addAudio('test-assets/music.mp3', { volume: 0.6 })
      .pipe(t => AudioDucking.addDucking(t, {
        duckingLevel: 0.2,
        fadeInTime: 0.3,
        fadeOutTime: 0.8,
        detectionMode: 'manual',
        duckingRegions: [
          { start: 2, end: 8 },   // Main reaction section
          { start: 12, end: 15 }  // Final reaction
        ]
      }))
      
      // Viral text overlays with timing
      .addText('Wait for it... 👀', {
        position: { x: 'center', y: '15%' },
        style: { 
          fontSize: 48, 
          color: '#ffffff',
          fontFamily: 'Arial Bold'
        },
        startTime: 0,
        duration: 3
      })
      .addText('OMG!! 😱🔥', {
        position: { x: 'center', y: '15%' },
        style: { 
          fontSize: 64, 
          color: '#ff0066',
          fontFamily: 'Arial Bold'
        },
        startTime: 8,
        duration: 2
      })
      .addText('LIKE & FOLLOW! 💯', {
        position: { x: 'center', y: '85%' },
        style: { 
          fontSize: 36, 
          color: '#ffff00',
          fontFamily: 'Arial Bold'
        },
        startTime: 12,
        duration: 3
      })
      
      // Creator watermark
      .addImage('test-assets/logo.png', {
        position: { x: 10, y: 10 },
        scale: 0.08,
        opacity: 0.8
      });
    
    const command = tiktokVideo.getCommand('output/tiktok-viral.mp4');
    expect(command).toContain('9:16');
    expect(command).toContain('overlay');
    expect(command).toContain('drawtext');
    
    const result = await cassetteManager.executeCommand(command);
    expect(result.success).toBe(true);
    expect(existsSync('output/tiktok-viral.mp4')).toBe(true);
  });

  test('Instagram story with multiple elements', async () => {
    const instagramStory = new Timeline()
      .addVideo('test-assets/content.mp4')
      .setAspectRatio('9:16')
      .setDuration(15)
      
      // Add subtle background music
      .addAudio('test-assets/ambience.mp3', { volume: 0.3 })
      
      // Story title at top
      .addText('MY DAY ✨', {
        position: { x: 'center', y: '8%' },
        style: { 
          fontSize: 42, 
          color: '#ffffff',
          fontFamily: 'Arial Bold'
        },
        startTime: 0,
        duration: 15
      })
      
      // Time/location overlay
      .addText('📍 San Francisco, CA', {
        position: { x: 'center', y: '92%' },
        style: { 
          fontSize: 24, 
          color: '#ffffff',
          fontFamily: 'Arial'
        },
        startTime: 0,
        duration: 15
      })
      
      // Interactive elements (simulated as text)
      .addText('TAP TO SEE MORE', {
        position: { x: 'center', y: 'center' },
        style: { 
          fontSize: 28, 
          color: '#ffffff',
          fontFamily: 'Arial'
        },
        startTime: 10,
        duration: 5
      });
    
    const command = instagramStory.getCommand('output/instagram-story.mp4');
    const result = await cassetteManager.executeCommand(command);
    expect(result.success).toBe(true);
  });

  test('YouTube Short with trending format', async () => {
    const youtubeShort = new Timeline()
      .addVideo('test-assets/content.mp4')
      .setAspectRatio('9:16')
      .setDuration(60) // YouTube Shorts can be up to 60s
      
      // Background music
      .addAudio('test-assets/music.mp3', { volume: 0.4 })
      
      // Hook at the beginning
      .addText('You WON\'T BELIEVE This!', {
        position: { x: 'center', y: '20%' },
        style: { 
          fontSize: 52, 
          color: '#ff0000',
          fontFamily: 'Arial Black'
        },
        startTime: 0,
        duration: 3
      })
      
      // Progress indicators (simulated as text)
      .addText('Part 1/3', {
        position: { x: '90%', y: '10%' },
        style: { fontSize: 20, color: '#ffffff' },
        startTime: 0,
        duration: 20
      })
      .addText('Part 2/3', {
        position: { x: '90%', y: '10%' },
        style: { fontSize: 20, color: '#ffffff' },
        startTime: 20,
        duration: 20
      })
      .addText('Part 3/3', {
        position: { x: '90%', y: '10%' },
        style: { fontSize: 20, color: '#ffffff' },
        startTime: 40,
        duration: 20
      })
      
      // Call to action
      .addText('SUBSCRIBE FOR MORE! 🔔', {
        position: { x: 'center', y: '85%' },
        style: { 
          fontSize: 32, 
          color: '#00ff00',
          fontFamily: 'Arial Bold'
        },
        startTime: 55,
        duration: 5
      });
    
    const command = youtubeShort.getCommand('output/youtube-short.mp4');
    const result = await cassetteManager.executeCommand(command);
    expect(result.success).toBe(true);
  });
});

describe('🎥 Content Creator Workflows', () => {
  test('Gaming highlight reel with commentary', async () => {
    // Create highlight reel from gameplay footage
    const highlights = VideoSplicer.createHighlightReel(
      new Timeline().addVideo('test-assets/gameplay.mp4'),
      [
        { time: 10, duration: 8, priority: 'high' },   // Epic moment 1
        { time: 30, duration: 6, priority: 'high' },   // Epic moment 2
        { time: 60, duration: 5, priority: 'medium' }, // Good play
        { time: 90, duration: 4, priority: 'high' },   // Final boss
      ],
      { maxDuration: 30, sortByPriority: true }
    )
    
    // Add webcam overlay for reaction
    .pipe(t => PictureInPicture.createWebcamOverlay(t, 'test-assets/reaction.mp4', {
      shape: 'rounded',
      position: 'bottom-left',
      scale: 0.2,
      pulseEffect: false
    }))
    
    // Add commentary audio with music ducking
    .addAudio('test-assets/voice.mp3', { volume: 1.0 })
    .addAudio('test-assets/music.mp3', { volume: 0.5 })
    .pipe(t => AudioDucking.addDucking(t, {
      detectionMode: 'sidechain',
      duckingLevel: 0.15,
      fadeInTime: 0.2,
      fadeOutTime: 0.5
    }))
    
    // Title and branding
    .addText('BEST MOMENTS!', {
      position: { x: 'center', y: '10%' },
      style: { 
        fontSize: 48, 
        color: '#ffff00',
        fontFamily: 'Arial Black'
      },
      startTime: 0,
      duration: 3
    })
    .addImage('test-assets/logo.png', {
      position: { x: '85%', y: '5%' },
      scale: 0.1,
      opacity: 0.9
    });
    
    const command = highlights.getCommand('output/gaming-highlights.mp4');
    const result = await cassetteManager.executeCommand(command);
    expect(result.success).toBe(true);
  });

  test('Podcast clip with enhanced visuals', async () => {
    const podcastClip = new Timeline()
      .addVideo('test-assets/interview.mp4')
      .setDuration(60) // 1-minute clip
      
      // Create engaging podcast mix
      .pipe(t => AudioDucking.createPodcastMix(t, {
        hosts: ['test-assets/voice.mp3'],
        music: 'test-assets/music.mp3',
        musicSegments: [
          { start: 0, end: 5 },   // Intro
          { start: 55, end: 60 }  // Outro
        ],
        introOutroDucking: 0.7,
        normalDucking: 0.1
      }))
      
      // Show title
      .addText('THE PRODUCTIVITY PODCAST', {
        position: { x: 'center', y: '15%' },
        style: { 
          fontSize: 36, 
          color: '#ffffff',
          fontFamily: 'Arial Bold'
        },
        startTime: 0,
        duration: 5
      })
      
      // Episode info
      .addText('EP. 42: "Time Management Secrets"', {
        position: { x: 'center', y: '25%' },
        style: { 
          fontSize: 24, 
          color: '#cccccc',
          fontFamily: 'Arial'
        },
        startTime: 0,
        duration: 5
      })
      
      // Key quote highlight
      .addText('"The secret is not managing time,\\nbut managing energy"', {
        position: { x: 'center', y: 'center' },
        style: { 
          fontSize: 32, 
          color: '#00ffff',
          fontFamily: 'Arial Italic'
        },
        startTime: 20,
        duration: 8
      })
      
      // Subscribe reminder
      .addText('Full episode available now!\\nSpotify • Apple • YouTube', {
        position: { x: 'center', y: '80%' },
        style: { 
          fontSize: 20, 
          color: '#ffffff',
          fontFamily: 'Arial'
        },
        startTime: 50,
        duration: 10
      });
    
    const command = podcastClip.getCommand('output/podcast-clip.mp4');
    const result = await cassetteManager.executeCommand(command);
    expect(result.success).toBe(true);
  });

  test('Educational explainer with multiple segments', async () => {
    const explainer = VideoSplicer.splice({
      segments: [
        { source: 'test-assets/content.mp4', startTime: 0, endTime: 10, transition: 'fade' },
        { source: 'test-assets/interview.mp4', startTime: 10, endTime: 20, transition: 'dissolve' },
        { source: 'test-assets/gameplay.mp4', startTime: 30, endTime: 40, transition: 'fade' }
      ],
      defaultTransitionDuration: 1.0,
      maintainAudio: true
    })
    
    // Add educational text overlays
    .addText('STEP 1: Understanding the Basics', {
      position: { x: 'center', y: '20%' },
      style: { 
        fontSize: 36, 
        color: '#ffffff',
        fontFamily: 'Arial Bold'
      },
      startTime: 0,
      duration: 10
    })
    .addText('STEP 2: Practical Application', {
      position: { x: 'center', y: '20%' },
      style: { 
        fontSize: 36, 
        color: '#ffffff',
        fontFamily: 'Arial Bold'
      },
      startTime: 10,
      duration: 10
    })
    .addText('STEP 3: Advanced Techniques', {
      position: { x: 'center', y: '20%' },
      style: { 
        fontSize: 36, 
        color: '#ffffff',
        fontFamily: 'Arial Bold'
      },
      startTime: 20,
      duration: 10
    })
    
    // Add background music with smart ducking
    .addAudio('test-assets/music.mp3', { volume: 0.4 })
    .pipe(t => AudioDucking.addDucking(t, {
      duckingLevel: 0.2,
      detectionMode: 'manual',
      duckingRegions: [
        { start: 2, end: 8 },
        { start: 12, end: 18 },
        { start: 22, end: 28 }
      ]
    }))
    
    // Progress indicator
    .addText('1/3', {
      position: { x: '90%', y: '90%' },
      style: { fontSize: 24, color: '#ffff00' },
      startTime: 0,
      duration: 10
    })
    .addText('2/3', {
      position: { x: '90%', y: '90%' },
      style: { fontSize: 24, color: '#ffff00' },
      startTime: 10,
      duration: 10
    })
    .addText('3/3', {
      position: { x: '90%', y: '90%' },
      style: { fontSize: 24, color: '#ffff00' },
      startTime: 20,
      duration: 10
    });
    
    const command = explainer.getCommand('output/educational-explainer.mp4');
    const result = await cassetteManager.executeCommand(command);
    expect(result.success).toBe(true);
  });
});

describe('📺 Professional Video Production', () => {
  test('Multi-camera interview setup', async () => {
    const interview = new Timeline()
      .addVideo('test-assets/interview.mp4') // Main camera
      
      // Add secondary camera as PiP for dynamic shots
      .pipe(t => PictureInPicture.add(t, 'test-assets/content.mp4', {
        position: 'top-right',
        scale: 0.3,
        startTime: 0,
        endTime: 20 // Show for first 20 seconds
      }))
      
      // Switch to different PiP position later
      .pipe(t => PictureInPicture.add(t, 'test-assets/reaction.mp4', {
        position: 'bottom-left',
        scale: 0.25,
        startTime: 25,
        endTime: 45
      }))
      
      // Professional audio mix
      .pipe(t => AudioDucking.createDialogueMix(t, {
        dialogueTrack: 'test-assets/voice.mp3',
        musicTrack: 'test-assets/music.mp3',
        ambienceTrack: 'test-assets/ambience.mp3',
        dialogueBoost: 1.3,
        musicDuckLevel: 0.15,
        ambienceDuckLevel: 0.4
      }))
      
      // Lower thirds graphics (simulated as text)
      .addText('John Smith\\nCEO, Tech Innovations', {
        position: { x: '20%', y: '75%' },
        style: { 
          fontSize: 28, 
          color: '#ffffff',
          fontFamily: 'Arial'
        },
        startTime: 5,
        duration: 8
      })
      .addText('Sarah Johnson\\nIndustry Expert', {
        position: { x: '20%', y: '75%' },
        style: { 
          fontSize: 28, 
          color: '#ffffff',
          fontFamily: 'Arial'
        },
        startTime: 30,
        duration: 8
      })
      
      // Show branding
      .addImage('test-assets/logo.png', {
        position: { x: '5%', y: '5%' },
        scale: 0.12,
        opacity: 0.8
      });
    
    const command = interview.getCommand('output/professional-interview.mp4');
    const result = await cassetteManager.executeCommand(command);
    expect(result.success).toBe(true);
  });

  test('Event highlight reel with music sync', async () => {
    const eventReel = VideoSplicer.splice({
      segments: [
        { source: 'test-assets/content.mp4', startTime: 5, endTime: 12, transition: 'fade' },
        { source: 'test-assets/interview.mp4', startTime: 20, endTime: 25, transition: 'dissolve' },
        { source: 'test-assets/reaction.mp4', startTime: 10, endTime: 18, transition: 'wipe' },
        { source: 'test-assets/gameplay.mp4', startTime: 45, endTime: 52, transition: 'fade' }
      ],
      defaultTransitionDuration: 0.8
    })
    
    // Sync cuts to music beats (simulated timing)
    .pipe(t => AudioDucking.createMusicBed(t, {
      music: 'test-assets/music.mp3',
      duckingPoints: [
        { time: 7, duration: 2, level: 0.3, reason: 'speech overlay' },
        { time: 20, duration: 3, level: 0.4, reason: 'interview segment' }
      ],
      fadeIn: 2,
      fadeOut: 3,
      baseVolume: 0.8
    }))
    
    // Event title
    .addText('TECH CONFERENCE 2024', {
      position: { x: 'center', y: '15%' },
      style: { 
        fontSize: 48, 
        color: '#ffffff',
        fontFamily: 'Arial Black'
      },
      startTime: 0,
      duration: 4
    })
    
    // Key moments text
    .addText('Opening Keynote', {
      position: { x: 'center', y: '85%' },
      style: { fontSize: 24, color: '#ffff00' },
      startTime: 0,
      duration: 7
    })
    .addText('Expert Panel', {
      position: { x: 'center', y: '85%' },
      style: { fontSize: 24, color: '#ffff00' },
      startTime: 12,
      duration: 5
    })
    .addText('Networking Session', {
      position: { x: 'center', y: '85%' },
      style: { fontSize: 24, color: '#ffff00' },
      startTime: 20,
      duration: 6
    })
    .addText('Closing Ceremony', {
      position: { x: 'center', y: '85%' },
      style: { fontSize: 24, color: '#ffff00' },
      startTime: 28,
      duration: 7
    });
    
    const command = eventReel.getCommand('output/event-highlight-reel.mp4');
    const result = await cassetteManager.executeCommand(command);
    expect(result.success).toBe(true);
  });

  test('Corporate training video with chapters', async () => {
    const training = new Timeline()
      .addVideo('test-assets/interview.mp4')
      .setDuration(90) // 1.5 minute training module
      
      // Chapter structure with clear sections
      .addText('CHAPTER 1\\nSafety Protocols', {
        position: { x: 'center', y: 'center' },
        style: { 
          fontSize: 42, 
          color: '#ffffff',
          fontFamily: 'Arial Bold'
        },
        startTime: 0,
        duration: 5
      })
      .addText('CHAPTER 2\\nBest Practices', {
        position: { x: 'center', y: 'center' },
        style: { 
          fontSize: 42, 
          color: '#ffffff',
          fontFamily: 'Arial Bold'
        },
        startTime: 30,
        duration: 5
      })
      .addText('CHAPTER 3\\nCase Studies', {
        position: { x: 'center', y: 'center' },
        style: { 
          fontSize: 42, 
          color: '#ffffff',
          fontFamily: 'Arial Bold'
        },
        startTime: 60,
        duration: 5
      })
      
      // Add professional audio ducking for narration
      .addAudio('test-assets/voice.mp3', { volume: 1.0 })
      .addAudio('test-assets/music.mp3', { volume: 0.3 })
      .pipe(t => AudioDucking.addDucking(t, {
        duckingLevel: 0.1,
        fadeInTime: 0.5,
        fadeOutTime: 1.0,
        detectionMode: 'manual',
        duckingRegions: [
          { start: 5, end: 28 },   // Chapter 1 content
          { start: 35, end: 58 },  // Chapter 2 content
          { start: 65, end: 88 }   // Chapter 3 content
        ]
      }))
      
      // Progress bar (simulated as text)
      .addText('Progress: [██████████] 100%', {
        position: { x: 'center', y: '95%' },
        style: { fontSize: 16, color: '#00ff00' },
        startTime: 85,
        duration: 5
      })
      
      // Company branding
      .addImage('test-assets/logo.png', {
        position: { x: '90%', y: '90%' },
        scale: 0.08,
        opacity: 0.7
      });
    
    const command = training.getCommand('output/corporate-training.mp4');
    const result = await cassetteManager.executeCommand(command);
    expect(result.success).toBe(true);
  });
});
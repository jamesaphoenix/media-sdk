/**
 * Advanced Primitives Composition Tests
 * Tests complex combinations and interactions between core primitives
 */

import { describe, test, expect, beforeAll } from 'bun:test';
import { Timeline } from '@jamesaphoenix/media-sdk';
import { EnhancedBunCassetteManager } from '../src/enhanced-cassette-manager';
import { existsSync, mkdirSync } from 'fs';

const cassetteManager = new EnhancedBunCassetteManager('advanced-primitives');

beforeAll(async () => {
  ['output', 'test-assets', 'advanced-output'].forEach(dir => {
    if (!existsSync(dir)) {
      mkdirSync(dir, { recursive: true });
    }
  });
  
  await createAdvancedAssets();
});

async function createAdvancedAssets() {
  const assets = [
    {
      name: 'test-assets/hd-video.mp4',
      command: 'ffmpeg -f lavfi -i testsrc=duration=15:size=1920x1080:rate=30 -c:v libx264 -preset ultrafast -y'
    },
    {
      name: 'test-assets/4k-video.mp4',
      command: 'ffmpeg -f lavfi -i testsrc2=duration=10:size=3840x2160:rate=30 -c:v libx264 -preset ultrafast -y'
    },
    {
      name: 'test-assets/mobile-video.mp4',
      command: 'ffmpeg -f lavfi -i testsrc=duration=12:size=720x1280:rate=30 -c:v libx264 -preset ultrafast -y'
    },
    {
      name: 'test-assets/widescreen.mp4',
      command: 'ffmpeg -f lavfi -i testsrc2=duration=8:size=2560x1080:rate=30 -c:v libx264 -preset ultrafast -y'
    },
    {
      name: 'test-assets/surround-audio.mp3',
      command: 'ffmpeg -f lavfi -i "sine=frequency=440:duration=10,sine=frequency=880:duration=10,sine=frequency=1320:duration=10" -filter_complex "[0:0][1:0][2:0]amerge=inputs=3[out]" -map "[out]" -c:a aac -y'
    },
    {
      name: 'test-assets/voice-track.mp3',
      command: 'ffmpeg -f lavfi -i sine=frequency=300:duration=8 -c:a aac -y'
    },
    {
      name: 'test-assets/music-track.mp3',
      command: 'ffmpeg -f lavfi -i sine=frequency=500:duration=12 -c:a aac -y'
    },
    {
      name: 'test-assets/complex-image.png',
      command: 'ffmpeg -f lavfi -i mandelbrot=size=1000x1000:rate=1 -frames:v 1 -y'
    },
    {
      name: 'test-assets/animated-gif.gif',
      command: 'ffmpeg -f lavfi -i testsrc=duration=2:size=400x400:rate=10 -y'
    }
  ];
  
  for (const asset of assets) {
    if (!existsSync(asset.name)) {
      console.log(`Creating advanced asset: ${asset.name}`);
      const result = await cassetteManager.executeCommand(`${asset.command} ${asset.name}`);
      if (!result.success) {
        console.warn(`Failed to create ${asset.name}:`, result.stderr);
      }
    }
  }
}

describe('🎬 Multi-Resolution Video Compositions', () => {
  test('4K to HD downscaling with quality preservation', async () => {
    const timeline = new Timeline()
      .addVideo('test-assets/4k-video.mp4')
      .setResolution(1920, 1080)
      .setQuality(18) // High quality for downscale
      .addFilter('lanczos'); // High-quality scaling
    
    const command = timeline.getCommand('advanced-output/4k-to-hd.mp4');
    expect(command).toContain('scale=1920:1080');
    expect(command).toContain('-crf 18');
    
    const result = await cassetteManager.executeCommand(command);
    expect(result.success).toBe(true);
  });

  test('HD to mobile aspect ratio conversion', async () => {
    const timeline = new Timeline()
      .addVideo('test-assets/hd-video.mp4')
      .setAspectRatio('9:16') // Mobile aspect ratio
      .crop(420, 0, 1080, 1920) // Center crop for mobile
      .addText('MOBILE OPTIMIZED', {
        position: { x: 'center', y: '10%' },
        style: { fontSize: 48, color: '#ffffff' }
      });
    
    const command = timeline.getCommand('advanced-output/hd-to-mobile.mp4');
    expect(command).toContain('crop=');
    expect(command).toContain('9/16');
    
    const result = await cassetteManager.executeCommand(command);
    expect(result.success).toBe(true);
  });

  test('Ultra-widescreen to standard conversion', async () => {
    const timeline = new Timeline()
      .addVideo('test-assets/widescreen.mp4')
      .setAspectRatio('16:9')
      .crop(240, 0, 2080, 1080) // Remove sides for 16:9
      .addText('LETTERBOXED', {
        position: { x: 'center', y: '5%' },
        style: { fontSize: 32, color: '#ffff00' }
      });
    
    const command = timeline.getCommand('advanced-output/widescreen-standard.mp4');
    const result = await cassetteManager.executeCommand(command);
    expect(result.success).toBe(true);
  });

  test('Multi-source resolution mixing', async () => {
    const timeline = new Timeline()
      .addVideo('test-assets/4k-video.mp4', {
        startTime: 0,
        duration: 5
      })
      .addVideo('test-assets/hd-video.mp4', {
        startTime: 5,
        duration: 5
      })
      .addVideo('test-assets/mobile-video.mp4', {
        startTime: 10,
        duration: 5
      })
      .setResolution(1920, 1080) // Normalize to HD
      .addText('MIXED RESOLUTIONS', {
        position: { x: 'center', y: 'center' },
        style: { fontSize: 36, color: '#ff0066' }
      });
    
    const command = timeline.getCommand('advanced-output/mixed-resolutions.mp4');
    const result = await cassetteManager.executeCommand(command);
    expect(result.success).toBe(true);
  });
});

describe('🎵 Advanced Audio Mixing', () => {
  test('Multi-track professional audio mix', async () => {
    const timeline = new Timeline()
      .addVideo('test-assets/hd-video.mp4')
      .addAudio('test-assets/voice-track.mp3', { 
        volume: 1.0,
        pan: 0, // Center
        fadeIn: 0.5,
        fadeOut: 0.5
      })
      .addAudio('test-assets/music-track.mp3', { 
        volume: 0.3,
        pan: -0.2, // Slightly left
        fadeIn: 2,
        fadeOut: 3
      })
      .addAudio('test-assets/surround-audio.mp3', { 
        volume: 0.1,
        pan: 0.2, // Slightly right
        startTime: 3
      });
    
    const command = timeline.getCommand('advanced-output/professional-mix.mp4');
    expect(command).toContain('amix');
    expect(command).toContain('pan');
    expect(command).toContain('afade');
    
    const result = await cassetteManager.executeCommand(command);
    expect(result.success).toBe(true);
  });

  test('Dynamic audio level automation', async () => {
    const timeline = new Timeline()
      .addVideo('test-assets/hd-video.mp4')
      .addAudio('test-assets/music-track.mp3', { volume: 0.8 })
      .addFilter('volume=enable=\'between(t,0,3)\':volume=0.8') // Full volume 0-3s
      .addFilter('volume=enable=\'between(t,3,6)\':volume=0.3') // Ducked 3-6s
      .addFilter('volume=enable=\'between(t,6,10)\':volume=0.8'); // Full volume 6-10s
    
    const command = timeline.getCommand('advanced-output/dynamic-levels.mp4');
    expect(command).toContain('volume=enable');
    
    const result = await cassetteManager.executeCommand(command);
    expect(result.success).toBe(true);
  });

  test('Spatial audio positioning', async () => {
    const timeline = new Timeline()
      .addVideo('test-assets/hd-video.mp4')
      // Left channel audio
      .addAudio('test-assets/voice-track.mp3', { 
        pan: -1.0, // Full left
        volume: 0.8
      })
      // Right channel audio
      .addAudio('test-assets/music-track.mp3', { 
        pan: 1.0, // Full right
        volume: 0.6
      })
      // Center channel
      .addAudio('test-assets/surround-audio.mp3', { 
        pan: 0, // Center
        volume: 0.4
      });
    
    const command = timeline.getCommand('advanced-output/spatial-audio.mp4');
    const result = await cassetteManager.executeCommand(command);
    expect(result.success).toBe(true);
  });

  test('Audio crossfading between tracks', async () => {
    const timeline = new Timeline()
      .addVideo('test-assets/hd-video.mp4')
      .addAudio('test-assets/voice-track.mp3', { 
        startTime: 0,
        duration: 6,
        fadeOut: 2 // Fade out over 2 seconds
      })
      .addAudio('test-assets/music-track.mp3', { 
        startTime: 4, // Start 2 seconds before first ends
        fadeIn: 2, // Fade in over 2 seconds
        volume: 0.7
      });
    
    const command = timeline.getCommand('advanced-output/audio-crossfade.mp4');
    expect(command).toContain('afade');
    
    const result = await cassetteManager.executeCommand(command);
    expect(result.success).toBe(true);
  });
});

describe('📝 Advanced Text Compositions', () => {
  test('Animated text sequence with timing', async () => {
    const timeline = new Timeline()
      .addVideo('test-assets/hd-video.mp4')
      // Title sequence
      .addText('TITLE CARD', {
        position: { x: 'center', y: 'center' },
        style: { 
          fontSize: 72, 
          color: '#ffffff',
          fontFamily: 'Arial Black',
          backgroundColor: '#000000',
          borderWidth: 4,
          borderColor: '#ff0000'
        },
        startTime: 0,
        duration: 3
      })
      // Subtitle appears
      .addText('Subtitle Text', {
        position: { x: 'center', y: '70%' },
        style: { 
          fontSize: 36, 
          color: '#ffff00',
          fontFamily: 'Arial Italic'
        },
        startTime: 1,
        duration: 4
      })
      // Information overlay
      .addText('Additional Info | Details | More Text', {
        position: { x: 'center', y: '90%' },
        style: { 
          fontSize: 24, 
          color: '#cccccc',
          fontFamily: 'Arial'
        },
        startTime: 3,
        duration: 5
      })
      // Final call to action
      .addText('CALL TO ACTION!', {
        position: { x: 'center', y: 'center' },
        style: { 
          fontSize: 64, 
          color: '#00ff00',
          fontFamily: 'Arial Black',
          shadowColor: '#000000',
          shadowOffset: { x: 3, y: 3 }
        },
        startTime: 8,
        duration: 4
      });
    
    const command = timeline.getCommand('advanced-output/animated-text-sequence.mp4');
    const result = await cassetteManager.executeCommand(command);
    expect(result.success).toBe(true);
  });

  test('Multi-language text overlays', async () => {
    const timeline = new Timeline()
      .addVideo('test-assets/hd-video.mp4')
      .addText('English: Hello World!', {
        position: { x: 'center', y: '20%' },
        style: { fontSize: 32, color: '#ffffff' },
        startTime: 0,
        duration: 5
      })
      .addText('Spanish: ¡Hola Mundo!', {
        position: { x: 'center', y: '30%' },
        style: { fontSize: 32, color: '#ffff00' },
        startTime: 0,
        duration: 5
      })
      .addText('Japanese: こんにちは世界！', {
        position: { x: 'center', y: '40%' },
        style: { fontSize: 32, color: '#ff00ff' },
        startTime: 0,
        duration: 5
      })
      .addText('Arabic: مرحبا بالعالم!', {
        position: { x: 'center', y: '50%' },
        style: { fontSize: 32, color: '#00ffff' },
        startTime: 0,
        duration: 5
      });
    
    const command = timeline.getCommand('advanced-output/multi-language.mp4');
    const result = await cassetteManager.executeCommand(command);
    expect(result.success).toBe(true);
  });

  test('Text with advanced formatting and effects', async () => {
    const timeline = new Timeline()
      .addVideo('test-assets/hd-video.mp4')
      .addText('BOLD TITLE WITH EFFECTS', {
        position: { x: 'center', y: '25%' },
        style: {
          fontSize: 56,
          color: '#ffffff',
          fontFamily: 'Arial Black',
          backgroundColor: '#000000@0.8',
          borderWidth: 3,
          borderColor: '#ff0066',
          shadowColor: '#000000',
          shadowOffset: { x: 4, y: 4 }
        },
        startTime: 0,
        duration: 8
      })
      .addText('Subtitle with gradient colors\\nMultiple lines supported', {
        position: { x: 'center', y: '60%' },
        style: {
          fontSize: 28,
          color: '#ffff00',
          fontFamily: 'Arial',
          borderWidth: 1,
          borderColor: '#ffffff'
        },
        startTime: 2,
        duration: 10
      });
    
    const command = timeline.getCommand('advanced-output/formatted-text.mp4');
    const result = await cassetteManager.executeCommand(command);
    expect(result.success).toBe(true);
  });

  test('Scrolling credits text effect', async () => {
    const timeline = new Timeline()
      .addVideo('test-assets/hd-video.mp4')
      .addText('CREDITS\\n\\nDirector: John Doe\\nProducer: Jane Smith\\nEditor: Bob Johnson\\nMusic: Alice Wilson\\n\\nThank you for watching!', {
        position: { x: 'center', y: 'h' }, // Start below screen
        style: {
          fontSize: 32,
          color: '#ffffff',
          fontFamily: 'Arial'
        },
        startTime: 0,
        duration: 12
      })
      .addFilter('drawtext=text=\'SCROLLING CREDITS\':x=(w-text_w)/2:y=h-50*t:fontsize=32:fontcolor=white'); // Scroll effect
    
    const command = timeline.getCommand('advanced-output/scrolling-credits.mp4');
    const result = await cassetteManager.executeCommand(command);
    expect(result.success).toBe(true);
  });
});

describe('🖼️ Complex Image Compositions', () => {
  test('Image slideshow with transitions', async () => {
    const timeline = new Timeline()
      .addVideo('test-assets/hd-video.mp4')
      .addImage('test-assets/complex-image.png', {
        position: { x: 'center', y: 'center' },
        scale: 0.8,
        opacity: 1.0,
        startTime: 0,
        duration: 4
      })
      .addImage('test-assets/complex-image.png', {
        position: { x: 'center', y: 'center' },
        scale: 0.9,
        opacity: 0.0, // Start invisible
        startTime: 3,
        duration: 4
      })
      .addFilter('fade=in:st=3:d=1') // Crossfade effect
      .addFilter('fade=out:st=6:d=1');
    
    const command = timeline.getCommand('advanced-output/image-slideshow.mp4');
    const result = await cassetteManager.executeCommand(command);
    expect(result.success).toBe(true);
  });

  test('Picture-in-picture with multiple images', async () => {
    const timeline = new Timeline()
      .addVideo('test-assets/hd-video.mp4')
      // Main image overlay
      .addImage('test-assets/complex-image.png', {
        position: { x: 'center', y: 'center' },
        scale: 0.6,
        opacity: 0.8
      })
      // Corner thumbnails
      .addImage('test-assets/complex-image.png', {
        position: { x: '5%', y: '5%' },
        scale: 0.15,
        opacity: 0.9
      })
      .addImage('test-assets/complex-image.png', {
        position: { x: '85%', y: '5%' },
        scale: 0.15,
        opacity: 0.9
      })
      .addImage('test-assets/complex-image.png', {
        position: { x: '5%', y: '85%' },
        scale: 0.15,
        opacity: 0.9
      })
      .addImage('test-assets/complex-image.png', {
        position: { x: '85%', y: '85%' },
        scale: 0.15,
        opacity: 0.9
      });
    
    const command = timeline.getCommand('advanced-output/multi-image-pip.mp4');
    const result = await cassetteManager.executeCommand(command);
    expect(result.success).toBe(true);
  });

  test('Image with complex transformations', async () => {
    const timeline = new Timeline()
      .addVideo('test-assets/hd-video.mp4')
      .addImage('test-assets/complex-image.png', {
        position: { x: 'center', y: 'center' },
        scale: 0.5,
        rotation: 15,
        opacity: 0.7
      })
      .addFilter('perspective=x0=0:y0=0:x1=1000:y1=200:x2=800:y2=800:x3=200:y3=600') // Perspective transform
      .addFilter('colorchannelmixer=.3:.4:.3:0:.3:.4:.3:0:.3:.4:.3'); // Color effects
    
    const command = timeline.getCommand('advanced-output/transformed-image.mp4');
    const result = await cassetteManager.executeCommand(command);
    expect(result.success).toBe(true);
  });

  test('Animated image effects', async () => {
    const timeline = new Timeline()
      .addVideo('test-assets/hd-video.mp4')
      .addImage('test-assets/complex-image.png', {
        position: { x: 'center', y: 'center' },
        scale: 0.8
      })
      // Animate zoom effect
      .addFilter('zoompan=z=\'min(zoom+0.0015,1.5)\':d=125:x=iw/2-(iw/zoom/2):y=ih/2-(ih/zoom/2)');
    
    const command = timeline.getCommand('advanced-output/animated-image.mp4');
    const result = await cassetteManager.executeCommand(command);
    expect(result.success).toBe(true);
  });
});

describe('🎛️ Complex Filter Chains', () => {
  test('Cinematic color grading pipeline', async () => {
    const timeline = new Timeline()
      .addVideo('test-assets/hd-video.mp4')
      // Step 1: Color correction
      .addFilter('eq=gamma=1.2:contrast=1.1:brightness=0.02:saturation=0.9')
      // Step 2: Lift/gamma/gain
      .addFilter('curves=r=\'0/0.05 1/0.95\':g=\'0/0.03 1/0.97\':b=\'0/0.07 1/0.93\'')
      // Step 3: Film emulation
      .addFilter('lut3d=file=cinematic.cube') // Would need actual LUT file
      // Step 4: Vignette
      .addFilter('vignette=PI/4')
      // Step 5: Slight grain
      .addFilter('noise=alls=1:allf=t');
    
    const command = timeline.getCommand('advanced-output/cinematic-grade.mp4');
    expect(command).toContain('eq=');
    expect(command).toContain('curves=');
    expect(command).toContain('vignette=');
    
    const result = await cassetteManager.executeCommand(command);
    expect(result.success).toBe(true);
  });

  test('Multi-pass video stabilization and enhancement', async () => {
    const timeline = new Timeline()
      .addVideo('test-assets/hd-video.mp4')
      // Pass 1: Stabilization (simulated)
      .addFilter('deshake=x=64:y=64:w=80:h=60:rx=16:ry=16')
      // Pass 2: Noise reduction
      .addFilter('removegrain=1')
      // Pass 3: Sharpening
      .addFilter('unsharp=5:5:1.0:5:5:0.5')
      // Pass 4: Color enhancement
      .addFilter('eq=contrast=1.1:saturation=1.2');
    
    const command = timeline.getCommand('advanced-output/stabilized-enhanced.mp4');
    const result = await cassetteManager.executeCommand(command);
    expect(result.success).toBe(true);
  });

  test('Artistic style transfer effects', async () => {
    const timeline = new Timeline()
      .addVideo('test-assets/hd-video.mp4')
      // Cartoon effect
      .addFilter('bilateral=sigmaS=80:sigmaR=80')
      .addFilter('edgedetect=low=0.1:high=0.2')
      .addFilter('blend=all_mode=multiply:all_opacity=0.5')
      // Color quantization
      .addFilter('palettegen=stats_mode=single:reserve_transparent=0')
      .addFilter('paletteuse=dither=bayer:bayer_scale=3');
    
    const command = timeline.getCommand('advanced-output/artistic-style.mp4');
    const result = await cassetteManager.executeCommand(command);
    expect(result.success).toBe(true);
  });

  test('Real-time effect automation', async () => {
    const timeline = new Timeline()
      .addVideo('test-assets/hd-video.mp4')
      // Automated brightness changes
      .addFilter('eq=brightness=\'0.1*sin(2*PI*t/5)\'') // Oscillating brightness
      // Automated rotation
      .addFilter('rotate=\'PI*t/10\'') // Slow rotation
      // Automated zoom
      .addFilter('scale=\'1920+200*sin(2*PI*t/3)\':\'1080+200*sin(2*PI*t/3)\'');
    
    const command = timeline.getCommand('advanced-output/automated-effects.mp4');
    const result = await cassetteManager.executeCommand(command);
    expect(result.success).toBe(true);
  });
});

describe('⚡ Performance and Optimization Tests', () => {
  test('High-efficiency encoding with multiple passes', async () => {
    const timeline = new Timeline()
      .addVideo('test-assets/4k-video.mp4')
      .setCodec('libx265') // More efficient codec
      .setPreset('slower') // Better compression
      .setQuality(20) // High quality
      .setBitrate(8000) // 8Mbps target
      .addFilter('scale=3840:2160:flags=lanczos'); // High-quality scaling
    
    const command = timeline.getCommand('advanced-output/high-efficiency.mp4');
    expect(command).toContain('libx265');
    expect(command).toContain('-preset slower');
    expect(command).toContain('-crf 20');
    
    const result = await cassetteManager.executeCommand(command);
    expect(result.success).toBe(true);
  });

  test('Streaming-optimized encoding', async () => {
    const timeline = new Timeline()
      .addVideo('test-assets/hd-video.mp4')
      .setCodec('libx264')
      .setPreset('veryfast') // Fast encoding for streaming
      .setBitrate(2500) // Streaming bitrate
      .setFormat('mp4')
      .addFilter('scale=1280:720:flags=bilinear'); // Fast scaling
    
    const command = timeline.getCommand('advanced-output/streaming-optimized.mp4');
    expect(command).toContain('-preset veryfast');
    expect(command).toContain('-b:v 2500k');
    
    const result = await cassetteManager.executeCommand(command);
    expect(result.success).toBe(true);
  });

  test('Memory-efficient processing of large files', async () => {
    const timeline = new Timeline()
      .addVideo('test-assets/4k-video.mp4')
      .setResolution(1920, 1080) // Downscale to reduce memory
      .setFrameRate(30) // Standard framerate
      .addFilter('scale=1920:1080:flags=fast_bilinear') // Fast scaling
      .setPreset('ultrafast'); // Fastest encoding
    
    const command = timeline.getCommand('advanced-output/memory-efficient.mp4');
    expect(command).toContain('ultrafast');
    expect(command).toContain('fast_bilinear');
    
    const result = await cassetteManager.executeCommand(command);
    expect(result.success).toBe(true);
  });

  test('Parallel processing simulation', async () => {
    // Simulate multiple timelines that could be processed in parallel
    const timelines = [
      new Timeline()
        .addVideo('test-assets/hd-video.mp4', { startTime: 0, duration: 3 })
        .addText('Segment 1'),
      
      new Timeline()
        .addVideo('test-assets/hd-video.mp4', { startTime: 3, duration: 3 })
        .addText('Segment 2'),
      
      new Timeline()
        .addVideo('test-assets/hd-video.mp4', { startTime: 6, duration: 3 })
        .addText('Segment 3')
    ];
    
    const commands = timelines.map((timeline, index) => 
      timeline.getCommand(`advanced-output/parallel-${index}.mp4`)
    );
    
    // Process all in parallel
    const results = await Promise.all(
      commands.map(command => cassetteManager.executeCommand(command))
    );
    
    results.forEach(result => {
      expect(result.success).toBe(true);
    });
  });
});
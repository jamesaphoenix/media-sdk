# Media SDK API Documentation

## Core Timeline API

The Timeline class provides a fluent, immutable API for building video and image compositions.

### Creating a Timeline

```typescript
import { Timeline } from '@jamesaphoenix/media-sdk';

// Create an empty timeline
const timeline = new Timeline();

// All methods return a new Timeline instance (immutable)
const newTimeline = timeline.addVideo('input.mp4');
console.log(timeline === newTimeline); // false
```

### Core Methods

#### Video Operations

##### `addVideo(path: string, options?: VideoOptions): Timeline`

Adds a video layer to the timeline.

```typescript
timeline.addVideo('input.mp4', {
  position: 10,      // Start at 10 seconds
  duration: 30,      // Play for 30 seconds
  volume: 0.8,       // 80% volume
  startTime: 5,      // Start from 5s in the video
  endTime: 35        // End at 35s in the video
});
```

#### Text Operations

##### `addText(text: string, options?: TextOptions): Timeline`

Adds text overlay to the timeline.

```typescript
timeline.addText('Hello World', {
  position: { x: '50%', y: '90%', anchor: 'bottom-center' },
  style: {
    fontSize: 48,
    color: '#ffffff',
    strokeColor: '#000000',
    strokeWidth: 3,
    fontFamily: 'Arial',
    fontStyle: 'bold',
    textAlign: 'center',
    background: {
      color: 'rgba(0,0,0,0.7)',
      padding: 20,
      borderRadius: 10
    }
  },
  duration: 5,
  startTime: 0
});
```

**Position Values:**
- Pixels: `{ x: 100, y: 200 }`
- Percentages: `{ x: '50%', y: '80%' }`
- Named positions: `'center'`, `'top'`, `'bottom'`, `'left'`, `'right'`, `'top-left'`, etc.

**Anchor Points:**
- `'top-left'`, `'top-center'`, `'top-right'`
- `'center-left'`, `'center'`, `'center-right'`
- `'bottom-left'`, `'bottom-center'`, `'bottom-right'`

#### Image Operations

##### `addImage(path: string, options?: ImageOptions): Timeline`

Adds an image overlay or uses image as base layer.

```typescript
// As overlay
timeline.addImage('logo.png', {
  position: { x: '95%', y: '5%', anchor: 'top-right' },
  width: 100,
  height: 100,
  opacity: 0.8
});

// As base layer (no video)
new Timeline()
  .addImage('background.jpg', { duration: 5 })
  .addText('Caption', { position: 'center' });
```

##### `addWatermark(path: string, options?: Partial<ImageOptions>): Timeline`

Convenience method for adding watermarks.

```typescript
timeline.addWatermark('logo.png', {
  position: 'bottom-right',
  opacity: 0.5,
  width: 150
});
```

#### Audio Operations

##### `addAudio(path: string, options?: AudioOptions): Timeline`

Adds audio track to the timeline with advanced layering and effects support.

```typescript
// Basic audio addition
timeline.addAudio('music.mp3', {
  volume: 0.5,
  startTime: 2,
  duration: 30
});

// Audio with fade effects
timeline.addAudio('intro.mp3', {
  volume: 0.8,
  fadeIn: 2,
  fadeOut: 3,
  startTime: 0,
  duration: 10
});

// Audio with trimming
timeline.addAudio('longtrack.mp3', {
  trimStart: 30,    // Start from 30s in the file
  trimEnd: 90,      // End at 90s in the file
  startTime: 5,     // Place at 5s in timeline
  volume: 0.6
});

// Audio with effects
timeline.addAudio('voice.mp3', {
  pitch: 1.2,       // Higher pitch (1.2x)
  tempo: 0.9,       // Slower tempo (0.9x)
  highpass: 100,    // Remove frequencies below 100Hz
  lowpass: 3000,    // Remove frequencies above 3kHz
  echo: { delay: 500, decay: 0.3 },
  reverb: { room: 0.5, damping: 0.2 }
});

// Looping audio
timeline.addAudio('beat.wav', {
  loop: true,
  duration: 60,     // Loop for 60 seconds
  volume: 0.4
});
```

**Audio Options:**
- `volume`: Audio level (0-1 or higher)
- `startTime`: When to start playing in the timeline
- `duration`: How long to play
- `fadeIn`/`fadeOut`: Fade duration in seconds
- `trimStart`/`trimEnd`: Trim source audio
- `pitch`: Pitch adjustment (1.0 = normal)
- `tempo`: Speed adjustment (1.0 = normal)
- `lowpass`/`highpass`: Frequency filters (Hz)
- `echo`: Echo effect with delay (ms) and decay
- `reverb`: Reverb effect with room size and damping
- `loop`: Loop the audio for the specified duration

**Multi-layer Audio Example:**

```typescript
// Create a podcast-style mix
const podcast = new Timeline()
  .addVideo('interview.mp4')
  // Intro music
  .addAudio('intro-music.mp3', {
    volume: 0.8,
    startTime: 0,
    duration: 5,
    fadeOut: 2
  })
  // Background music bed
  .addAudio('background.mp3', {
    volume: 0.15,
    startTime: 3,
    duration: 300,
    lowpass: 2000  // Muffle for background
  })
  // Main voiceover
  .addAudio('voiceover.mp3', {
    volume: 1.0,
    startTime: 3,
    highpass: 80,   // Clean up low frequencies
    fadeIn: 0.5
  })
  // Sound effects
  .addAudio('transition.wav', {
    volume: 0.7,
    startTime: 120,
    echo: { delay: 200, decay: 0.3 }
  });
```

**Audio Ducking Example:**

```typescript
// Automatically duck background music for voiceover
const timeline = new Timeline()
  .addVideo('video.mp4')
  // Background music - normal volume
  .addAudio('music.mp3', {
    volume: 0.8,
    startTime: 0,
    duration: 10
  })
  // Background music - ducked volume
  .addAudio('music.mp3', {
    volume: 0.2,
    startTime: 10,
    duration: 20,
    trimStart: 10,
    trimEnd: 30
  })
  // Voiceover during ducked section
  .addAudio('voiceover.mp3', {
    volume: 1.0,
    startTime: 10,
    duration: 20
  })
  // Background music - return to normal
  .addAudio('music.mp3', {
    volume: 0.8,
    startTime: 30,
    duration: 10,
    trimStart: 30
  });
```

#### Transformation Operations

##### `setAspectRatio(ratio: string): Timeline`

Sets the output aspect ratio.

```typescript
timeline.setAspectRatio('16:9');  // Widescreen
timeline.setAspectRatio('9:16');  // Vertical (TikTok)
timeline.setAspectRatio('1:1');   // Square (Instagram)
timeline.setAspectRatio('4:3');   // Traditional
```

##### `trim(startTime: number, endTime: number): Timeline`

Trims the timeline to a specific time range.

```typescript
timeline.trim(10, 40); // Keep only 10s to 40s
```

##### `setDuration(duration: number): Timeline`

Sets the total duration of the timeline.

```typescript
timeline.setDuration(30); // Exactly 30 seconds
```

#### Filter Operations

##### `addFilter(name: string, options?: FilterOptions): Timeline`

Adds a video filter to the timeline.

```typescript
timeline
  .addFilter('brightness', { brightness: 0.2 })
  .addFilter('contrast', { contrast: 1.2 })
  .addFilter('blur', { radius: 5 });
```

#### Output Operations

##### `getCommand(outputPath: string): string`

Generates the FFmpeg command without executing.

```typescript
const command = timeline.getCommand('output.mp4');
console.log(command);
// ffmpeg -i input.mp4 -filter_complex ...
```

##### `render(outputPath: string, options?: RenderOptions): Promise<ExecutionResult>`

Renders the timeline to a file.

```typescript
const result = await timeline.render('output.mp4', {
  overwrite: true,
  preset: 'fast',
  crf: 23,
  onProgress: (progress) => {
    console.log(`Progress: ${progress.percent}%`);
  }
});
```

## Image Generation API

Generate static images with text overlays.

### Single Image Generation

```typescript
import { generateImageWithCaption } from '@jamesaphoenix/media-sdk';

const command = generateImageWithCaption(
  'background.jpg',
  'Hello World!',
  'output.jpg',
  {
    position: { x: '50%', y: '90%', anchor: 'bottom-center' },
    style: {
      fontSize: 48,
      color: '#ffffff',
      strokeColor: '#000000',
      strokeWidth: 3
    },
    format: {
      quality: 95  // JPEG quality
    }
  }
);
```

### Batch Image Generation

```typescript
import { generateImageBatch } from '@jamesaphoenix/media-sdk';

const images = [
  { imagePath: 'bg1.jpg', caption: 'First Image' },
  { imagePath: 'bg2.jpg', caption: 'Second Image' },
  { imagePath: 'bg3.jpg', caption: 'Third Image' }
];

const results = generateImageBatch(images, 'output/', {
  format: 'jpg',
  quality: 90
});
```

### Slideshow Creation

```typescript
import { createSlideshow } from '@jamesaphoenix/media-sdk';

const images = [
  { imagePath: 'slide1.jpg', caption: 'Welcome' },
  { imagePath: 'slide2.jpg', caption: 'Our Story' },
  { imagePath: 'slide3.jpg', caption: 'Thank You' }
];

const command = createSlideshow(images, 'slideshow.mp4', {
  slideDuration: 3,
  transition: 'fade',
  transitionDuration: 0.5
});
```

### Social Media Formats

```typescript
import {
  createInstagramPost,
  createTikTokThumbnail,
  createMeme,
  createQuoteCard
} from '@jamesaphoenix/media-sdk';

// Instagram square post
createInstagramPost('photo.jpg', 'Check out my post!', 'instagram.jpg');

// TikTok vertical thumbnail
createTikTokThumbnail('frame.jpg', 'VIRAL CONTENT!', 'tiktok.jpg');

// Classic meme format
createMeme('drake.jpg', 'Writing tests', 'Tests passing', 'meme.jpg');

// Quote card with author
createQuoteCard(
  'nature.jpg',
  'Be the change you wish to see',
  'Gandhi',
  'quote.jpg'
);
```

## Effect Functions

Functional composition helpers for common effects.

```typescript
import { fadeIn, fadeOut, brightness, blur } from '@jamesaphoenix/media-sdk';

// Apply effects using pipe
timeline
  .pipe(fadeIn(1.0))
  .pipe(brightness(0.2))
  .pipe(blur(5))
  .pipe(fadeOut(1.0));
```

### Available Effects

- **Transitions**: `fadeIn`, `fadeOut`, `crossfade`
- **Color**: `brightness`, `contrast`, `saturation`, `hue`, `gamma`
- **Blur**: `blur`, `gaussianBlur`, `motionBlur`
- **Style**: `grayscale`, `sepia`, `invert`, `vignette`
- **Creative**: `filmGrain`, `vintage`, `cinematic`, `noir`
- **Transform**: `scale`, `crop`, `rotate`, `flip`
- **Time**: `speed`, `reverse`
- **Audio**: `volumeAdjust`, `audioFadeIn`, `audioFadeOut`

## Platform Presets

Quick helpers for social media formats.

```typescript
import { tiktok, instagram, youtube } from '@jamesaphoenix/media-sdk';

// TikTok vertical video
const tiktokVideo = tiktok('input.mp4')
  .addText('Viral Content! 🔥', { position: 'center' })
  .render('tiktok.mp4');

// Instagram square video
const instagramVideo = instagram('input.mp4')
  .addText('Double tap if you agree!', { position: 'bottom' })
  .render('instagram.mp4');

// YouTube landscape video
const youtubeVideo = youtube('input.mp4')
  .addText('LIKE AND SUBSCRIBE!', {
    position: 'top',
    style: { fontSize: 72, color: '#ff0000' }
  })
  .render('youtube.mp4');
```

## Type-Safe Query API

Alternative API with enhanced type safety.

```typescript
import { createVideoQuery } from '@jamesaphoenix/media-sdk';

const query = createVideoQuery({
  source: 'input.mp4',
  platform: 'tiktok',
  text: {
    content: 'Hello TikTok!',
    position: 'center',
    style: {
      fontSize: 64,
      color: '#ff0050'
    }
  },
  effects: ['fadeIn', 'fadeOut'],
  output: 'tiktok.mp4'
});

await query.execute();
```

## Error Handling

All methods validate inputs and provide clear error messages.

```typescript
try {
  await timeline.render('output.mp4');
} catch (error) {
  if (error.code === 'ENOENT') {
    console.error('Input file not found');
  } else if (error.code === 'FFMPEG_ERROR') {
    console.error('FFmpeg error:', error.message);
  }
}
```

## Best Practices

1. **Immutability**: Timeline methods return new instances
   ```typescript
   const t1 = new Timeline();
   const t2 = t1.addVideo('video.mp4');
   console.log(t1 === t2); // false
   ```

2. **Method Chaining**: All methods are chainable
   ```typescript
   timeline
     .addVideo('input.mp4')
     .addText('Title', { position: 'top' })
     .addWatermark('logo.png')
     .render('output.mp4');
   ```

3. **Percentage Positioning**: Use percentages for responsive layouts
   ```typescript
   timeline.addText('Centered', {
     position: { x: '50%', y: '50%', anchor: 'center' }
   });
   ```

4. **Error Recovery**: Handle errors gracefully
   ```typescript
   const result = await timeline.render('output.mp4').catch(err => {
     console.error('Render failed:', err);
     return null;
   });
   ```

## Performance Tips

1. **Batch Operations**: Process multiple files together
   ```typescript
   const batch = generateImageBatch(images, 'output/');
   ```

2. **Reuse Timelines**: Create base timelines and extend them
   ```typescript
   const base = new Timeline()
     .addWatermark('logo.png')
     .setAspectRatio('16:9');
   
   const video1 = base.addVideo('video1.mp4');
   const video2 = base.addVideo('video2.mp4');
   ```

3. **Command Generation**: Generate commands without executing for debugging
   ```typescript
   const command = timeline.getCommand('output.mp4');
   console.log(command); // Inspect before running
   ```
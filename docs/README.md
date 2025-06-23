# Media SDK Documentation

Declarative, AI-friendly API for video manipulation using FFmpeg.

## Quick Start

```typescript
import { Timeline } from '@jamesaphoenix/media-sdk';

const timeline = new Timeline()
  .addVideo('input.mp4')
  .addText('Hello World!')
  .getCommand('output.mp4');
```

## Installation

```bash
npm install @jamesaphoenix/media-sdk
```

FFmpeg must be installed and available in PATH.

## Core Concepts

### Timeline

Timeline is the main class for building video compositions. All operations are immutable and chainable.

```typescript
const timeline = new Timeline()
  .addVideo('video.mp4')
  .addAudio('music.mp3')
  .addText('Title')
  .setDuration(30);
```

### Functional Composition

Use `.pipe()` for advanced operations that return different types.

```typescript
const result = timeline
  .pipe(t => PictureInPicture.add(t, 'overlay.mp4'))
  .pipe(t => AudioDucking.addDucking(t, { duckingLevel: 0.2 }));
```

## Video Operations

### Adding Video

```typescript
// Basic video
timeline.addVideo('input.mp4')

// With options
timeline.addVideo('input.mp4', {
  startTime: 2,
  duration: 10,
  trimStart: 1,
  trimEnd: 9
})
```

### Resolution and Aspect Ratio

```typescript
// Set resolution
timeline.setResolution(1920, 1080)

// Set aspect ratio
timeline.setAspectRatio('16:9')
timeline.setAspectRatio('9:16') // TikTok/Instagram
timeline.setAspectRatio('1:1')  // Instagram Square
```

### Cropping

```typescript
// Crop to specific dimensions
timeline.crop(x, y, width, height)

// Center crop for aspect ratio
timeline.crop(420, 0, 1080, 1920) // 16:9 to 9:16
```

### Frame Rate and Quality

```typescript
timeline
  .setFrameRate(30)
  .setCodec('libx264')
  .setQuality(23)        // CRF value
  .setBitrate(2000)      // kbps
  .setPreset('medium')   // encoding speed
```

## Audio Operations

### Adding Audio

```typescript
// Basic audio
timeline.addAudio('music.mp3')

// With options
timeline.addAudio('music.mp3', {
  volume: 0.5,
  startTime: 2,
  duration: 10,
  fadeIn: 1,
  fadeOut: 2,
  pan: -0.5  // -1 (left) to 1 (right)
})
```

### Multi-track Audio

```typescript
timeline
  .addAudio('voice.mp3', { volume: 1.0 })
  .addAudio('music.mp3', { volume: 0.3 })
  .addAudio('effects.mp3', { volume: 0.5, startTime: 10 })
```

### Audio Configuration

```typescript
timeline.addAudio('mono.mp3', {
  channels: 2,        // Convert mono to stereo
  sampleRate: 48000   // Set sample rate
})
```

## Text Overlays

### Basic Text

```typescript
timeline.addText('Hello World!')

// With positioning
timeline.addText('Centered Text', {
  position: { x: 'center', y: 'center' }
})

// With timing
timeline.addText('Timed Text', {
  startTime: 5,
  duration: 10
})
```

### Text Styling

```typescript
timeline.addText('Styled Text', {
  style: {
    fontSize: 48,
    color: '#ffffff',
    fontFamily: 'Arial Bold',
    backgroundColor: '#000000',
    borderWidth: 2,
    borderColor: '#ff0000',
    shadowColor: '#000000',
    shadowOffset: { x: 2, y: 2 }
  }
})
```

### Advanced Positioning

```typescript
// Percentage positioning
timeline.addText('Top Center', {
  position: { x: 'center', y: '10%' }
})

// Pixel positioning
timeline.addText('Bottom Right', {
  position: { x: 1800, y: 1000 }
})

// Named positions
timeline.addText('Corner', {
  position: { x: 'right', y: 'bottom' }
})
```

### Multi-line Text

```typescript
timeline.addText('Line 1\\nLine 2\\nLine 3', {
  position: { x: 'center', y: 'center' }
})
```

## Image Overlays

### Basic Images

```typescript
timeline.addImage('logo.png')

// With positioning and scaling
timeline.addImage('logo.png', {
  position: { x: '90%', y: '10%' },
  scale: 0.2,
  opacity: 0.8
})
```

### Image Transformations

```typescript
timeline.addImage('image.png', {
  scale: 0.5,
  rotation: 45,
  opacity: 0.7,
  startTime: 2,
  duration: 8
})
```

### Watermarks

```typescript
timeline.addImage('watermark.png', {
  position: { x: '95%', y: '5%' },
  scale: 0.1,
  opacity: 0.6
})
```

## Filters and Effects

### Basic Filters

```typescript
timeline.addFilter('brightness=0.2')
timeline.addFilter('contrast=1.2')
timeline.addFilter('saturation=1.5')
```

### Chaining Filters

```typescript
timeline
  .addFilter('brightness=0.1')
  .addFilter('contrast=1.1')
  .addFilter('saturation=1.3')
  .addFilter('blur=2')
```

### Color Correction

```typescript
timeline.addFilter('eq=gamma=1.2:contrast=1.1:brightness=0.05:saturation=1.3')
```

### Fade Effects

```typescript
timeline
  .addFilter('fade=in:duration=2')
  .addFilter('fade=out:start_time=8:duration=2')
```

## Advanced Features

### Video Splicing

```typescript
import { VideoSplicer } from '@jamesaphoenix/media-sdk';

// Extract segment
const segment = VideoSplicer.extractSegment(timeline, 10, 20);

// Remove segment
const edited = VideoSplicer.removeSegment(timeline, 5, 15);

// Splice multiple segments
const spliced = VideoSplicer.splice({
  segments: [
    { source: 'clip1.mp4', startTime: 0, endTime: 5 },
    { source: 'clip2.mp4', startTime: 10, endTime: 15 },
    { source: 'clip3.mp4', startTime: 20, endTime: 25 }
  ],
  defaultTransitionDuration: 0.5
});
```

### Highlight Reels

```typescript
const highlights = VideoSplicer.createHighlightReel(timeline, [
  { time: 10, duration: 5, priority: 'high' },
  { time: 30, duration: 3, priority: 'medium' },
  { time: 60, duration: 4, priority: 'high' }
], {
  maxDuration: 15,
  sortByPriority: true
});
```

### Picture-in-Picture

```typescript
import { PictureInPicture } from '@jamesaphoenix/media-sdk';

// Basic PiP
const pip = PictureInPicture.add(timeline, 'overlay.mp4', {
  position: 'bottom-right',
  scale: 0.3
});

// Advanced PiP with effects
const advanced = PictureInPicture.add(timeline, 'reaction.mp4', {
  position: 'bottom-right',
  scale: 0.25,
  borderRadius: 999,  // Circular
  shadow: true,
  animation: 'zoom-in',
  opacity: 0.9
});
```

### Reaction Layouts

```typescript
const reaction = PictureInPicture.createReactionLayout(
  'main-content.mp4',
  'reaction.mp4',
  {
    reactionPosition: 'bottom-right',
    reactionScale: 0.3,
    reactionShape: 'circle'
  }
);
```

### Multiple PiP

```typescript
const multiPip = PictureInPicture.addMultiple(timeline, {
  videos: [
    { source: 'cam1.mp4', options: { position: 'top-left', scale: 0.2 } },
    { source: 'cam2.mp4', options: { position: 'top-right', scale: 0.2 } },
    { source: 'cam3.mp4', options: { position: 'bottom-left', scale: 0.2 } }
  ],
  layout: 'grid'
});
```

### Audio Ducking

```typescript
import { AudioDucking } from '@jamesaphoenix/media-sdk';

// Basic ducking
const ducked = AudioDucking.addDucking(timeline, {
  duckingLevel: 0.3,
  fadeInTime: 0.5,
  fadeOutTime: 1.0,
  duckingRegions: [
    { start: 10, end: 20 },
    { start: 30, end: 40 }
  ]
});
```

### Sidechain Compression

```typescript
const sidechain = AudioDucking.addDucking(timeline, {
  detectionMode: 'sidechain',
  duckingLevel: 0.2,
  compressorRatio: 4
});
```

### Professional Audio Mixes

```typescript
// Dialogue mix
const dialogue = AudioDucking.createDialogueMix(timeline, {
  dialogueTrack: 'voice.mp3',
  musicTrack: 'background.mp3',
  dialogueBoost: 1.5,
  musicDuckLevel: 0.2
});

// Podcast mix
const podcast = AudioDucking.createPodcastMix(timeline, {
  hosts: ['host1.mp3', 'host2.mp3'],
  music: 'intro.mp3',
  musicSegments: [
    { start: 0, end: 5 },    // Intro
    { start: 55, end: 60 }   // Outro
  ],
  introOutroDucking: 0.7,
  normalDucking: 0.1
});
```

## Platform Presets

### TikTok

```typescript
const tiktok = new Timeline()
  .addVideo('content.mp4')
  .setAspectRatio('9:16')
  .setDuration(15)
  .addText('Viral Text! 🔥', {
    position: { x: 'center', y: '20%' },
    style: { fontSize: 48, color: '#ffffff' }
  });
```

### YouTube Shorts

```typescript
const short = new Timeline()
  .addVideo('content.mp4')
  .setAspectRatio('9:16')
  .setDuration(60)
  .addText('YouTube Short', {
    position: { x: 'center', y: '10%' },
    style: { fontSize: 42, color: '#ff0000' }
  });
```

### Instagram Stories

```typescript
const story = new Timeline()
  .addVideo('content.mp4')
  .setAspectRatio('9:16')
  .setDuration(15)
  .addText('Story Text', {
    position: { x: 'center', y: '85%' },
    style: { fontSize: 32, color: '#ffffff' }
  });
```

### Standard YouTube

```typescript
const youtube = new Timeline()
  .addVideo('content.mp4')
  .setAspectRatio('16:9')
  .setResolution(1920, 1080)
  .setFrameRate(30);
```

## Real-World Examples

### TikTok Reaction Video

```typescript
const tiktokReaction = new Timeline()
  .addVideo('main-content.mp4')
  .setAspectRatio('9:16')
  .setDuration(15)
  
  // Add reaction PiP
  .pipe(t => PictureInPicture.add(t, 'reaction.mp4', {
    position: 'bottom-right',
    scale: 0.3,
    borderRadius: 999,
    shadow: true,
    animation: 'zoom-in'
  }))
  
  // Background music with ducking
  .addAudio('music.mp3', { volume: 0.6 })
  .pipe(t => AudioDucking.addDucking(t, {
    duckingLevel: 0.2,
    duckingRegions: [{ start: 2, end: 8 }]
  }))
  
  // Viral text overlays
  .addText('Wait for it... 👀', {
    position: { x: 'center', y: '15%' },
    style: { fontSize: 48, color: '#ffffff' },
    startTime: 0,
    duration: 3
  })
  .addText('OMG!! 😱🔥', {
    position: { x: 'center', y: '15%' },
    style: { fontSize: 64, color: '#ff0066' },
    startTime: 8,
    duration: 2
  });
```

### Gaming Highlight Reel

```typescript
const highlights = VideoSplicer.createHighlightReel(
  new Timeline().addVideo('gameplay.mp4'),
  [
    { time: 10, duration: 8, priority: 'high' },   // Epic moment
    { time: 45, duration: 6, priority: 'high' },   // Another highlight
    { time: 90, duration: 5, priority: 'medium' }  // Good play
  ],
  { maxDuration: 30, sortByPriority: true }
)
.pipe(t => PictureInPicture.createWebcamOverlay(t, 'webcam.mp4', {
  shape: 'rounded',
  position: 'bottom-left',
  scale: 0.2
}))
.addAudio('epic-music.mp3', { volume: 0.8 })
.pipe(t => AudioDucking.addDucking(t, {
  detectionMode: 'sidechain',
  duckingLevel: 0.15
}))
.addText('BEST MOMENTS', {
  position: { x: 'center', y: '10%' },
  style: { fontSize: 48, color: '#ffff00' }
});
```

### Podcast Clip

```typescript
const podcastClip = new Timeline()
  .addVideo('interview.mp4')
  .setDuration(60)
  
  // Professional audio mix
  .pipe(t => AudioDucking.createPodcastMix(t, {
    hosts: ['host-audio.mp3'],
    music: 'intro-music.mp3',
    musicSegments: [
      { start: 0, end: 5 },   // Intro
      { start: 55, end: 60 }  // Outro
    ],
    introOutroDucking: 0.7,
    normalDucking: 0.1
  }))
  
  // Show graphics
  .addText('THE PRODUCTIVITY PODCAST', {
    position: { x: 'center', y: '15%' },
    style: { fontSize: 36, color: '#ffffff' },
    duration: 5
  })
  
  // Episode info
  .addText('EP. 42: "Time Management Secrets"', {
    position: { x: 'center', y: '25%' },
    style: { fontSize: 24, color: '#cccccc' },
    duration: 5
  })
  
  // Key quote
  .addText('"The secret is managing energy,\\nnot time"', {
    position: { x: 'center', y: 'center' },
    style: { fontSize: 32, color: '#00ffff' },
    startTime: 20,
    duration: 8
  });
```

### Educational Tutorial

```typescript
const tutorial = VideoSplicer.splice({
  segments: [
    { source: 'intro.mp4', startTime: 0, endTime: 10, transition: 'fade' },
    { source: 'step1.mp4', startTime: 0, endTime: 20, transition: 'dissolve' },
    { source: 'step2.mp4', startTime: 0, endTime: 15, transition: 'fade' }
  ],
  defaultTransitionDuration: 1.0
})
.addText('TUTORIAL: Getting Started', {
  position: { x: 'center', y: '10%' },
  style: { fontSize: 42, color: '#ffffff' },
  startTime: 0,
  duration: 5
})
.addText('Step 1: Setup', {
  position: { x: 'center', y: '20%' },
  style: { fontSize: 32, color: '#00ff00' },
  startTime: 10,
  duration: 20
})
.addText('Step 2: Configuration', {
  position: { x: 'center', y: '20%' },
  style: { fontSize: 32, color: '#00ff00' },
  startTime: 30,
  duration: 15
})
.addAudio('tutorial-music.mp3', { volume: 0.3 })
.pipe(t => AudioDucking.addDucking(t, {
  duckingLevel: 0.1,
  duckingRegions: [
    { start: 5, end: 25 },
    { start: 30, end: 42 }
  ]
}));
```

## Error Handling

### Validation

Timeline operations include built-in validation. Invalid parameters will throw descriptive errors.

```typescript
try {
  const timeline = new Timeline()
    .addVideo('input.mp4')
    .setDuration(-5); // Invalid duration
} catch (error) {
  console.error('Timeline error:', error.message);
}
```

### FFmpeg Command Generation

Commands are validated before execution.

```typescript
const timeline = new Timeline()
  .addVideo('input.mp4');

const command = timeline.getCommand('output.mp4');
console.log('Generated command:', command);
```

## Type Safety

### TypeScript Support

Media SDK provides complete TypeScript definitions.

```typescript
import { Timeline, VideoOptions, AudioOptions, TextOptions } from '@jamesaphoenix/media-sdk';

const videoOptions: VideoOptions = {
  startTime: 0,
  duration: 30,
  trimStart: 2,
  trimEnd: 28
};

const audioOptions: AudioOptions = {
  volume: 0.5,
  fadeIn: 1,
  fadeOut: 2
};

const textOptions: TextOptions = {
  position: { x: 'center', y: 'center' },
  style: { fontSize: 48, color: '#ffffff' }
};
```

### Interface Definitions

```typescript
interface VideoOptions {
  startTime?: number;
  duration?: number;
  trimStart?: number;
  trimEnd?: number;
}

interface AudioOptions {
  volume?: number;
  pan?: number;
  fadeIn?: number;
  fadeOut?: number;
  startTime?: number;
  duration?: number;
  sampleRate?: number;
  channels?: number;
}

interface TextStyle {
  fontSize?: number;
  color?: string;
  fontFamily?: string;
  backgroundColor?: string;
  borderWidth?: number;
  borderColor?: string;
  shadowColor?: string;
  shadowOffset?: { x: number; y: number };
}
```

## Testing

### Runtime Testing

Media SDK includes comprehensive runtime testing with real FFmpeg execution.

```typescript
import { Timeline } from '@jamesaphoenix/media-sdk';

const timeline = new Timeline()
  .addVideo('test-input.mp4')
  .addText('Test Text')
  .setDuration(10);

const command = timeline.getCommand('test-output.mp4');
// Execute with your preferred FFmpeg runner
```

### Validation Testing

Built-in validation ensures commands are syntactically correct.

```typescript
const timeline = new Timeline()
  .addVideo('input.mp4');

// This will validate the generated FFmpeg command
const isValid = timeline.validate();
console.log('Command is valid:', isValid);
```

## Performance

### Command Optimization

Timeline automatically optimizes FFmpeg commands for performance.

```typescript
const optimized = new Timeline()
  .addVideo('input.mp4')
  .setPreset('ultrafast')  // Fastest encoding
  .setQuality(28);         // Balanced quality
```

### Memory Management

Use streaming-friendly settings for large files.

```typescript
const streaming = new Timeline()
  .addVideo('large-file.mp4')
  .setCodec('libx264')
  .setBitrate(2500)        // Streaming bitrate
  .setPreset('veryfast');  // Fast encoding
```

## Troubleshooting

### Common Issues

**FFmpeg not found**: Ensure FFmpeg is installed and in PATH.

```bash
# Test FFmpeg installation
ffmpeg -version
```

**Invalid aspect ratio**: Use standard ratios or decimal values.

```typescript
// Correct
timeline.setAspectRatio('16:9')
timeline.setAspectRatio('9:16')

// Also correct
timeline.setAspectRatio(1.777) // 16:9 as decimal
```

**Text encoding issues**: Use UTF-8 encoding for special characters.

```typescript
timeline.addText('Special chars: àáâãäå', {
  style: { fontFamily: 'Arial Unicode MS' }
})
```

### Debug Mode

Enable verbose logging for debugging.

```typescript
const timeline = new Timeline({ debug: true })
  .addVideo('input.mp4');

const command = timeline.getCommand('output.mp4');
console.log('Debug command:', command);
```

## Migration Guide

### From v0.x to v1.x

The API has been stabilized with breaking changes.

**Old API:**
```typescript
const timeline = new Timeline('input.mp4')
  .text('Hello', { x: 100, y: 100 });
```

**New API:**
```typescript
const timeline = new Timeline()
  .addVideo('input.mp4')
  .addText('Hello', { position: { x: 100, y: 100 } });
```

### Functional Composition

Use `.pipe()` for operations that return different types.

**Old API:**
```typescript
const result = PictureInPicture.add(timeline, 'overlay.mp4');
```

**New API:**
```typescript
const result = timeline.pipe(t => PictureInPicture.add(t, 'overlay.mp4'));
```

## API Reference

### Timeline Class

#### Constructor

```typescript
new Timeline()
```

#### Video Methods

```typescript
addVideo(source: string, options?: VideoOptions): Timeline
setResolution(width: number, height: number): Timeline
setAspectRatio(ratio: string): Timeline
setFrameRate(fps: number): Timeline
setCodec(codec: string): Timeline
setQuality(crf: number): Timeline
setBitrate(kbps: number): Timeline
setPreset(preset: string): Timeline
crop(x: number, y: number, width: number, height: number): Timeline
```

#### Audio Methods

```typescript
addAudio(source: string, options?: AudioOptions): Timeline
```

#### Text Methods

```typescript
addText(text: string, options?: TextOptions): Timeline
```

#### Image Methods

```typescript
addImage(source: string, options?: ImageOptions): Timeline
```

#### Filter Methods

```typescript
addFilter(filter: string): Timeline
```

#### Configuration Methods

```typescript
setDuration(seconds: number): Timeline
setFormat(format: string): Timeline
```

#### Utility Methods

```typescript
pipe<T>(fn: (timeline: Timeline) => T): T
getCommand(output: string): string
validate(): boolean
```

### VideoSplicer Class

#### Static Methods

```typescript
static extractSegment(timeline: Timeline, start: number, end: number): Timeline
static removeSegment(timeline: Timeline, start: number, end: number): Timeline
static splice(options: SpliceOptions): Timeline
static createHighlightReel(timeline: Timeline, highlights: Highlight[], options?: HighlightOptions): Timeline
```

### PictureInPicture Class

#### Static Methods

```typescript
static add(timeline: Timeline, source: string, options?: PiPOptions): Timeline
static addMultiple(timeline: Timeline, options: MultiPiPOptions): Timeline
static createReactionLayout(main: string, reaction: string, options?: ReactionOptions): Timeline
static createWebcamOverlay(timeline: Timeline, webcam: string, options?: WebcamOptions): Timeline
```

### AudioDucking Class

#### Static Methods

```typescript
static addDucking(timeline: Timeline, options?: DuckingOptions): Timeline
static createDialogueMix(timeline: Timeline, options: DialogueOptions): Timeline
static createPodcastMix(timeline: Timeline, options: PodcastOptions): Timeline
static createMusicBed(timeline: Timeline, options: MusicBedOptions): Timeline
```

## Contributing

### Development Setup

```bash
git clone https://github.com/jamesaphoenix/media-sdk.git
cd media-sdk
pnpm install
pnpm build
pnpm test
```

### Running Tests

```bash
# Unit tests
pnpm test

# Runtime tests
pnpm runtime:test

# Specific test suites
pnpm runtime:test:core-primitives
pnpm runtime:test:new-features
pnpm runtime:test:edge-cases
pnpm runtime:test:real-world
```

### Contributing Guidelines

1. Fork the repository
2. Create a feature branch
3. Add tests for new functionality
4. Ensure all tests pass
5. Submit a pull request

### Code Style

Use TypeScript with strict mode enabled. Follow the existing code style and patterns.

```typescript
// Good
const timeline = new Timeline()
  .addVideo('input.mp4')
  .addText('Hello World!');

// Bad
const timeline = new Timeline().addVideo('input.mp4').addText('Hello World!');
```
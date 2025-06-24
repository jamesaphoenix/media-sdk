# Media SDK

[![npm version](https://badge.fury.io/js/%40jamesaphoenix%2Fmedia-sdk.svg)](https://badge.fury.io/js/%40jamesaphoenix%2Fmedia-sdk)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Media SDK CI](https://github.com/jamesaphoenix/media-sdk/workflows/Media%20SDK%20CI/badge.svg)](https://github.com/jamesaphoenix/media-sdk/actions)

> **Declarative, AI-friendly API for video manipulation using FFmpeg**

Media SDK is a revolutionary video editing library that focuses on functional composition patterns and real-world video rendering. It's designed specifically for AI agents and developers who need predictable, high-quality video generation at scale.

## 🌟 Features

### 🧬 **Self-Healing SDK Pattern**
- **Declarative API**: Describe what you want, not how to do it
- **Type Safety**: Prevents runtime errors in generated code
- **Platform Awareness**: Built-in knowledge of TikTok, Instagram, YouTube requirements
- **Self-Validating**: Automatic quality checking prevents bad outputs
- **Vision Integration**: AI-powered quality validation using Gemini Vision API

### 🎬 **Core Video Operations**
- **Video Splicing**: Extract, remove, and join video segments with transitions
- **Picture-in-Picture**: Advanced overlay system with animations and effects
- **Audio Ducking**: Automatic background music reduction during voice
- **Smart Captions**: TikTok-style animated text with word highlighting
- **Platform Presets**: One-click optimization for social media platforms

### 🚀 **Advanced Features**
- **Functional Composition**: Immutable, chainable API
- **Real FFmpeg Execution**: Battle-tested with actual video processing
- **Comprehensive Testing**: 120+ runtime tests with real media files
- **Performance Optimized**: Intelligent caching and command optimization
- **Error Recovery**: Graceful handling of edge cases

## 📦 Installation

```bash
npm install @jamesaphoenix/media-sdk
```

### Prerequisites
- **Node.js**: 18+ 
- **FFmpeg**: Must be installed and available in PATH
- **TypeScript**: Recommended for the best experience

#### Install FFmpeg:

**macOS:**
```bash
brew install ffmpeg
```

**Ubuntu/Debian:**
```bash
sudo apt update && sudo apt install ffmpeg
```

**Windows:**
```bash
# Using chocolatey
choco install ffmpeg

# Or download from https://ffmpeg.org/download.html
```

## 🚀 Quick Start

### Basic Video Processing

```typescript
import { Timeline } from '@jamesaphoenix/media-sdk';

// Simple video with text overlay
const timeline = new Timeline()
  .addVideo('input.mp4')
  .addText('Hello World!', {
    position: { x: 'center', y: 'center' },
    style: { fontSize: 48, color: '#ffffff' }
  });

const command = timeline.getCommand('output.mp4');
console.log('FFmpeg command:', command);
```

### TikTok-Style Viral Video

```typescript
import { Timeline, PictureInPicture, AudioDucking } from '@jamesaphoenix/media-sdk';

const tiktokVideo = new Timeline()
  // Main content in 9:16 aspect ratio
  .addVideo('content.mp4')
  .setAspectRatio('9:16')
  .setDuration(15)
  
  // Add reaction video as circular PiP
  .pipe(t => PictureInPicture.add(t, 'reaction.mp4', {
    position: 'bottom-right',
    scale: 0.3,
    borderRadius: 999, // Circular
    shadow: true,
    animation: 'zoom-in'
  }))
  
  // Background music with smart ducking
  .addAudio('background-music.mp3', { volume: 0.6 })
  .pipe(t => AudioDucking.addDucking(t, {
    duckingLevel: 0.2,
    duckingRegions: [{ start: 2, end: 8 }]
  }))
  
  // Viral captions
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

const command = tiktokVideo.getCommand('tiktok-viral.mp4');
```

### YouTube Highlight Reel

```typescript
import { VideoSplicer } from '@jamesaphoenix/media-sdk';

const highlights = VideoSplicer.createHighlightReel(
  new Timeline().addVideo('gameplay.mp4'),
  [
    { time: 10, duration: 8, priority: 'high' },   // Epic moment
    { time: 45, duration: 6, priority: 'high' },   // Another highlight
    { time: 90, duration: 5, priority: 'medium' }  // Good play
  ],
  { maxDuration: 30, sortByPriority: true }
)
.addText('BEST MOMENTS', {
  position: { x: 'center', y: '10%' },
  style: { fontSize: 48, color: '#ffff00' }
})
.addAudio('epic-music.mp3', { volume: 0.8 });
```

### Professional Podcast Clip

```typescript
const podcastClip = new Timeline()
  .addVideo('interview.mp4')
  .setDuration(60)
  
  // Professional audio mix with ducking
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
  
  // Key quote highlight
  .addText('"The secret is managing energy,\\nnot time"', {
    position: { x: 'center', y: 'center' },
    style: { fontSize: 32, color: '#00ffff' },
    startTime: 20,
    duration: 8
  });
```

## 🎯 Platform Presets

### Social Media Optimization

```typescript
// TikTok optimized
const tiktok = new Timeline()
  .addVideo('content.mp4')
  .setAspectRatio('9:16')
  .setDuration(15)
  .setFrameRate(30);

// Instagram Story
const story = new Timeline()
  .addVideo('content.mp4')
  .setAspectRatio('9:16')
  .setDuration(15);

// YouTube Short
const short = new Timeline()
  .addVideo('content.mp4')
  .setAspectRatio('9:16')
  .setDuration(60);

// Standard YouTube
const youtube = new Timeline()
  .addVideo('content.mp4')
  .setAspectRatio('16:9')
  .setResolution(1920, 1080);
```

## 🎨 Advanced Features

### Word Highlighting System

```typescript
timeline.addWordHighlighting({
  text: 'TikTok viral content! 🔥',
  preset: 'tiktok',
  highlightTransition: 'bounce',
  baseStyle: { fontSize: 48, color: '#ffffff' },
  highlightStyle: { color: '#ff0066', scale: 1.3 }
});
```

### Comprehensive Color Support

```typescript
// Multiple color formats supported
timeline.addText('Colorful Text', {
  style: {
    color: '#ff0066',                    // Hex
    backgroundColor: 'rgb(255,0,102)',   // RGB
    borderColor: 'hsl(340, 100%, 50%)',  // HSL
    shadowColor: 'rgba(0,0,0,0.8)'      // RGBA
  }
});
```

### Complex Filter Chains

```typescript
const cinematic = new Timeline()
  .addVideo('input.mp4')
  .addFilter('eq=gamma=1.2:contrast=1.1:brightness=0.02')
  .addFilter('curves=r=\'0/0.05 1/0.95\':g=\'0/0.03 1/0.97\'')
  .addFilter('vignette=PI/4')
  .addFilter('noise=alls=1:allf=t');
```

## 🧪 Self-Healing Architecture

The Media SDK implements a revolutionary **Self-Healing Pattern**:

```
1. IMPORT ENTIRE SDK → 2. RUN TRANSFORMS → 3. DETECT BUGS → 4. FIX SDK → 5. ADD TESTS
     ↓                     ↓                  ↓              ↓           ↓
📦 All Primitives    🎬 Real FFmpeg     👁️ Vision      🔧 Auto-Fix   📊 Expand Coverage
```

### Vision-Powered Quality Validation (Optional)

Self-healing and quality validation are **completely optional** features. You can use the SDK without any AI integration:

```typescript
// Basic usage - no self-healing
const timeline = new Timeline()
  .addVideo('input.mp4')
  .addText('Hello World');

const command = timeline.getCommand('output.mp4');
```

To enable self-healing and quality validation:

```typescript
// With self-healing enabled (requires GEMINI_API_KEY)
import { validateRender } from '@jamesaphoenix/media-sdk/validation';

// Validate API key
if (!process.env.GEMINI_API_KEY) {
  console.warn('GEMINI_API_KEY not set - self-healing features disabled');
}

const validation = await validateRender(
  'output.mp4',
  'tiktok',
  { command, timeline },
  ['Expected', 'Text'],
  [command]
);

console.log('Quality Score:', validation.qualityScore);
console.log('Suggestions:', validation.suggestions);
```

**Note**: Self-healing features require a Gemini API key but are entirely optional. The core SDK functionality works without any API keys.

### AST-Based Dependency Tracking

The SDK includes intelligent cache invalidation:

```typescript
import { CassetteDependencyTracker } from '@jamesaphoenix/media-sdk/testing';

const tracker = new CassetteDependencyTracker();
tracker.registerCassette('video-render', [
  'src/timeline.ts',
  'assets/video.mp4'
]);

const shouldInvalidate = tracker.shouldInvalidateCassette('video-render');
```

## 📖 API Reference

### Core Classes

#### `Timeline`
The main class for building video compositions.

```typescript
class Timeline {
  addVideo(source: string, options?: VideoOptions): Timeline
  addAudio(source: string, options?: AudioOptions): Timeline
  addText(text: string, options?: TextOptions): Timeline
  addImage(source: string, options?: ImageOptions): Timeline
  addFilter(filter: string): Timeline
  setDuration(seconds: number): Timeline
  setResolution(width: number, height: number): Timeline
  setAspectRatio(ratio: string): Timeline
  setFrameRate(fps: number): Timeline
  setCodec(codec: string): Timeline
  setQuality(crf: number): Timeline
  pipe<T>(fn: (timeline: Timeline) => T): T
  getCommand(output: string): string
}
```

#### `VideoSplicer`
Advanced video editing operations.

```typescript
class VideoSplicer {
  static extractSegment(timeline: Timeline, start: number, end: number): Timeline
  static removeSegment(timeline: Timeline, start: number, end: number): Timeline
  static splice(options: SpliceOptions): Timeline
  static createHighlightReel(timeline: Timeline, highlights: Highlight[], options?: HighlightOptions): Timeline
}
```

#### `PictureInPicture`
Picture-in-picture overlay system.

```typescript
class PictureInPicture {
  static add(timeline: Timeline, source: string, options?: PiPOptions): Timeline
  static addMultiple(timeline: Timeline, options: MultiPiPOptions): Timeline
  static createReactionLayout(main: string, reaction: string, options?: ReactionOptions): Timeline
  static createWebcamOverlay(timeline: Timeline, webcam: string, options?: WebcamOptions): Timeline
}
```

#### `AudioDucking`
Professional audio mixing and ducking.

```typescript
class AudioDucking {
  static addDucking(timeline: Timeline, options?: DuckingOptions): Timeline
  static createDialogueMix(timeline: Timeline, options: DialogueOptions): Timeline
  static createPodcastMix(timeline: Timeline, options: PodcastOptions): Timeline
  static createMusicBed(timeline: Timeline, options: MusicBedOptions): Timeline
}
```

### Type Definitions

```typescript
interface VideoOptions {
  startTime?: number;
  duration?: number;
  trimStart?: number;
  trimEnd?: number;
}

interface AudioOptions {
  volume?: number;
  pan?: number; // -1 (left) to 1 (right)
  fadeIn?: number;
  fadeOut?: number;
  startTime?: number;
  duration?: number;
  sampleRate?: number;
  channels?: number;
}

interface TextOptions {
  position?: Position;
  style?: TextStyle;
  startTime?: number;
  duration?: number;
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

interface Position {
  x: number | string | 'left' | 'center' | 'right';
  y: number | string | 'top' | 'center' | 'bottom';
}
```

## 🧪 Testing

The SDK includes comprehensive runtime testing with real FFmpeg execution:

```bash
# Run all tests
npm test

# Run specific test suites
npm run test:core-primitives     # Test basic operations
npm run test:new-features        # Test advanced features
npm run test:edge-cases          # Test boundary conditions
npm run test:real-world          # Test practical scenarios
```

### AI-Powered Test Generation

```bash
# Generate new tests using AI + combinatorics
npm run generate-tests

# Analyze test coverage gaps
npm run analyze-coverage
```

## 🏗️ Architecture

### Functional Composition

```typescript
const result = new Timeline()
  .addVideo('input.mp4')
  .pipe(t => t.addAudio('music.mp3', { volume: 0.5 }))
  .pipe(t => PictureInPicture.add(t, 'overlay.mp4'))
  .pipe(t => AudioDucking.addDucking(t, { duckingLevel: 0.2 }))
  .setResolution(1920, 1080)
  .getCommand('output.mp4');
```

### Immutable Operations

All Timeline operations return new instances, ensuring:
- **Predictable behavior** for AI agents
- **Easy debugging** and testing
- **Safe parallel processing**
- **Functional composition** patterns

### Platform Awareness

Built-in knowledge of platform requirements:

```typescript
// Automatically optimizes for TikTok
const tiktok = timeline.setAspectRatio('9:16').setDuration(15);

// YouTube optimization
const youtube = timeline.setAspectRatio('16:9').setResolution(1920, 1080);

// Instagram Stories
const story = timeline.setAspectRatio('9:16').setDuration(15);
```

## 🔧 Advanced Usage

### Custom Effect Pipelines

```typescript
const createVintageEffect = (timeline: Timeline) => {
  return timeline
    .addFilter('eq=gamma=1.1:contrast=0.9:brightness=-0.05:saturation=0.8')
    .addFilter('curves=vintage')
    .addFilter('vignette=PI/4')
    .addFilter('noise=alls=2:allf=t');
};

const vintage = new Timeline()
  .addVideo('input.mp4')
  .pipe(createVintageEffect);
```

### Batch Processing

```typescript
const processVideos = async (videos: string[]) => {
  const results = await Promise.all(
    videos.map(async (video, index) => {
      const timeline = new Timeline()
        .addVideo(video)
        .setResolution(1920, 1080)
        .addText(`Video ${index + 1}`, {
          position: { x: 'center', y: '10%' }
        });
      
      return timeline.getCommand(`output-${index}.mp4`);
    })
  );
  
  return results;
};
```

### Error Handling

```typescript
try {
  const timeline = new Timeline()
    .addVideo('input.mp4')
    .setDuration(30);
  
  const command = timeline.getCommand('output.mp4');
  // Execute with your preferred method
} catch (error) {
  console.error('Timeline creation failed:', error);
}
```

## 🎯 Use Cases

### Content Creator Workflows
- **Gaming Highlights**: Automated clip extraction and compilation
- **Podcast Clips**: Professional audio mixing with visual elements  
- **Social Media**: Platform-optimized content generation
- **Tutorial Videos**: Multi-segment educational content

### AI Agent Integration
- **Automated Video Generation**: Predictable, type-safe API
- **Quality Validation**: Built-in vision analysis
- **Error Recovery**: Graceful handling of edge cases
- **Batch Processing**: Parallel video generation

### Professional Video Production
- **Multi-camera Editing**: Picture-in-picture compositions
- **Audio Post-production**: Advanced ducking and mixing
- **Color Grading**: Filter pipeline automation
- **Format Conversion**: Cross-platform optimization

## 🤝 Contributing

We welcome contributions! Please see our [Contributing Guide](CONTRIBUTING.md) for details.

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

# Runtime tests with real FFmpeg
cd apps/bun-runtime
bun test

# Generate new tests
bun run generate-tests
```

## 📋 Changelog

See [CHANGELOG.md](CHANGELOG.md) for a list of changes.

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- **FFmpeg Team** - For the powerful media processing capabilities
- **Effect-TS Community** - For the functional programming foundation  
- **Bun Team** - For the fast JavaScript runtime used in testing
- **Google Gemini** - For AI-powered quality validation

## 📞 Support

- **GitHub Issues**: [Report bugs or request features](https://github.com/jamesaphoenix/media-sdk/issues)
- **Documentation**: [Full API docs](https://github.com/jamesaphoenix/media-sdk#readme)
- **Examples**: [Real-world examples](https://github.com/jamesaphoenix/media-sdk/tree/main/examples)

---

**Built with ❤️ for AI agents and developers who need reliable video generation at scale.**
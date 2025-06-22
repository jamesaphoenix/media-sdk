# AI Media SDK

A declarative, LLM-friendly API for video editing using FFmpeg. Built with TypeScript and functional composition for easy integration with AI agents and automation workflows.

## Features

🎬 **Declarative Timeline API** - Build video compositions with method chaining  
📱 **Platform Presets** - TikTok, YouTube, Instagram optimized formats  
📝 **Advanced Captions** - Word-by-word highlighting for social media  
🖼️ **Image Processing** - Download single images or arrays with rendered captions  
📦 **Batch Processing** - Process multiple images efficiently with progress tracking  
🔄 **Iterable Collections** - Work with image collections using familiar array methods  
🎞️ **Slideshow Generation** - Create presentations with precise positioning  
🎨 **Effects & Filters** - Functional composition of video effects  
⚡ **FFmpeg Executor** - Progress tracking and cancellation support  
🤖 **LLM-Friendly** - Designed for easy AI agent integration  

## Quick Start

```bash
# Install the SDK
npm install @jamesaphoenix/media-sdk

# Install FFmpeg (required)
# macOS: brew install ffmpeg
# Ubuntu: sudo apt install ffmpeg
```

```typescript
import { tiktok, addWordByWordCaptions, brightness, contrast } from '@jamesaphoenix/media-sdk';

// Create a TikTok video with effects and captions
const timeline = tiktok('input.mp4')
  .pipe(brightness(0.1))
  .pipe(contrast(1.2))
  .pipe(addWordByWordCaptions([
    { word: "Hello", start: 0, end: 0.5 },
    { word: "TikTok!", start: 0.5, end: 1.2 }
  ]))
  .addText('👆 FOLLOW FOR MORE!', {
    position: 'bottom',
    style: { fontSize: 32, color: '#ffff00' }
  });

// Render the video
await timeline.render('tiktok-ready.mp4');
```

## Documentation

📚 **[Full Documentation](./apps/docs)** - Complete API reference and examples  
🖼️ **[Image Processing Guide](./docs/image-processing.md)** - Download images with captions, batch processing, collections

## Project Structure

```
media-sdk/
├── packages/
│   └── media-sdk/           # Core SDK package
├── apps/
│   ├── docs/               # Documentation site (Fumadocs)
│   └── runtime-tests/      # Runtime testing with cassettes
└── README.md
```

## Core API

### Timeline API

```typescript
import { Timeline } from '@jamesaphoenix/media-sdk';

const timeline = new Timeline()
  .addVideo('input.mp4')
  .addText('Hello World', { position: 'center' })
  .scale(1920, 1080)
  .render('output.mp4');
```

### Platform Helpers

```typescript
import { tiktok, youtube, instagram } from '@jamesaphoenix/media-sdk';

// Platform-optimized videos
const tiktokVideo = tiktok('video.mp4');        // 9:16 aspect ratio
const youtubeVideo = youtube('video.mp4');      // 16:9 aspect ratio  
const instagramFeed = instagram('video.mp4', { format: 'feed' }); // 1:1 square
```

### Effects Composition

```typescript
import { compose, brightness, contrast, vignette } from '@jamesaphoenix/media-sdk';

const vintageEffect = compose(
  brightness(0.1),
  contrast(1.3),
  vignette({ radius: 0.7 })
);

timeline.pipe(vintageEffect);
```

### Image Processing NEW!

```typescript
import { processImageWithCaption, ImageCollection } from '@jamesaphoenix/media-sdk';

// Single image with caption download
const result = await processImageWithCaption('photo.jpg', 'Summer 2024', {
  style: { fontSize: 48, color: '#ffffff' }
});
const buffer = await result.download();

// Batch process with collection
const collection = new ImageCollection();
collection
  .addImage('img1.jpg', 'First Caption')
  .addImage('img2.jpg', 'Second Caption');

// Iterate and download
for await (const img of collection) {
  await img.save(`output/${img.id}.jpg`);
}
```

### Advanced Captions

```typescript
import { addWordByWordCaptions, captionPresets } from '@jamesaphoenix/media-sdk';

const words = [
  { word: "This", start: 0, end: 0.3 },
  { word: "is", start: 0.3, end: 0.5 },
  { word: "epic!", start: 0.5, end: 1.0 }
];

timeline.pipe(addWordByWordCaptions(words, {
  ...captionPresets.tiktok,
  activeStyle: { color: '#ff0066', scale: 1.2 }
}));
```

### Slideshow Creation

```typescript
import { slideshow, titleSlide, bulletSlide } from '@jamesaphoenix/media-sdk';

const presentation = slideshow([
  titleSlide('bg1.jpg', 'Welcome', 'AI Media SDK'),
  bulletSlide('bg2.jpg', 'Features', [
    'Declarative API',
    'Platform Presets', 
    'Advanced Captions'
  ])
], {
  transition: 'fade',
  transitionDuration: 1
});
```

## Development

### Setup

```bash
# Clone and install
git clone <repo-url>
cd media-sdk
pnpm install

# Build the SDK
pnpm build

# Run tests
pnpm test

# Start docs
pnpm docs:dev
```

### Runtime Testing

The SDK includes a comprehensive runtime testing suite with cassette pattern:

```bash
# Setup sample files and run tests
cd apps/runtime-tests
pnpm install
pnpm setup
pnpm test

# Record new cassettes (requires FFmpeg)
pnpm test:record
```

The cassette system records FFmpeg command executions for consistent, reproducible tests without requiring FFmpeg during CI/CD.

### Architecture

- **Timeline Class**: Immutable, functional video composition
- **Helper Functions**: Platform-specific video creation
- **Effects System**: Chainable transformations with `pipe()`
- **Caption Engine**: Advanced subtitle and word-by-word highlighting
- **Slideshow Builder**: Presentation creation with precise positioning
- **FFmpeg Executor**: Command execution with progress tracking

## LLM Integration

The SDK is designed to be easily understood and used by AI agents:

```typescript
// LLM can easily generate this code:
const socialVideo = tiktok('content.mp4')
  .trim(0, 15)
  .pipe(socialMediaOptimized())
  .pipe(addPlatformCaptions(transcript, 'tiktok'))
  .addText('Follow for more tips! 🔥', { 
    position: 'bottom',
    style: { fontSize: 36, color: '#ffff00' }
  })
  .render('viral-ready.mp4');
```

## Use Cases

- **Social Media Automation**: Batch create platform-optimized content
- **AI Video Generation**: Integrate with AI workflows and agents  
- **Educational Content**: Create presentations and tutorials
- **Marketing Videos**: Automate video creation pipelines
- **Content Repurposing**: Convert videos between platforms

## Requirements

- **Node.js** >= 20
- **FFmpeg** (for actual video processing)
- **TypeScript** (recommended)

## Contributing

1. Fork the repository
2. Create a feature branch
3. Add tests for new functionality
4. Update documentation
5. Submit a pull request

## License

MIT - See [LICENSE](LICENSE) for details.

## Credits

Built with TypeScript, FFmpeg, and inspired by functional programming principles. Designed for the AI-first video creation era.
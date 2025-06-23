# Media SDK Examples

This directory contains practical examples demonstrating real-world usage of the Media SDK. Each example showcases different features and use cases.

## Quick Start

```bash
# Install dependencies
pnpm install

# Run basic example
pnpm dev

# Or run specific examples
pnpm tiktok
pnpm youtube
pnpm podcast
pnpm captions
```

## Examples Overview

### 📱 TikTok Video (`tiktok-video.js`)
Creates viral TikTok-style content with:
- 9:16 portrait aspect ratio
- Engaging text overlays with hooks and payoffs
- Mobile-optimized styling
- 15-second format

### 🎬 Basic Timeline (`basic-timeline.js`)
Demonstrates core Timeline API:
- Video and audio composition
- Text overlays with styling
- Resolution and timing control
- Simple fade effects

### 💬 Advanced Captions (`advanced-captions.js`)
Shows powerful caption system:
- Multi-language support
- SRT file handling
- Custom animations
- Precise timing control

### 🎧 Podcast Clip (`podcast-clip.js`)
Professional audio editing:
- Dialogue enhancement
- Background music ducking
- Show graphics and branding
- Quote highlighting

### 🎮 YouTube Highlights (`youtube-highlights.js`)
Gaming content creation:
- Automated highlight extraction
- Multi-camera picture-in-picture
- Epic music synchronization
- 16:9 YouTube optimization

## File Structure

```
examples/
├── package.json          # Dependencies and scripts
├── README.md             # This file
├── basic-timeline.js     # Simple getting started
├── tiktok-video.js       # Viral short-form content
├── youtube-highlights.js # Gaming highlight reels
├── podcast-clip.js       # Professional audio editing
├── advanced-captions.js  # Multi-language subtitles
└── assets/              # Sample media files
    ├── input.mp4
    ├── background-music.mp3
    └── sample-audio.wav
```

## Running Examples

Each example is a standalone Node.js script that demonstrates specific functionality:

```bash
# Basic timeline with video, audio, and text
node basic-timeline.js

# TikTok-optimized viral content
node tiktok-video.js

# Advanced caption system
node advanced-captions.js
```

## Expected Output

Examples generate FFmpeg commands that can be executed to create actual video files:

```bash
ffmpeg -i input.mp4 -i background-music.mp3 \
  -filter_complex "[0:v]scale=1920:1080[v];[1:a]volume=0.3[a]" \
  -map "[v]" -map "[a]" -t 30 output/basic-timeline.mp4
```

## Media Assets

To run examples with actual video generation, place sample files in the `assets/` directory:

- `input.mp4` - Sample video file
- `background-music.mp3` - Background audio
- `content.mp4` - Main content for TikTok example
- `viral-beat.mp3` - Upbeat music for social media

## Platform Optimization

Examples demonstrate platform-specific optimizations:

### TikTok/Instagram Stories
- 9:16 aspect ratio (1080x1920)
- Bold, high-contrast text
- 15-60 second duration
- Mobile-first design

### YouTube
- 16:9 aspect ratio (1920x1080)
- Longer form content support
- Thumbnail optimization
- SEO-friendly metadata

### Professional Content
- Broadcast quality settings
- Advanced audio mixing
- Color grading support
- Multi-camera workflows

## Next Steps

After exploring these examples:

1. **Read the docs**: Check out the comprehensive documentation
2. **Try with real media**: Add your own video/audio files
3. **Customize styling**: Experiment with different text styles and effects
4. **Build complex workflows**: Combine multiple examples
5. **Contribute**: Share your own examples with the community

## Community Examples

Looking for more examples? Check out:
- [Media SDK Gallery](https://github.com/jamesaphoenix/media-sdk/tree/main/gallery)
- [Community Showcase](https://github.com/jamesaphoenix/media-sdk/discussions)
- [Video Tutorials](https://youtube.com/@mediasdk)

## Support

Need help with examples?
- [GitHub Issues](https://github.com/jamesaphoenix/media-sdk/issues)
- [Documentation](https://github.com/jamesaphoenix/media-sdk#readme)
- [Discord Community](https://discord.gg/mediasdk)
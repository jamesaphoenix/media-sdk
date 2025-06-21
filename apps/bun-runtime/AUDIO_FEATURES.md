# Audio Layering Features

## Overview

The Media SDK now supports advanced audio layering capabilities, allowing you to create professional-quality audio mixes with multiple tracks, effects, and precise timing control.

## Key Features

### 1. **Multi-Track Audio Mixing**
- Layer unlimited audio tracks
- Automatic mixing with configurable levels
- Support for various audio formats (MP3, WAV, AAC, FLAC, etc.)

### 2. **Precise Timing Control**
- Start audio at exact timestamps (millisecond precision)
- Trim audio segments from source files
- Control duration and looping

### 3. **Audio Effects**
- **Volume Control**: Adjust levels for each track
- **Fades**: Smooth fade in/out transitions
- **Pitch Shifting**: Change pitch without affecting tempo
- **Time Stretching**: Adjust tempo without affecting pitch
- **Filters**: High-pass and low-pass frequency filters
- **Echo**: Add echo effects with customizable delay and decay
- **Reverb**: Create spatial audio effects

### 4. **Professional Audio Techniques**
- **Audio Ducking**: Automatically lower background music for voiceovers
- **Layered Soundscapes**: Build complex audio environments
- **Synchronized Audio-Visual Events**: Perfectly time sound effects with visual cues

## Usage Examples

### Basic Audio Layering
```typescript
const timeline = new Timeline()
  .addVideo('video.mp4')
  .addAudio('background-music.mp3', { volume: 0.3 })
  .addAudio('voiceover.mp3', { volume: 1.0, startTime: 5 })
  .addAudio('sound-effect.wav', { volume: 0.8, startTime: 10 });
```

### Audio Ducking for Podcasts
```typescript
const podcast = new Timeline()
  .addVideo('interview.mp4')
  // Background music at normal volume
  .addAudio('music.mp3', {
    volume: 0.8,
    startTime: 0,
    duration: 10
  })
  // Duck the music when voice starts
  .addAudio('music.mp3', {
    volume: 0.2,
    startTime: 10,
    duration: 50,
    trimStart: 10,
    trimEnd: 60
  })
  // Voiceover at full volume
  .addAudio('voice.mp3', {
    volume: 1.0,
    startTime: 10,
    duration: 50
  });
```

### Cinematic Audio Atmosphere
```typescript
const cinematic = new Timeline()
  .addVideo('scene.mp4')
  // Ambient background with reverb
  .addAudio('ambient.mp3', {
    volume: 0.3,
    reverb: { room: 0.8, damping: 0.2 },
    lowpass: 3000
  })
  // Dramatic swell
  .addAudio('orchestra.mp3', {
    volume: 0.1,
    startTime: 5,
    fadeIn: 3,
    fadeOut: 2,
    duration: 10
  })
  // Impact sound with echo
  .addAudio('impact.wav', {
    volume: 1.0,
    startTime: 10,
    pitch: 0.5,
    echo: { delay: 1000, decay: 0.4 }
  });
```

### Rhythmic Pattern Creation
```typescript
let timeline = new Timeline().addVideo('video.mp4');

// Create a beat pattern
const beatTimes = [0, 0.5, 1, 1.5, 2, 2.5, 3, 3.5];
beatTimes.forEach((time, index) => {
  timeline = timeline.addAudio('kick.wav', {
    volume: 0.8,
    startTime: time,
    pitch: index % 2 === 0 ? 1.0 : 0.9 // Alternate pitch
  });
});
```

## Technical Implementation

### FFmpeg Filter Complex
The audio layering system generates sophisticated FFmpeg filter complexes:

```bash
# Example generated command for multi-track audio
ffmpeg -i video.mp4 -i music.mp3 -i voice.mp3 \
  -filter_complex "[1:a]volume=0.3,adelay=0|0[audio0];\
  [2:a]volume=1.0,adelay=5000|5000[audio1];\
  [0:a][audio0][audio1]amix=inputs=3:duration=longest[aout]" \
  -map [0:v] -map [aout] output.mp4
```

### Audio Processing Pipeline
1. **Input Processing**: Each audio file is loaded as a separate input
2. **Effect Application**: Filters are applied in sequence (trim, volume, effects, timing)
3. **Timing Adjustment**: `adelay` filter positions audio at precise timestamps
4. **Mixing**: `amix` filter combines all audio streams with proper duration handling
5. **Output Mapping**: Final audio stream is mapped to the output file

## Test Coverage

The audio layering functionality is thoroughly tested with 15 comprehensive tests covering:
- Basic audio operations
- Timing and synchronization
- Audio effects and filters
- Complex mixing scenarios
- Edge cases and error handling

All tests pass successfully, ensuring reliable audio processing.

## Performance Considerations

- **File Deduplication**: Same audio files used multiple times are only loaded once
- **Filter Optimization**: Effects are combined into efficient filter chains
- **Memory Usage**: Large audio files are processed in streaming fashion
- **CPU Usage**: Complex effects (reverb, pitch shifting) may increase processing time

## Future Enhancements

Potential additions to the audio system:
- Audio visualization (waveforms, spectrum)
- Advanced compression and EQ
- Spatial audio (3D positioning)
- Beat detection and synchronization
- Audio analysis and normalization
- Crossfading between tracks
- Side-chain compression
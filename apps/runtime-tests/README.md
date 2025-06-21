# Media SDK Runtime Tests

Runtime testing suite for the Media SDK with cassette pattern for reproducible tests.

## Features

- **Cassette Pattern**: Record/replay FFmpeg commands for consistent testing
- **Sample Files**: Lightweight sample videos and images for testing
- **Comprehensive Scenarios**: Tests all major SDK functionality
- **Progress Tracking**: Visual feedback during test execution
- **Command Validation**: Ensures generated FFmpeg commands are correct

## Usage

### Setup

Install dependencies and setup sample files:

```bash
pnpm install
pnpm setup
```

### Run Tests

**Replay Mode (default)**: Uses recorded cassettes
```bash
pnpm test
```

**Record Mode**: Execute real FFmpeg commands and record results
```bash
pnpm test:record
```

**Watch Mode**: Re-run tests on file changes
```bash
pnpm test:watch
```

### Clean Up

Remove all cassettes and sample files:
```bash
pnpm clean
```

## Test Scenarios

### 1. Basic Timeline Operations
- Video input handling
- Text overlay generation
- Basic rendering options

### 2. Platform-Specific Presets
- TikTok (9:16) format conversion
- YouTube (16:9) optimization
- Instagram square (1:1) cropping

### 3. Effects & Filters
- Color adjustments (brightness, contrast)
- Blur effects
- Vintage/cinematic filters
- Functional composition

### 4. Caption System
- Basic subtitle rendering
- Word-by-word highlighting
- TikTok-style animated captions

### 5. Slideshow Generation
- Static slide creation
- Ken Burns effects
- Multi-slide presentations

### 6. Complex Workflows
- Multi-input composition
- Watermark overlays
- Video concatenation

## Cassette Pattern

The cassette system records FFmpeg command executions:

### Record Mode
- Executes actual FFmpeg commands
- Records results to JSON cassettes
- Use for updating test expectations

### Replay Mode  
- Returns recorded results instantly
- No FFmpeg dependency required
- Consistent test execution

### Cassette Structure
```json
{
  "name": "media-sdk-tests",
  "interactions": [
    {
      "id": "abc123",
      "command": "ffmpeg -i SAMPLE_FILE ...",
      "result": {
        "success": true,
        "duration": 1250,
        "stdout": "...",
        "stderr": "..."
      },
      "timestamp": "2024-01-15T10:30:00Z"
    }
  ],
  "meta": {
    "created": "2024-01-15T10:30:00Z",
    "sdk_version": "1.0.0"
  }
}
```

## Sample Files

Lightweight test assets are automatically created:

- **Videos**: Simple colored rectangles (red, blue, green)
- **Images**: Generated backgrounds and logos
- **Subtitles**: Sample SRT and word-timing files

All files are small placeholders to keep the repository lightweight.

## Integration with SDK

Tests validate that the SDK generates correct FFmpeg commands:

```javascript
import { tiktok, addWordByWordCaptions } from '@jamesaphoenix/media-sdk';

// Generate Timeline
const timeline = tiktok('sample.mp4')
  .pipe(addWordByWordCaptions(words))
  .addText('Hello TikTok!');

// Get FFmpeg command
const command = timeline.getCommand('output.mp4');

// Test validates command structure and options
```

## Environment Variables

- `CASSETTE_MODE=record` - Enable recording mode
- `CASSETTE_MODE=replay` - Enable replay mode (default)

## Example Output

```
🎥 Media SDK Runtime Tests

Setting up sample files...
  ✓ Created placeholder for red-video.mp4
  ✓ Created placeholder for blue-video.mp4
  ✓ Created sample-captions.srt

🎬 Running Media SDK Test Scenarios

Basic Timeline Operations
─────────────────────────
  1. Executing command...
     ✓ Command completed (120ms)
  2. Executing command...
     ✓ Command completed (95ms)

Platform-Specific Presets
──────────────────────────
  1. Executing command...
     ✓ Command completed (110ms)

📊 Test Summary

Cassette: media-sdk-tests (replay mode)
Interactions: 15
Total commands: 15

✓ Successful: 15
✗ Failed: 0

Test Breakdown:
  basic-timeline: 2/2 (100%)
  platform-presets: 3/3 (100%)
  effects: 3/3 (100%)
  captions: 2/2 (100%)
  slideshow: 2/2 (100%)
  complex-workflow: 3/3 (100%)

🎭 Commands replayed from cassette
```
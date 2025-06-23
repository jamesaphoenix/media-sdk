# Media SDK with Effect - Learning Guide

This guide will help you understand Effect while maintaining and extending the Media SDK. Effect is a powerful TypeScript library for building type-safe, composable, and testable applications.

## Table of Contents

1. [What is Effect?](#what-is-effect)
2. [Core Effect Concepts](#core-effect-concepts)
3. [Media SDK Effect Architecture](#media-sdk-effect-architecture)
4. [Effect Patterns in Media SDK](#effect-patterns-in-media-sdk)
5. [Learning by Example](#learning-by-example)
6. [Effect Best Practices](#effect-best-practices)
7. [Maintaining the LLM-Friendly API](#maintaining-the-llm-friendly-api)

## What is Effect?

Effect is a TypeScript library that brings functional programming patterns to JavaScript/TypeScript with a focus on:

- **Type-safe error handling**: No more try-catch blocks or unhandled errors
- **Dependency injection**: Clean, testable code without global state
- **Composability**: Build complex programs from simple, reusable pieces
- **Resource management**: Automatic cleanup of resources (files, connections, etc.)
- **Observability**: Built-in tracing, metrics, and logging

### Why Effect for Media SDK?

1. **Better Error Handling**: FFmpeg operations can fail in many ways. Effect makes all errors explicit and handleable.
2. **Resource Safety**: Video files and FFmpeg processes need proper cleanup. Effect handles this automatically.
3. **Testability**: Effect's dependency injection makes testing much easier.
4. **Composability**: Video operations compose naturally with Effect's pipe pattern.

## Core Effect Concepts

### 1. The Effect Type

The core of Effect is the `Effect<Success, Error, Requirements>` type:

```typescript
import { Effect } from "effect"

// Effect<number, never, never> - succeeds with a number, no errors, no requirements
const simple = Effect.succeed(42)

// Effect<string, Error, never> - might fail with Error
const mightFail = Effect.fail(new Error("oops"))

// Effect<User, DatabaseError, Database> - needs Database service
const getUser = (id: string) => 
  Effect.gen(function* () {
    const db = yield* Database
    return yield* db.findUser(id)
  })
```

**Key Insight**: Every operation in Effect explicitly declares:
- What it returns on success
- What errors it might produce
- What services/dependencies it needs

### 2. Pipe and Composition

Effect uses the `pipe` function for composing operations:

```typescript
import { pipe, Effect } from "effect"

// Traditional imperative style (what we're moving from)
const result1 = doThing1()
const result2 = doThing2(result1)
const result3 = doThing3(result2)

// Effect pipe style (what we're moving to)
const program = pipe(
  Effect.succeed(initialValue),
  Effect.map(doThing1),
  Effect.flatMap(doThing2),
  Effect.map(doThing3)
)

// Or using the pipeline operator (more readable)
const program2 = Effect.succeed(initialValue).pipe(
  Effect.map(doThing1),
  Effect.flatMap(doThing2),
  Effect.map(doThing3)
)
```

### 3. Error Handling

Effect makes all errors explicit and type-safe:

```typescript
// Define custom errors
class ValidationError {
  readonly _tag = "ValidationError"
  constructor(readonly message: string) {}
}

class FFmpegError {
  readonly _tag = "FFmpegError"
  constructor(readonly command: string, readonly stderr: string) {}
}

// Use in effects
const validateVideo = (path: string): Effect.Effect<void, ValidationError> =>
  fileExists(path) 
    ? Effect.succeed(undefined)
    : Effect.fail(new ValidationError(`File not found: ${path}`))

// Handle errors
const program = pipe(
  validateVideo("input.mp4"),
  Effect.catchTag("ValidationError", (error) => 
    Effect.succeed(console.log(`Validation failed: ${error.message}`))
  )
)
```

### 4. Services and Dependency Injection

Effect uses services for dependency injection:

```typescript
// Define a service interface
interface FFmpegService {
  readonly execute: (command: string) => Effect.Effect<string, FFmpegError>
}

// Create service tag
const FFmpegService = Context.GenericTag<FFmpegService>("FFmpegService")

// Implement service
const FFmpegServiceLive = Layer.succeed(
  FFmpegService,
  {
    execute: (command) => 
      Effect.tryPromise({
        try: () => execCommand(command),
        catch: (error) => new FFmpegError(command, String(error))
      })
  }
)

// Use service in your program
const renderVideo = Effect.gen(function* () {
  const ffmpeg = yield* FFmpegService
  const result = yield* ffmpeg.execute("ffmpeg -i input.mp4 output.mp4")
  return result
})
```

### 5. Generators for Readability

Effect supports generator syntax for more readable async code:

```typescript
// Without generators
const program = pipe(
  readFile("config.json"),
  Effect.flatMap((config) =>
    pipe(
      parseConfig(config),
      Effect.flatMap((parsed) =>
        pipe(
          validateConfig(parsed),
          Effect.map((valid) => processConfig(valid))
        )
      )
    )
  )
)

// With generators (much cleaner!)
const program = Effect.gen(function* () {
  const config = yield* readFile("config.json")
  const parsed = yield* parseConfig(config)
  const valid = yield* validateConfig(parsed)
  return yield* processConfig(valid)
})
```

## Media SDK Effect Architecture

### Core Design Principles

1. **Immutable Timeline**: The Timeline remains immutable, but now returns Effects
2. **Explicit Errors**: All operations that can fail return Effect types
3. **Service-based Architecture**: FFmpeg, file system, and validation are services
4. **Composable Operations**: All timeline operations compose using Effect patterns
5. **LLM-Friendly API**: The surface API remains simple for AI agents

### Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│                      User/LLM API Layer                      │
│  (Simple, declarative API - timeline.addCaption(...))       │
└──────────────────────┬──────────────────────────────────────┘
                       │
┌──────────────────────▼──────────────────────────────────────┐
│                    Effect Timeline Core                      │
│  (Immutable operations returning Effect types)              │
└──────────────────────┬──────────────────────────────────────┘
                       │
┌──────────────────────▼──────────────────────────────────────┐
│                    Service Layer                             │
│  ┌─────────────┐ ┌──────────────┐ ┌──────────────────┐    │
│  │   FFmpeg    │ │  FileSystem  │ │   Validation     │    │
│  │   Service   │ │   Service    │ │    Service       │    │
│  └─────────────┘ └──────────────┘ └──────────────────┘    │
└─────────────────────────────────────────────────────────────┘
```

### Service Definitions

```typescript
// Core services used throughout the SDK

interface FFmpegService {
  readonly execute: (command: string) => Effect.Effect<string, FFmpegError>
  readonly probe: (file: string) => Effect.Effect<VideoMetadata, FFmpegError>
}

interface FileSystemService {
  readonly exists: (path: string) => Effect.Effect<boolean, never>
  readonly readFile: (path: string) => Effect.Effect<string, FileError>
  readonly writeFile: (path: string, content: string) => Effect.Effect<void, FileError>
}

interface ValidationService {
  readonly validateVideo: (path: string) => Effect.Effect<ValidationResult, ValidationError>
  readonly validatePlatform: (video: Timeline, platform: Platform) => Effect.Effect<void, ValidationError>
}

interface VisionService {
  readonly analyzeFrame: (frame: string) => Effect.Effect<VisionAnalysis, VisionError>
  readonly validateQuality: (video: string) => Effect.Effect<QualityReport, VisionError>
}
```

## Effect Patterns in Media SDK

### 1. Timeline Operations as Effects

```typescript
// Old imperative style
class Timeline {
  addVideo(path: string, options?: VideoOptions): Timeline {
    // Might throw if file doesn't exist
    if (!fs.existsSync(path)) {
      throw new Error(`Video file not found: ${path}`)
    }
    return new Timeline([...this.layers, newVideoLayer])
  }
}

// New Effect style
class Timeline {
  addVideo(path: string, options?: VideoOptions): Effect.Effect<Timeline, TimelineError, FileSystemService> {
    return Effect.gen(function* () {
      const fs = yield* FileSystemService
      const exists = yield* fs.exists(path)
      
      if (!exists) {
        return yield* Effect.fail(new VideoNotFoundError(path))
      }
      
      return new Timeline([...this.layers, createVideoLayer(path, options)])
    })
  }
}
```

### 2. Composing Timeline Operations

```typescript
// Create a complex video composition
const createTikTokVideo = (
  videoPath: string,
  captions: Caption[],
  musicPath: string
): Effect.Effect<Timeline, TimelineError, TimelineServices> =>
  Effect.gen(function* () {
    // Start with empty timeline
    const timeline = Timeline.empty()
    
    // Add video
    const withVideo = yield* timeline.addVideo(videoPath)
    
    // Set TikTok aspect ratio
    const withAspect = yield* withVideo.setAspectRatio("9:16")
    
    // Add captions
    const withCaptions = yield* withAspect.addCaptions({
      captions,
      preset: "tiktok"
    })
    
    // Add background music
    const withMusic = yield* withCaptions.addAudio(musicPath, {
      volume: 0.3,
      fadeIn: 2,
      fadeOut: 2
    })
    
    return withMusic
  })

// Or using pipe for a more functional style
const createTikTokVideo2 = (videoPath: string, captions: Caption[], musicPath: string) =>
  pipe(
    Timeline.empty(),
    Effect.flatMap((t) => t.addVideo(videoPath)),
    Effect.flatMap((t) => t.setAspectRatio("9:16")),
    Effect.flatMap((t) => t.addCaptions({ captions, preset: "tiktok" })),
    Effect.flatMap((t) => t.addAudio(musicPath, { volume: 0.3, fadeIn: 2, fadeOut: 2 }))
  )
```

### 3. Error Recovery and Fallbacks

```typescript
// Graceful degradation with Effect
const addLogoWithFallback = (timeline: Timeline, logoPath: string) =>
  pipe(
    timeline.addWatermark(logoPath),
    Effect.catchTag("FileNotFoundError", () =>
      // If logo not found, continue without it
      Effect.succeed(timeline)
    ),
    Effect.catchTag("InvalidImageError", (error) =>
      // Log error and continue
      Effect.gen(function* () {
        yield* Effect.log(`Invalid logo image: ${error.message}`)
        return timeline
      })
    )
  )

// Retry with exponential backoff
const renderWithRetry = (timeline: Timeline, output: string) =>
  pipe(
    timeline.render(output),
    Effect.retry(
      Schedule.exponential("1 second").pipe(
        Schedule.jittered,
        Schedule.compose(Schedule.recurs(3))
      )
    )
  )
```

### 4. Resource Management

```typescript
// Automatic cleanup of temporary files
const renderWithTempFiles = (timeline: Timeline) =>
  Effect.gen(function* () {
    // Acquire temp directory
    const tempDir = yield* TempDirectory.create()
    
    // Use temp directory (automatically cleaned up on success or failure)
    return yield* Effect.acquireUseRelease(
      // Acquire
      Effect.succeed(tempDir),
      // Use
      (dir) => timeline.render(`${dir}/output.mp4`),
      // Release (cleanup)
      (dir) => TempDirectory.cleanup(dir)
    )
  })
```

### 5. Parallel Processing

```typescript
// Process multiple videos in parallel
const processVideos = (videoPaths: string[]) =>
  Effect.forEach(
    videoPaths,
    (path) =>
      pipe(
        Timeline.empty(),
        Effect.flatMap((t) => t.addVideo(path)),
        Effect.flatMap((t) => t.normalize()),
        Effect.flatMap((t) => t.render(`output/${basename(path)}`))
      ),
    { concurrency: 3 } // Process 3 videos at a time
  )
```

## Learning by Example

### Example 1: Basic Video with Error Handling

```typescript
import { Effect, pipe } from "effect"
import { Timeline } from "@media-sdk/effect"

// Simple video creation
const createVideo = () =>
  Effect.gen(function* () {
    const timeline = yield* Timeline.empty()
      .addVideo("input.mp4")
      .pipe(Effect.flatMap((t) => t.setDuration(30)))
    
    return yield* timeline.render("output.mp4")
  })

// Run the effect
const main = pipe(
  createVideo(),
  Effect.catchAll((error) =>
    Effect.gen(function* () {
      yield* Effect.log(`Error: ${error.message}`)
      yield* Effect.fail(error) // Re-throw after logging
    })
  )
)

// Execute with runtime
Effect.runPromise(main)
  .then((result) => console.log("Success:", result))
  .catch((error) => console.error("Failed:", error))
```

### Example 2: Complex Composition with Services

```typescript
// Define a video processing workflow
const processUserVideo = (
  userId: string,
  videoId: string
): Effect.Effect<ProcessedVideo, ProcessingError, AppServices> =>
  Effect.gen(function* () {
    // Get user preferences
    const userService = yield* UserService
    const preferences = yield* userService.getPreferences(userId)
    
    // Get video from storage
    const storage = yield* StorageService
    const videoPath = yield* storage.getVideoPath(userId, videoId)
    
    // Create timeline with user preferences
    const timeline = yield* Timeline.empty()
      .addVideo(videoPath)
      .pipe(
        Effect.flatMap((t) => 
          preferences.addWatermark 
            ? t.addWatermark(preferences.watermarkPath)
            : Effect.succeed(t)
        ),
        Effect.flatMap((t) =>
          preferences.addCaptions
            ? t.addCaptions({ 
                captions: yield* storage.getCaptions(videoId),
                style: preferences.captionStyle 
              })
            : Effect.succeed(t)
        )
      )
    
    // Render and upload
    const outputPath = `/tmp/${videoId}-processed.mp4`
    yield* timeline.render(outputPath)
    
    const uploadUrl = yield* storage.upload(outputPath, userId, videoId)
    
    return { 
      userId, 
      videoId, 
      url: uploadUrl,
      processedAt: new Date()
    }
  })
```

### Example 3: Testing with Effect

```typescript
import { Effect, Layer, TestContext } from "effect"

// Test implementation of FFmpegService
const TestFFmpegService = Layer.succeed(
  FFmpegService,
  {
    execute: (command) => 
      command.includes("invalid") 
        ? Effect.fail(new FFmpegError(command, "Invalid input"))
        : Effect.succeed("success"),
    probe: (file) =>
      Effect.succeed({
        duration: 30,
        width: 1920,
        height: 1080,
        fps: 30
      })
  }
)

// Test timeline operations
describe("Timeline with Effect", () => {
  it("should handle video operations", async () => {
    const program = Effect.gen(function* () {
      const timeline = yield* Timeline.empty()
        .addVideo("test.mp4")
        .pipe(Effect.flatMap((t) => t.setDuration(10)))
      
      return timeline.layers.length
    })
    
    const result = await Effect.runPromise(
      pipe(
        program,
        Effect.provide(TestFFmpegService),
        Effect.provide(TestFileSystemService)
      )
    )
    
    expect(result).toBe(1)
  })
})
```

## Effect Best Practices

### 1. Keep Effects Small and Focused

```typescript
// Good: Small, focused effects
const readVideoMetadata = (path: string) =>
  Effect.gen(function* () {
    const ffmpeg = yield* FFmpegService
    return yield* ffmpeg.probe(path)
  })

const validateDuration = (metadata: VideoMetadata, maxDuration: number) =>
  metadata.duration <= maxDuration
    ? Effect.succeed(metadata)
    : Effect.fail(new DurationError(`Video too long: ${metadata.duration}s`))

// Compose them
const validateVideo = (path: string, maxDuration: number) =>
  pipe(
    readVideoMetadata(path),
    Effect.flatMap((metadata) => validateDuration(metadata, maxDuration))
  )
```

### 2. Use Tagged Errors for Better Error Handling

```typescript
// Define error types with tags
class VideoError {
  readonly _tag = "VideoError"
  constructor(readonly reason: string) {}
}

class AudioError {
  readonly _tag = "AudioError"
  constructor(readonly reason: string) {}
}

class RenderError {
  readonly _tag = "RenderError"
  constructor(readonly command: string, readonly stderr: string) {}
}

// Handle specific errors
const program = pipe(
  someVideoOperation,
  Effect.catchTag("VideoError", (error) =>
    Effect.gen(function* () {
      yield* Effect.log(`Video error: ${error.reason}`)
      // Provide fallback
      return defaultVideo
    })
  ),
  Effect.catchTag("RenderError", (error) =>
    // Retry render errors
    Effect.retry(Schedule.exponential("1 second"))
  )
)
```

### 3. Use Services for External Dependencies

```typescript
// Bad: Direct usage of external dependencies
const renderVideo = (timeline: Timeline) =>
  Effect.tryPromise({
    try: () => execSync(`ffmpeg ${timeline.getCommand()}`),
    catch: (e) => new RenderError(String(e))
  })

// Good: Use service abstraction
const renderVideo = (timeline: Timeline) =>
  Effect.gen(function* () {
    const ffmpeg = yield* FFmpegService
    const command = timeline.getCommand()
    return yield* ffmpeg.execute(command)
  })
```

### 4. Leverage Effect's Built-in Utilities

```typescript
// Timeout operations
const renderWithTimeout = (timeline: Timeline, output: string) =>
  pipe(
    timeline.render(output),
    Effect.timeout("5 minutes")
  )

// Add telemetry
const renderWithMetrics = (timeline: Timeline, output: string) =>
  pipe(
    timeline.render(output),
    Effect.withSpan("render_video", { 
      attributes: { 
        output,
        layers: timeline.layers.length 
      }
    })
  )

// Rate limiting
const processVideosWithRateLimit = (videos: string[]) =>
  Effect.forEach(
    videos,
    (video) => processVideo(video),
    { 
      concurrency: 3,
      batching: true 
    }
  )
```

## Maintaining the LLM-Friendly API

While the internal implementation uses Effect, we maintain a simple API for LLMs:

### 1. Dual API Approach

```typescript
// LLM-friendly synchronous-looking API
const timeline = new Timeline()
  .addVideo("input.mp4")
  .addCaption("Hello World", { position: "bottom", style: "bold" })
  .setDuration(30)

// This actually returns Effect under the hood, but we provide runners
const output = await timeline.render("output.mp4") // Simple promise-based API

// Advanced users can access the Effect API directly
const effect = timeline.renderEffect("output.mp4") // Returns Effect
const result = await Effect.runPromise(
  pipe(
    effect,
    Effect.provide(CustomFFmpegService)
  )
)
```

### 2. Smart Defaults and Auto-provisioning

```typescript
// The Timeline class auto-provides default services
class Timeline {
  render(output: string): Promise<string> {
    // Auto-provide default services for simple usage
    return Effect.runPromise(
      pipe(
        this.renderEffect(output),
        Effect.provide(DefaultServices)
      )
    )
  }
  
  renderEffect(output: string): Effect.Effect<string, RenderError, TimelineServices> {
    // The actual Effect-based implementation
    // ...
  }
}
```

### 3. Builder Pattern for Complex Operations

```typescript
// LLM-friendly builder for complex operations
const video = MediaBuilder
  .create("input.mp4")
  .withPlatform("tiktok")
  .withCaptions([
    { text: "Hello", start: 0, end: 2 },
    { text: "World", start: 2, end: 4 }
  ])
  .withMusic("background.mp3", { volume: 0.3 })
  .withTransition("fade", { duration: 1 })
  .build() // Returns Timeline

// The builder handles all Effect composition internally
```

### 4. Declarative Presets

```typescript
// Simple preset functions that hide Effect complexity
export const tiktok = (videoPath: string, options?: TikTokOptions) => {
  const timeline = Timeline.empty()
    .addVideo(videoPath)
    .setAspectRatio("9:16")
    .setDuration(options?.duration || 15)
  
  if (options?.captions) {
    timeline.addCaptions({
      captions: options.captions,
      preset: "tiktok"
    })
  }
  
  return timeline
}

// LLMs can use it simply
const video = tiktok("dance.mp4", {
  captions: generateCaptions("Check out this dance!"),
  duration: 30
})
```

## Migration Guide

### Migrating Existing Code

When migrating existing code to Effect:

1. **Start with the leaves**: Convert low-level operations first
2. **Work your way up**: Gradually convert higher-level APIs
3. **Maintain compatibility**: Keep the existing API working during migration
4. **Add Effect variants**: Offer both traditional and Effect APIs

Example migration:

```typescript
// Step 1: Original implementation
class Timeline {
  addVideo(path: string): Timeline {
    if (!fs.existsSync(path)) throw new Error("File not found")
    return new Timeline([...this.layers, createVideoLayer(path)])
  }
}

// Step 2: Add Effect variant
class Timeline {
  addVideo(path: string): Timeline {
    // Keep original for compatibility
    if (!fs.existsSync(path)) throw new Error("File not found")
    return new Timeline([...this.layers, createVideoLayer(path)])
  }
  
  addVideoEffect(path: string): Effect.Effect<Timeline, VideoError, FileSystemService> {
    return Effect.gen(function* () {
      const fs = yield* FileSystemService
      const exists = yield* fs.exists(path)
      if (!exists) return yield* Effect.fail(new VideoNotFoundError(path))
      return new Timeline([...this.layers, createVideoLayer(path)])
    })
  }
}

// Step 3: Migrate original to use Effect internally
class Timeline {
  addVideo(path: string): Timeline {
    return Effect.runSync(
      pipe(
        this.addVideoEffect(path),
        Effect.provide(DefaultServices)
      )
    )
  }
  
  addVideoEffect(path: string): Effect.Effect<Timeline, VideoError, FileSystemService> {
    // Effect implementation
  }
}
```

## Common Patterns and Recipes

### Pattern 1: Configuration Management

```typescript
// Define configuration schema with @effect/schema
import { Schema } from "@effect/schema"

const TimelineConfig = Schema.Struct({
  defaultDuration: Schema.Number,
  defaultFps: Schema.Number,
  defaultAspectRatio: Schema.String,
  maxLayers: Schema.Number,
  outputQuality: Schema.Literal("low", "medium", "high", "lossless")
})

// Load and validate configuration
const loadConfig = Effect.gen(function* () {
  const fs = yield* FileSystemService
  const content = yield* fs.readFile("timeline.config.json")
  const parsed = yield* Effect.try(() => JSON.parse(content))
  return yield* Schema.decodeUnknown(TimelineConfig)(parsed)
})
```

### Pattern 2: Progress Reporting

```typescript
// Report progress during long operations
interface ProgressService {
  readonly report: (progress: number, message: string) => Effect.Effect<void>
}

const renderWithProgress = (timeline: Timeline, output: string) =>
  Effect.gen(function* () {
    const progress = yield* ProgressService
    
    yield* progress.report(0, "Starting render...")
    
    // Prepare timeline
    const prepared = yield* timeline.prepare()
    yield* progress.report(25, "Timeline prepared")
    
    // Generate FFmpeg command
    const command = prepared.getCommand(output)
    yield* progress.report(50, "Command generated")
    
    // Execute render
    const ffmpeg = yield* FFmpegService
    const result = yield* ffmpeg.execute(command)
    yield* progress.report(90, "Render complete")
    
    // Validate output
    const validator = yield* ValidationService
    yield* validator.validateVideo(output)
    yield* progress.report(100, "Validation complete")
    
    return output
  })
```

### Pattern 3: Caching with Effect

```typescript
// Implement caching for expensive operations
interface CacheService {
  readonly get: <T>(key: string) => Effect.Effect<Option.Option<T>>
  readonly set: <T>(key: string, value: T) => Effect.Effect<void>
}

const getVideoMetadataWithCache = (path: string) =>
  Effect.gen(function* () {
    const cache = yield* CacheService
    const cacheKey = `metadata:${path}`
    
    // Check cache
    const cached = yield* cache.get<VideoMetadata>(cacheKey)
    if (Option.isSome(cached)) {
      return cached.value
    }
    
    // Compute if not cached
    const ffmpeg = yield* FFmpegService
    const metadata = yield* ffmpeg.probe(path)
    
    // Store in cache
    yield* cache.set(cacheKey, metadata)
    
    return metadata
  })
```

## Debugging Effect Applications

### 1. Enable Runtime Logs

```typescript
import { Effect, Logger, LogLevel } from "effect"

// Enable debug logging
const program = pipe(
  myEffect,
  Logger.withMinimumLogLevel(LogLevel.Debug)
)

// Add custom logs
const debugTimeline = (timeline: Timeline) =>
  Effect.gen(function* () {
    yield* Effect.log("Timeline state:", { 
      layers: timeline.layers.length,
      duration: timeline.duration 
    })
    return timeline
  })
```

### 2. Use Effect Dev Tools

```typescript
// Add spans for tracing
const renderWithTracing = (timeline: Timeline) =>
  Effect.withSpan("timeline.render", {
    attributes: {
      layers: timeline.layers.length,
      effects: timeline.effects.length
    }
  })(timeline.render())

// Add metrics
const renderWithMetrics = (timeline: Timeline) =>
  Effect.gen(function* () {
    const startTime = yield* Clock.currentTimeMillis
    const result = yield* timeline.render()
    const endTime = yield* Clock.currentTimeMillis
    
    yield* Metric.histogram("render_duration").update(endTime - startTime)
    yield* Metric.counter("renders_total").increment()
    
    return result
  })
```

### 3. Test Effect Code

```typescript
import { Effect, TestClock, TestContext } from "effect"

describe("Timeline Effect tests", () => {
  it("should timeout long renders", async () => {
    const program = pipe(
      timeline.render("output.mp4"),
      Effect.timeout("5 seconds")
    )
    
    const result = await Effect.gen(function* () {
      // Fast-forward time
      yield* TestClock.adjust("10 seconds")
      
      // Should timeout
      return yield* Effect.either(program)
    }).pipe(
      Effect.provide(TestContext.TestContext),
      Effect.runPromise
    )
    
    expect(Either.isLeft(result)).toBe(true)
  })
})
```

## Resources and Further Learning

### Official Effect Resources
- [Effect Documentation](https://effect.website/docs/introduction)
- [Effect Discord](https://discord.gg/effect-ts)
- [Effect GitHub](https://github.com/Effect-TS/effect)

### Recommended Learning Path

1. **Start with Core Concepts**
   - Effect type and basic operations
   - Error handling with Effect
   - Services and dependency injection

2. **Practice with Small Examples**
   - Convert simple Timeline methods
   - Add error handling
   - Create test services

3. **Build Features**
   - Implement new features using Effect
   - Refactor existing code gradually
   - Write Effect-based tests

4. **Advanced Topics**
   - Concurrent operations
   - Resource management
   - Performance optimization
   - Custom services

### Media SDK Specific Resources

- `/examples/effect/` - Effect-based examples
- `/tests/effect/` - Effect testing patterns
- `/docs/effect-architecture.md` - Detailed architecture docs

## Summary

Effect brings powerful functional programming patterns to the Media SDK while maintaining a simple, LLM-friendly API. Key benefits:

1. **Type-safe error handling** - No more runtime surprises
2. **Better testability** - Easy to mock services
3. **Resource safety** - Automatic cleanup
4. **Composability** - Build complex workflows from simple pieces
5. **Observability** - Built-in logging, tracing, and metrics

The dual API approach ensures that both LLMs and advanced users can work effectively with the SDK, while the Effect foundation provides a robust, maintainable codebase for the future.
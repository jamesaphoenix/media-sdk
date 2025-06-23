import { Effect, pipe, Console, Layer, Context, Schedule } from "effect"
import { 
  Timeline, 
  TimelineError,
  VideoNotFoundError,
  FFmpegService,
  FileSystemService,
  ValidationService,
  DefaultTimelineServices,
  createTimeline,
  tiktok,
  youtube
} from "../timeline/timeline-effect.js"

/**
 * @fileoverview Examples demonstrating the Effect-based Timeline API
 * 
 * These examples show various ways to use the Timeline with Effect,
 * from simple LLM-friendly APIs to advanced Effect compositions.
 */

// ============================================================================
// Example 1: Simple LLM-Friendly API (Preserves Original Interface)
// ============================================================================

/**
 * The simplest way to use Timeline - identical to original API
 * This approach hides Effect complexity for AI agents and beginners
 */
export async function simpleLLMExample() {
  console.log("=== Example 1: Simple LLM-Friendly API ===")
  
  // Create video just like before - Effect is hidden
  const video = await createTimeline()
    .addVideo("input.mp4")
    .addText("Hello World!", { 
      position: "bottom",
      style: { fontSize: 48, color: "#ffffff" }
    })
    .addAudio("background.mp3", { volume: 0.3 })
    .render("output.mp4")
  
  console.log("Video rendered:", video)
  
  // Platform presets work the same way
  const tiktokVideo = await tiktok("dance.mp4")
    .addCaption("Check out this dance! 🔥")
    .addWordHighlighting({
      text: "Like and Subscribe!",
      preset: "tiktok",
      startTime: 5
    })
    .render("tiktok-output.mp4")
  
  console.log("TikTok video rendered:", tiktokVideo)
}

// ============================================================================
// Example 2: Basic Effect Usage
// ============================================================================

/**
 * Using Timeline with Effect's generator syntax
 * This provides better error handling and composition
 */
export const basicEffectExample = Effect.gen(function* () {
  console.log("=== Example 2: Basic Effect Usage ===")
  
  // Create an empty timeline
  const timeline = yield* Timeline.empty()
  
  // Add video with validation
  const withVideo = yield* timeline.addVideo("sample.mp4", {
    startTime: 0,
    duration: 30
  })
  
  // Add text overlay
  const withText = yield* withVideo.addText("Welcome to Effect!", {
    position: "center",
    style: {
      fontSize: 64,
      color: "#ff0066",
      strokeWidth: 3
    }
  })
  
  // Add watermark
  const withWatermark = yield* withText.addWatermark("logo.png", {
    position: "top-right",
    margin: 30
  })
  
  // Render the video
  const output = yield* withWatermark.render("effect-output.mp4")
  
  yield* Console.log(`Video rendered to: ${output}`)
  return output
})

// ============================================================================
// Example 3: Error Handling with Effect
// ============================================================================

/**
 * Demonstrates Effect's powerful error handling capabilities
 */
export const errorHandlingExample = Effect.gen(function* () {
  console.log("=== Example 3: Error Handling ===")
  
  const timeline = yield* Timeline.empty()
  
  // Try to add a video that might not exist
  const result = yield* pipe(
    timeline.addVideo("maybe-missing.mp4"),
    // Handle specific error types
    Effect.catchTag("VideoNotFoundError", (error) => 
      Effect.gen(function* () {
        yield* Console.error(`Video not found: ${error.path}`)
        yield* Console.log("Using fallback video instead...")
        // Use a fallback video
        return yield* timeline.addVideo("fallback.mp4")
      })
    ),
    // Handle validation errors
    Effect.catchTag("ValidationError", (error) =>
      Effect.gen(function* () {
        yield* Console.error(`Validation failed: ${error.message}`)
        // Return the original timeline unchanged
        return timeline
      })
    )
  )
  
  // Continue with the pipeline
  const final = yield* result
    .addText("Error handling works!", { position: "bottom" })
    .pipe(Effect.flatMap(t => t.render("with-error-handling.mp4")))
  
  return final
})

// ============================================================================
// Example 4: Parallel Processing with Effect
// ============================================================================

/**
 * Process multiple videos in parallel using Effect's concurrency
 */
export const parallelProcessingExample = Effect.gen(function* () {
  console.log("=== Example 4: Parallel Processing ===")
  
  const videoPaths = ["video1.mp4", "video2.mp4", "video3.mp4"]
  
  // Process all videos in parallel
  const results = yield* Effect.forEach(
    videoPaths,
    (videoPath) => Effect.gen(function* () {
      const timeline = yield* Timeline.empty()
      const withVideo = yield* timeline.addVideo(videoPath)
      const withBranding = yield* withVideo.addWatermark("brand.png")
      const withTitle = yield* withBranding.addText(`Processed: ${videoPath}`, {
        position: "top",
        startTime: 0,
        duration: 3
      })
      
      const outputPath = `processed-${videoPath}`
      yield* withTitle.render(outputPath)
      
      return outputPath
    }),
    { concurrency: 3 } // Process 3 videos at a time
  )
  
  yield* Console.log(`Processed ${results.length} videos in parallel`)
  return results
})

// ============================================================================
// Example 5: Custom Services and Dependency Injection
// ============================================================================

/**
 * Create custom service implementations for testing or special behavior
 */

// Mock FFmpeg service for testing
const MockFFmpegService = Layer.succeed(
  FFmpegService,
  FFmpegService.of({
    execute: (command) => 
      Effect.gen(function* () {
        yield* Console.log(`[MOCK] Would execute: ${command}`)
        return "mock-output.mp4"
      }),
    
    probe: (file) =>
      Effect.succeed({
        duration: 60,
        width: 1920,
        height: 1080,
        fps: 30,
        codec: "h264"
      }),
    
    validateCommand: (command) =>
      Effect.succeed(undefined)
  })
)

// Mock file system service
const MockFileSystemService = Layer.succeed(
  FileSystemService,
  FileSystemService.of({
    exists: (path) => 
      Effect.succeed(!path.includes("missing")),
    
    isReadable: (path) =>
      Effect.succeed(true),
    
    readFile: (path) =>
      Effect.succeed("mock file content"),
    
    writeFile: (path, content) =>
      Effect.gen(function* () {
        yield* Console.log(`[MOCK] Would write to: ${path}`)
      })
  })
)

// Use custom services
export const customServicesExample = Effect.gen(function* () {
  console.log("=== Example 5: Custom Services ===")
  
  const timeline = yield* Timeline.empty()
  const withVideo = yield* timeline.addVideo("test.mp4")
  const result = yield* withVideo.render("custom-output.mp4")
  
  yield* Console.log(`Rendered with mock services: ${result}`)
  return result
}).pipe(
  // Provide custom services instead of defaults
  Effect.provide(Layer.mergeAll(
    MockFFmpegService,
    MockFileSystemService,
    ValidationServiceLive // Use real validation
  ))
)

// ============================================================================
// Example 6: Advanced Composition with Pipe
// ============================================================================

/**
 * Use functional composition to create reusable timeline transformations
 */

// Create reusable timeline transformations
const addIntro = (text: string, duration: number = 3) =>
  (timeline: Timeline) => Effect.gen(function* () {
    return yield* timeline.addText(text, {
      position: "center",
      startTime: 0,
      duration,
      style: {
        fontSize: 72,
        color: "#ffffff",
        strokeWidth: 3
      }
    })
  })

const addOutro = (text: string, logoPath: string) =>
  (timeline: Timeline) => Effect.gen(function* () {
    const duration = timeline.getDuration()
    const withLogo = yield* timeline.addImage(logoPath, {
      position: "center",
      startTime: duration - 5,
      duration: 5
    })
    return yield* withLogo.addText(text, {
      position: "bottom",
      startTime: duration - 5,
      duration: 5
    })
  })

const addBackgroundMusic = (musicPath: string, volume: number = 0.3) =>
  (timeline: Timeline) => 
    timeline.addAudio(musicPath, {
      volume,
      startTime: 0,
      duration: timeline.getDuration(),
      fadeIn: 2,
      fadeOut: 2
    })

// Compose transformations
export const compositionExample = Effect.gen(function* () {
  console.log("=== Example 6: Advanced Composition ===")
  
  const timeline = yield* Timeline.empty()
  
  // Build complex timeline with composition
  const final = yield* pipe(
    timeline.addVideo("main-content.mp4"),
    Effect.flatMap(addIntro("Welcome to our channel!")),
    Effect.flatMap(addBackgroundMusic("music.mp3")),
    Effect.flatMap(addOutro("Thanks for watching!", "logo.png"))
  )
  
  return yield* final.render("composed-video.mp4")
})

// ============================================================================
// Example 7: Retry and Recovery Strategies
// ============================================================================

/**
 * Implement sophisticated retry and recovery strategies
 */
export const retryExample = Effect.gen(function* () {
  console.log("=== Example 7: Retry and Recovery ===")
  
  const timeline = yield* Timeline.empty()
  const withVideo = yield* timeline.addVideo("source.mp4")
  
  // Render with automatic retry on failure
  const result = yield* pipe(
    withVideo.render("output-with-retry.mp4"),
    // Retry with exponential backoff
    Effect.retry(
      Schedule.exponential("1 second").pipe(
        Schedule.jittered,
        Schedule.compose(Schedule.recurs(3))
      )
    ),
    // If all retries fail, try a different approach
    Effect.catchAll((error) => 
      Effect.gen(function* () {
        yield* Console.error("All retries failed, trying lower quality...")
        // Try rendering with lower quality settings
        return yield* withVideo.render("output-low-quality.mp4", {
          quality: "low",
          preset: "fast"
        })
      })
    )
  )
  
  yield* Console.log(`Successfully rendered: ${result}`)
  return result
})

// ============================================================================
// Example 8: Platform-Specific Validation
// ============================================================================

/**
 * Validate timeline for specific platforms before rendering
 */
export const platformValidationExample = Effect.gen(function* () {
  console.log("=== Example 8: Platform Validation ===")
  
  const timeline = yield* Timeline.empty()
  const withContent = yield* pipe(
    timeline.addVideo("content.mp4"),
    Effect.flatMap(t => t.addText("Subscribe!", { position: "bottom" }))
  )
  
  // Validate for TikTok
  const validation = yield* withContent.validateForPlatform("tiktok")
  
  if (!validation.isValid) {
    yield* Console.error("Validation errors:", validation.errors)
  }
  
  if (validation.warnings.length > 0) {
    yield* Console.warn("Validation warnings:", validation.warnings)
    yield* Console.log("Suggestions:", validation.suggestions)
  }
  
  // Apply suggestions automatically
  let optimized = withContent
  if (validation.suggestions.includes('Use timeline.setAspectRatio("9:16")')) {
    optimized = yield* withContent.setAspectRatio("9:16")
  }
  
  return yield* optimized.render("tiktok-optimized.mp4")
})

// ============================================================================
// Example 9: Complex Caption Workflows
// ============================================================================

/**
 * Advanced caption and word highlighting workflows
 */
export const captionWorkflowExample = Effect.gen(function* () {
  console.log("=== Example 9: Caption Workflows ===")
  
  const timeline = yield* Timeline.empty()
  const withVideo = yield* timeline.addVideo("speaker.mp4")
  
  // Add multiple caption tracks
  const captions = [
    { text: "Welcome to our tutorial", startTime: 0, duration: 3 },
    { text: "Today we'll learn Effect", startTime: 3, duration: 3 },
    { text: "It's powerful and type-safe", startTime: 6, duration: 3 }
  ]
  
  // Add captions with styling
  const withCaptions = yield* withVideo.addCaptions({
    captions: captions.map(c => ({
      ...c,
      style: {
        fontSize: 36,
        color: "#ffffff",
        strokeWidth: 2,
        background: { color: "rgba(0,0,0,0.7)", padding: 10 }
      }
    })),
    transition: "fade",
    preset: "youtube"
  })
  
  // Add word highlighting for emphasis
  const withHighlighting = yield* withCaptions.addWordHighlighting({
    text: "Effect is AMAZING for video processing!",
    startTime: 10,
    duration: 4,
    preset: "tiktok",
    highlightTransition: "bounce",
    highlightStyle: {
      color: "#ff0066",
      scale: 1.3,
      glow: true
    }
  })
  
  return yield* withHighlighting.render("captioned-video.mp4")
})

// ============================================================================
// Example 10: Resource Management
// ============================================================================

/**
 * Proper resource management with Effect's acquireRelease
 */
export const resourceManagementExample = Effect.gen(function* () {
  console.log("=== Example 10: Resource Management ===")
  
  // Create a temporary working directory
  const acquireTempDir = Effect.gen(function* () {
    const fs = yield* FileSystemService
    const tempDir = `/tmp/video-work-${Date.now()}`
    yield* fs.writeFile(`${tempDir}/.keep`, "")
    yield* Console.log(`Created temp directory: ${tempDir}`)
    return tempDir
  })
  
  // Clean up the directory
  const releaseTempDir = (tempDir: string) =>
    Effect.gen(function* () {
      yield* Console.log(`Cleaning up: ${tempDir}`)
      // In real implementation, would delete directory
    })
  
  // Use the temp directory with automatic cleanup
  return yield* Effect.acquireUseRelease(
    acquireTempDir,
    (tempDir) => Effect.gen(function* () {
      // Do work in temp directory
      const timeline = yield* Timeline.empty()
      const withVideo = yield* timeline.addVideo("input.mp4")
      
      // Render to temp directory
      const tempOutput = `${tempDir}/processed.mp4`
      yield* withVideo.render(tempOutput)
      
      // Copy to final location
      const finalOutput = "final-output.mp4"
      yield* Console.log(`Moving ${tempOutput} to ${finalOutput}`)
      
      return finalOutput
    }),
    releaseTempDir
  )
})

// ============================================================================
// Running the Examples
// ============================================================================

/**
 * Run all examples with proper error handling
 */
export const runAllExamples = Effect.gen(function* () {
  // Run simple example (Promise-based)
  yield* Effect.promise(() => simpleLLMExample())
  
  // Run Effect examples
  yield* basicEffectExample
  yield* errorHandlingExample
  yield* parallelProcessingExample
  yield* customServicesExample
  yield* compositionExample
  yield* retryExample
  yield* platformValidationExample
  yield* captionWorkflowExample
  yield* resourceManagementExample
  
  yield* Console.log("\n✅ All examples completed successfully!")
})

// Main entry point
if (import.meta.main) {
  Effect.runPromise(
    pipe(
      runAllExamples,
      Effect.provide(DefaultTimelineServices),
      Effect.catchAll((error) =>
        Console.error("Example failed:", error)
      )
    )
  )
}
import { Effect, pipe, Console } from "effect"
import { 
  Timeline, 
  createTimeline,
  DefaultTimelineServices,
  VideoNotFoundError
} from "../../../packages/media-sdk/src/timeline/timeline-effect.js"

/**
 * Example demonstrating the Effect-based Timeline API with Bun runtime
 * 
 * Run with: bun examples/effect-timeline-example.ts
 */

// Example 1: Simple LLM-friendly usage
async function simpleLLMExample() {
  console.log("\n=== Simple LLM-Friendly Example ===")
  
  // Create a timeline using the simple API
  const timeline = await createTimeline()
  
  // Add media just like before - Effect is hidden
  const video = await timeline
    .addVideo("../assets/nature.mp4")
    .then(t => t.addText("Beautiful Nature", {
      position: "center",
      style: { fontSize: 48, color: "#ffffff" }
    }))
    .then(t => t.addAudio("../assets/background-music.mp3", { volume: 0.3 }))
  
  console.log("Timeline created with", video.toJSON().layers.length, "layers")
}

// Example 2: Using Effect directly
const effectExample = Effect.gen(function* () {
  console.log("\n=== Effect-Based Example ===")
  
  // Create empty timeline
  const timeline = yield* Timeline.empty()
  
  // Add video with error handling
  const withVideo = yield* pipe(
    timeline.addVideo("../assets/bunny.mp4"),
    Effect.tap(() => Console.log("✓ Added video")),
    Effect.catchTag("VideoNotFoundError", (error) =>
      Effect.gen(function* () {
        yield* Console.error(`Video not found: ${error.path}`)
        yield* Console.log("Using fallback video...")
        return yield* timeline.addVideo("../assets/nature.mp4")
      })
    )
  )
  
  // Add text overlay
  const withText = yield* pipe(
    withVideo.addText("Effect + Media SDK", {
      position: "bottom",
      style: {
        fontSize: 36,
        color: "#00ff00",
        strokeWidth: 2,
        backgroundColor: "rgba(0,0,0,0.7)"
      }
    }),
    Effect.tap(() => Console.log("✓ Added text overlay"))
  )
  
  // Add watermark
  const withWatermark = yield* pipe(
    withText.addWatermark("../assets/logo-150x150.png", {
      position: "top-right",
      margin: 20
    }),
    Effect.tap(() => Console.log("✓ Added watermark"))
  )
  
  // Set platform-specific settings
  const optimized = yield* pipe(
    withWatermark.setAspectRatio("16:9"),
    Effect.tap(() => Console.log("✓ Set aspect ratio to 16:9"))
  )
  
  return optimized
})

// Example 3: Platform validation
const platformValidationExample = Effect.gen(function* () {
  console.log("\n=== Platform Validation Example ===")
  
  const timeline = yield* Timeline.empty()
  const withVideo = yield* timeline.addVideo("../assets/portrait-nature.mp4")
  
  // Validate for different platforms
  const platforms = ["tiktok", "youtube", "instagram"] as const
  
  for (const platform of platforms) {
    const validation = yield* withVideo.validateForPlatform(platform)
    
    yield* Console.log(`\nValidation for ${platform}:`)
    yield* Console.log(`- Valid: ${validation.isValid}`)
    
    if (validation.warnings.length > 0) {
      yield* Console.log(`- Warnings: ${validation.warnings.join(", ")}`)
    }
    
    if (validation.suggestions.length > 0) {
      yield* Console.log(`- Suggestions: ${validation.suggestions.join(", ")}`)
    }
  }
  
  return withVideo
})

// Example 4: Complex composition
const complexCompositionExample = Effect.gen(function* () {
  console.log("\n=== Complex Composition Example ===")
  
  const timeline = yield* Timeline.empty()
  
  // Build a complex timeline step by step
  const final = yield* pipe(
    timeline.addVideo("../assets/earth.mp4"),
    Effect.flatMap(t => t.trim(5, 15)),
    Effect.flatMap(t => t.setAspectRatio("1:1")),
    Effect.flatMap(t => t.addFilter("brightness", { value: 0.2 })),
    Effect.flatMap(t => t.addFilter("contrast", { value: 1.3 })),
    Effect.flatMap(t => t.addCaptions({
      captions: [
        { text: "Planet Earth", startTime: 0, duration: 3 },
        { text: "Our Home", startTime: 3, duration: 3 },
        { text: "Let's protect it! 🌍", startTime: 6, duration: 4 }
      ],
      preset: "instagram",
      transition: "fade"
    })),
    Effect.flatMap(t => t.addAudio("../assets/background-music.mp3", {
      volume: 0.5,
      fadeIn: 1,
      fadeOut: 2,
      trimStart: 0,
      trimEnd: 10
    })),
    Effect.tap(() => Console.log("✓ Built complex timeline"))
  )
  
  // Get the FFmpeg command
  const command = yield* final.getCommand("output/complex-composition.mp4")
  yield* Console.log("\nGenerated FFmpeg command:")
  yield* Console.log(command.substring(0, 200) + "...")
  
  return final
})

// Example 5: Parallel processing
const parallelProcessingExample = Effect.gen(function* () {
  console.log("\n=== Parallel Processing Example ===")
  
  const videos = [
    { input: "../assets/nature.mp4", output: "output/nature-processed.mp4" },
    { input: "../assets/earth.mp4", output: "output/earth-processed.mp4" },
    { input: "../assets/bunny.mp4", output: "output/bunny-processed.mp4" }
  ]
  
  // Process all videos in parallel
  const results = yield* Effect.forEach(
    videos,
    ({ input, output }) => Effect.gen(function* () {
      const timeline = yield* Timeline.empty()
      const processed = yield* pipe(
        timeline.addVideo(input),
        Effect.flatMap(t => t.setAspectRatio("16:9")),
        Effect.flatMap(t => t.addText("Processed with Effect", {
          position: "bottom",
          style: { fontSize: 24, color: "#ffffff" }
        }))
      )
      
      const command = yield* processed.getCommand(output)
      yield* Console.log(`✓ Prepared ${input} -> ${output}`)
      
      return { input, output, command }
    }),
    { concurrency: 3 }
  )
  
  yield* Console.log(`\nProcessed ${results.length} videos in parallel`)
  return results
})

// Main runner
const main = Effect.gen(function* () {
  yield* Console.log("🎬 Media SDK Effect Examples")
  yield* Console.log("============================")
  
  // Run simple example
  yield* Effect.promise(() => simpleLLMExample())
  
  // Run Effect examples
  yield* effectExample
  yield* platformValidationExample
  yield* complexCompositionExample
  yield* parallelProcessingExample
  
  yield* Console.log("\n✅ All examples completed successfully!")
})

// Run the examples
Effect.runPromise(
  pipe(
    main,
    Effect.provide(DefaultTimelineServices),
    Effect.catchAll((error) =>
      Console.error("Example failed:", error)
    )
  )
)
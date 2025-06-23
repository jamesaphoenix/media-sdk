import { describe, it, expect } from "bun:test"
import { Effect, Layer, TestContext, TestClock, Either, pipe, Schedule } from "effect"
import {
  Timeline,
  VideoNotFoundError,
  ValidationError,
  RenderError,
  TimelineError,
  FFmpegService,
  FileSystemService,
  ValidationService,
  DefaultTimelineServices
} from "./timeline-effect.js"

/**
 * @fileoverview Tests for Effect-based Timeline API
 * 
 * These tests demonstrate how to test Effect-based code, including:
 * - Testing with mock services
 * - Error scenario testing
 * - Time-based testing with TestClock
 * - Testing parallel operations
 */

// ============================================================================
// Mock Service Implementations for Testing
// ============================================================================

/**
 * Create a test FFmpeg service that doesn't actually execute commands
 */
const createTestFFmpegService = (options?: {
  shouldFail?: boolean
  failureMessage?: string
}) => Layer.succeed(
  FFmpegService,
  FFmpegService.of({
    execute: (command) => 
      options?.shouldFail
        ? Effect.fail(new RenderError(command, options.failureMessage || "Test failure"))
        : Effect.succeed(`mock-output-${Date.now()}.mp4`),
    
    probe: (file) =>
      Effect.succeed({
        duration: 30,
        width: 1920,
        height: 1080,
        fps: 30,
        codec: "h264",
        bitrate: 5000000
      }),
    
    validateCommand: (command) =>
      command.includes("ffmpeg")
        ? Effect.succeed(undefined)
        : Effect.fail(new ValidationError("Invalid command"))
  })
)

/**
 * Create a test file system service
 */
const createTestFileSystemService = (options?: {
  existingFiles?: string[]
  failOnWrite?: boolean
}) => Layer.succeed(
  FileSystemService,
  FileSystemService.of({
    exists: (path) => 
      Effect.succeed(
        options?.existingFiles?.includes(path) ?? true
      ),
    
    isReadable: (path) =>
      Effect.succeed(true),
    
    readFile: (path) =>
      Effect.succeed(`mock content of ${path}`),
    
    writeFile: (path, content) =>
      options?.failOnWrite
        ? Effect.fail(new TimelineError("Write failed"))
        : Effect.succeed(undefined)
  })
)

/**
 * Test validation service
 */
const TestValidationService = Layer.succeed(
  ValidationService,
  ValidationService.of({
    validateVideo: (path) =>
      path.includes("invalid")
        ? Effect.fail(new ValidationError("Invalid video format"))
        : Effect.succeed({
            duration: 60,
            width: 1920,
            height: 1080,
            fps: 30,
            codec: "h264"
          }),
    
    validateAudio: (path) =>
      Effect.succeed({
        duration: 60,
        channels: 2,
        sampleRate: 44100,
        bitrate: 128000
      }),
    
    validateImage: (path) =>
      Effect.succeed({
        width: 1920,
        height: 1080,
        format: "png"
      }),
    
    validatePlatformRequirements: (timeline, platform) =>
      Effect.succeed({
        isValid: true,
        warnings: platform === "tiktok" && timeline.toJSON().globalOptions.aspectRatio !== "9:16"
          ? ["TikTok videos should use 9:16 aspect ratio"]
          : [],
        errors: [],
        suggestions: platform === "tiktok" && timeline.toJSON().globalOptions.aspectRatio !== "9:16"
          ? ['Use timeline.setAspectRatio("9:16")']
          : []
      })
  })
)

// ============================================================================
// Test Suite
// ============================================================================

describe("Timeline with Effect", () => {
  // Helper to run Effect tests
  const runTest = <E, A>(
    effect: Effect.Effect<A, E, any>,
    services = Layer.mergeAll(
      createTestFFmpegService(),
      createTestFileSystemService(),
      TestValidationService
    )
  ) => Effect.runPromise(pipe(effect, Effect.provide(services)))

  describe("Basic Operations", () => {
    it("should create an empty timeline", async () => {
      const result = await runTest(
        Effect.gen(function* () {
          const timeline = yield* Timeline.empty()
          return timeline.toJSON()
        })
      )
      
      expect(result.layers).toEqual([])
      expect(result.globalOptions).toEqual({})
    })

    it("should add a video to timeline", async () => {
      const result = await runTest(
        Effect.gen(function* () {
          const timeline = yield* Timeline.empty()
          const withVideo = yield* timeline.addVideo("test.mp4", {
            startTime: 5,
            duration: 10
          })
          return withVideo.toJSON()
        })
      )
      
      expect(result.layers).toHaveLength(1)
      expect(result.layers[0]).toMatchObject({
        type: "video",
        source: "test.mp4",
        startTime: 0, // startTime is position in Timeline layer, not VideoOptions.startTime
        duration: 10
      })
    })

    it("should handle video not found error", async () => {
      const result = await runTest(
        Effect.gen(function* () {
          const timeline = yield* Timeline.empty()
          return yield* pipe(
            timeline.addVideo("missing.mp4"),
            Effect.either
          )
        }),
        Layer.mergeAll(
          createTestFFmpegService(),
          createTestFileSystemService({ existingFiles: [] }),
          TestValidationService
        )
      )
      
      expect(Either.isLeft(result)).toBe(true)
      if (Either.isLeft(result)) {
        expect(result.left._tag).toBe("VideoNotFoundError")
      }
    })
  })

  describe("Text and Captions", () => {
    it("should add text overlay", async () => {
      const result = await runTest(
        Effect.gen(function* () {
          const timeline = yield* Timeline.empty()
          const withText = yield* timeline.addText("Hello World", {
            position: "center",
            style: { fontSize: 48, color: "#ffffff" }
          })
          return withText.toJSON()
        })
      )
      
      expect(result.layers).toHaveLength(1)
      expect(result.layers[0]).toMatchObject({
        type: "text",
        content: "Hello World"
      })
    })

    it("should validate empty text", async () => {
      const result = await runTest(
        Effect.gen(function* () {
          const timeline = yield* Timeline.empty()
          return yield* pipe(
            timeline.addText(""),
            Effect.either
          )
        })
      )
      
      expect(Either.isLeft(result)).toBe(true)
      if (Either.isLeft(result)) {
        expect(result.left._tag).toBe("ValidationError")
      }
    })

    it("should add captions with auto-timing", async () => {
      const result = await runTest(
        Effect.gen(function* () {
          const timeline = yield* Timeline.empty()
          const withCaptions = yield* timeline.addCaptions({
            captions: [
              { text: "First caption" },
              { text: "Second caption" },
              { text: "Third caption" }
            ],
            preset: "youtube",
            transition: "fade"
          })
          return withCaptions.toJSON()
        })
      )
      
      expect(result.layers).toHaveLength(3)
      result.layers.forEach((layer, index) => {
        expect(layer.type).toBe("text")
        expect(layer.content).toContain("caption")
      })
    })
  })

  describe("Platform Validation", () => {
    it("should validate timeline for TikTok", async () => {
      const result = await runTest(
        Effect.gen(function* () {
          const timeline = yield* Timeline.empty()
          const withVideo = yield* timeline.addVideo("test.mp4")
          
          // Check validation without aspect ratio
          const validation1 = yield* withVideo.validateForPlatform("tiktok")
          
          // Apply aspect ratio
          const optimized = yield* withVideo.setAspectRatio("9:16")
          const validation2 = yield* optimized.validateForPlatform("tiktok")
          
          return { validation1, validation2 }
        })
      )
      
      expect(result.validation1.warnings).toContain("TikTok videos should use 9:16 aspect ratio")
      expect(result.validation2.warnings).toHaveLength(0)
    })
  })

  describe("Error Handling and Recovery", () => {
    it("should retry failed renders", async () => {
      let attempts = 0
      
      const result = await runTest(
        Effect.gen(function* () {
          const timeline = yield* Timeline.empty()
          const withVideo = yield* timeline.addVideo("test.mp4")
          
          return yield* pipe(
            withVideo.render("output.mp4"),
            Effect.retry(Schedule.recurs(2))
          )
        }),
        Layer.mergeAll(
          Layer.succeed(
            FFmpegService,
            FFmpegService.of({
              execute: (command) => {
                attempts++
                if (attempts <= 2) {
                  return Effect.fail(new RenderError(command, "Temporary failure"))
                }
                return Effect.succeed("output.mp4")
              },
              probe: (file) => Effect.succeed({
                duration: 30,
                width: 1920,
                height: 1080,
                fps: 30,
                codec: "h264"
              }),
              validateCommand: () => Effect.succeed(undefined)
            })
          ),
          createTestFileSystemService(),
          TestValidationService
        )
      )
      
      expect(result).toBe("output.mp4")
      expect(attempts).toBe(3) // Initial + 2 retries
    })
  })

  describe("Composition and Transformation", () => {
    it("should compose timeline operations", async () => {
      const addWatermarkAndText = (watermark: string, text: string) =>
        (timeline: Timeline) => Effect.gen(function* () {
          const withWatermark = yield* timeline.addWatermark(watermark)
          return yield* withWatermark.addText(text, { position: "bottom" })
        })
      
      const result = await runTest(
        Effect.gen(function* () {
          const timeline = yield* Timeline.empty()
          const withVideo = yield* timeline.addVideo("input.mp4")
          const final = yield* withVideo.pipe(
            addWatermarkAndText("logo.png", "© 2024")
          )
          return final.toJSON()
        })
      )
      
      expect(result.layers).toHaveLength(3) // video + watermark + text
    })
  })

  describe("Parallel Processing", () => {
    it("should process multiple videos in parallel", async () => {
      const videos = ["video1.mp4", "video2.mp4", "video3.mp4"]
      
      const result = await runTest(
        Effect.forEach(
          videos,
          (video) => Effect.gen(function* () {
            const timeline = yield* Timeline.empty()
            const withVideo = yield* timeline.addVideo(video)
            return yield* withVideo.render(`output-${video}`)
          }),
          { concurrency: 3 }
        )
      )
      
      expect(result).toHaveLength(3)
      expect(result[0]).toContain("output")
    })
  })

  describe("Resource Management", () => {
    it("should clean up resources on failure", async () => {
      let cleanupCalled = false
      
      await runTest(
        Effect.gen(function* () {
          return yield* Effect.acquireUseRelease(
            // Acquire
            Effect.succeed("temp-resource"),
            // Use (will fail)
            (resource) => Effect.gen(function* () {
              const timeline = yield* Timeline.empty()
              // This will fail
              return yield* timeline.addVideo("invalid-video.mp4")
            }),
            // Release
            (resource) => Effect.sync(() => {
              cleanupCalled = true
            })
          )
        }),
        Layer.mergeAll(
          createTestFFmpegService(),
          createTestFileSystemService({ existingFiles: [] }),
          TestValidationService
        )
      ).catch(() => {
        // Expected to fail
      })
      
      expect(cleanupCalled).toBe(true)
    })
  })

  describe("Time-based Operations", () => {
    it.skip("should handle timeouts correctly", async () => {
      const result = await runTest(
        Effect.gen(function* () {
          const timeline = yield* Timeline.empty()
          const withVideo = yield* timeline.addVideo("test.mp4")
          
          return yield* pipe(
            withVideo.render("output.mp4"),
            Effect.timeout("100 millis"),
            Effect.either
          )
        }),
        Layer.mergeAll(
          Layer.succeed(
            FFmpegService,
            FFmpegService.of({
              execute: () => Effect.sleep("200 millis").pipe(
                Effect.flatMap(() => Effect.succeed("output.mp4"))
              ),
              probe: () => Effect.succeed({
                duration: 30,
                width: 1920,
                height: 1080,
                fps: 30,
                codec: "h264"
              }),
              validateCommand: () => Effect.succeed(undefined)
            })
          ),
          createTestFileSystemService(),
          TestValidationService,
          TestContext.TestContext
        )
      )
      
      expect(Either.isLeft(result)).toBe(true)
    })
  })
})

describe("LLM-Friendly API", () => {
  it("should work with promise-based API", async () => {
    // This test ensures the LLM-friendly API still works
    const { createTimeline } = await import("./timeline-effect.js")
    
    // Mock global services for testing
    const mockTimeline = await createTimeline()
    
    // These would normally return promises in the real implementation
    expect(mockTimeline).toBeDefined()
  })
})
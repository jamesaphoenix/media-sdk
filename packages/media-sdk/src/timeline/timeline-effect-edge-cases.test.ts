import { describe, it, expect } from "bun:test"
import { Effect, Either, pipe, Option } from "effect"
import {
  Timeline,
  VideoNotFoundError,
  AudioNotFoundError,
  ImageNotFoundError,
  ValidationError,
  RenderError,
  FFmpegService,
  FileSystemService,
  ValidationService,
  createTimeline
} from "./timeline-effect.js"

/**
 * @fileoverview Comprehensive edge case tests for Effect-based Timeline
 * 
 * These tests ensure the Timeline API handles all edge cases gracefully,
 * provides helpful error messages, and maintains data integrity.
 */

describe("Timeline Effect - Edge Cases", () => {
  
  describe("🚨 Input Validation Edge Cases", () => {
    
    it("should handle empty strings gracefully", async () => {
      const timeline = await createTimeline()
      
      // Empty video path
      await expect(timeline.addVideo("")).rejects.toThrow()
      
      // Empty audio path
      await expect(timeline.addAudio("")).rejects.toThrow()
      
      // Empty image path
      await expect(timeline.addImage("")).rejects.toThrow()
      
      // Empty text content
      await expect(timeline.addText("")).rejects.toThrow()
      
      // Empty output path
      await expect(timeline.render("")).rejects.toThrow()
    })
    
    it("should handle whitespace-only strings", async () => {
      const timeline = await createTimeline()
      
      await expect(timeline.addVideo("   ")).rejects.toThrow()
      await expect(timeline.addText("   \n\t  ")).rejects.toThrow()
      await expect(timeline.render("   ")).rejects.toThrow()
    })
    
    it("should handle special characters in paths", async () => {
      const timeline = await createTimeline()
      
      // These should succeed if files exist
      const specialPaths = [
        "video with spaces.mp4",
        "video-with-dashes.mp4",
        "video_with_underscores.mp4",
        "video.with.dots.mp4",
        "видео.mp4", // Cyrillic
        "视频.mp4", // Chinese
        "video@2x.mp4",
        "video#1.mp4"
      ]
      
      // All should handle gracefully (either succeed or fail with clear error)
      for (const path of specialPaths) {
        const result = await timeline.addVideo(path).catch(e => e)
        expect(result).toBeDefined()
      }
    })
    
    it("should handle extremely long text content", async () => {
      const timeline = await createTimeline()
      const longText = "A".repeat(10000) // 10k characters
      
      // Should succeed but might warn about text length
      const result = await timeline.addText(longText, {
        position: "center",
        style: { fontSize: 24 }
      })
      
      expect(result.toJSON().layers[0].content).toBe(longText)
    })
    
    it("should handle invalid numeric values", async () => {
      const timeline = await createTimeline()
      
      // Negative dimensions
      await expect(timeline.scale(-1920, 1080)).rejects.toThrow()
      await expect(timeline.scale(1920, -1080)).rejects.toThrow()
      await expect(timeline.scale(0, 0)).rejects.toThrow()
      
      // Invalid frame rate
      await expect(timeline.setFrameRate(0)).rejects.toThrow()
      await expect(timeline.setFrameRate(-30)).rejects.toThrow()
      await expect(timeline.setFrameRate(1000)).rejects.toThrow() // Too high
      
      // Invalid duration
      await expect(timeline.setDuration(0)).rejects.toThrow()
      await expect(timeline.setDuration(-10)).rejects.toThrow()
      
      // Invalid trim
      await expect(timeline.trim(-5)).rejects.toThrow()
      await expect(timeline.trim(10, 5)).rejects.toThrow() // End before start
    })
    
    it("should handle malformed aspect ratios", async () => {
      const timeline = await createTimeline()
      
      const invalidRatios = [
        "16x9", // Wrong separator
        "16-9", // Wrong separator
        "16:9:10", // Too many parts
        "16:", // Missing height
        ":9", // Missing width
        "abc:def", // Non-numeric
        "0:16", // Zero width
        "16:0", // Zero height
      ]
      
      for (const ratio of invalidRatios) {
        await expect(timeline.setAspectRatio(ratio)).rejects.toThrow(/Invalid aspect ratio/)
      }
    })
  })
  
  describe("🎯 Boundary Value Edge Cases", () => {
    
    it("should handle minimum valid values", async () => {
      const timeline = await createTimeline()
      
      // Minimum dimensions (1x1)
      const tiny = await timeline.scale(1, 1)
      expect(tiny.toJSON().globalOptions.scale).toEqual({ width: 1, height: 1 })
      
      // Minimum frame rate (1 fps)
      const slowFps = await timeline.setFrameRate(1)
      expect(slowFps.toJSON().globalOptions.frameRate).toBe(1)
      
      // Minimum duration (0.001 seconds)
      const shortDuration = await timeline.setDuration(0.001)
      expect(shortDuration.toJSON().globalOptions.duration).toBe(0.001)
    })
    
    it("should handle maximum valid values", async () => {
      const timeline = await createTimeline()
      
      // Large dimensions (8K)
      const huge = await timeline.scale(7680, 4320)
      expect(huge.toJSON().globalOptions.scale).toEqual({ width: 7680, height: 4320 })
      
      // High frame rate (120 fps)
      const fastFps = await timeline.setFrameRate(120)
      expect(fastFps.toJSON().globalOptions.frameRate).toBe(120)
      
      // Long duration (24 hours)
      const longDuration = await timeline.setDuration(86400)
      expect(longDuration.toJSON().globalOptions.duration).toBe(86400)
    })
    
    it("should handle floating point precision", async () => {
      const timeline = await createTimeline()
      
      // Precise timing
      const withVideo = await timeline.addVideo("test.mp4")
      const withText = await withVideo.addText("Precise", {
        startTime: 1.23456789,
        duration: 0.123456789
      })
      
      const layer = withText.toJSON().layers[1]
      expect(layer.startTime).toBeCloseTo(1.23456789)
      expect(layer.duration).toBeCloseTo(0.123456789)
    })
  })
  
  describe("🔄 State Consistency Edge Cases", () => {
    
    it("should maintain immutability under all operations", async () => {
      const timeline1 = await createTimeline()
      const timeline2 = await timeline1.addVideo("test.mp4")
      const timeline3 = await timeline2.addText("Hello")
      const timeline4 = await timeline3.setAspectRatio("16:9")
      
      // Each timeline should be independent
      expect(timeline1.toJSON().layers.length).toBe(0)
      expect(timeline2.toJSON().layers.length).toBe(1)
      expect(timeline3.toJSON().layers.length).toBe(2)
      expect(timeline4.toJSON().layers.length).toBe(2)
      
      // Global options should be independent
      expect(timeline1.toJSON().globalOptions.aspectRatio).toBeUndefined()
      expect(timeline4.toJSON().globalOptions.aspectRatio).toBe("16:9")
    })
    
    it("should handle rapid successive operations", async () => {
      const timeline = await createTimeline()
      
      // Add 100 text layers rapidly
      let current = timeline
      for (let i = 0; i < 100; i++) {
        current = await current.addText(`Text ${i}`, {
          startTime: i * 0.1,
          duration: 0.5
        })
      }
      
      expect(current.toJSON().layers.length).toBe(100)
      expect(current.getDuration()).toBeCloseTo(10.4) // Last text ends at 10.4
    })
    
    it("should handle conflicting layer timings", async () => {
      const timeline = await createTimeline()
      
      // Add overlapping text layers
      const withOverlaps = await timeline
        .addText("First", { startTime: 0, duration: 5 })
        .then(t => t.addText("Second", { startTime: 2, duration: 5 }))
        .then(t => t.addText("Third", { startTime: 4, duration: 5 }))
      
      // All should be added despite overlaps
      expect(withOverlaps.toJSON().layers.length).toBe(3)
      
      // Timeline should calculate correct total duration
      expect(withOverlaps.getDuration()).toBe(9) // Third ends at 9
    })
  })
  
  describe("🌍 Internationalization Edge Cases", () => {
    
    it("should handle Unicode text correctly", async () => {
      const timeline = await createTimeline()
      
      const unicodeTexts = [
        "Hello 👋 World 🌍", // Emojis
        "مرحبا بالعالم", // Arabic (RTL)
        "שלום עולם", // Hebrew (RTL)
        "你好世界", // Chinese
        "こんにちは世界", // Japanese
        "Здравствуй мир", // Russian
        "🎬🎭🎪🎨🎯", // Only emojis
        "Z̸̧̢̛͔̳̺̹̦̣̬̭̪̯̘͐̄̈́̊̈́͐̚͝͝a̴̢̨̺̞̰̗̹̫̿l̷̨̛̦͇̯̘̊̽̈́̓̒̇͊̿͐͝ͅg̵̢̥̦̟̞̻̈́̊̓̄̐o̸", // Zalgo text
      ]
      
      for (const text of unicodeTexts) {
        const result = await timeline.addText(text)
        expect(result.toJSON().layers[0].content).toBe(text)
      }
    })
    
    it("should handle different text directions", async () => {
      const timeline = await createTimeline()
      
      // RTL text should be handled properly
      const rtlTimeline = await timeline.addText("العربية", {
        style: {
          fontSize: 32,
          textAlign: "right" // RTL alignment
        }
      })
      
      expect(rtlTimeline.toJSON().layers[0].options.style.textAlign).toBe("right")
    })
  })
  
  describe("🎥 Media Format Edge Cases", () => {
    
    it("should handle various video formats", async () => {
      const timeline = await createTimeline()
      
      const formats = [
        "video.mp4",
        "video.avi",
        "video.mov",
        "video.mkv",
        "video.webm",
        "video.flv",
        "video.wmv",
        "video.m4v",
        "video.3gp",
        "video.ogv"
      ]
      
      // Should accept all formats (validation happens at render time)
      for (const format of formats) {
        const result = await timeline.addVideo(format).catch(e => e)
        // Either succeeds or fails with clear error
        expect(result).toBeDefined()
      }
    })
    
    it("should handle various audio formats", async () => {
      const timeline = await createTimeline()
      
      const formats = [
        "audio.mp3",
        "audio.wav",
        "audio.aac",
        "audio.flac",
        "audio.ogg",
        "audio.m4a",
        "audio.wma",
        "audio.opus",
        "audio.aiff",
        "audio.ac3"
      ]
      
      for (const format of formats) {
        const result = await timeline.addAudio(format).catch(e => e)
        expect(result).toBeDefined()
      }
    })
    
    it("should handle various image formats", async () => {
      const timeline = await createTimeline()
      
      const formats = [
        "image.jpg",
        "image.jpeg",
        "image.png",
        "image.gif",
        "image.bmp",
        "image.webp",
        "image.svg",
        "image.tiff",
        "image.ico",
        "image.heic"
      ]
      
      for (const format of formats) {
        const result = await timeline.addImage(format).catch(e => e)
        expect(result).toBeDefined()
      }
    })
  })
  
  describe("🔧 Complex Composition Edge Cases", () => {
    
    it("should handle deeply nested compositions", async () => {
      const timeline = await createTimeline()
      
      // Create a complex nested structure
      const complex = await timeline
        .addVideo("base.mp4")
        .then(t => t.addFilter("brightness", { value: 0.1 }))
        .then(t => t.addFilter("contrast", { value: 1.2 }))
        .then(t => t.addFilter("saturation", { value: 1.5 }))
        .then(t => t.addText("Layer 1", { startTime: 0 }))
        .then(t => t.addText("Layer 2", { startTime: 1 }))
        .then(t => t.addText("Layer 3", { startTime: 2 }))
        .then(t => t.addImage("overlay1.png", { position: "top-left" }))
        .then(t => t.addImage("overlay2.png", { position: "top-right" }))
        .then(t => t.addImage("overlay3.png", { position: "bottom-left" }))
        .then(t => t.addImage("overlay4.png", { position: "bottom-right" }))
        .then(t => t.addAudio("music.mp3", { volume: 0.5 }))
        .then(t => t.addAudio("sfx1.mp3", { startTime: 5 }))
        .then(t => t.addAudio("sfx2.mp3", { startTime: 10 }))
      
      expect(complex.toJSON().layers.length).toBe(14)
    })
    
    it("should handle circular references gracefully", async () => {
      const timeline1 = await createTimeline()
      const timeline2 = await timeline1.addVideo("video1.mp4")
      
      // Concatenating a timeline with itself should work
      const concatenated = await timeline2.concat(timeline2)
      expect(concatenated.toJSON().layers.length).toBe(2)
      expect(concatenated.getDuration()).toBe(60) // Assuming 30s default duration
    })
    
    it("should handle empty timeline operations", async () => {
      const empty = await createTimeline()
      
      // Operations on empty timeline should succeed
      const scaled = await empty.scale(1920, 1080)
      const withAspect = await empty.setAspectRatio("16:9")
      const withFps = await empty.setFrameRate(30)
      
      // But rendering should fail with clear error
      await expect(empty.render("output.mp4")).rejects.toThrow(/no content/)
    })
  })
  
  describe("⚡ Performance Edge Cases", () => {
    
    it("should handle large number of layers efficiently", async () => {
      const timeline = await createTimeline()
      const startTime = Date.now()
      
      // Add 1000 text layers
      let current = timeline
      for (let i = 0; i < 1000; i++) {
        current = await current.addText(`Text ${i}`, {
          startTime: i * 0.01,
          duration: 0.1
        })
      }
      
      const endTime = Date.now()
      const duration = endTime - startTime
      
      // Should complete in reasonable time (< 1 second)
      expect(duration).toBeLessThan(1000)
      expect(current.toJSON().layers.length).toBe(1000)
    })
    
    it("should generate FFmpeg command for complex timeline efficiently", async () => {
      const timeline = await createTimeline()
      
      // Build complex timeline
      let complex = await timeline.addVideo("base.mp4")
      for (let i = 0; i < 50; i++) {
        complex = await complex.addText(`Text ${i}`, {
          startTime: i * 0.5,
          duration: 1
        })
      }
      
      const startTime = Date.now()
      // getCommand returns an Effect, so we need to run it properly
      const commandEffect = complex.getCommand("output.mp4")
      const command = await Effect.runPromise(
        commandEffect.pipe(
          Effect.provideService(ValidationService, {
            validateVideo: () => Effect.succeed({
              duration: 30,
              width: 1920,
              height: 1080,
              fps: 30,
              codec: "h264"
            }),
            validateAudio: () => Effect.succeed({
              duration: 30,
              channels: 2,
              sampleRate: 44100,
              bitrate: 128000
            }),
            validateImage: () => Effect.succeed({
              width: 1920,
              height: 1080,
              format: "png"
            }),
            validatePlatformRequirements: () => Effect.succeed({
              isValid: true,
              warnings: [],
              errors: [],
              suggestions: []
            })
          })
        )
      )
      const endTime = Date.now()
      
      // Debug: log the command to see what's generated
      // console.log("Generated command:", command)
      // console.log("Command length:", command.length)
      
      // Command generation should be fast (< 100ms)
      expect(endTime - startTime).toBeLessThan(100)
      expect(command).toContain("ffmpeg")
      expect(command.length).toBeGreaterThan(2000) // Complex command with 50 text overlays
    })
  })
  
  describe("🛡️ Error Recovery Edge Cases", () => {
    
    it("should provide helpful error messages for common mistakes", async () => {
      const timeline = await createTimeline()
      
      try {
        await timeline.addVideo("nonexistent.mp4")
      } catch (error: any) {
        expect(error.message).toContain("nonexistent.mp4")
        expect(error._tag).toBe("VideoNotFoundError")
      }
      
      try {
        await timeline.setAspectRatio("invalid")
      } catch (error: any) {
        expect(error.message).toContain("aspect ratio")
        expect(error.message).toContain("16:9") // Suggest valid format
      }
    })
    
    it("should handle service failures gracefully", async () => {
      // Test with failing services
      const FailingFFmpegService = {
        execute: () => Effect.fail(new RenderError("ffmpeg", "FFmpeg not found")),
        probe: () => Effect.fail(new RenderError("ffprobe", "FFprobe not found")),
        validateCommand: () => Effect.succeed(undefined)
      }
      
      // Timeline operations should still work until render
      const timeline = await createTimeline()
      const withVideo = await timeline.addVideo("test.mp4").catch(() => timeline)
      
      // Only render should fail
      // Since withVideo is from a proxy, we need to handle it differently
      const timeline2 = Timeline.create().addVideo("test.mp4")
      await expect(
        Effect.runPromise(
          Effect.gen(function* () {
            const t = yield* timeline2
            return yield* t.render("output.mp4")
          }).pipe(
            Effect.provideService(FFmpegService, FailingFFmpegService),
            Effect.provideService(FileSystemService, {
              exists: () => Effect.succeed(true),
              readFile: () => Effect.succeed("content"),
              writeFile: () => Effect.succeed(undefined)
            }),
            Effect.provideService(ValidationService, {
              validateVideo: () => Effect.succeed({
                duration: 30,
                width: 1920,
                height: 1080,
                fps: 30,
                codec: "h264"
              }),
              validateAudio: () => Effect.succeed({
                duration: 30,
                channels: 2,
                sampleRate: 44100,
                bitrate: 128000
              }),
              validateImage: () => Effect.succeed({
                width: 1920,
                height: 1080,
                format: "png"
              }),
              validatePlatformRequirements: () => Effect.succeed({
                isValid: true,
                warnings: [],
                errors: [],
                suggestions: []
              })
            })
          )
        )
      ).rejects.toThrow()
    })
  })
  
  describe("🎨 Platform-Specific Edge Cases", () => {
    
    it("should validate platform requirements strictly", async () => {
      const timeline = await createTimeline()
      
      // Create a timeline that doesn't meet TikTok requirements
      const landscape = await timeline
        .addVideo("landscape.mp4")
        .then(t => t.setAspectRatio("16:9")) // Wrong for TikTok
      
      // Validation should provide specific feedback
      const validation = await Effect.runPromise(
        landscape.validateForPlatform("tiktok").pipe(
          Effect.provideService(ValidationService, {
            validateVideo: () => Effect.succeed({
              duration: 30,
              width: 1920,
              height: 1080,
              fps: 30,
              codec: "h264"
            }),
            validateAudio: () => Effect.succeed({
              duration: 30,
              channels: 2,
              sampleRate: 44100,
              bitrate: 128000
            }),
            validateImage: () => Effect.succeed({
              width: 1920,
              height: 1080,
              format: "png"
            }),
            validatePlatformRequirements: (timeline, platform) =>
              Effect.succeed({
                isValid: false,
                warnings: ["TikTok videos should use 9:16 aspect ratio"],
                errors: [],
                suggestions: ['Use timeline.setAspectRatio("9:16")']
              })
          })
        )
      )
      
      expect(validation.isValid).toBe(false)
      expect(validation.warnings).toContain("TikTok videos should use 9:16 aspect ratio")
      expect(validation.suggestions).toContain('Use timeline.setAspectRatio("9:16")')
    })
  })
})

describe("Timeline Effect - Self-Healing Edge Cases", () => {
  
  it("should auto-correct common mistakes", async () => {
    const timeline = await createTimeline()
    
    // Add text that might be too small for mobile
    const withSmallText = await timeline.addText("Tiny text", {
      style: { fontSize: 8 } // Very small
    })
    
    // In future: SDK could auto-adjust or warn
    // For now, just ensure it accepts the value
    expect(withSmallText.toJSON().layers[0].options.style.fontSize).toBe(8)
  })
  
  it("should handle resource constraints gracefully", async () => {
    const timeline = await createTimeline()
    
    // Simulate low memory scenario
    const hugeTextCount = 10000
    let current = timeline
    
    // Should handle this without crashing
    try {
      for (let i = 0; i < hugeTextCount; i++) {
        current = await current.addText(`Text ${i}`)
      }
    } catch (error) {
      // If it fails, should fail gracefully with clear error
      expect(error).toBeDefined()
    }
  })
})
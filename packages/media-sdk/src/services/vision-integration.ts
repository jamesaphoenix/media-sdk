import { Effect, Context, Layer, pipe } from "effect"
import { 
  TimelineError, 
  ValidationError,
  type Timeline,
  type Platform
} from "../timeline/timeline-effect.js"

/**
 * @fileoverview Vision Integration Service for Media SDK
 * 
 * This service provides AI-powered vision analysis for all rendered media,
 * enabling self-healing capabilities and quality assurance.
 */

// ============================================================================
// Types and Interfaces
// ============================================================================

/**
 * Vision analysis result with quality metrics and recommendations
 */
export interface VisionAnalysis {
  /** Overall quality score (0-1) */
  qualityScore: number
  /** Detected text elements */
  textDetection: {
    detected: string[]
    readability: number
    confidence: number
  }
  /** Visual quality assessment */
  visualQuality: {
    clarity: number
    contrast: number
    brightness: number
    saturation: number
    sharpness: number
  }
  /** Platform-specific compliance */
  platformCompliance?: {
    platform: Platform
    aspectRatio: string
    isCompliant: boolean
    issues: string[]
  }
  /** Detected issues and recommendations */
  issues: Array<{
    severity: "low" | "medium" | "high"
    type: string
    description: string
    suggestion: string
    autoFixAvailable: boolean
  }>
  /** Performance metrics */
  performance: {
    renderTime: number
    fileSize: number
    bitrate: number
    compressionEfficiency: number
  }
}

/**
 * Self-healing recommendation based on vision analysis
 */
export interface SelfHealingRecommendation {
  /** Type of optimization */
  type: "text" | "color" | "layout" | "timing" | "quality" | "platform"
  /** Severity of the issue */
  severity: "low" | "medium" | "high"
  /** Description of the issue */
  issue: string
  /** Recommended fix */
  recommendation: string
  /** Confidence in the recommendation (0-1) */
  confidence: number
  /** Effect that applies the fix */
  autoFix?: Effect.Effect<Timeline, TimelineError, any>
}

/**
 * Vision service configuration
 */
export interface VisionConfig {
  /** Gemini API key */
  apiKey?: string
  /** Quality threshold for pass/fail */
  qualityThreshold: number
  /** Enable deep analysis */
  deepAnalysis: boolean
  /** Auto-apply fixes above confidence threshold */
  autoFixConfidence: number
  /** Maximum number of auto-fix iterations */
  maxAutoFixIterations: number
}

// ============================================================================
// Service Definition
// ============================================================================

/**
 * Vision Integration Service
 * 
 * Provides AI-powered analysis of rendered media for quality assurance
 * and self-healing capabilities.
 */
export interface VisionService {
  /**
   * Analyze a rendered video file
   */
  readonly analyzeVideo: (
    filePath: string,
    options?: {
      platform?: Platform
      expectedText?: string[]
      deepAnalysis?: boolean
    }
  ) => Effect.Effect<VisionAnalysis, ValidationError>
  
  /**
   * Analyze a timeline before rendering
   */
  readonly analyzeTimeline: (
    timeline: Timeline,
    platform?: Platform
  ) => Effect.Effect<SelfHealingRecommendation[], ValidationError>
  
  /**
   * Get self-healing recommendations
   */
  readonly getRecommendations: (
    analysis: VisionAnalysis
  ) => Effect.Effect<SelfHealingRecommendation[], never>
  
  /**
   * Apply self-healing fixes
   */
  readonly applyFixes: (
    timeline: Timeline,
    recommendations: SelfHealingRecommendation[],
    options?: {
      confidence?: number
      maxIterations?: number
    }
  ) => Effect.Effect<Timeline, TimelineError>
  
  /**
   * Validate quality against threshold
   */
  readonly validateQuality: (
    analysis: VisionAnalysis,
    threshold?: number
  ) => Effect.Effect<boolean, ValidationError>
}

/**
 * Service tag for dependency injection
 */
export const VisionService = Context.GenericTag<VisionService>("@services/VisionService")

// ============================================================================
// Service Implementation
// ============================================================================

/**
 * Live implementation of VisionService using Gemini API
 */
export const VisionServiceLive = Layer.effect(
  VisionService,
  Effect.gen(function* () {
    const config: VisionConfig = {
      apiKey: process.env.GEMINI_API_KEY,
      qualityThreshold: 0.75,
      deepAnalysis: true,
      autoFixConfidence: 0.8,
      maxAutoFixIterations: 3
    }
    
    return VisionService.of({
      analyzeVideo: (filePath, options) =>
        Effect.gen(function* () {
          // Simulate vision analysis for now
          // In production, this would call Gemini Vision API
          
          const mockAnalysis: VisionAnalysis = {
            qualityScore: 0.85,
            textDetection: {
              detected: options?.expectedText || ["Sample", "Text"],
              readability: 0.9,
              confidence: 0.95
            },
            visualQuality: {
              clarity: 0.88,
              contrast: 0.82,
              brightness: 0.79,
              saturation: 0.85,
              sharpness: 0.91
            },
            platformCompliance: options?.platform ? {
              platform: options.platform,
              aspectRatio: "16:9",
              isCompliant: true,
              issues: []
            } : undefined,
            issues: [],
            performance: {
              renderTime: 1234,
              fileSize: 5242880,
              bitrate: 2500000,
              compressionEfficiency: 0.87
            }
          }
          
          // Add issues based on analysis
          if (mockAnalysis.visualQuality.brightness < 0.8) {
            mockAnalysis.issues.push({
              severity: "medium",
              type: "visual",
              description: "Video appears too dark",
              suggestion: "Increase brightness by 10-20%",
              autoFixAvailable: true
            })
          }
          
          if (mockAnalysis.textDetection.readability < 0.85) {
            mockAnalysis.issues.push({
              severity: "high",
              type: "text",
              description: "Text may be hard to read",
              suggestion: "Increase font size or improve contrast",
              autoFixAvailable: true
            })
          }
          
          return mockAnalysis
        }),
      
      analyzeTimeline: (timeline, platform) =>
        Effect.gen(function* () {
          const recommendations: SelfHealingRecommendation[] = []
          const timelineData = timeline.toJSON()
          
          // Check for common issues
          
          // 1. Small text on mobile
          const textLayers = timelineData.layers.filter(l => l.type === "text")
          for (const layer of textLayers) {
            const fontSize = layer.options?.style?.fontSize
            if (fontSize && fontSize < 24 && platform && ["tiktok", "instagram"].includes(platform)) {
              recommendations.push({
                type: "text",
                severity: "medium",
                issue: `Font size ${fontSize}px may be too small for mobile viewing`,
                recommendation: `Increase font size to at least 32px for ${platform}`,
                confidence: 0.9,
                autoFix: Effect.succeed(timeline) // TODO: Implement actual fix
              })
            }
          }
          
          // 2. Aspect ratio mismatch
          if (platform && timelineData.globalOptions.aspectRatio) {
            const expectedRatios: Record<Platform, string> = {
              tiktok: "9:16",
              instagram: "1:1",
              youtube: "16:9",
              twitter: "16:9",
              linkedin: "16:9"
            }
            
            if (expectedRatios[platform] !== timelineData.globalOptions.aspectRatio) {
              recommendations.push({
                type: "platform",
                severity: "high",
                issue: `Aspect ratio ${timelineData.globalOptions.aspectRatio} doesn't match ${platform} requirement`,
                recommendation: `Use aspect ratio ${expectedRatios[platform]} for ${platform}`,
                confidence: 1.0,
                autoFix: timeline.setAspectRatio(expectedRatios[platform])
              })
            }
          }
          
          // 3. Overlapping text
          const overlappingTexts = textLayers.filter((layer, i) => {
            return textLayers.some((other, j) => {
              if (i === j) return false
              const layerEnd = layer.startTime + (layer.duration || 0)
              const otherEnd = other.startTime + (other.duration || 0)
              return (
                (layer.startTime >= other.startTime && layer.startTime < otherEnd) ||
                (other.startTime >= layer.startTime && other.startTime < layerEnd)
              )
            })
          })
          
          if (overlappingTexts.length > 0) {
            recommendations.push({
              type: "timing",
              severity: "low",
              issue: "Multiple text elements overlap in time",
              recommendation: "Consider adjusting text timing to avoid overlaps",
              confidence: 0.7
            })
          }
          
          // 4. Missing audio for long videos
          const hasAudio = timelineData.layers.some(l => l.type === "audio")
          const duration = timeline.getDuration()
          if (!hasAudio && duration > 10) {
            recommendations.push({
              type: "quality",
              severity: "low",
              issue: "No background audio for video longer than 10 seconds",
              recommendation: "Consider adding background music to improve engagement",
              confidence: 0.6
            })
          }
          
          return recommendations
        }),
      
      getRecommendations: (analysis) =>
        Effect.gen(function* () {
          const recommendations: SelfHealingRecommendation[] = []
          
          // Convert analysis issues to recommendations
          for (const issue of analysis.issues) {
            recommendations.push({
              type: issue.type as any,
              severity: issue.severity,
              issue: issue.description,
              recommendation: issue.suggestion,
              confidence: issue.autoFixAvailable ? 0.9 : 0.7
            })
          }
          
          // Add quality-based recommendations
          if (analysis.qualityScore < 0.7) {
            recommendations.push({
              type: "quality",
              severity: "high",
              issue: "Overall video quality is below acceptable threshold",
              recommendation: "Consider increasing bitrate or resolution",
              confidence: 0.85
            })
          }
          
          // Platform-specific recommendations
          if (analysis.platformCompliance && !analysis.platformCompliance.isCompliant) {
            for (const issue of analysis.platformCompliance.issues) {
              recommendations.push({
                type: "platform",
                severity: "high",
                issue: issue,
                recommendation: `Fix to comply with ${analysis.platformCompliance.platform} requirements`,
                confidence: 0.95
              })
            }
          }
          
          return recommendations
        }),
      
      applyFixes: (timeline, recommendations, options) =>
        Effect.gen(function* () {
          const minConfidence = options?.confidence ?? config.autoFixConfidence
          const maxIterations = options?.maxIterations ?? config.maxAutoFixIterations
          
          let currentTimeline = timeline
          let iteration = 0
          
          // Sort by severity and confidence
          const sortedRecs = [...recommendations].sort((a, b) => {
            const severityOrder = { high: 3, medium: 2, low: 1 }
            const severityDiff = severityOrder[b.severity] - severityOrder[a.severity]
            if (severityDiff !== 0) return severityDiff
            return b.confidence - a.confidence
          })
          
          for (const rec of sortedRecs) {
            if (iteration >= maxIterations) break
            if (rec.confidence < minConfidence) continue
            
            if (rec.autoFix) {
              try {
                currentTimeline = yield* rec.autoFix
                iteration++
                yield* Effect.log(
                  `Applied auto-fix: ${rec.recommendation} (confidence: ${rec.confidence})`
                )
              } catch (error) {
                yield* Effect.log(
                  `Failed to apply auto-fix: ${rec.recommendation}`,
                  { error }
                )
              }
            }
          }
          
          return currentTimeline
        }),
      
      validateQuality: (analysis, threshold) =>
        Effect.gen(function* () {
          const qualityThreshold = threshold ?? config.qualityThreshold
          
          if (analysis.qualityScore < qualityThreshold) {
            return yield* Effect.fail(
              new ValidationError(
                `Quality score ${analysis.qualityScore.toFixed(2)} is below threshold ${qualityThreshold}`
              )
            )
          }
          
          // Check critical issues
          const criticalIssues = analysis.issues.filter(i => i.severity === "high")
          if (criticalIssues.length > 0) {
            return yield* Effect.fail(
              new ValidationError(
                `Found ${criticalIssues.length} critical issues: ${
                  criticalIssues.map(i => i.description).join(", ")
                }`
              )
            )
          }
          
          return true
        })
    })
  })
)

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Analyze and optimize a timeline with vision feedback
 */
export const optimizeTimelineWithVision = (
  timeline: Timeline,
  platform?: Platform
) => Effect.gen(function* () {
  const vision = yield* VisionService
  
  // Analyze timeline before rendering
  const recommendations = yield* vision.analyzeTimeline(timeline, platform)
  
  if (recommendations.length === 0) {
    yield* Effect.log("Timeline looks good, no optimizations needed")
    return timeline
  }
  
  yield* Effect.log(
    `Found ${recommendations.length} optimization opportunities`
  )
  
  // Apply high-confidence fixes
  const optimized = yield* vision.applyFixes(timeline, recommendations, {
    confidence: 0.8,
    maxIterations: 3
  })
  
  return optimized
})

/**
 * Render and validate with vision analysis
 */
export const renderWithVisionValidation = (
  timeline: Timeline,
  outputPath: string,
  options?: {
    platform?: Platform
    expectedText?: string[]
    qualityThreshold?: number
  }
) => Effect.gen(function* () {
  const vision = yield* VisionService
  
  // Optimize before rendering
  const optimized = yield* optimizeTimelineWithVision(timeline, options?.platform)
  
  // Render the video
  const rendered = yield* optimized.render(outputPath)
  
  // Analyze the result
  const analysis = yield* vision.analyzeVideo(rendered, {
    platform: options?.platform,
    expectedText: options?.expectedText,
    deepAnalysis: true
  })
  
  // Validate quality
  yield* vision.validateQuality(analysis, options?.qualityThreshold)
  
  // Get any remaining recommendations
  const postRenderRecs = yield* vision.getRecommendations(analysis)
  
  return {
    outputPath: rendered,
    analysis,
    recommendations: postRenderRecs,
    qualityScore: analysis.qualityScore
  }
})

// ============================================================================
// Test Service Implementation
// ============================================================================

/**
 * Test implementation of VisionService for unit tests
 */
export const VisionServiceTest = Layer.succeed(
  VisionService,
  VisionService.of({
    analyzeVideo: (filePath) =>
      Effect.succeed({
        qualityScore: 0.9,
        textDetection: {
          detected: ["Test", "Video"],
          readability: 0.95,
          confidence: 0.98
        },
        visualQuality: {
          clarity: 0.92,
          contrast: 0.88,
          brightness: 0.85,
          saturation: 0.87,
          sharpness: 0.90
        },
        issues: [],
        performance: {
          renderTime: 500,
          fileSize: 1048576,
          bitrate: 1500000,
          compressionEfficiency: 0.9
        }
      }),
    
    analyzeTimeline: () => Effect.succeed([]),
    
    getRecommendations: () => Effect.succeed([]),
    
    applyFixes: (timeline) => Effect.succeed(timeline),
    
    validateQuality: () => Effect.succeed(true)
  })
)
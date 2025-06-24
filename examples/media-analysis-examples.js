/**
 * Media Analysis Examples
 * 
 * Comprehensive examples showing how to use Gemini API integration
 * for intelligent media analysis with video, audio, and image understanding.
 */

import { Timeline } from '@jamesaphoenix/media-sdk';
import { createMediaAnalysisService, MediaAnalysisIntegration } from '../packages/media-sdk/src/services/media-analysis.js';

// Initialize the analysis service
const analysisService = createMediaAnalysisService(process.env.GEMINI_API_KEY);

// Example 1: Comprehensive Video Analysis
async function analyzeVideoContent() {
  console.log('🎬 Analyzing video content...');
  
  const analysis = await analysisService.analyzeMedia('assets/sample-video.mp4', {
    analysisTypes: ['content', 'technical', 'quality', 'optimization'],
    targetPlatform: 'youtube',
    analysisDepth: 'comprehensive',
    generateEditingCode: true
  });
  
  console.log('📊 Analysis Results:');
  console.log('Summary:', analysis.primary.summary);
  console.log('Quality Score:', analysis.primary.quality.overall);
  
  // Video-specific insights
  if (analysis.video) {
    console.log('🎞️ Video Insights:');
    console.log('Duration:', analysis.video.duration, 'seconds');
    console.log('Resolution:', `${analysis.video.resolution.width}x${analysis.video.resolution.height}`);
    console.log('Scenes detected:', analysis.video.scenes.length);
    
    // Show scene breakdown
    analysis.video.scenes.forEach((scene, index) => {
      console.log(`Scene ${index + 1}: ${scene.startTime} - ${scene.endTime}`);
      console.log(`  Description: ${scene.description}`);
    });
  }
  
  // Platform optimization suggestions
  console.log('🚀 YouTube Optimization:');
  console.log('Score:', analysis.platformOptimization.youtube.score);
  analysis.platformOptimization.youtube.suggestions.forEach(suggestion => {
    console.log('  -', suggestion);
  });
  
  // Editing suggestions with implementation code
  console.log('✨ Editing Suggestions:');
  analysis.editingSuggestions
    .filter(s => s.priority === 'high')
    .forEach(suggestion => {
      console.log(`${suggestion.type.toUpperCase()}: ${suggestion.suggestion}`);
      console.log(`Implementation: ${suggestion.implementation}`);
      console.log(`Expected improvement: ${(suggestion.estimatedImprovement * 100).toFixed(1)}%`);
    });
  
  return analysis;
}

// Example 2: Audio Transcription and Quality Analysis
async function analyzeAudioContent() {
  console.log('🎵 Analyzing audio content...');
  
  const analysis = await analysisService.analyzeMedia('assets/podcast-episode.mp3', {
    analysisTypes: ['transcription', 'quality'],
    language: 'en',
    targetPlatform: 'general'
  });
  
  console.log('📝 Transcription Results:');
  console.log('Full text:', analysis.audio.transcription.text.slice(0, 200) + '...');
  
  // Show timestamped transcription
  console.log('⏰ Timestamped Segments:');
  analysis.audio.transcription.timestamps.slice(0, 5).forEach(segment => {
    console.log(`[${segment.time}] ${segment.text} (confidence: ${(segment.confidence * 100).toFixed(1)}%)`);
  });
  
  // Audio quality assessment
  console.log('🔊 Audio Quality:');
  console.log('Clarity:', (analysis.audio.audioQuality.clarity * 100).toFixed(1) + '%');
  console.log('Background noise:', (analysis.audio.audioQuality.backgroundNoise * 100).toFixed(1) + '%');
  console.log('Audio levels:', (analysis.audio.audioQuality.levels * 100).toFixed(1) + '%');
  
  // Soundscape analysis
  console.log('🎶 Soundscape Elements:');
  analysis.audio.soundscape.forEach(element => {
    console.log('  -', element);
  });
  
  return analysis;
}

// Example 3: Image Analysis with Object Detection
async function analyzeImageContent() {
  console.log('🖼️ Analyzing image content...');
  
  const analysis = await analysisService.analyzeMedia('assets/product-photo.jpg', {
    analysisTypes: ['quality', 'technical'],
    includeObjectDetection: true,
    includeSegmentation: true,
    targetPlatform: 'instagram'
  });
  
  console.log('📸 Image Analysis Results:');
  console.log('Technical quality:', (analysis.image.technical.resolution.width + 'x' + analysis.image.technical.resolution.height));
  console.log('File size:', (analysis.image.technical.fileSize / 1024 / 1024).toFixed(2) + ' MB');
  
  // Composition analysis
  console.log('🎨 Composition:');
  console.log('Rule of thirds:', analysis.image.composition.rule_of_thirds ? 'Yes' : 'No');
  console.log('Balance score:', (analysis.image.composition.balance * 100).toFixed(1) + '%');
  console.log('Focal point:', analysis.image.composition.focal_point);
  
  // Aesthetic scores
  console.log('✨ Aesthetics:');
  console.log('Lighting:', (analysis.image.aesthetics.lighting * 100).toFixed(1) + '%');
  console.log('Color harmony:', (analysis.image.aesthetics.colorHarmony * 100).toFixed(1) + '%');
  console.log('Composition:', (analysis.image.aesthetics.composition * 100).toFixed(1) + '%');
  
  // Object detection results
  if (analysis.image.objects.length > 0) {
    console.log('🔍 Detected Objects:');
    analysis.image.objects.forEach(obj => {
      console.log(`  - ${obj.label} (confidence: ${(obj.confidence * 100).toFixed(1)}%)`);
      if (obj.boundingBox) {
        console.log(`    Bounding box: [${obj.boundingBox.join(', ')}]`);
      }
    });
  }
  
  // Instagram optimization
  console.log('📱 Instagram Optimization:');
  console.log('Score:', analysis.platformOptimization.instagram.score);
  analysis.platformOptimization.instagram.suggestions.forEach(suggestion => {
    console.log('  -', suggestion);
  });
  
  return analysis;
}

// Example 4: Multi-Media Analysis
async function analyzeMultipleMedia() {
  console.log('🎭 Analyzing multiple media files...');
  
  const mediaFiles = [
    'assets/intro-video.mp4',
    'assets/background-music.mp3',
    'assets/thumbnail-image.jpg'
  ];
  
  const analysis = await analysisService.analyzeMultipleMedia(mediaFiles, {
    targetPlatform: 'youtube',
    analysisDepth: 'comprehensive'
  });
  
  console.log('📊 Combined Analysis:');
  console.log('Media type:', analysis.mediaType);
  console.log('Overall quality:', (analysis.primary.quality.overall * 100).toFixed(1) + '%');
  console.log('Key elements found:', analysis.primary.keyElements.length);
  
  // Show combined insights
  console.log('💡 Combined Insights:');
  analysis.primary.keyElements.slice(0, 5).forEach(element => {
    console.log('  -', element);
  });
  
  return analysis;
}

// Example 5: Timeline Integration with Analysis
async function analyzeTimelineWithMedia() {
  console.log('🎬 Analyzing timeline with integrated media...');
  
  // Create a timeline with multiple media types
  const timeline = new Timeline()
    .addVideo('assets/main-content.mp4')
    .addAudio('assets/background-music.mp3', { volume: 0.3 })
    .addImage('assets/logo.png', { 
      position: 'top-right', 
      scale: 0.1,
      duration: 30 
    })
    .addText('Welcome to our channel!', {
      position: 'center',
      startTime: 2,
      duration: 3,
      style: { fontSize: 48, color: '#ffffff' }
    });
  
  // Analyze the timeline's media
  const result = await MediaAnalysisIntegration.analyzeTimelineMedia(
    timeline,
    analysisService,
    {
      targetPlatform: 'youtube',
      analysisDepth: 'expert',
      generateEditingCode: true
    }
  );
  
  console.log('📈 Timeline Analysis Results:');
  console.log('Individual analyses:', result.analyses.length);
  console.log('Combined insights:', result.combinedInsights.length);
  console.log('Optimization suggestions:', result.optimizationSuggestions.length);
  
  // Show insights
  console.log('💭 Combined Insights:');
  result.combinedInsights.slice(0, 3).forEach(insight => {
    console.log('  -', insight);
  });
  
  // Show optimization suggestions
  console.log('🚀 Optimization Suggestions:');
  result.optimizationSuggestions.slice(0, 3).forEach(suggestion => {
    console.log('  -', suggestion);
  });
  
  // The automated improvements timeline
  console.log('✨ Automated Improvements Applied');
  const improvedCommand = result.automatedImprovements.getCommand('improved-output.mp4');
  console.log('Improved timeline command length:', improvedCommand.length);
  
  return result;
}

// Example 6: Content Creation Workflow
async function contentCreationWorkflow() {
  console.log('🎨 Running content creation workflow...');
  
  // Step 1: Analyze raw footage
  const rawFootageAnalysis = await analysisService.analyzeMedia('assets/raw-footage.mp4', {
    analysisTypes: ['content', 'quality', 'editing'],
    targetPlatform: 'tiktok',
    generateEditingCode: true
  });
  
  console.log('📹 Raw Footage Analysis:');
  console.log('Content category:', rawFootageAnalysis.content.category);
  console.log('Mood:', rawFootageAnalysis.content.mood);
  console.log('Quality score:', (rawFootageAnalysis.primary.quality.overall * 100).toFixed(1) + '%');
  
  // Step 2: Apply AI-suggested improvements
  let timeline = new Timeline()
    .addVideo('assets/raw-footage.mp4')
    .setAspectRatio('9:16') // TikTok format
    .setResolution(1080, 1920);
  
  // Apply high-priority suggestions automatically
  console.log('🤖 Applying AI suggestions...');
  rawFootageAnalysis.editingSuggestions
    .filter(s => s.priority === 'high')
    .forEach(suggestion => {
      console.log(`Applying: ${suggestion.suggestion}`);
      console.log(`Code: ${suggestion.implementation}`);
      
      // In real implementation, would parse and apply the suggestion code
      if (suggestion.type === 'visual' && suggestion.implementation.includes('brightness')) {
        timeline = timeline.addFilter('eq=brightness=0.1');
      }
      if (suggestion.type === 'audio' && suggestion.implementation.includes('volume')) {
        timeline = timeline.addFilter('volume=1.2');
      }
    });
  
  // Step 3: Add platform-specific optimizations
  console.log('📱 Adding TikTok optimizations...');
  const tiktokSuggestions = rawFootageAnalysis.platformOptimization.tiktok.suggestions;
  
  // Add hook text if suggested
  if (tiktokSuggestions.some(s => s.includes('hook'))) {
    timeline = timeline.addText('Wait for it...', {
      position: { x: 'center', y: '20%' },
      style: {
        fontSize: 48,
        color: '#ffff00',
        fontFamily: 'Arial Black'
      },
      startTime: 0,
      duration: 3
    });
  }
  
  // Add music if suggested
  if (tiktokSuggestions.some(s => s.includes('music') || s.includes('audio'))) {
    timeline = timeline.addAudio('assets/trending-sound.mp3', {
      volume: 0.6,
      fadeIn: 1,
      fadeOut: 2
    });
  }
  
  // Step 4: Generate final output
  const finalCommand = timeline.getCommand('tiktok-optimized.mp4');
  console.log('🎯 Final optimized timeline created');
  console.log('Command length:', finalCommand.length);
  
  // Step 5: Analyze the final result (if we had the rendered output)
  console.log('✅ Content creation workflow complete!');
  console.log('Applied improvements:', rawFootageAnalysis.editingSuggestions.filter(s => s.priority === 'high').length);
  console.log('Platform optimizations:', tiktokSuggestions.length);
  
  return {
    originalAnalysis: rawFootageAnalysis,
    optimizedTimeline: timeline,
    finalCommand
  };
}

// Example 7: Quality Assessment and Comparison
async function qualityAssessmentWorkflow() {
  console.log('🔍 Running quality assessment workflow...');
  
  // Analyze multiple versions of the same content
  const versions = [
    { name: 'Original', path: 'assets/original-video.mp4' },
    { name: 'Compressed', path: 'assets/compressed-video.mp4' },
    { name: 'Enhanced', path: 'assets/enhanced-video.mp4' }
  ];
  
  const analyses = await Promise.all(
    versions.map(async version => ({
      name: version.name,
      analysis: await analysisService.analyzeMedia(version.path, {
        analysisTypes: ['quality', 'technical'],
        analysisDepth: 'expert'
      })
    }))
  );
  
  console.log('📊 Quality Comparison:');
  console.log('Version\t\tOverall\tVisual\tAudio\tTechnical');
  console.log('-------\t\t-------\t------\t-----\t---------');
  
  analyses.forEach(({ name, analysis }) => {
    const overall = (analysis.primary.quality.overall * 100).toFixed(1);
    const visual = analysis.video ? (analysis.video.visualQuality * 100).toFixed(1) : 'N/A';
    const audio = analysis.audio ? (analysis.audio.audioQuality.clarity * 100).toFixed(1) : 'N/A';
    const technical = (analysis.primary.quality.technical * 100).toFixed(1);
    
    console.log(`${name}\t\t${overall}%\t${visual}%\t${audio}%\t${technical}%`);
  });
  
  // Find the best version
  const bestVersion = analyses.reduce((best, current) => 
    current.analysis.primary.quality.overall > best.analysis.primary.quality.overall ? current : best
  );
  
  console.log(`🏆 Best version: ${bestVersion.name} (${(bestVersion.analysis.primary.quality.overall * 100).toFixed(1)}% quality)`);
  
  return analyses;
}

// Run examples
async function runAllExamples() {
  try {
    console.log('🚀 Starting Media Analysis Examples\n');
    
    // Example 1: Video Analysis
    await analyzeVideoContent();
    console.log('\n' + '='.repeat(50) + '\n');
    
    // Example 2: Audio Analysis  
    await analyzeAudioContent();
    console.log('\n' + '='.repeat(50) + '\n');
    
    // Example 3: Image Analysis
    await analyzeImageContent();
    console.log('\n' + '='.repeat(50) + '\n');
    
    // Example 4: Multi-Media Analysis
    await analyzeMultipleMedia();
    console.log('\n' + '='.repeat(50) + '\n');
    
    // Example 5: Timeline Integration
    await analyzeTimelineWithMedia();
    console.log('\n' + '='.repeat(50) + '\n');
    
    // Example 6: Content Creation Workflow
    await contentCreationWorkflow();
    console.log('\n' + '='.repeat(50) + '\n');
    
    // Example 7: Quality Assessment
    await qualityAssessmentWorkflow();
    
    console.log('\n✅ All examples completed successfully!');
    
  } catch (error) {
    console.error('❌ Error running examples:', error);
    
    if (error.message.includes('API key')) {
      console.log('\n💡 Make sure to set your GEMINI_API_KEY environment variable:');
      console.log('export GEMINI_API_KEY="your-api-key-here"');
    }
  }
}

// Export for use in other files
export {
  analyzeVideoContent,
  analyzeAudioContent,
  analyzeImageContent,
  analyzeMultipleMedia,
  analyzeTimelineWithMedia,
  contentCreationWorkflow,
  qualityAssessmentWorkflow,
  runAllExamples
};

// Example 8: Green Screen Meme Creation
function createGreenScreenMemes() {
  console.log('🎭 Creating Green Screen Memes...');
  
  // Example 1: Reaction meme with image background
  const reactionMeme = new Timeline()
    .addGreenScreenWithImageBackground(
      'assets/green-screen-person.mp4',
      'assets/explosion-background.jpg',
      {
        chromaKey: '#00FF00',
        chromaSimilarity: 0.4,
        chromaBlend: 0.1,
        backgroundScale: 'fill'
      }
    )
    .addText('When you see the code review comments', {
      position: 'top',
      style: {
        fontSize: 48,
        color: '#ffffff',
        strokeColor: '#000000',
        strokeWidth: 3
      }
    })
    .setAspectRatio('9:16');

  console.log('🔥 Reaction Meme Command:');
  console.log(reactionMeme.getCommand('output/reaction-meme.mp4'));

  // Example 2: Gaming meme with video background
  const gamingMeme = new Timeline()
    .addGreenScreenWithVideoBackground(
      'assets/streamer-reaction.mp4',
      'assets/game-explosion.mp4',
      {
        chromaKey: '#00FF00',
        chromaSimilarity: 0.45,
        chromaBlend: 0.15,
        backgroundScale: 'crop',
        audioMix: 'greenscreen',
        backgroundLoop: true
      }
    )
    .addText('EPIC FAIL!', {
      position: 'center',
      style: {
        fontSize: 64,
        color: '#ff0000',
        strokeColor: '#ffffff',
        strokeWidth: 4
      }
    })
    .setAspectRatio('16:9');

  console.log('🎮 Gaming Meme Command:');
  console.log(gamingMeme.getCommand('output/gaming-meme.mp4'));

  // Example 3: Weather reporter preset
  const weatherMeme = new Timeline()
    .addGreenScreenMeme(
      'assets/pointing-person.mp4',
      'assets/weather-map.jpg',
      'weather',
      {
        platform: 'youtube',
        professional: true
      }
    )
    .addText('Me explaining why the servers are down', {
      position: 'bottom',
      style: {
        fontSize: 32,
        color: '#ffffff',
        backgroundColor: 'rgba(0,0,0,0.8)',
        padding: 15
      }
    })
    .setAspectRatio('16:9');

  console.log('🌤️ Weather Reporter Meme Command:');
  console.log(weatherMeme.getCommand('output/weather-meme.mp4'));

  // Example 4: Comedy meme with solid color
  const comedyMeme = new Timeline()
    .addGreenScreenMeme(
      'assets/shocked-face.mp4',
      'assets/red-background.jpg',
      'comedy',
      {
        platform: 'tiktok',
        intensity: 'high'
      }
    )
    .addText('POV: You deployed on Friday', {
      position: 'top',
      style: {
        fontSize: 44,
        color: '#ffffff',
        strokeColor: '#000000',
        strokeWidth: 3
      }
    })
    .addText('🔥 RIP WEEKEND 🔥', {
      position: 'bottom',
      style: {
        fontSize: 36,
        color: '#ff0000',
        strokeColor: '#ffffff',
        strokeWidth: 2
      }
    })
    .setAspectRatio('9:16');

  console.log('😂 Comedy Meme Command:');
  console.log(comedyMeme.getCommand('output/comedy-meme.mp4'));

  console.log('\n🎯 Available Green Screen Presets:');
  console.log('- reaction: High engagement for reaction videos');
  console.log('- weather: Professional weather reporter style');
  console.log('- gaming: Gaming content with dynamic effects');
  console.log('- educational: Clean professional educational content');
  console.log('- news: Professional news broadcast style');
  console.log('- comedy: High contrast for viral comedy content');

  console.log('\n✨ Key Features:');
  console.log('✅ Replace green screen with image or video backgrounds');
  console.log('✅ Automatic platform optimization (TikTok, YouTube, Instagram)');
  console.log('✅ Professional presets for different content types');
  console.log('✅ Advanced chromakey controls (similarity, blend, YUV)');
  console.log('✅ Multiple background scaling modes (fit, fill, stretch, crop)');
  console.log('✅ Audio mixing options for video backgrounds');
  console.log('✅ Background video looping support');
  console.log('✅ Integration with text overlays and effects');
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  runAllExamples();
  console.log('\n' + '='.repeat(50) + '\n');
  createGreenScreenMemes();
}
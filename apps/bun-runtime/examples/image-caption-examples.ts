/**
 * PRACTICAL IMAGE CAPTION EXAMPLES
 * 
 * Real-world examples showing how to use the advanced image caption system
 * for common use cases like product demonstrations, tutorials, and social media.
 */

import {
  ImageCaptionComposer,
  QuickImageCaptions,
  CaptionDurationCalculator,
  CaptionTransitionBuilder,
  imageCaptionPresets,
  type ImageCaptionConfig,
  type ImageCaptionSegment
} from '../../../packages/media-sdk/src/captions/image-captions.js';

import { Timeline } from '@jamesaphoenix/media-sdk';

/**
 * Example 1: Product Feature Showcase
 * Shows how to highlight different features of a product image with timed captions
 */
export function createProductShowcase() {
  console.log('🛍️ Creating product feature showcase...');
  
  const productFeatures: ImageCaptionSegment[] = [
    {
      id: 'brand-logo',
      text: 'Premium Brand Quality',
      startTime: 1.0,
      endTime: 4.0,
      position: { x: '15%', y: '10%', anchor: 'top-left' },
      style: {
        fontSize: 24,
        color: '#ffffff',
        background: { color: 'rgba(0,0,0,0.8)', padding: 8, borderRadius: 4 },
        border: { width: 2, color: '#gold', style: 'solid' }
      },
      enterTransition: CaptionTransitionBuilder.createEntranceTransition('fade', 0.8),
      exitTransition: CaptionTransitionBuilder.createExitTransition('fade', 0.5)
    },
    {
      id: 'main-feature',
      text: 'Advanced Technology',
      startTime: 2.5,
      endTime: 6.0,
      position: { x: '50%', y: '40%', anchor: 'center' },
      style: {
        fontSize: 36,
        color: '#00ff00',
        fontWeight: 'bold',
        strokeColor: '#000000',
        strokeWidth: 3,
        glow: { color: '#00ff00', intensity: 1.5, radius: 10 }
      },
      enterTransition: CaptionTransitionBuilder.createEntranceTransition('scale', 1.0),
      exitTransition: CaptionTransitionBuilder.createExitTransition('slide', 0.6, 'up')
    },
    {
      id: 'price-point',
      text: '$299 - Limited Time',
      startTime: 4.5,
      endTime: 8.0,
      position: { x: '85%', y: '85%', anchor: 'bottom-right' },
      style: {
        fontSize: 28,
        color: '#ff0000',
        fontWeight: 'bold',
        background: { color: '#ffffff', padding: 12, borderRadius: 8 },
        border: { width: 3, color: '#ff0000', style: 'solid' },
        shadow: { offsetX: 4, offsetY: 4, blur: 8, color: 'rgba(0,0,0,0.6)' }
      },
      enterTransition: CaptionTransitionBuilder.createEntranceTransition('bounce', 0.8),
      exitTransition: CaptionTransitionBuilder.createExitTransition('scale', 0.4)
    },
    {
      id: 'call-to-action',
      text: 'Order Now →',
      startTime: 6.0,
      endTime: 10.0,
      position: { x: '50%', y: '75%', anchor: 'center' },
      style: {
        fontSize: 32,
        color: '#ffffff',
        background: { color: '#ff6600', padding: 16, borderRadius: 25 },
        border: { width: 2, color: '#ffffff', style: 'solid' }
      },
      enterTransition: CaptionTransitionBuilder.createEntranceTransition('slide', 0.6, 'up'),
      // Pulsing effect could be added with keyframes
      keyframes: [
        {
          time: 7.0,
          position: { x: '50%', y: '75%' },
          style: { scale: 1.1 },
          transition: { type: 'ease-in-out', duration: 0.3 }
        },
        {
          time: 7.6,
          position: { x: '50%', y: '75%' },
          style: { scale: 1.0 },
          transition: { type: 'ease-in-out', duration: 0.3 }
        }
      ]
    }
  ];
  
  const config: ImageCaptionConfig = {
    imagePath: 'assets/product-image.jpg',
    imageDisplayDuration: 12,
    captions: productFeatures,
    safeArea: { top: 40, right: 40, bottom: 40, left: 40 }
  };
  
  return ImageCaptionComposer.compose(config);
}

/**
 * Example 2: Tutorial Step-by-Step
 * Creates instructional captions that appear in sequence
 */
export function createTutorialSteps() {
  console.log('📚 Creating tutorial step captions...');
  
  const steps = [
    "Step 1: Open the application",
    "Step 2: Click on 'New Project'", 
    "Step 3: Select your template",
    "Step 4: Customize your design",
    "Step 5: Export your creation"
  ];
  
  // Calculate optimal timing for each step
  const timings = CaptionDurationCalculator.calculateStaggeredTiming(
    steps.map(text => ({ text })),
    {
      startDelay: 1,
      overlap: 0.3, // 30% overlap between steps
      wordsPerMinute: 150 // Slower reading for instructions
    }
  );
  
  const tutorialCaptions: ImageCaptionSegment[] = steps.map((step, index) => ({
    id: `step-${index + 1}`,
    text: step,
    startTime: timings[index].startTime,
    endTime: timings[index].endTime,
    position: { 
      x: '50%', 
      y: `${20 + (index * 12)}%`, // Stagger vertically
      anchor: 'center' 
    },
    style: {
      fontSize: 28,
      color: '#ffffff',
      background: { 
        color: index === 0 ? 'rgba(0,100,200,0.9)' : 'rgba(100,100,100,0.8)',
        padding: 12,
        borderRadius: 6
      },
      border: {
        width: index === 0 ? 3 : 1,
        color: index === 0 ? '#ffff00' : '#ffffff',
        style: 'solid'
      }
    },
    enterTransition: CaptionTransitionBuilder.createEntranceTransition('slide', 0.5, 'left'),
    exitTransition: CaptionTransitionBuilder.createExitTransition('slide', 0.4, 'right')
  }));
  
  const config: ImageCaptionConfig = {
    imagePath: 'assets/tutorial-screenshot.png',
    imageDisplayDuration: timings[timings.length - 1].endTime + 2,
    captions: tutorialCaptions
  };
  
  return ImageCaptionComposer.compose(config);
}

/**
 * Example 3: Social Media Story with Animated Text
 * Creates engaging captions for Instagram/TikTok style content
 */
export function createSocialMediaStory() {
  console.log('📱 Creating social media story captions...');
  
  return QuickImageCaptions.createSimple(
    'assets/lifestyle-image.jpg',
    [
      { text: "✨ Monday Motivation" },
      { text: "Dream Big 💫" },
      { text: "Work Hard 💪" },
      { text: "Stay Focused 🎯" },
      { text: "Achieve Greatness 🏆" }
    ],
    {
      imageDisplayDuration: 8,
      style: {
        ...imageCaptionPresets.instagram.style,
        fontSize: 42,
        fontWeight: 'bold'
      },
      transition: 'bounce'
    }
  );
}

/**
 * Example 4: Interactive Infographic
 * Creates hotspot-style captions for data visualization
 */
export function createInteractiveInfographic() {
  console.log('📊 Creating interactive infographic...');
  
  return QuickImageCaptions.createHotspots(
    'assets/infographic-chart.png',
    [
      { 
        text: '📈 Revenue: +25%', 
        x: '20%', y: '30%', 
        showTime: 1, hideTime: 4
      },
      { 
        text: '👥 Users: 1.2M', 
        x: '50%', y: '25%', 
        showTime: 2, hideTime: 5
      },
      { 
        text: '🌍 Global Reach: 50+ Countries', 
        x: '80%', y: '40%', 
        showTime: 3, hideTime: 6
      },
      { 
        text: '⭐ Satisfaction: 4.8/5', 
        x: '35%', y: '70%', 
        showTime: 4, hideTime: 7
      },
      { 
        text: '🚀 Growth Rate: 15% MoM', 
        x: '65%', y: '75%', 
        showTime: 5, hideTime: 8
      }
    ],
    {
      imageDisplayDuration: 10,
      style: {
        fontSize: 20,
        color: '#ffffff',
        background: { color: 'rgba(50,50,200,0.9)', padding: 10, borderRadius: 5 },
        border: { width: 2, color: '#ffffff', style: 'solid' }
      }
    }
  );
}

/**
 * Example 5: Before/After Comparison
 * Shows two states with transitioning captions
 */
export function createBeforeAfterComparison() {
  console.log('🔄 Creating before/after comparison...');
  
  const comparisonCaptions: ImageCaptionSegment[] = [
    {
      id: 'before-label',
      text: 'BEFORE',
      startTime: 1,
      endTime: 5,
      position: { x: '25%', y: '10%', anchor: 'center' },
      style: {
        fontSize: 36,
        color: '#ff0000',
        fontWeight: 'bold',
        background: { color: 'rgba(255,255,255,0.9)', padding: 12, borderRadius: 8 }
      },
      enterTransition: CaptionTransitionBuilder.createEntranceTransition('fade', 0.8)
    },
    {
      id: 'after-label', 
      text: 'AFTER',
      startTime: 5.5,
      endTime: 10,
      position: { x: '75%', y: '10%', anchor: 'center' },
      style: {
        fontSize: 36,
        color: '#00ff00',
        fontWeight: 'bold',
        background: { color: 'rgba(255,255,255,0.9)', padding: 12, borderRadius: 8 }
      },
      enterTransition: CaptionTransitionBuilder.createEntranceTransition('slide', 0.8, 'right')
    },
    {
      id: 'improvement-stat',
      text: '500% Improvement!',
      startTime: 7,
      endTime: 10,
      position: { x: '50%', y: '85%', anchor: 'center' },
      style: {
        fontSize: 32,
        color: '#ffff00',
        fontWeight: 'bold',
        strokeColor: '#000000',
        strokeWidth: 2,
        glow: { color: '#ffff00', intensity: 2, radius: 15 }
      },
      enterTransition: CaptionTransitionBuilder.createEntranceTransition('bounce', 1.0)
    }
  ];
  
  const config: ImageCaptionConfig = {
    imagePath: 'assets/before-after-split.jpg',
    imageDisplayDuration: 12,
    captions: comparisonCaptions
  };
  
  return ImageCaptionComposer.compose(config);
}

/**
 * Example 6: Recipe Instructions
 * Timed captions for cooking tutorial
 */
export function createRecipeInstructions() {
  console.log('👨‍🍳 Creating recipe instruction captions...');
  
  const instructions = [
    "Preheat oven to 350°F",
    "Mix dry ingredients in large bowl", 
    "Add wet ingredients gradually",
    "Stir until just combined",
    "Pour into greased pan",
    "Bake for 25-30 minutes",
    "Cool before serving"
  ];
  
  // Longer duration for recipe steps
  const timings = CaptionDurationCalculator.calculateStaggeredTiming(
    instructions.map(text => ({ text })),
    {
      startDelay: 2,
      overlap: 0.1, // Less overlap for clarity
      wordsPerMinute: 120 // Slower for following along
    }
  );
  
  const recipeCaptions: ImageCaptionSegment[] = instructions.map((instruction, index) => ({
    id: `instruction-${index + 1}`,
    text: `${index + 1}. ${instruction}`,
    startTime: timings[index].startTime,
    endTime: timings[index].endTime,
    position: { 
      x: '50%', 
      y: '80%', // Bottom of image
      anchor: 'center' 
    },
    style: {
      fontSize: 24,
      color: '#ffffff',
      background: { 
        color: 'rgba(0,0,0,0.8)', 
        padding: 16, 
        borderRadius: 8 
      },
      border: { width: 2, color: '#ff6600', style: 'solid' }
    },
    enterTransition: CaptionTransitionBuilder.createEntranceTransition('slide', 0.5, 'up'),
    exitTransition: CaptionTransitionBuilder.createExitTransition('slide', 0.4, 'down')
  }));
  
  const config: ImageCaptionConfig = {
    imagePath: 'assets/recipe-photo.jpg',
    imageDisplayDuration: timings[timings.length - 1].endTime + 3,
    captions: recipeCaptions
  };
  
  return ImageCaptionComposer.compose(config);
}

/**
 * Example 7: Real Estate Property Tour
 * Highlights different features of a property
 */
export function createPropertyTour() {
  console.log('🏠 Creating property tour captions...');
  
  return QuickImageCaptions.createHotspots(
    'assets/property-photo.jpg',
    [
      { text: '🛏️ Master Bedroom\n3 bed, 2 bath', x: '20%', y: '30%', showTime: 1, hideTime: 4 },
      { text: '🍳 Gourmet Kitchen\nGranite countertops', x: '70%', y: '40%', showTime: 2.5, hideTime: 5.5 },
      { text: '🏊 Pool & Spa\nHeated year-round', x: '50%', y: '70%', showTime: 4, hideTime: 7 },
      { text: '🚗 2-Car Garage\nExtra storage', x: '15%', y: '60%', showTime: 5.5, hideTime: 8.5 },
      { text: '💰 $650,000\nCall today!', x: '50%', y: '10%', showTime: 7, hideTime: 10 }
    ],
    {
      imageDisplayDuration: 12,
      style: {
        fontSize: 18,
        color: '#ffffff',
        background: { color: 'rgba(0,50,100,0.9)', padding: 8, borderRadius: 6 },
        border: { width: 2, color: '#ffffff', style: 'solid' }
      }
    }
  );
}

/**
 * Usage demonstration function
 */
export async function runImageCaptionExamples() {
  console.log('🎬 Running Image Caption Examples...\n');
  
  try {
    // Generate all examples
    const examples = [
      { name: 'Product Showcase', timeline: createProductShowcase() },
      { name: 'Tutorial Steps', timeline: createTutorialSteps() },
      { name: 'Social Media Story', timeline: createSocialMediaStory() },
      { name: 'Interactive Infographic', timeline: createInteractiveInfographic() },
      { name: 'Before/After Comparison', timeline: createBeforeAfterComparison() },
      { name: 'Recipe Instructions', timeline: createRecipeInstructions() },
      { name: 'Property Tour', timeline: createPropertyTour() }
    ];
    
    // Generate commands for each example
    examples.forEach((example, index) => {
      const outputPath = `output/example-${index + 1}-${example.name.toLowerCase().replace(/\s+/g, '-')}.mp4`;
      const command = example.timeline.getCommand(outputPath);
      
      console.log(`📹 ${example.name}:`);
      console.log(`   Output: ${outputPath}`);
      console.log(`   Command length: ${command.length} characters`);
      console.log(`   Contains transitions: ${command.includes('alpha') ? 'Yes' : 'No'}`);
      console.log('');
    });
    
    console.log('✅ All image caption examples generated successfully!');
    console.log('');
    console.log('🎯 Key Features Demonstrated:');
    console.log('  ✅ Precise x,y coordinate positioning');
    console.log('  ✅ Time-series transitions and animations');  
    console.log('  ✅ Duration calculations based on reading speed');
    console.log('  ✅ Borders, shadows, and visual effects');
    console.log('  ✅ Platform-specific styling presets');
    console.log('  ✅ Interactive hotspot functionality');
    console.log('  ✅ Keyframe animation support');
    console.log('  ✅ Staggered timing for multiple captions');
    
  } catch (error) {
    console.error('❌ Error running examples:', error);
  }
}


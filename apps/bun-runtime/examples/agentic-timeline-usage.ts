/**
 * AGENTIC TIMELINE USAGE EXAMPLES
 * 
 * Demonstrates how AI agents can use the timeline primitives
 * to create complex video content declaratively.
 */

import { Timeline } from '@jamesaphoenix/media-sdk';

/**
 * Example: AI agent creates a product demo video
 */
export function createAgenticProductDemo() {
  console.log('🤖 AI Agent: Creating product demo video...');

  // Agent chooses platform and content strategy
  const agentDecisions = {
    platform: 'instagram' as const,
    contentType: 'product-demo',
    captionStyle: 'engaging',
    transitionType: 'bounce' as const,
    callToAction: true
  };

  // Agent builds timeline using primitives
  let timeline = new Timeline()
    .addVideo('assets/bunny.mp4');

  // Agent adds engaging intro captions
  timeline = timeline.addCaptions({
    captions: [
      { text: '🔥 NEW PRODUCT ALERT!', duration: 2 },
      { text: 'You won\'t believe this...', duration: 3 },
      { text: '👀 Watch till the end', duration: 2 }
    ],
    preset: agentDecisions.platform,
    transition: agentDecisions.transitionType,
    startDelay: 0.5,
    overlap: 0.2
  });

  // Agent adds product features
  timeline = timeline.addCaptions({
    captions: [
      {
        text: 'Premium Quality ⭐',
        startTime: 5,
        endTime: 8,
        position: { x: '25%', y: '20%', anchor: 'center' },
        style: {
          fontSize: 28,
          color: '#gold',
          strokeWidth: 3,
          background: { color: 'rgba(0,0,0,0.8)', padding: 12 }
        }
      },
      {
        text: 'Fast Shipping 🚚',
        startTime: 7,
        endTime: 10,
        position: { x: '75%', y: '30%', anchor: 'center' },
        style: {
          fontSize: 24,
          color: '#00ff00',
          strokeWidth: 2
        }
      }
    ]
  });

  // Agent adds call-to-action if decided
  if (agentDecisions.callToAction) {
    timeline = timeline.addCaptions({
      captions: [{
        text: 'ORDER NOW! 👆',
        startTime: 9,
        endTime: 12,
        position: { x: '50%', y: '85%', anchor: 'center' },
        style: {
          fontSize: 36,
          color: '#ffffff',
          background: { color: '#ff4444', padding: 15 },
          border: { width: 3, color: '#ffffff', style: 'solid' }
        }
      }]
    });
  }

  // Agent generates final command
  const command = timeline.getCommand('output/agent-product-demo.mp4');
  
  console.log('✅ Agent created timeline with:', {
    platform: agentDecisions.platform,
    captionLayers: 3,
    commandLength: command.length,
    hasCallToAction: agentDecisions.callToAction
  });

  return timeline;
}

/**
 * Example: AI agent creates educational content
 */
export function createAgenticTutorial() {
  console.log('🎓 AI Agent: Creating educational tutorial...');

  const agentConfig = {
    subject: 'How to Use Our App',
    platform: 'youtube' as const,
    stepCount: 5,
    instructional: true
  };

  // Agent creates step-by-step tutorial
  const steps = [
    'Step 1: Download the app',
    'Step 2: Create your account', 
    'Step 3: Set up your profile',
    'Step 4: Explore features',
    'Step 5: Start creating!'
  ];

  let timeline = new Timeline()
    .addVideo('assets/bunny.mp4')
    .addText(agentConfig.subject, {
      position: 'top',
      style: { fontSize: 48, color: '#ffffff' },
      duration: 3
    });

  // Agent adds instructional captions
  timeline = timeline.addCaptions({
    captions: steps.map((step, index) => ({
      text: step,
      startTime: 3 + (index * 2.5),
      endTime: 3 + ((index + 1) * 2.5),
      position: { 
        x: '50%', 
        y: `${25 + (index * 12)}%`, 
        anchor: 'center' as const 
      },
      style: {
        fontSize: 24,
        color: '#ffffff',
        background: { 
          color: index === 0 ? 'rgba(0,150,255,0.9)' : 'rgba(100,100,100,0.8)',
          padding: 10
        },
        border: {
          width: index === 0 ? 3 : 1,
          color: index === 0 ? '#ffff00' : '#ffffff',
          style: 'solid' as const
        }
      }
    })),
    preset: agentConfig.platform,
    transition: 'slide'
  });

  console.log('✅ Agent created tutorial with:', {
    steps: agentConfig.stepCount,
    platform: agentConfig.platform,
    totalDuration: 3 + (steps.length * 2.5)
  });

  return timeline;
}

/**
 * Example: AI agent adapts content for different platforms
 */
export function createAgenticMultiPlatform() {
  console.log('📱 AI Agent: Creating multi-platform content...');

  const baseContent = {
    message: 'Amazing Content! ✨',
    callToAction: 'Follow for more! 👍'
  };

  const platforms: Array<'instagram' | 'tiktok' | 'youtube'> = ['instagram', 'tiktok', 'youtube'];
  const timelines: Record<string, Timeline> = {};

  platforms.forEach(platform => {
    let timeline = new Timeline()
      .addVideo('assets/bunny.mp4');

    // Agent customizes for each platform
    switch (platform) {
      case 'instagram':
        timeline = timeline.addCaptions({
          captions: [
            { text: '✨ Instagram Ready!', duration: 2 },
            { text: baseContent.message, duration: 3 },
            { text: baseContent.callToAction, duration: 2 }
          ],
          preset: 'instagram',
          transition: 'fade',
          globalStyle: { fontSize: 36 }
        });
        break;

      case 'tiktok':
        timeline = timeline.addCaptions({
          captions: [
            { text: '🔥 TikTok Viral!', duration: 1.5 },
            { text: baseContent.message, duration: 2.5 },
            { text: baseContent.callToAction, duration: 2 }
          ],
          preset: 'tiktok',
          transition: 'bounce',
          globalStyle: { fontSize: 48 }
        });
        break;

      case 'youtube':
        timeline = timeline.addCaptions({
          captions: [
            { text: '📺 YouTube Content', duration: 2 },
            { text: baseContent.message, duration: 4 },
            { text: baseContent.callToAction, duration: 3 }
          ],
          preset: 'youtube',
          transition: 'slide',
          globalStyle: { fontSize: 32 }
        });
        break;
    }

    timelines[platform] = timeline;
  });

  console.log('✅ Agent created multi-platform content:', {
    platforms: platforms.length,
    adaptations: Object.keys(timelines)
  });

  return timelines;
}

/**
 * Usage demonstration
 */
export async function runAgenticExamples() {
  console.log('🚀 Running Agentic Timeline Examples...\n');

  // Agent creates product demo
  const productDemo = createAgenticProductDemo();
  console.log('📦 Product demo timeline ready\n');

  // Agent creates tutorial
  const tutorial = createAgenticTutorial();
  console.log('🎓 Tutorial timeline ready\n');

  // Agent creates multi-platform content
  const multiPlatform = createAgenticMultiPlatform();
  console.log('📱 Multi-platform timelines ready\n');

  console.log('🎯 Key Benefits for AI Agents:');
  console.log('  ✅ Declarative API - describe what you want');
  console.log('  ✅ Method chaining - compose complex timelines');
  console.log('  ✅ Platform presets - automatic optimization');
  console.log('  ✅ Flexible positioning - precise control');
  console.log('  ✅ Type safety - prevent runtime errors');
  console.log('  ✅ Predictable output - same input = same result');

  return {
    productDemo,
    tutorial,
    multiPlatform
  };
}

// Export for testing
export { Timeline };
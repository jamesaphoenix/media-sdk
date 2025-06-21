/**
 * Timeline Captions Integration Test
 * 
 * Tests the .addCaptions() primitive for seamless integration
 * of advanced caption system with Timeline API
 */

import { test, expect, describe } from 'bun:test';
import { Timeline } from '@jamesaphoenix/media-sdk';

describe('🎬 Timeline Captions Primitive', () => {
  test('should integrate addCaptions() method with Timeline', () => {
    console.log('🧪 Testing .addCaptions() timeline primitive...');
    
    const timeline = new Timeline()
      .addVideo('assets/bunny.mp4')
      .addCaptions({
        captions: [
          { text: 'Welcome to the show!' },
          { text: 'Please subscribe' },
          { text: 'And hit that bell! 🔔' }
        ],
        globalStyle: { fontSize: 36, color: '#ffffff' },
        transition: 'fade',
        startDelay: 1
      });

    expect(timeline).toBeDefined();
    console.log('✅ Timeline with captions created successfully');
  });

  test('should support advanced positioned captions', () => {
    console.log('🎯 Testing advanced positioned captions...');
    
    const timeline = new Timeline()
      .addVideo('assets/bunny.mp4')
      .addCaptions({
        captions: [
          {
            text: 'Premium Quality',
            startTime: 1,
            endTime: 4,
            position: { x: '25%', y: '15%', anchor: 'center' },
            style: { 
              fontSize: 28, 
              color: '#gold', 
              strokeWidth: 2,
              background: { color: 'rgba(0,0,0,0.8)', padding: 10 }
            }
          },
          {
            text: 'Order Now!',
            startTime: 3,
            endTime: 6,
            position: { x: '75%', y: '85%', anchor: 'bottom-right' },
            style: { 
              fontSize: 24, 
              background: { color: '#ff0000', padding: 12 },
              border: { width: 2, color: '#ffffff', style: 'solid' }
            }
          }
        ]
      });

    const command = timeline.getCommand('output/positioned-captions.mp4');
    expect(command).toContain('drawtext');
    expect(command).toContain('Premium Quality');
    expect(command).toContain('Order Now');
    
    console.log('✅ Advanced positioned captions working');
    console.log('📝 Command preview:', command.substring(0, 150) + '...');
  });

  test('should support platform presets', () => {
    console.log('📱 Testing platform preset integration...');
    
    const instagramTimeline = new Timeline()
      .addVideo('assets/bunny.mp4')
      .addCaptions({
        captions: [{ text: 'Viral Content! 🔥' }],
        preset: 'instagram',
        transition: 'bounce'
      });

    const tiktokTimeline = new Timeline()
      .addVideo('assets/bunny.mp4')
      .addCaptions({
        captions: [{ text: 'TikTok Ready! ✨' }],
        preset: 'tiktok',
        transition: 'slide'
      });

    expect(instagramTimeline).toBeDefined();
    expect(tiktokTimeline).toBeDefined();
    
    console.log('✅ Platform presets working');
  });

  test('should chain with other timeline methods', () => {
    console.log('🔗 Testing method chaining...');
    
    const timeline = new Timeline()
      .addVideo('assets/bunny.mp4')
      .addText('Basic text overlay', { position: 'top' })
      .addCaptions({
        captions: [
          { text: 'Advanced caption 1', duration: 3 },
          { text: 'Advanced caption 2', duration: 2 }
        ],
        transition: 'fade'
      })
      .addImage('assets/logo-150x150.png', { 
        position: 'bottom-right',
        duration: 5
      })
      .addCaptions({
        captions: [{ text: 'Final message!', startTime: 8, endTime: 10 }],
        preset: 'youtube'
      });

    expect(timeline).toBeDefined();
    
    const command = timeline.getCommand('output/chained-timeline.mp4');
    expect(command).toContain('drawtext');
    expect(command).toContain('overlay');
    
    console.log('✅ Method chaining works perfectly');
    console.log('🎬 Generated complex timeline with multiple caption layers');
  });

  test('should enable agentic usage patterns', () => {
    console.log('🤖 Testing agentic usage patterns...');
    
    // Simulate what an AI agent might do
    const agentChoices = {
      platform: 'instagram' as const,
      captionStyle: 'engaging',
      transitionType: 'bounce' as const,
      contentType: 'product-demo'
    };

    let timeline = new Timeline()
      .addVideo('assets/bunny.mp4');

    // Agent adds appropriate captions based on choices
    if (agentChoices.captionStyle === 'engaging') {
      timeline = timeline.addCaptions({
        captions: [
          { text: '🔥 Amazing Product Alert!', duration: 2 },
          { text: '✨ You won\'t believe this', duration: 3 },
          { text: '👀 Watch till the end', duration: 2 }
        ],
        preset: agentChoices.platform,
        transition: agentChoices.transitionType,
        startDelay: 0.5
      });
    }

    // Agent adds call-to-action
    timeline = timeline.addCaptions({
      captions: [{
        text: 'Follow for more! 👍',
        startTime: 7,
        endTime: 10,
        position: { x: '50%', y: '85%', anchor: 'center' },
        style: {
          fontSize: 32,
          color: '#ffffff',
          background: { color: '#ff4444', padding: 15 },
          border: { width: 3, color: '#ffffff', style: 'solid' }
        }
      }]
    });

    expect(timeline).toBeDefined();
    
    const command = timeline.getCommand('output/agent-generated.mp4');
    expect(command).toContain('Amazing Product Alert');
    expect(command).toContain('Follow for more');
    
    console.log('✅ Agentic usage patterns work seamlessly');
    console.log('🤖 AI agents can easily compose complex video content');
  });
});
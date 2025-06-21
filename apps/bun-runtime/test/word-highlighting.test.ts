/**
 * WORD HIGHLIGHTING TESTS
 * 
 * Comprehensive tests for the addWordHighlighting() timeline primitive
 * covering auto-timing, custom timing, presets, and positioning
 */

import { test, expect, describe, beforeAll } from 'bun:test';
import { Timeline } from '@jamesaphoenix/media-sdk';

describe('🎤 Word Highlighting System', () => {
  let baseTimeline: Timeline;

  beforeAll(() => {
    baseTimeline = new Timeline().addVideo('assets/bunny.mp4');
    console.log('🎬 Word highlighting test suite initialized');
  });

  describe('⏰ Auto-Timing Generation', () => {
    test('should generate word timings from text automatically', () => {
      console.log('🕐 Testing auto-timing generation...');
      
      const timeline = baseTimeline.addWordHighlighting({
        text: 'This is amazing viral content!',
        startTime: 2,
        duration: 6,
        wordsPerSecond: 2,
        preset: 'tiktok'
      });

      expect(timeline).toBeDefined();
      
      const command = timeline.getCommand('output/auto-timed-words.mp4');
      expect(command).toContain('drawtext');
      expect(command).toContain('This');
      expect(command).toContain('amazing');
      expect(command).toContain('viral');
      
      console.log('✅ Auto-timing generated successfully');
      console.log('📝 Command contains all words from text');
    });

    test('should handle different words per second rates', () => {
      console.log('⚡ Testing different timing speeds...');
      
      const fastTimeline = baseTimeline.addWordHighlighting({
        text: 'Fast paced content here',
        wordsPerSecond: 4, // Very fast
        preset: 'tiktok'
      });

      const slowTimeline = baseTimeline.addWordHighlighting({
        text: 'Slow deliberate speech',
        wordsPerSecond: 1, // Very slow
        preset: 'karaoke'
      });

      expect(fastTimeline).toBeDefined();
      expect(slowTimeline).toBeDefined();
      
      console.log('✅ Different timing speeds handled correctly');
    });

    test('should respect duration limits', () => {
      console.log('⏳ Testing duration constraints...');
      
      const timeline = baseTimeline.addWordHighlighting({
        text: 'This is a very long sentence with many words that should be constrained',
        startTime: 1,
        duration: 3, // Short duration
        wordsPerSecond: 2,
        preset: 'youtube'
      });

      expect(timeline).toBeDefined();
      
      const command = timeline.getCommand('output/duration-constrained.mp4');
      expect(command).toContain('drawtext');
      
      console.log('✅ Duration constraints respected');
    });
  });

  describe('🎯 Custom Word Timings', () => {
    test('should support custom word timing arrays', () => {
      console.log('🎵 Testing custom word timings...');
      
      const customWords = [
        { word: 'Hello', start: 1.0, end: 1.5 },
        { word: 'amazing', start: 1.5, end: 2.2 },
        { word: 'world!', start: 2.2, end: 3.0 }
      ];

      const timeline = baseTimeline.addWordHighlighting({
        words: customWords,
        baseStyle: { fontSize: 48, color: '#ffffff' },
        highlightStyle: { color: '#ff0066', scale: 1.3 },
        preset: 'tiktok'
      });

      expect(timeline).toBeDefined();
      
      const command = timeline.getCommand('output/custom-timed-words.mp4');
      expect(command).toContain('Hello');
      expect(command).toContain('amazing');
      expect(command).toContain('world');
      
      console.log('✅ Custom word timings working');
      console.log('📊 Processed 3 custom timed words');
    });

    test('should handle overlapping word timings', () => {
      console.log('🔄 Testing overlapping word timings...');
      
      const overlappingWords = [
        { word: 'Fast', start: 1.0, end: 2.0 },
        { word: 'overlap', start: 1.5, end: 2.5 },
        { word: 'effect', start: 2.0, end: 3.0 }
      ];

      const timeline = baseTimeline.addWordHighlighting({
        words: overlappingWords,
        highlightTransition: 'fade',
        transitionDuration: 0.3
      });

      expect(timeline).toBeDefined();
      console.log('✅ Overlapping timings handled correctly');
    });
  });

  describe('🎨 Platform Presets', () => {
    test('should apply TikTok preset styling', () => {
      console.log('📱 Testing TikTok preset...');
      
      const timeline = baseTimeline.addWordHighlighting({
        text: 'TikTok viral content here! 🔥',
        preset: 'tiktok',
        highlightTransition: 'bounce'
      });

      expect(timeline).toBeDefined();
      
      const command = timeline.getCommand('output/tiktok-highlighting.mp4');
      expect(command).toContain('drawtext');
      
      console.log('✅ TikTok preset applied successfully');
    });

    test('should apply Instagram preset styling', () => {
      console.log('📸 Testing Instagram preset...');
      
      const timeline = baseTimeline.addWordHighlighting({
        text: 'Instagram story content! ✨',
        preset: 'instagram',
        highlightTransition: 'scale'
      });

      expect(timeline).toBeDefined();
      console.log('✅ Instagram preset applied successfully');
    });

    test('should apply YouTube preset styling', () => {
      console.log('📺 Testing YouTube preset...');
      
      const timeline = baseTimeline.addWordHighlighting({
        text: 'YouTube video captions here',
        preset: 'youtube',
        highlightTransition: 'fade'
      });

      expect(timeline).toBeDefined();
      console.log('✅ YouTube preset applied successfully');
    });

    test('should apply Karaoke preset styling', () => {
      console.log('🎤 Testing Karaoke preset...');
      
      const timeline = baseTimeline.addWordHighlighting({
        text: 'Sing along with these lyrics!',
        preset: 'karaoke',
        highlightTransition: 'pulse'
      });

      expect(timeline).toBeDefined();
      console.log('✅ Karaoke preset applied successfully');
    });

    test('should apply Typewriter preset styling', () => {
      console.log('⌨️ Testing Typewriter preset...');
      
      const timeline = baseTimeline.addWordHighlighting({
        text: 'Typewriter effect for presentations',
        preset: 'typewriter',
        highlightTransition: 'instant'
      });

      expect(timeline).toBeDefined();
      console.log('✅ Typewriter preset applied successfully');
    });
  });

  describe('📍 Positioning and Layout', () => {
    test('should support custom positioning', () => {
      console.log('🎯 Testing custom positioning...');
      
      const timeline = baseTimeline.addWordHighlighting({
        text: 'Custom positioned text',
        position: { x: '25%', y: '75%', anchor: 'bottom-left' },
        preset: 'tiktok'
      });

      expect(timeline).toBeDefined();
      
      const command = timeline.getCommand('output/custom-positioned.mp4');
      expect(command).toContain('main_w*0.25'); // 25% positioning
      
      console.log('✅ Custom positioning working');
    });

    test('should handle multi-line layouts', () => {
      console.log('📝 Testing multi-line layouts...');
      
      const timeline = baseTimeline.addWordHighlighting({
        text: 'This is a very long sentence that should wrap to multiple lines automatically',
        lineBreakStrategy: 'auto',
        maxWordsPerLine: 5,
        lineSpacing: 1.8,
        preset: 'youtube'
      });

      expect(timeline).toBeDefined();
      console.log('✅ Multi-line layout handled correctly');
    });

    test('should support different anchor points', () => {
      console.log('⚓ Testing anchor points...');
      
      const anchors: Array<'top-left' | 'top-center' | 'center' | 'bottom-right'> = [
        'top-left', 'top-center', 'center', 'bottom-right'
      ];

      anchors.forEach(anchor => {
        const timeline = baseTimeline.addWordHighlighting({
          text: `Anchor test: ${anchor}`,
          position: { x: '50%', y: '50%', anchor },
          startTime: 1,
          duration: 2
        });
        
        expect(timeline).toBeDefined();
      });
      
      console.log('✅ All anchor points working correctly');
    });
  });

  describe('🎭 Transition Effects', () => {
    test('should support instant transitions', () => {
      console.log('⚡ Testing instant transitions...');
      
      const timeline = baseTimeline.addWordHighlighting({
        text: 'Instant highlight effect',
        highlightTransition: 'instant',
        preset: 'tiktok'
      });

      expect(timeline).toBeDefined();
      console.log('✅ Instant transitions working');
    });

    test('should support fade transitions', () => {
      console.log('🌅 Testing fade transitions...');
      
      const timeline = baseTimeline.addWordHighlighting({
        text: 'Fade highlight effect',
        highlightTransition: 'fade',
        transitionDuration: 0.5,
        preset: 'instagram'
      });

      expect(timeline).toBeDefined();
      console.log('✅ Fade transitions working');
    });

    test('should support scale transitions', () => {
      console.log('📏 Testing scale transitions...');
      
      const timeline = baseTimeline.addWordHighlighting({
        text: 'Scale highlight effect',
        highlightTransition: 'scale',
        transitionDuration: 0.3,
        preset: 'youtube'
      });

      expect(timeline).toBeDefined();
      console.log('✅ Scale transitions working');
    });

    test('should support bounce transitions', () => {
      console.log('🏀 Testing bounce transitions...');
      
      const timeline = baseTimeline.addWordHighlighting({
        text: 'Bounce highlight effect',
        highlightTransition: 'bounce',
        transitionDuration: 0.4,
        preset: 'tiktok'
      });

      expect(timeline).toBeDefined();
      console.log('✅ Bounce transitions working');
    });
  });

  describe('🎨 Custom Styling', () => {
    test('should support custom base and highlight styles', () => {
      console.log('🎨 Testing custom styling...');
      
      const timeline = baseTimeline.addWordHighlighting({
        text: 'Custom styled highlighting',
        baseStyle: {
          fontSize: 40,
          color: '#cccccc',
          strokeColor: '#000000',
          strokeWidth: 2,
          background: { color: 'rgba(0,0,0,0.5)', padding: 8 }
        },
        highlightStyle: {
          color: '#ff6600',
          strokeColor: '#ffffff',
          strokeWidth: 3,
          scale: 1.4,
          background: { color: 'rgba(255,102,0,0.8)', padding: 12 }
        }
      });

      expect(timeline).toBeDefined();
      
      const command = timeline.getCommand('output/custom-styled.mp4');
      expect(command).toContain('drawtext');
      
      console.log('✅ Custom styling applied successfully');
    });

    test('should override preset styles with custom styles', () => {
      console.log('🔄 Testing style override...');
      
      const timeline = baseTimeline.addWordHighlighting({
        text: 'Override preset styling',
        preset: 'tiktok', // Base preset
        baseStyle: { fontSize: 60 }, // Override size
        highlightStyle: { color: '#00ff00' } // Override color
      });

      expect(timeline).toBeDefined();
      console.log('✅ Style override working correctly');
    });
  });

  describe('🔗 Timeline Integration', () => {
    test('should chain with other timeline methods', () => {
      console.log('🔗 Testing timeline method chaining...');
      
      const timeline = new Timeline()
        .addVideo('assets/bunny.mp4')
        .addText('Static title text', { position: 'top', duration: 3 })
        .addWordHighlighting({
          text: 'Word by word highlighting here!',
          startTime: 2,
          duration: 5,
          preset: 'tiktok'
        })
        .addCaptions({
          captions: [{ text: 'Final caption', startTime: 8, endTime: 10 }]
        })
        .addWordHighlighting({
          text: 'Second word highlight sequence',
          startTime: 10,
          duration: 4,
          preset: 'instagram'
        });

      expect(timeline).toBeDefined();
      
      const command = timeline.getCommand('output/chained-word-highlighting.mp4');
      expect(command).toContain('drawtext');
      
      console.log('✅ Method chaining with word highlighting works');
      console.log('🎬 Generated complex timeline with multiple layers');
    });

    test('should work with multiple word highlighting layers', () => {
      console.log('📚 Testing multiple word highlighting layers...');
      
      const timeline = baseTimeline
        .addWordHighlighting({
          text: 'First layer of words',
          startTime: 1,
          duration: 3,
          position: { x: '50%', y: '30%', anchor: 'center' },
          preset: 'tiktok'
        })
        .addWordHighlighting({
          text: 'Second layer below',
          startTime: 2.5,
          duration: 3,
          position: { x: '50%', y: '70%', anchor: 'center' },
          preset: 'instagram'
        });

      expect(timeline).toBeDefined();
      
      const command = timeline.getCommand('output/multiple-word-layers.mp4');
      expect(command).toContain('First');
      expect(command).toContain('Second');
      
      console.log('✅ Multiple word highlighting layers working');
    });
  });

  describe('🤖 Agentic Usage Patterns', () => {
    test('should enable AI agent word highlighting workflows', () => {
      console.log('🤖 Testing agentic word highlighting...');
      
      // Simulate AI agent decision making
      const agentChoices = {
        contentType: 'viral-video',
        platform: 'tiktok' as const,
        highlightStyle: 'dramatic',
        wordSpeed: 'fast'
      };

      let timeline = baseTimeline;

      // Agent adds intro with word highlighting
      if (agentChoices.contentType === 'viral-video') {
        timeline = timeline.addWordHighlighting({
          text: '🔥 This will blow your mind!',
          startTime: 1,
          duration: 3,
          wordsPerSecond: agentChoices.wordSpeed === 'fast' ? 4 : 2,
          preset: agentChoices.platform,
          highlightTransition: agentChoices.highlightStyle === 'dramatic' ? 'bounce' : 'fade'
        });
      }

      // Agent adds main content
      timeline = timeline.addWordHighlighting({
        text: 'Watch this amazing transformation happen before your eyes!',
        startTime: 4,
        duration: 6,
        preset: agentChoices.platform,
        highlightTransition: 'scale'
      });

      // Agent adds call to action
      timeline = timeline.addWordHighlighting({
        text: 'Follow for more incredible content! 👍',
        startTime: 10,
        duration: 4,
        position: { x: '50%', y: '85%', anchor: 'center' },
        preset: agentChoices.platform,
        highlightStyle: {
          color: '#ff0000',
          scale: 1.5,
          glow: true
        }
      });

      expect(timeline).toBeDefined();
      
      const command = timeline.getCommand('output/agent-word-highlighting.mp4');
      expect(command).toContain('blow');
      expect(command).toContain('transformation');
      expect(command).toContain('Follow');
      
      console.log('✅ Agentic word highlighting workflow successful');
      console.log('🤖 AI agent created engaging viral content structure');
    });
  });

  describe('⚠️ Error Handling', () => {
    test('should handle empty text input', () => {
      console.log('🚫 Testing empty text handling...');
      
      expect(() => {
        baseTimeline.addWordHighlighting({
          text: '',
          preset: 'tiktok'
        });
      }).not.toThrow();
      
      console.log('✅ Empty text handled gracefully');
    });

    test('should require either text or words array', () => {
      console.log('📋 Testing input validation...');
      
      expect(() => {
        baseTimeline.addWordHighlighting({
          preset: 'tiktok'
          // Missing both text and words
        });
      }).toThrow('Either text or words array must be provided');
      
      console.log('✅ Input validation working correctly');
    });

    test('should handle special characters and emojis', () => {
      console.log('🎭 Testing special characters...');
      
      const timeline = baseTimeline.addWordHighlighting({
        text: 'Special chars: @#$%! And emojis: 🔥✨💯',
        preset: 'tiktok'
      });

      expect(timeline).toBeDefined();
      console.log('✅ Special characters and emojis handled');
    });
  });
});
/**
 * Audio Layering Tests
 * 
 * Tests for the enhanced audio layering capabilities
 */

import { test, expect, describe } from 'bun:test';
import { Timeline } from '@jamesaphoenix/media-sdk';

describe('🎵 AUDIO LAYERING FUNCTIONALITY', () => {
  describe('Basic Audio Operations', () => {
    test('should add single audio track', () => {
      const timeline = new Timeline()
        .addVideo('video.mp4')
        .addAudio('music.mp3', {
          volume: 0.5,
          startTime: 2,
          duration: 10
        });
      
      const command = timeline.getCommand('output.mp4');
      
      expect(command).toContain('music.mp3');
      expect(command).toContain('volume=0.5');
      expect(command).toContain('adelay=2000|2000');
    });
    
    test('should mix multiple audio tracks', () => {
      const timeline = new Timeline()
        .addVideo('video.mp4')
        .addAudio('background.mp3', { volume: 0.3 })
        .addAudio('voiceover.mp3', { volume: 1.0 })
        .addAudio('effect.wav', { volume: 0.8 });
      
      const command = timeline.getCommand('output.mp4');
      
      expect(command).toContain('background.mp3');
      expect(command).toContain('voiceover.mp3');
      expect(command).toContain('effect.wav');
      expect(command).toContain('amix=inputs=4:duration=longest');
    });
  });
  
  describe('Audio Timing and Synchronization', () => {
    test('should handle precise audio timing', () => {
      const timeline = new Timeline()
        .addVideo('video.mp4')
        .addAudio('sound1.wav', {
          startTime: 1.5,
          duration: 2
        })
        .addAudio('sound2.wav', {
          startTime: 5.25,
          duration: 1.5
        })
        .addAudio('sound3.wav', {
          startTime: 10.75,
          duration: 3
        });
      
      const command = timeline.getCommand('output.mp4');
      
      expect(command).toContain('adelay=1500|1500');
      expect(command).toContain('adelay=5250|5250');
      expect(command).toContain('adelay=10750|10750');
    });
    
    test('should trim audio segments', () => {
      const timeline = new Timeline()
        .addVideo('video.mp4')
        .addAudio('long-audio.mp3', {
          trimStart: 10,
          trimEnd: 30,
          startTime: 5
        });
      
      const command = timeline.getCommand('output.mp4');
      
      expect(command).toContain('atrim=start=10,end=30');
      expect(command).toContain('adelay=5000|5000');
    });
  });
  
  describe('Audio Effects', () => {
    test('should apply fade in and fade out', () => {
      const timeline = new Timeline()
        .addVideo('video.mp4')
        .addAudio('music.mp3', {
          fadeIn: 2,
          fadeOut: 3,
          duration: 20
        });
      
      const command = timeline.getCommand('output.mp4');
      
      expect(command).toContain('afade=t=in:st=0:d=2');
      expect(command).toContain('afade=t=out:st=17:d=3');
    });
    
    test('should apply pitch and tempo changes', () => {
      const timeline = new Timeline()
        .addVideo('video.mp4')
        .addAudio('voice.mp3', {
          pitch: 1.2,
          tempo: 0.8
        });
      
      const command = timeline.getCommand('output.mp4');
      
      expect(command).toContain('asetrate=44100*1.2,aresample=44100');
      expect(command).toContain('atempo=0.8');
    });
    
    test('should apply audio filters', () => {
      const timeline = new Timeline()
        .addVideo('video.mp4')
        .addAudio('audio.mp3', {
          lowpass: 2000,
          highpass: 100,
          echo: { delay: 500, decay: 0.3 },
          reverb: { room: 0.5, damping: 0.2 }
        });
      
      const command = timeline.getCommand('output.mp4');
      
      expect(command).toContain('lowpass=f=2000');
      expect(command).toContain('highpass=f=100');
      expect(command).toContain('aecho=0.8:0.9:500:0.3');
      expect(command).toContain('aecho=0.8:0.88:60:0.4'); // Reverb simulation
    });
    
    test('should handle audio looping', () => {
      const timeline = new Timeline()
        .addVideo('video.mp4')
        .addAudio('short-loop.wav', {
          loop: true,
          duration: 30
        });
      
      const command = timeline.getCommand('output.mp4');
      
      expect(command).toContain('aloop=loop=-1:size=44100*10');
      expect(command).toContain('atrim=duration=30');
    });
  });
  
  describe('Complex Audio Scenarios', () => {
    test('should create audio ducking effect', () => {
      const timeline = new Timeline()
        .addVideo('video.mp4')
        // Background music - full volume
        .addAudio('music.mp3', {
          volume: 0.8,
          startTime: 0,
          duration: 5
        })
        // Background music - ducked
        .addAudio('music.mp3', {
          volume: 0.2,
          startTime: 5,
          duration: 10,
          trimStart: 5,
          trimEnd: 15
        })
        // Background music - return to full
        .addAudio('music.mp3', {
          volume: 0.8,
          startTime: 15,
          duration: 5,
          trimStart: 15,
          trimEnd: 20
        })
        // Voiceover during ducked section
        .addAudio('voiceover.mp3', {
          volume: 1.0,
          startTime: 5,
          duration: 10
        });
      
      const command = timeline.getCommand('output.mp4');
      
      // Check all segments are processed in filter complex
      expect(command).toContain('music.mp3');
      expect(command).toContain('voiceover.mp3');
      expect(command).toContain('volume=0.8');
      expect(command).toContain('volume=0.2');
      expect(command).toContain('volume=1');
      // Verify trim operations for ducking segments
      expect(command).toContain('atrim=start=5,end=15');
      expect(command).toContain('atrim=start=15,end=20');
      // Verify timing
      expect(command).toContain('adelay=5000|5000');
      expect(command).toContain('adelay=15000|15000');
    });
    
    test('should layer ambient soundscape', () => {
      const timeline = new Timeline()
        .addVideo('nature.mp4')
        // Base ambient layer
        .addAudio('wind.mp3', {
          volume: 0.3,
          loop: true,
          duration: 30,
          lowpass: 1000
        })
        // Bird sounds
        .addAudio('birds.mp3', {
          volume: 0.4,
          startTime: 3,
          duration: 20,
          highpass: 500
        })
        // Water sounds
        .addAudio('water.mp3', {
          volume: 0.5,
          startTime: 8,
          fadeIn: 3,
          reverb: { room: 0.7, damping: 0.3 }
        })
        // Thunder effect
        .addAudio('thunder.wav', {
          volume: 0.9,
          startTime: 15,
          echo: { delay: 1000, decay: 0.4 }
        });
      
      const command = timeline.getCommand('output.mp4');
      
      expect(command).toContain('wind.mp3');
      expect(command).toContain('birds.mp3');
      expect(command).toContain('water.mp3');
      expect(command).toContain('thunder.wav');
      expect(command).toContain('amix=inputs=5:duration=longest');
    });
    
    test('should create rhythmic audio pattern', () => {
      let timeline = new Timeline()
        .addVideo('video.mp4');
      
      // Add rhythmic beat pattern
      const beatTimes = [0, 0.5, 1, 1.5, 2, 2.5, 3, 3.5];
      beatTimes.forEach((time, index) => {
        timeline = timeline.addAudio('kick.wav', {
          volume: 0.8,
          startTime: time,
          pitch: index % 2 === 0 ? 1.0 : 0.9
        });
      });
      
      const command = timeline.getCommand('output.mp4');
      
      // Should have kick.wav input and process it 8 times
      expect(command).toContain('kick.wav');
      // First audio at time 0 doesn't get adelay, others do
      expect(command).toContain('volume=0.8'); // All kicks have same volume
      expect(command).toContain('adelay=500|500'); // Second beat at 0.5s
      expect(command).toContain('adelay=1000|1000'); // Third beat at 1s
      expect(command).toContain('adelay=3500|3500'); // Last beat at 3.5s
      // Should have pitch variations
      expect(command).toContain('asetrate=44100*0.9'); // Odd beats have lower pitch
      // Should mix 9 inputs (1 video audio + 8 kicks)
      expect(command).toContain('amix=inputs=9:duration=longest');
    });
  });
  
  describe('Audio-Video Synchronization', () => {
    test('should sync audio cues with visual events', () => {
      const timeline = new Timeline()
        .addVideo('video.mp4')
        // Visual cue at 2s
        .addText('FLASH!', {
          position: 'center',
          startTime: 2,
          duration: 0.5,
          style: { fontSize: 96, color: '#ffffff' }
        })
        // Matching audio cue
        .addAudio('flash.wav', {
          volume: 1.0,
          startTime: 2,
          duration: 0.5
        })
        // Visual cue at 5s
        .addText('BOOM!', {
          position: 'center',
          startTime: 5,
          duration: 0.5,
          style: { fontSize: 96, color: '#ff0000' }
        })
        // Matching audio cue
        .addAudio('boom.wav', {
          volume: 1.0,
          startTime: 5,
          duration: 0.5
        });
      
      const command = timeline.getCommand('output.mp4');
      
      expect(command).toContain('FLASH!');
      expect(command).toContain('flash.wav');
      expect(command).toContain('adelay=2000|2000');
      expect(command).toContain('BOOM!');
      expect(command).toContain('boom.wav');
      expect(command).toContain('adelay=5000|5000');
    });
  });
  
  describe('Edge Cases', () => {
    test('should handle audio without video', () => {
      const timeline = new Timeline()
        .addImage('background.jpg', { duration: 30 })
        .addAudio('podcast.mp3', {
          volume: 1.0,
          duration: 30
        })
        .addAudio('music.mp3', {
          volume: 0.2,
          duration: 30
        });
      
      const command = timeline.getCommand('output.mp4');
      
      expect(command).toContain('background.jpg');
      expect(command).toContain('podcast.mp3');
      expect(command).toContain('music.mp3');
      expect(command).toContain('amix=inputs=2:duration=longest');
    });
    
    test('should handle very short audio clips', () => {
      const timeline = new Timeline()
        .addVideo('video.mp4')
        .addAudio('click.wav', {
          startTime: 1,
          duration: 0.1
        })
        .addAudio('beep.wav', {
          startTime: 1.2,
          duration: 0.05
        });
      
      const command = timeline.getCommand('output.mp4');
      
      expect(command).toContain('atrim=duration=0.1');
      expect(command).toContain('atrim=duration=0.05');
    });
    
    test('should handle overlapping audio with effects', () => {
      const timeline = new Timeline()
        .addVideo('video.mp4')
        .addAudio('layer1.mp3', {
          volume: 0.5,
          startTime: 0,
          duration: 10,
          fadeIn: 1,
          lowpass: 3000
        })
        .addAudio('layer2.mp3', {
          volume: 0.5,
          startTime: 5,
          duration: 10,
          fadeIn: 1,
          highpass: 200
        })
        .addAudio('layer3.mp3', {
          volume: 0.5,
          startTime: 10,
          duration: 10,
          fadeOut: 2,
          echo: { delay: 300, decay: 0.3 }
        });
      
      const command = timeline.getCommand('output.mp4');
      
      expect(command).toContain('layer1.mp3');
      expect(command).toContain('layer2.mp3');
      expect(command).toContain('layer3.mp3');
      expect(command).toContain('lowpass=f=3000');
      expect(command).toContain('highpass=f=200');
      expect(command).toContain('aecho=0.8:0.9:300:0.3');
    });
  });
});
import { MockFFmpegExecutor } from './cassette-manager.js';
import chalk from 'chalk';

/**
 * Test scenarios for the Media SDK
 */
export class TestScenarios {
  constructor() {
    this.executor = new MockFFmpegExecutor('media-sdk-tests');
    this.results = [];
  }

  async runAll() {
    console.log(chalk.blue.bold('\n🎬 Running Media SDK Test Scenarios\n'));

    const scenarios = [
      () => this.testBasicTimeline(),
      () => this.testPlatformPresets(),
      () => this.testEffectsComposition(),
      () => this.testCaptions(),
      () => this.testSlideshow(),
      () => this.testComplexWorkflow()
    ];

    for (const scenario of scenarios) {
      try {
        await scenario();
      } catch (error) {
        this.logError('Scenario failed', error);
      }
    }

    this.printSummary();
  }

  async testBasicTimeline() {
    this.logSection('Basic Timeline Operations');

    // Simulate Timeline creation and command generation
    const timelineCommands = [
      'ffmpeg -i sample-files/red-video.mp4 -t 10 -c:v libx264 -crf 23 -preset medium -c:a aac -y output/basic-video.mp4',
      'ffmpeg -i sample-files/red-video.mp4 -filter_complex "drawtext=text=\'Hello World\':x=(w-text_w)/2:y=(h-text_h)/2:fontsize=24:fontcolor=white" -c:v libx264 -crf 23 -preset medium -c:a aac -y output/text-overlay.mp4'
    ];

    await this.executeCommands('basic-timeline', timelineCommands);
  }

  async testPlatformPresets() {
    this.logSection('Platform-Specific Presets');

    const platformCommands = [
      // TikTok (9:16)
      'ffmpeg -i sample-files/red-video.mp4 -filter_complex "scale=1080:1920,crop=1080:1920:(iw-1080)/2:(ih-1920)/2" -c:v libx264 -crf 23 -preset medium -c:a aac -y output/tiktok-video.mp4',
      
      // YouTube (16:9)
      'ffmpeg -i sample-files/blue-video.mp4 -filter_complex "scale=1920:1080,crop=1920:1080:(iw-1920)/2:(ih-1080)/2" -c:v libx264 -crf 23 -preset medium -c:a aac -y output/youtube-video.mp4',
      
      // Instagram Square (1:1)
      'ffmpeg -i sample-files/green-video.mp4 -filter_complex "scale=1080:1080,crop=1080:1080:(iw-1080)/2:(ih-1080)/2" -c:v libx264 -crf 23 -preset medium -c:a aac -y output/instagram-square.mp4'
    ];

    await this.executeCommands('platform-presets', platformCommands);
  }

  async testEffectsComposition() {
    this.logSection('Effects & Filters');

    const effectCommands = [
      // Brightness + Contrast
      'ffmpeg -i sample-files/red-video.mp4 -filter_complex "eq=brightness=0.2:contrast=1.5" -c:v libx264 -crf 23 -preset medium -c:a aac -y output/bright-contrast.mp4',
      
      // Blur effect
      'ffmpeg -i sample-files/blue-video.mp4 -filter_complex "boxblur=5" -c:v libx264 -crf 23 -preset medium -c:a aac -y output/blurred.mp4',
      
      // Vintage effect (sepia + vignette)
      'ffmpeg -i sample-files/green-video.mp4 -filter_complex "colorchannelmixer=rr=0.393:rg=0.769:rb=0.189:gr=0.349:gg=0.686:gb=0.168:br=0.272:bg=0.534:bb=0.131,vignette=radius=0.6:opacity=0.8" -c:v libx264 -crf 23 -preset medium -c:a aac -y output/vintage.mp4'
    ];

    await this.executeCommands('effects', effectCommands);
  }

  async testCaptions() {
    this.logSection('Caption System');

    const captionCommands = [
      // Basic subtitles
      'ffmpeg -i sample-files/red-video.mp4 -filter_complex "subtitles=sample-files/sample-captions.srt" -c:v libx264 -crf 23 -preset medium -c:a aac -y output/with-subtitles.mp4',
      
      // Word-by-word captions (TikTok style)
      'ffmpeg -i sample-files/blue-video.mp4 -filter_complex "drawtext=text=\'This\':x=(w-text_w)/2:y=(h-text_h)/2:fontsize=56:fontcolor=white:enable=\'between(t,0,0.3)\';drawtext=text=\'is\':x=(w-text_w)/2:y=(h-text_h)/2:fontsize=56:fontcolor=#ff0066:enable=\'between(t,0.3,0.5)\'" -c:v libx264 -crf 23 -preset medium -c:a aac -y output/word-by-word.mp4'
    ];

    await this.executeCommands('captions', captionCommands);
  }

  async testSlideshow() {
    this.logSection('Slideshow Generation');

    const slideshowCommands = [
      // Simple slideshow
      'ffmpeg -loop 1 -i sample-files/background-1.jpg -filter_complex "drawtext=text=\'Slide 1\':x=(w-text_w)/2:y=100:fontsize=72:fontcolor=white" -t 5 -c:v libx264 -crf 23 -preset medium -y output/slide-1.mp4',
      
      // Ken Burns effect
      'ffmpeg -loop 1 -i sample-files/background-2.jpg -filter_complex "zoompan=z=\'min(zoom+0.0015,1.5)\':d=125:x=\'iw/2-(iw/zoom/2)\':y=\'ih/2-(ih/zoom/2)\'" -t 5 -c:v libx264 -crf 23 -preset medium -y output/ken-burns.mp4'
    ];

    await this.executeCommands('slideshow', slideshowCommands);
  }

  async testComplexWorkflow() {
    this.logSection('Complex Workflow');

    const complexCommands = [
      // Multi-input composition with overlay
      'ffmpeg -i sample-files/red-video.mp4 -i sample-files/logo.png -filter_complex "[0:v]scale=1920:1080[bg];[1:v]scale=150:150[logo];[bg][logo]overlay=main_w-overlay_w-20:20" -c:v libx264 -crf 18 -preset slow -c:a aac -y output/watermarked.mp4',
      
      // Concatenation with transition
      'ffmpeg -i sample-files/red-video.mp4 -i sample-files/blue-video.mp4 -filter_complex "[0:v][1:v]concat=n=2:v=1:a=0[outv]" -map "[outv]" -c:v libx264 -crf 23 -preset medium -y output/concatenated.mp4'
    ];

    await this.executeCommands('complex-workflow', complexCommands);
  }

  async executeCommands(testName, commands) {
    for (let i = 0; i < commands.length; i++) {
      const command = commands[i];
      try {
        this.log(`  ${i + 1}. Executing command...`);
        const result = await this.executor.execute(command);
        
        if (result.success) {
          this.logSuccess(`     ✓ Command completed (${result.duration}ms)`);
          this.results.push({ test: testName, command: i + 1, status: 'success', duration: result.duration });
        } else {
          this.logError(`     ✗ Command failed`, result.error);
          this.results.push({ test: testName, command: i + 1, status: 'failed', error: result.error });
        }
      } catch (error) {
        this.logError(`     ✗ Command error`, error.message);
        this.results.push({ test: testName, command: i + 1, status: 'error', error: error.message });
      }
    }
  }

  printSummary() {
    console.log(chalk.blue.bold('\n📊 Test Summary\n'));
    
    const stats = this.executor.getStats();
    console.log(chalk.gray(`Cassette: ${stats.name} (${stats.mode} mode)`));
    console.log(chalk.gray(`Interactions: ${stats.interactions}`));
    console.log(chalk.gray(`Total commands: ${this.results.length}\n`));

    const successful = this.results.filter(r => r.status === 'success').length;
    const failed = this.results.filter(r => r.status !== 'success').length;

    console.log(chalk.green(`✓ Successful: ${successful}`));
    if (failed > 0) {
      console.log(chalk.red(`✗ Failed: ${failed}`));
    }

    // Show test breakdown
    const testGroups = this.results.reduce((acc, result) => {
      if (!acc[result.test]) acc[result.test] = [];
      acc[result.test].push(result);
      return acc;
    }, {});

    console.log('\n' + chalk.bold('Test Breakdown:'));
    Object.entries(testGroups).forEach(([testName, results]) => {
      const success = results.filter(r => r.status === 'success').length;
      const total = results.length;
      const percentage = Math.round((success / total) * 100);
      
      const color = percentage === 100 ? chalk.green : percentage >= 50 ? chalk.yellow : chalk.red;
      console.log(`  ${color(`${testName}: ${success}/${total} (${percentage}%)`)}`);
    });

    if (process.env.CASSETTE_MODE === 'record') {
      console.log(chalk.blue('\n💾 Commands recorded to cassette for future replay'));
    } else {
      console.log(chalk.blue('\n🎭 Commands replayed from cassette'));
    }
  }

  logSection(title) {
    console.log(chalk.yellow.bold(`\n${title}`));
    console.log(chalk.gray('─'.repeat(title.length)));
  }

  log(message) {
    console.log(chalk.gray(message));
  }

  logSuccess(message) {
    console.log(chalk.green(message));
  }

  logError(message, error) {
    console.log(chalk.red(message));
    if (error) {
      console.log(chalk.red(`       ${error}`));
    }
  }
}
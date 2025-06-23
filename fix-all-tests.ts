#!/usr/bin/env bun

/**
 * Automated test fixing script for Media SDK
 * This script identifies and fixes common test failures
 */

import { execSync } from 'child_process';
import { readFileSync, writeFileSync, existsSync } from 'fs';
import { join } from 'path';

// Test failure patterns and their fixes
const fixes = [
  {
    name: 'Fix Timeline getDuration() method',
    file: 'packages/media-sdk/src/timeline/timeline.ts',
    pattern: /getDuration\(\): number \{[\s\S]*?return 0[\s\S]*?\}/,
    replacement: `getDuration(): number {
    if (this.globalOptions.duration) {
      return this.globalOptions.duration;
    }
    
    if (this.layers.length === 0) {
      return 0;
    }
    
    // Calculate duration based on all layers
    let maxDuration = 0;
    for (const layer of this.layers) {
      const layerEnd = (layer.startTime || 0) + (layer.duration || 
        (layer.type === 'video' || layer.type === 'audio' ? 30 : 5)); // Default durations
      maxDuration = Math.max(maxDuration, layerEnd);
    }
    
    return maxDuration;
  }`
  },
  
  {
    name: 'Fix Timeline concat() method',
    file: 'packages/media-sdk/src/timeline/timeline.ts',
    pattern: /concat\(other: Timeline\): Timeline \{[\s\S]*?\}/,
    replacement: `concat(other: Timeline): Timeline {
    const currentDuration = this.getDuration();
    
    // Shift all layers from other timeline by current duration
    const shiftedLayers = other.layers.map(layer => ({
      ...layer,
      startTime: (layer.startTime || 0) + currentDuration
    }));
    
    return new Timeline(
      [...this.layers, ...shiftedLayers],
      this.globalOptions,
      this.lastVideoStream,
      this.lastAudioStream
    );
  }`
  },
  
  {
    name: 'Fix addWordHighlighting empty input handling',
    file: 'packages/media-sdk/src/timeline/timeline.ts',
    pattern: /throw new Error\('Either text or words array must be provided'\);/,
    replacement: `// Handle empty input gracefully
      console.warn('addWordHighlighting: No text or words provided, returning unchanged timeline');
      return this;`
  },
  
  {
    name: 'Add missing validateForPlatform method',
    file: 'packages/media-sdk/src/timeline/timeline.ts',
    appendBefore: 'private generateWordTimings',
    code: `validateForPlatform(platform: string): any {
    // Basic platform validation
    const validPlatforms = ['tiktok', 'instagram', 'youtube', 'twitter', 'linkedin'];
    if (!validPlatforms.includes(platform)) {
      throw new Error(\`Invalid platform: \${platform}\`);
    }
    
    const aspectRatios: Record<string, string> = {
      tiktok: '9:16',
      instagram: '1:1',
      youtube: '16:9',
      twitter: '16:9',
      linkedin: '16:9'
    };
    
    const currentAspectRatio = this.globalOptions.aspectRatio;
    const expectedRatio = aspectRatios[platform];
    
    return {
      isValid: currentAspectRatio === expectedRatio,
      warnings: currentAspectRatio !== expectedRatio 
        ? [\`\${platform} videos should use \${expectedRatio} aspect ratio\`]
        : [],
      errors: [],
      suggestions: currentAspectRatio !== expectedRatio
        ? [\`Use timeline.setAspectRatio("\${expectedRatio}")\`]
        : []
    };
  }

  `
  },
  
  {
    name: 'Fix Timeline.create() static method',
    file: 'packages/media-sdk/src/timeline/timeline.ts',
    appendBefore: 'constructor(',
    code: `static create(): Timeline {
    return new Timeline();
  }

  `
  },
  
  {
    name: 'Fix image handling in getCommand',
    file: 'packages/media-sdk/src/timeline/timeline.ts',
    pattern: /getCommand\(outputPath: string, options: RenderOptions = {}\): string \{[\s\S]*?return parts\.join\(' '\);[\s\S]*?\}/,
    findAndReplace: true,
    oldCode: 'const parts = [',
    newCode: `// Collect all inputs first
    const inputs: string[] = [];
    const filters: string[] = [];
    let inputIndex = 0;
    
    // Add video inputs
    const videoLayers = this.layers.filter(l => l.type === 'video');
    videoLayers.forEach((layer) => {
      inputs.push(\`-i "\${layer.source}"\`);
      inputIndex++;
    });
    
    // Add image inputs (for timelapse)
    const imageLayers = this.layers.filter(l => l.type === 'image');
    imageLayers.forEach((layer) => {
      inputs.push(\`-loop 1 -t \${layer.duration || 3} -i "\${layer.source}"\`);
      inputIndex++;
    });
    
    const parts = [`
  },
  
  {
    name: 'Fix Effect-based Timeline methods to return promises',
    file: 'packages/media-sdk/src/timeline/timeline-effect.ts',
    pattern: /async addVideo\(/,
    findAndReplace: false,
    customFix: (content: string) => {
      // Ensure createTimeline returns a promise
      if (!content.includes('export async function createTimeline')) {
        content = content.replace(
          'export function createTimeline',
          'export async function createTimeline'
        );
      }
      
      // Make sure methods can be chained with promises
      const methodsToFix = ['addVideo', 'addText', 'addImage', 'setAspectRatio', 'trim'];
      
      for (const method of methodsToFix) {
        // Check if method needs async handling
        const methodRegex = new RegExp(`(${method}\\([^)]*\\)): Effect\\.Effect<`);
        if (methodRegex.test(content)) {
          // Add promise-based wrapper if not exists
          const wrapperName = `${method}Async`;
          if (!content.includes(wrapperName)) {
            const wrapperCode = `
  async ${wrapperName}(...args: Parameters<typeof Timeline.prototype.${method}>): Promise<Timeline> {
    const effect = this.${method}(...args);
    return Effect.runPromise(
      Effect.provide(effect, DefaultTimelineServices)
    );
  }`;
            
            // Insert before the last closing brace of the class
            const lastBrace = content.lastIndexOf('}');
            const classEnd = content.lastIndexOf('}', lastBrace - 1);
            content = content.substring(0, classEnd) + wrapperCode + '\n' + content.substring(classEnd);
          }
        }
      }
      
      return content;
    }
  }
];

// Run fixes
async function runFixes() {
  console.log('🔧 Media SDK Test Fixer\n');
  
  let fixedCount = 0;
  
  for (const fix of fixes) {
    const filePath = join(process.cwd(), fix.file);
    
    if (!existsSync(filePath)) {
      console.log(`❌ File not found: ${fix.file}`);
      continue;
    }
    
    let content = readFileSync(filePath, 'utf-8');
    let modified = false;
    
    if (fix.customFix) {
      const newContent = fix.customFix(content);
      if (newContent !== content) {
        content = newContent;
        modified = true;
      }
    } else if (fix.pattern && fix.replacement) {
      if (fix.findAndReplace && fix.oldCode && fix.newCode) {
        // Find and replace within pattern match
        const match = content.match(fix.pattern);
        if (match) {
          const matchedText = match[0];
          const updatedMatch = matchedText.replace(fix.oldCode, fix.newCode);
          content = content.replace(matchedText, updatedMatch);
          modified = true;
        }
      } else {
        // Direct pattern replacement
        const newContent = content.replace(fix.pattern, fix.replacement);
        if (newContent !== content) {
          content = newContent;
          modified = true;
        }
      }
    } else if (fix.appendBefore && fix.code) {
      // Append code before a specific pattern
      const beforePattern = fix.appendBefore;
      const index = content.indexOf(beforePattern);
      if (index !== -1) {
        // Find the start of the line
        const lineStart = content.lastIndexOf('\n', index) + 1;
        const indentation = content.substring(lineStart, index).match(/^\s*/)?.[0] || '  ';
        
        const newContent = content.substring(0, lineStart) + 
          indentation + fix.code + 
          content.substring(lineStart);
        if (newContent !== content) {
          content = newContent;
          modified = true;
        }
      }
    }
    
    if (modified) {
      writeFileSync(filePath, content);
      console.log(`✅ Applied: ${fix.name}`);
      fixedCount++;
    } else {
      console.log(`⏭️  Skipped: ${fix.name} (already applied or pattern not found)`);
    }
  }
  
  console.log(`\n📊 Applied ${fixedCount}/${fixes.length} fixes`);
  
  // Run tests to see improvement
  console.log('\n🧪 Running tests to check improvements...\n');
  
  try {
    execSync('bun test packages/media-sdk --reporter spec', { 
      stdio: 'inherit',
      cwd: process.cwd()
    });
  } catch (error) {
    console.log('\n⚠️  Some tests still failing. Running detailed analysis...');
    
    // Get detailed failure info
    try {
      const output = execSync('bun test packages/media-sdk 2>&1', { 
        encoding: 'utf-8',
        cwd: process.cwd()
      });
      
      const failureLines = output.split('\n').filter(line => 
        line.includes('(fail)') || line.includes('error:')
      );
      
      console.log('\n📋 Remaining failures:');
      failureLines.forEach(line => console.log(`   ${line}`));
      
    } catch (e) {
      // Test command failed, which is expected
    }
  }
  
  console.log('\n✅ Test fixing complete!');
  console.log('\nNext steps:');
  console.log('1. Review the changes made to the files');
  console.log('2. Run individual test files to debug remaining issues');
  console.log('3. Consider implementing Effect-based async wrappers for better compatibility');
}

// Execute
runFixes().catch(console.error);
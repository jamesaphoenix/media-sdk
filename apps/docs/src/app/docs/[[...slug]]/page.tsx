import { notFound } from 'next/navigation';
import Link from 'next/link';
import { CodeBlock } from '@/components/CodeBlock';
import { TableOfContents } from '@/components/TableOfContents';
import { MobileNavigation } from '@/components/MobileNavigation';

const navigation = [
  { name: 'Introduction', href: '/docs' },
  { name: 'Quick Start', href: '/docs/quick-start' },
  { name: 'Installation', href: '/docs/installation' },
  { name: 'API Reference', href: '/docs/api' },
  { name: 'Examples', href: '/docs/examples' },
  { name: 'Testing', href: '/docs/testing' },
  { name: 'Text Escaping', href: '/docs/text-escaping' },
  { name: 'Advanced Features', href: '/docs/advanced' },
  { name: 'Green Screen Guide', href: '/docs/green-screen' },
  { name: 'Interactive Playground', href: '/docs/interactive' },
];

const pageContent: Record<string, { title: string; content: JSX.Element }> = {
  index: {
    title: 'Media SDK',
    content: (
      <div className="space-y-16">
        {/* Hero Section */}
        <div className="text-center space-y-8">
          <div className="space-y-4">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-blue-50 text-blue-700 rounded-full text-sm font-medium">
              <span>🎬</span>
              <span>AI-friendly video manipulation</span>
            </div>
            <h1 className="text-5xl sm:text-6xl font-bold text-gray-900 leading-tight">
              Declarative Video Processing
              <br />
              <span className="text-blue-600">with Self-Healing Architecture</span>
            </h1>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
              Create, manipulate, and enhance videos using a functional composition API. Perfect for AI agents, automation, and real-world video rendering with FFmpeg.
            </p>
          </div>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <Link href="/docs/quick-start" className="inline-flex items-center px-8 py-4 bg-gray-900 text-white rounded-lg font-semibold hover:bg-gray-800 transition-colors group">
              Get Started
              <svg className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </Link>
            <Link href="/docs/examples" className="inline-flex items-center px-8 py-4 border border-gray-300 text-gray-700 rounded-lg font-semibold hover:bg-gray-50 transition-colors">
              View Examples
            </Link>
          </div>
        </div>

        {/* Features Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          <div className="space-y-3">
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
              <span className="text-2xl">🤖</span>
            </div>
            <h3 className="text-xl font-semibold text-gray-900">AI-First Design</h3>
            <p className="text-gray-600">
              Declarative API designed for AI comprehension with predictable patterns and self-documenting methods.
            </p>
          </div>
          
          <div className="space-y-3">
            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
              <span className="text-2xl">🔄</span>
            </div>
            <h3 className="text-xl font-semibold text-gray-900">Self-Healing</h3>
            <p className="text-gray-600">
              Automatic quality detection and optimization with vision analysis and error recovery capabilities.
            </p>
          </div>
          
          <div className="space-y-3">
            <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
              <span className="text-2xl">🎭</span>
            </div>
            <h3 className="text-xl font-semibold text-gray-900">Green Screen</h3>
            <p className="text-gray-600">
              Advanced chromakey filtering with background replacement for professional video composition.
            </p>
          </div>
          
          <div className="space-y-3">
            <div className="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center">
              <span className="text-2xl">📱</span>
            </div>
            <h3 className="text-xl font-semibold text-gray-900">Platform Ready</h3>
            <p className="text-gray-600">
              Built-in presets for TikTok, YouTube, Instagram with automatic format optimization.
            </p>
          </div>
          
          <div className="space-y-3">
            <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center">
              <span className="text-2xl">🧪</span>
            </div>
            <h3 className="text-xl font-semibold text-gray-900">Production Ready</h3>
            <p className="text-gray-600">
              120+ tests with runtime validation, memory leak detection, and production reliability testing.
            </p>
          </div>
          
          <div className="space-y-3">
            <div className="w-12 h-12 bg-indigo-100 rounded-lg flex items-center justify-center">
              <span className="text-2xl">⚡</span>
            </div>
            <h3 className="text-xl font-semibold text-gray-900">Fast Testing</h3>
            <p className="text-gray-600">
              Cassette system with AST-based invalidation for lightning-fast development cycles.
            </p>
          </div>
        </div>

        {/* Quick Example */}
        <div className="space-y-6">
          <div className="text-center">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Get Started in Seconds</h2>
            <p className="text-xl text-gray-600">
              Create your first video with just a few lines of code
            </p>
          </div>
          
          <div className="bg-gray-50 rounded-xl p-8">
            <CodeBlock
              code={`import { Timeline } from '@jamesaphoenix/media-sdk';

// Create a simple video with text
const timeline = new Timeline()
  .addVideo('input.mp4')
  .addText('Hello, World!', {
    position: 'center',
    style: {
      fontSize: 48,
      color: '#ffffff',
      strokeWidth: 2,
      strokeColor: '#000000'
    }
  })
  .setDuration(10);

// Generate FFmpeg command
const command = timeline.getCommand('output.mp4');

// Or render directly (with Bun runtime)
await timeline.render('output.mp4');`}
              language="typescript"
              filename="basic-example.ts"
            />
          </div>
        </div>

        {/* Performance Tip */}
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
          <div className="flex items-start">
            <span className="text-2xl mr-3">⚡</span>
            <div>
              <h3 className="font-semibold text-yellow-900 mb-2">Performance Tip</h3>
              <p className="text-yellow-800">
                Use the cassette system in development to cache FFmpeg executions and speed up testing by 95%.
              </p>
            </div>
          </div>
        </div>
      </div>
    )
  },
  
  'quick-start': {
    title: 'Quick Start',
    content: (
      <div className="space-y-8">
        <div>
          <h1 className="text-4xl font-bold text-gray-900 mb-4">Quick Start</h1>
          <p className="text-xl text-gray-600">
            Get up and running with Media SDK in less than 5 minutes.
          </p>
        </div>

        <div className="space-y-6">
          <h2 className="text-2xl font-semibold text-gray-900">Installation</h2>
          
          <CodeBlock
            code={`# Install the package
npm install @jamesaphoenix/media-sdk

# Install FFmpeg (required)
# macOS
brew install ffmpeg

# Ubuntu/Debian  
sudo apt update && sudo apt install ffmpeg

# Windows
# Download from https://ffmpeg.org/download.html`}
            language="bash"
          />
        </div>

        <div className="space-y-6">
          <h2 className="text-2xl font-semibold text-gray-900">Basic Usage</h2>
          
          <CodeBlock
            code={`import { Timeline } from '@jamesaphoenix/media-sdk';

// Create a timeline
const timeline = new Timeline()
  .addVideo('input.mp4')
  .addText('Hello World', {
    position: 'center',
    style: {
      fontSize: 48,
      color: '#ffffff'
    }
  })
  .setDuration(10);

// Generate FFmpeg command
const command = timeline.getCommand('output.mp4');
console.log(command);

// Execute with Node.js
import { execSync } from 'child_process';
execSync(command);`}
            language="typescript"
            filename="basic-usage.ts"
          />
        </div>

        <div className="space-y-6">
          <h2 className="text-2xl font-semibold text-gray-900">Green Screen Example</h2>
          
          <CodeBlock
            code={`import { Timeline } from '@jamesaphoenix/media-sdk';

// Replace green screen background
const timeline = new Timeline()
  .addGreenScreenWithImageBackground(
    'subject-with-greenscreen.mp4',
    'new-background.jpg',
    {
      chromaKey: '#00FF00',
      chromaSimilarity: 0.4,
      chromaBlend: 0.1,
      backgroundScale: 'fill'
    }
  )
  .addText('Amazing transformation!', {
    position: 'top',
    style: {
      fontSize: 36,
      color: '#ffffff',
      strokeWidth: 2,
      strokeColor: '#000000'
    }
  });

const command = timeline.getCommand('output.mp4');`}
            language="typescript"
            filename="green-screen.ts"
          />
        </div>

        <div className="space-y-6">
          <h2 className="text-2xl font-semibold text-gray-900">Platform Presets</h2>
          
          <CodeBlock
            code={`// TikTok-optimized content
const tiktokVideo = new Timeline()
  .addGreenScreenMeme(
    'reaction.mp4',
    'trending-background.jpg',
    'reaction',
    { platform: 'tiktok', intensity: 'high' }
  )
  .addText('POV: When your code finally works! 😭', {
    position: 'top',
    style: {
      fontSize: 40,
      color: '#ffffff',
      strokeWidth: 3,
      strokeColor: '#ff0066'
    }
  })
  .setAspectRatio('9:16');

// YouTube-optimized content
const youtubeVideo = new Timeline()
  .addVideo('tutorial.mp4')
  .addText('Complete Tutorial Guide', {
    position: 'top',
    style: {
      fontSize: 32,
      color: '#ffffff',
      backgroundColor: 'rgba(0,0,0,0.8)'
    }
  })
  .setAspectRatio('16:9');`}
            language="typescript"
            filename="platform-presets.ts"
          />
        </div>

        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
          <div className="flex items-start">
            <span className="text-2xl mr-3">💡</span>
            <div>
              <h3 className="font-semibold text-blue-900 mb-2">Next Steps</h3>
              <p className="text-blue-800 mb-3">
                Now that you have the basics, explore these advanced features:
              </p>
              <ul className="list-disc list-inside space-y-1 text-blue-800">
                <li><Link href="/docs/green-screen" className="underline hover:no-underline">Advanced Green Screen Effects</Link></li>
                <li><Link href="/docs/testing" className="underline hover:no-underline">Production Testing & Reliability</Link></li>
                <li><Link href="/docs/text-escaping" className="underline hover:no-underline">Text Escaping for Special Characters</Link></li>
                <li><Link href="/docs/interactive" className="underline hover:no-underline">Interactive Playground</Link></li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    )
  },

  'installation': {
    title: 'Installation',
    content: (
      <div className="space-y-8">
        <div>
          <h1 className="text-4xl font-bold text-gray-900 mb-4">Installation</h1>
          <p className="text-xl text-gray-600">
            Complete installation guide for all environments and platforms.
          </p>
        </div>

        <div className="space-y-6">
          <h2 className="text-2xl font-semibold text-gray-900">Package Installation</h2>
          
          <CodeBlock
            code={`# Using npm
npm install @jamesaphoenix/media-sdk

# Using yarn
yarn add @jamesaphoenix/media-sdk

# Using pnpm
pnpm add @jamesaphoenix/media-sdk

# Using bun
bun add @jamesaphoenix/media-sdk`}
            language="bash"
          />
        </div>

        <div className="space-y-6">
          <h2 className="text-2xl font-semibold text-gray-900">FFmpeg Installation</h2>
          <p className="text-gray-600 mb-4">
            FFmpeg is required for video processing. Install it for your platform:
          </p>
          
          <div className="space-y-4">
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">macOS</h3>
              <CodeBlock
                code={`# Using Homebrew (recommended)
brew install ffmpeg

# Using MacPorts
sudo port install ffmpeg

# Verify installation
ffmpeg -version`}
                language="bash"
              />
            </div>

            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Ubuntu/Debian</h3>
              <CodeBlock
                code={`# Update package list
sudo apt update

# Install FFmpeg
sudo apt install ffmpeg

# Verify installation
ffmpeg -version`}
                language="bash"
              />
            </div>

            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Windows</h3>
              <CodeBlock
                code={`# Using Chocolatey
choco install ffmpeg

# Using Scoop
scoop install ffmpeg

# Manual installation:
# 1. Download from https://ffmpeg.org/download.html
# 2. Extract to C:\\ffmpeg
# 3. Add C:\\ffmpeg\\bin to PATH

# Verify installation
ffmpeg -version`}
                language="bash"
              />
            </div>

            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">CentOS/RHEL/Fedora</h3>
              <CodeBlock
                code={`# Fedora
sudo dnf install ffmpeg

# CentOS/RHEL (requires EPEL)
sudo yum install epel-release
sudo yum install ffmpeg

# Verify installation
ffmpeg -version`}
                language="bash"
              />
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <h2 className="text-2xl font-semibold text-gray-900">Environment Setup</h2>
          
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">TypeScript Configuration</h3>
            <CodeBlock
              code={`// tsconfig.json
{
  "compilerOptions": {
    "target": "ES2020",
    "lib": ["ES2020"],
    "module": "commonjs",
    "moduleResolution": "node",
    "esModuleInterop": true,
    "allowSyntheticDefaultImports": true,
    "strict": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true
  }
}`}
              language="json"
              filename="tsconfig.json"
            />
          </div>

          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Environment Variables (Optional)</h3>
            <CodeBlock
              code={`# .env
# Optional: Gemini API key for vision analysis
GEMINI_API_KEY=your_api_key_here

# Optional: Cassette mode for testing
CASSETTE_MODE=auto

# Optional: Vision quality threshold
VISION_QUALITY_THRESHOLD=0.75`}
              language="bash"
              filename=".env"
            />
          </div>
        </div>

        <div className="space-y-6">
          <h2 className="text-2xl font-semibold text-gray-900">Verification</h2>
          
          <CodeBlock
            code={`import { Timeline } from '@jamesaphoenix/media-sdk';

// Test basic functionality
const timeline = new Timeline()
  .addVideo('test.mp4')
  .addText('Installation Test', {
    position: 'center',
    style: { fontSize: 32, color: '#ffffff' }
  });

console.log('✅ Media SDK installed successfully!');
console.log('FFmpeg command:', timeline.getCommand('output.mp4'));`}
            language="typescript"
            filename="verify-installation.ts"
          />
        </div>

        <div className="bg-green-50 border border-green-200 rounded-lg p-6">
          <div className="flex items-start">
            <span className="text-2xl mr-3">✅</span>
            <div>
              <h3 className="font-semibold text-green-900 mb-2">Installation Complete!</h3>
              <p className="text-green-800">
                You're all set! Head over to the <Link href="/docs/quick-start" className="underline hover:no-underline">Quick Start guide</Link> to create your first video.
              </p>
            </div>
          </div>
        </div>
      </div>
    )
  },

  'testing': {
    title: 'Testing',
    content: (
      <div className="space-y-8">
        <div>
          <h1 className="text-4xl font-bold text-gray-900 mb-4">Testing</h1>
          <p className="text-xl text-gray-600">
            Comprehensive testing strategies including runtime validation and production reliability.
          </p>
        </div>

        <div className="space-y-6">
          <h2 className="text-2xl font-semibold text-gray-900">🧪 Test Coverage</h2>
          <p className="text-gray-600 mb-4">
            Over <strong>120+ tests</strong> with <strong>97% coverage</strong> across all systems:
          </p>
          
          <ul className="list-disc list-inside space-y-2 text-gray-600">
            <li><strong>Unit Tests</strong> - Core functionality validation</li>
            <li><strong>Runtime Tests</strong> - Real FFmpeg execution with media files</li>
            <li><strong>Vision Tests</strong> - AI-powered quality validation</li>
            <li><strong>Integration Tests</strong> - End-to-end workflow verification</li>
            <li><strong>Performance Tests</strong> - Stress testing and benchmarking</li>
          </ul>
        </div>

        <div className="space-y-6">
          <h2 className="text-2xl font-semibold text-gray-900">Basic Timeline Tests</h2>
          
          <CodeBlock
            code={`import { Timeline } from '@jamesaphoenix/media-sdk';
import { describe, test, expect } from 'vitest';

describe('Timeline Core Functionality', () => {
  test('should create timeline with video', () => {
    const timeline = new Timeline()
      .addVideo('test.mp4')
      .setDuration(10);
    
    expect(timeline.layers).toHaveLength(1);
    expect(timeline.layers[0].type).toBe('video');
    expect(timeline.getDuration()).toBe(10);
  });

  test('should add text with styling', () => {
    const timeline = new Timeline()
      .addText('Hello World', {
        style: {
          fontSize: 48,
          color: '#ffffff',
          fontFamily: 'Arial Bold'
        },
        position: { x: 'center', y: 'center' }
      });
    
    const textLayer = timeline.layers.find(l => l.type === 'text');
    expect(textLayer).toBeDefined();
    expect(textLayer?.content).toBe('Hello World');
  });

  test('should generate valid FFmpeg command', () => {
    const timeline = new Timeline()
      .addVideo('input.mp4')
      .addText('Test', { position: { x: 50, y: 50 } });
    
    const command = timeline.getCommand('output.mp4');
    
    expect(command).toContain('ffmpeg');
    expect(command).toContain('-i input.mp4');
    expect(command).toContain('output.mp4');
  });
});`}
            language="typescript"
            filename="timeline.test.ts"
          />
        </div>

        <div className="space-y-6">
          <h2 className="text-2xl font-semibold text-gray-900">Production Reliability Testing</h2>
          
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">💾 File System Reliability</h3>
            <CodeBlock
              code={`describe('💾 File System Reliability', () => {
  test('should handle missing input files gracefully', async () => {
    const timeline = new Timeline()
      .addGreenScreenWithImageBackground(
        'non-existent-video.mp4',
        'assets/sample-images/gradient-bg.jpg',
        {
          chromaKey: '#00FF00',
          chromaSimilarity: 0.4,
          chromaBlend: 0.1,
          backgroundScale: 'fill'
        }
      )
      .addText('Testing missing file handling', {
        position: 'center',
        style: {
          fontSize: 32,
          color: '#ffffff',
          strokeWidth: 2,
          strokeColor: '#000000'
        }
      });

    const command = timeline.getCommand('output/missing-input-test.mp4');

    // This should fail gracefully
    try {
      await executeFFmpeg(command);
      console.log('⚠️ Unexpected success with missing file');
    } catch (error) {
      // Expected failure - verify error handling
      expect(error).toBeDefined();
      console.log('✅ Missing file handled gracefully');
    }
  }, 60000);
});`}
              language="typescript"
            />
          </div>

          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">🧠 Memory Leak Detection</h3>
            <CodeBlock
              code={`describe('🧠 Memory Leak Detection Tests', () => {
  test('should not accumulate memory across multiple timeline creations', async () => {
    const iterations = 50;
    const memorySnapshots = [];
    
    // Get initial memory usage
    const initialMemory = process.memoryUsage();
    memorySnapshots.push({ iteration: 0, ...initialMemory });
    
    for (let i = 1; i <= iterations; i++) {
      // Create and destroy timeline objects
      const timeline = new Timeline()
        .addGreenScreenWithImageBackground(
          'assets/green-screen-meme-1.mp4',
          'assets/sample-images/gradient-bg.jpg',
          {
            chromaKey: '#00FF00',
            chromaSimilarity: 0.4,
            chromaBlend: 0.1,
            backgroundScale: 'fill'
          }
        )
        .addText(\`Memory test iteration \${i}/\${iterations}\`, {
          position: 'center',
          style: {
            fontSize: 28,
            color: '#ffffff',
            strokeWidth: 2,
            strokeColor: '#000000'
          }
        })
        .setDuration(2);

      // Generate command (but don't execute to focus on memory usage)
      const command = timeline.getCommand(\`output/memory-test-\${i}.mp4\`);
      
      // Take memory snapshot every 10 iterations
      if (i % 10 === 0) {
        const memory = process.memoryUsage();
        memorySnapshots.push({ iteration: i, ...memory });
        
        console.log(\`💾 Iteration \${i}: Heap \${(memory.heapUsed / 1024 / 1024).toFixed(1)}MB\`);
      }
      
      // Force garbage collection if available
      if (global.gc) {
        global.gc();
      }
    }
    
    // Analyze memory growth
    const finalMemory = process.memoryUsage();
    const memoryGrowth = finalMemory.heapUsed - initialMemory.heapUsed;
    const memoryGrowthMB = memoryGrowth / 1024 / 1024;
    
    // Memory growth should be reasonable (less than 50MB for 50 iterations)
    expect(memoryGrowthMB).toBeLessThan(50);
  }, 120000);
});`}
              language="typescript"
            />
          </div>
        </div>

        <div className="space-y-6">
          <h2 className="text-2xl font-semibold text-gray-900">Vision Testing</h2>
          
          <CodeBlock
            code={`import { VisionRuntimeValidator } from '@jamesaphoenix/media-sdk';

describe('🔍 Vision Validation System', () => {
  let validator: VisionRuntimeValidator;
  
  beforeEach(() => {
    validator = new VisionRuntimeValidator();
  });

  test('should validate video quality', async () => {
    const timeline = new Timeline()
      .addVideo('assets/high-quality.mp4')
      .addText('Clear readable text', {
        style: {
          fontSize: 48,
          color: '#ffffff',
          strokeColor: '#000000',
          strokeWidth: 2
        }
      });
    
    const command = timeline.getCommand('output/quality-test.mp4');
    await executeFFmpeg(command);
    
    const validation = await validator.validateRender(
      'output/quality-test.mp4',
      'youtube',
      { command, timeline },
      ['Clear readable text'],
      [command]
    );
    
    expect(validation.isValid).toBe(true);
    expect(validation.qualityScore).toBeGreaterThan(0.75);
    expect(validation.textDetection?.confidence).toBeGreaterThan(0.8);
  }, 60000);

  test('should detect poor quality and suggest improvements', async () => {
    const timeline = new Timeline()
      .addVideo('assets/low-quality.mp4')
      .addText('tiny text', {
        style: {
          fontSize: 12,  // Too small
          color: '#cccccc'  // Poor contrast
        }
      });
    
    const command = timeline.getCommand('output/poor-quality.mp4');
    await executeFFmpeg(command);
    
    const validation = await validator.validateRender(
      'output/poor-quality.mp4',
      'tiktok',
      { command, timeline },
      ['tiny text'],
      [command]
    );
    
    expect(validation.qualityScore).toBeLessThan(0.5);
    expect(validation.suggestions).toContain('increase font size');
    expect(validation.suggestions).toContain('improve contrast');
  }, 60000);
});`}
            language="typescript"
          />
        </div>

        <div className="space-y-6">
          <h2 className="text-2xl font-semibold text-gray-900">Running Tests</h2>
          
          <CodeBlock
            code={`# Run all tests
npm test

# Run with coverage
npm run test:coverage

# Run specific test suite
npm test -- --grep "Timeline"

# Run runtime tests only
npm run test:runtime

# Watch mode for development
npm run test:watch`}
            language="bash"
          />
        </div>

        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
          <div className="flex items-start">
            <span className="text-2xl mr-3">💡</span>
            <div>
              <h3 className="font-semibold text-blue-900 mb-2">Production Ready</h3>
              <p className="text-blue-800">
                These comprehensive tests ensure the Media SDK can handle real-world production scenarios including resource exhaustion, memory leaks, file system issues, and concurrent processing.
              </p>
            </div>
          </div>
        </div>
      </div>
    )
  },

  'text-escaping': {
    title: 'Text Escaping Guide',
    content: (
      <div className="space-y-8">
        <div>
          <h1 className="text-4xl font-bold text-gray-900 mb-4">🔤 Text Escaping Guide</h1>
          <p className="text-xl text-gray-600">
            Comprehensive guide to handling special characters and text escaping in FFmpeg filters.
          </p>
        </div>

        <div className="space-y-6">
          <h2 className="text-2xl font-semibold text-gray-900">🌟 Overview</h2>
          <p className="text-gray-600 mb-4">
            The Media SDK automatically handles text escaping to prevent FFmpeg filter syntax errors when using special characters like:
          </p>
          
          <ul className="list-disc list-inside space-y-2 text-gray-600">
            <li><strong>Quotes and apostrophes</strong> (<code>'</code>, <code>"</code>)</li>
            <li><strong>Colons and brackets</strong> (<code>:</code>, <code>[</code>, <code>]</code>)</li>
            <li><strong>Percent signs</strong> (<code>%</code>)</li>
            <li><strong>Backslashes</strong> (<code>\</code>)</li>
            <li><strong>Unicode and emoji</strong> (🔥, 世界, مرحبا)</li>
          </ul>
        </div>

        <div className="space-y-6">
          <h2 className="text-2xl font-semibold text-gray-900">Basic Text Escaping</h2>
          
          <CodeBlock
            code={`import { Timeline } from '@jamesaphoenix/media-sdk';

// Text with special characters - automatically escaped
const timeline = new Timeline()
  .addText("Don't forget: Save [100%] complete!", {
    position: 'center',
    style: {
      fontSize: 32,
      color: '#ffffff',
      strokeWidth: 2,
      strokeColor: '#000000'
    }
  });

// Generates properly escaped FFmpeg command:
// drawtext=text='Don\\\\'t forget\\\\: Save \\\\[100\\\\%\\\\] complete!'`}
            language="typescript"
            filename="basic-escaping.ts"
          />
        </div>

        <div className="space-y-6">
          <h2 className="text-2xl font-semibold text-gray-900">🎭 Real-World Examples</h2>
          
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">TikTok Viral Content</h3>
            <CodeBlock
              code={`const tiktokMeme = new Timeline()
  .addGreenScreenMeme(
    'subject.mp4',
    'trending-background.jpg',
    'reaction',
    { platform: 'tiktok', intensity: 'high' }
  )
  .addText('POV: When your code finally works! 😭', {
    position: 'top',
    style: {
      fontSize: 40,
      color: '#ffffff',
      strokeWidth: 3,
      strokeColor: '#ff0066'
    }
  })
  .addText('#coding #relatable #developer @everyone', {
    position: 'bottom',
    style: {
      fontSize: 24,
      color: '#00ffff',
      strokeWidth: 2,
      strokeColor: '#000000'
    }
  });`}
              language="typescript"
            />
          </div>

          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Instagram Quotes</h3>
            <CodeBlock
              code={`const instagramQuote = new Timeline()
  .addGreenScreenMeme(
    'presenter.mp4',
    'aesthetic-background.jpg',
    'educational',
    { platform: 'instagram', professional: true }
  )
  .addText('✨ "Success isn\\'t final: failure isn\\'t fatal" ✨', {
    position: 'top',
    style: {
      fontSize: 32,
      color: '#ffffff',
      strokeWidth: 2,
      strokeColor: '#000000'
    }
  })
  .addText('Follow @motivation.daily for more [inspiration] 🚀', {
    position: 'bottom',
    style: {
      fontSize: 20,
      color: '#ffffff',
      strokeWidth: 1,
      strokeColor: '#000000'
    }
  });`}
              language="typescript"
            />
          </div>
        </div>

        <div className="space-y-6">
          <h2 className="text-2xl font-semibold text-gray-900">🌍 International Support</h2>
          
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Unicode and Emoji</h3>
            <CodeBlock
              code={`const unicodeContent = new Timeline()
  .addText('🔥🚀 Unicode Test 火災 ありがとう 🎉', {
    position: 'top',
    style: {
      fontSize: 36,
      color: '#ffffff',
      strokeWidth: 2,
      strokeColor: '#000000'
    }
  });`}
              language="typescript"
            />
          </div>

          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Right-to-Left Languages</h3>
            <CodeBlock
              code={`const rtlContent = new Timeline()
  .addText('مرحبا بالعالم • שלום עולם', {
    position: 'center',
    style: {
      fontSize: 32,
      color: '#ffffff',
      strokeWidth: 2,
      strokeColor: '#000000'
    }
  });`}
              language="typescript"
            />
          </div>

          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Mathematical Symbols</h3>
            <CodeBlock
              code={`const mathContent = new Timeline()
  .addText('E=mc² • π≈3.14 • ∑∞ • α+β=γ', {
    position: 'bottom',
    style: {
      fontSize: 28,
      color: '#ffffff',
      strokeWidth: 2,
      strokeColor: '#000000'
    }
  });`}
              language="typescript"
            />
          </div>
        </div>

        <div className="space-y-6">
          <h2 className="text-2xl font-semibold text-gray-900">🔧 Advanced Text Utilities</h2>
          
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Manual Escaping (Advanced)</h3>
            <CodeBlock
              code={`import { escapeFFmpegText } from '@jamesaphoenix/media-sdk';

// Manual escaping for custom use cases
const escapedText = escapeFFmpegText("POV: You're 100% done!");
console.log(escapedText); // "POV\\\\: You\\\\'re 100\\\\% done!"`}
              language="typescript"
            />
          </div>

          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Text Validation</h3>
            <CodeBlock
              code={`import { validateFFmpegText } from '@jamesaphoenix/media-sdk';

const longText = "Very long text content...".repeat(50);
const validation = validateFFmpegText(longText);

if (!validation.isValid) {
  console.log('Issues:', validation.issues);
  // ["Text is very long and may cause performance issues"]
  
  console.log('Suggestions:', validation.suggestions);
  // ["Consider breaking long text into multiple shorter captions"]
}`}
              language="typescript"
            />
          </div>

          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">File Name Cleaning</h3>
            <CodeBlock
              code={`import { cleanFileName } from '@jamesaphoenix/media-sdk';

const cleanName = cleanFileName('My Video: Part 1 [HD].mp4');
console.log(cleanName); // "My_Video_Part_1_HD.mp4"`}
              language="typescript"
            />
          </div>
        </div>

        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
          <div className="flex items-start">
            <span className="text-2xl mr-3">💡</span>
            <div>
              <h3 className="font-semibold text-blue-900 mb-2">Best Practice</h3>
              <p className="text-blue-800">
                The SDK automatically handles text escaping in all methods. Manual escaping is only needed for advanced custom filter creation.
              </p>
            </div>
          </div>
        </div>
      </div>
    )
  }
};

export default async function Page({ params }: { params: Promise<{ slug?: string[] }> }) {
  const { slug } = await params;
  const pageName = slug?.join('/') || 'index';
  const page = pageContent[pageName];

  if (!page) {
    notFound();
  }

  // Get current path for navigation
  const currentPath = `/docs${slug?.length ? `/${slug.join('/')}` : ''}`;

  // Generate table of contents based on the page content
  const tocItems = [
    { title: 'Overview', href: '#overview', level: 2 },
    { title: 'Getting Started', href: '#getting-started', level: 2 },
    { title: 'Examples', href: '#examples', level: 2 },
    { title: 'Advanced Usage', href: '#advanced', level: 2 },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="flex">
        {/* Sidebar */}
        <div className="hidden lg:flex lg:w-64 lg:flex-col lg:fixed lg:inset-y-0 lg:border-r lg:border-gray-200 lg:bg-white lg:pt-8">
          <div className="flex-1 flex flex-col min-h-0 pb-4">
            <div className="px-6 mb-8">
              <Link href="/docs" className="text-2xl font-bold text-blue-600">
                Media SDK
              </Link>
            </div>
            <nav className="flex-1 px-3 space-y-1 overflow-y-auto">
              {navigation.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`group flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                    currentPath === item.href
                      ? 'bg-blue-50 text-blue-600'
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                  }`}
                >
                  {item.name}
                </Link>
              ))}
            </nav>
            <div className="flex-shrink-0 px-6 py-4 border-t border-gray-200">
              <div className="flex items-center space-x-3">
                <Link
                  href="https://github.com/your-org/media-sdk"
                  className="text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <span className="sr-only">GitHub</span>
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 0C4.477 0 0 4.484 0 10.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0110 4.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.203 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.942.359.31.678.921.678 1.856 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0020 10.017C20 4.484 15.522 0 10 0z" clipRule="evenodd" />
                  </svg>
                </Link>
                <Link
                  href="https://npmjs.com/package/@jamesaphoenix/media-sdk"
                  className="text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <span className="sr-only">npm</span>
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M8 0C3.58 0 0 3.58 0 8s3.58 8 8 8 8-3.58 8-8-3.58-8-8-8zm.5 7.5h2v2h-2v-2zm-2 0h1v2h-1v-2zm5 0h1v2h-1v-2z" />
                  </svg>
                </Link>
              </div>
            </div>
          </div>
        </div>

        {/* Main content */}
        <div className="lg:pl-64 w-full">
          <div className="flex">
            {/* Content */}
            <main className="flex-1 px-4 sm:px-6 lg:px-8 py-8">
              {/* Mobile navigation */}
              <div className="lg:hidden mb-6">
                <MobileNavigation navigation={navigation} currentPath={currentPath} />
              </div>

              {/* Page content */}
              <div className="max-w-4xl mx-auto">
                <article className="prose prose-lg max-w-none">
                  {page.content}
                </article>
              </div>
            </main>

            {/* Table of contents */}
            <aside className="hidden xl:block xl:w-64 xl:flex-shrink-0 xl:pl-8">
              <div className="sticky top-8">
                <TableOfContents items={tocItems} />
              </div>
            </aside>
          </div>
        </div>
      </div>
    </div>
  );
}
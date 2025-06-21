import fs from 'fs';
import https from 'https';
import path from 'path';

/**
 * Download sample videos and images for testing
 * Using lightweight, freely available content
 */
export class SampleDownloader {
  constructor() {
    this.sampleDir = 'sample-files';
    this.samples = {
      // Small sample videos (< 1MB each)
      videos: [
        {
          name: 'sample-video-1.mp4',
          url: 'https://sample-videos.com/zip/10/mp4/SampleVideo_128x96_1mb.mp4',
          description: 'Small test video (128x96, 1MB)'
        },
        {
          name: 'sample-video-2.mp4', 
          url: 'https://file-examples.com/storage/fe68e1bf7d66f447a9c78f8/2017/10/file_example_MP4_480_1_5MG.mp4',
          description: 'Sample video (480p, ~1.5MB)'
        }
      ],
      
      // Sample images
      images: [
        {
          name: 'background-1.jpg',
          url: 'https://picsum.photos/1920/1080?random=1',
          description: 'Random background image (1920x1080)'
        },
        {
          name: 'background-2.jpg',
          url: 'https://picsum.photos/1920/1080?random=2', 
          description: 'Random background image (1920x1080)'
        },
        {
          name: 'logo.png',
          url: 'https://via.placeholder.com/150x150/0066cc/ffffff?text=LOGO',
          description: 'Sample logo (150x150)'
        }
      ],

      // Sample audio (short clips)
      audio: [
        {
          name: 'background-music.mp3',
          url: 'https://www.soundjay.com/misc/sounds/bell-ringing-05.mp3',
          description: 'Short audio clip for testing'
        }
      ]
    };
  }

  async setup() {
    console.log('Setting up sample files...');
    
    // Create sample directory
    if (!fs.existsSync(this.sampleDir)) {
      fs.mkdirSync(this.sampleDir, { recursive: true });
    }

    // Download or create sample files
    await this.createSampleFiles();
    
    console.log('Sample files setup complete!');
  }

  async createSampleFiles() {
    // Create simple colored video files instead of downloading
    await this.createColoredVideo('red-video.mp4', 'red', 5);
    await this.createColoredVideo('blue-video.mp4', 'blue', 5);
    await this.createColoredVideo('green-video.mp4', 'green', 5);
    
    // Create sample images
    await this.createSampleImages();
    
    // Create sample subtitle files
    this.createSampleSubtitles();
  }

  async createColoredVideo(filename, color, duration) {
    const filepath = path.join(this.sampleDir, filename);
    
    if (fs.existsSync(filepath)) {
      console.log(`  ✓ ${filename} already exists`);
      return;
    }

    console.log(`  Creating ${filename}...`);
    
    // Create a simple colored video using FFmpeg
    // This creates a 5-second colored rectangle
    const command = `ffmpeg -f lavfi -i color=c=${color}:size=640x480:duration=${duration} -c:v libx264 -t ${duration} -pix_fmt yuv420p ${filepath}`;
    
    // For now, just create a placeholder file since we don't want to require FFmpeg for setup
    const placeholderContent = JSON.stringify({
      type: 'video',
      color: color,
      duration: duration,
      resolution: '640x480',
      command: command,
      note: 'This is a placeholder. In record mode, this would be a real video file.'
    });
    
    fs.writeFileSync(filepath + '.json', placeholderContent);
    console.log(`  ✓ Created placeholder for ${filename}`);
  }

  async createSampleImages() {
    // Create simple placeholder images
    const images = [
      { name: 'background-1.jpg', width: 1920, height: 1080, color: '#4a90e2' },
      { name: 'background-2.jpg', width: 1920, height: 1080, color: '#50c878' },
      { name: 'logo.png', width: 150, height: 150, color: '#0066cc' }
    ];

    images.forEach(img => {
      const filepath = path.join(this.sampleDir, img.name + '.json');
      
      if (!fs.existsSync(filepath)) {
        const placeholder = {
          type: 'image',
          width: img.width,
          height: img.height,
          color: img.color,
          note: 'This is a placeholder. In record mode, this would be a real image file.'
        };
        
        fs.writeFileSync(filepath, JSON.stringify(placeholder, null, 2));
        console.log(`  ✓ Created placeholder for ${img.name}`);
      }
    });
  }

  createSampleSubtitles() {
    const subtitles = [
      {
        name: 'sample-captions.srt',
        content: `1
00:00:00,000 --> 00:00:02,000
Welcome to the Media SDK

2
00:00:02,000 --> 00:00:04,000
This is a sample subtitle

3
00:00:04,000 --> 00:00:06,000
Testing caption functionality`
      },
      {
        name: 'word-by-word.json',
        content: JSON.stringify([
          { word: "This", start: 0, end: 0.3 },
          { word: "is", start: 0.3, end: 0.5 },
          { word: "word", start: 0.5, end: 0.8 },
          { word: "by", start: 0.8, end: 1.0 },
          { word: "word", start: 1.0, end: 1.3 },
          { word: "captions", start: 1.3, end: 1.8 }
        ], null, 2)
      }
    ];

    subtitles.forEach(sub => {
      const filepath = path.join(this.sampleDir, sub.name);
      
      if (!fs.existsSync(filepath)) {
        fs.writeFileSync(filepath, sub.content);
        console.log(`  ✓ Created ${sub.name}`);
      }
    });
  }

  listSamples() {
    if (!fs.existsSync(this.sampleDir)) {
      console.log('No sample files directory found. Run setup first.');
      return;
    }

    const files = fs.readdirSync(this.sampleDir);
    console.log('\nAvailable sample files:');
    files.forEach(file => {
      console.log(`  • ${file}`);
    });
  }

  cleanup() {
    if (fs.existsSync(this.sampleDir)) {
      fs.rmSync(this.sampleDir, { recursive: true });
      console.log('Sample files cleaned up');
    }
  }
}
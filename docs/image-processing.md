# Image Processing & Downloads

The Media SDK now includes powerful image processing capabilities with download support, batch processing, and iterable collections. This guide covers the new features for working with images and captions.

## Table of Contents

- [Single Image Processing](#single-image-processing)
- [Batch Processing](#batch-processing)
- [Image Collections](#image-collections)
- [Slideshow Integration](#slideshow-integration)
- [API Reference](#api-reference)

## Single Image Processing

Process individual images with captions and download the results.

### Basic Usage

```typescript
import { processImageWithCaption } from '@jamesaphoenix/media-sdk';

const result = await processImageWithCaption(
  'input.jpg',
  'Hello World!',
  {
    outputDir: 'output',
    position: { x: '50%', y: '80%', anchor: 'center' },
    style: {
      fontSize: 48,
      color: '#ffffff',
      strokeColor: '#000000',
      strokeWidth: 3
    }
  }
);

// Download as buffer
const buffer = await result.download();

// Save to specific location
await result.save('path/to/output.jpg');

// Get as data URL for web display
const dataUrl = await result.getDataUrl();
```

### Using ImageProcessor Class

```typescript
import { ImageProcessor } from '@jamesaphoenix/media-sdk';

const processor = new ImageProcessor({
  outputDir: 'output',
  format: 'jpg',
  quality: 90
});

const result = await processor.processImage(
  'input.jpg',
  'Custom Caption',
  {
    position: { x: '25%', y: '50%' },
    style: {
      fontSize: 64,
      fontFamily: 'Impact',
      color: '#ff0000'
    },
    outputName: 'custom-output'
  }
);
```

### Supported Formats

- **JPEG** (`.jpg`, `.jpeg`) - Best for photos
- **PNG** (`.png`) - Best for images with transparency
- **WebP** (`.webp`) - Modern format with better compression

## Batch Processing

Process multiple images efficiently with parallel execution.

### Basic Batch Processing

```typescript
import { processImageBatch } from '@jamesaphoenix/media-sdk';

const results = await processImageBatch([
  {
    imagePath: 'image1.jpg',
    caption: 'First Image',
    outputName: 'output-1'
  },
  {
    imagePath: 'image2.jpg',
    caption: 'Second Image',
    outputName: 'output-2'
  }
], {
  outputDir: 'batch-output',
  parallel: 4,
  onProgress: ({ current, total, percentage }) => {
    console.log(`Progress: ${percentage}%`);
  }
});
```

### Using BatchProcessor Class

```typescript
import { ImageBatchProcessor } from '@jamesaphoenix/media-sdk';

const batchProcessor = new ImageBatchProcessor({
  outputDir: 'output',
  parallel: 4
});

batchProcessor
  .add({
    imagePath: 'photo1.jpg',
    caption: 'Summer Vacation',
    style: { fontSize: 36, color: '#ffff00' }
  })
  .add({
    imagePath: 'photo2.jpg',
    caption: 'Family Gathering',
    style: { fontSize: 36, color: '#00ff00' }
  });

const results = await batchProcessor.processAll();
```

## Image Collections

Work with collections of images using an iterable, array-like interface.

### Creating Collections

```typescript
import { ImageCollection, createImageCollection } from '@jamesaphoenix/media-sdk';

// Method 1: Create empty collection and add images
const collection = new ImageCollection({
  outputDir: 'collection-output',
  format: 'png'
});

collection
  .addImage('photo1.jpg', 'Caption 1')
  .addImage('photo2.jpg', 'Caption 2')
  .addImage('photo3.jpg', 'Caption 3');

// Method 2: Create from array
const collection2 = createImageCollection([
  { imagePath: 'img1.jpg', caption: 'First' },
  { imagePath: 'img2.jpg', caption: 'Second' }
]);
```

### Iterating Over Collections

```typescript
// Async iteration
for await (const img of collection) {
  console.log(`Processing: ${img.input.caption}`);
  const buffer = await img.download();
}

// Array-like methods
const captions = await collection.map(img => img.input.caption);
const filtered = await collection.filter(img => 
  img.input.caption.includes('Summer')
);
const found = await collection.find(img => 
  img.id === 'specific-id'
);
```

### Collection Operations

```typescript
// Convert to array
const allImages = await collection.toArray();

// Download all images
const paths = await collection.downloadAll('downloads');

// Get as data URLs
const dataUrls = await collection.toDataUrls();
// Returns: [{ id, dataUrl, caption }, ...]
```

## Slideshow Integration

Convert slideshow content to individual images or collections.

### Slideshow Content Type

```typescript
import { SlideshowBuilder, type SlideshowContent } from '@jamesaphoenix/media-sdk';

const slideshowContent: SlideshowContent = {
  type: 'slideshow',
  data: {
    slides: [
      {
        id: 'slide-1',
        mediaRef: [{
          id: 'bg-1',
          url: 'background.jpg',
          type: 'image'
        }],
        layout: 'image_with_text',
        order: 0,
        captions: [{
          id: 'caption-1',
          text: 'Welcome',
          position: { x: 50, y: 50 },
          style: {
            fontSize: 48,
            color: '#ffffff',
            fontWeight: 'bold'
          }
        }]
      }
    ]
  }
};
```

### Export Slideshow Frames

```typescript
const builder = new SlideshowBuilder(slideshowContent, {
  outputDir: 'slideshow-frames',
  imageFormat: 'jpg',
  imageQuality: 90
});

// Export individual frames
const frames = await builder.exportFrames();
for (const frame of frames) {
  const buffer = await frame.download();
  await frame.save(`slide-${frame.index}.jpg`);
}

// Convert to image collection
const collection = await builder.toImageCollection();
await collection.downloadAll('slideshow-images');

// Generate preview montage
const preview = await builder.generatePreview({
  columns: 3,
  maxSlides: 9
});
```

### Direct Conversion Functions

```typescript
import { slideshowToVideo, slideshowToImages } from '@jamesaphoenix/media-sdk';

// Convert to video
const video = await slideshowToVideo(slideshowContent, 'output.mp4', {
  slideDuration: 3,
  transition: 'fade'
});

// Convert to image collection
const images = await slideshowToImages(slideshowContent, {
  outputDir: 'frames',
  imageFormat: 'png'
});
```

## API Reference

### ProcessedImage Interface

```typescript
interface ProcessedImage {
  input: ImageWithCaption;
  outputPath: string;
  command: string;
  id: string;
  metadata?: {
    processedAt: Date;
    duration: number;
    size?: number;
  };
  
  // Methods
  download(): Promise<Buffer>;
  save(path: string): Promise<void>;
  getDataUrl(): Promise<string>;
}
```

### ImageProcessorOptions

```typescript
interface ImageProcessorOptions {
  outputDir?: string;
  format?: 'jpg' | 'png' | 'webp';
  quality?: number; // 1-100
  parallel?: number; // For batch processing
  onProgress?: (progress: ProgressInfo) => void;
}
```

### SlideshowBuilderOptions

```typescript
interface SlideshowBuilderOptions {
  slideDuration?: number;
  transition?: 'none' | 'fade' | 'dissolve' | 'slide' | 'wipe';
  transitionDuration?: number;
  outputDir?: string;
  imageFormat?: 'jpg' | 'png' | 'webp';
  imageQuality?: number;
  videoFormat?: {
    width?: number;
    height?: number;
    fps?: number;
  };
}
```

## Best Practices

1. **Memory Management**: When processing large batches, use parallel processing limits
2. **Format Selection**: Use JPEG for photos, PNG for graphics with transparency
3. **Quality Settings**: Balance quality vs file size (85-90 is usually optimal)
4. **Error Handling**: Always wrap async operations in try-catch blocks
5. **Resource Cleanup**: Collections cache results - call `clear()` when done

## Examples

See the [examples directory](../apps/bun-runtime/examples/image-processor-examples.ts) for complete working examples including:

- Single image processing with downloads
- Batch processing with progress tracking
- Iterable collections with transformations
- Slideshow to image conversion
- Social media image generation
- Advanced collection operations
/**
 * Image Processor Examples
 * 
 * Demonstrates the new image processing capabilities of the Media SDK
 */

import { join } from 'path';
import {
  ImageProcessor,
  ImageBatchProcessor,
  ImageCollection,
  createImageCollection,
  processImageWithCaption,
  SlideshowBuilder,
  type SlideshowContent
} from '@jamesaphoenix/media-sdk';

const ASSETS_DIR = join(process.cwd(), 'test', 'assets');
const OUTPUT_DIR = join(process.cwd(), 'output', 'examples');

/**
 * Example 1: Single Image with Caption Download
 */
async function singleImageExample() {
  console.log('🖼️  Example 1: Single Image with Caption');
  
  const result = await processImageWithCaption(
    join(ASSETS_DIR, 'sample-1.jpg'),
    'Welcome to Media SDK!',
    {
      outputDir: OUTPUT_DIR,
      position: { x: '50%', y: '80%', anchor: 'center' },
      style: {
        fontSize: 64,
        color: '#ffffff',
        backgroundColor: '#000000',
        padding: 20,
        borderRadius: 10,
        strokeColor: '#ff0066',
        strokeWidth: 4
      }
    }
  );

  // Download the processed image
  const buffer = await result.download();
  console.log(`  ✅ Processed image size: ${buffer.length} bytes`);
  
  // Save to a specific location
  await result.save(join(OUTPUT_DIR, 'welcome-image.jpg'));
  console.log(`  ✅ Saved to: ${join(OUTPUT_DIR, 'welcome-image.jpg')}`);
  
  // Get as data URL for web display
  const dataUrl = await result.getDataUrl();
  console.log(`  ✅ Data URL length: ${dataUrl.length} characters`);
}

/**
 * Example 2: Batch Processing Multiple Images
 */
async function batchProcessingExample() {
  console.log('\n📦 Example 2: Batch Processing');
  
  const batchProcessor = new ImageBatchProcessor({
    outputDir: OUTPUT_DIR,
    format: 'jpg',
    quality: 90,
    parallel: 3
  });

  // Add multiple images with different captions
  batchProcessor
    .add({
      imagePath: join(ASSETS_DIR, 'sample-1.jpg'),
      caption: '🚀 Fast Processing',
      style: {
        fontSize: 48,
        color: '#00ff00',
        fontFamily: 'Arial'
      },
      outputName: 'batch-1-fast'
    })
    .add({
      imagePath: join(ASSETS_DIR, 'sample-2.jpg'),
      caption: '💪 Powerful Features',
      style: {
        fontSize: 48,
        color: '#ff00ff',
        fontFamily: 'Arial'
      },
      outputName: 'batch-2-powerful'
    })
    .add({
      imagePath: join(ASSETS_DIR, 'sample-3.jpg'),
      caption: '✨ Beautiful Results',
      style: {
        fontSize: 48,
        color: '#ffff00',
        fontFamily: 'Arial'
      },
      outputName: 'batch-3-beautiful'
    });

  // Process with progress tracking
  let processedCount = 0;
  const results = await batchProcessor.processAll();
  
  console.log(`  ✅ Processed ${results.length} images in batch`);
  
  // Download all results
  for (const result of results) {
    const buffer = await result.download();
    processedCount++;
    console.log(`  📥 Downloaded image ${processedCount}: ${buffer.length} bytes`);
  }
}

/**
 * Example 3: Iterable Image Collection
 */
async function imageCollectionExample() {
  console.log('\n🎨 Example 3: Image Collection with Iteration');
  
  const collection = new ImageCollection({
    outputDir: OUTPUT_DIR,
    format: 'png',
    quality: 95
  });

  // Add images with captions
  collection
    .addImage(join(ASSETS_DIR, 'sample-1.jpg'), 'First Image', {
      position: { x: '50%', y: '10%', anchor: 'top-center' },
      style: { fontSize: 36, color: '#ffffff', backgroundColor: '#ff0000' }
    })
    .addImage(join(ASSETS_DIR, 'sample-2.jpg'), 'Second Image', {
      position: { x: '50%', y: '50%', anchor: 'center' },
      style: { fontSize: 36, color: '#000000', backgroundColor: '#00ff00' }
    })
    .addImage(join(ASSETS_DIR, 'sample-3.jpg'), 'Third Image', {
      position: { x: '50%', y: '90%', anchor: 'bottom-center' },
      style: { fontSize: 36, color: '#ffffff', backgroundColor: '#0000ff' }
    });

  // Iterate over the collection
  console.log('  🔄 Iterating over collection:');
  for await (const img of collection) {
    console.log(`    - ${img.input.caption}: ${img.id}`);
  }

  // Use array-like methods
  const captions = await collection.map(img => img.input.caption);
  console.log(`  📝 All captions: ${captions.join(', ')}`);

  // Filter images
  const filtered = await collection.filter(img => 
    img.input.caption.includes('Second')
  );
  console.log(`  🔍 Filtered results: ${filtered.length} images`);

  // Download all to a directory
  const downloadPaths = await collection.downloadAll(join(OUTPUT_DIR, 'collection'));
  console.log(`  💾 Downloaded ${downloadPaths.length} images to collection folder`);

  // Get as data URLs
  const dataUrls = await collection.toDataUrls();
  console.log(`  🌐 Generated ${dataUrls.length} data URLs`);
}

/**
 * Example 4: Slideshow to Individual Images
 */
async function slideshowToImagesExample() {
  console.log('\n🎬 Example 4: Slideshow to Individual Images');
  
  // Create a slideshow content structure
  const slideshowContent: SlideshowContent = {
    type: 'slideshow',
    data: {
      slides: [
        {
          id: 'intro',
          mediaRef: [{
            id: 'intro-bg',
            url: join(ASSETS_DIR, 'sample-1.jpg'),
            type: 'image'
          }],
          layout: 'image_with_text',
          order: 0,
          captions: [{
            id: 'intro-title',
            text: 'Media SDK Showcase',
            position: { x: 50, y: 40 },
            style: {
              fontSize: 72,
              fontFamily: 'Impact',
              color: '#ffffff',
              backgroundColor: '#ff0066',
              fontWeight: 'bold',
              textAlign: 'center'
            }
          }]
        },
        {
          id: 'features',
          mediaRef: [{
            id: 'features-bg',
            url: join(ASSETS_DIR, 'sample-2.jpg'),
            type: 'image'
          }],
          layout: 'image_with_text',
          order: 1,
          captions: [
            {
              id: 'features-title',
              text: 'Amazing Features',
              position: { x: 50, y: 30 },
              style: {
                fontSize: 48,
                color: '#ffffff',
                fontWeight: 'bold',
                textAlign: 'center'
              }
            },
            {
              id: 'features-list',
              text: '• Download images\n• Batch processing\n• Iterable collections',
              position: { x: 50, y: 60 },
              style: {
                fontSize: 32,
                color: '#ffffff',
                textAlign: 'left'
              }
            }
          ]
        },
        {
          id: 'conclusion',
          mediaRef: [{
            id: 'conclusion-bg',
            url: join(ASSETS_DIR, 'sample-3.jpg'),
            type: 'image'
          }],
          layout: 'image_with_text',
          order: 2,
          captions: [{
            id: 'conclusion-text',
            text: 'Start Creating Today!',
            position: { x: 50, y: 50 },
            style: {
              fontSize: 64,
              color: '#ffffff',
              backgroundColor: '#6600ff',
              fontWeight: 'bold',
              textAlign: 'center'
            }
          }]
        }
      ]
    }
  };

  // Create slideshow builder
  const builder = new SlideshowBuilder(slideshowContent, {
    outputDir: join(OUTPUT_DIR, 'slideshow-frames'),
    imageFormat: 'jpg',
    imageQuality: 95
  });

  // Export individual frames
  const frames = await builder.exportFrames();
  console.log(`  🖼️  Exported ${frames.length} frames`);

  for (const [index, frame] of frames.entries()) {
    const buffer = await frame.download();
    console.log(`  📥 Frame ${index + 1}: ${buffer.length} bytes`);
  }

  // Convert to image collection for easy manipulation
  const collection = await builder.toImageCollection();
  console.log(`  🎨 Created image collection with ${collection.size} images`);

  // Generate preview montage
  const preview = await builder.generatePreview({
    columns: 3,
    outputPath: join(OUTPUT_DIR, 'slideshow-preview.jpg')
  });
  console.log(`  🖼️  Generated preview montage at: ${preview.outputPath}`);
}

/**
 * Example 5: Social Media Image Generation
 */
async function socialMediaExample() {
  console.log('\n📱 Example 5: Social Media Images');
  
  const processor = new ImageProcessor({
    outputDir: join(OUTPUT_DIR, 'social-media')
  });

  // Instagram Post
  const instagram = await processor.processImage(
    join(ASSETS_DIR, 'sample-1.jpg'),
    'Check out our new feature! 🎉',
    {
      outputName: 'instagram-post',
      position: { x: '50%', y: '80%', anchor: 'center' },
      style: {
        fontSize: 48,
        fontFamily: 'Arial',
        color: '#ffffff',
        backgroundColor: '#E4405F', // Instagram pink
        padding: 20,
        borderRadius: 15,
        fontWeight: 'bold'
      }
    }
  );
  console.log(`  📷 Instagram post created: ${instagram.outputPath}`);

  // Twitter/X Post
  const twitter = await processor.processImage(
    join(ASSETS_DIR, 'sample-2.jpg'),
    'Exciting news! 🚀 #MediaSDK',
    {
      outputName: 'twitter-post',
      position: { x: '50%', y: '70%', anchor: 'center' },
      style: {
        fontSize: 42,
        fontFamily: 'Arial',
        color: '#ffffff',
        backgroundColor: '#1DA1F2', // Twitter blue
        padding: 15,
        borderRadius: 10
      }
    }
  );
  console.log(`  🐦 Twitter post created: ${twitter.outputPath}`);

  // LinkedIn Post
  const linkedin = await processor.processImage(
    join(ASSETS_DIR, 'sample-3.jpg'),
    'Professional Update 💼',
    {
      outputName: 'linkedin-post',
      position: { x: '50%', y: '85%', anchor: 'center' },
      style: {
        fontSize: 40,
        fontFamily: 'Arial',
        color: '#ffffff',
        backgroundColor: '#0077B5', // LinkedIn blue
        padding: 18,
        borderRadius: 8
      }
    }
  );
  console.log(`  💼 LinkedIn post created: ${linkedin.outputPath}`);
}

/**
 * Example 6: Advanced Collection Operations
 */
async function advancedCollectionExample() {
  console.log('\n🔧 Example 6: Advanced Collection Operations');
  
  // Create collection from array
  const images = [
    {
      imagePath: join(ASSETS_DIR, 'sample-1.jpg'),
      caption: 'Product A - $99',
      style: { fontSize: 36, color: '#00ff00' }
    },
    {
      imagePath: join(ASSETS_DIR, 'sample-2.jpg'),
      caption: 'Product B - $149',
      style: { fontSize: 36, color: '#ff0000' }
    },
    {
      imagePath: join(ASSETS_DIR, 'sample-3.jpg'),
      caption: 'Product C - $199',
      style: { fontSize: 36, color: '#0000ff' }
    }
  ];

  const collection = createImageCollection(images, {
    outputDir: join(OUTPUT_DIR, 'products'),
    format: 'jpg',
    quality: 85
  });

  // Find specific product
  const expensiveProduct = await collection.find(img => 
    img.input.caption.includes('$199')
  );
  console.log(`  💰 Most expensive product: ${expensiveProduct?.input.caption}`);

  // Transform all images
  const productNames = await collection.map(img => {
    const match = img.input.caption.match(/Product (\w)/);
    return match ? match[1] : 'Unknown';
  });
  console.log(`  📦 Products: ${productNames.join(', ')}`);

  // Get collection statistics
  console.log(`  📊 Collection size: ${collection.size} images`);
  
  // Process and get array
  const allImages = await collection.toArray();
  console.log(`  ✅ Processed ${allImages.length} images`);
}

/**
 * Run all examples
 */
async function runAllExamples() {
  console.log('🎯 Media SDK Image Processing Examples\n');
  
  try {
    await singleImageExample();
    await batchProcessingExample();
    await imageCollectionExample();
    await slideshowToImagesExample();
    await socialMediaExample();
    await advancedCollectionExample();
    
    console.log('\n✨ All examples completed successfully!');
  } catch (error) {
    console.error('\n❌ Error running examples:', error);
  }
}

// Run if called directly
if (import.meta.main) {
  runAllExamples();
}

// Export for use in other scripts
export {
  singleImageExample,
  batchProcessingExample,
  imageCollectionExample,
  slideshowToImagesExample,
  socialMediaExample,
  advancedCollectionExample,
  runAllExamples
};